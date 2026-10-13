---
id: capstone-branch-network
number: 44
title: "Capstone: the branch network"
subtitle: Combine switching, routing, addressing, translation and access policy, then verify the complete path.
part: capstone
domain: none
minutes: { lesson: 70, lab: 300 }
summary: Build a small branch and HQ network, record expected behavior, and diagnose separate trunk, OSPF and ACL faults from evidence.
objectives:
  v1: ["1.6", "2.1", "2.1.c", "2.2", "2.4", "2.5", "3.3", "3.4", "4.2", "4.3", "4.5", "4.6", "4.8", "5.3", "5.6"]
  v2: ["1.7", "2.1", "2.1.b", "2.1.c", "2.2", "2.4", "2.5", "3.1", "3.2", "3.3", "4.1", "4.3", "4.6", "5.6"]
prereqs: [ospfv2, nat-pat, acls, dhcp, etherchannel, stp-protection, ntp-syslog-snmp, ios-essentials, dns, troubleshooting-toolkit]
sectionIds:
  Define the required behavior: what-the-branch-must-do
  Plan addresses and packet paths: the-addressing-plan
  Establish the Layer 2 path: build-order-layer-2-first
  Add gateways, DHCP and OSPF: the-branch-router-subinterfaces-dhcp-and-ospf
  Connect the simulated external network: hq-and-the-internet-edge
  Apply policy and management controls: policy-and-management
  Verify the design and isolate faults: verify-and-troubleshoot
