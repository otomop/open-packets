# Practice audit: chapters 34–45

Completed 24 September 2026. This final batch covers ACLs, VPNs, wireless principles and architecture, WLAN security, virtualization, network management and SDN, REST/JSON, Ansible/Terraform, AI, the integrated branch capstone and exam readiness. Together with the preceding batches, the practice audit now covers all 46 chapters, including orientation 00.

## Review method

Read every checkpoint prompt, exhibit, option, key and feedback entry; every flashcard and command drill; every troubleshooting case and repair; and each complete lab from preparation through its independent challenge. Lesson context establishes prerequisites and depth. The [practice plan](../../PRACTICE-PLAN.md) guides workload without imposing equal item counts. Difficulty labels describe the reasoning demanded by an item, not statistically measured exam difficulty.

Each range received an independent second review. Findings were corrected and reread before integration. The four decision ledgers record every baseline/current bank identity exactly once, including unchanged material that was reviewed and retained. New subjects receive new identities; retired IDs are not recycled.

Labs distinguish supplied setup, predictions, actual observations, authored evidence and optional extensions. Relevant failures and repairs have separate stages. Independent challenges and worked interpretations use closed solution disclosures. Revision notices tell returning learners to repeat changed exercises because older positional checkmarks do not establish completion of revised work. Existing study progress is preserved.

## Sources and depth

The authors and reviewers reopened Cisco's [v1.1 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), then checked the relevant Cisco configuration references, RFCs and official Python, Ansible and HashiCorp documentation. The linked author and peer reports identify the claims, sources and any inaccessible documentation endpoints for which maintained official source code was used instead.

Configuration recall follows the applicable objective verb. For example, advanced IPsec implementation, controller product internals, VRF construction and Terraform lifecycle commands are not inflated into universal CCNA memorization requirements. Ansible practice distinguishes syntax checking, host selection and actual remote command collection. The AI chapter practices evidence evaluation and scoped prompts without duplicating prerequisite IOS drills.

These are original teaching cases, not recalled certification exam items. No audit or local practice score establishes an exam-pass guarantee.

## Final workload

| Chapter | Questions | Foundation / application / analysis | Cards | Drills | Tickets | Lab stages | Lab minutes |
|---|---:|---|---:|---:|---:|---:|---:|
|34 ACLs|28|7 / 17 / 4|20|10|3|8|85|
|35 VPNs and IPsec|17|5 / 11 / 1|17|2|2|9|60|
|36 Wireless principles|23|7 / 13 / 3|20|3|2|12|55|
|37 Wireless architecture|17|7 / 10 / 0|15|7|2|12|80|
|38 WLAN security and configuration|22|8 / 14 / 0|20|4|2|14|90|
|39 Virtualization|15|6 / 9 / 0|15|5|2|9|70|
|40 Network management and SDN|16|7 / 9 / 0|16|3|2|10|75|
|41 REST APIs and JSON|21|9 / 12 / 0|18|2|2|16|65|
|42 Ansible and Terraform|20|6 / 14 / 0|20|4|2|12|100|
|43 AI in network operations|19|7 / 12 / 0|16|0|2|9|55|
|44 Integrated branch capstone|23|2 / 20 / 1|12|8|4|19|300|
|45 Exam readiness|30|6 / 23 / 1|10|10|2|11|120|
|**Total**|**251**|**77 / 164 / 10**|**199**|**58**|**27**|**141**|—|

The baseline had 197 questions, 260 cards, 114 drills and 27 tickets. Added questions address distinct decisions; reduced card/drill counts remove repeated facts, oversized catalogs and optional implementation recall. The 707-entry ledger reconciles **231 keep, 195 revise, 172 retire and 109 add** decisions. No chapter needs a manufactured analysis item to fill a quota.

Lab estimates describe the stated path, not fixed completion limits. Chapter 41 also supplies a roughly 30-minute interpretation route without local execution. The capstone's five hours are intended for several sessions. The readiness checkpoint is a mixed sample, not a full mock exam or a claim to assess every blueprint skill.

