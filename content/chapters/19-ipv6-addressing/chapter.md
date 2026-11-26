---
id: ipv6-addressing
number: 19
title: IPv6 addressing
subtitle: Read IPv6 addresses, identify their purpose and verify how a host obtains one.
part: routing
domain: infra
minutes: { lesson: 75, lab: 80 }
summary: Work through IPv6 notation, prefix sizes, address types, modified EUI-64, Neighbor Discovery and SLAAC. Configure interfaces and diagnose address and gateway mistakes.
objectives:
  v1: ["1.8", "1.9", "1.9.a", "1.9.b", "1.9.c", "1.9.d"]
  v2: ["1.4"]
prereqs: [ipv4-addressing, subnetting-vlsm, routing-table]
sectionIds:
  Addresses and interfaces: why-ipv6-looks-the-way-it-does
  Read and compress an address: writing-an-address-without-making-a-mistake
  Work out the prefix: prefixes-and-how-big-a-subnet-is
  Address types and scope: address-types
  Modified EUI-64: modified-eui-64
  Neighbor Discovery and automatic addressing: neighbor-discovery-and-getting-an-address
  Configure IPv6 on IOS: configuring-ipv6-on-ios
  Verify and troubleshoot: verify-and-troubleshoot
  Exam focus: exam-focus
