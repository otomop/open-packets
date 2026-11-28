---
title: Read, predict and verify an IPv4 forwarding decision
environment: mixed
devices: ["2 × ISR 2911 routers (R1 and R2)", "2 × PCs (PC-A and PC-B)", "Paper route-selection worksheets"]
minutes: 70
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build two routers and two PCs, then predict which route each packet uses before you send it. You read connected and local entries, watch a more-specific route override a working /24, and add a default route. The static-route commands are supplied for you to type; Chapter 18 teaches how to design them. Steps 4, 8 and 9 are paper exercises on overlapping prefixes, administrative distance and ECMP, so you do not need OSPF yet.

Packet Tracer runs every device step. If your version lacks `show ip cef`, read the full `show ip route` instead and note that you skipped the CEF check.

## Topology

| Link or device | Address |
|---|---|
| R1 Gi0/0 ↔ R2 Gi0/0 | R1 `10.0.12.1/30`; R2 `10.0.12.2/30` |
| R1 Gi0/1 ↔ PC-A FastEthernet0 | R1 `192.0.2.1/24`; PC-A `192.0.2.10/24`, gateway `192.0.2.1` |
| R2 Gi0/1 ↔ PC-B FastEthernet0 | R2 `198.51.100.1/24`; PC-B `198.51.100.200/24`, gateway `198.51.100.1` |
| R2 Loopback0 | `203.0.113.9/32`, test destination |

Use Packet Tracer's automatic cable selection or copper crossover cables; there is no switch. A loopback is a logical interface inside the router that is always up. R2's loopback gives the default-route test in Step 7 a real destination.

```diagram
{"type":"topology","title":"A route in each direction","caption":"R1 and R2 need routes to the opposite PC's subnet. The R2 loopback is used later to test a default.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.0.2.10/24","x":1,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"10.0.12.1/30","x":4,"y":3},{"id":"R2","kind":"router","label":"R2","sub":"10.0.12.2/30","x":8,"y":3},{"id":"B","kind":"pc","label":"PC-B","sub":"198.51.100.200/24","x":11,"y":3}],"links":[{"from":"A","to":"R1","toLabel":"Gi0/1"},{"from":"R1","to":"R2","fromLabel":"Gi0/0","toLabel":"Gi0/0","accent":true},{"from":"R2","to":"B","fromLabel":"Gi0/1"}]}
```

## Step 1: Build and address the network

Add the devices and configure both routers. Do not configure a routing protocol. The loopback needs no `no shutdown`; it comes up when you create it.

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

Set each PC's static address, mask and gateway using Desktop → IP Configuration. Ping each PC's own gateway, and ping `10.0.12.2` from R1. The first ping can lose a packet while ARP resolves; repeat it.

:::expected
The four Ethernet interfaces are up/up. Each PC reaches its own gateway and R1 reaches `10.0.12.2`. PC-A cannot reach PC-B yet, because neither router has a route to the other LAN.
:::

```state
{"status":"Addressed · local pings work","tone":"ok","cabled":true,"addressed":true,"focus":["R1","R2"],"flows":[{"path":["A","R1"],"back":true,"label":"PC-A pings its gateway 192.0.2.1","tags":{"A":"ping 192.0.2.1 · own gateway"}},{"path":["B","R2"],"back":true,"with":true,"tone":"alt","label":"PC-B pings its gateway 198.51.100.1","tags":{"B":"ping 198.51.100.1 · own gateway"}},{"path":["R1","R2"],"back":true,"label":"R1 pings R2's transit address 10.0.12.2","tags":{"R1":"ping 10.0.12.2"}}],"chips":[{"node":"R2","text":"Lo0 203.0.113.9/32"}],"rows":[["Ethernet interfaces","Up/up","ok"],["Each PC to its gateway","Replies","ok"],["R1 to 10.0.12.2","Replies","ok"],["PC-A to PC-B","Not yet · no remote routes","dim"]]}
```

## Step 2: Identify connected and local entries

Run `show ip route` on both routers. On R1, find the connected `192.0.2.0/24` and local `192.0.2.1/32` entries and note their codes and interfaces. Then run `show ip route 192.0.2.1` and `show ip route 192.0.2.10` and compare which entry each address matches.

