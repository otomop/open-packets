---
title: Trace an IPsec VPN and distinguish transport, negotiation and application faults
environment: packet-tracer
devices: ["Required baseline: 3 × Cisco 2911, 2 × Catalyst 2960, 2 × PC-PT", "Optional encryption: 2 × ISR 4351 with supported IOS XE and IPsec capability, replacing the two edge routers"]
minutes: 60
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

This lab has two parts. In Packet Tracer you build the routed network that a VPN would cross and prove what works, and what does not, before any encryption. Then you work through a worksheet of supplied IKEv2 and IPsec output from that same network: a healthy tunnel, a tunnel broken by a filter, and its recovery. Both exam versions ask you to **describe** IPsec VPNs, so reading the evidence matters more than typing the configuration.

Packet Tracer does not support the IKEv2 commands. Step 4 is therefore an optional configuration reference for two real IOS XE routers; it was written for ISR 4351 routers running IOS XE 16.12 with the IPsec feature set. Do not paste it into Packet Tracer, and do not swap in IKEv1 or weak algorithms to make a simulator accept it.

The required path is Steps 1–3, the supplied output in Steps 5–8, and the summary in Step 9: about 60 minutes. Step 4 and the blocks marked “optional live VPN” are extra practice for anyone with suitable routers.

The VPN status, counter and capture examples in this lab are representative teaching output, not captures from a live network.

## Topology

Use new/default devices. All host-to-switch and switch-to-router links use copper straight-through. The two router-to-ISP links use copper crossover or Packet Tracer's automatic cable choice. SW-BR and SW-HQ use default VLAN 1 access ports; no switch management address is needed.

```diagram
{ "type": "topology", "title": "A branch and headquarters through a transit router", "caption": "ISP has only the two WAN /30 networks. An encrypted tunnel-mode packet is routed using the edge routers' WAN addresses.", "nodes": [ { "id": "P1", "kind": "pc", "label": "PC-BR", "sub": "10.1.1.10/24", "x": 0.5, "y": 3 }, { "id": "S1", "kind": "switch", "label": "SW-BR", "x": 2, "y": 3 }, { "id": "B", "kind": "router", "label": "R-BR", "sub": "198.51.100.1", "x": 4, "y": 3 }, { "id": "I", "kind": "router", "label": "ISP", "sub": "WAN routes only", "x": 6.5, "y": 3 }, { "id": "H", "kind": "router", "label": "R-HQ", "sub": "203.0.113.1", "x": 9, "y": 3 }, { "id": "S2", "kind": "switch", "label": "SW-HQ", "x": 11, "y": 3 }, { "id": "P2", "kind": "pc", "label": "PC-HQ", "sub": "10.2.2.20/24", "x": 12.5, "y": 3 } ], "links": [ { "from": "P1", "to": "S1" }, { "from": "S1", "to": "B" }, { "from": "B", "to": "I", "label": "198.51.100.0/30", "accent": true }, { "from": "I", "to": "H", "label": "203.0.113.0/30", "accent": true }, { "from": "H", "to": "S2" }, { "from": "S2", "to": "P2" } ] }
```

| Device / baseline port | Connected port | Address / mask | Gateway or next hop |
|---|---|---|---|
| R-BR G0/0 | ISP G0/0 | `198.51.100.1 / 255.255.255.252` | Default route via `198.51.100.2` |
| ISP G0/0 | R-BR G0/0 | `198.51.100.2 / 255.255.255.252` | None |
| ISP G0/1 | R-HQ G0/0 | `203.0.113.2 / 255.255.255.252` | None |
| R-HQ G0/0 | ISP G0/1 | `203.0.113.1 / 255.255.255.252` | Default route via `203.0.113.2` |
| R-BR G0/1 | SW-BR Gi0/1 | `10.1.1.1 / 255.255.255.0` | None |
| PC-BR FastEthernet0 | SW-BR Fa0/1 | `10.1.1.10 / 255.255.255.0` | `10.1.1.1` |
| R-HQ G0/1 | SW-HQ Gi0/1 | `10.2.2.1 / 255.255.255.0` | None |
| PC-HQ FastEthernet0 | SW-HQ Fa0/1 | `10.2.2.20 / 255.255.255.0` | `10.2.2.1` |

