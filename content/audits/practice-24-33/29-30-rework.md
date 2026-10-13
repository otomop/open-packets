# Chapters 29–30 practice rework

Reviewed 24 September 2026 against the captured `practice-24-33/baseline.json`. Scope: both complete practice banks, every question option/key/explanation, every flashcard, drill and ticket repair, complete lab setup/fault/recovery/challenge paths, and their existing lesson/prerequisite context. Lesson bodies, section identities and order are unchanged; only advertised lab minutes changed. No application, styling, shared script, build, server, Git or deployment change was made.

## Final inventory and demand

| Chapter | Questions | Level 1 / 2 / 3 | Cards | Drills | Tickets | Numbered lab stages | Lab minutes |
|---|---:|---:|---:|---:|---:|---:|---:|
| 29 Configuration and software files | 21 | 6 / 15 / 0 | 20 | 11 | 2 | 17 | 110 |
| 30 Client OS troubleshooting | 24 | 7 / 14 / 3 | 21 | 12 | 3 | 15 | 105 |

These are editorial reasoning labels, not measured difficulty or exam predictions. Chapter 29's supplied-stage comparisons and requirement matching are direct applications; adding more facts to the prompt did not justify calling them analysis. Chapter 30's three analysis cases require reconciling retained/current wireless evidence, different resolver paths, or two independent faults. Checkpoints progress from foundations to application and then analysis. Answer positions vary; all correct option text and each distractor's associated feedback were checked when choices were reordered.

The exact ledger is `29-30-decisions.json`: **131 baseline/current union identities**; 45 keep, 39 revise, 17 retire, 30 add. Each action matches actual before/after object equality. No existing item ID was reassigned to unrelated knowledge.

## Chapter 29 decisions

The original bank placed too much effort on legacy configuration registers, boot order, manifests and optional replacement syntax. The revised bank retains storage interpretation, TFTP/FTP behavior, saved versus active configuration, merge versus replacement, file verification and secure transfer. It adds useful decisions about explicit staging destinations, verified server identity, case-sensitive paths, command direction, preservation of an older startup checkpoint, passive FTP connection evidence and SSH source selection against a server policy.

A hash mismatch and a matching hash from an untrusted mirror are deliberately different outcomes. Transport encryption, file integrity, trusted provenance, model compatibility, application of configuration and software activation stay separate. A packet reaching a service does not prove login; a successful login does not prove subsystem support or file permission; a completed copy does not prove application or activation.

The permission incident lives in ticket `file-management-t03`, with trusted server evidence, a narrow owner/permission repair and repetition of the actual failed transfer. Its initially proposed duplicate question q24 was removed before finalization. That ID was absent from the baseline and final bank, so it is not a retirement of existing learner progress.

The lab is now split into recognizable products: backup/merge, isolated TFTP/FTP comparison, and secure transfer. Linux installation/account/NIC/firewall/SSH preparation and the fresh IOS XE AAA setup remain supplied, with console recovery. Both directions of SSH server identity are checked. The Cisco client first rejects an unconfigured trusted-host entry; key configuration and successful transfer occur in the next numbered step. Missing-source observation and corrected-source transfer also occupy separate steps.

Closed prediction answers ask learners to identify stores and merge effects before acting. The independent challenge creates new handover files, requires a protected current backup while preserving startup and earlier backups, stages a separate text file through SFTP, diagnoses case mismatch and rejects two different software acceptance failures. It has a complete closed answer and an evidence checklist. Real image staging is optional when no authorized compatible image is available; a text file is never presented as software or booted.

## Chapter 30 decisions

The revised practice gives more attention to the active adapter, route specificity before metric, the actual resolver used, retained versus current wireless evidence, and independent address-family tests. A responding DNS server can hold a wrong record. A correct DHCP ACK can coexist with a manual client DNS override. ICMP failure does not negate a fresh successful required application exchange.

