---
id: routing-table
number: 17
title: The routing table
subtitle: Read route entries, distinguish route selection from forwarding, and verify the chosen path.
part: routing
domain: routing
minutes: { lesson: 65, lab: 70 }
summary: Interpret destination prefixes, route codes, next hops, administrative distance and metrics. Work through overlapping routes, defaults and equal-cost paths, then use routing and forwarding evidence to diagnose a controlled failure.
objectives:
  v1: ["3.1", "3.1.a", "3.1.b", "3.1.c", "3.1.d", "3.1.e", "3.1.f", "3.1.g", "3.2", "3.2.a", "3.2.b", "3.2.c"]
  v2: ["3.1"]
prereqs: [subnetting-vlsm, inter-vlan-routing, ios-essentials]
sectionIds:
  Separate route selection from packet forwarding: why-the-table-is-the-whole-story
  Read the fields in a route entry: anatomy-of-one-route
  Identify the route source: the-legend-route-source-codes
  Compare sources with administrative distance: administrative-distance-choosing-between-sources
  Compare metrics and recognize equal-cost paths: metrics-and-equal-cost-paths
  Apply longest prefix match: longest-prefix-match-the-forwarding-decision
  Resolve next hops and use a default route: the-default-route-and-the-gateway-of-last-resort
  Verify the decision and its limits: reading-the-output
sources:
  - { title: "Cisco: Route selection in Cisco routers", url: "https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html" }
  - { title: "Cisco: Administrative distance", url: "https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html" }
  - { title: "Cisco: IP routing protocol-independent command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/command/iri-cr-book.html" }
  - { title: "Cisco: show ip route output field reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_bgp/command/irg-cr-book/bgp-s1.html" }
  - { title: "Cisco: CEF behavior and adjacency on IOS XE", url: "https://www.cisco.com/c/en/us/support/docs/ip/express-forwarding-cef/211377-Understand-and-Troubleshoot-CEF-on-IOS-X.html" }
  - { title: "Cisco: show adjacency and show ip cef command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipswitch/command/isw-cr-book/isw-s1.html" }
  - { title: "Cisco: Documented destination/default lookup example, Case Study 3", url: "https://www.cisco.com/c/en/us/support/docs/ip/ip-routed-protocols/47121-pbr-cmds-ce.html" }
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
---

A user reports that one server in a branch subnet has stopped answering while the server beside it still works. Both are in the same /24, both are powered on, and nothing changed on the switches. The cause is sitting in a router's routing table: those two addresses match different routes. Until you can read the table line by line and say which entry a given packet will use, you can only guess at faults like this one.

In Chapter 11 a router moved traffic between VLANs using only the `C` and `L` routes it builds from its own interfaces. This chapter adds everything else that `show ip route` displays: static and dynamic routes, the two numbers in square brackets, overlapping prefixes and the default route. You will reuse the subnet ranges from Chapter 5 to decide which routes contain a destination. By the end you can take a routing table and a destination address, name the route the router uses and explain why that route won. You configure static routes in Chapter 18 and OSPF in Chapter 21; the OSPF lines here are supplied for reading practice.

## Separate route selection from packet forwarding

A router makes two separate decisions, and most routing-table questions test whether you can keep them apart.

**Decision 1: which routes go into the table.** A router hears about destinations from three kinds of source: its own connected interfaces, static routes that you configure, and routing protocols such as OSPF. If one protocol knows several paths to the same prefix, the protocol first picks its best path by **metric**. If different sources then offer a route to exactly the same prefix (the same network and the same prefix length), the router installs the one from the source it trusts most, measured by **administrative distance**. The winners form the routing table, formally the **routing information base (RIB)**. Losing candidates are not shown in it.

**Decision 2: which installed route a packet uses.** For each packet the router reads the **destination IP address** and finds every installed route whose prefix contains it. If several match, it uses the one with the longest prefix length. This is **longest prefix match**. Administrative distance and metric play no part here; they were used up in decision 1.

