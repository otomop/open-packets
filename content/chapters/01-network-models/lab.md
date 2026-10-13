---
title: Follow an IPv4 exchange across two LANs
environment: packet-tracer
devices: ["1 × 2911 router (R1)", "2 × Catalyst 2960 (SW1, SW2)", "2 × PC-PT (PC-A, PC-B)"]
minutes: 45
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build two Ethernet LANs connected by one router. Observe address resolution and packet forwarding, then introduce a return-path fault. PC-B fills the destination-host role called Server-B in the lesson; no application server is needed for an ICMP test.

The router addressing commands in Steps 1–2 are supplied setup, not a command-memory test. Read what each line selects or changes, then use the network to observe forwarding. Chapter 04 develops IPv4 addressing, and Chapter 08 develops a fuller IOS workflow. For this /24 example, addresses with the same first three decimal numbers belong to the same subnet; use the given plan rather than designing your own yet.

Use a new project with the listed device models. The commands assume their interface names. Record the actual MAC addresses assigned by your simulator: they will differ from the illustrative addresses in the lesson. Event order, packet counts, and timing may also vary.

## Topology

```diagram
{ "type": "topology", "title": "Two LANs joined by R1",
  "caption": "SW1 and SW2 provide separate Layer 2 LANs. R1 has one interface in each subnet.",
  "nodes": [
    { "id": "PCA", "kind": "pc", "label": "PC-A", "sub": "192.168.10.10/24", "x": 1, "y": 3 },
    { "id": "SW1", "kind": "switch", "label": "SW1", "x": 3.5, "y": 3 },
    { "id": "R1", "kind": "router", "label": "R1", "sub": "2911", "x": 6, "y": 3, "highlight": true },
    { "id": "SW2", "kind": "switch", "label": "SW2", "x": 8.5, "y": 3 },
    { "id": "PCB", "kind": "pc", "label": "PC-B", "sub": "192.168.20.20/24", "x": 11, "y": 3 }
  ],
  "links": [
    { "from": "PCA", "to": "SW1", "label": "Copper straight-through", "fromLabel": "Fa0", "toLabel": "Fa0/1" },
    { "from": "SW1", "to": "R1", "label": "Copper straight-through", "fromLabel": "Fa0/24", "toLabel": "Gi0/0" },
    { "from": "R1", "to": "SW2", "label": "Copper straight-through", "fromLabel": "Gi0/1", "toLabel": "Fa0/24" },
    { "from": "SW2", "to": "PCB", "label": "Copper straight-through", "fromLabel": "Fa0/1", "toLabel": "Fa0" }
  ] }
```

Use copper straight-through cables for all four PC-to-switch and router-to-switch links shown. Select the ports explicitly.

| Device | Interface | IPv4 address | Mask | Gateway |
|---|---|---|---|---|
| PC-A | FastEthernet0 | 192.168.10.10 | 255.255.255.0 | 192.168.10.1 |
| R1 | GigabitEthernet0/0 | 192.168.10.1 | 255.255.255.0 | — |
| R1 | GigabitEthernet0/1 | 192.168.20.1 | 255.255.255.0 | — |
| PC-B | FastEthernet0 | 192.168.20.20 | 255.255.255.0 | 192.168.20.1 |

The switches use their default access VLAN for these separate LANs. They need no management IP address for this exercise. R1 needs no static or default route to reach its two directly connected subnets.

## Step 1: Build and label the topology

