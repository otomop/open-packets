---
title: Route IPv6 between two LANs and diagnose a scoped next-hop error
environment: packet-tracer
devices: ["2 × Cisco 2911 routers (R1, R2)", "2 × Catalyst 2960 switches (SW1, SW2)", "2 × PCs (PC-A, PC-B)"]
minutes: 90
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You will build every route type from the lesson on two routers joined by a primary and a backup link: network routes in both directions, floating backups, a host route and a default route. Along the way you will see three faults from the lesson for yourself: a missing return route, a failed primary link, and a link-local next hop paired with the wrong interface.

Start a new Packet Tracer project. The layout is the one from the IPv4 static-routing chapter, but all the IPv6 configuration is given here. Before each step, predict which route the router will use, then compare your prediction with the output.

The outputs shown are what IOS prints. Packet Tracer differs in small ways, such as leaving out the `Output Interface:` prompt or some neighbor states. Where that matters, the step says what to check instead.

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

PC-A's gateway is `fe80::1`, R1's address on LAN A. PC-B's gateway is `fe80::2`, R2's address on LAN B. R2 uses `fe80::3` on the backup link so that you can tell its two transit interfaces apart in Step 9.

### Route and evidence worksheet

Before adding a route, write its destination prefix, next-hop address **and exit interface**, and expected distance. Keep separate columns for R1 and R2, because each direction needs its own route.

| State | R1 route to PC-B | R2 route to PC-A | Endpoint result and evidence |
|---|---|---|---|
| Only R1 outbound route | Prediction / actual | Prediction / actual | PC source and observed reply/failure |
| Both primary routes | Prediction / actual | Prediction / actual | Both PC tests |
| Primary physically down | Prediction / actual | Prediction / actual | Installed distances and scoped neighbors |
| Wrong /128 present | PC-B versus R2 LAN address | Unchanged or changed? | Neighbor evidence for the selected next hop |
| /128 repaired | Prediction / actual | Selected return path | Both endpoints; explain any asymmetry |

Test from the PCs. A ping from a router uses a transit source address and can succeed when the PCs cannot reach each other.

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
The three global addresses and `FE80::1` appear. Gi0/2 becomes up/up once its switch port is ready, which takes about 30 seconds. Gi0/0 and Gi0/1 stay down until R2 is configured. R1 can use `fe80::1` on all three interfaces because each is a different link.
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
Both transit links are up/up and both pings succeed. The first ping may lose a packet while Neighbor Discovery resolves R1's MAC address. If a ping fails, fix the addresses or cabling on that link before you add any routes.
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

A link-local address exists on every link, so IOS has to ask which interface to send the ping from. On R1, enter this command and answer the prompt:

```ios R1
R1# ping fe80::2
```

:::expected
Both PC pings succeed. For the link-local ping, IOS asks `Output Interface:`. Type `gigabitethernet0/0` in full and the ping reaches R2's primary interface. Then run `ping fe80::3` and answer `gigabitethernet0/1` to reach R2's backup interface.

If Packet Tracer does not show the prompt, rely on the Step 2 pings and on `show ipv6 interface brief` on R2, which lists the link-local address of each interface.
:::

```state
{"status":"Local links verified","tone":"ok","focus":["PCA","PCB","R1"],"flows":[{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A pings 2001:db8:10::1"},{"path":["PCB","SW2","R2"],"back":true,"with":true,"tone":"alt","label":"PC-B pings 2001:db8:20::1"},{"path":["R1","R2"],"via":[2],"back":true,"label":"R1 pings fe80::2","tags":{"R1":"Output Interface: Gi0/0"},"backTags":{"R2":"Primary neighbor fe80::2"}},{"path":["R1","R2"],"via":[3],"back":true,"label":"R1 pings fe80::3","tags":{"R1":"Output Interface: Gi0/1"},"backTags":{"R2":"Backup neighbor fe80::3"}}],"rows":[["PC-A → 2001:db8:10::1","Replies","ok"],["PC-B → 2001:db8:20::1","Replies","ok"],["ping fe80::2","Output Interface Gi0/0","ok"],["ping fe80::3","Output Interface Gi0/1","ok"]]}
```

## Step 4: Add only the outbound remote-LAN route

