---
title: Observe a redundant gateway and track its uplink
environment: mixed
devices: ["3 x 2911 routers", "1 x 2960 switch", "1 x PC", "1 x Server"]
minutes: 75
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You will build the lesson's two-gateway LAN, watch HSRP elect R1, and then break things on purpose: first R1's LAN interface, then its uplink. At each stage you read `show standby` on both routers and check whether PC-A still reaches the server. The skill being practised is reading gateway roles, so the configuration is given to you in full.

Steps 1–6 are the core lab. Steps 7–10 are optional: they add uplink tracking and HSRP version 2, and depend on what your Packet Tracer image accepts. Step 11 and the challenge are done on paper, because Packet Tracer does not include VRRP.

Use blank devices and a new file. The 2911 has the three GigabitEthernet ports named below. Use straight-through copper between the switch and the routers and PC; use crossover or auto-connect for the router-to-router and server-to-router links. In CML or on hardware, map your image's interface names before typing. The expected outputs were written for this lab, not captured from a device, so spacing may differ.

## Topology

```diagram
{"type":"topology","title":"Lab 23 — Two gateways with separate routed uplinks","caption":"PC-A uses the virtual gateway; R3 learns a return path through whichever LAN advertisement remains reachable.","nodes":[{"id":"PC","kind":"pc","label":"PC-A","x":0.5,"y":3},{"id":"SW","kind":"switch","label":"SW1","sub":"VLAN 10","x":3,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"LAN .2, priority 110","x":6,"y":1},{"id":"R2","kind":"router","label":"R2","sub":"LAN .3, priority 100","x":6,"y":5},{"id":"R3","kind":"router","label":"R3","x":9,"y":3},{"id":"S","kind":"server","label":"Server","sub":"203.0.113.10","x":12,"y":3}],"links":[{"from":"PC","to":"SW","toLabel":"Fa0/3"},{"from":"SW","to":"R1","fromLabel":"Fa0/1","toLabel":"Gi0/0"},{"from":"SW","to":"R2","fromLabel":"Fa0/2","toLabel":"Gi0/0"},{"from":"R1","to":"R3","fromLabel":"Gi0/1","toLabel":"Gi0/0","label":"10.0.13.0/30"},{"from":"R2","to":"R3","fromLabel":"Gi0/1","toLabel":"Gi0/1","label":"10.0.23.0/30"},{"from":"R3","to":"S","fromLabel":"Gi0/2"}]}
```

| Device/interface | IPv4 address/mask | Host gateway or peer |
|---|---|---|
| R1 Gi0/0 | 192.168.10.2 / 255.255.255.0 | SW1 Fa0/1 |
| R2 Gi0/0 | 192.168.10.3 / 255.255.255.0 | SW1 Fa0/2 |
| HSRP group 1 | Virtual 192.168.10.1 | PC-A's default gateway |
| PC-A FastEthernet0 | 192.168.10.10 / 255.255.255.0 | Gateway 192.168.10.1, SW1 Fa0/3 |
| R1 Gi0/1 | 10.0.13.1 / 255.255.255.252 | R3 Gi0/0 |
| R3 Gi0/0 | 10.0.13.2 / 255.255.255.252 | R1 Gi0/1 |
| R2 Gi0/1 | 10.0.23.1 / 255.255.255.252 | R3 Gi0/1 |
| R3 Gi0/1 | 10.0.23.2 / 255.255.255.252 | R2 Gi0/1 |
| R3 Gi0/2 | 203.0.113.1 / 255.255.255.0 | Server FastEthernet0 |
| Server | 203.0.113.10 / 255.255.255.0 | Gateway 203.0.113.1 |

203.0.113.0/24 is a documentation prefix that stands in for a remote network. Single-area OSPF from Chapter 21 carries the routes between the client LAN and the server in both directions. The VLAN 10 interfaces are passive, so R1 and R2 form OSPF neighbors only with R3, never with each other across the LAN.

### Record different kinds of evidence separately

For each phase, record the PC's gateway, each router's role and current priority, the virtual IP and MAC, the switch port that leads to that MAC, the server ping result and R3's route back to the client LAN. Write your prediction before you trigger each change.

