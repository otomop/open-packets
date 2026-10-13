---
title: "Build and diagnose a static trunk"
environment: packet-tracer
devices: ["2 × Catalyst 2960 switches", "4 × PC-PT", "Optional: 2 additional PC-PT for the challenge"]
minutes: 60
---
Build two working VLANs across one trunk. Then remove one allowed VLAN and introduce a native mismatch, recording each fault before restoring it. A final disconnected-port exercise applies trunk settings to an AP design.

Use a fresh Packet Tracer file and the devices' CLI tabs, which provide console access independent of the trunk. If the initial configuration dialog appears, answer `no` and press Enter. These instructions use the Packet Tracer 2960 model's `FastEthernet0/1`, `FastEthernet0/2` and `GigabitEthernet0/1` interfaces. Inspect the selected model before wiring. The examples were checked against Cisco documentation; this exact lab has not been executed in Packet Tracer. Treat shown output as representative and use the stated configuration and connectivity checks if the display differs.


Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

## Topology

```diagram
{"type":"topology","title":"Lab 10 — Four PCs across one static trunk","caption":"Each VLAN has one PC on each switch. No router or default gateway is needed for same-subnet tests.","nodes":[{"id":"a","kind":"pc","label":"PC-A","sub":"192.168.10.11","x":1,"y":1},{"id":"b","kind":"pc","label":"PC-B","sub":"192.168.20.11","x":1,"y":5},{"id":"s1","kind":"switch","label":"SW1","x":4,"y":3},{"id":"s2","kind":"switch","label":"SW2","x":8,"y":3},{"id":"c","kind":"pc","label":"PC-C","sub":"192.168.10.12","x":11,"y":1},{"id":"d","kind":"pc","label":"PC-D","sub":"192.168.20.12","x":11,"y":5}],"links":[{"from":"a","to":"s1","toLabel":"Fa0/1"},{"from":"b","to":"s1","toLabel":"Fa0/2"},{"from":"s1","to":"s2","fromLabel":"Gi0/1","toLabel":"Gi0/1","label":"trunk 10,20,99"},{"from":"s2","to":"c","fromLabel":"Fa0/1"},{"from":"s2","to":"d","fromLabel":"Fa0/2"}]}
```

| Device / port | Peer / port | VLAN | Address / mask |
|---|---|---|---|
| PC-A FastEthernet0 | SW1 Fa0/1 | 10 | `192.168.10.11 / 255.255.255.0` |
| PC-B FastEthernet0 | SW1 Fa0/2 | 20 | `192.168.20.11 / 255.255.255.0` |
| PC-C FastEthernet0 | SW2 Fa0/1 | 10 | `192.168.10.12 / 255.255.255.0` |
| PC-D FastEthernet0 | SW2 Fa0/2 | 20 | `192.168.20.12 / 255.255.255.0` |
| SW1 Gi0/1 | SW2 Gi0/1 | Trunk 10,20,99; native 99 | No IP address |

Use copper straight-through cables for PC-to-switch links and a copper crossover cable for the switch-to-switch link. Packet Tracer's automatic connection tool is an alternative if it selects the intended ports. Leave every PC's gateway and DNS fields blank. VLAN 99 has no host; it is the agreed unused native VLAN.

## Step 1: Cable, address and name the devices

Place and connect the devices as listed. On each PC, open Desktop → IP Configuration, select Static, and enter its address and mask. Open Desktop → Command Prompt and run `ipconfig` to check your entries.

Name the switches from their CLI tabs. A new switch initially displays `Switch>`.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# end
SW1# show interfaces status
```

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# end
SW2# show interfaces status
```

:::expected
The three cabled ports on each switch should establish a physical connection. Initial amber indicators may reflect spanning-tree startup; allow the simulator to advance before testing. Confirm that the port names match the table. Do not expect the default interswitch connection to carry VLANs 10 and 20 yet.
:::

```state
{"status":"Cabled, addressed, named","cabled":true,"addressed":true,"led":true,"focus":["s1","s2"],"chips":[{"node":"s1","text":"SW1#"},{"node":"s2","text":"SW2#"}],"rows":[["Cabled ports","3 per switch · connected"],["PC addresses","Static · checked with ipconfig"],["VLANs 10 and 20","Not across the link yet","dim"]]}
```

## Step 2: Create the VLANs and access ports

Create the same three VLANs locally on both switches. Explicit access mode removes dependence on default negotiation settings at the PC ports.

