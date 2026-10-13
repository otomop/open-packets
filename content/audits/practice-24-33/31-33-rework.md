# Practice rework: chapters 31–33

Reviewed 24 September 2026 against the [exact batch baseline](baseline.json), [authoring guidance](../../AUTHORING.md), and [course practice plan](../../PRACTICE-PLAN.md). This pass examined every question and distractor, flashcard, drill, ticket and repair, and complete lab in the three chapters. It did not rewrite their lessons or change application code, styles, storage, chapter numbers, prerequisites, or lesson section identities/order.

## Workload and progression

| Chapter | Questions | Retrieval / application / analysis | Cards | Drills | Tickets | Guided lab |
|---|---:|---|---:|---:|---:|---|
| 31 Troubleshooting toolkit | 24 | 4 / 16 / 4 | 14 | 8 | 3 | 12 steps, 85 minutes; DHCP integration explicitly optional |
| 32 Security concepts | 18 | 10 / 7 / 1 | 19 | 1 | 2 | 3 required paper steps, 35 minutes; 6 optional device steps, about 45 additional minutes |
| 33 AAA | 24 | 9 / 14 / 1 | 19 | 11 | 2 | 12 steps, 85 minutes; separate TACACS+ and RADIUS copies |

These are editorial reasoning levels, not measured learner or exam difficulty. Checkpoints proceed from foundations to application and then evidence analysis. Single-answer positions are balanced without the previous repeating four-position cycle. Multi-select is retained where it tests two useful independent conclusions; security concepts does not acquire artificial multi-select or configuration quotas.

## Chapter 31: choose a test that can distinguish the remaining causes

The checkpoint adds current counter deltas, capture coverage, a controlled DF-size comparison, clock confidence, server return-next-hop evidence, a completed HTTP transaction, original-client acceptance testing, a second DNS fault after a route repair, egress drops, and differences between router-originated and client-originated paths. Competing answers emphasize premature configuration changes, narrower tests, and unsupported conclusions rather than unrelated protocol trivia. A positive error response is distinguished from silence. A server-side send is not treated as proof of client receipt.

The retained source comparison, incomplete capture, server return-path, and client-ingress cases ask the learner to combine observations. Directly applying a supplied counter, protocol result, or delivery sequence is application rather than analysis. In particular, q16's server-Offer/client-no-Offer evidence is level 2. The q18 CRC delta is zero; q25 has 100 new output drops. The 1500-byte IOS DF case does not confuse complete datagram size with Windows payload length or infer a numeric path MTU from a timeout.

Four reversible guided faults still have separate observation and recovery steps: missing return route, far-end shutdown, access VLAN mismatch, and wrong DNS data. Each now asks for a prediction before intervention and records source/destination/protocol, observed facts, competing explanations, and original-client retest. DHCP is an optional integration branch with supplied setup rather than another mandatory DHCP course. The independent challenge uses fresh addresses and a confirmed obsolete 10.31.10.50/32 Null0 route: that host's replies select the /32, while .60 and router source .1 select the valid 10.31.10.0/24. Its answer is closed until attempted.

Cards consolidate timeout/error and traceroute cues, remove detailed ICMP-number/tool-default catalogs, and add capture context, counter deltas, and clock confidence. Command recall keeps useful diagnostic queries and bounded sourced/DF tests; buffer configuration, monitor setup, and counter clearing do not become required integration drills. All three distinct tickets remain: shutdown, return route, and duplex disagreement.

## Chapter 32: conceptual decisions before optional device commands

The checkpoint focuses on threat/weakness distinctions, security properties, mechanisms, authentication factors, policy, program actions, evidence limits, and risk prioritization. New items assess integrity, independent verification of a code request, actual role-specific training, and combined exposure/business impact. Type-7 exposure, spraying timestamps, and quiet mode retain their same-topic identities. NIST guidance is presented within its stated scope, not as a claim that every Cisco device enforces a complete policy. Password compromise response replaces another isolated numeric-requirement test under the same password-policy identity.

