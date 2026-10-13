---
title: Verify primary, backup, host and default IPv4 routes
environment: packet-tracer
devices: ["2 × Cisco 2911 routers (R1, R2)", "2 × Catalyst 2960 switches (SW1, SW2)", "2 × PCs (PC-A, PC-B)"]
minutes: 80
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a new isolated Packet Tracer project. You will first observe a missing return route, then establish a working baseline, test a backup, and compare network, host and default routes. These are guided configuration and reasoning exercises, not a record of an executed simulator session. Output is representative; wording, interface displays and supported diagnostic options can vary by version. If a command is unavailable, use the stated alternative and record the limitation.

## Topology

```diagram
{"type":"topology","title":"Lab 18 — Two transit links between two routed LANs","caption":"R1 and R2 share two separate /30 transit links, and each PC reaches its router through one switch.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.168.10.11/24 · gw 192.168.10.1","x":1,"y":1},{"id":"SW1","kind":"switch","label":"SW1","x":1,"y":4},{"id":"R1","kind":"router","label":"R1","x":4,"y":4},{"id":"R2","kind":"router","label":"R2","x":8,"y":4},{"id":"SW2","kind":"switch","label":"SW2","x":11,"y":4},{"id":"B","kind":"pc","label":"PC-B","sub":"192.168.20.12/24 · gw 192.168.20.1","x":11,"y":1}],"links":[{"from":"A","to":"SW1","toLabel":"Fa0/1"},{"from":"SW1","to":"R1","fromLabel":"Fa0/24","toLabel":"Gi0/2 .1"},{"from":"R1","to":"R2","fromLabel":"Gi0/0 .1","toLabel":"Gi0/0 .2","label":"10.0.12.0/30"},{"from":"R1","to":"R2","fromLabel":"Gi0/1 .1","toLabel":"Gi0/1 .2","label":"10.0.13.0/30"},{"from":"R2","to":"SW2","fromLabel":"Gi0/2 .1","toLabel":"Fa0/24"},{"from":"SW2","to":"B","fromLabel":"Fa0/1"}]}
```

Use two 2911 routers with `GigabitEthernet0/0`, `0/1` and `0/2`. Use two 2960 switches at their default VLAN 1 settings. No trunk, management address, DHCP service, DNS server or Internet connection is required. The switches make the PC-to-router cabling unambiguous.

| Connection | Cable |
|---|---|
| PC-A FastEthernet0 — SW1 FastEthernet0/1 | Copper straight-through |
| SW1 FastEthernet0/24 — R1 GigabitEthernet0/2 | Copper straight-through |
| R1 GigabitEthernet0/0 — R2 GigabitEthernet0/0 | Copper cross-over |
| R1 GigabitEthernet0/1 — R2 GigabitEthernet0/1 | Copper cross-over |
| R2 GigabitEthernet0/2 — SW2 FastEthernet0/24 | Copper straight-through |
| SW2 FastEthernet0/1 — PC-B FastEthernet0 | Copper straight-through |

If a model uses different interface names, record the substitutions before continuing. Do not connect the two switches to one another.

| Device/interface | IPv4 address | Mask | PC gateway |
|---|---|---|---|
| R1 Gi0/0 | `10.0.12.1` | `255.255.255.252` | — |
| R2 Gi0/0 | `10.0.12.2` | `255.255.255.252` | — |
| R1 Gi0/1 | `10.0.13.1` | `255.255.255.252` | — |
| R2 Gi0/1 | `10.0.13.2` | `255.255.255.252` | — |
| R1 Gi0/2 | `192.168.10.1` | `255.255.255.0` | — |
| PC-A | `192.168.10.11` | `255.255.255.0` | `192.168.10.1` |
| R2 Gi0/2 | `192.168.20.1` | `255.255.255.0` | — |
| PC-B | `192.168.20.12` | `255.255.255.0` | `192.168.20.1` |
| R2 Loopback0, added in Step 10 | `203.0.113.8` | `255.255.255.255` | — |

