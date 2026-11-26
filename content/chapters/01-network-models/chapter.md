---
id: network-models
number: 1
title: Network models
subtitle: Use layers and addresses to follow one packet across a network.
part: foundations
domain: infra
minutes: { lesson: 40, lab: 30 }
summary: Name the OSI and TCP/IP layers and the data unit at each, explain encapsulation, and say what a MAC address, an IP address and a port each identify. Follow one ping from a PC through a switch and a router to another LAN, and say which addresses change at each hop.
sectionIds:
  "Where the layers live": where-the-layers-live-devices-and-commands
objectives:
  v1: ["1.1.a", "1.13.b", "1.13.d"]
  v2: ["2.4"]
prereqs: [start-here]
sources:
  - { title: "RFC 1122: Requirements for Internet Hosts, Communication Layers", url: "https://www.rfc-editor.org/rfc/rfc1122" }
  - { title: "RFC 826: An Ethernet Address Resolution Protocol", url: "https://www.rfc-editor.org/rfc/rfc826" }
  - { title: "RFC 791: Internet Protocol", url: "https://www.rfc-editor.org/rfc/rfc791" }
  - { title: "RFC 1812: Requirements for IP Version 4 Routers", url: "https://www.rfc-editor.org/rfc/rfc1812" }
  - { title: "Cisco: Understand the Ping and Traceroute Commands", url: "https://www.cisco.com/c/en/us/support/docs/ios-nx-os-software/ios-software-releases-121-mainline/12778-ping-traceroute.html" }
---

A user says the server is down. The cable could be unplugged, the PC could have the wrong gateway, or the server's application could have stopped: three different faults, one symptom. Network models divide communication into layers so that you can test one job at a time instead of guessing.

In Chapter 00 you pinged between two PCs on one switch. This chapter explains what happened inside that ping, then adds a router and follows one packet across two LANs. By the end you will be able to name the layers of both models and the data unit each one handles, say what a MAC address, an IP address and a port each identify, and say which addresses change as a router forwards a packet. This is a first map, not the full detail: Chapter 04 teaches IPv4 addressing and ARP, Chapter 07 Ethernet switching, Chapter 08 the IOS command line and Chapter 17 the routing table.

## Why we need a model

A **layer model** splits the job of communicating into smaller jobs stacked on top of each other. Each layer does one job and relies on the layer below it. An application produces the data. A transport protocol delivers it to the right program on the far computer. IP gets it across networks to that computer. A link technology such as Ethernet carries it across each single cable or radio link on the way.

A **protocol** is a set of rules that communicating systems follow. This chapter names a few before you study them: HTTP carries web requests and responses, DNS answers name lookups, and SSH provides a protected remote command line. Later chapters teach how each one works.

Layers let products from different vendors work together. An application does not need to know how Ethernet signals travel, and an Ethernet switch does not need to understand a web page to forward its frames. Real devices can work at several layers, so a layer number describes a job, not everything a device can do.

The models are also a troubleshooting map. Start from the symptom and pick a test that rules a layer in or out. If an interface reports no link, look at the cable and the port first. If a remote address answers a ping but its application does not respond, the lower layers carried that ping, so look next at the application.

## Seven layers, four layers, five PDUs

The **OSI reference model** has seven layers. Read this table from the top down to follow data toward the cable, or from the bottom up to follow received data toward an application.

| OSI layer | Main function | Useful example |
|---|---|---|
| 7 Application | Network services used by applications | HTTP, DNS, and SSH |
| 6 Presentation | Representation and transformation of data | Character encoding, compression, encryption functions |
| 5 Session | Establishing and managing a dialogue | Session establishment and coordination |
| 4 Transport | Communication between application endpoints | TCP and UDP; port numbers |
| 3 Network | Logical addressing and forwarding between networks | IPv4, IPv6, and routing |
| 2 Data link | Delivery across a local link | Ethernet frames and MAC addresses |
| 1 Physical | Transmission of signals | Copper electrical signals, optical signals, and radio |

The **TCP/IP model** groups these functions into four layers: **Application, Transport, Internet, and Link**. Its Application layer covers OSI Layers 5 to 7. Its Transport layer is OSI Layer 4, its Internet layer is OSI Layer 3, and its Link layer covers OSI Layers 1 and 2. Cisco material often calls the Link layer **Network Access**, and some texts split it in two to make a five-layer model.

The TCP/IP model describes the protocols that networks actually run. The OSI layer numbers are the vocabulary engineers speak, which is why a switch is called a Layer 2 device and a router a Layer 3 device.

A **bit** is a 0 or 1; a **byte**, also called an **octet**, is eight bits. An IPv4 address such as `192.168.10.10` writes four octets as decimal numbers. An Ethernet **MAC (Media Access Control) address** is six bytes, usually written in hexadecimal (digits `0–9` and letters `a–f`): `00:60:2f:3e:1b:22` and `0060.2f3e.1b22` are the same address. In this chapter you only need to match addresses; Chapter 04 teaches binary.

