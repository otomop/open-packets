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
A PC has exactly one default gateway. If that address belongs to a single router and the router fails, every host on the LAN is cut off, even when a second router with working uplinks sits on the same switch. The routing chapters taught routers to find another path after a failure. That does not help a host: it runs no routing protocol and sends every off-subnet packet to the one gateway address it was given.

A **first hop redundancy protocol (FHRP)** closes that gap. Two routers share one virtual gateway address, and when the forwarding router fails, the other takes the address over within seconds. By the end of this chapter you will be able to explain how HSRP and VRRP choose the forwarding router, read `show standby` and `show vrrp` output, and predict what a failure, a recovery or a lost uplink does to the roles.

## Why hosts need a redundant gateway

:::facts
- A **first hop redundancy protocol (FHRP)** lets multiple routers provide one virtual default gateway.
- In ordinary IPv4 HSRP, hosts use the **virtual IP**, which resolves to the group's **virtual MAC**.
- HSRP roles are **Active** and **Standby**. Cisco VRRP output commonly says **Master** and **Backup**; the current VRRP standard calls the forwarding role **Active**.
- HSRP's normal IOS defaults are priority **100**, Hello **3 seconds**, hold **10 seconds**, and **preemption disabled**.
- VRRP's normal defaults are priority **100**, advertisements **1 second**, and **preemption enabled** for non-owner routers.
:::

Picture VLAN 10 with two routers: R1 at `192.168.10.2` and R2 at `192.168.10.3`. Suppose PC-A's gateway is `192.168.10.2` and R1 fails. PC-A keeps sending ARP requests for `.2` and nobody answers. R2 is healthy, but PC-A has no reason to use it.

An FHRP gives the hosts a gateway address that no single router owns. R1 and R2 join a group that shares a **virtual IP**, here `192.168.10.1`, and a matching **virtual MAC**. PC-A uses `192.168.10.1` as its gateway. One router at a time answers ARP for that address and forwards the frames sent to the virtual MAC. If it fails, the other takes over the same IP and MAC, and PC-A notices only a few lost packets.

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

The virtual IP is only a next hop. When PC-A pings `203.0.113.10`, the packet's destination IP stays `203.0.113.10`. Only the first Ethernet frame is addressed to the virtual MAC, and the router that receives it routes the packet like any other.

An FHRP protects only the host's first hop. It does not copy routes between routers: R1 and R2 each need their own route to the destination, and the far end needs a route back through whichever router is forwarding. SW1 is still a single point of failure in this small topology.

CCNA v1.1 asks you to describe the purpose, functions and concepts of FHRPs. CCNA v2.0 asks you to interpret the operational status of HSRP and VRRP. The configuration is here because building a group is the quickest way to understand its output; you do not need to memorise every optional command.

## HSRP groups and role selection

**Hot Standby Router Protocol (HSRP)** is Cisco's own FHRP. Routers that share a virtual gateway are configured with the same **group** number on their LAN interfaces. In each group one router is **Active**: it answers ARP for the virtual IP and forwards the hosts' traffic. One router is **Standby**: it listens for the Active router's Hello messages and takes over if they stop. Any further routers in the group wait and listen. The Standby is still a working router; it just does not answer for the virtual address.

HSRP chooses the Active router by **priority**, a number from 0 to 255 with a default of 100. The highest priority wins. If priorities tie, the highest interface IP address wins. With R1 at priority 110 and R2 at the default 100, R1 becomes Active. With both at 100, R2 wins because `192.168.10.3` is higher than `192.168.10.2`.

That election runs only when the group has no Active router. A router that is already Active stays Active until it fails, even if a router with a higher priority joins later. To let the higher-priority router take the role from a healthy Active router you must enable **preemption**, which is off by default. Preemption needs a strictly higher priority: an equal-priority router with a higher IP address does not preempt.

HSRP has two versions. Version 1 is the default. The two do not interoperate, so every router in a group must run the same one.

