---
title: Follow an IPv4 exchange across two LANs
environment: packet-tracer
devices: ["1 × 2911 router (R1)", "2 × Catalyst 2960 (SW1, SW2)", "2 × PC-PT (PC-A, PC-B)"]
minutes: 30
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build two Ethernet LANs connected by one router, ping across them, and watch one packet in Simulation mode to see the layers and the addresses that change at R1. PC-B plays the role called Server-B in the lesson; no application server is needed for a ping.

**Steps 1–4 are the core lab, about 30 minutes.** Steps 5–8 are optional extensions: they compare local and remote delivery, give you a first look at the three tables the lesson named, and break and repair a gateway. Chapters 04, 07 and 17 teach those tables properly.

The router commands in Step 2 are supplied setup, not a memory test. Read what each line does, then use the network. Chapter 04 teaches IPv4 addressing and Chapter 08 the IOS command line.

Use a new project with the listed device models. The commands assume their interface names. Your simulator assigns its own MAC addresses, so they will differ from the lesson's examples; record the real ones. Event order and timing can also vary.

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

Use copper straight-through cables for all four links shown. Select the ports explicitly.

| Device | Interface | IPv4 address | Mask | Gateway |
|---|---|---|---|---|
| PC-A | FastEthernet0 | 192.168.10.10 | 255.255.255.0 | 192.168.10.1 |
| R1 | GigabitEthernet0/0 | 192.168.10.1 | 255.255.255.0 | — |
| R1 | GigabitEthernet0/1 | 192.168.20.1 | 255.255.255.0 | — |
| PC-B | FastEthernet0 | 192.168.20.20 | 255.255.255.0 | 192.168.20.1 |

The switches need no configuration beyond a hostname: every port starts in the same default LAN. R1 needs no routing configuration to reach its two directly connected subnets.

## Step 1: Build and label the topology

Place and cable the devices as shown. Set their workspace display names. Open each network device's CLI and decline the initial configuration dialog if it appears. Configure the hostnames:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# end
```

On SW1 and SW2, use the same sequence with `hostname SW1` and `hostname SW2`. A router's interfaces are shut down until you enable them, so the links to R1 stay red until Step 2.

:::expected
There are two separate switch LANs with R1 between them. The CLI hostnames match the labels.
:::

```state
{"status":"Built · named","cabled":true,"addressed":false,"down":["R1"],"focus":["SW1","R1","SW2"],"chips":[{"node":"SW1","text":"SW1#"},{"node":"R1","text":"R1#"},{"node":"SW2","text":"SW2#"}],"rows":[["LANs","Two, with R1 between them"],["CLI hostnames","R1, SW1, SW2"],["R1 interfaces","Still shut down","dim"]]}
```

## Step 2: Apply the supplied router setup

The `interface` command selects a port; `ip address` gives it an address and mask; `no shutdown` enables it. `description` is a label. Once both interfaces are up, R1 knows both LANs without any routing protocol.

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
R1# copy running-config startup-config
```

Accept the save command's default destination. In the `show ip interface brief` output, check that both interfaces show their addresses and report **up** in both status columns.

:::expected
Gi0/0 shows 192.168.10.1 and Gi0/1 shows 192.168.20.1, both up/up. The link lights to R1 turn green.
:::

```state
{"status":"R1 interfaces up","tone":"ok","cabled":true,"addressed":false,"wake":["R1"],"focus":["R1"],"chips":[{"node":"R1","text":"R1#","tone":"ok"}],"rows":[["Gi0/0 · LAN-A","192.168.10.1 · up/up","ok"],["Gi0/1 · LAN-B","192.168.20.1 · up/up","ok"],["R1 configuration","Saved to startup-config"]]}
```

## Step 3: Configure the hosts and predict

On each PC, use **Desktop → IP Configuration** to enter the table's address, mask, and gateway. Read the settings back to catch typing errors. Save the project as **01-models-ready.pkt**. Do not ping yet: Step 4 captures the first exchange.

Before you ping, predict:

- Which IPv4 address PC-A will ask for with ARP when it sends to PC-B.
- The source and destination IPv4 addresses of the request.
- Which device will build a new Ethernet frame and reduce the TTL.

:::expected
PC-A asks for its gateway, 192.168.10.1. The request goes from 192.168.10.10 to 192.168.20.20. R1 builds the new frame and reduces the TTL.
:::