The required lab is now a three-step paper exercise: assess an exposed backup without inventing attribution, review a password-only portal policy, and choose program controls while interpreting supplied quiet-mode evidence. Each has a closed worked answer. The independent challenge changes the branch and combines a code-request impersonation attempt, stale account, and backup confidentiality/recovery requirement. It asks for controls, checks, and limits rather than an attack simulation.

The earlier complete isolated LAN/SSH/quiet-mode setup remains available as an explicitly optional extension. It retains exact models, ports, addresses, console recovery, a bounded maximum of four failed attempts, stop conditions, a separate recovery step, and a paper fallback. This preserves useful experience without making a descriptive security chapter repeat a full SSH configuration checkpoint. The one remaining command drill is `show login`; the other setup commands are supplied references. The lesson change is limited to the lab-time metadata and one paragraph explaining this required/optional split. H2 identities and order are unchanged.

## Chapter 33: trace the actual management authentication path

The expanded bank covers line-to-list selection, group membership, explicitly matching RADIUS ports, server-send versus NAS-accepted evidence, NAS source/client registration, actual new-session checks, independent accounting proof, authentication versus EXEC authorization, and Access-Challenge. Existing protocol comparison and FAIL/ERROR questions retain their identities. Server branding and RFC-number recall are removed from cards; the three AAA functions and conventional transport/ports remain.

The lab keeps its complete local SSH preparation and repeated fresh console verification. Before central tests the learner predicts PASS, explicit FAIL, ERROR, local-only versus central-only accounts, and console behavior. TACACS+ and RADIUS run in separate saved copies with service-off observation and service-on recovery in different steps. The final named-object translation is attempted from requirements before opening its solution; a learner needing that syntax as an earlier platform fallback may use it as supplied setup. Accounting-port definition is never mistaken for an accounting policy.

The fresh paper challenge first exposes an unused named list, then an unrecognized loopback NAS source and missing server return route. The exact approved fixes are the VTY-REMOTE binding, client registration for 10.255.33.1, and server gateway 10.33.0.1. The SSH user's .50 address is distinct from the AAA request source. Rejection, outage, restore, and fresh console checks remain separate acceptance requirements. No untested authorization/accounting claim is added to the login-only lab.

## Identity ledger and scope trims

[31-33-decisions.json](31-33-decisions.json) covers all 178 original/current bank identities exactly once: 59 kept, 58 revised, 33 retired, and 28 added. Action labels are checked against actual parsed equality, not author intention. Wording, options, feedback, demand labels and narrow same-topic cues retain IDs. New subject matter receives previously unused IDs.

| Chapter | Retired question IDs | Retired card IDs | Retired drill IDs | Added IDs |
|---|---|---|---|---|
| troubleshooting-toolkit | q10, q14 | c01, c02, c05, c09, c10, c12, c18, c19, c20 | d04, d06, d08, d09 | q17–q26; c23–c25 |
| security-concepts | q04, q07 | c09, c12 | d01–d09, d11 | q17–q20; c22 |
| aaa-tacacs-radius | none | c08, c09, c16 | d12 | q17–q24; c21–c22 |

Prefixes in the table are the chapter IDs. No ticket identities are retired. Confirmed same-course destinations are recorded only where an actual item covers the subject: toolkit c02→c04, c05→d02, c09→c08, c12→c11; AAA c09→c10; security d02→ios-essentials-d01, d03→ios-essentials-d02, d08→ios-essentials-d07, d09→ios-essentials-d10. Other retirements are explicitly scope/consolidation decisions, not promises that unspecified later items exist. Required setup and contextual lesson references can remain without being mandatory recall targets.

All three revised labs include the September 2026 notice explaining that earlier positional checkmarks should be reviewed. No stored progress is cleared. Chapter 32's lab positions change as part of the required/optional redesign; 31 and 33 retain their twelve step positions.

Independent review also tightened the final assets: the evidence rubrics are H3 subsections inside their final steps, so the content loader preserves their intended position; the toolkit challenge explicitly supplies its DNS/HTTP baseline and original named-service symptom; the optional security save completes each filename prompt separately. Diagnostic ticket titles describe symptoms instead of disclosing the root cause before the learner opens the evidence. AAA q14 is command retrieval, while q21/q22 directly apply the supplied NAS identity or acceptance criteria; their final labels reflect those demands without an analysis quota. These refinements preserve existing bank IDs and are included in the ledger.

