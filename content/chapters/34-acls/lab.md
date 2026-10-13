---
title: Build and verify an IPv4 access policy in both directions
environment: packet-tracer
devices: ["1 × Cisco 2911 router (R1)", "2 × Catalyst 2960 switches (SW1, SW2)", "2 × PC-PT (PC-A, PC-B)", "2 × Server-PT (WEB, FILES)"]
minutes: 85
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use a new Packet Tracer file and devices with default configurations. You will establish connectivity before filtering, compare standard and extended lists, insert an exception, restrict management, and diagnose a missing return rule. Work through R1's local CLI tab so a management restriction cannot disconnect your configuration session.

All output below is representative teaching evidence, not a capture from an executed simulator. Exact port aliases, counters and failure messages vary. If output filters such as `| section` are unavailable, read the full running configuration. Sequence editing and resequencing vary by image; a complete replacement-list fallback is provided. The finished lab demonstrates a limited policy, not a stateful firewall.

## Topology

```diagram
{ "type": "topology", "title": "Two LANs separated by R1", "caption": "Every client-to-server request crosses R1. Return traffic enters the opposite interface.", "nodes": [ { "id": "A", "kind": "pc", "label": "PC-A", "sub": "10.100.10.10", "x": 1, "y": 1 }, { "id": "B", "kind": "pc", "label": "PC-B", "sub": "10.100.10.11", "x": 1, "y": 5 }, { "id": "S1", "kind": "switch", "label": "SW1", "x": 3, "y": 3 }, { "id": "R", "kind": "router", "label": "R1", "sub": ".1 in each /24", "x": 6, "y": 3 }, { "id": "S2", "kind": "switch", "label": "SW2", "x": 9, "y": 3 }, { "id": "W", "kind": "server", "label": "WEB", "sub": "10.100.20.20", "x": 11, "y": 1 }, { "id": "F", "kind": "server", "label": "FILES", "sub": "10.100.20.30", "x": 11, "y": 5 } ], "links": [ { "from": "A", "to": "S1", "toLabel": "Fa0/1" }, { "from": "B", "to": "S1", "toLabel": "Fa0/2" }, { "from": "S1", "to": "R", "fromLabel": "Gi0/1", "toLabel": "G0/0" }, { "from": "R", "to": "S2", "fromLabel": "G0/1", "toLabel": "Gi0/1" }, { "from": "S2", "to": "W", "fromLabel": "Fa0/1" }, { "from": "S2", "to": "F", "fromLabel": "Fa0/2" } ] }
```

Use copper straight-through for all six links. The switches' default VLAN 1 access ports are sufficient; they need no management IP address.

| Endpoint | Port | Connected port | IPv4 address / mask | Default gateway |
|---|---|---|---|---|
| R1 | G0/0 | SW1 Gi0/1 | `10.100.10.1 / 255.255.255.0` | None |
| R1 | G0/1 | SW2 Gi0/1 | `10.100.20.1 / 255.255.255.0` | None |
| PC-A | FastEthernet0 | SW1 Fa0/1 | `10.100.10.10 / 255.255.255.0` | `10.100.10.1` |
| PC-B | FastEthernet0 | SW1 Fa0/2 | `10.100.10.11 / 255.255.255.0` | `10.100.10.1` |
| WEB | FastEthernet0 | SW2 Fa0/1 | `10.100.20.20 / 255.255.255.0` | `10.100.20.1` |
| FILES | FastEthernet0 | SW2 Fa0/2 | `10.100.20.30 / 255.255.255.0` | `10.100.20.1` |

## Step 1: Address the devices and establish a working baseline

Before configuring, sketch the request and reply across R1: record each ingress/egress interface, original source/destination IP, and the server/client port roles for HTTP. This is supplied addressing setup; the assessed work starts with predicting and enforcing the policies.

Set every PC/server address under Desktop → IP Configuration → Static. On WEB, choose Services → HTTP and explicitly turn HTTP On. FILES is an addressable test host; no file-transfer or SSH server is required.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.100.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.100.20.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show ip route
```

From both PCs, ping `10.100.20.20` and `10.100.20.30`. From PC-A only, open Desktop → Web Browser and load `http://10.100.20.20`. Leave PC-B's browser unused until the deliberate fault in Step 7. Wait for links and initial ARP resolution before repeating an initially unsuccessful ping.

