---
id: vlans-and-access-ports
number: 9
title: VLANs & access ports
subtitle: Assign data and voice VLANs, choose host-facing port settings, and verify connectivity and power.
part: switching
domain: switching
minutes: { lesson: 60, lab: 50 }
summary: Separate Layer 2 broadcast domains, configure access and voice VLANs, and read VLAN, interface and MAC-table evidence. Choose endpoint connectivity from its traffic requirements and check both per-port PoE capability and the shared power budget.
objectives:
  v1: ["2.1", "2.1.a", "2.1.b"]
  v2: ["2.2", "2.2.a", "2.2.b", "2.2.c", "2.2.d", "2.2.e"]
prereqs: [ethernet-switching, ipv4-addressing, ios-essentials]
sectionIds:
  Separate Layer 2 networks with VLANs: why-one-switch-needs-many-broadcast-domains
  Create and verify the VLAN database: vlan-numbers-names-and-where-they-live
  Configure an access port: access-ports-how-an-untagged-frame-gets-a-vlan
  Carry voice and data on a phone port: voice-vlan-two-vlans-on-one-access-port
  Check PoE capability and the power budget: poe-power-as-a-negotiated-budget
  Choose the port from the endpoint requirements: one-template-per-endpoint
sources:
  - { title: "Cisco: IEEE 802.3bt and UPOE+ power types, including PSE and PD limits", url: "https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/nb-06-upoe-plus-it-ot-wp-cte-en.html" }
  - { title: "Cisco: Catalyst VLAN configuration guide", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/vlan/vlan-configuration-guide/configure-vlan.html" }
  - { title: "Cisco: Catalyst 2960 voice VLAN configuration", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvoip.html" }
  - { title: "Cisco: Voice VLAN configuration and phone traffic", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst_microswitches/software/releases/15_2_7_e/configuration_guide/vlan/b_1527e_vlan_cms_cg/configuring_voice_vlans.html" }
  - { title: "Cisco: Catalyst 3560 interface and PoE configuration", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_2_se/configuration/guide/scg3560/swint.html" }
  - { title: "Cisco: Catalyst 3650 interface and hardware command reference", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/software/release/16-2/command_reference/b_162_consolidated_3650_cr/b_162_consolidated_3650_cr_chapter_0100.html" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
---

One 24-port switch serves an office: user PCs, printers and IP phones. Out of the box, every port is in a single broadcast domain, so every broadcast from any device reaches all the others, and nothing separates the users from the printers or the phones. Buying a switch for each group would fix that, at a cost. VLANs give you the same separation on one switch through configuration alone.

Chapter 07 showed that every MAC-table entry and every forwarding decision carries a VLAN number. Here you put that number to work. By the end you will be able to create VLANs, place host ports in them, add a voice VLAN for a phone, find a port that is connected but in the wrong network, choose the right port settings for each kind of endpoint, and check that a switch can power the devices attached to it.

## Separate Layer 2 networks with VLANs

A **virtual LAN (VLAN)** is a logical Layer 2 broadcast domain: in effect, a separate switch inside the switch. A broadcast received in VLAN 10 is flooded only to the other ports in VLAN 10. It never reaches a VLAN 20 port, although both VLANs share the same hardware.

The same holds for everything else the switch does. It learns source MAC addresses per VLAN, looks up destinations within the frame's VLAN, and floods an unknown unicast only inside that VLAN.

A **subnet** is an IP-layer address grouping determined by a prefix or mask. A VLAN and a subnet are related design choices, but they are not the same object. A common campus design uses one IP subnet per VLAN. That gives hosts a consistent local network and a router or multilayer-switch interface to use as their gateway.

```diagram
{"type":"topology","title":"Two VLANs on one switch","caption":"An ARP broadcast from PC-A reaches PC-B in VLAN 10, while the VLAN 20 ports remain a separate Layer 2 network.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.168.10.11/24","x":1,"y":1},{"id":"B","kind":"pc","label":"PC-B","sub":"192.168.10.12/24","x":1,"y":5},{"id":"S","kind":"switch","label":"SW1","x":6,"y":3},{"id":"C","kind":"pc","label":"PC-C","sub":"192.168.20.13/24","x":11,"y":1},{"id":"D","kind":"printer","label":"Printer","sub":"192.168.20.20/24","x":11,"y":5}],"links":[{"from":"A","to":"S","toLabel":"Fa0/1 · VLAN 10"},{"from":"B","to":"S","toLabel":"Fa0/2 · VLAN 10"},{"from":"S","to":"C","fromLabel":"Fa0/3 · VLAN 20"},{"from":"S","to":"D","fromLabel":"Fa0/4 · VLAN 20"}],"trace":{"flows":[{"path":["A","S","B"],"label":"ARP request for 192.168.10.12","tags":{"A":"ARP for 192.168.10.12","S":"Broadcast · VLAN 10 ports only"}}]}}
```

Consider PC-A at `192.168.10.11/24` and PC-B at `192.168.10.12/24`. Both regard the other address as local, so PC-A uses ARP for PC-B rather than sending the packet to a gateway. If a technician moves PC-B's switchport into VLAN 20 without changing its IP configuration, the ARP request remains in VLAN 10. The physical link can be healthy while the host is attached to the wrong broadcast domain.

The reverse fault also occurs. Two hosts in the same VLAN whose addresses fall in different subnets cannot talk directly either, because each treats the other as remote and looks for a gateway. Check both the VLAN and the IP addressing.

Hosts in different VLANs can communicate only through a router, which Chapter 11 adds. Until then, a failed ping between VLANs is the expected result.

:::facts
- VLAN membership is Layer 2; a subnet mask determines a host's IP network membership.
- On the Catalyst platforms used here, normal-range VLANs are `1–1005`; extended-range VLANs are `1006–4094`.
- VLAN `0` is used for priority-tagged frames rather than ordinary VLAN membership; `4095` is reserved. Neither is an ordinary configurable user VLAN.
- VLAN `1` is the default VLAN: every port starts in it, and it cannot be deleted or renamed. Legacy VLANs `1002–1005` also exist by default and cannot be deleted. Use ordinary user VLANs such as `10`, `20` and `30` in this exercise.
- `switchport mode access` fixes the port's mode; `switchport access vlan 10` sets its data VLAN. These are separate settings.
- A deleted data VLAN does not automatically move assigned ports back into VLAN 1.
:::

## Create and verify the VLAN database

A VLAN's number is its forwarding identity. Its name is an administrative label. Two switches can use different names for VLAN 10, but that does not create different VLAN tags; keep names consistent to make the documentation easier to follow.

| VLAN range | Use in this course |
|---|---|
| `1` | Default VLAN: every port starts here, and it cannot be deleted |
| `2–1001` | Ordinary normal-range user VLANs |
| `1002–1005` | Legacy reserved VLANs displayed by the lab Catalyst image |
| `1006–4094` | Extended-range VLANs; support and persistence depend on platform/VTP behavior |

Create the VLAN before you assign ports to it. If you assign a port to a VLAN that does not exist, IOS creates the VLAN for you with a default name, but do not rely on that.

```ios SW1
SW1# configure terminal
SW1(config)# vlan 10
SW1(config-vlan)# name USERS
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# name PRINTERS
SW1(config-vlan)# exit
SW1(config)# vlan 30
SW1(config-vlan)# name VOICE
SW1(config-vlan)# end
SW1# show vlan brief
```

VLANs are not stored with the rest of the configuration. Normal-range VLANs live in the VLAN database, the file `vlan.dat` in flash, while port assignments are interface commands in the running configuration. That is why `show vlan brief`, not `show running-config`, tells you which VLANs exist, and why erasing the startup configuration leaves the VLANs in place until `vlan.dat` is deleted too.

**VTP**, the VLAN Trunking Protocol, can copy VLAN definitions between switches. These labs do not use it: you create the VLANs on each switch yourself.

Deleting a VLAN with `no vlan 20` removes the VLAN but not the port assignments. Ports assigned to it keep `switchport access vlan 20`, become inactive and forward no data until you recreate the VLAN or move them to one that exists. They do not fall back to VLAN 1. A voice VLAN on the same port is a separate VLAN and is not affected.

## Configure an access port

A PC knows nothing about VLANs, so the switch port decides for it. An **access port** carries one data VLAN for an endpoint that sends ordinary, untagged Ethernet frames. On reception, the switch classifies those frames into the access VLAN. When it sends ordinary data frames back toward that endpoint, they are untagged. The endpoint does not need to know the switch's VLAN number.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/2
SW1(config-if)# description User workstation
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces fastethernet0/2 switchport
```

The two `switchport` commands do different jobs. A Catalyst port's default mode is dynamic, which means it can negotiate itself into a trunk with whatever is plugged in. `switchport mode access` fixes it as an access port, which is what you want on every host-facing port. `switchport access vlan 10` then chooses the VLAN. Chapter 10 explains trunks and their negotiation.

In the output below, the **administrative mode** is what you configured and the **operational mode** is what the port is doing now. Read the access VLAN's status as well: `10 (USERS)` is a working VLAN, while `10 (Inactive)` means VLAN 10 does not exist on this switch, even though the link is up.

```output SW1# show interfaces fastethernet0/2 switchport — representative excerpt
Name: Fa0/2
Switchport: Enabled
Administrative Mode: static access  ← explicitly configured access mode
Operational Mode: static access
Access Mode VLAN: 10 (USERS)         ← the data VLAN
Voice VLAN: none
```

One kind of access port carries a second VLAN: a port with a phone on it. The next section covers it.

## Carry voice and data on a phone port

A desk usually has one wall socket but two devices, a phone and a PC. An IP phone therefore contains a small three-port switch: one port faces the access switch, one connects the PC, and one is the phone itself. Voice suffers when it competes with data, so the PC's data stays in the access VLAN while the phone's traffic uses a separate **voice VLAN**, both over the one cable.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# description Phone with attached PC
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# switchport voice vlan 30
SW1(config-if)# no shutdown
SW1(config-if)# end
```

An **802.1Q tag** is added information in an Ethernet frame that identifies its VLAN. For the configured tagged-voice behavior, the PC's frames arrive untagged and are classified into VLAN 10. The phone sends its voice-VLAN frames tagged with VLAN ID 30. The port remains an access port with the voice-VLAN feature; it is not configured as a general-purpose trunk carrying an arbitrary list of VLANs. Chapter 10 develops the tag format and trunk configuration.

| Traffic presented to the switch | Classification in this example |
|---|---|
| Untagged PC data relayed through the phone | Access VLAN 10 |
| Phone traffic correctly tagged for the configured voice VLAN | Voice VLAN 30 |
| Phone discovery/control traffic | Interpret by the protocol; it does not prove that a voice call is established |

Nobody configures the voice VLAN on the phone by hand. The switch tells the phone which VLAN to tag its traffic with, using Cisco Discovery Protocol (**CDP**) for Cisco phones or **LLDP-MED**, the standards-based equivalent. Both run between directly connected devices; Chapter 12 teaches them.

To verify the switch side, check that the voice VLAN exists and is active, that the port shows the intended access and voice VLANs, and that the phone has power. A PC that works through the phone proves only the data VLAN. The phone's own address and its registration with a call server depend on services outside this chapter.

On many Catalyst switches, configuring a voice VLAN also enables PortFast on the port, which Chapter 15 explains.

## Check PoE capability and the power budget

Phones, access points and cameras are often mounted where there is no power socket. **Power over Ethernet (PoE)** supplies their power over the same copper cable that carries their data. The switch or injector is the **power sourcing equipment (PSE)**; the phone, AP or other endpoint is the **powered device (PD)**. A non-PoE Ethernet port cannot be made into a PoE port by adding a configuration command.

There are two separate capacity checks. First, the port, cable and powered device must support the required power level. Second, the switch's shared budget must have enough allocation remaining. A switch with many PoE+ ports does not necessarily have enough total power to run every port at its maximum simultaneously.

| Standard | Maximum PSE power | Power available at the PD under the standard's limits |
|---|---:|---:|
| IEEE 802.3af | 15.4 W | 12.95 W |
| IEEE 802.3at (PoE+) | 30 W | 25.5 W |
| IEEE 802.3bt Type 3 | Up to 60 W | Up to 51 W |
| IEEE 802.3bt Type 4 | Up to 90 W | Up to 71.3 W |

The difference between the two columns is the power lost in the cable. In an exam question, check which end a figure refers to: an AP that needs 25 W at its own input fits 802.3at, whose device-side limit is 25.5 W.

For example, suppose a switch has a usable PoE budget of 370 W. Ten phones reserve 6.3 W each, leaving `370 − 63 = 307 W`. If each additional AP requires a 30 W allocation, ten APs fit because `10 × 30 = 300 W`; eleven do not. The switch budgets by what it has allocated to each port, not by what the devices happen to draw at that moment.

```ios SW2
SW2# show power inline
SW2# configure terminal
SW2(config)# interface gigabitethernet1/0/1
SW2(config-if)# power inline auto
SW2(config-if)# end
SW2# show power inline
```

These commands exist only on PoE switches. `auto`, the default, detects a powered device and allocates power to it; `never` disables PoE on the port. `power inline auto max 7000` caps the port at 7000 mW, or 7 W. Lowering the cap does not help a device that really needs more power.

:::trap A connected Ethernet cable does not prove enough power
Check PSE capability, PD requirements, administrative PoE state, cabling and the shared budget. A power-denied indication needs those checks; an arbitrary VLAN change does not increase the power budget. A powered AP can also run with reduced features when its available power is insufficient for its full operating mode.
:::

## Choose the port from the endpoint requirements

Not everything at the edge of the network is a PC, and the v2.0 exam asks you to pick port settings for each kind of endpoint. Begin with what the endpoint puts on the wire. Does it send one untagged network or several tagged ones? Does it need PoE? Does it forward frames from other devices? Does it use several links as one bundle?

A **trunk** carries several VLANs over one physical link while retaining their separate identities. A virtual host can run several software-based computers, so its uplink may need several such networks. A **tunnel** carries one traffic exchange inside another; an AP can carry client traffic to its controller inside the AP's own IP exchange instead of presenting each client's VLAN separately on the local wire. For this selection exercise, use the stated tagged or untagged requirements; building virtual hosts and wireless tunnels comes later.

**Link Aggregation Control Protocol (LACP)** helps peers agree to treat several compatible physical links as one logical bundle. One ordinary host cable does not need a bundle. Chapter 13 teaches its negotiation, configuration and failure behavior.

| Endpoint requirement | Starting connectivity choice | Continue with |
|---|---|---|
| PC, printer or IoT device using one untagged network | Access port in its intended VLAN; PoE only where required | Verification in this chapter |
| Cisco phone with a PC behind it | Data access VLAN plus the intended voice VLAN | Phone provisioning and power checks |
| AP carrying its own untagged management traffic and tunneling client traffic to a controller | An access VLAN can serve that uplink | Wireless architecture in Chapter 37 |
| AP or virtual host presenting several VLANs on one uplink | A trunk whose tagging matches the endpoint | Trunk configuration in Chapter 10 |
| Server or appliance configured for LACP | Compatible bundle at both ends | EtherChannel in Chapter 13 |
| Appliance that bridges other devices' frames | Review VLANs, MAC sources and loop behavior before applying edge assumptions | Chapters 14–16 |

This chapter teaches the choice and the access and voice configuration. [Trunks](#/chapter/trunks-dtp), [EtherChannel](#/chapter/etherchannel), [STP protection](#/chapter/stp-protection) and [Layer 2 security](#/chapter/layer2-security) provide those complete procedures.

## Verify and troubleshoot

Use a short evidence chain: physical state, operational port mode, active VLAN membership, learned MAC addresses, then host addressing and reachability. Each command answers a different part of that chain.

| Command or test | What it establishes | What it does not establish alone |
|---|---|---|
| `show interfaces status` | Link state and a summary of the port's VLAN/mode | Correct host IP settings or application access |
| `show vlan brief` | Defined VLANs, status and displayed port membership | The full state of trunks or host reachability |
| `show interfaces fa0/1 switchport` | Administrative/operational mode and data/voice settings | Phone registration or a complete end-to-end VLAN path |
| `show mac address-table` | Where source addresses have been learned by VLAN | A successful application session |
| `show power inline` | Reported PoE state and allocation information | Correct VLAN/IP configuration |

For a moved workstation, compare its documented VLAN with the actual port. If its MAC is learned in VLAN 20 but its address plan belongs to VLAN 10, do not change the host address merely to fit the mistaken port. Restore the intended assignment, generate fresh traffic, and verify the MAC is learned in the correct VLAN.

For a newly created or restored VLAN, check that it is active before testing again. On a single-switch lab, same-VLAN peers with compatible addresses should communicate once links and forwarding state are ready. Different VLANs need an appropriate Layer 3 path; failure between them is expected when no router is present.

## Exam focus

- Distinguish a VLAN, an IP subnet, a physical link and a host's gateway.
- Create and name VLANs; configure and verify static access-port membership.
- Know the default VLAN: every port starts in VLAN 1, which cannot be deleted.
- Explain what happens to ports whose VLAN is deleted: they go inactive and do not return to VLAN 1.
- Read administrative versus operational mode and VLAN status from switchport output.
- Explain untagged data and tagged voice for the stated phone configuration.
- Choose access, voice or later trunk/bundle work from the endpoint's actual requirements.
- Check PoE capability and budget separately, using the correct units and allocation assumptions.
- Diagnose from VLAN, MAC-table, interface and host evidence rather than link lights alone.

Before continuing, prove same-VLAN communication and explain why an active but wrongly assigned port can fail. Chapter 10 extends these same VLANs to a second switch over one trunk; it does not yet add a path between different VLANs.
