---
id: spanning-tree
number: 14
title: Spanning tree
subtitle: Build a redundant LAN and predict its root, forwarding paths, and standby ports.
part: switching
domain: switching
minutes: { lesson: 65, lab: 70 }
summary: Learn how Rapid PVST+ prevents Ethernet loops, compare bridge IDs and path costs, select port roles, and verify a deliberate primary and secondary root design.
objectives:
  v1: ["2.5", "2.5.a", "2.5.b"]
  v2: ["2.5", "2.5.a", "2.5.b"]
prereqs: [ethernet-switching, vlans-and-access-ports, trunks-dtp]
sectionIds:
  Why redundant Ethernet needs spanning tree: why-redundancy-needs-a-referee
  Port roles and path selection: port-roles-root-designated-alternate-backup
  Configure the root and path preferences: configuring-rapid-pvst
sources:
  - { title: "Cisco: Catalyst 9400 documented short path-cost table", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9400/software/release/16-11/configuration_guide/lyr2/b_1611_lyr2_9400_cg/configuring_spanning___tree_protocol.html" }
  - { title: "Cisco: Understand Rapid Spanning Tree Protocol", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html" }
  - { title: "Cisco: Catalyst 2960 STP configuration and defaults", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_1_se/configuration/guide/scg2960/swstp.html" }
  - { title: "Cisco: Catalyst 9300 spanning-tree configuration", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/lyr2/b_1712_lyr2_9300_cg/configuring_spanning_tree_protocol.html" }
  - { title: "Cisco: Catalyst 2960 spanning-tree command reference", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/command/reference/cr2960/cli3.html" }
  - { title: "Cisco: Root guard and the limits of priority zero", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10588-74.html" }
---

## Why redundant Ethernet needs spanning tree

You already know that a switch learns a frame's source MAC address and forwards according to its destination MAC address within a VLAN. Now connect three switches in a triangle. A broadcast entering one switch can leave through both interswitch links, return through the third switch, and be flooded again. Ethernet has no hop limit to expire that circulating frame. The TTL inside an IPv4 packet does not help because ordinary Layer 2 switching does not decrement it.

Repeated flooding can consume link capacity, deliver duplicate frames, and make a source MAC appear on different ports. That last symptom is **MAC address table instability**: the switch keeps updating an otherwise valid source entry because copies arrive through different paths. Unknown unicasts can circulate too. A loop does not need a large original traffic load to become disruptive, and a switch does not correct it merely by learning more MAC addresses.

**Spanning Tree Protocol (STP)** permits physical redundancy while selecting a loop-free forwarding topology. A redundant port can remain operational at the physical layer yet discard user frames for a particular VLAN. It still participates in the control protocol, allowing a standby path to become useful after a failure. Do not interpret an intentionally blocked port as a faulty cable or administratively shut interface.

The historical **802.1D STP** used timer-based transitions. **RSTP**, introduced as 802.1w, adds port roles and handshakes that allow faster transitions. Cisco's **Rapid PVST+** runs a rapid spanning-tree instance per VLAN; **PVST+** uses the classic behavior. The CCNA core here is Rapid PVST+: determine the root, calculate paths, and interpret roles and states. Classic STP provides useful comparison, but you do not need a second full legacy design workflow.

## Bridge IDs and the root election

:::facts
- Lowest bridge ID wins: compare priority plus extended system ID, then MAC address.
- Configurable priority defaults to `32768`; legal values are `0`–`61440` in steps of `4096`. VLAN 10 adds `10` to the displayed priority.
- A root bridge has root path cost `0` and no root port. Each other connected switch selects one root port per instance.
- Short path costs: 10 Mbps `100`, 100 Mbps `19`, 1 Gbps `4`, 10 Gbps `2`.
- RSTP states are discarding, learning, forwarding. Default hello/max-age/forward-delay timers are `2/20/15` seconds.
:::

A **Bridge Protocol Data Unit (BPDU)** carries the root identity, the sender's path cost to that root, the sender's identity, and a sending port identifier. Switches compare this information with what they currently know. A newly started, isolated switch initially identifies itself as root. After exchanges with its neighbors, it selects the best root it can hear about and advertises information consistent with that decision. Host IP addresses and default gateways do not participate in this election.

The **bridge ID (BID)** contains a two-byte priority/system-ID field and a six-byte bridge MAC address. In a per-VLAN instance, the field includes the configurable priority and the VLAN ID as the **extended system ID**. With priority `32768`, VLAN 10 displays `32778`; VLAN 20 displays `32788`. Compare switches within the same VLAN. Differences between VLAN instances do not cause VLAN 10 to defeat VLAN 20 in an election.

For example, SW1 advertises `32778` with MAC `0001.0001.0001`, while SW2 advertises `24586` with MAC `00ff.00ff.00ff`. SW2 wins VLAN 10 because the priority field is compared first. If both advertise `24586`, their MAC addresses decide. A priority of zero is the lowest configurable value, but another priority-zero switch with a lower MAC can still win. Likewise, `61440` can win if every competing BID is higher or no other switch participates.

Set root placement deliberately near the intended traffic paths. The root is the reference point used to construct the tree; it is not a requirement that every frame travel through that switch. Once the tree is established, normal destination-MAC forwarding still applies. Two hosts on the same access switch can communicate locally without sending their traffic to the root first.

## Port roles and path selection

Calculate the topology in order: elect the root, select each non-root switch's root port, then select a designated port on each segment. A **root port** offers the best received path toward the root. A **designated port** advertises the best path onto its segment. These are related decisions, but they compare costs from different viewpoints.

For a root-port candidate, add the neighbor's advertised root path cost to the cost of the local port receiving that information. If SW3 hears cost `0` from SW2 on a Gigabit port with cost `4`, SW3's total is `4`. SW1 hearing SW3's advertised `4` on another cost-`4` port obtains `8`. SW1's direct FastEthernet path to SW2 costs `0 + 19 = 19`; the two-link Gigabit route wins even though it has more hops.

```diagram
{"type":"topology","title":"Fig 14.1 — Calculate the received cost","caption":"SW1 selects 8 through SW3 instead of 19 directly to SW2. SW2 remains designated on the direct link.","nodes":[{"id":"SW2","kind":"switch","label":"SW2 · root","sub":"priority 24576 · cost 0","x":2,"y":3,"highlight":true},{"id":"SW1","kind":"switch","label":"SW1","sub":"priority 32768 · cost 8","x":10,"y":1},{"id":"SW3","kind":"switch","label":"SW3","sub":"priority 28672 · cost 4","x":10,"y":5}],"links":[{"from":"SW2","to":"SW1","label":"19 at each end","fromLabel":"Fa0/24","toLabel":"Fa0/24","fromBadge":"DP","toBadge":"ALT","style":"blocked"},{"from":"SW2","to":"SW3","label":"4 at each end","fromLabel":"Gi0/1","toLabel":"Gi0/2","fromBadge":"DP","toBadge":"RP"},{"from":"SW3","to":"SW1","label":"4 at each end","fromLabel":"Gi0/1","toLabel":"Gi0/1","fromBadge":"DP","toBadge":"RP","accent":true}],"trace":{"flows":[{"path":["SW2","SW3"],"label":"BPDU advertising cost 0","tags":{"SW3":"Root port Gi0/2 · 0 + 4 = 4"}},{"path":["SW3","SW1"],"label":"BPDU advertising cost 4","tags":{"SW1":"Root port Gi0/1 · 4 + 4 = 8"}},{"path":["SW2","SW1"],"label":"BPDU advertising cost 0","tags":{"SW1":"Fa0/24 · 0 + 19 = 19 · alternate"}}]}}
```

When candidates describe the same root, compare total root path cost first, then the sending bridge ID, then the sending port ID, and finally the local receiving port ID if everything received still ties. The last case is unusual on ordinary direct switch links: it can occur when two local ports hear the same sender through a shared segment. Do not choose the lowest local interface number before comparing the information advertised by neighbors.

A **port ID** combines port priority and port number. Default port priority is `128`; configurable values are `0`–`240` in steps of `16`. In `128.25`, `128` is the priority and `25` is the platform's STP port number. It need not match the final digit in an interface name. A common 2960 reports `Gi0/1` as port `25`; use the displayed number instead of assuming a mapping across models.

Suppose SW1 has two equal-cost links to the same root switch. SW1's `Gi0/1` hears sender port ID `128.26`, and its `Gi0/2` hears `128.25`. The second local interface wins. Changing the root switch's sending port priority to `64` on the first link would reverse that tie. Changing SW1's receiving port priority would not override an already different sending port ID.

For the designated-port decision, compare the information each switch would advertise onto the segment: root ID, advertised root path cost, sender BID, then sender port ID. Do not add the cost of crossing that segment to both advertisements. In Figure 14.1, SW2 advertises `0` and SW1 advertises `8` on the direct link, so SW2's end is designated. Between two non-root switches with equal root cost, their BIDs decide the designated end.

| Role | What it provides | Stable data state |
|---|---|---|
| Root | Best path toward the root on a non-root switch | Forwarding |
| Designated | Best advertised path on that segment | Forwarding |
| Alternate | Another path toward the root through another bridge | Discarding |
| Backup | Redundant attachment to the same segment as this bridge's own designated port | Discarding |

An **alternate port** can replace a failed root path. A **backup port** is different: imagine two ports of the same switch attached to one hub, receiving that switch's own BPDUs. One can back up the other designated port's attachment to that shared segment. Two separate cables between two switches ordinarily create root/alternate roles downstream, not a backup role. On normal point-to-point links the root's active ports are designated; shared or self-connected arrangements explain why that statement is not universal.

## Port states and convergence

A **role** describes the port's job; a **state** describes what it currently does. A newly selected designated port may still be discarding while the protocol establishes that forwarding is safe. A blocked alternate is therefore normal, but a designated role does not prove that the port already forwards. Read both columns in operational output.

| State | Learns source MAC addresses from user frames? | Forwards user frames? |
|---|---|---|
| Discarding | No | No |
| Learning | Yes | No |
| Forwarding | Yes | Yes |

Classic STP separates blocking and listening from learning and forwarding; disabled interfaces do not participate. RSTP groups the nonforwarding, nonlearning behavior under discarding. Cisco displays stable rapid alternate ports as `Altn BLK`, even though discarding is the RSTP state name. A healthy blocked port can process BPDUs: blocking user traffic does not mean blocking the protocol that maintains the tree.

Classic transitions can require `15` seconds listening and `15` seconds learning. If stale information must first expire, the default `20`-second max age can add delay. An alternate may remain blocked indefinitely while redundancy is healthy; max age is not a maximum permitted time in blocking. Treat `30` or `50` seconds as conditional timer examples, not a countdown applied to every link event.

RSTP uses **proposal/agreement** on point-to-point links to confirm a safe transition. A receiver synchronizes other relevant non-edge forwarding ports before agreeing, preventing a temporary loop while the topology changes. Full-duplex links are considered point-to-point by default; half-duplex links are considered shared. An agreement is not a TCP acknowledgment: these are spanning-tree control messages between bridges.

RSTP also uses periodic BPDUs to detect neighbor loss. Three missed hellos at the default two-second interval correspond to about six seconds; a physical link-down event can be detected earlier. Detection time and completed reconvergence are different measurements. Legacy neighbors, link type, topology, and implementation affect the result, so do not promise zero lost pings or a fixed two-second failover.

**Edge ports**, configured using PortFast, can forward immediately when connected to end devices. Receiving a BPDU removes operational edge status unless another feature, such as BPDU guard, shuts the port down. RSTP detects topology changes when non-edge ports enter forwarding; an edge port's ordinary link transitions do not create those changes. Chapter 15 explains safe edge configuration and protection. A legacy PVST+ neighbor can also cause classic interoperability behavior on the connecting port.

## Configure the root and path preferences

Configure Rapid PVST+ explicitly when building the lab rather than relying on a platform default. Cisco documents PVST+ as the older 2960 default and Rapid PVST+ on current Catalyst 9300 software. The operational mode in `show spanning-tree summary` is the useful evidence. All switches in the example use VLAN 10, matching trunks, and known priorities.

```ios SW2
SW2# configure terminal
SW2(config)# spanning-tree mode rapid-pvst
SW2(config)# spanning-tree vlan 10 root primary
SW2(config)# end
SW2# show spanning-tree vlan 10
```

The `root primary` command is a configuration macro, not a permanent election privilege. It uses `24576` when that makes the switch root; for an already lower current root priority, it attempts a value `4096` lower. Verify the resulting priority and root identity, especially near priority zero where no lower value exists. It does not keep lowering its priority if another switch arrives later. `root secondary` sets `28672`, which is useful behind a primary at `24576` when other switches use `32768`; it does not reserve second place against arbitrary configurations.

```ios SW3
SW3# configure terminal
SW3(config)# spanning-tree mode rapid-pvst
SW3(config)# spanning-tree vlan 10 root secondary
SW3(config)# end
```

For deterministic exercises, explicit priorities make the intended ordering visible. Per-interface cost changes tune a local candidate path; if that changes the switch's root cost, the new advertised cost can affect downstream switches too. Port-priority changes appear in transmitted BPDUs and primarily influence a neighbor's equal-cost choice. Neither setting changes the physical speed of the link.

```ios SW1
SW1# configure terminal
SW1(config)# spanning-tree vlan 10 priority 32768
SW1(config)# interface fastethernet0/24
SW1(config-if)# spanning-tree vlan 10 cost 2
SW1(config-if)# end
SW1# show spanning-tree vlan 10
```

For a separate equal-cost example, suppose two links from SW1 lead to the same root SW2. Both candidates have equal root path cost, and both SW2 ports initially use priority 128. Lowering the sending port's priority on SW2 makes its port ID preferable after the earlier ties:

```ios SW2
SW2# configure terminal
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# spanning-tree vlan 10 port-priority 64
SW2(config-if)# end
SW2# show spanning-tree vlan 10
```

Verify the transmitted port ID and SW1's chosen root port. This does not override a better path cost or a better sender bridge ID. It is a separate exercise from changing SW1's local cost in the triangle above.

Short costs are sufficient for this lab. Long-cost implementations use a different scale, for example `200000` at 100 Mbps and `20000` at 1 Gbps. Read the configured method and displayed costs before doing arithmetic; do not mix a short-cost table with long-cost output. Leave timers unchanged and adjust only the planned VLAN/interface parameter.

## Reading the output

The following is representative, abbreviated 2960-style output using the Figure 14.1 design. MAC addresses illustrate the comparison and will differ on your devices. It is a worked exhibit, not a capture from an executed Packet Tracer lab.

```output SW1# show spanning-tree vlan 10
VLAN0010
  Spanning tree enabled protocol rstp  ← Rapid PVST+ for this VLAN
  Root ID    Priority    24586
             Address     0002.0002.0002
             Cost        8  ← total root path cost, not just Gi0/1 cost
             Port        25 (GigabitEthernet0/1)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
  Bridge ID  Priority    32778  (priority 32768 sys-id-ext 10)
             Address     0001.0001.0001  ← local bridge; differs from Root ID
...
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         128.25   P2p
Fa0/24              Altn BLK 19        128.24   P2p  ← intended standby path
Fa0/5               Desg FWD 19        128.5    P2p
```

Read the VLAN and protocol first, compare Root ID with Bridge ID, then inspect root cost and root port. Matching IDs and the message `This bridge is the root` identify the local root. The priority `24586` proves a configurable value of `24576` plus VLAN 10; it does not prove whether someone used a macro or an explicit priority command.

:::trap A blocked path is not automatically a fault
Check whether an alternate forwarding path exists before changing STP. If every redundant port were forced to forward, the original Ethernet loop would return. Diagnose the intended root and cost calculation before treating `Altn BLK` as the cause of an outage.
:::

Use `show spanning-tree root` for a per-VLAN root summary and `show spanning-tree interface gigabitethernet0/1 detail` for received/sent BPDU and designated information. A missing VLAN may indicate a VLAN or trunk problem rather than an election error. Compare `show interfaces trunk`, `show vlan brief`, interface status, and the running configuration before changing priorities. Save a confirmed baseline so the next fault exercise starts from known evidence.

## Exam focus

- Compare BIDs within one instance: priority/system ID, then MAC. Priority zero still has a MAC tie-breaker.
- Add the receiving port cost for root-port candidates; compare advertised costs for designated-port selection.
- Break equal-cost root-port ties using sender BID, sender port ID, then receiving port ID.
- Distinguish root, designated, alternate, and backup roles from discarding, learning, and forwarding states.
- Know default `32768`, increments `4096`, short costs `100/19/4/2`, and timers `2/20/15` in context.
- Explain why Rapid PVST+ can converge quickly without assigning every failure the same duration.
- Configure and verify a primary/secondary design; the macros do not guarantee permanent election positions.
- Use the root ID, local bridge ID, total cost, and interface role/state together to justify a conclusion.
