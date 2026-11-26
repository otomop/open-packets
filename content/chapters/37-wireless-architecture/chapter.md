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

You have fifty access points to install, and for every one of them the switch team asks the same question: is this port an access port or a trunk, and which VLANs does it carry? You cannot answer from the AP's model name. The answer depends on where a wireless client's traffic leaves the wireless system and enters a wired VLAN, and that depends on the wireless architecture.

[Chapter 36](#/chapter/wireless-principles) followed a client's frame over the radio to the AP. This chapter follows it from the AP onto the wire, using the access, trunk and native-VLAN rules from [chapter 10](#/chapter/trunks-dtp). By the end you will be able to compare autonomous, controller-based and cloud-managed designs, follow an AP as it finds and joins its controller, name the job of each AP mode, and choose the switchport configuration for an AP or a controller.

## Separate management from client forwarding

:::facts
- CAPWAP uses controller UDP port `5246` for control and `5247` for data.
- In a centrally switched WLAN, client traffic reaches its wired VLAN at the controller. With local switching, it reaches that VLAN at the AP.
- Use an access port for one untagged VLAN; use an 802.1Q trunk when the device must carry tagged VLANs. The frames on the cable decide the port mode, not the name of the architecture.
- CAPWAP control traffic is encrypted with DTLS once the AP starts to join; discovery comes first, unencrypted. CAPWAP data encryption is a separate, optional setting that is off by default.
- An AireOS controller LAG does not negotiate: the switch side uses `channel-group` mode `on`. Catalyst 9800 uses a different configuration model and supports LACP.
:::

Every AP handles three kinds of traffic, and they do not have to share a VLAN or a path:

- The **management plane** is how you configure and monitor the AP: SSH, a web page or a dashboard connection.
- The **control plane** keeps the wireless system running, such as an AP reporting its clients and receiving its channel and power settings.
- The **data plane** is the users' own traffic.

These are functions, not three cables. One Ethernet cable normally carries all of them; the design question is which VLAN each one uses on it.

One earlier idea does much of the work here. A **tunnel** carries one packet inside another, and devices in the path read only the outer addresses, as with VPNs in [chapter 35](#/chapter/vpns-ipsec).

Take an AP with management address `192.168.10.21` and a wireless client in `192.168.20.0/24`. The AP reaches its controller through VLAN 10 and sends the client's traffic to the controller inside a tunnel. The switch sees only the outer packets, which belong to VLAN 10, so the AP needs only an access port in VLAN 10. A trunk would add configuration that carries nothing.

Now change the WLAN to local switching. The AP must put the client's frames directly into VLAN 20. If management stays untagged in VLAN 10, the link needs a trunk with native VLAN 10 and tagged VLAN 20. No IP address changed. The place where client traffic leaves the wireless system did.

## Compare the three architectures

One AP is easy to run by hand. Fifty are not: every SSID, security setting and channel choice must be repeated on each AP, and nothing coordinates the clients that roam between them. The three architectures differ in where that configuration and coordination live.

An **autonomous AP** is self-contained. It holds its own configuration, authenticates its own clients and bridges each SSID straight into a wired VLAN. You manage each one through its own IP address. One SSID in one VLAN needs only an access port; several SSIDs in different VLANs need a trunk, and those VLANs must reach every AP.

A **controller-based AP**, usually called a **lightweight AP**, depends on a **wireless LAN controller (WLC)**. It gets its configuration from the WLC and builds a tunnel to it. Cisco's **split-MAC** design divides the 802.11 work between the two:

| Stays in the lightweight AP | Moves to the WLC |
|---|---|
| Sending beacons and probe responses | Client authentication and security policy |
| Acknowledging and retransmitting frames | Association and roaming between APs |
| Buffering frames for power-saving clients | RF management: each AP's channel and transmit power |
| Encrypting and decrypting each wireless frame | Mapping WLANs to wired VLANs; QoS policy |

The split follows timing. An 802.11 acknowledgement is due within microseconds, too soon for a round trip to a controller several hops away, so the AP sends it. Choosing each AP's channel works best on a device that sees all the APs, so the WLC does it.

A **cloud-managed AP** gets its configuration from a cloud service; Cisco's example is the Meraki dashboard. The AP keeps a management connection to the cloud, but user traffic does not pass through it. In Meraki **bridge mode** the AP bridges client traffic into the local wired VLAN, much as an autonomous AP does. Meraki SSIDs can also use NAT mode or a tunnel to a concentrator, so read the SSID mode before you draw the data path.

| Design | Main configuration location | Example data path | Port implication |
|---|---|---|---|
| Autonomous | Individual AP | Client → AP → local VLAN | Access or trunk, according to tagging |
| Controller, central switching | WLC | Client → AP → CAPWAP → WLC → client VLAN | AP can use access; WLC often needs trunk |
| Controller, local switching | WLC; AP applies local policy | Client → AP → branch VLAN | AP often needs trunk |
| Meraki bridge mode | Cloud dashboard | Client → AP → local VLAN | Access or trunk, according to tagging |

Because management and forwarding are separate, they fail separately. If a bridge-mode AP loses its dashboard connection, its clients keep reaching the local network; you only lose the ability to change and monitor it.

```diagram
{"type":"topology","title":"Fig 37.1 — The same client VLAN can leave at different devices","caption":"The central WLAN reaches VLAN 20 at WLC1; the locally switched WLAN reaches VLAN 20 at AP2.","nodes":[{"id":"C1","kind":"laptop","label":"Central client","x":1,"y":1},{"id":"AP1","kind":"ap","label":"AP1","sub":"untagged management","x":4,"y":1},{"id":"SW","kind":"switch","label":"SW1","x":7,"y":3},{"id":"WLC","kind":"wlc","label":"WLC1","sub":"client VLAN 20","x":11,"y":1},{"id":"AP2","kind":"ap","label":"AP2","sub":"local VLAN 20","x":4,"y":5},{"id":"C2","kind":"laptop","label":"Local client","x":1,"y":5}],"links":[{"from":"C1","to":"AP1","style":"wireless"},{"from":"AP1","to":"SW","label":"access VLAN 10"},{"from":"SW","to":"WLC","label":"trunk 10,20","accent":true},{"from":"C2","to":"AP2","style":"wireless"},{"from":"AP2","to":"SW","label":"native 10; tagged 20","accent":true}],"trace":{"flows":[{"path":["C1","AP1","SW","WLC"],"label":"Centrally switched client traffic","tags":{"AP1":"Into CAPWAP · UDP 5247 to WLC1","SW":"Outer packet in VLAN 10","WLC":"Leaves the tunnel into VLAN 20"}},{"path":["C2","AP2","SW"],"tone":"alt","label":"Locally switched client traffic","tags":{"AP2":"Local switching · tagged VLAN 20","SW":"Received tagged in VLAN 20"}}]}}
```

## Place the controller

A controller is a function that can run in several places. Its position decides how many APs it serves and how far client traffic travels to reach it. The exam names four deployment models:

| Deployment model | Where the WLC runs | Typical scale | Typical use |
|---|---|---|---|
| Unified (centralized) | Dedicated appliance at a central site | Up to about 6,000 APs | Large campus |
| Cloud-based | Virtual machine in a data center or cloud | Up to about 3,000 APs | Organizations that already run a private cloud |
| Embedded | Inside an access-layer switch | Up to about 200 APs | Small campus or remote site |
| Mobility Express | Inside one of the APs | Up to about 100 APs | Small branch |

The AP counts are the round figures used in Cisco Press CCNA material; real limits depend on the product. Remember the order: the closer the controller sits to the edge, the fewer APs it serves.

A **virtual machine (VM)** is a software-defined computer running on a physical host; [chapter 39](#/chapter/virtualization) covers it. Catalyst 9800-CL is Cisco's controller in VM form.

**Cloud-based controller** and **cloud-managed AP** are different things. A cloud-based controller is still a WLC: its APs discover it, join it with CAPWAP and can tunnel client data to it. A cloud-managed AP has no WLC; the Meraki dashboard manages it and never carries its client data.

Mobility Express is the AireOS-era name for a controller inside an AP. Its Catalyst successor, the Embedded Wireless Controller (EWC) on an AP, reached end of sale in November 2024, with IOS XE 17.15.x its final software train.

Placement has a forwarding cost. With a central controller and central switching, a branch laptop printing to a printer in the same room sends every packet across the WAN to the controller and back. FlexConnect, later in this chapter, removes that detour.

## Follow CAPWAP discovery and forwarding

A new lightweight AP knows nothing about your WLANs. Before it serves a client it must get an IP address, find a controller, prove its identity and download its configuration. All of that, and later the clients' data, travels in **CAPWAP**, Control and Provisioning of Wireless Access Points.

CAPWAP builds two tunnels between the AP's IP address and the controller's:

| Tunnel | Controller UDP port | Carries | Protection |
|---|---|---|---|
| Control | `5246` | Join, configuration and AP management messages | Encrypted with DTLS |
| Data | `5247` | Client traffic to and from the WLC | Unencrypted by default; DTLS optional |

**DTLS**, Datagram Transport Layer Security, is TLS adapted to UDP. The AP and controller authenticate each other with certificates, then encrypt the session. It is separate from the WPA exchange between a client and the AP.

The outer packet is ordinary IP and UDP between the AP and controller addresses, so routers forward it like any other packet. The AP and its controller can be in different subnets, and a centrally switched client's VLAN does not have to exist at the AP.

An AP joins in a fixed order:

1. It powers up and gets an IP address, mask and gateway, normally from DHCP ([chapter 24](#/chapter/dhcp)).
2. It sends unencrypted CAPWAP discovery requests to UDP `5246` on every controller address it can find, and collects the responses.
3. It chooses a controller and sets up DTLS; each side checks the other's certificate.
4. It joins, first downloading the controller's software image if its own differs.
5. It downloads its configuration and starts serving clients.

Step 2 needs controller addresses. A Cisco AP collects them in four ways:

- a broadcast on its own subnet, which routers do not forward;
- addresses stored from an earlier join or configured on the AP, such as a primary and secondary controller;
- DHCP option 43 in its lease;
- a DNS lookup ([chapter 25](#/chapter/dns)) of `CISCO-CAPWAP-CONTROLLER` in the domain its lease supplied.

A new AP in a different subnet from its controller has no stored address and its broadcast stays local, so it depends on option 43 or DNS. Option 43 is vendor-specific. For Cisco APs, `f104.c0a8.0a05` means type `f1` (suboption 241), length `04` (one IPv4 address) and the address `c0a8.0a05`, which is `192.168.10.5`.

```ios R1 — example inside the AP DHCP pool
R1(config)# ip dhcp pool AP-MGMT
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# option 43 hex f104.c0a8.0a05
R1(dhcp-config)# exit
```

Option 43 supplies only an address. The AP still needs a route to the controller, UDP `5246` and `5247` permitted along the path, and a valid certificate.

```diagram
{"type":"sequence","title":"Fig 37.2 — From an IP address to a registered AP","actors":["AP","DHCP server","WLC"],"steps":[{"from":0,"to":1,"label":"Obtain IP settings","note":"lease, gateway and optional discovery information"},{"from":0,"to":2,"label":"CAPWAP discovery","note":"UDP 5246; before the DTLS session"},{"from":2,"to":0,"label":"Discovery response"},{"from":0,"to":2,"label":"Establish DTLS and join","note":"certificate and compatibility checks","accent":true},{"from":2,"to":0,"label":"Configuration and operational state"},{"from":0,"to":2,"label":"Centrally switched client data","note":"UDP 5247; separate data-encryption policy"}],"caption":"A lease proves address allocation; a registered AP record proves that discovery and the subsequent join completed."}
```

Once the AP is running, centrally switched client traffic uses the data tunnel. The AP removes the wireless encryption from the client's frame, wraps the frame in a CAPWAP packet and sends it to the controller on UDP `5247`. The controller unwraps it and forwards it into the client's VLAN. Return traffic takes the reverse path.

:::trap Radio encryption is not tunnel encryption
WPA2 and WPA3 protect the radio link, and that protection ends at the AP. On the wired path to the controller, client data is encrypted only if CAPWAP data DTLS is enabled or the application encrypts it, as HTTPS does. Only the control tunnel is always encrypted.
:::

## Choose the AP operating mode

A lightweight AP's mode sets its job. **Local** is the default. The other modes turn the AP into a branch AP, a sensor or a wireless link.

| Mode | Main job | Ordinary wireless clients? |
|---|---|---|
| Local | Default. Serve clients and tunnel their data to the WLC; scan other channels between transmissions | Yes |
| FlexConnect | Serve a branch: switch client traffic locally and keep working if the WLC is unreachable | Yes |
| Monitor | Dedicated sensor for rogue devices, intrusion detection and location | No |
| Sniffer | Capture 802.11 frames on one channel and send them to a PC running an analyzer such as Wireshark | No |
| Rogue detector, legacy AireOS | Radios off; watch the wired network for MAC addresses of rogue devices that other APs heard | No |
| SE-Connect | Spectrum analysis: feed a PC running spectrum-analysis software to find interference | No |
| Bridge/mesh | Link networks or mesh APs over a wireless backhaul | Depends on model/design |
| Flex+Bridge | FlexConnect operation on a mesh AP | Yes |

To sort them: local and FlexConnect serve clients, bridge modes carry traffic between APs, and the rest observe. A sniffer captures Wi-Fi frames on one channel; SE-Connect analyzes raw radio energy, including interference that is not Wi-Fi.

Take **FlexConnect** at a branch whose controller sits at headquarters across a WAN. For each WLAN you choose central switching, where data is tunnelled to the WLC, or **local switching**, where the AP puts data straight into a branch VLAN and the printing detour disappears.

If the WAN fails, the AP loses its controller and enters standalone mode. Locally switched WLANs keep forwarding for connected clients. Whether a new client can join depends on authentication, a separate setting from switching. The AP can check a pre-shared key itself, so a PSK WLAN keeps accepting clients. An 802.1X WLAN needs a RADIUS server; if the only one is at headquarters, new clients fail until the WAN returns. New clients also need DHCP that is reachable at the branch.

## Recognize controller interfaces and profiles

On an AireOS controller, a **port** is a physical connector and an **interface** is a logical item with an IP address and, where relevant, a VLAN.

| AireOS port | Purpose | Connects to |
|---|---|---|
| Distribution system port | Carries AP and client traffic in normal operation | A switch trunk; several ports can form a LAG |
| Service port | Out-of-band management, for example initial setup or recovery | A switch access port |
| Console port | Out-of-band serial management | A terminal, not the network |
| Redundancy port, where present | High-availability link to a peer controller | The peer controller |

| AireOS interface | Purpose |
|---|---|
| Management interface | In-band management such as the web GUI, SSH and RADIUS; on current AireOS it is also the address APs discover and join (the AP-manager function) |
| Dynamic interface | Maps a WLAN to a wired VLAN; has an address in that VLAN plus its gateway and DHCP server. One per client VLAN |
| Virtual interface | An address the controller presents to clients for jobs such as DHCP relay and web authentication; not the clients' default gateway |

A dynamic interface links a WLAN to a VLAN. Suppose WLAN `STAFF` is mapped to a dynamic interface named `users` in VLAN 20. A client that joins `STAFF` gets a VLAN 20 address, and its traffic leaves the controller's distribution port tagged with VLAN 20. That is why the controller's switch port is a trunk.

Give the virtual interface an unused, non-routed address such as `192.0.2.1`; older deployments often used `1.1.1.1`.

Catalyst 9800 replaces this model with IOS XE interfaces plus **profiles** and **tags**. APs join its wireless management interface. A WLAN profile holds the SSID and security settings; a policy profile holds client policy such as the VLAN and central or local switching. A policy tag pairs the two and is assigned to APs. The VLAN in a policy profile does the job of an AireOS dynamic interface. Chapter 38 applies the WLAN settings through the GUI.

## Configure the AP and controller links

Choose each switchport from the frames on its cable: which arrive untagged and which arrive tagged. Applied to the devices in this chapter:

| Device and design | Frames on the cable | Switch port |
|---|---|---|
| Lightweight AP, central switching | Untagged CAPWAP in the AP management VLAN | Access |
| FlexConnect AP, local switching | Untagged management plus tagged client VLANs | Trunk |
| Autonomous AP, several SSIDs | Management plus one VLAN per SSID | Trunk |
| WLC distribution port | Management plus every centrally switched client VLAN | Trunk |

Cisco documents the AireOS distribution port as an 802.1Q trunk even when it carries a single VLAN.

For a centrally switched AP sending only untagged management traffic into VLAN 10:

```ios SW1
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# spanning-tree portfast
SW1(config-if)# no shutdown
```

For an AP that sends untagged management in VLAN 10 and tagged, locally switched users in VLAN 20:

```ios SW1
SW1(config)# interface fastethernet0/2
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# spanning-tree portfast trunk
SW1(config-if)# no shutdown
```

An AP is an end device, so PortFast from [chapter 15](#/chapter/stp-protection) is appropriate; on a trunk it needs the `trunk` keyword. Both VLANs must exist on the switch, and the native VLAN must match the VLAN the AP leaves untagged.

**Power over Ethernet (PoE)** is part of the same decision, because most APs take their power from the switch. The port must support the PoE standard the AP needs and the switch must have enough power budget left. An underpowered AP can still link up and join but run with reduced radio capability. `power inline auto`, the default on Cisco PoE ports, lets the port detect and power the device; `show power inline` reports what each port was given.

**Link aggregation** gives a controller more capacity and survives a cable failure. An AireOS **LAG** bundles the distribution ports but runs neither LACP nor PAgP, so the switch uses the static mode from [chapter 13](#/chapter/etherchannel), and the port channel is a trunk:

```ios SW1 — two links to an AireOS controller LAG
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# switchport mode trunk
SW1(config-if-range)# switchport trunk native vlan 10
SW1(config-if-range)# switchport trunk allowed vlan 10,20
SW1(config-if-range)# channel-group 1 mode on
```

Catalyst 9800 appliances also support LACP and PAgP. A few two-port APs bundle too: the Meraki MR52 and MR53 run LACP in passive mode, so the switch uses mode `active`. Check the AP's guide first; a second AP port often has another purpose.

## Verify the design one layer at a time

When a wireless client cannot connect, start at the cable and work upward:

1. Power and link: `show power inline` and the port's status.
2. Port mode and VLANs: `show interfaces trunk` or `show interfaces fastethernet0/1 switchport`.
3. The AP's address: `show ip dhcp binding` on the DHCP server.
4. The AP's join: `show ap summary` on the WLC.
5. Client service: the client's IP settings and a test to a known destination.

The records below are abbreviated; column layout varies by software.

```output AireOS — show interface summary
Interface Name  Port  Vlan Id   IP Address      Type     Ap Mgr
management      1     untagged  192.168.10.5    Static   Yes     ← untagged here; switch native VLAN 10; AP-manager function
users           1     20        192.168.20.5    Dynamic  No      ← client VLAN mapping, not an AP address
virtual         N/A   N/A       192.0.2.1       Static   No
```

```output SW1 — show interfaces trunk (abbreviated)
Port    Mode  Encapsulation  Status    Native vlan
Fa0/24  on    802.1q         trunking  10             ← untagged management design in this example
Port    Vlans allowed on trunk
Fa0/24  10,20                                       ← both required VLANs admitted
```

Read the two together. The controller sends management untagged, and the switch places untagged frames on Fa0/24 into native VLAN 10. The controller tags `users` with VLAN 20, and the trunk allows VLAN 20. If the trunk allowed only VLAN 10, APs would still join, but no client would get a VLAN 20 address.

Each check proves only its own layer. `show cdp neighbors detail` identifies the AP on a port, not that it joined a controller. An AP listed in `show ap summary`, a command on both AireOS and Catalyst 9800, has joined, but no client has been tested.

## Exam focus

- Compare autonomous, lightweight and cloud-managed APs: where each is configured and where client traffic enters the wired network.
- Split-MAC: real-time 802.11 work stays in the AP; authentication, roaming, RF management and VLAN mapping move to the WLC.
- Rank the WLC deployment models: unified, cloud-based, embedded, Mobility Express.
- CAPWAP control uses UDP `5246` and is DTLS-encrypted; data uses UDP `5247` with optional encryption. Know the four discovery sources.
- Match each AP mode to its job, and say what a FlexConnect AP still does when its WLC is unreachable.
- Separate AireOS ports (distribution system, service, console, redundancy) from interfaces (management, dynamic, virtual).
- Derive access or trunk, native and allowed VLANs, and PoE from the frames on the cable.
- An AireOS LAG needs `channel-group` mode `on` on the switch.
