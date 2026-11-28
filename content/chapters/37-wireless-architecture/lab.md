---
title: Build the wired foundation for a controller WLAN
environment: mixed
devices: ["1 × 2911 router", "1 × 2960 switch", "1 × WLC-3504 where available", "1 × LAP-PT", "2 × PC-PT", "1 × Server-PT"]
minutes: 80
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.
A lightweight AP is only as good as the wired network under it. In this lab you build that network for a centrally switched WLAN: a management VLAN for the AP and controller, a separate client VLAN, an access port for the AP and a trunk for the controller. Then you watch the AP get an address and join the controller, and see what happens to that join when the AP's port goes down. Two written exercises at the end apply the same reasoning to a FlexConnect AP and to link aggregation.

Chapter 38 builds and tests the client WLAN in a separate, simpler project, so you do not need to carry this addressing plan forward.

:::note Simulator boundary
Start with a new file. Use a WLC-3504 and a LAP-PT. Their setup pages differ between Packet Tracer versions, but the switch and router work in Steps 1–4 does not depend on them. If your version lacks a control that a step names, or the AP will not register, complete that step on paper from the given values and record “not simulated”. Packet Tracer does not simulate PoE negotiation, FlexConnect, a Meraki dashboard or a Catalyst 9800, which is why Steps 11 and 12 are written exercises.
:::

## Topology

```diagram
{"type":"topology","title":"Lab topology — management 10, client network 20","caption":"AP1 and ADMIN send untagged management traffic; the controller link can also carry tagged client VLAN 20.","nodes":[{"id":"R","kind":"router","label":"R1","sub":".10.1 and .20.1","x":2,"y":1},{"id":"S","kind":"switch","label":"SW1","sub":"VLANs 10 and 20","x":6,"y":3},{"id":"W","kind":"wlc","label":"WLC1","sub":"192.168.10.5","x":10,"y":1},{"id":"A","kind":"ap","label":"AP1","sub":"DHCP in VLAN 10","x":10,"y":5},{"id":"P","kind":"pc","label":"ADMIN","sub":"192.168.10.10","x":2,"y":5},{"id":"T","kind":"pc","label":"TEST20","sub":"192.168.20.20","x":4,"y":6},{"id":"V","kind":"server","label":"WEB20","sub":"192.168.20.30; HTTP","x":8,"y":6}],"links":[{"from":"R","to":"S","fromLabel":"Gi0/0","toLabel":"Gi0/1","label":"trunk; native 10"},{"from":"S","to":"W","fromLabel":"Fa0/24","toLabel":"Port 1","label":"trunk; native 10"},{"from":"S","to":"A","fromLabel":"Fa0/1","label":"access 10"},{"from":"S","to":"P","fromLabel":"Fa0/2","label":"access 10"},{"from":"S","to":"T","fromLabel":"Fa0/3","label":"access 20"},{"from":"S","to":"V","fromLabel":"Fa0/4","label":"access 20"}]}
```

Use copper straight-through on every listed router/controller/AP/PC-to-switch connection. WLC Port 1 is commonly labeled `GigabitEthernet1`; LAP-PT's wired interface is commonly `GigabitEthernet0`. Read the device's port picker and record a differing label before cabling.

| Device/interface | Address/mask | Gateway/VLAN |
|---|---|---|
| R1 Gi0/0.10 | `192.168.10.1/24` | Native VLAN 10 |
| R1 Gi0/0.20 | `192.168.20.1/24` | Tagged VLAN 20 |
| WLC management, Port 1 | `192.168.10.5/24` | `192.168.10.1`; untagged |
| ADMIN FastEthernet0 | `192.168.10.10/24` | `192.168.10.1`; VLAN 10 |
| TEST20 FastEthernet0 | `192.168.20.20/24` | `192.168.20.1`; VLAN 20 |
| AP1 wired management | DHCP `192.168.10.100–149/24` | `192.168.10.1`; VLAN 10 |
| WEB20 FastEthernet0, SW1 Fa0/4 | `192.168.20.30/24` | `192.168.20.1`; VLAN 20 |
| Optional WLC dynamic interface `users` | `192.168.20.5/24` | `192.168.20.1`; tagged VLAN 20 |

