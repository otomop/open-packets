---
title: Configure two LANs and isolate address, mask, and gateway faults
environment: packet-tracer
devices: ["1 × Cisco 2911 router (R1)", "2 × Catalyst 2960 switches (SW1, SW2)", "3 × PC-PT devices (PC-A, PC-C, PC-B)"]
minutes: 65
---
Calculate two directly connected LANs, compare your predictions with the configured devices, and isolate a gateway fault without changing unrelated settings. Finish by adding a third LAN from a fresh prefix. The IOS commands are supplied as guided setup; address calculations and verification are your work. No VLAN, static-route, routing-protocol or DNS configuration is needed.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Keep a worksheet with four parts: calculated address plan, predicted next hops, actual test results, and the independent challenge. Before opening an answer, write a result and the rule that produced it. Correct an error in the worksheet before applying its values to a device. The estimated time includes that reasoning; this is not a speed test.

This procedure has been checked against the address plan and Cisco command documentation, but was not executed in Packet Tracer during this review. Output excerpts are representative. Compare addresses, prefixes, and interface state rather than exact spacing, message timing, or TTL values.

## Topology

```diagram
{ "type": "topology", "title": "Two LANs with one router", "caption": "PC-A and PC-C share LAN-A; PC-B is reached through R1 on LAN-B.",
  "nodes": [
    { "id": "A", "kind": "pc", "label": "PC-A", "sub": "192.168.44.130/26", "x": 1, "y": 1 },
    { "id": "C", "kind": "pc", "label": "PC-C", "sub": "192.168.44.150/26", "x": 1, "y": 5 },
    { "id": "S1", "kind": "switch", "label": "SW1", "x": 3.5, "y": 3 },
    { "id": "R", "kind": "router", "label": "R1 · 2911", "x": 6, "y": 3 },
    { "id": "S2", "kind": "switch", "label": "SW2", "x": 8.5, "y": 3 },
    { "id": "B", "kind": "pc", "label": "PC-B", "sub": "192.168.44.194/27", "x": 11, "y": 3 }
  ],
  "links": [
    { "from": "A", "to": "S1", "fromLabel": "Fa0", "toLabel": "Fa0/1" },
    { "from": "C", "to": "S1", "fromLabel": "Fa0", "toLabel": "Fa0/2" },
    { "from": "S1", "to": "R", "fromLabel": "Fa0/24", "toLabel": "Gi0/0" },
    { "from": "R", "to": "S2", "fromLabel": "Gi0/1", "toLabel": "Fa0/24" },
    { "from": "S2", "to": "B", "fromLabel": "Fa0/1", "toLabel": "Fa0" }
  ] }
```

Use copper straight-through for all five links. The Packet Tracer automatic connection tool is an alternative. Gi0/2 on R1 remains unused during the required exercise.

## Step 1: Calculate the plan, then build the devices

First work from these requirements without looking at the completed table below. LAN-A must contain PC-A `192.168.44.130/26` and PC-C `192.168.44.150/26`. LAN-B must contain PC-B `192.168.44.194/27`. Use the first usable address of each subnet on R1.

| Work to record | LAN-A | LAN-B |
|---|---|---|
| Dotted mask and host-bit count | Calculate | Calculate |
| Network and broadcast | Calculate | Calculate |
| Usable range and total usable addresses | Calculate | Calculate |
| R1 gateway and whether each PC is a valid unique host | Decide | Decide |

Compare both complete ranges to establish that they do not overlap. From PC-A, classify `.150` and `.194` as local or remote. Assuming an empty ARP cache and no extra host routes, write which IP address PC-A would resolve for each destination. Do not change a packet's destination IP merely because it needs a gateway.

After recording your answers, compare with the answer table. Then start a new Packet Tracer file and place the specified models. Rename the workspace labels so the devices match the diagram. Connect each listed port. On the router's CLI tab, decline the initial configuration dialog if it appears, then press Enter to obtain `Router>`.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# end
```

:::solution
LAN-A has six host bits, 64 total addresses and 62 usable. LAN-B has five host bits, 32 total and 30 usable. Their calculated ranges and the working device values are:

| Device/interface | IPv4 address | Mask | Default gateway |
|---|---|---|---|
| R1 Gi0/0 | `192.168.44.129` | `255.255.255.192` | Not needed for these connected LANs |
| R1 Gi0/1 | `192.168.44.193` | `255.255.255.224` | Not needed for these connected LANs |
| PC-A Fa0 | `192.168.44.130` | `255.255.255.192` | `192.168.44.129` |
| PC-C Fa0 | `192.168.44.150` | `255.255.255.192` | `192.168.44.129` |
| PC-B Fa0 | `192.168.44.194` | `255.255.255.224` | `192.168.44.193` |

LAN-A is `192.168.44.128/26`: hosts .129–.190, broadcast .191. LAN-B is `192.168.44.192/27`: hosts .193–.222, broadcast .223. These ranges do not overlap.

PC-A resolves local PC-C `.150` directly. For remote PC-B `.194`, it resolves its gateway `.129`; the packet destination stays `.194`.

The router prompt is now `R1#`. Switch links may initially be amber while ports transition to forwarding. Router-facing links may stay down until you enable R1's interfaces. Device labels and port connections match the diagram.
:::

