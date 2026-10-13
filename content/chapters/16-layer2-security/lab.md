---
title: Verify an access-port security policy
environment: mixed
devices: ["1 × 2960-24TT switch (SW1)", "1 × 2911 router (R1)", "2 × PCs (PC-A and PC-B)", "1 × Printer-PT", "RA guard extension: supported Catalyst switch, two IPv6 routers and test PC"]
minutes: 110
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a working IPv4 LAN, apply one control at a time, and diagnose a controlled failure from its evidence. The final exercise covers IPv6 RA guard. Keep the exercises on an isolated lab network.

Record your Packet Tracer version and check the selected switch's command help. It implements a subset of IOS; DHCP snooping, DAI, ARP ACL and storm-control support vary by simulated device and version. If a required command is missing, use a supporting image or switch, or complete that step as an interpretation exercise and record it as **not executed**. For v2.0, return to any unexecuted configuration objective on a supporting platform.

Use four separate study sessions if needed: **A, Steps 1–4: source-MAC policy**; **B, Steps 5–9: DHCP and ARP dependencies**; **C, Step 10: storm-policy interpretation**; **D, Steps 11–13: supported IPv6 RA guard or its worksheet**. Step 14 verifies and saves the results. DHCP server and IPv6 router setup are supplied supporting configuration; their full operation is taught in Chapters 24 and 19. Revisit these controls after those protocol chapters.

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

The switch's snooping binding is learned separately when it observes the PCs obtain leases. Configure R1 and SW1:

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

On each PC select Desktop → IP Configuration → DHCP. Record `ipconfig /all`, then ping `10.1.10.1` and `10.1.10.20`. Wait for ports to forward and repeat initial pings if ARP resolution consumed an attempt. Record the printer's MAC from its interface information.

:::expected
R1 Gi0/0 is up/up and the switch ports belong to VLAN 10. The PCs have unique addresses in the pool and gateway `10.1.10.1`; both reach the gateway and printer. Correct this baseline before continuing.
:::

```state
{"status":"Working LAN","tone":"ok","led":true,"focus":["R1","SW1"],"chips":[{"node":"R1","text":"DHCP pool USERS"}],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A requests a DHCP lease","backTags":{"R1":"Lease from outside .1–.49"}},{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings 10.1.10.1"},{"path":["B","SW1","P"],"back":true,"label":"PC-B pings 10.1.10.20"}],"rows":[["R1 Gi0/0","10.1.10.1 · up/up","ok"],["SW1 ports","Fa0/1–3 and Gi0/1 · VLAN 10"],["PC leases","Unique · gateway 10.1.10.1","ok"],["Gateway and printer","Both PCs reach them","ok"]]}
```

## Step 2: Module A — learn the authorized MAC

Predict which MAC should occupy the single entry and whether that learned value will already be in startup configuration. Leave only PC-A attached to Fa0/1. Enable sticky learning and send another PC-A ping.

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

If the image rejects the interface-specific running-config command, find the block in `show running-config`. Compare the learned address with PC-A's actual MAC before saving.

:::expected
Fa0/1 is secure-up with maximum 1, shutdown violation mode and PC-A's sticky entry in running configuration. Its presence there does not establish that startup configuration contains it.
:::

```state
{"status":"PC-A's MAC is sticky","tone":"ok","focus":["SW1","A"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Fa0/1 learns PC-A's MAC as sticky"}}],"roles":[{"node":"SW1","peer":"A","text":"secure-up","tone":"ok"}],"rows":[["Fa0/1","Secure-up · maximum 1","ok"],["Violation mode","Shutdown"],["Sticky entry","PC-A's MAC · running-config"],["Startup-config","Not shown to contain it yet","dim"]]}
```

## Step 3: Module A — trigger a MAC-limit violation

Disconnect PC-B from Fa0/2 and PC-A from Fa0/1. Connect PC-B to Fa0/1 and generate traffic. Keep PC-A's sticky entry and the existing maximum. Inspect `show port-security interface fastethernet0/1` and `show interfaces status`.

:::expected
PC-B presents a different source MAC while the one permitted entry belongs to PC-A. Shutdown mode error-disables the port; the security display indicates secure-shutdown and a violation. The whole port stops forwarding. If it remains up, verify the actual MACs and that PC-B transmitted.
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

Ping the gateway from PC-A. Keep maximum 1 because that is the intended policy here. Automatic error recovery cannot correct an unauthorized device that remains attached.

