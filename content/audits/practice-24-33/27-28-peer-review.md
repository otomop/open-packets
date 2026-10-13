# Independent peer review: chapters 27–28

Reviewed September 24, 2026 by the author of chapters 24–26, independently of the 27–28 author. This was a read-only review of the chapter assets. Corrections were sent to their owner and the saved resolutions were reread.

## Scope and outcome

Read every question, option, key, explanation and wrong-option explanation; every flashcard, command drill and incident ticket including its complete repair; and both full labs with all prerequisites, expected/solution containers, fault/recovery states and independent challenges. Read lesson frontmatter and relevant context for scope. Inventory: 43 questions, 41 cards, 12 command drills, four tickets and 25 guided steps across the two chapters.

No unresolved wrong answer, ambiguous keyed result, arithmetic error, interface-direction contradiction, missing primary service setup or material repair-sequence defect was found.

Chapter 27's three checkpoints distinguish time source selection, event generation/delivery and managed-object reads. Its source fault, loopback event and community mismatch preserve the management path and have separate restoration. SNMP setup is supplied preparation rather than a claimed deployment objective. The branch challenge correctly refuses to align unsynchronized router timestamps precisely with the manager's independent clock.

Chapter 28 appropriately makes explanation and supplied policy evidence the required practice for v1.1 4.7. The optional device marking exercise is not mislabeled as required production configuration, and no fabricated v2 objective has been added. Its input-direction fault separates requests from replies, so a successful ping or nonzero aggregate counter cannot substitute for the intended packet observation. The independent burst/trust case requires two distinct corrections and a service-level retest.

## Findings resolved by the owner

- **ntp-syslog-snmp-q27:** changed from demand 2 to 1. The selected-peer marker and matching local reference explicitly give the requested source.
- **ntp-syslog-snmp-q26:** changed from 3 to 2. Correcting the expressly identified authorized manager from .60 to .61 is a direct repair, with read-only scope retained.
- **qos-q04:** changed from 2 to 1. The question retrieves the taught policing/shaping comparison without a new constraint set.
- **qos-q05:** changed from 2 to 1. The displayed action explicitly says to remark and transmit with AF13.
- **qos-q13:** changed from 2 to 1. This asks for the taught meaning of the bandwidth minimum.
- **Chapter 27 lab Step 13:** now explicitly completes R2's filename prompt and waits for the copy, then completes each R1/SW1 prompt before moving on.

Reread all five saved difficulty values, the sorted progression in each question array and the complete amended save step. The owner also updated its ledger/report. These refinements do not change the correct keys.

## Independent technical checks

- NTP source stratum 8 → synchronized client 9; approved alternate stratum 2 → R1 3 → R2 4. Peer stratum and local stratum are not conflated.
- Reach 377 is an eight-poll octal history, not 377 lifetime replies or proof of clock accuracy. A reply history alone does not establish selection of a usable source.
- Syslog thresholds include the boundary and all lower severity numbers. Sender eligibility, transport delivery and collector retention are kept separate.
- The timestamp asterisk is described as nonauthoritative, without claiming the router has never synchronized.
- SNMP manager/agent roles, Get versus Set, v2c operations, inform response behavior, read-only rights and source ACL scope are consistent. Counter subtraction is conditioned on one continuous instance.
- Management rate examples independently compute 10 Mbit/s and 12 Mbit/s, respectively 10% and 12% of the stated directional rates.
- Supplied voice rate: (160 + 40) bytes × 8 / 0.020 s = 80,000 bit/s per call, so two calls exceed 128 kb/s before extra framing.
- AF32 = 28; AF21 = 18 and with ECN zero its service byte is 72 = 0x48.
- 1,500 bytes at 1 Mb/s gives 12 ms serialization under the stated no-extra-overhead assumption.
- QoS counter deltas are 900 − 400 = 500 and 920 − 200 = 720.
- Classic IOS priority behavior is explicitly scoped to congestion; bandwidth is a minimum share, not an unconditional ceiling. Policer actions are read rather than universally equated with drop; shaping uses finite buffering.
- Legacy 2960 trust behavior is labeled as a legacy platform case. The proposed narrow phone-port repair does not claim that marking alone establishes end-to-end voice quality.

## Primary checks reopened

- [Cisco NTP associations](https://www.cisco.com/c/en/us/support/docs/technical-details/220303-verify-ntp-status-with-the-show-ntp-asso.html)
- [Cisco system-message logging](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/configuring_system_message_logs.html)
- [Cisco service timestamps command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/R_through_setup.html)
- [RFC 3416: SNMP operations](https://www.rfc-editor.org/rfc/rfc3416.html)
- [RFC 2474: DS field](https://www.rfc-editor.org/rfc/rfc2474.html)
- [RFC 2597: Assured Forwarding](https://www.rfc-editor.org/rfc/rfc2597.html)
- [Cisco policing versus shaping](https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-policing/19645-policevsshape.html)
- [Cisco bandwidth versus priority](https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-packet-marking/10100-priorityvsbw.html)

## Limits

This is a substantive static content and primary-source review, plus nine independent arithmetic checks. No Packet Tracer/CML/router, live SNMP/NTP/syslog exchange, traffic load, radio, browser rendering, build or real packet-capture experiment was executed by this reviewer. The labs accurately retain representative-output labels, alternate worksheets and platform-support limits. This review cannot certify a particular simulator release or predict measured application quality.

