---
title: Build IPv6 OSPF neighbors and trace a global prefix
environment: packet-tracer
devices: ["3 x 2911 routers", "1 x 2960 switch", "2 x PC"]
minutes: 85
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use the supplied IPv6 setup to isolate what differs from OSPFv2: explicit router identity, interface activation, scoped link-local neighbors, and global prefix participation. Write the predictions before commands and retain actual evidence before any repair.

Build a separate IPv6-only file from blank devices. This lab uses the classic IPv6-specific IOS syntax; the final step translates the core into address-family syntax without changing the working lab.

Use a new Packet Tracer file with **three 2911 routers**, **one 2960 switch**, and **two PCs**. The 2911 provides Gi0/0, Gi0/1, and Gi0/2. Use straight-through copper for router–switch links, and crossover or the auto-connect tool for router–router and direct PC–router links. On CML/other images, map the interfaces explicitly before typing. All output in this guide is representative, not a recorded run; simulator commands and timing can differ.

## Topology

```diagram
{"type": "topology", "title": "Lab 22 — Shared transit and a separate direct link", "caption": "R1 and R3 have client LANs, a shared transit through SW1, and an independent direct link.", "nodes": [{"id": "A", "kind": "pc", "label": "PC-A", "x": 0.5, "y": 1}, {"id": "R1", "kind": "router", "label": "R1", "x": 3.5, "y": 1}, {"id": "SW", "kind": "switch", "label": "SW1", "sub": "2001:db8:123::/64", "x": 7, "y": 1}, {"id": "R2", "kind": "router", "label": "R2", "x": 11, "y": 1}, {"id": "R3", "kind": "router", "label": "R3", "x": 7, "y": 5}, {"id": "B", "kind": "pc", "label": "PC-B", "x": 11, "y": 5}], "links": [{"from": "A", "to": "R1", "toLabel": "Gi0/2"}, {"from": "R1", "to": "SW", "fromLabel": "Gi0/0", "toLabel": "Fa0/1"}, {"from": "R2", "to": "SW", "fromLabel": "Gi0/0", "toLabel": "Fa0/2"}, {"from": "R3", "to": "SW", "fromLabel": "Gi0/0", "toLabel": "Fa0/3"}, {"from": "R1", "to": "R3", "label": "Gi0/1 to Gi0/1"}, {"from": "R3", "to": "B", "fromLabel": "Gi0/2"}]}
```

| Device/interface | Global address/prefix | Link-local address / connection |
|---|---|---|
| R1 Gi0/0 | 2001:db8:123::1/64 | fe80::1, SW1 Fa0/1 |
| R2 Gi0/0 | 2001:db8:123::2/64 | fe80::2, SW1 Fa0/2 |
| R3 Gi0/0 | 2001:db8:123::3/64 | fe80::3, SW1 Fa0/3 |
| R1 Gi0/1 | 2001:db8:13::1/64 | fe80::13:1, to R3 Gi0/1 |
| R3 Gi0/1 | 2001:db8:13::3/64 | fe80::13:3, to R1 Gi0/1 |
| R1 Gi0/2 | 2001:db8:10::1/64 | fe80::10:1, to PC-A |
| R3 Gi0/2 | 2001:db8:30::1/64 | fe80::30:1, to PC-B |
| PC-A FastEthernet0 | 2001:db8:10::10/64 | Gateway fe80::10:1 |
| PC-B FastEthernet0 | 2001:db8:30::10/64 | Gateway fe80::30:1 |

The PCs may generate their own unique link-local addresses. No DNS or IPv4 address is required. SW1 is an ordinary Layer 2 switch in VLAN 1, with no management address. Shared costs are 10, direct costs 25, and client-LAN costs 1.

### Prediction and observation sheet

| Checkpoint | Predict before testing | Record actual evidence |
|---|---|---|
| Shared startup | DR/BDR/DROTHER and eligible priorities | Roles, RIDs, local interfaces |
| Normal LAN routes | Prefix, next-hop/interface pair and metric in both directions | Both route entries and PC pings |
| Direct timer fault | Which neighbor disappears and whether clients still work | Both timer pairs and selected route |
| LAN activation removed | Neighbor state versus route to that LAN | Remote route table and local/remote PC tests |
| LAN restored | Required activation, passive behavior | Returned /64 and successful endpoint tests |

