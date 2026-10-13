---
id: network-models
number: 1
title: Network models
subtitle: Use layers, addresses, and device tables to follow traffic across a network.
part: foundations
domain: infra
minutes: { lesson: 55, lab: 45 }
summary: Explain OSI and TCP/IP functions, distinguish frames from packets, and trace an IPv4 exchange through switches and a router. Use ARP, interface status, and forwarding tables as evidence without overstating what they prove.
objectives:
  v1: ["1.1.a", "1.13.b", "1.13.d"]
  v2: ["2.4"]
prereqs: [start-here]
sources:
  - { title: "RFC 1122: Requirements for Internet Hosts, Communication Layers", url: "https://www.rfc-editor.org/rfc/rfc1122" }
  - { title: "RFC 826: An Ethernet Address Resolution Protocol", url: "https://www.rfc-editor.org/rfc/rfc826" }
  - { title: "RFC 791: Internet Protocol", url: "https://www.rfc-editor.org/rfc/rfc791" }
  - { title: "RFC 1812: Requirements for IP Version 4 Routers", url: "https://www.rfc-editor.org/rfc/rfc1812" }
  - { title: "Cisco: Local host routes installed in the routing table", url: "https://www.cisco.com/c/en/us/support/docs/ip/ip-routing/116264-technote-ios-00.html" }
  - { title: "Cisco: Understand the Ping and Traceroute Commands", url: "https://www.cisco.com/c/en/us/support/docs/ios-nx-os-software/ios-software-releases-121-mainline/12778-ping-traceroute.html" }
  - { title: "Cisco: Understand the Extended Ping and Extended Traceroute Commands", url: "https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html" }
---

When a user reports that a service is unavailable, several different failures can produce the same symptom. The cable might be disconnected, the host might have an incorrect gateway, or the application might not be listening. Network models give you a way to separate these functions and choose useful tests.

This chapter follows an IPv4 packet across two Ethernet LANs. The aim is to understand which addresses each device uses, which fields change at a router, and what you can learn from the device tables. Detailed subnet calculations, TCP behavior, and switch learning follow in later chapters.

The lab supplies router addresses and their commands as setup for observing traffic. You are not yet expected to design subnets or reproduce that setup from memory; Chapter 04 teaches addressing and Chapter 08 extends the IOS workflow.

## Why we need a model

A **layer model** organizes communication into related functions. Applications exchange meaningful data; transport protocols provide services to applications; IP addresses and routes support delivery between networks; link technologies carry data across each local connection.

A **protocol** is a set of rules that communicating systems follow. The examples below name several protocols before studying their details: HTTP carries web requests and responses, DNS answers name lookups, and SSH provides a protected remote command-line session. Here, identify each function and the information it uses; the later service chapters teach configuration and diagnosis.

This separation supports interoperability. An application does not need to implement Ethernet signaling, and an Ethernet switch does not need to understand the contents of a web page to forward its frames. Real devices can perform functions at several layers, so a layer number describes a function rather than everything a device can do.

The models are also a troubleshooting framework. Begin with the symptom and select a test that narrows the possibilities. If an interface reports no operational link, physical connectivity deserves attention. If a remote IP address responds to ping but its application does not work, examine the application and relevant transport or policy behavior. The successful ping is useful evidence about that exchange; it does not establish that all Layer 1–3 conditions are correct for every kind of traffic.

For the CCNA, use the models to explain forwarding and interpret evidence. Memorizing the layer names is a starting point. Being able to distinguish a MAC address lookup from an IP route lookup is the more useful skill.

## Seven layers, four layers, five PDUs

The **OSI reference model** has seven layers. Read this table from the top down to follow data toward the medium, or from the bottom up to follow received data toward an application.

| OSI layer | Main function | Useful example |
|---|---|---|
| 7 Application | Network services used by applications | HTTP, DNS, and SSH |
| 6 Presentation | Representation and transformation of data | Character encoding, compression, encryption functions |
| 5 Session | Establishing and managing a dialogue | Session establishment and coordination |
| 4 Transport | Communication between application endpoints | TCP and UDP; port numbers |
| 3 Network | Logical addressing and forwarding between networks | IPv4, IPv6, and routing |
| 2 Data link | Delivery across a local link | Ethernet frames and MAC addresses |
| 1 Physical | Transmission of signals | Copper electrical signals, optical signals, and radio |

