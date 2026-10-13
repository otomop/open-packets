---
id: static-routing-ipv6
number: 20
title: Static routing (IPv6)
subtitle: Select a remote IPv6 path and scope link-local next hops to the correct interface.
part: routing
domain: routing
minutes: { lesson: 60, lab: 90 }
summary: Configure network, default, host and floating IPv6 routes. Verify forwarding, neighbor resolution, link-local scope and the return path with a controlled two-link lab.
objectives:
  v1: ["3.3", "3.3.a", "3.3.b", "3.3.c", "3.3.d"]
  v2: ["3.2", "3.2.a", "3.2.b", "3.2.c", "3.2.d"]
prereqs: [ipv6-addressing, static-routing-ipv4]
sectionIds:
  Apply the IPv4 routing method to IPv6: same-decision-different-addresses
  Enable addressing and forwarding: turning-on-ipv6-routing
  Choose an IPv6 route form: the-forms-of-ipv6-route
  Scope a link-local next hop: link-local-next-hops-need-a-link
  Network, default, host and floating routes: network-default-host-and-floating-routes
  Follow the request and reply: hosts-gateways-and-the-return-path
  Verify and troubleshoot: verify-and-troubleshoot
  Exam focus: exam-focus
sources:
  - { title: "Cisco: IPv6 Static Routing, IOS XE 17", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_ip6-route-static-xe.html" }
  - { title: "Cisco: IPv6 Route Command Reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6/command/ipv6-cr-book/ipv6-i4.html" }
  - { title: "Cisco: Understand the IPv6 Link-Local Address", url: "https://www.cisco.com/c/en/us/support/docs/ip/ip-version-6-ipv6/113328-ipv6-lla.html" }
  - { title: "Cisco: IPv6 Addressing and Basic Connectivity", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6_basic/configuration/15-mt/ip6b-15-mt-book/ip6-add-basic-conn.html" }
  - { title: "RFC 4291: IPv6 Addressing Architecture", url: "https://www.rfc-editor.org/rfc/rfc4291.html" }
  - { title: "RFC 4861: Neighbor Discovery", url: "https://www.rfc-editor.org/info/rfc4861/" }
  - { title: "RFC 5942: IPv6 Subnet Model", url: "https://www.rfc-editor.org/info/rfc5942/" }
  - { title: "Cisco: Route Selection in Cisco Routers", url: "https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html" }
---

IPv6 static routing uses the route-selection method you already practiced with IPv4. The destination is still a prefix, a next hop is still the next router, and a reply still needs its own route. The important additions are 128-bit prefix notation, IPv6 forwarding configuration, Neighbor Discovery, and the interface scope of a link-local next hop.

Keep those differences separate. Learning a new address format should not make you abandon the careful sequence of checking the configuration, installed routes and actual traffic.

## Apply the IPv4 routing method to IPv6

:::facts
- IPv6 static routes use `ipv6 route prefix/length ...` in global configuration mode.
- An ordinary static route has administrative distance **1**. A floating route must have a higher distance than its preferred competitor for the same prefix.
- The default prefix is **::/0**. A single-address host route uses **/128**.
- A link-local next hop requires an **exit interface** in the IOS static-route command.
- Enable `ipv6 unicast-routing` for inter-interface IPv6 forwarding on the basic IOS router used here.
- Ethernet next-hop MAC resolution uses **Neighbor Discovery**, not ARP.
:::

An IPv6 packet matches the longest installed prefix that covers its destination. A packet for `2001:db8:20::12` can match `2001:db8:20::12/128`, `2001:db8:20::/64` and `::/0`. If all three are installed, /128 wins. If that host route is removed, /64 wins. If neither specific prefix exists but a default does, /0 supplies the forwarding instruction.

Administrative distance helps decide which candidate route to an identical prefix enters the routing table. It does not make a less specific installed prefix beat a longer one. Keep installation and packet forwarding as two decisions, just as in the IPv4 chapter.

A router carrying both address families has separate IPv4 and IPv6 routing information. A successful IPv4 ping can support your physical-link investigation, but it does not prove an IPv6 address, next hop, gateway or forwarding setting is correct. Begin a complaint by identifying the destination address family, then inspect that family's configuration and table.

The examples use `2001:db8::/32` documentation space within an isolated lab. The /64 transit links are a teaching choice. They do not contradict the use of other supported prefix lengths, including /127 on appropriate point-to-point router links.

## Enable addressing and forwarding

Configure a router interface with a predictable global-form address and a chosen link-local address:

```ios R1
R1# configure terminal
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address 2001:db8:12::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface brief
```

Each line has a different job. The global forwarding command allows R1 to move IPv6 packets between interfaces. The address line assigns `2001:db8:12::1` and a /64 prefix. The next line explicitly chooses `fe80::1` for this link. `no shutdown` enables the physical interface administratively; the peer and cable must also be working for a usable link.

An IOS router can have IPv6 addresses and answer traffic addressed to itself while IPv6 forwarding is disabled. Therefore, “I can ping the router” is not enough to establish that it can carry a PC's traffic to another interface. Look for the global command and test through the router.

The interface's local and connected routes are also evidence. A connected /64 describes its attached subnet, while a local /128 identifies an address belonging to the router itself. These are different from a remote /128 **static host route**, which instructs forwarding toward another device.

Router Advertisements can provide attached hosts with prefix and default-router information when IPv6 router operation is enabled and the interface's RA settings permit it. The global command is necessary in this basic lab but does not override an explicit RA suppression or an incorrectly configured prefix.

## Choose an IPv6 route form

| Form | Example | Interpretation |
|---|---|---|
| Recursive, next hop only | `ipv6 route 2001:db8:20::/64 2001:db8:12::2` | Resolve the next-hop address through another route |
| Exit interface only | `ipv6 route 2001:db8:20::/64 serial0/0/0` | Direct traffic onto the specified point-to-point interface |
| Fully specified | `ipv6 route 2001:db8:20::/64 gigabitethernet0/0 fe80::2` | Use this neighbor on this exact link |

The **recursive** example works when R1 has a usable resolving route to `2001:db8:12::2`, such as the connected transit /64. The same principle applies to a suitable non-link-local unicast next hop; a link-local address has the additional scope requirement described next.

Recursion must resolve to a usable path without depending on the route being resolved. Also, do not assume that any default automatically resolves every recursive next hop: documented IOS XE behavior excludes default-based IPv6 static recursion unless explicitly enabled. This course uses directly connected resolving prefixes and does not require the advanced override.

An **interface-only** route is reasonable for a true point-to-point interface because only one peer can receive the traffic. Ordinary Ethernet is a multiaccess link type even when the drawing shows only two routers. Without an explicit next hop, an interface-only route treats covered destinations as directly attached and may attempt Neighbor Discovery for those remote destinations on the transit link.

That is the wrong assumption for a LAN behind another router. The remote PC cannot hear a link-local discovery request on the transit segment. Specialized proxy mechanisms exist, but they are not configured or required here. Name the adjacent router as the next hop.

A **fully specified** route states both the exit and the neighbor. It still needs Layer 2 resolution for that neighbor on Ethernet. An active interface and installed static route do not guarantee that the stated neighbor address exists or will answer.

## Scope a link-local next hop

A link-local address is meaningful only within one link. The text `fe80::2` can legitimately identify interfaces on several different links. IOS cannot infer which link you mean merely from those 128 address bits.

```diagram
{"type":"topology","title":"A link-local next hop includes its link","caption":"The two R2 interfaces deliberately use different link-local values in this lab so a wrong-interface error is visible.","nodes":[{"id":"r1","kind":"router","label":"R1","sub":"fe80::1 on each link","x":3,"y":3},{"id":"r2","kind":"router","label":"R2","sub":"Primary fe80::2; backup fe80::3","x":9,"y":3}],"links":[{"from":"r1","to":"r2","label":"2001:db8:12::/64; peer fe80::2","fromLabel":"Gi0/0","toLabel":"Gi0/0","accent":true},{"from":"r1","to":"r2","label":"2001:db8:13::/64; peer fe80::3","fromLabel":"Gi0/1","toLabel":"Gi0/1","style":"dashed"}],"trace":{"flows":[{"path":["r1","r2"],"via":[0],"label":"Packet for 2001:db8:20::/64","tags":{"r1":"2001:db8:20::/64 via fe80::2 Gi0/0","r2":"Destination not rewritten to fe80::2"}},{"path":["r1","r2"],"via":[1],"label":"A route pairing fe80::2 with Gi0/1","stop":"r1","stopText":"No fe80::2 on Gi0/1 · cannot deliver"}]}}
```

For R1's primary route, the useful next-hop identity is **fe80::2 on GigabitEthernet0/0**. The correct command is:

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/0 fe80::2
R1(config)# end
```

Omitting the interface from a link-local next-hop command is invalid. Supplying an interface makes the syntax complete, but does not prove you supplied the **correct** interface. If `fe80::2` is not present on Gi0/1, a route through that pair cannot deliver to the intended neighbor even if its interface is up and the route is installed.

Read the peer's `show ipv6 interface brief` to establish its actual address on the connected interface. The local neighbor cache can corroborate bindings learned through traffic, but it is not guaranteed to contain every peer address. Pinging a peer's global address alone does not necessarily reveal its link-local address in the cache.

A link-local ping also needs a link selection. Documented IOS interactive behavior asks for `Output Interface:` after a command such as `ping fe80::2`. Enter the local exit interface, not the peer's interface name. Exact prompt support varies in Packet Tracer; the lab also tests the globally unique transit addresses to establish connectivity independently.

:::trap
The next hop can be link-local while the packet's destination is a remote global unicast address. The router resolves the local neighbor and forwards the original packet toward it. It does not replace the packet's destination with `fe80::2`.
:::

## Network, default, host and floating routes

A **network route** covers the remote LAN. In the diagram, R1's route to `2001:db8:20::/64` points to R2's primary neighbor. R2 needs the corresponding return route for R1's `2001:db8:10::/64`.

A **default route** covers destinations without a more specific installed match:

```ios R1
R1# configure terminal
R1(config)# ipv6 route ::/0 gigabitethernet0/0 fe80::2
R1(config)# end
```

A default does not create downstream connectivity or guarantee a reply. In the lab it reaches a separately configured R2 loopback, `2001:db8:99::8/128`. The destination actually exists and R2 already has a return route to the source LAN, so the test has a complete expected path.

A **host route** uses /128. For `2001:db8:20::12/128` through the backup link, only that address takes the more specific path. Other addresses in `2001:db8:20::/64` keep their /64 path. A distance-200 host route can win that forwarding decision because its prefix is longer; it is not competing for installation with the different /64.

A **floating static route** uses a greater distance than the primary for the same prefix:

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/1 fe80::3 5
R1(config)# end
R1# show running-config
R1# show ipv6 route static
```

With the primary working, the distance-1 route is selected and the distance-5 route remains configured. If the primary interface becomes unusable, the backup can install. It still needs a functioning backup link, the correct neighbor on that link and valid downstream/return paths.

Equal distances can allow multiple usable paths to the same prefix, subject to platform support. That is different from standby. A more-specific destination typo is also not standby: it can take matching traffic while the preferred broad route is healthy.

Ordinary floating routes react to changes in route eligibility; they do not continuously test remote applications. A peer failure behind a switch may leave the local interface up. Inspect what actually caused the preferred route to disappear instead of assuming a distance-5 entry proves one particular physical failure.

## Follow the request and reply

Assume PC-A has `2001:db8:10::11/64` and gateway `fe80::1`. PC-B has `2001:db8:20::12/64` and gateway `fe80::2`. In this lab the /64 LANs are explicitly configured as on-link. In general IPv6, on-link information is separate from simply assigning a host address.

PC-A identifies PC-B as off-link and selects its default router. It resolves R1's local-link address to an Ethernet address if necessary. R1 receives the frame, reads the unchanged destination `2001:db8:20::12` and selects its remote /64 route. It resolves R2's scoped next hop and sends a new Ethernet frame across the transit link.

R2 then uses its connected LAN route and resolves PC-B. The IPv6 source and destination addresses remain PC-A and PC-B through this unfiltered, untranslated lab path. Routers change the link-layer framing and decrement **Hop Limit**, IPv6's hop counter corresponding to IPv4 TTL, as they forward.

For the reply, PC-B selects its own gateway. R2 must have a route covering `2001:db8:10::11`. R1 finally delivers the reply through its connected LAN. Forward and return routes can legitimately use different links, provided both directions work.

A router-originated ping can use a transit source that the far router already knows as connected. That success does not establish a return route to the PC LAN. Test from the actual PCs or deliberately select an appropriate router source on an image that supports it. Record the source used, not just the destination that answered.

## Verify and troubleshoot

Representative selected-route output:

```output R1# show ipv6 route static
S   2001:DB8:20::/64 [1/0]             ← destination, distance, metric
     via FE80::2, GigabitEthernet0/0  ← complete scoped next hop
```

After a primary-link failure, the intended backup entry is:

```output R1# show ipv6 route static
S   2001:DB8:20::/64 [5/0]
     via FE80::3, GigabitEthernet0/1  ← different link and neighbor
```

The brackets describe administrative distance and metric, not hop count and packet loss. `show ipv6 route static` filters selected static entries. Use `show running-config` to find unselected backup candidates as well.

| Observation | Next evidence to collect |
|---|---|
| Route command rejected | Prefix syntax, mode, and interface requirement for a link-local next hop |
| Configured route absent | Interface state, resolving route, competing candidate and distance |
| Route installed but ping fails | Actual peer address on the named link, neighbor state, downstream and return routes |
| Local pings work but transit fails | Global IPv6 forwarding and both end-host gateways |
| Unexpected backup path | Exact prefix lengths, distances and the primary route's current eligibility |

In the neighbor cache, a reachable state means recently confirmed reachability. Stale alone is not a fault. Incomplete means address resolution has not completed; sustained incomplete state during repeated failure is useful evidence of a local resolution problem. Compare the address **and interface** before deciding that a similarly named neighbor elsewhere in the table is the correct one.

Do not require an exact route-table entry count. Local multicast entries, formatting and additional implementation-generated routes can vary. The meaningful checks are whether the necessary connected, local and remote prefixes are present with the intended next hops.

## Exam focus

You have now configured and tested routes in both address families. Chapter 21 returns to IPv4 to introduce OSPF's neighbor and path calculations; Chapter 22 then transfers those mechanisms to IPv6. Keep longest prefix match, next-hop scope and the return path as your checks when routes become learned automatically.

Configure each static-route type from an address plan, read its selected entry, and explain how its next hop is reached. Practice spotting a correct link-local address paired with the wrong exit interface; valid command syntax does not guarantee valid forwarding.

For every failed endpoint test, walk the request and the reply separately. Combine route-table evidence with interface and neighbor information. You should finish able to justify both the proposed repair and the test that demonstrates it worked.
