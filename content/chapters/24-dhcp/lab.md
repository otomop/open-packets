---
title: Trace DHCP clients through a relay, then diagnose two allocation failures
environment: packet-tracer
devices: ["3 × Cisco 2911 routers (R1 relay, R2 server, R3 client)", "2 × Catalyst 2960-24TT switches (SW1, SW2)", "3 × PC-PT (PC-A, PC-B, PC-C)", "1 × Server-PT (DNS1)"]
minutes: 85
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You will build the lesson's design: clients on one subnet, a DHCP server on another, and a relay between them. A PC and a router each obtain a lease. Then you will cause the two faults that the exam asks about most, a helper address on the wrong interface and an exhausted pool, and see that they look the same from the client and different from the server.

Start with new devices and use each device's CLI tab. Answer `no` if the initial configuration dialog appears. Packet Tracer does not support every IOS DHCP command. Where a step uses one it may reject, the step says so and tells you what to check instead.

## Topology

```diagram
{"type":"topology","title":"Client subnet and remote server subnet","caption":"PC-A, R3, PC-B and PC-C are DHCP clients on SW1 in VLAN 10, with PC-B and PC-C cabled in steps 6 and 8; R1 relays toward R2 in VLAN 20, and R2 needs a return route to the client subnet.","nodes":[{"id":"PC","kind":"pc","label":"PC-A","sub":"DHCP","x":1,"y":2},{"id":"SW1","kind":"switch","label":"SW1","sub":"VLAN 10","x":3,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"Relay","x":6,"y":3},{"id":"SW2","kind":"switch","label":"SW2","sub":"VLAN 20","x":9,"y":3},{"id":"R2","kind":"router","label":"R2","sub":"10.10.20.2","x":11,"y":1},{"id":"DNS","kind":"server","label":"DNS1","sub":"10.10.20.53","x":11,"y":5},{"id":"R3","kind":"router","label":"R3","sub":"DHCP","x":1,"y":4},{"id":"PCB","kind":"pc","label":"PC-B","sub":"DHCP","x":3,"y":0},{"id":"PCC","kind":"pc","label":"PC-C","sub":"DHCP","x":3,"y":5}],"links":[{"from":"PC","to":"SW1","toLabel":"Fa0/1"},{"from":"SW1","to":"R1","fromLabel":"Gi0/1","toLabel":"Gi0/0"},{"from":"R1","to":"SW2","fromLabel":"Gi0/1","toLabel":"Gi0/1"},{"from":"SW2","to":"R2","fromLabel":"Gi0/2","toLabel":"Gi0/0"},{"from":"SW2","to":"DNS","fromLabel":"Fa0/1"},{"from":"R3","to":"SW1","fromLabel":"Gi0/0","toLabel":"Fa0/2"},{"from":"PCB","to":"SW1","toLabel":"Fa0/3"},{"from":"PCC","to":"SW1","toLabel":"Fa0/4"}]}
```

| Local device/port | Peer device/port | Role |
|---|---|---|
| PC-A FastEthernet0 | SW1 Fa0/1 | First DHCP client |
| R3 Gi0/0 | SW1 Fa0/2 | IOS DHCP client, enabled in step 5 |
| PC-B FastEthernet0 | SW1 Fa0/3 | Fresh client for helper fault; connect in step 6 |
| PC-C FastEthernet0 | SW1 Fa0/4 | Fresh fourth client for exhaustion; connect in step 8 |
| SW1 Gi0/1 | R1 Gi0/0 | Client gateway, VLAN 10 |
| R1 Gi0/1 | SW2 Gi0/1 | Server subnet, VLAN 20 |
| R2 Gi0/0 | SW2 Gi0/2 | DHCP server |
| DNS1 FastEthernet0 | SW2 Fa0/1 | Actual DNS service address advertised to clients |

Every cable is copper straight-through, because each joins a PC, server or router to a switch. All switch ports are access ports. Leave PC-B and PC-C uncabled for now, and do not configure R3 until Step 5.

