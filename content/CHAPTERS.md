# Course structure — OpenPackets

The 46 chapters are arranged by prerequisite knowledge, rather than exam-domain numbering. This index reflects the local course metadata after the September 2026 structure review. All chapters 00–45 have now received the detailed content review, including lessons, setup, labs and study banks. This records editorial and technical review; the audit reports distinguish executed checks from device exercises that still require platform testing.

The [whole-course coherency audit](audits/coherency-00-45/README.md) follows every chapter from entry knowledge to lesson, lab and assessment demands. It records exact earlier teaching sections, bounded previews, corrected handoffs and preservation checks. The sequence remains 00–45; prerequisite links below reflect the actual skills used.

Chapter frontmatter is the canonical source for titles, objectives and prerequisites. Original source drafts are historical material, not evidence that a claim is correct. Check current Cisco documentation and the applicable official exam blueprint before extending a chapter.

The separate [practice-design plan](PRACTICE-PLAN.md) evaluates workload, difficulty and lab independence across all 46 chapters. Practice implementation is complete across orientation 00 and chapters 01–45. See the [opening practice audit](audits/practice-design/README.md), [09–23 practice audit](audits/practice-09-23/README.md), [24–33 practice audit](audits/practice-24-33/README.md) and [34–45 practice audit](audits/practice-34-45/README.md) for item decisions and verification evidence.

An empty objective list means no direct tag for that track. Foundations and setup can remain necessary preparation without an explicit exam objective. See [the structure review](audits/second-eight/STRUCTURE.md) for topic boundaries and [the final chapters 36–45 review](audits/final-ten/README.md) for the latest prerequisite and lesson-structure corrections.

## Start here

The exam, your tools, and how to study.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 00 | [Start here](chapters/00-start-here/chapter.md) | None | — | — |

## Foundations

Models, cabling, addressing, transport, switching, and the IOS command line.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 01 | [Network models](chapters/01-network-models/chapter.md) | 00 | 1.1.a, 1.13.b, 1.13.d | 2.4 |
| 02 | [Components & topologies](chapters/02-components-and-topologies/chapter.md) | 01 | 1.1, 1.1.a, 1.1.b, 1.1.c, 1.1.d, 1.1.e, 1.1.f, 1.1.g, 1.1.h, 1.2, 1.2.a, 1.2.b, 1.2.c, 1.2.d, 1.2.e, 1.2.f | — |
| 03 | [Cabling & interfaces](chapters/03-cabling-and-interfaces/chapter.md) | 01, 02 | 1.3, 1.3.a, 1.3.b, 1.4 | 1.1 |
| 04 | [IPv4 addressing](chapters/04-ipv4-addressing/chapter.md) | 01, 03 | 1.6 | 1.3 |
| 05 | [Subnetting & VLSM](chapters/05-subnetting-vlsm/chapter.md) | 04 | 1.6, 1.7 | 1.3 |
| 06 | [TCP, UDP & ports](chapters/06-tcp-udp-ports/chapter.md) | 01, 02, 04 | 1.5 | — |
| 07 | [Ethernet switching](chapters/07-ethernet-switching/chapter.md) | 01, 03, 06 | 1.13, 1.13.a, 1.13.b, 1.13.c, 1.13.d | — |
| 08 | [Secure device access](chapters/08-ios-essentials/chapter.md) | 00, 04, 06, 07 | 2.8, 4.8, 5.3 | 4.1 |

## Switching & access

VLANs, trunks, inter-VLAN routing, discovery, EtherChannel, spanning tree, Layer 2 security.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 09 | [VLANs & access ports](chapters/09-vlans-and-access-ports/chapter.md) | 07, 04, 08 | 2.1, 2.1.a, 2.1.b | 2.2, 2.2.a, 2.2.b, 2.2.c, 2.2.d, 2.2.e |
| 10 | [802.1Q trunks](chapters/10-trunks-dtp/chapter.md) | 09 | 2.2, 2.2.a, 2.2.b, 2.2.c | 2.1.b, 2.2.b, 2.2.d, 2.2.e |
| 11 | [Inter-VLAN routing](chapters/11-inter-vlan-routing/chapter.md) | 10, 04 | 2.1.c | 2.1, 2.1.a, 2.1.d |
| 12 | [CDP & LLDP](chapters/12-cdp-lldp/chapter.md) | 07, 08, 11 | 2.3 | 2.3 |
| 13 | [EtherChannel](chapters/13-etherchannel/chapter.md) | 10, 11, 12 | 2.4 | 2.1.c, 2.2.d, 2.2.e |
| 14 | [Spanning tree](chapters/14-spanning-tree/chapter.md) | 07, 09, 10 | 2.5, 2.5.a, 2.5.b | 2.5, 2.5.a, 2.5.b |
| 15 | [STP protection](chapters/15-stp-protection/chapter.md) | 14 | 2.5.c, 2.5.d | 2.5.c, 2.5.d |
| 16 | [Layer 2 security](chapters/16-layer2-security/chapter.md) | 01, 04, 09, 15 | 5.7 | 4.7, 4.7.a, 4.7.b, 4.7.c, 4.7.d, 4.7.e |

