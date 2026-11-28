---
title: Build data and voice VLANs, identify assignment faults, and verify power requirements
environment: mixed
devices: ["1 × Catalyst 2960-24TT (SW1)", "3 × PC-PT (PC-A, PC-B, PC-C)", "1 × Printer-PT", "1 × Cisco 7960 IP phone with its external power adapter", "optional PoE observation: Catalyst 3650-24PS (SW2)"]
minutes: 50
---
You will split one switch into the lesson's user, printer and voice VLANs, then cause the two faults that catch people out: a VLAN that has been deleted, and a port that is connected but in the wrong VLAN. Build the switching part as a new Packet Tracer project. The PoE budget in Step 9 is a paper exercise. There is no router or call server, so traffic between VLANs fails by design and the phone does not register.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

## Topology

```diagram
{"type":"topology","title":"Data and voice access lab","caption":"PC-A connects through the powered phone; PC-A and PC-B use VLAN 10, while PC-C and the printer use VLAN 20.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.168.10.11/24","x":1,"y":1},{"id":"PH","kind":"phone","label":"Phone","sub":"External power","x":4,"y":1},{"id":"B","kind":"pc","label":"PC-B","sub":"192.168.10.12/24","x":1,"y":5},{"id":"S","kind":"switch","label":"SW1","sub":"2960-24TT","x":7,"y":3},{"id":"C","kind":"pc","label":"PC-C","sub":"192.168.20.13/24","x":11,"y":1},{"id":"PR","kind":"printer","label":"Printer","sub":"192.168.20.20/24","x":11,"y":5}],"links":[{"from":"A","to":"PH","toLabel":"PC"},{"from":"PH","to":"S","fromLabel":"Switch","toLabel":"Fa0/1"},{"from":"B","to":"S","toLabel":"Fa0/2"},{"from":"S","to":"C","fromLabel":"Fa0/3"},{"from":"S","to":"PR","fromLabel":"Fa0/4"}]}
```

Use copper straight-through cables for every connection. On PC-A, PC-B and PC-C, enter the addresses below under Desktop → IP Configuration. On Printer-PT, use its Config interface/IP settings. Leave gateways and DNS unset for this isolated local-subnet exercise.

| Endpoint | Switch path | Address and mask | Intended VLAN |
|---|---|---|---|
| PC-A Fa0 | Phone PC port → phone Switch port → SW1 Fa0/1 | `192.168.10.11`, `255.255.255.0` | 10 |
| PC-B Fa0 | SW1 Fa0/2 | `192.168.10.12`, `255.255.255.0` | 10 |
| PC-C Fa0 | SW1 Fa0/3 | `192.168.20.13`, `255.255.255.0` | 20 |
| Printer Fa0 | SW1 Fa0/4 | `192.168.20.20`, `255.255.255.0` | 20 |
| Phone | SW1 Fa0/1 | No voice IP service is configured | Voice VLAN 30 |

## Step 1: Build and inspect the physical setup

Place the devices and connect the cables. The 2960-24TT in this lab does not supply PoE. Open the phone's Physical tab and drag its power adapter onto the power socket. A phone without power passes no traffic to PC-A, which looks like a VLAN fault but is not one.

Name the switch through its CLI. Decline an initial setup dialog if one appears.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# no ip domain-lookup
SW1(config)# end
SW1# show interfaces status
```

:::expected
Fa0/1–Fa0/4 show as connected, all still in VLAN 1. Wait for the link lights to turn green before testing. The phone has power but does not register, because there is no call server.
:::

```state
{"status":"Cabled · SW1 named","led":true,"focus":["S","PH"],"prompt":{"node":"S","text":"SW1#"},"chips":[{"node":"PH","text":"Powered by adapter","tone":"ok"}],"rows":[["Fa0/1–Fa0/4","Physically connected"],["Phone power","External adapter · SW1 has no PoE"],["Voice registration","Not expected","dim"]]}
```

## Step 2: Create the VLANs

```ios SW1
SW1# configure terminal
SW1(config)# vlan 10
SW1(config-vlan)# name USERS
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# name PRINTERS
SW1(config-vlan)# exit
SW1(config)# vlan 30
SW1(config-vlan)# name VOICE
SW1(config-vlan)# end
SW1# show vlan brief
```

:::expected
VLANs 10, 20 and 30 appear as active with no ports listed. Creating a VLAN moves no ports: all four are still in VLAN 1.
:::

```state
{"status":"VLANs 10, 20, 30 created","focus":["S"],"chips":[{"node":"S","text":"VLANs 10, 20, 30 active","tone":"ok"}],"rows":[["VLAN 10 · 20 · 30","USERS · PRINTERS · VOICE"],["Status","Active","ok"],["Host ports","Not yet reassigned","dim"]]}
```

## Step 3: Assign access ports and test local peers

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/1 - 2
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface range fastethernet0/3 - 4
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 20
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
SW1# show vlan brief
```

