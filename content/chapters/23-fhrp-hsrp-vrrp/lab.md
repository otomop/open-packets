---
title: Observe a redundant gateway and track its uplink
environment: mixed
devices: ["3 x 2911 routers", "1 x 2960 switch", "1 x PC", "1 x Server"]
minutes: 75
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The required skill is interpreting gateway roles and their limits. The configuration blocks are supplied setup, not a command-memory test. Steps 1–6 establish and observe ordinary gateway replacement. Steps 7–10 are optional tracking/version extensions. Step 11 and the final challenge are status-interpretation exercises that can be completed even when VRRP is unavailable in Packet Tracer.

The main build uses Packet Tracer and HSRP. VRRP status is a paper exercise because simulator support varies. Configuration is guided practice for understanding FHRP concepts and status; neither track asks you to memorize this entire optional build.

Use blank devices and a new file. The 2911 provides the three GigabitEthernet ports named below. Use straight-through copper between routers/PC and the switch; use crossover or auto-connect for router–router and direct server–router links. In CML or on hardware, map your image's interfaces before typing. All examples and expected outputs are authored, not captured from a manual device run.

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

203.0.113.0/24 is a documentation prefix used for simulated remote service, not actual Internet access. No NAT, DNS, HTTP service, or default route is needed for this ping lab. OSPF area 0 supplies specific remote and return routes. Both gateway LANs are passive in OSPF, so R1 and R2 do not form an OSPF adjacency through VLAN 10.

### Record different kinds of evidence separately

For each phase, record the PC gateway field, R1/R2 role and effective priority, the virtual IP/MAC, the switch port for that MAC, and the remote ping result. Add R3's return route when you inspect it. Predict the changes before triggering them.

| Phase | Role/priority prediction | Gateway identity prediction | Actual remote test and return route |
|---|---|---|---|
| Healthy baseline | Your prediction | Your prediction | Your observation |
| R1 LAN failed | Your prediction | Your prediction | Your observation before recovery |
| R1 LAN restored | Your prediction | Your prediction | Your observation |
| Optional uplink tracked Down | Calculate effective priority | What stays the same? | Observation or labelled worksheet |

Reaching the VIP proves less than reaching the remote server. Do not infer the destination route, return route or application result solely from the word Active.

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
Fa0/1–3 belong to VLAN 10. These ports connect to hosts or routed router interfaces, so PortFast is appropriate. The switch does not require a management IP. The gateway will not respond until the routers are configured.
:::

```state
{"status":"LAN cabled · VLAN 10","cabled":true,"focus":["SW","PC","S"],"prompt":{"node":"SW","text":"SW1#"},"chips":[{"node":"PC","text":"GW 192.168.10.1 (virtual)"},{"node":"S","text":"GW 203.0.113.1"}],"rows":[["SW1 Fa0/1–3","Access VLAN 10 · PortFast"],["PC-A","192.168.10.10/24 · GW 192.168.10.1"],["Server","203.0.113.10/24 · GW 203.0.113.1"],["Gateway .1","No reply until routers are set","dim"]]}
```

## Step 2: Configure both HSRP gateways

Create R1 and R2 with the full configurations below. The two physical LAN addresses differ, but the group and virtual address agree. OSPF is included so that a later failover has a valid return path.

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
After election processing, R1 is Active at priority 110 and R2 Standby at 100. Both show the P flag and virtual IP 192.168.10.1. R2 can become active if R1 fails; preempt additionally allows either router to challenge a healthy lower-priority active router.
:::

```state
{"status":"R1 Active · R2 Standby","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"ACTIVE · 110 · P","tone":"accent"},{"node":"R2","text":"STANDBY · 100 · P"}],"rows":[["Group 1 virtual IP","192.168.10.1 on both"],["R1 Gi0/0","192.168.10.2 · priority 110"],["R2 Gi0/0","192.168.10.3 · priority 100"],["Preempt","P flag on both","ok"]]}
```

## Step 3: Complete the remote routing and save a baseline

Configure R3 and verify both OSPF adjacencies before testing the server. R3 uses cost 10 toward R1 and 20 toward R2, so its normal return path to the client LAN is unambiguous.

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
R3 is Full with R1 and R2 over the two point-to-point links. R3 learns 192.168.10.0/24 via 10.0.13.1 at cost 10 + 1 = 11. R1 and R2 learn 203.0.113.0/24 at cost 10 + 1 = 11. PC-A reaches the server after ARP and convergence.
:::

