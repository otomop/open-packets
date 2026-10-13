---
title: Configure IPv6 addresses and observe local discovery
environment: packet-tracer
devices: ["1 × Cisco 2911 router (R1)", "2 × Catalyst 2960 switches (SW1, SW2)", "2 × PCs (PC-A, PC-B)"]
minutes: 80
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The guided settings are supplied so you can concentrate on how an address is formed and what each test proves. Calculate before opening a solution; copy the actual addresses and observations from your own devices into the worksheet.


Create a fresh isolated file. You will configure one LAN manually, use modified EUI-64 and SLAAC on another, inspect the actual addresses, and test the difference between a router answering for itself and forwarding traffic. No DHCPv6 server, DNS service or static route is required: R1 directly connects both LANs.

This lab has not been executed on your simulator. The examples are representative; Packet Tracer's supported commands, client address-generation method and event detail depend on its version. Compare concepts and actual configuration rather than expecting identical MAC addresses or timings.

## Topology

```diagram
{"type":"topology","title":"Lab topology — two IPv6 LANs joined by R1","caption":"The two LANs are separate links, so R1 uses link-local fe80::1 on both; the switches are not connected to each other.","nodes":[{"id":"PCA","kind":"pc","label":"PC-A","sub":"2001:db8:acad:1::10/64","x":1,"y":5},{"id":"SW1","kind":"switch","label":"SW1","x":3,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"2001:db8:acad:1::1/64 · 2001:db8:acad:2::/64 EUI-64","x":6,"y":1},{"id":"SW2","kind":"switch","label":"SW2","x":9,"y":3},{"id":"PCB","kind":"pc","label":"PC-B","sub":"Automatic · later 2001:db8:acad:2::20/64","x":11,"y":5}],"links":[{"from":"PCA","to":"SW1","toLabel":"Fa0/1"},{"from":"SW1","to":"R1","fromLabel":"Fa0/24","toLabel":"Gi0/0"},{"from":"R1","to":"SW2","fromLabel":"Gi0/1","toLabel":"Fa0/24"},{"from":"SW2","to":"PCB","fromLabel":"Fa0/1"}]}
```

| Connection | Cable |
|---|---|
| PC-A FastEthernet0 — SW1 FastEthernet0/1 | Copper straight-through |
| SW1 FastEthernet0/24 — R1 GigabitEthernet0/0 | Copper straight-through |
| PC-B FastEthernet0 — SW2 FastEthernet0/1 | Copper straight-through |
| SW2 FastEthernet0/24 — R1 GigabitEthernet0/1 | Copper straight-through |

Use fresh 2960 switches with default VLAN 1 access ports. Do not connect the switches together. The two LANs are different links, so R1 can use `fe80::1` on each without a same-link duplicate. Gi0/2 is unused.

| Interface or host | Address/prefix | Gateway |
|---|---|---|
| R1 Gi0/0 | `2001:db8:acad:1::1/64`; link-local `fe80::1` | — |
| R1 Gi0/1 | `2001:db8:acad:2::/64` plus its EUI-64 identifier; link-local `fe80::1` | — |
| PC-A | `2001:db8:acad:1::10/64`, static | `fe80::1` |
| PC-B initially | Automatic IPv6 address from LAN 2's RA | Learned from R1 |
| PC-B later, for a stable fault test | `2001:db8:acad:2::20/64`, static | `fe80::1` |

All documentation addresses stay inside this project.

### Evidence worksheet

Keep this table in your notes. A prediction is written before the corresponding change; an observation comes from your actual device or is explicitly marked as a worksheet fallback.

| Checkpoint | Predict first | Record after testing |
|---|---|---|
| Gi0/1 EUI-64 | Operational MAC, inverted first byte, inserted bytes, complete global address | Actual global address; match or discrepancy |
| PC-B Automatic | Expected prefix and source of the default gateway | Actual address, gateway, and supported assignment behavior |
| New address ending ::99 | NS target and solicited-node destination | Packet fields, or unsupported-event note |
| Forwarding disabled | Local-router ping versus remote-PC ping | Both actual outcomes before repair |
| Forwarding restored | Expected cross-LAN recovery | Both endpoint pings and connected /64s |

The topology table supplies the guided /64 settings. Prefix allocation is tested independently in the challenge; do not copy a subnet from the table into that exercise.

## Step 1: Configure R1's first LAN

