---
title: Build and verify a three-switch Rapid PVST+ topology
environment: packet-tracer
devices: ["3 × Catalyst 2960-24TT (SW1, SW2, SW3)", "2 × PC-PT (PC-A, PC-B)"]
minutes: 70
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Start with a new Packet Tracer file. You will establish a complete VLAN and trunk baseline, predict port roles, alter one parameter at a time, and restore each change before the next exercise. Keep a worksheet containing the root BID, local BID, total root cost, root port, and alternate ports for every switch.

This is an authored lab with representative observations; it has not been manually executed in Packet Tracer. Interface names match the 2960-24TT model. On CML or hardware, map these connections to the interfaces on your licensed switch image and retain the explicit VLAN 10 costs. Display formatting and convergence timing can differ.

## Topology

```diagram
{"type":"topology","title":"Lab topology — a triangle with one slower link","caption":"Use the listed ports on three 2960-24TT switches. VLAN 10 carries both PCs; VLAN 999 is the unused native VLAN.","nodes":[{"id":"PCA","kind":"pc","label":"PC-A","sub":"10.0.10.11/24","x":1,"y":1},{"id":"SW1","kind":"switch","label":"SW1","x":4,"y":1},{"id":"SW2","kind":"switch","label":"SW2","x":4,"y":5},{"id":"PCB","kind":"pc","label":"PC-B","sub":"10.0.10.12/24","x":1,"y":5},{"id":"SW3","kind":"switch","label":"SW3","x":10,"y":3}],"links":[{"from":"PCA","to":"SW1","toLabel":"Fa0/5"},{"from":"SW1","to":"SW2","fromLabel":"Fa0/24","toLabel":"Fa0/24","label":"100 Mbps · cost 19"},{"from":"SW1","to":"SW3","fromLabel":"Gi0/1","toLabel":"Gi0/1","label":"1 Gbps · cost 4"},{"from":"SW2","to":"SW3","fromLabel":"Gi0/1","toLabel":"Gi0/2","label":"1 Gbps · cost 4"},{"from":"PCB","to":"SW2","toLabel":"Fa0/5"}]}
```

| Connection | Port at first end | Port at second end | Cable |
|---|---|---|---|
| PC-A to SW1 | FastEthernet0 | Fa0/5 | Copper straight-through |
| PC-B to SW2 | FastEthernet0 | Fa0/5 | Copper straight-through |
| SW1 to SW2 | Fa0/24 | Fa0/24 | Copper crossover |
| SW1 to SW3 | Gi0/1 | Gi0/1 | Copper crossover |
| SW2 to SW3 | Gi0/1 | Gi0/2 | Copper crossover |

| Device | IPv4 address | Mask | Default gateway |
|---|---|---|---|
| PC-A | 10.0.10.11 | 255.255.255.0 | Leave blank |
| PC-B | 10.0.10.12 | 255.255.255.0 | Leave blank |
| SW1, SW2, SW3 | None required | Not applicable | None required |

Both PCs are on one IP subnet and VLAN; they do not need a router. Switch management addresses are unnecessary for a local-console STP exercise. Use the CLI tab on each switch, decline any initial configuration dialog, and press Enter to reach the prompt.


## Step 1: Cable and configure all three switches

