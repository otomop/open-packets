---
title: Evaluate security controls and observe an optional login block
environment: mixed
devices: ["Required: paper policy worksheet", "Optional: 1 × 2911 router (R1)", "Optional: 1 × 2960 switch (SW1)", "Optional: 2 × PC-PT (Admin-PC, Test-PC)"]
minutes: 35
---
Evaluate risks, authentication choices, and security-program actions in a required 35-minute paper exercise. An optional device extension takes about 45 additional minutes and demonstrates one remote-login control using a complete supplied setup. It is not a second SSH configuration exam. No Packet Tracer, CML, or hardware execution is claimed; use the paper evidence when the chosen image lacks the feature.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

For each decision, write the asset at risk, the evidence, a suitable control, how you would verify it, and what the control would not prove. Complete your answer before opening each solution. Public example passwords in the optional exercise belong only in this disposable lab.

## Topology

The following topology is needed only for the optional device extension, Steps 4–9. The required paper exercise needs no simulator.

```diagram
{"type":"topology","title":"Management LAN with a separate console path","caption":"Keep the console available while testing remote access; both PCs are controlled lab clients.","nodes":[{"id":"A","kind":"pc","label":"Admin-PC","sub":"10.0.0.10/24","x":1,"y":1},{"id":"T","kind":"pc","label":"Test-PC","sub":"10.0.0.66/24","x":1,"y":5},{"id":"S","kind":"switch","label":"SW1","x":5,"y":3},{"id":"R","kind":"router","label":"R1","sub":"10.0.0.1/24","x":10,"y":3}],"links":[{"from":"A","to":"S","toLabel":"Fa0/1"},{"from":"T","to":"S","toLabel":"Fa0/2"},{"from":"S","to":"R","fromLabel":"Fa0/24","toLabel":"Gi0/0"},{"from":"A","to":"R","label":"RS-232 to Console","style":"dashed"}]}
```

| Device/interface | IPv4 settings | Cable/port |
|---|---|---|
| R1 Gi0/0 | 10.0.0.1 / 255.255.255.0 | Straight-through to SW1 Fa0/24 |
| Admin-PC FastEthernet0 | 10.0.0.10 / 255.255.255.0; gateway .1 | Straight-through to SW1 Fa0/1 |
| Test-PC FastEthernet0 | 10.0.0.66 / 255.255.255.0; gateway .1 | Straight-through to SW1 Fa0/2 |
| Admin-PC RS-232 | Terminal defaults: 9600 baud, 8 data bits, no parity, 1 stop bit, no flow control | Console cable to R1 Console |

No DNS service, Internet connection, or AAA server is required. All Ethernet ports use VLAN 1. Both PCs and all login attempts belong to this isolated exercise.

## Step 1: Prioritize a documented exposure

A branch uses a router to reach its payroll service. The current configuration backup is readable by every employee. It contains a reversible type-7 management password that is still accepted. An unsuccessful login was logged from an unexpected address yesterday; its source has not been attributed. The backup is also needed for legitimate recovery.

Write four findings: the asset and security property at risk; the confirmed weakness; an appropriate immediate response; and a claim the login record does not support. Do not treat deletion of all backups as the only way to protect them. Explain why setting a new storage type without changing the exposed credential would be incomplete.

:::solution
The configuration and management credential require confidentiality, while continued legitimate recovery supports availability. Broad access to the backup and the still-valid reversible credential are confirmed exposures. Restrict backup access, preserve relevant evidence, replace the affected credential through an approved change, and verify legitimate access and recovery. Secure the retained backups as well as future copies.

The unsuccessful login does not identify a person or establish that this backup was used. Re-encoding or hashing the same exposed password does not make that password unknown again. Keep the confirmed exposure separate from the unproven explanation of the login.
:::

```state
{"status":"Paper: exposure findings","cabled":false,"addressed":false,"rows":[["Configuration backup","Readable by every employee"],["Stored password","Type 7 · still accepted"],["Failed login","Unexpected source · not attributed"],["Backup also needed for","Legitimate recovery"]]}
```

## Step 2: Review a password and authentication policy

The proposed policy for a password-only administration portal is: “Use one shared administrator account, at least eight characters with three character classes, and change the password every 60 days. Anyone who forgets it can ask a colleague for the current value.” The portal can support named accounts, common/compromised-password screening, managed recovery, and an additional possession factor.

