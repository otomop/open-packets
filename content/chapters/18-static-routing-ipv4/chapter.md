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

A router can have working interfaces and still be unable to deliver a packet to a remote LAN. Its connected routes describe its own links. A route to another network must come from an additional source. In this chapter you supply it yourself, check that the router can use it, and prove that the destination can send a reply.

The examples use two routers with two separate Ethernet links. Work through the route decisions before entering commands. Understanding why an entry should appear makes the verification much more useful than checking that IOS accepted a line.

## How static routes become usable

:::facts
- An ordinary IOS static route has administrative distance **1**. A connected route has distance **0**; an OSPF route normally has distance **110**.
- A network route identifies a prefix. A host route uses mask `255.255.255.255`, or **/32**.
- An IPv4 default route identifies `0.0.0.0 0.0.0.0`, or **/0**.
- A floating static route has a higher distance than the preferred route to the **same prefix**. Distance **255** is not usable.
- Forwarding uses the longest matching **installed** prefix. A successful ping also needs a working return path.
:::

A **static route** is an administrator's instruction about where a destination can be reached. It remains in the configuration until changed or removed. That does not mean it remains in the routing table under every condition. IOS must be able to resolve its next hop, the required interface must be usable, and a more preferred route to that same prefix may take its place.

Keep three checks separate. The configuration shows what you requested. The routing table shows the routes currently selected. Packet tests show whether forwarding and the return path actually work. An installed route does not prove that the remote server is available, and a line in the configuration does not prove that the route is installed.

Static routes are useful for a small, stable connection or a deliberate backup. They do not exchange routing-protocol updates, but the network still uses supporting mechanisms such as ARP. Their maintenance cost grows when many routers or prefixes change: an administrator must keep the instructions consistent across the path.

```diagram
{"type":"topology","title":"Two paths between two LANs","caption":"Each router needs a route to the other router's LAN. The two transit networks are separate routed links.","nodes":[{"id":"a","kind":"pc","label":"PC-A","sub":"192.168.10.11/24","x":0.5,"y":3},{"id":"r1","kind":"router","label":"R1","sub":"LAN .10.1","x":3.5,"y":3},{"id":"r2","kind":"router","label":"R2","sub":"LAN .20.1","x":8.5,"y":3},{"id":"b","kind":"pc","label":"PC-B","sub":"192.168.20.12/24","x":11.5,"y":3}],"links":[{"from":"a","to":"r1","label":"192.168.10.0/24"},{"from":"r1","to":"r2","label":"Primary 10.0.12.0/30","fromLabel":"Gi0/0 .1","toLabel":"Gi0/0 .2","accent":true},{"from":"r1","to":"r2","label":"Backup 10.0.13.0/30","fromLabel":"Gi0/1 .1","toLabel":"Gi0/1 .2","style":"dashed"},{"from":"r2","to":"b","label":"192.168.20.0/24"}],"trace":{"flows":[{"path":["a","r1","r2","b"],"via":[null,1,null],"back":true,"label":"PC-A to PC-B","tags":{"a":"To gateway 192.168.10.1","r1":"Needs route covering 192.168.20.12","r2":"Connected route to PC-B LAN"},"backTags":{"r2":"Needs route covering PC-A","r1":"Delivers on connected LAN"}}]}}
```

For PC-A to reach PC-B, PC-A first sends the packet to its gateway, `192.168.10.1`. R1 then needs a route covering `192.168.20.12`. R2 already has a connected route to that destination's LAN. For the reply, those roles reverse: R2 needs a route covering PC-A, while R1 can deliver directly onto its connected LAN.

## Configure network and host routes

