# Chapters 12–13 content review

Reviewed 2026-09-20. Scope: all six content files in `12-cdp-lldp` and all six in `13-etherchannel`. No UI, palette, application, global curriculum, deployment, or unrelated chapter changes were made by this review.

## Scope and structure

Both lessons were rewritten in direct technical teaching language, with a complete explanation before configuration, output interpretation, and troubleshooting. Chapter numbers and IDs remain unchanged. Eight teaching headings remain in each lesson; their display wording is clearer, and frontmatter `sectionIds` preserves every previous section ID from `second-eight/baseline.json`. Both labs retain `step-1` through `step-9` and their underlying topic progression. The lesson/lab time estimates now agree.

Chapter 12 owns discovery configuration, interpretation, and documentation validation: v1.1 2.3 and v2.0 2.3. It explicitly requires Ethernet switching and IOS essentials. Chapter 13 owns L2/L3 LACP configuration and verification: v1.1 2.4 and v2.0 2.1.c. It adds inter-VLAN routing to prerequisites, alongside trunks/DTP and discovery. Its short endpoint compatibility treatment supports v2.0 2.2.d/e; generic access/trunk and endpoint VLAN teaching remains in chapter 09. Its short STP preview explains why bundling affects parallel switched links; root election, detailed roles/states, and costs remain owned by chapter 14.

