---
title: Build and troubleshoot a single-area IPv4 network
environment: packet-tracer
devices: ["3 x 2911 routers", "1 x 2960 switch", "2 x PC"]
minutes: 95
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The addressing and initial OSPF settings are supplied. Your work is to predict elections and routes, prove them from separate observations, and diagnose a fault before applying its repair. The challenge adds an independently planned LAN and a directional-cost test.

Build from blank devices. You will prove a broadcast election, a point-to-point adjacency, two client routes, and failover between known-cost paths. Keep a table of observations before and after each fault.

Use a new Packet Tracer file with **three 2911 routers**, **one 2960 switch**, and **two PCs**. The 2911 provides Gi0/0, Gi0/1, and Gi0/2. Use straight-through copper for router–switch links, and crossover or the auto-connect tool for router–router and direct PC–router links. On CML/other images, map the interfaces explicitly before typing. All output in this guide is representative, not a recorded run; simulator commands and timing can differ.

## Topology

```diagram
{"type": "topology", "title": "Lab 21 — Shared transit and a separate direct link", "caption": "R1 and R3 have client LANs, a shared transit through SW1, and an independent direct link.", "nodes": [{"id": "A", "kind": "pc", "label": "PC-A", "x": 0.5, "y": 1}, {"id": "R1", "kind": "router", "label": "R1", "x": 3.5, "y": 1}, {"id": "SW", "kind": "switch", "label": "SW1", "sub": "10.0.123.0/24", "x": 7, "y": 1}, {"id": "R2", "kind": "router", "label": "R2", "x": 11, "y": 1}, {"id": "R3", "kind": "router", "label": "R3", "x": 7, "y": 5}, {"id": "B", "kind": "pc", "label": "PC-B", "x": 11, "y": 5}], "links": [{"from": "A", "to": "R1", "toLabel": "Gi0/2"}, {"from": "R1", "to": "SW", "fromLabel": "Gi0/0", "toLabel": "Fa0/1"}, {"from": "R2", "to": "SW", "fromLabel": "Gi0/0", "toLabel": "Fa0/2"}, {"from": "R3", "to": "SW", "fromLabel": "Gi0/0", "toLabel": "Fa0/3"}, {"from": "R1", "to": "R3", "label": "Gi0/1 to Gi0/1"}, {"from": "R3", "to": "B", "fromLabel": "Gi0/2"}]}
```

| Device/interface | IPv4 address/prefix | Connection or gateway |
|---|---|---|
| R1 Gi0/0 | 10.0.123.1/24 | SW1 Fa0/1 |
| R2 Gi0/0 | 10.0.123.2/24 | SW1 Fa0/2 |
| R3 Gi0/0 | 10.0.123.3/24 | SW1 Fa0/3 |
| R1 Gi0/1 | 10.0.13.1/30 | R3 Gi0/1 |
| R3 Gi0/1 | 10.0.13.2/30 | R1 Gi0/1 |
| R1 Gi0/2 | 192.168.10.1/24 | PC-A FastEthernet0 |
| R3 Gi0/2 | 192.168.30.1/24 | PC-B FastEthernet0 |
| PC-A | 192.168.10.10/24 | Gateway 192.168.10.1 |
| PC-B | 192.168.30.10/24 | Gateway 192.168.30.1 |

The switch needs no management IP for this lab. There is no simulated Internet destination and no default route is needed: OSPF will carry both specific client prefixes. Shared-interface costs will be 10, direct-link costs 25, and client-LAN costs 1, in both directions.

### Prediction and observation sheet

Before each relevant step, fill the prediction column. Record actual results only after the device has converged; keep the prediction even if it was wrong.

