---
title: "Trace a host uplink and compare routing contexts"
environment: mixed
devices: ["2 × Packet Tracer 2960 switches", "4 × Packet Tracer PCs", "Optional: one Cisco CML IOSv router"]
minutes: 70
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Packet Tracer has no hypervisor, so in steps 1 to 5 a second 2960 stands in for a host's virtual switch. Its access ports are the virtual ports, the two PCs behind it are the VMs, and its Gi0/1 is the host's physical uplink. The tagging and MAC learning you see on SW1 are what a real virtualized host produces. Steps 6 to 9 are optional: they build two VRFs on one router and need a full IOS image, such as IOSv in Cisco Modeling Labs (CML). Without one, read those steps as a paper exercise and work from the outputs shown.

## Topology

```diagram
{"type":"topology","title":"Host-uplink model","nodes":[{"id":"A","kind":"pc","label":"VM-A model","sub":"10.39.10.10/24","x":1,"y":1},{"id":"B","kind":"pc","label":"VM-B model","sub":"10.39.20.10/24","x":1,"y":5},{"id":"V","kind":"switch","label":"VSW model","sub":"2960; not a hypervisor","x":4,"y":3},{"id":"S","kind":"switch","label":"SW1","sub":"physical access switch","x":8,"y":3},{"id":"C","kind":"pc","label":"PEER-A","sub":"10.39.10.20/24","x":11,"y":1},{"id":"D","kind":"pc","label":"PEER-B","sub":"10.39.20.20/24","x":11,"y":5}],"links":[{"from":"A","to":"V","toLabel":"Fa0/1"},{"from":"B","to":"V","toLabel":"Fa0/2"},{"from":"V","to":"S","fromLabel":"Gi0/1","toLabel":"Gi0/1","label":"802.1Q trunk","accent":true},{"from":"S","to":"C","fromLabel":"Fa0/1"},{"from":"S","to":"D","fromLabel":"Fa0/2"}],"caption":"Two VLANs share one trunk but remain separate broadcast domains."}
```

| Endpoint | Switch port | Address/mask | Gateway |
|---|---|---|---|
| VM-A model | VSW Fa0/1, VLAN 10 | 10.39.10.10 / 255.255.255.0 | Leave blank |
| VM-B model | VSW Fa0/2, VLAN 20 | 10.39.20.10 / 255.255.255.0 | Leave blank |
| PEER-A | SW1 Fa0/1, VLAN 10 | 10.39.10.20 / 255.255.255.0 | Leave blank |
| PEER-B | SW1 Fa0/2, VLAN 20 | 10.39.20.20 / 255.255.255.0 | Leave blank |

Use straight-through cables from the PCs to the switches, and a crossover cable or auto-connect between the two Gi0/1 ports. There is no router, so nothing routes between VLAN 10 and VLAN 20.

## Step 1: Build and label the model

Create a new Packet Tracer file, cable the listed ports and enter the four static addresses through Desktop → IP Configuration. Rename the devices as in the topology so that the model stays clear.

:::expected
VM-A and VM-B stand for two guests' vNICs. VSW stands for the virtual switch, and its Gi0/1 for the host's physical uplink to SW1.
:::

```state
{"status":"Model cabled and labelled","cabled":true,"addressed":true,"focus":["A","B","V"],"chips":[{"node":"A","text":"Guest vNIC model"},{"node":"B","text":"Guest vNIC model"},{"node":"V","text":"Gi0/1 = physical uplink"}],"rows":[["VM-A, VM-B","Guest vNIC attachments"],["VSW Gi0/1","The virtual switch's physical uplink"],["Addresses","4 static · gateway blank"],["The PCs","Simulated clients, not guest OSes","dim"]]}
```

## Step 2: Configure both ends of the trunk

Before you configure anything, predict two things: which VLAN tag each guest's frames carry over Gi0/1, and whether sharing that cable lets VLAN 10 talk to VLAN 20.

Both switches get the lesson's configuration: access ports for the endpoints, and a trunk with native VLAN 999 that allows VLANs 10, 20 and 999. PortFast goes on the access ports only. VSW is a real switch running spanning tree, so Gi0/1 is not an edge port in this model; on a real host uplink you could use `spanning-tree portfast trunk`.

