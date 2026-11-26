---
title: Verify an access-port security policy
environment: mixed
devices: ["1 × 2960-24TT switch (SW1)", "1 × 2911 router (R1)", "2 × PCs (PC-A and PC-B)", "1 × Printer-PT", "RA guard extension: supported Catalyst switch, two IPv6 routers and test PC"]
minutes: 110
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You will build a small IPv4 LAN, then add port security, DHCP snooping, DAI and storm control one at a time. For each control you watch it block something, read the evidence on the switch, and repair the fault. The last module applies RA guard to IPv6. Keep everything on an isolated lab network.

Packet Tracer implements a subset of IOS, and its support for DHCP snooping, DAI, ARP ACLs and storm control varies with the switch model and Packet Tracer version. If a command is missing, use a switch that supports it, or work the step from the supplied values and record it as **not executed**. For v2.0, come back to any step you could not run when you have a supporting platform.

The lab has four modules that you can do in separate sessions: **A, Steps 1–4: port security**; **B, Steps 5–9: DHCP snooping and DAI**; **C, Step 10: storm control**; **D, Steps 11–13: IPv6 RA guard on a supporting switch, or its paper path**. Step 14 verifies and saves the results. The DHCP server and IPv6 router commands are supplied and explained briefly where they appear; Chapters 24 and 19 teach them in full.

## Topology

| Connection | SW1 port | Endpoint addressing |
|---|---|---|
| R1 Gi0/0 | Gi0/1 | `10.1.10.1/24`, gateway and DHCP server |
| PC-A FastEthernet0 | Fa0/1 | DHCP |
| PC-B FastEthernet0 | Fa0/2 initially | DHCP; temporarily substitutes for PC-A |
| PRINTER FastEthernet0 | Fa0/3 | `10.1.10.20/24`, gateway `10.1.10.1` |

Use copper straight-through cables. All four switch ports are access ports in VLAN 10. R1 excludes `.1` through `.49`, keeping the static printer outside the allocation range. Record your actual leases and MAC addresses.

```diagram
{"type":"topology","title":"One controlled server path","caption":"Only Gi0/1 receives legitimate DHCP server replies on SW1.","nodes":[{"id":"R1","kind":"router","label":"R1","sub":"10.1.10.1/24","x":6,"y":0.5},{"id":"SW1","kind":"switch","label":"SW1","sub":"VLAN 10","x":6,"y":3,"highlight":true},{"id":"A","kind":"pc","label":"PC-A","sub":"DHCP","x":2,"y":5.5},{"id":"B","kind":"pc","label":"PC-B","sub":"DHCP","x":6,"y":5.5},{"id":"P","kind":"printer","label":"PRINTER","sub":"10.1.10.20/24","x":10,"y":5.5}],"links":[{"from":"R1","to":"SW1","fromLabel":"Gi0/0","toLabel":"Gi0/1","accent":true},{"from":"A","to":"SW1","toLabel":"Fa0/1"},{"from":"B","to":"SW1","toLabel":"Fa0/2"},{"from":"P","to":"SW1","toLabel":"Fa0/3"}]}
```

## Step 1: Module A — establish a working LAN

Set the printer's address and gateway in its Config tab. R1 is the supplied DHCP server for this local LAN; no relay is involved. Read the server setup before entering it:

- `ip dhcp excluded-address` reserves .1 through .49 from dynamic allocation, including the router and static printer.
- `ip dhcp pool USERS` opens a named set of lease settings; `network` identifies this pool's client subnet.
- `default-router` supplies the client's gateway option. It does not create a route on R1.

Configure R1 and SW1:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.1.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# ip dhcp excluded-address 10.1.10.1 10.1.10.49
R1(config)# ip dhcp pool USERS
R1(dhcp-config)# network 10.1.10.0 255.255.255.0
R1(dhcp-config)# default-router 10.1.10.1
R1(dhcp-config)# end
R1# show ip interface brief
```

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name USERS
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/1 - 3
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# end
SW1# show vlan brief
```

On each PC select Desktop → IP Configuration → DHCP. Run `ipconfig /all` and record the PC's address and MAC, then ping `10.1.10.1` and `10.1.10.20`. A newly connected switch port takes about 30 seconds to start forwarding, and a first ping can time out while ARP resolves, so repeat a failed first attempt. Record the printer's MAC address from its Config tab; you need it in Step 9.

:::expected
R1 Gi0/0 is up/up and the four switch ports belong to VLAN 10. Each PC has its own address from `10.1.10.50` upward and gateway `10.1.10.1`, and both reach the gateway and the printer. Get this baseline working before you continue.
:::

