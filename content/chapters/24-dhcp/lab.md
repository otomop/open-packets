---
title: Trace DHCP clients through a relay, then diagnose two allocation failures
environment: packet-tracer
devices: ["3 × Cisco 2911 routers (R1 relay, R2 server, R3 client)", "2 × Catalyst 2960-24TT switches (SW1, SW2)", "3 × PC-PT (PC-A, PC-B, PC-C)", "1 × Server-PT (DNS1)"]
minutes: 85
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a remote DHCP service, obtain leases on a PC and an IOS router, and test a misplaced helper separately from an exhausted pool. Start with new devices and use console CLI tabs throughout. Answer `no` if the initial configuration dialog appears. These configurations were reviewed against Cisco documentation; they have not been executed in Packet Tracer during this audit. Output formatting, supported show commands, and retry timing can differ. For an unavailable show command, combine supported client/interface fields, server configuration and bindings. For unavailable packet details, draw the four message stages from the topology and label them predicted. If the model rejects DHCP server, relay or client configuration itself, complete that portion as a configuration-and-packet worksheet or use a licensed supporting lab image. Do not report an allocation you did not observe.

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

All listed cables are copper straight-through because each connects an end device/router to a switch. These are access links, not trunks. Leave PC-B and PC-C uncabled initially. Do not enable DHCP on R3 before step 5.

| Interface/device | Address and mask | Gateway/DNS |
|---|---|---|
| R1 Gi0/0 | 10.10.10.1 / 255.255.255.0 | Client gateway |
| R1 Gi0/1 | 10.10.20.1 / 255.255.255.0 | Server-subnet router |
| R2 Gi0/0 | 10.10.20.2 / 255.255.255.0 | Static return route via 10.10.20.1 |
| DNS1 FastEthernet0 | 10.10.20.53 / 255.255.255.0 | Gateway 10.10.20.1; DNS 10.10.20.53 |
| DHCP clients | Initially only 10.10.10.50–10.10.10.52 available | Gateway 10.10.10.1; DNS 10.10.20.53 |

The three-address initial range is deliberate, so a fourth new client exposes exhaustion without generating hundreds of clients. The precise address assigned to each client is not predetermined.

## Step 1: Build the two subnets

Cable the initially listed devices and explicitly prepare the access VLANs.

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

On DNS1, use Desktop → IP Configuration to enter the address, mask, gateway, and DNS value in the table. Under Services → DNS, turn the service On and add an A record named `portal.dhcp.example` with address `10.10.20.53`. Under Services → HTTP, turn HTTP On. As in Chapter 6, an A record maps a name to an IPv4 address. The client asks its configured DNS server for that mapping, then opens a separate HTTP connection to the returned address. Here one device provides both services. This single record supplies a controlled service test; chapter 25 teaches DNS diagnosis in depth.

:::expected
R1's two interfaces and R2 Gi0/0 become operational. SW1's connected client ports belong to VLAN 10; SW2's service ports belong to VLAN 20. DNS1 has the stated static configuration. No helper is configured yet, and no client lease is expected.
:::

```state
{"status":"Two subnets built","cabled":true,"focus":["SW1","R1","SW2"],"absent":["PCB","PCC"],"chips":[{"node":"DNS","text":"DNS On · HTTP On"}],"rows":[["SW1 · SW2 ports","Access VLAN 10 · VLAN 20"],["R1 Gi0/0 · Gi0/1","10.10.10.1 · 10.10.20.1"],["DNS1 A record","portal.dhcp.example → 10.10.20.53"],["Helper · leases","None yet","dim"]],"wake":["PC","R1","R2","DNS"]}
```

## Step 2: Configure the server, small pool, and return route

Before entering commands, calculate the remaining candidates after both inclusive exclusions. Write which relay address the server must reach when answering a remote client. Compare those predictions with the pool and routing checks below.

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
Both subnets and the return path are correct. A /24 has 254 ordinary host addresses. The exclusions cover 49 plus 202 addresses, leaving three candidates: .50, .51, .52. Bindings should be empty on these fresh devices. Pool counters and their headings vary; derive eligibility from the actual network and exclusions rather than demanding one exact display.
:::

