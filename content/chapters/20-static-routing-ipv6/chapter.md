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

R1 has an IPv6 address on every interface, yet PC-A cannot reach PC-B on the LAN behind R2. Nothing is broken. R1 has no route to `2001:db8:20::/64`, so it drops the packet. You solved this problem for IPv4 in Chapter 18 with `ip route`. Here you solve it for IPv6 with `ipv6 route`.

Most of what you know carries over: longest prefix match, administrative distance, and the rule that a reply needs its own route. Three things are new. The router must be told to forward IPv6 at all, it finds the next hop's MAC address with Neighbor Discovery instead of ARP, and a link-local next hop such as `fe80::2` must be paired with an exit interface. By the end you will be able to configure network, default, host and floating IPv6 static routes, read them in the routing table, and find the fault when a route is installed but traffic still fails.

## Apply the IPv4 routing method to IPv6

:::facts
- IPv6 static routes use `ipv6 route prefix/length ...` in global configuration mode.
- An ordinary static route has administrative distance **1**. A floating route must have a higher distance than its preferred competitor for the same prefix.
- The default prefix is **::/0**. A single-address host route uses **/128**.
- A link-local next hop requires an **exit interface** in the IOS static-route command.
- Enable `ipv6 unicast-routing` for inter-interface IPv6 forwarding on the basic IOS router used here.
- Ethernet next-hop MAC resolution uses **Neighbor Discovery**, not ARP.
:::

A router chooses a route for an IPv6 packet the same way it does for IPv4: it uses the installed route with the longest prefix that contains the destination. A packet for `2001:db8:20::12` can match `2001:db8:20::12/128`, `2001:db8:20::/64` and `::/0`. If all three are installed, /128 wins. If that host route is removed, /64 wins. If neither specific prefix exists but a default does, `::/0` forwards the packet.

Administrative distance answers a different question. When two sources offer a route to the same prefix, the one with the lower distance is installed in the routing table. Distance never lets a shorter prefix beat a longer one: a /128 with distance 200 still beats a /64 with distance 1.

IPv4 and IPv6 have separate routing tables on the same router. A successful IPv4 ping shows that the cable and interface work, but it says nothing about the IPv6 addresses, routes or gateways. Start a fault report by asking which address family the destination is in, then read that family's table: `show ipv6 route`, not `show ip route`.

The examples use the documentation prefix `2001:db8::/32` and give every link a /64.

## Enable addressing and forwarding

A Cisco router forwards IPv4 by default but does not forward IPv6 until you enter `ipv6 unicast-routing`. Addressing the interfaces is not enough.

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

Each line has a different job. The global command lets R1 move IPv6 packets between interfaces. The first address line assigns `2001:db8:12::1` with a /64 prefix. The second replaces the automatically generated link-local address with `fe80::1`, which is easier to read and type as a next hop. `no shutdown` enables the interface; the link comes up when the peer and cable are also working.

:::trap Pinging the router proves little
Without `ipv6 unicast-routing`, a router still answers pings to its own IPv6 addresses. It behaves like a host: it replies, but it does not forward a PC's packet out of another interface. Test through the router, not just to it.
:::

Each addressed interface that is up adds two routes. A connected route (code `C`) describes the attached /64. A local route (code `L`) is a /128 for the router's own address. Do not confuse a local /128 with a **static host route**, which is a /128 you configure for a single address on some other device.

`ipv6 unicast-routing` also makes the router send Router Advertisements on its interfaces. That is how the SLAAC hosts from Chapter 19 learn their prefix and default gateway.

## Choose an IPv6 route form

`ipv6 route` takes a destination prefix and then says how to reach it: a next-hop address, an exit interface, or both.

| Form | Example | Interpretation |
|---|---|---|
| Recursive, next hop only | `ipv6 route 2001:db8:20::/64 2001:db8:12::2` | Resolve the next-hop address through another route |
| Exit interface only | `ipv6 route 2001:db8:20::/64 serial0/0/0` | Direct traffic onto the specified point-to-point interface |
| Fully specified | `ipv6 route 2001:db8:20::/64 gigabitethernet0/0 fe80::2` | Use this neighbor on this exact link |

A **recursive** route names only a next-hop address. The router must look that address up in the routing table to find the exit interface, which is the recursion. R1 can use `2001:db8:12::2` because it has the connected route `2001:db8:12::/64` on Gi0/0. If that connected route disappears, the static route is removed from the table as well. IOS does not use a default route to resolve a recursive IPv6 next hop.

