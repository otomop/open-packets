# Coherency review: chapters 36–45

Reviewed 24 September 2026 against the captured coherency baseline, which already includes the earlier uncommitted practice work. This pass reads the complete lesson, lab, questions, cards, commands and tickets in every assigned chapter. It follows prerequisite concepts into exercises and later applications; it does not claim a new simulator or hardware test.

The accompanying [coverage record](36-45-coverage.json) records every chapter's incoming skills with actual earlier chapter/section IDs, locally introduced skills, exercise demands, subsequent dependents, decisions and exact changed files. All recorded anchors resolve; every incoming anchor belongs to an earlier chapter. Relevant earlier lesson passages were read directly rather than treating the chapter index as evidence of teaching.

## Outcome and identities

The sequence remains wireless principles → architecture → WLAN security → virtualization → management/SDN → HTTP/structured data → automation → AI evidence review → integrated build → independent review. It did not need a late-course reorder. The concrete gaps were definitions and worked reading/setup bridges, not a reason to move full specialist chapters ahead of their foundations.

All chapter and lesson-section identities, practice IDs and practice ordering were preserved. The only changed practice items are `wireless-security-config-q02` and `wireless-security-config-c03`: both still assess AES-CCMP, but now assess the taught encryption/integrity purpose and scope instead of requiring unexplained CBC-MAC terminology. No item was added or retired. No app, design or color files were edited.

| Chapter | Questions | Cards | Commands | Tickets | Changed assets in this pass |
|---|---:|---:|---:|---:|---|
| 36 | 23 | 20 | 3 | 2 | Lesson, lab |
| 37 | 17 | 15 | 7 | 2 | Lesson, lab |
| 38 | 22 | 20 | 4 | 2 | Lesson, lab, q02, c03 |
| 39 | 15 | 15 | 5 | 2 | Lesson |
| 40 | 16 | 16 | 3 | 2 | Lesson |
| 41 | 21 | 18 | 2 | 2 | Lesson, lab |
| 42 | 20 | 20 | 4 | 2 | Lesson, lab |
| 43 | 19 | 16 | 0 | 2 | Lesson |
| 44 | 23 | 12 | 8 | 4 | Lesson |
| 45 | 30 | 10 | 10 | 2 | Lesson, lab |
| Total | 206 | 162 | 46 | 22 | 18 files |

Counts are retained design choices, not quotas or an estimate of the examination's item distribution.

## Chapter decisions

### 36 — Wireless principles

The RF sequence already progresses from shared airtime to power/noise, channel choice, generations, service-set identity and measured troubleshooting. It reuses duplex from 03 and active-adapter/IP evidence from 30. The setup supplies the home-router GUI choices rather than expecting an unlearned WLC procedure.

Security recognition questions and cards used SAE/PMF and Personal/Enterprise terminology before all terms were explained. The security section now defines PSK, SAE, EAP, 802.1X, PMF and AES/CCMP at introductory depth. The fuller join/security owner remains 38. The Windows driver-capability drill now has a corresponding explanation next to the existing connection and scan queries. The optional wrong-passphrase lab activity is called a demonstration instead of a refresher. Its required RF worksheet, controlled measurements and independent planning challenge remain unchanged.

Entry readiness is to distinguish radio identity and operational evidence from IP reachability. Exit readiness is to explain why signal strength, a visible SSID and a supported radio generation do not prove useful service. The optional Catalyst summary commands remain an explicitly labeled preview for 37/38, with no Packet Tracer support promise.

### 37 — Wireless architecture

The lesson correctly uses known VLAN tagging, router-on-a-stick, aggregation, DHCP and routed tunnel concepts. DNS discovery and remote RADIUS availability also appear in practice; DNS and AAA are now explicit prerequisites. DTLS is defined before the protected-session discussion. A short definition supplies enough VM meaning for virtual-controller placement before the full virtualization owner in 39.

The lab keeps a two-VLAN management/client design and separately verifies wired forwarding, DHCP, and optional AP registration. A new transition explains that 38 starts a separate smaller project. Completing 37 does not authorize assuming a client WLAN exists, and completing 38's flat lab does not replace the client-VLAN mapping learned here. Option 43 bytes remain supplied, decoded and scoped to supported AP families; the exercise does not require inventing vendor encodings.

Exit readiness is to choose access/trunk treatment from where traffic actually exits, distinguish AP join from client service, and distinguish continued local switching from the availability of a remote authentication service. Existing labs and all banks support that sequence and were retained.