:::expected
Both routed interfaces are up/up. R1 has connected routes for both /24 LANs; no static route is needed. Both PCs reach both servers, and PC-A loads WEB over HTTP. Correct any baseline failure now. An ACL cannot fix a wrong host gateway or a stopped HTTP service.
:::

```state
{"status":"Baseline works","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["R"],"flows":[{"path":["A","S1","R","S2","W"],"back":true,"label":"PC-A pings 10.100.20.20","tags":{"A":"Off subnet → gateway 10.100.10.1","R":"In G0/0 → out G0/1 · connected"},"backTags":{"R":"Reply in G0/1 → out G0/0"}},{"path":["B","S1","R","S2","F"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 10.100.20.30"},{"path":["A","S1","R","S2","W"],"back":true,"label":"PC-A loads http://10.100.20.20","backTags":{"A":"Page loads"}}],"chips":[{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["R1 G0/0 and G0/1","up/up · two connected /24s","ok"],["Static route","None needed"],["Both PCs → both servers","Pings succeed","ok"],["PC-A → http://10.100.20.20","Page loads","ok"]]}
```

## Step 2: Permit one source with a standard ACL

Allow only PC-A toward the entire server LAN. Before entering the supplied reference, choose standard or extended matching and predict the results for both PCs reaching both servers. Explain why an inbound source-only deny on G0/0 would affect more destinations. The intended attachment here is outbound on the destination-facing interface.

Keep a test record with columns **stage, source, destination/service, predicted first match, observed result, and counter delta**. Record every required permit as well as every required denial. A failed service without packet-path evidence is not automatically an ACL success.

```ios R1
R1# configure terminal
R1(config)# access-list 10 permit host 10.100.10.10
R1(config)# access-list 10 deny any
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip access-group 10 out
R1(config-if)# end
R1# show access-lists 10
R1# show ip interface gigabitethernet0/1
```

Record the displayed permit and deny counters. Repeat pings to both servers from both PCs, then read the counters again.

:::expected
PC-A still reaches both servers. PC-B reaches neither. The explicit deny gives a visible entry for rejected requests on images that report counters. A timeout or unreachable response is possible; neither exact wording nor exactly four matches is required. The outgoing list on G0/1 is 10. This placement restricts the whole server LAN, not an individual server.
:::

```state
{"status":"ACL 10 out on G0/1","tone":"ok","focus":["R"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"ip access-group 10 out · G0/1"}},{"path":["A","S1","R","S2","W"],"back":true,"label":"PC-A pings 10.100.20.20","tags":{"R":"ACL 10 permits host 10.100.10.10"}},{"path":["B","S1","R","S2"],"label":"PC-B pings 10.100.20.30","stop":"R","stopText":"ACL 10 out · deny any"}],"roles":[{"node":"R","peer":"S2","text":"ACL 10 out","tone":"ok","from":0}],"chips":[{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["PC-A → both servers","Replies","ok"],["PC-B → both servers","Denied by deny any"],["G0/1 outgoing list","10 · whole server LAN"]]}
```

## Step 3: Apply a service-specific extended policy

The new requirement allows both clients to use HTTP on WEB, denies their other traffic to WEB, and permits other destinations. First draft the three ordered entries yourself. Complete this packet worksheet before comparing your work with the reference. All requests arrive on G0/0.

| Packet | First matching rule/action to predict |
|---|---|
| PC-A TCP source 51000 → WEB TCP destination 80 | Record the matching protocol, addresses and service port |
| PC-A ICMP echo → WEB | Explain which earlier condition fails |
| PC-B ICMP echo → FILES | Explain why the WEB exception does not apply |
| WEB TCP source 80 → PC-A destination 51000 | State whether this G0/0 inbound attachment is traversed |

Build CLIENTS-IN completely, attach it inbound on the client interface, then remove the old standard attachment. Until removal, the old source-only rule is temporarily more restrictive; there is no interval with neither policy attached. The following is a guided reference, not evidence that you independently wrote the policy.

:::solution Compare the ordered policy

