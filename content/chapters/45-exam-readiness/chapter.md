---
id: exam-readiness
number: 45
title: Exam readiness
subtitle: Check your skills against the right blueprint, rehearse unfamiliar tasks, and prepare for the appointment.
part: capstone
domain: none
minutes: { lesson: 55, lab: 120 }
summary: Build an evidence-based revision plan, practise timed configuration and interpretation, and check the official exam and delivery requirements.
objectives:
  v1: []
  v2: []
prereqs: [capstone-branch-network, wireless-security-config, ansible-terraform, ai-in-network-operations]
sectionIds:
  Confirm the appointment requirements: what-you-are-walking-into
  Choose the correct blueprint: two-blueprints-one-exam-number
  Work through items deliberately: pacing-and-question-attack
  Measure readiness with evidence: rate-yourself-by-domain
  Review rules with their conditions: the-numbers-to-memorise
  Plan the final revision period: the-final-two-weeks
  Exam day and next steps: exam-day-and-after
  Numbers to know: numbers-to-know
sources:
  - { title: "Cisco: CCNA 200-301 exam", url: "https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html" }
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: Stay on track before the CCNA refresh", url: "https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh" }
  - { title: "Cisco: Performance-based exam items", url: "https://blogs.cisco.com/learning/new-performance-based-lab-exam-items-build-opportunities" }
  - { title: "Cisco: Exam and certification policies", url: "https://www.cisco.com/site/us/en/learn/training-certifications/exams/policies.html" }
  - { title: "Cisco: Recertification policy", url: "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/recertification/index.html" }
  - { title: "Pearson VUE: Cisco OnVUE requirements", url: "https://www.pearsonvue.com/us/en/cisco/onvue.html" }
---
You have finished the lessons and the capstone. The exam will not ask whether you finished. It will show you a routing table, a topology or a broken configuration you have never seen, and it will expect a decision against the clock. Being ready means you can apply what you know when the addresses, outputs and requirements change.

This chapter turns the whole course into a revision plan. You will confirm the practical details of your appointment, pick the blueprint that applies on your exam date, practise a method for working through questions and lab items, rate yourself by domain from evidence instead of feeling, and lay out the final two weeks. The checkpoint questions sample every part of the course. They are practice, not a mock exam or a prediction of your score.

## Confirm the appointment requirements

:::facts
- As checked on **24 September 2026**, Cisco lists CCNA **200-301 v1.1** at **120 minutes**, in English or Japanese, with a listed price of **US$300**. Confirm the amount, applicable taxes, eligibility and allotted time when booking.
- Cisco announces **v2.0 for 3 February 2027**; v1.1 remains the published track through **2 February 2027**.
- Cisco does not publish a fixed passing score. Course percentages and completion badges are not Cisco scores.
- Prepare to interpret, configure and troubleshoot according to your selected blueprint. Do not base pacing on a promised item count or a fixed number of labs.
:::

Use the [official exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html) to reach scheduling. Check the appointment's exam, date, time zone, language and delivery method. Resolve profile or identification discrepancies before exam day. Keep the confirmation and the instructions that apply to that appointment; rescheduling deadlines can differ by delivery method, so an old blanket “24-hour rule” is not a sufficient reference.

For a test center, Cisco's published policy calls for two forms of identification with signatures, including a government-issued photo ID. Read the appointment's country-specific admission instructions. Online delivery has its own ID and equipment rules; do not assume the two processes are interchangeable.