```state
{"status":"Routed baseline saved","tone":"ok","focus":["R3"],"flows":[{"event":["R3"],"wait":1.2,"tags":{"R3":"OSPF Full with R1 and R2"}},{"path":["PC","SW","R1","R3","S"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"R1":"203.0.113.0/24 via R3 · cost 11"},"backTags":{"R3":"Return via 10.0.13.1 · cost 11"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent"},{"node":"R2","text":"STANDBY · 100"}],"rows":[["R3 neighbors","Full with R1 and R2","ok"],["R3 → 192.168.10.0/24","Via 10.0.13.1 · cost 10 + 1 = 11"],["R1, R2 → 203.0.113.0/24","Cost 10 + 1 = 11"],["PC-A → Server","Replies · configs saved","ok"]]}
```

## Step 4: Inspect the virtual identity and forwarding path

Record baseline roles on both routers and the virtual MAC learned on the switch. On PC-A, ping the server again, then display the ARP cache.

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
The gateway is 192.168.10.1 and the ordinary HSRPv1 group-1 virtual MAC is 0000.0c07.ac01. SW1 should learn it toward Fa0/1, R1. Keep separate notes for the PC ARP mapping, switch port mapping, and remote route; they describe different layers.
:::

```state
{"status":"Virtual MAC on Fa0/1","tone":"ok","focus":["SW","R1"],"flows":[{"path":["PC","SW","R1","R3","S"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"PC":"ARP .1 → 0000.0c07.ac01","SW":"dst 0000.0c07.ac01 → Fa0/1","R1":"Active · route 203.0.113.0/24"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent"},{"node":"R2","text":"STANDBY · 100"}],"rows":[["PC-A gateway","192.168.10.1"],["Virtual MAC","0000.0c07.ac01 · HSRPv1 group 1"],["SW1 learns it on","Fa0/1 toward R1","ok"],["Keep separate","ARP · switch port · route"]]}
```

## Step 5: Fail the active LAN interface and observe

Before shutdown, predict which virtual identity fields stay the same and which switch/role fields change. Collect the observations while R1 Gi0/0 remains down; the next step restores it.

On R1 shut only Gi0/0. This is an interface-failure demonstration, not a promise to reproduce the timer of an unannounced power failure. Repeat the server ping and inspect R2/R3 before restoring anything.

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
R2 becomes Active after the failure is processed. R3 withdraws the unavailable R1 LAN path and uses R2 at cost 20 + 1 = 21. SW1 learns the virtual MAC toward Fa0/2. After convergence PC-A again reaches the server using the same configured virtual gateway; record any lost pings without claiming a fixed failover duration.
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
R1 can reclaim Active because it has priority 110 and preempt. R3 returns to its lower-cost path through R1. Without preempt on R1, recovery alone would not require R2 to give up Active.
:::

```state
{"status":"R1 preempts back","tone":"ok","focus":["R1","R3"],"flows":[{"event":["R1","R2","R3"],"wait":1.2,"tags":{"R1":"Preempts · 110 > 100","R2":"Active → Standby","R3":"Back via R1 · cost 11"}}],"chips":[{"node":"R1","text":"Gi0/0 no shutdown","until":0},{"node":"R1","text":"ACTIVE · 110","tone":"accent","from":0},{"node":"R2","text":"ACTIVE · 100","tone":"accent","until":0},{"node":"R2","text":"STANDBY · 100","from":0}],"rows":[["R1","Active · priority 110 + preempt","ok"],["R2","Standby again"],["R3 → 192.168.10.0/24","Back via R1 · cost 11","ok"],["Without R1 preempt","R2 would stay Active","dim"]]}
```

## Step 7: Add optional uplink tracking

