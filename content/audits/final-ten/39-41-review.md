# Chapters 39–41 content review

Reviewed 20 September 2026. This review covers all six assets in each of 39-virtualization, 40-network-management-and-sdn and 41-rest-apis-json: lessons, guided labs, every question and distractor explanation, cards, command drills and troubleshooting tickets. It changes no application code, styles, shared indexes, dependencies, deployment or other chapter assets.

## Scope and progression

The [Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) requires explaining virtualization fundamentals including server virtualization, containers and VRFs (1.12), recognizing on-premises/cloud topology (1.2.f), and describing controller-based networking and its interfaces (6.1–6.3). REST characteristics and JSON recognition are 6.5 and 6.7. The [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) has virtualization/cloud recognition (1.2), configuration and verification of ports connected to virtual hosts (2.2.d), and network-management approach comparison (5.3). These are different verbs; no claim is made that a short descriptive treatment completes advanced platform deployment.

Chapter 39 now adds truthful v1 1.2.f and v2 2.2.d mappings, because its existing cloud content and expanded host-uplink work teach them. VRF questions remain mapped to the explicit v1 objective rather than inheriting an unsupported v2 virtualization tag. Chapter 40 retains its existing objective mappings. Chapter 41 keeps its v1 objectives and no direct v2 mapping; its HTTP/JSON foundations remain useful for subsequent automation. Complete production RESTCONF deployment is optional platform-specific study, not an assumed Packet Tracer feature or a hidden prerequisite. Chapter 42 owns the Ansible/Terraform workflow; stale references suggesting it was a model-driven device-interface chapter were corrected.

All chapter numbers, stable chapter IDs, parts and domains remain unchanged. Chapter 39 adds the earlier spanning-tree prerequisite for its carefully qualified edge-port discussion. Chapter 40 adds the earlier ACL chapter using the real stable ID **acls**, not the nonexistent ipv4-acls. Every prerequisite points backward. Titles were clarified to Network management and SDN and REST APIs and JSON.

## Inventory and stable identities

| Chapter | Loaded lesson words* | H2 sections | Questions | Multi-select | Exhibits | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 39 | 2220 | 8 | 16 | 3 | 4 | 20 | 10 | 2 | 9 |
| 40 | 2221 | 9 | 16 | 2 | 5 | 20 | 6 | 2 | 10 |
| 41 | 2130 | 9 | 16 | 2 | 8 | 20 | 6 | 2 | 14 |

*The loader word count includes examples and tables; it is not a prose-only measurement. Small final wording changes can alter it. H2 counts exclude the intro. Drills reflect useful tasks rather than an artificial ten-command minimum. Single-answer positions are balanced: 39 has 4/3/3/3; 40 has 3/4/3/4; 41 has 4/4/3/3 across positions 0/1/2/3.

All baseline loaded section IDs are preserved. Explicit frontmatter mappings retain these old identities under clearer headings:

| Chapter | New heading | Preserved ID |
|---|---|---|
| 39 | What virtualization separates | why-one-box-pretends-to-be-many |
| 39 | Virtual switches and physical uplinks | virtual-switches-vnics-and-the-trunk-to-the-host |
| 39 | Cloud service and deployment models | cloud-virtualization-someone-else-runs |
| 40 | Make changes repeatable and verifiable | why-forty-switches-need-one-brain |
| 41 | Why network engineers read HTTP | why-a-network-engineer-reads-http |
| 41 | Authentication and transport protection | authentication-four-ways-to-prove-who-you-are |

The rest retain their original derived IDs. No section identity is retired or reused for a different topic.

Assessment identity decisions:

- **39:** retain q01–q15, c01–c20, d01–d10 and t01–t02 because each still assesses its original subject with corrected facts. Add virtualization-q16 for shared-host failure. No retired IDs.
- **40:** retain q01–q15 and both tickets; add network-management-and-sdn-q16 for management-plane overlap. Retain cards c01–c11 and c13–c20. Retire **network-management-and-sdn-c12**, an API enable-command recall item; its new endpoint-readiness concept uses **network-management-and-sdn-c21**. Retire **network-management-and-sdn-d01, -d02, -d03, -d04 and -d05**, which required enabling NETCONF/RESTCONF/HTTP authentication or inspecting a platform-specific API service outside this descriptive chapter. Retain d06–d08 and add d09–d11 for management sessions, ACL evidence and a harmless configuration change. The retired commands are not claimed to have been moved to a later chapter.
- **41:** retain q01–q15, c01–c20 and both tickets; add rest-apis-json-q16 for 202 acceptance. Retire **rest-apis-json-d01, -d02, -d03, -d04 and -d05**, the unrelated device API-server configuration tasks. Retain d07 and d08 on token requests and request headers with safer credential handling; add d09–d12 on local HTTP evidence and JSON validation. Baseline d06 did not exist. No question, card or ticket is retired.