```ios R1
R1# configure terminal
R1(config)# ip access-list extended CLIENTS-IN
R1(config-ext-nacl)# 10 permit tcp 10.100.10.0 0.0.0.255 host 10.100.20.20 eq 80
R1(config-ext-nacl)# 20 deny ip 10.100.10.0 0.0.0.255 host 10.100.20.20
R1(config-ext-nacl)# 30 permit ip any any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip access-group CLIENTS-IN in
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# no ip access-group 10 out
R1(config-if)# end
R1# show access-lists CLIENTS-IN
R1# show ip interface gigabitethernet0/0
R1# show ip interface gigabitethernet0/1
```

:::

If the image rejects explicit entry numbers, enter the three ACEs without them in the displayed order, then inspect their assigned numbers. For the following exercise use the complete replacement fallback if insertion is also unavailable.

From PC-A, reload HTTP on WEB, ping WEB, and ping FILES. From PC-B, ping FILES. Predict the first matching entry before each test.

:::solution Check the packet worksheet after attempting it
TCP/80 to WEB matches permit 10; ICMP echo to WEB misses the TCP entry and matches deny 20; the packet to FILES reaches permit 30. The reply enters G0/1 and leaves G0/0, so it does not traverse CLIENTS-IN inbound.

HTTP to WEB and pings to FILES succeed. Ping to WEB fails because it matches deny 20. R1 shows CLIENTS-IN inbound on G0/0 and no outbound ACL on G0/1. No server reply crosses CLIENTS-IN in its applied direction.
:::

```state
{"status":"CLIENTS-IN in on G0/0","focus":["R"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"CLIENTS-IN in G0/0 · ACL 10 detached"}}],"roles":[{"node":"R","peer":"S2","text":"ACL 10 out","tone":"ok","until":0},{"node":"R","peer":"S1","text":"CLIENTS-IN in","tone":"ok","from":0}],"chips":[{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["CLIENTS-IN","Inbound on G0/0 · client side"],["ACL 10","Detached from G0/1 outbound"],["Clients to WEB","HTTP only · other traffic denied"],["Other destinations","Permitted"]]}
```

## Step 4: Add an exception and inspect the order

PC-A must be allowed to ping WEB; PC-B must still be denied. Before entering the reference, write the protocol, exact source/destination, ICMP message and insertion position. Predict what would happen if you appended the exception after deny 20. Then insert it before that deny.

```ios R1
R1# configure terminal
R1(config)# ip access-list extended CLIENTS-IN
R1(config-ext-nacl)# 15 permit icmp host 10.100.10.10 host 10.100.20.20 echo
R1(config-ext-nacl)# end
R1# show access-lists CLIENTS-IN
```

If insertion is unsupported, build CLIENTS-V2 without sequence numbers, in order: the HTTP permit, the PC-A echo permit, the deny to WEB, and the final permit. The following is the complete fallback; use it only instead of insertion, and use CLIENTS-V2 wherever later instructions refer to the active client list.

```ios R1
R1# configure terminal
R1(config)# ip access-list extended CLIENTS-V2
R1(config-ext-nacl)# permit tcp 10.100.10.0 0.0.0.255 host 10.100.20.20 eq 80
R1(config-ext-nacl)# permit icmp host 10.100.10.10 host 10.100.20.20 echo
R1(config-ext-nacl)# deny ip 10.100.10.0 0.0.0.255 host 10.100.20.20
R1(config-ext-nacl)# permit ip any any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip access-group CLIENTS-V2 in
R1(config-if)# end
```

Ping WEB from each PC. On supported IOS, optionally run `ip access-list resequence CLIENTS-IN 100 10` in global configuration and inspect the resulting sequence order. It changes numbering, not the intended policy. If rejected, keep the existing numbers; subsequent steps do not depend on them. Do not assume resequencing preserves counter values on every image.

:::expected
PC-A's echo matches its exception before the deny and succeeds. PC-B's echo still reaches the deny. The HTTP policy is unchanged. An exception below the deny would have no effect.
:::

```state
{"status":"Exception 15 before deny 20","tone":"ok","focus":["R"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"Insert 15 before deny 20"}},{"path":["A","S1","R","S2","W"],"back":true,"label":"PC-A pings WEB","tags":{"R":"Permit 15 · echo from host .10"}},{"path":["B","S1","R"],"label":"PC-B pings WEB","stop":"R","stopText":"Misses 15 · deny 20"}],"roles":[{"node":"R","peer":"S1","text":"CLIENTS-IN in","tone":"ok"}],"chips":[{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["PC-A echo to WEB","Permit 15 · succeeds","ok"],["PC-B echo to WEB","Still deny 20"],["HTTP policy","Unchanged","ok"],["Exception below deny 20","Would have no effect"]]}
```