Here is the difference in one example. R1 has a static route to `10.20.0.0/16` and an OSPF route to `10.20.30.0/24`. These are different prefixes, so they never competed and both are installed. A packet to `10.20.30.8` is inside both; the /24 is longer, so the packet follows the OSPF route even though static routes have the better administrative distance. A packet to `10.20.40.8` is inside only the /16 and follows the static route.

On a Cisco router the per-packet lookup is done by **Cisco Express Forwarding (CEF)**. CEF copies the routing table into a structure built for fast lookups, the **forwarding information base (FIB)**, and keeps an **adjacency table** holding the Layer 2 header needed to reach each next hop, such as the next router's MAC address. For the CCNA it is enough to know that the FIB is built from the RIB and that `show ip cef` displays it.

:::facts
- **Same prefix and length, different sources:** the lowest administrative distance is installed.
- **Same prefix, several paths in one protocol:** the protocol's best metric is installed.
- **Each packet, among installed routes:** the longest matching prefix is used.
- `[110/20]` means administrative distance **110**, metric **20**.
- An installed route does not prove that the next hop answers, that the destination is up, or that a return route exists.
:::

A correct lookup is necessary but not sufficient. The outgoing interface must be up, the next hop must answer ARP, and nothing such as an access list (Chapter 34) may block the packet.

## Read the fields in a route entry

Every route line answers four questions: who supplied this route, which destinations it covers, how it ranked against competitors, and where to send matching packets.

```output R1 route excerpt
O    10.20.30.0/24 [110/20] via 10.0.12.2, 00:04:18, GigabitEthernet0/0
```

Read the entry from left to right:

| Field | Interpretation |
|---|---|
| `O` | Route source: OSPF supplied this route |
| `10.20.30.0/24` | Destination prefix; the first 24 bits identify the network |
| `110` | Administrative distance of the source |
| `20` | Metric; for OSPF this is a cost, not a hop count |
| `10.0.12.2` | Next-hop IP address: the neighboring router to hand the packet to |
| `00:04:18` | Time since the route was last updated |
| `GigabitEthernet0/0` | Outgoing interface on R1 |

Two addresses on this line are easy to confuse. `10.20.30.0/24` is where the packet is finally going; `10.0.12.2` is only the next router on the way. R1 does not rewrite the packet's destination IP address to `10.0.12.2`: the IP header carries the remote host's address from end to end. What changes at each hop is the Ethernet frame, which is addressed to the next router's MAC address.

Not every line has every field. Connected and local entries show no brackets and no next hop, because the router is attached to that network itself. A static route that names only an exit interface is also displayed as `is directly connected`, yet its code is still `S` and its administrative distance is still 1. Trust the code letter, not the phrase.

A line such as `10.0.0.0/8 is variably subnetted, 4 subnets, 4 masks` is a heading, not a route. It says that the indented entries below it are subnets of `10.0.0.0/8` and that they use four different masks. No /8 route exists unless a coded line shows one.

## Identify the route source

The code at the start of a line names the source that won decision 1 for that prefix. The legend at the top of `show ip route` lists many codes; these are the ones to know:

| Code | Meaning |
|---|---|
| `C` | Connected: the subnet of an interface that is up/up |
| `L` | Local: an address that belongs to this router, shown as a /32 |
| `S` | Static: a route from the configuration |
| `O` | OSPF route inside the router's own area (intra-area) |
| `O IA` | OSPF route learned from another area (inter-area) |
| `O E1`, `O E2` | OSPF external routes, brought into OSPF from another source |
| `D`, `D EX` | EIGRP internal and external routes |
| `R` | RIP route |
| `B` | BGP route |
| `*` | Candidate default, shown beside a source code as in `S*` |

For an up/up interface configured as `192.0.2.1/24`, IOS installs two routes:

```output R1 route excerpt
C    192.0.2.0/24 is directly connected, GigabitEthernet0/1
L    192.0.2.1/32 is directly connected, GigabitEthernet0/1
```

The `C` line is the subnet: it is how R1 reaches other devices on that LAN. The `L` line is a /32 for R1's own address. Because /32 is the longest possible prefix, a packet addressed to `192.0.2.1` matches the `L` line and is handed to the router itself, while a packet to `192.0.2.10` matches only the `C` line and is sent out GigabitEthernet0/1. Both lines exist only while the interface is up/up. Shut the interface down or unplug it and both disappear, even though the address is still in the running configuration.

