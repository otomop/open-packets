# Chapters 04–05 content review

Reviewed on 19 September 2026. Scope: all six content files in `04-ipv4-addressing` and `05-subnetting-vlsm`. No application, styling, progress-storage, or other chapter files were changed in this work.

## Result and teaching changes

Both chapters have been rewritten as a connected beginner lesson, guided lab, assessment bank, flashcard set, command-drill set, and troubleshooting exercise. Chapter 04 develops binary place values, bitwise AND, prefix/mask conversion, subnet boundaries, usable capacity, and the local/remote decision before asking the learner to configure devices. Chapter 05 applies those calculations to equal-size subnet counts, VLSM allocation, growth, summary boundaries, private addressing, and address-plan verification.

The current objective claims remain narrow: chapter 04 teaches v1.1 1.6 and v2.0 1.3; chapter 05 teaches v1.1 1.6/1.7 and v2.0 1.3. Summarization is supporting prefix work, not a claim to teach BGP or a complete routing-protocol objective. The exam versions were checked against the official [v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf); the course's transition remains v1.1 through 2 February 2027 and v2.0 from 3 February 2027.

Material corrections include:

- The Operations expansion originally paired PC `10.44.9.140/25` with gateway `10.44.9.1/25`, which are in different /25s. The revised lab uses PC `10.44.9.10/25`, gateway `10.44.9.1`, and the same /25 mask throughout the growth step, its verification, and the lesson's explanation.
- A wrong mask changes the host's local/remote decision; it does not guarantee one particular ping failure. The lesson and assessments now state the relevant route and proxy-ARP conditions instead of treating success as proof of a correct mask.
- A /31 has two endpoint addresses on a supported point-to-point link. A /32 identifies one address. The old implication that every loopback must use /32 has been removed.
- Modern classless subnet counts use all `2^s` subnet numbers. Historical class network counts and Class E trivia have been removed from required memorization. Brief historical default-mask terminology remains only to explain why the stated mask takes precedence.
- Private space is distinguished from all other non-public and special-purpose space. An address outside RFC 1918 is not automatically usable public space. Link-local addressing suggests a DHCP investigation; it does not establish a unique failure cause.
- Overlapping private addressing creates ambiguous address meaning; it does not mean a router can never have multiple paths to the same prefix. Connected `C` prefixes and router-owned `L` /32 routes are explained without attributing route-source preference to longest-prefix matching.
- Capacity requirements now say whether gateways are included. VLSM plans check capacity, alignment, parent containment, and overlap, and record the exact leftover intervals. Summaries distinguish exact coverage from a larger containing block.

## Source evidence

All teaching prose and examples are original. Sources below support the rules; address calculations were checked separately. The applicable URLs also appear in the lesson frontmatter.

