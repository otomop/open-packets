---
id: etherchannel
number: 13
title: EtherChannel
subtitle: Build and verify LACP bundles without confusing aggregate capacity with one flow.
part: switching
domain: switching
minutes: { lesson: 55, lab: 75 }
summary: Explain LACP negotiation, compatible member settings, Layer 2 and Layer 3 port channels, endpoint teaming requirements, and traffic distribution; configure, verify, fault, and restore both bundle types.
objectives:
  v1: ["2.4"]
  v2: ["2.1.c", "2.2.d", "2.2.e"]
prereqs: [trunks-dtp, inter-vlan-routing, cdp-lldp]
sectionIds:
  "Why links are bundled": "why-two-links-are-worse-than-one-bundle"
  "LACP negotiation and the alternatives": "negotiating-the-bundle-lacp-pagp-and-on"
  "Check both ends before configuring": "what-has-to-match"
  "Build Layer 2 and Layer 3 port channels": "configuring-layer-2-and-layer-3-port-channels"
  "Understand traffic distribution and capacity": "load-balancing-and-limits"
  "Read the bundle and partner state": "reading-the-output"
  "Verify traffic and correct faults": "verify-and-troubleshoot"
  "Exam focus": "exam-focus"
sources:
  - {"title": "Linux kernel: Ethernet bonding driver documentation", "url": "https://docs.kernel.org/networking/bonding.html"}
  - {"title": "Cisco: EtherChannels, Catalyst 3560 IOS 15.0(1)SE", "url": "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swethchl.html"}
  - {"title": "Cisco: EtherChannels, Catalyst 9300 IOS XE 17.17", "url": "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-17/configuration_guide/lyr2/b_1717_lyr2_9300_cg/configuring_etherchannels.html"}
  - {"title": "Cisco: EtherChannel load balancing and redundancy", "url": "https://www.cisco.com/c/en/us/support/docs/lan-switching/etherchannel/12023-4.html"}
---

The trunk between SW1 and SW2 is running out of capacity, so you add a second cable. Nothing gets faster. Spanning tree sees two parallel paths between the same switches, which is a loop, and blocks one of them. EtherChannel solves this by bundling the cables into one logical interface, a port channel, that spanning tree treats as a single link. Both cables forward, and if one fails the other carries on.

This chapter builds on trunks (chapter 10), routed ports (chapter 11) and neighbor tables (chapter 12). You will learn the three ways a bundle forms (LACP, PAgP and static), which mode pairs work, and what must match on every member. By the end you can configure and verify a Layer 2 and a Layer 3 EtherChannel with LACP, and explain why a port channel that is up may be running on fewer links than you intended.

## Why links are bundled

Without aggregation, two parallel switch links are separate Layer 2 paths. Ethernet has no general hop limit to stop a frame circulating around a switching loop. **Spanning Tree Protocol (STP)** prevents loops by placing redundant paths into nonforwarding roles. For now, understand that parallel cables do not automatically provide simultaneous usable forwarding capacity. Chapter 14 develops root selection, roles, and states in detail.

An **EtherChannel**, also called a **port channel**, groups its physical **member interfaces** into one logical link. STP handles a Layer 2 port channel as one interface for the relevant VLAN. The members are used by the bundle, rather than each becoming an independent competing STP path. STP can still block the entire logical port channel if it is redundant with another path. Aggregation does not disable loop prevention.

Two 1-Gbps members provide up to 2 Gbps of aggregate link capacity in each direction when traffic distribution uses both links. They do not turn every individual transfer into a 2-Gbps transfer. If one member fails, the bundle continues through the surviving member with less capacity.

Port channels are useful between switches, between routing-capable devices, and toward a server or appliance that supports the corresponding aggregation mode. A **NIC** is a network interface card or adapter. **Teaming**, also called bonding in some systems, coordinates several adapters as one host connectivity design; its selected mode determines whether the switch must aggregate its ports. A two-NIC server does not automatically need LACP. Its operating system, virtual switch, appliance configuration, and physical attachment must support the chosen design.

