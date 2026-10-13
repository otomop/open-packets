---
title: Build a VLSM branch and correct a growth plan
environment: packet-tracer
devices: ["1 × Cisco 2911 router (R1)", "3 × Catalyst 2960 switches (SW-USERS, SW-OPS, SW-DEV)", "3 × PC-PT devices (PC-USERS, PC-OPS, PC-DEV)"]
minutes: 75
---
Choose the subnet sizes and placements for three LANs before seeing the completed plan. Configure that plan, record evidence from all three LANs, and assess one growth request. A short renumbering variation demonstrates why a new router address also requires matching host settings. The challenge uses fresh requirements and a separate file.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Your required work is an allocation table and a verified small topology. The supplied commands support the addressing exercise; this is not a production migration plan. No static routes, dynamic routing, DHCP, VLAN changes or Internet connection are required.

No Packet Tracer execution was available during this review. The addressing and command sequence have been checked against the plan and documentation. Output below is representative, not captured; your version may differ in spacing, extra routes, and messages.

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

Users require 100 usable addresses, Operations 50, and Devices 20. These totals include each LAN's router interface. Reserve a /30 for a future two-endpoint router link. Starting with an empty `10.44.8.0/24`, choose the smallest suitable subnet for each requirement and allocate largest first. Do not read the answer until you have completed this worksheet. Allocate at the lowest available valid boundary, in descending size order; use each LAN's first usable address for the gateway. The physical topology gives the interfaces, not the subnet sizes.

| Allocation | Required usable | Host bits and minimum prefix | Network/broadcast | Usable range and dotted mask |
|---|---|---|---|---|
| Users | 100, including gateway | Calculate | Calculate | Calculate |
| Operations | 50, including gateway | Calculate | Calculate | Calculate |
| Devices | 20, including gateway | Calculate | Calculate | Calculate |
| Reserved link | Two endpoints, explicitly /30 | Record | Calculate | Calculate |

Add the total block sizes, then determine the exact remaining free interval. Distinguish total addresses from usable host capacity. Explain why the unconfigured reservation should not become a connected route merely because it is on your plan.

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

Place and connect the specified devices. Decline the initial setup dialog on R1 if it appears. Configure the interfaces from the original table; explicitly return to global configuration between interfaces.

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
With the switch links ready, Gi0/0, Gi0/1, and Gi0/2 are up/up and show the three gateway addresses. Switch ports may take time to enter forwarding. The brief table does not show masks; do not treat it as the complete verification.
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
Each PC reports the table's values and reaches its own gateway after any initial resolution delay. The correct masks are /25, /26, and /27 respectively. A mask of 255.0.0.0 is not correct merely because the address begins with 10.
:::

```state
{"status":"PCs reach gateways","tone":"ok","cabled":true,"addressed":true,"focus":["PU","PO","PD"],"flows":[{"path":["PU","SU","R1"],"back":true,"label":"PC-USERS pings 10.44.8.1"},{"path":["PO","SO","R1"],"back":true,"label":"PC-OPS pings 10.44.8.129"},{"path":["PD","SD","R1"],"back":true,"label":"PC-DEV pings 10.44.8.193"}],"chips":[{"node":"PU","text":"10.44.8.10/25 · gw 10.44.8.1"},{"node":"PO","text":"10.44.8.140/26 · gw 10.44.8.129"},{"node":"PD","text":"10.44.8.200/27 · gw 10.44.8.193"}],"rows":[["Gateway pings","All three reply","ok"],["PC masks","/25 · /26 · /27, dotted"],["255.0.0.0 on a 10.x PC","Not correct here","dim"]]}
```

## Step 4: Read the plan back from the routing table

Before running a show command, predict the three connected prefixes and their interfaces from your completed allocation table. Leave a second column for the actual output. Compare the router's connected prefixes with the paper plan. Use the detailed interface command to inspect the Operations mask directly.

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

For each source/destination pair below, calculate that the destination is outside the source's local subnet and name the source's gateway. Then run the six tests and record actual results. This checks each PC's ability to send traffic through its configured gateway and receive replies from both other LANs.

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
All destinations respond after links and address resolution settle. R1 needs no static routes for these directly connected LANs. The predicted gateways are Users `.1`, Operations `.129`, and Devices `.193`, all under `10.44.8`. Record success or failure for each pair; repeat an initial failed echo rather than assuming a precise number of replies or a particular TTL. Stop and correct an unintended failure before continuing. Save a working `vlsm-original-baseline.pkt` checkpoint, then use a separate experiment copy for the growth steps.
:::

