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

A branch office has 200 hosts, and its provider has assigned it one public IPv4 address. The hosts use private addresses, which the Internet will not route back to you, and there are far too few public IPv4 addresses to give every host its own. The edge router has to make each host appear on the Internet as an address the provider will deliver replies to, and then hand every reply back to the right host.

That job is address translation. This chapter builds on the address and port pairs from Chapter 6 and the return-path checks from Chapter 18. By the end you will be able to name the four NAT address terms in any translation table, configure static NAT, a dynamic pool and PAT on IOS, and work out why a translation that looks correct still carries no traffic.

## Why translation exists

:::facts
- **NAT** changes IP address information. **PAT**, also called NAT overload, additionally distinguishes TCP/UDP translations by ports; ICMP query translation uses identifiers.
- RFC 1918 private ranges are `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`. They are usable in routed private networks but are not globally unique public Internet addresses.
- Static NAT supplies a configured address mapping. Ordinary dynamic NAT borrows an address from a pool. PAT allows multiple inside hosts to share an address.
- This chapter uses classic **inside source** NAT: mark the inside and outside interfaces, define the mapping, and verify the forward and return routes.
- `show ip nat translations` shows mappings; `show ip nat statistics` shows roles, allocation and counters. Neither command alone proves application success.
:::

**Network Address Translation (NAT)** rewrites the source or destination address of a packet as it crosses a router. The common case is a branch edge: hosts keep private addresses inside, and the router replaces each packet's source with an address the provider can route. The router records the substitution in a translation table so that it can reverse it on the reply.

Private addresses do not need NAT to be routed. Two company sites can route `10.0.0.0/8` between themselves like any other prefix. NAT is needed where the far side has no route back to your addresses, and the Internet has none for RFC 1918 space.

NAT is not a security feature. It encrypts nothing, and it is not an access policy: a static mapping makes an inside host reachable from outside, and only filtering decides what may reach it.

The chapter takes three forms in turn: **static NAT** (one fixed inside address to one fixed outside address), **dynamic NAT** (inside hosts borrow addresses from a pool) and **PAT** (many inside hosts share one address and are told apart by port).

## Identify the four address terms

Every packet through a NAT router involves two hosts, and each host can be known by two addresses, one on each side of the router. Cisco names the four possibilities with two words. The first word says whose address it is: **inside** is a host on your network, **outside** is a host on the far side. The second word says where the address is used: **local** on the inside network, **global** on the outside network. In this chapter only the inside host is translated, so the outside host's two addresses are the same.

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

The `198.51.100.0/24` and `203.0.113.0/24` ranges used here are reserved for documentation and stand in for public addresses.

:::trap A viewpoint is not an address classification
If `192.168.4.20` is represented to a partner as `172.16.9.20`, the latter is the inside global address even though both are private. Identify the host and configured translation rather than guessing from the first octet.
:::

## Configure static NAT

**Static NAT** is a permanent one-to-one mapping that you type in. Use it for a host that outside clients must be able to reach first, such as a server. The entry is in the table before any traffic flows and never ages out, so the host is always known outside by the same address.

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

Every form of NAT in this chapter needs the same three things. `ip nat inside` and `ip nat outside` mark the interfaces, and a packet is translated only when it crosses from one role to the other. An `ip nat inside source` rule defines the mapping; in the static form the address order is **inside local, then inside global**. And routing must work in both directions. A static entry appears in `show ip nat translations` as soon as you configure it, even when the roles or routes are wrong, so the entry alone does not show that traffic is passing.

The return route is the part most often forgotten. On the way out, EDGE routes the packet first and then translates its source. On the way back, EDGE translates the destination first and then routes toward the inside host. The reply arrives only if the upstream router has a route to `.17`, and its connected `198.51.100.0/30` does not contain `.17`. In the lab, a static route for `198.51.100.16/28` via EDGE provides it.

**Static PAT** maps a TCP or UDP service instead of an entire address:

```ios EDGE
EDGE# configure terminal
EDGE(config)# ip nat inside source static tcp 10.20.30.50 80 198.51.100.18 80
EDGE(config)# end
```

This is what home routers call port forwarding. Only TCP port 80 on `.18` is delivered to the server at `10.20.30.50`. The mapping does nothing for other ports and leaves other NAT rules as they are.

## Select sources and allocate a pool

Static NAT needs one outside address per host, typed in by hand. **Dynamic NAT** lets a group of hosts borrow addresses from a pool as they need them. It has three parts. An **access control list (ACL)** is a numbered list of `permit` and `deny` lines that match packets; here it picks out the source addresses to translate. A pool lists the outside addresses available. An inside-source rule connects the two. This is not an ACL's usual job, and it filters nothing here. A source that matches a `permit` is translated. A source that matches no line falls to the **implicit deny** at the end of every ACL, which here means only that this rule leaves it alone. Remove the static example before you configure this one.

```ios EDGE
EDGE# configure terminal
EDGE(config)# access-list 1 permit 10.20.30.0 0.0.0.255
EDGE(config)# ip nat pool PUBPOOL 198.51.100.20 198.51.100.21 netmask 255.255.255.240
EDGE(config)# ip nat inside source list 1 pool PUBPOOL
EDGE(config)# end
```

