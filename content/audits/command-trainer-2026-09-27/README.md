# Command trainer audit — 27 September 2026

**Historical report.** The user rejected the duplicated teaching and requested a stricter relevance review. The subsequent [chapter-by-chapter command relevance audit](../command-relevance-2026-09-27/README.md) supersedes this report's bank selection, walkthrough, practice modes, teaching schema, screenshots and counts. The bounded answer matcher and first-attempt safeguards remain. Retaining all 366 items in this initial pass did not adequately establish that each belonged in command-recall practice.

## Scope

The command trainer, its chapter-embedded version, answer matcher, and all 366 command exercises across the course. Existing command IDs are retained so saved practice remains associated with the same exercises. Chapter 43 has no CLI exercises: inventing syntax drills for its AI concepts would not improve exam preparation.

Content was checked against the owning lessons, labs, selected-track objectives and vendor references. See [foundations and routing](foundations-routing.md) and [services, security and automation](services-security-automation.md) for the chapter-level decisions and primary sources.

## Findings and changes

1. **The original default mixed every chapter.** New learners could encounter advanced syntax before learning its purpose. The default is now guided practice in chapter teaching order, starting with six introductory commands. Memory practice is a separate choice. Cross-chapter review uses at most 15 previously attempted commands from chapters in the selected track, ordered by weaker saved accuracy and then older practice.
2. **Help consisted of the first two answer words and a note after checking.** Every exercise now explains its purpose, initial mode and lab assumptions, each syntax component, and a meaningful verification command with expected evidence. The current exercise has its own progressive walkthrough and full explanation. Verification text describes what to look for; it does not fabricate executed output.
3. **Names and secrets could be abbreviated or lowercased.** The matcher now distinguishes command keywords, supplied arguments and actual interface identifiers. It preserves supplied literal values and quoted content, scopes interface aliases to interface positions, and separates IOS from Windows, PowerShell, Linux and macOS matching. Explicit alternate forms remain bounded. Feedback identifies missing/extra components, incorrect values, prompt inclusion and mode mistakes without repeating secret values.
4. **Some accepted alternatives returned a different scope of output.** Broad all-port or full-VLAN displays were removed where the exercise expressly requests a specific port or brief output. Platform labels and lab addresses/prompts were corrected where needed. Optional IOS XE, controller and host tools are identified rather than implied to work universally in Packet Tracer.
5. **Practice could continue indefinitely and repeated submissions could distort scores.** Rounds now end with first-check results, guidance use, skips, unattempted items and repair outcomes. Synchronous guards prevent duplicate first checks. Corrections preserve the original result. Returning to an exercise retains its draft/result; selecting another chapter or practice style deliberately starts a fresh round.
6. **Exam depth varies by track.** Supporting lab skills have a visible label. Track-specific overrides distinguish deeper v2.0 configuration from v1.1 conceptual requirements where appropriate. Chapters outside the selected track are labelled optional. Core includes prerequisite CLI fluency used in tested tasks; it is not a claim that Cisco publishes an exhaustive list of possible command strings.
7. **The trainer was disconnected from its teaching context.** Links open the exact related lesson section and chapter lab in another tab. Chapter sources remain available beside the exercise. The trainer explicitly states that it does not execute commands and that each exercise has its own initial state; actual configuration and troubleshooting practice belongs in the labs.

## Verification

Automated checks cover every canonical answer and explicit alternative, literal/quoted-value safety, platform-specific matching, interface aliases, incomplete commands, mode feedback, authored syntax reconstruction, lesson anchors, required teaching fields and per-track focus values. UI checks cover duplicate/blank submissions, repairs, revisits, assistance, finite rounds, review ordering, walkthrough bounds and remounts, lesson links and track changes.

Browser checks use an isolated local preview so they do not write test attempts to the user's normal app origin. They cover guided and memory practice, corrections, accepted IOS abbreviations, exact supplied names, native-shell options, round summaries, chapter navigation, exact lesson-section navigation and responsive layout. A native button-reuse issue discovered during these checks was corrected by giving the repair and submit controls distinct identities.

The teaching bank and trainer styles remain lazy-loaded. Existing course colors are retained. No deployment, commit, push, progress reset, or external CLI execution is part of this work.

Final results:

- `npm test`: 150 tests passed. The final literal-space matcher change also passed its 34 targeted engine/UI tests afterward.
- `npm run typecheck`: passed.
- `npm run build`: passed, including every command's teaching validation. The course validator retains 10 pre-existing foundation-question objective warnings and no errors.
- The matcher accepts all 366 canonical answers and 61 explicit alternatives. It rejects 687 mutations of supplied values, case or interface numbers, and accepts 31 scoped interface aliases.
- Desktop checks at 1440 × 1000 and mobile checks at 390 × 844 found no horizontal overflow, including the long quoted curl command. The related lesson opened at its correct section with keyboard focus. Final local-app console inspection reported no warnings or errors.
- The lazy command trainer and complete teaching bank are 124.73 kB gzip; its separate stylesheet is 1.45 kB gzip. Initial application JavaScript remains approximately 167.77 kB gzip. Vite reports its advisory raw-chunk-size warning for the trainer and the existing application/practice chunks; these are build warnings, not test failures.
- Saved visual checks: [desktop walkthrough](desktop-walkthrough.png) and [mobile walkthrough](mobile-walkthrough.png).

## Limits

This is a teaching matcher, not an IOS parser or terminal emulator. Accepted abbreviations are intentionally bounded; platform/image ambiguity belongs to the actual device's contextual help. Equivalent address spellings, alternative quoting and additional valid command grammars are accepted only where explicitly represented, rather than inferred from strings that might be passwords or filenames. Saved historical totals combine guided and memory checks; assistance is distinguished within the current round, and those totals are not an exam-readiness measure. Live device behavior still needs the chapter lab on the documented platform.
