---
title: Configure local accounts and SSH, diagnose a refusal, and restore access
environment: packet-tracer
devices: ["1 × ISR 2911 (R1)", "1 × Catalyst 2960-24TT (SW1)", "1 × PC-PT (ADMIN)", "1 × Laptop-PT (CONSOLE)"]
minutes: 70
---
Build this as a new Packet Tracer project. You will verify two privilege levels, restrict remote access to SSH, create a controlled transport fault, and recover through the console. All credentials shown are for this isolated exercise. Outputs are representative excerpts; record what your installed simulator actually reports.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

## Topology

```diagram
{"type":"topology","title":"SSH access lab","caption":"The laptop's console connection is independent of the PC's Ethernet management path.","nodes":[{"id":"L","kind":"laptop","label":"CONSOLE","sub":"RS-232 terminal","x":2,"y":1},{"id":"P","kind":"pc","label":"ADMIN","sub":"10.8.0.10/24","x":2,"y":5},{"id":"S","kind":"switch","label":"SW1","sub":"2960-24TT","x":6,"y":5},{"id":"R","kind":"router","label":"R1","sub":"2911 · 10.8.0.1/24","x":10,"y":3}],"links":[{"from":"L","to":"R","fromLabel":"RS-232","toLabel":"Console","style":"dashed"},{"from":"P","to":"S","fromLabel":"Fa0","toLabel":"Fa0/1"},{"from":"S","to":"R","fromLabel":"Gi0/1","toLabel":"Gi0/0","accent":true}]}
```

| Connection or device | Setting |
|---|---|
| CONSOLE RS-232 → R1 Console | Console cable |
| ADMIN Fa0 → SW1 Fa0/1 | Copper straight-through |
| SW1 Gi0/1 → R1 Gi0/0 | Copper straight-through |
| ADMIN IPv4 | `10.8.0.10`, mask `255.255.255.0`, gateway `10.8.0.1` |
| R1 Gi0/0 | `10.8.0.1/24` |
| SW1 | Default access VLAN for this single-LAN exercise; no management IP required |

The gateway is recorded for a complete host configuration; this lab's SSH destination is on ADMIN's own subnet. DNS is not needed because the SSH test uses an IP address.

## Step 1: Open a console and identify the device

Place and cable the devices. On CONSOLE, open Desktop → Terminal and accept the displayed serial settings, using 9600 baud, 8 data bits, no parity and 1 stop bit for the 2911. Press Enter if needed. Decline the initial configuration dialog if it appears. Keep this terminal open throughout the exercise.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# no ip domain-lookup
R1(config)# end
R1# show version
R1# show line
```

:::expected
The prompt is `R1#`. Record the model, image description and available console/VTY lines. `no ip domain-lookup` avoids accidental hostname lookups from mistyped commands; it does not prevent local RSA-key generation or change ADMIN's DNS settings. If the terminal is blank, check the console cable endpoints before investigating Ethernet.
:::

```state
{"status":"Console session open","cabled":true,"addressed":false,"focus":["L","R"],"prompt":{"node":"R","text":"R1#","tone":"ok"},"chips":[{"node":"L","text":"Terminal open"}],"rows":[["Console terminal","9600 baud · 8 data · no parity · 1 stop"],["Prompt","R1#","ok"],["Record","Model, image, console and VTY lines"]]}
```

## Step 2: Establish the IP path

