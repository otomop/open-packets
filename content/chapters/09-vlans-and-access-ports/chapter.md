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

Ethernet switching taught you how a switch learns addresses and forwards frames. VLANs define which Layer 2 network those decisions belong to. In this chapter, you will create VLANs, assign host-facing ports, distinguish data from voice traffic, and diagnose a connected port that serves the wrong network. You will also check the power requirements of phones, access points and other powered endpoints.

## Separate Layer 2 networks with VLANs

A **virtual LAN (VLAN)** is a logical Layer 2 broadcast domain. In an ordinary VLAN-aware switching configuration, an Ethernet broadcast received in VLAN 10 is forwarded only to eligible forwarding ports in VLAN 10, excluding the receiving port. It is not copied into VLAN 20 merely because both VLANs use the same physical switch.

The switch learns source MAC addresses in a VLAN context and looks up destinations within that context. Unknown unicast flooding remains inside the applicable VLAN. Multicast forwarding may also be controlled by multicast features, so do not use the shortcut that every multicast frame always goes to every port.

A **subnet** is an IP-layer address grouping determined by a prefix or mask. A VLAN and a subnet are related design choices, but they are not the same object. A common campus design uses one IP subnet per VLAN. That gives hosts a consistent local network and a router or multilayer-switch interface to use as their gateway.

```diagram
{"type":"topology","title":"Two VLANs on one switch","caption":"An ARP broadcast from PC-A reaches PC-B in VLAN 10, while the VLAN 20 ports remain a separate Layer 2 network.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.168.10.11/24","x":1,"y":1},{"id":"B","kind":"pc","label":"PC-B","sub":"192.168.10.12/24","x":1,"y":5},{"id":"S","kind":"switch","label":"SW1","x":6,"y":3},{"id":"C","kind":"pc","label":"PC-C","sub":"192.168.20.13/24","x":11,"y":1},{"id":"D","kind":"printer","label":"Printer","sub":"192.168.20.20/24","x":11,"y":5}],"links":[{"from":"A","to":"S","toLabel":"Fa0/1 · VLAN 10"},{"from":"B","to":"S","toLabel":"Fa0/2 · VLAN 10"},{"from":"S","to":"C","fromLabel":"Fa0/3 · VLAN 20"},{"from":"S","to":"D","fromLabel":"Fa0/4 · VLAN 20"}],"trace":{"flows":[{"path":["A","S","B"],"label":"ARP request for 192.168.10.12","tags":{"A":"ARP for 192.168.10.12","S":"Broadcast · VLAN 10 ports only"}}]}}
```

Consider PC-A at `192.168.10.11/24` and PC-B at `192.168.10.12/24`. Both regard the other address as local, so PC-A uses ARP for PC-B rather than sending the packet to a gateway. If a technician moves PC-B's switchport into VLAN 20 without changing its IP configuration, the ARP request remains in VLAN 10. The physical link can be healthy while the host is attached to the wrong broadcast domain.

Conversely, putting two hosts in the same VLAN does not force their IP configurations to be compatible. If their addresses and masks place them in different subnets, a router or other appropriate IP configuration may be needed. Check both VLAN membership and IP addressing before diagnosing a routing failure.

VLANs reduce broadcast scope and provide useful segmentation. They do not automatically supply a firewall policy. Inter-VLAN routing is introduced in Chapter 11; once routing is enabled, access lists or other controls determine which routed communications are allowed.

:::facts
- VLAN membership is Layer 2; a subnet mask determines a host's IP network membership.
- On the Catalyst platforms used here, normal-range VLANs are `1–1005`; extended-range VLANs are `1006–4094`.
- VLAN `0` is used for priority-tagged frames rather than ordinary VLAN membership; `4095` is reserved. Neither is an ordinary configurable user VLAN.
- VLAN `1` and legacy VLANs `1002–1005` exist by default on the lab Catalyst switch. Use ordinary user VLANs such as `10`, `20` and `30` in this exercise.
- `switchport mode access` fixes the port's mode; `switchport access vlan 10` sets its data VLAN. These are separate settings.
- A deleted data VLAN does not automatically move assigned ports back into VLAN 1.
:::

