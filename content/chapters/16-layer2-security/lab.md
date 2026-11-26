---
title: Verify an access-port security policy
environment: packet-tracer
devices: ["1 × 2960-24TT switch (SW1)", "1 × 2911 router (R1)", "2 × PC-PT (PC-A, PC-B)", "1 × Printer-PT (PRINTER)"]
minutes: 60
---
Practice revised November 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks. **Steps 1–7 are the core and take about 60 minutes in Packet Tracer:** port security, DHCP snooping and Dynamic ARP Inspection (DAI) on one 2960. **Steps 8–9 are an optional 20-minute extension** on storm control and IPv6 RA guard. RA guard needs a Catalyst 9300 and a packet capture, so both extension steps are read-and-answer exercises.

For each control you watch it block something, read the evidence on the switch, and repair the result. Keep everything on an isolated lab network. The DHCP server commands on R1 are supplied and explained briefly; Chapter 24 teaches them in full.

## Topology

| Connection | SW1 port | Endpoint addressing |
|---|---|---|
| R1 Gi0/0 | Gi0/1 | `10.1.10.1/24`, gateway and DHCP server |
| PC-A FastEthernet0 | Fa0/1 | DHCP |
| PC-B FastEthernet0 | Fa0/2 | DHCP |
| PRINTER FastEthernet0 | Fa0/3 | `10.1.10.20/24`, gateway `10.1.10.1` |

Use copper straight-through cables. All four switch ports are access ports in VLAN 10. R1 excludes `.1` through `.49`, keeping the static printer outside the allocation range. Record your actual leases and MAC addresses.

```diagram
{"type":"topology","title":"One controlled server path","caption":"Only Gi0/1 receives legitimate DHCP server replies on SW1.","nodes":[{"id":"R1","kind":"router","label":"R1","sub":"10.1.10.1/24","x":6,"y":0.5},{"id":"SW1","kind":"switch","label":"SW1","sub":"VLAN 10","x":6,"y":3,"highlight":true},{"id":"A","kind":"pc","label":"PC-A","sub":"DHCP","x":2,"y":5.5},{"id":"B","kind":"pc","label":"PC-B","sub":"DHCP","x":6,"y":5.5},{"id":"P","kind":"printer","label":"PRINTER","sub":"10.1.10.20/24","x":10,"y":5.5}],"links":[{"from":"R1","to":"SW1","fromLabel":"Gi0/0","toLabel":"Gi0/1","accent":true},{"from":"A","to":"SW1","toLabel":"Fa0/1"},{"from":"B","to":"SW1","toLabel":"Fa0/2"},{"from":"P","to":"SW1","toLabel":"Fa0/3"}]}
```

## Step 1: Build a working LAN

Set the printer's address and gateway in its Config tab. R1 is the DHCP server for this LAN; no relay is involved. `ip dhcp excluded-address` keeps .1 through .49 out of the pool, `network` names the pool's client subnet, and `default-router` hands clients their gateway.

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

On each PC select Desktop → IP Configuration → DHCP. Run `ipconfig /all` and record the PC's address and MAC, then ping `10.1.10.1` and `10.1.10.20`. Repeat a first ping that times out while ARP resolves. Record the printer's MAC from its Config tab; you need it in Step 7.

:::expected
The four switch ports are in VLAN 10. Each PC has its own address from `10.1.10.50` upward and gateway `10.1.10.1`, and both reach the gateway and the printer. Get this baseline working before you continue.
:::

```state
{"status":"Working LAN","tone":"ok","led":true,"focus":["R1","SW1"],"chips":[{"node":"R1","text":"DHCP pool USERS"}],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A requests a DHCP lease","backTags":{"R1":"Lease from outside .1–.49"}},{"path":["B","SW1","P"],"back":true,"label":"PC-B pings 10.1.10.20"}],"rows":[["SW1 ports","Fa0/1–3 and Gi0/1 · VLAN 10"],["PC leases","Unique · gateway 10.1.10.1","ok"],["Gateway and printer","Both PCs reach them","ok"]]}
```