Add Server-PT WEB20 on SW1 Fa0/4 with a copper straight-through cable. There is no DNS or Internet service; all tests use addresses.

## Step 1: Place, power and cable the devices

Place the named models, cable the listed interfaces and name the PCs ADMIN and TEST20. Open AP1's Physical tab and fit its power adapter. The 2960 in Packet Tracer is not a PoE switch, so the AP gets no power from its Ethernet cable.

On both PCs and WEB20, use Desktop → IP Configuration to enter each static address, `255.255.255.0` mask and gateway from the table. Leave DNS blank. On WEB20 select Services → HTTP → On; use its disposable local page as the service target. Keep the controller disconnected from any real network.

:::expected
Both PCs and WEB20 show the intended values, and AP1 has power. The router's link stays down until Step 3 enables its interface.
:::

```state
{"status":"Cabled · hosts addressed","wake":["P","T","V"],"focus":["P","T","V"],"chips":[{"node":"V","text":"HTTP On","tone":"ok"}],"rows":[["ADMIN · TEST20","Static address · /24 · gateway"],["WEB20","192.168.20.30 · HTTP On"],["AP1","External adapter, if required"],["R1 link","May stay down until Step 3","dim"]]}
```

## Step 2: Configure VLANs and switchports

Before you type, predict which ports carry tagged client traffic and which carry only untagged management. AP1 is centrally switched, so its port, Fa0/1, is an access port in VLAN 10. The controller link, Fa0/24, and the router link, Gi0/1, are trunks: management is untagged, so the native VLAN is 10, and VLAN 20 is tagged.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name MANAGEMENT
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# name USERS
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/1 - 2
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface range fastethernet0/3 - 4
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 20
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface fastethernet0/24
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show vlan brief
SW1# show interfaces trunk
```

:::expected
Fa0/1–2 are access members of VLAN 10; Fa0/3–4 are in VLAN 20. Operational trunks show native VLAN 10 and allowed VLANs 10,20. A trunk whose far end is not yet up can be absent from `show interfaces trunk`; verify its configuration with `show interfaces gigabitethernet0/1 switchport`.
:::

```state
{"status":"SW1 VLANs and trunks set","focus":["S"],"prompt":{"node":"S","text":"SW1#"},"rows":[["Fa0/1–2","Access VLAN 10"],["Fa0/3–4","Access VLAN 20"],["Gi0/1 · Fa0/24","Trunk · native 10 · allowed 10,20"],["Trunk to a down far end","Can be absent from the trunk list","dim"]]}
```

## Step 3: Configure routing and the AP DHCP pool

R1 routes between the two VLANs with subinterfaces, as in chapter 11, and gives AP1 its address. The `native` keyword on subinterface `.10` tells R1 that VLAN 10 arrives untagged, which matches the switch trunk. The exclusions leave 50 AP leases, `.100–.149`. VLAN 20 has only static hosts, so it needs no pool.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/0.10
R1(config-subif)# encapsulation dot1Q 10 native
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config-subif)# exit
R1(config)# interface gigabitethernet0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0
R1(config-subif)# exit
R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.99
R1(config)# ip dhcp excluded-address 192.168.10.150 192.168.10.254
R1(config)# ip dhcp pool AP-MGMT
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# end
R1# show ip interface brief
R1# show ip dhcp pool AP-MGMT
```

:::expected
Gi0/0 and both subinterfaces are up/up. The pool covers `192.168.10.0/24`, and the two exclusions appear in the running configuration.
:::

```state
{"status":"R1 subinterfaces and pool","focus":["R"],"wake":["R"],"prompt":{"node":"R","text":"R1#"},"rows":[["Gi0/0.10","dot1Q 10 native · 192.168.10.1/24"],["Gi0/0.20","dot1Q 20 · 192.168.20.1/24"],["AP-MGMT pool","Leases .100–.149 · gateway .10.1"],["DNS","Not advertised","dim"]]}
```

