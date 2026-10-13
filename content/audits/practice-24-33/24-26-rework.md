# Practice review: chapters 24–26

Reviewed September 24, 2026 against the fresh practice-24-33 baseline. Ownership was limited to the DHCP, DNS and NAT/PAT practice files, their lab-time metadata, and this group's audit artifacts. Headings, section identities, chapter identities, visual design and application code are unchanged. Lesson bodies are unchanged except one indispensable DNS table precision correction described below.

## Outcomes and workload

| Chapter | Questions | Demand 1 / 2 / 3 | Cards | Drills | Tickets | Guided steps | Lab minutes |
|---|---:|---:|---:|---:|---:|---:|---:|
| 24 DHCP | 25 | 6 / 16 / 3 | 23 | 12 | 2 | 10 | 85 |
| 25 DNS | 26 | 10 / 13 / 3 | 23 | 11 | 2 | 10 | 80 |
| 26 NAT/PAT | 24 | 7 / 16 / 1 | 21 | 12 | 2 | 12 | 90 |

These are editorial outcomes rather than quota compliance. Directly recognizing SERVFAIL, reading a missing interface-role field or applying a known capacity rule is not called analysis merely because the question includes output. Combined evidence and preservation constraints supply the smaller demand-3 group. Foundation questions and concrete cards come first. Single-answer position totals are respectively 5/6/6/5, 5/6/6/6 and 5/6/5/5; there is no repeating four-position cycle. No correct option exceeds the longest alternative by a factor of 1.4 in the final local check.

Every original and current question, card, command and ticket has exactly one entry in [24-26-decisions.json](24-26-decisions.json). Actions are based on deep object equality with the baseline, not on whether an author remembers editing an item. At this pass: 194 decisions, comprising 74 keep, 63 revise, 11 retire and 46 add. Ordering changes alone do not incorrectly turn unchanged objects into revisions.

### DHCP

Retained the useful cold-start remote server, client-facing relay and IOS client setup. The guided experiment now asks the learner to predict before observing: acquisition with no helper, old-client traffic versus fresh-client failure with a misplaced helper, and a genuinely exhausted three-address pool. Recovery remains in the following step. Existing unexpired leases are deliberately preserved as evidence rather than cleared to manufacture a result.

The new questions distinguish Offer from completed allocation, renewal/rebinding/expiry, inclusive candidate ranges, exclusions from manual assignment, client receipt from server bindings, missing server return routes, and adding a new pool and route without destroying USERS. The direct helper-placement question is application, not hard analysis. Conflict alternatives now involve plausible but unjustified resets or timer changes; DNS-option alternatives distinguish router configuration, client cache and refreshed DHCP settings. Capacity tickets no longer state their conclusion verbatim in the evidence.

The independent task names SW3 and PC-D and supplies exact ports, cable, gateway, range, DNS and lease requirements. The closed answer includes complete SW3/R1/R2 commands and validates the new binding, expected giaddr, route and actual controlled HTTP service while preserving the original clients. The core server practice is explicitly useful for announced v2.0; v1.1 retains DHCP role, client and relay scope. This is not represented as a newly required v1.1 server-configuration objective.

### DNS

Preserved the isolated Server-PT DNS/HTTP baseline and the three separately recovered faults: disabled router lookup, an unused client resolver, and an incorrect A record. Added predictions, explicit name/type/server/result evidence, and required service observations. Supplied record worksheets cover IPv6, MX, NS delegation and PTR without pretending Packet Tracer implements every record or a real recursive hierarchy. Their answer is now closed.

The bank adds independent decisions about an alias change that must preserve a legacy service, an alias loop, reverse-data repair, DNS TCP retry, differing resolver paths, valid cached data during a change, and correct DNS data followed by application failure. Existing core questions remain where useful; alternatives now compare realistic cache, static mapping, resolver, record and service scopes. Direct response-code meaning is level 1. Record substitution and an explicitly identified old delegation are level 2.

Cards split the former four-status table into NXDOMAIN/NODATA and SERVFAIL/timeout. MX fields and exchanger-address dependencies have separate cues. The historical 512-byte limit and optional IOS search-list precedence remain reference material in the unchanged lesson; they are not mandatory recall cards. Drills add specific name/server, MX and PTR queries with a supporting-terminal or paper fallback, and replace blanket cache clearing with a targeted entry.

The independent WEB2 service uses a missing CNAME target and a separate PTR worksheet. It requires before/after query evidence, service identification and preservation of the original app service. Exact switch preparation is in its closed answer. v1.1 DNS-role explanation and announced v2.0 six-record diagnosis remain distinguished in the lesson.

### NAT/PAT

Retained genuine configuration retrieval for roles, static NAT, selector, pool, both overload forms, verification and deliberate isolated clearing. Removed the general timeout conversion question and two timer-catalog cards; actual state aging remains interpreted in the lab.

The practice now distinguishes mapping state from application success, allocated pool addresses from flow rows, NAT selection from filtering, an unmatched new subnet from an existing working subnet, and a stale /32 return route from the valid aggregate pool route. A static service-publication case must preserve working client PAT. Questions asking directly visible roles or table fields have honest lower demand labels.

The guided lab records predictions for router-versus-client sources, untranslated and translated return routes, inclusive pool capacity and changed selectors. A closed tuple worksheet walks a supplied TCP mapping in both directions independently of the simulator's chosen ports. Mode changes keep traffic stopped, and the save instructions explicitly complete each interactive filename prompt. The independent inside HTTP publication is first verified locally, then from the outside, while original clients are retested. A static-PAT worksheet fallback is explicit; no live result is inferred from an unsupported command.

## Retired identities