## Step 2: Secure PC-A's port with a sticky MAC

Predict which MAC will fill the single secure entry and whether it will be in startup-config. With only PC-A on Fa0/1, enable port security with sticky learning, then ping the gateway from PC-A so the switch sees a frame from it.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
SW1# show running-config
```

Find the Fa0/1 block in the running configuration and compare its sticky address with PC-A's MAC.

:::expected
Fa0/1 is `Secure-up` with maximum 1 and violation mode shutdown, the defaults. PC-A's MAC appears as a `switchport port-security mac-address sticky` line in the running configuration. It is not in startup-config until you save.
:::

```state
{"status":"PC-A's MAC is sticky","tone":"ok","focus":["SW1","A"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Fa0/1 learns PC-A's MAC as sticky"}}],"roles":[{"node":"SW1","peer":"A","text":"secure-up","tone":"ok"}],"rows":[["Fa0/1","Secure-up · maximum 1","ok"],["Violation mode","Shutdown"],["Sticky entry","PC-A's MAC · running-config"]]}
```

## Step 3: Trigger a violation and recover the port

Disconnect PC-A from Fa0/1 and PC-B from Fa0/2, then connect PC-B to Fa0/1. Ping the gateway from PC-B, then run:

```ios SW1
SW1# show port-security interface fastethernet0/1
SW1# show interfaces status
```

Now remove the cause first: put PC-B back on Fa0/2 and PC-A on Fa0/1. Then reset the port:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
```

Ping the gateway from PC-A.

:::expected
PC-B's first frame on Fa0/1 err-disables the port: status `Secure-shutdown`, violation count 1, and `err-disabled` in `show interfaces status`. After the reset with PC-A back in place, Fa0/1 returns to `Secure-up` and PC-A reaches the gateway. The violation count can still show the earlier incident. Resetting the port with PC-B still attached would shut it down again at PC-B's next frame.
:::

```state
{"status":"Violation, then PC-A restored","tone":"ok","focus":["SW1","A","B"],"flows":[{"path":["B","SW1"],"label":"PC-B's frame on Fa0/1","stop":"SW1","stopText":"Not the sticky MAC · err-disabled"},{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Cause removed · shutdown, no shutdown"}},{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway"}],"roles":[{"node":"SW1","peer":"A","text":"err-disabled","tone":"bad","until":1},{"node":"SW1","peer":"A","text":"secure-up","tone":"ok","from":1}],"rows":[["Violation","Secure-shutdown · count 1","bad"],["Recovery","Remove cause, then reset port","ok"],["Fa0/1 now","Secure-up · PC-A works","ok"]]}
```

## Step 4: Enable DHCP snooping and learn fresh bindings

Trace R1's Offer and ACK back to a client and note the port where they enter SW1. That port needs DHCP snooping trust; the client ports stay untrusted. Nothing here uses Option 82, and R1 would reject requests that carry it, so turn its insertion off. The rate limit of 15 DHCP packets per second on the PC ports is this lab's choice; there is no limit by default.

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

The PCs leased their addresses before snooping was on, so SW1 has no bindings yet. On each PC switch IP Configuration to Static and back to DHCP. Then compare `show ip dhcp snooping binding` on SW1 with `show ip dhcp binding` on R1.

:::expected
VLAN 10 is listed as snooped and Gi0/1 as trusted. Each PC has a binding with its own IP, MAC, VLAN 10 and access port. The static printer has none. R1's table lists every lease it handed out; SW1's lists only the exchanges it watched.
:::

```state
{"status":"Bindings learned","tone":"ok","focus":["SW1"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A renews its lease","tags":{"SW1":"Untrusted Fa0/1 · rate limit 15"},"backTags":{"SW1":"Trusted Gi0/1 · binds PC-A, Fa0/1"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B renews its lease","backTags":{"SW1":"Trusted Gi0/1 · binds PC-B, Fa0/2"}}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP trusted","tone":"ok"}],"rows":[["Snooping","VLAN 10 · Option 82 insertion off"],["Trusted","Gi0/1 only","ok"],["Bindings","PC-A Fa0/1 · PC-B Fa0/2","ok"],["Printer","No binding: static address","dim"]]}
```

## Step 5: Diagnose and repair a missing trust

This is the lab's injected fault. Remove the trust from the server port:

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# no ip dhcp snooping trust
SW1(config-if)# end
```

Request a fresh lease on PC-B (Static, then DHCP). In Simulation mode, filter on DHCP and follow R1's Offer to see where it stops. Run `show ip dhcp snooping`, then restore the trust:

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip dhcp snooping trust
SW1(config-if)# end
```

Renew PC-B's lease again and ping the gateway.

:::expected
Without trust, PC-B gets no lease and falls back to a `169.254.x.x` address. R1 still answers: its Offer reaches SW1 and is dropped at untrusted Gi0/1, and `show ip dhcp snooping` no longer lists Gi0/1 as trusted. With trust restored, PC-B gets a lease and a new binding on Fa0/2. Trusting every port would also bring the lease back, but it would let any port act as a DHCP server.
:::

```state
{"status":"Reply path restored","tone":"ok","focus":["SW1","B"],"flows":[{"path":["R1","SW1"],"tone":"reply","label":"R1's Offer","stop":"SW1","stopText":"Dropped · Gi0/1 untrusted"},{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Gi0/1 DHCP-trusted again"}},{"path":["B","SW1","R1"],"back":true,"label":"PC-B renews its lease","backTags":{"SW1":"Binds PC-B, Fa0/2"}}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP untrusted","tone":"bad","until":1},{"node":"SW1","peer":"R1","text":"DHCP trusted","tone":"ok","from":1}],"rows":[["Fault","Gi0/1 not trusted","bad"],["Symptom","No lease · 169.254.x.x"],["Repair","Trust Gi0/1 only","ok"]]}
```

## Step 6: Turn on DAI and observe the static printer

Four devices send ARP on this LAN: two DHCP clients, the router and the printer. Predict which have a snooping binding and how DAI will treat the others. Trust ARP on the router port with its own command, then inspect VLAN 10.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip arp inspection trust
SW1(config-if)# exit
SW1(config)# ip arp inspection vlan 10
SW1(config)# end
SW1# show ip arp inspection interfaces
SW1# show ip arp inspection statistics vlan 10
```

Ping the gateway from both PCs. On PC-B run `arp -d` to clear its ARP cache, so the next test uses a fresh ARP exchange, then ping the printer and read the statistics again.

:::expected
Both PCs reach the gateway: their ARP matches their bindings, and R1's ARP enters on trusted Gi0/1. The ping to the printer fails and the dropped count rises, because the printer's ARP reply enters untrusted Fa0/3 and matches no binding. Nothing is attacking the network; a static host needs an explicit permit.
:::

```state
{"status":"Printer ARP rejected","tone":"bad","focus":["SW1","P"],"flows":[{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway","tags":{"SW1":"PC-A's ARP matches its binding"}},{"path":["B","SW1","P"],"label":"PC-B's fresh ARP for 10.1.10.20"},{"path":["P","SW1"],"tone":"reply","label":"Printer's ARP reply","stop":"SW1","stopText":"No binding · ARP dropped"}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"P","text":"DAI untrusted"}],"rows":[["DHCP clients","Valid ARP passes","ok"],["Printer 10.1.10.20","No binding · ARP dropped","bad"],["Cause","Static host · not an attack","dim"]]}
```

## Step 7: Permit the printer, verify and save

An ARP ACL permits one exact IP-and-MAC pair while Fa0/3 stays untrusted. Replace the example `000c.2911.7a3e` with the printer MAC you recorded in Step 1.

```ios SW1
SW1# configure terminal
SW1(config)# arp access-list STATIC-HOSTS
SW1(config-arp-nacl)# permit ip host 10.1.10.20 mac host 000c.2911.7a3e
SW1(config-arp-nacl)# exit
SW1(config)# ip arp inspection filter STATIC-HOSTS vlan 10
SW1(config)# end
SW1# show ip arp inspection vlan 10
SW1# copy running-config startup-config
```

Clear PC-B's ARP cache, ping the printer and repeat both gateway pings. Save R1 too, and save the project as `16-l2-security.pkt`.

:::expected
The printer answers and both PCs still reach the gateway. Without the `static` keyword, ARP that the ACL does not match still falls through to the bindings, so the PCs keep working. The save keeps PC-A's sticky entry but not the snooping bindings, which SW1 relearns as clients renew.
:::

```state
{"status":"Printer pair permitted","tone":"ok","focus":["SW1","P"],"chips":[{"node":"SW1","text":"ARP ACL STATIC-HOSTS · VLAN 10"}],"flows":[{"path":["B","SW1","P"],"label":"PC-B's fresh ARP for 10.1.10.20"},{"path":["P","SW1","B"],"tone":"reply","label":"Printer's ARP reply","tags":{"SW1":"STATIC-HOSTS permits the pair"}},{"path":["A","SW1","R1"],"back":true,"label":"PC-A pings the gateway","tags":{"SW1":"No ACL match → binding check"}}],"roles":[{"node":"SW1","peer":"R1","text":"DHCP · DAI trusted","tone":"ok"},{"node":"SW1","peer":"P","text":"DAI untrusted"}],"rows":[["Permitted pair","10.1.10.20 + printer's MAC","ok"],["Fa0/3","Still DAI-untrusted"],["Saved","Sticky MAC kept · bindings relearned","ok"]]}
```

## Step 8: Extension: Read storm-control thresholds

Read this configuration and output from a switch port that runs at 100 Mb/s:

```ios SW1
SW1(config)# interface fastethernet0/2
SW1(config-if)# storm-control broadcast level 1.00 0.50
```

```output
SW1# show storm-control fastethernet0/2 broadcast
Interface  Filter State   Upper        Lower        Current
---------  -------------  -----------  -----------  ----------
Fa0/2      Forwarding       1.00%        0.50%        0.00%
```

1. What is 1% in Mb/s on this port?
2. Broadcasts rise to 3.2%, then fall to 0.7%, then to 0.3%. At each value, is the port dropping broadcasts?
3. While broadcasts are dropped, does PC-B's unicast traffic still flow?

:::expected
1. 1 Mb/s.
2. Dropping at 3.2%, still dropping at 0.7% because that is above the 0.50% falling threshold, forwarding again at 0.3%.
3. Yes. Without `storm-control action shutdown`, only the broadcast class is dropped and the port stays up.
:::

## Step 9: Extension: Read an RA guard test

A Catalyst 9300, SW-H, connects the legitimate router R1 (`fe80::1`) on Gi1/0/24, a test router R2 (`fe80::2`) on Gi1/0/4 and a test PC on Gi1/0/1, all in VLAN 10. Its RA guard configuration:

```ios SW-H
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
```

```output
SW-H# show ipv6 nd raguard policy ENDPOINTS
Policy ENDPOINTS configuration:
  device-role host
Policy ENDPOINTS is applied on the following targets:
Target               Type  Policy               Feature        Target range
Gi1/0/1              PORT  ENDPOINTS            RA guard       vlan all
Gi1/0/4              PORT  ENDPOINTS            RA guard       vlan all
```

The tester captured Router Advertisements (Wireshark filter `icmpv6.type == 134`) on the PC twice, with R2 sending throughout:

| Capture | Gi1/0/4 policy | RAs from `fe80::1` | RAs from `fe80::2` |
|---|---|---|---|
| 1 | None (policy removed) | Yes | Yes |
| 2 | ENDPOINTS | Yes | None |

After capture 2, `ipconfig` on the PC still shows an address in `2001:db8:16:99::/64`, R2's prefix.

1. Which port may send RAs into VLAN 10, and why?
2. Why run capture 1 before trusting capture 2?
3. What would IPv6 hosts lose if Gi1/0/24 had the ENDPOINTS policy by mistake?
4. Does the address from R2's prefix after capture 2 mean RA guard failed?

:::expected
1. Only Gi1/0/24, because only its policy has `device-role router`. Host-role ports drop RAs and Redirects.
2. A blocked RA and a router that never sent one look the same. Capture 1 proves R2 was sending and the path worked, so the absence in capture 2 is caused by the policy.
3. Router discovery: they would stop hearing R1's RAs, so no default router or SLAAC prefix, while IPv4 keeps working.
4. No. RA guard drops new RAs; it does not erase state the PC learned in capture 1. The address and default router remain until their lifetimes expire.
:::

## Troubleshooting

| Symptom | Check |
|---|---|
| Fa0/1 violates again as soon as it is reset | PC-A must be the device on Fa0/1 and the sticky entry must be its MAC; resetting the port cannot fix a mismatch |
| No fresh lease | VLAN 10 in the snooping VLAN list, trust on Gi0/1, `no ip dhcp snooping information option`, then R1's interface and pool |
| DAI blocks a DHCP client | The client's binding: IP, MAC, VLAN and port must all match; renew a lease that predates snooping |
| Printer still blocked | The MAC in the ACL, the VLAN on the `filter` command, and whether the test used a fresh ARP exchange |
| PCs lose ARP after the ACL is applied | A `static` keyword on the `filter` command, which stops the fallback to bindings |
| All traffic on a port stops while DAI is on | `show interfaces status`: an ARP rate-limit shutdown err-disables the port, unlike a single dropped ARP message |

## Challenge

Use a copy of `16-l2-security.pkt`. Add a second Printer-PT, PRINTER-2, to SW1 Fa0/4 using straight-through copper. Set `10.1.10.30/24` and gateway `10.1.10.1`; that address is already inside R1's excluded range. Record its actual MAC.

Before opening the answer, write the commands that let PRINTER-2 use ARP while both DHCP clients are still validated by their snooping bindings. Keep the original printer working and leave every PC and printer port untrusted for DAI. Do not replace the existing ARP ACL or add the `static` keyword. Explain why the DHCP exclusion alone is not enough.

Test with fresh ARP exchanges: both printers from PC-B, and the gateway from both PCs.

Then answer one question on paper: a new switch SW2 connects its uplink Gi0/1 to SW1 Fa0/5 and serves only DHCP clients. Both switches snoop VLAN 10 with Option 82 insertion off. Which port on each switch needs DHCP snooping trust?

:::solution
Configure the new access port and add one permit to the existing ACL. Replace the example `0011.2233.0030` with PRINTER-2's recorded MAC.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/4
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# exit
SW1(config)# arp access-list STATIC-HOSTS
SW1(config-arp-nacl)# permit ip host 10.1.10.30 mac host 0011.2233.0030
SW1(config-arp-nacl)# end
SW1# show ip arp inspection vlan 10
```

The ACL now permits both printers, each as an exact IP-and-MAC pair, and the filter is already applied to VLAN 10. Without `static`, the PCs' ARP still falls through to the DHCP bindings. The DHCP exclusion only stops R1 leasing `.30`; it does not authorize the printer's ARP. Fa0/4 stays untrusted.

For SW2: trust SW1 Gi0/1, where R1's replies enter SW1, and SW2 Gi0/1, where they enter SW2. SW1 Fa0/5 receives only client messages from SW2, so it stays untrusted even though it connects to a switch.
:::