## Step 4: Prove the wired paths first

Predict the VLAN and R1 subinterface used by ADMIN to reach WEB20. Then from ADMIN's command prompt run:

```text
ping 192.168.10.1
ping 192.168.20.20
```

From TEST20 run:

```text
ping 192.168.20.1
ping 192.168.10.10
```

Open `http://192.168.20.30` from ADMIN and TEST20. The first ping to a new destination can lose a packet while ARP resolves, so repeat it. If a ping between VLANs fails, check the gateway on the destination PC before you change R1.

:::expected
Each PC reaches its gateway and the other PC, and the WEB20 page loads from both. That proves both VLANs, R1's subinterfaces and the return paths. Nothing has tested the controller trunk yet.
:::

```state
{"status":"Wired paths proven","tone":"ok","focus":["R"],"flows":[{"path":["P","S","R"],"back":true,"label":"ADMIN pings 192.168.10.1","tags":{"S":"VLAN 10 · native, untagged to R1"}},{"path":["T","S","R"],"back":true,"with":true,"tone":"alt","label":"TEST20 pings 192.168.20.1","tags":{"S":"VLAN 20 · tagged 20 to R1"}},{"path":["P","S","R"],"label":"ADMIN opens http://192.168.20.30","tags":{"R":"Gi0/0.10 in · routed to Gi0/0.20"}},{"path":["T","S","V"],"back":true,"tone":"alt","label":"TEST20 opens http://192.168.20.30","tags":{"S":"VLAN 20 · switched, not routed"},"with":true},{"path":["R","S","V"],"back":true,"label":"Routed into VLAN 20","tags":{"S":"Tag 20 · untagged out Fa0/4"}},{"path":["R","S","P"],"tone":"reply","label":"Page returned to ADMIN","tags":{"R":"Out Gi0/0.10 · untagged native"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"}],"rows":[["Gateways","ADMIN .10.1 · TEST20 .20.1 reply","ok"],["ADMIN ↔ TEST20","Routed by R1 · both reply","ok"],["http://192.168.20.30","Loads from ADMIN and TEST20","ok"],["Not yet proven","Controller trunk · WLAN","dim"]]}
```

## Step 5: Address the controller and open its setup page

On WLC1 open Config → Management and set IP address `192.168.10.5`, mask `255.255.255.0` and gateway `192.168.10.1`. This is the controller's management interface from the lesson: the address you manage it on and the address APs join. Its VLAN identifier `0` means untagged, so SW1 places these frames in native VLAN 10.

From ADMIN open Desktop → Web Browser. Try `http://192.168.10.5` first: a fresh Packet Tracer controller serves its first-time setup page over HTTP, then answers on `https://192.168.10.5` once setup is applied. A real controller should be managed over HTTPS. The setup pages insist on creating one WLAN; enter the SSID and key from the table and move on, because chapter 38 explains those security settings. Enter these values where the pages ask for them:

| Field, if requested | Value |
|---|---|
| System name | `WLC1` |
| Administrator | `labadmin` |
| Lab-only administrator password | `Admin-Lab-2026!` |
| Management IP/mask/gateway | `192.168.10.5` / `255.255.255.0` / `192.168.10.1` |
| Management VLAN/port | Untagged (`0`) / Port 1 |
| Management primary DHCP server, if requested | `192.168.10.1` |
| Required initial employee SSID | `ARCH-SETUP` |
| Initial WLAN security/key | WPA2-Personal, AES / `Cedar-Lab-2026!` |

Check the address and the untagged VLAN before you apply. If the controller restarts, reconnect with HTTPS and log in. If your version has no setup page, record that and treat the table as the controller's configuration for the remaining steps.

:::expected
ADMIN reaches the controller's page and logs in, and the management interface shows `192.168.10.5`, untagged, on Port 1. Reaching it also proves that the Fa0/24 trunk carries native VLAN 10.
:::