| Checkpoint | Predict | Record actual evidence |
|---|---|---|
| Sequential shared startup | DR, BDR and DROTHER; reason | Each shared interface role and neighbor RID |
| Both paths healthy | R1-to-LAN-30 and R3-to-LAN-10 next hop, interface and cost | Both route entries and PC pings |
| R3 priority raised | Whether existing roles change | Priority and operational role separately |
| R1 shared link shut | Successor DR/BDR and both route costs | Roles, route entries and client result before restoration |
| R1 restored | Existing election versus preferred path | Roles and both route costs |
| Direct timers mismatched | Direct adjacency and client reachability | Both effective timer pairs, neighbors and selected route |

Calculate every path from the router whose route table you are predicting. Add outgoing costs along that path, including the destination LAN; do not add the receiving interface's cost.

## Step 1: Cable and address the devices

Cable exactly as shown. Set each PC under Desktop > IP Configuration to the static address, mask 255.255.255.0, and gateway in the table; DNS is not needed. Decline the initial router setup dialog if it appears. Configure SW1 and all router addresses below. The shared interfaces deliberately remain shut until the election steps.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface range fastethernet0/1 - 3
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 1
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
```

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.123.1 255.255.255.0
R1(config-if)# shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.0.13.1 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/2
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# end
R1# show ip interface brief
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.0.123.2 255.255.255.0
R2(config-if)# shutdown
R2(config-if)# exit
R2(config)# end
R2# show ip interface brief
```

```ios R3
Router> enable
Router# configure terminal
Router(config)# hostname R3
R3(config)# interface gigabitethernet0/0
R3(config-if)# ip address 10.0.123.3 255.255.255.0
R3(config-if)# shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/1
R3(config-if)# ip address 10.0.13.2 255.255.255.252
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/2
R3(config-if)# ip address 192.168.30.1 255.255.255.0
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# end
R3# show ip interface brief
```


:::expected
Each PC can ping its own gateway. R1 and R3 can ping each other on 10.0.13.1/30 and 10.0.13.2/30. Gi0/0 is administratively down on all routers. A PC-to-remote-PC ping is not expected to work yet.
:::

```state
{"status":"Cabled · shared links shut","focus":["R1","R3"],"cut":[["R1","SW"],["R2","SW"],["R3","SW"]],"flows":[{"path":["A","R1"],"back":true,"label":"PC-A pings 192.168.10.1"},{"path":["B","R3"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 192.168.30.1"},{"path":["R1","R3"],"back":true,"label":"R1 pings 10.0.13.2"}],"chips":[{"node":"R1","text":"Gi0/0 shut"},{"node":"R2","text":"Gi0/0 shut"},{"node":"R3","text":"Gi0/0 shut"}],"rows":[["PCs → own gateway","Replies","ok"],["R1 ↔ R3 direct /30","10.0.13.1 ↔ 10.0.13.2","ok"],["Gi0/0, all routers","Administratively down","dim"],["PC-A → PC-B","Not expected yet","dim"]]}
```

## Step 2: Start R1 first and establish its DR role

Configure only R1 now. Wait until its shared interface reports State DR, normally after the initial wait interval (40 seconds with these defaults), before starting R2 or R3. Verify rather than relying on wall-clock timing.

```ios R1
R1# configure terminal
R1(config)# router ospf 10
R1(config-router)# router-id 1.1.1.1
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gigabitethernet0/0
R1(config-router)# no passive-interface gigabitethernet0/1
R1(config-router)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip ospf 10 area 0
R1(config-if)# ip ospf cost 10
R1(config-if)# ip ospf priority 100
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip ospf 10 area 0
R1(config-if)# ip ospf network point-to-point
R1(config-if)# ip ospf cost 25
R1(config-if)# exit
R1(config)# interface gigabitethernet0/2
R1(config-if)# ip ospf 10 area 0
R1(config-if)# ip ospf cost 1
R1(config-if)# exit
R1(config)# end
R1# show ip ospf interface gigabitethernet0/0
R1# show ip ospf neighbor
```


:::expected
R1 has RID 1.1.1.1 and process 10. Gi0/0 is broadcast, cost 10, priority 100, and DR after the wait. There is no neighbor yet. Gi0/1 is point-to-point; Gi0/2 is OSPF-enabled but passive.
:::