| Phase | Role/priority prediction | Gateway identity prediction | Actual remote test and return route |
|---|---|---|---|
| Healthy baseline | Your prediction | Your prediction | Your observation |
| R1 LAN failed | Your prediction | Your prediction | Your observation before recovery |
| R1 LAN restored | Your prediction | Your prediction | Your observation |
| Optional uplink tracked Down | Calculate effective priority | What stays the same? | Observation or labelled worksheet |

A reply from the virtual IP proves less than a reply from the server, so test both.

## Step 1: Cable the LAN and prepare the hosts

Cable the ports in the table. Configure the PC and Server through Desktop > IP Configuration with the static address, mask, and gateway shown. Use a blank 2960 and put all three used switch ports in VLAN 10.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name USERS
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/1 - 3
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
SW1# show vlan brief
```


:::expected
Fa0/1–3 belong to VLAN 10. None of these ports leads to another switch, so PortFast is appropriate. The gateway will not answer until the routers are configured.
:::

```state
{"status":"LAN cabled · VLAN 10","cabled":true,"focus":["SW","PC","S"],"prompt":{"node":"SW","text":"SW1#"},"chips":[{"node":"PC","text":"GW 192.168.10.1 (virtual)"},{"node":"S","text":"GW 203.0.113.1"}],"rows":[["SW1 Fa0/1–3","Access VLAN 10 · PortFast"],["PC-A","192.168.10.10/24 · GW 192.168.10.1"],["Server","203.0.113.10/24 · GW 203.0.113.1"],["Gateway .1","No reply until routers are set","dim"]]}
```

## Step 2: Configure both HSRP gateways

Configure R1 and R2 with the blocks below. Their real LAN addresses differ, but the group number and virtual IP are the same. `standby version 1` is the default; typing it makes the starting version visible for Step 10.

The OSPF lines follow Chapter 21 and give every failover a working return path. `passive-interface default` stops Hellos on every interface, `no passive-interface` re-enables the uplink, `ip ospf 10 area 0` places an interface in area 0, and `ip ospf network point-to-point` skips the DR election on a two-router link. The costs are set by hand so that the path through R1 is preferred.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# router ospf 10
R1(config-router)# router-id 1.1.1.1
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gigabitethernet0/1
R1(config-router)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 192.168.10.2 255.255.255.0
R1(config-if)# ip ospf 10 area 0
R1(config-if)# ip ospf cost 1
R1(config-if)# standby version 1
R1(config-if)# standby 1 ip 192.168.10.1
R1(config-if)# standby 1 priority 110
R1(config-if)# standby 1 preempt
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.0.13.1 255.255.255.252
R1(config-if)# ip ospf 10 area 0
R1(config-if)# ip ospf network point-to-point
R1(config-if)# ip ospf cost 10
R1(config-if)# no shutdown
R1(config-if)# end
R1# show standby brief
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# router ospf 10
R2(config-router)# router-id 2.2.2.2
R2(config-router)# passive-interface default
R2(config-router)# no passive-interface gigabitethernet0/1
R2(config-router)# exit
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 192.168.10.3 255.255.255.0
R2(config-if)# ip ospf 10 area 0
R2(config-if)# ip ospf cost 1
R2(config-if)# standby version 1
R2(config-if)# standby 1 ip 192.168.10.1
R2(config-if)# standby 1 priority 100
R2(config-if)# standby 1 preempt
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# interface gigabitethernet0/1
R2(config-if)# ip address 10.0.23.1 255.255.255.252
R2(config-if)# ip ospf 10 area 0
R2(config-if)# ip ospf network point-to-point
R2(config-if)# ip ospf cost 10
R2(config-if)# no shutdown
R2(config-if)# end
R2# show standby brief
```


:::expected
Within about half a minute R1 is Active at priority 110 and R2 is Standby at 100. Both show the P flag and virtual IP 192.168.10.1. R1 reports Standby `unknown` until R2 has been configured.
:::

```state
{"status":"R1 Active · R2 Standby","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"ACTIVE · 110 · P","tone":"accent"},{"node":"R2","text":"STANDBY · 100 · P"}],"rows":[["Group 1 virtual IP","192.168.10.1 on both"],["R1 Gi0/0","192.168.10.2 · priority 110"],["R2 Gi0/0","192.168.10.3 · priority 100"],["Preempt","P flag on both","ok"]]}
```

