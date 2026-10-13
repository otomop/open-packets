# Practice audit: chapters 09–23

Reviewed 20 September 2026. This batch follows the [opening practice audit](../practice-design/README.md) and implements the next fifteen numbered chapters in the local app. The [course-wide practice plan](../../PRACTICE-PLAN.md) remains the design guide; its bands are editorial recommendations, not item quotas or measured exam difficulty.

## Scope and approach

This review covers all checkpoint questions, options, answer keys and feedback; flashcards; command drills; troubleshooting tickets and their repairs; and complete lab procedures in chapters 09–23. Lesson edits are limited to consistency with the revised practice and lab-time metadata. The implementation preserves chapter and reading-section identities. Chapters 00–08 and 24–45, application code, styles and learning-state logic are protected against the baseline captured at the start of this batch.

Each existing and new practice item receives a keep, revise, retire or add decision. Same-topic identities remain stable; an unrelated replacement receives a new identity. A retirement attributed to another item names an actual destination. A second reviewer reads the final items and lab procedures independently, and the author resolves findings before integration.

The intended progression begins with accessible retrieval, develops application, and uses analysis where multiple observations or constraints justify it. Questions do not earn a higher difficulty simply by including an exhibit. Practice volume follows the distinct skills in each chapter: constructing and diagnosing routing or spanning-tree behavior warrants more work than recognizing a discovery record. Plausible alternatives and explanations matter more than making every bank the same size.

Labs distinguish supplied setup, learner predictions, observed results and independent application. Calculation and challenge solutions use closed `solution` disclosures; ordinary expected observations can remain visible guidance. Device faults have separate observation and repair stages, and recovery includes service tests. Unsupported platform behavior is labeled as a supplied interpretation exercise rather than an executed observation.

## Technical scope

The review uses Cisco's [CCNA v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), together with the primary configuration and protocol references listed in the author reports. Track differences remain explicit: for example, OSPFv3 belongs to the v2.0 objectives, while gateway-redundancy configuration supports an interpretation/concept outcome. No recalled exam questions or commercial question-bank material are used.

The networking labs are authored and reviewed procedures. This pass does not execute Packet Tracer, CML or physical devices. App checks verify content integrity, rendering and interaction; they do not establish device behavior or predict an exam result. Difficulty labels are editorial judgments, not statistically calibrated scores.

## Review records

- [09–13 author review](09-13-rework.md) and [independent review](09-13-peer-review.md)
- [14–18 author review](14-18-rework.md) and [independent review](14-18-peer-review.md)
- [19–23 author review](19-23-rework.md) and [independent review](19-23-peer-review.md)

The [baseline](baseline.json) captures the original banks, labs, lessons and file hashes. The three decision ledgers are reconciled against actual changes by [verify.mjs](verify.mjs). Selected numerical keys and topology/route-selection examples are checked independently in [network-checks.mjs](network-checks.mjs), using integer address calculations and explicit selection rules rather than copying the course explanations.

Existing study progress is retained. Lab checkmarks remain positional, so the revised labs identify this revision and tell returning learners to repeat the changed exercise. An old checkmark is not treated as evidence that a new lab step was completed.

## Completed practice

All fifteen chapters are implemented and independently reviewed. No unresolved material technical or answer-key finding remains from those reviews. The final inventory is **363 questions, 318 flashcards, 155 command drills, 31 troubleshooting tickets and 15 labs containing 160 steps**, plus their independent challenges. Before this batch, the same chapters contained 240 questions, 300 cards, 180 drills, 31 tickets and 158 lab steps. Those totals describe the result; growth was not the objective.

