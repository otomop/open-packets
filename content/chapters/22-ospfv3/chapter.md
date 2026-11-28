---
id: ospfv3
number: 22
title: OSPFv3
subtitle: Configure IPv6 routing with link-local neighbors, explicit router IDs, and verifiable paths.
part: routing
domain: routing
minutes: { lesson: 65, lab: 85 }
summary: Apply single-area OSPF to IPv6. Separate router IDs from IPv6 next hops, configure both supported IOS syntax families, interpret broadcast and point-to-point neighbors, and prove remote prefixes work.
objectives:
  v1: []
  v2: ["3.3", "3.3.a", "3.3.b", "3.3.c", "3.3.d"]
prereqs: [ospfv2, ipv6-addressing, static-routing-ipv6]
sectionIds:
  OSPF for IPv6: why-ospf-needed-a-new-version
  What changes from OSPFv2: what-changed-and-what-stayed
  Broadcast and point-to-point operation: network-types-point-to-point-and-broadcast
sources:
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "RFC 5340: OSPF for IPv6", url: "https://www.rfc-editor.org/rfc/rfc5340.html" }
  - { title: "RFC 5838: OSPFv3 address families", url: "https://www.rfc-editor.org/info/rfc5838" }
  - { title: "Cisco IOS: IPv6 Routing with OSPFv3", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/ip6-route-ospfv3.html" }
  - { title: "Cisco IOS XE 17: IPv6 Routing with OSPFv3", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_ip6-route-ospfv3-xe.html" }
  - { title: "Cisco: Implementing OSPFv3 and interface configuration", url: "https://www.cisco.com/en/US/docs/ios-xml/ios/ipv6/configuration/15-0sy/ip6-ospf.html" }
  - { title: "Cisco: IPv6 command reference, show ipv6 ospf", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6/command/ipv6-cr-book/ipv6-s4.html" }
  - { title: "Cisco: OSPF MTU and LSA packing", url: "https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/116119-technote-ospf-mtu-00.html" }
---
In Chapter 20 you typed a static IPv6 route on R1 for the remote LAN and another on the far router for the reply. Add a third router, a second path or a link that fails overnight, and somebody has to retype routes by hand. Chapter 21 fixed this for IPv4 with OSPFv2: routers find their neighbors, share a map of the area and calculate the routes themselves. Your IPv6 network needs the same service.

**OSPFv3** is OSPF for IPv6. Most of Chapter 21 carries over unchanged, so this chapter concentrates on what is different: how you switch it on, why neighbors and next hops are link-local addresses, and why a router with no IPv4 address still needs an IPv4-style router ID. By the end you will be able to configure single-area OSPFv3 on three routers, predict the DR and BDR, calculate a route's cost and trace a missing prefix to its cause.

## OSPF for IPv6

:::facts
- OSPFv3 for IPv6 uses IPv6 **Next Header 89**, without TCP or UDP.
- On ordinary links, OSPFv3 packets use a **link-local source address**. Hellos use **ff02::5**; **ff02::6** identifies the DR/BDR group.
- Router IDs remain **32-bit dotted-decimal identifiers**, even on IPv6-only routers.
- IOS defaults for the broadcast and point-to-point network types studied here are Hello **10 seconds**, dead **40 seconds**, interface priority **1**, and OSPF administrative distance **110**.
- OSPFv3 is enabled on each interface with `ipv6 ospf PROCESS area AREA`. It has no `network` statement, and the router needs `ipv6 unicast-routing`.
- Chapter 22 directly supports v2.0. OSPFv3 is additional practice for the v1.1 track.
:::

OSPFv3 does the same four jobs as OSPFv2: it discovers neighbors with Hellos, synchronizes a link-state database, runs the shortest-path calculation and installs the best routes. The neighbor states, the DR and BDR, the cost metric, areas and administrative distance 110 are unchanged. You are learning new addresses and new commands, not a new algorithm.

The chapter uses one IPv6-only branch. PC-A is on R1's LAN `2001:db8:10::/64` and PC-B is on R3's LAN `2001:db8:30::/64`. R1, R2 and R3 share an Ethernet segment, and R1 and R3 also have a direct link. Each router needs a route to the other LAN, and both should move to the other link if one fails.

OSPFv2 and OSPFv3 are separate protocols with separate neighbor tables and databases. A dual-stack router runs both, OSPFv2 for IPv4 and OSPFv3 for IPv6, and a Full OSPFv2 neighbor tells you nothing about IPv6.

OSPFv3 advertises only what IPv6 already has, so check the Chapter 19 basics first: interfaces up and addressed, hosts with a /64 address and a gateway, and `ipv6 unicast-routing` configured. Without that global command the router does not forward IPv6, and IOS refuses the OSPFv3 commands.

## What changes from OSPFv2

The biggest change is where OSPF runs. OSPFv2 runs on an IPv4 subnet: two routers become neighbors only when their addresses share a subnet and mask. OSPFv3 runs on a **link**. Routers on the same link talk from their link-local addresses, so the adjacency does not depend on global prefixes.

| Feature | OSPFv2 for IPv4 | OSPFv3 for IPv6 |
|---|---|---|
| Enabled by | `network` statement, or `ip ospf` on the interface | `ipv6 ospf` on the interface only |
| Neighbor packet source on an ordinary link | IPv4 interface address | IPv6 link-local address |
| AllSPFRouters multicast | `224.0.0.5` | `ff02::5` |
| AllDRouters multicast | `224.0.0.6` | `ff02::6` |
| Router ID | 32-bit dotted decimal | 32-bit dotted decimal |
| Typical IOS route next hop | IPv4 address | Link-local IPv6 address plus interface |

**Next hops are link-local.** R1 hears R3's Hellos from a link-local source, so that is the address it installs as the next hop. Fig 22.1 shows the direct R1–R3 link, where R1's route reads `via FE80::13:3, GigabitEthernet0/1`. The interface is part of the next hop because `fe80::13:3` has meaning only on that link (Chapter 20). The packet is not readdressed: it keeps the destination `2001:db8:30::10` from end to end, and R1 uses the link-local address only to find R3's MAC address for the next frame.

```diagram
{ "type": "topology", "title": "Fig 22.1 — A global destination and a link-local next hop", "caption": "R1 forwards toward R3's link-local address on the transit link while the IPv6 destination stays PC-B.", "nodes": [
{ "id": "A", "kind": "pc", "label": "PC-A", "sub": "2001:db8:10::10", "x": 0.5, "y": 3 },
{ "id": "R1", "kind": "router", "label": "R1", "sub": "RID 1.1.1.1", "x": 4, "y": 3 },
{ "id": "R3", "kind": "router", "label": "R3", "sub": "RID 3.3.3.3", "x": 8, "y": 3 },
{ "id": "B", "kind": "pc", "label": "PC-B", "sub": "2001:db8:30::10", "x": 11.5, "y": 3 }
], "links": [
{ "from": "A", "to": "R1", "label": "LAN 10" },
{ "from": "R1", "to": "R3", "label": "FE80::13:1 / FE80::13:3" },
{ "from": "R3", "to": "B", "label": "LAN 30" }
],"trace":{"flows":[{"path":["A","R1","R3","B"],"label":"IPv6 to 2001:db8:30::10","tags":{"A":"Dst 2001:db8:30::10 (global)","R1":"Next hop FE80::13:3 (link-local)"}}]} }
```

A router-to-router link can therefore run OSPFv3 with link-local addresses alone. Only the client LANs need global prefixes.

**The Hello carries no subnet.** An OSPFv2 Hello includes the sender's subnet mask, and a mismatch blocks the adjacency. The OSPFv3 Hello has no mask or prefix. Two routers on one link with `2001:db8:1::1/64` and `2001:db8:2::2/64` still reach Full, so a Full neighbor no longer tells you that the global addressing on the link is right.

**Prefixes travel separately from topology.** OSPFv3's Router and Network LSAs describe only which routers connect to what. Two new LSAs carry the addresses: the Link LSA (type 8) and the Intra-Area-Prefix LSA (type 9). You do not need those numbers for single-area configuration, but the split explains a symptom you will meet in the lab: neighbors are Full and a LAN prefix is still missing, because its interface was never enabled for OSPFv3.

**Authentication moved out of OSPF.** OSPFv3 has no authentication fields in its header. It relies on IPsec, or on an authentication trailer added later. The exam's adjacency objective excludes authentication.

## Router ID and neighbour requirements

The router ID is the one place IPv4 notation survives. OSPFv3 still names each router with a 32-bit number in dotted decimal, such as `1.1.1.1`. It is a name, not an address: nothing is sent to it and no interface has to hold it.

IOS picks the RID in the same order as OSPFv2:

1. the `router-id` command;
2. otherwise the highest IPv4 address on an up loopback;
3. otherwise the highest IPv4 address on another up interface.

On an IPv6-only router, steps 2 and 3 find nothing. The process cannot start and IOS logs `%OSPFv3-4-NORTRID: OSPFv3 process 10 could not pick a router-id, please configure manually`. So set the RID on every router. `router-id 2.2.2.2` is valid on a router with no IPv4 address, and an IPv6 address is never accepted in its place.

Keep three identifiers apart:

- The **process ID** in `ipv6 router ospf 10` is local to the router. R1 can use 10 while R2 uses 20.
- The **router ID** must be unique. Two neighbors with the same RID never form an adjacency.
- The **instance ID** travels in every OSPFv3 packet so that separate instances can share one link. It defaults to 0, and neighbors must use the same value.

Two routers on a link become OSPFv3 neighbors when all of these hold:

- both interfaces are up, have IPv6 enabled and are enabled for OSPFv3, and neither is passive;
- the area ID matches;
- the Hello and dead intervals match;
- the instance ID matches;
- the router IDs differ.

Process IDs, global prefixes and interface priorities do not have to match. OSPFv2's "same subnet and mask" requirement is gone, and the instance ID is new.

Two mismatches pass the Hello check and cause trouble later. Different IPv6 MTUs stall the neighbors in ExStart or Exchange. Different network types, one end broadcast and the other point-to-point, can reach Full while the routes across the link go missing.

Try it. R1 uses process 10, RID 1.1.1.1, area 0 and timers 10/40. R2 uses process 20, RID 2.2.2.2, area 0 and timers 10/40, and its global address is in a different /64. They become neighbors. Change R2's Hello interval to 5 and the adjacency drops as the dead timers expire.

:::trap A dotted-decimal RID is not an IPv4 next hop
In `show ipv6 ospf neighbor`, `2.2.2.2` identifies the neighboring OSPF router. It does not mean IPv4 routing is required or that an IPv6 packet is forwarded to that dotted-decimal address.
:::

## Broadcast and point-to-point operation

OSPFv3 treats Ethernet exactly as OSPFv2 does. An Ethernet interface is network type **broadcast** by default, so the routers on the segment elect a DR and a BDR. Every other router is a DROTHER: it becomes Full with the DR and BDR and stays 2-Way with other DROTHERs. A stable `2WAY/DROTHER` entry between two DROTHERs is healthy.

The election rules are the same too:

- The highest interface priority wins. The default is 1, the range is 0–255, and priority 0 means "never DR or BDR".
- A tie goes to the highest router ID. IPv6 addresses play no part.
- There is no preemption. A router that joins later with a better priority stays a DROTHER until a role is free.
- When the DR fails, the BDR becomes DR and a new BDR is elected.

Work through the lab's shared segment. R1 has priority 100, R2 has 50 and R3 has 0, each set with `ipv6 ospf priority`. In a fresh election R1 becomes DR and R2 becomes BDR. R3 is a DROTHER whatever its RID. If R1 fails, R2 is promoted to DR and the segment has no BDR, because R3 is not eligible. When R1 returns it becomes BDR, not DR: R2 keeps the role it holds. Had all three kept priority 1, the RIDs would decide, making 3.3.3.3 the DR and 2.2.2.2 the BDR.

A link with exactly two routers has no use for a DR. Configure `ipv6 ospf network point-to-point` on both ends of the direct R1–R3 link. The routers skip the election, and the neighbor shows as `FULL/ -`, where the dash means that no DR or BDR role applies. Keep broadcast on the shared segment with three routers.

## Cost and advertised prefixes

OSPFv3 chooses the path with the lowest total cost, using the same arithmetic as OSPFv2. An interface's cost is the reference bandwidth divided by the interface bandwidth, with a minimum of 1. The default reference is 100 Mbps, so a 10-Mbps interface costs 10, and FastEthernet, GigabitEthernet and anything faster all cost 1. To tell fast links apart, either raise the reference on every router (`auto-cost reference-bandwidth 10000` under the process makes 1 Gbps cost 10) or set each cost yourself with `ipv6 ospf cost`. The lab sets them explicitly.

A route's metric is the sum of the **outgoing** interface costs from the calculating router to the destination, including the interface that owns the destination prefix.

Suppose R1 has two ways to reach R3's LAN `2001:db8:30::/64`. R1's shared interface Gi0/0 costs 10, its direct interface Gi0/1 costs 25, and R3's LAN interface costs 1. Through the shared segment the total is 10 + 1 = 11, so R1 installs `[110/11] via FE80::3, GigabitEthernet0/0`. Through the direct link the total is 25 + 1 = 26. R1 uses that route only if the shared adjacency fails, and the next hop becomes `FE80::13:3` on Gi0/1. The next hop changes with the link; the destination prefix does not.

Count each link once, on the way out. Do not add the cost of the interface a packet arrives on, or R1's own PC-facing interface. R3 calculates the return route from its own outgoing costs, so the two directions can use different links.

A prefix is advertised when its interface is up and enabled for OSPFv3. Passive only stops the Hellos. Try this check. R3 has `2001:db8:30::1/64` on Gi0/2, which is up, but OSPFv3 is enabled only on R3's transit interfaces. R1 is Full with R3 and has no route to `2001:db8:30::/64`. Making Gi0/2 passive changes nothing, because the interface is not in OSPF at all. Enable OSPFv3 on Gi0/2, then confirm the /64 on R1 and ping from PC-A to PC-B. That ping also needs R3 to hold a route back to R1's LAN.

Loopbacks are a special case. OSPFv3 advertises a loopback's address as a /128 host route even when it was configured with /64, unless the loopback's network type is set to point-to-point.

## Configuring OSPFv3

Configuration has three parts: turn on IPv6 routing, create the process and give it a router ID, then enable each interface. OSPFv3 has no `network` statement, so an interface without its own OSPFv3 command is not in OSPF.

Packet Tracer routers use the classic IPv6-specific syntax. This R1 example assumes the interfaces are already addressed:

```ios R1
R1# configure terminal
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 router ospf 10
R1(config-rtr)# router-id 1.1.1.1
R1(config-rtr)# passive-interface default
R1(config-rtr)# no passive-interface gigabitethernet0/0
R1(config-rtr)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 ospf 10 area 0
R1(config-if)# exit
R1(config)# interface gigabitethernet0/2
R1(config-if)# ipv6 ospf 10 area 0
R1(config-if)# end
```

`ipv6 router ospf 10` creates process 10 and `router-id` names the router. `passive-interface default` silences Hellos on every interface, and `no passive-interface gigabitethernet0/0` makes the transit link the exception. The two `ipv6 ospf 10 area 0` lines put the transit link and the client LAN into area 0. The LAN stays passive and is still advertised.

The interface commands from Chapter 21 keep their meaning when you replace `ip` with `ipv6`: `ipv6 ospf cost 25`, `ipv6 ospf priority 100`, `ipv6 ospf network point-to-point`, `ipv6 ospf hello-interval 5` and `ipv6 ospf dead-interval 20`. The show commands change the same way, as in `show ipv6 ospf neighbor`.

Current IOS XE also offers an **address-family syntax**, in which one `router ospfv3` process can hold an IPv6 family and an IPv4 family. The protocol on the wire is the same, so a router configured this way becomes a neighbor of one that uses the classic commands. Learn to recognize it:

```ios R1
R1# configure terminal
R1(config)# ipv6 unicast-routing
R1(config)# router ospfv3 10
R1(config-router)# router-id 1.1.1.1
R1(config-router)# address-family ipv6 unicast
R1(config-router-af)# passive-interface default
R1(config-router-af)# no passive-interface gigabitethernet0/0
R1(config-router-af)# exit-address-family
R1(config-router)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ospfv3 10 ipv6 area 0
R1(config-if)# exit
R1(config)# interface gigabitethernet0/2
R1(config-if)# ospfv3 10 ipv6 area 0
R1(config-if)# end
```

Here the interface command is `ospfv3 10 ipv6 area 0`, and you verify with `show ospfv3 neighbor` and `show ospfv3 interface`. The lab uses classic syntax and ends with a paper translation into this form.

## Verify and troubleshoot

Verify in the order OSPF builds things:

1. `show ipv6 interface brief` for interface state and addresses.
2. `show ipv6 ospf interface` for area, router ID, network type, cost, timers, DR and BDR.
3. `show ipv6 ospf neighbor` for each neighbor and its state.
4. `show ipv6 route ospf` for the installed prefixes and next hops.
5. A ping from PC-A to PC-B, which needs routes in both directions.

```output R1# show ipv6 ospf neighbor — representative
Neighbor ID     Pri   State           Dead Time   Interface ID   Interface
3.3.3.3           0   FULL/DROTHER    00:00:36    3              GigabitEthernet0/0  ← 3 is the neighbor's interface ID
```

`3.3.3.3` is the neighbor's router ID and the last column is R1's own interface. `Interface ID` is a number the neighbor gave its interface, not an address. Priority 0 explains why R3 is a DROTHER. The same RID appears on two rows when two routers share two links.

```output R1# show ipv6 route ospf — representative
O   2001:DB8:30::/64 [110/11]  ← administrative distance and total cost
     via FE80::3, GigabitEthernet0/0  ← next hop must be interpreted with its link
```

`O` marks an intra-area OSPF route, 110 is the administrative distance and 11 is the cost calculated earlier.

| Symptom | Usual cause |
|---|---|
| OSPFv3 commands refused | `ipv6 unicast-routing` is missing |
| `NORTRID` message, no neighbors | No router ID on an IPv6-only router |
| Neighbor table empty | Interface down, passive or not enabled for OSPFv3; area, timers or instance ID differ |
| Stuck in ExStart or Exchange | MTU mismatch. Correct the MTU instead of disabling the check |
| Neighbors Full, a LAN prefix missing | That LAN interface is down or not enabled for OSPFv3 |
| Routes present, client ping fails | A host's prefix or gateway, or the route back |

A router ID changed on a running process takes effect after `clear ipv6 ospf 10 process`. The command drops that router's adjacencies. It does not win back the DR role, because the routers that stayed up keep their roles.

## Exam focus

Be able to do each of these without notes:

- Configure single-area OSPFv3: `ipv6 unicast-routing`, `ipv6 router ospf`, a manual `router-id`, and `ipv6 ospf PROCESS area 0` on every transit and LAN interface, with client LANs passive.
- Explain the link-local next hop and the IPv4-style router ID.
- List what must match between neighbors (area, timers, instance ID) and what need not (process ID, global prefix, priority).
- Predict the DR and BDR from priority and router ID, allowing for existing roles, and recognize `FULL/ -` as point-to-point.
- Add outgoing interface costs to get a route's metric, and read `[110/11]`.
- Trace a missing prefix: Full neighbors do not prove that a LAN interface is in OSPF.

Multi-area LSA analysis and authentication setup are outside this chapter's objective.
