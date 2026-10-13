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

## Protect confidentiality, integrity, and availability

:::facts
- **Confidentiality** protects information from unauthorized disclosure; **integrity** protects against improper modification; **availability** supports timely, reliable access.
- A vulnerability is a weakness; a threat is a potential adverse event or circumstance; an exploit uses a weakness; a mitigation reduces risk.
- Authentication factors are knowledge, possession, and inherence. Two knowledge secrets do not make multifactor authentication.
- Cisco type 7 password storage is reversible obfuscation, not a strong password hash. Protect configuration backups even when they contain hashes.
- A password policy includes how credentials are chosen, used, stored, recovered, replaced, and removed, not just a character count.
:::

Security decisions begin with what a service must protect. A branch router connects staff to an accounting application. If someone reads salary records without permission, confidentiality is affected. If a payment destination is changed, integrity is affected. If staff cannot reach the application during business hours, availability is affected. One incident can affect all three; choose the property described by the specific evidence.

| Objective | Example control | Limitation to remember |
|---|---|---|
| Confidentiality | Authenticated encryption and restricted access | Encryption does not fix excessive permissions at an endpoint |
| Integrity | Authenticated messages, signatures, controlled changes | An untrusted replacement checksum does not prove authenticity |
| Availability | Redundant paths, capacity planning, recovery procedures | Redundancy does not prevent every shared failure |

A **control** is a measure intended to manage risk. Preventive controls try to stop an event; detective controls help identify it; corrective and recovery controls limit harm afterward. A door lock, access log, and tested restoration procedure do different jobs. Their effectiveness depends on operation and maintenance, not merely their presence on a checklist.

These foundations directly support v1.1 objectives 5.1, 5.2, and 5.4. They remain useful background for v2.0 security configuration, but this conceptual chapter does not claim to complete those configuration objectives. Local SSH is taught in Chapter 8, Layer 2 enforcement in Chapter 16, and AAA follows in Chapter 33.

## Threats, weaknesses, and risk

Consider an administrator account left active after its owner leaves. The account and unnecessary permissions are a **vulnerability**. Unauthorized use is a **threat**. Using a retained credential to log in is one way to **exploit** the weakness. Disabling the account, reviewing active sessions, and correcting account-removal procedures are **mitigations**.

A threat need not be a malicious person: fire, power loss, accidental deletion, or equipment failure can also harm a service. A **threat actor** is a person or organization associated with an intentional threat; do not call the attacker a software vulnerability. An open service port is not automatically a vulnerability either. Ask whether it is required, appropriately protected, correctly configured, and maintained.

**Risk** combines the likelihood of an adverse event with its impact. Multiplying two scores can be one organization's assessment method, but it is not a universal scientific formula for all risks. Prioritize with the asset's importance, exposure, existing controls, and plausible consequences. A small probability of losing a critical service may justify more effort than frequent failures of an unused test device.

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

**Reconnaissance** gathers information about a target: public documentation, address ranges, reachable services, or software versions. Authorized inventory and troubleshooting can use similar observations, so a scan alone does not establish intent. Some active probes can affect fragile services. Limit tests to the scope of the lab or the approved operational task.

**Spoofing** presents a false identity, such as a forged source IP or a false ARP mapping. An IP address is routing information, not strong proof of a user's identity. A source filter helps enforce an address plan, while authenticated protocols establish stronger identity claims. The correct control depends on which trust decision is being abused.

A **denial-of-service** attack impairs legitimate service. A distributed attack uses multiple sources; it need not consist of compromised endpoints in every case. A **SYN flood** targets the resources used while a TCP server awaits completion of handshakes. Spoofed source addresses are common but not required. Backlog management, SYN cookies, rate controls, and upstream defenses can reduce impact; implementation and load determine which resource becomes limiting.

**Reflection** makes third-party services reply to a forged victim address. **Amplification** means responses are larger than the triggering requests. These are separate properties: reflection need not produce a large size increase. DNS and other UDP services have been abused this way, but no particular query type guarantees one fixed response size or multiplier.

```diagram
{"type":"sequence","title":"Reflection and amplification are different effects","caption":"The sizes are a hypothetical measured example, not a DNS default or a recommended test.","actors":["Sender forging victim source","UDP service","Victim"],"steps":[{"from":0,"to":1,"label":"Request: 80 bytes","note":"Source address claims to be the victim","accent":true},{"from":1,"to":2,"label":"Response: 800 bytes","note":"Reply follows the forged source address"},{"from":0,"to":1,"label":"Further forged requests"},{"from":1,"to":2,"label":"Further replies","note":"10× response/request byte ratio in this example"}]}
```