sources:
  - { title: "RFC 4291: IPv6 Addressing Architecture", url: "https://www.rfc-editor.org/rfc/rfc4291.html" }
  - { title: "RFC 5952: IPv6 Text Representation", url: "https://www.rfc-editor.org/rfc/rfc5952" }
  - { title: "RFC 4861: Neighbor Discovery", url: "https://www.rfc-editor.org/info/rfc4861/" }
  - { title: "RFC 4862: Stateless Address Autoconfiguration", url: "https://www.rfc-editor.org/rfc/rfc4862.html" }
  - { title: "RFC 4193: Unique Local Addresses", url: "https://www.rfc-editor.org/rfc/rfc4193.html" }
  - { title: "RFC 5942: IPv6 Subnet Model", url: "https://www.rfc-editor.org/info/rfc5942/" }
  - { title: "RFC 8064: Default Interface Identifiers", url: "https://www.rfc-editor.org/rfc/rfc8064.html" }
  - { title: "RFC 6164: /127 Prefixes on Router Links", url: "https://www.rfc-editor.org/rfc/rfc6164.html" }
  - { title: "RFC 3849: Documentation Addresses", url: "https://www.rfc-editor.org/rfc/rfc3849.html" }
  - { title: "RFC 8106: DNS Options in Router Advertisements", url: "https://www.rfc-editor.org/rfc/rfc8106.html" }
  - { title: "Cisco: IPv6 Addressing and Basic Connectivity", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6_basic/configuration/15-mt/ip6b-15-mt-book/ip6-add-basic-conn.html" }
  - { title: "Cisco: Understand the IPv6 Link-Local Address", url: "https://www.cisco.com/c/en/us/support/docs/ip/ip-version-6-ipv6/113328-ipv6-lla.html" }
---

Your site has been given the IPv6 prefix `2001:db8:acad::/48`, and R1 needs two working IPv6 LANs. On PC-A the address is 32 hexadecimal digits long, the adapter holds more than one IPv6 address, the LAN has no DHCP server, and the PC has still found its default gateway. None of that is a fault. IPv6 does these jobs differently from IPv4, and you cannot troubleshoot it until you can read what the devices show you.

You already know how to find an IPv4 subnet from an address and mask (Chapters 4 and 5) and how to read connected and local routes (Chapter 17). This chapter applies those skills to 128-bit addresses. By the end you will be able to shorten and expand an address, work out its prefix, recognise its type, calculate a modified EUI-64 identifier, explain how a host gets its address and gateway from a router, and configure and verify IPv6 on IOS. Every example uses `2001:db8::/32`, which is reserved for documentation.

## Addresses and interfaces

IPv4's 32 bits ran out. IPv6 uses 128 bits, enough for every LAN to hold more addresses than the whole IPv4 Internet. The extra room changes how addresses are used, not only how long they are.

First, one interface normally has several IPv6 addresses, each with its own job. PC-A in the lab has a **link-local address** beginning `fe80` for talking to devices on its own LAN, including its default gateway, and `2001:db8:acad:1::10`, a **global unicast address** that can cross routers. A **unicast address** identifies one interface.

Second, IPv6 has no broadcast. Jobs that IPv4 gives to broadcast, such as ARP, use **multicast**, which reaches only the devices that have joined a group. **Neighbor Discovery** replaces ARP. It also lets a host find its router and build its own address without a DHCP server, which is called stateless address autoconfiguration (SLAAC).

Third, a host can choose its own host part: the 64-bit **interface identifier (interface ID)** that follows the prefix. One method builds it from the MAC address (modified EUI-64, below); many operating systems use a random value instead. A long, unfamiliar suffix on a host is expected, not an error.

Finally, keep one distinction from Chapter 17. A router that answers a ping to its own interface is acting as an endpoint. Forwarding a packet between interfaces is a separate job, and on IOS it needs its own command.

:::facts
- An IPv6 address is **128 bits**, written as eight 16-bit hexadecimal groups.
- One hexadecimal digit represents **4 bits**. Each full group contains **4 digits**.
- `::` can replace a consecutive run of zero groups only **once** in an address.
- An ordinary Ethernet LAN using SLAAC uses a **/64** prefix. Other prefix lengths are valid for routes and for some router-to-router links.
- IPv6 has **unicast, anycast and multicast**; it has no IPv6 broadcast address.
- Neighbor Discovery uses **ICMPv6**, not ARP. It resolves neighbors, finds the default router and supports automatic addressing.
:::

## Read and compress an address

Written in full, an IPv6 address is eight groups of four hexadecimal digits: 39 characters with the colons. Two rules shorten it, and the exam expects you to apply them in both directions.

1. **Drop the leading zeros in each group.** `0db8` becomes `db8`, and `0000` becomes `0`.
2. **Replace one run of consecutive all-zero groups with `::`**, once per address.

Take `2001:0db8:0000:0000:0001:0000:0000:0001`. Rule 1 gives `2001:db8:0:0:1:0:0:1`. Two runs of two zero groups remain, and rule 2 can replace only one: `2001:db8::1:0:0:1`. With a single `::`, a reader knows it stands for eight minus the visible groups. With two, nobody can tell how the missing zeros divide, so the address is invalid.

Several legal spellings can describe one address. RFC 5952 defines the **canonical** form, which is what the exam wants as the correct short form: lowercase, no leading zeros, `::` for the longest run of zero groups, the leftmost run on a tie, and never `::` for a single zero group. Case does not change the address; IOS prints uppercase.

| Address text | Interpretation |
|---|---|
| `2001:db8:0:1:0:0:0:a` | Valid expanded-short form |
| `2001:db8:0:1::a` | Canonical form of the same address |
| `2001:db8::1:0:0:0:a` | Valid, but compresses only one zero group and is not canonical |
| `2001:db8::1::a` | Invalid: two `::` sequences make expansion ambiguous |
| `2001:db8:1:2:3:4:5:6:7` | Invalid: nine groups exceed 128 bits |

To expand, count the groups you can see. `2001:db8:5::12:3456` shows five, so `::` stands for three zero groups: `2001:0db8:0005:0000:0000:0000:0012:3456`.

Only leading zeros can be dropped. `0a00` shortens to `a00`, never to `a`, just as 0500 is 500 and not 5. If two short addresses look alike, expand both before comparing them.

## Work out the prefix

An IPv6 prefix does the job of an IPv4 subnet mask: it says how many leading bits name the network. It is always written `/n`; there is no dotted mask. In `2001:db8:acad:1::10/64`, the first 64 bits (four groups) name the subnet `2001:db8:acad:1::/64`, and the last 64 bits are the interface ID.

A typical global unicast address has three parts. The provider assigns the **global routing prefix**, often a /48: here `2001:db8:acad`. The fourth group is the 16-bit **subnet ID**, which you assign: `1` for the first LAN, `2` for the second. The final 64 bits are the interface ID. LANs use /64 because SLAAC adds a 64-bit interface ID to the prefix to make 128 bits. Other lengths exist, such as /128 for a single address and /127 on some router-to-router links, but this chapter and the next use /64 on every link.

To count equal-size subnets, use `2^(new prefix − original prefix)`. A /48 holds 65,536 /64s, a /56 holds 256 and a /60 holds 16.

Each hexadecimal digit is 4 bits, so a prefix that is a multiple of 4 ends between two digits. Split `2001:db8:1200:3400::/56` into /64s: the /56 fixes three groups and the digits `34` of the fourth, so the fourth group runs from `3400` to `34ff`. The first /64 is `2001:db8:1200:3400::/64`, the next is `2001:db8:1200:3401::/64`, and the last is `2001:db8:1200:34ff::/64`.

To find the network an address belongs to, keep the prefix bits and zero the rest, as in IPv4. A /60 keeps three digits of the fourth group, so `2001:db8:5:c7f2::1/60` is in `2001:db8:5:c7f0::/60`. Writing `2001:db8:5:c700::/60` is wrong: it zeroes four bits that the prefix keeps.

When a prefix ends inside a digit, write that digit in binary. For `2001:db8:7:ab3b::25/62`, the first 60 bits keep `2001:db8:7:ab3`. The next digit, `b`, is `1011`. A /62 keeps its first two bits, `10`, and clears the other two: `1000`, hexadecimal `8`. The network is `2001:db8:7:ab38::/62`, covering the four /64s `ab38` through `ab3b`.

IPv6 has no broadcast address, so you never subtract 2 when you count. The all-zeros interface ID is reserved as the subnet-router anycast address, which is why addressing plans start at `::1`.

## Address types and scope

The first digits of an IPv6 address tell you what it is for, much as `10.` or `127.` did in IPv4. Each type also has a **scope**: how far a packet sent to that address can travel.

| Type or special address | Recognize it | Purpose |
|---|---|---|
| Global unicast | `2000::/3`: first digit `2` or `3` | Publicly routable, like a public IPv4 address |
| Documentation unicast | `2001:db8::/32` | Written examples and isolated labs; never routed on the Internet |
| Unique local | `fc00::/7`; addresses in use start `fd` (`fd00::/8`) | Private addressing routed inside an organization |
| Link-local | `fe80::/10` | Communication on one link; routers never forward it to another link |
| Multicast | `ff00::/8` | Delivery to every member of a group within its scope |
| Loopback | `::1/128` | The local node itself, like `127.0.0.1` |
| Unspecified | `::/128` | "No address yet": the source a host uses before it has an address |

**Unique local addresses (ULAs)** play the role of private IPv4 addresses such as `10.0.0.0/8`. After `fd` comes a random 40-bit Global ID, which makes a /48 unlikely to clash with another organization's, then the 16-bit subnet ID and the interface ID.

**Link-local addresses** work on one link only. Every IPv6 interface must have one and creates it automatically, as `fe80::` followed by the interface ID. Because the scope is one link, the same value can repeat on different links: R1 in the lab uses `fe80::1` on both Gi0/0 and Gi0/1. Two devices on the same link cannot share it. A host's default gateway is the router's link-local address, and routing protocols use link-local next hops.

**Multicast addresses** begin `ff`, and the fourth digit is the scope: `ff02` groups stay on the local link, and `ff05` groups are site-wide. Remember `ff02::1`, all IPv6 nodes on the link, and `ff02::2`, all IPv6 routers on the link.

A **solicited-node multicast address** does the work of the ARP broadcast. For each unicast address it owns, an interface joins a group formed by appending the address's last 24 bits (six hexadecimal digits) to `ff02::1:ff00:0/104`. `2001:db8:10::12:3456` ends `12:3456`, giving `ff02::1:ff12:3456`. R1's `2001:db8:acad:1::1` ends `00:0001`, giving `ff02::1:ff00:1`. A device that needs the MAC address behind an IPv6 address asks this group, where normally only the owner listens.

An **anycast address** is one unicast address assigned to several devices. Routing delivers each packet to one of them, normally the nearest in routing terms. Anycast uses the unicast ranges, so no prefix identifies it. Multicast delivers to every group member; anycast delivers to one.

## Modified EUI-64

An interface ID is 64 bits, and a device building one automatically already holds a number unique on its LAN: its 48-bit MAC address. **Modified EUI-64** stretches the MAC to 64 bits. IOS uses it for automatic link-local addresses and with the `eui-64` keyword, and the calculation is a named CCNA topic.

Work from MAC `00:1a:2b:3c:4d:5e`:

1. Split after the first three bytes: `00:1a:2b | 3c:4d:5e`.
2. Insert `ff:fe`: `00:1a:2b:ff:fe:3c:4d:5e`.
3. Flip the seventh bit of the first byte, counting from the left. This is the universal/local (U/L) bit, worth 2, so the operation is an XOR with `02`: `00000000` becomes `00000010`, and `00` becomes `02`. If that bit were already 1, the flip would clear it.
4. Regroup the eight bytes into four groups: `021a:2bff:fe3c:4d5e`.
5. Append to `2001:db8:10:1::/64`: `2001:db8:10:1:21a:2bff:fe3c:4d5e`.

Only the second hexadecimal digit of the MAC changes, in fixed pairs: 0↔2, 1↔3, 4↔6, 5↔7, 8↔a, 9↔b, c↔e, d↔f. IOS shows a MAC as `a44c.112f.90b7`: split it in the middle (`a44c.11 | 2f.90b7`), insert `fffe`, change the `4` to `6`, and the interface ID is `a64c:11ff:fe2f:90b7`.

:::trap
Flip the bit; do not always add 2. A first byte of `02` becomes `00`, while `00` becomes `02`. The inserted bytes always sit in the middle of the identifier: `xxxx:xxff:fexx:xxxx`.
:::

On IOS, `ipv6 address 2001:db8:acad:2::/64 eui-64` builds an address this way from the interface's own MAC. Read that MAC from `show interfaces` to predict the result.

## Neighbor Discovery and automatic addressing

An IPv4 host uses ARP to find a neighbor's MAC address and usually DHCP to learn its address and gateway. IPv6 gives both jobs to **Neighbor Discovery (ND)**, which runs over ICMPv6.

| Message | ICMPv6 type | Meaning |
|---|---|---|
| Router Solicitation (RS) | 133 | A host asks for routers; sent to `ff02::2` |
| Router Advertisement (RA) | 134 | A router announces its prefix; sent to `ff02::1` periodically and in answer to an RS |
| Neighbor Solicitation (NS) | 135 | "Who has this address?"; sent to the target's solicited-node group |
| Neighbor Advertisement (NA) | 136 | The owner answers with its MAC address |

Redirect (type 137) lets a router point a host at a better first hop.

```diagram
{"type":"sequence","title":"A host learns how to use its LAN","actors":["Host","Local router","Other nodes on link"],"steps":[{"from":0,"to":1,"label":"RS: request router information"},{"from":1,"to":0,"label":"RA: router lifetime and prefix information"},{"from":0,"to":2,"label":"DAD NS: check tentative address"},{"from":0,"to":1,"label":"NS when the next-hop MAC needs resolution"},{"from":1,"to":0,"label":"NA supplies neighbor information"}]}
```

Follow PC-B joining LAN 2 in the lab:

1. PC-B creates a link-local address and sends an RS.
2. R1 answers with an RA carrying the prefix `2001:db8:acad:2::/64`, sent from its link-local address `fe80::1`.
3. PC-B adds its own interface ID to that prefix. This is **SLAAC**: no server assigns or records the address.
4. PC-B installs `fe80::1`, the RA's source, as its default gateway.
5. Before using a new address, PC-B runs **Duplicate Address Detection (DAD)**: it sends an NS for its own address, with source `::`, to that address's solicited-node group. Silence means the address is unique on the link. An NA in reply means it is taken.

When PC-B later needs R1's MAC address, it sends an NS to R1's solicited-node group, and R1 answers with an NA. PC-B stores the result in its neighbor table, the IPv6 counterpart of the ARP table. Later checks that the neighbor is still reachable use a unicast NS.

Two flags in the RA tell hosts whether to use DHCPv6 as well. **M** (managed) means get the address from a DHCPv6 server. **O** (other) means get other settings, such as DNS, from DHCPv6 while the address still comes from SLAAC. Either way, the default gateway comes from the RA: DHCPv6 has no default-gateway option.

Each advertised prefix has its own flags, on by default: **A** (autonomous) allows SLAAC with that prefix, and **L** (on-link) says its addresses can be reached directly on this link. A router lifetime of zero in the RA means "use my prefix, but not me as a default router". Because all of this is ICMPv6, blocking ICMPv6 breaks IPv6 on a LAN even when every address is correct.

## Configure IPv6 on IOS

Bringing up IPv6 on a router takes one global command and an address on each interface.

```ios R1
R1# configure terminal
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface gigabitethernet0/0
```

`ipv6 unicast-routing` turns the device into an IPv6 router; it is off by default on IOS routers. With it, R1 forwards IPv6 packets between interfaces and sends RAs, so SLAAC hosts receive a prefix and a gateway. Without it, R1 behaves like a host: it answers pings to its own addresses but forwards nothing and sends no RAs.

Any `ipv6 address` command also enables IPv6 on the interface and creates a link-local address if none is configured, as `fe80::` plus the EUI-64 interface ID. Setting `fe80::1` by hand gives hosts a gateway that is easy to recognise.

| Interface command | Result |
|---|---|
| `ipv6 address 2001:db8:acad:1::1/64` | Exactly the address you typed |
| `ipv6 address 2001:db8:acad:2::/64 eui-64` | Your prefix plus an interface ID derived from the MAC; it does not end in `::1` |
| `ipv6 address fe80::1 link-local` | Replaces the automatic link-local address |
| `ipv6 enable` | IPv6 on with an automatic link-local address and no global address |
| `ipv6 address autoconfig` | The interface acts as a SLAAC client and builds its address from another router's RA |

A second `ipv6 address` command adds an address; it does not replace the first. Remove one with `no ipv6 address` and the same address and prefix length.

## Verify and troubleshoot

Start with the summary, which lists every address beside the interface state.

```output R1# show ipv6 interface brief
GigabitEthernet0/0 [up/up]          ← physical and protocol state
    FE80::1                       ← local-link identity
    2001:DB8:ACAD:1::1             ← configured global-form lab address
```

`show ipv6 interface` adds the subnet, the multicast groups the interface has joined and its RA settings.

```output R1# show ipv6 interface gigabitethernet0/0 — representative excerpt
GigabitEthernet0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  Global unicast address(es):
    2001:DB8:ACAD:1::1, subnet is 2001:DB8:ACAD:1::/64
  Joined group address(es):
    FF02::1                       ← all nodes
    FF02::2                       ← all routers
    FF02::1:FF00:1                ← solicited-node group for both addresses
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
```

`FF02::2` and the RA lines appear only when `ipv6 unicast-routing` is configured. Both of R1's addresses end in `::1`, so they share one solicited-node group. `show interfaces` gives the MAC for an EUI-64 calculation.

Each configured address produces the pair of routes you read in Chapter 17: a connected route for the /64 LAN and a local /128 route for R1's own address.

```output R1# show ipv6 route — representative excerpt
C   2001:DB8:ACAD:1::/64 [0/0]
     via GigabitEthernet0/0, directly connected
L   2001:DB8:ACAD:1::1/128 [0/0]
     via GigabitEthernet0/0, receive
```

`show ipv6 neighbors` displays the neighbor table for addresses R1 has exchanged traffic with. `REACH` means the neighbor answered recently. `STALE` means it has not been confirmed lately, which is normal for an idle neighbor. `INCMP` (incomplete) means an NS has gone unanswered; if it persists while pings fail, the target address does not exist on that link.

A link-local address needs an interface to make sense, because the same `fe80::` value can exist on every link. When you ping one from R1, IOS asks for the output interface. Chapter 20 uses this in static routes.

Three faults account for most problems at this level:

- **Automatic hosts show only an `fe80` address.** No RA reaches them. Check `ipv6 unicast-routing`, the interface state and its global /64. SLAAC needs no DHCPv6 server.
- **A host reaches its gateway but nothing beyond.** `ipv6 unicast-routing` is missing, or the far host has the wrong gateway.
- **A manual gateway does not answer.** Compare it with `show ipv6 interface brief`. `acad:2::1` and `acad:20::1` differ, and an `eui-64` interface does not own `::1`.

Test with numeric addresses first so that DNS cannot hide an addressing problem.

## Exam focus

Practise these without a calculator:

- Shorten and expand addresses, and spot invalid forms: two `::`, dropped trailing zeros, nine groups.
- Find the network for an address and prefix, including /56, /60 and /62, and count /64s with `2^(64 − prefix)`.
- Name the type from the first digits: `2000::/3` global unicast, `fc00::/7` (seen as `fd`) unique local, `fe80::/10` link-local, `ff00::/8` multicast, `::1` loopback, `::` unspecified. Anycast has no prefix of its own, and IPv6 has no broadcast.
- Recall `ff02::1` and `ff02::2`, and build a solicited-node address from the last 24 bits.
- Calculate modified EUI-64: split the MAC, insert `fffe`, flip the seventh bit.
- Explain Neighbor Discovery: RS and RA find the router and prefix, NS and NA replace ARP and run DAD, and the default gateway comes from the RA.
- Choose between `ipv6 unicast-routing`, `ipv6 enable` and `ipv6 address` with a full address, `eui-64`, `link-local` or `autoconfig`.
