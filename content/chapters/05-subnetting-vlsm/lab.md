---
title: Build a VLSM branch and correct a growth plan
environment: packet-tracer
devices: ["1 × Cisco 2911 router (R1)", "3 × Catalyst 2960 switches (SW-USERS, SW-OPS, SW-DEV)", "3 × PC-PT devices (PC-USERS, PC-OPS, PC-DEV)"]
minutes: 75
---
You will do on a real topology what the lesson did on paper: size three LANs from one /24 with VLSM, configure the plan, and read it back from the router. Then a growth request arrives that the block cannot absorb, and you see how IOS reacts to an overlapping subnet and how to renumber one LAN into new space.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Every command here was introduced in Chapter 04 or earlier. The router's directly connected routes are enough: you need no static routes, DHCP or VLAN changes. Output below is representative, not captured from Packet Tracer; your version may differ in spacing, extra routes and messages.

## Topology

```diagram
{ "type": "topology", "title": "Three routed LANs", "caption": "Each LAN has a dedicated interface on R1; the future WAN /30 is reserved on paper and is not connected.",
  "nodes": [
    { "id": "R1", "kind": "router", "label": "R1 · 2911", "x": 6, "y": 1 },
    { "id": "SU", "kind": "switch", "label": "SW-USERS", "x": 2, "y": 3 },
    { "id": "SO", "kind": "switch", "label": "SW-OPS", "x": 6, "y": 3 },
    { "id": "SD", "kind": "switch", "label": "SW-DEV", "x": 10, "y": 3 },
    { "id": "PU", "kind": "pc", "label": "PC-USERS", "sub": "Users: calculate first", "x": 2, "y": 5.5 },
    { "id": "PO", "kind": "pc", "label": "PC-OPS", "sub": "Operations: calculate first", "x": 6, "y": 5.5 },
    { "id": "PD", "kind": "pc", "label": "PC-DEV", "sub": "Devices: calculate first", "x": 10, "y": 5.5 }
  ],
  "links": [
    { "from": "R1", "to": "SU", "fromLabel": "Gi0/0", "toLabel": "Gi0/1" },
    { "from": "R1", "to": "SO", "fromLabel": "Gi0/1", "toLabel": "Gi0/1" },
    { "from": "R1", "to": "SD", "fromLabel": "Gi0/2", "toLabel": "Gi0/1" },
    { "from": "SU", "to": "PU", "fromLabel": "Fa0/1", "toLabel": "Fa0" },
    { "from": "SO", "to": "PO", "fromLabel": "Fa0/1", "toLabel": "Fa0" },
    { "from": "SD", "to": "PD", "fromLabel": "Fa0/1", "toLabel": "Fa0" }
  ] }
```

Use copper straight-through for all six links. The 2911 provides the three named Ethernet interfaces without additional modules. The 2960 switches use their default VLAN 1 access ports; they need no management addresses for this exercise.

## Step 1: Allocate the block on paper

Users require 100 usable addresses, Operations 50, and Devices 20. These totals include each LAN's router interface. Reserve a /30 for a future two-endpoint router link. Starting with an empty `10.44.8.0/24`, choose the smallest suitable subnet for each requirement and place them largest first, each at the lowest available valid boundary. Use each LAN's first usable address for the gateway. Complete the worksheet before you open the solution.

| Allocation | Required usable | Host bits and minimum prefix | Network/broadcast | Usable range and dotted mask |
|---|---|---|---|---|
| Users | 100, including gateway | Calculate | Calculate | Calculate |
| Operations | 50, including gateway | Calculate | Calculate | Calculate |
| Devices | 20, including gateway | Calculate | Calculate | Calculate |
| Reserved link | Two endpoints, explicitly /30 | Record | Calculate | Calculate |

Add up the block sizes, then work out the exact free interval that remains. Predict whether the reserved link will appear in R1's routing table.

:::solution
| Allocation | Prefix | Usable range | Broadcast |
|---|---|---|---|
| Users `10.44.8.0` | /25 | `.1–.126` | `.127` |
| Operations `10.44.8.128` | /26 | `.129–.190` | `.191` |
| Devices `10.44.8.192` | /27 | `.193–.222` | `.223` |
| Reserved link `10.44.8.224` | /30 | `.225–.226` | `.227` |

The allocations consume `128 + 64 + 32 + 4 = 228` addresses. The free range .228–.255 contains 28 addresses and can be represented as `.228/30`, `.232/29`, and `.240/28`. The reserved link will not appear in the routing table because no interface uses it.