| Identity | Reason |
|---|---|
| dhcp-q08 | Repeated routing bracket interpretation; no distinct DHCP-service decision |
| dhcp-c06 | Platform default lease-duration recall rather than actual lease-state interpretation |
| dhcp-d12 | Optional debug command removed from required retrieval; non-debug server statistics added under new d13 |
| dns-c02 | Historical UDP-size/EDNS catalog removed from recall; transport/TCP retry remains |
| dns-c19 | Combined optional IOS search-list precedence catalog removed |
| dns-d02 | Redundant second-resolver variation of the same configuration command |
| dns-d07 | Optional search-list configuration outside the chosen practice outcomes |
| nat-pat-q06 | Timer seconds-to-hours arithmetic rather than NAT reasoning |
| nat-pat-c04 | Repeated private-address range recall, already prerequisite knowledge and retained in lesson reference |
| nat-pat-c11 | Literal platform-scoped general timeout |
| nat-pat-c12 | Multi-protocol platform timeout catalog |

No retired item is silently reassigned to an unrelated concept. New DHCP question IDs are q21–q30; DNS q21–q30; NAT q21–q29. New cards are DHCP c23–c26, DNS c23–c27, NAT c21–c24. New drills are DHCP d13 and DNS d11–d13. No new tickets were necessary: the existing two incidents per chapter address distinct mechanisms. No destination claim is made without a specific verified current identity. The client-OS author was notified that existing dhcp-t01 genuinely owns misplaced-helper diagnosis and complete repair.

## Primary evidence

All links below were opened or checked during this September 24 pass. The two official blueprint PDFs were reopened by the coordinating author; the current v1.1 and announced v2.0 labels remain unchanged.

- [Cisco v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf): 4.1 inside-source static/pool NAT, 4.3 DHCP/DNS roles, 4.6 DHCP client/relay.
- [Cisco v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf): 1.7 DHCP operation/troubleshooting, 4.3 NAT/PAT, 4.4 record diagnosis. This future scope is not presented as the current exam.
- [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html), especially client states and reply construction: Offer/ACK roles, T1/T2, expiry stop condition, giaddr/ciaddr/broadcast-dependent delivery.
- [Cisco IOS XE DHCP server](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_config-dhcp-server-xe.html): pools, exclusions, options, bindings, conflicts and statistics.
- [Cisco DHCP relay](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-relay-agent.html): client-facing helper and relay-gateway behavior.
- [Cisco DHCP client](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-client.html): interface client configuration and verification; platform behavior is not universalized.
- [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html): record formats, response fields and reverse naming.
- [RFC 2181](https://www.rfc-editor.org/rfc/rfc2181.html): ordinary CNAME coexistence, aliases, MX/NS hostname requirements.
- [RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html): negative answers and caching distinctions.
- [RFC 7766](https://www.rfc-editor.org/rfc/rfc7766.html): conventional DNS TCP support and retry; UDP success alone does not establish the TCP path.
- [Cisco IOS DNS configuration](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dns/configuration/15-mt/dns-15-mt-book/dns-config-dns.html): router-local client settings and suffix behavior.
- [Microsoft nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup): explicit query name, server and type syntax. This is supporting-terminal documentation, not a promise of Packet Tracer support.
- [Cisco IOS XE NAT](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_iadnat-addr-consv-xe.html): static, pool and interface-overload configuration.
- [Cisco NAT troubleshooting](https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/221481-8605-13.html): interpreting translation state, selector/interface dependencies and return-path checks.

Teaching scenarios and example output are original representative records, not copied exam questions or claims of captured execution. Advanced reference details are not automatically new memorization requirements.

## Verification and limits

[24-26-verify.mjs](24-26-verify.mjs) checks exact ledger reconciliation, every distractor explanation, nondecreasing demand, unchanged lesson bodies/section identities except the exact documented DNS table correction, matching lab times, revision notices, closed challenges and actual React rendering. It rendered 1,080 fragments with six closed solution disclosures. Independent arithmetic enumerates DHCP eligible hosts, computes renewal/cache intervals, constructs reverse names, verifies pool-prefix membership and applies longest-prefix selection. Results are in [24-26-verification.json](24-26-verification.json).

The course validator reported zero errors and no warnings in these three chapters; ten existing untagged orientation/model questions elsewhere account for the global warnings. The independent read-only peer review is closed with no unresolved material findings; see [24-26-peer-review.md](24-26-peer-review.md). Its first DNS findings were resolved: q13 now states the approved .80 inventory explicitly, and q28 treats the supplied still-valid cache as direct application (level 2). The subsequent NAT refinements use neutral incident titles and explicitly test HTTP from the two successful plain-pool clients before the fresh third-host attempt, matching the lab evidence rubric. The final demand pass classifies the possible return-path causes, complete /32 route selection and explicitly unmatched new source as level 2 rather than preserving a target analysis count. A final primary-source finding corrects the DNS diagnosis table: RFC2308 section2.1 permits NXDOMAIN for an absent final alias target while the original CNAME owner exists. Card c14 now makes that distinction; q01 explicitly has no CNAME chain, and the direct-name lab wording is scoped. The verifier allows only that precise table replacement against the baseline, with all headings/section IDs retained. The analogous DHCP sent-Offer/no-client-receipt case is also classified as direct application (q11=2), matching NAT's equivalent stage inference. The final saved corrections were reread by the independent reviewer.

No Packet Tracer, CML, IOS XE router, DNS service or packet-capture experiment was executed in this pass. No browser-layout measurement, psychometric calibration, build, server, publication or Git action was performed. The platform-specific fallback paths and representative-evidence labels are therefore retained.

Lab checkmarks use positional identity. Every revised lab warns learners to repeat the changed exercise and update its checkmarks; no saved history was erased or silently migrated.
