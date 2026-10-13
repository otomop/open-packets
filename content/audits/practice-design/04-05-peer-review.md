# Independent review: IPv4 addressing and subnetting

Reviewed 20 September 2026 by the integrating reviewer, independently of the chapter author. Scope: all 52 final checkpoint questions, answer choices, keys and feedback; all 46 cards, 15 drills and four tickets; both complete labs, setup tables, fault/recovery steps and independent challenges. This review assesses written practice and configuration/address consistency; no simulator was executed.

## Findings resolved

- **Unrealistic alternatives:** replaced distractors implying that a ping changes a host's mask, that a private block permits only one interface, or that a /24 can contain only two LANs. The replacements test actual misconceptions about host range, gateway selection and overlap.
- **Inflated difficulty:** straightforward plan mismatches, known proxy-ARP behavior and a supplied host-address correction are application. Calculations are not recall. The final distributions follow the actual reasoning instead of forcing the planned number of analysis questions: 04 has 6/14/4; 05 has 4/20/4.
- **Within-level progression:** the IPv4 checkpoint begins with address structure and prefix meaning, then gateway/broadcast and verification concepts, before /31 and /32 exceptions. Bitwise AND introduces the calculation sequence before block-boundary examples.
- **Overloaded cards:** the /25–/30 tables and third-octet catalog became representative, focused cues. VLSM private-range and summary cues were narrowed; private routing no longer shares one prompt with the separate NAT/firewall distinction. The host-bit rule precedes derived capacity examples.
- **Answers exposed before calculation:** completed lab addressing tables now appear after the learner's first worksheet. A browser integration check found that ordinary expected-result boxes were still visible; the two initial worksheets and both independent challenges now use the opt-in closed `solution` disclosure. The VLSM topology no longer gives away each required prefix. IPv4's supplied host/prefix values remain legitimate inputs to boundary calculations.
- **Independent evidence:** both labs now require predictions, actual settings/results, a working baseline before faults, and a separately saved changed-address challenge. A reserved subnet is explicitly distinguished from an observed connected route. The VLSM challenge specifies lowest available aligned placement so its free-space answer is unambiguous.
- **Complete retesting:** the IPv4 gateway-repair step repeats every destination used during the fault, including the actual local router address.

## Technical checks

The written review recalculated subnet boundaries, directed broadcasts, ordinary usable capacities, gateway assignments, parent/child counts, exact versus containing summaries, containment, overlap and changed-mask decisions. Ticket evidence specifies host masks, local router addresses, relevant route/interface state and proxy-ARP conditions where these affect the diagnosis. Fixes preserve the intended addressing plan and require service-path retests.

The independent [integer-range arithmetic check](addressing-checks.mjs) passed 50 assertions. These cover selected numerical checkpoint keys and alternatives, original lab allocations/free intervals, the rejected growth capacity, the valid new Operations range, and the independent challenge's allocations, broadcasts and extra growth requirement. This complements the full editorial read; it is not a claim that a script understands every question.

Chapter 04's third-LAN exercise correctly derives `10.7.16.0/21`, broadcast `10.7.23.255`, gateway `10.7.16.1` and 2,046 usable addresses from the supplied `10.7.19.77/21`. Chapter 05's original allocations consume 228 addresses, leaving 28; the enlarged requirements consume 292 and cannot fit the original /24. Its new Operations /25 and two-LAN challenge retain directly connected routing, avoiding an unintroduced static-route dependency.

The retained /31 exception is qualified for supported point-to-point links, and /32 is described as a one-address prefix with common uses rather than a mandatory loopback mask. A successful ping does not certify configured masks. Unsupported command variants have alternate ways to inspect the relevant settings.

No unresolved answer-key or written-procedure finding remained after the listed corrections. Execution on the named Packet Tracer models is still needed to establish actual simulator behavior and timing.
