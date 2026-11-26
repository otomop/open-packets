---
id: layer2-security
number: 16
title: Layer 2 security
subtitle: Control endpoint traffic with port security, DHCP snooping, ARP inspection, storm control and RA guard.
part: switching
domain: services
minutes: { lesson: 75, lab: 110 }
summary: Build an access-port policy from the traffic it must permit. Configure and verify MAC limits, DHCP and ARP trust boundaries, storm thresholds and IPv6 router-advertisement protection, then diagnose failures without disabling every control.
objectives:
  v1: ["5.7"]
  v2: ["4.7", "4.7.a", "4.7.b", "4.7.c", "4.7.d", "4.7.e"]
prereqs: [network-models, ipv4-addressing, vlans-and-access-ports, stp-protection]
sectionIds:
  Protect the access layer: why-the-access-port-needs-its-own-defences
  Limit source MAC addresses with port security: port-security-who-may-talk-on-this-port
  Choose a violation response and recover service: violation-modes-aging-and-err-disable-recovery
  Establish DHCP snooping trust and bindings: dhcp-snooping-one-trusted-path-to-the-server
  Validate ARP claims with DAI: dynamic-arp-inspection-arp-must-match-the-bindings
  Limit traffic storms: storm-control-and-ipv6-ra-guard
sources:
  - { title: "RFC 2131: DHCP message exchange and relay fields", url: "https://www.rfc-editor.org/rfc/rfc2131.html" }
  - { title: "RFC 4291: IPv6 address representation and scope", url: "https://www.rfc-editor.org/rfc/rfc4291.html" }
  - { title: "RFC 4862: IPv6 stateless address autoconfiguration", url: "https://www.rfc-editor.org/rfc/rfc4862.html" }
  - { title: "Cisco: Catalyst 9300 SDM resources, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/configuring_sdm_templates.html" }
  - { title: "Cisco: Catalyst 9300 port security, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/port_security.html" }
  - { title: "Cisco: Catalyst 9300 DHCP and snooping, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/ip/b_1712_ip_9300_cg/configuring_dhcp.html" }
  - { title: "Cisco: Catalyst 9300 Dynamic ARP Inspection, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_dynamic_arp_inspection.html" }
  - { title: "Cisco: Catalyst 9300 traffic storm control, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_port_based_traffic_control.html" }
  - { title: "Cisco: Catalyst 9300 IPv6 First Hop Security, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_ipv6_first_hop_security.html" }
  - { title: "Cisco: Catalyst 3560 traffic-control command context", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swtrafc.html" }
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
---

Anyone who can reach a wall socket can talk to your switch, and the protocols behind that socket believe whatever they are told. Plug in a home router and it starts answering DHCP requests, handing the whole floor the wrong gateway. Run one free tool on a laptop and it answers ARP requests for the default gateway, so its neighbors send their traffic through it. A short script can fill the switch's MAC address table with thousands of invented source addresses. None of this needs a password.

[VLANs](#/chapter/vlans-and-access-ports) decided which broadcast domain a port joins, and [STP protection](#/chapter/stp-protection) stopped an access port from disturbing spanning tree. This chapter adds the controls that check what an endpoint claims about itself: port security for source MAC addresses, DHCP snooping for server replies, Dynamic ARP Inspection (DAI) for ARP, storm control for traffic floods and RA guard for IPv6 router advertisements. By the end you will be able to configure each one on an access switch, read its `show` output, and tell a blocked attack from a legitimate device that an unfinished configuration has cut off.

## Protect the access layer

Each control answers one question about one kind of traffic, and none of them covers for another. Port security counts source MAC addresses but never looks inside an ARP message. DHCP snooping trust admits DHCP server replies but does nothing for IPv6. You build an access-port policy one feature at a time, starting from the behavior you want to stop.

:::facts
- Port security is off by default. Once enabled on a Catalyst switch, the defaults are a maximum of **1** secure MAC address, violation mode **shutdown** and secure-address aging disabled (time **0**).
- DHCP snooping needs two global commands: `ip dhcp snooping` and `ip dhcp snooping vlan` with a VLAN list. Every port is **untrusted** by default; trust the ports where the real server's replies enter.
- DAI has its own trust setting. By default an untrusted port is limited to **15 ARP packets/s** over a **1-second** burst interval; a trusted port has no limit.
- Sticky addresses are written to the running configuration. Save it, or they are lost at the next reload.
- Storm thresholds and RA guard are explicit v2.0 configuration topics. v1.1 directly lists port security, DHCP snooping and DAI.
:::

Three protocols get full chapters later, but you need a working picture of each now. **DHCPv4** leases a host its IPv4 address and settings such as the default gateway; only a server sends the Offer, ACK and NAK messages of that exchange. **ARP** maps an IPv4 address to a MAC address on the local link, and a host believes any ARP reply it receives. **IPv6 Router Advertisements (RAs)** tell hosts which router and prefix to use. [DHCP](#/chapter/dhcp) and [IPv6 addressing](#/chapter/ipv6-addressing) develop them fully.

| Problem | Control | Limit to remember |
|---|---|---|
| Too many or unexpected source MAC addresses on a port | Port security | A MAC address can be copied, so a match does not identify a person |
| A rogue DHCP server answering clients | DHCP snooping trust | Trust is set per port, on every switch along the reply path |
| A host flooding DHCP requests | DHCP snooping rate limit | It suits access ports; an uplink carries many clients' requests |
| Forged ARP replies | Dynamic ARP Inspection | Every legitimate sender needs a binding, an ARP ACL entry or a trusted port |
| A flood of broadcast or multicast traffic | Storm control | It drops the excess; the loop or faulty device is still there |
| A rogue IPv6 router advertising itself | RA guard | It filters router messages only; it is not an IPv6 firewall |

Take MAC flooding as an example of the first row. [Ethernet switching](#/chapter/ethernet-switching) showed that a switch floods a frame whose destination MAC is not in its table. An attacker sends frames from thousands of invented source addresses until the table is full. The switch can then learn no more real hosts, so frames to any host it has not already learned are flooded to every port in the VLAN, including the attacker's. A limit of one or two source addresses on the access port ends the attack at the first extra address.

A rogue DHCP server or rogue RA attacks the hosts instead of the switch: a client that accepts the rogue's Offer sends its traffic to whatever default gateway the rogue supplied.

## Limit source MAC addresses with port security

**Port security** answers one question: which source MAC addresses may send frames into this port, and how many? The switch keeps the permitted addresses as **secure MAC addresses**. A **violation** occurs when the port already holds its maximum and a frame arrives from a new source, or when an address secured on one port appears on another secure port in the same VLAN.

Port security needs a port whose mode is fixed. A port left in its default dynamic mode rejects the command with `Command rejected: FastEthernet0/1 is a dynamic port.`, so set `switchport mode access` first. A static trunk can also be secured; an EtherChannel interface cannot.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 1
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
SW1# show port-security address
```

`switchport port-security` on its own turns the feature on with the defaults: one address, shutdown on violation. `mac-address sticky` tells the switch to write each address it learns into the running configuration. Suppose PC-A's MAC is `00aa.0000.0001`. When PC-A sends its first frame, the switch learns the address and adds the line `switchport port-security mac-address sticky 00aa.0000.0001` under Fa0/1. The port is now full: PC-A is permitted and any other source is a violation.

| Address type | How it is established | Persistence |
|---|---|---|
| Static secure | Administrator configures a MAC address | In running configuration; retained after restart when saved |
| Dynamic secure | Switch learns an address within the limit | Held in memory only; lost at restart |
| Sticky secure | Learned, then written as a sticky line | In running configuration; retained after restart when saved |

Sticky learning has two catches. The switch secures whichever device speaks first, so enable it while the intended endpoint is the only device attached, then check the learned entry. And the entry lives in the running configuration: without `copy running-config startup-config` it is gone after a reload. Port security also checks an address, not a person. Someone who sets PC-A's MAC on another laptop passes the check; proving who is connected is the job of authentication such as 802.1X.

Set the maximum to the number of addresses the port legitimately carries. A Cisco IP phone with a PC plugged into it needs two: the phone's MAC in the voice VLAN and the PC's MAC in the data VLAN. `show port-security address` lists each secure entry with its VLAN.

Secure addresses do not age out by default (aging time `0`). `switchport port-security aging time 10` removes dynamically learned secure addresses after 10 minutes, counted from when they were learned (`absolute`, the default) or last seen (`inactivity`). Sticky entries never age. This timer is separate from the 300-second aging of the ordinary MAC address table.

## Choose a violation response and recover service

The **violation mode** decides what the switch does about the extra address. All three modes drop the offending frames. They differ in how much they tell you and how much service they take away.

| Mode | Violating traffic | Traffic from secure addresses | What you see |
|---|---|---|---|
| `protect` | Dropped | Still forwarded | Nothing: no log message, no SNMP trap, violation counter unchanged |
| `restrict` | Dropped | Still forwarded | Syslog message, SNMP trap, violation counter increases |
| `shutdown` (default) | Dropped: the whole port stops | Stops too | Violation logged and counted; port `err-disabled`, status `Secure-shutdown` |

To see the difference, picture PC-A secured on Fa0/1 with maximum 1, and someone adding a small unmanaged switch so that PC-B shares the port. In protect mode PC-A keeps working, PC-B's frames vanish and nothing on SW1 records it. In restrict mode PC-A keeps working and PC-B's frames are dropped, but now a `%PORT_SECURITY-2-PSECURE_VIOLATION` syslog message names PC-B's MAC, an SNMP trap is sent and the counter rises with every dropped frame. In shutdown mode the first frame from PC-B err-disables Fa0/1, the state BPDU guard used in [STP protection](#/chapter/stp-protection), so PC-A loses service too.

Shutdown is the default. To choose another mode on a port that is already secured:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport port-security violation restrict
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
```

The command changes only the response. The secure addresses and the maximum stay as they were. After a shutdown violation, `show interfaces status` lists the port as `err-disabled` and the port-security output (abbreviated here) looks like this:

```output SW1# show port-security interface fastethernet0/1
Port Security              : Enabled
Port Status                : Secure-shutdown  ← the port was disabled by a violation
Violation Mode             : Shutdown
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1                ← the permitted secure-address capacity is occupied
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 1
Security Violation Count   : 1                ← this example shows one incident
```

A healthy secured port shows `Secure-up`. Before you restore service, find the source that caused the violation. Remove an unapproved device, or raise the maximum if an approved endpoint needs a second address. Then reset the port, because an err-disabled port stays down until something re-enables it:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces status
SW1# show port-security interface fastethernet0/1
```

The switch can also reset the port for you. `errdisable recovery cause psecure-violation` in global configuration re-enables a port **300 seconds** after a port-security shutdown, and `errdisable recovery interval` changes that timer. Recovery is off for every cause by default; `show errdisable recovery` lists the causes that are enabled. A timer cannot fix the cause. If the offending device is still attached, the port comes back, sees the same violation and shuts down again.

## Establish DHCP snooping trust and bindings

A rogue DHCP server works because a client accepts the first Offer it hears. **DHCP snooping** removes that opening by sorting switch ports into two kinds. On an **untrusted** port, which is the default, the switch drops DHCP server messages. On a **trusted** port it lets them in. You trust only the ports that lead toward the real server, so a server plugged into any other port is never heard. While it watches, snooping also records each lease it sees completed in a **binding table**, which DAI relies on in the next section.

The lease exchange shows which messages count as server messages. A **pool** is the server's set of addresses and options for one client network.

| Message | Sender and purpose |
|---|---|
| Discover | Client looks for a server; it has no leased address yet |
| Offer | Server proposes an address and configuration |
| Request | Client asks to use the offered assignment |
| ACK | Server acknowledges the assignment; snooping learns the binding |

A **NAK** (negative acknowledgment) is the server refusing a client's Request. Offer, ACK and NAK all come from a server, so all three are dropped on an untrusted port. Discover and Request come from clients and are allowed in.

Trust is decided at the port where a reply *enters* each switch, so trace the server-to-client path one switch at a time. In the topology below R1 is the only DHCP server. Its replies enter SW1 on Gi0/1, so SW1 trusts Gi0/1. They enter SW2 on its uplink Gi0/1, so SW2 trusts that port. SW1's downlink Gi0/2 only ever receives client messages from SW2, so it stays untrusted even though it is a switch-to-switch trunk. If SW2 were an unmanaged switch with a rogue server behind it, SW1 would still drop the rogue's Offers at Gi0/2.

```diagram
{"type":"topology","title":"Trust follows the permitted server direction","caption":"Snooping trust is applied where authorized replies enter each switch: SW1 Gi0/1 and SW2 Gi0/1. The client-facing downlink on SW1 is not automatically trusted.","nodes":[{"id":"R","kind":"router","label":"R1 · DHCP","x":1,"y":1},{"id":"S1","kind":"switch","label":"SW1","x":5,"y":1},{"id":"S2","kind":"switch","label":"SW2","x":9,"y":1},{"id":"A","kind":"pc","label":"PC-A","x":5,"y":5},{"id":"B","kind":"pc","label":"PC-B","x":9,"y":5}],"links":[{"from":"R","to":"S1","toLabel":"Gi0/1 trusted"},{"from":"S1","to":"S2","fromLabel":"Gi0/2 untrusted","toLabel":"Gi0/1 trusted"},{"from":"S1","to":"A","fromLabel":"Fa0/1 untrusted"},{"from":"S2","to":"B","fromLabel":"Fa0/1 untrusted"}],"trace":{"flows":[{"path":["B","S2","S1","R"],"back":true,"label":"PC-B's DHCP exchange","tags":{"S1":"Downlink Gi0/2 stays untrusted"},"backTags":{"S1":"Server reply · trusted Gi0/1","S2":"Server reply · trusted Gi0/1"}}]}}
```

Snooping needs two global commands, and forgetting the second is a common fault. `ip dhcp snooping` turns the feature on, and `ip dhcp snooping vlan 10` names the VLAN to inspect. With only the first command, no VLAN is inspected.

One default causes many failed labs. A snooping switch inserts **Option 82**, relay-agent information that records the switch and port where a request arrived, into each client request it forwards. Option 82 was designed for **DHCP relay**, where a router forwards client broadcasts to a server on another IP network and writes its own address into the request's `giaddr` field ([DHCP](#/chapter/dhcp) covers relay). A request forwarded by an access switch carries Option 82 while `giaddr` is still `0.0.0.0`, and a Cisco IOS DHCP server discards that combination by default. An upstream snooping switch also drops it on an untrusted port. Where nothing uses Option 82, turn insertion off with `no ip dhcp snooping information option`, as this chapter's examples do on both switches.

```ios SW1
SW1# configure terminal
SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10
SW1(config)# no ip dhcp snooping information option
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip dhcp snooping trust
SW1(config-if)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# ip dhcp snooping limit rate 15
SW1(config-if)# end
SW1# show ip dhcp snooping
SW1# show ip dhcp snooping binding
```

Snooping runs two checks on client messages from untrusted ports. It drops a message whose Ethernet source MAC differs from the client hardware address (`chaddr`) inside it. And `ip dhcp snooping limit rate 15` caps DHCP packets on that port at 15 per second; a port that exceeds its limit is err-disabled. There is no limit until you configure one. The limit blunts a **DHCP starvation** attack, in which one host requests lease after lease under invented client addresses until the pool is empty. Set it on access ports; an uplink carries the DHCP traffic of every client behind it.

After PC-A obtains a lease, the binding table holds one row for it:

```output SW1# show ip dhcp snooping binding
MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface
------------------  ---------------  ----------  -------------  ----  --------------------
00:AA:00:00:00:01   10.1.10.50       86350       dhcp-snooping   10    FastEthernet0/1  ← PC-A's MAC, IP, VLAN and port
Total number of bindings: 1
```

Each row ties a client MAC and IP address to the VLAN and port where the client was seen, for the length of the lease. The switch learns a row only from an exchange it watches: a host that obtained its lease before snooping was enabled has no binding until it renews, and a host with a static address never has one. The table is held in memory, so saving the configuration does not save it, and a reload empties it unless a snooping database is configured.

## Validate ARP claims with DAI

:::trap
DHCP snooping trust and DAI trust are separate settings. A correct DHCP reply path does not automatically permit the ARP traffic needed for a working LAN.
:::

ARP has no way to check an answer. When PC-A asks who has `10.1.10.1`, it believes whichever reply arrives, even one it never asked for. An attacker in the same VLAN who keeps announcing that `10.1.10.1` is at the attacker's MAC address receives the traffic PC-A meant for its gateway. This is **ARP spoofing**, also called ARP poisoning.

**Dynamic ARP Inspection (DAI)** stops it by checking every ARP message that enters an untrusted port in an inspected VLAN. The sender IP and sender MAC inside the ARP message must match a row in the DHCP snooping binding table for that VLAN and port. If they do not, the switch drops the message and counts the drop.

Use the binding from the previous section: `10.1.10.50` belongs to `00aa.0000.0001` on Fa0/1 in VLAN 10. An ARP message entering Fa0/1 with that sender IP and MAC passes. An ARP reply entering Fa0/2 that claims sender `10.1.10.1` with PC-B's MAC matches no row and is dropped, so PC-B cannot pose as the gateway. This is also why DAI depends on snooping: on a VLAN that snooping does not cover there are no bindings, so every ARP message from an untrusted port is dropped.

A device with a static address never uses DHCP, so it has no binding. There are two ways to admit it. `ip arp inspection trust` makes a port skip inspection altogether; use it on links to routers and to other switches that run DAI themselves. For a static host on an access port, leave the port untrusted and permit that one IP-and-MAC pair with an **ARP access control list (ACL)**. An ARP ACL matches the sender fields of ARP messages only; it is not the IPv4 packet ACL taught in Chapter 34.

In this chapter's design R1 has a static address, so SW1 trusts Gi0/1 twice, with two separate commands: DHCP snooping trust for R1's server replies, and DAI trust for R1's ARP.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip arp inspection trust
SW1(config-if)# exit
SW1(config)# ip arp inspection vlan 10
SW1(config)# end
SW1# show ip arp inspection interfaces
SW1# show ip arp inspection vlan 10
SW1# show ip arp inspection statistics vlan 10
```

The statistics show what DAI did and why:

```output SW1# show ip arp inspection statistics vlan 10
 Vlan      Forwarded        Dropped     DHCP Drops      ACL Drops
 ----      ---------        -------     ----------      ---------
   10             27              4              4              0  ← 4 ARP messages matched no binding
```

A static printer shows the ARP ACL at work. Excluding `10.1.10.20` from the DHCP pool stops the server leasing that address, but it creates no binding, so DAI drops the printer's ARP. If the printer's MAC is `000c.2911.7a3e`, this ACL permits exactly that pair:

```ios SW1
SW1# configure terminal
SW1(config)# arp access-list STATIC-HOSTS
SW1(config-arp-nacl)# permit ip host 10.1.10.20 mac host 000c.2911.7a3e
SW1(config-arp-nacl)# exit
SW1(config)# ip arp inspection filter STATIC-HOSTS vlan 10
SW1(config)# end
SW1# show arp access-list STATIC-HOSTS
```

Each `host` keyword means one exact address, so both the sender IP and the sender MAC must match. DAI consults the ACL before the bindings, in this order: an explicit `permit` forwards the ARP message, an explicit `deny` drops it, and no match at all sends it on to the binding table. Adding `static` to the end of the `filter` command removes that last step, so anything the ACL does not permit is dropped. On a VLAN that also has DHCP clients, leave `static` off or the clients lose ARP.

Three optional checks compare an ARP message with the Ethernet frame that carries it. `ip arp inspection validate src-mac` drops an ARP message whose sender MAC differs from the frame's source MAC, `dst-mac` does the same in replies for the target MAC and the frame's destination MAC, and `ip` drops impossible addresses such as `0.0.0.0` or `255.255.255.255`. List every check you want in one command, because a new `validate` command replaces the previous one.

DAI also rate-limits ARP so that a flood cannot overload the switch. An untrusted port may receive **15 ARP packets per second** by default and is err-disabled with cause `arp-inspection` if it exceeds that; a trusted port has no limit. This limit counts ARP only and is unrelated to the DHCP snooping limit, even when both are set to 15.

## Limit traffic storms

A broadcast storm can come from a switching loop, a failing network card or a misbehaving application, and every host in the VLAN must process the flood. **Storm control** is the safety valve. On each configured port it measures one class of incoming traffic (broadcast, multicast or unicast) over one-second intervals and drops that class while it is above a threshold, so the rest of the VLAN stays usable while you find the source.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/2
SW1(config-if)# storm-control broadcast level 1.00 0.50
SW1(config-if)# end
SW1# show storm-control fastethernet0/2 broadcast
```

The first number is the **rising threshold**: when broadcasts reach 1% of the port's bandwidth, the switch starts dropping broadcasts on this port. The second is the **falling threshold**: dropping stops only when broadcasts fall below 0.5%. The gap keeps the port from flapping between the two states. Suppose broadcasts climb to 2%, so the port blocks them. They ease to 0.8%, which is under the rising threshold but still above the falling one, so the port keeps blocking. At 0.4% it forwards again. The falling value cannot exceed the rising value, and if you omit it the two are equal.

A percentage is a share of the port's bandwidth, not a packet count: 1% is about 1 Mb/s on a 100 Mb/s port and 10 Mb/s on a 1 Gb/s port, so copying a threshold between ports of different speeds changes the rate allowed. On supporting platforms a threshold can also be given as `level bps` or `level pps`.

By default storm control only drops the excess traffic class, and other traffic on the port continues. `storm-control action shutdown` err-disables the port instead, and `storm-control action trap` sends an SNMP trap when a storm is detected.

```output SW1# show storm-control fastethernet0/2 broadcast
Interface  Filter State   Upper        Lower        Current
---------  -------------  -----------  -----------  ----------
Fa0/2      Forwarding       1.00%        0.50%        0.00%  ← below both thresholds, so nothing is dropped
```

A filter state of `Blocking` means storm control is dropping that traffic type on the port; it is unrelated to a spanning-tree blocking state. Storm control contains the symptom, so still find and fix the loop or the faulty device, and never build a loop to test it.

## Control IPv6 router advertisements

IPv6 hosts find their default router by listening. Routers announce themselves with **Router Advertisements (RAs)**, and a host that hears one can configure an address and a default route from it, with no server and no lease. So any device that sends RAs becomes a default router for the hosts in its VLAN, and a PC with connection sharing switched on can do that by accident. DHCP snooping cannot help, because it inspects DHCPv4 only.

You need a small part of IPv6 here before Chapter 19 develops its addressing rules. An IPv6 address has 128 bits, written as colon-separated hexadecimal groups; `::` compresses consecutive zero groups. In the lab, `fe80::1` is a router's **link-local** address, usable only on its own link, and routers send RAs from that address. `2001:db8:16:10::/64` is a documentation prefix for a client LAN; /64 counts its network bits. With **SLAAC (Stateless Address Autoconfiguration)**, a host combines the /64 prefix advertised in an RA with its own interface identifier and uses the RA's link-local source as its default router. An unauthorized RA can therefore hand hosts a different prefix or router even while IPv4 DHCP works normally.

**RA guard** applies the idea behind DHCP snooping trust: decide which ports may legitimately send router messages and drop those messages everywhere else. You define a named policy with a **device role** and attach it to ports. A policy with `device-role host` drops RAs and router Redirect messages arriving on the port. A policy with `device-role router` allows them.

```ios SW1
SW1# configure terminal
SW1(config)# ipv6 nd raguard policy HOSTS
SW1(config-nd-raguard)# device-role host
SW1(config-nd-raguard)# exit
SW1(config)# ipv6 nd raguard policy ROUTERS
SW1(config-nd-raguard)# device-role router
SW1(config-nd-raguard)# exit
SW1(config)# interface gigabitethernet1/0/1
SW1(config-if)# ipv6 nd raguard attach-policy HOSTS
SW1(config-if)# exit
SW1(config)# interface gigabitethernet1/0/24
SW1(config-if)# ipv6 nd raguard attach-policy ROUTERS
SW1(config-if)# end
SW1# show ipv6 nd raguard policy HOSTS
SW1# show ipv6 nd raguard policy ROUTERS
```

Two details catch people out. A policy does nothing until it is attached, so check the interface as well as the policy. And attach a router-role policy to the port facing the real router as well as host-role policies to the endpoint ports. If the router's port gets the host role by mistake, IPv6 hosts lose router discovery while IPv4 carries on working.

RA guard filters new messages only. A host that already accepted a rogue RA keeps that address and default router until their lifetimes expire, so judge a policy change by watching for fresh RAs, not by what a host still remembers.

These interface names belong to the Catalyst 9300 reference platform, not the Packet Tracer 2960 used for the rest of the chapter. If your simulator does not offer RA guard, the lab supplies a paper path for this part.

## Verify and troubleshoot

Start from the service that failed and work toward the feature responsible. Change one thing at a time and keep a known-good baseline to compare against.

| Symptom | Likely causes | Check |
|---|---|---|
| Port is `err-disabled` | Port-security shutdown, a DHCP or ARP rate limit, storm-control shutdown, or BPDU guard | `show interfaces status`, `show logging`, `show port-security interface`, `show errdisable recovery` |
| Client gets no lease after snooping is enabled | VLAN missing from snooping, server-facing port untrusted, or Option 82 rejected by the server | `show ip dhcp snooping` |
| Client has an address but cannot reach its gateway | No binding because the lease predates snooping, or the gateway's port is not DAI-trusted | `show ip dhcp snooping binding`, `show ip arp inspection statistics vlan 10` |
| Static host fails when DAI is enabled | No binding and no ARP ACL permit; a DHCP exclusion does not supply one | `show arp access-list`, `show ip arp inspection vlan 10` |
| Broadcasts disappear in bursts | Storm control is above its rising threshold | `show storm-control` |
| IPv4 works but IPv6 router discovery fails | Host role on the router's port, or a policy that is defined but not attached | `show ipv6 nd raguard policy`, the interface's running configuration |

Three kinds of evidence answer three different questions. The running configuration shows what you intended. Bindings, counters and port states show what the switch is doing now. A fresh test, such as a renewed lease or a ping after clearing the ARP cache, shows whether the service works. An old lease or a cached ARP entry can make a broken policy look healthy, so test with fresh traffic.

## Exam focus

- Port security goes on a static access or trunk port. Defaults: maximum 1, violation shutdown, no aging, sticky off.
- Protect drops silently; restrict drops, logs and counts; shutdown also err-disables the port (`Secure-shutdown`).
- Sticky addresses live in the running configuration; save it to keep them across a reload.
- Recover an err-disabled port with `shutdown` then `no shutdown` after removing the cause, or enable `errdisable recovery cause psecure-violation` (300 seconds).
- DHCP snooping needs `ip dhcp snooping` and `ip dhcp snooping vlan`. Untrusted ports, the default, drop Offer, ACK and NAK; trust the ports where the real server's replies enter.
- The binding table (MAC, IP, lease, VLAN, port) comes from leases the switch watches, and DAI validates ARP against it.
- DAI trust is separate from DHCP snooping trust. Admit a static host with an ARP ACL; `static` removes the fallback to bindings.
- Untrusted DAI ports default to 15 ARP packets per second; DHCP snooping has no rate limit until you set one. Exceeding either err-disables the port.
- For v2.0: storm control drops a traffic class from the rising threshold until it falls below the falling one, and RA guard needs a policy with a device role attached to each port.
