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

IPv6 changes more than the length of an address. A host can use several addresses on one interface, discover its router without DHCP, and resolve neighbors without ARP. Start by separating those jobs. Address notation tells you which bits an address contains; its type and scope tell you where it is meaningful; configuration and discovery determine how the host can use it.

All `2001:db8::/32` examples in this course are reserved documentation addresses used in isolated exercises. They are not public Internet destinations. Uppercase and lowercase hexadecimal represent the same bits.

## Addresses and interfaces

:::facts
- An IPv6 address is **128 bits**, written as eight 16-bit hexadecimal groups.
- One hexadecimal digit represents **4 bits**. Each full group contains **4 digits**.
- `::` can replace a consecutive run of zero groups only **once** in an address.
- An ordinary Ethernet LAN using SLAAC uses a **/64** prefix. That is not a rule that every IPv6 route or link must be /64.
- IPv6 has **unicast, anycast and multicast**; it has no IPv6 broadcast address.
- Neighbor Discovery uses **ICMPv6**, not ARP. Automatic host addressing and default-router discovery are related but separate operations.
:::

A **unicast address** identifies one interface for delivery. A host commonly has a link-local address plus one or more other unicast addresses on the same Ethernet interface. This is normal: the link-local address serves local-link communication, while another address can identify traffic that crosses routers. Some systems also maintain temporary addresses for outbound connections.

Do not assume that all IPv6 addresses are formed from a MAC address. Manual assignment, DHCPv6 and different automatic identifier methods are possible. A host displaying a long, unfamiliar suffix may be correctly configured. Check its prefix, lifetime and assignment method before replacing it with a familiar-looking address.

An IPv6-enabled router can also act as an endpoint. Answering a ping addressed to one of its own interfaces is different from forwarding a packet between two interfaces. The lab first establishes addressing; the next chapter develops the routing-table decisions for remote networks.

## Read and compress an address

A full example is `2001:0db8:0000:0000:0001:0000:0000:0001`. First remove leading zeros within groups: `2001:db8:0:0:1:0:0:1`. Then compress the longest run of complete zero groups with `::`. There are two equal runs of length two, so the recommended canonical form chooses the first: `2001:db8::1:0:0:1`.

**Canonical** means the consistent spelling recommended by RFC 5952, not the only valid spelling. IPv6 syntax permits several representations of the same bits. Canonical text uses lowercase, removes leading zeros, chooses the longest zero run, chooses the leftmost run on a tie, and does not compress a single zero group.

| Address text | Interpretation |
|---|---|
| `2001:db8:0:1:0:0:0:a` | Valid expanded-short form |
| `2001:db8:0:1::a` | Canonical form of the same address |
| `2001:db8::1:0:0:0:a` | Valid, but compresses only one zero group and is not canonical |
| `2001:db8::1::a` | Invalid: two `::` sequences make expansion ambiguous |
| `2001:db8:1:2:3:4:5:6:7` | Invalid: nine groups exceed 128 bits |

To expand `2001:db8:5::12:3456`, count the five visible groups. Three groups are missing, so expand to `2001:0db8:0005:0000:0000:0000:0012:3456`. Counting visible groups is more reliable than guessing from the number of colons.

Leading and trailing zeros are different. `0a00` becomes `a00`, not `a`. Removing the final zeros would change the value from hexadecimal A00 to A. When checking a configuration, expand both addresses if their short forms look deceptively similar.

## Work out the prefix

The suffix `/n` means that the first `n` bits identify the prefix. For `2001:db8:10:1::25/64`, the first four full groups identify `2001:db8:10:1::/64`. The final 64 bits identify the interface within the conventional /64 subnet structure.

A /64 is the standard choice for ordinary Ethernet SLAAC because its 64-bit interface identifier and the advertised prefix must total 128 bits. Other prefix lengths are valid for other purposes. A /48 can describe a site's allocation, /128 identifies one address, and /127 is standardized for appropriate router-to-router point-to-point links. This chapter's LANs and the next chapter's training links use /64 for clarity, not because other lengths are invalid.

Calculate the number of equal-size subnets with `2^(new prefix − original prefix)`. Dividing a /56 into /64s uses eight more prefix bits, yielding 256 subnets. A /48 yields 65,536 /64s; a /60 yields 16.

For a worked plan, split `2001:db8:1200:3400::/56` into /64s. The first 56 bits fix the first three groups and the first byte of the fourth. The fourth group therefore ranges from `3400` to `34ff`. The first /64 is `2001:db8:1200:3400::/64`, the next is `2001:db8:1200:3401::/64`, and the last is `2001:db8:1200:34ff::/64`.

A /60 stops after three hexadecimal digits of the fourth group. For `2001:db8:5:c7f2::1/60`, retain `c7f` and zero the remaining prefix-external bits. The network is `2001:db8:5:c7f0::/60`. Do not round it to `2001:db8:5:c700::/60`; that discards four retained bits.

