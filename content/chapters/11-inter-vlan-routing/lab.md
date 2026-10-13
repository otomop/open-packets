---
title: "Build two inter-VLAN gateway designs"
environment: packet-tracer
devices: ["Part A: 1 × 2911 router, 1 × 2960 switch, 2 × PC-PT", "Part B: 1 × 3650 multilayer switch, 1 × 2911 router, 2 × PC-PT", "Optional: 1 additional PC-PT for the challenge"]
minutes: 80
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use two separate Packet Tracer files to compare router-on-a-stick with SVI routing. In each design you will verify the baseline, introduce one clearly defined fault, observe it, and restore it. The second file also includes a directly connected routed-port test.

Open device CLI tabs for console access. Answer `no` to an initial configuration dialog if offered. Interface names below match the selected Packet Tracer models; inspect yours before cabling. These instructions and representative outcomes were reviewed against Cisco documentation, but this exact lab has not been executed in Packet Tracer. Command support, output formatting and state transitions can vary by simulator release. A 2960 is used as a Layer 2 switch here; the SVI-routing portion specifically requires a multilayer model.

## Topology

```diagram
{"type":"topology","title":"Lab 11A — Route two VLANs over one trunk","caption":"PC-A and PC-B use different subnets. R1 supplies both gateway addresses through Gi0/0 subinterfaces.","nodes":[{"id":"a","kind":"pc","label":"PC-A","sub":"192.168.10.11/24","x":1,"y":1},{"id":"b","kind":"pc","label":"PC-B","sub":"192.168.20.12/24","x":1,"y":5},{"id":"s","kind":"switch","label":"SW1 · 2960","x":5,"y":3},{"id":"r","kind":"router","label":"R1 · 2911","sub":"Gateways .10.1 and .20.1","x":10,"y":3}],"links":[{"from":"a","to":"s","toLabel":"Fa0/1","label":"VLAN 10"},{"from":"b","to":"s","toLabel":"Fa0/2","label":"VLAN 20"},{"from":"s","to":"r","fromLabel":"Gi0/1","toLabel":"Gi0/0","label":"trunk 10,20,99"}]}
```

| Part A device | Address / mask | Gateway | Cable and peer |
|---|---|---|---|
| PC-A FastEthernet0 | `192.168.10.11 / 255.255.255.0` | `192.168.10.1` | Straight-through to SW1 Fa0/1 |
| PC-B FastEthernet0 | `192.168.20.12 / 255.255.255.0` | `192.168.20.1` | Straight-through to SW1 Fa0/2 |
| R1 Gi0/0.10 | `192.168.10.1 / 255.255.255.0` | — | Parent Gi0/0 straight-through to SW1 Gi0/1 |
| R1 Gi0/0.20 | `192.168.20.1 / 255.255.255.0` | — | Same parent link |
| R1 Gi0/0.99 | No address; native VLAN 99 | — | Same parent link |

Only the physical Gi0/0 interface receives a cable. A subinterface is logical, not an additional socket. Leave PC DNS settings blank.

## Step 1: Build Part A and configure the switch

Create a fresh file. Cable the four devices as listed and enter the PC settings through Desktop → IP Configuration → Static. Check each PC with `ipconfig` in its Command Prompt. Configure SW1:

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
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
SW1(config-if)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 99
SW1(config-if)# switchport trunk allowed vlan 10,20,99
SW1(config-if)# switchport nonegotiate
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show vlan brief
SW1# show interfaces gigabitethernet0/1 switchport
```

:::expected
The PC ports belong to VLANs 10 and 20. Gi0/1 has the intended administrative trunk configuration. Its physical connection may remain down until R1 Gi0/0 is enabled in step 2. Hosts cannot reach gateways that have not yet been configured.
:::

```state
{"status":"SW1 VLANs and trunk set","focus":["s"],"addressed":["a","b"],"wake":["a","b"],"prompt":{"node":"s","text":"SW1#"},"rows":[["Fa0/1 · Fa0/2","Access VLAN 10 · VLAN 20"],["Gi0/1","Trunk · native 99 · allowed 10,20,99"],["Gi0/1 link","May stay down until step 2","dim"],["Gateways","Not configured yet","dim"]]}
```

## Step 2: Configure R1's gateway subinterfaces

Enable the parent, then configure the two addressed subinterfaces and explicit unused native subinterface. The encapsulation command must identify the correct VLAN; matching the subinterface number is only a naming convention.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# no ip address
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config-subif)# no shutdown
R1(config-subif)# exit
R1(config)# interface gigabitethernet0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0
R1(config-subif)# no shutdown
R1(config-subif)# exit
R1(config)# interface gigabitethernet0/0.99
R1(config-subif)# encapsulation dot1Q 99 native
R1(config-subif)# no shutdown
R1(config-subif)# end
R1# show ip interface brief
R1# show ip route
```

