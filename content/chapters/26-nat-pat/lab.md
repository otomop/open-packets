---
title: Compare three NAT modes and repair their forwarding paths
environment: mixed
devices: ["2 × ISR 4331 routers (EDGE, ISP)", "1 × Catalyst 2960 (SW1)", "3 × PC (PC-A, PC-B, PC-C)", "1 × Server-PT (WEB)"]
minutes: 90
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build this as a new isolated Packet Tracer project. Use new, unconfigured devices; open their console CLI tabs and answer no if the initial configuration dialog appears. You will use static NAT, a two-address dynamic pool, interface overload and pool overload, then investigate a wrong source selector. The 4331 interface names also prepare you to read IOS XE configurations. Outputs below are representative; Packet Tracer is a simulator, not a current IOS XE execution environment. Use a supporting IOS XE lab image with equivalent interfaces if a core NAT form is unavailable, or complete that mode's table worksheet from the supplied expected observations. Do not claim a simulated feature passed when the image rejects it.

## Topology

Use the Packet Tracer automatic connection tool for the router–router and router–server links if cable selection is uncertain. All addresses are confined to this lab.

```diagram
{"type":"topology","title":"An inside LAN and a separately routed translation block","caption":"The outside /30 link does not contain the /28 pool. ISP needs a separate return route for that pool.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"10.20.30.10","x":0.5,"y":1},{"id":"B","kind":"pc","label":"PC-B","sub":"10.20.30.11","x":0.5,"y":3},{"id":"C","kind":"pc","label":"PC-C","sub":"10.20.30.12","x":0.5,"y":5},{"id":"SW","kind":"switch","label":"SW1","x":3,"y":3},{"id":"EDGE","kind":"router","label":"EDGE","sub":"inside / outside","x":5.5,"y":3,"highlight":true},{"id":"ISP","kind":"router","label":"ISP","x":8.5,"y":3},{"id":"WEB","kind":"server","label":"WEB","sub":"203.0.113.10","x":11.5,"y":3}],"links":[{"from":"A","to":"SW","toLabel":"Fa0/1"},{"from":"B","to":"SW","toLabel":"Fa0/2"},{"from":"C","to":"SW","toLabel":"Fa0/3"},{"from":"SW","to":"EDGE","fromLabel":"Gi0/1","toLabel":"Gi0/0/0"},{"from":"EDGE","to":"ISP","fromLabel":"Gi0/0/1","toLabel":"Gi0/0/0","accent":true},{"from":"ISP","to":"WEB","fromLabel":"Gi0/0/1"}]}
```

| Connection or device | Address / gateway | Cable |
|---|---|---|
| PC-A/B/C FastEthernet0 to SW1 Fa0/1–3 | `.10`, `.11`, `.12` in `10.20.30.0/24`; gateway `10.20.30.1` | Straight-through |
| SW1 Gi0/1 to EDGE Gi0/0/0 | EDGE `10.20.30.1/24` | Straight-through |
| EDGE Gi0/0/1 to ISP Gi0/0/0 | `198.51.100.1/30` to `198.51.100.2/30` | Crossover or automatic |
| ISP Gi0/0/1 to WEB FastEthernet0 | ISP `203.0.113.1/24`; WEB `203.0.113.10/24`, gateway `.1` | Crossover or automatic |
| Translation block | `198.51.100.16/28`; static `.17`, pool `.20–.21` | Routed toward EDGE |

## Step 1: Establish the interfaces and endpoints