Do not treat the router ID, neighbor Interface ID and link-local next hop as interchangeable. Record each in its own field. If Packet Tracer does not support the classic OSPFv3 commands, use a supported IOS/CML image or complete the predictions from these explicitly authored configurations; label a worksheet result as such.

## Step 1: Cable and configure IPv6 addressing

Set the PCs under Desktop > IP Configuration: IPv6 static, /64, and the listed link-local gateway. Leave IPv4 unused. Decline the router setup dialog. Shared links remain administratively down until OSPF is ready.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface range fastethernet0/1 - 3
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 1
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
```

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address 2001:db8:123::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ipv6 address 2001:db8:13::1/64
R1(config-if)# ipv6 address fe80::13:1 link-local
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/2
R1(config-if)# ipv6 address 2001:db8:10::1/64
R1(config-if)# ipv6 address fe80::10:1 link-local
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# end
R1# show ipv6 interface brief
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# ipv6 unicast-routing
R2(config)# interface gigabitethernet0/0
R2(config-if)# ipv6 address 2001:db8:123::2/64
R2(config-if)# ipv6 address fe80::2 link-local
R2(config-if)# shutdown
R2(config-if)# exit
R2(config)# end
R2# show ipv6 interface brief
```

```ios R3
Router> enable
Router# configure terminal
Router(config)# hostname R3
R3(config)# ipv6 unicast-routing
R3(config)# interface gigabitethernet0/0
R3(config-if)# ipv6 address 2001:db8:123::3/64
R3(config-if)# ipv6 address fe80::3 link-local
R3(config-if)# shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/1
R3(config-if)# ipv6 address 2001:db8:13::3/64
R3(config-if)# ipv6 address fe80::13:3 link-local
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/2
R3(config-if)# ipv6 address 2001:db8:30::1/64
R3(config-if)# ipv6 address fe80::30:1 link-local
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# end
R3# show ipv6 interface brief
```


:::expected
Each PC can ping its own global gateway address. R1 can ping 2001:db8:13::3 and R3 can ping 2001:db8:13::1. Shared Gi0/0 interfaces are administratively down. The manual link-local addresses are unique on each link.
:::

```state
{"status":"Addressed · shared links shut","focus":["R1","R2","R3"],"cut":[["R1","SW"],["R2","SW"],["R3","SW"]],"flows":[{"path":["A","R1"],"back":true,"label":"PC-A pings 2001:db8:10::1"},{"path":["B","R3"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 2001:db8:30::1"},{"path":["R1","R3"],"back":true,"label":"R1 pings 2001:db8:13::3"},{"path":["R3","R1"],"back":true,"label":"R3 pings 2001:db8:13::1"}],"rows":[["Shared Gi0/0 on R1 · R2 · R3","Administratively down"],["PC gateways","fe80::10:1 · fe80::30:1"],["R1 ↔ R3 direct link","Pings succeed","ok"],["Manual link-locals","Unique on each link"]]}
```

## Step 2: Enable the processes and establish known roles

Configure R1 first and wait until Gi0/0 becomes DR before configuring R2. Wait for R2 to become Full with R1 and BDR, then configure R3. The distinct process numbers demonstrate local significance. If a classic command is unavailable on your image, use a supported IOS image; do not silently substitute OSPFv2.

```ios R1
R1# configure terminal
R1(config)# ipv6 router ospf 10
R1(config-rtr)# router-id 1.1.1.1
R1(config-rtr)# passive-interface default
R1(config-rtr)# no passive-interface gigabitethernet0/0
R1(config-rtr)# no passive-interface gigabitethernet0/1
R1(config-rtr)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 ospf 10 area 0
R1(config-if)# ipv6 ospf cost 10
R1(config-if)# ipv6 ospf priority 100
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ipv6 ospf 10 area 0
R1(config-if)# ipv6 ospf network point-to-point
R1(config-if)# ipv6 ospf cost 25
R1(config-if)# exit
R1(config)# interface gigabitethernet0/2
R1(config-if)# ipv6 ospf 10 area 0
R1(config-if)# ipv6 ospf cost 1
R1(config-if)# exit
R1(config)# end
R1# show ipv6 ospf interface gigabitethernet0/0
R1# show ipv6 ospf neighbor
```

