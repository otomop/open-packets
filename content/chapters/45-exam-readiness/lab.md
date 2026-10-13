---
title: Independent build, verification and fault diagnosis
environment: packet-tracer
devices: ["2 × ISR 4331 (R1, R2)", "1 × 2960 (SW1)", "2 × PC-PT (PC-A, PC-B)", "1 × Server-PT (SRV)"]
minutes: 120
---
Use the specification for an independent attempt, then compare with the reference configuration. The suggested 50-minute attempt plus 10-minute verification is a practice budget, not the length, content or scoring of an actual CCNA lab item. Allow additional time for reference review and the fault exercise. These instructions are documentation-reviewed; no simulator run is claimed.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks. The full exercise includes review and a later changed attempt; split it into sessions as needed. The closed reference panels are available after the first attempt, not part of its evidence.

## Topology

```diagram
{ "type": "topology", "title": "Self-check topology",
  "caption": "One access switch, a router-on-a-stick, a /30 to a second router, and a server LAN. This samples selected IPv4 skills; it does not cover the entire blueprint.",
  "nodes": [
    { "id": "PCA", "kind": "pc", "label": "PC-A", "sub": "VLAN 10 · DHCP", "x": 1, "y": 1 },
    { "id": "PCB", "kind": "pc", "label": "PC-B", "sub": "VLAN 20 · 10.220.20.10", "x": 1, "y": 5 },
    { "id": "SW1", "kind": "switch", "label": "SW1", "sub": "2960", "x": 4, "y": 3 },
    { "id": "R1", "kind": "router", "label": "R1", "sub": "1.1.1.1", "x": 7, "y": 3 },
    { "id": "R2", "kind": "router", "label": "R2", "sub": "2.2.2.2", "x": 10, "y": 3 },
    { "id": "SRV", "kind": "server", "label": "SRV", "sub": "10.220.30.10", "x": 12, "y": 5 }
  ],
  "links": [
    { "from": "PCA", "to": "SW1", "toLabel": "Fa0/1", "toBadge": "access 10" },
    { "from": "PCB", "to": "SW1", "toLabel": "Fa0/2", "toBadge": "access 20" },
    { "from": "SW1", "to": "R1", "fromLabel": "Gi0/1", "toLabel": "G0/0/0", "label": "trunk", "accent": true },
    { "from": "R1", "to": "R2", "fromLabel": "G0/0/1", "toLabel": "G0/0/0", "label": "10.255.12.0/30" },
    { "from": "R2", "to": "SRV", "fromLabel": "G0/0/1", "label": "10.220.30.0/24" }
  ] }
```

| Device / interface | Address | Notes |
|---|---|---|
| R1 G0/0/0.10 | `10.220.10.1/24` | VLAN 10 `USERS`; DHCP pool for this subnet, exclude `.1–.49` |
| R1 G0/0/0.20 | `10.220.20.1/24` | VLAN 20 `STAFF`; ACL `NO-WEB-V20` inbound |
| R1 G0/0/1 — R2 G0/0/0 | `10.255.12.1/30` — `10.255.12.2/30` | OSPF process 1, area 0, router IDs `1.1.1.1` / `2.2.2.2` |
| R2 G0/0/1 | `10.220.30.1/24` | Server LAN |
| SRV | `10.220.30.10/24`, gateway `.1` | HTTP service on (Services tab) |
| PC-A | DHCP | Record the actual available lease within `.50–.254` |
| PC-B | `10.220.20.10/24`, gateway `.1` | Static |

Cables: PC-A → SW1 Fa0/1 and PC-B → SW1 Fa0/2 straight-through; SW1 Gi0/1 → R1 G0/0/0 straight-through; R1 G0/0/1 → R2 G0/0/0 **crossover**; R2 G0/0/1 → SRV **crossover** (or use the lightning-bolt auto-connect tool).


