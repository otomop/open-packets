---
title: Build the wired foundation for a controller WLAN
environment: mixed
devices: ["1 × 2911 router", "1 × 2960 switch", "1 × WLC-3504 where available", "1 × LAP-PT", "2 × PC-PT", "1 × Server-PT"]
minutes: 80
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.
Build a management VLAN, a separate client VLAN and the links required for centrally switched wireless service. This lab proves the wired foundation and, where the selected Packet Tracer model supports it, AP registration. The next chapter builds and tests the client WLAN.

Keep this two-VLAN project as your architecture reference. Chapter 38 starts a separate, simpler project to isolate security and client admission; it does not require carrying this addressing plan into that lab. The same distinction still applies: AP registration proves a management path, while the client WLAN must map onto a working client path.

:::note Simulator boundary
Start with a new file and record your Packet Tracer version. Use a WLC-3504 and LAP-PT if your palette offers them. Their setup pages and exposed features vary. The switch/router work below is independent of those pages. If the controller lacks a required control or the AP cannot register with the available models, complete the explicitly identified controller worksheet using the given values and record “not simulated”; do not record a successful join. No real RF, PoE negotiation, Meraki dashboard or Catalyst 9800 is simulated by this lab.
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

Place the named models, cable the listed interfaces and name the PCs ADMIN and TEST20. Open AP1's Physical tab. If it requires an external power adapter, fit the model's supplied adapter. A non-PoE 2960 model does not supply power simply because Ethernet is connected.

On both PCs and WEB20, use Desktop → IP Configuration to enter each static address, `255.255.255.0` mask and gateway from the table. Leave DNS blank. On WEB20 select Services → HTTP → On; use its disposable local page as the service target. Keep the controller disconnected from any real network.

:::expected
Both PCs show the intended values. AP1 has power if supported by the chosen model. The router's Ethernet link may remain down until Step 3. A powered device or green cable is not yet proof of IP reachability.
:::

```state
{"status":"Cabled · hosts addressed","wake":["P","T","V"],"focus":["P","T","V"],"chips":[{"node":"V","text":"HTTP On","tone":"ok"}],"rows":[["ADMIN · TEST20","Static address · /24 · gateway"],["WEB20","192.168.20.30 · HTTP On"],["AP1","External adapter, if required"],["R1 link","May stay down until Step 3","dim"]]}
```

## Step 2: Configure VLANs and switchports

Before entering the supplied setup, predict which ports carry tagged client traffic and which carry only untagged management. The AP centrally switches client traffic in this design. Start in the SW1 console. The native VLAN is deliberately 10 on both trunks; VLAN 20 remains tagged.

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

The exclusions leave 50 potential AP leases, `.100–.149`. VLAN 20 uses a static test PC, so it does not yet require a DHCP pool.

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
Gi0/0 and both subinterfaces are up/up once the switch link is active. The pool covers `192.168.10.0/24` with the stated exclusions. No DNS service has been falsely advertised at the router address.
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

Open `http://192.168.20.30` from ADMIN and TEST20. Record both page results, not just the ping results. Retry after initial ARP resolution if necessary. Check the return gateway on the destination PC before changing routing.

:::expected
Both local gateways and the opposite PC respond in this isolated topology. A loaded page also establishes the configured HTTP service through those wired paths. The ping results support the two VLANs, R1's subinterfaces and both PCs' return paths. It does not prove the controller trunk or a wireless WLAN.
:::

```state
{"status":"Wired paths proven","tone":"ok","focus":["R"],"flows":[{"path":["P","S","R"],"back":true,"label":"ADMIN pings 192.168.10.1","tags":{"S":"VLAN 10 · native, untagged to R1"}},{"path":["T","S","R"],"back":true,"with":true,"tone":"alt","label":"TEST20 pings 192.168.20.1","tags":{"S":"VLAN 20 · tagged 20 to R1"}},{"path":["P","S","R"],"label":"ADMIN opens http://192.168.20.30","tags":{"R":"Gi0/0.10 in · routed to Gi0/0.20"}},{"path":["T","S","V"],"back":true,"tone":"alt","label":"TEST20 opens http://192.168.20.30","tags":{"S":"VLAN 20 · switched, not routed"},"with":true},{"path":["R","S","V"],"back":true,"label":"Routed into VLAN 20","tags":{"S":"Tag 20 · untagged out Fa0/4"}},{"path":["R","S","P"],"tone":"reply","label":"Page returned to ADMIN","tags":{"R":"Out Gi0/0.10 · untagged native"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"}],"rows":[["Gateways","ADMIN .10.1 · TEST20 .20.1 reply","ok"],["ADMIN ↔ TEST20","Routed by R1 · both reply","ok"],["http://192.168.20.30","Loads from ADMIN and TEST20","ok"],["Not yet proven","Controller trunk · WLAN","dim"]]}
```