```ios R2
R2# configure terminal
R2(config)# ipv6 router ospf 20
R2(config-rtr)# router-id 2.2.2.2
R2(config-rtr)# passive-interface default
R2(config-rtr)# no passive-interface gigabitethernet0/0
R2(config-rtr)# exit
R2(config)# interface gigabitethernet0/0
R2(config-if)# ipv6 ospf 20 area 0
R2(config-if)# ipv6 ospf cost 10
R2(config-if)# ipv6 ospf priority 50
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# end
R2# show ipv6 ospf interface gigabitethernet0/0
R2# show ipv6 ospf neighbor
```

```ios R3
R3# configure terminal
R3(config)# ipv6 router ospf 30
R3(config-rtr)# router-id 3.3.3.3
R3(config-rtr)# passive-interface default
R3(config-rtr)# no passive-interface gigabitethernet0/0
R3(config-rtr)# no passive-interface gigabitethernet0/1
R3(config-rtr)# exit
R3(config)# interface gigabitethernet0/0
R3(config-if)# ipv6 ospf 30 area 0
R3(config-if)# ipv6 ospf cost 10
R3(config-if)# ipv6 ospf priority 0
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/1
R3(config-if)# ipv6 ospf 30 area 0
R3(config-if)# ipv6 ospf network point-to-point
R3(config-if)# ipv6 ospf cost 25
R3(config-if)# exit
R3(config)# interface gigabitethernet0/2
R3(config-if)# ipv6 ospf 30 area 0
R3(config-if)# ipv6 ospf cost 1
R3(config-if)# exit
R3(config)# end
R3# show ipv6 ospf interface gigabitethernet0/0
R3# show ipv6 ospf neighbor
```


:::expected
All routers have explicit, unique RIDs without needing IPv4 interface addresses. Shared roles are R1 DR, R2 BDR, R3 DROTHER. The classic IPv6-unicast instance is 0 on each shared interface. R1/R3 Gi0/1 interfaces are point-to-point.
:::

```state
{"status":"R1 DR · R2 BDR · R3 DROTHER","tone":"ok","focus":["R1","R2","R3"],"wake":["SW"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"DR on Gi0/0 · priority 100"}},{"event":["R2"],"tags":{"R2":"Full with R1 · BDR · priority 50"}},{"event":["R3"],"tags":{"R3":"DROTHER · priority 0"}}],"roles":[{"node":"R1","peer":"SW","text":"DR","from":0},{"node":"R2","peer":"SW","text":"BDR","from":1},{"node":"R3","peer":"SW","text":"DROTHER","from":2}],"chips":[{"node":"R1","text":"ospf 10 · RID 1.1.1.1"},{"node":"R2","text":"ospf 20 · RID 2.2.2.2"},{"node":"R3","text":"ospf 30 · RID 3.3.3.3"}],"rows":[["Shared roles","R1 DR · R2 BDR · R3 DROTHER","ok"],["Router IDs","Explicit · no IPv4 address needed"],["Shared instance","0 on each Gi0/0"],["R1/R3 Gi0/1","Point-to-point"]]}
```

## Step 3: Read neighbors and next-hop identities

Inspect R1 and R3. Record the local interface, neighbor RID, neighbor interface ID, link-local next hop, network type, and timers.

```ios R1
R1# show ipv6 ospf neighbor
R1# show ipv6 ospf interface gigabitethernet0/1
R1# show ipv6 route ospf
```

```ios R3
R3# show ipv6 ospf neighbor
R3# show ipv6 route ospf
```


:::expected
R1 sees RID 3.3.3.3 twice: FULL/DROTHER on shared Gi0/0 and FULL/ - on direct Gi0/1. Interface ID is the neighbor interface identifier; it is neither an IPv4 next hop nor necessarily the local process ID. Interface ID values can vary by image.
:::