```state
{"status":"Hosts ready","cabled":true,"addressed":true,"focus":["PCA","PCB"],"chips":[{"node":"PCA","text":"gateway 192.168.10.1"},{"node":"PCB","text":"gateway 192.168.20.1"}],"rows":[["PC-A resolves (predict)","192.168.10.1, its gateway"],["Request IPs (predict)","192.168.10.10 → 192.168.20.20"],["New frame, TTL − 1 (predict)","R1"],["Project file","01-models-ready.pkt"]]}
```

## Step 4: Ping across and watch one packet

Switch to **Simulation** mode. In the event filters, show only **ARP** and **ICMP**. From PC-A's Command Prompt, run:

```text
ping 192.168.20.20
```

Click **Capture/Forward** (or the step-forward control in your version) to move the packets one step at a time. Click the ICMP envelope when it is on the PC-A to SW1 link, and again when it is on the R1 to SW2 link. The **OSI Model** tab shows which layers each device used: PC-A uses all of them, the switches stop at Layer 2, and R1 goes up to Layer 3. The **Outbound PDU Details** tab shows the Ethernet and IP headers.

Record the source MAC, destination MAC, source IP, destination IP and TTL on both sides of R1. If an ARP request appears first, note which IP address it asks for. If a device already has the MAC in its ARP cache, no ARP request appears.

:::expected
On LAN-A, the frame goes from PC-A's MAC to R1's Gi0/0 MAC. On LAN-B, it goes from R1's Gi0/1 MAC to PC-B's MAC. The IP addresses are 192.168.10.10 → 192.168.20.20 on both sides, and the TTL is one lower after R1.
:::

If your version does not show every field, compare with this worksheet. It is not a capture; the device names stand for interface MAC addresses.

| Location of the same request | Ethernet source → destination | IPv4 source → destination | TTL |
|---|---|---|---|
| LAN-A, before R1 | PC-A → R1 Gi0/0 | 192.168.10.10 → 192.168.20.20 | 128 |
| LAN-B, after R1 | R1 Gi0/1 → PC-B | 192.168.10.10 → 192.168.20.20 | 127 |

Switch back to **Realtime** mode and run the ping again. Replies show `TTL=127`. The first ping may lose a reply while ARP completes. Save the project as **01-models-complete.pkt**. This ends the core lab.

```state
{"status":"Routed through R1","tone":"ok","cabled":true,"addressed":true,"focus":["R1"],"flows":[{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings 192.168.20.20","tags":{"PCA":"Frame to R1's LAN-A MAC","R1":"New frame to PC-B's MAC · TTL − 1"}}],"rows":[["Ethernet, before R1","PC-A → R1 Gi0/0"],["Ethernet, after R1","R1 Gi0/1 → PC-B"],["IPv4, both sides","192.168.10.10 → 192.168.20.20"],["TTL (worksheet)","128 → 127"]]}
```

## Step 5: Extension: Compare local and remote delivery

From PC-A, ping **192.168.10.1**, R1's own address on LAN-A. Use Simulation mode to inspect the request and compare it with the request to PC-B.

Both frames go to the same destination MAC, R1's Gi0/0, but the destination IP addresses differ. A packet addressed to 192.168.10.1 is for R1 itself; a packet addressed to 192.168.20.20 is one R1 forwards toward PC-B.

:::expected
Both pings get replies. A frame sent to the gateway's MAC does not mean the packet is for the gateway: the destination IP decides that.
:::

```state
{"status":"Local and remote","tone":"ok","cabled":true,"addressed":true,"focus":["PCA","R1"],"flows":[{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"Repeat ping 192.168.20.20","tags":{"PCA":"R1 LAN-A MAC · to 192.168.20.20","R1":"Forwards toward PC-B"}},{"path":["PCA","SW1","R1"],"back":true,"label":"Ping 192.168.10.1","tags":{"PCA":"R1 LAN-A MAC · to 192.168.10.1"},"backTags":{"R1":"Request was for R1 itself"}}],"rows":[["To 192.168.20.20","Forwarded toward PC-B","ok"],["To 192.168.10.1","For R1 itself","ok"],["Frame destination, both","R1's LAN-A MAC"]]}
```

## Step 6: Extension: Look at the three tables

This step previews tables that Chapters 04, 07 and 17 teach. Run:

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

On each PC, run `arp -a`. Do not try to read every column. For each table, find one row you recognize and say which question it answers: which interface leads to a subnet (routing table), which MAC belongs to a local IP (ARP), or which switch port leads to a MAC (MAC address table).

:::expected
R1's routing table lists 192.168.10.0/24 and 192.168.20.0/24 as connected. R1's ARP table holds PC-A's and PC-B's MACs. SW1 lists PC-A's MAC on Fa0/1 and R1's LAN-A MAC on Fa0/24. PC-A's ARP cache holds the gateway's MAC, not PC-B's.
:::

