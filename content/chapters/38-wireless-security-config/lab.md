---
title: Configure and test a WPA2-Personal WLAN
environment: mixed
devices: ["1 × WLC-3504 where available", "1 × LAP-PT", "1 × 2960 switch", "1 × 2911 router", "1 × PC-PT", "1 × Laptop-PT with compatible wireless module", "1 × Server-PT"]
minutes: 90
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.
You will build a small controller-based WLAN, secure it with WPA2-Personal in the WLC GUI and prove that a wireless laptop reaches a web server. Then you will break it twice, once with a wrong passphrase and once by removing DHCP, and see that the two faults stop the client at different stages. The switch and router configuration is supplied; the skills to practise are the WLAN GUI fields and reading the client's stage.

The lab uses one subnet for management and clients so that the security steps stay easy to see. Chapter 37 separated them with VLANs. Start a new file here and do not reuse that lab's controller interfaces or DHCP pools.

:::note Controller and simulator limits
Use the WLC-3504 and LAP-PT if your Packet Tracer version offers them. Their GUI is AireOS-style, not a Catalyst 9800. Packet Tracer does not model WPA3, Enterprise authentication, RF behavior or every controller state. If a control named in a step is missing in your version, keep the wired setup working, complete that step from its table as a worksheet and label it “not simulated.” Do not substitute an autonomous AP, because the lab is about the controller GUI.
:::

## Topology

```diagram
{"type":"topology","title":"Lab topology — isolated 10.0.10.0/24 WLAN","caption":"The controller uses a trunk with native VLAN 10; the other wired attachments use access VLAN 10 in this isolated single-subnet lab.","nodes":[{"id":"R","kind":"router","label":"R1","sub":"10.0.10.1; DHCP","x":2,"y":1},{"id":"S","kind":"switch","label":"SW1","sub":"VLAN 10","x":6,"y":3},{"id":"W","kind":"wlc","label":"WLC1","sub":"10.0.10.2","x":10,"y":1},{"id":"A","kind":"ap","label":"AP1","sub":"DHCP; CAPWAP","x":10,"y":5},{"id":"L","kind":"laptop","label":"LT1","sub":"SSID CCNA-Lab","x":12,"y":3},{"id":"P","kind":"pc","label":"ADMIN","sub":"10.0.10.10","x":2,"y":5},{"id":"V","kind":"server","label":"WEB1","sub":"10.0.10.20","x":6,"y":6}],"links":[{"from":"R","to":"S","fromLabel":"Gi0/0","toLabel":"Fa0/1"},{"from":"W","to":"S","fromLabel":"Port 1","toLabel":"Fa0/2","label":"trunk; native 10"},{"from":"P","to":"S","toLabel":"Fa0/3"},{"from":"A","to":"S","fromLabel":"Gi0","toLabel":"Fa0/4"},{"from":"V","to":"S","toLabel":"Fa0/5"},{"from":"L","to":"A","style":"wireless","label":"WPA2-PSK/AES"}]}
```

Use copper straight-through for all five wired device-to-switch links. WLC Port 1 is commonly displayed as `GigabitEthernet1` and LAP-PT's wired port as `GigabitEthernet0`; use the selected model's actual connector names.

| Device | IPv4 address/mask | Gateway | Assignment |
|---|---|---|---|
| R1 Gi0/0 | `10.0.10.1/24` | None required in this isolated lab | Static |
| WLC1 management, Port 1 | `10.0.10.2/24` | `10.0.10.1` | Static, untagged (`0`) |
| ADMIN FastEthernet0 | `10.0.10.10/24` | `10.0.10.1` | Static |
| WEB1 FastEthernet0 | `10.0.10.20/24` | `10.0.10.1` | Static |
| AP1 and LT1 | `10.0.10.21–254/24` | `10.0.10.1` | DHCP |

There is no DNS server or Internet connection. Leave DNS unset and test the supplied IP addresses.

## Step 1: Cable, power and prepare the endpoints

Place all seven devices and connect the five wired links. On AP1's Physical tab, fit the power adapter; the 2960 does not supply PoE. LT1 needs a wireless adapter: on its Physical tab, power the laptop off, replace the copper Ethernet module with WPC300N and power it on again, as in chapter 36.