:::facts
- **PDU** means protocol data unit: the unit of data handled at a particular layer.
- The names are **data** at the upper layers, a TCP **segment** or UDP **datagram** at Layer 4, an IP **packet** at Layer 3, and an Ethernet **frame** at Layer 2.
- At Layer 1 the unit is **bits**, sent as electrical, optical or radio signals.
- Ethernet MAC addresses are 48 bits; IPv4 addresses are 32 bits; IPv6 addresses are 128 bits.
- TCP and UDP use 16-bit port numbers. A port identifies an application on a host; it is not a physical socket on a switch.
:::

**ICMP** carries IP control and test messages. Ping sends an ICMP Echo Request and gets back an Echo Reply. ICMP rides directly inside IP, with no TCP or UDP header, so ping uses no port numbers.

## Encapsulation and de-encapsulation

**Encapsulation** means each layer wraps the data from the layer above with its own header as the data moves down toward the cable. For a web request using TCP over IPv4 over Ethernet, the host puts the request in a TCP segment, puts the segment in an IPv4 packet, and puts the packet in an Ethernet frame. The frame goes onto the wire as bits. **De-encapsulation** is the reverse at the receiver: each layer reads and removes its own header and passes the rest up, until the application gets the data.

| Header information | What it identifies |
|---|---|
| TCP source and destination ports | The application on each host, such as a web server on port 443 |
| IPv4 source and destination addresses | The sending host and the final destination host, across any number of networks |
| Ethernet source and destination MAC addresses | The sender and the receiver on the current link only |
| Ethernet frame check sequence (FCS) | Nothing: it is a trailer that lets the receiver detect a corrupted frame |

So the three kinds of address answer three questions. A **MAC address** says which interface on this local link. An **IP address** says which host, anywhere across the networks. A **port** says which application on that host. Every header adds bytes that are not user data; Chapter 07 covers the Ethernet frame fields and size limits.

Notice that the table lists two destination addresses. The IP destination names the final host and stays the same for the whole journey. The MAC destination names only the next device on the current link, so each link on the path gets a fresh frame. That is how one IP packet can cross Ethernet, Wi-Fi and a provider's line on the same trip.

## Local or remote: the host's first decision

Before a host sends a packet it asks one question: is the destination on my own network? An IP network, or **subnet**, is a range of addresses whose devices share a LAN and reach each other directly. A **router** connects subnets and forwards packets between them. If the destination is in the host's own subnet, the host sends straight to it. If not, the host sends the packet to its **default gateway**, the router interface on its LAN. The host answers the question with its subnet mask.

Take PC-A, **192.168.10.10/24**. The `/24` is another way of writing the mask **255.255.255.0**: the first three numbers name the subnet, so PC-A's subnet is every address that begins 192.168.10. A destination of **192.168.10.20** is local. A destination of **192.168.20.20** is not, so PC-A sends it to its gateway, **192.168.10.1**. Chapter 04 teaches the calculation for other masks.

| Destination | Next device on the link | MAC address PC-A needs |
|---|---|---|
| 192.168.10.20 (local) | The destination host itself | MAC of 192.168.10.20 |
| 192.168.20.20 (remote) | Gateway 192.168.10.1 | MAC of 192.168.10.1 |

An Ethernet frame needs a destination MAC address, and **ARP** (Address Resolution Protocol) finds it. The host broadcasts an ARP request to **ff:ff:ff:ff:ff:ff**, asking in effect "who has 192.168.10.1?", and the owner of that address sends back a unicast reply with its MAC. The host keeps the answer in its **ARP cache**, so it does not ask again for every packet. For a remote destination, the host asks for the gateway's MAC, but the packet still carries the final destination IP, 192.168.20.20.

A **broadcast** reaches every device on one LAN, and that set of devices is a **broadcast domain**. Switches pass broadcasts on; routers do not. Each router interface starts a new broadcast domain, and an ARP request never leaves its LAN. When the router needs a MAC address on its other LAN, it sends its own ARP request there. Chapter 04 teaches ARP in full.

:::trap
The default gateway is used only for destinations outside the host's subnet. Two hosts in the same subnet talk directly, without the router. So a host with a missing or wrong gateway still reaches its local neighbors and fails only for remote networks.
:::

## The packet walk: PC-A to Server-B and back

Now follow one ping from PC-A to Server-B and back. R1 simply routes between its two LANs; nothing on the path filters or translates the traffic.

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
      "tags": { "PCA": "Off subnet → gateway 192.168.10.1", "SW1": "Forwards by MAC · changes nothing", "R1": "New frame out Gi0/1 · TTL − 1", "SW2": "Forwards within LAN-B" },
      "backTags": { "B": "Reply via gateway 192.168.20.1", "R1": "Routes the reply toward LAN-A" } }
  ] } }
