# Practice review: Chapters 37–40

Completed author pass and independent peer review: 24 September 2026. [The independent review](37-40-peer-review.md) is closed with no outstanding actionable findings; the chapters are frozen. This report covers every question, option, key and wrong-answer explanation, every card, drill and ticket including its repair, and each lab from setup through the independent challenge.

## Scope and evidence

The reference point is [baseline.json](baseline.json), captured before this batch and including the completed 24–33 work. Only the four owned chapter folders and this author's audit artifacts were changed. All lesson bodies, section identities, order, chapter identities and prerequisites are unchanged; chapter metadata only updates lab times. Existing useful material was retained rather than replaced for tone alone. No application code, style, shared authoring policy, publication or Git history was changed.

The official Cisco [current v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) were reopened in this pass. The course's current/future track labels remain unchanged. The important depth boundaries are:

- 37: v1.1 architecture/modes/physical connections; v2.0 AP edge-port configuration. Actual tagging, PoE and supported aggregation matter more than legacy internal-interface or hexadecimal-option recall.
- 38: v1.1 GUI interpretation and WPA2-PSK configuration/verification; v2.0 wireless security description. Optional current-controller CLI is observation support, not an invented v2.0 controller-configuration requirement.
- 39: v1.1 server/container/VRF explanation; v2.0 hypervisor/VM/container description plus host-edge connectivity. VRF creation commands are supplied optional demonstration, while routing-context interpretation remains core.
- 40: v1.1 automation/controller/control-data/API architecture; v2.0 management approaches. No production SD-Access, ACI, SD-WAN, hypervisor or controller deployment is required.

## Final workload

|Chapter|Questions|Foundations / application / analysis|Cards|Drills|Tickets|Lab steps|Lab minutes|
|---|---:|---|---:|---:|---:|---:|---:|
|37 · wireless-architecture|17|7 / 10 / 0|15|7|2|12|80|
|38 · wireless-security-config|22|8 / 14 / 0|20|4|2|14|90|
|39 · virtualization|15|6 / 9 / 0|15|5|2|9|70|
|40 · network-management-and-sdn|16|7 / 9 / 0|16|3|2|10|75|

There are 70 questions, 66 cards, 19 drills, 8 tickets and 45 guided stages. These are editorial outcomes, not quotas or measured exam probabilities. None of these checkpoints needs an artificially labeled analysis item: their explicit contracts support direct application, while the tickets provide richer evidence interpretation. Single-answer positions are balanced without a repeating position cycle. Question progression starts with foundations and then applications; separate diagrams or long exhibits do not automatically earn a higher demand label.

## Chapter decisions

### 37 — Wireless architectures

The checkpoint now begins with autonomous versus controller-based policy management. It applies central/local forwarding, tagged and untagged AP port contracts, discovery versus transport, client-service evidence, power sufficiency and a documented passive AP LACP peer. Option-43 hex encoding, EWC product classification, virtual-interface internals, static legacy LAG syntax and duplicate sniffer selection no longer consume repeated required checkpoints. Discovery itself remains in q13 and t01, with the ticket's encoding supplied as repair reference.

Cards start with architecture functions rather than port numbers. Broad operation lists are narrowed. Physical port mode, allowed-list preservation, PoE and supported aggregation keep genuine command practice; duplicate discovery CLI and disruptive legacy AP-mode configuration are removed.

The lab retains a complete new-file management/client-VLAN setup. A named Server-PT WEB20 on Fa0/4 adds a real wired HTTP baseline at 192.168.20.30; it is included in the topology, address table and access-port configuration. Learners predict central versus local tagging, observe AP-link loss separately from still-working wired service, and repeat both original web tests after repair. Registration and wireless client forwarding are explicitly different claims.

