# Practice-depth evaluation: chapters 26–45

Reviewed 20 September 2026. This is a design evaluation following the completed technical audit, not a claim of learner-tested difficulty or a new simulator run. No chapter 26–45 edits were made.

## Method and standards

Loaded the current course with scripts/load-course.mjs. Compared lesson topics, prerequisites and objective verbs with every question prompt/key, flashcard cue, and lab sequence/challenge; inspected full procedures and card answers where prerequisite burden or scope needed clarification. This is a pedagogical evaluation, not a fresh exhaustive factual audit.

The user explicitly rejects uniform quotas. Bands below are recommendations based on distinct learning decisions. Final counts should follow coverage and useful variation, not grow to meet the upper limit. The revised AUTHORING.md likewise no longer makes a uniform minimum the teaching standard.

Difficulty is editorial cognitive demand:

- **R (recall):** retrieve one taught fact or distinction. A fictional technician or screenshot does not automatically raise difficulty.
- **A (application):** use a taught rule with supplied requirements, addresses, packet fields, configuration or output.
- **D (analysis/diagnosis):** combine relevant observations, distinguish competing causes, choose a discriminating test, or demonstrate that a correction meets the original policy.

These labels are not measured success rates or Cisco scoring categories. Scope follows the official [v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), using the locally verified objective text.

## Main findings

Recent lab rewrites provide complete setups, expected evidence and separate recoveries. The remaining improvement is to fade support: worked example → guided operation → partial configuration/prediction → changed independent case → evidence and correction before reference.

A deliberately introduced fault teaches a mechanism. It is not an independent diagnosis if its title names the cause. Preserve both kinds of exercise and distinguish them. Keep complete cold-start configurations, but label prerequisite preparation separately from the current chapter's assessed decisions.

Difficulty metadata currently flattens different demands: all questions in 31, 32, 33, 39, 40 and 41 are marked 2; some are definitions and some require combined evidence. Chapter 36 marks ten items 1, including several calculations/scenario decisions. Reclassify according to actual reasoning.

Cards should cue one retrievable unit. Extensive multi-service port lists, all defaults in one answer, and repeated reference tables make self-rating unreliable. Repetition is worthwhile when it changes the task: port recognition in 06 becomes matching both packet directions in 34. Repeating the same table in 06/27/31/45 adds workload without equivalent benefit.

## Recommended bands

R/A/D percentages are approximate design allocations, not strict quotas. Question counts include both track-relevant and clearly marked supporting practice.

| Chapter | Current Q/cards | Recommended Q | Recommended cards | R/A/D |
|---|---:|---:|---:|---:|
| 26 NAT/PAT | 16/20 | 20–26 | 18–24 | 15/50/35 |
| 27 NTP/syslog/SNMP | 16/23 | 24–30 | 22–28 | 20/50/30 |
| 28 QoS | 16/20 | 14–18 | 12–18 | 25/60/15 |
| 29 Files | 16/21 | 18–24 | 16–22 | 20/55/25 |
| 30 Client troubleshooting | 16/20 | 20–26 | 16–22 | 10/45/45 |
| 31 Troubleshooting toolkit | 16/20 | 22–28 | 10–16 | 5/40/55 |
| 32 Security concepts | 16/20 | 12–18 | 14–20 | 35/50/15 |
| 33 AAA | 16/20 | 20–26 | 16–22 | 20/45/35 |
| 34 ACLs | 17/22 | 24–32 | 18–26 | 10/50/40 |
| 35 VPNs/IPsec | 16/20 | 12–18 | 12–18 | 30/50/20 |
| 36 Wireless principles | 16/22 | 18–24 | 14–20 | 25/55/20 |
| 37 Wireless architectures | 16/20 | 14–20 | 14–20 | 20/55/25 |
| 38 WLAN security | 16/21 | 20–26 | 16–22 | 15/50/35 |
| 39 Virtualization | 16/20 | 12–18 | 12–18 | 30/55/15 |
| 40 Management/SDN | 16/20 | 12–18 | 10–16 | 25/55/20 |
| 41 REST/JSON | 16/20 | 18–24 | 14–18 | 20/60/20 |
| 42 Ansible/Terraform | 16/22 | 18–24 | 14–20 | 20/55/25 |
| 43 AI operations | 16/20 | 18–24 | 10–16 | 15/50/35 |
| 44 Branch capstone | 17/22 | 18–24 | 8–14 | 0/35/65 |
| 45 Exam readiness | 19/31 | 24–36 mixed review | 8–12 process cues | 10/45/45 |

