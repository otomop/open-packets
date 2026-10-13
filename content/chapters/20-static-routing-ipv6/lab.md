---
title: Route IPv6 between two LANs and diagnose a scoped next-hop error
environment: packet-tracer
devices: ["2 × Cisco 2911 routers (R1, R2)", "2 × Catalyst 2960 switches (SW1, SW2)", "2 × PCs (PC-A, PC-B)"]
minutes: 90
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use the supplied interface settings as a baseline. The routing work is to predict the selected prefix, scoped neighbor and return path, then compare those predictions with observations before repairing a fault.


Start a new isolated project. This lab reuses the physical layout from the IPv4 static-routing chapter but supplies the complete IPv6 setup here. You will verify a missing return route, fail and restore the primary link, and repair a link-local next hop attached to the wrong link.

No simulator execution is claimed. Output and prompts below are representative of documented IOS behavior. Packet Tracer may omit diagnostic options or detailed neighbor states. Record your version's differences and use the full tables and configuration as alternative evidence.

## Topology

```diagram
{"type":"topology","title":"Lab 20 — Two IPv6 LANs joined by a primary and a backup link","caption":"R1 and R2 are cabled twice, primary on Gi0/0 and backup on Gi0/1; SW1 and SW2 are not connected to each other.","nodes":[{"id":"PCA","kind":"pc","label":"PC-A","sub":"2001:db8:10::11/64 · gw fe80::1","x":1,"y":5},{"id":"SW1","kind":"switch","label":"SW1","x":1,"y":2},{"id":"R1","kind":"router","label":"R1","sub":"fe80::1 on each link","x":3.5,"y":2},{"id":"R2","kind":"router","label":"R2","sub":"Gi0/0, Gi0/2 fe80::2 · Gi0/1 fe80::3","x":8,"y":2},{"id":"SW2","kind":"switch","label":"SW2","x":10.5,"y":2},{"id":"PCB","kind":"pc","label":"PC-B","sub":"2001:db8:20::12/64 · gw fe80::2","x":10.5,"y":5}],"links":[{"from":"PCA","to":"SW1","toLabel":"Fa0/1"},{"from":"SW1","to":"R1","fromLabel":"Fa0/24","toLabel":"Gi0/2"},{"from":"R1","to":"R2","fromLabel":"Gi0/0","toLabel":"Gi0/0","label":"Primary 2001:db8:12::/64"},{"from":"R1","to":"R2","fromLabel":"Gi0/1","toLabel":"Gi0/1","label":"Backup 2001:db8:13::/64"},{"from":"R2","to":"SW2","fromLabel":"Gi0/2","toLabel":"Fa0/24"},{"from":"SW2","to":"PCB","fromLabel":"Fa0/1"}]}
```

Use two 2911 routers with three GigabitEthernet ports each. Use default 2960 switch access ports in VLAN 1, without a connection between SW1 and SW2.

| Connection | Cable |
|---|---|
| PC-A FastEthernet0 — SW1 FastEthernet0/1 | Copper straight-through |
| SW1 FastEthernet0/24 — R1 GigabitEthernet0/2 | Copper straight-through |
| R1 GigabitEthernet0/0 — R2 GigabitEthernet0/0 | Copper cross-over |
| R1 GigabitEthernet0/1 — R2 GigabitEthernet0/1 | Copper cross-over |
| R2 GigabitEthernet0/2 — SW2 FastEthernet0/24 | Copper straight-through |
| SW2 FastEthernet0/1 — PC-B FastEthernet0 | Copper straight-through |

| Interface | IPv6 address/prefix | Link-local |
|---|---|---|
| R1 Gi0/0, primary | `2001:db8:12::1/64` | `fe80::1` |
| R2 Gi0/0, primary | `2001:db8:12::2/64` | `fe80::2` |
| R1 Gi0/1, backup | `2001:db8:13::1/64` | `fe80::1` |
| R2 Gi0/1, backup | `2001:db8:13::2/64` | `fe80::3` |
| R1 Gi0/2, LAN A | `2001:db8:10::1/64` | `fe80::1` |
| R2 Gi0/2, LAN B | `2001:db8:20::1/64` | `fe80::2` |
| PC-A | `2001:db8:10::11/64` | Automatic local-link address |
| PC-B | `2001:db8:20::12/64` | Automatic local-link address |
| R2 Loopback0, added later | `2001:db8:99::8/128` | Not used as a next hop |

