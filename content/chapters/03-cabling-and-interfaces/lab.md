---
title: Establish a baseline and diagnose Ethernet link faults
environment: mixed
devices: ["2 × 2960 switches", "2 × PC", "Paper optical and cable-test readings"]
minutes: 50
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.


Build one small LAN in Packet Tracer, verify it, and introduce one interface fault at a time. You will compare both ends of the same link, restore service between tests, and finish with supplied fiber and cable-test evidence.

Packet Tracer does not reproduce every hardware counter, physical cable defect or optical power measurement. The configured speed/duplex and administrative states are the main observations in this lab. If the simulated traffic or error counters do not behave like hardware, record that limit and use the lesson's representative examples to explain the real mechanism. The optical exercise is paper-based; no optical meter or transceiver is required.

## Topology

Use two **2960** switches, named SW1 and SW2, and two standard **PC** end devices, named PC-A and PC-B. Start a new file. The interswitch link deliberately uses FastEthernet ports so the 10/100 duplex exercise applies.

```diagram
{"type":"topology","title":"Fig 03.L1 — One LAN with a testable interswitch link","caption":"Both PCs share one subnet; the tests require switching but no router or default gateway.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"10.0.30.11/24","x":1,"y":3},{"id":"S1","kind":"switch","label":"SW1","x":4,"y":3},{"id":"S2","kind":"switch","label":"SW2","x":8,"y":3},{"id":"B","kind":"pc","label":"PC-B","sub":"10.0.30.12/24","x":11,"y":3}],"links":[{"from":"A","to":"S1","toLabel":"Fa0/1","label":"straight-through"},{"from":"S1","to":"S2","fromLabel":"Fa0/24","toLabel":"Fa0/24","label":"crossover"},{"from":"S2","to":"B","fromLabel":"Fa0/1","label":"straight-through"}]}
```

| Device and interface | Connection or address | Cable or mask |
|---|---|---|
| PC-A FastEthernet0 | SW1 FastEthernet0/1 | Copper straight-through |
| SW1 FastEthernet0/24 | SW2 FastEthernet0/24 | Copper crossover |
| SW2 FastEthernet0/1 | PC-B FastEthernet0 | Copper straight-through |
| PC-A | `10.0.30.11` | `255.255.255.0` |
| PC-B | `10.0.30.12` | `255.255.255.0` |

Leave both PCs' default gateway and DNS fields blank. No switch management IP, trunk, VLAN change or route is needed. The switch ports remain in their default VLAN 1. Do not add a second interswitch link.

## Step 1: Cable, name and address the network

Connect the three cables exactly as listed. On each PC, open **Desktop → IP Configuration**, choose **Static**, and enter its address and mask. Clear any leftover gateway or DNS address if you reused a device.

Open SW1's CLI, press Enter and decline the initial configuration dialog if present. Enter its baseline configuration.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface fastethernet0/1
SW1(config-if)# description PC-A
SW1(config-if)# no shutdown
SW1(config-if)# interface fastethernet0/24
SW1(config-if)# description To-SW2
SW1(config-if)# speed auto
SW1(config-if)# duplex auto
SW1(config-if)# no shutdown
SW1(config-if)# end
```

Configure SW2 separately.

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# interface fastethernet0/1
SW2(config-if)# description PC-B
SW2(config-if)# no shutdown
SW2(config-if)# interface fastethernet0/24
SW2(config-if)# description To-SW1
SW2(config-if)# speed auto
SW2(config-if)# duplex auto
SW2(config-if)# no shutdown
SW2(config-if)# end
```

:::expected
The device prompts and cable endpoints match the diagram. After the switch ports initialize, all three links should be usable. A crossover is specified so the lab does not depend on auto-MDIX support during forced-setting tests. Do not deliberately use a wrong cable and assume it must fail; supported auto-MDIX can make either copper arrangement work.
:::

```state
{"status":"Cabled · named · addressed","cabled":true,"addressed":true,"led":true,"focus":["S1","S2"],"chips":[{"node":"S1","text":"SW1#"},{"node":"S2","text":"SW2#"}],"rows":[["Cables","2 straight-through · 1 crossover"],["Fa0/24, both ends","speed auto · duplex auto"],["PC gateway and DNS","Left blank"]]}
```

## Step 2: Record the working baseline

On PC-A's **Desktop → Command Prompt**, enter `ping 10.0.30.12`. Retry once if initial address resolution loses a first request. Repeat the test from PC-B to `10.0.30.11`. Then inspect the interswitch port at both ends.

