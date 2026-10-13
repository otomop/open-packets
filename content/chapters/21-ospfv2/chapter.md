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
## How OSPF learns the topology

:::facts
- OSPFv2 carries IPv4 routes and uses IP protocol number **89**, not a TCP or UDP port.
- On Cisco IOS, the default OSPF administrative distance is **110**.
- This chapter uses one area, **area 0**, throughout.
- For the broadcast and point-to-point interfaces studied here, normal IOS defaults are Hello **10 seconds** and dead **40 seconds**.
- A lower total **cost** is better. A higher OSPF interface **priority** is better for DR/BDR election. These select different things.
:::

A static route records a forwarding decision that you supply. **Open Shortest Path First (OSPF)** lets routers exchange information and calculate paths as the topology changes. It is a **link-state routing protocol**: a router describes its participating links in **link-state advertisements (LSAs)**, and routers in an area synchronize that information in a **link-state database (LSDB)**.

Each router runs the **shortest path first (SPF)** calculation with itself as the starting point. Routers can agree about the topology and still have different next hops: R1 and R3 begin their calculations in different places. The useful output is a set of candidate routes. The routing table then compares these with other route sources, and packet forwarding still uses longest prefix matching as explained in Chapter 17.

Keep three kinds of evidence separate. The neighbor table tells you which routers are communicating. The LSDB contains the information available to the calculation. The routing table tells you which routes were installed. A Full adjacency does not promise an OSPF route to every subnet: the far LAN might not participate, or a connected or static route might already be preferred.

Imagine two branches attached to R1 and R3. Advertising both branch LANs lets each router learn the remote destination and the return path. PCs continue using their ordinary default gateways; they do not become OSPF neighbors. Area 0 is the backbone area and is a straightforward choice for this single-area exercise. Multi-area design, redistribution, and detailed LSA-type memorization are outside this chapter's practical scope.

## Router ID and process ID

The **router ID (RID)** is a 32-bit identifier displayed in dotted-decimal notation, such as `1.1.1.1`. It identifies the originating router in OSPF information. It must be unique within this routing domain; it need not be a reachable interface address when manually configured.

On the IOS implementation used here, an explicit `router-id` takes precedence. Without one, selection normally uses the highest IPv4 address on an eligible, up loopback interface; if there is no such loopback, it uses the highest eligible active IPv4 interface address. For example, an up loopback at `10.1.1.1` takes precedence over an up physical interface at `192.168.1.1`. The loopback preference is applied before comparing numeric addresses. Use explicit IDs in your labs so startup order and interface state do not obscure the intended result.

The **process ID** in `router ospf 10` selects a local configuration process. It is not the identity announced to neighbors. IOS accepts process IDs from 1 through 65535, and R1's process 10 can form an adjacency with R2's process 20. By contrast, the area assigned to their common link must agree: area `0` and `0.0.0.0` are equivalent notations.

Configure the RID before enabling OSPF interfaces. Changing the configured RID on an already running IOS process may require a process restart to apply; check `show ip ospf` for the active RID. `clear ip ospf process` is disruptive: it drops the local process's adjacencies. It is appropriate only during an authorized lab or maintenance change, not as a first response to a missing route. Restarting one router also does not erase surviving neighbors' DR/BDR history.

## From neighbor discovery to a full adjacency

A **Hello** discovers and maintains neighbors. On a normal IPv4 Ethernet segment, OSPF Hellos go to `224.0.0.5` (AllSPFRouters). `224.0.0.6` identifies the designated routers for exchanges that use that group. These are local-link control multicasts, not ordinary traffic forwarded between subnets.

For two addressed Ethernet interfaces to establish the intended relationship, first establish Layer 1/2 connectivity and a common IPv4 subnet with matching masks. Enable OSPF on both interfaces in the same area. Compare Hello/dead intervals and ensure neither interface is passive. Router IDs must be different. Compatible network types matter to correct adjacency and route calculation; configure both ends of a two-router point-to-point link consistently.

Authentication, when configured, is another compatibility requirement, but authentication configuration is excluded from v2.0 objective 3.3.a and is not used in this lab. An ACL or other filtering can also prevent protocol 89 from reaching the peer. Ping success alone does not prove OSPF traffic is permitted.

