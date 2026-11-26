---
id: file-management
number: 29
title: Configuration and software files
subtitle: Back up safely, choose the correct transfer protocol, and distinguish a staged file from an active configuration.
part: services
domain: services
minutes: { lesson: 65, lab: 60 }
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

A switch fails at 02:00 and its replacement arrives with a blank configuration. Whether the site is back in ten minutes or two hours depends on whether a current copy of the old configuration exists somewhere other than on the dead switch, and on whether you can get it onto the new one. A software upgrade raises the same questions: the new image has to be copied to the device, checked, and only then made active.

You have been saving configurations with `copy running-config startup-config` since the first chapters. This chapter extends `copy` to files in flash and on remote servers. By the end you will be able to find where IOS keeps its files, read any `copy` command and predict what it changes, describe what TFTP and FTP do, move configuration and software files securely with SCP and SFTP, and verify a file before you rely on it.

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

IOS names every place a file can live with a prefix that ends in a colon, much as a PC uses drive letters. `show file systems` lists the prefixes a device has, and `dir flash:` lists the files in one of them. Prefixes differ between models (`flash:` on one, `bootflash:` on another), so look before you type.

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

**TFTP**, the Trivial File Transfer Protocol, is the simplest way to move a file. It runs over UDP, has no login and no encryption, and can only read or write a named file; it cannot even list a directory. That simplicity is why it is still used to load IOS images and configurations on a trusted management network, and why it must not carry secrets across an untrusted one. The client sends its first request to UDP port 69 on the server. The server answers from a new port that it picks for that transfer, and the rest of the exchange uses that port, so a firewall has to allow more than port 69.

UDP does not guarantee delivery, so TFTP provides its own: data travels in numbered blocks of 512 bytes, and each block is acknowledged before the next is sent. A shorter block marks the end of the file. The only access control is the server's own file permissions.

**FTP**, the File Transfer Protocol, is the fuller protocol. It runs over TCP, requires a username and password, and can list, rename and delete files as well as transfer them. It uses two connections. The **control connection**, to server TCP port 21, carries the login and the commands. Each file or directory listing travels on a separate **data connection**. In **active** mode the server opens the data connection, from its port 20, to a port the client announces. In **passive** mode the client opens it to a port the server announces, which works better through firewalls and NAT because both connections start from the client.

```diagram
{"type":"sequence","title":"Passive FTP uses two connections","actors":["FTP client","FTP server"],"steps":[{"from":0,"to":1,"label":"TCP connection to port 21","note":"Login and control commands"},{"from":0,"to":1,"label":"Request passive transfer"},{"from":1,"to":0,"label":"Advertise a data endpoint"},{"from":0,"to":1,"label":"Separate TCP data connection","note":"File data or directory listing uses this connection"}],"caption":"A successful login tests the control session; it does not prove that the separate data connection works."}
```

FTP authenticates but does not encrypt: the username, password and file contents all cross the network in clear text. On IOS, `ip ftp username` and `ip ftp password` store the credentials the router uses as an FTP client. They do not make the router an FTP server, and they appear in the configuration and therefore in its backups. `ip ftp passive` makes the client use passive mode.

| Protocol | Common transport | User authentication and encryption |
|---|---|---|
| TFTP | UDP, initial server port 69 | Neither supplied by base TFTP |
| FTP | TCP 21 control; separate data connection | Login available, normally cleartext |
| SCP | SSH, normally TCP 22 | SSH authentication and encrypted transport |
| SFTP | SSH, normally TCP 22 | SSH authentication and encrypted transport |

**SCP** (Secure Copy) and **SFTP** (SSH File Transfer Protocol) both run inside an SSH session on TCP port 22, so the login and the file contents are encrypted. They are the protocols to use for real configurations and images. SCP only copies files; SFTP can also list and manage them. Despite its name, SFTP is unrelated to FTP. FTP secured with TLS is a different protocol called FTPS.

SSH also lets the client check which server it has reached. Every SSH server has a **host key**, a public/private key pair, and presents the public half when a client connects. The client compares a **fingerprint**, a hash of that key, with one obtained by a trusted route such as the console. If a server's key changes unexpectedly, find out why before you send a password or a file.

An IOS device can be an **SCP server**, so that a workstation can pull a file from it or push one to it. That needs working SSH, the command `ip scp server enable`, and a user who is both authenticated and authorized at privilege level 15. Authorization is configured with AAA, which Chapter 33 covers; the lab supplies the few commands needed and explains them.

For SFTP, IOS XE platforms such as the Catalyst 9300 are a **client** only. The device can fetch a file from an SFTP server with `copy sftp:`, but a workstation cannot open an SFTP session to the device. The 9300 also needs `ip ssh source-interface` set.

One compatibility problem is common. Since OpenSSH 9.0, the workstation `scp` program uses the SFTP protocol underneath, which an IOS SCP server does not accept, so the copy fails after a successful login. `scp -O` forces the original SCP protocol. The session is still encrypted by SSH.

## Merge, replace and archive

Copying into running-config submits configuration commands to the current configuration. This is a **merge**, not a request to make the device exactly equal to the source file. A file containing `hostname R1` changes the hostname. If it says nothing about an extra loopback that was added later, that interface can remain.

