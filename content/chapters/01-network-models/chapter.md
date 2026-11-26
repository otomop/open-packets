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

A user says the server is down. The cable could be unplugged, the PC could have the wrong gateway, or the server's application could have stopped: three different faults, one symptom. Network models divide communication into layers so that you can test one job at a time instead of guessing.

In Chapter 00 you pinged between two PCs on one switch. This chapter explains what happened inside that ping, then adds a router and follows one IPv4 packet across two LANs. By the end you will be able to name the layers and the data unit each one handles, say which MAC and IP addresses a frame carries on each link, explain what a router changes as it forwards a packet, and read the three tables (ARP, MAC address and routing) that record those decisions. The lab supplies the router commands; Chapter 04 teaches addressing and Chapter 08 the full IOS workflow.

## Why we need a model

A **layer model** splits the job of communicating into smaller jobs stacked on top of each other. Each layer does one job and relies on the layer below it. An application produces the data. A transport protocol delivers it to the right program on the far computer. IP gets it across networks to that computer. A link technology such as Ethernet carries it across each single cable or radio link on the way.

A **protocol** is a set of rules that communicating systems follow. The examples below name several protocols before studying their details: HTTP carries web requests and responses, DNS answers name lookups, and SSH provides a protected remote command-line session. Here, identify each function and the information it uses; the later service chapters teach configuration and diagnosis.

This separation supports interoperability. An application does not need to implement Ethernet signaling, and an Ethernet switch does not need to understand the contents of a web page to forward its frames. Real devices can perform functions at several layers, so a layer number describes a function rather than everything a device can do.

The models are also a troubleshooting map. Start from the symptom and pick a test that rules a layer in or out. If an interface reports no link, look at the cable and the port before anything else. If a remote address answers a ping but its application does not respond, the lower layers carried that ping, so look next at the application and at anything that filters traffic.

For the CCNA, memorizing the layer names is only the start. The skill that earns marks is telling apart the decision a switch makes about a frame from the decision a router makes about a packet. The rest of this chapter builds up to that.

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

The **TCP/IP model** groups these functions into four layers: **Application, Transport, Internet, and Link**. Its Application layer includes functions discussed across the upper three OSI layers. Its Internet layer corresponds broadly to OSI Layer 3, and its Link layer includes data-link and physical functions. Cisco material often calls the Link layer **Network Access**, and some texts split it in two to make a five-layer model.

The TCP/IP model describes the protocols that networks actually run. The OSI layer numbers are the vocabulary engineers speak, which is why a switch is called a Layer 2 device and a router a Layer 3 device. Both models describe jobs, and real protocols do not always fit one box: encryption is a presentation-layer job, yet it is built into protocols at several layers.

Read the size units literally: a **bit** is a 0 or 1; a **byte**, also called an **octet** here, contains eight bits. An IPv4 address such as `192.168.10.10` writes four octets as decimal numbers. An Ethernet **MAC (Media Access Control) address** names an interface on the local Ethernet link and is usually written in hexadecimal: digits `0–9` and letters `a–f`. For example, `00:60:2f:3e:1b:22` and `0060.2f3e.1b22` display the same six bytes. You only need to match the addresses in this chapter; binary conversion is developed in Chapter 04.

:::facts
- **PDU** means protocol data unit: the unit handled by a protocol at a particular layer.
- Common teaching names are **data** at the upper layers, a TCP **segment** or UDP **datagram** at Layer 4, an IP **packet** at Layer 3, and an Ethernet **frame** at Layer 2.
- At Layer 1 the unit is **bits**, sent as electrical, optical or radio signals.
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

A minimum IPv4 header is **20 bytes**, and a minimum TCP header is **20 bytes**; options can make either larger. UDP has an **8-byte header**. Every header is overhead: bytes on the wire that are not the user's data.

A standard Ethernet frame is **64 to 1518 bytes** long, counted from the destination MAC address to the FCS, and carries up to **1500 bytes** of payload. That 1500-byte limit is the link's **MTU** (maximum transmission unit): the largest IP packet one frame can carry. Chapter 07 covers the frame fields and the effect of VLAN tags.

Notice that the table lists two destination addresses. The IP address names the final destination and stays the same for the whole journey. The MAC address names only the next device on the current link, so each link on the path gets a fresh frame. That is how one IP packet can cross Ethernet, Wi-Fi and a provider's line on the same trip. The next section shows how a host chooses that next device.

## Local or remote: the host's first decision

Before a host sends any packet it asks one question: is the destination on my own network? An IP network, or **subnet**, is a range of addresses whose devices share a LAN and can reach each other directly. A **router** connects subnets and forwards packets between them. If the destination is in the host's own subnet, the host delivers the packet itself. If it is not, the host hands the packet to its **default gateway**, the router interface on its LAN. Whichever device receives the frame next is called the **next hop**. The host answers the question with its subnet mask.