A prefix can also stop inside a hexadecimal digit. For `2001:db8:7:ab3b::25/62`, the first 60 bits retain `2001:db8:7:ab3`. Write the next digit `b` as binary `1011`: /62 retains its first two bits, `10`, and clears the remaining two to give `1000`, hexadecimal `8`. Clear all following host bits. The network is `2001:db8:7:ab38::/62`, covering the four /64s `ab38` through `ab3b`. This is the same retain-network-bits method used for IPv4, applied four bits per hexadecimal digit.

There is no IPv4 broadcast-address subtraction. Nevertheless, avoid claiming every mathematical bit combination is an assignable ordinary host address: IPv6 has reserved addresses and anycast uses. Subnet counting and individual address assignment are distinct questions.

## Address types and scope

**Scope** describes the region in which an address is meaningful.

| Type or special address | Recognize it | Purpose |
|---|---|---|
| Global unicast | Common allocated space is `2000::/3` | Routable between networks when allocation, routing and policy permit |
| Documentation unicast | `2001:db8::/32` | Written examples and isolated labs; not public Internet use |
| Unique local | `fc00::/7`; locally generated prefixes use `fd00::/8` | Private routed connectivity within organizations or agreed sites |
| Link-local | Reserved block `fe80::/10` | Communication on one link; routers do not forward it onto another link |
| Multicast | `ff00::/8` | Delivery to members of a group within its scope |
| Loopback | `::1/128` | The local node itself |
| Unspecified | `::/128` | No assigned source address yet, including parts of address initialization |

A conforming link-local address uses `fe80` followed by zero bits before its 64-bit identifier. The /10 identifies the reserved block; it does not mean you should invent arbitrary nonzero bits in the remaining prefix area. You can manually use `fe80::1` on separate links, but two ordinary interfaces on the same link must not claim it as the same unicast identity.

A locally generated **unique local address** uses an `fd` prefix, a pseudorandom 40-bit Global ID, a 16-bit subnet ID and a 64-bit interface ID. The random portion helps independently chosen sites avoid collisions; it is not a guarantee. ULA is not intended for global Internet routing. It can still be routed inside a network with suitable routes and policies.

**Anycast** assigns the same address to multiple interfaces, with routing delivering a packet to one instance according to the selected route. It has no special visible prefix that proves an address is anycast. “Nearest” means reachable through the routing system's preferred path, not necessarily shortest geographic distance. Multicast instead addresses a group and can deliver copies to multiple members.

For local discovery, remember `ff02::1`, all IPv6 nodes on the link, and `ff02::2`, all IPv6 routers on the link. The `2` scope limits these groups to that link. A **solicited-node multicast address** combines `ff02::1:ff00:0/104` with the low 24 bits of a unicast or anycast address. For `2001:db8:10::12:3456`, those bits are `12:3456`, giving `ff02::1:ff12:3456`. Different addresses can share the same last 24 bits and therefore the same group; the complete target address still matters.

## Modified EUI-64

**Modified EUI-64** is one specific method of creating a 64-bit interface identifier from a 48-bit MAC address. It remains an explicit CCNA topic even though current standards recommend avoiding embedded stable MAC addresses as the default identifier strategy.

Work from MAC `00:1a:2b:3c:4d:5e`:

1. Split after the first three bytes: `00:1a:2b | 3c:4d:5e`.
2. Insert `ff:fe`: `00:1a:2b:ff:fe:3c:4d:5e`.
3. Invert the universal/local bit in the first byte: XOR with `02`. This toggles only the bit worth 2, the second bit from the right: `00000000` becomes `00000010`, so `00` becomes `02`. If that bit were already 1, the operation would clear it.
4. Regroup the eight bytes into four groups: `021a:2bff:fe3c:4d5e`.
5. Append to `2001:db8:10:1::/64`: `2001:db8:10:1:21a:2bff:fe3c:4d5e`.

:::trap
Invert the bit; do not always add 2. A first byte of `02` becomes `00`, while `00` becomes `02`. The inserted bytes span the second and third groups of the four-group identifier: `xxxx:xxff:fexx:xxxx`. Seeing `fffe` alone is not proof that an address was generated from a MAC.
:::

On IOS, `ipv6 address 2001:db8:acad:2::/64 eui-64` requests that method explicitly. For a real lab interface, derive the expected suffix from its displayed MAC. Do not copy a suffix from an example device and expect it to match yours.

## Neighbor Discovery and automatic addressing

**Neighbor Discovery (ND)** uses ICMPv6 messages for several jobs. Router Solicitation (RS, type 133) asks routers for information; Router Advertisement (RA, 134) supplies it. Neighbor Solicitation (NS, 135) and Neighbor Advertisement (NA, 136) resolve or verify local neighbors. Redirect (137) can inform a host of a better first hop.