Use Desktop → IP Configuration on ADMIN and WEB1 to enter their static address, `255.255.255.0` mask and gateway. On WEB1 open Services → HTTP and turn HTTP On. This is a disposable local test page with no credentials.

:::expected
ADMIN and WEB1 show the static values from the table. LT1 has a wireless interface and AP1 is powered. Nothing has joined the WLAN yet.
:::

```state
{"status":"Cabled, endpoints ready","addressed":false,"focus":["P","V","L"],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"L","text":"Wireless NIC · not joined"}],"rows":[["ADMIN","10.0.10.10/24 · gw 10.0.10.1"],["WEB1","10.0.10.20/24 · gw 10.0.10.1"],["AP join, wireless client","None claimed yet","dim"]]}
```

## Step 2: Configure the switch, router and DHCP pool

On the switch, put all five ports in access VLAN 10, then change only Fa0/2 into the trunk toward the controller. A controller connects by trunk because each WLAN can map to a different VLAN; this lab carries only native VLAN 10. `spanning-tree portfast trunk` (chapter 15) lets that trunk forward without the usual STP delay.

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name WLAN-LAB
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/1 - 5
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface fastethernet0/2
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 10
SW1(config-if)# switchport trunk allowed vlan 10
SW1(config-if)# spanning-tree portfast trunk
SW1(config-if)# end
SW1# show vlan brief
SW1# show interfaces trunk
```

On the router:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# ip dhcp excluded-address 10.0.10.1 10.0.10.20
R1(config)# ip dhcp pool WLAN-LAB
R1(dhcp-config)# network 10.0.10.0 255.255.255.0
R1(dhcp-config)# default-router 10.0.10.1
R1(dhcp-config)# end
R1# show ip interface brief
```

From ADMIN run `ping 10.0.10.1` and `ping 10.0.10.20` in Desktop → Command Prompt. Open `http://10.0.10.20` in ADMIN's browser.

:::expected
Fa0/1 and Fa0/3–5 are access members of VLAN 10. Fa0/2 is a trunk with native VLAN 10 and allowed VLAN 10; it appears operational once the controller link is up. R1 Gi0/0 becomes up/up. ADMIN reaches R1 and WEB1, and the test page loads. The first ping may lose a reply while ARP resolves. Fix any wired failure now, before the wireless steps.
:::

```state
{"status":"Wired baseline works","tone":"ok","addressed":false,"wake":["R"],"focus":["S","R"],"flows":[{"path":["P","S","R"],"back":true,"label":"ADMIN pings 10.0.10.1","tags":{"S":"Access VLAN 10 · out Fa0/1","R":"Gi0/0 up/up"}},{"path":["P","S","V"],"back":true,"label":"Ping and page from 10.0.10.20","tags":{"S":"Access VLAN 10 · out Fa0/5","V":"HTTP On · page loads"}}],"chips":[{"node":"S","text":"Fa0/2 trunk · native 10"},{"node":"R","text":"Pool WLAN-LAB"},{"node":"L","text":"Not connected yet"}],"rows":[["Access VLAN 10","Fa0/1 and Fa0/3–5"],["Fa0/2","Trunk · native 10 · allowed 10"],["DHCP pool","WLAN-LAB · .1–.20 excluded"],["ADMIN to R1 and WEB1","Replies · page loads","ok"]]}
```

## Step 3: Initialize controller management

In WLC1's Config → Management page, enter `10.0.10.2`, mask `255.255.255.0` and gateway `10.0.10.1`. Management stays untagged, which AireOS shows as VLAN `0`; the switch trunk places that untagged traffic in native VLAN 10.

From ADMIN's browser open `http://10.0.10.2`. A new controller serves its first-time setup wizard over HTTP, which is acceptable only in an isolated lab. (If your controller is already set up, go straight to `https://10.0.10.2`.) Create the administrator account and enter these values when the wizard asks for them:

| Setup field | Value |
|---|---|
| Controller name | `WLC1` |
| Administrator username/password | `labadmin` / `Admin-Lab-2026!` |
| Management IP/mask/gateway | `10.0.10.2` / `255.255.255.0` / `10.0.10.1` |
| Management VLAN / physical port | Untagged (`0`) / `1` |
| DHCP server for management/WLAN use, if exposed | `10.0.10.1` |
| Required initial employee SSID, if any | `SETUP-LAB` |
| Initial security/passphrase | WPA2-Personal, AES / `Setup-Lab-2026!` |