| Interface/device | Address and mask | Gateway/DNS |
|---|---|---|
| R1 Gi0/0 | 10.10.10.1 / 255.255.255.0 | Client gateway |
| R1 Gi0/1 | 10.10.20.1 / 255.255.255.0 | Server-subnet router |
| R2 Gi0/0 | 10.10.20.2 / 255.255.255.0 | Static return route via 10.10.20.1 |
| DNS1 FastEthernet0 | 10.10.20.53 / 255.255.255.0 | Gateway 10.10.20.1; DNS 10.10.20.53 |
| DHCP clients | Initially only 10.10.10.50–10.10.10.52 available | Gateway 10.10.10.1; DNS 10.10.20.53 |

The pool starts with only three addresses so that a fourth client exhausts it in Step 8. Which of the three addresses each client receives does not matter.

## Step 1: Build the two subnets

Cable the devices, then put each switch port in its access VLAN. `service dhcp` on R1 is already the default; entering it makes the starting state explicit. If Packet Tracer rejects it, carry on.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name CLIENTS
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/1 - 4
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# no shutdown
SW1(config-if)# end
```

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# vlan 20
SW2(config-vlan)# name SERVICES
SW2(config-vlan)# exit
SW2(config)# interface range gigabitethernet0/1 - 2
SW2(config-if-range)# switchport mode access
SW2(config-if-range)# switchport access vlan 20
SW2(config-if-range)# no shutdown
SW2(config-if-range)# exit
SW2(config)# interface fastethernet0/1
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 20
SW2(config-if)# no shutdown
SW2(config-if)# end
```

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# service dhcp
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.10.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.10.20.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.10.20.2 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# end
```

On DNS1, use Desktop → IP Configuration to enter the address, mask, gateway, and DNS value in the table. Under Services → DNS, turn the service On and add an A record named `portal.dhcp.example` with address `10.10.20.53`. Under Services → HTTP, turn HTTP On. As in Chapter 6, an A record maps a name to an IPv4 address. The client asks its DNS server for the address, then opens an HTTP connection to it. Here one device provides both services, which gives you a way to test the DNS setting that DHCP hands out. Chapter 25 covers DNS itself.

:::expected
R1's two interfaces and R2 Gi0/0 are up/up. SW1's ports are in VLAN 10 and SW2's in VLAN 20. DNS1 has its static settings. There is no helper address yet, so no client can get a lease.
:::

```state
{"status":"Two subnets built","cabled":true,"focus":["SW1","R1","SW2"],"absent":["PCB","PCC"],"chips":[{"node":"DNS","text":"DNS On · HTTP On"}],"rows":[["SW1 · SW2 ports","Access VLAN 10 · VLAN 20"],["R1 Gi0/0 · Gi0/1","10.10.10.1 · 10.10.20.1"],["DNS1 A record","portal.dhcp.example → 10.10.20.53"],["Helper · leases","None yet","dim"]],"wake":["PC","R1","R2","DNS"]}
```

## Step 2: Configure the server, small pool, and return route

R2 is the server, but it is not attached to the client subnet. Before entering the commands, work out two things: how many addresses the two exclusions leave in `10.10.10.0/24`, and which address R2 must be able to reach to answer a relayed client. If Packet Tracer rejects `lease 0 8 0`, skip that line; the pool then uses its default lease and nothing else in the lab changes.

```ios R2
R2# configure terminal
R2(config)# service dhcp
R2(config)# ip dhcp excluded-address 10.10.10.1 10.10.10.49
R2(config)# ip dhcp excluded-address 10.10.10.53 10.10.10.254
R2(config)# ip dhcp pool USERS
R2(dhcp-config)# network 10.10.10.0 255.255.255.0
R2(dhcp-config)# default-router 10.10.10.1
R2(dhcp-config)# dns-server 10.10.20.53
R2(dhcp-config)# domain-name dhcp.example
R2(dhcp-config)# lease 0 8 0
R2(dhcp-config)# exit
R2(config)# ip route 10.10.10.0 255.255.255.0 10.10.20.1
R2(config)# end
R2# show ip dhcp pool
R2# show ip dhcp binding
R2# show ip route
R2# ping 10.10.10.1
```

On R1 verify server reachability:

```ios R1
R1# ping 10.10.20.2
R1# ping 10.10.20.53
```

:::expected
A /24 has 254 host addresses. The exclusions remove 49 and 202 of them, which leaves three: .50, .51 and .52. R2 must reach `10.10.10.1`, R1's client-facing address, because that is where it sends its replies; the static route provides this and the ping to `10.10.10.1` succeeds. `show ip dhcp binding` is empty, and `show ip dhcp pool` shows pool USERS with no leased addresses.
:::

```state
{"status":"Pool and return route set","tone":"ok","focus":["R2"],"absent":["PCB","PCC"],"flows":[{"path":["R2","SW2","R1"],"back":true,"label":"R2 pings 10.10.10.1","tags":{"R2":"10.10.10.0/24 via 10.10.20.1"}},{"path":["R1","SW2","DNS"],"back":true,"label":"R1 pings 10.10.20.53"}],"chips":[{"node":"R2","text":"USERS · 0 of 3 bound"}],"rows":[["Candidates",".50, .51, .52 · 254 − 49 − 202"],["Return route","10.10.10.0/24 via 10.10.20.1","ok"],["R1 pings","10.10.20.2 · 10.10.20.53","ok"],["Bindings","Empty","dim"]]}
```

## Step 3: Observe acquisition before the relay exists

R1 has no helper address yet. Predict what happens to PC-A's Discover when it reaches R1.

On PC-A, open Desktop → IP Configuration and select DHCP. To watch the Discover, switch to Simulation mode, filter for DHCP, and step through the events; then return to Realtime. Run the commands below on R1 and R2. `show ip dhcp server statistics` is missing from some Packet Tracer versions; skip it if it is rejected.

```ios R1
R1# show ip interface gigabitethernet0/0
R1# show running-config
```

```ios R2
R2# show ip dhcp binding
R2# show ip dhcp server statistics
```

:::expected
PC-A gets no lease. Its Discover is a broadcast, and R1 does not forward broadcasts, so the message never leaves the client subnet. R1's `show ip interface gigabitethernet0/0` reports `Helper address is not set`, and R2 still has no bindings. After a short wait PC-A reports that DHCP failed and shows a `169.254.x.x` address.
:::

```state
{"status":"Discover stops at R1","tone":"bad","focus":["PC","R1"],"absent":["PCB","PCC"],"flows":[{"path":["PC","SW1","R1"],"label":"PC-A's DHCPDISCOVER","tags":{"PC":"0.0.0.0 → 255.255.255.255"},"stop":"R1","stopText":"No helper on Gi0/0 · stays local"}],"chips":[{"node":"PC","text":"No valid lease","tone":"bad"},{"node":"R2","text":"USERS · 0 of 3 bound"}],"rows":[["PC-A","No valid pool lease","bad"],["R1 Gi0/0","No helper-address"],["R2","Receives no relayed attempt"],["Fallback","Failure or link-local · record it","dim"]]}
```

## Step 4: Enable the client-facing helper and obtain the first lease

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip helper-address 10.10.20.2
R1(config-if)# end
R1# show ip interface gigabitethernet0/0
```