```ios SW1
SW1# show interfaces status
SW1# show interfaces fastethernet0/24
SW1# show running-config
```

```ios SW2
SW2# show interfaces status
SW2# show interfaces fastethernet0/24
SW2# show running-config
```

Write down each end's administrative state, operational speed, duplex and displayed error counters. Find the FastEthernet0/24 stanza in each running configuration. Default automatic settings may be omitted from that display.

:::expected
Both PCs receive replies on a repeated test. Both interswitch ends should operate at 100 Mbps full duplex, with the compact display commonly showing `a-full` and `a-100`. Detailed output should show an up physical and line-protocol state. If a compact display command is unavailable, use the detailed interface output.

Save the working topology as `03-interfaces-baseline.pkt`. Keep your first counter readings; later comparisons need a baseline. No conclusion should depend on all counters being exactly zero or on one particular simulator output layout.
:::

```state
{"status":"Baseline recorded","tone":"ok","focus":["S1","S2"],"flows":[{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings 10.0.30.12"},{"path":["B","S2","S1","A"],"back":true,"label":"PC-B pings 10.0.30.11"}],"roles":[{"node":"S1","peer":"S2","text":"a-full a-100","tone":"ok"},{"node":"S2","peer":"S1","text":"a-full a-100","tone":"ok"}],"rows":[["PC-A ↔ PC-B","Replies both ways","ok"],["Fa0/24, both ends","100 Mbps full duplex","ok"],["Physical / line protocol","up / up","ok"],["Saved as","03-interfaces-baseline.pkt"]]}
```

## Step 3: Identify an administrative shutdown

Disable **SW1's** interswitch port without touching the cable.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/24
SW1(config-if)# shutdown
SW1(config-if)# end
SW1# show interfaces fastethernet0/24
```

Inspect the far end separately.

```ios SW2
SW2# show interfaces fastethernet0/24
SW2# show running-config
```

:::expected
SW1 should identify its interface as `administratively down`. SW2 loses the link but has not been administratively shut down; its configuration still lacks `shutdown` on this port. A down state at SW2 therefore does not tell you whether SW1 was disabled, disconnected or powered off. Inspecting both ends resolves that ambiguity. PC-A's ping to PC-B fails while the port is disabled.
:::

```state
{"status":"SW1 Fa0/24 shut down","tone":"bad","focus":["S1","S2"],"cut":[["S1","S2"]],"flows":[{"path":["A","S1","S2","B"],"label":"PC-A pings PC-B","stop":"S1","stopText":"Port disabled"}],"roles":[{"node":"S1","peer":"S2","text":"admin down","tone":"bad"},{"node":"S2","peer":"S1","text":"down","tone":"bad"}],"rows":[["SW1 Fa0/24","administratively down","bad"],["SW2 Fa0/24","Down, but not shut down"],["PC-A to PC-B","Ping fails","bad"]]}
```

## Step 4: Restore the administratively disabled port

Enable the SW1 port you just identified.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/24
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces fastethernet0/24
```

On SW2, run `show interfaces fastethernet0/24`. Repeat the PC-to-PC ping after the links become ready.

:::expected
Both interswitch ports return to an operational state, and repeated pings receive replies. The repair targeted the port whose administrative state was wrong. If the test still fails, collect fresh evidence rather than assuming that command acceptance completed the repair.
:::

```state
{"status":"Port restored","tone":"ok","focus":["S1"],"flows":[{"event":["S1","S2"],"wait":1.6,"tags":{"S1":"no shutdown","S2":"Operational"}},{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings PC-B"}],"rows":[["SW1 Fa0/24","no shutdown · operational","ok"],["SW2 Fa0/24","Operational again","ok"],["PC-A to PC-B","Replies again","ok"]]}
```

## Step 5: Introduce a controlled duplex mismatch

