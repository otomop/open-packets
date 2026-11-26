---
id: ospfv2
number: 21
title: OSPFv2
subtitle: Build a single-area IPv4 routing domain and explain every neighbor, election, and route.
part: routing
domain: routing
minutes: { lesson: 75, lab: 95 }
summary: Learn how OSPF forms adjacencies, chooses a designated router, and adds interface costs. Configure area 0, verify both directions of a path, and isolate faults without resetting healthy neighbors.
objectives:
  v1: ["3.4", "3.4.a", "3.4.b", "3.4.c", "3.4.d"]
  v2: ["3.3", "3.3.a", "3.3.b", "3.3.c", "3.3.d"]
prereqs: [routing-table, static-routing-ipv4]
sectionIds:
  How OSPF learns the topology: why-a-link-state-protocol
  From neighbor discovery to a full adjacency: becoming-neighbours-then-adjacent
  Broadcast and point-to-point networks: network-types-dr-and-bdr
sources:
  - { title: "Cisco: Originate a default route into OSPF", url: "https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/47868-ospfdb9.html" }
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco IOS: Configuring OSPF", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/iro-cfg.html" }
  - { title: "Cisco: Understand OSPF Neighbor States", url: "https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13685-13.html" }
  - { title: "Cisco: Review OSPF Frequently Asked Questions", url: "https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/9237-9.html" }
  - { title: "Cisco: OSPF command reference, cost and dead interval", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/m_ospf-a1.html" }
  - { title: "Cisco: Troubleshoot OSPF Neighbors Stuck in Exstart/Exchange", url: "https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13684-12.html" }
  - { title: "RFC 2328: OSPF Version 2", url: "https://www.rfc-editor.org/rfc/rfc2328.html" }
---

In Chapter 18 you typed every remote network into every router by hand. That works for three routers. With thirty, one new LAN means editing dozens of devices, and when a link fails nothing reroutes unless you planned a floating static route in advance. A routing protocol does that work: routers tell each other what they are connected to, each calculates its own best paths, and all recalculate when the topology changes.

This chapter teaches **OSPF version 2 (OSPFv2)**, the IPv4 routing protocol the CCNA expects you to configure. It builds on Chapter 17: OSPF offers routes to the routing table with administrative distance 110, and forwarding still uses longest prefix match. By the end you will be able to configure single-area OSPF, say why two routers do or do not become neighbors, predict which router becomes DR and BDR, calculate a route's cost, and pick the show command that locates a fault.

## How OSPF learns the topology

:::facts
- OSPFv2 carries IPv4 routes and uses IP protocol number **89**, not a TCP or UDP port.
- On Cisco IOS, the default OSPF administrative distance is **110**.
- This chapter uses one area, **area 0**, throughout.
- For the broadcast and point-to-point interfaces studied here, normal IOS defaults are Hello **10 seconds** and dead **40 seconds**.
- Hellos go to multicast **224.0.0.5** (all OSPF routers). **224.0.0.6** reaches only the DR and BDR.
- A lower total **cost** is better. A higher OSPF interface **priority** is better for DR/BDR election. These select different things.
:::

**Open Shortest Path First (OSPF)** is a **link-state routing protocol**. Instead of passing finished routes along, each router describes its own links: which networks it is attached to, which routers it has met on them, and what each link costs. These descriptions are **link-state advertisements (LSAs)**. Routers pass LSAs on unchanged until every router in the area holds the same set, the **link-state database (LSDB)**. The LSDB is a map of the area that all its routers share.

Each router then runs the **shortest path first (SPF)** algorithm over that map with itself as the starting point, and offers the lowest-cost path to each network to its routing table. Every router holds the same map but starts from a different place, so R1 and R3 can choose different next hops.

That gives you three places to look: the neighbor table (`show ip ospf neighbor`), the LSDB (`show ip ospf database`) and the installed routes (`show ip route ospf`). A fault can sit in any of the three. Neighbors can be healthy while a route is missing, because the far LAN was never enabled in OSPF or because a static route with a lower administrative distance already holds that prefix.

An **area** is a group of routers that share one LSDB. Large networks are split into several areas to keep each map small, and every other area must attach to **area 0**, the backbone. The CCNA asks you to configure a single area, so every OSPF interface in this chapter is in area 0.

The examples use three routers. R1, R2 and R3 share the Ethernet segment `10.0.123.0/24`. R1 and R3 also have a direct link, `10.0.13.0/30`, and each has a client LAN: `192.168.10.0/24` behind R1 and `192.168.30.0/24` behind R3. The PCs keep using their default gateways and never become OSPF neighbors.

## Router ID and process ID

Every router needs a name in the shared map. That name is the **router ID (RID)**, a 32-bit number written in dotted decimal, such as `1.1.1.1`. It looks like an IPv4 address but it is only a label: a configured RID does not have to exist on any interface. It does have to be unique, and two routers with the same RID will not become neighbors.

IOS chooses the RID when the OSPF process starts, using the first of these that exists:

1. The value in the `router-id` command.
2. The highest IPv4 address on a loopback interface that is up.
3. The highest IPv4 address on any other interface that is up.

Suppose a router has Loopback0 at `10.1.1.1` and GigabitEthernet0/0 at `192.168.1.1`, with no `router-id` command. Its RID is `10.1.1.1`: any loopback beats any physical interface, even one with a numerically higher address. Add Loopback1 at `10.9.9.9` and the next process start selects `10.9.9.9`, the higher loopback. Configure `router-id 1.1.1.1` and that value wins over both.

The RID is chosen once and kept. A higher address that appears later does not change it, and neither does typing a new `router-id` after neighbors have formed. IOS then tells you to reload or run `clear ip ospf process`, which restarts OSPF and drops every adjacency of that process until they form again. Set the RID first, before you enable any interface, and you avoid the restart. `show ip ospf` and `show ip protocols` both display the RID in use; `show ip protocols` also lists the passive interfaces.

The `10` in `router ospf 10` is the **process ID**. It names one of this router's own OSPF processes, from 1 through 65535, and is never sent to neighbors, so R1's process 10 forms an adjacency with R2's process 20. The area is different: it is carried in every Hello and must match on both ends of a link. Area `0` and area `0.0.0.0` are the same area.

## From neighbor discovery to a full adjacency

Before two routers trade LSAs, each checks that the other is a compatible OSPF router on the same link. They do it with **Hello** packets, and most OSPF faults on the exam come down to a Hello that was never sent, never arrived, or was rejected.

A router sends a Hello every 10 seconds out of each OSPF-enabled interface that is not passive. The destination is the multicast address `224.0.0.5`, so every OSPF router on the link hears it and none forwards it. Each Hello carries the sender's RID, area and timers, and the RIDs of the neighbors it has already heard. If a router hears nothing from a neighbor for the **dead interval**, 40 seconds by default, it declares that neighbor down and recalculates.

Two routers become neighbors only when their Hellos agree:

- **Must match:** the area ID, the subnet and mask, the Hello and dead intervals, and authentication when it is configured.
- **Must be different:** the router IDs.
- **May differ:** the process ID, interface priority and interface cost.

Both interfaces must also be up, enabled for OSPF and not passive, and no ACL may block IP protocol 89; a successful ping does not prove that. Authentication configuration is excluded from v2.0 objective 3.3.a and is not used here. MTU and network type should match too; their failures are described below.

Once the Hellos are accepted, the pair works through a fixed series of states:

```diagram
{"type":"sequence","title":"Fig 21.1 — Two routers reach Full","caption":"Hellos establish two-way contact; the other four packet types then synchronize the databases.","actors":["R1 · RID 1.1.1.1","R2 · RID 2.2.2.2"],"steps":[{"from":0,"to":1,"label":"Hello","note":"I am 1.1.1.1, heard no one. R2: Init"},{"from":1,"to":0,"label":"Hello","note":"I am 2.2.2.2, heard 1.1.1.1. R1: 2-Way","accent":true},{"from":0,"to":1,"label":"Hello","note":"Heard 2.2.2.2. Both 2-Way"},{"from":1,"to":0,"label":"DBD","note":"ExStart: higher RID leads; MTU compared"},{"from":0,"to":1,"label":"DBD","note":"Exchange: each lists its LSAs"},{"from":0,"to":1,"label":"LSR","note":"Loading: R1 requests missing LSAs"},{"from":1,"to":0,"label":"LSU","note":"R2 sends them"},{"from":0,"to":1,"label":"LSAck","note":"Both are Full","accent":true}]}
```

| State | What it establishes | What to investigate if it persists |
|---|---|---|
| Down | No current usable Hello relationship | Link, addressing, process activation, passive setting |
| Init | A Hello arrived, but it does not list the local RID | One-way communication or filtering |
| 2-Way | Each router has seen itself in the other's Hello | Normal between two DROTHERs |
| ExStart / Exchange | Routers negotiate and exchange database descriptions | MTU mismatch |
| Loading | Requested link-state information is being obtained | Missing updates, retransmissions, connectivity |
| Full | Database synchronization for this adjacency completed | Move on to route and forwarding verification |

OSPF has five packet types, and each has one job:

| Packet | Job |
|---|---|
| Hello | Discover neighbors and keep them alive |
| Database Description (DBD) | Summarize the LSAs the sender holds |
| Link-State Request (LSR) | Ask for specific LSAs |
| Link-State Update (LSU) | Carry the LSAs themselves |
| Link-State Acknowledgment (LSAck) | Confirm that an update arrived |

Updates and acknowledgments are sent again whenever a link changes.

The timers are set per interface with `ip ospf hello-interval 5` and `ip ospf dead-interval 20`. If you change only the Hello interval, IOS sets the dead interval to four times the new value, but a dead interval you typed yourself stays as typed. Both numbers must match the neighbor's, so set both on both ends and read the values in effect with `show ip ospf interface`.

## Broadcast and point-to-point networks

A link with two routers needs one adjacency. An Ethernet segment can hold many routers, and if each synchronized with every other, ten routers would need 45 adjacencies. OSPF avoids that by electing one router per segment as a hub for LSA exchange.

Ethernet interfaces use the OSPF **broadcast network type** by default. Each broadcast segment elects a **designated router (DR)** and a **backup designated router (BDR)**. Every other router is a **DROTHER**. A DROTHER becomes Full with the DR and the BDR only, and two DROTHERs stay at 2-Way with each other. A DROTHER sends its updates to `224.0.0.6`, where only the DR and BDR listen, and the DR floods them to everyone on `224.0.0.5`. The BDR holds the same information and takes over if the DR disappears.

The DR is a role for exchanging LSAs, not a gateway. User packets go straight to the best next hop, whichever router that is.

The election follows four rules:

1. The highest interface **priority** wins DR, and the next highest wins BDR. Priority is 0 through 255, default 1, set with `ip ospf priority`.
2. If priorities tie, the highest router ID wins.
3. Priority 0 means the interface can never be DR or BDR.
4. The election is **non-preemptive**. A working DR and BDR keep their roles when a better candidate arrives.

Priority is set per interface and the election runs per segment, not per area. In the figure below, suppose all three routers start together. R1 has priority 100 and becomes DR, R2 has 50 and becomes BDR, and R3 has 0 and is a DROTHER. Had all three kept the default priority of 1, the router IDs would decide: R3 (`3.3.3.3`) would be DR and R2 (`2.2.2.2`) BDR.

Now R1 fails. The BDR, R2, is promoted to DR. R3 cannot be BDR with priority 0, so the segment has none. When R1 returns it does not take the DR role back. It fills the vacant BDR role and R2 stays DR.

Rule 4 has a practical side. A router joining a broadcast segment listens for the **wait time**, equal to the dead interval, and accepts a DR that already exists. The first router up therefore usually becomes DR whatever its priority, so check whether a question describes a new election or existing roles.

:::trap Full is not required between every pair
A stable `2WAY/DROTHER` entry is normal when both local and remote routers are DROTHERs on a broadcast segment. The same state on an intended two-router point-to-point adjacency needs investigation.
:::

On an Ethernet link that joins exactly two routers, an election adds a wait and no benefit. Configure `ip ospf network point-to-point` on both interfaces. The frames are still Ethernet; only OSPF's treatment changes. There is no DR or BDR, the adjacency forms without the wait, and the neighbor state shows `FULL/ -`. Serial interfaces are point-to-point by default.

Set the same type on both ends. If one side is broadcast and the other point-to-point, the default timers still match and the neighbors reach Full, but the two routers describe the link differently in their LSAs, so the routes across it are missing.

```diagram
{ "type": "topology", "title": "Fig 21.2 — Elections belong to individual segments", "caption": "The shared LAN elects a DR and BDR; the separate two-router link can run as point-to-point.", "nodes": [
{ "id": "R1", "kind": "router", "label": "R1", "sub": "RID 1.1.1.1", "x": 2, "y": 1 },
{ "id": "SW", "kind": "switch", "label": "Shared Ethernet", "x": 6, "y": 1 },
{ "id": "R2", "kind": "router", "label": "R2", "sub": "RID 2.2.2.2", "x": 10, "y": 1 },
{ "id": "R3", "kind": "router", "label": "R3", "sub": "RID 3.3.3.3", "x": 6, "y": 5 }
], "links": [
{ "from": "R1", "to": "SW", "label": "priority 100" },
{ "from": "R2", "to": "SW", "label": "priority 50" },
{ "from": "R3", "to": "SW", "label": "priority 0" },
{ "from": "R1", "to": "R3", "label": "point-to-point", "style": "dashed" }
] }
```

## Cost and the best path

SPF needs a number for each link so that it can compare paths. That number is the **cost** of the outgoing interface. A route's metric is the sum of the outgoing interface costs from the calculating router to the destination, including the last router's interface onto the destination network. The lowest total wins.

IOS calculates the cost as reference bandwidth divided by interface bandwidth, rounded down, with a minimum of 1. The default reference bandwidth is 100 Mbps:

| Interface | Default reference (100 Mbps) | Reference 10000 Mbps |
|---|---|---|
| Ethernet, 10 Mbps | 10 | 1000 |
| FastEthernet, 100 Mbps | 1 | 100 |
| GigabitEthernet, 1 Gbps | 1 | 10 |
| TenGigabitEthernet, 10 Gbps | 1 | 1 |

With the default, OSPF cannot tell FastEthernet from 10-Gigabit Ethernet, because every result below 1 becomes 1. There are two fixes. `auto-cost reference-bandwidth 10000`, entered under `router ospf`, raises the reference; the value is in Mbps and should be the same on every router. `ip ospf cost 25`, entered on an interface, sets that interface's cost directly and overrides the calculation.

Work an example from R1 to R3's LAN, `192.168.30.0/24`. R1's interface on the direct link has cost 25. Its interface on the shared segment has cost 10. R3's LAN interface has cost 1. Through the direct link the total is 25 + 1 = **26**. Through the shared segment it is 10 + 1 = **11**, so R1 installs the shared path. If the shared adjacency fails while the direct one stays Full, R1 installs the cost-26 route instead.

Only outgoing interfaces count; R3's cost on the interface where the packet arrives is not added. Direction therefore matters: changing R1's cost changes R1's routes toward R3, while R3's routes back are still built from R3's own outgoing costs.

In `[110/11]`, 110 is the administrative distance and 11 is the OSPF cost. When two paths to a prefix have the same total cost, OSPF installs both; IOS allows up to four by default.

## Configuring single-area OSPFv2

Start with working, addressed interfaces. Then make three decisions: the process and its RID, which interfaces take part, and which of those may form neighbors. This is the pattern for R1:

```ios R1
R1# configure terminal
R1(config)# router ospf 10
R1(config-router)# router-id 1.1.1.1
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gigabitethernet0/0
R1(config-router)# network 10.0.123.1 0.0.0.0 area 0
R1(config-router)# network 192.168.10.1 0.0.0.0 area 0
R1(config-router)# end
```

The `network` command selects local interfaces. IOS compares each interface address with the address and **wildcard mask** in the command, and enables OSPF in the stated area on every interface that matches. In a wildcard mask, a 0 bit means "this bit must match" and a 1 bit means "ignore this bit". It is the inverse of a subnet mask, so subtract each octet of the mask from 255: `255.255.255.252` becomes `0.0.0.3`, and `255.255.255.0` becomes `0.0.0.255`.

R1's direct-link interface is `10.0.13.1/30`. Any of these statements selects it:

| Statement | Interface addresses it matches |
|---|---|
| `network 10.0.13.1 0.0.0.0 area 0` | Exactly 10.0.13.1 |
| `network 10.0.13.0 0.0.0.3 area 0` | 10.0.13.0 through 10.0.13.3 |
| `network 10.0.0.0 0.255.255.255 area 0` | Anything beginning with 10 |

All three advertise the same thing: the interface's own prefix, `10.0.13.0/30`. The wildcard only chooses local interfaces. It never sets the advertised prefix length, and it cannot advertise a network the router is not attached to. An interface at `172.16.5.33/27` selected with `network 172.16.5.33 0.0.0.0 area 0` is still advertised as `172.16.5.32/27`.

You can skip the `network` command and enable OSPF on the interface itself with `ip ospf 10 area 0` in interface mode. Both methods give the same result.

A **passive interface** is in OSPF but sends no Hellos, so no neighbor can form on it. Its network is still advertised through the router's other OSPF interfaces. Make client LANs passive, because only hosts live there, and never a transit link, because that blocks the adjacency you need. `passive-interface gigabitethernet0/2` makes one interface passive. `passive-interface default` makes every interface passive, including any enabled later, and `no passive-interface gigabitethernet0/0` then opens a transit link. That exception permits neighbors; it does not enable OSPF on the interface.

A branch can also learn its default route from OSPF. In this separate example, EDGE already has an area-0 adjacency toward the branch and an upstream link `10.255.0.1/30` to router `10.255.0.2`:

```ios EDGE
EDGE# configure terminal
EDGE(config)# ip route 0.0.0.0 0.0.0.0 10.255.0.2
EDGE(config)# router ospf 10
EDGE(config-router)# default-information originate
EDGE(config-router)# end
EDGE# show ip route
```

The static route is EDGE's own default. `default-information originate` advertises a default into OSPF for as long as EDGE has one in its routing table. Adding the `always` keyword advertises it regardless.

On the branch router, `show ip route ospf` shows the learned default as `O*E2 0.0.0.0/0`. `E2` marks an external route, one that entered OSPF from another source, and `*` marks a candidate default. Chapter 44 reuses this pattern.

## Verify and troubleshoot

Check OSPF in the order it builds: interfaces, neighbors, then routes. These representative outputs are from R1 in the example topology.

```output R1# show ip ospf interface gigabitethernet0/0 — representative, abbreviated
GigabitEthernet0/0 is up, line protocol is up
  Internet Address 10.0.123.1/24, Area 0                              ← must match the neighbor
  Process ID 10, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 10
  Transmit Delay is 1 sec, State DR, Priority 100                     ← R1's role on this segment
  Designated Router (ID) 1.1.1.1, Interface address 10.0.123.1
  Backup Designated router (ID) 2.2.2.2, Interface address 10.0.123.2
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5  ← must match the neighbor
```

```output R1# show ip ospf neighbor — representative
Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2          50   FULL/BDR        00:00:33    10.0.123.2      GigabitEthernet0/0
3.3.3.3           0   FULL/DROTHER    00:00:38    10.0.123.3      GigabitEthernet0/0
3.3.3.3           0   FULL/  -        00:00:31    10.0.13.2       GigabitEthernet0/1
```

Neighbor ID is the neighbor's RID, not an interface address. State shows the adjacency state, then the neighbor's role; `-` means the link has no DR. Dead Time counts down from 40 and resets with each Hello. Address is the neighbor's interface address and Interface is the local interface. R3 appears twice because R1 reaches it on two links.

```output R1# show ip route ospf — representative
O    192.168.30.0/24 [110/11] via 10.0.123.3, 00:00:22, GigabitEthernet0/0  ← AD 110, cost 11, first-hop address
```

| Symptom | Likely cause | Check |
|---|---|---|
| No neighbor listed | Interface down, not in OSPF, or passive; area, subnet or timers differ | `show ip ospf interface` on both ends |
| 2-Way where Full is expected | Every router has priority 0, so no DR exists | `ip ospf priority` on the segment |
| Full, but a route is missing | Far LAN not in OSPF, network types differ, or a static route holds the prefix | Far router's OSPF interfaces; `show ip route` |
| Route present, client still fails | Host mask or gateway, return route, filtering | Ping from the client LAN |

With an MTU mismatch, the router with the smaller MTU shows its neighbor in ExStart and the other router shows Exchange. Neither reaches Full. Compare `show ip interface` on both ends and make the MTUs equal; `ip ospf mtu-ignore` only skips the check.

Test the finished path from the clients, or with a client-LAN source such as `ping 192.168.30.1 source 192.168.10.1`. A ping sourced from a transit address can succeed while the far router has no route back to the client LAN.

## Exam focus

- Know the numbers: protocol 89, distance 110, Hello 10 and dead 40, 224.0.0.5 and 224.0.0.6, default priority 1, reference bandwidth 100 Mbps.
- Separate neighbors, the LSDB, SPF and installed routes.
- Apply the RID order: `router-id`, highest loopback, highest other interface. The process ID is local.
- List what must match for neighbors (area, subnet, timers, authentication) and what must differ (RID).
- Predict DR and BDR from priority, then RID, then existing roles. 2-Way between DROTHERs is normal.
- Add outgoing interface costs in the direction of travel.
- Write a `network` statement with the correct wildcard, make client LANs passive, and verify the path in both directions.

OSPFv2 is required in both tracks; v2.0 adds OSPFv3 in Chapter 22.
