---
title: Discover neighbors and correct a link inventory
environment: packet-tracer
devices: ["2 × Catalyst 2960 switches (SW1, SW2)", "1 × Cisco 2911 router (R1)", "1 × PC-PT (PC-A)"]
minutes: 45
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build one small management LAN, collect neighbor evidence from both switches, and correct a deliberately inaccurate connection record. Then create one-way LLDP visibility and restore it without changing IP addressing.

This procedure was checked against the address plan and Cisco documentation, but was not executed in Packet Tracer during this review. Output is representative. Some Packet Tracer images omit LLDP or individual show commands. Complete CDP on the specified models; if LLDP is unavailable, use the clearly identified paper observations in Steps 6–9 or a supporting Catalyst image in CML/hardware. Do not treat a missing simulator command as a cabling fault.

## Topology

```diagram
{ "type":"topology", "title":"Discovery across three network devices", "caption":"Record local and remote ports separately; all links use the default VLAN 1 for this isolated exercise.", "nodes":[{"id":"P","kind":"pc","label":"PC-A","sub":"192.168.12.100/24","x":1,"y":3},{"id":"S1","kind":"switch","label":"SW1","x":4,"y":3},{"id":"S2","kind":"switch","label":"SW2","x":8,"y":1},{"id":"R","kind":"router","label":"R1","x":8,"y":5}], "links":[{"from":"P","to":"S1","fromLabel":"Fa0","toLabel":"Fa0/1"},{"from":"S1","to":"S2","fromLabel":"Gi0/1","toLabel":"Gi0/2"},{"from":"S1","to":"R","fromLabel":"Gi0/2","toLabel":"Gi0/0"}] }
```

| Connection | Cable |
|---|---|
| PC-A Fa0 → SW1 Fa0/1 | Copper straight-through |
| SW1 Gi0/1 → SW2 Gi0/2 | Copper crossover, or automatic selection with ports verified |
| SW1 Gi0/2 → R1 Gi0/0 | Copper straight-through |

| Device/interface | Address/mask | Gateway |
|---|---|---|
| SW1 VLAN 1 | 192.168.12.11 / 255.255.255.0 | 192.168.12.1 |
| SW2 VLAN 1 | 192.168.12.12 / 255.255.255.0 | 192.168.12.1 |
| R1 Gi0/0 | 192.168.12.1 / 255.255.255.0 | None required for this connected LAN |
| PC-A Fa0 | 192.168.12.100 / 255.255.255.0 | 192.168.12.1 |

These management addresses support a separate IP test; discovery itself does not require them. The default VLAN is used only to keep this lab focused. Do not copy it as an organization's management-VLAN policy.

## Step 1: Build, name, and address the devices

