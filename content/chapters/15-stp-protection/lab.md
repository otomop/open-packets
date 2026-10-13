---
title: Configure, trigger, and recover STP protection
environment: mixed
devices: ["3 × Catalyst 2960-24TT (SW1, SW2, SW3)", "2 × PC-PT (PC-A, PC-B)", "Optional licensed CML or hardware switches for the loop-guard fault"]
minutes: 65
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a new project with the complete configuration below; no saved file from another chapter is required. You will protect a host port, reject a superior downstream root, and interpret missing-BPDU protection. The base topology is deliberately a line, so the controlled loop-guard demonstration has no redundant physical path that could form a data loop if the feature is unavailable.

These instructions and expected results are authored from Cisco's documented behavior, not a claim of manual Packet Tracer execution. Run the PortFast/BPDU-guard/root-guard exercises where the simulator supports them. Run the BPDU-suppression fault only on an isolated CML/hardware setup after confirming loop guard is operational; Packet Tracer learners use the included prediction and representative evidence. Command acceptance alone does not establish complete simulation support.

## Topology

```diagram
{"type":"topology","title":"Lab topology — one controlled downstream branch","caption":"SW2 is root. SW1 protects its PC port and the boundary toward SW3; there is no SW2-to-SW3 cable.","nodes":[{"id":"PCA","kind":"pc","label":"PC-A","sub":"10.0.10.11/24","x":5,"y":1},{"id":"SW2","kind":"switch","label":"SW2 · root","sub":"10.0.10.2/24","x":1,"y":3,"highlight":true},{"id":"SW1","kind":"switch","label":"SW1","sub":"10.0.10.1/24","x":5,"y":3},{"id":"SW3","kind":"switch","label":"SW3 · downstream","sub":"10.0.10.3/24","x":10,"y":3},{"id":"PCB","kind":"pc","label":"PC-B","sub":"10.0.10.12/24","x":1,"y":5.5}],"links":[{"from":"SW2","to":"SW1","fromLabel":"Fa0/24","toLabel":"Fa0/24","label":"cost 19"},{"from":"SW1","to":"SW3","fromLabel":"Gi0/1","toLabel":"Gi0/1","label":"cost 4"},{"from":"PCA","to":"SW1","toLabel":"Fa0/5"},{"from":"PCB","to":"SW2","toLabel":"Fa0/5"}]}
```

| Connection | Cable | Configuration |
|---|---|---|
| SW2 Fa0/24 ↔ SW1 Fa0/24 | Copper crossover | Trunk, native 999, allow 10 and 999 |
| SW1 Gi0/1 ↔ SW3 Gi0/1 | Copper crossover | Trunk, native 999, allow 10 and 999 |
| PC-A FastEthernet0 ↔ SW1 Fa0/5 | Copper straight-through | Access VLAN 10 |
| PC-B FastEthernet0 ↔ SW2 Fa0/5 | Copper straight-through | Access VLAN 10 |
| Temporary: SW3 Fa0/1 ↔ SW1 Fa0/5 | Copper crossover | Used only in Step 3 after disconnecting SW3's uplink |

| Device | IPv4 address / mask | Gateway | VLAN 10 priority / root cost at baseline |
|---|---|---|---|
| SW1, SVI VLAN 10 | 10.0.10.1 / 255.255.255.0 | None | 32768 / 19 |
| SW2, SVI VLAN 10 | 10.0.10.2 / 255.255.255.0 | None | 24576 / 0 |
| SW3, SVI VLAN 10 | 10.0.10.3 / 255.255.255.0 | None | 28672 / 23 |
| PC-A | 10.0.10.11 / 255.255.255.0 | Blank | Access VLAN 10 |
| PC-B | 10.0.10.12 / 255.255.255.0 | Blank | Access VLAN 10 |

The SVI addresses are management endpoints for testing isolation; they are not routing gateways. Everything is in the same subnet. Do not attach any other network, add an extra interswitch cable, or enable IP routing for this lab. On a CML/hardware equivalent, map the named interfaces to actual ports and retain the explicit costs and addresses.

