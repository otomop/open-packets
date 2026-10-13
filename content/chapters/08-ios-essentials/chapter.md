---
id: ios-essentials
number: 8
title: Secure device access
subtitle: Local accounts, console and VTY lines, SSH, and a reliable way to verify access.
part: foundations
domain: services
minutes: { lesson: 55, lab: 70 }
summary: Build and verify local device access with named users and SSH. Distinguish session transport, authentication, privilege and saved configuration, then diagnose a failed login without losing console access.
objectives:
  v1: ["2.8", "4.8", "5.3"]
  v2: ["4.1"]
prereqs: [start-here, ipv4-addressing, tcp-udp-ports, ethernet-switching]
sectionIds:
  Why management access needs protection: why-device-access-comes-first
  Review the IOS workflow: modes-prompts-and-the-two-configurations
  Local accounts and privileged access: passwords-secrets-and-the-local-user-database
  Console and VTY line settings: lines-console-aux-and-vty
  Choose a management method: remote-access-telnet-ssh-http-https-and-the-management-menu
sources:
  - { title: "Cisco: Protecting secrets on network devices", url: "https://www.cisco.com/c/en/us/about/trust-center/resilient-infrastructure/protecting-secrets.html" }
  - { title: "Cisco: Configure SSH on routers", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html" }
  - { title: "IETF RFC 4253: SSH transport and legacy version compatibility", url: "https://www.rfc-editor.org/rfc/rfc4253.html" }
  - { title: "Cisco: Understand Cisco IOS password encryption", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/remote-authentication-dial-user-service-radius/107614-64.html" }
  - { title: "Cisco: Guide to harden Cisco IOS devices", url: "https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html" }
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
---

A working network must also be manageable. You need a dependable way to reach each device, identify the person signing in, and give that session the intended level of access. This chapter builds on the command-line introduction in Start here. The main task is now to configure local accounts and SSH, verify them from a second session, and diagnose failures in a deliberate order.

## Why management access needs protection

The **management plane** is the part of a device used to administer and monitor it. Console sessions, remote command-line sessions and a device's web interface are management paths. Protecting these paths matters because a user who can change the configuration can also change forwarding, credentials and access controls.

Separate four questions when reading a configuration. Can the client reach the device? Which session transport is accepted? How is the user authenticated? What may the authenticated session do? A correct password cannot repair a broken IP path, and a running SSH server does not mean its VTY lines accept SSH. These are separate checks.

For v1.1, this chapter covers management access methods, SSH configuration and local passwords. For v2.0, it supplies the local-user foundation for device management; [AAA: TACACS+ and RADIUS](#/chapter/aaa-tacacs-radius) adds centralized AAA configuration. Source-address filtering is developed in [Access control lists](#/chapter/acls), after wildcard masks and rule order are taught.

:::facts
- `login local` uses the local `username` database. With ordinary local authentication, a line's shared `password` is not its fallback.
- `enable secret` takes precedence over `enable password` for the same privilege level in the basic local configuration used here.
- SSH uses TCP `22`; Telnet uses TCP `23`. `transport input ssh` restricts the selected VTY lines to SSH.
- `show ip ssh` reports the SSH server configuration; `show ssh` reports SSH sessions; `show users` identifies active terminal lines and their users.
- A local account defaults to privilege `1`; `privilege 15` grants privileged EXEC access. These examples assume no AAA method lists or custom command authorization.
- Inspect the available VTY lines on the actual device. A five-line example is not proof that the device has only five lines.
:::

## Review the IOS workflow

Start here introduced prompts and configuration storage. Here, use that knowledge as an operating procedure: inspect, change, verify, and save. Know the mode before typing a command, especially when moving between interface configuration and line configuration.

| Prompt | Meaning | Typical action here |
|---|---|---|
| `R1>` | User EXEC | Basic monitoring; enter `enable` |
| `R1#` | Privileged EXEC | Inspect configuration, save, enter configuration mode |
| `R1(config)#` | Global configuration | Create a local user or enable SSHv2 |
| `R1(config-if)#` | Interface configuration | Configure the management-facing IP interface |
| `R1(config-line)#` | Line configuration | Set authentication, transport and idle timeout |

Most configuration commands affect the **running configuration** as you enter them. Saving copies that configuration into the **startup configuration**, which the normal boot process reads. Traditional IOS platforms expose startup configuration through NVRAM; storage details vary by platform. The useful distinction is active state versus saved boot configuration, rather than assuming every device stores the file on identical hardware.

```ios R1
R1# show running-config
R1# configure terminal
R1(config)# hostname R1
R1(config)# end
R1# copy running-config startup-config
```

When the copy command asks `Destination filename [startup-config]?`, press Enter to accept the destination. That response is interactive input, not another IOS command. Saving a Packet Tracer project also preserves the simulator workspace; it is a separate action from saving the device configuration.

Output filters help you inspect the relevant configuration. `show running-config | section line vty` displays VTY sections on supporting images; `| include username` displays matching user lines. If a simulator does not support a filter, read the corresponding part of the full output. Do not confuse missing output caused by an unsuitable filter with proof that a feature is absent.

Erasing startup configuration is not a universal factory reset. VLAN databases, keys and other files may have separate persistence. Use a new blank simulator device for this chapter, rather than trying to reset an existing device that may hold useful work.

## Local accounts and privileged access

**Authentication** verifies an identity. **Privilege** determines the commands available to the resulting session. In this chapter, local usernames provide authentication, and the user's configured privilege controls the initial EXEC level. More detailed authorization and accounting are introduced with AAA.

```ios R1
R1(config)# enable secret EnableLabSecret8
R1(config)# username admin privilege 15 secret AdminLabSecret8
R1(config)# username trainee secret TraineeLabSecret8
```

These are example lab credentials. `admin` starts at privilege 15 when the line uses the local database. `trainee` defaults to privilege 1 and enters privileged EXEC with `enable` and the enable secret. `show privilege` confirms the current level; the prompt alone is a useful clue, but the command is a direct check.

The `secret` keyword stores a password verifier rather than a cleartext password. A **hash** is a computed value used to check a password without storing the original text; it is not encryption that can be reversed with a decryption key. An attacker can still guess candidate passwords and compare their computed verifiers. Supported algorithms and defaults depend on the software. Older IOS and simulator configurations often display type 5; current software can support stronger types such as 8 and 9. Hashing is therefore not a substitute for strong credentials and restricted access to configuration files.

| Stored form | What to recognize | Practical implication |
|---|---|---|
| Type `0` | Cleartext password | Reading the configuration reveals the password |
| Type `7` | Reversible obfuscation | Does not provide strong protection for a stored credential |
| Type `5` | MD5-based password hash | Legacy verifier; prefer stronger supported types |
| Type `8` | PBKDF2-SHA-256 verifier | Availability and syntax depend on the image |
| Type `9` | scrypt verifier | Availability and syntax depend on the image |

On traditional IOS, `service password-encryption` obscures applicable cleartext password fields using type 7. It does not encrypt Telnet traffic and does not convert an enable secret into a stronger hash. Removing the command does not automatically recover plaintext for already converted fields. The important skill is distinguishing stored-password handling from protection of the session carrying the password.

:::trap Privileged access and login are separate
Setting `enable secret` does not create a local username or configure line authentication. Creating a local username does not make a line use it. Read the user, privilege and line settings together before deciding how a login will behave.
:::

## Console and VTY line settings

A **console line** is associated with the local console connection. A **VTY**, or virtual terminal line, supports remote terminal sessions such as SSH. Some devices also have an auxiliary port. Physical connectors, console speeds and the number of remote lines depend on the platform; a common serial-console setting on the lab router is 9600 baud, 8 data bits, no parity and 1 stop bit.

The console does not require a working IP interface. That makes it a useful recovery path while configuring remote access. It is still an authenticated management path once you protect it; a console cable does not bypass configured credentials or guarantee access during every boot or hardware failure.

| Line setting | Effect in the basic local configuration |
|---|---|
| `password` followed by `login` | Uses a shared line password |
| `login local` | Checks a named user in the local database |
| `exec-timeout 5 0` | Ends an idle EXEC session after five minutes |
| `logging synchronous` | Redisplays the prompt/input around unsolicited messages |
| `transport input ssh` | Accepts SSH as the incoming VTY transport |

The two `exec-timeout` arguments are minutes and seconds. Setting both to zero disables the idle timeout; it does not disconnect a session immediately. Use the finite timeout required by the exercise.

Create and verify the account before applying `login local`. Keep the current console session open and test a separate login before disconnecting. An existing authenticated session is not proof that the next login will succeed.

```ios R1
R1(config)# line console 0
R1(config-line)# login local
R1(config-line)# exec-timeout 5 0
R1(config-line)# logging synchronous
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# exec-timeout 5 0
R1(config-line)# end
```

The example covers VTY 0–4. Inspect `show line`, the VTY sections in `show running-config`, and `line vty ?` on your device. If it also has VTY 5–15, apply the same intended policy there. Different line ranges can have different authentication and transport settings, so verify each range without assuming a router-versus-switch rule.

A banner communicates an access notice; it is not an authentication mechanism. For example, `banner motd #Authorized lab users only#` uses `#` as the delimiter. Banner timing can differ with the protocol and platform. Learn what the banner does and how its delimiter works, rather than relying on one universal display order.

## Choose a management method

**In-band management** uses the production network or its forwarding infrastructure. **Out-of-band management** uses a separate management path. Ethernet and SSH can be part of either design; the protocol alone does not establish whether the path is separate. A direct serial console is the local out-of-band example in this lab.

| Method | Role | What must be considered |
|---|---|---|
| Console | Local CLI access | Physical access, console settings and authentication |
| Telnet | Remote CLI over TCP 23 | Carries session data without SSH-style protection |
| SSH | Protected remote CLI over TCP 22 | IP reachability, server keys, compatible algorithms, line policy and credentials |
| HTTP / HTTPS | Web management, commonly TCP 80 / 443 | HTTPS uses TLS; enable only the required web service and validate its identity |
| TACACS+ / RADIUS | Central AAA services consulted by the device | These support access decisions; they do not replace the administrator's SSH session |
| Cloud management | Administration through a vendor service | Connectivity, identity, supported functions and fallback access vary by product |

SSH protects the authenticated session, but encryption alone does not prove that you reached the intended server. A **host key** supplies the server's cryptographic identity: the server keeps the private part of the key pair, while the client can check the public part. This is separate from the user's login password. A client may ask you to verify a host key on first connection. In a real environment, compare that identity with a trusted record. Do not teach yourself to accept unexpected key changes automatically.

Cloud-managed products use different control and management designs. Do not infer that every device uses only outbound HTTPS or lacks local access. For CCNA, recognize the management approach and its dependencies; product-specific ports and recovery procedures belong in the product documentation.

## Configure SSH step by step

Use the conventional hostname/domain/RSA-key workflow below on a supported IOS image. Some platforms support additional key-management methods; the point is to build one complete, verifiable configuration. Setting a domain name for device identity does not require a DNS server or a DNS query to generate the key.

```diagram
{"type":"topology","title":"Local and remote access to R1","caption":"The console remains available while the PC tests SSH over the directly connected subnet.","nodes":[{"id":"CON","kind":"laptop","label":"Console laptop","sub":"Serial console","x":2,"y":1},{"id":"PC","kind":"pc","label":"Admin PC","sub":"10.8.0.10/24","x":2,"y":5},{"id":"SW","kind":"switch","label":"SW1","sub":"Same LAN","x":6,"y":5},{"id":"R","kind":"router","label":"R1","sub":"Gi0/0 10.8.0.1/24","x":10,"y":3}],"links":[{"from":"CON","to":"R","label":"Console","style":"dashed"},{"from":"PC","to":"SW","label":"Ethernet"},{"from":"SW","to":"R","label":"SSH over IP","accent":true}],"trace":{"flows":[{"path":["PC","SW","R"],"back":true,"label":"ssh -l admin 10.8.0.1","tags":{"SW":"Same subnet · no routed hop","R":"SSHv2 · VTY login local · admin"}}],"chips":[{"node":"CON","text":"Console stays available"}]}}
```

First establish the IP path. R1's address is `10.8.0.1/24`; the PC is `10.8.0.10/24`. They can communicate directly on this subnet, so no routed transit path is needed. A remote management subnet would also require correct forwarding and a return path. An IP address assigned to a Layer 2 switch's management SVI does not, by itself, enable that switch to route user traffic; Chapter 11 develops the distinction.

```ios R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.8.0.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# hostname R1
R1(config)# ip domain-name lab.test
R1(config)# crypto key generate rsa general-keys modulus 2048
R1(config)# ip ssh version 2
R1(config)# end
R1# show ip ssh
```

The local accounts and VTY policy from the previous sections complete this configuration. Key-generation syntax and supported sizes vary. If the full command is rejected, use contextual help; some images accept the shorter form or prompt for a modulus after `crypto key generate rsa`. Use 2048 bits for this lab where supported, rather than memorizing an obsolete minimum as a security recommendation.

From a Packet Tracer PC, use the following command and enter the configured password when asked. A desktop SSH client may instead use `ssh admin@10.8.0.1`.

```text
ssh -l admin 10.8.0.1
```

## Verify and troubleshoot

Inspect configuration and operational evidence separately. The following output is an abbreviated representative example, not a transcript from a simulator run.

```output R1# show ip ssh
SSH Enabled - version 2.0  ← server is enabled for SSHv2
Authentication timeout: 120 secs; Authentication retries: 3
```

This proves the reported server state. It does not prove that the PC can reach R1, that all VTY lines accept SSH, or that the account is valid. Verify those conditions, then open a new session and run `show privilege` as each test user. `show users` identifies sessions and may show the client's address in its Location column; `show ssh` supplies SSH-session details.

On some older images, `SSH Enabled - version 1.99` denotes compatibility with both SSHv1 and SSHv2. It does not mean a third protocol called SSH 1.99. Use the taught `ip ssh version 2` setting and verify the reported version when the requirement is SSHv2 only; do not assume all platforms start in that legacy mode.

| Observation | Next check | Why |
|---|---|---|
| Interface is administratively down | Interface configuration and `no shutdown` | Remote access needs a usable IP path |
| SSH server reports disabled | Image support, key configuration and SSH settings | A local account alone does not start the SSH service |
| SSH is enabled, but connection is refused | All VTY transport settings and access policy | Server state and accepted line transports are separate |
| Credentials are rejected | Exact username, secret and authentication method | `login local` needs a matching local account |
| Login succeeds at `>` instead of `#` | `show privilege` and user privilege | Authentication succeeded; authorization level is the separate issue |
| Access breaks after reload | Saved configuration and actual boot state | The verified running configuration may not have been saved |

A successful ping is evidence of ICMP reachability under the test conditions. It is not an SSH test. Conversely, a blocked ICMP response does not alone prove that TCP 22 is unreachable. Test the service you intend to use, and keep configuration changes small enough that you can identify which one affected the result.

## Exam focus

- Distinguish console access, remote-session transport, authentication and privilege.
- Configure a local username and enable secret, then explain `login` versus `login local`.
- Configure the hostname/domain/key/SSHv2 workflow and restrict every intended VTY line to SSH.
- Verify the actual line range instead of assuming a fixed count by device family.
- Recognize the difference between a stored secret, type 7 obfuscation and session encryption.
- Use `show ip ssh`, `show ssh`, `show users` and `show privilege` for their different purposes.
- Test a new login before closing the working session; save the verified configuration.
- Leave centralized AAA and source-address ACL construction to their dedicated chapters.

You should now be able to separate forwarding, session transport, login identity, privilege and persistence when a management test fails. The next chapter returns to the LAN itself: you will put access ports into distinct VLANs and prove their separation before adding trunks or routing.