One variation appears in the lab: an interface with a /32 mask, such as a loopback, normally shows a single `C` line, because its subnet and its address are the same /32.

Recognize `D`, `R` and `B` when they appear in exhibits. The configuration work in this course is static routing and single-area OSPF only.

## Compare sources with administrative distance

Suppose OSPF and RIP both offer a route to `10.50.0.0/16`. Their metrics cannot settle the choice, because OSPF counts cost and RIP counts hops. So IOS ranks the sources themselves. **Administrative distance**, or **AD**, is a number from 0 to 255 that says how much a router trusts a route source, and the lowest number wins. AD is local to the router: it is never advertised to neighbors, and an administrator can change it. In an exhibit, believe the number in the brackets over the default you memorized.

| Source | Default AD |
|---|---:|
| Connected | 0 |
| Static | 1 |
| External BGP | 20 |
| Internal EIGRP | 90 |
| OSPF | 110 |
| IS-IS | 115 |
| RIP | 120 |
| External EIGRP | 170 |
| Internal BGP | 200 |

Learn connected **0**, static **1**, EIGRP **90**, OSPF **110** and RIP **120** first; they answer most exam questions. An AD of **255** means the source is not trusted at all, and such a route is never installed.

Three sources offer exactly `10.50.0.0/16`: OSPF with cost 20, RIP with hop count 2, and a static route that was configured with AD 130. Compare only the distances: 110, 120 and 130. OSPF wins, and the table shows `O 10.50.0.0/16 [110/20]`. RIP's 2 is smaller than OSPF's 20, but hops and cost are different units and are never compared with each other. If OSPF loses the route, RIP takes over with `[120/2]`. If RIP loses it too, the static route is installed with `[130/0]`.

That static route is a **floating static route**: a static route deliberately given a higher AD than the primary source for the same prefix, so that it stays out of the table until the primary route disappears. While the primary is present, the floating route exists only in the running configuration, and `show ip route` does not list it. When it takes over it still needs a reachable next hop, like any static route.

The AD is the optional last number of the static-route command, as in `ip route 10.50.0.0 255.255.0.0 10.0.99.2 130`. Leave it out and the route gets the static default of 1, which beats every routing protocol. Chapter 18 builds and tests these routes.

:::trap
Administrative distance never chooses between a /16 and a /24. They are different prefixes, so both are installed, and the packet's destination chooses between them by longest prefix match. AD only compares routes to the identical prefix.
:::

## Compare metrics and recognize equal-cost paths

Administrative distance chooses between sources. Inside one routing protocol, the **metric** chooses between paths. It is the protocol's own measure of how good a path is, and lower is better. OSPF adds up a **cost** for each outgoing interface along the path, based on bandwidth. RIP counts router **hops**. EIGRP calculates a composite value from bandwidth and delay. Because each protocol measures differently, a metric only means something next to another metric from the same protocol for the same prefix.

For example, R1's OSPF process learns `10.20.30.0/24` through one neighbor at a total cost of 20 and through another at a total cost of 30. Only the cost-20 path is installed. The other stays in OSPF's own database, ready if the first path fails.

Read the second bracketed number with its protocol in mind. In `[110/20]` the 20 is an OSPF cost, not a count of 20 routers; Chapter 21 shows the calculation. Static routes show a metric of 0.

When a protocol finds two or more paths with the same best metric, it installs them all, and the one prefix lists several next hops:

```output R1 route excerpt
O    10.20.30.0/24 [110/20] via 10.0.12.2, 00:01:10, GigabitEthernet0/0
                  [110/20] via 10.0.13.2, 00:01:10, GigabitEthernet0/2
```

This is **equal-cost multipath**, or **ECMP**. Both lines belong to the same prefix and show the same distance and metric. IOS routers install up to four equal-cost OSPF paths by default, and the limit is configurable.