:::expected
Once the link is operational, Gi0/0 and its enabled subinterfaces should be up/up. The parent and native subinterface remain unassigned, intentionally. R1 has connected routes for 192.168.10.0/24 and 192.168.20.0/24. Modern IOS also shows local /32 routes for its own gateway addresses; do not diagnose an older simulator's lack of separate L entries as a fault.
:::

```state
{"status":"R1 subinterfaces set","focus":["r"],"wake":["r"],"prompt":{"node":"r","text":"R1#"},"rows":[["Gi0/0.10","dot1Q 10 · 192.168.10.1/24"],["Gi0/0.20","dot1Q 20 · 192.168.20.1/24"],["Gi0/0.99","dot1Q 99 native · no address"],["Connected routes","192.168.10.0/24 · 192.168.20.0/24","ok"]]}
```

## Step 3: Verify both local gateways and routed traffic

Before testing, write the destination MAC and destination IP you expect for PC-A's request before and after R1 routes it. Use role names such as R1's VLAN 10 MAC until you have observed actual values. Then test PC-A to its own gateway, PC-B to its own gateway, and both directions between PCs.

```text PC-A
ping 192.168.10.1
ping 192.168.20.12
```

```text PC-B
ping 192.168.20.1
ping 192.168.10.11
```

Allow spanning-tree startup and ARP resolution; repeat an initial partially successful test. Then collect:

```ios SW1
SW1# show interfaces trunk
SW1# show mac address-table
```

```ios R1
R1# show ip arp
R1# show ip route
```

:::expected
All four tests succeed after resolution. For the PC-A-to-PC-B request, the incoming destination MAC identifies R1 on VLAN 10 and the outgoing destination MAC identifies PC-B on VLAN 20. The destination IP remains 192.168.20.12; no NAT is configured. R1's ARP information associates PC-A with its VLAN 10 interface and PC-B with its VLAN 20 interface. In Packet Tracer Simulation mode, filter for ARP and ICMP and repeat a ping to inspect the addresses; cached ARP entries may mean no new ARP appears. Compare those fields with your prediction. If the simulator does not expose them, complete the same packet walk as a worksheet using the role names above, clearly marked as reasoned evidence rather than a captured packet. Save the file as `11A-router-stick-working.pkt` before introducing a fault.
:::

```state
{"status":"Routed between VLANs","tone":"ok","focus":["r"],"flows":[{"path":["a","s","r"],"label":"PC-A pings 192.168.20.12","tags":{"s":"VLAN 10 · tagged 10 onto Gi0/1"}},{"path":["r","s","b"],"back":true,"label":"Routed into VLAN 20","tags":{"r":"Route to Gi0/0.20 · dst MAC → PC-B","s":"Tag 20 · untagged out Fa0/2"}},{"path":["r","s","a"],"tone":"reply","label":"Reply routed into VLAN 10","tags":{"r":"Route to Gi0/0.10 · tagged 10"}}],"rows":[["Own gateways","PC-A .10.1 · PC-B .20.1 reply","ok"],["PC-A ↔ PC-B","Both directions succeed","ok"],["Destination IP","192.168.20.12 end to end · no NAT"],["R1 ARP","PC-A on VLAN 10 · PC-B on VLAN 20"]]}
```

## Step 4: Break one VLAN's tag mapping