```state
{"status":"3.3.3.3 seen twice on R1","focus":["R1","R3"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"chips":[{"node":"R1","text":"3.3.3.3 FULL/DROTHER · Gi0/0"},{"node":"R1","text":"3.3.3.3 FULL/ - · Gi0/1"}],"rows":[["Shared Gi0/0","3.3.3.3 FULL/DROTHER"],["Direct Gi0/1","3.3.3.3 FULL/ -"],["Interface ID","The neighbor's interface identifier"],["RID, interface ID, next hop","Separate fields"]]}
```

## Step 4: Prove the advertised /64 routes

Calculate the shared and direct path totals first. Predict the global destination prefix separately from the scoped link-local next hop; compare only after recording your calculation.

Use the client PCs so the test requires return routes to the actual client prefixes. On PC-A run:
```text
ping 2001:db8:30::10
```
On PC-B run:
```text
ping 2001:db8:10::10
```
Then inspect the two routers again.

```ios R1
R1# show ipv6 route ospf
```

```ios R3
R3# show ipv6 route ospf
```


:::solution
After Neighbor Discovery and convergence, both pings work. R1 learns 2001:DB8:30::/64 [110/11] via FE80::3, Gi0/0. R3 learns 2001:DB8:10::/64 [110/11] via FE80::1, Gi0/0. The IP destination remains global while the next-hop address is link-local.
:::

```state
{"status":"Calculate the totals, then test","focus":["R1","R3"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"rows":[["Link costs","Shared 10 · direct 25 · client LAN 1"],["PC-A","ping 2001:db8:30::10"],["PC-B","ping 2001:db8:10::10"],["Record separately","Global prefix · link-local next hop"]]}
```

## Step 5: Break only the direct adjacency

Predict the direct neighbor state and the client ping result separately. A working client test is not a substitute for checking both adjacencies.