A loopback is a logical router interface used here as a stable test destination. The documentation address does not represent a public Internet service.

## Step 1: Cable the project and configure R1

Place and label the devices. Set each PC's static address, mask and gateway under Desktop → IP Configuration. Leave DNS blank. On a new router, decline the initial configuration dialog if offered, then configure R1.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.12.1 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet0/1
R1(config-if)# ip address 10.0.13.1 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet0/2
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

:::expected
After switch ports finish transitioning, Gi0/2 should be up/up. The transit ports may remain down until R2 is enabled. From PC-A's Desktop → Command Prompt, run `ping 192.168.10.1`. Repeat after address resolution if the first attempt loses a reply. Resolve any local failure before adding routes.
:::

```state
{"status":"R1 LAN port up","tone":"ok","led":true,"down":["R2"],"focus":["R1"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings 192.168.10.1"}],"chips":[{"node":"R1","text":"R1#"},{"node":"R2","text":"Not configured yet"}],"rows":[["R1 Gi0/2","up/up · 192.168.10.1","ok"],["PC-A to 192.168.10.1","Ping replies","ok"],["R1 Gi0/0 and Gi0/1","May stay down until R2 is enabled","dim"]]}
```

## Step 2: Configure R2 and prove the local links

Use R2's console, not R1's.

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.0.12.2 255.255.255.252
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/1
R2(config-if)# ip address 10.0.13.2 255.255.255.252
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/2
R2(config-if)# ip address 192.168.20.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# end
R2# show ip interface brief
R2# show ip route
R2# ping 10.0.12.1
R2# ping 10.0.13.1
```

:::expected
Both transit pings should succeed, and PC-B should ping `192.168.20.1`. Each router has connected routes for its three /30 or /24 networks and local routes for its own addresses on images that display L entries. Neither router has a route to the other LAN. PC-A's ping to `192.168.20.12` should fail at this stage. This is a planned baseline, not a reason to change the PC mask.
:::

```state
{"status":"Local links proven","tone":"ok","wake":["R2"],"focus":["R2"],"flows":[{"path":["R2","R1"],"via":[2],"back":true,"label":"R2 pings 10.0.12.1"},{"path":["R2","R1"],"via":[3],"back":true,"label":"R2 pings 10.0.13.1"},{"path":["B","SW2","R2"],"back":true,"label":"PC-B pings 192.168.20.1"},{"path":["A","SW1","R1"],"label":"PC-A pings 192.168.20.12","stop":"R1","stopText":"No route to 192.168.20.0/24"}],"chips":[{"node":"R2","text":"R2#"}],"rows":[["Transit pings","10.0.12.1 and 10.0.13.1 reply","ok"],["PC-B to 192.168.20.1","Replies","ok"],["Each router","No route to the other LAN"],["PC-A to 192.168.20.12","Fails at this stage, as planned","dim"]]}
```

## Step 3: Observe the missing return route

Before configuration, write the expected source of R1’s ordinary ping and PC-A’s ping. For each, identify the reply destination R2 must look up. Add only R1's remote-LAN route.

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 gigabitethernet0/0 10.0.12.2
R1(config)# end
R1# show ip route static
R1# ping 192.168.20.12
```

On PC-A, run:

```text
ping 192.168.20.12
```

:::expected
R1 should list the /24 static through Gi0/0 and `10.0.12.2` at distance 1. R1's ordinary ping normally succeeds because its source is `10.0.12.1`, reachable through R2's connected transit route. PC-A's ping fails because R2 has no route back to `192.168.10.11`. Confirm that absence with R2's `show ip route`. In Simulation mode, you can follow the request toward PC-B and the return failure at R2. Do not infer this diagnosis from a failed ping alone outside this controlled configuration.
:::