| IPv4 HSRP property | Version 1 | Version 2 |
|---|---|---|
| Group range | 0–255 | 0–4095 |
| Hello multicast | `224.0.0.2` | `224.0.0.102` |
| Transport | UDP 1985 | UDP 1985 |
| Default virtual MAC form | `0000.0c07.acXX` | `0000.0c9f.fXXX` |
| Version selection on IOS interface | `standby version 1` | `standby version 2` |

The X digits are the group number in hexadecimal. Group 10 in HSRPv1 uses `0000.0c07.ac0a`, because decimal 10 is hex 0a; group 20 would end in `14`. Group 1 in HSRPv2 uses `0000.0c9f.f001`. A virtual MAC in `show standby` or in a switch's MAC address table therefore tells you the HSRP version and the group. It does not tell you which router is Active.

Routers in a group must agree on the version, the group number and the virtual IP. The virtual IP must be an unused address in the LAN subnet, different from every router's real address. The group number does not have to equal the VLAN number, although matching them makes output easier to read.

Because every VLAN has its own group, two routers can share the work. Give R1 priority 110 and R2 90 for VLAN 10, reverse the values for VLAN 20, and enable preemption. R1 is then Active for VLAN 10 and R2 for VLAN 20. Each group still has exactly one Active router.

## HSRP states and failure detection

`show standby` reports one of six states, listed here from start-up to forwarding:

| State | What the router is doing |
|---|---|
| **Initial** | HSRP is not running yet, for example because the interface has just come up or is down |
| **Learn** | It does not know the virtual IP and is waiting to hear it from the Active router |
| **Listen** | It knows the virtual IP but is neither Active nor Standby |
| **Speak** | It sends Hellos and takes part in the election |
| **Standby** | It is next in line and monitors the Active router |
| **Active** | It forwards traffic sent to the virtual MAC |

A healthy two-router group settles with one router Active and the other Standby. A router stuck in Initial usually has an interface down, and two routers that are both Active cannot hear each other.

Routers in Speak, Standby and Active send **Hello** messages, every 3 seconds by default. Two other messages exist. **Coup** is sent by a router that is preempting. **Resign** is sent by an Active router that is giving up the role, either because it is being preempted or because its interface is being shut down.

The Standby router restarts a **hold timer**, 10 seconds by default, every time it hears a Hello from the Active router. If the Active router dies silently, the timer runs out and the Standby becomes Active. For example, R2 hears a Hello at second 0 and R1 loses power at second 2: R2 takes over at second 10, eight seconds after the failure. With default timers a silent failure therefore costs about 7 to 10 seconds. A Resign is faster, because the Standby does not wait for the timer.

When R2 takes over, it sends a **gratuitous ARP**: an unsolicited ARP reply, sourced from the virtual MAC, announcing that `192.168.10.1` is at that MAC. Hosts already hold exactly that mapping. The frame matters to the switch: SW1 sees the virtual MAC arrive on R2's port and updates its MAC address table, so frames for the gateway now go to R2.

:::trap The gateway can be stable while the switch table changes
After a failover the virtual IP and virtual MAC are the same as before. What changes is the switch port that leads to that MAC. Do not confuse the switch's MAC-to-port table with the host's IP-to-MAC ARP cache.
:::

## Priority, preemption, and tracking

Each router keeps its own real address, and both name the same virtual IP:

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

R2 uses real address `192.168.10.3`, the same group and virtual IP, the default priority of 100, and `standby 1 preempt`. R1's 110 makes it the Active router.

Failure takeover and preemption are different events. If R1 fails, R2 becomes Active with or without preempt, because the group has no Active router. Preempt matters when R1 comes back: with `standby 1 preempt`, R1 sends a Coup and takes the role back. Without it, R2 stays Active and R1 waits in Standby despite its higher priority.

