---
title: Build a WLAN and interpret channel, signal and service evidence
environment: mixed
devices: ["WRT300N", "Laptop-PT with compatible wireless module", "Server-PT", "optional AccessPoint-PT"]
minutes: 55
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You build one small WLAN in a new Packet Tracer project: a wireless router, a laptop and a wired server. You then use it to see the lesson's terms in a working network: the SSID, the channel, the security setting, and the difference between joining a WLAN and reaching a service. Packet Tracer does not simulate signal levels, noise or interference, so Step 11 is a paper worksheet that gives you readings to work with.

Steps 7–8 (a wrong passphrase), the second AP in Step 10 and the Windows commands in Step 12 are optional. The worksheet in Step 11 and the challenge are not. At each step, write down what you expect before you look, then what you saw.

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

The WRT300N is a home wireless router: a router, a small switch, an AP and a DHCP server in one box. Its menu names vary a little between Packet Tracer versions, so follow your own device's dialog where it differs, and do not fall back to WEP or an open network. This lab was written from the device's interface and was not run in the simulator during authoring.

## Step 1 — Place, power and cable the equipment

Place a WRT300N, a Laptop-PT and a Server-PT. A new Laptop-PT has an Ethernet module and no radio. On its Physical tab, power it off, drag the Ethernet module out, insert the WPC300N wireless module, and power it on again. If your version names the module differently, use its 2.4 GHz wireless module.

Cable Server-PT Fa0 to WRT Ethernet 1 with a copper straight-through cable. Leave the WRT Internet port unconnected. Give the server the static address, mask and gateway from the table, and under Services → HTTP check that HTTP is On. The server is the service the laptop will try to reach.

:::expected
The laptop now has a wireless interface, and the server's Ethernet link comes up. The laptop may join the router's default open WLAN on its own. Ignore that connection; you replace it with a secured WLAN in the next steps.
:::

```state
{"status":"Server cabled · HTTP on","cabled":true,"addressed":false,"wake":["S"],"focus":["L","S"],"chips":[{"node":"L","text":"Wireless interface"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Server Fa0 → WRT Ethernet 1","Straight-through · link active"],["Server-PT","192.168.80.20/24 · gw .1"],["WRT Internet/WAN port","Disconnected"],["Default association","Not the secure baseline","dim"]]}
```

## Step 2 — Configure the LAN and DHCP

Open WRT300N → GUI → Setup → Basic Setup. Set the Router IP to 192.168.80.1 and the mask to 255.255.255.0. Leave the DHCP server enabled, with a start address ending in .100 and a maximum of 50 users (the field may show only the last octet). Click Save Settings at the bottom of the page.

From the server's command prompt:

```text
ping 192.168.80.1
```

:::expected
The saved page shows the 192.168.80.0/24 LAN and a DHCP range of .100–.149. The server reaches .1; the first ping may time out while ARP resolves. The server's .20 address is outside the DHCP range, so the router will not lease it to a client.
:::

```state
{"status":"LAN and DHCP saved","tone":"ok","addressed":true,"focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"path":["S","W"],"back":true,"label":"ping 192.168.80.1","tags":{"S":"Local LAN test · .20 → .1"}}],"rows":[["WRT LAN","192.168.80.1 · 255.255.255.0"],["DHCP pool",".100–.149 · 50 users"],["Server .20","Outside the pool"],["Server → .1","Replies","ok"]]}
```

## Step 3 — Set the WLAN name and channel

Under Wireless → Basic Wireless Settings, set the Network Name (SSID) to CCNA-LAB and leave Network Mode on Mixed. Set Radio Band to Standard - 20MHz Channel if your version offers it, set Standard Channel to 1 - 2.412GHz, and leave SSID Broadcast Enabled. Save Settings.

The channel list shows each channel with its center frequency. Compare channels 1, 6 and 11 with the centers given in the lesson.

:::expected
The router now advertises CCNA-LAB on channel 1. If the laptop had joined the default WLAN, that connection drops, because the SSID changed. In the channel list each center is 5 MHz above the one before, and channels 1, 6 and 11 are at 2.412, 2.437 and 2.462 GHz.
:::