## Create and verify the VLAN database

A VLAN's number is its forwarding identity. Its name is an administrative label. Two switches can use different names for VLAN 10, but that does not create different VLAN tags; keep names consistent to make the documentation easier to follow.

| VLAN range | Use in this course |
|---|---|
| `1` | Factory-default VLAN; avoid treating it as an automatically secured management network |
| `2–1001` | Ordinary normal-range user VLANs |
| `1002–1005` | Legacy reserved VLANs displayed by the lab Catalyst image |
| `1006–4094` | Extended-range VLANs; support and persistence depend on platform/VTP behavior |

Create the VLAN before assigning endpoints. This makes the sequence explicit and avoids relying on a particular image to create a missing VLAN as a side effect of a port command.

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

Normal-range VLANs on the referenced Catalyst platforms are maintained in the VLAN database, commonly `flash:vlan.dat`. Depending on VTP mode, VLAN definitions may also appear in the running and startup configurations. Port assignments are interface configuration. For this course, verify both the VLAN database and the interface configuration; a configuration-file view alone is not the whole picture.

**VTP**, the VLAN Trunking Protocol, can distribute VLAN definitions between switches. It is not required to configure each switch manually in these labs. Detailed VTP administration is outside this chapter's target. The relevant operational lesson is that an existing switch may retain VLAN information independently of an erased startup configuration; do not assume an erase-and-reload sequence cleared every file.

Deleting VLAN 20 removes its ordinary data forwarding domain. Ports assigned to it retain the configured VLAN number and become inactive for that data VLAN. Recreate the VLAN or deliberately reassign the ports to the correct existing VLAN. A separate configured voice VLAN on a phone port must be considered independently; do not infer that every kind of traffic on the physical port must fail.

## Configure an access port

A conventional **access port** carries one data VLAN for an endpoint that sends untagged Ethernet frames. On reception, the switch classifies those frames into the access VLAN. When it sends ordinary data frames back toward that endpoint, they are untagged. The endpoint does not need to know the switch's VLAN number.

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

Do not assume that the factory administrative mode is always static access. Some Catalyst images default to a dynamic mode that can negotiate a trunk. Setting `switchport mode access` removes that ambiguity for a simple host-facing port. Chapter 10 explains dynamic trunk negotiation and static trunks.

The **administrative mode** records the configured intent; the **operational mode** records how the interface is currently functioning. Also read the access VLAN's status. A configured value of 10 accompanied by `Inactive` is different from an active VLAN 10. The interface may still show physical connectivity in either case.

```output SW1# show interfaces fastethernet0/2 switchport — representative excerpt
Name: Fa0/2
Switchport: Enabled
Administrative Mode: static access  ← explicitly configured access mode
Operational Mode: static access
Access Mode VLAN: 10 (USERS)         ← the data VLAN
Voice VLAN: none
```

A phone/voice configuration is an important exception to the simplified description of an access port as carrying only untagged traffic. The next section covers it. Do not extrapolate this simple-PC example into a rule that any tagged frame on any access port must always be discarded.

## Carry voice and data on a phone port

An IP phone can contain a small Ethernet switch: one port faces the access switch, and another connects a PC. A common Cisco deployment keeps the PC's data in the access VLAN while the phone's voice traffic uses a separate **voice VLAN**.

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

Cisco Discovery Protocol (**CDP**) and Link Layer Discovery Protocol (**LLDP**) exchange information between directly connected neighbors. The Media Endpoint Discovery extension, **LLDP-MED**, can carry policy useful to devices such as phones. Cisco phones can learn voice policy through CDP; suitable phones and switches can also use LLDP-MED or manually provisioned settings. A missing CDP neighbor is therefore a reason to inspect discovery and provisioning, not proof that every phone must fall back to the data VLAN. Chapter 12 teaches discovery configuration and output interpretation.

Verify that the voice VLAN exists and is active, the port names the intended data and voice VLANs, and the phone has power. A working data connection through the phone does not prove that voice addressing, call control or registration works. Those services are outside this switching exercise. Likewise, discovering a phone is not proof that it has obtained a voice-VLAN lease.