## Step 5: Filter return traffic and recognize the limit of established

Before applying this limited inbound filter on G0/1, classify three packets on paper: WEB → PC-A TCP SYN-ACK, WEB → PC-A ICMP echo-reply, and WEB → PC-A ICMP echo request. Add a fourth invented TCP ACK that has no prior client session. Predict each first match before testing.

Apply this filter on G0/1. It allows TCP segments with ACK or RST set and ICMP echo replies from the server LAN to the client LAN. It blocks other server-to-client packets. It does not verify whether clients really initiated those packets.

```ios R1
R1# configure terminal
R1(config)# ip access-list extended SERVERS-IN
R1(config-ext-nacl)# 10 permit tcp 10.100.20.0 0.0.0.255 10.100.10.0 0.0.0.255 established
R1(config-ext-nacl)# 20 permit icmp 10.100.20.0 0.0.0.255 10.100.10.0 0.0.0.255 echo-reply
R1(config-ext-nacl)# 30 deny ip any any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip access-group SERVERS-IN in
R1(config-if)# end
R1# show access-lists SERVERS-IN
```

If explicit sequence syntax was unavailable earlier, omit the numbers here and inspect the assigned numbers. From PC-A, test HTTP and ping to WEB again. From WEB's Desktop → Command Prompt, ping `10.100.10.10`. Then explain the result for an invented TCP packet from WEB to PC-A with ACK set, even though no matching client connection exists.

:::solution Compare the return-packet predictions
PC-A's HTTP responses and echo replies are permitted. WEB's own echo requests are denied. The invented ACK packet would match the TCP permit: that is the important limitation. The observed application behavior is consistent with normal replies, but the ACL has no connection table.
:::

```state
{"status":"SERVERS-IN in on G0/1","focus":["R"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"ip access-group SERVERS-IN in · G0/1"}}],"roles":[{"node":"R","peer":"S1","text":"CLIENTS-IN in","tone":"ok"},{"node":"R","peer":"S2","text":"SERVERS-IN in","tone":"ok","from":0}],"chips":[{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["SERVERS-IN","Inbound on G0/1 · server side"],["Entries","10 TCP established · 20 echo-reply · 30 deny"],["Packets to classify","SYN-ACK, echo-reply, echo, ACK with no session"]]}
```

## Step 6: Restrict incoming SSH management to PC-A

Create the SSH service first. These credentials are for this isolated exercise. Use the local CLI tab throughout. When the RSA command asks for a modulus, enter `2048`, then continue with the next block. If your image cannot create that key, complete the VTY policy as a configuration review and use a supported IOS image for live SSH; do not silently substitute an insecure production setting.

```ios R1
R1# configure terminal
R1(config)# ip domain-name ccna.test
R1(config)# username labadmin secret LabAdmin34!
R1(config)# crypto key generate rsa
```

```ios R1
R1(config)# ip ssh version 2
R1(config)# ip access-list standard VTY-ADMINS
R1(config-std-nacl)# permit host 10.100.10.10
R1(config-std-nacl)# exit
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# access-class VTY-ADMINS in
R1(config-line)# end
R1# show line
R1# show running-config
R1# show ip ssh
```

The 0–4 range is the baseline used here. If the running configuration also has `line vty 5 15`, enter that range and apply the same three line commands; every available VTY must have the restriction. Without the output filter, inspect the full configuration directly.

From PC-A, run `ssh -l labadmin 10.100.10.1`, enter `LabAdmin34!`, then `exit`. Repeat from PC-B. Also repeat PC-B's ping to FILES to distinguish management control from transit filtering.

:::expected
PC-A can authenticate to R1. PC-B cannot open an allowed SSH management session, but its ping to FILES still works. The client interface ACL permits traffic addressed to R1 through its final permit; the VTY access class supplies the source restriction. Exact refusal wording and VTY ACL counter totals are not required evidence.
:::