Existing useful address/mask/default/OS-command questions are retained with reviewed alternatives and honest demand labels. Command recognition is level 1, ordinary route/setting/error interpretation is level 2. The proposed second specific-route question q25 was removed as a duplicate of the retained new q17 rule application; it was never a baseline or final identity. One bounded macOS hexadecimal-mask item remains; repeated card arithmetic was removed.

The router relay-configuration ticket is retired here. Its confirmed existing owner is `dhcp-t01`, inspected in the current chapter 24 bank: fresh client relay failure, helper on the server-facing interface, available pool/return path, narrow relocation to the client-facing interface and fresh allocation retest. The destination does not imply this rewrite created that item. Client tickets instead require a wrong-gateway diagnosis, wrong DNS record despite numeric application success, and a fresh WLAN credential failure despite a retained lease. Their titles describe symptoms without disclosing the solution.

The lab preserves complete cold Packet Tracer setup and separate observed fault/recovery stages. Learners predict which matrix rows change; those fault interpretations are in closed solutions. A single real OS inspection plus interpretations of supplied other-OS evidence avoids requiring three OS installations. Where simulated wireless support is unavailable, an explicit timeline/control/credential worksheet supplies enough evidence to reason without inventing execution.

The independent variation adds PC-C and a genuinely routed Server-B application. A healthy PC-A first confirms the numeric service control. PC-C has an unused configured gateway while its intended local resolver has an incorrect record. The learner must establish numeric routed HTTP after the first repair and named HTTP after the second. Pinging the real local gateway can work despite a wrong default setting; the challenge requires explaining why. Addressing, cables, models, additional router interface configuration, DNS/HTTP setup, prompts and completion evidence are supplied.

## Retired identities and scope

| Chapter | Retired IDs | Reason |
|---|---|---|
| 29 questions | q06, q07 | Legacy register and boot-order detail remains scoped reference |
| 29 cards | c13, c15, c16, c18, c20 | Optional archive/boot/manifest or redundant isolated inventory recall |
| 29 drills | d03, d05, d09, d11 | Supplied FTP preparation, legacy MD5, platform boot display and replacement syntax |
| 29 tickets | t02 | Legacy unsaved boot-intent case displaces core transfer practice |
| 30 cards | c01, c08 | Fine link-local selection range and duplicate hex-mask recall |
| 30 drills | d05, d11 | Repeated cache-clearing syntax and server-side DHCP display |
| 30 tickets | t02 | Router relay repair already covered by existing `dhcp-t01` |

IDs are prefixed with `file-management-` or `client-os-troubleshooting-`. Every retained/revised/new item has its own topic-specific ledger entry. The two abandoned new duplicate questions are documented above, not falsely described as retired baseline IDs.

## Primary evidence checked

The official [v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) supports TFTP/FTP description (4.9) and verification of client parameters on Windows/Mac/Linux (1.10). The announced [v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) adds secure file management (4.2) and wired/wireless client troubleshooting (1.6). The course's existing version transition and objective IDs are preserved.