On ADMIN, use Desktop → IP Configuration to enter the address table. Configure R1 through the console.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# description Management lab LAN
R1(config-if)# ip address 10.8.0.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show running-config
```

On ADMIN, open Desktop → Command Prompt:

```text
ping 10.8.0.1
```

:::expected
Gi0/0 should have `10.8.0.1` and become `up/up` after the link is operational. Repeat an initial ping if address resolution was still in progress. If repeated tests fail, verify cabling, address/mask and interface state. Record every VTY range shown in the running configuration; later steps must apply the intended policy to all available lines.
:::

```state
{"status":"IP path works","tone":"ok","wake":["R"],"focus":["P","R"],"chips":[{"node":"L","text":"Terminal open"}],"flows":[{"path":["P","S","R"],"back":true,"label":"ping 10.8.0.1","tags":{"R":"Gi0/0 10.8.0.1 · up/up"}}],"rows":[["ADMIN","10.8.0.10/24 · gateway 10.8.0.1"],["R1 Gi0/0","10.8.0.1/24 · up/up","ok"],["Ping 10.8.0.1","Replies · repeat if ARP pending","ok"],["VTY ranges","Record every range shown"]]}
```

## Step 3: Create users and an enable secret

Configure one administrator and one lower-privilege account. Do this before making a line depend on the local database.

```ios R1
R1# configure terminal
R1(config)# enable secret EnableLabSecret8
R1(config)# username admin privilege 15 secret AdminLabSecret8
R1(config)# username trainee secret TraineeLabSecret8
R1(config)# end
R1# show running-config | include username
R1# show running-config | include enable
```

:::expected
Both usernames and the enable secret appear. The stored verifier strings and their type numbers may differ by image; do not compare them character for character with an example hash. The configuration explicitly gives `admin` privilege 15 and leaves `trainee` at the default local-user level of 1. If a filter is unsupported, inspect the full running configuration.
:::

```state
{"status":"Local users created","focus":["R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"2 users · enable secret"}],"rows":[["admin","privilege 15"],["trainee","Default level 1"],["enable secret","Set · stored as a verifier"],["Lines","Not yet using login local","dim"]]}
```

## Step 4: Protect the console line

Keep the existing console session open. Do not deliberately log out until a separate remote session has been tested. An open terminal window does not prevent the five-minute idle timeout: if the session times out, press Enter and sign in as `admin` with `AdminLabSecret8` from Step 3.

```ios R1
R1# configure terminal
R1(config)# line console 0
R1(config-line)# login local
R1(config-line)# exec-timeout 5 0
R1(config-line)# logging synchronous
R1(config-line)# end
R1# show running-config | section line con
```

:::expected
The console line uses `login local` and a five-minute idle timeout. The existing session remains available until it ends or the idle timeout expires; the next console login will need one of the accounts from Step 3. A missing user entry must be corrected now, before that session ends.
:::

```state
{"status":"Console uses login local","focus":["L","R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"con 0 · login local"}],"rows":[["Console 0","login local · exec-timeout 5 0"],["logging synchronous","On"],["Next console login","Needs a Step 3 account","warn"]]}
```

## Step 5: Configure the SSH server and VTY policy

Use the conventional RSA-key workflow. If your image rejects the complete key-generation command, inspect `crypto key generate rsa ?`; a supported alternative may prompt for the modulus after `crypto key generate rsa`. Enter `2048` at that prompt. Do not paste an interactive answer as a separate configuration command.

```ios R1
R1# configure terminal
R1(config)# ip domain-name lab.test
R1(config)# crypto key generate rsa general-keys modulus 2048
R1(config)# ip ssh version 2
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# exec-timeout 5 0
R1(config-line)# end
R1# show ip ssh
```

If Step 2 showed VTY 5–15, apply the same policy to that range as well. Run this additional block only when those lines exist:

```ios R1
R1# configure terminal
R1(config)# line vty 5 15
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# exec-timeout 5 0
R1(config-line)# end
```

:::expected
`show ip ssh` reports the server enabled for version 2.0. Inspect the VTY sections and confirm local authentication and SSH transport on every range. If the simulator lacks SSH support for the chosen device/image, use a supported router/image; reading an output example does not count as a successful login test.
:::

```state
{"status":"SSH server ready","focus":["R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"}],"rows":[["Domain · RSA keys","lab.test · 2048 bits"],["show ip ssh","Enabled · version 2.0","ok"],["Every VTY range","login local · transport input ssh"],["VTY exec-timeout","5 minutes"]]}
```

## Step 6: Test both users from a new session

On ADMIN, enter:

```text
ssh -l trainee 10.8.0.1
```

Enter `TraineeLabSecret8` when prompted. Inside that remote session:

```ios R1
R1> show privilege
R1> enable
```

Enter `EnableLabSecret8` at the password prompt, then:

```ios R1
R1# show privilege
R1# exit
```

Open a new SSH session as `admin` using `AdminLabSecret8`, then check it:

```text
ssh -l admin 10.8.0.1
```

```ios R1
R1# show privilege
R1# show users
R1# exit
```

Finally try `telnet 10.8.0.1` from ADMIN.

:::expected
`trainee` initially reports privilege 1 and reaches 15 after the enable secret is accepted. `admin` begins at privilege 15. Telnet must not open an authenticated terminal session. Exact rejection wording varies; the result and the VTY configuration matter. If your simulator does not expose `show privilege`, record the prompts and check the username privilege in the configuration.
:::

```state
{"status":"Both users verified","tone":"ok","focus":["P","R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"}],"flows":[{"path":["P","S","R"],"back":true,"label":"ssh -l trainee 10.8.0.1","tags":{"R":"trainee · level 1, enable → 15"}},{"path":["P","S","R"],"back":true,"label":"ssh -l admin 10.8.0.1","tags":{"R":"admin · privilege 15 at login"}},{"path":["P","S","R"],"label":"telnet 10.8.0.1","stop":"R","stopText":"No Telnet session · SSH-only VTY"}],"rows":[["trainee","Level 1, then 15 after enable","ok"],["admin","Level 15 at login","ok"],["Telnet","No terminal session","ok"]]}
```

## Step 7: Complete a changed line requirement

The administrator now requires a **three-minute remote EXEC idle timeout**, while the console must remain at five minutes. Keep SSH-only transport and local-user authentication. This is a partially guided task: write the necessary configuration context and timeout command before reading the reference below, then apply it through the console to every existing VTY range.

Inspect the resulting console and VTY sections. Verify a fresh administrator login; you need not wait three minutes to document the configured timeout, and a successful login alone is not a measurement of timer expiry.

:::expected
The timeout is a property of the selected terminal lines. Configure VTY 0–4 as follows, and repeat for VTY 5–15 only if those lines were found earlier:

```ios R1
R1# configure terminal
R1(config)# line vty 0 4
R1(config-line)# exec-timeout 3 0
R1(config-line)# end
R1# show running-config | section line
```

The VTY ranges show `exec-timeout 3 0`, while the console still shows `exec-timeout 5 0`. If the filter is unavailable, inspect the full configuration. Do not change `login local`, the username entries or `transport input ssh` to satisfy a timeout requirement.
:::

```state
{"status":"VTY timeout 3 minutes","tone":"ok","focus":["R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"}],"flows":[{"event":["R"],"wait":1.6,"tags":{"R":"VTY exec-timeout 3 0"}},{"path":["P","S","R"],"back":true,"label":"Fresh admin login","tags":{"R":"Fresh admin login succeeds"}}],"rows":[["Every VTY range","exec-timeout 3 0","ok"],["Console","exec-timeout 5 0","ok"],["Unchanged","login local · transport input ssh"],["Fresh login","Not a timer measurement","dim"]]}
```

## Step 8: Introduce a remote-transport fault

Confirm that ADMIN has exited its SSH session. On the still-open console, replace the incoming transport with `none` on every VTY range you configured. Do not save this fault.

```ios R1
R1# configure terminal
R1(config)# line vty 0 4
R1(config-line)# transport input none
R1(config-line)# end
```

If VTY 5–15 exists, apply `transport input none` to that range too. From ADMIN, run the ping and SSH tests again.

```text
ping 10.8.0.1
ssh -l admin 10.8.0.1
```

:::expected
The IP interface remains operational and ping should still succeed. A new SSH terminal session is refused because the VTY lines accept no incoming transport. On the console, `show ip ssh` can still report an enabled SSH server. This combination demonstrates why server status, IP reachability and line policy must be checked separately.
:::

```state
{"status":"SSH refused","tone":"bad","focus":["R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok","until":0},{"node":"R","text":"SSH server on · VTY none","tone":"bad","from":0}],"flows":[{"event":["R"],"wait":1.6,"tags":{"R":"VTY transport input none"}},{"path":["P","S","R"],"back":true,"label":"ping 10.8.0.1","tags":{"R":"IP interface still up"}},{"path":["P","S","R"],"label":"ssh -l admin 10.8.0.1","stop":"R","stopText":"Refused · transport input none"}],"rows":[["Ping 10.8.0.1","Still succeeds","ok"],["New SSH session","Refused","bad"],["show ip ssh","Can still report enabled"],["Every VTY range","transport input none","bad"]]}
```

## Step 9: Restore the intended transport

Use the console to restore SSH on every VTY range. Keep the fault and recovery as separate observations in your notes.

```ios R1
R1# configure terminal
R1(config)# line vty 0 4
R1(config-line)# transport input ssh
R1(config-line)# end
```

Apply the same recovery to VTY 5–15 if present. Open a new SSH session from ADMIN as `admin`.

:::expected
The new login succeeds with privilege 15. Telnet remains disallowed. If SSH still fails, compare all VTY ranges, user entries and the SSH server state before changing the interface address or regenerating keys.
:::

```state
{"status":"SSH restored","tone":"ok","focus":["R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"SSH server on · VTY none","tone":"bad","until":0},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok","from":0}],"flows":[{"event":["R"],"wait":1.6,"tags":{"R":"VTY transport input ssh"}},{"path":["P","S","R"],"back":true,"label":"New SSH session as admin","tags":{"R":"admin · privilege 15"}}],"rows":[["Every VTY range","transport input ssh","ok"],["New admin login","Privilege 15","ok"],["Telnet","Still disallowed"]]}
```

## Step 10: Verify the complete access policy

From the console, inspect the active sessions while ADMIN's SSH session is open.

```ios R1
R1# show users
R1# show ssh
R1# show ip ssh
R1# show running-config | section line vty
```

Record the user, line and any displayed client address. Keep ADMIN's proven SSH session open while you test a fresh console login. At the console, enter `exit` from privileged EXEC (`R1# exit`), then press Enter to start a new session and sign in as `admin` with `AdminLabSecret8` so the next step begins at `R1#`. Closing and reopening the terminal window alone may leave the existing console session active. Both an open console window and an open SSH window can still reach their configured idle timeouts; log back in if either session ends before testing. After both paths have been verified, log out of the SSH session on ADMIN.