Set each PC and WEB address, mask and gateway under Desktop → IP Configuration. On WEB, open Services → HTTP, enable HTTP and retain a page you can identify. DNS is unnecessary because the tests use literal addresses. Configure the switch and routers:

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface range fastethernet0/1 - 3
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 1
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 1
SW1(config-if)# no shutdown
SW1(config-if)# end
```

```ios EDGE
Router> enable
Router# configure terminal
Router(config)# hostname EDGE
EDGE(config)# interface gigabitethernet0/0/0
EDGE(config-if)# ip address 10.20.30.1 255.255.255.0
EDGE(config-if)# no shutdown
EDGE(config-if)# exit
EDGE(config)# interface gigabitethernet0/0/1
EDGE(config-if)# ip address 198.51.100.1 255.255.255.252
EDGE(config-if)# no shutdown
EDGE(config-if)# exit
EDGE(config)# ip route 0.0.0.0 0.0.0.0 198.51.100.2
EDGE(config)# end
EDGE# show ip interface brief
```

```ios ISP
Router> enable
Router# configure terminal
Router(config)# hostname ISP
ISP(config)# interface gigabitethernet0/0/0
ISP(config-if)# ip address 198.51.100.2 255.255.255.252
ISP(config-if)# no shutdown
ISP(config-if)# exit
ISP(config)# interface gigabitethernet0/0/1
ISP(config-if)# ip address 203.0.113.1 255.255.255.0
ISP(config-if)# no shutdown
ISP(config-if)# end
ISP# show ip interface brief
```

:::expected
Both used interfaces on each router become up/up after links settle. Each PC can ping `10.20.30.1`; WEB can ping `203.0.113.1`. If these fail persistently, fix local addressing, VLAN or cabling before introducing NAT.
:::

```state
{"status":"Local links verified","tone":"ok","led":true,"focus":["SW","EDGE","ISP"],"flows":[{"path":["A","SW","EDGE"],"back":true,"label":"PC-A pings 10.20.30.1"},{"path":["WEB","ISP"],"back":true,"with":true,"tone":"alt","label":"WEB pings 203.0.113.1"}],"chips":[{"node":"EDGE","text":"default → 198.51.100.2"}],"rows":[["Used router interfaces","up/up","ok"],["Each PC → 10.20.30.1","Replies","ok"],["WEB → 203.0.113.1","Replies","ok"],["NAT","Not configured yet"]]}
```

## Step 2: Compare router and client reachability

Before testing, trace the reply destination for EDGE's ordinary ping and PC-A's ping separately. Predict whether ISP's current connected routes can deliver each reply. Router-generated success does not automatically test the forwarded client's source.

On EDGE, run the commands below. From PC-A's Command Prompt, ping `203.0.113.10`. On ISP, inspect the route to the PC's source address.

```ios EDGE
EDGE# ping 203.0.113.10
EDGE# show ip route 203.0.113.10
```

```ios ISP
ISP# show ip route 10.20.30.10
```

:::expected
Before NAT is configured, EDGE's ordinary ping uses its outside-link address for this path and should receive replies. PC-A has no successful round trip because ISP has neither a specific route nor a default route to `10.20.30.10`. This is a deliberately missing return route, not a technical inability to route private addresses. In Simulation mode, filter for ARP/ICMP, generate a fresh ping and inspect the request and reply at each device. A worksheet alternative is to follow each packet's destination against the two routing tables.
:::

```state
{"status":"Client reply has no route","tone":"warn","focus":["EDGE","ISP"],"flows":[{"path":["EDGE","ISP","WEB"],"back":true,"label":"EDGE pings 203.0.113.10","tags":{"EDGE":"src 198.51.100.1 · outside link"},"backTags":{"ISP":"dst 198.51.100.1 · connected /30"}},{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"EDGE":"Default route · src 10.20.30.10"},"backStop":"ISP","backStopText":"No route to 10.20.30.10"}],"chips":[{"node":"EDGE","text":"default → 198.51.100.2"}],"rows":[["EDGE → 203.0.113.10","Replies","ok"],["PC-A → 203.0.113.10","No round trip","bad"],["ISP route to 10.20.30.10","None, and no default","bad"]]}
```

## Step 3: Add static NAT and observe the remaining fault

Predict the outside source for PC-A after the mapping below. Decide whether ISP's connected .0/30 includes that translated address before trying the ping.

```ios EDGE
EDGE# configure terminal
EDGE(config)# interface gigabitethernet0/0/0
EDGE(config-if)# ip nat inside
EDGE(config-if)# exit
EDGE(config)# interface gigabitethernet0/0/1
EDGE(config-if)# ip nat outside
EDGE(config-if)# exit
EDGE(config)# ip nat inside source static 10.20.30.10 198.51.100.17
EDGE(config)# end
EDGE# show ip nat translations
EDGE# show ip nat statistics
```

Ping WEB from PC-A again. Look at the configured static entry and, where the simulator shows them, the packets on EDGE's outside link. Inspect ISP's route for `198.51.100.17`.

:::expected
The static address mapping is visible before traffic. The translated source is `.17`, but ISP still lacks a route toward it: `.17` lies outside the connected `.0/30` link. A representative address row is `--- 198.51.100.17 10.20.30.10 --- ---`. Additional per-flow rows vary by image. Neither the static row nor an outbound packet alone proves the reply can return.
:::

```state
{"status":"Translated, no return route","tone":"bad","focus":["EDGE","ISP"],"flows":[{"event":["EDGE"],"wait":1.2,"tags":{"EDGE":"Static entry before any traffic"}},{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"EDGE":"src 10.20.30.10 → 198.51.100.17"},"backStop":"ISP","backStopText":"No route to 198.51.100.17"}],"roles":[{"node":"EDGE","peer":"SW","text":"inside","from":0},{"node":"EDGE","peer":"ISP","text":"outside","from":0}],"chips":[{"node":"EDGE","text":"static 10.20.30.10 ↔ .17","from":0}],"rows":[["Static row","--- 198.51.100.17 10.20.30.10"],["ISP route to .17","None · outside the .0/30","bad"],["PC-A → WEB","Reply cannot return","bad"]]}
```

## Step 4: Restore the route to the translation block

Choose the destination prefix and next hop ISP needs before reading the correction. The approved translation block is 198.51.100.16/28 and EDGE's connected outside address is .1.

```ios ISP
ISP# configure terminal
ISP(config)# ip route 198.51.100.16 255.255.255.240 198.51.100.1
ISP(config)# end
ISP# show ip route 198.51.100.17
```

Repeat PC-A's ping and open `http://203.0.113.10` in its browser. Record the four NAT address terms from the resulting entry. If using packet inspection, compare the source before/after EDGE and the destination on the reply.

