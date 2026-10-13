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

A routing table tells you which destination networks a router currently knows and how it intends to reach them. Reading that table is an essential troubleshooting skill: before changing a route, identify the destination that fails and the entry it actually matches. Two hosts in the same subnet can take different paths if a more-specific route covers only one of them.

This chapter develops that interpretation skill before you configure static routing in Chapter 18 and OSPF in Chapter 21. Supplied dynamic-route examples let you practice reading output without needing to build those protocols yet. All sample output here is representative teaching output; spacing, abbreviations and additional fields vary by image.

## Separate route selection from packet forwarding

The **routing information base**, or **RIB**, contains selected routes. Connected interfaces, static configuration and routing protocols can contribute routes. A protocol first applies its own selection rules; when eligible sources compete for the same destination prefix and length, administrative distance helps determine the preferred source.

Forwarding is a different operation. For ordinary destination-based unicast routing, the router looks up the packet's **destination IP address** and uses the longest matching installed prefix. **Cisco Express Forwarding (CEF)** is the IOS forwarding mechanism used in these examples. Its **forwarding information base (FIB)** represents the selected routes for forwarding. Its **adjacency information** supplies the local delivery details, such as the Ethernet rewrite toward a resolved next hop; this use of adjacency is separate from the routing-protocol neighbor relationship introduced in Chapter 21.

Consider a static `10.20.0.0/16` route and an OSPF `10.20.30.0/24` route. Both can be installed because they describe different prefixes. Traffic to `10.20.30.8` uses the /24; traffic to `10.20.40.8` can use the /16. The router does not compare their administrative distances for each packet.

:::facts
- **Same prefix and length, different eligible sources:** compare administrative distance.
- **Alternative paths in a protocol:** apply that protocol's route-selection rules and metrics.
- **Destination lookup among installed routes:** choose the longest matching prefix.
- `[110/20]` means administrative distance **110**, metric **20**.
- A route being installed does not prove next-hop adjacency, destination availability or a working return path.
:::

The destination lookup is one part of forwarding. Interface state, address resolution, access policy, TTL and other checks can still prevent delivery. Policy-based routing can also alter an ordinary destination-based decision; its configuration is outside this chapter. Unless an exercise says otherwise, assume normal destination-based routing in one routing table.

## Read the fields in a route entry

```output R1 route excerpt
O    10.20.30.0/24 [110/20] via 10.0.12.2, 00:04:18, GigabitEthernet0/0
```

Read this entry from left to right:

| Field | Interpretation |
|---|---|
| `O` | OSPF supplied the installed route |
| `10.20.30.0/24` | Destination prefix; the first 24 bits identify the network |
| `110` | Administrative distance of this route source |
| `20` | OSPF metric, which is a cost rather than a hop count |
| `10.0.12.2` | Next-hop IP address |
| `00:04:18` | Time since the route information was last updated, as reported by this output |
| `GigabitEthernet0/0` | Outgoing interface on R1 |

The destination prefix is not the next-hop network. The line says that destinations in `10.20.30.0/24` are reached through `10.0.12.2`. For a remote host, the packet retains its remote destination IP during ordinary routing; the outgoing Ethernet frame addresses the next Layer 2 recipient. Do not replace the destination IP with the next-hop IP in your mental packet trace.

Some entries omit fields that do not apply or are displayed elsewhere. Connected and local entries commonly omit the brackets and next-hop address. An interface-only static route can be displayed as “directly connected” even though its source code remains `S`. Read the code and detailed entry rather than treating that phrase as proof of a `C` route.

A heading such as `10.0.0.0/8 is variably subnetted` organizes the display. It is not itself a forwarding route. Look for actual coded route entries below it and use their individual prefix lengths.

## Identify the route source

| Code | Meaning and CCNA interpretation |
|---|---|
| `C` | Connected network through an operational local interface |
| `L` | Local address belonging to this router; ordinarily a /32 for an IPv4 interface address |
| `S` | Static route from configuration |
| `O` | OSPF intra-area route |
| `O IA` | OSPF inter-area route |
| `O E1`, `O E2` | OSPF external route types |
| `D`, `D EX` | EIGRP internal and external routes |
| `R` | RIP route |
| `B` | BGP route |
| `*` | Candidate-default marker used alongside a source code |

For a normal up/up interface configured as `192.0.2.1/24`, current IOS-style output commonly includes:

```output R1 route excerpt
C    192.0.2.0/24 is directly connected, GigabitEthernet0/1
L    192.0.2.1/32 is directly connected, GigabitEthernet0/1
```

The `C` entry reaches other devices on that subnet. The `L` entry identifies traffic addressed to R1 itself and is more specific. If the interface loses its operational state, these interface-derived routes ordinarily disappear. A configured address on a shut interface is not enough to establish the connected path.

The two-line pattern has platform and address-type exceptions, including some /32 interface cases; verify the actual table. For the exam, learn the connected/local distinction without assuming every possible interface configuration always creates exactly two lines.