Retry DHCP on PC-A: select Static, then DHCP again, to start a new request. Read its address, mask, gateway and DNS fields. In its Command Prompt, ping `10.10.10.1` and `10.10.20.53`. Then open Web Browser and load `http://10.10.20.53`, which tests the gateway setting, and `http://portal.dhcp.example`, which also tests the DNS setting.

```ios R2
R2# show ip dhcp binding
R2# show ip dhcp pool
R2# show ip dhcp server statistics
```

:::expected
R1 now reports `Helper address is 10.10.20.2`. PC-A receives an address from .50 to .52 with mask 255.255.255.0, gateway 10.10.10.1 and DNS server 10.10.20.53. Both pings succeed and both pages load. R2 has one binding, and its client ID ends in PC-A's MAC address. If you step through the exchange in Simulation mode, the Discover that R1 sends to R2 is a unicast with giaddr 10.10.10.1.
:::

```state
{"status":"First lease via the relay","tone":"ok","focus":["R1"],"absent":["PCB","PCC"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Gi0/0 helper → 10.10.20.2"}},{"path":["PC","SW1","R1","SW2","R2"],"back":true,"label":"DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Reply to giaddr · via 10.10.20.1"}},{"path":["PC","SW1","R1","SW2","R2"],"back":true,"label":"DHCPREQUEST, then ACK"},{"event":["PC","R2"],"tags":{"PC":"gw 10.10.10.1 · DNS 10.10.20.53","R2":"Binding for PC-A client ID"}}],"chips":[{"node":"R1","text":"No helper","until":0},{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok","from":0},{"node":"R2","text":"USERS · 0 of 3 bound","until":3},{"node":"R2","text":"USERS · 1 of 3 bound","tone":"ok","from":3},{"node":"PC","text":"Leased from .50–.52","tone":"ok","from":3}],"rows":[["PC-A","One address in .50–.52 · /24","ok"],["Gateway · DNS","10.10.10.1 · 10.10.20.53","ok"],["Relayed giaddr","10.10.10.1"],["R2 binding","Matches PC-A client identity","ok"]]}
```