## Notable corrections

- ACL practice now requires ordered-rule reasoning, actual source/destination direction, complete repairs and positive and negative service checks. A NAT selection list is distinguished from a packet filter.
- Wireless work separates AP registration, authentication, client addressing and application forwarding. Worksheets identify the AP/controller port contract and do not pretend a generic simulator implements a specific vendor feature.
- Virtualization and SDN models state what they can demonstrate. Same-host forwarding, VRF context, controller intent and application acceptance are assessed without requiring a production controller or hypervisor deployment.
- REST practice separates JSON syntax, schema, authentication, authorization and response semantics. The supplied local teaching service was actually executed for bounded HTTP/JSON checks.
- The Ansible lab displays the full registered command results after the indexing exercise, so requested device identity and route evidence are observable. A successful local debug task is not represented as a remote command run.
- The capstone requires predictions, independent changed addressing, retained restrictions, a specific guest HTTP exception and a separate stale NAT-selector repair. The readiness reference build stays concealed; its repairs retest permitted USERS traffic while preserving the intended STAFF restriction.

## Review records

- [34–36 author report](34-36-rework.md), [independent review](34-36-peer-review.md), [decisions](34-36-decisions.json)
- [37–40 author report](37-40-rework.md), [independent review](37-40-peer-review.md), [decisions](37-40-decisions.json)
- [41–43 author report](41-43-rework.md), [independent review](41-43-peer-review.md), [decisions](41-43-decisions.json)
- [44–45 author report](44-45-rework.md), [independent review](44-45-peer-review.md), [decisions](44-45-decisions.json)

All four independent reviews are closed with no outstanding actionable finding.

## Executed verification

- Content validation and production build passed: zero content errors. Ten existing untagged foundation-question warnings in chapters 00–01 remain; none belong to this batch. The existing large-bundle advisory remains.
- Type checking passed, and all 33 existing application tests passed. Application code was unchanged after these checks.
- [Batch integrity and React rendering](verification.json): 707 exact decisions, 3,475 rendered fragments and 430 protected baseline files unchanged. Chapter/section identities and order remain stable; prerequisite links resolve to earlier chapters. Every lab has complete sections, sequential stages, expected observations or worked guidance, matching time metadata and a concealed independent solution.
- [Independent numerical checks](numerical-results.json): 78 assertions cover wildcard/subnet boundaries, ordered ACL decisions, RF values and channel reuse, address pools, option-43 encoding, VRF-related addressing, specified encapsulation, route choice, EUI-64 and capstone/readiness evidence arithmetic.
- Author verifiers additionally rendered 944 fragments for 34–36, 1,022 for 37–40 and 828 for 41–43. These overlap the batch check and are not additional unique content. The 41–43 check also parsed YAML and checked 26 semantic/identity assertions.
- [Local API execution](local-api-verification.json): 13 live loopback HTTP/JSON cases passed using the supplied handler and validator. The listener and temporary data were cleaned up. This is a local teaching-service test, not a Cisco API test.
- [Browser verification](browser-verification.json): all 60 chapter views and 27 ticket routes passed on the final production build. Worked solutions start closed; the deliberately empty AI drill view explains the absence of drills. Representative grading, keyboard flashcards, command feedback, ticket repairs, solution disclosures and reload persistence passed on an isolated localhost origin. The final capstone layout has no page-width overflow at the checked desktop size, and no browser warnings or errors were reported.
- Whitespace checks passed. The [baseline](baseline.json) includes the preceding uncommitted 24–33 work; its files remain intact. UI code, styles, colors, assets and deployment configuration were protected. The removed Pages workflow remains absent.

No Packet Tracer, CML, IOS hardware, live controller, remote Ansible or Terraform apply was executed in this pass. Device labs received source, configuration and independent semantic review; simulator/hardware execution remains a separate verification step. No commit, push or deployment was part of this batch.