`interface range`, which you used in the Chapter 07 lab, applies the same commands to several ports at once. Before the first ping, predict the result of PC-A → PC-B, PC-C → printer, and PC-A → PC-C, and say which would need a router.

On PC-A, run `ping 192.168.10.12`. On PC-C, run `ping 192.168.20.20`. Then try `ping 192.168.20.13` from PC-A. Inspect the learned addresses:

```ios SW1
SW1# show mac address-table
SW1# show interfaces fastethernet0/2 switchport
```

:::expected
The two same-VLAN pings succeed; repeat one if its first echo times out. The ping from PC-A to PC-C fails because nothing routes between VLAN 10 and VLAN 20. The MAC table shows PC-A and PC-B learned in VLAN 10, and PC-C and the printer in VLAN 20.
:::

```state
{"status":"Access ports assigned","tone":"ok","focus":["S"],"flows":[{"path":["A","PH","S","B"],"back":true,"label":"PC-A pings PC-B","tags":{"S":"VLAN 10 lookup → Fa0/2"}},{"path":["C","S","PR"],"back":true,"with":true,"tone":"alt","label":"PC-C pings the printer","tags":{"S":"VLAN 20 lookup → Fa0/4"}},{"path":["A","PH"],"label":"PC-A pings 192.168.20.13","stop":"A","stopText":"Off subnet · no gateway"}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20"},{"node":"S","peer":"PR","text":"VLAN 20"}],"rows":[["PC-A ↔ PC-B","Replies · VLAN 10","ok"],["PC-C ↔ Printer","Replies · VLAN 20","ok"],["PC-A to PC-C","Fails: no router or gateway","dim"],["MACs learned","PC-A, PC-B in 10 · PC-C, printer in 20"]]}
```

