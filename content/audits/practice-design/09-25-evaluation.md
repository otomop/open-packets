# Practice-depth evaluation: chapters 09–25

Reviewed 20 September 2026. This is a practice-design evaluation, not a second full technical rewrite. I read each chapter's metadata and teaching headings, all current question prompts/options/answers and flashcards, and the lab's setup, procedure, expected observations, recovery and challenge. Existing prior technical reviews remain separate evidence. I did not execute Packet Tracer, inspect every command against an image, or measure learner performance.

## Basis for the recommendations

The [current Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) support different demands in several chapters. In particular, v1.1 interprets Rapid PVST+ and describes FHRP; v2.0 configures Rapid PVST+, interprets HSRP/VRRP status, adds single-area OSPFv3, and emphasizes troubleshooting addressing/static routing/DHCP and diagnosing DNS records. Those differences justify track-aware practice, not marking every supplied configuration as memorization required by both tracks.

The ranges below are editorial workload bands, not Cisco quotas or measured exam difficulty. Level 1 means recognition/comprehension; level 2 applies a known rule or procedure; level 3 combines evidence, rejects competing explanations or evaluates a changed design. An exhibit or a multi-select format alone does not make a question difficult. Percentages are approximate intended distributions, not rigid quotas. A bank should stop growing when a proposed item adds only different numbers to the same decision.

Every chapter currently has 16 questions and 20 cards. This uniformity conceals large differences in scope. Existing labs are generally strong on complete setup, controlled faults and separate recovery. The most useful changes are broader independent decisions in demanding chapters, better question ordering and demand labels, and smaller, more focused retrieval banks in narrower chapters.

## Chapter recommendations

| Chapter | Current Q levels 1/2/3 | Recommended questions | Recommended cards | Intended 1/2/3 mix |
|---|---:|---:|---:|---:|
| 09 VLANs and access ports | 0/12/4 | 20–24 | 20–24 | 20% / 55% / 25% |
| 10 Trunks and DTP | 3/11/2 | 22–26 | 18–22 | 15% / 55% / 30% |
| 11 Inter-VLAN routing | 0/14/2 | 24–30 | 20–24 | 10% / 55% / 35% |
| 12 CDP and LLDP | 4/12/0 | 16–20 | 14–18 | 20% / 50% / 30% |
| 13 EtherChannel | 2/14/0 | 24–28 | 22–26 | 15% / 50% / 35% |
| 14 Spanning tree | 0/15/1 | 28–34 | 22–26 | 15% / 45% / 40% |
| 15 STP protection | 0/15/1 | 22–26 | 20–24 | 15% / 50% / 35% |
| 16 Layer 2 security | 5/11/0 | 30–36 | 24–30 | 15% / 45% / 40% |
| 17 Routing table | 5/10/1 | 26–32 | 20–24 | 15% / 50% / 35% |
| 18 IPv4 static routing | 7/9/0 | 28–34 | 22–26 | 10% / 50% / 40% |
| 19 IPv6 addressing | 10/6/0 | 28–34 | 24–28 | 20% / 50% / 30% |
| 20 IPv6 static routing | 7/9/0 | 24–30 | 18–22 | 10% / 50% / 40% |
| 21 OSPFv2 | 0/13/3 | 30–36 | 24–28 | 15% / 50% / 35% |
| 22 OSPFv3 | 0/14/2 | 22–28 | 18–22 | 15% / 50% / 35% |
| 23 HSRP and VRRP | 0/15/1 | 18–24 | 16–20 | 20% / 55% / 25% |
| 24 DHCP | 4/10/2 | 26–32 | 22–26 | 15% / 50% / 35% |
| 25 DNS | 6/9/1 | 24–30 | 20–24 | 20% / 45% / 35% |

### 09 — VLANs and access ports

The bank spans VLAN membership, voice/data handling, persistence, several endpoint attachment types and PoE requirements/budgets. Twenty to twenty-four questions are justified by these distinct decisions. Several present level-2 items merely retrieve a default or name a command; relabel those rather than manufacturing extra analysis. Add a requirements-to-port-plan case, a PoE device-standard versus remaining-budget comparison, and a case that distinguishes an absent VLAN from a wrongly assigned port using the actual evidence.

Keep the single-switch lab and its separate missing-VLAN and wrong-membership experiments. Require a prediction of permitted communication before the first ping and a final independent endpoint addition. Phone registration is not established by voice-VLAN configuration. The AP, hypervisor and inline-appliance cases should remain attachment requirements with supplied context; their full management/configuration belongs later. Do not turn this into an early wireless or virtualization lab.

