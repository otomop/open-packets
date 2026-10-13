---
title: Diagnose four faults on a two-router path
environment: packet-tracer
devices: ["2 × 2911 routers (R1, R2)", "2 × 2960 switches (SW1, SW2)", "1 × PC-PT (PC-A)", "1 × Server-PT (SRV)"]
minutes: 85
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a working network, collect its baseline, and break one feature at a time. For each fault, record the symptom, evidence, proposed cause, repair, and client retest. All outputs described below are expected or representative teaching evidence; this lab has not been manually executed in Packet Tracer or CML. Simulator support and response wording vary.

The configuration blocks are supplied preparation. Your assessed work is choosing useful observations, separating facts from remaining explanations, and proving recovery from PC-A. Use one row per test: source, destination/name, protocol, prediction, observed result, and what that result still leaves uncertain. A predicted result is not an observation; mark any unsupported capture or command as a worksheet instead.

## Topology

```diagram
{"type":"topology","title":"Two LANs with a routed transit","caption":"The server and client each need their local gateway; R2 also needs a route back to the client LAN.","nodes":[{"id":"PC","kind":"pc","label":"PC-A","sub":"10.0.10.50/24","x":1,"y":1},{"id":"S1","kind":"switch","label":"SW1","sub":"VLAN 10","x":4,"y":1},{"id":"R1","kind":"router","label":"R1","x":8,"y":1},{"id":"R2","kind":"router","label":"R2","x":8,"y":5},{"id":"S2","kind":"switch","label":"SW2","sub":"VLAN 20","x":4,"y":5},{"id":"SRV","kind":"server","label":"SRV","sub":"10.0.20.10/24","x":1,"y":5}],"links":[{"from":"PC","to":"S1","toLabel":"Fa0/1"},{"from":"S1","to":"R1","fromLabel":"Fa0/24","toLabel":"Gi0/0"},{"from":"R1","to":"R2","fromLabel":"Gi0/1","toLabel":"Gi0/1","label":"10.0.99.0/30","accent":true},{"from":"R2","to":"S2","fromLabel":"Gi0/0","toLabel":"Fa0/24"},{"from":"S2","to":"SRV","fromLabel":"Fa0/1"}]}
```

| Device/interface | Address and mask | Connection/cable |
|---|---|---|
| PC-A FastEthernet0 | 10.0.10.50, 255.255.255.0; gateway 10.0.10.1; DNS 10.0.20.10 | SW1 Fa0/1, straight-through |
| R1 Gi0/0 | 10.0.10.1, 255.255.255.0 | SW1 Fa0/24, straight-through |
| R1 Gi0/1 | 10.0.99.1, 255.255.255.252 | R2 Gi0/1, crossover or Auto-Connect |
| R2 Gi0/1 | 10.0.99.2, 255.255.255.252 | R1 Gi0/1, same transit cable |
| R2 Gi0/0 | 10.0.20.1, 255.255.255.0 | SW2 Fa0/24, straight-through |
| SRV FastEthernet0 | 10.0.20.10, 255.255.255.0; gateway 10.0.20.1; DNS 10.0.20.10 | SW2 Fa0/1, straight-through |

All devices are fresh lab devices. Switch ports are access ports, with no trunks required. Leave 10.0.20.99 unused for a later DNS fault. This is an isolated simulated network; no Internet connection or NAT is required.

## Step 1: Build the complete baseline