## Step 4: Configure the voice VLAN

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# description Phone and PC-A
SW1(config-if)# switchport voice vlan 30
SW1(config-if)# end
SW1# show interfaces fastethernet0/1 switchport
SW1# show vlan brief
```

Repeat PC-A's ping to PC-B. Inspect the phone's displayed network settings if your simulator exposes them.

:::expected
Fa0/1 shows access VLAN 10 and voice VLAN 30, and `show vlan brief` may list the port under both VLANs. PC-A still reaches PC-B in VLAN 10. You have verified the switch side only: with no DHCP or call server, the phone gets no address and places no calls.
:::

```state
{"status":"Voice VLAN 30 on Fa0/1","tone":"ok","focus":["S","PH"],"flows":[{"path":["A","PH","S","B"],"back":true,"label":"PC-A pings PC-B","tags":{"S":"PC-A data stays in VLAN 10"}}],"chips":[{"node":"PH","text":"No voice lease or registration"}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20"},{"node":"S","peer":"PR","text":"VLAN 20"}],"rows":[["Fa0/1","Access VLAN 10 · voice VLAN 30","ok"],["PC-A ↔ PC-B","Still VLAN 10","ok"],["Voice call","Not established by this lab","dim"]]}
```

## Step 5: Remove a data VLAN and observe the fault

The lesson said that ports whose VLAN is deleted go inactive and do not return to VLAN 1. Predict which pair of hosts will fail and which will keep working, then delete VLAN 20 and leave its port assignments alone.

```ios SW1
SW1# configure terminal
SW1(config)# no vlan 20
SW1(config)# end
SW1# show vlan brief
SW1# show interfaces fastethernet0/3 switchport
```

Repeat PC-C's ping to the printer. Also repeat PC-A's ping to PC-B.

:::expected
VLAN 20 is gone from `show vlan brief`, and Fa0/3 and Fa0/4 are listed under no VLAN at all. The switchport output shows `Access Mode VLAN: 20 (Inactive)`. The links stay up, yet PC-C cannot reach the printer. PC-A still reaches PC-B in VLAN 10. The hosts' addresses are fine; the fault is the missing VLAN.
:::

```state
{"status":"VLAN 20 deleted","tone":"bad","focus":["S"],"flows":[{"path":["A","PH","S","B"],"back":true,"label":"PC-A pings PC-B"},{"path":["C","S"],"with":true,"tone":"alt","label":"PC-C pings the printer","stop":"S","stopText":"VLAN 20 missing · not forwarded"}],"chips":[{"node":"S","text":"no vlan 20","tone":"bad"}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20 inactive","tone":"bad"},{"node":"S","peer":"PR","text":"VLAN 20 inactive","tone":"bad"}],"rows":[["Fa0/3–Fa0/4","Linked · still assigned VLAN 20"],["PC-C → Printer","Fails","bad"],["PC-A ↔ PC-B","Still works","ok"]]}
```

## Step 6: Restore the deleted VLAN

```ios SW1
SW1# configure terminal
SW1(config)# vlan 20
SW1(config-vlan)# name PRINTERS
SW1(config-vlan)# end
SW1# show vlan brief
SW1# show interfaces fastethernet0/3 switchport
```

Repeat PC-C's ping to the printer and record fresh MAC-table entries.

:::expected
VLAN 20 is active again and Fa0/3 and Fa0/4 reappear under it without any interface command: the ports kept their assignment all along. PC-C reaches the printer once the ports are forwarding.
:::

```state
{"status":"VLAN 20 restored","tone":"ok","focus":["S"],"flows":[{"event":["S"],"wait":1.6,"tags":{"S":"VLAN 20 PRINTERS active again"}},{"path":["C","S","PR"],"back":true,"tone":"alt","label":"PC-C pings the printer","tags":{"S":"VLAN 20 lookup → Fa0/4"}}],"chips":[{"node":"S","text":"no vlan 20","tone":"bad","until":0}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20 inactive","tone":"bad","until":0},{"node":"S","peer":"C","text":"VLAN 20","from":0},{"node":"S","peer":"PR","text":"VLAN 20 inactive","tone":"bad","until":0},{"node":"S","peer":"PR","text":"VLAN 20","from":0}],"rows":[["VLAN 20","Active · PRINTERS","ok"],["Fa0/3–Fa0/4","Existing assignments usable","ok"],["PC-C ↔ Printer","Recovers","ok"]]}
```

## Step 7: Move a port into the wrong VLAN

The second fault is harder to see because nothing is down or inactive. Leave PC-B at `192.168.10.12/24`, but move its port to VLAN 20. Predict whether PC-A can still reach it.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/2
SW1(config-if)# switchport access vlan 20
SW1(config-if)# end
SW1# show interfaces fastethernet0/2 switchport
```

Try PC-A's ping to PC-B again. Then send a ping from PC-B to PC-A and inspect SW1:

```ios SW1
SW1# show mac address-table interface fastethernet0/2
```

:::expected
The link is up and VLAN 20 is active, but both pings fail: PC-B is now in a different broadcast domain from PC-A. The MAC table shows PC-B's address learned in VLAN 20, which is the evidence that identifies this fault. PC-A may still hold PC-B's MAC in its ARP cache, but the switch will not carry a VLAN 10 frame to a VLAN 20 port.
:::

```state
{"status":"PC-B in the wrong VLAN","tone":"bad","focus":["S","B"],"flows":[{"path":["A","PH","S","B"],"label":"PC-A pings PC-B","stop":"S","stopText":"Fa0/2 is now in VLAN 20"},{"path":["B","S","PH","A"],"tone":"alt","label":"PC-B pings PC-A","tags":{"S":"PC-B learned in VLAN 20"},"stop":"S","stopText":"PC-A's Fa0/1 is VLAN 10"}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 20","tone":"bad"},{"node":"S","peer":"C","text":"VLAN 20"},{"node":"S","peer":"PR","text":"VLAN 20"}],"rows":[["Fa0/2","Access VLAN 20 · link up","bad"],["PC-B address","Still 192.168.10.12/24"],["PC-A ↔ PC-B","Fails both ways","bad"],["PC-B MAC","Learned in VLAN 20"]]}
```

## Step 8: Restore membership and verify the endpoint plan

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/2
SW1(config-if)# switchport access vlan 10
SW1(config-if)# description PC-B user workstation
SW1(config-if)# end
SW1# show interfaces fastethernet0/2 switchport
SW1# show vlan brief
```

Repeat both same-VLAN tests. In your notes, list each endpoint's physical port, data VLAN, optional voice VLAN, address and power source. Explain why this setup needs neither a trunk nor an LACP bundle.

:::expected
Both same-VLAN pairs work again. Fa0/1 has data VLAN 10 and voice VLAN 30, Fa0/2 has data VLAN 10, and Fa0/3–Fa0/4 have data VLAN 20. No trunk is needed because no link carries more than one data VLAN to another switch, and no LACP bundle is needed because every endpoint has a single cable.
:::

```state
{"status":"Endpoint plan verified","tone":"ok","focus":["S"],"flows":[{"event":["S"],"wait":1.6,"tags":{"S":"Fa0/2 back in access VLAN 10"}},{"path":["A","PH","S","B"],"back":true,"label":"PC-A pings PC-B","tags":{"S":"VLAN 10 lookup → Fa0/2"}},{"path":["C","S","PR"],"back":true,"with":true,"tone":"alt","label":"PC-C pings the printer","tags":{"S":"VLAN 20 lookup → Fa0/4"}}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 20","tone":"bad","until":0},{"node":"S","peer":"B","text":"VLAN 10","from":0},{"node":"S","peer":"C","text":"VLAN 20"},{"node":"S","peer":"PR","text":"VLAN 20"}],"rows":[["Fa0/1","Data 10 · voice 30","ok"],["Fa0/2","Data 10","ok"],["Fa0/3–Fa0/4","Data 20","ok"],["Both local pairs","Recover","ok"]]}
```

## Step 9: Interpret a PoE allocation problem

Use this supplied evidence as a paper exercise. A PoE+ switch has a usable allocation budget of 370 W. Ten phones each reserve 6.3 W; ten APs each require 30 W of PSE allocation. A further AP requests 30 W. All cables, per-port limits and device compatibility have already been checked.

Predict the remaining budget before the additional request, whether the request fits, and a suitable correction that does not underpower an existing device.

If your Packet Tracer version supports PoE reporting on a 3650-24PS, you may add SW2 and a compatible powered endpoint to a separate lab segment. Use a supported port such as Gi1/0/1 and inspect:

```ios SW2
SW2> enable
SW2# show power inline
```

Its figures will not match the paper example. If the command is unavailable, the paper exercise is enough.

:::solution
Phones reserve 63 W and the ten APs reserve 300 W, leaving `370 − 63 − 300 = 7 W`. The additional 30 W allocation does not fit. The fix is to connect the new AP to another PoE switch with enough budget, or to add power-supply capacity to this one. Capping the port at 7 W would make the numbers fit and leave the AP underpowered.
:::

```state
{"status":"PoE budget on paper","chips":[{"node":"S","text":"No PoE"}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20"},{"node":"S","peer":"PR","text":"VLAN 20"}],"rows":[["Usable budget","370 W"],["Reserved","10 phones × 6.3 W · 10 APs × 30 W"],["New request","One more AP · 30 W"],["This lab's SW1","No PoE · phone on its adapter","dim"]]}
```

## Step 10: Save the corrected setup

```ios SW1
SW1# copy running-config startup-config
```

Press Enter at the destination prompt and wait for SW1# to return. Then inspect the saved configuration and the separate VLAN database:

```ios SW1
SW1# show startup-config
SW1# show vlan brief
```

Save the project as `09-data-voice-vlans.pkt`.

:::expected
The startup configuration holds the port assignments but no `vlan` commands: the VLANs themselves are in `vlan.dat`, which is why you check them with `show vlan brief`. VLANs 10, 20 and 30 are active and neither fault remains.
:::

Before the challenge, check that you can explain each of these from what you saw:

| Step | What you should be able to explain |
|---|---|
| 3 | Why two pings worked and the ping between VLANs failed |
| 4 | How one access port carries a data VLAN and a voice VLAN |
| 5 and 6 | What a deleted VLAN does to its ports, and what restores them |
| 7 and 8 | How the MAC table exposed a port in the wrong VLAN |
| 9 | Why spare ports do not mean spare power |

```state
{"status":"Corrected setup saved","tone":"ok","focus":["S"],"prompt":{"node":"S","text":"SW1#"},"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20"},{"node":"S","peer":"PR","text":"VLAN 20"}],"rows":[["VLANs","10, 20, 30 active","ok"],["Deliberate faults","None remain","ok"],["Saved","startup-config · 09-data-voice-vlans.pkt","ok"]]}
```

## Troubleshooting

- **Phone and attached PC both lack a working link:** check the phone's external power and both Ethernet cables first.
- **Connected port, inactive VLAN:** compare the access VLAN with the VLAN database. Restore the intended VLAN before changing IP settings.
- **Active VLAN, but a moved PC cannot reach its peers:** compare documented membership, switchport output and freshly learned source MAC addresses.
- **PC data works through the phone:** this establishes the data path, not phone registration or voice addressing.
- **Different VLANs cannot communicate here:** expected; no Layer 3 forwarding path was configured.
- **PoE command unavailable:** check the model and image. A non-PoE 2960-24TT cannot supply power through configuration.
- **Power denied:** inspect the actual administrative setting, device requirement, per-port capability and remaining shared allocation before choosing a correction.

## Challenge

Add PC-D on SW1 Fa0/5 with `192.168.20.25/24`, no gateway, and a straight-through cable. Configure only the settings needed for it to reach PC-C and the printer. Predict whether it can reach PC-A. Then explain on paper what would happen if only PC-D's switchport changed to VLAN 10 while its address stayed unchanged. Write the configuration and predictions before opening the solution; the added endpoint must also leave both original local tests working.

:::solution
Under `interface fastethernet0/5`, enter `switchport mode access` and `switchport access vlan 20`. PC-D reaches PC-C and the printer; it cannot reach PC-A, because nothing routes between the VLANs. If only its port moved to VLAN 10, PC-D would share a broadcast domain with PC-A and PC-B but still hold a `192.168.20.0/24` address, so it could reach nobody: its VLAN 20 peers are in another VLAN, and its VLAN 10 neighbors are in another subnet.
:::