```state
{"status":"Pool and return route set","tone":"ok","focus":["R2"],"absent":["PCB","PCC"],"flows":[{"path":["R2","SW2","R1"],"back":true,"label":"R2 pings 10.10.10.1","tags":{"R2":"10.10.10.0/24 via 10.10.20.1"}},{"path":["R1","SW2","DNS"],"back":true,"label":"R1 pings 10.10.20.53"}],"chips":[{"node":"R2","text":"USERS · 0 of 3 bound"}],"rows":[["Candidates",".50, .51, .52 · 254 − 49 − 202"],["Return route","10.10.10.0/24 via 10.10.20.1","ok"],["R1 pings","10.10.20.2 · 10.10.20.53","ok"],["Bindings","Empty","dim"]]}
```

## Step 3: Observe acquisition before the relay exists

Predict whether R1 forwards the initial broadcast without a helper. Record R2's current bindings and supported message counters before the attempt, then compare afterward; counters need not start at zero.

On PC-A, open Desktop → IP Configuration and select DHCP. In Simulation mode, filter for DHCP (some versions group this under DHCP/BOOTP), advance the events, and inspect the client's initial request. Use Realtime afterward. Do not configure a static client address to conceal the missing service.

```ios R1
R1# show ip interface gigabitethernet0/0
R1# show running-config
```

```ios R2
R2# show ip dhcp binding
R2# show ip dhcp server statistics
```

:::expected
PC-A cannot complete remote allocation because its local broadcast has no relay on R1 Gi0/0. The server receives no corresponding relayed attempt. The PC may report DHCP failure or assign a link-local address; record what this image actually does. The expected fact is no valid pool lease, not a particular message or timeout length.
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

Retry DHCP on PC-A. If necessary, select Static and then DHCP in its IP Configuration to start another acquisition attempt. Inspect its address, mask, gateway, and DNS fields. In its Command Prompt, ping `10.10.10.1` and `10.10.20.53`. Open Web Browser and test `http://10.10.20.53`, then `http://portal.dhcp.example`. This supplied one-record service checks whether the received gateway and resolver settings support the intended application; chapter 25 teaches record diagnosis.

```ios R2
R2# show ip dhcp binding
R2# show ip dhcp pool
R2# show ip dhcp server statistics
```

:::expected
PC-A receives one address in .50–.52, mask /24, gateway 10.10.10.1, and DNS 10.10.20.53. The server binding matches its actual client identity. In a supported packet-detail view, the relayed request carries giaddr 10.10.10.1; reply delivery on the client link may be broadcast or unicast according to the flag/state. A packet on the server subnet is not expected to look identical to the client's original broadcast. If the simulator omits a field, use the lesson's protocol explanation as a paper observation, not a captured result.
:::

```state
{"status":"First lease via the relay","tone":"ok","focus":["R1"],"absent":["PCB","PCC"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Gi0/0 helper → 10.10.20.2"}},{"path":["PC","SW1","R1","SW2","R2"],"back":true,"label":"DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Reply to giaddr · via 10.10.20.1"}},{"path":["PC","SW1","R1","SW2","R2"],"back":true,"label":"DHCPREQUEST, then ACK"},{"event":["PC","R2"],"tags":{"PC":"gw 10.10.10.1 · DNS 10.10.20.53","R2":"Binding for PC-A client ID"}}],"chips":[{"node":"R1","text":"No helper","until":0},{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok","from":0},{"node":"R2","text":"USERS · 0 of 3 bound","until":3},{"node":"R2","text":"USERS · 1 of 3 bound","tone":"ok","from":3},{"node":"PC","text":"Leased from .50–.52","tone":"ok","from":3}],"rows":[["PC-A","One address in .50–.52 · /24","ok"],["Gateway · DNS","10.10.10.1 · 10.10.20.53","ok"],["Relayed giaddr","10.10.10.1"],["R2 binding","Matches PC-A client identity","ok"]]}
```