Cable the listed ports. Set PC-A and SRV under Desktop → IP Configuration. Open each Cisco CLI, decline the initial setup dialog if offered, and configure the following. If a logging command is unsupported, record that limitation and use current interface state plus Simulation observations for the log portion.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet0/1
R1(config-if)# ip address 10.0.99.1 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# ip route 10.0.20.0 255.255.255.0 10.0.99.2
R1(config)# service timestamps log datetime msec
R1(config)# logging buffered 16384 informational
R1(config)# end
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/1
R2(config-if)# ip address 10.0.99.2 255.255.255.252
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/0
R2(config-if)# ip address 10.0.20.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# ip route 10.0.10.0 255.255.255.0 10.0.99.1
R2(config)# service timestamps log datetime msec
R2(config)# logging buffered 16384 informational
R2(config)# end
```

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name USERS
SW1(config-vlan)# vlan 20
SW1(config-vlan)# name FAULT-TEST
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/1, fastethernet0/24
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
```

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# vlan 20
SW2(config-vlan)# name SERVERS
SW2(config-vlan)# exit
SW2(config)# interface range fastethernet0/1, fastethernet0/24
SW2(config-if-range)# switchport mode access
SW2(config-if-range)# switchport access vlan 20
SW2(config-if-range)# no shutdown
SW2(config-if-range)# end
```

On SRV → Services, turn HTTP and DNS On. Add A record `app.lab.example` with address `10.0.20.10`, and a second A record `fresh.lab.example` with the same address. Leave DHCP Off on SRV; R2 will supply an optional DHCP demonstration later. Wait for switch ports to reach forwarding before testing.

:::expected
The router interfaces become up/up with the table's addresses. SW1 VLAN 10 contains Fa0/1 and Fa0/24; SW2 VLAN 20 contains its two used ports. Both static routes are installed. Server records use the intended address; neither .99 nor a public resolver is involved.
:::

```state
{"status":"Baseline built","led":true,"focus":["R1","R2","S1","S2"],"chips":[{"node":"R1","text":"S 10.0.20.0/24 via 10.0.99.2"},{"node":"R2","text":"S 10.0.10.0/24 via 10.0.99.1"},{"node":"SRV","text":"HTTP On · DNS On"}],"rows":[["Router interfaces","Up/up · table addresses","ok"],["Static routes","Both installed","ok"],["Access VLANs","SW1 VLAN 10 · SW2 VLAN 20"],["DNS A records","app, fresh.lab.example → .20.10"]]}
```

## Step 2: Record a healthy path and a sourced test

Before testing, fill the prediction column for PC-A to its gateway, PC-A to the server, R1 using its transit source, and R1 using its LAN source. Identify the reply destination in each case. For the browser, record both the intended name and the numeric address separately.

On PC-A run these commands, then open Web Browser to `http://10.0.20.10` and `http://app.lab.example`.

```text
ipconfig /all
ping 10.0.10.1
ping 10.0.20.10
nslookup app.lab.example
tracert 10.0.20.10
```

If PC `nslookup` is absent, use a fresh name-based ping and inspect the DNS PDU in Simulation. On R1, compare two source addresses. If one-line `source` syntax is unavailable, enter `ping`, supply the target, choose extended commands `y`, and enter the required source; accept unrelated defaults. Use that same alternative throughout the lab.

```ios R1
R1# show ip interface brief
R1# show ip route
R1# show arp
R1# show cdp neighbors
R1# ping 10.0.20.10 source 10.0.99.1
R1# ping 10.0.20.10 source 10.0.10.1
R1# copy running-config startup-config
```

```ios R2
R2# show ip route
R2# show logging
R2# copy running-config startup-config
```

```ios SW1
SW1# show interfaces status
SW1# show mac address-table
SW1# copy running-config startup-config
```

```ios SW2
SW2# copy running-config startup-config
```

Accept the destination filename prompt with Enter. Save the project as `toolkit-baseline.pkt`, then use Save As `toolkit-work.pkt` before injecting faults. Record PC-A's actual MAC address from its configuration/PC output.

:::expected
Both source tests and the client tests succeed after any transient startup delays. The name resolves to .20.10 and HTTP works. A conventional PC trace can show R1, R2, and SRV; exact interface addresses and response timing may differ. Do not require an initial ping loss. The next-hop ARP entries and PC MAC appear after relevant traffic; a successful test is stronger evidence than assuming an entry must already exist.
:::

```state
{"status":"Healthy baseline","tone":"ok","focus":["R1"],"flows":[{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A pings 10.0.20.10","tags":{"R1":"S 10.0.20.0/24 via 10.0.99.2"},"backTags":{"R2":"S 10.0.10.0/24 via 10.0.99.1"}},{"path":["R1","R2","S2","SRV"],"back":true,"label":"R1 pings 10.0.20.10 from 10.0.99.1","tags":{"R1":"Source 10.0.99.1 · transit"},"backTags":{"SRV":"Reply to 10.0.99.1"}},{"path":["R1","R2","S2","SRV"],"back":true,"label":"R1 pings 10.0.20.10 from 10.0.10.1","tags":{"R1":"Source 10.0.10.1 · LAN address"},"backTags":{"SRV":"Reply to 10.0.10.1"}}],"chips":[{"node":"SRV","text":"app.lab.example → 10.0.20.10","tone":"ok"}],"rows":[["PC-A to gateway and SRV","Pings and trace work","ok"],["R1 sourced pings","10.0.99.1 and 10.0.10.1 work","ok"],["app.lab.example","Resolves to .20.10 · HTTP works","ok"],["Saved","toolkit-baseline.pkt"]]}
```