```state
{"status":"WLC1 management reached","tone":"ok","focus":["W"],"flows":[{"path":["P","S","W"],"back":true,"label":"ADMIN opens https://192.168.10.5","tags":{"S":"VLAN 10 · untagged out Fa0/24","W":"Setup page, where implemented"},"backTags":{"S":"Untagged in · native VLAN 10"}}],"chips":[{"node":"W","text":"Mgmt VLAN 0 = untagged"}],"rows":[["WLC1 management","192.168.10.5/24 · gw 192.168.10.1"],["Port 1 · VLAN 0","Untagged → SW1 native VLAN 10"],["ADMIN","Reaches the page where implemented","ok"],["No such controls","Record it · use the worksheet","dim"]]}
```

## Step 6: Check AP addressing and registration separately

AP1 uses DHCP by default. Confirm that in its Config tab and note the address it received. On R1 inspect:

```ios R1
R1# show ip dhcp binding
```

On the controller open Wireless → Access Points → All APs. AP1 and WLC1 share VLAN 10, so the AP's local-subnet broadcast finds the controller and no option 43 is needed. The join can take a minute; do not reboot the AP while it is joining.

:::expected
R1's binding table shows AP1 with an address in `192.168.10.100–149`. The controller lists AP1 as registered, which is the evidence that discovery and the CAPWAP join succeeded; the lease proves only addressing. If your version does not register the AP, write the sequence from the lesson (lease, discovery, DTLS and join, configuration) and mark it not simulated.
:::

```state
{"status":"AP1 leased and registered","tone":"ok","focus":["A"],"flows":[{"path":["A","S","R"],"back":true,"label":"AP1 DHCP exchange","tags":{"R":"AP-MGMT · lease in .100–.149"}},{"path":["A","S","W"],"back":true,"label":"CAPWAP discovery and join","tags":{"A":"Same VLAN 10 · no option 43","W":"Protected join · configuration"}},{"event":["R","W"],"tags":{"R":"Binding lists AP1","W":"AP1 record operational"}}],"chips":[{"node":"A","text":"Lease .100–.149","tone":"ok","from":1},{"node":"W","text":"AP1 registered","tone":"ok","from":2}],"rows":[["AP1 lease","In .100–.149 · not always .100","ok"],["Discovery","Local subnet · VLAN 10"],["WLC1 AP record","Registered = join succeeded","ok"],["Not simulated","Write the sequence · unexecuted","dim"]]}
```

## Step 7: Inspect the client VLAN mapping

A dynamic interface maps a WLAN to a wired VLAN. On the controller choose Controller → Interfaces → New and create `users` with VLAN ID `20`, Port `1`, IP `192.168.20.5`, mask `255.255.255.0` and gateway `192.168.20.1`. No WLAN uses this interface yet, so leave the DHCP server blank. If the page will not save without one, enter the gateway address `192.168.20.1`.

From TEST20 ping `192.168.20.5`. Then inspect SW1:

```ios SW1
SW1# show interfaces trunk
SW1# show mac address-table dynamic vlan 20
```

:::expected
Fa0/24 is trunking with native VLAN 10 and allows VLANs 10 and 20. The ping succeeds and SW1 learns the controller's MAC address in VLAN 20 on Fa0/24, so one cable carries untagged management and tagged `users` traffic. That is why the controller port is a trunk while the AP port is not. If your version does not answer the ping, record that; chapter 38 tests a real wireless client.
:::

```state
{"status":"users mapped to VLAN 20","focus":["W"],"flows":[{"path":["T","S","W"],"back":true,"label":"TEST20 pings 192.168.20.5","tags":{"S":"VLAN 20 · tagged 20 out Fa0/24","W":"users interface · VLAN 20"},"backTags":{"S":"WLC1 MAC learned in VLAN 20"}}],"chips":[{"node":"W","text":"mgmt untagged · users tag 20"}],"rows":[["WLC1 users","VLAN 20 · 192.168.20.5 · gw .20.1"],["Fa0/24 trunk","Native 10 · allowed 10,20"],["Ping 192.168.20.5","Supports the mapping, if answered","ok"],["Wireless clients","Not proven · Chapter 38","dim"]]}
```

