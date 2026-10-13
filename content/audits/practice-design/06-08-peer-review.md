# Independent practice review: Chapters 06–08

Reviewed on 20 September 2026 by a reviewer who did not author these revisions. Scope: all three lessons for alignment; all three complete labs; every question, option, correct-answer explanation and incorrect-option explanation; every flashcard, command drill and ticket. The reviewer made no edits to these chapter assets. Findings were sent to the author, corrected there, and reread from the saved files.

## Final result

No unresolved actionable finding remains in this bounded review. This conclusion is about content accuracy, practice design and static reproducibility; it is not a claim that Packet Tracer or IOS was executed.

| Chapter | Questions | Cards | Drills | Tickets | Lab steps | Levels 1 / 2 / 3 |
|---|---:|---:|---:|---:|---:|---|
| 06 TCP, UDP & ports | 14 | 18 | 5 | 2 | 8 | 4 / 8 / 2 |
| 07 Ethernet switching | 18 | 20 | 8 | 2 | 10 | 4 / 12 / 2 |
| 08 Secure device access | 20 | 22 | 12 | 2 | 11 | 7 / 9 / 4 |

Total reviewed: 52 questions, 60 cards, 25 command drills, 6 tickets and 29 guided lab steps. Difficulty labels describe the intended reasoning, not measured question difficulty or exam success rates.

## Findings resolved

### Chapter 06

- **Connection identity needed explicit assumptions.** Question q12 and card c24 originally referred to two connections from one client without fixing the local IP address. A client can have more than one address. Both now specify the same client/server IPs and server port, and both require simultaneous connections. Sequential connections can reuse the same endpoint pair. The corresponding sentence in the lesson was aligned with these conditions.
- **The unsupported-command fallback lacked usable data.** Lab Step 4 now supplies a clearly illustrative DNS query from 192.168.40.10:53000 to 192.168.40.20:53. A learner can reverse those endpoints and explain the absence of a UDP opening without inventing a captured client port.
- **Retrieval order was too numerical at the start.** Cards now begin with the TCP/UDP distinction and endpoint reasoning. The port registry card is narrower; the FIN/RST comparison no longer repeats the complete flag catalogue already supported elsewhere.

The cold lab supplies host addresses, cables, services and DNS records. The second-server challenge is a meaningful variation: the resolver remains at .20 while the application moves to .30. It tests the distinction between name lookup and the later connection, instead of merely changing a port number. Known HTTP-Off is presented as a guided experiment; without that server evidence, the chapter correctly avoids diagnosing a stopped service from ping and HTTP results alone.

### Chapter 07

- **A stale lab state contradicted the actual sequence.** Step 7 said A remained STATIC even though the revised earlier steps had not configured a static A entry. It now says A is learned DYNAMIC on S1 Fa0/1, consistent with the subsequent source-movement exercise.
- **A distractor explanation described a retired alternative.** q14 option 0 now concerns multiple MAC addresses on one physical port. Its feedback now explains downstream source learning instead of discussing an attack allegation that the option no longer makes.
- **Supplied setup needed an explicit boundary.** The access-port/interface-range setup is now identified as a one-VLAN baseline. Independent VLAN configuration is deferred to Chapter 09; the current outcome is source learning and forwarding decisions.
- **An ordinary source move was overclassified.** q18 applies one taught dynamic-learning rule to a clearly stated new source location, so it is level 2. The bank ends at an honest 4/12/2 mix instead of adding artificial analysis items.

The lab distinguishes ARP state from MAC state before the unknown-unicast experiment. It substitutes the actual recorded B address in both creation and removal of the incorrect static entry. The challenge moves C across the switch link and changes which switch observes C's reply, making it different from the guided same-switch B/C exchange. The new answers require tracking source learning at both switches rather than copying a completed exhibit.

### Chapter 08