Check the fields and Apply. If the controller restarts, wait until it answers a ping, then log in at `https://10.0.10.2`. Open WLANs and note the IDs in use. The wizard's WLAN normally takes ID 1 and this lab uses ID 2; if 2 is taken, choose another unused ID and use it throughout.

:::expected
The controller shows the management settings from the table and accepts the `labadmin` login over HTTPS.
:::

```state
{"status":"Controller management up","tone":"ok","focus":["W"],"flows":[{"path":["P","S","W"],"back":true,"label":"ADMIN browses to 10.0.10.2","tags":{"S":"Untagged out Fa0/2 · native 10","W":"Management · VLAN 0 = untagged"}}],"chips":[{"node":"W","text":"Port 1 · untagged (0)"},{"node":"L","text":"Not connected yet"}],"rows":[["Management","10.0.10.2/24 · gw 10.0.10.1"],["VLAN / port","Untagged (0) / Port 1"],["Admin account","Accepted","ok"],["WLAN IDs","Recorded · ID 2 reserved"]]}
```

## Step 4: Verify the AP and DHCP path

AP1 must get its address by DHCP. Check that setting in its Config tab, then look for the lease on R1:

```ios R1
R1# show ip dhcp binding
```

Note AP1's address and MAC. On the controller open Wireless → Access Points → All APs and look for AP1. The AP and controller share a subnet, so the AP finds the controller by local broadcast and needs no DHCP option 43 (chapter 37). The join can take a minute or two.

In Controller → Interfaces → management, set Primary DHCP Server to `10.0.10.1`. With DHCP proxy (chapter 37) the controller forwards client DHCP requests to this address. Leave the controller's internal DHCP server off; R1 is the only DHCP server in this lab.

:::expected
AP1 holds a lease in `10.0.10.21–254` and appears in the controller's AP list. The management interface points to DHCP server `10.0.10.1`. The lease alone does not prove the join; the AP list does.
:::

```state
{"status":"AP1 leased, join checked","tone":"ok","focus":["A","W"],"flows":[{"path":["A","S","R"],"back":true,"label":"DHCP lease for AP1","tags":{"R":"Lease in 10.0.10.21–254"}},{"path":["A","S","W"],"back":true,"label":"CAPWAP discovery and join","tags":{"A":"Same VLAN · no option 43","W":"Registers where implemented"}}],"chips":[{"node":"W","text":"Primary DHCP 10.0.10.1"},{"node":"L","text":"Not connected yet"}],"rows":[["AP1 lease","In 10.0.10.21–254 · record it"],["AP1 join","Controller record, where implemented"],["Primary DHCP server","10.0.10.1"],["Lease alone","Not proof of a join","dim"]]}
```

## Step 5: Create the WLAN and configure security while disabled

Before you open the GUI, write down four decisions: the SSID, the client network, the cipher and the key-management method. Decide whether this Personal design needs a RADIUS server. Then open WLANs → Create New → Go and create profile `CCNA-USERS` with SSID `CCNA-Lab` and WLAN ID `2` (or your unused ID). Leave Status unticked while you edit, set the fields below and click Apply before you leave each tab.

| Page/field | Required setting |
|---|---|
| General → Interface/Interface Group | `management` for this flat lab |
| General → Radio Policy | A band supported by AP1 and LT1; All if offered |
| General → Broadcast SSID | Enabled |
| Security → Layer 2 → security family | `WPA+WPA2` on AireOS-style pages |
| WPA Policy / WPA2 Policy | Off / On |
| TKIP / AES | Off / On |
| AKM 802.1X / PSK | Off / On |
| PSK Format / key | ASCII / `StudyLab-2026!` |
| Security → Layer 3 | None; no WebAuth for this test |

The `WPA+WPA2` dropdown only opens these options. The checkboxes decide the result, and a new WLAN starts with 802.1X ticked.

:::expected
The WLAN is stored but still disabled, and its security summary shows WPA2 with PSK and AES. It maps to `management` only because this lab is one flat subnet. The design needs no RADIUS server.
:::

```state
{"status":"WLAN 2 built, disabled","focus":["W"],"chips":[{"node":"W","text":"WLAN 2 · disabled"},{"node":"L","text":"Not connected yet"}],"rows":[["WLAN","ID 2 · CCNA-USERS · SSID CCNA-Lab"],["Layer 2","WPA2 · AES · PSK (ASCII)"],["Off","WPA, TKIP, 802.1X, WebAuth"],["Interface","management · no RADIUS"]]}
```