The **TCP/IP model** groups these functions into four layers: **Application, Transport, Internet, and Link**. Its Application layer includes functions discussed across the upper three OSI layers. Its Internet layer corresponds broadly to OSI Layer 3, and its Link layer includes data-link and physical functions. Some teaching materials split Link into two layers and call this a five-layer model.

These are ways of describing functions, not competing packet formats. For example, encryption can be discussed as a presentation function, but that does not mean every encrypted protocol exists exclusively at OSI Layer 6. Modern protocol implementations do not always fit a single neat box.

Read the size units literally: a **bit** is a 0 or 1; a **byte**, also called an **octet** here, contains eight bits. An IPv4 address such as `192.168.10.10` writes four octets as decimal numbers. An Ethernet **MAC (Media Access Control) address** names an interface on the local Ethernet link and is usually written in hexadecimal: digits `0–9` and letters `a–f`. For example, `00:60:2f:3e:1b:22` and `0060.2f3e.1b22` display the same six bytes. You only need to match the addresses in this chapter; binary conversion is developed in Chapter 04.

:::facts
- **PDU** means protocol data unit: the unit handled by a protocol at a particular layer.
- Common teaching names are **data** at the upper layers, a TCP **segment** or UDP **datagram** at Layer 4, an IP **packet** at Layer 3, and an Ethernet **frame** at Layer 2.
- Physical interfaces represent bits using signals. “Bits” describes the information, not a particular voltage or optical encoding.
- Ethernet MAC addresses are 48 bits; IPv4 addresses are 32 bits; IPv6 addresses are 128 bits.
- TCP and UDP use 16-bit port fields. A port identifies a transport endpoint; it is not a physical switch socket.
:::

**ICMP** carries IP control and diagnostic messages. IPv4 ping uses ICMP Echo Request and Echo Reply messages carried directly in IPv4, without a TCP or UDP header. An ARP exchange on Ethernet is also not a TCP or UDP conversation, and ARP is not carried inside an IPv4 packet.

## Encapsulation and de-encapsulation

**Encapsulation** adds the information needed by each protocol as data moves toward the medium. For an application exchange using TCP over IPv4 over Ethernet, the host creates a TCP segment, places it inside an IPv4 packet, and carries that packet inside an Ethernet frame. The receiving endpoint interprets and removes the corresponding encapsulation to deliver the data to the appropriate application.

| Protocol information | Purpose in this example |
|---|---|
| TCP source and destination ports | Identify the application endpoints of the transport exchange. |
| IPv4 source and destination addresses | Identify the IP endpoints of the packet. |
| Ethernet source and destination MAC addresses | Identify sender and intended receiver on the current Ethernet link. |
| Ethernet frame check sequence (FCS) | Detect corruption of the received frame; it does not repair the data. |

A minimum IPv4 header is **20 bytes**, and a minimum TCP header is **20 bytes**; options can make either larger. UDP has an **8-byte header**. Recognize that headers add overhead, but do not treat these minimums as the length of every observed header.

For ordinary Ethernet without VLAN tags, the MAC frame from destination address through FCS is normally **64–1518 bytes**, with up to **1500 bytes** of payload. VLAN tags and other supported frame formats affect frame length. The preamble and interframe gap are not part of that 64–1518-byte count. **MTU** refers to the maximum network-layer packet size carried by the link in this context, not to every byte transmitted on the medium. Frame details are developed in Chapter 07.

A host delivering an IPv4 packet to another subnet does not put the remote host's MAC address into the local frame. It uses a reachable **next hop** on its own link. The distinction between the packet's destination and the frame's destination explains why the same IP packet can cross several different link technologies.

## Local or remote: the host's first decision