Place and cable the devices as shown. Set their workspace display names. Open each network device's CLI and decline the initial configuration dialog if it appears. Configure the hostnames:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# end
```

On SW1 and SW2, use the same sequence with `hostname SW1` and `hostname SW2`, respectively. Inspect the cable endpoints before continuing. Router interfaces may initially remain administratively disabled.

:::expected
There are two separate switch LANs with R1 between them. The CLI hostnames match the labels, and you can identify R1's interface toward each subnet.
:::

```state
{"status":"Built · named","cabled":true,"addressed":false,"down":["R1"],"focus":["SW1","R1","SW2"],"chips":[{"node":"SW1","text":"SW1#"},{"node":"R1","text":"R1#"},{"node":"SW2","text":"SW2#"}],"rows":[["LANs","Two, with R1 between them"],["CLI hostnames","R1, SW1, SW2"],["R1 interfaces","May still be administratively disabled","dim"]]}
```

## Step 2: Apply the supplied router setup

Each interface needs the address from its own row. The `interface` command selects a port; `ip address` gives it an address and mask; `no shutdown` enables it. `description` is a label. These two active local interfaces give R1 routes to the attached LANs without a routing protocol or static route.

```ios R1
R1# configure terminal
R1(config)# interface GigabitEthernet0/0
R1(config-if)# description LAN-A
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface GigabitEthernet0/1
R1(config-if)# description LAN-B
R1(config-if)# ip address 192.168.20.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show ip route
R1# copy running-config startup-config
```

Accept the save command's default destination. Once links are ready, verify that both configured interfaces report **up/up** and that the routing table contains connected routes for **192.168.10.0/24** and **192.168.20.0/24**. Some IOS versions also display local /32 routes for the router's own addresses.

:::expected
R1 has an operational interface and a connected route for each LAN. No route learned from another router is required in this topology. If a connected route is absent, check the address and interface state before adding unrelated routing commands.
:::

```state
{"status":"R1 interfaces up","tone":"ok","cabled":true,"addressed":false,"wake":["R1"],"focus":["R1"],"chips":[{"node":"R1","text":"R1#","tone":"ok"}],"rows":[["Gi0/0 · LAN-A","192.168.10.1 · up/up","ok"],["Gi0/1 · LAN-B","192.168.20.1 · up/up","ok"],["Connected routes","192.168.10.0/24, 192.168.20.0/24","ok"],["R1 configuration","Saved to startup-config"]]}
```

## Step 3: Configure the hosts and record the baseline

On each PC, use **Desktop → IP Configuration** to enter the table's address, mask, and gateway. Read the settings back to catch typing errors.

Save each switch's configuration, then save the project as **01-models-ready.pkt**. Do not initiate test traffic yet: the next step is intended to capture the first exchange. Normal background traffic or earlier tests may already have populated some tables; that is an observation to record, not an error.

Before starting the ping, predict:

- Which IPv4 address PC-A will resolve through ARP for a packet destined for PC-B.
- The source and destination IPv4 addresses of the request.
- Which device will replace the Ethernet header and decrement the IPv4 TTL.

:::expected
Your prediction is: PC-A uses gateway 192.168.10.1 as its next hop; the request's IP addresses are 192.168.10.10 and 192.168.20.20; R1 performs the routed forwarding step.
:::

```state
{"status":"Hosts ready","cabled":true,"addressed":true,"focus":["PCA","PCB"],"chips":[{"node":"PCA","text":"gateway 192.168.10.1"},{"node":"PCB","text":"gateway 192.168.20.1"}],"rows":[["PC-A resolves (predict)","192.168.10.1, its gateway"],["Request IPs (predict)","192.168.10.10 → 192.168.20.20"],["Routed step (predict)","R1"],["Project file","01-models-ready.pkt"]]}
```

## Step 4: Observe the first remote exchange

Switch to **Simulation** mode. Open the event filters and select **ARP** and **ICMP** to keep the display manageable. From PC-A's Command Prompt, run:

```text
ping 192.168.20.20
```

Use **Capture/Forward**, or the equivalent step control in your version, to advance events. Open the event or PDU details at PC-A, R1's incoming side, and R1's outgoing side. Inspect the available Layer 2 and Layer 3 fields.

Before opening the outgoing event, predict which incoming fields must change. Then record the request's source MAC, destination MAC, source IP, destination IP, and TTL on both sides of R1. Also record the ARP target addresses if requests appear. A cached mapping can eliminate an ARP exchange; do not invent a missing packet or assume that every ping must generate fresh ARP.

:::expected
On LAN-A, the ICMP request frame is addressed to R1's LAN-A MAC. On LAN-B, the outgoing frame uses R1's LAN-B MAC as source and PC-B's MAC as destination. The request's IP addresses remain unchanged, and normal forwarding through R1 reduces its TTL by one. Any necessary ARP on LAN-B is a separate local exchange initiated there.
:::

If your version does not expose all fields, use this **supplied worksheet** for the missing comparison. It is not an observed capture. The device labels stand for interface MAC addresses.

| Location of the same request | Ethernet source → destination | IPv4 source → destination | TTL |
|---|---|---|---|
| LAN-A, before R1 | PC-A → R1 Gi0/0 | 192.168.10.10 → 192.168.20.20 | 128 |
| LAN-B, after R1 | R1 Gi0/1 → PC-B | 192.168.10.10 → 192.168.20.20 | 127 |

Classify each change as **unchanged**, **new local-link encapsulation**, or **decremented**. Keep supplied values separate from actual observations.

```state
{"status":"Routed through R1","tone":"ok","cabled":true,"addressed":true,"focus":["R1"],"flows":[{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings 192.168.20.20","tags":{"PCA":"Frame to R1's LAN-A MAC","R1":"New frame to PC-B's MAC · TTL − 1"}}],"rows":[["Ethernet, before R1","PC-A → R1 Gi0/0"],["Ethernet, after R1","R1 Gi0/1 → PC-B"],["IPv4, both sides","192.168.10.10 → 192.168.20.20"],["TTL (worksheet)","128 → 127"]]}
```

## Step 5: Compare local and remote delivery

Allow the first test to finish, then use Realtime mode for a repeat ping from PC-A to PC-B. Also test PC-A to **192.168.10.1**, its local gateway address. Return to Simulation mode if needed to inspect that local request.

Compare the two packets. Their outgoing frames can use the same destination MAC, but their destination IP addresses differ. A packet addressed to 192.168.10.1 is for R1 itself; a packet addressed to 192.168.20.20 is to be forwarded toward PC-B.

:::expected
Both tests receive replies after the topology is ready. You can distinguish “using the router as next hop” from “addressing the router as the IP destination.” A gateway MAC in a frame does not imply that the packet's destination IP is the gateway.
:::

```state
{"status":"Local and remote","tone":"ok","cabled":true,"addressed":true,"focus":["PCA","R1"],"flows":[{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"Repeat ping 192.168.20.20","tags":{"PCA":"R1 LAN-A MAC · to 192.168.20.20","R1":"Forwards toward PC-B"}},{"path":["PCA","SW1","R1"],"back":true,"label":"Ping 192.168.10.1","tags":{"PCA":"R1 LAN-A MAC · to 192.168.10.1"},"backTags":{"R1":"Request was for R1 itself"}}],"rows":[["To 192.168.20.20","Forwarded toward PC-B","ok"],["To 192.168.10.1","For R1 itself","ok"],["Frame destination, both","R1's LAN-A MAC"]]}
```

## Step 6: Read the three tables

Collect the following evidence:

```ios R1
R1# show ip route
R1# show arp
```

```ios SW1
SW1# show mac address-table
```

```ios SW2
SW2# show mac address-table
```

On each PC, run `arp -a`. Match actual MAC addresses to the devices using the tables and the device interface information. For each table, record one row and label its relationship: prefix with forwarding information, IP with MAC, or VLAN/MAC with switch port. Learn which question a table answers, rather than memorizing every column.

:::expected
SW1 learns PC-A's MAC on Fa0/1 and R1's LAN-A MAC on Fa0/24 when it receives frames from them. SW2 makes the equivalent local observations. R1 can hold ARP mappings for neighbors on both LANs. PC-A normally needs the local gateway mapping for the remote test, not PC-B's MAC.
:::

```state
{"status":"Three tables","cabled":true,"addressed":true,"focus":["R1","SW1","SW2"],"chips":[{"node":"PCA","text":"arp -a"},{"node":"SW1","text":"show mac address-table"},{"node":"R1","text":"show ip route · show arp"},{"node":"SW2","text":"show mac address-table"},{"node":"PCB","text":"arp -a"}],"rows":[["Routing table","Prefix → forwarding information"],["ARP table","IP → MAC"],["MAC address table","VLAN/MAC → switch port"],["SW1 learns","PC-A on Fa0/1 · R1 LAN-A on Fa0/24"]]}
```

## Step 7: Introduce a return-path fault

In PC-B's IP Configuration, change only the gateway from **192.168.20.1** to the unused address **192.168.20.254**. Keep its address and mask unchanged. Allow existing tests to finish.

From PC-B, ping its local router interface, **192.168.20.1**. Then, from PC-A, ping PC-B again. If helpful, inspect ICMP and ARP events in Simulation mode.

:::expected
PC-B can still reach 192.168.20.1 directly because that destination is local. The remote PC-A-to-PC-B exchange fails: PC-B's reply to 192.168.10.10 needs an off-subnet next hop, and its configured gateway is unavailable. A request arriving at PC-B does not guarantee a reply can return.
:::

If your results differ, verify that no extra routes, gateways, devices using .254, or previous topology changes exist. Compare the actual host settings and event details before drawing a conclusion.

```state
{"status":"Return-path fault","tone":"bad","cabled":true,"addressed":true,"focus":["PCB"],"flows":[{"event":["PCB"],"wait":1.6,"tags":{"PCB":"Gateway set to 192.168.20.254"}},{"path":["PCB","SW2","R1"],"back":true,"label":"PC-B pings 192.168.20.1","tags":{"PCB":"Local destination · direct"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings PC-B","backStop":"PCB","backStopText":"Reply off subnet · gateway unavailable"}],"chips":[{"node":"PCB","text":"gateway 192.168.20.1","until":0},{"node":"PCB","text":"gateway 192.168.20.254","tone":"bad","from":0}],"rows":[["PC-B to 192.168.20.1","Replies: local destination","ok"],["PC-A to PC-B","No reply: gateway unavailable","bad"],["Changed","PC-B gateway only"]]}
```

## Step 8: Restore and verify

Restore PC-B's gateway to **192.168.20.1**. Test PC-A to PC-B and PC-B to PC-A. Inspect the addressing settings and router interface summary once more. Save the completed project as **01-models-complete.pkt**.

:::expected
Both remote tests receive replies, and the configuration matches the original plan. Your lab record identifies the fault, the evidence that isolated it, the single setting corrected, and the successful retest.
:::

```state
{"status":"Restored","tone":"ok","cabled":true,"addressed":true,"focus":["PCB"],"flows":[{"event":["PCB"],"wait":1.6,"tags":{"PCB":"Gateway back to 192.168.20.1"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings PC-B","backTags":{"PCB":"Reply via gateway 192.168.20.1"}},{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings PC-A"}],"chips":[{"node":"PCB","text":"gateway 192.168.20.254","tone":"bad","until":0},{"node":"PCB","text":"gateway 192.168.20.1","tone":"ok","from":0}],"rows":[["PC-A ↔ PC-B","Replies both ways","ok"],["PC-B gateway","192.168.20.1, as planned","ok"],["Project file","01-models-complete.pkt"]]}
```

## Troubleshooting

| Symptom | Useful checks |
|---|---|
| Router link stays down | Actual cable endpoints, peer port, interface address context, and `no shutdown`; inspect `show ip interface brief`. |
| A connected subnet is missing | Verify the address/mask and operational state of that subnet's router interface. |
| Local gateway replies but the remote host does not | Check both hosts' settings, both LANs, R1's routes, and the return path. |
| No ARP request appears during a later ping | Inspect existing ARP entries; cached mappings can be reused. |
| Packet details differ from the lesson | Use your actual MACs and initial TTL; compare the forwarding changes, not fixed sample values. |
| One early timeout followed by replies | Note the timing and resolution events; investigate if loss persists instead of treating the first timeout as a diagnosis. |

## Challenge

Your evidence record should contain a before/after frame comparison, one labeled row from each table, and local/remote tests before and after the gateway repair. Identify any supplied rather than observed values.

Add PC-C on SW1 Fa0/2 with **192.168.10.30/24** and gateway **192.168.10.1**. Predict the ARP target and frame destination for PC-A sending to PC-C, then compare them with PC-A sending to PC-B.

Before changing a setting, predict whether each test should work if PC-A has no default gateway. Temporarily remove PC-A's gateway, repeat the local PC-C and remote PC-B tests, and record the results. Restore PC-A's gateway to 192.168.10.1, verify both tests again, and save only the restored state. Complete these predictions and observations before opening the answer below.

:::solution
For PC-C, PC-A resolves 192.168.10.30 and sends directly to PC-C's MAC. For PC-B, it resolves or reuses the gateway mapping. With PC-A's gateway removed, communication with PC-C should remain possible, while PC-A has no route to PC-B in this simple host configuration. Restoring 192.168.10.1 as PC-A's gateway restores its remote next hop; verify both tests before saving.
:::
