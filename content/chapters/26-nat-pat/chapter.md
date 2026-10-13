---
id: nat-pat
number: 26
title: NAT and PAT
subtitle: Translate addresses, share an outside address, and verify both directions of a connection.
part: services
domain: services
minutes: { lesson: 65, lab: 90 }
summary: Configure static, dynamic pool and overload translations, read address and port mappings, and separate translation evidence from routing and application failures.
objectives:
  v1: ["4.1"]
  v2: ["4.3"]
prereqs: [static-routing-ipv4, tcp-udp-ports]
sectionIds:
  Identify the four address terms: the-four-address-terms
  Configure static NAT: static-nat
  Select sources and allocate a pool: dynamic-nat-with-a-pool
  Share an interface or pool with PAT: pat-overload-on-an-interface-or-a-pool
  Platform behavior and entry lifetimes: ios-xe-and-packet-tracer-specifics
sources:
  - { title: "Cisco IOS XE 17: NAT address conservation", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_iadnat-addr-consv-xe.html" }
  - { title: "Cisco: Configure Network Address Translation", url: "https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/13772-12.html" }
  - { title: "Cisco: Verify and troubleshoot basic NAT connectivity", url: "https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/221481-8605-13.html" }
  - { title: "Cisco IOS XE 17: Monitoring and maintaining NAT", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_iadnat-monmain-xe.html" }
  - { title: "Cisco: NAT order of operation", url: "https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/6209-5.html" }
  - { title: "Cisco: NAT translation command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr/command/ipaddr-cr-book/ipaddr-i4.html" }
  - { title: "RFC 1918: Private address space", url: "https://www.rfc-editor.org/rfc/rfc1918.html" }
  - { title: "RFC 3022: Traditional NAT and NAPT", url: "https://www.rfc-editor.org/rfc/rfc3022.html" }
---

An edge router may need to represent internal IPv4 hosts with a different set of addresses. The configuration has two jobs: select the traffic that needs translation and supply usable translated addresses. The network must still deliver the request and its reply. Work through both directions before deciding that a translation rule is correct.

Recall the request/reply endpoints from Chapter 6 and the return-path tests from Chapter 18. NAT changes address fields at a boundary; PAT can also change a transport port. Track the values on each side and make sure the reply can reach the translated address before deciding whether translation works.

## Why translation exists

:::facts
- **NAT** changes IP address information. **PAT**, also called NAT overload, additionally distinguishes TCP/UDP translations by ports; ICMP query translation uses identifiers.
- RFC 1918 private ranges are `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`. They are usable in routed private networks but are not globally unique public Internet addresses.
- Static NAT supplies a configured address mapping. Ordinary dynamic NAT borrows an address from a pool. PAT allows multiple inside hosts to share an address.
- This chapter uses classic **inside source** NAT: mark the inside and outside interfaces, define the mapping, and verify the forward and return routes.
- `show ip nat translations` shows mappings; `show ip nat statistics` shows roles, allocation and counters. Neither command alone proves application success.
:::

**Network Address Translation** changes the address by which a host is represented across a boundary. Private-to-public translation is a common branch use, but renumbering and private network interconnection can also use NAT. A global address in NAT terminology does not have to be public.

Private addressing works without NAT when the participating networks have routes and compatible addressing. Two company LANs can route RFC 1918 addresses directly. Internet access normally requires a publicly usable source somewhere along the path, or an intermediary such as a proxy. Do not infer that routers are technically unable to forward private addresses, or that every provider implements an identical filter.

NAT adjusts relevant headers and checksums. Applications that advertise addresses inside their payloads can require application-aware translation. NAT supplies neither encryption nor a complete access-control policy. A static mapping can make a host address reachable, while filtering and the host's services decide what access is permitted.

The v1.1 objective names inside source NAT using static mappings and pools. The v2.0 objective explicitly names NAT/PAT on IOS XE. Learn all three forms below. Carrier-scale NAT design and application-gateway tuning are outside the core scope.

## Identify the four address terms

Ask whether the address identifies an **inside** or an **outside** host, then whether it is that host's **local** or **global** representation. Here only the inside address is translated.

| Term | Meaning in this example | Address |
|---|---|---|
| Inside local | Inside host on its own network | `10.20.30.10` |
| Inside global | The same host represented outside | `198.51.100.17` |
| Outside local | Outside server as the inside sees it | `203.0.113.10` |
| Outside global | Outside server on its own network | `203.0.113.10` |

```diagram
{"type":"topology","title":"One host has two address representations","caption":"The outside server's address is unchanged. Only the inside host's address changes across EDGE.","nodes":[{"id":"PC","kind":"pc","label":"PC-A","sub":"10.20.30.10","x":1,"y":3},{"id":"EDGE","kind":"router","label":"EDGE","sub":"NAT","x":4.5,"y":3,"highlight":true},{"id":"ISP","kind":"router","label":"ISP","x":8,"y":3},{"id":"WEB","kind":"server","label":"WEB","sub":"203.0.113.10","x":11,"y":3}],"links":[{"from":"PC","to":"EDGE","label":"inside local"},{"from":"EDGE","to":"ISP","label":"inside global .17","accent":true},{"from":"ISP","to":"WEB"}],"trace":{"flows":[{"path":["PC","EDGE","ISP","WEB"],"back":true,"label":"PC-A to WEB and back","tags":{"EDGE":"src 10.20.30.10 → 198.51.100.17","ISP":"dst 203.0.113.10 unchanged"},"backTags":{"WEB":"Reply dst 198.51.100.17","EDGE":"dst 198.51.100.17 → 10.20.30.10"}}]}}
```

The outbound packet changes from `10.20.30.10 → 203.0.113.10` to `198.51.100.17 → 203.0.113.10`. The reply arrives as `203.0.113.10 → 198.51.100.17`; EDGE restores the destination to `10.20.30.10`. The ultimate destination remains the server, not the ISP router's next-hop address.

The external-looking ranges in these examples are documentation space for isolated labs, not assigned public addresses to deploy on the Internet.

:::trap A viewpoint is not an address classification
If `192.168.4.20` is represented to a partner as `172.16.9.20`, the latter is the inside global address even though both are private. Identify the host and configured translation rather than guessing from the first octet.
:::

## Configure static NAT

**Static NAT** maintains a configured one-to-one mapping, available before the inside host initiates traffic. It does not age out like dynamic state. A successful incoming connection still needs routes, permitted traffic, an available service and a return path.

This example uses an IOS XE-style interface layout. EDGE's LAN is `10.20.30.0/24`, its outside link is `198.51.100.0/30`, and its neighbor is `.2`. The separate translation block is `198.51.100.16/28`. The lab supplies the neighbor and endpoints.

```ios EDGE
EDGE# configure terminal
EDGE(config)# interface gigabitethernet0/0/0
EDGE(config-if)# ip address 10.20.30.1 255.255.255.0
EDGE(config-if)# ip nat inside
EDGE(config-if)# no shutdown
EDGE(config-if)# exit
EDGE(config)# interface gigabitethernet0/0/1
EDGE(config-if)# ip address 198.51.100.1 255.255.255.252
EDGE(config-if)# ip nat outside
EDGE(config-if)# no shutdown
EDGE(config-if)# exit
EDGE(config)# ip nat inside source static 10.20.30.10 198.51.100.17
EDGE(config)# ip route 0.0.0.0 0.0.0.0 198.51.100.2
EDGE(config)# end
EDGE# show ip nat translations
```

The address order is **inside local, then inside global**. Interface roles describe the packet's path; the mapping does not replace them. However, a configured static entry can appear even when roles or routing are wrong. Its presence is a configuration clue, not proof that packets traverse it.

For the classic inside-to-outside path here, destination routing precedes source translation. For outside-to-inside replies, destination translation precedes routing toward the inside host. The upstream neighbor therefore needs a path toward `.17`; its connected `198.51.100.0/30` does not include `.17`. A route for `198.51.100.16/28` via EDGE provides that path in the lab.

**Static PAT** maps a TCP or UDP service instead of an entire address:

```ios EDGE
EDGE# configure terminal
EDGE(config)# ip nat inside source static tcp 10.20.30.50 80 198.51.100.18 80
EDGE(config)# end
```

This adds a TCP port-80 translation. It does not disable other router services or remove other mappings. Check the complete policy before describing an address as accessible only through one port.

## Select sources and allocate a pool

**Dynamic NAT** assigns addresses when eligible traffic needs them. An **access control list (ACL)** describes the source addresses eligible for this rule, a pool supplies replacement addresses, and an inside-source rule connects the two. Here the ACL is a selector for translation, not an interface packet filter. Its `permit` selects matching sources; its **implicit deny** means sources with no matching permit are not selected by this rule. Use this alternative after removing the static example and stopping its traffic.

```ios EDGE
EDGE# configure terminal
EDGE(config)# access-list 1 permit 10.20.30.0 0.0.0.255
EDGE(config)# ip nat pool PUBPOOL 198.51.100.20 198.51.100.21 netmask 255.255.255.240
EDGE(config)# ip nat inside source list 1 pool PUBPOOL
EDGE(config)# end
```

A **wildcard** zero bit must match; a one bit may vary. Here `0.0.0.255` matches every last-octet value in `10.20.30.0/24`. This is enough ACL knowledge for the selector; [chapter 34](#/chapter/acls) teaches filtering policy in full.

An ACL permit selects a source for this rule. A deny or implicit deny means this rule does not translate it. That is separate from forwarding: another feature, route or filter may still affect the packet. In an otherwise unfiltered example with a route, an unselected packet can leave untranslated. Applying the same ACL with `ip access-group` gives it the separate role of an interface filter.

PUBPOOL contains two addresses: `.20` and `.21`, both usable in the `/28`. Without overload, each active inside-address mapping needs its own address. If two hosts hold both allocations, a third eligible host cannot obtain a translation until capacity is available. Establish this with allocation evidence and a fresh third-host test; one failed ping does not establish exhaustion.

The pool mask describes the translation-address subnet. It neither creates an interface in that subnet nor installs an upstream route. Avoid assuming host A must receive the lowest address: allocation order and existing state are implementation details; one-to-one allocation is the concept.

## Share an interface or pool with PAT

**PAT** enables several hosts to use the same inside global address. TCP/UDP mappings include transport ports. Protocol and other flow information also matter; a port alone is not a globally unique connection identifier.

Use one of these alternatives with the existing selector and interface roles:

```ios EDGE — interface overload
EDGE# configure terminal
EDGE(config)# ip nat inside source list 1 interface gigabitethernet0/0/1 overload
EDGE(config)# end
```

```ios EDGE — pool overload
EDGE# configure terminal
EDGE(config)# ip nat inside source list 1 pool PUBPOOL overload
EDGE(config)# end
```

The first uses EDGE's outside interface address; the second uses the pool. Leaving `overload` out of a pool rule changes its sharing behavior. Interface overload avoids the separate pool-block route on the directly connected neighbor in this lab. It does not eliminate every possible return-routing or filtering failure beyond that neighbor.

Consider this representative table after two clients connect to the same server:

```output EDGE# show ip nat translations (excerpt)
Pro Inside global          Inside local           Outside local        Outside global
tcp 198.51.100.1:49200      10.20.30.10:49200       203.0.113.10:443      203.0.113.10:443
tcp 198.51.100.1:1025       10.20.30.11:49200       203.0.113.10:443      203.0.113.10:443  ← second inside source port was translated
```

A reply from the shown server to `.1:1025` is mapped back to `10.20.30.11:49200`. The rows show translation values. They do not prove which algorithm selected 1025, that the handshake completed, or whether each mapping was dynamically created. Use configuration and packet evidence for those questions.

ICMP Echo has no TCP/UDP ports. PAT can translate its **query identifier**, which the responder returns. Do not confuse it with the IPv4 Identification field used for fragment handling. A request and reply are separate IP datagrams and need not share their IPv4 Identification values.

| Property | Static NAT | Dynamic NAT | PAT overload |
|---|---|---|---|
| Address relationship | Configured one-to-one | Allocated one-to-one | Shared, with flow distinctions |
| Typical use | Predictable host representation | Pool for eligible hosts | Many clients using limited addresses |
| Source selector here | Explicit host | ACL | ACL |
| Initial mapping | Configured | Eligible traffic | Eligible traffic |
| Capacity check | Nonconflicting address | Free pool addresses | Translation/port and platform resources |

Do not convert the 16-bit port field into a universal supported-session count. Reservations, implementation limits, destination-dependent behavior and platform resources affect scale. The task here is to choose, configure and interpret the appropriate translation.

## Platform behavior and entry lifetimes

These core commands are documented for IOS XE, but names, support, counters and defaults vary. Packet Tracer's 4331 provides practice with three-component interface names; it does not certify a current physical IOS XE image. Read `show version` and `show ip interface brief` and use the actual router's documentation.

Dynamic state ages out. The cited Cisco command reference lists values such as a 24-hour general dynamic timeout, 24-hour TCP timeout, 300-second UDP timeout and 60-second ICMP/DNS timeouts. These are scoped reference values, not a promise that every entry disappears exactly that interval after one packet. Explicit settings and the relationship between address mappings and child flows matter. Static configuration is different from temporary flow state.

```ios EDGE
EDGE# show ip nat translations verbose
EDGE# show ip nat statistics
```

Use the verbose form where supported to inspect lifetimes. In an isolated lab, stop traffic before changing an in-use mapping. `clear ip nat translation *` clears dynamic state; it does not remove configured NAT rules or their static mappings. Sessions can be interrupted and may receive different mappings when traffic resumes. If an image refuses removal because dependent entries remain, inspect its message and supported clearing syntax. Repeatedly clearing a production table is not a diagnostic method.

## Verify and troubleshoot

Start with the client, destination, protocol and time of the test. Record the gateway, selected route, interface roles, selector, translation and return path. A router-originated ping can use a different source and processing path from a forwarded client packet; it is a separate test rather than a substitute.

The column order is **Inside global, Inside local, Outside local, Outside global**, after the protocol. An address-only `---` row alone does not distinguish static from ordinary dynamic NAT. Correlate it with configuration or detailed entry information.

```output EDGE# show ip nat translations (static configuration, before traffic)
Pro Inside global      Inside local       Outside local      Outside global
--- 198.51.100.17      10.20.30.10        ---                ---  ← address mapping; no remote flow is identified
```

| Observation | What it establishes | Useful next check |
|---|---|---|
| Expected inside interface absent | Classic NAT role missing from the displayed list | Actual ingress interface configuration |
| No matching dynamic entry | No entry visible at this time | Fresh eligible traffic, path, selector and aging |
| Translation exists; application fails | Mapping state exists | Reply path, filters, endpoint service and captures |
| Pool fully allocated; new host cannot translate | Capacity is a supported explanation | Allocation changes or overload requirement |
| Top-level Misses increases | Some lookups lacked an existing entry | New flow creation versus allocation/drop counters |
| One-sided debug excerpt | Only that direction appears in the excerpt | Capture scope and actual reply evidence |

`debug ip nat` is an optional controlled-lab aid. On supporting images, enable it immediately before one test and disable it afterward with `undebug all`. Accelerated forwarding and logging behavior affect its output. An outbound translation message does not prove delivery to the server; missing return debug lines do not identify a unique remote fault. Prefer the least disruptive show or capture evidence needed to narrow the problem.

After repair, repeat the same client request, inspect its translated values, confirm the application's response and save the verified configuration. Replacing a pool without checking its return route can leave connectivity broken despite correct NAT syntax.

## Exam focus

- Identify all four address terms by host and viewpoint; interpret addresses and ports separately.
- Configure interface roles, static mappings, selectors, pools, interface overload and pool overload.
- Distinguish ACL selection from an interface filtering decision.
- Calculate a pool's inclusive address count and interpret allocation evidence.
- Read translations without inferring successful sessions or their creation method from unsupported clues.
- Verify forward and return routing with the actual client's test.
- Understand aging and clearing state; advanced platform tuning is reference material.