| Claim or practice boundary | Primary reference |
|---|---|
| Merge applies commands and does not remove merely absent settings | [Cisco configuration replace/rollback guide](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/config-mgmt/configuration/15mt/config-mgmt-15-mt-book/cm-config-rollback.html) |
| TFTP UDP request/selected transfer ports and lack of user authentication | [RFC 1350](https://www.rfc-editor.org/rfc/rfc1350.html) |
| FTP control versus separate active/passive data exchange | [RFC 959](https://www.rfc-editor.org/rfc/rfc959) |
| IOS XE SCP enablement and EXEC authorization | [Cisco IOS XE 17 Secure Copy](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-usr-ssh-sec-copy-0.html) |
| C9300 SFTP client role, source interface and no SFTP server | [Cisco IOS XE 17.16 SFTP](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-16/configuration_guide/sec/b_1716_sec_9300_cg/configuring_sftp.html) |
| Trusted server public key and strict host-key enforcement | [Cisco SSH server authentication](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/sec-crypto/ssh/secure-shell-configuration-guide/m-secure-shell-version-2.html) |
| OpenSSH default SFTP and classic `-O` selection | [OpenSSH 9.0 release](https://www.openssh.org/txt/release-9.0), [scp manual](https://man.openbsd.org/scp) |
| SSH password-authentication configuration/precedence limits | [OpenSSH sshd_config manual](https://man.openbsd.org/sshd_config) |
| Strong image comparisons and authenticity evidence | [Cisco IOS XE forensic guide](https://sec.cloudapps.cisco.com/security/center/resources/forensic_guides/iosxe_forensic_guide.html) |
| Windows address/lease/cache operations | [Microsoft ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig) |
| Longest prefix before equal-prefix metric | [Microsoft route metric](https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/microsoft-windows-tcpip-interfaces-interface-routes-route-metric) |
| Explicit-server query and TCP test limits | [Microsoft nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup), [Test-NetConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection?view=windowsserver2025-ps) |
| macOS current resolvers and nondisruptive diagnostic workflow | [Apple scutil source manual](https://github.com/apple-oss-distributions/configd/blob/main/scutil.tproj/scutil.8), [Apple Wireless Diagnostics](https://support.apple.com/guide/mac-help/use-wireless-diagnostics-mchlf4de377f/mac) |
| Linux manager/profile variation and actual resolver state | [NetworkManager nmcli](https://networkmanager.pages.freedesktop.org/NetworkManager/NetworkManager/nmcli.html), [IPv4 settings](https://networkmanager.pages.freedesktop.org/NetworkManager/NetworkManager/settings-ipv4.html), [systemd resolvectl source](https://github.com/systemd/systemd/blob/main/man/resolvectl.xml) |
| Linux route fields and link-local scope | [Debian iproute2 manual](https://manpages.debian.org/trixie/iproute2/ip-route.8.en.html), [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html) |

Ubuntu's existing official OpenSSH installation link was surfaced by official-site search, but repeated full-page fetches timed out in this pass. The supplied package/service preparation is retained with effective-configuration checks and a stop condition; no successful VM installation is claimed. Feature support is tied to the actual documented Cisco release instead of generalized to every IOS image.

## Verification and limits

- Full content validator: **0 errors**; **0 warnings for chapters 29–30**. Ten existing warnings concern foundation 00/01 questions without direct blueprint tags.
- Targeted use of the app's actual React Markdown/CodeBlock renderer: **672 rendered fragments passed**, including both closed-by-default challenge disclosures.
- Exact ledger coverage/equality: **131 decisions passed**; every current/baseline union identity appears once, correct/incorrect answer indices agree, all wrong options have feedback, sorted demand and stable lesson section IDs verified. Confirmed retirement destination `dhcp-t01` exists.
- **24 independent Node numerical assertions passed**: 180,000,000 − 70,000,000 = 110,000,000 storage bytes; original probe 30 bytes and new handover 25 bytes including newline; 50 DHCP addresses from .100 through .149; infrastructure/static-client exclusions; /16 versus /24 membership; /27 mask, network, usable endpoints and broadcast; direct gateway membership; /24 route specificity before /0 metrics; /24 and /25 hexadecimal masks.
- The new challenge network is `192.168.60.0/27`, usable .1–.30, broadcast .31. PC-C .40.60 is outside the existing DHCP range. A gateway correction cannot correct a DNS record; the retests exercise those distinct failures.
- Parent independently read both complete labs and the banks. Its demand, duplicate-item, symptom-title and stale table-reference refinements are applied. Parent handles the final batch-wide peer record and integration.
- No Packet Tracer, Catalyst, CML, Ubuntu VM or three-OS execution was performed. Output is representative or learner-observed; device/service versions, permissions and simulator capabilities must be checked at execution. File transfer, user/host authentication and application tests are not inferred from mere configuration presence.

All authoring was performed through transient tool scripts; no author script was saved in the checkout. Assets are frozen after this record except for a material review finding.
