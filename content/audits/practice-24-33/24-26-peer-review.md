# Independent practice review: chapters 24–26

Completed 24 September 2026. This read-only peer review examined every final question, option, key and feedback entry; every flashcard and command drill; all ticket evidence, alternatives and repairs; and each complete lab for DHCP, DNS and NAT/PAT. Lesson metadata and relevant DNS explanation passages were checked for consistency. The reviewer did not edit these chapters. The author applied the findings below, and their final saved versions were reread.

## Final workload

| Chapter | Questions | Retrieval / application / analysis | Cards | Drills | Tickets |
|---|---:|---|---:|---:|---:|
| 24 DHCP | 25 | 6 / 16 / 3 | 23 | 12 | 2 |
| 25 DNS | 26 | 10 / 13 / 3 | 23 | 11 | 2 |
| 26 NAT/PAT | 24 | 7 / 16 / 1 | 21 | 12 | 2 |

Demand labels describe editorial reasoning requirements, not measured learner difficulty. The final ordering moves from foundations to application and then combined-evidence analysis without requiring an analysis quota.

## Findings resolved

| Location | Finding | Final correction |
|---|---|---|
| DNS q13 | The answer treated `.80` as the approved address, but the original premise did not establish that independent fact. | The prompt now explicitly gives the approved inventory mapping before presenting the conflicting `.81` hosts entry. The local repair follows from the supplied evidence. |
| DNS q28 | The exhibit directly supplies the approved authoritative answer and an earlier cached answer with a remaining TTL. | The item is application level 2; it does not manufacture an analysis requirement from an explicit cache-lifetime decision. |
| NAT/PAT t01 and t02 | Ticket titles announced the source-selector or return-route diagnosis before the evidence was opened. | Titles now describe a new request without a translation and failed connections after a pool change. The evidence and repairs retain their original technical meaning. |
| NAT/PAT lab Step 6 | The completion evidence requested HTTP in each mode, but the dynamic-pool procedure only explicitly tested ICMP. | PC-A and PC-B now open HTTP and record the returned page while both allocations remain. The fresh third client then tests both ping and HTTP. |
| DHCP q11; NAT/PAT q09, q26 and q27 | These items directly apply a supplied capture sequence, unmatched source or longest-prefix rule rather than require a new combined-evidence diagnosis. | All are application level 2 and were reordered accordingly. No key or underlying technical fact changed. |
| DNS lesson diagnosis table, c14, q01 and lab Step 7 | A blanket statement that NXDOMAIN means the original queried name is absent missed a possible CNAME chain ending at an absent target. | The table and card allow an absent final alias target. q01 explicitly excludes a CNAME chain, and the lab identifies its direct-name test. Completed NODATA remains distinct from an arbitrary empty-answer referral. |

No unresolved material correctness or lab-reproducibility finding remains in the reviewed practice assets.

## Independent reasoning checks

DHCP review checked relay `giaddr`, the distinction between a captured server send and client receipt, server return routing, local-server versus relay roles, lease renewal versus a fresh allocation, and the bounded exhaustion/recovery sequence. The guided three-address pool leaves `.50–.52` available; the widened pool leaves 205 addresses. The fresh challenge's `.50–.59` range contains ten addresses, with the client gateway, helper, remote DNS and server return route consistent. Where an eight-hour lease explicitly uses default fractions, T1 is four hours and T2 seven hours. An existing lease does not prove that a new allocation can succeed.

DNS review checked A/AAAA choice, aliases, MX target resolution, delegation, reverse-name construction, TCP fallback, cache lifetime and the difference between an explicit query and an application's hosts/cache path. `10.1.1.80` reverses to `80.1.1.10.in-addr.arpa`; a one-day TTL with one elapsed hour has 82,800 seconds remaining. The independent challenge changes the alias/service target without silently changing the original application's mapping. Unsupported record types remain paper exercises rather than claimed Packet Tracer capabilities.

NAT review checked every supplied source/destination tuple, selector membership, inside/outside placement, address ranges, capacity examples and reverse routing. The `.16/28` translated block contains the stated static and pool addresses. Two plain dynamic addresses cannot simultaneously allocate to three new inside hosts under the stated model; four plain addresses leave one of five hosts without a new allocation. PAT is distinguished from plain dynamic NAT. A route toward a translated pool is still required; NAT does not create the remote return route. The host `/32` wins over the pool `/28` and default route. The challenge's static TCP publication and client interface PAT can coexist as specified, and removing translation state is distinguished from removing configuration.

Across the labs, supplied setup, predictions, recorded evidence, fault observation and repair are separated. Independent challenges use fresh requirements and closed solutions. Saving, retesting the original application and recording unsupported steps as unexecuted are explicit. No address or command-mode inconsistency was found during the final read.

## Primary-source spot checks

The following references were independently opened during this review; they support the targeted conclusions rather than establish that a particular simulator was run.

| Claim checked | Source |
|---|---|
| Relay reply destination and lease renewal/rebinding behavior | [RFC 2131 §§4.1 and 4.4.5](https://www.rfc-editor.org/rfc/rfc2131.html); [Cisco IOS DHCP relay guide](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-relay-agent.html) |
| DHCP pools, exclusions and verification | [Cisco IOS XE DHCP server guide](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_config-dhcp-server-xe.html) |
| MX/NS target and alias constraints | [RFC 2181 §10.3](https://www.rfc-editor.org/rfc/rfc2181.html#section-10.3) |
| NXDOMAIN after an alias chain and completed NODATA | [RFC 2308 §§2.1–2.2](https://www.rfc-editor.org/rfc/rfc2308.html#section-2.1) |
| DNS TCP support and truncation handling | [RFC 7766](https://www.rfc-editor.org/rfc/rfc7766.html) |
| Static, dynamic and overload translation; selectors | [Cisco NAT configuration examples](https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/13772-12.html) |
| Classic inside/outside translation and routing order | [Cisco NAT order of operations](https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/6209-5.html) |

## Verification limits and closure

This was an independent content, arithmetic, protocol and command-sequence review. It did not execute Packet Tracer, CML, Cisco hardware, a DHCP/DNS service or NAT traffic. Representative outputs were evaluated as teaching evidence, not treated as measured device results. Simulator limitations and paper fallbacks remain necessary.

The author's exact identity reconciliation and rendering results are recorded in the [24–26 rework report](24-26-rework.md). Whole-course validation, independent calculation checks, browser checks and final integration belong in the [batch report](README.md). This peer review closes the reported practice findings without making broader execution or exam-pass claims.
