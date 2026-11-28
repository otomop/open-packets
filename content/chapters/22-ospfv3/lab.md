---
title: Build IPv6 OSPF neighbors and trace a global prefix
environment: packet-tracer
devices: ["3 x 2911 routers", "1 x 2960 switch", "2 x PC"]
minutes: 85
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You will build the lesson's IPv6-only network and run single-area OSPFv3 on it. Along the way you set router IDs by hand, enable OSPFv3 interface by interface, read the DR and BDR roles, and match each route's link-local next hop and cost to your own calculation. Then you break and repair one adjacency and one LAN advertisement, the two faults the lesson told you to expect. Write each prediction before you run the command that tests it.

The lab uses the classic `ipv6 router ospf` syntax throughout. Step 9 translates the result into address-family syntax on paper.

Start a new Packet Tracer file with **three 2911 routers**, **one 2960 switch**, and **two PCs**. The 2911 provides Gi0/0, Gi0/1, and Gi0/2. Use straight-through copper for router–switch links, and crossover or the auto-connect tool for router–router and direct PC–router links. On CML or other images, map the interfaces before typing. The outputs quoted here are representative; values such as the Interface ID and the timing differ between platforms.

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

The PCs generate their own link-local addresses. No DNS or IPv4 address is needed. SW1 is an ordinary Layer 2 switch in VLAN 1, with no management address. You will set the OSPF costs by hand: 10 on the shared segment, 25 on the direct link and 1 on each client LAN.

### Prediction and observation sheet

| Checkpoint | Predict before testing | Record actual evidence |
|---|---|---|
| Shared startup | DR/BDR/DROTHER and eligible priorities | Roles, RIDs, local interfaces |
| Normal LAN routes | Prefix, next-hop/interface pair and metric in both directions | Both route entries and PC pings |
| Direct timer fault | Which neighbor disappears and whether clients still work | Both timer pairs and selected route |
| LAN activation removed | Neighbor state versus route to that LAN | Remote route table and local/remote PC tests |
| LAN restored | Required activation, passive behavior | Returned /64 and successful endpoint tests |

Record the router ID, the neighbor's Interface ID and the link-local next hop in separate fields: they are three different things. If your Packet Tracer version rejects one of the commands, note which one, and complete that checkpoint on paper from the configurations given here.

## Step 1: Cable and configure IPv6 addressing

Set each PC under Desktop > IP Configuration: static IPv6 address, /64, and the link-local gateway from the table. Leave IPv4 empty. Decline the setup dialog on each router.

Every router gets `ipv6 unicast-routing` first, because IOS will not accept OSPFv3 commands without it. Each interface gets a global address and a short manual link-local address, so that the next hops you read later are easy to recognize. The shared Gi0/0 interfaces stay shut down for now. That lets you bring the routers onto the shared segment one at a time in Step 2 and see the DR election happen in a known order.

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

Each router gets a process, a manual router ID, `passive-interface default` with exceptions for its transit links, and one `ipv6 ospf PROCESS area 0` line on every interface, including the client LANs. When you create the process, IOS warns that it could not pick a router ID. That is expected on a router with no IPv4 address, and the `router-id` line answers it.

The process numbers are 10, 20 and 30 to show that the process ID is local. The priorities on the shared segment are 100, 50 and 0, so R1 should become DR, R2 the BDR and R3 a DROTHER. The direct link is set to point-to-point on both ends, so it elects nothing.

Order matters, because the election is not preemptive. Configure R1 first and wait until `show ipv6 ospf interface gigabitethernet0/0` reports State DR. This takes about 40 seconds, the time a lone router waits before electing itself. Then configure R2, wait until it is Full with R1 and shows as BDR, and configure R3 last.

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
Each router has its own router ID and no IPv4 address. On the shared segment R1 is DR, R2 is BDR and R3 is DROTHER. `show ipv6 ospf interface` reports Instance ID 0 on each shared interface and network type POINT_TO_POINT on R1 and R3 Gi0/1.
:::

```state
{"status":"R1 DR · R2 BDR · R3 DROTHER","tone":"ok","focus":["R1","R2","R3"],"wake":["SW"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"DR on Gi0/0 · priority 100"}},{"event":["R2"],"tags":{"R2":"Full with R1 · BDR · priority 50"}},{"event":["R3"],"tags":{"R3":"DROTHER · priority 0"}}],"roles":[{"node":"R1","peer":"SW","text":"DR","from":0},{"node":"R2","peer":"SW","text":"BDR","from":1},{"node":"R3","peer":"SW","text":"DROTHER","from":2}],"chips":[{"node":"R1","text":"ospf 10 · RID 1.1.1.1"},{"node":"R2","text":"ospf 20 · RID 2.2.2.2"},{"node":"R3","text":"ospf 30 · RID 3.3.3.3"}],"rows":[["Shared roles","R1 DR · R2 BDR · R3 DROTHER","ok"],["Router IDs","Explicit · no IPv4 address needed"],["Shared instance","0 on each Gi0/0"],["R1/R3 Gi0/1","Point-to-point"]]}
```