Some Catalyst images automatically enable PortFast when voice VLAN is configured. Chapter 15 explains edge-port behavior and protection. Do not infer that one port-security address limit fits every phone-plus-PC deployment: allowed addresses, VLANs and device behavior need a separate design, taught in Chapter 16.

## Check PoE capability and the power budget

**Power over Ethernet (PoE)** supplies power over supported copper Ethernet cabling. The switch or injector is the **power sourcing equipment (PSE)**; the phone, AP or other endpoint is the **powered device (PD)**. A non-PoE Ethernet port cannot be made into a PoE port by adding a configuration command.

There are two separate capacity checks. First, the port, cable and powered device must support the required power level. Second, the switch's shared budget must have enough allocation remaining. A switch with many PoE+ ports does not necessarily have enough total power to run every port at its maximum simultaneously.

| Standard | Maximum PSE power | Power available at the PD under the standard's limits |
|---|---:|---:|
| IEEE 802.3af | 15.4 W | 12.95 W |
| IEEE 802.3at (PoE+) | 30 W | 25.5 W |
| IEEE 802.3bt Type 3 | Up to 60 W | Up to 51 W |
| IEEE 802.3bt Type 4 | Up to 90 W | Up to 71.3 W |

The difference accounts for permitted losses; source power and device power are not interchangeable. The higher figures require the corresponding supported equipment and conditions. For exam problems, use the supplied requirement and state whether it is a PSE allocation or power needed at the device.

For example, suppose a switch has a usable PoE allocation budget of 370 W. Ten phones reserve 6.3 W each, leaving `370 − 63 = 307 W`. If each additional AP requires a 30 W allocation, ten APs fit because `10 × 30 = 300 W`; eleven do not. This is allocation arithmetic. A momentary measured draw below the reserved value does not automatically create permission to oversubscribe the budget.

```ios SW2
SW2# show power inline
SW2# configure terminal
SW2(config)# interface gigabitethernet1/0/1
SW2(config-if)# power inline auto
SW2(config-if)# end
SW2# show power inline
```

Use this command family only on a supporting PoE model. `auto` enables the supported detection/allocation behavior; `never` disables PoE on the port. Where supported, `power inline auto max 7000` specifies a 7000 mW, or 7 W, maximum. Supported limits and enforcement behavior are platform-specific. Reducing that limit is not a general fix for a device that genuinely needs more power.

:::trap A connected Ethernet cable does not prove enough power
Check PSE capability, PD requirements, administrative PoE state, cabling and the shared budget. A power-denied indication needs those checks; an arbitrary VLAN change does not increase the power budget. A powered AP can also run with reduced features when its available power is insufficient for its full operating mode.
:::

## Choose the port from the endpoint requirements

Begin with what the endpoint presents on the wire. Does it send one untagged network or several tagged networks? Does it need PoE? Does it bridge traffic from other devices? Does it explicitly support a negotiated link bundle? These questions are more reliable than applying a desktop template to every object called a host.

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

This chapter teaches the selection reasoning and the access/voice configuration. It does not ask you to configure LACP or spanning-tree guards before you understand them. [Trunks](#/chapter/trunks-dtp), [EtherChannel](#/chapter/etherchannel), [STP protection](#/chapter/stp-protection) and [Layer 2 security](#/chapter/layer2-security) provide those complete procedures.

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
- Explain the result of a missing or deleted data VLAN without assuming every traffic type on the port fails.
- Read administrative versus operational mode and VLAN status from switchport output.
- Explain untagged data and tagged voice for the stated phone configuration.
- Choose access, voice or later trunk/bundle work from the endpoint's actual requirements.
- Check PoE capability and budget separately, using the correct units and allocation assumptions.
- Diagnose from VLAN, MAC-table, interface and host evidence rather than link lights alone.

Before continuing, prove same-VLAN communication and explain why an active but wrongly assigned port can fail. Chapter 10 extends these same VLANs to a second switch over one trunk; it does not yet add a path between different VLANs.
