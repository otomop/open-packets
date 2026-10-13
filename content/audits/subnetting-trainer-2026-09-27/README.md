# Subnetting trainer review

Reviewed 27 September 2026. The trainer needs to connect its calculations to the course's teaching, assess the representation requested, and give learners meaningful practice beyond changing the numbers in the same template. This report records the starting issues, instructional decisions, source checks and verification completed for this change.

## Starting findings

The review read the original [arithmetic and generators](../../../src/lib/subnet.ts), [trainer page](../../../src/pages/Subnetting.tsx), and relevant teaching in Chapters 04, 05, 19 and 34.

| Finding in the starting implementation | Effect on learning or grading |
|---|---|
| Six modes with largely fixed task structures and no selectable difficulty | Random addresses changed the numbers more than the reasoning required. Equal-subnet counts, address-plan repair, IPv6 prefix boundaries and summary coverage were absent. |
| Yes/no grading used `startsWith(answer[0])` | An unrelated word beginning with the expected letter could receive credit. |
| IPv6 grading compared only expanded address values | A learner could submit the original expanded text for a compression task, or compressed text for a full-expansion task, and receive credit. |
| Same-subnet feedback said matching networks meant hosts could communicate directly | Membership arithmetic was treated as proof of connectivity, without the conditions of valid endpoints, a usable Layer 2 path and applicable policy. The first randomly generated address could also be a subnet boundary. |
| VLSM always used a /24 parent and a short, preordered list of familiar requirements | It provided little practice across octet boundaries or with differently sized parent allocations. |
| No method guide, independent worked example or lesson link for a selected mode | Incorrect answers led to a short result explanation without a clear route back to the relevant teaching. |

These findings describe the inspected starting code. They are not claims that every generated exercise was wrong.

## Instructional design

[subnet-guides.ts](../../../src/lib/subnet-guides.ts) supplies ten guides in a deliberate order: IPv4 boundaries and capacity; equal subdivisions; membership and repair; VLSM and summaries; ACL application; then IPv6 notation and prefixes. Each guide has four method steps, a separate four-step worked example, a common mistake, a narrow scope statement, and a verified chapter/section reference. The examples are fixed teaching examples rather than disclosures of the current random drill's answers.

| Mode | Teaching owner and stable section ID | Main distinction |
|---|---|---|
| Network & broadcast | [04: IPv4 addressing](../../chapters/04-ipv4-addressing/chapter.md), `network-broadcast-and-usable-hosts` | Clear all host bits, including complete octets beyond the boundary. |
| Size a LAN | [05: Subnetting & VLSM](../../chapters/05-subnetting-vlsm/chapter.md), `the-block-size-method-in-any-octet` | Count all required interface addresses, then select the longest fitting prefix. |
| Equal-size subnets | [05](../../chapters/05-subnetting-vlsm/chapter.md), `why-one-mask-never-fits-everyone` | Subnet count uses added prefix bits and does not subtract two. |
| Same subnet? | [04](../../chapters/04-ipv4-addressing/chapter.md), `why-the-mask-decides-everything` | Shared subnet membership is an arithmetic result, not proof of connectivity. |
| Repair an address plan | [04](../../chapters/04-ipv4-addressing/chapter.md), `verify-and-troubleshoot` | Compare actual settings with the intended design; use the router's actual interface as the gateway. |
| VLSM allocation | [05](../../chapters/05-subnetting-vlsm/chapter.md), `vlsm-allocate-largest-first` | Verify capacity, alignment, containment and nonoverlap separately. |
| Summarize prefixes | [05](../../chapters/05-subnetting-vlsm/chapter.md), `summarisation-keep-the-shared-bits` | A containing summary can include addresses outside the supplied networks. |
| ACL wildcard masks | [34: ACLs](../../chapters/34-acls/chapter.md), `wildcard-masks` | A wildcard compares address bits; it does not remove network or broadcast values from the matching set. |
| IPv6 notation | [19: IPv6 addressing](../../chapters/19-ipv6-addressing/chapter.md), `writing-an-address-without-making-a-mistake` | A valid address spelling can still fail a specifically requested canonical or fully expanded form. |
| IPv6 prefixes | [19](../../chapters/19-ipv6-addressing/chapter.md), `prefixes-and-how-big-a-subnet-is` | Retain the exact number of prefix bits, including boundaries inside a hexadecimal digit. |