## Step 5: Address the controller and open its setup page

On WLC1 look for Config → Management. Where exposed, set `192.168.10.5`, mask `255.255.255.0` and gateway `192.168.10.1`. Choose Port 1. A management VLAN value `0` on this AireOS-style interface means untagged; the switch assigns those frames to native VLAN 10.

From ADMIN open Desktop → Web Browser. Try the controller's HTTPS management URL, `https://192.168.10.5`. A fresh Packet Tracer controller may instead expose its initial setup at `http://192.168.10.5`. Use that HTTP path only for this isolated simulator's day-zero page. Follow the displayed setup fields with these values:

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

Apply only after checking the address and VLAN treatment. Reconnect with HTTPS if the model restarts. If the model has no applicable management control or wizard, record the limitation and use this table as the controller worksheet for the remaining architecture observations. Do not guess a different factory address or credentials.

:::expected
Where implemented, ADMIN reaches the management page and can log in. The controller's displayed management configuration matches the worksheet. If not implemented, wired Steps 1–4 remain valid and controller observations are explicitly worksheet answers. No particular setup-page order or restart duration is assumed.
:::

```state
{"status":"WLC1 management reached","tone":"ok","focus":["W"],"flows":[{"path":["P","S","W"],"back":true,"label":"ADMIN opens https://192.168.10.5","tags":{"S":"VLAN 10 · untagged out Fa0/24","W":"Setup page, where implemented"},"backTags":{"S":"Untagged in · native VLAN 10"}}],"chips":[{"node":"W","text":"Mgmt VLAN 0 = untagged"}],"rows":[["WLC1 management","192.168.10.5/24 · gw 192.168.10.1"],["Port 1 · VLAN 0","Untagged → SW1 native VLAN 10"],["ADMIN","Reaches the page where implemented","ok"],["No such controls","Record it · use the worksheet","dim"]]}
```

## Step 6: Check AP addressing and registration separately

On AP1 select DHCP for its wired management interface if the model exposes the choice. Check the IP in its Config/status page. On R1 inspect:

```ios R1
R1# show ip dhcp binding
```

On the controller inspect Wireless → Access Points → All APs, or the model's AP summary. The AP and controller share VLAN 10 in this lab, allowing local discovery without requiring option 43. Wait for the simulator to process registration; do not repeatedly reboot the AP while it is joining.

:::expected
The AP's actual lease is within `192.168.10.100–149`; the first allocation is not guaranteed to be `.100`. A controller AP record in a registered/operational state is separate evidence that CAPWAP join succeeded. A lease alone is insufficient. If the available models do not implement registration, write the expected sequence: lease → discovery → protected join/configuration → operational AP, and mark it unexecuted.
:::

```state
{"status":"AP1 leased and registered","tone":"ok","focus":["A"],"flows":[{"path":["A","S","R"],"back":true,"label":"AP1 DHCP exchange","tags":{"R":"AP-MGMT · lease in .100–.149"}},{"path":["A","S","W"],"back":true,"label":"CAPWAP discovery and join","tags":{"A":"Same VLAN 10 · no option 43","W":"Protected join · configuration"}},{"event":["R","W"],"tags":{"R":"Binding lists AP1","W":"AP1 record operational"}}],"chips":[{"node":"A","text":"Lease .100–.149","tone":"ok","from":1},{"node":"W","text":"AP1 registered","tone":"ok","from":2}],"rows":[["AP1 lease","In .100–.149 · not always .100","ok"],["Discovery","Local subnet · VLAN 10"],["WLC1 AP record","Registered = join succeeded","ok"],["Not simulated","Write the sequence · unexecuted","dim"]]}
```

## Step 7: Inspect the client VLAN mapping