```ios SW1
SW1# configure terminal
SW1(config)# vlan 10
SW1(config-vlan)# name USERS10
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# name USERS20
SW1(config-vlan)# exit
SW1(config)# vlan 99
SW1(config-vlan)# name UNUSED-NATIVE
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface fastethernet0/2
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 20
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show vlan brief
```

```ios SW2
SW2# configure terminal
SW2(config)# vlan 10
SW2(config-vlan)# name USERS10
SW2(config-vlan)# exit
SW2(config)# vlan 20
SW2(config-vlan)# name USERS20
SW2(config-vlan)# exit
SW2(config)# vlan 99
SW2(config-vlan)# name UNUSED-NATIVE
SW2(config-vlan)# exit
SW2(config)# interface fastethernet0/1
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 10
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# interface fastethernet0/2
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 20
SW2(config-if)# no shutdown
SW2(config-if)# end
SW2# show vlan brief
```

:::expected
Each switch lists VLAN 10 with Fa0/1 and VLAN 20 with Fa0/2. VLAN 99 exists and is active, with no PC access port. VLAN names are helpful labels; matching VLAN IDs are what preserve membership across the trunk.
:::

```state
{"status":"Access ports in VLANs","focus":["s1","s2"],"chips":[{"node":"s1","text":"VLANs 10, 20, 99"},{"node":"s2","text":"VLANs 10, 20, 99"}],"rows":[["Fa0/1, both switches","Access VLAN 10"],["Fa0/2, both switches","Access VLAN 20"],["VLAN 99","Active · no PC access port"]]}
```

## Step 3: Configure the trunk at both ends

Enter the complete settings on SW1, then SW2. Use the console tabs throughout; transient differences while configuring the two ends will not disconnect your console.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# description Trunk-to-SW2-Gi0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 99
SW1(config-if)# switchport trunk allowed vlan 10,20,99
SW1(config-if)# switchport nonegotiate
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces trunk
```

```ios SW2
SW2# configure terminal
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# description Trunk-to-SW1-Gi0/1
SW2(config-if)# switchport mode trunk
SW2(config-if)# switchport trunk native vlan 99
SW2(config-if)# switchport trunk allowed vlan 10,20,99
SW2(config-if)# switchport nonegotiate
SW2(config-if)# no shutdown
SW2(config-if)# end
SW2# show interfaces trunk
```

:::expected
Gi0/1 is an operational 802.1Q trunk with native VLAN 99 at both ends. The allowed list is 10,20,99. After startup convergence, those active VLANs should also appear in the forwarding list for this single interswitch path. The 2960 does not need an encapsulation-selection command. If your simulator rejects a command, record the model and rejection; do not substitute dynamic mode for the static trunk.
:::

```state
{"status":"Static trunk on Gi0/1","focus":["s1","s2"],"chips":[{"node":"s1","text":"Gi0/1 trunk · native 99"},{"node":"s2","text":"Gi0/1 trunk · native 99"}],"rows":[["Mode, both ends","Trunk · nonegotiate"],["Native VLAN","99 at both ends"],["Allowed","10,20,99"],["Forwarding","10,20,99 after convergence"]]}
```

## Step 4: Prove a working baseline

Before the first test, predict both same-VLAN results and PC-A's result to PC-D. For a VLAN 20 frame, identify which two links carry untagged access traffic and which link carries its 802.1Q tag. Then test your predictions.

From PC-A's Command Prompt, ping PC-C. From PC-B, ping PC-D. Repeat after initial address resolution if the first echo is lost.

```text PC-A
ping 192.168.10.12
```

```text PC-B
ping 192.168.20.12
```

After generating traffic, inspect both switches:

```ios SW1
SW1# show interfaces trunk
SW1# show mac address-table
```

```ios SW2
SW2# show interfaces trunk
SW2# show mac address-table
```

:::expected
Both same-VLAN pairs communicate. SW1 learns PC-A and PC-B on their local access ports and remote PC-C and PC-D through Gi0/1, in their respective VLANs. A ping from PC-A to 192.168.20.12 is expected to fail: the destination is off subnet and there is no gateway. Record the successful tests and save the Packet Tracer file as `10-trunk-working.pkt` using File → Save As. This is a working checkpoint, not yet a startup-configuration save.
:::

For the VLAN 20 path, the PC-to-switch access links carry ordinary untagged frames. The interswitch trunk carries VLAN 20 tagged because its native VLAN is 99.

```state
{"status":"Both VLANs work","tone":"ok","focus":["s1","s2"],"flows":[{"path":["a","s1","s2","c"],"back":true,"label":"PC-A pings PC-C","tags":{"s1":"Tagged VLAN 10 onto Gi0/1","s2":"Untagged out Fa0/1"}},{"path":["b","s1","s2","d"],"back":true,"with":true,"tone":"alt","label":"PC-B pings PC-D","tags":{"s1":"Tagged VLAN 20 onto Gi0/1","s2":"Untagged out Fa0/2"}},{"path":["a","s1"],"label":"PC-A pings 192.168.20.12","stop":"a","stopText":"Off subnet · no gateway"}],"rows":[["PC-A ↔ PC-C","Replies · VLAN 10","ok"],["PC-B ↔ PC-D","Replies · VLAN 20","ok"],["PC-A to 192.168.20.12","Fails: no gateway","dim"],["Trunk","Native 99, so both VLANs are tagged"]]}
```

## Step 5: Remove VLAN 20 and record the fault

Save a separate working copy as `10-trunk-experiments.pkt`. Write which client pair should be affected and which should remain usable. On SW1 only, remove VLAN 20 from the trunk. Do not repair it until you have collected evidence.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan remove 20
SW1(config-if)# end
SW1# show interfaces trunk
```

