# Opening practice redesign: Chapters 00–03

Reviewed and revised on 20 September 2026. Scope: all existing lesson/lab/question/card/command/ticket assets in 00–03, with implementation confined to practice assets, small lesson alignment/source/time edits, and this audit evidence. No UI, style, application behavior, build, server, publication or Git changes were made by this author.

This pass redesigns practice, rather than rewriting valid lesson prose. It follows the user's request for chapter-specific workload and a light first chapter. The earlier uniform question/card/command quotas are not treated as requirements.

## Final workload and progression

| Chapter | Questions | Cards | Drills | Tickets | Guided steps | Approx. lab minutes | Q levels 1 / 2 / 3 |
|---|---:|---:|---:|---:|---:|---:|---|
| 00 Start here | 7 | 8 | 6 | 0 | 7 | 25 | 4 / 3 / 0 |
| 01 Network models | 12 | 14 | 6 | 0 | 8 | 45 | 3 / 9 / 0 |
| 02 Components & topologies | 14 | 15 | 3 | 2 | 8 | 35 | 6 / 8 / 0 |
| 03 Cabling & interfaces | 16 | 18 | 8 | 2 | 8 | 50 | 5 / 10 / 1 |

Before: 61 questions, 78 cards, 44 drills, 4 tickets and 34 lab steps. After: 49 questions, 55 cards, 23 drills, 4 tickets and 31 lab steps. The reduction follows the outcomes below, not a goal to minimize content.

Question order moves from foundational recall toward application and analysis. Difficulty describes the reasoning demanded, not the mere presence of a CLI exhibit or a fault. An explicit HTTP-Off setting followed by a direct correction is level 2; it was not labeled level 3 simply to hit a planned ratio. Chapter 02's two longer tickets provide additional path and power diagnosis. Chapter 03's counter-baseline case requires more investigation than a directly displayed shutdown state.

### 00: Establish a first successful workflow

Install/open the simulator → place and identify devices → cable and enter supplied addresses → obtain local ping replies → read the active temporary hostname → correct it → save and inspect startup configuration → save the project. The independent variation adds a third correctly addressed PC.

No required interface shutdown, reload, DNS lookup experiment, filtering or `do` shortcut remains. Pager/help instructions appear when needed. Root review correctly identified that the first draft still spent too much checkpoint space on interface escape and pager controls; those two questions and two cards were replaced with fresh identities for local-ping evidence and distinct host addresses. The checkpoint now starts with the local-LAN outcome.

The lab deliberately separates the temporary-name observation from its correction and separates the interactive copy prompt from later commands. Its evidence record requires cable endpoints, address entries and the two tests.

### 01: Observe forwarding, rather than memorize router setup

Retain the two-LAN topology because it directly supports the lesson's packet walk. The router configuration remains complete, with actual 2911 ports and one supplied address per LAN, but is explicitly labeled setup. A short explanation tells the learner what `interface`, `ip address` and `no shutdown` accomplish. The simple /24 boundary is given; subnet design and independent configuration mastery are deferred.

Predict the first remote next hop → inspect incoming/outgoing MAC and IP fields → compare local and remote requests → match a row from each of the routing, ARP and MAC tables → introduce an incorrect return gateway → compare local success with remote failure → restore the gateway and retest. A supplied before/after worksheet covers fields a simulator version does not expose. It is explicitly not recorded traffic.

The challenge instructions include the independent gateway-removal experiment before the answer. Its answer is now an opt-in solution disclosure, so the learner can make predictions before opening it. Required evidence includes one field comparison, one interpreted row per table, and fault/recovery results. Duplicate encapsulation and remote-ARP questions were pruned; router address entry and both traceroute spellings are not required command-drill outcomes.

### 02: Add application and architectural reasoning

The previous lab rebuilt almost the same routed topology as 01. Its replacement is a cold-start one-switch PC/server LAN: establish ping and a real HTTP request, stop HTTP while preserving the network, collect evidence, restore the service, then retest. The worksheet extends the office's roles to AP/controller/firewall/server choices, three physical path diagrams, and two PoE constraints.

The design tasks distinguish remaining paths from guaranteed failover. The supplied topology assumptions explicitly avoid promises about convergence time or unconfigured redundant cables. The power exercise compares source-side allocations consistently: 120 − 60 = 60 W remaining, sufficient for two 30 W allocations; a 15.4 W port does not satisfy a 30 W allocation despite sufficient aggregate power.

The HTTP task does not treat any ping failure as proof of a firewall or server-power fault. It distinguishes an old browser page from a newly obtained response and includes a supplied-evidence fallback if the simulator cannot expose that distinction. It does not require query-string handling or exact browser error text.