A host uses its routing information to choose how to send a packet. In our introductory topology, each PC has one interface, one connected subnet, and a default gateway, with no additional routes. Under those conditions, the subnet mask determines whether the destination belongs to the connected subnet. Later routing chapters extend this decision to more-specific routes.

For **192.168.10.10/24**, the mask is **255.255.255.0** and the connected subnet is **192.168.10.0/24**. A destination of **192.168.10.20** is local. A destination of **192.168.20.20** is outside that subnet and is sent toward the configured gateway, **192.168.10.1**.

| Destination in this topology | IP next hop | MAC address needed before sending the IPv4 frame |
|---|---|---|
| 192.168.10.20 | The destination host itself | MAC for 192.168.10.20 |
| 192.168.20.20 | Gateway 192.168.10.1 | MAC for 192.168.10.1 |

**ARP**, Address Resolution Protocol, resolves the IPv4 address of a next hop to a MAC address on an Ethernet LAN. A host first checks its ARP cache. If it lacks a usable mapping, it normally sends an ARP request to the Ethernet broadcast address, **ff:ff:ff:ff:ff:ff**. The request names the IPv4 address being resolved. A normal solicited reply is sent back to the requester as a unicast frame.

**Unicast** addresses one interface; an Ethernet **broadcast** addresses the devices in the local **broadcast domain**, the part of the network over which that broadcast can be forwarded. A **VLAN (virtual LAN)** creates such a logical Layer 2 network on switches. The introductory labs leave all used switch ports in their default VLAN 1. Separate switches connected through a router still form separate LANs; sharing the number 1 does not join them across the router. Chapter 07 develops the switching decisions, and Chapter 09 teaches VLAN configuration.

For the remote destination above, the request asks for **192.168.10.1**, not 192.168.20.20. The subsequent IPv4 packet still has destination **192.168.20.20**. Learning the gateway's MAC address does not change the final IP destination.

ARP requests remain within the local Layer 2 broadcast domain. A switch floods a broadcast to eligible forwarding ports in the same VLAN, excluding the receiving port. A router does not route that Ethernet broadcast into the next subnet. Its outgoing interface can perform a separate ARP exchange when it needs a next-hop mapping there.

:::trap
A default gateway is used when the selected route requires it. Two hosts in the same correctly configured subnet can communicate directly without sending their traffic through a router. Conversely, a host can reach local neighbors while failing to reach remote networks because its gateway is missing or incorrect.
:::

An incorrect mask can make the host choose the wrong next hop. Features such as **proxy ARP**, where a router answers certain ARP requests on another host's behalf, can sometimes conceal an addressing error. Do not use one successful ping as proof that the configured mask is correct. Read the actual settings and compare them with the addressing plan. Proxy ARP configuration and platform defaults are not memorization targets for this chapter.

## The packet walk: PC-A to Server-B and back

Use the following topology throughout the example. Both router interfaces are operational, both connected routes exist, and no NAT, filtering, tunneling, or fragmentation affects the exchange. PC-A and Server-B have the gateways shown.

```diagram
{ "type": "topology", "title": "One routed IPv4 exchange",
  "caption": "The switches forward within their LANs. R1 routes between 192.168.10.0/24 and 192.168.20.0/24.",
  "nodes": [
    { "id": "PCA", "kind": "pc", "label": "PC-A", "sub": "192.168.10.10/24", "x": 1, "y": 3 },
    { "id": "SW1", "kind": "switch", "label": "SW1", "x": 3.5, "y": 3 },
    { "id": "R1", "kind": "router", "label": "R1", "sub": "Gi0/0: .10.1 · Gi0/1: .20.1", "x": 6, "y": 3, "highlight": true },
    { "id": "SW2", "kind": "switch", "label": "SW2", "x": 8.5, "y": 3 },
    { "id": "B", "kind": "server", "label": "Server-B", "sub": "192.168.20.20/24", "x": 11, "y": 3 }
  ],
  "links": [
    { "from": "PCA", "to": "SW1" },
    { "from": "SW1", "to": "R1", "toLabel": "Gi0/0" },
    { "from": "R1", "to": "SW2", "fromLabel": "Gi0/1" },
    { "from": "SW2", "to": "B" }
  ],
  "trace": { "flows": [
    { "path": ["PCA", "SW1", "R1", "SW2", "B"], "label": "ICMP Echo Request", "back": true,
      "tags": { "PCA": "Off subnet → gateway 192.168.10.1", "SW1": "dst 0001.9641.7a01 → Fa0/24", "R1": "New frame out Gi0/1 · TTL − 1", "SW2": "Forwards within LAN-B" },
      "backTags": { "B": "Reply via gateway 192.168.20.1", "R1": "Routes the reply toward LAN-A" } }
  ] } }
```

