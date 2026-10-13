# Chapters 00–01 content review

Reviewed 19 September 2026. Scope: lessons, guided labs, all checkpoint prompts/options/answers/explanations, flashcards, and command drills. These chapters did not contain troubleshooting-ticket banks; their guided faults and recovery exercises were rewritten in the labs.

## Editorial approach

Use direct, professional explanations with explicit assumptions and observable outcomes. Preserve networking terms, explain them when introduced, and develop mechanisms before asking learners to diagnose them. Avoid invented personal credentials, exam guarantees, simulator guarantees, cutesy metaphors, and unsupported claims about what a single test proves.

## Chapter 00: Start here

- Replaced speculative exam-delivery rules, memorized administration trivia, fixed study-hour promises, and blanket simulator-compatibility statements with the current Cisco blueprint dates, objective verbs, official installation guidance, and an evidence-based study workflow.
- Preserved IOS modes, context help, paging, parser errors, save direction, active versus startup configuration, and controlled reload practice.
- Distinguished device configuration, Packet Tracer project saving, and browser progress backups.
- Qualified startup storage by platform and DNS-lookup configuration by operational need.
- Removed the factory-reset drill: erasing startup configuration does not universally erase every persistent switch setting or file.
- Added a controlled shutdown/recovery exercise with expected observations, complete addressing/cabling instructions, and separate final verification.
- Preserved the existing seven lesson section headings and eight numeric lab-step identities.

Primary sources reviewed:

| Claim group | Source |
|---|---|
| Current CCNA exam and duration | [Cisco CCNA exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html) |
| v1.1 last day / v2.0 first day | [Cisco refresh guidance](https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh) |
| Objective scope and weights | [v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf), [v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| Packet Tracer installation and platforms | [Cisco installation instructions](https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf) |
| CLI modes, help, abbreviation, paging | [Cisco IOS CLI guide](https://www.cisco.com/c/en/us/td/docs/ios/fundamentals/configuration/guide/12_2sr/cf_12_2sr_book/cf_cli-basics.html) |
| Configuration files and storage distinctions | [Cisco configuration-file guide](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/system-management/system-management/m_cm-config-files-0.html) |

## Chapter 01: Network models

- Rebuilt the OSI/TCP-IP explanation around protocol functions and troubleshooting evidence.
- Corrected fixed IPv4/TCP header lengths to minimum lengths, qualified untagged Ethernet frame accounting, and distinguished ICMP and ARP from TCP/UDP conversations.
- Made the simple-host next-hop assumptions explicit; additional routes can change the forwarding decision.
- Corrected broadcast flooding scope, switch MAC preservation, routed frame replacement, TTL interpretation, ARP-table evidence, and return-path requirements.
- Removed OS-default TTL memorization, ARP opcode/EtherType/protocol-number trivia from this opening assessment, and a mandatory proxy-ARP configuration exercise. Proxy ARP remains brief supporting context for why a working ping does not validate a mask.
- Replaced the direct router-to-PC leg with a clearly specified second switch so lesson and lab use the same two-LAN structure.
- Added initial-capture ordering, cached-ARP handling, a deterministic incorrect-gateway fault, explicit restoration, and a same-subnet challenge.
- Preserved eight lesson section headings and eight numeric lab-step identities.

Primary sources reviewed:

| Claim group | Source |
|---|---|
| Host communication layers and local forwarding | [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122) |
| ARP request/reply and mapping behavior | [RFC 826](https://www.rfc-editor.org/rfc/rfc826) |
| IPv4 headers and TTL | [RFC 791](https://www.rfc-editor.org/rfc/rfc791), [RFC 1812](https://www.rfc-editor.org/rfc/rfc1812) |
| ICMP reachability and route tracing | [Cisco ping/traceroute guide](https://www.cisco.com/c/en/us/support/docs/ios-nx-os-software/ios-software-releases-121-mainline/12778-ping-traceroute.html), [extended tests](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html) |

## Assessment identities

Existing IDs remain when the assessed concept is unchanged, including corrections to wording and explanations. Unrelated replacements receive new IDs so they do not inherit a learner's old mastery or spaced-repetition state.

| Chapter | Retired | New |
|---|---|---|
| 00 questions | start-here-q23 | start-here-q24 |
| 00 cards | start-here-c24 | start-here-c31 |
| 01 questions | network-models-q13 | network-models-q16 |
| 01 cards | network-models-c07, c08, c12, c16 | network-models-c22, c23, c24, c25 |
| 01 drills | network-models-d05, d08 | network-models-d12, d13 |

Chapter 00 has 15 questions, 18 cards, and 12 drills. Chapter 01 has 15 questions, 20 cards, and 11 drills. The final audit index records consolidated validation results.

An independent review of all ten files found no material protocol or address-plan errors. It identified a repeated save-prompt instruction and answer-position clustering; both were corrected. Single-answer positions are now balanced without a repeating sequence, and multi-answer combinations vary. Browser review also identified an unescaped `<cr>` help marker; lesson and assessment Markdown now display it literally. Interactive save prompts and subsequent verification commands are separated for usable copying.

## Limits of verification

Protocol and command claims were checked against primary documentation. Packet Tracer was not executed during this review; exact simulator output, event timing, and command availability are not represented as live-tested. Output examples are explicitly representative, and the lab instructions describe what to inspect when an image differs.
