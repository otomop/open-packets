# Independent practice review: Chapters 37–40

Review date: 24 September 2026. Reviewer: switching/routing research agent, separate from the author. Status: closed after rereading every requested correction in the final files; no outstanding actionable findings.

## Scope

Read all four final question banks, including every option, answer key and wrong-answer explanation; all flashcards and command drills; all eight ticket scenarios, exhibits, alternatives and repairs; and all four labs from the supplied setup through the independent challenge. Checked chapter metadata and lesson context for objective depth, prerequisites and platform boundaries. This review did not edit the chapter assets.

The reviewed practice covers 70 questions, 66 cards, 19 drills, eight tickets and 45 guided lab stages. The different workloads are appropriate: controller GUI work has a larger applied bank, while virtualization and management architecture use shorter conceptual banks and supplied optional setup. Optional VRF configuration and Catalyst 9800 translation are not presented as required Packet Tracer capabilities.

| Chapter | Questions | Final editorial levels 1 / 2 / 3 | Cards | Drills | Tickets | Guided stages |
|---|---:|---|---:|---:|---:|---:|
| 37 · Wireless architectures | 17 | 7 / 10 / 0 | 15 | 7 | 2 | 12 |
| 38 · WLAN security | 22 | 8 / 14 / 0 | 20 | 4 | 2 | 14 |
| 39 · Virtualization | 15 | 6 / 9 / 0 | 15 | 5 | 2 | 9 |
| 40 · Network management and SDN | 16 | 7 / 9 / 0 | 16 | 3 | 2 | 10 |

These are editorial reasoning labels, not measured question difficulty. The absence of a level-3 item in these shorter checkpoints is acceptable. Explicit approved-versus-current mismatches require application, even when several supporting observations are supplied; tickets and independent lab changes still require diagnostic decisions and verification.

## Findings and resolution

1. **Evidence-checklist placement, all four labs.** An unrecognized `## Evidence to keep` section was appended to the lab introduction by the loader instead of remaining near completion. The author changed it to an intentional H3 subsection at the end of Troubleshooting, before Challenge. The section remains visible without becoming a new positional lab step.
2. **Chapter 40, `network-management-and-sdn-q01`.** One wrong-answer explanation referred to SSH even though its option now contrasted management-plane route learning and per-packet OSPF forwarding. The corrected feedback addresses those actual claims.
3. **Chapter 39, lab Step 9.** The optional VRF restoration showed the repaired membership and route but omitted the original local VRF echo tests. The final step repeats both BLUE and RED pings after restoration to verify the changed context and preserve the other context's behavior; paper learners retain the explicit unexecuted boundary.
4. **Reasoning labels.** `wireless-security-config-q19`, `virtualization-q19` and `network-management-and-sdn-q18` directly apply an explicit mapping mismatch or unmet acceptance requirement. All three are now application (2), preserving their IDs and technical meaning, with question order updated.
5. **Chapter 38, `wireless-security-config-q21`.** Implausible timeout alternatives were replaced with genuine mistakes about configured session policy, an active exclusion interval and evidence of key establishment. The revised options and feedback retain the distinction between a configured 1,800-second policy and a failed key exchange after 45 seconds.

No incorrect technical answer key, contradictory addressing plan or unsupported claimed simulator execution was found in the full read. The final reread confirmed all five corrections, the demand totals above and deliberate H3 evidence placement in every lab.

## Independently checked lab and case reasoning