:::expected
Fa0/1 returns to secure-up and PC-A regains service. Historical violation counters may remain; verify current state and a fresh traffic test.
:::

```state
{"status":"PC-A restored","tone":"ok","focus":["SW1","A"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Fa0/1 shutdown · no shutdown"}},{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway","tags":{"SW1":"Source is PC-A's sticky MAC"}}],"roles":[{"node":"SW1","peer":"A","text":"err-disabled","tone":"bad","until":0},{"node":"SW1","peer":"A","text":"secure-up","tone":"ok","from":0}],"rows":[["Fa0/1","Secure-up","ok"],["PC-A to gateway","Service regained","ok"],["Maximum","1, kept as the policy"],["Violation counter","History may remain","dim"]]}
```

## Step 5: Module B — establish snooping and fresh bindings

Before configuration, trace R1’s Offer/ACK back to each client and mark the ingress at SW1. Predict which trust setting admits those server messages and why the client ports do not need it.

This simple design does not use Option 82 for server policy. Disable its insertion explicitly and trust the interface receiving R1's replies. Client ports remain untrusted.

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

Run `ipconfig /release` and `ipconfig /renew` on each PC. If unavailable, use its IP Configuration controls to request a fresh lease. Compare `show ip dhcp snooping binding` on SW1 with `show ip dhcp binding` on R1. The server lease table and switch binding table are separate records.

:::expected
Snooping covers VLAN 10, Gi0/1 is trusted, and each PC has a binding with its actual IP, MAC, VLAN and access port. No dynamic binding is expected for the static printer. A lease acquired before snooping was enabled does not establish a switch binding.

If the feature is unavailable, use this separate authored binding worksheet: PC-A 10.1.10.50 / 00aa.0000.0001, VLAN 10, Fa0/1; PC-B 10.1.10.51 / 00bb.0000.0002, VLAN 10, Fa0/2. R1 lists those leases and the switch learned matching entries after the exchanges. Identify the fields needed to compare an ARP sender claim; do not substitute these illustrative identities for actual devices.
:::

```state
{"status":"Bindings learned","tone":"ok","focus":["SW1"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A renews its lease","tags":{"SW1":"Untrusted Fa0/1 · rate limit 15"},"backTags":{"SW1":"Trusted Gi0/1 · binds PC-A, Fa0/1"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B renews its lease","tags":{"SW1":"Untrusted Fa0/2 · rate limit 15"},"backTags":{"SW1":"Trusted Gi0/1 · binds PC-B, Fa0/2"}}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP trusted","tone":"ok"}],"rows":[["Snooping","VLAN 10 · Option 82 insertion off"],["Trusted","Gi0/1 only","ok"],["Bindings","PC-A Fa0/1 · PC-B Fa0/2","ok"],["Printer","No binding: static address","dim"]]}
```