PC-A's static IPv6 gateway is `fe80::1`. PC-B's is `fe80::2`. These gateway values belong to the router on each PC's own LAN. R2 intentionally uses `fe80::3` on the backup transit link, so the scope exercise has distinct peers to verify.

### Route and evidence worksheet

Before adding a route, write its destination prefix, next-hop address **and exit interface**, and expected distance. Keep separate rows for R1 and R2; the outbound path is not the return path.

| State | R1 route to PC-B | R2 route to PC-A | Endpoint result and evidence |
|---|---|---|---|
| Only R1 outbound route | Prediction / actual | Prediction / actual | PC source and observed reply/failure |
| Both primary routes | Prediction / actual | Prediction / actual | Both PC tests |
| Primary physically down | Prediction / actual | Prediction / actual | Installed distances and scoped neighbors |
| Wrong /128 present | PC-B versus R2 LAN address | Unchanged or changed? | Neighbor evidence for the selected next hop |
| /128 repaired | Prediction / actual | Selected return path | Both endpoints; explain any asymmetry |

Do not use a successful router-originated ping as a substitute for a client test unless you have verified the source address and its return lookup.

## Step 1: Configure R1

Place and cable the devices. Decline a new router's setup dialog if offered. Configure R1's three interfaces.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address 2001:db8:12::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet0/1
R1(config-if)# ipv6 address 2001:db8:13::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet0/2
R1(config-if)# ipv6 address 2001:db8:10::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface brief
```

:::expected
The assigned addresses appear. Gi0/2 should become up/up after its switch port is ready; the transit ports may remain down until R2 is configured. R1 can use `fe80::1` on separate links without a same-link duplicate.
:::

```state
{"status":"R1 configured","addressed":["R1"],"wake":["R1"],"focus":["R1"],"chips":[{"node":"R1","text":"ipv6 unicast-routing"}],"rows":[["R1 Gi0/2, LAN A","up/up once SW1 Fa0/24 is ready"],["R1 Gi0/0, Gi0/1","May stay down until R2 is set","dim"],["Link-local","fe80::1 on each link, no duplicate"]]}
```

## Step 2: Configure R2

Check that you are on R2's console.

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# ipv6 unicast-routing
R2(config)# interface gigabitethernet0/0
R2(config-if)# ipv6 address 2001:db8:12::2/64
R2(config-if)# ipv6 address fe80::2 link-local
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/1
R2(config-if)# ipv6 address 2001:db8:13::2/64
R2(config-if)# ipv6 address fe80::3 link-local
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/2
R2(config-if)# ipv6 address 2001:db8:20::1/64
R2(config-if)# ipv6 address fe80::2 link-local
R2(config-if)# no shutdown
R2(config-if)# end
R2# show ipv6 interface brief
R2# ping 2001:db8:12::1
R2# ping 2001:db8:13::1
```

:::expected
Both transit links should become up/up and both pings should succeed after discovery. Read the actual interface names and peer addresses rather than relying only on green cable indicators. Correct a local-link failure before adding remote routes.
:::

```state
{"status":"Both transit links up","tone":"ok","addressed":["R1","R2"],"focus":["R2"],"chips":[{"node":"R2","text":"ipv6 unicast-routing"}],"flows":[{"path":["R2","R1"],"via":[2],"back":true,"label":"R2 pings 2001:db8:12::1","tags":{"R2":"Connected 2001:db8:12::/64 · Gi0/0"}},{"path":["R2","R1"],"via":[3],"back":true,"label":"R2 pings 2001:db8:13::1","tags":{"R2":"Connected 2001:db8:13::/64 · Gi0/1"}}],"rows":[["Primary Gi0/0 link","up/up · ping 2001:db8:12::1","ok"],["Backup Gi0/1 link","up/up · ping 2001:db8:13::1","ok"],["R2 link-locals","Gi0/0 fe80::2 · Gi0/1 fe80::3"]]}
```