## Step 6: Inspect policy, enable and save

Open the QoS tab. Leave the profile at Silver (best effort), which suits ordinary data, and leave WMM Policy at Allowed. Open the Advanced tab and write down the session timeout, client exclusion, DHCP-required and P2P blocking values your version shows. You change nothing here; the aim is to know where these policies live.

Return to General, tick Status Enabled and Apply, then click Save Configuration. Disable the `SETUP-LAB` WLAN that the wizard created, so LT1 cannot join it by mistake.

:::expected
WLAN 2 is enabled with WPA2, AES and PSK on the `management` interface. You can say what each recorded Advanced value means: a session timeout of `1800` is 30 minutes, and a client exclusion time applies only to a client the controller has actually excluded.
:::

```state
{"status":"WLAN 2 enabled, saved","tone":"ok","focus":["W"],"flows":[{"event":["W"],"wait":1.2,"tags":{"W":"Enable · Apply · Save"}}],"chips":[{"node":"W","text":"WLAN 2 · disabled","until":0},{"node":"W","text":"WLAN 2 · enabled","tone":"ok","from":0},{"node":"L","text":"Not connected yet"}],"rows":[["QoS","Silver if offered · WMM allowed"],["Advanced values","Recorded · not faults"],["WLAN 2","Enabled · WPA2/PSK/AES","ok"],["Setup WLAN, if any","Disabled"]]}
```

## Step 7: Join LT1 and prove actual data access

Before you connect, predict what each of these will prove: the SSID appearing in the list, a DHCP lease, and a loaded web page. On LT1 open Desktop → PC Wireless → Connect, click Refresh, select `CCNA-Lab`, click Connect and enter `StudyLab-2026!` as the pre-shared key. You can set the same SSID, WPA2-PSK and key in Config → Wireless0 instead. Set Desktop → IP Configuration to DHCP.

Run these in LT1's Command Prompt:

```text
ipconfig
ping 10.0.10.1
ping 10.0.10.20
```

Open `http://10.0.10.20` in LT1's browser. Then find LT1 in the controller's Monitor → Clients list and in `show ip dhcp binding` on R1, and check that the MAC and IP addresses agree. Note the state the controller shows for the client.

:::expected
LT1 has an address in `10.0.10.21–254/24` with gateway `10.0.10.1`. The gateway and WEB1 reply and the page loads. The SSID in the list proved only that the WLAN is advertised. The new lease proved that security completed and DHCP works. The page proved the data path.
:::

```state
{"status":"LT1 reaches WEB1","tone":"ok","focus":["L"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Connect CCNA-Lab · WPA2/AES"}},{"path":["L","A","S","W","S","R"],"back":true,"label":"DHCP lease for LT1","tags":{"A":"CAPWAP tunnel to WLC1","W":"Primary DHCP server 10.0.10.1","R":"Lease in 10.0.10.21–254"}},{"path":["L","A","S","W","S","V"],"back":true,"label":"Ping and page from WEB1","tags":{"A":"CAPWAP tunnel to WLC1","W":"WLAN 2 → management interface","V":"HTTP On · page loads"}}],"chips":[{"node":"L","text":"Not connected yet","until":0},{"node":"L","text":"CCNA-Lab · WPA2/AES","tone":"ok","from":0}],"rows":[["LT1","10.0.10.21–254/24 · gw 10.0.10.1","ok"],["Gateway and WEB1","Ping replies","ok"],["http://10.0.10.20","Page loads","ok"],["Not proven","Internet, DNS, RF","dim"]]}
```

## Step 8: Save the baseline and introduce a wrong key

Save `wlan-security-baseline.pkt`, then save a working copy as `wlan-security-fault.pkt`. Disconnect LT1, edit its saved profile or remove and recreate that profile, and reconnect with `StudyLab-2026` (omit the final exclamation mark). Do not change the controller key.

Before you reconnect, predict which stage will fail and whether the SSID will still be listed. Watch the client's message and the controller's client entry, then try the WEB1 page. Do not restore the key yet.

