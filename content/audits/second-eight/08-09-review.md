# Chapters 08–09: teaching and technical review

Reviewed 19 September 2026 (local time). Rewrote both lessons and labs, plus all questions, explanations, flashcards, command drills and troubleshooting tickets. Each chapter has 16 questions, 20 cards, 12 drills and two tickets. The assessment content is original practice material, not recalled exam questions.

## 08 — Secure device access

The former broad IOS-essentials chapter repeated initial setup and introduced access-list policy before its prerequisites. It now builds from the CLI workflow in 00: accounts and privilege → console/VTY authentication → management methods → SSH configuration → verification and fault isolation. All previous teaching-section IDs are retained under clearer headings; the dedicated SSH configuration section has a new ID.

Technical corrections and boundaries:

- Distinguishes local user authentication from privilege selection and `enable` authentication. A privilege-1 login and a privilege-15 login are tested separately. Basic local login is taught without silently introducing AAA method-list behavior.
- Separates line authentication, permitted transport, SSH server readiness and IP reachability. A successful ping does not prove that an SSH connection or credential will work. `show ip ssh` does not prove that a remote user has successfully logged in.
- Removes fixed assumptions about the number of VTY lines. Learners discover the available ranges and apply/review policy on every relevant range.
- Uses an explicit 2048-bit RSA lab setting where supported, with documented command-form differences. Removes the obsolete 768-bit minimum as a study target. A local domain name used in key setup does not require a working external DNS server.
- Explains type 0/7/5/8/9 credentials at the level needed to distinguish clear text, reversible obfuscation and hashes. Type 7 does not protect Telnet traffic. Secret/hash defaults depend on the image; a hash does not prevent offline guessing of weak passwords.
- Treats in-band/out-of-band as management-path designs. SSH alone is not an out-of-band design. Banners communicate a policy notice; their exact display order is not taught as a universal rule.
- Leaves full AAA configuration to 33 and management ACL policy to 34. Running/startup configuration is explained without claiming that erasing startup-config always resets every device data store.

The lab defines a router, switch, administrator PC and console laptop with explicit ports and addresses. It establishes a proven console path, creates accounts, enables SSH, verifies both privilege levels, introduces an SSH transport fault, restores access, starts a fresh console login with an explicit logout, and saves the verified result. Closing a terminal window alone is not treated as proof of a new console authentication.

## 09 — VLANs & access ports

The rewrite teaches VLAN membership before trunks or protection templates: Layer 2 scope → VLAN database → access ports → voice/data classification → PoE → endpoint selection → verification. All previous lesson section IDs survive. Full trunk configuration, aggregation, spanning-tree protection and port security stay with their later chapters.

Technical corrections and boundaries:

- Separates a VLAN from an IP subnet. Same-VLAN membership does not repair incompatible addressing, and correct addressing does not repair an incorrect access VLAN. VLAN separation alone is not a firewall policy after routing is enabled.
- Qualifies flooding to eligible forwarding ports in the applicable VLAN. Multicast behavior can be affected by multicast features.
- Distinguishes normal-range, extended-range and reserved VLAN IDs. VLAN 0 is a priority-tagging value, not an ordinary assignable VLAN. Explains database persistence with platform/VTP scope rather than a universal `vlan.dat` rule or an erase recipe.
- Distinguishes configured access mode from operational trunking state. The voice VLAN is an explicit exception to the simple one-VLAN access-port model: supported phones can carry tagged voice alongside untagged PC traffic.
- Does not infer phone registration, an IP lease or successful calling merely from `switchport voice vlan`. CDP, LLDP-MED and manual provisioning depend on the endpoint and switch. Working PC traffic does not establish a working voice service.
- Removes the blanket maximum-two-MAC phone template and early PortFast-trunk/LACP examples. Endpoint settings follow the number of VLANs, tagging requirements and supported features.
- Separates PSE output from PD available power for 802.3af/at/bt. A suitable PoE standard, the individual port limit and the total available budget are separate checks. A data-only switch cannot supply power through a software command.
- States `power inline` limits in milliwatts in the documented command context. Reducing a configured power allowance below the endpoint's requirement is not a solution to a depleted budget.

The lab uses an externally powered phone on a non-PoE 2960 example, two data VLANs, three PCs and a printer. Same-VLAN tests establish a baseline; missing-VLAN and wrong-membership faults are introduced and recovered in separate steps. Voice configuration is tested as configuration, not as a simulated call system. A paper PoE budget exercise is provided with optional supported-device inspection.