## Step 3: Complete the remote routing and save a baseline

Configure R3 and check both OSPF adjacencies before you test the server. R3 uses cost 10 toward R1 and 20 toward R2, so its return path to the client LAN normally runs through R1.

```ios R3
Router> enable
Router# configure terminal
Router(config)# hostname R3
R3(config)# router ospf 10
R3(config-router)# router-id 3.3.3.3
R3(config-router)# passive-interface default
R3(config-router)# no passive-interface gigabitethernet0/0
R3(config-router)# no passive-interface gigabitethernet0/1
R3(config-router)# exit
R3(config)# interface gigabitethernet0/0
R3(config-if)# ip address 10.0.13.2 255.255.255.252
R3(config-if)# ip ospf 10 area 0
R3(config-if)# ip ospf network point-to-point
R3(config-if)# ip ospf cost 10
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/1
R3(config-if)# ip address 10.0.23.2 255.255.255.252
R3(config-if)# ip ospf 10 area 0
R3(config-if)# ip ospf network point-to-point
R3(config-if)# ip ospf cost 20
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/2
R3(config-if)# ip address 203.0.113.1 255.255.255.0
R3(config-if)# ip ospf 10 area 0
R3(config-if)# ip ospf cost 1
R3(config-if)# no shutdown
R3(config-if)# end
R3# show ip ospf neighbor
R3# show ip route ospf
```

```ios R1
R1# copy running-config startup-config
```

```ios R2
R2# copy running-config startup-config
```

```ios R3
R3# copy running-config startup-config
```

```ios SW1
SW1# copy running-config startup-config
```

Accept the default destination filename. On PC-A run:
```text
ping 203.0.113.10
```

:::expected
R3 is Full with R1 and R2 over the two point-to-point links. R3 learns 192.168.10.0/24 via 10.0.13.1 at cost 10 + 1 = 11. R1 and R2 each learn 203.0.113.0/24 at cost 10 + 1 = 11. PC-A reaches the server; the first ping or two may time out while ARP completes.
:::

```state
{"status":"Routed baseline saved","tone":"ok","focus":["R3"],"flows":[{"event":["R3"],"wait":1.2,"tags":{"R3":"OSPF Full with R1 and R2"}},{"path":["PC","SW","R1","R3","S"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"R1":"203.0.113.0/24 via R3 · cost 11"},"backTags":{"R3":"Return via 10.0.13.1 · cost 11"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent"},{"node":"R2","text":"STANDBY · 100"}],"rows":[["R3 neighbors","Full with R1 and R2","ok"],["R3 → 192.168.10.0/24","Via 10.0.13.1 · cost 10 + 1 = 11"],["R1, R2 → 203.0.113.0/24","Cost 10 + 1 = 11"],["PC-A → Server","Replies · configs saved","ok"]]}
```

## Step 4: Inspect the virtual identity and forwarding path

Record the baseline: the roles on both routers and the port where SW1 has learned the virtual MAC. On PC-A, ping the server again and then display the ARP cache.

```ios R1
R1# show standby
R1# show ip route 203.0.113.0
```

```ios R2
R2# show standby brief
```

```ios SW1
SW1# show mac address-table
```

```text
arp -a
```
If the Packet Tracer switch accepts filtering, `show mac address-table address 0000.0c07.ac01` narrows the result. The unfiltered command is sufficient.


:::expected
PC-A's ARP cache maps 192.168.10.1 to 0000.0c07.ac01, the HSRPv1 virtual MAC for group 1. SW1 has learned that MAC on Fa0/1, toward R1. Note the ARP entry, the switch port and R1's route to the server separately. Step 5 changes the switch port but not the ARP entry.
:::

```state
{"status":"Virtual MAC on Fa0/1","tone":"ok","focus":["SW","R1"],"flows":[{"path":["PC","SW","R1","R3","S"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"PC":"ARP .1 → 0000.0c07.ac01","SW":"dst 0000.0c07.ac01 → Fa0/1","R1":"Active · route 203.0.113.0/24"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent"},{"node":"R2","text":"STANDBY · 100"}],"rows":[["PC-A gateway","192.168.10.1"],["Virtual MAC","0000.0c07.ac01 · HSRPv1 group 1"],["SW1 learns it on","Fa0/1 toward R1","ok"],["Keep separate","ARP · switch port · route"]]}
```

