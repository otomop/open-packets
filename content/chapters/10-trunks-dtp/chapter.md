---
id: trunks-dtp
number: 10
title: "802.1Q trunks"
subtitle: "Carry several VLANs over one link, agree on tagging, and prove which VLANs can cross."
part: switching
domain: switching
minutes: { lesson: 60, lab: 60 }
summary: "Configure static 802.1Q trunks, interpret native and allowed VLAN settings, and diagnose a VLAN that cannot cross a link. Apply the same tagging rules to access points and virtual hosts."
objectives:
  v1: ["2.2", "2.2.a", "2.2.b", "2.2.c"]
  v2: ["2.1.b", "2.2.b", "2.2.d", "2.2.e"]
prereqs: [vlans-and-access-ports]
sectionIds:
  "Native VLAN and untagged traffic": native-vlan-the-one-vlan-that-travels-untagged
  "Configure a static trunk": configuring-trunks-on-2960-3560-and-9200
  "Recognize DTP negotiation": dtp-how-a-port-decides-to-trunk
sources:
  - { title: "Cisco: Catalyst 2960 IOS 15.0(2)SE — Configuring VLANs", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvlan.html" }
  - { title: "Cisco: Catalyst 9300 IOS XE 17.12 — Configuring VLAN Trunks", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/vlan/b_1712_vlan_9300_cg/configuring_vlan_trunks.html" }
  - { title: "Cisco: Configure 802.1Q Trunking Between Catalyst Switches", url: "https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6000-series-switches/10599-88.html" }
  - { title: "Cisco: InterSwitch Link and IEEE 802.1Q Frame Format", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/8021q/17056-741-4.html" }
  - { title: "Cisco: Catalyst 3650 VLAN Command Reference — Native VLAN Tagging", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/software/release/16-1/command_reference/b_161_consolidated_3650_cr/b_161_consolidated_3650_cr_chapter_010001.html" }
  - { title: "Cisco: QoS in ACI — 802.1Q PCP, DEI and VID field definitions", url: "https://www.cisco.com/c/en/us/support/docs/cloud-systems-management/application-policy-infrastructure-controller-apic/215015-qos-in-cisco-aci-within-a-pod.html" }
  - { title: "Cisco: Wireless Controller 8.10 — FlexConnect", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/flexconnect.html" }
  - { title: "Cisco: VMware Infrastructure in a Cisco Network — VLAN tagging architecture", url: "https://www.cisco.com/c/en/us/td/docs/solutions/Enterprise/Data_Center/vmware/vmware/VMware.html" }
---

You have two switches, and each has PCs in VLAN 10 and VLAN 20. Chapter 9 gave every access port exactly one VLAN, so joining the switches with access ports would cost one cable and two ports for every VLAN you extend. A trunk removes that cost: one link carries many VLANs, and a small tag on each frame says which VLAN it belongs to.

In this chapter you follow a frame across a trunk, read the 802.1Q tag, and configure both ends of a static trunk with a native VLAN and an allowed list. You also learn how Cisco's DTP can form a trunk by negotiation, and why you normally turn it off. By the end you can build a trunk, predict what any two DTP modes produce, and work out why one VLAN fails on a link that is otherwise up.

## Why one link must carry many VLANs

:::facts
- An 802.1Q trunk carries every VLAN that is allowed and active on that link.
- Tagging identifies a frame's VLAN; it does not route between VLANs.
- An 802.1Q tag adds **4 bytes**. Its VLAN ID field is **12 bits**.
- Usable VLAN IDs are **1–4094**; 0 and 4095 are reserved.
- The native VLAN is **1** by default. Frames in the native VLAN cross the trunk untagged.
- A Catalyst 2960 port defaults to **dynamic auto**: it becomes a trunk only if the other end asks.
:::

Suppose SW1 has a PC in VLAN 10 and another in VLAN 20. SW2 has the same arrangement. Connecting an access port in VLAN 10 on each switch extends VLAN 10, but does nothing for VLAN 20. Two separate access links could carry the two VLANs, but that consumes another port and cable for every added VLAN. A trunk carries both on one connection while retaining their identities.

Follow a VLAN 20 frame from an ordinary PC. It enters SW1 without a VLAN tag. SW1 associates it with VLAN 20 because the receiving access port belongs to VLAN 20. If the destination is reachable through the trunk, SW1 transmits the frame with VLAN 20 identification. SW2 reads that identification, performs its Layer 2 forwarding decision within VLAN 20, and sends an untagged frame from the destination PC's access port.

```diagram
{"type":"topology","title":"Fig 10.1 — Two separate VLANs share one cable","caption":"PC-A reaches PC-C within VLAN 10; PC-B reaches PC-D within VLAN 20. The trunk does not connect VLAN 10 to VLAN 20.","nodes":[{"id":"a","kind":"pc","label":"PC-A","sub":"VLAN 10","x":1,"y":1},{"id":"b","kind":"pc","label":"PC-B","sub":"VLAN 20","x":1,"y":5},{"id":"s1","kind":"switch","label":"SW1","x":4,"y":3},{"id":"s2","kind":"switch","label":"SW2","x":8,"y":3},{"id":"c","kind":"pc","label":"PC-C","sub":"VLAN 10","x":11,"y":1},{"id":"d","kind":"pc","label":"PC-D","sub":"VLAN 20","x":11,"y":5}],"links":[{"from":"a","to":"s1","label":"access 10"},{"from":"b","to":"s1","label":"access 20"},{"from":"s1","to":"s2","label":"802.1Q: 10,20,99","accent":true},{"from":"s2","to":"c","label":"access 10"},{"from":"s2","to":"d","label":"access 20"}],"trace":{"flows":[{"path":["a","s1","s2","c"],"label":"PC-A to PC-C within VLAN 10"},{"path":["b","s1","s2","d"],"with":true,"tone":"alt","label":"A VLAN 20 frame, PC-B to PC-D","tags":{"s1":"Access VLAN 20 → tagged on trunk","s2":"Reads VLAN 20 · untagged out"}}]}}
```

VLAN-aware equipment can also send and receive tags. A router subinterface, an AP carrying locally switched client VLANs, or a virtual host may terminate a trunk. Conversely, a connection to a switch is not automatically a trunk. Select the port behavior from the traffic the peer must carry, then configure the peer to agree.

## The 802.1Q tag

The tag sits after the source MAC address and before the original EtherType field. It preserves the Ethernet source and destination addresses. Adding or removing the tag changes the frame contents, so the transmitter calculates the appropriate frame check sequence. An ordinary Ethernet frame with a 1,500-byte payload is 1,518 bytes from destination MAC through FCS; adding one tag makes that 1,522 bytes. This count excludes the preamble and start delimiter. Do not confuse the extra Layer 2 bytes with a larger IP payload.

```diagram
{"type":"bits","title":"Fig 10.2 — The four-byte 802.1Q tag","caption":"The VID carries VLAN identification. Priority and drop-eligibility fields serve different purposes.","fields":[{"label":"TPID","bits":16,"note":"0x8100"},{"label":"PCP","bits":3,"note":"priority 0–7"},{"label":"DEI","bits":1,"note":"drop eligibility"},{"label":"VID","bits":12,"note":"VLAN identifier","highlight":true}]}
```

The **tag protocol identifier**, or TPID, identifies the 802.1Q tag. The **priority code point** is a three-bit priority value; it does not choose a VLAN or guarantee that a packet receives priority throughout a network. The **drop eligible indicator** supports traffic treatment under congestion. The **VLAN identifier**, or VID, determines the tagged VLAN. Older documentation may call the one-bit field CFI; DEI is the terminology used here.

Twelve bits provide 4,096 numeric values. VID 0 is used for priority tagging without identifying a VLAN, and 4095 is reserved. That leaves identifiers 1 through 4094. A particular switch may support fewer active VLANs than that, and Cisco reserves 1002–1005 for legacy uses, so the labs stay with ordinary numbers such as 10, 20, 30 and 99.

## Native VLAN and untagged traffic

A trunk needs a rule for a frame that arrives with no VLAN tag. It puts that frame in the port's **native VLAN**. In the other direction, frames that belong to the native VLAN leave the trunk untagged, and frames in every other allowed VLAN carry a tag. The native VLAN is 1 unless you change it. Configure native VLAN 99 at both ends and an untagged frame stays in VLAN 99 across the link.

A native mismatch breaks that agreement. If SW1 sends VLAN 99 frames untagged but SW2's native VLAN is 999, SW2 puts those frames in VLAN 999. Traffic leaks from one VLAN into the other, and hosts in the native VLAN lose contact. Cisco switches usually warn you: CDP (chapter 12) logs `%CDP-4-NATIVE_VLAN_MISMATCH`, and per-VLAN spanning tree can block the affected VLANs on that port. The reliable check is to compare the `Native vlan` column of `show interfaces trunk` on both ends.

| Setting | What it controls | What it does not establish |
|---|---|---|
| Native VLAN | Default classification and transmission of untagged data | Which VLAN contains an administrator |
| Management VLAN | Where device management IP connectivity is placed | Whether its frames must be untagged |
| Allowed VLAN list | Which VLANs are eligible to use a trunk | Whether each VLAN exists and is forwarding |
| Access VLAN | VLAN membership for ordinary data on an access port | Membership of all tagged traffic on a trunk |

Management traffic can be tagged. Calling VLAN 99 “management” does not make it native; setting it as native does not give any device an IP address. In the main lab, VLAN 99 is an unused native VLAN with no attached endpoints.

:::trap The native VLAN is not negotiated
Each end sets its own native VLAN and nothing forces them to match. A trunk with mismatched native VLANs still comes up and still carries its tagged VLANs, so the mistake is easy to miss. Set the same native VLAN on both ends. Common practice is to use a VLAN with no hosts, such as 99, so that no user traffic crosses the trunk untagged.
:::

## The allowed VLAN list

The **allowed list** is set separately on each trunk port and limits which VLANs may cross it. By default a trunk allows all VLANs, 1–4094. Listing only the VLANs you need keeps unwanted broadcasts off the link and makes the design easy to review. A VLAN crosses the trunk only if both ends allow it and the VLAN exists on both switches.

The difference between replacing and modifying a list matters. If the current list is `10,20,99`, the command `switchport trunk allowed vlan 30` replaces it with just 30. The command `switchport trunk allowed vlan add 30` preserves the existing list and adds 30. Likewise, `remove 20` removes only VLAN 20. The `all` keyword restores permission for all supported VLANs; it is not the intended restricted list for this lab. Before changing a live trunk, record its current list and identify which users and management sessions rely on it.

A configured VLAN can still be unable to forward. Think through three questions in order: is it allowed, is it active locally, and is this port forwarding it? Spanning tree may hold a redundant path out of forwarding to prevent a loop; you will learn those decisions in chapter 14. For now, recognize that physical link state and VLAN forwarding state are separate.

Removing VLAN 1 from the allowed list stops user data in VLAN 1, but the switch still sends its own link-control protocols, such as CDP and DTP, on that trunk. The allowed list filters user traffic; it does not turn those protocols off.

## Configure a static trunk

A **static trunk** does not depend on a peer requesting trunk formation. The example below assumes VLANs 10, 20 and 99 already exist on both switches, and SW1 Gi0/1 connects to SW2 Gi0/1. Enter the same trunk settings on SW2. The full lab supplies both configurations.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# description Trunk-to-SW2-Gi0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 99
SW1(config-if)# switchport trunk allowed vlan 10,20,99
SW1(config-if)# switchport nonegotiate
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces trunk
SW1# show interfaces gigabitethernet0/1 switchport
```

The mode command establishes the local trunk configuration. The native and allowed commands define its VLAN behavior. `switchport nonegotiate` suppresses DTP messages; it does not disable 802.1Q tagging. `no shutdown` removes an administrative shutdown, but cannot fix a cable or power problem.

A Catalyst 2960 uses 802.1Q without an encapsulation-selection command. Some older interfaces that support a choice of trunk encapsulations require `switchport trunk encapsulation dot1q` before accepting static trunk mode. The other choice on those interfaces is ISL, Cisco's older proprietary trunk encapsulation. Current switches support only 802.1Q.

## Trunks to APs and virtual hosts

An **SSID** is the service set identifier: the name used to identify a wireless network. **WLAN** means wireless LAN. An AP does not require a trunk merely because it advertises several SSIDs. With centrally switched wireless traffic, client traffic may be tunneled to a controller while the AP's wired connection uses one access VLAN. With local switching, the AP can place client frames directly into local wired VLANs. If several such VLANs share its uplink, that uplink needs compatible tagging.

For a concrete local-switching design, assume the AP's management traffic is untagged in VLAN 100, staff clients are tagged 110, and guest clients are tagged 120. Configure the AP's native VLAN and WLAN-to-VLAN mappings to agree with those requirements. The switch-side template is:

```ios SW-EDGE
SW-EDGE# configure terminal
SW-EDGE(config)# interface gigabitethernet0/2
SW-EDGE(config-if)# description AP-management100-clients110-120
SW-EDGE(config-if)# switchport mode trunk
SW-EDGE(config-if)# switchport trunk native vlan 100
SW-EDGE(config-if)# switchport trunk allowed vlan 100,110,120
SW-EDGE(config-if)# switchport nonegotiate
SW-EDGE(config-if)# end
```

This template assumes those VLANs have been created and the port has suitable connectivity and power. It is not a complete wireless installation. If the AP instead tags management traffic, adjust the design accordingly; copying the untagged template would create a mismatch.

A **virtual host** runs virtual machines through a hypervisor. A virtual switch can associate a VM's virtual network adapter with a VLAN and carry multiple VLANs over the host's physical uplink. For example, assume the host explicitly tags management VLAN 100 and VM VLANs 110 and 120. Use a static trunk allowing `100,110,120`, with an agreed unused native VLAN such as 999. Do not make VLAN 100 native on the switch while the host expects its returning management frames tagged. A host serving only one untagged network may instead use an access port.

The same question applies to a firewall or other network appliance: does this particular interface expect one untagged network or several tagged logical interfaces? Match its documented interface configuration. Port aggregation, loop-protection features and complete appliance policy belong to later chapters; attaching several cables without understanding their forwarding design is not an extension of this single-link exercise.

## Recognize DTP negotiation

**Dynamic Trunking Protocol (DTP)** is a Cisco protocol that lets two switch ports agree whether their link is a trunk. It is separate from 802.1Q: DTP decides whether the link trunks, and 802.1Q is how frames are tagged once it does. Only Cisco switches speak DTP. Routers, servers, firewalls and APs do not, so a port that faces one of them must be made a trunk by hand.

| Mode command | What the port does |
|---|---|
| `switchport mode access` | Never trunks |
| `switchport mode trunk` | Always trunks, and still sends DTP so that a dynamic neighbor follows |
| `switchport mode dynamic auto` | Passive: trunks only if the neighbor is `trunk` or `dynamic desirable` |
| `switchport mode dynamic desirable` | Active: asks the neighbor to trunk |

The rule behind every combination is that one side must ask. `trunk` and `dynamic desirable` ask; `dynamic auto` only answers; `access` refuses.

```diagram
{"type":"matrix","title":"Fig 10.3 — What two DTP modes produce","rows":["dynamic auto","dynamic desirable","trunk","access"],"cols":["dynamic auto","dynamic desirable","trunk","access"],"cells":[["Access","Trunk","Trunk","Access"],["Trunk","Trunk","Trunk","Access"],["Trunk","Trunk","Trunk","Mismatch"],["Access","Access","Mismatch","Access"]],"tones":{"Trunk":"accent","Access":"neutral","Mismatch":"bad"},"caption":"Rows are one end, columns the other. Trunk with access is a misconfiguration: one end tags frames and the other does not."}
```

Two results are worth memorizing. Auto with auto stays an access link, because neither side asks. The Catalyst 2960 and most current Catalyst switches default to dynamic auto, so two new switches cabled together do not trunk until you configure one end. Older models defaulted to dynamic desirable, which is why the exam gives you the modes instead of expecting you to assume them.

`switchport nonegotiate` stops a port sending DTP. It is not a fifth mode: you add it to a port already set to `trunk` or `access`. The trunk keeps tagging frames, but a dynamic auto neighbor no longer hears a request and stays an access port, so set the neighbor to `trunk` as well. Leaving DTP running on ports that face users lets an attacker's device ask for a trunk, which is the main reason to configure every port as a static access or trunk port and disable negotiation.

## Verify and troubleshoot

Start with `show interfaces trunk`, then inspect a specific port with `show interfaces gigabitethernet0/1 switchport`. The first lists operational trunk information; the second helps compare configured and operational modes. If a configured trunk is absent from the first command, check the physical connection, administrative state and the detailed port output.

The following is a representative, abbreviated IOS-style example. Formatting, ranges and available fields vary by model and simulator release.

```output SW1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      99  ← Check mode and native VLAN at both ends

Port        Vlans allowed on trunk
Gi0/1       10,20,30,99  ← Configured eligibility

Port        Vlans allowed and active in management domain
Gi0/1       10,20,99  ← VLAN 30 is not active locally

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       10,20,99  ← These VLANs are forwarding on this local trunk
```

VLAN 30 is allowed but absent from the active list. Inspect `show vlan brief` before changing the trunk list: VLAN 30 may be absent or inactive locally. The output does not tell you which condition exists on SW2. If a VLAN is active but missing from the forwarding list, inspect its spanning-tree state and any applicable pruning configuration; do not assume the cable is broken.

Use endpoint tests to finish the diagnosis. If same-VLAN communication works locally but fails across the trunk, compare that VLAN's membership and forwarding along the link. If same-VLAN communication works across the trunk but communication to another VLAN fails, remember that no routing has been configured yet. A trunk extending VLANs is not an IP gateway.

**Pruning** means suppressing a VLAN's traffic on a trunk where it is not needed; it is another reason permission and effective forwarding can differ. You do not need to configure pruning here. To compare two ends, keep only VLANs present in both effective forwarding lists. If SW1 forwards `10,20,99` and SW2 forwards `20,30,99`, their common eligible set is `20,99`. Host addressing and access membership still need separate verification.

## Exam focus

- Explain how tagging preserves VLAN identity across a shared link.
- Identify the four-byte tag, twelve-bit VID and usable identifier range.
- Configure static trunk mode and consistent native VLAN settings.
- Distinguish replacement of an allowed list from `add` and `remove`.
- Interpret allowed, active and forwarding VLAN lists separately.
- Match AP, host and appliance tagging to the peer's actual requirements.
- Recognize DTP auto/desirable behavior and the purpose of `nonegotiate`.
- Diagnose a specific VLAN with evidence from both ends and endpoint tests.

You can now extend a VLAN across switches and check its complete Layer 2 path. The next chapter adds the missing gateways, using either router subinterfaces on a trunk or logical VLAN interfaces on a multilayer switch. Keep the distinction clear: carrying VLANs and routing between them are separate jobs.