Start a new project, select the exact models, and connect the listed ports. Decline initial configuration dialogs if shown. Type commands after the prompts.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# cdp run
SW1(config)# interface range gigabitethernet0/1 - 2
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 1
SW1(config-if-range)# cdp enable
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 1
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface vlan 1
SW1(config-if)# ip address 192.168.12.11 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# ip default-gateway 192.168.12.1
SW1(config)# end
```

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# cdp run
SW2(config)# interface gigabitethernet0/2
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 1
SW2(config-if)# cdp enable
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# interface vlan 1
SW2(config-if)# ip address 192.168.12.12 255.255.255.0
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# ip default-gateway 192.168.12.1
SW2(config)# end
```

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# cdp run
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 192.168.12.1 255.255.255.0
R1(config-if)# cdp enable
R1(config-if)# no shutdown
R1(config-if)# end
```

Set PC-A using **Desktop → IP Configuration → Static**, including the exact mask and gateway in the table.

:::expected
After the ports become operational, each switch SVI can become up/up because VLAN 1 has active forwarding members. R1 Gi0/0 is enabled. Check `show ip interface brief` on each network device and PC-A's `ipconfig` before continuing.
:::

```state
{"status":"Built · named · addressed","cabled":true,"addressed":true,"led":true,"focus":["S1","S2","R"],"chips":[{"node":"S1","text":"SW1#"},{"node":"S2","text":"SW2#"},{"node":"R","text":"R1#"}],"rows":[["SW1, SW2 VLAN 1","192.168.12.11, .12 · up/up"],["R1 Gi0/0","192.168.12.1 · enabled"],["PC-A","192.168.12.100 · gateway .1"],["CDP","cdp run · cdp enable on Gi ports"]]}
```

## Step 2: Read the CDP tables from both ends

Before collecting output, draw the expected rows for each network device using the cable table. Do not expect PC-A to advertise. Run the following on SW1, then run the same three show commands on SW2 and R1 at their privileged prompts.

```ios SW1
SW1# show cdp
SW1# show cdp interface
SW1# show cdp neighbors
```

:::expected
Allow periodic advertisements to arrive. SW1 should identify SW2 on its Gi0/1, remote Gi0/2, and R1 on its Gi0/2, remote Gi0/0. SW2 should identify SW1 on its Gi0/2, remote Gi0/1. R1 should identify SW1 on its Gi0/0, remote Gi0/2. PC-A is not expected to advertise CDP. If a row is absent, check both device-wide and interface CDP state before changing addresses.
:::

```state
{"status":"Neighbors from both ends","tone":"ok","focus":["S1","S2","R"],"flows":[{"path":["S2","S1"],"label":"SW2 CDP advertisement","tags":{"S1":"SW2 · local Gi0/1 · remote Gi0/2"}},{"path":["R","S1"],"label":"R1 CDP advertisement","tags":{"S1":"R1 · local Gi0/2 · remote Gi0/0"}},{"path":["S1",["S2","R"]],"label":"SW1 CDP advertisements","tags":{"S2":"SW1 · local Gi0/2 · remote Gi0/1","R":"SW1 · local Gi0/0 · remote Gi0/2"}}],"chips":[{"node":"P","text":"No CDP advertised"}],"rows":[["SW1 table","SW2 on Gi0/1 · R1 on Gi0/2","ok"],["SW2 table","SW1 on Gi0/2, remote Gi0/1","ok"],["R1 table","SW1 on Gi0/0, remote Gi0/2","ok"],["PC-A","Not expected to advertise","dim"]]}
```

## Step 3: Correct an inaccurate drawing

Treat this as the inherited record: **SW1 Gi0/1 → R1 Gi0/0**, and **SW1 Gi0/2 → SW2 Gi0/1**. Create a correction table with the old claim, your observation, the reverse observation, and the proposed connection. Keep the command's device name attached to each local interface.

:::solution Compare your correction table
Both records are wrong. The supported corrections are **SW1 Gi0/2 → R1 Gi0/0** and **SW1 Gi0/1 → SW2 Gi0/2**. Your table includes evidence from both ends, rather than merely copying the workspace drawing.
:::

```state
{"status":"Inherited record to check","focus":["S1"],"chips":[{"node":"S2","text":"Inherited: SW1 Gi0/2 → SW2 Gi0/1"},{"node":"R","text":"Inherited: SW1 Gi0/1 → R1 Gi0/0"}],"rows":[["Evidence","Neighbor tables from both ends"],["Correction table","Claim · observation · reverse · proposal"]]}
```

## Step 4: Separate advertised addresses from reachability

Before testing, state whether a fresh neighbor entry alone guarantees a successful management ping. Inspect detailed records, then test the management address independently.

```ios SW1
SW1# show cdp neighbors detail
SW1# ping 192.168.12.12
```

From PC-A, ping `192.168.12.11`, `.12`, and `.1` using the full addresses. Record whether the detailed record advertises the address you configured; optional fields and address selection may vary.

:::expected
With the given address plan and operational VLAN, repeated pings should receive replies. That is additional IP evidence. Discovery could still work if you introduced a management-address error, so the neighbor table is not the reason the ping succeeds.
:::

```state
{"status":"Management pings succeed","tone":"ok","focus":["S1","P"],"flows":[{"path":["S1","S2"],"back":true,"label":"SW1 pings 192.168.12.12"},{"path":["P","S1"],"back":true,"label":"PC-A pings 192.168.12.11"},{"path":["P","S1","S2"],"back":true,"label":"PC-A pings 192.168.12.12"},{"path":["P","S1","R"],"back":true,"label":"PC-A pings 192.168.12.1"}],"rows":[["SW1 → 192.168.12.12","Replies","ok"],["PC-A → .11, .12, .1","Replies","ok"],["Why they work","Address plan and VLAN, not CDP"]]}
```

## Step 5: Inspect the configured timers and cached lifetime

```ios SW1
SW1# show cdp
SW1# show cdp neighbors
```

Repeat the neighbor view after a short interval and record changes. Also inspect `show cdp` on SW2 to identify the timer and holdtime SW2 advertises. Do not change timers merely to make the observed number match the lesson.

:::expected
The referenced defaults are 60-second advertisements and 180-second holdtime. Remaining holdtime commonly decreases and refreshes when an advertisement arrives. A displayed value is not an exact packet timestamp; the relevant lifetime comes from the neighbor. Clearing SW1's local CDP table, if used for an additional experiment, does not instantly force SW2 to advertise again.
:::

```state
{"status":"Holdtime refreshes","focus":["S1","S2"],"flows":[{"path":["S2","S1"],"label":"SW2 CDP advertisement","tags":{"S1":"Holdtime reset to SW2's value"}}],"rows":[["Referenced defaults","60 s timer · 180 s holdtime"],["Remaining holdtime","Falls, then refreshes on arrival"],["Lifetime set by","The neighbor, SW2"]]}
```

## Step 6: Enable LLDP explicitly and compare identities

Use these commands where supported. If `lldp run` is unavailable, read the subsequent observations as a paper exercise instead of entering guessed alternatives.

```ios SW1
SW1# configure terminal
SW1(config)# lldp run
SW1(config)# lldp timer 30
SW1(config)# lldp holdtime 120
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# lldp transmit
SW1(config-if)# lldp receive
SW1(config-if)# end
SW1# show lldp
SW1# show lldp neighbors detail
```

```ios SW2
SW2# configure terminal
SW2(config)# lldp run
SW2(config)# lldp timer 30
SW2(config)# lldp holdtime 120
SW2(config)# interface gigabitethernet0/2
SW2(config-if)# lldp transmit
SW2(config-if)# lldp receive
SW2(config-if)# end
SW2# show lldp
SW2# show lldp neighbors detail
```

:::expected
After advertisements arrive, each switch learns the other. A representative SW1 observation is **system name SW2, local Gi0/1, remote port Gi0/2, bridge capability B**. CDP may use capability S for the same switching function. LLDP IDs can differ in format; use the actual advertised IDs and descriptions. These stated observations are also the starting facts for the paper fallback.
:::

```state
{"status":"LLDP learned both ways","tone":"ok","focus":["S1","S2"],"flows":[{"path":["S2","S1"],"label":"SW2 LLDP advertisement","tags":{"S1":"LLDP: SW2 on Gi0/1 · remote Gi0/2"}},{"path":["S1","S2"],"label":"SW1 LLDP advertisement","tags":{"S2":"LLDP: SW1 learned on Gi0/2"}}],"chips":[{"node":"S1","text":"LLDP Gi0/1 tx · rx","tone":"ok"},{"node":"S2","text":"LLDP Gi0/2 tx · rx","tone":"ok"}],"rows":[["LLDP timer / holdtime","30 s / 120 s on both switches"],["SW1 sees","SW2, local Gi0/1, remote Gi0/2","ok"],["SW2 capability","B in LLDP · CDP may show S"]]}
```

## Step 7: Create one-way LLDP visibility

Write a two-row prediction first: whether SW1 can refresh SW2, and whether SW2 can refresh SW1. Then stop only SW2's advertisements toward SW1. Leave SW2 receiving and leave all settings on SW1 unchanged.

```ios SW2
SW2# configure terminal
SW2(config)# interface gigabitethernet0/2
SW2(config-if)# no lldp transmit
SW2(config-if)# end
SW2# show lldp interface gigabitethernet0/2
SW2# show lldp neighbors
```

On SW1, inspect `show lldp neighbors detail` and `show cdp neighbors` over time. If a detail/interface form is unsupported, inspect the running configuration for the configured directions.

:::expected
SW1 can no longer refresh its LLDP entry for SW2; it disappears after any retained lifetime, or earlier if a shutdown advertisement is processed. SW2 can continue learning SW1. CDP remains independently configured. In the paper exercise, write these directional conclusions and identify which one setting caused them; do not report an unobserved simulator result. Record the fault before Step 9 restores it.
:::

```state
{"status":"One-way LLDP","tone":"bad","focus":["S2","S1"],"flows":[{"path":["S2","S1"],"label":"SW2 LLDP advertisement","stop":"S2","stopText":"Not sent · no lldp transmit"},{"event":["S1"],"tags":{"S1":"SW2 entry not refreshed · disappears"}},{"path":["S1","S2"],"label":"SW1 LLDP advertisement","tags":{"S2":"Still learns SW1 · receive on"}}],"chips":[{"node":"S2","text":"LLDP Gi0/2 tx off · rx on","tone":"bad"},{"node":"S1","text":"LLDP: SW2 listed","until":1},{"node":"S1","text":"LLDP: SW2 entry gone","tone":"bad","from":1}],"rows":[["SW1 learns SW2","Cannot refresh · entry disappears","bad"],["SW2 learns SW1","Continues","ok"],["One setting","SW2 Gi0/2 no lldp transmit"],["CDP","Configured separately"]]}
```

## Step 8: Limit discovery on the ordinary PC port

This lab PC has no phone or policy dependency. Disable unnecessary discovery on SW1 Fa0/1. Omit only the LLDP lines if that feature is unavailable in the image.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# no cdp enable
SW1(config-if)# no lldp transmit
SW1(config-if)# no lldp receive
SW1(config-if)# end
SW1# show cdp interface
```

