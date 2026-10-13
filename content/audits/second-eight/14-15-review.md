# Chapters 14–15 teaching and technical review

Reviewed 19 September 2026, America/New_York. Scope: all six assets in `14-spanning-tree` and all six in `15-stp-protection`. No application, styling, dependency, or other chapter files were changed by this author. This note documents the coordinated lesson, lab, question, card, command, and troubleshooting rewrite.

## Result and teaching sequence

Chapter 14 now starts with the actual Ethernet-loop problem, then teaches root election, receiving path-cost arithmetic, designated-port comparisons, roles versus states, convergence, deliberate configuration, and interpretation of output. Root-port and designated-port selection have separate worked reasoning; the learner is not asked to memorize one ambiguous “lowest cost wins” statement. The normal root/alternate case is distinguished from the rare same-bridge shared-segment backup role.

Chapter 15 begins by classifying the connection, then teaches PortFast, BPDU guard and recovery, root guard, loop guard, BPDU filtering, and verification. The former separate “Choosing the guard” content is incorporated into the opening comparison and each feature's placement explanation. BPDU filter is last among the features and is labeled explicit v1.1 context. No unsupported explanation is offered for Cisco's blueprint change.

There is no need to move these chapters or make chapter 14 depend on EtherChannel. Existing chapter IDs and numbers remain unchanged. Each lab is a complete standalone build with exact models, cables, interfaces, VLANs, addresses, priorities, and costs. Chapter 14 uses a triangle and calculates changes to every affected switch. Chapter 15 uses a line to make its optional missing-BPDU fault safe even without a redundant forwarding path.

## Material corrections

- Replaced “priority 0 always wins” and “61440 never wins” with comparison of the complete BID, including the MAC tie-breaker.
- Qualified root-primary and root-secondary macros as one-time numeric configuration changes. The primary macro is not a perpetual monitor; the secondary macro does not reserve second place; priority-zero boundaries require checking the result.
- Distinguished root-port candidate cost (received cost plus local receiving cost) from designated-port comparison of advertised cost. Included sender BID, sender port ID, and the rare final receiving-port-ID tie.
- Replaced “all root-bridge ports are designated” with the ordinary point-to-point case and the shared/self-connected exception. Clarified that two separate parallel links to another switch normally create root/alternate, not backup.
- Removed a claim that changing a local cost affects nothing elsewhere. The chapter and lab now show how changed advertised cost changes another switch's designated/alternate decision.
- Removed universal 30/50-second convergence, two-second rapid convergence, six-second full recovery, and twenty-second root-guard recovery promises. Timer examples specify their assumptions; a healthy alternate can remain blocked indefinitely.
- Corrected RSTP topology-change reasoning: non-edge ports entering forwarding are the relevant detection event; not every up/down transition produces a change. Edge configuration and operational state are distinguished.
- Kept interface and global BPDU-guard scopes separate. Explained that automatic recovery is disabled unless the cause is enabled, independently of the default interval.
- Distinguished conventional interface errdisable from per-instance root/loop inconsistency, with a brief platform-options qualification rather than a false universal.
- Corrected loop guard's prerequisites and limits: appropriate point-to-point root/alternate role, prior expected BPDU information, no assumption that every silent host or link-up-from-failure is covered. Its state identifies lost information, not a conclusively broken fiber strand.
- Replaced the unsafe redundant-topology BPDU-filter fault with a nonredundant line, a precondition to verify loop guard and prior BPDU reception, and a Packet Tracer paper path. Fault and restoration are different numbered steps.
- Used documented negative command forms `no spanning-tree guard` and `no spanning-tree bpdufilter` in cleanup. No timer experiment is silently left enabled in the final saved baseline.
- Reworked the legacy-peer ticket to explain the affected interswitch compatibility behavior, rather than attributing every host startup delay to one old switch or promising the peer flag disappears within a fixed time.

## Primary evidence and scope mapping

All following references were opened or searched through the official Cisco source during this pass. The prose, worksheets, arithmetic, lab plans, and assessments are original teaching material; representative excerpts are labeled as such, not presented as captured hardware evidence.