## Step 3: Remove and diagnose the return route

Keep all client settings unchanged. Before removing the route, predict which of your four source/destination pairs should still work and which route each reply would need. Then remove only R2's return route:

```ios R2
R2# configure terminal
R2(config)# no ip route 10.0.10.0 255.255.255.0 10.0.99.1
R2(config)# end
R2# show ip route
```

```ios R1
R1# ping 10.0.20.10 source 10.0.99.1
R1# ping 10.0.20.10 source 10.0.10.1
```

Repeat PC-A's server-address ping and trace. In Simulation mode, clear old events, filter ICMP and ARP, generate one test, and inspect the forward request and return attempt. If the simulator does not expose a particular drop reason, record the available route and PDU evidence instead.

:::expected
The transit-source ping works because R2 knows 10.0.99.0/30. The LAN-source and PC tests fail because R2 now lacks a route to 10.0.10.0/24 and has no default. A trace may lose later responses even while forward probes progress. The route table establishes the cause here; source-test failure alone would also be compatible with source-based filtering.
:::

```state
{"status":"Return route removed","tone":"bad","focus":["R2"],"flows":[{"event":["R2"],"wait":1.6,"tags":{"R2":"Return route removed"}},{"path":["R1","R2","S2","SRV"],"back":true,"label":"R1 pings 10.0.20.10 from 10.0.99.1","tags":{"R1":"Source 10.0.99.1 · transit"},"backTags":{"R2":"Knows 10.0.99.0/30"}},{"path":["R1","R2","S2","SRV"],"back":true,"label":"R1 pings 10.0.20.10 from 10.0.10.1","tags":{"R1":"Source 10.0.10.1 · LAN address"},"backStop":"R2","backStopText":"No route to 10.0.10.0/24"},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A pings 10.0.20.10","backTags":{"SRV":"Replies to 10.0.10.50"},"backStop":"R2","backStopText":"No route to 10.0.10.0/24"}],"chips":[{"node":"R2","text":"S 10.0.10.0/24 via 10.0.99.1","until":0},{"node":"R2","text":"No route to 10.0.10.0/24","tone":"bad","from":0}],"rows":[["Source 10.0.99.1","Works · R2 knows 10.0.99.0/30","ok"],["Source 10.0.10.1, PC-A","Fail · no return route","bad"],["R2 default route","None"],["Decisive evidence","R2's route table"]]}
```

## Step 4: Restore the return route and verify the client

```ios R2
R2# configure terminal
R2(config)# ip route 10.0.10.0 255.255.255.0 10.0.99.1
R2(config)# end
R2# show ip route 10.0.10.50
```

```ios R1
R1# ping 10.0.20.10 source 10.0.10.1
```

Return Simulation to Realtime after observation. Repeat PC-A's ping and HTTP-by-name test. Write the cause and recovery evidence before continuing.

:::expected
R2 selects the static return route through 10.0.99.1; the LAN-source ping and client HTTP work. The earlier failure is resolved before another fault is introduced.
:::

```state
{"status":"Return route restored","tone":"ok","focus":["R2"],"flows":[{"event":["R2"],"wait":1.6,"tags":{"R2":"Static 10.0.10.0/24 restored"}},{"path":["R1","R2","S2","SRV"],"back":true,"label":"R1 pings 10.0.20.10 from 10.0.10.1","tags":{"R1":"Source 10.0.10.1 · LAN address"},"backTags":{"R2":"S 10.0.10.0/24 via 10.0.99.1"}},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A pings 10.0.20.10","backTags":{"R2":"S 10.0.10.0/24 via 10.0.99.1"}}],"chips":[{"node":"R2","text":"No route to 10.0.10.0/24","tone":"bad","until":0},{"node":"R2","text":"S 10.0.10.0/24 via 10.0.99.1","tone":"ok","from":0}],"rows":[["R2 lookup 10.0.10.50","Static route via 10.0.99.1","ok"],["LAN-source ping","Works","ok"],["PC-A ping, HTTP by name","Work","ok"]]}
```

