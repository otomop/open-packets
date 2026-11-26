---
title: Configure IPv6 addresses and observe local discovery
environment: packet-tracer
devices: ["1 × Cisco 2911 router (R1)", "2 × Catalyst 2960 switches (SW1, SW2)", "2 × PCs (PC-A, PC-B)"]
minutes: 80
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You will build the lesson's two IPv6 LANs on R1. LAN 1 is addressed by hand. On LAN 2, R1 builds its address with modified EUI-64 and PC-B configures itself with SLAAC. You will then watch a Neighbor Solicitation find a new address, and switch IPv6 routing off to see the difference between a router answering for itself and forwarding traffic. No DHCPv6 server, DNS service or static route is needed, because R1 connects directly to both LANs.

Start from a new, empty Packet Tracer file. Work out each address before you open a solution, and write what your own devices show into the worksheet. Your MAC addresses, and so your EUI-64 results, will differ from the examples, and the detail Packet Tracer displays varies a little between versions.

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

Use new 2960 switches and leave every port in the default VLAN 1. Do not connect the switches to each other. The two LANs are different links, so R1 can use `fe80::1` on both. Gi0/2 is unused until the challenge.

| Interface or host | Address/prefix | Gateway |
|---|---|---|
| R1 Gi0/0 | `2001:db8:acad:1::1/64`; link-local `fe80::1` | — |
| R1 Gi0/1 | `2001:db8:acad:2::/64` plus its EUI-64 identifier; link-local `fe80::1` | — |
| PC-A | `2001:db8:acad:1::10/64`, static | `fe80::1` |
| PC-B initially | Automatic IPv6 address from LAN 2's RA | Learned from R1 |
| PC-B later, for a stable fault test | `2001:db8:acad:2::20/64`, static | `fe80::1` |

PC-B starts on automatic addressing so that you can observe SLAAC. It moves to a static address in Step 8 so that the forwarding test in Step 9 does not depend on Router Advertisements.

### Evidence worksheet

Keep this table in your notes. Write each prediction before you make the change, then record what your devices show.

| Checkpoint | Predict first | Record after testing |
|---|---|---|
| Gi0/1 EUI-64 | Gi0/1 MAC, flipped first byte, position of `fffe`, complete global address | The address IOS built; does it match? |
| PC-B Automatic | The prefix PC-B will use and where its default gateway comes from | PC-B's address and gateway |
| New address ending ::99 | NS target and solicited-node destination | The fields in the captured NS and NA |
| Forwarding disabled | Ping to the local router address; ping to the remote PC | Both results before the repair |
| Forwarding restored | Which pings recover | Both PC-to-PC pings and the connected /64s |

The address table gives every /64 for the guided steps. In the challenge you work out the prefix yourself.

## Step 1: Configure R1's first LAN

Place, label and cable the devices. Answer `no` if the router offers its setup dialog. `ipv6 unicast-routing` makes R1 an IPv6 router. The two `ipv6 address` lines give Gi0/0 its global address and replace its automatic link-local address with `fe80::1`.

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
Once the switch port is forwarding, Gi0/0 shows up/up with `FE80::1` and `2001:DB8:ACAD:1::1`; IOS prints addresses in uppercase. The other interfaces are still administratively down. A link-local address plus a global address on one interface is normal.
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
`ipconfig /all` shows the address you entered and a link-local address that the PC created for itself. The first echo may time out while Neighbor Discovery resolves R1's MAC address; the rest succeed. This ping tests one link only: R1 is answering for its own address, not routing.
:::

```state
{"status":"PC-A reaches its router","tone":"ok","addressed":false,"focus":["PCA"],"flows":[{"path":["PCA","SW1","R1"],"back":true,"label":"PC-A pings 2001:db8:acad:1::1","tags":{"R1":"Echo to its own Gi0/0 address"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"}],"rows":[["PC-A","2001:db8:acad:1::10/64 · static"],["Ping to R1 Gi0/0","Succeeds after discovery","ok"],["What it proves","This one link, not routing","dim"]]}
```

## Step 3: Calculate R1's second interface identifier

Read Gi0/1's MAC before configuring its IPv6 address.

```ios R1
R1# show interfaces gigabitethernet0/1
```