```ios VSW
Switch> enable
Switch# configure terminal
Switch(config)# hostname VSW
VSW(config)# vlan 10
VSW(config-vlan)# exit
VSW(config)# vlan 20
VSW(config-vlan)# exit
VSW(config)# vlan 999
VSW(config-vlan)# exit
VSW(config)# interface fastethernet0/1
VSW(config-if)# switchport mode access
VSW(config-if)# switchport access vlan 10
VSW(config-if)# spanning-tree portfast
VSW(config-if)# exit
VSW(config)# interface fastethernet0/2
VSW(config-if)# switchport mode access
VSW(config-if)# switchport access vlan 20
VSW(config-if)# spanning-tree portfast
VSW(config-if)# exit
VSW(config)# interface gigabitethernet0/1
VSW(config-if)# switchport mode trunk
VSW(config-if)# switchport trunk native vlan 999
VSW(config-if)# switchport trunk allowed vlan 10,20,999
VSW(config-if)# no shutdown
VSW(config-if)# end
```

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# exit
SW1(config)# vlan 999
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# spanning-tree portfast
SW1(config-if)# exit
SW1(config)# interface fastethernet0/2
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 20
SW1(config-if)# spanning-tree portfast
SW1(config-if)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# switchport trunk allowed vlan 10,20,999
SW1(config-if)# no shutdown
SW1(config-if)# end
```

On both switches run `show vlan brief` and `show interfaces trunk`.

:::expected
Fa0/1 is in VLAN 10 and Fa0/2 in VLAN 20. Gi0/1 is trunking with native VLAN 999 and VLANs 10,20,999 allowed at both ends. Give spanning tree up to 30 seconds to move Gi0/1 to forwarding. VLAN 999 has no endpoints.
:::

```state
{"status":"Trunk at both ends","focus":["V","S"],"chips":[{"node":"V","text":"Gi0/1 trunk · native 999"},{"node":"S","text":"Gi0/1 trunk · native 999"}],"rows":[["Fa0/1 · Fa0/2","VLAN 10 · VLAN 20 on both switches"],["Allowed, both ends","10,20,999"],["VLAN 999","Native · no endpoint","dim"],["PortFast","Access ports only, not Gi0/1"]]}
```

## Step 3: Observe successful forwarding

Write down the VLAN and port where you expect SW1 to learn each guest's MAC address. Then from VM-A run `ping 10.39.10.20`, and from VM-B run `ping 10.39.20.20`. The first ping can lose a packet while ARP resolves, so run each one twice.

```ios SW1
SW1# show mac address-table
SW1# show interfaces trunk
```

To see the tags themselves, switch to Simulation mode, filter on ARP and ICMP, and open a frame as it crosses the Gi0/1 link. Its details show the 802.1Q header with the VLAN number.

:::expected
Each same-VLAN pair replies. SW1 learns VM-A's MAC on Gi0/1 in VLAN 10 and VM-B's MAC on Gi0/1 in VLAN 20; the MAC values depend on your file. A ping from VM-A to 10.39.20.20 fails, because the PCs have no gateway and nothing routes between the VLANs. A shared uplink is not inter-VLAN routing.
:::

```state
{"status":"Same-VLAN pairs reply","tone":"ok","focus":["S"],"flows":[{"path":["A","V","S","C"],"back":true,"label":"VM-A pings 10.39.10.20","tags":{"V":"Tagged VLAN 10 onto Gi0/1","S":"Learns VM-A on Gi0/1 · VLAN 10"}},{"path":["B","V","S","D"],"back":true,"with":true,"tone":"alt","label":"VM-B pings 10.39.20.20","tags":{"V":"Tagged VLAN 20 onto Gi0/1","S":"Learns VM-B on Gi0/1 · VLAN 20"}},{"path":["A","V"],"label":"VM-A pings 10.39.20.20","stop":"A","stopText":"Off subnet · no gateway"}],"rows":[["VM-A ↔ PEER-A","Replies · VLAN 10","ok"],["VM-B ↔ PEER-B","Replies · VLAN 20","ok"],["SW1 MAC table","Both guests on Gi0/1, own VLAN"],["VM-A to 10.39.20.20","No routed path","dim"]]}
```

## Step 4: Remove one allowed VLAN and observe

A guest VLAN missing from the physical trunk is the most common fault on a virtualized host's port. Predict which pair will fail and which will keep working. Then replace the allowed list on SW1 only. Without the `add` keyword, this command overwrites the whole list:

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan 10,999
SW1(config-if)# end
SW1# show interfaces trunk
```

Repeat both same-VLAN pings and note the difference before you repair anything.

:::expected
VLAN 10 still passes. VLAN 20 is no longer allowed on SW1's end of the trunk, so VM-B's pings fail even though VSW still tags and sends them. If SW1 still lists VM-B's MAC for a while, it is an old entry: the MAC table records what was learned, not what is reachable now.
:::