The local-switching and hardware LACP worksheets now hide their solutions. The independent worksheet adds VLAN 30, R1 subinterface and a ten-address DHCP range without breaking VLANs 10/20. Its AP2 static management address .50 is outside the original .100–149 pool. Switch/router commands, live-versus-paper observations and the remote-authentication dependency are explicit. This challenge does not pretend the generic simulator AP implements FlexConnect.

### 38 — WLAN security

The bank keeps security-generation, Personal/Enterprise, cipher, PSK format, EAP role, PMF/OWE and GUI interpretation. It adds profile-versus-SSID selection, a combined correct-security/wrong-client-mapping case, retained-address evidence, timer-policy interpretation and transition-mode limits. Explicit wrong-key, disabled-WLAN and missing-tag cases are honestly application rather than forced analysis. Several weak WEP/irrelevant-account alternatives are replaced with realistic key-management, assignment or adjacent-stage errors.

Cards no longer require PMK derivation, a specific handshake-message error and the repeated RADIUS-port pair as three extra recall targets. They retain the practical security boundaries and separate administrator/Personal/RADIUS credentials. QoS and client state cards cue one useful interpretation. The four remaining drills support a real switch trunk and optional 9800 observations; they do not duplicate the GUI configuration as a long CLI sequence.

The full cold-start WPA2 GUI lab remains intact, with prediction and a clear prerequisite/preparation boundary. Wrong-key and fresh-DHCP faults are still observed and repaired separately. The DHCP worksheet and 9800 translation answers are closed. The independent variation creates a second SSID/key/client while leaving the original WLAN and LT1 working, then requires both HTTP tests. It explains why a new SSID alone does not create an isolated network. Missing second-WLAN support requires a labeled plan, never a claimed test.

### 39 — Virtualization

Practice emphasizes kernel boundaries, resource sharing, virtual switches, host port contracts, cloud responsibility and the correct VRF lookup. Product-name classification and parallel optional VRF command forms are pruned. New decisions cover a dedicated untagged management NIC, local same-host forwarding during uplink loss, and a guest virtual-port mismatch separated from a verified physical VLAN path. The latter applies an explicitly supplied intended membership; ordinary type/model recognition is foundations.

Cards retain VM/container/VLAN/VRF boundaries and shared host failures without a Docker/Kubernetes or Linux-namespace catalog. Only five drills remain: host trunk treatment and explicitly optional routing-context observations. The optional IOSv setup is complete but is preparation, not required CLI recall.

The model remains two real simulated switches and four simulated PCs, explicitly not real VMs. Learners predict tags and learned MAC locations, observe a one-VLAN fault, restore it separately, and complete the closed VRF interpretation. The independent changed case adds two endpoints and VLAN 30 at both trunk ends while retaining the two original ping services. Both-end commands, IP settings and three retests are in the closed answer.

### 40 — Management and SDN

The bank preserves plane/function, API direction, underlay dependency, drift and management approaches. Duplicate northbound labels and several product-role catalogs are removed. Added applications classify SSH at a transit router versus its endpoint, distinguish successful job/configuration from failed service acceptance, qualify controller-outage conclusions and distinguish Git recovery intent from deployed recovery. The change-acceptance record supplies its unmet requirement explicitly, so it is direct application. The shared-path next-test case also remains direct application with plausible alternative investigation scopes.

Cards are reduced to concise architecture, intent/observation, idempotence and evidence concepts. Multi-protocol ports, OpenFlow/OpFlex and multiple product-role tables remain lesson reference rather than a compulsory card catalog. Three useful observation drills remain; OSPF setup and harmless description commands are supplied in the lab.

The full router/SSH preparation remains, labeled as prior-chapter setup. Predictions precede table reads and the management fault. Both directed PC pings are now actually requested before claiming both-direction evidence. Save prompts finish per device. The worksheet answer is closed. The new independent change review corrects an intentionally flawed proposed deletion, preserves PC-A administration while withdrawing PC-B's new SSH access, and requires forwarding/OSPF/description checks. Console recovery and unsupported sequence-edit fallback are explicit.

## Identity accounting