Find the line that contains `address is xxxx.xxxx.xxxx (bia xxxx.xxxx.xxxx)` and record the value after `address is`. The `bia` value is the burned-in address; on a new router the two match. The interface is still shut down, but its MAC is already shown.

IOS prints a MAC as three groups of four hexadecimal digits. On paper, split it in the middle of the second group, insert `fffe`, and flip the seventh bit of the first byte, which is an XOR of that byte with hexadecimal `02`. Write the result as four groups of four digits.

:::solution
As a worked example, a displayed MAC of `001a.2b3c.4d5e` gives `021a:2bff:fe3c:4d5e`. A first byte of `02` would become `00`, not `04`. Your router's MAC is different, so keep your own result for Step 4.
:::

```state
{"status":"Gi0/1 identifier on paper","addressed":false,"focus":["R1"],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"}],"rows":[["Gi0/1 MAC","The operational 'address is' value"],["Method","Split · insert ff:fe · XOR byte 1 with 02"],["Result","64 bits in four groups"]]}
```

## Step 4: Configure and verify modified EUI-64

Give Gi0/1 the LAN 2 prefix and let IOS supply the interface ID. Set the link-local address by hand, as on Gi0/0.

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
Gi0/1 shows a global address of `2001:DB8:ACAD:2:` followed by the identifier you calculated, with leading zeros dropped. Record the whole address as **R1-LAN2**. The link-local address is the `FE80::1` you set by hand, so its suffix does not match the global address.

The output also shows the /64 subnet and the multicast groups the interface has joined. If the suffix differs from your calculation, recheck the MAC, the position of `fffe` and the flipped bit before you change any configuration.
:::

```state
{"status":"Gi0/1 uses EUI-64","tone":"ok","addressed":false,"focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"Gi0/1 · prefix + EUI-64 identifier"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"}],"rows":[["Gi0/1 global","2001:db8:acad:2: + your identifier"],["Record as","R1-LAN2"],["Gi0/1 link-local","fe80::1, set manually"]]}
```

## Step 5: Let PC-B obtain an automatic address

Open PC-B → Desktop → IP Configuration and select Automatic in the IPv6 area. Give it a few seconds to receive R1's Router Advertisement, then read the address and gateway in the same window or with `ipconfig /all`.

:::expected
PC-B takes an address in `2001:db8:acad:2::/64` and shows `fe80::1`, R1's link-local address, as its default gateway. This is SLAAC: the prefix and the gateway both came from R1's Router Advertisement. Record the complete address as **PC-B-AUTO**. The PC chooses its own interface ID; the `eui-64` keyword on R1 affects only R1.

The DNS field stays empty because nothing in this lab supplies DNS, and every test uses numeric addresses. If your Packet Tracer version cannot do automatic IPv6 addressing, note that, apply the static values from Step 8 now, and use `2001:db8:acad:2::20` wherever Step 6 says **PC-B-AUTO**.
:::

```state
{"status":"PC-B configures itself","tone":"ok","focus":["PCB"],"flows":[{"path":["R1","SW2","PCB"],"label":"Router advertisement","tags":{"R1":"RA · prefix 2001:db8:acad:2::/64","PCB":"Address in /64 · gateway fe80::1"}},{"path":["PCB","SW2","R1"],"label":"Duplicate-address check","tags":{"PCB":"DAD NS · tentative address"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Automatic · gateway fe80::1","tone":"ok"}],"rows":[["PC-B-AUTO","In 2001:db8:acad:2::/64","ok"],["Default gateway","fe80::1, learned from R1"],["DNS","May stay empty · pings use numbers","dim"]]}
```

## Step 6: Test both LANs and inspect neighbors

From PC-B, ping PC-A by its known address.

```text
ping 2001:db8:acad:1::10
```

From PC-A, ping the address you recorded as **PC-B-AUTO** in Step 5. Then inspect R1:

```ios R1
R1# show ipv6 route
R1# show ipv6 neighbors
```

:::expected
Both pings succeed. `show ipv6 route` lists a connected (C) /64 and a local (L) /128 for each LAN, so R1 needs no static route. `show ipv6 neighbors` lists the addresses R1 resolved while delivering the pings, each against the interface for its LAN. It does not list every address each PC owns.

