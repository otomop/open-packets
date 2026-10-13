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

Before configuring a network, you need to recognize what each device contributes. This chapter follows a user reaching a server, then shows how the same functions fit into larger designs. The lab uses an office LAN to distinguish working local communication from a stopped application service, then compares larger designs on paper.

This directly covers the v1.1 component and architecture objectives. For v2.0, it provides the background needed for later interface, edge-port, wireless, and management configuration. Identifying an AP or a PoE port here does not replace those later configuration labs.

## Why roles matter more than boxes

:::facts
- A Layer 2 switch forwards Ethernet frames within a local network using MAC addresses.
- A router, including the routing function of a Layer 3 switch, forwards IP packets between networks.
- An access point connects wireless clients; a controller coordinates the devices it manages.
- A firewall enforces traffic policy. An inline IPS can detect and block suspicious traffic.
- PoE provides electrical power over a suitable copper Ethernet connection.
- A topology describes connections and paths. A device's position alone does not prove its configuration.
:::

Suppose a desktop opens a page hosted on a server in the same office. The desktop is the client, the server provides the page, and an Ethernet switch connects them. If they are in the same local IP network, the traffic can pass through the switch without being routed. If the server is in another network, the desktop sends the traffic to its **default gateway**, the local router interface used to reach other networks.

A **physical topology** shows equipment, ports, and cables. A **logical topology** shows how traffic is organized, including IP networks and paths through routing or security devices. Both are useful. A cable may be installed correctly while an interface is disabled; two devices may connect to the same switch but belong to different logical networks.

Read a drawing by tracing one specific exchange. Identify the source and destination, their local connections, and any device that must move traffic between networks. Then ask what would happen if one link failed. This is more useful than deciding what a device does from its shape, position, or product name alone.

## Routers, switches, endpoints and servers

An **endpoint** sends or receives the traffic that the network exists to carry. Desktops, printers, phones, cameras, and sensors are endpoints. A **server** is an endpoint that provides a service to other devices: a web page, a shared file, a name lookup, or an address assignment. “Client” and “server” describe the roles in an exchange; the same computer can perform both roles in different exchanges.

An **interface** is a device's connection to a network. On a PC it may be an Ethernet adapter or a Wi-Fi adapter. A switch has many interfaces because it connects many devices. Interface names such as `FastEthernet0/1` and `GigabitEthernet0/0` identify the particular connection you are inspecting, so record both ends of a cable when building or troubleshooting a network.

A **Layer 2 switch** learns which source MAC addresses are reachable through its ports. For a known unicast destination, it can forward the frame toward the correct port instead of copying it to every device. An unknown destination may need to be flooded within the relevant **VLAN**, a logical Layer 2 network. Broadcast traffic is also confined to that VLAN; the Ethernet switching chapter explains the forwarding rules in detail.

A switch does not need a management IP address merely to switch Ethernet frames. A management address lets an administrator reach the switch itself. This distinction matters in the lab: the PCs can communicate through an otherwise unconfigured switch even though the switch has no address you can ping.

A **router** uses a routing table to choose where an IP packet should go next. It connects networks, such as an office LAN and a provider connection. As it forwards a packet, it removes the incoming link-layer framing and places the packet in framing suitable for the outgoing connection. A router does not simply extend an Ethernet broadcast domain into the next network.

A **Layer 3 switch**, also called a multilayer switch, can perform both Ethernet switching and IP routing. It is often used to route between local networks in a campus. A router is often selected for a branch or WAN edge because of the interfaces and services it supports. These are typical roles, not a rule that every product labeled “switch” lacks a particular routing, security, or WAN feature; check the actual platform and software.

| Device or role | Main task in this chapter | Example |
|---|---|---|
| Layer 2 switch | Connect devices in a local Layer 2 network | Desktop and printer on the same LAN |
| Router | Forward packets between IP networks | Office LAN reaching another site |
| Layer 3 switch | Switch locally and route between local networks | Several department networks in a campus |
| Client endpoint | Request or use a service | Browser requesting a web page |
| Server endpoint | Provide a service | Server returning that page |