Take PC-A, **192.168.10.10/24**. The `/24` is another way of writing the mask **255.255.255.0**: the first three numbers name the subnet, so PC-A's subnet is every address that begins 192.168.10. A destination of **192.168.10.20** is local. A destination of **192.168.20.20** is outside that subnet, so PC-A sends it toward its gateway, **192.168.10.1**. Chapter 04 teaches the calculation for other masks.

| Destination in this topology | IP next hop | MAC address needed before sending the IPv4 frame |
|---|---|---|
| 192.168.10.20 | The destination host itself | MAC for 192.168.10.20 |
| 192.168.20.20 | Gateway 192.168.10.1 | MAC for 192.168.10.1 |

The host now knows the next hop's IP address, but an Ethernet frame needs a destination MAC address. **ARP**, the Address Resolution Protocol, finds it. The host first looks in its **ARP cache** (also called the ARP table), a list of IP-to-MAC mappings it has already learned. If the address is not there, the host sends an ARP request to the Ethernet broadcast address, **ff:ff:ff:ff:ff:ff**, asking in effect "who has 192.168.10.1?" Every device on the LAN receives the request. Only the owner of that IP address answers, with a unicast reply that carries its MAC address. The host stores the answer and sends the waiting packet.

A **unicast** frame is addressed to one interface. A **broadcast** frame is addressed to every device in the **broadcast domain**: the set of devices that a broadcast reaches, which is one LAN. Switches forward broadcasts and routers do not, so each router interface starts a new broadcast domain. Switch output also labels each LAN with a **VLAN** (virtual LAN) number. Every port in these early labs is in the default, VLAN 1. Chapter 07 develops the switching decisions, and Chapter 09 shows how one switch can hold several VLANs.

For the remote destination above, the request asks for **192.168.10.1**, not 192.168.20.20. The subsequent IPv4 packet still has destination **192.168.20.20**. Learning the gateway's MAC address does not change the final IP destination.

An ARP request never leaves its LAN. A switch **floods** it: it sends a copy out of every other port in the same VLAN. The router receives the request but does not pass it on to the next subnet. When the router needs a MAC address on that other LAN, it sends an ARP request of its own there.

:::trap
The default gateway is used only for destinations outside the host's subnet. Two hosts in the same subnet talk directly, without the router. So a host with a missing or wrong gateway still reaches its local neighbors and fails only for remote networks.
:::

A wrong mask makes the host give the wrong answer to the local-or-remote question, so it picks the wrong next hop. When a remote ping fails, read the host's address, mask and gateway and compare them with the plan. Chapter 04 returns to this fault and to **proxy ARP**, a router feature that can hide it.

## The packet walk: PC-A to Server-B and back

Now follow one ping from PC-A to Server-B and back. R1 simply routes between its two LANs; nothing on the path filters or translates the traffic. PC-A and Server-B have the gateways shown.

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

**2. SW1 forwards the frame.** A switch keeps a **MAC address table**: a list of which MAC address it has seen on which port. SW1 first records the frame's source MAC against the port it arrived on. Then it looks up the destination MAC. If the table shows that MAC on the port facing R1, SW1 sends the frame out of that port only. If the MAC is not in the table yet, SW1 floods the frame out of every other port. Either way SW1 changes nothing: the MAC addresses and the IP packet inside, including its TTL, pass through untouched.

**3. R1 routes the packet.** The frame is addressed to R1's own MAC, so R1 accepts it, removes the Ethernet header and reads the IP packet inside. It looks up the destination, **192.168.20.20**, in its **routing table**: its list of known subnets and the interface that leads to each. The table says that 192.168.20.0/24 is directly connected to Gi0/1. Before forwarding, R1 subtracts one from the packet's **TTL** (Time to Live) and recalculates the IPv4 header checksum. TTL is a hop counter that stops a misrouted packet from circulating forever: a router that would reduce it to zero discards the packet and sends an ICMP Time Exceeded message back to the source.

**4. R1 builds the outgoing frame.** It resolves Server-B's MAC on LAN-B if needed. The new frame has source MAC **0001.9641.7a02** and destination MAC **00d0.ba2c.5e01**. The source and destination IPv4 addresses are still **192.168.10.10 → 192.168.20.20**. Only the frame around the packet is new, with its own FCS.

**5. Server-B receives the request and sends a reply.** SW2 forwards the frame within LAN-B. Server-B recognizes its own destination addresses and processes the ICMP Echo Request. The reply is a new packet with source **192.168.20.20** and destination **192.168.10.10**. Because that destination is remote to Server-B, its reply uses gateway **192.168.20.1**. R1 then routes the reply toward LAN-A.

The reply is a new packet with its own starting TTL, and that is the TTL a ping display reports. Packet Tracer PCs start at 128, so in the lab PC-A sees `TTL=127` on replies from the far LAN: one router subtracted one. Starting values differ between operating systems, so you can count hops from a TTL only when you know where it started.

## Where the layers live: devices and commands