## Step 8: Record and save the working baseline

Record the AP address/MAC, controller management values, switchport modes and whether AP registration was observed or only described. Save both IOS devices independently:

```ios R1
R1# copy running-config startup-config
```

Press Enter at the destination-filename prompt. On SW1:

```ios SW1
SW1# copy running-config startup-config
```

Press Enter there as well. On the controller use its Save Configuration action if available. Save `architecture-baseline.pkt`, then a second copy, `architecture-fault.pkt`.

:::expected
Both startup configurations are saved. You are working in the fault copy, and the baseline file is untouched.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R","S"],"chips":[{"node":"R","text":"startup-config saved","tone":"ok"},{"node":"S","text":"startup-config saved","tone":"ok"}],"rows":[["R1 · SW1","copy running-config startup-config","ok"],["WLC1","Save Configuration, if available"],["Files","architecture-baseline · -fault.pkt","ok"],["AP registration","Recorded as observed or described"]]}
```

## Step 9: Remove the AP's Ethernet path and observe

An AP's registration depends on its management path to the controller. Predict which of these change when the AP's port goes down: AP registration, ADMIN's access to the controller, and the WEB20 page. Then shut only the AP port on SW1:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# shutdown
SW1(config-if)# end
SW1# show interfaces fastethernet0/1
```

Observe AP1's wired link, its controller record after the controller detects loss, ADMIN's management access and ADMIN's WEB20 page. Do not repair yet.

:::expected
Fa0/1 is administratively down, and AP1 leaves the controller's AP list once the controller notices the loss. ADMIN still reaches R1, WLC1 and the WEB20 page, because none of those paths use Fa0/1. R1 may still list AP1's lease: a binding shows that an address was handed out, not that the device is reachable now.
:::

```state
{"status":"AP port shut","tone":"bad","focus":["S","A"],"cut":[["S","A"]],"flows":[{"event":["S"],"wait":1.2,"tags":{"S":"Fa0/1 shutdown · admin down"}},{"path":["W","S","A"],"label":"CAPWAP toward AP1","stop":"S","stopText":"Fa0/1 admin down · AP1 cut off"},{"path":["P","S","R"],"back":true,"label":"ADMIN reaches R1"},{"path":["P","S","W"],"back":true,"label":"ADMIN opens WLC1 management"}],"chips":[{"node":"A","text":"No path to WLC1","tone":"bad"},{"node":"W","text":"AP1 registered","tone":"ok","until":1},{"node":"W","text":"AP1 record may linger","tone":"warn","from":1}],"rows":[["SW1 Fa0/1","Administratively down","bad"],["AP1 ↔ WLC1","Communication interrupted","bad"],["ADMIN → R1 · WLC1","Still reachable (WLC1 normally)","ok"],["Stale lease or AP record","Not proof AP1 works","warn"]]}
```