Use File → Save As to create `11A-router-stick-experiment.pkt`. First predict which of the four tests will fail and whether up/up alone proves correct VLAN delivery. On R1 only, change subinterface .20 to expect tagged VLAN 200. Do not change SW1 or repair the router yet.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0.20
R1(config-subif)# encapsulation dot1Q 200
R1(config-subif)# end
R1# show ip interface brief
R1# show running-config
```

Repeat the gateway and cross-VLAN tests from step 3.

:::expected
PC-A can still reach 192.168.10.1, but PC-B cannot reach 192.168.20.1 and inter-VLAN traffic fails. The subinterface may remain up/up because the parent link is operational. The decisive mismatch is encapsulation VLAN 200 on R1 versus the client's VLAN 20 on SW1, not the .20 suffix. Record the running configuration and test results before recovery. If the selected image rejects changing encapsulation, record the rejection rather than claiming the intended fault was installed. Use the stated VLAN-200-versus-VLAN-20 mismatch as a supplied evidence exercise; do not report its predicted results as measured results.
:::

```state
{"status":"Gi0/0.20 expects tag 200","tone":"bad","focus":["r"],"flows":[{"event":["r"],"wait":1.2,"tags":{"r":"Gi0/0.20 → encapsulation dot1Q 200"}},{"path":["a","s","r"],"back":true,"label":"PC-A pings 192.168.10.1","backTags":{"r":"Tag 10 still matches Gi0/0.10"}},{"path":["b","s","r"],"with":true,"tone":"alt","label":"PC-B pings 192.168.20.1","tags":{"s":"VLAN 20 · tagged 20 onto Gi0/1"},"stop":"r","stopText":"Tag 20 · Gi0/0.20 expects 200"}],"chips":[{"node":"r","text":"Gi0/0.20 · dot1Q 20","until":0},{"node":"r","text":"Gi0/0.20 · dot1Q 200","tone":"bad","from":0}],"rows":[["PC-A → 192.168.10.1","Replies","ok"],["PC-B → 192.168.20.1","Fails","bad"],["PC-A ↔ PC-B","Fails","bad"],["Gi0/0.20","May still show up/up","warn"]]}
```

## Step 5: Restore the correct encapsulation

Restore VLAN 20 on the affected subinterface.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# end
R1# show running-config
R1# show ip route
```

:::expected
The encapsulation again matches VLAN 20. Repeat all four pings from step 3; they should succeed after any needed resolution. Confirm that VLAN 10 was not altered. The repair changes the actual VLAN mapping, not the subinterface's name.
:::

```state
{"status":"VLAN 20 mapping restored","tone":"ok","focus":["r"],"flows":[{"event":["r"],"wait":1.2,"tags":{"r":"Gi0/0.20 → encapsulation dot1Q 20"}},{"path":["a","s","r"],"label":"PC-A pings 192.168.20.12","tags":{"s":"VLAN 10 · tagged 10 onto Gi0/1"}},{"path":["r","s","b"],"back":true,"label":"Routed into VLAN 20","tags":{"r":"Out Gi0/0.20 · tagged 20 again","s":"Tag 20 · untagged out Fa0/2"}},{"path":["r","s","a"],"tone":"reply","label":"Reply routed into VLAN 10"}],"chips":[{"node":"r","text":"Gi0/0.20 · dot1Q 200","tone":"bad","until":0},{"node":"r","text":"Gi0/0.20 · dot1Q 20","tone":"ok","from":0}],"rows":[["Gi0/0.20","dot1Q 20 again","ok"],["Four pings from step 3","Succeed after resolution","ok"],["VLAN 10","Not altered"]]}
```

## Step 6: Save Part A

Save each restored running configuration. Complete the destination prompt before moving to the other device.

```ios SW1
SW1# copy running-config startup-config
```

Press Enter at `Destination filename [startup-config]?` if offered and wait for completion.

```ios R1
R1# copy running-config startup-config
```

Complete the same prompt, then save the Packet Tracer file as `11A-router-stick-complete.pkt`.

:::expected
Part A is a separate, working file with correct tags and successful tests. Keep it closed or set aside while creating Part B; do not connect the two designs or reuse the configured router in the next topology.
:::

