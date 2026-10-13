---
title: Build, verify and troubleshoot the integrated branch
environment: packet-tracer
devices: ["2 × 2960 (SW1, SW2)", "3 × 2911 (R1, R2, ISP)", "2 × PC-PT", "2 × Server-PT"]
minutes: 300
---
Build the branch from fresh devices, then verify allowed and denied traffic. Keep a baseline project and introduce one fault at a time in a copy. Budget several sessions if needed; the completion standard is explained evidence, not a promised build time.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use four sessions if that helps: local switching and addressing (Steps 1–4), routed services and access policy (5–10), controlled faults and recovery (11–19), then the independent challenge. Before each configuration block, write what it should change, which observation will demonstrate that change, and which existing service should remain available. The guided faults teach cause and effect; they are not blind diagnosis exercises. Use the chapter tickets and the final challenge for independent decisions.

## Topology

```diagram
{ "type": "topology", "title": "Lab topology",
  "caption": "Branch on the left (two switches, R1), HQ in the middle (R2 and the NTP/syslog server), a stub ISP and a web/DNS server on the right.",
  "nodes": [
    { "id": "PCS", "kind": "pc", "label": "PC-STAFF", "sub": "VLAN 10 · DHCP", "x": 0.5, "y": 1 },
    { "id": "PCG", "kind": "pc", "label": "PC-GUEST", "sub": "VLAN 20 · DHCP", "x": 0.5, "y": 5 },
    { "id": "SW1", "kind": "switch", "label": "SW1 · root", "sub": "10.10.99.11", "x": 2.5, "y": 1, "highlight": true },
    { "id": "SW2", "kind": "switch", "label": "SW2", "sub": "10.10.99.12", "x": 2.5, "y": 5 },
    { "id": "R1", "kind": "router", "label": "R1", "sub": "1.1.1.1", "x": 4.5, "y": 3 },
    { "id": "R2", "kind": "router", "label": "R2", "sub": "2.2.2.2 · PAT", "x": 7, "y": 3 },
    { "id": "HQ", "kind": "server", "label": "SRV-HQ", "sub": "10.255.20.10", "x": 7, "y": 5.5 },
    { "id": "ISP", "kind": "router", "label": "ISP", "sub": "203.0.113.2", "x": 9.5, "y": 3 },
    { "id": "WEB", "kind": "server", "label": "SRV-REMOTE", "sub": "198.51.100.10", "x": 11.5, "y": 3 }
  ],
  "links": [
    { "from": "PCS", "to": "SW1", "toLabel": "Fa0/1" },
    { "from": "PCG", "to": "SW2", "toLabel": "Fa0/2" },
    { "from": "SW1", "to": "SW2", "label": "Po1", "fromLabel": "Fa0/23-24", "toLabel": "Fa0/23-24", "accent": true },
    { "from": "SW1", "to": "R1", "label": "trunk", "fromLabel": "Gi0/1", "toLabel": "G0/0" },
    { "from": "R1", "to": "R2", "label": "10.255.12.0/30", "fromLabel": "G0/1", "toLabel": "G0/0" },
    { "from": "R2", "to": "HQ", "label": "10.255.20.0/24", "fromLabel": "G0/2" },
    { "from": "R2", "to": "ISP", "label": "203.0.113.0/24", "fromLabel": "G0/1", "toLabel": "G0/0", "style": "dashed" },
    { "from": "ISP", "to": "WEB", "label": "198.51.100.0/24", "fromLabel": "G0/1", "style": "dashed" }
  ] }
```

| Link | Cable in Packet Tracer |
|---|---|
| PC-STAFF Fa0 — SW1 Fa0/1; PC-GUEST Fa0 — SW2 Fa0/2 | Copper straight-through |
| SW1 Fa0/23 — SW2 Fa0/23; SW1 Fa0/24 — SW2 Fa0/24 | Copper cross-over (two cables) |
| SW1 Gi0/1 — R1 G0/0 | Copper straight-through |
| R1 G0/1 — R2 G0/0; R2 G0/1 — ISP G0/0 | Copper cross-over |
| R2 G0/2 — SRV-HQ Fa0; ISP G0/1 — SRV-REMOTE Fa0 | Copper cross-over |

| Device / interface | Address | Notes |
|---|---|---|
| R1 G0/0.10 / .20 / .99 / .999 | `10.10.10.1/24`, `10.10.20.1/24`, `10.10.99.1/24`, none | dot1Q 10 / 20 / 99 / 999 native |
| R1 G0/1 — R2 G0/0 | `10.255.12.1/30` — `10.255.12.2/30` | OSPF point-to-point, area 0 |
| R2 G0/2 | `10.255.20.1/24` | SRV-HQ `10.255.20.10/24`, gateway `.1` |
| R2 G0/1 — ISP G0/0 | `203.0.113.1/24` — `203.0.113.2/24` | NAT outside; R2 default route to `.2` |
| ISP G0/1 | `198.51.100.1/24` | SRV-REMOTE `198.51.100.10/24`, gateway `.1` |
| SW1 / SW2 VLAN 99 | `10.10.99.11/24` / `10.10.99.12/24` | `ip default-gateway 10.10.99.1` |
| PC-STAFF / PC-GUEST | DHCP from R1 | candidate leases `.50–.254`; DNS `198.51.100.10` |

These are isolated teaching addresses, not Internet endpoints. The simulated ISP has no route to private branch networks. Use the actual DHCP leases in all client tests. Device outputs below are representative expectations; this procedure has not been executed in Packet Tracer during the audit. Record the installed version and any unsupported feature.


## Step 1 — Inventory, cable and prepare the external service

Create a new Packet Tracer project named `capstone-build.pkt`. Place the nine devices and connect them using the cable/address tables. Decline the routers' initial setup dialog. Renaming an icon does not set its IOS hostname; the command blocks do that separately.

On SRV-HQ, Desktop → IP Configuration: address `10.255.20.10`, mask `255.255.255.0`, gateway `10.255.20.1`. Enable Services → NTP and SYSLOG. Use its time only as this isolated lab's reference; it is not a trusted Internet clock. On SRV-REMOTE set `198.51.100.10/24`, gateway `198.51.100.1`, DNS `198.51.100.10`. Enable HTTP and DNS; add the A record `portal.capstone.test` → `198.51.100.10`.

```ios ISP
Router> enable
Router# configure terminal
Router(config)# hostname ISP
ISP(config)# interface gigabitethernet0/0
ISP(config-if)# ip address 203.0.113.2 255.255.255.0
ISP(config-if)# no shutdown
ISP(config-if)# interface gigabitethernet0/1
ISP(config-if)# ip address 198.51.100.1 255.255.255.0
ISP(config-if)# no shutdown
ISP(config-if)# end
ISP# show ip interface brief
```