## Step 5: Obtain the second lease on an IOS client

R3 Gi0/0 is already cabled to SW1 Fa0/2. Configure it now. First calculate T1 and T2 for the explicit eight-hour lease if the server supplies no alternate timers; you do not need to wait for those events.

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
R3 receives a second distinct address in the range and reaches R1's local gateway. The Method field commonly identifies DHCP. If the image implements `show dhcp lease`, inspect the actual state and timers; if it does not, use the interface, server binding, and traffic evidence. Inspect any default route instead of assuming it exists with a fixed distance on every image. Save a working Packet Tracer checkpoint.
:::

:::solution Timer check
Eight hours × 0.5 gives T1 at four hours; eight hours × 0.875 gives T2 at seven hours. T1 attempts unicast renewal; T2 broadens to broadcast rebinding if needed. Expiry is the later stop condition. Observed timers can reflect supplied options or implementation behavior.
:::

```state
{"status":"R3 leases a second address","tone":"ok","focus":["R3"],"absent":["PCB","PCC"],"wake":["R3"],"flows":[{"path":["R3","SW1","R1","SW2","R2"],"back":true,"label":"R3's DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Offers a second .50–.52 address"}},{"path":["R3","SW1","R1","SW2","R2"],"back":true,"label":"R3's DHCPREQUEST, then ACK"},{"path":["R3","SW1","R1"],"back":true,"label":"R3 pings 10.10.10.1"}],"chips":[{"node":"R3","text":"Gi0/0 · ip address dhcp","until":2},{"node":"R3","text":"Leased from .50–.52","tone":"ok","from":2},{"node":"PC","text":"Leased"},{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS · 1 of 3 bound","until":2},{"node":"R2","text":"USERS · 2 of 3 bound","tone":"ok","from":2}],"rows":[["R3 Gi0/0","Second distinct address in .50–.52","ok"],["R3 ping 10.10.10.1","Reaches R1's gateway","ok"],["Lease","8 hours"],["R2 bindings","PC-A and R3"]]}
```

## Step 6: Move the helper to the wrong interface and observe a fresh client

Use Save As to create an experiment copy. Verify PC-A's controlled page and unexpired lease first. Predict separately what happens to its ordinary traffic and to fresh PC-B's acquisition. Move the helper from the client interface to the server-facing interface on R1. Keep existing clients' leases; they are useful evidence that old connectivity can conceal a new-allocation failure.

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

Connect fresh PC-B to SW1 Fa0/3 with a straight-through cable, select DHCP, and let it attempt acquisition. Repeat PC-A's gateway ping and controlled HTTP-by-address test while its lease remains valid. Leave the fault installed until you record both old-client and fresh-client results, R1's helper placement and R2's binding count.

:::expected
PC-B gets no valid pool lease even though one candidate remains. Its broadcasts arrive on Gi0/0, which no longer has the helper. Previously configured PC-A and R3 may still use their unexpired addresses; this does not prove the relay works. Record the incorrect helper placement and the fresh-client failure before recovery.
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

Retry PC-B's DHCP acquisition and test its gateway and DNS1 address. Then inspect R2:

```ios R2
R2# show ip dhcp binding
R2# show ip dhcp pool
```

:::expected
There are now three distinct active allocations in the only three eligible addresses. Do not continue to the exhaustion test until PC-A, R3, and PC-B all have valid leases and the server records them. If a prior lease expired during a long interruption, reacquire and verify this baseline first.
:::