Now consider a failure that HSRP cannot see. R1's uplink Gi0/1 goes down, but its LAN interface is fine, so R1 keeps sending Hellos and stays Active. PC-A's packets still arrive at R1, and R1 has nowhere to send them. **Tracking** ties R1's priority to the state of the uplink: while the tracked interface is down, R1 subtracts a **decrement** from its priority. The default decrement is 10.

```ios R1
R1# configure terminal
R1(config)# track 1 interface gigabitethernet0/1 line-protocol
R1(config-track)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# standby 1 track 1 decrement 20
R1(config-if)# end
```

When Gi0/1 goes down, R1's priority becomes **110 − 20 = 90**. R2's 100 is now higher, and because R2 has preempt it takes over. Two things have to be true for this to work:

- The decrement must take R1 below R2. The default 10 would leave R1 at 100, and a tie does not trigger preemption.
- R2 must have preempt, because it is taking the role from a router that is still alive on the LAN.

When the uplink returns, R1 goes back to 110 and, with its own preempt, becomes Active again.

The older one-line form `standby 1 track gigabitethernet0/1 20` tracks the interface directly without a track object. Either way, tracking watches only that local interface. If a link further upstream fails while Gi0/1 stays up, R1's priority does not change.

Two optional commands appear in real configurations. `standby 1 preempt delay minimum 60` makes a recovering router wait 60 seconds before it preempts, so its routing table can fill first. `standby 1 timers 1 3` shortens Hello and hold to 1 and 3 seconds for faster failover.

## VRRP for IPv4 and IPv6

**Virtual Router Redundancy Protocol (VRRP)** does the same job as HSRP but is an open standard, so routers from different vendors can share a gateway. A group still shares a virtual IP and a virtual MAC, one router forwards, and the others wait. The names and the defaults differ.

| | HSRP | VRRP |
|---|---|---|
| Origin | Cisco proprietary | Open standard |
| Roles | Active, Standby | Master, Backup |
| Preemption | Off by default | On by default |
| Default timers | Hello 3 s, hold 10 s | Advertisement 1 s |
| IPv4 messages | UDP 1985 to `224.0.0.2` (v1) or `224.0.0.102` (v2) | IP protocol 112 to `224.0.0.18` |
| IPv4 virtual MAC | `0000.0c07.acXX` (v1), `0000.0c9f.fXXX` (v2) | `0000.5e00.01XX` |
| Virtual IP equal to a router's real address | Not allowed | Allowed |

VRRPv2 supports IPv4 only. VRRPv3 supports IPv4 and IPv6; RFC 9568 is the current v3 specification and replaces RFC 5798. It renames the Master role **Active**, but most Cisco output still says **Master**.

VRRP messages are called advertisements, and only the Master sends them. They travel directly in IP as protocol number **112**, not in UDP. For IPv6 the destination is `ff02::12` and the virtual MAC is `0000.5e00.02XX`. XX is the group number in hexadecimal, which VRRP calls the virtual router identifier (VRID, 1–255): IPv4 group 10 uses `0000.5e00.010a`. An IPv4 group and an IPv6 group are separate instances even when they share a number, so R1 can be Master for one and Backup for the other. In an IPv6 group the virtual address is link-local, and hosts find its MAC with Neighbor Discovery, not ARP.

Priority works as in HSRP: higher wins, the default is 100, and you can configure 1–254. Two values are special. Priority **255** belongs to the **address owner**, the router whose real interface address is the virtual IP. VRRP allows that design and HSRP does not. The owner always becomes Master while it is up. Priority **0** is sent by a Master that is giving up the role, so that a Backup takes over at once. Because preemption is on by default, a returning higher-priority router takes the Master role back with no extra configuration, the opposite of HSRP.

A Backup declares the Master dead after the **master down interval**: three advertisement intervals plus a skew time of (256 − priority) / 256 seconds. With 1-second advertisements and priority 100 that is 3 + 156/256, about **3.6 seconds**. The skew is shorter for a higher priority, so the best Backup times out first.