A larger bank is justified where the chapter contains several protocols or interacting configuration decisions. Capstone depth comes chiefly from the build, not a large glossary. Even 36 mixed questions are a bounded sample, not an exhaustive mock exam.

## Chapter-by-chapter decisions

### 26 — NAT and PAT

**Alignment:** v1.1 configures/verifies static and pool inside-source NAT; v2.0 configures NAT/PAT. The static-routing prerequisite and supplied selector primer are appropriate.

**Lab goal:** produce before/after address/port tuples, select a translation mode from a requirement, and verify the return path. Retain the twelve-stage guided comparison, then give a partially specified pool and a changed incident distinguishing selector mismatch, exhaustion and missing return routing. Require actual table evidence, not just successful ping.

**Practice changes:** retain q09/q16 return-path reasoning. q03/q14 both expose interface-role problems; make one a multiple-observation discriminator. De-emphasize q06 seconds-to-hours recall and c11/c12 timer catalogs. The private-range card repeats addressing; prioritize translation interpretation. Add static/pool/PAT selection and changed-source cases rather than more timeout trivia.

### 27 — NTP, syslog and SNMP

**Alignment:** v1.1 configures NTP, explains SNMP and describes syslog. v2.0 retains SNMP function/syslog interpretation without a direct NTP tag.

**Lab goal:** three checkpoints within the thirteen-stage lab: prove clock selection; predict and observe destination thresholds; distinguish polling/notifications and interpret counter changes. Finish with a short incident correlating a questionable timestamp and management records.

**Practice changes:** this chapter merits more questions because it owns three services. q01/q02/q03/q14 repeat stratum relationships; keep necessary retrieval and add different synchronization outcomes. q15 PRI arithmetic is supporting depth, while IOS message content and eligible destination levels need more practice. Reference-clock literals and exact message mnemonics should not crowd out source, threshold and security interpretation. Do not require SNMP production configuration merely because NTP has a configure verb.

### 28 — QoS

**Alignment:** explain per-hop behaviors, not production policy engineering.

**Lab goal:** preserve paper-first classify → mark → queue → rate/congestion decisions. Clearly separate the optional platform marking exercise from core explanation. Require a prediction of actual packet direction and marked value, followed by fault evidence and separate recovery.

**Practice changes:** sixteen distinct questions can be enough. Reduce repeated AF/CS/CoS arithmetic and headline voice-value recall. q09 appropriately supplies worksheet limits, but comparing them is not advanced design. Keep q16 direction/evidence reasoning and policing-versus-shaping comparisons; add a controlled same-traffic comparison of waiting, remarking and dropping. NBAR and legacy Catalyst default behavior remain scoped context. Avoid expanding the bank with another DSCP conversion.

### 29 — Configuration and software files

**Alignment:** v1.1 describes TFTP/FTP; v2.0 manages files securely with SFTP/SCP.

**Lab goal:** divide the fifteen-stage workload into backup, staged retrieval and secure-transfer submissions. Keep complete installation/identity setup as reference preparation. After a worked copy, require the learner to choose source, destination and verification from an incomplete requirement. Transfer success must remain distinct from merge, activation and application of configuration.

**Practice changes:** q10/q14 both test trusted hash checks; change one to an acceptance decision with additional evidence. Add a meaningful discriminator between authentication, protocol-subsystem and path/permission failures. Preserve merge-versus-replace. Classic boot-register, boot-order and packages.conf detail are scoped references, not the center of secure-transfer mastery. Cards should retrieve store affected, direction, protection and evidence rather than multiple CLI variants at once.

### 30 — Client OS troubleshooting

**Alignment:** v1.1 verifies parameters; v2.0 explicitly troubleshoots wired/wireless clients on three operating systems.

**Lab goal:** the fifteen-stage fault sequence should culminate in an unnamed incident. Require a matrix of local peer, gateway, remote IP, fresh DNS and application results before deciding the cause. One real/supplied second-OS comparison is useful; three mandatory OS installations are unnecessary.

**Practice changes:** add competing-route and retained-address cases, plus correct resolver/wrong-record discrimination. q02/q03/q10/q12 are useful applications; q07's setting choice is application despite its current recall label. Do not let hexadecimal macOS masks dominate difficulty. Preserve OS command differences while avoiding repeated APIPA cues. Client interpretation belongs here; relay configuration and controller security remain with 24 and 38.

### 31 — Troubleshooting toolkit

**Alignment:** v2.0 specifically requires diagnosis using commands, logs, sourced tests, traces and captures.

