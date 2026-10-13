# Independent review: chapters 14–18

Reviewer: integration reviewer, separate from the author. Reviewed against the actual saved questions (including options, keys, explanations and distractor feedback), cards, command drills, tickets and complete lab procedures. This is editorial and technical review, not simulator execution.

## Spanning tree

The full existing triangle baseline and its changed receiving cost, failed link, changed root and recovery were checked. The new second-VLAN challenge preserves the first instance, adds the required VLAN to both ends of every trunk, supplies host setup and requires fresh tests. Independent path-cost and role calculations are recorded in [network-checks.mjs](network-checks.mjs), including the new whole-topology checkpoint cases and VLAN 20 challenge.

The author corrected two requested refinements: the direct root/alternate output-reading item is foundations, and the loop question uses the plausible misconception that bridging decrements TTL. Final answer positions are reviewed separately from the technical key.

## STP protection

Read every question, card, drill and ticket and all eleven lab steps plus the independent policy worksheet. The line topology, temporary-switch disconnection, root-boundary placement and distinct errdisable/inconsistency recovery paths are coherent. The lab separates the supported device exercise from Packet Tracer's supplied BPDU-loss interpretation. The timer exercise distinguishes an enabled recovery cause from the retry interval and removes its optional settings afterward. No substantive technical correction was required in this read.

## Layer 2 security

Read all thirty revised questions, twenty-four cards and fifteen command drills. A new question initially inferred DAI rejection solely from a changed access interface despite a matching IP/MAC/VLAN binding. The cited DAI documentation establishes IP-to-MAC validation; that interface-only inference was not adequately supported. The author replaced it with an explicit sender-MAC mismatch and retained the distinction between a rejected claim and proof of malicious intent. The saved correction was reread and confirmed.

The complete fourteen-step revision and independent printer challenge were read after the baseline review. The four modules preserve a working starting state and separate each fault from recovery. The second static printer is inside the existing DHCP exclusion; adding its exact ARP ACL permit preserves the original permit and DHCP-binding fallback. The downstream-switch worksheet correctly distinguishes each switch's server-reply ingress. The RA-guard comparison establishes a permitted R2 advertisement before restoring its host-role boundary, preserves the legitimate R1 path, and distinguishes fresh capture evidence from retained client state. Unsupported functions are explicitly unexecuted. No remaining technical correction was identified in this read.

## Routing-table interpretation

Read every original and revised question, card, drill and ticket, the complete baseline lab and every changed lab step. Requested removal of duplicate rare IOS display behavior from scored recall; the author retired those items while retaining a qualified reference note. The revised bank focuses on source preference versus forwarding lookup, local delivery, discard, withdrawal, next-hop resolution and separate request/reply paths. The independent six-destination worksheet uses a different addressing plan, with an additional route withdrawal and return-path case; its prefix ranges and decisions are checked by the separate numerical verifier. The fault remains present long enough to collect evidence before repair. Direct application items were reviewed for inflated difficulty labels, and ticket alternatives were revised to plausible routing misconceptions.

## IPv4 static routing

Read every original practice item, each changed/new question and card, and the final lab revision and challenge. The supplied topology has independent direct transit cables, fully specified primary and floating routes in both directions, and a separate observed failure before restoration. The lab correctly distinguishes an ordinary router ping's transit source from the PC source, an installed host exception from same-prefix source preference, and a real loopback destination from an unsupported Internet-reachability claim.

The reviewer requested removal of a newly drafted duplicate default-route item, correction of several difficulty labels, and replacement of weak alternatives. Those changes were confirmed in the saved questions, including the alternative recursive resolver and missing return-path cases. The new /26 challenge changes the destination requirement and standby preference while retaining the previously verified reverse paths. Its address boundaries and separate /27 mask-error variation are checked independently. The instructions require endpoint traffic during the outage and after recovery; they do not infer remote failure detection from a directly cabled link-down test. No unresolved technical finding remains in this review.

## Primary references used in this review

- [Cisco: Rapid Spanning Tree](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html)
- [Cisco: Loop Guard and UDLD](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol-stp-8021d/218321-configure-stp-with-loop-guard-and-bpdu-s.html)
- [Cisco: Root Guard](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10588-74.html)
- [Cisco: PortFast and BPDU Guard](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10586-65.html)
- [Cisco: Catalyst 9300 DAI, IOS XE 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_dynamic_arp_inspection.html)
- [Cisco: DAI and IP Source Guard verification](https://www.cisco.com/c/en/us/support/docs/switches/lan-switch-software/222274-troubleshoot-dynamic-arp-inspection-dai.html)
- [Cisco: Route selection](https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html)

## Review limits

This review checks the written evidence, reasoning, configuration sequence and selected independent calculations. It does not establish platform execution, convergence timing, measured item difficulty or learner outcomes. Final automated integrity, rendering and browser results are recorded in the batch report.