:::expected
The commands provide different evidence: terminal users, SSH sessions, SSH server state, and line configuration. The console login accepts a valid local account. A successful test on one VTY does not replace reviewing the other VTY ranges. On images with limited filters/session commands, inspect the full configuration and record the limitation instead of inventing missing output.
:::

```state
{"status":"Both paths verified","tone":"ok","focus":["L","P","R"],"chips":[{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"}],"flows":[{"path":["P","S","R"],"back":true,"label":"ADMIN's open SSH session","tags":{"R":"admin on a VTY line"}},{"path":["L","R"],"back":true,"with":true,"tone":"alt","label":"Fresh console login","tags":{"R":"login local · admin accepted"}}],"rows":[["show users","User, line, any client address"],["show ssh · show ip ssh","Sessions · server state"],["Console login","admin accepted","ok"],["VTY review","Every range, not just one"]]}
```

## Step 11: Save the verified configuration

Save only after the fault has been removed and both access paths work.

```ios R1
R1# copy running-config startup-config
```

Press Enter at the destination filename prompt and wait for the command to finish. Once `R1#` returns, inspect the saved configuration:

```ios R1
R1# show startup-config
```

Save the Packet Tracer project as `08-secure-device-access.pkt`.

:::expected
The saved configuration includes the intended username, interface, SSH and line settings. It must not contain `transport input none` on the VTY lines. The device save and project save are both complete. A reload is unnecessary for this exercise; if you later test one, retain the verified credentials and console path.
:::


