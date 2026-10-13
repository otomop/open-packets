# Content audit: chapters 00–07

Completed 19 September 2026 for the local CCNA app. This batch covers **Start here** through **Ethernet switching**, including all 46 lesson, lab, question, card, command, and ticket files in those eight chapter folders. Chapters 08–45 have not been certified by this review.

## What changed

The lessons now develop the basic mechanism before asking learners to configure or troubleshoot it. Networking terms remain, with definitions, worked examples, tables, diagrams, and output interpretation. The tone is direct and professional, without invented experience claims, exam guarantees, or claims to know actual exam questions.

Every lab supplies its environment, device models, port/cable/address plan, expected observations, fault diagnosis, recovery, and a concluding challenge. Simulator-dependent features are identified. The written course distinguishes observed evidence from conclusions: a successful ping does not verify an application, an up/up interface does not validate a host's addressing, and one error counter does not identify a unique failed component.

| Chapter | Main corrections | Questions | Cards | Drills | Tickets | Lab steps |
|---|---|---:|---:|---:|---:|---:|
| 00 Start here | Current exam track, official setup, IOS help/modes, active versus saved configuration, project/progress backups | 15 | 18 | 12 | 0 | 8 |
| 01 Network models | Layer functions, next-hop ARP, per-link MAC addresses, TTL assumptions, separate forwarding tables and return path | 15 | 20 | 11 | 0 | 8 |
| 02 Components & topologies | Device functions, named controller coverage, campus/spine-leaf design, PoE capability and budget | 15 | 20 | 10 | 2 | 9 |
| 03 Cabling & interfaces | Media/module limits, auto-MDIX, 10/100 negotiation, duplex evidence, counters and optical readings | 16 | 20 | 11 | 2 | 9 |
| 04 IPv4 addressing | Binary/AND, mask boundaries, gateway capacity, /31 and /32 exceptions, deterministic fault exercise | 16 | 20 | 11 | 2 | 9 |
| 05 Subnetting & VLSM | Complete allocations, alignment/overlap, growth addresses, summary boundaries, private versus special-purpose space | 16 | 20 | 11 | 2 | 8 |
| 06 TCP, UDP & ports | Byte streams versus datagrams, ACK meaning, application recovery, DNS/FTP/TFTP transport details, service testing | 16 | 20 | 10 | 2 | 7 |
| 07 Ethernet switching | Source learning, VLAN-scoped forwarding, unknown unicast, aging/static entries, FCS and frame-size scope | 16 | 20 | 11 | 2 | 10 |
| **Total** | **Eight rewritten lessons and guided labs** | **125** | **158** | **87** | **12** | **68** |

Unnecessary product inventories, historical address-count trivia, exact operating-system TTL defaults, unsupported simulator constants, and advanced details unrelated to this foundation were removed or reduced to brief context. The Operations growth lab's PC now shares the gateway's actual /25; it no longer gives a PC in the upper /25 a gateway in the lower /25.

## Sources and scope

The scope was checked against Cisco's [current v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf). Cisco's [transition guidance](https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh) identifies 2 February 2027 as the final v1.1 testing day and 3 February 2027 as the first v2.0 day.

Each chapter exposes its primary sources in the app. Cisco configuration guides, IETF RFCs, IEEE guidance, IANA registries, NIST's cloud definition, and Microsoft command documentation support the applicable claims. The following reviews map claims to exact sources and explain scope decisions and retired assessment IDs:

- [00–01: setup, IOS workflow, and network models](00-01-review.md)
- [02–03: equipment, designs, cabling, and interfaces](02-03-review.md)
- [04–05: addressing and subnet calculations](04-05-review.md)
- [06–07: transport protocols and Ethernet switching](06-07-review.md)

Foundation chapters remain required on both study paths. The app no longer labels a prerequisite optional merely because the selected blueprint does not list it separately, and the chapter header no longer labels another track's objective IDs as belonging to the selected track. These are content-scope corrections; the user's colors and visual design were not changed in this audit.

## Verification

- Independent reviewers checked the rewritten chapter pairs and practice banks. Corrections from that review included command-copy formatting, an optional DNS record dependency, ARP-clear scope, character encoding, cumulative ACK wording, duplicated save instructions, and answer-position balance.
- The addressing review passed **570 independent Python assertions**, including worked ranges, allocations, summary coverage, gateway membership, and all 121 distinct fully specified address/prefix strings across chapters 04–05. A second reviewer independently recalculated the principal plans and examples.
- The batch verification script renders **1,905 content fragments** through the app's actual Markdown/React components. It checks assessment identities, answer bounds, distractor explanations, lab structure, expected observations, diagrams, and unresolved placeholders. It also catches command placeholders accidentally interpreted as HTML.
- Browser checks covered **40 chapter views**: Learn, Guided lab, Checkpoint, Flashcards, and Command drill for each of the eight chapters. All loaded without reported JavaScript errors or page-level horizontal overflow at the test viewport.
- The application's **28 regression tests** and TypeScript check pass. Production content validation and build pass with **zero errors**.
- Validation retains **19 prerequisite-question tagging advisories** in chapters 00–01. They intentionally have no invented direct blueprint mapping. The remaining **96 warnings** concern later chapters and remain outside this batch; many flag simulator claims needing their own review.

Run the batch verification from the project folder with `node content/audits/first-eight/verify.mjs`. Normal project checks remain `npm test`, `npm run typecheck`, and `npm run build`.

## Progress and remaining limits

Chapter identities, existing lesson section identities, and existing numbered lab-step identities were preserved. Where an assessment still tests the same concept, its identity remains. Unrelated replacements receive new identities so they do not inherit previous flashcard/mastery results; each chapter-pair report lists those replacements. No user progress was erased.

**Packet Tracer and physical hardware were not executed during this audit.** Lab command families and protocol behavior were checked against primary documentation, and example output is labeled representative. Exact simulator command support, timing, UI labels, and hardware behavior still need a manual run on the learner's installed version. Optical measurement exercises are explicitly paper exercises. No exam-pass guarantee is made.

This review covers the first eight chapters only. It does not certify later lessons, the entire exam blueprint, or the complete course as ready for release.