## Step 10: Restore the AP path

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces fastethernet0/1
```

Wait for the link and for AP1 to register again. Repeat the checks from Step 6 and reload the WEB20 page from both PCs. Save this file; the baseline stays as it was.

:::expected
Fa0/1 is up and the controller lists AP1 again. AP1 may keep its old address or receive a new one; either is correct.
:::

```state
{"status":"AP path restored","tone":"ok","focus":["S","A"],"wake":["A"],"flows":[{"event":["S"],"wait":1.2,"tags":{"S":"Fa0/1 no shutdown · link up"}},{"path":["A","S","W"],"back":true,"label":"AP1 re-registers with WLC1","tags":{"W":"AP1 operational again"}},{"path":["P","S","R"],"label":"ADMIN opens http://192.168.20.30","tags":{"R":"Gi0/0.10 in · routed to Gi0/0.20"}},{"path":["T","S","V"],"back":true,"tone":"alt","label":"TEST20 opens http://192.168.20.30","with":true},{"path":["R","S","V"],"back":true,"label":"Routed into VLAN 20"},{"path":["R","S","P"],"tone":"reply","label":"Page returned to ADMIN"}],"chips":[{"node":"A","text":"No path to WLC1","tone":"bad","until":1},{"node":"W","text":"AP1 operational","tone":"ok","from":2}],"rows":[["SW1 Fa0/1","Up again","ok"],["AP1 lease","Retained or renewed · both fine"],["WLC1 AP list","AP1 operational, where supported","ok"],["WEB20 page","Loads from ADMIN and TEST20","ok"]]}
```

## Step 11: Work through a local-switching change

This step is a written exercise, because Packet Tracer's AP does not implement FlexConnect local switching. A second AP, AP2, will connect to SW1 Fa0/5. It sends management untagged in VLAN 10 and locally switches a staff WLAN tagged in VLAN 20. Write the configuration for Fa0/5, then compare it with the answer.

:::solution
```ios SW1 — worksheet answer; Fa0/5 reserved for the described AP2
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# spanning-tree portfast trunk
SW1(config-if)# no shutdown
SW1(config-if)# end
```

Compare this with Fa0/1. AP1 needs only an access port because its clients' traffic leaves the wireless system at the controller. AP2 needs a trunk because its clients' traffic leaves at the AP. If VLAN 20 were missing from AP2's allowed list, AP2 would still join the controller over VLAN 10 while its staff clients received no address.
:::

```state
{"status":"Worksheet: AP2 on Fa0/5","focus":["S"],"chips":[{"node":"S","text":"Fa0/5 · AP2 worksheet"}],"rows":[["AP2 cable","SW1 Fa0/5 · described, not built"],["Untagged","Management VLAN 10"],["Tagged","Locally switched staff VLAN 20"],["Lab devices","Unchanged · written answer","dim"]]}
```

## Step 12: Check power and supported aggregation

This step is also written, because the Packet Tracer 2960 has no PoE and the lab has no two-port AP. Answer both parts.

**Part A.** A Meraki MR53 connects both of its Ethernet ports to a PoE switch on Gi1/0/1–2. The AP bundles them with LACP in passive mode, sends management untagged in VLAN 10 and bridges clients tagged in VLAN 20. Write the switch configuration and the three commands you would use to check power, the bundle and the trunk.

**Part B.** WLC1 gets a second cable to SW1 Fa0/23, and LAG is enabled on the controller. Which `channel-group` mode must SW1 use on Fa0/23–24, and why?

:::solution
**Part A.** The AP is passive, so the switch must be `active`; two passive ends never start LACP. The member ports and Port-channel1 need the same trunk mode, native VLAN and allowed list:

```ios SW1 — supported hardware worksheet only
SW1# configure terminal
SW1(config)# interface range gigabitethernet1/0/1 - 2
SW1(config-if-range)# switchport mode trunk
SW1(config-if-range)# switchport trunk native vlan 10
SW1(config-if-range)# switchport trunk allowed vlan 10,20
SW1(config-if-range)# power inline auto
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# interface port-channel1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# end
SW1# show power inline
SW1# show etherchannel summary
SW1# show interfaces trunk
```

`show power inline` shows each port's allocation. Compare it with what the AP needs, because an AP can be powered and still be short of the power for full radio operation. `show etherchannel summary` should show both members bundled in a Layer 2 port channel.

**Part B.** `channel-group 1 mode on`. An AireOS LAG is a static bundle that runs neither LACP nor PAgP, so `active` or `desirable` on the switch would never form the channel. Fa0/23 and the port channel need the same trunk settings that Fa0/24 received in Step 2.
:::

```state
{"status":"Hardware worksheet only","chips":[{"node":"S","text":"Non-PoE · worksheet not applied"}],"rows":[["MR53","PoE uplink + 2nd port · LACP passive"],["PoE switch","Gi1/0/1–2 · sufficient power"],["VLANs","Mgmt untagged 10 · clients tagged 20"],["WLC1 LAG","Fa0/23–24 · static mode on"]]}
```

## Troubleshooting

- **PC cannot reach its gateway:** check access VLAN, mask, trunk allowed list, router encapsulation/native setting and interface state before controller settings.
- **AP lacks an address:** check power/link, access VLAN, DHCP mode and available pool. An old lease entry does not prove current connectivity.
- **AP has an address but is absent from the controller:** check that the AP can reach the controller's address and that UDP 5246 and 5247 are not filtered. When the two are in different subnets, check that option 43 or DNS supplies the controller address.
- **Management works but a client VLAN fails:** find where that WLAN's traffic leaves the wireless system. A centrally switched VLAN must be allowed on the controller trunk; a locally switched VLAN must be allowed on the AP trunk.
- **A controller page is missing in your version:** complete that step on paper. Do not swap in an autonomous AP; it never registers with a controller.

### Evidence to keep

Keep your port table (which ports are access, which are trunks, and why), the gateway and HTTP results, AP1's address and registration record, your observations from Steps 9 and 10, and your answers to Steps 11 and 12.

## Challenge

Use a copy of the recovered design. This is a written design exercise for AP2, the FlexConnect AP from Step 11. AP2 on SW1 Fa0/5 locally switches staff VLAN 20 and a new guest VLAN 30; management remains untagged VLAN 10. Its documented management address is `192.168.10.50/24` with gateway `192.168.10.1`. The gateway and DHCP for VLAN 30 must be provided by R1: `192.168.30.1/24` and only `.100–.109` leases. VLAN 30 clients need routed access to WEB20 `192.168.20.30`; no guest-isolation ACL is part of this exercise. The R1 trunk currently allows only 10,20.

Write the smallest complete switch/router additions, the AP tagging contract and required client evidence. Preserve AP1 management and existing wired HTTP service. Say which tests you can run in Packet Tracer and which need a real FlexConnect AP and client. Finally, suppose the WAN to a remote RADIUS server fails while local forwarding and DHCP stay available: can a new 802.1X client still join, and why?

:::solution
Create VLAN 30; permit it on AP2's local client trunk and R1's trunk. WLC1's central distribution trunk does not need VLAN 30 for this explicitly local WLAN.

```ios SW1 — worksheet
SW1# configure terminal
SW1(config)# vlan 30
SW1(config-vlan)# name GUEST
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/5
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10,20,30
SW1(config-if)# spanning-tree portfast trunk
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan add 30
SW1(config-if)# end
SW1# show interfaces trunk
```

```ios R1 — worksheet
R1# configure terminal
R1(config)# interface gigabitethernet0/0.30
R1(config-subif)# encapsulation dot1Q 30
R1(config-subif)# ip address 192.168.30.1 255.255.255.0
R1(config-subif)# exit
R1(config)# ip dhcp excluded-address 192.168.30.1 192.168.30.99
R1(config)# ip dhcp excluded-address 192.168.30.110 192.168.30.254
R1(config)# ip dhcp pool GUEST
R1(dhcp-config)# network 192.168.30.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.30.1
R1(dhcp-config)# end
R1# show ip interface brief
R1# show ip dhcp pool GUEST
```

The /24 has 254 ordinary host addresses; excluding 99 + 145 leaves 10 candidates, .100–.109. Keep existing pools and subinterfaces. AP2's management is untagged 10; staff and guest leave locally tagged 20 and 30. AP2's static .50 is already outside the .100–.149 management pool; verify it is unused before assigning it.

In Packet Tracer you can apply and verify the VLAN, trunk, subinterface and pool additions and repeat the ADMIN and TEST20 HTTP tests. The AP2 and guest-client results are predictions; on real equipment you would confirm a guest lease, its gateway and the WEB20 page, then retest staff and AP management.

No. Local switching decides where data is forwarded; it does not authenticate anyone. A new 802.1X client still needs a reachable RADIUS server, so it fails until the WAN returns or a local server is configured. Clients that are already connected keep forwarding.
:::