```

| Interface | IPv4 address | Example MAC address |
|---|---|---|
| PC-A | 192.168.10.10/24; gateway 192.168.10.1 | 0060.2f3e.1b22 |
| R1 Gi0/0 | 192.168.10.1/24 | 0001.9641.7a01 |
| R1 Gi0/1 | 192.168.20.1/24 | 0001.9641.7a02 |
| Server-B | 192.168.20.20/24; gateway 192.168.20.1 | 00d0.ba2c.5e01 |

**1. PC-A sends to its gateway.** The destination is outside PC-A's subnet, so PC-A uses ARP to learn the MAC of 192.168.10.1 if it does not already have it. It sends a frame with source MAC **0060.2f3e.1b22** and destination MAC **0001.9641.7a01**. Inside, the IPv4 addresses are **192.168.10.10 → 192.168.20.20**.

**2. SW1 forwards the frame.** A switch reads only the Ethernet header. It looks up the destination MAC in its **MAC address table**, a list of which MAC addresses it has seen on which port, and sends the frame out of the port toward R1. SW1 changes nothing: the MAC addresses, the IP packet and its TTL pass through untouched. Chapter 07 teaches how the switch builds that table.

**3. R1 routes the packet.** The frame is addressed to R1's own MAC, so R1 accepts it, removes the Ethernet header and reads the IP packet. It looks up the destination, 192.168.20.20, in its **routing table**, its list of known subnets and the interface that leads to each, and finds that 192.168.20.0/24 is on Gi0/1. Chapter 17 teaches the routing table. R1 then subtracts one from the packet's **TTL** (Time to Live) and updates the IPv4 header checksum. TTL is a hop counter: a router that would reduce it to zero discards the packet, so a misrouted packet cannot circulate forever.

**4. R1 builds a new frame.** R1 uses ARP on LAN-B to learn Server-B's MAC if needed. The new frame has source MAC **0001.9641.7a02** and destination MAC **00d0.ba2c.5e01**. The IPv4 addresses are still **192.168.10.10 → 192.168.20.20**.

**5. Server-B replies.** SW2 forwards the frame to Server-B, which de-encapsulates it and finds an ICMP Echo Request for itself. Its reply is a new packet from **192.168.20.20** to **192.168.10.10**. That destination is remote to Server-B, so the reply goes to Server-B's own gateway, **192.168.20.1**, and R1 routes it back to LAN-A. A ping succeeds only if this reply returns, so the far host needs a working gateway too.

Here is the request on each side of R1:

| Link | Ethernet source → destination | IPv4 source → destination | TTL |
|---|---|---|---|
| LAN-A (PC-A to R1) | 0060.2f3e.1b22 → 0001.9641.7a01 | 192.168.10.10 → 192.168.20.20 | 128 |
| LAN-B (R1 to Server-B) | 0001.9641.7a02 → 00d0.ba2c.5e01 | 192.168.10.10 → 192.168.20.20 | 127 |

The MAC addresses change at the router; the IP addresses do not; the TTL drops by one. Packet Tracer PCs start the TTL at 128, so in the lab PC-A sees `TTL=127` on replies from the far LAN: one router subtracted one. Other operating systems start at other values.

## Where the layers live

The walk shows where each layer does its work.

| Device | Layers it uses to forward | Forwards by | What it changes |
|---|---|---|---|
| PC or server | All layers, 1 to 7 | It is an endpoint: it creates and receives the data | Builds and removes every header |
| Switch | Layers 1 and 2 | Destination MAC address | Nothing in the frame |
| Router | Layers 1 to 3 | Destination IP address | New frame for each link; TTL reduced by one |

Each forwarding decision uses a table, and later chapters teach each one. A switch's **MAC address table** maps MAC addresses to ports (Chapter 07). An **ARP cache** on a host or router maps local IP addresses to MAC addresses (Chapter 04). A router's **routing table** maps destination subnets to outgoing interfaces (Chapter 17). The lab's extension steps let you look at all three.

**Ping** tests the path there and back, because a reply must return. **Traceroute** lists the routers along a path by using TTL; Chapter 31 teaches it.

## Exam focus

- Name the seven OSI layers and the four TCP/IP layers, and map one onto the other.
- Use data, segment, datagram, packet, frame and bits for the right layer.
- Explain encapsulation and de-encapsulation.
- Say what a MAC address, an IP address and a port each identify.
- Name the layer at which a switch and a router forward, and what each changes.
- For a local or remote destination, say which MAC address the frame needs and which IP address the packet keeps.

You are ready for Chapter 02 when you can follow one ping across a router and name the MAC and IP addresses on each link. The next chapter puts these devices into larger network designs.