Repeat the two successful pings from step 4 and inspect SW2's trunk list.

```ios SW2
SW2# show interfaces trunk
```

:::expected
PC-A to PC-C still works; PC-B to PC-D fails. SW1's allowed list is now 10,99, while SW2 still allows 10,20,99. The link can remain up and trunking. Record those three facts together: physical operation, a VLAN-specific failure, and different allowed lists. A successful VLAN 10 ping does not prove VLAN 20 is permitted.
:::

```state
{"status":"VLAN 20 removed on SW1","tone":"bad","focus":["s1"],"flows":[{"path":["a","s1","s2","c"],"back":true,"label":"PC-A pings PC-C"},{"path":["b","s1","s2","d"],"with":true,"tone":"alt","label":"PC-B pings PC-D","stop":"s1","stopText":"VLAN 20 not allowed on Gi0/1"}],"chips":[{"node":"s1","text":"allowed 10,99","tone":"bad"},{"node":"s2","text":"allowed 10,20,99"}],"rows":[["PC-A ↔ PC-C","Still works","ok"],["PC-B ↔ PC-D","Fails","bad"],["Gi0/1","Up and trunking"]]}
```

## Step 6: Restore VLAN 20 without replacing the list

Add VLAN 20 back on SW1. Predict the final list before entering the command.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan add 20
SW1(config-if)# end
SW1# show interfaces trunk
```

:::expected
The list again contains 10,20,99. After the VLAN is forwarding, both same-VLAN ping pairs succeed. `add 20` preserves VLANs 10 and 99; a bare `allowed vlan 20` would remove them. Check both pairs before moving to the next fault.
:::

```state
{"status":"VLAN 20 restored","tone":"ok","focus":["s1"],"flows":[{"event":["s1"],"wait":1.6,"tags":{"s1":"add 20 → allowed 10,20,99"}},{"path":["a","s1","s2","c"],"back":true,"label":"PC-A pings PC-C"},{"path":["b","s1","s2","d"],"back":true,"with":true,"tone":"alt","label":"PC-B pings PC-D","tags":{"s1":"VLAN 20 allowed on Gi0/1"}}],"chips":[{"node":"s1","text":"allowed 10,99","tone":"bad","until":0},{"node":"s1","text":"allowed 10,20,99","tone":"ok","from":0},{"node":"s2","text":"allowed 10,20,99"}],"rows":[["SW1 allowed","10,20,99","ok"],["add 20","Keeps VLANs 10 and 99"],["PC-A ↔ PC-C","Replies","ok"],["PC-B ↔ PC-D","Replies again","ok"]]}
```

## Step 7: Introduce a native mismatch and inspect both ends

Change SW2's native VLAN to 999 while leaving SW1 at 99. Create VLAN 999 locally and allow it so its local existence is not an additional fault. Before the commands, predict the VLAN into which SW2 would classify an ordinary untagged frame from SW1. This exercise observes a configuration mismatch; no endpoint uses the native VLAN, so a particular ping failure is not required.

```ios SW2
SW2# configure terminal
SW2(config)# vlan 999
SW2(config-vlan)# name TEMP-NATIVE-FAULT
SW2(config-vlan)# exit
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# switchport trunk allowed vlan add 999
SW2(config-if)# switchport trunk native vlan 999
SW2(config-if)# end
SW2# show interfaces gigabitethernet0/1 switchport
SW2# show interfaces trunk
```

```ios SW1
SW1# show interfaces gigabitethernet0/1 switchport
SW1# show interfaces trunk
```

:::expected
The explicit evidence is native VLAN 99 on SW1 versus 999 on SW2. If CDP warnings or spanning-tree protection appear, record them; their exact behavior is platform dependent. Tagged VLAN tests may continue working or be affected by protective behavior. Explain the fundamental fault: an ordinary untagged frame sent as VLAN 99 by SW1 would be classified into VLAN 999 by SW2. Do not disable spanning tree to make the symptom disappear.
:::

```state
{"status":"Native mismatch 99 / 999","tone":"bad","focus":["s1","s2"],"flows":[{"event":["s2"],"wait":1.6,"tags":{"s2":"Native VLAN 99 → 999"}}],"chips":[{"node":"s1","text":"native 99"},{"node":"s2","text":"native 99","until":0},{"node":"s2","text":"native 999","tone":"bad","from":0}],"rows":[["SW1 native","99"],["SW2 native","999","bad"],["Untagged frame from SW1","Sent as 99, classified 999","bad"],["Pings","No particular failure required","dim"]]}
```

## Step 8: Restore the native agreement

Restore the intended native VLAN and allowed list on SW2. Remove the temporary VLAN only after the port no longer uses it.

```ios SW2
SW2# configure terminal
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# switchport trunk native vlan 99
SW2(config-if)# switchport trunk allowed vlan remove 999
SW2(config-if)# exit
SW2(config)# no vlan 999
SW2(config)# end
SW2# show interfaces trunk
```

:::expected
Both ends again use native VLAN 99 and allow 10,20,99. Allow convergence and repeat both successful baseline pings. If either pair still fails, compare both ends and PC settings with the working checkpoint before adding any new configuration.
:::

```state
{"status":"Native agreement restored","tone":"ok","focus":["s2"],"flows":[{"event":["s2"],"wait":1.6,"tags":{"s2":"Native back to 99 · 999 removed"}},{"path":["a","s1","s2","c"],"back":true,"label":"PC-A pings PC-C"},{"path":["b","s1","s2","d"],"back":true,"with":true,"tone":"alt","label":"PC-B pings PC-D"}],"chips":[{"node":"s1","text":"native 99"},{"node":"s2","text":"native 999","tone":"bad","until":0},{"node":"s2","text":"native 99","tone":"ok","from":0}],"rows":[["Native VLAN","99 at both ends","ok"],["Allowed","10,20,99 at both ends","ok"],["VLAN 999","Removed from SW2"],["Baseline pings","Both pairs reply","ok"]]}
```

## Step 9: Prepare a disconnected AP port

Leave SW1 Gi0/2 uncabled and administratively shut down. Configure only the switch side of an AP design: untagged management VLAN 100 and tagged client VLANs 110 and 120. This is a configuration inspection exercise; it does not simulate a FlexConnect AP. Write the required mode, native VLAN, allowed list and DTP setting before opening the reference. Then apply it to the disconnected port and record what configuration can prove without a working link.

:::solution Switch-side reference

```ios SW1
SW1# configure terminal
SW1(config)# vlan 100
SW1(config-vlan)# name AP-MANAGEMENT
SW1(config-vlan)# exit
SW1(config)# vlan 110
SW1(config-vlan)# name WIRELESS-STAFF
SW1(config-vlan)# exit
SW1(config)# vlan 120
SW1(config-vlan)# name WIRELESS-GUEST
SW1(config-vlan)# exit
SW1(config)# interface gigabitethernet0/2
SW1(config-if)# shutdown
SW1(config-if)# description Prepared-AP-untagged100-tagged110-120
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 100
SW1(config-if)# switchport trunk allowed vlan 100,110,120
SW1(config-if)# switchport nonegotiate
SW1(config-if)# end
SW1# show interfaces gigabitethernet0/2 switchport
SW1# show running-config
```

The administrative configuration is trunk, native 100, allowed 100,110,120, with DTP disabled. The disconnected, shut port is not an operational trunk. Write down the AP-side requirements: management untagged in 100, staff clients tagged 110, guests tagged 120. None of those VLANs has been extended over Gi0/1 or given a gateway, so the prepared port alone cannot deliver a wireless service. For a virtual host that tags all three VLANs, use an agreed unused native VLAN instead; leave this AP exercise unchanged.
:::

```state
{"status":"Gi0/2 prepared for an AP","focus":["s1"],"chips":[{"node":"s1","text":"Gi0/2 shut · uncabled"}],"rows":[["SW1 Gi0/2","Uncabled · shut down"],["Untagged","Management VLAN 100"],["Tagged","Client VLANs 110 and 120"]]}
```

## Step 10: Save the restored configuration

Verify the main trunk and both baseline pings once more. Save each switch from privileged EXEC mode, completing the interactive prompt before moving to the next device.

```ios SW1
SW1# copy running-config startup-config
```

If asked `Destination filename [startup-config]?`, press Enter. Wait for the completion message and the `SW1#` prompt.