### 10 — Trunks and DTP

The strongest additional practice compares both ends of a link and the allowed/active/forwarding sets, then selects the smallest safe correction. Include a host or AP tagging contract and a command that adds a VLAN without replacing an existing allowed list. These are different decisions from simply identifying the native VLAN. Keep DTP mode recognition bounded; do not expand legacy negotiation into a second switching curriculum.

The two-switch lab already observes an allowed-list fault and a native mismatch independently. Retain its qualification that a native mismatch does not make every tagged VLAN fail. Its extra AP preparation is a supplied interface contract, not proof of a joined AP. Require the challenge to preserve existing VLAN service when adding VLAN 30. STP states may be supplied as output; root-election calculations are premature here.

### 11 — Inter-VLAN routing

Router-on-a-stick, SVI operation and a routed physical port need separate construction and verification decisions. Add paired interface/VLAN/route evidence for an SVI that cannot become operational, an operational trunk with incorrect subinterface encapsulation, and an L3 switch that still lacks routing. Ask learners to explain the next-hop MAC and packet/frame changes at one boundary without repeating the Ethernet chapter's entire bank.

Retain the two complete lab builds and the directly connected routed-link checkpoint. Follow the supplied builds with a short topology-only reconstruction or a new VLAN requirement. Do not make a remote PC-to-R2 path depend on static routes not taught until chapter 18; the existing direct-link test is appropriately bounded. The independent result must include local gateway, route presence and bidirectional client tests, not only accepted commands.

### 12 — CDP and LLDP

Sixteen useful questions may already be sufficient; the upper band is for documentation reconciliation, stale cache and asymmetric transmit/receive evidence, not protocol timer trivia. Current q01 and q07 both emphasize local/remote port identification and are candidates for consolidation or meaningful differentiation. Some cards repeat command or field recognition that can be combined; detailed reinitialization timing should not displace interpreting actual neighbors.

Keep the lab's deliberately wrong drawing, two-ended verification, LLDP transmit-only fault and cable-move challenge. The main deliverable should be a corrected connection table with confidence/limits. A discovered management address does not prove reachability, and a missing record does not alone prove an unplugged cable. The lab should assess these limits explicitly.

### 13 — EtherChannel

Sixteen questions underrepresent L2 and L3 bundles, member consistency, LACP negotiation, logical-interface configuration and load distribution. Add cases where the bundle is up but a VLAN is absent, where one member is suspended, and where matching modes still leave a physical/member inconsistency. Separate aggregate capacity from the result for one flow. The current question labels understate analysis in some fault cases and overstate it in simple command recognition.

Keep the L2 and L3 lab modules, one-member failure, passive/passive observation and restoration. Ask learners to assemble the final third-member variation from requirements before opening the worked answer. Do not promise traffic-generation evidence of doubled throughput. PAgP remains comparison context. The brief STP logical-port preview is adequate; chapter 14 need not become a prerequisite.

### 14 — Spanning tree

This is a high-practice chapter because several rules must be applied in order. Add a complete three-switch role assignment, a supplied-cost tie resolved by sender information, a topology change that changes designated ports as well as root paths, and a second VLAN with a different intended root. These should vary the reasoning, not just substitute MAC addresses. Keep unusual backup-port/shared-segment recognition to one small case.

The existing triangle lab already gives useful asymmetric costs and controlled root/path changes. Put a prediction table before each manipulation: root ID, local root port/cost, designated/alternate roles and expected reachable endpoints. Finish with a fresh topology-only variation. Configuration is required depth for the v2 track and useful observation support for v1 interpretation. Do not inflate the bank with every possible timer arithmetic combination or platform cost table.

### 15 — STP protection

Practice should distinguish intent, trigger, affected scope and recovery for each protection. Add competing-evidence cases that distinguish err-disable, root inconsistency and loop inconsistency, and an automatic-recovery case where the underlying cause persists. Repeatedly asking the same PortFast/BPDU-guard command is less useful than choosing the correct boundary and explaining why normal traffic is or is not permitted.

Retain the lab's line topology, verified baseline, separate safe host-edge test, superior-root test and restoration. Its CML/hardware-only BPDU-loss exercise and explicit Packet Tracer worksheet are appropriate. Preserve three distinct tickets if all remain evidence-based. BPDU filtering should stay last, explicitly bounded to v1 context and optional observation; never add a loop just to make a more dramatic lab.

### 16 — Layer 2 security