```state
{"status":"Helper restored · third lease","tone":"ok","focus":["R1"],"absent":["PCC"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Helper back on Gi0/0 only"}},{"path":["PCB","SW1","R1","SW2","R2"],"back":true,"label":"PC-B's DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Offers the last free candidate"}},{"path":["PCB","SW1","R1","SW2","R2"],"back":true,"label":"PC-B's DHCPREQUEST, then ACK"},{"path":["PCB","SW1","R1","SW2","DNS"],"back":true,"label":"PC-B pings 10.10.20.53"}],"chips":[{"node":"R1","text":"Helper on Gi0/1 only","tone":"bad","until":0},{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok","from":0},{"node":"R2","text":"USERS · 2 of 3 bound","until":3},{"node":"R2","text":"USERS · 3 of 3 bound","from":3},{"node":"PC","text":"Leased"},{"node":"R3","text":"Leased"},{"node":"PCB","text":"No lease","tone":"bad","until":3},{"node":"PCB","text":"Leased","tone":"ok","from":3}],"rows":[["Active allocations","PC-A · R3 · PC-B","ok"],["Eligible addresses",".50–.52 · all three in use"],["R1 helper","Gi0/0 only","ok"],["PC-B tests","Gateway · 10.10.20.53"]]}
```

## Step 8: Observe genuine pool exhaustion

First calculate the free count from the exclusions and three active bindings, and record R2's available counters. Connect fresh PC-C to SW1 Fa0/4 using straight-through copper and select DHCP. Do not clear any existing client's binding or change exclusions yet.

```ios R2
R2# show ip dhcp pool
R2# show ip dhcp binding
R2# show ip dhcp conflict
R2# show ip dhcp server statistics
```

:::expected
The fourth client cannot obtain a new address because the three eligible candidates are already allocated. The working relay alone cannot solve that capacity problem. Existing leases need not lose immediate connectivity. Confirm the three bindings and the exclusion arithmetic; do not diagnose exhaustion solely from a link-local client address or a Discover counter.
:::

```state
{"status":"Pool USERS exhausted","tone":"bad","focus":["R2"],"wake":["PCC"],"flows":[{"path":["PCC","SW1","R1","SW2","R2"],"label":"PC-C's DHCPDISCOVER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"stop":"R2","stopText":"No free address in USERS"}],"chips":[{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS · 3 of 3 bound","tone":"bad"},{"node":"PC","text":"Leased"},{"node":"R3","text":"Leased"},{"node":"PCB","text":"Leased"},{"node":"PCC","text":"No lease","tone":"bad"}],"rows":[["Free candidates","None of .50–.52","bad"],["PC-C","No new address","bad"],["Relay","Working · not the cause","ok"],["Existing leases","Need not lose connectivity"]]}
```

## Step 9: Expand the lab range and recover PC-C

Before reading the command, choose the single exclusion that can be removed while preserving .1–.49 for infrastructure. Predict the expanded range and count. This recovery removes only the temporary upper exclusion.

```ios R2
R2# configure terminal
R2(config)# no ip dhcp excluded-address 10.10.10.53 10.10.10.254
R2(config)# end
R2# show ip dhcp pool
R2# show running-config
```

Retry DHCP on PC-C and verify its parameters and pings to 10.10.10.1 and 10.10.20.53. Recheck server bindings.

:::expected
The potential dynamic range is now .50–.254, or 205 addresses before existing bindings/conflicts. PC-C receives a distinct available address. The existing clients keep their current valid addresses. No broad binding clear or address duplication was needed to demonstrate recovery.
:::

```state
{"status":"Range expanded · PC-C leased","tone":"ok","focus":["R2"],"flows":[{"event":["R2"],"wait":1.2,"tags":{"R2":"Exclusion .53–.254 removed"}},{"path":["PCC","SW1","R1","SW2","R2"],"back":true,"label":"PC-C's DHCPDISCOVER, then OFFER","tags":{"R1":"Relayed · giaddr 10.10.10.1"},"backTags":{"R2":"Offers a distinct available address"}},{"path":["PCC","SW1","R1","SW2","R2"],"back":true,"label":"PC-C's DHCPREQUEST, then ACK"},{"path":["PCC","SW1","R1","SW2","DNS"],"back":true,"label":"PC-C pings 10.10.20.53"}],"chips":[{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS · 3 of 3 bound","tone":"bad","until":0},{"node":"R2","text":"USERS · .50–.254","tone":"ok","from":0},{"node":"PC","text":"Leased"},{"node":"R3","text":"Leased"},{"node":"PCB","text":"Leased"},{"node":"PCC","text":"No lease","tone":"bad","until":3},{"node":"PCC","text":"Leased","tone":"ok","from":3}],"rows":[["Dynamic range",".50–.254 · 205 addresses","ok"],["PC-C","A distinct available address","ok"],["Existing clients","Keep their current addresses","ok"],["Bindings cleared","None"]]}
```

