# Verification of the whole-course coherency pass

Completed September 24, 2026 on the local project. These results cover the final authored content, including the independent review corrections. They supplement the chapter-by-chapter editorial review; they do not establish teaching quality by themselves.

## Executed checks

| Check | Result |
|---|---|
| `npm run typecheck` | Passed. |
| `npm test` | 33 passed; 0 failed, skipped or cancelled. Covers course assets, rendering, routing and learning state. |
| `npm run build` | Passed; 46 chapters; 0 content errors. |
| `node content/audits/coherency-00-45/verify.mjs` | Passed for all 46 chapters and 274 reviewed source files. |
| Content rendering | 14,073 lesson, lab, exhibit and study-bank fragments rendered with the application's actual components. |
| Identity preservation | Chapter numbers, section IDs/order, lab-step IDs/order and all 2,335 practice IDs/order match the pre-pass working tree. |
| Review coverage | Each chapter has entry knowledge, its own teaching, practice demands and later uses recorded. Listed prerequisite and entry-section references point to earlier chapters; section anchors exist. |
| Protected files | All 257 captured application, style, configuration, historical audit and other protected files match their pre-pass hashes. |
| Course index | All 46 prerequisite cells in `content/CHAPTERS.md` match the final chapter metadata. |
| Practice changes | Exactly six existing items differ from the pre-pass banks; every change is explained in `practice-changes.json`. No items added, removed or reordered. |
| Whitespace | Git's diff check passed with CRLF line endings recognized correctly. |

The build retains ten existing missing-objective warnings in orientation and network-model questions. These are foundational questions without direct blueprint tags. Vite also retains its large-bundle warning. This coherency pass does not claim a performance improvement or remove those warnings.

An initial sandboxed build could not access a parent directory needed by the build tool. The local build succeeded with the approved filesystem access. Subsequent builds also passed.

## Browser verification

Used the freshly built local app at `http://localhost:4196/` in a separate, temporary browser tab. This separate origin kept testing away from the user's saved progress at port 5173. Reloaded after rebuilding before checking the final practice content.

- Opened all 46 lesson routes and waited for the lesson article, rather than treating the immediately available chapter heading as completion. Every page had a populated article and working lesson-section anchors.
- Opened all 46 guided-lab, 46 checkpoint and 46 flashcard routes. Every view loaded its expected lab steps, question cards or flashcard component.
- Opened all 46 command-drill routes. The 45 chapters with drills loaded their command interface. Chapter 43 correctly displayed its intentional empty state.
- Across these 230 chapter views, no document-level horizontal overflow was found at the checked browser window size. This is a route/rendering check, not a complete responsive-layout audit.
- Selected an incorrect response on the revised chapter 29 backup question and checked its answer. The feedback correctly distinguishes the active configuration from the older saved source and does not assume the unspecified local save destination.
- Opened and flipped chapter 38's revised AES-CCMP card. The displayed answer explains encryption, integrity and the distinction from authentication without demanding untaught cipher internals.
- Checked chapter 42's lab solutions were initially closed, opened the `collect.yml` solution, and confirmed the worked file was displayed. Visually inspected the resulting lab page.
- The browser's captured warning/error log was empty at the end of the route checks.

The lesson-page checks used the final lesson text. The last rebuild changed only the already revised chapter 29 question's feedback, which was then checked interactively in the browser.

The temporary audit tab and port-4196 server were closed after testing. The user's existing local-app tab and service were left running.

## Change boundaries

Against `baseline.json`, 62 existing files changed: 45 lessons, 10 labs, three question files, three flashcard files and `content/CHAPTERS.md`. The audit records are new files. `changed-files.json` lists the exact source paths. This comparison uses the working tree captured at the start of this pass, so it does not confuse earlier uncommitted practice work with new coherency edits.

The course retains 996 questions, 879 flashcards, 366 command drills and 94 troubleshooting tickets. Application code and styles were unchanged. Existing progress identifiers were preserved. No commit, push or deployment was performed; the removed Pages workflow remains absent.

## Limits

All 274 existing chapter, lab and practice-bank source files were read during the editorial audit. The independent peer reports describe their additional review scope. The resulting dependency map is a practical record of the course's knowledge progression, not a proof that every possible learner already understands every prerequisite.

Packet Tracer, CML, physical devices, VM services and optional platform exercises were not executed during this pass. Their instructions and expected evidence were reviewed for sequence and consistency. Browser rendering and source validation cannot establish device-command compatibility or end-to-end lab behavior on every supported version. Existing distinctions between required practice, supplied setup and optional platform work remain in the course.

See [verification.json](verification.json) for machine-checkable counts, the [dependency map](DEPENDENCY-MAP.md) for teaching references, and the [audit overview](README.md) for the editorial findings.
