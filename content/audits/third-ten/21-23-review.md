# Chapters 21–23 technical and teaching review

Reviewed 20 September 2026. Scope: all six assets in each of `21-ospfv2`, `22-ospfv3`, and `23-fhrp-hsrp-vrrp`. No application code, styles, other chapters, dependencies, or build output were changed.

## Result and scope decisions

All three lessons and their labs, questions, explanations, distractor explanations, flashcards, command drills, and tickets were rewritten as one coordinated set. The lessons explain a mechanism, work through evidence, configure where appropriate, and then verify a complete client path. They do not claim exam questions are authentic or promise a pass.

The [v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) requires single-area OSPFv2 configuration/verification and FHRP purpose/functions/concepts. The [v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) adds IPv6 OSPFv3 under 3.3, explicitly excludes adjacency authentication, and asks for HSRP/VRRP status interpretation under 3.4. Those verbs govern the depth.

- **21:** Keeps neighbor formation, router/process identity, point-to-point versus broadcast, DR/BDR history, cost, interface activation, passive LANs, and verification. Removes the external-default-origination exercise and associated assessment content from the core single-area sequence.
- **22:** Keeps IPv6 packet/next-hop identity, explicit 32-bit RIDs, instance compatibility, core syntax families, elections, cost, prefix activation, and verification. Detailed LSA type-number recall and multi-area material are reduced to a brief explanation of topology/prefix separation. The primary build uses classic syntax; address-family syntax is presented separately and translated on paper rather than blindly migrated into the working lab.
- **23:** Gives concepts for v1.1 and status interpretation for v2.0. HSRP configuration, tracking, and optional timers are explicitly guided practice. Removes GLBP's ports, detailed roles/MAC encoding, and recall questions. Adds precise IPv4/IPv6 VRRPv3 status distinctions without inventing an IPv6 configuration objective.

| Chapter | Lesson words, loader | Prose words excluding fences | H2 sections | Lab steps | Questions / multi / exhibits | Cards / drills / tickets |
|---|---:|---:|---:|---:|---|---|
| 21 | 2,270 | 2,080 | 8 | 9 | 16 / 2 / 8 | 20 / 12 / 2 |
| 22 | 2,096 | 1,797 | 8 | 9 | 16 / 2 / 7 | 20 / 12 / 2 |
| 23 | 2,395 | 2,030 | 8 | 12 | 16 / 2 / 5 | 20 / 12 / 2 |

Word counts are approximate editorial measures, not an assertion that length establishes completeness.

## Corrected claims and primary evidence