```ios SW2
SW2# copy running-config startup-config
```

Complete the same destination prompt. Then save the Packet Tracer file as `10-trunk-complete.pkt`.

:::expected
The saved configuration has a working Gi0/1 trunk on each switch and a deliberately shut, disconnected AP preparation port on SW1. No temporary native mismatch remains. Keep your fault observations alongside the file so you can explain why the repairs worked without looking at the commands.
:::

Submit the following evidence before completion:

| Outcome | Evidence |
|---|---|
| VLAN frame path | Access versus trunk tagging for one predicted exchange |
| Healthy trunk | Allowed, active and forwarding sets at both ends |
| Selective failure | Failed VLAN 20 test and unaffected VLAN 10 test |
| Native agreement | Both native IDs and the predicted untagged classification |
| Recovery | Original tests restored before saving |
| Changed requirement | Independently add VLAN 30 while all original services remain usable |

```state
{"status":"Baseline saved","tone":"ok","focus":["s1","s2"],"flows":[{"path":["a","s1","s2","c"],"back":true,"label":"PC-A pings PC-C"},{"path":["b","s1","s2","d"],"back":true,"with":true,"tone":"alt","label":"PC-B pings PC-D"}],"chips":[{"node":"s1","text":"SW1#"},{"node":"s2","text":"SW2#"},{"node":"s1","text":"Gi0/2 shut · uncabled"}],"rows":[["Gi0/1 trunk","Working on both switches","ok"],["Native mismatch","None remains","ok"],["SW1 Gi0/2","Shut, disconnected AP port"],["Saved","Both switches · 10-trunk-complete.pkt","ok"]]}
```

