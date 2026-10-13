# Chapters 08–15 content audit

Completed for the local app in `ccna guide`, following the first eight chapters (00–07). This batch also includes a structure review across all 46 chapters. Technical references were checked against current primary Cisco sources and the applicable exam blueprints. The date of the review was 19 September 2026 locally; some automated records use the following UTC date.

## What changed

Rewrote the lessons, guided labs, questions and their explanations, flashcards, command drills and troubleshooting tickets for chapters 08–15. The teaching follows mechanisms → worked examples → configuration → verification → troubleshooting, with explicit preparation and recovery steps. Replaced speculative exam claims and theatrical wording with direct, professional explanations. Platform-dependent behavior is qualified, and authored output is identified as representative.

The course keeps its 46-chapter learning order. The structural pass clarified titles, corrected forward prerequisites, moved premature configuration topics to their proper owners, added short prerequisite primers where necessary, and distinguished optional advanced exercises from the CCNA core. The full findings and remaining work are in [the whole-course structure review](STRUCTURE.md). The updated [chapter index](../../CHAPTERS.md) includes every chapter, its prerequisite chapters and objective tags.

| Chapter | Revised topic | Lesson sections | Lab steps | Questions | Cards | Drills | Tickets |
|---|---|---:|---:|---:|---:|---:|---:|
| 08 | Secure device access | 8 | 10 | 16 | 20 | 12 | 2 |
| 09 | VLANs & access ports | 8 | 10 | 16 | 20 | 12 | 2 |
| 10 | 802.1Q trunks | 9 | 10 | 16 | 20 | 12 | 2 |
| 11 | Inter-VLAN routing | 7 | 12 | 16 | 20 | 12 | 2 |
| 12 | CDP & LLDP | 8 | 9 | 16 | 20 | 12 | 2 |
| 13 | EtherChannel | 8 | 9 | 16 | 20 | 12 | 2 |
| 14 | Spanning tree | 7 | 9 | 16 | 20 | 10 | 2 |
| 15 | STP protection | 8 | 11 | 16 | 20 | 12 | 3 |
| **Total** | | **63** | **80** | **128** | **160** | **94** | **17** |

There are 19,440 lesson-body words by the content loader's whitespace count, including headings, code and tables. Each question bank includes at least two multi-answer questions and at least four exhibits. The combined batch has 17 multi-answer questions and 41 question exhibits.

## Detailed reports and sources

- [08–09: secure access, VLANs, voice and PoE](08-09-review.md)
- [10–11: trunks and inter-VLAN routing](10-11-review.md)
- [12–13: discovery and EtherChannel](12-13-review.md)
- [14–15: spanning tree and protection](14-15-review.md)

Each pair received a separate technical reading by another reviewer, including answer/distractor semantics and cross-file consistency. The small findings were corrected: an explicit console logout for a fresh authentication test, a current source for 802.3bt power, unambiguous CDP configuration wording, interface-versus-cable wording, a complete save prompt, and configured-versus-saved priority wording.

Independent arithmetic and topology review covered subnet membership, interface addressing, VLAN/tag values, PoE allocation, bundle capacity and STP root/path decisions. For the STP triangle, verified baseline root costs 0/4/8, the direct-cost-2 change, failure costs 19/23, and the new-root costs 4/8. These are analytical checks of the stated topology, not device-execution results.

## Progress compatibility

Chapter identities, numbers and order are unchanged. Renamed or reordered sections keep their previous reading IDs through a validated frontmatter map. The two newly distinct sections have new IDs; merged sections and assessment retirements are documented in the reports. Stored progress is preserved. Reading and lab counts now intersect saved IDs with current items and ignore duplicates or retired IDs. Reading totals match the sections that actually have checkboxes; the Learn tab still includes all teaching sections. Materially revised labs should be worked through again; old step checkboxes do not establish that the new procedures were completed.

## Verification

- `verify.mjs`: passed, including all 46 chapter identities, earlier prerequisite references and internal lesson chapter links. Rendered 2,073 lesson, lab, assessment and output fragments through the actual application components; checked answer indices, complete distractor explanations, unique assessment IDs, sequential lab steps and expected observations.
- The first-eight rendering check still passes: 1,905 fragments.
- Whole-course content validation: zero errors. There are no warnings in chapters 08–15. The remaining 105 warnings comprise 19 deliberately untagged setup/model questions and 86 unresolved source/platform notes in later chapters. Those notes remain visible to future authors rather than being silently treated as verified.
- Browser checks covered all 40 chapter study views (learn, lab, checkpoint, cards and drills) and all 17 revised tickets. Correct titles, full question/step counts and nonempty content loaded, with no page-wide horizontal overflow or captured console errors/warnings. A saved anchor for a renamed and moved section scrolled to the correct content and transferred focus.

- Application regression suite: all 32 tests passed, including the new stable-heading and retained-history cases. TypeScript checking passed. The final production build passed; Vite still reports its size advisory for existing large application/practice bundles. This content batch does not claim to remove that performance advisory.
- After the final build, tested reading progress across a reload and on the chapter list/dashboard, saved lab progress, correct checkpoint feedback with distractor explanations, flashcard reveal, command grading and ticket diagnosis/repair display. The secure-access chapter correctly reports one of seven checkable sections while retaining eight teaching sections. No console errors/warnings were captured. All interaction data stayed on the separate local test origin, not the user's normal app origin.

## Limits and remaining scope

No Packet Tracer, CML or physical-device lab was executed in this authoring pass. Commands, addressing, state changes and expected results were checked against documentation and each other; platform notes and paper alternatives identify where simulator behavior is not established. This is not a claim of tested hardware output or a guarantee of an exam result.

The detailed content audit is complete through chapter 15. Chapters 16–45 have received structural adjustments only in this batch and still require their full content audits, particularly the secure-transfer and current automation workflows identified in the structure report.

The user's colors and styling were preserved. Changes remain local; this batch was not published, committed or pushed to GitHub.