Five controls and their interactions justify the largest switching band. Add DHCP-versus-DAI trust direction cases, a legitimate static-addressed endpoint exception, a port-security violation whose mode changes the evidence, and a fresh RA observation that proves the intended policy rather than relying on cached addressing. Avoid more threshold calculations unless they change a policing decision.

The existing 90-minute lab is complete but dense. Divide its presentation into explicit modules/checkpoints: port security; DHCP snooping plus DAI; storm-control interpretation; supported RA-guard exercise. Its minimal DHCP and IPv6 setup are supplied prerequisites, not evidence that chapters 19 and 24 have been learned. Mark the deeper revisit after those chapters. Preserve the distinction between configuration acceptance, a paper fallback and observed enforcement. Do not require disruptive traffic generation.

### 17 — Routing table

Expand full-table lookup practice: matching versus nonmatching prefixes, local delivery, connected forwarding, next-hop resolution, default and discard. Keep same-prefix route selection distinct from packet forwarding through installed routes. Include one multi-stage candidate-withdrawal case and a justified limit-of-evidence case. BGP/EIGRP source codes and AD values are recognition; this chapter should not acquire dynamic-protocol configuration.

The lab correctly supplies static setup before chapter 18, exercises a more-specific Null0 route with separate repair, and provides ECMP/AD worksheets. Its independent challenge is still largely explanation of the same topology. Add a fresh installed-route worksheet with different overlapping boundaries and a predicted destination/interface/action table, without demanding IPv6 calculation before chapter 19. Require a source and return-path explanation for the end-to-end test.

### 18 — IPv4 static routing

The bank needs greater configured/installed/usable-path analysis across network, host, default and floating routes. Some currently level-1 items already require application or diagnosis. Add combined forward/return tables, a syntactically correct unreachable next hop, and a primary that remains installed despite a remote downstream failure. Keep IP SLA configuration outside the required exercise.

Preserve the lab's missing-return observation, bidirectional baseline, primary failure/restoration, /32 exception and real loopback default destination. For independence, require one new destination requirement from a topology and compare predicted installed routes before and after failure. Changing only the backup distance from 5 to 200 is useful retrieval but insufficient as the only independent transfer task. No new production migration or convergence-timing promises are needed.

### 19 — IPv6 addressing

Ten questions currently labeled recall include address compression, EUI-64 derivation, /56 subnet counting and /60 boundaries; those are application tasks. Expand to distinct compression errors, inversion when the U/L bit starts set, partial-hextet prefix boundaries, scope/address-type discrimination, RA versus DHCPv6 roles, and source-supported diagnosis of absent automatic configuration. Do not replace these with extra obscure multicast or ICMPv6 type-number memorization.

Keep the two-LAN lab, actual-MAC calculation, observed automatic address, fresh-neighbor test and static-host forwarding fault. Require the learner's calculation before enabling EUI-64 and keep device-dependent addresses as recorded variables. Add a brief fresh-prefix configuration challenge after the paper arithmetic, using directly connected LANs and no unintroduced static route. Cards should favor atomic mechanisms over long lists of flags and numbers.

### 20 — IPv6 static routing

Avoid rebuilding chapter 18's whole conceptual bank with IPv6 spelling. Concentrate additions on interface-scoped link-local next hops, the same address on different links, neighbor resolution versus route installation, /128 exceptions and IPv6 forwarding enablement. Mixed evidence should distinguish the wrong link from a missing return route or absent forwarding. Reduce redundant generic AD/syntax cards if needed.

The existing lab's wrong scoped /128 is a valuable new failure, and the next-hop-only challenge tests real transfer. Keep both. Supply a compact prediction table for primary, failover, wrong-host-route and repaired-host-route states, including the next-hop/interface pair and unaffected destination. A successful v4 lab does not verify IPv6, but repeating every v4 explanation at full length is unnecessary.

### 21 — OSPFv2

The broadest routing protocol needs repeated, varied application: interface activation/wildcards, passive LANs versus transit, RID/process distinction, established versus fresh elections, normal 2-Way, timer/network-type/MTU evidence, and directional path costs. Add at least one full neighbor/interface/route case in which pings work while the backup adjacency is broken. Keep authentication and multi-area design outside this single-area assessment expansion.

The current three-router lab already supplies known election order, broadcast plus point-to-point, costs, failure/restoration and an asymmetric-cost challenge. Place prediction before the commands and require a final topology-only reconstruction. A fresh four-candidate election worksheet supplies simultaneous-election reasoning that the sequential live lab cannot prove. Do not promise that clearing one process creates a clean segment-wide election.

