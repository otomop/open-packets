# Practice review: chapters 09–13

Reviewed against the September 20, 2026 baseline in this directory. This pass changes practice design and assessment quality, not the visual design or the course's lesson structure. Every original and current question, option, key, distractor explanation, card, command drill and ticket was read. The full guided labs and challenge solutions were checked as sequences.

## Final inventory and demand

| Chapter | Questions | Level 1 / 2 / 3 | Cards | Drills | Tickets | Lab steps | Lab minutes |
|---|---:|---|---:|---:|---:|---:|---:|
| 09 VLANs and access ports | 21 | 4 / 16 / 1 | 19 | 11 | 2 | 10 | 50 |
| 10 Trunks and DTP | 22 | 4 / 16 / 2 | 18 | 10 | 2 | 10 | 60 |
| 11 Inter-VLAN routing | 23 | 4 / 17 / 2 | 21 | 12 | 2 | 12 | 80 |
| 12 CDP and LLDP | 17 | 6 / 10 / 1 | 17 | 12 | 2 | 9 | 45 |
| 13 EtherChannel | 23 | 8 / 13 / 2 | 22 | 9 | 2 | 9 | 75 |
| **Total** | **106** | **26 / 72 / 8** | **97** | **54** | **10** | **50** | **310** |

The planning bands were used as editorial guidance. Chapters 11 and 13 stop below their proposed question bands because another address-placement or flag-reading item would repeat an existing decision. Chapter 09 has fewer cards than the band after removing a power catalogue and memorized worked answers. No analysis quota was imposed: an explicit missing VLAN, administrative shutdown, or known address-plan mismatch is usually application, not a difficult diagnosis merely because it has an exhibit.

Checkpoint order runs from foundations to application to analysis. Single-answer positions are balanced within one item in every chapter: 09 4/5/5/4; 10 5/5/4/4; 11 5/5/5/5; 12 3/4/4/4; 13 5/5/4/4. The source order is not a repeating position cycle. Correct-answer length warnings were resolved by concise wording rather than padding wrong choices. All answer-index changes were paired with the corresponding feedback changes.

## Chapter decisions and practical progression

### 09 — VLANs and access ports

Retained the useful VLAN membership, default VLAN, deletion, voice/data separation and PoE decisions. Added endpoint selection from an explicit untagged requirement, recognition of dynamically negotiated versus fixed access mode, separate phone addressing checks, restoration of PoE administration, and a constrained choice that requires both sufficient per-port capability and shared power.

The lab retains its simple switch and PC setup. Learners predict same-VLAN and different-VLAN behavior, verify actual membership, observe VLAN deletion before restoring it, and then observe wrong-port membership before a separate repair. Voice configuration is explicitly a switch-side check; it does not claim a registered phone service. The PoE worksheet supplies the applicable PSE allocations instead of requiring a table of PD and PSE ratings from memory. Its calculation is 370 − 6×10.5 − 10×30 = 7 W remaining.

The independent PC-D addition changes the port and endpoint requirement. Its answer is closed under a solution disclosure. Legacy reserved-VLAN lists, one milliwatt conversion and duplicate VLAN-creation recall were removed from required practice while the lesson's scoped reference remains.

### 10 — Trunks and DTP

Static 802.1Q configuration stays central. DTP questions assess recognition of compatible or incompatible modes; they do not imply that every AP, router, virtual host or firewall negotiates DTP. Additional cases compare effective VLAN eligibility at both ends, distinguish permitted/active/forwarding states, identify a shut configured trunk, and combine a new endpoint's wrong access membership with a far-end omitted VLAN.

Learners predict which links carry tagged versus untagged frames, prove both existing same-VLAN pairs, remove one allowed VLAN, and restore it with an additive command. The native-VLAN mismatch is a configuration and classification exercise; no particular simulator warning or ping failure is promised. Its repair remains separate.

The disconnected AP port is partially guided: learners write the mode, native VLAN, allowed list and DTP setting before opening the reference. It is explicitly configuration inspection, not a simulated FlexConnect deployment. The challenge adds a new pair and VLAN over the existing trunk while preserving prior services. Duplicate access-mode practice and a broad allow-all restoration drill were removed.

### 11 — Inter-VLAN routing

Preserved both complete, separately saved topologies: a 2911/2960 router-on-a-stick build and a 3650 SVI build. Added practice on the common parent-link dependency, a forwarding trunk as an SVI autostate member, missing host gateway, the evidence limit of a local SVI reply, a constrained router-on-a-stick choice, a combined wrong-tag/wrong-host-gateway rollout, and the return-path difference between a router's link address and a host source.

The packet walk now starts with a prediction of destination MAC and destination IP on both sides of R1. Where packet fields cannot be inspected, a labeled role-based worksheet substitutes for capture evidence. The Part B host-mode stage explicitly runs the four tests before enabling forwarding. Removing the only eligible VLAN 20 member is predicted, observed, and separately restored. The routed-port test is limited to its directly connected peer; the lab explains why that is not proof of a PC-to-R2 return path.