The ordinary-LAN subtraction of two is explicitly separated from a supported /31 point-to-point link and a /32 single-address prefix. An allocation example uses a /22 parent and crosses a third-octet boundary. The IPv6 prefix example retains two bits within the final hexadecimal digit of a /62 and derives its four /64 children. Optional complexity does not turn address arithmetic into a claim of complete device configuration or troubleshooting competence.

## Exam scope and primary references

Cisco identifies v1.1 as the current exam through 2 February 2027 and v2.0 as available from 3 February 2027. Both topic documents and the transition dates were checked directly on Cisco's sites during this review. [Cisco transition guidance](https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh).

The [v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) supports IPv4 address/subnet configuration and verification under 1.6, IPv6 address/prefix work under 1.8, client IP-parameter verification under 1.10, and ACL configuration/verification under 5.6. These arithmetic exercises support those skills; they do not claim to complete each objective.

The [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) places IPv4 address/assignment/subnet troubleshooting in 1.3, IPv6 address/assignment/prefix sizing in 1.4, client connectivity troubleshooting in 1.6, and IPv4 ACL configuration in 4.6. Address-plan repair and prefix-boundary practice follow that emphasis. The trainer does not claim coverage of the complete IPv6 assignment or client troubleshooting objectives.

Summary mode remains supporting address-range and routing-table interpretation practice. It adds no claimed BGP or routing-protocol summarization requirement and provides no prediction of exam question frequency or pass probability.

Two protocol references govern important exceptions:

- [RFC 3021, sections 2.1 and 5](https://www.rfc-editor.org/rfc/rfc3021): the two addresses in a /31 can serve as endpoints on a supported point-to-point link; this is not a general rule for multi-device LANs.
- [RFC 5952, section 4](https://www.rfc-editor.org/rfc/rfc5952.html#section-4): canonical IPv6 text removes leading zeros, uses lowercase and chooses the longest zero run, with a leftmost tie break and no single-zero compression. Other legitimate IPv6 representations remain valid addresses even when they do not satisfy a notation exercise's requested form.

## Verification record

Completed for the guide data:

- Loaded the current course through its normal course loader and resolved all ten chapter/section references.
- Confirmed ten unique mode IDs and matching `guideByMode` entries, with four method and four example steps for each guide.
- Independently checked the worked IPv4 boundaries, subnet membership, gateway diagnosis, VLSM capacities/alignment/containment, summary range and wildcard range using inline arithmetic checks.
- Checked the /62 example's partial-hexadecimal-digit boundary and four-child subnet count; reviewed the IPv6 notation example against the expanded eight-group representation.

Final integration checks passed:

| Check | Result |
|---|---|
| Automated tests | **98/98 passed:** 56 engine tests, nine trainer UI tests and 33 existing regression tests. |
| Independent engine comparison | **1,980 generated problems** checked against independent arithmetic and grading expectations. |
| Type check | Passed. |
| Production build | Passed with zero content errors. The ten existing objective-tag warnings and existing large-chunk warning remain. |
| Browser mode coverage | All ten skills at all three difficulty levels: **30 desktop combinations and 30 combinations at a 390px mobile viewport**, without horizontal page overflow. |
| Browser console | No errors recorded during the checked flows. |

The final browser record is [browser-verification.json](browser-verification.json). [Desktop](subnetting-desktop.png) and [mobile](subnetting-mobile.png) images document representative final layouts. These are application browser checks, not executions of the linked networking labs.

The checked interactions included:

- A correct network calculation incremented the score once. An unrelated yes/no-like word was rejected.
- An equivalent IPv6 address in the wrong requested representation was rejected with specific feedback. Repairing it did not change the first-check score.
- The lesson link opened and focused the exact intended section in a separate tab, preserved the active problem and marked pre-check help as assisted.
- An empty explorer prefix produced an invalid-input message. The /31 and /32 cases displayed their respective exceptions.
- A controlled complete mixed review contained all ten distinct skills, with nine incorrect first checks, one skip and one assisted check. Ending another review immediately reported ten not checked, rather than ten skipped.
- Mobile grading and pointer-driven repair worked. Selected desktop pointer and keyboard paths also worked, including submission, repair, advancing, guide disclosure and review navigation.
- The final scroll correction placed the new problem card 80px below the top of the viewport, clear of the fixed header, across the mobile mode/difficulty checks.

Independent source review also checked first-check guards, repair/skip behavior, legacy progress keys, lesson-anchor navigation and subnet-scoped styling. The resulting fixes mark lesson/lab assistance before checking, label unfinished problems as not checked, describe the report's lifetime accurately, and bring new problems and results into view while transferring focus. Existing progress remains in the same storage structure; repair practice does not inflate first-check totals. The existing color palette is unchanged.

Initial automated pointer inconsistencies did not reproduce in the final fresh-build and mobile checks. Pointer coverage remains targeted, rather than a claim that every control was exercised on every device or browser.

### Loading cost

Arithmetic helpers and drill generators are now separated between [subnet.ts](../../../src/lib/subnet.ts) and [subnet-drills.ts](../../../src/lib/subnet-drills.ts), keeping the trainer's generation code in its lazy-loaded route. Final production measurements were:

| Asset measurement | Before | After |
|---|---:|---:|
| Initial JavaScript, bytes | 637,373 | 634,023 |
| Initial JavaScript, gzip bytes | 169,208 | 167,731 |
| CSS, bytes | 50,132 | 53,374 |
| CSS, gzip bytes | 10,357 | 10,932 |

The lazy trainer chunk is approximately 55.33 KB uncompressed and 19.15 KB gzip. These bundle measurements describe download and loading cost; no frame-rate, scrolling-speed or real-network timing improvement was measured or claimed.

No Packet Tracer, CML or physical-device lab execution is claimed by this trainer review. Arithmetic practice, source review and application tests support learning; they do not establish complete operational competence or guarantee an exam result.

## Follow-up: walkthroughs for the current problem

The learner requested that “Show me how it's done” explain the problem currently on screen. This follow-up replaces the sidebar's fixed method and separate example with an interactive walkthrough using that generated problem's `workedSteps`. The teaching can now refer directly to the learner's addresses, requirements and intermediate calculations.

The unused `steps` and `example` fields were removed from the guide interface and all ten guide records. Mode IDs, order, titles, descriptions, scope, pitfalls and lesson references are unchanged. A structural comparison confirmed that every retained property kept its exact text and order. This removes dead payload rather than leaving an unused second source of teaching in the bundle.

The verification results and bundle measurements above describe the earlier static-example implementation. The completed checks for this follow-up are recorded separately below; no new performance comparison is claimed.

| Follow-up check | Result |
|---|---|
| Full automated suite | **115/115 passed:** 68 engine tests, 14 UI tests and 33 existing regression tests. |
| Type check | Passed. |
| Production build | Passed with zero content errors; the ten existing objective-tag warnings and existing large-chunk warning remain. |
| Generated-problem preservation | **1,200 seeded problems** retained the same data hash when `workedSteps` and the derived `explain` text were excluded. The enhanced teaching did not change those problems' inputs, answers or grading metadata. |
| Browser coverage | All **30 mode/difficulty combinations on desktop and 30 at a 390px mobile viewport** displayed the current problem without horizontal page overflow. |
| Browser console | No errors recorded during the checked walkthrough flows. |

[walkthrough-verification.json](walkthrough-verification.json) records the browser results. The [desktop walkthrough](walkthrough-desktop.png) and [mobile walkthrough](walkthrough-mobile.png) images show representative final layouts.

The walkthrough's displayed prompt matched the active problem, and its completed answer labels matched the number of answer fields. Opening it preserved existing entries and the score while marking the problem as assisted. A representative six-step walkthrough advanced from step 1 through step 6, revealed the completed answers on the final step and disabled further advancement there. Pointer checks covered opening, advancing and showing all steps; keyboard checks covered previous, hide and reopen. The one-step and all-steps views used the same solution. Hiding and reopening retained the current position; loading a new problem reset the walkthrough to closed.

An independent teaching review checked mask place values, rounded boundary arithmetic, /31 and /32 exceptions, usable-address ordinals, VLSM alignment and ranges, summary coverage, IPv6 zero-run selection and ties, partial-digit prefix masks, and /64 allocation arithmetic. No correctness issue remained after review. These checks cover the current-problem teaching and interface behavior; they do not add any claim of networking-lab execution or guaranteed exam readiness.