The example's ratio is 800/80 = **10**, assuming both measurements count the same protocol layers. It illustrates arithmetic, not a universal amplification factor. Source-address validation reduces spoofed traffic at its origin. Service operators restrict unnecessary open services and apply supported controls. A victim whose access link is saturated may need upstream assistance because filtering after that link does not recover its capacity.

## Interception, malware, and social engineering

An **on-path attack**, also called man-in-the-middle, allows an intermediary to observe or alter a communication. ARP poisoning can redirect LAN traffic by associating a gateway IP with an attacker's MAC. Rogue DHCP information or a deceptive wireless access point can create other interception opportunities. The exact behavior depends on endpoints, filters, and existing neighbor state; not every unsolicited ARP is malicious.

Authenticated SSH, TLS, or IPsec can protect a session even over an untrusted path, provided the endpoints validate the expected identity and the implementation is secure. Blindly accepting a changed host key or invalid certificate weakens that protection. Encryption alone does not guarantee availability: an intermediary can still discard traffic.

**Malware** is software intended to perform harmful or unauthorized actions. A virus attaches to other content and runs when that content executes; a worm can propagate without needing a user to manually copy and launch each new infection. A Trojan presents itself as useful or legitimate while performing another action. Ransomware may encrypt data, steal it for extortion, or both. These categories can overlap within one incident.

Patching, reduced privileges, endpoint defenses, segmentation, and tested backups address different parts of the problem. Backups help restoration but do not undo theft or guarantee rapid recovery. Likewise, an installed patch does not prove an already compromised system is clean.

**Social engineering** manipulates people into granting access or revealing information. Phishing can arrive through several channels; spear phishing is targeted, whaling targets senior personnel, vishing uses voice, and smishing uses text messages. Pretexting uses a fabricated situation. Tailgating follows someone into a controlled area. These labels can overlap: a targeted voice call can be both spear phishing and vishing.

A believable message can use correct names, good grammar, and current projects. Teach a trusted verification route rather than a checklist of superficial “bad email” clues. For example, verify an unexpected password-reset request through an independently known helpdesk contact, report the message, and never give a caller an authentication code merely because the caller knows your name.

## Password attacks and Layer 2 attacks

Password guessing can be online, through a login service, or offline against stolen verifier data. **Brute force** tries candidate combinations; a **dictionary attack** uses likely words or patterns. **Password spraying** tries a small set of candidates across many accounts. **Credential stuffing** reuses exposed account/password pairs from another service. Stuffed credentials can fail because they are outdated or the user did not reuse them.

A log with many usernames does not reveal the attempted passwords. It can be consistent with spraying, but account enumeration or other guessing could produce similar records. Rate limits and lockouts address online attempts, while a slow salted password hash raises the cost of offline guessing. Salt defeats efficient reuse of one precomputed table across many accounts; it does not make weak passwords unguessable.

| LAN misuse | Relevant control | Important boundary |
|---|---|---|
| Rogue DHCP server replies | DHCP snooping with deliberate trust placement | Trust the legitimate server path, not every uplink automatically |
| Forged ARP bindings | DAI with valid bindings or authorized static policy | Check both dynamic and static endpoint requirements |
| Excess source MAC identities | Port security or suitable access policy | One permitted MAC can still be spoofed; it is not user authentication |
| Unwanted trunk negotiation | Explicit access mode and negotiation policy | Match the design and protect native-VLAN use |
| Unexpected BPDUs/root claims | BPDU guard or root guard in their intended roles | These do not inspect arbitrary user traffic |

A full MAC table does not turn every switch into an unrestricted hub; unknown-unicast behavior remains VLAN- and platform-dependent. Becoming a spanning-tree root does not automatically place every traffic flow through that switch. Use the earlier switching chapters' mechanisms to assess what an attack could actually change.

## Password policy and its alternatives

A password policy covers account ownership, credential selection, storage, sharing, recovery, replacement after exposure, and removal when access is no longer needed. **Complexity** describes composition requirements such as character classes; **history** prevents configured reuse; **expiry** is a maximum age; **lockout** or throttling limits failed attempts. Know these terms without treating every traditional value as a current recommendation.

Current NIST SP 800-63B-4, for its digital-authentication scope, requires at least **15 characters** for a single-factor password, allowing a minimum of **8** when the password is used only as part of MFA. It calls for blocklisting common/compromised choices, permits password managers, rejects mandatory character-class composition rules, and rejects routine forced changes without evidence of compromise. This is guidance for the covered authentication system, not a claim that every Cisco image implements those controls. An organization's approved policy and platform capabilities still need to be reconciled.