## Step 3: Read the neighbor tables

Predict R1's neighbor table before you look: how many rows, which router IDs, and which state and role on each row. Then inspect R1 and R3. For each neighbor record the router ID, the state, the neighbor's Interface ID and your local interface. On R1 Gi0/1, confirm the network type and the 10/40 timers.

```ios R1
R1# show ipv6 ospf neighbor
R1# show ipv6 ospf interface gigabitethernet0/1
```

```ios R3
R3# show ipv6 ospf neighbor
```


:::expected
R1 has three rows: 2.2.2.2 FULL/BDR on Gi0/0, and 3.3.3.3 twice, FULL/DROTHER on shared Gi0/0 and FULL/ - on direct Gi0/1. R3 sees 1.1.1.1 as FULL/DR on Gi0/0 and FULL/ - on Gi0/1, and 2.2.2.2 as FULL/BDR. The Interface ID is a number the neighbor gave its own interface. It is not an address or a process ID, and its value varies by platform.
:::

```state
{"status":"3.3.3.3 seen twice on R1","focus":["R1","R3"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"chips":[{"node":"R1","text":"3.3.3.3 FULL/DROTHER · Gi0/0"},{"node":"R1","text":"3.3.3.3 FULL/ - · Gi0/1"}],"rows":[["Shared Gi0/0","3.3.3.3 FULL/DROTHER"],["Direct Gi0/1","3.3.3.3 FULL/ -"],["Interface ID","The neighbor's interface identifier"],["RID, interface ID, next hop","Separate fields"]]}
```

## Step 4: Predict and prove the /64 routes

Before you look at a route table, calculate R1's cost to `2001:db8:30::/64` over the shared segment and over the direct link. Write down the next hop and exit interface you expect for the cheaper path. Do the same for R3's route to `2001:db8:10::/64`.

Then test from the PCs, because a PC-to-PC ping needs the routes in both directions. On PC-A run:
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
The shared path costs 10 + 1 = 11 and the direct path costs 25 + 1 = 26, in both directions. R1 learns 2001:DB8:30::/64 [110/11] via FE80::3, Gi0/0. R3 learns 2001:DB8:10::/64 [110/11] via FE80::1, Gi0/0. Both pings work; the first may lose a packet while Neighbor Discovery resolves the gateways. The packets keep their global destinations while each router forwards to a link-local next hop.
:::

```state
{"status":"Calculate the totals, then test","focus":["R1","R3"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"rows":[["Link costs","Shared 10 · direct 25 · client LAN 1"],["PC-A","ping 2001:db8:30::10"],["PC-B","ping 2001:db8:10::10"],["Record separately","Global prefix · link-local next hop"]]}
```

## Step 5: Break only the direct adjacency

Hello and dead intervals must match between neighbors. Change them on one end of the direct link and predict two things separately: what happens to the direct neighbor, and whether PC-A can still ping PC-B.

`ipv6 ospf hello-interval` and `ipv6 ospf dead-interval` are the OSPFv3 forms of the timer commands from Chapter 21. Set R1 Gi0/1 to 5/20 while R3 stays at 10/40. Wait up to 40 seconds for the neighbor to disappear from both tables, then compare the timers on both ends.

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
The direct neighbor drops because the timers disagree: R1 reports 5/20 and R3 reports 10/40. The shared adjacency and the cost-11 route are untouched, so the PCs still reach each other. A ping alone would not have found this fault.
:::

```state
{"status":"Direct adjacency broken","tone":"bad","focus":["R1","R3"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R1","R3"],"wait":1.2,"tags":{"R1":"Gi0/1 hello 5 · dead 20","R3":"Gi0/1 hello 10 · dead 40"}},{"path":["A","R1","SW","R3","B"],"back":true,"label":"PC-A pings PC-B","tags":{"R1":"Shared route still cost 11"}}],"chips":[{"node":"R1","text":"3.3.3.3 FULL/ - · Gi0/1","until":0},{"node":"R1","text":"Gi0/1 neighbor not Full","tone":"bad","from":0}],"rows":[["R1 Gi0/1 timers","5/20","bad"],["R3 Gi0/1 timers","10/40"],["Direct neighbor","No longer Full","bad"],["Shared adjacency · cost 11","Healthy · PCs can still work","ok"]]}
```

## Step 6: Restore the direct timers

Remove the two overrides from R1. R3 was never changed, so it needs nothing.

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
R1 reports 10/40 again and the direct neighbor returns to FULL/ -. You did not need to clear the process or touch the router ID.
:::

```state
{"status":"Direct neighbor FULL/ -","tone":"ok","focus":["R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Gi0/1 timers back to 10/40"}}],"chips":[{"node":"R1","text":"Gi0/1 neighbor not Full","tone":"bad","until":0},{"node":"R1","text":"3.3.3.3 FULL/ - · Gi0/1","tone":"ok","from":0}],"rows":[["R1 Gi0/1 timers","10/40 again","ok"],["Direct neighbor","FULL/ -","ok"],["Process clear or new RID","Unnecessary"]]}
```