Exact retirement allowlist: network-management-and-sdn-c12; network-management-and-sdn-d01; network-management-and-sdn-d02; network-management-and-sdn-d03; network-management-and-sdn-d04; network-management-and-sdn-d05; rest-apis-json-d01; rest-apis-json-d02; rest-apis-json-d03; rest-apis-json-d04; rest-apis-json-d05.

## Chapter 39: corrections and primary evidence

| Claim or teaching issue | Final treatment | Primary evidence |
|---|---|---|
| Hypervisor architecture | Type 1/Type 2 recognition; Hyper-V uses a hypervisor and privileged root partition. A desktop management interface does not make it Type 2. Guest awareness is not universally absent. | [Microsoft Hyper-V architecture](https://learn.microsoft.com/en-us/windows-server/administration/performance-tuning/role/hyper-v-server/architecture) |
| Containers and isolation | Ordinary containers isolate processes while sharing their environment's kernel; Windows Hyper-V isolation adds a VM boundary. No universal size, boot-time, density or escape-impact claims. | [Docker containers](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/), [Microsoft isolation modes](https://learn.microsoft.com/en-us/virtualization/windowscontainers/manage-containers/hyperv-container) |
| Container addressing | Bridge/NAT behavior depends on the network driver and configuration. No universal container subnet or assertion that every host presents only one MAC. | [Docker bridge driver](https://docs.docker.com/engine/network/drivers/bridge/), [port publishing](https://docs.docker.com/engine/network/port-publishing/) |
| Virtual-host uplinks | Multiple tagged guest VLANs need an agreed trunk; a single untagged design can use access mode. Check both sides' tagging/native VLAN and allowed VLANs. | [Hyper-V VLAN configuration](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/deploy/configure-virtual-local-area-networks-for-hyper-v), [Cisco 2960 VLAN guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/b_1522e_2960_2960c_2960s_2960sf_2960p_cg_chapter_01101.html) |
| Edge and aggregated uplinks | PortFast requires a verified edge topology, not merely the word server. LACP must match the exact supported teaming/switch design; it is not assumed for any pair of NICs. | [Cisco PortFast guidance](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10586-65.html), the hypervisor's documented VLAN/switch design |
| VRF scope and moving interfaces | VRFs separate routing contexts; overlapping addresses require context. The optional Cisco IOS lab explicitly re-applies addressing after VRF reassignment. MPLS label/RD/route-target memorization is not smuggled into the core explanation. | [Cisco VRF CLI](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/mp_l3_vpns/configuration/xe-17/mp-l3-vpns-xe-17-book/mpls-vpn-vrf-cli-for-ipv4-and-ipv6-vpns.html), [VRF-Lite](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9400/software/release/17-8/configuration_guide/rtng/b_178_rtng_9400_cg/configuring_vrf_lite.html) |
| Lab platform support | Cisco lists VRF-Lite for IOSv. The optional isolated CML exercise is explicitly separate from the Packet Tracer switching model, with a worksheet fallback if CLI support differs. | [Cisco CML IOSv features](https://developer.cisco.com/docs/modeling-labs/iosv/) |
| Cloud models | Distinguish service models from deployment models; cloud includes more than server virtualization. A cloud subnet is not universally identical to an Ethernet VLAN; private transport does not inherently prove encryption or latency. | [NIST SP 800-145](https://csrc.nist.gov/pubs/sp/800/145/final) |

The complete Packet Tracer lab uses two 2960 switches and four PCs to model, not instantiate, a virtual switch and its guests. VLAN 10 and 20 addressing, ports, cables and native VLAN 999 agree throughout. Removing VLAN 20 from the uplink is observed before a separate restoration step. The optional IOSv exercise uses isolated loopbacks: BLUE and RED each own 10.39.0.1/32, with global 192.0.2.39/32. The interface-move fault and address restoration are explicit. Ticket t02 now states a trunk allowed-list omission, replacing an inconsistent scenario in which an access port supposedly passed tagged guest traffic.

## Chapter 40: corrections and primary evidence

| Claim or teaching issue | Final treatment | Primary evidence |
|---|---|---|
| Planes and forwarding | Distinguish control, data and management functions; hardware versus CPU is implementation detail, not the definition. OSPF FULL does not mean routers have identical route tables. | [Cisco IOS XE hardening architecture](https://sec.cloudapps.cisco.com/security/center/resources/IOS_XE_hardening), [Cisco CEF command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipswitch/command/isw-cr-book/isw-s1.html) |
| Centralization and outages | Logically centralized services may be clustered or hosted differently. Existing forwarding can continue, but actual controller-outage effects depend on functions, state lifetimes and new work. Traditional networks can also be automated. | [Cisco SDN discussion](https://www.cisco.com/c/en/us/solutions/collateral/enterprise/cisco-on-cisco/cs-en-08022017-sdn-thesis.html), [current SD-Access design guide](https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-sda-design-guide.html) |
| Northbound/southbound APIs | Classify by participants and purpose; the protocol name alone is insufficient. Inventory may be cached. NETCONF and RESTCONF are introduced accurately without enabling unsupported Packet Tracer services. | [RFC 6241](https://www.rfc-editor.org/rfc/rfc6241), [RFC 8040](https://www.rfc-editor.org/rfc/rfc8040) |
| Controller product examples | Keep Catalyst Center, SD-WAN Manager and APIC as contextual examples. OpFlex is qualified for supported virtual integration, not every APIC physical-switch connection. | [SD-Access design guide](https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-sda-design-guide.html), [SD-WAN overview](https://www.cisco.com/c/en/us/td/docs/routers/sdwan/26x-later/solution/cisco-catalyst-sd-wan-solution-overview/solution.html), [ACI Virtual Edge](https://www.cisco.com/c/en/us/td/docs/switches/datacenter/aci/aci_virtual_edge/configuration/3-x/cisco-aci-virtual-edge-configuration-guide-30x/Cisco-ACI-Virtual-Edge-Configuration-Guide-221_chapter_01.html) |
| Overlay and MTU | Diagnose underlay and overlay with evidence. For the stated untagged IPv4 case, 1500-byte inner IP + 14 inner Ethernet + 8 VXLAN + 8 UDP + 20 outer IPv4 = 1550 outer IP bytes. Outer Ethernet is excluded from that IP-MTU comparison; IPv6 and tags change the calculation. | [RFC 7348](https://www.rfc-editor.org/rfc/rfc7348) |
| Declarative workflows and drift | Desired state does not mean every resource is managed or every drift is automatically corrected. A Git revert alone does not deploy a rollback. | [HashiCorp resource drift tutorial](https://docs.hashicorp.com/terraform/tutorials/state/resource-drift) |

The lab is a complete two-router/two-PC Packet Tracer routed network with OSPF, SSH, a management-source ACL and console recovery. Its data path continues to work while an explicit VTY ACL blocks PC-A; the fault is observed before sequence 15 restores PC-A ahead of deny sequence 20. SSH username/password are fictional lab values. All VTY lines available on the chosen router are addressed; the extra range has a stated platform fallback. Description drift is harmless and verifiable. A paper overlay calculation does not pretend that Packet Tracer emulates a controller or VXLAN fabric. The resulting configuration contains no NETCONF/RESTCONF server.

## Chapter 41: corrections and primary evidence

| Claim or teaching issue | Final treatment | Primary evidence |
|---|---|---|
| REST, HTTP and representation | REST is an architectural style, HTTP an application protocol, and JSON a representation format. HTTP is not called a transport-layer protocol. | [Fielding REST chapter](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm), [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) |
| Safety and idempotence | Safe refers to requested semantics; incidental logging may occur. Idempotent concerns intended state effect, not identical responses. POST/PATCH retries need API-specific evidence. PUT can create under the API contract. | [RFC 9110 section 9.2](https://www.rfc-editor.org/rfc/rfc9110.html), [PATCH RFC 5789](https://www.rfc-editor.org/rfc/rfc5789) |
| Response status | 401 means valid authentication is required; 403 is refusal and does not universally prove successful authentication. 404 may conceal a resource. 202 is acceptance, not completion; 204 has no content. A 503 does not prove request syntax was valid. | [RFC 9110 status semantics](https://www.rfc-editor.org/rfc/rfc9110.html) |
| Authentication and TLS | Basic is reversible Base64, not encryption. TLS must authenticate the endpoint. Bearer does not necessarily mean OAuth or JWT. Token lifetime/refresh is API-specific, not universally one hour. | [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), [TLS RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) |
| Vendor examples | Meraki and Catalyst Center examples identify documented authentication conventions without stale public sandbox credentials or a fixed lifetime promise. | [Meraki authorization](https://developer.cisco.com/meraki/api-v1/authorization/), [Catalyst Center authentication](https://developer.cisco.com/docs/catalyst-center/authentication-api/) |
| JSON | Separate syntax from schema/types. Arrays are ordered; null differs from absent. Capital True and trailing commas are invalid JSON. Python's default non-standard NaN acceptance is explicitly disabled in the exercise; the small selected schema is not advertised as a complete validator. | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259), [Python JSON documentation](https://docs.python.org/3/library/json.html) |
| Tool evidence and handling | curl -i displays response headers; it does not show every outgoing request header. Verbose traces may expose secrets. Shell-specific setup and curl.exe avoid Windows PowerShell alias confusion. | [Official curl manual](https://curl.se/docs/manpage.html) |
| Local exercise limits | A supplied Python HTTP teaching server binds only to loopback; tokens are fictional and there is no TLS/OAuth production security claim. | [Python HTTP server documentation](https://docs.python.org/3/library/http.server.html), [Python downloads](https://www.python.org/downloads/) |

The lab gives a complete local server, exact setup and startup, request paths, two fake roles, expected 200/401/403/404 responses, a JSON syntax fault and separate repair, selected-schema validation, cleanup, and an independent challenge with answers. CRUD mutation and TLS are clearly marked interpretation exercises rather than secretly unimplemented server features. The POST-retry ticket supplies server audit evidence and a GET result before concluding that the first change committed.

## Verification and limits

- Loaded all three chapters with the production content loader, checked baseline section-ID preservation, assessment answer-index uniqueness, wrong-answer explanation coverage, counts, answer-position distribution and prerequisite identities.
- Ran the course content validator: zero errors. Its pre-existing warnings were outside chapters 39–41; no owned-chapter warnings remained. Scanned all owned files for unresolved VERIFY/TODO/FIXME markers and common encoding damage; none remained.
- Independently reviewed subnet/port consistency, ACL rule ordering, duplicate /32 VRF context, fault/restore separation, and 1500 + 14 + 8 + 8 + 20 = 1550 MTU arithmetic against the stated encapsulation scope.
- Actually extracted and compiled the exact Python server and JSON validator from the final lab, started the server on an ephemeral IPv4 loopback port, and ran **14 checks**: eight HTTP authorization/filter cases; one real curl.exe GET with parsed response; and five JSON validation cases. All passed. The HTTP cases included missing/wrong credentials, read role, denied administrative role, allowed administrative role, absent resource, empty filter and matching filter. JSON cases included valid input, capital True, string instead of Boolean, NaN and trailing comma. The test also checked content type and the authentication challenge header, and stopped the server afterward.
- The live test used an available ephemeral port to avoid collision; the published exercise consistently uses loopback port 8765. It tested HTTP semantics and the supplied validator, not production TLS, OAuth or real controller APIs.
- **No Packet Tracer, CML, IOSv, physical-switch/router or controller execution was available.** Cisco configurations and topology behavior were source-reviewed and manually checked, not recorded as executed. All authored device output is labeled representative. Unsupported simulator features have explicit model/worksheet alternatives; completing those alternatives is not claimed to prove real platform deployment skill.
- No build, browser, deployment, Git mutation or application-code test was performed by this content task.

## Independent peer review

The fundamentals reviewer independently read all 18 final assets and reported no actionable material findings. That pass checked every question and distractor, lab state transitions, VRF address/context handling, tagged uplinks, the stated OSPF cost of 2, VTY ACL recovery, the 1550-byte outer-IP calculation, HTTP/authentication/status semantics, JSON types and the supplied Python handler/validator. The reviewer independently consulted Microsoft Hyper-V, Cisco multiprotocol VRF, RFC 9110 and RFC 7348. The peer review was source/read-only review, not a second simulator or HTTP execution; the 14 local runtime checks above are separate author evidence.