The changed VLAN 30 challenge requires the learner to select the Layer 2, SVI and host changes before opening the answer. No static-route configuration mastery is assumed before Chapter 18. All prior lesson section identities and content remain intact.

### 12 — CDP and LLDP

Reduced timer and code memorization. Kept one scoped CDP default-pair question and actual timer inspection, while removing the LLDP three-number/reinitialization question and redundant cards. Retired a duplicate port-reading question in favor of the stronger two-ended documentation ticket. Retired the original direction-pair question because the new disabled-state repair applies exactly that relationship.

New practice addresses a common protocol under an explicit policy, a host with no discovery agent, conflicting records after maintenance, and the correct sender/receiver repairs. Ticket alternatives now represent realistic column confusion, partial LLDP enablement, inappropriate cache clearing or wrong configuration scope.

The lab begins with predicted rows, collects both ends, corrects a deliberately wrong map, and tests management reachability separately. One-way LLDP learning is predicted before disabling transmission and restored before saving. Unsupported LLDP remains a labeled supplied-evidence workflow. The independent cable move includes a complete reference configuration and requires fresh observations and management retests.

### 13 — EtherChannel

Expanded LACP practice to distinguish formation, the number of participating members, and the actual VLAN or IP service. Added surviving-member capacity, a far-end omitted VLAN despite healthy formation, mismatched independent partner systems, routed peer-subnet correction, adding a routed member, negotiation versus data forwarding, two separate rollout defects, and independent outbound hash selection.

Cards now use shorter cues for the logical interface, P member flag, partner command, hash inspection and VLAN consistency. New cards cover a common partner system, independent outbound selection, and the limit of RU as IP-service evidence. PAgP and static aggregation remain useful comparisons; their configuration drills were removed. The optional global hash-setting command is still a lesson reference but is not a required checkpoint or drill.

The two complete LACP builds remain. Learners predict logical/member/service results before verification, distinguish a physical member failure from passive/passive negotiation failure, and keep asymmetric static/LACP work on paper. Recovery and save prompts are separate. The routed build now enables both ends before testing, and provides a supplied-evidence worksheet if the simulator cannot configure Layer 3 EtherChannel. Its third-member challenge is independent and has a closed answer; the unsupported-platform path explicitly continues as a both-end configuration and predicted-evidence worksheet. Capacity statements are link-rate calculations, not throughput measurements.

## Source and scope checks

The official blueprints were reopened for this pass: [current CCNA v1.1](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced CCNA v2.0](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf). The practice follows VLAN/inter-VLAN, trunks, discovery and LACP configuration/verification depth; endpoint choices use the actual stated tagging, power and teaming requirements. No metadata claim was added to manufacture coverage. The previously verified exam transition remains v1.1 through February 2, 2027 and v2.0 from February 3, 2027.