:::expected
ISP selects the `/28` via EDGE; PC-A receives replies and can load WEB when HTTP is enabled. Inside local/global are `10.20.30.10` and `198.51.100.17`. Outside local/global are both `203.0.113.10`. PC-B/C do not yet have mappings. A successful HTTP test verifies more than the translation table alone.
:::

```state
{"status":"Return route restored","tone":"ok","focus":["ISP","EDGE"],"flows":[{"event":["ISP"],"wait":1.2,"tags":{"ISP":"Route 198.51.100.16/28 via .1"}},{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"EDGE":"src 10.20.30.10 → 198.51.100.17"},"backTags":{"ISP":"dst .17 · /28 via EDGE","EDGE":"dst 198.51.100.17 → 10.20.30.10"}},{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A opens http://203.0.113.10","backTags":{"WEB":"HTTP page returned"},"with":true,"wait":1.5,"tone":"alt"}],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"static 10.20.30.10 ↔ .17"},{"node":"ISP","text":"198.51.100.16/28 → .1","from":0}],"rows":[["Inside local / global","10.20.30.10 / 198.51.100.17","ok"],["Outside local / global","203.0.113.10 / 203.0.113.10"],["ISP route to .17","/28 via EDGE","ok"],["PC-A ping and HTTP","Succeed","ok"]]}
```

## Step 5: Prepare a two-address dynamic pool

Close the browsers and stop all generated traffic. Clear dynamic state before replacing the mapping. If an image reports a still-in-use mapping, inspect the remaining translations and let the test flows end before retrying; use its documented clearing behavior. Do not add the new mode while the old mapping remains active.

```ios EDGE
EDGE# clear ip nat translation *
EDGE# configure terminal
EDGE(config)# no ip nat inside source static 10.20.30.10 198.51.100.17
EDGE(config)# access-list 1 permit 10.20.30.0 0.0.0.255
EDGE(config)# ip nat pool PUBPOOL 198.51.100.20 198.51.100.21 netmask 255.255.255.240
EDGE(config)# ip nat inside source list 1 pool PUBPOOL
EDGE(config)# end
EDGE# show access-lists 1
EDGE# show ip nat statistics
```