```state
{"status":"VLAN 20 removed on SW1","tone":"bad","focus":["S"],"flows":[{"event":["S"],"wait":1.6,"tags":{"S":"allowed 10,20,999 → 10,999"}},{"path":["A","V","S","C"],"back":true,"label":"VM-A pings 10.39.10.20"},{"path":["B","V","S"],"with":true,"tone":"alt","label":"VM-B pings 10.39.20.20","tags":{"V":"Tagged VLAN 20 onto Gi0/1"},"stop":"S","stopText":"VLAN 20 not allowed on Gi0/1"}],"chips":[{"node":"V","text":"allowed 10,20,999"},{"node":"S","text":"allowed 10,20,999","until":0},{"node":"S","text":"allowed 10,999","tone":"bad","from":0}],"rows":[["VM-A ↔ PEER-A","Still replies · VLAN 10","ok"],["VM-B ↔ PEER-B","Fails at SW1's trunk end","bad"],["Old MAC entries","May remain · not reachability","dim"]]}
```

## Step 5: Restore and save

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan 10,20,999
SW1(config-if)# end
SW1# show interfaces trunk
SW1# copy running-config startup-config
```

Press Enter at the `Destination filename` prompt. Then save VSW as well:

```ios VSW
VSW# copy running-config startup-config
```

Press Enter at the prompt, repeat both pings and save the file as `host-uplink-baseline.pkt`.

:::expected
Both VLANs pass again, and both switches keep their configuration after a reload.
:::

```state
{"status":"Restored and saved","tone":"ok","focus":["S","V"],"flows":[{"event":["S"],"wait":1.6,"tags":{"S":"allowed 10,999 → 10,20,999"}},{"path":["A","V","S","C"],"back":true,"label":"VM-A pings 10.39.10.20"},{"path":["B","V","S","D"],"back":true,"with":true,"tone":"alt","label":"VM-B pings 10.39.20.20","tags":{"S":"VLAN 20 allowed on Gi0/1"}}],"chips":[{"node":"V","text":"allowed 10,20,999"},{"node":"S","text":"allowed 10,999","tone":"bad","until":0},{"node":"S","text":"allowed 10,20,999","tone":"ok","from":0}],"rows":[["Both VLANs","Pass again","ok"],["SW1, VSW","Saved to startup-config","ok"],["Project","host-uplink-baseline.pkt","ok"],["Evidence","Baseline, failure and recovery"]]}
```

## Step 6: Optional VRF setup on a supported image

Steps 6 to 9 are optional. The exam asks you to explain VRFs, and these steps let you see the behaviour for yourself. Start a new CML lab with one IOSv router and open its console. It needs no cables, PCs or external connector. If you have no CML, or your image rejects `vrf definition`, read on and work from the outputs shown. A Packet Tracer router is not a substitute.

The configuration creates VRFs BLUE and RED, then gives a loopback in each of them the same address. Loopback0 stays in the global table for comparison. Each `vrf forwarding` line comes before its `ip address` line, because assigning a VRF removes an address that is already there.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# vrf definition BLUE
R1(config-vrf)# address-family ipv4
R1(config-vrf-af)# exit-address-family
R1(config-vrf)# exit
R1(config)# vrf definition RED
R1(config-vrf)# address-family ipv4
R1(config-vrf-af)# exit-address-family
R1(config-vrf)# exit
R1(config)# interface loopback10
R1(config-if)# vrf forwarding BLUE
R1(config-if)# ip address 10.39.0.1 255.255.255.255
R1(config-if)# exit
R1(config)# interface loopback20
R1(config-if)# vrf forwarding RED
R1(config-if)# ip address 10.39.0.1 255.255.255.255
R1(config-if)# exit
R1(config)# interface loopback0
R1(config-if)# ip address 192.0.2.39 255.255.255.255
R1(config-if)# end
```

:::expected
IOS accepts 10.39.0.1/32 on both Loopback10 and Loopback20, because they are in different VRFs. Loopback0 is in the global table.
:::

## Step 7: Compare three contexts

Predict which table holds each /32, and whether a plain `ping 10.39.0.1` will succeed. Write your predictions down, then check them:

```ios R1
R1# show vrf
R1# show ip route
R1# show ip route vrf BLUE
R1# show ip route vrf RED
R1# ping vrf BLUE 10.39.0.1
R1# ping vrf RED 10.39.0.1
R1# ping 10.39.0.1
```

:::solution
`show vrf` lists BLUE with Lo10 and RED with Lo20. The global table holds only 192.0.2.39/32. BLUE and RED each hold 10.39.0.1/32 through their own loopback, and both VRF pings succeed. Abbreviated entries:

```output Context comparison
Routing Table: BLUE
C 10.39.0.1/32 is directly connected, Loopback10  ← BLUE's interface
Routing Table: RED
C 10.39.0.1/32 is directly connected, Loopback20   ← RED's interface
```

