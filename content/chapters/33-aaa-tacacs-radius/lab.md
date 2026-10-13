---
title: Configure and test TACACS+ and RADIUS management clients
environment: mixed
devices: ["1 × 2911 router (R1)", "1 × 2960 switch (SW1)", "1 × PC-PT (Admin-PC)", "1 × Server-PT (AAA)", "Modern IOS/IOS XE syntax worksheet"]
minutes: 85
---
Build local SSH and a tested console recovery path, then configure TACACS+ and RADIUS in separate saved copies of the same lab. Test success, rejection, and service unavailability. The main simulator configurations use classic server syntax; the final worksheet translates them to named server objects and groups. No Packet Tracer, CML, or hardware execution is claimed. Feature and server-policy support vary, so record unsupported behavior and use the specified paper fallback.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The LAN and SSH commands are supplied preparation. Your main task is to trace the selected line, method list, group, server, and result for a **new session**. Before each login test, record a prediction. Afterward, record the username, server state, list selected, available server/device evidence, outcome, and whether the result was measured or supplied on paper. Never put the actual secret in the evidence table.

## Topology

```diagram
{"type":"topology","title":"A single management subnet","caption":"R1 sources AAA requests from 10.0.0.1; Admin-PC has an independent console cable.","nodes":[{"id":"P","kind":"pc","label":"Admin-PC","sub":"10.0.0.50/24","x":1,"y":3},{"id":"S","kind":"switch","label":"SW1","x":5,"y":3},{"id":"R","kind":"router","label":"R1","sub":"Gi0/0 10.0.0.1/24","x":10,"y":1},{"id":"A","kind":"server","label":"AAA","sub":"10.0.0.100/24","x":10,"y":5}],"links":[{"from":"P","to":"S","toLabel":"Fa0/1"},{"from":"S","to":"R","fromLabel":"Gi0/1","toLabel":"Gi0/0"},{"from":"S","to":"A","fromLabel":"Fa0/2"},{"from":"P","to":"R","label":"Console","style":"dashed"}]}
```

| Device/interface | Address and mask | Cable/port |
|---|---|---|
| R1 Gi0/0 | 10.0.0.1, 255.255.255.0 | Straight-through to SW1 Gi0/1 |
| Admin-PC FastEthernet0 | 10.0.0.50, 255.255.255.0; gateway .1 | Straight-through to SW1 Fa0/1 |
| AAA FastEthernet0 | 10.0.0.100, 255.255.255.0; gateway .1 | Straight-through to SW1 Fa0/2 |
| Admin-PC RS-232 | 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control | Console cable to R1 Console |

No DNS or Internet connection is needed. All used switch ports are access ports in VLAN 1. Use these public credentials only in the disposable lab:

| Purpose | Username or identifier | Lab value |
|---|---|---|
| Local recovery user | recovery | Lab-Recovery-2026! |
| Privileged EXEC secret | enable | Lab-Enable-2026! |
| Central user, absent locally | morgan | Lab-Morgan-2026! |
| TACACS+ device/server key | R1 client entry | Lab-Tacacs-Key-2026! |
| RADIUS device/server key | R1 client entry | Lab-Radius-Key-2026! |

## Step 1: Cable and address the fresh devices

Create the listed models, use the exact table, and set PC/server IP values in Desktop → IP Configuration. Open the router through Admin-PC Terminal and keep that console available throughout. Decline the setup dialog if offered.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.0.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
```

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface range fastethernet0/1 - 2
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 1
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 1
SW1(config-if)# no shutdown
SW1(config-if)# end
```

After forwarding begins, ping .1 and .100 from Admin-PC and ping .100 from R1.

:::expected
All intended local addresses are reachable and R1 Gi0/0 is up/up. These tests establish IP/ICMP reachability; the AAA service and accounts have not yet been tested.
:::