:::expected
The static `.17` rule is gone and the active dynamic rule references ACL 1 and PUBPOOL without overload. Both addresses belong to the already-routed `/28`; the inclusive pool size is two. Record allocation before sending traffic rather than assuming a particular initial counter value.
:::

```state
{"status":"Dynamic pool configured","focus":["EDGE"],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"list 1 pool PUBPOOL"},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["Static .17 rule","Removed"],["ACL 1","permit 10.20.30.0 0.0.0.255"],["PUBPOOL",".20–.21 · 2 addresses in the /28"],["Overload","Not configured"]]}
```

## Step 6: Demonstrate pool capacity

Predict the number of simultaneous inside-address allocations from the inclusive range. Record the free count before PC-A, after PC-B and after PC-C. A count of flow rows is not necessarily a count of allocated pool addresses.

Ping WEB from PC-A, then PC-B. On each of those two PCs, open Web Browser and request http://203.0.113.10; record the returned WEB page. Inspect the table while both address allocations remain present. Only then ping from fresh PC-C, attempt the same HTTP request there, and inspect again:

```ios EDGE
EDGE# show ip nat translations
EDGE# show ip nat statistics
```

:::expected
Two inside hosts can hold two distinct global addresses. A fresh third host cannot get another plain dynamic translation while both remain allocated. Look for total addresses 2 and allocated 2 (100%), together with PC-C's missing mapping. Pool allocation-failure counters may also increase; exact wording and counts vary. If an allocation expires before PC-C tests, repeat with the two earlier hosts active. Do not require `.20` to belong to a particular PC.
:::

```state
{"status":"Pool full after two hosts","tone":"warn","focus":["EDGE"],"flows":[{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"EDGE":"10.20.30.10 → a PUBPOOL address"}},{"path":["B","SW","EDGE","ISP","WEB"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 203.0.113.10","tags":{"EDGE":"10.20.30.11 → the other address"}},{"path":["C","SW","EDGE","ISP"],"label":"PC-C pings 203.0.113.10","stop":"EDGE","stopText":"Pool 2/2 allocated · no mapping"}],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"list 1 pool PUBPOOL"},{"node":"EDGE","text":"allocated 2 (100%)","tone":"warn","from":2},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["PC-A, PC-B","Ping and HTTP · two addresses","ok"],["PUBPOOL","total 2 · allocated 2 (100%)","warn"],["PC-C","No mapping · test fails","bad"]]}
```

## Step 7: Recover capacity with interface overload

Before changing the rule, explain why three clients can now work without adding a third pool address. Identify the global address the interface form selects; it will differ from PUBPOOL.

Stop the test traffic before clearing and changing modes:

```ios EDGE
EDGE# clear ip nat translation *
EDGE# configure terminal
EDGE(config)# no ip nat inside source list 1 pool PUBPOOL
EDGE(config)# ip nat inside source list 1 interface gigabitethernet0/0/1 overload
EDGE(config)# end
```

Have all three PCs ping WEB, then open its HTTP page. Inspect translations promptly while traffic is active.

:::expected
All three clients can use inside global address `198.51.100.1`, with separate flow mappings. TCP/UDP rows identify ports; ICMP rows can show query identifiers. Compare inside local and inside global fields to see any translated port or identifier. Do not infer a fixed replacement value or require a particular table row order.
:::

Complete this short packet worksheet independently of the simulator's chosen ports. A representative mapping associates PC-B `10.20.30.11:51000` with global `198.51.100.1:1025` for TCP to WEB `203.0.113.10:80`. Write source and destination tuples for the outbound packet before/after EDGE and the reply before/after EDGE.

:::solution Packet worksheet
Outbound inside: `10.20.30.11:51000 → 203.0.113.10:80`. Outbound outside: `198.51.100.1:1025 → 203.0.113.10:80`. Returning outside: `203.0.113.10:80 → 198.51.100.1:1025`. Returning inside: `203.0.113.10:80 → 10.20.30.11:51000`. The next-hop ISP address never replaces WEB's application destination. Use these supplied values only for the worksheet; record your simulator's actual mapping separately.
:::

