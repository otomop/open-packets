---
id: wireless-architecture
number: 37
title: Wireless architectures
subtitle: Follow AP management, client data and VLANs through each deployment model.
part: wireless
domain: switching
minutes: { lesson: 65, lab: 80 }
summary: Compare autonomous, controller-based and cloud-managed WLANs, follow CAPWAP discovery and forwarding, and choose AP and controller switchport settings from the traffic they actually carry.
objectives:
  v1: ["2.6", "2.7"]
  v2: ["2.2.b"]
prereqs: [wireless-principles, trunks-dtp, inter-vlan-routing, etherchannel, dhcp, dns, aaa-tacacs-radius]
sectionIds:
  Separate management from client forwarding: why-one-ap-is-easy-and-fifty-are-not
  Compare the three architectures: autonomous-lightweight-and-cloud-managed
  Place the controller: where-the-controller-lives-deployment-models
  Follow CAPWAP discovery and forwarding: capwap-the-tunnel-between-ap-and-wlc
  Choose the AP operating mode: ap-modes-what-job-the-radio-does
  Recognize controller interfaces and profiles: wlc-ports-and-interfaces
  Configure the AP and controller links: access-or-trunk-and-lag-cabling-the-pieces
  Verify the design one layer at a time: verify-and-troubleshoot
  Exam focus: exam-focus
