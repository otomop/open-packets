---
id: cabling-and-interfaces
number: 3
title: Cabling & interfaces
subtitle: Choose the right connection and diagnose what the interface tells you.
part: foundations
domain: infra
minutes: { lesson: 60, lab: 50 }
summary: Compare copper and fiber links, understand speed and duplex, and use interface state and counters to investigate a fault without jumping to a conclusion.
objectives:
  v1: ["1.3", "1.3.a", "1.3.b", "1.4"]
  v2: ["1.1"]
prereqs: [network-models, components-and-topologies]
sources:
  - { title: "Cisco: CCNA 200-301 v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA 200-301 v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: Troubleshoot Switch Port and Interface Problems", url: "https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6500-series-switches/12027-53.html" }
  - { title: "Cisco: Configure and Verify Ethernet 10/100/1000Mb Half/Full Duplex Auto-Negotiation", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html" }
  - { title: "Cisco: Catalyst 2960 interface characteristics and auto-MDIX", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swint.html" }
  - { title: "Cisco: Catalyst 9300 connector and cable specifications", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/connector-cable-specs.html" }
  - { title: "Cisco: Catalyst 9300 hardware product overview", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html" }
  - { title: "Cisco: 10-Gigabit SFP+ module data sheet", url: "https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-455693.html" }
  - { title: "Cisco: Gigabit Ethernet SFP modules data sheet", url: "https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/gigabit-ethernet-gbic-sfp-modules/datasheet-c78-366584.pdf" }
  - { title: "Cisco: Catalyst 2960 show-interface command reference", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_ez/command/reference/cr2960/cli2.html" }
  - { title: "Cisco: Catalyst 9300 interface and transceiver command reference", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-3/command_reference/b_173_9300_cr/interface_and_hardware_commands.html" }
---

## Why the wire still matters

Chapter 02 separated the switch's forwarding role from the server's application role. Start here with the physical connection between devices. You will reuse the interface prompts and local ping tests from the opening labs, then learn to read the cable and interface evidence that those earlier tests did not explain.

Before investigating routing or an application, establish whether the network interface can carry traffic. A disconnected cable, disabled port or incompatible pair of transceivers prevents communication regardless of the IP addresses. A link can also come up and then lose or corrupt traffic. That second case requires more than looking for a green light.

Ask two separate questions: **is the link operational, and is it carrying frames cleanly?** Interface state answers the first. Speed, duplex, error counters and tests from both ends help answer the second. Start by identifying the exact port and its far-end device. Otherwise, a perfectly valid command can show you the wrong link.

In v1.1, you compare media and identify interface problems. The announced v2.0 objective also explicitly includes diagnosing distance, signal level and pinout problems. This chapter teaches those basic diagnostic decisions. Optical planning calculations and the detailed electrical design of Ethernet are outside this lesson.

## Copper: standards, categories and pinouts

:::facts
- Common twisted-pair Ethernet channels are designed for up to **100 m** with the specified cable category. Check the actual port or module specification; some copper transceiver modules have shorter limits.
- **100BASE-TX** uses two pairs; **1000BASE-T** uses all four pairs. Cat5e is the normal minimum choice for new 1 Gbps cabling.
- **Cat6A** supports 10GBASE-T over a 100 m channel. Cat6 does not guarantee that same 10 Gbps distance.
- A straight-through cable keeps the same pin numbers at both ends. A conventional 10/100 crossover exchanges pins **1 with 3** and **2 with 6**.
- On a full-duplex Ethernet link, normal operation has **no collisions**.
:::

**Twisted-pair cable** contains insulated copper conductors arranged in pairs. The twists help the pair reject interference; they are part of the cable's electrical design, not just a way to bundle wires. An Ethernet cable that looks intact may still have a broken conductor, damaged termination or excessive interference. The printed category indicates a performance specification, not the speed currently negotiated by the devices.

Link rates use bits per second: **Mbps** means one million bits per second and **Gbps** means one billion. Thus 1 Gbps is 1,000 Mbps. These are link rates, not a promise of the same application-file throughput; headers and other protocol work also consume capacity. Keep lowercase `b` for bits separate from uppercase `B` for bytes.

| Link type | Practical cable choice | Pairs used | Typical channel limit |
|---|---|---|---|
| 10BASE-T, 10 Mbps | Cat3 or better | 2 | 100 m |
| 100BASE-TX, 100 Mbps | Cat5 or better | 2 | 100 m |
| 1000BASE-T, 1 Gbps | Cat5e or better | 4 | 100 m |
| 10GBASE-T, 10 Gbps | Cat6A for the full distance | 4 | 100 m on supporting ports |

A channel includes the installed cable and patch leads. The usual structured-cabling arrangement allows 90 m of permanent link plus 10 m of patch cords. Do not treat the table as permission to extend every pluggable copper module to 100 m: for example, Cisco's SFP-10G-T-X supports a shorter 30 m 10 Gbps reach over Cat6A/7. Cable and interface specifications both matter.

The common eight-position Ethernet connector is often called **RJ-45**. Numbered conductors must arrive at the intended pins. The physical pairs occupy pins 1–2, 3–6, 4–5 and 7–8. Notice that pins 3 and 6 form a pair even though they are not adjacent. Keeping the two wires of each pair together is essential.

For traditional 10/100 Ethernet without automatic pair correction, a PC, server or router port uses one transmit/receive arrangement, called **MDI**, while a switch or hub uses **MDI-X**. A straight-through cable connects unlike arrangements, such as a PC to a switch. A crossover connects like arrangements, such as two switches or a PC directly to a router. These are electrical arrangements, not a rule that every pair of differently named devices uses straight-through.

**Auto-MDIX** detects the pair arrangement and compensates for it on supported ports. One working auto-MDIX end can remove the need to choose between straight-through and crossover. Cisco's documented 2960 procedure uses `speed auto`, `duplex auto` and `mdix auto`. Support depends on interface and software; it is not a feature of every fiber or copper port. In Packet Tracer, use the cable specified by the lab rather than assuming a particular simulated auto-MDIX implementation.

A cable tester can identify an **open** conductor, a **short** between conductors and a wrong pin connection. A **split pair** can preserve pin-to-pin continuity while using conductors from different twisted pairs. A simple continuity check may therefore pass a cable that performs badly. Check its wire map and, when quality or distance is in doubt, use a suitable cable qualification or certification test.

:::trap A connector does not identify the protocol
A traditional rollover console cable reverses pins and carries a serial console connection. It is not an Ethernet crossover cable, even if the device end uses a similar-looking connector. Connect it to a port labeled Console, not an Ethernet port. USB console connections are another management option; check the device's installation guide.
:::

## Fiber: single-mode, multimode and optics

**Fiber-optic cable** carries light rather than an electrical Ethernet signal. A **transceiver** converts between the device's electrical interface and the optical signal. The cable, transceivers and ports must form a compatible system: connector fit alone is insufficient. Check the module part number, supported Ethernet standard, fiber type, distance and switch support.

**Multimode fiber**, or MMF, has a larger core and supports multiple light paths. It is common for shorter building and data-center links. **Single-mode fiber**, or SMF, has a smaller core and supports longer-distance optical designs. Do not identify the supported distance from jacket color alone; use the cable's marking, documentation and transceiver specification.

| Example module or standard | Fiber and wavelength | Documented reach to recognize |
|---|---|---|
| Cisco 1000BASE-SX SFP | MMF, 850 nm | Depends on fiber grade; commonly up to 550 m |
| Cisco 1000BASE-LX/LH SFP | SMF, 1310 nm | Up to 10 km on the specified SMF |
| 10GBASE-SR SFP+ | MMF, 850 nm | 300 m on OM3; 400 m on OM4 |
| 10GBASE-LR SFP+ | SMF, 1310 nm | 10 km on the specified SMF |

These are examples, not interchangeable distance promises. An older multimode cable may support much less distance than OM3 or OM4. Cisco's LX/LH module specification is also not a reason to assign its 10 km reach to every product labeled LX. For a real link, read the exact module's data sheet.

**SFP** and **SFP+** describe common pluggable module formats; 1 Gbps SFP and 10 Gbps SFP+ modules are familiar examples. A physically similar module does not guarantee that a port supports its speed or optical standard. Many duplex modules use LC connectors, but other connector arrangements exist. Use the device's compatibility information rather than forcing a module into an apparently suitable slot.

A common duplex fiber link has two strands. The local transmitter must connect to the remote receiver, and the remote transmitter to the local receiver. If transmit is connected to transmit, both devices can be operational but no usable signal reaches the receivers. This is a **polarity** problem. Single-strand bidirectional modules are a separate design and require a compatible complementary pair.

```diagram
{"type":"topology","title":"Fig 03.1 — A duplex optical path","caption":"Each transmitter reaches the other device's receiver; connector fit alone does not establish correct polarity.","nodes":[{"id":"AT","kind":"switch","label":"Switch A · Tx","x":2,"y":1},{"id":"AR","kind":"switch","label":"Switch A · Rx","x":2,"y":5},{"id":"BT","kind":"switch","label":"Switch B · Tx","x":10,"y":1},{"id":"BR","kind":"switch","label":"Switch B · Rx","x":10,"y":5}],"links":[{"from":"AT","to":"BR","label":"strand 1"},{"from":"BT","to":"AR","label":"strand 2"}]}
```

Optical power is often displayed in **dBm**, a logarithmic value relative to 1 milliwatt. Here you need to compare a reading with the module's supported receive range, not memorize a fiber-engineering calculation. A reading of −16 dBm is lower power than −8 dBm. If a question supplies a low receive threshold of −12 dBm, −16 dBm is below that threshold.

Low received power suggests checking the far-end transmitter, fiber continuity, connectors, bends, polarity, distance and compatibility. It does not identify one unique cause. Excessive received power can also be a problem; use the module's upper limit rather than assuming more is always better. Never look into a live fiber or transceiver. Use the approved inspection and cleaning equipment for the installation.

## Shared media, point-to-point and duplex

A **shared-media** Ethernet segment places multiple devices on the same transmission medium. A historical Ethernet hub repeats signals between its ports; it does not learn MAC addresses or select one destination port. Devices on that segment must take turns transmitting. If two transmit at once, their signals can collide.

**Half duplex** allows transmission in one direction at a time. Traditional shared Ethernet uses carrier sense multiple access with collision detection, or **CSMA/CD**, to detect a collision and retry. Collisions can occur during normal half-duplex operation. They are not normal on a correctly operating full-duplex switched link.

**Full duplex** allows both ends to transmit and receive simultaneously. A modern switch-to-PC connection is normally a point-to-point, full-duplex link. Each switch port separates its attached Ethernet segment from the others; devices on different switch ports do not share one hub-style collision domain. A hub connected to one switch port still leaves the devices behind that hub sharing their segment.

Keep collision domains separate from **broadcast domains**. A switch can forward broadcasts across ports in the same VLAN while keeping those ports on separate Ethernet segments. A router does not normally forward an Ethernet broadcast from one interface to another. VLANs and switching behavior are developed in later chapters; here, remember that eliminating collisions does not eliminate broadcasts.

## Autonegotiation and the mismatch

**Autonegotiation** lets supported Ethernet interfaces exchange capabilities and choose compatible operating settings. For ordinary 10/100/1000 copper links, leaving both ends automatic is the usual starting point. Both sides must support the selected speed, and the cable must support it. An interface negotiating 100 Mbps does not by itself prove that the cable is defective: the far endpoint may only support 100 Mbps.

A useful CCNA case is a **10/100 link with one end forced to 100 Mbps full duplex and the other automatic**. The automatic end can detect speed without receiving a full negotiation exchange, but it cannot determine the forced end's duplex that way. It can settle at 100 Mbps half duplex. The link may be up even though its ends disagree.

With a **duplex mismatch**, the full-duplex side transmits without the half-duplex side's collision-handling rules. Communication may work intermittently or become slow under load. The half-duplex end may record collisions and late collisions; the full-duplex end may record damaged received frames. Compare both operational settings before blaming a cable. Do not apply this 10/100 fallback example as a universal rule for every gigabit, fiber or multigigabit interface.

For this lab's 2960 FastEthernet link, restore both ends to automatic settings. Apply the following to SW1, and apply the equivalent block to SW2 separately.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/24
SW1(config-if)# speed auto
SW1(config-if)# duplex auto
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces fastethernet0/24
```

If both 10/100 ends are manually set to the same supported speed and duplex, they can also work correctly. A manual speed mismatch, such as one end forced to 10 Mbps and the other to 100 Mbps, can prevent link establishment entirely. The right repair is a deliberate matching configuration at both ends, followed by a traffic test.

## Reading the output

Use `show interfaces status` for a compact switch-port overview, `show interfaces <interface>` for detailed operational state and counters, and `show running-config` to inspect configured values. Some IOS versions support a narrower `show running-config interface <interface>` command; use the full configuration if your simulator does not. Always compare the named physical connection at both ends.

The excerpts below are **representative IOS-style teaching output**, not a capture from an executed Packet Tracer lab. Columns, supported counters and wording vary by platform. The observations and relationships are what you need to interpret.

```output Representative: SW1# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/24    To-SW2              connected    1          a-half  a-100 10/100BaseTX  ← Automatically selected half duplex
```

```output Representative: SW2# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/24    To-SW1              connected    1          full    100   10/100BaseTX  ← Forced full duplex at the other end
```

Both ends report a link, but SW1 operates half duplex and SW2 full duplex. The `a-` prefix indicates an automatically selected setting; it does not prove a complete negotiation exchange succeeded. Neither `connected` nor a matching speed proves the duplex settings match.

```output Representative: selected lines from show interfaces fastethernet0/24
FastEthernet0/24 is up, line protocol is up (connected)
  Half-duplex, 100Mb/s, media type is 10/100BaseTX
     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
     12 output errors, 86 collisions, 12 interface resets
     0 babbles, 0 late collision, 0 deferred
```

This excerpt shows counters since the last reset, not necessarily new errors. Record a baseline, generate controlled traffic and compare a later reading. A **CRC error** means a received frame failed its error check; damaged cabling, interference, hardware faults or duplex issues can contribute. A **late collision** occurs later than the permitted collision window on half-duplex Ethernet and warrants investigation of duplex and physical conditions. No single counter identifies every cause.

**Runts** are undersized frames; **giants** exceed the permitted frame size for the interface's configuration and encapsulation. Do not blindly use 1518 bytes as the giant threshold on every port: VLAN tags and configured larger frames affect what is accepted. **Output drops** often indicate an egress queue that could not hold traffic. Investigate load and queue behavior rather than treating them as automatic proof of a broken cable.

An `administratively down` interface is locally shut down. A disconnected or incompatible physical link usually presents a down state without that administrative wording. `err-disabled` indicates that a protection mechanism disabled the port; investigate its recorded cause before re-enabling it. Conversely, `up/up` establishes local link operation, not correct addressing, routing or application service.

Use a repeatable sequence: identify both ends; check administrative and physical state; compare media, speed and duplex; compare counters over a test interval; change one justified item; retest. Keep the original readings. If you choose to reset counters in an isolated lab, target only the intended interface and answer the confirmation prompt. A supported `show interfaces transceiver detail` command adds physical optical measurements on suitable hardware; Packet Tracer and virtual routers do not provide a trustworthy replacement for real optical power testing.

## Exam focus

- Choose copper or fiber using speed, distance, environment and the actual interface/module specification.
- Recognize straight-through, crossover, console and auto-MDIX roles; a connector's shape does not prove compatibility.
- Know the common 100 m copper design limit and the Cat6A requirement for a full-distance 10GBASE-T channel.
- Compare single-mode and multimode fiber; match modules, fiber grade, reach and transmit-to-receive polarity.
- Distinguish shared half-duplex Ethernet from point-to-point full-duplex Ethernet.
- Recognize a 10/100 forced-versus-auto duplex mismatch by comparing both ends.
- Treat CRC, collisions, late collisions and drops as evidence to investigate, not a one-counter diagnosis.
- Compare optical receive power with supplied limits and verify the result of a repair.

Once you can identify the two ends of a link and distinguish physical failure from an incorrect interface setting, continue to Chapter 04. Its addressing work assumes those links can carry frames and asks whether the hosts and router have the correct IP addresses, masks and gateways.