Place the devices, connect the five cables, then enter each complete block on its named switch. Every interswitch port is explicitly a trunk with native VLAN 999 and allowed VLANs 10 and 999. The VLAN 10 costs are explicit so the calculations remain reproducible. Do not disable spanning tree while cabling the triangle.

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
SW1(config)# end
SW1# show interfaces trunk
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
SW2(config)# spanning-tree vlan 10 priority 32768
SW2(config)# interface fastethernet0/24
SW2(config-if)# switchport mode trunk
SW2(config-if)# switchport trunk native vlan 999
SW2(config-if)# switchport trunk allowed vlan 10,999
SW2(config-if)# spanning-tree vlan 10 cost 19
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# switchport mode trunk
SW2(config-if)# switchport trunk native vlan 999
SW2(config-if)# switchport trunk allowed vlan 10,999
SW2(config-if)# spanning-tree vlan 10 cost 4
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# interface fastethernet0/5
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 10
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# end
SW2# show interfaces trunk
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
SW3(config)# spanning-tree vlan 10 priority 32768
SW3(config)# interface gigabitethernet0/1
SW3(config-if)# switchport mode trunk
SW3(config-if)# switchport trunk native vlan 999
SW3(config-if)# switchport trunk allowed vlan 10,999
SW3(config-if)# spanning-tree vlan 10 cost 4
SW3(config-if)# no shutdown
SW3(config-if)# exit
SW3(config)# interface gigabitethernet0/2
SW3(config-if)# switchport mode trunk
SW3(config-if)# switchport trunk native vlan 999
SW3(config-if)# switchport trunk allowed vlan 10,999
SW3(config-if)# spanning-tree vlan 10 cost 4
SW3(config-if)# no shutdown
SW3(config-if)# exit
SW3(config)# end
SW3# show interfaces trunk
SW3# show spanning-tree vlan 10
```

:::expected
Each switch reports `rstp` for VLAN 10. The interswitch ports form trunks with matching native and allowed VLANs; one redundant path does not forward VLAN 10. At this point every switch has configurable priority 32768, displayed as 32778 for VLAN 10, so the lowest actual MAC wins. Record the three actual Bridge ID MAC addresses; do not substitute the illustrative MACs from the lesson.
:::

```state
{"status":"Triangle cabled","cabled":true,"addressed":false,"led":true,"focus":["SW1","SW2","SW3"],"chips":[{"node":"SW1","text":"rstp · 32768"},{"node":"SW2","text":"rstp · 32768"},{"node":"SW3","text":"rstp · 32768"}],"rows":[["Spanning-tree mode","rstp for VLAN 10"],["Priority, all three","32768, shown as 32778"],["Root","Lowest actual MAC wins","dim"]]}
```

## Step 2: Address the PCs and establish connectivity

On each PC, open Desktop → IP Configuration, select Static, and enter the address and mask from the table. Leave gateway and DNS blank. From PC-A's Desktop → Command Prompt, run the following command, allowing initial ARP resolution and STP convergence before judging the result.

```text PC-A
ping 10.0.10.12
```

On SW1, inspect the access port and learned addresses.

```ios SW1
SW1# show vlan brief
SW1# show mac address-table dynamic
SW1# show spanning-tree vlan 10
```

:::expected
Both PCs belong to VLAN 10 through Fa0/5. After convergence and address resolution, repeated pings succeed. MAC addresses are learned along the current forwarding path; a switch does not need an IP address to forward these frames. If pings fail, fix cabling, PC masks, access membership, and trunk VLANs before proceeding.
:::

```state
{"status":"PCs in VLAN 10","tone":"ok","focus":["PCA","PCB"],"chips":[{"node":"PCA","text":"ping 10.0.10.12 · replies","tone":"ok"}],"rows":[["Access ports","Fa0/5 on SW1 and SW2 · VLAN 10"],["Gateway","Left blank"],["Pings","Succeed after convergence","ok"]]}
```

## Step 3: Choose the primary and secondary root

Before configuring root placement, write a prediction row for each switch: chosen root, total cost, root port, designated interswitch ports and alternate ports. Use SW2 priority 24576 and SW3 priority 28672 as the planned values; leave SW1 at 32768. Explain both the received-cost calculation and the designated-end comparison.

With the all-default priorities from Step 1, configure SW2 as primary, then SW3 as secondary. Do not run the primary macro on every switch. Observe the resulting numeric values, since the macro itself is not an ongoing protection mechanism.

```ios SW2
SW2# configure terminal
SW2(config)# spanning-tree vlan 10 root primary
SW2(config)# end
SW2# show spanning-tree vlan 10
```

```ios SW3
SW3# configure terminal
SW3(config)# spanning-tree vlan 10 root secondary
SW3(config)# end
SW3# show spanning-tree vlan 10
```

```ios SW1
SW1# show spanning-tree vlan 10
```

:::expected
SW2 has priority 24576 (displayed 24586), SW3 28672 (28682), SW1 32768 (32778). SW2 is the VLAN 10 root regardless of the actual MAC ordering. The stable roles below assume the complete topology and specified costs:

| Switch | Root path cost / root port | Other interswitch port |
|---|---|---|
| SW2 | 0 / none | Gi0/1 and Fa0/24 designated forwarding |
| SW3 | 4 / Gi0/2 | Gi0/1 designated forwarding |
| SW1 | 8 / Gi0/1 | Fa0/24 alternate discarding |

SW1's direct path costs 19, while the route through SW3 costs 4 + 4 = 8. A representative SW1 row is `Fa0/24 Altn BLK 19 128.24 P2p`. Read the actual output rather than requiring identical spacing or MACs. This is the baseline to which every experiment returns.
:::

```state
{"status":"SW2 is root","tone":"ok","focus":["SW2"],"chips":[{"node":"SW2","text":"Root · 24576","tone":"accent"},{"node":"SW3","text":"28672 · cost 4"},{"node":"SW1","text":"32768 · cost 8"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW2","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW2","text":"Root FWD"},{"node":"SW3","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW3","text":"Root FWD"},{"node":"SW1","peer":"SW2","text":"Altn BLK"}],"rows":[["SW1","8 via Gi0/1 · Fa0/24 alternate"],["SW3","4 via Gi0/2"],["Why SW1 blocks Fa0/24","19 direct against 4 + 4 = 8"]]}
```

## Step 4: Prefer the slower physical link with a lower configured cost

Predict the result before changing SW1 Fa0/24 to cost 2. You are changing an STP preference, not increasing that port's 100 Mbps bandwidth.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/24
SW1(config-if)# spanning-tree vlan 10 cost 2
SW1(config-if)# end
SW1# show spanning-tree vlan 10
```

```ios SW3
SW3# show spanning-tree vlan 10
```

:::expected
SW1 selects Fa0/24 as root port with total cost 2. On the SW1–SW3 segment, SW1 now advertises 2 while SW3 advertises 4, so SW1 Gi0/1 becomes designated and SW3 Gi0/1 becomes alternate. SW3 keeps Gi0/2 as root port: its direct cost 4 beats 4 + 2 = 6 through SW1. The change therefore affects another switch's role as well as SW1's local decision.
:::

```state
{"status":"Fa0/24 cost 2","tone":"warn","focus":["SW1","SW3"],"flows":[{"event":["SW1","SW3"],"wait":1.6,"tags":{"SW1":"Root port Fa0/24 · cost 2","SW3":"Gi0/1 becomes alternate"}}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW2","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW2","text":"Altn BLK","until":0},{"node":"SW1","peer":"SW2","text":"Root FWD","from":0},{"node":"SW1","peer":"SW3","text":"Root FWD","until":0},{"node":"SW1","peer":"SW3","text":"Desg FWD","from":0},{"node":"SW3","peer":"SW1","text":"Desg FWD","until":0},{"node":"SW3","peer":"SW1","text":"Altn BLK","from":0}],"rows":[["SW1 root port","Fa0/24 · cost 2"],["SW1–SW3 segment","SW1 designated, SW3 alternate"],["SW3 root port","Gi0/2: 4 beats 4 + 2 = 6"]]}
```

## Step 5: Restore the cost baseline

Restore the explicit value 19 before testing a physical failure. Confirm the baseline table, then repeat PC-A's ping.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/24
SW1(config-if)# spanning-tree vlan 10 cost 19
SW1(config-if)# end
SW1# show spanning-tree vlan 10
```

```ios SW3
SW3# show spanning-tree vlan 10
```

:::expected
SW1 returns to cost 8 through Gi0/1, with Fa0/24 alternate. SW3 Gi0/1 returns to designated. Restoring a documented explicit value is preferable here to guessing whether a different platform's automatic cost method matches the worksheet.
:::

```state
{"status":"Baseline restored","tone":"ok","focus":["SW1"],"flows":[{"event":["SW1","SW3"],"wait":1.6,"tags":{"SW1":"Fa0/24 cost 19 · alternate again","SW3":"Gi0/1 designated again"}},{"path":["PCA","SW1","SW3","SW2","PCB"],"back":true,"label":"Ping 10.0.10.12","tags":{"SW1":"Root port Gi0/1 · cost 8"}}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW2","peer":"SW3","text":"Desg FWD"},{"node":"SW3","peer":"SW2","text":"Root FWD"},{"node":"SW1","peer":"SW2","text":"Root FWD","until":0},{"node":"SW1","peer":"SW2","text":"Altn BLK","from":0},{"node":"SW1","peer":"SW3","text":"Desg FWD","until":0},{"node":"SW1","peer":"SW3","text":"Root FWD","from":0},{"node":"SW3","peer":"SW1","text":"Altn BLK","until":0},{"node":"SW3","peer":"SW1","text":"Desg FWD","from":0}],"rows":[["SW1","Cost 8 via Gi0/1 · Fa0/24 alternate","ok"],["SW3 Gi0/1","Designated","ok"],["PC-A to PC-B","Ping repeated","ok"]]}
```

## Step 6: Fail the SW3-to-root link

Before entering the commands, cross out SW3–SW2 on your diagram and fill a new three-switch prediction table. Include the designated end on SW1–SW3 and whether PC-A still has a physical forwarding path to PC-B.

Keep all cables connected. Administratively shut only SW3 Gi0/2, its link toward SW2. From PC-A, repeat `ping 10.0.10.12` while inspecting the new roles; a Packet Tracer PC ping sends a finite set of probes, so run it again as needed.

```ios SW3
SW3# configure terminal
SW3(config)# interface gigabitethernet0/2
SW3(config-if)# shutdown
SW3(config-if)# end
SW3# show spanning-tree vlan 10
```

```ios SW1
SW1# show spanning-tree vlan 10
```

:::expected
SW2 stays root because the FastEthernet link still connects it to SW1. SW1 uses Fa0/24 with cost 19 and becomes designated on Gi0/1. SW3 reaches SW2 through SW1: Gi0/1 is root port and total cost is 4 + 19 = 23. Pings may be lost during transition, then recover. Record what you observe; do not infer an exact universal convergence time from simulation animation.
:::

```state
{"status":"Rerouted over Fa0/24","tone":"warn","focus":["SW1","SW3"],"cut":[["SW2","SW3"]],"flows":[{"path":["PCA","SW1","SW3","SW2"],"label":"Ping during the transition","stop":"SW3","stopText":"Probe lost · Gi0/2 is down"},{"event":["SW1","SW3"],"tags":{"SW1":"Fa0/24 alternate → root port","SW3":"Root port Gi0/1 · 4 + 19 = 23"}},{"path":["PCA","SW1","SW2","PCB"],"back":true,"label":"Ping after it","tags":{"SW1":"Root port Fa0/24 · cost 19"}}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW1","peer":"SW2","text":"Altn BLK","until":1},{"node":"SW1","peer":"SW2","text":"Root FWD","from":1},{"node":"SW1","peer":"SW3","text":"Root FWD","until":1},{"node":"SW1","peer":"SW3","text":"Desg FWD","from":1},{"node":"SW3","peer":"SW1","text":"Desg FWD","until":1},{"node":"SW3","peer":"SW1","text":"Root FWD","from":1}],"rows":[["Root","SW2, still reached over Fa0/24"],["SW1","Fa0/24 root · cost 19"],["SW3","Gi0/1 root · cost 23"],["Pings","May be lost in transition, then recover","warn"]]}
```

## Step 7: Restore the failed link

Re-enable the exact interface you shut, then verify the baseline on both non-root switches.

```ios SW3
SW3# configure terminal
SW3(config)# interface gigabitethernet0/2
SW3(config-if)# no shutdown
SW3(config-if)# end
SW3# show spanning-tree vlan 10
```

```ios SW1
SW1# show spanning-tree vlan 10
```

:::expected
SW3 again uses Gi0/2 with total cost 4; SW1 uses Gi0/1 with total cost 8. SW1 Fa0/24 is alternate. Confirm ping connectivity before moving to the root-election experiment.
:::

```state
{"status":"Link restored","tone":"ok","focus":["SW3","SW1"],"flows":[{"event":["SW3","SW1"],"wait":1.6,"tags":{"SW3":"Gi0/2 root port again · cost 4","SW1":"Root port Gi0/1 · cost 8"}},{"path":["PCA","SW1","SW3","SW2","PCB"],"back":true,"label":"Ping 10.0.10.12"}],"roles":[{"node":"SW2","peer":"SW1","text":"Desg FWD"},{"node":"SW2","peer":"SW3","text":"Desg FWD","from":0},{"node":"SW3","peer":"SW2","text":"Root FWD","from":0},{"node":"SW1","peer":"SW2","text":"Root FWD","until":0},{"node":"SW1","peer":"SW2","text":"Altn BLK","from":0},{"node":"SW1","peer":"SW3","text":"Desg FWD","until":0},{"node":"SW1","peer":"SW3","text":"Root FWD","from":0},{"node":"SW3","peer":"SW1","text":"Root FWD","until":0},{"node":"SW3","peer":"SW1","text":"Desg FWD","from":0}],"rows":[["SW3","Gi0/2 · cost 4","ok"],["SW1","Gi0/1 · cost 8 · Fa0/24 alternate","ok"],["PC-A to PC-B","Confirmed","ok"]]}
```

## Step 8: Introduce a lower-priority root

Temporarily give SW1 configurable priority 4096. SW2's previous `root primary` command does not prevent this change. Predict the root and both other switches' preferred paths first.

```ios SW1
SW1# configure terminal
SW1(config)# spanning-tree vlan 10 priority 4096
SW1(config)# end
SW1# show spanning-tree vlan 10
```

```ios SW2
SW2# show spanning-tree vlan 10
```

```ios SW3
SW3# show spanning-tree vlan 10
```

:::expected
SW1 becomes root with displayed priority 4106. SW3's Gi0/1 is root port at cost 4. SW2 reaches SW1 through SW3 using Gi0/1 at total cost 8; SW2 Fa0/24 is alternate because its direct cost is 19. SW2's configured numeric priority remains 24576.
:::

```state
{"status":"SW1 is root","tone":"warn","focus":["SW1"],"flows":[{"event":["SW1","SW2"],"wait":1.6,"tags":{"SW1":"Root bridge · shown 4106","SW2":"Root port Gi0/1 · cost 8"}}],"chips":[{"node":"SW1","text":"Root · 4096","tone":"accent","from":0},{"node":"SW2","text":"Root · 24576","tone":"accent","until":0}],"roles":[{"node":"SW1","peer":"SW2","text":"Altn BLK","until":0},{"node":"SW1","peer":"SW2","text":"Desg FWD","from":0},{"node":"SW1","peer":"SW3","text":"Root FWD","until":0},{"node":"SW1","peer":"SW3","text":"Desg FWD","from":0},{"node":"SW3","peer":"SW1","text":"Desg FWD","until":0},{"node":"SW3","peer":"SW1","text":"Root FWD","from":0},{"node":"SW3","peer":"SW2","text":"Root FWD","until":0},{"node":"SW3","peer":"SW2","text":"Desg FWD","from":0},{"node":"SW2","peer":"SW3","text":"Desg FWD","until":0},{"node":"SW2","peer":"SW3","text":"Root FWD","from":0},{"node":"SW2","peer":"SW1","text":"Desg FWD","until":0},{"node":"SW2","peer":"SW1","text":"Altn BLK","from":0}],"rows":[["Root","SW1 · priority 4096 (4106)"],["SW3","Gi0/1 root · cost 4"],["SW2","Gi0/1 root · cost 8 · Fa0/24 alternate"],["SW2 configured priority","Still 24576"]]}
```

## Step 9: Restore, verify, and save

Return SW1 to priority 32768 and verify the Step 3 baseline. Save each device configuration, accepting the default destination filename when prompted. Then use File → Save As to save the entire topology as `stp-baseline.pkt`; saving only the switch configuration does not save the Packet Tracer workspace file.

```ios SW1
SW1# configure terminal
SW1(config)# spanning-tree vlan 10 priority 32768
SW1(config)# end
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
All switches identify SW2 as VLAN 10 root. The root costs are SW1 8, SW2 0, SW3 4, and the only blocked interswitch end for VLAN 10 is SW1 Fa0/24. PC-A reaches PC-B. Keep the worksheet and saved project together so a later result can be compared with a known configuration.

Your evidence record must cover five states: baseline, changed receiving cost, failed link, changed root, and restored baseline. For each, identify the root, root cost/port on both non-root switches, both roles on the redundant segment, and a fresh PC test. Mark predictions separately from observations. A command accepted without the expected operational result is not completion.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["SW2"],"flows":[{"event":["SW2","SW1"],"wait":1.6,"tags":{"SW2":"Root again · 24576","SW1":"Root port Gi0/1 · cost 8"}},{"path":["PCA","SW1","SW3","SW2","PCB"],"back":true,"label":"Ping 10.0.10.12"}],"chips":[{"node":"SW1","text":"Root · 4096","tone":"accent","until":0},{"node":"SW2","text":"Root · 24576","tone":"accent","from":0}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD","until":0},{"node":"SW1","peer":"SW2","text":"Altn BLK","from":0},{"node":"SW1","peer":"SW3","text":"Desg FWD","until":0},{"node":"SW1","peer":"SW3","text":"Root FWD","from":0},{"node":"SW3","peer":"SW1","text":"Root FWD","until":0},{"node":"SW3","peer":"SW1","text":"Desg FWD","from":0},{"node":"SW3","peer":"SW2","text":"Desg FWD","until":0},{"node":"SW3","peer":"SW2","text":"Root FWD","from":0},{"node":"SW2","peer":"SW3","text":"Root FWD","until":0},{"node":"SW2","peer":"SW3","text":"Desg FWD","from":0},{"node":"SW2","peer":"SW1","text":"Altn BLK","until":0},{"node":"SW2","peer":"SW1","text":"Desg FWD","from":0}],"rows":[["Root costs","SW1 8 · SW2 0 · SW3 4","ok"],["Blocked end","SW1 Fa0/24 only","ok"],["Saved","Each switch · stp-baseline.pkt","ok"]]}
```

## Troubleshooting

- Wrong root: compare the complete Root ID and Bridge ID on all three switches; check the priority for VLAN 10, not VLAN 1 or 999.
- Correct root but unexpected path: compare the local cost with the received neighbor cost. Confirm the port labels and any leftover cost override.
- VLAN 10 missing on a link: inspect `show interfaces trunk` and VLAN existence at both ends. A native-VLAN mismatch is a trunk fault to correct before analyzing STP roles.
- A command is rejected: verify the prompt first. For a rejected optional show command, use the full `show spanning-tree vlan 10` and `show running-config`. Do not replace missing simulation features with guessed observations.
- PC ping fails while the tree matches: verify PC masks and VLAN 10 access ports, allow ARP resolution, and inspect learned MAC addresses. STP does not configure host addressing.

## Challenge

Work in a copy of the restored baseline. Keep VLAN 10, its PCs, costs and priorities unchanged. Add a second instance with these requirements before opening the solution:

- Create VLAN 20 on all three switches and add it to every existing interswitch allowed list, preserving VLANs 10 and 999.
- VLAN 20 configurable priorities: SW1 8192, SW2 16384, SW3 24576.
- For VLAN 20 only, use receiving cost 6 on both ends of SW1–SW2 and cost 4 on each end of both Gigabit links.
- Add PC-C to SW1 Fa0/6 and PC-D to SW2 Fa0/6 using straight-through cables. Assign 10.0.20.11/24 and 10.0.20.12/24, with no gateway or DNS, and place both ports in VLAN 20.

Predict the VLAN 20 root, both non-root costs/root ports, and both roles on SW2–SW3. Write the needed configuration yourself. After applying it, verify each prediction, both new hosts’ communication, and the unchanged VLAN 10 baseline. A correct answer must name the affected VLAN; one trunk can have different roles in the two instances.

:::solution
SW1 becomes the VLAN 20 root. SW2 uses Fa0/24 at cost 6 instead of 8 through SW3. SW3 uses Gi0/1 at cost 4. On SW2–SW3, SW3 advertises 4 against SW2’s 6, so SW3 Gi0/2 is designated and SW2 Gi0/1 is alternate. SW2 remains the root for VLAN 10.

One complete addition follows; it assumes all earlier baseline configuration remains in place.

```ios SW1
SW1# configure terminal
SW1(config)# vlan 20
SW1(config-vlan)# name CHALLENGE
SW1(config-vlan)# exit
SW1(config)# spanning-tree vlan 20 priority 8192
SW1(config)# interface fastethernet0/24
SW1(config-if)# switchport trunk allowed vlan add 20
SW1(config-if)# spanning-tree vlan 20 cost 6
SW1(config-if)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan add 20
SW1(config-if)# spanning-tree vlan 20 cost 4
SW1(config-if)# exit
SW1(config)# interface fastethernet0/6
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 20
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces trunk
SW1# show spanning-tree vlan 20
SW1# show spanning-tree vlan 10
```

```ios SW2
SW2# configure terminal
SW2(config)# vlan 20
SW2(config-vlan)# name CHALLENGE
SW2(config-vlan)# exit
SW2(config)# spanning-tree vlan 20 priority 16384
SW2(config)# interface fastethernet0/24
SW2(config-if)# switchport trunk allowed vlan add 20
SW2(config-if)# spanning-tree vlan 20 cost 6
SW2(config-if)# exit
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# switchport trunk allowed vlan add 20
SW2(config-if)# spanning-tree vlan 20 cost 4
SW2(config-if)# exit
SW2(config)# interface fastethernet0/6
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 20
SW2(config-if)# no shutdown
SW2(config-if)# end
SW2# show interfaces trunk
SW2# show spanning-tree vlan 20
SW2# show spanning-tree vlan 10
```

```ios SW3
SW3# configure terminal
SW3(config)# vlan 20
SW3(config-vlan)# name CHALLENGE
SW3(config-vlan)# exit
SW3(config)# spanning-tree vlan 20 priority 24576
SW3(config)# interface gigabitethernet0/1
SW3(config-if)# switchport trunk allowed vlan add 20
SW3(config-if)# spanning-tree vlan 20 cost 4
SW3(config-if)# exit
SW3(config)# interface gigabitethernet0/2
SW3(config-if)# switchport trunk allowed vlan add 20
SW3(config-if)# spanning-tree vlan 20 cost 4
SW3(config-if)# end
SW3# show interfaces trunk
SW3# show spanning-tree vlan 20
SW3# show spanning-tree vlan 10
```

Set the two new PCs through Desktop → IP Configuration → Static using the supplied addresses and mask 255.255.255.0. From PC-C, ping 10.0.20.12; from PC-D, ping 10.0.20.11. Repeat PC-A to 10.0.10.12. Record actual VLAN-specific roles and explain why SW2 Gi0/1 can be designated in VLAN 10 but alternate in VLAN 20.

Save each switch with `copy running-config startup-config`, accept its filename prompt and wait for completion. Save the separate project as `14-two-vlan-challenge.pkt`. The original baseline file remains your clean starting point; reopen it for later chapters rather than carrying unrecorded challenge changes forward.
:::
