---
title: Build, fault, and restore Layer 2 and Layer 3 LACP bundles
environment: packet-tracer
devices: ["2 × Catalyst 2960-24TT (SW1, SW2)", "2 × PC-PT (PC-A, PC-B)", "2 × Catalyst 3560-24PS (D1, D2) for a separate Layer 3 topology"]
minutes: 75
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a two-member Layer 2 trunk, verify each member, and observe a member failure separately from a negotiation failure. Then create a routed port channel in a second file. These instructions and representative states have been checked against Cisco configuration guidance; this exercise has not been executed in Packet Tracer during this review.

## Topology

```diagram
{"type":"topology","title":"Layer 2 LACP lab","caption":"Two FastEthernet links form Po1; both PCs use access VLAN 10.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"10.13.10.11/24","x":1,"y":3},{"id":"S1","kind":"switch","label":"SW1","x":4,"y":3},{"id":"S2","kind":"switch","label":"SW2","x":8,"y":3},{"id":"B","kind":"pc","label":"PC-B","sub":"10.13.10.12/24","x":11,"y":3}],"links":[{"from":"A","to":"S1","toLabel":"Fa0/1"},{"from":"S1","to":"S2","label":"Po1: Fa0/23 + Fa0/24","accent":true},{"from":"S2","to":"B","fromLabel":"Fa0/1"}]}
```

| Device and port | Connected device and port | Cable | Purpose |
|---|---|---|---|
| PC-A FastEthernet0 | SW1 Fa0/1 | Copper straight-through | VLAN 10 endpoint |
| PC-B FastEthernet0 | SW2 Fa0/1 | Copper straight-through | VLAN 10 endpoint |
| SW1 Fa0/23 | SW2 Fa0/23 | Copper crossover | First Po1 member |
| SW1 Fa0/24 | SW2 Fa0/24 | Copper crossover | Second Po1 member |
| D1 Fa0/1 | D2 Fa0/1 | Copper crossover | Separate Layer 3 topology, first member |
| D1 Fa0/2 | D2 Fa0/2 | Copper crossover | Separate Layer 3 topology, second member |

Use the named models so that these interfaces exist. Auto-connect is acceptable if you inspect the chosen ports afterward. Do not substitute 3650 interface names into the 3560 instructions. Begin with new, empty devices. All physical members in this lab are FastEthernet: each is 100 Mbps, not 1 Gbps.

| Interface | IPv4 address | Mask | Gateway |
|---|---|---|---|
| PC-A FastEthernet0 | 10.13.10.11 | 255.255.255.0 | Leave blank |
| PC-B FastEthernet0 | 10.13.10.12 | 255.255.255.0 | Leave blank |
| D1 Port-channel1, second file | 10.13.12.1 | 255.255.255.252 | Not applicable |
| D2 Port-channel1, second file | 10.13.12.2 | 255.255.255.252 | Not applicable |

The PCs share a subnet, so this exercise needs no default gateway. The Layer 2 trunk carries VLAN 10 and uses VLAN 99 as its native VLAN. The Layer 3 bundle carries an IP subnet directly and has no trunk or native VLAN configuration.

## Step 1: Prepare the switches before connecting both uplinks

Place SW1, SW2, and the PCs. Connect the PC cables now; leave the two switch-to-switch cables disconnected until the selected members have been shut down below. This avoids creating temporary independent parallel links during configuration. Configure each device from its console.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# no ip domain-lookup
SW1(config)# vlan 10
SW1(config-vlan)# name USERS
SW1(config-vlan)# vlan 99
SW1(config-vlan)# name NATIVE
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# no shutdown
SW1(config-if)# interface range fastethernet0/23 - 24
SW1(config-if-range)# shutdown
SW1(config-if-range)# end
```

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# no ip domain-lookup
SW2(config)# vlan 10
SW2(config-vlan)# name USERS
SW2(config-vlan)# vlan 99
SW2(config-vlan)# name NATIVE
SW2(config-vlan)# exit
SW2(config)# interface fastethernet0/1
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 10
SW2(config-if)# no shutdown
SW2(config-if)# interface range fastethernet0/23 - 24
SW2(config-if-range)# shutdown
SW2(config-if-range)# end
```

Connect the two crossover uplinks exactly as the port table specifies. On each PC, use Desktop → IP Configuration and enter its address and mask. Leave gateway and DNS blank.

