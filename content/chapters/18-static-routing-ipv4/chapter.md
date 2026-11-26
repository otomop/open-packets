---
id: static-routing-ipv4
number: 18
title: Static routing (IPv4)
subtitle: Configure a path to a remote network and verify the route back.
part: routing
domain: routing
minutes: { lesson: 60, lab: 80 }
summary: Configure network, host, default and floating IPv4 routes. Distinguish a configured route from an installed route, choose a suitable next-hop form, and test both directions.
objectives:
  v1: ["3.3", "3.3.a", "3.3.b", "3.3.c", "3.3.d"]
  v2: ["3.2", "3.2.a", "3.2.b", "3.2.c", "3.2.d"]
prereqs: [routing-table]
sectionIds:
  How static routes become usable: why-a-router-needs-to-be-told
  Configure network and host routes: the-ip-route-command
  Choose the next-hop form: next-hop-exit-interface-or-both
  Default routes: default-routes
  Floating static routes: floating-static-routes
  Test the return path: the-return-path-and-how-to-test-it
  Verify and troubleshoot: verify-and-troubleshoot
  Exam focus: exam-focus
sources:
  - { title: "Cisco: Basic IP Routing", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/configuration/15-mt/iri-15-mt-book/iri-iprouting.html" }
  - { title: "Cisco: Configure a Next Hop IP Address for Static Routes", url: "https://www.cisco.com/c/en/us/support/docs/dial-access/floating-static-route/118263-technote-nexthop-00.html" }
  - { title: "Cisco: Administrative Distance", url: "https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html" }
  - { title: "Cisco: Route Selection in Cisco Routers", url: "https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html" }
  - { title: "Cisco: Extended Ping and Extended Traceroute", url: "https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html" }
---

R1 and R2 are cabled together, every interface is up, and PC-A can ping its gateway. A ping from PC-A to PC-B on R2's LAN still fails. Nothing is broken. R1 knows only the networks its own interfaces sit in, and nobody has told it where `192.168.20.0/24` is, so it drops every packet for that network.

Chapter 17 taught you to read a routing table: route codes, administrative distance and longest prefix match. In this chapter you write the entries yourself. By the end you will be able to configure a network route, a host route, a default route and a floating backup route, predict whether each one is installed, and prove that traffic works in both directions.

## How static routes become usable

:::facts
- A static route has administrative distance **1** by default. A connected route has distance **0**; an OSPF route has **110**.
- A network route names a prefix. A host route uses mask `255.255.255.255`, or **/32**, and matches one address.
- The IPv4 default route is `0.0.0.0 0.0.0.0`, or **/0**, and matches every address.
- A floating static route has a higher distance than the preferred route to the **same prefix**. A route with distance **255** is never installed.
- Forwarding uses the longest matching **installed** prefix. A successful ping also needs a working return path.
:::

A **static route** is a line of configuration that says: to reach this destination network, send the packet to that neighbor. The router does not learn it from another device and does not check it with one. It trusts what you typed.

The line stays in the configuration until you remove it. It is **installed** in the routing table only while the router can use it, and two conditions decide that:

- **The way out works.** If the route names an exit interface, that interface must be up. If it names a next-hop address, an installed route must cover that address.
- **Nothing better exists for the same prefix.** A route to the same prefix with a lower administrative distance takes its place.

That gives you three separate things to check. `show running-config` shows what you asked for. `show ip route` shows what the router is using now. A ping from the right source shows whether packets get there and back. Passing one check does not prove the next.

Static routes suit a small network, a branch with one exit, and a backup path. Routers exchange no routing updates for them, so they cost no bandwidth and are easy to predict. The price is that they never adapt. When a network is added or a link moves, you must change every affected router by hand. Larger networks run a routing protocol such as OSPF (Chapter 21) and keep static routes for defaults and backups.

```diagram
{"type":"topology","title":"Two paths between two LANs","caption":"Each router needs a route to the other router's LAN. The two transit networks are separate routed links.","nodes":[{"id":"a","kind":"pc","label":"PC-A","sub":"192.168.10.11/24","x":0.5,"y":3},{"id":"r1","kind":"router","label":"R1","sub":"LAN .10.1","x":3.5,"y":3},{"id":"r2","kind":"router","label":"R2","sub":"LAN .20.1","x":8.5,"y":3},{"id":"b","kind":"pc","label":"PC-B","sub":"192.168.20.12/24","x":11.5,"y":3}],"links":[{"from":"a","to":"r1","label":"192.168.10.0/24"},{"from":"r1","to":"r2","label":"Primary 10.0.12.0/30","fromLabel":"Gi0/0 .1","toLabel":"Gi0/0 .2","accent":true},{"from":"r1","to":"r2","label":"Backup 10.0.13.0/30","fromLabel":"Gi0/1 .1","toLabel":"Gi0/1 .2","style":"dashed"},{"from":"r2","to":"b","label":"192.168.20.0/24"}],"trace":{"flows":[{"path":["a","r1","r2","b"],"via":[null,1,null],"back":true,"label":"PC-A to PC-B","tags":{"a":"To gateway 192.168.10.1","r1":"Needs route covering 192.168.20.12","r2":"Connected route to PC-B LAN"},"backTags":{"r2":"Needs route covering PC-A","r1":"Delivers on connected LAN"}}]}}
```

Follow one ping from PC-A to PC-B. PC-B is in another subnet, so PC-A sends the packet to its gateway, `192.168.10.1` on R1. R1 looks up `192.168.20.12`. Its connected routes are `192.168.10.0/24`, `10.0.12.0/30` and `10.0.13.0/30`. None of them matches, so R1 needs a route covering `192.168.20.12`. With that route in place, R2 receives the packet and delivers it on its connected LAN.

Then PC-B replies to `192.168.10.11`, and the same problem appears in reverse: R2 needs a route covering PC-A, while R1 can deliver onto its connected LAN. Every static-routing design needs a route in each direction.

## Configure network and host routes

The basic command is `ip route destination mask next-hop`, entered in global configuration mode. It has two halves:

- The **destination and mask** describe where the packets are going. Together they must be a network address, such as `192.168.20.0 255.255.255.0`, not a host inside the network.
- The **next hop** is the address of the neighboring router's interface on the link you share with it. It is never one of the configuring router's own addresses.

On R1, the remote LAN is `192.168.20.0/24` and R2's address on the primary link is `10.0.12.2`:

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 10.0.12.2
R1(config)# end
R1# show ip route static
```

The command changes R1 only. It assigns no interface address and tells R2 nothing. R2 needs its own line for the reply, pointing the other way: `ip route 192.168.10.0 255.255.255.0 10.0.12.1`.

Representative abbreviated IOS output:

```output R1# show ip route static
S    192.168.20.0/24 [1/0] via 10.0.12.2    ← static, distance 1, metric 0
```

Read the entry the way Chapter 17 showed. `S` is the source, static. `192.168.20.0/24` is the destination. `[1/0]` is administrative distance 1 and metric 0; a static route has no cost to calculate, so its metric is 0. `10.0.12.2` is the next hop.

A **network route** like this one covers every address in its prefix. The prefix can be wider than one LAN: `ip route 192.168.20.0 255.255.252.0 10.0.12.2` is a single summary route for `192.168.20.0` through `192.168.23.255`.

A **host route** uses all 32 destination bits, so it matches exactly one address. `ip route 192.168.20.12 255.255.255.255 10.0.13.2` sends traffic for PC-B alone over the backup link. It can coexist with the /24 route. A packet for `192.168.20.12` matches both entries and uses the /32, the longer match. A packet for `192.168.20.13` matches only the /24. Host routes are for exceptions like this one; you do not need one for each host in a remote LAN.

To remove a static route, put `no` in front of the line as it appears in the running configuration, for example `no ip route 192.168.20.0 255.255.255.0 10.0.12.2`. Copy the whole line, including the interface, next hop and distance if it has them, so that you remove exactly that route and leave any backup to the same prefix in place. Check the configuration and the table afterwards.

:::trap
`ip route 192.168.20.12 255.255.255.0 10.0.12.2` mixes a host address with the /24 network mask, and IOS rejects it with `%Inconsistent address and mask`. For the whole LAN, use `192.168.20.0`. For that one address, use a /32 mask. A route's mask describes the destination, not the transit link.
:::

## Choose the next-hop form

After the destination and mask, IOS accepts three ways to describe the way out. All three create a static route with administrative distance 1. They differ in how the router finds the exit interface and the next device.

| Form | Example after the destination and mask | What IOS must determine |
|---|---|---|
| Next hop only | `10.0.12.2` | Resolve that address through the routing table |
| Exit interface only | `serial0/0/0` | Send through the specified interface; suitable for a true point-to-point link |
| Fully specified | `gigabitethernet0/0 10.0.12.2` | Use the named next hop through the named interface |

**Next hop only.** The router has an address but no interface, so it makes a second lookup: which installed route covers `10.0.12.2`? On R1 the answer is the connected route `10.0.12.0/30` on Gi0/0, so the packet leaves through Gi0/0. That second lookup is why this form is called a **recursive** static route. If no installed route covers the next hop, the static route is removed from the table. The resolving route does not have to be connected, but the connected case is the one you need here.

**Exit interface only.** `ip route 192.168.20.0 255.255.255.0 gigabitethernet0/0` tells the router that the destination is out of Gi0/0 and nothing more. The table shows `S 192.168.20.0/24 is directly connected, GigabitEthernet0/0`. The code is still `S` and the distance is still 1, as `show ip route 192.168.20.0` confirms; it is not a connected route.

On a point-to-point serial link there is one device at the far end, so this form works. On Ethernet it causes trouble. The router treats every address in the prefix as if it were on the local link and sends an ARP request for each destination, such as `192.168.20.12`. PC-B is behind R2 and never hears it. Traffic flows only if R2 answers for PC-B with proxy ARP, and a route should not depend on that.

**Fully specified.** Naming both the interface and the next hop avoids both problems:

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 gigabitethernet0/0 10.0.12.2
R1(config)# end
```

This replaces the next-hop-only line; do not configure both. The router needs no second route lookup, and it sends one ARP request, for the MAC address of `10.0.12.2`.

The forms also fail differently. A route that names an interface leaves the table as soon as that interface goes down. A next-hop-only route leaves only when no route resolves its next hop, and with two links to the same neighbor another route might still resolve it. Naming the interface ties the route to one link, which makes failover predictable. The lab uses fully specified routes for that reason.

## Default routes

A branch router with one way out does not need a separate route for every remote network. A **default route** covers them all. Its destination is `0.0.0.0` with mask `0.0.0.0`, the prefix /0. Zero bits have to match, so every IPv4 address matches it. It is also the shortest possible prefix, so longest prefix match uses it only when no more specific installed route matches.

```ios R1
R1# configure terminal
R1(config)# ip route 0.0.0.0 0.0.0.0 gigabitethernet0/0 10.0.12.2
R1(config)# end
R1# show ip route
```

Representative excerpts:

```output R1# show ip route
Gateway of last resort is 10.0.12.2 to network 0.0.0.0
S*   0.0.0.0/0 [1/0] via 10.0.12.2, GigabitEthernet0/0
S    192.168.20.0/24 [1/0] via 10.0.12.2, GigabitEthernet0/0
```

The `S` identifies a static route and the asterisk marks a candidate default. The `Gateway of last resort` line confirms that the router has chosen it. Without a default, that line reads `Gateway of last resort is not set` and the router drops any packet that matches no route.

A default does not replace more specific entries. With the table above, a packet for PC-B at `192.168.20.12` matches both the /24 and the /0 and uses the /24. A packet for `203.0.113.8`, a loopback address the lab adds to R2, matches only the /0 and goes to `10.0.12.2`.

A default moves the packet one hop and no further. R2 must still know where the destination is and how to route the reply. If R1 and R2 each have a default pointing at the other, a packet for a network neither knows bounces between them. Each router lowers its TTL by 1, and the packet is discarded when the TTL reaches 0. TTL limits the damage; the repair is to correct the routes.

Do not confuse this with `ip default-gateway` from Chapter 11. That command gives a Layer 2 switch, which does not route, a gateway for its own management traffic. A router that forwards packets uses `ip route 0.0.0.0 0.0.0.0`.

## Floating static routes

R1 and R2 share two links. You want traffic on the primary link and the second link used only when the primary fails. Two ordinary static routes to `192.168.20.0/24` would both have distance 1, both install, and R1 would share traffic across the two links. A **floating static route** solves this. It names the same destination and mask, points to the other link, and ends with a higher administrative distance.

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 gigabitethernet0/1 10.0.13.2 5
R1(config)# end
R1# show running-config
R1# show ip route static
```

The final `5` is the administrative distance. It is not a metric or a hop count. Chapter 17 gave the rule: among routes to the same prefix, the lowest distance is installed. While the primary at distance 1 is usable, the distance-5 route stays out of the routing table. You can see it only in the running configuration.

When Gi0/0 goes down, the primary leaves the table and the backup is installed in its place:

```output R1# show ip route static
S    192.168.20.0/24 [5/0] via 10.0.13.2, GigabitEthernet0/1
```

When Gi0/0 comes back, the distance-1 route is installed again and the backup returns to waiting. R2 needs the same pair of routes for `192.168.10.0/24`, or replies have no path after a failover.

The distance only has to be higher than the route you are backing up. Behind a static primary, 5 is enough. Behind an OSPF route at distance 110, use a value such as 120; a static route at distance 5 would beat OSPF and become the primary. Distance 255 can never be a backup, because a route with that distance is never installed.

:::trap
A distance-200 /32 still wins forwarding over an installed distance-1 /24 for that single destination. Distance selects candidates for the same prefix; longest prefix match selects among the installed destination entries. A mistyped /25 backup can take half a /24's traffic immediately.
:::

A floating route takes over only when the primary route leaves the table. Shutting a direct router-to-router link does that, because both ends lose the link. If a switch sits between the routers and the far router fails, R1's interface stays up, the primary stays installed and traffic is lost. A static route never tests the path beyond its own interface. IOS can tie a route to a tracked probe, but that is beyond this chapter.

## Test the return path

A ping is two packets, a request and a reply, and each is routed on its own. So a ping proves both directions only for the source address it used.

When you ping from a router, IOS uses the address of the outgoing interface as the source. If R1 pings PC-B over the primary link, the source is `10.0.12.1`. R2 has a connected route back to that transit subnet, so the ping succeeds even when R2 has no route to PC-A's `192.168.10.0/24` LAN. That success says nothing about whether PC-A can reach PC-B.

To test what users see, ping from PC-A. Its source is `192.168.10.11`, so the reply needs R2's return route. You can run the same test from R1 by telling it to use its LAN address as the source. This is an **extended ping**:

```ios R1
R1# ping 192.168.20.12 source 192.168.10.1
R1# traceroute 192.168.20.12
```

The source must be an address R1 owns. Some simulator images do not accept the inline `source` keyword. There, enter `ping` with no destination at privileged EXEC, accept protocol `ip`, enter target `192.168.20.12`, accept the count, size and timeout defaults, answer `y` to extended commands, and enter `192.168.10.1` at the source prompt. Accept the remaining defaults.

Traceroute, introduced in Chapter 01, sends probes with increasing TTL values and lists the routers that answer. Use it to see which link traffic takes: from PC-A, the second hop is normally `10.0.12.2` on the primary and `10.0.13.2` on the backup. An unanswered hop, shown as `*`, means that router sent no response. It does not prove the path stops there.

For a working PC-to-PC exchange, check these decisions in order: PC-A's gateway, R1's remote-LAN route, R2's connected delivery to PC-B, PC-B's gateway, R2's return route, and R1's connected delivery to PC-A. ARP must resolve each local neighbor along the way. A missing route is one possible fault among several; a wrong address, a wrong gateway or a down interface produces the same failed ping.

## Verify and troubleshoot

Work from the interfaces outward, and change one thing at a time.

| Check | Evidence to inspect | What it establishes |
|---|---|---|
| Interfaces | `show ip interface brief` | Correct local addresses and usable link state |
| Configured intent | `show running-config` | Destination, mask, next hop, interface and distance entered |
| Installed routes | `show ip route`; `show ip route static` | Which candidate routes are currently selected |
| Next-hop reachability | Ping the directly attached peer; inspect `show ip arp` | Local transit connectivity and address resolution |
| Destination choice | Inspect covering prefixes; use `show ip route address` where supported | Most specific installed match |
| End-to-end path | PC ping and traceroute; inspect the reverse table | Forwarding and return connectivity for the tested source |

Three symptoms cover most static-routing faults:

- **The route is configured but not in the table.** Its interface is down, its next hop does not resolve, or a route with a lower distance holds the same prefix. The last case is normal for a floating route.
- **The route is installed but traffic fails.** The next-hop address may be wrong: a mistyped address inside the transit subnet still installs, and then ARP gets no answer. Otherwise look for a missing return route or a fault further along the path.
- **Traffic takes the wrong link.** A more specific prefix, such as a mistyped /25 or a leftover /32, is matching first, or two routes share the same distance.

## Exam focus

Be able to write all four route types from a description: a network route, a host route with the /32 mask, a default route with `0.0.0.0 0.0.0.0`, and a floating route with the same prefix and a higher distance at the end of the line. The destination is always a network address with its own mask, and the next hop is always the neighbor's address.

In output, read `S`, `S*`, `[1/0]` and `is directly connected` correctly, and remember that every static form has distance 1 unless you set another. Distance compares routes to the same prefix; longest prefix match chooses between different prefixes.

Be ready to explain three results: why a router ping can succeed while a PC ping fails, why an Ethernet route should name a next hop, and why a configured backup is absent from the routing table.
