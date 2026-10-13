---
title: Build data and voice VLANs, identify assignment faults, and verify power requirements
environment: mixed
devices: ["1 × Catalyst 2960-24TT (SW1)", "3 × PC-PT (PC-A, PC-B, PC-C)", "1 × Printer-PT", "1 × Cisco 7960 IP phone with its external power adapter", "optional PoE observation: Catalyst 3650-24PS (SW2)"]
minutes: 50
---
The required switching work uses a new Packet Tracer project. The PoE budget exercise uses supplied evidence, with an optional supporting-switch observation. No router, DHCP server or call-control server is needed. You will verify switching and port configuration; this lab does not claim to establish a working voice call.


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

Place the devices and connect the cables. The 2960-24TT in this lab does not supply PoE. Open the phone's Physical tab and connect its external power adapter using the model's power socket. If the interface differs in your Packet Tracer version, inspect the available power module rather than treating the absence of a phone display as a VLAN fault.

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
Fa0/1–Fa0/4 should report physical connectivity once the devices and links are ready. The phone must have power for its internal data path to operate. Wait for ordinary forwarding state to settle; do not assume an exact number of seconds across simulator versions. No voice registration is expected.
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
VLANs 10, 20 and 30 appear as active. Merely creating them has not yet reassigned the connected data ports. If the new VLANs are missing, correct their creation before moving on to host tests.
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

Before the first ping, predict PC-A → PC-B, PC-C → printer, and PC-A → PC-C. Give the VLAN and whether routing would be needed. Record the three predictions before testing.

On PC-A, run `ping 192.168.10.12`. On PC-C, run `ping 192.168.20.20`. Then try `ping 192.168.20.13` from PC-A. Inspect the learned addresses:

```ios SW1
SW1# show mac address-table
SW1# show interfaces fastethernet0/2 switchport
```

:::expected
Same-subnet peers in the same VLAN should communicate after address resolution and forwarding are ready. The cross-VLAN test has no router or configured gateway to carry it and should fail. PC-A and PC-B's source addresses should be learned in VLAN 10 after they send traffic; PC-C and the printer's in VLAN 20. Record actual MAC addresses rather than copying invented values.
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
Fa0/1 should show access VLAN 10 and voice VLAN 30. PC-A's ordinary data connectivity remains in VLAN 10. Some image output lists the port under both VLANs. This verifies the switch configuration, not a voice lease, call registration or tagged voice payload: those have not been generated by this lab's absent voice services. Record any observed phone VLAN setting separately from that conclusion.
:::

```state
{"status":"Voice VLAN 30 on Fa0/1","tone":"ok","focus":["S","PH"],"flows":[{"path":["A","PH","S","B"],"back":true,"label":"PC-A pings PC-B","tags":{"S":"PC-A data stays in VLAN 10"}}],"chips":[{"node":"PH","text":"No voice lease or registration"}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20"},{"node":"S","peer":"PR","text":"VLAN 20"}],"rows":[["Fa0/1","Access VLAN 10 · voice VLAN 30","ok"],["PC-A ↔ PC-B","Still VLAN 10","ok"],["Voice call","Not established by this lab","dim"]]}
```

## Step 5: Remove a data VLAN and observe the fault

Predict which local pair should fail and which should remain usable. Then delete only the lab's VLAN 20, leaving its access-port assignments in place. Record physical state, VLAN existence and configured membership separately.

```ios SW1
SW1# configure terminal
SW1(config)# no vlan 20
SW1(config)# end
SW1# show vlan brief
SW1# show interfaces fastethernet0/3 switchport
```

Repeat PC-C's ping to the printer. Also repeat PC-A's ping to PC-B.

:::expected
The missing VLAN 20 prevents normal data forwarding for its assigned ports, even if their physical links stay connected. Switchport output may label access VLAN 20 as inactive. VLAN 10's local data test should continue working. Do not change the hosts' IP addresses: the deliberate fault is the missing VLAN.
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
VLAN 20 is active again; its existing port assignments become usable. The local PC-C-to-printer test should recover when forwarding is ready. This demonstrates the difference between deleting the VLAN and removing an interface's configured VLAN assignment.
:::

```state
{"status":"VLAN 20 restored","tone":"ok","focus":["S"],"flows":[{"event":["S"],"wait":1.6,"tags":{"S":"VLAN 20 PRINTERS active again"}},{"path":["C","S","PR"],"back":true,"tone":"alt","label":"PC-C pings the printer","tags":{"S":"VLAN 20 lookup → Fa0/4"}}],"chips":[{"node":"S","text":"no vlan 20","tone":"bad","until":0}],"roles":[{"node":"S","peer":"PH","text":"VLAN 10 · voice 30"},{"node":"S","peer":"B","text":"VLAN 10"},{"node":"S","peer":"C","text":"VLAN 20 inactive","tone":"bad","until":0},{"node":"S","peer":"C","text":"VLAN 20","from":0},{"node":"S","peer":"PR","text":"VLAN 20 inactive","tone":"bad","until":0},{"node":"S","peer":"PR","text":"VLAN 20","from":0}],"rows":[["VLAN 20","Active · PRINTERS","ok"],["Fa0/3–Fa0/4","Existing assignments usable","ok"],["PC-C ↔ Printer","Recovers","ok"]]}
```

## Step 7: Move a port into the wrong VLAN

First predict whether an active VLAN and a connected port are enough to reach its intended peer. Leave PC-B at `192.168.10.12/24`, but move its port to VLAN 20.

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
The physical link and VLAN 20 can both be active, but PC-B is now in the wrong broadcast domain for its intended peer. Its newly generated source traffic is learned in VLAN 20. Existing ARP entries do not provide a bridge between the two VLANs, so cached addresses do not repair the fault.
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
PC-A/PC-B and PC-C/printer communication recover independently. Fa0/1 retains data VLAN 10 plus voice VLAN 30; Fa0/2 uses data VLAN 10; Fa0/3–Fa0/4 use data VLAN 20. The lab has one switch and individual host links, so its required tasks stop at access and voice configuration.
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

Do not expect this extra device's actual budget or draw to match the paper example. If the command is unavailable, finish the paper exercise without claiming a live power measurement.

:::solution
Phones reserve 63 W and the ten APs reserve 300 W, leaving `370 − 63 − 300 = 7 W`. The additional 30 W allocation does not fit. A suitable change is to move an endpoint to a compatible PSE with enough available budget, or provide supported additional power capacity. Do not lower a real 30 W requirement to 7 W merely to make the allocation fit.
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
The final setup contains active VLANs 10, 20 and 30 and the intended port assignments. Neither deliberate fault remains. The configuration save and Packet Tracer project save serve different purposes; keep both.
:::

Before marking completion, submit these observations:

| Outcome | Evidence |
|---|---|
| Initial plan | Three reachability predictions and actual results |
| Access and voice settings | Actual VLAN and switchport output |
| Distinct faults | Missing VLAN versus active-but-wrong membership |
| Recovery | Both local pairs work after each repair |
| Power decision | Both limits and whether evidence was supplied or observed |
| Independent addition | PC-D's membership, fresh MAC and local tests |

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
Set Fa0/5 to static access mode in VLAN 20 and ensure it is not shut down. PC-D should reach PC-C and the printer after forwarding and address resolution are ready; it has no routed path to PC-A. Moving only its port to VLAN 10 leaves the host's IP configuration inconsistent with the intended VLAN 20 subnet. Restore the port to VLAN 20, verify its learned source address in that VLAN, and save if retaining the extension.
:::
