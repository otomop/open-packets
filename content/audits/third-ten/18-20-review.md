# Chapters 18–20 content review

Reviewed 20 September 2026. Scope: every lesson, lab, question, flashcard, command drill and troubleshooting ticket in:

- `content/chapters/18-static-routing-ipv4/`
- `content/chapters/19-ipv6-addressing/`
- `content/chapters/20-static-routing-ipv6/`

This report covers an original content rewrite, primary-source review, structural checks, independent address calculations and actual React server rendering. It does not claim Packet Tracer, CML or physical-router execution.

## Scope and progression

Chapter numbers and IDs remain unchanged. The original H2 identities are retained through explicit `sectionIds` maps while display headings use direct instructional wording. All prerequisites refer to earlier chapters: 18 follows routing-table; 19 follows ipv4-addressing; 20 follows ipv6-addressing and static-routing-ipv4.

The official Cisco v1.1 blueprint remains the current course baseline through 2 February 2027; the announced v2.0 track begins 3 February. This review directly inspected both official topic PDFs, using root's separately verified transition-date baseline.

- [CCNA v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf): 18 and 20 jointly teach IPv4/IPv6 static network, default, host and floating routes under 3.3 and leaves a–d. Chapter 19 teaches IPv6 addressing/prefix configuration and types under 1.8 and 1.9 a–d.
- [CCNA v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf): 18 and 20 teach 3.2 and leaves a–d; 19 directly teaches address-configuration, assignment and prefix-sizing troubleshooting under 1.4.

Static syntax, installed-route interpretation and return-path diagnosis are core. ARP/ND, interface state, route resolution and source-aware testing are necessary supporting explanations. Advanced tracking configuration, recursive-default overrides, redistribution, broad administrative-distance memorization and router-as-SLAAC-client configuration are intentionally outside these chapters' guided configuration scope. They are either removed or briefly identified without assigning unsupported coverage.

## Material corrections

### Chapter 18

Replaced most prose with a stepwise distinction between configured intent, selected routing entries and tested forwarding. Removed claims that static routes never change operationally or require every next hop to be directly connected. The simple examples intentionally use adjacent next hops; recursion is explained without requiring an advanced design.

Ethernet interface-only routing now explains per-destination ARP and the risk of depending on proxy ARP, without claiming proxy ARP always rescues the route. Fully specified routes still require Layer 2 resolution. Route removal recommends reproducing the configured identifying values without the unsupported assertion that IOS always requires an identical distance field in every no-form.

The lab now provides switches, exact cables, addresses and local tests. The previous PC-to-router straight-through ambiguity is eliminated by using PC–switch–router links. Primary/backup candidates use both interface and next hop. Fault observation and recovery are separate steps. A real temporary R2 loopback supplies the default-route destination; the old nonexistent-destination test and universal default-specific show-command claim are removed.

Return-path diagnosis records the source-prefix distinction. Failed pings are not treated as unique evidence without the supplied topology and route table. Remote failures behind a switch are distinguished from locally detected link failure. Neither convergence time nor exact lost-ping count is promised.

### Chapter 19

Rebuilt notation teaching around valid representation versus RFC 5952 canonical spelling. A single zero group can be compressed in valid IPv6 syntax but is not compressed canonically. Trailing zeros remain significant. Prefix examples explicitly calculate /56 and /60 boundaries; an independent peer caught the phrase “eight retained bits” for the c7f2→c700 mistake, now corrected to four.

Removed claims that all identifiers use EUI-64, all subnets use /64, or every mathematical address combination is an ordinary assignable host address. Explained documentation space, ULA routing intent, reserved link-local block versus conforming address format, and anycast path selection without a geographic-nearest guarantee.

Modified EUI-64 uses XOR 02, not unconditional addition. The inserted bytes span the second and third identifier groups. The lab calculates from the actual operational MAC and does not invent a device-specific result.

