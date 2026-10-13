# Chapters 34–35 review

Reviewed and rewritten on 2026-09-20. Scope: all six files in `34-acls` and `35-vpns-ipsec`, plus this report. No application, UI, color, build, deployment or other chapter changes were made as part of this work.

## Blueprint and structure

Primary blueprint check: [Cisco CCNA v1.1](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) objective 5.6 says configure and verify ACLs; 5.5 says describe IPsec remote access and site-to-site VPNs. [Cisco CCNA v2.0](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) 4.6 explicitly names **IPv4** standard, extended, numbered and named ACLs; 4.5 says describe IPsec remote access and site-to-site VPNs, including protocols and transport modes. The course's current/future tracks remain unchanged: v1.1 through 2027-02-02 and v2.0 from 2027-02-03.

Chapter 34 remains an applied IPv4 configuration/verification chapter. No unsupported mandatory IPv6 ACL configuration was added. Chapter 35 emphasizes describe-level understanding; deep GRE/OSPF/DMVPN design, universal timers, exact message-count memorization and assumed simulator crypto capability were removed. A clearly optional supported IOS XE configuration reference remains available to connect concepts with implementation.

Both chapter IDs, numbers and parts are unchanged. All baseline lesson section IDs, including intro, are preserved through frontmatter `sectionIds` maps: 10 IDs in 34 and 9 in 35. The former GRE/VTI/DMVPN/FlexVPN section ID now anchors the narrower related traffic-selection/tunnel-interface discussion. Chapter 35 now lists earlier chapters `tcp-udp-ports`, `static-routing-ipv4` and `acls` as prerequisites; no forward prerequisite was added.

Lab progression changes are material and should be disclosed even though the application's step identities are positional. ACL steps 1–6 keep their general concepts, but steps 7–8 now provide a missing TCP return-rule fault and separate recovery instead of a router-originated-probe demonstration. VPN steps were substantially rebuilt: routed baseline, packet worksheet, optional IKEv2 reference, evidence review, filter fault, separate recovery, remote-access comparison and saving. The VPN lab now has nine steps instead of eight. Existing lab completion data is not migrated or silently reset by this content-only change; learners who completed the older exercise should revisit the revised steps.

## Final asset inventory

| Chapter | Lesson H2 sections | Approx. prose words excluding frontmatter, fenced examples and tables | Lab steps | Questions | Multi-select | Question exhibits | Cards | Command drills | Tickets |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 34 ACLs | 9 | 2,090 | 8 | 17 | 3 | 8 | 22 | 12 | 3 |
| 35 VPNs/IPsec | 8 | About 2,290 | 9 | 16 | 3 | 5 | 20 | 10 | 2 |

Every question has the correct-answer explanation and a `whyWrong` entry for each incorrect option. Single-answer position distributions are 3/3/5/3 for 34 and 3/3/4/3 for 35. Multi-select answers are separate from those totals. All tickets explain both the selected diagnosis and why alternatives do not fit the supplied evidence.

## ACL technical corrections and teaching changes

- Replaced anthropomorphic and exam-guessing prose with policy → fields → rule order → attachment → controlled test progression.
- Scoped first-match/implicit-deny conclusions to packet filtering; a permit does not guarantee a route or application success. Distinguished an interface deny from NAT or IPsec traffic-selection exclusion.
- Kept all four required ACL forms. Naming is separate from standard/extended capability. The ordinary IPv4 interface rule is one list per direction, not automatic chaining of multiple same-direction lists.
- Explained wildcard bits before subnet shortcuts. Corrected the assertion that the base must be aligned to be accepted: ignored base bits do not affect the set. Limited wildcard-plus-one range shortcuts to the applicable contiguous pattern. Kept a short noncontiguous odd-third-octet example and the erroneous subnet-mask-as-wildcard example.
- Qualified absent/empty-list and locally generated-packet behavior to documented classic IOS behavior. Removed a universal all-platform “outbound ACLs never filter local traffic” formulation and the fragile live simulator proof.
- Corrected the claim that a timeout proves a packet passed outbound. Silence can arise from filtering or loss in either direction. Removed exact Packet Tracer ICMP error wording and fixed per-ping/web/VTY counter totals as requirements.
- Corrected `established`: ACK or RST matching is not session tracking and does not prove a client initiated the packet. The lab shows ordinary reply behavior, explicitly includes the forged-ACK limitation, and does not claim complete firewall protection.
- Source-port and destination-port examples now check all address conditions as well; the former incorrectly placed source-port rule does not magically become a server-reply rule when its source and destination address conditions remain reversed.
- DNS question now explicitly supplies a UDP packet; it no longer claims all ordinary DNS uses UDP or excludes legitimate TCP DNS. The challenge includes both UDP/TCP request permissions and the previously missing UDP reply rule in the existing reverse ACL.
- VTY examples use `access-class` in line mode, distinguish it from interface filtering, and require every VTY range present to be protected. The live lab includes SSH configuration, credentials, RSA interactive prompt handling, SSHv2 and positive/negative tests.
- Sequence edits specify modes, order and exact targeted deletion; the legacy global deletion hazard remains scoped to documented IOS syntax. Substantial changes use a new complete list before swapping references. Unsupported sequence insertion/resequence paths are documented rather than asserted to work in every Packet Tracer image.
- Added a clean fault/observe/restore boundary for the missing server-side TCP permit. A fresh PC-B browser test avoids relying only on PC-A's cached page. Challenge SSH-to-Server-PT is correctly a packet-policy exercise because the supplied FILES baseline does not provide an SSH service.
- The clear-counter drill now names the ACL explicitly, matching the documented command-reference form.

