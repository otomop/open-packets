# Chapters 16–25 content audit

Completed 20 September 2026 in the local `ccna guide` project. This batch follows the completed reviews of chapters 00–15. Every lesson, guided lab, checkpoint question, wrong-option explanation, flashcard, command drill and troubleshooting ticket in chapters 16–25 was reviewed and rewritten. Chapters 26–45 still need their detailed content reviews.

The work changes teaching content and course metadata. It does not change application styling or colors. No hosting deployment, Git commit or push was performed.

## Revised material

| Chapter | Topic | Guided lab steps | Questions | Cards | Drills | Tickets |
|---|---|---:|---:|---:|---:|---:|
| 16 | Layer 2 security | 12 | 16 | 20 | 14 | 2 |
| 17 | The routing table | 10 | 16 | 20 | 12 | 2 |
| 18 | Static routing (IPv4) | 12 | 16 | 20 | 12 | 2 |
| 19 | IPv6 addressing | 10 | 16 | 20 | 12 | 2 |
| 20 | Static routing (IPv6) | 14 | 16 | 20 | 12 | 2 |
| 21 | OSPFv2 | 9 | 16 | 20 | 12 | 2 |
| 22 | OSPFv3 | 9 | 16 | 20 | 12 | 2 |
| 23 | HSRP and VRRP | 12 | 16 | 20 | 12 | 2 |
| 24 | DHCP | 10 | 16 | 20 | 12 | 2 |
| 25 | DNS | 10 | 16 | 20 | 10 | 2 |
| **Total** | **10 chapters** | **108** | **160** | **200** | **120** | **20** |

Each checkpoint includes at least two multiple-answer questions, four questions with exhibits, and an explanation for every incorrect option. Lesson text totals approximately 23,600 words, including worked examples and command blocks; this is a size measure, not a completeness or quality score.

## Scope and structure

Required teaching depth was checked against the official [CCNA v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [CCNA v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf). Lessons distinguish each track's exam verbs. In particular, OSPFv3 is explicit v2.0 material; FHRP configuration exercises support understanding without presenting full configuration as the required interpretation objective. RA Guard and storm control have explicit v2.0 coverage. DNS includes diagnosis of all six named record types.

The existing prerequisite sequence across all 46 chapters remains sound after these corrections:

- Chapter 17 establishes route selection before chapter 18 asks the learner to configure static routes. Its lab now uses a supplied static baseline and worksheets; it no longer requires configuring OSPF before chapter 21.
- Chapter 19 establishes IPv6 addressing before IPv6 static routes and OSPFv3. Chapter 22 refers back to the correct IPv6 chapter and concentrates on the differences from OSPFv2. Detailed LSA classification was reduced and its useful context merged into the protocol comparison.
- Chapter 23 is titled **HSRP and VRRP**. Its prerequisites explicitly include chapters 11, 18 and 21 to support the switching, static-routing and OSPF evidence used in the exercises.
- Chapter 24 requires chapters 11 and 18 for relay placement and return routing. Chapter 25 requires chapters 06 and 24 for transport and client configuration. DHCP snooping policy remains in chapter 16; DHCP operation and relay troubleshooting belong in chapter 24.
- Sections generally progress from purpose and behavior to configuration, verification, fault diagnosis and exam focus. Fault injection and restoration are separate lab steps where combining them could hide the observation being taught.

Chapter IDs and numbers are unchanged. Renamed same-topic teaching sections preserve their original identities through frontmatter mappings. The intentionally merged OSPFv3 LSA section and retired assessment IDs are documented in the individual reports. Old assessment IDs are not reassigned to unrelated new questions.

## Technical corrections and evidence

| Review | Principal corrections |
|---|---|
| [Chapters 16–17](16-17-review.md) | Ingress-based DHCP trust, Option 82 distinctions, DAI ACL fallback, port-security platform limits, RA Guard prerequisites and observation, route selection versus forwarding, longest prefix match, scoped defaults and ECMP interpretation. |
| [Chapters 18–20](18-20-review.md) | Recursive and fully specified static routes, return paths, floating routes and failure limits, IPv6 compression/prefix arithmetic, address scope, ND/SLAAC, link-local next-hop interface requirements, and IPv6 forwarding. |
| [Chapters 21–23](21-23-review.md) | OSPF router identities, neighbor and adjacency requirements, broadcast and point-to-point behavior, nonpreemptive DR elections, cost interpretation, OSPFv3 syntax families, HSRP/VRRP roles, tracking and failure scope. |
| [Chapters 24–25](24-25-review.md) | Conditional DHCP reply delivery, renewal/rebinding, relay fields and pool capacity, fresh-client fault tests, DNS alias/mail/delegation dependencies, negative caching, TCP support and router lookup controls. |

Cisco configuration guides and command references, relevant IETF RFCs, and official tool documentation support the technical claims. Source links are available in each lesson and mapped to corrections in the reports above. Outputs and worksheet scenarios are original representative teaching examples, not captures presented as actual lab runs.

All ten chapters received a second technical reading. Independent checks covered non-octet IPv4 ranges and longest matches, IPv6 prefix arithmetic, DHCP exclusions and lease capacity, DNS lifetime calculations, answer indices, distractor coverage, interface names and fault recovery. Peer findings were resolved, including the chapter 17 distinction between an eligible candidate and the selected route, the chapter 19 /60 retained-bit explanation, and missing lab fallback or verification instructions.

## Verification

- The full application suite passed **32 of 32 tests**; TypeScript checking passed.
- The final production build passed. The content validator reported **zero errors and no warnings in chapters 16–25**.
- `node content/audits/third-ten/verify.mjs` passed **2,586 actual React-rendered fragments**. It checks lesson/lab/assessment rendering, diagrams, required assessment counts, answer bounds and explanations, unresolved placeholders, chapter links, prerequisite order and retained teaching-section identities against the pre-edit baseline.
- Browser checks on a separate local testing origin opened **all 50 study views** and **all 20 ticket details**. Each chapter showed its lesson, lab, 16-question checkpoint, card deck and command drill. All ticket exhibits and answer options rendered. No document-width overflow was detected at the tested desktop viewport.
- Interactive browser checks passed for checkpoint reasoning, ticket diagnosis and repair feedback, card reveal/grading, accepted command input, lab completion checkmarks, and copying executable commands without device prompts. Test interactions used separate browser progress from the normal local study origin.
- Representative visual checks covered the guided lab layout and teaching material. This is content/rendering QA, not a new performance benchmark or exhaustive device-accessibility audit.

The full validator still has **81 warnings outside this batch**: 19 missing objective tags in setup/model questions in chapters 00–01 and 62 unresolved verification notes in chapters 26–45. The build also retains large-bundle advisories for the main and practice bundles. These are recorded rather than treated as resolved by this content review.

## Practical limits and saved progress

No Packet Tracer, CML or physical Cisco device execution was performed. Labs name their intended equipment, supply setup and recovery steps, and separate worksheets or platform-dependent extensions from the main exercise. RA Guard, VRRP and some command variants require a supporting platform; a parser rejection in a simulator is not proof that the documented networking behavior is wrong.

The rewritten labs materially change some positional steps. Existing checkmarks do not certify completion of the revised exercises; repeat a changed lab from its stated baseline. No learner progress was cleared or migrated. A documented content review also cannot guarantee an exam result or establish that an exam will contain a particular question.

The next unaudited batch starts at **chapter 26, NAT and PAT**.