:::expected
R1's own address `192.0.2.1` matches the `L` /32, and PC-A's address matches the `C` /24. Each router has only `C` and `L` entries so far. The `is variably subnetted` lines are headings, not routes. R2's /32 loopback normally shows one `C` line instead of a `C` and `L` pair.
:::

```state
{"status":"Connected and local entries","focus":["R1"],"chips":[{"node":"R1","text":"C 192.0.2.0/24 · L 192.0.2.1/32"},{"node":"R2","text":"Lo0 203.0.113.9/32"}],"rows":[["192.0.2.1","Matches L /32 · R1 itself"],["192.0.2.10 · PC-A","Matches C /24 · Gi0/1"],["Grouping heading","Not another route"],["R2 Lo0 /32","May not show the C/L pair","dim"]]}
```

## Step 3: Install the supplied bidirectional baseline

A static route has the form `ip route NETWORK MASK NEXT-HOP`: the remote network, its mask, and the neighboring router to send to. R1 needs a route to PC-B's LAN through R2. R2 needs a route back to PC-A's LAN through R1, or PC-B's replies are dropped at R2.

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

From PC-A, ping `198.51.100.200`. From PC-B, ping `192.0.2.10`. On each router, note the prefix, the bracketed numbers, the next hop and the outgoing interface used to reach the opposite host.

:::expected
Each router shows an `S` route to the opposite LAN with `[1/0]`: administrative distance 1, metric 0. Both pings succeed; the first may lose a packet to ARP.
:::

```state
{"status":"Routes in both directions","tone":"ok","focus":["R1","R2"],"flows":[{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings 198.51.100.200","tags":{"R1":"S 198.51.100.0/24 via 10.0.12.2","R2":"C 198.51.100.0/24 · Gi0/1"},"backTags":{"R2":"S 192.0.2.0/24 via 10.0.12.1","R1":"C 192.0.2.0/24 · Gi0/1"}},{"path":["B","R2","R1","A"],"back":true,"label":"PC-B pings 192.0.2.10"}],"rows":[["R1 to PC-B's LAN","S /24 [1/0] via 10.0.12.2 · Gi0/0"],["R2 to PC-A's LAN","S /24 [1/0] via 10.0.12.1 · Gi0/0"],["PC-A ↔ PC-B","Both pings succeed","ok"],["Route on R1 only","No working reply path","dim"]]}
```

## Step 4: Predict overlapping-prefix lookups

This is a paper exercise; type nothing on the routers. A router has these four routes installed:

| Installed route | Next hop |
|---|---|
| `S 172.16.32.0/19 [1/0]` | `10.0.0.2` |
| `O 172.16.40.0/21 [110/20]` | `10.0.0.3` |
| `O 172.16.44.0/23 [110/30]` | `10.0.0.4` |
| `S 172.16.44.128/25 [200/0]` | `10.0.0.5` |

Write the address range of each route first. Then find the next hop for `172.16.44.9`, `172.16.44.200`, `172.16.45.200` and `172.16.60.7`.

:::solution
The ranges are `172.16.32.0–172.16.63.255` for the /19, `172.16.40.0–172.16.47.255` for the /21, `172.16.44.0–172.16.45.255` for the /23 and `172.16.44.128–172.16.44.255` for the /25. The next hops are `10.0.0.4`, `10.0.0.5`, `10.0.0.4` and `10.0.0.2`, in that order. The /25 wins for `172.16.44.200` despite its AD of 200, because a packet lookup compares prefix lengths, not distances.
:::

```state
{"status":"Paper worksheet","rows":[["Configuration","None entered · Step 3 baseline"],["Worksheet routes","/19, /21, /23, /25 · all installed"],["Destinations","172.16.44.9, .44.200, .45.200, .60.7"]]}
```

## Step 5: Introduce a more-specific discard route

Now add a second, more-specific route on R1. It points to `Null0`, the discard interface from the lesson, so R1 drops every packet that matches it. Before you type it, predict which route R1 will use for PC-B (`198.51.100.200`) and for R2's LAN address (`198.51.100.1`), and whether each ping will work.

```ios R1
R1# configure terminal
R1(config)# ip route 198.51.100.128 255.255.255.128 Null0
R1(config)# end
R1# show ip route
R1# show ip route 198.51.100.200
```

From PC-A, ping `198.51.100.200` and `198.51.100.1`, and explain the different results before changing anything. If your version supports it, run `show ip cef 198.51.100.200` to see the forwarding entry R1 uses for that address.