If you use ISR 4351 routers for the optional steps, baseline G0/0 becomes **GigabitEthernet0/0/0** and G0/1 becomes **GigabitEthernet0/0/1**; Step 4 already uses those names. Do not configure NAT, GRE, OSPF or any private routes on ISP.

## Step 1: Build the routed baseline

Cable the devices and set both PC addresses and gateways under Desktop → IP Configuration → Static. Use the routers' local CLI tabs. No DNS is needed because every baseline test uses an address.

```ios R-BR
Router> enable
Router# configure terminal
Router(config)# hostname R-BR
R-BR(config)# interface gigabitethernet0/0
R-BR(config-if)# ip address 198.51.100.1 255.255.255.252
R-BR(config-if)# no shutdown
R-BR(config-if)# exit
R-BR(config)# interface gigabitethernet0/1
R-BR(config-if)# ip address 10.1.1.1 255.255.255.0
R-BR(config-if)# no shutdown
R-BR(config-if)# exit
R-BR(config)# ip route 0.0.0.0 0.0.0.0 198.51.100.2
R-BR(config)# end
```

```ios ISP
Router> enable
Router# configure terminal
Router(config)# hostname ISP
ISP(config)# interface gigabitethernet0/0
ISP(config-if)# ip address 198.51.100.2 255.255.255.252
ISP(config-if)# no shutdown
ISP(config-if)# exit
ISP(config)# interface gigabitethernet0/1
ISP(config-if)# ip address 203.0.113.2 255.255.255.252
ISP(config-if)# no shutdown
ISP(config-if)# end
```

```ios R-HQ
Router> enable
Router# configure terminal
Router(config)# hostname R-HQ
R-HQ(config)# interface gigabitethernet0/0
R-HQ(config-if)# ip address 203.0.113.1 255.255.255.252
R-HQ(config-if)# no shutdown
R-HQ(config-if)# exit
R-HQ(config)# interface gigabitethernet0/1
R-HQ(config-if)# ip address 10.2.2.1 255.255.255.0
R-HQ(config-if)# no shutdown
R-HQ(config-if)# exit
R-HQ(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.2
R-HQ(config)# end
```

:::expected
Each PC and its local router share a /24. Each WAN link has the two usable addresses of its /30. ISP needs only its connected WAN routes to reach either edge's public address. These documentation WAN addresses model a transit network; this lab is not connected to the public Internet.
:::

```state
{"status":"Routed baseline built","cabled":true,"addressed":true,"led":true,"focus":["B","I","H"],"chips":[{"node":"B","text":"Default → 198.51.100.2"},{"node":"H","text":"Default → 203.0.113.2"}],"rows":[["Each site","PC and router share a /24"],["Each WAN link","Two usable addresses of a /30"],["ISP routes","Connected WAN /30s only"],["PC gateways","10.1.1.1 · 10.2.2.1"]]}
```

## Step 2: Verify what works before IPsec

On each router, inspect `show ip interface brief` and `show ip route`. From PC-BR ping `10.1.1.1`; from PC-HQ ping `10.2.2.1`. From the edge routers test the opposite public address:

```ios R-BR
R-BR# ping 203.0.113.1
R-BR# show ip route 203.0.113.1
```

```ios R-HQ
R-HQ# ping 198.51.100.1
R-HQ# show ip route 198.51.100.1
```

Now predict: can ISP forward a packet addressed to `10.2.2.20` using the routes it has? Then ping `10.2.2.20` from PC-BR and record the result. Do not add a private route to ISP.