```state
{"status":"R1 alone becomes DR","tone":"ok","focus":["R1"],"wake":["R1"],"cut":[["R2","SW"],["R3","SW"]],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Gi0/0 up · State DR after the wait"}}],"roles":[{"node":"R1","peer":"SW","text":"DR","tone":"accent","from":0},{"node":"R1","peer":"R3","text":"P2P"},{"node":"R1","peer":"A","text":"passive"}],"chips":[{"node":"R1","text":"RID 1.1.1.1 · process 10"},{"node":"R2","text":"Gi0/0 shut"},{"node":"R3","text":"Gi0/0 shut"}],"rows":[["Gi0/0","Broadcast · cost 10 · priority 100"],["Gi0/0 state","DR after the wait interval","ok"],["Neighbors","None yet","dim"],["Gi0/1 · Gi0/2","Point-to-point · passive"]]}
```

## Step 3: Add R2 and R3

Before running the next blocks, write how the startup order and R3 priority zero affect the election. Do not treat the three router IDs as if this were a fresh simultaneous election.

Run R2 first and wait until it is Full with R1 and its interface shows BDR. Then run R3. Different local process numbers are intentional.

```ios R2
R2# configure terminal
R2(config)# router ospf 20
R2(config-router)# router-id 2.2.2.2
R2(config-router)# passive-interface default
R2(config-router)# no passive-interface gigabitethernet0/0
R2(config-router)# exit
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip ospf 20 area 0
R2(config-if)# ip ospf cost 10
R2(config-if)# ip ospf priority 50
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# end
R2# show ip ospf interface gigabitethernet0/0
R2# show ip ospf neighbor
```

```ios R3
R3# configure terminal
R3(config)# router ospf 30
R3(config-router)# router-id 3.3.3.3
R3(config-router)# passive-interface default
R3(config-router)# no passive-interface gigabitethernet0/0
R3(config-router)# no passive-interface gigabitethernet0/1
R3(config-router)# exit
R3(config)# interface gigabitethernet0/0
R3(config-if)# ip ospf 30 area 0
R3(config-if)# ip ospf cost 10
R3(config-if)# ip ospf priority 0
R3(config-if)# no shutdown
R3(config-if)# exit
R3(config)# interface gigabitethernet0/1
R3(config-if)# ip ospf 30 area 0
R3(config-if)# ip ospf network point-to-point
R3(config-if)# ip ospf cost 25
R3(config-if)# exit
R3(config)# interface gigabitethernet0/2
R3(config-if)# ip ospf 30 area 0
R3(config-if)# ip ospf cost 1
R3(config-if)# exit
R3(config)# end
R3# show ip ospf interface gigabitethernet0/0
R3# show ip ospf neighbor
```


:::expected
R1 remains DR, R2 becomes BDR, and R3 is DROTHER on Gi0/0. R1 sees R2 as FULL/BDR and R3 as FULL/DROTHER on Gi0/0, plus R3 as FULL/ - on Gi0/1. R3 sees R1 as FULL/DR and R2 as FULL/BDR on the shared link. Process 10, 20, and 30 do not have to match.
:::

```state
{"status":"R1 DR · R2 BDR · R3 DROTHER","tone":"ok","focus":["R2","R3"],"wake":["R2","R3"],"flows":[{"event":["R2"],"wait":1.2,"tags":{"R2":"Full with R1 · Gi0/0 BDR"}},{"event":["R1","R3"],"tags":{"R3":"Priority 0 · DROTHER","R1":"Stays DR · R3 FULL/ - on Gi0/1"}}],"roles":[{"node":"R1","peer":"SW","text":"DR","tone":"accent"},{"node":"R2","peer":"SW","text":"BDR","tone":"ok","from":0},{"node":"R3","peer":"SW","text":"DROTHER","from":1},{"node":"R1","peer":"R3","text":"P2P"},{"node":"R3","peer":"R1","text":"P2P","from":1},{"node":"R1","peer":"A","text":"passive"},{"node":"R3","peer":"B","text":"passive","from":1}],"chips":[{"node":"R1","text":"RID 1.1.1.1 · pri 100"},{"node":"R2","text":"RID 2.2.2.2 · pri 50"},{"node":"R3","text":"RID 3.3.3.3 · pri 0"}],"rows":[["R1 sees on Gi0/0","R2 FULL/BDR · R3 FULL/DROTHER","ok"],["R1 sees on Gi0/1","R3 FULL/ -","ok"],["R3 sees on Gi0/0","R1 FULL/DR · R2 FULL/BDR","ok"],["Process IDs","10 · 20 · 30 need not match"]]}
```

