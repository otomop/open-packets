# Sequential coherency review: Chapters 12–23

Reviewed September 24, 2026 against the current local course and the baseline captured at commit f05fc4a09e9f26cd5907d24603d300e7733030a1. This review preserves the prior practice revisions, including the uncommitted later-chapter work present in that baseline. No application, design, colors, hosting, or Git publication was changed.

All 72 owned assets were read in full: each lesson, its complete lab (including challenges/solutions), questions, cards, command drills, and tickets. Truncated tool reads were followed by focused rereads of the omitted records; the independent hash-method question etherchannel-q28 was explicitly included. Incoming dependencies were checked in the actual earlier lessons, not inferred from their titles. The machine-readable companion records exact earlier and local section IDs, practice demands, later dependents, retained previews, unchanged decisions, and execution limits.

The sequence is sound enough to retain: discovery → aggregation → spanning tree → protection → access-layer security → route interpretation → IPv4 statics → IPv6 addressing/statics → OSPFv2/v3 → redundant gateways. The changes close specific entry or assessment gaps rather than renumbering the course. All chapter, section, question, card, command, ticket and lab-step IDs remain stable.

## Scope and preservation

- Reviewed 297 questions, 260 flashcards, 122 command drills and 25 troubleshooting tickets: 704 practice items in total.
- No practice items were added, retired or rewritten. The gaps were in the prerequisite links and teaching that precedes those items.
- Changed 11 lesson files and one lab file. Chapter 15 required no authoring changes after its complete review.
- Kept self-contained lab builds, explicitly authored output, independent observation/recovery steps, and supported-image or worksheet alternatives.

## Chapter findings

### 12 — CDP & LLDP

Incoming foundations: Distinguish ARP, MAC and routing evidence (network-models / where-the-layers-live-devices-and-commands); Configure and verify management SVIs separately from routing (inter-vlan-routing / svis-on-a-multilayer-switch); Recognize phone data/voice policy and discovery role (vlans-and-access-ports / voice-vlan-two-vlans-on-one-access-port); Inspect, configure and save from the right IOS mode (ios-essentials / modes-prompts-and-the-two-configurations).

- Added inter-vlan-routing prerequisite because the lab requires management SVIs taught in Chapter 11.
- Added an opening bridge separating prior IP gateway/management work from current Layer 2 discovery.

Practice readiness: Build a fresh VLAN-1 discovery topology with supplied SVI/router/PC addresses. Predict neighbor rows and physical port changes; read lifetime separately from current connectivity. Test directional LLDP transmit suppression and restore it; use supplied paper fallback for unsupported features. Explain why discovery does not certify routing, VLAN service or application health.

Retained decisions: Kept discovery before bundling: partner identity and cabling evidence prepare Chapter 13. The lab already supplies all addressing, platform alternatives and restoration steps.

Bounded previews: LLDP-MED voice/QoS TLV names identify advertised policy; no QoS configuration or calculation is required before Chapter 28.

### 13 — EtherChannel

Incoming foundations: Configure compatible native and allowed VLAN trunk settings (trunks-dtp / configuring-trunks-on-2960-3560-and-9200); Convert a supported switch interface into a routed port (inter-vlan-routing / routed-ports-and-the-four-designs-compared); Read C connected prefixes and L own addresses (network-models / where-the-layers-live-devices-and-commands); Identify physical partner ports with discovery evidence (cdp-lldp / reading-a-neighbour-table).

- Expanded NIC and teaming/bonding vocabulary before endpoint requirements.
- Added a C/L Port-channel1 route-reading example before the routed lab; Chapter 17 retains general route-selection ownership.

Practice readiness: Build and restore two-member LACP trunks, test a member loss, and diagnose passive/passive or incompatible partner evidence. Build a separate routed 3560 port channel, inspect connected prefixes and ping its peer. Distinguish S/R/U/P flags, partner identity and actual VLAN service. Apply endpoint teaming requirements without configuring a hypervisor.

Retained decisions: Retained safe member shutdown during construction and separate 2960/3560 builds. Kept independent outbound hash selection and simulator-limited partner checks.

Bounded previews: STP is explicitly introduced as loop prevention and a logical-bundle consumer before detailed Chapter 14 elections; no untaught role calculation is required. Virtual host attachment builds on Chapter 10 tagging; hypervisor installation and architecture remain Chapter 39.

### 14 — Spanning tree

