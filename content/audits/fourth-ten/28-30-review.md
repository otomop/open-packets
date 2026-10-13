# Chapters 28–30 content review

Reviewed 2026-09-20. This report covers all six assets in each of `28-qos`, `29-file-management` and `30-client-os-troubleshooting`: lessons, labs, questions and every distractor explanation, flashcards, command drills and troubleshooting tickets. Baseline comparison uses `content/audits/fourth-ten/baseline.json`.

## Scope and structural decisions

Chapter numbers and chapter IDs remain unchanged. The 28–30 order is appropriate: explain QoS behavior; manage device files; then diagnose endpoint configuration and application reachability. No lesson topics were moved into another chapter.

Every original section ID, including intro and exam-focus, is retained. Renamed display headings are explicitly mapped through `sectionIds`. No section IDs were merged, removed or reused for an unrelated topic. The lesson source now avoids framing the old heading “four parameters decide everything” as a factual claim while retaining that historical progress ID.

Metadata changes:

- 28 retains v1 `4.7` and no v2 objective. Adds the earlier `ios-essentials` prerequisite alongside `tcp-udp-ports`. QoS is an explain-level v1 topic; its MQC experiment and command drills are clearly optional implementation practice.
- 29 is titled **Configuration and software files**. Retains v1 `4.9` and v2 `4.2`. Adds earlier `static-routing-ipv4` alongside `ios-essentials`. The secure lab is self-contained despite management AAA receiving deeper treatment later.
- 30 retains v1 `1.10` and v2 `1.6`. Adds earlier `ipv6-addressing` alongside `ipv4-addressing`, `dhcp` and `dns` so reading both address families has a clear prerequisite.

The official v1.1 and announced v2.0 blueprint PDFs were opened and read during this review. V1.1 `4.7` calls for explaining QoS PHBs; `4.9` describes TFTP/FTP. V2.0 `4.2` requires secure SFTP/SCP file management, and `1.6` explicitly includes wired/wireless client troubleshooting across Windows, macOS and Linux. These distinctions drive required versus optional material. This review follows the course's separately verified transition dates; it makes no new guarantee about exam questions or a pass.

## What changed

### 28 — QoS

The lesson now starts with application needs and measurable delay/serialization, then separates classification, marking, trust, scheduling, queue management and rate enforcement. The worked G.711 rate states IPv4/RTP/UDP and packetization assumptions; the serialization example explicitly excludes framing overhead.

Corrected overclaims: classification/marking are not limited to one lifetime event; a high DSCP does not automatically obtain more service; AF drop precedence is not deterministic packet-by-packet order; CoS is a field in an 802.1Q tag rather than something exclusive to voice/trunk configurations; shaping does not alter Ethernet speed; policing has accounting state; shaping buffers can overflow. Voice thresholds are labeled design guidance. RFC 4594 signaling uses CS5; Cisco CS3 designs are not misattributed to that RFC.

Classic IOS LLQ and legacy Catalyst 2960 trust behavior are explicitly platform-scoped. Removed required memorization of arbitrary queue counts, class limits, signature counts and token timing defaults. Preserved useful trust/mapping examples with the actual mapping supplied.

The lab's first four steps are a core paper analysis. The optional simple marking experiment uses one router, two default switches and two PCs, no hidden FTP server or ACL prerequisites. It follows the same echo request through an input policy; an intentional wrong-interface attachment is observed before repair. Reply counters cannot masquerade as proof of request marking. Packet/counter limitations are explicit, with no latency or throughput claim from Packet Tracer.

### 29 — Configuration and software files

Replaced the generalized “all IOS storage/boot is identical” treatment with inventory-led file management. Explicit prefixes, local versus network file systems, running/startup/staged destinations, and byte-capacity arithmetic precede copying.