```state
{"status":"Part A saved","tone":"ok","focus":["s","r"],"chips":[{"node":"s","text":"startup-config saved","tone":"ok"},{"node":"r","text":"startup-config saved","tone":"ok"}],"rows":[["SW1 · R1","copy running-config startup-config","ok"],["File","11A-router-stick-complete.pkt","ok"],["Part B","A separate file · not connected"]]}
```

## Step 7: Build Part B with SVIs but no forwarding

Create a **new** file containing a 3650 multilayer switch named DSW1, two fresh PCs, and a fresh 2911 router named R2. For now leave R2 uncabled. On a 3650 model that requires a power supply in the Physical tab, install the available compatible power supply and power it on before using the CLI.

```diagram
{"type":"topology","title":"Lab 11B — Route two VLANs with SVIs","caption":"PC-A and PC-B use DSW1's SVIs as gateways, and R2 connects to DSW1 Gi1/0/24 in step 11.","nodes":[{"id":"a","kind":"pc","label":"PC-A","sub":"192.168.10.11/24","x":1,"y":1},{"id":"b","kind":"pc","label":"PC-B","sub":"192.168.20.12/24","x":1,"y":5},{"id":"d","kind":"l3switch","label":"DSW1 · 3650","sub":"SVIs .10.1 and .20.1","x":5,"y":3},{"id":"r","kind":"router","label":"R2 · 2911","sub":"10.0.12.1/30","x":10,"y":3}],"links":[{"from":"a","to":"d","toLabel":"Gi1/0/1","label":"VLAN 10"},{"from":"b","to":"d","toLabel":"Gi1/0/2","label":"VLAN 20"},{"from":"d","to":"r","fromLabel":"Gi1/0/24","toLabel":"Gi0/0","label":"routed link"}]}
```

| Part B device / port | Peer / port | Address / mask | Gateway |
|---|---|---|---|
| PC-A FastEthernet0 | DSW1 Gi1/0/1 | `192.168.10.11 / 255.255.255.0` | `192.168.10.1` |
| PC-B FastEthernet0 | DSW1 Gi1/0/2 | `192.168.20.12 / 255.255.255.0` | `192.168.20.1` |
| DSW1 Vlan10 | Logical VLAN 10 gateway | `192.168.10.1 / 255.255.255.0` | — |
| DSW1 Vlan20 | Logical VLAN 20 gateway | `192.168.20.1 / 255.255.255.0` | — |
| DSW1 Gi1/0/24, connected in step 11 | R2 Gi0/0 | `10.0.12.2 / 255.255.255.252` | — |
| R2 Gi0/0, connected in step 11 | DSW1 Gi1/0/24 | `10.0.12.1 / 255.255.255.252` | — |

Use straight-through cables from each PC to its switch port. Enter the PC addresses, masks and gateways. Explicitly disable IPv4 forwarding temporarily so the next step demonstrates what `ip routing` changes.

```ios DSW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname DSW1
DSW1(config)# no ip routing
DSW1(config)# vlan 10
DSW1(config-vlan)# name USERS10
DSW1(config-vlan)# exit
DSW1(config)# vlan 20
DSW1(config-vlan)# name USERS20
DSW1(config-vlan)# exit
DSW1(config)# interface gigabitethernet1/0/1
DSW1(config-if)# switchport mode access
DSW1(config-if)# switchport access vlan 10
DSW1(config-if)# no shutdown
DSW1(config-if)# exit
DSW1(config)# interface gigabitethernet1/0/2
DSW1(config-if)# switchport mode access
DSW1(config-if)# switchport access vlan 20
DSW1(config-if)# no shutdown
DSW1(config-if)# exit
DSW1(config)# interface vlan 10
DSW1(config-if)# ip address 192.168.10.1 255.255.255.0
DSW1(config-if)# no shutdown
DSW1(config-if)# exit
DSW1(config)# interface vlan 20
DSW1(config-if)# ip address 192.168.20.1 255.255.255.0
DSW1(config-if)# no shutdown
DSW1(config-if)# end
DSW1# show ip interface brief
DSW1# show vlan brief
DSW1# show ip route
```

Predict whether the same four pings from step 3 will all pass before routing is enabled. Run those four commands in the new Part B PC windows and record local-gateway and cross-VLAN results separately.