Incoming foundations: Source learning, flooding and why a Layer 2 loop persists (ethernet-switching / why-vlans-and-spanning-tree-exist); VLAN database and per-VLAN forwarding identity (vlans-and-access-ports / vlan-numbers-names-and-where-they-live); Compatible trunks and native/allowed VLAN settings (trunks-dtp / configuring-trunks-on-2960-3560-and-9200).

- Added executable interface-mode spanning-tree vlan 10 port-priority 64 before command drill d09, using a separate equal-cost scenario with stated default sender priorities.

Practice readiness: Calculate triangle roles from actual receiving costs and advertised root costs. Configure Rapid PVST+, deliberate roots, and a cost change; preserve and restore each failure separately. Predict sender-port-ID tiebreaking and interpret output without conflating bridge and port priority. Allocate a separate VLAN-20 root/cost plan in the challenge.

Retained decisions: Preserved receiving-cost STP arithmetic and the distinct designated-port comparison. Triangle failure and restoration phases are self-contained and do not require a previous lab file.

Bounded previews: PortFast is identified as edge behavior; Chapter 15 develops protection and operational edge status.

### 15 — STP protection

Incoming foundations: Root, designated and alternate roles with BPDU comparison (spanning-tree / port-roles-root-designated-alternate-backup); Discarding/learning/forwarding and rapid convergence (spanning-tree / port-states-and-convergence); Configure and verify per-VLAN roots (spanning-tree / configuring-rapid-pvst).

- No substantive sequencing gap found after full lesson, lab and four-bank reads; left all six files unchanged.

Practice readiness: Build a fresh nonredundant line before controlled guard faults. Choose protection from port purpose and classify err-disabled versus root/loop-inconsistent. Remove each physical/configuration fault before manual or automatic recovery. Use isolated supported hardware or the supplied worksheet for missing-BPDU testing; do not construct an unprotected loop.

Retained decisions: Retained the three independent protection mechanisms and their distinct recovery behavior. Every advanced filter/recovery experiment supplies setup and an appropriate supported-platform fallback.

Bounded previews: DHCP/ARP are examples of host startup traffic, not a demand for DHCP server configuration.

### 16 — Layer 2 security

Incoming foundations: ARP next-hop mapping and local broadcast scope (network-models / local-or-remote-the-host-s-first-decision); IPv4 network/mask and usable address planning (ipv4-addressing / masks-prefixes-and-block-sizes); Access and voice VLAN endpoint behavior (vlans-and-access-ports / voice-vlan-two-vlans-on-one-access-port); Errdisable diagnosis and cause-specific recovery (stp-protection / bpdu-guard-a-bpdu-on-an-edge-port-is-a-violation).

- Added restrict-mode syntax before drill d04.
- Added client/server DORA roles, pool, ACK/NAK, chaddr and relay/giaddr explanations; moved relay-information explanation before Option 82 configuration.
- Expanded ARP ACL terminology and exact-match/implicit-nonmatch semantics before fallback assessment; clarified trusted DAI default rate.
- Added bounded IPv6 notation, link-local, /64, SLAAC and retained-state explanation before the RA-guard exercise.
- Annotated every supplied DHCP server setup command in lab Step 1 so the early feature lab is understandable before Chapter 24.

Practice readiness: Apply MAC policy then diagnose and restore a secure shutdown. Obtain fresh DHCP leases after snooping starts, trace authorized reply direction and inspect bindings. Observe a static-printer DAI failure and repair only its exact approved IP/MAC policy. Calculate nominal storm percentages and interpret supplied rising/falling evidence. Use supported Catalyst RA-guard configuration or a clearly labelled worksheet, with fresh packet evidence and complete cleanup.

Retained decisions: Kept Layer 2 protection with switching rather than moving it after all services: the added minimum protocol foundations remove the forward dependency. Preserved four independent lab modules, accurate simulator limits and every practice item.

Bounded previews: DHCP server setup is supplied and annotated here; lease renewal, full pool design and relay configuration remain Chapter 24. IPv6 first-hop vocabulary is taught locally for policy work; address arithmetic, full ND and RA flags remain Chapter 19. ARP ACLs are a deliberately narrow precursor; IPv4 packet ACL evaluation/configuration remains Chapter 34. The guided Wireshark RA filter is supplied; general capture troubleshooting remains Chapter 31.

### 17 — The routing table

Incoming foundations: Calculate ranges and retain prefix bits (subnetting-vlsm / the-block-size-method-in-any-octet); Read basic connected and local table entries (network-models / where-the-layers-live-devices-and-commands); Distinguish routed interfaces and management-only SVIs (inter-vlan-routing / svis-on-a-multilayer-switch); Use IOS configuration inspection and output filters (ios-essentials / modes-prompts-and-the-two-configurations).