The lab keeps PC-A and Server-A on one network, where SW1 can carry their exchange locally. Chapter 01's routed example shows the additional gateway role for a remote destination. Using a router does not mean every endpoint requires a direct cable to it.

## Firewalls, IPS, access points and controllers

A **firewall** allows or blocks traffic according to a security policy. A stateful firewall also tracks connection state, helping it distinguish traffic belonging to an allowed exchange from unrelated traffic. Allowing a connection is a policy decision; the presence of a route does not mean that the connection is permitted.

A **next-generation firewall (NGFW)** adds capabilities such as application identification and integrated intrusion prevention. This allows an organization to distinguish applications that may use the same transport port and to inspect traffic for threats. Available inspection depends on the product, configuration, and visibility into the traffic. Encrypted content is not automatically readable merely because the device is called an NGFW.

An **intrusion prevention system (IPS)** examines traffic for signs of attacks. When deployed inline, it is in the forwarding path and can drop traffic according to its policy. An **intrusion detection system (IDS)** typically examines a copy and raises alerts. The useful distinction is whether that inspection point can directly stop the traffic passing through it; avoid assuming that every alert proves a successful attack.

An **access point (AP)** provides a wireless connection for clients and connects that wireless network to the rest of the network. A standalone AP is administered individually. A controller-based AP is managed as part of a larger wireless system. A wireless LAN controller can coordinate settings such as network names, security policy, and radio behavior across multiple APs.

A **controller** provides a central place to coordinate or manage network devices. It may distribute configuration, collect operational information, and help apply consistent policy. That does not imply that every user packet passes through every kind of controller. Some wireless deployments tunnel client traffic through a controller, while others switch it locally at the AP's site. The later wireless chapters examine those options.

The v1.1 topic list includes **controllers**. Two useful examples are **Cisco Catalyst Center**, formerly Cisco DNA Center, and a **wireless LAN controller (WLC)**. Catalyst Center provides network management, automation and operational-health information across supported campus devices. A WLC coordinates its wireless APs and their operation. Recognize the different roles; the objective does not require a catalog of controller models.

:::trap One enclosure can perform several roles
A home wireless router often combines a router, a small Ethernet switch, an AP, and **DHCP (Dynamic Host Configuration Protocol)**, a service that supplies host address settings automatically. Its AP function gives a laptop wireless access; its routing function reaches another network. Identify the function involved in the problem rather than treating all failures as “the router is down.”
:::

For example, if wired devices can reach an office server but wireless devices cannot associate with the wireless network at all, begin with wireless settings and the AP. If both wired and wireless devices can reach the local server but cannot reach another network, investigate their gateway and the path beyond it. This narrows the investigation without pretending that the symptom alone proves one failed component.

## Power over Ethernet

**Power over Ethernet (PoE)** carries electrical power and Ethernet data over the same suitable copper cable. A PoE-capable switch or injector is the **power sourcing equipment (PSE)**. The phone, AP, camera, or other device receiving power is the **powered device (PD)**. This is useful when the endpoint is mounted somewhere without a nearby electrical outlet.

Standards-based PoE detects a compatible powered device before supplying its operating power. You can connect an ordinary non-PoE Ethernet endpoint to a compatible standards-based PoE switch port without requiring it to consume PoE. Do not apply that statement to an unspecified passive injector: verify the equipment's documented compatibility.

| IEEE standard | Type | Maximum power supplied at the PSE port |
|---|---|---|
| 802.3af | Type 1, commonly PoE | 15.4 W |
| 802.3at | Type 2, commonly PoE+ | 30 W |
| 802.3bt | Type 3 | 60 W |
| 802.3bt | Type 4 | 90 W |

Power supplied at the switch and power available at the endpoint are different quantities because the cable introduces loss. Do not compare an endpoint's required input power directly with a switch's headline wattage without checking the relevant standard and device specifications. For this chapter, concentrate on the equipment roles, the four supplied-power limits, and the two checks below.

