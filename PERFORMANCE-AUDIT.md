# Local app performance and quality audit

**Date:** 19 September 2026. **Baseline:** commit `3535ef0` of the rebuilt Vite/React app in `ccna guide`. The legacy app and hosted site were outside this audit. Course accuracy corrections remain a separate workstream.

## Findings and changes

| Priority | Finding | Resolution and evidence |
| --- | --- | --- |
| High | Desktop panels trapped the mouse wheel at their boundaries. | Removed `overscroll-behavior: contain` from the desktop sidebar, contents list, and tools rail. An identical two-page wheel gesture over the sidebar left the baseline document at **0 px** but moved the updated document to **1,440 px**. Mobile modal containment remains intact. |
| High | Opening the dashboard downloaded the entire course and every exercise bank. | The initial load now contains a lightweight course catalog. Lessons/labs load by chapter; practice, flashcards, commands, and tickets load when opened. All authored content and progress identifiers are preserved. |
| Medium | Chapter mounting forced every section into layout to measure its height; fonts and resizing repeated the work. | Removed the measurement pass and estimated content heights. Normal document flow gives stable anchors and consistent scroll positions. The longest tested lesson and lab retain their exact original heights. |
| Medium | Study updates notified broad subscribers and repeatedly recalculated mastery. A 60-question exam emitted 62 updates. | Added selective subscriptions, dependency-aware mastery caches, memoized Markdown/diagrams, no-op guards, and atomic exam results. The same exam completion now emits **one update**. |
| Medium | Delayed page transitions and fixed-delay search jumps could target stale pages. | Newer navigation cancels older transitions and section jumps. Search waits for the correct chapter and target element. Switching chapter tabs resets scroll; changing only a filter preserves it. |
| Medium | Ticker work continued when it was hidden; restarting read computed transforms. | Pause the ticker while hidden, offscreen, covered by the mobile drawer, or in a background tab. Removed repeated transform reads and redundant scroll-state updates. Reduced-motion controls remain supported. |
| Medium | Fonts required Google-hosted requests before the intended typography appeared. | Self-hosted the same three font families. Two primary faces are preloaded; the rest load as needed. The 12 WOFF2 assets total 293,024 bytes. Licenses, source URLs, and checksums are included in `public/fonts/`. |
| High | A pending save could be lost on closing; malformed imports could break the app; tabs could overwrite each other's progress. | Flush pending saves on lifecycle events, validate imports before replacement, preserve unreadable stored data, detect conflicting tab edits, and show actionable save failures. Valid version-1 backups remain supported. |
| Medium | Every checkpoint question listened to the same keyboard event. Reviewed cards could stay in the due queue. | Scope shortcuts to the focused question; guard duplicate submissions. Reviewed cards leave the due queue until their scheduled time, including Again's ten-minute delay. New-card allowances persist across sessions. |
| Medium | Copying IOS snippets included teaching annotations. Some malformed lab files were silently treated as absent. | Copy uses the same annotation normalization as rendering. Invalid or unreadable authored labs now fail validation with their path. |
| Medium | Network diagrams exposed a title but not the relationships they depicted. | Added linked, uniquely identified descriptions of nodes, connections, packet paths, participants, and message order without changing the visuals. |

The scroll fix follows the browser's documented distinction between normal scroll chaining and `contain`, which prevents an ancestor from receiving the gesture: [MDN overscroll behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior). Deferred screens use [React lazy loading and Suspense](https://react.dev/reference/react/lazy), with a recovery screen for failed local asset loads.

## Measured results

The original production build was preserved before editing. Both versions were served locally with the same opt-in profiler in the same Chromium-based desktop browser. Desktop viewport: **1,280 × 720**. This machine produced roughly 144 animation frames per second. Separate test origins protected the regular app's saved progress.

| Metric | Baseline | Updated measurement |
| --- | ---: | ---: |
| Initial JavaScript, uncompressed | 4,047,212 bytes | **589,497 bytes — 85.4% less** |
| Initial JavaScript, gzip estimate | 1,227,501 bytes | **162,395 bytes — 86.8% less** |
| Capstone lesson, 95th-percentile frame interval | 7.1 ms | 7.0 ms |
| Capstone lab, 95th-percentile frame interval | 7.1 ms | 7.0 ms |
| Frames over 50 ms during either six-second scroll sample | 0 | 0 |
| Long tasks during either scroll sample | 0 | 0 |
| Layout shifts during either scroll sample | 0 | 0 |
| Capstone lesson document height | 27,052 px | 27,052 px |
| Capstone lab document height | 26,612 px | 26,612 px |

