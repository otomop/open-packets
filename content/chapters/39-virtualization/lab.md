---
title: "Trace a host uplink and compare routing contexts"
environment: mixed
devices: ["2 × Packet Tracer 2960 switches", "4 × Packet Tracer PCs", "Optional: one Cisco CML IOSv router"]
minutes: 70
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The first exercise uses a second physical switch as an explicit **model** of a virtual switch. It demonstrates VLAN tags and MAC learning; it does not create VMs or emulate a hypervisor. The optional VRF exercise uses a supported IOS image or the supplied paper interpretation. No Packet Tracer VRF support is assumed. Expected outputs are authored examples, not recorded simulator runs.

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

Use straight-through PC-to-switch cables and crossover or auto-connect for Gi0/1-to-Gi0/1. There is no router, internet connection or inter-VLAN service.

## Step 1: Build and label the model

Create a new Packet Tracer file, cable the listed ports and enter the four static addresses through Desktop → IP Configuration. Identify the modeled VMs, virtual switch and physical uplink.

:::expected
VM-A/VM-B represent guest vNIC attachments. VSW represents the virtual switch and Gi0/1 its physical uplink. All actual PCs still run Packet Tracer's simulated client, not separate guest operating systems.
:::

```state
{"status":"Model cabled and labelled","cabled":true,"addressed":true,"focus":["A","B","V"],"chips":[{"node":"A","text":"Guest vNIC model"},{"node":"B","text":"Guest vNIC model"},{"node":"V","text":"Gi0/1 = physical uplink"}],"rows":[["VM-A, VM-B","Guest vNIC attachments"],["VSW Gi0/1","The virtual switch's physical uplink"],["Addresses","4 static · gateway blank"],["The PCs","Simulated clients, not guest OSes","dim"]]}
```

## Step 2: Configure both ends of the trunk

Before applying the supplied model setup, predict the VLAN tag carried by each guest over Gi0/1, and whether sharing a physical cable permits communication between VLANs. Start from each new switch's console. These blocks omit PortFast on the interswitch trunk: the model uses a simulated switch that runs STP.

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

On both consoles run `show vlan brief` and `show interfaces trunk`.

:::expected
Fa0/1 belongs to VLAN 10 and Fa0/2 to VLAN 20. Gi0/1 is trunking, native VLAN 999, with 10/20/999 allowed at both ends. Wait for STP to forward. VLAN 999 has no endpoint here.
:::

```state
{"status":"Trunk at both ends","focus":["V","S"],"chips":[{"node":"V","text":"Gi0/1 trunk · native 999"},{"node":"S","text":"Gi0/1 trunk · native 999"}],"rows":[["Fa0/1 · Fa0/2","VLAN 10 · VLAN 20 on both switches"],["Allowed, both ends","10,20,999"],["VLAN 999","Native · no endpoint","dim"],["PortFast","Access ports only, not Gi0/1"]]}
```

## Step 3: Observe successful forwarding

Write the expected MAC-table VLAN/port on SW1 for each guest before generating traffic. From VM-A run `ping 10.39.10.20`; from VM-B run `ping 10.39.20.20`. Repeat after initial ARP learning.

```ios SW1
SW1# show mac address-table
SW1# show interfaces trunk
```

Use Simulation mode filtered to ARP and ICMP if available. Follow an ARP exchange and the later ICMP exchange.

:::expected
Each same-VLAN pair communicates. SW1 learns VM-A's MAC on Gi0/1 in VLAN 10 and VM-B's in VLAN 20. MAC values differ by simulator file. A ping from VM-A to 10.39.20.20 has no routed path; a shared uplink does not provide inter-VLAN routing.
:::

```state
{"status":"Same-VLAN pairs reply","tone":"ok","focus":["S"],"flows":[{"path":["A","V","S","C"],"back":true,"label":"VM-A pings 10.39.10.20","tags":{"V":"Tagged VLAN 10 onto Gi0/1","S":"Learns VM-A on Gi0/1 · VLAN 10"}},{"path":["B","V","S","D"],"back":true,"with":true,"tone":"alt","label":"VM-B pings 10.39.20.20","tags":{"V":"Tagged VLAN 20 onto Gi0/1","S":"Learns VM-B on Gi0/1 · VLAN 20"}},{"path":["A","V"],"label":"VM-A pings 10.39.20.20","stop":"A","stopText":"Off subnet · no gateway"}],"rows":[["VM-A ↔ PEER-A","Replies · VLAN 10","ok"],["VM-B ↔ PEER-B","Replies · VLAN 20","ok"],["SW1 MAC table","Both guests on Gi0/1, own VLAN"],["VM-A to 10.39.20.20","No routed path","dim"]]}
```

## Step 4: Remove one allowed VLAN and observe

