---
title: Build a WLAN and interpret channel, signal and service evidence
environment: mixed
devices: ["WRT300N", "Laptop-PT with compatible wireless module", "Server-PT", "optional AccessPoint-PT"]
minutes: 55
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a fresh, isolated project. The supplied WLAN setup gives you a working application path; the assessed work is interpreting identity, channel use and comparable RF evidence. Steps 7–8 are an optional wrong-passphrase demonstration, and the second cell in Step 10 and real-computer queries in Step 12 are optional. Complete the required RF worksheet and fresh planning challenge even if your simulator cannot report physical measurements.

Keep a table with **question/prediction, source of evidence, actual observation, conclusion and remaining uncertainty**. Simulator graphics are not RF measurements. Supplied paper readings are clearly separate from the values your tool actually reports.

## Topology

```diagram
{"type":"topology","title":"Lab 36 — One wireless cell and a wired destination","caption":"The Internet port is unused; the laptop and server share the wireless router's LAN.","nodes":[{"id":"W","kind":"router","label":"WRT300N","sub":"192.168.80.1/24","x":6,"y":1},{"id":"L","kind":"laptop","label":"Laptop-PT","sub":"DHCP · CCNA-LAB","x":2,"y":5},{"id":"S","kind":"server","label":"Server-PT","sub":"192.168.80.20/24","x":10,"y":5}],"links":[{"from":"W","to":"L","style":"wireless"},{"from":"W","to":"S","fromLabel":"Ethernet 1","toLabel":"Fa0","label":"straight-through"}]}
```

| Device/connection | Setting |
|---|---|
| WRT300N LAN | 192.168.80.1, mask 255.255.255.0 |
| Server-PT Fa0 to WRT Ethernet 1 | Copper straight-through; 192.168.80.20/24, gateway 192.168.80.1 |
| Laptop wireless interface | DHCP; SSID CCNA-LAB |
| DHCP | Start .100; 50 users, ending .149 |
| WLAN | 2.4 GHz, 20 MHz, channel 1, WPA2-Personal/AES |
| Fictional lab passphrase | Cedar-Lab-2026! |

Packet Tracer controls vary by version. Check the actual device dialog. Do not substitute WEP or an open network if the selected model lacks the required WPA2/AES option. Use a compatible model/activity or complete the affected fields as a worksheet and record the limitation. No simulator run was executed during authoring.

## Step 1 — Place, power and cable the equipment

Place WRT300N, Laptop-PT and Server-PT. If the laptop lacks a wireless interface, power it off in Physical, remove its Ethernet module, insert the compatible WPC300N module when offered, and power it on. If that module name differs, use the device's compatible wireless option rather than forcing an incompatible module.

Cable Server-PT Fa0 to WRT Ethernet 1 with copper straight-through. Leave the WRT Internet/WAN port disconnected. Set the server's static address, mask and gateway from the table. Under Services → HTTP, turn HTTP On. This isolated server is the application destination; no DNS or Internet service is required.

:::expected
The laptop exposes a wireless interface; the server's Ethernet link becomes active. Record actual interface labels. A default wireless association, if one appears, is not the configured secure baseline.
:::

```state
{"status":"Server cabled · HTTP on","cabled":true,"addressed":false,"wake":["S"],"focus":["L","S"],"chips":[{"node":"L","text":"Wireless interface"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Server Fa0 → WRT Ethernet 1","Straight-through · link active"],["Server-PT","192.168.80.20/24 · gw .1"],["WRT Internet/WAN port","Disconnected"],["Default association","Not the secure baseline","dim"]]}
```

## Step 2 — Configure the LAN and DHCP

Open WRT300N → GUI → Setup → Basic Setup. Set Router IP to 192.168.80.1 and mask to 255.255.255.0. Enable the LAN DHCP service, set the starting host to 100 and maximum users to 50, then Save Settings. A field that accepts a full address uses 192.168.80.100.

From the server's command prompt:

```text
ping 192.168.80.1
```

:::expected
The saved page shows the intended LAN subnet and DHCP settings. After link/ARP convergence, the server can reach .1. The server's .20 address is outside .100–.149, so it cannot collide with this pool. This is a local LAN test; Internet service is not part of the topology.
:::