```state
{"status":"LAN reachable","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["P","R","A"],"chips":[{"node":"P","text":"Terminal → R1 console"}],"flows":[{"path":["P","S","R"],"back":true,"label":"Admin-PC pings 10.0.0.1","tags":{"S":"VLAN 1 · Fa0/1 → Gi0/1"},"backTags":{"R":"Gi0/0 10.0.0.1 · up/up"}},{"path":["P","S","A"],"back":true,"label":"Admin-PC pings 10.0.0.100","tags":{"S":"VLAN 1 · Fa0/1 → Fa0/2"}},{"path":["R","S","A"],"back":true,"label":"R1 pings 10.0.0.100","tags":{"S":"VLAN 1 · Gi0/1 → Fa0/2"}}],"rows":[["Admin-PC to .1 and .100","Replies","ok"],["R1 to .100","Replies","ok"],["R1 Gi0/0","10.0.0.1/24 · up/up","ok"],["AAA service and accounts","Not yet tested","dim"]]}
```

## Step 2: Build and verify local SSH before AAA

```ios R1
R1# configure terminal
R1(config)# username recovery privilege 15 secret Lab-Recovery-2026!
R1(config)# enable secret Lab-Enable-2026!
R1(config)# ip domain-name lab.example
R1(config)# crypto key generate rsa general-keys modulus 2048
R1(config)# ip ssh version 2
R1(config)# line console 0
R1(config-line)# login local
R1(config-line)# exec-timeout 10 0
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# exec-timeout 5 0
R1(config-line)# end
R1# show running-config
R1# show ip ssh
```

If the RSA one-line form is unsupported, use `crypto key generate rsa` in global configuration and answer 2048 at its modulus prompt. Inspect the complete VTY configuration. If the image also has `line vty 5 15`, apply `login local`, `transport input ssh`, and `exec-timeout 5 0` to that existing range in line configuration mode too.

From Admin-PC Command Prompt run:

```text
ssh -l recovery 10.0.0.1
```

Enter the recovery password and run `show privilege`. Keep that tested SSH session open while exiting and reopening the console and verifying its local login. Return to privileged EXEC on the console, then close the SSH session with `exit`.

:::expected
Both fresh access paths authenticate recovery. `show privilege` reports 15. A legacy secret-storage type is a simulator limitation, not a modern password-storage recommendation. Record any unsupported SSH setup instead of proceeding to remote AAA with no tested recovery.
:::

```state
{"status":"Local SSH and console work","tone":"ok","focus":["P","R"],"chips":[{"node":"R","text":"SSHv2 · login local","tone":"ok"}],"flows":[{"path":["P","S","R"],"back":true,"label":"ssh -l recovery 10.0.0.1","backTags":{"R":"VTY login local · privilege 15"}},{"path":["P","R"],"back":true,"label":"Console reopened, local login","backTags":{"R":"Console login local · recovery"}}],"rows":[["recovery","Accepted on both paths","ok"],["show privilege","15","ok"],["VTY 0 4","login local · ssh · timeout 5 0"],["Console 0","login local · timeout 10 0"]]}
```

## Step 3: Enable explicit local AAA lists and save recovery

Before applying this block, identify which list will protect the console, which list the VTY lines will select, and which database each currently uses. Predict whether enabling a central server later should change the CONSOLE list automatically.