:::expected
With both PC links up and forwarding, the two SVIs should be operational. Each PC should reach its own local SVI address. PC-A to PC-B must not be treated as a working routed service while IPv4 forwarding is disabled. This is the distinction being tested: assigning an IP address to the switch does not itself enable it to route user packets. Record actual model behavior if your simulator differs from the documented feature behavior.
:::

```state
{"topology":2,"status":"SVIs up · IPv4 routing off","tone":"warn","absent":["r"],"addressed":["a","b","d"],"focus":["d"],"wake":["a","b"],"flows":[{"path":["a","d"],"back":true,"label":"PC-A pings 192.168.10.1","tags":{"d":"Vlan10 SVI replies"}},{"path":["b","d"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 192.168.20.1","tags":{"d":"Vlan20 SVI replies"}},{"path":["a","d","b"],"label":"PC-A pings 192.168.20.12","stop":"d","stopText":"no ip routing · user packets not routed"}],"chips":[{"node":"d","text":"no ip routing","tone":"warn"}],"prompt":{"node":"d","text":"DSW1#"},"rows":[["Gi1/0/1 · Gi1/0/2","Access VLAN 10 · VLAN 20"],["Own SVI pings","Each PC reaches its gateway","ok"],["PC-A ↔ PC-B","Not a routed service yet","warn"],["R2","Uncabled for now","dim"]]}
```

## Step 8: Enable and verify SVI routing

Enable IPv4 routing, then repeat the own-gateway and cross-VLAN tests from step 3.

```ios DSW1
DSW1# configure terminal
DSW1(config)# ip routing
DSW1(config)# end
DSW1# show ip route
DSW1# show ip interface brief
DSW1# show ip arp
```

:::expected
The two connected subnet routes are present and PC-A and PC-B communicate in both directions. No router trunk, static route or default route is needed between these directly connected VLANs. Save `11B-svi-working.pkt` as the working checkpoint. The uncabled R2 is not involved.
:::

```state
{"topology":2,"status":"SVI routing works","tone":"ok","absent":["r"],"addressed":["a","b","d"],"focus":["d"],"flows":[{"event":["d"],"wait":1.2,"tags":{"d":"ip routing enabled"}},{"path":["a","d","b"],"back":true,"label":"PC-A pings 192.168.20.12","tags":{"d":"Connected route · Vlan10 → Vlan20"},"backTags":{"d":"Connected route · Vlan20 → Vlan10"}},{"path":["b","d","a"],"back":true,"tone":"alt","label":"PC-B pings 192.168.10.11"}],"chips":[{"node":"d","text":"no ip routing","tone":"warn","until":0},{"node":"d","text":"ip routing","tone":"ok","from":0}],"rows":[["Connected routes","192.168.10.0/24 · 192.168.20.0/24","ok"],["PC-A ↔ PC-B","Both directions succeed","ok"],["Trunk · static or default route","Not needed"],["R2","Uncabled · not involved","dim"]]}
```

## Step 9: Remove VLAN 20's only active member link

Save a separate `11B-svi-experiment.pkt`. Before changing anything, predict the port state, SVI protocol state and connected-route entry. Then shut DSW1 Gi1/0/2, the only connected Layer 2 port in VLAN 20. Do not shut the SVI or delete the VLAN; isolating one change makes the observation useful.

```ios DSW1
DSW1# configure terminal
DSW1(config)# interface gigabitethernet1/0/2
DSW1(config-if)# shutdown
DSW1(config-if)# end
DSW1# show interfaces status
DSW1# show vlan brief
DSW1# show ip interface brief
DSW1# show ip route
```

:::expected
PC-B loses its link. Under normal SVI autostate behavior, Vlan20's line protocol goes down because there is no eligible forwarding member port, and its connected route is withdrawn. VLAN 20 still exists and the SVI is not administratively shut down. PC-A should still reach its own VLAN 10 gateway. Record actual status fields; do not insist that every image use the same up/down versus down/down wording.
:::