[37-40-decisions.json](37-40-decisions.json) reconciles every original/current question, card, drill and ticket once, using exact loaded-object equality: 60 keep, 73 revise, 58 retire and 30 add. Same-topic changes retain identities. Every unrelated new outcome receives a new unused ID. Reordering does not retire an item. No destination field asserts a transfer to an unverified item. References below describe retained coverage or reduced optional emphasis, not a promise that a future author will restore a deleted topic.

|Retired ID|Reason|
|---|---|
|wireless-architecture-q06|Vendor-specific option-43 hexadecimal decoding adds a memorization burden; discovery interpretation remains in q13 and t01.|
|wireless-architecture-q07|Retire explicit EWC product classification; controller placement remains lesson context and c09.|
|wireless-architecture-q08|Retire the AireOS virtual-interface internal-function quiz; physical/data-path choices carry more practice value.|
|wireless-architecture-q09|Static AireOS LAG command recall is platform-specific reference; supported AP LACP remains in practical worksheet and d12.|
|wireless-architecture-q15|Sniffer-mode selection repeats the same capability already contrasted with serving and monitor modes in q04.|
|wireless-architecture-c06|Drop vendor-specific option encoding recall; discovery candidates remain taught.|
|wireless-architecture-c08|Controller preference catalogs are reference rather than a distinct required practice outcome.|
|wireless-architecture-c16|Drop legacy internal virtual-interface recall; retain client/management mapping.|
|wireless-architecture-c17|Drop legacy static-LAG syntax recall; teach matching documented peer requirements.|
|wireless-architecture-c19|Drop minor legacy rogue-detector mode recall; retain serving/monitor/sniffer contrast.|
|wireless-architecture-c23|Detailed 9800 policy-tag mapping is assessed in the following WLAN security chapter.|
|wireless-architecture-d03|Vendor-specific option-43 encoding is supplied reference, not required recall.|
|wireless-architecture-d04|Legacy static AireOS LAG setup is supplied platform reference.|
|wireless-architecture-d06|General CDP syntax is already owned by the discovery chapter; use relevant AP evidence here.|
|wireless-architecture-d08|The assessed controller observation uses GUI or supplied evidence; no AireOS CLI-recall requirement.|
|wireless-architecture-d09|Legacy controller interface-summary syntax is not needed for GUI interpretation.|
|wireless-architecture-d10|Changing legacy AP mode is disruptive optional implementation rather than required edge-port mastery.|
|wireless-security-config-c06|Passphrase-derived PMK internals stay explanation; prioritize the usable configuration and evidence boundary.|
|wireless-security-config-c07|Exact message-2 MIC retrieval is specialized diagnostic reference, not a core recall target.|
|wireless-security-config-c09|RADIUS port-pair recall duplicates AAA and distracts from WLAN credential roles.|
|wireless-security-config-d01|9800 object-creation syntax is optional reference; the assessed WLAN configuration is a GUI workflow.|
|wireless-security-config-d02|Do not require memorizing an optional 9800 security-removal command for a GUI objective.|
|wireless-security-config-d03|GUI PSK choice remains assessed without a parallel CLI memorization sequence.|
|wireless-security-config-d04|Literal optional PSK command is a sensitive platform excerpt, not an essential recall drill.|
|wireless-security-config-d07|Legacy AireOS enabling syntax adds no skill beyond the required GUI action.|
|wireless-security-config-d09|9800 tag configuration syntax is optional translation; mapping purpose remains assessed.|
|virtualization-q02|Product-name hypervisor classification adds less value than the underlying Type 1/2 distinction.|
|virtualization-q08|Interface address-removal repair remains an optional guided demonstration rather than a required VRF configuration quiz.|
|virtualization-q09|Multiprotocol VRF configuration syntax exceeds the explanation objective; preserve routing-context interpretation.|
|virtualization-q14|Two parallel VRF inventory command forms are optional reference rather than an additional conceptual decision.|
|virtualization-c05|Tool-brand comparison is optional explanation rather than a distinct CCNA practice outcome.|
|virtualization-c06|Linux namespace/resource-control internals stay context rather than another required recall unit.|
|virtualization-c13|Multiprotocol VRF creation is supplied optional setup, not required configuration mastery.|
|virtualization-c14|Remove the parallel legacy VRF syntax catalog.|
|virtualization-c17|Avoid another command-form catalog; context-table selection remains in c16 and optional observations.|
|virtualization-c18|Do not combine optional VRF ping and route configuration in one retrieval card.|
|virtualization-c19|VRF-lite/MPLS terminology stays supporting reference; required context separation remains explicit.|
|virtualization-d01|VRF creation is optional supplied setup for an explanation objective.|
|virtualization-d02|Address-family submode is optional setup, not required recall.|
|virtualization-d03|VRF interface binding is optional setup; conceptual membership remains taught.|
|virtualization-d04|Retire parallel legacy VRF creation syntax.|
|virtualization-d05|Retire parallel legacy interface VRF syntax.|
|virtualization-d09|Static route creation within VRF is optional supplied repair context rather than another route-configuration objective.|
|network-management-and-sdn-q05|The same northbound/southbound mapping is already applied in q04; remove its repeated diagram-label retrieval.|
|network-management-and-sdn-q09|Product-specific SD-Access node catalogs stay illustrative reference, not a separate memorization target.|
|network-management-and-sdn-q14|Retire renamed SD-WAN component recall; focus management approaches and dependencies.|
|network-management-and-sdn-q15|Retire another ACI product-role item; generic policy-versus-forwarding evidence is assessed without product trivia.|
|network-management-and-sdn-c04|Remove a repeated multi-protocol port catalog; assess plane/function and actual management evidence.|
|network-management-and-sdn-c11|OpenFlow/OpFlex product detail is optional recognition context, not required retrieval.|
|network-management-and-sdn-c14|VXLAN port/identifier number catalog is less useful here than overlay transport and protection limits.|
|network-management-and-sdn-c15|Product protocol-role catalogs remain lesson examples.|
|network-management-and-sdn-c16|Four SD-Access node roles form a catalog rather than one core retrieval outcome.|
|network-management-and-sdn-c17|EID/RLOC product vocabulary is supporting detail beyond generic overlay practice.|
|network-management-and-sdn-c18|APIC role repeats the general management/forwarding distinction.|
|network-management-and-sdn-c19|Remove four SD-WAN product-name roles from required recall.|
|network-management-and-sdn-d06|OSPF neighbor syntax is preparation already owned by routing; this chapter interprets the resulting plane evidence.|
|network-management-and-sdn-d09|Session-list recall duplicates earlier access practice; retain its use as supplied observation.|
|network-management-and-sdn-d11|Description configuration is harmless supplied idempotence support rather than a required management-architecture command.|

