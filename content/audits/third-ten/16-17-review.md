# Chapters 16–17: teaching and technical review

Reviewed 20 September 2026. Rewrote all twelve lesson, lab, question, flashcard, command-drill and troubleshooting-ticket assets. Practice questions are original teaching material, not recalled exam items.

## 16 — Layer 2 security

The sequence now moves from the purpose of each access-layer control to its configuration, its evidence and its failure modes. Port security, snooping, DAI, storm control and RA guard are treated as distinct policies. RA guard has its own section instead of being compressed into storm control. All original teaching-section identities are retained; the dedicated RA guard section is new.

Corrections carried through every bank:

- MAC-learning resource pressure can increase unknown-unicast flooding within the applicable forwarding scope; it does not turn every frame into a broadcast to every physical port.
- Port security limits source addresses rather than authenticating people. Sticky learning writes running configuration, and saved configuration controls persistence. Phone/PC limits follow actual address/VLAN behavior instead of an unconditional maximum-two template.
- Violation modes are distinguished without fixed counter-value or LED promises. Recovery follows correction of the cause. Automatic recovery must be enabled for the relevant cause and cannot fix a persistent mismatch.
- DHCP server trust follows reply ingress on each switch. The former instruction to trust every switch trunk is removed. A downstream switch connection can remain untrusted at the upstream switch while the downstream switch trusts replies arriving from upstream.
- Option 82 insertion, relay-information trust and giaddr have separate meanings. An Option 82 repair now requires explicit evidence and a stated policy; it is not inferred from every failed lease. The simple lab deliberately disables insertion rather than claiming that every IOS server requires that choice.
- Bindings require observed DHCP exchanges. A prior lease or a configuration save does not establish a current or persistent snooping binding database.
- DAI trust is independent of snooping trust. Static hosts receive exact ARP ACL permits. The application keyword `static` makes implicit denial final; it is not required merely because an endpoint has a static IPv4 address.
- Optional ARP validation and rate limits are scoped to the documented platform. A rejected claim or exceeded rate is not, by itself, proof of malicious traffic.
- Storm control is taught as suppression with rising/falling thresholds, not a promise of precisely trimming only the excess percentage. No loop or traffic flood is needed for the worksheet.
- RA guard requires the correct device role and interface attachment. The router-role/Router Solicitation forwarding caveat is included. Previously learned IPv6 host state need not disappear as soon as subsequent advertisements are blocked.

The twelve-step lab establishes a working LAN, tests a sticky violation, restores the authorized endpoint, learns snooping bindings, separates missing server trust from its repair, observes the static-printer DAI exception, verifies an ARP ACL, interprets storm thresholds, and performs a separate supported-platform RA guard exercise. It gives addresses, ports, actual-MAC substitution, fresh-lease/ARP requirements, restoration and saving instructions.

Independent review read all six files. Its three lab-completeness findings were corrected: the challenge now includes an answer key and explicit SW2 uplink, the RA guard-off capture supplies a reproducible transmission baseline, and the hardware extension checks the active IPv6-capable SDM resources before configuration. The 9300-specific Access template and reload boundary are sourced explicitly.

## 17 — The routing table

The lesson now separates source selection, destination lookup and successful forwarding. Its headings follow that distinction: RIB/FIB → route fields → source codes → AD → protocol metrics/ECMP → longest prefix match → default and next-hop resolution → verification. All old teaching-section IDs survive the heading changes.

Corrections carried through every bank:

- The RIB is important evidence, not the entire forwarding system. CEF/FIB and adjacency are introduced only at the depth needed to understand why an installed route can still fail.
- AD compares eligible sources for the same prefix and length. Protocol metrics use different units. Longest prefix match applies independently among installed prefixes, including more-specific discard routes.
- Defaults are distinguished from configured AD overrides. Advanced and historical AD memorization is reduced; the former fixed DHCP-default distance claim is removed.
- Normal connected/local entries are explained with interface state and /32/platform exceptions. Display group headings do not create additional routes. Sample subnet/mask counts agree with their entries.
- Next hops may require recursion, and directly connected destination resolution differs from resolution of a next-hop router. The next-hop address does not replace the remote destination IP in the packet.
- OSPF cost is not an unconditional hop count. ECMP does not guarantee four paths, per-packet alternation, equal byte sharing or doubled bandwidth for one transfer.
- A documented IOS default-lookup example is used as a scoped interpretation case, not a universal command-output guarantee. Full-table and CEF evidence are distinguished from end-to-end tests.
- A selected Null0 route does not retry a less-specific working route. Tickets supply enough exact-prefix and next-hop evidence to justify a repair instead of inferring it from an unrelated healthy adjacency.

The ten-step lab replaces premature OSPF construction with a supplied two-router static baseline, including both return routes and a real loopback target for the default test. Overlapping dynamic prefixes, source competition and ECMP use explicitly authored worksheets. The more-specific discard fault and its repair are separate steps. The final challenge includes the request and reply addresses and a checked answer.

Independent review read all six files and checked every answer and distractor, topology, command mode and address range. Its wording correction was applied to the AD worksheet: a backup can already be eligible while it is not selected. Selection follows withdrawal of the more-preferred candidates; eligibility is not created merely by that withdrawal.

## Primary sources and scope

| Subject | Source |
|---|---|
| Required depth and track differences | [Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf), [Cisco v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| Port-security modes, defaults, persistence and restrictions | [Catalyst 9300 port security, 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/port_security.html) |
| Snooping trust, bindings and relay information | [Catalyst 9300 DHCP, 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/ip/b_1712_ip_9300_cg/configuring_dhcp.html) |
| DAI, ACL fallback and optional validation | [Catalyst 9300 DAI, 17.12](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_dynamic_arp_inspection.html) |
| Storm thresholds and platform behavior | [Catalyst 9300 traffic control](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_port_based_traffic_control.html), [3560 traffic-control context](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swtrafc.html) |
| RA roles, attachment and hardware preparation | [Catalyst 9300 IPv6 First Hop Security](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_ipv6_first_hop_security.html), [SDM templates](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/configuring_sdm_templates.html) |
| Route sources, AD and longest match | [Cisco route selection](https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html), [administrative distance](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html) |
| Routing fields and verification | [Cisco route command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/command/iri-cr-book.html), [show ip route field descriptions](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_bgp/command/irg-cr-book/bgp-s1.html) |
| Forwarding versus adjacency | [Cisco CEF behavior](https://www.cisco.com/c/en/us/support/docs/ip/express-forwarding-cef/211377-Understand-and-Troubleshoot-CEF-on-IOS-X.html), [CEF command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipswitch/command/isw-cr-book/isw-s1.html) |
| Scoped default-lookup display example | [Cisco Case Study 3](https://www.cisco.com/c/en/us/support/docs/ip/ip-routed-protocols/47121-pbr-cmds-ce.html); the page's policy-routing configuration is not taught here |

## Assessment identities and practical limits

Chapter 16 retains the underlying topic of every prior assessment ID and adds q16 plus d13–d14. Chapter 17 retains same-topic IDs except retired `routing-table-c19`, which asked for a universal maximum-path default; new `routing-table-c21` teaches ECMP throughput limits. Its c06 retains the AD-255 concept while dropping the unrelated fixed DHCP-default value. Chapter 17 adds q16 and d12.

The labs are substantially revised. Their step identifiers are positional in the existing app, so earlier checkmarks do not certify execution of the rewritten exercises. Learners should repeat a revised lab from its stated baseline. No progress data was cleared or migrated by this audit.

No Packet Tracer, CML or physical-device execution was performed in this pass. The app rendering/integrity checks validate the teaching assets and their behavior in the app; they cannot certify hardware behavior. The labs distinguish authored expected observations, worksheets and features requiring a supporting platform.