```state
{"topology":2,"status":"Gi1/0/2 shut · Vlan20 down","tone":"bad","absent":["r"],"addressed":["a","b","d"],"focus":["d"],"cut":[["b","d"]],"flows":[{"event":["d"],"wait":1.2,"tags":{"d":"No VLAN 20 port forwarding · Vlan20 down"}},{"path":["a","d"],"back":true,"label":"PC-A pings 192.168.10.1","tags":{"d":"Vlan10 SVI still replies"}}],"chips":[{"node":"d","text":"Vlan20 protocol down","tone":"bad"},{"node":"d","text":"ip routing"}],"rows":[["Gi1/0/2","Shut down · PC-B link lost","bad"],["Vlan20","Protocol down · not admin shut","bad"],["192.168.20.0/24","Connected route withdrawn","bad"],["VLAN 20","Still exists"],["PC-A → 192.168.10.1","Still replies","ok"]]}
```

## Step 10: Restore the access link and route

Re-enable the port, allow its startup forwarding transition, then recheck the SVI and routes.

```ios DSW1
DSW1# configure terminal
DSW1(config)# interface gigabitethernet1/0/2
DSW1(config-if)# no shutdown
DSW1(config-if)# end
DSW1# show ip interface brief
DSW1# show ip route
```

:::expected
Vlan20 becomes operational and its connected route returns once its member port is forwarding. Repeat PC-A to PC-B and the reverse ping. Both should work. Applying `no shutdown` to Vlan20 would not have fixed the physical member port that you actually shut down.
:::

```state
{"topology":2,"status":"Vlan20 and its route restored","tone":"ok","absent":["r"],"addressed":["a","b","d"],"focus":["d"],"wake":["b"],"flows":[{"event":["d"],"wait":1.2,"tags":{"d":"Gi1/0/2 forwarding · Vlan20 up"}},{"path":["a","d","b"],"back":true,"label":"PC-A pings 192.168.20.12","tags":{"d":"Connected route 192.168.20.0/24 back"}},{"path":["b","d","a"],"back":true,"tone":"alt","label":"PC-B pings 192.168.10.11"}],"chips":[{"node":"d","text":"Vlan20 protocol down","tone":"bad","until":0},{"node":"d","text":"Vlan20 operational","tone":"ok","from":0},{"node":"d","text":"ip routing"}],"rows":[["Gi1/0/2","no shutdown · forwarding","ok"],["Vlan20","Operational · connected route back","ok"],["PC-A ↔ PC-B","Both directions work","ok"],["Not the fix","no shutdown on Vlan20","dim"]]}
```

## Step 11: Add a routed connection to R2

Connect DSW1 Gi1/0/24 to fresh R2 Gi0/0 using a copper straight-through cable. Configure the two ends in separate CLI tabs. This step tests only those directly connected link addresses.

```ios DSW1
DSW1# configure terminal
DSW1(config)# interface gigabitethernet1/0/24
DSW1(config-if)# description Routed-link-to-R2-Gi0/0
DSW1(config-if)# no switchport
DSW1(config-if)# ip address 10.0.12.2 255.255.255.252
DSW1(config-if)# no shutdown
DSW1(config-if)# end
DSW1# show interfaces gigabitethernet1/0/24 switchport
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.0.12.1 255.255.255.252
R2(config-if)# no shutdown
R2(config-if)# end
R2# ping 10.0.12.2
```

```ios DSW1
DSW1# ping 10.0.12.1
DSW1# show ip route
```

:::expected
The switch reports that Gi1/0/24 is not a switchport, and its table includes connected network 10.0.12.0/30. The two link-address pings succeed. R2 has no routes to the PC subnets in this exercise, so a PC-to-R2 ping is not an expected success test: R2 would need a return route. Do not add an unrelated default gateway command to DSW1 to conceal that missing routing design.
:::

```state
{"topology":2,"status":"Routed link to R2 up","tone":"ok","focus":["d","r"],"flows":[{"path":["r","d"],"back":true,"label":"R2 pings 10.0.12.2","tags":{"d":"Routed port Gi1/0/24 replies"}},{"path":["d","r"],"back":true,"label":"DSW1 pings 10.0.12.1"}],"chips":[{"node":"d","text":"ip routing"}],"prompt":{"node":"r","text":"R2#"},"rows":[["Gi1/0/24","Not a switchport · 10.0.12.2/30"],["DSW1 connected routes","Now include 10.0.12.0/30","ok"],["Link-address pings","Both succeed","ok"],["PC → R2","Not a success test · no return route","dim"]]}
```