Recognize the other codes when they appear in exhibits, but keep the configuration workload aligned with the course: static routes and single-area OSPF are the required routing foundation. This chapter does not require building BGP, EIGRP, RIP or multi-area OSPF.

## Compare sources with administrative distance

**Administrative distance**, or **AD**, expresses a router's local preference between route sources. Lower values are preferred. It is not a measured link speed, a security score or a metric that routers exchange as part of an IP packet. An administrator can change it, so displayed values outrank remembered defaults when interpreting an exhibit.

Start with connected **0**, static **1**, and OSPF **110**. Use this compact reference when other source codes appear:

| Source | Default AD |
|---|---:|
| Connected | 0 |
| Static | 1 |
| External BGP | 20 |
| Internal EIGRP | 90 |
| OSPF | 110 |
| RIP | 120 |
| External EIGRP | 170 |
| Internal BGP | 200 |

An AD of **255** makes a route unusable for installation. Other platform-specific or historical values are not needed to solve the examples here.

Suppose OSPF offers `10.50.0.0/16` with cost 20, RIP offers the same /16 with two hops, and a configured static route for that /16 has AD 130. If all candidates meet installation requirements and default protocol distances apply, OSPF wins: 110 is lower than 120 and 130. Comparing OSPF's 20 directly with RIP's 2 would compare unlike units.

A **floating static route** has a higher AD than the intended primary source for the same prefix. It can remain in running configuration while absent from the installed table. If the primary disappears, the static route can become active only if it is still eligible, including valid next-hop resolution. A configured backup is not proof of successful failover.

:::trap
Administrative distance does not choose between an installed /16 and an installed /24 for a packet. They are different destinations in the routing database. Use the packet's address and longest prefix match.
:::

Chapter 18 teaches the static-route command and failure behavior in full. In the supplied examples, an optional final number in `ip route PREFIX MASK NEXT-HOP AD` sets the administrative distance; leaving it out normally uses the static default of 1.

## Compare metrics and recognize equal-cost paths

A **metric** ranks paths according to a routing protocol's rules. In the single-area OSPF cases used in this course, lower accumulated cost is preferred. RIP uses hop count; EIGRP's usual metric considers bandwidth and delay. These values are not interchangeable, and a bracketed metric is not always a count of routers.

OSPF cost depends on configured/reference bandwidth and possible explicit interface costs. A displayed cost of 2 does not prove that a destination is exactly two Gigabit Ethernet hops away. Interpret the value using the supplied topology and settings; Chapter 21 shows how it is calculated.

Protocol rules can also distinguish route types before comparing metrics. In particular, do not generalize “pick the lowest displayed number” into a complete BGP or OSPF external-route algorithm. Those advanced selection details are not required for the single-area exercises here.

When a protocol supplies multiple eligible equal-cost paths and the device permits them, the installed entry can contain more than one next hop:

```output R1 route excerpt
O    10.20.30.0/24 [110/20] via 10.0.12.2, 00:01:10, GigabitEthernet0/0
                  [110/20] via 10.0.13.2, 00:01:10, GigabitEthernet0/2
```

This is **equal-cost multipath**, or **ECMP**. Both next hops belong to the same destination prefix and have the same displayed distance and cost. Maximum path counts depend on the protocol, image and configuration; “four paths by default on every Cisco router” is not a reliable rule.

CEF commonly uses a hash to select a path for a flow. Two installed paths therefore do not guarantee that each packet alternates links, that byte counts divide 50/50, or that one transfer receives the sum of both links' bandwidth. For CCNA interpretation, identify the eligible paths and avoid promising a traffic distribution the exhibit does not establish.

## Apply longest prefix match

**Longest prefix match** selects the most-specific installed prefix containing the destination. A larger prefix length means more fixed bits: /25 is more specific than /24, and /24 is more specific than /16. Specificity matters only after you confirm that the address is inside that prefix.

Work this example without comparing distances:

| Installed prefix | Next hop | Address range covered |
|---|---|---|
| `172.16.32.0/19` | `10.0.0.2` | `172.16.32.0–172.16.63.255` |
| `172.16.40.0/21` | `10.0.0.3` | `172.16.40.0–172.16.47.255` |
| `172.16.44.0/23` | `10.0.0.4` | `172.16.44.0–172.16.45.255` |
| `172.16.44.128/25` | `10.0.0.5` | `172.16.44.128–172.16.44.255` |

For `172.16.44.9`, the /19, /21 and /23 match. The /25 does not: its final-octet range starts at 128. The winning route is the /23 through `10.0.0.4`.

For `172.16.44.200`, all four match, so the /25 wins. For `172.16.45.200`, the /23 wins because the /25 covers only part of `172.16.44.x`. A familiar-looking third octet is not a substitute for checking the whole mask.

Use a repeatable method: write the destination, find every matching range, choose the greatest matching prefix length, then read that entry's action. The action might be forwarding to a neighbor, local delivery or discard through `Null0`. `Null0` is a virtual discard interface: choosing it deliberately drops the packet rather than transmitting through a cable. A more-specific discard route wins over a less-specific working route.