## Step 3: Address the PCs and verify link-local scope

Under Desktop → IP Configuration, choose IPv6 Static on each PC. Enter the addresses, prefix length `64` and gateways from the topology table. Leave DNS and IPv4 unused.

From PC-A:

```text
ping 2001:db8:10::1
```

From PC-B:

```text
ping 2001:db8:20::1
```

On R1, run the following command by itself, then answer its interactive prompt:

```ios R1
R1# ping fe80::2
```

:::expected
Both local PC pings should succeed. Documented IOS behavior asks `Output Interface:` for the link-local ping; enter `gigabitethernet0/0` and allow the test to finish. It should reach R2's primary address. Repeat `ping fe80::3` and select `gigabitethernet0/1` for the backup neighbor.

If this prompt is not modeled, use the successful global transit pings from Step 2 and the peer's interface display as evidence, and record the unsupported scoped-ping observation. Do not infer a link's identity from the address text alone.
:::

```state
{"status":"Local links verified","tone":"ok","focus":["PCA","PCB","R1"],"flows":[{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A pings 2001:db8:10::1"},{"path":["PCB","SW2","R2"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 2001:db8:20::1"},{"path":["R1","R2"],"via":[2],"back":true,"label":"R1 pings fe80::2","tags":{"R1":"Output Interface: Gi0/0"},"backTags":{"R2":"Primary neighbor fe80::2"}},{"path":["R1","R2"],"via":[3],"back":true,"label":"R1 pings fe80::3","tags":{"R1":"Output Interface: Gi0/1"},"backTags":{"R2":"Backup neighbor fe80::3"}}],"rows":[["PC-A → 2001:db8:10::1","Replies","ok"],["PC-B → 2001:db8:20::1","Replies","ok"],["ping fe80::2","Output Interface Gi0/0","ok"],["ping fe80::3","Output Interface Gi0/1","ok"]]}
```

## Step 4: Add only the outbound remote-LAN route

Before adding it, predict which source prefixes R2 can currently return to. Write separate predictions for an explicitly transit-sourced router probe and a PC-A probe; the commands below do not guarantee which source an unsourced router ping chooses.

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/0 fe80::2
R1(config)# end
R1# show ipv6 route static
R1# ping 2001:db8:20::12
```

Then ping `2001:db8:20::12` from PC-A. Inspect R2's full IPv6 table before fixing anything.

:::expected
R1 selects the remote /64 through `fe80::2` on Gi0/0. Its router-originated ping may succeed using a transit source that R2 knows as connected; inspect the source if your image displays it. PC-A's ping should fail because R2 has no route covering `2001:db8:10::11`. The missing return prefix in R2's table establishes the fault; router ping source selection alone is not assumed as universal evidence.
:::

```state
{"status":"Return route missing","tone":"bad","focus":["R1","R2"],"flows":[{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,2,null,null],"label":"PC-A pings 2001:db8:20::12","tags":{"R1":"2001:db8:20::/64 via fe80::2 Gi0/0","R2":"Connected LAN route to PC-B"}},{"path":["PCB","SW2","R2"],"tone":"reply","label":"Reply to 2001:db8:10::11","stop":"R2","stopText":"No route covering 2001:db8:10::11"}],"rows":[["R1 → 2001:db8:20::/64","fe80::2 on Gi0/0","ok"],["R2 → 2001:db8:10::/64","No route","bad"],["PC-A → PC-B","Fails: the reply has no route","bad"],["R1's own ping","May succeed from a transit source","dim"]]}
```

## Step 5: Add the return route and establish the baseline

```ios R2
R2# configure terminal
R2(config)# ipv6 route 2001:db8:10::/64 gigabitethernet0/0 fe80::1
R2(config)# end
R2# show ipv6 route static
```

:::expected
PC-A-to-PC-B ping and the reverse ping should now succeed. R2 has the return /64 through R1 on the primary link. Record both installed entries before adding standby routes. A successful test in only one direction can still conceal a source-dependent issue, so perform both endpoint tests.
:::

```state
{"status":"Baseline in both directions","tone":"ok","focus":["R2"],"flows":[{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,2,null,null],"back":true,"label":"PC-A pings PC-B","tags":{"R1":"2001:db8:20::/64 via fe80::2 Gi0/0"},"backTags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/0"}},{"path":["PCB","SW2","R2","R1","SW1","PCA"],"via":[null,null,2,null,null],"back":true,"label":"PC-B pings PC-A"}],"rows":[["R1 → LAN B","fe80::2 on Gi0/0 · distance 1","ok"],["R2 → LAN A","fe80::1 on Gi0/0 · distance 1","ok"],["Both PC pings","Succeed","ok"]]}
```

## Step 6: Configure both floating routes

Predict which entries belong in the running configuration and which should appear in the installed table while the primary is healthy.

First add R1's standby path.

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/1 fe80::3 5
R1(config)# end
R1# show running-config
R1# show ipv6 route static
```