## Step 5: Obtain the second lease on an IOS client

R3 Gi0/0 is already cabled to SW1 Fa0/2. Make it a DHCP client. First calculate when T1 and T2 fall in an eight-hour lease; you do not need to wait for them.

```ios R3
Router> enable
Router# configure terminal
Router(config)# hostname R3
R3(config)# interface gigabitethernet0/0
R3(config-if)# ip address dhcp
R3(config-if)# no shutdown
R3(config-if)# end
R3# show ip interface brief
R3# show ip route
R3# show dhcp lease
R3# ping 10.10.10.1
```

```ios R2
R2# show ip dhcp binding
R2# show ip dhcp pool
```

:::expected
R3 Gi0/0 receives a second address from the range, shown with `DHCP` in the Method column, and the ping to R1 succeeds. `show ip route` lists a default route through 10.10.10.1 with distance 254, written `[254/0]`. If Packet Tracer rejects `show dhcp lease`, use the interface address and R2's binding instead. R2 now has two bindings. Save the project.
:::

:::solution Timer check
Eight hours × 0.5 puts T1 at four hours, and eight hours × 0.875 puts T2 at seven hours. At T1 the client renews by unicast to its own server. At T2 it rebinds by broadcast to any server. At eight hours the lease expires.
:::

```state
{"status":"R3 leases a second address","tone":"ok","focus":["R3"],"absent":["PCB","PCC"],"wake":["R3"],"flows":[{"path":["R3","SW1","R1","SW2","R2"],"back":true,"label":"R3's DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Offers a second .50–.52 address"}},{"path":["R3","SW1","R1","SW2","R2"],"back":true,"label":"R3's DHCPREQUEST, then ACK"},{"path":["R3","SW1","R1"],"back":true,"label":"R3 pings 10.10.10.1"}],"chips":[{"node":"R3","text":"Gi0/0 · ip address dhcp","until":2},{"node":"R3","text":"Leased from .50–.52","tone":"ok","from":2},{"node":"PC","text":"Leased"},{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS · 1 of 3 bound","until":2},{"node":"R2","text":"USERS · 2 of 3 bound","tone":"ok","from":2}],"rows":[["R3 Gi0/0","Second distinct address in .50–.52","ok"],["R3 ping 10.10.10.1","Reaches R1's gateway","ok"],["Lease","8 hours"],["R2 bindings","PC-A and R3"]]}
```

## Step 6: Move the helper to the wrong interface and observe a fresh client