The second value in the ACL line is a **wildcard mask**, the inverse of a subnet mask: a zero bit must match and a one bit may be anything. `10.20.30.0 0.0.0.255` therefore matches every address in `10.20.30.0/24`. That is all the ACL knowledge NAT needs; [chapter 34](#/chapter/acls) teaches ACLs as filters, which is the role they take when applied to an interface with `ip access-group`.

A packet that the ACL does not select is still forwarded if a route exists. It leaves with its private source address unchanged, and normally no reply comes back. This is an exam trap: a wrong NAT ACL does not drop traffic at the router, it sends the traffic out untranslated.

PUBPOOL contains two addresses, `.20` and `.21`. Without overload, each inside host that is translating holds one pool address for itself, so two hosts can be translated at once. A third host gets no translation, and its packets are dropped until an entry times out or is cleared. `show ip nat statistics` shows this state as `total addresses 2, allocated 2 (100%)`.

The `netmask` in the pool command only describes the subnet the pool addresses belong to. It does not create a route, so the upstream router still needs its own route to the pool.

## Share an interface or pool with PAT

A pool without overload still needs one outside address per active host. **Port Address Translation (PAT)**, configured with the keyword `overload`, removes that limit by translating the source port as well as the source address. Every TCP or UDP conversation already has a source port, chosen by the client. The router records each inside address and port against the shared outside address and a port that is unique on that address. When a reply arrives, its destination address and port identify the table entry, and so the inside host.

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

The first form uses whatever address the outside interface has. It suits a site with a single provider-assigned address and needs no extra return route, because the upstream router already knows the connected link. The second form shares the pool's addresses. Its only difference from plain dynamic NAT is the word `overload`: leave it out and you are back to one address per host.

Consider this representative table after two clients connect to the same server:

```output EDGE# show ip nat translations (excerpt)
Pro Inside global          Inside local           Outside local        Outside global
tcp 198.51.100.1:49200      10.20.30.10:49200       203.0.113.10:443      203.0.113.10:443
tcp 198.51.100.1:1025       10.20.30.11:49200       203.0.113.10:443      203.0.113.10:443  ← second inside source port was translated
```

Both clients happened to choose source port 49200. The router kept that port for the first host, because IOS keeps the original port when it is free, and gave the second host port 1025, because two entries on one address cannot share a port. A reply addressed to `198.51.100.1:1025` is therefore delivered to `10.20.30.11:49200`.

Ping has no ports. For ICMP Echo, PAT uses the **query identifier** in the ICMP header, which the reply carries back, in place of a port. This is a different field from the IPv4 Identification field used for fragments.

| Property | Static NAT | Dynamic NAT | PAT overload |
|---|---|---|---|
| Address relationship | Configured one-to-one | Allocated one-to-one | Shared, with flow distinctions |
| Typical use | Predictable host representation | Pool for eligible hosts | Many clients using limited addresses |
| Source selector here | Explicit host | ACL | ACL |
| Initial mapping | Configured | Eligible traffic | Eligible traffic |
| Capacity check | Nonconflicting address | Free pool addresses | Translation/port and platform resources |

A port number is 16 bits, so one address can in theory carry about 65,000 translations for each protocol.

## Platform behavior and entry lifetimes

The commands in this chapter are the same on classic IOS and IOS XE. What differs is the interface names: IOS XE routers such as the 4331 use three-part names like `GigabitEthernet0/0/1`. Check `show ip interface brief` before you type an interface into a NAT rule.

Dynamic entries are temporary. Each has an idle timer and is removed when no packet has used it for that long. The IOS defaults are 24 hours for a dynamic NAT address entry and for an established TCP translation, 5 minutes for UDP and 1 minute for ICMP and DNS. Static entries have no timer.

```ios EDGE
EDGE# show ip nat translations verbose
EDGE# show ip nat statistics
```

The verbose form shows each entry's remaining lifetime. `clear ip nat translation *` removes every dynamic entry at once; the NAT rules and static mappings stay. IOS refuses to remove a rule or pool that still has entries in use, so in the lab you stop the traffic, clear the table and then change the rule.

## Verify and troubleshoot

Check NAT in the order a packet meets it. Does the client reach its gateway? Does the router have a route out? Does the packet enter an `inside` interface and leave an `outside` one? Does the ACL select its source? Is an address or port free? Can the reply get back to the translated address? Test from a client. A ping typed on the router itself is sent from the outside interface's own address, is not translated and proves nothing about NAT.

The table's columns are **Inside global, Inside local, Outside local, Outside global**. That is the reverse of the static command, which takes the local address first. A row with `---` in the protocol and outside columns is an address-only mapping: a static entry, or a pool address that dynamic NAT has lent to a host. Rows with a protocol and ports are individual conversations.

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

`debug ip nat` prints a line for each packet as it is translated, which lets you watch both directions in a lab. Lines for the outbound packets with none for the replies point at the return path. Debugging loads the CPU, so turn it on for one test and off again with `undebug all`.

After repair, repeat the same client request, inspect its translated values, confirm the application's response and save the verified configuration.

## Exam focus

- Inside or outside says whose address it is; local or global says where it is used. The inside global address is your host's translated address.
- Every form needs `ip nat inside`, `ip nat outside`, an `ip nat inside source` rule and a return route to the translated address.
- Static NAT is permanent and one-to-one: `ip nat inside source static LOCAL GLOBAL`.
- Dynamic NAT is an ACL, a pool and a rule joining them. Each active host holds one address, so the pool can run out.
- PAT adds `overload`, with a pool or with `interface`. Hosts share an address and are told apart by port.
- The NAT ACL selects and does not filter: an unmatched packet leaves untranslated.
- `show ip nat translations`, `show ip nat statistics` and `clear ip nat translation *`, which removes dynamic entries only.