RA header M/O flags are separated from prefix-option A/L flags. Address formation, on-link information, default-router discovery and DNS configuration are different jobs. SLAAC does not require DHCPv6 or force a MAC-derived identifier; DNS may use DHCPv6, RA options or manual configuration. Neighbor Solicitation can be multicast or unicast depending on purpose; stale is not automatically broken; an incomplete entry is not alone proof of permanent failure.

The lab uses one router and two directly connected LANs, removing the unnecessary router-SLAAC-client/default-route dependency. PC command blocks have no copyable shell prompt. A new temporary secondary address creates a fresh neighbor-resolution target rather than pretending that clearing only the router cache clears a PC cache. Static PC settings isolate the forwarding fault from retained RA lifetimes. The unsupported-Automatic fallback now explicitly supplies the address to substitute wherever PC-B-AUTO appears.

### Chapter 20

Applied the same installation/forwarding distinction to IPv6. Correctly scoped link-local next hops include a local exit interface; an installed route can still reference a nonexistent neighbor on that link. The peer's interface display establishes its address; a global-address ping is not claimed to automatically reveal all link-local identities.

Removed absolute claims that IPv6 can never have proxy neighbor behavior, that every RA is multicast, that every manual host gateway must be link-local, or that all non-reachable neighbor states mean the same thing. The normal guided Ethernet design uses an explicit neighbor and does not require proxy ND. Default-based recursive resolution is qualified using current IOS XE documentation.

The new self-contained lab uses the same two-router, two-link physical layout as 18. R2 has different link-local values on its two transit links, making the wrong-scope fault observable. A distance-200 /128 with the wrong next-hop/interface pair overrides a working /64 for one PC; observation and correction occur separately. A real temporary /128 loopback supplies the default test. All temporary routes and loopbacks are removed before saving.

## Claim-to-source evidence

All sources below were opened or located through the official publisher on the review date. Lesson frontmatter contains the relevant references.

