# Practice rework: chapters 34–36

Reviewed 24 September 2026 against the [captured baseline](baseline.json), [authoring guidance](../../AUTHORING.md), [practice plan](../../PRACTICE-PLAN.md) and [26–45 design evaluation](../practice-design/26-45-evaluation.md). The pass read all three lessons and every existing question, option, key, feedback entry, card, drill, ticket/repair and lab step before editing. Chapter identities, prerequisites, lesson section IDs/order, application code and styles remain unchanged.

## Final workload and progression

| Chapter | Questions | Retrieval / application / analysis | Cards | Drills | Tickets | Guided exercise |
|---|---:|---|---:|---:|---:|---|
| 34 ACLs | 28 | 7 / 17 / 4 | 20 | 10 | 3 | 8 steps, 85 minutes, plus independent policy build |
| 35 VPNs and IPsec | 17 | 5 / 11 / 1 | 17 | 2 | 2 | 9 steps, 60-minute required baseline/worksheet; full IOS XE VPN implementation optional |
| 36 Wireless principles | 23 | 7 / 13 / 3 | 20 | 3 | 2 | 12 steps, 55 minutes; security refresher, second AP and real-PC queries optional |

These are editorial demand levels rather than measured difficulty or exam predictions. The question order begins with foundational mechanisms, then application and combined evidence. Power conversion, SNR subtraction, counter differences and direct first-match evaluation are application. Reading an explicitly displayed field or recognizing a taught protocol fact is retrieval. No analysis quota was maintained by inflating straightforward questions. Single-answer positions are balanced without a repeating four-position cycle.

## ACLs: a policy must work for the whole path

The expanded checkpoint adds a two-packet comparison against one unchanged list, DNS reply endpoint matching, a missing reverse UDP permission, permission versus routing, a constrained HTTPS exception, an unaligned wildcard base, safe replacement without an unfiltered interval, both DNS transports, a same-VLAN path that bypasses the routed attachment, counter deltas, and a second filter rejecting an already permitted request. These are distinct policy decisions rather than new final octets attached to the same question.

Existing questions retain their same-topic identities while weaker alternatives are replaced with plausible first-match, port-position, direction and state-tracking misconceptions. The legacy whole-numbered-list deletion question is retired; the lesson retains the warning, and supported sequence deletion remains assessed. Cards narrow the multi-prefix table to a /27 cue and remove optional default-numbering/resequencing recall. Counter clearing and resequencing no longer become required drills merely because a lab can use them.

The guided lab preserves its complete 2911/two-2960 setup, addresses, services and eight-step progression. Learners draft ordered rules and predict request/reply traversal before opening the reference or worksheet key. It records both required permits and required denials. The deliberate missing TCP return rule is observed separately from recovery; the final check includes fresh HTTP and SSH. Unsupported sequence operations retain complete replacement-list fallbacks.

The new independent build uses client `10.34.16.0/27` and server `10.34.20.0/24`, with actual HTTP services on WEB and FILES plus a supplied DNS server. Both clients may reach WEB; only PC-A may reach FILES; both need UDP/TCP DNS. The reverse filter uses source service ports and the explicitly limited ACK/RST test. The solution remains closed. TCP DNS is a paper row when the simulator cannot exercise it; a permitted packet is never called a working SSH service on an unsupported Server-PT.

All ticket titles are symptom-led. Independent review corrected the management ticket feedback after its options changed. The placement ticket now attaches and verifies the correct outbound restriction before removing the incorrect inbound restriction, preserving the prohibition throughout the repair. The guided standard-to-extended transition likewise attaches the complete new ingress policy before removing the old egress restriction.

## VPNs: describe protection before optional implementation

Both blueprints use a describe verb; the announced v2.0 wording explicitly includes protocols and transport modes. The required practice therefore emphasizes endpoints, protection boundaries, IKE versus data SAs, ESP versus transport ports, NAT-T, tunnel/transport layouts, split selection and what fresh evidence establishes. New questions cover plaintext outside gateway termination, a functioning protected numeric HTTP request versus a failing name path, and visible outer metadata. Two legacy IKEv1 state/phase items are retired rather than relabeled as advanced analysis.

Cards consolidate legacy phase and product-name trivia and split the former four-service definition into manageable confidentiality/integrity and anti-replay cues. Only two observation commands remain as supporting drills: IKEv2 state and IPsec SA/counter inspection. The complete optional crypto-map implementation remains available; removing its syntax from required recall does not delete the implementation reference.

The required route is explicit: build and verify the isolated underlay, draw the protected packet, interpret supplied negotiation/data/fault/recovery evidence, compare remote access, and record limits. The long supported IOS XE configuration is a closed optional reference. Paper predictions have closed answers; the native-ESP fault and its recovery remain separate. The stated host service is ICMP echo, not a claimed HTTP or file transfer on an unconfigured PC.

The independent remote-access case supplies fresh hotel, PAT, gateway and assigned-inner addresses. Its `10.35.8.0/23` split route includes the internal server and excludes the public website. It distinguishes the post-PAT outer source from the assigned inner client address, and combines fresh counter deltas with a returned application page and account-level refusal. No live remote-access deployment is assumed.

## Wireless: measure the relevant radio conditions

New questions assess comparable SNR readings, bonded-channel overlap, a one-direction power improvement, retained addressing after a cell change, invalid cross-location SNR arithmetic, shared-airtime behavior, verified band capability and a discriminating test when client load and appliance use are competing explanations. Legacy generation-name recall is reduced. Existing security comparisons remain introductory; chapter 38 owns the detailed configuration workflow.