A **password manager** helps produce and retain distinct credentials. Do not reuse the public demonstration passwords in this course on real devices. Longer passwords do not stop keylogging or phishing; controls must also protect the endpoint, transport, and recovery process. A recovery workflow that gives an attacker a replacement credential can defeat an otherwise strong login.

**Multifactor authentication** combines distinct factor categories: something you know, such as a password; something you have, such as a cryptographic authenticator; and something you are, such as a biometric characteristic. A username is an identifier. Password plus PIN is still knowledge alone. A hardware key activated with a PIN can implement possession and knowledge within one authenticator. MFA methods also differ in phishing resistance; manually relayed one-time codes are not equivalent to origin-bound cryptographic authentication.

Chapter 29 used a trusted SSH public key to identify a server. A **certificate** adds identity information and an issuer's digital signature to a public key under a trust framework. A **certificate authority (CA)** is an issuer trusted to make that binding; its signature can be checked using the appropriate public key. Authentication requires proof of the matching private key and validation of the certificate's chain, intended identity, usage, and validity, with revocation handling as appropriate. Copying the public certificate is not proof of private-key possession. Private keys must be protected; do not promise that every product makes them non-exportable.

**Biometrics** involve measurement and comparison, so false matches and false non-matches are possible. A biometric is not a secret that can simply be replaced like a password. NIST treats it as part of MFA with a physical authenticator, with an alternative available. In a device-unlock design, a fingerprint can activate a locally protected key rather than be sent to every remote service.

## The security program: awareness, training, physical access

**Awareness** helps people recognize situations and know where to report them. **Training** develops role-specific skills through instruction and practice. A reminder about suspicious requests emphasizes awareness; a workshop in which staff verify a caller and follow a recovery procedure emphasizes training. A phishing simulation with feedback can contribute to both, depending on its purpose and design. Avoid making the delivery format alone a rigid classification rule.

Physical controls restrict access to rooms, racks, cabling, consoles, and storage. Locks and badge-controlled entrances help prevent entry; cameras and access records help detect and investigate it. Visitor procedures, escorts, and staff practice address tailgating. An unlocked rack or unattended console can undermine remote access controls, but physical access does not guarantee instant privilege on every protected platform.

Programs need owners and follow-through. Record who approves access, how leavers are removed, who reviews alerts, how incidents are reported, and whether restoration is tested. Measure useful outcomes such as reporting speed and correct procedure execution, not only attendance. A banner explains acceptable use; it does not authenticate users, filter packets, or replace consent and policy requirements.

## Apply and verify device controls

The lab begins with a required policy and evidence worksheet. Its complete SSH setup and bounded quiet-mode test are an optional device extension; learning the security concepts does not require repeating every management configuration drill.

The practical exercise reviews local IOS controls introduced earlier. It separates protection of a stored credential from protection of a management session. SSH protects the session; a supported slow password hash protects a verifier in a stolen configuration; neither replaces access restrictions or account lifecycle management.

| Cisco storage type | Meaning | Treatment |
|---|---|---|
| 0 | Cleartext | Protect and replace exposed credentials |
| 7 | Reversible obfuscation | Treat the configuration as revealing the secret |
| 5 | Salted MD5-based hash | Legacy; prefer supported stronger options |
| 8 | PBKDF2-SHA256 | Supported stronger password-verifier format |
| 9 | scrypt | Supported stronger password-verifier format |

A **salt** is a value included with a password when its verifier is derived. Different salts keep identical passwords from producing the same stored verifier under the same method and reduce reuse of precomputed guesses. The salt is stored with the verifier; it is not another secret password.

Do not infer the type solely from the word `secret`; inspect the result and the software's supported syntax. Modern IOS XE may support `username admin algorithm-type scrypt secret ...`; older simulator images may support only basic secret syntax. Such a fallback teaches the command relationship, not a recommendation to deploy obsolete storage. Some protocol shared keys must be recoverable by the device; their storage requirements differ from a login password verifier.

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

`login block-for 120 attempts 3 within 60` defines a remote login failure threshold and a 120-second quiet period. On the documented IOS feature, quiet mode restricts new Telnet/SSH logins; console access remains available. A quiet-mode ACL is a source exception, not a grant of password-free access and not an override of other access controls. It is separate from per-account AAA lockout. Validate behavior on the image and retain a working console before testing. A login delay alone does not identify the control involved.

## Exam focus

- Distinguish threat, vulnerability, exploit, mitigation, and the impact on CIA.
- Explain attack mechanisms and select controls according to the trust or resource affected.
- Know password-policy terminology, authentication factors, certificate/private-key proof, and biometric limitations.
- Distinguish awareness, training, and physical access control without artificial boundaries.
- Recognize reversible storage, protect backups, and separate legacy lab capability from current security guidance.