## Routing

The routing table, static routes, IPv6, OSPF, first-hop redundancy.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 17 | [The routing table](chapters/17-routing-table/chapter.md) | 05, 11, 08 | 3.1, 3.1.a, 3.1.b, 3.1.c, 3.1.d, 3.1.e, 3.1.f, 3.1.g, 3.2, 3.2.a, 3.2.b, 3.2.c | 3.1 |
| 18 | [Static routing (IPv4)](chapters/18-static-routing-ipv4/chapter.md) | 17 | 3.3, 3.3.a, 3.3.b, 3.3.c, 3.3.d | 3.2, 3.2.a, 3.2.b, 3.2.c, 3.2.d |
| 19 | [IPv6 addressing](chapters/19-ipv6-addressing/chapter.md) | 04, 05, 17 | 1.8, 1.9, 1.9.a, 1.9.b, 1.9.c, 1.9.d | 1.4 |
| 20 | [Static routing (IPv6)](chapters/20-static-routing-ipv6/chapter.md) | 19, 18 | 3.3, 3.3.a, 3.3.b, 3.3.c, 3.3.d | 3.2, 3.2.a, 3.2.b, 3.2.c, 3.2.d |
| 21 | [OSPFv2](chapters/21-ospfv2/chapter.md) | 17, 18 | 3.4, 3.4.a, 3.4.b, 3.4.c, 3.4.d | 3.3, 3.3.a, 3.3.b, 3.3.c, 3.3.d |
| 22 | [OSPFv3](chapters/22-ospfv3/chapter.md) | 21, 19, 20 | — | 3.3, 3.3.a, 3.3.b, 3.3.c, 3.3.d |
| 23 | [HSRP and VRRP](chapters/23-fhrp-hsrp-vrrp/chapter.md) | 11, 15, 18, 19, 21 | 3.5 | 3.4 |

## Services

DHCP, DNS, NAT, time and logging, QoS, file management, client and toolkit troubleshooting.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 24 | [DHCP](chapters/24-dhcp/chapter.md) | 11, 18 | 4.3, 4.6 | 1.7 |
| 25 | [DNS](chapters/25-dns/chapter.md) | 06, 24, 19 | 4.3 | 4.4 |
| 26 | [NAT and PAT](chapters/26-nat-pat/chapter.md) | 18, 06 | 4.1 | 4.3 |
| 27 | [NTP, syslog and SNMP](chapters/27-ntp-syslog-snmp/chapter.md) | 08, 06, 26 | 4.2, 4.4, 4.5 | 5.4, 5.6 |
| 28 | [QoS](chapters/28-qos/chapter.md) | 06, 08, 10 | 4.7 | — |
| 29 | [Configuration and software files](chapters/29-file-management/chapter.md) | 08, 18 | 4.9 | 4.2 |
| 30 | [Client OS troubleshooting](chapters/30-client-os-troubleshooting/chapter.md) | 04, 19, 24, 25 | 1.10 | 1.6 |
| 31 | [Troubleshooting toolkit](chapters/31-troubleshooting-toolkit/chapter.md) | 18, 12, 06, 24, 25, 27, 30, 28 | 1.4, 4.5 | 2.4 |

## Security

Concepts, AAA, access lists, VPNs.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 32 | [Security concepts](chapters/32-security-concepts/chapter.md) | 01, 08, 16, 29 | 5.1, 5.2, 5.4 | — |
| 33 | [AAA with TACACS+ and RADIUS](chapters/33-aaa-tacacs-radius/chapter.md) | 08, 32, 31 | 5.8 | 4.1 |
| 34 | [Access control lists](chapters/34-acls/chapter.md) | 18, 06, 08, 26 | 5.6 | 4.6 |
| 35 | [VPNs & IPsec](chapters/35-vpns-ipsec/chapter.md) | 06, 18, 34, 26, 32 | 5.5 | 4.5 |

