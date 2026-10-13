# Chapters 26–27: content and lab review

Reviewed 20 September 2026 against the official CCNA v1.1 and v2.0 exam-topic PDFs and the primary references linked in each lesson. This is a source and instructional review; no Packet Tracer or IOS device execution is claimed.

## 26 — NAT and PAT

The chapter now progresses from address vocabulary through static NAT, dynamic pools, interface/pool overload, platform behavior and verification. Static NAT and pools map to v1.1 4.1; IOS XE NAT/PAT maps to v2.0 4.3. Advanced translation modes and capacity planning are outside the required lesson.

Corrected the distinction between translation, routing and filtering. Private addresses can be routed without NAT; a NAT rule does not supply a route or make a firewall. A source ACL selects traffic for the stated translation rule, and a deny in that selector is not an interface drop rule. Inside-global addresses need not be public. A translation entry alone does not prove a completed connection or its initiator, and a protocol field of `---` is not unique to static NAT.

Removed universal claims about allocation order, PAT capacity, hardware acceleration, port preservation and diagnosis from one missing reply. Distinguished ICMP query identifiers from the IPv4 Identification field. Scoped timeout examples to the referenced implementation and distinguished dynamic-state clearing from removal of static configuration. Verification follows both directions, including routing to separately allocated global addresses.

Rebuilt the lab with two ISR 4331 routers, explicit endpoint/switch setup and a separately routed translation block. Twelve steps cover a working IP baseline, static NAT, a missing return route, pool exhaustion, interface/pool PAT, a wrong source selector, state aging and restoration. Each deliberate fault has a separate repair. The challenge adds a single static TCP port mapping and verifies it from the outside. Documentation ranges are confined to the isolated lab. Unsupported simulator functions are explicitly recorded or completed as worksheets.

Rewrote all existing questions and distractor explanations, cards, command notes and tickets. Added a subnet/return-route question. The two tickets now include enough evidence to support a source-selector fault or an upstream return-route fault without claiming that any timeout proves those causes.

Identity: chapter ID, number, existing assessment IDs and same-topic reading-section IDs are preserved. Renamed sections have explicit mappings. Lab steps were rebuilt; their positional completion markers do not certify completion of the revised exercise.

## 27 — NTP, syslog and SNMP

The lesson now introduces the role of each service, explains the NTP hierarchy and configuration, then covers syslog records/destinations and SNMP operations/security. Added the transport/ports chapter as a prerequisite. NTP configuration is required by v1.1 4.2; SNMP and syslog map to v1.1 4.4/4.5 and v2.0 5.4/5.6. Detailed SNMP deployment is supporting practice rather than a new mandatory configuration objective.

Corrected stratum as time-source hierarchy rather than physical/router hop count or an accuracy guarantee. Distinguished a configured association from a selected synchronized source. Explained the octal reach register, variable poll intervals, image-specific association legends and the limits of the clock-authority marker. Modern clients may randomize their NTP source port. A local `ntp master` is an isolated demonstration, not an automatic repair for loss of an approved external time source.

Separated syslog message components from the transport facility and PRI number. Basic severity thresholds make new messages eligible for a destination; they do not guarantee delivery, imply replay of old records or override every other platform filter. Logging destinations have separate controls. Default thresholds, persistent storage and exact event wording are platform-specific. An interface event or configuration-session record does not by itself establish root cause or attribute each command.

SNMP coverage distinguishes requests, traps and bounded Inform retries, MIB definitions and OID instances, 32/64-bit counter considerations and average rate calculations. SNMPv3 has three security levels, so its version alone does not imply encryption. Community-based read-only demonstrations include a source ACL; no read-write exercise or unconditional weak-algorithm recommendation remains.

Rebuilt the lab around two 2911 routers, a dedicated event loopback, a syslog server and a management PC. Thirteen steps establish the network and local time source, observe and repair an NTP association, generate/recover a controlled event without breaking the management link, interpret severity filtering, query read-only SNMP values, compare a wrong community and calculate a counter rate. Optional/unsupported simulator observations are explicitly distinguished from results actually observed.

Rewrote every existing assessment item and distractor explanation. Added a counter-rate question, retained all 23 useful flashcards and removed an accepted drill answer that omitted the requested millisecond precision. The NTP ticket now restores an explicitly approved, observed source and checks the downstream hierarchy instead of using an unsynchronized local master as an apparent fix.

Identity: original chapter and assessment identities remain. Six renamed reading sections map to their existing IDs. Lab completion remains positional and should be repeated for the revised instructions.

## Source basis and limits

- [CCNA v1.1 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf)
- [CCNA v2.0 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf)
- Cisco IOS XE 17 NAT configuration, monitoring/maintenance and command references; Cisco NAT order-of-operations and troubleshooting documents; RFC 3022 and RFC 1918.
- Cisco IOS XE NTP configuration/command reference and association interpretation; Catalyst 9300 IOS XE 17.12 logging guide; Cisco SNMP security guidance; RFCs 5905, 9109, 5424, 3416, 3417 and 3418.

Exact URLs are retained in the lessons and displayed in the app's source lists. Older IOS examples are qualified instead of being presented as universal IOS XE behavior. Representative outputs are authored teaching examples. Build/render/browser checks establish content integration, not the behavior of a particular networking image.
## Independent peer review

A second reviewer read all six chapter 26 assets and chapter 27's complete lesson/lab, including the challenges. Another reviewer read every chapter 27 question/distractor, card, drill and ticket. Neither review found a material remaining correctness or answer-support issue. The review included packet direction, route/mask arithmetic, state transitions, NTP hierarchy/reach behavior, logging controls, SNMP security/notifications and counter-rate calculation. It did not execute a simulator or device.