```state
{"status":"CCNA-LAB on channel 1","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["SSID","CCNA-LAB · broadcast enabled"],["Channel · width","1 · 20 MHz when exposed"],["Radio mode","Compatible mixed mode"],["Width, signal","Record only if reported","dim"]]}
```

## Step 4 — Apply WPA2-Personal security

Under Wireless → Wireless Security, set Security Mode to WPA2 Personal, Encryption to AES and the Passphrase to Cedar-Lab-2026!, then Save Settings. Leave Key Renewal at its default. This is the WPA2-PSK with AES-CCMP combination from the lesson's security table.

:::expected
The saved page shows WPA2 Personal with AES. The WRT300N has no WPA3 option, and the lab does not need one. The laptop cannot join until it is given the same passphrase.
:::

```state
{"status":"WPA2-Personal · AES","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Security","WPA2-Personal · AES"],["Passphrase","Cedar-Lab-2026!"],["Existing client profile","May need updating"],["WPA3","Not required on the WRT","dim"]]}
```

## Step 5 — Join the laptop and request an address

Before you connect, list in order what has to succeed for the laptop to load a web page from the server: finding the SSID, the WPA2 key exchange, a DHCP lease, then the HTTP request (Fig 36.2 in the lesson).

On the laptop, open Desktop → PC Wireless → Connect and click Refresh. Select CCNA-LAB, click Connect, and enter the passphrase as the pre-shared key. Then set Desktop → IP Configuration to DHCP and run these from the Command Prompt:

```text
ipconfig /all
ping 192.168.80.1
ping 192.168.80.20
```

Open the laptop's Web Browser and request `http://192.168.80.20`.

:::expected
PC Wireless shows CCNA-LAB with WPA2 security, and the Link Information tab shows the connection. The laptop has an address in .100–.149 with mask 255.255.255.0 and gateway 192.168.80.1. Both pings succeed after any first ARP timeout, and the server's page loads. The wireless link drawn in the workspace shows only that the laptop joined the WLAN; the lease, the pings and the page are what show the network works.
:::

```state
{"status":"Joined · leased · page loads","tone":"ok","focus":["L"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok","from":2},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"path":["L","W"],"back":true,"label":"Connect to CCNA-LAB","tags":{"W":"WPA2-Personal · AES"},"backTags":{"L":"Reports CCNA-LAB · WPA2/AES"}},{"path":["L","W"],"back":true,"label":"DHCP request","tags":{"W":"Lease from pool .100–.149"},"backTags":{"L":"/24 · gateway 192.168.80.1"}},{"path":["L","W"],"back":true,"label":"ping 192.168.80.1"},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","tags":{"W":"Same LAN · out Ethernet 1"},"backTags":{"L":"Configured page loads"}}],"rows":[["SSID · security","CCNA-LAB · WPA2-Personal/AES","ok"],["Lease","In .100–.149 · /24 · gw .1","ok"],["Pings .1 and .20","Reply after any ARP delay","ok"],["http://192.168.80.20","Page loads","ok"]]}
```

## Step 6 — Save the verified starting point

Save the project as wireless-principles-baseline.pkt, then use Save As to create wireless-principles-faults.pkt and continue in that copy. Record the laptop's address, the SSID, the channel and the security mode.

:::expected
You have two files and a record of a working WLAN. If the baseline does not work yet, fix it with the Troubleshooting section before you go on.
:::

```state
{"status":"Baseline saved","tone":"ok","chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Baseline","wireless-principles-baseline.pkt","ok"],["Experiments","wireless-principles-faults.pkt"],["Recorded","Lease · SSID · security · status"]]}
```

## Step 7 — Optional security refresher: observe a wrong client key

This optional step shows the join order from the lesson: a client can see an SSID and still fail the key exchange. Chapter 38 covers WLAN security in full. Predict which details the laptop will still show after the key exchange fails.