- Added IOS and inter-VLAN prerequisites for actual configuration/verification demands.
- Expanded CEF and adjacency meanings, distinguished forwarding adjacency from later OSPF adjacency.
- Defined Null0 and anchored include-filter syntax before corresponding practice.

Practice readiness: Build supplied connected/static paths and decode the resulting table. Choose a longest prefix before comparing candidate-source or metric assumptions. Observe a more-specific Null0 fault and restore it without falling back to a covering route. Interpret equal-cost paths, CEF actions and authored AD comparisons without configuring untaught dynamic protocols.

Retained decisions: Kept route-source selection separate from longest prefix match and unresolved-next-hop behavior. Retained evidence-based limits on CEF, default displays and equal-cost throughput.

Bounded previews: OSPF/EIGRP/RIP/BGP codes and AD values are identification in supplied outputs; learners need not configure those protocols here. Static setup is explicitly supplied for interpreting a table; Chapter 18 owns independent static-route configuration.

### 18 — Static routing (IPv4)

Incoming foundations: Interpret route fields, source preference and prefix match (routing-table / administrative-distance-choosing-between-sources); Resolve next hops and apply a default (routing-table / the-default-route-and-the-gateway-of-last-resort); Identify request/reply sources and ARP at each routed hop (network-models / the-packet-walk-pc-a-to-server-b-and-back); Read a traceroute as TTL probe evidence (network-models / where-the-layers-live-devices-and-commands).

- Added an executable inline source-ping example and the interactive extended-ping sequence before drill d11.
- Added explicit traceroute syntax and source/evidence limits before drill d12.

Practice readiness: Build two LANs and dual transit paths with supplied addresses, then add forward and return statics. Predict and test floating-static failover only when its selection conditions change. Observe /32 specificity winning despite higher distance. Test using the actual PC source or R1 LAN source; clean up the host/default/loopback extension.

Retained decisions: Proxy ARP already has a concrete definition in Chapter 01, so no redundant re-teaching was added. Kept separate fault observation and recovery, actual client tests and configured-versus-installed route evidence.

Bounded previews: Tracking is identified as a separate mechanism beyond ordinary static eligibility; no unsupplied tracking configuration is demanded.

### 19 — IPv6 addressing

Incoming foundations: Bit values and retain/clear mask arithmetic (ipv4-addressing / binary-and-the-32-bit-address); Prefix sizing and equal-size subnet counts (subnetting-vlsm / the-block-size-method-in-any-octet); Connected/local prefix interpretation (routing-table / the-legend-route-source-codes); RA/SLAAC policy motivation (layer2-security / control-ipv6-router-advertisements).

- Added subnetting and routing-table prerequisites.
- Added a /62 worked binary example to prepare /61 assessment instead of relying only on /60 whole-digit examples.
- Explained the EUI-64 toggle at bit level.
- Added representative C /64 and L /128 output plus explicit link-local test scope before lab/command-bank requirements.

Practice readiness: Calculate prefixes and subnet allocations, including question q20/card c25 non-nibble boundaries. Derive an identifier from the actual interface MAC and distinguish toggling from adding two. Build a dual-LAN IPv6 router and compare manual addressing with SLAAC. Force a fresh neighbor lookup with a temporary address, restore IPv6 forwarding, and remove deliberate faults.

Retained decisions: Preserved v2 prefix-sizing depth and non-nibble questions because the method can be taught directly. Retained separate manual, SLAAC, EUI-64 and fresh-ND observations.

Bounded previews: DHCPv6 is compared with SLAAC and RA for address/default/DNS roles, without DHCPv6 server configuration.

### 20 — Static routing (IPv6)

Incoming foundations: IPv6 addressing, link scope and ND (ipv6-addressing / address-types); Enable IPv6 processing and forwarding (ipv6-addressing / configuring-ipv6-on-ios); Static forms, specificity, defaults and backup selection (static-routing-ipv4 / floating-static-routes); Prove request and return routing for the actual source (static-routing-ipv4 / the-return-path-and-how-to-test-it).

- Defined Hop Limit by its relationship to the already taught IPv4 TTL.
- Added a transition explaining why Chapter 21 uses IPv4 to teach OSPF mechanisms before Chapter 22 transfers them to IPv6.