Use Save As to work in a copy. A common mistake is to put the helper address on the interface that faces the server. Make that mistake on purpose: move the helper from Gi0/0 to Gi0/1. Before you do, predict two things separately: what happens to PC-A, which already has a lease, and what happens to PC-B, which does not.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no ip helper-address 10.10.20.2
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip helper-address 10.10.20.2
R1(config-if)# end
R1# show ip interface gigabitethernet0/0
R1# show ip interface gigabitethernet0/1
```

Connect PC-B to SW1 Fa0/3 with a straight-through cable and select DHCP. On PC-A, repeat the gateway ping and load `http://10.10.20.53`. Leave the fault in place until you have recorded both PCs' results, which interface holds the helper, and how many bindings R2 has.

:::expected
PC-B gets no lease, although R2 still has one free address. Its broadcasts arrive on Gi0/0, which no longer has a helper address. PC-A and R3 keep working on the leases they already hold. That is why a working old client tells you nothing about the relay: only a new client has to broadcast.
:::

```state
{"status":"Helper on the wrong side","tone":"bad","focus":["R1"],"absent":["PCC"],"wake":["PCB"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Helper moved Gi0/0 → Gi0/1"}},{"path":["PC","SW1","R1","SW2","DNS"],"back":true,"label":"PC-A HTTP to 10.10.20.53 on its valid lease","tags":{"R1":"Routed · helper not involved"}},{"path":["PCB","SW1","R1"],"label":"PC-B's DHCPDISCOVER","stop":"R1","stopText":"Gi0/0 has no helper"}],"chips":[{"node":"R1","text":"Helper on Gi0/1 only","tone":"bad"},{"node":"R2","text":"USERS · 2 of 3 bound"},{"node":"PC","text":"Unexpired lease"},{"node":"R3","text":"Unexpired lease"},{"node":"PCB","text":"No lease","tone":"bad"}],"rows":[["PC-B","No lease · one candidate remains","bad"],["PC-A · R3","May still use unexpired leases","warn"],["R1 helper","Gi0/1 only · Gi0/0 none","bad"]]}
```

