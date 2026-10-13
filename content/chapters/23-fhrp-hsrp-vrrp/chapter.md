---
id: fhrp-hsrp-vrrp
number: 23
title: "HSRP and VRRP"
subtitle: Read gateway redundancy status and prove that traffic survives the loss of one router.
part: routing
domain: routing
minutes: { lesson: 65, lab: 75 }
summary: Understand a virtual default gateway, interpret HSRP and VRRP roles, and distinguish a successful election from working end-to-end forwarding. Use a guided HSRP lab to observe failover, preemption, and uplink tracking.
objectives:
  v1: ["3.5"]
  v2: ["3.4"]
prereqs: [inter-vlan-routing, stp-protection, static-routing-ipv4, ipv6-addressing, ospfv2]
sectionIds:
  Why hosts need a redundant gateway: the-problem-a-host-trusts-one-gateway
  HSRP groups and role selection: hsrp-groups-roles-and-the-election
  HSRP states and failure detection: states-timers-and-failover-mechanics
  Priority, preemption, and tracking: configuring-hsrp-priority-preemption-tracking-timers
  VRRP for IPv4 and IPv6: vrrp-and-glbp
sources:
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: HSRP features and functionality", url: "https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/9234-hsrpguidetoc.html" }
  - { title: "Cisco: HSRP Frequently Asked Questions", url: "https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/9281-3.html" }
  - { title: "Cisco: Use HSRP Preempt and Track Commands", url: "https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/13780-6.html" }
  - { title: "Cisco IOS: Configuring HSRP, including equal-priority preemption", url: "https://www.cisco.com/en/US/docs/ios-xml/ios/ipapp_fhrp/configuration/15-0s/fhp-hsrp.html" }
  - { title: "RFC 2281: HSRP state machine", url: "https://www.rfc-editor.org/rfc/rfc2281.html" }
  - { title: "Cisco IOS: Configuring VRRP", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipapp_fhrp/configuration/15-mt/fhp-15-mt-book/fhp-vrrp.html" }
  - { title: "Cisco IOS XE 17: VRRPv3 Protocol Support", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ntw-servs/b-network-services/m_fhrp-vrrpv3-xe.html" }
  - { title: "RFC 9568: Current VRRPv3 standard for IPv4 and IPv6", url: "https://www.rfc-editor.org/rfc/rfc9568" }
---
## Why hosts need a redundant gateway

:::facts
- A **first hop redundancy protocol (FHRP)** lets multiple routers provide one virtual default gateway.
- In ordinary IPv4 HSRP, hosts use the **virtual IP**, which resolves to the group's **virtual MAC**.
- HSRP roles are **Active** and **Standby**. Cisco VRRP output commonly says **Master** and **Backup**; the current VRRP standard calls the forwarding role **Active**.
- HSRP's normal IOS defaults are priority **100**, Hello **3 seconds**, hold **10 seconds**, and **preemption disabled**.
- VRRP's normal defaults are priority **100**, advertisements **1 second**, and **preemption enabled** for non-owner routers.
:::

A PC sends off-subnet traffic to its default gateway. If that address belongs only to R1, adding R2 to the same LAN does not automatically teach the PC to use R2 when R1 fails. Routing protocols can repair paths between routers, but they do not necessarily change a host's configured gateway.

An FHRP provides a shared **virtual router**. In the example below, R1's real LAN address is `192.168.10.2` and R2's is `192.168.10.3`. Both participate in a group using virtual IP `192.168.10.1`. PC-A uses `192.168.10.1` as its gateway. The router currently responsible for that virtual identity forwards the PC's off-subnet packets.

```diagram
{ "type": "topology", "title": "Fig 23.1 — One host gateway, two forwarding candidates", "caption": "The PC uses the virtual address .1; each router keeps its own .2 or .3 address and needs a working upstream path.", "nodes": [
{ "id": "PC", "kind": "pc", "label": "PC-A", "sub": "192.168.10.10/24, GW .1", "x": 1, "y": 3 },
{ "id": "SW", "kind": "switch", "label": "SW1", "sub": "VLAN 10", "x": 4, "y": 3 },
{ "id": "R1", "kind": "router", "label": "R1", "sub": ".2, Active", "x": 8, "y": 1 },
{ "id": "R2", "kind": "router", "label": "R2", "sub": ".3, Standby", "x": 8, "y": 5 },
{ "id": "R3", "kind": "router", "label": "R3", "sub": "Remote network", "x": 11.5, "y": 3 }
], "links": [
{ "from": "PC", "to": "SW", "label": "gateway .1" },
{ "from": "SW", "to": "R1", "label": "virtual MAC" },
{ "from": "SW", "to": "R2" },
{ "from": "R1", "to": "R3" },
{ "from": "R2", "to": "R3" }
], "trace": { "flows": [
{ "path": ["PC", "SW", "R1", "R3"], "label": "PC-A pings 203.0.113.10", "tags": { "PC": "IP dst 203.0.113.10 · MAC virtual", "SW": "dst virtual MAC → R1", "R1": "Active · ordinary routing decision" } }
] } }
```

The virtual IP is a next-hop address, not a replacement destination for each packet. For a ping to `203.0.113.10`, the IP destination stays `203.0.113.10` while the first Ethernet frame is addressed to the virtual MAC. The active router then makes an ordinary routing decision.

Both candidate gateways need valid routes and a usable return path. FHRP does not synchronize every routing table or preserve arbitrary NAT/firewall session state. The shared access switch in this teaching topology is also still a single point of failure. Test the specific failure you intend to protect against.

The track distinction sets the depth: v1.1 asks you to describe FHRP purpose, functions, and concepts; v2.0 asks you to interpret HSRP/VRRP operational status. The configuration below is guided practice that produces meaningful output. It is not a claim that either blueprint requires every optional FHRP configuration feature.

## HSRP groups and role selection

**Hot Standby Router Protocol (HSRP)** is Cisco's FHRP. A group has one Active router forwarding for the virtual identity and one Standby prepared to take over. Additional group members can listen. The Standby still routes packets addressed to its own real interface; it is not a powered-off router.

During initial role selection, the higher HSRP priority is preferred. IOS priorities range from 0 to 255, with default 100. If candidates have equal priority during an election, the higher primary interface IPv4 address breaks the tie. Existing active status changes the reasoning: a newly available higher-priority router needs **preemption** to take over from a healthy active router. An equal-priority router does not preempt the active router merely because its IP address is higher.

| IPv4 HSRP property | Version 1 | Version 2 |
|---|---|---|
| Group range | 0–255 | 0–4095 |
| Hello multicast | `224.0.0.2` | `224.0.0.102` |
| Transport | UDP 1985 | UDP 1985 |
| Default virtual MAC form | `0000.0c07.acXX` | `0000.0c9f.fXXX` |
| Version selection on IOS interface | `standby version 1` | `standby version 2` |

The suffix is the group number in hexadecimal. Group 10 in HSRPv1 uses `0000.0c07.ac0a`; group 1 in HSRPv2 uses `0000.0c9f.f001`. The MAC format tells you the configured IPv4 version and group, not which physical router currently forwards.

Match the version, group, virtual IP, and relevant authentication settings on participating routers. The group number need not equal the VLAN number, but consistent naming reduces mistakes. Ordinary HSRP examples use an unused virtual IP in the LAN subnet, distinct from both routers' real addresses. Changing the HSRP version affects the interface's groups and their virtual identities, so do it deliberately on both peers.

Different groups can prefer different routers. For VLAN 10, give R1 priority 110 and R2 90; for VLAN 20, reverse those values and enable preemption. Each VLAN still has one Active router for its own group, but the two routers share gateway duties across the two VLANs. A priority configured in one group does not control the other group.

## HSRP states and failure detection

Read HSRP states as conditions, not a sequence every router must traverse. **Initial** means HSRP is not operating on the interface. **Learn** waits to learn the virtual address. **Listen** knows the virtual address but is not the Active or Standby. **Speak** participates in the election. **Standby** is ready to replace the Active. **Active** forwards for the virtual identity.

Speak, Standby, and Active routers send Hello messages. Listen-state routers do not. The other message types are **Coup**, used in preemption, and **Resign**, used when an active router relinquishes its role. You mainly need to distinguish settled Active/Standby operation from initialization, isolation, or repeated state changes.

A silent failure is detected when the standby's active-router hold timer expires. With default timers, that timer is 10 seconds from the last accepted active Hello. Failure may occur partway through the interval, so failover is not guaranteed to take exactly 10 seconds after the event, nor is the protocol simply counting three missed messages. An explicit resignation or a detected local link event can produce different timing. Record elapsed observations in your lab instead of treating the default as a stopwatch promise.

A **gratuitous ARP** is an unsolicited announcement of an IPv4-to-MAC mapping. After takeover, frames sourced from the virtual MAC, including these announcements, help the switch learn the new port for that MAC. In normal steady-state failover the host can retain the same virtual-IP-to-virtual-MAC mapping. Host ARP entries may still refresh or expire as part of ordinary operation; the important point is that changing the configured gateway is unnecessary.

:::trap The gateway can be stable while the switch table changes
The virtual IP and virtual MAC remain associated with the group. The switch must now forward traffic for that MAC toward the new active router. Do not confuse the switch's MAC-to-port table with the host's IP-to-MAC ARP cache.
:::

## Priority, preemption, and tracking

Use a separate real address on each router and the same virtual IP. This pattern supplements the complete lab:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 192.168.10.2 255.255.255.0
R1(config-if)# standby 1 ip 192.168.10.1
R1(config-if)# standby 1 priority 110
R1(config-if)# standby 1 preempt
R1(config-if)# no shutdown
R1(config-if)# end
```

R2 uses real address `192.168.10.3`, the same group/VIP, priority 100, and preempt. R1 is preferred. When R1 disappears, R2 can take over even without preemption: failure takeover and preemption of a healthy active router are different events.

**Tracking** links gateway preference to another condition, such as an uplink's line protocol. Without tracking, R1 can lose its uplink yet keep sending healthy Hellos on the LAN. R2 sees no failed gateway even though R1 cannot reach the remote network.

An IOS object-tracking example is:

```ios R1
R1# configure terminal
R1(config)# track 1 interface gigabitethernet0/1 line-protocol
R1(config-track)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# standby 1 track 1 decrement 20
R1(config-if)# end
```

When the tracked object fails, R1's effective priority becomes **110 − 20 = 90**. R2's 100 is higher, so R2 can preempt. R2 needs preemption enabled for this healthy-LAN takeover. If the decrement were 5, R1 would remain at 105 and still outrank R2. If it were 10, the tie would not provide the intended strict priority advantage. Choose a decrement that makes the intended preference unambiguous.

The legacy `standby 1 track gigabitethernet0/1 20` syntax is an alternative on images that support interface tracking directly. The lab names both forms and gives a paper fallback for simulator omissions. Tracking local line protocol detects that local condition; it does not prove every upstream destination is reachable.

A preempt delay such as `standby 1 preempt delay minimum 60` can allow routing to recover before taking the active role. Timer changes such as `standby 1 timers 1 3` are optional practice; shorter timers trade faster detection for greater sensitivity to congestion or CPU delay. Our lab keeps ordinary 3/10 timers.

## VRRP for IPv4 and IPv6

**Virtual Router Redundancy Protocol (VRRP)** is standards based. VRRPv2 supports IPv4. VRRPv3 supports IPv4 and IPv6; RFC 9568 is the current v3 specification and replaces RFC 5798. Many Cisco releases still display **Master** for the forwarding role, while RFC 9568 calls it **Active**. Treat these as equivalent role names in their respective documentation.

VRRP uses IP protocol/IPv6 Next Header **112**, not UDP. For IPv4, advertisements use `224.0.0.18` and the virtual MAC form is `0000.5e00.01XX`. For IPv6 they use `ff02::12` and `0000.5e00.02XX`. XX is the virtual router identifier (VRID), 1–255, in hexadecimal. IPv4 and IPv6 instances are separate; an IPv4 Master result does not establish which router forwards for an IPv6 instance.

The normal configurable non-owner priority is 1–254, default 100; higher is preferred. Priority **255** belongs to the **address owner**, whose real address is the virtual address. Priority **0** is used in a protocol advertisement to relinquish the role, not as an ordinary candidate preference. VRRP permits this owner case, unlike the ordinary separate-virtual-address HSRP design used here.

Preemption is normally enabled for VRRP. A returning higher-priority non-owner router can reclaim the forwarding role unless preemption has been disabled. The address owner has special priority/ownership behavior and takes precedence; identify the owner flag before treating all peers as ordinary priority-100 candidates.

With 1-second advertisements and a non-owner priority of 100, the backup's down interval is approximately **3.6 seconds**. It includes three advertisement intervals plus a priority-dependent skew. Exact arithmetic is useful when an output supplies it, but subsecond tuning and state-machine timer formulas are not this chapter's focus.

For IPv6, the virtual gateway identity includes a virtual link-local address; hosts use IPv6 Neighbor Discovery, not ARP. A VRRPv3 status view must therefore be read with its address family and virtual address. There is no need to memorize GLBP's separate load-sharing machinery for the published HSRP/VRRP status objective.

For optional configuration recognition, classic IOS uses an interface command such as `vrrp 1 ip 192.168.10.1` to create an IPv4 group. Supported IOS XE VRRPv3 implementations instead use an address-family configuration form such as `vrrp 1 address-family ipv4` beneath the interface, with the virtual address configured in that group. These are platform-dependent ways to create the status being interpreted, not interchangeable commands for every simulator image.

## Reading the output

The following excerpts are authored representative output. Column spacing and terminology vary by IOS release.

```output R2# show standby brief — representative
                     P indicates configured to preempt.
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       1    100 P Standby 192.168.10.2    local           192.168.10.1  ← R2 is standby; .1 is the host gateway
```

Read the local role, then the Active and Standby addresses. `local` refers to the device issuing the command. The `P` flag indicates preemption configuration, not that a preemption just occurred. An `unknown` peer field means no peer in that role is currently known; it can be normal for a single configured router, but it is unexpected in the intended two-router group.

```output R1# show standby — representative after tracked uplink failure
GigabitEthernet0/0 - Group 1
  State is Standby
  Virtual IP address is 192.168.10.1
  Hello time 3 sec, hold time 10 sec
  Preemption enabled
  Active router is 192.168.10.3
  Standby router is local
  Priority 90 (configured 110)  ← tracking changed effective priority
    Track object 1 state Down decrement 20
```

The configured value remains 110 while the effective value is 90. Restore the tracked condition rather than repeatedly raising priority to conceal it.

```output R2# show vrrp — representative IPv4 excerpt
GigabitEthernet0/0 - Group 1
  State is Backup
  Virtual IP address is 192.168.10.1
  Virtual MAC address is 0000.5e00.0101
  Advertisement interval is 1.000 sec
  Preemption enabled
  Priority is 100
  Master Router is 192.168.10.2, priority is 110
  Master Down interval is 3.609 sec  ← backup's failure-detection interval
```

For classic VRRP, `show vrrp brief` adds compact Own/Pre flags on supporting releases. IOS XE VRRPv3 may group output by address family; inspect `show vrrp` or `show vrrp detail` as supported. A line such as `Group 1 - Address-Family IPv6` must be interpreted with its virtual link-local address and IPv6 virtual MAC.

## Interpreting status and troubleshooting

Compare both peers. If each claims Active with no Standby, first check whether they can exchange the correct control packets on the same VLAN and agree on version/group. Raising priority does not repair an isolated control plane. A version mismatch can produce different virtual MACs for the same intended IPv4 gateway, but two Active routers using the same version/group need not use different virtual MACs.

If the preferred router remains Standby after recovery, inspect preemption and effective priority. If the uplink fails without a role change, inspect tracking and the peer's preemption. If the roles look correct but a host fails, inspect its configured gateway, the active router's destination route, and the remote return route.

Finally test a real off-subnet destination. Pinging only the VIP proves that the virtual gateway responds, not that it can route to the application. Keep a record of baseline roles, current/configured priorities, virtual IP/MAC, routing evidence, and the exact fault. Restore one failure before introducing another.

## Exam focus

For v1.1, explain why the virtual gateway protects the first hop and why hosts must use it. For v2.0, interpret HSRP/VRRP local and peer roles, virtual addresses, priority, preemption, ownership, timers, and tracking evidence. Distinguish failure takeover from preemption and protocol health from end-to-end reachability. Use the lab configurations to understand these observations without treating every optional command as a separate exam requirement.