:::expected
The gateway pings and the edge-to-edge public pings succeed (the first may time out while ARP resolves). The PC-BR to PC-HQ ping fails. R-BR's default route gets the packet to ISP, but ISP has no route to `10.2.2.0/24` and drops it, so PC-BR shows a timeout or “Destination host unreachable”. This is the problem a tunnel-mode VPN solves: ISP only ever has to route the public addresses. Save the file as `vpn-underlay.pkt`.
:::

```state
{"status":"Underlay up · no LAN route","tone":"ok","focus":["B","I","H"],"flows":[{"path":["P1","S1","B"],"back":true,"label":"PC-BR pings 10.1.1.1"},{"path":["P2","S2","H"],"back":true,"with":true,"tone":"alt","label":"PC-HQ pings 10.2.2.1"},{"path":["B","I","H"],"back":true,"label":"R-BR pings 203.0.113.1","tags":{"B":"Default route → 198.51.100.2","I":"Connected 203.0.113.0/30 · G0/1"}},{"path":["H","I","B"],"back":true,"label":"R-HQ pings 198.51.100.1","tags":{"H":"Default route → 203.0.113.2","I":"Connected 198.51.100.0/30 · G0/0"}},{"path":["P1","S1","B","I"],"label":"PC-BR pings 10.2.2.20","tags":{"B":"Default route → 198.51.100.2"},"stop":"I","stopText":"No route to 10.2.2.20"}],"chips":[{"node":"B","text":"Default → 198.51.100.2"},{"node":"H","text":"Default → 203.0.113.2"}],"rows":[["Local gateway pings","Both succeed","ok"],["Edge public-address pings","Both succeed","ok"],["PC-BR → 10.2.2.20","Fails · ISP has no LAN route","dim"],["Saved as","vpn-underlay.pkt"]]}
```

## Step 3: Draw the protected packet on paper

For an ESP tunnel-mode VPN with encryption between R-BR and R-HQ, write the source and destination at three points: PC-BR to R-BR, R-BR to ISP, and R-HQ to PC-HQ. Identify where the original IP header is encrypted and which destination ISP uses. Then describe what plain GRE would change.

:::solution Check the packet drawing
Before R-BR: original IP `10.1.1.10 -> 10.2.2.20`. Across ISP: outer IP `198.51.100.1 -> 203.0.113.1`, then the ESP header, then the encrypted original packet. After R-HQ decrypts: original IP `10.1.1.10 -> 10.2.2.20` again. ISP forwards on `203.0.113.1` and never sees the inner destination. Plain GRE would add the same kind of outer header but no encryption, so anyone on the path could read the inner packet.
:::

```state
{"status":"Paper: tunnel-mode packet","focus":["B","H"],"chips":[{"node":"B","text":"VPN peer"},{"node":"H","text":"VPN peer"}],"rows":[["VPN","ESP tunnel mode · with encryption"],["Peers","R-BR and R-HQ"],["Write src → dst at","PC-BR→R-BR · R-BR→ISP · R-HQ→PC-HQ"],["Then contrast","Plain GRE"]]}
```

## Step 4: Optional supported IOS XE IKEv2 configuration

This step is optional and needs real IOS XE routers; **do not paste it into Packet Tracer.** If you are working from the worksheet, read the explanation below to see how the parts of an IKEv2 configuration fit together, then continue to Step 5. If you have suitable routers, complete Steps 1–2 on them first and check that `crypto ikev2 ?` is accepted in global configuration mode.

:::solution Optional IOS XE implementation reference
The lesson described these ideas; here is how IOS XE expresses them. The configuration has five parts:

- **IKEv2 proposal and policy:** the algorithms offered for the IKE SA (`encryption`, `integrity`, `prf` and the Diffie-Hellman `group`). The policy says which proposal to use.
- **IKEv2 profile:** who the peer is (`match identity remote address`) and how each side authenticates, here with the same pre-shared key on both routers.
- **Transform set:** the ESP algorithms and mode for the IPsec SAs, here AES-256 with a SHA-256 HMAC in tunnel mode.
- **Crypto ACL (`VPN-SELECT`):** which traffic to encrypt.
- **Crypto map:** ties the peer, profile, transform set and ACL together, and is applied to the WAN interface.