| Interface | IPv4 address | Illustrative MAC address |
|---|---|---|
| PC-A | 192.168.10.10/24; gateway 192.168.10.1 | 0060.2f3e.1b22 |
| R1 Gi0/0 | 192.168.10.1/24 | 0001.9641.7a01 |
| R1 Gi0/1 | 192.168.20.1/24 | 0001.9641.7a02 |
| Server-B | 192.168.20.20/24; gateway 192.168.20.1 | 00d0.ba2c.5e01 |

**1. PC-A selects its next hop.** The destination is outside its connected /24, so PC-A uses its default gateway. If necessary, it resolves 192.168.10.1 through ARP. It then sends an Ethernet frame with source MAC **0060.2f3e.1b22** and destination MAC **0001.9641.7a01**. Inside that frame, the IPv4 addresses are **192.168.10.10 → 192.168.20.20**.

**2. SW1 forwards the frame.** It learns the source MAC against the incoming port and VLAN, and looks up the destination MAC in that VLAN's table. If the gateway's MAC is known on the router-facing forwarding port, SW1 sends the frame there. If it is unknown, SW1 floods it to eligible ports in that VLAN except the incoming port. Ordinary Layer 2 forwarding preserves the source and destination MAC addresses and does not decrement the packet's TTL.

**3. R1 routes the packet.** The frame is addressed to R1's receiving interface. R1 processes the contained IPv4 packet and selects a route for **192.168.20.20**. In this example the destination is on the subnet directly connected to Gi0/1. Normal forwarding decrements **TTL**, the IPv4 Time to Live field, by one and updates the IPv4 header checksum. If forwarding would exhaust TTL, the router discards the packet and normally generates an ICMP Time Exceeded message, subject to the rules and limits for ICMP responses.

**4. R1 builds the outgoing frame.** It resolves Server-B's MAC on LAN-B if needed. The new frame has source MAC **0001.9641.7a02** and destination MAC **00d0.ba2c.5e01**. The source and destination IPv4 addresses remain **192.168.10.10 → 192.168.20.20** under our stated assumptions. The outgoing frame has an FCS for its own contents.

**5. Server-B receives the request and sends a reply.** SW2 forwards the frame within LAN-B. Server-B recognizes its own destination addresses and processes the ICMP Echo Request. The reply is a new packet with source **192.168.20.20** and destination **192.168.10.10**. Because that destination is remote to Server-B, its reply uses gateway **192.168.20.1**. R1 then routes the reply toward LAN-A.

The reply has its own initial TTL. A ping display usually reports the TTL of the received reply, not the original request's remaining TTL. Initial values vary. You can calculate a hop count from a received TTL only when you know the starting value and the relevant forwarding assumptions; do not infer an exact path from a guessed operating-system default.

## Where the layers live: devices and commands

Keep three tables distinct:

| Table | Main relationship | What it helps decide |
|---|---|---|
| IP routing table | Destination prefix to a forwarding action, interface, and possibly next hop | Where to send an IP packet |
| ARP cache | IPv4 address to MAC address on a local link | How to address an Ethernet frame to the selected IPv4 next hop |
| Switch MAC address table | VLAN and MAC address to switch port | Where to forward a frame inside a VLAN |

These tables have different contents and learning mechanisms. A learned MAC entry does not prove that the host has the right IP address. An ARP entry does not prove that a TCP service works. A route does not, by itself, prove that the next-hop link is operational or that return traffic is permitted.