From SRV-REMOTE's Desktop → Command Prompt run `ping 198.51.100.1`. Repeat after address resolution if needed.

:::expected
ISP Gi0/1 and the server link become up/up; the server reaches its gateway. ISP Gi0/0 is not expected to be up/up until R2 is configured. Do not require an exact intermediate up/down combination. Stop and repair addressing or cabling if the directly connected test fails.
:::

```state
{"status":"External service ready","tone":"ok","cabled":true,"addressed":false,"led":true,"down":["R1","R2"],"focus":["ISP","WEB","HQ"],"flows":[{"path":["WEB","ISP"],"back":true,"label":"SRV-REMOTE pings 198.51.100.1"}],"chips":[{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["ISP G0/1 · server link","up/up","ok"],["SRV-REMOTE → 198.51.100.1","Replies","ok"],["DNS A record","portal.capstone.test → .10"],["ISP G0/0","Not up/up until R2","dim"]]}
```

## Step 2 — Create VLANs and endpoint ports

Configure each switch separately. The 2960 uses 802.1Q without a trunk-encapsulation selection command. The inter-switch links are still unbundled during this step; default STP may block one to avoid a loop.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name STAFF
SW1(config-vlan)# vlan 20
SW1(config-vlan)# name GUEST
SW1(config-vlan)# vlan 99
SW1(config-vlan)# name MGMT
SW1(config-vlan)# vlan 999
SW1(config-vlan)# name NATIVE-UNUSED
SW1(config-vlan)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# spanning-tree portfast
SW1(config-if)# spanning-tree bpduguard enable
SW1(config-if)# interface gigabitethernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# switchport trunk allowed vlan 10,20,99,999
SW1(config-if)# end
SW1# show vlan brief
SW1# show interfaces trunk
```

```ios SW2
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW2
SW2(config)# vlan 10
SW2(config-vlan)# name STAFF
SW2(config-vlan)# vlan 20
SW2(config-vlan)# name GUEST
SW2(config-vlan)# vlan 99
SW2(config-vlan)# name MGMT
SW2(config-vlan)# vlan 999
SW2(config-vlan)# name NATIVE-UNUSED
SW2(config-vlan)# exit
SW2(config)# interface fastethernet0/2
SW2(config-if)# switchport mode access
SW2(config-if)# switchport access vlan 20
SW2(config-if)# spanning-tree portfast
SW2(config-if)# spanning-tree bpduguard enable
SW2(config-if)# end
SW2# show vlan brief
```

:::expected
Both VLAN databases list 10, 20, 99 and 999. SW1 Fa0/1 belongs to VLAN 10; SW2 Fa0/2 belongs to VLAN 20. Gi0/1 has the intended trunk configuration, but may be absent from operational trunk output while R1 Gi0/0 remains administratively down. A cable alone does not enable the router port.
:::

```state
{"status":"VLANs and access ports set","addressed":false,"down":["R1","R2"],"focus":["SW1","SW2"],"chips":[{"node":"SW1","text":"VLANs 10, 20, 99, 999"},{"node":"SW2","text":"VLANs 10, 20, 99, 999"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["SW1 Fa0/1 · SW2 Fa0/2","Access 10 · 20 · PortFast, BPDU guard"],["SW1 Gi0/1","Trunk · native 999 · 10,20,99,999"],["Operational trunk","May be absent · R1 G0/0 down","dim"]]}
```

## Step 3 — Bundle the links and establish management reachability

Before entering commands, predict which switch should become root, whether two passive LACP ends would initiate a bundle, and whether a management SVI alone proves its VLAN crosses the link. Keep your prediction beside the actual output.

Use LACP active at both ends with matching trunk properties. The newly created port-channel inherits compatible member settings; confirm the logical interface and both members after configuration.

```ios SW1
SW1# configure terminal
SW1(config)# interface range fastethernet0/23 - 24
SW1(config-if-range)# switchport mode trunk
SW1(config-if-range)# switchport trunk native vlan 999
SW1(config-if-range)# switchport trunk allowed vlan 10,20,99,999
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# spanning-tree mode rapid-pvst
SW1(config)# spanning-tree vlan 10,20,99,999 priority 24576
SW1(config)# interface vlan 99
SW1(config-if)# ip address 10.10.99.11 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# ip default-gateway 10.10.99.1
SW1(config)# end
SW1# show etherchannel summary
SW1# show interfaces trunk
```

```ios SW2
SW2# configure terminal
SW2(config)# interface range fastethernet0/23 - 24
SW2(config-if-range)# switchport mode trunk
SW2(config-if-range)# switchport trunk native vlan 999
SW2(config-if-range)# switchport trunk allowed vlan 10,20,99,999
SW2(config-if-range)# channel-group 1 mode active
SW2(config-if-range)# exit
SW2(config)# spanning-tree mode rapid-pvst
SW2(config)# interface vlan 99
SW2(config-if)# ip address 10.10.99.12 255.255.255.0
SW2(config-if)# no shutdown
SW2(config-if)# exit
SW2(config)# ip default-gateway 10.10.99.1
SW2(config)# end
SW2# show etherchannel summary
SW2# show spanning-tree vlan 20
SW2# ping 10.10.99.11
```

:::expected
Po1 is a Layer 2 channel in use, normally shown as Po1(SU), and Fa0/23 and Fa0/24 show bundled (P) on both switches. Po1 carries 10,20,99,999 with native 999. SW1 is root; VLAN 20 displays priority 24596 including the VLAN ID. The switch management SVIs become up/up when VLAN 99 has an active forwarding path, and SW2 can ping 10.10.99.11. The router uplink still depends on Step 4.
:::

```state
{"status":"Po1 up · SW1 is root","tone":"ok","addressed":false,"down":["R1","R2"],"focus":["SW1","SW2"],"flows":[{"path":["SW2","SW1"],"back":true,"label":"SW2 pings 10.10.99.11","tags":{"SW2":"SVI VLAN 99 · tagged onto Po1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"}],"chips":[{"node":"SW1","text":"Root · 24576","tone":"accent"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Po1","Po1(SU) · Fa0/23, Fa0/24 (P)","ok"],["Po1 trunk","10,20,99,999 · native 999"],["Root","SW1 · VLAN 20 shows 24596","ok"],["SW2 → 10.10.99.11","Replies","ok"]]}
```

## Step 4 — Configure the VLAN gateways and request leases

Configure R1. The parent is enabled and unaddressed; subinterfaces bind the tags to the gateway addresses. VLAN 999 remains unaddressed.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 10.10.10.1 255.255.255.0
R1(config-subif)# interface gigabitethernet0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 10.10.20.1 255.255.255.0
R1(config-subif)# interface gigabitethernet0/0.99
R1(config-subif)# encapsulation dot1Q 99
R1(config-subif)# ip address 10.10.99.1 255.255.255.0
R1(config-subif)# interface gigabitethernet0/0.999
R1(config-subif)# encapsulation dot1Q 999 native
R1(config-subif)# exit
R1(config)# ip dhcp excluded-address 10.10.10.1 10.10.10.49
R1(config)# ip dhcp excluded-address 10.10.20.1 10.10.20.49
R1(config)# ip dhcp pool STAFF
R1(dhcp-config)# network 10.10.10.0 255.255.255.0
R1(dhcp-config)# default-router 10.10.10.1
R1(dhcp-config)# dns-server 198.51.100.10
R1(dhcp-config)# exit
R1(config)# ip dhcp pool GUEST
R1(dhcp-config)# network 10.10.20.0 255.255.255.0
R1(dhcp-config)# default-router 10.10.20.1
R1(dhcp-config)# dns-server 198.51.100.10
R1(dhcp-config)# end
R1# show ip interface brief
R1# show ip dhcp binding
```

On each PC, Desktop → IP Configuration → DHCP. Then use `ipconfig /all` to record the actual address, mask, gateway and DNS. After requests, repeat R1's `show ip dhcp binding`. From staff, ping its gateway, the guest's actual lease and `10.10.99.12`.

:::expected
The staff lease is an available address within 10.10.10.50–254; the guest lease is within 10.10.20.50–254. Both use /24, gateway .1 in their subnet, and DNS 198.51.100.10. Allocation need not start at .50. Router subinterfaces and the router trunk are now operational; the local tests pass after convergence. External browsing is not yet expected.
:::

```state
{"status":"Gateways up · leases issued","tone":"ok","addressed":false,"down":["R2"],"wake":["R1"],"focus":["R1"],"flows":[{"path":["PCS","SW1","R1"],"back":true,"label":"PC-STAFF DHCP, Discover to Ack","tags":{"SW1":"VLAN 10 · tagged onto Gi0/1","R1":"G0/0.10 · pool STAFF"},"backTags":{"PCS":"Lease in .50–.254 · gw 10.10.10.1"}},{"path":["PCG","SW2","SW1","R1"],"back":true,"with":true,"wait":1.2,"tone":"alt","label":"PC-GUEST DHCP, Discover to Ack","tags":{"SW2":"VLAN 20 · tagged onto Po1","R1":"G0/0.20 · pool GUEST"},"backTags":{"PCG":"Lease in .50–.254 · gw 10.10.20.1"}},{"path":["PCS","SW1","R1","SW1","SW2","PCG"],"back":true,"label":"PC-STAFF pings the guest lease","tags":{"PCS":"Off subnet → gw 10.10.10.1","R1":"Connected · out G0/0.20 · tag 20"},"backTags":{"R1":"Out G0/0.10 · tag 10"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"}],"chips":[{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["PC-STAFF lease","In 10.10.10.50–254 · gw .1","ok"],["PC-GUEST lease","In 10.10.20.50–254 · gw .1","ok"],["DNS option","198.51.100.10"],["Staff → gateway, guest, .99.12","Replies","ok"]]}
```

## Step 5 — Connect HQ and verify OSPF routes in both directions

Draw the forward and return paths for staff-to-HQ traffic. List the client prefixes R2 must learn and the remote prefixes R1 must learn. Predict whether a successful transit ping would prove those routes exist.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.255.12.1 255.255.255.252
R1(config-if)# ip ospf network point-to-point
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gigabitethernet0/1
R1(config-router)# network 10.10.10.0 0.0.0.255 area 0
R1(config-router)# network 10.10.20.0 0.0.0.255 area 0
R1(config-router)# network 10.10.99.0 0.0.0.255 area 0
R1(config-router)# network 10.255.12.0 0.0.0.3 area 0
R1(config-router)# end
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.255.12.2 255.255.255.252
R2(config-if)# ip ospf network point-to-point
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/1
R2(config-if)# ip address 203.0.113.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# interface gigabitethernet0/2
R2(config-if)# ip address 10.255.20.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.2
R2(config)# router ospf 1
R2(config-router)# router-id 2.2.2.2
R2(config-router)# passive-interface default
R2(config-router)# no passive-interface gigabitethernet0/0
R2(config-router)# network 10.255.12.0 0.0.0.3 area 0
R2(config-router)# network 10.255.20.0 0.0.0.255 area 0
R2(config-router)# default-information originate
R2(config-router)# end
R2# show ip ospf neighbor
R2# show ip route ospf
```

On R1 also run `show ip ospf neighbor`, `show ip route` and `ping 10.255.12.2`. From staff ping `10.255.20.10`. Check SRV-HQ's gateway if the return test fails.

:::expected
Each router reaches FULL with its peer on the point-to-point link; no DR/BDR election is needed there. R2 learns the three branch /24s. R1 learns 10.255.20.0/24 and an OSPF external default through 10.255.12.2. Inspect actual costs instead of requiring a fixed metric or convergence time. Staff reaches HQ. Before PAT, an external client ping can fail because the ISP has no private return route; a timeout alone does not prove the packet reached the server.
:::

```state
{"status":"OSPF FULL · staff reaches HQ","tone":"ok","focus":["R1","R2"],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"FULL · 10.255.20.0/24 + default","R2":"FULL · three branch /24s"}},{"path":["R1","R2"],"back":true,"label":"R1 pings 10.255.12.2"},{"path":["PCS","SW1","R1","R2","HQ"],"back":true,"label":"PC-STAFF pings 10.255.20.10","tags":{"R1":"O 10.255.20.0/24 via 10.255.12.2"},"backTags":{"R2":"O 10.10.10.0/24 via 10.255.12.1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"}],"chips":[{"node":"R2","text":"default → 203.0.113.2"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["R1 ↔ R2","FULL · point-to-point, no DR/BDR","ok"],["R2 learns","Three branch /24s","ok"],["R1 learns","10.255.20.0/24 · default via .2","ok"],["Staff → 10.255.20.10","Replies","ok"]]}
```

## Step 6 — Configure PAT and compare sources

Predict which sources the selector below will translate: staff, guest, SW1 management and R1 transit. Explain how the ISP's missing private return routes affect the untranslated cases before running the comparison.

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip nat inside
R2(config-if)# interface gigabitethernet0/1
R2(config-if)# ip nat outside
R2(config-if)# exit
R2(config)# ip access-list standard NAT-LANS
R2(config-std-nacl)# permit 10.10.10.0 0.0.0.255
R2(config-std-nacl)# permit 10.10.20.0 0.0.0.255
R2(config-std-nacl)# exit
R2(config)# ip nat inside source list NAT-LANS interface gigabitethernet0/1 overload
R2(config)# end
R2# show ip nat statistics
```

From both PCs browse `http://198.51.100.10`, then `http://portal.capstone.test`. While generating traffic, inspect R2's `show ip nat translations` and `show ip nat statistics`.

For an additional source comparison, run `ping 198.51.100.10` from R1. Then run `ping` alone: accept IP, enter target `198.51.100.10`, accept count/size/timeout, answer `y` to Extended commands, supply source `10.10.10.1`, and accept the remaining defaults. A release that accepts an inline source form can use that instead.

:::expected
Both clients load the page by address and name. Active PAT entries use inside global 203.0.113.1 and each client’s actual inside-local address; ports/identifiers vary. R1’s ordinary transit-sourced test is excluded from translation, whereas the staff-gateway-sourced test is eligible. This comparison depends on the stated route/selector design, not a general rule that routers cannot use NAT. No management or transit source is added merely to make the first test pass.
:::

```state
{"status":"PAT for both client subnets","tone":"ok","focus":["R2"],"flows":[{"path":["PCS","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-STAFF browses by address and name","tags":{"R1":"Default via 10.255.12.2","R2":"PAT 10.10.10.x → 203.0.113.1"},"backTags":{"PCS":"Page loads"}},{"path":["PCG","SW2","SW1","R1","R2","ISP","WEB"],"back":true,"with":true,"wait":1.5,"tone":"alt","label":"PC-GUEST browses by address and name","tags":{"R2":"PAT 10.10.20.x → 203.0.113.1"},"backTags":{"PCG":"Page loads"}},{"path":["R1","R2","ISP","WEB"],"back":true,"label":"R1 pings 198.51.100.10 from its transit address","tags":{"R1":"src 10.255.12.1 · egress transit","R2":"Not in NAT-LANS · untranslated"},"backStop":"ISP","backStopText":"No route to 10.255.12.1"},{"path":["R1","R2","ISP","WEB"],"back":true,"label":"R1 extended ping from 10.10.10.1","tags":{"R1":"Extended ping · src 10.10.10.1","R2":"NAT-LANS match → 203.0.113.1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Both clients","Page by address and name","ok"],["PAT inside global","203.0.113.1 · per-client entries","ok"],["R1 ping, transit source","Not translated · no return"],["R1 ping, source 10.10.10.1","Eligible · translated","ok"]]}
```

## Step 7 — Install the guest packet policy and test both directions

Draw a staff echo request and its guest echo reply with source, destination and direction at Gi0/0.20. Predict the first matching entry for the reply, a new guest-to-staff request, a DHCP Discover and a guest external HTTP request. A permit for a reply type is not a session table.

First record that the guest can currently ping staff, management and HQ. Install this complete list on R1:

```ios R1
R1# configure terminal
R1(config)# ip access-list extended GUEST-IN
R1(config-ext-nacl)# 10 permit udp any eq 68 any eq 67
R1(config-ext-nacl)# 20 permit icmp 10.10.20.0 0.0.0.255 10.10.10.0 0.0.0.255 echo-reply
R1(config-ext-nacl)# 40 deny ip 10.10.20.0 0.0.0.255 10.10.10.0 0.0.0.255
R1(config-ext-nacl)# 50 deny ip 10.10.20.0 0.0.0.255 10.10.99.0 0.0.0.255
R1(config-ext-nacl)# 60 deny ip 10.10.20.0 0.0.0.255 10.255.0.0 0.0.255.255
R1(config-ext-nacl)# 70 permit ip 10.10.20.0 0.0.0.255 any
R1(config-ext-nacl)# exit
R1(config)# interface gigabitethernet0/0.20
R1(config-subif)# ip access-group GUEST-IN in
R1(config-subif)# end
R1# show ip interface gigabitethernet0/0.20
R1# show access-lists GUEST-IN
```

Using actual leases, test guest→staff ping (deny), staff→guest ping (allow), guest→10.10.99.11 and 10.255.20.10 ping (deny), guest→10.10.20.1 ping and external HTTP (allow). Renew guest DHCP with `ipconfig /release` and `ipconfig /renew`, or reselect DHCP in its IP Configuration GUI. Compare ACL counters before and after each new test.

:::expected
The inbound attachment is GUEST-IN. Requests and responses match different entries as specified; DHCP remains permitted. A denied probe may time out or receive an unreachable indication, depending on implementation. The list permits an ICMP reply type, not a tracked session; it does not promise all staff-initiated applications will work or control same-VLAN guest traffic. The next step separately restricts SSH to the gateway itself.
:::

```state
{"status":"GUEST-IN in on G0/0.20","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"GUEST-IN in on G0/0.20"}},{"path":["PCG","SW2","SW1","R1"],"label":"PC-GUEST pings PC-STAFF, 10.10.99.11 and 10.255.20.10","stop":"R1","stopText":"GUEST-IN 40, 50, 60 · deny"},{"path":["PCS","SW1","R1","SW1","SW2","PCG"],"back":true,"label":"PC-STAFF pings PC-GUEST","tags":{"R1":"Out G0/0.20 · no outbound list"},"backTags":{"R1":"GUEST-IN 20 · echo-reply permit"}},{"path":["PCG","SW2","SW1","R1"],"back":true,"label":"PC-GUEST pings 10.10.20.1","tags":{"R1":"GUEST-IN 70 · permit"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok","from":0},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Guest → staff, mgmt, HQ","Denied · 40, 50, 60"],["Staff → guest ping","Reply permitted by 20","ok"],["Guest DHCP renew","Permitted by 10","ok"],["Guest → gateway, external HTTP","Permitted by 70","ok"]]}
```

## Step 8 — Restrict management and verify fresh sessions

Configure R1, R2, SW1 and SW2; ISP is excluded. Inspect `show line` and the VTY configuration. The router examples cover lines 0–4; if the image exposes additional VTY lines, apply the same four line settings to those as well. Keep the console session as your recovery path.

On **R1**, keep its console open. Use these fictional credentials only in this isolated project:

```ios R1
R1# configure terminal
R1(config)# ip domain-name capstone.test
R1(config)# username admin privilege 15 secret Capst0ne-Adm1n
R1(config)# enable secret Capst0ne-En4ble
R1(config)# ip access-list standard MGMT-SOURCES
R1(config-std-nacl)# permit 10.10.10.0 0.0.0.255
R1(config-std-nacl)# exit
R1(config)# crypto key generate rsa
```

Answer the key-size prompt with **2048** and wait for completion. On a supporting image the equivalent inline command is `crypto key generate rsa modulus 2048`; do not regenerate an existing intended key on a reused device.

```ios R1
R1(config)# ip ssh version 2
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# access-class MGMT-SOURCES in
R1(config-line)# exec-timeout 10 0
R1(config-line)# end
R1# show ip ssh
R1# show running-config
```

On **R2**, keep its console open. Use these fictional credentials only in this isolated project:

```ios R2
R2# configure terminal
R2(config)# ip domain-name capstone.test
R2(config)# username admin privilege 15 secret Capst0ne-Adm1n
R2(config)# enable secret Capst0ne-En4ble
R2(config)# ip access-list standard MGMT-SOURCES
R2(config-std-nacl)# permit 10.10.10.0 0.0.0.255
R2(config-std-nacl)# exit
R2(config)# crypto key generate rsa
```

Answer the key-size prompt with **2048** and wait for completion. On a supporting image the equivalent inline command is `crypto key generate rsa modulus 2048`; do not regenerate an existing intended key on a reused device.

```ios R2
R2(config)# ip ssh version 2
R2(config)# line vty 0 4
R2(config-line)# login local
R2(config-line)# transport input ssh
R2(config-line)# access-class MGMT-SOURCES in
R2(config-line)# exec-timeout 10 0
R2(config-line)# end
R2# show ip ssh
R2# show running-config
```

On **SW1**, keep its console open. Use these fictional credentials only in this isolated project:

```ios SW1
SW1# configure terminal
SW1(config)# ip domain-name capstone.test
SW1(config)# username admin privilege 15 secret Capst0ne-Adm1n
SW1(config)# enable secret Capst0ne-En4ble
SW1(config)# ip access-list standard MGMT-SOURCES
SW1(config-std-nacl)# permit 10.10.10.0 0.0.0.255
SW1(config-std-nacl)# exit
SW1(config)# crypto key generate rsa
```

Answer the key-size prompt with **2048** and wait for completion. On a supporting image the equivalent inline command is `crypto key generate rsa modulus 2048`; do not regenerate an existing intended key on a reused device.

```ios SW1
SW1(config)# ip ssh version 2
SW1(config)# line vty 0 15
SW1(config-line)# login local
SW1(config-line)# transport input ssh
SW1(config-line)# access-class MGMT-SOURCES in
SW1(config-line)# exec-timeout 10 0
SW1(config-line)# end
SW1# show ip ssh
SW1# show running-config
```

On **SW2**, keep its console open. Use these fictional credentials only in this isolated project:

```ios SW2
SW2# configure terminal
SW2(config)# ip domain-name capstone.test
SW2(config)# username admin privilege 15 secret Capst0ne-Adm1n
SW2(config)# enable secret Capst0ne-En4ble
SW2(config)# ip access-list standard MGMT-SOURCES
SW2(config-std-nacl)# permit 10.10.10.0 0.0.0.255
SW2(config-std-nacl)# exit
SW2(config)# crypto key generate rsa
```

Answer the key-size prompt with **2048** and wait for completion. On a supporting image the equivalent inline command is `crypto key generate rsa modulus 2048`; do not regenerate an existing intended key on a reused device.

```ios SW2
SW2(config)# ip ssh version 2
SW2(config)# line vty 0 15
SW2(config-line)# login local
SW2(config-line)# transport input ssh
SW2(config-line)# access-class MGMT-SOURCES in
SW2(config-line)# exec-timeout 10 0
SW2(config-line)# end
SW2# show ip ssh
SW2# show running-config
```

From staff use `ssh -l admin 10.10.10.1`, then independently test `10.255.12.2`, `10.10.99.11` and `10.10.99.12`. Enter the lab password, check the device prompt and exit each session. From guest test SSH to its own gateway `10.10.20.1`, which is reachable by ping, and to `10.10.99.11`. From staff confirm Telnet is refused.

:::expected
All four staff SSH sessions succeed with local authentication. Guest SSH to its gateway is rejected by the VTY source list, while guest-to-switch SSH is already blocked by GUEST-IN. Telnet is not accepted. A line access list and an interface access list protect different traffic paths. This is simulator login practice; for real SSH host-identity verification use the trusted-key procedure in Chapter 29.
:::

```state
{"status":"SSH from staff only","tone":"ok","focus":["R1","R2","SW1","SW2"],"flows":[{"path":["PCS","SW1","R1"],"back":true,"label":"PC-STAFF ssh -l admin 10.10.10.1","tags":{"R1":"VTY: MGMT-SOURCES · login local"},"backTags":{"PCS":"R1# prompt · exit"}},{"path":["PCS","SW1","R1","SW1","SW2"],"back":true,"label":"PC-STAFF SSH to 10.10.99.12","tags":{"R1":"Routed · out G0/0.99 · tag 99","SW2":"VTY: MGMT-SOURCES · login local"},"backTags":{"PCS":"SW2# prompt · exit"}},{"path":["PCG","SW2","SW1","R1"],"label":"PC-GUEST SSH to 10.10.20.1","stop":"R1","stopText":"Passes GUEST-IN 70 · VTY rejects"},{"path":["PCG","SW2","SW1","R1"],"label":"PC-GUEST SSH to 10.10.99.11","stop":"R1","stopText":"GUEST-IN 50 · deny guest → mgmt"}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Staff SSH · R1, R2, SW1, SW2","Local login succeeds","ok"],["Guest SSH to 10.10.20.1","Rejected · VTY source list"],["Guest SSH to 10.10.99.11","Blocked · GUEST-IN"],["Staff Telnet","Not accepted"]]}
```

## Step 9 — Verify time and collect a known log event

Configure syslog on the managed devices:

```ios R1
R1# configure terminal
R1(config)# logging host 10.255.20.10
R1(config)# logging trap informational
R1(config)# service timestamps log datetime msec
R1(config)# end
R1# show logging
```

```ios R2
R2# configure terminal
R2(config)# logging host 10.255.20.10
R2(config)# logging trap informational
R2(config)# service timestamps log datetime msec
R2(config)# end
R2# show logging
```

```ios SW1
SW1# configure terminal
SW1(config)# logging host 10.255.20.10
SW1(config)# logging trap informational
SW1(config)# service timestamps log datetime msec
SW1(config)# end
SW1# show logging
```

```ios SW2
SW2# configure terminal
SW2(config)# logging host 10.255.20.10
SW2(config)# logging trap informational
SW2(config)# service timestamps log datetime msec
SW2(config)# end
SW2# show logging
```

Configure NTP on **R1** and **R2** separately:

```ios R1
R1# configure terminal
R1(config)# ntp server 10.255.20.10
R1(config)# end
R1# show ntp associations
R1# show ntp status
```

```ios R2
R2# configure terminal
R2(config)# ntp server 10.255.20.10
R2(config)# end
R2# show ntp associations
R2# show ntp status
```

Wait for observations across polls; check server service and both-direction IP reachability if unsynchronized. Do not set a local master to hide a failed server association. Switch NTP is optional: use `ntp server 10.255.20.10` only if that model/image supports it; otherwise record that limitation and leave its timestamp accuracy unverified.

Generate a controlled event on R1 by creating an unused unnumbered loopback, then administratively shutting it:

```ios R1
R1# configure terminal
R1(config)# interface loopback44
R1(config-if)# no shutdown
R1(config-if)# end
R1# configure terminal
R1(config)# interface loopback44
R1(config-if)# shutdown
R1(config-if)# end
```

Inspect SRV-HQ → Services → SYSLOG for the device, interface and severity of the new event.

:::expected
The router status and association identify the selected HQ source and actual stratum; do not require stratum 2 or a fixed one-minute delay. The receiver contains the controlled event if its severity is 0–6 and transport/collection work. If a Packet Tracer model lacks a command or does not emit a documented event, record the feature as unverified and analyse the equivalent evidence from Chapter 27; do not mark a missing event as received.
:::

```state
{"status":"Time source and log event","tone":"ok","focus":["R1","R2","HQ"],"flows":[{"path":["R1","R2","HQ"],"back":true,"label":"R1 NTP with 10.255.20.10","backTags":{"R1":"Selected source 10.255.20.10"}},{"path":["R2","HQ"],"back":true,"with":true,"tone":"alt","label":"R2 NTP with 10.255.20.10","backTags":{"R2":"Selected source 10.255.20.10"}},{"event":["R1"],"tags":{"R1":"Loopback44 up, then shut"}},{"path":["R1","R2","HQ"],"label":"R1 syslog message for the event","tags":{"R1":"trap informational · sev 0–6","HQ":"Event logged · device, severity"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["R1, R2 NTP","Source 10.255.20.10 · actual stratum","ok"],["Syslog","R1, R2, SW1, SW2 → 10.255.20.10"],["Trap level","informational · severity 0–6"],["Switch NTP","Optional · record if unsupported","dim"]]}
```

## Step 10 — Remove the temporary interface and preserve the baseline

Remove only the loopback created in the preceding step:

```ios R1
R1# configure terminal
R1(config)# no interface loopback44
R1(config)# end
R1# show ip interface brief
```

Run the lesson's acceptance matrix, including all four staff logins and both clients' address/name browsing. Record any simulator limitations separately from successful tests. Save on each device individually with `copy running-config startup-config`, accepting its destination prompt before entering the next command. Save the project as `capstone-baseline.pkt`, then Save As `capstone-faults.pkt`. Work only in the fault copy below.

:::expected
The temporary loopback is gone and the original requirements pass. A saved project and saved device configuration are separate checkpoints. The unchanged baseline is available for comparison.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"no interface loopback44"}},{"path":["PCS","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-STAFF browses by address and name","tags":{"R2":"PAT 10.10.10.x → 203.0.113.1"},"backTags":{"PCS":"Page loads"}},{"path":["PCG","SW2","SW1","R1","R2","ISP","WEB"],"back":true,"with":true,"wait":1.5,"tone":"alt","label":"PC-GUEST browses by address and name","tags":{"R1":"GUEST-IN 70 · permit","R2":"PAT 10.10.20.x → 203.0.113.1"},"backTags":{"PCG":"Page loads"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Loopback44","Removed"],["Acceptance matrix","Original requirements pass","ok"],["Saved","Each device · capstone-baseline.pkt","ok"],["Continue in","capstone-faults.pkt"]]}
```

## Step 11 — Observe one EtherChannel member failure

On SW1 shut only Fa0/23:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/23
SW1(config-if)# shutdown
SW1(config-if)# end
SW1# show etherchannel summary
```

Check SW2's summary. From guest ping its gateway, then open the external page. Do not repair yet; record channel/member state and any loss.

:::expected
Fa0/23 no longer participates; Fa0/24 keeps the logical channel operational. Guest connectivity should recover/remain through that member. Transient loss is possible; this test does not promise zero interruption or unchanged capacity.
:::

```state
{"status":"One Po1 member shut","tone":"warn","focus":["SW1","SW2"],"flows":[{"event":["SW1","SW2"],"wait":1.2,"tags":{"SW1":"Fa0/23 shut · leaves Po1","SW2":"Po1 continues on Fa0/24"}},{"path":["PCG","SW2","SW1","R1"],"back":true,"label":"PC-GUEST pings its gateway","tags":{"SW2":"Po1 via Fa0/24"}},{"path":["PCG","SW2","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-GUEST opens the external page","tags":{"R2":"PAT 10.10.20.x → 203.0.113.1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"SW1","text":"Fa0/23 shut · Po1 on Fa0/24","tone":"warn","from":0},{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Fa0/23","No longer participates","warn"],["Po1","Operational on Fa0/24","ok"],["Guest gateway, external page","Recover or remain","ok"],["Transient loss","Possible · record it","dim"]]}
```

## Step 12 — Restore the member and recheck participation

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/23
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show etherchannel summary
```

Check the other switch and repeat the guest test.

:::expected
Both members return to bundled participation after negotiation. Complete this recovery before introducing the next fault.
:::

```state
{"status":"Both members bundled","tone":"ok","focus":["SW1","SW2"],"flows":[{"event":["SW1","SW2"],"wait":1.2,"tags":{"SW1":"Fa0/23 no shutdown","SW2":"Fa0/23, Fa0/24 bundled (P)"}},{"path":["PCG","SW2","SW1","R1"],"back":true,"label":"PC-GUEST pings its gateway"},{"path":["PCG","SW2","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-GUEST opens the external page","tags":{"R2":"PAT 10.10.20.x → 203.0.113.1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"SW1","text":"Fa0/23 shut · Po1 on Fa0/24","tone":"warn","until":0},{"node":"SW1","text":"Po1 · both members (P)","tone":"ok","from":0},{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Fa0/23, Fa0/24","Bundled (P) on both switches","ok"],["Guest test","Repeated","ok"],["Next fault","Only after this recovery"]]}
```

## Step 13 — Observe a VLAN omitted from the router trunk

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan 10,99,999
SW1(config-if)# end
SW1# show interfaces trunk
```

From guest try its gateway ping and renew DHCP. From staff verify external HTTP still works. On R1 inspect `show ip interface brief` and `show ip ospf neighbor`.

:::expected
VLAN 20 is excluded at the router trunk even though Po1 still carries it. Guest gateway/lease tests fail; staff and OSPF remain available. R1’s guest subinterface may still show up/up because the physical link remains up. This combination locates the demonstrated fault more precisely than the client symptom alone.
:::

```state
{"status":"VLAN 20 off the router trunk","tone":"bad","focus":["SW1"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Gi0/1 allowed 10,99,999"}},{"path":["PCG","SW2","SW1","R1"],"label":"PC-GUEST gateway ping and DHCP renew","tags":{"SW2":"VLAN 20 · still on Po1"},"stop":"SW1","stopText":"VLAN 20 not allowed on Gi0/1"},{"path":["PCS","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-STAFF external HTTP","tags":{"SW1":"VLAN 10 still allowed on Gi0/1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"SW1","text":"Gi0/1 allowed 10,20,99,999","until":0},{"node":"SW1","text":"Gi0/1 allowed 10,99,999","tone":"bad","from":0},{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Guest gateway, lease","Fail","bad"],["Po1","Still carries VLAN 20"],["Staff HTTP, OSPF","Still available","ok"],["R1 G0/0.20","May still show up/up","warn"]]}
```

## Step 14 — Restore VLAN 20 and renew the client

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport trunk allowed vlan 10,20,99,999
SW1(config-if)# end
SW1# show interfaces trunk
SW1# show spanning-tree vlan 20
```

Wait until the VLAN's path is forwarding, renew the guest lease and record its current address. Retest gateway, external HTTP and the guest policy.

:::expected
The allowed/active/forwarding path includes VLAN 20 and the client regains service. Convergence is observed from state; it is not assumed to take exactly 30 seconds or to use legacy listening state on every Rapid PVST+ implementation.
:::

```state
{"status":"VLAN 20 restored","tone":"ok","focus":["SW1"],"flows":[{"event":["SW1"],"wait":1.2,"tags":{"SW1":"Gi0/1 allowed 10,20,99,999"}},{"path":["PCG","SW2","SW1","R1"],"back":true,"label":"PC-GUEST renews its lease","tags":{"SW1":"VLAN 20 allowed · forwarding","R1":"GUEST-IN 10 · pool GUEST"},"backTags":{"PCG":"Lease renewed · record it"}},{"path":["PCG","SW2","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-GUEST external HTTP","tags":{"R1":"GUEST-IN 70 · permit","R2":"PAT 10.10.20.x → 203.0.113.1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"SW1","text":"Gi0/1 allowed 10,99,999","tone":"bad","until":0},{"node":"SW1","text":"Gi0/1 allowed 10,20,99,999","tone":"ok","from":0},{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Gi0/1 VLAN 20","Allowed, active, forwarding","ok"],["Guest lease","Renewed · record the address","ok"],["Gateway, external HTTP","Work again","ok"],["Guest policy","Denials unchanged","ok"]]}
```

## Step 15 — Observe a passive OSPF transit

```ios R1
R1# configure terminal
R1(config)# router ospf 1
R1(config-router)# passive-interface gigabitethernet0/1
R1(config-router)# end
R1# show ip protocols
R1# show ip ospf neighbor
R1# show ip route
R1# ping 10.255.12.2
```

Check both routers as the change converges. From staff compare HQ/external access with a local VLAN gateway ping.

:::expected
The connected transit ping remains possible while the OSPF relationship and learned remote/default routes are lost. The local change can remove state immediately; the peer may detect lost hellos through its dead timer. Do not insist that both wait exactly 40 seconds. Local VLAN routing remains available.
:::

```state
{"status":"Transit made passive","tone":"bad","focus":["R1"],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"G0/1 passive · neighbor lost","R2":"May wait for dead timer"}},{"path":["R1","R2"],"back":true,"label":"R1 pings 10.255.12.2","tags":{"R1":"Connected 10.255.12.0/30"}},{"path":["PCS","SW1","R1"],"label":"PC-STAFF to HQ and external","stop":"R1","stopText":"No OSPF or default route"},{"path":["PCS","SW1","R1"],"back":true,"label":"PC-STAFF pings 10.10.10.1","tags":{"R1":"Connected G0/0.10"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"passive G0/1","tone":"bad","from":0},{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["R1 ↔ R2 OSPF","Neighbor lost","bad"],["Learned routes","Remote and default gone","bad"],["R1 → 10.255.12.2","Still replies · connected","ok"],["Staff → own gateway","Replies","ok"]]}
```

## Step 16 — Restore the active transit and prove the routes

```ios R1
R1# configure terminal
R1(config)# router ospf 1
R1(config-router)# no passive-interface gigabitethernet0/1
R1(config-router)# end
R1# show ip ospf neighbor
R1# show ip route
```

Verify R2's branch routes and repeat the HQ and external service tests.

:::expected
FULL and the required routes return after convergence. The repair restores the original design; adding an unrelated static route would conceal the OSPF fault instead of resolving it.
:::

```state
{"status":"Transit active again","tone":"ok","focus":["R1","R2"],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"G0/1 active · FULL again","R2":"Three branch /24s again"}},{"path":["PCS","SW1","R1","R2","HQ"],"back":true,"label":"PC-STAFF pings 10.255.20.10","tags":{"R1":"O 10.255.20.0/24 via 10.255.12.2"},"backTags":{"R2":"O 10.10.10.0/24 via 10.255.12.1"}},{"path":["PCS","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-STAFF external HTTP","tags":{"R1":"Default via 10.255.12.2","R2":"PAT 10.10.10.x → 203.0.113.1"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"passive G0/1","tone":"bad","until":0},{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["R1 ↔ R2","FULL again","ok"],["R2 branch routes","Three /24s back","ok"],["HQ and external tests","Succeed again","ok"],["Static workaround","Not added · it would hide the fault"]]}
```

## Step 17 — Observe an ACL entry that is too broad

```ios R1
R1# configure terminal
R1(config)# ip access-list extended GUEST-IN
R1(config-ext-nacl)# 35 deny ip 10.10.20.0 0.0.0.255 any
R1(config-ext-nacl)# end
R1# show access-lists GUEST-IN
```

From guest renew DHCP, ping its gateway and start a new external request. Compare staff service. Recheck counters and R2's translation table while distinguishing existing translations from new traffic.

:::expected
DHCP still matches line 10. The broad line 35 denies other guest packets before the intended narrower rules and final permit, so the gateway and external requests fail. Existing NAT entries may remain until aged; their presence does not prove these new packets reached R2. The staff-to-guest echo reply exception above line 35 still works.
:::

```state
{"status":"Line 35 too broad","tone":"bad","focus":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"Line 35 · deny guest → any"}},{"path":["PCG","SW2","SW1","R1"],"back":true,"label":"PC-GUEST renews DHCP","tags":{"R1":"GUEST-IN 10 · still permits DHCP"}},{"path":["PCG","SW2","SW1","R1"],"label":"PC-GUEST gateway ping and new external request","stop":"R1","stopText":"GUEST-IN 35 · deny before 40–70"},{"path":["PCS","SW1","R1","SW1","SW2","PCG"],"back":true,"label":"PC-STAFF pings PC-GUEST","backTags":{"R1":"GUEST-IN 20 · above 35 · permit"}}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok","until":0},{"node":"R1","text":"35 deny guest → any","tone":"bad","from":0},{"node":"R2","text":"Old PAT entries may remain","tone":"warn"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Guest DHCP","Line 10 · still works","ok"],["Guest gateway, external","Denied by 35","bad"],["Staff → guest ping","Reply permitted by 20","ok"],["Old PAT entries","May remain · not new traffic","warn"]]}
```

## Step 18 — Remove only the unintended rule

```ios R1
R1# configure terminal
R1(config)# ip access-list extended GUEST-IN
R1(config-ext-nacl)# no 35
R1(config-ext-nacl)# end
R1# show access-lists GUEST-IN
```

Repeat allowed and denied tests from Step 7, plus the guest-gateway SSH denial from Step 8.

:::expected
Removing line 35 restores the intended policy without disabling the whole ACL. Fresh guest external requests can create/use translation state again; intentional internal and management denials remain.
:::

```state
{"status":"Intended policy restored","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"no 35 · rest of GUEST-IN kept"}},{"path":["PCG","SW2","SW1","R1"],"label":"PC-GUEST pings PC-STAFF, 10.10.99.11 and 10.255.20.10","stop":"R1","stopText":"GUEST-IN 40, 50, 60 · deny"},{"path":["PCG","SW2","SW1","R1","R2","ISP","WEB"],"back":true,"label":"PC-GUEST opens the external page","tags":{"R1":"GUEST-IN 70 · permit","R2":"PAT 10.10.20.x → 203.0.113.1"}},{"path":["PCG","SW2","SW1","R1"],"label":"PC-GUEST SSH to 10.10.20.1","stop":"R1","stopText":"Passes GUEST-IN 70 · VTY rejects"}],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"35 deny guest → any","tone":"bad","until":0},{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok","from":0},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Line 35","Removed · list still applied","ok"],["Guest external","New translations again","ok"],["Internal, mgmt denials","Remain","ok"],["Guest SSH to gateway","Still rejected","ok"]]}
```

## Step 19 — Record a reproducible handover

Save the verified running configuration on all five Cisco devices, handling each copy prompt separately. Save `capstone-repaired.pkt`. Record the actual leases, port map, OSPF routes, translation example, ACL counter observations, four login results, time source and collected log. Include every simulator feature you could not demonstrate.

Include a small acceptance table with columns for source, destination/service, expected allow/deny, observed result and supporting evidence. Include staff-to-HQ, both external URLs from both clients, all four staff SSH sessions, guest gateway ping, guest gateway SSH denial and guest-to-staff denial. Record where help was needed; there is no required cold-build time.

:::expected
The final record separates working requirements, restored faults and unverified features. A repeated independent build is evidence of this topology’s skills, not proof of every CCNA objective or a guaranteed exam result.
:::

```state
{"status":"Handover recorded","tone":"ok","focus":["SW1","SW2","R1","R2","ISP"],"roles":[{"node":"SW1","peer":"SW2","text":"Desg FWD"},{"node":"SW2","peer":"SW1","text":"Root FWD"},{"node":"R2","peer":"R1","text":"inside"},{"node":"R2","peer":"ISP","text":"outside"}],"chips":[{"node":"R1","text":"GUEST-IN in · G0/0.20","tone":"ok"},{"node":"HQ","text":"NTP · SYSLOG On","tone":"ok"},{"node":"WEB","text":"HTTP · DNS On","tone":"ok"}],"rows":[["Saved","Five devices · capstone-repaired.pkt","ok"],["Acceptance table","Source, service, expected, observed, evidence"],["Also recorded","Leases, routes, NAT, ACL, logins, time, log"],["Unverified features","Listed separately","dim"]]}
```

## Troubleshooting

- Missing lease: inspect the access VLAN, both trunks, R1 subinterface, DHCP pool/exclusions and policy. A missing binding does not prove that the server received no request.
- Missing route with FULL neighbor: check advertised networks and route selection, then topology consistency including both network types. FULL alone does not diagnose one particular fault.
- No external access: compare route, source selector, inside/outside roles, ACL counters and a fresh application request. Separate numeric-address access from DNS resolution.
- Staff SSH failure: check IP return path, active VTY coverage, local account, key/server state and MGMT-SOURCES. A timeout or refusal is not a complete diagnosis.
- No time/log evidence: verify the actual service and appropriate transport, not only ICMP. A simulator limitation must remain marked unverified.

## Challenge

In a **fresh** project, use staff `10.20.10.0/24` and guest `10.20.20.0/24`, keeping VLAN IDs, management, transit and server networks unchanged. List every dependent configuration area before building. Verify client services, staff management and all guest denials. Do not edit the only working baseline.

For this variation, allow guest HTTP (TCP destination port 80) to SRV-HQ, but continue denying guest HQ ping and all other guest-to-HQ IP traffic. Enable HTTP on SRV-HQ first and prove staff can load its page. Write the guest ACL entry, its position and both required test outcomes before configuring it. Preserve guest external browsing and staff-to-guest ping.

After your build, diagnose this separate authored incident without changing unrelated settings: staff external HTTP works; guest DHCP and gateway ping work; a fresh guest external request passes GUEST-IN but creates no PAT entry; NAT-LANS contains the new staff prefix and the **old** guest prefix. The ISP still has no private return route. State the smallest repair and the positive/negative controls you will retest.

:::solution Review after your independent attempt
On R1 change both gateway addresses, DHCP exclusions, pool networks/default routers and OSPF network statements. Change guest/staff prefixes in GUEST-IN, including the echo-reply exception and final guest-source permit. On R2 change both NAT-LANS entries. On **R1, R2, SW1 and SW2** change MGMT-SOURCES to permit the new staff subnet. Obtain new leases and update test records. VLAN IDs, trunk allowance, LACP, native VLAN and management addresses stay the same.

With the original sequence numbers, the new HQ exception can be inserted before sequence 60:

```ios R1
R1# configure terminal
R1(config)# ip access-list extended GUEST-IN
R1(config-ext-nacl)# 55 permit tcp 10.20.20.0 0.0.0.255 host 10.255.20.10 eq 80
R1(config-ext-nacl)# end
R1# show access-lists GUEST-IN
```

Guest HTTP to `http://10.255.20.10` should load the page and increment the exception. A new guest HQ ping remains denied by sequence 60. HQ replies leave the guest subinterface, so they do not traverse this inbound list. This service stays on the internal routed path; it does not need the external PAT mapping.

For the separate incident, replace only the retired guest selector through R2's console:

```ios R2
R2# configure terminal
R2(config)# ip access-list standard NAT-LANS
R2(config-std-nacl)# no permit 10.10.20.0 0.0.0.255
R2(config-std-nacl)# permit 10.20.20.0 0.0.0.255
R2(config-std-nacl)# end
R2# show access-lists NAT-LANS
R2# show ip nat translations
```

Generate new guest external HTTP by address and name and observe its actual source translation. Retest staff browsing, guest HQ HTTP, guest HQ/staff ping denial and guest gateway SSH denial. A selector miss leaves the packet untranslated; it is not itself an interface ACL drop. The missing private return route explains why that untranslated flow cannot complete here. Preserve the working staff entry and all interface policy.
:::