:::expected
The connection fails at the key exchange, because the four-way handshake cannot complete with a wrong passphrase. The SSID is still listed, and LT1 may still display its old IP address; neither shows that the new attempt succeeded. The WEB1 page does not load.
:::

```state
{"status":"Wrong key on LT1","tone":"bad","focus":["L"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Profile key lacks final !"}},{"path":["L","A"],"label":"WEB1 test","stop":"L","stopText":"Wrong key · secure link fails"}],"chips":[{"node":"L","text":"CCNA-Lab · WPA2/AES","tone":"ok","until":0},{"node":"L","text":"Wrong PSK in profile","tone":"bad","from":0},{"node":"W","text":"Controller key unchanged"}],"rows":[["Saved","Baseline and fault .pkt"],["SSID, old IP","Can still show · not proof","dim"],["WEB1 test","Fails","bad"]]}
```

## Step 9: Restore the key and verify recovery

Disconnect again, replace the saved key with `StudyLab-2026!` and reconnect. Repeated failures can trigger the client exclusion policy you read in Step 6. If the controller lists LT1 as excluded, wait for the exclusion time to pass or remove LT1 from the excluded list.

Repeat the `ipconfig`, ping and WEB1 page checks.

:::expected
LT1 passes the same tests as in Step 7. If it does not, check that the saved profile really changed and that LT1 joined `CCNA-Lab`, not another SSID.
:::

```state
{"status":"Key restored","tone":"ok","focus":["L"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Saved key corrected"}},{"path":["L","A","S","W","S","R"],"back":true,"label":"LT1 pings 10.0.10.1"},{"path":["L","A","S","W","S","V"],"back":true,"label":"Ping and page from WEB1","tags":{"A":"CAPWAP tunnel to WLC1","W":"WLAN 2 → management interface","V":"Page loads"}}],"chips":[{"node":"L","text":"Wrong PSK in profile","tone":"bad","until":0},{"node":"L","text":"CCNA-Lab · WPA2/AES","tone":"ok","from":0}],"rows":[["LT1 profile","Key corrected · CCNA-Lab"],["Current IP","10.0.10.21–254/24","ok"],["Gateway and WEB1","Replies · page loads","ok"],["Exclusion, if shown","Wait or clear this client","dim"]]}
```

## Step 10: Remove the DHCP service after clearing the client's lease

This fault removes the DHCP server, so that a client with the correct key stops at the addressing stage instead. Keep AP1 and WLC1 running. AP1 uses the same DHCP server; its existing lease survives a short outage but not a reboot.

On LT1, release the lease:

```text
ipconfig /release
```

Run `ipconfig` and confirm that LT1 no longer has its `10.0.10.x` address. If your version will not release the lease, skip the live fault and use the supplied observations in Step 11.

Then remove the pool on R1:

```ios R1
R1# configure terminal
R1(config)# no ip dhcp pool WLAN-LAB
R1(config)# end
R1# show ip dhcp pool
```

:::expected
`show ip dhcp pool` no longer lists WLAN-LAB. Nothing about the WLAN's security has changed, and AP1 is still joined on its existing lease.
:::

```state
{"status":"DHCP pool removed","tone":"bad","focus":["L","R"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"ipconfig /release"}},{"event":["R"],"tags":{"R":"no ip dhcp pool WLAN-LAB"}}],"chips":[{"node":"L","text":"Current lease","tone":"ok","until":0},{"node":"L","text":"No usable lease","tone":"warn","from":0},{"node":"R","text":"Pool WLAN-LAB","until":1},{"node":"R","text":"No WLAN-LAB pool","tone":"bad","from":1},{"node":"A","text":"Prior lease can remain"}],"rows":[["LT1 release","Confirmed before removal"],["R1","WLAN-LAB pool absent","bad"],["WLAN security","Not changed"],["AP1, WLC1","Powered · connected"]]}
```

## Step 11: Observe a fresh address request

Predict first: can a correct PSK make up for a missing DHCP server? Then request a new lease on LT1:

```text
ipconfig /renew
ipconfig
```

Switching Desktop → IP Configuration to Static and back to DHCP sends the same request. Look at the controller's client entry and at R1's pools before you decide which stage failed.

:::expected
LT1 gets no lease. It shows no address or a `169.254.x.x` link-local address (chapter 30), and WEB1 is unreachable. The wireless connection itself still succeeds, because the key is correct.