## Step 4: Prove the client routes and their metrics

Calculate both candidate path totals in each direction before running the commands. The solution after the checks lets you compare your arithmetic with the intended result.

On R1 and R3, inspect routes and the database. Then open each PC Desktop > Command Prompt and ping the remote PC. Repeat once if initial ARP resolution causes a lost first echo.

```ios R1
R1# show ip route ospf
R1# show ip ospf database
R1# ping 192.168.30.1 source 192.168.10.1
```

```ios R3
R3# show ip route ospf
R3# ping 192.168.10.1 source 192.168.30.1
```

If the simulator rejects the one-line source option, use the corresponding PC ping below; those packets already have the client-LAN source.
```text
ping 192.168.30.10
```
Run that command on PC-A. On PC-B run:
```text
ping 192.168.10.10
```


:::solution
R1 learns 192.168.30.0/24 [110/11] via 10.0.123.3, Gi0/0. R3 learns 192.168.10.0/24 [110/11] via 10.0.123.1, Gi0/0. Each metric is outgoing shared cost 10 plus remote LAN cost 1. Both PC pings succeed after convergence; connected local LANs appear as C, not O.
:::

```state
{"status":"Two candidate paths each way","focus":["R1","R3"],"roles":[{"node":"R1","peer":"SW","text":"DR","tone":"accent"},{"node":"R2","peer":"SW","text":"BDR","tone":"ok"},{"node":"R3","peer":"SW","text":"DROTHER"},{"node":"R1","peer":"R3","text":"P2P"},{"node":"R3","peer":"R1","text":"P2P"}],"rows":[["Outgoing costs","Shared 10 · direct 25 · client LAN 1"],["Candidates","Via SW1 shared segment · via direct Gi0/1"],["Add","Outgoing costs, incl. destination LAN"],["Predict","R1 → LAN 30 · R3 → LAN 10"]]}
```

## Step 5: Test a higher priority without restarting anything

Raise R3 shared-interface priority while R1 and R2 are healthy. Do not clear a process or bounce a link.

```ios R3
R3# configure terminal
R3(config)# interface gigabitethernet0/0
R3(config-if)# ip ospf priority 200
R3(config-if)# end
R3# show ip ospf interface gigabitethernet0/0
```


:::expected
R3 now has configured priority 200 but remains DROTHER. R1 remains DR and R2 BDR. This proves non-preemption; changing priority alone does not reset existing roles.
:::

```state
{"status":"R3 priority 200 · no preempt","tone":"warn","focus":["R3"],"flows":[{"event":["R3"],"wait":1.2,"tags":{"R3":"Priority 0 → 200 · still DROTHER"}}],"roles":[{"node":"R1","peer":"SW","text":"DR","tone":"accent"},{"node":"R2","peer":"SW","text":"BDR","tone":"ok"},{"node":"R3","peer":"SW","text":"DROTHER"},{"node":"R1","peer":"R3","text":"P2P"},{"node":"R3","peer":"R1","text":"P2P"}],"chips":[{"node":"R1","text":"pri 100"},{"node":"R2","text":"pri 50"},{"node":"R3","text":"pri 0","until":0},{"node":"R3","text":"pri 200","tone":"warn","from":0}],"rows":[["R3 configured priority","200","warn"],["R3 role","Still DROTHER"],["R1 · R2","Still DR · BDR","ok"],["Proves","Election is non-preemptive"]]}
```