```state
{"status":"SSH limited to PC-A","tone":"ok","focus":["R"],"flows":[{"path":["A","S1","R"],"label":"ssh -l labadmin 10.100.10.1","tags":{"R":"Permitted by CLIENTS-IN and VTY-ADMINS"}},{"path":["R","S1","A"],"tone":"reply","label":"SSH session to R1","tags":{"A":"Authenticates to R1"}},{"path":["B","S1","R"],"label":"PC-B ssh 10.100.10.1","stop":"R","stopText":"VTY-ADMINS refuses PC-B"},{"path":["B","S1","R","S2","F"],"back":true,"label":"PC-B pings FILES","tags":{"R":"Transit · CLIENTS-IN final permit"}}],"roles":[{"node":"R","peer":"S1","text":"CLIENTS-IN in","tone":"ok"},{"node":"R","peer":"S2","text":"SERVERS-IN in","tone":"ok"}],"chips":[{"node":"R","text":"SSH · VTY-ADMINS","tone":"ok"},{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["PC-A SSH to 10.100.10.1","Authenticates","ok"],["PC-B SSH","No session · VTY-ADMINS"],["PC-B ping FILES","Still works","ok"],["Every VTY range","Same three line commands"]]}
```

## Step 7: Introduce a missing return rule and observe the failure

Predict which previously permitted service will fail and which PC-A test should continue working. Then remove only the TCP permit from SERVERS-IN. Use the sequence displayed for that permit; it is 10 in the explicit configuration above.

```ios R1
R1# configure terminal
R1(config)# ip access-list extended SERVERS-IN
R1(config-ext-nacl)# no 10
R1(config-ext-nacl)# end
R1# show access-lists SERVERS-IN
```

If sequence deletion is unsupported, remove the exact permit with `no permit tcp 10.100.20.0 0.0.0.255 10.100.10.0 0.0.0.255 established` inside the named ACL and verify the result. Now open PC-B's browser for the first time and request `http://10.100.20.20`. From PC-A, ping WEB. Read both ACLs before making a repair. In Simulation mode, include TCP/HTTP if needed to confirm that a fresh HTTP connection was attempted rather than relying on a cached page.

:::expected
The HTTP request is allowed into R1 by the client list, but WEB's TCP response reaches the explicit deny in SERVERS-IN. The connection fails. PC-A's ICMP ping still succeeds because echo-reply remains permitted. A working ping therefore does not prove the web application's return traffic is allowed. Stop and record this fault state before Step 8.
:::

```state
{"status":"HTTP return denied","tone":"bad","focus":["R"],"flows":[{"event":["R"],"wait":1.2},{"path":["B","S1","R","S2","W"],"label":"PC-B requests http://10.100.20.20","tags":{"R":"Allowed in by CLIENTS-IN"}},{"path":["W","S2","R"],"tone":"reply","label":"WEB's TCP response","stop":"R","stopText":"SERVERS-IN deny 30 · TCP reply"},{"path":["A","S1","R","S2","W"],"back":true,"label":"PC-A pings WEB","backTags":{"R":"SERVERS-IN 20 · echo-reply"}}],"roles":[{"node":"R","peer":"S1","text":"CLIENTS-IN in","tone":"ok"},{"node":"R","peer":"S2","text":"SERVERS-IN in","tone":"ok"}],"chips":[{"node":"R","text":"SERVERS-IN · no TCP permit","tone":"bad","from":0},{"node":"R","text":"SSH · VTY-ADMINS","tone":"ok"},{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["PC-B HTTP to WEB","Fails · reply denied","bad"],["PC-A ping WEB","Still succeeds","ok"],["A working ping","Does not prove TCP returns"]]}
```

## Step 8: Restore the rule, retest and save

On an image supporting sequence insertion, restore the missing permit before the deny:

```ios R1
R1# configure terminal
R1(config)# ip access-list extended SERVERS-IN
R1(config-ext-nacl)# 10 permit tcp 10.100.20.0 0.0.0.255 10.100.10.0 0.0.0.255 established
R1(config-ext-nacl)# end
```

If insertion is unsupported, create SERVERS-V2 with the TCP permit, echo-reply permit and deny in that order, then replace the G0/1 inbound attachment. Do not append the restored permit below the existing deny.

```ios R1
R1# configure terminal
R1(config)# ip access-list extended SERVERS-V2
R1(config-ext-nacl)# permit tcp 10.100.20.0 0.0.0.255 10.100.10.0 0.0.0.255 established
R1(config-ext-nacl)# permit icmp 10.100.20.0 0.0.0.255 10.100.10.0 0.0.0.255 echo-reply
R1(config-ext-nacl)# deny ip any any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip access-group SERVERS-V2 in
R1(config-if)# end
```

