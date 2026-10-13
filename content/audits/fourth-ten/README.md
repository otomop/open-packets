# Content audit: chapters 26–35

Reviewed 20 September 2026. This batch covers NAT/PAT, NTP/syslog/SNMP, QoS, configuration/software files, client troubleshooting, the troubleshooting toolkit, security concepts, AAA, ACLs and VPNs/IPsec in the local application.

## Scope and source standard

All six teaching assets in each chapter were reviewed: lesson, guided lab, questions including every distractor explanation, flashcards, command exercises, and troubleshooting tickets. The objective was an accurate, readable CCNA course with enough explanation to understand and troubleshoot the mechanism. No claim is made that this or any course guarantees an exam result.

Scope was checked against Cisco's [CCNA v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [CCNA v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf). Lessons link their Cisco platform/configuration references, relevant RFCs, and official operating-system/tool documentation. Security policy uses the current scoped NIST guidance rather than presenting old composition/expiry rules as universal recommendations.

## Teaching and structure corrections

- **NAT/PAT:** separate translation, routing and filtering; correctly interpret address roles, pool/PAT behavior, ICMP identifiers, state and return routing. The lab compares four configurations and repairs individual faults.
- **Monitoring:** teach NTP hierarchy and actual synchronization, syslog severity/destination controls, and SNMP operations/security. Counter and time examples state their assumptions. A local time master is an isolated exercise, not an invented outage repair.
- **QoS:** explain the required forwarding behaviors and their interaction. Marking, scheduling, queue drops and policing are different observations. The optional marking experiment checks the correct direction; it does not purport to measure production voice performance.
- **Files:** distinguish save, backup, merge, staging and activation. Provide a separate secure SCP/SFTP environment with accounts, permissions, paths, source/destination roles and verification. No destructive image installation or password-recovery experiment is required.
- **Troubleshooting:** follow both directions of a path, use source-specific tests, examine actual host settings and correlate captures. A timeout, missing table entry, traceroute star or TCP reset alone does not identify a unique cause.
- **Security and AAA:** separate risks, attack mechanisms and controls; teach factor categories and credential handling. AAA exercises verify fresh sessions, rejection versus method error, server-client settings and a tested console recovery path.
- **ACLs:** trace first match, wildcard bits, service ports and interface direction. Return packets need their own evaluation. TCP `established` is a flag test, not a session table.
- **VPNs:** focus required learning on protected endpoints, IPsec services, modes, IKE and transport. Replace mandatory advanced GRE/OSPF/IKEv1 construction with a routed baseline and evidence exercises, retaining a clearly optional documented IOS XE IKEv2 reference.

The chapter sequence and all 46 chapter identities remain. Titles were clarified for NAT/PAT, monitoring, file management and AAA. Added prerequisite links prepare learners for transport concepts, IOS commands, routing, IPv6 host inspection, troubleshooting and ACL-based traffic selection. No prerequisite points forward in the course. See [the course index](../../CHAPTERS.md).

Same-topic reading sections keep their saved identities through explicit heading mappings. Assessment items that changed to unrelated skills receive new IDs; the individual reviews list retired items. These intentional replacements should not inherit old mastery. Lab steps were substantially rewritten and retain positional completion markers, so previously checked steps should be repeated using the revised instructions.

## Revised teaching inventory

| Chapter | Lab steps | Questions | Flashcards | Command drills | Tickets |
|---|---:|---:|---:|---:|---:|
| 26 NAT and PAT | 12 | 16 | 20 | 12 | 2 |
| 27 NTP, syslog and SNMP | 13 | 16 | 23 | 12 | 2 |
| 28 QoS | 12 | 16 | 20 | 12 | 2 |
| 29 Configuration and software files | 15 | 16 | 21 | 12 | 2 |
| 30 Client OS troubleshooting | 15 | 16 | 20 | 12 | 2 |
| 31 Troubleshooting toolkit | 12 | 16 | 20 | 12 | 3 |
| 32 Security concepts | 8 | 16 | 20 | 11 | 2 |
| 33 AAA with TACACS+ and RADIUS | 12 | 16 | 20 | 12 | 2 |
| 34 Access control lists | 8 | 17 | 22 | 12 | 3 |
| 35 VPNs and IPsec | 9 | 16 | 20 | 10 | 2 |
| **Total** | **116** | **161** | **206** | **117** | **22** |

## Detailed reviews

- [Chapters 26–27](26-27-review.md)
- [Chapters 28–30](28-30-review.md)
- [Chapters 31–33](31-33-review.md)
- [Chapters 34–35](34-35-review.md)

`baseline.json` preserves the pre-review section, step and assessment state for this batch. `verify.mjs` checks the loaded course and renders teaching fragments through the actual React components.

## Validation record

- Application tests: **32 passed**. TypeScript checking passed.
- Content validation: **0 errors, no warnings in chapters 26–35**. The 44 remaining whole-course warnings comprise 19 intentionally untagged setup/model questions in chapters 00–01 and 25 unresolved verification notes in the next batch, chapters 36–45.
- Batch integrity and actual React rendering: **2,654 fragments passed**, covering lesson/lab text, questions, all distractor explanations, cards, command notes, ticket repairs, output exhibits and diagrams. Checks include all 46 chapter identities, prerequisite order, internal chapter links, section identity preservation, documented assessment retirements, answer indices and complete lab structure.
- Production build passed. Existing large-chunk advisories remain for the main bundle and global practice bank; this content audit does not certify a new performance improvement.
- Local browser inspection: **50 chapter views** (Learn, Lab, Checkpoint, Flashcards and Command drill for each chapter) and **22 ticket pages** loaded with their expected counts, titles and controls. All ticket pages expose four answer choices and their expected exhibits.
- Interactive checks passed for a checkpoint answer/explanations, flashcard flip, correct command feedback, ticket diagnosis/repair reveal, renamed lesson-section navigation, and a lab checkbox retained after reload. Test activity was confined to the separate localhost:4175 origin. The lab checkbox was restored afterward; the user's localhost:5173 study progress was not used for testing.
- A settled lesson screenshot showed the existing dark styling and blue accents with no page-level horizontal overflow. Browser error/warning collection was empty during the checked session. An initial checkbox click during a navigation transition did not take effect; a fresh-state retry succeeded, and the saved state was confirmed from the reloaded DOM.
- Independent arithmetic/packet-match checks cover ACL boundary and noncontiguous matches, the NAT return block, SNMP byte rates, voice/serialization rates, DSCP and syslog PRI. The ACL/VPN review records its broader enumeration checks separately.
- Targeted whitespace/diff checking passed for the ten chapter directories and updated index.

Peer review corrected an ambiguous security-question time format, a changed assessment subject that needed its original identity retained, independently incomplete command prompts, and the secure-file lab's server-identity verification instructions. The final SSH procedure must verify trusted key material in both client/server directions; it does not assume that an IOS client automatically displays or enforces a first-use acceptance prompt.

## Execution limits

Network commands and expected outcomes were reviewed against documentation and topology/state logic. Packet Tracer, CML and hardware labs were not executed during this audit. Representative output is identified as teaching evidence. Where simulator support varies, the lesson/lab names the limitation and supplies an interpretation exercise or a supporting platform; paper completion is not claimed as live configuration proficiency.

This work changes local teaching content and its audit/index files. It does not change the application's colors, styling or layout, publish the legacy hosted site, or push to GitHub. Chapters 36–45 remain the next full-content batch; the earlier site-wide structure review does not certify their existing teaching material.