**Specification:** Create VLANs 10 USERS and 20 STAFF. Assign the two PC ports as listed with PortFast, sticky port security, maximum one secure MAC, and shutdown violation mode. Permit VLANs 10 and 20 on the router trunk, using native VLAN 1 at the switch and no untagged IP network at R1. R1 routes both tagged /24s and serves VLAN 10 DHCP, excluding .1–.49. Both routers run OSPF process 1, area 0, the stated unique router IDs, and passive LAN interfaces; keep the Ethernet transit at the default broadcast network type on both ends. Advertise both client networks and the server network. R1 accepts SSHv2 with a local user, with VTY source access restricted to 10.220.10.0/24. The inbound NO-WEB-V20 ACL on R1's VLAN 20 subinterface denies TCP destination port 80 from that subnet to SRV, and permits other IPv4 traffic. Do not enable Telnet or add unrelated routing/NAT features.

Use fresh devices. For this isolated project only, the reference account is `admin` with secret `Readiness-Lab-45` and domain `readiness.test`. Keep the console available. The named network SERVICES here is only an HTTP lab server; no DNS result is required.

Read this specification independently of chapter 44. Here VLAN 10 USERS is the permitted management source, while VLAN 20 STAFF has the HTTP restriction; a VLAN's name or number does not grant privileges. Both transit interfaces use OSPF's broadcast type from chapter 21, so DR/BDR behavior differs from chapter 44's point-to-point choice. The ISR 4331 also uses different interface labels. These are changes to known inputs, not new configuration mechanisms; copying the earlier project would carry the wrong policy and assumptions into this attempt.

## Step 1 — Prepare the attempt

Place and cable the six devices from the tables. Set PC-B and SRV using Desktop → IP Configuration; enable Services → HTTP on SRV. Decline router setup dialogs. Save an untouched project as `readiness-start.pkt`, then Save As `readiness-attempt.pkt`. Write the intended addressing, policy direction and expected tests in your notebook. Start the timer only after cabling and the specification are clear. Do not read Steps 5–8 until the independent attempt is finished.

:::expected
The workspace and requirements are complete. Router links can remain down until their interfaces are enabled. You have not counted configuration performed while reading the reference as an independent result.
:::

```state
{"status":"Cabled · start file saved","focus":["PCB","SRV"],"wake":["PCA","PCB"],"cut":[["SW1","R1"],["R1","R2"],["R2","SRV"]],"chips":[{"node":"SRV","text":"HTTP On","tone":"ok"}],"rows":[["PC-B","10.220.20.10/24 · gateway .1"],["SRV","10.220.30.10/24 · HTTP On"],["Router links","May stay down until enabled","dim"],["Files","readiness-start · readiness-attempt"]]}
```

## Step 2 — Build from the specification

Work in an order you can verify: VLANs/access/trunk, gateway interfaces and DHCP, transit/server addressing, OSPF, SSH, then the HTTP ACL. Use IOS `?` if needed and record any external help. Name each device with `hostname`; icon labels alone do not change the CLI prompt. On PC-A select DHCP after R1 is ready and record its actual address. Stop the attempt at your chosen time limit, preserving unfinished work rather than copying the reference to improve the score.

:::expected
A completed build meets the written behavior; an incomplete build produces a precise list of remaining tasks. A lease can be any available candidate in 10.220.10.50–254. No score is earned merely for entering a command that was rejected.
:::

```state
{"status":"Attempt built from the spec","focus":["SW1","R1","R2"],"flows":[{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A requests a DHCP lease","tags":{"SW1":"VLAN 10 · tagged onto Gi0/1","R1":"VLAN 10 DHCP · excludes .1–.49"},"backTags":{"PCA":"Lease in .50–.254 · gw .1"}}],"chips":[{"node":"SW1","text":"SW1#"},{"node":"R1","text":"R1#"},{"node":"R2","text":"R2#"}],"rows":[["Build order","VLANs, DHCP, OSPF, SSH, then ACL"],["PC-A lease","Any free address in .50–.254"],["Time limit","Stop · keep unfinished work","dim"]]}
```

## Step 3 — Test the behavior before reading the solution

Run these checks, taking notes about their limits:

| Check | Required observation |
|---|---|
| SW1 VLAN/trunk output | Correct access membership; Gi0/1 operationally carries VLANs 10 and 20 |
| Port security on both host ports | Sticky configuration, maximum 1, intended violation mode and learned client after traffic |
| PC-A configuration and R1 binding | Correct /24, gateway 10.220.10.1 and available lease |
| OSPF on both routers | FULL relationship; R2 learns both client /24s and R1 learns the server /24 |
| PC-A to SRV | Ping and numeric-address HTTP succeed |
| PC-B to SRV | Ping succeeds; a new HTTP request fails and matches the deny |
| R1 SSH from PC-A | Fresh authenticated SSHv2 session succeeds |
| R1 SSH from PC-B | Rejected by the VTY source restriction |
| Telnet from PC-A | Not accepted |

Use `show spanning-tree interface fastethernet0/1 detail` on SW1, plus its running configuration, to inspect PortFast; do not depend on an `Edge` text filter that may show nothing on this image. Compare current counters before and after new probes.

:::expected
Allowed controls and denied probes agree with the policy. A blocked web test alone could be a stopped server, bad route or filter; the allowed test and specific counter provide the missing context. A neighbor at FULL does not replace verification of the required routes.
:::

```state
{"status":"Allowed and denied tests agree","tone":"ok","focus":["R1"],"flows":[{"path":["PCA","SW1","R1","R2","SRV"],"back":true,"label":"PC-A HTTP to 10.220.30.10","tags":{"SW1":"VLAN 10 · tagged onto Gi0/1","R1":"O 10.220.30.0/24 via 10.255.12.2"},"backTags":{"R2":"O 10.220.10.0/24 via 10.255.12.1"}},{"path":["PCB","SW1","R1","R2","SRV"],"back":true,"tone":"alt","label":"PC-B pings 10.220.30.10","tags":{"SW1":"VLAN 20 · tagged onto Gi0/1","R1":"NO-WEB-V20 permits ICMP"}},{"path":["PCB","SW1","R1"],"tone":"alt","label":"PC-B HTTP to 10.220.30.10","stop":"R1","stopText":"NO-WEB-V20 in · deny TCP 80"},{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A SSH to R1","tags":{"R1":"SSHv2 · VTY source permitted"}},{"path":["PCB","SW1","R1"],"tone":"alt","label":"PC-B SSH to R1","stop":"R1","stopText":"VTY source restriction rejects"}],"rows":[["OSPF","FULL · routes both directions","ok"],["PC-A → SRV","Ping and HTTP succeed","ok"],["PC-B → SRV","Ping succeeds · HTTP matches deny","ok"],["Telnet from PC-A","Not accepted","ok"]]}
```

## Step 4 — Record results and choose the revision task

Give one point per demonstrated check below, using your first-attempt state:

| # | Demonstrated result | # | Demonstrated result |
|---|---|---|---|
| 1 | Correct access VLAN on PC-A port | 9 | Transit addressed with /30 |
| 2 | Correct access VLAN on PC-B port | 10 | OSPF FULL on both routers |
| 3 | Required VLANs cross the trunk | 11 | Required routes in both directions |
| 4 | PortFast confirmed on both host ports | 12 | Host-facing OSPF interfaces passive |
| 5 | Port security configured and client learned | 13 | PC-A ping and HTTP succeed |
| 6 | Correct router subinterfaces up/up | 14 | PC-B ping works while HTTP is denied |
| 7 | DHCP pool/options/exclusions correct | 15 | USERS/PC-A SSH succeeds; STAFF/PC-B denied |
| 8 | Actual PC-A lease and gateway correct | 16 | Telnet not accepted on R1 |

Record elapsed time separately. Classify each miss as a concept, syntax, verification or platform-support issue. Compare with the reference only after preserving this record.

:::expected
The maximum is 16 local evidence points; it is not a Cisco score or a booking threshold. Unperformed and unsupported checks are marked as such, not passed. Select one concrete revision exercise for each missed skill.
:::

```state
{"status":"Attempt scored","rows":[["Score","One point per demonstrated check · max 16"],["Each miss","Concept, syntax, verification or platform"],["Unperformed checks","Marked as such, not passed","dim"],["Meaning","Local evidence, not a Cisco score","dim"]]}
```

## Step 5 — Compare the switch reference

The remaining reference steps are a learning review. Compare intent and evidence, not only line order. These blocks assume a fresh device or your compatible partial configuration; inspect differences before applying a line to an already configured port.