CEF shares traffic across the paths per flow by default. It hashes the source and destination addresses, so every packet of one conversation takes the same next hop and arrives in order. So a single large transfer gets the bandwidth of one link, not both, and the two links rarely carry equal byte counts.

## Apply longest prefix match

Routes in a real table overlap. A /19 can cover a whole site, a /23 inside it one building, and a /25 inside that a single server segment. When a destination falls inside several of them, the router uses the match with the longest prefix length, because the longest prefix is the most specific statement about where that address lives. This is **longest prefix match**, and it has two steps:

1. **Match.** Decide which installed routes contain the destination address.
2. **Choose.** Among those, take the longest prefix length: /25 beats /24, and /24 beats /16.

Mistakes happen in step 1, because prefixes seldom end on an octet boundary. Use the block-size method from Chapter 5 to write each route's range first. A /19 has a block size of 32 in the third octet, a /21 has 8, a /23 has 2, and a /25 has 128 in the fourth octet.

| Installed prefix | Next hop | Address range covered |
|---|---|---|
| `172.16.32.0/19` | `10.0.0.2` | `172.16.32.0–172.16.63.255` |
| `172.16.40.0/21` | `10.0.0.3` | `172.16.40.0–172.16.47.255` |
| `172.16.44.0/23` | `10.0.0.4` | `172.16.44.0–172.16.45.255` |
| `172.16.44.128/25` | `10.0.0.5` | `172.16.44.128–172.16.44.255` |

Now look up four destinations:

- `172.16.44.9` is inside the /19, the /21 and the /23. It is not inside the /25, whose range starts at `.128`. The longest match is the /23, so the next hop is `10.0.0.4`.
- `172.16.44.200` is inside all four. The /25 wins: `10.0.0.5`.
- `172.16.45.200` looks similar, but the /25 covers only part of `172.16.44.x`. The /23 wins again: `10.0.0.4`.
- `172.16.60.7` is inside only the /19: `10.0.0.2`.

Notice what you did not use: the route codes, the administrative distances and the metrics. If the /25 were a static route with AD 200 and the /23 an OSPF route with AD 110, the /25 would still win for `172.16.44.200`.

A route's action is not always "forward to a neighbor". An `L` route means deliver the packet to the router itself. A route to `Null0` means discard it: `Null0` is a virtual interface that drops everything sent to it, and engineers point static routes at it on purpose. The router never falls back to a shorter prefix once a longer one has matched. An installed /25 to `Null0` discards its traffic even when a working /24 and a default route also contain the destination. If the /25 is later removed, the next packet is matched against the routes that remain, and the /24 wins.

## Resolve next hops and use a default route

Choosing a route gives the router a next-hop IP address. Before it can send a frame, it needs two more things: the interface to send from and the next hop's MAC address.

Take `S 10.20.30.0/24 [1/0] via 10.0.12.2`. The line names no interface, so R1 looks up `10.0.12.2` in its own table, finds the connected route `10.0.12.0/30` on GigabitEthernet0/0, and now knows the exit interface. That second lookup is a **recursive lookup**. If no route covers the next hop, the static route cannot be installed.

On Ethernet, R1 then uses ARP to find a MAC address. Which address it asks for depends on the route. For a remote destination, R1 resolves the next-hop router: a packet to `10.20.30.50` causes an ARP request for `10.0.12.2`, and the frame goes to that router's MAC address while the packet still carries destination `10.20.30.50`. For a destination on a connected subnet, R1 resolves the destination host itself. A route can be installed while ARP for its next hop fails, so a correct route does not prove that the neighbor answers.

A **default route** is `0.0.0.0/0`. Its prefix length is zero, so there are no bits to compare and every IPv4 address is inside it. Because it is the shortest possible prefix, it loses to every other matching route and is used only when nothing else matches. A branch router with one uplink can carry a single default route instead of a route for every network beyond that uplink.

```output R1 default-route excerpt
Gateway of last resort is 10.0.12.2 to network 0.0.0.0
S*   0.0.0.0/0 [1/0] via 10.0.12.2
```