If the chosen route cannot deliver a packet, the router does not normally retry progressively less-specific routes as a recovery strategy. For example, an installed /25 pointing to Null0 still discards its matching traffic even if a /24 and default route could lead elsewhere.

## Resolve next hops and use a default route

A route with a next-hop IP must resolve to a usable forwarding path. Often that next hop is directly connected. A recursive route can instead name an address reached through another route; resolution continues until an outgoing adjacency or appropriate forwarding action is determined.

On Ethernet, reaching a neighbor requires its link-layer address. For a remote destination through a neighboring router, ARP resolves the router's IP. For a directly attached destination, ARP normally resolves the destination host itself. A route can exist while ARP remains incomplete, so next-hop resolution and successful neighbor communication are separate checks.

A **default route**, `0.0.0.0/0`, matches every IPv4 destination but has the shortest possible prefix. It is used only when there is no more-specific matching installed route. Its existence does not mean the network has Internet access; a default can point toward any intended upstream path.

```output R1 default-route excerpt
Gateway of last resort is 10.0.12.2 to network 0.0.0.0
S*   0.0.0.0/0 [1/0] via 10.0.12.2
```

Here `S` identifies a static source and `*` marks it as a candidate default. The gateway-of-last-resort line summarizes the selected fallback. If no route matches and no default exists, ordinary routed traffic is discarded. An ICMP unreachable response may be generated, subject to configuration and other limits; its absence is not proof that no discard occurred.

Default-route display behavior deserves care. Cisco documents an IOS example where a destination-specific `show ip route` lookup reports “Network not in table” while the default route exists. Do not memorize that as the behavior of every release or command form. Inspect the full `show ip route` output, the default entry itself, and the CEF lookup where supported before concluding that no forwarding match exists.

## Verify the decision and its limits

Begin with the full table to avoid hiding a relevant source or more-specific route:

```output R1# show ip route (representative excerpt)
Gateway of last resort is 10.0.12.2 to network 0.0.0.0

     10.0.0.0/8 is variably subnetted, 4 subnets, 4 masks
C       10.0.12.0/30 is directly connected, GigabitEthernet0/0
L       10.0.12.1/32 is directly connected, GigabitEthernet0/0
O       10.20.30.0/24 [110/20] via 10.0.12.2, 00:04:18, GigabitEthernet0/0
S       10.20.30.128/25 is directly connected, Null0
S*   0.0.0.0/0 [1/0] via 10.0.12.2
```

The `10.0.0.0/8` display group contains four route entries with four prefix lengths: /30, /32, /24 and /25. Its heading does not add a /8 route. For `10.20.30.150`, the /25 selects Null0; for `10.20.30.50`, the /24 selects `10.0.12.2`. The default remains available only for destinations without a more-specific match.

Use focused commands after identifying the relevant destination:

| Command | What it establishes |
|---|---|
| `show ip route` | Installed IPv4 routes and default summary |
| `show ip route 10.20.30.150` | Matching route detail in supported command behavior; inspect the returned prefix |
| `show ip route static` | Installed static routes, excluding inactive configured backups |
| `show ip route ospf` | Installed routes supplied by OSPF |
| `show running-config \| include ^ip route` | Configured static-route lines, whether installed or not |
| `show ip cef 10.20.30.150` | CEF forwarding entry for this destination, where supported |
| `show ip arp` | IPv4 neighbor address-resolution evidence |
| `show ip interface brief` | Interface addressing and operational state |

The filter `show running-config | include ^ip route` selects configured lines beginning with `ip route`: `| include` keeps matching lines, and `^` anchors the match at the start of a line. Compare those configured statics with the installed table; a configuration line alone is not an installed route. On an image without filters, inspect the full running configuration.

A CEF entry marked **receive** identifies local delivery; **attached** identifies a directly attached prefix or adjacency context; **drop** identifies a discard action. An attached prefix does not establish that every host in it has a resolved adjacency. Platform-specific hardware forwarding internals are outside the CCNA workload.

Finish with a traffic test appropriate to the fault. A successful next-hop ping is useful but does not prove that the remote host, return route or application works. Test from the affected source where possible and inspect the other router's route back to that source. A router-originated ping can select a different source address from the user's traffic and therefore exercise a different return path.

## Exam focus

Given an exhibit, identify the route code, destination prefix and mask, AD, metric, next hop, outgoing interface and default marker. Explain why a route source was selected for a particular prefix, then independently apply longest prefix match to a packet destination.

You should be able to solve overlapping non-octet prefixes, distinguish a connected subnet from a local interface address, recognize ECMP, and explain why a configured backup may be absent from the RIB. For troubleshooting, state what the evidence proves and which missing observation would distinguish route selection from a forwarding or return-path failure.

The v1.1 objectives explicitly enumerate these fields and decisions; v2.0 also requires interpreting routing-table output. Static-route construction belongs in Chapter 18, OSPF operation in Chapters 21–22, and full policy configuration in later chapters. Use those later lessons to deepen the same route-reading method.