An **interface-only** route suits a point-to-point serial link, where only one device is at the other end. On Ethernet it causes trouble. With no next hop, R1 treats every address in the remote prefix as directly attached and sends a Neighbor Discovery request for PC-B itself onto the transit link. PC-B is behind R2 and never hears the request, so nothing answers. On Ethernet, always name the neighboring router as the next hop.

A **fully specified** route gives both the exit interface and the next hop. It is the only form that works with a link-local next hop, and the next section explains why. The router still has to resolve the next hop's MAC address with Neighbor Discovery, so the route can be installed and still fail if no device on that link owns the address.

## Scope a link-local next hop

A link-local address is meaningful only on one link. Every link uses the same `fe80::/10` range, so `fe80::2` can exist on several of a router's links at once. Given `fe80::2` alone, IOS cannot tell which interface to send the packet out of. You must tell it.

```diagram
{"type":"topology","title":"A link-local next hop includes its link","caption":"The two R2 interfaces deliberately use different link-local values in this lab so a wrong-interface error is visible.","nodes":[{"id":"r1","kind":"router","label":"R1","sub":"fe80::1 on each link","x":3,"y":3},{"id":"r2","kind":"router","label":"R2","sub":"Primary fe80::2; backup fe80::3","x":9,"y":3}],"links":[{"from":"r1","to":"r2","label":"2001:db8:12::/64; peer fe80::2","fromLabel":"Gi0/0","toLabel":"Gi0/0","accent":true},{"from":"r1","to":"r2","label":"2001:db8:13::/64; peer fe80::3","fromLabel":"Gi0/1","toLabel":"Gi0/1","style":"dashed"}],"trace":{"flows":[{"path":["r1","r2"],"via":[0],"label":"Packet for 2001:db8:20::/64","tags":{"r1":"2001:db8:20::/64 via fe80::2 Gi0/0","r2":"Destination not rewritten to fe80::2"}},{"path":["r1","r2"],"via":[1],"label":"A route pairing fe80::2 with Gi0/1","stop":"r1","stopText":"No fe80::2 on Gi0/1 · cannot deliver"}]}}
```

For R1's primary route, the next hop is **fe80::2 on GigabitEthernet0/0**. The correct command is:

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/0 fe80::2
R1(config)# end
```

IOS rejects a link-local next hop with no interface. It accepts any interface you supply, though, including the wrong one. If you pair `fe80::2` with Gi0/1, the route is installed while Gi0/1 is up, but R2's address on that link is `fe80::3`. No device answers for `fe80::2` there and the traffic is dropped.

To find the right pair, run `show ipv6 interface brief` on the peer and read the link-local address of the interface that faces you. `show ipv6 neighbors` on your own router lists the neighbors it has already resolved, each with its interface.

A link-local ping needs the same information. After `ping fe80::2`, IOS asks `Output Interface:`. Enter your own exit interface, such as `gigabitethernet0/0`, not the peer's. Packet Tracer does not always show this prompt, so the lab also tests the global transit addresses.

:::trap
The next hop can be link-local while the packet's destination is a remote global unicast address. The router resolves the local neighbor and forwards the original packet toward it. It does not replace the packet's destination with `fe80::2`.
:::

## Network, default, host and floating routes

The four route types the exam names are the same command with a different prefix length or distance.

A **network route** covers a remote subnet. In the diagram, R1's route to `2001:db8:20::/64` points to R2 on the primary link. R2 needs the matching route back to R1's LAN, `2001:db8:10::/64`.

A **default route** uses `::/0`, which matches every destination. Because it is the shortest possible prefix, it is used only when nothing more specific matches:

```ios R1
R1# configure terminal
R1(config)# ipv6 route ::/0 gigabitethernet0/0 fe80::2
R1(config)# end
```

A default route only hands the packet to the next router. That router still needs a route to the destination and a route back to the source. In the lab the default reaches a loopback on R2, `2001:db8:99::8/128`, and R2 already has a return route to PC-A's LAN, so the ping succeeds.

A **host route** uses /128 and matches one address. With `2001:db8:20::12/128` pointing out of the backup link, only PC-B's address takes that path. Every other address in `2001:db8:20::/64` keeps using the /64 route. This holds even if the host route has distance 200, because the /128 and the /64 are different prefixes and distance compares only routes to the same prefix.

A **floating static route** is a backup for a prefix that already has a route. Give it the same prefix and a higher distance:

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/1 fe80::3 5
R1(config)# end
R1# show running-config
R1# show ipv6 route static
```