## Step 5: Fail the active LAN interface and observe

Before you shut the interface, predict what stays the same and what changes among the gateway IP, the virtual MAC, the roles and the switch port. Then shut only Gi0/0 on R1. On real IOS a shutdown makes R1 send a Resign, so R2 takes over sooner than the 10-second hold time that a power failure would need; Packet Tracer may wait for the timer.

Repeat the server ping and inspect R2, R3 and SW1 while Gi0/0 is still down. The next step restores it.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# shutdown
R1(config-if)# end
```

```ios R2
R2# show standby brief
```

```ios R3
R3# show ip route 192.168.10.0
```

```ios SW1
SW1# show mac address-table
```


:::expected
R2 becomes Active. R3 drops the path through R1 and reaches 192.168.10.0/24 through R2 at cost 20 + 1 = 21. SW1 now lists the virtual MAC on Fa0/2. PC-A reaches the server again through the same gateway IP and the same virtual MAC. Note how many pings were lost.
:::

```state
{"status":"R1 LAN down · R2 Active","tone":"warn","focus":["R2","R3"],"cut":[["SW","R1"]],"flows":[{"event":["R2","R3"],"wait":1.2,"tags":{"R2":"Standby → Active","R3":"192.168.10.0/24 via R2 · cost 21"}},{"path":["PC","SW","R2","R3","S"],"back":true,"label":"Ping after convergence","tags":{"PC":"Same gateway 192.168.10.1","SW":"dst 0000.0c07.ac01 → Fa0/2","R2":"Active · route 203.0.113.0/24"},"backTags":{"R3":"Return via R2 · cost 21"}}],"chips":[{"node":"R1","text":"Gi0/0 shut","tone":"bad"},{"node":"R2","text":"STANDBY · 100","until":0},{"node":"R2","text":"ACTIVE · 100","tone":"accent","from":0}],"rows":[["R2","Standby → Active"],["R3 → 192.168.10.0/24","Via R2 · cost 20 + 1 = 21"],["SW1 virtual MAC","Now on Fa0/2"],["Lost pings","Record them · no fixed time","warn"]]}
```

## Step 6: Restore R1 and observe preemption

Restore R1 Gi0/0 and wait for HSRP and OSPF to settle.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show standby brief
```

```ios R3
R3# show ip route 192.168.10.0
```


:::expected
R1 becomes Active again because it has the higher priority and preempt. R3 returns to the cost-11 path through R1. Without preempt on R1, R2 would have stayed Active.
:::

```state
{"status":"R1 preempts back","tone":"ok","focus":["R1","R3"],"flows":[{"event":["R1","R2","R3"],"wait":1.2,"tags":{"R1":"Preempts · 110 > 100","R2":"Active → Standby","R3":"Back via R1 · cost 11"}}],"chips":[{"node":"R1","text":"Gi0/0 no shutdown","until":0},{"node":"R1","text":"ACTIVE · 110","tone":"accent","from":0},{"node":"R2","text":"ACTIVE · 100","tone":"accent","until":0},{"node":"R2","text":"STANDBY · 100","from":0}],"rows":[["R1","Active · priority 110 + preempt","ok"],["R2","Standby again"],["R3 → 192.168.10.0/24","Back via R1 · cost 11","ok"],["Without R1 preempt","R2 would stay Active","dim"]]}
```

## Step 7: Add optional uplink tracking