TFTP includes transfer ports, retransmissions and negotiated block-size caveats. FTP has separate control/data paths and active/passive roles, without an unsupported universal IOS active-mode default. Credentials stored in configuration are treated as sensitive. SCP/SFTP are distinguished from FTPS; the OpenSSH 9 default-protocol change and classic `-O` compatibility are scoped to a verified SCP-only server. IOS XE SFTP client/server restrictions are tied to the documented implementation.

The merge explanation now permits explicit removal commands and does not claim that transfer completion proves every command applied. Configuration replacement requires a complete compatible source and recovery access. Boot-register recognition remains a small legacy example; directory-order boot assumptions, blind reload sequences, erasure and deleting working images are removed from the practical workflow. Software staging uses trusted metadata/hash checks; install-mode manifests are not described as self-contained images.

The Packet Tracer lab creates isolated TFTP/FTP backups, stages files to flash, demonstrates a harmless hostname/unnumbered-loopback merge, and separates an FTP credential failure from repair. The independent secure lab sets up Ubuntu OpenSSH, a restricted working directory, a new local Cisco AAA account, SSH/SCP server prerequisites and a separate successful login checkpoint. It performs a configuration pull by SCP and a benign file download by IOS XE SFTP, then diagnoses a nonexistent path. An authorized platform-appropriate software image can be staged using the same checks; without one, actual software staging must be recorded as unperformed. No image activation is included.

### 30 — Client OS troubleshooting

Replaced fixed symptom-to-cause assertions with supported observations and next tests. Four IPv4 parameters are the starting point, with explicit active-adapter, route, IPv6, VPN and DNS-scope context. DHCP enabled does not prove DNS is DHCP-supplied; a route's `proto dhcp` label does not prove every address's origin. ARP entries are recorded mappings, not conclusive live-path proof.

Corrected Linux assumptions: IPv4 link-local behavior depends on the manager/profile, `nmcli device reapply` is not a generic lease-renewal command, and a systemd stub is not an upstream resolver. Windows route selection checks prefix length before metric. A numeric ping does not certify all masks/routes or isolate a firewall. TCP port success does not prove TLS/application success.

Wireless coverage includes all three operating systems, saved versus current profiles, case-sensitive SSIDs and octet length, WPA2 shared-key versus WPA3/Enterprise methods, and association versus protected data. A connected icon plus APIPA does not uniquely prove a DHCP infrastructure cause. The tickets add actual plan/capture/configuration evidence to make the answer supported.

The lab fixes the DHCP overlap: server .20 is outside the .100–.149 pool. It explicitly enables DHCP/DNS/HTTP, creates a fresh DNS name to reduce cache ambiguity, keeps local and routed targets separate, disables proxy ARP for the controlled mask experiment, and repairs each fault before proceeding. WRT300N LAN addressing, DHCP disablement, LAN-port cabling, compatible laptop adapter, profile and security settings are all specified. The real Windows/macOS/Linux inspection is read-only; faults remain in the simulator.

## Identity retention and retirement

Same-topic question IDs and both ticket IDs in each chapter are retained. The former ACL-themed file-merge ticket now uses a harmless loopback while assessing the same merge-versus-replace misconception. The file boot-order question now supplies explicit saved order rather than relying on an unjustified directory-order assumption. Corrected bank text is not a reset of mastery history.

| Chapter | Retired IDs | New IDs | Reason |
|---|---|---|---|
| 28 | `qos-c02` | `qos-c21` | Retire fixed generic video thresholds; assess interactive-media versus buffered-transfer requirements |
| 28 | `qos-c20` | `qos-c22` | Retire token-interval default trivia; assess shaping versus physical link speed |
| 29 | `file-management-c17` | `file-management-c22` | Retire boot-field bit trivia; assess staged versus active software |
| 29 | `file-management-c19` | `file-management-c23` | Retire an assumed default filename; assess useful protected backup naming |
| 29 | `file-management-d06` | `file-management-d13` | Replace an activation-setting drill with reading current software identity |
| 29 | `file-management-d10` | `file-management-d14` | Replace a register-changing drill with actual SFTP staging |
| 30 | None | No unrelated replacements | Correct existing client-diagnosis concepts in place |

