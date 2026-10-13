# Whole-course coherency audit

Completed 24 September 2026. This pass reviewed the learning sequence across all **46 chapters, 00–45**, from the first simulator setup through the final readiness assessment. The reviewers traced what the learner brings into each chapter, what the chapter teaches before practice, and where those skills are used later.

The chapter reviewers read **274 existing source files in full**: every lesson, lab and available question, flashcard, command-drill and troubleshooting-ticket bank. Chapters 00 and 01 have no ticket files, which accounts for the difference from six files per chapter. Independent peer reviews then checked range boundaries and changed teaching against practice demands. Each peer report states its scope; the peer pass is not counted as another 274 full reads.

## What changed

The course retains its chapter order, from device and packet behavior through addressing, switching, routing, services, security, wireless, automation and integrated work. Changes primarily add first-use explanations, worked examples, explicit setup instructions, corrected prerequisite links and clearer transitions. Chapter, section, lab-step and practice identities and order are preserved.

The final pre-edit comparison records **62 changed files**: 45 lessons, 10 labs, three question banks, three flashcard banks and the chapter index. Chapter 15 needed no teaching change after review. All 46 prerequisite cells in [the chapter index](../../CHAPTERS.md) match the lesson metadata. See [changed-files.json](changed-files.json) for the exact list.

The recurring corrections were:

- Explain networking terms, IOS modes, supplied addressing and service setup before early labs use them.
- Introduce the limited DHCP and IPv6 vocabulary needed by switching-security tasks, while retaining full treatment in the later chapters.
- Distinguish connected routes, route selection, forwarding and the return path; teach source-specific tests and conditional OSPF default origination before integrated work.
- Connect NAT selection to later packet filtering, explain host keys and certificates before troubleshooting them, and supply the operating-system context needed for file-transfer labs.
- Clarify each wireless lab's starting topology and introduce virtualization and automation terminology, notation and local setup before practice.
- Make capstone prerequisites and acceptance tests explicit, and distinguish a failed test from a skill that has not yet been demonstrated.

The [dependency map](DEPENDENCY-MAP.md) provides a compact chapter-by-chapter guide. The coverage ledgers contain the detailed owner references. Neither claims to enumerate every possible conceptual dependency.

## Practice continuity

All **2,335 practice IDs** and their order are preserved:

| Practice type | Retained items |
|---|---:|
| Questions | 996 |
| Flashcards | 879 |
| Command drills | 366 |
| Troubleshooting tickets | 94 |
| **Total** | **2,335** |

No practice items were added or retired. Six existing items received focused wording corrections:

| Item | Coherency correction |
|---|---|
| `start-here-c28` | Test first-lab forwarding without requiring an OSI layer label before Chapter 01. |
| `vlans-and-access-ports-q13` | Keep the early question about default data access VLAN membership; native VLAN treatment belongs in Chapter 10. |
| `vlans-and-access-ports-c03` | Remove premature native-VLAN recall while preserving the access-membership distinction. |
| `file-management-q21` | Explain the backup requirements directly and remove an unsupported assumption about what a later local save overwrites. |
| `wireless-security-config-q02` | Assess the purpose and scope of AES-CCMP protection without requiring untaught cipher internals. |
| `wireless-security-config-c03` | Apply the same encryption-and-integrity scope to the flashcard. |

[practice-changes.json](practice-changes.json) records the reasons. These are six changed item identities, even where an item has more than one corrected explanation field. Earlier practice work already present in the working tree was retained as the starting point for this pass.

## Review records

Each coverage ledger records actual earlier chapter/section references, local teaching anchors, practice demands, selected later study connections, findings and files read. The prose reports explain the decisions, retained previews, technical references and execution limits.

| Chapters | Full chapter review | Coverage ledger | Independent peer review |
|---|---|---|---|
| 00–11 | [00–11 review](00-11-review.md) | [00–11 coverage](00-11-coverage.json) | [Peer review of 00–11](peer-00-11.md) |
| 12–23 | [12–23 review](12-23-review.md) | [12–23 coverage](12-23-coverage.json) | [Peer review of 12–23](peer-12-23.md) |
| 24–35 | [24–35 review](24-35-review.md) | [24–35 coverage](24-35-coverage.json) | [Peer review of 24–35](peer-24-35.md) |
| 36–45 | [36–45 review](36-45-review.md) | [36–45 coverage](36-45-coverage.json) | [Peer review of 36–45](peer-36-45.md) |

The reports distinguish required foundations from short, explained previews and optional exercises. Useful previews were retained when the explanation or supplied setup supports the immediate task; the later chapter remains responsible for the deeper treatment.

## Baseline and verification

[baseline.json](baseline.json) is the **pre-edit working-tree snapshot**, captured at 2026-09-24 16:41:06 UTC. It includes the earlier uncommitted course and practice changes. Comparisons use this snapshot rather than treating the last Git commit as the starting content.

[chapter-map.json](chapter-map.json) is the accompanying **pre-edit inventory** of chapters, sections, prerequisites, lab stages and practice counts. It locates the original structure; it is not the final dependency map. Use current lesson metadata, the coverage ledgers and [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md) for the reviewed sequence.

The final [verification result](verification.json), produced by [verify.mjs](verify.mjs), passed. It checks all 46 coverage records and their 274 file references, resolves entry anchors to earlier lessons, preserves chapter/section/lab/practice identities and order, and reconciles the six changed items with their decision ledger. It also confirms **257 protected files unchanged** and checks **14,073 rendered fragments**. These structural and rendering checks support the editorial review; they do not independently prove instructional quality.

Application source code, styles and colors were unchanged. No publishing or deployment was performed, and the Pages deployment workflow remains absent.

## Executed checks and limits

The final production build, type check and **33 of 33 automated tests** passed. Content validation reported zero errors and ten existing foundation objective-tag warnings; the build retained its existing large-chunk warning. Browser checks covered **230 chapter views**: learn, lab, questions, flashcards and drills for each of the 46 chapters. The views loaded without horizontal overflow; the empty AI chapter drill view is intentional. Targeted question-feedback, flashcard and solution-disclosure interactions also passed, with no browser console warnings or errors. [QA.md](QA.md) records executed checks and their scope.

Lessons and labs were reviewed as teaching and setup instructions. **No Packet Tracer, CML or physical-hardware lab was executed in this pass**; other platform-specific execution limits appear in the range reports. Source review and application browser checks do not establish that every simulator image, operating-system version or device will behave identically.

This audit documents a reviewed progression and its corrections. It does not guarantee exam success or coverage of every possible exam question or conceptual dependency.