Set R1 direct-link timers to 5/20 while R3 remains at 10/40. Wait until the direct neighbor no longer remains Full and compare effective timer output.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ipv6 ospf hello-interval 5
R1(config-if)# ipv6 ospf dead-interval 20
R1(config-if)# end
R1# show ipv6 ospf interface gigabitethernet0/1
R1# show ipv6 ospf neighbor
```

```ios R3
R3# show ipv6 ospf interface gigabitethernet0/1
```


:::expected
The direct relationship fails because both timer values disagree. The shared adjacency and cost-11 route remain healthy, so PC traffic can still work. This is an adjacency fault hidden by another usable path.
:::

```state
{"status":"Direct adjacency broken","tone":"bad","focus":["R1","R3"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R1","R3"],"wait":1.2,"tags":{"R1":"Gi0/1 hello 5 · dead 20","R3":"Gi0/1 hello 10 · dead 40"}},{"path":["A","R1","SW","R3","B"],"back":true,"label":"PC-A pings PC-B","tags":{"R1":"Shared route still cost 11"}}],"chips":[{"node":"R1","text":"3.3.3.3 FULL/ - · Gi0/1","until":0},{"node":"R1","text":"Gi0/1 neighbor not Full","tone":"bad","from":0}],"rows":[["R1 Gi0/1 timers","5/20","bad"],["R3 Gi0/1 timers","10/40"],["Direct neighbor","No longer Full","bad"],["Shared adjacency · cost 11","Healthy · PCs can still work","ok"]]}
```

## Step 6: Restore the direct timers

Remove the deliberate overrides from R1 only.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# no ipv6 ospf hello-interval
R1(config-if)# no ipv6 ospf dead-interval
R1(config-if)# end
R1# show ipv6 ospf interface gigabitethernet0/1
R1# show ipv6 ospf neighbor
```


:::expected
R1 reports 10/40 again and the direct neighbor reaches FULL/ -. A process clear, RID change, or new IPv4 address is unnecessary.
:::

```state
{"status":"Direct neighbor FULL/ -","tone":"ok","focus":["R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Gi0/1 timers back to 10/40"}}],"chips":[{"node":"R1","text":"Gi0/1 neighbor not Full","tone":"bad","until":0},{"node":"R1","text":"3.3.3.3 FULL/ - · Gi0/1","tone":"ok","from":0}],"rows":[["R1 Gi0/1 timers","10/40 again","ok"],["Direct neighbor","FULL/ -","ok"],["Process clear or new RID","Unnecessary"]]}
```

## Step 7: Remove a LAN advertisement while keeping neighbors

Before removing activation, predict the local PC-to-gateway test, the transit neighbor state and R1's remote route. Preserve the failure evidence before Step 8 restores participation.

On R3, disable OSPF activation on Gi0/2 without shutting the interface or changing its address. Inspect R1 after convergence and test PC-A to PC-B.

```ios R3
R3# configure terminal
R3(config)# interface gigabitethernet0/2
R3(config-if)# no ipv6 ospf 30 area 0
R3(config-if)# end
R3# show ipv6 interface brief
R3# show ipv6 ospf neighbor
```

```ios R1
R1# show ipv6 route ospf
```


:::expected
R3 remains Full with its routers, and PC-B can still ping its local gateway. R1 loses the OSPF route to 2001:db8:30::/64 and PC-A cannot reach PC-B. A Full adjacency proves synchronization, not that every desired LAN participates.
:::

```state
{"status":"LAN 30 not advertised","tone":"bad","focus":["R3","R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R3","R1"],"wait":1.2,"tags":{"R3":"Gi0/2 removed from area 0","R1":"Loses 2001:db8:30::/64"}},{"path":["B","R3"],"back":true,"label":"PC-B pings its local gateway"},{"path":["A","R1"],"label":"PC-A pings 2001:db8:30::10","stop":"R1","stopText":"No route to 2001:db8:30::/64"}],"chips":[{"node":"R3","text":"Gi0/2 in area 0","until":0},{"node":"R3","text":"Gi0/2 not in OSPF","tone":"bad","from":0}],"rows":[["R3 neighbors","Still Full","ok"],["PC-B to local gateway","Replies","ok"],["R1 route to 2001:db8:30::/64","Missing","bad"],["PC-A to PC-B","Fails","bad"]]}
```

## Step 8: Restore LAN participation

Re-enable the intended LAN in area 0. Its process-level passive setting remains correct.

```ios R3
R3# configure terminal
R3(config)# interface gigabitethernet0/2
R3(config-if)# ipv6 ospf 30 area 0
R3(config-if)# end
R3# show ipv6 ospf interface gigabitethernet0/2
```

```ios R1
R1# show ipv6 route ospf
```


:::expected
R1 relearns the /64 at cost 11 and PC-A/PC-B pings recover. Gi0/2 remains passive: it advertises the LAN through other interfaces while forming no PC-facing adjacency.
:::

```state
{"status":"LAN 30 advertised again","tone":"ok","focus":["R3","R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R3","R1"],"wait":1.2,"tags":{"R3":"Gi0/2 back in area 0","R1":"2001:db8:30::/64 back · cost 11"}},{"path":["A","R1","SW","R3","B"],"back":true,"label":"PC-A pings PC-B"}],"chips":[{"node":"R3","text":"Gi0/2 not in OSPF","tone":"bad","until":0},{"node":"R3","text":"Gi0/2 area 0 · passive","tone":"ok","from":0}],"rows":[["R1 route to the /64","Cost 11 again","ok"],["PC-A ↔ PC-B","Pings recover","ok"],["R3 Gi0/2","Passive · no PC-facing adjacency"]]}
```

## Step 9: Translate the core syntax on paper and save

In notes, translate R1 process 10 and its three area-0 activations into address-family syntax. Do not paste a migration into this working file. Compare with the answer below, then save each router and switch.

```ios R1
R1# copy running-config startup-config
```

```ios R2
R2# copy running-config startup-config
```

```ios R3
R3# copy running-config startup-config
```

```ios SW1
SW1# copy running-config startup-config
```

Accept the default filename and save the Packet Tracer file. If you later use a clean CML IOS XE image for the alternative syntax, verify feature support and map the interfaces first.

:::solution
The process begins with global `router ospfv3 10`, `router-id 1.1.1.1`, then `address-family ipv6 unicast`. Put passive-interface default and the Gi0/0/Gi0/1 exceptions in that family. Each interface activation is `ospfv3 10 ipv6 area 0`. The configured IPv6 addresses and need for IPv6 forwarding do not disappear. Use show ospfv3 neighbor/interface to verify that syntax family.
:::

```state
{"status":"Translated on paper · saved","tone":"ok","focus":["R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"chips":[{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"},{"node":"R3","text":"startup-config saved","tone":"ok"},{"node":"SW","text":"startup-config saved","tone":"ok"}],"rows":[["Translate on paper","R1 process 10 · three area-0 activations"],["Target","Address-family syntax · not pasted"],["Saved","Each router and switch · .pkt file","ok"]]}
```

## Troubleshooting

- No process RID: configure it explicitly; IPv6-only addressing does not supply a dotted-decimal RID automatically on classic IOS.
- No neighbor: compare interface activation, area, instance, timers, passive exceptions, link-local addresses, and link status.
- Repeated ExStart/Exchange: compare MTUs and exchange evidence. Bypassing the MTU check is not the first repair.
- Neighbor Full but missing /64: check the remote physical LAN's state and OSPF activation.
- A link-local next hop looks repeated: include the exit interface when interpreting it. Link-local scope is per link.
- Client failure with routes present: check /64 and gateway on both PCs, then route back to the source.

## Challenge

Work in a copy of the restored baseline. Add PC-C FastEthernet0 directly to the unused **R2 Gi0/2** with copper crossover or auto-connect. Allocate the **fourth /64, counting from 1**, inside `2001:db8:220:a0::/60`. Use router identifier `::1`, PC identifier `::10`, and router link-local `fe80::22`. Activate this physical LAN in R2's existing classic OSPFv3 process and area, keep it passive, and set its outgoing cost to **7**.

Before configuring, write the complete router/PC addresses, local gateway, activation command, and the expected route prefix, scoped next hop and metric on R1 and R3. Predict the return routes R2 uses for PC-A and PC-B. Then implement, inspect routes and test from each PC; no static route or default may be added.

After that extension works, change only R1's shared outgoing cost to **50**. Predict its route to LAN 30 and R3's reverse route before testing. Collect evidence with the changed cost, then restore cost **10** as a separate recovery. Save the successful extension separately from the original baseline.

:::solution
The /60 spans fourth-group values a0 through af. The fourth /64 is `2001:db8:220:a3::/64`. R2 uses `2001:db8:220:a3::1/64` and `fe80::22`; PC-C uses `2001:db8:220:a3::10/64`, gateway `fe80::22`.

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/2
R2(config-if)# ipv6 address 2001:db8:220:a3::1/64
R2(config-if)# ipv6 address fe80::22 link-local
R2(config-if)# ipv6 ospf 20 area 0
R2(config-if)# ipv6 ospf cost 7
R2(config-if)# no shutdown
R2(config-if)# end
R2# show ipv6 ospf interface gigabitethernet0/2
R2# show ipv6 route ospf
```

R2's existing passive default makes Gi0/2 passive. R1 and R3 learn the new /64 through shared next hop `fe80::2`, Gi0/0, at cost `10 + 7 = 17`. R2's return routes to LANs 10 and 30 each cost `10 + 1 = 11`, through `fe80::1` and `fe80::3` respectively on Gi0/0. The address family is IPv6, while the unchanged R2 RID remains the 32-bit value `2.2.2.2`.

On PC-C:

```text
ping 2001:db8:220:a3::1
ping 2001:db8:10::10
ping 2001:db8:30::10
```

On PC-A and PC-B separately:

```text
ping 2001:db8:220:a3::10
```

For the directional test, set `ipv6 ospf cost 50` under R1 Gi0/0 and leave all R3 costs unchanged. R1 selects LAN 30 at cost `25 + 1 = 26` through `fe80::13:3`, Gi0/1, instead of shared cost 51. R3's reverse route remains shared cost 11. R1 can now reach the new R2 LAN through R3 at `25 + 10 + 7 = 42`, less than direct shared cost `50 + 7 = 57`; R3 still reaches that LAN at cost 17. Capture the full tables, not only the one requested prefix.

After collecting those results, restore R1 Gi0/0 with `ipv6 ospf cost 10` in interface configuration, return to privileged EXEC and inspect both route tables again. The original client routes return to cost 11 and the new-LAN routes to 17. Verify all three PCs, then save the routers and extended project. If a platform feature is unavailable, retain the calculations as a labelled worksheet rather than claiming a device observation.
:::