## Step 6: Module B — observe a missing server-trust fault

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# no ip dhcp snooping trust
SW1(config-if)# end
SW1# show ip dhcp snooping
```

Release PC-B's lease and request a new one. Where supported, inspect snooping statistics or use Simulation mode filtered to DHCP to follow R1's reply into SW1. Retaining an old lease does not test the new policy.

:::expected
A fresh DHCP exchange cannot complete through the now-untrusted server ingress, even though R1's interface and pool can be operational. The configuration and reply-path evidence identify the cause; a failed lease alone would not.
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

Renew PC-B's lease, inspect its binding and ping the gateway. Do not make every port trusted as a workaround.

:::expected
The fresh lease completes and PC-B's binding names Fa0/2 and VLAN 10. Only Gi0/1 has server trust.
:::

```state
{"status":"Reply path restored","tone":"ok","focus":["SW1","B"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Gi0/1 DHCP-trusted again"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B renews its lease","backTags":{"SW1":"Trusted Gi0/1 · binds PC-B, Fa0/2"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B pings the gateway"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP untrusted","tone":"bad","until":0},{"node":"SW1","peer":"R1","text":"DHCP trusted","tone":"ok","from":0}],"rows":[["DHCP trust","Gi0/1 only","ok"],["PC-B lease","Fresh lease completes","ok"],["PC-B binding","Fa0/2 · VLAN 10","ok"]]}
```

## Step 8: Module B — inspect ARP and observe the static-host failure

Predict which of the two DHCP clients, static router and static printer will have a DHCP-client binding. Name the separate DAI policy that covers each legitimate source, then confirm both PC bindings first. Trust ARP from the controlled router connection separately, then enable inspection.

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

Ping the gateway from both DHCP clients. For a fresh printer ARP exchange, clear PC-B's printer entry with `arp -d 10.1.10.20` if supported, or restart only PC-B and renew its lease. Ping the printer and compare DAI counters before and after. Existing ARP caches can temporarily conceal the missing binding.

:::expected
The DHCP clients' valid ARP claims pass. The printer has no snooping binding, so its fresh ARP claim entering Fa0/3 is rejected by the binding check. A legitimate static host needs an explicit exception; this result does not establish malicious activity.
:::

```state
{"status":"Printer ARP rejected","tone":"bad","focus":["SW1","P"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway","tags":{"SW1":"PC-A's ARP matches its binding"}},{"path":["B","SW1","P"],"label":"PC-B's fresh ARP for 10.1.10.20","tags":{"SW1":"PC-B's ARP matches its binding"}},{"path":["P","SW1"],"tone":"reply","label":"Printer's ARP reply","stop":"SW1","stopText":"No binding · Fa0/3 claim rejected"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"P","text":"DAI untrusted"}],"rows":[["Gi0/1","DHCP and DAI trusted"],["DHCP clients","Valid ARP claims pass","ok"],["Printer 10.1.10.20","No binding · ARP rejected","bad"],["Not evidence of","Malicious activity","dim"]]}
```

## Step 9: Module B — permit the verified printer pair

Substitute the printer's actual MAC recorded in Step 1. The following example assumes `000c.2911.7a3e`.

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

Repeat a fresh printer ping and the client gateway tests. Omitting `static` allows ACL nonmatches to continue to DHCP-binding validation. Adding it would make the ACL's implicit denial final, blocking unlisted DHCP clients.

:::expected
The verified printer pair passes and DHCP clients still work. Fa0/3 remains untrusted: the ACL authorizes a specific claim instead of bypassing inspection on the entire port.
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

Record the configured thresholds. Before opening the worksheet answer, predict the suppression state when broadcast utilization reaches 3.2%, then falls to 0.7%, then to 0.3%. Also calculate the nominal 1% rate on this 100 Mb/s port. These are supplied observations, not captured results; do not create a switching loop.

:::expected
The configured policy should display rising 1.00% and falling 0.50%. Inspect the actual port state and repeat a low-volume client test; do not claim a live threshold event when none was generated.
:::

:::solution
Suppression is active at 3.2% and remains active at 0.7%, which is above the falling 0.50% threshold. It ends below that threshold at 0.3%. One percent of 100 Mb/s is a nominal 1 Mb/s; hardware measurement can differ. Without a shutdown action, the default filters the selected traffic type rather than err-disabling the whole interface.
:::

```state
{"status":"Storm thresholds set","focus":["SW1","B"],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"B","text":"storm 1.00/0.50"}],"rows":[["Fa0/2 broadcast","Rising 1.00% · falling 0.50%"],["Threshold event","None generated","dim"],["Worksheet values","Supplied, not captured","dim"]]}
```

## Step 11: Module D — prepare a separate IPv6 test baseline

Use a separate isolated LAN, two fresh IPv6-capable IOS routers with Gi0/0 (2911 hardware or a verified equivalent), a Windows PC with a capture-capable Ethernet adapter, and a supporting switch; the command reference is Catalyst 9300 with IOS XE 17.12. Connect a test PC to SW-H Gi1/0/1, legitimate R1 Gi0/0 to Gi1/0/24, and test R2 Gi0/0 to Gi1/0/4. Use compatible copper media and substitute verified interface names for your hardware. All three switch ports use access VLAN 10.

```diagram
{"type":"topology","title":"Separate IPv6 test LAN","caption":"Legitimate R1 connects to SW-H Gi1/0/24, test router R2 to Gi1/0/4 and the test PC to Gi1/0/1, all in access VLAN 10.","nodes":[{"id":"R1","kind":"router","label":"R1","sub":"fe80::1","x":3,"y":0.5},{"id":"R2","kind":"router","label":"R2","sub":"fe80::2","x":9,"y":0.5},{"id":"SWH","kind":"switch","label":"SW-H","sub":"VLAN 10","x":6,"y":3,"highlight":true},{"id":"PC","kind":"pc","label":"Test PC","sub":"Windows · Wireshark","x":6,"y":5.5}],"links":[{"from":"PC","to":"SWH","toLabel":"Gi1/0/1"},{"from":"R1","to":"SWH","fromLabel":"Gi0/0","toLabel":"Gi1/0/24","accent":true},{"from":"R2","to":"SWH","fromLabel":"Gi0/0","toLabel":"Gi1/0/4"}]}
```

Before configuring the feature, run `show version` and `show sdm prefer` on SW-H. Confirm a supported image and an active resource template that accommodates IPv6; the cited 9300 Access template supports IPv6 entries. If this isolated 9300 needs that template selected, enter `sdm prefer access` in global configuration, return to EXEC, save with `copy running-config startup-config`, and `reload` before starting the exercise. Verify the active template after restart. A pending template change is not yet active, and template names on other Catalyst families differ. Do not apply a 2960-specific SDM command to the 9300 by assumption.

The supplied router setup enables advertisements on this LAN. Explicit link-local addresses identify their sources. Chapter 19 explains IPv6 addressing and neighbor discovery in detail.

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

On the Windows test PC, use the lab adapter’s IPv6 properties to obtain an address and DNS information automatically. This isolated exercise does not require DNS or Internet access. Use a PC with Wireshark installed and permission to capture on the connected Ethernet adapter; its current installer and capture prerequisites are documented by [Wireshark](https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html). Record the adapter name so an unrelated Wi-Fi capture is not mistaken for this LAN.

Start a capture on that adapter and apply display filter `icmpv6.type == 134`. With R2 still shut, observe an RA from `fe80::1` and record PC addressing with `ipconfig /all`. Allow for the actual advertisement interval. Verify the two policy definitions and their attachments before the comparison.

:::expected
Fresh legitimate R1 RAs reach the test PC. R2 is still shut; its absence is not evidence of RA guard. The switch has ENDPOINTS on Gi1/0/1 and Gi1/0/4 and ROUTERS on Gi1/0/24. Record unsupported configuration or capture operations as unexecuted.

For the paper path use this labeled supplied baseline: R1 sends from fe80::1 into Gi1/0/24; its RA appears on the PC capture; R2 is administratively shut. Explain which policy/attachment permits the legitimate path. These are authored observations, not simulator measurements.
:::

```state
{"topology":2,"status":"R1's RAs reach the test PC","tone":"ok","focus":["SWH","R1"],"cut":[["R2","SWH"]],"chips":[{"node":"R2","text":"Gi0/0 shut","tone":"dim"},{"node":"PC","text":"Capture icmpv6.type == 134"}],"flows":[{"path":["R1","SWH","PC"],"label":"R1's RA from fe80::1","tags":{"SWH":"Gi1/0/24 · ROUTERS attached","PC":"RA from fe80::1 captured"}}],"roles":[{"node":"SWH","peer":"R1","text":"ROUTERS","tone":"ok"},{"node":"SWH","peer":"PC","text":"ENDPOINTS"},{"node":"SWH","peer":"R2","text":"ENDPOINTS"}],"rows":[["Gi1/0/24","ROUTERS · router role","ok"],["Gi1/0/1, Gi1/0/4","ENDPOINTS · host role"],["fe80::1 RAs","Reach the test PC","ok"],["R2","Shut · not evidence of RA guard","dim"]]}
```

## Step 12: Module D — expose the test advertisement on a permitted comparison path

On supported isolated equipment only, predict the effect of removing ENDPOINTS from the R2 ingress while leaving R1’s policy unchanged. Then enable R2 and temporarily remove that one attachment. Leave the changed state in place long enough to record a fresh R2 advertisement.

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

In the same adapter capture, find a fresh RA from fe80::2 and confirm fe80::1 still appears. Record multiple R2 arrivals and their observed intervals. Do not change cables, R2 addressing or VLAN membership between the permitted and guarded tests.

:::expected
R2’s fresh RA reaches the PC when the host-role attachment is absent. This establishes that the test sender and path work, rather than interpreting a negative capture from an inactive router. The PC may learn additional addressing/router information; its exact selection is not the pass criterion.

Paper fallback: supplied capture before protection shows RAs sourced from fe80::1 and fe80::2 arriving on the PC’s lab adapter. The configured interface Gi1/0/4 has no RA guard attachment. State why this is a useful positive control.
:::

```state
{"topology":2,"status":"Gi1/0/4 unguarded · R2's RAs pass","tone":"warn","focus":["SWH","R2"],"chips":[{"node":"PC","text":"Capture icmpv6.type == 134"}],"flows":[{"event":["R2","SWH"],"wait":1.2,"tags":{"R2":"Gi0/0 no shutdown","SWH":"ENDPOINTS removed from Gi1/0/4"}},{"path":["R2","SWH","PC"],"tone":"alt","label":"R2's fresh RA from fe80::2","tags":{"SWH":"Gi1/0/4 · no host-role attachment","PC":"Fresh RA from fe80::2"}},{"path":["R1","SWH","PC"],"label":"R1's RA from fe80::1 still appears"}],"roles":[{"node":"SWH","peer":"R1","text":"ROUTERS","tone":"ok"},{"node":"SWH","peer":"PC","text":"ENDPOINTS"},{"node":"SWH","peer":"R2","text":"ENDPOINTS","until":0},{"node":"SWH","peer":"R2","text":"no RA guard","tone":"warn","from":0}],"rows":[["R2 Gi0/0","No shutdown · fresh RAs"],["Gi1/0/4","No RA guard attachment","warn"],["fe80::2 and fe80::1 RAs","Both reach the PC","ok"],["Shows","Test sender and path work"]]}
```

## Step 13: Module D — restore the boundary and compare fresh evidence

Before restoring the policy, write which RA source should remain visible and which should stop arriving. Keep R2 active for this comparison.

```ios SW-H
SW-H# configure terminal
SW-H(config)# interface gigabitethernet1/0/4
SW-H(config-if)# ipv6 nd raguard attach-policy ENDPOINTS
SW-H(config-if)# end
SW-H# show ipv6 nd raguard policy ENDPOINTS
SW-H# show running-config interface gigabitethernet1/0/4
```

Start a new capture on the same PC adapter and compare several of the R2 advertisement intervals observed in Step 12. Record continued fe80::1 reception and the absence of fresh fe80::2 RAs. If R2 timing changes or neither source is visible, investigate before declaring enforcement. Retained SLAAC addresses/default-router state may remain until advertised lifetimes expire.

:::expected
The restored host-role ingress blocks the test router’s fresh RAs while the legitimate router path continues. This controlled comparison supports the result for the tested traffic and platform; policy text or an old default-router entry alone would not.

Paper fallback: over the supplied repeated comparison, fe80::1 RAs continue, fe80::2 RAs cease, R2 continues sending, and the only change is restoring ENDPOINTS on its actual switch ingress. Explain the bounded conclusion and why immediately clearing all client addresses is unnecessary.
:::

```state
{"topology":2,"status":"R2's RAs blocked at Gi1/0/4","tone":"ok","focus":["SWH","R2"],"chips":[{"node":"R2","text":"Still sending RAs"},{"node":"PC","text":"New capture · same adapter"}],"flows":[{"event":["SWH"],"wait":1.2,"tags":{"SWH":"ENDPOINTS back on Gi1/0/4"}},{"path":["R2","SWH"],"tone":"alt","label":"R2's fresh RA from fe80::2","stop":"SWH","stopText":"Host-role Gi1/0/4 · RA blocked"},{"path":["R1","SWH","PC"],"label":"R1's RA from fe80::1","tags":{"SWH":"Legitimate router path continues"}}],"roles":[{"node":"SWH","peer":"R1","text":"ROUTERS","tone":"ok"},{"node":"SWH","peer":"PC","text":"ENDPOINTS"},{"node":"SWH","peer":"R2","text":"no RA guard","tone":"warn","until":0},{"node":"SWH","peer":"R2","text":"ENDPOINTS","from":0}],"rows":[["Gi1/0/4","ENDPOINTS restored · host role","ok"],["fe80::1 RAs","Continue to the PC","ok"],["Fresh fe80::2 RAs","Absent while R2 keeps sending"],["Old SLAAC/router state","May remain until lifetimes expire","dim"]]}
```

## Step 14: Save each verified checkpoint and clean up

Repeat fresh DHCP leases, gateway pings and static-printer communication in the IPv4 lab. Check port-security state, separate DHCP/DAI trust, actual bindings, DAI rejection evidence and the configured storm thresholds. If a feature was unavailable, leave that hands-on result pending rather than claiming its success.

On SW1 and R1 individually, enter `copy running-config startup-config` from privileged EXEC, accept the destination filename with Enter, and wait for completion. Save the Packet Tracer project as `16-ipv4-security-baseline.pkt`. Saving configuration preserves verified sticky entries present in it; it does not automatically persist the operational snooping database.

After the supported RA comparison is complete, stop its test source:

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/0
R2(config-if)# shutdown
R2(config-if)# end
R2# show ipv6 interface brief
```