Tracking lets R1 give up the gateway when its uplink fails. The syntax depends on the image, so enter `standby 1 track ?` in interface mode on R1 first. If the help lists interface names, which is the older form that Packet Tracer uses, enter this block:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# standby 1 track gigabitethernet0/1 20
R1(config-if)# end
R1# show standby
```

If your image rejects the trailing `20`, enter the command without it. The decrement is then the default 10, which only brings R1 down to 100: a tie with R2, and a tie does not cause preemption. In that case also enter `standby 1 priority 105` on R2 Gi0/0. R1's 110 still wins while the uplink is up, and 110 − 10 = 100 loses to 105 when it is down.

If the help offers an object number instead, as on current IOS and IOS XE, use this alternative. Do not configure both forms:

```ios R1
R1# configure terminal
R1(config)# track 1 interface gigabitethernet0/1 line-protocol
R1(config-track)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# standby 1 track 1 decrement 20
R1(config-if)# end
R1# show standby
```

If your image has neither form, leave the configuration unchanged and read Steps 8–9 as a paper exercise.

:::expected
While the uplink is up, `show standby` on R1 still reports priority 110 and lists the tracked interface or object as Up. R2 already has preempt, which it needs in Step 8 to take the role from a router that is still alive on the LAN.
:::

```state
{"status":"Uplink tracking added","focus":["R1"],"chips":[{"node":"R1","text":"ACTIVE · 110 · track Up","tone":"accent"},{"node":"R2","text":"STANDBY · 100 · P"}],"rows":[["R1 tracks","Gi0/1 · decrement 20"],["R1 priority","110 current · 110 configured"],["Track state","Up","ok"],["R2 preempt","Already configured"]]}
```

## Step 8: Fail the uplink while the gateway stays on the LAN

Before the fault, work out 110 − 20, compare the result with R2's priority, and decide which router needs preempt for the roles to change. Then shut only Gi0/1 on R1 and leave Gi0/0 up. Inspect both HSRP peers and R3, and repeat the server ping.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# shutdown
R1(config-if)# end
R1# show standby
```

```ios R2
R2# show standby brief
```

```ios R3
R3# show ip route 192.168.10.0
```


:::expected
The track state goes Down and R1's priority becomes 110 − 20 = 90 (100, against R2's 105, if you used the default decrement). R2 preempts and becomes Active. R3 reaches the client LAN through R2 at cost 21 and the server ping works again. Without tracking, R1 would have stayed Active with no route to the server. Without preempt on R2, the lower priority alone would have changed nothing.
:::

```state
{"status":"Uplink down · R2 preempts","tone":"warn","focus":["R1","R2"],"cut":[["R1","R3"]],"flows":[{"event":["R1","R2","R3"],"wait":1.2,"tags":{"R1":"Track Down · 110 − 20 = 90","R2":"100 > 90 · preempts → Active","R3":"192.168.10.0/24 via R2 · cost 21"}},{"path":["PC","SW","R2","R3","S"],"back":true,"label":"Remote ping after OSPF converges","tags":{"SW":"dst 0000.0c07.ac01 → Fa0/2","R2":"Active · route 203.0.113.0/24"},"backTags":{"R3":"Return via R2 · cost 21"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent","until":0},{"node":"R1","text":"STANDBY · 90 (configured 110)","tone":"warn","from":0},{"node":"R2","text":"STANDBY · 100","until":0},{"node":"R2","text":"ACTIVE · 100","tone":"accent","from":0}],"rows":[["R1 priority","90 current · 110 configured","warn"],["R2","100 · preempts → Active"],["R3 → 192.168.10.0/24","Via R2 · cost 21"],["R1 Gi0/0","Still up on the LAN"]]}
```

## Step 9: Restore the uplink and verify recovery