The core syntax is `ip route destination mask next-hop` in global configuration mode. The destination is the **network address**, not an arbitrary host inside the network. The next-hop address belongs to the router that should receive the packet next, not to the configuring router.

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 10.0.12.2
R1(config)# end
R1# show ip route static
```

Here `192.168.20.0` and `255.255.255.0` describe the remote /24. `10.0.12.2` is R2's primary transit address. It is directly reachable from R1 in this example. The command does not assign an interface address and does not tell R2 how to reach anything.

Representative abbreviated IOS output:

```output R1# show ip route static
S    192.168.20.0/24 [1/0] via 10.0.12.2    ← static, distance 1, metric 0
```

A host route uses all 32 destination bits. For example, `ip route 192.168.20.12 255.255.255.255 10.0.13.2` identifies PC-B alone. It can coexist with the /24 route. When both are installed, PC-B's address matches the /32, while `192.168.20.13` matches only the /24. Host routes are useful for a specific exception; they are not a requirement for every host in a remote LAN.

To remove a route deliberately, read its current configuration and use the corresponding `no ip route ...` line. Including its destination, mask, interface, next hop and nondefault distance as configured makes the intended removal explicit. Verify afterwards; do not infer success merely from an absence of error text.

:::trap
`ip route 192.168.20.12 255.255.255.0 ...` mixes a host address with the /24 network mask. For the whole LAN, use `192.168.20.0`. For that one address, use a /32 mask. A route's mask describes the destination, not the transit link.
:::

## Choose the next-hop form

IOS accepts different ways to describe the path. They solve the same forwarding problem but make different assumptions.

| Form | Example after the destination and mask | What IOS must determine |
|---|---|---|
| Next hop only | `10.0.12.2` | Resolve that address through the routing table |
| Exit interface only | `serial0/0/0` | Send through the specified interface; suitable for a true point-to-point link |
| Fully specified | `gigabitethernet0/0 10.0.12.2` | Use the named next hop through the named interface |

A next-hop-only route is often called **recursive**: another route determines how to reach the next-hop address. A directly connected transit subnet provides that resolution in the simple example. A next hop can also be reachable through another route, but it must resolve successfully without a routing dependency on itself. You do not need to design multistage recursion to meet this chapter's objective.

An interface-only route on Ethernet has a significant consequence. The router treats destinations covered by that route as reachable directly on that Ethernet link and may ARP for each destination. Remote hosts will not hear those requests across a router. Proxy ARP might hide the mistake on some networks, but its availability is not a sound prerequisite for a remote-LAN route.

Use a next-hop address for the Ethernet examples here. A **fully specified** route additionally fixes the intended exit interface:

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 gigabitethernet0/0 10.0.12.2
R1(config)# end
```

This is an alternative to the earlier next-hop-only line, not another line to add blindly. The router still needs the next hop's Ethernet address through ARP. Naming both values does not remove Layer 2 address resolution.

The interface choice also matters during failures. A recursive next hop could remain reachable through an unexpected alternate route. Specifying the intended interface makes the local-link failure exercise more predictable. Neither form, by itself, tests the availability of every device beyond that next hop.

## Default routes

A **default route** is the least specific destination route: /0 matches every IPv4 address. It is used when no longer installed prefix matches. It is common on a router with one general exit toward the rest of a network.

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

The `S` identifies a static route and the asterisk marks a candidate default. A default does not replace more specific entries. A packet for PC-B still matches /24; a packet for a separately configured R2 loopback at `203.0.113.8` can use /0.

A default is only a forwarding instruction. It does not create Internet access, a destination host, or a return route. If R2 has no way to deliver the packet, sending it to R2 will not solve that problem. Two routers with defaults pointing at each other can also create a loop for unknown destinations. A packet's TTL limits that loop; the sensible repair is to correct the routing design.

Use `show ip route` to inspect the default explicitly. Destination-specific show-command formatting and default lookup behavior vary across IOS implementations. Read the full installed table and calculate the longest match rather than treating one diagnostic message as proof that no default exists.

## Floating static routes

