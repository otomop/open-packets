# Chapters 06–08: practice progression rewrite

Reviewed 20 September 2026. Owned changes: labs, questions, flashcards, command drills and tickets in chapters 06–08. The lesson files changed their lab-time metadata; chapter 06 also received one necessary sentence qualification about simultaneous connections using the same IP addresses and server port. No application, UI, color, server, build or Git operation was performed.

The preceding later-course evaluation is [26-45-evaluation.md](26-45-evaluation.md). The complete item ledger is [06-08-decisions.json](06-08-decisions.json); it contains one decision for every item in the union of the baseline and final question/card/command/ticket banks.

## Result and inventory

| Chapter | Questions | Recall/application/analysis | Multi | Exhibits | Cards | Drills | Tickets | Lab stages |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 06 TCP/UDP/ports | 14 | 4/8/2 | 2 | 7 | 18 | 5 | 2 | 8 |
| 07 Ethernet switching | 18 | 4/12/2 | 2 | 9 | 20 | 8 | 2 | 10 |
| 08 Secure device access | 20 | 7/9/4 | 3 | 9 | 22 | 12 | 2 | 11 |

Counts differ because the tasks differ. Labels express editorial reasoning demand, not measured learner difficulty. Chapter 07 deliberately has fewer analysis labels than initially planned: ordinary uplink interpretation and one source-move rule are application. Its two analysis items require tracking ordered frames and which switch actually sees a source.

The final 08 mix is 7/9/4 after moving direct RSA prerequisites, saving and privileged-mode classification to recall and explicit VTY-policy comparisons/corrections to application. Questions are stored in foundations → application → analysis order. Answer options remain independently shuffled by the application; no app change was needed. All questions have explicit explanations for every incorrect option.

Lab stage counts changed from 7/10/10 to 8/10/11. Chapter 07's count is unchanged but the contents materially changed. Each lab includes the learner-facing September 2026 revision notice and asks learners to repeat revised work/update their own checkmarks. No progress was cleared or migrated. Only each independent Challenge answer container uses the coordinator’s new opt-in `:::solution` disclosure; ordinary expected-observation blocks remain visible. Revised planning times are 50/65/70 minutes, including reflection and independent work; they are not completion guarantees.

## Design decisions

### 06

The checkpoint now emphasizes TCP/UDP service, request/reply endpoints, one local address supporting separate connections, stream boundaries, ordinary opening, simple acknowledgment, and evidence limits. Header-field and separate FIN arithmetic questions were retired; the supporting lesson reference remains. The opening question no longer duplicates another sequence-number calculation.

The lab removes switch CLI preparation from the transport task. New default switch ports provide a single LAN; the learner predicts endpoints before reading answers, inspects TCP and a fresh DNS lookup, interprets a different connection snapshot, observes a known service fault and verifies recovery. A second-server challenge separates resolver address from application destination. Unsupported UDP-field inspection has a complete, labeled illustrative worksheet rather than requiring an invented client port.

Cards begin with the central comparison and endpoint ideas. Multi-service lists and paired header-size recall were removed from this bank; other cues were narrowed to a single distinction. Five meaningful client test/inspection drills remain. The two tickets contrast service state and name selection with working numeric access; alternatives no longer rely on unrelated or implausible protocol claims.

### 07

The original strong single-frame questions are retained. Added practice follows successive frames across two switches and applies dynamic source movement. The same-port item now changes the learned source location before the next destination lookup, requiring the learner to update the table rather than reuse its original state. A separate recall item distinguishes MAC and ARP lookups.

Aging is now a bounded worksheet with an optional observed comparison, rather than a required timer change/wait. The supplied one-VLAN port commands are explicitly setup, with independent VLAN configuration deferred to chapter 09. Learners predict the ARP reply, unknown-unicast copies, uplink learning, source movement and a changed cross-uplink challenge before reference.

The static fault and its removal remain separate. Recovery explicitly substitutes the same actual recorded MAC used to create the fault. The expected prior A entry is now dynamic, consistent with the rewritten aging section and source-move exercise. Redundant table-count/timer-mutation drills are retired; exact static-entry removal is added. The card bank replaces a timer-command duplicate with the source-movement rule.

### 08

This is a substantial configuration milestone, so it has more practice than transport. Added decisions cover line configuration context, saved versus active access policy, unexpected SSH identity, and a complete policy with distinct user privileges. Existing server/key, local-account and VTY-policy cases use combined relevant observations and plausible alternatives. Direct factual comparisons remain recall.

The lab retains console recovery, users-before-line-dependency, all actual VTY ranges, fresh privilege checks, known transport fault and separate recovery. A partially specified three-minute VTY timeout requirement preserves the five-minute console policy. Console instructions now account for idle logout even while the window stays open, name the administrator for the final privileged prompt, and separate the interactive save prompt from inspection. The independent challenge is a fresh router build from an access specification, with complete reference configuration and a six-part acceptance record. It replaces merely copying another username command.