## Step 5: Diagnose a shutdown at the far endpoint

Predict the local administrative state, the far-end link state, and whether PC-A's local gateway should remain reachable. Shut only R2's transit interface, then inspect both ends. Keep the predicted cause separate from the actual displayed evidence.

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/1
R2(config-if)# shutdown
R2(config-if)# end
R2# show ip interface brief
R2# show logging
```

```ios R1
R1# show ip interface brief
R1# show ip route
R1# show cdp neighbors
R1# show logging
```

Repeat PC-A's gateway and server pings. Keep current evidence; do not clear logs.

:::expected
R2 reports Gi0/1 administratively down. R1's peer link normally reports down/down, and its static route loses usable next-hop resolution. PC-A can still reach R1's LAN address but not SRV. A cached CDP entry may persist until it ages; its presence does not override current link state. Log messages and timing vary, but R2's administrative state directly identifies the deliberate shutdown.
:::

```state
{"status":"R2 Gi0/1 shut","tone":"bad","focus":["R2","R1"],"cut":[["R1","R2"]],"flows":[{"path":["PC","S1","R1"],"back":true,"label":"PC-A pings its gateway 10.0.10.1"},{"path":["PC","S1","R1","R2"],"label":"PC-A pings 10.0.20.10","stop":"R1","stopText":"No usable next hop 10.0.99.2"}],"roles":[{"node":"R2","peer":"R1","text":"admin down","tone":"bad"},{"node":"R1","peer":"R2","text":"down/down","tone":"bad"}],"rows":[["R2 Gi0/1","Administratively down","bad"],["R1 Gi0/1","Down/down","bad"],["PC-A to 10.0.10.1","Still replies","ok"],["PC-A to SRV","Fails","bad"]]}
```

## Step 6: Restore the transit interface

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/1
R2(config-if)# no shutdown
R2(config-if)# end
R2# show ip interface brief
```

```ios R1
R1# show ip route
R1# ping 10.0.20.10 source 10.0.10.1
```

Repeat the client's server ping and HTTP test after convergence.

:::expected
The transit becomes up/up, the intended routes are installed, and both sourced and client tests work. Record restoration separately from the earlier fault evidence.
:::

```state
{"status":"Transit restored","tone":"ok","focus":["R2","R1"],"flows":[{"event":["R2","R1"],"wait":1.6,"tags":{"R2":"no shutdown · Gi0/1 up/up","R1":"Gi0/1 up/up · routes installed"}},{"path":["R1","R2","S2","SRV"],"back":true,"label":"R1 pings 10.0.20.10 from 10.0.10.1","tags":{"R1":"Source 10.0.10.1 · LAN address"}},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A pings 10.0.20.10","tags":{"R1":"S 10.0.20.0/24 via 10.0.99.2"}}],"rows":[["Transit Gi0/1","Up/up at both ends","ok"],["Routes","Intended routes installed","ok"],["Sourced and client tests","Work","ok"]]}
```

## Step 7: Move the client into the wrong access VLAN

Predict the physical link state, VLAN used for new source-MAC learning, and gateway reachability before applying this one change. Do not change the PC address or clear tables to make the display match a prediction.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport access vlan 20
SW1(config-if)# end
SW1# show interfaces status
SW1# show vlan brief
```

Keep PC-A's 10.0.10.50/24 settings unchanged. Ping its gateway, then inspect the MAC table. On R1, ping 10.0.10.50 and inspect ARP. Existing cached entries can persist; use the current VLAN configuration and newly generated frames rather than demanding instantaneous table erasure.

```ios SW1
SW1# show mac address-table
```

```ios R1
R1# ping 10.0.10.50
R1# show arp
```

:::expected
The physical PC link remains connected, but its port is now in VLAN 20 while R1's port remains in VLAN 10. New source frames from PC-A are learned in VLAN 20. Gateway communication fails despite link-up status. ARP may be incomplete, absent, or temporarily stale depending on timing; the mismatched VLAN membership supplies the decisive evidence.
:::

```state
{"status":"PC-A in VLAN 20","tone":"bad","focus":["S1"],"flows":[{"event":["S1"],"wait":1.6,"tags":{"S1":"Fa0/1 → access VLAN 20"}},{"path":["PC","S1","R1"],"label":"PC-A pings its gateway 10.0.10.1","stop":"S1","stopText":"VLAN 20 · Fa0/24 is in VLAN 10"},{"path":["R1","S1","PC"],"label":"R1 pings 10.0.10.50","stop":"S1","stopText":"PC-A's Fa0/1 is now VLAN 20"}],"roles":[{"node":"S1","peer":"PC","text":"VLAN 10","until":0},{"node":"S1","peer":"PC","text":"VLAN 20","tone":"bad","from":0},{"node":"S1","peer":"R1","text":"VLAN 10"}],"chips":[{"node":"S1","text":"PC-A MAC learned in VLAN 20","tone":"bad","from":1}],"rows":[["PC link","Still connected · up"],["PC-A MAC","Learned in VLAN 20","bad"],["PC-A ↔ gateway","Fails despite link up","bad"],["R1 ARP for .50","Incomplete, absent or stale","dim"]]}
```

## Step 8: Restore the client VLAN

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport access vlan 10
SW1(config-if)# end
SW1# show vlan brief
```

