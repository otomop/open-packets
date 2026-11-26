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

So far you have configured every device by clicking its CLI tab, which is the simulator's version of plugging a cable into the console port. A new router asks that console for no password at all, and it accepts no remote login. On a real network that leaves two problems: anyone who reaches the port has full control, and you have to walk to the device to change anything.

This chapter fixes both. It builds on the modes and saving from Start here, the addressing from Chapter 04 and the TCP ports from Chapter 06. By the end you will be able to create local user accounts, protect the console and the remote (VTY) lines, turn on SSH and shut out Telnet, verify the result from a second session, and work out which layer is at fault when a login fails.

## Why management access needs protection

The **management plane** is the part of a device used to administer and monitor it. Console sessions, remote command-line sessions and a device's web interface are management paths. Protecting these paths matters because a user who can change the configuration can also change forwarding, credentials and access controls.

Every remote login passes four gates in order, and each is configured in a different place. Can the client reach the device over IP? Does the line accept that protocol (Telnet or SSH)? Is the user authenticated? What privilege does the session get? When a login fails, find the first gate that is closed: a correct password cannot repair a broken IP path, and a running SSH server is no use if the VTY lines do not accept SSH.

For v1.1, this chapter covers management access methods, SSH configuration and local passwords. For v2.0, it supplies the local-user foundation for device management; [AAA: TACACS+ and RADIUS](#/chapter/aaa-tacacs-radius) adds centralized AAA configuration. Source-address filtering is developed in [Access control lists](#/chapter/acls), after wildcard masks and rule order are taught.

:::facts
- `login local` uses the local `username` database. With ordinary local authentication, a line's shared `password` is not its fallback.
- `enable secret` takes precedence over `enable password` for the same privilege level in the basic local configuration used here.
- SSH uses TCP `22`; Telnet uses TCP `23`. `transport input ssh` restricts the selected VTY lines to SSH.
- `show ip ssh` reports the SSH server configuration; `show ssh` reports SSH sessions; `show users` identifies active terminal lines and their users.
- A local account defaults to privilege `1`; `privilege 15` grants privileged EXEC access. These examples assume no AAA method lists or custom command authorization.
- Many devices have more VTY lines than the classic `0 4`; switches have `0 15`. Check with `line vty ?` and configure every line the device has.
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

Configuration commands change the **running configuration** the moment you enter them. It is held in RAM and is lost at a reload. Saving copies it to the **startup configuration**, which is kept in NVRAM and is what the device loads when it boots. An access policy that works but was never saved disappears at the next power cut.

```ios R1
R1# show running-config
R1# configure terminal
R1(config)# hostname R1
R1(config)# end
R1# copy running-config startup-config
```

When the copy command asks `Destination filename [startup-config]?`, press Enter to accept the destination. That response is interactive input, not another IOS command. Saving a Packet Tracer project also preserves the simulator workspace; it is a separate action from saving the device configuration.

Output filters help you inspect the relevant configuration. `show running-config | section line vty` displays VTY sections on supporting images; `| include username` displays matching user lines. Packet Tracer supports these filters only partly; if a filter returns nothing, read the full output before you conclude that a setting is missing.

Start this chapter's lab on a new device instead of erasing an old one. `erase startup-config` is not a full factory reset: a switch's VLAN database, for example, is stored in a separate file.

## Local accounts and privileged access

A shared password tells you that someone knew the password; a named account tells you who logged in, and lets you remove one person without changing everyone's password. **Authentication** verifies an identity. **Privilege** determines the commands available to the resulting session. In this chapter, usernames stored on the device provide authentication, and each user's configured privilege sets the level the session starts at.

```ios R1
R1(config)# enable secret EnableLabSecret8
R1(config)# username admin privilege 15 secret AdminLabSecret8
R1(config)# username trainee secret TraineeLabSecret8
```

These are example lab credentials. `admin` starts at privilege 15 when the line uses the local database. `trainee` defaults to privilege 1 and enters privileged EXEC with `enable` and the enable secret. `show privilege` confirms the current level; the prompt alone is a useful clue, but the command is a direct check.

The `secret` keyword stores a password verifier rather than a cleartext password. A **hash** is a computed value used to check a password without storing the original text; it is not encryption that can be reversed with a decryption key. Always use `secret`, not `password`, for enable and user credentials. Packet Tracer and older IOS store secrets as type 5 (MD5); current IOS supports the stronger types 8 and 9. A hash still falls to guessing if the password is weak.

| Stored form | What to recognize | Practical implication |
|---|---|---|
| Type `0` | Cleartext password | Reading the configuration reveals the password |
| Type `7` | Reversible obfuscation | Does not provide strong protection for a stored credential |
| Type `5` | MD5-based password hash | Legacy verifier; prefer stronger supported types |
| Type `8` | PBKDF2-SHA-256 verifier | Availability and syntax depend on the image |
| Type `9` | scrypt verifier | Availability and syntax depend on the image |

`service password-encryption` converts the cleartext (type 0) passwords in the configuration to type 7. Type 7 is easily reversed, so it only stops someone reading a password over your shoulder. It does not change an enable secret, and it does nothing for a password crossing the network: a Telnet session still carries it in cleartext. Turning the command off again does not convert existing type 7 passwords back.

:::trap Privileged access and login are separate
Setting `enable secret` does not create a local username or configure line authentication. Creating a local username does not make a line use it. Read the user, privilege and line settings together before deciding how a login will behave.
:::

## Console and VTY line settings

IOS calls each way into the CLI a **line**, and each line carries its own login settings. The **console line** (`line console 0`) is the physical console port. The **VTY** lines, or virtual terminal lines, are the remote sessions that arrive over IP by Telnet or SSH; each concurrent remote session occupies one VTY. Some routers also have an auxiliary port. The default console settings are 9600 baud, 8 data bits, no parity and 1 stop bit.

The console does not need a working IP interface, which makes it the recovery path when remote access breaks. By default it asks for no password, so protect it as well.

| Line setting | Effect in the basic local configuration |
|---|---|
| `password` followed by `login` | Uses a shared line password |
| `login local` | Checks a named user in the local database |
| `exec-timeout 5 0` | Ends an idle EXEC session after five minutes |
| `logging synchronous` | Redisplays the prompt/input around unsolicited messages |
| `transport input ssh` | Accepts SSH as the incoming VTY transport |

The simplest protection is a shared line password, which needs two commands: `password` sets it and `login` tells the line to ask for it.

```ios R1
R1(config)# line console 0
R1(config-line)# password ConsoleLabPass8
R1(config-line)# login
```

On a VTY line, `login` with no `password` configured refuses every connection with "Password required, but none set". `login local` replaces the shared password with the username database, and it is what the rest of this chapter uses.

The two `exec-timeout` arguments are minutes and seconds. The default is 10 minutes. Setting both to zero disables the idle timeout; it does not disconnect a session immediately.

Create the account before you apply `login local`, or the line will have nothing to check a login against. Then keep your current session open and test a new login from a second session: the session you are already in proves nothing about the next one.

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

The example covers VTY 0–4. Inspect `show line`, the VTY sections in `show running-config`, and `line vty ?` on your device. If it also has VTY 5–15, apply the same policy there. IOS keeps separate settings for each range, so a device that is SSH-only on lines 0–4 can still accept Telnet on lines 5–15.

A banner displays a notice to anyone who connects; it does not authenticate anyone. `banner motd #Authorized lab users only#` sets one, where `#` is a delimiter you choose to mark the start and end of the text. On the console and Telnet it appears before the login prompt.

## Choose a management method

The exam expects you to recognize each way of managing a device and what it depends on. **In-band management** travels over the same network that carries user traffic, so it fails when that network fails. **Out-of-band management** uses a separate path, such as the console port or a dedicated management network. SSH can run over either. The console is the out-of-band path in this chapter's lab.

| Method | Role | What must be considered |
|---|---|---|
| Console | Local CLI access | Physical access, console settings and authentication |
| Telnet | Remote CLI over TCP 23 | Carries session data without SSH-style protection |
| SSH | Protected remote CLI over TCP 22 | IP reachability, server keys, compatible algorithms, line policy and credentials |
| HTTP / HTTPS | Web management, commonly TCP 80 / 443 | HTTPS uses TLS; enable only the required web service and validate its identity |
| TACACS+ / RADIUS | Central AAA services consulted by the device | These support access decisions; they do not replace the administrator's SSH session |
| Cloud management | Administration through a vendor service | Connectivity, identity, supported functions and fallback access vary by product |

SSH protects the authenticated session, but encryption alone does not prove that you reached the intended server. A **host key** supplies the server's cryptographic identity: the server keeps the private part of the key pair, while the client can check the public part. This is separate from the user's login password. A client asks you to accept the host key the first time it connects and remembers it afterwards. If a known device later presents a different key, find out why before you accept it.

A cloud-managed device, such as a Cisco Meraki switch or access point, is configured from the vendor's web dashboard instead of its own CLI. The device connects out to the cloud service over the Internet and fetches its configuration. For the CCNA, recognize this model and its dependency: the device must reach the Internet to be managed.

## Configure SSH step by step

SSH on IOS needs five things: an IP path, a hostname other than the default `Router`, a domain name, an RSA key pair, and VTY lines that accept SSH and know how to authenticate. IOS names the key pair from the hostname and the domain name, which is why both must exist before you generate it. No DNS server is involved.

```diagram
{"type":"topology","title":"Local and remote access to R1","caption":"The console remains available while the PC tests SSH over the directly connected subnet.","nodes":[{"id":"CON","kind":"laptop","label":"Console laptop","sub":"Serial console","x":2,"y":1},{"id":"PC","kind":"pc","label":"Admin PC","sub":"10.8.0.10/24","x":2,"y":5},{"id":"SW","kind":"switch","label":"SW1","sub":"Same LAN","x":6,"y":5},{"id":"R","kind":"router","label":"R1","sub":"Gi0/0 10.8.0.1/24","x":10,"y":3}],"links":[{"from":"CON","to":"R","label":"Console","style":"dashed"},{"from":"PC","to":"SW","label":"Ethernet"},{"from":"SW","to":"R","label":"SSH over IP","accent":true}],"trace":{"flows":[{"path":["PC","SW","R"],"back":true,"label":"ssh -l admin 10.8.0.1","tags":{"SW":"Same subnet · no routed hop","R":"SSHv2 · VTY login local · admin"}}],"chips":[{"node":"CON","text":"Console stays available"}]}}
```

First establish the IP path. R1's address is `10.8.0.1/24`; the PC is `10.8.0.10/24`. They share a subnet, so no routing is needed. A PC on another subnet would also need a routed path to R1 and back.

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

The local accounts and VTY settings from the previous sections complete this configuration. If your image rejects the full key command, enter `crypto key generate rsa` and type the modulus when it asks. SSHv2 needs a key of at least 768 bits; use 2048.

From a Packet Tracer PC, use the following command and enter the configured password when asked. A desktop SSH client may instead use `ssh admin@10.8.0.1`.

```text
ssh -l admin 10.8.0.1
```

## Verify and troubleshoot

Check the four gates from the start of the chapter one at a time, beginning with the SSH server itself. Abbreviated, representative output:

```output R1# show ip ssh
SSH Enabled - version 2.0  ← server is enabled for SSHv2
Authentication timeout: 120 secs; Authentication retries: 3
```

This proves the reported server state. It does not prove that the PC can reach R1, that all VTY lines accept SSH, or that the account is valid. Verify those conditions, then open a new session and run `show privilege` as each test user. `show users` identifies sessions and may show the client's address in its Location column; `show ssh` supplies SSH-session details.

On some older images, `SSH Enabled - version 1.99` denotes compatibility with both SSHv1 and SSHv2. It is not a third protocol version. `ip ssh version 2` restricts the server to SSHv2, and the output then reads 2.0.

| Observation | Next check | Why |
|---|---|---|
| Interface is administratively down | Interface configuration and `no shutdown` | Remote access needs a usable IP path |
| SSH server reports disabled | Image support, key configuration and SSH settings | A local account alone does not start the SSH service |
| SSH is enabled, but connection is refused | All VTY transport settings and access policy | Server state and accepted line transports are separate |
| Credentials are rejected | Exact username, secret and authentication method | `login local` needs a matching local account |
| Login succeeds at `>` instead of `#` | `show privilege` and user privilege | Authentication succeeded; authorization level is the separate issue |
| Access breaks after reload | Saved configuration and actual boot state | The verified running configuration may not have been saved |

As Chapter 06 showed, a successful ping proves the IP path and nothing about TCP port 22, and a failed ping does not prove that SSH is unreachable. Test the service you intend to use, and change one thing at a time so you know which change had the effect.

## Exam focus

- Distinguish console access, remote-session transport, authentication and privilege.
- Configure a local username and enable secret, then explain `login` versus `login local`.
- Configure the hostname/domain/key/SSHv2 workflow and restrict every intended VTY line to SSH.
- Verify the actual line range instead of assuming a fixed count by device family.
- Recognize the difference between a stored secret, type 7 obfuscation and session encryption.
- Use `show ip ssh`, `show ssh`, `show users` and `show privilege` for their different purposes.
- Test a new login before closing the working session; save the verified configuration.
- Recall the defaults: console 9600 baud 8-N-1, `exec-timeout` 10 minutes, local-user privilege 1, and no console password.

You should now be able to separate forwarding, session transport, login identity, privilege and persistence when a management test fails. The next chapter returns to the LAN itself: you will put access ports into distinct VLANs and prove their separation before adding trunks or routing.
