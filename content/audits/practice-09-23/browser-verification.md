# Browser verification: practice 09–23

Executed 20 September 2026 using the local production build in an isolated browser origin at `http://127.0.0.1:4175/`. This record concerns the application, not the execution of networking devices. No learner state on the usual local-app origin was reset or modified.

## Coverage

Visited all five chapter views for each numbered chapter 09–23: Learn, Guided lab, Checkpoint, Flashcards and Command drill. All **75 views** displayed the correct chapter and active tab. Navigation counts agreed with the final content inventory; checkpoints displayed all **363 questions** and labs displayed all **160 steps**. There was no document-level horizontal overflow at the browser's normal viewport. This was not a separate full responsive-layout audit.

All **31 troubleshooting tickets** displayed the expected exhibits and four answer options, with diagnostic feedback hidden before submission.

| Chapter | Lab steps | Closed solution disclosures | Ticket exhibit counts |
|---|---:|---:|---|
| 09 | 10 | 2 | t03: 2; t02: 2 |
| 10 | 10 | 2 | t01: 3; t02: 3 |
| 11 | 12 | 1 | t01: 3; t02: 3 |
| 12 | 9 | 2 | t01: 3; t02: 3 |
| 13 | 9 | 2 | t01: 4; t02: 3 |
| 14 | 9 | 1 | t01: 2; t02: 2 |
| 15 | 11 | 1 | t01: 3; t02: 3; t03: 3 |
| 16 | 14 | 2 | t01: 2; t02: 3 |
| 17 | 10 | 4 | t01: 3; t02: 2 |
| 18 | 12 | 1 | t01: 2; t02: 2 |
| 19 | 10 | 2 | t01: 2; t02: 2 |
| 20 | 14 | 1 | t01: 3; t03: 3 |
| 21 | 9 | 2 | t01: 2; t02: 2 |
| 22 | 9 | 3 | t01: 2; t02: 2 |
| 23 | 12 | 2 | t01: 2; t02: 2 |

## Exercised interactions

- **Spanning-tree q23:** submission stayed disabled with zero or one selection, then accepted the two correct selections. Correctness, explanation and wrong-option feedback used the displayed shuffled answer letters consistently.
- **FHRP t02:** selecting incompatible HSRP versions and diagnosing the ticket produced the expected root-cause confirmation and complete repair/retest feedback.
- **FHRP d12:** `show vrrp brief` was accepted and the explanatory note appeared.
- **IPv6 flashcards:** Space revealed the back and changed the front/back visibility attributes correctly. Rating Good recorded a future review and advanced to the next card.
- **Routing-table lab:** all four disclosures began closed. Enter and Space opened the selected solution. A checked step survived a reload after the chapter finished loading; the test checkmark was then cleared. Solution disclosures returned to their initial closed state on reload.
- **Visual inspection:** the expanded routing-table challenge rendered readable addresses and tables in the existing dark layout, retaining the established colors and keyboard focus indication.

## Final-build confirmation

After the final peer corrections, rebuilt the app, reloaded the preview and inspected fresh page content. Confirmed the two-active-diamond difficulty indicator for `ipv6-addressing-q24`, `static-routing-ipv6-q25` and `ospfv3-q16`. Confirmed the revised passive-client-LAN alternative in `ospfv3-q25`, removal of the duplicated word in `ospfv2-t02`, and the explicit paper-workflow continuation in the EtherChannel third-member challenge. Counts and answer keys did not change in those last refinements.

The preview's captured warning/error log was empty after these checks. Browser verification checks rendering and selected workflows; it does not mean every possible answer combination, browser, viewport or simulator was tested. Full content semantics were reviewed separately, and all rendered fragments were checked by the saved automated verifier.
