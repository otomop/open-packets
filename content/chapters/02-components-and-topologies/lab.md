---
title: Separate a network path from an application service
environment: mixed
devices: ["1 × Catalyst 2960 (SW1)", "1 × PC-PT (PC-A)", "1 × Server-PT (Server-A)", "Supplied architecture and power worksheets"]
minutes: 35
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build an office LAN and prove that its switch and server do different jobs. Then investigate a web-service failure while the same network still carries ping traffic. Finish by reading larger topology plans and checking a PoE allocation.

Chapter 01 already followed traffic through a router. Here the practical setup stays on one LAN so you can concentrate on device roles. The design worksheets extend those roles to a campus, WAN and wireless expansion without requiring their later configuration commands.

## Topology

Start a new Packet Tracer file. Use a 2960, PC-PT and Server-PT. The switches in this exercise do not need PoE simulation; the power case uses supplied values.

```diagram
{"type":"topology","title":"Office client and web server","caption":"SW1 forwards local frames; Server-A supplies the requested web page.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.0.2.10/24","x":2,"y":3},{"id":"SW1","kind":"switch","label":"SW1","sub":"2960","x":6,"y":3},{"id":"S","kind":"server","label":"Server-A","sub":"192.0.2.20/24","x":10,"y":3}],"links":[{"from":"A","to":"SW1", "label": "Copper straight-through","fromLabel":"Fa0","toLabel":"Fa0/1"},{"from":"SW1","to":"S", "label": "Copper straight-through","fromLabel":"Fa0/2","toLabel":"Fa0"}]}
```

| Connection | Cable |
|---|---|
| PC-A FastEthernet0 → SW1 FastEthernet0/1 | Copper straight-through |
| Server-A FastEthernet0 → SW1 FastEthernet0/2 | Copper straight-through |

| Device | IPv4 address | Mask | Gateway and DNS |
|---|---|---|---|
| PC-A | 192.0.2.10 | 255.255.255.0 | Leave blank |
| Server-A | 192.0.2.20 | 255.255.255.0 | Leave blank |

Both endpoints share the supplied local subnet. There is no router, Internet path, DNS service or DHCP requirement. Use the numeric server address in each test.

## Step 1: Build and document the office LAN

Place, label and cable the three devices. On each endpoint, use **Desktop → IP Configuration → Static** and enter its row from the table. Read it back before continuing.

