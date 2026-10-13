---
id: file-management
number: 29
title: Configuration and software files
subtitle: Back up safely, choose the correct transfer protocol, and distinguish a staged file from an active configuration.
part: services
domain: services
minutes: { lesson: 65, lab: 110 }
summary: Read IOS storage and copy destinations, explain TFTP and FTP, perform isolated SCP/SFTP backups and staging, and verify files without blindly replacing configuration or activating software.
objectives:
  v1: ["4.9"]
  v2: ["4.2"]
prereqs: [ios-essentials, static-routing-ipv4]
sectionIds:
  "Why file management matters": why-file-management-matters
  "Find the file and its storage": where-ios-keeps-its-files
  "Read a copy operation from left to right": the-copy-command-and-its-url-forms
  "TFTP, FTP, SCP and SFTP": tftp-ftp-scp-and-sftp
  "Merge, replace and archive": merge-replace-and-archive
  "Stage and verify software before activation": images-boot-system-and-the-config-register
  "Verify and troubleshoot transfers": verify-and-troubleshoot
  "Exam focus": exam-focus
sources:
  - { title: "GNU Coreutils: Numeric file permissions", url: "https://www.gnu.org/software/coreutils/manual/html_node/Numeric-Modes.html" }
  - { title: "Ubuntu: Desktop installation guide", url: "https://ubuntu.com/tutorials/install-ubuntu-desktop" }
  - { title: "Cisco: Catalyst 9300 file systems, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/working_with_the_flash_file_system.html" }
  - { title: "Cisco: Configuration replace and rollback", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/config-mgmt/configuration/15mt/config-mgmt-15-mt-book/cm-config-rollback.html" }
  - { title: "Cisco: IOS XE 17 configuration replacement", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/mgmt/config-replace/configuration-replace.html" }
  - { title: "RFC 1350: TFTP", url: "https://www.rfc-editor.org/rfc/rfc1350" }
  - { title: "RFC 2348: TFTP block-size negotiation", url: "https://www.rfc-editor.org/rfc/rfc2348" }
  - { title: "RFC 959: FTP", url: "https://www.rfc-editor.org/rfc/rfc959" }
  - { title: "Cisco: Basic file transfer services", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/system-management/system-management/m_ifs-file-trans-0.html" }
  - { title: "Cisco: IOS XE 17 Secure Copy", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-usr-ssh-sec-copy-0.html" }
  - { title: "Cisco: Catalyst 9300 SSH, IOS XE 17.16", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-16/configuration_guide/sec/b_1716_sec_9300_cg/configuring_secure_shell__ssh_.html" }
  - { title: "Cisco: Catalyst 9300 SFTP, IOS XE 17.16", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-16/configuration_guide/sec/b_1716_sec_9300_cg/configuring_sftp.html" }
  - { title: "Cisco: Catalyst 9000 file transfer operations", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/mgmt/file-transfer-protocol-configuration-guide/file-transfer-ptotocl.html" }
  - { title: "Cisco: IOS XE image hashes and authenticity", url: "https://sec.cloudapps.cisco.com/security/center/resources/forensic_guides/iosxe_forensic_guide.html" }
  - { title: "Cisco: Catalyst 9300 SSH server authentication, IOS XE 17.16", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-16/configuration_guide/sec/b_1716_sec_9300_cg/secure_shell_version_2_support.html" }
  - { title: "Cisco: SSH public-key and strict-host-key commands", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/d1/sec-d1-cr-book/sec-cr-i3.html" }
  - { title: "Cisco: IOS XE SSH public-key display example", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/222700-resize-default-ssh-rsa-keys-on-cisco-ios.html" }
  - { title: "OpenSSH: ssh-keygen public-key fingerprints", url: "https://man.openbsd.org/ssh-keygen" }
  - { title: "OpenSSH 9.0 release notes", url: "https://www.openssh.org/txt/release-9.0" }
  - { title: "Ubuntu: OpenSSH server setup", url: "https://ubuntu.com/server/docs/how-to/security/openssh-server/" }
---

A useful backup must be the right file, from the right device, at a known time, stored somewhere that survives the device's failure. A configuration sitting only on the same router's flash is useful for a local comparison, but it will not help if the router and its storage are lost.

This chapter separates **moving files**, **applying configuration**, and **activating software**. The transfer protocol protects or transports the bytes. The destination determines whether a configuration changes immediately, is saved for boot, or merely becomes a staged file.

## Why file management matters

Before a change, record the device name, model, software release, current boot information and relevant operating state. Keep both the running configuration and the startup configuration if they differ. An unsaved working change may exist only in running-config; a previously saved recovery point may exist only in startup-config.

A **hash** is a fixed-length value calculated from bytes using a specified algorithm. It serves as a compact fingerprint for comparing files or keys; it does not encrypt the original content. A password verifier, introduced in Chapter 8, uses a password-hashing process for a different purpose: checking a submitted secret without storing that secret as readable text.

A configuration backup can contain password hashes, shared secrets, community strings, addressing and management details. Encrypt it in transit and restrict access to the stored copy. Encryption during transfer does not automatically encrypt the resulting file on the server.

:::facts
- `running-config` is the active configuration.
- `startup-config` is the saved configuration normally read during startup.
- A named file such as `flash:R1-before.cfg` is a stored file, not automatically active.
- `copy` reads a source and writes a destination. Read both before pressing Enter.
- Copying software to storage does not activate it.
:::

Use filenames that identify the device and checkpoint, such as `R1-before-routing-change.cfg`. A date is useful when clocks are correct; a meaningful change label is useful even in a simulator with an inaccurate clock. Check the destination rather than relying on the router's success message alone. A restore plan should say what kind of file it is and how it will be used.

## Find the file and its storage

IOS exposes storage through file-system prefixes. Start with `show file systems`, then inspect a specific prefix with `dir`. Never assume a router or switch has a fixed flash capacity or the same aliases as a different model.

| Location | Purpose | Important distinction |
|---|---|---|
| `system:` / running-config | Active configuration and system objects | Not a normal disk directory |
| `nvram:` / startup-config | Saved startup configuration on many IOS devices | Logical storage details vary |
| `flash:`, `flash0:` or `bootflash:` | Local persistent files | Use prefixes actually listed |
| `tftp:`, `ftp:`, `scp:`, `sftp:` | Remote transfer access | A listed protocol is not a local disk |

On some platforms `flash:` aliases another prefix. The asterisk in `show file systems` indicates the default file system. Use explicit prefixes in your work so a later default-directory change cannot redirect a file unexpectedly. A boot marker or a directory listing does not by itself prove which image is currently running; inspect `show version`.

Representative excerpt:

```output R1# show file systems
      Size(b)      Free(b)     Type  Flags  Prefixes
*   256000000     180000000     disk     rw  flash0: flash:   ← aliases in this example
       262144        240000    nvram     rw  nvram:
            -             -  network    rw  tftp:           ← remote access, not disk capacity
```

Here a 70,000,000-byte file fits in the reported 180,000,000 free bytes. That calculation says nothing about the RAM, platform compatibility or installation workspace needed to run the software. Read capacity values in bytes; decimal MB and binary MiB are different units.

Older switches may store configuration in files such as `config.text`; newer IOS XE devices can use different arrangements. Other state, including VLAN databases, certificates and keys, may require its own documented backup method. A startup-config is not an exact disk image or a complete backup of every operational state.

## Read a copy operation from left to right

The basic form is `copy source destination`. Take the time to say the operation in plain language:

| Operation | Effect |
|---|---|
| `copy running-config startup-config` | Save active configuration for startup |
| `copy running-config flash:R1-before.cfg` | Create a named local backup |
| `copy running-config tftp:` | Send the active configuration to a TFTP server |
| `copy tftp: flash:R1-received.cfg` | Stage a remote file locally |
| `copy flash:R1-before.cfg running-config` | Apply the file's commands as a merge |
| `copy flash:R1-before.cfg startup-config` | Replace the saved startup file; active configuration remains as it was |

An interactive copy may ask for host, username, source filename, destination filename and password. The default in square brackets is accepted with Enter. Wait for each prompt; do not paste the next router command while the copy is waiting for a filename.

For example, `copy running-config tftp:` means the router is the client and sends a file to the server. The same router is also the client when `copy tftp: flash:` downloads a file. “Server” identifies the listening application, not whichever side currently sends the file's contents.

A URL can specify protocol, user, server and path. For example, a supporting IOS XE SFTP client can read `sftp://ccnafile@10.29.0.100//home/ccnafile/ccna-files/probe.txt` and write `flash:probe-sftp.txt`. The doubled slash after the host explicitly introduces the absolute path in the documented IOS URL form. Use password prompting rather than embedding a real password in a URL or shared notes.

## TFTP, FTP, SCP and SFTP

**TFTP** is a small UDP-based file-transfer protocol without built-in login authentication or encryption. A read or write request goes to server UDP port 69. The server selects a transfer identifier, used as its UDP port for the subsequent exchange with the client's selected port. Retransmitted requests can still target port 69, so “port 69 is used only by exactly one packet” is too rigid.

Base TFTP uses 512-byte data blocks with acknowledgments and retransmission. Extensions can negotiate a different block size; do not assume every observed TFTP block must contain exactly 512 bytes. A firewall must account for the transfer exchange, not just the listening port. Server permissions still control which files can be read or created, despite the protocol lacking user login.

**FTP** uses a TCP control session, normally to server port 21, for login and commands. File contents and directory listings use a separate data connection. With classic active FTP, the server initiates that connection toward the client's advertised port; the standard default server data port is 20. In passive FTP, the client connects to a port advertised by the server.

```diagram
{"type":"sequence","title":"Passive FTP uses two connections","actors":["FTP client","FTP server"],"steps":[{"from":0,"to":1,"label":"TCP connection to port 21","note":"Login and control commands"},{"from":0,"to":1,"label":"Request passive transfer"},{"from":1,"to":0,"label":"Advertise a data endpoint"},{"from":0,"to":1,"label":"Separate TCP data connection","note":"File data or directory listing uses this connection"}],"caption":"A successful login tests the control session; it does not prove that the separate data connection works."}
```

Classic FTP exposes credentials and data to observation along the path. It remains part of the v1.1 description objective, but use the isolated simulator for its practical exercise. IOS `ip ftp username` and `ip ftp password` configure client credentials, not a new FTP server. Stored credentials can appear in configuration backups. `ip ftp passive` restricts the client to passive mode; do not assume the default selection is identical across every release.

| Protocol | Common transport | User authentication and encryption |
|---|---|---|
| TFTP | UDP, initial server port 69 | Neither supplied by base TFTP |
| FTP | TCP 21 control; separate data connection | Login available, normally cleartext |
| SCP | SSH, normally TCP 22 | SSH authentication and encrypted transport |
| SFTP | SSH, normally TCP 22 | SSH authentication and encrypted transport |

**SFTP is not FTP over TLS**, which is called FTPS. SFTP and classic SCP are different protocols carried over SSH. An SSH server has a related **public/private key pair**: the public key can be shared, while the server keeps the private key and proves possession during authentication. A **host-key fingerprint** is a hash of the public key used for comparison. Server identity matters: compare that fingerprint or key with a value obtained through a trusted path and ensure the client enforces the identity check. A changed host key deserves investigation instead of disabling checks.

Cisco's cited IOS XE implementation supports an SCP server after SSH, authentication and EXEC authorization are correctly configured. Authentication checks the account; EXEC authorization determines whether that account may obtain the required session and privilege. The lab supplies a local-only AAA setup and explains its bindings before use. Chapter 33 develops central servers and fallback policies. The lab uses a privilege-15 local account on a fresh isolated device. That is a high-privilege lab account, not a reason to give all production backup users unrestricted access.

The cited Catalyst 9300 IOS XE SFTP implementation is a **client**, requires a configured SSH source interface, and does not provide an SFTP server or SFTP boot. Check the platform guide before applying those restrictions to another Cisco operating system.

OpenSSH 9.0 changed the workstation `scp` program to use SFTP by default. A classic-SCP-only IOS server may reject that subsystem even after SSH authentication succeeds. For that known compatibility case, `scp -O` selects the legacy SCP protocol. It still uses SSH encryption. It does not repair an incorrect password, unsupported SSH algorithms or missing file authorization.

## Merge, replace and archive

Copying into running-config submits configuration commands to the current configuration. This is a **merge**, not a request to make the device exactly equal to the source file. A file containing `hostname R1` changes the hostname. If it says nothing about an extra loopback that was added later, that interface can remain.

Commands in a merged file can still replace values or remove configuration through explicit `no` commands. “Merge means nothing can be removed” is therefore wrong. A successful transfer also does not prove that every configuration command was accepted by the target software.

Copying into startup-config replaces the saved startup file without immediately applying it. A subsequent normal startup can read that file, subject to the device's boot and configuration-loading settings. Saving the current running configuration over it would overwrite the newly restored checkpoint. This lab observes the distinction without reloading.

On supporting platforms, `configure replace` compares the active configuration with a **complete** replacement configuration and applies differences, including removals. It is more than a file copy and can interrupt access. Validate platform compatibility, keep console recovery available, inspect errors and compare the resulting configuration. The feature has restrictions; it is not a universal transactional guarantee for every subsystem.

The `archive` feature can keep configuration snapshots at a configured path, optionally on saves or at intervals. It helps preserve checkpoints, but on-device archives still share the device's failure risks. Detailed rollback automation and destructive password-recovery procedures are outside this chapter's required transfer task.

:::trap A backup can be correct while its restoration method is wrong
If the intended outcome is to remove a temporary setting absent from a backup, merging that backup may leave the setting in place. Compare the active result with the intended state before claiming recovery.
:::

## Stage and verify software before activation

A software file needs three distinct decisions: is it appropriate, did it arrive intact, and should it become active? The v2.0 secure-file objective includes managing configuration and software files. It does not turn every image installation command into a safe universal upgrade recipe.

Before staging actual software, identify the exact device model, release, licensing and boot mode. Use Cisco's authorized download and release documentation, including memory requirements and supported upgrade paths. Keep a current working image and a recovery plan. Insufficient free space calls for a reviewed storage plan, not automatic deletion of the running image.

Transfer the approved file to a named local destination. Compare its size and a strong published hash, such as SHA-512 where supported. For example, `verify /sha512 flash:approved-image.bin` computes a value to compare against Cisco's trusted download metadata. `verify /md5` is available on many older images and is useful for transfer-error checks, but MD5 is not a modern authenticity guarantee. A hash copied from the same untrusted source as the file does not establish trustworthy origin.

A mismatch means stop: check the expected filename and hash, the transfer destination and the stored bytes. Keep the device running its current software while investigating. Cisco's digital-signature/authenticity features provide additional checks on supporting platforms.

Older IOS commonly boots a monolithic image. IOS XE install mode may boot a provisioning file such as `packages.conf` that references multiple package files; copying only that manifest is not a complete software backup. Bundle and install workflows differ. Read the running image information with `show version` and the supported boot display, such as `show boot` or `show bootvar`.

The legacy router configuration register is also platform-specific. On classic ISR examples, `0x2142` means to ignore startup-config, unlike normal `0x2102`. That recognition can explain an apparent missing configuration, but it is not a setting to experiment with during backup practice. Modern platform boot behavior should come from its own documentation, not the directory's first filename.

## Verify and troubleshoot transfers

Diagnose the stage that actually failed. If IP connectivity is available but the file transfer times out, test the relevant service and inspect client/server logs. A successful ping proves that ICMP worked for that source, destination and time; it does not prove TCP 22, UDP transfer ports, permissions or free space.

An SSH password rejection points toward the account and authentication policy. Successful SSH login followed by file permission denial points toward authorization, path or storage access. Successful FTP login followed by a stalled directory listing can implicate the separate data connection. A missing-file error calls for checking server-side path, case and permissions, not changing a routing protocol.

Verify the destination after every copy: correct filename, plausible size, readable content for text, and matching hash where possible. Protect backup contents in your notes. After applying a configuration, inspect the resulting configuration and operational behavior separately from transfer success.

## Exam focus

For v1.1, explain TFTP/FTP roles, transports, security limits and control/data behavior. For v2.0, practice secure configuration backup and software-file staging with SCP/SFTP, including client/server roles, SSH prerequisites, permissions and verification.

The lab offers Packet Tracer TFTP/FTP practice plus a separate IOS XE/OpenSSH secure-transfer exercise. If the secure features are unavailable, work through the diagnostics and obtain time on a supporting image before treating those hands-on skills as complete. None of the representative output claims an executed transfer or an activated image.