Compare your subnet calculation before using these supplied test-host selections for the guided build:

| Device/interface | Address | Mask | Gateway |
|---|---|---|---|
| R1 Gi0/0 | `10.44.8.1` | `255.255.255.128` | — |
| R1 Gi0/1 | `10.44.8.129` | `255.255.255.192` | — |
| R1 Gi0/2 | `10.44.8.193` | `255.255.255.224` | — |
| PC-USERS Fa0 | `10.44.8.10` | `255.255.255.128` | `10.44.8.1` |
| PC-OPS Fa0 | `10.44.8.140` | `255.255.255.192` | `10.44.8.129` |
| PC-DEV Fa0 | `10.44.8.200` | `255.255.255.224` | `10.44.8.193` |
:::

```state
{"status":"Plan on paper","cabled":false,"addressed":false,"rows":[["Parent block","10.44.8.0/24, empty"],["Usable needed","Users 100 · Operations 50 · Devices 20"],["Reserved link","/30, paper only"],["Order","Largest first, lowest valid boundary"]]}
```

## Step 2: Cable the topology and address the router

Place and connect the devices. Decline the initial setup dialog on R1 if it appears. Configure the three interfaces from the solution table, returning to global configuration between interfaces.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# description Users LAN
R1(config-if)# ip address 10.44.8.1 255.255.255.128
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# description Operations LAN
R1(config-if)# ip address 10.44.8.129 255.255.255.192
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/2
R1(config-if)# description Devices LAN
R1(config-if)# ip address 10.44.8.193 255.255.255.224
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

:::expected
Gi0/0, Gi0/1, and Gi0/2 are up/up and show the three gateway addresses. A newly connected switch port takes about 30 seconds to start forwarding. The brief table does not show masks, so you check those in Step 4.
:::

```state
{"status":"R1 addressed","tone":"ok","cabled":true,"addressed":false,"led":true,"focus":["R1"],"chips":[{"node":"R1","text":"R1#"}],"rows":[["Gi0/0 · Users","10.44.8.1/25 · up/up","ok"],["Gi0/1 · Operations","10.44.8.129/26 · up/up","ok"],["Gi0/2 · Devices","10.44.8.193/27 · up/up","ok"],["Masks","Not shown in the brief table","dim"]]}
```

## Step 3: Address the PCs with dotted masks

On each PC, use **Desktop → IP Configuration → Static**. Enter its address, the exact dotted mask, and its gateway from the table. Replace any automatic mask entry. Then use **Desktop → Command Prompt** to check and test.

```text PC-USERS
ipconfig
ping 10.44.8.1
```

```text PC-OPS
ipconfig
ping 10.44.8.129
```

```text PC-DEV
ipconfig
ping 10.44.8.193
```

:::expected
Each PC reports the table's values and reaches its own gateway; the first echo may time out while ARP resolves. The masks are /25, /26, and /27 respectively. Packet Tracer fills in 255.0.0.0 for any address that begins with 10, which is wrong here.
:::

```state
{"status":"PCs reach gateways","tone":"ok","cabled":true,"addressed":true,"focus":["PU","PO","PD"],"flows":[{"path":["PU","SU","R1"],"back":true,"label":"PC-USERS pings 10.44.8.1"},{"path":["PO","SO","R1"],"back":true,"label":"PC-OPS pings 10.44.8.129"},{"path":["PD","SD","R1"],"back":true,"label":"PC-DEV pings 10.44.8.193"}],"chips":[{"node":"PU","text":"10.44.8.10/25 · gw 10.44.8.1"},{"node":"PO","text":"10.44.8.140/26 · gw 10.44.8.129"},{"node":"PD","text":"10.44.8.200/27 · gw 10.44.8.193"}],"rows":[["Gateway pings","All three reply","ok"],["PC masks","/25 · /26 · /27, dotted"],["255.0.0.0 on a 10.x PC","Not correct here","dim"]]}
```

## Step 4: Read the plan back from the routing table

Before running a show command, predict the three connected prefixes and their interfaces from your allocation table. Then compare the router's connected routes with the plan, and use the detailed interface command to read the Operations mask directly.

```ios R1
R1# show ip route
R1# show ip interface gigabitethernet0/1
R1# show running-config
```

:::expected
Representative connected routes:
```output R1# show ip route
C        10.44.8.0/25 is directly connected, GigabitEthernet0/0  ← Users
C        10.44.8.128/26 is directly connected, GigabitEthernet0/1  ← Operations
C        10.44.8.192/27 is directly connected, GigabitEthernet0/2  ← Devices
```
The detailed Gi0/1 output identifies `10.44.8.129/26`. Additional local /32 routes may be present. If a detailed command is unavailable in your simulator image, read the interface's dotted mask in `show running-config` and compare its calculated subnet with the connected route.
:::

