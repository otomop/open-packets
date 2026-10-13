---
title: Read, predict and verify an IPv4 forwarding decision
environment: mixed
devices: ["2 × ISR 2911 routers (R1 and R2)", "2 × PCs (PC-A and PC-B)", "Paper route-selection worksheets"]
minutes: 70
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use a small routed network to compare a predicted route with actual traffic. Static commands are supplied as a baseline; Chapter 18 teaches their construction and failure behavior. Dynamic-route and ECMP examples are worksheets, so you do not need to configure OSPF before its lesson.

Packet Tracer is suitable for the core topology. Record its version and each router image. CEF and filtered display commands vary by simulator; use the full routing table where a filter is unavailable and mark any CEF interpretation that was not executed.

## Topology

| Link or device | Address |
|---|---|
| R1 Gi0/0 ↔ R2 Gi0/0 | R1 `10.0.12.1/30`; R2 `10.0.12.2/30` |
| R1 Gi0/1 ↔ PC-A FastEthernet0 | R1 `192.0.2.1/24`; PC-A `192.0.2.10/24`, gateway `192.0.2.1` |
| R2 Gi0/1 ↔ PC-B FastEthernet0 | R2 `198.51.100.1/24`; PC-B `198.51.100.200/24`, gateway `198.51.100.1` |
| R2 Loopback0 | `203.0.113.9/32`, test destination |

Use Packet Tracer's automatic cable selection or copper crossover for these direct Ethernet connections. No switch, Internet service or previous chapter project is required. A loopback is a logical router interface; its address gives the default-route test a real destination.

```diagram
{"type":"topology","title":"A route in each direction","caption":"R1 and R2 need routes to the opposite PC's subnet. The R2 loopback is used later to test a default.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.0.2.10/24","x":1,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"10.0.12.1/30","x":4,"y":3},{"id":"R2","kind":"router","label":"R2","sub":"10.0.12.2/30","x":8,"y":3},{"id":"B","kind":"pc","label":"PC-B","sub":"198.51.100.200/24","x":11,"y":3}],"links":[{"from":"A","to":"R1","toLabel":"Gi0/1"},{"from":"R1","to":"R2","fromLabel":"Gi0/0","toLabel":"Gi0/0","accent":true},{"from":"R2","to":"B","fromLabel":"Gi0/1"}]}
```

## Step 1: Build and address the network

