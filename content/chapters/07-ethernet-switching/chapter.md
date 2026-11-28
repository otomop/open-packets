---
id: ethernet-switching
number: 7
title: Ethernet switching
subtitle: How source addresses build the MAC table and destination addresses determine forwarding.
part: foundations
domain: switching
minutes: { lesson: 60, lab: 40 }
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

You plug a new PC into any free port on a switch and it works. Nobody told the switch which computer is on which port, yet a frame for that PC comes out of the right port and no other. When it does not, and a host is unreachable or traffic shows up on ports where it should not, you need to know how the switch decides. It builds a table by watching the source addresses of arriving frames, and it reads that table to forward each frame by its destination address.

Earlier chapters used a switch as a box that joins hosts on one subnet, and Chapter 01 showed a host using ARP to find a neighbor's MAC address. This chapter opens the box. By the end you will be able to follow any frame through a switch and say what the switch learns and where the frame goes, read `show mac address-table`, explain flooding and aging, and count collision and broadcast domains.

## Why a switch and not a hub

A **hub** repeats every received signal out of all its other ports. Every device on it shares one Ethernet medium: only one can send at a time, simultaneous transmissions collide, and CSMA/CD makes the senders back off and retransmit. Everyone also receives everyone else's traffic.

A **switch** reads each Ethernet frame and decides where to send it. A frame for a known destination goes out of one port only, each port is a separate link, and a full-duplex link between two devices has no collisions. That is why switches replaced hubs.

:::facts
- A MAC address is **48 bits**, written as **12 hexadecimal digits**. The Ethernet broadcast destination is `ffff.ffff.ffff`.
- For normal dynamic learning, record the **source MAC**, **ingress port**, and **VLAN**. For forwarding, look up the **destination MAC in that VLAN**.
- Flood ordinary broadcast and unknown-unicast traffic to eligible forwarding ports in the same VLAN, excluding the ingress port.
- A MAC table maps **MAC + VLAN → port**. An IPv4 ARP table maps an on-link **IP address → MAC address**. They are separate tables.
- A dynamic entry ages out after **300 seconds** (5 minutes) without a frame from that source. This is the Catalyst default.
:::

The switch keeps what it has learned in the **MAC address table**, also called the forwarding table or CAM table. A Layer 2 switch forwards within a VLAN from this table alone; it does not look at IP addresses or routes to do so.

## Anatomy of an Ethernet frame

Everything a switch decides, it decides from the first few fields of the frame. An **Ethernet frame** carries a destination address, a source address, information identifying the payload, the payload itself, and an error-detection trailer. In ordinary Ethernet II, the **EtherType** identifies the payload protocol. The prefix `0x` marks a hexadecimal number: `0x0800` identifies IPv4, `0x0806` identifies ARP, and `0x86DD` identifies IPv6. The receiving protocol stack uses that distinction; the basic MAC lookup still concerns the destination MAC and VLAN.

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

For the basic untagged frame with a 1500-byte maximum payload, the frame length is **64–1518 bytes**, measured from destination MAC through FCS. Before each frame the sender transmits a 7-byte preamble and a 1-byte start frame delimiter so the receiver can synchronize. These 8 bytes are not counted in the frame length.

An ARP message provides a simple calculation. A 28-byte ARP message needs padding to reach the 46-byte minimum data area in this untagged frame. Add 14 bytes of header and 4 bytes of FCS: `14 + 46 + 4 = 64`. The **MTU** refers to the maximum Layer 3 packet size carried without fragmentation on that link, not the total frame including Ethernet header and trailer.

The **frame check sequence**, or FCS, contains a cyclic redundancy check calculated by the sender. A receiver can use it to detect corruption; it does not repair damaged bits. A store-and-forward switch checks the complete frame and discards one that fails that check. Recovery, if any, comes from another mechanism such as TCP or application retry, not from the FCS itself.

:::note Frame size depends on the framing and platform
An 802.1Q VLAN tag adds four bytes, so a tagged frame with a 1500-byte payload is 1522 bytes and is valid. Some interfaces are also configured for larger "jumbo" frames. A frame shorter than 64 bytes is a **runt**, and a frame longer than the interface allows is a **giant**; `show interfaces` counts both as errors.
:::