The spine-leaf question now applies the design to new connections instead of repeating the correct answers verbatim from the exhibit. Cloud alternatives are actual cloud characteristics. PoE configuration and wattage-table memorization are not repeated here; confirmed Chapter 09 items retain that later practice.

### 03: Progress from a clear state change to less direct evidence

Retain the simple two-switch, two-PC LAN with explicit crossover on the FastEthernet interswitch link. Start with its working baseline, then shut one end and compare the administrative state with the far-end physical state. Restore and retest before deliberately creating a duplex mismatch. Restore again before the supplied optical, pinout, distance and forced-speed cases.

The repeated full speed-fault configuration/recovery cycle becomes a supplied comparison. The optional independent variation still examines forced-100/full versus automatic behavior on the stated 10/100 link, with explicit recovery and a simulator limitation.

The lab never waits for a required synthetic error count. Its counter fallback is supplied evidence: 10→420 collisions gives 410 new collisions; 0→180 late collisions gives 180 new late collisions. Physical readings and optical measurements remain paper exercises. The required typed commands match actual interface actions and observations; hardware-only optical syntax, counter-table variants, and resetting counters are not compulsory drills.

## Identity and decision evidence

Every old or current assessment item has exactly one entry in [00-03-decisions.json](./00-03-decisions.json), with chapter, bank, ID, keep/revise/retire/add action, and a topic-specific reason. A `destination` appears only where an actual later assessment item was inspected and covers the subject.

The ledger contains **194 unique old/current item identities**: **56 kept, 68 revised, 63 retired and 7 added**. Same-topic edits keep identity even when difficulty, order, scenario or feedback changes. Examples include the interface-state question expanding to two-end evidence and the shutdown-recovery question asking how to verify recovery. The output-drop card retains its original output-drop concept while removing its unrelated optical subquestion, already covered by a separate retained card.

New identities:

- `start-here-q25`: local-ping evidence.
- `start-here-q26`: distinct host addresses against a supplied plan.
- `start-here-c32` and `start-here-c33`: short recall of those two LAN outcomes.
- `components-and-topologies-q19`: stopped HTTP versus working local communication.
- `cabling-and-interfaces-d12` and `cabling-and-interfaces-d13`: actual shutdown/recovery commands.

These new concepts do not inherit mastery or spaced-repetition state from unrelated retired questions/cards. No stored browser history was cleared.

Retired IDs are listed below; each individual reason and any confirmed destination is in the ledger.

| Chapter / bank | Retired identities |
|---|---|
| start-here / questions | `start-here-q05`, `start-here-q06`, `start-here-q08`, `start-here-q11`, `start-here-q14`, `start-here-q18`, `start-here-q19`, `start-here-q20`, `start-here-q21`, `start-here-q22` |
| start-here / cards | `start-here-c08`, `start-here-c11`, `start-here-c12`, `start-here-c13`, `start-here-c17`, `start-here-c18`, `start-here-c21`, `start-here-c22`, `start-here-c23`, `start-here-c26`, `start-here-c27`, `start-here-c30` |
| start-here / commands | `start-here-d04`, `start-here-d05`, `start-here-d06`, `start-here-d08`, `start-here-d09`, `start-here-d12` |
| network-models / questions | `network-models-q05`, `network-models-q07`, `network-models-q14` |
| network-models / cards | `network-models-c05`, `network-models-c06`, `network-models-c15`, `network-models-c17`, `network-models-c18`, `network-models-c21` |
| network-models / commands | `network-models-d07`, `network-models-d09`, `network-models-d10`, `network-models-d11`, `network-models-d12` |
| components-and-topologies / questions | `components-and-topologies-q06`, `components-and-topologies-q15` |
| components-and-topologies / cards | `components-and-topologies-c03`, `components-and-topologies-c04`, `components-and-topologies-c05`, `components-and-topologies-c08`, `components-and-topologies-c24` |
| components-and-topologies / commands | `components-and-topologies-d03`, `components-and-topologies-d12`, `components-and-topologies-d13`, `components-and-topologies-d06`, `components-and-topologies-d14`, `components-and-topologies-d15`, `components-and-topologies-d17` |
| cabling-and-interfaces / cards | `cabling-and-interfaces-c07`, `cabling-and-interfaces-c08` |
| cabling-and-interfaces / commands | `cabling-and-interfaces-d01`, `cabling-and-interfaces-d06`, `cabling-and-interfaces-d09`, `cabling-and-interfaces-d10`, `cabling-and-interfaces-d11` |