```state
{"status":"Return route missing","tone":"bad","focus":["R1","R2"],"flows":[{"path":["R1","R2","SW2","B"],"via":[2,null,null],"back":true,"label":"R1 pings 192.168.20.12","tags":{"R1":"Source 10.0.12.1 · out Gi0/0"},"backTags":{"R2":"To 10.0.12.1 · connected route"}},{"path":["A","SW1","R1","R2","SW2","B"],"via":[null,null,2,null,null],"label":"PC-A pings 192.168.20.12","tags":{"R1":"S 192.168.20.0/24 via 10.0.12.2"}},{"path":["B","SW2","R2"],"tone":"reply","label":"PC-B replies to 192.168.10.11","stop":"R2","stopText":"No route back to 192.168.10.11"}],"chips":[{"node":"R1","text":"S 192.168.20.0/24 · AD 1"},{"node":"R2","text":"No route to 192.168.10.0/24","tone":"bad"}],"rows":[["R1 static","192.168.20.0/24 via 10.0.12.2 · AD 1","ok"],["R1 ping, source 10.0.12.1","Succeeds","ok"],["PC-A ping to PC-B","Fails: R2 has no route back","bad"]]}
```

## Step 4: Restore the return path

```ios R2
R2# configure terminal
R2(config)# ip route 192.168.10.0 255.255.255.0 gigabitethernet0/0 10.0.12.1
R2(config)# end
R2# show ip route static
```

:::expected
R2 now has the return /24 at distance 1. Repeat PC-A's ping to PC-B, then ping `192.168.10.11` from PC-B. Both should succeed. Optionally run `tracert 192.168.20.12` from PC-A; response addresses may vary, so use the selected routes and completed ping as the core evidence.
:::

```state
{"status":"Return path restored","tone":"ok","focus":["R2"],"flows":[{"path":["A","SW1","R1","R2","SW2","B"],"via":[null,null,2,null,null],"back":true,"label":"PC-A pings 192.168.20.12","tags":{"R1":"S 192.168.20.0/24 via 10.0.12.2"},"backTags":{"R2":"S 192.168.10.0/24 via 10.0.12.1"}},{"path":["B","SW2","R2","R1","SW1","A"],"via":[null,null,2,null,null],"back":true,"label":"PC-B pings 192.168.10.11","tags":{"R2":"S 192.168.10.0/24 via 10.0.12.1"}}],"chips":[{"node":"R1","text":"S 192.168.20.0/24 · AD 1"},{"node":"R2","text":"S 192.168.10.0/24 · AD 1"}],"rows":[["R2 static","192.168.10.0/24 via 10.0.12.1 · AD 1","ok"],["PC-A to PC-B","Replies","ok"],["PC-B to PC-A","Replies","ok"]]}
```

## Step 5: Add R1's floating route