Write a replacement policy summary using the lesson's current NIST guidance. Separate password selection, accountability, recovery, and multifactor authentication. Identify one requirement that a router minimum-length command alone cannot implement. Then explain why a password plus a second secret question remains the same factor category.

:::solution
Use named accounts and unique secrets with managed recovery. For the stated password-only use under NIST SP 800-63B-4, require at least 15 characters and screen proposed values against an appropriate blocklist. Do not impose mandatory composition rules or routine expiry in the absence of evidence of compromise; require a change when compromise is indicated. An additional possession factor can make the authentication multifactor, depending on its implementation.

A length command does not implement screening, account lifecycle, secure recovery, or the whole MFA process. Passwords and secret-question answers are both knowledge factors. A longer shared password still fails to provide individual accountability, and colleagues should not distribute the active credential as a recovery process.
:::

```state
{"status":"Paper: policy review","cabled":false,"addressed":false,"rows":[["Proposed","Shared admin · 8+ chars · 3 classes"],["Change and recovery","Every 60 days · ask a colleague"],["Portal supports","Named accounts · managed recovery"],["Also available","Screening · possession factor"]]}
```

## Step 3: Choose program actions and interpret a login control

Design three different actions for the branch: a brief reporting reminder for all staff, practice for help-desk staff who recover accounts, and protection of unattended console access. For each, specify one observable sign that it was implemented. A reminder being sent is evidence of delivery, not proof that every recipient can perform the recovery procedure.

Next, read the representative device evidence below. Predict whether a new SSH attempt with the correct password should succeed during the displayed state, whether the already tested console remains available, and what to verify after the remaining interval expires. The output is supplied for reasoning; it is not a recorded simulator run.

```output Representative IOS login state
Configured remote-login block: 120 seconds
Failure threshold: 3 attempts within 60 seconds
Current state: Quiet-Mode
Remaining quiet interval: 87 seconds
Quiet-mode access exception: none
Console local authentication: configured and previously verified
```

:::solution
A reporting reminder develops awareness; role-specific recovery practice develops the ability to perform the task; restricted physical access protects the console. Suitable evidence includes delivery records, a supervised recovery exercise, and an inspected access-control process. Each check has limits, and attendance alone does not prove practical competence.

On the documented IOS feature, the displayed quiet state restricts new remote logins even when the password is correct. Console access remains available. After expiry, inspect `show login` and test a fresh valid SSH session. Do not change a known-correct password to repair a temporary remote-login block. This output establishes a device state, not the identity or intent of whoever generated the failed attempts.
:::

At this point the required guided exercise is complete. Keep your findings and attempt the independent Challenge below. Steps 4–9 are optional device observation; leave their checkmarks incomplete if you did not execute them, and label any substituted worksheet results as predictions.

```state
{"status":"Paper: quiet-mode evidence","cabled":false,"addressed":false,"rows":[["Configured block","120 s · 3 fails within 60 s"],["Current state","Quiet-Mode · 87 s remain","warn"],["Quiet-mode exception","None"],["Console login","Local · previously verified"]]}
```

## Step 4: Optional — prepare the supplied management LAN