Cards remove the long legacy rate table, optional EIRP/wavelength memorization and duplicate width/regulatory prompts. New short cues focus on signal versus connectivity, asymmetric radio paths and SSIDs sharing spectrum. The three Windows inspection drills serve RF observation; repeated IP/ping and premature controller-preview drills are retired from this chapter.

The working WRT300N baseline now explicitly enables a wired HTTP service and requires its returned page. The wrong-key fault is an optional refresher. Channel change and restoration have separate steps, with the same HTTP transaction retested. The required closed RF worksheet includes channel reuse, comparable SNR, bonded occupied spectrum, ambiguous interference and PHY-rate limits. The independent four-cell challenge provides an explicit interference-neighbor graph and the condition allowing A/D reuse; it does not infer channel reuse from where an AP appears in a row. Physical RF and capacity remain unmeasured in Packet Tracer.

## Identity decisions

The [exact decision ledger](34-36-decisions.json) covers **180** old/current bank identities: **62 keep, 55 revise, 33 retire, 30 add**. Actions are computed against actual parsed equality. Same-topic corrections, narrowed retrieval prompts and answer-position changes preserve IDs; distinct additions use previously unused IDs. No question identity is reassigned to an unrelated subject.

| Chapter prefix | Retired questions | Retired cards | Retired drills | Added identities |
|---|---|---|---|---|
| acls | q12 | c07, c16, c18, c19 | d07, d12 | q18–q29; c23–c24 |
| vpns-ipsec | q09, q11 | c08, c09, c10, c14, c17 | d03, d04, d05, d08, d10, d12, d13, d14 | q21–q23; c25–c26 |
| wireless-principles | q07 | c03, c07, c10, c12, c13 | d04–d08 | q17–q24; c23–c25 |

All ticket IDs remain. Retirements are stated as consolidation, scope or recall-priority decisions; no unsupported destination mapping claims an item was moved elsewhere. The lesson still contains optional context where useful. Chapter 34's lab time changes to 85 minutes, and chapter 35's final practice paragraph reflects its two observation drills; these are the only lesson changes. All labs carry the September 2026 positional-checkmark notice. No progress is erased.

## Primary-source checks

Sources were reopened during this pass. The chapters retain their broader lists; these links map the decisions and claims most relevant to the revised practice.

| Claim checked | Primary source |
|---|---|
| Configure/verify ACLs; describe VPNs and wireless; announced explicit ACL varieties and VPN modes | [Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf), objectives 5.5, 5.6 and 1.11; [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), 4.5, 4.6 and 1.5 |
| Wildcard comparisons, named/numbered lists and direction | [Cisco Configure IP Access Lists](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html) |
| First match, nonempty implicit deny, scoped empty-list behavior and complete-before-attach workflow | [Cisco IOS ACL creation/application guide](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-create-ip-apply.html) |
| Supported sequence deletion/insertion and optional resequencing | [Cisco ACL sequence numbering](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-acl-seq-num.html) |
| TCP established as ACK/RST matching | [Cisco commonly used ACL examples](https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html); this per-packet test is not treated as session validation |
| Protection boundary and security associations | [RFC 4301](https://www.rfc-editor.org/rfc/rfc4301.html) |
| ESP services, visible wrapper and tunnel/transport layouts | [RFC 4303 §§2–3.1](https://www.rfc-editor.org/rfc/rfc4303.html) |
| IKEv2 negotiation and UDP encapsulation | [RFC 7296](https://www.rfc-editor.org/rfc/rfc7296.html), especially §2.23; [RFC 3948](https://www.rfc-editor.org/rfc/rfc3948.html) |
| Legacy IKEv1 treatment | [RFC 9395](https://www.rfc-editor.org/rfc/rfc9395.html) |
| Optional supported crypto-map/IKEv2 configuration family | [Cisco IOS XE configuration example](https://www.cisco.com/c/en/us/support/docs/security-vpn/ipsec-negotiation-ike-protocols/214728-configure-multi-sa-virtual-tunnel-interf.html); this does not establish Packet Tracer support |
| RF units, power ratios, channel width and spectrum context | [Cisco Wireless RF Reference Guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wireless-rf-reference-guide.html) |
| Received/noise, coverage and interference observations | [Cisco RRM reference](https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/71113-rrm-new.html); platform-specific thresholds/timers are not universalized |
| WPA3-Personal requirements and 6 GHz security boundary | [Cisco WPA3 guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-17/config-guide/b_wl_17_17_cg/m_wpa3.html), [Cisco Wi-Fi 6E security guide](https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/220712-configure-and-verify-wi-fi-6e-wlan-layer.html) |
| Wireless inspection commands and simulator GUI context | [Microsoft netsh wlan](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netsh-wlan), [Cisco Networking Academy wireless security activity](https://contenthub.netacad.com/legacy/I2IoT/2.0/en/course/files/5.1.2.6%20Packet%20Tracer%20-%20Configure%20Wireless%20Security.pdf) |

## Verification and limits

The reproducible [34–36 integrity/render check](34-36-verify.mjs) passes **180 exact decisions, 944 React-rendered fragments and 285 protected file hashes**, with preserved section IDs/order, valid earlier prerequisites, sequential lab positions and closed challenge solutions. It uses the actual content loader and rendering components. The content validator reports zero errors and no warnings for chapters 34–36.

Packet/wildcard/range arithmetic, policy paths and command sequences were checked statically. Root independently read the banks and full labs; the reported feedback, transition-order and optional-reference wording findings are resolved. No Packet Tracer, CML, hardware, physical RF survey, live IPsec implementation or learner calibration was executed during authoring. A successful content render verifies presentation, not the behavior of a Cisco image. The [batch report](README.md) records integration and independent review results separately.