`S` says the route is static, and `*` marks it as a candidate default. The `Gateway of last resort` line names the next hop of the default route in use. Without a default route the line reads `Gateway of last resort is not set`, and a packet that matches no route is dropped. The router normally sends an ICMP destination unreachable message back to the source.

One display quirk can mislead you. `show ip route 203.0.113.9`, for a destination that only the default route matches, answers `% Network not in table` on IOS. That command reports a specific route and does not fall back to the default, although the packet itself is forwarded by the default. Read the full `show ip route`, or use `show ip cef 203.0.113.9`, before deciding that a destination has no route.

## Verify the decision and its limits

When a destination is unreachable, work in a fixed order: read the whole table, find the route the destination matches, check that route's next hop, then test the traffic in both directions. Start with the full table, so that a more-specific route cannot hide from you:

```output R1# show ip route (representative excerpt)
Gateway of last resort is 10.0.12.2 to network 0.0.0.0

     10.0.0.0/8 is variably subnetted, 4 subnets, 4 masks
C       10.0.12.0/30 is directly connected, GigabitEthernet0/0
L       10.0.12.1/32 is directly connected, GigabitEthernet0/0
O       10.20.30.0/24 [110/20] via 10.0.12.2, 00:04:18, GigabitEthernet0/0
S       10.20.30.128/25 is directly connected, Null0
S*   0.0.0.0/0 [1/0] via 10.0.12.2
```

The four indented entries are a /30, a /32, a /24 and a /25, and the heading above them adds no /8 route. Look up two destinations. `10.20.30.150` is inside the /24 and the /25; the /25 is longer, so the packet is discarded at `Null0`. `10.20.30.50` is inside only the /24 and goes to `10.0.12.2`. This is the fault from the start of the chapter: two hosts in one subnet, two different routes. The default route serves only destinations that match none of the four entries, such as `198.51.100.10`.

Then narrow down with focused commands:

| Command | What it establishes |
|---|---|
| `show ip route` | All installed IPv4 routes and the gateway of last resort |
| `show ip route 10.20.30.150` | The specific installed route that matches this address |
| `show ip route static` | Installed static routes only; a floating static route that lost is not listed |
| `show ip route ospf` | Installed routes supplied by OSPF |
| `show running-config \| include ^ip route` | Configured static-route lines, whether installed or not |
| `show ip cef 10.20.30.150` | The CEF forwarding entry for this destination, default route included |
| `show ip arp` | IPv4-to-MAC resolution for neighbors |
| `show ip interface brief` | Interface addresses and up/down state |

The filter in `show running-config | include ^ip route` keeps only the lines that begin with `ip route`: `| include` keeps matching lines, and `^` anchors the match to the start of the line. Comparing that list with `show ip route static` shows which configured static routes are not installed, for instance a floating static route waiting behind OSPF.

In `show ip cef` output, **receive** means the router delivers the packet to itself, **attached** means the prefix is directly connected, and **drop** means discard.

Finally, test the traffic, and remember that routing is one-way. R1's table only moves the packet toward the destination. The reply is a new packet whose destination is the original sender, and every router on the way back looks it up independently. A correct route on R1 with no return route on the far router still produces a failed ping. Test from the user's PC where you can: a ping typed on R1 uses the address of R1's outgoing interface as its source, so it tests a different return route from the one the user's traffic needs.

## Exam focus

Given a `show ip route` exhibit, be able to:

- Name each field of an entry: route code, prefix and mask, administrative distance, metric, next hop and outgoing interface.
- Recall the default ADs: connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120, external EIGRP 170, iBGP 200, and 255 for never installed.
- Explain which source is installed when several offer the same prefix, and why a floating static route is configured but missing from the table.
- Apply longest prefix match to prefixes that do not end on octet boundaries, including a local /32, a `Null0` route and the default route.
- Tell a connected subnet (`C`) from the router's own address (`L`), and recognize ECMP as one prefix with several next hops.
- Read `S*` and the gateway of last resort line, and say what happens to a packet when no route matches.
- State what an installed route does not prove: that the next hop resolves, or that a return route exists.

The v1.1 objectives list these fields and decisions one by one; v2.0 also requires interpreting routing-table output.