:::expected
Both VLANs exist on each switch. The PC ports belong to VLAN 10. Both uplink members remain administratively down, so the PCs cannot yet communicate across the switches.
:::

```state
{"status":"Uplinks shut","cut":[["S1","S2"]],"wake":["A","B"],"focus":["S1","S2"],"chips":[{"node":"S1","text":"Fa0/23-24 shut"},{"node":"S2","text":"Fa0/23-24 shut"}],"rows":[["VLANs, each switch","10 USERS · 99 NATIVE"],["PC ports","Fa0/1 · access VLAN 10"],["Uplink members","Administratively down"],["PC-A to PC-B","Not yet across the switches","dim"]]}
```

## Step 2: Configure LACP on both ends, then enable the links

Complete both configuration blocks before enabling any uplink. The 2960 uses 802.1Q; do not add a trunk encapsulation selection command that this model does not require.

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# switchport mode trunk
SW1(config-if-range)# switchport trunk native vlan 99
SW1(config-if-range)# switchport trunk allowed vlan 10,99
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 99
SW1(config-if)# switchport trunk allowed vlan 10,99
SW1(config-if)# no shutdown
SW1(config-if)# end
```

```ios SW2
SW2# configure terminal
SW2(config)# interface range fastethernet0/23 - 24
SW2(config-if-range)# switchport mode trunk
SW2(config-if-range)# switchport trunk native vlan 99
SW2(config-if-range)# switchport trunk allowed vlan 10,99
SW2(config-if-range)# channel-group 1 mode active
SW2(config-if-range)# exit
SW2(config)# interface port-channel 1
SW2(config-if)# switchport mode trunk
SW2(config-if)# switchport trunk native vlan 99
SW2(config-if)# switchport trunk allowed vlan 10,99
SW2(config-if)# no shutdown
SW2(config-if)# end
```

Now enable the members on both devices.

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
```

```ios SW2
SW2# configure terminal
SW2(config)# interface range fastethernet0/23 - 24
SW2(config-if-range)# no shutdown
SW2(config-if-range)# end
```

:::expected
After link initialization, negotiation, and any STP transition, both physical links should join Po1. Exact timing varies; verify the state in the next step instead of assuming a fixed waiting period.
:::

```state
{"status":"LACP active, both ends","focus":["S1","S2"],"flows":[{"event":["S1","S2"],"wait":1.2,"tags":{"S1":"Fa0/23-24 active · no shutdown","S2":"Fa0/23-24 active · no shutdown"}}],"chips":[{"node":"S1","text":"Po1 trunk · native 99"},{"node":"S2","text":"Po1 trunk · native 99"}],"rows":[["Members","Fa0/23-24 · channel-group 1 active"],["Po1 trunk","Native 99 · allowed 10,99"],["Bundle state","Verify in step 3","dim"]]}
```

## Step 3: Prove the logical link and both members work

Before collecting output, predict the logical type, number of bundled members, allowed VLANs, and PC reachability. Keep those as four separate acceptance checks; one reassuring flag cannot answer all four.

```ios SW1
SW1# show etherchannel summary
SW1# show etherchannel port-channel
SW1# show interfaces trunk
SW1# show spanning-tree vlan 10
SW1# show lacp neighbor
```

```ios SW2
SW2# show etherchannel summary
SW2# show interfaces trunk
SW2# show spanning-tree vlan 10
SW2# show lacp neighbor
```

Some Packet Tracer images omit `show lacp neighbor` or detailed fields in `show etherchannel port-channel`. Use the available summary, member configuration, and trunk output for the formation checks; inspect partner details on supporting IOS/CML hardware if necessary. Do not treat an unsupported show command as a failed bundle.

On PC-A open Desktop → Command Prompt and run `ping 10.13.10.12`; on PC-B run `ping 10.13.10.11`. Repeat after address resolution if the first attempt loses a packet. This tests reachability, not aggregate throughput.

:::expected
A representative healthy summary is `Po1(SU) LACP Fa0/23(P) Fa0/24(P)`. Your device supplies the actual flags and formatting. Po1 is a trunk with native VLAN 99 and allowed VLANs 10,99. STP represents the bundle as Po1; in this isolated two-switch topology it forwards VLAN 10 after convergence. Both PC pings succeed. Two 100-Mbps members provide up to 200 Mbps aggregate capacity per direction across suitably distributed traffic, but this ping does not measure it.
:::