## Step 1: Build the complete baseline

Cable the four permanent links, open each switch CLI, decline the initial setup dialog if shown, and apply its block. Record the actual Bridge ID MACs after configuration. The differing priorities make VLAN 10 root placement independent of MAC ordering.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name STUDY
SW1(config-vlan)# exit
SW1(config)# vlan 999
SW1(config-vlan)# name UNUSED_NATIVE
SW1(config-vlan)# exit
SW1(config)# spanning-tree mode rapid-pvst
SW1(config)# spanning-tree vlan 10 priority 32768
SW1(config)# interface fastethernet0/24
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# switchport trunk allowed vlan 10,999
SW1(config-if)# spanning-tree vlan 10 cost 19
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# switchport trunk allowed vlan 10,999
SW1(config-if)# spanning-tree vlan 10 cost 4
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface fastethernet0/5
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface vlan 10
SW1(config-if)# ip address 10.0.10.1 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show spanning-tree vlan 10
```

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# vlan 10
SW2(config-vlan)# name STUDY
SW2(config-vlan)# exit
SW2(config)# vlan 999
SW2(config-vlan)# name UNUSED_NATIVE
SW2(config-vlan)# exit
SW2(config)# spanning-tree mode rapid-pvst
SW2(config)# spanning-tree vlan 10 priority 24576
SW2(config)# interface fastethernet0/24
SW2(config-if)# switchport mode trunk
SW2(config-if)# switchport trunk native vlan 999
SW2(config-if)# switchport trunk allowed vlan 10,999
SW2(config-if)# spanning-tree vlan 10 cost 19
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# interface fastethernet0/5
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 10
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# interface vlan 10
SW2(config-if)# ip address 10.0.10.2 255.255.255.0
SW2(config-if)# no shutdown
SW2(config-if)# end
SW2# show spanning-tree vlan 10
```

```ios SW3
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW3
SW3(config)# vlan 10
SW3(config-vlan)# name STUDY
SW3(config-vlan)# exit
SW3(config)# vlan 999
SW3(config-vlan)# name UNUSED_NATIVE
SW3(config-vlan)# exit
SW3(config)# spanning-tree mode rapid-pvst
SW3(config)# spanning-tree vlan 10 priority 28672
SW3(config)# interface gigabitethernet0/1
SW3(config-if)# switchport mode trunk
SW3(config-if)# switchport trunk native vlan 999
SW3(config-if)# switchport trunk allowed vlan 10,999
SW3(config-if)# spanning-tree vlan 10 cost 4
SW3(config-if)# no shutdown
SW3(config-if)# exit
SW3(config)# interface vlan 10
SW3(config-if)# ip address 10.0.10.3 255.255.255.0
SW3(config-if)# no shutdown
SW3(config-if)# end
SW3# show spanning-tree vlan 10
```

:::expected
SW2 displays `This bridge is the root` for VLAN 10 and priority 24586 including the VLAN ID. SW1's Fa0/24 is root port at total cost 19; SW1 Gi0/1 is designated. SW3's Gi0/1 is root port at cost 19 + 4 = 23. No VLAN 10 interswitch port needs to be alternate in this nonredundant topology. Record VLAN 10 only; VLAN 999 has its own election.
:::

```state
{"status":"SW2 is root","tone":"ok","addressed":false,"led":true,"focus":["SW2"],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW1","text":"32768 · cost 19"},{"node":"SW3","text":"28672 · cost 23"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW1","text":"Root FWD"}],"rows":[["Root","SW2 · 24576, shown 24586"],["SW1","Fa0/24 root · cost 19"],["SW3","Gi0/1 root · 19 + 4 = 23"],["Alternate ports","None · no redundant path"]]}
```

## Step 2: Configure PCs and protected edge ports