| State | What it establishes | What to investigate if it persists |
|---|---|---|
| Down | No current usable Hello relationship | Link, addressing, process activation, passive setting |
| Init | A Hello arrived, but it does not list the local RID | One-way communication or filtering |
| 2-Way | Each router has seen itself in the other's Hello | May be normal between two DROTHERs |
| ExStart / Exchange | Routers negotiate and exchange database descriptions | Compare MTU and inspect repeated errors |
| Loading | Requested link-state information is being obtained | Missing updates, retransmissions, connectivity |
| Full | Database synchronization for this adjacency completed | Move on to route and forwarding verification |

The five OSPF packet types have jobs, not a rigid one-time sequence: Hello maintains neighbors; **Database Description (DBD)** summarizes database contents; **Link-State Request** asks for missing information; **Link-State Update** carries LSAs; **Link-State Acknowledgment** confirms receipt. Updates and acknowledgments continue after Full when information changes.

Default dead time is documented as four times the Hello interval on this IOS family, but an explicitly configured dead interval can differ. Inspect the effective values with `show ip ospf interface`. When changing timers for a controlled exercise, set both values deliberately on both peers. Do not infer the effective dead timer from a single Hello command or assume every Cisco software family adjusts unspecified timers identically.

## Broadcast and point-to-point networks

Ethernet uses the OSPF **broadcast network type** by default. A multiaccess segment elects one **designated router (DR)** and one **backup designated router (BDR)**, where enough eligible routers are present. Other routers are **DROTHERs**. Each DROTHER forms Full adjacencies with the DR and BDR; two DROTHERs normally remain 2-Way with each other.

The election ranks eligible routers by interface priority, then RID. IOS priority is 0–255, default 1; priority 0 makes that interface ineligible. Priority is per interface, and the election is per segment, not for the entire area. Existing roles matter: the election is **non-preemptive**. A new router with a higher priority does not displace a healthy existing DR or BDR.

For a clean election in which all candidates know one another before roles are selected, suppose R1 has priority 100, R2 has 50, and R3 has 0. R1 is DR, R2 is BDR, and R3 is DROTHER. If R1 fails, the current BDR R2 takes over as DR. A returning R1 does not automatically reclaim DR. This is why a question must state whether an election is fresh or roles already exist.

:::trap Full is not required between every pair
A stable `2WAY/DROTHER` entry is normal when both local and remote routers are DROTHERs on a broadcast segment. The same state on an intended two-router point-to-point adjacency needs investigation.
:::

On an Ethernet link containing exactly two OSPF routers, configure `ip ospf network point-to-point` on both ends if that is the intended design. The Ethernet framing stays Ethernet; only OSPF's treatment changes. No DR/BDR is needed, and the neighbor state shows `FULL/ -`. Do not use this change as a remedy for an unexplained fault on a shared LAN.