```ios R1
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

If an additional VTY range was found, bind it to the same named list now:

```ios R1
R1# configure terminal
R1(config)# line vty 5 15
R1(config-line)# login authentication VTY-AUTH
R1(config-line)# transport input ssh
R1(config-line)# end
```

Use the second block only for an existing range. Repeat a fresh recovery SSH login, keep it open while verifying a new console login again, and return to the console. Inspect the lists and line bindings in `show running-config`. Do not add EXEC or command authorization in this baseline.

Save R1 and SW1 with `copy running-config startup-config` and save the project as `aaa-local-baseline.pkt`. Use Save As `aaa-tacacs-work.pkt` before the next step.

:::expected
Both local-only lists work through their actual line bindings. Recovery remains available independently of the future central server. The separately saved baseline contains no remote-server dependency.
:::

```state
{"status":"Local AAA lists saved","tone":"ok","focus":["R"],"chips":[{"node":"R","text":"aaa new-model · lists local","tone":"ok"}],"flows":[{"path":["P","S","R"],"back":true,"label":"Fresh recovery SSH","backTags":{"R":"VTY-AUTH → local · recovery"}},{"path":["P","R"],"back":true,"label":"Fresh console login","backTags":{"R":"CONSOLE → local · recovery"}}],"rows":[["line vty 0 4","login authentication VTY-AUTH"],["line console 0","login authentication CONSOLE"],["default, CONSOLE, VTY-AUTH","local only","ok"],["Saved","aaa-local-baseline.pkt","ok"]]}
```

## Step 4: Configure the TACACS+ server and client

First fill in the prediction column below for a VTY list that tries the central group and then local. A displayed FAIL and ERROR are different supplied method results; do not treat every unsuccessful connection as one or the other. Keep these predictions for Steps 5–7 and use a separate copy for the RADIUS tests.

| New login case | Predicted next method/outcome | Later observed result and evidence |
|---|---|---|
| Morgan, correct central secret, central method PASS | Write before testing | Record after testing |
| Recovery exists locally; central method explicitly FAIL | Write before testing | Record the actual result or paper substitution |
| Recovery exists locally; central method ERROR | Write before testing | Record after the controlled outage |
| Morgan is absent locally; central method ERROR | Write before testing | Record after the controlled outage |
| Recovery on the separately bound console | Write before testing | Verify a fresh console session |

On AAA → Services → AAA, set Service On. Add a network client named R1 with Client IP `10.0.0.1`, Secret `Lab-Tacacs-Key-2026!`, and TACACS/TACACS+ server type as named by the GUI. Add central user `morgan` with password `Lab-Morgan-2026!`. Do not add `recovery` to the central service. Inspect the resulting client/user rows before configuring R1.

The following uses classic IOS server syntax, commonly available in simulator images:

```ios R1
R1# configure terminal
R1(config)# tacacs-server host 10.0.0.100 key Lab-Tacacs-Key-2026!
R1(config)# aaa authentication login VTY-AUTH group tacacs+ local
R1(config)# end
R1# show running-config
```

If the classic server command is rejected but named TACACS+ objects are available, use the complete TACACS+ translation in Step 12 and substitute group `MGMT-TAC` in this list. Do not configure both alternatives. If the image has no usable server-client syntax, keep the local baseline and perform the central tests as a paper exercise with the lesson's documented method results.

:::expected
The VTY list now selects the one defined TACACS+ server before local. The default and CONSOLE lists remain local-only. R1 is the server's client at .1; .50 is the SSH user endpoint and would be the wrong client IP for the AAA server entry.
:::

```state
{"status":"TACACS+ client configured","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: tacacs+ → local"},{"node":"A","text":"Service On · TACACS+ client .1","tone":"ok"}],"rows":[["VTY-AUTH","group tacacs+, then local"],["default and CONSOLE","Still local only"],["Server's client entry","R1 at 10.0.0.1, not .50"],["Central user","morgan · recovery not added"]]}
```

## Step 5: Verify central success and an explicit rejection

Open a new SSH session as `morgan` and enter the central password. Inspect the resulting prompt and `show privilege` where allowed, then close the session. This lab configures login authentication only; do not require privilege 15 from the server. On a simple server that returns no privilege attributes, user EXEC is the expected starting point; the enable secret permits the deliberately configured lab elevation.

With the server On, attempt one Morgan login with a wrong password and one recovery login with its correct local password. Inspect server records or supported device evidence for a rejection. If the simulator handles unknown users differently, record it and use the explicit paper FAIL case; service reachability alone is not proof of the returned result.

:::expected
Morgan's intended authentication succeeds. An explicit central FAIL rejects the wrong password and stops the list. If the server explicitly rejects local-only recovery, R1 must not use local as a second chance. The console still uses CONSOLE local. A central ERROR would be a different case even if the service is reachable.
:::

```state
{"status":"PASS and FAIL verified","tone":"ok","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: tacacs+ → local"},{"node":"A","text":"Service On · TACACS+ client .1","tone":"ok"}],"flows":[{"path":["P","S","R"],"label":"ssh -l morgan 10.0.0.1","tags":{"R":"VTY-AUTH → group tacacs+"}},{"path":["R","S","A"],"back":true,"label":"TACACS+ authentication","backTags":{"A":"morgan · central password · PASS"}},{"path":["R","S","P"],"tone":"reply","label":"Login accepted","tags":{"R":"PASS · morgan session opens"}},{"path":["P","S","R"],"label":"morgan, wrong password","tags":{"R":"VTY-AUTH → group tacacs+"}},{"path":["R","S","A"],"back":true,"label":"TACACS+ authentication","backTags":{"A":"Wrong password → FAIL"},"backStop":"R","backStopText":"FAIL stops the list · no local"}],"rows":[["morgan, central password","Accepted","ok"],["morgan, wrong password","FAIL · list stops","ok"],["recovery on VTY","If rejected, no local retry"],["Console","Still CONSOLE local"]]}
```

## Step 6: Observe TACACS+ service unavailability

Close remote test sessions. On AAA → Services → AAA, set Service Off. Start a fresh recovery SSH login. Then try Morgan, who does not exist locally. From the console inspect supported `show aaa servers` or `show tacacs` output; use Simulation to inspect the request path if available. A disabled TCP service might refuse a connection promptly or produce a timeout; do not require a fixed delay.

:::expected
When the TACACS+ group cannot complete authentication and returns ERROR, the local method can accept recovery. Morgan fails because the local database contains no Morgan account. A delay alone is not proof of this branch; correlate the controlled service state, selected list, and available evidence. Keep the service Off only for this step.
:::

```state
{"status":"TACACS+ Off: ERROR → local","tone":"warn","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: tacacs+ → local"},{"node":"A","text":"Service On · TACACS+ client .1","tone":"ok","until":0},{"node":"A","text":"Service Off","tone":"bad","from":0}],"flows":[{"event":["A"],"wait":1.6,"tags":{"A":"Service On → Off"}},{"path":["P","S","R"],"label":"Fresh recovery SSH","tags":{"R":"VTY-AUTH → group tacacs+"}},{"path":["R","S","A"],"label":"TACACS+ request","stop":"A","stopText":"Service Off · refused or timeout"},{"path":["R","S","P"],"tone":"reply","label":"recovery accepted","tags":{"R":"ERROR → local accepts recovery"}},{"path":["P","S","R"],"label":"ssh -l morgan 10.0.0.1","stop":"R","stopText":"Group ERROR · no local morgan"}],"rows":[["AAA service","Off for this step only","warn"],["recovery","ERROR → local · accepted","ok"],["morgan","No local account · fails"],["Delay alone","Not proof of this branch","dim"]]}
```

## Step 7: Restore TACACS+ service and save its working copy

Turn the AAA service On. Verify a new successful Morgan login and a new console recovery login while preserving a tested active session during the console check. Confirm `VTY-AUTH group tacacs+ local` or the chosen named-group equivalent and CONSOLE local. If a debug was used on supported software, stop it:

```ios R1
R1# undebug all
R1# show running-config
R1# copy running-config startup-config
```

Save as `aaa-tacacs-complete.pkt`. If remote policy must be rolled back, use the tested console and change only the VTY list to `aaa authentication login VTY-AUTH local`, test recovery SSH, and preserve the faulty evidence separately. Do not use `no aaa new-model` as a blind reset recipe.

:::expected
The service is restored and central authentication works. The working TACACS+ copy and independent local baseline remain saved. No debug is intentionally left running.
:::

```state
{"status":"TACACS+ restored and saved","tone":"ok","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: tacacs+ → local"},{"node":"A","text":"Service Off","tone":"bad","until":0},{"node":"A","text":"Service On · TACACS+ client .1","tone":"ok","from":0}],"flows":[{"event":["A"],"wait":1.6,"tags":{"A":"Service Off → On"}},{"path":["P","S","R"],"label":"New morgan SSH","tags":{"R":"VTY-AUTH → group tacacs+"}},{"path":["R","S","A"],"back":true,"label":"TACACS+ authentication","backTags":{"A":"morgan · PASS"}},{"path":["R","S","P"],"tone":"reply","label":"Login accepted","tags":{"R":"PASS · morgan session opens"}},{"path":["P","R"],"back":true,"label":"Fresh console login","backTags":{"R":"CONSOLE → local · recovery"}}],"rows":[["AAA service","Restored · On","ok"],["morgan via VTY","New login succeeds","ok"],["Console","recovery · CONSOLE local","ok"],["Saved","aaa-tacacs-complete.pkt","ok"]]}
```

## Step 8: Open a clean copy for RADIUS and match its ports

Predict whether changing from TACACS+ to RADIUS changes the FAIL-versus-ERROR rule. Before configuring a port, record the server's actual authentication listener and the corresponding router setting; do not use a successful ping as evidence that these match.

Open `aaa-local-baseline.pkt`, then Save As `aaa-radius-work.pkt`. This avoids mixing two protocol exercises. Configure AAA → Services → AAA with Service On, client R1 at .1, RADIUS type, key `Lab-Radius-Key-2026!`, and central user Morgan with the table's password.

Inspect the server's displayed or documented RADIUS port. If configurable, select standard authentication 1812 and accounting 1813. If the simulator fixes the authentication port at 1645, use the explicit legacy pair 1645/1646 in the alternative below and record it. Do not assume every Packet Tracer release has the same GUI or port defaults. If no reliable port setting/evidence is available, use the standard pair as a paper configuration and do not claim a successful central test.

For a service at 1812/1813:

```ios R1
R1# configure terminal
R1(config)# radius-server host 10.0.0.100 auth-port 1812 acct-port 1813 key Lab-Radius-Key-2026!
R1(config)# aaa authentication login VTY-AUTH group radius local
R1(config)# end
```

For the documented/observed legacy 1645 service, use this block instead:

```ios R1
R1# configure terminal
R1(config)# radius-server host 10.0.0.100 auth-port 1645 acct-port 1646 key Lab-Radius-Key-2026!
R1(config)# aaa authentication login VTY-AUTH group radius local
R1(config)# end
```

Choose exactly one. If the classic form is unsupported, use Step 12's named RADIUS block with the verified port pair and group `MGMT-RAD` instead. Accounting is not enabled merely by defining its destination port.

:::expected
R1's server address, client source, shared key, and selected authentication port match the service. VTY-AUTH uses RADIUS before local; CONSOLE remains local-only. The standard and legacy examples differ in explicit port values, not in fallback policy.
:::

```state
{"status":"RADIUS copy configured","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: radius → local"},{"node":"A","text":"Service On · RADIUS client .1","tone":"ok"}],"rows":[["Copy","aaa-radius-work.pkt, from baseline"],["Auth/acct ports","1812/1813, or verified 1645/1646"],["VTY-AUTH","group radius, then local"],["CONSOLE","Still local only"]]}
```

## Step 9: Verify RADIUS success and rejection

Repeat fresh Morgan authentication, then a wrong Morgan password. Test local-only recovery while central service is On and inspect the actual result. Use `show radius statistics` or `show aaa servers` where supported; otherwise use the controlled accounts, service configuration, and Simulation evidence with a stated limit. A direct `test aaa` command, if available, does not replace the SSH binding test.

:::expected
A valid central account can authenticate. An Access-Reject is a completed denial and does not allow local fallback. An Access-Challenge continues authentication rather than meaning either success or server failure. No per-command authorization or accounting outcome is asserted by these login-only tests.
:::

```state
{"status":"Accept and Reject verified","tone":"ok","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: radius → local"},{"node":"A","text":"Service On · RADIUS client .1","tone":"ok"}],"flows":[{"path":["P","S","R"],"label":"ssh -l morgan 10.0.0.1","tags":{"R":"VTY-AUTH → group radius"}},{"path":["R","S","A"],"back":true,"label":"Access-Request","backTags":{"A":"morgan · Access-Accept"}},{"path":["R","S","P"],"tone":"reply","label":"Login accepted","tags":{"R":"Accept · morgan session opens"}},{"path":["P","S","R"],"label":"morgan, wrong password","tags":{"R":"VTY-AUTH → group radius"}},{"path":["R","S","A"],"back":true,"label":"Access-Request","backTags":{"A":"Wrong password → Access-Reject"},"backStop":"R","backStopText":"Reject is final · no local"}],"rows":[["morgan, central password","Authenticates","ok"],["morgan, wrong password","Access-Reject · no local","ok"],["Access-Challenge","Continues; not pass or error"],["Tested","Login only · no authz or acct","dim"]]}
```

## Step 10: Observe RADIUS unavailability

Set the AAA service Off, close prior test sessions, and attempt a new recovery login. Try the central-only Morgan account separately. Observe the supported request/timeout evidence from the console or Simulation.

:::expected
An unavailable RADIUS method can return ERROR and advance to local, where recovery succeeds and Morgan fails. Retries, dead-server state, and timers affect timing; do not require a five-second pause or infer the selected method from delay alone.
:::

```state
{"status":"RADIUS Off: ERROR → local","tone":"warn","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: radius → local"},{"node":"A","text":"Service On · RADIUS client .1","tone":"ok","until":0},{"node":"A","text":"Service Off","tone":"bad","from":0}],"flows":[{"event":["A"],"wait":1.6,"tags":{"A":"Service On → Off"}},{"path":["P","S","R"],"label":"Fresh recovery SSH","tags":{"R":"VTY-AUTH → group radius"}},{"path":["R","S","A"],"label":"Access-Request","stop":"A","stopText":"Service Off · method unavailable"},{"path":["R","S","P"],"tone":"reply","label":"recovery accepted","tags":{"R":"ERROR → local accepts recovery"}},{"path":["P","S","R"],"label":"ssh -l morgan 10.0.0.1","stop":"R","stopText":"Group ERROR · no local morgan"}],"rows":[["AAA service","Off for this step only","warn"],["recovery","ERROR → local · succeeds","ok"],["morgan","No local account · fails"],["Timing","Retries and timers vary","dim"]]}
```

## Step 11: Restore RADIUS and save its working copy

Turn the service On, verify a new Morgan session, and confirm the console recovery path. Stop any optional debug, inspect the selected list and complete VTY bindings, and save R1 with `copy running-config startup-config`. Save the project as `aaa-radius-complete.pkt`.

:::expected
RADIUS service is restored, its configured authentication port is documented, and the final copy has no induced outage. The TACACS+ complete copy and local baseline remain separate. An unsuccessful simulator branch is recorded as incomplete execution, not passed from paper expectations alone.
:::

```state
{"status":"RADIUS restored and saved","tone":"ok","focus":["R","A"],"chips":[{"node":"R","text":"VTY-AUTH: radius → local"},{"node":"A","text":"Service Off","tone":"bad","until":0},{"node":"A","text":"Service On · RADIUS client .1","tone":"ok","from":0}],"flows":[{"event":["A"],"wait":1.6,"tags":{"A":"Service Off → On"}},{"path":["P","S","R"],"label":"New morgan SSH","tags":{"R":"VTY-AUTH → group radius"}},{"path":["R","S","A"],"back":true,"label":"Access-Request","backTags":{"A":"morgan · Access-Accept"}},{"path":["R","S","P"],"tone":"reply","label":"Login accepted","tags":{"R":"Accept · morgan session opens"}},{"path":["P","R"],"back":true,"label":"Fresh console login","backTags":{"R":"CONSOLE → local · recovery"}}],"rows":[["AAA service","On · no induced outage","ok"],["morgan via VTY","New session","ok"],["Console","recovery · CONSOLE local","ok"],["Saved","aaa-radius-complete.pkt","ok"]]}
```

## Step 12: Translate both clients to named server objects

Complete a paper configuration from the requirements below before opening the solution. On supporting IOS/IOS XE software, you may then apply one translation to a fresh copy of the local baseline and repeat the fresh-session checks. Do not paste it over existing classic server definitions. If you reached this step because the earlier classic form was unsupported, use the solution directly as the supplied setup for that branch, then return to its tests.

| Configuration component | TACACS+ copy | RADIUS copy |
|---|---|---|
| Named server object | TAC1 | RAD1 |
| Server IPv4 address | 10.0.0.100 | 10.0.0.100 |
| Shared key | Lab-Tacacs-Key-2026! | Lab-Radius-Key-2026! |
| Named group containing the object | MGMT-TAC | MGMT-RAD |
| Login list | VTY-AUTH: selected group, then local | VTY-AUTH: selected group, then local |
| Existing VTY binding | login authentication VTY-AUTH | login authentication VTY-AUTH |
| RADIUS ports | Not applicable | Verified server pair from Step 8 |

Write the object, group membership, method list, and line-binding relationship. Explain why an object can exist without a login ever using it, and why defining an accounting destination does not prove that accounting records are being sent.

:::solution
These alternatives assume the already verified local baseline, including CONSOLE local and the VTY-AUTH line bindings. Choose one protocol per saved copy.

```ios R1 TACACS+ alternative
R1# configure terminal
R1(config)# tacacs server TAC1
R1(config-server-tacacs)# address ipv4 10.0.0.100
R1(config-server-tacacs)# key Lab-Tacacs-Key-2026!
R1(config-server-tacacs)# exit
R1(config)# aaa group server tacacs+ MGMT-TAC
R1(config-sg-tacacs+)# server name TAC1
R1(config-sg-tacacs+)# exit
R1(config)# aaa authentication login VTY-AUTH group MGMT-TAC local
R1(config)# end
```

```ios R1 RADIUS alternative
R1# configure terminal
R1(config)# radius server RAD1
R1(config-radius-server)# address ipv4 10.0.0.100 auth-port 1812 acct-port 1813
R1(config-radius-server)# key Lab-Radius-Key-2026!
R1(config-radius-server)# exit
R1(config)# aaa group server radius MGMT-RAD
R1(config-sg-radius)# server name RAD1
R1(config-sg-radius)# exit
R1(config)# aaa authentication login VTY-AUTH group MGMT-RAD local
R1(config)# end
```

Use the RADIUS server's actual verified pair: the shown block uses 1812/1813; replace it with 1645/1646 only for the verified legacy service. TAC1 belongs to MGMT-TAC, and RAD1 belongs to MGMT-RAD. The line selects VTY-AUTH, that list selects the named group, and the group contains the server. A missing group member or a different line binding breaks that selection chain even if the object is correctly defined.

CONSOLE remains local-only. These blocks configure login authentication, not EXEC/command authorization or accounting policy. On a supporting image, verify new successful, rejected, and unavailable-server logins through the selected VTY list; restore service afterward. A paper translation is not a measured successful login.
:::

### Evidence to keep

- The saved local baseline and a freshly tested console recovery path, not just an old open session.
- Separate TACACS+ and RADIUS records tracing line → list → group → server; server address, NAS/client address, and actual authentication port must agree.
- Predictions and actual new-session results for success, explicit rejection, and service unavailability, including the account that exists only locally and the one that exists only centrally.
- Supported rejection/error counters, server records, or capture evidence, with unavailable evidence and simulator limitations stated. A delay alone is not a method result.
- Service restored and a new central login verified after each induced outage. Record login authentication separately from untested authorization/accounting features.

```state
{"status":"Named objects translated","focus":["R"],"chips":[{"node":"R","text":"VTY → VTY-AUTH → group → server"}],"rows":[["TACACS+ copy","TAC1 in MGMT-TAC · 10.0.0.100"],["RADIUS copy","RAD1 in MGMT-RAD · verified ports"],["VTY-AUTH","Named group, then local"],["CONSOLE","Still local only"]]}
```

## Troubleshooting

- New SSH session fails before authentication → check LAN reachability, SSH keys/status, VTY transport and restrictions before diagnosing a password.
- Central FAIL → inspect account and policy; local is not a rejection override.
- Group ERROR → inspect address, source/client entry, key, transport port, path, and service; a ping proves none of the AAA-specific settings.
- No central requests during a fresh login → inspect the selected list and binding; do not infer method selection only from login speed.
- Authentication succeeds but shell fails on an extended setup → inspect EXEC authorization independently and apply only the approved fallback policy.
- If remote access is lost, use tested CONSOLE local and restore VTY-AUTH local. If that recovery was not verified, return to the separately saved baseline rather than guessing through a live management change.

## Challenge

Diagnose this independent **paper** management design without modifying the working projects. R3 Gi0/0 is 10.33.0.1/24, the AAA server is 10.33.0.100/24, and Admin-PC is 10.33.0.50/24. The server and PC share the management LAN. R3 also owns Loopback0 at 10.255.33.1/32, and a supported TACACS+ source-interface setting deliberately uses that loopback. The chosen group, key, central account `avery`, and local recovery account have been checked. CONSOLE local has been tested with a fresh session.

The following are supplied findings from two stages of the investigation, not measurements from your simulator:

```output Selected R3 configuration — initial state
aaa authentication login default local
aaa authentication login CONSOLE local
aaa authentication login VTY-REMOTE group MGMT-B local
!
tacacs server TAC-B
 address ipv4 10.33.0.100
 key [agreed lab value omitted]