Predict which of the two candidates will appear in configuration and which will be selected in the installed table. Use those as separate columns in your evidence record.

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 gigabitethernet0/1 10.0.13.2 5
R1(config)# end
R1# show running-config
R1# show ip route static
```

:::expected
The configuration has two routes to `192.168.20.0/24`. The installed table still selects the primary at distance 1. Distance 5 makes the other route a backup; it does not mean five hops. The named interfaces prevent the primary from being resolved through the alternate link.
:::

```state
{"status":"R1 floating route added","focus":["R1"],"chips":[{"node":"R1","text":"Primary AD 1 · installed"},{"node":"R1","text":"Backup AD 5 · configured"},{"node":"R2","text":"Primary AD 1 · installed"}],"rows":[["R1 configuration","Two routes to 192.168.20.0/24"],["R1 installed","AD 1 via Gi0/0 · 10.0.12.2","ok"],["R1 floating backup","AD 5 via Gi0/1 · 10.0.13.2"],["Distance 5","A preference, not five hops","dim"]]}
```

## Step 6: Add R2's floating return route

```ios R2
R2# configure terminal
R2(config)# ip route 192.168.10.0 255.255.255.0 gigabitethernet0/1 10.0.13.1 5
R2(config)# end
R2# show running-config
R2# show ip route static
```

:::expected
R2 likewise keeps the distance-1 primary selected while retaining the distance-5 backup in its configuration. Ping between PCs once more before introducing the next fault.
:::

```state
{"status":"Both backups configured","tone":"ok","focus":["R2"],"flows":[{"path":["A","SW1","R1","R2","SW2","B"],"via":[null,null,2,null,null],"back":true,"label":"PC-to-PC ping","tags":{"R1":"Primary AD 1 via Gi0/0"},"backTags":{"R2":"Primary AD 1 via Gi0/0"}}],"chips":[{"node":"R1","text":"Backup AD 5 · configured"},{"node":"R2","text":"Backup AD 5 · configured"}],"rows":[["R2 installed","192.168.10.0/24 · AD 1 via Gi0/0","ok"],["R2 floating backup","AD 5 via Gi0/1 · 10.0.13.1"],["PC to PC","Ping over the primary","ok"]]}
```

## Step 7: Fail the primary and inspect both tables

Predict the selected prefix, AD and next hop on **both** routers after failure, including the return direction. Shut only R1 Gi0/0. Keep it shut until you have collected the evidence.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show ip route static
```

Inspect `show ip interface brief` and `show ip route static` on R2 as well. The direct cable should make its primary link lose carrier. Repeat ordinary PC pings; a continuous-ping option is not required.

:::expected
After link and route updates, R1 should select the backup shown below, and R2 should select its return /24 through Gi0/1 and `10.0.13.1` at distance 5. Some probes may fail during the transition; no exact loss count or recovery time is promised.

```output R1# show ip route static
S    192.168.20.0/24 [5/0] via 10.0.13.2, GigabitEthernet0/1
```

PC-to-PC pings should recover over the backup. If they do not, inspect both directions and the backup interface state before restoring the primary.
:::

```state
{"status":"Primary shut, backup in use","tone":"warn","focus":["R1","R2"],"cut":[["R1","R2",2]],"roles":[{"node":"R1","peer":"R2","link":2,"text":"shutdown","tone":"bad"}],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"Now S [5/0] via 10.0.13.2","R2":"Now return via 10.0.13.1 · AD 5"}},{"path":["A","SW1","R1","R2","SW2","B"],"via":[null,null,3,null,null],"back":true,"label":"PC-to-PC ping over the backup","tags":{"R1":"AD 5 via 10.0.13.2 · Gi0/1"},"backTags":{"R2":"AD 5 via 10.0.13.1 · Gi0/1"}}],"chips":[{"node":"R1","text":"Backup AD 5 · configured","until":0},{"node":"R1","text":"Backup AD 5 · installed","tone":"warn","from":0},{"node":"R2","text":"Backup AD 5 · configured","until":0},{"node":"R2","text":"Backup AD 5 · installed","tone":"warn","from":0}],"rows":[["R1 selects","192.168.20.0/24 [5/0] via 10.0.13.2","warn"],["R2 selects","192.168.10.0/24 · AD 5 via 10.0.13.1","warn"],["PC pings","Recover over the backup","ok"],["During the transition","Some probes may fail","dim"]]}
```