**Lab goal:** retain the twelve-stage known-fault workshop, then add independent incidents requiring a chosen next test. Submission: symptom, evidence, remaining alternatives, discriminating test, narrow correction and original service retest.

**Practice changes:** q07/q15/q16 can earn analysis when multiple observations matter; q14 method naming is recall. Expand sourced/return-path and capture-location reasoning. Avoid making “investigate further” the universally obvious correct answer. Reduce repeated severity lists and detailed probe defaults in flashcards; keep concise evidence rules. This chapter should connect earlier skills, not become another glossary or another DNS walkthrough with only new addresses.

### 32 — Security concepts

**Alignment:** define concepts and describe security/password-program elements.

**Lab goal:** shorten repeated SSH construction from 08. Center a risk/control worksheet: asset, weakness, plausible threat, mitigation and residual limitation; then distinguish awareness, training and physical admission. A small controlled quiet-mode observation supports understanding without becoming a lengthy device-hardening test.

**Practice changes:** q01/q06/q07/q13/q14 are mostly recognition, despite all being marked 2. Twelve to eighteen well-designed questions can cover the scope. Reflection-ratio arithmetic and q16 precise NIST covered-policy numbers should not displace CCNA program understanding. Keep current source guidance distinct from required exam facts. Password-type and Layer 2 control cards repeat owners 08/16; either apply them to a new decision or avoid redundant lists.

### 33 — AAA

**Alignment:** compare concepts in v1.1; configure TACACS+/RADIUS management clients in v2.0.

**Lab goal:** preserve local recovery and the distinct FAIL/ERROR experiments. Add partial group/list binding and an independent incident separating login authentication, EXEC authorization, server client identity and return path. Require new sessions for all claims; retain the console recovery path.

**Practice changes:** q03 port recall should be labeled accordingly. q05/q06 must remain distinct because refusal differs from unavailable service. Follow them with evidence that requires identifying the actual result. q11 authorization fallback and q15 source identity can support analysis. Do not add full ISE administration. Cards should prioritize client/server roles, selected lists, line binding and method outcomes over parallel legacy/named syntax catalogs.

### 34 — ACLs

**Alignment:** configure/verify in v1.1; configure standard/extended, numbered/named IPv4 lists in v2.0.

**Lab goal:** four products: evaluate packets in order; write a source policy; write a service policy including replies; edit one entry and prove allowed/denied traffic. The current eight stages are dense: add learner predictions and partially completed flow tables before complete reference lists.

**Practice changes:** this chapter justifies the largest individual technical bank. Add several packets against one unchanged list, reverse-flow failure, placement with preserved exceptions, and safe-edit verification. Prioritize host/any/prefix wildcards before moderate noncontiguous examples. q06/c22 absent-list behavior and q12 legacy deletion risk are cautions, not substitutes for first-match/implicit-deny mastery. Keep VTY policy separate from transit filtering. A simple destination-port item such as q17 should precede complex return-policy analysis.

### 35 — VPNs and IPsec

**Alignment:** both tracks describe remote-access/site-to-site VPNs; v2.0 explicitly adds protocols and transport modes.

**Lab goal:** label endpoints and protected packet parts; distinguish path, negotiation and protected-data evidence. Keep the nine-stage exercise's full IOS XE IKEv2 implementation optional. Paper core must be complete without claiming a successful tunnel.

**Practice changes:** keep ESP-versus-port confusion, selector-versus-filter meaning, split-tunnel scope and counter deltas. Reduce the priority of legacy IKEv1 state strings and phase catalogs. A focused 12–18-card set covers services, endpoints, modes and encapsulation. No production certificate infrastructure, detailed cryptographic transform inventory or memorized full tunnel configuration is required for the descriptive verbs.

### 36 — Wireless principles

**Alignment:** describe wireless principles, including v2.0 band/channel decisions and interference.

**Lab goal:** use a short working WLAN baseline, then emphasize scans, overlap/reuse, controlled interference comparisons, and SSID/BSSID/PHY-rate evidence. The twelve-stage key-fault sequence repeats work in 30/38; preserve basic security demonstration but give RF interpretation more of the learner's effort. Simulation is not a real survey.

**Practice changes:** reclassify q02/q03 calculation and q04/q15 scenario choice by their actual demand. Add controlled observations and wider-channel tradeoffs. Broad security recognition belongs here; handshake failure diagnosis belongs in 38. Reduce headline standard rates, wavelength and generation catalogs as compulsory card material. Keep units, signal/noise, scoped channel planning and identity distinctions.