`prf` is the pseudorandom function IKE uses to derive keys. The names (`CCNA-PROPOSAL` and so on) are local to each router; the algorithms and the key must match on both. The pre-shared key shown is for this isolated exercise only.

```ios R-BR — optional IOS XE
R-BR# configure terminal
R-BR(config)# crypto ikev2 proposal CCNA-PROPOSAL
R-BR(config-ikev2-proposal)# encryption aes-cbc-256
R-BR(config-ikev2-proposal)# integrity sha256
R-BR(config-ikev2-proposal)# prf sha256
R-BR(config-ikev2-proposal)# group 14
R-BR(config-ikev2-proposal)# exit
R-BR(config)# crypto ikev2 policy CCNA-POLICY
R-BR(config-ikev2-policy)# proposal CCNA-PROPOSAL
R-BR(config-ikev2-policy)# exit
R-BR(config)# crypto ikev2 profile CCNA-PROFILE
R-BR(config-ikev2-profile)# match identity remote address 203.0.113.1 255.255.255.255
R-BR(config-ikev2-profile)# identity local address 198.51.100.1
R-BR(config-ikev2-profile)# authentication remote pre-share key 0 CCNA-Only-35-Lab!
R-BR(config-ikev2-profile)# authentication local pre-share key 0 CCNA-Only-35-Lab!
R-BR(config-ikev2-profile)# exit
R-BR(config)# crypto ipsec transform-set CCNA-ESP esp-aes 256 esp-sha256-hmac
R-BR(cfg-crypto-trans)# mode tunnel
R-BR(cfg-crypto-trans)# exit
R-BR(config)# ip access-list extended VPN-SELECT
R-BR(config-ext-nacl)# permit ip 10.1.1.0 0.0.0.255 10.2.2.0 0.0.0.255
R-BR(config-ext-nacl)# exit
R-BR(config)# crypto map CCNA-MAP 10 ipsec-isakmp
R-BR(config-crypto-map)# set peer 203.0.113.1
R-BR(config-crypto-map)# set transform-set CCNA-ESP
R-BR(config-crypto-map)# set ikev2-profile CCNA-PROFILE
R-BR(config-crypto-map)# match address VPN-SELECT
R-BR(config-crypto-map)# exit
R-BR(config)# interface gigabitethernet0/0/0
R-BR(config-if)# crypto map CCNA-MAP
R-BR(config-if)# end
```

```ios R-HQ — optional IOS XE
R-HQ# configure terminal
R-HQ(config)# crypto ikev2 proposal CCNA-PROPOSAL
R-HQ(config-ikev2-proposal)# encryption aes-cbc-256
R-HQ(config-ikev2-proposal)# integrity sha256
R-HQ(config-ikev2-proposal)# prf sha256
R-HQ(config-ikev2-proposal)# group 14
R-HQ(config-ikev2-proposal)# exit
R-HQ(config)# crypto ikev2 policy CCNA-POLICY
R-HQ(config-ikev2-policy)# proposal CCNA-PROPOSAL
R-HQ(config-ikev2-policy)# exit
R-HQ(config)# crypto ikev2 profile CCNA-PROFILE
R-HQ(config-ikev2-profile)# match identity remote address 198.51.100.1 255.255.255.255
R-HQ(config-ikev2-profile)# identity local address 203.0.113.1
R-HQ(config-ikev2-profile)# authentication remote pre-share key 0 CCNA-Only-35-Lab!
R-HQ(config-ikev2-profile)# authentication local pre-share key 0 CCNA-Only-35-Lab!
R-HQ(config-ikev2-profile)# exit
R-HQ(config)# crypto ipsec transform-set CCNA-ESP esp-aes 256 esp-sha256-hmac
R-HQ(cfg-crypto-trans)# mode tunnel
R-HQ(cfg-crypto-trans)# exit
R-HQ(config)# ip access-list extended VPN-SELECT
R-HQ(config-ext-nacl)# permit ip 10.2.2.0 0.0.0.255 10.1.1.0 0.0.0.255
R-HQ(config-ext-nacl)# exit
R-HQ(config)# crypto map CCNA-MAP 10 ipsec-isakmp
R-HQ(config-crypto-map)# set peer 198.51.100.1
R-HQ(config-crypto-map)# set transform-set CCNA-ESP
R-HQ(config-crypto-map)# set ikev2-profile CCNA-PROFILE
R-HQ(config-crypto-map)# match address VPN-SELECT
R-HQ(config-crypto-map)# exit
R-HQ(config)# interface gigabitethernet0/0/0
R-HQ(config-if)# crypto map CCNA-MAP
R-HQ(config-if)# end
```