The plain `ping 10.39.0.1` fails. It uses the global table, which has no route to that address. The exact layout of the route entries varies by release.
:::

## Step 8: Observe address removal on reassignment

Move Loopback10 into RED, and do not re-enter its address yet:

```ios R1
R1# configure terminal
R1(config)# interface loopback10
R1(config-if)# vrf forwarding RED
R1(config-if)# end
R1# show running-config interface loopback10
R1# show ip route vrf BLUE
```

:::expected
IOS warns that the interface's IPv4 address was removed. The running configuration shows `vrf forwarding RED` and no IP address on Loopback10, and BLUE's table has lost its connected /32. Loopback20 in RED keeps its own address.
:::

## Step 9: Restore membership and address

```ios R1
R1# configure terminal
R1(config)# interface loopback10
R1(config-if)# vrf forwarding BLUE
R1(config-if)# ip address 10.39.0.1 255.255.255.255
R1(config-if)# end
R1# show vrf
R1# show ip route vrf BLUE
R1# ping vrf BLUE 10.39.0.1
R1# ping vrf RED 10.39.0.1
R1# copy running-config startup-config
```

:::expected
Loopback10 is back in BLUE with its /32, and both VRF pings succeed. Press Enter at the save prompt. If you worked on paper, record these as predictions, not test results.
:::

## Troubleshooting

- A same-VLAN ping fails: check the PC's address and mask, the access VLAN at each end, and `show interfaces trunk` on both switches.
- Only one VLAN works: compare the allowed list at both ends of the trunk.
- Gi0/1 is not trunking: confirm `switchport mode trunk` at both ends and wait for spanning tree.
- A plain ping fails but `ping vrf` works: the address is in a VRF and the plain ping used the global table. No route needs changing.
- IOS rejects `vrf definition`: note the platform and version, then continue on paper.

### Evidence to keep

Keep your drawing of guest, virtual port and uplink, both baseline ping results, SW1's MAC-table entries, the fault and recovery results, and your step 7 predictions. Note whether you ran the VRF steps on a real image or on paper.

## Challenge

In a copy of the file, add a third application network without disturbing the first two. Connect a new PC, VM-C, to VSW Fa0/3 and another, PEER-C, to SW1 Fa0/3 with straight-through cables. Give them `10.39.30.10/24` and `10.39.30.20/24` with no gateways. Their traffic must cross the existing Gi0/1 trunk tagged for VLAN 30, and native VLAN 999 must stay as it is.

Write your plan before you open the answer. Configure only what is needed at both ends: the VLAN, the access port and the addition to the allowed list. Verify the new pair and both original pairs, and record the VLAN and port where SW1 learns VM-C's MAC. Explain why VM-C still cannot reach VLAN 10.

Then answer two questions on paper. A real host has a management NIC that sends only untagged frames in VLAN 99, and an application NIC that tags VLANs 10, 20 and 30: which port type does each switch port need? On R1 from step 6, BLUE has no route to `192.0.2.39/32` but the global table does: what happens to a packet for that address that arrives in BLUE?

:::solution
Create VLAN 30 and add it to the trunk without replacing the working VLANs:

```ios VSW
VSW# configure terminal
VSW(config)# vlan 30
VSW(config-vlan)# exit
VSW(config)# interface fastethernet0/3
VSW(config-if)# switchport mode access
VSW(config-if)# switchport access vlan 30
VSW(config-if)# spanning-tree portfast
VSW(config-if)# no shutdown
VSW(config-if)# exit
VSW(config)# interface gigabitethernet0/1
VSW(config-if)# switchport trunk allowed vlan add 30
VSW(config-if)# end
VSW# show interfaces trunk
```

```ios SW1
SW1# configure terminal
SW1(config)# vlan 30
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/3
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 30
SW1(config-if)# spanning-tree portfast
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan add 30
SW1(config-if)# end
SW1# show interfaces trunk
SW1# show mac address-table
```

Enter the addresses and masks on the new PCs. VM-C pings `10.39.30.20`, VM-A still pings `10.39.10.20` and VM-B still pings `10.39.20.20`. After fresh traffic, SW1 learns VM-C's MAC on Gi0/1 in VLAN 30. VM-C cannot reach VLAN 10 because nothing routes between the VLANs; a shared trunk carries them side by side without joining them.

For the real host, the management NIC's port is an access port in VLAN 99. The application NIC's port is a trunk that allows VLANs 10, 20 and 30, with a native VLAN that matches how the host treats untagged frames.

The packet that arrives in BLUE is dropped. BLUE's lookup uses only BLUE's table, and the global route is not a fallback. Reaching that address would need deliberate route leaking, which this lab does not configure.
:::