### 37 — Wireless architectures

**Alignment:** v1.1 describes architectures/modes and physical connections; v2.0 configures AP edge connectivity. Existing VLAN, routing, LACP and DHCP prerequisites support it.

**Lab goal:** draw control and client-data paths under central/local switching; select access/trunk/native/allowed VLAN settings from changed AP requirements. Preserve wired-first verification and registration-versus-service distinctions.

**Practice changes:** q05/q12 make a useful port-design contrast; q13/q16 add discovery/power evidence. Option-43 hex decoding, AireOS virtual/service-port details and legacy static-LAG conventions should not dominate mandatory recall. Keep these scoped references while centering architecture/path decisions. Controller-outage questions must supply mode/authentication conditions, not teach a universal outage result.

### 38 — WLAN security

**Alignment:** v1.1 includes GUI interpretation and actual WPA2-PSK configuration/verification; v2.0 retains security-protocol description.

**Lab goal:** preserve the fourteen stages and separate security failure from fresh-DHCP failure. Add an incomplete second-WLAN specification before the independent variation. Submission should connect intended profile/SSID/mapping/security with current client stage, lease and fresh application result.

**Practice changes:** q01/q04/q08/q11/q12 cover different valuable failure stages; extend with a genuine security-versus-VLAN/DHCP discriminator. Avoid making every incident a bad password. Key-derivation internals and every legacy state/QoS-profile label should not displace GUI choices. Cards should prioritize PSK constraints, Personal/Enterprise, WPA2/WPA3, PMF limits and revocation; avoid another full AAA port list.

### 39 — Virtualization

**Alignment:** describe/explain hypervisors, VMs and containers; v2.0 adds virtualized-host edge connectivity. VRFs remain explicit v1.1 virtualization scope.

**Lab goal:** keep the honest host-uplink model and optional VRF operations. Require port selection, a shared-failure explanation and correct routing-context choice. A second full hypervisor installation is unnecessary.

**Practice changes:** q01/q02/q03/q12/q15 are largely recognition despite difficulty 2. q07/q11/q16 provide more substantive application. The many command/VRF cards outweigh basic VM/container behavior; reduce duplicate legacy/multiprotocol forms but preserve context selection and verification. Docker/Kubernetes and namespaces can stay explanatory context without becoming implementation requirements. A modest bank fits the verbs.

### 40 — Management and SDN

**Alignment:** v1.1 explains automation/controller architecture; v2.0 describes five management approaches.

**Lab goal:** retain management-versus-forwarding evidence, but identify repeated OSPF/SSH construction as preparation. The independent product should be an architecture mapping and a change review: plane/function, controller observation, intended change and operational acceptance test.

**Practice changes:** q04/q05 repeat API direction; make one transfer to a different architecture. q10 underlay dependency and q13 drift can earn analysis; product-role names are recall. Reduce OpenFlow/OpFlex, VXLAN numbers and multiple product-role catalogs in the core card set. Keep underlay/overlay, control/data and overlapping management approaches. Full SD-Access/ACI/SD-WAN deployment is unnecessary.

### 41 — REST APIs and JSON

**Alignment:** describe API characteristics and recognize JSON; writing a production server is not required.

**Lab goal:** keep the deterministic local service as optional observation, separating one-time setup from decisions. Require request/method/header interpretation, status/body interpretation, value-type/path reading and syntax-versus-schema distinction. Give a changed request and JSON object before the 202/task-result challenge.

**Practice changes:** direct terminology recall and chained response interpretation should not share an automatic difficulty 2 label. q04/q07/q16 provide useful separate auth/availability/asynchronous outcomes. Add an array/object lookup and path/query/body distinction. Reduce multi-status flashcards with four unrelated meanings. Vendor token patterns remain documented examples, not universal rules. Do not assess recall of the supplied Python handler.

### 42 — Ansible and Terraform

**Alignment:** v1.1 recognizes capabilities; v2.0 uses Ansible to execute commands.

**Lab goal:** preserve complete setup and the honest real-target requirement. The v2 submission needs reviewed inventory/limit, selected read-only commands, remote output and bounded error recovery. Local debug cannot substitute. Installation/known-host procedures are necessary setup, not a memorization test. Terraform remains an optional local capability exercise.

**Practice changes:** add partial read-only playbook, host intersection, output indexing and authentication-versus-command failure decisions. Existing Vault/configuration-module examples should not dominate execute-command practice. Retain Terraform plan/state recognition but reduce detailed lifecycle CLI recall. Narrow combined term/module cards. Added depth is justified for actual execution decisions, not more automation-product trivia.