- **37:** AireOS management VLAN value 0 agrees with switch native VLAN 10. Centrally switched client VLANs terminate at the WLC; locally switched guest VLAN 30 instead needs the AP and router uplinks. The original AP management pool is `.100–149`; the new challenge pool is `.100–109`, leaving the supplied static AP address outside allocation. The two original wired HTTP paths are retested after AP-link recovery. The discovery ticket's new option-43 bytes encode `10.10.50.5`, rather than the obsolete `10.10.0.5`. MR53 passive LACP requires an active switch peer, distinct from legacy AireOS static LAG.
- **38:** The flat lab's management/native VLAN, router DHCP exclusions, AP/client leases and server addresses agree. Personal key establishment does not require the absent RADIUS service. Wrong-key and unavailable-DHCP faults have separate observations and repairs; an old displayed lease is not accepted as a new lease. The changed challenge uses a second SSID, key and client while retaining LT1 and retesting both HTTP results. Its shared VLAN does not imply guest isolation.
- **39:** Both switch ends carry VLANs 10/20 with unused native 999, and the independent variation adds VLAN 30 without replacing the working allowed list. No router or gateway is invented for the same-VLAN tests. A pair of simulated switches is explicitly a model, not a hypervisor. Identical loopback `/32` addresses are in different VRFs; the global table does not automatically supply a missing VRF route. Reassignment removes the interface address before restoration.
- **40:** Both routers have complete direct-link addresses, reciprocal OSPF advertisements and matching point-to-point mode. Default Gigabit OSPF cost to the remote LAN is 1 + 1 = 2. The VTY filter changes new management sessions without becoming a transit-interface ACL; console access and all usable VTY ranges are addressed. The independent policy change removes PC-B's permit at sequence 10, retains PC-A at 15 and keeps deny 20. Both directed pings, fresh SSH behavior and the description are separate acceptance tests. The stated VXLAN outer IP length is 1,500 + 14 + 8 + 8 + 20 = 1,550 bytes; outer Ethernet overhead is outside this IP-MTU calculation.

## Primary-source spot checks

The following primary references were freshly opened during this independent pass. These checks support the particular mechanisms below, not a claim that documentation proves every simulator implementation.

| Mechanism checked | Primary reference |
|---|---|
| Controller distribution trunk, untagged VLAN value 0 and native agreement | [Cisco AireOS 8.10 ports and interfaces](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/ports_and_interfaces.html) |
| CAPWAP control/data port distinction and discovery/transport framework | [RFC 5415](https://www.rfc-editor.org/rfc/rfc5415.html) |
| MR53 support and passive LACP peer behavior | [Cisco Meraki AP link aggregation](https://documentation.meraki.com/Wireless/Design_and_Configure/Configuration_Guides/Client_Addressing_and_Bridging/MR_Link_Aggregation_Configuration_Guide) |
| Existing local forwarding versus new authentication during a controller/WAN outage | [Cisco AireOS FlexConnect](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/flexconnect.html) |
| Proxy DHCP server selection versus transparent bridging | [Cisco AireOS DHCP handling](https://www.cisco.com/c/en/us/support/docs/wireless/4400-series-wireless-lan-controllers/110865-dhcp-wlc.html) |
| WLAN/policy-profile mapping and AP policy-tag assignment | [Cisco Catalyst 9800 configuration model](https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213911-understand-catalyst-9800-wireless-contro.html) |
| SAE, PMF and transition compatibility boundaries | [Cisco Catalyst 9800 WPA3 guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-17/config-guide/b_wl_17_17_cg/m_wpa3.html) |
| Type 1 Hyper-V architecture despite its management/root partition | [Microsoft Hyper-V architecture](https://learn.microsoft.com/en-us/windows-server/administration/performance-tuning/role/hyper-v-server/architecture) |
| Multiprotocol VRF syntax and removal of addresses when binding an interface | [Cisco IOS XE multiprotocol VRF CLI](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/mp_l3_vpns/configuration/xe-17/mp-l3-vpns-xe-17-book/mpls-vpn-vrf-cli-for-ipv4-and-ipv6-vpns.html) |
| IOSv VRF-lite platform support, without assuming Packet Tracer support | [Cisco Modeling Labs IOSv features](https://developer.cisco.com/docs/modeling-labs/iosv/) |
| Cloud service/deployment distinctions | [NIST SP 800-145, service and deployment definitions](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf) |
| Device management versus transit filtering | [Cisco IOS XE hardening guide](https://sec.cloudapps.cisco.com/security/center/resources/IOS_XE_hardening) |
| VXLAN encapsulation and exclusion of the original frame FCS | [RFC 7348](https://www.rfc-editor.org/rfc/rfc7348.html) |

## Verification limits

This is an independent content, configuration and arithmetic review. No Packet Tracer, CML, controller, real RF, hypervisor or hardware lab was executed by the reviewer. The explicitly supplied worksheets and representative outputs remain distinct from observed device evidence. A successful static render cannot establish runtime behavior of a particular simulator release.

See the [author's exact identity ledger and verification report](37-40-rework.md) for retained/retired IDs, focused rendering and protected-file checks. Whole-batch application and integration results belong to the [batch report](README.md), rather than being inferred from this content review.
