---
id: security-concepts
number: 32
title: Security concepts
subtitle: Connect threats and weaknesses to practical controls, policy, and authentication choices.
part: security
domain: none
minutes: { lesson: 65, lab: 35 }
summary: Distinguish security risks and attack mechanisms, explain security-program and password-policy elements, and evaluate local management controls without mistaking a lab feature for a complete security policy.
objectives:
  v1: ["5.1", "5.2", "5.4"]
  v2: []
prereqs: [network-models, ios-essentials, layer2-security, file-management]
sectionIds:
  "Protect confidentiality, integrity, and availability": why-a-network-engineer-owns-security
  "Threats, weaknesses, and risk": threat-vulnerability-exploit-mitigation
  "Interception, malware, and social engineering": man-in-the-middle-malware-and-the-human-layer
  "Apply and verify device controls": hardening-the-device-verify-and-troubleshoot
sources:
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "NIST: Security terminology", url: "https://csrc.nist.gov/glossary/term/security" }
  - { title: "NIST: Risk", url: "https://csrc.nist.gov/glossary/term/risk" }
  - { title: "NIST SP 800-63B-4: Digital authentication", url: "https://pages.nist.gov/800-63-4/sp800-63b.html" }
  - { title: "NIST SP 800-50 Rev. 1: Cybersecurity and privacy learning program", url: "https://csrc.nist.gov/pubs/sp/800/50/r1/final" }
  - { title: "Cisco: Protecting secrets on network devices", url: "https://www.cisco.com/c/en/us/about/trust-center/resilient-infrastructure/protecting-secrets.html" }
  - { title: "Cisco: IOS XE hardening guide", url: "https://sec.cloudapps.cisco.com/security/center/resources/IOS_XE_hardening" }
  - { title: "Cisco: IOS login enhancements", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_usr_cfg/configuration/15-mt/sec-usr-cfg-15-mt-book/sec-login-enhance.html" }
  - { title: "Cisco: Login enhancement command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/d1/sec-d1-cr-book/sec-cr-k1.html" }
  - { title: "CISA: UDP-based amplification attacks", url: "https://www.cisa.gov/ncas/alerts/ta14-017a" }
  - { title: "RFC 4987: TCP SYN flooding and mitigations", url: "https://www.rfc-editor.org/rfc/rfc4987.html" }
  - { title: "RFC 5280: Certificates and certificate revocation", url: "https://www.rfc-editor.org/rfc/rfc5280.html" }
---

So far you have built networks that work. This chapter is about people who want to read what crosses them, change it, or stop them working. An attacker who learns the enable password of one router can read its configuration, redirect traffic and lock you out, and the way in is as often a reused password or a convincing phone call as a software flaw. To defend a network you first need precise words for what can go wrong.

Earlier chapters gave you individual defences: SSH for management, and port security, DHCP snooping and DAI at the access layer. Here you learn the vocabulary that ties them together and that the exam tests directly: threat, vulnerability, exploit and mitigation; the common attack types; what a security program asks of people; and what goes into a password policy, including the alternatives to passwords. By the end you will be able to name the attack in a scenario, say which weakness it uses, and choose the control that answers it.

## Protect confidentiality, integrity, and availability

:::facts
- **Confidentiality** protects information from unauthorized disclosure; **integrity** protects against improper modification; **availability** supports timely, reliable access.
- A vulnerability is a weakness; a threat is a potential adverse event or circumstance; an exploit uses a weakness; a mitigation reduces risk.
- Authentication factors are knowledge, possession, and inherence. Two knowledge secrets do not make multifactor authentication.
- Cisco type 7 password storage is reversible obfuscation, not a strong password hash. Protect configuration backups even when they contain hashes.
- A password policy includes how credentials are chosen, used, stored, recovered, replaced, and removed, not just a character count.
:::

Every security measure protects at least one of three properties, known together as the **CIA triad**. A branch router connects staff to an accounting application. If someone reads salary records without permission, confidentiality is affected. If a payment destination is changed, integrity is affected. If staff cannot reach the application during business hours, availability is affected. One incident can affect all three; in an exam scenario, pick the property the described harm touches.

| Objective | Example control | Limitation to remember |
|---|---|---|
| Confidentiality | Authenticated encryption and restricted access | Encryption does not fix excessive permissions at an endpoint |
| Integrity | Authenticated messages, signatures, controlled changes | An untrusted replacement checksum does not prove authenticity |
| Availability | Redundant paths, capacity planning, recovery procedures | Redundancy does not prevent every shared failure |

A **control** is a measure intended to manage risk. Preventive controls try to stop an event; detective controls help identify it; corrective and recovery controls limit harm afterward. A door lock, an access log and a tested restoration procedure do those three different jobs.

This chapter covers v1.1 objectives 5.1, 5.2 and 5.4. You configured local SSH in chapter 8 and the Layer 2 defences in chapter 16; AAA follows in chapter 33.

## Threats, weaknesses, and risk

Four terms describe how harm happens, and the exam expects you to tell them apart. Consider an administrator account left active after its owner leaves. The account and unnecessary permissions are a **vulnerability**. Unauthorized use is a **threat**. Using a retained credential to log in is one way to **exploit** the weakness. Disabling the account, reviewing active sessions, and correcting account-removal procedures are **mitigations**.

A threat need not be a malicious person: fire, power loss, accidental deletion, or equipment failure can also harm a service. A **threat actor** is the person or organization behind an intentional threat. An open service port is a vulnerability only if the service is unnecessary, unpatched or poorly protected.

**Risk** combines the likelihood of an adverse event with its impact. Prioritize by the asset's importance, its exposure, the controls already in place and the consequences. A small probability of losing a critical service may justify more effort than frequent failures of an unused test device.

| Situation | Weakness or exposure | Appropriate first action |
|---|---|---|
| Default management credential is still accepted | Predictable authentication secret | Replace it and test legitimate access |
| Configuration backups are broadly readable | Unauthorized disclosure of secrets and network details | Restrict access, assess exposure, rotate affected credentials |
| Unnecessary remote service is reachable | Extra attack surface | Disable or restrict it after confirming dependencies |
| A vendor fixes an exploitable defect | Vulnerable installed software | Assess the advisory and plan a supported update |

:::trap A log is evidence, not the attacker's biography
A successful login from an unexpected address deserves investigation. It does not prove who used the account or how the credential was obtained. A weak leaked backup demonstrates exposure even before you can attribute the login. State those two findings separately.
:::

## Reconnaissance, spoofing and denial of service

Most attacks begin with **reconnaissance**: gathering information about the target, such as its address ranges, reachable services and software versions. Ping sweeps and port scans are the usual tools. Reconnaissance does no damage by itself, but it tells the attacker where the weaknesses are.

**Spoofing** means presenting a false identity: a forged source IP address, a forged source MAC address, or a false ARP reply. It works wherever a device trusts an address as proof of who is sending. An IP address only says where replies should go, so anything that needs to know who is talking must use an authenticated protocol.

A **denial-of-service (DoS)** attack makes a service unavailable to its legitimate users. A **distributed** DoS (DDoS) comes from many sources at once, typically a botnet of compromised machines, which makes it hard to filter. The classic example is the **SYN flood**. The attacker sends a stream of TCP SYNs and never completes the three-way handshake you learned in chapter 6. The server keeps a half-open connection for each one, and when its table of half-open connections is full it cannot accept real clients. Spoofed source addresses are common here, because the attacker does not need the replies.

Two further techniques make a flood bigger. In a **reflection** attack the attacker sends requests to third-party servers with the victim's address forged as the source, so the servers send their replies to the victim. **Amplification** means each reply is larger than the request that triggered it. DNS and NTP servers answering over UDP have often been abused for both at once.

```diagram
{"type":"sequence","title":"Reflection and amplification are different effects","caption":"The sizes are a hypothetical measured example, not a DNS default or a recommended test.","actors":["Sender forging victim source","UDP service","Victim"],"steps":[{"from":0,"to":1,"label":"Request: 80 bytes","note":"Source address claims to be the victim","accent":true},{"from":1,"to":2,"label":"Response: 800 bytes","note":"Reply follows the forged source address"},{"from":0,"to":1,"label":"Further forged requests"},{"from":1,"to":2,"label":"Further replies","note":"10× response/request byte ratio in this example"}]}
```

In the example the amplification factor is 800/80 = **10**: every byte the attacker sends costs the victim ten. Real factors vary by protocol. Source-address validation reduces spoofed traffic at its origin. Service operators restrict unnecessary open services and apply supported controls. A victim whose access link is saturated may need upstream assistance because filtering after that link does not recover its capacity.

## Interception, malware, and social engineering

In an **on-path attack**, also called man-in-the-middle, the attacker gets into the path between two parties and can read or alter what passes. On a LAN the usual method is ARP poisoning (ARP spoofing): the attacker sends ARP replies claiming that the gateway's IP address belongs to the attacker's MAC address, so hosts send their off-subnet traffic to the attacker, who forwards it on so nobody notices. A rogue DHCP server that hands out the attacker's address as the default gateway, or a fake wireless access point, achieves the same thing.

DAI and DHCP snooping stop those LAN methods. Encrypted, authenticated protocols such as SSH, TLS and IPsec protect the session even when someone is on the path, as long as the endpoints check each other's identity. Clicking through a changed SSH host key or an invalid certificate warning throws that protection away.

**Malware** is software intended to perform harmful or unauthorized actions. A virus attaches to other content and runs when that content executes; a worm can propagate without needing a user to manually copy and launch each new infection. A Trojan presents itself as useful or legitimate while performing another action. Ransomware may encrypt data, steal it for extortion, or both. These categories can overlap within one incident.

Patching, reduced privileges, endpoint defenses, segmentation, and tested backups address different parts of the problem. Backups help restoration but do not undo theft or guarantee rapid recovery. Likewise, an installed patch does not prove an already compromised system is clean.

**Social engineering** manipulates people into granting access or revealing information. Phishing can arrive through several channels; spear phishing is targeted, whaling targets senior personnel, vishing uses voice, and smishing uses text messages. Pretexting uses a fabricated situation. Tailgating follows someone into a controlled area. These labels can overlap: a targeted voice call can be both spear phishing and vishing.

A believable message can use correct names, good grammar, and current projects. Teach a trusted verification route rather than a checklist of superficial “bad email” clues. For example, verify an unexpected password-reset request through an independently known helpdesk contact, report the message, and never give a caller an authentication code merely because the caller knows your name.

## Password attacks and Layer 2 attacks

Password guessing can be online, through a login service, or offline against stolen verifier data. **Brute force** tries candidate combinations; a **dictionary attack** uses likely words or patterns. **Password spraying** tries a small set of candidates across many accounts. **Credential stuffing** reuses exposed account/password pairs from another service. Stuffed credentials can fail because they are outdated or the user did not reuse them.

The defence depends on where the guessing happens. Online guessing goes through the login prompt, so rate limits and account lockouts slow it down; spraying exists precisely to stay under a per-account lockout threshold. Offline guessing works on password hashes taken from a stolen configuration or database, where no lockout applies. There the defences are a slow, salted hash and a long password.

The Layer 2 attacks from chapter 16 fit the same vocabulary. Each abuses something a switch trusts by default, and each has a matching control:

| LAN misuse | Relevant control | Important boundary |
|---|---|---|
| Rogue DHCP server replies | DHCP snooping with deliberate trust placement | Trust the legitimate server path, not every uplink automatically |
| Forged ARP bindings | DAI with valid bindings or authorized static policy | Check both dynamic and static endpoint requirements |
| Excess source MAC identities | Port security or suitable access policy | One permitted MAC can still be spoofed; it is not user authentication |
| Unwanted trunk negotiation | Explicit access mode and negotiation policy | Match the design and protect native-VLAN use |
| Unexpected BPDUs/root claims | BPDU guard or root guard in their intended roles | These do not inspect arbitrary user traffic |

The “excess source MAC” row is the **MAC flooding** attack. The attacker sends frames from thousands of invented source addresses until the switch's MAC address table is full. The switch can no longer learn real addresses, so it floods frames for them out of every port in the VLAN, where the attacker can capture them. Port security stops it by limiting how many addresses one port may present.

## Password policy and its alternatives

A password policy is the written set of rules for how an organization's passwords are created, stored, changed and retired. The exam names three areas. **Management** covers the life of a credential: who owns each account, how passwords are stored and recovered, when they must be replaced, and how access is removed when someone leaves. **Complexity** covers what a password must look like: its minimum **length** and any required mix of character classes. The **alternatives** are the ways to add to or replace a password: multifactor authentication, certificates and biometrics.

You will also meet these traditional policy terms: **history** stops a user returning to a recent password, **expiry** (maximum age) forces a change after a set time, and **lockout** disables an account or delays logins after a number of failures.

Current NIST SP 800-63B-4, for its digital-authentication scope, requires at least **15 characters** for a single-factor password, allowing a minimum of **8** when the password is used only as part of MFA. It calls for blocklisting common/compromised choices, permits password managers, rejects mandatory character-class composition rules, and rejects routine forced changes without evidence of compromise. This is guidance for the covered authentication system, not a claim that every Cisco image implements those controls. An organization's approved policy and platform capabilities still need to be reconciled.

A **password manager** helps produce and retain distinct credentials. Do not reuse the public demonstration passwords in this course on real devices. Longer passwords do not stop keylogging or phishing; controls must also protect the endpoint, transport, and recovery process. A recovery workflow that gives an attacker a replacement credential can defeat an otherwise strong login.

**Multifactor authentication** combines distinct factor categories: something you know, such as a password; something you have, such as a cryptographic authenticator; and something you are, such as a biometric characteristic. A username is an identifier. Password plus PIN is still knowledge alone. A hardware key activated with a PIN can implement possession and knowledge within one authenticator. MFA methods also differ in phishing resistance; manually relayed one-time codes are not equivalent to origin-bound cryptographic authentication.

Chapter 29 used a trusted SSH public key to identify a server. A **certificate** adds identity information and an issuer's digital signature to a public key under a trust framework. A **certificate authority (CA)** is an issuer trusted to make that binding; its signature can be checked using the appropriate public key. Authentication requires proof of the matching private key and validation of the certificate's chain, intended identity, usage, and validity, with revocation handling as appropriate. A certificate is public, so presenting a copy of one proves nothing; only the holder of the private key can pass the check.

**Biometrics** involve measurement and comparison, so false matches and false non-matches are possible. A biometric is not a secret that can simply be replaced like a password. NIST treats it as part of MFA with a physical authenticator, with an alternative available. In a device-unlock design, a fingerprint can activate a locally protected key rather than be sent to every remote service.

## The security program: awareness, training, physical access

Technical controls fail if people hand over the keys, so a security program has three elements aimed at people and places: user awareness, user training and physical access control.

**User awareness** makes every user conscious of the threats and of their part in the defence: what a suspicious request looks like and where to report it. It is continuous and light, delivered through reminders, posters and simulated phishing emails. **User training** is formal instruction, usually required of everyone at intervals and tailored to the role, in which people learn and practise the organization's procedures. A monthly reminder about suspicious calls is awareness; a workshop where help-desk staff practise verifying a caller before a password reset is training.

**Physical access control** keeps unauthorized people away from rooms, racks, cabling and console ports. Locks and badge readers prevent entry, and a badge system also records who entered and lets access be withdrawn the day someone leaves. Cameras and entry logs detect and investigate. Visitor procedures and escorts address tailgating. It matters because anyone who can reach a router's console port can run password recovery and take the device over, whatever its remote-access controls.

Programs need owners and follow-through. Record who approves access, how leavers are removed, who reviews alerts, how incidents are reported, and whether restoration is tested. Measure useful outcomes such as reporting speed and correct procedure execution, not only attendance. A banner explains acceptable use; it does not authenticate users, filter packets, or replace consent and policy requirements.

## Apply and verify device controls

On an IOS device these ideas come down to two separate questions: how is the password stored in the configuration, and how is the login session protected? SSH protects the session from eavesdropping. A strong hash protects the stored password if someone gets hold of the configuration file. You need both.

The number IOS prints before a stored password tells you how it is stored:

| Cisco storage type | Meaning | Treatment |
|---|---|---|
| 0 | Cleartext | Protect and replace exposed credentials |
| 7 | Reversible obfuscation | Treat the configuration as revealing the secret |
| 5 | Salted MD5-based hash | Legacy; prefer supported stronger options |
| 8 | PBKDF2-SHA256 | Supported stronger password-verifier format |
| 9 | scrypt | Supported stronger password-verifier format |

A **salt** is a value included with a password when its verifier is derived. Different salts keep identical passwords from producing the same stored verifier under the same method and reduce reuse of precomputed guesses. The salt is stored with the verifier; it is not another secret password.

The `password` keyword stores cleartext (type 0), or type 7 once `service password-encryption` is enabled. The `secret` keyword stores a hash; which hash depends on the software. Current IOS XE lets you choose, as in `username admin algorithm-type scrypt secret ...`, while older images and Packet Tracer produce type 5. Read the number in the running configuration to see what you actually have.

```ios
R1# configure terminal
R1(config)# username admin privilege 15 secret Lab-Admin-Only-2026!
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# exec-timeout 5 0
R1(config-line)# end
```

This excerpt assumes SSH keys already exist and covers the shown VTY range. Inspect all ranges on the actual device. Privilege 15 is broad administrative access, not least privilege for every user. A production design should grant only the required role.

The following representative state describes a configured remote-login block:

```output Representative show login excerpt
Router presently in Quiet-Mode.
Will remain in Quiet-Mode for 87 seconds.  ← remaining block interval
No Quiet-Mode access list has been configured.  ← no configured source exception
```

This is IOS's defence against online password guessing. `login block-for 120 attempts 3 within 60` means: if three logins fail within 60 seconds, refuse all new Telnet and SSH logins for 120 seconds. That refusal period is **quiet mode**, and it applies to everyone, including an administrator with the right password. The console is not affected, so keep a console session available when you test it. An ACL named with `login quiet-mode access-class` lets chosen source addresses keep logging in during quiet mode; they still need valid credentials.

## Exam focus

- Vulnerability is the weakness, threat is what could go wrong, exploit is the method that uses the weakness, mitigation is what reduces the risk.
- CIA: disclosure harms confidentiality, modification harms integrity, an outage harms availability.
- Recognize each attack from a description: reconnaissance, spoofing, DoS and DDoS, SYN flood, reflection and amplification, on-path, the malware types, and the social-engineering types.
- Password attacks: brute force, dictionary, spraying (few passwords, many accounts), credential stuffing (stolen pairs reused).
- Security program elements: user awareness, user training, physical access control.
- Password policy elements: management, complexity, and the alternatives. MFA needs two different factor categories (know, have, are); a certificate login proves possession of a private key; a biometric is something you are.
- Type 7 passwords are reversible; `secret` stores a hash (types 5, 8, 9).