This is an isolated lab fault, not a recommended production configuration. Force **SW1** FastEthernet0/24 to 100 Mbps half duplex.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/24
SW1(config-if)# speed 100
SW1(config-if)# duplex half
SW1(config-if)# end
SW1# show interfaces fastethernet0/24
```

Now force **SW2** FastEthernet0/24 to 100 Mbps full duplex.

```ios SW2
SW2# configure terminal
SW2(config)# interface fastethernet0/24
SW2(config-if)# speed 100
SW2(config-if)# duplex full
SW2(config-if)# end
SW2# show interfaces fastethernet0/24
```

Leave both settings in place while you inspect them. Repeat pings in each direction and compare new counter readings with Step 2. Do not assume a few small ping requests provide enough traffic to expose every performance symptom.

:::expected
The two configurations and operational displays should show matching speed but opposing duplex settings. A real Ethernet link can remain up in this condition. Under traffic, the half-duplex end may accumulate collisions or late collisions, while the other end may see receive errors.

The simulator may show successful pings and unchanged counters. That does not make the mismatch correct. The decisive evidence is the half/full disagreement on the two ends of this one connection. Record the actual behavior rather than inventing a target counter value.

If the simulator omits useful counter behavior, interpret this supplied example separately: before a transfer the half-duplex end has 10 collisions and 0 late collisions; afterward it has 420 and 180. The increases are 410 collisions and 180 late collisions. These readings are consistent with the documented mismatch, but the opposing duplex settings establish it directly. Do not record these supplied totals as measurements.
:::

```state
{"status":"Duplex mismatch","tone":"bad","focus":["S1","S2"],"flows":[{"event":["S1","S2"],"wait":1.6,"tags":{"S1":"Forced half","S2":"Forced full"}}],"roles":[{"node":"S1","peer":"S2","text":"half 100","tone":"warn","from":0},{"node":"S2","peer":"S1","text":"full 100","tone":"warn","from":0}],"rows":[["SW1, the half-duplex end","May log collisions or late collisions"],["SW2, the full-duplex end","May see receive errors"],["Decisive evidence","Half/full disagreement","bad"],["Simulator pings","May still succeed","warn"]]}
```

## Step 6: Restore duplex agreement and test again

Restore automatic settings on each switch, using the block for that device.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/24
SW1(config-if)# speed auto
SW1(config-if)# duplex auto
SW1(config-if)# end
SW1# show interfaces fastethernet0/24
```

```ios SW2
SW2# configure terminal
SW2(config)# interface fastethernet0/24
SW2(config-if)# speed auto
SW2(config-if)# duplex auto
SW2(config-if)# end
SW2# show interfaces fastethernet0/24
```

:::expected
Both ends return to 100 Mbps full duplex after the link settles, and repeated pings work in both directions. Old error totals need not disappear: they are historical counters. Compare new readings over a new test interval. If the display still shows half duplex, inspect the configuration at both physical ends before proceeding.
:::

```state
{"status":"Duplex agrees again","tone":"ok","focus":["S1","S2"],"flows":[{"event":["S1","S2"],"wait":1.6,"tags":{"S1":"Back to auto","S2":"Back to auto"}},{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings PC-B"},{"path":["B","S2","S1","A"],"back":true,"label":"PC-B pings PC-A"}],"roles":[{"node":"S1","peer":"S2","text":"half 100","tone":"warn","until":0},{"node":"S1","peer":"S2","text":"a-full a-100","tone":"ok","from":0},{"node":"S2","peer":"S1","text":"full 100","tone":"warn","until":0},{"node":"S2","peer":"S1","text":"a-full a-100","tone":"ok","from":0}],"rows":[["Fa0/24, both ends","100 Mbps full duplex","ok"],["Pings","Work in both directions","ok"],["Old error totals","Historical · compare a new interval"]]}
```

## Step 7: Diagnose supplied physical-layer evidence

These cases are paper exercises. Use the module facts in the lesson and the readings supplied here; do not attempt to generate optical measurements in Packet Tracer.

| Case | Evidence | Decision to make |
|---|---|---|
| A | A 350 m OM3 path with 10GBASE-SR modules at both ends; the documented OM3 limit is 300 m | Is this path within the specified reach? |
| B | Compatible duplex modules are documented, but strand 1 connects Tx to Tx and strand 2 connects Rx to Rx | What connection must be corrected? |
| C | Receive reading −16 dBm; supplied acceptable range −12 through −1 dBm | Is received power within range, and what should be investigated? |
| D | A basic continuity tester passes pins 1–8, but a better tester reports a split pair | Why does the basic result not clear the cable? |
| E | A new 1 Gbps copper run measures 130 m including patch leads | What should be checked before blaming the IP configuration? |
| F | One FastEthernet end is forced to 10/full; its peer is forced to 100/full | Can the physical link operate with these settings? |