## Step 6: Remove the preferred transit and observe failover

Predict the two route metrics and the surviving election before shutdown. Leave this fault in place while recording all three routers; the following step is a separate recovery.

On R1 only, shut the shared transit. Keep the direct link and both PC LANs up. Observe before restoring it.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# shutdown
R1(config-if)# end
R1# show ip ospf neighbor
R1# show ip route ospf
```

```ios R2
R2# show ip ospf interface gigabitethernet0/0
```

```ios R3
R3# show ip ospf interface gigabitethernet0/0
R3# show ip route ospf
```


:::expected
After loss is detected, R2 is promoted from BDR to DR and R3 becomes BDR. R1 still has a Full point-to-point adjacency to R3. R1 reaches LAN 30 via 10.0.13.2, Gi0/1, at cost 25 + 1 = 26; R3 reaches LAN 10 via 10.0.13.1 at cost 26. PC traffic may lose packets during convergence, then recover. Do not assume an exact duration.
:::

```state
{"status":"Shared transit lost at R1","tone":"warn","focus":["R1","R2","R3"],"cut":[["R1","SW"]],"flows":[{"event":["R1","R2","R3"],"wait":1.2,"tags":{"R1":"Gi0/0 down · R3 still FULL/ - on Gi0/1","R2":"BDR → DR","R3":"DROTHER → BDR"}},{"path":["A","R1","R3","B"],"back":true,"label":"PC traffic after convergence","tags":{"R1":"LAN 30 via 10.0.13.2 · cost 26"},"backTags":{"R3":"LAN 10 via 10.0.13.1 · cost 26"}}],"roles":[{"node":"R2","peer":"SW","text":"BDR","tone":"ok","until":0},{"node":"R2","peer":"SW","text":"DR","tone":"accent","from":0},{"node":"R3","peer":"SW","text":"DROTHER","until":0},{"node":"R3","peer":"SW","text":"BDR","tone":"ok","from":0},{"node":"R1","peer":"R3","text":"P2P"},{"node":"R3","peer":"R1","text":"P2P"}],"chips":[{"node":"R1","text":"Gi0/0 shutdown","tone":"warn"}],"rows":[["Shared segment","R2 DR · R3 BDR"],["R1 → LAN 30","via 10.0.13.2, Gi0/1 · 25 + 1 = 26","warn"],["R3 → LAN 10","via 10.0.13.1 · 26","warn"],["PC traffic","May drop in convergence, then recovers","warn"]]}
```

## Step 7: Restore transit and inspect the surviving election

Restore R1 Gi0/0. Check both shared interface roles and client routes.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip ospf interface gigabitethernet0/0
R1# show ip route ospf
```

```ios R3
R3# show ip ospf interface gigabitethernet0/0
```


:::expected
R2 remains DR and R3 BDR. Returning R1 is DROTHER; a return does not erase existing roles. R1 and R3 resume the cost-11 shared path after convergence. Save these roles in your notes, not as a promise about roles after a future cold restart.
:::

```state
{"status":"R1 returns as DROTHER","tone":"ok","focus":["R1"],"wake":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Gi0/0 up · rejoins as DROTHER"}},{"event":["R1","R3"],"tags":{"R1":"LAN 30 via 10.0.123.3 · cost 11","R3":"LAN 10 via 10.0.123.1 · cost 11"}}],"roles":[{"node":"R1","peer":"SW","text":"DROTHER","from":0},{"node":"R2","peer":"SW","text":"DR","tone":"accent"},{"node":"R3","peer":"SW","text":"BDR","tone":"ok"},{"node":"R1","peer":"R3","text":"P2P"},{"node":"R3","peer":"R1","text":"P2P"}],"rows":[["Shared roles","R2 DR · R3 BDR · R1 DROTHER"],["R1 → LAN 30","Cost 11 shared path again","ok"],["R3 → LAN 10","Cost 11 shared path again","ok"],["Returning R1","Does not reclaim DR"]]}
```