Verify the ENDPOINTS attachment remains on SW-H Gi1/0/4. Save each extension device separately, accepting its save prompt. Keep this topology isolated.

:::expected
Submit a checkpoint table with each feature’s intended ingress, expected accepted traffic, controlled rejected traffic, cause/state evidence, repair and fresh retest. Mark values as observed or supplied. Preserve the three IPv4 repairs separately: wrong MAC, missing DHCP server trust, and absent static-printer ARP policy. The RA record identifies permitted R1, permitted R2 control, restored R2 rejection, and final R2 shutdown.
:::

```state
{"status":"Verified · saved","tone":"ok","focus":["SW1","R1"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"Fresh DHCP lease","backTags":{"SW1":"Trusted Gi0/1 · binding learned"}},{"path":["A","SW1","R1"],"back":true,"label":"Gateway ping"},{"path":["B","SW1","P"],"back":true,"label":"Static-printer test"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"B","text":"storm 1.00/0.50"}],"rows":[["SW1 and R1","Saved to startup-config","ok"],["Project","16-ipv4-security-baseline.pkt","ok"],["Snooping database","Not persisted by the save","dim"],["RA test router R2","Shut down","dim"]]}
```

## Troubleshooting

| Symptom | Check |
|---|---|
| PC-A immediately violates again | Correct endpoint, actual MAC and sticky entry; a reset cannot correct a mismatch |
| No fresh lease | VLAN, server reply path, pool and Option 82 policy; a self-assigned address alone does not identify the fault |
| DAI blocks a DHCP client | Current IP/MAC/VLAN/port binding and the relevant counters |
| Printer still blocked | Actual MAC, ACL permit, VLAN application and unintended final implicit denial |
| All ARP on a busy port stops | Error-disable reason and rate policy; individual validation drops differ from a rate-limit shutdown |
| RA policy exists but RAs pass | Attachment on the actual ingress port, role, VLAN path and whether these are fresh advertisements |
| Legitimate IPv6 setup is delayed | Router-facing role, solicitation forwarding and observed advertisements |