Predict which same-VLAN pair should fail and which should remain available. On SW1 only:

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan 10,999
SW1(config-if)# end
SW1# show interfaces trunk
```

Repeat both same-VLAN pings. Record the difference before repairing.

:::expected
VLAN 10 remains permitted; VLAN 20 cannot traverse this trunk end. Existing MAC entries may remain until aged out, so a stored entry does not establish current reachability.
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

Finish SW1's filename prompt with Enter and wait for completion. Then on the other console:

```ios VSW
VSW# copy running-config startup-config
```

Finish VSW's prompt with Enter, then repeat both pings and save `host-uplink-baseline.pkt`.

:::expected
Both VLANs pass again. Your record includes baseline, failure and recovery evidence.
:::

```state
{"status":"Restored and saved","tone":"ok","focus":["S","V"],"flows":[{"event":["S"],"wait":1.6,"tags":{"S":"allowed 10,999 → 10,20,999"}},{"path":["A","V","S","C"],"back":true,"label":"VM-A pings 10.39.10.20"},{"path":["B","V","S","D"],"back":true,"with":true,"tone":"alt","label":"VM-B pings 10.39.20.20","tags":{"S":"VLAN 20 allowed on Gi0/1"}}],"chips":[{"node":"V","text":"allowed 10,20,999"},{"node":"S","text":"allowed 10,999","tone":"bad","until":0},{"node":"S","text":"allowed 10,20,999","tone":"ok","from":0}],"rows":[["Both VLANs","Pass again","ok"],["SW1, VSW","Saved to startup-config","ok"],["Project","host-uplink-baseline.pkt","ok"],["Evidence","Baseline, failure and recovery"]]}
```

## Step 6: Optional VRF setup on a supported image

The required outcome is to explain the routing-context observations. Configuration is an **optional supplied demonstration**, not VRF CLI memorization. Use a new isolated Cisco CML lab with **one IOSv router** and its console. No external connector, cables or PCs are required. Use your available CML/IOSv entitlement; no public sandbox is required. Start the node and inspect `show version`. Cisco lists VRF-lite among IOSv features; command forms depend on the image.

If `vrf definition` or verification commands are absent, use the supplied outputs as a paper exercise and label it unexecuted. Do not assume a similarly named Packet Tracer router supports VRFs.

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
Loopback10 and Loopback20 have the same /32 in different contexts. Loopback0 belongs to the global table. This exercise does not establish remote-host or inter-VRF forwarding.
:::

## Step 7: Compare three contexts

From the supplied setup, predict which table contains each /32 and whether a plain global ping can find 10.39.0.1. If using paper, write those predictions before opening the answer; if using IOSv, run the following checks first.

```ios R1
R1# show vrf
R1# show ip route
R1# show ip route vrf BLUE
R1# show ip route vrf RED
R1# ping vrf BLUE 10.39.0.1
R1# ping vrf RED 10.39.0.1
```

:::solution
The global table contains 192.0.2.39/32. BLUE and RED each contain 10.39.0.1/32 through different loopbacks. Local pings in each VRF can answer. Representative abbreviated entries:

```output Context comparison
Routing Table: BLUE
C 10.39.0.1/32 is directly connected, Loopback10  ← BLUE's interface
Routing Table: RED
C 10.39.0.1/32 is directly connected, Loopback20   ← RED's interface
```

Exact local/connected presentation varies by release. Ordinary `ping 10.39.0.1` uses the global table, which has no route in this isolated configuration.
:::

## Step 8: Observe address removal on reassignment

Move only Loopback10 to RED. Do not restore its address yet:

```ios R1
R1# configure terminal
R1(config)# interface loopback10
R1(config-if)# vrf forwarding RED
R1(config-if)# end
R1# show running-config interface loopback10
R1# show ip route vrf BLUE
```

:::expected
The former IP address is removed on reassignment. BLUE loses its connected /32. RED's existing Loopback20 retains its own address. Changed membership and the missing address identify the injected change.
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
Loopback10 again belongs to BLUE with its /32. Both local VRF pings answer: BLUE's restored address works, and RED's original address remains usable. Accept the save prompt and retain your CML lab separately. For the paper path, record these as predicted results rather than executed tests.
:::

## Troubleshooting

- A peer ping fails: verify addresses, access VLANs, trunk operation and allowed list.
- One VM VLAN works: compare every trunk segment carrying the failed VLAN.
- A global ping fails while a VRF ping succeeds: compare routing contexts before changing routes.
- A command is unsupported: record platform/version and use the interpretation fallback.

### Evidence to keep

Keep the guest-to-virtual-port-to-uplink drawing, both baseline ping results, actual MAC/VLAN/port observations, separate fault and recovery results, and the context worksheet. Mark whether the VRF operations were executed on an identified image or interpreted from supplied data.

## Challenge

In a copy, extend the host model with a third application network while preserving both original pairs. Add PC-PT VM-C to VSW Fa0/3 and PC-PT PEER-C to SW1 Fa0/3 using straight-through cables. Use `10.39.30.10/24` and `10.39.30.20/24` with no gateways. Their traffic must be tagged VLAN 30 over the existing Gi0/1 trunk; native VLAN 999 remains unchanged.

Write your plan before using the answer. Configure only the needed VLAN, endpoint membership and allowed-list additions at both ends. Verify the new pair and both original pairs, then record the new MAC's expected and observed VLAN/port on SW1. Explain why this does not make VM-C communicate with VLAN 10 without a router.

Separately, a real host has a dedicated management NIC sending only untagged VLAN 99 and an application NIC tagging VLANs 10,20,30. Specify the physical port type for each. In a supplied VRF record, BLUE has no route to `192.0.2.39/32` while global does; explain the result of BLUE's lookup.

:::solution
Create VLAN 30 and add it without replacing working VLANs:

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

Enter the supplied IP/mask values on the new PCs. VM-C should ping `10.39.30.20`; VM-A still pings `10.39.10.20` and VM-B still pings `10.39.20.20`. After fresh traffic, SW1 learns VM-C's actual MAC on Gi0/1 in VLAN 30. No inter-VLAN route was added, so a shared trunk does not connect the three IP networks at Layer 3.

For the real-host contract, the management NIC can use access VLAN 99. The application NIC needs a matching trunk permitting tagged VLANs 10,20,30 and the documented native/untagged treatment. Teaming or a port-channel requires a separate supported host contract.

BLUE's lookup cannot automatically use the global route. It fails in BLUE unless deliberately configured inter-context connectivity supplies a usable path. Do not add route leaking merely to make this conceptual exercise pass.
:::