```state
{"status":"Three clients share .1","tone":"ok","focus":["EDGE"],"flows":[{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"EDGE":"10.20.30.10 → 198.51.100.1"}},{"path":["B","SW","EDGE","ISP","WEB"],"back":true,"with":true,"wait":1.5,"tone":"alt","label":"PC-B pings 203.0.113.10","tags":{"EDGE":"10.20.30.11 → 198.51.100.1"}},{"path":["C","SW","EDGE","ISP","WEB"],"back":true,"with":true,"wait":1.5,"label":"PC-C pings 203.0.113.10","tags":{"EDGE":"10.20.30.12 → 198.51.100.1"}}],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"list 1 Gi0/0/1 overload"},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["Inside global, all three","198.51.100.1","ok"],["Flow mappings","Separate · ports or ICMP IDs","ok"],["Worksheet mapping","10.20.30.11:51000 ↔ 198.51.100.1:1025"],["Worksheet flow","PC-B TCP to WEB 203.0.113.10:80"]]}
```

## Step 8: Use overload with the pool

Stop traffic, then replace interface overload with pool overload:

```ios EDGE
EDGE# clear ip nat translation *
EDGE# configure terminal
EDGE(config)# no ip nat inside source list 1 interface gigabitethernet0/0/1 overload
EDGE(config)# ip nat inside source list 1 pool PUBPOOL overload
EDGE(config)# end
```

Repeat the three client requests. Read both the translation table and ISP's route toward the selected global address.

:::expected
The global addresses come from `.20–.21`, and sharing permits three clients to communicate through two addresses. The exact address distribution is not a pass/fail condition. ISP's `/28` route remains necessary for the pool in this topology. Compare this to Step 6: the address range stayed the same; the overload behavior changed.
:::

```state
{"status":"Two addresses, three clients","tone":"ok","focus":["EDGE","ISP"],"flows":[{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A request to 203.0.113.10","tags":{"EDGE":"10.20.30.10 → .20–.21 · shared"},"backTags":{"ISP":"Pool /28 route → EDGE"}},{"path":["B","SW","EDGE","ISP","WEB"],"back":true,"with":true,"tone":"alt","label":"PC-B request to 203.0.113.10","tags":{"EDGE":"10.20.30.11 → .20–.21 · shared"},"wait":1.5},{"path":["C","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-C request to 203.0.113.10","tags":{"EDGE":"10.20.30.12 → .20–.21 · shared"},"with":true,"wait":1.5}],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"list 1 pool PUBPOOL overload"},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["Global addresses","From .20–.21","ok"],["Three clients","Share two addresses","ok"],["ISP /28 route","Still required for the pool","ok"],["Against Step 6","Same range · overload added"]]}
```

## Step 9: Introduce a wrong source selector

Before installing the fault, compare client source 10.20.30.12 with the proposed selector 10.20.3.0/24. Predict translation and return-path results separately. Only ACL 1, used solely by the NAT rule, is changed in this isolated lab. Stop traffic and clear its old dynamic state first so a retained translation cannot hide the new selector.

```ios EDGE
EDGE# clear ip nat translation *
EDGE# configure terminal
EDGE(config)# no access-list 1
EDGE(config)# access-list 1 permit 10.20.3.0 0.0.0.255
EDGE(config)# end
EDGE# show access-lists 1
```

From PC-C, send a fresh ping to WEB and inspect translations. Compare the source with the displayed wildcard match.

:::expected
`10.20.30.12` does not match `10.20.3.0/24`. This NAT rule creates no new translation for it. With the given routes and no interface filters, the untranslated source lacks a return path on ISP. The ACL's NAT-selection deny is not itself an interface packet drop. The address mismatch, not zero counters alone, establishes the configuration error.
:::

```state
{"status":"Selector misses 10.20.30.12","tone":"bad","focus":["EDGE"],"flows":[{"event":["EDGE"],"wait":1.2,"tags":{"EDGE":"ACL 1 now permits 10.20.3.0/24"}},{"path":["C","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-C pings 203.0.113.10","tags":{"EDGE":"No ACL match · sent untranslated"},"backStop":"ISP","backStopText":"No route to 10.20.30.12"}],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"ACL 1 10.20.30.0/24","until":0},{"node":"EDGE","text":"ACL 1 10.20.3.0/24","tone":"bad","from":0},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["PC-C source","10.20.30.12"],["ACL 1 selector","10.20.3.0/24 · no match","bad"],["New translation","None for PC-C","bad"],["Reply","No return path on ISP","bad"]]}
```