### 22 — OSPFv3

Use fewer questions than OSPFv2 because cost, election and adjacency-state principles have already been learned. Retain a small deliberate retrieval sample of those principles, then assess the new differences: explicit 32-bit RID on IPv6-only routers, link-local neighbor identity, interface activation, instance compatibility, Full neighbors with a missing global prefix, and classic versus supported address-family syntax.

The current lab correctly uses a separate IPv6 file, tests a hidden backup-adjacency failure, and withdraws a LAN advertisement without breaking transit neighbors. The paper syntax translation is sufficient for the alternate IOS family; do not demand two full simulator builds or pretend unsupported syntax is executed. Keep advanced LSA type detail and multi-area behavior out. This is a v2 objective chapter, not a missing v1 OSPF requirement.

### 23 — HSRP and VRRP

This narrower interpret/describe chapter does not warrant the same workload as configuring OSPF. Prioritize real versus virtual gateway, current operational role, configured versus effective priority, preemption, tracking arithmetic, dual-active evidence and independent address-family status. Several current items/cards concentrate on MAC encodings, transport numbers, group limits and message/state trivia. Retain enough to recognize evidence; do not grow that memorization set at the expense of the gateway mechanism.

Keep the complete HSRP build clearly identified as guided/optional configuration supporting the objective. Its client-to-server test, real return path, LAN failure, tracking and VRRP worksheet are useful. For a shorter required route through the lab, use baseline status plus one failover observation and the VRRP interpretation; the version-change and tracking configuration can remain optional. Do not count a changed HSRP role as proof of application health. No GLBP expansion is needed.

### 24 — DHCP

Add breadth across initial allocation, renewal/expiry, pool capacity/exclusions, matching a relayed subnet, server return path, client options and client-versus-server evidence. Distinguish a proved pool exhaustion from a merely failed allocation. Current q04 placement recall versus q05 correction can stay as progressive instruction, but should not multiply into several identical helper questions. Timer calculation is useful once; packet-field minutiae should be subordinate to following a request and reply.

Retain the complete remote-server/relay/IOS-client lab and fresh clients for each fault. Existing leases deliberately concealing a broken helper is a strong observation. The independent new-subnet challenge already requires a pool, helper, return route, exclusions and verification while preserving existing clients. Make those its explicit success criteria. A separate production DHCP deployment or waiting a whole lease interval is unnecessary.

### 25 — DNS

The six record types, separate services and failure stages justify more scenario coverage than 16 questions on the v2 route. Add a CNAME chain that resolves to the wrong address, a response-versus-timeout comparison, and paired client/explicit-resolver results that isolate local configuration without assuming all applications use the same lookup path. Keep v1 explanatory items accessible without requiring the entire v2 diagnostic bank. Avoid expanding old UDP-size facts or DNS hierarchy trivia into a large memory set.

Retain the local DNS/HTTP lab, independent resolver and wrong-record faults, separate repairs, required record worksheets and fresh CNAME challenge. The worksheet requirement is honest about Packet Tracer limits. Success should identify exact name, type, queried server, answer and service test; a successful address ping is insufficient. Keep public delegation edits hypothetical, with supplied authority rather than a dependency on a real public service.

## Agreed immediate design for chapters 04–05

Chapter 04 will use **24 questions: 6 recognition/comprehension, 12 application, 6 analysis; 22 cards**. It owns address/mask mechanics, boundaries and usable hosts, local-versus-remote decisions, gateway selection, configuration verification and small addressing faults. Retain its two directly connected LANs. Put calculations and communication predictions before answer tables, preserve guided IOS setup, observe the gateway error before a separate repair, and finish with a fresh independent prefix/configuration task.

Chapter 05 will start with **28 questions: 4 recognition/comprehension, 16 application, 8 analysis; 24 cards**. It owns equal-size subdivision, unequal requirements, aligned placement, overlap, capacity, fragmentation under fixed allocations, private/special-purpose interpretation and bounded summary reasoning. Do not add more questions unless a distinct required skill is otherwise absent. Its three-LAN lab should allocate before revealing the plan, demonstrate one failed growth attempt with evidence, perform one small authorized renumbering, and use a verification table. No elaborate migration planning is appropriate before routing. The challenge must allocate fresh values independently.

Both chapters will review drills and tickets for useful retrieval or justified diagnosis, preserve same-topic identities, and record every keep/revise/retire/add decision. A retirement attributed to a later owner requires an actual destination item, not a presumed future rewrite.
