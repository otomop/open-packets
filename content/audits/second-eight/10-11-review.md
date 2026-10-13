# Chapters 10–11 content review

Reviewed 2026-09-20 UTC. Scope: all six authored files in each of `10-trunks-dtp` and `11-inter-vlan-routing`. No UI, styles, application logic or other chapter files changed.

## Result and scope

Both chapters were rewritten around the required operating skills and reviewed together with their labs, questions, cards, drills and tickets.

| Chapter | Lesson words reported by loader | Lab steps | Questions | Multi-select | Exhibits | Cards | Drills | Tickets |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 2,398 | 10 | 16 | 2 | 6 | 20 | 12 | 2 |
| 11 | 2,283 | 12 | 16 | 2 | 5 | 20 | 12 | 2 |

Chapter 10 directly teaches v1.1 2.2/a/b/c and v2.0 2.1.b: static trunk configuration, tagging, native VLAN agreement and verification. DTP is bounded recognition, with basic auto/desirable/static behavior and nonegotiate; negotiation timers, destination-MAC trivia and detailed legacy negotiation displays were removed. One question and one drill retain a conditional older-platform encapsulation selector because it explains a real CLI rejection. They do not claim that all 3560/9200 interfaces have the same encapsulation choices.

The added AP, virtual-host and appliance section contributes the **switch-side tagging portion** of v2 2.2.b/d/e. It does not claim complete wireless, hypervisor, firewall, PoE, aggregation or protection coverage. An AP's advertised SSID count does not by itself decide whether its wired port must trunk. Local switching and explicitly stated tagging requirements do.

Chapter 11 directly teaches v1.1 2.1.c and the relevant portions of v2.0 2.1/a/d: router subinterfaces, SVIs, routed physical ports and their verification. It applies chapter 01's packet walk rather than reintroducing all Ethernet/ARP fundamentals. It uses one subnet per VLAN as the example design. Remote route selection and policy remain in later chapters.

Blueprint baseline comes from the course's official Cisco v1.1 and announced v2.0 source documents, already verified by the coordinating reviewer:
- https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf
- https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf

## Technical corrections

### Chapter 10

- Removed the false assertion that only switch-to-switch links carry tags or that hosts never see tags. Ordinary PC access traffic is distinguished from VLAN-aware AP, router, virtual-host and appliance interfaces.
- Replaced “carries every VLAN” with configured and operational VLAN eligibility.
- Qualified native behavior as the default treatment of ordinary data; added the supported native-tagging exception without adding an advanced configuration exercise.
- Separated native VLAN, management purpose, access VLAN and allowed-list roles.
- Corrected “allowed but not active” diagnosis to absent **or inactive** local VLAN, rather than claiming nonexistence from the list alone.
- Removed guaranteed PVID warning strings/timers and guaranteed “tagged VLANs unaffected” outcomes. Mismatch evidence is the two configured native values; protective behavior is conditional.
- Corrected assumptions about VLAN 1 removal disabling all control traffic.
- Scoped DTP defaults to the cited 2960 guide and separated negotiation suppression from trunk mode.
- Removed the third-switch model-comparison lab. The main build is two 2960 switches and four ordinary PCs, with a disconnected AP switch-port inspection extension.
- Native mismatch is a configuration observation, not a promised ping failure when no native endpoint exists.
- Replaced management-SVI dependence in the trunk tickets with self-contained same-VLAN PC tests.

### Chapter 11

- Removed the implication that every broadcast domain can contain only one subnet.
- Scoped source/destination IP preservation to ordinary routing without NAT; retained TTL/checksum changes and separate ARP exchanges on the two VLANs.
- Added the router's destination-side ARP to the sequence diagram.
- Clarified subinterface suffix versus actual encapsulation VID, and that up/up does not prove correct far-end tagging or a configured gateway.
- Corrected native handling: use an explicit native subinterface when that is the design; no claim that missing native configuration necessarily reclassifies every untagged frame as routed VLAN 1.
- Distinguished VLAN creation from SVI creation and management reachability from enabled user-packet forwarding.
- Corrected the default-route requirement: connected routes can suffice; a routing switch uses matching routing-table entries rather than ip default-gateway.
- Removed one-to-one universal mapping of SVI up/down versus down/down to specific causes. VLAN/port evidence is required.
- Corrected connected/local-route expectations for older images.
- Removed software-routing versus wire-speed categorical claims and blanket family feature assertions.
- Explained that a routed Ethernet port still uses MAC addressing and ARP despite not being a VLAN switchport.
- Corrected the ticket that inferred a failed paste from missing settings. The observable defect is missing encapsulation and address; its history is not proven.
- Part B's routed link is tested between its two directly connected addresses only. No PC-to-R2 success is promised without return routes.