Practice readiness: Configure dual IPv6 transit paths and test scoped neighbor pings. Build forward/return static paths and floating failover. Diagnose an installed more-specific host route with the wrong on-link neighbor instead of assuming fallback. Complete the host/default extensions with cleanup and preserve separate worksheet versus device evidence.

Retained decisions: The lab already teaches interactive link-local ping scope, complete addressing, separate failure/recovery and independent return routes. Kept global-recursion assumptions explicit rather than promising defaults recursively resolve every static.

### 21 — OSPFv2

Incoming foundations: AD/metric/longest-prefix decisions (routing-table / administrative-distance-choosing-between-sources); Configure defaults and verify source-specific returns (static-routing-ipv4 / default-routes); Source-selected tests and traceroute limits (static-routing-ipv4 / the-return-path-and-how-to-test-it); Differentiate transmitted information and local receiving costs in STP (spanning-tree / port-roles-root-designated-alternate-backup); Read IP packet size/MTU versus Ethernet frame size (ethernet-switching / anatomy-of-an-ethernet-frame).

- Explicitly separated outgoing OSPF costs from earlier receiving-cost STP arithmetic.
- Explained passive-interface default as suppression on current/future activated interfaces and no passive-interface as an exception, not activation.
- Added a bounded conditional default-information originate worked example, source-default requirement/withdrawal, O*E2 interpretation and actual-path verification for Chapter 44.
- Introduced the compact show ip ospf interface brief form before drill d12.

Practice readiness: Build a fresh three-router shared segment plus direct link with known costs. Predict sequential/non-preemptive DR/BDR elections and point-to-point roles. Observe directional metric changes, timer mismatch and client-LAN activation independently. Interpret MTU/Init evidence, select exact interface wildcards and verify client return paths.

Retained decisions: Full MTU and Ethernet foundations already precede OSPF, so only their database-exchange relevance is required here. No default was added to the main lab, whose specific LAN routes deliberately test OSPF activation.

Bounded previews: Default origination is a bounded capstone dependency; external metric tuning, redistribution and multi-area LSA catalogues remain outside this exercise.

### 22 — OSPFv3

Incoming foundations: OSPF identity, neighbor states and election rules (ospfv2 / becoming-neighbours-then-adjacent); Outgoing cost and passive interface activation (ospfv2 / configuring-single-area-ospfv2); IPv6 link-local and address-family distinction (ipv6-addressing / address-types); Scoped next hop and unchanged global destination (static-routing-ipv6 / link-local-next-hops-need-a-link).

- Added static-routing-ipv6 prerequisite for the scoped-forwarding transfer.
- Made link-local-only transit support explicit before questions q19/q21.
- Defined address family before presenting the alternative IOS XE configuration.

Practice readiness: Build a fresh IPv6-only three-router topology with explicit RIDs and complete classic syntax. Calculate and inspect global /64 routes using link-local next hops. Separate failed direct adjacency from working alternate traffic and missing LAN activation from Full neighbors. Translate supplied core configuration to address-family syntax on paper; allocate a new /64 and predict directional costs.

Retained decisions: Retained separate classic practical build and clean-image/paper address-family translation to avoid an unplanned migration. Cost arithmetic, /60 allocation and loopback /128 recognition are taught before assessment.

Bounded previews: Authentication is explicitly outside the objective; configuration is not introduced or assessed. Detailed LSA type catalogs are deliberately omitted; topology/prefix separation supplies the needed explanation.

### 23 — HSRP and VRRP

Incoming foundations: Hosts choose a local gateway and resolve its MAC (network-models / local-or-remote-the-host-s-first-decision); Switch source-MAC learning and port moves (ethernet-switching / learn-forward-filter-flood); PortFast on edge host/routed-router links (stp-protection / portfast-declaring-an-edge); OSPF LAN advertisement and passive transit distinction (ospfv2 / configuring-single-area-ospfv2); IPv6 link-local and Neighbor Discovery (ipv6-addressing / neighbor-discovery-and-getting-an-address).

- Added explicit IPv6 and STP-protection prerequisites used by the status worksheet and edge-port lab.
- Defined gratuitous ARP before requiring failover/MAC-learning interpretation.

Practice readiness: Interpret HSRP/VRRP operational status, effective priority, ownership and timing. Build the supplied HSRP/OSPF pair and prove remote return-route changes during an active LAN failure. Predict optional tracked uplink/preemption behavior and restore each fault. Use a complete authored VRRP worksheet where simulator configuration is unavailable.

