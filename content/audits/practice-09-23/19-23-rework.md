# Practice rework: chapters 19–23

Reviewed and revised 20 September 2026 against the exact [batch baseline](baseline.json), [practice plan](../../PRACTICE-PLAN.md), [authoring guidance](../../AUTHORING.md), and [earlier breadth evaluation](../practice-design/09-25-evaluation.md). Every question, option, key, explanation, distractor explanation, card, command drill, ticket and complete lab was read. This is a practice revision; lesson section identities and ordering remain unchanged. The only semantic lesson-frontmatter change is the matching lab-time estimate.

## Final practice design

| Chapter | Questions | Levels 1 / 2 / 3 | Multi-select | Exhibits | Cards | Drills | Tickets | Guided steps | Lab minutes |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 19 IPv6 addressing | 29 | 8 / 21 / 0 | 4 | 8 | 26 | 11 | 2 | 10 | 80 |
| 20 IPv6 static routing | 26 | 6 / 18 / 2 | 3 | 17 | 20 | 8 | 2 | 14 | 90 |
| 21 OSPFv2 | 30 | 6 / 18 / 6 | 3 | 18 | 26 | 14 | 2 | 9 | 95 |
| 22 OSPFv3 | 23 | 5 / 15 / 3 | 3 | 14 | 20 | 10 | 2 | 9 | 85 |
| 23 HSRP and VRRP | 20 | 5 / 14 / 1 | 3 | 9 | 18 | 3 | 2 | 12 | 75 |

Levels are editorial reasoning categories, not measured learner difficulty. A prefix calculation, explicit configuration correction or tracking subtraction remains application even when it takes several lines. Analysis is reserved for combining distinct evidence or comparing genuinely competing paths. These distinctions intentionally produce more level-2 work than the provisional percentage suggestions. Questions progress from foundations through application to analysis, with a deliberate topic sequence inside each level. New option positions use a fixed shuffle rather than a repeating answer-position pattern. Keys were shortened where wording disclosed the answer through length; all owned chapters pass the validator without warnings.

## What changed and why

**19:** Added canonical tie handling, /56 inclusion, a /61 bit boundary, U/L-bit inversion in the opposite direction, solicited-node construction, scope, allocation capacity, independent RA fields, a small addressing repair and local-versus-transit evidence. Existing calculation questions were relabelled as application rather than recall. Replaced weak capitalization, IPv4 and imaginary EUI behavior alternatives. Narrowed objective tags: anycast and multicast questions do not claim the v2 unicast configuration objective. Cards now retrieve individual compression, prefix, lifetime and scope decisions rather than a five-number ICMPv6 catalog. The lab records the operational MAC before calculation, keeps the EUI answer closed, and adds an independent third LAN: the third /64 in `2001:db8:44:ab30::/60`, with its actual addresses, gateway and bidirectional tests derived before opening the solution.

**20:** Added non-nibble longest match, mismatched destination lengths in a supposed floating pair, recursive next-hop coverage, repeated scoped link-local addresses, probe-source-dependent return routing, unresolved next hops, precise cleanup and a missing reverse backup. Ordinary static installation is never presented as an end-to-end health monitor. Replaced the repeated directly connected forwarding ticket with new `static-routing-ipv6-t03`, which requires comparing the source and return-prefix coverage. The lab distinguishes configuration from installed routes, records evidence while faults remain, and adds a fresh service /128 with distance-25 backup. Its reverse path deliberately retains the existing distance-5 LAN backup; distances need not match across routers. A separate global-next-hop recursion comparison stays on paper.

**21:** Retained single-area neighbor, RID, broadcast and point-to-point foundations. Added actual advertised mask versus activation wildcard, explicit-cost override, zero-priority participation, asymmetric costs, equal-cost paths, missing LAN participation, route-source preference, one-way Hello evidence, DR versus data forwarding, active versus configured RID and an alternate path concealing a failed adjacency. Dropped draft additions that merely repeated old clean-election, succession or exact-address-selection items with new numbers. Cards separate election, cost and activation rules. The MTU ticket now names the interface targeted by its repair. The fresh lab challenge allocates the third /26 in `192.168.20.0/24`, adds a passive cost-5 LAN on R2, and then changes only R1's outgoing shared cost. The solution accounts for the newly cheaper indirect path to R2 through R3, not only the original client route.

**22:** Concentrated additions on the differences that matter: RID versus Interface ID versus link-local next hop, instance agreement, separate IPv4/IPv6 operation, an IPv6-only transit, a wrong global LAN plan despite Full adjacency, and directional costs. Removed a draft duplicate of the existing address-family activation question. Repeated global-forwarding drills and a fixed arithmetic card were consolidated into existing prerequisite items. The lab preserves the supported classic syntax, supplies an explicit fallback, conceals the paper syntax-translation solution, and independently allocates the fourth /64 inside `2001:db8:220:a0::/60` for a passive cost-7 R2 LAN. Its changed-cost solution also includes the indirect R1-to-R2 path through R3.

**23:** Reduced the memorization load to match description/status interpretation. Retained gateway identity, roles, timers as supplied evidence, preemption, effective priority, multiple groups and VRRP family/owner distinctions. Removed hexadecimal MAC derivation, protocol-number/state-machine minutiae and nine configuration-spelling drills; three status-inspection commands remain. Configuration remains available as supplied lab setup. Tracking and version changes are explicitly optional extensions. The fresh closed challenge uses priority 135 minus 40, a misconfigured real gateway, recovery, local tracking limits and independent VRRPv3 families. Successful role change never serves as proof of remote service health.