```diagram
{"type":"topology","title":"Two physical members, one logical port channel","caption":"Several traffic flows may use different members of Po1; an individual hash result selects one member.","nodes":[{"id":"A","kind":"switch","label":"SW1","sub":"Po1","x":3,"y":3},{"id":"B","kind":"switch","label":"SW2","sub":"Po1","x":9,"y":3}],"links":[{"from":"A","to":"B","label":"Po1: two 1-Gbps members","fromLabel":"Gi0/1 + Gi0/2","toLabel":"Gi0/1 + Gi0/2","accent":true}]}
```

## LACP negotiation and the alternatives

:::facts
- **LACP** is the standards-based Link Aggregation Control Protocol, now specified by IEEE 802.1AX; older references use IEEE 802.3ad.
- LACP `active` initiates negotiation; `passive` responds. Active/active and active/passive can form a bundle; passive/passive cannot initiate one.
- **PAgP** is Cisco's Port Aggregation Protocol: `desirable` initiates, `auto` responds.
- `on` uses static aggregation without LACP or PAgP negotiation. Both endpoints need compatible static configuration.
- `S` means Layer 2, `R` means Layer 3, and `U` means in use in common `show etherchannel summary` output. Member `P` means bundled.
- Configure a routed port channel's IP address on the logical interface, not on each member.
- Every member must match in speed, duplex, access or trunk mode, and VLAN settings. A bundle has at most **8** active members.
:::

LACP exchanges information about the sending system and its ports. The switches use that information, together with local interface compatibility, to select links for one aggregate. A physically up port is only a candidate; it must also join the correct partner and bundle. LACP active mode does not mean that the port is the only forwarding member, and passive mode does not mean a standby-only data link.

| One end | Other end | Result when the members are compatible |
|---|---|---|
| LACP `active` | LACP `active` or `passive` | Bundle forms |
| LACP `passive` | LACP `passive` | No bundle: neither end starts negotiation |
| PAgP `desirable` | PAgP `desirable` or `auto` | Bundle forms |
| PAgP `auto` | PAgP `auto` | No bundle: neither end starts negotiation |
| `on` | `on` | Bundle forms with no negotiation and no checking |
| `on` | Any LACP or PAgP mode | No bundle, and a risk of a loop |
| Any LACP mode | Any PAgP mode | No bundle: different protocols |

The keyword after `mode` selects the protocol as well as the behavior: `active` and `passive` are LACP, `desirable` and `auto` are PAgP, and `on` is neither. Both ends must use the same protocol. A port in `on` mode sends no negotiation frames and answers none, so pairing it with any LACP or PAgP mode fails. That pairing can also create a loop, because one switch bundles the links while the other treats them as separate ports. The labs use LACP, the standard and the usual choice.

The **channel-group number** identifies the local bundle. SW1 group 1 can connect to SW2 group 5; matching numbers are an administrative convenience, not an LACP requirement. What matters is that the intended links on each device belong to the correct local group and identify the same appropriate aggregation partner.

When negotiation fails, the members do not join the bundle. `show etherchannel summary` then flags each one `I` (stand-alone), `s` (suspended) or `D` (down), depending on the platform, instead of `P`.

## Check both ends before configuring

Start with a connection table. List every local member, the far device, and the far port. CDP or LLDP can help confirm the observed endpoints, but also inspect the actual cables. In the simple design used here, all members connect the same two switches. Connecting half the links to a separate independent switch does not create one valid remote LACP system.

Member interfaces need compatible operational characteristics. Check their speed, duplex, Layer 2 versus routed mode, and the supported interface types for that device. For a Layer 2 bundle, members must share the intended access VLAN or compatible trunk settings, including native VLAN and allowed VLANs. LACP negotiates aggregation; it does not automatically build the VLAN design.

| Check | Why it matters |
|---|---|
| Same intended partner on all links | Prevents grouping unrelated physical paths |
| Compatible member speed and duplex | Gives the aggregate a supported set of physical links |
| Layer 2 or Layer 3 on all members | Avoids mixing switched and routed interfaces |
| Consistent access VLAN or trunk settings | Ensures frames receive the same treatment on any member |
| Compatible protocol and modes | Allows both ends to agree on aggregation |
| Required VLANs configured at both ends | Makes the intended traffic service available after formation |

Distinguish local member consistency from the service settings across the two switches. A local mismatch can prevent a member from joining. A VLAN mismatch between complete logical trunks may still leave a bundle up while particular traffic fails. Successful LACP negotiation is therefore necessary evidence for this design, but not the whole service test.