## Step 8: Introduce a timer mismatch on the direct link

Change both timer values on R1 Gi0/1 only, leaving R3 at its defaults. Wait for the adjacency to disappear and compare both ends. The shared link remains available.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip ospf hello-interval 5
R1(config-if)# ip ospf dead-interval 20
R1(config-if)# end
R1# show ip ospf interface gigabitethernet0/1
R1# show ip ospf neighbor
```

```ios R3
R3# show ip ospf interface gigabitethernet0/1
R3# show ip ospf neighbor
```


:::expected
The direct adjacency cannot remain healthy with R1 at 5/20 and R3 at 10/40. R1 and R3 can still exchange routes over the shared segment, so client ping success alone can hide this failed backup adjacency. No process-ID or priority change would fix the timer mismatch.
:::

```state
{"status":"Direct timers mismatched","tone":"bad","focus":["R1","R3"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Gi0/1 Hello 5 · dead 20"}},{"event":["R1","R3"],"tags":{"R1":"Direct adjacency disappears","R3":"Gi0/1 still Hello 10 · dead 40"}},{"path":["A","R1","SW","R3","B"],"back":true,"label":"Client ping can still succeed","tags":{"R1":"LAN 30 via 10.0.123.3 · cost 11"}}],"roles":[{"node":"R1","peer":"SW","text":"DROTHER"},{"node":"R2","peer":"SW","text":"DR","tone":"accent"},{"node":"R3","peer":"SW","text":"BDR","tone":"ok"},{"node":"R1","peer":"R3","text":"P2P","until":0},{"node":"R1","peer":"R3","text":"P2P · 5/20","tone":"bad","from":0},{"node":"R3","peer":"R1","text":"P2P","until":0},{"node":"R3","peer":"R1","text":"P2P · 10/40","from":0}],"rows":[["R1 Gi0/1","Hello 5 · dead 20","bad"],["R3 Gi0/1","Hello 10 · dead 40"],["Direct adjacency","Disappears","bad"],["Client pings","Can still succeed via shared","warn"]]}
```

## Step 9: Restore the timers and save the working network

Remove only the deliberate timer overrides. Verify the direct neighbor returns and both client pings work before saving each device.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# no ip ospf hello-interval
R1(config-if)# no ip ospf dead-interval
R1(config-if)# end
R1# show ip ospf interface gigabitethernet0/1
R1# show ip ospf neighbor
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

Accept the default destination filename when asked, then save the Packet Tracer project file.

:::expected
Both direct interfaces use 10/40 and the point-to-point adjacency is Full. R2/R3 may retain DR/BDR on the shared segment. The saved priorities are R1 100, R2 50, R3 200; those preferences do not retroactively alter the current election.
:::

```state
{"status":"Timers restored · saved","tone":"ok","focus":["R1","R3"],"flows":[{"event":["R1","R3"],"wait":1.2,"tags":{"R1":"Gi0/1 back to 10/40 · R3 FULL/ -"}},{"path":["A","R1","SW","R3","B"],"back":true,"label":"Client pings work"}],"roles":[{"node":"R1","peer":"SW","text":"DROTHER"},{"node":"R2","peer":"SW","text":"DR","tone":"accent"},{"node":"R3","peer":"SW","text":"BDR","tone":"ok"},{"node":"R1","peer":"R3","text":"P2P · 5/20","tone":"bad","until":0},{"node":"R1","peer":"R3","text":"P2P","from":0},{"node":"R3","peer":"R1","text":"P2P · 10/40","until":0},{"node":"R3","peer":"R1","text":"P2P","from":0}],"rows":[["Direct link","10/40 both ends · Full","ok"],["Client pings","Both work","ok"],["Saved priorities","R1 100 · R2 50 · R3 200"],["Saved","All four devices · project file","ok"]]}
```

## Troubleshooting

- No shared neighbor: check SW1 access VLAN 1, the three /24 addresses, shutdown state, area 0, and passive exceptions.
- Direct neighbor absent: compare /30 addresses, point-to-point settings, timers, and interface activation on both ends.
- Full neighbors but no remote LAN: verify Gi0/2 is up, has its correct /24 address, and is activated in the local OSPF process. Passive is intended there.
- A wrong metric: check explicit interface costs and calculate from the router issuing the command. Incoming interface cost is not added.
- A ping fails: inspect the source PC's mask/gateway and the return route. Initial ARP loss is different from repeated failure after convergence.

## Challenge

Work in a copy of the restored lab. Add PC-C using its FastEthernet0 directly to **R2 Gi0/2**, which was unused. Use a copper crossover cable or Packet Tracer's auto-connect. The new LAN must use the **third /26, counting from 1**, inside `192.168.20.0/24`. Assign the router the first usable address and the PC the tenth usable address. Keep this client interface passive, advertise it in R2's existing area-0 process, and set its outgoing OSPF cost to **5**. Do not change any existing interface address, area, or router ID.

Before commands, write the subnet/mask, host/gateway addresses, chosen activation command, and R1/R3 route cost and next hop to the new LAN. Implement your plan and verify PC-C can reach PC-A and PC-B, with replies returning to PC-C. Record routes on all three routers and confirm the client-facing interface is passive.

Then, as an independent directional-cost test, change only R1's shared outgoing cost to **40**. Predict R1's route to LAN 30 and R3's reverse route to LAN 10 before applying the change. Collect both route entries and PC tests while the change is present. Restore R1 shared cost **10** in a separate recovery action and verify again. Save the extended lab as a new file so the original baseline remains available.

:::solution
The /26s begin at .0, .64, .128 and .192. The third is `192.168.20.128/26`, mask `255.255.255.192`; R2 is `.129`, PC-C is `.138`, and PC-C's gateway is `.129`. All are usable in .129 through .190.

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/2
R2(config-if)# ip address 192.168.20.129 255.255.255.192
R2(config-if)# ip ospf 20 area 0
R2(config-if)# ip ospf cost 5
R2(config-if)# no shutdown
R2(config-if)# end
R2# show ip ospf interface gigabitethernet0/2
R2# show ip route ospf
```

The process already has `passive-interface default` and only Gi0/0 is an exception, so the new client interface is passive. Both R1 and R3 should learn `192.168.20.128/26` at cost `10 + 5 = 15` through `10.0.123.2`, Gi0/0. R2 reaches LAN 10 and LAN 30 at cost `10 + 1 = 11` through their respective shared neighbors. The new PC must have the planned address and gateway; a router-originated test alone would not verify those fields.

On PC-C:

```text
ping 192.168.20.129
ping 192.168.10.10
ping 192.168.30.10
```

On PC-A and PC-B, separately:

```text
ping 192.168.20.138
```

For the directional test:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip ospf cost 40
R1(config-if)# end
R1# show ip route ospf
```

R1 chooses direct cost `25 + 1 = 26` to LAN 30 instead of shared cost `40 + 1 = 41`. R3 still chooses shared cost `10 + 1 = 11` to LAN 10. R1 can also reach the new R2 LAN through R3 at `25 + 10 + 5 = 40`, which is cheaper than its now-direct shared choice `40 + 5 = 45`; this is a further reason to read the complete table. R3's path to the new LAN remains 15. Changing one outgoing cost can affect several prefixes, but does not change the reverse direction's configured cost.

Collect both R1 and R3 route displays and endpoint tests before recovery. Then restore only the changed cost:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip ospf cost 10
R1(config-if)# end
R1# show ip route ospf
```

R1/R3 client routes return to 11 and their new-LAN routes to 15. Verify all three PCs, save each router's configuration, and retain the extended project separately. Election roles may remain those established by the earlier failure; path costs do not reset DR/BDR.
:::