Enter each PC address and mask using Desktop → IP Configuration → Static; leave gateway and DNS blank. Run `ping 10.0.10.12` and `ping 10.0.10.3` from PC-A after convergence. Then configure PortFast and BPDU guard on SW1's specific host port; on SW2 demonstrate the equivalent global defaults for its nontrunking host ports.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# spanning-tree portfast
SW1(config-if)# spanning-tree bpduguard enable
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show spanning-tree interface fastethernet0/5 detail
```

```ios SW2
SW2# configure terminal
SW2(config)# spanning-tree portfast default
SW2(config)# spanning-tree portfast bpduguard default
SW2(config)# end
SW2# show spanning-tree summary
SW2# show spanning-tree interface fastethernet0/5 detail
```

:::expected
PC-A can reach PC-B and SW3's SVI. SW1 Fa0/5 becomes forwarding as an edge after the controlled bounce; BPDU guard is configured and no violation exists with PC-A attached. SW2's global defaults apply to Fa0/5 but not its trunk Fa0/24. If an optional detailed show command is unsupported, use `show spanning-tree vlan 10`, `show running-config`, and interface status. Record the actual port behavior instead of assuming an exact delay.
:::

```state
{"status":"Host edge ports protected","tone":"ok","focus":["SW1","SW2"],"flows":[{"path":["PCA","SW1","SW2","PCB"],"back":true,"label":"ping 10.0.10.12"},{"path":["PCA","SW1","SW3"],"back":true,"label":"ping 10.0.10.3","tags":{"SW3":"VLAN 10 SVI 10.0.10.3"}}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW2","text":"Global PortFast + BPDU guard"},{"node":"SW1","text":"Fa0/5 PortFast + BPDU guard"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW1","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"}],"rows":[["PC-A → PC-B, SW3 SVI","Replies","ok"],["SW1 Fa0/5","Edge, forwarding · no violation","ok"],["SW2 defaults","Fa0/5, not trunk Fa0/24"]]}
```

## Step 3: Trigger BPDU guard with the third switch

Before changing cables, predict whether the trigger depends on SW3 advertising a better root. Record the expected interface state, affected traffic and evidence that distinguishes this from an alternate port.

Disconnect SW3 Gi0/1 from SW1 Gi0/1 first. Verify that SW3 now has no interswitch cable. Disconnect PC-A from SW1 Fa0/5. Prepare SW3 Fa0/1 as an access port in VLAN 10, then connect it to SW1 Fa0/5 using a crossover cable. This temporary connection has no alternate physical return path.

```ios SW3
SW3# configure terminal
SW3(config)# interface fastethernet0/1
SW3(config-if)# switchport mode access
SW3(config-if)# switchport access vlan 10
SW3(config-if)# no shutdown
SW3(config-if)# end
```

```ios SW1
SW1# show interfaces status
SW1# show logging
```

:::expected
SW3 sends BPDUs; the configured interface BPDU guard causes SW1 Fa0/5 to become err-disabled. SW3 does not need priority zero: any received BPDU is sufficient. Look for the actual `bpduguard` cause in the log. The following shortened lines are representative, not a recorded simulator transcript:

```output Representative SW1 evidence
%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port FastEthernet0/5 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Fa0/5, putting Fa0/5 in err-disable state
```

If the port stays up, check which physical port received the cable, the SW3 port state, and the presence of BPDU guard. If the simulator does not implement the feature, record that limitation and interpret the evidence above; do not count the exercise as an observed trigger.
:::

```state
{"status":"Fa0/5 err-disabled","tone":"bad","focus":["SW1","SW3"],"cut":[["SW1","SW3"],["PCA","SW1"]],"flows":[{"event":["SW3"],"wait":1.2,"tags":{"SW3":"Sends BPDUs out Fa0/1"}},{"event":["SW1"],"tone":"bad","tags":{"SW1":"BPDU on Fa0/5 · BPDU guard"}}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW3","text":"Temp Fa0/1 → SW1 Fa0/5"},{"node":"SW1","text":"Log: bpduguard on Fa0/5","tone":"bad","from":1}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"err-disabled","tone":"bad","from":1}],"rows":[["SW1 Fa0/5","err-disabled · bpduguard","bad"],["Trigger","Any BPDU · no better root needed"],["PC-A, SW3 Gi0/1","Disconnected for the test"]]}
```

## Step 4: Remove the BPDU source and recover the host port

Delete the temporary SW3 Fa0/1 cable. Reconnect PC-A to SW1 Fa0/5 with a straight-through cable, and restore SW3 Gi0/1 ↔ SW1 Gi0/1 with a crossover cable. Shut the unused test port on SW3. Only after the wrong connection is removed, reset SW1 Fa0/5.

```ios SW3
SW3# configure terminal
SW3(config)# interface fastethernet0/1
SW3(config-if)# shutdown
SW3(config-if)# end
```

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces status
SW1# show spanning-tree vlan 10
```

:::expected
Fa0/5 returns to connected/forwarding with PC-A attached. Repeat PC-A's pings to 10.0.10.12 and 10.0.10.3. SW2 is still root and SW3's root cost is 23. A repeating violation means a BPDU source is still reaching the protected port; a timer or repeated reset would not correct that source.
:::

```state
{"status":"Fa0/5 recovered","tone":"ok","focus":["SW1"],"wake":["PCA","SW3"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Fa0/5 shutdown, no shutdown"}},{"path":["PCA","SW1","SW2","PCB"],"back":true,"label":"ping 10.0.10.12"},{"path":["PCA","SW1","SW3"],"back":true,"label":"ping 10.0.10.3"}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW3","text":"Fa0/1 shut"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW1","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"err-disabled","tone":"bad","until":0},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok","from":0}],"rows":[["SW1 Fa0/5","Connected/forwarding · PC-A","ok"],["PC-A pings .12 and .3","Replies","ok"],["Root · SW3 root cost","SW2 · 23","ok"]]}
```

## Step 5: Guard the downstream boundary and introduce a superior root

Before applying the change, predict which of PC-A→PC-B and PC-A→SW3 should fail, which physical link can remain up, and whether manual errdisable recovery will be appropriate.

SW1 Gi0/1 is a designated boundary toward SW3, so install root guard there. Then change SW3's VLAN 10 priority to zero. Keep all permanent cables exactly as in the topology.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# spanning-tree guard root
SW1(config-if)# end
```

```ios SW3
SW3# configure terminal
SW3(config)# spanning-tree vlan 10 priority 0
SW3(config)# end
SW3# show spanning-tree vlan 10
```

```ios SW1
SW1# show spanning-tree inconsistentports
SW1# show spanning-tree vlan 10
```

:::expected
SW1 Gi0/1 becomes root-inconsistent for VLAN 10, often displayed with `*ROOT_Inc`; it does not become BPDU-guard err-disabled. SW1 still identifies SW2 as root. PC-A can reach PC-B but cannot reach SW3's 10.0.10.3 address across the blocked VLAN. SW3 may identify itself as root in its isolated portion. The objective is to hold the upstream boundary, not change SW3's configuration automatically.
:::

```state
{"status":"Gi0/1 root-inconsistent","tone":"bad","focus":["SW1","SW3"],"flows":[{"path":["SW3","SW1"],"wait":1.2,"label":"Superior BPDU","tags":{"SW3":"VLAN 10 priority 0"},"stop":"SW1","stopText":"Root guard · superior BPDU"},{"path":["PCA","SW1","SW2","PCB"],"back":true,"label":"ping 10.0.10.12"},{"path":["PCA","SW1","SW3"],"label":"ping 10.0.10.3","stop":"SW1","stopText":"VLAN 10 blocked · Gi0/1 ROOT_Inc"}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW1","text":"Gi0/1 root guard"},{"node":"SW3","text":"May claim root · isolated","tone":"warn","from":1}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"},{"node":"SW1","peer":"SW3","text":"Desg FWD","until":1},{"node":"SW1","peer":"SW3","text":"*ROOT_Inc","from":1,"tone":"warn"},{"node":"SW3","peer":"SW1","text":"Root FWD","until":0}],"rows":[["SW1 Gi0/1","Root-inconsistent · not err-disabled","bad"],["SW1's root","Still SW2","ok"],["PC-A → PC-B","Replies","ok"],["PC-A → 10.0.10.3","Fails","bad"]]}
```

## Step 6: Correct the downstream priority

Restore SW3's explicit priority 28672 and allow STP to process the new information. Leave the protective root-guard command on SW1 while observing automatic recovery.

```ios SW3
SW3# configure terminal
SW3(config)# spanning-tree vlan 10 priority 28672
SW3(config)# end
SW3# show spanning-tree vlan 10
```

```ios SW1
SW1# show spanning-tree inconsistentports
SW1# show spanning-tree vlan 10
```

:::expected
The root-inconsistent condition clears without a manual port bounce. SW3 again learns SW2's root ID and uses Gi0/1 at cost 23; PC-A can again ping 10.0.10.3. Record the observed recovery rather than requiring exactly 20 seconds. If it persists, verify that the command changed VLAN 10 and that no other superior source exists.
:::

```state
{"status":"Gi0/1 recovers automatically","tone":"ok","focus":["SW3","SW1"],"flows":[{"event":["SW3","SW1"],"wait":1.2,"tags":{"SW3":"Priority 28672 · learns SW2 root","SW1":"ROOT_Inc clears · no bounce"}},{"path":["PCA","SW1","SW3"],"back":true,"label":"ping 10.0.10.3"}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW1","text":"Gi0/1 root guard"},{"node":"SW3","text":"May claim root · isolated","tone":"warn","until":0},{"node":"SW3","text":"28672 · cost 23","tone":"ok","from":0}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"},{"node":"SW1","peer":"SW3","text":"*ROOT_Inc","until":0,"tone":"warn"},{"node":"SW1","peer":"SW3","text":"Desg FWD","from":0},{"node":"SW3","peer":"SW1","text":"Root FWD","from":0}],"rows":[["SW1 Gi0/1","Clears · no manual bounce","ok"],["SW3","Gi0/1 root · cost 23","ok"],["PC-A → 10.0.10.3","Replies again","ok"],["Root guard","Left on SW1 Gi0/1"]]}
```

## Step 7: Prepare loop guard and record received BPDUs

For the missing-BPDU exercise, remove root guard from SW1's sending port to keep this experiment focused on one feature. Configure loop guard on SW3's receiving root port. These commands require platform support; if your Packet Tracer image rejects loop guard, use the worksheet exercise in Step 8 and skip the suppression command entirely.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# no spanning-tree guard
SW1(config-if)# end
```