A **floating static route** is a less preferred candidate that becomes usable when the preferred route to the same destination prefix is withdrawn. In the lab, both primary and backup are static, so distance 5 is greater than the primary's default distance 1.

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 gigabitethernet0/1 10.0.13.2 5
R1(config)# end
R1# show running-config
R1# show ip route static
```

The configuration contains both route lines. With the primary working, the routing table normally contains the distance-1 route. When its required interface goes down, the distance-5 route can install if the backup link is usable. When the primary returns, its lower distance makes it preferred again.

Distance is relative to the competing route. A backup intended to follow an OSPF route at distance 110 could use 120. Distance 5 would beat 110 for the same prefix. Distance 255 cannot serve as a working backup. Equal distances can permit multiple installed paths, subject to the platform's multipath behavior; that is not the intended primary/standby design.

:::trap
A distance-200 /32 still wins forwarding over an installed distance-1 /24 for that single destination. Distance selects candidates for the same prefix; longest prefix match selects among the installed destination entries. A mistyped /25 backup can take half a /24's traffic immediately.
:::

The failover trigger must be real. Shutting a directly connected router-to-router link makes both ends lose that link. A remote failure behind an intermediate switch may leave your local interface up. The ordinary static route does not continuously ping the remote LAN. Tracking features can add health checks, but their configuration is outside this introductory chapter.

## Test the return path

A ping has two routed packets: request and reply. Record both source and destination before concluding which routes it tested.

An ordinary IOS router ping normally chooses the outgoing interface's address as its source. If R1 pings PC-B over the primary link, that source is `10.0.12.1`. R2 already has a connected route back to that transit subnet. The ping may succeed even while R2 lacks any route to PC-A's `192.168.10.0/24` LAN.

Test from PC-A as well. Its source remains `192.168.10.11` in this lab, so the reply requires R2's return route. A router test sourced from R1's LAN address also tests that return prefix. IOS extended ping can select a source address; some simulator images support the inline `source` keyword and others require the interactive extended-ping prompts.

For example, R1 owns LAN address `192.168.10.1`, and PC-B is `192.168.20.12`. On an IOS image accepting the inline form:

```ios R1
R1# ping 192.168.20.12 source 192.168.10.1
R1# traceroute 192.168.20.12
```

The source must belong to R1. If the inline form is unsupported, enter `ping` with no destination at privileged EXEC, accept protocol `ip`, enter target `192.168.20.12`, accept the ordinary count/size/timeout defaults, answer `y` to extended commands, and enter `192.168.10.1` at the source prompt. Accept the remaining defaults. The PC test is a useful fallback when that simulator omits extended ping.

Traceroute sends probes with increasing TTL values to gather hop responses, as introduced in Chapter 01. The ordinary command above does not automatically reuse the ping's chosen source. Record its actual source and treat unanswered hops as missing responses, not proof that the forwarding path stops there.

For a working PC-to-PC exchange, check these decisions in order: PC-A's gateway, R1's remote-LAN route, R2's connected delivery to PC-B, PC-B's gateway, R2's return route, and R1's connected delivery to PC-A. ARP must resolve the required local neighbors along the way. A routing fault is one possibility among address, gateway, interface and filtering faults; the observed table and addressing must support your diagnosis.

## Verify and troubleshoot

Use a repeatable sequence instead of changing several route lines at once.

| Check | Evidence to inspect | What it establishes |
|---|---|---|
| Interfaces | `show ip interface brief` | Correct local addresses and usable link state |
| Configured intent | `show running-config` | Destination, mask, next hop, interface and distance entered |
| Installed routes | `show ip route`; `show ip route static` | Which candidate routes are currently selected |
| Next-hop reachability | Ping the directly attached peer; inspect `show ip arp` | Local transit connectivity and address resolution |
| Destination choice | Inspect covering prefixes; use `show ip route address` where supported | Most specific installed match |
| End-to-end path | PC ping and traceroute; inspect the reverse table | Forwarding and return connectivity for the tested source |

A missing route can mean an unusable interface, unresolved next hop, wrong destination, or a better competing candidate. An installed route with failed traffic can mean the next-hop address is wrong on an otherwise active Ethernet link, a downstream fault, or a missing return route. Read the evidence before choosing between them.

Traceroute can help distinguish primary and backup paths, but response addresses and unanswered probes depend on device behavior. Do not require every hop to print a particular interface address as the sole success test. Use the selected routes, interface state and completed endpoint ping together.

## Exam focus

Be able to build all four destination types: network, host, default and floating. For each route, identify its destination prefix, exit path and distance before predicting whether it installs. Then perform a separate longest-prefix comparison for the packet.

Finish the lab able to explain why a router ping can succeed while a PC ping fails, why an Ethernet route should identify a next hop, and why a configured backup may be absent from the routing table. Those explanations demonstrate the mechanism behind the commands.