First, check the **per-port capability**: does this port support the standard and power allocation the endpoint requires? Second, check the switch's **total PoE budget**: how much power remains available across all powered ports? A port might support 30 W while the entire switch has only 15 W left to allocate.

For a simple budget example, a switch has 120 W available for PoE and three connected devices are each allocated 30 W. That leaves 30 W. A fourth 30 W allocation fits; a fifth does not. This calculation uses switch-side allocations throughout, not a mixture of allocation and device-side consumption. Actual power accounting and priorities depend on the platform.

On a supported Cisco PoE switch, `show power inline` is a useful first check. It reports the budget and per-port power information. An administratively disabled PoE port is different from a port denied power because the budget is exhausted. `power inline auto` enables normal detection and allocation; `power inline never` disables PoE on the selected port. These are reading and command-recognition examples here, not a claim that every Packet Tracer switch implements the feature.

## Campus designs: two-tier, three-tier and spine-leaf

A **campus network** connects users and services within a site, which might be one building or several nearby buildings. A hierarchical design separates responsibilities so that the network remains understandable as it grows. **Access** connects endpoints, **distribution** brings access networks together, and the **core** provides connectivity between distribution areas.

In a **two-tier** design, the distribution and core responsibilities are combined in a **collapsed core**. In a **three-tier** design, the core is a separate layer. Count functional layers, not switches: two collapsed-core switches providing redundancy still belong to one layer. The choice depends on scale, required resilience, geography, and operational needs.

```diagram
{"type":"topology","title":"Fig 2.1 — A two-tier campus example","caption":"Access switches connect endpoints; the upper pair provides the combined distribution and core role. The drawing shows physical paths, not a particular forwarding configuration.","nodes":[{"id":"c1","kind":"l3switch","label":"Collapsed core 1","x":4,"y":1},{"id":"c2","kind":"l3switch","label":"Collapsed core 2","x":8,"y":1},{"id":"a1","kind":"switch","label":"Access 1","x":2,"y":3.5},{"id":"a2","kind":"switch","label":"Access 2","x":6,"y":3.5},{"id":"a3","kind":"switch","label":"Access 3","x":10,"y":3.5},{"id":"pc","kind":"pc","label":"Desktop","x":2,"y":5.5},{"id":"ap","kind":"ap","label":"AP","x":10,"y":5.5}],"links":[{"from":"a1","to":"c1"},{"from":"a1","to":"c2"},{"from":"a2","to":"c1"},{"from":"a2","to":"c2"},{"from":"a3","to":"c1"},{"from":"a3","to":"c2"},{"from":"c1","to":"c2"},{"from":"pc","to":"a1"},{"from":"ap","to":"a3"}]}
```

Redundant links can provide another path after a failure, but only when the network is designed and configured to use that path safely. Two cables into the same switch do not protect against failure of that switch. Also, additional Ethernet links can create loops; do not copy the diagram into a live network without the switching design. Spanning tree and link aggregation are later topics, not prerequisites for this chapter's lab.

**Spine-leaf** is a common data-center topology. In the basic design, each leaf connects to each spine, and servers attach to leaves. Traffic between devices on different leaves can follow leaf → spine → leaf. This provides a consistent structure for **east-west traffic**, meaning traffic between systems within the data center.

```diagram
{"type":"topology","title":"Fig 2.2 — Basic spine-leaf design","caption":"Each leaf has a connection to each spine. Server A reaches Server B through a leaf, a spine, and the other leaf.","nodes":[{"id":"s1","kind":"switch","label":"Spine 1","x":4,"y":1},{"id":"s2","kind":"switch","label":"Spine 2","x":8,"y":1},{"id":"l1","kind":"switch","label":"Leaf 1","x":2,"y":3.5},{"id":"l2","kind":"switch","label":"Leaf 2","x":6,"y":3.5},{"id":"l3","kind":"switch","label":"Leaf 3","x":10,"y":3.5},{"id":"a","kind":"server","label":"Server A","x":2,"y":5.5},{"id":"b","kind":"server","label":"Server B","x":10,"y":5.5}],"links":[{"from":"l1","to":"s1"},{"from":"l1","to":"s2"},{"from":"l2","to":"s1"},{"from":"l2","to":"s2"},{"from":"l3","to":"s1"},{"from":"l3","to":"s2"},{"from":"a","to":"l1"},{"from":"b","to":"l3"}],"trace":{"flows":[{"path":["a","l1","s1","l3","b"],"label":"One possible server-to-server path","tags":{"l1":"Leaf → one of the spines","s1":"Spine → the other leaf","l3":"Leaf → its attached server"}}]}}
```