## Step 7: Restore the helper and obtain the third lease

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# no ip helper-address 10.10.20.2
R1(config-if)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip helper-address 10.10.20.2
R1(config-if)# end
R1# show ip interface gigabitethernet0/0
```

Retry DHCP on PC-B, then ping its gateway and `10.10.20.53`. Then inspect R2:

```ios R2
R2# show ip dhcp binding
R2# show ip dhcp pool
```

:::expected
R2 has three bindings, one each for PC-A, R3 and PC-B, and they use all three available addresses. Do not continue until all three clients hold a lease.
:::

```state
{"status":"Helper restored · third lease","tone":"ok","focus":["R1"],"absent":["PCC"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Helper back on Gi0/0 only"}},{"path":["PCB","SW1","R1","SW2","R2"],"back":true,"label":"PC-B's DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Offers the last free candidate"}},{"path":["PCB","SW1","R1","SW2","R2"],"back":true,"label":"PC-B's DHCPREQUEST, then ACK"},{"path":["PCB","SW1","R1","SW2","DNS"],"back":true,"label":"PC-B pings 10.10.20.53"}],"chips":[{"node":"R1","text":"Helper on Gi0/1 only","tone":"bad","until":0},{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok","from":0},{"node":"R2","text":"USERS · 2 of 3 bound","until":3},{"node":"R2","text":"USERS · 3 of 3 bound","from":3},{"node":"PC","text":"Leased"},{"node":"R3","text":"Leased"},{"node":"PCB","text":"No lease","tone":"bad","until":3},{"node":"PCB","text":"Leased","tone":"ok","from":3}],"rows":[["Active allocations","PC-A · R3 · PC-B","ok"],["Eligible addresses",".50–.52 · all three in use"],["R1 helper","Gi0/0 only","ok"],["PC-B tests","Gateway · 10.10.20.53"]]}
```

## Step 8: Observe genuine pool exhaustion

The relay now works, but the pool has three addresses and three clients. Predict what a fourth client will see. Connect PC-C to SW1 Fa0/4 with a straight-through cable and select DHCP. Do not clear any bindings or change the exclusions yet.

```ios R2
R2# show ip dhcp pool
R2# show ip dhcp binding
R2# show ip dhcp conflict
R2# show ip dhcp server statistics
```

:::expected
PC-C gets no lease and falls back to a `169.254.x.x` address, exactly as PC-B did in Step 6. The cause is different: the Discover reaches R2 this time, but all three addresses are leased. The evidence is on the server, where `show ip dhcp binding` lists three leases and the exclusions leave only three addresses. `show ip dhcp conflict` is empty, so no address is being withheld. The other three clients keep working.
:::

```state
{"status":"Pool USERS exhausted","tone":"bad","focus":["R2"],"wake":["PCC"],"flows":[{"path":["PCC","SW1","R1","SW2","R2"],"label":"PC-C's DHCPDISCOVER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"stop":"R2","stopText":"No free address in USERS"}],"chips":[{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS · 3 of 3 bound","tone":"bad"},{"node":"PC","text":"Leased"},{"node":"R3","text":"Leased"},{"node":"PCB","text":"Leased"},{"node":"PCC","text":"No lease","tone":"bad"}],"rows":[["Free candidates","None of .50–.52","bad"],["PC-C","No new address","bad"],["Relay","Working · not the cause","ok"],["Existing leases","Need not lose connectivity"]]}
```

## Step 9: Expand the lab range and recover PC-C

The fix is more addresses, not a cleared binding table. Decide which of the two exclusions you can remove while keeping .1–.49 for fixed devices, and how many addresses the pool will then have.

```ios R2
R2# configure terminal
R2(config)# no ip dhcp excluded-address 10.10.10.53 10.10.10.254
R2(config)# end
R2# show ip dhcp pool
R2# show running-config
```

Retry DHCP on PC-C, check its settings, and ping 10.10.10.1 and 10.10.20.53. Then look at R2's bindings again.

:::expected
The pool now covers .50–.254, which is 205 addresses. PC-C receives one that no other client holds, and R2 lists four bindings. The first three clients keep their addresses.
:::

```state
{"status":"Range expanded · PC-C leased","tone":"ok","focus":["R2"],"flows":[{"event":["R2"],"wait":1.2,"tags":{"R2":"Exclusion .53–.254 removed"}},{"path":["PCC","SW1","R1","SW2","R2"],"back":true,"label":"PC-C's DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Offers a distinct available address"}},{"path":["PCC","SW1","R1","SW2","R2"],"back":true,"label":"PC-C's DHCPREQUEST, then ACK"},{"path":["PCC","SW1","R1","SW2","DNS"],"back":true,"label":"PC-C pings 10.10.20.53"}],"chips":[{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS · 3 of 3 bound","tone":"bad","until":0},{"node":"R2","text":"USERS · .50–.254","tone":"ok","from":0},{"node":"PC","text":"Leased"},{"node":"R3","text":"Leased"},{"node":"PCB","text":"Leased"},{"node":"PCC","text":"No lease","tone":"bad","until":3},{"node":"PCC","text":"Leased","tone":"ok","from":3}],"rows":[["Dynamic range",".50–.254 · 205 addresses","ok"],["PC-C","A distinct available address","ok"],["Existing clients","Keep their current addresses","ok"],["Bindings cleared","None"]]}
```

## Step 10: Save and document the recovered configuration

On R1, R2, R3, SW1, and SW2, individually enter `copy running-config startup-config` from privileged EXEC. Complete each `Destination filename [startup-config]?` prompt with Enter before moving to the next device. Save the Packet Tracer project as `24-dhcp-complete.pkt`.

In your notes, record each client's leased address, the interface that holds R1's helper address, R2's pool and exclusions, and R2's return route. You should be able to point to four results: a client's settings matching a server binding, a failed request with the helper on the wrong interface while addresses were free, a failed request with the helper correct and the pool full, and a successful lease and web page after the fix.

:::expected
The helper address is on R1 Gi0/0 only, the pool covers .50–.254, four clients hold leases and DNS1 is reachable. You can explain why Steps 6 and 8 looked the same on the client and had different causes.
:::

```state
{"status":"Recovered config saved","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS .50–.254 · 4 bound","tone":"ok"},{"node":"DNS","text":"DNS On · HTTP On","tone":"ok"}],"rows":[["Helper","R1 Gi0/0 only","ok"],["Allocations","PC-A · R3 · PC-B · PC-C","ok"],["DNS1","Reachable","ok"],["Saved","5 devices · 24-dhcp-complete.pkt","ok"]]}
```

## Troubleshooting

- **A port or interface is down:** check the cable, the port and `no shutdown` before any DHCP setting.
- **A client gets no lease:** check its access VLAN, then the helper address on R1 Gi0/0, then that neither router has `no service dhcp`.
- **The request reaches R2 but no offer comes back:** check that the pool's `network` matches the client subnet, then the exclusions, the bindings and `show ip dhcp conflict`.
- **R2 offers but the client never completes:** check R2's route to `10.10.10.0/24`. R2 replies to giaddr, `10.10.10.1`.
- **The address is right but the gateway or DNS server is wrong:** correct `default-router` or `dns-server` in the pool, then renew the client.

## Challenge

Use Save As for a separate challenge copy. Add a Catalyst 2960-24TT named SW3 and a fresh PC-PT named PC-D behind unused R1 Gi0/2. Connect R1 Gi0/2 to SW3 Gi0/1 and PC-D FastEthernet0 to SW3 Fa0/1 using straight-through copper. Create VLAN 30 on SW3 and put both connected ports in that access VLAN.

Design and implement the remaining configuration. The new gateway is 10.10.30.1/24; only .50–.59 may be allocated in this subnet. Use an eight-hour lease and the existing DNS1 service at 10.10.20.53. Preserve USERS and the original clients.

Before PC-D requests a lease, write down its available range, the giaddr you expect in its relayed request, and the route R2 will need. Afterwards, confirm PC-D's settings and its binding on R2, and load the web page by address and by name. Check that an original client can still load the page.

:::solution
The new subnet needs four things: its access VLAN, a helper address on its gateway interface, a matching pool, and a route from the server back to it. None of these commands changes USERS.

```ios SW3
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW3
SW3(config)# vlan 30
SW3(config-vlan)# name GREEN
SW3(config-vlan)# exit
SW3(config)# interface fastethernet0/1
SW3(config-if)# switchport mode access
SW3(config-if)# switchport access vlan 30
SW3(config-if)# no shutdown
SW3(config-if)# exit
SW3(config)# interface gigabitethernet0/1
SW3(config-if)# switchport mode access
SW3(config-if)# switchport access vlan 30
SW3(config-if)# no shutdown
SW3(config-if)# end
SW3# show vlan brief
```

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/2
R1(config-if)# ip address 10.10.30.1 255.255.255.0
R1(config-if)# ip helper-address 10.10.20.2
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface gigabitethernet0/2
```

