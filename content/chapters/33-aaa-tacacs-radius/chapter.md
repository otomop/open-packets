---
id: aaa-tacacs-radius
number: 33
title: AAA with TACACS+ and RADIUS
subtitle: Configure management authentication, interpret policy decisions, and retain a tested recovery path.
part: security
domain: services
minutes: { lesson: 70, lab: 85 }
summary: Compare authentication, authorization, and accounting; configure IOS TACACS+ and RADIUS management clients; and distinguish a rejected login from an unavailable authentication method.
objectives:
  v1: ["5.8"]
  v2: ["4.1"]
prereqs: [ios-essentials, security-concepts, troubleshooting-toolkit]
sectionIds:
  "Separate identity, permission, and records": three-questions-three-answers
  "Enable AAA with a tested recovery path": aaa-new-model-and-staying-out-of-the-lock-out
  "Build and apply method lists": method-lists-authentication-authorization-accounting
sources:
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: Configuring authentication", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_usr_aaa/configuration/15-mt/sec-usr-aaa-15-mt-book/configuring_authentication.html" }
  - { title: "Cisco: Configure basic AAA", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/terminal-access-controller-access-control-system-tacacs-/10384-security.html" }
  - { title: "Cisco: AAA local and TACACS+ method order", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/terminal-access-controller-access-control-system-tacacs-/200606-aaa-authentication-login-default-local.html" }
  - { title: "Cisco IOS XE 17.18: Configuring TACACS+", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-18/configuration_guide/sec/b_1718_sec_9600_cg/configuring_tacacs_.html" }
  - { title: "Cisco IOS XE 17.18: Configuring RADIUS", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/configuring_radius.html" }
  - { title: "Cisco: Configuring authorization", url: "https://www.cisco.com/en/US/docs/ios-xml/ios/sec_usr_aaa/configuration/15-0sy/sec-config-auth.html" }
  - { title: "Cisco: AAA and TACACS+ exploration on CML IOL", url: "https://blogs.cisco.com/learning/exploring-aaa-tacacs-configuration-with-cml" }
  - { title: "Cisco: Test AAA command platform restrictions", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/s1/sec-s1-cr-book/sec-cr-t1.html" }
  - { title: "RFC 8907: TACACS+", url: "https://www.rfc-editor.org/rfc/rfc8907.html" }
  - { title: "RFC 2865: RADIUS authentication", url: "https://www.rfc-editor.org/rfc/rfc2865.html" }
  - { title: "RFC 2866: RADIUS accounting", url: "https://www.rfc-editor.org/rfc/rfc2866.html" }
  - { title: "Cisco: TACACS+ and RADIUS comparison", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/remote-authentication-dial-user-service-radius/13838-10.html" }
  - { title: "Cisco: Protecting device secrets", url: "https://www.cisco.com/c/en/us/about/trust-center/resilient-infrastructure/protecting-secrets.html" }
---

## Separate identity, permission, and records

Chapter 8 configured a local account and selected it on VTY lines; Chapter 32 explained why identity and least privilege matter. Chapter 29 also supplied local AAA for SCP. Here you will make those relationships explicit and add a central service, while keeping the console recovery path separate from remote administration.

:::facts
- **Authentication** verifies an identity claim; **authorization** determines allowed access or actions; **accounting** records selected activity.
- Classic **TACACS+** uses TCP **49** for separate authentication, authorization, and accounting exchanges.
- Conventional **RADIUS** uses UDP **1812** for authentication/authorization and **1813** for accounting. Legacy **1645/1646** deployments exist; configure matching ports explicitly.
- The router is an SSH server to the administrator and an AAA client to the central service.
- In a login method list, an authentication **FAIL** stops the attempt. An **ERROR**, meaning the method could not complete authentication, can advance to the next method.
- Establish local recovery, bind the intended lists, and test new sessions before saving a management-access change.
:::

Morgan's SSH credentials are accepted by a router, but `configure terminal` is denied by central policy. Authentication succeeded; authorization denied the requested action. An accounting record describing that attempt serves a third purpose. These operations are related, but they are not interchangeable. Logging an action does not authorize it, and successful authentication does not promise privilege 15.

The v1.1 objective compares these concepts. The v2.0 objective additionally requires configuring devices with local usernames and as TACACS+/RADIUS management clients. That requires understanding the complete dependency chain: management transport, server reachability, client identity and shared key, server definition/group, login list, and line binding. Detailed enterprise policy design and a full identity-server deployment are beyond this chapter's scope.

## Local accounts versus a central server

A local `username` entry can contain both a secret and a privilege level. It is therefore inaccurate to say that local accounts can express no authorization information. Local accounts are useful on a small lab and for controlled recovery. At scale, however, distributing account changes across many devices is difficult, and shared accounts reduce individual accountability.

A **central AAA server** provides a place to maintain identities and policies and receive supported records. Cisco ISE is one example with RADIUS and TACACS+ capabilities; features and licensing depend on the deployed product. The device still needs explicit configuration to request and record the intended operations. Installing a server does not automatically record every command or close every unused local account.

The network device is often called the **NAS**, network access server, in AAA terminology. The NAS sends the AAA request using its own IP source. That address can differ from the administrator's address in the SSH connection. A server's client definition must recognize the NAS source and use the matching shared key. This key protects the client/server relationship; it is different from the user's login password.

```diagram
{"type":"sequence","title":"Two client/server relationships","caption":"The administrator authenticates through R1; the AAA server recognizes R1 as its client.","actors":["Admin-PC 10.0.0.50","R1 10.0.0.1","AAA 10.0.0.100"],"steps":[{"from":0,"to":1,"label":"SSH management connection","note":"PC is SSH client; R1 is SSH server","accent":true},{"from":1,"to":2,"label":"AAA authentication request","note":"R1 is AAA client; server checks its source/key"},{"from":2,"to":1,"label":"Authentication result or challenge"},{"from":1,"to":0,"label":"Continue or reject this login"}]}
```

Plan for outages as well as normal service. A local recovery account needs a protected secret, deliberate privilege, tested console access, and an owner responsible for its lifecycle. Its existence does not mean central rejection should be bypassed. Record when recovery access is used and restore the intended management policy afterward.

## TACACS+ versus RADIUS

| Property | Classic TACACS+ | Conventional RADIUS/UDP |
|---|---|---|
| Transport | TCP 49 | UDP 1812 and 1813; legacy pairs exist |
| AAA organization | Separate exchanges | Access-Accept can carry authorization attributes; accounting is separate |
| Common role | Device administration | Network access; can also authenticate device management |
| Command control on referenced IOS | Supports per-command authorization/accounting | Does not supply TACACS+-style per-command authorization |
| Protection scope | Body obfuscation; header remains visible | User-Password hiding in the ordinary password case; much other data is visible |

**TACACS+** supports an authentication dialogue, followed by separate requests for authorization or accounting where configured. That separation permits a device to ask whether a particular administrator may issue a command. TCP provides reliable byte-stream delivery, but a working TCP connection is not proof that the shared key, account, or policy is correct.

Older comparisons call TACACS+ body protection “encryption.” RFC 8907 deliberately calls the classic MD5-based mechanism **obfuscation**, because it does not meet modern cryptographic protection expectations. The header is not hidden, and the protocol must be deployed on a protected management path. This distinction improves the familiar exam comparison without suggesting that TACACS+ is a replacement for SSH or a secure transport design. RFC 8907 is a published protocol specification on the Informational track, not a reason to label all TACACS+ protection modern encryption.

RADIUS sends **Access-Request**, followed by **Access-Accept**, **Access-Reject**, or **Access-Challenge**. An Accept can carry attributes such as session restrictions; a Challenge continues the authentication exchange. RADIUS accounting uses Accounting-Request and Accounting-Response. Network access examples include 802.1X and VPN services, but the v2.0 task here is configuring a management client.

For the classic User-Password case, RADIUS hides that attribute using the shared secret; it does not encrypt the whole packet. Avoid “every other attribute is always clear” as a universal rule: other authentication methods, protected attributes, and secure-transport extensions exist. The practical comparison concerns the conventional versions used in this lab, not every later RADIUS deployment.

Explicitly match the server's listening ports. The legacy IOS `radius-server host` form has documented historical defaults that can differ from a current service. A lab or appliance might use 1645/1646; another uses 1812/1813. Inspect and configure the values rather than using a delay as proof of a wrong port. A timeout is also compatible with routing, filtering, client-definition, or key problems.

## Enable AAA with a tested recovery path

`aaa new-model` enables the IOS AAA framework and changes the authentication behavior available to lines. Cisco documents local authentication for non-console access with just this command on the referenced IOS behavior, but relying on implicit defaults is a poor rollout plan. Define exactly what the console and VTY lines should use. Do not assume console authentication and console authorization are the same setting.

Before enabling AAA, create a local administrative recovery account and enable secret, configure and test SSH, preserve a known working configuration, and keep a privileged console session open. The complete lab supplies these steps. Once AAA is enabled, make an explicit local default and a separate console list:

```ios
R1# configure terminal
R1(config)# aaa new-model
R1(config)# aaa authentication login default local
R1(config)# aaa authentication login CONSOLE local
R1(config)# aaa authentication login VTY-AUTH local
R1(config)# line console 0
R1(config-line)# login authentication CONSOLE
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# login authentication VTY-AUTH
R1(config-line)# transport input ssh
R1(config-line)# end
```

A **named method list** applies where it is explicitly bound. `default` is used where the corresponding default applies and no overriding named list is selected. Inspect every existing VTY range; many devices show additional lines beyond 0–4. Apply the same intended binding and SSH transport to those lines too.

Test a fresh local SSH login. To verify console reauthentication, keep the tested privileged SSH session open while closing and reopening the console session. This gives you a way to correct a mistyped console credential or binding. Merely leaving a preexisting console session open does not prove the next console login will work.

Do not use a scheduled reload as a universal recovery guarantee. It can interrupt a network and restores only the actual saved state after a successful reboot. In this isolated exercise, a separately saved baseline and tested local console are the deliberate recovery mechanisms.

## Servers and server groups

A **server definition** specifies the address, shared key, and applicable protocol options. A **server group** identifies which definitions a method can use. On supporting IOS/IOS XE, the named TACACS+ form is:

```ios
R1# configure terminal
R1(config)# tacacs server TAC1
R1(config-server-tacacs)# address ipv4 10.0.0.100
R1(config-server-tacacs)# key Lab-Tacacs-Key-2026!
R1(config-server-tacacs)# exit
R1(config)# aaa group server tacacs+ MGMT-TAC
R1(config-sg-tacacs+)# server name TAC1
R1(config-sg-tacacs+)# exit
R1(config)# end
```

A RADIUS definition and group use their corresponding modes:

```ios
R1# configure terminal
R1(config)# radius server RAD1
R1(config-radius-server)# address ipv4 10.0.0.100 auth-port 1812 acct-port 1813
R1(config-radius-server)# key Lab-Radius-Key-2026!
R1(config-radius-server)# exit
R1(config)# aaa group server radius MGMT-RAD
R1(config-sg-radius)# server name RAD1
R1(config-sg-radius)# exit
R1(config)# end
```

These blocks illustrate two alternatives; they do not make a line use either server by themselves. The legacy forms include `tacacs-server host 10.0.0.100 key ...` or `radius-server host 10.0.0.100 auth-port 1812 acct-port 1813 key ...`. The built-in groups `tacacs+` and `radius` select configured servers of that protocol. The lab uses one server per protocol to avoid ambiguous membership, then provides a modern syntax translation.

With multiple interfaces, a supported `ip tacacs source-interface` or `ip radius source-interface` can make the client source predictable. That interface must exist, have the intended address, and be reachable from the service. The flat lab naturally uses R1's sole active LAN interface. In a routed deployment, explicitly check the source, routing instance, return route, firewall policy, and server client entry.

Group behavior can include server availability state, timers, retries, and selection policy. If one server cannot complete the exchange, another eligible group member may be tried. An authoritative rejection is not a request to search for a server with a more permissive policy. Do not promise a fixed five-second login delay for all configurations.

## Build and apply method lists

Change only the already-bound VTY list when the server is ready:

```ios
R1# configure terminal
R1(config)# aaa authentication login VTY-AUTH group MGMT-TAC local
R1(config)# end
```

The **method order** expresses a policy. `group MGMT-TAC local` asks the group first and allows the local method when the group returns ERROR. A bad password or disabled account that produces FAIL ends authentication. ERROR means the method could not complete the decision; unreachable servers and exhausted timeouts are common examples, but a reachable service can also report an error. Thus ERROR is not simply another word for “the server is offline.”

| Current method result | Next action in this login list |
|---|---|
| PASS | Authentication succeeds; other configured stages still apply |
| FAIL | Deny this attempt; do not try `local` |
| ERROR | Try the next method if one is configured |
| No successful method remains | Deny authentication |

:::trap The recovery account is not a rejection override
Suppose `recovery` exists only locally. A healthy central server that rejects this username prevents the VTY list from reaching local authentication. The separately bound `CONSOLE local` list can still authenticate it. That is the intended distinction, not a broken fallback.
:::

`aaa authorization exec` controls shell access and associated attributes when configured. A login may succeed yet EXEC authorization fail. If the approved outage policy permits specified local accounts and privileges, a corresponding local authorization method can be appropriate. Do not append `if-authenticated` as an interchangeable repair: it accepts an already authenticated user without the same local-user policy check and changes the access policy.

On supporting IOS, TACACS+ command authorization and command accounting can be configured for particular privilege levels and command contexts. “Commands 15” is not a promise that every possible command at every level is checked. Verify the intended policy rather than expanding this introductory management lab into an untested command-authorization rollout. Console authorization is a separate deliberate feature; it is not enabled in this lab.

**Accounting** records selected events. `aaa accounting exec default start-stop group MGMT-TAC` requests session start and stop records; `stop-only` requests a stop record. It does not configure per-command records. Delivery still depends on the server path and accounting configuration, and abrupt failures can leave incomplete records. Authentication success does not prove accounting worked.

## Verify and troubleshoot

Read the configured chain from the line backward: which login list is bound, which methods it contains, which group and server are referenced, and which source/key/port the server expects. Then correlate a fresh test with the client's and server's evidence. Historical counters or a displayed UP state are not proof that the next username will be accepted.

```output Representative authentication evidence
VTY login list: VTY-AUTH
Methods: group MGMT-TAC, local
Current attempt: central authentication rejected  ← a completed denial, not a timeout
Local method selected: no  ← expected after FAIL
```

A supported `show aaa servers`, `show tacacs`, or `show radius statistics` can reveal requests, responses, failures, and timeouts. Simulator output may be less detailed. `test aaa group` can issue an actual authentication test on supporting software; its syntax and supported protocols vary. Cisco demonstrates a named TACACS+ group with the `legacy` form on CML IOL, while some IOS command references explicitly limit the command to RADIUS. Do not assume the CML example works on a Packet Tracer 2911. It also places a test password in command input, so use only a dedicated lab account and avoid exposing real secrets in notes. A successful direct test does not prove that VTY lines select that group.

If login succeeds but the shell is denied, inspect EXEC authorization separately. If local VTY login works immediately and no server requests occur, a local-only list or wrong binding is a strong candidate; cached availability policy can also affect delay, so verify the configuration. If the server reports a rejection, correct the account/policy rather than changing routing without evidence.

A focused authentication debug can help on supporting images, but stop it with `undebug all` after the observation. Preserve useful evidence without publishing credentials. The final proof is a fresh successful intended login, a demonstrated denial, tested outage behavior, and a working recovery path. Save only after those checks match the design.

## Exam focus

- Compare the three AAA functions and the roles of client, server, user secret, and shared key.
- Know conventional protocol ports and qualified protection differences.
- Build server definitions/groups, method lists, and VTY bindings; local accounts also need deliberate privileges.
- Distinguish FAIL from ERROR and authentication from EXEC authorization.
- Test TACACS+ and RADIUS management access, console recovery, and the actual selected method.