### 38 — WLAN security

Incoming radio/architecture, QoS and AAA concepts already precede this chapter. New key establishment, security generation, authentication choices, GUI settings and staged verification appear in a sound order. PSK, AKM, MIC and forward secrecy needed plain definitions before the associated questions/cards, which are now present.

The q02/c03 narrowing removes an unnecessary cryptographic-internals recall demand while preserving the same cipher-suite concept. Specialized Enterprise 192-bit and legacy EAP details remain bounded context. The lab now explicitly explains its fresh one-subnet design and the transfer back to a separate client VLAN. Wrong-key and unavailable-DHCP faults remain separate; neither an old lease nor successful AP join is counted as proof of a current security exchange. Simulator limits remain visible.

Exit readiness is to select matching authentication/cipher/PMF fields and identify the last proven client stage. That foundation supports mixed WLAN scenarios in 45 without a new security mechanism there.

### 39 — Virtualization

Earlier physical roles, switch trunks and route lookup are reused rather than replaced. The missing prerequisite was the meaning of the OS kernel itself, which is essential to the VM/container questions. A plain definition now precedes the comparison. Earlier virtual-controller and virtual-host previews explicitly lead into this owner.

The VRF section now distinguishes the ordinary/global routing context from a default route. This prevents learners from interpreting a failed BLUE lookup as permission to search the global table. The supplied switch model, optional supported-image VRF exercise and their limits remain unchanged. Route leaking/MPLS and production orchestration are not new assessed requirements.

Exit readiness is to identify the actual kernel, forwarding and failure boundary, then apply familiar tagging/routing rules inside that design. It prepares the logical networks and management systems in 40, and the distinction between a VM and Python environment in 42.

### 40 — Management and SDN

The existing plane and controller material reuses wireless control/data examples, SSH, OSPF, ACLs and logical forwarding contexts. Its inventory checkpoint expected recognition of HTTP GET, a 200 response and JSON before the full owner in 41. A small annotated request/response now teaches precisely that reading task, including member names/values and collection time. Full HTTP method/status/type instruction stays in 41.

XML, YANG and RPC now have short definitions where the protocol comparison uses them. Git and a commit are defined before the rollback example. NTP/logging and troubleshooting are explicit prerequisites because timestamps and DF/MTU tests are actual practice demands. The overlay ticket remains an application of previously taught packet-size evidence, not a fabric deployment exercise. All existing practice was retained after those foundations were supplied.

Exit readiness is to classify responsibilities and API participants, check the age and source of controller data, and separate a declared change from verified network behavior.

### 41 — REST APIs and JSON

The sequence from resource/HTTP semantics through status, authentication, typed data and output interpretation was sound. CRUD and schema are now defined directly. The JSON example no longer calls zero-based indexing familiar; it works from array position 1 to the selected object's hostname.

The local-service lab supplies its Python service and validator, so it does not assess programming knowledge. It did assume the learner knew how terminal directories, editor save locations and relative filenames relate. Setup now teaches that relationship and verifies both terminals' locations. Curl's GET default, response-header flag, request-header arguments and quoting are explained before the first request.

The optional worksheet remains complete; the localhost HTTP demonstration is not represented as production HTTPS, OAuth or RESTCONF. Exit readiness is to interpret a request/response and select typed data, then carry mappings, lists and ordered results into 42.

### 42 — Ansible and Terraform

The chapter materially relies on 41's YAML/structured-data and indexing work, so 41 is now an explicit prerequisite. SSH and peer-identity foundations come from 08/29. The chapter now explains WSL and distinguishes an isolated Python package environment from the VM boundary taught in 39.

An inventory-reading paragraph teaches YAML nesting and list markers. A worked Jinja variable substitution precedes the localhost task that uses double braces. The one-off command's module/argument flags are decoded. A worked host-set intersection teaches that `--limit` narrows, rather than expands, a play's targets before its practice question. HCL is expanded. The lab preparation describes its shell commands and an installation-error stop condition before the block is run.

The prior practice audit's package families, known-host preparation, limited account, platform requirements, partial-result diagnosis and separate local/remote evidence are retained. No new runtime execution is claimed. Exit readiness is to justify where a task runs, who it targets, what command produced an output, and what a plan/result still does not establish.

### 43 — AI in operations

The technical incident is intentionally familiar: DNS, direct-IP service tests, logs/counters and automation outcomes were taught earlier. The introduction now links those owners explicitly. Telemetry is defined before its use as model input.