```ios SW3
SW3# configure terminal
SW3(config)# interface gigabitethernet0/1
SW3(config-if)# spanning-tree guard loop
SW3(config-if)# end
SW3# show spanning-tree interface gigabitethernet0/1 detail
SW3# show spanning-tree inconsistentports
```

:::expected
SW3 Gi0/1 is still root/forwarding for VLAN 10 and receives BPDUs before the fault. On an implementing image, detail identifies loop guard as enabled; repeated readings show received BPDU activity. The inconsistent-port list is empty. Do not infer enabled loop protection from command acceptance alone, and do not inject the fault if you cannot establish this baseline.
:::

```state
{"status":"Loop guard on SW3 uplink","tone":"ok","focus":["SW3"],"flows":[{"path":["SW1","SW3"],"wait":1.2,"label":"BPDU","tags":{"SW3":"Loop guard · BPDU received"}}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW3","text":"Gi0/1 loop guard"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW1","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"}],"rows":[["SW3 Gi0/1","Root FWD · loop guard on","ok"],["BPDUs received","Rising across readings","ok"],["Inconsistent ports","None","ok"],["SW1 Gi0/1","Root guard removed"]]}
```

## Step 8: Observe a controlled BPDU-loss fault or interpret the exhibit

**CML/hardware only, isolated line topology:** confirm that SW3 has only its Gi0/1 cable and the temporary Fa0/1 test port is shut. On SW1 Gi0/1, temporarily enable interface BPDU filtering. This models lost BPDU delivery while the physical link remains up; it does not reproduce every property of a one-way fiber fault. There is no extra SW2–SW3 link.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# spanning-tree bpdufilter enable
SW1(config-if)# end
```

```ios SW3
SW3# show interfaces status
SW3# show spanning-tree inconsistentports
SW3# show spanning-tree interface gigabitethernet0/1 detail
```

**Packet Tracer/paper path:** do not enter the filter command. From the healthy baseline, predict the result if SW3 stopped receiving BPDUs but the link stayed up. Interpret the representative evidence below and compare it with root guard's trigger.

:::expected
On a supported implementation, expired expected BPDU information causes loop inconsistency on SW3 Gi0/1. Physical link status can remain connected while VLAN 10 cannot forward. A representative abbreviated entry is:

```output Representative loop-guard evidence
Name                 Interface                Inconsistency
-------------------- ------------------------ ------------------
VLAN0010             GigabitEthernet0/1        Loop Inconsistent
```

The reason is missing expected BPDUs, not a received superior BID. VLAN 999 may also be listed depending on its roles and received information. Do not require a fixed role label or six-second trigger from every software version. Root guard would not detect this same absence of control traffic.
:::

```state
{"status":"Gi0/1 loop-inconsistent","tone":"bad","focus":["SW1","SW3"],"flows":[{"path":["SW1","SW3"],"wait":1.2,"label":"BPDU","stop":"SW1","stopText":"BPDU filter · sending suppressed"},{"event":["SW3"],"tone":"bad","wait":0.4,"tags":{"SW3":"Expected BPDUs expire"}}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW1","text":"Gi0/1 BPDU filter (test)","tone":"warn"},{"node":"SW3","text":"Gi0/1 loop guard"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"},{"node":"SW3","peer":"SW1","text":"Root FWD","until":1},{"node":"SW3","peer":"SW1","text":"*LOOP_Inc","from":1,"tone":"warn"}],"rows":[["SW3 Gi0/1","VLAN 10 loop-inconsistent","bad"],["Link","Still connected"],["Cause","Missing BPDUs, not a superior BID"],["Packet Tracer","Predict on paper · no filter","warn"]]}
```

## Step 9: Remove filtering and restore the boundary

On the CML/hardware path, remove the exact filter introduced in Step 8. On the Packet Tracer/paper path no filter was installed, so simply verify the running configuration and restore root guard. Root guard on SW1 and loop guard on SW3 are on different interfaces at opposite ends and are compatible with this intended design.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# no spanning-tree bpdufilter
SW1(config-if)# spanning-tree guard root
SW1(config-if)# end
SW1# show running-config
```