Use only the recovery appropriate to your image. Retry PC-B's HTTP request, both PCs' pings to FILES, PC-A's ping to WEB, and PC-B's ping to WEB. Repeat fresh SSH from PC-A and a denied attempt from PC-B. Confirm both interface attachments and every VTY range, then save:

```ios R1
R1# show ip interface gigabitethernet0/0
R1# show ip interface gigabitethernet0/1
R1# show access-lists
R1# copy running-config startup-config
```

:::expected
HTTP works again. Both clients reach FILES. PC-A can ping WEB; PC-B cannot. The SSH restriction remains in place. Press Enter to accept the startup-config filename, then save the Packet Tracer file as `acl-baseline.pkt`. Unattached demonstration ACLs do not filter traffic; document which names are active rather than assuming all displayed lists are applied.
:::

### Evidence to keep

- Your preconfiguration packet worksheet and first-match predictions, including the reversed HTTP endpoints.
- Definition and attachment evidence for the active standard/extended stages; unsupported counters or syntax explicitly noted.
- Successful required services and required denials from the actual clients, including fresh SSH sessions.
- Separate observations of the missing TCP return rule and its recovery; ping success is not the HTTP result.
- Saved startup configuration and project, plus the independent challenge policy and test record.

```state
{"status":"Policy restored and saved","tone":"ok","focus":["R"],"flows":[{"event":["R"],"wait":1.2},{"path":["B","S1","R","S2","W"],"back":true,"label":"PC-B retries http://10.100.20.20","tags":{"R":"Allowed in by CLIENTS-IN"},"backTags":{"R":"SERVERS-IN 10 · established"}},{"path":["B","S1","R"],"label":"PC-B pings WEB","stop":"R","stopText":"Reaches the CLIENTS-IN deny"}],"roles":[{"node":"R","peer":"S1","text":"CLIENTS-IN in","tone":"ok"},{"node":"R","peer":"S2","text":"SERVERS-IN in","tone":"ok"}],"chips":[{"node":"R","text":"SERVERS-IN · no TCP permit","tone":"bad","until":0},{"node":"R","text":"SSH · VTY-ADMINS","tone":"ok"},{"node":"W","text":"HTTP On","tone":"ok"}],"rows":[["PC-B HTTP to WEB","Works again","ok"],["Ping WEB","PC-A can · PC-B cannot"],["SSH restriction","PC-A only · still in place","ok"],["Saved","startup-config · acl-baseline.pkt","ok"]]}
```

## Troubleshooting

- If both PCs fail before filtering, verify full addresses, /24 masks, gateways, cabling and R1's up/up interfaces. Repeat after ARP resolution.
- If PC-B loses FILES after Step 3, check whether ACL 10 is still attached outbound on G0/1. A second filter can deny a packet the first one permitted.
- If HTTP never matches its permit, inspect whether port 80 follows the destination and whether the server HTTP service is On.
- If an exception has no effect, locate the first matching entry. An earlier deny can prevent a later permit from being considered.
- If an ACL counter does not change, check its attachment, direction, the actual packet fields, and earlier rules. Counters alone do not prove the route or application is healthy.
- If SSH fails for PC-A, confirm SSH is enabled, local authentication is configured, the username is correct, the VTY source matches, and the interface list permits traffic to R1.
- If a command is unsupported, use the stated replacement-list or paper fallback. Do not erase the live ACL in an attempt to reproduce a screenshot.

## Challenge

Build a **new** project with the same device models and six-link physical port table, using these fresh addresses. Add one Server-PT DNS connected by straight-through cable from Fa0 to SW2 Fa0/3. The switch ports remain default access VLAN 1. Work from these requirements before opening the answer.

| Role | IPv4 address/mask | Gateway or service |
|---|---|---|
| R1 G0/0 | 10.34.16.1 / 255.255.255.224 | Client /27 |
| PC-A, PC-B | 10.34.16.10 and 10.34.16.11 / 255.255.255.224 | Gateway 10.34.16.1; DNS 10.34.20.53 |
| R1 G0/1 | 10.34.20.1 / 255.255.255.0 | Server /24 |
| WEB | 10.34.20.20 / 255.255.255.0 | Gateway 10.34.20.1; HTTP On |
| FILES | 10.34.20.30 / 255.255.255.0 | Gateway 10.34.20.1; HTTP On for this challenge |
| DNS | 10.34.20.53 / 255.255.255.0 | Gateway 10.34.20.1; DNS On |