The crypto ACL on each router is the mirror image of the other's. Each router's default route sends LAN traffic toward the WAN interface, where the crypto map encrypts whatever matches the ACL. The keyword `ipsec-isakmp` appears in every IKE-negotiated crypto map, IKEv1 or IKEv2; `set ikev2-profile` is what selects IKEv2. ISP still has no private routes, and these unicast pings need no GRE tunnel.
:::

```state
{"status":"Optional: IOS XE reference","focus":["B","H"],"rows":[["Platform","Supported IOS XE edge routers only"],["Packet Tracer baseline","Do not paste this configuration"],["Confirm first","show version · crypto ikev2 support"],["Worksheet learners","Skip to Step 5","dim"]]}
```

## Step 5: Read negotiation and data evidence separately

On real routers, ping PC-HQ from PC-BR. The first one or two requests are usually lost while IKE negotiates, so ping again. Ping from the PC, not from the router: a router-sourced ping uses the WAN address and does not match the crypto ACL. Then run:

```ios R-BR
R-BR# show crypto ikev2 sa
R-BR# show crypto ipsec sa
R-BR# show crypto map
R-BR# show access-lists VPN-SELECT
```

Run the first two commands on R-HQ as well. If you have no live VPN, use the supplied output below, which summarizes those commands on both routers for the Step 4 configuration with no NAT on the path. Before opening the answer, write down what each of these proves on its own: the IKE status, each counter, and the ping result.

```output Representative evidence for one controlled test interval
R-BR IKEv2: local 198.51.100.1/500, remote 203.0.113.1/500, READY
R-BR IPsec selectors: local 10.1.1.0/24, remote 10.2.2.0/24
R-HQ IPsec selectors: local 10.2.2.0/24, remote 10.1.1.0/24
Negotiated data protection: ESP AES-256 with SHA-256 integrity, tunnel mode
WAN packet type for protected data: native ESP, IP protocol 50

Counter deltas during fresh PC-BR -> PC-HQ echo tests:
R-BR: encaps +4, decaps +4
R-HQ: encaps +4, decaps +4
Host observation: echo replies received
```

:::solution Compare negotiation, data and host evidence
`READY` proves that IKE negotiated and authenticated, nothing more. The counters prove data: R-BR encrypted four echo requests and R-HQ decrypted four, then R-HQ encrypted four replies and R-BR decrypted four. The ping result proves the application. ISP still has no route to either LAN; it forwarded outer packets between `198.51.100.1` and `203.0.113.1`.
:::

```state
{"status":"Supplied evidence · one test interval","tone":"ok","focus":["B","H"],"flows":[{"path":["B","I","H"],"back":true,"label":"IKEv2 negotiation","tags":{"B":"IKEv2 to 203.0.113.1 · UDP 500"},"backTags":{"B":"IKEv2 SA READY"}},{"path":["P1","S1","B","I","H","S2","P2"],"back":true,"label":"PC-BR pings 10.2.2.20","tags":{"B":"VPN-SELECT match · ESP encaps","I":"Forwards on outer 203.0.113.1","H":"ESP decaps · to 10.2.2.20"},"backTags":{"H":"Selector match · ESP encaps","I":"Forwards on outer 198.51.100.1","B":"ESP decaps · to 10.1.1.10"}}],"chips":[{"node":"B","text":"IKEv2 READY","tone":"ok","from":1}],"rows":[["R-BR IKEv2","READY · UDP 500 at both ends","ok"],["WAN data","Native ESP · IP protocol 50"],["Counters, both peers","encaps +4 · decaps +4","ok"],["Host result","Echo replies received","ok"]]}
```