```state
{"status":"Routes match the plan","tone":"ok","cabled":true,"addressed":true,"focus":["R1"],"chips":[{"node":"SU","text":"Users · 10.44.8.0/25"},{"node":"SO","text":"Operations · 10.44.8.128/26"},{"node":"SD","text":"Devices · 10.44.8.192/27"}],"rows":[["C 10.44.8.0/25","Gi0/0 · Users","ok"],["C 10.44.8.128/26","Gi0/1 · Operations","ok"],["C 10.44.8.192/27","Gi0/2 · Devices","ok"],["Gi0/1 detail","10.44.8.129/26"]]}
```

## Step 5: Test every pair

For each pair below, confirm by calculation that the destination is outside the source's subnet and name the gateway the source will use. Then run the six tests and record the results.

| Source | Destination | Predicted next hop | Actual result |
|---|---|---|---|
| Users | Operations | Write | Record |
| Users | Devices | Write | Record |
| Operations | Users | Write | Record |
| Operations | Devices | Write | Record |
| Devices | Users | Write | Record |
| Devices | Operations | Write | Record |

```text PC-USERS
ping 10.44.8.140
ping 10.44.8.200
```

```text PC-OPS
ping 10.44.8.10
ping 10.44.8.200
```

```text PC-DEV
ping 10.44.8.10
ping 10.44.8.140
```

:::expected
All six tests succeed; repeat any whose first echo times out while ARP resolves. R1 needs no static routes because all three LANs are directly connected. The gateways are Users `.1`, Operations `.129`, and Devices `.193`, all under `10.44.8`. Fix any failure before continuing. Save the file as `vlsm-original-baseline.pkt`, then work in a copy for the growth steps.
:::

```state
{"status":"All six pairs reply","tone":"ok","cabled":true,"addressed":true,"focus":["R1"],"flows":[{"path":["PU","SU","R1","SO","PO"],"back":true,"label":"PC-USERS pings 10.44.8.140","tags":{"PU":"Off-subnet → gateway 10.44.8.1","R1":"Connected 10.44.8.128/26 → Gi0/1"}},{"path":["PO","SO","R1","SD","PD"],"back":true,"label":"PC-OPS pings 10.44.8.200","tags":{"PO":"Off-subnet → gateway 10.44.8.129","R1":"Connected 10.44.8.192/27 → Gi0/2"}},{"path":["PD","SD","R1","SU","PU"],"back":true,"label":"PC-DEV pings 10.44.8.10","tags":{"PD":"Off-subnet → gateway 10.44.8.193","R1":"Connected 10.44.8.0/25 → Gi0/0"}}],"rows":[["Six remote pings","All reply","ok"],["Gateways","Users .1 · Operations .129 · Devices .193"],["R1 routes","No static routes needed"],["Checkpoint","vlsm-original-baseline.pkt"]]}
```

## Step 6: Check a proposed Operations expansion

Operations now requires 70 total usable addresses. Work out its minimum prefix and the complete range that would contain its existing `.129` gateway. Compare that range with Devices and the reserved link before reading the command. Also add the minimum block sizes of Users, enlarged Operations, Devices and the reserved /30: can any rearrangement keep all of them inside the original /24?