For a server, verify its actual teaming mode before selecting switch commands. An LACP team needs an LACP-capable host configuration. A supported static team needs matching static aggregation. A switch-independent team may require separate switch ports with no port channel. An access port or trunk is chosen separately according to the endpoint's VLAN requirements; do not infer the mode from a device label such as “hypervisor.”

For one LACP bundle, a server whose members attach to two physical switches needs those switches to offer a supported common logical aggregation system, such as an appropriate stack or multichassis design. Two unrelated switches are insufficient. This chapter does not configure those designs; it teaches the requirement so that a port-channel template is not applied to an incompatible endpoint. The same check applies to firewalls and other network appliances.

## Build Layer 2 and Layer 3 port channels

For a Layer 2 trunk bundle, define the VLANs, make both members consistent, and apply `channel-group ... mode active`. Keep new parallel links administratively shut while configuring both ends, then enable the finished bundle. This prevents the work-in-progress cabling from being mistaken for a verified channel.

The example below is one side of a two-member Catalyst 2960 trunk. The lab supplies both endpoints, PC settings, and verification. `interface range` selects the physical members; `interface port-channel 1` selects their logical interface.

```ios SW1
SW1# configure terminal
SW1(config)# vlan 10
SW1(config-vlan)# exit
SW1(config)# vlan 99
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# shutdown
SW1(config-if-range)# switchport mode trunk
SW1(config-if-range)# switchport trunk native vlan 99
SW1(config-if-range)# switchport trunk allowed vlan 10,99
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 99
SW1(config-if)# switchport trunk allowed vlan 10,99
SW1(config-if)# end
```

Once the bundle exists, make trunk changes on the port-channel interface; IOS applies them to the members. Changing only one member's allowed VLAN list makes that member inconsistent with the bundle, and the switch suspends it. To move a member to a different protocol or take it out of the bundle, shut it down, enter `no channel-group`, and then apply the new `channel-group` command.

A **Layer 3 EtherChannel** is a routed connection. Its members are routed ports, and the logical port channel holds one IP address for the local end. It does not carry a switchport access VLAN or trunk allowed list. The far end has another usable address in the same transit subnet, just as with an ordinary routed Ethernet link.

On the Catalyst 3560 used for the routed lab, create the routed logical interface and make its members routed before assigning the group. A Layer 2-only 2960 is not a substitute for this part.

```ios D1
D1# configure terminal
D1(config)# ip routing
D1(config)# interface port-channel 1
D1(config-if)# no switchport
D1(config-if)# ip address 10.13.12.1 255.255.255.252
D1(config-if)# no shutdown
D1(config-if)# exit
D1(config)# interface range fastethernet0/1 - 2
D1(config-if-range)# shutdown
D1(config-if-range)# no switchport
D1(config-if-range)# no ip address
D1(config-if-range)# channel-group 1 mode active
D1(config-if-range)# end
```

D2 uses 10.13.12.2/30 on its corresponding logical interface. After both endpoints are ready, enable the members, inspect the bundle and connected route, and ping across it. Recall the connected (C) and local (L) routes from chapter 11; the interface is now the logical bundle:

```output D1# show ip route — representative excerpt
C  10.13.12.0/30 is directly connected, Port-channel1
L  10.13.12.1/32 is directly connected, Port-channel1
```

The connected /30 covers peer 10.13.12.2; the local /32 identifies D1 itself, on images that display local routes. Neither physical member should hold a separate address for this transit. A working peer ping establishes the bundle's local IP exchange; communication with additional remote networks requires the appropriate forward and return routes, developed in Chapters 17–18.

## Understand traffic distribution and capacity

A switch normally selects an outgoing member using a **hash** of selected frame or packet fields. Depending on hardware and configuration, the inputs can include source/destination MAC addresses, IP addresses, or transport ports. The same input values usually select the same member while membership is stable. Keeping related traffic together avoids routine packet reordering.

“Per flow” is a useful shorthand, but the configured hash may distinguish fewer fields than a full TCP connection. A source-MAC-only hash places all traffic with the same source MAC onto the same selected member. Several different conversations can therefore share one member. Two distinct inputs can also hash to the same member, so multiple clients do not guarantee equal distribution.

