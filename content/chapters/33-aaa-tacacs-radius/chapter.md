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

In chapter 8 you gave one router a local username and told its VTY lines to use it. Now picture forty routers and switches, each with its own copy of every administrator's account. When someone joins, leaves or changes a password, you edit forty devices. Everyone has the same full access, and nothing records who changed what. Local accounts do not scale.

The answer is to keep the accounts on a central server and have every device ask that server when someone logs in. This chapter explains the three jobs such a server does (authentication, authorization and accounting), compares the two protocols a device can use to reach it (TACACS+ and RADIUS), and shows the IOS configuration. By the end you will be able to configure a router as a TACACS+ or RADIUS client, predict when it falls back to its local accounts, and keep a console path that still works when the server is down.

## Separate identity, permission, and records

:::facts
- **Authentication** verifies an identity claim; **authorization** determines allowed access or actions; **accounting** records selected activity.
- Classic **TACACS+** uses TCP **49** for separate authentication, authorization, and accounting exchanges.
- Conventional **RADIUS** uses UDP **1812** for authentication/authorization and **1813** for accounting. Legacy **1645/1646** deployments exist; configure matching ports explicitly.
- The router is an SSH server to the administrator and an AAA client to the central service.
- In a login method list, an authentication **FAIL** stops the attempt. An **ERROR**, meaning the method could not complete authentication, can advance to the next method.
- Establish local recovery, bind the intended lists, and test new sessions before saving a management-access change.
:::

AAA is three separate questions. **Authentication** asks who you are, and checks it with a username and password. **Authorization** asks what you are allowed to do: whether you get a shell, at which privilege level, and which commands you may run. **Accounting** records what you did: when you logged in and out and, if configured, each command.

A single login shows all three. Morgan's SSH username and password are accepted by a router, but `configure terminal` is refused by central policy. Authentication succeeded and authorization denied the command. The server's log entry for the attempt is accounting. Passing one stage says nothing about the next: a correct password does not promise privilege 15.

The v1.1 objective compares these concepts. The v2.0 objective additionally requires configuring devices with local usernames and as TACACS+/RADIUS management clients. That requires understanding the complete dependency chain: management transport, server reachability, client identity and shared key, server definition/group, login list, and line binding. Detailed enterprise policy design and a full identity-server deployment are beyond this chapter's scope.

## Local accounts versus a central server

A local `username` entry holds a secret and a privilege level, so a device can authenticate and authorize by itself. That is enough for a small lab, and every device should keep one local account for recovery. Beyond that, each account change must be repeated on every device, and shared accounts hide who did what.

A **central AAA server** holds the accounts and policies in one place and collects the accounting records. Cisco ISE (Identity Services Engine) is Cisco's AAA server and speaks both RADIUS and TACACS+. The server does nothing until each device is configured to use it.

The network device is often called the **NAS**, network access server, in AAA terminology. The NAS sends the AAA request using its own IP source. That address can differ from the administrator's address in the SSH connection. A server's client definition must recognize the NAS source and use the matching shared key. This key protects the client/server relationship; it is different from the user's login password.

```diagram
{"type":"sequence","title":"Two client/server relationships","caption":"The administrator authenticates through R1; the AAA server recognizes R1 as its client.","actors":["Admin-PC 10.0.0.50","R1 10.0.0.1","AAA 10.0.0.100"],"steps":[{"from":0,"to":1,"label":"SSH management connection","note":"PC is SSH client; R1 is SSH server","accent":true},{"from":1,"to":2,"label":"AAA authentication request","note":"R1 is AAA client; server checks its source/key"},{"from":2,"to":1,"label":"Authentication result or challenge"},{"from":1,"to":0,"label":"Continue or reject this login"}]}
```

Plan for outages as well as normal service. A local recovery account needs a protected secret, deliberate privilege, tested console access, and an owner responsible for its lifecycle. Its existence does not mean central rejection should be bypassed. Record when recovery access is used and restore the intended management policy afterward.

## TACACS+ versus RADIUS

A device can talk to the AAA server with either of two protocols. The exam expects you to know each row of this comparison.

| Property | Classic TACACS+ | Conventional RADIUS/UDP |
|---|---|---|
| Origin | Developed by Cisco; now described in RFC 8907 | Open IETF standard (RFC 2865) |
| Transport | TCP 49 | UDP 1812 and 1813; legacy pairs exist |
| AAA organization | Separate exchanges | Access-Accept can carry authorization attributes; accounting is separate |
| Common role | Device administration | Network access; can also authenticate device management |
| Command control on referenced IOS | Supports per-command authorization/accounting | Does not supply TACACS+-style per-command authorization |
| Protection scope | Body obfuscation; header remains visible | User-Password hiding in the ordinary password case; much other data is visible |