The command below is the tempting wrong answer: widen the mask and keep the gateway. Predict what IOS will do, then enter it in your experiment copy. Do not change the PCs yet.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.44.8.129 255.255.255.128
R1(config-if)# end
R1# show running-config
R1# show ip route
```

:::expected
A /26 has only 62 usable addresses, so 70 requires a /25. However, `10.44.8.128/25` covers .128–.255 and overlaps the Devices subnet .192–.223. IOS rejects the command with a message such as `% 10.44.8.128 overlaps with GigabitEthernet0/2`, and Gi0/1 keeps its /26. Users /25 plus Operations /25 would already consume the entire /24. With Devices and the reserved link the plan needs `128 + 128 + 32 + 4 = 292` addresses, and no ordering fits 292 into 256. The PCs still reach each other because the rejected command changed nothing.
:::

The block is full, so the next step uses new address space instead.

```state
{"status":"Overlap rejected","tone":"warn","cabled":true,"addressed":true,"focus":["R1"],"flows":[{"event":["R1"],"wait":1,"tags":{"R1":"Rejected · overlaps Devices /27"}},{"path":["PO","SO","R1","SD","PD"],"back":true,"label":"PC-OPS pings 10.44.8.200","tags":{"R1":"Connected 10.44.8.192/27 → Gi0/2"}}],"chips":[{"node":"R1","text":"Gi0/1 keeps 10.44.8.129/26","tone":"ok","from":0}],"rows":[["70 usable","Needs /25; a /26 has 62"],["10.44.8.128/25",".128–.255 overlaps Devices","bad"],["Gi0/1 after the command","Still 10.44.8.129/26","ok"],["Blocks needed","128 + 128 + 32 + 4 = 292 > 256","warn"]]}
```

## Step 7: Move Operations into additional allocated space

Assume the address administrator has now assigned `10.44.9.0/24` to this site as well. Use its lower /25 for Operations. Users, Devices, and the reserved link keep their original allocations. Before reading the configuration, calculate the new Operations network, usable range and broadcast. Choose the first usable gateway and a test PC ending in `.10`. Decide whether carrying forward `.140` would be valid in that lower /25.

Update the address table before changing R1. Operations loses connectivity while only one side has changed, so verify after both the router and the PC are updated.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.44.9.1 255.255.255.128
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface gigabitethernet0/1
R1# show ip route
```

On PC-OPS, enter address `10.44.9.10`, mask `255.255.255.128`, and gateway `10.44.9.1`. Both addresses lie in `10.44.9.0/25`. Do not carry the old host number 140 into this plan: `10.44.9.140/25` belongs to the upper /25 and would put the PC outside its gateway's subnet.

```text PC-OPS
ipconfig
ping 10.44.9.1
ping 10.44.8.10
ping 10.44.8.200
```

:::expected
The new network is `10.44.9.0/25`, usable range `.9.1–.9.126`, broadcast `.9.127`. R1's Operations connected route changes from `10.44.8.128/26` to `10.44.9.0/25`. The other two connected routes are unchanged. PC-OPS reaches its new gateway and both other LANs. From PC-USERS and PC-DEV, test the new Operations address `10.44.9.10`, not the retired .8.140 address.
:::

```state
{"status":"Operations moved","tone":"ok","cabled":true,"addressed":true,"focus":["R1","PO"],"flows":[{"event":["R1","PO"],"wait":1,"tags":{"R1":"Gi0/1 now 10.44.9.1/25","PO":"10.44.9.10/25 · gw 10.44.9.1"}},{"path":["PO","SO","R1","SU","PU"],"back":true,"label":"PC-OPS pings 10.44.8.10","tags":{"PO":"Off-subnet → gateway 10.44.9.1","R1":"Connected 10.44.8.0/25 → Gi0/0"},"backTags":{"R1":"Connected 10.44.9.0/25 → Gi0/1"}},{"path":["PO","SO","R1","SD","PD"],"back":true,"label":"PC-OPS pings 10.44.8.200","tags":{"R1":"Connected 10.44.8.192/27 → Gi0/2"}}],"chips":[{"node":"SO","text":"Operations · 10.44.8.128/26","until":0},{"node":"SO","text":"Operations · 10.44.9.0/25","tone":"ok","from":0}],"rows":[["Operations route","10.44.8.128/26 → 10.44.9.0/25","ok"],["Usable · broadcast",".9.1–.9.126 · .9.127"],["PC-OPS pings",".9.1, .8.10 and .8.200 reply","ok"],["10.44.9.140/25","Upper /25: off the gateway's subnet","dim"]]}
```

## Step 8: Verify the final plan and save

Read each device's actual settings and compare them with the updated plan.

| Item | Intended final result | Actual evidence |
|---|---|---|
| Users interface and PC | R1 `.8.1/25`; PC `.8.10/25`, gateway `.8.1` | Record |
| Operations interface and PC | R1 `.9.1/25`; PC `.9.10/25`, gateway `.9.1` | Record |
| Devices interface and PC | R1 `.8.193/27`; PC `.8.200/27`, gateway `.8.193` | Record |
| Connected prefixes | `10.44.8.0/25`, `10.44.9.0/25`, `10.44.8.192/27` | Record |
| Current endpoint tests | Repeat all six directions using the new Operations address | Record |

All abbreviated addresses in the table begin with `10.44`. No interface uses the old Operations allocation after the move; its absence from connected routes is expected. From PC-USERS, run the two remote tests below, then save R1.

```text PC-USERS
ping 10.44.9.10
ping 10.44.8.200
```

```ios R1
R1# show ip interface brief
R1# show ip route
R1# copy running-config startup-config
```

