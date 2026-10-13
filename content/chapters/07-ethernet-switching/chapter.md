---
id: ethernet-switching
number: 7
title: Ethernet switching
subtitle: How source addresses build the MAC table and destination addresses determine forwarding.
part: foundations
domain: switching
minutes: { lesson: 60, lab: 65 }
summary: Follow frames through a switched LAN, distinguish learning from forwarding, read the MAC address table, and investigate flooding, aging, and an incorrect static entry.
objectives:
  v1: ["1.13", "1.13.a", "1.13.b", "1.13.c", "1.13.d"]
  v2: []
prereqs: [network-models, cabling-and-interfaces, tcp-udp-ports]
sources:
  - { title: "Cisco: Catalyst 2960 IOS 15.0(2)SE — Managing the MAC address table", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swadmin.html" }
  - { title: "Cisco: Unicast Flooding in Switched Campus Networks", url: "https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6000-series-switches/23563-143.html" }
  - { title: "Cisco: Catalyst 2960 — Configuring IGMP Snooping and MVR", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swigmp.html" }
  - { title: "Cisco: Configure Jumbo/Giant Frame Support on Catalyst Switches", url: "https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6000-series-switches/24048-148.html" }
  - { title: "Cisco: Nexus 9000 CRC identification — forwarding mode and FCS", url: "https://www.cisco.com/c/en/us/support/docs/switches/nexus-9000-series-switches/216239-nexus-9000-cloud-scale-asic-crc-identifi.pdf" }
  - { title: "Cisco: Troubleshoot Switch Port and Interface Problems", url: "https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6500-series-switches/12027-53.html" }
  - { title: "IEEE: Registration Authority FAQs", url: "https://standards.ieee.org/faqs/regauth/" }
  - { title: "IEEE: Guidelines for EUI, OUI and CID", url: "https://standards-support.ieee.org/hc/en-us/articles/4888705676564-Guidelines-for-Use-of-Extended-Unique-Identifier-EUI-Organizationally-Unique-Identifier-OUI-and-Company-ID-CID" }
  - { title: "IEEE: Standard Group MAC Addresses", url: "https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf" }
  - { title: "IETF RFC 826: Ethernet Address Resolution Protocol", url: "https://www.rfc-editor.org/rfc/rfc826.html" }
---

When two computers communicate through a switch, the switch must decide which port should transmit each frame. It does not need a manually configured location for every computer. Instead, it builds a table by observing the source addresses of arriving frames. This chapter follows that process carefully, because the same reasoning explains normal forwarding, temporary flooding, and several common connectivity faults.

## Why a switch and not a hub

A **hub** repeats received signals to its other ports. Devices connected through the hub share one Ethernet medium and its available capacity. With half-duplex Ethernet, simultaneous transmissions can collide, and CSMA/CD manages contention and retransmission on that shared medium. Hubs are useful as a comparison, but modern wired access networks use switches.

A **switch** receives Ethernet frames and makes forwarding decisions. Each switched link can operate independently, and a correctly operating full-duplex point-to-point link has no collisions. A known unicast frame can go only toward its destination instead of being repeated to every attached computer. Total throughput still depends on link speeds, destination-port capacity, and the switch's hardware; full duplex does not remove every bottleneck.

:::facts
- A MAC address is **48 bits**, written as **12 hexadecimal digits**. The Ethernet broadcast destination is `ffff.ffff.ffff`.
- For normal dynamic learning, record the **source MAC**, **ingress port**, and **VLAN**. For forwarding, look up the **destination MAC in that VLAN**.
- Flood ordinary broadcast and unknown-unicast traffic to eligible forwarding ports in the same VLAN, excluding the ingress port.
- A MAC table maps **MAC + VLAN → port**. An IPv4 ARP table maps an on-link **IP address → MAC address**. They are separate tables.
- The documented default dynamic MAC aging time on the Catalyst 2960 IOS 15.0(2)SE used as the CLI reference is **300 seconds**. Verify the timer on the actual platform.
:::

The **MAC address table**, also called the forwarding or CAM table, is the starting point for this chapter. Basic Layer 2 forwarding uses that table rather than selecting an IP route. This does not mean a switch is incapable of inspecting IP information: switches may support ACLs, QoS, or Layer 3 routing. Here, we isolate ordinary bridging within a VLAN so that the learning process is clear.

## Anatomy of an Ethernet frame

An **Ethernet frame** carries a destination address, a source address, information identifying the payload, the payload itself, and an error-detection trailer. In ordinary Ethernet II, the **EtherType** identifies the payload protocol. The prefix `0x` marks a hexadecimal number: `0x0800` identifies IPv4, `0x0806` identifies ARP, and `0x86DD` identifies IPv6. The receiving protocol stack uses that distinction; the basic MAC lookup still concerns the destination MAC and VLAN.

| Field in an untagged Ethernet II frame | Size (bytes) | Purpose |
|---|---|---|
| Destination MAC | `6` | Identifies the intended recipient or group |
| Source MAC | `6` | Identifies the sender on this Ethernet link; used for learning |
| EtherType | `2` | Identifies the payload protocol |
| Data and any padding | `46–1500` for the basic frame described here | Carries the packet or other payload |
| Frame check sequence | `4` | Detects corruption using a CRC |

```diagram
{ "type": "bits", "title": "Fig 7.1 — Basic untagged Ethernet II frame",
  "fields": [
    { "label": "Destination MAC", "bits": 48, "note": "6 bytes · forwarding lookup", "highlight": true },
    { "label": "Source MAC", "bits": 48, "note": "6 bytes · learning", "highlight": true },
    { "label": "Type", "bits": 16, "note": "2 bytes" },
    { "label": "Data + padding", "bits": 368, "note": "minimum 46 bytes illustrated" },
    { "label": "FCS", "bits": 32, "note": "4 bytes · error detection" }
  ], "caption": "The 64-byte minimum includes destination MAC through FCS; preamble, start delimiter, and interframe gap are excluded." }
```

For the basic untagged frame with a 1500-byte maximum payload, the frame length is **64–1518 bytes**, measured from destination MAC through FCS. The physical transmission also uses a preamble and start frame delimiter, which are outside that count; an interframe gap is not payload or a frame field. A typical capture may omit the FCS, so its reported length need not equal the complete on-wire frame length. Always establish what a measurement includes before diagnosing a size error.

An ARP message provides a simple calculation. A 28-byte ARP message needs padding to reach the 46-byte minimum data area in this untagged frame. Add 14 bytes of header and 4 bytes of FCS: `14 + 46 + 4 = 64`. The **MTU** refers to the maximum Layer 3 packet size carried without fragmentation on that link, not the total frame including Ethernet header and trailer.

The **frame check sequence**, or FCS, contains a cyclic redundancy check calculated by the sender. A receiver can use it to detect corruption; it does not repair damaged bits. A store-and-forward switch checks the complete frame and discards one that fails that check. Recovery, if any, comes from another mechanism such as TCP or application retry, not from the FCS itself.

:::note Frame size depends on the framing and platform
An 802.1Q VLAN tag adds four bytes of tagging information, allowing a 1522-byte tagged frame with the same 1500-byte payload. Platforms may also support larger frames. A giant/error counter must be interpreted against the interface's supported size and configuration; “anything over 1518 is always bad” is incorrect. Small-frame and CRC counters also need context rather than an automatic diagnosis of collisions.
:::

## MAC addresses: OUI, unicast, multicast, broadcast

A MAC address such as `0050.56be.1a2b` can also be written as `00:50:56:be:1a:2b` or `00-50-56-BE-1A-2B`. The punctuation and capitalization change the presentation, not the value. Record the complete address when matching a host to a table entry. Similar-looking suffixes are not enough to identify the correct computer.

A **unicast** address identifies an individual interface; a **multicast** address identifies a group. The all-ones **broadcast** address, `ffff.ffff.ffff`, addresses the broadcast domain. In the first octet, the least-significant bit is the individual/group bit: a set bit indicates a group address. Thus `01` as the first octet indicates a group, while `00` indicates an individual address. Valid ordinary Ethernet source addresses are individual addresses, so switches do not dynamically learn a broadcast destination as a host source.

An **organizationally unique identifier**, or OUI, is a registered organizational prefix. The familiar manufacturer allocation uses a 24-bit OUI followed by an organization-assigned portion, but the IEEE also supplies other allocation sizes. **Locally administered** addresses can be assigned by software, including virtual systems and address-randomization features. An OUI lookup can be a useful clue; it is not proof of the physical manufacturer, device type, ownership, or trustworthiness.

Each hexadecimal digit represents four bits, so the first octet `01` is `00000001` in binary. Its rightmost bit is set, identifying a group address. This uses the same bit positions you worked with in IPv4 addressing; the notation has changed from decimal to hexadecimal.

| Destination type | Example | Forwarding consideration |
|---|---|---|
| Individual unicast | `0050.56be.1a2b` | Look up that MAC within the VLAN |
| Broadcast | `ffff.ffff.ffff` | Flood to eligible forwarding ports in the VLAN |
| IPv4 multicast | `0100.5e01.0203` | Multicast forwarding state can restrict delivery |
| Link-local bridge group | `0180.c200.0000` | Reserved control traffic has special bridge handling |

For ordinary user multicast with snooping and multicast restrictions disabled, the switch floods to the other eligible forwarding ports in the VLAN, excluding ingress. **IGMP**, the Internet Group Management Protocol, communicates IPv4 multicast group membership. **IGMP snooping** lets a switch observe that membership information and use it to restrict delivery. Reserved link-local group addresses, including the standard spanning-tree bridge group, receive special handling. Read the stated assumptions before applying an ordinary flooding rule; this chapter does not require configuring multicast protocols.

## Learn, forward, filter, flood

A switch makes two separate decisions when a valid frame is eligible for ordinary bridging. First, it learns or refreshes the **source** address on the ingress port in the frame's VLAN. Second, it looks up the **destination** in that VLAN. The fact that a sender is new does not require flooding if the destination is already known.

| Operation | Condition | Result |
|---|---|---|
| Learn or refresh | Valid source received with learning enabled | Associate source MAC and VLAN with ingress port |
| Forward known unicast | Destination is on another forwarding port | Send toward that port |
| Filter same-port traffic | Destination is known through the ingress port | Do not send it back onto the same segment |
| Flood unknown unicast | No destination entry in this VLAN | Send copies to eligible forwarding ports except ingress |
| Flood ordinary broadcast | Destination is Ethernet broadcast | Send copies within the VLAN, subject to port state and policy |

Imagine PC-A on `Fa0/1`, PC-B on `Fa0/2`, and PC-C on `Fa0/3`, all in VLAN 1. All three ports are up and forwarding, no filtering policy is configured, and both the host ARP caches and switch's dynamic table start empty. PC-A knows PC-B's IPv4 address from the ping command but must first obtain its MAC address. Follow the sequence below without skipping the source-learning decision.

| Frame arriving at the switch | Source learned | Destination decision | Egress ports |
|---|---|---|---|
| A's ARP request to broadcast | A on `Fa0/1` | Broadcast | `Fa0/2`, `Fa0/3` |
| B's ARP reply to A | B on `Fa0/2` | A already known | `Fa0/1` |
| A's ICMP echo request to B | Refresh A | B known | `Fa0/2` |
| B's ICMP echo reply to A | Refresh B | A known | `Fa0/1` |

PC-C receives the broadcast but does not answer an ordinary ARP request for PC-B's address. Merely receiving a frame does not put C into the switch's dynamic table: the switch needs to see a frame with C as its source. The ARP reply is already known unicast because the preceding request taught the switch where A is. There is no requirement to flood the first reply simply because B is a newly observed sender.

Now clear the switch's dynamic entries while A retains B's mapping in its ARP cache. A can immediately construct a unicast Ethernet frame addressed to B, without sending ARP again. The switch has no destination entry for B, so it floods that **unknown unicast** to B's and C's eligible ports. B's reply teaches B's location again, after which the next request can use known-unicast forwarding.

:::trap Flooding does not rewrite the destination
An unknown-unicast frame keeps its original unicast destination MAC. Flooding describes the switch making copies, not the sender addressing a broadcast. In ordinary host operation, C rejects the copy addressed to B. Exclude the ingress port, other VLANs, down ports, and ports not forwarding for this VLAN when listing flood destinations.
:::

A single switch port can lead to many hosts. If B and C sit behind a second switch reached through `Fa0/24`, the first switch can learn both addresses on `Fa0/24`. That entry means “the path toward this address,” not “the address is physically plugged into this port.” If a frame arrives from that segment for another address already known through the same ingress port, the switch filters it instead of sending it back.

## Aging, static entries and the table commands

**Dynamic** entries are learned from traffic and can age out after inactivity. Seeing frames from a source refreshes its learned location. Traffic merely addressed to a host does not demonstrate where that host is currently attached. This explains how a quiet destination can disappear from the dynamic table even while another device keeps sending traffic toward it.

The Catalyst 2960 IOS reference for this chapter documents a **300-second** default aging timer. Other platforms and configurations can differ. Aging is not the only way an entry can change: a new source frame on a different port can update a dynamic location, and interface events, topology changes, or an administrator can remove entries. Do not wait for the timer to expire before expecting a legitimate host move to be learned.

Use privileged EXEC mode to examine the table before changing it. The first command displays all entries; the filtered commands answer narrower questions. Keyword support differs among simulators and IOS releases, so use the full table if a display filter is unavailable. These commands inspect existing state; they do not send traffic from the host you are looking for.

```ios SW1
SW1# show mac address-table
SW1# show mac address-table dynamic
SW1# show mac address-table address 0050.56be.1a2b
SW1# show mac address-table interface fastethernet0/24
SW1# show mac address-table vlan 10
SW1# show mac address-table aging-time
```

A **static entry** explicitly associates an address and VLAN with an interface. It does not age like an ordinary dynamic entry and survives a dynamic-table clear. A wrongly placed static entry can therefore keep sending destination traffic toward the wrong port. Static entry configuration is a useful controlled lab demonstration; ordinary access-switch hosts normally rely on dynamic learning.

```ios SW1
SW1# configure terminal
SW1(config)# mac address-table aging-time 600
SW1(config)# mac address-table static 0050.56be.1a2b vlan 10 interface fastethernet0/5
SW1(config)# end
SW1# show mac address-table
```

The snippet demonstrates syntax, not a complete VLAN 10 topology. In the lab you will use the actual host MAC and the existing VLAN 1 ports, then remove the change. `clear mac address-table dynamic` removes learned entries; it does not remove a configured static entry. Use the matching `no mac address-table static ...` command for that configuration and verify the result before saving.

## Switching methods and domains

**Store-and-forward** switching receives the complete frame before forwarding it and can check the FCS first. **Cut-through** forwarding can begin after sufficient header information arrives, before the whole frame and FCS have arrived. It therefore cannot wait for the complete frame's FCS result before that initial forwarding. Specific switches may use different behavior depending on their architecture, ports, or operating conditions; do not infer a universal forwarding method from the Catalyst or Nexus family name alone.

The practical distinction is error checking before initial transmission versus starting earlier. Both approaches still need destination forwarding information. Neither means every received frame is copied to every port. Exact hardware latency, historical fragment-free switching, and internal ASIC behavior are outside this chapter's CCNA foundation.

A **collision domain** describes a shared area in which half-duplex transmissions can contend. Each switch port separates that area from the other ports; a hub and the devices attached through it share one. On a full-duplex link, collisions do not occur even though introductory diagrams still count the link as a separate collision domain. Do not confuse this diagram convention with a prediction that the link will suffer collisions.

A **broadcast domain** is the Layer 2 scope of ordinary broadcast delivery. One VLAN can span several switches without creating a new broadcast domain at each switch. Different VLANs are separate broadcast domains, and routing is needed for IP communication between them. In a simple diagram with one router interface in each of two separate LANs, count two broadcast domains; more elaborate routed subinterfaces and bridging require examining the actual configuration.

## Why VLANs and spanning tree exist

A **VLAN** keeps a group of switch ports in its own logical Layer 2 domain. A broadcast received in VLAN 10 is not simply copied into VLAN 20. VLAN membership is therefore part of every forwarding example, even before you learn to configure trunks. The same numerical MAC value can have separate forwarding entries in different VLANs.

Redundant Layer 2 paths create another problem. An ordinary Ethernet frame has no hop-count field equivalent to IP TTL to stop its circulation through a bridging loop. Flooded traffic can travel around the loop repeatedly, consume capacity, and make source locations appear to move between ports. **Spanning Tree Protocol** establishes a loop-free forwarding topology while retaining redundant physical links for recovery.

This is why a connected port is not automatically an eligible flood destination. A port that is not forwarding for the VLAN must be excluded. The later spanning-tree chapter teaches roles, states, and convergence; do not deliberately build an unprotected loop to test this foundation. Frequent MAC moves warrant investigation, but can also involve duplicate addressing or other topology behavior rather than proving one particular cause.

## Reading the output

Read the VLAN column first, then the MAC, entry type, and port. The following output is representative: the values illustrate a topology, and actual host MACs, reserved entries, totals, and formatting vary. PC-A is directly attached to `Fa0/1`; B and C are reached through the second switch on `Fa0/24`. Multiple distinct MACs on that uplink are expected.

```output Representative SW1# show mac address-table
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    00aa.aaaa.aaaa    DYNAMIC     Fa0/1   ← PC-A has transmitted on this link
   1    00bb.bbbb.bbbb    DYNAMIC     Fa0/24  ← path toward PC-B, behind another switch
   1    00cc.cccc.cccc    DYNAMIC     Fa0/24  ← PC-C shares the uplink, not B's address
  10    0050.56be.1a2b    STATIC      Fa0/5   ← configured entry in a different VLAN
```

To investigate a missing host, first verify its link and VLAN, then generate traffic from that host and inspect the table again. If the address appears on an uplink, continue to the next switch; do not assume it is directly connected. If replies head toward an unexpected port, check whether the entry is static, whether the host moved, and whether the same source is appearing elsewhere. One table snapshot provides a location observation, not a complete diagnosis.

Keep **ARP** and switching evidence separate. A host uses ARP to find the MAC for an on-link IPv4 next hop; the switch uses its MAC table to select an egress port. Clearing the host's ARP cache does not directly clear the switch's MAC entries, and clearing the switch table does not clear the host's ARP cache. A switch may also have an ARP table for its own IP functions, which remains distinct from its bridging table.

## Exam focus

- Learn from source MAC, ingress port, and VLAN; forward using destination MAC in that VLAN.
- Work through initial ARP and ping traffic one frame at a time, updating the table after each source is observed.
- Distinguish known unicast, unknown unicast, and broadcast; apply VLAN, ingress-port, and forwarding-state exclusions.
- Recognize multicast forwarding and reserved-control-traffic exceptions to a simple flooding rule.
- Explain dynamic aging, source refresh, static entries, and why multiple MACs on one uplink are normal.
- Read `show mac address-table` and distinguish it from a host or router ARP table.
- Explain FCS as error detection, frame-length counting scope, VLAN broadcast domains, and the reason spanning tree prevents loops.

Before moving on, follow an ARP request, its reply, and the resulting unicast frames through a switch without confusing the host's ARP cache with the switch's MAC table. The next chapter secures remote access to a router through this switched LAN. The router terminates the IP management session; the switch carries its frames without needing its own management address. Switch management addressing follows in Chapter 11.