```state
{"status":"LAN and DHCP saved","tone":"ok","addressed":true,"focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"path":["S","W"],"back":true,"label":"ping 192.168.80.1","tags":{"S":"Local LAN test · .20 → .1"}}],"rows":[["WRT LAN","192.168.80.1 · 255.255.255.0"],["DHCP pool",".100–.149 · 50 users"],["Server .20","Outside the pool"],["Server → .1","Replies","ok"]]}
```

## Step 3 — Set the WLAN name and channel

Under Wireless → Basic Wireless Settings, set SSID to CCNA-LAB, select a compatible mixed radio mode, choose Standard/20 MHz when exposed, channel 1 and SSID Broadcast Enabled. Save Settings. Record which width options your model actually exposes.

:::expected
A fresh client scan should list CCNA-LAB when the radio is enabled and the client is within simulated range. The configured channel is 1. If the model does not report width or signal numerically, do not invent those measurements.
:::

```state
{"status":"CCNA-LAB on channel 1","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["SSID","CCNA-LAB · broadcast enabled"],["Channel · width","1 · 20 MHz when exposed"],["Radio mode","Compatible mixed mode"],["Width, signal","Record only if reported","dim"]]}
```

## Step 4 — Apply WPA2-Personal security

Under Wireless → Wireless Security, select WPA2 Personal, AES, and Cedar-Lab-2026!, then save. Leave unrelated timing controls at their existing defaults.

:::expected
The saved security page shows WPA2-Personal and AES. This exercise does not require WPA3 support on the WRT model and makes no claim that a different Packet Tracer controller provides it. An existing client profile may need updating before data works.
:::

```state
{"status":"WPA2-Personal · AES","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Security","WPA2-Personal · AES"],["Passphrase","Cedar-Lab-2026!"],["Existing client profile","May need updating"],["WPA3","Not required on the WRT","dim"]]}
```

## Step 5 — Join the laptop and request an address

On the laptop, open Desktop → PC Wireless. Refresh the network list and select CCNA-LAB; if the version uses profile creation, create a profile with that exact name, WPA2-Personal/AES and the lab passphrase. Connect. Set Desktop → IP Configuration to DHCP.

Before connecting, predict whether the SSID name, security result, IP lease and HTTP result would establish the same thing. Then inspect the status and run:

```text
ipconfig /all
ping 192.168.80.1
ping 192.168.80.20
```

Open the laptop's Web Browser and request `http://192.168.80.20`. Record a fresh returned page as well as the ICMP results.

:::expected
The client reports the intended WLAN/security and an address somewhere in .100–.149, mask /24 and gateway .1. Do not assume .100 specifically. Both local targets respond after any initial ARP delay, and the configured HTTP page loads. If ipconfig /all is absent, use the IP Configuration GUI. The dotted line alone is insufficient evidence: record the address and successful data tests too.
:::

```state
{"status":"Joined · leased · page loads","tone":"ok","focus":["L"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok","from":2},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"path":["L","W"],"back":true,"label":"Connect to CCNA-LAB","tags":{"W":"WPA2-Personal · AES"},"backTags":{"L":"Reports CCNA-LAB · WPA2/AES"}},{"path":["L","W"],"back":true,"label":"DHCP request","tags":{"W":"Lease from pool .100–.149"},"backTags":{"L":"/24 · gateway 192.168.80.1"}},{"path":["L","W"],"back":true,"label":"ping 192.168.80.1"},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","tags":{"W":"Same LAN · out Ethernet 1"},"backTags":{"L":"Configured page loads"}}],"rows":[["SSID · security","CCNA-LAB · WPA2-Personal/AES","ok"],["Lease","In .100–.149 · /24 · gw .1","ok"],["Pings .1 and .20","Reply after any ARP delay","ok"],["http://192.168.80.20","Page loads","ok"]]}
```

## Step 6 — Save the verified starting point

Save as wireless-principles-baseline.pkt, then Save As wireless-principles-faults.pkt for the experiments. Record the laptop's actual lease, SSID, security and observed status.

:::expected
Two separate files exist, and the recorded baseline includes successful pings and a fresh HTTP page. Continue only when the initial secure WLAN works; otherwise troubleshoot that state before adding a fault.
:::