| Primary reference checked | Claims used in this review |
|---|---|
| [Cisco current VLAN guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/vlan/vlan-configuration-guide/configure-vlan.html) | VLAN membership and deletion leave a separate interface assignment; local database and port configuration require separate verification. |
| [Cisco 2960 voice VLAN guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvoip.html) | Access/data and voice behavior are distinct; a configured voice VLAN does not establish complete phone provisioning. |
| [Cisco UPOE+ explanation](https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/nb-06-upoe-plus-it-ot-wp-cte-en.html) | PSE and PD power are measured at different ends; compare requirements with the appropriate rating. |
| [Cisco 3560 interface guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_2_se/configuration/guide/scg3560/swint.html) | Power administration, physical routed ports, SVI purpose and ordinary autostate prerequisites. Access or trunk forwarding membership can count. Platform-specific overrides are not silently assumed. |
| [Cisco 2960 VLAN guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvlan.html) and [Catalyst 9300 trunk guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/vlan/b_1712_vlan_9300_cg/configuring_vlan_trunks.html) | Explicit static trunk configuration, allowed/native VLAN behavior and manual configuration of a non-DTP peer. Local configuration is not proof of the remote state. |
| [Cisco 802.1Q explanation](https://www.cisco.com/c/en/us/support/docs/lan-switching/8021q/17056-741-4.html) | The ordinary four-byte tag increase in the stated frame-size calculation. Obsolete field terminology and minimum-frame claims from the older document are not introduced as new requirements. |
| [Cisco FlexConnect guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/flexconnect.html) | A locally switched AP design requires compatible native/tagged VLAN treatment. The supplied lab contract is narrower than a complete wireless deployment. |
| [Cisco external-router inter-VLAN example](https://www.cisco.com/c/en/us/support/docs/lan-switching/inter-vlan-routing/14976-50.html) | Parent/subinterface roles, VLAN encapsulation, gateway addressing and static switch trunk. The chapter supplies its own consistent models and addresses. |
| [Cisco 2960 management-address guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swipaddr.html) | Host-mode management gateway is separate from routing between SVIs. |
| [Cisco CDP guide](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/cdp/configuration/15-mt/cdp-15-mt-book/nm-cdp-discover.html) | Layer 2 discovery, global/interface controls, sender timers and advertised fields. An address advertisement does not perform an IP reachability test. |
| [Cisco 2960 LLDP guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/m_1522e_int_lldp_2960s_cg.html) | Independent transmit/receive controls, scoped timers, neighbor information and media endpoint network policy. |
| [Cisco 3560 EtherChannel guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swethchl.html) | Logical and member configuration, Layer 3 creation order, compatible member properties, surviving-member behavior. |
| [Cisco 9300 IOS XE 17.17 EtherChannel guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-17/configuration_guide/lyr2/b_1717_lyr2_9300_cg/configuring_etherchannels.html) and [Cisco load balancing explanation](https://www.cisco.com/c/en/us/support/docs/lan-switching/etherchannel/12023-4.html) | Current LACP scope and platform-dependent standalone behavior; selected hash inputs and separate one-flow versus aggregate capacity. |

## Identity and progress compatibility

Chapter IDs, numbering, prerequisites, objective tags and every lesson H2 section identity are preserved. The reproducible check compares full parsed lesson sections to the baseline, not merely the heading count. Lesson edits are limited to lab-time metadata. Existing questions/cards retain their identities when the assessed concept remains the same; new outcomes use previously unused IDs.

The decision ledger reconciles every old/current identity against exact parsed-object equality: **292 decisions, 167 keep, 58 revise, 25 retire, 42 add**. Reordering a bank alone does not turn an unchanged item into a revision. New items do not inherit unrelated mastery or spaced-repetition history. No stored progress is cleared.

Lab steps still use positional identities. All five labs explain that previously completed exercises should be repeated and their checkmarks updated; content-only work does not claim to migrate old positional progress.

### Explicit retired-ID allowlist

- Chapter 09: `vlans-and-access-ports-q02`, `vlans-and-access-ports-q16`, `vlans-and-access-ports-c02`, `vlans-and-access-ports-c06`, `vlans-and-access-ports-c13`, `vlans-and-access-ports-c17`, `vlans-and-access-ports-d09`, `vlans-and-access-ports-d13`.
- Chapter 10: `trunks-dtp-c03`, `trunks-dtp-c05`, `trunks-dtp-c13`, `trunks-dtp-d09`, `trunks-dtp-d12`.
- Chapter 11: none.
- Chapter 12: `cdp-lldp-q03`, `cdp-lldp-q05`, `cdp-lldp-q07`, `cdp-lldp-c02`, `cdp-lldp-c04`, `cdp-lldp-c10`, `cdp-lldp-c13`.
- Chapter 13: `etherchannel-q11`, `etherchannel-c05`, `etherchannel-d03`, `etherchannel-d04`, `etherchannel-d08`.

The ledger records a specific reason for each retirement. Confirmed replacement coverage is named only where an actual item exists: `cdp-lldp-q05` → `cdp-lldp-q23`; `cdp-lldp-q07` → `cdp-lldp-q01`; `trunks-dtp-d12` → `vlans-and-access-ports-d03`. These are deduplications, not claims that a future unauthored chapter will fill a gap.

## Verification and remaining limits

- `node scripts/validate-content.mjs` passes with no chapter 09–13 warnings. Remaining course warnings are the existing untagged foundations questions.
- `node content/audits/practice-09-23/09-13-verify.mjs` checks exact ledger coverage, action/equality consistency, real destination IDs, complete wrong-option feedback, question order, preserved lesson sections, lab-time agreement and solution containers.
- The same script rendered **1,587 fragments** through the actual React Markdown component, including all bank content, IOS examples and labs. It found **nine closed solution disclosures**, no raw unparsed solution/expected markers and no pre-opened answer disclosure.
- Independent arithmetic checks include the PoE budget, ordinary frame-size increase, /30 boundaries and three-member FastEthernet capacity. These complement the parent's wider network checks.
- The author checked command modes, per-device targeting, setup dependencies, fault-before-recovery ordering, prompts and the challenge answer for each lab. No Packet Tracer, CML, switch, router, AP or phone execution took place in this pass. Simulator outcomes remain representative or explicitly supplied evidence.
- This is an editorial demand classification, not calibrated exam difficulty or a guarantee of passing. Rendering is a structural check, not a replacement for the parent's browser QA.

The switching/routing reviewer independently read every practice bank and full lab in all five chapters. The sole requested refinement, Chapter 09 q22's application-level classification, is applied. The reviewer reported no additional material technical or lab findings; its separate peer report records source spot checks and limits. Primary source spot checks also agree. The reviewer approved the final clarification extending the routed-EtherChannel worksheet fallback to the third-member challenge. No unresolved material findings remain.
