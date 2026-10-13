# Practice depth and progression

Design review: 20 September 2026; implementation status updated 24 September 2026. This plan governs labs, checkpoints, flashcards, command drills and troubleshooting cases. It replaces the former practice quotas with a workload chosen for each chapter's role. Implementation is complete across chapters 00–45 in four batches: 00–08, 09–23, 24–33 and 34–45. Batch reports record actual counts and verification rather than treating these original planning bands as quotas.

The app numbers orientation as 00. The opening batch therefore includes that short introduction and the user's numbered chapters 01–08. Chapter IDs and lesson order remain stable.

Command selection was reviewed again chapter by chapter on 27 September 2026. The [command relevance audit](audits/command-relevance-2026-09-27/README.md) supersedes earlier command-bank counts and the first command-trainer teaching design. Its item-level decisions distinguish required practice, useful optional depth and supplied setup. A chapter without command recall keeps its lesson/lab practice and directs learners to the appropriate syntax owner.

## Standard for the course

Start with the action the learner should be able to perform, then choose evidence that would demonstrate it. A question asking for a definition cannot establish configuration skill; a pasted configuration cannot establish independent diagnosis. The [Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) determine the technical scope and required verbs. Their broad domains are not instructions to give every chapter an equal number of questions.

This design uses assessment alignment and misconception-based alternatives, consistent with [Carnegie Mellon's alignment guidance](https://www.cmu.edu/teaching/assessment/basics/alignment.html) and [Yale's assessment-question guidance](https://poorvucenter.yale.edu/teaching/teaching-resource-library/designing-assessment-questions). These references inform the method; they do not certify this course or prescribe the counts below.

Academic rigor here means accurate reasoning, useful feedback and independent application. It does not mean obscure trivia, unnecessarily long questions or advanced configuration before its prerequisites. The exact workload is an editorial judgment that can be refined from learner feedback; no item has been statistically calibrated against a population of CCNA candidates.

## Reasoning levels

| Level | Learner action | Example | Not sufficient to claim this level |
|---|---|---|---|
|1 · Foundations|Recall, recognize or identify one explicit observation|Identify which address names the destination host; recognize an administratively disabled interface|Adding a long scenario around a definition|
|2 · Application|Apply a taught rule or procedure to a meaningful new example|Calculate a subnet range; predict a switch's action from one table; complete an SSH setting|Copying the correct sentence directly from an exhibit|
|3 · Analysis|Combine evidence/constraints, discriminate plausible causes or solve an unfamiliar variation|Separate a missing return path from a local-link problem; select a nonoverlapping allocation under fixed constraints|Merely using the word troubleshooting, an obscure command or another arithmetic value|

Begin each chapter checkpoint with accessible retrieval. Then use application to establish the mechanism, and introduce analysis where the learner has enough knowledge to reason from the evidence. Chapter checkpoints preserve authored question order. Mixed practice can deliberately interleave subjects later; its score is not a substitute for the chapter's practical evidence.

The opening table gives counts at each reasoning level. Later-chapter R/A/D mixes give approximate percentages of foundational recall, application and diagnosis/analysis. They are planning guides rather than per-item quotas. A chapter without a genuine diagnosis outcome does not need an invented hard question.

## Choosing practice volume

- **Questions:** Cover distinct learning decisions. Use multiple related examples only when they address different misconceptions, constraints or transfer. Avoid padding through renamed devices or changed final octets. Distractors should be credible mistakes within the same problem and similar in precision.
- **Flashcards:** Cue one fact or tightly related comparison. Keep answers short enough for retrieval. A chapter with many distinct address relationships may need more cards than orientation, but a long reference table is not automatically a list of recall requirements.
- **Labs:** Give named equipment or a clearly marked paper model, complete setup, a prediction before the result, observations worth recording and an independent variation. Device labs use a working baseline and a relevant fault followed by a separate repair. Orientation needs an early success, not a forced outage. A packet interpretation or planning worksheet is appropriate for conceptual outcomes.
- **Drills:** Include commands the learner should recall at that point. Provide unfamiliar setup without quietly turning it into a memorization target. Theory chapters may have few or no drills.
- **Tickets:** Use them when multiple observations must support a cause or a next test. A generic symptom with four guesses is not a diagnosis exercise. Show a bounded repair and the service-level retest.

Ranges below are bank-design recommendations, not minimum scores, maximum learning time or claims about the number of real exam questions. Additional practice can come from an independent changed scenario and the existing subnet trainer instead of a larger repetitive checkpoint.

## Opening batch: orientation and 01–08

These targets were selected after reading the existing practice and its prerequisite context. The implementation report records actual counts and any justified adjustment.

|Chapter|Question target|Card target|Difficulty progression|Lab and exit evidence|
|---|---:|---:|---|---|
|00 · Start here|7|8|4 foundations, 3 application; no analysis required|Build a two-PC LAN from supplied addresses, obtain replies, name the switch and verify saved device/project files. No required reload, interface outage or DNS command drill.|
|01 · Network models|12|14|4 foundations, 7 application, 1 supported analysis|Use supplied two-LAN setup to predict and observe local versus routed MAC/IP/TTL behavior. Distinguish ARP, MAC and route tables; observe and repair one return-path fault. Router syntax is supplied setup, not recall assessment.|
|02 · Components and topologies|14|16|5 foundations, 7 application, 2 analysis|Identify roles and choose an appropriate topology from requirements. Build one LAN with a known HTTP service, compare ping with application availability, then recover the service. Use diagrams for campus/WAN/cloud and a modest PoE capacity decision.|
|03 · Cabling and interfaces|16|18|5 foundations, 8 application, 3 analysis|Compare both ends of a link and distinguish administrative state, link loss, duplex/speed evidence and optical/copper requirements. Separate real simulator observations from supplied physical-fault records.|
|04 · IPv4 addressing|24|22|6 foundations, 12 application, 6 analysis|Calculate and verify masks, boundaries, usable addresses and local/remote decisions before configuring. Diagnose an address/mask/gateway mismatch using stated evidence, then build a fresh-address variation.|
|05 · Subnetting and VLSM|28|24|4 foundations, 16 application, 8 analysis|Size and allocate multiple nonoverlapping subnets with gateway capacity, containment and simple growth constraints. Commit a plan before viewing the solution; verify it on the supplied topology. Avoid advanced routing or elaborate production migration work.|
|06 · TCP, UDP and ports|14|18|4 foundations, 8 application, 2 analysis|Follow request/reply endpoints, transport behavior and a working application. Distinguish service ports from ephemeral client ports. Read supplied reliability/retransmission evidence without turning optional header arithmetic into the main exam skill.|
|07 · Ethernet switching|18|20|4 foundations, 10 application, 4 analysis|Predict learning, lookup, flooding and filtering across successive frames; compare predictions with tables and packet evidence. Verify a moved endpoint and an independent topology variation.|
|08 · Secure device access|20|22|4 foundations, 10 application, 6 analysis|Complete and verify local credentials/SSH, distinguish authentication from transport/reachability, and test a fresh session after a controlled correction. Finish with an independent access specification, preserving console recovery.|

Basic IOS context is introduced in 00, observed in 01–03 and supplied where needed in 04–07. Chapter 08 owns secure device-access configuration. A statement that material is deferred must name an existing later owner; it must not silently disappear from the course.

## Later chapters: design evaluation

Every later chapter received a design evaluation of its current questions, cards, lab sequence and prerequisite demands. Read the [09–25 evaluation](audits/practice-design/09-25-evaluation.md) and [26–45 evaluation](audits/practice-design/26-45-evaluation.md) for the original recommendations, platform limitations, and intended independent lab evidence. The [09–23 implementation report](audits/practice-09-23/README.md), [24–33 implementation report](audits/practice-24-33/README.md) and [34–45 implementation report](audits/practice-34-45/README.md) record the completed batches' final decisions. Their verified inventories supersede the planning bands below.

|Chapter|Question band|Card band|R/A/D %|Primary lab evidence and depth boundary|
|---|---:|---:|---|---|
|09 · VLANs and access ports|20–24|20–24|20/55/25|Predict membership and verify an independently added endpoint; distinguish absent VLAN, wrong membership and PoE requirements. Supply AP/phone attachment context.|
|10 · Trunks and DTP|22–26|18–22|15/55/30|Compare both ends and allowed/active/forwarding sets; add a VLAN while preserving service. Keep legacy negotiation bounded.|
|11 · Inter-VLAN routing|24–30|20–24|10/55/35|Construct router subinterfaces and SVIs, verify connected routes and bidirectional tests, then add a new requirement. No premature remote static-routing dependency.|
|12 · CDP and LLDP|16–20|14–18|20/50/30|Reconcile a wrong drawing with two-ended observations; distinguish stale or absent records from proven physical failure. Avoid timer trivia.|
|13 · EtherChannel|24–28|22–26|15/50/35|Verify L2/L3 bundles and member consistency; diagnose a member or VLAN fault and add a member independently. Do not promise doubled single-flow throughput.|
|14 · Spanning tree|28–34|22–26|15/45/40|Predict root, costs and roles before topology changes, then solve a fresh topology. Apply configuration depth according to the selected exam track.|
|15 · STP protection|22–26|20–24|15/50/35|Select protection by boundary and distinguish err-disable/inconsistent states with cause and recovery. Use supplied evidence where BPDU-loss simulation is unsupported.|
|16 · Layer 2 security|30–36|24–30|15/45/40|Separate port security, DHCP snooping/DAI, storm-control and RA-guard checkpoints; prove the intended policy with fresh evidence. Supply DHCP/IPv6 setup and revisit after those chapters.|
|17 · Routing table|26–32|20–24|15/50/35|Predict forwarding from a fresh installed table, including overlap, local/default/discard and next-hop resolution. Protocol source-code recognition does not require configuring every protocol.|
|18 · IPv4 static routing|28–34|22–26|10/50/40|Distinguish configured, installed and usable paths; verify both directions and a changed destination through failure/recovery. No required IP SLA configuration.|
|19 · IPv6 addressing|28–34|24–28|20/50/30|Calculate before configuring, record actual MAC-derived addresses and verify scope, prefixes and fresh neighbors. Avoid excessive multicast/type-number recall.|
|20 · IPv6 static routing|24–30|18–22|10/50/40|Use the correct interface with link-local next hops, test /128 exceptions and both route directions. Reuse established routing principles without duplicating the whole IPv4 bank.|
|21 · OSPFv2|30–36|24–28|15/50/35|Predict elections/costs, interpret combined neighbor/interface/route evidence, and rebuild from new requirements. Stay single-area; separate simultaneous election worksheets from live sequential starts.|
|22 · OSPFv3|22–28|18–22|15/50/35|Verify IPv6-specific activation, router ID, link-local neighbor identity and prefixes independently of adjacency. A supplied syntax translation suffices for unsupported IOS families.|
|23 · HSRP and VRRP|18–24|16–20|20/55/25|Interpret actual versus virtual gateways and operational failover, with client service evidence. Configuration supports the interpret/describe objective; limit protocol-number trivia.|
|24 · DHCP|26–32|22–26|15/50/35|Use fresh clients to prove pool, relay, return path and options; add a subnet while retaining existing service. Existing leases cannot prove new allocation works.|
|25 · DNS|24–30|20–24|20/45/35|Record name, type, queried server, answer and application result; diagnose record/resolver/service stages. Required record worksheets cover simulator limits.|
|26 · NAT and PAT|20–26|18–24|15/50/35|Record before/after tuples and return routing; choose translation mode and distinguish selector, exhaustion and path faults. Reduce timeout catalogs.|
|27 · NTP, syslog and SNMP|24–30|22–28|20/50/30|Verify clock selection, destination thresholds and management counter changes, then correlate a short incident. Keep configuration depth tied to each service's objective verb.|
|28 · QoS|14–18|12–18|25/60/15|Explain classification, marking, queueing and congestion/rate behavior from a changed traffic case. Platform policy configuration remains optional support.|
|29 · Configuration and software files|18–24|16–22|20/55/25|Choose copy direction and verify protection, identity and contents. Separate transfer from merge/activation; split backup, retrieval and secure-transfer checkpoints.|
|30 · Client troubleshooting|20–26|16–22|10/45/45|Compare client parameters and staged connectivity across supported OS evidence; choose a discriminating test and confirm application recovery.|
|31 · Troubleshooting toolkit|22–28|10–16|5/40/55|Select the next test from combined observations, account for source/direction and verify closure. Avoid another service-port glossary.|
|32 · Security concepts|12–18|14–20|35/50/15|Identify assets, threats and proportionate controls from a small realistic case. Conceptual analysis does not require attack-tool execution.|
|33 · AAA|20–26|16–22|20/45/35|Distinguish authentication, authorization and accounting; interpret rejection versus unavailability and retain a recovery path. Treat unfamiliar server setup as preparation.|
|34 · ACLs|24–32|18–26|10/50/40|Translate policy into ordered rules, follow both packet directions, and prove required permits and denials. Add interacting requirements rather than more isolated syntax recall.|
|35 · VPNs and IPsec|12–18|12–18|30/50/20|Explain protection boundaries, tunnel endpoints and routing dependencies from observed/supplied evidence. No production IPsec engineering requirement.|
|36 · Wireless principles|18–24|14–20|25/55/20|Interpret channel overlap, signal/noise and practical RF constraints; distinguish predictions from physical measurements a simulator cannot establish.|
|37 · Wireless architectures|14–20|14–20|20/55/25|Draw control/client-data paths and select AP switchport settings from an explicit deployment contract. Bound platform-specific legacy recall.|
|38 · WLAN security|20–26|16–22|15/50/35|Match SSID, security, mapping and client stage; distinguish security failure from fresh DHCP/service failure. Keep the selected track's configuration requirement explicit.|
|39 · Virtualization|12–18|12–18|30/55/15|Select host-uplink treatment, explain shared failures and identify the routing context. No mandatory hypervisor or container-orchestration deployment.|
|40 · Management and SDN|12–18|10–16|25/55/20|Map planes and management approaches, review an intended change and choose operational acceptance evidence. Reduce product-name catalogs.|
|41 · REST APIs and JSON|18–24|14–18|20/60/20|Interpret requests, response status/body, JSON paths/types and schema limits. The supplied local service is observation support, not code to memorize.|
|42 · Ansible and Terraform|18–24|14–20|20/55/25|Review target selection and read-only commands, execute against a real supported target where required, and interpret remote results. Terraform stays capability-level.|
|43 · AI in network operations|18–24|10–16|15/50/35|Write and critique a task-specific prompt, distinguish evidence from claims, and verify a bounded proposal. Use fictional data; no account or upload dependency.|
|44 · Integrated branch|18–24|8–14|0/35/65|Build from changed requirements and resolve independent incidents; submit cross-feature functional evidence. Integration practice should not become another glossary.|
|45 · Exam readiness|24–36 mixed|8–12 process cues|10/45/45|Attempt independent mixed work before references, diagnose gaps and revisit their owning banks. A small mixed sample cannot prove exhaustive readiness or predict passing.|

The full reports are design records, not automatic instructions to reach every upper bound. Some existing questions already meet the intended demand and should stay. Before expanding later banks, consolidate duplicated facts, preserve useful deliberate retrieval, and spend the additional workload on distinct decisions or an independent lab variation.

## Release and evidence

A practice rewrite is ready when every item has a keep/revise/retire/add decision, its answer and alternatives have been independently reviewed, and the lab has a usable evidence checklist and a separate challenge solution. Progress identities stay with the same knowledge; unrelated replacements receive new IDs. Lab checkmarks are currently positional and existing progress is preserved. Revised labs identify the September 2026 revision and tell returning learners to repeat the changed exercise; an old checkmark is not evidence of completing its new contents.

Source review and static configuration checks are recorded separately from actual device execution. Packet Tracer cannot establish physical RF, optical power or all platform behaviors. An executed app test verifies presentation and interaction; it does not certify the networking procedure or predict an exam result.