Set the PC/server addresses in Desktop → IP Configuration. On DNS create A records `web.challenge.test` → 10.34.20.20 and `files.challenge.test` → 10.34.20.30. The name FILES is a role label; this challenge uses its HTTP service and does not assume a Packet Tracer SSH server. No Internet, NAT, static route or remote management setup is needed.

Write and apply complete named extended lists with these requirements:

1. Both clients may use HTTP on WEB and query DNS with UDP or TCP destination port 53.
2. Only PC-A may use HTTP on FILES. All other traffic from the client /27 to the server /24 is denied. Other client destinations remain permitted.
3. At the server-facing inbound boundary, permit the described HTTP replies from WEB/FILES and DNS replies from DNS; deny other server-side traffic. Use source service ports, and the taught ACK/RST test for TCP. Explain why this is still not session tracking.

Before applying filters, establish the new HTTP-by-address baseline from both PCs to both web services. Calculate the /27 wildcard and predict at least eight flows: both clients to WEB HTTP, both to FILES HTTP, UDP and TCP DNS, client ICMP to a server, and a server-initiated initial TCP SYN toward a client. After attachment, test fresh named HTTP from both PCs, an allowed and a denied destination, and a server-originated ping. Record the first match and actual result. Use a closed/reopened browser or Simulation evidence to avoid treating cached content as a new transaction. If TCP DNS is unsupported in the simulator, evaluate its request/reply tuples on paper and label that row unexecuted.

:::solution One complete policy and verification key
The /27 uses wildcard `0.0.0.31`. On R1, configure the supplied interfaces first; perform the unfiltered baseline tests before adding the lists below.

```ios R1 — supplied addressing setup
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.34.16.1 255.255.255.224
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.34.20.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show ip route
```

```ios R1 — complete policy
R1# configure terminal
R1(config)# ip access-list extended CLIENTS-CHALLENGE
R1(config-ext-nacl)# permit tcp 10.34.16.0 0.0.0.31 host 10.34.20.20 eq 80
R1(config-ext-nacl)# permit tcp host 10.34.16.10 host 10.34.20.30 eq 80
R1(config-ext-nacl)# permit udp 10.34.16.0 0.0.0.31 host 10.34.20.53 eq 53
R1(config-ext-nacl)# permit tcp 10.34.16.0 0.0.0.31 host 10.34.20.53 eq 53
R1(config-ext-nacl)# deny ip 10.34.16.0 0.0.0.31 10.34.20.0 0.0.0.255
R1(config-ext-nacl)# permit ip any any
R1(config-ext-nacl)# exit
R1(config)# ip access-list extended SERVERS-CHALLENGE
R1(config-ext-nacl)# permit tcp host 10.34.20.20 eq 80 10.34.16.0 0.0.0.31 established
R1(config-ext-nacl)# permit tcp host 10.34.20.30 eq 80 10.34.16.0 0.0.0.31 established
R1(config-ext-nacl)# permit udp host 10.34.20.53 eq 53 10.34.16.0 0.0.0.31
R1(config-ext-nacl)# permit tcp host 10.34.20.53 eq 53 10.34.16.0 0.0.0.31 established
R1(config-ext-nacl)# deny ip any any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip access-group CLIENTS-CHALLENGE in
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip access-group SERVERS-CHALLENGE in
R1(config-if)# end
R1# show access-lists
R1# show ip interface gigabitethernet0/0
R1# show ip interface gigabitethernet0/1
```

Both clients can resolve and open `http://web.challenge.test`. Only PC-A can open `http://files.challenge.test`; PC-B may resolve that name successfully while its HTTP connection is denied. Client ICMP to a server reaches the client-side deny. A server-originated ping or initial TCP SYN to a client reaches the server-side deny. A TCP ACK with the allowed source port can still pass without a remembered session; a UDP packet from DNS source port 53 can pass without a remembered query.

A router permit or one counter increment is not an application result. Retain the named-page observations and denied-flow evidence together with both attachments. Save R1 with `copy running-config startup-config`, accept its destination filename, and save the new project as `acl-independent.pkt`. Keep the original guided baseline separately.
:::
