# Practice redesign: Chapters 14–18

Reviewed 20 September 2026 against the captured practice-09-23 baseline. This is a practice-depth review of every question and alternative, correct/incorrect explanation, flashcard, command drill, troubleshooting ticket and complete lab in the five owned folders. Lesson content, section identities and prerequisites are preserved; only lab-time estimates changed where the revised work requires more time. No application, style, shared script, build, server or deployment changes were made.

## Final workload and editorial demand

Difficulty describes the reasoning required, not measured exam difficulty. Reading an explicit status field or recognizing syntax remains foundational. Applying a known rule to a supplied case remains application even when there is an exhibit. Analysis requires integrating changing state, multiple observations, policy interactions or limits on a diagnosis.

| Chapter | Questions | Foundation / application / analysis | Cards | Drills | Tickets | Lab steps |
|---|---:|---|---:|---:|---:|---:|
| 14 Spanning tree | 26 | 6 / 15 / 5 | 22 | 10 | 2 | 9 |
| 15 STP protection | 22 | 7 / 12 / 3 | 20 | 11 | 3 | 11 |
| 16 Layer 2 security | 30 | 7 / 16 / 7 | 24 | 15 | 2 | 14 |
| 17 Routing table | 26 | 8 / 14 / 4 | 22 | 8 | 2 | 10 |
| 18 Static routing (IPv4) | 25 | 5 / 16 / 4 | 23 | 11 | 2 | 12 |

Question order progresses from foundations to application to analysis. Counts follow distinct outcomes, not an attempt to fill the plan's suggested ranges. In particular, Chapter 18 stops at 25 questions after removing duplicated interface-only ARP and distance-only cases; repeating a command with a changed number would not add useful practice. Cards use short bounded cues. Configuration drills remain where actual command construction is an outcome; Chapter 17 has fewer because its main outcome is interpretation.

Answer positions were varied without a repeated four-position cycle. An assertion checked that this permutation preserved the set of correct answer texts and every associated distractor explanation. Same-topic identities remain attached to the same knowledge. The app's own option shuffle remains unchanged.

## Chapter changes and lab progression

### 14 — topology-wide spanning-tree reasoning

The existing complete 2960 triangle is retained. New practice requires the learner to determine a whole triangle's root, root paths and designated/alternate choices, then reconsider them after root-priority and receiving-cost changes. Separate cases assess sender bridge ID before port ID, priority-zero ties, per-VLAN roots, component partitioning and a VLAN fault that STP cannot repair. Ethernet switches are explicitly distinguished from IP TTL processing.

The lab now asks for predictions before the path change and controlled link failure, then records baseline, changed, failed and restored evidence. The independent challenge adds VLAN 20 with explicit new PCs/ports/addresses, keeps the existing VLAN 10 service, configures different root preference and FastEthernet cost, and requires per-VLAN verification. The solution contains complete setup and saving instructions. VLAN 20's root is SW1; SW2 reaches it directly at cost 6, SW3 at cost 4, and SW2's link toward SW3 is alternate for VLAN 20. This does not change VLAN 10's intended root.

### 15 — protection scope, state and recovery

Practice distinguishes configured PortFast from operational edge behavior, interface guard from global edge-only scope, unknown error-disable causes from established BPDU violations, Root Guard from Loop Guard, and recovery timer configuration from correction of the original cause. The persistent-BPDU case requires interpreting repeated recovery/re-violation rather than assuming the timer failed.

The lab preserves its isolated line topology, removal of a redundant cable before the controlled edge test, and separate observation/recovery. Loop Guard remains a supported-device exercise or an explicitly supplied interpretation path; a simulator that lacks the behavior is not treated as having executed it. The new independent ASW4 worksheet chooses controls for an uplink root port, downstream designated boundary and printer edge, then predicts three distinct incidents and recovery requirements. Global Loop Guard and timer-only drill duplication were removed.

### 16 — modular access security with supplied dependencies

The larger checkpoint is justified by five distinct controls and their interactions. Cases include sticky running/startup state, restrict-mode evidence, source-MAC policy versus identity, secure-MAC movement, DHCP server-reply ingress, fresh snooping learning, separate DHCP/DAI trust, static-host ARP policy, explicit versus implicit ARP ACL denial, rate-limit cause evidence, storm hysteresis and interface-speed percentages, and RA guard role/attachment plus fresh packet evidence.