## MAC addresses: OUI, unicast, multicast, broadcast

A MAC address such as `0050.56be.1a2b` can also be written as `00:50:56:be:1a:2b` or `00-50-56-BE-1A-2B`. The punctuation and capitalization change the presentation, not the value. IOS uses the dotted form, Windows the hyphenated form. Match all twelve digits when you look for a host in a table.

A **unicast** address identifies an individual interface; a **multicast** address identifies a group. The all-ones **broadcast** address, `ffff.ffff.ffff`, addresses the broadcast domain. In the first octet, the least-significant bit is the individual/group bit: a set bit indicates a group address. Thus `01` as the first octet indicates a group, while `00` indicates an individual address. Valid ordinary Ethernet source addresses are individual addresses, so switches do not dynamically learn a broadcast destination as a host source.

The first 24 bits of a manufacturer's address are its **organizationally unique identifier**, or OUI, which the IEEE assigns to the manufacturer; the manufacturer assigns the last 24 bits. **Locally administered** addresses are set by software instead, as virtual machines and phones with address randomization do. An OUI lookup is therefore a useful clue to the vendor, not proof.

Each hexadecimal digit represents four bits, so the first octet `01` is `00000001` in binary. Its rightmost bit is set, identifying a group address. This uses the same bit positions you worked with in IPv4 addressing; the notation has changed from decimal to hexadecimal.

| Destination type | Example | Forwarding consideration |
|---|---|---|
| Individual unicast | `0050.56be.1a2b` | Look up that MAC within the VLAN |
| Broadcast | `ffff.ffff.ffff` | Flood to eligible forwarding ports in the VLAN |
| IPv4 multicast | `0100.5e01.0203` | Multicast forwarding state can restrict delivery |
| Link-local bridge group | `0180.c200.0000` | Reserved control traffic has special bridge handling |

For ordinary user multicast with snooping and multicast restrictions disabled, the switch floods to the other eligible forwarding ports in the VLAN, excluding ingress. **IGMP**, the Internet Group Management Protocol, communicates IPv4 multicast group membership. **IGMP snooping** lets a switch observe that membership information and use it to restrict delivery. Reserved control addresses such as the spanning-tree group are processed by the switch itself and are not flooded like user traffic.

## Learn, forward, filter, flood

A switch does two separate things with every frame it receives, and keeping them apart is the whole skill. First, it learns or refreshes the **source** address on the ingress port in the frame's VLAN. Second, it looks up the **destination** in that VLAN and forwards, filters or floods. The source never decides where the frame goes: a frame from a new sender to a known destination is forwarded, not flooded.

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

PC-C receives the broadcast but does not answer an ordinary ARP request for PC-B's address. Merely receiving a frame does not put C into the switch's dynamic table: the switch needs to see a frame with C as its source. The ARP reply is forwarded out of one port because the request has just taught the switch where A is.

Now clear the switch's dynamic entries while A retains B's mapping in its ARP cache. A can immediately construct a unicast Ethernet frame addressed to B, without sending ARP again. The switch has no destination entry for B, so it floods that **unknown unicast** to B's and C's eligible ports. B's reply teaches B's location again, after which the next request can use known-unicast forwarding.

:::trap Flooding does not rewrite the destination
An unknown-unicast frame keeps its original unicast destination MAC. Flooding describes the switch making copies, not the sender addressing a broadcast. In ordinary host operation, C rejects the copy addressed to B. Exclude the ingress port, other VLANs, down ports, and ports not forwarding for this VLAN when listing flood destinations.
:::

A single switch port can lead to many hosts. If B and C sit behind a second switch reached through `Fa0/24`, the first switch can learn both addresses on `Fa0/24`. That entry means “the path toward this address,” not “the address is physically plugged into this port.” If a frame arrives from that segment for another address already known through the same ingress port, the switch filters it instead of sending it back.

## Aging, static entries and the table commands

A table that only grew would fill with hosts that have left, so learned entries expire. A **dynamic** entry is learned from traffic and is removed when the switch has seen no frame from that source for the aging time, **300 seconds** by default. Each frame from the source resets its timer. Frames sent to a host do not, which is how a quiet host can drop out of the table while others keep sending to it; the next frame for it is then flooded until it speaks again.

