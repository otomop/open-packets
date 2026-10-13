# Chapters 04–05: practice progression review

Completed 20 September 2026. Scope: both labs, every question and explanation/distractor, every flashcard, command drill and ticket in `04-ipv4-addressing` and `05-subnetting-vlsm`. Lesson-body text was preserved. The only `chapter.md` edits are lab-time metadata, changed to 65 and 75 minutes to allow written predictions, guided configuration, verification and the independent variation. No application, style, dependency, build or deployment changes were made for this work.

The preceding [09–25 depth evaluation](09-25-evaluation.md) is a separate design report. It does not claim those later chapters were rewritten in this batch.

## Final workload and progression

| Chapter | Questions | Levels 1 / 2 / 3 | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|---:|
| 04 IPv4 addressing | 24 | 6 / 14 / 4 | 22 | 10 | 2 | 9 |
| 05 Subnetting and VLSM | 28 | 4 / 20 / 4 | 24 | 5 | 2 | 8 |

These are editorial demand levels, not measured learner difficulty, exam probabilities or pass predictions. Counts meet the agreed question/card plan; the final level mix deliberately differs from the provisional 6/12/6 and 4/16/8 mixes. Direct subnet calculations, comparison with supplied settings, and applying the supplied proxy-ARP mechanism are application. Relabeling them analysis to satisfy a ratio would overstate the work. The analysis items instead combine distinct constraints or limit conclusions from evidence.

Chapter 04 begins with four-octet structure, prefix meaning, gateway purpose and the broadcast rule. It then retrieves verification commands and the /31–/32 exceptions. Application begins with bitwise AND and mask/increment conversion, followed by network/broadcast, capacity, membership and configuration cases. The four final cases compare two endpoint mask decisions, reconcile a rejected change with retained configuration, distinguish successful traffic from verified settings, and assess free usable capacity under fixed assignments.

Chapter 05 begins with FLSM/VLSM, the modern child-subnet count and private-address interpretation. It applies the earlier address mechanics to child-subnet order across an octet boundary, reservations, two-endpoint /30 addressing, minimum parent size, exact remaining free blocks, and a gateway chosen at the last usable address. Its analysis cases cover overlapping nested allocations, fragmented free intervals, growth that changes the containing boundary, and comparison of complete plans against capacity, containment and overlap. The post-renumber host repair is application because the approved tuple is supplied.

## Item quality and coverage

All 32 original question identities remain attached to their original subject. Chapter 04 adds q18–q25; chapter 05 adds q18–q29. No unrelated question replacement inherits an old mastery identity.

- Chapter 04 q05, q07 and q15 now use application labels; q17's bitwise calculation is also application. q15's incorrect alternatives now offer plausible competing next-hop/ARP interpretations instead of a host changing its mask in response to an echo or joining a subnet during a ping. q24 tests the limits of local ping and brief-output evidence with plausible inference mistakes.
- Chapter 05 q04 changes a duplicate /20 example into a same-address /20-to-/23 boundary comparison. Its subject remains prefix calculation, so its ID is preserved. q08, q11 and q12 are application rather than artificially difficult diagnosis. q11 and q12's distractors now concern actual competing range/ARP decisions. q19's answer lengths were balanced after the validator flagged a conspicuously long correct choice.
- Existing questions retain useful progression from rules to application. Numeric variations were added only when they change the decision: crossing an octet when enumerating children, accounting for reservations, deriving a parent from required blocks, or requiring a last-usable gateway. The existing subnet trainer can supply repetition without a larger cosmetic bank.
- Chapter 04 c04/c05/c06 now retrieve one representative prefix each (/26, /29, /21), rather than three or four simultaneous table rows. New c25 retrieves host-bit count before the derived examples; c26 retrieves independent endpoint mask decisions.
- Chapter 05 removes repeated increment/capacity tables and two interchangeable arithmetic-example cards. New c22–c31 focus on FLSM/VLSM, requirement counting, minimum size, capacity direction, fragmentation, containment, unique gateway/host selection, static-host updates, limits of largest-first placement, and verification after renumbering. c02, c13 and c20 were narrowed to one coherent retrieval task each.
- Chapter 04 retains core address, enablement, inspection, removal, save, ping and ARP drills, but removes isolated loopback typing from the required LAN practice. The /32 concept remains explicitly assessed. Chapter 05 keeps five drills that enter its calculated addresses or compare connected prefixes with the allocation; generic command repetition and a premature destination lookup were removed with confirmed existing owners.
- All four tickets remain. The two broad-host-mask tickets now use directly connected LANs and explicit ARP observations, removing a dependence on unexplained additional remote-server paths. Chapter 05 t01 replaces a fictitious two-LAN limit with a smaller Devices subnet that still lies inside the incorrect Operations /25. The repair explains why shrinking the child does not remove containment overlap.