Commands in a merged file can still replace values or remove configuration through explicit `no` commands. “Merge means nothing can be removed” is therefore wrong. A successful transfer also does not prove that every configuration command was accepted by the target software.

Copying into startup-config replaces the saved startup file without immediately applying it. A subsequent normal startup can read that file, subject to the device's boot and configuration-loading settings. Saving the current running configuration over it would overwrite the newly restored checkpoint. This lab observes the distinction without reloading.

On supporting platforms, `configure replace` compares the active configuration with a **complete** replacement configuration and applies differences, including removals. It is more than a file copy and can interrupt access. Validate platform compatibility, keep console recovery available, inspect errors and compare the resulting configuration. The feature has restrictions; it is not a universal transactional guarantee for every subsystem.

The `archive` feature can keep configuration snapshots at a configured path, optionally on saves or at intervals. It helps preserve checkpoints, but on-device archives still share the device's failure risks. Detailed rollback automation is outside this chapter.

:::trap A backup can be correct while its restoration method is wrong
If the intended outcome is to remove a temporary setting absent from a backup, merging that backup may leave the setting in place. Compare the active result with the intended state before claiming recovery.
:::

## Stage and verify software before activation

An upgrade is three separate steps: choose the right image, copy it to the device and check that it arrived intact, and only then make it the image the device boots. The v2.0 objective covers the first two, for configuration files and software files alike. Copying an image to flash changes nothing about what the device is running.

Before staging actual software, identify the exact device model, release, licensing and boot mode. Use Cisco's authorized download and release documentation, including memory requirements and supported upgrade paths. Keep a current working image and a recovery plan. Insufficient free space calls for a reviewed storage plan, not automatic deletion of the running image.

Transfer the approved file to a named local destination. Compare its size and a strong published hash, such as SHA-512 where supported. For example, `verify /sha512 flash:approved-image.bin` computes a value to compare against Cisco's trusted download metadata. `verify /md5` is available on many older images and is useful for transfer-error checks, but MD5 is not a modern authenticity guarantee. A hash copied from the same untrusted source as the file does not establish trustworthy origin.

A mismatch means stop: check the expected filename and hash, the transfer destination and the stored bytes. Keep the device running its current software while investigating. Cisco's digital-signature/authenticity features provide additional checks on supporting platforms.

Older IOS routers boot a single image file. `boot system flash:FILENAME` in global configuration names the image to load at the next reload; without it the router loads the first image it finds in flash. IOS XE install mode may boot a provisioning file such as `packages.conf` that references multiple package files; copying only that manifest is not a complete software backup. Bundle and install workflows differ. Read the running image information with `show version` and the supported boot display, such as `show boot` or `show bootvar`.

The **configuration register** on classic routers controls how the device starts. The normal value is `0x2102`. `0x2142` tells the router to ignore startup-config at boot. Password recovery uses it to get past a forgotten password, and it explains a router that comes up with an empty configuration although startup-config is intact. `show version` displays the current value on its last line.

Password recovery on a classic router follows from that. Interrupt startup with a break to reach ROMMON, enter `confreg 0x2142` and `reset`. The router boots without its saved configuration, so no password is asked for. Enter privileged mode, load the saved settings with `copy startup-config running-config`, set a new enable secret, and bring the interfaces back up with `no shutdown`, because a merged configuration leaves them administratively down. Then put the register back with `config-register 0x2102` and save. If you forget that last step, the router ignores its configuration again at the next reload.

## Verify and troubleshoot transfers

Diagnose the stage that actually failed. If IP connectivity is available but the file transfer times out, test the relevant service and inspect client/server logs. A successful ping proves that ICMP worked for that source, destination and time; it does not prove TCP 22, UDP transfer ports, permissions or free space.

An SSH password rejection points toward the account and authentication policy. Successful SSH login followed by file permission denial points toward authorization, path or storage access. Successful FTP login followed by a stalled directory listing can implicate the separate data connection. A missing-file error calls for checking server-side path, case and permissions, not changing a routing protocol.

Verify the destination after every copy: correct filename, plausible size, readable content for text, and matching hash where possible. Protect backup contents in your notes. After applying a configuration, inspect the resulting configuration and operational behavior separately from transfer success.

## Exam focus

- `copy source destination`: a copy into running-config merges, a copy into startup-config replaces the saved file, and a copy into flash only stores a file.
- TFTP uses UDP 69, has no authentication or encryption, and sends 512-byte blocks that are each acknowledged.
- FTP uses TCP 21 for control and a separate data connection (server port 20 in active mode). Its username and password travel in clear text.
- SCP and SFTP run over SSH on TCP 22 and encrypt both the login and the data.
- An IOS SCP server needs SSH, `ip scp server enable` and a privilege-15 user. A modern OpenSSH client needs `scp -O`.
- Check a transferred image with `verify /sha512` or `verify /md5` against the hash Cisco publishes before it is used.
- `show file systems` and `dir` show where files are. `show version` shows the running image and the configuration register.

For v1.1, describe what TFTP and FTP do and how they differ. For v2.0, carry out a secure backup and a secure file transfer with SCP or SFTP; the second half of the lab needs an IOS XE device or image, which Packet Tracer does not provide.