```ios SW3
SW3# show spanning-tree inconsistentports
SW3# show spanning-tree vlan 10
```

:::expected
If a fault was executed, BPDUs resume and loop inconsistency clears automatically; SW3 returns to root/forwarding on Gi0/1 with cost 23. PC-A's pings to SW3 and PC-B succeed. No interface BPDU filter remains in the running configuration. On a simulator that rejects the optional removal command, verify that no filter was configured and continue with supported commands.
:::

```state
{"status":"Boundary restored","tone":"ok","focus":["SW1","SW3"],"flows":[{"path":["SW1","SW3"],"wait":1.2,"label":"BPDUs resume","tags":{"SW3":"BPDUs resume · LOOP_Inc clears"}},{"path":["PCA","SW1","SW3"],"back":true,"label":"ping 10.0.10.3"},{"path":["PCA","SW1","SW2","PCB"],"back":true,"label":"ping 10.0.10.12"}],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW1","text":"Gi0/1 BPDU filter (test)","tone":"warn","until":0},{"node":"SW1","text":"Gi0/1 root guard","from":0},{"node":"SW3","text":"Gi0/1 loop guard"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"},{"node":"SW1","peer":"SW3","text":"Desg FWD","from":0},{"node":"SW3","peer":"SW1","text":"*LOOP_Inc","until":1,"tone":"warn"},{"node":"SW3","peer":"SW1","text":"Root FWD","from":1}],"rows":[["SW3 Gi0/1","Root FWD · cost 23","ok"],["BPDU filter","None in running-config","ok"],["PC-A → SW3, PC-B","Replies","ok"],["Guards","Root on SW1 · loop on SW3"]]}
```