Open SW1's CLI, decline the initial configuration dialog if offered, and name the switch. The descriptions below document the intended cable endpoints; they do not configure a web service or establish that the cables are correct.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface fastethernet0/1
SW1(config-if)# description PC-A
SW1(config-if)# exit
SW1(config)# interface fastethernet0/2
SW1(config-if)# description Server-A
SW1(config-if)# end
SW1# show interfaces status
```

:::expected
The two ports reach `connected` after initialization. If the compact command is unavailable, use `show interfaces fastethernet0/1` and `show interfaces fastethernet0/2`. Match the real cable endpoints to the descriptions rather than treating a description as proof.
:::

```state
{"status":"LAN built and documented","cabled":true,"addressed":true,"led":true,"focus":["SW1"],"chips":[{"node":"SW1","text":"SW1#"}],"rows":[["Fa0/1 description","PC-A"],["Fa0/2 description","Server-A"],["Port state","connected","ok"]]}
```

## Step 2: Establish two different baseline tests

On Server-A, open **Services → HTTP** and set **HTTP On**. Keep its supplied page, or change a short line of its index page to **Office service baseline** and save that page.

On PC-A's **Desktop → Command Prompt**, run:

```text
ping 192.0.2.20
```

Repeat once if the first attempt loses an initial request while the topology becomes ready. Then use **Desktop → Web Browser** and visit **http://192.0.2.20**. Record the visible page text. Save the project as **02-office-baseline.pkt**.

:::expected
The repeated ping receives replies and the browser obtains the page. Ping tests this ICMP exchange; the browser tests the HTTP service. The path for both is PC-A → SW1 → Server-A. Server-A is an endpoint supplying a service, while SW1 forwards the local frames.
:::

```state
{"status":"Baseline works","tone":"ok","cabled":true,"addressed":true,"focus":["A","S"],"flows":[{"path":["A","SW1","S"],"back":true,"label":"ping 192.0.2.20","tags":{"SW1":"Forwards the local frame"},"backTags":{"S":"Answers the ICMP echo"}},{"path":["A","SW1","S"],"back":true,"label":"Browse http://192.0.2.20","tags":{"SW1":"Same path as the ping"},"backTags":{"S":"HTTP service returns the page"}}],"chips":[{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["ping 192.0.2.20","Replies","ok"],["http://192.0.2.20","Page received","ok"],["Path for both","PC-A → SW1 → Server-A"],["Project file","02-office-baseline.pkt"]]}
```

## Step 3: Stop the service and collect evidence

On Server-A, change **Services → HTTP → Off**. Keep its power, Ethernet connection and address unchanged. On PC-A, repeat the same ping. Close and reopen the Web Browser and request **http://192.0.2.20** again.

Leave HTTP off while recording the results. An already displayed page may be cached; its presence is not proof of a new successful request. If the browser retains it, inspect events for the fresh request in Simulation mode if available. Use the supplied fallback below if a new response cannot be distinguished.

:::expected
New ping requests still receive replies, while a fresh HTTP request cannot obtain a response from the stopped service. The precise browser error or timeout depends on the simulator. The service's Off setting is direct evidence of the controlled change; a timeout alone would not identify this cause on an unknown network.

If the simulator does not let you distinguish a new response from a retained page, record that limitation. For the written exercise, use the supplied observations: ICMP replies arrive; a new HTTP request gets no service response; the server's HTTP setting is Off.
:::

```state
{"status":"Service stopped","tone":"bad","cabled":true,"addressed":true,"focus":["S"],"flows":[{"event":["S"],"wait":1.6,"tone":"warn","tags":{"S":"HTTP set to Off"}},{"path":["A","SW1","S"],"back":true,"label":"ping 192.0.2.20","backTags":{"S":"Still answers the ICMP echo"}},{"path":["A","SW1","S"],"label":"Fresh request for http://192.0.2.20","stop":"S","stopText":"HTTP Off · no service response"}],"chips":[{"node":"S","text":"HTTP On","tone":"ok","until":0},{"node":"S","text":"HTTP Off","tone":"bad","from":0}],"rows":[["ping 192.0.2.20","Replies","ok"],["Fresh HTTP request","No service response","bad"],["Power, cable, address","Unchanged"]]}
```

## Step 4: Restore the application and retest

On Server-A, return HTTP to **On**. Close and reopen PC-A’s browser, request **http://192.0.2.20**, and compare the page with your baseline. Repeat the ping. If your simulator retains a page without showing a distinguishable new response, record that limitation and use the supplied recovery result: after HTTP is enabled, a fresh HTTP request receives the server page and ping continues to receive replies.

:::expected
Both tests work again. Your explanation identifies the stopped HTTP service and the evidence for it. Changing the switch's address, replacing the cable or introducing a router would not have restored the service setting.
:::

```state
{"status":"Service restored","tone":"ok","cabled":true,"addressed":true,"focus":["S"],"flows":[{"event":["S"],"wait":1.6,"tags":{"S":"HTTP set back to On"}},{"path":["A","SW1","S"],"back":true,"label":"Fresh request for http://192.0.2.20","backTags":{"S":"HTTP service returns the page"}},{"path":["A","SW1","S"],"back":true,"label":"ping 192.0.2.20","backTags":{"S":"Answers the ICMP echo"}}],"chips":[{"node":"S","text":"HTTP Off","tone":"bad","until":0},{"node":"S","text":"HTTP On","tone":"ok","from":0}],"rows":[["http://192.0.2.20","Page received","ok"],["ping 192.0.2.20","Replies","ok"],["Cause of the failure","Stopped HTTP service"]]}
```

## Step 5: Choose functions for an office expansion

Complete this worksheet without adding devices or commands. For each requirement, name the needed function and explain its role in one sentence.

| Requirement | Function to identify |
|---|---|
| Laptops need wireless access to this office LAN | Wireless attachment |
| The office needs to reach another IP network | Routing between networks |
| Administrators need consistent settings across many managed APs | AP coordination |
| Traffic between the office and an outside network must follow a security policy | Traffic-policy enforcement |
| Staff need a device that supplies shared web content | Application service |

:::expected
An AP supplies wireless attachment; a router or appropriately configured Layer 3 switch routes; a WLC coordinates supported APs; a firewall enforces traffic policy; a server supplies the application. One enclosure can combine roles, but naming it does not prove that every needed role is configured. An inline IPS may add prevention according to the required security design.
:::

```state
{"status":"Functions named","cabled":true,"addressed":true,"focus":["S"],"chips":[{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Wireless attachment","AP"],["Routing between networks","Router or Layer 3 switch"],["AP coordination · policy","WLC · firewall"],["Application service","Server"]]}
```

## Step 6: Read paths and failure dependencies

Draw these three small plans on paper. Trace the stated exchange, then cross out the failed device and decide whether another listed path remains.

| Plan | Connections and test |
|---|---|
| Campus | Access-A and Access-B each connect to CC1 and CC2. Both CC devices provide combined distribution/core functions. Trace Access-A to Access-B; then remove CC1. |
| Data center | Leaves L1 and L2 each connect to spines S1 and S2. Server-X attaches to L1; Server-Y attaches to L2. Trace X to Y; then remove S1. |
| WAN | Branch-A and Branch-B each connect only to HQ. Trace Branch-A to Branch-B; then remove HQ. |

These are verified connection records, not a demand to configure redundant Ethernet links. Assume the normal design can forward on the surviving listed path; do not infer a recovery time.

:::expected
The campus is two-tier despite having two CC switches; a path can remain through CC2. The spine-leaf path is X → L1 → a spine → L2 → Y; S2 remains after S1 fails. The WAN's only interbranch path uses HQ, so that path is lost. Local communication inside an unaffected branch can remain possible. Physical alternatives are necessary evidence, but their actual forwarding and failover must be verified in a real design.
:::

```state
{"status":"Paper paths traced","cabled":true,"addressed":true,"chips":[{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Campus (two-tier), no CC1","Path remains via CC2","ok"],["Spine-leaf, no S1","X → L1 → S2 → L2 → Y","ok"],["WAN, no HQ","Interbranch path lost","bad"]]}
```

## Step 7: Check a proposed PoE allocation

A proposed PoE switch has **120 W available**, with **60 W already allocated**. Each proposed compatible AP needs **30 W allocated at the source**, and each selected port can supply that allocation. Decide whether two more APs fit and whether a third would fit.

Then consider a separate switch with 60 W remaining whose selected port can supply only 15.4 W. Would that port satisfy one 30 W allocation?

:::expected
Two additional 30 W allocations use the 60 W remainder exactly. A third would exceed the budget. The second switch fails the per-port requirement despite its sufficient aggregate remainder. Compare source-side allocations consistently; endpoint input power and source allocation are different quantities.

On supported PoE hardware, `show power inline` helps inspect allocation. This worksheet does not require that command to work on the simulated 2960.
:::

```state
{"status":"PoE allocation checked","cabled":true,"addressed":true,"chips":[{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Remaining budget","120 W − 60 W = 60 W"],["Two more 30 W APs","Fit exactly","ok"],["A third AP","Exceeds the budget","bad"],["15.4 W port, 30 W need","Fails the per-port check","bad"]]}
```

## Step 8: Save and explain the working result

Save the switch's configuration:

```ios SW1
SW1# copy running-config startup-config
```

Accept the destination filename with Enter and wait for completion. Save **02-components-complete.pkt** with HTTP enabled. Keep your baseline, failure and recovery observations together.

:::expected
The final file contains the restored service, and the notes distinguish three kinds of evidence: port state, an ICMP exchange and an HTTP response. The architecture worksheet names the roles and shows where each remaining or missing path goes.
:::

```state
{"status":"Saved","tone":"ok","cabled":true,"addressed":true,"focus":["SW1"],"chips":[{"node":"SW1","text":"SW1#"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["SW1 configuration","Saved to startup-config","ok"],["Project file","02-components-complete.pkt"],["Evidence","Port state · ICMP · HTTP"]]}
```

## Troubleshooting

| Symptom | Useful check |
|---|---|
| Neither ping nor HTTP works | Inspect endpoint address/mask entries, cable endpoints, power and port states before focusing on HTTP. |
| Ping works but a fresh page request fails | Read the actual HTTP setting and numeric URL; a ping result does not prove application availability. |
| An old page remains after HTTP is off | Request a fresh URL and inspect events if supported; record the simulator limitation if no new response can be distinguished. |
| A diagram looks redundant | Trace the actual surviving connections and identify shared dependencies. Do not infer redundancy from two lines alone. |
| An AP allocation does not fit | Check per-port capability and remaining total budget separately, using the same source-side units. |

## Challenge

Add **PC-B** to SW1 FastEthernet0/3 with copper straight-through. Assign **192.0.2.30**, mask **255.255.255.0**, and no gateway or DNS. Verify its ping and HTTP request to Server-A.

Without changing the configuration, predict which tests would fail for both clients if HTTP stopped, and which would fail if Server-A were powered off. Explain which evidence would distinguish the two cases.

:::solution
PC-B reaches the server locally through SW1. With HTTP stopped but the host/network otherwise working, both clients can still receive ping replies but cannot obtain new HTTP responses. With Server-A powered off, neither client receives ping replies or new HTTP responses from it.

A complete answer gives the two predictions and checks the server's actual service/power state. An unknown host's failed ping alone would not prove that it was powered off. Leave the server powered on with HTTP On, verify both clients, and save a separate challenge file.
:::