sources:
  - { title: "Cisco: CCNA v1.1 topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: Configure NAT", url: "https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/13772-12.html" }
  - { title: "Cisco: Configure commonly used IP ACLs", url: "https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html" }
  - { title: "Cisco: Configuring OSPF", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/iro-cfg.html" }
  - { title: "Cisco: Troubleshoot OSPF route database issues", url: "https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/7112-26.html" }
  - { title: "Cisco: Configure SSH on routers and switches", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html" }
  - { title: "Cisco: Catalyst IOS EtherChannel configuration", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swethchl.html" }
  - { title: "Cisco: IOS XE DHCP server", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_config-dhcp-server-xe.html" }
  - { title: "RFC 5737: Documentation address blocks", url: "https://www.rfc-editor.org/rfc/rfc5737" }
---
A working branch depends on several features agreeing about the same traffic. A VLAN must reach its gateway, the gateway must have a route, and the return packet must survive routing and policy in the other direction. This capstone combines skills from earlier chapters and gives each requirement an observable acceptance test. The guided lab contains the complete build; this lesson explains the design decisions and how to assess the evidence.

## Define the required behavior

:::facts
- This isolated IPv4 design uses staff VLAN **10**, guest VLAN **20**, management VLAN **99**, and an unused native VLAN **999**.
- SW1 and SW2 form **LACP Port-channel1**. SW1 is the intended Rapid PVST+ root. One member failure should leave a working path, but need not be lossless.
- R1 provides the VLAN gateways and local DHCP pools. It forms one OSPF area **0** adjacency with R2.
- R2 has the static default toward the simulated ISP and performs interface **PAT** for the two client subnets.
- The guest ACL permits DHCP, ICMP echo replies to staff, and external access, while denying other packets toward the specified internal networks. It does **not** track sessions.
- Only the staff subnet is permitted by the lab's VTY access list. SSH-only transport is separate from that source restriction.
:::

Write an **acceptance test** as a source, destination, service and expected result. “The network works” is too broad. “The guest PC obtains the correct lease and opens the external HTTP page, while a new guest ping to the staff PC fails” can be reproduced and compared after a change.

This chapter combines skills already practised separately. Before starting the build, explain one packet from a client to a remote server and its reply: identify the VLAN, gateway, route lookup, any translation and each applicable ACL direction. If one stage is unclear, use the corresponding earlier lesson before continuing. The guided build joins those stages into one verified design.

| Bring into this lab | Earlier teaching to revisit if needed |
|---|---|
| Calculate client and transit prefixes; identify the return route | [Subnetting, chapter 05](#/chapter/subnetting-vlsm) and [static routing, chapter 18](#/chapter/static-routing-ipv4) |
| Carry VLANs over a bundle and reach their gateways | [Trunks, chapter 10](#/chapter/trunks-dtp), [inter-VLAN routing, chapter 11](#/chapter/inter-vlan-routing) and [EtherChannel, chapter 13](#/chapter/etherchannel) |
| Choose the STP root and distinguish edge from switch-to-switch ports | [Spanning tree, chapter 14](#/chapter/spanning-tree) and [STP protection, chapter 15](#/chapter/stp-protection) |
| Advertise LANs passively and originate a default from the edge | [OSPFv2, chapter 21](#/chapter/ospfv2) |
| Provide DHCP/DNS, select translated sources and verify real client traffic | [DHCP, chapter 24](#/chapter/dhcp), [DNS, chapter 25](#/chapter/dns) and [NAT/PAT, chapter 26](#/chapter/nat-pat) |
| Apply first-match policy, restrict SSH sources and collect timed evidence | [ACLs, chapter 34](#/chapter/acls), [secure access, chapter 08](#/chapter/ios-essentials), [logging/time, chapter 27](#/chapter/ntp-syslog-snmp) and [troubleshooting, chapter 31](#/chapter/troubleshooting-toolkit) |

| Requirement | Implementation | Evidence to collect |
|---|---|---|
| Carry VLANs between switches and R1 | Access ports, LACP trunk, router trunk | VLAN membership, allowed/active VLANs, STP forwarding state |
| Address clients automatically | R1's two DHCP pools | Actual lease, mask, gateway, DNS and server binding |
| Reach HQ and the external test server | OSPF, R2 default, PAT | Neighbor, specific/default routes, application result and translation |
| Restrict guest traffic | Inbound extended ACL on R1's guest subinterface | Positive and negative tests with matching counter changes |
| Manage and observe the branch | Local SSH, staff-only VTY access, NTP and syslog | Fresh login, rejected source, selected time source and received log |

This is a learning design, not a complete production branch standard. It has a single router uplink, one WAN path and shared laboratory credentials. The EtherChannel protects one inter-switch link failure; it does not remove those other failure points. The exercise integrates selected objectives rather than replacing the separate IPv6, wireless, secure-file and automation labs.

The evidence discipline from chapter 43 still applies when no AI is involved: keep a measured result separate from a hypothesis, choose a test that distinguishes competing causes, and verify the intended behavior after a repair. Chapter 45 then asks you to transfer these habits to a changed design with less guidance.

## Plan addresses and packet paths

The VLAN numbers and subnet numbers resemble each other for readability. They are independent values: changing a subnet does not require changing its VLAN ID. Infrastructure addresses are separate so you can recognize a router's source address when a test behaves differently from a client test.

| Segment | Prefix | Assigned addresses |
|---|---|---|
| Staff, VLAN 10 | `10.10.10.0/24` | R1 `.1`; DHCP candidates `.50–.254` |
| Guest, VLAN 20 | `10.10.20.0/24` | R1 `.1`; DHCP candidates `.50–.254` |
| Management, VLAN 99 | `10.10.99.0/24` | R1 `.1`, SW1 `.11`, SW2 `.12` |
| R1–R2 transit | `10.255.12.0/30` | R1 `.1`, R2 `.2` |
| HQ services | `10.255.20.0/24` | R2 `.1`, SRV-HQ `.10` |
| R2–ISP | `203.0.113.0/24` | R2 `.1`, ISP `.2` |
| External service | `198.51.100.0/24` | ISP `.1`, SRV-REMOTE `.10` |

The external ranges are documentation space, not public Internet services. Keep the Packet Tracer project isolated. The two DHCP ranges each contain **205 candidate addresses** before existing leases, conflicts or other reservations. Excluding `.1–.49` does not promise that the next lease will be exactly `.50`; record the addresses actually assigned.

```diagram
{"type":"topology","title":"Fig 44.1 — The integrated branch","caption":"Staff traffic crosses R1 for routing and R2 for external translation; the guest also depends on the inter-switch trunk.","nodes":[{"id":"S","kind":"pc","label":"Staff","sub":"VLAN 10","x":0.5,"y":1},{"id":"G","kind":"pc","label":"Guest","sub":"VLAN 20","x":0.5,"y":5},{"id":"SW1","kind":"switch","label":"SW1","sub":"Root · .99.11","x":2.7,"y":1},{"id":"SW2","kind":"switch","label":"SW2","sub":".99.12","x":2.7,"y":5},{"id":"R1","kind":"router","label":"R1","sub":"Gateways / DHCP","x":5,"y":3},{"id":"R2","kind":"router","label":"R2","sub":"HQ / PAT","x":7.3,"y":3},{"id":"HQ","kind":"server","label":"SRV-HQ","sub":"10.255.20.10","x":7.3,"y":5.5},{"id":"ISP","kind":"router","label":"ISP","x":9.5,"y":3},{"id":"WEB","kind":"server","label":"Remote","sub":"198.51.100.10","x":11.7,"y":3}],"links":[{"from":"S","to":"SW1"},{"from":"G","to":"SW2"},{"from":"SW1","to":"SW2","label":"Po1 · two members","accent":true},{"from":"SW1","to":"R1","label":"802.1Q"},{"from":"R1","to":"R2","label":"OSPF · /30"},{"from":"R2","to":"HQ"},{"from":"R2","to":"ISP","label":"PAT outside"},{"from":"ISP","to":"WEB"}],"trace":{"flows":[{"path":["G","SW2","SW1","R1","R2","ISP","WEB"],"back":true,"label":"Guest HTTP request","tags":{"SW2":"VLAN 20 · over the Po1 trunk","R1":"Gateway 10.10.20.1 · routes to R2","R2":"PAT · 10.10.20.x → 203.0.113.1"},"backTags":{"ISP":"dst 203.0.113.1 · connected","R2":"203.0.113.1 → 10.10.20.x · via R1"}}]}}
```

Trace both directions before configuration. Staff traffic to HQ keeps its source address; R2 needs a route back to the staff subnet. External traffic uses R2's `203.0.113.1` as its translated source; the ISP can return to that connected subnet. R2 then needs both the translation state and the inside route to deliver the reply.

Router IDs `1.1.1.1` and `2.2.2.2` identify OSPF routers. They are not interface addresses in this design and need not answer a ping. Likewise, the `.0` and `.3` addresses of `10.255.12.0/30` are its network and broadcast addresses, not additional router addresses.

## Establish the Layer 2 path

Create each VLAN on both switches, assign host ports, then configure matching trunk properties. Bundle the two inter-switch ports with LACP after checking speed, duplex and Layer 2 settings. At least one end must initiate with `active`; this lab uses active at both ends. On a healthy Layer 2 channel, the summary identifies an in-use port-channel and bundled members.

```output Representative EtherChannel summary
Group  Port-channel  Protocol  Ports
1      Po1(SU)       LACP      Fa0/23(P) Fa0/24(P)  ← S: Layer 2; U: in use; P: bundled
```

These are representative teaching values, not a recorded simulator run. Check both ends and read the actual flag legend. A port-channel existing in the configuration is not proof that both physical members are forwarding in it. One conversation is usually assigned to one member by the balancing method; two links do not automatically double one TCP flow's speed.

Set SW1's base priority explicitly to **24576** for the four VLANs, leaving SW2 at **32768**. VLAN 20's displayed extended priority is therefore `24576 + 20 = 24596`. The alternative `root primary` macro is conditional: 24576 is typical against default-priority peers, not a universal stored value regardless of the existing root. Verify the elected bridge rather than memorizing the macro as an unconditional assignment.

PortFast and BPDU guard belong on the identified endpoint ports here. Do not enable them on the inter-switch channel. VLAN 999 has no routed address or host access port. Matching an unused native VLAN helps keep ordinary client traffic tagged, but is not a substitute for an explicit allowed list or access policy.

The router-facing trunk cannot be verified as operational until R1's physical port is enabled and the link is up. Conversely, a router subinterface may remain up/up even when VLAN 20 has been removed from the switch's allowed list. Neither view alone proves that a guest frame can travel end to end.

## Add gateways, DHCP and OSPF

R1's physical interface carries tagged frames; its subinterfaces bind VLAN tags to gateway addresses. Enable the parent and leave it unaddressed. The unused native subinterface has its encapsulation but no IPv4 address. A new tagged client subinterface has this essential configuration:

```ios R1
R1(config)# interface gigabitethernet0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 10.10.20.1 255.255.255.0
R1(config-subif)# exit
```

The DHCP pool's network must agree with that interface. Configure exclusions before requesting client leases, then check all delivered parameters. The DNS option points to the external server in this exercise. A valid lease can exist before the external route or PAT works; DHCP success does not certify web access.

R1 is the DHCP server on the client subnet, so no helper is needed. If a later variation moves DHCP to HQ, place the helper on the **client-facing subinterface**. The remote server must also have the correct pool, and routing and filtering must permit the relay exchange. A helper command alone cannot correct a missing server pool or return route.

For OSPF, make the R1–R2 link point-to-point at both ends. Enable the LAN networks in area 0 but leave those host-facing interfaces passive. `passive-interface default` followed by one `no passive-interface` exception makes that intent clear. Passive suppresses neighbor formation on the interface while the connected prefix can still be advertised through other active adjacencies.

Inspect the neighbor state and then the routing table. FULL means the neighbor relationship has completed database synchronization; it does not prove that a required LAN was included in OSPF or that a preferred competing route is absent. Compare advertised prefixes, route selection and the return path when a service remains unreachable.

## Connect the simulated external network

R2 uses a default route to the ISP and announces it with `default-information originate`. Without `always`, this design depends on R2 retaining an eligible default route. The static route's presence does not prove that the upstream application is healthy: a reachable next hop can remain up while a service beyond it fails.

PAT combines inside/outside roles, a source selector and an overloaded mapping. In this conventional inside-source configuration, staff and guest sources crossing toward the outside interface are eligible. The management and transit subnets are intentionally absent from the selector. That selector is not attached as a packet filter: an unmatched source can leave untranslated if routing and other policy allow it.

```ios R2
R2(config)# ip nat inside source list NAT-LANS interface gigabitethernet0/1 overload
```

The guided lab supplies the interfaces and ACL before this command. Verify with fresh client traffic, the actual application result and the translation table. A table entry establishes translation state; it does not alone establish receipt of the reply or successful HTTP. Dynamic entries can expire at different rates, so do not prescribe one universal “one minute” lifetime.

A plain ping generated by R1 normally uses its egress transit address, `10.255.12.1`. That address is not translated by the lab's selector. A ping sourced from R1's staff gateway address exercises a different source match. Compare those tests deliberately; neither is a complete substitute for a test from the actual client with its own gateway, DNS and local policy.

:::trap An empty translation table is a symptom
No eligible traffic, an earlier ACL drop, a missing route, incorrect inside/outside roles or expired entries can all leave a table empty. Inspect the selected source and path before changing NAT. The lab's ISP lacks routes to branch private subnets by design; private addressing itself does not make a packet unroutable.
:::

## Apply policy and management controls

The guest policy is defined in packet terms. Permit DHCP client-to-server traffic first because initial requests use source `0.0.0.0`. Permit guest ICMP echo replies to staff so a staff diagnostic ping can finish. Deny other guest packets to staff, management and the HQ/transit block, then permit the intended guest source toward other destinations.

This policy does not promise that guests can answer every staff application. UDP replies and TCP replies need their own consideration. The `established` keyword, discussed in the [ACL chapter](#/chapter/acls), checks ACK or RST flags; it does not maintain a session table and must not be described as “only packets from staff-initiated sessions.” The capstone uses a limited ICMP exception instead.

Apply `GUEST-IN` inbound on R1's guest subinterface. A staff request travels outbound through that interface, while the guest response enters it. Compare those directions explicitly. Traffic between guests in the same VLAN need not traverse R1 at all and is outside this routed ACL's control.

Protect management separately. The final guest permit would otherwise include the guest gateway's SSH service. A standard VTY access list permitting only `10.10.10.0/24`, together with `login local` and `transport input ssh`, restricts remote management by source and authentication. Keep the console open and prove a fresh staff login before declaring the change complete. The simulated ISP is not a managed branch device in this exercise.

NTP and syslog add independent observations. Use the HQ server as an isolated time source, inspect synchronization and record the actual stratum. For syslog, generate a known harmless interface event and confirm receipt. A configured destination and severity threshold make a message eligible for forwarding; they do not guarantee transport or collection. Features unavailable on a particular simulator model must be recorded as unsupported, not counted as passed.

## Verify the design and isolate faults

Use the following checks after the build and after every recovery:

| Test | Expected result | What it does not establish alone |
|---|---|---|
| Both channel members bundled | Po1 in use; both members participate | No loss during failure or doubled single-flow speed |
| DHCP on each client | Correct subnet, gateway and DNS | External service availability |
| Staff to HQ | Ping and configured service succeed | PAT, which is not used on that path |
| Both clients to external HTTP | Page by address and by name succeeds | All protocols or destinations work |
| Guest policy | Guest-to-staff request denied; staff ping receives a reply | Stateful protection or same-VLAN isolation |
| Staff SSH and guest SSH | Staff logs in; guest is denied | Every management plane is protected |
| NTP and syslog | Selected time source and actual received event | Perfect time accuracy or guaranteed log delivery |

Record actual addresses and counters rather than copying the example numbers. If a deny test fails, also run an allowed control test to distinguish filtering from a broken route. Take counter snapshots immediately before and after a new probe. An unchanged counter can mean an earlier ACL line matched, the packet used another path, or the platform did not update that counter as expected.

Save a working checkpoint, introduce one fault, observe it, and restore the intended state in a separate step. Removing VLAN 20 from the router trunk leaves staff service and the routed transit intact. Making the transit passive affects OSPF reachability while a directly connected ping may still work. Inserting an overly broad guest deny can leave DHCP functioning while blocking the guest gateway and external access.

Do not turn these examples into universal diagnoses. A FULL neighbor with missing routes has several possible causes. Cisco documents network-type mismatches that produce inconsistent topology descriptions; the mismatch must be established from both interfaces rather than inferred from FULL alone. Similarly, no DHCP lease does not prove a Discover never reached a server, and EXSTART does not uniquely prove an MTU mismatch.

Finish with a concise handover: topology, addressing, tested requirements, observed limitations, fault causes and exact repairs. Rebuild from the specification later to check that the reasoning transfers. Use the individual chapter labs for the objectives this integrated network does not contain.

## Exam focus

- Relate each requirement to a feature, its device/interface placement, and observable proof.
- Distinguish VLAN existence, trunk allowance, forwarding state and router subinterface state.
- Check OSPF neighbors, required routes and return paths separately.
- Evaluate the actual NAT source and the role of each interface; translation selection is not filtering.
- Follow both directions through a stateless ACL and test management-source restrictions separately.
- Compare a known baseline with one changed condition; repair the supported cause and repeat the original tests.
