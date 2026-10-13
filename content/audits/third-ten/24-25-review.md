# Chapters 24–25: DHCP and DNS review

Reviewed 20 September 2026. Scope: every lesson, guided lab, question and wrong-option explanation, flashcard, command drill, and troubleshooting ticket in `24-dhcp` and `25-dns`. No application, design, global course configuration, or other chapter was edited.

## Blueprint scope and progression

The [Cisco v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) include 4.3, explaining DHCP and DNS roles, and 4.6, configuring/verifying DHCP client and relay. The [Cisco v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) include 1.7, troubleshooting DHCPv4 client/server/relay using IOS, and 4.4, diagnosing DNS A, AAAA, CNAME, MX, NS, and PTR records. These verbs were checked against the primary PDFs and the local blueprint. The course's existing transition remains v1.1 through 2 February 2027, v2.0 from 3 February 2027.

DHCP teaches server configuration to support a complete v1 client/relay lab as well as the explicit v2 server troubleshooting requirement. DNS teaches practical record diagnosis and a router's DNS client; it does not pretend that the blueprint requires construction of a production recursive resolver. Chapter numbers, identities, and part placement remain unchanged. DHCP prerequisites are inter-VLAN routing (11) and IPv4 static routing (18); DNS prerequisites are TCP/UDP (6) and DHCP (24). All are earlier chapters. Chapter 16 owns DHCP snooping and its trust policy; chapter 24 explains the protocol fields needed to understand that policy without duplicating the security lab.

The lessons have eight and seven teaching H2 sections respectively, plus their existing introduction identity. Frontmatter maps renamed headings to their previous IDs. Loader comparison confirms every previous lesson section ID survives in its previous sequence. Prose counts excluding code, tables, headings, and lists are approximately 1,799 words for DHCP and 1,955 for DNS; the worked tables, figures, configurations, and labs provide additional teaching.

## DHCP changes

- Replaced universal Offer/ACK broadcast wording with state- and field-dependent delivery. Initial Discover/selecting Request, renewal unicast, rebinding broadcast, giaddr, ciaddr, and the BROADCAST flag are distinguished.
- Explained T1/T2 as defaults unless the server supplies valid alternate values. Eight-hour and twelve-hour calculations are explicit; expiry is distinguished from a failed renewal attempt.
- Corrected the interpretation of IPv4 link-local fallback. A 169.254 address is not proof of a missing Discover/Offer or one unique cause.
- Corrected the assumption that every existing client must fail its next renewal when a helper is misplaced. A valid lease can continue working, and unicast renewal may traverse normal routing even while new-client broadcast acquisition fails.
- Separated pool selection, exclusions, bindings, conflicts, options, client identity, and return routing. Removed fixed first-address allocation claims and universal MAC-derived client-identifier assumptions. Default-route distance 254 is scoped to the referenced IOS behavior and interpreted from an explicit route exhibit.
- Corrected the relay source URL to the actual `config-dhcp-relay-agent.html` page. Explained giaddr versus Option 82 and distinguished switch snooping trust, router relay-information trust, and a route to giaddr.
- Rebuilt the lab with explicit 2911/2960 models, ports, straight-through cables, access VLANs, addressing, an actual DNS service, complete modes, and a return route. Three eligible addresses serve PC-A, R3, and PC-B; a fresh PC-C then demonstrates genuine exhaustion.
- Expanded the lab from eight to ten steps so incorrect-helper observation, helper restoration, capacity-failure observation, and capacity restoration are separate. Former steps 7–8 are therefore materially resequenced; readers with prior lab checkmarks should redo the changed experiment sequence. No stored progress was altered.
- Replaced destructive clearing of healthy leases with removal of one deliberate upper exclusion. The independent challenge adds a new relay subnet and a ten-address range while preserving the original pool.

## DNS changes

