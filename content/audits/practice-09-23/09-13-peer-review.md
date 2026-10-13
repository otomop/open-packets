# Independent practice review: chapters 09–13

Reviewed 20 September 2026 after the author saved the revised practice. Read all questions, options, keys, explanations and distractor feedback; every flashcard and command drill; both tickets and their complete repairs in each chapter; and all five lab procedures, including setup, fault observations, recovery and closed challenges. Also checked chapter metadata, prerequisites and cited platform sources. This is an independent review of the final practice, not a second full lesson rewrite. No chapter assets were edited by this reviewer.

## Reviewed scope

| Chapter | Questions | Cards | Drills | Tickets | Full labs |
|---|---:|---:|---:|---:|---:|
| 09 VLANs and access ports | 21 | 19 | 11 | 2 | 1 |
| 10 802.1Q trunks | 22 | 18 | 10 | 2 | 1 |
| 11 Inter-VLAN routing | 23 | 21 | 12 | 2 | 1 |
| 12 CDP and LLDP | 17 | 17 | 12 | 2 | 1 |
| 13 EtherChannel | 23 | 22 | 9 | 2 | 1 |
| Total | 106 | 97 | 54 | 10 | 5 |

The review covers 267 current bank items and all 25 practice files, plus the supporting metadata. It includes answers hidden by the learner interface; a closed solution was not treated as an unreviewed answer.

## Findings and resolution

No unresolved material technical, answer-key or lab-reproducibility defect was found.

- `vlans-and-access-ports-q22` explicitly supplies the incorrect endpoint subnet alongside verified VLAN membership. Recommended application level 2 rather than analysis level 3. The author applied that correction; the final item and ledger were reread. Its identity and assessed knowledge remain unchanged.
- Chapter 13's routed-EtherChannel step already offered a supplied-evidence worksheet when the simulator lacks the feature. The author noticed that the final challenge still assumed an executed Layer 3 checkpoint. Agreed with an explicit continuation of that same fallback. The final challenge now requires both endpoint command plans and predicted member, address, route and capacity evidence, labeled unexecuted; reread and accepted.
- Reread the author's final chapter-11 ticket refinements: t01 now offers a plausible host-mask alternative and rules it out using the stated plan; t02's shorter correct option retains both missing encapsulation and missing address. Neither changes its key or repair.
- Confirmed that the root review's chapter-12 changes are present: q24 is foundational recognition, the redundant old q05 is absent, q21's documentation alternative is a plausible premature update, and Step 9 no longer repeats its verification instruction.

## Technical and teaching checks

**09:** Checked VLAN membership separately from IPv4 on-link decisions; data versus voice traffic and the limits of a working PC test; external phone power on the selected non-PoE 2960; and the distinction between PSE allocation, PD availability and a switch's shared power budget. Recomputed the supplied 370 W example: ten 6.3 W allocations leave 307 W, allowing ten additional 30 W allocations and leaving 7 W. Per-port capability and free physical ports remain separate constraints. The deletion and wrong-membership faults are observed before their distinct repairs. The fresh access-port challenge preserves the addressing plan.

**10:** Checked DTP pairings against their stated prerequisites, static configuration toward a non-DTP endpoint, native-VLAN classification, allowed/active/forwarding distinctions, and additive versus replacing allowed-list changes. Tagged frame length is scoped correctly. AP, virtual-host and firewall examples supply their actual tagging requirements rather than deriving them from the device category alone. The lab's VLAN-20 allowance fault and native mismatch remain separate, and its mismatch observations are appropriately qualified for protective switch behavior. The independent VLAN-30 expansion preserves existing traffic and native agreement.

**11:** Traced both router-on-a-stick and SVI topologies, every supplied address and gateway, parent/subinterface mapping, member-link autostate, routed-port addressing and the separate return-path requirement. The lab deliberately uses separate files for the two gateway designs. Local gateway success is not presented as proof of inter-VLAN forwarding. Removing the only VLAN-20 member link explains the SVI and connected-route observation without assuming one universal status-string format. The routed link tests only directly connected peers; neither its lab nor challenge assumes R2 has routes to the client LANs. Checked that command modes and model-specific interface names agree with the selected devices.

**12:** Read every discovery record from the command's local device, then checked the advertised remote port. Verified independent global/interface controls and LLDP transmit/receive direction, including cache expiry. Discovery, IP reachability and authenticated identity are kept separate. The cable-move exercise changes the intended local and remote columns without changing the management subnet. The LLDP fallback is identified as supplied interpretation work, and ordinary PC traffic does not depend on a discovery agent.

**13:** Checked LACP mode pairs and local group-number significance; member compatibility and partner identity; logical-versus-member state; VLAN service beyond bundle formation; and Layer 3 ownership of the IP address. The routed procedure creates the logical interface before attaching unnumbered routed members, as in the referenced 3560 workflow. Member failures, passive/passive negotiation and static/LACP mismatch do not promise a universal standalone-forwarding result or a fixed packet-loss count. Recomputed aggregate capacity for the two- and three-member FastEthernet labs and retained the one-member ceiling for a stable hash-selected flow. The /30 repair places `.1` and `.2` in `10.13.12.0/30`; `.6/30` belongs to a different subnet. Independent outbound hash choices do not falsely become an LACP formation requirement.

The differing bank sizes are justified by distinct tasks. Repeated terms across cards, questions and labs provide retrieval and application of the same skill, rather than unrelated filler. Demand levels are editorial judgments; direct configuration corrections and simple supplied calculations are not automatically analysis because they have an exhibit. No obviously mechanical repeating answer-position pattern, unsupported production assertion, placeholder or false claim of an executed simulator run was found.

## Primary sources independently reopened

- [Cisco PoE types and PSE/PD limits](https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/nb-06-upoe-plus-it-ot-wp-cte-en.html), including the separate 30 W source and 25.5 W device values for 802.3at.
- [Cisco Catalyst 2960 voice VLAN configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvoip.html), for phone/CDP provisioning and tagged voice versus untagged attached-PC traffic.
- [Cisco Catalyst 9300 trunk configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/vlan/b_1712_vlan_9300_cg/configuring_vlan_trunks.html), for static/dynamic modes, negotiation controls and VLAN treatment. Platform defaults are not generalized to all devices.
- [Cisco Catalyst 3560 interface characteristics and autostate](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_2_se/configuration/guide/scg3560/swint.html), including active VLAN, enabled SVI and eligible access-or-trunk forwarding membership.
- [Cisco IOS CDP configuration](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/cdp/configuration/15-mt/cdp-15-mt-book/nm-cdp-discover.html) and [Catalyst LLDP/LLDP-MED configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/m_1522e_int_lldp_2960s_cg.html), for advertised lifetime, timers, direction controls and separate global enablement.
- [Cisco Catalyst 3560 EtherChannel configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swethchl.html), for LACP compatibility, routed-interface setup order, logical/member configuration and traffic distribution.

## Verification limits

The reviewer ran content validation: zero errors and no warnings in 09–13 or 19–23. Final whole-course validation, ledger reconciliation, rendering and integration evidence are recorded in the [batch report](README.md); the author's focused renderer run is separate evidence in [09–13 rework](09-13-rework.md). This peer review did not execute Packet Tracer, CML or physical switches, measure throughput or convergence, or operate the app in a browser. The procedures retain their model/support caveats and clearly distinguish predicted outcomes from measured observations.