```state
{"status":"Working LAN","tone":"ok","led":true,"focus":["R1","SW1"],"chips":[{"node":"R1","text":"DHCP pool USERS"}],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A requests a DHCP lease","backTags":{"R1":"Lease from outside .1–.49"}},{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings 10.1.10.1"},{"path":["B","SW1","P"],"back":true,"label":"PC-B pings 10.1.10.20"}],"rows":[["R1 Gi0/0","10.1.10.1 · up/up","ok"],["SW1 ports","Fa0/1–3 and Gi0/1 · VLAN 10"],["PC leases","Unique · gateway 10.1.10.1","ok"],["Gateway and printer","Both PCs reach them","ok"]]}
```

## Step 2: Module A — learn the authorized MAC

Before you start, predict which MAC address will fill the single secure entry and whether it will be in the startup configuration. Make sure PC-A is the only device on Fa0/1, enable port security with sticky learning, then ping the gateway from PC-A so that the switch sees a frame from it.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
SW1# show port-security address
SW1# show running-config interface fastethernet0/1
```

If your switch rejects `show running-config interface`, find the Fa0/1 block in `show running-config`. Compare the sticky address with the MAC you recorded for PC-A.

:::expected
Fa0/1 is `Secure-up` with maximum 1 and violation mode shutdown, the defaults. PC-A's MAC appears as a sticky line in the running configuration. It is not in the startup configuration until you save.
:::

```state
{"status":"PC-A's MAC is sticky","tone":"ok","focus":["SW1","A"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Fa0/1 learns PC-A's MAC as sticky"}}],"roles":[{"node":"SW1","peer":"A","text":"secure-up","tone":"ok"}],"rows":[["Fa0/1","Secure-up · maximum 1","ok"],["Violation mode","Shutdown"],["Sticky entry","PC-A's MAC · running-config"],["Startup-config","Not saved yet","dim"]]}
```

## Step 3: Module A — trigger a MAC-limit violation

Now put the wrong device on the secured port. Disconnect PC-B from Fa0/2 and PC-A from Fa0/1, then connect PC-B to Fa0/1. Leave the sticky entry and the maximum as they are. When the link comes up, ping the gateway from PC-B, then inspect `show port-security interface fastethernet0/1` and `show interfaces status`.

:::expected
PC-B's source MAC is not the one secure address, so shutdown mode err-disables Fa0/1. The port status is `Secure-shutdown`, the violation count is 1 and `show interfaces status` lists the port as `err-disabled`. If the port stays up, check that PC-B really sent a frame and that the sticky entry is PC-A's MAC.
:::

```state
{"status":"Fa0/1 err-disabled","tone":"bad","focus":["SW1","B"],"cut":[["A","SW1"],["B","SW1"]],"roles":[{"node":"SW1","peer":"A","text":"err-disabled","tone":"bad"}],"chips":[{"node":"B","text":"Moved to Fa0/1 · different MAC","tone":"warn"}],"rows":[["Fa0/1","Secure-shutdown · a violation","bad"],["Cause","PC-B's MAC; the one entry is PC-A's"],["Shutdown mode","The whole port stops forwarding"]]}
```

## Step 4: Module A — recover the authorized endpoint

Restore PC-A to Fa0/1 and PC-B to Fa0/2, then reset the affected port:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
```

Ping the gateway from PC-A. The order matters: remove the cause first, then reset the port. If PC-B were still attached, the port would shut down again at PC-B's next frame, and automatic err-disable recovery would repeat the same cycle.

:::expected
Fa0/1 returns to `Secure-up` and PC-A reaches the gateway. Judge the result by the current port status and a fresh ping; the violation count may still show the earlier incident.
:::

```state
{"status":"PC-A restored","tone":"ok","focus":["SW1","A"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Fa0/1 shutdown · no shutdown"}},{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway","tags":{"SW1":"Source is PC-A's sticky MAC"}}],"roles":[{"node":"SW1","peer":"A","text":"err-disabled","tone":"bad","until":0},{"node":"SW1","peer":"A","text":"secure-up","tone":"ok","from":0}],"rows":[["Fa0/1","Secure-up","ok"],["PC-A to gateway","Service regained","ok"],["Maximum","1, kept as the policy"],["Violation counter","History may remain","dim"]]}
```

## Step 5: Module B — establish snooping and fresh bindings

Before you configure anything, trace R1’s Offer and ACK back to a client and note the port where they enter SW1. That port needs DHCP snooping trust. The client ports never receive server messages, so they stay untrusted.

Nothing in this design uses Option 82, and R1 would reject requests that carry it, so turn its insertion off. The rate limit of 15 DHCP packets per second on the two PC ports is this lab's choice; there is no limit by default.

```ios SW1
SW1# configure terminal
SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10
SW1(config)# no ip dhcp snooping information option
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip dhcp snooping trust
SW1(config-if)# exit
SW1(config)# interface range fastethernet0/1 - 2
SW1(config-if-range)# ip dhcp snooping limit rate 15
SW1(config-if-range)# end
SW1# show ip dhcp snooping
```

The PCs obtained their leases before snooping was on, so the switch has no bindings yet. On each PC run `ipconfig /release` to give up the lease and `ipconfig /renew` to request a new one, or switch IP Configuration to Static and back to DHCP. Then compare `show ip dhcp snooping binding` on SW1 with `show ip dhcp binding` on R1, which lists the leases the server has handed out. They are separate tables: the server records every lease, and the switch records only the exchanges it watched.

:::expected
`show ip dhcp snooping` lists VLAN 10 as inspected and Gi0/1 as trusted. Each PC has a binding with its own IP, MAC, VLAN 10 and access port. The static printer has none.

If your switch lacks the feature, work from these supplied bindings instead: PC-A `10.1.10.50` / `00aa.0000.0001`, VLAN 10, Fa0/1; PC-B `10.1.10.51` / `00bb.0000.0002`, VLAN 10, Fa0/2. Pick out the fields DAI will compare with an ARP sender in Step 8.
:::

```state
{"status":"Bindings learned","tone":"ok","focus":["SW1"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A renews its lease","tags":{"SW1":"Untrusted Fa0/1 · rate limit 15"},"backTags":{"SW1":"Trusted Gi0/1 · binds PC-A, Fa0/1"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B renews its lease","tags":{"SW1":"Untrusted Fa0/2 · rate limit 15"},"backTags":{"SW1":"Trusted Gi0/1 · binds PC-B, Fa0/2"}}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP trusted","tone":"ok"}],"rows":[["Snooping","VLAN 10 · Option 82 insertion off"],["Trusted","Gi0/1 only","ok"],["Bindings","PC-A Fa0/1 · PC-B Fa0/2","ok"],["Printer","No binding: static address","dim"]]}
```

## Step 6: Module B — observe a missing server-trust fault

A missing `ip dhcp snooping trust` is a common snooping fault. Remove the trust on purpose to see how it looks from the client and from the switch.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# no ip dhcp snooping trust
SW1(config-if)# end
SW1# show ip dhcp snooping
```

Release PC-B's lease and request a new one; a PC that keeps its old lease does not test the change. In Simulation mode, filter on DHCP and follow R1's Offer to SW1 to see where it stops.

:::expected
PC-B gets no lease and falls back to a `169.254.x.x` address. R1's interface and pool are still healthy: its Offer reaches SW1 and is dropped at untrusted Gi0/1. The untrusted port in `show ip dhcp snooping` names the cause. A failed lease alone could have several causes.
:::

```state
{"status":"Server reply dropped","tone":"bad","focus":["SW1"],"flows":[{"path":["B","SW1","R1"],"label":"PC-B requests a new lease"},{"path":["R1","SW1"],"tone":"reply","label":"R1's reply","stop":"SW1","stopText":"R1's reply dropped · Gi0/1 untrusted"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP untrusted","tone":"bad"}],"rows":[["Gi0/1","No longer DHCP-trusted","bad"],["PC-B","No fresh lease","bad"],["R1 interface and pool","Can still be operational"],["Evidence","Configuration and reply path"]]}
```

## Step 7: Module B — restore the permitted reply path

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip dhcp snooping trust
SW1(config-if)# end
SW1# show ip dhcp snooping
```

Renew PC-B's lease, check its binding and ping the gateway. Only Gi0/1 should be trusted. Trusting every port would also bring the lease back, but it would let any port act as a DHCP server.

:::expected
The fresh lease completes and PC-B's binding names Fa0/2 and VLAN 10. Only Gi0/1 has server trust.
:::

```state
{"status":"Reply path restored","tone":"ok","focus":["SW1","B"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Gi0/1 DHCP-trusted again"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B renews its lease","backTags":{"SW1":"Trusted Gi0/1 · binds PC-B, Fa0/2"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B pings the gateway"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP untrusted","tone":"bad","until":0},{"node":"SW1","peer":"R1","text":"DHCP trusted","tone":"ok","from":0}],"rows":[["DHCP trust","Gi0/1 only","ok"],["PC-B lease","Fresh lease completes","ok"],["PC-B binding","Fa0/2 · VLAN 10","ok"]]}
```

## Step 8: Module B — inspect ARP and observe the static-host failure

Four devices send ARP on this LAN: two DHCP clients, the router and the printer. Predict which of them have a snooping binding and how DAI will treat the others. Confirm that both PC bindings are present, trust ARP on the router port with its own command, then enable inspection for VLAN 10.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip arp inspection trust
SW1(config-if)# exit
SW1(config)# ip arp inspection vlan 10
SW1(config)# end
SW1# show ip arp inspection vlan 10
SW1# show ip arp inspection interfaces
SW1# show ip arp inspection statistics vlan 10
```

Ping the gateway from both PCs. PC-B may still hold the printer's MAC in its ARP cache from Step 1, which would hide the problem, so force a new ARP exchange: on PC-B run `arp -d` to clear its ARP cache, or power-cycle PC-B and renew its lease. Note the DAI statistics, ping the printer from PC-B, and read the statistics again.

:::expected
Both PCs still reach the gateway: their ARP matches their bindings, and R1's ARP enters on trusted Gi0/1. The ping to the printer fails and the dropped count rises, because the printer's ARP reply enters untrusted Fa0/3 and matches no binding. Nothing is attacking the network. A legitimate static host needs an explicit permit, which Step 9 adds.
:::

```state
{"status":"Printer ARP rejected","tone":"bad","focus":["SW1","P"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway","tags":{"SW1":"PC-A's ARP matches its binding"}},{"path":["B","SW1","P"],"label":"PC-B's fresh ARP for 10.1.10.20","tags":{"SW1":"PC-B's ARP matches its binding"}},{"path":["P","SW1"],"tone":"reply","label":"Printer's ARP reply","stop":"SW1","stopText":"No binding · Fa0/3 claim rejected"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"P","text":"DAI untrusted"}],"rows":[["Gi0/1","DHCP and DAI trusted"],["DHCP clients","Valid ARP claims pass","ok"],["Printer 10.1.10.20","No binding · ARP rejected","bad"],["Cause","Static host · not an attack","dim"]]}
```

## Step 9: Module B — permit the verified printer pair

An ARP ACL permits one exact IP-and-MAC pair while Fa0/3 stays untrusted. Use the printer's MAC that you recorded in Step 1 in place of the example `000c.2911.7a3e`. `show arp access-list` displays the ACL's entries.

```ios SW1
SW1# configure terminal
SW1(config)# arp access-list STATIC-HOSTS
SW1(config-arp-nacl)# permit ip host 10.1.10.20 mac host 000c.2911.7a3e
SW1(config-arp-nacl)# exit
SW1(config)# ip arp inspection filter STATIC-HOSTS vlan 10
SW1(config)# end
SW1# show arp access-list STATIC-HOSTS
SW1# show ip arp inspection vlan 10
SW1# show ip arp inspection statistics vlan 10
```

Clear PC-B's ARP cache again, ping the printer and repeat the gateway pings. The `filter` command has no `static` keyword, so ARP that the ACL does not match is still checked against the bindings. With `static`, the PCs' ARP would be dropped, because the ACL does not list them.

:::expected
The printer answers and both PCs still reach the gateway. Fa0/3 remains untrusted: the ACL admits one IP-and-MAC pair, and every other ARP message on the port is still inspected.
:::

```state
{"status":"Printer pair permitted","tone":"ok","focus":["SW1","P"],"chips":[{"node":"SW1","text":"ARP ACL STATIC-HOSTS · VLAN 10"}],"flows":[{"path":["B","SW1","P"],"label":"PC-B's fresh ARP for 10.1.10.20"},{"path":["P","SW1","B"],"tone":"reply","label":"Printer's ARP reply","tags":{"SW1":"STATIC-HOSTS permits the pair"}},{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway","tags":{"SW1":"ARP: no ACL match → binding check"}}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"P","text":"DAI untrusted"}],"rows":[["Permitted pair","10.1.10.20 + printer's MAC","ok"],["Fa0/3","Still DAI-untrusted"],["No static keyword","Nonmatches use bindings"],["DHCP clients","Still work","ok"]]}
```

## Step 10: Module C — interpret storm-control thresholds

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/2
SW1(config-if)# storm-control broadcast level 1.00 0.50
SW1(config-if)# end
SW1# show storm-control fastethernet0/2 broadcast
```

You will not generate a storm in this lab, and you should never build a loop to make one. Configure the thresholds on PC-B's port, confirm them in the output, then work this out on paper before opening the answer: are broadcasts being dropped when they reach 3.2% of the port's bandwidth, then fall to 0.7%, then to 0.3%? What is 1% in Mb/s on this 100 Mb/s port?

:::expected
The output shows an upper threshold of 1.00% and a lower threshold of 0.50%, with the filter state `Forwarding`. PC-B still pings the gateway, because ordinary traffic is far below the threshold.
:::

:::solution
Broadcasts are dropped at 3.2% and still dropped at 0.7%, which is above the 0.50% falling threshold. Dropping ends at 0.3%. One percent of 100 Mb/s is 1 Mb/s. With no `storm-control action shutdown` configured, the switch drops only the broadcast class and the port stays up.
:::

```state
{"status":"Storm thresholds set","focus":["SW1","B"],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"B","text":"storm 1.00/0.50"}],"rows":[["Fa0/2 broadcast","Rising 1.00% · falling 0.50%"],["Threshold event","None generated","dim"],["Worksheet values","Supplied, not captured","dim"]]}
```

## Step 11: Module D — prepare a separate IPv6 test baseline

This module needs real equipment: a switch that supports RA guard (the commands here are from a Catalyst 9300 running IOS XE 17.12), two IPv6-capable routers with a Gi0/0 interface such as 2911s, and a Windows PC with Wireshark. If you do not have it, read the steps and answer the paper path in each expected-result box. Build a separate isolated LAN: the test PC on SW-H Gi1/0/1, the legitimate router R1 Gi0/0 on Gi1/0/24, and the test router R2 Gi0/0 on Gi1/0/4. Use your own interface names if your hardware differs. All three switch ports are access ports in VLAN 10.

```diagram
{"type":"topology","title":"Separate IPv6 test LAN","caption":"Legitimate R1 connects to SW-H Gi1/0/24, test router R2 to Gi1/0/4 and the test PC to Gi1/0/1, all in access VLAN 10.","nodes":[{"id":"R1","kind":"router","label":"R1","sub":"fe80::1","x":3,"y":0.5},{"id":"R2","kind":"router","label":"R2","sub":"fe80::2","x":9,"y":0.5},{"id":"SWH","kind":"switch","label":"SW-H","sub":"VLAN 10","x":6,"y":3,"highlight":true},{"id":"PC","kind":"pc","label":"Test PC","sub":"Windows · Wireshark","x":6,"y":5.5}],"links":[{"from":"PC","to":"SWH","toLabel":"Gi1/0/1"},{"from":"R1","to":"SWH","fromLabel":"Gi0/0","toLabel":"Gi1/0/24","accent":true},{"from":"R2","to":"SWH","fromLabel":"Gi0/0","toLabel":"Gi1/0/4"}]}
```

Before you configure RA guard, run `show version` and `show sdm prefer` on SW-H. The **SDM template** decides how the switch divides its hardware table space between features, and the active one must leave room for IPv6; the 9300's Access template does. If you have to select it, enter `sdm prefer access` in global configuration, save with `copy running-config startup-config`, and `reload`, because a new template takes effect only after a restart. Template names differ on other Catalyst families.

The router configuration is supplied. `ipv6 unicast-routing` makes a router forward IPv6 and send Router Advertisements on its IPv6 interfaces. The `link-local` keyword sets each router's link-local address by hand, so that in the capture `fe80::1` is always R1 and `fe80::2` is always R2. R2 starts shut down. Chapter 19 explains IPv6 addressing and neighbor discovery in detail.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet0/0
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# ipv6 address 2001:db8:16:10::1/64
R1(config-if)# no shutdown
R1(config-if)# end
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# ipv6 unicast-routing
R2(config)# interface gigabitethernet0/0
R2(config-if)# ipv6 address fe80::2 link-local
R2(config-if)# ipv6 address 2001:db8:16:99::1/64
R2(config-if)# shutdown
R2(config-if)# end
```

```ios SW-H
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW-H
SW-H(config)# vlan 10
SW-H(config-vlan)# exit
SW-H(config)# interface range gigabitethernet1/0/1, gigabitethernet1/0/4, gigabitethernet1/0/24
SW-H(config-if-range)# switchport mode access
SW-H(config-if-range)# switchport access vlan 10
SW-H(config-if-range)# exit
SW-H(config)# ipv6 nd raguard policy ENDPOINTS
SW-H(config-nd-raguard)# device-role host
SW-H(config-nd-raguard)# exit
SW-H(config)# ipv6 nd raguard policy ROUTERS
SW-H(config-nd-raguard)# device-role router
SW-H(config-nd-raguard)# exit
SW-H(config)# interface range gigabitethernet1/0/1, gigabitethernet1/0/4
SW-H(config-if-range)# ipv6 nd raguard attach-policy ENDPOINTS
SW-H(config-if-range)# exit
SW-H(config)# interface gigabitethernet1/0/24
SW-H(config-if)# ipv6 nd raguard attach-policy ROUTERS
SW-H(config-if)# end
SW-H# show ipv6 nd raguard policy ENDPOINTS
SW-H# show ipv6 nd raguard policy ROUTERS
SW-H# show running-config interface gigabitethernet1/0/4
```

On the Windows test PC, set the lab adapter’s IPv6 properties to obtain an address automatically. You need [Wireshark](https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html) installed and permission to capture on that Ethernet adapter. Note the adapter's name so that you do not capture on Wi-Fi by mistake.

Start a capture on that adapter and apply the display filter `icmpv6.type == 134`. Router Advertisements are ICMPv6 type 134, so the filter shows nothing else. With R2 still shut down, wait for an RA from `fe80::1`; a router sends one every few minutes, and at once when a host asks for it. Record the PC's addressing with `ipconfig /all`. Check both policy definitions and their attachments on SW-H before you go on.

:::expected
R1's RAs from `fe80::1` reach the test PC. SW-H has ENDPOINTS on Gi1/0/1 and Gi1/0/4 and ROUTERS on Gi1/0/24. No RA from R2 appears, but R2 is shut down, so that says nothing about RA guard yet.

Paper path: R1 sends RAs from `fe80::1` into Gi1/0/24, they appear in the PC's capture, and R2 is shut down. Explain which policy and attachment let R1's RAs through.
:::

```state
{"topology":2,"status":"R1's RAs reach the test PC","tone":"ok","focus":["SWH","R1"],"cut":[["R2","SWH"]],"chips":[{"node":"R2","text":"Gi0/0 shut","tone":"dim"},{"node":"PC","text":"Capture icmpv6.type == 134"}],"flows":[{"path":["R1","SWH","PC"],"label":"R1's RA from fe80::1","tags":{"SWH":"Gi1/0/24 · ROUTERS attached","PC":"RA from fe80::1 captured"}}],"roles":[{"node":"SWH","peer":"R1","text":"ROUTERS","tone":"ok"},{"node":"SWH","peer":"PC","text":"ENDPOINTS"},{"node":"SWH","peer":"R2","text":"ENDPOINTS"}],"rows":[["Gi1/0/24","ROUTERS · router role","ok"],["Gi1/0/1, Gi1/0/4","ENDPOINTS · host role"],["fe80::1 RAs","Reach the test PC","ok"],["R2","Shut · not evidence of RA guard","dim"]]}
```

## Step 12: Module D — expose the test advertisement on a permitted comparison path

A blocked RA and a router that never sent one look the same in a capture. So first prove that R2's RAs can reach the PC: enable R2 and temporarily remove the host-role policy from its port, leaving R1’s policy alone. Predict what the capture will show, then wait long enough to record a fresh RA from R2.

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/0
R2(config-if)# no shutdown
R2(config-if)# end
```

```ios SW-H
SW-H# configure terminal
SW-H(config)# interface gigabitethernet1/0/4
SW-H(config-if)# no ipv6 nd raguard attach-policy ENDPOINTS
SW-H(config-if)# end
SW-H# show running-config interface gigabitethernet1/0/4
```

In the capture, find a fresh RA from `fe80::2` and confirm that `fe80::1` still appears. Record several R2 arrivals and the time between them. Do not change cables, R2's addressing or VLAN membership between this test and Step 13.

:::expected
With no policy on Gi1/0/4, R2’s RAs reach the PC, which proves that R2 is sending and the path works. The PC may add an address from R2's prefix and a second default router. That is the effect a rogue router has.

Paper path: the capture shows RAs from `fe80::1` and `fe80::2` on the PC’s lab adapter while Gi1/0/4 has no RA guard policy. Explain why you need this result before testing the guard.
:::

```state
{"topology":2,"status":"Gi1/0/4 unguarded · R2's RAs pass","tone":"warn","focus":["SWH","R2"],"chips":[{"node":"PC","text":"Capture icmpv6.type == 134"}],"flows":[{"event":["R2","SWH"],"wait":1.2,"tags":{"R2":"Gi0/0 no shutdown","SWH":"ENDPOINTS removed from Gi1/0/4"}},{"path":["R2","SWH","PC"],"tone":"alt","label":"R2's fresh RA from fe80::2","tags":{"SWH":"Gi1/0/4 · no host-role attachment","PC":"Fresh RA from fe80::2"}},{"path":["R1","SWH","PC"],"label":"R1's RA from fe80::1 still appears"}],"roles":[{"node":"SWH","peer":"R1","text":"ROUTERS","tone":"ok"},{"node":"SWH","peer":"PC","text":"ENDPOINTS"},{"node":"SWH","peer":"R2","text":"ENDPOINTS","until":0},{"node":"SWH","peer":"R2","text":"no RA guard","tone":"warn","from":0}],"rows":[["R2 Gi0/0","No shutdown · fresh RAs"],["Gi1/0/4","No RA guard attachment","warn"],["fe80::2 and fe80::1 RAs","Both reach the PC","ok"],["Shows","Test sender and path work"]]}
```

## Step 13: Module D — restore the boundary and compare fresh evidence

Before you restore the policy, write down which RA source should stay visible and which should stop. Leave R2 running.

```ios SW-H
SW-H# configure terminal
SW-H(config)# interface gigabitethernet1/0/4
SW-H(config-if)# ipv6 nd raguard attach-policy ENDPOINTS
SW-H(config-if)# end
SW-H# show ipv6 nd raguard policy ENDPOINTS
SW-H# show running-config interface gigabitethernet1/0/4
```

Start a new capture on the same adapter and watch for longer than several of the R2 intervals you recorded in Step 12. RAs from `fe80::1` should keep arriving and none should arrive from `fe80::2`. If neither router appears, fix that before you draw a conclusion. The PC may keep the address and default router it learned from R2 until their lifetimes expire, because RA guard blocks new RAs and does not erase what a host already learned.

:::expected
With ENDPOINTS back on Gi1/0/4, SW-H drops the test router’s RAs while R1's still arrive. The attachment was the only change between Steps 12 and 13, so the capture shows that RA guard is doing the blocking.

Paper path: RAs from `fe80::1` continue, RAs from `fe80::2` stop, R2 is still sending, and the only change was restoring ENDPOINTS on Gi1/0/4. Explain what this shows, and why the PC's old address from R2 does not contradict it.
:::

```state
{"topology":2,"status":"R2's RAs blocked at Gi1/0/4","tone":"ok","focus":["SWH","R2"],"chips":[{"node":"R2","text":"Still sending RAs"},{"node":"PC","text":"New capture · same adapter"}],"flows":[{"event":["SWH"],"wait":1.2,"tags":{"SWH":"ENDPOINTS back on Gi1/0/4"}},{"path":["R2","SWH"],"tone":"alt","label":"R2's fresh RA from fe80::2","stop":"SWH","stopText":"Host-role Gi1/0/4 · RA blocked"},{"path":["R1","SWH","PC"],"label":"R1's RA from fe80::1","tags":{"SWH":"Legitimate router path continues"}}],"roles":[{"node":"SWH","peer":"R1","text":"ROUTERS","tone":"ok"},{"node":"SWH","peer":"PC","text":"ENDPOINTS"},{"node":"SWH","peer":"R2","text":"no RA guard","tone":"warn","until":0},{"node":"SWH","peer":"R2","text":"ENDPOINTS","from":0}],"rows":[["Gi1/0/4","ENDPOINTS restored · host role","ok"],["fe80::1 RAs","Continue to the PC","ok"],["Fresh fe80::2 RAs","Absent while R2 keeps sending"],["Old SLAAC/router state","May remain until lifetimes expire","dim"]]}
```

## Step 14: Save each verified checkpoint and clean up

In the IPv4 lab, renew both leases and repeat the gateway and printer pings. Check the port-security status on Fa0/1, the DHCP snooping and DAI trust on Gi0/1, both bindings, the DAI statistics and the storm thresholds on Fa0/2. Mark any feature your switch could not run as still to do.

On SW1 and on R1, enter `copy running-config startup-config` and press Enter to accept the filename. Save the Packet Tracer project as `16-ipv4-security-baseline.pkt`. The save keeps PC-A's sticky entry. It does not keep the snooping bindings, which the switch relearns as clients renew their leases.

If you ran Module D on real equipment, stop the test router:

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/0
R2(config-if)# shutdown
R2(config-if)# end
R2# show ipv6 interface brief
```

Check that ENDPOINTS is still attached to SW-H Gi1/0/4, then save the configuration on SW-H, R1 and R2.

:::expected
Every service works with all the controls on. Finish with a short table of your own: for each feature, the port it protects, what it blocked in this lab, the command output that showed the block, and the repair. Include the three IPv4 faults (wrong MAC on Fa0/1, missing DHCP snooping trust on Gi0/1, static printer with no ARP permit) and, for Module D, R2's RAs passing without the policy and blocked with it. Mark each result as observed or taken from the paper path.
:::

```state
{"status":"Verified · saved","tone":"ok","focus":["SW1","R1"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"Fresh DHCP lease","backTags":{"SW1":"Trusted Gi0/1 · binding learned"}},{"path":["A","SW1","R1"],"back":true,"label":"Gateway ping"},{"path":["B","SW1","P"],"back":true,"label":"Static-printer test"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"B","text":"storm 1.00/0.50"}],"rows":[["SW1 and R1","Saved to startup-config","ok"],["Project","16-ipv4-security-baseline.pkt","ok"],["Snooping database","Not persisted by the save","dim"],["RA test router R2","Shut down","dim"]]}
```

## Troubleshooting

| Symptom | Check |
|---|---|
| Fa0/1 violates again as soon as it is reset | PC-A must be the device on Fa0/1 and the sticky entry must be its MAC; resetting the port cannot fix a mismatch |
| No fresh lease | VLAN 10 in the snooping VLAN list, trust on Gi0/1, `no ip dhcp snooping information option`, then R1's interface and pool |
| DAI blocks a DHCP client | The client's binding: IP, MAC, VLAN and port must all match; renew a lease that predates snooping |
| Printer still blocked | The MAC in the ACL, the VLAN on the `filter` command, and whether the test used a fresh ARP exchange |
| PCs lose ARP after the ACL is applied | A `static` keyword on the `filter` command, which stops the fallback to bindings |
| All traffic on a port stops while DAI is on | `show interfaces status` and the log: an ARP rate-limit shutdown err-disables the port, unlike a single dropped ARP message |
| RA policy exists but RAs pass | The policy must be attached to the port where the RAs enter, with the host role |
| IPv6 hosts do not learn R1 | The router-role policy on Gi1/0/24, then wait for R1's next RA |

## Challenge

Use a copy of the restored IPv4 baseline. Add a second Printer-PT, PRINTER-2, to SW1 Fa0/4 using straight-through copper. Set `10.1.10.30/24` and gateway `10.1.10.1`; that address is already inside R1’s excluded range. Record its actual MAC.

Before opening the answer, write the commands that let PRINTER-2 use ARP while both DHCP clients are still validated by their snooping bindings. Keep the original printer working and leave every PC and printer port untrusted for DAI. Do not replace the existing ARP ACL or add the `static` keyword. Explain why the DHCP exclusion alone is not enough.

Test with fresh ARP exchanges: both printers from PC-B, and the gateway from both PCs. Record the ACL line you added and the results. If your simulator has no ARP ACL, use the answer as a configuration worksheet and mark the hands-on check as still to do.

Then answer one question on paper, without cabling anything: a new switch SW2 connects its uplink Gi0/1 to SW1 Fa0/5 and serves only DHCP clients. Both switches snoop VLAN 10 with Option 82 insertion off. Which port on each switch needs DHCP snooping trust?

:::solution
Configure the new access port and add one permit to the existing ACL. Replace the example `0011.2233.0030` with PRINTER-2’s recorded MAC.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/4
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# arp access-list STATIC-HOSTS
SW1(config-arp-nacl)# permit ip host 10.1.10.30 mac host 0011.2233.0030
SW1(config-arp-nacl)# exit
SW1(config)# ip arp inspection filter STATIC-HOSTS vlan 10
SW1(config)# end
SW1# show arp access-list STATIC-HOSTS
SW1# show ip arp inspection vlan 10
SW1# show ip dhcp snooping binding
```

The ACL now permits both printers, each as an exact IP-and-MAC pair. The filter was already applied to VLAN 10, so re-entering that command changes nothing. Because it has no `static` keyword, the PCs' ARP still falls through to the DHCP bindings. The DHCP exclusion only stops R1 leasing `.30`; it does not authorize the printer's ARP. Fa0/4 stays untrusted.

From PC-B, clear the ARP cache with `arp -d`, then ping `.20` and `.30`. Compare the DAI statistics before and after, repeat both gateway pings, and save the challenge as a separate project.

For SW2: trust SW1 Gi0/1, where R1’s replies enter SW1, and SW2 Gi0/1, where they enter SW2. SW1 Fa0/5 receives only client messages from SW2, so it stays untrusted even though it connects to a switch. With Option 82 insertion off on SW2, SW1 never receives a request carrying Option 82 on that untrusted port. DAI on the two switches would need its own trust settings as well.
:::