## Step 6: Introduce a native-ESP filter fault and observe

Now break the tunnel in a way that leaves IKE healthy. An ACL on ISP, applied outbound toward R-HQ, denies ESP from R-BR and permits everything else. Unlike the crypto ACL `VPN-SELECT`, this one is applied with `ip access-group`, so it really drops packets. Before reading on, predict which of these three it passes: a ping to R-HQ's public address, IKE on UDP 500, and ESP.

```ios ISP — optional live VPN environment
ISP# configure terminal
ISP(config)# ip access-list extended VPN-FAULT
ISP(config-ext-nacl)# deny esp host 198.51.100.1 host 203.0.113.1
ISP(config-ext-nacl)# permit ip any any
ISP(config-ext-nacl)# exit
ISP(config)# interface gigabitethernet0/1
ISP(config-if)# ip access-group VPN-FAULT out
ISP(config-if)# end
ISP# show access-lists VPN-FAULT
ISP# show ip interface gigabitethernet0/1
```

Send new host-to-host pings and compare both peers' counters. Also test a public-address ping from R-BR. Do not remove the fault until you have explained the following representative observations.

```output Representative fault evidence
Public-address ping R-BR -> 203.0.113.1: succeeds
Fresh PC-BR -> PC-HQ ping: fails
R-BR IKEv2 relationship: still present
During the fresh host test:
  R-BR encaps increases; R-BR decaps does not increase
  ISP VPN-FAULT ESP deny counter increases
  R-HQ decaps does not increase
```

:::solution Explain the supplied fault evidence
The public ping is ICMP and IKE is UDP, so both match `permit ip any any`. The user data is ESP, IP protocol 50, and matches the deny. That is how a working ping and a `READY` IKE SA can sit alongside failing user traffic. R-BR's counters alone (encaps up, decaps flat) say only that nothing came back; the ACL's deny counter and R-HQ's flat decaps counter are what locate the fault on ISP. The Packet Tracer baseline carries no ESP, so this ACL would block nothing there.
:::

```state
{"status":"Native ESP denied at ISP","tone":"bad","focus":["I"],"flows":[{"event":["I"],"wait":1.2,"tags":{"I":"VPN-FAULT out G0/1 · deny ESP"}},{"path":["B","I","H"],"back":true,"label":"R-BR pings 203.0.113.1","tags":{"I":"ICMP passes permit ip any any"}},{"path":["P1","S1","B","I","H"],"label":"PC-BR pings 10.2.2.20","tags":{"B":"ESP encaps · counter rises"},"stop":"I","stopText":"deny esp · VPN-FAULT out G0/1"}],"chips":[{"node":"I","text":"VPN-FAULT out G0/1","tone":"bad","from":0},{"node":"B","text":"IKEv2 still present"}],"rows":[["Public ping · IKEv2","Succeeds · still present","ok"],["R-BR counters","encaps up · decaps flat","bad"],["VPN-FAULT ESP deny","Counter increases","bad"],["R-HQ decaps","No increase","bad"]]}
```

## Step 7: Remove the fault and verify recovery

In the live optional environment, remove the attachment through ISP's local console. Worksheet learners should predict the next observations before reading the expected result.

```ios ISP
ISP# configure terminal
ISP(config)# interface gigabitethernet0/1
ISP(config-if)# no ip access-group VPN-FAULT out
ISP(config-if)# end
ISP# show ip interface gigabitethernet0/1
```

Ping between the hosts again and recheck the counters on both routers. The existing SAs carry the traffic as soon as the filter is gone; there is no need to clear them.