:::expected
All three LANs work under the updated plan. Accept the default startup-config filename and save the Packet Tracer file as `vlsm-branch.pkt`. You resolved the overlap by moving Operations into new space, which is the only fix when a block is full.
:::

```state
{"status":"Final plan saved","tone":"ok","cabled":true,"addressed":true,"focus":["R1"],"flows":[{"path":["PU","SU","R1","SO","PO"],"back":true,"label":"PC-USERS pings 10.44.9.10","tags":{"PU":"Off-subnet → gateway 10.44.8.1","R1":"Connected 10.44.9.0/25 → Gi0/1"}},{"path":["PU","SU","R1","SD","PD"],"back":true,"label":"PC-USERS pings 10.44.8.200","tags":{"R1":"Connected 10.44.8.192/27 → Gi0/2"}}],"chips":[{"node":"SU","text":"Users · 10.44.8.0/25"},{"node":"SO","text":"Operations · 10.44.9.0/25"},{"node":"SD","text":"Devices · 10.44.8.192/27"}],"rows":[["PC-USERS pings",".9.10 and .8.200 reply","ok"],["10.44.8.128/26","No longer a connected route"],["R1","Saved to startup-config","ok"],["Project file","vlsm-branch.pkt"]]}
```

## Troubleshooting

- An interface is administratively down: enable the intended port, then check whether the cable and peer allow it to become up/up.
- An overlap is reported: calculate the ranges on both the proposed and named existing interface. The existing mask may be the error.
- A gateway ping fails: inspect that PC's actual address, mask, gateway, and physical connection. An overly broad mask alone does not necessarily prevent reaching a local gateway.
- Local gateway tests pass but a remote pair fails: check both endpoint configurations and R1's connected routes.
- After the move, Operations fails: confirm PC-OPS is .9.10/25 with gateway .9.1, and that other PCs target the new address.
- A ping succeeds although a mask is wrong: correct the mask from the plan anyway. A router can answer ARP on behalf of hosts on its other subnets (proxy ARP), which hides some mask errors.

## Challenge

Without looking at the guided allocation above, allocate `192.168.72.0/24` for four LANs requiring 60, 28, 12, and 6 total usable addresses, plus one /30 router link. Use the smallest suitable subnet for each, allocate largest first, and place each block at the lowest available aligned boundary. List all broadcasts, usable capacities, gateway reservations and the exact remaining free blocks. Prove containment and check every adjacent allocation for overlap before revealing the solution. Predict whether an additional LAN needing 100 total usable addresses could fit without moving these allocations, and identify its prefix if so.

Save your existing file, then create a separate challenge copy. Reuse only R1 Gi0/0 and Gi0/1 with the two largest new LANs, and shut Gi0/2. Choose the first usable gateway and the next usable address for each test PC. Write the intended router commands and PC settings in your notes before entering them. Configure the matching masks and gateways, then verify the two connected prefixes and bidirectional PC pings. Only the two largest new LANs are implemented, so expect two connected routes, not five; the other allocations stay on paper.

Keep your calculated table, the two C entries, both PC configurations and both ping results. Save the challenge file separately so the completed growth exercise remains available.

:::solution
| Requirement | Network | Gateway | Test PC | Broadcast |
|---|---|---|---|---|
| 60 | `192.168.72.0/26` | `.1` | `.2` | `.63` |
| 28 | `192.168.72.64/27` | `.65` | `.66` | `.95` |
| 12 | `192.168.72.96/28` | `.97` | — | `.111` |
| 6 | `192.168.72.112/29` | `.113` | — | `.119` |
| Link | `192.168.72.120/30` | Two endpoints .121 and .122 | — | `.123` |

Free blocks are `192.168.72.124/30` and `192.168.72.128/25`. Configure Gi0/0 with `ip address 192.168.72.1 255.255.255.192`, and Gi0/1 with `ip address 192.168.72.65 255.255.255.224`; keep both enabled. Use the matching masks on PCs .2 and .66 and their listed gateways. Under Gi0/2, enter `shutdown`. The active connected routes should be `192.168.72.0/26` and `192.168.72.64/27`; the two PCs should reach each other. Gi0/2 can retain its old address in the configuration while shut, but it does not supply an active connected LAN.

The extra 100-address requirement needs /25. The free `192.168.72.128/25` supplies 126 usable addresses and is aligned without overlapping any existing allocation. The other free block `.124/30` is separate. This is a paper growth check; do not add more devices or change the implemented two-LAN challenge.
:::