Place, label and cable the devices. Decline the router setup dialog if offered. Configure the first interface and enable forwarding.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface brief
```

:::expected
After the switch port becomes ready, Gi0/0 should show up/up with `fe80::1` and `2001:db8:acad:1::1`. The other interfaces may remain administratively down. A link-local plus another unicast address on one interface is normal.
:::

```state
{"status":"R1 Gi0/0 up/up","addressed":false,"wake":["SW1"],"focus":["R1"],"chips":[{"node":"R1","text":"ipv6 unicast-routing"}],"rows":[["R1 Gi0/0","up/up"],["Gi0/0 addresses","fe80::1 · 2001:db8:acad:1::1"],["Other interfaces","May stay administratively down","dim"]]}
```

## Step 2: Address PC-A manually and verify its local link

Under PC-A → Desktop → IP Configuration, select IPv6 Static. Enter address `2001:db8:acad:1::10`, prefix length `64` and gateway `fe80::1`. Leave IPv4 and DNS unused. Open Command Prompt:

```text
ipconfig /all
ping 2001:db8:acad:1::1
```

:::expected
Confirm the entered address and a link-local address in the client's display. The ping should succeed after discovery completes. If your version provides different display options, inspect IP Configuration directly. A successful local ping establishes this one link; it does not yet test routing between LANs.
:::

```state
{"status":"PC-A reaches its router","tone":"ok","addressed":false,"focus":["PCA"],"flows":[{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A pings 2001:db8:acad:1::1","tags":{"R1":"Echo to its own Gi0/0 address"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"}],"rows":[["PC-A","2001:db8:acad:1::10/64 · static"],["Ping to R1 Gi0/0","Succeeds after discovery","ok"],["What it proves","This one link, not routing","dim"]]}
```

## Step 3: Calculate R1's second interface identifier

Read Gi0/1's MAC before configuring its IPv6 address.

```ios R1
R1# show interfaces gigabitethernet0/1
```

Find the hardware-address line. Record the operational MAC shown as `address is`; a separate `bia` field is the burned-in address and can differ if manually overridden. With this fresh router they should normally match.

On paper, split the six MAC bytes after byte three, insert `ff:fe`, and XOR the first byte with hexadecimal `02`. Regroup the resulting eight bytes into four hexadecimal groups.

:::solution
Your calculation produces a 64-bit identifier. As a worked example only, MAC `00:1a:2b:3c:4d:5e` produces `021a:2bff:fe3c:4d5e`. A first byte of `02` would become `00`, not `04`. Keep your own MAC and result; the example is not a prediction of your router's hardware address.
:::

```state
{"status":"Gi0/1 identifier on paper","addressed":false,"focus":["R1"],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"}],"rows":[["Gi0/1 MAC","The operational 'address is' value"],["Method","Split · insert ff:fe · XOR byte 1 with 02"],["Result","64 bits in four groups"]]}
```

## Step 4: Configure and verify modified EUI-64

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ipv6 address 2001:db8:acad:2::/64 eui-64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface gigabitethernet0/1
```

:::expected
Gi0/1 should have a global-form address beginning `2001:db8:acad:2:` followed by the identifier you calculated. Record the entire address as **R1-LAN2** in your notes. The manual link-local stays `fe80::1`; do not assume its suffix matches the EUI-64 global address.

The detailed output should identify the /64 prefix and ND/RA settings on supported images. If the generated suffix differs, recheck the operational MAC, inserted bytes and bit inversion before changing the configuration.
:::

```state
{"status":"Gi0/1 uses EUI-64","tone":"ok","addressed":false,"focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"Gi0/1 · prefix + EUI-64 identifier"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"}],"rows":[["Gi0/1 global","2001:db8:acad:2: + your identifier"],["Record as","R1-LAN2"],["Gi0/1 link-local","fe80::1, set manually"]]}
```

## Step 5: Let PC-B obtain an automatic address

Open PC-B → Desktop → IP Configuration and select Automatic in the IPv6 area. Allow router advertisements and duplicate-address checks to complete. Inspect the resulting address and gateway with the GUI and, where supported, `ipconfig /all`.

:::expected
PC-B should acquire an address in `2001:db8:acad:2::/64` and learn R1's link-local address `fe80::1` as a default gateway. Record its complete address as **PC-B-AUTO**. The client may use an EUI-64-derived or another supported identifier; the router's explicit `eui-64` command does not dictate how the PC builds its own identifier.

DNS may remain empty because this lab provides no DNS information. That does not prevent numeric-address pings. If automatic assignment is unavailable in your version, record that limit, use the static values in Step 8 and substitute `2001:db8:acad:2::20` wherever Step 6 refers to **PC-B-AUTO**. Study the representative RA sequence in the lesson rather than claiming a successful SLAAC observation.
:::

```state
{"status":"PC-B configures itself","tone":"ok","focus":["PCB"],"flows":[{"path":["R1","SW2","PCB"],"label":"Router advertisement","tags":{"R1":"RA · prefix 2001:db8:acad:2::/64","PCB":"Address in /64 · gateway fe80::1"}},{"path":["PCB","SW2","R1"],"label":"Duplicate-address check","tags":{"PCB":"DAD NS · tentative address"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Automatic · gateway fe80::1","tone":"ok"}],"rows":[["PC-B-AUTO","In 2001:db8:acad:2::/64","ok"],["Default gateway","fe80::1, learned from R1"],["DNS","May stay empty · pings use numbers","dim"]]}
```

## Step 6: Test both LANs and inspect neighbors

From PC-B, ping PC-A by its known address.

```text
ping 2001:db8:acad:1::10
```

From PC-A, ping **PC-B-AUTO**, substituting the exact address recorded in Step 5. Do not paste the label itself. Then inspect R1:

```ios R1
R1# show ipv6 route
R1# show ipv6 neighbors
```

:::expected
Both endpoint pings should succeed. R1 has connected /64 routes for both LANs; it needs no static route for either one. Its neighbor table should contain bindings learned while delivering traffic, with the correct interface for each LAN. It need not list every IPv6 address each PC owns.

An entry may be reachable or stale depending on timing. Stale alone is not a failure. An incomplete entry that persists while pings fail calls for checking the target address and local link.
:::

```state
{"status":"Both LANs communicate","tone":"ok","focus":["R1"],"flows":[{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings 2001:db8:acad:1::10","tags":{"PCB":"Via default gateway fe80::1","R1":"C 2001:db8:acad:1::/64 → Gi0/0"},"backTags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings PC-B-AUTO","tags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}},{"event":["R1"],"tags":{"R1":"Neighbors on Gi0/0 and Gi0/1"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Automatic · gateway fe80::1"}],"rows":[["Both endpoint pings","Succeed","ok"],["R1 routes","Connected /64 per LAN · no static"],["Neighbor entries","Reachable or stale · both normal","dim"]]}
```

## Step 7: Observe a new neighbor-resolution exchange

Before generating traffic, calculate the target's last 24 bits and the solicited-node multicast destination. Keep that prediction next to the captured fields. The configuration below assigns the target; it does not supply your prediction.

First configure a temporary, previously unused **secondary** address on R1 Gi0/0. Do not remove the original.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::99/64
R1(config-if)# end
```

Switch Packet Tracer to Simulation mode. Enable ICMPv6/ND events in the event filter if available. From PC-A, ping `2001:db8:acad:1::99` for the first time. Step through the events and inspect the packet details. Because the destination is new to PC-A, this avoids pretending that clearing only R1's neighbor cache also clears the PC's cache.

:::expected
For normal address resolution, PC-A should send an NS for target `2001:db8:acad:1::99` to solicited-node group `ff02::1:ff00:99`. R1's NA supplies neighbor information; echo traffic can then complete. Earlier DAD or other discovery events may also appear. Identify each message by its actual source, destination and target rather than assuming the first envelope is the requested exchange.

If event detail is not modeled, record that limit and draw the expected sequence from the lesson. Return to Realtime mode before continuing.
:::

```state
{"status":"NS for a new target","tone":"warn","focus":["PCA","R1"],"flows":[{"event":["R1"],"wait":1.6,"tone":"warn","tags":{"R1":"Secondary 2001:db8:acad:1::99/64"}},{"path":["PCA","SW1","R1"],"label":"Neighbor solicitation","tags":{"PCA":"NS to ff02::1:ff00:99"}},{"path":["R1","SW1","PCA"],"tone":"reply","label":"Neighbor advertisement","tags":{"R1":"NA · supplies neighbor information"}},{"path":["PCA","SW1","R1"],"back":true,"label":"Echo to 2001:db8:acad:1::99"}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"R1","text":"Secondary ::99","tone":"warn","from":0},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Automatic · gateway fe80::1"}],"rows":[["NS target","2001:db8:acad:1::99"],["NS destination","ff02::1:ff00:99"],["Then","R1's NA, then the echo completes","ok"]]}
```

## Step 8: Prepare stable host addresses for the forwarding test

Remove the temporary secondary address.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no ipv6 address 2001:db8:acad:1::99/64
R1(config-if)# end
```

Set PC-B to IPv6 Static: `2001:db8:acad:2::20`, prefix `64`, gateway `fe80::1`. Keep PC-A unchanged. On PC-B, ping the recorded **R1-LAN2** address and `2001:db8:acad:1::10`. From PC-A, ping `2001:db8:acad:2::20`.

:::expected
Local and cross-LAN pings should succeed before the fault. Record both PC configurations. Static host values make the next observation independent of whether an old SLAAC address or RA-learned route remains cached.
:::

```state
{"status":"Static hosts, all pings work","tone":"ok","focus":["PCB"],"flows":[{"event":["R1","PCB"],"wait":1.6,"tags":{"R1":"2001:db8:acad:1::99 removed","PCB":"Static 2001:db8:acad:2::20/64"}},{"path":["PCB","SW2","R1"],"back":true,"label":"PC-B pings R1-LAN2"},{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings 2001:db8:acad:1::10","tags":{"R1":"C 2001:db8:acad:1::/64 → Gi0/0"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings 2001:db8:acad:2::20","tags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"R1","text":"Secondary ::99","tone":"warn","until":0},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Automatic · gateway fe80::1","until":0},{"node":"PCB","text":"Static · gateway fe80::1","from":0}],"rows":[["PC-B","2001:db8:acad:2::20/64 · static"],["Secondary ::99","Removed from Gi0/0"],["Local and cross-LAN pings","Succeed","ok"]]}
```

## Step 9: Disable forwarding and observe the difference

Predict both ping outcomes in the worksheet before making the change. Leave the fault present long enough to collect both results; do not paste the recovery step into the same block.

Only in this isolated lab, remove the forwarding command.

```ios R1
R1# configure terminal
R1(config)# no ipv6 unicast-routing
R1(config)# end
R1# show ipv6 interface brief
```

Repeat PC-A's ping to its local router address `2001:db8:acad:1::1`, then to remote PC-B `2001:db8:acad:2::20`. On PC-B, separately ping **R1-LAN2**.

:::expected
Each PC can still reach the router address on its own LAN, but PC-to-PC forwarding should fail. Interface addresses remain configured. This distinguishes “the router answers for itself” from “the router forwards between interfaces.”

The router also ceases acting as an advertising IPv6 router in this basic configuration. Do not assume existing automatic host addresses vanish immediately; their lifetimes and simulator handling are separate. The test deliberately uses static PC addresses.
:::

```state
{"status":"Forwarding disabled","tone":"bad","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tone":"warn","tags":{"R1":"no ipv6 unicast-routing"}},{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A pings 2001:db8:acad:1::1","tags":{"R1":"Own address · still answers"}},{"path":["PCA","SW1","R1","SW2","PCB"],"label":"PC-A pings 2001:db8:acad:2::20","stop":"R1","stopText":"Not forwarded · routing disabled"},{"path":["PCB","SW2","R1"],"back":true,"label":"PC-B pings R1-LAN2","tags":{"R1":"Own Gi0/1 address · answers"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing","until":0},{"node":"R1","text":"Forwarding disabled","tone":"bad","from":0},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Static · gateway fe80::1"}],"rows":[["PC-A → R1 Gi0/0","Replies","ok"],["PC-A → PC-B","Fails · not forwarded","bad"],["PC-B → R1-LAN2","Replies","ok"],["Interface addresses","Still configured"]]}
```

## Step 10: Restore forwarding and save

```ios R1
R1# configure terminal
R1(config)# ipv6 unicast-routing
R1(config)# end
R1# show ipv6 route
```

Repeat pings in both directions. When they succeed, save R1:

```ios R1
R1# copy running-config startup-config
```

:::expected
Press Enter at the destination-filename prompt and wait for completion. Both LAN /64s are present and PC-to-PC communication works. Save the project as `19-ipv6-addressing-baseline.pkt`. Record R1-LAN2's exact value so that later work does not mistakenly use `2001:db8:acad:2::1` as though EUI-64 had created it.
:::

```state
{"status":"Forwarding restored, saved","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"ipv6 unicast-routing restored"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings 2001:db8:acad:2::20","tags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}},{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings 2001:db8:acad:1::10","tags":{"R1":"C 2001:db8:acad:1::/64 → Gi0/0"}},{"event":["R1"],"tags":{"R1":"copy running-config startup-config"}}],"chips":[{"node":"R1","text":"Forwarding disabled","tone":"bad","until":0},{"node":"R1","text":"ipv6 unicast-routing","from":0},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Static · gateway fe80::1"}],"rows":[["Both LAN /64s","In show ipv6 route","ok"],["PC-to-PC","Works in both directions","ok"],["Project","19-ipv6-addressing-baseline.pkt","ok"],["R1-LAN2","EUI-64 value, not 2001:db8:acad:2::1"]]}
```

## Troubleshooting

- **A numeric local ping fails:** compare every group of the target and interface address, link state and /64 prefix. Do not diagnose DNS when the test uses a literal address.
- **PC-B has only link-local while Automatic:** inspect R1's global forwarding command, Gi0/1 state and RA/prefix information. A DHCPv6 server is not required for SLAAC.
- **The supposed `::1` gateway is absent:** read the complete configured router address. EUI-64 does not create `::1` merely because it is convenient.
- **Neighbor resolution stays incomplete:** verify the target actually exists on the stated link. Clear or refresh caches only as a deliberate isolated-lab action; a correct route cannot resolve a nonexistent target.
- **Local router pings work, cross-LAN fails:** confirm `ipv6 unicast-routing`, both PC gateways and the connected prefixes. Use the controlled Step 9 evidence to distinguish this fault from general routing problems.
- **A source field or output label differs:** record what your simulator actually shows. Do not replace a correct calculated address merely to imitate illustrative output.

## Challenge

Use a copy of the restored baseline. First do the following calculations without commands:

1. Derive the modified EUI-64 address for MAC `02:aa:bb:cc:dd:ee` under `2001:db8:44:7::/64`, then derive its solicited-node multicast group.
2. Find the first and last /64 in `2001:db8:44:ab30::/60`. Number the /64s starting at **1** and allocate the **third** to a new LAN C.

Now implement LAN C without copying the solution. Add one blank 2960 switch SW3 and PC-C. Connect R1 Gi0/2 to SW3 Fa0/24 and PC-C FastEthernet0 to SW3 Fa0/1 with straight-through copper. Keep default access VLAN 1; do not connect SW3 to another switch. On the allocated /64 use router identifier `::1`, host identifier `::10`, and router link-local `fe80::3`. Set PC-C manually with the matching /64 and its local link-local gateway. Keep both original LANs unchanged.

Record the calculated prefix, complete router and host addresses, gateway, and commands before revealing the solution. Verify PC-C to its router and to PC-A `2001:db8:acad:1::10`; verify PC-A back to PC-C. Inspect the three connected /64s and the neighbor interfaces. Explain why no static route is needed and why repeating `fe80::1` on the original separate links was valid.

:::solution
The first byte `02` becomes `00`, giving identifier `00aa:bbff:fecc:ddee`. The full address is `2001:db8:44:7:aa:bbff:fecc:ddee`; its solicited-node group is `ff02::1:ffcc:ddee`.

The /60 contains 16 /64s from `2001:db8:44:ab30::/64` through `2001:db8:44:ab3f::/64`. Counting ab30 as first, the third is `2001:db8:44:ab32::/64`.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/2
R1(config-if)# ipv6 address 2001:db8:44:ab32::1/64
R1(config-if)# ipv6 address fe80::3 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface brief
R1# show ipv6 route
R1# show ipv6 neighbors
```

PC-C uses `2001:db8:44:ab32::10`, prefix `64`, gateway `fe80::3`. On PC-C:

```text
ping 2001:db8:44:ab32::1
ping 2001:db8:acad:1::10
```

On PC-A:

```text
ping 2001:db8:44:ab32::10
```

After discovery, each test should succeed. R1 directly connects all three prefixes and already has IPv6 forwarding enabled, so extra statics are unnecessary. Its repeated original link-local address is meaningful on two different links, not a same-link duplicate. Save this successful extension under a new project filename after saving R1's running configuration; retain the original two-LAN baseline separately. If a test fails, collect the exact addresses, gateway and interface state before changing them.
:::