Then add R2's standby return path in its separate console:

```ios R2
R2# configure terminal
R2(config)# ipv6 route 2001:db8:10::/64 gigabitethernet0/1 fe80::1 5
R2(config)# end
R2# show ipv6 route static
```

:::expected
Each router retains two configured candidates for its remote /64. With both primary links working, the installed route remains distance 1 through Gi0/0. The distance-5 candidate is not normally displayed by the installed-static filter.
:::

```state
{"status":"Floating routes configured","focus":["R1","R2"],"chips":[{"node":"R1","text":"Standby Gi0/1 fe80::3 · distance 5"},{"node":"R2","text":"Standby Gi0/1 fe80::1 · distance 5"}],"rows":[["Installed on both","Distance 1 via Gi0/0","ok"],["R1 candidate","fe80::3 on Gi0/1 · configured only"],["R2 candidate","fe80::1 on Gi0/1 · configured only"]]}
```

## Step 7: Fail the primary and observe the backup

Record both expected interface/address pairs and distances before shutdown. After the change, collect both routing tables and PC tests before opening the recovery step.

Shut R1 Gi0/0 and keep it shut until the checks are complete.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# shutdown
R1(config-if)# end
R1# show ipv6 interface brief
R1# show ipv6 route static
```

On R2, inspect the same two show commands. Repeat PC pings after allowing link and route updates; no continuous-ping extension is required.

:::expected
Because the primary routers are directly cabled, R2's Gi0/0 should lose carrier as well. The remote /64 on each router should move to Gi0/1 at distance 5. R1 uses `fe80::3`; R2 uses `fe80::1`.

```output R1# show ipv6 route static
S   2001:DB8:20::/64 [5/0]
     via FE80::3, GigabitEthernet0/1
```

Endpoint pings should recover on the backup. No exact loss count or convergence time is promised. If the path fails, inspect the backup neighbor and the reverse route before bringing the primary back.
:::

```state
{"status":"Primary down, backup used","tone":"warn","focus":["R1","R2"],"cut":[["R1","R2",2]],"chips":[{"node":"R1","text":"Gi0/0 shut","tone":"bad"}],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"Distance 5 via fe80::3 Gi0/1","R2":"Distance 5 via fe80::1 Gi0/1"}},{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,3,null,null],"back":true,"label":"PC-A pings PC-B on the backup","tags":{"R1":"2001:db8:20::/64 via fe80::3 Gi0/1"},"backTags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/1"}}],"rows":[["R1 Gi0/0","Shut; R2 Gi0/0 loses carrier","warn"],["R1 → LAN B","[5/0] via fe80::3 Gi0/1","ok"],["R2 → LAN A","Distance 5 via fe80::1 Gi0/1","ok"],["PC pings","Recover on the backup","ok"]]}
```

## Step 8: Restore the primary

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 route static
```

:::expected
After link recovery, both routers select their distance-1 primary routes again. Backup candidates remain in the running configuration. Verify both endpoint pings before the next controlled fault.
:::