Large password-type and legacy SSH-version card catalogs were retired. Modes, host keys, port comparison and server/session inspection cues were narrowed. New cards target identity prerequisites, new-session evidence, console login testing and saved policy. Configuring reversible type-7 obfuscation is no longer a drill; its limitation remains taught. Saving the verified access policy becomes an explicit practical drill.

## Identity ledger and retirements

The ledger contains **164 decisions: 84 keep, 42 revise, 21 retire, 17 add**. A revision preserves the same assessed subject even when the cue narrows or its evidence improves. No unrelated replacement reuses a retired identity. No item is claimed to have been moved; no destination field is invented. Retired subjects can remain in the unchanged lesson/reference material without remaining mandatory spaced practice.

Retired IDs, with prefixes grouped for readability:

- **tcp-udp-ports questions:** q03 (UDP-header fields), q05 (separate FIN/close arithmetic), q06 (standalone registry-range classification).
- **tcp-udp-ports cards:** c02 (paired header sizes), c05 (close packet-count detail), c17 (bundled NTP/SNMP/syslog ports), c19 (bundled AAA ports).
- **tcp-udp-ports drills:** d03 (duplicate simulator netstat), d06 (alternate resolver argument), d08 (ARP deletion), d09 (router-local TCP inspection), d10 (raw Telnet-to-HTTPS test).
- **ethernet-switching question:** q09 (timer-setting syntax).
- **ethernet-switching card:** c12 (timer-setting command duplicate).
- **ethernet-switching drills:** d02 (redundant dynamic-only filter), d06 (count keyword), d09/d11 (timer mutation/reset).
- **ios-essentials cards:** c09 (five-type password catalog), c13 (legacy SSH 1.99 recall).
- **ios-essentials drill:** d03 (configuring reversible password obfuscation).

New IDs:

- 06: q17; c23/c24.
- 07: q17/q18/q19; c22; d12.
- 08: q18/q19/q20/q21; c25/c26/c27/c28; d14.

The ledger gives topic-specific reasons for every retained/revised item as well as these additions and retirements. Existing ticket IDs and their underlying diagnoses remain stable.

## Source and reasoning verification

The blueprint verbs and previously verified lesson references remain the scope authority. Targeted primary-source rechecks on 20 September 2026 included:

- [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html): byte-stream behavior, endpoint pairs, connection opening and cumulative acknowledgments.
- [Cisco Catalyst 2960 MAC-table guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swadmin.html): source learning, multiple MACs per port, aging, static/dynamic distinction, verification and removal.
- [Cisco IOS EXEC-timeout command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/D_through_E.html): line-context timer syntax and idle-session termination; an open terminal window does not prevent expiry.
- [Cisco SSH configuration guidance](https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html): conventional identity/key workflow, local authentication, VTY transport and distinct client/server requirements.

Independent calculations checked 20001 + 1460 = 21461 and 8001 + 1200 = 9201, plus the cumulative gap advancing from 1101 to 1301 only after the missing interval arrives. An idealized bridge-event calculation checked the ordered-source update, three-frame two-switch question, and new challenge's forward/reverse path. This calculation is a reasoning model, not a Packet Tracer execution.

Address checks confirmed the same-subnet two-server transport variation and the distinct 10.8.0.0/24 and 10.8.1.0/24 access exercises. Source/destination port reversal and established-versus-closing counts were independently re-read.

## Integrity checks and limitations

- The course validator reports zero errors and zero warnings for 06–08. Remaining untagged-foundation warnings belong to other chapters.
- Loaded banks have unique identities, valid answers, complete wrong-option explanations, sequential lab stages, expected observations in every guided stage, and opt-in solution disclosures in the three independent challenges.
- Question order is nondecreasing in editorial demand.
- The decision ledger covers the complete baseline/current union exactly once.
- Hash comparison reconstructing the original lab-minute values and reversing the one connection-identity qualification matches the baseline lesson files exactly. All other lesson text, IDs, section headings and section IDs are unchanged.
- No Packet Tracer, CML, hardware, Windows network test or actual network-device session was executed. Simulator observations remain representative; each lab records worksheet/unsupported limits rather than awarding an unperformed check.
- Application rendering/build/integration checks belong to the coordinator's separate pass; this author did not claim them.

## Independent peer review

The fundamentals reviewer independently read 06/07 and identified several material clarity/consistency corrections, all applied: fixed client IP assumptions in the connection question/card; complete UDP fallback endpoints; A marked DYNAMIC after the aging rewrite; and q14 feedback matching its revised option. Card order, FIN/RST focus, VLAN-setup scope and honest source-move difficulty were also improved. The reviewer also read every 08 asset and identified the idle-console, privileged-login and interactive-save corrections, improved one RSA-prerequisite distractor, removed an unrelated reset caveat from the save card, and recommended the final honest demand labels. All changes were applied and reread. No incorrect keyed answer or remaining material technical finding was reported.
