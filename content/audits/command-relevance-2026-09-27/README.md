# Command practice: relevance and progression review

Reviewed 27 September 2026. This corrects the earlier trainer pass, which expanded explanations without sufficiently questioning the selection of exercises. All 46 chapters were reviewed against their lessons, guided/independent labs, the course practice plan and Cisco's published objectives. The result is a changed curriculum for command practice, not another explanation layer.

## Editorial result

The baseline contained 366 drills. This review revised 236, retired 130 and added 8 missing skills, leaving **244 exercises**. The [baseline snapshot](before.json) and individual decision ledgers account for every original identity. No count was used as a quota. The current core sets contain 166 exercises for v1.1 and 228 for v2.0; other retained exercises are optional lab depth for the selected track.

| Chapters | Before → after | Detailed review | Item decisions |
|---|---:|---|---|
|00–15|138 → 96|[Foundations and switching](00-15.md)|[139 decisions](00-15.json)|
|16–30|150 → 109|[Security, routing and services](16-30.md)|[153 decisions](16-30.json)|
|31–45|78 → 39|[Troubleshooting through readiness](31-45.md)|[82 decisions](31-45.json)|

The opening chapter keeps six simple mode/name/save/check tasks. Network Models and Components use observation and interpretation; supplied setup no longer becomes an extra memorization requirement. Subnetting retains its substantial calculation and allocation practice in the subnet trainer and lab, instead of repeating interface syntax with different masks. Ethernet practice focuses on selecting the appropriate forwarding-table evidence.

Configuration-heavy chapters keep distinct operations. Replacing, adding to and removing from a trunk's allowed list have different consequences. SSH still needs separate credentials, key generation, VTY selection, authentication and transport decisions. ACL practice now starts with standard matching before extended policy, ordered exceptions, attachment and verification. A later command repeats an earlier one only when it adds a meaningful decision, such as choosing an AP port's mode from its actual forwarding behavior.

FHRP, QoS, VPN, WLAN security, REST/JSON and other conceptual or GUI outcomes use their existing output, worksheet or configuration practice. An empty command bank explains why and links to that work. Readiness points back to relevant command owners rather than presenting ten generic display commands as a readiness assessment. The capstone retains genuine integration: admitting DHCP from an unaddressed client through an ACL, correcting a stale PAT selector, and optional conditional default origination.

The eight additions close specific gaps:

- SSH: select the VTY line context before configuring login and transport.
- Layer 2 security: enable DHCP snooping globally; correct an RA-guard policy's device role.
- Client troubleshooting: inspect a macOS interface's own address and mask.
- ACLs: construct a named standard list; place a broad deny between the intended exception and the remaining permit.
- Capstone: admit the initial DHCP exchange; repair the translation selector after renumbering while preserving staff service.

Each range report explains chapter-level depth and optional boundaries. The judgments follow the difference between describing, interpreting, configuring and troubleshooting. They do not imply that Cisco publishes an exhaustive command list or that an unlisted related topic can never appear.

## Teaching interface

Removed the command walkthrough, guided/memory mode switch, token narration and repeated purpose/preparation/verification panels. A task now contains its indispensable context, offers a short optional hint, and reveals one answer with one useful explanation. The related lesson opens at the relevant section; the chapter lab remains one click away. Existing colors are preserved.

Chapter order is the default. Extra lab syntax is opt-in; selected-track differences affect the actual set, not only a label. Previously attempted commands can be reviewed, with weaker results first. Corrections and revisits preserve the first result, and help use is distinguished in the round summary. This remains a command-choice and syntax exercise: the lab supplies device execution and output interpretation.

Same-skill revisions keep their IDs. New skills receive new IDs. Retired IDs are excluded from current review without deleting saved progress. The lightweight chapter practice plans are in `content/command-curriculum.json`; item-level audit reasoning is not shipped in the trainer bundle.

## Sources and limits

The review reopened Cisco's [v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf). Each range report links its primary command references and identifies the owning lesson/lab evidence. The [practice plan](../../PRACTICE-PLAN.md) supplies the progression standard; [authoring guidance](../../AUTHORING.md) now requires selection before explanation and documents the compact metadata.

This was an editorial and application audit. No Packet Tracer, physical Cisco device, CML or remote Ansible execution was performed. Demand labels describe the reasoning asked of the learner; they are not statistically calibrated difficulty ratings. Automated checks establish data consistency and application behavior, not exam relevance by themselves or a guaranteed result.

## Verification

- Full application test run: **154 passed**. The 12 command UI tests also passed after final copy/layout corrections.
- Type checking and production build: passed. Content validation: zero errors, with the same ten existing foundation-question objective-tag warnings.
- Every one of the 244 canonical answers and 40 explicit alternatives passes the real matcher. Existing tests also reject incorrect, truncated and case-altered literal values and incorrect interface identities.
- All lesson anchors, grading-role annotations, chapter plans and 374 item decisions reconcile with the actual content. Removed explanatory fields are checked so duplicated narration does not quietly return.
- Browser verification on an isolated local origin covered wrong answers, repair, accepted abbreviations, hints, answer reveal, round results, an empty conceptual bank, both exam tracks, optional AAA practice, chapter-embedded navigation and exact-section links with keyboard focus.
- Desktop at 1440 × 1000 and mobile at 390 × 844: no horizontal overflow in the inspected layouts. Screenshots: [desktop](desktop.png), [mobile VTY exercise](mobile.png).
- The lazy command trainer and bank now total **52.56 kB gzip**, versus 124.73 kB in the preceding expansion (about 58% smaller). The separate stylesheet is 1.11 kB gzip. This is a payload reduction, not a measured scrolling-speed claim. Existing larger application/practice chunks retain Vite's advisory size warning.

The earlier [trainer report](../command-trainer-2026-09-27/README.md) is marked historical. Its walkthrough screenshots and retain-all selection no longer describe this implementation.