Before checking this lab complete, submit a short acceptance record:

| Requirement | Evidence |
|---|---|
| Local recovery | New console login while another proven path remains available |
| Different user privileges | New trainee and admin sessions with their actual privilege levels |
| SSH-only admission | Fresh SSH success and fresh Telnet rejection |
| Complete line policy | Every available VTY range; console five minutes, VTY three minutes |
| Fault reasoning | Ping/server/line evidence, narrow correction and new-session retest |
| Persistence | Desired users and repaired line settings in startup-config |

The deliberately introduced fault is guided practice. Attempt the independent fresh build below before reading its answer key; record help used and corrected reasoning.

```state
{"status":"Configuration saved","tone":"ok","focus":["R"],"chips":[{"node":"L","text":"Terminal open"},{"node":"R","text":"Saved · startup-config","tone":"ok"}],"rows":[["startup-config","Users, interface, SSH, lines","ok"],["VTY lines","No transport input none","ok"],["Project","08-secure-device-access.pkt"]]}
```

## Troubleshooting

- **No console prompt:** check the serial connection and terminal settings; the Ethernet IP address is not the first check.
- **Repeated ping failure:** check host addressing, cable endpoints and R1 Gi0/0 before changing user accounts.
- **SSH server disabled:** check support, RSA-key configuration and SSH settings.
- **Server enabled but session refused:** inspect every VTY range and its accepted transports; a reachable server can still reject terminal access.
- **Password rejected:** check exact username, secret and line authentication method. Do not assume an enable secret is the login password.
- **Unexpected privilege:** inspect the user entry and `show privilege`; an authenticated level-1 session is different from a failed login.
- **Change disappears after restart:** inspect the saved configuration and boot state rather than assuming the earlier save succeeded.