**TACACS+ keeps the three A's separate.** After the authentication dialogue, the device sends a separate authorization request whenever it needs a decision, and separate accounting records. Because authorization is its own exchange, the device can ask the server about each command an administrator types. That is why TACACS+ is the usual choice for administering network devices.

**RADIUS combines authentication and authorization.** The device sends an **Access-Request** and the server answers with **Access-Accept**, **Access-Reject** or **Access-Challenge** (a request for more information). The authorization, such as a VLAN or a privilege level, rides inside the Access-Accept as attributes, so there is no later per-command check. Accounting is separate and uses its own port. RADIUS is the usual choice for network access: 802.1X on switch ports and wireless LANs, and VPN logins.

**They protect different amounts of the packet.** The traditional comparison, and the one the exam uses, is that TACACS+ encrypts the entire body of each packet, leaving only the header readable, while RADIUS encrypts only the password and sends the username and other attributes in clear text. Neither is strong by modern standards: RFC 8907 calls the TACACS+ mechanism *obfuscation* because it is built on MD5. Run both over a protected management network.

**The ports must match the server.** RADIUS was first deployed on UDP 1645 and 1646 and later assigned 1812 and 1813. The legacy IOS `radius-server host` command still defaults to 1645/1646, while most current servers listen on 1812/1813, so state the ports explicitly. A mismatch looks exactly like an unreachable server: the request times out.

## Enable AAA with a tested recovery path

`aaa new-model` switches a device from the simple line commands (`login`, `login local`) to the AAA framework, where **method lists** decide how each line authenticates. It takes effect at once. With no lists defined, the VTY lines fall back to the local username database, so a device with no local user can lock you out the moment you enter the command. Decide what the console and the VTY lines should use, and configure both explicitly.

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

A method list is an ordered list of places to check a login. The list named `default` applies to every line that has no other list bound to it. A **named** list, such as `CONSOLE` or `VTY-AUTH` here, applies only to the lines where `login authentication <name>` selects it. Many devices have VTY lines beyond 0–4; bind the list on those as well.

Then test with new sessions. Open a fresh SSH login, and keep it open while you log out of the console and back in. A session that was already open before the change proves nothing, because it authenticated under the old rules. If the console login fails, the open SSH session lets you fix it.

## Servers and server groups

Pointing the device at the server takes two objects. A **server definition** gives the server's address, the shared key and, for RADIUS, the ports. A **server group** collects one or more definitions under a name that a method list can refer to. On current IOS and IOS XE, the TACACS+ form is:

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

A group can hold several servers. If the first does not answer, the device tries the next one. If a server answers with a rejection, that answer is final and no other server is asked.

## Build and apply method lists

Change only the already-bound VTY list when the server is ready:

```ios
R1# configure terminal
R1(config)# aaa authentication login VTY-AUTH group MGMT-TAC local
R1(config)# end
```

The order of methods is the policy, and the rule for moving from one method to the next is the most tested point in this chapter. `group MGMT-TAC local` asks the TACACS+ group first. The device moves on to `local` **only if the group gives no answer at all**, which IOS calls ERROR: the servers are unreachable, time out, or cannot process the request. If a server answers and rejects the login (FAIL), because the password is wrong or the user is unknown to it, authentication stops there and `local` is never consulted.

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

`show aaa servers`, `show tacacs` and `show radius statistics` count requests, responses, failures and timeouts; Packet Tracer shows less detail than real IOS. If a counter does not move when you log in, the line is not using that server. On real IOS, `test aaa group <group> <user> <password> legacy` sends a test authentication without opening a session, though not every platform supports it for TACACS+. It puts the password on the command line, so use a lab account, and remember that it tests the server, not the line binding.

If login succeeds but the shell is denied, inspect EXEC authorization separately. If local VTY login works immediately and no server requests occur, a local-only list or wrong binding is a strong candidate; cached availability policy can also affect delay, so verify the configuration. If the server reports a rejection, correct the account/policy rather than changing routing without evidence.

A focused authentication debug can help on supporting images, but stop it with `undebug all` after the observation. Preserve useful evidence without publishing credentials. The final proof is a fresh successful intended login, a demonstrated denial, tested outage behavior, and a working recovery path. Save only after those checks match the design.

## Exam focus

- Authentication: who you are. Authorization: what you may do. Accounting: what you did.
- TACACS+: Cisco-developed, TCP 49, separates authentication, authorization and accounting, encrypts the whole packet body, supports per-command authorization, used for device administration.
- RADIUS: open standard, UDP 1812 (authentication and authorization together) and 1813 (accounting), legacy 1645/1646, encrypts only the password, used for network access such as 802.1X.
- The router or switch is the AAA client (NAS). Its shared key with the server is not a user password.
- `aaa new-model` enables AAA. A method list is built with `aaa authentication login` and bound to a line with `login authentication`.
- In `group tacacs+ local`, the local database is used only when no server answers. A rejection from the server is final.