If the controller offers Controller → Interfaces → New, create `users` with VLAN ID `20`, Port `1`, IP `192.168.20.5`, mask `255.255.255.0` and gateway `192.168.20.1`. Leave an optional DHCP-server field unset because this step uses static addresses and creates no client WLAN; if the GUI requires a DHCP server to save, stop this optional step and use the worksheet instead of inventing a service.

From TEST20 ping `192.168.20.5` if the model answers that interface. Then inspect SW1:

```ios SW1
SW1# show interfaces trunk
SW1# show mac address-table dynamic vlan 20
```

:::expected
The intended mapping is untagged management in VLAN 10 and tagged `users` in VLAN 20 on the same cable. A successful interface ping supports that mapping. A learned controller MAC or GUI interface entry still does not prove wireless client forwarding; Chapter 38 verifies an actual client. Missing dynamic-interface controls or ICMP support are worksheet limitations, not evidence that trunks are unnecessary.
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
Your record distinguishes working wired tests from optional controller observations. The fault copy is open, and the baseline remains available for comparison.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R","S"],"chips":[{"node":"R","text":"startup-config saved","tone":"ok"},{"node":"S","text":"startup-config saved","tone":"ok"}],"rows":[["R1 · SW1","copy running-config startup-config","ok"],["WLC1","Save Configuration, if available"],["Files","architecture-baseline · -fault.pkt","ok"],["AP registration","Recorded as observed or described"]]}
```

## Step 9: Remove the AP's Ethernet path and observe

Predict which observations should change: AP registration, ADMIN's controller access and the wired WEB20 page. On SW1 administratively shut only the AP port:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# shutdown
SW1(config-if)# end
SW1# show interfaces fastethernet0/1
```

Observe AP1's wired link, its controller record after the controller detects loss, ADMIN's management access and ADMIN's WEB20 page. Do not repair yet.

:::expected
Fa0/1 is administratively down. AP–controller communication is interrupted, while ADMIN can still reach R1 and normally WLC1. A stale DHCP binding or temporarily retained AP record can remain; neither proves the disconnected AP is working. If AP registration was not simulated, record this controller effect as a prediction.
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

Wait for link and, where supported, AP re-registration. Repeat the addressing and controller checks from Step 6 and the WEB20 page from both wired clients. Save the recovered file separately from the original baseline.

:::expected
The link returns up and the AP regains its management path. A working controller implementation again lists the AP operational. The lease can be retained or renewed; do not require a new address to call the recovery successful.
:::

```state
{"status":"AP path restored","tone":"ok","focus":["S","A"],"wake":["A"],"flows":[{"event":["S"],"wait":1.2,"tags":{"S":"Fa0/1 no shutdown · link up"}},{"path":["A","S","W"],"back":true,"label":"AP1 re-registers with WLC1","tags":{"W":"AP1 operational again"}},{"path":["P","S","R"],"label":"ADMIN opens http://192.168.20.30","tags":{"R":"Gi0/0.10 in · routed to Gi0/0.20"}},{"path":["T","S","V"],"back":true,"tone":"alt","label":"TEST20 opens http://192.168.20.30","with":true},{"path":["R","S","V"],"back":true,"label":"Routed into VLAN 20"},{"path":["R","S","P"],"tone":"reply","label":"Page returned to ADMIN"}],"chips":[{"node":"A","text":"No path to WLC1","tone":"bad","until":1},{"node":"W","text":"AP1 operational","tone":"ok","from":2}],"rows":[["SW1 Fa0/1","Up again","ok"],["AP1 lease","Retained or renewed · both fine"],["WLC1 AP list","AP1 operational, where supported","ok"],["WEB20 page","Loads from ADMIN and TEST20","ok"]]}
```

## Step 11: Work through a local-switching change

This is a worksheet, because Packet Tracer's generic AP is not a verified FlexConnect implementation. AP2 is configured to send management untagged in VLAN 10 and a locally switched staff WLAN tagged in VLAN 20. Its only cable goes to SW1 Fa0/5. Write the switch configuration, then compare with the answer.

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

If VLAN 20 is removed from this trunk's allowed list, AP management can remain healthy while locally switched clients lose their VLAN 20 path. Repair by restoring VLAN 20 to the allowed list and verifying client DHCP/reachability. Creating the VLAN and providing its DHCP/gateway services are additional prerequisites, not effects of changing the port mode.
:::

