# Independent peer review: chapters 00–03 practice

Reviewed 20 September 2026 by the services/security/automation reviewer, independently of the author. This was a read-only review of the four labs and every current question, wrong-option explanation, card, command drill and troubleshooting ticket. Chapters 00 and 01 have no tickets; their absence is intentional.

## Result

No remaining actionable factual, keyed-answer, addressing or lab-reproducibility finding was identified in the reviewed content after the author applied the refinements below. This is an editorial and technical review, not evidence that a learner has achieved a particular exam outcome.

| Chapter | Questions | Recall/application/analysis | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|---:|
| 00 Start here | 7 | 4/3/0 | 8 | 6 | 0 | 7 |
| 01 Network models | 12 | 3/9/0 | 14 | 6 | 0 | 8 |
| 02 Components and topologies | 14 | 6/8/0 | 15 | 3 | 2 | 8 |
| 03 Cabling and interfaces | 16 | 5/10/1 | 18 | 8 | 2 | 8 |

The final loaded inventory is 49 questions, 55 cards, 23 drills, four tickets and 31 guided lab steps. Question difficulty is an editorial description of the reasoning required, not a measured difficulty scale.

## Findings and verified resolutions

1. **01 question network-models-q16:** the stem explicitly identifies an unused default gateway. Explaining the remote return failure applies the known next-hop rule; the named fault does not justify an analysis label. The author changed difficulty 3 to 2 and preserved the same-topic identity.
2. **02 question components-and-topologies-q03:** selecting the NGFW and inline-IPS capabilities directly retrieves taught facts. The author changed difficulty 2 to 1 rather than adding superficial story text to retain the higher label.
3. **02 cards components-and-topologies-c15 and c24:** both retrieved the same each-leaf-to-every-spine relationship. The author retained c15, retired c24 and reduced the bank to 15 cards. No replacement was added merely to maintain a count. The author records that retirement in the complete item ledger.
4. **01 lab Challenge:** gateway removal and retesting appeared inside the answer container, so learners could not attempt that portion before opening the answer. The author moved the prediction, fault test, restoration and retest instructions above the solution. The answer now explains the expected local/remote distinction.
5. **Coordinator disclosure correction:** all four independent Challenge answer containers now use the opt-in `:::solution` disclosure. Ordinary guided `:::expected` observations remain visible. Source inspection and the loaded lab data confirm the intended container placement; browser interaction testing belongs to the coordinator.

The changed questions, card absence and four challenge containers were reread in their saved state. There are no unresolved items from this peer pass.

## Chapter-by-chapter assessment

### 00

The small exercise introduces a real local exchange, the difference between visible link state and ICMP success, basic CLI contexts, and active/device/project persistence. It does not begin with repeated reset, reload or administrative-shutdown tasks. The deliberate hostname error has separate observation and correction, and the final PC-C variation requires the learner to apply a new address and port before consulting its answer.

The seven questions start with bounded facts and then apply them to a duplicate-address plan, a command-mode error and incomplete persistence evidence. Wrong answers correspond to recognizable beginner confusions. The eight cards remain short enough for a useful retrieval judgment; the mode list and persistence distinctions are related concepts rather than unrelated reference tables.

### 01

The supplied router configuration supports packet tracing without assuming independent IPv4 design or IOS configuration mastery. Models, four cable endpoints, both router interfaces and both host gateways form a coherent two-subnet topology. R1 needs only its connected routes. Frame-header changes, unchanged endpoint IPs, TTL, local ARP and three different forwarding tables are kept distinct.

The wrong-gateway experiment provides a clear local/remote comparison and a separate restoration test. The worksheet clearly separates illustrative MAC labels/TTL from actual simulation observations. The revised challenge now states every required action before its solution. The checkpoint is honestly recall/application practice; no analysis quota is imposed.

### 02

The one-LAN HTTP exercise avoids introducing routing, DNS or DHCP as unexplained dependencies. A stopped service and a working ICMP path are treated as different observations; cached browser content is explicitly qualified. Fault and recovery are separate, and the added-client challenge compares a service failure with a powered-off endpoint without treating a failed ping alone as proof of power loss.

Topology worksheets state all links and surviving-path assumptions. They do not pretend that drawing two links proves usable failover. PoE cases consistently compare source-side allocation, per-port capability and aggregate budget. The two tickets distinguish a verified upstream dependency and an administratively disabled PoE function. The reduced card bank avoids the identified leaf/spine duplication.

### 03

The 2960 FastEthernet choice, explicit crossover and matching same-subnet hosts support the specific 10/100 duplex exercises. Administrative and duplex faults are observed before separate repair steps. The lab does not demand fabricated hardware counters from Packet Tracer; supplied optical/cable evidence is labeled as a worksheet.

Question alternatives distinguish configuration evidence from counters and evidence limits. The remaining analysis item combines a changing CRC count with confirmed speed/duplex agreement before choosing further investigation. The challenge applies the forced-versus-auto rule to a changed one-sided setup, with a simulator fallback and restoration. The two tickets use coherent physical/interface evidence and do not overclaim that one repair excludes all other faults.

## Verification and limits

- Read every current practice item and every lab stage, including answer keys, wrong-option feedback, challenge instructions, recovery and verification.
- Independently checked the supplied arithmetic: TTL 128 → 126 represents two specified decrements; 120 − 90 = 30 W fits one 30 W allocation; (120 − 60) / 30 = two allocations; collision increments are 420 − 10 = 410 and 180 − 0 = 180; CRC increment is 89 − 4 = 85.
- Checked 350 m against the supplied 300 m OM3/400 m OM4 limits and −16 dBm against the supplied −12 through −1 dBm range. These checks validate the given exercises, not a new optical design.
- Independently loaded the final banks to verify counts, multi-answer structure, complete wrong-option coverage, final demand labels and challenge solution markers.
- No Packet Tracer, CML or hardware was run. No real cable, optical, PoE, performance or traffic measurement was performed. Simulator-version behavior remains explicitly qualified.
- No chapter content was edited by this reviewer. The original author applied the four content refinements; the coordinator owns rendering and application integration.