Repeat gateway and server pings from PC-A, then inspect the MAC table again.

:::expected
PC-A's new source frames appear in VLAN 10 on Fa0/1, and the intended service works. Old entries in another VLAN may age independently; judge current forwarding from the test and intended configuration.
:::

```state
{"status":"Client VLAN restored","tone":"ok","focus":["S1"],"flows":[{"event":["S1"],"wait":1.6,"tags":{"S1":"Fa0/1 → access VLAN 10"}},{"path":["PC","S1","R1"],"back":true,"label":"PC-A pings its gateway 10.0.10.1"},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A pings 10.0.20.10"}],"roles":[{"node":"S1","peer":"PC","text":"VLAN 20","tone":"bad","until":0},{"node":"S1","peer":"PC","text":"VLAN 10","from":0},{"node":"S1","peer":"R1","text":"VLAN 10"}],"chips":[{"node":"S1","text":"PC-A MAC learned in VLAN 20","tone":"bad","until":0},{"node":"S1","text":"PC-A MAC in VLAN 10 · Fa0/1","tone":"ok","from":1}],"rows":[["PC-A MAC","VLAN 10 on Fa0/1","ok"],["Gateway and server pings","Work","ok"],["Old VLAN 20 entry","May age separately","dim"]]}
```

## Step 9: Introduce a valid but wrong DNS answer

Predict whether the direct-IP HTTP test, the new DNS answer, and the name-based HTTP test should agree. Choose a check that distinguishes a wrong received answer from a DNS timeout before changing the record.

On SRV → Services → DNS, edit only `app.lab.example` to `10.0.20.99`, the unused address. Keep `fresh.lab.example` unchanged. From PC-A, explicitly query `app.lab.example` with `nslookup` if supported and compare the answer with a ping to `10.0.20.10`. Inspect the DNS response in Simulation. If the client uses cached data or lacks the direct-query tool, add a new fault-test name `wrong.lab.example` → .20.99 and query that new name.

:::expected
The controlled IP-address service remains reachable. The fresh/direct DNS result points to unused .20.99, so a name-based connection cannot reach the intended server. This is a received positive answer containing wrong design data, distinct from NXDOMAIN or silence. Record what was actually queried and returned.
:::

```state
{"status":"Wrong DNS answer","tone":"bad","focus":["SRV"],"flows":[{"event":["SRV"],"wait":1.6,"tags":{"SRV":"app.lab.example → 10.0.20.99"}},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"nslookup app.lab.example","backTags":{"SRV":"Answers A 10.0.20.99","PC":"Positive answer · wrong address"}},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A pings 10.0.20.10"}],"chips":[{"node":"SRV","text":"app.lab.example → 10.0.20.10","until":0},{"node":"SRV","text":"app.lab.example → 10.0.20.99","tone":"bad","from":0}],"rows":[["DNS answer","A 10.0.20.99 · not NXDOMAIN","bad"],["Ping 10.0.20.10","Works","ok"],["Connect by name","Cannot reach SRV","bad"],["fresh.lab.example","Unchanged"]]}
```

## Step 10: Restore DNS and verify the complete service

Restore `app.lab.example` → `10.0.20.10` and delete optional `wrong.lab.example`. Repeat a direct query and browser test. If an application retains stale data, close and reopen it or use a new correctly configured test name, recording the cache limitation instead of changing unrelated routing.

