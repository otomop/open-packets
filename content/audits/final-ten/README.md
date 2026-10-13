# Final chapters 36–45: content audit

Completed content rewrite and technical review dated 20 September 2026. This is the final batch in the 46-chapter local course (00–45). All ten chapters' lessons, lab setup and instructions, questions and distractor explanations, flashcards, command drills and troubleshooting cases were reviewed. The sequence and prerequisites were checked again; the course index reflects the final metadata.

This batch contains **164 questions, 218 cards, 92 command drills, 22 tickets and 121 guided lab steps**. The production loader counts 24,664 lesson words, including tables and examples.

| Chapter | Topic | Questions | Cards | Drills | Tickets | Lab steps |
|---|---|---:|---:|---:|---:|---:|
| 36 | Wireless principles | 16 | 22 | 8 | 2 | 12 |
| 37 | Wireless architectures | 16 | 20 | 12 | 2 | 12 |
| 38 | WLAN security | 16 | 21 | 10 | 2 | 14 |
| 39 | Virtualization | 16 | 20 | 10 | 2 | 9 |
| 40 | Network management and SDN | 16 | 20 | 6 | 2 | 10 |
| 41 | REST APIs and JSON | 16 | 20 | 6 | 2 | 14 |
| 42 | Ansible & Terraform | 16 | 22 | 10 | 2 | 11 |
| 43 | AI in network operations | 16 | 20 | 6 | 2 | 9 |
| 44 | Capstone: the branch network | 17 | 22 | 12 | 4 | 19 |
| 45 | Exam readiness | 19 | 31 | 12 | 2 | 11 |

## Teaching and structure

- **36–38:** radio measurements, channel choices and WLAN identifiers precede architecture, wired paths, security and the GUI configuration task. Current 9800 concepts are distinguished from the legacy controller models available in Packet Tracer. RF claims and simulator limitations are qualified explicitly.
- **39–41:** virtualization and host uplinks precede management models, then HTTP/API and JSON evidence. Device/API enablement trivia outside the objective is retired. Chapter 41 includes a complete reproducible local exercise, without shared public sandbox credentials.
- **42–43:** Ansible provides a genuine local setup and a separate reachable-IOS execution path; Terraform has a clearly bounded local-state exercise. AI instruction uses verifiable network evidence, useful prompts and a single-client fault, without claiming generated confidence is proof.
- **44–45:** the capstone builds and troubleshoots an integrated branch, while readiness uses an independent specification, reference solution and skills ledger. Unsupported exam-format and passing-threshold claims are removed. Neither is represented as coverage of every exam task by itself.

Objective mapping distinguishes the current v1.1 blueprint from the announced v2.0 blueprint. The verb and required depth govern practice: explanation is not mislabeled configuration, and a worksheet is not claimed as real-device execution. The course remains expansive but separates optional implementation detail from the CCNA requirements.

## Detailed reviews and sources

Primary references are linked in the lessons and these reports. No recalled exam questions or dumps were used.

- [Wireless chapters 36–38](36-38-review.md)
- [Virtualization, management and APIs 39–41](39-41-review.md)
- [Ansible, Terraform and AI 42–43](42-43-review.md)
- [Capstone and exam readiness 44–45](44-45-review.md)
- [Independent capstone/readiness review](44-45-peer-review.md)

All four groups received independent cross-reviews of every asset. The wireless review corrected the untagged management/native-VLAN mapping, a PAgP/DTP distinction and the controller distribution trunk. The readiness review corrected one SSH checklist label. Those changes were re-read and no material peer findings remain unresolved.

## Progress compatibility

All 46 chapter IDs and numbers remain stable. Same-topic checkable section identities were retained under revised headings. Existing assessment IDs are retained only for the same topic; the author reports document the exact retired IDs and their new replacements. The [pre-edit snapshot](baseline.json) and [batch verifier](verify.mjs) enforce these decisions.

Lab steps were expanded and reorganized. Their completion flags are positional: revisit revised steps even if an older box is already checked. No progress storage was cleared or migrated. Old practice results remain history, not proof that the revised material has been mastered.

## Verification

- Whole-course content validator: **0 errors**. The remaining **19 warnings** are deliberately untagged setup/model questions in chapters 00–01, not unresolved accuracy markers in this batch.
- Batch identity, prerequisite, internal-link, answer-index, distractor and rendering checks: **2,644 fragments passed**. The verifier renders the actual React components, including code blocks and diagrams. Literal JSON discussion of NaN is allowed as text; invalid rendered attributes remain rejected.
- An independent integration check confirmed the chapter-index rows against metadata, all 22 documented retired item IDs against the baseline/verifier, and the capstone/readiness inventory and previous lab-step counts.
- Application suite: **32 tests passed**. Type checking passed.
- Production build passed. Vite still reports chunks above its 500 kB advisory threshold; this content task did not change app loading architecture or claim to resolve that performance advisory.
- Browser inspection on a separate local test origin: **all 50 chapter views** and **all 22 ticket detail views** loaded. Lab/question counts and active study tabs matched. Sample checkpoint grading/distractor explanations, command grading, flashcard reveal and a saved lab checkbox were verified. The checkbox persisted after reload and was restored to its initial test state. No warning/error console logs were observed during the checks. After the final rebuild, the changed wireless lesson/lab/checkpoint views were rechecked; the temporary preview was closed and the existing local app tab was refreshed.
- The exact supplied chapter 41 Python HTTP server and JSON validation code passed **14 executed local checks**, including actual curl response handling. See its report for the individual cases and ephemeral test-port detail.

## Limits

Packet Tracer, CML, physical IOS/IOS XE devices, controllers, RF behavior, remote Ansible jobs and the Terraform CLI lifecycle were not executed during this audit. Those configurations were checked against primary documentation and reviewed for internal consistency; representative output is labeled accordingly. Learners must verify actual behavior on their selected supported platform. The local API exercise's executed checks do not certify a production TLS or controller API deployment.

All course content has now received the requested audit pass, but a content review cannot guarantee an exam result or freeze future software/exam-policy changes. Recheck official appointment and release documentation where the lessons direct you.

The work is in the local app. No colors, styling, application code, hosting, Git history or remote repository were changed by this batch.