## Step 10: Save and document the recovered configuration

On R1, R2, R3, SW1, and SW2, individually enter `copy running-config startup-config` from privileged EXEC. Complete each `Destination filename [startup-config]?` prompt with Enter before moving to the next device. Save the Packet Tracer project as `24-dhcp-complete.pkt`.

Record each client's actual leased address, R1's client-facing helper, R2's network/exclusions/options, and R2's return route. Record any unavailable simulator commands separately from successful observations.

Your evidence must show: (1) client settings correlated with a server binding, (2) wrong-helper failure while capacity remains, (3) correct-helper failure while capacity is exhausted, and (4) fresh allocation plus the controlled HTTP service after recovery. Identify the exact client and current request for each. Configuration alone does not establish these outcomes.

:::expected
The final state has the helper only on R1 Gi0/0, the wider intended dynamic range, four valid client allocations, and reachable DNS1. The project contains the server GUI configuration as well as the device configurations. Your record can explain why the two fault tests failed for different reasons.
:::

```state
{"status":"Recovered config saved","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"Gi0/0 helper 10.10.20.2","tone":"ok"},{"node":"R2","text":"USERS .50–.254 · 4 bound","tone":"ok"},{"node":"DNS","text":"DNS On · HTTP On","tone":"ok"}],"rows":[["Helper","R1 Gi0/0 only","ok"],["Allocations","PC-A · R3 · PC-B · PC-C","ok"],["DNS1","Reachable","ok"],["Saved","5 devices · 24-dhcp-complete.pkt","ok"]]}
```

## Troubleshooting

- No local link: inspect cable, port, power, and administrative state before DHCP settings.
- Wrong or absent lease: check access VLAN, fresh versus renewing state, client-facing helper, and service dhcp.
- Server sees the attempt but offers nothing: inspect pool selection, exclusions, bindings, conflicts, and security policy.
- Server offers but client does not complete: verify the route to giaddr, reply delivery, snooping trust, and client state; counters alone do not select one cause.
- Correct address but wrong gateway/DNS: inspect the corresponding pool option and the client's actual refreshed settings.
- A snooping-enabled topology differs from this lab: inspect Option 82/giaddr and the deliberate trust policy taught in chapter 16. This fresh topology adds neither snooping nor Option 82 policy.

## Challenge

Use Save As for a separate challenge copy. Add a Catalyst 2960-24TT named SW3 and a fresh PC-PT named PC-D behind unused R1 Gi0/2. Connect R1 Gi0/2 to SW3 Gi0/1 and PC-D FastEthernet0 to SW3 Fa0/1 using straight-through copper. Create VLAN 30 on SW3 and put both connected ports in that access VLAN.

Design and implement the remaining configuration. The new gateway is 10.10.30.1/24; only .50–.59 may be allocated in this subnet. Use an eight-hour lease and the existing DNS1 service at 10.10.20.53. Preserve USERS and the original clients.

Before requesting PC-D's first lease, write its eligible range, expected giaddr and the server's required return route. Then prove the client's settings, matching binding and controlled page by address and name. Recheck an original client's page. If a needed feature is absent, submit both the per-device configuration and predicted evidence labeled unexecuted.

:::solution
The new subnet needs its access VLAN, client-facing helper, matching pool and server return route. These commands preserve USERS.

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

Correlate PC-D's identity with its binding, ping 10.10.30.1 and 10.10.20.53, then browse to `http://portal.dhcp.example`. Original PC-A should still use its 10.10.10.x lease and load that page. Save the challenge copy after verification; the original completed project remains your recovery point.
:::
