# Independent peer review — chapters 44–45

Reviewed 20 September 2026 by the chapter 42–43 author. This was a read-only review of all six files in each chapter, followed by confirmation of the author's one correction. No chapter 44 or 45 files were edited by the reviewer.

## Result

**No unresolved actionable findings.** Chapter 44 had no material findings. Chapter 45 had one mislabeled scoring item, now corrected.

| Chapter | Assets reviewed | Result |
|---|---|---|
| 44 — integrated capstone | Lesson, 19-step lab, 17 questions and every distractor, 22 cards, 12 drills, four tickets | No actionable findings |
| 45 — exam readiness | Lesson, 11-step lab, 19 questions and every distractor, 31 cards, 12 drills, two tickets | One label issue, resolved |

## Resolved finding

At chapter 45 lab.md line 98, scoring check 15 originally said “Staff-subnet SSH succeeds; other source denied.” This contradicted the specification and reference configuration: USERS/PC-A in VLAN 10 is authorized; STAFF/PC-B in VLAN 20 is denied.

The author changed it to **“USERS/PC-A SSH succeeds; STAFF/PC-B denied.”** The reviewer re-read the on-disk line and confirmed the correction. No configuration or answer-key change was necessary.

## Technical review coverage

### Chapter 44

Checked the VLAN, trunk and LACP port plan; STP root priority and extended system ID arithmetic; R1 router-on-a-stick gateways and DHCP pool candidate ranges; OSPF neighbor eligibility and return routes; R2 NAT inside/outside interfaces and eligible source addresses; packet-oriented guest ACL, including its ICMP echo-reply exception; separate VTY source restriction; DNS, NTP and logging verification; separate fault-observation/recovery stages; and every dependency in the independent renumbering challenge.

The guest ACL correctly remains a stateless packet policy. The content does not equate a NAT selection ACL with an interface packet filter or claim that a successful translated flow proves every source is eligible. Assessment answers and explanations agree with the supplied exhibits and reference configuration.

### Chapter 45

Checked that the timed independent build and verification occur before reference configurations are presented. The local 16-point checklist and readiness scales are explicitly bounded evidence aids, not Cisco scores, exam simulations or pass predictions.

Checked the two client VLANs, gateway and DHCP options, 205-address candidate pool, OSPF transit and return routes, inbound web restriction, separate SSH restriction, port-security learning prerequisites, configuration modes, and independent challenge changes. The wrong DHCP default-router option is .2, which is both excluded from allocation and unassigned; the fault therefore does not depend on a duplicate address. Renewal and recovery are separate operations.

Independently verified the /22 network/range example, wildcard matching, longest-prefix route choice, STP path-cost comparison, EUI-64 insertion and bit change, AF/CS codepoints, readiness score and priority arithmetic, IPv6 link-local next-hop interface requirement, and the conditions attached to timer, port, group-range and default-value cards. All 19 question keys and their incorrect-option explanations are consistent.

## Policy source checks

The following official pages were checked on 20 September 2026:

- [Cisco CCNA exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html): current exam identity, scheduling route, duration, languages and published price.
- [Cisco exam policies](https://www.cisco.com/site/us/en/learn/training-certifications/exams/policies.html): identification requirements, unpublished passing scores and applicable retake intervals.
- [Cisco recertification requirements](https://www.cisco.com/site/us/en/learn/training-certifications/certifications/recertification/index.html): current associate-level continuing-education requirement and official renewal guidance.
- [Pearson VUE Cisco OnVUE page](https://www.pearsonvue.com/us/en/cisco/onvue.html): actual-computer/network system test, equipment and prohibited technology, ID matching, early check-in, approved-break condition, proctor assistance and digital whiteboard.
- [Current v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf): separate domain weights and appropriate scope for each track.

The lesson treats published logistics as dated information and directs the learner to appointment-specific instructions. It does not invent a fixed question count, published passing threshold, universal rescheduling deadline or permission to take an unscheduled break. Its practice questions are a bounded original sample.

## Verification limits

This review covered sources, configuration reasoning, arithmetic and assessment semantics. It did not execute either topology in Packet Tracer, CML or hardware. It did not measure real exam performance or certify compatibility with every IOS image. Simulator-specific results remain representative, with unsupported checks identified rather than counted as passed.

No application code, styling, shared course data, build, Git state, deployment or browser UI was changed.