### 43 — AI in network operations

**Alignment:** v1.1 explains generative/predictive AI and ML; v2.0 describes agentic workflows and selects prompts with named components.

**Lab goal:** treat DNS setup as prerequisite preparation. Main submissions: write a prompt before seeing models, critique unsupported advice, evaluate a proposal against enforced authority and verify closure. Use fictional evidence; no account/key/upload is necessary.

**Practice changes:** q04/q14 currently select similarly cautious prompts. Vary the actual task, permitted data, output format and missing component so the correct option is not always the longest safety paragraph. q03 is recall; q07/q09/q12/q17 can demand analysis. Reduce academic taxonomy, product-name and duplicated DNS cards. Preserve evidence, uncertainty, data classification, prompt purpose, tool authority and outcome verification.

### 44 — Integrated branch

**Alignment:** integration of the mapped earlier IPv4/switching/service/security skills; deliberately not every exam objective.

**Lab goal:** retain the nineteen-stage supported build, then require a fresh requirements-led variation. Score functional evidence rather than line count/speed: addressing, switching, both route directions, translated flows, required denials, new management sessions and logs. Present independent incidents without naming the removed command.

**Practice changes:** the existing 17-question bank already has useful application/analysis. Add dependency-change and conflicting-test cases only where integration is necessary. Do not increase it with isolated protocol trivia. Reduce cards to cross-feature rules, source-sensitive tests, policy evidence and handover dependencies. Individual-topic fact retrieval belongs in its owning chapter.

### 45 — Exam readiness

**Alignment:** planning and bounded mixed retrieval, not a new technical domain.

**Lab goal:** preserve independent-before-reference work, sixteen local checkpoints and a changed attempt. Keep a separate list of unpractised objectives absent from this topology. Neither elapsed time nor the local score predicts passing.

**Practice changes:** one question across each of many topics cannot prove coverage. Expand only enough to sample coupled decisions, then direct mistakes back to the relevant chapter bank. The current 31 cards include twenty number-tagged reference entries, duplicating many earlier tables. Prefer 8–12 readiness/process cues in a future deliberate rewrite; do not silently reuse old technical IDs for new process advice. Keep policies dated and tied to official appointment instructions.

## Approved starting design: chapters 06–08

These exact targets were proposed and accepted for the next bounded authoring phase. They are not a template for the rest of the course.

| Chapter | Questions: R/A/D | Cards | Lab stages |
|---|---:|---:|---:|
| 06 TCP/UDP/ports | 14: 4/8/2 | 18 | 8 |
| 07 Ethernet switching | 18: 4/10/4 | 20 | 10 |
| 08 Secure device access | 20: 4/10/6 | 22 | 11 |

**06:** Reduce header/registry/closing arithmetic relative to request/reply endpoint interpretation. Keep one simple next-byte example, concurrent connections and application reliability over UDP. Stages: minimal single-LAN setup; service baseline and predictions; worked TCP opening then reverse-endpoint completion; fresh UDP DNS observation; independent socket/packet interpretation; known HTTP-service fault; separate restore; evidence submission and changed variation. Actual ephemeral ports and simulator support remain observations, not prescribed output.

**07:** Preserve MAC/ARP distinction, source learning, destination lookup and same-port filtering. Add successive-frame/table decisions and a changed source location. Ten stages move from actual-MAC inventory through worked learning, unknown unicast with different host/switch state, partial predictions, a two-switch uplink and source movement, then one static-entry fault and separate recovery. Avoid a long aging wait or syntax busywork becoming the main task. Submit before/after evidence and actual egress sets; retain an independent variation with a complete answer key.

**08:** More practice is justified by modes, accounts, privilege, line authentication, server identity, VTY transport, current sessions, persistence and recovery. Eleven stages: access specification/console path; IP baseline; accounts; console policy; complete SSH/actual VTY ranges; fresh sessions at two privilege levels; partial access requirement; fault observation; separate recovery; fresh console/SSH verification plus save; evidence submission and new independent variation. Do not center hash-algorithm catalogs or legacy version labels. Drills must test configure/verify actions; tickets must distinguish credential, transport and IP evidence.

The following phase may edit only authorized 06–08 practice assets and essential small lesson alignment/metadata notes. A complete machine-readable per-item decision ledger will compare old/current banks against practice-design/baseline.json. The recommendations for 26–45 remain planning only. No UI, styling, server, build or Git operation was performed.