Blueprint basis: [Cisco CCNA v1.1 objectives](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [Cisco CCNA v2.0 objectives](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf). The accepted course transition is v1.1 through 2 February 2027, v2.0 from 3 February 2027. These chapters do not introduce different exam-date claims.

## Corrections in chapter 12

- Scoped default-state and timer statements to the referenced IOS/Catalyst implementation. Removed claims that every Cisco product and every interface has the same enabled state, or that one LLDP global command overrides all interface state.
- Explained global process state and LLDP transmit/receive directions independently. The one-way exercise distinguishes the sender from the receiver and separates the observation period from restoration.
- Distinguished a received/cached advertisement, physical connection evidence, and IP/service reachability. A management address can be on another neighbor interface. Receiving it does not authenticate identity or prove ping/SSH works.
- Corrected universal chassis-ID and port-ID assumptions, capability-letter overclaims, and the assertion that all unmanaged switches forward LLDP. The retained hub example teaches limits of physical-path inference without claiming every bridge behaves identically.
- Replaced “the diagram always loses” reasoning with a documented comparison of fresh bidirectional observations, device identity, cable inspection, and proposed corrections.
- Removed exact removal-time promises and a universal interpretation of every LLDP brief holdtime field. The timer calculation now states its sender holdtime explicitly and labels elapsed time approximate.
- Built a complete isolated 2960/2911/PC topology. VLAN 1 management is expressly a simple exercise arrangement. Ports, cable types, IPs, masks, gateway settings, startup saves, final records, and an independent moved-port challenge are specified.
- LLDP steps have a supporting-image path and an explicit paper fallback. The final configuration preserves approved uplink discovery and leaves the user port intentionally outside discovery policy.

## Corrections in chapter 13

- Centered LACP active/passive semantics; neither term is taught as a primary/standby forwarding designation. PAgP and static mode remain brief comparisons.
- Separated local member compatibility from service correctness across complete logical trunks. A formed bundle and a successful ping are insufficient evidence that every member and VLAN works.
- Removed universal promises that failed LACP leaves working stand-alone links. The lesson points out the referenced current Catalyst default and requires inspecting actual state. Also removed exact convergence delays, specific lost-ping counts, and a universal healthy hexadecimal LACP state.
- Explained hash inputs and collisions, the difference between traffic sessions and selected fields, per-direction aggregate capacity, and a one-member ceiling for a stable hash-selected flow. No universal hash default is asserted.
- Added endpoint teaming prerequisites: actual host/appliance LACP support and selected mode, VLAN treatment, and a supported logical partner design. Ordinary switch-independent teaming is not assumed to require LACP or one multichassis aggregate.
- Replaced the mixed-model routed instructions with two named 3560-24PS switches using Fa0/1–2. The logical routed Po1 is created before members join, owns the IP address, and is verified through member flags, connected route, and peer pings.
- Both ends of the Layer 2 trunk are complete. Members stay shut while changes are prepared; failure, observation, and restoration are separate steps. The potentially unsafe static/LACP asymmetry is a labeled paper diagnosis, not a live reconfiguration.
- The independent challenge adds a third routed physical member without introducing another IP subnet. Its answer includes configuration order, expected member count, reachability, and capacity reasoning.
- Advanced LACP standby selection, system priority memorization, fast/slow timer recall, and aggregate STP cost recall were removed from mandatory assessment. The platform member-count example remains explicitly scoped context in the lesson.

## Primary-source evidence and claim mapping

The following pages were opened and checked during this review; URLs also appear in the relevant lesson frontmatter. The teaching and scenarios are original, with representative output identified as such.

| Source | Claims checked and application |
|---|---|
| [Cisco CDP, IOS 15M&T](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/cdp/configuration/15-mt/cdp-15-mt-book/nm-cdp-discover.html) | Global/interface controls, local timer commands, 60/180 reference values, version 2 fields, address from another interface, table refresh and clear behavior. Used throughout chapter 12 and its drills. |
| [Cisco LLDP/LLDP-MED, Catalyst 2960 IOS 15.2(2)E](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/m_1522e_int_lldp_2960s_cg.html) | Default table, explicit global/interface configuration workflow, 30/120/2 reference timers, neighbor/interface verification, and media network-policy purpose. Resolves prior overly broad default and direction assumptions. |
| [IEEE 802.1AB catalog](https://standards.ieee.org/ieee/802.1AB/6047/) | Standard identity and connectivity-discovery purpose; not treated as a simulator command reference. |
| [Cisco EtherChannel, Catalyst 3560 IOS 15.0(1)SE](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swethchl.html) | Mode pairing, compatible members, logical-interface relationship, documented routed configuration order, group removal, and verification command families. Main lab configuration reference. |
| [Cisco EtherChannel, Catalyst 9300 IOS XE 17.17](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-17/configuration_guide/lyr2/b_1717_lyr2_9300_cg/configuring_etherchannels.html) | Explicit disabled standalone default and platform-dependent failure behavior. Prevents turning the older 3560 behavior into a universal rule. |
| [Cisco EtherChannel load balancing](https://www.cisco.com/c/en/us/support/docs/lan-switching/etherchannel/12023-4.html) | Selected-field hashing, distribution constraints, and appropriate inspection of platform-supported methods. Used in capacity explanations and source-MAC case. |
| [Linux kernel Ethernet bonding documentation](https://docs.kernel.org/networking/bonding.html) | Distinguishes 802.3ad host bonding from other teaming modes and documents switch-support requirements. Supports the bounded endpoint compatibility section without asserting hypervisor-wide defaults. |

## Assessment IDs and balance

Both chapters now have 16 questions, including two multiple-answer questions and four explicit exhibits, 20 flashcards, 12 command drills, and two complete troubleshooting tickets. Every wrong question option has its own explanation. Single-answer positions are distributed 3/4/4/3 in chapter 12 and 4/3/4/3 in chapter 13. Options were reviewed for length clues after validator feedback.

All chapter 12 bank IDs are retained because the assessed concepts remain the same. Its erroneous universal claims were corrected within those concepts. Other than the following unrelated replacements, chapter 13 retains its previous bank IDs and knowledge associations:

| Retired ID | New ID | Replacement topic |
|---|---|---|
| `etherchannel-q07` | `etherchannel-q17` | Endpoint LACP compatibility instead of platform member-limit recall |
| `etherchannel-c06` | `etherchannel-c22` | Endpoint support and selected mode instead of member-limit recall |
| `etherchannel-c15` | `etherchannel-c23` | Repeated source-MAC hash input instead of LACP timer recall |
| `etherchannel-c16` | `etherchannel-c24` | Supported logical partner design instead of system-priority selection |
| `etherchannel-c18` | `etherchannel-c25` | Member failure and remaining capacity instead of aggregate STP cost recall |
| `etherchannel-d11` | `etherchannel-d13` | Routed-interface `no switchport` instead of system-ID display recall |

The retired IDs are not reused, so old mastery cannot automatically apply to these unrelated additions. No persisted progress data was edited.

## Verification and limits

`node scripts/validate-content.mjs` completed with **zero errors and no warnings for chapters 12 or 13**. The course still reports warnings in other chapters, outside this change. No final production build was run by this review.

Independent checks passed **435 assertions** covering: all lab addresses as unique usable hosts in their stated networks; non-overlap of the three exercise subnets; both `/30` usable hosts; 100-Mbps and 1-Gbps aggregate capacity arithmetic; `180 − 174 = 6`; IOS prompt syntax on configuration lines; question answer indices; and a complete wrong-option explanation set. An additional loader-based comparison confirmed every lesson section and lab step ID matches the captured baseline and identified exactly the retired/new assessment IDs above.

The primary configurations were manually traced for device context, port existence on the stated models, shutdown/start ordering, VLAN consistency, logical versus physical addressing, and separate recovery. These checks are not Packet Tracer execution. No Packet Tracer or CML instance was used; exact simulator command coverage, emitted formatting, convergence times, packet-loss counts, and throughput remain unmeasured. The lessons label output representative, and unsupported LLDP/partner-detail/routed-bundle cases have explicit alternatives rather than fabricated successful results.

Independent peer review found no material factual, topology, or assessment-answer issues. Three final clarifications were applied: q14 explicitly formats the literal global `no cdp run` command; the passive/passive ticket describes four interfaces on two links; and the discovery lab explicitly completes SW2’s startup-config destination prompt. These wording changes preserve all existing IDs and answer keys. Targeted JSON/content assertions and whitespace checks passed afterward.