```ios R2
R2# configure terminal
R2(config)# ip dhcp excluded-address 10.10.30.1 10.10.30.49
R2(config)# ip dhcp excluded-address 10.10.30.60 10.10.30.254
R2(config)# ip dhcp pool GREEN
R2(dhcp-config)# network 10.10.30.0 255.255.255.0
R2(dhcp-config)# default-router 10.10.30.1
R2(dhcp-config)# dns-server 10.10.20.53
R2(dhcp-config)# lease 0 8 0
R2(dhcp-config)# exit
R2(config)# ip route 10.10.30.0 255.255.255.0 10.10.20.1
R2(config)# end
R2# show ip dhcp pool
R2# show ip dhcp binding
R2# show ip route 10.10.30.1
```

On PC-D choose Desktop → IP Configuration → DHCP. Exclusions remove 49 + 195 = 244 of 254 host addresses, leaving ten candidates .50–.59. The client should receive /24, gateway 10.10.30.1 and DNS 10.10.20.53. The relayed request's expected giaddr is 10.10.30.1.

Find PC-D's binding on R2, ping 10.10.30.1 and 10.10.20.53 from PC-D, then browse to `http://portal.dhcp.example`. PC-A still uses its 10.10.10.x lease and loads the same page. Save the challenge copy.
:::
