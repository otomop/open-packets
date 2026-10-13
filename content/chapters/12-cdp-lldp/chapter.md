---
id: cdp-lldp
number: 12
title: "CDP & LLDP"
subtitle: "Identify adjacent devices, verify both ends of a link, and correct network documentation."
part: switching
domain: switching
minutes: { lesson: 50, lab: 45 }
summary: "Configure CDP and LLDP, interpret local and remote neighbor fields, assess cached evidence and management reachability, and build an accurate link inventory."
objectives:
  v1: ["2.3"]
  v2: ["2.3"]
prereqs: ["ethernet-switching", "ios-essentials", "inter-vlan-routing"]
sectionIds:
  "What neighbor discovery tells you": "why-a-diagram-needs-a-witness"
  "Configure and verify CDP": "cdp-the-cisco-protocol"
  "Configure and verify LLDP": "lldp-the-standard-everyone-speaks"
  "Read local and remote fields correctly": "reading-a-neighbour-table"
  "Check and correct network documentation": "validating-a-diagram-against-the-output"
  "Choose where discovery should operate": "security-what-you-are-broadcasting"
  "Verify state, lifetime, and reachability separately": "reading-the-output"
  "Exam focus": "exam-focus"
sources:
  - {"title": "Cisco: CDP Version 2, IOS 15M&T", "url": "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/cdp/configuration/15-mt/cdp-15-mt-book/nm-cdp-discover.html"}
  - {"title": "Cisco: LLDP and LLDP-MED, Catalyst 2960 IOS 15.2(2)E", "url": "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/m_1522e_int_lldp_2960s_cg.html"}
  - {"title": "IEEE: 802.1AB Station and Media Access Control Connectivity Discovery", "url": "https://standards.ieee.org/ieee/802.1AB/6047/"}
---

CDP and LLDP help you identify the device at the other end of a network link. You can use their advertisements to check a cable connection, find the correct neighboring port, and compare the operating network with its documentation. The result is evidence to investigate, rather than a complete test of the network.

In this chapter, start with the device where you ran the command. Read each neighbor entry as a relationship between that device's local port and the advertised port on another device. Then verify the relationship from the other end before correcting a diagram.

## What neighbor discovery tells you

The previous chapter established gateway and management interfaces. Here, separate that IP reachability from the physical neighbor relationship: a management SVI can be unreachable while a directly connected device still advertises CDP or LLDP. The lab reuses Chapter 11's SVI setup to compare those two kinds of evidence.

A **neighbor discovery protocol** exchanges information over a local link. **Cisco Discovery Protocol (CDP)** is Cisco's discovery protocol; **Link Layer Discovery Protocol (LLDP)** is the vendor-neutral standard defined by IEEE 802.1AB. They are separate protocols. Enabling LLDP does not enable CDP, and a device running only one cannot discover advertisements sent only in the other format.

On Ethernet, these exchanges operate at Layer 2 and do not need a working IPv4 configuration. Two switches can learn about each other even when their management addresses are wrong. Conversely, two correctly addressed devices might exchange user traffic while their discovery protocols are disabled. Keep the discovery result separate from an IP connectivity test.

The information comes from the neighbor's own advertisements. Typical fields include device identity, sending port, capabilities, software, and a management address. Advertisements use **type-length-value fields (TLVs)**, which identify each piece of information and its size. Some fields are optional, so an absent management address or software string does not automatically mean the advertisement is defective.

In ordinary switch links, discovery describes adjacent protocol speakers, not an IP route through the network. Routers do not route these Ethernet advertisements between IP subnets. However, the table alone cannot certify one uninterrupted physical cable: a hub, transparent device, or deliberate Layer 2 protocol transport can complicate the path. Ordinary LLDP uses a reserved link-local destination that compliant bridges do not simply forward as user multicast. Do not assume every unmanaged switch forwards it.

## Configure and verify CDP

:::facts
- CDP and LLDP are Layer 2 discovery protocols; a neighbor entry does not prove IP reachability.
- Referenced classic IOS CDP defaults: advertisements every **60 seconds**, holdtime **180 seconds**, version **2** advertisements enabled.
- CDP controls: global `cdp run`; interface `cdp enable`. Both levels must permit operation.
- Referenced Catalyst LLDP timer defaults: **30-second** advertisements, **120-second** holdtime, **2-second** reinitialization delay.
- LLDP controls: global `lldp run`; interface `lldp transmit` and `lldp receive` are separate.
- Read a row as **local device/local interface → neighbor identity/neighbor port**.
:::

CDP is enabled by default on the supported classic IOS Ethernet interfaces described in Cisco's guide. This is a useful starting expectation, not a statement about every Cisco product, interface type, or saved configuration. Check `show cdp` for device-wide status and `show cdp interface` for the participating interfaces. Our lab explicitly enables the required settings.