## Challenge

Build a **fresh** project using the same device models, cable types and physical ports from the topology. Name the router **R2**. Use router `10.8.1.1/24` and ADMIN `10.8.1.10/24`, gateway `10.8.1.1`; no DNS is needed. Keep the console laptop as a separate recovery path.

Produce a configuration from these requirements before looking at the answer:

- Local user `operator` starts at privilege 15; user `reviewer` starts at privilege 1.
- Use isolated-lab secrets `OperatorLab8`, `ReviewerLab8` and enable secret `EnableChallenge8`.
- The console uses local authentication and a five-minute EXEC idle timeout.
- All actual VTY lines use local authentication, SSH only and a three-minute idle timeout.
- Use the conventional RSA workflow with domain `challenge.test`, supported 2048-bit keys and SSHv2.
- Verify a new login for each account, a new console login, Telnet rejection, and the saved policy.

Write a six-row acceptance table with predicted and actual results. If you consult the reference, record which part needed help and repeat that part later with changed values.

:::solution
The new switch can use its default access VLAN; the host/router share one subnet. Configure through the console, creating users before making lines depend on them:

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# enable secret EnableChallenge8
R2(config)# username operator privilege 15 secret OperatorLab8
R2(config)# username reviewer secret ReviewerLab8
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.8.1.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# line console 0
R2(config-line)# login local
R2(config-line)# exec-timeout 5 0
R2(config-line)# exit
R2(config)# ip domain-name challenge.test
R2(config)# crypto key generate rsa general-keys modulus 2048
R2(config)# ip ssh version 2
R2(config)# line vty 0 4
R2(config-line)# login local
R2(config-line)# transport input ssh
R2(config-line)# exec-timeout 3 0
R2(config-line)# end
R2# show line
R2# show ip ssh
R2# show running-config
```

Use the Step 5 key-generation fallback if required by the image. If VTY 5–15 exists, configure it as well:

```ios R2
R2# configure terminal
R2(config)# line vty 5 15
R2(config-line)# login local
R2(config-line)# transport input ssh
R2(config-line)# exec-timeout 3 0
R2(config-line)# end
```

From ADMIN, test `ssh -l operator 10.8.1.1` and `ssh -l reviewer 10.8.1.1` in separate sessions. Verify privilege 15 and 1 respectively with `show privilege` where supported; the reviewer test must be before using `enable`. Test `telnet 10.8.1.1` and confirm that a terminal login is not admitted. While a proven SSH recovery session remains available, log out at the console prompt and verify a new local-user console login.

Inspect the line timeouts and all VTY ranges. Save with `copy running-config startup-config`, accept the filename prompt, and inspect `show startup-config`. The acceptance record should show operator privilege 15, reviewer privilege 1, fresh console authentication, SSH admission/Telnet rejection, correct console/VTY timeouts, and the saved intended policy. Record unsupported checks as limitations rather than invented output. Save this project separately from R1's guided baseline.
:::