For OnVUE, run the [Cisco program's system test](https://www.pearsonvue.com/us/en/cisco/onvue.html) on the actual computer and connection you intend to use. Its current rules require an approved single-screen setup, camera, microphone and speakers, and prohibit VPNs and virtual machines. It provides a digital whiteboard; ordinary paper notes are not allowed. Follow the current program page for exceptions and accommodations. A successful system test is preparation, not permission to leave other prohibited software running.

Keep appointment logistics on a separate checklist from technical revision. A subnetting exercise will not uncover an expired ID, a wrong time zone or an unsupported laptop. Checking those items early gives you time to resolve them without disrupting your study plan.

## Choose the correct blueprint

An **exam blueprint** states the skill areas and their relative weights. The verbs matter: “describe” calls for an explanation, “interpret” calls for reading evidence, and “configure” or “troubleshoot” requires practical work. A familiar acronym alone is not evidence that you can perform the requested task.

The two versions use the same exam number but different domain groupings. These are separate lists, not a row-by-row equivalence:

| v1.1 domain | Weight | v2.0 domain | Weight |
|---|---:|---|---:|
| Network Fundamentals | 20% | Network Infrastructure and Connectivity | 25% |
| Network Access | 20% | Switching and Network Access | 25% |
| IP Connectivity | 25% | IP Routing | 20% |
| IP Services | 10% | Network Services and Security | 20% |
| Security Fundamentals | 15% | AI, and Network Operations and Management | 10% |
| Automation and Programmability | 10% | — | — |

Read the actual [v1.1](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) or [v2.0](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) topic list. V2.0 explicitly adds or changes depth around OSPFv3, secure file transfer, DNS diagnosis, Ansible command execution and AI-assisted operations. It does not list every older objective, such as the v1.1 WLAN GUI configuration task. Foundational knowledge remains useful, but revision priorities should follow the applicable list.

Use this app's track selection and Blueprint map to locate lessons and practice. A chapter may provide supporting knowledge without a direct objective tag. Likewise, one tagged question covers only one aspect of an objective; it does not certify that the whole skill has been learned. The capstone combines several topics but does not exercise every blueprint item.

```diagram
{"type":"sequence","title":"Fig 45.1 — From objective to evidence","actors":["Blueprint","Practice","Review"],"steps":[{"from":0,"to":1,"label":"Choose the verb and topic","note":"For example: configure an IPv4 ACL"},{"from":1,"to":2,"label":"Record a new attempt","note":"Configuration plus allowed and denied traffic tests","accent":true},{"from":2,"to":1,"label":"Change the scenario and repeat","note":"Different subnet, direction or service"}],"caption":"A repeatable result on a changed scenario is stronger evidence than recognizing an answer you have memorized."}
```

## Work through items deliberately

Cisco's published introduction to performance-based items describes labs alongside multiple-choice and drag-and-drop formats, and states that candidates cannot return to a previous item after moving on. Read the current tutorial and the on-screen instructions before testing. The introduction's historical design estimate is not a guaranteed time allowance for each future lab. It does not establish a fixed lab order, universal partial-credit formula or exact number of questions.

Practise making a decision before advancing. For a selected-response item, identify what is asked, note how many answers are required, and eliminate choices using the evidence. Do not spend the whole budget trying to infer undocumented scoring. If uncertain, choose the best-supported response consistent with the item instructions and move on.

For a configuration task, read the requirements, topology and restrictions before changing anything. Confirm the device and mode, inspect relevant existing state, make the requested change, and verify its effect. A command can be syntactically accepted while producing the wrong behavior. Save when the instructions require persistence; this course does not assert an undocumented grading rule for running versus startup configuration.

```ios R1
R1# show ip interface brief
R1# show ip route
```

These are examples of useful inspection commands, not mandatory first commands for every task. If the problem is a switchport's VLAN, begin with the relevant switch evidence instead. Read the destination and prefix lengths before comparing the route attributes in this **authored, abbreviated** example:

```output Representative R1 routing entries
S* 0.0.0.0/0 [1/0] via 203.0.113.1
O  10.1.0.0/16 [110/20] via 10.9.9.1
S  10.1.3.0/24 [1/0] via 10.9.9.2
>> O  10.1.3.64/26 [110/30] via 10.9.9.3  ← destination 10.1.3.77 matches this most-specific prefix
C  10.9.9.0/24 is directly connected, GigabitEthernet0/0/0
```

For ordinary destination-based forwarding, `/26` wins over `/24`, `/16` and the default for `10.1.3.77`. Administrative distance helps choose route sources for the same prefix; it does not let a less-specific static route override that installed `/26`. A forwarding decision also does not prove the remote host has a return path.

Use **remaining time divided by remaining items** as a rough checkpoint when the interface supplies those values. For example, 60 minutes for 40 items averages 90 seconds each. That is a planning average, not an equal budget: an output question may take seconds and a lab several minutes. Reassess periodically and avoid a rigid “finish item 70 by minute 90” rule based on an invented exam length.

:::trap A correct answer for the wrong reason
If you chose the `/26` because “OSPF beats static,” record a learning gap even though you selected the right next hop. A different prefix arrangement will expose that misunderstanding. During practice, explain why the closest competing choice fails.
:::

## Measure readiness with evidence

Use a small **evidence ledger** for each objective. Record the task, date, result, help used and next action. “Read Chapter 21” describes activity. “Built an OSPF neighbor relationship, identified a passive-link fault, then verified the remote prefix” describes demonstrated work.

A **failed** check was attempted and did not meet its success condition. An **unperformed** check has no observation yet; it must not be recorded as a success or diagnosed as a network failure. Keep simulator limitations visible too. That distinction lets you choose between remediation, another independent attempt and access to a supported lab environment.

| Level | Evidence for the objective's stated verb |
|---|---|
| 0 | Cannot explain or attempt it yet |
| 1 | Can complete it with notes, worked examples or hints |
| 2 | Can complete a familiar variation independently and explain the result |
| 3 | Can handle a changed scenario, verify it and explain plausible wrong alternatives |

A descriptive objective does not require configuring a feature that its blueprint only asks you to explain. For example, compare hypervisors, VMs and containers through a deployment scenario. For a configuration objective, an explanation alone is insufficient: create the state and inspect it. For troubleshooting, begin with a symptom and show how the evidence narrows the fault.

You can summarize revision needs with a weighted score: `sum(domain weight × level / 3)`. For v2.0 levels `2, 2, 3, 2, 1`, the result is `(25×2 + 25×2 + 20×3 + 20×2 + 10×1)/3 = 70%`. This is a course planning measure, **not a calibrated probability of passing**. Keep the per-objective gaps visible; a strong domain average can conceal one unpractised required skill.

Prioritize by both importance and weakness. A simple planning measure is `domain weight × (3 − level)`. A 25%-weight domain at level 1 scores 50; a 10%-weight domain at level 2 scores 10. The ratio is five, not four. It suggests where effort may help, but does not prescribe exact hours or justify ignoring an entire lower-weight domain.

Separate first attempts from repeated attempts. Repeated practice is useful for fluency, while fresh scenarios help assess transfer. Review wrong answers and correct guesses, then wait before trying a changed example. A high score immediately after reading an explanation is weak evidence of durable recall.

## Review rules with their conditions

Build a compact personal reference from your actual errors. Keep the condition next to every number: “OSPF broadcast default hello/dead 10/40 seconds” is useful; “OSPF is 10/40” hides other network types and configurable intervals. Use the earlier chapter as the authority when a short flashcard needs explanation.

The mixed checkpoint draws on the whole course, including skills that the IPv4 capstone did not exercise. The review links below lead back to their teaching owners. Complete a missing lesson or lab before counting a guessed answer as readiness; this chapter introduces a review process, not a new set of networking mechanisms.

| Review area | Useful self-check | Course reference |
|---|---|---|
| Physical links and clients | Separate duplex/counter evidence from address or gateway faults | [Cabling and interfaces](#/chapter/cabling-and-interfaces), [Client troubleshooting](#/chapter/client-os-troubleshooting) |
| IPv4 and IPv6 | Derive a range, choose a route, distinguish prefix from interface identifier | [Subnetting](#/chapter/subnetting-vlsm), [IPv6](#/chapter/ipv6-addressing) |
| Switching | Trace VLAN tags and calculate a root path using the stated costs | [Trunks](#/chapter/trunks-dtp), [Spanning tree](#/chapter/spanning-tree) |
| Routing | Explain neighbor state separately from route installation and return reachability | [OSPFv2](#/chapter/ospfv2), [OSPFv3](#/chapter/ospfv3), [FHRP](#/chapter/fhrp-hsrp-vrrp) |
| Services | Distinguish lease, name resolution, time synchronization and translation evidence | [DHCP](#/chapter/dhcp), [DNS](#/chapter/dns), [NAT/PAT](#/chapter/nat-pat) |
| Security | Evaluate both directions of a flow; distinguish authentication from authorization | [ACLs](#/chapter/acls), [AAA](#/chapter/aaa-tacacs-radius), [VPNs](#/chapter/vpns-ipsec) |
| Access and file protection | Check port-security state, snooping/ARP bindings and the identity of a file-transfer peer | [Layer 2 security](#/chapter/layer2-security), [File management](#/chapter/file-management) |
| Wireless | Separate radio selection, security negotiation and IP configuration | [Wireless principles](#/chapter/wireless-principles), [WLAN security](#/chapter/wireless-security-config) |
| Virtualization and management | Identify the kernel boundary, route context, plane and API participants | [Virtualization](#/chapter/virtualization), [Network management](#/chapter/network-management-and-sdn) |
| Automation | Interpret structured data, target a command safely and evaluate generated advice | [REST/JSON](#/chapter/rest-apis-json), [Ansible](#/chapter/ansible-terraform), [AI](#/chapter/ai-in-network-operations) |

For each missed rule, create one changed example. After misreading an ACL wildcard, calculate a different block and test its first and last matching addresses. After confusing a NAT selector with a filter, trace a packet that does not match the selector. After confusing association with useful wireless connectivity, identify which additional evidence would establish IP reachability.

Avoid turning the final review into an unbounded list of obscure defaults. Concentrate on the values and mechanisms that support the published tasks. Be able to use command help during practice and to interpret output even when spacing, counters or interface names differ from a screenshot.

## Plan the final revision period

The following two-week schedule is a suggested study arrangement, not a claim that fourteen days will repair any skill gap. Adjust it around your evidence ledger and available time. If major configuration objectives remain unpractised, allocate more preparation rather than repeatedly taking the same question bank.

| Days before the appointment | Main work | Record before moving on |
|---|---|---|
| 14–12 | Review the correct blueprint; sample each domain with unfamiliar work | Missing objectives and three priorities |
| 11–8 | Rebuild weak topics; practise one fault at a time | Commands, evidence, cause and recovery |
| 7 | Rehearse a timed mixed session using legitimate practice material | Time used, misses and correct guesses |
| 6–4 | Review each miss; repeat with different values or requirements | Evidence that the underlying error is resolved |
| 3–2 | Complete another bounded rehearsal and the appointment checklist | Remaining gaps and a realistic next step |
| 1 | Brief retrieval practice, logistics and rest | Ready equipment, identification and appointment details |

Use a reasonable session length and stop to analyse repeated mistakes. Rushing through twenty nearly identical questions can reinforce a bad shortcut. One carefully explained failure and a successful changed example can be more valuable.

The guided lab below offers a small independent build, a verification checklist and a separate reference solution. Attempt the specification before reading the solution. Record elapsed time without treating this exercise's duration or point total as Cisco's grading scheme. The wireless, IPv6, automation and other tasks omitted from that topology still need their own evidence.

## Exam day and next steps

Review your appointment instructions before leaving or beginning check-in. For online delivery, Pearson currently asks candidates to start check-in 30 minutes early. Stay within the proctor's rules, and do not assume an unscheduled break is permitted. Raise delivery problems through the provided help channel; do not spend the remaining exam time silently troubleshooting the exam computer.

Cisco provides an exam score report with performance information. Use the official record rather than trying to reverse-engineer a passing score from domain percentages. If unsuccessful, identify the weakest objectives and repeat relevant work with new evidence. Cisco's current policy requires five calendar days of waiting, counted from the day after a failed associate attempt; a passed exam with the same number has a 180-day minimum retake interval.

CCNA is valid for three years. To recertify, do one of two things before it expires: pass the current CCNA exam or any higher-level Cisco certification exam, or earn 30 Continuing Education credits from approved training. Cisco does not grant extensions. The exams and activities that count are listed in the [current recertification policy](https://www.cisco.com/site/us/en/learn/training-certifications/certifications/recertification/index.html); check it before you book, then confirm the new expiry date in your Cisco account afterwards.

Continue practising useful small changes: a new VLAN, a verified route, a narrowly scoped ACL or an inventory command. Keep your own configurations and explanations, while respecting Cisco's confidentiality rules for actual exam material. The course's questions are original teaching exercises, not recalled examination items.

## Numbers to know

Each value states its condition; the chapter column leads back to the lesson that teaches it.

**Ports and protocol numbers**

| Service | Transport and number | Ch |
|---|---|---|
| FTP control / active data | TCP 21 / TCP 20 | 06, 29 |
| SSH, SCP, SFTP / Telnet | TCP 22 / TCP 23 | 06, 08, 29 |
| SMTP | TCP 25 | 06 |
| TACACS+ | TCP 49 | 06, 33 |
| DNS | UDP and TCP 53 | 06, 25 |
| DHCPv4 server / client | UDP 67 / UDP 68 | 06, 24 |
| TFTP | UDP 69 | 06, 29 |
| HTTP / HTTPS | TCP 80 / TCP 443 | 06 |
| NTP | UDP 123 | 06, 27 |
| SNMP agent / notifications | UDP 161 / UDP 162 | 06, 27 |
| Syslog | UDP 514 | 06, 27 |
| RADIUS auth / accounting (legacy) | UDP 1812 / 1813 (1645 / 1646) | 33 |
| HSRP | UDP 1985 | 23 |
| OSPFv2 / OSPFv3 | IP protocol 89 / Next Header 89 | 21, 22 |
| VRRP | IP protocol 112 | 23 |
| ESP / AH / GRE | IP protocol 50 / 51 / 47 | 35 |
| Port ranges | well-known 0–1023, registered 1024–49151, dynamic 49152–65535 | 06 |

**IPv4 ranges**

| Range | Meaning | Ch |
|---|---|---|
| 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 | RFC 1918 private | 05, 26 |
| 127.0.0.0/8 | Loopback | 05 |
| 169.254.0.0/16 | Link-local; no DHCP lease (APIPA) | 05, 24, 30 |
| 100.64.0.0/10 | Shared space for provider NAT | 05 |
| 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 | Documentation | 05 |
| 224.0.0.0/4 | Multicast | 05 |
| /31, /32 | Point-to-point pair; one host | 04 |

**IPv6**

| Prefix or address | Meaning | Ch |
|---|---|---|
| 2000::/3 | Global unicast | 19 |
| 2001:db8::/32 | Documentation | 19 |
| fc00::/7 (in use: fd00::/8) | Unique local | 19 |
| fe80::/10 | Link-local | 19 |
| ff00::/8 | Multicast | 19 |
| ::1/128, ::/128 | Loopback, unspecified | 19 |
| ::/0, /128, /64 | Default route, host route, SLAAC LAN | 19, 20 |
| ff02::1, ff02::2 | All nodes, all routers | 19 |
| ff02::1:ff00:0/104 | Solicited-node, plus the last 24 bits | 19 |
| ff02::5, ff02::6 | OSPFv3 routers, DR/BDR | 22 |
| RS 133, RA 134, NS 135, NA 136 | ICMPv6 types | 19 |

**Administrative distance (Ch 17, 18, 24)**

| Connected | Static | eBGP | EIGRP | OSPF | RIP | External EIGRP | iBGP | DHCP default | Never installed |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 20 | 90 | 110 | 120 | 170 | 200 | 254 | 255 |

**Spanning tree (Ch 14, 15)**

| Item | Value |
|---|---|
| Priority | Default 32768, range 0–61440 in steps of 4096, plus VLAN ID |
| Short cost | 10 Mbps 100, 100 Mbps 19, 1 Gbps 4, 10 Gbps 2 |
| Long cost | 2,000,000 / 200,000 / 20,000 / 2,000 |
| Timers | Hello 2, max age 20, forward delay 15 seconds |
| RSTP states | Discarding, learning, forwarding |
| Roles | Root, designated (forwarding); alternate, backup (discarding) |
| Errdisable recovery | Interval 300 seconds (30–86400); every cause off by default |

**VLANs, trunks and EtherChannel**

| Item | Value | Ch |
|---|---|---|
| Normal / extended range | 1–1005 / 1006–4094; 0 and 4095 reserved | 09, 10 |
| Default VLANs | 1 and 1002–1005, cannot be deleted | 09 |
| 802.1Q | 4-byte tag, 12-bit VID, native VLAN 1 untagged | 10 |
| DTP default (2960) | dynamic auto | 10 |
| LACP / PAgP | active–passive / desirable–auto; `on` is static | 13 |
| Bundle | At most 8 active members | 13 |
| CDP / LLDP | On, 60/180 s / off, 30/120 s | 12 |

**OSPF (Ch 21, 22)**

| Item | Value |
|---|---|
| Hello / dead | 10 / 40 seconds on broadcast and point-to-point |
| Multicast | 224.0.0.5 all routers, 224.0.0.6 DR/BDR |
| Interface priority | 1; 0 never DR/BDR; highest wins |
| Reference bandwidth | 100 Mbps; cost = reference ÷ interface bandwidth, minimum 1 |
| Router ID | `router-id`, then highest loopback, then highest other interface |

**First-hop redundancy (Ch 23)**

| | HSRP | VRRP |
|---|---|---|
| Priority | 100 | 100 (owner 255) |
| Timers | Hello 3 s, hold 10 s | Advertisement 1 s |
| Preemption | Off | On |
| Multicast | 224.0.0.2 (v1), 224.0.0.102 (v2) | 224.0.0.18 |
| Virtual MAC | 0000.0c07.acXX (v1), 0000.0c9f.fXXX (v2) | 0000.5e00.01XX |
| Groups | 0–255 (v1), 0–4095 (v2) | |
| Tracking decrement | 10 by default | |

**Services**

| Item | Value | Ch |
|---|---|---|
| DHCP renew / rebind | T1 50%, T2 87.5% of lease; IOS lease 1 day | 24 |
| NAT terms | Inside local, inside global (translated host), outside local, outside global | 26 |
| NTP stratum | `ntp master` default 8; client = server + 1; 16 unsynchronized | 27 |
| SNMP | v1/v2c communities; v3 noAuthNoPriv, authNoPriv, authPriv | 27 |

**Syslog severity (Ch 27, 31)**

| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| emergencies | alerts | critical | errors | warnings | notifications | informational | debugging |

**Security**

| Item | Value | Ch |
|---|---|---|
| Port security | Off; when on: maximum 1, violation shutdown, aging 0, sticky off | 16 |
| DAI untrusted rate | 15 ARP packets/s; DHCP snooping unlimited until set | 16 |
| Snooping and DAI trust | All ports untrusted by default | 16 |
| Standard / extended ACL numbers | 1–99, 1300–1999 / 100–199, 2000–2699 | 34 |
| IKE / NAT-T | UDP 500 / UDP 4500 | 35 |

**Wireless (Ch 36, 37, 38)**

| Item | Value |
|---|---|
| 2.4 GHz only | 802.11b, 802.11g |
| 5 GHz only | 802.11a, 802.11ac (Wi-Fi 5) |
| Both | 802.11n (Wi-Fi 4), 802.11ax (Wi-Fi 6; 6 GHz as 6E) |
| Non-overlapping 2.4 GHz | Channels 1, 6, 11 |
| CAPWAP | UDP 5246 control (DTLS), UDP 5247 data |
| Ciphers | WEP RC4, WPA TKIP, WPA2 AES-CCMP, WPA3 SAE with PMF |
| PSK length | ASCII 8–63 characters, or 64 hex digits |

**PoE and cabling (Ch 02, 03, 09)**

| Item | Value |
|---|---|
| 802.3af / 802.3at | 15.4 W / 30 W at the port (12.95 W / 25.5 W at the device) |
| 802.3bt Type 3 / Type 4 | 60 W / 90 W at the port |
| Twisted pair | 100 m; 10GBASE-T needs Cat6A (Cat6 about 55 m) |
| Pairs | 100BASE-TX 2, 1000BASE-T 4 |
| Fiber | 1000BASE-SX MMF up to 550 m; LX/LH and 10GBASE-LR SMF 10 km |

**Management and automation (Ch 08, 29, 40, 41)**

| Item | Value |
|---|---|
| SSH / Telnet | TCP 22 / TCP 23 |
| NETCONF | XML over SSH, TCP 830 |
| RESTCONF | HTTPS (TCP 443), JSON or XML |
| VXLAN | UDP 4789, 24-bit VNI, 50 bytes overhead |
| HTTP status | 2xx success, 4xx client error, 5xx server error |
| Specific codes | 202 accepted, 401 authentication, 403 authorization, 404 not found |

## Exam focus

- Choose the blueprint for the actual appointment date and use its objective verbs.
- Demonstrate the requested skill with fresh evidence; reading completion and repeated-question scores have limits.
- Read the whole task, inspect the existing state, make the required change and verify it.
- Pace from the current instructions and remaining work, not a promised lab order or question count.
- Review the reasoning behind correct guesses as well as wrong answers.
- Use official appointment and policy pages for logistics; the networking facts in this chapter's mixed practice link back to their teaching chapters.