## Primary technical checks

These sources were opened in this pass; the teaching examples are original and their displayed evidence is representative.

- [Cisco AireOS ports/interfaces](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/ports_and_interfaces.html): distribution trunks, untagged VLAN 0, management/client interfaces and platform boundaries.
- [RFC 5415](https://www.rfc-editor.org/rfc/rfc5415.html): CAPWAP control/data transport and protection distinction.
- [Cisco FlexConnect](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/flexconnect.html): local forwarding, authentication choices and controller-disconnection dependencies.
- [Meraki SSID modes](https://documentation.meraki.com/Wireless/Design_and_Configure/Configuration_Guides/Client_Addressing_and_Bridging/SSID_Modes_for_Client_IP_Assignment): bridge-mode traffic is local rather than necessarily dashboard-transiting.
- [Meraki AP aggregation](https://documentation.meraki.com/Wireless/Design_and_Configure/Configuration_Guides/Client_Addressing_and_Bridging/MR_Link_Aggregation_Configuration_Guide): supported AP families, passive AP LACP, initial single-port provisioning and switch-side active negotiation.
- [Cisco AireOS WLAN security](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_security.html): GUI generation/cipher/AKM fields, 8–63 ASCII or 64-hex PSK rule and separate apply/save operation. Screen availability remains simulator-specific.
- [Cisco Catalyst 9800 model](https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213911-understand-catalyst-9800-wireless-contro.html): policy-tag linkage between WLAN and policy profiles, plus effective AP assignment.
- [Cisco WPA3](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-17/config-guide/b_wl_17_17_cg/m_wpa3.html): Personal SAE, PMF and transition-mode qualifications.
- [Cisco AireOS DHCP](https://www.cisco.com/c/en/us/support/docs/wireless/4400-series-wireless-lan-controllers/110865-dhcp-wlc.html): proxy versus bridging paths; the ticket explicitly chooses bridging.
- [Cisco wireless QoS](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wireless_quality_of_service.html): GUI QoS profile interpretation, distinct from guaranteed service.
- [RFC 8110](https://www.rfc-editor.org/rfc/rfc8110.html) and [RFC 5216](https://www.rfc-editor.org/rfc/rfc5216.html): OWE without authenticated peer identity and EAP-TLS certificate roles.
- [Microsoft Hyper-V architecture](https://learn.microsoft.com/en-us/windows-server/administration/performance-tuning/role/hyper-v-server/architecture), [Hyper-V VLANs](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/deploy/configure-virtual-local-area-networks-for-hyper-v), and [Docker container introduction](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/): hypervisor/guest/kernel and virtual/physical attachment boundaries.
- [Cisco multiprotocol VRFs](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/mp_l3_vpns/configuration/xe-17/mp-l3-vpns-xe-17-book/mpls-vpn-vrf-cli-for-ipv4-and-ipv6-vpns.html) and [IOSv features](https://developer.cisco.com/docs/modeling-labs/iosv/): optional image-specific VRF observation without a Packet Tracer guarantee.
- [Cisco IOS XE hardening](https://sec.cloudapps.cisco.com/security/center/resources/IOS_XE_hardening): management/control/data purposes and restricted management access.
- [RFC 7348](https://www.rfc-editor.org/rfc/rfc7348.html): VXLAN framing and the explicitly scoped inner/outer packet calculation.
- [HashiCorp drift workflow](https://docs.hashicorp.com/terraform/tutorials/state/resource-drift): intended/observed state and review/apply behavior; the lesson does not equate a repository revert with deployed recovery.

## Verification and honest limits

Independent review resolved five categories of refinement: evidence rubrics now remain under Troubleshooting instead of being parsed into each lab introduction; one plane-role distractor explanation now matches its actual option; the optional VRF recovery explicitly repeats both BLUE and RED local pings; three supplied-mismatch/acceptance questions have direct-application labels; and the WLAN timer question uses realistic session/exclusion/security-state misconceptions. No answer key, subnet, controller tagging contract or challenge topology required correction.

[37-40-verify.mjs](37-40-verify.mjs) verifies exact decisions, all wrong-answer explanations, ordered demand, preserved lesson sections, synchronized lab minutes, revision notices, closed challenges and rendering. [37-40-verification.json](37-40-verification.json) records 1,022 rendered React fragments and ten closed solution disclosures. It also checks the DHCP ranges by enumerating candidates, key-length limits, timer conversion, option-43 octets and scoped 1550-byte outer IP arithmetic. Correct options pass the conspicuously-longest check; answer positions are distributed.

No Packet Tracer, physical AP/controller, CML router, hypervisor, radio, PoE or controller/API pipeline was executed during this author pass. No whole-course tests, build, server, browser layout measurement, deployment or psychometric calibration was performed. Supplied observations and optional worksheets remain explicitly separate from live learner evidence.

Lab progress is positional. Each revised lab asks returning learners to repeat the exercise and update its checkmarks. No saved history was cleared or silently remapped.