```state
{"status":"Primary restored","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"Gi0/0 shut","tone":"bad","until":0}],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"Gi0/0 up · distance 1 via fe80::2","R2":"Gi0/0 up · distance 1 via fe80::1"}},{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,2,null,null],"back":true,"label":"PC-A pings PC-B","tags":{"R1":"2001:db8:20::/64 via fe80::2 Gi0/0"},"backTags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/0"}},{"path":["PCB","SW2","R2","R1","SW1","PCA"],"via":[null,null,2,null,null],"back":true,"label":"PC-B pings PC-A"}],"rows":[["Installed on both","Distance 1 via Gi0/0","ok"],["Floating routes","Still in running-config"],["Both PC pings","Succeed","ok"]]}
```

## Step 9: Introduce a host route with the wrong scoped neighbor

Before typing, predict the selected route for PC-B and for R2's LAN address. Explain on paper whether distance 200 prevents a more-specific /128 from being selected.

This deliberately incorrect /128 is syntactically complete. It identifies R2's **primary** link-local address on R1's **backup** interface, where that address does not exist.

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::12/128 gigabitethernet0/1 fe80::2 200
R1(config)# end
R1# show ipv6 route
```

From PC-A, ping `2001:db8:20::12`, then separately ping `2001:db8:20::1`. On R1 inspect `show ipv6 neighbors`. On R2 confirm Gi0/1 actually uses `fe80::3`.

:::expected
The host route can install on the active interface and wins for PC-B's address despite distance 200. It cannot resolve the intended next hop on that link, so PC-B's test should fail. The LAN router address `2001:db8:20::1` is not covered by /128 and should still work through the /64 primary.

An unresolved neighbor may appear as incomplete or may disappear between attempts. Compare the interface/address pair rather than requiring one exact state label. If the simulator does not model the expected resolution failure, record that limitation; the peer-address mismatch is still clear in the configuration.
:::

```state
{"status":"Wrong /128 next hop","tone":"bad","focus":["R1"],"chips":[{"node":"R2","text":"Gi0/1 is fe80::3"}],"flows":[{"path":["PCA","SW1","R1","R2"],"via":[null,null,3],"label":"PC-A pings 2001:db8:20::12","tags":{"R1":"/128 wins · fe80::2 on Gi0/1"},"stop":"R1","stopText":"Cannot resolve fe80::2 on Gi0/1"},{"path":["PCA","SW1","R1","R2"],"via":[null,null,2],"back":true,"label":"PC-A pings 2001:db8:20::1","tags":{"R1":"Not in the /128 · /64 via Gi0/0"}}],"rows":[["R1 → 2001:db8:20::12","/128 · distance 200 · Gi0/1 fe80::2","bad"],["R2 Gi0/1 link-local","fe80::3, not fe80::2"],["PC-A → PC-B","Fails: next hop unresolved","bad"],["PC-A → 2001:db8:20::1","Works via the /64 primary","ok"]]}
```

## Step 10: Repair the host next hop and verify longest match

```ios R1
R1# configure terminal
R1(config)# no ipv6 route 2001:db8:20::12/128 gigabitethernet0/1 fe80::2 200
R1(config)# ipv6 route 2001:db8:20::12/128 gigabitethernet0/1 fe80::3 200
R1(config)# end
R1# show ipv6 route 2001:db8:20::12
```

:::expected
PC-A should now reach PC-B through the /128's valid backup next hop. The /64 primary still serves the other LAN addresses. Use the full table if the address-specific query is unsupported. A reply can return over the primary; this asymmetry is valid in the stated lab with no filtering or translation.
:::

```state
{"status":"Host route repaired","tone":"ok","focus":["R1"],"flows":[{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,3,null,null],"label":"PC-A pings PC-B","tags":{"R1":"/128 · fe80::3 on Gi0/1"}},{"path":["PCB","SW2","R2","R1","SW1","PCA"],"via":[null,null,2,null,null],"tone":"reply","label":"Reply over the primary","tags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/0"}}],"rows":[["R1 → 2001:db8:20::12","/128 via fe80::3 Gi0/1","ok"],["Rest of LAN B","/64 via fe80::2 Gi0/0"],["Reply path","Primary: a valid asymmetry"]]}
```

## Step 11: Add a real destination for a default route

On R2 create the logical test interface:

```ios R2
R2# configure terminal
R2(config)# interface loopback0
R2(config-if)# ipv6 address 2001:db8:99::8/128
R2(config-if)# end
R2# show ipv6 route
```

From PC-A, ping `2001:db8:99::8` before adding a default to R1.

:::expected
R2 has the loopback destination locally, but R1 has no covering remote route or default. The PC ping should fail. Confirm the absent covering prefix in R1's table. No cable or external service is needed for the loopback.
:::

```state
{"status":"No route to the loopback","tone":"bad","focus":["R1","R2"],"chips":[{"node":"R2","text":"Lo0 2001:db8:99::8/128"}],"flows":[{"path":["PCA","SW1","R1"],"label":"PC-A pings 2001:db8:99::8","stop":"R1","stopText":"No covering route or default"}],"rows":[["R2 Loopback0","2001:db8:99::8/128 · local"],["R1 route to it","None, and no default","bad"],["PC-A → 2001:db8:99::8","Fails","bad"]]}
```

## Step 12: Add and test the default route

```ios R1
R1# configure terminal
R1(config)# ipv6 route ::/0 gigabitethernet0/0 fe80::2
R1(config)# end
R1# show ipv6 route static
```

:::expected
R1 lists the default `::/0` through R2. PC-A's ping to `2001:db8:99::8` should now succeed. R2 already has the return route to the PC-A LAN. PC-B still follows its more specific /128; a default does not override specific routes. This is an isolated routing test, not proof of public IPv6 connectivity.
:::

```state
{"status":"Default reaches the loopback","tone":"ok","focus":["R1"],"chips":[{"node":"R2","text":"Lo0 2001:db8:99::8/128"}],"flows":[{"path":["PCA","SW1","R1","R2"],"via":[null,null,2],"back":true,"label":"PC-A pings 2001:db8:99::8","tags":{"R1":"::/0 via fe80::2 Gi0/0"},"backTags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/0"}}],"rows":[["R1 default","::/0 via fe80::2 Gi0/0","ok"],["PC-A → 2001:db8:99::8","Succeeds","ok"],["PC-B's address","Still the /128: longest match"]]}
```

## Step 13: Remove temporary routes and the test loopback

Clean up R1:

```ios R1
R1# configure terminal
R1(config)# no ipv6 route 2001:db8:20::12/128 gigabitethernet0/1 fe80::3 200
R1(config)# no ipv6 route ::/0 gigabitethernet0/0 fe80::2
R1(config)# end
R1# show running-config
R1# show ipv6 route static
```

Then clean up R2:

```ios R2
R2# configure terminal
R2(config)# no interface loopback0
R2(config)# end
R2# show ipv6 route
```

:::expected
R1 retains only its primary and floating remote-LAN candidates; R2 retains its corresponding return candidates. No temporary host route, default or loopback remains. Both physical paths are enabled. Confirm PC-to-PC ping once more.
:::

```state
{"status":"Temporary routes removed","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R2","text":"Lo0 2001:db8:99::8/128","until":0}],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"/128 and ::/0 removed","R2":"Loopback0 removed"}},{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,2,null,null],"back":true,"label":"PC-A pings PC-B","tags":{"R1":"2001:db8:20::/64 via fe80::2 Gi0/0"}}],"rows":[["R1","Primary + floating LAN B routes","ok"],["R2","Primary + floating LAN A routes","ok"],["Removed","/128, ::/0 and Loopback0"],["PC-to-PC ping","Succeeds","ok"]]}
```

## Step 14: Save the verified baseline

```ios R1
R1# copy running-config startup-config
```

Accept the destination-filename prompt with Enter and wait for completion. Then save R2 separately:

```ios R2
R2# copy running-config startup-config
```

:::expected
Accept R2's prompt separately. Save the Packet Tracer project as `20-ipv6-static-baseline.pkt`. Keep your route and neighbor observations with the file. Project saving and startup-configuration saving are distinct actions.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"}],"rows":[["R1, R2","copy running-config startup-config","ok"],["Project","20-ipv6-static-baseline.pkt","ok"],["Kept","Primary + floating routes on each"]]}
```