- Clarified stub, recursive, authoritative, and caching roles. A root→TLD→authority walkthrough states its no-cache/no-forwarder assumptions. Removed root-server-count and label-size trivia from mandatory teaching.
- Covered all six explicit v2 record types through dependencies and failure evidence. Added a required paper diagnosis for AAAA, MX, NS delegation, and PTR where simulator functionality is uncertain; A and CNAME also have hands-on and explicit fallback paths.
- Corrected CNAME and MX wording: a CNAME can point through another alias, but requested address resolution must complete; an MX exchanger hostname must not itself be a CNAME alias. A record's existence does not automatically supply AAAA or PTR data.
- Corrected negative-response interpretation. NXDOMAIN can be cached; completed NODATA must be distinguished from an empty-answer referral; SERVFAIL does not prove one upstream fault. Negative-cache lifetime depends on the smaller SOA TTL/MINIMUM value, not MINIMUM alone.
- Removed the claim that every IXFR must use TCP. The lesson now teaches UDP/TCP 53, truncation, EDNS qualification of the classical 512-byte limit, ordinary TCP queries, and full-transfer TCP without unnecessary transfer-protocol depth.
- Corrected IOS domain search behavior: a configured domain list replaces use of the single default domain in the referenced procedure. Removed universal client lookup-order, resolver-limit, and exact typo-delay claims.
- Checked the current IOS `clear host` reference. The lab clears only its tested hostname; the lesson/drills describe cache scope without promising that every image preserves every other entry identically. Intentional static configuration removal uses `no ip host`.
- Rebuilt the lab with a real local DNS1, separate WEB1, complete switch/router setup, a never-queried name for the disabled-client experiment, and a controlled page valid for both address and hostname access. A cached successful lookup is not used as proof that a fresh query occurred.
- Expanded seven lab steps to ten, separating disabled-client recovery, unused-resolver failure/recovery, wrong-record failure/recovery, and record-type diagnosis. Former combined steps 5–7 have changed; prior lab checkmarks should not substitute for repeating the revised tests. No stored progress was altered.

## Primary-source evidence and claim mapping

All pages below were opened or inspected through their primary documentation during this review. Relevant technical URLs also appear in lesson frontmatter. The teaching examples are original and output is labeled representative.