| Claims reviewed | Primary evidence |
|---|---|
| IPv4 static syntax, route eligibility, defaults and ordinary distances | [Cisco Basic IP Routing](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/configuration/15-mt/iri-15-mt-book/iri-iprouting.html) |
| Ethernet interface-only ARP behavior and deterministic interface/next-hop choice | [Cisco static next-hop guidance](https://www.cisco.com/c/en/us/support/docs/dial-access/floating-static-route/118263-technote-nexthop-00.html) |
| Administrative distance versus prefix-based forwarding | [Cisco administrative distance](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html), [Cisco route selection](https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html) |
| Router ping source and extended-ping return-path testing | [Cisco extended ping](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html) |
| IPv6 static forms, fully specified neighbor, floating route and default-recursion qualification | [Cisco IOS XE 17 IPv6 static routing](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_ip6-route-static-xe.html), [IPv6 route command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6/command/ipv6-cr-book/ipv6-i4.html) |
| Link-local scope and interactive output-interface selection | [Cisco link-local address](https://www.cisco.com/c/en/us/support/docs/ip/ip-version-6-ipv6/113328-ipv6-lla.html) |
| IPv6 interface commands, EUI-64 and forwarding prerequisites | [Cisco IPv6 basic connectivity](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6_basic/configuration/15-mt/ip6b-15-mt-book/ip6-add-basic-conn.html) |
| Address types, special addresses, scope and solicited-node construction | [RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.html) |
| Canonical spelling versus valid alternate text | [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952) |
| RA, prefix flags, NS/NA and neighbor state interpretation | [RFC 4861](https://www.rfc-editor.org/info/rfc4861/) |
| SLAAC and duplicate-address detection | [RFC 4862](https://www.rfc-editor.org/rfc/rfc4862.html) |
| On-link information is distinct from address assignment | [RFC 5942](https://www.rfc-editor.org/info/rfc5942/) |
| ULA generation and routing intent | [RFC 4193](https://www.rfc-editor.org/rfc/rfc4193.html) |
| MAC-embedded identifiers are not the required modern default | [RFC 8064](https://www.rfc-editor.org/rfc/rfc8064.html) |
| Appropriate /127 router links are valid | [RFC 6164](https://www.rfc-editor.org/rfc/rfc6164.html) |
| Documentation address reservation | [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849.html) |
| DNS information can be carried in RA options | [RFC 8106](https://www.rfc-editor.org/rfc/rfc8106.html) |

Old IOS references support syntax/mechanisms where applicable, not a claim that every older feature/default is a universal modern behavior. The current IOS XE static guide supplies the recursive-default qualification. Numerical examples and topology-specific deductions are original and independently checked.

## Stable and retired assessment identities

All existing question IDs q01–q15 retain their original assessed topic, with wording, exhibits and explanations corrected. Each chapter adds q16 for a real gap: 18 remote-failure detection limits, 19 non-EUI automatic identifiers, 20 scoped neighbor verification.

- 18: retired `static-routing-ipv4-c14`, the broad unrelated-protocol distance table. Added `static-routing-ipv4-c21` for configured-versus-installed route behavior.
- 19: retired `ipv6-addressing-c07` (extra routing/DHCP multicast group trivia), `-c15` (DHCPv6 port/group recall), and `-c18` (router SLAAC-client command). Added `-c21` documentation space, `-c22` separate on-link information, and `-c23` duplicate-address detection.
- 19: retired `ipv6-addressing-d06` (router autoconfig default), `-d07` (managed flag configuration) and `-d08` (other flag configuration). Added `-d13` operational-MAC inspection, `-d14` targeted temporary-address removal, and `-d15` controlled forwarding fault.
- 20: all card, drill and ticket IDs retain their concepts. The lab topology is simpler, but assessment scenarios state their own interface/address facts.

No stored learning history was cleared. Retired IDs are not reassigned to unrelated concepts. Lab progress IDs remain numbered step identities, but the procedures were materially rebuilt and expanded: a checkbox from an older eight-step exercise does not certify completion of the new lab.

## Verification and limits

| Chapter | Lesson word count including examples | Lab steps | Questions | Multi | Exhibits | Cards | Drills | Tickets |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 18 | 2,086 | 12 | 16 | 2 | 7 | 20 | 12 | 2 |
| 19 | 2,173 | 10 | 16 | 2 | 4 | 20 | 12 | 2 |
| 20 | 2,124 | 14 | 16 | 2 | 8 | 20 | 12 | 2 |

Each chapter's single-answer positions are balanced 4/4/3/3. Every incorrect question option has an explanation. All banks were read for technical consistency; all six tickets include evidence supporting the answer and a targeted repair.

- Full content validator: zero errors; zero warnings in 18–20 after removing answer-length cues. Other chapters' warnings are outside this report.
- Targeted actual React rendering: 742 lesson, lab and bank text fragments passed, with no NaN, unresolved VERIFY/TODO/TBD markers or command placeholders interpreted as HTML.
- Original H2 identity sets and order match the saved third-ten baseline. All prerequisites resolve to earlier chapters.
- Counts, answer indices, multi-answer minimums, exhibits, sequential lab numbers and expected-observation blocks checked.
- Python standard-library `ipaddress` independently verified compression, expansion, /56 and /60 subnet endpoints/counts, IPv4 /30 and /25 ranges, EUI-64 byte manipulation and solicited-node multicast results.
- Independent peer read covered all 18 files. The retained-bit wording and unsupported-Automatic substitution were fixed. No remaining material route, answer or lab-sequencing issue was reported.
- No application code, CSS, colors, other chapters, storage reset, deployment or full build was changed or performed by this review.

Manual simulator validation remains necessary to confirm a particular Packet Tracer version's command support, link-local ping prompt, duplicate/discovery simulation, neighbor-state presentation and failover observations. The lessons and labs label representative output and state concrete fallbacks rather than claiming those runs occurred.
