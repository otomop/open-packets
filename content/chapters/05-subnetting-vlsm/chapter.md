---
id: subnetting-vlsm
number: 5
title: Subnetting & VLSM
subtitle: Size each subnet, place it correctly, and check the plan before configuring devices.
part: foundations
domain: infra
minutes: { lesson: 75, lab: 75 }
summary: Calculate subnet capacities and boundaries, build a nonoverlapping VLSM plan, recognize private and special-purpose addresses, and verify the plan against router and host configurations.
objectives:
  v1: ["1.6", "1.7"]
  v2: ["1.3"]
prereqs: [ipv4-addressing]
sources:
  - { title: "Cisco: Configure IP Addresses and Unique Subnets", url: "https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html" }
  - { title: "Cisco: Configure Subnet Zero and All-Ones Subnet", url: "https://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13711-40.html" }
  - { title: "RFC 1918: Address Allocation for Private Internets", url: "https://www.rfc-editor.org/rfc/rfc1918.html" }
  - { title: "RFC 4632: Classless Inter-domain Routing", url: "https://www.rfc-editor.org/rfc/rfc4632.html" }
  - { title: "IANA: IPv4 Special-Purpose Address Registry", url: "https://www.iana.org/assignments/iana-ipv4-special-registry/" }
  - { title: "RFC 3021: 31-bit prefixes on point-to-point links", url: "https://www.rfc-editor.org/rfc/rfc3021.html" }
  - { title: "RFC 3927: IPv4 Link-Local Addresses", url: "https://www.rfc-editor.org/rfc/rfc3927.html" }
  - { title: "RFC 6598: Shared Address Space", url: "https://www.rfc-editor.org/rfc/rfc6598.html" }
  - { title: "RFC 5737: Documentation Address Blocks", url: "https://www.rfc-editor.org/rfc/rfc5737.html" }
  - { title: "Cisco: Configuring IPv4 Addresses", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/ip-addressing/ip-addressing/m_config-ipv4-addr-0.html" }
---

Subnetting starts with a practical requirement: several separate networks must fit inside an address block you are allowed to use. Your job is to give each network enough addresses, avoid overlap, and leave a plan another technician can understand.

The previous chapter explained what an address and mask mean. Here you will use that knowledge to choose masks, assign subnets of different sizes, and check the result. Keep an address table as you work. It is easier to find a mistake in a table than after several devices have been configured.

## Why one mask never fits everyone

**Fixed-length subnet masking (FLSM)** divides a parent block into equal-size subnets. It is useful when similar sites or VLANs need a standard allocation. It is not inherently wrong or wasteful: consistent sizes can simplify administration and reserve growth. The problem arises when the chosen size cannot satisfy the largest LAN, or consumes too much space for the available block.

**Variable-length subnet masking (VLSM)** uses different prefix lengths within a parent block. A branch may need a /25 for users, a /26 for operations, a /27 for devices, and a /30 for a router link. These are separate subnets, each with its own boundaries. Using the same first three octets does not make them one LAN.

:::facts
- An ordinary subnet through /30 has `2^(32 − prefix) − 2` usable addresses.
- Dividing a parent /p into equal /q subnets gives `2^(q − p)` subnets, where q is at least p.
- Do not subtract two from the modern subnet count. The all-zero and all-one subnet numbers are usable.
- Count all addressed interfaces, including gateways, and any explicit growth allowance.
- In an empty allocation, place the largest required blocks first. Every subnet must be aligned, contained in the parent, and nonoverlapping.
- RFC 1918 private space is `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`.
:::

Write requirements in unambiguous terms. “50 hosts” may mean 50 workstations or 50 total interface addresses. In this chapter's allocation tables, the stated usable-address requirement includes the gateway unless explicitly stated otherwise. If a customer needs 50 workstations plus a gateway, calculate for 51 addresses before adding planned growth.

Do not allocate addresses merely because a range appears unused. In a working organization, first confirm that the parent block is assigned to this site and not reserved elsewhere. Private addresses still require coordination across connected sites.

## The block-size method in any octet

Start by converting the prefix to a mask. Locate the partial octet, subtract its mask value from 256, and find the block boundary at or below the address. Zero all host bits for the network and set all host bits to one for the broadcast. For octet-aligned prefixes such as /16 and /24, retain the complete network octets and set the remaining octets to zero or 255.

Take `172.16.77.210/20`. The mask is `255.255.240.0`, so the third-octet increment is 16. Boundaries around 77 are 64 and 80. The network is `172.16.64.0`, the broadcast is `172.16.79.255`, and the usable range is `172.16.64.1–172.16.79.254`. A /20 has 12 host bits, giving 4,096 total addresses and 4,094 usable addresses.

Compare `172.16.77.210/23`. Now the mask is `255.255.254.0`, with an increment of 2. The network becomes `172.16.76.0`, broadcast `172.16.77.255`, and usable count 510. The address is unchanged; the boundary moves because the mask changes.

```diagram
{ "type": "binary", "ip": "172.16.77.210", "prefix": 23, "title": "A /23 includes two consecutive third-octet values", "caption": "The third octet retains seven network bits; its final bit and the entire fourth octet form the host portion." }
```

| Prefix | Dotted mask | Total addresses | Usable addresses |
|---|---|---|---|
| /22 | `255.255.252.0` | 1,024 | 1,022 |
| /23 | `255.255.254.0` | 512 | 510 |
| /24 | `255.255.255.0` | 256 | 254 |
| /25 | `255.255.255.128` | 128 | 126 |
| /26 | `255.255.255.192` | 64 | 62 |
| /27 | `255.255.255.224` | 32 | 30 |
| /28 | `255.255.255.240` | 16 | 14 |
| /29 | `255.255.255.248` | 8 | 6 |
| /30 | `255.255.255.252` | 4 | 2 |

Choosing a prefix works in reverse. For 70 workstations and one gateway, you need 71 usable addresses. A /26 provides only 62; a /25 provides 126. Choose /25 if the requirement is the smallest subnet that fits. A longer prefix reduces the subnet's capacity; moving from /26 to /27 cannot solve a shortage of addresses.

For equal-size subnet counts, compare the parent and child prefixes. Dividing `172.16.0.0/16` into /23s adds seven network bits: `2^7 = 128` subnets. Each /23 still has nine host bits and 510 usable addresses. Dividing a /24 into at least 12 equal subnets requires four added bits: /28 gives 16 subnets with 14 usable addresses each. Three bits would give only eight subnets.

The two formulas answer different questions. Do not subtract network and broadcast addresses from the number of subnets. You subtract them from an ordinary subnet's host capacity. As covered earlier, /31 point-to-point links use both endpoint addresses, and /32 identifies one address; treat those as explicit exceptions.

## VLSM: allocate largest first

Suppose `192.168.40.0/24` must support Engineering with 120 total usable addresses, Guests with 55, Sales with 25, and two router links needing two endpoints each. Convert the requirements into block sizes first. Engineering needs /25, Guests /26, Sales /27, and each link /30. The blocks consume `128 + 64 + 32 + 4 + 4 = 232` of the parent's 256 addresses.

Place the largest block at the beginning of the unused parent, then place each smaller block at the next valid boundary. In an empty contiguous parent, descending block sizes make this straightforward. If parts of the parent are already assigned or reserved, check each free interval; largest-first does not make existing fragmentation disappear.

| Segment | Network/prefix | Usable range | Broadcast |
|---|---|---|---|
| Engineering | `192.168.40.0/25` | `.1–.126` | `.127` |
| Guests | `192.168.40.128/26` | `.129–.190` | `.191` |
| Sales | `192.168.40.192/27` | `.193–.222` | `.223` |
| Link A | `192.168.40.224/30` | `.225–.226` | `.227` |
| Link B | `192.168.40.228/30` | `.229–.230` | `.231` |

Check the Guests allocation independently. A /26 starts at fourth-octet multiples of 64: 0, 64, 128, or 192. The boundary .128 is valid, .128–.191 supplies 64 total addresses, and its 62 usable addresses exceed the requirement of 55. It begins immediately after Engineering's broadcast .127 and ends before Sales starts at .192.

The remaining interval is `.232–.255`, or 24 addresses. It can be recorded exactly as `192.168.40.232/29` and `192.168.40.240/28`. It cannot hold a /27, which needs 32 aligned addresses. Free addresses are not interchangeable with free subnets; both size and location matter.

:::trap A host/prefix notation is not necessarily a network boundary
`172.16.40.16/25` is a valid way to describe a host and its mask, but .16 is not the start of a /25. Its containing network is `172.16.40.0/25`. A plan calling .16 the beginning of a new /25 would overlap anything already allocated in .0–.127.
:::

For requirements of 100, 60, and 10 usable addresses plus a two-endpoint link inside `172.16.40.0/24`, a valid largest-first plan is `.0/25`, `.128/26`, `.192/28`, and `.208/30`. Write every broadcast too: .127, .191, .207, and .211. This exposes accidental overlap before you type an interface command.

Some requirements cannot fit. Two LANs needing 100 addresses each require two /25s, consuming all 256 addresses of a /24. A third LAN needing 50 addresses adds a /26: 320 total addresses are required. Reordering or summarizing does not create space. Obtain an appropriate larger block or revise the requirements. An available, aligned /23 has 512 total addresses and can contain those three allocations.

## Summarisation: keep the shared bits

A **summary route** describes a larger address range with one prefix. It can replace several more specific routes in an appropriate routing design. Here, use summarization as an address-boundary exercise; configuring routing protocols and choosing where to advertise a summary belong in the routing chapters.

For `10.44.8.0/24` through `10.44.11.0/24`, look at the third octet in binary. The values 8, 9, 10, and 11 share six leading bits. Together with the first two octets, that gives `16 + 6 = 22` shared bits.

```text
8  = 00001000
9  = 00001001
10 = 00001010
11 = 00001011
     ------     six shared leading bits
```

The exact summary is `10.44.8.0/22`, covering `10.44.8.0–10.44.11.255`. Four /24s contain `4 × 256 = 1,024` addresses; a /22 also contains 1,024. The starting value 8 is aligned to a third-octet increment of 4. Both the size and the boundary agree.

Now shift the requirement to `10.44.9.0/24` through `10.44.12.0/24`. These four networks straddle a /22 boundary. The smallest single containing prefix is `10.44.8.0/21`, which also includes the .8, .13, .14, and .15 /24s. An exact cover would instead use `10.44.9.0/24`, `10.44.10.0/23`, and `10.44.12.0/24`.

A summary does not prove that every covered destination exists or is reachable. Advertising an overly broad range may attract traffic for addresses that should go elsewhere, or for which the summarizing router has no usable path. That risk exists inside an organization as well as at its boundary. Record the range a summary includes before treating it as a replacement.

## Private, public and special-purpose ranges

**Private IPv4 addresses** are the three ranges designated by RFC 1918. Organizations may use them internally without obtaining globally unique allocations. Different organizations can therefore use the same private addresses independently. Inside a connected organization, however, each active subnet still needs a coordinated allocation.

| Private block | First address | Last address |
|---|---|---|
| `10.0.0.0/8` | `10.0.0.0` | `10.255.255.255` |
| `172.16.0.0/12` | `172.16.0.0` | `172.31.255.255` |
| `192.168.0.0/16` | `192.168.0.0` | `192.168.255.255` |

Only the second-octet values 16–31 of the 172 range are private. Thus `172.31.200.1` is private, but `172.32.5.10` is outside RFC 1918. Likewise, `192.169.1.1` is not in `192.168.0.0/16`. “Not RFC 1918” is the conclusion you can draw from these comparisons; it does not by itself prove that an arbitrary address is publicly usable.

Public unicast addresses are allocated for global uniqueness. Their actual reachability also depends on routing and policy. You cannot select an unassigned-looking public address for your own Internet connection. IANA maintains special-purpose ranges, and allocation and routing information must be checked when assigning real public space.

| Address or block | Recognition needed here |
|---|---|
| `127.0.0.0/8` | Loopback; traffic remains within the host |
| `169.254.0.0/16` | IPv4 link-local; may indicate a client did not obtain DHCP configuration |
| `100.64.0.0/10` | Shared space, .64–.127 in the second octet; often used with provider NAT |
| `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | Documentation examples, not ordinary public deployment addresses |
| `0.0.0.0` | Unspecified address in relevant host configuration contexts |
| `255.255.255.255` | Limited broadcast |
| `224.0.0.0/4` | IPv4 multicast, not ordinary unicast interface addressing |

**Multicast** addresses a group of receivers, unlike unicast to one interface or broadcast to a local broadcast domain. The loopback block in this table, commonly represented by `127.0.0.1`, is for a host communicating with itself. It is distinct from a router's named software loopback interface, which can use another assigned address and be reached through routing.

Keep the address `0.0.0.0` separate from the route prefix `0.0.0.0/0`. The address can indicate that a host has not yet selected its IPv4 address. The /0 prefix contains no fixed network bits and matches every IPv4 destination; it is used for a default route. The prefix changes the meaning of the notation.

The table is a practical subset, not the entire special-purpose registry. In particular, neither link-local nor shared address space is RFC 1918 space. Recall that DHCP supplies a client's address settings automatically. A **lease** is an address assignment for an agreed period. A PC reporting an automatically assigned `169.254.x.x` address suggests checking why it did not obtain normal DHCP configuration, including connectivity and client settings. The address alone cannot establish the exact cause, and a link-local address could have been configured intentionally. Chapter 24 teaches the server, message exchange and lease process; here, recognize the range and the limit of that observation.

Private traffic can be routed between internal LANs and sites. It is not intended to be routed as globally unique public traffic. An Internet edge commonly uses **Network Address Translation (NAT)** to translate addresses; **Port Address Translation (PAT)** also distinguishes exchanges by transport ports so clients can share an address. Chapter 06 teaches those ports and Chapter 26 teaches translation. An application proxy, which makes a request on a client's behalf, is another possible design. Translation does not replace firewall policy, and it does not need to occur at every internal router.

If two sites use the same private subnet, connecting them can create ambiguous destinations. A host may regard the remote address as local and attempt ARP instead of using a gateway. Renumbering is the most straightforward way to remove the overlap. Specialized translation and separate routing tables can also be used, but their configuration is outside this chapter. Do not claim that routers can never hold multiple paths to the same prefix; the problem here is overlapping address meaning.

## Ten drills

Use the table to check your work after attempting each calculation. In allocation questions, all stated usable-address requirements include gateways.

| # | Task | Answer and check |
|---|---|---|
| 1 | Network and broadcast for `192.168.10.77/27` | `192.168.10.64`, `.95`; increment 32 |
| 2 | Network and broadcast for `172.16.77.210/23` | `172.16.76.0`, `172.16.77.255`; increment 2 |
| 3 | Network and broadcast for `10.4.200.77/20` | `10.4.192.0`, `10.4.207.255`; increment 16 |
| 4 | /28 subnets inside one /22 | `2^(28−22) = 64`; each has 14 usable addresses |
| 5 | Smallest subnet for 500 usable addresses | /23 gives 510; /24 gives only 254 |
| 6 | `192.168.72.0/24`: needs 60, 28, 12, 6, and one /30 | `.0/26`, `.64/27`, `.96/28`, `.112/29`, `.120/30` |
| 7 | Exact summary of `172.16.32.0/24–172.16.47.0/24` | `172.16.32.0/20`; 16 aligned /24s |
| 8 | Smallest single cover of `10.44.9.0/24–10.44.12.0/24` | `10.44.8.0/21`; contains additional networks |
| 9 | RFC 1918: `172.31.255.1`, `172.32.0.1`, `100.64.5.5` | Only `172.31.255.1` |
| 10 | Is `10.44.8.160/27` inside `10.44.8.128/26`? | Yes: .160–.191 is inside .128–.191 |

## Verify and troubleshoot

After allocating subnets, compare the plan against the devices. On a router, `show ip interface brief` checks addresses and state, while `show ip interface` includes the prefix. `show running-config` shows the configured dotted mask. The routing table shows connected prefixes when the corresponding interfaces are operational.

For the lab's operations LAN, the correct command sequence is:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.44.8.129 255.255.255.192
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface gigabitethernet0/1
R1# show ip route
```

Representative, abbreviated output for the completed lab is shown below. These lines illustrate what to compare; they are not a captured simulator run.

```output R1# show ip route
...
C        10.44.8.0/25 is directly connected, GigabitEthernet0/0
L        10.44.8.1/32 is directly connected, GigabitEthernet0/0
C        10.44.8.128/26 is directly connected, GigabitEthernet0/1  ← operations has a /26
L        10.44.8.129/32 is directly connected, GigabitEthernet0/1  ← the router's own address
C        10.44.8.192/27 is directly connected, GigabitEthernet0/2
L        10.44.8.193/32 is directly connected, GigabitEthernet0/2
```

If Gi0/1 were configured with /25, its range would be .128–.255 and overlap the Devices /27. Check the masks on existing interfaces before blaming the new address. If IOS rejects an address command, verify the retained configuration; a failed replacement may leave the previous address in place.

For a host fault, compute both the PC's subnet and the gateway's location. `10.44.9.140/25` belongs to `10.44.9.128/25`, while gateway `10.44.9.1` belongs to `10.44.9.0/25`. The correct repair must follow the intended LAN plan, not simply widen the mask until the numbers seem to fit. In the lab's expanded operations LAN, use `10.44.9.10/25` with gateway `10.44.9.1`.

Test local and remote destinations separately. A working ping does not prove that a mask is correct, and a failed ping does not identify the mask as the only possible fault. Compare configuration and route evidence, make one change, then repeat the same tests.

## Exam focus

- Calculate the containing network and broadcast with masks that end in different octets.
- Use the parent and child prefixes to count equal-size subnets.
- Choose the smallest suitable subnet from the total required usable addresses.
- Allocate VLSM blocks with valid boundaries, no overlap, and room for stated growth.
- Recognize when requirements exceed the parent block's capacity.
- Understand a summary's covered range and distinguish exact from broader coverage.
- Recognize all three RFC 1918 ranges and distinguish private from other special-purpose space.
- Verify masks and connected prefixes, and correct gateway or overlap mistakes using the intended plan.

Carry your address-planning method forward: capacity, boundary, containment, overlap, then device verification. Chapter 06 adds another identifier to the packet walk: the transport port that selects an application endpoint within the addressed host.