```state
{"status":"Po1 up, two members","tone":"ok","focus":["S1","S2"],"flows":[{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings 10.13.10.12","tags":{"S1":"Po1 forwards VLAN 10 · tagged","S2":"Untagged out Fa0/1 · VLAN 10"}},{"path":["B","S2","S1","A"],"back":true,"label":"PC-B pings 10.13.10.11"}],"chips":[{"node":"S1","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok"},{"node":"S2","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok"}],"rows":[["Logical type","Po1(SU) · Layer 2, in use","ok"],["Bundled members","Fa0/23(P) Fa0/24(P)","ok"],["Po1 trunk","Native 99 · allowed 10,99","ok"],["PC pings","Both succeed · not a throughput test","ok"]]}
```

## Step 4: Fail one member and inspect the remaining capacity

Predict whether the bundle can remain in use, how many members should participate, and the remaining aggregate capacity. Then shut one member on SW1. Stop here and observe before doing the recovery step.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/23
SW1(config-if)# shutdown
SW1(config-if)# end
SW1# show etherchannel summary
```

```ios SW2
SW2# show etherchannel summary
```

Repeat the PC-A ping to PC-B. Inspect whether Fa0/24 remains bundled on both ends.

:::expected
With this lab's default configuration and no extra minimum-links policy, Po1 should remain in use through Fa0/24. Fa0/23 is no longer a forwarding member; the exact flag depends on device state. Aggregate link capacity has fallen from two 100-Mbps members to one. A brief interruption may occur, but no particular number of lost packets is guaranteed. Successful ping does not mean the missing member is healthy.
:::

```state
{"status":"Fa0/23 shut · Po1 up","tone":"warn","focus":["S1"],"flows":[{"event":["S1","S2"],"wait":1.2,"tags":{"S1":"Fa0/23 shut · Po1 stays in use","S2":"Po1 continues on Fa0/24"}},{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings 10.13.10.12","tags":{"S1":"Out Po1 on Fa0/24 · VLAN 10"}}],"chips":[{"node":"S1","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","until":0},{"node":"S1","text":"Po1 in use · Fa0/24 only","tone":"warn","from":0},{"node":"S2","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","until":0},{"node":"S2","text":"Po1 in use · Fa0/24 only","tone":"warn","from":0}],"rows":[["Po1","Still in use through Fa0/24"],["Fa0/23","No longer a forwarding member","warn"],["Capacity","One 100-Mbps member, not two","warn"],["PC-A to PC-B","Ping works · member still missing"]]}
```

## Step 5: Restore the failed member

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/23
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show etherchannel summary
```

```ios SW2
SW2# show etherchannel summary
```

First verify both members are bundled on both switches and repeat both PC pings. Then run `copy running-config startup-config` on SW1, complete its destination prompt, and wait for completion. Do the same on SW2 in its own CLI window. Save a Packet Tracer checkpoint as `13-lacp-l2-working.pkt`.

:::expected
Both members return to `(P)` and Po1 remains in use on both switches. PC-A and PC-B communicate. Keep this checkpoint before changing negotiation modes.
:::

```state
{"status":"Both members back","tone":"ok","focus":["S1"],"flows":[{"event":["S1","S2"],"wait":1.2,"tags":{"S1":"Fa0/23 no shutdown · rejoins Po1","S2":"Fa0/23 bundled again"}},{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings 10.13.10.12"},{"path":["B","S2","S1","A"],"back":true,"label":"PC-B pings 10.13.10.11"}],"chips":[{"node":"S1","text":"Po1 in use · Fa0/24 only","tone":"warn","until":0},{"node":"S1","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","from":0},{"node":"S2","text":"Po1 in use · Fa0/24 only","tone":"warn","until":0},{"node":"S2","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","from":0}],"rows":[["Members, both ends","Fa0/23(P) Fa0/24(P)","ok"],["PC-A ↔ PC-B","Both pings succeed","ok"],["Saved","Both switches · 13-lacp-l2-working.pkt","ok"]]}
```

## Step 6: Create a passive/passive negotiation fault

Before changing modes, predict whether the physical links can be up while no LACP bundle forms. This is an intentional fault in the isolated lab. On both switches, shut the members before removing and reapplying their group membership. Complete both blocks, then enable the members in the two subsequent blocks.

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# shutdown
SW1(config-if-range)# no channel-group
SW1(config-if-range)# channel-group 1 mode passive
SW1(config-if-range)# end
```

```ios SW2
SW2# configure terminal
SW2(config)# interface range fastethernet0/23 - 24
SW2(config-if-range)# shutdown
SW2(config-if-range)# no channel-group
SW2(config-if-range)# channel-group 1 mode passive
SW2(config-if-range)# end
```

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
SW1# show etherchannel summary
```

```ios SW2
SW2# configure terminal
SW2(config)# interface range fastethernet0/23 - 24
SW2(config-if-range)# no shutdown
SW2(config-if-range)# end
SW2# show etherchannel summary
```

Record the result before continuing. The physical trunk settings should remain as configured; inspect `show running-config` if the image behaves differently after group removal.

:::expected
Neither side initiates LACP, so a new LACP bundle cannot form. Your image may show individual, suspended, or down members. Whether an unbundled link forwards user traffic depends on platform and configuration; do not infer a universal result from this simulator. The fault is the passive/passive pairing even if some traffic still works.
:::

```state
{"status":"Passive/passive: no bundle","tone":"bad","focus":["S1","S2"],"flows":[{"event":["S1","S2"],"wait":1.2,"tags":{"S1":"mode passive · does not initiate","S2":"mode passive · does not initiate"}}],"chips":[{"node":"S1","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","until":0},{"node":"S1","text":"LACP passive · no bundle","tone":"bad","from":0},{"node":"S2","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","until":0},{"node":"S2","text":"LACP passive · no bundle","tone":"bad","from":0}],"rows":[["Both ends","channel-group 1 mode passive","bad"],["LACP bundle","Cannot form: neither side initiates","bad"],["Members","Individual, suspended or down"],["User traffic","Platform dependent · not assumed","dim"]]}
```

## Step 7: Diagnose a static/LACP mismatch on paper

Do not apply this asymmetric configuration to the live topology. Consider a separate record in which SW1 uses `channel-group 1 mode on` on both members and SW2 uses `channel-group 1 mode active`. All VLAN, speed, and duplex settings otherwise match. Explain why changing a timer cannot make this an LACP bundle.

:::solution Compare your diagnosis
SW1 is using static aggregation and does not negotiate LACP. SW2 expects an LACP partner. These are incompatible methods, not a slow negotiation. The correct design is matching compatible aggregation methods, such as active/active LACP. Static/on on both ends is a different supported design when configured consistently; it does not provide LACP's partner checks. No exact traffic or interface-state outcome is assumed for the asymmetric case.
:::

```state
{"status":"Paper diagnosis only","tone":"dim","focus":["S1","S2"],"chips":[{"node":"S1","text":"LACP passive · no bundle","tone":"bad"},{"node":"S2","text":"LACP passive · no bundle","tone":"bad"}],"rows":[["Paper record","SW1 mode on · SW2 mode active"],["Other settings","VLAN, speed and duplex match"],["To explain","Why a timer change cannot help","dim"],["Live lab","Unchanged · still passive/passive","bad"]]}
```

## Step 8: Restore LACP and save the Layer 2 exercise

Keep both pairs shut while changing their membership. Complete the configuration blocks before enabling either pair.

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# shutdown
SW1(config-if-range)# no channel-group
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# end
```

```ios SW2
SW2# configure terminal
SW2(config)# interface range fastethernet0/23 - 24
SW2(config-if-range)# shutdown
SW2(config-if-range)# no channel-group
SW2(config-if-range)# channel-group 1 mode active
SW2(config-if-range)# end
```

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
SW1# show etherchannel summary
SW1# show interfaces trunk
```

```ios SW2
SW2# configure terminal
SW2(config)# interface range fastethernet0/23 - 24
SW2(config-if-range)# no shutdown
SW2(config-if-range)# end
SW2# show etherchannel summary
SW2# show interfaces trunk
```

:::expected
Both members return to `(P)` on both ends, and the original trunk settings remain consistent. Repeat both PC pings. Then save each running configuration with `copy running-config startup-config`, completing one device's prompt before starting the other, and save `13-lacp-l2-complete.pkt`. Do not save the passive/passive fault as your final working state.
:::

```state
{"status":"LACP restored · saved","tone":"ok","focus":["S1","S2"],"flows":[{"event":["S1","S2"],"wait":1.2,"tags":{"S1":"mode active · members rejoin Po1","S2":"mode active · members rejoin Po1"}},{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings 10.13.10.12","tags":{"S1":"Po1 forwards VLAN 10 · tagged"}},{"path":["B","S2","S1","A"],"back":true,"label":"PC-B pings 10.13.10.11"}],"chips":[{"node":"S1","text":"LACP passive · no bundle","tone":"bad","until":0},{"node":"S1","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","from":0},{"node":"S2","text":"LACP passive · no bundle","tone":"bad","until":0},{"node":"S2","text":"Po1(SU) · Fa0/23(P) Fa0/24(P)","tone":"ok","from":0}],"rows":[["Both ends","LACP active · Fa0/23(P) Fa0/24(P)","ok"],["Po1 trunk","Native 99 · allowed 10,99","ok"],["PC pings","Both directions succeed","ok"],["Saved","Startup configs · 13-lacp-l2-complete.pkt","ok"]]}
```

## Step 9: Build and verify a routed port channel in a separate file

Create `13-lacp-l3.pkt` with two new Catalyst 3560-24PS switches. Connect Fa0/1 to Fa0/1 and Fa0/2 to Fa0/2 with crossover cables only after the member shutdown commands have been entered. The following blocks keep the members shut throughout configuration. Create the logical routed interface first, then add routed members. Addresses belong to Po1, not to Fa0/1 or Fa0/2.

```diagram
{"type":"topology","title":"Layer 3 LACP lab","caption":"In a separate file, crossover cables join D1 Fa0/1 to D2 Fa0/1 and Fa0/2 to Fa0/2; each address belongs to Po1.","nodes":[{"id":"D1","kind":"l3switch","label":"D1","sub":"Po1 10.13.12.1/30","x":3,"y":3},{"id":"D2","kind":"l3switch","label":"D2","sub":"Po1 10.13.12.2/30","x":9,"y":3}],"links":[{"from":"D1","to":"D2","label":"First Po1 member","fromLabel":"Fa0/1","toLabel":"Fa0/1","accent":true},{"from":"D1","to":"D2","label":"Second Po1 member","fromLabel":"Fa0/2","toLabel":"Fa0/2","accent":true}]}
```

```ios D1
Switch> enable
Switch# configure terminal
Switch(config)# hostname D1
D1(config)# ip routing
D1(config)# interface range fastethernet0/1 - 2
D1(config-if-range)# shutdown
D1(config-if-range)# exit
D1(config)# interface port-channel 1
D1(config-if)# no switchport
D1(config-if)# ip address 10.13.12.1 255.255.255.252
D1(config-if)# no shutdown
D1(config-if)# exit
D1(config)# interface range fastethernet0/1 - 2
D1(config-if-range)# no switchport
D1(config-if-range)# no ip address
D1(config-if-range)# channel-group 1 mode active
D1(config-if-range)# end
```

```ios D2
Switch> enable
Switch# configure terminal
Switch(config)# hostname D2
D2(config)# ip routing
D2(config)# interface range fastethernet0/1 - 2
D2(config-if-range)# shutdown
D2(config-if-range)# exit
D2(config)# interface port-channel 1
D2(config-if)# no switchport
D2(config-if)# ip address 10.13.12.2 255.255.255.252
D2(config-if)# no shutdown
D2(config-if)# exit
D2(config)# interface range fastethernet0/1 - 2
D2(config-if-range)# no switchport
D2(config-if-range)# no ip address
D2(config-if-range)# channel-group 1 mode active
D2(config-if-range)# end
```

Connect the links and enable both member pairs.

```ios D1
D1# configure terminal
D1(config)# interface range fastethernet0/1 - 2
D1(config-if-range)# no shutdown
D1(config-if-range)# end
```

```ios D2
D2# configure terminal
D2(config)# interface range fastethernet0/1 - 2
D2(config-if-range)# no shutdown
D2(config-if-range)# end
```

After both ends are enabled, predict the subnet route and location of the IP addresses, then verify each side separately:

```ios D1
D1# show etherchannel summary
D1# show ip interface brief
D1# show ip route
D1# ping 10.13.12.2
```

```ios D2
D2# show etherchannel summary
D2# show ip interface brief
D2# show ip route
D2# ping 10.13.12.1
```

Repeat the pings after any needed address resolution. If your Packet Tracer image rejects routed port-channel configuration despite using the named multilayer model, complete this step on a supporting 3560 IOS image in hardware or an equivalent IOS switching image in CML; retain the same logical design and map available ports. If no supporting environment is available, complete a supplied-evidence worksheet using the address table and representative summary below: identify the interface that owns each address, the connected prefix, the two bundled members, and why no remote route is needed for this peer test. Label that work as interpreted evidence. Do not replace the routed bundle with a Layer 2 trunk and claim to have tested Layer 3 EtherChannel.

:::expected
A representative summary is `Po1(RU) LACP Fa0/1(P) Fa0/2(P)`: routed and in use, with two bundled members. Po1 owns `.1/30` or `.2/30`; the physical members have no IP addresses. The connected route is `10.13.12.0/30` through Port-channel1, and each peer address responds to ping. No routing protocol or static route is required to reach the directly connected peer. Only after those checks pass, save D1 and D2 with `copy running-config startup-config`, completing each destination prompt separately, and save the second project.
:::

```state
{"topology":2,"status":"Routed Po1 up · peers reply","tone":"ok","focus":["D1","D2"],"flows":[{"event":["D1","D2"],"wait":1.2,"tags":{"D1":"Fa0/1-2 active · no shutdown","D2":"Fa0/1-2 active · no shutdown"}}],"chips":[{"node":"D1","text":"Po1(RU) · Fa0/1(P) Fa0/2(P)","tone":"ok","from":0},{"node":"D2","text":"Po1(RU) · Fa0/1(P) Fa0/2(P)","tone":"ok","from":0}],"rows":[["Po1","Routed, in use · Fa0/1(P) Fa0/2(P)","ok"],["IP addresses","On Po1 only · members have none","ok"],["Connected route","10.13.12.0/30 via Port-channel1","ok"],["Peer pings","Both reply · no routing protocol needed","ok"],["Saved","D1 and D2 startup · 13-lacp-l3.pkt","ok"]]}
```

## Evidence to keep

Keep both-end summaries, participating-member counts and the separate VLAN or IP service checks. Compare your predictions with the observed member-failure and negotiation-failure states. Explain why a passing ping does not establish full capacity. Mark any supplied-evidence fallback clearly; neither ping nor a representative summary is a throughput measurement.

## Troubleshooting

- **Po1 is up but only one member has `(P)`:** inspect both ends of the missing link. Check shutdown state, physical connectivity, speed/duplex, group membership, and local compatibility. A successful ping does not clear this fault.
- **Both ends are passive:** choose an active initiator. Do not try to repair the pairing by changing VLANs or group numbers.
- **Members are suspended after a trunk change:** compare the logical interface and all members. Restore the intended native VLAN and allowed list consistently, then verify the far-end trunk too.
- **Po1 is bundled but PC ping fails:** verify PC addresses/masks, access VLAN 10, VLAN existence, and allowed/forwarding VLANs. LACP formation does not configure those services.
- **Routed Po1 is down or lacks its connected route:** confirm both Po1 and members use `no switchport`, member flags are correct, the logical interface is enabled, and its address/mask is correct.
- **A show command is unsupported:** use the stated simulator fallback for that observation, and record the limit. An unavailable command is different from an observed protocol failure.

## Challenge

If routed EtherChannel is unavailable in your environment, continue the Step 9 worksheet fallback: write both endpoint command sequences and predict the summary, IP ownership, connected route and capacity checks. Label the submission as a plan, not an executed test. Otherwise, work from a copy of the successful Layer 3 project. Add a third physical member using Fa0/3 on each 3560, keeping the same Po1 addresses. Plan the cable, configuration mode, and verification before entering commands. Predict aggregate capacity and the limit for one flow when the load-balancing inputs consistently choose one member.

:::solution Check your third-member design
Use a crossover cable from D1 Fa0/3 to D2 Fa0/3. On each switch, enter privileged EXEC, then global configuration and `interface fastethernet0/3`. Apply `shutdown`, `no switchport`, `no ip address`, and `channel-group 1 mode active`. After both ends are ready and connected, apply `no shutdown` on each new member. Leave the existing Po1 addresses unchanged. Verify `Po1(RU)` with Fa0/1, Fa0/2, and Fa0/3 all `(P)`, then repeat peer pings. Three 100-Mbps members provide up to 300 Mbps aggregate link capacity per direction across appropriately distributed traffic; one stable hash-selected flow remains limited to one 100-Mbps member before overhead. Adding members does not require another IP subnet.
:::