| Source | Claims checked |
|---|---|
| [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html) | Initial/selecting/renewing/rebinding behavior; conditional Offer/ACK delivery; giaddr/ciaddr; UDP endpoints; default timers; expiry, NAK, DECLINE, RELEASE, and INFORM. |
| [RFC 2132](https://www.rfc-editor.org/rfc/rfc2132.html) | Mask/router/DNS/domain/lease options and requested-address, server-identifier, renewal, and rebinding options. |
| [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html) | IPv4 link-local scope and limits; no unsupported inference from a client's fallback address. |
| [Cisco IOS XE 17 DHCP server](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_config-dhcp-server-xe.html) | Pool subnet selection, exclusions/options/lease configuration, bindings/conflicts, service control, and Option 82 with zero giaddr requiring deliberate relay-information trust. |
| [Cisco IOS 15M&T DHCP relay](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-relay-agent.html) | Receiving-interface helper configuration, relay fields, and forwarding/return-path behavior. |
| [Cisco IOS DHCP client](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-client.html) and [client distance command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr/command/ipaddr-cr-book/ipaddr-i1.html) | Interface DHCP configuration and scoped default-route administrative distance/overrides. |
| [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034.html) and [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html) | Names, zones, roles, hierarchy/referrals, records, transport/message fields, and reverse namespace. |
| [RFC 2181](https://www.rfc-editor.org/rfc/rfc2181.html) | Alias coexistence and MX/NS target constraints. |
| [RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html) | NXDOMAIN/NODATA and negative caching, including SOA TTL/MINIMUM interaction. |
| [RFC 7766](https://www.rfc-editor.org/rfc/rfc7766.html) | Normal DNS TCP support, truncated UDP handling, full transfers, and no UDP-only completeness assumption. |
| [Cisco IOS DNS configuration](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dns/configuration/15-mt/dns-15-mt-book/dns-config-dns.html) | Router DNS-client enablement, resolver addresses, static mapping, and domain-list replacement of single-domain search behavior. |
| [Cisco IOS clear host reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr/command/ipaddr-cr-book/ipaddr-a1.html) | EXEC command scope and named/all-cache syntax, without importing IOS XR-only wording as a universal IOS guarantee. |
| [Microsoft nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup), [ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig), and [ISC dig](https://bind9.readthedocs.io/en/latest/manpages.html) | Explicit server/type queries and client cache inspection; no claim that these full tools are implemented identically in Packet Tracer. |

## Assessment identities and balance

DHCP now has 16 questions, including two multiple-answer questions and five exhibits; 20 cards; 12 command drills; and two tickets. DNS has 16 questions, including two multiple-answer questions and six exhibits; 20 cards; 10 drills; and two tickets. Every wrong question option has an explanation. Single-answer positions are 3/4/4/3 for DHCP and 4/4/3/3 for DNS. Correct-option length warnings were reviewed and removed by concise wording, not arbitrary distractor padding.

Same-topic corrections retain their IDs, including the corrected domain-list drill and the qualified APIPA, timer, cache, transport, and route interpretations. The only retired bank IDs are:

| Retired ID | New ID | Reason |
|---|---|---|
| `dhcp-q07` | `dhcp-q17` | Replaced recall of eight helper-forwarded UDP ports with conditional DHCP Offer/ACK delivery. |
| `dhcp-c13` | `dhcp-c21` | Replaced helper-port-list recall with conditional reply delivery. |
| `dhcp-c14` | `dhcp-c22` | Replaced optional `ip forward-protocol` recall with Option 82/giaddr/trust distinctions. |

New `dhcp-q16` tests the wrong DNS option and client refresh; new `dns-q16` tests a broken NS delegation. All other question/card/drill/ticket IDs are retained. Loader comparison confirmed exactly those additions/removals against `third-ten/baseline.json`. Retired IDs are not reused, so unrelated past mastery is not assigned to the new material.

## Verification and limits

The content validator completed with **zero errors and no warnings for chapters 24 or 25**. Warnings elsewhere remain outside this change. Targeted `git diff --check` found no whitespace errors. No final build was run.

Independent Python checks passed **392 assertions** across unique usable lab addresses, /24 host capacity, inclusive exclusion arithmetic, three-client exhaustion, the ten-address challenge, option-answer indices, multiple-answer cardinality, complete wrong-option explanations, IOS prompt formatting, and absence of unresolved VERIFY notes. Explicit arithmetic included 254 − 49 = 205; 49 + 202 = 251; 254 − 251 − 3 = 0 free; 254 − 49 − 2 = 203; the new exclusions total 244 leaving ten; eight-hour T1/T2 = four/seven hours; twelve-hour T1/T2 = six/10.5 hours; 3,600 − 900 = 2,700; 86,400 − 3,600 = 82,800 seconds; and the PTR reversal for 10.1.1.80.

The app's real content loader and Markdown parser accepted **156 blocks, 31 IOS blocks, and four diagrams**, including lesson, topology, lab, challenge, and ticket-fix content. IOS copy output was checked for removed prompts. Every old lesson section identity matched the baseline. These are parser and authored-data checks, not browser rendering or device execution.

Both labs were manually traced for topology, interface models, addressing, mode changes, routing, fresh-client state, expected evidence, and separate recovery. **No Packet Tracer, CML, or hardware run was performed.** Exact simulator retries, cache behavior, show/debug availability, DNS type/query support, displayed message formatting, and timing remain unmeasured. The content labels outputs representative, gives specific alternative evidence where commands are absent, and uses explicit paper cases rather than claiming unsupported DNS service behavior was observed.