Aging is not the only way an entry changes. A frame from the same source on a different port moves the entry at once, and a port going down removes the entries learned on it. A host that moves to another port is therefore relearned as soon as it sends a frame.

Examine the table from privileged EXEC mode. The first command displays all entries; the filtered commands answer narrower questions. Packet Tracer supports fewer filters than real IOS, so read the full table if one is missing.

```ios SW1
SW1# show mac address-table
SW1# show mac address-table dynamic
SW1# show mac address-table address 0050.56be.1a2b
SW1# show mac address-table interface fastethernet0/24
SW1# show mac address-table vlan 10
SW1# show mac address-table aging-time
```

A **static entry** explicitly associates an address and VLAN with an interface. It does not age like an ordinary dynamic entry and survives a dynamic-table clear. A static entry on the wrong port therefore keeps sending that host's traffic the wrong way until someone removes it. Ordinary hosts rely on dynamic learning; static entries are rare.

```ios SW1
SW1# configure terminal
SW1(config)# mac address-table aging-time 600
SW1(config)# mac address-table static 0050.56be.1a2b vlan 10 interface fastethernet0/5
SW1(config)# end
SW1# show mac address-table
```

The snippet demonstrates syntax, not a complete VLAN 10 topology. In the lab you will use the actual host MAC and the existing VLAN 1 ports, then remove the change. `clear mac address-table dynamic` removes learned entries; it does not remove a configured static entry. Use the matching `no mac address-table static ...` command for that configuration and verify the result before saving.

## Switching methods and domains

A switch can start sending a frame at two different moments. **Store-and-forward** switching receives the complete frame, checks the FCS, and only then forwards it, so a corrupted frame goes no further. **Cut-through** switching starts forwarding as soon as it has read the destination address, which is faster but passes on a damaged frame because the FCS has not arrived yet. An older compromise, **fragment-free**, waits for the first 64 bytes so that collision fragments are not forwarded. The Catalyst access switches in this course use store-and-forward.

Two counting questions follow from all this. A **collision domain** is a set of devices whose half-duplex transmissions can collide. Each switch port is its own collision domain; a hub and everything attached to it form one. Exam questions count one collision domain per switch port, even though a full-duplex link never has a collision.

A **broadcast domain** is the set of devices that receive one another's broadcasts. A switch does not divide it: all ports in one VLAN, across however many switches, form a single broadcast domain. Each VLAN is a separate broadcast domain, and so is each router interface. A router with two LAN interfaces separates two broadcast domains.

## Why VLANs and spanning tree exist

Flooding is what makes a switch work, and it is also its weakness: every broadcast reaches every port, and a loop keeps flooded frames alive. Two features contain it. A **VLAN** keeps a group of switch ports in its own logical Layer 2 domain, so a broadcast received in VLAN 10 is never flooded into VLAN 20. That is why the VLAN is part of every table entry and every lookup in this chapter. The same numerical MAC value can have separate forwarding entries in different VLANs.

Redundant Layer 2 paths create another problem. An ordinary Ethernet frame has no hop-count field equivalent to IP TTL to stop its circulation through a bridging loop. Flooded traffic can travel around the loop repeatedly, consume capacity, and make source locations appear to move between ports. **Spanning Tree Protocol** establishes a loop-free forwarding topology while retaining redundant physical links for recovery.

Spanning tree does this by blocking some ports, which is why a port that is up is not always a flood destination: a blocked port is excluded. Chapter 14 teaches the roles, states and convergence. For now, remember the symptom of a loop: the same MAC address keeps moving between ports in the table.

## Reading the output

Read the VLAN column first, then the MAC, entry type, and port. The output below is representative. PC-A is directly attached to `Fa0/1`; B and C are reached through the second switch on `Fa0/24`. Multiple distinct MACs on that uplink are expected.

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

To find a host, start at any switch and follow its MAC address. If the entry points to an uplink, log in to the switch at the other end and look again, until the entry points to an access port. If the host is missing from the table, check its link and VLAN, make it send traffic, and look again. If the entry points to a port you did not expect, check whether it is static and whether the host has moved.

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