:::expected
The /25 covers `198.51.100.128–198.51.100.255`. PC-B's `.200` is inside it, so `show ip route 198.51.100.200` reports the /25 through `Null0` and the ping fails. R2's `.1` is outside the /25, still matches the /24 and still answers. Both static routes are in the table together.
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
PC-B's address matches the /24 through `10.0.12.2` again, and all three pings work. You removed only the /25 and left the /24 alone.
:::

```state
{"status":"Discard removed","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"/25 Null0 route removed"}},{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings 198.51.100.200","tags":{"R1":".200 matches /24 via 10.0.12.2"}},{"path":["B","R2","R1","A"],"back":true,"label":"PC-B pings 192.0.2.10"}],"chips":[{"node":"R1","text":"S 198.51.100.128/25 → Null0","tone":"bad","until":0}],"rows":[["/25 Null0 route","Removed","ok"],["PC-B .200","/24 via 10.0.12.2 again","ok"],["/24 route","Kept · never removed"],["End-to-end tests","All three pings work","ok"]]}
```

## Step 7: Add and verify a default route

R2's loopback `203.0.113.9` is in neither LAN. Ping it from PC-A, then read `show ip route` on R1 and confirm that no entry contains that address. Now add a default route on R1. It is the same `ip route` command with a network and mask of all zeros:

```ios R1
R1# configure terminal
R1(config)# ip route 0.0.0.0 0.0.0.0 10.0.12.2
R1(config)# end
R1# show ip route
R1# show ip route 0.0.0.0
```

Repeat the PC-A ping. Then run `show ip route 203.0.113.9` and, if available, `show ip cef 203.0.113.9`, and compare both with the full table.

:::expected
Before the default, the ping fails and R1 answers PC-A with destination host unreachable. Afterwards the table shows `Gateway of last resort is 10.0.12.2 to network 0.0.0.0` and an `S*` entry, and the ping succeeds; R2 already has the return route to PC-A's subnet. `show ip route 203.0.113.9` typically still answers `% Network not in table`, because that command does not report the default route. Traffic to PC-B keeps using the more-specific /24.
:::

```state
{"status":"Default route via R2","tone":"ok","focus":["R1"],"flows":[{"path":["A","R1"],"label":"PC-A pings 203.0.113.9 before the default","stop":"R1","stopText":"No matching route · no default"},{"event":["R1"],"tags":{"R1":"ip route 0.0.0.0 0.0.0.0 10.0.12.2"}},{"path":["A","R1","R2"],"back":true,"label":"PC-A pings 203.0.113.9 again","tags":{"R1":"Only S* 0.0.0.0/0 matches","R2":"Local: its own Lo0 address"},"backTags":{"R2":"S 192.0.2.0/24 via 10.0.12.1"}}],"chips":[{"node":"R1","text":"S* 0.0.0.0/0 via 10.0.12.2","tone":"ok","from":1},{"node":"R2","text":"Lo0 203.0.113.9/32"}],"rows":[["R1 default","S* 0.0.0.0/0 via 10.0.12.2","ok"],["PC-A to 203.0.113.9","Replies","ok"],["Return route","R2 already has 192.0.2.0/24"],["To PC-B","More-specific /24 still used"]]}
```

## Step 8: Distinguish AD from protocol metrics

This is a paper exercise. Three sources offer a route to exactly `10.50.0.0/16`: OSPF with cost 20, RIP with hop count 2, and a static route configured with AD 130. All next hops are reachable. Write the route line that is installed, including its brackets. Then assume OSPF loses the route and write the new line.

:::solution
First `O 10.50.0.0/16 [110/20]`: OSPF has the lowest AD. Without OSPF, `R 10.50.0.0/16 [120/2]`: 120 beats 130. OSPF's cost of 20 is never compared with RIP's 2 hops. The static route is a floating static route; it is installed only after both protocols lose the prefix.
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

This is a paper exercise; your two-router topology has no second link. List the next hops R1 can use for `10.70.0.0/16`, and decide whether one file transfer to that network will run twice as fast as it would over a single link.

:::solution
R1 can use `10.0.12.2` through Gi0/0 and `10.0.13.2` through Gi0/2: two equal-cost paths to one prefix. One transfer does not run twice as fast. CEF keeps each flow on one path, so a single transfer uses one link.
:::