The walk shows where each layer does its work. PC-A and Server-B are the only devices that handle every layer, from the application down to the cable. SW1 and SW2 read only the Ethernet header: a switch is a **Layer 2** device and forwards by MAC address. R1 reads one layer further: a router is a **Layer 3** device. It forwards by IP address and builds a new frame for each link. That gives three tables to keep distinct:

| Table | Main relationship | What it helps decide |
|---|---|---|
| IP routing table | Destination prefix to a forwarding action, interface, and possibly next hop | Where to send an IP packet |
| ARP cache | IPv4 address to MAC address on a local link | How to address an Ethernet frame to the selected IPv4 next hop |
| Switch MAC address table | VLAN and MAC address to switch port | Where to forward a frame inside a VLAN |

Each table answers only its own question. A MAC table entry shows where a device is plugged in, not whether its IP settings are right. An ARP entry shows that a neighbor answered, not that its application works. A route shows where a packet will be sent, not that a reply can come back.

Each table has its own command. On a router, `show ip route` displays the routing table and `show arp` the ARP table. On a switch, `show mac address-table` displays the MAC address table. On a Windows PC or a Packet Tracer PC, `arp -a` displays the ARP cache. `show ip interface brief`, from Chapter 00, remains the quick check of a router's interface addresses and states.

R1 needs no routing configuration to know its two LANs. Giving an interface an address and enabling it puts that subnet into the routing table as a **connected** route. In the output, a **prefix** such as `192.168.10.0/24` names a range of addresses, and `/32` names exactly one address:

```output R1# show ip route — abbreviated teaching example
C  192.168.10.0/24 is directly connected, GigabitEthernet0/0  ← LAN-A subnet
L  192.168.10.1/32 is directly connected, GigabitEthernet0/0  ← R1's own LAN-A address
C  192.168.20.0/24 is directly connected, GigabitEthernet0/1  ← LAN-B subnet
L  192.168.20.1/32 is directly connected, GigabitEthernet0/1  ← R1's own LAN-B address
```

`C` marks a connected subnet and `L` marks one of the router's own addresses. A packet for Server-B, `192.168.20.20`, matches the LAN-B connected route and is forwarded out of Gi0/1. A packet for `192.168.20.1` matches an `L` entry: it is for R1 itself. Chapter 17 extends this to routes learned in other ways.

Two tests use what you have just learned. **ping** sends ICMP Echo Requests and reports the replies, so it tests the path there and back. **traceroute** on IOS, or **tracert** on Windows, lists the routers along the path by using TTL. Its first probe has a TTL of 1, so the first router discards it and returns ICMP Time Exceeded, which reveals that router's address. The next probe has a TTL of 2 and reaches the second router, and so on until the destination answers. A row of `* * *` means that hop sent no answer. Routers are often configured not to answer, so it does not prove that the path stops there.

## Reading the output

These excerpts are illustrative and use the MAC addresses from the example.

```output SW1: show mac address-table
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0060.2f3e.1b22    DYNAMIC     Fa0/1   ← Frames with this source MAC were learned on Fa0/1 in VLAN 1.
   1    0001.9641.7a01    DYNAMIC     Fa0/24  ← The gateway MAC is reachable through the router-facing port.
```

A frame for 0001.9641.7a01 leaves through Fa0/24. SW1 makes that decision from the destination MAC alone; it does not matter that the IP packet inside is addressed to another network.

```output R1: show arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.10.1            -   0001.9641.7a01  ARPA   GigabitEthernet0/0
Internet  192.168.10.10           2   0060.2f3e.1b22  ARPA   GigabitEthernet0/0
Internet  192.168.20.1            -   0001.9641.7a02  ARPA   GigabitEthernet0/1
Internet  192.168.20.20           1   00d0.ba2c.5e01  ARPA   GigabitEthernet0/1
```

The two `.1` entries with a dash for an age are R1's own interfaces. The entries with an age in minutes were learned from ARP. Learned entries expire when they are not used, so a missing entry means only that the two devices have not talked recently.

After a failed remote ping, work in this order. Compare both hosts' addresses, masks and gateways with the plan. Check the router's interface states and connected routes. Then look at the ARP and MAC tables along the path. Check both hosts, because the reply has to find its way back.

## Exam focus

- Explain the functions of OSI and TCP/IP layers and use frame, packet, segment, and datagram accurately.
- Identify the IP next hop and the MAC address needed for a local or remote destination.
- Explain why ARP for a remote destination normally resolves the local gateway, while the packet keeps the remote destination IP.
- Distinguish source-MAC learning and destination-MAC lookup from IP route selection.
- Describe the new Ethernet frame, TTL decrement, and IPv4 checksum update at a router.
- Account for the return path and its gateway when investigating a failed exchange.
- Interpret ping, traceroute, interface status, ARP, and MAC-table evidence within the limits of each test.

You are ready for Chapter 02 when you can follow a local and a routed request, name the relevant MAC/IP addresses, and explain the return path. The next chapter puts those forwarding functions into device roles and larger network designs.