Retained decisions: Retained OSPF passive LANs to isolate FHRP first-hop behavior from router adjacency. Kept first-hop role health separate from remote routing/application availability and separate IPv4/IPv6 VRRP instances.

Bounded previews: NAT/firewall state is mentioned only to delimit what ordinary FHRP does not synchronize; no NAT or firewall setup is required. Tracking and version changes are optional supplied configurations for interpreting output, not additional memory quotas.

## Boundary decisions

Chapter 12 now explicitly depends on Chapter 11's SVI management setup. Chapter 13 recalls the connected/local distinction newly established in Chapter 01 and applies it to Port-channel1; it does not need Chapter 17 before testing its local transit. Chapter 14's sender port-priority command is taught before its drill, while Chapter 21 explicitly distinguishes OSPF outgoing costs from STP receiving-cost arithmetic.

Chapter 16 stays in switching. Its security work needs a limited amount of DHCP and IPv6 earlier than their full chapters. The lesson now teaches those exact prerequisites, and the DHCP server setup is annotated rather than treated as prior knowledge. Chapter 19 develops addressing/ND fully; Chapter 24 retains DHCP server/relay/renewal depth, and Chapter 34 retains IPv4 packet ACL depth. No forward prerequisite was introduced.

Chapter 21's new default-origination example supplies Chapter 44's concrete need: an existing source default, ordinary default-information originate, O*E2 recognition, withdrawal when the eligible default is lost, and separate end-to-end validation. Passive-interface default already appeared in the original lesson and lab; its all-interface and exception behavior is now explicit. No always command was added to the build. The main Chapter 21 lab intentionally retains only specific LAN advertisements.

Chapter 22 now depends explicitly on IPv6 static routing for scoped next-hop reasoning. Chapter 23 names IPv6 addressing and STP protection because its required status worksheet and supplied PortFast setup use those foundations. Its HSRP configuration and tracking remain guided/optional at the intended exam depth.

## Source verification

The live official [CCNA v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) was checked: the relevant objectives include Layer 2/3 LACP, Rapid PVST+, IPv6 prefix sizing, IPv4/IPv6 static routing, single-area OSPFv2/v3, FHRP status, and Layer 2 security. Existing v1.1/v2.0 distinctions were preserved.

New or clarified technical claims were checked against primary documentation:

- [Cisco OSPF default origination](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/47868-ospfdb9.html): eligible default requirement, always distinction, and O*E2 output.
- [Cisco extended ping/traceroute](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html): source selection and extended prompts.
- [Cisco Catalyst 9300 port security](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/port_security.html): restrict configuration and mode behavior.
- [Cisco Catalyst 9300 DAI](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_dynamic_arp_inspection.html): trusted/untrusted rates and ARP policy behavior.
- [Cisco STP configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_1_se/configuration/guide/scg2960/swstp.html): per-VLAN port-priority configuration, read alongside the chapter's existing Rapid STP sources.
- [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html): DHCP messages and client/relay fields.
- [RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.html): IPv6 representation and arbitrary bit-length prefixes; the /62 calculation was independently checked by binary arithmetic.
- [RFC 4862](https://www.rfc-editor.org/rfc/rfc4862.html): SLAAC and retained address lifetimes.
- [RFC 5340](https://www.rfc-editor.org/rfc/rfc5340.html): ordinary OSPFv3 link-local operation.

The generic IOS LAN command reference was also consulted but its port-priority explanatory wording was not relied on for bridge-election behavior. One obsolete guessed 2960 URL was inaccessible; the chapter's existing official platform references supplied the correct context.

## Validation and limits

At the authoring checkpoint, node scripts/validate-content.mjs passed with **0 errors**. Its 10 warnings were untagged foundation questions in Chapters 00–01, outside these owned edits. It reported 46 chapters, 996 questions, 879 cards, 366 commands and 94 tickets across the concurrently edited course; those whole-course totals are a point-in-time observation, not a claim that later agents had frozen their work.

Entry anchors were programmatically checked to exist in an earlier chapter, introduced anchors in their own chapter, and all later-dependent IDs to resolve later in the course. Counts were compared with the supplied chapter map. SHA-256 comparison against baseline.json confirmed all 48 owned practice-bank files are byte-for-byte unchanged. No design code, production build, Git commit, push or deployment was performed.

No Packet Tracer, CML or physical switch/router execution was performed in this audit. Existing expected outputs remain explicitly authored examples. Static validation, reading and arithmetic establish internal consistency; they do not establish platform feature support or a measured failover time. A subsequent peer review is recorded separately.
