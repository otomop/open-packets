# Practice audit: chapters 24–33

Reviewed 24 September 2026, continuing the [09–23 practice batch](../practice-09-23/README.md). The scope is the next ten numbered chapters in the local app: DHCP, DNS, NAT/PAT, NTP/syslog/SNMP, QoS, configuration/software files, client troubleshooting, the troubleshooting toolkit, security concepts and AAA.

## Review method

Read every checkpoint prompt, exhibit, option, key and feedback entry; every flashcard and command drill; every troubleshooting case and repair; and each complete lab from setup to its independent challenge. Lesson context establishes prerequisites and depth. The [course practice plan](../../PRACTICE-PLAN.md) guides the design but does not impose item quotas. Difficulty labels describe retrieval, application or analysis, not measured exam difficulty.

Preserve useful same-topic identities. Record every original and new bank identity as kept, revised, retired or added in the four decision ledgers. A claimed destination for retired material must identify an actual existing item. An independent reviewer reads the authored range and the author resolves findings before final integration.

Labs distinguish supplied preparation, predictions, actual observations and interpretation of authored evidence. Fault observation and recovery have separate stages. Independent answers use closed solution disclosures. Unsupported simulator features have an explicit alternative and are not represented as executed tests. Revised labs tell returning learners to repeat changed exercises; existing positional checkmarks and study progress are preserved.

The [baseline](baseline.json) records the source commit, original loaded course and file hashes. [verify.mjs](verify.mjs) reconciles actual item changes, renders content through the app's React components, checks chapter/section identities, and protects chapters outside this batch, application code, styles, assets and deployment-related root configuration. This task does not publish the app or restore the removed deployment workflow.

## Sources and scope

Checked Cisco's [v1.1 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [v2.0 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), then the primary technical sources recorded in each author/peer report. Track distinctions matter: for example, QoS is a v1.1 explanation outcome; v2.0 gives greater depth to DNS diagnosis, secure transfer, client troubleshooting and AAA-client configuration. Supporting setup does not automatically become a command-memorization requirement.

All scenarios are original course practice. Source review, arithmetic/configuration reasoning, application tests and actual network-device execution are different forms of evidence. No Packet Tracer, CML or hardware run is claimed by this audit, and no course audit can establish an exam-pass guarantee.

## Review records

- [24–26 author review](24-26-rework.md) and [independent review](24-26-peer-review.md)
- [27–28 author review](27-28-rework.md) and [independent review](27-28-peer-review.md)
- [29–30 author review](29-30-rework.md) and [independent review](29-30-peer-review.md)
- [31–33 author review](31-33-rework.md) and [independent review](31-33-peer-review.md)

## Final workload

| Chapter | Questions | Foundation / application / analysis | Cards | Drills | Tickets | Lab steps |
|---|---:|---|---:|---:|---:|---:|
| 24 DHCP | 25 | 6 / 16 / 3 | 23 | 12 | 2 | 10 |
| 25 DNS | 26 | 10 / 13 / 3 | 23 | 11 | 2 | 10 |
| 26 NAT and PAT | 24 | 7 / 16 / 1 | 21 | 12 | 2 | 12 |
| 27 NTP, syslog and SNMP | 26 | 7 / 16 / 3 | 24 | 9 | 2 | 13 |
| 28 QoS | 17 | 7 / 8 / 2 | 17 | 3 | 2 | 12 |
| 29 Configuration and software files | 21 | 6 / 15 / 0 | 20 | 11 | 2 | 17 |
| 30 Client OS troubleshooting | 24 | 7 / 14 / 3 | 21 | 12 | 3 | 15 |
| 31 Troubleshooting toolkit | 24 | 4 / 16 / 4 | 14 | 8 | 3 | 12 |
| 32 Security concepts | 18 | 10 / 7 / 1 | 19 | 1 | 2 | 9 |
| 33 AAA | 24 | 9 / 14 / 1 | 19 | 11 | 2 | 12 |
| **Total** | **229** | **73 / 135 / 21** | **201** | **90** | **22** | **122** |

Previously each chapter had 16 questions; the batch had 160 questions, 204 cards, 117 drills and 21 tickets. The revised volume follows distinct outcomes. Detailed configuration practice remains where the exam asks for it. QoS now has three display-command drills, while security concepts has one; their required paper exercises precede optional device work. The security lab's 35-minute estimate covers its required work, with about 45 additional minutes stated for the optional extension. Setup, interpretation and actual execution are explicitly distinguished throughout.

The 633-entry decision ledger reconciles every original or new identity. It records consolidation, removal of unnecessary recall, rewritten alternatives and explanations, and new independent decisions. Changes to lesson files are limited to lab-time metadata, source maintenance, one paragraph explaining required versus optional security practice, and a narrow DNS correction: NXDOMAIN can concern a missing final alias target. Chapter numbers, prerequisites and lesson section identities/order are preserved.

## Executed verification

- Content validation: zero errors; ten pre-existing untagged foundation-question warnings in chapters 00–01, none in this batch.
- Type checking: passed. All 33 existing automated tests passed, including progress persistence, answer shortcuts, routing, content loading and concealed solutions.
- Production build: passed. Its existing large-chunk advisory remains; this content batch does not alter application bundling.
- [Batch integrity and React rendering](verification.json): 633 exact item decisions and 3,244 rendered fragments; 297 protected files unchanged. Every lab has setup, sequential steps, expected observations, troubleshooting and a concealed independent solution. The removed Pages deployment workflow remains absent.
- [Independent numerical checks](numerical-results.json): 60 assertions for address ranges, exclusions, lease timers, TTL, reverse lookup names, NAT return routes, NTP hierarchy, syslog thresholds, counter rates, QoS calculations, file lengths, route precedence and AAA return addressing.
- [Browser verification](browser-verification.json): all five study views for each of the ten chapters, plus all 22 ticket routes; representative grading, keyboard card review, command feedback, ticket repairs, solution disclosure and reload persistence on an isolated localhost test origin. These are application checks, not network-device lab runs.

Chapters 34–45 remain for later practice batches. No commit, push or deployment is part of this batch.