In PC Wireless, reconnect to CCNA-LAB and enter Cedar-Lab-2025! as the key. Change nothing on the router. Then ping 192.168.80.20, request `http://192.168.80.20` again, and note what the laptop shows.

:::expected
The ping and the page both fail, because the wrong passphrase stops the WPA2 key exchange and no data can pass. The SSID is still listed, and the laptop may still show its old IP address. A visible SSID and a remembered address do not mean the laptop is on the network.
:::

```state
{"status":"Wrong key · data fails","tone":"bad","focus":["L"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Key Cedar-Lab-2025!","tone":"bad","from":0},{"node":"L","text":"Old lease may remain"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Passphrase → Cedar-Lab-2025!"}},{"path":["L","W","S"],"label":"Fresh HTTP request and ping","stop":"L","stopText":"No WPA2 keys · wrong passphrase"}],"rows":[["Laptop passphrase","Cedar-Lab-2025!","bad"],["WPA2 key establishment","Fails","bad"],["SSID · old lease","May still appear","dim"],["Router and DHCP","Unchanged"]]}
```

## Step 8 — Optional security refresher: restore and verify

Reconnect to CCNA-LAB with the correct key, Cedar-Lab-2026!. If the laptop has no address, set IP Configuration to Static and back to DHCP to request one. Repeat both pings and the HTTP request.

:::expected
The pings and the page work again. If they do not, compare the SSID, the security mode, the encryption and the passphrase on both sides before you change anything else.
:::

```state
{"status":"Key restored · page loads","tone":"ok","focus":["L"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Key Cedar-Lab-2025!","tone":"bad","until":0},{"node":"L","text":"Lease in .100–.149","tone":"ok","from":2},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Passphrase → Cedar-Lab-2026!"}},{"path":["L","W"],"back":true,"label":"Reconnect to CCNA-LAB","tags":{"W":"WPA2-Personal · AES"},"backTags":{"L":"Reports CCNA-LAB · WPA2/AES"}},{"path":["L","W"],"back":true,"label":"ping 192.168.80.1"},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","tags":{"W":"Same LAN · out Ethernet 1"},"backTags":{"L":"Same page loads"}}],"rows":[["Laptop passphrase","Cedar-Lab-2026! again","ok"],["Pings .1 and .20","Reply","ok"],["http://192.168.80.20","Fresh page loads","ok"],["Record","Recovery apart from the fault"]]}
```

## Step 9 — Change the channel without changing the WLAN identity

Predict first: if the router moves to another channel, do the SSID, the passphrase or the laptop's IP address have to change? On the WRT300N, change only Standard Channel from 1 to 6 - 2.437GHz and save. Refresh or reconnect in PC Wireless if the laptop does not rejoin by itself. Record the SSID, the channel and the laptop's address, then ping the server and reload its page.

:::expected
The laptop rejoins CCNA-LAB on channel 6 with the same passphrase and the same subnet, and the ping and the page work. The channel is a radio setting of the cell; the SSID, the security and the IP addressing do not depend on it. Clients find the new channel by scanning, so you never set a channel on a client. Packet Tracer cannot show whether channel 6 is less busy than channel 1.
:::

```state
{"status":"Channel 6 · same WLAN","tone":"warn","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1","until":0},{"node":"W","text":"CCNA-LAB · channel 6","tone":"warn","from":0},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["W"],"wait":1.2,"tags":{"W":"Channel 1 → 6 · SSID unchanged"}},{"path":["L","W","S"],"back":true,"label":"ping 192.168.80.20"},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","backTags":{"L":"Page loads on channel 6"}}],"rows":[["SSID · passphrase","Unchanged"],["Channel","6 · was 1","warn"],["Ping and HTTP to .20","Work again","ok"],["Throughput, interference","Not measured","dim"]]}
```

## Step 10 — Restore the channel and optionally compare a second cell

Set the WRT back to channel 1, save, and reload the server's page from the laptop.

Optional: build a second cell to make an ESS. Add an AccessPoint-PT and cable its Port 0 to WRT Ethernet 2 with a copper straight-through cable. Under Config → Port 1, set the SSID to CCNA-LAB, the channel to 6, the authentication to WPA2-PSK with the same passphrase, and the encryption to AES. The two cells now share an SSID, use nonoverlapping channels and connect to the same LAN, as in Fig 36.1.