You only need to recognise VRRP configuration. Classic IOS creates an IPv4 group with the interface command `vrrp 1 ip 192.168.10.1`. IOS XE with VRRPv3 uses `vrrp 1 address-family ipv4` under the interface and sets the virtual address inside that group.

One more FHRP exists. **Gateway Load Balancing Protocol (GLBP)** is Cisco proprietary and lets several routers forward for one group at the same time, by answering different hosts' ARP requests with different virtual MACs. The exam objectives name HSRP and VRRP, so it is enough to recognise GLBP as the Cisco FHRP that load-balances inside a group.

## Reading the output

Three outputs carry almost everything you are asked to interpret. These excerpts were written for this lesson; spacing and wording vary by IOS release.

```output R2# show standby brief — representative
                     P indicates configured to preempt.
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0       1    100 P Standby 192.168.10.2    local           192.168.10.1  ← R2 is standby; .1 is the host gateway
```

Read it left to right. `P` means preempt is configured, not that a preemption has happened. State is this router's own role. The Active and Standby columns give each role's real address, or `local` for the router you are on. So R2 is Standby, R1 at `192.168.10.2` is Active, and hosts should use `192.168.10.1`. `unknown` in either column means this router hears no peer in that role, which is a fault in a group of two.

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

`Priority 90 (configured 110)` shows tracking at work: the configuration says 110 and the election is using 90. The line beneath names the cause. The repair is to restore the uplink, not to raise the priority.

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

R2 is Backup at priority 100, and the Master is `192.168.10.2` at priority 110. The virtual MAC ends in `01`, so this is IPv4 group 1. `show vrrp brief` condenses the same facts into one line per group. IOS XE VRRPv3 groups its output by address family: a heading such as `Group 1 - Address-Family IPv6` goes with a link-local virtual address and a `0000.5e00.02XX` MAC.

## Interpreting status and troubleshooting

Always compare both routers. Each common symptom points to a short list of causes.

| Symptom | Likely cause | What to check |
|---|---|---|
| Both routers Active, each with Standby `unknown` | The routers do not hear each other's Hellos | Same VLAN, same HSRP version, same group number |
| Higher-priority router stays Standby after it recovers | Preempt is not configured on it | The `P` flag or the `Preemption` line |
| Uplink failed but the roles did not change | No tracking, a decrement that is too small, or no preempt on the peer | The priority and track lines, and the peer's `P` flag |
| Roles are correct but a host cannot reach a remote network | The host's gateway is not the virtual IP, or a route is missing | The host's gateway, the Active router's route, and the return route |

Raising a priority cannot fix two Active routers, because they are not hearing each other at all. A version mismatch is easy to spot: one router shows a `0000.0c07.acXX` virtual MAC and the other `0000.0c9f.fXXX` for the same virtual IP. If the MACs match, look for whatever stops the Hellos, such as a port in the wrong VLAN.

Finish every check with a ping from the host to a real remote destination. A reply from the virtual IP proves only that some router answers for it on the LAN.

## Exam focus

For v1.1, be ready to explain why a host needs a virtual gateway and how an FHRP provides one. For v2.0, be ready to read HSRP and VRRP status output and say which router forwards, why, and what will happen next. Know these points without looking them up:

- Hosts use the virtual IP as their gateway. Its virtual MAC moves between routers.
- HSRP: Cisco proprietary, Active and Standby, priority 100, highest priority then highest IP wins, preemption off, Hello 3 seconds and hold 10.
- HSRPv1 and HSRPv2 differ in group range, multicast address and virtual MAC, and do not interoperate.
- VRRP: open standard, Master and Backup, priority 100 (owner 255), preemption on, advertisements every second as IP protocol 112.
- A failed router is replaced without preemption. Taking the role from a healthy router requires it.
- Tracking lowers a priority, by 10 unless you set a decrement. Roles change only if the peer is then higher and can preempt.
- An Active or Master state describes the first hop only.