Adding a leaf provides more attachment ports; adding a spine provides more interconnection capacity and possible paths, subject to the equipment and configuration. Recognize this basic arrangement for CCNA. Detailed fabric protocols and larger variations of the topology belong beyond this introductory objective.

## WAN, SOHO and cloud

A **wide-area network (WAN)** connects networks across a wider geographic area, often through a service provider. A company might connect branch offices to a main office using provider Ethernet, a private WAN service, or an encrypted connection across the Internet. A line drawn through a provider cloud represents a service or logical path; it does not necessarily mean one dedicated physical cable between the offices.

In a **point-to-point** arrangement, a connection joins two sites. In **hub-and-spoke**, branches connect through a central site. A **mesh** provides multiple inter-site connections. Read the paths shown: if two branches must communicate through a hub, losing that hub affects their communication unless another path is available. Do not assume that using a private provider network automatically encrypts the traffic.

**Small office/home office (SOHO)** networks serve relatively few users and often combine several functions in one appliance. The LAN ports, Wi-Fi radio, and Internet-facing connection have different jobs. A failed Internet connection does not necessarily stop a desktop from reaching a local printer. Conversely, a working wireless association does not prove that the user can reach the Internet.

**On-premises** describes equipment operated at the organization's own site. A cloud service makes computing resources available through a service model rather than requiring the customer to install and operate every underlying component. Moving a server to a provider changes who manages parts of the service and how users reach it; it does not remove the need for addressing, connectivity, and security.

NIST's cloud definition includes self-service provisioning, network access, shared resources, elasticity, and measured usage. **Elasticity** means capacity can expand and contract with demand. For introductory recognition, IaaS supplies infrastructure on which the customer manages operating systems and applications; PaaS supplies an application platform; SaaS supplies a ready-to-use application. A private cloud serves one organization, a public cloud offers services to customers generally, and a hybrid arrangement connects distinct cloud environments.

Treat those cloud terms as useful context for comparing deployments. Detailed provider products, WAN service catalogs, fabric configuration, and memorized product model lists are not required to understand the architecture objectives here.

## Reading the output

Start with the question you need to answer. To identify a router's interface addresses and operational states, use `show ip interface brief`. To inspect a switch's physical port status, use `show interfaces status`. Neither command, by itself, proves that a server application works.

The following is a **representative IOS-style excerpt**, not a captured Packet Tracer run. Interfaces and formatting vary by model. This is a separate routed example; the practical lab needs only its local 192.0.2.0/24 LAN.

```output R1# show ip interface brief — representative excerpt
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.0.2.1        YES manual up                    up   ← LAN containing PC-A and Server-A
GigabitEthernet0/1     198.51.100.1     YES manual up                    up   ← LAN containing PC-B
```

The address column identifies the local router interface on each LAN. The two state columns show that the interfaces are operational. These are not PC addresses, and an interface address is not a list of every destination the router knows. `show ip route` is the separate view of its forwarding information.

For a PoE fault, first establish whether the device has power. This representative budget excerpt is a reading exercise for a supported PoE switch; the lab's 2960 model is not required to produce it.

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
- Compare WAN, SOHO, on-premises, and cloud arrangements without assuming that a device name or drawing proves its configuration.

Before moving on, trace a client-to-server exchange and identify which device supplies each required function. Keep the distinction between an operational link, a successful ping and a working application. Chapter 03 examines that first link check in detail: the cable, the two interfaces and their operational evidence.