The new AP has its own BSSID. Compare what PC Wireless shows for each cell. You can move the laptop closer to the new AP in the workspace to make it change cells, but Packet Tracer does not model real roaming decisions.

:::expected
The WRT is back on channel 1 and the page loads. In the optional part, both cells advertise CCNA-LAB and bridge to the same LAN and DHCP server. If the laptop moves to the new AP, it keeps its address and can still reach .20, because both BSSs lead to the same subnet.
:::

```state
{"status":"Channel 1 restored","tone":"ok","focus":["W"],"chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 6","tone":"warn","until":0},{"node":"W","text":"CCNA-LAB · channel 1","from":0},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"flows":[{"event":["W"],"wait":1.2,"tags":{"W":"Channel 6 → 1 · restored"}},{"path":["L","W","S"],"back":true,"label":"http://192.168.80.20","backTags":{"L":"Same page loads"}}],"rows":[["Channel","1 · original setting","ok"],["http://192.168.80.20","Loads","ok"],["Optional second cell","AP on Ethernet 2 · channel 6","dim"]]}
```

## Step 11 — Compare RF evidence before deciding on a change

Work through these five questions on paper before you open the answers. The readings are supplied for the exercise; they are not measurements of your Packet Tracer project.

1. Three APs that can all hear one another use 2.4 GHz with 20 MHz channels in North America. Which channels do you give them, and why not 1, 2 and 3? Does it matter whether they share an SSID?
2. At one location a client measures a signal of −68 dBm and noise of −94 dBm. At a second location it measures −58 dBm and −64 dBm. Calculate both SNRs. Which location has the stronger signal, and which has the better link?
3. A 5 GHz AP uses an 80 MHz channel made of channels 36, 40, 44 and 48. A neighboring AP uses 20 MHz channel 44. Do they overlap? Would giving them different SSIDs change that?
4. A client has a strong signal but slow transfers at lunchtime. More clients are active then, and a microwave oven nearby is in use. What would you measure before naming a cause?
5. A client reports a 600 Mb/s PHY rate, and 24 clients share its channel. What file-transfer speed can you state from those two facts?

:::solution Check the RF reasoning
1. Channels 1, 6 and 11. Channels 1, 2 and 3 have centers only 5 MHz apart, so their 20 MHz transmissions overlap and interfere. The SSID makes no difference: it is a name, not a frequency.
2. `−68 − (−94) = 26 dB` and `−58 − (−64) = 6 dB`. The second location has the stronger signal (−58 dBm) but much the worse SNR, so the first location has the better link.
3. Yes, they overlap: channel 44 is one of the four channels inside the 80 MHz channel. Different SSIDs change nothing.
4. Record the band, channel and width, signal and noise, channel utilization and the retry rate, at lunchtime and at a quiet time. High utilization points to Wi-Fi load; a raised noise floor on 2.4 GHz points to a non-Wi-Fi source. Switching the oven on and off while you watch the retry rate confirms or clears it.
5. None. The PHY rate is the speed of the radio link, not a share reserved for this client. Throughput depends on overhead, retries and how the 24 clients share the airtime, so it has to be measured.
:::

```state
{"status":"Paper: RF worksheet","chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Readings","Supplied data · not this project","dim"],["Channel plan","Three mutually neighboring APs"],["Signal · noise","−68/−94 and −58/−64 dBm"],["PHY rate","600 Mb/s · 24 clients share"]]}
```

## Step 12 — Inspect a real connection without changing it

Optional: on a Windows computer of your own that is connected to Wi-Fi, run these three commands from the lesson. They only display information. They are Windows commands and do not work in Packet Tracer.

```text
netsh wlan show interfaces
netsh wlan show networks mode=bssid
netsh wlan show drivers
```

Recent Windows versions hide some wireless details until location access is allowed for the terminal. Chapter 30 gives the equivalent commands for macOS and Linux.