## VPN technical corrections and teaching changes

- Corrected physical privacy claims about leased/MPLS services. Logical separation does not itself imply encryption or an exclusive physical wire.
- Distinguished the cryptographic protection boundary from application/endpoint authorization and protection after decryption. Removed the claim that nearly all remote-access deployments use TLS, and explained that Secure Client can support IKEv2/IPsec or TLS depending on configuration.
- Removed “always-on” and “every packet between the LANs is encrypted” absolutes. Site-to-site availability and traffic scope depend on the design and selector.
- Distinguished ESP's negotiated services from the assumption that every ESP packet uses confidentiality. AH remains nonencrypting even in tunnel mode. Clarified visible outer addresses, ESP header metadata and the fact that the inner plaintext is not readable in an ordinary encrypted WAN capture.
- Distinguished native ESP/AH IP protocol numbers from UDP ports. Qualified the usual UDP NAT-T design and explained that a native-ESP permit is not universally required when protected data actually uses UDP encapsulation.
- Explained transport mode without the erroneous universal “every site-to-site must use IPsec tunnel mode” claim; already encapsulated router-to-router GRE is a valid transport-mode context. GRE itself remains unencrypted.
- Reframed IKEv1 as legacy recognition, citing its deprecation. IKEv2 examples are separate. Removed mandatory main/aggressive/quick-mode packet counts, default SA lifetimes, GRE MTU/bandwidth/OSPF cost and replay-window trivia.
- Explained unidirectional IPsec SAs, bidirectional negotiation, CHILD_SAs, SPI identifiers, DH versus authentication, and certificate trust/revocation limitations. Certificate revocation is not claimed to be instantaneous or automatic across deployments.
- Removed QM_IDLE-only “healthy” assertions and one-state/one-cause diagnostics. Empty/deleted/intermediate tables require context. Counters are cumulative and require controlled deltas; outbound encapsulation without new inbound decapsulation is not a unique PSK, selector or return-route diagnosis.
- Required exercise is an executable routed Packet Tracer baseline plus explicitly supplied evidence worksheets. Optional full modern implementation targets physical ISR 4351 with supported IOS XE/IPsec capability; interface mapping and physical host substitutions are explicit. No generic CML node is assumed to support encryption.
- Optional reference uses IKEv2 AES-CBC-256, SHA-256 integrity/PRF, DH14, an ESP AES-256/SHA-256 transform, explicit tunnel mode, symmetric selector perspectives and WAN crypto maps. No GRE, OSPF, NAT or private routes on ISP are required. Current platform recommendations remain separately cited; this example is not a production design template.
- Both inline profile authentication commands are supported by Cisco's ISR 4351/IOS XE 16.12.01a technote; a separate keyring is unnecessary in that documented form. Explicit `key 0` is supported by the IKEv2 profile command syntax. `ipsec-isakmp` in the crypto-map command is correctly explained as compatible with an attached IKEv2 profile.
- Fault is a native-ESP interface filter on ISP while IKE/ICMP remain permitted. Transport is explicitly established before diagnosing. Recovery removes only the lab attachment and retests; no broad SA clear, forced weak algorithms, speculative interface flap or fixed negotiation delay is required.
- Proposal mismatch ticket now supplies actual offers and NO_PROPOSAL_CHOSEN evidence instead of guessing from one IKE state. Its repair uses documented `no encryption` before setting the single intended transform, then verifies the offer.

