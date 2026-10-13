# Opening practice audit

Reviewed 20 September 2026. This is the next practice-design pass for the local OpenPackets app, following the earlier lesson-content review.

## Scope

The [course-wide practice plan](../../PRACTICE-PLAN.md) evaluates all 46 chapters. This implementation covers orientation 00 and numbered chapters 01–08. Chapters 09–45 have design recommendations for later batches; their lesson and practice files were not changed in this batch.

The work covers labs, checkpoint questions and their alternatives/feedback, flashcards, command drills and troubleshooting tickets. Small lesson notes and lab-time metadata were aligned where the practice changed. Two small presentation corrections support honest practice: opt-in solutions stay closed until the learner opens "Check your answer," and a flashcard's hidden face is excluded from the accessibility tree until flipped. One narrowly scoped table rule keeps addresses intact inside the new solutions, using the existing horizontal-scroll wrapper. The palette is unchanged; removing that exact wrapping rule reproduces the original stylesheet hash. All other application source remains as it was at the start of this pass.

## What changed in the teaching design

The previous workload was nearly uniform: orientation had 15 questions, while IPv4 addressing and VLSM each had 16. Nearly every chapter had about 20 cards. The new workload follows the number of distinct decisions a learner needs to practise. Orientation now establishes a small successful LAN and basic working/saved configuration habits; IPv4 and VLSM receive substantially more calculation, interpretation and constraint-based practice.

Questions progress from foundations through application to analysis. The difficulty labels describe the required reasoning, not measured candidate success rates. A definition in a long scenario remains recall; a single obvious fault is usually application. Multi-select questions and exhibits are used when they suit the task, without uniform minimums. The actual final distribution can differ from the original editorial target when the item does not justify a higher label.

Flashcards ask for a small retrievable fact or comparison. Repeated reference tables, command variants and premature details were pruned. Drills focus on commands worth recalling at this stage, while unfamiliar lab preparation remains supplied setup. Retirements are documented by identity and reason; a claimed later or earlier owner names an existing item.

Labs move from a model and prediction to guided observation and a changed independent exercise. Learners record concrete evidence: address fields, both packet directions, forwarding-table entries, service availability or a fresh management session. Fault observation and repair are separate. A browser check established that the existing expected-result boxes were visible guidance, so this batch adds explicit closed solution disclosures for independent challenge answers and the initial addressing worksheets. Platform-dependent observations are identified; a supplied packet or counter record is not represented as a simulator capture.

## Final opening workload

Counts include all authored practice in the chapter, with prerequisites intentionally available even when they do not have a direct exam-objective tag. Reasoning columns list foundations/application/analysis counts, not exam probabilities. Lab minutes are estimates that include the learner's calculations and evidence record.

|Chapter|Questions before → after|Cards before → after|Drills before → after|Tickets|Reasoning 1/2/3|Lab steps / minutes|
|---|---:|---:|---:|---:|---|---|
|00 · Start here|15 → 7|18 → 8|12 → 6|0|4/3/0|7 / 25|
|01 · Network models|15 → 12|20 → 14|11 → 6|0|3/9/0|8 / 45|
|02 · Components and topologies|15 → 14|20 → 15|10 → 3|2|6/8/0|8 / 35|
|03 · Cabling and interfaces|16 → 16|20 → 18|11 → 8|2|5/10/1|8 / 50|
|04 · IPv4 addressing|16 → 24|20 → 22|11 → 10|2|6/14/4|9 / 65|
|05 · Subnetting and VLSM|16 → 28|20 → 24|11 → 5|2|4/20/4|8 / 75|
|06 · TCP, UDP and ports|16 → 14|20 → 18|10 → 5|2|4/8/2|8 / 50|
|07 · Ethernet switching|16 → 18|20 → 20|11 → 8|2|4/12/2|10 / 65|
|08 · Secure device access|16 → 20|20 → 22|12 → 12|2|7/9/4|11 / 70|

The batch contains 153 questions, 161 cards, 63 command drills and 14 tickets. A smaller retrieval bank can accompany a deeper practical exercise: VLSM keeps five relevant commands while placing most of its workload in calculation and verification. The end of the course will likewise rely more on independent integrated work than on a large duplicated glossary.

## Review records

- [00–03 implementation decisions](00-03-rework.md) and [independent review](00-03-peer-review.md)
- [04–05 implementation decisions](04-05-rework.md) and [independent review](04-05-peer-review.md)
- [06–08 implementation decisions](06-08-rework.md) and [independent review](06-08-peer-review.md)
- [09–25 future practice evaluation](09-25-evaluation.md)
- [26–45 future practice evaluation](26-45-evaluation.md)

The three machine-readable decision files record every old/current question, card, drill and ticket as keep, revise, retire or add. The captured [baseline](baseline.json) retains the original banks and file hashes. [verify.mjs](verify.mjs) reconciles every decision with the actual edits, checks named destinations, preserves chapter/section identities, renders teaching fragments through the real app components, and verifies that later chapter files and all application source except the two explicitly reviewed presentation files and single table-wrapping rule match their starting hashes. The stylesheet is checked separately by removing that exact rule and matching its original hash.

## Evidence and limits

Technical scope is checked against Cisco's [v1.1 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), with source references and platform qualifications retained in the chapters and individual review reports. No commercial question bank or recalled live exam questions were used.

An editorial review and passing application checks do not establish measured learning gains or predict an exam result. The networking procedures were reviewed against configuration, addressing and protocol requirements, but this pass did not execute Packet Tracer, CML or physical devices. Their execution remains a separate validation step.

Existing learner progress is preserved. Same-topic question/card/drill/ticket IDs remain stable, while unrelated replacements receive new IDs. Lab checkmarks are positional: a revised step can occupy an old checked position. Each substantially revised lab therefore identifies this September 2026 revision and asks returning learners to repeat the exercise and update its checkmarks. No saved progress was cleared or silently marked as new mastery.

## Executed verification

- **Independent peer review:** every item and complete lab in the opening batch received a second editorial read. All reported findings were resolved and reread; see the three peer records above.
- **Course validation:** 0 errors; 10 intentional warnings for prerequisite questions in 00/01 without a direct blueprint tag. No artificial objective tags were added merely to silence those warnings.
- **Practice integrity/rendering:** 488 old/current identities reconciled; 2,245 fragments rendered through the actual React/Markdown/diagram components; every challenge has a closed solution. See [verification.json](verification.json).
- **Scope and identity:** chapter IDs, numbering and reading-section identities are preserved. All 09–45 files match their starting hashes. In total, 259 later-chapter/application files match exactly, with the explicitly reviewed presentation changes accounted for separately. The color stylesheet matches after removing only the scoped no-wrap rule.
- **Arithmetic:** all 50 independent integer-range assertions passed for selected numerical answers and the guided/changed IPv4 and VLSM plans.
- **Application tests:** all 33 regression tests passed, including the new closed-solution/visible-guidance distinction. Type checking passed.
- **Production build:** passed. The existing large-bundle advisory remains; this content pass did not claim a new performance audit or alter the build's warning threshold.
- **Browser:** all 45 opening-chapter views and 14 ticket views loaded with the expected question/step/exhibit counts. Question and command grading, diagnosis/fix feedback, card reveal and accessibility state, keyboard-operated solutions, and lab-checkmark persistence were checked. No browser error was recorded. Testing used the isolated localhost preview; user study progress was not reset.
- **Visual review:** the existing dark palette and blue accents were retained. The new solution presentation was inspected closed and open; IP addresses remain intact within its existing horizontal-scroll table wrapper.

The updated local app is the deliverable. No publication, deployment, commit or push was performed in this practice pass.