## Primary source evidence

All following URLs were opened through the web tool during this audit. These are technical sources, not claims that an installed Packet Tracer image was executed.

| Claim or command group | Primary source and review finding |
|---|---|
| 2960 VLANs, static trunk and DTP modes, nonegotiate, allowed list | [Cisco 2960 VLAN configuration guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvlan.html). Supports the platform-scoped defaults and configuration pattern. |
| Native traffic default, native matching, allowed list and operational checks | [Cisco 9300 IOS XE 17.12 trunk guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/vlan/b_1712_vlan_9300_cg/configuring_vlan_trunks.html). Native tagging is not treated as an unconditional rule. |
| Four-byte insertion and FCS recalculation | [Cisco 802.1Q interswitch example](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6000-series-switches/10599-88.html). The frame-size arithmetic is the stated 1,518-byte example plus four bytes. |
| Tag location, TPID, 16/3/1/12 field widths | [Cisco frame format reference](https://www.cisco.com/c/en/us/support/docs/lan-switching/8021q/17056-741-4.html). This older document uses CFI terminology. [Cisco ACI field definitions](https://www.cisco.com/c/en/us/support/docs/cloud-systems-management/application-policy-infrastructure-controller-apic/215015-qos-in-cisco-aci-within-a-pod.html) independently confirm PCP, one-bit DEI and twelve-bit VID; no ACI configuration is imported into the chapter. |
| Explicit native VLAN tagging exists on supporting platforms | [Cisco 3650 VLAN command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/software/release/16-1/command_reference/b_161_consolidated_3650_cr/b_161_consolidated_3650_cr_chapter_010001.html), vlan dot1q tag native. No native-tag feature command is required in the lab. |
| AP locally switched VLANs and native management agreement | [Cisco Wireless Controller 8.10 FlexConnect](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/flexconnect.html). The example explicitly supplies local client mappings and untagged management requirements; it does not generalize to every AP mode. |
| Virtual-switch tagging and physical trunk relationship | [Cisco VMware network architecture](https://www.cisco.com/c/en/us/td/docs/solutions/Enterprise/Data_Center/vmware/vmware/VMware.html). Used for the enduring VLAN-tagging architecture only; no current ESXi UI, licensing, NIC-teaming or product-specific behavior is inferred from this old guide. |
| Router subinterface encapsulation/address order and native subinterface | [Cisco external-router inter-VLAN example](https://www.cisco.com/c/en/us/support/docs/lan-switching/inter-vlan-routing/14976-50.html) and [IOS XE routing-between-VLANs guide](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/lan-wan/lan-wan/m_lsw-conf-rout-vlan.html). Named 2911 lab interfaces are explicit; no unsupported all-version simulator guarantee. |
| SVI purpose, VLAN existence, enabled SVI, forwarding member port, routed-port role | [Cisco 3560 interface guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_2_se/configuration/guide/scg3560/swint.html) and [Cisco 3650 interface guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/software/release/37e/consolidated_guide/b_37e_consolidated_3650_cg/b_37e_consolidated_3650_cg_chapter_0100.pdf). Ordinary autostate conditions are taught; autostate-exclude knobs are out of scope. |
| Switch management addressing and host-style default gateway | [Cisco 2960 IP address/default-gateway guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swipaddr.html). Route-to-destination and return-path requirements are made explicit rather than promising remote access from one command. |
| Local host routes and older IOS differences | [Cisco local-host route technical note](https://www.cisco.com/c/en/us/support/docs/ip/ip-routing/116264-technote-ios-00.html). Separate IPv4 L entries are not promised on all older images. |
| Separate local address resolution and router forwarding behavior | [RFC 826](https://www.rfc-editor.org/rfc/rfc826.html), [RFC 1812](https://www.rfc-editor.org/rfc/rfc1812.html). The worked packet walk uses original addresses and separates router-received and router-transmitted frames. |

## Structure and progress identity

Chapter IDs and numbers are unchanged. No old lesson section IDs are retired. The following renamed headings explicitly preserve their old IDs through sectionIds metadata:

- Chapter 10: Native VLAN and untagged traffic → native-vlan-the-one-vlan-that-travels-untagged.
- Chapter 10: Configure a static trunk → configuring-trunks-on-2960-3560-and-9200.
- Chapter 10: Recognize DTP negotiation → dtp-how-a-port-decides-to-trunk.
- Chapter 11: Follow a packet through two VLANs → the-packet-walk-macs-change-ips-do-not.
- Chapter 11: Routed ports and gateway designs → routed-ports-and-the-four-designs-compared.

New chapter 10 section: trunks-to-aps-and-virtual-hosts. Static configuration now precedes bounded DTP recognition. Chapter 10 has nine H2 sections to preserve existing topic identities while adding the required endpoint section; the authored lesson is still 2,398 words excluding code. No unrelated material was put under an old section ID.

The labs are substantially rebuilt, keeping the course's sequential step-N format. Chapter 10 grows from 8 to 10 steps; chapter 11 grows from 11 to 12. Prior completion of old lab steps should not be represented as evidence that these new exercises were performed. No local learner state was edited or cleared by this audit.

Retired assessment IDs:
- trunks-dtp-q11: advanced DTP configuration inference.
- trunks-dtp-q15: negotiated-encapsulation display abbreviation.
- trunks-dtp-c09: duplicate, overabsolute “tagged VLANs keep working” symptom cue.
- trunks-dtp-c15: DTP timer/destination-MAC trivia.
- trunks-dtp-c17: model-family encapsulation command generalization.
- trunks-dtp-d07: actively configure DTP desirable.

New assessment IDs:
- trunks-dtp-q16: AP native/tagged profile.
- trunks-dtp-q17: virtual-host all-required-VLANs-tagged profile.
- trunks-dtp-q18: tagged appliance switch-port profile.
- trunks-dtp-c21/c22/c23: AP trunk decision, AP management classification, virtual-host tagged profile.
- trunks-dtp-d13: verify local VLAN existence/activity.
- inter-vlan-routing-q16: directly connected routes versus an unnecessary default route.

All other assessment IDs retain their original underlying concept with corrected wording and explanations. Chapter 11 retired no assessment IDs. Existing ticket IDs retain their allowed-list/native-mismatch and missing-VLAN/incomplete-subinterface diagnostic concepts.

## Verification and limitations

- `node scripts/validate-content.mjs` passed with **0 errors**. At that run there were 105 warnings elsewhere in the course; neither chapter 10 nor chapter 11 had warnings.
- `node content/audits/second-eight/verify.mjs` passed the complete eight-chapter rendering/integrity batch, including 1,986 rendered fragments at this checkpoint.
- Reviewed parsed section IDs against the baseline: **no old lesson section IDs lost**.
- Single-answer position counts: chapter 10 **4/4/3/3**; chapter 11 **3/3/4/4**. Every incorrect option has an explanation. Each bank has two multi-select questions.
- Checked named ports, cable types, addresses/masks/gateways, VLAN and tag agreement, separate fault/recovery steps, save prompts, and independent challenge answers across lesson/lab/banks.
- Corrected an angle-bracket command placeholder to inline code so the renderer does not treat it as HTML.
- No final application build was run by this subagent; the coordinating agent owns final integration/build.
- **Packet Tracer, physical Cisco devices, controller software and a hypervisor were not executed.** The course states this limit. Output is representative and model-dependent. The disconnected AP exercise validates a switch-side configuration only, not a running wireless deployment.


Independent peer review of all twelve authored files found no material factual, command-context, lab prerequisite, or assessment-answer issue. That review independently checked VLAN/IP arithmetic and likewise did not execute a simulator.
