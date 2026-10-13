# Chapters 36–38 wireless audit

Reviewed and rewritten on 2026-09-20. Scope: all six assets in each of `36-wireless-principles`, `37-wireless-architecture` and `38-wireless-security-config`. This report distinguishes documentation/static verification from simulator execution. No Packet Tracer, AP, controller, radio survey or packet capture was executed for this review.

## Scope and structure decisions

The existing sequence remains appropriate: radio and WLAN identification → architecture and wired attachment → security and client configuration. Most lesson and lab prose was replaced with stepwise professional explanations; every question, distractor explanation, card, command drill and ticket was inspected and rewritten where necessary.

The official [v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) supports 36's 1.11 parent/leaves, 37's architecture/physical-connectivity objectives 2.6/2.7, and 38's 5.9, 5.10 and 2.9. The announced [v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) supports 36's 1.5 parent/leaves, 37's AP edge attributes 2.2.b and 38's security 1.5.c. The legacy controller GUI is not presented as a new v2.0 controller-configuration objective. Baseline remains v1.1 through 2 February 2027 and v2.0 from 3 February 2027, as established by the course's official exam-source review.

Prerequisites remain earlier chapters only. Chapter 36 now explicitly builds on client-OS troubleshooting; 37 adds inter-VLAN routing and EtherChannel because its examples use those concepts; 38 adds QoS and AAA alongside wireless architecture. Chapter 38's display title is shortened to “WLAN security.”

All original H2 identities are retained through `sectionIds`. Display headings changed, but the loader comparison against `final-ten/baseline.json` found zero missing original section IDs in these three chapters. No chapter identity, number, UI, color, global document, progress storage, build, commit or publication was changed.

## Material technical corrections

### 36 — Wireless principles

- Replaced absolute “only one client ever” language with ordinary half-duplex/shared-airtime behavior and a concise qualification for modern coordinated multi-user operation.
- Separated dB/dBm/dBi, received level, tool-specific RSSI and SNR. Negative dBm is common for received Wi-Fi signals, not a universal unit restriction. Comparisons use the same receiver/band/time context.
- Checked SNR examples: −65 − (−92) = 27 dB; −55 − (−60) = 5 dB; worksheet −68 − (−94) = 26 dB. Checked 17 + 6 − 1 = 22 dBm EIRP and approximate 20→23 dBm = 100→200 mW.
- Scoped 2.4 GHz 1/6/11 reuse to the stated ordinary 20 MHz North American example. Removed universal 5 GHz channel counts, worldwide DFS timers and publication-year trivia as required knowledge.
- Clarified PHY rate versus achieved throughput without an exact half-rate rule.
- Corrected SSID length to 32 octets, BSSID versus physical chassis, ESS versus merely matching names, and roaming versus guaranteed preserved IP sessions.
- Removed exact 50% co-channel throughput and categorical adjacent-channel failure claims. A lunchtime pattern alone does not prove a microwave source; tickets now require controlled evidence.
- Separated association/key establishment/DHCP and constrained what Windows reports prove.
- Lab now explicitly configures WRT LAN address/DHCP and the server, separates wrong-key observation/recovery, and treats channel/interference practice as worksheets rather than measurements from Packet Tracer.

### 37 — Wireless architectures

- Replaced “autonomous/Meraki always trunk” with the actual tagged/untagged traffic contract. Meraki bridge mode is a named example, not a claim that every supported SSID mode bridges locally.
- Corrected split-MAC functions and the wired CAPWAP security boundary. AP radio encryption/decryption means WPA2/WPA3 do not automatically keep payloads encrypted across the wired CAPWAP data path.
- Corrected “control always encrypted”: discovery precedes established DTLS. Data DTLS remains separate.
- Removed universal unchanged-frame encapsulation, fixed AP-selection hierarchy/timer trivia, universal AP-mode reboot, monitor-never-transmits and sniffer-captures-everything claims.
- Separated FlexConnect local switching, local authentication and conditional controller-loss behavior. Existing clients/new clients and unavailable DHCP/RADIUS can differ.
- Scoped AireOS virtual/service/dynamic interfaces by platform, and explained current 9800 policy profiles/tags instead of conflating their object models.
- Distinguished static legacy AireOS LAG from supported 9800 and Meraki AP negotiation. Added a documented MR53/passive AP → active switch LACP example, matching VLAN settings and PoE requirements, without claiming every two-port AP supports aggregation.
- Reframed EWC-on-AP as an existing legacy deployment after its official November 2024 end of sale, with 17.15.x the final train; removed AP/client scale trivia.
- CDP advertised address is no longer called proof of DHCP. A controller MAC entry is no longer called proof of wireless forwarding.
- Lab is cold-start VLAN/routing/AP-management practice with separate AP-link fault and recovery. Unavailable controller/FlexConnect/PoE/LACP simulation is an explicit worksheet boundary. Actual client WLAN verification belongs to 38.
- Checked option-43 encodings independently: `c0a80a05` = 192.168.10.5; `0a0a3205` = 10.10.50.5. The ticket fixes one pool and one AP renewal, not a global lease clear.