:::expected
A exceeds the supplied OM3 reach; use a design whose fiber and optics support the distance, such as suitable OM4 within the stated SR specification, after verifying the whole installation. B requires Tx at each end to reach Rx at the other. C is below the low limit: inspect the transmitter, path, connectors, polarity and compatibility rather than naming one unproven cause. D has the wrong physical pairing despite pin continuity, which can harm signal performance. E exceeds the normal 100 m channel design limit; verify measurement and redesign the physical path or select suitable fiber. F has a forced-speed mismatch despite matching duplex; coordinate compatible settings at both ends before retesting. Changing an IP address cannot repair it.
:::

```state
{"status":"Paper cases A–F","roles":[{"node":"S1","peer":"S2","text":"a-full a-100","tone":"ok"},{"node":"S2","peer":"S1","text":"a-full a-100","tone":"ok"}],"rows":[["Cases A–F","Decided on paper"],["Optical readings","Supplied, not generated in PT"],["Packet Tracer LAN","Unchanged since Step 6"]]}
```

## Step 8: Preserve the restored baseline

Confirm both interswitch ends still use automatic speed and duplex and that neither is shut down. Repeat PC-A to PC-B and the reverse ping, then save each device separately:

```ios SW1
SW1# copy running-config startup-config
```

Accept the destination with Enter and wait for completion before opening SW2.

```ios SW2
SW2# copy running-config startup-config
```

:::expected
Accept SW2's destination and save the project as `03-interfaces-complete.pkt`. Keep the baseline, fault-state and recovery readings. A useful record names both ends, identifies the changed setting, distinguishes new counter increments from historical totals, and includes a successful retest.
:::

```state
{"status":"Restored baseline saved","tone":"ok","focus":["S1","S2"],"flows":[{"path":["A","S1","S2","B"],"back":true,"label":"PC-A pings PC-B"},{"path":["B","S2","S1","A"],"back":true,"label":"PC-B pings PC-A"}],"roles":[{"node":"S1","peer":"S2","text":"a-full a-100","tone":"ok"},{"node":"S2","peer":"S1","text":"a-full a-100","tone":"ok"}],"chips":[{"node":"S1","text":"SW1#","tone":"ok"},{"node":"S2","text":"SW2#","tone":"ok"}],"rows":[["Fa0/24, both ends","Auto speed and duplex · not shut","ok"],["Pings","Succeed both ways","ok"],["Startup configuration","Saved on SW1 and SW2","ok"],["Project file","03-interfaces-complete.pkt"]]}
```

## Troubleshooting

- **No baseline ping:** verify PC addresses and masks, device power and all three cable endpoints. These PCs are on the same LAN and do not need a gateway.
- **A CLI command is rejected:** verify the prompt and port. Use the 2960 FastEthernet0/24 interfaces for these 10/100 tests, not a fixed-speed fiber interface.
- **A port is up but pings fail:** inspect the other ports in the path and endpoint settings. Local link-up is only one part of reachability.
- **Counters do not change during the mismatch:** record the simulator result. A mismatch is identified by comparing duplex at both ends, not by waiting for a specific synthetic error total.
- **Recovery commands seem ineffective:** inspect both switches' running configurations and detailed interface state. Changing only one end can leave the previous fault in place.
- **A physical optical link remains down after a repair:** recheck compatible module part numbers, supported ports, fiber grade, distance, polarity and measured receive levels. A successful command cannot prove an optical path is healthy.

## Challenge

With the recovery instructions closed, state which observations would justify calling a link repaired: matching operational settings on both ends and successful fresh traffic tests. Then attempt the optional variation below in a separate copy.

On paper first, predict the result of setting SW1 FastEthernet0/24 to `speed 100` and `duplex full` while leaving SW2 automatic. Which end may operate half duplex on a real 10/100 link, and why?

Test this optional variation in a copy of your Packet Tracer file. Compare the two operational displays, document any simulator limitation, then restore both ends to `speed auto` and `duplex auto`. Finish by proving communication works. Do not change the PCs' addresses or cable type during this test.

:::solution
The automatic SW2 end can detect 100 Mbps but cannot infer full duplex from the nonnegotiating forced end, so it can use half duplex. SW1 remains full duplex. The link can be up despite disagreement. After both ends are restored to automatic settings, they should agree on 100 Mbps full duplex and repeated pings should succeed. If Packet Tracer does not model that fallback, the correct written explanation still distinguishes the documented hardware behavior from what the simulation displayed.
:::