```state
{"status":"Baseline saved","tone":"ok","chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Baseline","wireless-principles-baseline.pkt","ok"],["Experiments","wireless-principles-faults.pkt"],["Recorded","Lease · SSID · security · status"]]}
```

## Step 7 — Optional security refresher: observe a wrong client key

This bounded refresher supports the radio/security distinction; chapter 38 owns the fuller WLAN-security workflow. Predict which old fields can remain visible despite failed new key establishment. Change only the laptop's saved passphrase to Cedar-Lab-2025!. Disconnect/reconnect using its wireless utility so a new security exchange is required. Keep the router and DHCP settings unchanged.

Try a fresh HTTP request to `http://192.168.80.20`, try its ping, and inspect client security status. Record this state before restoring anything.

:::expected
The wrong shared secret prevents successful WPA2 key establishment and normal protected data access. The SSID may remain visible, and the laptop may retain its previous IP lease. A stale address does not prove security succeeded; an association indicator does not necessarily mean the four-way handshake completed.
:::

```state
{"status":"Wrong key · data fails","tone":"bad","focus":["L"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Key Cedar-Lab-2025!","tone":"bad","from":0},{"node":"L","text":"Old lease may remain"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Passphrase → Cedar-Lab-2025!"}},{"path":["L","W","S"],"label":"Fresh HTTP request and ping","stop":"L","stopText":"No WPA2 keys · wrong passphrase"}],"rows":[["Laptop passphrase","Cedar-Lab-2025!","bad"],["WPA2 key establishment","Fails","bad"],["SSID · old lease","May still appear","dim"],["Router and DHCP","Unchanged"]]}
```

## Step 8 — Optional security refresher: restore and verify

Restore Cedar-Lab-2026! in the laptop profile, reconnect, and request DHCP again if needed. Repeat both baseline pings and a fresh request for the same HTTP page.

:::expected
The known settings restore access. Record recovery separately from the fault observation. If failure remains, compare SSID, mode and AES selection before changing addressing or channels.
:::

```state
{"status":"Key restored · page loads","tone":"ok","focus":["L"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Key Cedar-Lab-2025!","tone":"bad","until":0},{"node":"L","text":"Lease in .100–.149","tone":"ok","from":2},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Passphrase → Cedar-Lab-2026!"}},{"path":["L","W"],"back":true,"label":"Reconnect to CCNA-LAB","tags":{"W":"WPA2-Personal · AES"},"backTags":{"L":"Reports CCNA-LAB · WPA2/AES"}},{"path":["L","W"],"back":true,"label":"ping 192.168.80.1"},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","tags":{"W":"Same LAN · out Ethernet 1"},"backTags":{"L":"Same page loads"}}],"rows":[["Laptop passphrase","Cedar-Lab-2026! again","ok"],["Pings .1 and .20","Reply","ok"],["http://192.168.80.20","Fresh page loads","ok"],["Record","Recovery apart from the fault"]]}
```

## Step 9 — Change the channel without changing the WLAN identity

First predict whether changing a channel must also change the SSID, passphrase or IP subnet. On WRT300N, change only the standard channel from 1 to 6 and save. Refresh/reconnect the client when necessary. Record the SSID, reported channel and IP address, then ping the server and request its HTTP page again.

:::expected
The WLAN name and passphrase remain the same while the channel changes. A brief reconnection may occur. Successful recovery demonstrates configuration compatibility; it does not measure improved throughput or reduced interference. Keep this channel-6 observation separate from the restoration in Step 10.
:::

```state
{"status":"Channel 6 · same WLAN","tone":"warn","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1","until":0},{"node":"W","text":"CCNA-LAB · channel 6","tone":"warn","from":0},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["W"],"wait":1.2,"tags":{"W":"Channel 1 → 6 · SSID unchanged"}},{"path":["L","W","S"],"back":true,"label":"ping 192.168.80.20"},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","backTags":{"L":"Page loads on channel 6"}}],"rows":[["SSID · passphrase","Unchanged"],["Channel","6 · was 1","warn"],["Ping and HTTP to .20","Work again","ok"],["Throughput, interference","Not measured","dim"]]}
```

## Step 10 — Restore the channel and optionally compare a second cell