:::expected
Find the SSID and BSSID, the radio type, the band and channel, the authentication and cipher, and the receive rate, and match each to its section of the lesson. In the scan, count how many BSSIDs share your SSID and which channels your neighbors use. Finish by saving the Packet Tracer file.
:::

### Evidence to keep

- The baseline: SSID, security mode, channel, the laptop's leased address and the loaded page.
- Your prediction and result for the channel change, and the restored channel.
- If you did Steps 7–8: what the laptop still showed with the wrong key, and the recovery.
- Your worksheet answers for Step 11.
- If you did them: the second cell's details and the fields from your own Windows computer.

```state
{"status":"Real client · read only","chips":[{"node":"W","text":"DHCP .100–.149"},{"node":"W","text":"CCNA-LAB · channel 1"},{"node":"W","text":"WPA2-Personal · AES"},{"node":"L","text":"Lease in .100–.149","tone":"ok"},{"node":"S","text":"HTTP On","tone":"ok"}],"rows":[["Record","SSID/BSSID · band/channel"],["Also","Authentication/cipher · rate"],["A scan","Partial · not a site survey","dim"],["Simulator file","Restored and saved","ok"]]}
```

## Troubleshooting

- CCNA-LAB is not listed: check that the laptop has the wireless module and is powered on, that SSID Broadcast is enabled on the router, and click Refresh in PC Wireless.
- CCNA-LAB is listed but nothing works: compare the security mode, the encryption and the exact passphrase on both sides, then check that IP Configuration is set to DHCP. An old address can remain after a failed reconnection.
- The laptop reaches .1 but not .20: check the server's address and mask, its cable to Ethernet 1 and that HTTP is On. The server's gateway setting does not matter for a ping inside one subnet.
- The optional second AP does not work: check its cable to Ethernet 2 and that its SSID, security and passphrase match the router's exactly.

## Challenge

Plan channels on paper for a training site with four APs. The site uses 2.4 GHz with 20 MHz channels in North America. AP-A is fixed on channel 1 and AP-B on channel 6. All four APs use the same SSID and security and connect to the same client LAN.

A site survey shows which pairs of APs hear each other strongly: **A–B, A–C, B–C, B–D and C–D**. AP-A and AP-D barely hear each other. No other transmitters were found.

1. Choose channels for AP-C and AP-D without changing AP-A or AP-B. Check every pair in the survey list, and say which channel is reused.
2. A test client measures a signal of −64 dBm and noise of −90 dBm at one location. At a busier location it measures −59 dBm and −66 dBm. Calculate each SNR. Which location has the stronger signal, and which has the better SNR?
3. A client roams from AP-A's BSSID to AP-C's BSSID. It shows the same SSID and keeps its IP address. What else do you check to confirm that it still works? Does the unchanged SSID prove it?
4. List what you would record before and after a channel change to decide whether the change helped.

:::solution Check the independent plan
1. AP-C uses channel 11, because it hears both AP-A on 1 and AP-B on 6. AP-D uses channel 1: it hears AP-B on 6 and AP-C on 11, and the survey shows it barely hears AP-A, so those two can share a channel. Every pair in the list is now on different nonoverlapping channels. Channel 1 is the reused channel, and that choice comes from the survey, not from a rule that a fourth AP always takes channel 1.

2. The first SNR is `−64 − (−90) = 26 dB` and the second is `−59 − (−66) = 7 dB`. The busier location has the stronger signal but the worse SNR; the first location has the better link.

3. Check that the address, mask and gateway are still right for the network behind AP-C, ping the gateway, and use the application again. The unchanged SSID proves nothing by itself: two APs can advertise one SSID and place clients in different VLANs. Here it works because the scenario puts all four APs on the same client LAN.

4. Record the channel and width, the client's location, signal and noise, channel utilization, the retry rate and one repeatable application test, such as timing the same file transfer. Take the same measurements from the same places before and after, and change one AP at a time. On paper or in Packet Tracer you can plan the channels, but coverage and interference stay unmeasured until you test with real radios.
:::