:::expected
The responsible DNS service returns .20.10 and the client's intended HTTP test works. Verify the returned address as well as the page. All four injected faults have now been restored.
:::

```state
{"status":"DNS restored","tone":"ok","focus":["SRV"],"flows":[{"event":["SRV"],"wait":1.6,"tags":{"SRV":"app.lab.example → 10.0.20.10"}},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"nslookup app.lab.example","backTags":{"SRV":"Answers A 10.0.20.10"}},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A browses http://app.lab.example","tags":{"PC":"HTTP to 10.0.20.10"}}],"chips":[{"node":"SRV","text":"app.lab.example → 10.0.20.99","tone":"bad","until":0},{"node":"SRV","text":"app.lab.example → 10.0.20.10","tone":"ok","from":0}],"rows":[["DNS answer","A 10.0.20.10","ok"],["HTTP by name","Works","ok"],["Injected faults","All four restored","ok"]]}
```

## Step 11: Trace a fresh DHCP transaction through the same path

This optional integration exercise uses R2 as the DHCP server and R1 as relay; it reinforces the transaction evidence already taught in Chapter 24. Keep SRV DHCP Off. Before the client requests a lease, identify the relay address that should select the pool, the permitted address range, and the required reply path. Then use the supplied setup below. If omitting this extension, retain PC-A's verified static settings and record that choice in Step 12.

```ios R2
R2# configure terminal
R2(config)# service dhcp
R2(config)# ip dhcp excluded-address 10.0.10.1 10.0.10.99
R2(config)# ip dhcp pool USERS
R2(dhcp-config)# network 10.0.10.0 255.255.255.0
R2(dhcp-config)# default-router 10.0.10.1
R2(dhcp-config)# dns-server 10.0.20.10
R2(dhcp-config)# end
```

```ios R1
R1# configure terminal
R1(config)# service dhcp
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip helper-address 10.0.99.2
R1(config-if)# end
```

In Simulation, filter DHCP and ARP and clear previous events. Change PC-A → Desktop → IP Configuration to DHCP, then use Capture/Forward until allocation completes. Inspect the original request on the LAN, the relayed request toward R2, and delivery back to PC-A. Return to Realtime before subsequent pings. Inspect `show ip dhcp binding` on R2 and actual client settings.

:::expected
PC-A receives an available .100–.254 address, /24 mask, gateway .10.1, and DNS .20.10; do not assume allocation of the numerically first address. The relay's giaddr identifies 10.0.10.1. Offer/ACK delivery can be broadcast or unicast depending on client state and flags. A simulated event may appear at several devices, so the event count is not a protocol message count. Client HTTP still works with the new source.
:::

```state
{"status":"DHCP through the relay","tone":"ok","addressed":false,"focus":["R1","R2"],"flows":[{"path":["PC","S1","R1","R2"],"back":true,"label":"PC-A's DHCP request, relayed","tags":{"R1":"helper 10.0.99.2 · giaddr .10.1"},"backTags":{"R2":"giaddr selects pool USERS","PC":"Lease .100–.254 · gw .10.1"}},{"path":["PC","S1","R1","R2","S2","SRV"],"back":true,"label":"PC-A HTTP from its leased address","tags":{"PC":"New source · leased address"}}],"chips":[{"node":"R1","text":"helper 10.0.99.2"},{"node":"R2","text":"DHCP pool USERS"},{"node":"PC","text":"DHCP lease · .100–.254","tone":"ok","from":1}],"rows":[["PC-A lease","A free .100–.254 · /24","ok"],["Gateway · DNS","10.0.10.1 · 10.0.20.10","ok"],["Relay giaddr","10.0.10.1"],["Offer/ACK delivery","Broadcast or unicast","dim"]]}
```

## Step 12: Save the verified final state

Keep the verified DHCP client/relay/server configuration if you completed the optional extension; otherwise retain the static baseline addressing. Record PC-A's actual address and every intended difference from the initial baseline. Verify both router interfaces, routes, switch membership, DNS response, and HTTP. Save each Cisco device from privileged EXEC with `copy running-config startup-config`, completing its destination prompt before moving to the next device, then save the project as `toolkit-complete.pkt`. Preserve `toolkit-baseline.pkt` separately.

