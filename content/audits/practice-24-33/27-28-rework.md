# Practice review: chapters 27–28

Reviewed 24 September 2026. Read both complete lessons for context, every question/option/key/feedback, flashcard, command drill, ticket and full repair, and both complete labs. This pass changes practice content, not the lesson structure, application behavior or colors. A separate reviewer checks the final authored work before the batch closes.

## Outcomes and workload

| Chapter | Questions | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|
| 27 NTP, syslog and SNMP | 26 | 24 | 9 | 2 | 13 |
| 28 QoS | 17 | 17 | 3 | 2 | 12 |

The counts follow distinct outcomes, not a target growth percentage. NTP has a configure/verify outcome in v1.1; syslog and SNMP retain their interpretation/function scope across the stated tracks. QoS is a v1.1 explanation outcome, with no separate v2.0 objective. Its three remaining drills inspect definitions and operational evidence; configuration remains supplied optional practice.

Checkpoint order progresses from retrieval through application to evidence analysis. Reclassified the supplied-stratum calculation and directly displayed SNMP ACL scope as application, and the QoS direction/counter comparison as analysis. Independent review also reduced the selected-peer identification and three direct QoS meaning/action questions to foundations, and the stated manager-address correction to application. No extra hard question is invented to meet a percentage. The application continues to shuffle answer choices while retaining chapter question order.

## 27: time, events and management data

- Removed a duplicate synchronized-stratum calculation and compulsory PRI arithmetic. Exact local-reference literals, optional poll ranges and the default master value remain available in lesson context without separate memory cards.
- Added manager/agent and event-service foundations, v3 security-level selection, polling versus notifications, counter discontinuity, facility meanings, severity versus service impact, and evidence-limited incident correlation.
- New NTP cases distinguish actual selection from lower advertised stratum/reach history and show that an already synchronized router can serve permitted downstream clients without replacing its source with a local master.
- New diagnosis asks the learner to follow a fresh syslog event through sender eligibility, transport and collector processing, and to separate an SNMP source-authorization change from community permissions or notification settings.
- Replaced conspicuous wrong options and removed answer-revealing ticket titles. The downstream time ticket asks about the demonstrated upstream condition without claiming that all possible R2 faults have been excluded.
- Kept nine relevant operational/configuration drills. Buffer sizing and detailed SNMP community/notification syntax are supplied preparation rather than mandatory recall.

The full same-LAN setup remains self-contained. The lab now identifies three checkpoints with separate evidence submissions. It explicitly sets the local buffer threshold, asks predictions before NTP selection and loopback shutdown, preserves separate failure/recovery stages, and conceals worksheet answers. A fresh branch incident combines unusable source state despite responses, a destination threshold, untrusted clock correlation, read-only access and a new continuous-counter calculation. The solution distinguishes what is known from what still needs a test.

## 28: explain per-hop treatment

- Removed compulsory EF binary conversion, a simple guideline comparison, NBAR recognition and repeated legacy-default recall. The core bank instead covers policy purpose, classification versus marking, delay variation, the exact action taken on excess traffic and downstream per-hop diagnosis.
- Retained one bounded AF calculation and the useful serialization calculation. Several independent numeric conversions no longer crowd out forwarding behavior.
- Removed codec-rate, mapping-table, legacy precedence and platform-default cards from mandatory spaced retrieval. Added short cues for classification/marking, delay/jitter, per-hop scope and meaningful counter differences.
- Reduced twelve mostly optional configuration drills to three display commands. Definitions, interface attachment, counter changes and actual packet observations remain distinct forms of evidence.
- Strengthened ticket alternatives around real policy mistakes: changing a rate cannot fix a lost classification, a drop policer does not smooth bursts, and a larger ordinary queue cannot override the policer's action.

The required lab is now an explicit paper path through Steps 1–4 and 11 plus the independent challenge. All calculation/policy worksheet answers use closed solution disclosures. Optional device work still has complete setup, a working IP baseline, a direction fault and a separate repair. The final rubric separates predicted treatment from actually observed fields/counters. A new 12 Mb/s branch challenge requires separate marking and rate diagnoses, constrained corrections and comparable-load retests; it does not ask the learner to copy a production policy hierarchy.

## Primary references checked

- Cisco [v1.1 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [v2.0 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), for the objective verbs and track differences.
- [Cisco NTP association verification](https://www.cisco.com/c/en/us/support/docs/technical-details/220303-verify-ntp-status-with-the-show-ntp-asso.html), for per-peer versus local status, stratum, recent reach history, selection and downstream service.
- [Cisco system message logging](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/configuring_system_message_logs.html), for record fields, destination controls and thresholds. Platform-specific buffer defaults are not generalized.
- [Cisco SNMP security](https://www.cisco.com/c/en/us/support/docs/ip/simple-network-management-protocol-snmp/20370-snmpsecurity-20370.html) and [RFC 3416](https://www.rfc-editor.org/rfc/rfc3416.html), for authorization scope, reads, changes, notifications and responses.
- [Cisco policing versus shaping](https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-policing/19645-policevsshape.html) and [bandwidth versus priority](https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-packet-marking/10100-priorityvsbw.html), for the actual rate/buffer actions and the explicitly classic IOS congestion-time priority behavior.
- [RFC 2474](https://www.rfc-editor.org/rfc/rfc2474.html) and [RFC 2597](https://www.rfc-editor.org/rfc/rfc2597.html), for DSCP/per-hop treatment and within-class AF discard preference.

The existing lesson source lists retain these references. New questions are original scenarios, not recalled exam material. Supplied command output is representative or explicitly authored.

## Decisions, verification and limits

[27-28-decisions.json](27-28-decisions.json) records every original or new bank identity against the captured baseline. Existing identities keep their knowledge target; unrelated replacements use new IDs. The batch verifier reconciles actual equality rather than trusting claimed actions.

The labs identify the September 2026 revision and preserve existing positional checkmarks with instructions to repeat changed practice. No application or progress-state logic is edited. The required course build, independent numerical checks, browser work and final peer closure are recorded in the [batch report](README.md).

No Packet Tracer, CML or physical-device execution is claimed. In particular, a paper prediction does not demonstrate feature support, real-time voice quality, convergence duration, loss rate or successful service delivery on a simulator. Difficulty labels are editorial reasoning demands, not measured exam scores.