A four-member 1-Gbps bundle has up to 4 Gbps of aggregate capacity per direction across suitably distributed traffic. One conversation assigned to one member remains limited by that member's 1-Gbps line rate, with application throughput below it because of overhead and other limits. Adding members does not remove a server, disk, or remote-path bottleneck.

Suppose a distribution switch routes traffic toward many clients through an EtherChannel. Those outgoing Ethernet frames may all have the distribution switch's source MAC. If its selected method uses only that MAC, the downstream traffic can concentrate on one member. An available destination-based or source-and-destination IP method may provide more varied input. Verify the current method rather than assume a product-family default.

`show etherchannel load-balance` displays the current method. On the Catalyst 2960 and 3560 the default is `src-mac`. The global command `port-channel load-balance` changes it, for example to `src-dst-ip`, and applies to every port channel on the switch. Each end chooses its own outbound member, so the two switches do not need the same method for the bundle to form.

A port channel on these Catalyst switches has at most eight active members. LACP lets you assign up to sixteen ports to one group: eight carry traffic and the rest wait in hot standby. PAgP and static bundles stop at eight.

## Read the bundle and partner state

Read the legend printed by `show etherchannel summary`. These are representative excerpts for the two lab topologies, not captured Packet Tracer output.

```output SW1# show etherchannel summary
Flags: D - down        P - bundled in port-channel
       I - stand-alone s - suspended
       R - Layer3      S - Layer2
       U - in use
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------
1      Po1(SU)       LACP        Fa0/23(P) Fa0/24(P)  ← Layer 2, in use, two bundled members
```

```output D1# show etherchannel summary
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------
1      Po1(RU)       LACP        Fa0/1(P) Fa0/2(P)  ← routed logical interface, two bundled members
```

`U` describes the logical interface, while `P` describes each member's participation. A channel may remain in use with only one intended member bundled. Count the participating members instead of stopping at the first reassuring flag. Lowercase `s` means suspended; uppercase `S` means a Layer 2 port channel. Case matters.

Use `show lacp neighbor` to compare the partner system and port information. Both intended links should identify the same appropriate partner system, with different partner ports. Do not memorize one hexadecimal state byte as proof for every platform. Use the summary, partner information, and interface configuration together. Where a simulator lacks this command, `show etherchannel port-channel` and inspection of both ends provide a partial alternative, not an identical protocol capture.

## Verify traffic and correct faults

For a Layer 2 trunk channel, check the bundle, then `show interfaces trunk` and the VLAN configuration on both ends. Confirm that the PCs are on the intended access VLAN and have compatible addresses. STP should see the logical port channel for that VLAN. Reading its detailed role and cost belongs to the next chapter; this lab does not require memorizing an aggregate STP cost.

For a Layer 3 channel, verify that the IP address belongs to `Port-channel1`, that the members are routed and unnumbered, and that the expected connected prefix appears when the interface is operational. Test both directions. A successful peer ping establishes the local transit exchange, not reachability to every network beyond the peer.

When a member fails, record the member flags, active member count, and logical state before restoring it. A few packets may be lost while traffic moves to the surviving member. The port channel stays up as long as one member remains, with less capacity.

When an intended bundle fails completely, compare the actual configuration with the connection table. Check physical state, compatible LACP modes, partner identity, routed versus switched mode, and VLAN consistency. Make one justified change, then repeat the same checks. Do not force static `on` simply to obtain an up flag; that removes negotiation without correcting an incompatible design.

:::trap An up port channel can have reduced capacity
`Po1(SU)` tells you that a Layer 2 port channel is in use. It does not count the active members for you. If only one of two intended interfaces has `(P)`, investigate the other interface even when a ping succeeds.
:::

## Exam focus

- Explain why STP treats a Layer 2 bundle as one logical interface.
- Recognize compatible LACP modes and distinguish PAgP and static aggregation.
- Check physical members, partner identity, VLAN settings, and endpoint teaming requirements.
- Configure and verify both Layer 2 and Layer 3 LACP port channels.
- Interpret logical-interface flags separately from individual member flags.
- Explain aggregate capacity, hash-based distribution, and one-flow limitations.
- Diagnose a missing member or failed traffic service and verify recovery.