:::expected
The final network has no outstanding injected fault. Four device startup configurations and the Packet Tracer project are saved; notes contain the original symptoms and the evidence supporting each repair. No debug or experimental capture is left running.
:::

### Evidence to keep

For each of the four faults, keep the prediction and the observation before the repair, the decisive configuration/state or packet evidence, a plausible explanation the test ruled out, the exact narrow correction, and the repeated client service test. Include source addresses for paired router tests and capture location/filter when using Simulation. Record which counters or logs you could not observe; do not convert that absence into a passed check. Finish with one paragraph explaining why a router ping, a route entry, a DNS answer and an HTTP response each establish different things.

```state
{"status":"Final state saved","tone":"ok","addressed":false,"focus":["R1","R2","S1","S2"],"chips":[{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"},{"node":"S1","text":"startup-config saved","tone":"ok"},{"node":"S2","text":"startup-config saved","tone":"ok"}],"rows":[["Injected faults","None outstanding","ok"],["Startup configs","All four devices saved","ok"],["Project","toolkit-complete.pkt","ok"],["Baseline copy","toolkit-baseline.pkt kept"]]}
```

## Troubleshooting

- If the first baseline fails, inspect exact masks, both host gateways, switch membership, and both static routes before injecting any fault.
- A failed ping with stars or periods does not identify a unique failure; compare source, route lookup, current link state, and capture point.
- If pipe filters or `show running-config interface` are unsupported, use the complete `show running-config` and locate the intended interface manually.
- Empty logs can reflect destination configuration, buffer history, or simulator limits. Use current configuration/state and record the missing evidence.
- A missing DNS event can mean cached resolution, a different test name, an incorrect resolver, or capture filtering; inspect these before blaming the server.

## Challenge

Use this fresh, independent incident as a paper diagnosis; it is not an assertion about the state of your saved project. The topology has the same roles as above but these addresses: client LAN `10.31.10.0/24`, R1 `.10.1`, PC-A `.10.50`, PC-B `.10.60`; transit `10.31.99.0/30`, R1 `.99.1`, R2 `.99.2`; server LAN `10.31.20.0/24`, R2 `.20.1`, SRV `.20.10`. Both clients and the server have their correct local gateways. Both client ports are verified in the intended active VLAN. The two routers' links are up, and there is no policy routing or traffic filter in this supplied case.

SRV has HTTP and DNS enabled, with `app.lab.example A 10.31.20.10`. Both clients use DNS `10.31.20.10`. The original complaint is that PC-A cannot open `http://app.lab.example`, while PC-B can load that page. These service settings and the following ICMP checks are supplied evidence for the paper case.

```output Supplied observations from the same interval
PC-A to its local gateway: success
PC-B to its local gateway and SRV by address: success
R1 LAN-source 10.31.10.1 to SRV: success
PC-A to SRV by address: failure
Server-side capture: PC-A's echo request arrives; matching reply leaves toward R2
R2: 10.31.10.0/24 via 10.31.99.1
R2: 10.31.10.50/32 via Null0 — confirmed obsolete test route
```

Before opening the solution, state the selected reply route for `.50`, `.60` and `.1`; explain why R1's successful sourced test did not certify PC-A; write the smallest justified repair; and choose the original-service and unaffected-service retests. Include the command that would inspect each return destination. Do not remove the working /24 route.

:::solution Check the client-specific diagnosis
The `.50/32` is a longer match than the client `/24`, so R2 discards PC-A's return traffic through Null0. PC-B `.60` and R1 `.1` use the working /24 via `10.31.99.1`. The server capture rules out a claim that this particular request never reached SRV; the supplied exact route and obsolete-test confirmation support a narrow removal rather than a speculative change to the server gateway.

```ios R2
R2# show ip route 10.31.10.50
R2# show ip route 10.31.10.60
R2# show ip route 10.31.10.1
R2# configure terminal
R2(config)# no ip route 10.31.10.50 255.255.255.255 Null0
R2(config)# end
R2# show ip route 10.31.10.50
```

After removal, `.50` should select the intended /24. Verify PC-A's numeric ping, fresh name answer and original application; repeat PC-B's working application and R1's sourced check to preserve evidence of unaffected service. Save only after actual tests in a separately built implementation pass. For this paper submission, distinguish the reasoned result from an executed configuration. This variation tests a more-specific exception that a successful router-source check misses.
:::