## Step 8: Restore the primary link

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip route static
```

:::expected
Allow the physical link to recover. Both routers should again select distance-1 routes through Gi0/0, while their backup lines remain configured. Recheck endpoint pings. Save a separate working project copy now if you want a checkpoint before the next experiment.
:::

```state
{"status":"Primary restored","tone":"ok","focus":["R1","R2"],"roles":[{"node":"R1","peer":"R2","link":2,"text":"no shutdown","until":0},{"node":"R1","peer":"R2","link":2,"text":"up","tone":"ok","from":0}],"flows":[{"event":["R1","R2"],"wait":1.6,"tags":{"R1":"Gi0/0 up · AD 1 route again","R2":"AD 1 via 10.0.12.1 again"}},{"path":["A","SW1","R1","R2","SW2","B"],"via":[null,null,2,null,null],"back":true,"label":"PC-to-PC ping","tags":{"R1":"AD 1 via 10.0.12.2 · Gi0/0"},"backTags":{"R2":"AD 1 via 10.0.12.1 · Gi0/0"}}],"chips":[{"node":"R1","text":"Backup AD 5 · installed","tone":"warn","until":0},{"node":"R1","text":"Backup AD 5 · configured","from":0},{"node":"R2","text":"Backup AD 5 · installed","tone":"warn","until":0},{"node":"R2","text":"Backup AD 5 · configured","from":0}],"rows":[["Both routers","AD 1 routes via Gi0/0 again","ok"],["Backup lines","Still configured"],["Endpoint pings","Rechecked","ok"]]}
```

## Step 9: Make one host use the alternate path

Before entering the supplied host route, predict R1’s choices for PC-B (.12) and R2’s LAN address (.1). Explain whether AD 200 is compared with the /24’s AD 1 during those destination lookups.

```ios R1
R1# configure terminal
R1(config)# ip route 192.168.20.12 255.255.255.255 gigabitethernet0/1 10.0.13.2 200
R1(config)# end
R1# show ip route
R1# show ip route 192.168.20.12
```

:::expected
The /32 at distance 200 can coexist with the distance-1 /24. Traffic for PC-B selects /32 through Gi0/1; traffic for `192.168.20.1` selects /24 through Gi0/0. Ping both addresses from PC-A. Use Simulation mode or the installed entries to verify the destination decisions. Replies can return over the primary; an asymmetric path is not itself a failure in this unfiltered lab.
:::

```state
{"status":"Host route for PC-B","tone":"warn","focus":["R1"],"flows":[{"path":["A","SW1","R1","R2","SW2","B"],"via":[null,null,3,null,null],"label":"PC-A pings 192.168.20.12","tags":{"R1":"Longest match /32 · via Gi0/1"}},{"path":["B","SW2","R2","R1","SW1","A"],"via":[null,null,2,null,null],"tone":"reply","label":"Reply over the primary","tags":{"R2":"/24 · AD 1 via 10.0.12.1"}},{"path":["A","SW1","R1","R2"],"via":[null,null,2],"back":true,"label":"PC-A pings 192.168.20.1","tags":{"R1":"Only the /24 matches · via Gi0/0"}}],"chips":[{"node":"R1","text":"S 192.168.20.12/32 · AD 200"}],"rows":[["To 192.168.20.12","/32 · AD 200 via Gi0/1"],["To 192.168.20.1","/24 · AD 1 via Gi0/0"],["Replies","Can return over the primary","dim"]]}
```

## Step 10: Create a real destination for the default route

On R2, add a loopback. It needs no cable.

```ios R2
R2# configure terminal
R2(config)# interface loopback0
R2(config-if)# ip address 203.0.113.8 255.255.255.255
R2(config-if)# end
R2# show ip route
```

:::expected
R2 has a connected/local entry covering `203.0.113.8/32`; exact C/L presentation for loopbacks varies. From PC-A, `ping 203.0.113.8` should fail because R1 has no matching route or default. Record R1's current table to establish that reason.
:::

```state
{"status":"Loopback not reachable","tone":"bad","focus":["R2"],"flows":[{"path":["A","SW1","R1"],"label":"PC-A pings 203.0.113.8","stop":"R1","stopText":"No route or default for 203.0.113.8"}],"chips":[{"node":"R1","text":"S 192.168.20.12/32 · AD 200"},{"node":"R2","text":"Lo0 203.0.113.8/32","tone":"accent"}],"rows":[["R2 Loopback0","203.0.113.8/32 · connected"],["R1","No matching route or default","bad"],["PC-A to 203.0.113.8","Fails","bad"]]}
```

## Step 11: Add the default and verify its limits

Predict which entry will serve the loopback and whether the existing PC-B host route will still win for PC-B. Keep the loopback test’s actual PC-A source and R2 return route in your record.

```ios R1
R1# configure terminal
R1(config)# ip route 0.0.0.0 0.0.0.0 gigabitethernet0/0 10.0.12.2
R1(config)# end
R1# show ip route
```

:::expected
R1 lists an S* /0 route through R2. PC-A should now ping `203.0.113.8` successfully, using R2's existing return route to the PC LAN. No more specific route at R1 covers that loopback. The /32 for PC-B still takes precedence over the default. This proves a default to a known lab destination; it does not establish Internet connectivity.
:::

```state
{"status":"Default reaches the loopback","tone":"warn","focus":["R1"],"flows":[{"path":["A","SW1","R1","R2"],"via":[null,null,2],"back":true,"label":"PC-A pings 203.0.113.8","tags":{"R1":"Only /0 matches · via 10.0.12.2"},"backTags":{"R2":"Return /24 via 10.0.12.1"}}],"chips":[{"node":"R1","text":"S* 0.0.0.0/0 via 10.0.12.2"},{"node":"R1","text":"S 192.168.20.12/32 · AD 200"},{"node":"R2","text":"Lo0 203.0.113.8/32","tone":"accent"}],"rows":[["R1 default","S* /0 via 10.0.12.2","ok"],["PC-A to 203.0.113.8","Replies","ok"],["PC-B lookup","/32 still wins over /0"],["Proves","A lab default, not Internet access","dim"]]}
```

## Step 12: Remove temporary routes and save the baseline

```ios R1
R1# configure terminal
R1(config)# no ip route 192.168.20.12 255.255.255.255 gigabitethernet0/1 10.0.13.2 200
R1(config)# no ip route 0.0.0.0 0.0.0.0 gigabitethernet0/0 10.0.12.2
R1(config)# end
R1# show running-config
R1# copy running-config startup-config
```

At the destination-filename prompt, press Enter and wait for completion. Then use R2's console:

```ios R2
R2# configure terminal
R2(config)# no interface loopback0
R2(config)# end
R2# copy running-config startup-config
```

:::expected
Accept R2's filename prompt separately. Each router retains exactly its primary and floating remote-LAN route, and all physical interfaces are enabled. Confirm PC-to-PC ping. Save the project as `18-ipv4-static-baseline.pkt`. A project save and an IOS startup-configuration save are separate actions. Submit a state table for missing return route, repaired baseline, backup configured, primary failed, primary restored, host exception and default test. For each state name the relevant configured candidate, installed prefix/AD/action, tested source/destination and observed result. Distinguish the ordinary router ping from the endpoint test. Do not infer remote outage detection from the direct-cable failure test.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R1","R2"],"flows":[{"path":["A","SW1","R1","R2","SW2","B"],"via":[null,null,2,null,null],"back":true,"label":"PC-to-PC ping","tags":{"R1":"/24 · AD 1 via 10.0.12.2"},"backTags":{"R2":"/24 · AD 1 via 10.0.12.1"}}],"chips":[{"node":"R1","text":"Primary + AD 5 backup · saved","tone":"ok"},{"node":"R2","text":"Primary + AD 5 backup · saved","tone":"ok"}],"rows":[["Removed","/32, default and Loopback0"],["Each router","Primary /24 + AD 5 backup","ok"],["Saved","Both startup-configs · project file","ok"],["PC to PC","Ping confirmed","ok"]]}
```