One assessed evidence rule was taught only in the lab: a sample can demonstrate formatting without contributing facts to the current incident. That rule is now in the prompt lesson before the relevant cards/questions. The existing synthetic answers and bounded manual troubleshooting remain appropriate; no paid service or production system is needed.

Exit readiness is to separate observations from generated explanations, select an evidence-producing next test, and bound any proposed change. These habits transfer directly to the manually executed capstone even when no AI is used.

### 44 — Branch capstone

The capstone should integrate mechanisms, not surprise the learner with prerequisites. It now starts with an entry packet trace and a compact table linking each required skill to its owner: subnetting/return routes, VLANs/gateways/LACP, root/edge roles, OSPF, DHCP/DNS/PAT, ACL/SSH/time/diagnostics. The troubleshooting toolkit is an explicit prerequisite. The evidence habits of 43 and the independent transfer expected in 45 are connected without adding new device features.

Direct reading confirmed that 26 already distinguishes a NAT selector from a forwarding filter and warns about router-generated tests using another source/processing path. No duplicate rewrite was needed. Chapter 21 initially lacked `default-information originate` and `O*E2` teaching; its owner added installed-static-default setup, conditional origination without `always`, external-default interpretation and withdrawal limits. The root's independent review confirmed that integration. The existing capstone explains and configures it locally as well.

All complete setup blocks, measured stages, positive/negative acceptance tests, faults and practice banks were retained. The design explicitly does not replace IPv6, wireless, file-transfer or automation lab evidence. Exit readiness is an explained, reproducible, integrated verification record rather than only a working topology file.

### 45 — Readiness

The final mixed checkpoint was traced to earlier owners, including the less obvious EUI-64, link-local next-hop, OSPFv3, SCP peer-identity, static-host DAI, VM/container, API and partial-Ansible-result questions. No new networking mechanism is needed here. The reference table now includes the missing physical/client, Layer 2 security, secure-file, virtualization and SDN remediation owners.

The lesson now distinguishes failed, unperformed and simulator-limited evidence before the associated readiness cards. It explicitly states that the mixed checkpoint draws on the whole course, not only the IPv4 capstone. The independent lab now explains its changed contract: VLAN names/roles differ from 44, both transit peers use broadcast OSPF rather than point-to-point, and ISR interface labels differ. These are changes to previously taught inputs, not novel mechanisms. This preserves independence while preventing accidental reliance on the previous lab's policy.

The final lab, closed references, later fault and changed repeat attempt remain intact. Revision scores remain planning measures, not calibrated pass probabilities. No new question was necessary solely to increase volume.

## Primary-source checks for this pass

- [Cisco CCNA v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf): checked relevant wireless, virtualization, API/JSON, configuration-management and AI verbs; neither requires CBC-MAC internals as a separate learning outcome.
- [RFC 5415](https://www.rfc-editor.org/rfc/rfc5415): checked CAPWAP's DTLS terminology and separate control/data scope.
- [Cisco IOS XE 17.17 WPA3 guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-17/config-guide/b_wl_17_17_cg/m_wpa3.html): checked SAE and forward-secrecy explanation.
- [Docker container fundamentals](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/): checked guest-kernel versus shared-kernel boundary.
- [RFC 6241](https://www.rfc-editor.org/rfc/rfc6241), [HTTP semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) and [JSON RFC 8259](https://www.rfc-editor.org/rfc/rfc8259): checked RPC/XML terminology, GET/200 meaning and object name/value representation. The attempted RFC 8040 text search did not return a match; no claim of a successful new review of that passage is made.
- [Ansible templating](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_templating.html) and [Python virtual environments](https://docs.python.org/3/library/venv.html): checked Jinja evaluation on the control node and package-environment isolation.
- [Curl reference](https://curl.se/docs/manpage.html): checked GET default, header arguments and displayed response headers.

## Verification and limits

The content validator completed with **0 errors and 10 existing foundation objective-tag warnings**. A separate identity check compared every owned bank to the captured baseline: counts, IDs and item order are unchanged; only the two recorded AES-CCMP entries changed. All incoming/introduced anchors in the coverage JSON resolve in the captured stable section map and have the correct earlier/local direction.

This is a full editorial coherency review with selected current primary-source verification. No Packet Tracer, physical RF/WLC, hypervisor, remote IOS/Ansible or Terraform session was executed during it. Existing authored evidence remains labeled as representative or worksheet material, and optional platform activities retain their limits. The root task performs final integration and cross-review; no commit, push or deployment was performed here.