## Wireless

RF principles, architectures, security and WLAN configuration.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 36 | [Wireless principles](chapters/36-wireless-principles/chapter.md) | 01, 30 | 1.11, 1.11.a, 1.11.b, 1.11.c, 1.11.d | 1.5, 1.5.a, 1.5.b, 1.5.c, 1.5.d |
| 37 | [Wireless architectures](chapters/37-wireless-architecture/chapter.md) | 36, 10, 11, 13, 24, 25, 33 | 2.6, 2.7 | 2.2.b |
| 38 | [WLAN security](chapters/38-wireless-security-config/chapter.md) | 37, 28, 33 | 5.9, 5.10, 2.9 | 1.5.c |

## Virtualization, automation & AI

Hypervisors and containers, management approaches, APIs, Ansible/Terraform, AI in operations.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 39 | [Virtualization](chapters/39-virtualization/chapter.md) | 02, 10, 17, 14 | 1.12, 1.2.f | 1.2, 2.2.d |
| 40 | [Network management and SDN](chapters/40-network-management-and-sdn/chapter.md) | 08, 21, 39, 34, 27, 31 | 6.1, 6.2, 6.3, 6.3.a, 6.3.b | 5.3 |
| 41 | [REST APIs and JSON](chapters/41-rest-apis-json/chapter.md) | 06, 40 | 6.5, 6.7 | — |
| 42 | [Ansible & Terraform](chapters/42-ansible-terraform/chapter.md) | 08, 40, 41 | 6.6 | 5.5 |
| 43 | [AI in network operations](chapters/43-ai-in-network-operations/chapter.md) | 40, 27, 31 | 6.4 | 5.1, 5.2 |

## Capstone

Build the branch network, break it, fix it, and get exam-ready.

| Chapter | Topic | Prerequisites | v1.1 objectives | v2.0 objectives |
|---|---|---|---|---|
| 44 | [Capstone: the branch network](chapters/44-capstone-branch-network/chapter.md) | 21, 26, 34, 24, 13, 15, 27, 08, 25, 31 | 1.6, 2.1, 2.1.c, 2.2, 2.4, 2.5, 3.3, 3.4, 4.2, 4.3, 4.5, 4.6, 4.8, 5.3, 5.6 | 1.7, 2.1, 2.1.b, 2.1.c, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.3, 4.6, 5.6 |
| 45 | [Exam readiness](chapters/45-exam-readiness/chapter.md) | 44, 38, 42, 43 | — | — |

## Teaching ownership

- 00 teaches setup, the study tools and first use of IOS. 08 builds on that workflow to teach local accounts, management access and SSH. Full AAA belongs to 33; access-list policy belongs to 34.
- 09 establishes VLAN membership, voice/data classification and endpoint power. 10 teaches trunks; 11 teaches routing between VLANs; 13 teaches aggregation; 14–15 teach loop prevention and protection; 16 teaches access-layer security.
- 12 establishes discovery and neighbor evidence. 31 combines discovery with routing, addressing and service checks in a wider troubleshooting workflow.
- 16 contains the small DHCP/ARP/RA preview needed to understand its controls. Full IPv6 and DHCP configuration remains in 19 and 24.
- 17 teaches route interpretation before protocol configuration. 18–23 build the routing methods. Advanced multi-area detail is separated from the CCNA core.
- 26 explains the small ACL selector needed for NAT. 34 owns full ACL policy and wildcard practice. Optional QoS configuration in 28 and tunnel implementation in 35 follow the relevant later preparation.
- 36 introduces wireless principles; 37 owns architecture and deployment modes; 38 owns WLAN security and configuration. Chapter 36 uses a basic radio/SSID exercise, 37 examines controller paths and deployment modes, and 38 owns the complete WPA2-Personal GUI build.
- 39 introduces virtualization mechanisms before management and automation in 40–43. Product-specific fabric detail is context, not the organizing principle.
- 44 integrates the skills in a capstone. 45 points back to the reviewed teaching chapters instead of maintaining a second, easily outdated table of facts.

For content conventions and stable section IDs, see [AUTHORING.md](AUTHORING.md).