:::solution Switch reference — open after recording the attempt

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name USERS
SW1(config-vlan)# vlan 20
SW1(config-vlan)# name STAFF
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# spanning-tree portfast
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 1
SW1(config-if)# switchport port-security violation shutdown
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# interface fastethernet0/2
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 20
SW1(config-if)# spanning-tree portfast
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 1
SW1(config-if)# switchport port-security violation shutdown
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# interface gigabitethernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# end
SW1# show vlan brief
SW1# show interfaces trunk
```

The access ports and trunk meet the specification. Sticky learning needs client traffic. If an old sticky address from a different host exists, investigate and remove only that lab entry before deliberately recovering the port; do not treat an unrelated violation as a network-address problem.
:::

```state
{"status":"Switch reference compared","focus":["SW1"],"prompt":{"node":"SW1","text":"SW1#"},"chips":[{"node":"SW1","text":"Gi0/1 trunk · allowed 10,20"}],"rows":[["Fa0/1 · Fa0/2","Access 10 · access 20 · PortFast"],["Port security","Sticky · maximum 1 · shutdown"],["VLANs","10 USERS · 20 STAFF"],["Sticky MAC","Learned only after client traffic","dim"]]}
```

## Step 6 — Compare R1 gateways and DHCP

:::solution Gateway and DHCP reference
```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0/0
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet0/0/0.10
R1(config-subif)# encapsulation dot1q 10
R1(config-subif)# ip address 10.220.10.1 255.255.255.0
R1(config-subif)# interface gigabitethernet0/0/0.20
R1(config-subif)# encapsulation dot1q 20
R1(config-subif)# ip address 10.220.20.1 255.255.255.0
R1(config-subif)# exit
R1(config)# ip dhcp excluded-address 10.220.10.1 10.220.10.49
R1(config)# ip dhcp pool VLAN10
R1(dhcp-config)# network 10.220.10.0 255.255.255.0
R1(dhcp-config)# default-router 10.220.10.1
R1(dhcp-config)# end
R1# show ip interface brief
```

On PC-A select DHCP, then check `ipconfig /all` and R1's `show ip dhcp binding`. From each client ping its own gateway.

Both gateway subinterfaces have the correct tag/address and the parent is up. The pool permits 205 candidate addresses before leases/conflicts. Read the assigned address; no requirement forces .50 to be allocated first.
:::

```state
{"status":"Gateways and DHCP compared","tone":"ok","focus":["R1"],"flows":[{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A requests a DHCP lease","tags":{"SW1":"VLAN 10 · tagged onto Gi0/1","R1":"VLAN 10 DHCP · excludes .1–.49"},"backTags":{"PCA":"Lease in .50–.254 · gw .1"}},{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A pings 10.220.10.1","tags":{"R1":"G0/0/0.10 · dot1Q 10"}},{"path":["PCB","SW1","R1"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 10.220.20.1","tags":{"SW1":"VLAN 20 · tagged onto Gi0/1","R1":"G0/0/0.20 · dot1Q 20"}}],"prompt":{"node":"R1","text":"R1#"},"chips":[{"node":"PCA","text":"gw 10.220.10.1","tone":"ok","from":1}],"rows":[["G0/0/0.10","dot1Q 10 · 10.220.10.1/24","ok"],["G0/0/0.20","dot1Q 20 · 10.220.20.1/24","ok"],["VLAN 10 DHCP","Excludes .1–.49"],["PC-A lease","Any free address in .50–.254"]]}
```

## Step 7 — Compare the routed path

:::solution Routing reference
```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0/1
R1(config-if)# ip address 10.255.12.1 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.220.10.0 0.0.0.255 area 0
R1(config-router)# network 10.220.20.0 0.0.0.255 area 0
R1(config-router)# network 10.255.12.0 0.0.0.3 area 0
R1(config-router)# passive-interface gigabitethernet0/0/0.10
R1(config-router)# passive-interface gigabitethernet0/0/0.20
R1(config-router)# end
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0/0
R2(config-if)# ip address 10.255.12.2 255.255.255.252
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/0/1
R2(config-if)# ip address 10.220.30.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# router ospf 1
R2(config-router)# router-id 2.2.2.2
R2(config-router)# network 10.255.12.0 0.0.0.3 area 0
R2(config-router)# network 10.220.30.0 0.0.0.255 area 0
R2(config-router)# passive-interface gigabitethernet0/0/1
R2(config-router)# end
R2# show ip ospf neighbor
R2# show ip route ospf
```

Run `show ip route` on both routers. From each client test the server before the ACL is applied.

The default broadcast network type is consistent at both ends. With two routers, the established adjacency can display FULL/DR or FULL/BDR according to the actual election; either can be correct. Costs depend on configured interface/reference bandwidth. R2 needs return routes to both client prefixes, and SRV needs its correct gateway.
:::

```state
{"status":"Routed path compared","tone":"ok","focus":["R1","R2"],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"Neighbor 2.2.2.2 · FULL","R2":"Neighbor 1.1.1.1 · FULL"}},{"path":["PCA","SW1","R1","R2","SRV"],"back":true,"label":"PC-A tests 10.220.30.10","tags":{"R1":"O 10.220.30.0/24 via 10.255.12.2"},"backTags":{"R2":"O 10.220.10.0/24 via 10.255.12.1"}},{"path":["PCB","SW1","R1","R2","SRV"],"back":true,"tone":"alt","label":"PC-B tests 10.220.30.10","tags":{"R1":"No ACL applied yet"},"backTags":{"R2":"O 10.220.20.0/24 via 10.255.12.1"}}],"chips":[{"node":"R1","text":"passive G0/0/0.10 · .20"},{"node":"R2","text":"passive G0/0/1"}],"rows":[["Transit","10.255.12.1 – .2 /30 · broadcast"],["Adjacency","FULL on both routers","ok"],["R2 routes","Both client /24s via OSPF","ok"],["SRV gateway","10.220.30.1"]]}
```

## Step 8 — Compare SSH and the narrowly scoped HTTP policy

:::solution Management and HTTP policy reference
Configure the local SSH identity first:

```ios R1
R1# configure terminal
R1(config)# ip domain-name readiness.test
R1(config)# username admin privilege 15 secret Readiness-Lab-45
R1(config)# crypto key generate rsa
```

If prompted, enter **2048** for the modulus and wait. A release accepting `crypto key generate rsa modulus 2048` may use that equivalent. Keep an existing intended key rather than replacing it. Continue at global configuration:

```ios R1
R1(config)# ip ssh version 2
R1(config)# ip access-list standard MGMT-SOURCES
R1(config-std-nacl)# permit 10.220.10.0 0.0.0.255
R1(config-std-nacl)# exit
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# access-class MGMT-SOURCES in
R1(config-line)# exit
R1(config)# ip access-list extended NO-WEB-V20
R1(config-ext-nacl)# deny tcp 10.220.20.0 0.0.0.255 host 10.220.30.10 eq 80
R1(config-ext-nacl)# permit ip any any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/0/0.20
R1(config-subif)# ip access-group NO-WEB-V20 in
R1(config-subif)# end
R1# show ip ssh
R1# show running-config
R1# show access-lists
```

Inspect `show line` and apply the same login/transport/access-class settings to any additional VTY lines the image exposes. From PC-A run `ssh -l admin 10.220.10.1`, authenticate, verify the prompt and exit; from PC-B try `ssh -l admin 10.220.20.1`. Repeat Step 3's application tests.

PC-A can manage R1 and PC-B cannot. The interface ACL blocks only the specified TCP destination service; it does not block ICMP, HTTPS or every application someone might call “web.” Do not claim broader isolation than the configured policy. This PT exercise verifies login behavior; real SSH server-key verification is taught in Chapter 29.
:::

```state
{"status":"SSH and HTTP policy compared","tone":"ok","focus":["R1"],"flows":[{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A SSH to R1","tags":{"R1":"SSHv2 · VTY source permitted"}},{"path":["PCB","SW1","R1"],"tone":"alt","label":"PC-B SSH to R1","stop":"R1","stopText":"VTY source restriction rejects"},{"path":["PCB","SW1","R1"],"tone":"alt","label":"PC-B HTTP to 10.220.30.10","stop":"R1","stopText":"NO-WEB-V20 in · deny TCP 80"},{"path":["PCB","SW1","R1","R2","SRV"],"back":true,"tone":"alt","label":"PC-B pings 10.220.30.10","tags":{"R1":"NO-WEB-V20 permits ICMP"}}],"chips":[{"node":"R1","text":"SSHv2 · local user · no Telnet"}],"rows":[["PC-A → R1","SSH login succeeds","ok"],["PC-B → R1","Rejected by VTY source restriction","ok"],["NO-WEB-V20","In on G0/0/0.20 · TCP 80 only"],["PC-B ping to SRV","Still succeeds","ok"]]}
```

## Step 9 — Observe an incorrect DHCP gateway option

After the correct reference tests pass, save `readiness-verified.pkt`, then Save As `readiness-fault.pkt`. On R1 introduce one incorrect option:

Before making the change, predict whether PC-A will still reach an on-link address and whether its off-subnet HTTP request will work after renewal. Explain why an active DHCP binding could coexist with this fault.

```ios R1
R1# configure terminal
R1(config)# ip dhcp pool VLAN10
R1(dhcp-config)# no default-router 10.220.10.1
R1(dhcp-config)# default-router 10.220.10.2
R1(dhcp-config)# end
```

Renew PC-A's lease by release/renew or its IP Configuration GUI. Inspect the resulting gateway before testing a ping to `10.220.10.1` and HTTP to SRV. Confirm no device uses .2. Do not repair until you have recorded the new host parameters.

:::expected
PC-A retains a valid subnet address but receives the wrong gateway. It can reach the real on-link gateway address directly, while off-subnet access fails in this design. The DHCP server can successfully lease a wrong option; a binding does not certify usable client configuration.
:::

```state
{"status":"DHCP hands out gateway .2","tone":"bad","focus":["R1","PCA"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Pool VLAN10 · default-router .2"}},{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A renews its lease","tags":{"R1":"Leases with wrong gateway .2"},"backTags":{"PCA":"Same /24 · gateway 10.220.10.2"}},{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A pings 10.220.10.1","tags":{"PCA":"On-link · sent directly to .1"}},{"path":["PCA","SW1"],"label":"PC-A HTTP to 10.220.30.10","stop":"PCA","stopText":"Off subnet · no device uses .2"}],"chips":[{"node":"R1","text":"default-router .1","until":0},{"node":"R1","text":"default-router .2","tone":"bad","from":0},{"node":"PCA","text":"gw 10.220.10.1","until":2},{"node":"PCA","text":"gw 10.220.10.2","tone":"bad","from":2}],"rows":[["PC-A address","Valid address in the /24","ok"],["PC-A gateway","10.220.10.2 · no device uses it","bad"],["Ping 10.220.10.1","Replies · on-link","ok"],["HTTP to SRV","Fails · off subnet","bad"]]}
```

## Step 10 — Restore the correct option and retest

```ios R1
R1# configure terminal
R1(config)# ip dhcp pool VLAN10
R1(dhcp-config)# no default-router 10.220.10.2
R1(dhcp-config)# default-router 10.220.10.1
R1(dhcp-config)# end
```

Renew again and confirm the actual gateway is now .1. Repeat numeric HTTP, SSH and the PC-B restriction tests.

:::expected
Updating the pool is followed by a client option refresh. The original connectivity returns without changing OSPF or relaxing the ACL. The deliberately wrong .2 is inside the excluded DHCP range and is unassigned in this fresh topology.
:::

```state
{"status":"Gateway option restored","tone":"ok","focus":["R1","PCA"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Pool VLAN10 · default-router .1"}},{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A renews again","backTags":{"PCA":"Gateway 10.220.10.1 again"}},{"path":["PCA","SW1","R1","R2","SRV"],"back":true,"label":"PC-A HTTP to 10.220.30.10","tags":{"R1":"O 10.220.30.0/24 via 10.255.12.2"}},{"path":["PCB","SW1","R1"],"tone":"alt","label":"PC-B HTTP to 10.220.30.10","stop":"R1","stopText":"NO-WEB-V20 in · deny TCP 80"}],"chips":[{"node":"R1","text":"default-router .2","tone":"bad","until":0},{"node":"R1","text":"default-router .1","tone":"ok","from":0},{"node":"PCA","text":"gw 10.220.10.2","tone":"bad","until":2},{"node":"PCA","text":"gw 10.220.10.1","tone":"ok","from":2}],"rows":[["PC-A gateway","10.220.10.1","ok"],["PC-A HTTP · SSH","Succeed","ok"],["PC-B HTTP · SSH","Still denied","ok"],["OSPF · ACL","Unchanged"]]}
```

## Step 11 — Save the result and schedule a changed attempt

On SW1, R1 and R2, issue `copy running-config startup-config` one device at a time and accept its destination prompt. Save `readiness-repaired.pkt`. Keep the first-attempt score and later corrected result separate. Make the next attempt in a fresh project after a delay, using the changed challenge below. Do not erase the only verified copy.

:::expected
Your record shows the original gaps, the observed fault and the verified recovery. Successful completion covers this bounded topology; record independent evidence for the wireless, IPv6, automation and other objectives it omits.
:::

Reconcile the result with your selected blueprint. This build does not assess IPv6 routing/OSPFv3, EtherChannel failover, wireless GUI/security, DNS diagnosis, NAT, VPN interpretation, secure file transfer, device AAA server integration or automation/AI decisions. NTP, syslog, SNMP and QoS also need their own evidence where your track calls for them. Use the relevant earlier labs and the mixed checkpoint to find gaps; do not extrapolate these 16 local checks into whole-exam readiness.

```state
{"status":"Repaired build saved","tone":"ok","focus":["SW1","R1","R2"],"chips":[{"node":"SW1","text":"startup-config saved","tone":"ok"},{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"}],"rows":[["SW1 · R1 · R2","copy running-config startup-config","ok"],["File","readiness-repaired.pkt","ok"],["Scores","First attempt and repair kept apart"],["Next attempt","Fresh project · changed challenge"]]}
```

## Troubleshooting

- A 169.254 address or missing binding calls for tracing DHCP messages, VLAN reachability, pool capacity/options, relay requirements and filtering; it does not identify one cause by itself.
- No OSPF neighbor calls for both-side interface, subnet, area, timer and passive checks. A broader network wildcard is not inherently wrong if it enables the intended interface.
- EXSTART/EXCHANGE can result from an MTU problem, but verify advertised/configured values and the actual path before changing them. Do not apply mtu-ignore as a routine repair.
- A failed HTTP page with successful ping requires service and TCP/policy checks. Correlate the correct ACL line with a fresh request.
- A port-security violation can result from a different learned client. Inspect the exact secure entry before clearing or restarting anything.

## Challenge

Build a fresh variation with VLAN 30 as USERS (`172.20.30.0/24`) and VLAN 40 as STAFF (`172.20.40.0/24`). Keep the transit and server network unchanged. Give USERS DHCP .50–.254, restrict R1 SSH to USERS, and now deny **ICMP echo requests** from STAFF to SRV while allowing its HTTP. Write the expected opposite results for ping and HTTP before building.

:::solution Compare the changed attempt after testing
Update switch VLANs/access assignments/trunk allowance, R1 subinterface tags and addresses, DHCP pool/exclusions/options, both advertised client networks, and MGMT-SOURCES. Replace the HTTP deny with `deny icmp 172.20.40.0 0.0.0.255 host 10.220.30.10 echo`, followed by `permit ip any any`, attached inbound on the VLAN 40 subinterface. STAFF ping fails while its new HTTP request succeeds; USERS can reach SRV and manage R1. The changed protocols and directions must be verified, not inferred from the earlier score.

The fresh-project policy can use this complete list and attachment:

```ios R1
R1# configure terminal
R1(config)# ip access-list extended STAFF-IN
R1(config-ext-nacl)# 10 deny icmp 172.20.40.0 0.0.0.255 host 10.220.30.10 echo
R1(config-ext-nacl)# 20 permit ip any any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/0/0.40
R1(config-subif)# ip access-group STAFF-IN in
R1(config-subif)# end
R1# show ip interface gigabitethernet0/0/0.40
R1# show access-lists STAFF-IN
```

Use the new client addresses for all probes. Record both route directions, the actual DHCP options, a successful USERS SSH login, a denied STAFF login, STAFF HTTP success and its echo-request denial. If a test fails, preserve the evidence before comparing configuration. An unused old ACL name is not proof the correct list is attached to the new interface.
:::