```state
{"status":"Worksheet: AP2 on Fa0/5","focus":["S"],"chips":[{"node":"S","text":"Fa0/5 · AP2 worksheet"}],"rows":[["AP2 cable","SW1 Fa0/5 · described, not built"],["Untagged","Management VLAN 10"],["Tagged","Locally switched staff VLAN 20"],["Lab devices","Unchanged · written answer","dim"]]}
```

## Step 12: Check power and supported aggregation

Complete this hardware worksheet without applying it to the non-PoE simulation. A documented MR53 deployment uses its PoE uplink and second Ethernet port in LACP, management untagged in VLAN 10, clients tagged in VLAN 20. The selected PoE switch has sufficient documented AP power and two compatible ports, Gi1/0/1–2. The AP's dashboard aggregation setting is enabled and its LACP mode is passive.

Write the required switch settings and the evidence you would collect. Configure an actual device only in an authorized isolated lab using its installation guide.

:::solution
The switch must initiate LACP with `active`; `passive` on both ends would not initiate negotiation. Both members and Port-channel1 need matching trunk/native/allowed VLAN configuration. A representative IOS XE template is:

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

Check the AP's actual power requirement, available switch budget and negotiated allocation; an “on” power status alone does not guarantee full radio capability. Expect a working Layer 2 port-channel with both members bundled, plus matching AP status. On documented legacy AireOS LAG, the switch's static `mode on` would be a different requirement.
:::

```state
{"status":"Hardware worksheet only","chips":[{"node":"S","text":"Non-PoE · worksheet not applied"}],"rows":[["MR53","PoE uplink + 2nd port · LACP passive"],["PoE switch","Gi1/0/1–2 · sufficient power"],["VLANs","Mgmt untagged 10 · clients tagged 20"]]}
```

## Troubleshooting

- **PC cannot reach its gateway:** check access VLAN, mask, trunk allowed list, router encapsulation/native setting and interface state before controller settings.
- **AP lacks an address:** check power/link, access VLAN, DHCP mode and available pool. An old lease entry does not prove current connectivity.
- **AP has an address but is absent from the controller:** check discovery, IP reachability, permitted CAPWAP traffic, model/software compatibility and certificate/time errors where the platform exposes them.
- **Management works but a client VLAN fails:** compare the actual tagging and local/central forwarding design. Do not put client VLANs on an AP trunk merely because they exist somewhere in the WLAN.
- **GUI features are missing:** use the documented worksheet boundary. Do not silently substitute an autonomous AP and call it a registered lightweight AP.

### Evidence to keep

Submit the written port contract, wired gateway and HTTP results, AP address and registration evidence (or its explicit worksheet limitation), the before/after AP-port fault, and separate central/local forwarding drawings. Power and aggregation are documented design worksheets unless you actually used the specified hardware. Do not claim wireless client service here; Chapter 38 performs that test.

## Challenge

Use a copy of the recovered design. This is an independent **design worksheet**, not a claim that Packet Tracer implements FlexConnect. AP2 on reserved SW1 Fa0/5 locally switches staff VLAN 20 and a new guest VLAN 30; management remains untagged VLAN 10. Its documented management address is `192.168.10.50/24` with gateway `192.168.10.1`. The gateway and DHCP for VLAN 30 must be provided by R1: `192.168.30.1/24` and only `.100–.109` leases. VLAN 30 clients need routed access to WEB20 `192.168.20.30`; no guest-isolation ACL is part of this exercise. The R1 trunk currently allows only 10,20.

Write the smallest complete switch/router additions, the AP tagging contract and required client evidence. Preserve AP1 management and existing wired HTTP service. Specify which live tests you can perform now and which guest tests require a supported AP/client implementation. Finally, suppose the WAN to a remote RADIUS server fails but local forwarding and DHCP stay available: does local switching alone establish that a new Enterprise client can authenticate?

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

On supported equipment, verify a fresh guest lease/mask/gateway, the local gateway and WEB20 HTTP page, then retest staff and AP management. In the supplied simulator, verify the VLAN/trunk/subinterface/pool additions if implemented and repeat ADMIN/TEST20 HTTP; label AP2 and wireless guest outcomes as predictions. A written configuration alone does not establish a successful wireless test.

Local switching does not replace unavailable RADIUS authentication. Existing supported local forwarding and new authentication have different dependencies; new Enterprise authentication needs the configured reachable service or an explicitly supported alternative.
:::