Restore the interface you shut in Step 8. If you are working on paper, write down the transition you expect instead.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# no shutdown
R1(config-if)# end
R1# show standby
R1# show ip ospf neighbor
```

```ios R3
R3# show ip route 192.168.10.0
```


:::expected
The track state returns to Up, R1's priority returns to 110, and R1 preempts and becomes Active. Wait until OSPF is Full with R3 and the server ping works. The tracking configuration itself is unchanged and will act again at the next uplink failure.
:::

```state
{"status":"Uplink back · R1 Active","tone":"ok","focus":["R1"],"flows":[{"event":["R1","R2","R3"],"wait":1.2,"tags":{"R1":"Track Up · 110 · preempts","R2":"Active → Standby","R3":"OSPF Full · via R1 · cost 11"}},{"path":["PC","SW","R1","R3","S"],"back":true,"label":"Remote ping","tags":{"SW":"dst 0000.0c07.ac01 → Fa0/1","R1":"Active · route 203.0.113.0/24"}}],"chips":[{"node":"R1","text":"STANDBY · 90 (configured 110)","tone":"warn","until":0},{"node":"R1","text":"ACTIVE · 110","tone":"accent","from":0},{"node":"R2","text":"ACTIVE · 100","tone":"accent","until":0},{"node":"R2","text":"STANDBY · 100","from":0}],"rows":[["Track","Up · decrement still 20","ok"],["R1 priority","110 again · can preempt","ok"],["OSPF","Full again","ok"],["Remote ping","Works","ok"]]}
```

## Step 10: Compare HSRP versions as an optional extension

Change both LAN interfaces to HSRP version 2 and check the group again. While only one router has been changed, the two cannot hear each other and both become Active, so finish both before you test. If your image lacks `standby version 2`, work out the new virtual MAC on paper instead.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# standby version 2
R1(config-if)# end
```

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/0
R2(config-if)# standby version 2
R2(config-if)# end
R2# show standby
```

```ios R1
R1# show standby brief
```


:::expected
The virtual IP stays 192.168.10.1, but the group 1 virtual MAC becomes 0000.0c9f.f001. R1 is Active and R2 is Standby again once both run version 2. Unlike a failover, a version change gives the gateway a new MAC, so PC-A's ARP entry must refresh. If the server ping fails, run `arp -d` in PC-A's Command Prompt and try again.
:::

```state
{"status":"HSRPv2 · new virtual MAC","tone":"warn","focus":["R1","R2"],"flows":[{"event":["R1"],"wait":1.2,"tone":"warn","tags":{"R1":"Version 2 · R2 still v1"}},{"event":["R1","R2"],"tags":{"R1":"Virtual MAC 0000.0c9f.f001","R2":"Version 2 · peers match"}},{"path":["PC","SW","R1","R3","S"],"back":true,"label":"Retest after the ARP refresh","tags":{"PC":"ARP .1 → 0000.0c9f.f001","SW":"dst 0000.0c9f.f001 → Fa0/1"}}],"chips":[{"node":"R1","text":"ACTIVE · HSRPv1","tone":"accent","until":0},{"node":"R1","text":"HSRPv2 · mismatch","tone":"warn","from":0,"until":1},{"node":"R1","text":"ACTIVE · HSRPv2","tone":"accent","from":1},{"node":"R2","text":"STANDBY · HSRPv1","until":0},{"node":"R2","text":"HSRPv1 · mismatch","tone":"warn","from":0,"until":1},{"node":"R2","text":"STANDBY · HSRPv2","from":1}],"rows":[["Virtual IP","192.168.10.1 · unchanged"],["Virtual MAC","0000.0c07.ac01 → 0000.0c9f.f001"],["Both peers","Same version required"],["Stale PC cache","arp -d or wait for refresh","dim"]]}
```

## Step 11: Interpret VRRP status on paper

These summaries describe an IOS XE pair running VRRPv3. They are for reading, not typing.
```output Representative VRRP status summaries
R1 — Group 1 — Address-Family IPv4
  State Master, Priority 110, Preemption enabled, Address owner No
  Virtual address 192.168.10.1, Master address 192.168.10.2
R2 — Group 1 — Address-Family IPv4
  State Backup, Priority 100, Preemption enabled, Address owner No
  Virtual MAC 0000.5e00.0101
R1 — Group 1 — Address-Family IPv6
  State Backup, Priority 90, Preemption enabled, Address owner No
  Virtual address FE80::1, Master address FE80::3
  Virtual MAC 0000.5e00.0201