An entry shows REACH or STALE depending on timing, and both are normal. An INCMP entry that stays while pings fail means the target address is not answering on that link.
:::

```state
{"status":"Both LANs communicate","tone":"ok","focus":["R1"],"flows":[{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings 2001:db8:acad:1::10","tags":{"PCB":"Via default gateway fe80::1","R1":"C 2001:db8:acad:1::/64 → Gi0/0"},"backTags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings PC-B-AUTO","tags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}},{"event":["R1"],"tags":{"R1":"Neighbors on Gi0/0 and Gi0/1"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Automatic · gateway fe80::1"}],"rows":[["Both endpoint pings","Succeed","ok"],["R1 routes","Connected /64 per LAN · no static"],["Neighbor entries","Reachable or stale · both normal","dim"]]}
```

## Step 7: Observe a new neighbor-resolution exchange

You will add a second address, `2001:db8:acad:1::99`, to R1 Gi0/0 and watch PC-A resolve it. Before you start, work out the solicited-node multicast address for that address from its last 24 bits and write it in the worksheet.

Add the address. An interface can hold several IPv6 addresses, so this command does not replace the first one.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::99/64
R1(config-if)# end
```

Switch Packet Tracer to Simulation mode and set the event filter to show only ICMPv6 and NDP. From PC-A, ping `2001:db8:acad:1::99`. Step through the events and open each packet to read its source, destination and target. PC-A has never sent to this address, so it has no neighbor entry for it and must send a Neighbor Solicitation first.

:::expected
PC-A sends an NS with target `2001:db8:acad:1::99` to the solicited-node group `ff02::1:ff00:99`. R1 answers with an NA that carries its MAC address, and the echo request and reply follow. You may also see R1's periodic RAs or its own duplicate-address check for the new address. Tell the messages apart by their source, destination and target.

If your version does not show this detail, note that and sketch the sequence from the lesson instead. Return to Realtime mode before you continue.
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
All three pings succeed. PC-B is now static so that Step 9 tests forwarding alone. A SLAAC host depends on R1's Router Advertisements, which also stop in that step and would blur the result.
:::

```state
{"status":"Static hosts, all pings work","tone":"ok","focus":["PCB"],"flows":[{"event":["R1","PCB"],"wait":1.6,"tags":{"R1":"2001:db8:acad:1::99 removed","PCB":"Static 2001:db8:acad:2::20/64"}},{"path":["PCB","SW2","R1"],"back":true,"label":"PC-B pings R1-LAN2"},{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings 2001:db8:acad:1::10","tags":{"R1":"C 2001:db8:acad:1::/64 → Gi0/0"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings 2001:db8:acad:2::20","tags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}}],"chips":[{"node":"R1","text":"ipv6 unicast-routing"},{"node":"R1","text":"Secondary ::99","tone":"warn","until":0},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Automatic · gateway fe80::1","until":0},{"node":"PCB","text":"Static · gateway fe80::1","from":0}],"rows":[["PC-B","2001:db8:acad:2::20/64 · static"],["Secondary ::99","Removed from Gi0/0"],["Local and cross-LAN pings","Succeed","ok"]]}
```

## Step 9: Disable forwarding and observe the difference

Write your prediction for both pings in the worksheet first. Then turn IPv6 routing off and leave it off until you have both results. You would not do this on a production router.

```ios R1
R1# configure terminal
R1(config)# no ipv6 unicast-routing
R1(config)# end
R1# show ipv6 interface brief
```

Repeat PC-A's ping to its local router address `2001:db8:acad:1::1`, then to remote PC-B `2001:db8:acad:2::20`. On PC-B, separately ping **R1-LAN2**.

:::expected
Each PC still reaches the router address on its own LAN, but the PC-to-PC ping fails. `show ipv6 interface brief` shows the same addresses as before. R1 now behaves as an IPv6 host: it answers for its own addresses and forwards nothing.

R1 has also stopped sending Router Advertisements, so a SLAAC host would lose its default gateway. The static PC addresses keep that second effect out of this test.
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
Press Enter at the destination-filename prompt and wait for the copy to finish. Both LAN /64s are in the routing table and the PCs reach each other again. Save the project as `19-ipv6-addressing-baseline.pkt`. Keep the exact R1-LAN2 address in your notes: Gi0/1 uses EUI-64, so `2001:db8:acad:2::1` does not exist on R1.
:::

```state
{"status":"Forwarding restored, saved","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"ipv6 unicast-routing restored"}},{"path":["PCA","SW1","R1","SW2","PCB"],"back":true,"label":"PC-A pings 2001:db8:acad:2::20","tags":{"R1":"C 2001:db8:acad:2::/64 → Gi0/1"}},{"path":["PCB","SW2","R1","SW1","PCA"],"back":true,"label":"PC-B pings 2001:db8:acad:1::10","tags":{"R1":"C 2001:db8:acad:1::/64 → Gi0/0"}},{"event":["R1"],"tags":{"R1":"copy running-config startup-config"}}],"chips":[{"node":"R1","text":"Forwarding disabled","tone":"bad","until":0},{"node":"R1","text":"ipv6 unicast-routing","from":0},{"node":"PCA","text":"Static · gateway fe80::1"},{"node":"PCB","text":"Static · gateway fe80::1"}],"rows":[["Both LAN /64s","In show ipv6 route","ok"],["PC-to-PC","Works in both directions","ok"],["Project","19-ipv6-addressing-baseline.pkt","ok"],["R1-LAN2","EUI-64 value, not 2001:db8:acad:2::1"]]}
```

## Troubleshooting

- **A ping to an address on the same LAN fails:** compare the target with the configured address group by group, then check the link state and the /64 at both ends. DNS is not involved when you ping a numeric address.
- **PC-B on Automatic has only a link-local address:** no Router Advertisement is reaching it. Check `ipv6 unicast-routing` on R1, that Gi0/1 is up/up and that it has its /64 address. SLAAC needs no DHCPv6 server.
- **A PC cannot reach `2001:db8:acad:2::1`:** that address does not exist. Gi0/1 uses EUI-64, so read its real address from `show ipv6 interface brief`, or use `fe80::1` as the gateway.
- **A neighbor entry stays INCMP:** the target is not answering on that link. Check that the address is configured, that the device is on the right LAN and that its interface is up.
- **Pings to the local router address work but cross-LAN pings fail:** check `ipv6 unicast-routing`, both PC gateways and the two connected prefixes. Step 9 produced exactly this symptom.
- **Your output differs from the examples:** MAC addresses and generated suffixes are specific to your devices. Trust your own calculation over the sample values.

## Challenge

Work on a copy of the saved baseline. First do two calculations on paper:

1. Derive the modified EUI-64 address for MAC `02:aa:bb:cc:dd:ee` under `2001:db8:44:7::/64`, then derive its solicited-node multicast group.
2. Find the first and last /64 in `2001:db8:44:ab30::/60`. Number the /64s starting at **1** and allocate the **third** to a new LAN C.

Then build LAN C. Add a new 2960 switch, SW3, and PC-C. Connect R1 Gi0/2 to SW3 Fa0/24 and PC-C FastEthernet0 to SW3 Fa0/1 with straight-through copper. Leave SW3 in the default VLAN 1 and do not connect it to another switch. On the /64 you allocated, give the router the interface ID `::1`, the host `::10`, and the router the link-local address `fe80::3`. Configure PC-C statically with the matching address, prefix length 64 and the router's link-local address as its gateway. Leave both original LANs unchanged.

Write down the prefix, the complete router and host addresses, the gateway and your commands before you open the solution. Test PC-C to its router and to PC-A at `2001:db8:acad:1::10`, then PC-A back to PC-C. Check the three connected /64s and the interface shown for each neighbor. Explain why no static route is needed and why `fe80::1` could be used on both original links.

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

Each test succeeds once Neighbor Discovery has resolved the addresses. R1 is directly connected to all three prefixes and has IPv6 routing enabled, so it needs no static routes. `fe80::1` could repeat on Gi0/0 and Gi0/1 because they are separate links, and link-local addresses only have to be unique on their own link. Save R1's running configuration, then save the project under a new filename so that the two-LAN baseline stays intact. If a test fails, write down the exact addresses, gateway and interface state before you change anything.
:::