Added gap-filling items use unused IDs: QoS q15/q16 and d11/d12; file-management q16; client q16 and d12. All other existing item IDs remain. No stored history, application code or progress data was edited.

## Primary source evidence

All URLs below were checked by browsing on 2026-09-20. Frontmatter contains the relevant chapter sources. Older sources are used only for the explicitly named legacy platform or stable protocol behavior, not as authority for every current product.

| Claim or correction | Primary evidence |
|---|---|
| Explain-level QoS, TFTP/FTP description; OS IP verification | [Cisco v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) |
| SFTP/SCP manage-level objective; wired/wireless Windows/macOS/Linux | [Cisco announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| DSCP six bits, configurable PHB mapping and remarking at boundaries | [RFC 2474](https://www.rfc-editor.org/rfc/rfc2474), [Cisco DSCP guide](https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-packet-marking/10103-dscpvalues.html) |
| AF codepoints and relative drop precedence; EF codepoint | [RFC 2597](https://www.rfc-editor.org/rfc/rfc2597), [RFC 3246](https://www.rfc-editor.org/rfc/rfc3246) |
| ECN and probabilistic congestion response; service-class recommendations are a design | [RFC 3168](https://www.rfc-editor.org/rfc/rfc3168), [RFC 4594](https://www.rfc-editor.org/rfc/rfc4594) |
| Policer versus shaper; finite queues and burst accounting | [Cisco policing/shaping comparison](https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-policing/19645-policevsshape.html) |
| Classic IOS priority congestion-time policing versus bandwidth minimum | [Cisco bandwidth versus priority](https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-packet-marking/10100-priorityvsbw.html) |
| MQC object roles and AND/OR criteria | [Cisco MQC guide](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/quality-of-service/quality-of-service/m_qos-apply.html) |
| Legacy 2960 trust/default mapping behavior | [Cisco IOS 15.2(1)E 2960 QoS guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_1_e/configuration/guide/2960_scg/swqos.html) |
| Voice planning figures explicitly qualified as guidance | [Cisco branch design guide](https://www.cisco.com/c/en/us/td/docs/solutions/Enterprise/Branch/BRBranch/BRB_CH2.html) |
| Prefixes, free versus total bytes, explicit local storage | [Cisco Catalyst 9300 file-system guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/working_with_the_flash_file_system.html) |
| TFTP ports/base block behavior and negotiated block size | [RFC 1350](https://www.rfc-editor.org/rfc/rfc1350), [RFC 2348](https://www.rfc-editor.org/rfc/rfc2348) |
| FTP control/data and active/passive roles; IOS client settings | [RFC 959](https://www.rfc-editor.org/rfc/rfc959), [Cisco file-transfer services](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/system-management/system-management/m_ifs-file-trans-0.html) |
| Merge versus complete configuration replacement | [Cisco IOS rollback guide](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/config-mgmt/configuration/15mt/config-mgmt-15-mt-book/cm-config-rollback.html), [Cisco IOS XE replacement guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/mgmt/config-replace/configuration-replace.html) |
| SCP SSH/AAA/EXEC authorization prerequisites | [Cisco IOS XE Secure Copy](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-usr-ssh-sec-copy-0.html) |
| IOS XE SFTP client role, source-interface prerequisite, file-copy forms | [Catalyst 9300 SFTP guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-16/configuration_guide/sec/b_1716_sec_9300_cg/configuring_sftp.html), [Cisco file operations/password prompt](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/mgmt/file-transfer-protocol-configuration-guide/file-transfer-ptotocl.html) |
| OpenSSH scp defaults to SFTP from 9.0; -O compatibility | [OpenSSH 9.0 notes](https://www.openssh.org/txt/release-9.0) |
| Isolated Ubuntu SSH installation and service validation | [Ubuntu OpenSSH server](https://ubuntu.com/server/docs/how-to/security/openssh-server/) |
| Published image hashes, package manifest and authenticity distinction | [Cisco IOS XE image verification guidance](https://sec.cloudapps.cisco.com/security/center/resources/forensic_guides/iosxe_forensic_guide.html) |
| Windows configuration, DHCP/cache operations and query interpretation | [Microsoft ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig), [nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup) |
| Route prefix before metric; TCP test scope | [Microsoft route metric](https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/microsoft-windows-tcpip-interfaces-interface-routes-route-metric), [Test-NetConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection?view=windowsserver2025-ps) |
| Wireless profile/current-state inspection without exposing a cleartext key | [Microsoft netsh wlan](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netsh-wlan) |
| macOS parameters, DHCP renewal, nonmutating Wireless Diagnostics | [Apple manual/DHCP configuration](https://support.apple.com/guide/mac-help/use-dhcp-or-a-manual-ip-address-on-mac-mchlp2718/mac), [Renew DHCP](https://support.apple.com/en-asia/guide/mac-help/mchlp1545/mac), [Wireless Diagnostics](https://support.apple.com/guide/mac-help/use-wireless-diagnostics-mchlf4de377f/mac) |
| macOS supplemental DNS resolver selection | [Apple scutil manual source](https://github.com/apple-oss-distributions/configd/blob/main/scutil.tproj/scutil.8) |
| Linux addresses/routes and manager-specific state | [Debian ip-address](https://manpages.debian.org/trixie/iproute2/ip-address.8.en.html), [ip-route](https://manpages.debian.org/trixie/iproute2/ip-route.8.en.html) |
| NetworkManager link-local configurable; reapply semantics | [IPv4 settings](https://networkmanager.pages.freedesktop.org/NetworkManager/NetworkManager/settings-ipv4.html), [nmcli reference](https://networkmanager.pages.freedesktop.org/NetworkManager/NetworkManager/nmcli.html) |
| Resolver per-link status | [systemd resolvectl manual source](https://github.com/systemd/systemd/blob/main/man/resolvectl.xml) |
| IPv4 link-local scope and selection range | [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927) |
| SSID octet length; WPA2 key workflow and passphrase form | [RFC 5416](https://www.rfc-editor.org/rfc/rfc5416), [Cisco authentication/handshake explanation](https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/116493-technote-technology-00.html), [Cisco WLAN security guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-5/config-guide/b_cg85/wlan_security.html) |

## Verification and counts

| Chapter | Loader lesson words | Questions | Multi | Exhibits | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 28 | 2,419 | 16 | 2 | 4 | 20 | 12 | 2 | 12 |
| 29 | 2,282 | 16 | 2 | 6 | 21 | 12 | 2 | 15 |
| 30 | 2,376 | 16 | 2 | 6 | 20 | 12 | 2 | 15 |

All three single-answer banks distribute correct positions 4/3/4/3 after final balancing. Every question's wrong options have explanations, and each ticket explains the supporting evidence rather than relying on an unsupported symptom shortcut.

Checks performed:

- `node scripts/validate-content.mjs`: zero errors; no warnings for chapters 28–30.
- Parent's `content/audits/fourth-ten/verify.mjs`: passed, rendering 2,654 React fragments across the complete batch at the time of this check, with item identity, distractor, placeholder and prerequisite checks.
- Independent numeric checks: every listed AF codepoint; EF binary; 1,500-byte serialization at 1 Mb/s; G.711 rate; AF21/ECN-zero service byte; 30-byte Linux test file; storage subtraction; inclusive 50-address DHCP pool; /16 versus /24 destination decisions; hexadecimal /24 and /25 masks.
- Baseline comparison: no lost lesson section IDs; only the explicitly listed assessment retirements.
- Manual review: one device per IOS command block, separate interactive prompts, fault observation before recovery, independently answerable challenges, no raw Windows prompt pasted into a text command block, and no placeholder rendered as HTML.

Limits: no Packet Tracer, CML, IOS XE hardware, real OS network fault, packet capture, file transfer or image activation was executed during authoring. Representative output and expected behavior are explicitly labeled. Real secure-transfer compatibility, wireless simulator controls, hashes and counters require the learner's actual environment. No full build, publication, commit, push, UI/CSS or shared application-data change was performed by this content owner.

Independent peer review was completed by the switching/routing agent after all 18 files were written. Corrections and the final verification are recorded below.

## Final independent peer review and repairs

The switching/routing reviewer read all 18 assets and checked QoS direction/rates, transfer prerequisites and credentials, client evidence, every assessment key and distractor, and the lab fault/recovery paths. No additional material QoS or client-diagnosis error was identified. The review found and corrected the following secure-transfer completeness issues:

- Chapter 29 lab Step 10 now derives an OpenSSH SHA256 fingerprint from the actual SSH RSA public key obtained through the trusted Cisco console. The procedure explains how to join the SECSH base64 lines and explicitly distinguishes this from the ASN.1 hexadecimal display of `show crypto key mypubkey rsa`. Unsupported export, unexpected key type and fingerprint mismatch stop the identity checkpoint.
- Step 12 no longer assumes an OpenSSH-style acceptance prompt on IOS XE. It uses the actual Ubuntu **server** RSA public key, a server-address entry under `ip ssh pubkey-chain`, and `ip ssh stricthostkeycheck`. A deliberate attempt before pinning the key must fail before account-password authentication; after pinning, the transfer can succeed. This also detects releases whose SFTP implementation does not enforce that SSH setting. Such a result is recorded as unsupported, not silently bypassed.
- Drill `file-management-d14` now supplies the username, server address and absolute source path without requiring the learner to reconstruct them from the lab.
- Chapter 30 Step 1 adds an explicit worksheet fallback if proxy ARP cannot be disabled or verified. A predicted wrong-mask timeout must not be reported as an observed simulator result.

Additional primary evidence checked on 2026-09-20:

| Claim | Source |
|---|---|
| IOS XE SSH client server-key pinning and strict checking | [Catalyst 9300 SSHv2 guide, 17.16](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-16/configuration_guide/sec/b_1716_sec_9300_cg/secure_shell_version_2_support.html) |
| Strict checking is disabled by default and requires configured server keys | [Cisco IOS SSH command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/d1/sec-d1-cr-book/sec-cr-i3.html) |
| Actual SECSH RSA public-key display format in IOS XE | [Cisco IOS XE key-display example](https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/222700-resize-default-ssh-rsa-keys-on-cisco-ios.html) |
| OpenSSH public-key fingerprint calculation and SHA256 selection | [OpenSSH ssh-keygen manual](https://man.openbsd.org/ssh-keygen) |

These are procedural corrections based on documentation and independent reading; no Cisco/OpenSSH transfer was executed. The assessment counts and section-ID totals above are unchanged; the lesson word count reflects the final wording. The independent reviewer reread the repairs and confirmed no remaining material findings. The batch verifier was rerun after these repairs and passed all 2,654 React fragments; the content validator again reported zero errors and no warnings for chapters 28–30.

## Independent chapter 27 assessment cross-review

Read-only review covered all 16 questions, every incorrect-option explanation, 23 cards, 12 drills, and both tickets in `27-ntp-syslog-snmp`. No actionable material correctness or answer-support finding remained. Checked the NTP stratum hierarchy and local-master scope, octal reach interpretation, SYS component versus transport PRI facility, independent severity thresholds, SNMP acknowledgments and ports, security-level distinctions, and the octet-counter calculation: 37,500,000 bytes × 8 / 30 seconds = 10,000,000 bits/s.

The tickets establish the displayed severity exclusion and unusable time-source state without claiming that an ICMP result proves a specific firewall cause. The chapter 27 lesson/lab were independently reviewed by the services/security agent; this pass did not duplicate that work. No chapter 27 files were edited and no lab execution was performed.