```state
{"status":"Built · plan calculated","cabled":true,"addressed":false,"led":true,"down":["R"],"focus":["R"],"chips":[{"node":"R","text":"R1#"}],"rows":[["LAN-A","PC-A 192.168.44.130/26 · PC-C .150/26"],["LAN-B","PC-B 192.168.44.194/27"],["R1 on each LAN","First usable address"],["Router-facing links","May stay down until enabled","dim"]]}
```

## Step 2: Address R1's two interfaces

Configure one LAN at a time. `exit` returns from interface configuration to global configuration; `end` returns to privileged EXEC mode.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# description LAN-A
R1(config-if)# ip address 192.168.44.129 255.255.255.192
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# description LAN-B
R1(config-if)# ip address 192.168.44.193 255.255.255.224
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

:::expected
Gi0/0 displays .129 and Gi0/1 displays .193. With the cables and switch ports ready, both interfaces become up/up. If either remains administratively down, return to that interface and check `no shutdown`. An enabled interface that remains down needs a link check.
:::

```state
{"status":"R1 interfaces up","tone":"ok","addressed":false,"wake":["R"],"focus":["R"],"chips":[{"node":"R","text":"Gi0/0 .129 · Gi0/1 .193","tone":"ok"}],"rows":[["Gi0/0 · LAN-A","192.168.44.129/26 · up/up","ok"],["Gi0/1 · LAN-B","192.168.44.193/27 · up/up","ok"]]}
```

## Step 3: Address the PCs

For each PC, open **Desktop → IP Configuration**, select **Static**, and enter all three values from the table. Read the mask field after entering the address; replace any automatically supplied value with the planned mask. DNS is not needed because this exercise uses IP addresses directly.

On each PC, open **Desktop → Command Prompt** and run:

```text
ipconfig
```

:::expected
PC-A and PC-C show mask 255.255.255.192 and gateway 192.168.44.129. PC-B shows mask 255.255.255.224 and gateway 192.168.44.193. All three host addresses are unique and lie within the appropriate usable range.
:::

```state
{"status":"PCs addressed","tone":"ok","addressed":true,"focus":["A","C","B"],"chips":[{"node":"A","text":"gateway 192.168.44.129"},{"node":"C","text":"gateway 192.168.44.129"},{"node":"B","text":"gateway 192.168.44.193"}],"rows":[["PC-A, PC-C","255.255.255.192 · gw .129","ok"],["PC-B","255.255.255.224 · gw .193","ok"],["DNS","Not needed","dim"]]}
```

## Step 4: Verify the masks with the right commands

On R1, inspect both the operational prefix and the configured dotted mask.

```ios R1
R1# show ip interface gigabitethernet0/0
R1# show ip interface gigabitethernet0/1
R1# show running-config
R1# show ip route
```

:::expected
The detailed interface output identifies .129/26 and .193/27. In the full running configuration, find each interface heading and its `ip address` line. Representative connected-route lines are:
```output R1# show ip route
C        192.168.44.128/26 is directly connected, GigabitEthernet0/0  ← LAN-A
C        192.168.44.192/27 is directly connected, GigabitEthernet0/1  ← LAN-B
```
Additional local /32 routes may appear. If your image omits a detailed command, use the running configuration for the mask and the routing table for the resulting subnet.
:::

```state
{"status":"Masks verified","tone":"ok","focus":["R"],"chips":[{"node":"R","text":".129/26 · .193/27","tone":"ok"}],"rows":[["C 192.168.44.128/26","Gi0/0 · LAN-A","ok"],["C 192.168.44.192/27","Gi0/1 · LAN-B","ok"],["Dotted masks","ip address lines in running-config"]]}
```

## Step 5: Test local and remote communication

Before testing, complete the Prediction column below using your Step 1 calculation. Record actual replies only after running the commands. A local-router ping and a cross-LAN ping exercise different decisions.

| Source → destination | Prediction and local next hop | Actual result |
|---|---|---|
| PC-A → `.129` | Write before testing | Record |
| PC-A → `.150` | Write before testing | Record |
| PC-A → `.194` | Write before testing | Record |
| PC-B → `.193` | Write before testing | Record |
| PC-B → `.130` | Write before testing | Record |

On PC-A, test its gateway, its local peer, and the remote host, in that order.

```text PC-A
ping 192.168.44.129
ping 192.168.44.150
ping 192.168.44.194
```

