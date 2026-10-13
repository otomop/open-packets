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
## OSPF for IPv6

:::facts
- OSPFv3 for IPv6 uses IPv6 **Next Header 89**, without TCP or UDP.
- On ordinary links, OSPFv3 packets use a **link-local source address**. Hellos use **ff02::5**; **ff02::6** identifies the DR/BDR group.
- Router IDs remain **32-bit dotted-decimal identifiers**, even on IPv6-only routers.
- IOS defaults for the broadcast and point-to-point network types studied here are Hello **10 seconds**, dead **40 seconds**, interface priority **1**, and OSPF administrative distance **110**.
- Chapter 22 directly supports v2.0. OSPFv3 is additional practice for the v1.1 track.
:::

**OSPFv3** provides the OSPF mechanisms from Chapter 21 for an IPv6 network: discover neighbors, synchronize link-state information, calculate shortest paths, and install routes. You are learning the address and configuration differences, not a completely different routing algorithm.

Consider an IPv6-only branch. R1 needs a route to R3's LAN, and R3 needs a route back to R1's LAN. Both routers can communicate with adjacent routers using link-local addresses while advertising global unicast prefixes for end-to-end forwarding. The adjacency's address and the final packet destination therefore serve different purposes.

The original OSPFv3 specification supports IPv6. Later address-family extensions also support IPv4; that does not mean an OSPFv2 neighbor becomes an OSPFv3 neighbor automatically. For this course's v2.0 objective, use OSPFv2 for IPv4 and OSPFv3 for IPv6. The two processes do not exchange LSAs with each other.

Before configuration, verify the IPv6 basics from Chapter 19: a /64 LAN prefix, a usable interface address, an IPv6 default gateway on each host, and link-local scope. A successful ping to a directly attached global address proves less than a successful ping between the two client LANs.

## What changes from OSPFv2

| Feature | OSPFv2 for IPv4 | OSPFv3 for IPv6 |
|---|---|---|
| Neighbor packet source on an ordinary link | IPv4 interface address | IPv6 link-local address |
| AllSPFRouters multicast | `224.0.0.5` | `ff02::5` |
| AllDRouters multicast | `224.0.0.6` | `ff02::6` |
| Router ID | 32-bit dotted decimal | 32-bit dotted decimal |
| Typical IOS route next hop | IPv4 address | Link-local IPv6 address plus interface |

IPv6 link-local addresses identify a neighbor on one link; routers do not forward a packet whose destination is link-local across the network. In a route such as `via FE80::3, GigabitEthernet0/0`, the next hop is reachable through that specific interface. The forwarded packet can still have the remote global destination `2001:db8:30::10`. OSPF is not converting that destination into a link-local address. The transit can even have only valid link-local addresses: it needs IPv6 enabled, usable neighbor relationships and routes to the global client prefixes in both directions, but no global transit prefix is required for this forwarding role. This extends the scoped-next-hop reasoning from Chapter 20.

An OSPFv3 Hello does not contain the OSPFv2 subnet-mask field. Routers on the same link can establish an adjacency even if their global prefixes differ, provided the actual OSPF and link-local requirements are met. This flexibility is not a reason to misaddress a shared LAN. A Full neighbor entry cannot certify that hosts have the intended global prefix or gateway.

OSPFv3 separates topology descriptions from prefix information. Router and Network LSAs describe connections; other advertisements associate IPv6 prefixes with that topology and supply link information. That distinction explains how a neighbor relationship can work while a destination prefix is absent. You do not need a catalogue of LSA type numbers or multi-area flooding scopes to configure and verify this single-area network.

No authentication is configured in the examples. The v2.0 adjacency objective explicitly excludes authentication. OSPFv3 has security mechanisms beyond its original specification, so avoid the blanket claim that OSPFv3 always uses IPsec or has no other authentication options.

## Router ID and neighbour requirements

Set the RID explicitly on every router. `router-id 2.2.2.2` is valid on an IPv6-only router because it is an identifier, not an instruction to add an IPv4 interface. Classic IOS automatic selection relies on eligible IPv4 addresses; when none exist, an explicit RID avoids a process that cannot obtain one. Never derive an OSPF RID by truncating an IPv6 address.

Keep three identifiers separate: the local process ID chooses a configuration process, the router ID identifies a router, and the **instance ID** distinguishes OSPFv3 instances on a link. For the classic IPv6-unicast syntax used in the Packet Tracer lab, the default instance ID is 0. Neighbors must use compatible instance IDs on their common link; their locally significant process numbers may differ. Address-family implementations use instance values appropriate to the family, so compare the actual interface output when mixing syntax families.

Both interfaces must be operational, have IPv6 enabled and valid link-local addressing, participate in the same area, and allow OSPF packets. Compare Hello/dead timers and ensure the interface is not passive. Router IDs must be unique, and a duplicated link-local address on the same link is also a fault. Configure matching intended network types; inspect MTUs when database synchronization fails.

A common beginner mistake is entering `ipv6 ospf 10 area 0` without enabling router-wide IPv6 forwarding. `ipv6 unicast-routing` is part of this routed lab's setup. Another is placing the process only on transit links. That can produce perfect neighbors while never advertising either client LAN.

:::trap A dotted-decimal RID is not an IPv4 next hop
In `show ipv6 ospf neighbor`, `2.2.2.2` identifies the neighboring OSPF router. It does not mean IPv4 routing is required or that an IPv6 packet is forwarded to that dotted-decimal address.
:::

## Broadcast and point-to-point operation

The neighbor-state reasoning transfers from OSPFv2. **2-Way** establishes bidirectional Hello recognition. **Full** means database synchronization completed for an adjacency. Two DROTHERs on the same broadcast segment can stay 2-Way while each is Full with the DR and BDR.