:::solution Check the separate recovery prediction
`show ip interface gigabitethernet0/1` reports “Outgoing access list is not set”. Pings succeed again, and encaps and decaps both rise on both routers. The `VPN-FAULT` ACL still exists but is applied nowhere; remove it with `no ip access-list extended VPN-FAULT` if you want a clean configuration.
:::

```state
{"status":"Filter removed · retest","focus":["I"],"flows":[{"event":["I"],"wait":1.2,"tags":{"I":"VPN-FAULT removed from G0/1"}}],"chips":[{"node":"I","text":"VPN-FAULT out G0/1","tone":"bad","until":0},{"node":"I","text":"VPN-FAULT detached from G0/1","from":0}],"rows":[["ISP G0/1","no ip access-group VPN-FAULT out"],["Retest","Host pings · both peers' IPsec counters"],["Clear crypto","Not needed for this fault"]]}
```

## Step 8: Compare a remote-access user and NAT-T

This is a paper exercise; the topology does not include a configured remote-access headend. A laptop on hotel Wi-Fi authenticates to the corporate gateway using an IKEv2/IPsec client. The hotel translates the laptop's private source address with PAT. The gateway assigns VPN address `10.250.0.10` and a split-tunnel route for `10.2.2.0/24`.

Explain: which device is the remote IPsec endpoint; how the translated path can carry ESP; whether a public website outside the split route is protected by this tunnel; and whether a successful VPN login guarantees access to PC-HQ. Then contrast the arrangement with the site-to-site branch.

:::solution Check the remote-access comparison
The laptop is the remote endpoint; the hotel router only translates. Because PAT is on the path, IKE detects it and both ends wrap ESP in UDP 4500 (NAT-T). The public website is outside the split-tunnel route, so that traffic goes straight out of the hotel connection without VPN protection. A successful login does not guarantee access to PC-HQ: the gateway's access policy must still allow it. In the site-to-site case R-BR is the endpoint, it protects traffic for every host on its LAN, and no host runs a client.
:::

```state
{"status":"Paper: remote access · NAT-T","focus":["B"],"chips":[{"node":"B","text":"Compare: site-to-site branch"}],"rows":[["Client","Laptop on hotel Wi-Fi · IKEv2/IPsec"],["Hotel","PAT on the laptop's private source"],["VPN address","10.250.0.10"],["Split-tunnel route","10.2.2.0/24"]]}
```

## Step 9: Save the environment and write the evidence summary

Keep the required Packet Tracer file labeled as an underlay exercise. If you completed the optional live VPN, save the recovered configurations on all three routers and retain the actual show output separately from this worksheet.

```ios R-BR
R-BR# copy running-config startup-config
```

```ios R-HQ
R-HQ# copy running-config startup-config
```

```ios ISP
ISP# copy running-config startup-config
```

:::expected
Accept the default filename `startup-config`. Your summary names the two protected LANs, both peer addresses, the IKE version, the ESP mode and algorithms, whether data travelled as ESP or inside UDP 4500, and what you saw in the healthy, faulted and recovered states. The only service tested was ICMP echo. If you worked from the supplied output, say so.
:::

### Evidence to keep

- The baseline results: which pings worked, and why PC-BR could not reach PC-HQ.
- Your drawing of the inner and outer packet, marking where encryption starts and ends.
- What the IKE status, the counters and the ping each proved in Step 5.
- Your explanation of the ESP filter fault and of the recovery.
- Your answers to the remote-access comparison and the challenge.

```state
{"status":"Saved and summarized","tone":"ok","focus":["B","I","H"],"chips":[{"node":"B","text":"startup-config saved","tone":"ok"},{"node":"I","text":"startup-config saved","tone":"ok"},{"node":"H","text":"startup-config saved","tone":"ok"}],"rows":[["Packet Tracer file","Labeled as an underlay exercise"],["Tested service","ICMP echo only"],["Worksheet results","Supplied, not live measurements"]]}
```

