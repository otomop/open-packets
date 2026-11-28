---
id: components-and-topologies
number: 2
title: "Components & topologies"
subtitle: Understand the equipment in a network and follow traffic through a small office, a campus, and a data center.
part: foundations
domain: infra
minutes: { lesson: 55, lab: 35 }
summary: Learn what switches, routers, firewalls, access points, controllers, endpoints, and servers do. Compare common network designs and check the power and connectivity a device needs.
objectives:
  v1: ["1.1", "1.1.a", "1.1.b", "1.1.c", "1.1.d", "1.1.e", "1.1.f", "1.1.g", "1.1.h", "1.2", "1.2.a", "1.2.b", "1.2.c", "1.2.d", "1.2.e", "1.2.f"]
  v2: []
prereqs: [network-models]
sources:
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: Announced CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: Network switching and routing roles", url: "https://www.cisco.com/site/us/en/learn/topics/networking/what-is-network-switching.html" }
  - { title: "Cisco: Next-generation firewalls", url: "https://www.cisco.com/site/us/en/learn/topics/security/what-is-a-next-generation-firewall.html" }
  - { title: "Cisco: Wireless access points", url: "https://www.cisco.com/site/us/en/learn/topics/small-business/what-is-an-access-point.html" }
  - { title: "Cisco: Wireless controller and FlexConnect forwarding", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-7/config-guide/b_cg87/m_flexconnect_overview.html" }
  - { title: "Cisco: Catalyst Center, formerly Cisco DNA Center", url: "https://www.cisco.com/c/en/us/products/collateral/cloud-systems-management/dna-center/nb-06-dna-center-data-sheet-cte-en.html" }
  - { title: "Cisco: Campus LAN and wireless LAN design guide", url: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-campus-lan-wlan-design-guide.html" }
  - { title: "Cisco: Spine-leaf fabric design fundamentals", url: "https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/cisco-vxlan-bgp-evpn-design-and-implementation-guide.html" }
  - { title: "Cisco: PoE types and power limits", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/infra/poe/poe-configuration-guide/g-poe/c-poe.html" }
  - { title: "Cisco: Catalyst 9300 PoE operation and verification", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/int_hw/b_1718_int_and_hw_9300_cg/configuring_poe.pdf" }
  - { title: "Cisco: Catalyst interface configuration and monitoring", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swint.html" }
  - { title: "NIST SP 800-145: Cloud computing definition", url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf" }
  - { title: "RFC 9110: HTTP request and response semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html" }
---

In Chapter 01 a frame crossed a switch and a packet crossed a router. Real networks hold more kinds of device than those two: firewalls, access points, controllers and servers, each doing a different job to the traffic that reaches it. When something breaks, or when you must choose equipment for a new site, the first question is always which job is missing.

This chapter names those jobs and then shows how they are arranged in a small office, a campus, a data center and across a WAN. By the end you will be able to say what each device contributes to one client-to-server exchange, check whether a switch can power a phone or an access point, and recognize two-tier, three-tier and spine-leaf designs from a diagram. The lab keeps one office LAN and uses it to separate a working network path from a stopped application.

## Why roles matter more than boxes

Suppose a desktop opens a web page hosted on a server in the same office. The desktop is the client, the server provides the page, and an Ethernet switch connects them. If the two are in the same IP network, the traffic passes through the switch without being routed. If the server is in another network, the desktop sends the traffic to its **default gateway**, the local router interface used to reach other networks.

Every device on that path does one of a small number of jobs. The rest of the chapter expands these one-line summaries:

:::facts
- A Layer 2 switch forwards Ethernet frames within a local network using MAC addresses.
- A router, including the routing function of a Layer 3 switch, forwards IP packets between networks.
- An access point connects wireless clients; a controller coordinates the devices it manages.
- A firewall enforces traffic policy. An inline IPS can detect and block suspicious traffic.
- PoE provides electrical power over a suitable copper Ethernet connection.
- A topology describes how devices are connected and which paths traffic can take.
:::

A **physical topology** shows equipment, ports, and cables. A **logical topology** shows how traffic is organized, including IP networks and paths through routing or security devices. Both are useful. A cable may be installed correctly while an interface is disabled; two devices may connect to the same switch but belong to different logical networks.

Read a drawing by tracing one specific exchange. Identify the source and destination, their local connections, and any device that must move traffic between networks. Then ask what would happen if one link failed. A device's shape, position or product name tells you much less than the path does.

:::note
This chapter directly covers the v1.1 component and architecture objectives. For v2.0, it provides the background needed for later interface, edge-port, wireless, and management configuration.
:::

## Routers, switches, endpoints and servers

An **endpoint** sends or receives the traffic that the network exists to carry. Desktops, printers, phones, cameras, and sensors are endpoints. A **server** is an endpoint that provides a service to other devices: a web page, a shared file, a name lookup, or an address assignment. “Client” and “server” describe the roles in an exchange; the same computer can perform both roles in different exchanges.

An **interface** is a device's connection to a network. On a PC it may be an Ethernet adapter or a Wi-Fi adapter. A switch has many interfaces because it connects many devices. Interface names such as `FastEthernet0/1` and `GigabitEthernet0/0` identify the particular connection you are inspecting, so record both ends of a cable when building or troubleshooting a network.

A **Layer 2 switch** learns which source MAC addresses are reachable through its ports. For a known unicast destination, it can forward the frame toward the correct port instead of copying it to every device. An unknown destination may need to be flooded within the relevant **VLAN**, a logical Layer 2 network. Broadcast traffic is also confined to that VLAN; the Ethernet switching chapter explains the forwarding rules in detail.

A switch does not need a management IP address merely to switch Ethernet frames. A management address lets an administrator reach the switch itself. This distinction matters in the lab: the PCs can communicate through an otherwise unconfigured switch even though the switch has no address you can ping.

A **router** uses a routing table to choose where an IP packet should go next. It connects networks, such as an office LAN and a provider connection. As it forwards a packet, it removes the incoming link-layer framing and places the packet in framing suitable for the outgoing connection. A router does not simply extend an Ethernet broadcast domain into the next network.

A **Layer 3 switch**, also called a multilayer switch, can perform both Ethernet switching and IP routing. It is often used to route between local networks in a campus. A router is often selected for a branch or WAN edge because of the interfaces and services it supports. The two overlap in what they can do; the difference is the job each is usually bought for.

| Device or role | Main task in this chapter | Example |
|---|---|---|
| Layer 2 switch | Connect devices in a local Layer 2 network | Desktop and printer on the same LAN |
| Router | Forward packets between IP networks | Office LAN reaching another site |
| Layer 3 switch | Switch locally and route between local networks | Several department networks in a campus |
| Client endpoint | Request or use a service | Browser requesting a web page |
| Server endpoint | Provide a service | Server returning that page |

The lab keeps PC-A and Server-A on one network, where SW1 carries their exchange without a router. Chapter 01's routed example showed what a router adds for a remote destination.

## Firewalls, IPS, access points and controllers

A **firewall** allows or blocks traffic according to a security policy. A stateful firewall also tracks connection state, helping it distinguish traffic belonging to an allowed exchange from unrelated traffic. Allowing a connection is a policy decision; the presence of a route does not mean that the connection is permitted.

A **next-generation firewall (NGFW)** adds capabilities such as application identification and integrated intrusion prevention. A traditional firewall sees only addresses and port numbers, so it cannot tell two applications apart when both use the same port. An NGFW can, and it can also inspect the traffic for threats. It can inspect only what it can read: encrypted traffic must be decrypted first.

An **intrusion prevention system (IPS)** examines traffic for signs of attacks. When deployed inline, it is in the forwarding path and can drop traffic according to its policy. An **intrusion detection system (IDS)** typically examines a copy and raises alerts. The distinction to remember: an IPS sits in the path and can block; an IDS watches a copy and can only alert.

An **access point (AP)** provides a wireless connection for clients and connects that wireless network to the rest of the network. A standalone AP is administered individually. A controller-based AP is managed as part of a larger wireless system. A wireless LAN controller can coordinate settings such as network names, security policy, and radio behavior across multiple APs.

A **controller** provides a central place to coordinate or manage network devices. It may distribute configuration, collect operational information, and help apply consistent policy. A controller manages devices; user traffic does not necessarily flow through it. Some wireless designs tunnel client traffic to the controller, while others switch it locally at the AP's site. The later wireless chapters examine those options.

The v1.1 topic list includes **controllers**. Two useful examples are **Cisco Catalyst Center**, formerly Cisco DNA Center, and a **wireless LAN controller (WLC)**. Catalyst Center provides network management, automation and operational-health information across supported campus devices. A WLC coordinates its wireless APs and their operation.

:::trap One enclosure can perform several roles
A home wireless router often combines a router, a small Ethernet switch, an AP, and **DHCP (Dynamic Host Configuration Protocol)**, a service that supplies host address settings automatically. Its AP function gives a laptop wireless access; its routing function reaches another network. Identify the function involved in the problem rather than treating all failures as “the router is down.”
:::

For example, if wired devices can reach an office server but wireless devices cannot associate with the wireless network at all, begin with wireless settings and the AP. If both wired and wireless devices can reach the local server but cannot reach another network, investigate their gateway and the path beyond it.

## Power over Ethernet

**Power over Ethernet (PoE)** carries electrical power and Ethernet data over the same suitable copper cable. A PoE-capable switch or injector is the **power sourcing equipment (PSE)**. The phone, AP, camera, or other device receiving power is the **powered device (PD)**. This is useful when the endpoint is mounted somewhere without a nearby electrical outlet.

Standards-based PoE detects a compatible powered device before supplying its operating power. You can connect an ordinary non-PoE Ethernet endpoint to a compatible standards-based PoE switch port without requiring it to consume PoE. Passive injectors, which supply power without detection, are the exception.

| IEEE standard | Type | Maximum power supplied at the PSE port |
|---|---|---|
| 802.3af | Type 1, commonly PoE | 15.4 W |
| 802.3at | Type 2, commonly PoE+ | 30 W |
| 802.3bt | Type 3 | 60 W |
| 802.3bt | Type 4 | 90 W |

The table gives the power at the switch port. Less arrives at the device because the cable loses some as heat: an 802.3af port supplies 15.4 W but guarantees only 12.95 W at the device, and an 802.3at port supplies 30 W for 25.5 W at the device. For the exam, know the two roles, the four port limits, and the two checks below.

First, check the **per-port capability**: does this port support the standard and power allocation the endpoint requires? Second, check the switch's **total PoE budget**: how much power remains available across all powered ports? A port might support 30 W while the entire switch has only 15 W left to allocate.

For a simple budget example, a switch has 120 W available for PoE and three connected devices are each allocated 30 W. That leaves 30 W. A fourth 30 W allocation fits; a fifth does not.

On a supported Cisco PoE switch, `show power inline` is a useful first check. It reports the budget and per-port power information. An administratively disabled PoE port is different from a port denied power because the budget is exhausted. `power inline auto` enables normal detection and allocation; `power inline never` disables PoE on the selected port. Chapter 09 configures PoE ports; the 2960 in this chapter's lab does not need these commands.

## Campus designs: two-tier, three-tier and spine-leaf

A **campus network** connects users and services within a site, which might be one building or several nearby buildings. A hierarchical design gives each layer one responsibility so that the network stays understandable as it grows. The **access** layer connects endpoints: PCs, phones, printers and APs plug in here, and this is where PoE is supplied. The **distribution** layer aggregates the access switches and is usually where routing between their networks and traffic policy are applied. The **core** does one thing: it moves traffic quickly between distribution blocks.

In a **two-tier** design, the distribution and core responsibilities are combined in a **collapsed core**. In a **three-tier** design, the core is a separate layer. Count functional layers, not switches: two collapsed-core switches providing redundancy still belong to one layer. A single building usually needs only two tiers. A separate core earns its cost when a site has several distribution blocks, such as one per building, that would otherwise each need links to all the others.

```diagram
{"type":"topology","title":"Fig 2.1 — A two-tier campus example","caption":"Access switches connect endpoints; the upper pair provides the combined distribution and core role. The drawing shows physical paths, not a particular forwarding configuration.","nodes":[{"id":"c1","kind":"l3switch","label":"Collapsed core 1","x":4,"y":1},{"id":"c2","kind":"l3switch","label":"Collapsed core 2","x":8,"y":1},{"id":"a1","kind":"switch","label":"Access 1","x":2,"y":3.5},{"id":"a2","kind":"switch","label":"Access 2","x":6,"y":3.5},{"id":"a3","kind":"switch","label":"Access 3","x":10,"y":3.5},{"id":"pc","kind":"pc","label":"Desktop","x":2,"y":5.5},{"id":"ap","kind":"ap","label":"AP","x":10,"y":5.5}],"links":[{"from":"a1","to":"c1"},{"from":"a1","to":"c2"},{"from":"a2","to":"c1"},{"from":"a2","to":"c2"},{"from":"a3","to":"c1"},{"from":"a3","to":"c2"},{"from":"c1","to":"c2"},{"from":"pc","to":"a1"},{"from":"ap","to":"a3"}]}
```

Each access switch in the figure has two uplinks, so traffic has another path if one link or one collapsed-core switch fails. Check where redundant links end: two cables into the same switch do not protect against the failure of that switch. Redundant Ethernet links also form loops, which is why Chapter 14 teaches spanning tree before you build a design like this one.

**Spine-leaf** is a common data-center topology. In the basic design, every leaf connects to every spine, and servers attach only to leaves. Leaves do not connect to other leaves, and spines do not connect to other spines. Traffic between servers on different leaves therefore always follows leaf → spine → leaf, so every server is the same number of hops from every other. That predictability suits **east-west traffic**, meaning traffic between systems inside the data center.

```diagram
{"type":"topology","title":"Fig 2.2 — Basic spine-leaf design","caption":"Each leaf has a connection to each spine. Server A reaches Server B through a leaf, a spine, and the other leaf.","nodes":[{"id":"s1","kind":"switch","label":"Spine 1","x":4,"y":1},{"id":"s2","kind":"switch","label":"Spine 2","x":8,"y":1},{"id":"l1","kind":"switch","label":"Leaf 1","x":2,"y":3.5},{"id":"l2","kind":"switch","label":"Leaf 2","x":6,"y":3.5},{"id":"l3","kind":"switch","label":"Leaf 3","x":10,"y":3.5},{"id":"a","kind":"server","label":"Server A","x":2,"y":5.5},{"id":"b","kind":"server","label":"Server B","x":10,"y":5.5}],"links":[{"from":"l1","to":"s1"},{"from":"l1","to":"s2"},{"from":"l2","to":"s1"},{"from":"l2","to":"s2"},{"from":"l3","to":"s1"},{"from":"l3","to":"s2"},{"from":"a","to":"l1"},{"from":"b","to":"l3"}],"trace":{"flows":[{"path":["a","l1","s1","l3","b"],"label":"One possible server-to-server path","tags":{"l1":"Leaf → one of the spines","s1":"Spine → the other leaf","l3":"Leaf → its attached server"}}]}}
```

The design grows in two directions: add a leaf for more server ports, or add a spine for more capacity and more paths between leaves.

## WAN, SOHO and cloud

A **wide-area network (WAN)** connects networks across a wider geographic area, often through a service provider. A company might connect branch offices to a main office using provider Ethernet, a private WAN service, or an encrypted connection across the Internet. A line drawn through a provider cloud represents a service or logical path; it does not necessarily mean one dedicated physical cable between the offices.

In a **point-to-point** arrangement, a connection joins two sites. In **hub-and-spoke**, branches connect through a central site. A **mesh** provides multiple inter-site connections. Hub-and-spoke needs the fewest links, but the hub is a single point of failure for traffic between branches. A mesh survives more failures and needs many more links. A private WAN service keeps your traffic separate from other customers' traffic; it does not encrypt it.

**Small office/home office (SOHO)** networks serve relatively few users and often combine several functions in one appliance. The LAN ports, Wi-Fi radio, and Internet-facing connection have different jobs. A failed Internet connection does not necessarily stop a desktop from reaching a local printer. Conversely, a working wireless association does not prove that the user can reach the Internet.

**On-premises** describes equipment operated at the organization's own site. A cloud service makes computing resources available through a service model rather than requiring the customer to install and operate every underlying component. Moving a server to a provider changes who manages parts of the service and how users reach it; it does not remove the need for addressing, connectivity, and security.

NIST defines cloud computing by five characteristics: on-demand self-service, broad network access, resource pooling, rapid elasticity and measured service. **Elasticity** means capacity expands and contracts with demand. There are three service models. **IaaS** (infrastructure as a service) supplies virtual machines, storage and networks on which the customer runs its own operating systems and applications. **PaaS** (platform as a service) supplies a managed platform for the customer's own application code. **SaaS** (software as a service) supplies a ready-to-use application. A private cloud serves one organization, a public cloud offers services to customers generally, and a hybrid cloud connects distinct cloud environments.

## Reading the output

Start with the question you need to answer. To identify a router's interface addresses and operational states, use `show ip interface brief`. To inspect a switch's physical port status, use `show interfaces status`. Neither command, by itself, proves that a server application works.

This representative excerpt comes from a router that joins two LANs. The lab itself needs no router; it uses only the 192.0.2.0/24 LAN.

```output R1# show ip interface brief — representative excerpt
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.0.2.1        YES manual up                    up   ← LAN containing PC-A and Server-A
GigabitEthernet0/1     198.51.100.1     YES manual up                    up   ← LAN containing PC-B
```

The address column identifies the local router interface on each LAN. The two state columns show that the interfaces are operational. These are not PC addresses, and an interface address is not a list of every destination the router knows. `show ip route` is the separate view of its forwarding information.

For a PoE fault, first establish whether the device has power. This representative budget excerpt comes from a PoE switch; the lab's 2960 does not produce it.

```output SW-POE# show power inline — representative budget excerpt
Module   Available     Used     Remaining
          (Watts)     (Watts)    (Watts)
------   ---------   --------   ---------
1           120.0       90.0        30.0   ← 30 W remains for additional allocations
```

Work from the symptom to the relevant function. A dark AP needs a power check before wireless troubleshooting. A local server that works while remote destinations fail suggests checking the gateway path. A topology with two links still needs inspection of where those links terminate and whether a usable alternative exists. Write down the observation before changing configuration; it becomes your baseline for deciding whether the change helped.

## Exam focus

- Identify endpoints and servers by their role in an exchange.
- Distinguish MAC-based Layer 2 switching from IP routing; a Layer 3 switch supports both.
- Explain a firewall's policy role and the blocking capability of an inline IPS.
- Distinguish the AP's client connection role from a controller's coordination role.
- Identify the PSE, PD, per-port PoE limit, and total power budget.
- Recognize access, distribution, core, and the combined role in a two-tier campus.
- Trace a path through a basic spine-leaf design and identify its endpoint connections.
- Compare WAN, SOHO, on-premises and cloud arrangements, and name the three cloud service models.

Before moving on, trace a client-to-server exchange and identify which device supplies each required function. Keep the distinction between an operational link, a successful ping and a working application. Chapter 03 examines that first link check in detail: the cable, the two interfaces and their operational evidence.