Then test the return direction from PC-B.

```text PC-B
ping 192.168.44.193
ping 192.168.44.130
```

:::expected
After links settle, repeated tests receive replies. Initial ARP resolution can delay an early reply; repeat once before diagnosing persistent loss. PC-A reaches PC-C directly on LAN-A, while traffic between PC-A and PC-B crosses R1. A successful echo request and reply tests both forward and return paths for that exchange. Read both PC masks and gateways as well: ping alone does not verify every setting.

Stop here if repeated tests fail. Use the troubleshooting checks before introducing a deliberate fault. Once the baseline works, save a checkpoint with Packet Tracer's Save As, named `ipv4-two-lans-baseline.pkt`.
:::

```state
{"status":"Local and remote work","tone":"ok","focus":["A","R"],"flows":[{"path":["A","S1","R"],"back":true,"label":"PC-A pings gateway 192.168.44.129","tags":{"A":"Local · next hop .129"}},{"path":["A","S1","C"],"back":true,"label":"PC-A pings 192.168.44.150","tags":{"A":"Local · next hop .150"}},{"path":["A","S1","R","S2","B"],"back":true,"label":"PC-A pings 192.168.44.194","tags":{"A":"Remote · next hop gateway .129","R":"C 192.168.44.192/27 → Gi0/1"},"backTags":{"B":"Remote · next hop gateway .193","R":"C 192.168.44.128/26 → Gi0/0"}}],"rows":[["PC-A → .129, .150","Replies · local","ok"],["PC-A → .194","Replies · crosses R1","ok"],["PC-B → .193, .130","Replies","ok"],["Checkpoint","ipv4-two-lans-baseline.pkt"]]}
```

## Step 6: Observe rejection of an invalid address

Before entering anything, calculate the network and broadcast of `192.168.44.224/27` and predict whether `.224` can be a host. Use unused Gi0/2 to try the network address of that /27. This isolates the test from the working LANs. Read the router's response, then inspect the interface.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/2
R1(config-if)# ip address 192.168.44.224 255.255.255.224
R1(config-if)# end
R1# show running-config
R1# show ip interface brief
```

:::expected
The proposed address has all host bits zero. IOS should reject it as an invalid host address; exact error wording varies by image. Gi0/2 should remain unassigned, and Gi0/0 and Gi0/1 retain their working addresses. Do not interpret a prompt returning as proof that the command succeeded.
:::

```state
{"status":"Invalid host rejected","tone":"warn","focus":["R"],"chips":[{"node":"R","text":"Gi0/2 .224/27 rejected","tone":"warn"}],"rows":[["192.168.44.224/27","Network address · host bits all zero"],["Gi0/2","Stays unassigned","ok"],["Gi0/0, Gi0/1","Keep .129 and .193","ok"]]}
```

## Step 7: Introduce a gateway fault and record the symptoms

Predict the effect of replacing only PC-A's gateway with an unused but otherwise valid local address. In your worksheet, add separate columns for **before fault**, **during fault**, and **after repair** for the three destinations below. Leave the last column blank until Step 8.

On PC-A only, change the default gateway to `192.168.44.190`. Leave its address and /26 mask unchanged. No device in this topology uses .190, although it is a valid address within LAN-A. Do not change R1 or either other PC.

```text PC-A
ipconfig
ping 192.168.44.150
ping 192.168.44.129
ping 192.168.44.194
```

:::expected
The local peer .150 and the router's actual local address .129 should still respond. The remote PC .194 should fail because the configured next hop .190 is unused. This shows why merely pinging the actual router address does not prove that the default-gateway field is correct. Record your results before proceeding.
:::

```state
{"status":"Gateway fault on PC-A","tone":"bad","focus":["A"],"chips":[{"node":"A","text":"gateway 192.168.44.190","tone":"bad"}],"flows":[{"path":["A","S1","C"],"back":true,"label":"PC-A pings 192.168.44.150","tags":{"A":"Local · next hop .150"}},{"path":["A","S1","R"],"back":true,"label":"PC-A pings 192.168.44.129","tags":{"A":"Local · gateway setting not used"}},{"path":["A","S1"],"label":"PC-A pings 192.168.44.194","stop":"A","stopText":"Remote · next hop .190 is unused"}],"rows":[["PC-A → .150, .129","Still reply","ok"],["PC-A → .194","Fails","bad"],["PC-A address and mask","Unchanged · .130/26"]]}
```

## Step 8: Restore the gateway and check mask decisions

Restore PC-A's gateway to `192.168.44.129`. Confirm the mask remains `255.255.255.192`, then repeat the same local and remote tests.

```text PC-A
ipconfig
ping 192.168.44.150
ping 192.168.44.129
ping 192.168.44.194
```

On paper, now consider a /24 mask on PC-A without applying it: would .194 be local or remote? Which address would PC-A try to resolve with ARP?

:::expected
Remote communication works again after the gateway correction. Complete the after-repair column and compare all three states; the two local tests should not need a router or peer address change. Under the hypothetical /24, .194 would appear local, so PC-A would ARP for .194 rather than its gateway. Whether that incorrect configuration happens to work can depend on proxy ARP. The required lab does not rely on Packet Tracer implementing that optional behavior.
:::

```state
{"status":"Gateway restored","tone":"ok","focus":["A"],"chips":[{"node":"A","text":"gateway 192.168.44.190","tone":"bad","until":0},{"node":"A","text":"gateway 192.168.44.129","tone":"ok","from":0}],"flows":[{"event":["A"],"wait":1.6,"tags":{"A":"Gateway .190 → .129 · /26 kept"}},{"path":["A","S1","C"],"back":true,"label":"PC-A pings 192.168.44.150"},{"path":["A","S1","R"],"back":true,"label":"PC-A pings 192.168.44.129"},{"path":["A","S1","R","S2","B"],"back":true,"label":"PC-A pings 192.168.44.194","tags":{"A":"Remote · next hop gateway .129","R":"C 192.168.44.192/27 → Gi0/1"}}],"rows":[["PC-A → .150, .129, .194","All reply","ok"],["PC-A mask","255.255.255.192","ok"],["On paper: PC-A as /24",".194 local · ARP for .194"]]}
```

## Step 9: Restore and save

Confirm all three PCs match the original address table and the unused Gi0/2 has no address. Save the router configuration, then save the Packet Tracer file.

```ios R1
R1# copy running-config startup-config
```

:::expected
Accept the default destination filename when prompted. Save as `ipv4-two-lans.pkt`. Run the local and remote PC-A tests once more. The saved file is your known working baseline for later exercises.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R"],"chips":[{"node":"R","text":"startup-config saved","tone":"ok"}],"flows":[{"path":["A","S1","C"],"back":true,"label":"Local test · PC-A to PC-C"},{"path":["A","S1","R","S2","B"],"back":true,"label":"Remote test · PC-A to PC-B"}],"rows":[["PCs","Match the address table","ok"],["R1 Gi0/2","No address","ok"],["Saved","startup-config · ipv4-two-lans.pkt","ok"]]}
```

