---
id: ipv4-addressing
number: 4
title: IPv4 addressing
subtitle: Read an address and mask, decide what is local, and verify the configuration.
part: foundations
domain: infra
minutes: { lesson: 75, lab: 65 }
summary: Build an IPv4 address from binary, calculate subnet boundaries and usable ranges, then configure router and host addresses and diagnose mask and gateway errors.
objectives:
  v1: ["1.6"]
  v2: ["1.3"]
prereqs: [network-models, cabling-and-interfaces]
sources:
  - { title: "Cisco: Configure IP Addresses and Unique Subnets", url: "https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html" }
  - { title: "RFC 1122: Host requirements, section 3.3.1.1 local/remote decision", url: "https://www.rfc-editor.org/rfc/rfc1122.html#section-3.3.1.1" }
  - { title: "RFC 4632: Classless Inter-domain Routing", url: "https://www.rfc-editor.org/rfc/rfc4632.html" }
  - { title: "RFC 3021: 31-bit prefixes on point-to-point links", url: "https://www.rfc-editor.org/rfc/rfc3021.html" }
  - { title: "Cisco: Configuring IPv4 Addresses", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/ip-addressing/ip-addressing/m_config-ipv4-addr-0.html" }
  - { title: "Cisco: Local Host Routes Installed in the Routing Table", url: "https://www.cisco.com/c/en/us/support/docs/ip/ip-routing/116264-technote-ios-00.html" }
  - { title: "Cisco: Understand Proxy ARP", url: "https://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13718-5.html" }
---

An address by itself does not tell you which network a device belongs to. You need its subnet mask as well. Once you can use those two values together, you can choose valid addresses, understand when a host uses its gateway, and explain several common connection failures.

Work through the calculations before trying to do them quickly. The lab uses the same two subnets throughout so that you can compare your paper answers with the configuration and the router's routing table.

The first labs supplied complete address tables, and Chapter 01 used a /24 to explain local versus remote delivery. Here you learn to derive those tables for other masks. Carry forward Chapter 03's link checks: an enabled, working interface and a correct IP configuration are separate requirements.

## Why the mask decides everything

A PC on Ethernet needs to choose the next device to receive a packet. If the destination is on its own IP subnet, the PC normally uses **Address Resolution Protocol (ARP)** to find that destination's MAC address. If the destination is remote, the PC uses an appropriate route, usually its **default gateway** on a simple workstation. The gateway is a router address reachable on the local LAN.

Consider PC-A at `192.168.44.130/26`. Its subnet contains addresses `192.168.44.128` through `192.168.44.191`. A destination of `192.168.44.150` is local, so PC-A resolves that host's MAC address. A destination of `192.168.44.194` is outside the subnet, so PC-A resolves its gateway's MAC address and sends the frame there. The packet's destination IP address is still `192.168.44.194`; using a gateway does not replace it with the gateway's IP.

Change only PC-A's mask to `/24` and it now considers `192.168.44.194` local. It may send ARP requests for a device that is physically on a different LAN. This is why a correct-looking address does not prove a correct configuration. Check the address, mask, and gateway together.

For these examples, assume a workstation with one network connection and no manually added routes. Real hosts have routing tables, and a more specific route can change the next-hop decision. You do not need those exceptions to configure the basic LAN correctly.

## Binary and the 32-bit address

:::facts
- IPv4 addresses contain 32 bits, written as four 8-bit octets. Each octet is 0–255.
- Octet bit values, left to right: `128 64 32 16 8 4 2 1`.
- A prefix length counts network bits. Host bits = `32 − prefix length`.
- Network address = address AND mask. A mask has consecutive ones followed by zeros.
- On an ordinary subnet through /30: total addresses = `2^host bits`; usable addresses = total − 2.
- A /31 point-to-point subnet uses both addresses; /32 identifies one address.
:::

A **bit** has two possible values: 0 or 1. In an address, the position of a bit tells you how much it contributes to the number. A 1 in the leftmost position contributes 128; a 1 in the rightmost contributes 1. Add the values of the positions containing 1. Eight ones add to 255, which explains the largest possible decimal octet.

| Position from left | Value | Bit in 173 |
|---|---|---|
| 1 | 128 | 1 |
| 2 | 64 | 0 |
| 3 | 32 | 1 |
| 4 | 16 | 0 |
| 5 | 8 | 1 |
| 6 | 4 | 1 |
| 7 | 2 | 0 |
| 8 | 1 | 1 |

For `173`, start with 128 and subtract it: 45 remains. Skip 64 because it is too large. Subtract 32, leaving 13; skip 16; subtract 8, 4, and 1. The result is `10101101`. To check it, add `128 + 32 + 8 + 4 + 1 = 173`. Keep all eight positions, including zeros; otherwise the place values change.

The reverse operation uses the same table. Binary `11010010` contains `128 + 64 + 16 + 2`, which equals 210. Practice with individual octets first. An entire address is simply four of these conversions separated by dots.

An **AND** operation compares corresponding bits in two values. Its result is 1 only when both bits are 1: `1 AND 1 = 1`; all other combinations produce 0. A mask bit of 1 therefore retains the address bit, while a mask bit of 0 clears it. That is how the mask separates the network portion from the host portion.

```text
Address, last octet: 173 = 10101101
Mask, last octet:    192 = 11000000
                            AND
Network octet:      128 = 10000000
```

The first three octets of a /26 mask are all ones, so they remain unchanged. Applying this operation to `192.168.44.173/26` produces network address `192.168.44.128`. The remaining six bits identify the position of a device within that subnet.

```diagram
{ "type": "binary", "ip": "192.168.44.173", "prefix": 26, "title": "Address bits and the /26 boundary", "caption": "The first 26 bits identify the subnet; the final six bits vary between addresses within that subnet." }
```

## Masks, prefixes and block sizes

A **subnet mask** marks network bits with ones and host bits with zeros. A **prefix length**, such as `/26`, is another way to write the same boundary: 26 network bits, then 6 host bits. In dotted notation, `/26` is `255.255.255.192`, because its final octet is `11000000`.

The ones must be consecutive from the left. `255.0.255.0` is not a valid contiguous subnet mask: it resumes network bits after host bits have already begun. Do not confuse a subnet mask with the wildcard masks used later in access lists; their rules and purpose differ.

| Ones within one octet | Binary value | Decimal value |
|---|---|---|
| 0 | `00000000` | 0 |
| 1 | `10000000` | 128 |
| 2 | `11000000` | 192 |
| 3 | `11100000` | 224 |
| 4 | `11110000` | 240 |
| 5 | `11111000` | 248 |
| 6 | `11111100` | 252 |
| 7 | `11111110` | 254 |
| 8 | `11111111` | 255 |

To convert `/20`, fill two complete octets with ones: that accounts for 16 bits. Put four ones in the third octet, giving 240, and zeros in the fourth. The result is `255.255.240.0`. In the other direction, `255.255.254.0` contains `8 + 8 + 7 = 23` ones, so it is `/23`.

For a partial octet, the **block increment** is `256 − mask value`. With 192 in the fourth octet, the increment is 64. Subnets therefore start at fourth-octet values 0, 64, 128, and 192. With 240 in the third octet, they start at 0, 16, 32, 48, and so on in the third octet; the whole fourth octet varies inside each block.

An increment is not always the total number of addresses. A /20 increment of 16 covers 16 complete fourth-octet ranges: `16 × 256 = 4,096` addresses. At an octet boundary such as /24, there is no partial octet: retain the first three octets and vary the fourth from 0 through 255.

:::trap Use the stated mask
Modern addressing is classless. You cannot infer a device's configured prefix from its first octet. An address starting with 10 can use /25, /30, or another valid prefix. Historical class A, B, and C defaults were /8, /16, and /24; they are background terminology, not a substitute for reading today's configuration.
:::

## Network, broadcast and usable hosts

The **network address** identifies the subnet as a whole. All host bits are zero. The **subnet broadcast address** has the same network bits with all host bits set to one. On an ordinary LAN, neither address is assigned to a workstation or gateway. Addresses between them are available for interfaces.

For `192.168.44.173/26`, the final-octet increment is 64. The boundaries are 0, 64, 128, and 192; 173 lies in the block starting at 128. Its network is `192.168.44.128`, broadcast is `192.168.44.191`, and usable range is `192.168.44.129–192.168.44.190`. Six host bits provide `2^6 = 64` total addresses and 62 usable addresses.

A gateway consumes one of those 62 addresses. It does not have to be the first or last usable address; that is an administrative convention. If a requirement says “62 PCs plus a router interface,” a /26 is too small because you need 63 usable addresses. Establish what the device count includes before choosing a mask.

In the capacity formula, `2^6` means two raised to the sixth power, or six factors of two multiplied together. Each additional host bit doubles the possible address combinations. This is why subnet capacities change in powers of two rather than one address at a time.

For `172.20.77.210/20`, the third-octet boundaries are multiples of 16. The value 77 falls in the 64–79 block. Set the host bits to zero for `172.20.64.0`; set them to one for `172.20.79.255`. The usable range is `172.20.64.1–172.20.79.254`, with 4,094 usable addresses. Both the low four bits of the third octet and all eight bits of the fourth octet are host bits.

The method also works in the second octet. For `10.203.15.77/13`, the mask is `255.248.0.0`, with an increment of 8 in the second octet. The containing block begins at 200 and ends at 207, giving network `10.200.0.0` and broadcast `10.207.255.255`. Do not stop the calculation at an octet that still contains host bits.

| Prefix | Mask | Total addresses | Usable on an ordinary subnet |
|---|---|---|---|
| /24 | `255.255.255.0` | 256 | 254 |
| /25 | `255.255.255.128` | 128 | 126 |
| /26 | `255.255.255.192` | 64 | 62 |
| /27 | `255.255.255.224` | 32 | 30 |
| /28 | `255.255.255.240` | 16 | 14 |
| /29 | `255.255.255.248` | 8 | 6 |
| /30 | `255.255.255.252` | 4 | 2 |

A **/31** is a specific exception for a point-to-point link with two endpoints. RFC 3021 treats both addresses as endpoint addresses; neither is reserved as that subnet's directed broadcast. For `10.0.0.0/31`, the endpoints can use `10.0.0.0` and `10.0.0.1`. Do not apply the ordinary subtraction of two, and do not use /31 for a multi-device user LAN. Both devices must support this use.

A **/32** identifies exactly one address. It is common on router loopbacks and in host routes. A router **loopback interface** is a software interface with no physical cable; a **host route** matches one destination address. Loopbacks can be configured with other masks, so “loopback” does not automatically mean /32. The important calculation is that /32 leaves no varying host bits.

:::trap An ending of .0 or .255 is not enough
Within `10.4.8.0/22`, the network is `10.4.8.0` and the broadcast is `10.4.11.255`. Addresses such as `10.4.9.0` and `10.4.8.255` are valid hosts. Judge the complete host portion, using the actual mask.
:::

## Practice problems

For each row, write the mask, locate the block, and identify the network and broadcast before reading the answer. Then check the result by counting the total addresses. If you can explain your result in binary, the quicker block method is working correctly.

| Address | Network | Broadcast | Usable range |
|---|---|---|---|
| `192.168.1.77/28` | `192.168.1.64` | `192.168.1.79` | `.65–.78` |
| `10.10.10.200/25` | `10.10.10.128` | `10.10.10.255` | `.129–.254` |
| `172.16.33.19/27` | `172.16.33.0` | `172.16.33.31` | `.1–.30` |
| `192.168.100.250/29` | `192.168.100.248` | `192.168.100.255` | `.249–.254` |
| `10.1.1.130/30` | `10.1.1.128` | `10.1.1.131` | `.129–.130` |
| `172.30.150.9/22` | `172.30.148.0` | `172.30.151.255` | `172.30.148.1–172.30.151.254` |
| `10.66.77.88/18` | `10.66.64.0` | `10.66.127.255` | `10.66.64.1–10.66.127.254` |
| `192.168.200.130/23` | `192.168.200.0` | `192.168.201.255` | `192.168.200.1–192.168.201.254` |

To choose a mask for 50 total interface addresses, compare capacities. A /27 gives 30 usable addresses and is too small. A /26 gives 62 and is the smallest subnet that fits. “Smallest subnet” means the fewest total addresses that satisfy the requirement, which corresponds to the longest suitable prefix.

To check whether two hosts share a subnet, calculate each host's network using its configured mask. With matching masks, matching network addresses mean the addresses belong to the same subnet. If masks differ, also evaluate what each host believes about the destination; one may send directly while the other uses a gateway. Matching the first three decimal numbers is not a valid general test.

## Configuring addresses on IOS

On the Cisco 2911 used here, configure an IPv4 address on the routed Ethernet interface. The `ip address` command takes an address and dotted mask. Enter `no shutdown` to remove an administrative shutdown, then check that the physical link and line protocol are actually up. The command enables the interface; it cannot repair a disconnected cable.

These commands create two separate LANs. Start at `Router>`; if the router already has a hostname, its prompt will use that name.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 192.168.44.129 255.255.255.192
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 192.168.44.193 255.255.255.224
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

Each LAN needs its own nonoverlapping subnet. In this example, Gi0/0 uses `.128/26` and Gi0/1 uses `.192/27`. Configuring Gi0/1 with a /24 instead would include the first LAN's entire range. IOS normally rejects this overlap between routed interfaces in the same routing table. Read any error before continuing, then verify the configuration that was actually retained.

To remove an IPv4 assignment from an interface that has only this one address, select that interface and enter `no ip address`. This removes the address; it does not shut the port down. Verify the result in `show running-config` and `show ip interface brief`. Use removal only when the intended plan calls for it, rather than deleting a working address to investigate an unrelated link fault.

A Catalyst 2960's physical switch ports operate at Layer 2. You do not assign these LAN gateway addresses to its ordinary access ports. A switch management address belongs on a switch virtual interface, a subject covered later. The switch needs no management IP merely to forward frames between the PC and R1 in this lab.

## Verify and troubleshoot

Use different commands for different questions. Running configuration shows the active settings; startup configuration shows the saved settings. Operational output reports whether the interface is currently usable. The following examples are representative, abbreviated IOS-style output for the stated topology, not a captured Packet Tracer run. Interface lists, spacing, and other details vary by software image.

```output R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0      192.168.44.129  YES manual up                    up  ← LAN-A is operational
GigabitEthernet0/1      192.168.44.193  YES manual administratively down down  ← administrative shutdown
```

The brief table shows addresses and state, but not masks. Use `show ip interface gigabitethernet0/0` to read the prefix, or `show running-config` to find the interface's `ip address` line. Some simulator images support fewer filtered forms of these commands; the full running configuration remains a useful fallback.

```output R1# show ip interface gigabitethernet0/0
GigabitEthernet0/0 is up, line protocol is up
  Internet address is 192.168.44.129/26  ← verify /26, not merely .129
...
```

After both LAN interfaces are up/up, `show ip route` should contain connected routes for `192.168.44.128/26` and `192.168.44.192/27`. A `C` route identifies the connected subnet. Images displaying `L` local routes also show each router interface's own address as a /32. An `L` /32 does not mean that the attached LAN uses a /32 mask.

Check a PC with `ipconfig` or its network settings. Ping its gateway first, then a remote host. If the gateway responds but remote communication fails, inspect the far host as well: the reply needs a return path. A gateway need not be involved in a same-subnet exchange, so working local traffic does not prove the gateway setting.

| Evidence | What to check next |
|---|---|
| Interface says administratively down | Enter `no shutdown` on the intended interface |
| Interface is enabled but link remains down | Cable, peer port, device power, and physical state |
| Correct address, uncertain mask | Detailed IP interface output and host configuration |
| Local traffic works; remote traffic fails | Both hosts' masks and gateway addresses, then router routes |
| Address command rejected | Network/broadcast selection, mask validity, and overlap |

A wrong mask can sometimes remain unnoticed because of **proxy ARP**: a router may answer an ARP request on behalf of a remote destination and then route the packet. A successful ping therefore does not certify the mask. Read the configuration. Proxy ARP behavior depends on the receiving interface and available route; do not assume it is enabled everywhere or depend on it to correct a bad address plan.

## Exam focus

- Convert an octet between decimal and binary, and explain what AND does.
- Convert between dotted masks and prefix lengths without assuming an address class.
- Calculate network, broadcast, usable range, and usable count with the actual prefix.
- Include gateway and other infrastructure addresses in host requirements.
- Distinguish /30, the /31 point-to-point exception, and a /32 host route.
- Explain when a basic workstation ARPs for a destination versus its gateway.
- Configure an interface with a dotted mask and verify both its prefix and operational state.
- Diagnose an invalid host address, overlapping subnet, wrong mask, or incorrect gateway from evidence.

Before Chapter 05, calculate a subnet's complete range, choose valid host/gateway addresses, and check the configured mask on both a PC and router. Chapter 05 combines those individual calculations into a plan for several networks with different capacity requirements.