:::expected
The policy affects the PC-facing port, not the interswitch uplink. PC-A can still ping the management addresses; removing discovery does not shut the port or implement a traffic-filtering policy. Record this intentional final difference from the original default configuration.
:::

```state
{"status":"PC port discovery off","tone":"warn","focus":["S1"],"flows":[{"path":["P","S1"],"back":true,"label":"PC-A pings 192.168.12.11"},{"path":["P","S1","S2"],"back":true,"label":"PC-A pings 192.168.12.12","tags":{"S1":"Fa0/1 forwards · discovery off"}}],"chips":[{"node":"S1","text":"Fa0/1: no CDP · no LLDP","tone":"warn"},{"node":"S2","text":"LLDP Gi0/2 tx off · rx on","tone":"bad"}],"rows":[["SW1 Fa0/1","CDP off · LLDP tx and rx off","warn"],["PC-A → management IPs","Still replies","ok"],["Uplinks","Discovery unchanged"],["SW2 LLDP transmit","Still off until Step 9","bad"]]}
```

## Step 9: Restore the uplink and save the verified map

```ios SW2
SW2# configure terminal
SW2(config)# interface gigabitethernet0/2
SW2(config-if)# lldp transmit
SW2(config-if)# end
SW2# show lldp neighbors
```

On supported images, inspect both switches and verify fresh two-way learning before saving. Then run `copy running-config startup-config` at SW2's privileged prompt. Complete SW2's save prompt: if `Destination filename [startup-config]?` appears, press Enter and wait for the `SW2#` prompt. In the paper fallback, state why reenabling SW2 transmission restores SW1's ability to refresh the entry. Save SW1 and R1 with `copy running-config startup-config`, accepting the destination filename if prompted. Save the project as `12-discovery-complete.pkt` and keep your corrected link table with it.