## Troubleshooting

- A local gateway fails: check cable and port assignments, R1's state, and the PC's address and mask before changing routes.
- Local hosts respond but a remote host fails: inspect both gateway fields and both masks. Read the fields even if they look familiar.
- A connected route is absent: verify the address and mask, then confirm that its interface and line protocol are up.
- A command is rejected: record the message and check the retained configuration; do not continue on the assumption that it took effect.
- One initial echo is lost: allow links to settle and repeat. Persistent failure needs investigation.
- A device model has different interface names: use the specified 2911 and 2960 models or adapt the port table before configuring anything.

## Challenge

Save the working baseline, then use Save As to create `ipv4-third-lan-challenge.pkt`. Work from the new requirement without copying an earlier address command. Add a third 2960 switch and one PC-PT to the unused R1 Gi0/2, using straight-through cables from Gi0/2 to switch Fa0/24 and from switch Fa0/1 to PC Fa0. The new LAN must contain `10.7.19.77/21`. Calculate its network, broadcast, usable range, and first usable gateway. Configure the PC with the given host address and the router with that gateway. Test the new gateway and PC-A.

Before configuring, write the complete router command and PC settings from your calculation. Decide whether `10.7.23.250` and `10.7.24.1` are members of the new subnet. These two addresses are paper membership tests; no devices are assigned to them.

Your exit evidence must include the new connected prefix on Gi0/2, the new PC's recorded settings, a successful new-PC-to-gateway test, and pings between the new PC and PC-A in both directions. Recheck PC-A to PC-B to show that the existing LANs still work. Use the solution only after you have written your own configuration.

:::solution
Mask: `255.255.248.0`. Network: `10.7.16.0/21`. Broadcast: `10.7.23.255`. Usable range: `10.7.16.1–10.7.23.254`, or 2,046 addresses. Configure Gi0/2 with `ip address 10.7.16.1 255.255.248.0` and `no shutdown`. The PC uses `10.7.19.77`, the same mask, and gateway `10.7.16.1`. Address .23.250 is inside; `10.7.24.1` is the first usable address of the next /21. With links up and the correct host settings, R1 has `10.7.16.0/21` connected on Gi0/2 and routes between the three LANs. On the new PC, ping `10.7.16.1` and `192.168.44.130`; on PC-A, ping `10.7.19.77` and `192.168.44.194`. The supplied gateway command goes under `interface gigabitethernet0/2` after `configure terminal`; use `end` before show commands. Save R1's startup configuration and the challenge file only after these checks.
:::