- **An interactive save shared a copy block with a later command.** Step 11 now sends only the copy command, asks the learner to accept the filename prompt and wait for the privileged prompt, then presents a separate show-startup command.
- **An open window was treated as a continuing login.** The lab now explains that the configured idle timeout can end a console or SSH session even while its window remains open. It gives the already-created admin credentials for reconnecting if needed.
- **The next step assumed the wrong possible privilege.** Step 10 now specifies admin for the new console login, so Step 11 legitimately begins at R1#. The previously permitted trainee choice could have left the learner at user EXEC.
- **Several labels overstated demand.** q04, q12 and q16 directly retrieve taught prerequisites, the save command and privilege categories, so they are level 1. q14's explicit transport correction and q05's direct comparison of two line policies are level 2. The remaining level-3 cases combine operational/configuration evidence or multiple access-policy requirements.
- **A distractor was not a meaningful networking alternative.** q04's nonexistent management-subnet lookup was replaced with an actual management-interface IP setting. The explanation distinguishes IP reachability from local key identity prerequisites.
- **A save card included an unrelated extra fact.** c04 now answers the persistence question without adding a separate factory-reset caveat.

The lab creates accounts before selecting local authentication, checks all existing VTY ranges, tests new sessions, retains a console recovery path, and separates the transport fault from recovery. Its partially guided timeout task and fresh-build challenge require the learner to select contexts and produce a configuration from requirements. Unsupported displays and key-generation variations are explicitly qualified.

### Independent answers

Root integration found that ordinary expected boxes are visible observations, not hidden answers. The author converted the answer container in each Challenge section to the new opt-in solution disclosure. The independent instructions remain outside it. The review confirmed the saved markup; actual disclosure rendering and application tests are owned by root integration.

## Independent checks and primary evidence

The reviewer separately recalculated the examples: 20001 + 1460 = 21461; 8001 + 1200 = 9201, with bytes 8001–9200 carried; filling the 1101–1200 gap permits cumulative ACK 1301; and 14-byte header + 46-byte padded data + 4-byte FCS = 64 bytes for the stated untagged Ethernet example.

A small independent worksheet model checked the idealized two-switch source-learning sequences and the changed-location challenge, including the case in which C's same-switch reply never reaches S1. Sixteen arithmetic and forwarding assertions passed. This was an authored rules model, not a network-device emulator or packet capture.

Primary sources reopened in this review:

- [RFC 9293, TCP](https://www.rfc-editor.org/rfc/rfc9293.html): connection identity, connection reuse, cumulative acknowledgments and sequence-space use. The source supports the same-IP and concurrent-connection qualifications; the review does not require students to learn the full TCP state machine.
- [Cisco Catalyst 2960 IOS 15.0(2)SE, Managing the MAC address table](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swadmin.html): source learning, multiple downstream MACs, same-ingress filtering, per-VLAN state, dynamic clearing and explicit static-entry removal. This is the chapter's named classic platform reference, not a claim of identical support on every simulator or current switch.
- [Cisco, Configure SSH on routers](https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html): the scoped hostname/domain/key workflow, local authentication, VTY policy and separate operational checks.
- [Cisco IOS Configuration Fundamentals command reference, exec-timeout](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/Cisco_IOS_Configuration_Fundamentals_Command_Reference/D_through_E.html): line configuration mode and inactivity timeout behavior. Leaving a terminal window open is not sufficient to preserve the logged-in EXEC session.

## Limits

This was a substantive independent reading and source/worksheet check, not just schema validation. It found no wrong keyed answer remaining after the listed refinements. The reviewer checked command contexts, prerequisites, topology/address consistency, option plausibility and feedback, fault/recovery ordering, source/measurement distinctions and independent variation. Root and the author separately own automated schema, rendering, ledger and application integration checks.

No Packet Tracer project, physical switch, Cisco IOS/IOS XE image, live SSH endpoint, packet capture or classroom learning trial was executed for this review. No claim is made that a model's exact error messages or available commands will match the authored examples. Supplied worksheets and qualified simulator fallbacks must remain clearly distinguished from a learner's observations.