## Step 10: Restore the selector and verify

Choose the narrow configuration correction using the client source and selector before opening the recovery commands below. The existing pool and ISP route remain valid.

```ios EDGE
EDGE# configure terminal
EDGE(config)# no access-list 1
EDGE(config)# access-list 1 permit 10.20.30.0 0.0.0.255
EDGE(config)# end
EDGE# show access-lists 1
```

Repeat PC-C's same ping and HTTP request, then inspect the newly created translation.

:::expected
The selector matches `10.20.30.12`; its global address is in PUBPOOL, and the test succeeds when the earlier baseline is intact. Confirm all three clients before declaring the repair complete. The translation rule itself did not need to change.
:::

```state
{"status":"Selector repaired","tone":"ok","focus":["EDGE"],"flows":[{"event":["EDGE"],"wait":1.2,"tags":{"EDGE":"ACL 1 back to 10.20.30.0/24"}},{"path":["C","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-C pings 203.0.113.10","tags":{"EDGE":"10.20.30.12 → PUBPOOL address"},"backTags":{"ISP":"Pool /28 route → EDGE"}},{"path":["C","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-C opens http://203.0.113.10","with":true,"wait":1.5,"tone":"alt","backTags":{"WEB":"HTTP page returned"}}],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"ACL 1 10.20.3.0/24","tone":"bad","until":0},{"node":"EDGE","text":"ACL 1 10.20.30.0/24","tone":"ok","from":0},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["Selector","Matches 10.20.30.12","ok"],["PC-C inside global","In PUBPOOL","ok"],["All three clients","Confirmed","ok"],["NAT rule","Unchanged"]]}
```

## Step 11: Observe aging and deliberate clearing

Stop test traffic and record the dynamic table at two different times. On images supporting it, use `show ip nat translations verbose` to inspect lifetimes. If Packet Tracer omits this form, use the ordinary table and the worksheet below; simulator timing is not a certification of IOS XE defaults. Finally clear the dynamic table in this isolated project:

```ios EDGE
EDGE# show ip nat translations
EDGE# clear ip nat translation *
EDGE# show ip nat translations
```

:::expected
Idle dynamic state can age out; an address allocation can have a different lifetime from its child flows. Clearing dynamic state leaves the NAT configuration present, so a fresh eligible packet can create new state. Worksheet: if a displayed entry has 45 seconds remaining, an observation 20 seconds later with no refresh leaves approximately 25 seconds, subject to display/granularity. A configured static mapping would not be removed from configuration by this clear command. These supplied timer values are an interpretation exercise; memorizing a list of platform defaults is not a completion requirement.
:::

```state
{"status":"Dynamic state cleared","focus":["EDGE"],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"list 1 pool PUBPOOL overload"},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["Idle dynamic entries","Can age out"],["After clear","Dynamic entries gone · config kept"],["Worksheet","45 s left, 20 s later ≈ 25 s"]]}
```

## Step 12: Save a verified interface-overload baseline

Keep test traffic stopped after Step 11 while replacing the rule. If you restarted it, stop it again and inspect/clear the isolated dynamic state before removing an in-use mapping.

```ios EDGE
EDGE# configure terminal
EDGE(config)# no ip nat inside source list 1 pool PUBPOOL overload
EDGE(config)# ip nat inside source list 1 interface gigabitethernet0/0/1 overload
EDGE(config)# end
EDGE# show ip nat statistics
```

Repeat the client HTTP tests. Once all three work, individually save SW1, EDGE and ISP with `copy running-config startup-config` at each privileged EXEC prompt. Complete each offered destination filename prompt with Enter before moving on. Save the project as `nat-baseline.pkt`. Retain the unused pool definition and ISP `/28` route for the independent challenge.

:::expected
The active rule uses Gi0/0/1 overload; new client entries use `198.51.100.1`. Inside/outside roles and ACL 1 remain correct. Running and saved configurations contain this final mode rather than one of the temporary faults.
:::