R1 gets a route to LAN B, but R2 gets nothing yet. Before you start, predict two results: a ping to PC-B from R1 itself, which is sourced from `2001:db8:12::1`, and a ping to PC-B from PC-A. Which of those source addresses can R2 route a reply to?

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/0 fe80::2
R1(config)# end
R1# show ipv6 route static
R1# ping 2001:db8:20::12
```

Then ping `2001:db8:20::12` from PC-A. Run `show ipv6 route` on R2 before fixing anything.

:::expected
R1 installs the /64 through `fe80::2` on Gi0/0. R1's own ping succeeds, because R2 is connected to the transit prefix the ping came from. PC-A's ping fails: the request reaches PC-B, but R2 has no route covering `2001:db8:10::11` and drops the reply. R2's table shows only its connected and local routes.
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
R2 now has `2001:DB8:10::/64 [1/0]` through `FE80::1` on Gi0/0. Ping from PC-A to PC-B and from PC-B to PC-A; both succeed. Record both installed routes before you add the backups.
:::

```state
{"status":"Baseline in both directions","tone":"ok","focus":["R2"],"flows":[{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,2,null,null],"back":true,"label":"PC-A pings PC-B","tags":{"R1":"2001:db8:20::/64 via fe80::2 Gi0/0"},"backTags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/0"}},{"path":["PCB","SW2","R2","R1","SW1","PCA"],"via":[null,null,2,null,null],"back":true,"label":"PC-B pings PC-A"}],"rows":[["R1 → LAN B","fe80::2 on Gi0/0 · distance 1","ok"],["R2 → LAN A","fe80::1 on Gi0/0 · distance 1","ok"],["Both PC pings","Succeed","ok"]]}
```

## Step 6: Configure both floating routes

Each router gets a second route to the same /64 through the backup link, with distance 5. Predict which routes will appear in `show ipv6 route static` while the primary link is up.

First add R1's backup route.

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::/64 gigabitethernet0/1 fe80::3 5
R1(config)# end
R1# show running-config
R1# show ipv6 route static
```

Then add R2's backup return route:

```ios R2
R2# configure terminal
R2(config)# ipv6 route 2001:db8:10::/64 gigabitethernet0/1 fe80::1 5
R2(config)# end
R2# show ipv6 route static
```

:::expected
The running configuration on each router holds two routes to the remote /64. `show ipv6 route static` shows only the distance-1 route through Gi0/0. The distance-5 route is not installed, so it is not listed.
:::

```state
{"status":"Floating routes configured","focus":["R1","R2"],"chips":[{"node":"R1","text":"Standby Gi0/1 fe80::3 · distance 5"},{"node":"R2","text":"Standby Gi0/1 fe80::1 · distance 5"}],"rows":[["Installed on both","Distance 1 via Gi0/0","ok"],["R1 candidate","fe80::3 on Gi0/1 · configured only"],["R2 candidate","fe80::1 on Gi0/1 · configured only"]]}
```

## Step 7: Fail the primary and observe the backup

Write down the route you expect each router to install once the primary link is down: next hop, interface and distance. Then shut R1 Gi0/0 and leave it shut until you have checked both routers and both PCs.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# shutdown
R1(config-if)# end
R1# show ipv6 interface brief
R1# show ipv6 route static
```

Run the same two show commands on R2, then repeat the PC pings.

:::expected
The routers are cabled directly, so R2's Gi0/0 goes down too. Each router removes its distance-1 route and installs the distance-5 route through Gi0/1. R1 uses `fe80::3`; R2 uses `fe80::1`.

```output R1# show ipv6 route static
S   2001:DB8:20::/64 [5/0]
     via FE80::3, GigabitEthernet0/1
