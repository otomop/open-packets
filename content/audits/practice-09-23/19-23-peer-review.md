# Independent peer review: Chapters 19–23

Completed 20 September 2026 by the reviewer responsible for Chapters 14–18, independently of the author of 19–23. This was a read-only content review; the author applied the bounded corrections below.

## Coverage

Read every final question, option, key, explanation and distractor explanation, every flashcard, command task/answer/note, both tickets in each chapter, and every complete lab setup, step, expected result, fault, recovery, fallback and independent challenge. Reread the specific corrections after they were saved. The review also checked relevant lesson/frontmatter context for scope and primary references; it was not a second full rewrite of the lesson prose.

| Chapter | Questions | Cards | Drills | Tickets | Final foundation / application / analysis |
|---|---:|---:|---:|---:|---|
| 19 IPv6 addressing | 29 | 26 | 11 | 2 | 8 / 21 / 0 |
| 20 Static routing (IPv6) | 26 | 20 | 8 | 2 | 6 / 18 / 2 |
| 21 OSPFv2 | 30 | 26 | 14 | 2 | 6 / 18 / 6 |
| 22 OSPFv3 | 23 | 20 | 10 | 2 | 5 / 15 / 3 |
| 23 HSRP and VRRP | 20 | 18 | 3 | 2 | 5 / 14 / 1 |

These are descriptive inventories, not target quotas. In particular, Chapter 19 does not need a nominal analysis item when its final questions ask for foundational recognition or direct application of known addressing rules.

## Findings resolved and reread

1. **19, ipv6-addressing-q24:** changed demand from 3 to 2. The exhibit explicitly supplies router lifetime zero and a usable autonomous prefix. Applying their separate meanings is an application task; it does not diagnose competing unexplored causes. Correct answer and feedback were already technically sound.
2. **20, static-routing-ipv6-q25:** changed demand from 3 to 2. The exhibit expressly says R2 lost its sole reverse route, so selecting a usable backup return route is a direct application. This matches the corresponding demand standard used in Chapter 18.
3. **22, ospfv3-q16:** changed demand from 3 to 2. Complete relevant interface configuration directly shows missing OSPFv3 activation on the up, addressed passive LAN. The repair applies the activation/passive distinction.
4. **21, ospfv2-t02:** removed the duplicated word in “mask on on R3 only.” The answer, causal comparison and repair remain unchanged.
5. **22, ospfv3-q25:** replaced the implausible proposal to set router IDs to an IPv6 prefix with a meaningful mistaken diagnostic action: enabling Hellos on the passive client LAN before checking activation. Feedback now explains why an activated client LAN can remain passive. This case still asks what to inspect before asserting an unproven unique cause.

All five edits were read from the saved files. The author regenerated the decisions ledger and reported its restricted identity/render verification passing. This reviewer did not modify the author's chapter files.

## Technical and practical conclusions

No remaining actionable technical error, incorrect key, ambiguous correct alternative, or reproducibility blocker was found in the reviewed content.

- **IPv6 addressing:** valid text is distinguished from canonical text; tied zero runs, trailing hexadecimal zeros, non-nibble prefixes, /56-to-/64 allocation, U/L-bit inversion and solicited-node suffixes agree with the explanations. The lab calculates from the actual operational MAC instead of treating an example MAC as measured output. Manual host settings isolate the forwarding-disable test from old SLAAC state. The fresh challenge adds a fully addressed third LAN and uses only the router's existing direct routing.
- **IPv6 static routing:** each link-local next hop retains its local interface scope. The intentional wrong /128 points to an address absent from the selected link, stays separate from the healthy covering /64, and is repaired in a distinct step. Return-route dependencies and differing router/PC sources are explicit. The new loopback host service has complete primary/standby configuration, a both-direction failure check, recovery and cleanup. Default-based recursion is not assumed.
- **OSPFv2:** the cold setup controls startup order rather than pretending an existing DR/BDR election is fresh. Route calculations include outgoing interface costs and the destination LAN. A direct timer fault can be hidden by the working shared path; the lab requires the actual adjacency check. The new /26 client LAN is activated while remaining passive. The directional-cost challenge accounts for the indirect R1-through-R3 route to the new R2 LAN as well as the requested LAN-30 result.
- **OSPFv3:** protocol identity, neighbor interface ID and scoped next-hop address are kept separate. Classic syntax and the optional address-family translation are not pasted together as one migration. The Full-neighbor/missing-LAN test removes only LAN activation, then restores it; global addressing-plan correctness is not inferred from link-local adjacency. The new /64 LAN and asymmetric cost challenge are complete. OSPFv3 is explicitly a v2.0 objective and additional practice for v1.1.
- **FHRP:** the chapter has only three operational display drills, consistent with its interpretation outcome. The supplied HSRP build includes independent routed uplinks and a valid OSPF return path, so an election is not mistaken for end-to-end success. The LAN-failure and tracking tests preserve separate observation/recovery. The optional tracking path distinguishes legacy interface and object syntax and permits a paper fallback. VRRP IPv4 and IPv6 summaries remain independent; ownership, preemption and effective priority are read in their actual context.

## Independent source and arithmetic checks

Targeted primary-source checks confirmed the claims most likely to cause subtle mistakes:

- [RFC 5952, canonical IPv6 text](https://www.rfc-editor.org/rfc/rfc5952.html): longest run, leftmost tied run and distinction from merely valid alternatives.
- [RFC 4861, Neighbor Discovery](https://www.rfc-editor.org/rfc/rfc4861.html): router lifetime zero excludes default-router service without invalidating independently timed prefix information.
- [RFC 5340, OSPF for IPv6](https://www.rfc-editor.org/rfc/rfc5340.html): link-local protocol operation, neighbor interface identifiers and /128 advertisement of Loopback-state addresses.
- [Cisco HSRP configuration](https://www.cisco.com/en/US/docs/ios-xml/ios/ipapp_fhrp/configuration/15-0s/fhp-hsrp.html): equal-priority arrival with a higher address does not preempt a healthy Active router merely because of that address.
- [Cisco HSRP preempt and tracking](https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/13780-6.html): tracking reduces effective priority; the takeover peer needs the appropriate preemption behavior.
- [RFC 9568, current VRRPv3](https://www.rfc-editor.org/rfc/rfc9568.html): owner priority 255, normal non-owner priority 100, separate IPv4/IPv6 behavior and Active/Backup terminology.

A separate Node calculation passed **31 assertions** covering /60-/61 masking, allocation membership, canonical address equivalence, third/fourth /64 allocation, both EUI-64 examples including a first-byte 02, solicited-node groups, subnet counts, and an independently modeled directed OSPF graph for both changed-cost challenges. The graph includes a shared-segment node and tests indirect alternatives, not only the displayed direct sums. HSRP decrement and hold-time arithmetic was also checked. Root separately owns the broader batch numerical/integration checks.

## Limits

No Packet Tracer, CML or hardware execution was performed by this reviewer. The review establishes source-supported protocol reasoning, internal configuration/topology consistency and answer semantics, not empirical simulator feature support or measured convergence. Unsupported commands and paper alternatives remain explicitly marked. Rendering, state/progress integration, source-file protection and browser verification are root's independent responsibilities.