Your final evidence table must distinguish each mode: static PC-A mapping, two occupied plain-pool allocations plus the fresh third-host failure, interface PAT shared address, and pool PAT addresses. Add the selector fault/recovery pair and one complete request/reply tuple walk. For each successful mode, include the actual HTTP result as well as mapping state. If a mode is unsupported, mark its command/state/packet worksheet unexecuted; do not substitute a different mode and claim equivalence.

```state
{"status":"Interface PAT baseline saved","tone":"ok","focus":["EDGE"],"flows":[{"path":["A","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-A HTTP test","tags":{"EDGE":"10.20.30.10 → 198.51.100.1"}},{"path":["B","SW","EDGE","ISP","WEB"],"back":true,"with":true,"tone":"alt","label":"PC-B HTTP test","tags":{"EDGE":"10.20.30.11 → 198.51.100.1"},"wait":1.5},{"path":["C","SW","EDGE","ISP","WEB"],"back":true,"label":"PC-C HTTP test","tags":{"EDGE":"10.20.30.12 → 198.51.100.1"},"with":true,"wait":1.5}],"roles":[{"node":"EDGE","peer":"SW","text":"inside"},{"node":"EDGE","peer":"ISP","text":"outside"}],"chips":[{"node":"EDGE","text":"list 1 Gi0/0/1 overload","tone":"ok"},{"node":"ISP","text":"198.51.100.16/28 → .1"}],"rows":[["New client entries","198.51.100.1","ok"],["Three clients","HTTP works","ok"],["Kept for challenge","PUBPOOL · ISP /28 route"],["Saved","SW1, EDGE, ISP · nat-baseline.pkt","ok"]]}
```

## Troubleshooting

- A failed gateway test requires local addressing/VLAN/link checks before NAT.
- For no new dynamic mapping, verify the actual client path, selector, roles and route with fresh traffic.
- For mapping state without success, inspect the reverse route, filtering and endpoint service. Table state is not proof of packet delivery.
- For a full plain pool, distinguish allocated addresses from flow count and test a new eligible host.
- If a mode change is rejected, stop traffic, inspect dependencies and clear only the lab state using supported syntax.
- An early timeout can be associated with address resolution, but persistent loss requires evidence; do not automatically dismiss it as ARP.

## Challenge

In a separate saved challenge copy, add INSIDE-WEB (Server-PT) to SW1 Fa0/4 with a straight-through cable. Set `10.20.30.50/24`, gateway `10.20.30.1`, and enable HTTP. Configure Fa0/4 as an enabled access port in VLAN 1. Keep the three PCs' interface PAT and publish INSIDE-WEB's TCP port 80 as `198.51.100.17:80`. First prove the inside server's HTTP service locally from PC-A. Before entering a mapping, write the outside request and inside-delivered destination tuples, and identify the ISP route that includes .17. Test from WEB's browser, then verify all three PCs still reach the original WEB page. Explain why the new mapping is not a complete security policy. If static TCP translation is unavailable, retain the live guided baseline and submit the exact commands plus predicted two-way tuples and verification plan as a clearly unexecuted worksheet.

:::solution
On SW1, enter interface Fa0/4, set `switchport mode access`, `switchport access vlan 1`, and `no shutdown`. Add this mapping on EDGE:

```ios EDGE
EDGE# configure terminal
EDGE(config)# ip nat inside source static tcp 10.20.30.50 80 198.51.100.17 80
EDGE(config)# end
EDGE# show ip nat translations
```

WEB can request `http://198.51.100.17` when HTTP, routes and interfaces are correct. For a browser source port P, the outside request is TCP 203.0.113.10:P → 198.51.100.17:80; after translation it is 203.0.113.10:P → 10.20.30.50:80. The reply source changes back from 10.20.30.50:80 to 198.51.100.17:80 on its outside leg. Read the actual source port rather than expecting a fixed value. ISP already routes `.17` within `198.51.100.16/28` to EDGE. Client PAT still uses `.1`; the static PAT entry associates `.17:80` with `.50:80`. Other policies and services need separate review. Remove this exact static-PAT command with its `no` form after ending the challenge's traffic if returning to the saved baseline; keep the challenge in a separate project copy if desired.
:::