The lab is divided by an introductory route map and numbered step titles: source-MAC policy (1–4), DHCP/ARP dependencies (5–9), storm-control interpretation (10), separate IPv6 test (11–13), verification/save (14). The loader recognizes all these numbered steps. DHCP and IPv6 router configuration are supplied supporting setup, with full protocol study deferred to their existing owners. The flat DHCP lab explicitly disables Option 82 insertion instead of leaving server acceptance as an undocumented dependency.

The RA exercise now establishes a working legitimate sender, permits the test sender long enough to prove the path, then restores host-role ingress enforcement while the test sender remains active. A fresh same-adapter capture is required; stale SLAAC/default-router state is not a current RA measurement. The paper alternative provides the actual source/port observations needed to reason about the comparison. RA support is scoped to the cited Catalyst 9300 IOS XE 17.12 documentation, not assumed for Packet Tracer. The final step shuts the test sender and preserves the verified policy.

The independent IPv4 challenge adds a second explicitly addressed static printer, adds one exact ARP ACL permit while preserving binding fallback, and keeps untrusted endpoint ports. Its separate two-switch worksheet traces server-reply ingress rather than blindly trusting every switch link.

Root's independent review caught an unsupported inference in new q20: an ingress-port difference alone had been treated as proof of DAI rejection. The final item instead supplies an explicit sender-IP/MAC mismatch against the binding. It does not infer malicious intent or equate DAI with IP Source Guard. Other binding/port references describe useful evidence or port-security behavior, not this removed inference.

### 17 — source selection separated from forwarding

Rare IOS default-query output trivia and advanced external-code recall were reduced. New cases cover local delivery, next-hop meaning, connected/local withdrawal, exact matching versus default, a selected discard without fallback, source withdrawal while an independent more-specific prefix remains, forwarding after a more-specific route is withdrawn, unresolved Ethernet adjacency, flow-based ECMP evidence, and independent request/reply lookups.

The cold two-router setup remains complete. Static commands are supplied here; independent route construction belongs to Chapter 18. Guided observations distinguish local/connected entries, working bidirectional routes, an isolated more-specific discard, its repair and a real default-route destination. Worksheets for overlapping prefixes, administrative distance and ECMP now use closed solution disclosures. The independent challenge has six new destinations and local/connected/next-hop/discard/default actions, followed by separate route-withdrawal and missing-return-path cases.

### 18 — configured, installed and usable static paths

The complete dual-link 2911 lab remains the practical foundation. Added questions require distinguishing candidate eligibility from preference, selecting the actual adjacent next hop, removing the exact configured standby, recognizing a shared downstream failure, understanding alternate recursive resolution, diagnosing a missing reverse backup, and admitting when router/PC ping differences do not yet establish a unique fault. Direct syntax and explicit-evidence repairs use honest lower demand labels.

Before commands, the lab requests source/return-path and candidate/installed predictions. The learner records both routers during primary failure before restoring it. The independent challenge constructs routes for a new 198.51.100.64/26 destination with Loopback10 .65, primary AD 1 and standby AD 150, then tests it from the existing PC through failure and separate recovery. R2's existing return backup uses AD 5; opposite directions do not need equal distances. A paper /27 mask error then tests why a supposed backup attracts part of the LAN while the primary remains. The solution is complete, closed by default, and saves a separate project.

## Identity decisions

The companion `14-18-decisions.json` contains exactly 325 baseline/current union identities: 143 keep, 89 revise, 19 retire and 74 add. Each action was recomputed against exact JSON object equality. A wording, level or option-order change is a revision; unchanged objects remain keep.

Retired identities:

- Chapter 14: `spanning-tree-q06` (conditional classic timer arithmetic), `spanning-tree-c14` (missed-hello timing detail).
- Chapter 15: `stp-protection-d07` (separate interval drill), `stp-protection-d09` (global/interface Loop Guard duplication).
- Chapter 16: `layer2-security-c09` (aging detail), `layer2-security-d05` (automatic recovery syntax).
- Chapter 17: `routing-table-q03`, `q08`; `routing-table-c05`, `c08`, `c09`, `c18`; `routing-table-d02`, `d03`, `d09`, `d11`. These remove external-protocol/rare-output trivia and duplicate or premature command construction.
- Chapter 18: `static-routing-ipv4-q10`, `q15` (duplicate mechanism/preference cases), `static-routing-ipv4-d06` (repeated backup syntax).

Only confirmed real destinations are recorded: routing-table-d02's default construction is covered by `static-routing-ipv4-d04`, and routing-table-d03's floating-route construction by `static-routing-ipv4-d05`. Other retirement reasons identify remaining lesson/reference context without pretending an item was moved. A proposed new Chapter 18 q18 duplicated q01 and was removed before finalization; it was never a baseline or final identity and is not counted as a retired progress item.

## Primary-source claim map

The lesson source lists are retained. Additional checking used the following primary references; these support protocol/configuration claims, not claims of simulator execution.

| Claim or limit | Source |
|---|---|
| Current v1.1 STP, Layer 2 security and routing verbs; announced v2.0 expanded switching protection configuration | [Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf), [Cisco v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| RSTP roles/states, operational edge and received information; costs and Cisco configuration | [Cisco RSTP](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html), [2960 STP guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_1_se/configuration/guide/scg2960/swstp.html) |
| PortFast, BPDU Guard/filter, Root Guard and Loop Guard scope/state | [Catalyst 9300 optional STP features, 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/lyr2/b_1712_lyr2_9300_cg/configuring_optional_spanning_tree_features.html) |
| Sticky entries, violation modes and secure MAC seen on a different secure port in the same VLAN | [Catalyst 9300 port security, 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/port_security.html) |
| DAI IP/MAC validation, ARP ACL precedence/fallback and trusted-ingress behavior; no unsupported port-only rejection inference | [DAI configuration, 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_dynamic_arp_inspection.html), [Cisco DAI troubleshooting](https://www.cisco.com/c/en/us/support/docs/switches/lan-switch-software/222274-troubleshoot-dynamic-arp-inspection-dai.html) |
| RA guard policy roles, ingress attachments and supported-device scope | [Catalyst 9300 IPv6 first-hop security, 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_ipv6_first_hop_security.html) |
| Routing-source competition versus later longest-prefix lookup; next-hop validation; AD 255 | [Cisco route selection](https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html), [Cisco administrative distance, updated July 2026](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html) |
| Recursive versus fully specified static routes, Ethernet ARP implications and floating-route determinism | [Cisco next-hop configuration](https://www.cisco.com/c/en/us/support/docs/dial-access/floating-static-route/118263-technote-nexthop-00.html), [IOS Basic IP Routing](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/configuration/15-mt/iri-15-mt-book/iri-iprouting.html) |
| Source-specific reachability tests and limits of ping/traceroute | [Cisco extended ping/traceroute](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html) |
| Capture-adapter/platform prerequisites for the optional supported-device RA comparison | [Wireshark user guide](https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html) |

## Checks and limits

- Full content validator completed with **zero errors and zero warnings for Chapters 14–18**. Existing foundation warnings elsewhere concern objective tags.
- Exact ledger-union coverage and equality were checked for all 325 entries; confirmed destination IDs exist.
- A separate Node calculation performed 32 numeric/routing assertions: nine subnet ranges, original and fresh challenge destination matches, withdrawal behavior, masks, whole-triangle shortest costs including asymmetric receiving-cost change, the new VLAN challenge and storm percentages. The additional ledger-count assertion brought that check run to 33 assertions.
- Root independently read all five chapters' final practice, including every option/feedback and full labs, and ran independent batch selection/numeric checks. No unresolved technical findings remain; see `14-18-peer-review.md`.
- Every materially revised lab contains the September 2026 repeat-exercise notice. Lab progress remains positional; no application state was cleared or migrated.
- No Packet Tracer, CML or physical switch session was executed. Commands and representative/paper outputs were checked by source and configuration reasoning, not presented as captured runs. Feature availability, CEF output, SDM templates, RA captures and convergence observations remain platform-qualified. Completing a paper path does not mark a configuration objective as physically verified.