### 38 — WLAN security

- Corrected “WPA3 = GCMP” and “SAE replaces the four-way handshake.” Personal can use CCMP-128; specialized Enterprise 192-bit requirements are not all WPA3 requirements. SAE precedes the retained four-way handshake.
- Scoped WPA2 ASCII/HEX input rules rather than declaring a universal WPA3/SAE password rule.
- Corrected open-system initial authentication as a WPA2 example rather than the first stage of every modern security method.
- Defined PMK/PTK/GTK and distinguished authenticator-distributed group keys. A generic popup is not a precise message-2 trace.
- Defined 802.1X roles within the stated central deployment, without “AP only ever relays” or “authenticator never locally authenticates” universals.
- Retained useful EAP-TLS/PEAP comparison while removing required memorization of advanced/legacy method phases, “strongest” claims and unsupported statements that the blueprint explicitly names every method.
- Corrected PMF's scope: selected robust management frames after security establishment, not every beacon or protection from jamming. Clarified transition clients and OWE's lack of authenticated identity.
- Enterprise revocation now distinguishes future authentication from active sessions/caches. RADIUS shared secret, WLAN PSK, user credential and controller administrator secret remain separate.
- GUI tables explicitly distinguish security generation/cipher/AKM, VLAN mapping, DHCP-proxy requirements, enabled state, QoS/advanced policy and persistence. Removed universal WLAN-ID limits, automatic advertisement assumptions, factory-management defaults, 60/1800-second fault conclusions and unsupported simulator-specific guarantees.
- Catalyst 9800 workflow is an object translation for an already commissioned controller, not a claim that Packet Tracer emulates IOS XE. The optional CLI excerpt is deliberately incomplete as a full deployment and says so.
- Controller/client output is representative and abbreviated. Security-complete evidence precedes a DHCP diagnosis; “Associated,” configured cipher and stale lease do not independently prove completion.
- Cold lab explicitly powers/cables the selected models, creates the real DHCP service, configures the WLC's primary server where required, creates a disabled WLAN before security edits, tests a known local HTTP service, and separates both faults from their repairs.
- The DHCP fault requires confirming the client's lease is released before removing the pool. Unsupported renewal behavior has a labeled supplied-evidence worksheet. No unconfigured DNS server is advertised.
- The missing-VLAN ticket explicitly selects a DHCP-bridging design so its interpretation does not silently assume how an AireOS DHCP proxy forwards requests.

## Source evidence

All URLs are primary Cisco, IEEE, Microsoft or RFC publications. Legacy documentation is used explicitly to explain the legacy platform, not to advertise it as current hardware. Relevant source URLs are also in the chapter frontmatter.