The baseline's main reading surface was already smooth on this hardware. **The reproduced sticking was a scroll-boundary behavior problem, not evidence of uniformly low frame rates.** Startup payload reduction and fixing blocked wheel gestures are the strongest improvements. No claimed frame-rate multiplier follows from these measurements.

The profiler scrolls the full document for six seconds using `requestAnimationFrame`, records frame gaps, observes long tasks and layout shifts, and checks actual against requested scroll position. The separate wheel-gesture check exercises the sidebar behavior that scripted document scrolling cannot test. All four document samples had zero measured scroll-position error. Maximum frame intervals were 27.8/7.2 ms in the baseline lesson/lab and 20.9/34.9 ms after the changes; isolated maxima vary with system activity and are not a meaningful speed ranking.

Gzip figures are reproducible compressed-size estimates, not claims that the local server transfers compressed files. Browser paint timing was inspected, but no startup-time percentage is claimed: warm caches, different dashboard progress, and local scheduling prevent treating those single runs as a controlled loading benchmark.

The scroll samples were taken after the loading/scroll/render fixes, before the final non-layout accessible-description changes. Those final changes passed the complete regression suite and production browser smoke check. The original color palette is preserved; future palette changes require an explicit owner request.

## Verification

- TypeScript, **all 27 regression tests**, and the production build pass.
- Regression coverage checks content parity, CLI rendering/copying, authored-file errors, routing races, lazy section targets, storage failures and conflicts, atomic practice results, keyboard scope, flashcard scheduling, mastery cache invalidation, and accessible diagram descriptions.
- Reconstructing the split assets exactly preserves **46 chapters, 420 sections, 46 labs, 696 questions, 922 cards, 502 commands, and 88 tickets**. Course source files were not rewritten.
- All 92 lesson/lab views were server-rendered during inspection; the capstone lesson/lab received production browser scroll tests.
- Browser checks covered all main routes, search into an unloaded DHCP section, checkpoint answering, a graded flashcard advancing the queue, settings surviving immediate reload, dark/light appearance, and reduced motion.
- At a 390 × 844 viewport, the chapter index and long lab have no document-level horizontal overflow. Wide command output retains its own scrolling area. Opening the mobile menu locks document scrolling; Escape restores it.
- The exercised production routes produced no browser warning/error logs.
- Dependency audit reported **zero known vulnerabilities** in the installed production/development dependency graph. No dependency versions were changed; this is not a guarantee against unknown vulnerabilities.
- Content validation reports **0 errors and 127 existing warnings**. These include unverified platform-specific command behavior and missing objective tags. They were preserved for the upcoming content review.

## Remaining limits and priorities

1. The first practice/checkpoint visit still loads the complete question bank (about 952 KB uncompressed). It is off the startup path. Vite still flags that bank and the 589 KB entry as over its default 500 KB chunk threshold; the warning is retained. Per-chapter question chunks and further catalog splitting could reduce them if measurements on a slower target device justify the extra loading complexity.
2. The app stores progress in browser storage. It does not yet synchronize devices or provide automatic disk backups. Conflicting simultaneous edits are surfaced for export/recovery rather than silently merged. Settings contains manual backup and recovery controls.
3. This is a local browser app served by Node, not an installed desktop executable. The optimized local server must remain running. Reading content and fonts work without external services; external learning/source links still require internet access.
4. This audit used one desktop Chromium environment and a resized viewport. It is not a Lighthouse score, field INP/Core Web Vitals study, CPU-throttled mobile benchmark, screen-reader certification, or real-device Safari/Firefox test. Long-task and layout-shift observations apply to the exercised runs, not every future device/session.
5. Runtime Markdown is authored within this repository. If remote or user-authored HTML/Markdown is introduced later, its rendering trust boundary needs a separate sanitization review.
6. The original colors are retained as requested. Contrast measurements identified some small-text combinations below 4.5:1 (for example, blue text on dark panel backgrounds measures roughly 3.46–3.75:1). This is an audit observation, not an implemented design change or a claim of full WCAG conformance.

## Run and reproduce locally

Use `npm ci` once, then `npm start` for everyday study at **http://localhost:5173**. The production build removes development instrumentation; [Vite's production build guide](https://vite.dev/guide/build.html) explains this build path. Stop an existing local server first so the port and saved-progress origin stay consistent.

```sh
npm run typecheck
npm test
npm run validate
npm run perf:bundle
```

For browser sampling, stop the ordinary server, run `npm run perf:profile`, and open `http://localhost:5173/?audit=1`. Navigate to the capstone lesson and lab and use **Run scroll sample**. To reproduce the wheel test, place the pointer over the left sidebar and scroll downward. The diagnostic overlay is opt-in and is never included in the production app.

Keep using `localhost:5173` in the same browser profile. Another hostname, port, or browser has separate storage. See `README.md` for backup/import and local startup details.