| Chapter | Questions | Foundations / application / analysis | Cards | Drills | Tickets | Lab steps | Estimated lab minutes |
|---|---:|---|---:|---:|---:|---:|---:|
| 09 VLANs and access ports | 21 | 4 / 16 / 1 | 19 | 11 | 2 | 10 | 50 |
| 10 802.1Q trunks | 22 | 4 / 16 / 2 | 18 | 10 | 2 | 10 | 60 |
| 11 Inter-VLAN routing | 23 | 4 / 17 / 2 | 21 | 12 | 2 | 12 | 80 |
| 12 CDP and LLDP | 17 | 6 / 10 / 1 | 17 | 12 | 2 | 9 | 45 |
| 13 EtherChannel | 23 | 8 / 13 / 2 | 22 | 9 | 2 | 9 | 75 |
| 14 Spanning tree | 26 | 6 / 15 / 5 | 22 | 10 | 2 | 9 | 70 |
| 15 STP protection | 22 | 7 / 12 / 3 | 20 | 11 | 3 | 11 | 65 |
| 16 Layer 2 security | 30 | 7 / 16 / 7 | 24 | 15 | 2 | 14 | 110 |
| 17 The routing table | 26 | 8 / 14 / 4 | 22 | 8 | 2 | 10 | 70 |
| 18 Static routing (IPv4) | 25 | 5 / 16 / 4 | 23 | 11 | 2 | 12 | 80 |
| 19 IPv6 addressing | 29 | 8 / 21 / 0 | 26 | 11 | 2 | 10 | 80 |
| 20 Static routing (IPv6) | 26 | 6 / 18 / 2 | 20 | 8 | 2 | 14 | 90 |
| 21 OSPFv2 | 30 | 6 / 18 / 6 | 26 | 14 | 2 | 9 | 95 |
| 22 OSPFv3 | 23 | 5 / 15 / 3 | 20 | 10 | 2 | 9 | 85 |
| 23 HSRP and VRRP | 20 | 5 / 14 / 1 | 18 | 3 | 2 | 12 | 75 |
| **Total** | **363** | **89 / 231 / 43** | **318** | **155** | **31** | **160** | |

The ledgers account for **943 original or new identities: 459 kept, 216 revised, 76 retired and 192 added**. Retirements remove duplicate coverage, command trivia or depth beyond the intended outcome. In particular, gateway redundancy now has three operational display drills, while IPv4/IPv6 routing and switching exercises provide more configuration, interpretation and fault-isolation practice. IPv6 addressing does not receive an artificial analysis quota: its final questions assess retrieval or direct application.

Every lab was reviewed from fresh setup through final evidence. Changes include complete bidirectional routing and return-path checks, separate failure and recovery observations, alternative evidence worksheets for unavailable features, and fresh challenge networks whose answers remain closed initially. The Layer 2 security lab is divided into four bounded modules. OSPF challenges account for outgoing costs and indirect paths; addressing exercises distinguish valid IPv6 text from canonical notation. The author reports give the detailed changes and source mapping.

## Executed verification

| Check | Result |
|---|---|
| TypeScript check | Passed |
| Existing automated application tests | 33 passed, 0 failed |
| Whole-course content validation | 0 errors; 10 existing untagged prerequisite-question warnings in chapters 00–01; no warnings in this batch |
| Exact decision and scope reconciliation | All 943 ledger decisions matched actual baseline/current content; 240 protected files unchanged |
| Actual React content rendering | 5,109 fragments passed, including options, feedback, cards, commands, tickets and complete labs |
| Independent numerical/selection checks | 100 assertions passed for selected address, routing, spanning-tree, election and cost examples |
| Production build after final peer corrections | Passed; the existing large-chunk advisory remains |
| Browser chapter views | All 75 views across Learn, Guided lab, Checkpoint, Flashcards and Command drill loaded with expected content and counts |
| Browser ticket views | All 31 tickets loaded with their expected exhibits and four options; feedback initially hidden |
| Interaction checks | Multi-answer grading, ticket diagnosis, command checking, flashcard keyboard reveal/rating, solution keyboard disclosure and lab-checkmark persistence passed |

Saved results: [content and rendering verification](verification.json), [network calculations](network-verification.json), and [browser verification](browser-verification.md). The browser checks used an isolated local production preview, preserving the learner's existing study state. All 75 chapter views had no document-level horizontal overflow at the tested viewport. Lab solution disclosures began closed. The final build was reloaded and the last three difficulty corrections, OSPFv3 alternative, OSPFv2 ticket wording and EtherChannel fallback were checked again. No browser warnings or errors were captured in that preview.

The build still reports bundles over 500 kB. This practice pass makes no performance improvement claim and does not alter bundling, colors, styles or application code. Neither the browser checks nor the arithmetic checks establish empirical simulator compatibility, learning effectiveness or an exam-pass guarantee. Chapters 24–45 remain the next practice-revision scope.
