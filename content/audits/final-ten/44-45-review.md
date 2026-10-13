# Chapters 44–45: capstone and readiness review

Reviewed 2026-09-20. This audit covers both lessons, lab setup and every step, questions and distractor explanations, flashcards, command drills, and troubleshooting tickets. It changes teaching material only.

## Scope and structure

Chapter 44 integrates the previously taught IPv4 branch skills. It does not claim to cover the entire exam: IPv6, wireless, automation and other objectives need their own exercises. The lesson now follows requirements, addresses and packet paths, Layer 2, gateways and routing, the external path, policy/management, and verification. The complete configuration lives in the guided lab. IOS essentials and DNS were added as explicit prerequisites.

Chapter 45 separates appointment facts, blueprint choice, item handling, evidence of readiness, technical retrieval, revision scheduling, and exam-day follow-up. It keeps domain weights for the two tracks separate. The lab presents a specification and scoring checklist before the reference configurations so it can be attempted independently. Wireless configuration, automation and AI are explicit prerequisites alongside the capstone.

## Corrections

- The branch guest ACL is described as a stateless packet policy. Its DHCP and staff-directed ICMP echo-reply exceptions are explicit. A TCP established match is not represented as session tracking or a guarantee of who initiated a connection.
- The VTY filter permits staff sources only, consistently across both routers and both switches. SSH transport, authentication and source restriction are separate requirements.
- VLANs, both trunk paths, LACP, gateway subinterfaces, DHCP options, OSPF advertisements, conditional default origination, PAT classification and return routing are traced together. The documented DHCP candidate range contains 205 addresses; no exact first lease is promised.
- STP priority is configured explicitly rather than treating a root macro's outcome as universal. OSPF FULL, NAT translations, accepted configuration commands and successful pings are each explained with the limits of what they prove.
- NTP synchronization is required only where supported; switch simulator limitations are recorded. Syslog verification uses a deliberate local event, with cleanup. No invented synchronization delay, stratum or exact output is a pass criterion.
- Separate fault and repair steps cover a bundle member, trunk allowed list, OSPF passive state and an earlier ACL deny. The renumbering challenge includes every dependent DHCP, routing, NAT, packet-filter and VTY source reference.
- Readiness removes unsupported promises about question counts, lab order, per-item timing, partial credit, scaled passing scores and universal cancellation cutoffs. Cisco does not publish a fixed passing score.
- Test-center ID and online-proctor requirements are separated. Appointment instructions govern delivery and logistics. The two-week plan and weighted evidence score are study aids, not booking thresholds or guarantees.
- The final lab's DHCP fault uses an excluded, unassigned gateway address. Its 16 checks agree with the topology, policy and reference configuration. Independent review caught and corrected the SSH checklist label: USERS/PC-A is permitted; STAFF/PC-B is denied.
- Mixed practice explains conditional facts: classic RADIUS versus TACACS+ protection, usable radio channels in a stated regulatory context, first FTP/TFTP exchanges, STP macro behavior, IPv6 next-hop interface requirements, Ansible output and unsupported AI conclusions.

## Sources

Chapter frontmatter contains the primary links. Scope was checked against [Cisco v1.1 objectives](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [announced v2.0 objectives](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf).

The technical review used Cisco's [NAT configuration](https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/13772-12.html), [ACL examples](https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html), [OSPF configuration](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/configuration/15-mt/iro-15-mt-book/iro-cfg.html), [OSPF route/database troubleshooting](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/7112-26.html), [SSH guidance](https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html), and the EtherChannel/DHCP references linked in chapter 44. Cross-topic questions also use the reviewed teaching chapters as context.

Dated exam facts were checked against the [CCNA exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html), [exam policies](https://www.cisco.com/site/us/en/learn/training-certifications/exams/policies.html), [refresh announcement](https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh), [lab-item explanation](https://blogs.cisco.com/learning/new-performance-based-lab-exam-items-build-opportunities), [Pearson OnVUE requirements](https://www.pearsonvue.com/us/en/cisco/onvue.html) and [recertification policy](https://www.cisco.com/site/us/en/learn/training-certifications/certifications/recertification/index.html). Appointment-specific rules can change and must be rechecked when booking.

## Progress identities and inventory

All chapter IDs, chapter numbers, checkable section IDs and existing question/card/drill/ticket IDs are retained with their subjects. No assessment identities were retired in 44 or 45. Additional subjects use new identities.

| Chapter | Questions | Multi-select | Exhibits | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|---:|---:|
| 44 | 17 | 4 | 8 | 22 | 12 | 4 | 19 |
| 45 | 19 | 3 | 8 | 31 | 12 | 2 | 11 |

The original lab step counts were 10 and 7. They are now 19 and 11. Lab checkboxes are positional, so a learner with an older completed lab should revisit all revised steps; no storage reset or migration was introduced. Retained study-item progress indicates previous practice, not validation against the revised explanations.

## Verification and limits

Both complete chapters received an independent second review; see [the peer review](44-45-peer-review.md). Packet paths, address ranges, branch ACL ordering, fault/repair dependencies, answer keys and every distractor were reviewed. The separate batch report records parser/rendering checks, application tests, production build and browser results.

These Packet Tracer configurations were reviewed against documentation and for internal consistency. They were **not executed in Packet Tracer, CML or physical devices** during this audit. Output is authored representative evidence, not a captured successful run. This audit does not guarantee an exam result.