If you could not run the live fault, work from these observations instead: the WPA2 key exchange succeeded; LT1 repeats its DHCP request and receives no offer; R1 has no WLAN-LAB pool. Name the last successful stage and the repair before you open the answer.
:::

:::solution DHCP worksheet
Security succeeded; address allocation did not. Restore the intended pool and request a fresh lease, then retest the known server. Replacing the correct PSK would not restore the absent DHCP service.
:::

```state
{"status":"No DHCP offer","tone":"bad","focus":["L","R"],"flows":[{"path":["L","A","S","W","S","R"],"label":"Fresh DHCP request, repeated","tags":{"A":"CAPWAP tunnel to WLC1","W":"Primary DHCP server 10.0.10.1"},"stop":"R","stopText":"No WLAN-LAB pool · no offer"}],"chips":[{"node":"L","text":"No lease · none or link-local","tone":"bad"},{"node":"R","text":"No WLAN-LAB pool","tone":"bad"}],"rows":[["Security","Can still be complete","ok"],["Fresh DHCP","Repeats · no offer","bad"],["LT1 address","None or link-local","bad"],["Before concluding","Check controller and R1 pool state"]]}
```

## Step 12: Restore DHCP and retest

If you removed the pool, recreate it. The excluded range from Step 2 remains configured.

```ios R1
R1# configure terminal
R1(config)# ip dhcp pool WLAN-LAB
R1(dhcp-config)# network 10.0.10.0 255.255.255.0
R1(dhcp-config)# default-router 10.0.10.1
R1(dhcp-config)# end
R1# show ip dhcp pool WLAN-LAB
```

Run `ipconfig /renew` on LT1 and repeat the gateway and WEB1 tests. If AP1 lost its lease during a long pause, wait for it to get an address and rejoin the controller before you judge the client.

:::expected
LT1 receives a lease again and the page loads. The two faults produced two different pictures: a wrong key stopped the client before it could ask for an address, and a missing DHCP server stopped it after security had passed.
:::

```state
{"status":"DHCP restored","tone":"ok","focus":["R","L"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"ip dhcp pool WLAN-LAB again"}},{"path":["L","A","S","W","S","R"],"back":true,"label":"Fresh DHCP lease","tags":{"R":"Lease in 10.0.10.21–254"}},{"path":["L","A","S","W","S","V"],"back":true,"label":"Ping and page from WEB1","tags":{"V":"Page loads"}}],"chips":[{"node":"R","text":"No WLAN-LAB pool","tone":"bad","until":0},{"node":"R","text":"Pool WLAN-LAB","tone":"ok","from":0},{"node":"L","text":"No lease","tone":"bad","until":2},{"node":"L","text":"Fresh lease","tone":"ok","from":2}],"rows":[["R1 pool","WLAN-LAB · exclusions kept","ok"],["LT1","Fresh lease · gw 10.0.10.1","ok"],["Gateway and WEB1","Replies · page loads","ok"],["DNS server","Not advertised","dim"]]}
```

## Step 13: Translate the configuration to a 9800 worksheet

This step is on paper, because Packet Tracer's controller is not a 9800. Using the 9800 objects from the lesson, sketch how the same WLAN would be built from this specification before you open the answer:

- WLAN profile `CCNA-USERS`, SSID `CCNA-Lab`, ID `2`, WPA2/AES/PSK.
- Enabled policy profile `PP-LAB`, client VLAN `10`, central switching.
- Policy tag `PT-LAB` mapping `CCNA-USERS` to `PP-LAB`.
- The intended AP assigned `PT-LAB`, with appropriate existing site/RF tags and an operational radio.

Name the GUI page for each object, and say what users would see if the AP kept a different policy tag.

:::solution
The pages are Configuration → Tags & Profiles → WLANs, then Policy, then Tags → Policy, and Configuration → Wireless → Access Points for the assignment. An AP advertises only the WLANs in its policy tag, so with a different tag `CCNA-Lab` never appears on that AP. Check the tag before you touch the client's passphrase.
:::

```state
{"status":"9800 worksheet","rows":[["WLAN profile","CCNA-USERS · CCNA-Lab · ID 2"],["Policy profile","PP-LAB · VLAN 10 · central"],["Policy tag","PT-LAB: CCNA-USERS → PP-LAB"],["AP","Assigned PT-LAB · paper only","dim"]]}
```