Restore WRT channel 1, save, reconnect if needed, and repeat the same HTTP request. Record the restored setting and service result before the optional extension.

Optional: add AccessPoint-PT and cable its wired Port 0 to WRT Ethernet 2 with copper straight-through. In its radio/Port 1 settings, use CCNA-LAB, channel 6, WPA2-PSK, AES and the same passphrase. If this model lacks that security combination, leave it disconnected and use the lesson's ESS diagram as the worksheet instead.

Use available client status/scan information to distinguish the cells. You may move the laptop in the Physical workspace to encourage a change, but do not assume the simulator performs a particular roaming algorithm.

:::expected
The required restoration returns the original channel and working HTTP service. In the optional extension, both cells bridge toward the same LAN/DHCP server. If the client changes serving BSSID, record that evidence and retest .20 by ping and HTTP. Its lease may remain valid; do not claim guaranteed seamless roaming from an unchanged SSID. A real AP can have a management IP while still forwarding as a Layer 2 bridge.
:::

```state
{"status":"Channel 1 restored","tone":"ok","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 6","tone":"warn","until":0},{"node":"W","text":"CCNA-LAB · channel 1","from":0},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["W"],"wait":1.2,"tags":{"W":"Channel 6 → 1 · restored"}},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","backTags":{"L":"Same page loads"}}],"rows":[["Channel","1 · original setting","ok"],["http://192.168.80.20","Loads","ok"],["Optional second cell","AP on Ethernet 2 · channel 6","dim"]]}
```

## Step 11 — Compare RF evidence before deciding on a change

Complete the following paper worksheet before opening its answer. These values are supplied exercise data, not measurements of the Packet Tracer project.

1. Three mutually neighboring APs must use ordinary North American 2.4 GHz 20 MHz channels. Propose a nonoverlapping plan and explain why 1/2/3 differs from your choice. They may share an SSID; does that change the RF overlap?
2. At one receiver, signal is −68 dBm and noise −94 dBm. At another comparable location, signal is −58 dBm and noise −64 dBm. Calculate both SNRs and distinguish stronger signal from better signal-to-noise ratio.
3. A 5 GHz AP occupies bonded component channels 36/40/44/48 at 80 MHz. A neighbor uses 20 MHz channel 44. Are the occupied ranges independent? Would different SSIDs make them so?
4. A client has a strong received signal but slow transfers at lunchtime. Both client count and nearby appliance use rise then; no spectrum data or controlled comparison is available. What facts would you gather before identifying a cause?
5. A receiver reports 600 Mb/s PHY rate and has 24 clients sharing its channel. What application throughput can you establish from those two fields alone?

:::solution Check the RF reasoning
1. Use channels 1, 6 and 11 in the stated plan. 1/2/3 occupy overlapping spectrum. SSID equality or difference does not create independent channels.
2. The SNRs are `−68 − (−94) = 26 dB` and `−58 − (−64) = 6 dB`. The second signal is stronger but has a poorer ratio. Neither ratio alone proves a particular application throughput.
3. The 80 MHz channel includes the neighbor's occupied component. Different primary-channel numbers or SSIDs would not remove that overlap. Choose any change from allowed spectrum and a complete survey, then compare results.
4. Record the affected receiver/band/channel/width, signal/noise where available, utilization and retries, and the same application's results. Correlate authorized controlled changes to distinguish added Wi-Fi load from non-Wi-Fi interference. Timing and proximity alone do not prove the appliance caused it.
5. No exact application throughput. PHY rate is not a per-client reservation or a fixed fraction of useful throughput. Measure the intended service and consider shared airtime, overhead and the rest of the path.
:::

```state
{"status":"Paper: RF worksheet","chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Readings","Supplied data · not this project","dim"],["Channel plan","Three mutually neighboring APs"],["Signal · noise","−68/−94 and −58/−64 dBm"],["PHY rate","600 Mb/s · 24 clients share"]]}
```

## Step 12 — Inspect a real connection without changing it

Optional, on an authorized Windows computer already connected to Wi-Fi, run the following read-only commands. They are Windows commands, not a guarantee of Packet Tracer PC support.

```text
netsh wlan show interfaces
netsh wlan show networks mode=bssid
netsh wlan show drivers
```