Ethernet is broadcast by default. The election uses the highest eligible interface priority, then the highest RID. Priority 0 is ineligible; the IOS priority range is 0–255. An existing DR and BDR are not replaced merely because a new router has a better priority. When the DR fails, the surviving BDR is promoted. OSPFv3 identifies these routers by RID in protocol information; do not use the numerically highest global IPv6 address to predict the election.

For an isolated Ethernet link with exactly two routers, configure `ipv6 ospf network point-to-point` on both ends in classic syntax. The state `FULL/ -` shows a synchronized adjacency without a DR/BDR role. On a shared segment with three routers, retain broadcast operation so all routers describe the same topology.

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

## Cost and advertised prefixes

OSPFv3 still chooses a lower total path cost. IOS automatic costs use reference bandwidth divided by interface bandwidth, with minimum 1; the normal default reference is 100 Mbps. For a consistent 10-Gbps reference, configure `auto-cost reference-bandwidth 10000` on every router in the process design. Alternatively set explicit per-interface costs with `ipv6 ospf cost` in classic syntax.

Suppose R1 has two ways to R3. The shared transit's outgoing cost is 10; a direct point-to-point link costs 25. R3's LAN interface costs 1. R1's route to `2001:db8:30::/64` should cost 11 through the shared segment, or 26 through the direct link if the preferred adjacency fails. The next-hop address changes with the selected link. It does not change the destination prefix.

Include the remote LAN's cost once. Do not add the receiving interface's cost, and do not add the local PC-facing interface cost to R1's routing-table metric. The table describes a path beginning at R1. A reverse path is calculated independently at R3 and could be different if costs differ by direction.

An OSPF-enabled physical LAN advertises its configured prefix. A loopback behaves differently on classic IOS: OSPF normally advertises its IPv6 address as a /128 host route even when the address command uses /64. A deliberately chosen point-to-point network type on the loopback can advertise the prefix instead. Verify rather than assuming that every /64 address command creates a learned /64 route. The main lab uses physical LANs to keep client reachability separate from loopback-specific behavior.

Before continuing, work a prefix check without configuration. R3 has `2001:db8:30::1/64` on an up physical client interface, but OSPF runs only on its transit interface. R1 can be Full with R3 and still have no route to `2001:db8:30::/64`. Making the client interface passive does not fix the missing activation. Enable the client interface in the process and retain its passive setting. After convergence, verify the /64 on R1, then test a packet sourced from R1's client LAN. This last test also needs R3 to know R1's client prefix; the forward advertisement is only half of the path.

## Configuring OSPFv3

Classic IPv6-specific IOS syntax is useful on Packet Tracer router images. This R1 pattern assumes the interfaces have already been addressed:

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

The process settings do not select interfaces by themselves. Each intended interface needs its activation command. There is no IPv4-style `network ADDRESS WILDCARD` statement in this configuration. A passive LAN still needs activation so its prefix is advertised.

Current IOS XE also supports an **address-family syntax**. An address family names the type of routes being carried; here `ipv6 unicast` selects IPv6 unicast routing within the process. Recognize this alternative on a clean supported image; do not paste it over a completed classic-syntax lab as an unplanned migration:

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

Use `show ospfv3 neighbor` and `show ospfv3 interface` for that syntax family. Platform and release determine exact syntax and migration behavior. The guided lab provides a complete classic configuration and a paper translation exercise when the simulator lacks the newer commands.

## Verify and troubleshoot

These shortened examples are authored representative output, not a recorded simulator run:

```output R1# show ipv6 ospf neighbor — representative
Neighbor ID     Pri   State           Dead Time   Interface ID   Interface
3.3.3.3           0   FULL/DROTHER    00:00:36    3              GigabitEthernet0/0  ← 3 is the neighbor's interface ID
```

The final interface is R1's local interface; the Interface ID column belongs to the neighbor. Use detailed neighbor/interface output when you need its link-local address. The same RID can appear on two rows when routers share two links.

```output R1# show ipv6 route ospf — representative
O   2001:DB8:30::/64 [110/11]  ← administrative distance and total cost
     via FE80::3, GigabitEthernet0/0  ← next hop must be interpreted with its link
```

Verify in layers. `show ipv6 interface brief` checks address and operational state. `show ipv6 ospf interface` checks process, area, RID, network type, timers, cost, and instance. `show ipv6 ospf neighbor` checks relationships. `show ipv6 route ospf` checks installed prefixes, while `show ipv6 route` also reveals competing routes. Finish with client-to-client ping and a route back to the source network.

An empty neighbor table suggests activation, area, instance, timers, passive settings, or link communication. Repeated ExStart/Exchange suggests investigating MTU and database exchange, not immediately disabling the MTU check. Full neighbors with a missing LAN suggest an inactive LAN or missing interface activation. Full neighbors with failed client traffic require checking host parameters and both directions of routing.

After changing an active RID, a controlled classic IOS restart can use `clear ipv6 ospf 10 process`. Check the release's help first, record the active RID, and expect adjacency disruption. A local restart does not guarantee that this router becomes DR: surviving segment roles remain relevant. Restore any deliberate fault before saving configuration.

## Exam focus

Configure a unique RID, IPv6 forwarding, interface activation, area 0, and passive client LANs. Explain why link-local addresses appear as next hops and why a RID still looks like IPv4. Predict broadcast elections using existing roles and priority, recognize a point-to-point adjacency, calculate path cost, and verify both client networks. Detailed multi-area LSA analysis and authentication setup are not needed for this chapter's stated objective.