## Source-to-claim evidence map

All sources were checked as primary Cisco, RFC Editor or IANA references. Frontmatter includes the relevant URLs for learners.

| Claim family | Primary evidence |
|---|---|
| ACL ranges, wildcard bit rules/noncontiguous masks, empty-reference behavior | [Cisco IP Access List Overview](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-access-list-ov.html) |
| Standard/extended named/numbered creation and interface modes | [Cisco Creating and Applying IP ACLs](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-create-ip-apply.html), [current Catalyst ACL guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html) |
| Sequence insertion, resequence and entry removal | [Cisco ACL Sequence Numbering](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-acl-seq-num.html) |
| Legacy whole-numbered-list deletion; order and port placement | [Cisco Configure IP Access Lists](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html) |
| TCP ACK/RST matching | [Cisco Commonly Used IP ACLs](https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html) |
| VTY restrictions and SSH separation | [Cisco Harden IOS Devices](https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html) |
| Classic locally generated traffic exception | [Cisco IOS IPv4 ACL guide, interface application discussion](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960xr/software/15-2_5_e/configuration_guide/b_1525e_consolidated_2960xr_cg/b_1525e_consolidated_2960xr_cg_chapter_01000000.pdf) |
| Counter-clear command with named/numbered target | [Cisco command reference, clear access-list counters](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-c1.html) |
| IPsec policy, SA direction and modes | [RFC 4301](https://www.rfc-editor.org/rfc/rfc4301.html) |
| AH integrity scope and lack of encryption | [RFC 4302](https://www.rfc-editor.org/rfc/rfc4302.html) |
| ESP services, SPI, visible/encrypted fields and anti-replay | [RFC 4303](https://www.rfc-editor.org/rfc/rfc4303.html) |
| IKEv2 exchanges, authentication, keying and NAT detection | [RFC 7296](https://www.rfc-editor.org/rfc/rfc7296.html) |
| UDP-encapsulated ESP | [RFC 3948](https://www.rfc-editor.org/rfc/rfc3948.html) |
| IKEv1 deprecation | [RFC 9395](https://www.rfc-editor.org/rfc/rfc9395.html) |
| GRE/ESP/AH protocol identifiers | [IANA Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml) |
| IKEv2 proposal, identity and inline `pre-share key 0` profile syntax | [Cisco Configuring IKEv2](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m_sec-cfg-ikev2-flex.html) |
| Full inline-key IKEv2 crypto-map example, ISR 4351/16.12.01a platform basis, route-based versus policy-based | [Cisco technote 214728](https://www.cisco.com/c/en/us/support/docs/security-vpn/ipsec-negotiation-ike-protocols/214728-configure-multi-sa-virtual-tunnel-interf.html), section “Migration of a Crypto Map Based IKEv2 Tunnel to a Multi-SA sVTI,” pre-migration Router A/B examples |
| ESP transform and map configuration | [Cisco Security for VPNs with IPsec](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m_sec-cfg-vpn-ipsec-0.html) |
| Exact removal/reset of an IKEv2 proposal encryption list | [Cisco encryption (IKEv2 proposal) command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/d1/sec-d1-cr-book/sec-cr-e1.html) |
| Remote-access transport choices and split DNS/tunnel policies | [Cisco Secure Client 5.1 VPN guide](https://www.cisco.com/c/en/us/td/docs/security/vpn_client/anyconnect/Cisco-Secure-Client-5/admin/guide/b-cisco-secure-client-admin-guide-5-1/m_configure_vpn_access-noth.html) |
| Algorithm guidance separated from legacy defaults | [Cisco Next Generation Cryptography](https://sec.cloudapps.cisco.com/security/center/resources/next_generation_cryptography) |

## Assessment identity changes

All ACL question, card, drill and ticket IDs are retained: the assessed concepts remain the same, with corrected scope, examples and explanations. The clear-counter drill retains its concept while adding the explicit target required by the cited command form.

VPN retained items keep their assessed concepts, including legacy phase recognition, negotiation-versus-data evidence, authentication tradeoffs, ESP/AH, transport mode and the filter/proposal troubleshooting tickets. The proposal ticket now uses modern IKEv2 syntax while still assessing incompatible negotiation proposals. The transform drill uses SHA-256 rather than legacy SHA HMAC while retaining the same data-transform configuration concept.

Retired unrelated/deeper items receive new IDs so historical mastery is not assigned to a different concept:

- Retired questions: `vpns-ipsec-q06` (mandatory GRE/OSPF rationale), `q12` (GRE 1476-byte default calculation), `q14` (OSPF/tunnel recursion), `q15` (DMVPN components). Added `q16` (crypto-selector exclusion), `q17` (IKEv2 versus data SAs), `q18` (outer routing), `q19` (split protection) and `q20` (protection-service meanings).
- Retired cards: `vpns-ipsec-c05` (GRE/default-overhead memorization), `c18` (DMVPN/FlexVPN component comparison). Added `c23` (IP protocol versus UDP-port policy), `c24` (split-tunnel protection). Existing `c22` is preserved; new IDs do not reuse that number.
- Retired drills: `vpns-ipsec-d01`, `d02` (legacy IKEv1 build commands), `d06`, `d07` (GRE endpoint construction). Added `d11` (IKEv2 SA inspection), `d12` (underlay peer route), `d13` (selector inspection), `d14` (crypto-map inspection). Existing `d08` remains explicitly legacy output recognition. `d10` remains optional tunnel-interface inspection without a universal GRE MTU assumption.
- No ticket IDs are retired.

## Verification and limits

- Content validator run: **0 errors and no warnings attributed to chapters 34 or 35**. The full course had 49 warnings elsewhere at the recorded run; other agents were actively revising their chapters, so that global count is not a completion claim for their work.
- Independent Python checks: **7,395 assertions passed** across wildcard subnet equivalence and boundary exclusions, every address in the /24, /27, /30, /20 and /21 examples, all 256 odd/even third-octet cases, ignored-base-bit equivalence, the mistaken subnet-mask wildcard, both WAN /30 host pairs, controlled ACL forward/reverse matching, question option indices, unique IDs and complete incorrect-option explanations.
- Actual application markdown parser: **172 blocks, 36 IOS blocks and 4 diagrams** parsed successfully. Every nonempty IOS command line has an explicit device/mode prompt; no invalid diagram JSON was found. All baseline lesson section IDs were verified as preserved through the real loader.
- Addressing and routing were independently traced in both directions. The optional VPN map encrypts the protected LAN pair before ISP; ISP intentionally has no inner routes. The ACL challenge includes reverse UDP DNS, and its SSH service limitation is stated.
- `git diff --check` passed for both owned chapter directories. All prior `VERIFY` comments were resolved by source checks, corrected statements, removed unsupported exact claims, or explicit platform/worksheet limitations; none remain in the authored lesson/lab files.
- These checks validate arithmetic, data integrity, render parsing and reasoned configuration consistency. **They are not Packet Tracer, physical IOS or CML execution tests.** Device behavior and exact counters must be verified in the learner's chosen supported environment. No final application build, UI test, deploy, commit or push was performed by this subtask.

## Independent peer reviews

Chapter 26 (`nat-pat`): read all six final assets, including every question and incorrect-option explanation, all cards/drills/tickets, all 12 lab steps and the static-PAT challenge. No material factual, answer-semantic or reproducibility finding. Independently checked the /30 versus /28 return route, inclusive pool size, inside/global port interpretation, source selection versus filtering, static-row inference limits, mode-change clearing order, ICMP query identifiers and challenge coexistence with interface PAT. Generic two-component interface examples in questions/tickets are self-contained; the 4331 build consistently uses three-component names. No chapter 26 files were edited.

Chapter 27 (`ntp-syslog-snmp`): independently reviewed the lesson and all 13 lab steps plus challenge, with fundamentals_research reviewing the four assessment banks separately to avoid duplication. No material factual or lab-reproducibility finding in the reviewed lesson/lab. Checked NTP source/client stratum, reach-octal interpretation and convergence limits; syslog severities/thresholds/facility meanings; SNMP read-only setup, object instances and controlled community-mismatch recovery; and the counter-rate calculation. The disposable loopback preserves the management path during event testing, and unsupported simulator features have explicitly labeled worksheet alternatives. No chapter 27 files were edited.

An additional 38 independent numeric assertions passed for these peer reviews (NAT pool/link boundaries, pool size, timeout conversion, NTP reach progression, PRI arithmetic, rate/utilization and severity thresholds). These peer reviews assess documentary/configuration logic and supplied evidence; they do not claim Packet Tracer, CML or physical IOS execution.