Use fresh devices and the table's exact cables. Set the two PCs under Desktop → IP Configuration. Open Admin-PC → Desktop → Terminal for R1; decline the initial configuration dialog if offered.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.0.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface range fastethernet0/1 - 2, fastethernet0/24
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 1
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
```

If this image rejects the combined interface range, apply the same three interface commands separately to Fa0/1, Fa0/2, and Fa0/24. Wait for forwarding, then ping 10.0.0.1 from both PCs.

:::expected
R1 Gi0/0 is up/up at .1/24 and both PC pings work. A successful ping tests addressing and ICMP reachability; it does not yet prove that remote management is configured.
:::

```state
{"status":"LAN up · pings work","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["S","R"],"flows":[{"path":["A","S","R"],"back":true,"label":"Admin-PC pings 10.0.0.1","tags":{"S":"VLAN 1 · Fa0/1 → Fa0/24","R":"Gi0/0 10.0.0.1 · up/up"}},{"path":["T","S","R"],"back":true,"label":"Test-PC pings 10.0.0.1"}],"chips":[{"node":"A","text":"Console to R1 open"},{"node":"R","text":"R1#"},{"node":"S","text":"SW1#"}],"rows":[["R1 Gi0/0","10.0.0.1/24 · up/up","ok"],["SW1 Fa0/1, Fa0/2, Fa0/24","Access · VLAN 1"],["Pings to 10.0.0.1","Both PCs reply","ok"],["Remote management","Not proven by a ping","dim"]]}
```

## Step 5: Optional — establish and test local management access

The commands below are supplied preparation. Predict what a successful ping, a successful fresh SSH login, and a successful fresh console login each demonstrate before running them.

Keep the console open. Configure length, local secrets, and SSH. If `security passwords min-length 15` is unsupported, record the missing enforcement and continue with the supplied longer lab secrets. This fallback does not claim enforcement. Use the basic `secret` form for simulator compatibility; inspect the actual resulting storage type and record if the image provides only a legacy hash.

```ios R1
R1# configure terminal
R1(config)# security passwords min-length 15
R1(config)# enable secret Lab-Enable-Only-2026!
R1(config)# username admin privilege 15 secret Lab-Admin-Only-2026!
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

If the RSA one-line form is rejected, enter `crypto key generate rsa` from global configuration and supply 2048 at the modulus prompt. Inspect the full running configuration. If a `line vty 5 15` block exists, apply its controls too:

```ios R1
R1# configure terminal
R1(config)# line vty 5 15
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# exec-timeout 5 0
R1(config-line)# end
```

Use this second block only when those lines exist on the selected image. Do not create a different range based on guesswork.

:::expected
A named privilege-15 account and enable secret exist, SSH version 2 is enabled, and every available VTY uses local login, SSH-only transport, and the five-minute timeout. The shown console timeout is ten minutes so you can complete the exercise without accidentally leaving an unattended session indefinitely. Record any unsupported feature instead of treating it as configured.
:::

From Admin-PC Command Prompt:

```text
ssh -l admin 10.0.0.1
```

Enter `Lab-Admin-Only-2026!`. Verify the privilege with `show privilege`. Keep this tested SSH session open while you exit and reopen the console Terminal, authenticate as admin, and return to privileged EXEC. Then close the SSH session with `exit`; the console remains your control path.

On the console inspect `show running-config`, without posting the full secrets elsewhere. Interpret this separate paper excerpt:

```output Representative storage labels, values deliberately omitted
username olduser password 7 [omitted]  ← reversible credential exposure
username neweruser secret 9 [omitted]  ← scrypt verifier; still sensitive
```

The bracketed omissions are not valid configurations to paste. Try Telnet from a PC only as a transport check using `telnet 10.0.0.1`; do not supply a credential if any unexpected Telnet prompt appears. Inspect all VTY ranges if Telnet remains available.

:::expected
A fresh SSH login succeeds and reports privilege 15. Console reauthentication also works. Telnet is unavailable through the configured VTY transport. The paper type-7 entry is reversible; type 9 is a slow verifier but still warrants backup access control and a strong secret. Your simulator's actual type is recorded rather than assumed.
:::

```state
{"status":"SSH and console verified","tone":"ok","focus":["A","R"],"flows":[{"path":["A","S","R"],"back":true,"label":"ssh -l admin 10.0.0.1","tags":{"R":"SSHv2 · admin · privilege 15"}},{"path":["A","R"],"back":true,"label":"Fresh console login as admin","tags":{"R":"Console login local · admin"}},{"path":["A","S","R"],"label":"telnet 10.0.0.1","stop":"R","stopText":"No Telnet · transport input ssh"}],"chips":[{"node":"A","text":"Console to R1 open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"}],"rows":[["Fresh SSH as admin","Privilege 15","ok"],["Console re-login","admin accepted","ok"],["Telnet","Unavailable · VTY ssh only","ok"],["Timeouts","VTY 5 min · console 10 min"]]}
```

## Step 6: Optional — configure remote-login observation

Enable the documented IOS login block and logging features from the console. If `login block-for` or `show login` is absent, perform Steps 6–8 as a paper state exercise using the stated configuration and outcomes; do not repeatedly attempt to trigger an unsupported feature. If only login event logging is absent, use `show login` plus the controlled session results and record the logging limitation.

```ios R1
R1# configure terminal
R1(config)# login block-for 120 attempts 3 within 60
R1(config)# login on-failure log
R1(config)# login on-success log
R1(config)# logging buffered 16384 informational
R1(config)# banner motd #Authorized lab access only. Activity may be logged.#
R1(config)# end
R1# show login
```

Before testing, predict the effect on a new valid remote login and on console access. Record the configured threshold, watch window, block interval, and whether a quiet-mode exception is shown. Save the working state to a separate project file `security-before-test.pkt` before inducing failures.

:::expected
On a supporting image, login monitoring is enabled with the intended values and starts in normal mode. The banner communicates policy but does not enforce authentication. Existing console access remains available during the later remote block on the documented IOS feature.
:::

```state
{"status":"Login block on · normal","tone":"ok","focus":["R"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"Block 120 s after 3 fails in 60 s"}}],"chips":[{"node":"A","text":"Console to R1 open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"},{"node":"R","text":"Normal mode","tone":"ok","from":0}],"rows":[["Login block","120 s · 3 fails within 60 s"],["show login","Normal mode","ok"],["Quiet-mode exception","None configured"],["Saved first","security-before-test.pkt"]]}
```

## Step 7: Optional — observe the bounded login block

From Test-PC, make a small bounded set of new SSH attempts to `admin` using an intentionally wrong lab password. Use at most four failed attempts within the 60-second window and inspect `show login` on the console after each. Stop as soon as Quiet-Mode appears. If the image does not reproduce the documented behavior, stop testing and record its output; use the paper expectation rather than launching a guessing loop.

While Quiet-Mode is displayed, try one fresh SSH login from Admin-PC with the correct password. Keep using the established console to collect `show login` and `show logging`. Do not claim a precise message sequence if the simulator prints different text.

:::expected
With no quiet-mode exception, documented IOS restricts new remote Telnet/SSH logins during the quiet interval, including the correct Admin-PC attempt. The existing console is usable. This demonstrates a remote block, not a per-user lockout, and not permanent failure of the password. A paper result can state “87 seconds remain,” but no actual remaining value is guaranteed.
:::

```state
{"status":"Quiet-Mode · remote blocked","tone":"warn","focus":["T","R"],"flows":[{"path":["T","S","R"],"label":"Bounded SSH attempts · wrong password","stop":"R","stopText":"Wrong password · each login fails"},{"event":["R"],"tags":{"R":"Threshold reached → Quiet-Mode"}},{"path":["A","S","R"],"label":"SSH as admin · correct password","stop":"R","stopText":"Quiet-Mode · new remote login blocked"},{"path":["A","R"],"back":true,"label":"show login on the console","backTags":{"A":"Console still usable"}}],"chips":[{"node":"A","text":"Console to R1 open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"},{"node":"R","text":"Normal mode","tone":"ok","until":1},{"node":"R","text":"Quiet-Mode · no exception","tone":"warn","from":1}],"rows":[["Test-PC failures","Stop once Quiet-Mode appears"],["Admin-PC, right password","New SSH blocked","warn"],["Console","Still usable","ok"],["Effect","Remote block, not per-user lockout"]]}
```

## Step 8: Optional — recover and verify separately

Allow the remaining block interval shown by `show login` to expire while retaining console access. Then run `show login` again and open a fresh successful Admin-PC SSH session. If an unexpectedly persistent experimental block requires rollback, use the console to remove the experimental policy:

```ios R1
R1# configure terminal
R1(config)# no login block-for
R1(config)# end
R1# show login
```

Reapply the Step 6 `login block-for 120 attempts 3 within 60` command only after normal access is verified and the selected image supports the exercise. Do not change an otherwise correct password to repair quiet mode.

:::expected
Normal mode permits the valid SSH login again. Your notes distinguish waiting for the defined interval from removal of the experimental feature. No wrong credential was promoted to a valid one. Record whether the final configuration retains the supported block or uses the documented paper fallback.
:::

```state
{"status":"Normal mode · SSH works","tone":"ok","focus":["A","R"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"Interval expires · normal mode"}},{"path":["A","S","R"],"back":true,"label":"Fresh SSH as admin","tags":{"R":"Normal mode · valid login accepted"}}],"chips":[{"node":"A","text":"Console to R1 open"},{"node":"R","text":"SSHv2 · VTY ssh only","tone":"ok"},{"node":"R","text":"Normal mode","tone":"ok","from":0},{"node":"R","text":"Quiet-Mode · no exception","tone":"warn","until":0}],"rows":[["show login","Normal mode","ok"],["Fresh Admin-PC SSH","Succeeds","ok"],["Password","Unchanged"],["Rollback","no login block-for · only if stuck","dim"]]}
```

## Step 9: Optional — record the final device state

Inspect all VTY ranges, actual secret types, SSH status, and login state. Verify a new admin session, then close unused remote sessions. On R1 and SW1 separately, save from privileged EXEC with `copy running-config startup-config`. Complete each `Destination filename [startup-config]?` prompt with Enter before moving to the next device, then save the project as `security-controls-complete.pkt`.

Add to the required worksheet two gaps this exercise does not implement, such as enterprise MFA, breached-password screening, protected centralized backup storage, or central command accounting. Assign each a suitable control or later chapter rather than declaring the router “fully secure.”

:::expected
The configuration matches the intended local lab design and no induced lockout remains. SSH and console have been tested with fresh sessions. The report distinguishes implemented controls from policy goals and simulator limits; no broad security guarantee is made.
:::

### Evidence to keep

- Your exposure assessment distinguishes confirmed facts, possible consequences, and unsupported attribution.
- Your policy review addresses named access, password selection, recovery, and authentication factors without claiming that one IOS command implements them all.
- Your program plan connects awareness, practice, and physical control to observable evidence.
- If you executed the optional extension, retain before/during/after login state, one fresh successful SSH result after recovery, a verified console result, and any unsupported features. Keep credentials out of shared evidence.

```state
{"status":"Final state saved","tone":"ok","focus":["R","S"],"chips":[{"node":"A","text":"Console to R1 open"},{"node":"R","text":"Saved · startup-config","tone":"ok"},{"node":"S","text":"Saved · startup-config","tone":"ok"}],"rows":[["R1 and SW1","copy running-config startup-config","ok"],["Login state","No induced block remains","ok"],["Fresh sessions","SSH and console tested","ok"],["Project","security-controls-complete.pkt"]]}
```

## Troubleshooting

- A broad proposal such as “make it secure” is not a control: name the asset, action, verification, and limitation.
- Do not infer credential theft or attacker identity from an unexplained login source. Preserve the observation and investigate attribution separately.
- In the optional lab, an SSH failure before a password prompt requires reachability, SSH status, keys, and VTY transport checks before an authentication diagnosis.
- A previously open console session does not prove future console authentication. Retest it while another verified access path remains open.
- If `login block-for` or `show login` is unsupported, stop the induced attempts and use Step 3's representative evidence. Do not invent an observed quiet interval.

## Challenge

A different branch has named administrators with unique passwords and a second-factor authenticator. Its approved help-desk procedure never asks a user to reveal a password or one-time code. An employee receives a call from someone who knows their supervisor's name and requests the current one-time code to “complete a security update.” Meanwhile, a former employee's administrator account remains enabled, and the only recent configuration backup is stored on a routinely lost, unencrypted USB drive. The branch needs both reliable recovery and restricted access.

Write a short response plan that covers the suspicious request, the stale account, and the backup. For each, state one immediate action, one follow-up check, and one limit on what the evidence proves. Choose a relevant awareness or training action without replacing technical access controls with a reminder. This is an independent policy exercise; no devices or attack simulation are needed.

:::solution
Do not reveal the code. End the unverified contact and report or verify the request through the established help-desk channel obtained independently. Knowing a supervisor's name does not establish authorization, and the request conflicts with the approved procedure. A report supports investigation; the call alone does not identify the caller.

Disable the departed user's account through the approved process and review remaining sessions and access assignments. Confirm that fresh access with that account is denied and that legitimate administrators still have access. Account disablement limits future use; it does not establish whether the account was previously abused.

Protect and relocate the usable backup to approved access-controlled, protected storage, assess whether credentials or other sensitive data were exposed, and replace affected secrets where required. Verify that authorized staff can restore a suitable configuration and that unauthorized readers cannot retrieve it. Do not solve the confidentiality problem by destroying the only recovery copy before a protected replacement is verified.

Use an awareness reminder for recognizing and reporting code requests, and role-specific practice for help-desk recovery and administrator offboarding. These support, rather than replace, the account and backup controls. MFA is valuable but does not make a disclosed live code harmless.
:::