| Claim or instructional decision | Primary evidence |
|---|---|
| v1.1 interprets Rapid PVST+, PortFast, root/loop/BPDU guards and BPDU filter | [Cisco v1.1 exam topics, 2.5](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) |
| v2.0 configures Rapid PVST+ and guards; its 2.5.d does not list BPDU filter | [Cisco v2.0 exam topics, 2.5](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| Alternate versus backup, rapid states, operational edge status, proposal/agreement, three missed hellos, topology-change detection, legacy interaction | [Cisco: Understand RSTP](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html) |
| 2960 priority/default mode, extended system ID, port priority, configurable STP parameters | [Cisco 2960 STP configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_1_se/configuration/guide/scg2960/swstp.html) |
| Macro behavior, port-cost and port-priority commands, negative guard/filter forms | [Cisco 2960 command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/command/reference/cr2960/cli3.html) |
| Short costs 100/19/4/2 for 10/100/1000/10000 Mbps | [Cisco Catalyst 9400 short-cost table](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9400/software/release/16-11/configuration_guide/lyr2/b_1611_lyr2_9400_cg/configuring_spanning___tree_protocol.html) |
| Current Catalyst 9300 mode, long-cost scale, timers, macro lower-bound restriction, protocol migration | [Cisco Catalyst 9300 STP configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/lyr2/b_1712_lyr2_9300_cg/configuring_spanning_tree_protocol.html) |
| PortFast, guard scopes, root/loop exclusion, global versus interface filtering | [Cisco Catalyst 9300 optional STP features](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/lyr2/b_1712_lyr2_9300_cg/configuring_optional_spanning_tree_features.html), [Cisco 2960 optional features](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_1_se/configuration/guide/scg2960/swstpopt.html) |
| Edge BPDU-guard protection and diagnostic behavior | [Cisco PortFast/BPDU guard technical note](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10586-65.html) |
| Priority-zero MAC tie, correct boundary placement, automatic recovery, missing-BPDU limitation | [Cisco Root Guard technical note](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10588-74.html) |
| Root/alternate loss-of-BPDU protection, shared-link limitation, initially missing BPDUs, automatic return, guard exclusion | [Cisco Loop Guard/UDLD technical note](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol-stp-8021d/218321-configure-stp-with-loop-guard-and-bpdu-s.html) |
| Cause-specific automatic recovery and default-disabled behavior | [Cisco Errdisable recovery technical note](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/69980-errdisable-recovery.html) |
| Recovery interval default 300 seconds, range 30–86400, shared between causes | [Cisco IOS XE interface/hardware command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3850/software/release/16-12/command_reference/b_1612_3850_cr/interface_and_hardware_commands.html) |

The Catalyst 9300 guide contains a short-method-default note alongside a table using long-scale values. The rewrite therefore does not extrapolate one universal cost-method default across models: it labels scales, uses the 2960/9400 short table explicitly, and configures deterministic per-VLAN costs in the labs. Extended MSTP, UDLD configuration, BPDU MAC trivia, maximum-throughput cost tables, timer tuning, and advanced STP migration configuration are outside the main teaching path. The optional recovery-range value is reference context rather than the central skill being assessed.

## Lab and cross-asset consistency

- Chapter 14: SW2 priority 24576, SW3 28672, SW1 32768; VLAN 10 displays 24586/28682/32778. Baseline root costs are SW2 0, SW3 4, SW1 8. SW1 Fa0/24 is alternate. Reducing its cost to 2 makes SW1 designated toward SW3; restoring 19 returns the baseline. Shutting SW3 Gi0/2 produces SW1 cost 19 and SW3 cost 23. Making SW1 priority 4096 produces SW3 cost 4 and SW2 cost 8. Each change has a separate recovery step.
- Chapter 15: SW2–SW1 FastEthernet cost 19; SW1–SW3 Gigabit cost 4; baseline root costs 0/19/23. SVIs .1/.2/.3 and PCs .11/.12 are unique usable addresses in 10.0.10.0/24; no router/default gateway is needed. All trunks use native VLAN 999 and allowed VLANs 10,999.
- The third switch is physically detached from its permanent uplink before use as the BPDU-guard source. Its temporary port is shut after recovery. Root guard is applied at SW1's designated boundary, and loop guard at SW3's receiving root port. Final opposing-end guard placement does not violate the same-interface exclusion.
- Questions, cards, drills, and tickets repeat the same trigger/state/scope distinctions as the lessons. Packet Tracer absence of a modeled behavior is not used as evidence against documented behavior.
- Every lab step has explicit device commands and an expected-outcome box. PC commands contain no copied shell prompt. IOS blocks show mode and one device per block, including all privilege/configuration transitions.

## Assessment identity and progress

All existing question, card, drill, and ticket IDs retain their underlying assessed concepts; there were no unrelated replacements, so **no assessment IDs were retired**. Wording and incorrect explanations were corrected in place. Notably, 14 q06 retains conditional classic timer reasoning; 14 q09/t02 retain the legacy protocol mismatch; 15 q14 retains the unsafe filter/guard combination but avoids unsupported universal precedence claims.

New IDs: `spanning-tree-q15`, `spanning-tree-q16`, `spanning-tree-c19`, `spanning-tree-c20`, `stp-protection-q15`, `stp-protection-q16`, `stp-protection-t03`.

Stable `sectionIds` mappings are present in both chapter frontmatters. The changed display headings retain these previous section IDs:

| Chapter | New heading | Previous ID |
|---|---|---|
| 14 | Why redundant Ethernet needs spanning tree | `why-redundancy-needs-a-referee` |
| 14 | Port roles and path selection | `port-roles-root-designated-alternate-backup` |
| 14 | Configure the root and path preferences | `configuring-rapid-pvst` |
| 15 | Match protection to the port's purpose | `the-tree-believes-every-port` |
| 15 | PortFast and operational edge status | `portfast-declaring-an-edge` |
| 15 | BPDU guard and errdisable recovery | `bpdu-guard-a-bpdu-on-an-edge-port-is-a-violation` |
| 15 | Root guard and root-placement boundaries | `root-guard-the-root-stays-where-you-put-it` |
| 15 | Loop guard and missing BPDUs | `loop-guard-silence-is-not-consent` |
| 15 | BPDU filter: distinguish the two forms | `bpdu-filter-switching-the-protocol-off-v1-1-only` |

Unchanged headings retain their natural IDs. The old unheaded introductions are now integrated into the opening sections; the old `choosing-the-guard` content is integrated rather than maintained as a repetitive extra section. Lab steps were substantially rebuilt, so existing checked step numbers should not be interpreted as evidence that the new exercises have been performed.

## Verification and limits

- Both chapters: 16 questions, 2 multi-answer questions, 6 exhibits, complete distractor explanations, and balanced single-answer positions. Chapter 14 distribution is 4/4/3/3 across positions; chapter 15 is 3/3/4/4.
- Chapter 14: 20 cards, 10 drills, 2 tickets, 7 lesson H2 sections, 9 lab steps. Chapter 15: 20 cards, 12 drills, 3 tickets, 8 lesson H2 sections, 11 lab steps.
- Prose-only counting, excluding frontmatter, headings, tables, lists, and fences: approximately 1849 words in chapter 14 and 1855 in chapter 15. Worked exhibits, tables, and labs are additional.
- Ran `node scripts/validate-content.mjs`: zero errors and zero warnings in chapters 14/15. The full course still has warnings outside this ownership scope while other authors work.
- Checked JSON parsing, unique IDs, answer indices, complete `whyWrong` coverage, valid addresses, lab step expected/command blocks, IOS prompt/device consistency, diagram JSON via the validator, and UTF-8/common mojibake/VERIFY-marker scans.
- These checks are structural and analytical. No Packet Tracer, CML, or physical switch execution was available in this authoring pass; every output is identified as representative, and feature-specific simulation limits are explicit. No full application build was run by this author.