While the primary works, the distance-1 route is in the table and the distance-5 route sits in the running configuration only. When Gi0/0 goes down, IOS removes the primary and installs the backup. The backup still needs a working link, the correct neighbor on that link, and a return route on R2.

Two routes to the same prefix with equal distances are both installed and share the traffic. That is load balancing, not a backup.

A floating route takes over only when the primary leaves the routing table, which normally means its exit interface went down. It does not test the path. If R2 fails behind a switch, R1's interface stays up, the primary stays installed and the traffic is lost.

## Follow the request and reply

Trace one ping to see every decision. PC-A is `2001:db8:10::11/64` with gateway `fe80::1`. PC-B is `2001:db8:20::12/64` with gateway `fe80::2`.

PC-A sees that PC-B is in a different prefix and sends the packet to its default gateway. It uses Neighbor Discovery to find R1's MAC address if it does not already have it. R1 receives the frame, reads the destination `2001:db8:20::12` and matches its /64 static route. It resolves `fe80::2` on Gi0/0 and sends a new Ethernet frame across the transit link.

R2 matches its connected LAN route and resolves PC-B. The IPv6 source and destination addresses stay the same from PC-A to PC-B. Each router replaces the Ethernet header and decrements the **Hop Limit**, the IPv6 field that does the job of the IPv4 TTL.

The reply is a separate routing problem. PC-B sends it to its own gateway, and R2 must have a route that covers `2001:db8:10::11`. R1 then delivers it through its connected LAN. The forward and return paths may use different links, as long as both work.

:::trap A router's own ping can mislead you
When R1 pings PC-B, it sources the packet from its exit interface, `2001:db8:12::1`. R2 is connected to that prefix, so the reply returns even when R2 has no route to PC-A's LAN. Test from the PCs, and note the source address of every ping you rely on.
:::

## Verify and troubleshoot

`show ipv6 route static` lists the static routes that are installed:

```output R1# show ipv6 route static
S   2001:DB8:20::/64 [1/0]             ← destination, distance, metric
     via FE80::2, GigabitEthernet0/0  ← complete scoped next hop
```

After a primary-link failure, the backup entry replaces it:

```output R1# show ipv6 route static
S   2001:DB8:20::/64 [5/0]
     via FE80::3, GigabitEthernet0/1  ← different link and neighbor
```

The brackets hold administrative distance and metric. A static route's metric is 0. This command shows only installed routes, so a floating route that is waiting does not appear. Use `show running-config` to see every configured route. To ask which single route the router would use for one destination, add the address: `show ipv6 route 2001:db8:20::12`.

| Observation | Next evidence to collect |
|---|---|
| Route command rejected | Prefix syntax, mode, and interface requirement for a link-local next hop |
| Configured route absent | Interface state, resolving route, competing candidate and distance |
| Route installed but ping fails | Actual peer address on the named link, neighbor state, downstream and return routes |
| Local pings work but transit fails | Global IPv6 forwarding and both end-host gateways |
| Unexpected backup path | Exact prefix lengths, distances and the primary route's current eligibility |

`show ipv6 neighbors` shows the neighbor cache, IPv6's equivalent of the ARP table. `REACH` means the neighbor answered recently. `STALE` means the entry has not been confirmed lately; it is normal and is rechecked when traffic next uses it. `INCMP` (incomplete) means the router asked for the MAC address and has no answer yet. An entry that stays incomplete while pings fail points to a wrong next-hop address or the wrong interface. Check the interface column as well as the address, because the same `fe80::` address can appear on two links.

## Exam focus

The exam asks you to configure and verify four IPv6 static route types and to find the fault in a broken one. Make sure you can do each of these from memory:

- Write a network, default (`::/0`), host (`/128`) and floating route from an address plan.
- Reject `ipv6 route 2001:db8:20::/64 fe80::2` on sight: a link-local next hop needs an exit interface.
- Spot a link-local next hop paired with the wrong interface. The command is accepted and the route is installed, but traffic fails.
- Read `[1/0]` and `[5/0]` as distance and metric, and explain why a floating route is missing from `show ipv6 route static`.
- Pick the forwarding route by longest prefix match first, and use distance only between routes to the same prefix.
- Name `ipv6 unicast-routing` when the router answers pings but does not forward.
- Check the return route whenever a router's ping works and a PC's ping fails.

Static routes do not adapt when the network changes. Chapter 21 returns to IPv4 and introduces OSPF, which learns routes from neighboring routers, and Chapter 22 applies it to IPv6. Longest prefix match, next-hop scope and the return path stay your checks when routes are learned automatically.