## Step 10: Inspect optional timed recovery without repeating the fault

On an IOS image supporting these commands, enable automatic recovery for BPDU guard and set the interval to 60 seconds. This is a configuration-reading exercise: do not reconnect the prohibited switch. Packet Tracer users whose image rejects the commands should identify the two separate requirements from the lesson and retain manual recovery.

```ios SW1
SW1# configure terminal
SW1(config)# errdisable recovery cause bpduguard
SW1(config)# errdisable recovery interval 60
SW1(config)# end
SW1# show errdisable recovery
```

:::expected
The output identifies BPDU-guard recovery as enabled and the interval as 60 seconds. No interface is waiting for recovery because the fault was already corrected. Changing only the timer would not enable recovery for the cause. The setting permits future recovery attempts; it does not prevent another violation.
:::

```state
{"status":"Timed recovery configured","focus":["SW1"],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW1","text":"Gi0/1 root guard"},{"node":"SW1","text":"Recovery: bpduguard · 60 s","tone":"warn"},{"node":"SW3","text":"Gi0/1 loop guard"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW1","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"}],"rows":[["BPDU-guard recovery","Enabled · interval 60 s"],["Ports waiting","None · cause already fixed","ok"],["Timer alone","Would not enable the cause"]]}
```

## Step 11: Remove the optional timer policy and save the protected baseline