```state
{"status":"Paper · ECMP entry","rows":[["Worksheet entry","O 10.70.0.0/16 · two next hops"],["Your topology","One R1–R2 link · no second path"]]}
```

## Step 10: Save the corrected lab and evidence

Check the final state: R1's Null0 route is gone, each router has its route to the opposite LAN, and R1 has the default route through R2. Repeat the PC-to-PC pings and the PC-A ping to `203.0.113.9`. On each router run `copy running-config startup-config` and press Enter to accept the filename. Save the Packet Tracer project.

:::expected
All pings work and both configurations are saved. For your notes, list the five states you observed: connected routes only, static routes both ways, the /25 discard, the repaired /24, and the default route. For each, write the destination you tested, the route it matched, your prediction and the actual result. Keep the three paper exercises separate from what you observed on the devices.
:::

```state
{"status":"Corrected lab saved","tone":"ok","focus":["R1","R2"],"flows":[{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings 198.51.100.200","tags":{"R1":"S 198.51.100.0/24 via 10.0.12.2"},"backTags":{"R2":"S 192.0.2.0/24 via 10.0.12.1"}},{"path":["A","R1","R2"],"back":true,"label":"PC-A pings 203.0.113.9","tags":{"R1":"S* default via 10.0.12.2"}}],"chips":[{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"}],"rows":[["/25 Null0 route","Absent","ok"],["Remote LAN routes","On both routers","ok"],["R1 default","S* via 10.0.12.2","ok"],["Saved","Both routers · PT project","ok"]]}
```

## Troubleshooting

| Symptom | Evidence to inspect |
|---|---|
| Own gateway unreachable | PC mask and gateway, cable, router address and interface state |
| R1 reaches R2 but PC-to-PC fails | The route to the opposite LAN on each router, and each PC's gateway |
| Only `.200` fails after Step 5 | The /25 Null0 match, compared with the /24 used by `.1` |
| A configured static route is missing from the table | Typing errors in the network or mask, and whether the next hop on `10.0.12.0/30` is reachable |
| Default exists but loopback ping fails | The `S*` entry on R1, R2's Loopback0 address and R2's route back to PC-A |
| Route looks correct but the neighbor does not answer | `show ip arp` and the interface state on both routers |

## Challenge

This is a separate paper network; do not enter its routes in the two-router project. A management PC is 192.0.2.10/24 with gateway R3 at 192.0.2.1. Every listed next hop is reachable and nothing filters traffic. These are all the **installed** routes on R3:

| Prefix | Source / preference | Action |
|---|---|---|
| 192.0.2.0/24 | connected | Ethernet Gi0/1 |
| 192.0.2.1/32 | local | receive |
| 10.72.0.0/20 | static AD 1 | via 10.0.30.2 |
| 10.72.8.0/23 | OSPF AD 110 | via 10.0.31.2 |
| 10.72.9.128/26 | static AD 200 | Null0 |
| 0.0.0.0/0 | static AD 1 | via 10.0.32.2 |

Before opening the answer, write the address ranges of the /20, /23 and /26. Then state the route and action R3 uses for 192.0.2.1, 192.0.2.10, 10.72.9.130, 10.72.9.200, 10.72.12.7 and 203.0.113.25. Explain why the /20’s lower AD cannot overrule a longer match.

Then consider two **independent** changes, each starting from the table above:

1. Only the /26 discard route is removed. What does R3 now do with a packet to 10.72.9.130?
2. A ping from the management PC reaches host 10.72.9.200, but the reply arrives at a remote router that has no route and no default for 192.0.2.10. State the reply’s source and destination, and explain whether R3’s correct forward route proves that the ping works.

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

The /20 has AD 1 and the /23 has AD 110, yet the /23 wins for 10.72.9.200: AD only compares routes to the same prefix, and these are different prefixes.

After the /26 is removed, 10.72.9.130 matches the /23 and is forwarded to 10.0.31.2. Each packet is looked up in the table as it stands now.

In the return-path case, the reply has source 10.72.9.200 and destination 192.0.2.10. The remote router has no route for 192.0.2.10, so it drops the reply and the ping fails. R3’s forward route proves only the outbound half. Read the routing table on the router that dropped the reply before changing anything on R3.
:::