sources:
  - { title: "Cisco Unified Wireless Network Solution Guide — architecture and split MAC", url: "https://www.cisco.com/c/en/us/products/collateral/wireless/unified-wireless-network-sg.html" }
  - { title: "RFC 5415 — CAPWAP protocol", url: "https://www.rfc-editor.org/rfc/rfc5415" }
  - { title: "Cisco — DHCP option 43 for lightweight access points", url: "https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/97066-dhcp-option-43-00.html" }
  - { title: "Cisco AireOS 8.10 — ports and interfaces", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/ports_and_interfaces.html" }
  - { title: "Cisco Catalyst 9800 17.15 — AP operating modes", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-15/config-guide/b_wl_17_15_cg/m-sniffer-cg.html" }
  - { title: "Cisco Catalyst 9800 — configuration model and tags", url: "https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213911-understand-catalyst-9800-wireless-contro.html" }
  - { title: "Cisco Catalyst 9800 17.15 — link aggregation", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-15/config-guide/b_wl_17_15_cg/m_lacp_pagp.html" }
  - { title: "Cisco Meraki — SSID modes for client IP assignment", url: "https://documentation.meraki.com/Wireless/Design_and_Configure/Configuration_Guides/Client_Addressing_and_Bridging/SSID_Modes_for_Client_IP_Assignment" }
  - { title: "Cisco Meraki — AP link aggregation configuration", url: "https://documentation.meraki.com/Wireless/Design_and_Configure/Configuration_Guides/Client_Addressing_and_Bridging/MR_Link_Aggregation_Configuration_Guide" }
  - { title: "Cisco Meraki — MR52/53 installation and power", url: "https://documentation.meraki.com/Wireless/Install_and_Get_Started/Installation_Guides/MR52%2F%2F53_Installation_Guide" }
  - { title: "Cisco — Embedded Wireless Controller on AP end-of-sale notice", url: "https://www.cisco.com/c/en/us/products/collateral/wireless/embedded-wireless-controller-catalyst-access-points/wireless-ewc-access-point-eol.html" }
---

A wireless design contains several distinct paths. Administrators need to configure the AP, the AP needs an IP connection to its manager, and clients need a path into their own network. Those paths can share a cable without sharing a VLAN. Before choosing a switchport configuration, draw where each kind of traffic enters and leaves the wired network.

## Separate management from client forwarding

:::facts
- CAPWAP uses controller UDP port `5246` for control and `5247` for data.
- In a centrally switched WLAN, client traffic reaches its wired VLAN at the controller. With local switching, it reaches that VLAN at the AP.
- Use an access port for one untagged VLAN; use an 802.1Q trunk when the device must carry tagged VLANs. Architecture names alone do not decide the port mode.
- Established Cisco AP–controller control traffic uses DTLS; CAPWAP discovery precedes that protected session. Data encryption is a separate setting.
- AireOS and Catalyst 9800 have different configuration models. Identify the platform before interpreting interface names or configuring aggregation.
:::

The **management plane** provides configuration and monitoring. The **control plane** makes operational decisions, such as maintaining client state and selecting radio parameters. The **data plane** forwards user traffic. These are descriptions of functions, not three mandatory physical cables.

The previous chapter followed the client over the radio. Now continue that packet onto the wired network. Reuse the access/native/tagged VLAN distinctions from [chapter 10](#/chapter/trunks-dtp), DHCP from [chapter 24](#/chapter/dhcp), and DNS lookup from [chapter 25](#/chapter/dns). A tunnel carries one packet inside another; as in [chapter 35](#/chapter/vpns-ipsec), the outer addresses determine the path between tunnel endpoints.

Consider an AP with management address `192.168.10.21` and a wireless client in `192.168.20.0/24`. The AP can reach its controller using VLAN 10 while the client's VLAN 20 is carried inside a tunnel. The switch connected to that AP may therefore need only an access port in VLAN 10. Making it a trunk because the client is in a different subnet would add configuration without addressing the actual forwarding requirement.

Now change the WLAN to local switching. The AP must put the client's Ethernet traffic directly into VLAN 20. If management remains untagged in VLAN 10, the link needs a trunk with native VLAN 10 and tagged VLAN 20. The IP addresses have not changed; the location where client traffic leaves the tunnel has.

## Compare the three architectures

An **autonomous AP** keeps its wireless configuration and client handling locally. It can bridge a single WLAN to one untagged Ethernet network or map several WLANs into different VLANs. Multiple tagged VLANs require a trunk; an autonomous AP does not inherently require one. Independent administration becomes more work as the number of APs increases.

A **controller-based AP**, often called a lightweight AP, obtains configuration from a **wireless LAN controller (WLC)**. Cisco's **split-MAC** design keeps time-sensitive radio operations in the AP while centralizing other functions. The AP handles such work as radio acknowledgements, retransmissions, beacons, power-save buffering and per-frame wireless encryption/decryption. The controller coordinates WLAN policies, client state, mobility and radio management. The exact division also depends on AP mode and features.

A **cloud-managed AP** obtains configuration through a cloud service such as the Meraki dashboard. That describes its management arrangement. In Meraki **bridge mode**, ordinary client traffic is bridged into the local wired network. Other supported SSID modes include NAT and tunneling to a concentrator. Identify the configured mode before drawing the data path.

| Design | Main configuration location | Example data path | Port implication |
|---|---|---|---|
| Autonomous | Individual AP | Client → AP → local VLAN | Access or trunk, according to tagging |
| Controller, central switching | WLC | Client → AP → CAPWAP → WLC → client VLAN | AP can use access; WLC often needs trunk |
| Controller, local switching | WLC; AP applies local policy | Client → AP → branch VLAN | AP often needs trunk |
| Meraki bridge mode | Cloud dashboard | Client → AP → local VLAN | Access or trunk, according to tagging |

Management availability and forwarding availability are separate questions. Losing dashboard access does not by itself mean every bridge-mode client loses local communication. Conversely, existing configuration cannot replace a failed DHCP server, authentication service or Internet gateway.

```diagram
{"type":"topology","title":"Fig 37.1 — The same client VLAN can leave at different devices","caption":"The central WLAN reaches VLAN 20 at WLC1; the locally switched WLAN reaches VLAN 20 at AP2.","nodes":[{"id":"C1","kind":"laptop","label":"Central client","x":1,"y":1},{"id":"AP1","kind":"ap","label":"AP1","sub":"untagged management","x":4,"y":1},{"id":"SW","kind":"switch","label":"SW1","x":7,"y":3},{"id":"WLC","kind":"wlc","label":"WLC1","sub":"client VLAN 20","x":11,"y":1},{"id":"AP2","kind":"ap","label":"AP2","sub":"local VLAN 20","x":4,"y":5},{"id":"C2","kind":"laptop","label":"Local client","x":1,"y":5}],"links":[{"from":"C1","to":"AP1","style":"wireless"},{"from":"AP1","to":"SW","label":"access VLAN 10"},{"from":"SW","to":"WLC","label":"trunk 10,20","accent":true},{"from":"C2","to":"AP2","style":"wireless"},{"from":"AP2","to":"SW","label":"native 10; tagged 20","accent":true}],"trace":{"flows":[{"path":["C1","AP1","SW","WLC"],"label":"Centrally switched client traffic","tags":{"AP1":"Into CAPWAP · UDP 5247 to WLC1","SW":"Outer packet in VLAN 10","WLC":"Leaves the tunnel into VLAN 20"}},{"path":["C2","AP2","SW"],"tone":"alt","label":"Locally switched client traffic","tags":{"AP2":"Local switching · tagged VLAN 20","SW":"Received tagged in VLAN 20"}}]}}
```

## Place the controller

A controller can be a physical appliance or a supported virtual deployment such as Catalyst 9800-CL. A **virtual machine (VM)** is a software-defined computer with its own operating system, running on resources supplied by a physical host. That is enough to interpret controller placement here; [chapter 39](#/chapter/virtualization) explains the hypervisor and host connections. A centralized campus controller can serve APs in many buildings. A branch may use local switching to avoid sending local printer traffic across a WAN to a distant controller and back.

**Cloud-based controller** and **cloud-managed AP** are different descriptions. A controller VM in a hosted environment still has AP discovery, CAPWAP and platform-specific forwarding requirements. A Meraki dashboard is not simply an AireOS controller VM with a different web address.

You may also encounter embedded controllers in supported switches or APs. These are product-specific designs, not a feature available on every Catalyst device. Cisco's Embedded Wireless Controller running on an AP reached end of sale in November 2024, with IOS XE 17.15.x its final supported software train. Recognize existing EWC-AP and older Mobility Express deployments without treating them as the default new purchase. The separate switch-based embedded offering has its own scope and lifecycle.

For this chapter, concentrate on placement and forwarding consequences. Maximum AP counts, VM sizes, licensing and supported hypervisors belong in the selected product's current deployment guide.

## Follow CAPWAP discovery and forwarding

**CAPWAP** stands for Control and Provisioning of Wireless Access Points. Its outer IP packet uses the AP and controller addresses. Routers between them forward that outer packet normally; the AP need not share the controller's subnet.

**DTLS**, Datagram Transport Layer Security, supplies authentication, integrity and encryption for a protected session over datagram transport such as UDP. For CAPWAP, distinguish the protected AP–controller control session from both initial discovery and the separately configured data-channel protection. It is not the WPA security exchange between a client and the AP.

An AP first needs working power, Ethernet and IP configuration. It then discovers controller candidates. Common Cisco methods are local-subnet discovery, previously learned or configured controller addresses, DHCP option 43, and DNS for `CISCO-CAPWAP-CONTROLLER` in the relevant domain. Local broadcasts do not cross an ordinary routed boundary. A previously joined AP may still remember a controller after a subnet move, so the move alone does not prove discovery will fail.

Option 43 is vendor-specific. For Cisco APs that use suboption `241`, `f104.c0a8.0a05` encodes type `f1`, length `04` and one IPv4 address, `192.168.10.5`. Other AP families can require different formats; check the supported AP model rather than assuming that every vendor interprets this string.

```ios R1 — example inside the AP DHCP pool
R1(config)# ip dhcp pool AP-MGMT
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# option 43 hex f104.c0a8.0a05
R1(dhcp-config)# exit
```

This example supplies a discovery address; it does not make an unreachable controller reachable. Routing, filtering, software compatibility and certificate checks can still prevent a join. Configured primary/secondary preferences help select a controller from reachable candidates.

```diagram
{"type":"sequence","title":"Fig 37.2 — From an IP address to a registered AP","actors":["AP","DHCP server","WLC"],"steps":[{"from":0,"to":1,"label":"Obtain IP settings","note":"lease, gateway and optional discovery information"},{"from":0,"to":2,"label":"CAPWAP discovery","note":"UDP 5246; before the DTLS session"},{"from":2,"to":0,"label":"Discovery response"},{"from":0,"to":2,"label":"Establish DTLS and join","note":"certificate and compatibility checks","accent":true},{"from":2,"to":0,"label":"Configuration and operational state"},{"from":0,"to":2,"label":"Centrally switched client data","note":"UDP 5247; separate data-encryption policy"}],"caption":"A lease proves address allocation; a registered AP record proves that discovery and the subsequent join completed."}
```

The CAPWAP data path encapsulates client traffic for transport to the controller when central switching is used. Do not assume that every implementation carries an unchanged encrypted 802.11 frame. CAPWAP supports different framing arrangements, and the AP performs wireless decryption/encryption.

:::trap Radio encryption is not tunnel encryption
WPA2/WPA3 protect the client–AP radio link. They do not automatically protect client payloads across the wired AP–controller path. CAPWAP data DTLS is a separate capability and policy; application encryption such as HTTPS is also separate. Discovery traffic is not part of the established encrypted control session.
:::

## Choose the AP operating mode

An AP's mode determines its job. Available modes depend on the AP family and controller release; a Packet Tracer dropdown is not a complete inventory of current hardware features.

| Mode | Main job | Ordinary wireless clients? |
|---|---|---|
| Local | Serve clients, normally using central switching; also gather RF information | Yes |
| FlexConnect | Serve branch WLANs with supported central/local switching and authentication choices | Yes |
| Monitor | Dedicate radios to monitoring rather than normal client access | No |
| Sniffer | Forward frames heard on a selected channel to a capture system | No on the sniffer radio |
| Bridge/mesh | Use supported wireless backhaul between APs | Depends on model/design |
| Rogue detector, legacy AireOS | Correlate wired observations with suspected rogue devices | No |

A sniffer does not capture every frame everywhere: channel selection, receiver sensitivity, encryption and capture loss limit its view. Monitor mode is not a promise that a device will never transmit under any enabled security function.

**FlexConnect local switching** and **local authentication** are independent settings. A WLAN can send data into a branch VLAN yet use a remote RADIUS server for new authentication. If the WAN fails, already connected clients and new clients may have different outcomes. Continued service depends on supported standalone behavior and reachable local services. An available AP cannot provide a lease from a DHCP server that is across the failed WAN.

Changing AP mode may disrupt service. Whether it requires a reboot depends on the transition and release; some current local/FlexConnect transitions do not. Check status after the change rather than teaching a universal reboot rule.

## Recognize controller interfaces and profiles

Older **AireOS** screens distinguish physical ports from logical interfaces. A port is a connector. A logical interface identifies a function, IP configuration and, where appropriate, VLAN mapping.

| AireOS item | Purpose |
|---|---|
| Management interface | Controller management and, on common newer AireOS platforms, AP-manager/CAPWAP functions |
| Dynamic interface | Map client traffic to a wired VLAN; includes appropriate address/gateway/DHCP-server settings |
| Virtual interface | Internal support for functions such as web authentication and DHCP proxy; not the clients' routed gateway |
| Service port, where present | Separate out-of-band management connection |
| Redundancy port, where present | High-availability communication with a peer |

An AireOS virtual address should not conflict with a real routed host. Cisco documents using a suitable unused documentation address, such as `192.0.2.1`, for this purpose; the number is not inherently incapable of routing. The controller's service-port and redundancy arrangements vary by model.

Catalyst 9800 uses IOS XE interfaces plus **profiles** and **tags**. Its wireless management interface supports AP/controller communication. A WLAN profile holds the SSID and security; a policy profile carries client policy such as VLAN and switching behavior. A policy tag maps a WLAN profile to a policy profile and is assigned to APs. Site and RF tags supply other AP/site/radio settings. A correctly created WLAN still needs an effective assignment to the intended APs.

Learn to translate the purpose, not copy an AireOS “dynamic interface” command into IOS XE. Chapter 38 applies the WLAN settings through the GUI.

## Configure the AP and controller links

Choose the switchport from a written traffic contract: which frames arrive tagged, which arrive untagged, which VLANs are needed, and whether the device uses one link or a supported bundle.

Also follow platform requirements: Cisco documents an 802.1Q trunk for an AireOS controller's distribution-system connection even when this isolated example carries only one native VLAN. Its separate service port is an access-port connection. This controller requirement does not make an AP carrying only untagged management traffic require a trunk.

For a centrally switched AP sending only untagged management traffic into VLAN 10:

```ios SW1
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# spanning-tree portfast
SW1(config-if)# no shutdown
```

For an endpoint explicitly configured to send untagged management in VLAN 10 and tagged locally switched users in VLAN 20:

```ios SW1
SW1(config)# interface fastethernet0/2
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# spanning-tree portfast trunk
SW1(config-if)# no shutdown
```

PortFast here is for the documented endpoint connection, not an arbitrary inter-switch link. Both VLANs must exist. The AP's actual management-tag setting must agree with the switch's native/tagged treatment.

**Power over Ethernet (PoE)** also matters. Confirm that the switch port and total switch power budget support the AP's documented requirements. A link can be up while the AP operates with reduced radio capability because it received insufficient power. On a supported Cisco PoE switch, `power inline auto` enables automatic power allocation and `show power inline` reports the state and allocation. A non-PoE Packet Tracer 2960 model cannot validate a real AP power negotiation; use the AP's supported external supply in that simulation.

**Link aggregation** is equally model-specific. Legacy AireOS LAG uses a static bundle, so the adjacent switch uses `channel-group 1 mode on`. Catalyst 9800 supports negotiated aggregation on documented platforms. Some dual-port Meraki APs support LACP: for example, the documented MR52/53 design uses an AP in passive mode and an upstream switch in active mode. Configure compatible VLANs and native VLAN on both members and the port-channel. Provision the AP through its primary port first and follow its installation guide before adding the second cable.

Do not configure every two-port AP as a bundle. A second port may have another purpose, and hardware support must be confirmed. Aggregation distributes flows; it does not guarantee that one flow uses the combined link rate.

## Verify the design one layer at a time

Check power and Ethernet first, then AP addressing and controller discovery, then AP registration, and finally client forwarding. Representative abbreviated records below illustrate the evidence; field layout depends on software.

```output AireOS — show interface summary
Interface Name  Port  Vlan Id  IP Address      Type     Ap Mgr
management      1     0        192.168.10.5    Static   Yes     ← untagged here; switch native VLAN 10; AP-manager function
users           1     20       192.168.20.5    Dynamic  No      ← client VLAN mapping, not an AP address
virtual         N/A   N/A      192.0.2.1       Static   No
```

```output SW1 — show interfaces trunk (abbreviated)
Port    Mode  Encapsulation  Status    Native vlan
Fa0/24  on    802.1q         trunking  10             ← untagged management design in this example
Port    Vlans allowed on trunk
Fa0/24  10,20                                       ← both required VLANs admitted
```

`show cdp neighbors detail` can identify a neighbor and its advertised address; that is not proof of a DHCP lease or successful CAPWAP join. Use the DHCP binding/AP address and the controller AP table for those checks. AireOS `show ap summary` and Catalyst 9800 `show ap summary` summarize registered APs; their detailed commands and columns differ.

A controller's MAC learned in VLAN 20 proves some traffic from that MAC entered VLAN 20. It does not prove that a wireless client's WLAN mapping is correct. Finish with the intended client's IP settings, controller association/security record and a test to a known reachable destination.

## Exam focus

- Explain where management and client forwarding occur for each architecture.
- Follow discovery, protected control and optional protected data separately; know CAPWAP UDP `5246/5247`.
- Recognize AP modes and the limits of FlexConnect survival during a controller/WAN failure.
- Translate AireOS ports/interfaces to their purposes; recognize the different 9800 profile/tag model.
- Derive access/trunk, native/allowed VLANs, PoE and supported aggregation from the actual AP requirements.
- Treat old AireOS LAG and current LACP-capable platforms as different cases, not one universal controller rule.