:::expected
Both uplink directions are restored, the PC-port policy remains intentional, and the corrected map identifies both endpoints of each link. The record distinguishes actual CDP/LLDP observations from any paper-only LLDP work.
:::

```state
{"status":"Uplink restored · saved","tone":"ok","focus":["S2","S1"],"flows":[{"path":["S2","S1"],"wait":1.6,"label":"SW2 LLDP advertisement","tags":{"S1":"SW2 LLDP entry learned again"}},{"path":["S1","S2"],"label":"SW1 LLDP advertisement","tags":{"S2":"Still learns SW1"}}],"chips":[{"node":"S2","text":"LLDP Gi0/2 tx off · rx on","tone":"bad","until":0},{"node":"S2","text":"LLDP Gi0/2 tx · rx","tone":"ok","from":0},{"node":"S1","text":"Fa0/1: no CDP · no LLDP"}],"rows":[["SW1 ↔ SW2 LLDP","Fresh learning both ways","ok"],["SW1 Fa0/1","Discovery off by policy"],["Saved","SW1, SW2, R1 startup-config","ok"],["Project","12-discovery-complete.pkt"]]}
```

## Evidence to keep

Keep a link table containing both device names, both ports, observation time and the source protocol. Include reverse observations and the separate management pings. For the LLDP fault, explain each learning direction before and after recovery. Mark any simulator fallback as supplied evidence, and preserve the old drawing alongside your justified correction.

## Troubleshooting

- Missing neighbor: check link state, device-wide process, local receive policy, remote transmit policy, and cache lifetime.
- LLDP absent but CDP present: inspect LLDP settings independently; CDP does not enable it.
- Neighbor present but management ping fails: check SVI state, VLAN, address, mask, and source reachability.
- Unexpected port ID: compare from the far device and inspect the cable before changing documentation.
- Unsupported command: use the documented full-table/configuration alternative, or the marked paper workflow; do not claim the simulator executed it.

## Challenge

In a separate copy, move only SW2's cable end from Gi0/2 to Gi0/1. Configure the new SW2 interface as an enabled VLAN 1 access port with CDP, LLDP transmit, and LLDP receive where supported. Predict which fields change in both switches' neighbor tables. Verify them, revise the link record, and save this variation separately.

:::solution Check your changed topology
The physical connection becomes **SW1 Gi0/1 → SW2 Gi0/1**. In SW1's row for SW2, the local port remains Gi0/1 and the remote port changes to Gi0/1. In SW2's row, the local port changes to Gi0/1 and the remote port remains SW1 Gi0/1. Management IPs do not need to change because both ports still serve VLAN 1. Allow stale entries to clear and fresh advertisements to arrive before calling the map verified.

One suitable configuration of the newly connected SW2 port is:

```ios SW2
SW2# configure terminal
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 1
SW2(config-if)# cdp enable
SW2(config-if)# lldp transmit
SW2(config-if)# lldp receive
SW2(config-if)# no shutdown
SW2(config-if)# end
SW2# show cdp neighbors
SW2# show lldp neighbors
```

Omit LLDP commands only for the documented simulator fallback. Inspect SW1 as well, and repeat PC-A's management pings to confirm the cable move preserved the original IP service. Save the variation after these checks.
:::