Windows may require location permission or an elevated context for particular wireless details. Use the permitted OS settings display if a field is unavailable; do not change networks or expose saved passwords. macOS/Linux inspection is covered in chapter 30.

:::expected
Record only needed fields: SSID/BSSID, band/channel, authentication/cipher and reported rate. A scan is a partial observation, not a complete site survey. Finish by saving the restored simulator file and noting every unsupported step.
:::

### Evidence to keep

- The actual SSID/security, DHCP lease, channel and successful baseline HTTP page; unavailable fields marked as such.
- A prediction and separate observation for the channel change, followed by the restored channel and original HTTP service.
- Optional wrong-key observation and separate recovery, if performed; an old lease is not a fresh security success.
- RF worksheet calculations, channel-range comparisons and a justified next test for ambiguous interference.
- Optional second-cell or Windows observations labeled with their source; no claimed site survey from simulator graphics.

```state
{"status":"Real client · read only","chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Record","SSID/BSSID · band/channel"],["Also","Authentication/cipher · rate"],["A scan","Partial · not a site survey","dim"],["Simulator file","Restored and saved","ok"]]}
```

## Troubleshooting

- SSID not listed: check model/radio support, power, SSID broadcast, scan refresh and simulated range. The absence of a scan entry does not identify one unique cause.
- SSID visible but data fails: compare security mode, cipher and exact passphrase; then inspect IP configuration and DHCP. Existing leases can outlast a failed reconnection.
- .1 reachable but .20 fails: inspect the server address, link, port and host settings. A gateway mistake on a same-subnet server is not automatically the cause of a same-subnet ping failure.
- Optional second AP fails: verify its LAN cable and matching security. It must not introduce a second conflicting DHCP service.

## Challenge

Prepare a fresh **paper** channel and evidence plan for a four-cell training site. The site permits the ordinary North American 2.4 GHz 20 MHz plan. AP-A is fixed on channel 1, and AP-B is fixed on channel 6. All four cells use the same approved SSID/security and bridge to the same client LAN.

The supplied survey establishes these pairs as strongly mutually audible: **A–B, A–C, B–C, B–D and C–D**. A and D are sufficiently separated for the scenario's approved co-channel reuse. No other relevant transmitter appears in this bounded survey. This is explicit survey evidence, not an inference from the drawing or row number.

1. Choose channels for C and D while preserving A and B. Check every listed neighboring pair and explain which channel is reused.
2. A test client measures −64 dBm signal and −90 dBm noise at one location. At a busier location its readings are −59 dBm and −66 dBm. Calculate each SNR; say which reading has the stronger desired signal and which has the better ratio.
3. After a client changes from BSSID A to BSSID C, it reports the same SSID, completed approved security and its original valid lease. What additional checks establish that the intended application still works? Does the unchanged SSID alone prove seamless roaming?
4. Define an acceptance record for an authorized channel change. Include the same locations/test conditions, both radio directions where measurable, retries/utilization, and a fresh application action. State what remains a prediction when no physical RF equipment is available.

:::solution Check the independent plan
C uses channel 11: it hears both fixed A/1 and B/6. D uses channel 1: it hears B/6 and C/11, and the supplied survey permits reuse with A. Every strongly audible pair uses different nonoverlapping channels. This particular reuse decision depends on the stated survey; it is not a universal “fourth AP uses 1” rule.

The first SNR is `−64 − (−90) = 26 dB`. The busier location gives `−59 − (−66) = 7 dB`. The latter desired signal is stronger, but the former has the better ratio. Signal strength alone would select the wrong conclusion about relative noise conditions.

Confirm the intended BSSID-to-AP/forwarding mapping, valid address/mask/gateway, gateway reachability where relevant, and the actual application's fresh result. Record interruption or session behavior if that is a requirement. Identical SSIDs alone do not guarantee identical VLANs, valid addressing or preserved sessions; this scenario explicitly supplies the common LAN rather than asking you to assume it.

Keep before/after channel/width, client location, received/noise measurements where available, both-direction link evidence, retries/utilization and the same application transaction. Apply one approved change, observe it, then restore the known baseline separately if it fails acceptance. In Packet Tracer or paper-only work, channel settings and model predictions can be recorded, but physical coverage, interference and measured capacity remain unverified.
:::