Useful IOS commands include `show ip interface brief`, `show interfaces GigabitEthernet0/0`, `show ip route`, `show arp`, and `show mac address-table`. On a Windows PC or the Packet Tracer PC command prompt, `arp -a` displays the ARP cache. Command availability and output vary by platform.

For this lab, read only the directly connected routes and the router's own addresses. A **prefix** describes an address range; here `/24` corresponds to mask `255.255.255.0`, while `/32` identifies exactly one address. This representative excerpt shows how the configured router interfaces produce those entries:

```output R1# show ip route — abbreviated teaching example
C  192.168.10.0/24 is directly connected, GigabitEthernet0/0  ← LAN-A subnet
L  192.168.10.1/32 is directly connected, GigabitEthernet0/0  ← R1's own LAN-A address
C  192.168.20.0/24 is directly connected, GigabitEthernet0/1  ← LAN-B subnet
L  192.168.20.1/32 is directly connected, GigabitEthernet0/1  ← R1's own LAN-B address
```

`C` identifies a connected subnet; `L`, on images that display it, identifies an address belonging to the router itself. A request to Server-B `192.168.20.20` uses the LAN-B connected route; the lab uses PC-B for this same destination-host role. A request to `192.168.20.1` is for R1 itself. The `L` entry does not change the LAN's mask to /32. Chapter 17 extends this reading to choosing among routes learned in different ways.

Use **ping** for an ICMP reachability test. Use **traceroute** on IOS, or **tracert** on Windows, to collect responses from probes with increasing TTL values. Implementations use different probe types, and intermediate devices may filter or rate-limit replies. A missing traceroute response does not by itself prove that the device cannot forward traffic, and the displayed forward path does not establish the return path.

## Reading the output

These excerpts are illustrative and use the MAC addresses from the example.

```output SW1: show mac address-table
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0060.2f3e.1b22    DYNAMIC     Fa0/1   ← Frames with this source MAC were learned on Fa0/1 in VLAN 1.
   1    0001.9641.7a01    DYNAMIC     Fa0/24  ← The gateway MAC is reachable through the router-facing port.
```

For a known unicast addressed to 0001.9641.7a01 in VLAN 1, SW1 selects Fa0/24 if that port is eligible to forward. The destination IP can be remote; this ordinary Layer 2 decision uses the destination MAC and VLAN.

```output R1: show arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.10.1            -   0001.9641.7a01  ARPA   GigabitEthernet0/0
Internet  192.168.10.10           2   0060.2f3e.1b22  ARPA   GigabitEthernet0/0
Internet  192.168.20.1            -   0001.9641.7a02  ARPA   GigabitEthernet0/1
Internet  192.168.20.20           1   00d0.ba2c.5e01  ARPA   GigabitEthernet0/1
```

In this known configuration, the .1 entries correspond to R1's own interfaces. The numbered ages belong to dynamically learned neighbor entries. A dash in the Age field alone is not enough to distinguish every possible static or local entry; use the address and configuration as well. ARP entries can age out, so a missing entry alone does not prove that communication never occurred.

After a failed remote ping, first compare the hosts' addresses, masks, and gateways with the plan. Inspect interface states and the relevant connected routes. Then examine ARP and MAC learning on the path. This sequence is a practical starting point, not a requirement to run every command regardless of the evidence.

## Exam focus

- Explain the functions of OSI and TCP/IP layers and use frame, packet, segment, and datagram accurately.
- Identify the IP next hop and the MAC address needed for a local or remote destination.
- Explain why ARP for a remote destination normally resolves the local gateway, while the packet keeps the remote destination IP.
- Distinguish source-MAC learning and destination-MAC lookup from IP route selection.
- Describe the new Ethernet frame, TTL decrement, and IPv4 checksum update at a router.
- Account for the return path and its gateway when investigating a failed exchange.
- Interpret ping, traceroute, interface status, ARP, and MAC-table evidence within the limits of each test.

You are ready for Chapter 02 when you can follow a local and a routed request, name the relevant MAC/IP addresses, and explain the return path. The next chapter puts those forwarding functions into device roles and larger network designs.