## Troubleshooting

- **No local transit connectivity:** check the cable endpoints, interface state and exact /64 addresses before adding a route.
- **A link-local route is rejected:** include the local exit interface. Valid syntax still needs the correct neighbor on that link.
- **An installed route does not deliver:** compare the scoped next hop against the peer's interface, generate traffic, and inspect neighbor resolution. Then check downstream and return routes.
- **Router pings work but PC pings fail:** confirm the source used by the router, the return prefix for the PC, both PC gateways and `ipv6 unicast-routing`.
- **The standby never appears:** inspect the preferred route's eligibility and the backup interface. The ordinary route is not an end-to-end health monitor.
- **Both paths have distance 1:** read the backup configuration and restore its intended distance 5. Equal-cost multipath is different from standby.
- **One address fails while the rest of the LAN works:** check for a more specific /128 overriding the working /64.

## Challenge

In a copy of the cleaned baseline, add a **new service destination** `2001:db8:77::7/128` on R2 Loopback7. PC-A must reach only that new host prefix using primary R1 Gi0/0, with R1 Gi0/1 as a distance-25 standby. Use link-local next hops. Do not add a default route or widen the host prefix. Preserve all existing LAN routes and R2's primary/floating return routes.

Before configuring anything, write the two R1 routes, their scoped next hops, the selected route while healthy, and the selected route after primary failure. Explain why R2's existing LAN-A routes are sufficient for replies to PC-A. Then perform these separate phases:

1. Add the new loopback and routes. Record the /128 entry and ping the service from PC-A.
2. Shut only R1 Gi0/0. Keep it down while collecting both routers' return/forward entries and another PC-A service test.
3. Restore Gi0/0, verify the primary returns, then remove only the temporary service routes and Loopback7. Recheck PC-to-PC service and preserve the original baseline.

As a separate paper comparison, replace R1's original LAN-B primary with the global-next-hop-only form through `2001:db8:12::2`. Identify its resolving prefix and explain why `fe80::2` cannot omit the interface in the same way.

:::solution
R1's service routes are `2001:db8:77::7/128` through Gi0/0 `fe80::2` at ordinary distance 1 and Gi0/1 `fe80::3` at distance 25. R2 already returns to PC-A's `2001:db8:10::/64` through the appropriate primary or distance-5 backup. The two routers' distances need not match; each makes its own local selection.

Configure the service on R2:

```ios R2
R2# configure terminal
R2(config)# interface loopback7
R2(config-if)# ipv6 address 2001:db8:77::7/128
R2(config-if)# end
R2# show ipv6 route
```

Configure R1 and inspect before any fault:

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:77::7/128 gigabitethernet0/0 fe80::2
R1(config)# ipv6 route 2001:db8:77::7/128 gigabitethernet0/1 fe80::3 25
R1(config)# end
R1# show ipv6 route static
```

On PC-A, at each phase:

```text
ping 2001:db8:77::7
```

The healthy /128 uses distance 1 and Gi0/0. Shut only R1 Gi0/0 using the Step 7 interface procedure. Before recovery, the installed /128 should use distance 25 through Gi0/1 `fe80::3`; R2's return to LAN A should use distance 5 through Gi0/1 `fe80::1`. The PC test should recover after route/neighbor updates. Capture these results while the primary remains down.

Restore R1 Gi0/0 using Step 8 and verify distance 1 returns. Only after the recovery test, clean up:

```ios R1
R1# configure terminal
R1(config)# no ipv6 route 2001:db8:77::7/128 gigabitethernet0/0 fe80::2
R1(config)# no ipv6 route 2001:db8:77::7/128 gigabitethernet0/1 fe80::3 25
R1(config)# end
R1# show ipv6 route static
```

```ios R2
R2# configure terminal
R2(config)# no interface loopback7
R2(config)# end
R2# show ipv6 route
```

The original primary and floating LAN routes remain. Recheck both PC pings, save each router separately, and save the project.

For the paper comparison, `ipv6 route 2001:db8:20::/64 2001:db8:12::2` resolves through connected `2001:db8:12::/64`. In this cleaned topology no default or alternative resolver exists, so primary-link loss removes that resolver and makes the backup eligible. A link-local next hop must include its local exit interface. This paper comparison does not change the saved device configuration.
:::