```

The PC pings work again over the backup link. If they fail, check the backup next hop on R1 and the backup return route on R2 before you bring the primary back.
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
Once Gi0/0 is up on both routers, each reinstalls its distance-1 route. The backups stay in the running configuration. Confirm both PC pings before the next step.
:::

```state
{"status":"Primary restored","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"Gi0/0 shut","tone":"bad","until":0}],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"Gi0/0 up · distance 1 via fe80::2","R2":"Gi0/0 up · distance 1 via fe80::1"}},{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,2,null,null],"back":true,"label":"PC-A pings PC-B","tags":{"R1":"2001:db8:20::/64 via fe80::2 Gi0/0"},"backTags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/0"}},{"path":["PCB","SW2","R2","R1","SW1","PCA"],"via":[null,null,2,null,null],"back":true,"label":"PC-B pings PC-A"}],"rows":[["Installed on both","Distance 1 via Gi0/0","ok"],["Floating routes","Still in running-config"],["Both PC pings","Succeed","ok"]]}
```

## Step 9: Introduce a host route with the wrong scoped neighbor

This step adds a host route for PC-B that contains a deliberate mistake: it pairs R2's **primary** link-local address, `fe80::2`, with R1's **backup** interface, Gi0/1. IOS accepts the command. Before typing it, predict which route R1 will use for PC-B and which for R2's LAN address `2001:db8:20::1`, and whether distance 200 stops the /128 from being used.

```ios R1
R1# configure terminal
R1(config)# ipv6 route 2001:db8:20::12/128 gigabitethernet0/1 fe80::2 200
R1(config)# end
R1# show ipv6 route
```

From PC-A, ping `2001:db8:20::12`, then separately ping `2001:db8:20::1`. On R1 inspect `show ipv6 neighbors`. On R2 confirm Gi0/1 actually uses `fe80::3`.

:::expected
The /128 is installed because Gi0/1 is up, and it wins for PC-B's address despite distance 200, because it is the longest match. No device on that link owns `fe80::2`, so R1 cannot resolve the next hop and the ping to PC-B fails. `2001:db8:20::1` is outside the /128 and still works through the /64.

In `show ipv6 neighbors`, `FE80::2` on Gi0/1 shows as `INCMP` or is missing. `FE80::2` on Gi0/0 is a different neighbor. If Packet Tracer delivers the ping anyway, the mismatch is still visible in the configuration: R2's Gi0/1 is `fe80::3`.
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
`show ipv6 route` followed by an address shows the one route R1 uses for that destination: here the /128 through `FE80::3` on Gi0/1. If Packet Tracer rejects the command, read the full table. PC-A reaches PC-B over the backup link, and the reply returns over the primary because R2 still uses its distance-1 route. Different paths in each direction are fine. The /64 still serves the rest of LAN B.
:::

```state
{"status":"Host route repaired","tone":"ok","focus":["R1"],"flows":[{"path":["PCA","SW1","R1","R2","SW2","PCB"],"via":[null,null,3,null,null],"label":"PC-A pings PC-B","tags":{"R1":"/128 · fe80::3 on Gi0/1"}},{"path":["PCB","SW2","R2","R1","SW1","PCA"],"via":[null,null,2,null,null],"tone":"reply","label":"Reply over the primary","tags":{"R2":"2001:db8:10::/64 via fe80::1 Gi0/0"}}],"rows":[["R1 → 2001:db8:20::12","/128 via fe80::3 Gi0/1","ok"],["Rest of LAN B","/64 via fe80::2 Gi0/0"],["Reply path","Primary: a valid asymmetry"]]}
```

## Step 11: Add a real destination for a default route

A default route needs a destination that no other route covers. Create one on R2 with a loopback, a virtual interface that is up whenever the router is:

```ios R2
R2# configure terminal
R2(config)# interface loopback0
R2(config-if)# ipv6 address 2001:db8:99::8/128
R2(config-if)# end
R2# show ipv6 route
```

From PC-A, ping `2001:db8:99::8` before adding a default to R1.

:::expected
R2 lists the loopback address as a /128. The PC ping fails: R1 has no route that covers `2001:db8:99::8` and no default, so it drops the packet. Confirm that in R1's table.
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
R1 lists `::/0 [1/0]` through `FE80::2` on Gi0/0. PC-A's ping to `2001:db8:99::8` now succeeds, because R2 already has a return route to LAN A. Traffic to PC-B still uses the /128: a default route never overrides a more specific one.
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
R1 keeps its primary and floating routes to LAN B, and R2 keeps its primary and floating routes to LAN A. The host route, the default route and the loopback are gone. Confirm the PC-to-PC ping once more.
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
Both routers report `[OK]`. Then save the Packet Tracer project as `20-ipv6-static-baseline.pkt`. Saving the project file does not save a router's running configuration, so do both.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R1","R2"],"chips":[{"node":"R1","text":"startup-config saved","tone":"ok"},{"node":"R2","text":"startup-config saved","tone":"ok"}],"rows":[["R1, R2","copy running-config startup-config","ok"],["Project","20-ipv6-static-baseline.pkt","ok"],["Kept","Primary + floating routes on each"]]}
```

## Troubleshooting

- **No local transit connectivity:** check the cable endpoints, interface state and exact /64 addresses before adding a route.
- **A link-local route is rejected:** include the local exit interface. Valid syntax still needs the correct neighbor on that link.
- **An installed route does not deliver:** compare the scoped next hop against the peer's interface, generate traffic, and inspect neighbor resolution. Then check downstream and return routes.
- **Router pings work but PC pings fail:** confirm the source used by the router, the return prefix for the PC, both PC gateways and `ipv6 unicast-routing`.
- **The backup route never appears:** it is installed only when the primary route leaves the table. Check that the primary's exit interface is really down and that the backup interface is up.
- **Both routes are installed at distance 1:** the backup was entered without its distance. Remove it and add it again with `5` at the end.
- **One address fails while the rest of the LAN works:** check for a more specific /128 overriding the working /64.

## Challenge

In a copy of the cleaned baseline, add a **new service destination** `2001:db8:77::7/128` on R2 Loopback7. PC-A must reach only that new host prefix using primary R1 Gi0/0, with R1 Gi0/1 as a distance-25 standby. Use link-local next hops. Do not add a default route or widen the host prefix. Preserve all existing LAN routes and R2's primary/floating return routes.

Before configuring anything, write the two R1 routes with their next hops and interfaces, the route used while the primary is up, and the route used after it fails. Explain why R2's existing routes to LAN A are enough for the replies. Then work in three phases:

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