Create fresh devices and configure both routers. Leave routing protocols disabled.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.12.1 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 192.0.2.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.0.12.2 255.255.255.252
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# interface gigabitethernet0/1
R2(config-if)# ip address 198.51.100.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# interface loopback0
R2(config-if)# ip address 203.0.113.9 255.255.255.255
R2(config-if)# end
R2# show ip interface brief
```

Set each PC's static address, mask and gateway using Desktop → IP Configuration. Ping each PC's own gateway and ping `10.0.12.2` from R1. Repeat an initial attempt if needed for address resolution.

:::expected
The connected Ethernet interfaces are up/up. Each PC reaches its own gateway and R1 reaches R2's transit address. End-to-end PC traffic is not expected yet because the routers lack routes to the opposite LAN.
:::

```state
{"status":"Addressed · local pings work","tone":"ok","cabled":true,"addressed":true,"focus":["R1","R2"],"flows":[{"path":["A","R1"],"back":true,"label":"PC-A pings its gateway 192.0.2.1","tags":{"A":"ping 192.0.2.1 · own gateway"}},{"path":["B","R2"],"back":true,"with":true,"tone":"alt","label":"PC-B pings its gateway 198.51.100.1","tags":{"B":"ping 198.51.100.1 · own gateway"}},{"path":["R1","R2"],"back":true,"label":"R1 pings R2's transit address 10.0.12.2","tags":{"R1":"ping 10.0.12.2"}}],"chips":[{"node":"R2","text":"Lo0 203.0.113.9/32"}],"rows":[["Ethernet interfaces","Up/up","ok"],["Each PC to its gateway","Replies","ok"],["R1 to 10.0.12.2","Replies","ok"],["PC-A to PC-B","Not yet · no remote routes","dim"]]}
```

## Step 2: Identify connected and local entries

Run `show ip route` on both routers. On R1, find the connected `192.0.2.0/24` and local `192.0.2.1/32` entries. Record their codes and interfaces. Inspect `show ip route 192.0.2.1` and `show ip route 192.0.2.10` where supported.

:::expected
The router's own address matches its local /32; PC-A's address matches the connected /24. A display heading that groups prefixes is not another route. R2's /32 loopback may not use the same two-line C/L pattern as an ordinary /24 Ethernet interface.
:::

```state
{"status":"Connected and local entries","focus":["R1"],"chips":[{"node":"R1","text":"C 192.0.2.0/24 · L 192.0.2.1/32"},{"node":"R2","text":"Lo0 203.0.113.9/32"}],"rows":[["192.0.2.1","Matches L /32 · R1 itself"],["192.0.2.10 · PC-A","Matches C /24 · Gi0/1"],["Grouping heading","Not another route"],["R2 Lo0 /32","May not show the C/L pair","dim"]]}
```

## Step 3: Install the supplied bidirectional baseline

These commands name the remote destination network, its mask and the neighboring router. The return route on R2 is as necessary as the forward route on R1.

```ios R1
R1# configure terminal
R1(config)# ip route 198.51.100.0 255.255.255.0 10.0.12.2
R1(config)# end
R1# show ip route
```

```ios R2
R2# configure terminal
R2(config)# ip route 192.0.2.0 255.255.255.0 10.0.12.1
R2(config)# end
R2# show ip route
```

From PC-A, ping `198.51.100.200`. From PC-B, ping `192.0.2.10`. Record each router's selected prefix, next hop and outgoing interface for the opposite host.

:::expected
Each router installs an `S` route to the opposite LAN, normally showing `[1/0]`. Both PC tests succeed once adjacency resolution completes. A route on only R1 would not establish a working reply path.
:::

```state
{"status":"Routes in both directions","tone":"ok","focus":["R1","R2"],"flows":[{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings 198.51.100.200","tags":{"R1":"S 198.51.100.0/24 via 10.0.12.2","R2":"C 198.51.100.0/24 · Gi0/1"},"backTags":{"R2":"S 192.0.2.0/24 via 10.0.12.1","R1":"C 192.0.2.0/24 · Gi0/1"}},{"path":["B","R2","R1","A"],"back":true,"label":"PC-B pings 192.0.2.10"}],"rows":[["R1 to PC-B's LAN","S /24 [1/0] via 10.0.12.2 · Gi0/0"],["R2 to PC-A's LAN","S /24 [1/0] via 10.0.12.1 · Gi0/0"],["PC-A ↔ PC-B","Both pings succeed","ok"],["Route on R1 only","No working reply path","dim"]]}
```

## Step 4: Predict overlapping-prefix lookups

Use this authored worksheet without entering configuration:

| Installed route | Next hop |
|---|---|
| `S 172.16.32.0/19 [1/0]` | `10.0.0.2` |
| `O 172.16.40.0/21 [110/20]` | `10.0.0.3` |
| `O 172.16.44.0/23 [110/30]` | `10.0.0.4` |
| `S 172.16.44.128/25 [200/0]` | `10.0.0.5` |

All listed routes are installed and their next hops are resolvable. Determine the selected next hop for `172.16.44.9`, `172.16.44.200`, `172.16.45.200` and `172.16.60.7`. Show the ranges that establish each match.

:::solution
The next hops are `10.0.0.4`, `10.0.0.5`, `10.0.0.4` and `10.0.0.2`, respectively. The /25 wins for its matching destination despite AD 200 because forwarding compares installed prefix lengths.
:::

```state
{"status":"Paper worksheet","rows":[["Configuration","None entered · Step 3 baseline"],["Worksheet routes","/19, /21, /23, /25 · all installed"],["Destinations","172.16.44.9, .44.200, .45.200, .60.7"]]}
```

## Step 5: Introduce a more-specific discard route

Before applying the supplied fault, predict the selected prefixes and outcomes for PC-B (.200) and R2’s LAN address (.1). Record both predictions, then add the controlled fault on R1:

```ios R1
R1# configure terminal
R1(config)# ip route 198.51.100.128 255.255.255.128 Null0
R1(config)# end
R1# show ip route
R1# show ip route 198.51.100.200
```

From PC-A, ping `198.51.100.200` and `198.51.100.1`. Explain the different results before changing anything. Where supported, inspect `show ip cef 198.51.100.200`.

:::expected
PC-B's `.200` matches the /25 discard route and fails. R2's LAN address `.1` lies outside that /25 and still matches the working /24. The presence of a route does not necessarily mean its action is forwarding to a live neighbor.
:::

```state
{"status":"/25 Null0 fault","tone":"bad","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"More-specific /25 discard added"}},{"path":["A","R1"],"label":"PC-A pings 198.51.100.200","stop":"R1","stopText":".200 in /25 → Null0 · dropped"},{"path":["A","R1","R2"],"back":true,"label":"PC-A pings 198.51.100.1","tags":{"R1":".1 outside /25 · uses the /24"}}],"chips":[{"node":"R1","text":"S 198.51.100.128/25 → Null0","tone":"bad","from":0}],"rows":[[".200 · PC-B","/25 → Null0 · fails","bad"],[".1 · R2 LAN","Outside /25 · /24 · works","ok"],["/25 covers","198.51.100.128–255"],["/24 via 10.0.12.2","Still installed"]]}
```

## Step 6: Remove the exact fault and retest

```ios R1
R1# configure terminal
R1(config)# no ip route 198.51.100.128 255.255.255.128 Null0
R1(config)# end
R1# show ip route 198.51.100.200
```

Repeat both PC-A pings and the reverse PC-B-to-PC-A ping.

:::expected
PC-B's address again matches the /24 through `10.0.12.2`, and the end-to-end tests work. You repaired the more-specific discard without removing the legitimate /24 route.
:::

```state
{"status":"Discard removed","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"/25 Null0 route removed"}},{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings 198.51.100.200","tags":{"R1":".200 matches /24 via 10.0.12.2"}},{"path":["B","R2","R1","A"],"back":true,"label":"PC-B pings 192.0.2.10"}],"chips":[{"node":"R1","text":"S 198.51.100.128/25 → Null0","tone":"bad","until":0}],"rows":[["/25 Null0 route","Removed","ok"],["PC-B .200","/24 via 10.0.12.2 again","ok"],["/24 route","Kept · never removed"],["End-to-end tests","All three pings work","ok"]]}
```

## Step 7: Add and verify a default route

Write the request source/destination and the route needed for its reply. Before changing R1, ping R2's loopback `203.0.113.9` from PC-A and confirm that R1 has no matching route. Add the default:

```ios R1
R1# configure terminal
R1(config)# ip route 0.0.0.0 0.0.0.0 10.0.12.2
R1(config)# end
R1# show ip route
R1# show ip route 0.0.0.0
```

Repeat the PC-A ping and inspect `show ip cef 203.0.113.9` if available. Also compare the destination-specific `show ip route 203.0.113.9` result with the full table. Its exact default-lookup display is image dependent; record what yours actually reports.

:::expected
The full table contains the `S*` default through R2, and PC-A can now reach R2's actual loopback. R2 already has the return route to PC-A's subnet. The default changes this lookup but does not replace the more-specific route to PC-B.
:::

```state
{"status":"Default route via R2","tone":"ok","focus":["R1"],"flows":[{"path":["A","R1"],"label":"PC-A pings 203.0.113.9 before the default","stop":"R1","stopText":"No matching route · no default"},{"event":["R1"],"tags":{"R1":"ip route 0.0.0.0 0.0.0.0 10.0.12.2"}},{"path":["A","R1","R2"],"back":true,"label":"PC-A pings 203.0.113.9 again","tags":{"R1":"Only S* 0.0.0.0/0 matches","R2":"Local: its own Lo0 address"},"backTags":{"R2":"S 192.0.2.0/24 via 10.0.12.1"}}],"chips":[{"node":"R1","text":"S* 0.0.0.0/0 via 10.0.12.2","tone":"ok","from":1},{"node":"R2","text":"Lo0 203.0.113.9/32"}],"rows":[["R1 default","S* 0.0.0.0/0 via 10.0.12.2","ok"],["PC-A to 203.0.113.9","Replies","ok"],["Return route","R2 already has 192.0.2.0/24"],["To PC-B","More-specific /24 still used"]]}
```

## Step 8: Distinguish AD from protocol metrics

For this paper exercise, three eligible candidates describe exactly `10.50.0.0/16`: OSPF AD 110/cost 20, RIP AD 120/hop count 2, and static AD 130. All next hops are reachable and no policy changes these preferences. Identify the installed source, then remove the OSPF candidate on paper and repeat.

:::solution
OSPF is preferred first by AD. Without OSPF, RIP is preferred over the static candidate. OSPF cost 20 is not compared numerically with RIP's two hops. The static route is selected only after the more-preferred sources disappear; actual failover also requires a working forwarding and return path.
:::

```state
{"status":"Paper · AD comparison","rows":[["Configuration","None · lab unchanged"],["Prefix","10.50.0.0/16 · three sources"],["Candidates","OSPF 110/20 · RIP 120/2 · static 130"],["Second pass","OSPF candidate removed on paper"]]}
```

## Step 9: Interpret two equal-cost next hops

Read this representative entry:

```output Authored ECMP worksheet
O    10.70.0.0/16 [110/20] via 10.0.12.2, 00:00:30, GigabitEthernet0/0
                [110/20] via 10.0.13.2, 00:00:30, GigabitEthernet0/2
```

List the available paths and decide whether the output proves that one file transfer will run twice as fast. This is a supplied example, not a claim that your two-router topology has a second link.

:::solution
Both next hops are installed for the same prefix at equal cost. The output does not establish a 50/50 byte split, packet-by-packet alternation or doubled throughput for one flow. Hashing behavior and path limits depend on the device and configuration.
:::

```state
{"status":"Paper · ECMP entry","rows":[["Worksheet entry","O 10.70.0.0/16 · two next hops"],["Your topology","One R1–R2 link · no second path"]]}
```

## Step 10: Save the corrected lab and evidence

Confirm that R1's temporary Null0 route is absent, both remote LAN routes are present and the default points from R1 to R2. Repeat PC-to-PC traffic and the PC-A-to-loopback test. On each router run `copy running-config startup-config` and accept the filename with Enter. Save the Packet Tracer project.

:::expected
The saved network has working bidirectional LAN routing and a default on R1. Your worksheet separately records the overlapping-prefix, AD and ECMP exercises. Record unsupported CEF commands as unexecuted rather than treating written answers as device verification. Submit a five-state evidence table: connected-only, bidirectional baseline, active /25 discard fault, repaired /24, and added default. For each tested destination record the selected prefix/action, source address, predicted result and actual result. Keep the three closed-answer worksheets separate from observed device evidence.
:::

```state
{"status":"Corrected lab saved","tone":"ok","focus":["R1","R2"],"flows":[{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings 198.51.100.200","tags":{"R1":"S 198.51.100.0/24 via 10.0.12.2"},"backTags":{"R2":"S 192.0.2.0/24 via 10.0.12.1"}},{"path":["A","R1","R2"],"back":true,"label":"PC-A pings 203.0.113.9","tags":{"R1":"S* default via 10.0.12.2"}}],"chips":[{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"}],"rows":[["/25 Null0 route","Absent","ok"],["Remote LAN routes","On both routers","ok"],["R1 default","S* via 10.0.12.2","ok"],["Saved","Both routers · PT project","ok"]]}
```

## Troubleshooting

| Symptom | Evidence to inspect |
|---|---|
| Own gateway unreachable | PC mask/gateway, cable, router address and interface state |
| R1 reaches R2 but PC-to-PC fails | Routes to both LANs and the hosts' gateways; a transit ping exercises different addresses |
| Only `.200` fails after Step 5 | The /25 Null0 match, compared with the /24 used by `.1` |
| A configured static route is missing from the table | Destination/mask, next-hop resolution and a preferred route for the same prefix |
| Default exists but loopback ping fails | Selected forwarding entry, R2 loopback state and route back to PC-A |
| Route looks correct but neighbor traffic fails | ARP/adjacency, interface state and any unexpected filtering |

## Challenge

Use this independent paper network. Do not enter its routes in the two-router project. A management PC is 192.0.2.10/24 with gateway R3 192.0.2.1. Every listed next hop is reachable and no filtering or policy routing applies. These are all relevant **installed** R3 entries:

| Prefix | Source / preference | Action |
|---|---|---|
| 192.0.2.0/24 | connected | Ethernet Gi0/1 |
| 192.0.2.1/32 | local | receive |
| 10.72.0.0/20 | static AD 1 | via 10.0.30.2 |
| 10.72.8.0/23 | OSPF AD 110 | via 10.0.31.2 |
| 10.72.9.128/26 | static AD 200 | Null0 |
| 0.0.0.0/0 | static AD 1 | via 10.0.32.2 |

Before opening the answer, produce a destination/action table for 192.0.2.1, 192.0.2.10, 10.72.9.130, 10.72.9.200, 10.72.12.7 and 203.0.113.25. Show the boundaries of the /20, /23 and /26. Explain why a route’s lower AD cannot overrule a longer installed match.

Then consider two **independent** changes, each starting from the table above:

1. Only the /26 discard entry is withdrawn. Determine the new action for 10.72.9.130.
2. A ping from the management PC to 10.72.9.200 reaches the remote host, but the host’s reply reaches a remote router that has no matching route or default for 192.0.2.10. State the reply’s source/destination and explain whether R3’s correct forward entry proves a working exchange.

Submit six baseline decisions, the three ranges, both changed-state explanations and the evidence you would collect before modifying any route.

:::solution
The /20 spans 10.72.0.0–10.72.15.255; the /23 spans 10.72.8.0–10.72.9.255; the /26 spans 10.72.9.128–10.72.9.191.

| Destination | Selected entry and action |
|---|---|
| 192.0.2.1 | local /32, receive at R3 |
| 192.0.2.10 | connected /24, forward toward the PC after neighbor resolution |
| 10.72.9.130 | /26, discard through Null0 |
| 10.72.9.200 | /23, via 10.0.31.2; .200 is outside the /26 |
| 10.72.12.7 | /20, via 10.0.30.2 |
| 203.0.113.25 | default /0, via 10.0.32.2 |

After withdrawing only /26, 10.72.9.130 matches the remaining /23 through 10.0.31.2. The decision is recalculated from the current installed table; the former discard does not remain effective.

In the separate return-path case, the reply is source 10.72.9.200, destination 192.0.2.10. The remote router without a matching route cannot forward it toward the requester. R3’s forward lookup alone does not prove a reply path. Inspect the full route table at the reported failure point, the relevant interface/neighbor state and a test from the original PC before proposing a change.
:::