```state
{"status":"All six pairs reply","tone":"ok","cabled":true,"addressed":true,"focus":["R1"],"flows":[{"path":["PU","SU","R1","SO","PO"],"back":true,"label":"PC-USERS pings 10.44.8.140","tags":{"PU":"Off-subnet → gateway 10.44.8.1","R1":"Connected 10.44.8.128/26 → Gi0/1"}},{"path":["PO","SO","R1","SD","PD"],"back":true,"label":"PC-OPS pings 10.44.8.200","tags":{"PO":"Off-subnet → gateway 10.44.8.129","R1":"Connected 10.44.8.192/27 → Gi0/2"}},{"path":["PD","SD","R1","SU","PU"],"back":true,"label":"PC-DEV pings 10.44.8.10","tags":{"PD":"Off-subnet → gateway 10.44.8.193","R1":"Connected 10.44.8.0/25 → Gi0/0"}}],"rows":[["Six remote pings","All reply","ok"],["Gateways","Users .1 · Operations .129 · Devices .193"],["R1 routes","No static routes needed"],["Checkpoint","vlsm-original-baseline.pkt"]]}
```

## Step 6: Check a proposed Operations expansion

Operations now requires 70 total usable addresses. Work out its minimum prefix and the complete range that would contain its existing `.129` gateway. Compare that range with Devices and the reserved link before reading the command. Also add the minimum block sizes of Users, enlarged Operations, Devices and the reserved /30: can any rearrangement keep all of them inside the original /24?

The following is deliberately the rejected proposal, not the recommended repair. Predict the error, then test it only in the isolated experiment copy. Keep the router's response and retained interface mask as evidence. Do not change the PCs yet.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.44.8.129 255.255.255.128
R1(config-if)# end
R1# show running-config
R1# show ip route
```

:::expected
A /26 has only 62 usable addresses, so 70 requires a /25. However, `10.44.8.128/25` covers .128–.255 and overlaps the Devices subnet .192–.223. IOS should reject the command and report an overlap; verify that Gi0/1 retains its /26. Users /25 plus Operations /25 already consumes the entire /24. Including Devices and the reserved link requires `128 + 128 + 32 + 4 = 292` addresses. Reordering those blocks cannot fit 292 into 256. Confirm that the original three PC paths still work after the rejected command; rejected input should not be treated as an applied change.
:::

Stop here long enough to record the rejected change and its reason. The next step implements a different, valid plan rather than repeating the failed command.

```state
{"status":"Overlap rejected","tone":"warn","cabled":true,"addressed":true,"focus":["R1"],"flows":[{"event":["R1"],"wait":1,"tags":{"R1":"Rejected · overlaps Devices /27"}},{"path":["PO","SO","R1","SD","PD"],"back":true,"label":"PC-OPS pings 10.44.8.200","tags":{"R1":"Connected 10.44.8.192/27 → Gi0/2"}}],"chips":[{"node":"R1","text":"Gi0/1 keeps 10.44.8.129/26","tone":"ok","from":0}],"rows":[["70 usable","Needs /25; a /26 has 62"],["10.44.8.128/25",".128–.255 overlaps Devices","bad"],["Gi0/1 after the command","Still 10.44.8.129/26","ok"],["Blocks needed","128 + 128 + 32 + 4 = 292 > 256","warn"]]}
```

## Step 7: Move Operations into additional allocated space

Assume the address administrator has now assigned `10.44.9.0/24` to this site as well. Use its lower /25 for Operations. Users, Devices, and the reserved link keep their original allocations. Before reading the configuration, calculate the new Operations network, usable range and broadcast. Choose the first usable gateway and a test PC ending in `.10`. Decide whether carrying forward `.140` would be valid in that lower /25.

Update the address table before changing R1. Apply the small router-and-PC change as one guided configuration task; a temporary loss of Operations connectivity while only one side has changed is expected. Verify only after both settings are updated.

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

The final Operations mask remains /25; do not restore its old /26. Complete this comparison using actual settings and results, not a copied answer. Read each PC's settings and compare them with the updated plan.

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
All three LANs work under the updated plan. Accept the default startup-config filename and save the Packet Tracer file as `vlsm-branch.pkt`. The rejected overlap has been resolved by obtaining and using suitable space, not by weakening the mask checks.
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
- A successful ping conflicts with an incorrect mask: correct the mask from the plan. Proxy ARP or other host behavior can hide some errors; it is not a substitute for verification.

## Challenge

Without looking at the guided allocation above, allocate `192.168.72.0/24` for four LANs requiring 60, 28, 12, and 6 total usable addresses, plus one /30 router link. Use the smallest suitable subnet for each, allocate largest first, and place each block at the lowest available aligned boundary. List all broadcasts, usable capacities, gateway reservations and the exact remaining free blocks. Prove containment and check every adjacent allocation for overlap before revealing the solution. Predict whether an additional LAN needing 100 total usable addresses could fit without moving these allocations, and identify its prefix if so.

Save your existing file, then create a separate challenge copy. Reuse only R1 Gi0/0 and Gi0/1 with the two largest new LANs, and shut Gi0/2. Choose the first usable gateway and the next usable address for each test PC. Write the intended router commands and PC settings in your notes before entering them. Configure the matching masks and gateways, then verify the two connected prefixes and bidirectional PC pings. Only the two largest new LANs are implemented; the other two LANs and link remain paper allocations. Do not claim five observed connected routes.

For exit evidence, save your calculated table, the actual two C entries, both PC configuration records and both ping results. Save the challenge file separately so the completed growth exercise remains available.

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