```diagram
{ "type": "topology", "title": "Fig 21.1 — Elections belong to individual segments", "caption": "The shared LAN elects a DR and BDR; the separate two-router link can run as point-to-point.", "nodes": [
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

OSPF adds the costs of outgoing interfaces along a path, including the last router's interface toward the destination subnet. Unlike Chapter 14's STP calculation that adds the local receiving port cost to an advertised root cost, start this OSPF sum at the calculating router and follow outgoing interfaces toward the destination. This direction matters. Changing R1's outgoing cost changes R1's calculation; it does not automatically change R3's reverse-direction cost.

For IOS automatic calculation, cost is the reference bandwidth divided by the configured interface bandwidth, using integer values with minimum 1. The default reference is 100 Mbps. A 10-Mbps interface therefore has cost 10; 100 Mbps and 1 Gbps both calculate to 1. `auto-cost reference-bandwidth 10000` uses Mbps, so 100-Mbps, 1-Gbps, and 10-Gbps links calculate to 100, 10, and 1. Use a consistent reference across the routing domain. The bandwidth setting is an input to routing metrics; it does not physically change link speed.

An explicit interface command such as `ip ospf cost 25` overrides automatic calculation for that interface. Our lab uses explicit costs to avoid simulator link-speed differences.

Work this example from R1 to R3's LAN. R1 can reach R3 directly with cost 25, or through a shared transit LAN with cost 10. R3's outgoing LAN cost is 1. The choices are **26** and **11**, so the shared path wins. If that shared adjacency fails but the direct one remains Full, R1 should install cost 26. Do not add R3's incoming transit cost a second time.

Cost 11 is not administrative distance 110. In `[110/11]`, 110 ranks OSPF against other route sources for the same prefix, while 11 is the OSPF metric. Equal-cost OSPF paths may be installed together; the supported/default maximum varies by platform. Router ID is not a general replacement for metric comparison when forwarding packets.

## Configuring single-area OSPFv2

Start with a working addressed interface. Then create the process, set its RID, select participating interfaces, and decide where Hellos are allowed. The following is a configuration pattern for R1, not the complete multi-device lab:

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

The `network` command selects local interfaces by address and wildcard; it is not a command to invent or summarize an advertised route. A wildcard 0 bit must match; a 1 bit is ignored. `0.0.0.0` therefore matches that one interface address. The interface's actual prefix is then advertised. Thus an interface at `172.16.5.33/27` can be selected with `network 172.16.5.33 0.0.0.0 area 0`, and its connected network remains `172.16.5.32/27`.

For a range example, `network 10.0.13.0 0.0.0.3 area 0` ignores the last two address bits and matches local interface addresses from .0 through .3. It includes the lab's .1 and .2 addresses. The /30 subnet mask is `255.255.255.252`; its corresponding contiguous wildcard is `0.0.0.3`. Do not type the subnet mask into the wildcard position. The command still needs a matching local interface; naming a remote network here does not manufacture a route to it.

Alternatively, `ip ospf 10 area 0` in interface mode activates that interface directly. Use one method consistently in an exercise. A **passive interface** does not form OSPF neighbors, but its enabled connected prefix is still advertised through other participating interfaces. Making the PC-facing LAN passive avoids looking for routers where only hosts should exist. Making the transit link passive prevents the very adjacency needed to exchange routes. `passive-interface default` applies that suppression to all interfaces in this process, including interfaces activated later; each `no passive-interface INTERFACE` is an explicit exception. The exception permits neighbors but still does not activate OSPF by itself.

A branch can also learn its default from an OSPF edge router. This separate worked example assumes EDGE already has an area-0 adjacency toward the branch and an up upstream link `10.255.0.1/30` to router `10.255.0.2`:

```ios EDGE
EDGE# configure terminal
EDGE(config)# ip route 0.0.0.0 0.0.0.0 10.255.0.2
EDGE(config)# router ospf 10
EDGE(config-router)# default-information originate
EDGE(config-router)# end
EDGE# show ip route
```

The static supplies EDGE's forwarding default. The OSPF command advertises a default while an eligible default exists in EDGE's table. Without `always`, loss of that source default withdraws the advertisement; verify convergence on the branch. A reachable next hop does not establish that every upstream destination works.

On the branch, `show ip route ospf` should show the learned default as `O*E2 0.0.0.0/0` when it wins installation. `E2` identifies an external OSPF route; `*` marks a candidate default. It still loses a packet's lookup to a more-specific matching prefix. Test an actual destination and its return path. Chapter 44 reuses this pattern; external-route metric tuning is outside this exercise.

## Verify and troubleshoot

Read this authored, abbreviated example as a set of claims to verify, not a recorded device run:

```output R1# show ip route ospf — representative
O    192.168.30.0/24 [110/11] via 10.0.123.3, 00:00:22, GigabitEthernet0/0  ← AD 110, cost 11, first-hop address
```

Start with `show ip interface brief`, then `show ip ospf interface` and `show ip ospf neighbor`. `show ip ospf interface brief` gives a compact participation/cost summary; use the full interface form to compare effective timers. Check the active RID, area, network type, timers, neighbor role, and Full state where expected. Use `show ip protocols` to inspect process participation/passive configuration and `show ip ospf database` to confirm the router has topology information. Finally inspect the destination route and ping with a source in the actual client network. A router ping sourced from a transit address can succeed while the remote router lacks the client's LAN route.

If the neighbor table is empty, compare both ends before changing either. If ExStart/Exchange repeats, compare interface MTUs and database exchange evidence; MTU mismatch is common, not the only possible cause. Correct the underlying mismatch. `mtu-ignore` bypasses one check and can hide a real packet-size problem.

If neighbors are Full but a LAN route is missing, check that the LAN is up and enabled in OSPF, then look for a preferred connected or static route. If routes look correct but a client still fails, check its mask, gateway, return route, and filtering. Change one variable, observe the result, and restore deliberate faults before saving.

## Exam focus

Explain the relationship among neighbors, the LSDB, SPF, and installed routes. Distinguish a local process ID from the unique RID. Predict DR/BDR results using priority, RID, and existing roles, and recognize normal 2-Way relationships. Calculate outgoing costs in the correct direction, configure area 0 and passive LANs, and verify a client-to-client path in both directions. OSPFv2 is required in both tracks; v2.0 adds OSPFv3 in Chapter 22.