## Challenge

Use a copy of the restored IPv4 baseline. Add a second Printer-PT, PRINTER-2, to SW1 Fa0/4 using straight-through copper. Set `10.1.10.30/24` and gateway `10.1.10.1`; that address is already inside R1’s excluded range. Record its actual MAC.

Before opening the answer, write the additions needed to permit this verified static IP/MAC pair while keeping both DHCP clients validated by their snooping bindings. Keep the original printer working and leave all client/printer ports untrusted for DAI. Do not replace the existing ARP ACL or add the `static` application keyword. Predict why the DHCP exclusion alone is insufficient.

Verify fresh ARP/communication for both printers and the clients’ gateways. Record the actual added ACL line, binding evidence and test results. If your simulator cannot implement the ARP ACL, use the supplied answer as a configuration worksheet and record the practical check as pending.

Then complete a short paper variation: a new SW2 uplink Gi0/1 connects to SW1 Fa0/5 and serves only DHCP clients. Both switches snoop VLAN 10 and disable Option 82 insertion. Name the server-reply ingress that needs DHCP trust on each switch. Do not actually cable SW2 in the printer exercise.

:::solution
Configure the new endpoint port and add one permit under the existing ACL. Replace `0011.2233.0030` below with PRINTER-2’s recorded MAC; the illustrated MAC is not a measured value.

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

The original printer permit remains; the new exact pair is permitted. Implicit ACL nonmatches can still use DHCP bindings because the filter lacks `static`. The DHCP exclusion prevents allocation of .30 but does not authorize its ARP. Keep Fa0/4 untrusted.

From PC-B, test .20 and .30. Make the .30 test a fresh resolution by removing that specific ARP entry if supported or using a freshly restarted/released-and-renewed client; verify its new binding before testing. Inspect DAI counters across the test interval. Verify both client gateway pings, then save the separate challenge project.

For the SW2 paper variation, trust SW1 Gi0/1 where R1’s replies enter and SW2 Gi0/1 where upstream replies enter SW2. SW1 Fa0/5 receives client-side traffic, so it does not need server trust merely because it links to a switch. Disabling insertion on both switches avoids an undeclared upstream Option 82 acceptance requirement. DAI still needs its own trust/binding/static-host policy, and IPv6 RA guard requires separate roles and attachments.
:::