All five labs carry the learner-facing September 2026 revision notice. Each includes a prediction/observation sheet, complete supplied baseline setup, observation before repair, a separate recovery action, and a fresh challenge in `:::solution`. Visible expected observations remain where they help verify commands; independent answers and calculation worksheets use the closed solution container.

## Primary-source checks and scope

The [Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) were reopened. Relevant distinctions are v1 IPv6 configuration/types, static configuration/verification and OSPFv2 configuration/verification versus v2 IPv6/static troubleshooting and single-area OSPFv2/OSPFv3 configuration. FHRP is v1 description and v2 operational-status interpretation. No authentication, multiarea design, LSA-type catalog, GLBP, advanced convergence engineering or production migration project was added.

| Claims and affected practice | Primary evidence reopened during this pass |
|---|---|
| Address bits, EUI-64 U/L inversion, scopes, solicited-node construction | [RFC 4291, sections 2 and Appendix A](https://www.rfc-editor.org/rfc/rfc4291.html) |
| Canonical longest/leftmost zero-run handling | [RFC 5952, section 4](https://www.rfc-editor.org/rfc/rfc5952) |
| RA router lifetime, neighbor resolution and separate address/on-link information | [RFC 4861](https://www.rfc-editor.org/rfc/rfc4861.html), [RFC 5942](https://www.rfc-editor.org/rfc/rfc5942.html) |
| Fully specified and recursive statics; validity versus delivery | [Cisco IOS XE IPv6 Static Routing](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_ip6-route-static-xe.html) |
| IOS interface activation and passive settings | [Cisco Configuring OSPF](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/iro-cfg.html) |
| Automatic cost/reference bandwidth and explicit override | [Cisco OSPF FAQ](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/9237-9.html) |
| Election history, BDR succession and SPF path direction | [RFC 2328, sections 7.4, 9.4 and 16](https://www.rfc-editor.org/rfc/rfc2328.html) |
| MTU evidence during ExStart/Exchange | [Cisco ExStart/Exchange troubleshooting](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13684-12.html) |
| OSPFv3 link-local communication, scope and interface identity | [RFC 5340](https://www.rfc-editor.org/rfc/rfc5340.html), [Cisco IPv6 Routing with OSPFv3](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/ip6-route-ospfv3.html) |
| HSRP tracking, configured/effective priority, preemption and equal-priority limitation | [Cisco Preempt and Track](https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/13780-6.html), [Cisco HSRP configuration](https://www.cisco.com/en/US/docs/ios-xml/ios/ipapp_fhrp/configuration/15-0s/fhp-hsrp.html) |
| VRRPv3 owner priority and independent family/status semantics | [Current RFC 9568](https://www.rfc-editor.org/rfc/rfc9568) |

The original lesson source lists already contain these references. Examples, questions and calculations are original; representative output is not presented as a captured simulator run.

## Identity decisions

The complete [item ledger](19-23-decisions.json) contains **326 identities: 149 keep, 69 revise, 32 retire, 76 add**, reconciled against actual parsed baseline/current equality. Retained topic IDs are not recycled for unrelated concepts. Destination IDs identify existing, inspected practice; unspecified destinations mean a deliberate scope trim with reference/guided material retained, not a promised future item.

Published retirements are:

- `ipv6-addressing`: c12, d15.
- `static-routing-ipv6`: c04, c14, c18; d01, d02, d03, d11; t02. The unrelated return-route replacement is new t03.
- `ospfv3`: c12, c22; d01, d09.
- `fhrp-hsrp-vrrp`: q03, q12; c01, c02, c03, c10, c11, c16, c20; d01, d02, d03, d04, d05, d06, d07, d10, d11.

No baseline OSPFv2 identity was retired. Gaps among newly added numeric IDs represent discarded drafts, not reused or silently repurposed published IDs. No lesson section was retired, renamed or reordered. Lab step positions remain; existing checkmarks are not erased.

## Verification and limits

- Content validation passed with **0 errors and no warnings in 19–23**. Whole-course validation and final integration results belong to the [batch report](README.md).
- Ran a read-only, scope-limited copy of the batch verifier against the actual course loader and React renderer: **326 ledger decisions, 1,757 rendered fragments, 240 protected files**, all passed again after the independent review. It checked current/baseline equality, real destination identities, answer bounds, distractor explanations, progression, lab/lesson time agreement, complete labs, concealed challenge containers, stable section IDs and unchanged application/styles. The temporary adapter was outside the checkout and did not modify the shared verifier.
- The [independent peer review](19-23-peer-review.md) found no material technical or lab-reproducibility issue. Applied its three reasoning-label corrections (`ipv6-addressing-q24`, `static-routing-ipv6-q25`, `ospfv3-q16` to application), strengthened `ospfv3-q25` with a plausible passive-LAN diagnostic alternative, and removed a duplicated word in `ospfv2-t02`. These changes preserve keys, numerical meanings and identity counts.
- Root independently recomputed the retained/new IPv6 boundaries and EUI-64, route selection, OSPF directional paths/elections and tracking arithmetic in [network-checks.mjs](network-checks.mjs). That independent result is separate from this author's schema/render pass.
- No Packet Tracer, CML or physical-router execution is claimed. Actual MAC values, command availability, timers, client SLAAC behavior and simulator ND displays require the learner's documented observations. Classic versus address-family OSPFv3, legacy versus object HSRP tracking and unsupported VRRP remain explicitly distinguished. No server, build, deployment, UI, color or shared application change was made for this subtask.
