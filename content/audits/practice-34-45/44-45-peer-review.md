# Independent peer review: chapters 44–45

Reviewed 24 September 2026 by the services/security/automation author, independently of the 44–45 author. The review read all twelve chapter files: both complete lessons and labs, every question and option/key/feedback, all cards, drills, and ticket evidence/repairs. This was a complete semantic and setup review, not an item sample.

## Final inventory and demand

| Chapter | Questions | Difficulty 1 / 2 / 3 | Cards | Drills | Tickets | Lab stages |
|---|---:|---:|---:|---:|---:|---:|
| 44 Capstone branch | 23 | 2 / 20 / 1 | 12 | 8 | 4 | 19 |
| 45 Exam readiness | 30 | 6 / 23 / 1 | 10 | 10 | 2 | 11 |

## Findings, corrections and reread

All requested corrections are saved by the chapter author and independently reread. No actionable finding remains.

- **44 q18/q20/q21/q22:** reclassified to application (2). The cases explicitly establish the resolution failure, missing OSPF interface, required service exception, or old management-source list. Their length does not create an additional diagnostic inference. q07 remains analysis because the successful HQ control, NAT source selection and absent external return route must be combined.
- **45 q22/q26/q27/q30:** reclassified to application (2). The supplied duplex settings, authoritative/cache answers, SSH failure stage, and ordered ACL/counter establish a direct application of the taught rule.
- **45 q23:** replaced impossible alternatives with realistic but poorly prioritized profile, DNS and radio checks. The key remains tracing the newly selected VLAN's forwarding/DHCP path; its feedback now addresses those actual alternatives.
- **45 ticket t01:** the old recovery text requested staff HTTP, although this chapter intentionally denies STAFF/PC-B HTTP. The repair now repeats permitted USERS/PC-A HTTP and preserves the STAFF denial.

The author's earlier q20 clarification correctly distinguishes a missing staff-prefix route from an installed covering ISP default. The q22 duplex wording now states the approved auto-negotiation design; its feedback acknowledges that matching forced full duplex can remove a mismatch without satisfying that design.

## Lab and assessment checks

44 supplies all nine devices, models, cables, interface mappings, VLANs, addresses, server services and configuration modes. Its guest echo-reply exception is a stateless ICMP-type policy, not a stateful return-session claim. The VTY source restriction separately blocks management access otherwise allowed by the interface list. The trunk, OSPF and ACL faults each have separate observation/recovery stages and original-service retests. The changed /24 challenge updates all dependent source/address references, adds a specific HQ HTTP exception before the broader deny, and distinguishes an unmatched NAT selector from a packet filter.

45 supplies the six-device baseline before the timed independent attempt. Four reference configurations and the changed challenge remain closed solutions. The .2 DHCP gateway fault uses an excluded, unassigned address and requires a client refresh before both failure and recovery observations. The fresh VLAN 30/40 exercise changes both addressing and protocol policy; USERS management and STAFF HTTP/ping outcomes are explicitly retested. Its sixteen evidence points and study scales are clearly local planning measures, not an exam score or pass probability.

Manually cross-checked the 205-candidate DHCP ranges, /30 host pair, 24576 + VLAN 20 priority value, /22 host/gateway case, /26 longest-prefix choice, STP cost 4 + 4 versus 19, modified EUI-64 byte insertion/U-L inversion, and the changed ACL source/destination directions. Root's separate calculation checker provides the automated numerical record. Question answers and each distractor explanation agree with their supplied premises; ticket titles describe symptoms rather than reveal the diagnosis.

## Independently reopened primary sources

| Review topic | Source and evidence |
|---|---|
| Current exam listing and version transition | [Cisco CCNA exam](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html) confirms its listed version, duration, languages and price; [Cisco refresh announcement](https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh) states the 2/3 February 2027 boundary. |
| Scoring, confidentiality, ID and retakes | [Cisco exam policies](https://www.cisco.com/site/us/en/learn/training-certifications/exams/policies.html) supports the scoped, date-checked statements. The lesson sends learners to their appointment's admission rules. |
| Online delivery | [Pearson VUE Cisco OnVUE](https://www.pearsonvue.com/us/en/cisco/onvue.html) confirms system-test, identity, single-screen/private-space, VPN/VM, check-in and digital-whiteboard conditions. |
| Recertification and item navigation | [Cisco recertification](https://www.cisco.com/site/us/en/learn/training-certifications/certifications/recertification/index.html) supports the current cycle/associate CE requirement; [Cisco performance-item introduction](https://blogs.cisco.com/learning/new-performance-based-lab-exam-items-build-opportunities) supports the described formats and forward-only navigation while the lesson defers to current instructions. |
| OSPFv3 identifiers and next-hop scope | [RFC 5340](https://www.rfc-editor.org/rfc/rfc5340.html), sections 2.2 and 2.5, supports the 32-bit identifiers and IPv6 link-local use. |
| Static-host DAI | [Cisco Catalyst 9300 IOS XE 17.12 DAI guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_dynamic_arp_inspection.html) documents ARP ACL validation for static hosts while preserving untrusted client ingress. |
| SCP server identity | [Cisco IOS XE 17.16 SSH server authentication](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-16/configuration_guide/sec/b_1716_sec_9300_cg/secure_shell_version_2_support.html) distinguishes server host-key authentication from encryption and client-user authentication. |
| Actual Ansible command output | [Official cisco.ios ios_command source](https://raw.githubusercontent.com/ansible-collections/cisco.ios/main/plugins/modules/ios_command.py) documents operational commands and ordered outputs; changed=false alone does not establish collection success. The exact-version source URL returned a fetch error, so the maintained official source was used for these stable module semantics. |

No Packet Tracer, CML, IOS, remote Ansible or exam-delivery execution was performed by this reviewer. The source/semantic review does not replace device execution. App rendering, interactions, identity-ledger integration and production build remain root's separate checks. The reviewer did not edit the root-owned chapter assets.