## Lab changes and exit evidence

Chapter 04 supplies host/prefix requirements first. The complete address table, boundaries and usable ranges appear only in Step 1's expected answer after a worksheet asks the learner to calculate them. Its initial diagram contains the given host requirements, not derived gateway answers. Step 5 records predicted local next hops alongside actual tests. The unused-interface invalid-address exercise asks for a prediction and verification of retained state. The gateway experiment has separate before/during/after columns, a separate recovery step, and all three comparison pings after recovery. The wrong-/24-mask variation remains a paper decision so success does not depend on Packet Tracer proxy-ARP behavior.

The chapter 04 challenge retains the fresh `10.7.19.77/21` requirement, now requiring the learner's own command/settings before the solution. It specifies the additional switch ports/cables, independent project file, new connected-prefix evidence, new host settings, bidirectional tests and preservation of the original LANs. The `.23.250` and `10.7.24.1` questions are clearly paper membership tests, not nonexistent hosts to ping.

Chapter 05 removes exact IP/prefix hints from the initial topology and moves the complete device settings into the Step 1 answer. Learners size and place the original three LANs and reserved /30 at the lowest available aligned boundaries before viewing the allocation. They predict connected prefixes and first hops, then record the six directed endpoint tests. The unused reservation is explicitly a paper allocation, not an expected connected route.

The growth step first calculates the enlarged subnet, overlap, and total block demand (292 addresses versus a 256-address parent), then observes the deliberately rejected command and retained /26 before continuing. Only one small renumbering is implemented, using the authorized lower half of `10.44.9.0/24`. A final verification table covers changed host/router values, unchanged LANs, connected prefixes and all six test directions. This does not require production migration procedures or any unintroduced static/dynamic routing.

Chapter 05's independent challenge uses new `192.168.72.0/24` requirements, explicitly allocates at the lowest available aligned boundary and checks exact free blocks. Two LANs are implemented on the existing ports; the remaining allocations are explicitly paper-only. A separate 100-address growth question tests whether the actual free /25 can accommodate a new requirement. The answer explains why a shut third interface can retain an address in configuration without presenting an active connected route.

Both labs include the requested September 2026 repeat notice because existing step checkmarks do not establish completion of revised work. Existing step counts and order are retained. No storage was cleared or progress code changed. Every intentional fault is observed before the separate repair. Each lab names a working checkpoint, a distinct challenge copy and observable completion evidence.

## Identity and retirement record

[04-05-decisions.json](04-05-decisions.json) contains every old/current questions/cards/commands/tickets identity exactly once: **130 decisions — 67 keep, 18 revise, 32 add and 13 retire**. All 12 declared destination IDs were checked against actual current course assets. Destination means confirmed existing coverage, not a promised later rewrite.

Retired identities:

| Identity | Reason / existing coverage |
|---|---|
| `ipv4-addressing-d08` | Isolated loopback typing is outside this core LAN exercise; /32 meaning remains in q09 and c10. It is not claimed to have been moved. |
| `subnetting-vlsm-c03` | Increment rule is already in `ipv4-addressing-c03`. |
| `subnetting-vlsm-c04` | Repeated increment table is derivable from `ipv4-addressing-c03`. |
| `subnetting-vlsm-c07` | Repeated capacity table is covered by `ipv4-addressing-c07` and its representative mask cards. |
| `subnetting-vlsm-c08` | Exception comparison is already assessed by `ipv4-addressing-q09`. |
| `subnetting-vlsm-c09` | Numeric instance is consolidated into the retained formula `subnetting-vlsm-c06`; q03 applies it. |
| `subnetting-vlsm-c10` | Another numeric instance is consolidated into `subnetting-vlsm-c06`. |
| `subnetting-vlsm-d02` | Unchanged enablement command remains in `ipv4-addressing-d02`. |
| `subnetting-vlsm-d05` | Brief-summary command remains in `ipv4-addressing-d03`. |
| `subnetting-vlsm-d08` | Destination-specific route lookup has confirmed later owner `routing-table-d04`. |
| `subnetting-vlsm-d09` | Filter-only variation consolidated into the full-table check `subnetting-vlsm-d06`. |
| `subnetting-vlsm-d10` | Full-configuration inspection remains in `ipv4-addressing-d05`. |
| `subnetting-vlsm-d12` | Save-command recall remains in `ipv4-addressing-d12`; saving is still required in the lab. |

No chapter, lesson-section or question identity was retired. No section mapping was required because lesson headings and bodies were not changed.

## Primary-source checks

The existing lesson source lists remain intact. The following primary references were reopened for the changed practice decisions; the original examples and arithmetic are independently authored, not copied source exercises.

| Claim family | Evidence |
|---|---|
| IPv4 masks, unique routed subnets, VLSM sizes/alignment, /31 and /32 context | [Cisco: Configure IP Addresses and Unique Subnets](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html) |
| Interface address/mask commands, verification and supported addressing features | [Cisco: Configuring IPv4 Addresses](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/ip-addressing/ip-addressing/m_config-ipv4-addr-0.html) |
| A host's subnet-based local/remote decision | [RFC 1122, section 3.3.1.1](https://www.rfc-editor.org/rfc/rfc1122.html#section-3.3.1.1) |
| Proxy response can conceal a broad host mask; it does not correct that mask | [Cisco: Understand Proxy ARP](https://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13718-5.html) |
| Two /31 endpoint addresses are a scoped point-to-point exception | [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021.html) |
| Modern child-subnet count includes all-zero/all-one subnet numbers | [Cisco: Configure Subnet Zero and All-Ones Subnet](https://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13711-40.html) |
| RFC 1918, link-local, shared and documentation spaces have distinct designations | [IANA IPv4 Special-Purpose Registry](https://www.iana.org/assignments/iana-ipv4-special-registry/) |
| Current/announced addressing objective verbs | [Cisco CCNA v1.1](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [Cisco CCNA v2.0](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |

The registry distinguishes private addresses from other nonpublic uses. Being outside RFC 1918 is not, by itself, evidence that an address is available for public deployment. The practice does not require legacy address-class inference, obscure reserved-block memorization, default-route configuration, or a working Internet connection.

## Checks and limits

- `node scripts/validate-content.mjs`: **0 errors**, with no warning in either owned chapter. The ten remaining warnings at that run were objective-tag warnings in orientation/network-models, outside this assignment.
- Parent-authored [addressing-checks.mjs](addressing-checks.mjs): the author ran the initial 38-check version successfully; the parent subsequently extended it to **50 passing assertions**, including exact free intervals and both growth/challenge plans. This is separate independent arithmetic evidence, not a claim to execute a router. See [the independent peer review](04-05-peer-review.md) for the companion review.
- A targeted baseline/current ledger check passed all **130 decisions**, all **12 destination identities**, ordered question levels and unchanged lesson bodies. It compared actual data equality to each keep/revise action rather than assuming the authoring script's labels were accurate.
- Both final labs were reread after parsing through the course loader. This confirmed the worksheet/answer order, step sequence, expected observations, final-address tables, fresh challenge conditions and clear distinction between paper and configured allocations. Integration review added closed solution disclosures for the initial worksheets and independent challenges, then verified them in the browser. The independent reviewer reread the final banks/labs after the refinements above were applied.
- The completed shared integration run reconciled all 488 opening-batch decisions and rendered 2,245 teaching fragments. Its full scope and results are recorded in the [integration report](README.md) and [verification record](verification.json).
- No Packet Tracer, CML or physical-device session was available or executed. Configurations, calculations and documented behaviors were reviewed statically. Exact output wording, command support, timing and proxy-ARP simulation remain platform-dependent. Expected results are labeled representative; learners must record their actual evidence.