## Step 14: Save and document the recovered lab

Use Save Configuration on WLC1. Save the IOS devices separately:

```ios R1
R1# copy running-config startup-config
```

Accept the destination filename with Enter. On SW1:

```ios SW1
SW1# copy running-config startup-config
```

Press Enter there too, then save `wlan-security-recovered.pkt`. In your notes, record the final SSID, security settings and interface, LT1's address, and what you saw during each fault and each recovery. In a real support record, leave out the administrator password and the PSK.

:::expected
The baseline file is untouched and the recovered project is saved separately. Your notes mark any step you completed as a worksheet instead of in the simulator.
:::

```state
{"status":"Recovered lab saved","tone":"ok","focus":["R","S","W"],"chips":[{"node":"R","text":"startup-config saved","tone":"ok"},{"node":"S","text":"startup-config saved","tone":"ok"},{"node":"W","text":"Configuration saved","tone":"ok"}],"rows":[["WLC1","Save Configuration","ok"],["R1 and SW1","copy running-config startup-config","ok"],["Project","wlan-security-recovered.pkt","ok"],["Controller reload","Not required","dim"]]}
```

## Troubleshooting

- **Controller page unavailable:** ping `10.0.10.2` from ADMIN. Then check the management address, that management is untagged (`0`) and that Fa0/2's native VLAN is 10. After the setup wizard, use `https://`, not `http://`.
- **AP absent from controller:** check AP1's power, its Ethernet link and its DHCP lease, then allow a minute or two for the join.
- **SSID absent:** check that WLAN 2 is enabled, that Broadcast SSID is on, that AP1 has joined and that the radio policy includes a band LT1 supports. The PSK is not involved yet.
- **Security fails:** compare LT1's SSID, security type and key with the WLAN character by character, and confirm that PSK is ticked and 802.1X is not.
- **Security complete, fresh DHCP fails:** check the WLAN's interface, its Primary DHCP Server and R1's pool. An address LT1 still displays from earlier is not a new lease.
- **Address works but application fails:** test the service itself. WEB1's HTTP service must be On; DNS and Internet access are not part of this topology.

### Evidence to keep

Keep the WLAN's security settings, LT1's `ipconfig` output and page result at baseline and after each recovery, and your observation of each fault. The two faults should point you to different places: the passphrase for the first, the DHCP path for the second.

## Challenge

Save a separate copy. Add a second WLAN without disturbing `CCNA-Lab` or LT1. Use profile `CCNA-SECOND`, SSID `CCNA-Second`, unused ID `3`, WPA2-Personal with AES and the key `Maple-Lab-2026!`. It uses the same flat network and DHCP server as the first WLAN.

Add a second Laptop-PT, LT2, and fit its wireless module as in Step 1. Before you edit anything, list the GUI fields you must set and predict why LT1's saved profile would not join the new WLAN. Create and enable the WLAN, connect LT2 and open WEB1 from both laptops.

Then explain why a second SSID alone does not create an isolated guest network, and sketch the 9800 objects the second WLAN would need.

:::solution
Use WLANs → Create New with profile `CCNA-SECOND`, SSID `CCNA-Second` and the unused ID. Leave it disabled during edits. General maps to `management` for this flat exercise and uses a compatible radio policy. Security selects WPA2/AES, PSK enabled with ASCII `Maple-Lab-2026!`, 802.1X disabled, legacy WPA/TKIP disabled and no Layer 3 WebAuth. Apply the tab changes, enable, and Save Configuration. Leave the original WLAN and its key alone.

On LT2 select `CCNA-Second`, enter the new key and set DHCP. Both laptops should hold different leases in `10.0.10.21–254/24` with gateway `10.0.10.1`, and both should load `http://10.0.10.20`. Retest LT1 after LT2 succeeds. LT1's saved profile names the old SSID and the old key, so it cannot join the new WLAN unchanged.

Both WLANs map to the same interface, so their clients share one subnet and can reach each other. An SSID is only a name. Isolation needs a separate interface and VLAN for the guest WLAN, plus routing or ACL rules for what guests may reach.

On a 9800, create WLAN profile `CCNA-SECOND` with the new SSID and security, map it to an enabled policy profile for VLAN 10, and add that mapping to the AP's policy tag next to the original WLAN's entry.
:::