```state
{"status":"Three tables","cabled":true,"addressed":true,"focus":["R1","SW1","SW2"],"chips":[{"node":"PCA","text":"arp -a"},{"node":"SW1","text":"show mac address-table"},{"node":"R1","text":"show ip route · show arp"},{"node":"SW2","text":"show mac address-table"},{"node":"PCB","text":"arp -a"}],"rows":[["Routing table","Subnet → interface"],["ARP table","IP → MAC"],["MAC address table","MAC → switch port"],["SW1 learns","PC-A on Fa0/1 · R1 LAN-A on Fa0/24"]]}
```

## Step 7: Extension: Break the return path

In PC-B's IP Configuration, change only the gateway from **192.168.20.1** to the unused address **192.168.20.254**. Keep its address and mask.

From PC-B, ping its local router interface, **192.168.20.1**. Then, from PC-A, ping PC-B again.

:::expected
PC-B still reaches 192.168.20.1, because that address is in its own subnet and needs no gateway. PC-A's ping to PC-B fails: the request arrives, but PC-B sends its reply to a gateway that does not exist.
:::

```state
{"status":"Return-path fault","tone":"bad","cabled":true,"addressed":true,"focus":["PCB"],"flows":[{"event":["PCB"],"wait":1.6,"tags":{"PCB":"Gateway set to 192.168.20.254"}},{"path":["PCB","SW2","R1"],"back":true,"label":"PC-B pings 192.168.20.1","tags":{"PCB":"Local destination · direct"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings PC-B","backStop":"PCB","backStopText":"Reply off subnet · gateway unavailable"}],"chips":[{"node":"PCB","text":"gateway 192.168.20.1","until":0},{"node":"PCB","text":"gateway 192.168.20.254","tone":"bad","from":0}],"rows":[["PC-B to 192.168.20.1","Replies: local destination","ok"],["PC-A to PC-B","No reply: gateway unavailable","bad"],["Changed","PC-B gateway only"]]}
```

## Step 8: Extension: Restore and verify

Restore PC-B's gateway to **192.168.20.1**. Ping PC-A to PC-B and PC-B to PC-A. Save the project as **01-models-extension.pkt**, so the core lab's file stays as you left it.

:::expected
Both pings get replies, and the settings match the plan.
:::

```state
{"status":"Restored","tone":"ok","cabled":true,"addressed":true,"focus":["PCB"],"flows":[{"event":["PCB"],"wait":1.6,"tags":{"PCB":"Gateway back to 192.168.20.1"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings PC-B","backTags":{"PCB":"Reply via gateway 192.168.20.1"}},{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings PC-A"}],"chips":[{"node":"PCB","text":"gateway 192.168.20.254","tone":"bad","until":0},{"node":"PCB","text":"gateway 192.168.20.1","tone":"ok","from":0}],"rows":[["PC-A ↔ PC-B","Replies both ways","ok"],["PC-B gateway","192.168.20.1, as planned","ok"],["Project file","01-models-complete.pkt"]]}
```

## Troubleshooting

| Symptom | Useful checks |
|---|---|
| Router link stays red | Cable endpoints, the port you chose, and `no shutdown`; check `show ip interface brief`. |
| R1 interface is up but shows the wrong address | Re-enter `ip address` under the right interface. |
| PC-A reaches 192.168.10.1 but not PC-B | Check both PCs' address, mask and gateway against the table, and that R1's Gi0/1 is up. |
| No ARP request appears in Simulation mode | The MAC is already cached from an earlier ping; that is normal. |
| Packet details differ from the lesson | Your MACs come from your simulator; compare what changes at R1, not the exact values. |
| The first ping loses one reply | ARP was completing; repeat the ping before treating it as a fault. |

## Challenge

Add PC-C on SW1 Fa0/2 with **192.168.10.30/24** and gateway **192.168.10.1**. Predict the ARP target and frame destination for PC-A sending to PC-C, then compare them with PC-A sending to PC-B.

Before changing a setting, predict whether each test should work if PC-A has no default gateway. Temporarily remove PC-A's gateway, repeat the PC-C and PC-B tests, and record the results. Restore PC-A's gateway to 192.168.10.1, verify both tests again, and save only the restored state. Make your predictions before opening the answer below.

:::solution
For PC-C, PC-A asks ARP for 192.168.10.30 and sends straight to PC-C's MAC. For PC-B, it uses the gateway's MAC. With PC-A's gateway removed, PC-A still reaches PC-C but cannot reach PC-B. Restoring 192.168.10.1 restores the remote test.
:::