## Troubleshooting

- **Public-address ping fails:** check interfaces, /30 masks, connected routes and both edge default routes. Restore underlay reachability before investigating IKE.
- **Public ping works but IKE does not:** inspect the configured IKE version, UDP transport policy, peer identity, matching proposals and authentication. A ping does not test those requirements.
- **No data counters change:** confirm the actual source and destination match the selector and the correct map is attached. A public-interface-sourced ping is not the LAN-to-LAN test.
- **Only outbound protection increases:** check the far peer's received traffic, access policy, host reply generation, return route and return protection. Do not infer a unique wrong key or selector from that counter pattern alone.
- **Counter totals exist but current traffic fails:** they may be historical. Measure new deltas for the relevant SA while running a fresh test.
- **Both data directions work but an application fails:** test the service, host firewall, DNS if names are used, user authorization and packet-size behavior.
- **A crypto command is rejected:** confirm the exact model, release and supported features. Packet Tracer and a generic CML node are not substitutes for the optional IOS XE platform.

## Challenge

Complete this independent paper case without using the guided topology's addresses. No remote-access server or client deployment is assumed.

A laptop behind hotel PAT establishes a remote-access IKEv2/IPsec VPN. Its hotel address is `192.168.50.10`; the PAT public address is `198.51.100.50`. The corporate gateway is `203.0.113.5`. The VPN assigns inner address `10.250.35.10` and protects only destinations in `10.35.8.0/23`; other destinations follow the local Internet route. The negotiated mode is ESP tunnel with encryption and integrity, carried using UDP NAT-T. Server `10.35.9.80` serves a controlled HTTP application. A public website is at `192.0.2.80` and uses HTTPS.

1. Identify the IPsec endpoints, inner HTTP request addresses, and outer addresses visible on the hotel uplink after PAT. State the encapsulation's destination port.
2. Decide which of the two destinations is covered by the split route. Explain whether the public website may still have protection outside this VPN.
3. Draw what remains visible to the transit network and what is encrypted. Contrast a simple host-to-host ESP transport-mode packet.
4. During a fresh request to `10.35.9.80`, the relevant client SA changes from encaps 900/decaps 300 to encaps 906/decaps 306. The application returns its normal login page, then displays “This account is not authorized” after login. State what the combined evidence supports, what it does not prove about other flows, and the next responsible owner/check.
5. A later screenshot contains the same totals but no new test. Does it demonstrate that the application works at that later time? Define the evidence needed for closure.

:::solution Check the new remote-access case
The laptop and corporate gateway terminate IPsec; the hotel PAT device does not. The original HTTP request uses inner `10.250.35.10 → 10.35.9.80`. The hotel uplink sees outer `198.51.100.50 → 203.0.113.5` with UDP destination port 4500 in the stated NAT-T arrangement. PAT may also translate the UDP source port; there is no need to assume one source-port mapping.

The /23 covers `10.35.8.0–10.35.9.255`, so the internal server is included. `192.0.2.80` is outside that VPN selection; its HTTPS connection can have separate application-layer protection. The VPN icon does not make that local route part of the split tunnel.

Transit observers can see outer addresses, UDP/ESP wrapper information, lengths and timing. The original host packet is inside encrypted ESP content. In the simple ESP transport-mode comparison, the original endpoint IP header remains the routing header rather than being enclosed in a new IPsec outer header.

The measured interval adds six encapsulations and six successful decapsulations, and the returned page establishes a working application transaction for that selected test. The subsequent account denial calls for checking the application's identity/authorization policy with its owner. It does not justify rebuilding IKE or declaring every destination and user permitted. It also does not prove an exact six HTTP transactions: packets and application transactions are different units.

Unchanged cumulative totals without a fresh test do not establish present service. Record the intended source, destination, service and authorization requirement; inspect relevant new deltas; then repeat the authorized user's actual application action. Document whether the evidence was supplied on paper or measured on a supported implementation.
:::