If Step 10 was supported, remove its cause and interval settings to return to manual BPDU-guard recovery. Keep PortFast/BPDU guard on the host ports, root guard on SW1's downstream boundary, and supported loop guard on SW3's uplink. Save each switch and then save the workspace as `stp-protected.pkt` or the equivalent CML lab.

```ios SW1
SW1# configure terminal
SW1(config)# no errdisable recovery cause bpduguard
SW1(config)# no errdisable recovery interval
SW1(config)# end
SW1# show spanning-tree inconsistentports
SW1# show spanning-tree vlan 10
SW1# copy running-config startup-config
```

```ios SW2
SW2# show spanning-tree vlan 10
SW2# copy running-config startup-config
```

```ios SW3
SW3# show spanning-tree vlan 10
SW3# copy running-config startup-config
```

:::expected
No deliberate fault remains: SW3 priority is 28672, its temporary Fa0/1 is shut, filtering is absent, and SW2 remains root. All three management IPs and both PCs are reachable within VLAN 10. Record any simulator-only omissions in your notes so the saved project does not imply a feature was demonstrated when it was only studied. Accept each device’s save filename prompt and wait for completion before moving to the next device.

Submit one row for each tested or interpreted feature: intended port role; received or missing BPDU trigger; resulting interface/instance state; affected traffic; evidence that identifies the cause; corrective action; and fresh verification. Mark loop-guard worksheet results as supplied, not observed. The optional timer exercise is configuration interpretation, not a timed recovery measurement.
:::

```state
{"status":"Protected baseline saved","tone":"ok","focus":["SW1","SW2","SW3"],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW1","text":"Gi0/1 root guard"},{"node":"SW1","text":"Fa0/5 PortFast + BPDU guard"},{"node":"SW3","text":"Gi0/1 loop guard"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW1","text":"Root FWD"},{"node":"SW1","peer":"PCA","text":"Edge FWD","tone":"ok"}],"rows":[["Faults left","None · SW3 28672, Fa0/1 shut","ok"],["BPDU-guard recovery","Manual again"],["Reachable in VLAN 10","3 SVIs and both PCs","ok"],["Saved","Each switch · stp-protected.pkt","ok"]]}
```

## Troubleshooting