```diagram
{"type":"sequence","title":"A host learns how to use its LAN","actors":["Host","Local router","Other nodes on link"],"steps":[{"from":0,"to":1,"label":"RS: request router information"},{"from":1,"to":0,"label":"RA: router lifetime and prefix information"},{"from":0,"to":2,"label":"DAD NS: check tentative address"},{"from":0,"to":1,"label":"NS when the next-hop MAC needs resolution"},{"from":1,"to":0,"label":"NA supplies neighbor information"}]}
```

**SLAAC** lets a host form an address using an advertised prefix and its own interface identifier. A valid RA with a nonzero router lifetime can also identify a default router, using the RA's link-local source address. Learning that router is separate from choosing an address.

The RA header's **M** flag indicates managed address configuration, and **O** indicates other configuration through DHCPv6. The **A** flag belongs to a Prefix Information Option and permits autonomous address formation from that prefix. Its **L** flag supplies on-link information. These are not mutually exclusive address modes: an A-enabled prefix can support SLAAC even when M is set, depending on client capabilities. A prefix's on-link status is not automatically implied merely because a host was assigned an address from it.

DHCPv6 can supply addresses and other settings, but ordinary IPv6 default-router discovery uses RA rather than a DHCPv6 default-gateway option. DNS information can come from DHCPv6, RA DNS options, or manual configuration. Do not promise that SLAAC alone provides DNS unless a supported DNS-information mechanism is also present.

Before normal use, **Duplicate Address Detection (DAD)** checks a tentative unicast address on the link. A DAD NS can use source `::` because the new address is not yet usable. A detected conflict prevents normal use of the duplicate. This is a local-link check, not a global uniqueness service.

For ordinary Ethernet address resolution, an NS targets the destination's solicited-node group and a responding neighbor supplies an NA. Neighbor reachability checks can instead use unicast NS. RAs can be periodic multicast or responses to solicitations; not every RA is necessarily multicast. Blocking essential ICMPv6 discovery messages can break connectivity, even when interface addresses look correct.

## Configure IPv6 on IOS

Use a complete static address when you want a predictable router address.

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

The global command enables IPv6 forwarding on IOS routers where it is disabled by default. On the ordinary enabled Ethernet interface, with RA transmission not suppressed, the router can advertise its prefix. Interface addressing by itself does not enable inter-interface forwarding.

The address command enables IPv6 processing and the interface has a link-local address, automatically formed unless explicitly configured. `ipv6 enable` enables processing and an automatic link-local address without assigning a global prefix. An `eui-64` command creates an address from a prefix and derived identifier; it does not promise the convenient suffix `::1`.

## Verify and troubleshoot

Representative abbreviated output, with the configured address from above:

```output R1# show ipv6 interface brief
GigabitEthernet0/0 [up/up]          ← physical and protocol state
    FE80::1                       ← local-link identity
    2001:DB8:ACAD:1::1             ← configured global-form lab address
```

Use `show ipv6 interface` for prefix lengths, multicast groups and ND/RA information. Use `show interfaces` for the MAC used in an EUI-64 calculation. Use `show ipv6 neighbors` after generating local traffic; it shows observed neighbor bindings, not an inventory of every address on every nearby device.

Read the connected and local IPv6 routes with the same distinction learned in Chapter 17:

```output R1# show ipv6 route — representative excerpt
C   2001:DB8:ACAD:1::/64 [0/0]
     via GigabitEthernet0/0, directly connected
L   2001:DB8:ACAD:1::1/128 [0/0]
     via GigabitEthernet0/0, receive
```

The /64 identifies the attached LAN; the local /128 identifies R1's own address. A test to a link-local neighbor must also identify the intended link, since the same link-local value may exist on different interfaces. Chapter 20 shows that scope explicitly in route commands and interactive ping prompts.

A reachable neighbor has recently confirmed reachability. A stale entry is not automatically broken; it means that recent confirmation is absent. Incomplete means resolution has not completed and can be temporary. Sustained failure with incomplete resolution justifies checking the address, VLAN/link and target availability. Do not interpret every non-reachable state as the same fault.

If automatic hosts have only link-local addresses, inspect the router's forwarding setting, link state, advertised prefix and A flag before assuming DHCP is missing. If a manual gateway fails, confirm that the stated gateway is actually configured on the router. Similar-looking `acad:2::1` and `acad:20::1` are different addresses. Test by numeric address first so DNS does not conceal the addressing problem.

## Exam focus

Practice expansion and canonical compression, prefix masking and subnet counts without a calculator before checking your work. Identify scope and address purpose from the prefix, while remembering that anycast cannot be identified from text alone.

Then explain how address generation, duplicate detection, neighbor resolution, router discovery and DNS information differ. A correctly configured host needs the appropriate combination for its task; no single command or address pattern proves that all of them work.