On the Packet Tracer image, first check interface-mode `standby 1 track ?`. If the legacy interface form is supported, use this R1 block:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# standby 1 track gigabitethernet0/1 20
R1(config-if)# end
R1# show standby
```

On IOS XE images that support object tracking instead, use the following alternative, not both forms:

```ios R1
R1# configure terminal
R1(config)# track 1 interface gigabitethernet0/1 line-protocol
R1(config-track)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# standby 1 track 1 decrement 20
R1(config-if)# end
R1# show standby
```

If neither form exists in your simulator image, leave configuration unchanged and do Steps 8–9 as a paper exercise using the expected results. The basic failover in Steps 5–6 remains executable.

:::expected
While the uplink is up, R1 shows current/configured priority 110 and the track condition Up. R2 already has preempt configured, which is necessary to take over when R1 remains alive on the LAN but its effective priority falls below 100.
:::

```state
{"status":"Uplink tracking added","focus":["R1"],"chips":[{"node":"R1","text":"ACTIVE · 110 · track Up","tone":"accent"},{"node":"R2","text":"STANDBY · 100 · P"}],"rows":[["R1 tracks","Gi0/1 · decrement 20"],["R1 priority","110 current · 110 configured"],["Track state","Up","ok"],["R2 preempt","Already configured"]]}
```

## Step 8: Fail the uplink while the gateway stays on the LAN

Before the fault, calculate `110 minus 20`, compare it with R2's effective priority, and identify which peer needs preemption. Check your answer against the actual status after the change; do not make a remote-service guarantee from priority alone.

If Step 7 tracking is configured, shut R1 Gi0/1 only. Leave Gi0/0 up. Inspect both HSRP peers and R3, and repeat the remote ping.

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
The tracked condition goes Down and R1 becomes priority 110 − 20 = 90. R2 at 100 preempts and becomes Active. R3 uses the R2 return path at cost 21 after OSPF converges. Without tracking, R1 could keep Active while lacking the remote route; without R2 preemption, the priority drop alone would not produce the intended takeover.
:::

```state
{"status":"Uplink down · R2 preempts","tone":"warn","focus":["R1","R2"],"cut":[["R1","R3"]],"flows":[{"event":["R1","R2","R3"],"wait":1.2,"tags":{"R1":"Track Down · 110 − 20 = 90","R2":"100 > 90 · preempts → Active","R3":"192.168.10.0/24 via R2 · cost 21"}},{"path":["PC","SW","R2","R3","S"],"back":true,"label":"Remote ping after OSPF converges","tags":{"SW":"dst 0000.0c07.ac01 → Fa0/2","R2":"Active · route 203.0.113.0/24"},"backTags":{"R3":"Return via R2 · cost 21"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent","until":0},{"node":"R1","text":"STANDBY · 90 (configured 110)","tone":"warn","from":0},{"node":"R2","text":"STANDBY · 100","until":0},{"node":"R2","text":"ACTIVE · 100","tone":"accent","from":0}],"rows":[["R1 priority","90 current · 110 configured","warn"],["R2","100 · preempts → Active"],["R3 → 192.168.10.0/24","Via R2 · cost 21"],["R1 Gi0/0","Still up on the LAN"]]}
```

## Step 9: Restore the uplink and verify recovery

Restore the exact interface changed in Step 8. If you used the paper fallback, state the same expected transition without changing the working devices.

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
Tracking returns Up, R1 effective priority returns to 110, and R1 can preempt again. Wait until OSPF is Full and the remote ping works. The configured tracking decrement stays 20; recovery restores the effective priority rather than deleting the tracking configuration.
:::

```state
{"status":"Uplink back · R1 Active","tone":"ok","focus":["R1"],"flows":[{"event":["R1","R2","R3"],"wait":1.2,"tags":{"R1":"Track Up · 110 · preempts","R2":"Active → Standby","R3":"OSPF Full · via R1 · cost 11"}},{"path":["PC","SW","R1","R3","S"],"back":true,"label":"Remote ping","tags":{"SW":"dst 0000.0c07.ac01 → Fa0/1","R1":"Active · route 203.0.113.0/24"}}],"chips":[{"node":"R1","text":"STANDBY · 90 (configured 110)","tone":"warn","until":0},{"node":"R1","text":"ACTIVE · 110","tone":"accent","from":0},{"node":"R2","text":"ACTIVE · 100","tone":"accent","until":0},{"node":"R2","text":"STANDBY · 100","from":0}],"rows":[["Track","Up · decrement still 20","ok"],["R1 priority","110 again · can preempt","ok"],["OSPF","Full again","ok"],["Remote ping","Works","ok"]]}
```

## Step 10: Compare HSRP versions as an optional extension

In this isolated lab, change both interfaces to HSRPv2 and verify the group again. A temporary mismatch is expected while only one peer has changed; complete both before testing. If your simulator lacks `standby version 2`, compare the expected MAC on paper instead.

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
The virtual IP stays 192.168.10.1 but the IPv4 group-1 virtual MAC becomes 0000.0c9f.f001. Both peers must use the same version. Let announcements refresh the host mapping and retest. If a stale PC cache persists, use Desktop > Command Prompt `arp -d` as supported or wait for refresh; this version change differs from ordinary same-version failover.
:::

```state
{"status":"HSRPv2 · new virtual MAC","tone":"warn","focus":["R1","R2"],"flows":[{"event":["R1"],"wait":1.2,"tone":"warn","tags":{"R1":"Version 2 · R2 still v1"}},{"event":["R1","R2"],"tags":{"R1":"Virtual MAC 0000.0c9f.f001","R2":"Version 2 · peers match"}},{"path":["PC","SW","R1","R3","S"],"back":true,"label":"Retest after the ARP refresh","tags":{"PC":"ARP .1 → 0000.0c9f.f001","SW":"dst 0000.0c9f.f001 → Fa0/1"}}],"chips":[{"node":"R1","text":"ACTIVE · HSRPv1","tone":"accent","until":0},{"node":"R1","text":"HSRPv2 · mismatch","tone":"warn","from":0,"until":1},{"node":"R1","text":"ACTIVE · HSRPv2","tone":"accent","from":1},{"node":"R2","text":"STANDBY · HSRPv1","until":0},{"node":"R2","text":"HSRPv1 · mismatch","tone":"warn","from":0,"until":1},{"node":"R2","text":"STANDBY · HSRPv2","from":1}],"rows":[["Virtual IP","192.168.10.1 · unchanged"],["Virtual MAC","0000.0c07.ac01 → 0000.0c9f.f001"],["Both peers","Same version required"],["Stale PC cache","arp -d or wait for refresh","dim"]]}
```

## Step 11: Interpret VRRP status on paper

Read these authored summaries as status evidence from a hypothetical supported IOS XE pair; they are not commands to paste or recorded Packet Tracer output.
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
Write who forwards for each family, whether the IPv4 Master result proves IPv6 leadership, and whether IPv6 uses ARP. Then predict what happens when an IPv4 non-owner with priority 120 and preemption enabled joins.

:::solution
R1 is the IPv4 forwarding router. R1 is IPv6 Backup; FE80::3 identifies the IPv6 Master on that link. IPv4 and IPv6 instances are independent. IPv6 uses Neighbor Discovery. A healthy IPv4 priority-120 non-owner can preempt the priority-110 non-owner, subject to election processing and any configured delay. An address-owner case would need separate priority-255 reasoning.
:::

```state
{"status":"VRRP read on paper","tone":"dim","rows":[["IPv4 group 1","R1 Master 110 · R2 Backup 100"],["IPv4 virtual MAC","0000.5e00.0101"],["IPv6 group 1","R1 Backup 90 · Master address FE80::3"],["Predict a joiner","IPv4 non-owner · priority 120 · preempt"]]}
```

## Step 12: Save only the restored working configuration

Confirm R1 Gi0/0 and Gi0/1 are up, both HSRP peers agree on the supported version, routing is restored, and PC-A reaches the server. Then save all device configurations and the project file.

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
Your saved lab has no intentional shutdown fault. Record whether you ran HSRPv1 or HSRPv2 and which tracking syntax was supported. A paper exercise does not count as a command executed on a device.
:::

```state
{"status":"Restored and saved","tone":"ok","focus":["R1","R2","R3","SW"],"flows":[{"path":["PC","SW","R1","R3","S"],"back":true,"label":"PC-A pings 203.0.113.10","tags":{"SW":"Virtual MAC → Fa0/1"}}],"chips":[{"node":"R1","text":"ACTIVE · 110","tone":"accent"},{"node":"R2","text":"STANDBY · 100"}],"rows":[["R1 Gi0/0 · Gi0/1","Both up","ok"],["HSRP peers","Same version","ok"],["PC-A → Server","Replies","ok"],["Saved","All four devices · project file","ok"]]}
```

## Troubleshooting

- Both peers Active with unknown Standby: compare VLAN 10 membership, version, group 1, VIP, and control-plane communication.
- Remote ping fails while the VIP responds: inspect the active router's route to 203.0.113.0/24 and R3's return route to 192.168.10.0/24.
- R1 uplink fails but role does not change: inspect effective priority, tracking support/status, decrement, and R2 preempt.
- R1 recovers but stays Standby: inspect R1 preempt and effective priority; do not assume highest configured priority always wins immediately.
- A PC loses service only when R1 fails: confirm its gateway is .1, not R1's real address .2.
- An unsupported command: use the documented alternative or paper fallback. Do not claim a feature was verified just because a configuration line was supplied.

## Challenge

This is a fresh status worksheet, not a request to reconfigure the guided lab. Treat the following as complete relevant evidence for an isolated pair after convergence. Neither router is a VRRP address owner.

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
The PC gateway should be `192.168.120.1`, the virtual address. Its initial `.2` gateway can answer while R1 is healthy, masking the dependence on one real router. HSRP failover does not rewrite that static PC field or transfer every real interface address.

The tracked failure lowers R1's **effective** priority to `135 - 40 = 95`; its configured baseline stays 135. R2 at 110 has preempt and can become Active while R1 becomes Standby. The intended virtual gateway identity stays the same. On recovery R1 returns to effective 135 and, with preempt enabled, can reclaim Active after protocol processing and any configured delay.

Verify current roles and priorities, the host gateway, the active router's destination route, the remote return route, and an actual host-to-remote test. A role change alone cannot establish end-to-end service. A local line-protocol tracker stays Up if that interface stays Up; it does not detect every remote route or application failure.

For the separate VRRPv3 evidence, R1 is IPv4 Master and IPv6 Backup. `FE80::3` identifies the IPv6 forwarding peer on this link. IPv4 and IPv6 instances are independent even when both are numbered 5. This is a status interpretation, not proof that a Packet Tracer VRRP process was executed.
:::