- Fa0/5 stays err-disabled after restoring the PC: remove the BPDU source first, then issue both `shutdown` and `no shutdown`; a lone `no shutdown` is not the complete recovery sequence.
- Root guard does not trigger: confirm it is on SW1 Gi0/1, the SW3 priority change is for VLAN 10, and the correct trunk carries that VLAN.
- SW3 unexpectedly becomes root of the main network: the boundary guard was absent or the switch was attached through a different port. Disconnect the temporary source, correct placement, and restore priority before reconnecting.
- Loop inconsistency does not appear: first determine whether this is the paper/simulator path. On supported equipment verify prior BPDU reception, correct interface, point-to-point status, enabled loop guard, and the exact BPDU-suppression location.
- A management SVI cannot be pinged: check its address and operational line protocol as well as STP. A VLAN without an active forwarding member can make its SVI unavailable.

## Challenge

This independent policy worksheet uses a different access switch, ASW4, with all three listed links in VLAN 30. Assume a supported IOS switch, healthy forwarding before the policy change, and no other links. CORE is the intended root. LAB may participate in STP but must not supply the root. The printer must never act as a bridge.

| ASW4 port | Actual neighbor and baseline role | Requirement |
|---|---|---|
| Gi1/0/48 | CORE; root port, point-to-point, receiving BPDUs | Keep expected control information; prevent a silent loss from making this port designated |
| Gi1/0/10 | LAB; designated port | Reject superior root information, while permitting ordinary downstream STP |
| Gi1/0/7 | Printer; static access port | Immediate edge forwarding and errdisable on any received BPDU |

Before opening the answer, select and write the interface commands for each row. Then predict the state, affected traffic and recovery for three separate incidents: LAB advertises a superior VLAN 30 root; the printer is replaced by a BPDU-sending switch; CORE’s expected BPDUs stop arriving while Gi1/0/48 stays physically up. Assume no automatic errdisable recovery.

For the last incident, name two plausible causes and the next evidence needed. Do not claim the state proves one specific cable defect. This is a paper exercise; do not attach new equipment or suppress production BPDUs.

:::solution
The three boundaries require different policies:

```ios ASW4
ASW4# configure terminal
ASW4(config)# interface gigabitethernet1/0/48
ASW4(config-if)# spanning-tree guard loop
ASW4(config-if)# exit
ASW4(config)# interface gigabitethernet1/0/10
ASW4(config-if)# spanning-tree guard root
ASW4(config-if)# exit
ASW4(config)# interface gigabitethernet1/0/7
ASW4(config-if)# switchport mode access
ASW4(config-if)# switchport access vlan 30
ASW4(config-if)# spanning-tree portfast
ASW4(config-if)# spanning-tree bpduguard enable
ASW4(config-if)# end
```

These are additions to the explicitly supplied healthy baseline, not a complete new switch configuration. Some IOS XE images use the `edge` PortFast spelling.

- LAB’s superior information causes root inconsistency on the Gi1/0/10 VLAN 30 instance. Correct LAB’s priority or connection; the inconsistency clears automatically when the triggering information ceases and STP permits recovery. Root guard does not rewrite LAB.
- A BPDU on Gi1/0/7 causes conventional BPDU-guard errdisable for the whole interface. Remove the incorrect switch, then enter `shutdown` and `no shutdown` on Gi1/0/7 and verify a fresh host test. Removing the source alone does not clear the disabled state under the given recovery policy.
- Previously received BPDUs expiring on Gi1/0/48 cause loop inconsistency, keeping the affected instance from unsafe forwarding. Peer BPDU filtering, a peer control-plane problem or a one-way path fault could explain missing delivery. Compare peer transmission/configuration with local reception and physical evidence. Restore delivery; the inconsistency clears automatically when appropriate BPDUs return.

Use `show spanning-tree inconsistentports` for instance inconsistencies and interface status plus a cause-specific log for errdisable. Confirm expected VLAN 30 roles and endpoint traffic after recovery. Installing root guard on Gi1/0/48 would reject the legitimate root path; putting both root and loop guard on one interface is not a valid combined policy.
:::
