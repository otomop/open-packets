---
id: inter-vlan-routing
number: 11
title: Inter-VLAN routing
subtitle: "Build gateways with router subinterfaces and SVIs, then follow a packet between them."
part: switching
domain: switching
minutes: { lesson: 65, lab: 80 }
summary: "Route between VLANs using a router trunk or a multilayer switch. Distinguish management addressing from packet forwarding, verify gateway prerequisites, and interpret SVI and subinterface failures."
objectives:
  v1: ["2.1.c"]
  v2: ["2.1", "2.1.a", "2.1.d"]
prereqs: [trunks-dtp, ipv4-addressing]
sectionIds:
  "Follow a packet through two VLANs": the-packet-walk-macs-change-ips-do-not
  "Routed ports and gateway designs": routed-ports-and-the-four-designs-compared
sources:
  - { title: "Cisco: Configure Inter-VLAN Routing with an External Router", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/inter-vlan-routing/14976-50.html" }
  - { title: "Cisco: Configuring Routing Between VLANs", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/lan-wan/lan-wan/m_lsw-conf-rout-vlan.html" }
  - { title: "Cisco: Catalyst 3560 IOS 15.0(2)SE — Interface Characteristics and SVI Autostate", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_2_se/configuration/guide/scg3560/swint.html" }
  - { title: "Cisco: Catalyst 3650 IOS XE 3.7E — Configuring Interface Characteristics", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/software/release/37e/consolidated_guide/b_37e_consolidated_3650_cg/b_37e_consolidated_3650_cg_chapter_0100.pdf" }
  - { title: "Cisco: Catalyst 2960 — Assigning the Switch IP Address and Default Gateway", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swipaddr.html" }
  - { title: "Cisco: Local Host Routes Installed in the Routing Table", url: "https://www.cisco.com/c/en/us/support/docs/ip/ip-routing/116264-technote-ios-00.html" }
  - { title: "RFC 826: Address Resolution Protocol", url: "https://www.rfc-editor.org/rfc/rfc826.html" }
  - { title: "RFC 1812: Requirements for IPv4 Routers", url: "https://www.rfc-editor.org/rfc/rfc1812.html" }
---

A trunk extends several VLANs while keeping them separate. To send an IP packet from a host in one VLAN to a host in another, you need Layer 3 forwarding. You will build that function two ways: router subinterfaces sharing a trunk, and VLAN interfaces on a multilayer switch. The same addressing and packet-forwarding principles apply to both.

The examples use one IPv4 subnet per VLAN, which keeps host membership and routing boundaries clear. This is the design being taught, not a claim that an Ethernet VLAN can contain only one IP subnet. Complete routing-table selection and routes to remote networks come later; the first task is to make directly connected VLANs communicate reliably.

## Why a VLAN boundary needs a router

:::facts
- An ordinary switch trunk preserves VLANs; it does not route between them.
- A host sends an off-subnet packet to a reachable gateway in its own subnet.
- A router subinterface uses `encapsulation dot1Q vlan-id` to select its VLAN.
- An **SVI**, or switch virtual interface, gives a VLAN a logical Layer 3 interface.
- A multilayer switch needs `ip routing` to forward IPv4 packets between its connected interfaces.
- `ip default-gateway` supports a non-routing switch's own IP traffic; it does not enable inter-VLAN forwarding.
:::

PC-A is `192.168.10.11/24` and PC-B is `192.168.20.12/24`. PC-A calculates that PC-B is outside its local `192.168.10.0/24` subnet. It therefore sends the packet through gateway `192.168.10.1`. The gateway in this example also has `192.168.20.1/24` in VLAN 20, so it can forward directly to PC-B. PC-B needs its own correct gateway, `192.168.20.1`, to return the reply.

A common failed design has correct host addresses and VLANs but no routing device. Adding VLAN 20 to an allowed list will not fix that absence. Another has a working gateway but no gateway entered on a host. That host may communicate with local neighbors while failing to reach another subnet. Check the host's address, mask and gateway together; the mask determines when it uses that gateway.

**Router-on-a-stick** uses one physical router connection with several logical subinterfaces, normally one for each routed VLAN. A **multilayer switch** can perform the same routing through SVIs without sending every inter-VLAN packet over a separate router cable. Device features and performance depend on the model; choose an appropriate platform rather than assuming a product name guarantees routing capacity.

## Follow a packet through two VLANs

Use the packet walk from chapter 01 and add VLAN membership. Assume both ARP caches are initially empty, all ports are forwarding, and no NAT or filtering changes this simple exchange. PC-A first broadcasts an ARP request in VLAN 10 for `192.168.10.1`. The gateway replies with its VLAN 10 MAC address. PC-A can then send the ICMP echo request inside a frame addressed to that gateway.

At the router, the incoming Ethernet frame terminates. The router examines the destination IP and finds its connected VLAN 20 network. If it does not know PC-B's MAC address, it broadcasts a new ARP request in VLAN 20 for `192.168.20.12`. This is a separate broadcast: the router did not forward PC-A's VLAN 10 ARP into VLAN 20.

```diagram
{"type":"sequence","title":"Fig 11.1 — Resolve the next hop on each VLAN","caption":"Two separate ARP exchanges support one routed packet; the router then builds a new outgoing Ethernet frame.","actors":["PC-A · VLAN 10","Gateway · VLANs 10/20","PC-B · VLAN 20"],"steps":[{"from":0,"to":1,"label":"ARP: who has 192.168.10.1?","note":"Broadcast within VLAN 10"},{"from":1,"to":0,"label":"ARP reply: gateway MAC"},{"from":0,"to":1,"label":"Echo request for 192.168.20.12","note":"Frame destination = gateway's VLAN 10 MAC","accent":true},{"from":1,"to":2,"label":"ARP: who has 192.168.20.12?","note":"New broadcast within VLAN 20"},{"from":2,"to":1,"label":"ARP reply: PC-B MAC"},{"from":1,"to":2,"label":"Forward echo request","note":"New frame destination = PC-B MAC","accent":true}]}
```

The outgoing frame uses the router's VLAN 20 interface MAC as its source and PC-B's MAC as its destination. The source IP remains `192.168.10.11` and destination IP remains `192.168.20.12`. Ordinary routing does not rewrite those addresses. The IPv4 TTL decreases and the IPv4 header checksum is updated. The outgoing Ethernet FCS corresponds to the new frame.

| Point in the path | Ethernet destination | IP destination | VLAN |
|---|---|---|---|
| PC-A sends the echo request | Gateway's VLAN 10 MAC | `192.168.20.12` | 10 |
| Router sends the echo request onward | PC-B's MAC | `192.168.20.12` | 20 |
| PC-B sends the echo reply | Gateway's VLAN 20 MAC | `192.168.10.11` | 20 |
| Router sends the echo reply onward | PC-A's MAC | `192.168.10.11` | 10 |

With router-on-a-stick, the request travels toward the router tagged 10 and back toward the switch tagged 20 over the same physical link. With SVIs, the switch performs the Layer 3 transition internally. An endpoint's access link remains an ordinary untagged connection. Actual MAC values may be shared among logical interfaces on some platforms, so identify addresses from the device rather than expecting a different physical-looking MAC for every subinterface.

## Router-on-a-stick

Start with a switch whose PC ports belong to VLANs 10 and 20. Its router-facing Gi0/1 must be a static 802.1Q trunk allowing those VLANs. Configure native VLAN 99 consistently; it is unused for host traffic here. A router's ordinary Ethernet subinterfaces do not negotiate DTP with the switch, so dynamic auto is not a substitute for static trunk mode.

On a 2911 router, the following example uses Gi0/0 as the parent interface. Each subinterface receives the address that hosts in that VLAN will use as their default gateway.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no ip address
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config-subif)# no shutdown
R1(config-subif)# exit
R1(config)# interface gigabitethernet0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0
R1(config-subif)# no shutdown
R1(config-subif)# exit
R1(config)# interface gigabitethernet0/0.99
R1(config-subif)# encapsulation dot1Q 99 native
R1(config-subif)# no shutdown
R1(config-subif)# end
```

The suffix `.20` is a locally chosen subinterface number. It does not select VLAN 20 by itself; `encapsulation dot1Q 20` does that. Matching numbers make maintenance easier, but `Gi0/0.200` with `encapsulation dot1Q 20` would still identify VLAN 20. Configure encapsulation before the IP address so the router knows the VLAN interface's encapsulation.

In this design the parent interface has no IP address. Its operational state is still essential: shutting it down removes connectivity for every subinterface sharing it. An individual subinterface can also be shut down. Conversely, a subinterface can show up/up even when the far-end trunk omits its VLAN or its encapsulation identifies the wrong VLAN. Its state is not proof of end-to-end Layer 2 delivery.

The native subinterface explicitly represents untagged VLAN 99 and has no IP address because this example offers no VLAN 99 gateway. Tagged VLANs 10 and 20 are matched independently by their tags. Do not invent an IP address for every configured subinterface or assume every native VLAN must provide a routed service.

## SVIs on a multilayer switch

An SVI represents a VLAN rather than a physical socket. PC-A can attach to one access port in VLAN 10 and another VLAN 10 host to a different access port; both can use the same SVI address as their gateway. On the multilayer switch, create the VLAN, assign the access ports, and configure its SVI.

This excerpt assumes VLANs 10 and 20 and their access ports already exist:

```ios DSW1
DSW1# configure terminal
DSW1(config)# ip routing
DSW1(config)# interface vlan 10
DSW1(config-if)# ip address 192.168.10.1 255.255.255.0
DSW1(config-if)# no shutdown
DSW1(config-if)# exit
DSW1(config)# interface vlan 20
DSW1(config-if)# ip address 192.168.20.1 255.255.255.0
DSW1(config-if)# no shutdown
DSW1(config-if)# end
DSW1# show ip interface brief
DSW1# show ip route
```

The logical interface and the VLAN database are different objects. `interface vlan 20` opens the SVI configuration; explicitly use `vlan 20` to create the Layer 2 VLAN. Then verify the state of both. A configured address cannot make an absent or nonforwarding VLAN usable.

With ordinary Catalyst SVI autostate behavior, three conditions are needed for the SVI to operate: the VLAN exists and is active, the SVI is not administratively shut down, and at least one eligible Layer 2 port in that VLAN is linked and spanning-tree forwarding. An access port can satisfy that last condition. A trunk can also satisfy it if it carries and forwards the VLAN. Advanced autostate exceptions exist, but the labs do not configure them.

These conditions explain why unplugging the only active host in VLAN 20 can take the SVI line protocol down. They also explain why unplugging one host might not do so when an active trunk still carries VLAN 20. Inspect all participating ports before drawing a conclusion from one disconnected cable.

An SVI can provide the switch's **own management address** without routing users between VLANs. On a non-routing access switch, an address such as `192.168.99.10/24` on Vlan99 makes the switch reachable in that subnet, provided the VLAN has a working path. `ip default-gateway 192.168.99.1` supplies a next hop for that switch's traffic to remote subnets. The remote network also needs a working path back; this command alone does not create it.

:::trap Reachable SVI does not prove forwarding
A host can ping its own SVI gateway address while the switch is not forwarding between VLANs. Check `ip routing` and the routing table. Once routing is enabled, the switch uses destination-matching routes instead of `ip default-gateway`. A default route is one possible route for otherwise unmatched destinations, not a requirement for communication between directly connected VLANs.
:::

## Routed ports and gateway designs

A **routed port** places Layer 3 addressing on a physical switch interface. On a supporting multilayer switch, `no switchport` converts the selected Layer 2 port to that role. Unlike an SVI, the routed interface is not associated with a switched VLAN or that VLAN's member ports.

```ios DSW1
DSW1# configure terminal
DSW1(config)# interface gigabitethernet1/0/24
DSW1(config-if)# no switchport
DSW1(config-if)# ip address 10.0.12.2 255.255.255.252
DSW1(config-if)# no shutdown
DSW1(config-if)# end
DSW1# show interfaces gigabitethernet1/0/24 switchport
```

This example creates an ordinary untagged Layer 3 Ethernet connection to a router at `10.0.12.1/30`. It still uses Ethernet MAC addresses and ARP to reach that neighbor. “Routed” does not mean “no Layer 2 header”; it means the port is not participating as an access or trunk switchport. The displayed `Switchport: Disabled` confirms that role. Do not assume every switch model or interface supports conversion.

| Design | Gateway location | Physical connection | Main consideration |
|---|---|---|---|
| One router interface per VLAN | Physical router interfaces | Separate access link per VLAN | Simple separation but uses more ports |
| Router-on-a-stick | Router subinterfaces | Shared 802.1Q trunk | VLANs share the link's capacity and failure point |
| Multilayer switch with SVIs | Logical interfaces for local VLANs | Hosts use normal access ports | Routes between those VLANs internally |
| Routed switch port | Physical Layer 3 interface | IP link to a neighbor | Useful for connecting routing devices |

These designs can coexist. A distribution switch might use SVIs toward access VLANs and a routed port toward another router. The lab tests the routed port's directly connected neighbor only. Reaching networks beyond that neighbor requires appropriate forward and return routes, covered in the routing chapters. A successful ping between the two link addresses does not establish those remote routes.

## Verify and troubleshoot

Verify in layers. First inspect the host's IP address, mask and gateway. Then prove its access VLAN and local gateway reachability. For router-on-a-stick, inspect the switch trunk, router parent state, subinterface VLAN identifiers and gateway addresses. For SVIs, inspect VLAN existence, member-port forwarding, interface state and `ip routing`. Finally, verify a route to the destination and a return path.

Two narrower displays support this investigation. `show interfaces vlan 10` reports detailed state and the hardware address of that SVI. `show ip route connected` filters the routing display to connected routes; use the full `show ip route` when you also need local-address entries. These commands inspect different objects, even though both concern the same VLAN's gateway.

The following is a representative, abbreviated modern IOS routing-table example for working VLANs 10 and 20. Older software may display connected entries without separate `L` entries.

```output R1# show ip route
C    192.168.10.0/24 is directly connected, GigabitEthernet0/0.10  ← Connected subnet
L    192.168.10.1/32 is directly connected, GigabitEthernet0/0.10  ← Router's own address
C    192.168.20.0/24 is directly connected, GigabitEthernet0/0.20  ← Destination subnet for PC-B
L    192.168.20.1/32 is directly connected, GigabitEthernet0/0.20  ← Router's own address
```

The `C` route represents the directly connected subnet. The `L` route represents delivery to the router's own address. Routes tied to an unusable interface are withdrawn; their presence therefore adds evidence beyond simply seeing an IP address in the running configuration. Their presence still does not prove that every endpoint has the right gateway or that the switch trunk delivers the correct tags.

| Evidence | What to investigate next |
|---|---|
| `administratively down` | The interface's `shutdown` setting and intended role |
| SVI protocol down without administrative shutdown | VLAN existence/activity and eligible forwarding member ports |
| Subinterface up/up, local gateway unreachable | Tag mapping, allowed list, access VLAN and host addressing |
| Every host reaches its own SVI but cross-VLAN traffic fails | `ip routing`, routes, addressing and any actual filtering |
| One-way or selective IP communication | Both hosts' masks/gateways and the return route |

Do not assign a unique cause to every up/down versus down/down combination across platforms. Those states narrow the search; `show vlan brief`, `show interfaces status` and the actual configuration establish the cause. Likewise, do not repair a missing VLAN by repeatedly applying `no shutdown` to an SVI that is already enabled.

## Exam focus

- Determine when a host uses its gateway and which MAC address it resolves.
- Follow the frame rewrite and separate ARP exchanges across a routed boundary.
- Configure router subinterfaces with correct tags, addresses and parent state.
- Create VLANs and SVIs separately and verify their operational prerequisites.
- Distinguish an SVI management address from enabled inter-VLAN forwarding.
- Use `no switchport` and interface addressing for a supported routed port.
- Interpret connected and local routes without treating them as endpoint proof.
- Diagnose from configuration, interface state and traffic tests together.

Before leaving this chapter, explain each host's gateway choice, the trunk or SVI path, and the return route. Chapter 12 adds neighbor discovery so you can verify which devices and ports actually connect. Discovery builds a map; the VLAN, routing and service tests you already know establish whether that mapped path works.