## Step 12: Save Part B and compare the designs

Save the restored configurations one device at a time.

```ios DSW1
DSW1# copy running-config startup-config
```

Press Enter at the destination filename prompt if offered and wait for completion.

```ios R2
R2# copy running-config startup-config
```

Complete that prompt and save `11B-svi-complete.pkt`. Write two short packet walks for PC-A to PC-B: one through R1's subinterfaces in Part A, the other through DSW1's SVIs in Part B.

:::expected
Both designs use the same host subnets and gateway addresses, and both route between VLANs. Part A sends tagged traffic over a router trunk; Part B makes the routing decision within DSW1. Part B's routed port is a separate Layer 3 connection, not the mechanism that joins its local VLANs.
:::

```state
{"topology":2,"status":"Part B saved","tone":"ok","focus":["d","r"],"chips":[{"node":"d","text":"startup-config saved","tone":"ok"},{"node":"r","text":"startup-config saved","tone":"ok"}],"rows":[["DSW1 · R2","copy running-config startup-config","ok"],["File","11B-svi-complete.pkt","ok"],["VLAN 10 ↔ VLAN 20","Routed within DSW1"],["Routed port","Separate L3 link · not joining VLANs"]]}
```

## Evidence to keep

For each design, keep the interface and VLAN/tag checks, both own-gateway tests and both inter-VLAN tests. For each fault, record the one change, the affected and unaffected checks, and the same checks after recovery. For the routed link, distinguish a successful neighbor test from evidence of a complete host-to-remote return path. A configuration screenshot alone does not establish forwarding.

## Troubleshooting

- Own gateway fails on router-on-a-stick: check the PC mask/access VLAN, switch trunk, router parent state, subinterface tag and IP address.
- Subinterface is up/up but the gateway is unreachable: check tag mapping and delivery; up/up alone is insufficient.
- SVI protocol is down: verify the VLAN exists, the SVI is enabled and an eligible member port is linked and forwarding.
- Local SVI replies but cross-VLAN traffic fails: verify `ip routing`, both connected routes and both PC gateways.
- Routed-port neighbor ping fails: compare masks and addresses, check `no switchport` and administrative state at both ends.
- Some commands are absent in a simulator: record the exact model and limitation. Use the lesson's documented evidence for interpretation rather than treating a simulated omission as an IOS rule.

## Challenge

In a copy of Part B, add PC-C on unused DSW1 Gi1/0/3 using a straight-through cable. Create VLAN 30 and gateway `192.168.30.1/24`. Give PC-C `192.168.30.11/24` and that gateway. Prove that all three PCs communicate in both directions while the routed-port neighbor test still passes. Do not add a trunk or a default route. Before opening the answer, write the required VLAN, access-port, SVI and host changes yourself, and choose one verification for each. Re-test the existing VLANs as well as the new service.

:::solution Check your design
The new VLAN needs its Layer 2 membership, an operational SVI, and the correct host settings. IPv4 routing is already enabled from step 8.

```ios DSW1
DSW1# configure terminal
DSW1(config)# vlan 30
DSW1(config-vlan)# name USERS30
DSW1(config-vlan)# exit
DSW1(config)# interface gigabitethernet1/0/3
DSW1(config-if)# switchport mode access
DSW1(config-if)# switchport access vlan 30
DSW1(config-if)# no shutdown
DSW1(config-if)# exit
DSW1(config)# interface vlan 30
DSW1(config-if)# ip address 192.168.30.1 255.255.255.0
DSW1(config-if)# no shutdown
DSW1(config-if)# end
DSW1# show ip interface brief
DSW1# show ip route
```

Once PC-C's port forwards, Vlan30 is operational and 192.168.30.0/24 appears as connected. PC-C should ping 192.168.10.11 and 192.168.20.12, and both existing PCs should ping 192.168.30.11. DSW1 should still ping 10.0.12.1. R2 still lacks return routes to the PC subnets, so do not use PC-to-R2 success as this challenge's completion criterion.
:::