## Troubleshooting

- **Local ping fails:** compare the address table, cable endpoints, switch port state and router `no shutdown`. A remote route cannot fix a local addressing problem.
- **A route is configured but absent:** inspect its distance, destination mask and required interface. Next-hop-only routes also need successful route resolution.
- **A route is installed but traffic fails:** confirm the actual peer address with its interface configuration, then inspect downstream and return routes.
- **Backup does not take over:** check that Gi0/0 really became unusable and Gi0/1 is still up. Compare both backup masks with their primary masks.
- **Two paths have distance 1:** the backup's distance may be omitted. Read the running configuration, remove the incorrect line, and re-enter it with distance 5.
- **A command or display differs:** use IOS `?` to check availability. Record the model/version and verify the same route decision using the full table; do not invent a matching screenshot.

## Challenge

Start from a copy of the saved baseline after Step 12: both transits are up; each router has its primary remote-LAN /24 and distance-5 backup; R1 has no host exception or default, and R2 has no Loopback0.

Add a new logical destination on R2: Loopback10 at **198.51.100.65/26**. It needs no cable. Build **network routes for the whole new /26** on R1 using Gi0/0 and 10.0.12.2 as primary, Gi0/1 and 10.0.13.2 as standby with AD 150. Do not add a default or change either existing LAN’s addressing. R2’s existing primary and backup return routes to PC-A remain applicable.