All lesson H2 titles and section identities remain unchanged. Lesson changes are limited to lab duration, brief practice/supplied-setup notes, two obsolete lab references in Chapter 02, and two supporting source links. Lab steps use positional IDs in the current app. Their old checkmarks cannot establish completion of changed exercises, so all four lab introductions instruct returning learners to repeat the revised exercise and update checkmarks. This limitation is disclosed rather than hidden or “fixed” by deleting progress.

## Primary evidence checked

The existing chapter source lists remain in place. This practice pass reopened the following primary references on 20 September 2026:

| Claim or scope | Primary reference |
|---|---|
| IOS modes, context help, active changes versus explicit save | [Cisco IOS CLI guide](https://www.cisco.com/c/en/us/td/docs/ios/fundamentals/configuration/guide/12_2sr/cf_12_2sr_book/cf_cli-basics.html). This is a classic IOS behavior reference, not a claim about every current software image. |
| Separate hosts accidentally sharing one IPv4 address on a link create a conflict | [RFC 5227](https://www.rfc-editor.org/rfc/rfc5227.html), introduction and applicability. Added to Chapter 00 sources for the new supplied-plan practice. |
| ARP maps a local protocol address to its link address | [RFC 826](https://www.rfc-editor.org/rfc/rfc826). Applied to the next hop, not a remote Ethernet endpoint across a router. |
| Ordinary IPv4 forwarding and TTL/checksum behavior | [RFC 1812](https://www.rfc-editor.org/rfc/rfc1812), particularly forwarding and TTL requirements. Worksheet excludes NAT, tunnels and fragmentation. |
| HTTP request/response roles | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html). Added to Chapter 02 sources. Simulator GUI behavior is a bounded exercise assumption, not asserted by this RFC. |
| Campus functional layers and collapsed core | [Cisco campus LAN/WLAN design guide](https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-campus-lan-wlan-design-guide.html). |
| PoE source/receiver distinction and device/type limits | [Cisco PoE guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/infra/poe/poe-configuration-guide/g-poe/c-poe.html). Worksheet uses consistently supplied allocations rather than mixed device-side and source-side power. |
| 10/100 forced/auto mismatch and operational duplex | [Cisco autonegotiation reference](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html). The fallback is explicitly scoped to the reference link, not a universal gigabit rule. |
| Interface counters and need to check both ends | [Cisco switch-port troubleshooting guide](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6500-series-switches/12027-53.html). Counter totals are evidence, not unique component diagnoses. |
| Reference 2960 interface settings and auto-MDIX conditions | [Cisco 2960 interface guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swint.html). The lab's specified crossover avoids relying on auto-MDIX during forced settings. |

The original media-module data sheets and NIST cloud definition already cited in the lessons continue to support retained reference material; this pass did not change their technical values. No new claim of exam coverage or mandatory memorization was added. Empty objective tags on prerequisite IOS/model items remain intentional rather than assigning an unrelated blueprint tag.

## Verification and limits

- Read every original and final bank item, including all incorrect-option explanations, and checked alignment with the actual revised lab and prerequisite knowledge.
- Targeted ledger comparison covers all 194 old/current identities exactly once; kept/revised/retired/added records are explicit.
- Actual React/Markdown/diagram rendering passed for **769 fragments** across the four owned chapters, including labs, questions, distractor explanations, cards, command notes and tickets.
- All 31 guided steps contain expected evidence. All four independent challenges use opt-in solution disclosures; ordinary guided-step expected boxes remain visible. The independent tasks themselves appear before the answer container.
- Arithmetic independently checked: local /24 plans, TTL 128→126 and 128→127, PoE 120−60 and 30 W allocations, counter differences, 350 m against the supplied 300/400 m SR limits, 130 m against the supplied 100 m copper limit, and −16 dBm below −12 dBm.
- Content validation reports 0 errors. The ten remaining warning entries are intentionally untagged prerequisite questions in 00/01.
- No Packet Tracer, physical switch, optical test, IOS reload, radio or application-service execution was performed. The fallback observations are labeled supplied/representative. No full build or server/UI inspection was run by this author.
- Independent peer review read all 00–03 practice assets and found no wrong keyed answer, addressing/cabling mismatch or material reproducibility defect. Its refinements were applied: network-models-q16 is level 2, components-and-topologies-q03 is level 1, duplicate components-and-topologies-c24 is retired, and the independent gateway experiment now appears before its answer. Chapter 02 ends at 15 cards because the 16-card planning target is not a quota. The peer reviewer reread the final changed portions and reported no remaining actionable findings; see 00-03-peer-review.md.