!
aaa group server tacacs+ MGMT-B
 server name TAC-B
!
line console 0
 login authentication CONSOLE
line vty 0 4
 login authentication default
 transport input ssh
```

```output Investigation findings
Initial fresh Avery SSH attempt: no TACACS+ request leaves R3.
After correcting the VTY list selection:
  server capture sees request source 10.255.33.1
  server client registry recognizes only 10.33.0.1
  server route table has 10.33.0.0/24 connected; no default or host route
Approved design: register the loopback NAS address;
                use R3 at 10.33.0.1 as the server's default gateway.
No additional VTY ranges or path filters exist in this paper case.
```

Identify the initial selection fault and the two independent server-side corrections required by the approved design. Supply the exact R3 line-binding correction and the server client/gateway values. Explain why changing Avery's password, adding the SSH PC to the server's network-client registry, or retaining an old working SSH session does not verify the repair. Finish with a fresh-session validation plan covering rejection and server unavailability as distinct cases.

:::solution
The initial VTY selects `default local`, so the otherwise valid VTY-REMOTE list is unused. Correct the binding from the tested console:

```ios R3
R3# configure terminal
R3(config)# line vty 0 4
R3(config-line)# login authentication VTY-REMOTE
R3(config-line)# end
R3# show running-config
```

Register **10.255.33.1** as the permitted TACACS+ network client with the agreed device/server key. Set the AAA server's default gateway to **10.33.0.1**, as approved, so it can return traffic to the off-link loopback source. The request reaching the server proves neither recognition of that NAS nor a working reply path. Admin-PC .50 is the SSH endpoint, not the source of R3's TACACS+ requests.

The supplied account/key checks do not repair method selection, NAS registration, or routing, so changing Avery's password is unsupported. Inspect the actual VTY binding and server settings, then start a new Avery SSH login and correlate new request/response evidence with its result. An existing session can survive configuration changes and is not that test.

With the service available, verify an explicit central rejection stops the list. In a separately controlled outage, verify that a group ERROR can reach local recovery while the central-only Avery account cannot authenticate locally. Restore service, verify a new central login, and retain a fresh console recovery check before saving the intended configuration. These paper corrections do not assert that authorization or accounting was configured or tested.
:::