| Claim or procedure | Primary evidence used |
|---|---|
| IPv4 binary representation, subnet masks, network calculation, subnet sizing, VLSM and CIDR | [Cisco: Configure IP Addresses and Unique Subnets](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html). Its historical classful material was not used to override classless addressing. |
| Host local/remote decision, mask use, directly connected gateway | [RFC 1122 §3.3.1.1](https://www.rfc-editor.org/rfc/rfc1122.html#section-3.3.1.1). Basic host examples explicitly assume one connection and no added routes. |
| Prefix lengths, host routes, default prefix, and aggregate coverage | [RFC 4632](https://www.rfc-editor.org/rfc/rfc4632.html). The lesson limits aggregation to address-range reasoning. |
| Both addresses of a point-to-point /31 are endpoint addresses | [RFC 3021 §2.1](https://www.rfc-editor.org/rfc/rfc3021.html). No claim of multi-device LAN use or universal simulator support is made. |
| IOS IPv4 interface configuration and /31 behavior | [Cisco: Configuring IPv4 Addresses](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/ip-addressing/ip-addressing/m_config-ipv4-addr-0.html). Required labs use ordinary /26, /27, and /25 LANs. |
| Connected subnet versus local /32 route | [Cisco: Local Host Routes Installed in the Routing Table](https://www.cisco.com/c/en/us/support/docs/ip/ip-routing/116264-technote-ios-00.html). Additional `L` entries are qualified by image support. |
| Modern use of subnet zero and the all-ones subnet | [Cisco: Configure Subnet Zero and All-Ones Subnet](https://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13711-40.html). Students use the modern count, without memorizing old release cutoffs. |
| Three private blocks and internal reuse/routing | [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918.html). Bounds are stated in full, including the end of 172.16/12. |
| Private versus other special-purpose designations | [IANA IPv4 Special-Purpose Address Registry](https://www.iana.org/assignments/iana-ipv4-special-registry/). The lesson explicitly presents a practical subset rather than an exhaustive public-address test. |
| Link-local scope and addressing behavior | [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html). No automatic inference of a specific DHCP fault is made. |
| Shared address space 100.64/10 is distinct from RFC 1918 | [RFC 6598](https://www.rfc-editor.org/rfc/rfc6598.html). |
| Documentation blocks are not normal public deployment addresses | [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737.html). |
| Conditional proxy-ARP response and use of the router's MAC address | [Cisco: Understand Proxy ARP](https://www.cisco.com/c/en/us/support/docs/ip/dynamic-address-allocation-resolution/13718-5.html). Explanation depends on receiving-interface settings and a route through another interface; the required lab no longer depends on simulated proxy ARP. |

## Independent calculation checks

A Python standard-library `ipaddress` review passed **570 assertions**. It checked 23 explicitly expected worked network/broadcast cases, four complete VLSM partitions, masks and capacities, parent/child subnet counts, summary coverage, normal and faulty gateway relationships, private-range membership, and /31 and /32 endpoint handling. In addition, all **121 distinct fully specified address/prefix strings** present across the twelve files were cross-checked against an independent integer calculation: construct the 32-bit mask, AND it with the address, then OR in the host-bit mask for the upper boundary. This included deliberately incorrect or nonaligned answer options; those remain deliberate distractors, not valid allocations.

Representative checks:

| Input or plan | Independently verified result |
|---|---|
| `173 AND 192`; binary `11010010` | `128`; decimal `210` |
| `192.168.44.173/26` | Network `.128`, broadcast `.191`, usable `.129–.190`, 62 usable |
| `172.20.77.210/20` | `172.20.64.0–172.20.79.255`, 4,094 usable |
| `10.203.15.77/13` | `10.200.0.0–10.207.255.255` |
| `10.7.19.77/21` challenge | `10.7.16.0–10.7.23.255`, 2,046 usable; `10.7.24.1` is the next /21's first usable address |
| `10.0.0.0/31`; `10.255.0.1/32` | Endpoint lists `.0` and `.1`; the single address `10.255.0.1` |
| /16 divided into /23; /24 into /28 | 128 subnets with 510 usable each; 16 subnets with 14 usable each |
| 120/55/25 plus two two-endpoint links in 192.168.40/24 | `.0/25`, `.128/26`, `.192/27`, `.224/30`, `.228/30`; consumes 232, leaves `.232/29` and `.240/28` |
| 100/60/10 plus a two-endpoint link in 172.16.40/24 | `.0/25`, `.128/26`, `.192/28`, `.208/30`; aligned, sized, contained, disjoint |
| Initial branch in 10.44.8/24 | `.0/25`, `.128/26`, `.192/27`, reserved `.224/30`; consumes 228, leaves 28 |
| Independent challenge in 192.168.72/24 | `.0/26`, `.64/27`, `.96/28`, `.112/29`, `.120/30`; consumes 124, leaves `.124/30` and `.128/25` |
| Two 100-address LANs and one 50-address LAN | `128 + 128 + 64 = 320`; cannot fit in /24 |
| 10.44.8/24 through 10.44.11/24 | Exact `10.44.8.0/22` |
| 10.44.9/24 through 10.44.12/24 | Smallest single cover `10.44.8.0/21`; exact cover uses `.9/24`, `.10/23`, `.12/24` |
| Proposed Operations `10.44.8.128/25` | Overlaps Devices `10.44.8.192/27` |
| Growth PC `10.44.9.140/25`, then `10.44.9.10/25` | Gateway `10.44.9.1` is outside the former and a valid host in the latter's subnet |

All eight chapter-04 practice rows and all ten chapter-05 drills were covered. Every question's selected answer and every distractor explanation were also read for consistency; the mathematics alone does not validate a scenario's assumptions, so those were reviewed separately. The final short paragraph distinguishing `0.0.0.0` from `0.0.0.0/0` introduces no new address range beyond /0; it explains the previously retained comparison card.

## Lab and output review

Each lab names the Cisco 2911, Catalyst 2960, and PC-PT models; gives all links, actual port names, cable types, and PC/gateway/mask tables; shows command modes; separates configuration, verification, fault observation, recovery, and saving; and ends with an independent challenge and answer key. The /30 reservation in chapter 05 is explicitly on paper and is not promised as a connected route.

Packet Tracer was **not available for execution**. Both labs say so. Output is explicitly identified as representative, abbreviated IOS-style output, not a captured run. Exact simulator error text, PC ARP columns, TTLs, and guaranteed reply counts are not claimed. Detailed command filters have a full `show running-config` or `show ip route` fallback where needed. An actual simulator run remains a separate verification opportunity; the current review establishes the address plan and documented command sequence, not observed emulator behavior.

The prior `VERIFY` comments were resolved as follows:

- Exact hexadecimal noncontiguous-mask error wording: removed the unverified output, retained the mask rule and a clear binary explanation. The lab checks rejection and retained state without depending on exact error wording.
- Packet Tracer PC `arp -a` column layout: removed the unverified capture. The required fault is an unused but valid local gateway, which can be tested with the documented PC settings and ping workflow.
- Whether a particular Packet Tracer image prints a proxy-ARP line or accepts `no ip proxy-arp`: removed the requirement to run those features. A paper local/remote exercise and fully specified diagnostic questions teach the relevant reasoning. Cisco's documented proxy-ARP behavior supports the narrative; no simulator feature is assumed.

## Assessment IDs and completion checks

Chapter IDs, all eight lesson H2 headings in each chapter, and numbered lab-step identities are preserved. Existing assessment IDs remain when the knowledge assessed is the same, including clearer wording, corrected math, or more precise assumptions. Unrelated replacements have new IDs so stored mastery is not inherited.

| Retired ID | New ID | Reason |
|---|---|---|
| `ipv4-addressing-q11` | `ipv4-addressing-q17` | Replaced historical class recall with bitwise AND application |
| `ipv4-addressing-c11` | `ipv4-addressing-c21` | Replaced historical class recall with the AND rule |
| `ipv4-addressing-c12` | `ipv4-addressing-c22` | Replaced historical class recall with remote-destination ARP reasoning |
| `ipv4-addressing-c13` | `ipv4-addressing-c23` | Replaced historical class recall with gateway-address selection |
| `ipv4-addressing-c14` | `ipv4-addressing-c24` | Replaced multicast/reserved class trivia with gateway-inclusive capacity |
| `ipv4-addressing-d07` | `ipv4-addressing-d12` | Replaced proxy-ARP configuration drill with saving a verified configuration |
| `ipv4-addressing-d09` | `ipv4-addressing-d13` | Replaced secondary-address configuration drill with a reachability test |
| `subnetting-vlsm-d11` | `subnetting-vlsm-d12` | Replaced proxy-ARP configuration drill with saving a verified configuration |

Chapter 05's existing `q17` and `c21` were already present at the review baseline and remain unchanged in identity; no other question/card/ticket IDs were retired there. The retained `subnetting-vlsm-c16` still tests loopback and multicast recognition, with unrelated reserved-range detail trimmed.

Each chapter has **16 questions, 20 cards, 11 command drills, and 2 tickets**. Each question bank has three multi-answer questions; chapter 04 has seven exhibits and chapter 05 has five. Single-answer correct positions are balanced 4/3/3/3 across the four positions. Final prose is approximately 1,878 words for chapter 04 and 1,826 words for chapter 05, excluding tables, lists, code, and diagrams; the longest prose paragraphs are 69 and 79 words.

The content validator completed with **zero errors and no chapter-04 or chapter-05 warnings**. Global warnings in other chapters are outside this review's scope and should not be interpreted as resolved by this note.