A switch sending an advertisement every 60 seconds normally refreshes the receiver's entry before its advertised 180-second lifetime expires. The **holdtime** is the lifetime supplied by the sender, not a routing convergence timer. If advertisements stop arriving, the receiver eventually removes the cached entry. A local link-down event or explicit table clear can remove information earlier, so do not promise an entry will remain for exactly three minutes after every fault.

Use `no cdp run` to disable CDP globally. Use `no cdp enable` under an interface to disable it on that port. The positive interface command cannot override global disablement. The following starts CDP and sets familiar timer values on a selected switch link:

```ios SW1
SW1# configure terminal
SW1(config)# cdp run
SW1(config)# cdp timer 60
SW1(config)# cdp holdtime 180
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# cdp enable
SW1(config-if)# end
SW1# show cdp
SW1# show cdp interface
SW1# show cdp neighbors
```

CDPv2 can advertise native-VLAN and duplex information. A mismatch message is a reason to compare the actual interface settings on both ends. CDP does not correct them. Do not change a trunk merely to silence a log without first identifying which side differs from the approved design.

## Configure and verify LLDP

LLDP is especially useful when the network includes equipment from different vendors or endpoints with LLDP support. A server, phone, or appliance must actually implement and enable LLDP to appear. An ordinary PC with no discovery agent will not appear simply because it has an IP address or responds to ping.

Cisco's referenced Catalyst 2960 guide documents LLDP as globally disabled initially. Defaults vary across product families and software, so configure the intended directions explicitly. `lldp run` enables the process; `lldp transmit` allows advertisements out of the selected interface; `lldp receive` allows processing of incoming advertisements. Verify the effective interface state instead of assuming that one global command overrides previous interface settings.

```ios SW1
SW1# configure terminal
SW1(config)# lldp run
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# lldp transmit
SW1(config-if)# lldp receive
SW1(config-if)# end
SW1# show lldp
SW1# show lldp interface gigabitethernet0/1
SW1# show lldp neighbors detail
```

SW1 can learn SW2 only when SW2 transmits toward SW1 and SW1 receives on that link, with LLDP globally operating on both devices. SW1's own transmit setting determines what SW2 can learn. That distinction explains one-way visibility without requiring a broken cable or an IP-routing fault.

```diagram
{ "type": "matrix", "title": "Conditions for SW1 to learn SW2", "rows": ["SW2 transmits", "SW2 does not transmit"], "cols": ["SW1 receives", "SW1 does not receive"], "cells": [["Can refresh entry", "Cannot refresh entry"], ["Cannot refresh entry", "Cannot refresh entry"]], "tones": {"Can refresh entry":"accent", "Cannot refresh entry":"neutral"}, "caption": "Assume LLDP is globally enabled and the link works; existing cached entries can remain temporarily after a direction is disabled." }
```

LLDP identifies the sending device with a **chassis ID** and the sending interface with a **port ID**. Those IDs can use different representations; a chassis ID is not universally a MAC address, and a port ID is not universally a familiar IOS interface name. Use the advertised system name and port description as additional evidence. Do not substitute a guessed interface name for an unfamiliar identifier.

**LLDP-MED**, Media Endpoint Discovery, extends LLDP for compatible endpoints such as phones. It can communicate network policy, including voice VLAN and QoS parameters, along with power and location information. This helps a phone obtain the information needed for its role. It does not replace DHCP, assign an arbitrary IP address, or establish that a voice call will succeed.

## Read local and remote fields correctly

Always identify the command's execution point first. In an SW1 table, `Local Intrfce` belongs to SW1. `Device ID` describes the neighbor, and `Port ID` describes the neighbor's sending interface. Neither column is a path through subsequent routers. A second row for the same neighbor can represent a second physical connection, so retain the port identities when documenting parallel links.

The following is representative, abbreviated CDP output for the lab. Platform strings, capability combinations, spacing, and remaining lifetimes vary by image.

```output SW1# show cdp neighbors
Device ID   Local Intrfce  Holdtme  Capability  Platform  Port ID
R1          Gig 0/2        155      R           C2911     Gig 0/0  ← SW1 Gi0/2 reaches R1 Gi0/0
SW2         Gig 0/1        162      S I         WS-C2960  Gig 0/2  ← SW1 Gi0/1 reaches SW2 Gi0/2
```

The first row does not mean R1 uses Gi0/2. That is SW1's local port. Reverse the observation by logging in to R1: its local Gi0/0 should identify SW1's Gi0/2 if both ends are advertising and the records are current. Write the device name beside every port in your notes so this distinction survives when tables are combined.

Capability letters require the legend belonging to the command. In common Cisco CDP output, `S` means switch and `R` means router. In LLDP output, `B` means bridge, which includes ordinary Ethernet switching, while `S` means station. A phone is commonly `P` in CDP and `T` in LLDP. These are advertised capabilities, not proof that every supported function is enabled or carrying traffic.