## Step 7: Remove a LAN advertisement while keeping neighbors

This is the lesson's "Full neighbors, missing prefix" case. On R3, take Gi0/2 out of OSPFv3 without shutting it down or changing its address. First predict three results: PC-B's ping to its own gateway, R3's neighbor states, and R1's route to `2001:db8:30::/64`.

Then make the change, inspect R1 and ping PC-B from PC-A. Record what you see before Step 8 repairs it.

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
R3 stays Full with R1 and R2, and PC-B still pings its gateway. R1 loses the OSPF route to 2001:db8:30::/64, so PC-A cannot reach PC-B. A Full adjacency shows that the databases match. It does not show that every LAN interface is in OSPF.
:::

```state
{"status":"LAN 30 not advertised","tone":"bad","focus":["R3","R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R3","R1"],"wait":1.2,"tags":{"R3":"Gi0/2 removed from area 0","R1":"Loses 2001:db8:30::/64"}},{"path":["B","R3"],"back":true,"label":"PC-B pings its local gateway"},{"path":["A","R1"],"label":"PC-A pings 2001:db8:30::10","stop":"R1","stopText":"No route to 2001:db8:30::/64"}],"chips":[{"node":"R3","text":"Gi0/2 in area 0","until":0},{"node":"R3","text":"Gi0/2 not in OSPF","tone":"bad","from":0}],"rows":[["R3 neighbors","Still Full","ok"],["PC-B to local gateway","Replies","ok"],["R1 route to 2001:db8:30::/64","Missing","bad"],["PC-A to PC-B","Fails","bad"]]}
```

## Step 8: Restore LAN participation

Put Gi0/2 back into area 0. You do not need to change the passive setting: `passive-interface default` still covers Gi0/2, which is what a client LAN should have.

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
R1 relearns the /64 at cost 11 and the PC-A to PC-B pings recover. Gi0/2 is still passive: R3 advertises the LAN to its neighbors and sends no Hellos toward the PC.
:::

```state
{"status":"LAN 30 advertised again","tone":"ok","focus":["R3","R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"flows":[{"event":["R3","R1"],"wait":1.2,"tags":{"R3":"Gi0/2 back in area 0","R1":"2001:db8:30::/64 back · cost 11"}},{"path":["A","R1","SW","R3","B"],"back":true,"label":"PC-A pings PC-B"}],"chips":[{"node":"R3","text":"Gi0/2 not in OSPF","tone":"bad","until":0},{"node":"R3","text":"Gi0/2 area 0 · passive","tone":"ok","from":0}],"rows":[["R1 route to the /64","Cost 11 again","ok"],["PC-A ↔ PC-B","Pings recover","ok"],["R3 Gi0/2","Passive · no PC-facing adjacency"]]}
```

## Step 9: Translate the core syntax on paper and save

The lesson showed the address-family syntax that current IOS XE uses. In your notes, rewrite R1's process 10, its passive settings and its three area-0 interface commands in that syntax. Do not type it into this working file. Compare with the answer below, then save each router and the switch.

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

Accept the default filename and save the Packet Tracer file.

:::solution
The process is `router ospfv3 10` with `router-id 1.1.1.1`, then `address-family ipv6 unicast`. Inside the address family go `passive-interface default` and the `no passive-interface` exceptions for Gi0/0 and Gi0/1. Each of the three interfaces gets `ospfv3 10 ipv6 area 0`. The IPv6 addresses and `ipv6 unicast-routing` stay as they are. You would verify with `show ospfv3 neighbor` and `show ospfv3 interface`.
:::

```state
{"status":"Translated on paper · saved","tone":"ok","focus":["R1"],"roles":[{"node":"R1","peer":"SW","text":"DR"},{"node":"R2","peer":"SW","text":"BDR"},{"node":"R3","peer":"SW","text":"DROTHER"}],"chips":[{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"},{"node":"R3","text":"startup-config saved","tone":"ok"},{"node":"SW","text":"startup-config saved","tone":"ok"}],"rows":[["Translate on paper","R1 process 10 · three area-0 activations"],["Target","Address-family syntax · not pasted"],["Saved","Each router and switch · .pkt file","ok"]]}
```

## Troubleshooting

- OSPFv3 commands rejected: `ipv6 unicast-routing` is missing.
- "Could not pick a router-id": configure `router-id` under the process. An IPv6-only router has no IPv4 address to borrow.
- No neighbor: on both ends, check that the interface is up, has its `ipv6 ospf PROCESS area 0` line and its `no passive-interface` exception, and compare area, timers and instance ID.
- Wrong DR or BDR: the election is not preemptive. Shut the three Gi0/0 interfaces and bring them up in the order R1, R2, R3, waiting for each role.
- Neighbor stuck in ExStart or Exchange: compare the MTU on both ends.
- Neighbors Full but a /64 is missing: check that the remote LAN interface is up and has its `ipv6 ospf` line.
- The same link-local next hop appears on two routes: read it with its exit interface. A link-local address belongs to one link.
- Routes present but the PCs cannot ping: check the /64 address and gateway on both PCs, then the route back to the source LAN.

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