## Primary-source review

Sources were opened and checked during this pass; the chapters retain their more complete source lists. The following map identifies the claims most relevant to these practice changes.

| Claim or scope decision | Primary evidence |
|---|---|
| Toolkit practical depth; conceptual security; AAA management-client configuration | [Cisco v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) 1.4, 4.5, 5.1/5.2/5.4/5.8; [Cisco v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) 2.4 and 4.1. The latter explicitly requires local usernames and TACACS+/RADIUS clients; security concepts does not claim to complete that configuration outcome. |
| Changed ping source changes the tested return destination; extended DF test settings | [Cisco extended ping and traceroute](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html). Source, size, and response limits are applied to the stated test, not generalized into an all-path guarantee. |
| Analyzer warnings describe captured sequence history | [Wireshark TCP analysis](https://www.wireshark.org/docs/wsug_html_chunked/ChAdvTCPAnalysis.html). Capture loss and a second observation point prevent unsupported physical-fault attribution. |
| A received HTTP 503 is application-level unavailability evidence | [RFC 9110 §15.6.4](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.6.4). The practice does not infer one exact backend cause from the status. This reference was added to chapter 31. |
| Covered password policy, blocklists and compromise-triggered change | [NIST SP 800-63B-4 §3.1.1](https://pages.nist.gov/800-63-4/sp800-63b.html): distinguish single-factor use from other contexts; length alone is not a full policy. |
| Role-specific learning and program evidence | [NIST SP 800-50 Rev. 1](https://csrc.nist.gov/pubs/sp/800/50/r1/final). Course scenarios are original applications, not claims of measured staff competence. |
| Type-7 exposure and stronger device-secret storage | [Cisco protecting secrets](https://www.cisco.com/c/en/us/about/trust-center/resilient-infrastructure/protecting-secrets.html). Storage conversion does not revoke an exposed secret. |
| Quiet mode, console recovery and source exceptions | [Cisco IOS login enhancements](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_usr_cfg/configuration/15-mt/sec-usr-cfg-15-mt-book/sec-login-enhance.html). The optional lab does not assume all simulator releases implement it. |
| Named lists, line binding, FAIL stops versus ERROR fallback | [Cisco authentication guide](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_usr_aaa/configuration/15-mt/sec-usr-aaa-15-mt-book/configuring_authentication.html) and [RFC 8907](https://www.rfc-editor.org/rfc/rfc8907.html). ERROR is not restricted to a physically offline server; protocol/server failure can prevent completion. |
| RADIUS Accept, Reject and Challenge are distinct responses | [RFC 2865](https://www.rfc-editor.org/rfc/rfc2865.html). A challenge continues a supported exchange rather than selecting local fallback. |
| Current named AAA server/group configuration references | [Cisco IOS XE 17.18 TACACS+ guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-18/configuration_guide/sec/b_1718_sec_9600_cg/configuring_tacacs_.html) and [RADIUS guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/configuring_radius.html). These working source entries replace two older links that now redirect to a generic support index. They document IOS XE syntax and do not establish Packet Tracer support. |

## Verification and limits

`node scripts/validate-content.mjs` reports zero errors and no warnings for chapters 31–33. The reproducible [focused integrity/render check](31-33-verify.mjs) passes 178 ledger decisions, 923 rendered fragments, sequential lab steps, closed solution disclosures, preserved lesson identities, and 297 protected file hashes. It uses the application's actual content loader and React components. Numerical, routing, command-mode, and scenario checks are reasoning/static checks; no Packet Tracer, CML, hardware, live AAA service, or learner difficulty measurement was performed. Unsupported simulator branches must remain labeled as unexecuted paper work.

Independent findings and their resolution are recorded in the [31–33 peer review](31-33-peer-review.md). Whole-course validation, calculation checks, browser checks and integration results belong in the [final batch report](README.md); this author report does not substitute its bounded checks for those results.