## Troubleshooting

- No physical connection: inspect exact ports, cable type, power and administrative shutdown before VLAN settings.
- One VLAN fails across the trunk: compare its access membership, allowed list, local VLAN existence and forwarding at both switches.
- Gi0/2 is missing from operational trunks: expected in step 9 because it is shut and uncabled; inspect its administrative configuration.
- Pings between different VLANs fail: expected in this lab because no inter-VLAN gateway exists.
- First ping partly fails: repeat after ARP resolution and spanning-tree startup. Persistent failure needs investigation.
- A native mismatch produces a different warning or state: rely on the demonstrated settings at both ends, not a memorized message.

## Challenge

Add PC-E on SW1 Fa0/3 and PC-F on SW2 Fa0/3 using straight-through cables. Put them in VLAN 30 with `192.168.30.11/24` and `192.168.30.12/24`, leaving gateways blank. Extend VLAN 30 over the existing trunk without removing any current VLAN. Write your required VLAN database, access-port and trunk changes before opening the solution. Predict the final allowed lists and native setting. Prove all three same-VLAN pairs communicate, then save a separate challenge file.

:::solution
Create VLAN 30 and assign Fa0/3 on **both** switches. Add 30 to both existing allowed lists; leave native VLAN 99 unchanged.

```ios SW1
SW1# configure terminal
SW1(config)# vlan 30
SW1(config-vlan)# name USERS30
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/3
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 30
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan add 30
SW1(config-if)# end
SW1# show interfaces trunk
```

```ios SW2
SW2# configure terminal
SW2(config)# vlan 30
SW2(config-vlan)# name USERS30
SW2(config-vlan)# exit
SW2(config)# interface fastethernet0/3
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 30
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# interface gigabitethernet0/1
SW2(config-if)# switchport trunk allowed vlan add 30
SW2(config-if)# end
SW2# show interfaces trunk
```

Both allowed lists become 10,20,30,99. PC-E should ping 192.168.30.12 after convergence; the original VLAN 10 and 20 pairs must still pass. VLAN 30 does not need a router for these same-subnet tests.
:::