| Field | Useful conclusion | Conclusion requiring other evidence |
|---|---|---|
| Local interface and remote port ID | Observed connection between protocol speakers | Complete physical cable path through passive or transparent equipment |
| Capability | Advertised device function | Actual routing configuration and forwarding success |
| Management address | An address the neighbor advertises | Address is reachable from your current source |
| Lifetime or time remaining | Entry is retained according to protocol state | Cable and peer are still working now |

## Check and correct network documentation

Begin with a table containing local device, local interface, neighbor identity, neighbor port, protocol, and observation time. Record the unmodified observations before correcting the diagram. This makes the change reviewable and avoids turning an uncertain inference into a documented fact.

Suppose the existing drawing says SW1 Gi0/1 connects to R1 Gi0/0, while SW1 Gi0/2 connects to SW2 Gi0/1. The preceding CDP output disagrees with both links. The candidate corrections are SW1 Gi0/2 to R1 Gi0/0 and SW1 Gi0/1 to SW2 Gi0/2. Confirm the reverse entries and inspect the actual ports before updating the document.

| Existing drawing | Current SW1 observation | Proposed correction |
|---|---|---|
| SW1 Gi0/1 → R1 Gi0/0 | R1 on local Gi0/2, remote Gi0/0 | Change SW1 end to Gi0/2 |
| SW1 Gi0/2 → SW2 Gi0/1 | SW2 on local Gi0/1, remote Gi0/2 | Correct both switch ends |

If only one direction appears, do not immediately change the cable. Check the relevant transmit and receive controls, the global process, interface state, and record age. If a name appears twice, retain chassis and port identities and investigate naming duplication. Two devices can share a hostname; the correct response is to establish identity, not discard one row.

A discovery entry and an interface description can disagree because either record is stale. An advertisement can also contain an incorrect or deliberately misleading identity. Corroborate it with the neighboring device's configuration, inventory, and physical evidence where available. Update a diagram when the evidence supports the correction, not simply because one source looks more authoritative.

## Choose where discovery should operate

Discovery shares information about the local device with connected equipment. Ordinary CDP/LLDP advertisements are not authenticated proof of identity and are not encrypted management sessions. This is useful on managed internal links, but can disclose information unnecessarily on an external connection.

Apply the organization's policy per interface. Keep the required discovery protocol on links used for internal documentation or phone policy. Disable unwanted advertisement and reception on a boundary where it serves no purpose. Disabling CDP globally to protect one ISP-facing port can also remove useful internal neighbor information and affect endpoints that depend on it.

For example, `no cdp enable` removes CDP on the selected interface. For LLDP, consider both `no lldp transmit` and `no lldp receive` when the intention is to disable participation entirely. Disabling transmission alone limits your advertisements, but the local device can still receive and display the neighbor's information.

Before changing a phone-facing link, determine whether CDP or LLDP-MED supplies its VLAN or power information. A discovery policy should account for that dependency. Neither protocol is a replacement for access control, and an absent neighbor entry does not demonstrate that a port is secure.

## Verify state, lifetime, and reachability separately

Use `show cdp neighbors detail` or `show lldp neighbors detail` to inspect available addresses and additional identifiers. A management address may belong to another interface or an SVI on the neighbor. Test it from an appropriate source only after checking that the source has the required addressing and route.

```output SW1# show lldp neighbors detail
Chassis id: 0011.2233.4455
Port id: Gi0/2
Port Description: GigabitEthernet0/2
System Name: SW2
System Capabilities: B
Enabled Capabilities: B
Management Addresses:
    IP: 192.168.12.12
Time remaining: 93 seconds  ← cached lifetime, not a ping result
```

This illustrative entry identifies SW2's advertised port and address. It does not prove that SW1 can reach 192.168.12.12. A wrong management VLAN or mask can prevent ping while LLDP still works over the Ethernet connection. Diagnose the failing function rather than disabling discovery to make the symptoms agree.

On CDP implementations that display remaining holdtime, an entry with 174 seconds left from an advertised 180-second lifetime was refreshed approximately six seconds earlier. Avoid treating the arithmetic as an exact timestamp. For LLDP, use the detail view's time remaining where available; brief-table holdtime presentation differs between platforms. Timers advertised by a neighbor need not equal your local timer settings.

When changing a discovery setting, record the change and allow cached information to expire, or use a documented clear command such as `clear cdp table` on the observation device. Then verify fresh learning. Clearing a local table does not clear the neighbor's table and does not immediately force the neighbor to send a new periodic advertisement.

:::trap An advertised address is not a reachability test
A neighbor can advertise a management address even when your device has no route to it. Verify the address, VLAN, routing, and permitted management service separately. A CDP or LLDP entry does not establish that ping or SSH will work.
:::

## Exam focus

- Configure CDP globally and per interface; verify both levels.
- Configure LLDP globally and check transmit and receive directions separately.
- Read local interface, remote port, identity, capability, and management address correctly.
- Recognize the referenced default timers without assuming all product defaults are identical.
- Distinguish cached neighbor information from current link state and IP reachability.
- Compare observations from both ends with a documented topology and justify corrections.
- Explain discovery policy on internal, endpoint, and external links.