```
Write down which router forwards for each address family, whether R1 being IPv4 Master tells you anything about IPv6, and how IPv6 hosts find the gateway's MAC. Then predict what happens when a third router joins the IPv4 group with priority 120 and default preemption.

:::solution
R1 is the IPv4 Master, so it forwards for 192.168.10.1. For IPv6, R1 is Backup and the router at FE80::3 is the Master. The two instances are independent, so one result says nothing about the other. IPv6 hosts use Neighbor Discovery, not ARP. The new router preempts R1 and becomes IPv4 Master, because VRRP preemption is on by default and 120 beats 110. Only an address owner, at priority 255, could not be displaced.
:::

```state
{"status":"VRRP read on paper","tone":"dim","rows":[["IPv4 group 1","R1 Master 110 · R2 Backup 100"],["IPv4 virtual MAC","0000.5e00.0101"],["IPv6 group 1","R1 Backup 90 · Master address FE80::3"],["Predict a joiner","IPv4 non-owner · priority 120 · preempt"]]}
```

## Step 12: Save only the restored working configuration

Confirm that R1 Gi0/0 and Gi0/1 are up, both routers run the same HSRP version, R1 is Active, and PC-A reaches the server. Then save all four device configurations and the project file.

```ios R1
R1# copy running-config startup-config
```

```ios R2
R2# copy running-config startup-config
```

```ios R3
R3# copy running-config startup-config
```

```ios SW1
SW1# copy running-config startup-config
```


:::expected
The saved lab has no interface left shut down. Note whether you finished on HSRPv1 or HSRPv2 and which tracking syntax your image accepted.
:::

```state
{"status":"Restored and saved","tone":"ok","focus":["R1","R2","R3","SW"],"flows":[{"path":["PC","SW","R1","R3","S"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"SW":"Virtual MAC → Fa0/1"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent"},{"node":"R2","text":"STANDBY · 100"}],"rows":[["R1 Gi0/0 · Gi0/1","Both up","ok"],["HSRP peers","Same version","ok"],["PC-A → Server","Replies","ok"],["Saved","All four devices · project file","ok"]]}
```

## Troubleshooting

- Both routers are Active with Standby `unknown`: check that Fa0/1 and Fa0/2 are in VLAN 10 and that both routers use the same HSRP version, group 1 and virtual IP.
- The server ping fails while the virtual IP answers: check the Active router's route to 203.0.113.0/24 and R3's route back to 192.168.10.0/24.
- R1's uplink fails but the roles do not change: check R1's current priority and track state, the decrement, and preempt on R2.
- R1 recovers but stays Standby: check that R1 has preempt and that its current priority is back to 110.
- PC-A loses service only when R1 fails: its gateway is probably R1's real address .2 instead of the virtual .1.
- A command is rejected: use the alternative given in that step, or treat the step as a paper exercise.

## Challenge

This is a paper exercise about a different network; do not reconfigure the lab. The status below is everything you know about the pair. Neither router is a VRRP address owner.

```output Authored challenge requirements and initial state
HSRP group 12, same version and VLAN on both peers
Virtual IPv4 address 192.168.120.1
R1 real address 192.168.120.2, Active
  configured/effective priority 135, preemption enabled
  local uplink line-protocol tracking, decrement 40, currently Up
R2 real address 192.168.120.3, Standby
  effective priority 110, preemption enabled, uplink Up
PC address 192.168.120.20/24, gateway 192.168.120.2

Separate VRRPv3 status on R1:
IPv4 group 5: Master, priority 120, virtual address 192.168.125.1
IPv6 group 5: Backup, priority 90, virtual address FE80::5
IPv6 Master address FE80::3, priority 110
```

Write answers before revealing the solution:

1. Correct the PC gateway plan. Explain why the initial local gateway ping would not reveal that redundancy mistake.
2. R1's tracked uplink goes Down while its LAN stays up. Calculate its new effective priority, predict the HSRP roles, and say which priority value remains configured.
3. R1's uplink recovers. Predict the steady-state roles with the supplied preemption settings. Identify the tests needed before declaring remote service restored.
4. In a different failure, both local uplinks stay Up but a remote server route disappears. Must this local line-protocol tracking change roles? Explain the evidence limit.
5. Read the separate VRRPv3 entries: does R1 forward for IPv4, IPv6, both or neither? Which address identifies the IPv6 forwarding peer, and why does the matching group number not settle the answer?

:::solution
The PC gateway should be `192.168.120.1`, the virtual address. The `.2` gateway answers while R1 is healthy, which hides the mistake until R1 fails. A failover moves the virtual address to R2, never R1's real address.

The tracked failure lowers R1's current priority to 135 − 40 = 95; its configured priority stays 135. R2 at 110 has preempt, so R2 becomes Active and R1 becomes Standby. The virtual IP and MAC do not change. When the uplink recovers, R1 returns to 135 and, with preempt enabled, becomes Active again.

Before you declare service restored, check the roles and priorities, the host's gateway, the Active router's route to the destination, the return route, and a ping from the host to the remote destination. In the fourth case the roles do not change: line-protocol tracking watches only the local interface, and both uplinks are still up.

In the VRRPv3 status, R1 is IPv4 Master and IPv6 Backup, so it forwards for IPv4 only. `FE80::3` is the IPv6 Master on this link. IPv4 and IPv6 groups are separate instances even when both are numbered 5.
:::