Before opening the answer, write the network identifier and mask, both R1 route commands and the R2 loopback configuration. Predict the installed source/distance and next hop in three states: both transits up, R1 Gi0/0 shut, and Gi0/0 restored. For each state, identify R2’s return route for PC-A’s source.

Implement and test from PC-A to the actual address 198.51.100.65. Keep the failed primary shut while collecting both routers’ interface/table evidence and an endpoint ping, then restore it separately. An ordinary R1 ping alone is insufficient. Explain why the route covering the whole /26 does not create working hosts at its other addresses. Save a separate challenge project with the primary restored.

Finally, on paper, replace only the standby mask with /27 while keeping its written network value 198.51.100.64 and AD 150. Decide which addresses that new prefix would attract while the /26 primary remains installed, and whether it is still a same-prefix floating backup.

:::solution
The new network is 198.51.100.64/26, mask 255.255.255.192, spanning .64–.127. Its loopback address .65 is valid.

```ios R2
R2# configure terminal
R2(config)# interface loopback10
R2(config-if)# ip address 198.51.100.65 255.255.255.192
R2(config-if)# end
R2# show ip interface brief
R2# show ip route
```

```ios R1
R1# configure terminal
R1(config)# ip route 198.51.100.64 255.255.255.192 gigabitethernet0/0 10.0.12.2
R1(config)# ip route 198.51.100.64 255.255.255.192 gigabitethernet0/1 10.0.13.2 150
R1(config)# end
R1# show running-config
R1# show ip route static
```

With both links up, R1 installs the /26 at AD 1 through 10.0.12.2; the AD-150 candidate remains configured. R2’s return to 192.168.10.0/24 uses 10.0.12.1 at AD 1. From PC-A run `ping 198.51.100.65` and record the result.

Introduce the independent failure only after that baseline works:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show ip route static
```

Leave it shut. R1’s new /26 should now use 10.0.13.2 at AD 150. The direct cable makes R2’s Gi0/0 lose carrier; its existing return /24 should use 10.0.13.1 at AD 5. Inspect R2’s interface state and route table and repeat PC-A’s ping before recovery. The two directions do not need equal distances.

Restore the primary in a separate operation:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip route static
```

Verify both routers return to their primary routes and PC-A reaches .65. On each router, save from privileged EXEC with `copy running-config startup-config`, accept the filename with Enter, and wait for completion. Save as `18-ipv4-new-prefix-challenge.pkt`. The original baseline remains available separately.

The /26 route covers possible destinations but does not create hosts. Only .65 was configured as this logical endpoint; another address needs a real responding owner and a usable path.

For the paper mask error, 198.51.100.64/27 spans .64–.95. It is a separate installed prefix, so matching traffic—including .65—can use the supposed standby while the /26 primary works. Addresses .96–.127 use /26. The error cannot be corrected by a higher distance alone; restore the matching /26 mask.
:::