Independent arithmetic review confirmed: 370 W minus ten 6.3 W phone allocations leaves 307 W; ten additional 30 W allocations consume 300 W and leave 7 W. Twenty connected endpoints fit the stated 24-port switch. A 30 W request cannot fit a remaining 25 W budget even when the port itself supports 30 W. A 25 W PD requirement exceeds 802.3af's 12.95 W PD figure but fits 802.3at's 25.5 W figure under the stated standard-power assumptions.

## Primary evidence

| Topic | References |
|---|---|
| Scope and objective depth | [Cisco v1.1 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf), [Cisco v2.0 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| SSH prerequisites, VTY transport and verification | [Cisco SSH configuration and troubleshooting](https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html) |
| Local password/secret behavior and management protection | [Cisco password configuration](https://www.cisco.com/c/en/us/support/docs/security-vpn/remote-authentication-dial-user-service-radius/107614-64.html), [Cisco IOS device hardening](https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html) |
| Current credential types, reversibility and algorithms | [Cisco Protecting Secrets on Network Devices](https://www.cisco.com/c/en/us/about/trust-center/resilient-infrastructure/protecting-secrets.html) |
| VLAN ranges, database behavior and operational state | [Cisco Catalyst VLAN configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/vlan/vlan-configuration-guide/configure-vlan.html) |
| Voice/data handling and supported provisioning | [Cisco Catalyst 2960 voice VLANs](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvoip.html), [Cisco Micro Switch voice VLAN configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst_microswitches/software/releases/15_2_7_e/configuration_guide/vlan/b_1527e_vlan_cms_cg/configuring_voice_vlans.html) |
| PoE allocation, inspection and command units | [Cisco Catalyst 3560 interfaces](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_2_se/configuration/guide/scg3560/swint.html), [Cisco Catalyst 3650 command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/software/release/16-2/command_reference/b_162_consolidated_3650_cr/b_162_consolidated_3650_cr_chapter_0100.html) |
| Later 802.3bt PSE/PD power figures | [Cisco IEEE 802.3bt and UPOE+ white paper](https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/nb-06-upoe-plus-it-ot-wp-cte-en.html) |

The older 3560/3650 sources are used for their scoped commands, not as evidence for later 802.3bt standards. The UPOE+ source's explanatory text gives Type 4 PD power as 71.3 W; its summary table rounds that value to 71 W. The lesson uses the unrounded figure with its scope.

## Assessment identities

Unrelated replacements receive new IDs, avoiding inheritance of old practice history for a different skill. All other existing IDs retain their underlying topic while wording, explanations and examples are corrected.

| Chapter | Retired IDs | Replacement or disposition |
|---|---|---|
| 08 | `ios-essentials-q07` | `q17`: ICMP versus SSH evidence; full ACL policy moved to 34 |
| 08 | `ios-essentials-c12`, `c16`, `c19`, `c21` | `c22`: unexpected host key; `c23`: server state versus login; `c24`: banner purpose; redundant EXEC card removed |
| 08 | `ios-essentials-d09` | `d13`: verify privilege instead of premature ACL configuration |
| 08 | `ios-essentials-t01` | `t03`: isolate permitted-transport failure |
| 09 | `vlans-and-access-ports-q10` | `q17`: determine a multi-VLAN endpoint's trunk requirement |
| 09 | `vlans-and-access-ports-c11`, `c12`, `c14` | `c21`: data does not prove voice; `c22`: separate data/voice faults; `c23`: PoE hardware capability |
| 09 | `vlans-and-access-ports-d11`, `d12` | `d13`: recreate the missing VLAN; `d14`: inspect the MAC table by interface |
| 09 | `vlans-and-access-ports-t01` | `t03`: diagnose missing voice-VLAN evidence without asserting a universal fallback |

Only the first ID in abbreviated cells includes the chapter prefix; every subsequent ID uses that same prefix.

## Review and limits

A second reviewer read all twelve files, checked correct-answer and distractor semantics, privilege and VTY consistency, addressing, voice-VLAN classification, and power arithmetic. Their console-login and later-PoE citation findings were corrected. Each lab has setup, topology, sequential steps with expected observations, troubleshooting and a challenge. Representative output is authored for teaching and labeled accordingly.

No Packet Tracer, CML or physical-device execution was performed in this pass. Platform notes and paper exercises make that boundary explicit; a rendering or schema check cannot establish actual device behavior. See the batch index for final application validation results.