| Claim or correction | Evidence reviewed |
|---|---|
| Neighbors, synchronized LSDB, SPF candidates, and installed routes are different evidence. Full is not proof that every desired LAN route is installed. | [RFC 2328](https://www.rfc-editor.org/rfc/rfc2328.html), especially adjacency, LSDB, and route calculation sections; [Cisco configuring OSPF](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/iro-cfg.html). |
| DR/BDR election is per segment, prefers eligible priority then RID, preserves existing roles, and promotes a surviving BDR on DR failure. A two-DROTHER 2-Way relationship is normal. | RFC 2328 sections 7.3–7.5, 9.4, and 10.4; [Cisco neighbor states](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13685-13.html). |
| IOS default broadcast/P2P timers are 10/40. The documented default dead relationship is not an invariant overriding explicit timer settings. Both effective values should be inspected. | [Cisco OSPF command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/m_ospf-a1.html), ip ospf dead-interval; [Cisco fast-Hello prerequisites and timer description](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/iro-fast-hello.html). Question 21-q07 now gives an explicit dead interval, avoiding unspecified-platform behavior. |
| Explicit RID overrides automatic selection; loopback preference precedes physical-address comparison. Process ID is local, and restarting one router does not erase surviving segment election history. | Cisco configuring OSPF and [Cisco duplicate RID troubleshooting](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/23862-duplicate-router-id-ospf.html). 21-q02 was simplified to two up loopbacks rather than assessing a shut-loopback corner case without platform-specific evidence. |
| Cost is outgoing path cost, distinct from AD and DR priority; reference bandwidth is expressed in Mbps on IOS. Platform-specific ECMP maxima are not taught as universal defaults. | [Cisco OSPF FAQ](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/9237-9.html), Cisco cost/reference-bandwidth command reference, RFC 2328 shortest-path calculation. |
| ExStart/Exchange can indicate an MTU mismatch but is not a unique diagnosis. An MTU bypass is not the routine first repair. | [Cisco ExStart/Exchange troubleshooting](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13684-12.html), [Cisco MTU and LSA packing](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/116119-technote-ospf-mtu-00.html). Tickets provide actual mismatched values and a stated supported MTU. |
| OSPFv3 uses link-local neighbor sources, 32-bit RIDs, scoped next hops, and topology/prefix separation; matching global prefixes are not a Hello requirement. Loopback-state addresses are represented as /128 host prefixes. | [RFC 5340](https://www.rfc-editor.org/rfc/rfc5340.html), including section 4.4.3.9 for loopback-state prefix representation; [Cisco classic OSPFv3](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/ip6-route-ospfv3.html). |
| Local process ID differs from the on-link instance ID. OSPFv3 supports address-family extensions, and IPv6 unicast instance 0 is the default in the classic scenario. | [RFC 5838](https://www.rfc-editor.org/info/rfc5838), especially 2.1; [Cisco IOS XE 17 OSPFv3](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_ip6-route-ospfv3-xe.html). |
| OSPFv3 neighbor Interface ID belongs to the neighbor; the last Interface column is local. | [Cisco show ipv6 ospf command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6/command/ipv6-cr-book/ipv6-s4.html). The old source pointed at the unrelated s3 subsection; corrected to s4. |
| Speak also sends HSRP Hellos. States are not a mandatory linear progression. Silent failure uses hold-timer expiry from accepted Hellos, not exactly three missed packets. | [RFC 2281](https://www.rfc-editor.org/rfc/rfc2281.html), sections 5.3–5.4. Fixed lesson, cards, and assessment reasoning consistently. Removed fixed gratuitous-ARP count and exact application-failover promises. |
| HSRP election tie breaking is distinct from preemption: equal-priority/higher-IP arrival does not preempt merely for that address. A tracking decrement must create the intended effective-priority advantage, and the receiving peer needs preempt for this live-router takeover. | [Cisco HSRP configuration](https://www.cisco.com/en/US/docs/ios-xml/ios/ipapp_fhrp/configuration/15-0s/fhp-hsrp.html), HSRP preemption section; [Cisco preempt and track](https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/13780-6.html); [Cisco HSRP FAQ](https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/9281-3.html). |
| Ordinary HSRP failover retains the virtual identity but changes its learned switch port. A host cache can refresh normally; it is not literally immutable. Matching versions/groups matter to peer recognition. | [Cisco HSRP functionality](https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/9234-hsrpguidetoc.html), RFC 2281. Both-Active does not by itself prove different MACs; the version-mismatch ticket supplies the two version-specific patterns. |
| VRRPv2 is IPv4; v3 supports IPv4 and IPv6 independently. Current standard is RFC 9568, with Active terminology; older Cisco output commonly says Master. Priority 255 denotes ownership; protocol priority 0 relinquishes; IPv6 uses ND and a different virtual MAC block. | [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568), especially sections 1, 5, 6, and 7.3; [Cisco VRRPv3 support/status examples](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ntw-servs/b-network-services/m_fhrp-vrrpv3-xe.html); [Cisco classic VRRP](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipapp_fhrp/configuration/15-mt/fhp-15-mt-book/fhp-vrrp.html). |

The old OSPF Design Guide link redirected to a general technology index and was removed as evidence. Sources are primary Cisco/RFC references; current command forms are qualified by software family. Old IOS documentation is used for classic syntax, not presented as a guarantee of universal simulator support.

## Lab consistency and arithmetic

21 and 22 use three 2911 routers, a 2960 shared transit, an independent R1–R3 link, and client LANs on Gi0/2. Address/interface/cable tables and per-device configurations are complete. The shared link is intentionally held down during setup; R1 becomes DR before R2 is started, and R2 is confirmed BDR before R3 joins. This avoids pretending that typing configurations sequentially creates a simultaneous cold election.

Both OSPF labs set explicit costs: shared outgoing 10, direct outgoing 25, remote LAN 1. Normal client route cost is 11, direct backup 26. The directed-graph check independently confirmed 11 in both directions, 26 after shared-path removal, and an asymmetric 26/11 after changing only R1's shared outgoing cost. IP/subnet/gateway arithmetic was separately checked.

The FHRP lab supplies real addresses, a distinct VIP, static host settings, and OSPF return routes. R3's preferred return path costs 10 + 1 = 11; the R2 alternative costs 20 + 1 = 21. Tracking examples independently calculate 110−5=105, 110−10=100, and 110−20=90. Only the last gives R2 priority 100 a strict advantage. Fault observation and exact restoration are separate steps.

23 includes feature discovery and alternate tracking syntax, with a paper fallback if neither form exists on the simulator image. IPv4/IPv6 VRRP is explicitly a paper status exercise. Interface-range prompts were corrected to `config-if-range` in all three switch builds. Chapter references were checked against current folder numbering: routing table is 17, IPv6 addressing 19, OSPFv2 21, OSPFv3 22.

## Identity and progression preservation

Chapter IDs and numbers remain unchanged. Chapter 23's display title is now “HSRP and VRRP.” All prerequisites resolve to earlier chapters; `static-routing-ipv4` and `ospfv2` were added to 23 because its complete routed lab uses those concepts.

The renamed same-topic H2 sections have actual `sectionIds` mappings in frontmatter, checked through the course loader. The old 22 `lsas-where-the-prefixes-went` section is retired; its brief conceptual explanation is integrated into “What changes from OSPFv2.” The new `cost-and-advertised-prefixes` section has a new identity instead of inheriting completion from an unrelated LSA catalogue. Old introductory paragraphs were integrated into the first teaching section rather than kept as separate empty-introduction progress entries.

| Chapter | Retired assessment IDs | New IDs |
|---|---|---|
| 21 | `ospfv2-q09`, `ospfv2-c19`, `ospfv2-d10`: default-origination material | `ospfv2-q16` (route fields), `ospfv2-q17` (passive LAN behavior), `ospfv2-c21` (route fields), `ospfv2-d13` (installed route verification) |
| 22 | `ospfv3-q10`, `ospfv3-c13`, `ospfv3-c14`: detailed LSA types; `ospfv3-d13`: broad process restart drill | `ospfv3-q16` (missing LAN activation), `ospfv3-q17` (cost/next hop), `ospfv3-c21` (passive activation), `ospfv3-c22` (cost) |
| 23 | `fhrp-hsrp-vrrp-q13`, `fhrp-hsrp-vrrp-c14`: GLBP recall | `fhrp-hsrp-vrrp-q16` (IPv4/IPv6 status), `fhrp-hsrp-vrrp-q17` (equal-priority preemption distinction), `fhrp-hsrp-vrrp-c21` (VRRP family/version distinction) |

All other assessment IDs retain their existing subject while wording, evidence, answer placement, or incorrect claims were corrected. Labs were materially rebuilt and expanded to 9/9/12 ordered steps. Their generated step numbers remain ordinal identities; no stored user history was edited. A learner revisiting a previously completed older lab should repeat the revised experiment rather than treat old checkmarks as evidence of executing new steps.

## Verification and limits

- Ran `node scripts/validate-content.mjs` after rewriting and peer-review fixes: **0 errors and 90 whole-course warnings at this snapshot, none in chapters 21–23**. Other authors were editing concurrently; the whole-course warning total is not a stable release result.
- Loaded current course metadata to verify stable section mappings, earlier-only prerequisites, asset counts, additions, and retirements against `third-ten/baseline.json`.
- Checked all JSON IDs, answer bounds and complete distractor-explanation coverage; reviewed question reasoning and balanced single-answer placements. Each chapter has two multi-answer questions and at least four exhibits.
- Checked balanced parsed diagrams/containers/fences, IOS prompt presence, interface names and modes, host addressing, explicit costs, fault/restoration symmetry, and source/reference consistency.
- Scanned owned files for VERIFY placeholders, replacement characters, and common mojibake; none remained.
- Incorporated root peer-review corrections to numeric chapter references, interface-range prompts, ticket interface labeling, and the RID-selection question. Natural possessives were corrected in the banks.

No Packet Tracer, CML, or physical Cisco lab was manually executed. No representative output is claimed as captured execution evidence. Static checks cannot establish image feature support, CLI parser acceptance, convergence timing, or application behavior on hardware. Those limits are stated where they affect the learner. No full build or browser tests were run by this content subtask.