| Claim group | Verified primary source |
|---|---|
| RF quantities, radio behavior, channel/antenna context | [Cisco RF reference](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wireless-rf-reference-guide.html) and [Cisco RRM](https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/71113-rrm-new.html) |
| Interference investigation and sensing limits | [Cisco CleanAir design](https://www.cisco.com/c/en/us/support/docs/wireless/5500-series-wireless-controllers/112139-cleanair-uwn-guide-00.html) |
| IEEE standard identity and 802.11be publication distinction | [IEEE 802.11-2024](https://standards.ieee.org/ieee/802.11/10548/) and [IEEE publication announcement](https://www.ieee802.org/11/email/stds-802-11/msg08898.html): 802.11be-2024 was published 22 July 2025; the old unverified publication-date assertion was not retained |
| SSID/BSS field and CAPWAP binding | [RFC 5416](https://www.rfc-editor.org/rfc/rfc5416) |
| Read-only Windows wireless commands | [Microsoft netsh wlan](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netsh-wlan) |
| Generic legacy PT wireless-security workflow, not a modern WLC support matrix | [Cisco NetAcad activity](https://contenthub.netacad.com/legacy/I2IoT/2.0/en/course/files/5.1.2.6%20Packet%20Tracer%20-%20Configure%20Wireless%20Security.pdf) |
| Split-MAC and AP-side radio encryption/decryption | [Cisco unified wireless solution](https://www.cisco.com/c/en/us/products/collateral/wireless/unified-wireless-network-sg.html) |
| CAPWAP ports, discovery and DTLS/data distinction | [RFC 5415](https://www.rfc-editor.org/rfc/rfc5415) |
| Vendor-specific controller discovery TLV | [Cisco option 43](https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/97066-dhcp-option-43-00.html) |
| AireOS physical/logical interfaces, virtual address and static LAG | [Cisco AireOS 8.10 ports/interfaces](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/ports_and_interfaces.html) |
| Mode-specific functions and transition/standalone limitations | [Cisco 9800 17.15 AP modes](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-15/config-guide/b_wl_17_15_cg/m-sniffer-cg.html) |
| 9800 versus AireOS profile/tag model | [Cisco configuration model](https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213911-understand-catalyst-9800-wireless-contro.html) and [current 26.x model](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/26-1/configuration-guide/wl-26-1-cg/config-model/elements-config-model.html) |
| Supported 9800 negotiated aggregation | [Cisco 9800 17.15 LAG](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-15/config-guide/b_wl_17_15_cg/m_lacp_pagp.html) |
| Meraki bridge/NAT/tunnel distinction | [Meraki SSID modes](https://documentation.meraki.com/Wireless/Design_and_Configure/Configuration_Guides/Client_Addressing_and_Bridging/SSID_Modes_for_Client_IP_Assignment) |
| AP passive LACP, matching native VLANs and supported models | [Meraki AP LAG](https://documentation.meraki.com/Wireless/Design_and_Configure/Configuration_Guides/Client_Addressing_and_Bridging/MR_Link_Aggregation_Configuration_Guide) and [MR52/53 installation](https://documentation.meraki.com/Wireless/Install_and_Get_Started/Installation_Guides/MR52%2F%2F53_Installation_Guide) |
| EWC-on-AP lifecycle | [Cisco EOL notice](https://www.cisco.com/c/en/us/products/collateral/wireless/embedded-wireless-controller-catalyst-access-points/wireless-ewc-access-point-eol.html) |
| PSK/AKM fields, P2P policy and security GUI | [AireOS WLAN security](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_security.html) |
| SAE, PMF, transition and cipher distinctions | [9800 17.17 WPA3](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-17/config-guide/b_wl_17_17_cg/m_wpa3.html) |
| 6 GHz security boundary | [Cisco Wi-Fi 6E Layer 2 security](https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/220712-configure-and-verify-wi-fi-6e-wlan-layer.html) |
| GUI PSK rules and current fields | [Cisco 26.x PSK configuration](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/26-1/configuration-guide/wl-26-1-cg/private-sk/private-psk.html) |
| EAP framework/roles and certificate method | [RFC 3748](https://www.rfc-editor.org/rfc/rfc3748), [RFC 5216](https://www.rfc-editor.org/rfc/rfc5216) and [Cisco 802.1X configuration](https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213919-configure-802-1x-authentication-on-catal.html) |
| Unauthenticated encryption versus identity assurance | [RFC 8110](https://www.rfc-editor.org/rfc/rfc8110) |
| QoS profiles and timer interpretation | [AireOS wireless QoS](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wireless_quality_of_service.html) and [WLAN timeouts](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_timeouts.html) |
| DHCP proxy versus bridging path | [Cisco AireOS DHCP handling](https://www.cisco.com/c/en/us/support/docs/wireless/4400-series-wireless-lan-controllers/110865-dhcp-wlc.html) |

No exam dumps or third-party answer banks were used. Existing VERIFY comments were resolved by these sources or by removing the unsupported universal claim and stating an explicit simulator/platform boundary; they were not merely deleted.

## Assessment identities

Removed identities, intentionally not reused for unrelated knowledge:

- `wireless-architecture-c10`: AP/controller maximum-scale trivia retired. New `wireless-architecture-c22` assesses AP power requirements.
- `wireless-security-config-c15`: universal WLAN-ID/default-advertisement limits retired. New `wireless-security-config-c21` distinguishes profile name, SSID and WLAN ID.

Additional items:
- `wireless-principles-q16`: PHY rate versus throughput.
- `wireless-architecture-q16`: power-limited AP evidence.
- `wireless-architecture-c23`: policy-tag mapping.
- `wireless-architecture-d11` / `d12`: automatic PoE and AP-facing LACP initiation.
- `wireless-security-config-q16`: PMF protection boundary.
- `wireless-security-config-c22`: association versus completed security.
- `wireless-security-config-d09` / `d10`: policy-tag mapping and client detail.

Every other original question/card/drill/ticket ID remains associated with its original topic, including corrected defaults or more carefully bounded exhibits. No old question, command or ticket IDs were removed. No stored learning history was cleared. Lab steps were substantially rewritten and expanded, so the report does not claim that a previously checked step establishes performance of the new procedure.

## Counts and verification

| Chapter | Lesson words reported by loader | Questions | Multi | Exhibits | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 36 | 2789 | 16 | 2 | 6 | 22 | 8 | 2 | 12 |
| 37 | 2521 | 16 | 2 | 4 | 20 | 12 | 2 | 12 |
| 38 | 2882 | 16 | 2 | 6 | 21 | 10 | 2 | 14 |
| Total | 8192 | 48 | 6 | 16 | 63 | 30 | 6 | 38 |

`node scripts/validate-content.mjs` returned **0 errors** and no warnings for chapters 36–38. Nineteen existing no-objective warnings elsewhere in the course remain outside this ownership.

A targeted pass rendered **781** actual React/Markdown/code/diagram fragments covering all owned sections, lab material, prompts/options/explanations, cards, drill text and tickets. It checked unresolved placeholders, malformed rendered values, angle-bracket placeholder leakage, every distractor's `whyWrong` membership, sequential lab numbering and an expected-observation container in every step. All passed.

Independent arithmetic checks covered SNR, EIRP, DHCP pool size and both option-43 address encodings. Baseline comparison found all same-topic section IDs retained and only the two explicitly retired cards absent. Files were normalized to UTF-8 without a BOM.

These checks do **not** establish actual controller GUI behavior, exact Packet Tracer support, radio measurements, physical PoE negotiation, real AP registration, WPA handshakes or hardware forwarding. Output is authored representative evidence. Those manual/runtime limits are stated in the learner material.

## Independent peer review and final repairs

The switching/routing author read all 18 assets and identified three concrete issues, all repaired and independently reread:

1. Chapter 37's representative AireOS management row originally said VLAN 10 while the neighboring trunk example used native VLAN 10. The controller row now correctly says VLAN 0 (untagged), with an explicit annotation that the switch assigns it to native VLAN 10.
2. Chapter 37 q09 incorrectly used DTP's “dynamic desirable” phrase as a PAgP distractor. The option now explicitly names PAgP channel-group mode desirable, matching its explanation. The static AireOS answer remains unchanged.
3. The official AireOS 8.10 ports/interfaces guide documents a trunk for the distribution-system connection. Chapter 38's WLC-facing Fa0/2 now overrides the access-port range with trunk/native 10/allowed 10 and PortFast trunk; other endpoint ports remain access VLAN 10. Diagram, observations, management VLAN0 interpretation, troubleshooting and VLAN99 challenge agree. Both lessons explain the platform-specific controller requirement; AP access/trunk choices remain based on the actual AP traffic contract.

No unresolved material findings remain in that independent review. No addresses, chapter IDs, question IDs, section IDs or lab-step IDs changed in these repairs. All six lesson/lab Markdown files were normalized to exactly one final newline. Validation was repeated after the corrections: 0 errors and no owned warnings. Peer review was documentation/manual consistency work; no PT/CML/radio/controller execution occurred.

## Independent read-only review performed for chapters 39–41

I also read all 18 final assets in 39-virtualization, 40-network-management-and-sdn and 41-rest-apis-json, including all correct answers and every distractor explanation. No actionable material finding was identified.

The pass checked hypervisor/kernel boundaries, host tagging and VRF separation/address reassignment; the two-switch VLAN fault and recovery; OSPF addressing, cost 2, return routes, management-source ACL and sequence-15 repair; VXLAN outer-IP size 1500 + 14 + 8 + 8 + 20 = 1550; HTTP method/status/authentication distinctions, JSON syntax/schema separation, the loopback-only Python handler, and its credential/filter/fault/restore paths. I independently opened Microsoft's Hyper-V architecture, Cisco's multiprotocol VRF guide, RFC 7348 and RFC 9110 to cross-check the central technical distinctions.

This was a source/code/content review. I did not run Packet Tracer, CML, IOS or the chapter 41 HTTP service. The author separately reports 14 executed local HTTP/JSON checks; those are not represented as my execution. No peer-owned files were modified.
