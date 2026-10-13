# Independent peer review: chapters 34–36

Reviewer: root integration reviewer, independently of the author of these chapters. Completed 24 September 2026.

Read every final question, option, key, explanation, distractor comment and exhibit; every card and drill; all seven tickets and their repair commands; all 29 lab steps, setup tables, troubleshooting notes and independent challenges. Compared the intended workload with the course practice-design plan and reviewed the exact decision ledger. This was a full read, not a sample. The final author verification and batch integration verification check item identities and ledger actions independently of the prose review.

## Findings resolved before closure

1. ACL ticket 1 retained explanations for distractors that were no longer present. The author rewrote feedback for the current VTY-direction, rule-order and initial-SSH alternatives.
2. ACL ticket 3 removed its existing ingress restriction before installing the corrected egress restriction. The repair now attaches and verifies the destination-boundary rule first, then removes the erroneous ingress attachment. The same order was applied to the guided lab's standard-to-extended transition.
3. The ACL counter question's correct answer was substantially longer than the alternatives. It now states the packet-count limit concisely while preserving the distinction from transactions and application delivery.
4. VPN ticket 1 retained a mismatched transport/distractor explanation. It now addresses the current UDP-port, NAT-T and inner-route alternatives.
5. VPN Step 4 simultaneously told worksheet learners to read configuration blocks and allowed them to leave those blocks closed. The required path now explicitly skips the optional implementation and continues to the supplied evidence.

No unresolved blocking findings remain in this review. Changes after the review require rechecking their affected fields; the final batch report records the verification state.

## Technical checks

ACLs: recomputed /20 and /21-sized wildcard ranges, unaligned `.77 0.0.0.31` matching `.64–.95`, /26 boundary packet decisions, source/destination port reversal, first-match ordering and safe reference replacement. Traced both interface filters, local VTY access and the challenge's client/server paths. TCP ACK/RST and DNS source-port permits are explicitly limited packet tests rather than claims of connection tracking. Same-VLAN traffic bypasses the routed attachment.

VPN: separated native ESP from UDP encapsulation, negotiation state from data protection, crypto selection from interface filtering, and inner from outer routing. The required Packet Tracer exercise establishes only underlay reachability; optional IOS XE configuration is separately scoped to the documented feature family. The remote-access /23 challenge, counter deltas, split route and application authorization diagnosis were independently calculated. A successful echo is not labeled as an unconfigured HTTP service test.

Wireless: recomputed all supplied SNR and power examples and the DHCP range. Checked every edge of the four-AP reuse problem: C=11 and D=1 satisfy the explicitly supplied neighboring pairs while A/D reuse is separately authorized by the scenario. Evidence distinguishes signal level, SNR, PHY rate, application throughput, association, key establishment and valid addressing. No simulated drawing is treated as a measured site survey. The optional security refresher remains subordinate to chapter 38's fuller exercise.

The executable `verify-calculations.mjs` records the independent numerical and ordered-policy checks for these chapters and the final integration chapters. It is a mathematical check of the authored cases, not a Cisco emulator or physical RF test.

Fresh primary references consulted during peer review:

- [Cisco ACL configuration](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html) and [common ACL examples](https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html).
- [Cisco crypto-map/IKEv2 example on ISR 4351 / IOS XE 16.12](https://www.cisco.com/c/en/us/support/docs/security-vpn/ipsec-negotiation-ike-protocols/214728-configure-multi-sa-virtual-tunnel-interf.html).
- [RFC 4303 ESP](https://www.rfc-editor.org/rfc/rfc4303.html) and [RFC 3948 UDP encapsulation](https://www.rfc-editor.org/rfc/rfc3948.html).
- [Cisco wireless RF reference](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wireless-rf-reference-guide.html).
- Current [v1.1](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and announced [v2.0](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) objective verbs.

No live networking device or RF execution was performed by this reviewer. The app's rendered fields and disclosure behavior are verified separately in the final batch checks.
