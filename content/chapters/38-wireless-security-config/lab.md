---
title: Configure and test a WPA2-Personal WLAN
environment: mixed
devices: ["1 × WLC-3504 where available", "1 × LAP-PT", "1 × 2960 switch", "1 × 2911 router", "1 × PC-PT", "1 × Laptop-PT with compatible wireless module", "1 × Server-PT"]
minutes: 90
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.
The router/switch blocks are supplied preparation; the main skills are selecting WLAN GUI fields and proving current client stages. Build an isolated controller WLAN from a new file, configure its security through the GUI and prove that a wireless client reaches a known server. Then introduce a wrong passphrase and unavailable DHCP as separate faults, preserving evidence before each repair.

This lab deliberately uses one subnet for management and clients, whereas chapter 37 separated them. Start fresh with the addresses below; do not reuse chapter 37's controller interfaces or DHCP pools. The smaller design lets you isolate authentication from DHCP. In a design with separate client VLANs, the same client stages must succeed and the chapter 37 VLAN mapping must also be correct.

:::note Controller and simulator limits
Use the WLC-3504 and LAP-PT when your Packet Tracer version offers them. Record the version and the actual labels in its port picker. This is a legacy AireOS-style exercise, not a Catalyst 9800 emulator. If a required GUI control or AP/client function is unavailable, keep the working wired setup and complete the supplied configuration/status worksheet for that portion, labeled “not simulated.” Do not substitute an autonomous AP and call that completion of a controller GUI lab. WPA3, Enterprise authentication, realistic RF behavior and exact controller states are not assumed to be simulated.
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

Place all seven devices and connect the five wired links. Supply AP1 with its supported external power adapter if the selected model requires one; do not assume the 2960 model provides PoE. On LT1, check for an installed wireless interface. If absent and the model offers WPC300N, power the laptop off, replace its copper module with WPC300N, then power it on. Do not remove or insert modules while powered.

Use Desktop → IP Configuration on ADMIN and WEB1 to enter their static address, `255.255.255.0` mask and gateway. On WEB1 open Services → HTTP and turn HTTP On. This is a disposable local test page with no credentials.

:::expected
ADMIN and WEB1 display the static values in the table. LT1 has a wireless interface/control. AP1 is powered. No successful AP join or wireless client connection is claimed at this stage.
:::

```state
{"status":"Cabled, endpoints ready","addressed":false,"focus":["P","V","L"],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"L","text":"Wireless NIC · not joined"}],"rows":[["ADMIN","10.0.10.10/24 · gw 10.0.10.1"],["WEB1","10.0.10.20/24 · gw 10.0.10.1"],["AP join, wireless client","None claimed yet","dim"]]}
```

## Step 2: Configure the switch, router and DHCP pool

On the switch, configure endpoint access ports first, then override only Fa0/2 for the controller distribution-system trunk. Cisco documents trunk mode for that controller connection even though this lab carries only one native VLAN.

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
Fa0/1 and Fa0/3–5 are access members of VLAN 10. Fa0/2 is a trunk with native VLAN 10 and allowed VLAN 10; it appears operational once the controller link is up. R1 Gi0/0 becomes up/up. ADMIN reaches R1 and WEB1; the local test page loads. Retry an initial ping after ARP resolution if necessary. Do not start the wireless diagnosis while this wired baseline is broken.
:::

```state
{"status":"Wired baseline works","tone":"ok","addressed":false,"wake":["R"],"focus":["S","R"],"flows":[{"path":["P","S","R"],"back":true,"label":"ADMIN pings 10.0.10.1","tags":{"S":"Access VLAN 10 · out Fa0/1","R":"Gi0/0 up/up"}},{"path":["P","S","V"],"back":true,"label":"Ping and page from 10.0.10.20","tags":{"S":"Access VLAN 10 · out Fa0/5","V":"HTTP On · page loads"}}],"chips":[{"node":"S","text":"Fa0/2 trunk · native 10"},{"node":"R","text":"Pool WLAN-LAB"},{"node":"L","text":"Not connected yet"}],"rows":[["Access VLAN 10","Fa0/1 and Fa0/3–5"],["Fa0/2","Trunk · native 10 · allowed 10"],["DHCP pool","WLAN-LAB · .1–.20 excluded"],["ADMIN to R1 and WEB1","Replies · page loads","ok"]]}
```

## Step 3: Initialize controller management

In WLC1's Config → Management page, where provided, enter `10.0.10.2`, mask `255.255.255.0`, gateway `10.0.10.1` and Port 1. Keep management untagged; an AireOS VLAN value of `0` represents this. The controller trunk assigns the untagged traffic to its native VLAN 10.

From ADMIN's browser try `https://10.0.10.2`. A fresh model may expose its day-zero wizard at `http://10.0.10.2` instead; use HTTP only for this isolated simulator bootstrap. Enter the following fields if requested:

| Setup field | Value |
|---|---|
| Controller name | `WLC1` |
| Administrator username/password | `labadmin` / `Admin-Lab-2026!` |
| Management IP/mask/gateway | `10.0.10.2` / `255.255.255.0` / `10.0.10.1` |
| Management VLAN / physical port | Untagged (`0`) / `1` |
| DHCP server for management/WLAN use, if exposed | `10.0.10.1` |
| Required initial employee SSID, if any | `SETUP-LAB` |
| Initial security/passphrase | WPA2-Personal, AES / `Setup-Lab-2026!` |

Apply after checking the fields. If the model restarts, wait for management reachability and reconnect with HTTPS. Record the created WLAN IDs; the exercise below reserves ID 2. If ID 2 is already in use, choose another unused ID and use it consistently in your worksheet.

:::expected
The controller displays the intended management settings and accepts the newly configured administrator account. If the selected model lacks the required setup mechanism, record that limitation and use the supplied fields as a worksheet; do not guess a factory address or claim an operational WLC.
:::

```state
{"status":"Controller management up","tone":"ok","focus":["W"],"flows":[{"path":["P","S","W"],"back":true,"label":"ADMIN browses to 10.0.10.2","tags":{"S":"Untagged out Fa0/2 · native 10","W":"Management · VLAN 0 = untagged"}}],"chips":[{"node":"W","text":"Port 1 · untagged (0)"},{"node":"L","text":"Not connected yet"}],"rows":[["Management","10.0.10.2/24 · gw 10.0.10.1"],["VLAN / port","Untagged (0) / Port 1"],["Admin account","Accepted","ok"],["WLAN IDs","Recorded · ID 2 reserved"]]}
```

## Step 4: Verify the AP and DHCP path

Set AP1's wired management interface to DHCP where that control is exposed. Inspect R1:

```ios R1
R1# show ip dhcp binding
```

Record AP1's actual address and MAC from its interface/status view. On the controller inspect Wireless → Access Points → All APs, or its equivalent AP summary. AP and controller share the same VLAN here, so local discovery is possible without option 43. This does not imply that all real AP/controller combinations are compatible.

In Controller → Interfaces → management, if the model exposes a Primary DHCP Server field, set it to `10.0.10.1`. This is needed for the documented AireOS DHCP-proxy arrangement. Do not set an internal DHCP pool and R1's pool simultaneously for this exercise.

:::expected
AP1 receives an address in `10.0.10.21–254`, but no particular first lease is guaranteed. A separate controller record shows registration where implemented. The selected interface points to the actual DHCP server. Missing simulator controls are recorded as such; a DHCP lease alone is not proof of a completed AP join.
:::

```state
{"status":"AP1 leased, join checked","tone":"ok","focus":["A","W"],"flows":[{"path":["A","S","R"],"back":true,"label":"DHCP lease for AP1","tags":{"R":"Lease in 10.0.10.21–254"}},{"path":["A","S","W"],"back":true,"label":"CAPWAP discovery and join","tags":{"A":"Same VLAN · no option 43","W":"Registers where implemented"}}],"chips":[{"node":"W","text":"Primary DHCP 10.0.10.1"},{"node":"L","text":"Not connected yet"}],"rows":[["AP1 lease","In 10.0.10.21–254 · record it"],["AP1 join","Controller record, where implemented"],["Primary DHCP server","10.0.10.1"],["Lease alone","Not proof of a join","dim"]]}
```

## Step 5: Create the WLAN and configure security while disabled

Before opening the GUI, write four separate decisions: client-visible name, client network, cipher and key-management method. Predict whether this Personal design needs a RADIUS account. Then on the controller open WLANs → Create New → Go. Create profile `CCNA-USERS`, SSID `CCNA-Lab`, WLAN ID `2` (or your recorded unused ID). Leave the WLAN disabled while editing. Configure the following; click Apply where the model requires it to retain a tab's changes.

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

These settings deliberately match WPA2-Personal. They are not obtained simply by selecting a dropdown labeled WPA+WPA2.

:::expected
The stored WLAN is still disabled and its security summary indicates WPA2, PSK and AES/CCMP. It is mapped to the management network only because this is an isolated flat lab. There is no RADIUS requirement, captive portal or MAC filter in this design.
:::

```state
{"status":"WLAN 2 built, disabled","focus":["W"],"chips":[{"node":"W","text":"WLAN 2 · disabled"},{"node":"L","text":"Not connected yet"}],"rows":[["WLAN","ID 2 · CCNA-USERS · SSID CCNA-Lab"],["Layer 2","WPA2 · AES · PSK (ASCII)"],["Off","WPA, TKIP, 802.1X, WebAuth"],["Interface","management · no RADIUS"]]}
```

## Step 6: Inspect policy, enable and save

Read the QoS tab and record the profile and WMM setting that actually appear. For this best-effort data exercise, choose Silver if that AireOS-style option is available; leave WMM Allowed or its compatible enabled policy. Read the Advanced tab and record any session timeout, client exclusion, DHCP-required and P2P settings shown. Mark unavailable controls “not modeled.”

Return to General, enable the WLAN and Apply. Use Save Configuration if available. If a setup WLAN was automatically created, disable that unused WLAN so LT1 cannot accidentally connect to it.

:::expected
The lab WLAN is enabled with WPA2/PSK/AES and the intended interface. An Advanced value is a policy to interpret, not proof of a fault. For example, a displayed `1800`-second timer is 30 minutes, while a displayed 60-second exclusion value does not establish that any client is currently excluded.
:::

```state
{"status":"WLAN 2 enabled, saved","tone":"ok","focus":["W"],"flows":[{"event":["W"],"wait":1.2,"tags":{"W":"Enable · Apply · Save"}}],"chips":[{"node":"W","text":"WLAN 2 · disabled","until":0},{"node":"W","text":"WLAN 2 · enabled","tone":"ok","from":0},{"node":"L","text":"Not connected yet"}],"rows":[["QoS","Silver if offered · WMM allowed"],["Advanced values","Recorded · not faults"],["WLAN 2","Enabled · WPA2/PSK/AES","ok"],["Setup WLAN, if any","Disabled"]]}
```

## Step 7: Join LT1 and prove actual data access

Predict what SSID visibility, a DHCP lease and a loaded web page each establish. On LT1 open Desktop → PC Wireless, refresh the network list, select `CCNA-Lab` and connect with WPA2-Personal/AES and `StudyLab-2026!`. If the model uses Config → Wireless0 instead, set the same SSID, security and key there. Select DHCP in Desktop → IP Configuration.

Run these commands separately in the PC command prompt:

```text
ipconfig
ping 10.0.10.1
ping 10.0.10.20
```

Open `http://10.0.10.20` in LT1's browser. Compare its wireless MAC/IP with the controller's Monitor → Clients entry and R1's DHCP bindings. Record whether the GUI exposes security completion/admitted state, rather than relying only on “Associated.”

:::expected
LT1 has a current `10.0.10.21–254/24` address and gateway `10.0.10.1`. The gateway and WEB1 respond, and the local page loads. Together these observations support a working WLAN data path. They do not prove Internet connectivity, DNS service, RF performance or any destination absent from this topology.
:::

```state
{"status":"LT1 reaches WEB1","tone":"ok","focus":["L"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Connect CCNA-Lab · WPA2/AES"}},{"path":["L","A","S","W","S","R"],"back":true,"label":"DHCP lease for LT1","tags":{"A":"CAPWAP tunnel to WLC1","W":"Primary DHCP server 10.0.10.1","R":"Lease in 10.0.10.21–254"}},{"path":["L","A","S","W","S","V"],"back":true,"label":"Ping and page from WEB1","tags":{"A":"CAPWAP tunnel to WLC1","W":"WLAN 2 → management interface","V":"HTTP On · page loads"}}],"chips":[{"node":"L","text":"Not connected yet","until":0},{"node":"L","text":"CCNA-Lab · WPA2/AES","tone":"ok","from":0}],"rows":[["LT1","10.0.10.21–254/24 · gw 10.0.10.1","ok"],["Gateway and WEB1","Ping replies","ok"],["http://10.0.10.20","Page loads","ok"],["Not proven","Internet, DNS, RF","dim"]]}
```

## Step 8: Save the baseline and introduce a wrong key

Save `wlan-security-baseline.pkt`, then save a working copy as `wlan-security-fault.pkt`. Disconnect LT1, edit its saved profile or remove and recreate that profile, and reconnect with `StudyLab-2026` (omit the final exclamation mark). Do not change the controller key.

Before retrying, predict whether the visible SSID or a retained old address establishes new security completion. Observe the client message and current controller state, then attempt the WEB1 test. Do not restore the key yet.

:::expected
With the new incorrect key actually in use, the secure data connection fails. The SSID can still be visible, and an old IP address can remain displayed. Neither proves the new key exchange succeeded. A popup alone does not prove which handshake message failed; record only the evidence your simulator exposes.
:::

```state
{"status":"Wrong key on LT1","tone":"bad","focus":["L"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Profile key lacks final !"}},{"path":["L","A"],"label":"WEB1 test","stop":"L","stopText":"Wrong key · secure link fails"}],"chips":[{"node":"L","text":"CCNA-Lab · WPA2/AES","tone":"ok","until":0},{"node":"L","text":"Wrong PSK in profile","tone":"bad","from":0},{"node":"W","text":"Controller key unchanged"}],"rows":[["Saved","Baseline and fault .pkt"],["SSID, old IP","Can still show · not proof","dim"],["WEB1 test","Fails","bad"]]}
```

## Step 9: Restore the key and verify recovery

Disconnect again and replace the saved key with `StudyLab-2026!`. Reconnect. If the controller explicitly shows this client excluded, wait for its displayed remaining interval or clear only the lab client's exclusion using the supported GUI action. Do not assume a universal timeout.

Repeat the current IP, ping and WEB1 page checks.

:::expected
The client again passes the same baseline tests. If not, verify that its saved profile actually changed and that it chose `CCNA-Lab` rather than a different SSID. A repaired field alone is not the final proof.
:::

```state
{"status":"Key restored","tone":"ok","focus":["L"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"Saved key corrected"}},{"path":["L","A","S","W","S","R"],"back":true,"label":"LT1 pings 10.0.10.1"},{"path":["L","A","S","W","S","V"],"back":true,"label":"Ping and page from WEB1","tags":{"A":"CAPWAP tunnel to WLC1","W":"WLAN 2 → management interface","V":"Page loads"}}],"chips":[{"node":"L","text":"Wrong PSK in profile","tone":"bad","until":0},{"node":"L","text":"CCNA-Lab · WPA2/AES","tone":"ok","from":0}],"rows":[["LT1 profile","Key corrected · CCNA-Lab"],["Current IP","10.0.10.21–254/24","ok"],["Gateway and WEB1","Replies · page loads","ok"],["Exclusion, if shown","Wait or clear this client","dim"]]}
```

## Step 10: Remove the DHCP service after clearing the client's lease

Keep AP1 and WLC1 powered and connected. This short fault is for a fresh client address request; do not reboot the AP while its DHCP server is temporarily absent.

On LT1, try:

```text
ipconfig /release
```

Confirm LT1 no longer has its usable DHCP address. If that operation is unsupported or the simulator retains a usable lease that you cannot release through its IP Configuration controls, stop the live DHCP fault and use the worksheet in Step 11. A reconnect by itself does not guarantee a fresh lease.

Only after confirming the release, remove the lab pool on R1:

```ios R1
R1# configure terminal
R1(config)# no ip dhcp pool WLAN-LAB
R1(config)# end
R1# show ip dhcp pool
```

:::expected
The WLAN-LAB pool is absent, while the wireless security settings and AP's existing management connection have not been deliberately changed. A prior AP lease can remain valid during this brief fault. Record whether the prerequisites for the live test were actually met.
:::

```state
{"status":"DHCP pool removed","tone":"bad","focus":["L","R"],"flows":[{"event":["L"],"wait":1.2,"tags":{"L":"ipconfig /release"}},{"event":["R"],"tags":{"R":"no ip dhcp pool WLAN-LAB"}}],"chips":[{"node":"L","text":"Current lease","tone":"ok","until":0},{"node":"L","text":"No usable lease","tone":"warn","from":0},{"node":"R","text":"Pool WLAN-LAB","until":1},{"node":"R","text":"No WLAN-LAB pool","tone":"bad","from":1},{"node":"A","text":"Prior lease can remain"}],"rows":[["LT1 release","Confirmed before removal"],["R1","WLAN-LAB pool absent","bad"],["WLAN security","Not changed"],["AP1, WLC1","Powered · connected"]]}
```

## Step 11: Observe a fresh address request

If Step 10's live prerequisites were met, request a new client lease:

```text
ipconfig /renew
ipconfig
```

Before the request, predict whether a correct PSK can compensate for an absent address server. Alternatively use the supported DHCP request control in LT1's IP Configuration page. Check the controller's security/admission/addressing information and R1's pool state before drawing a conclusion.

:::expected
With no available DHCP server in this isolated topology, a fresh DHCP attempt cannot obtain the intended lease. The client may show no address or a link-local address, depending on the model. Security may still be complete even though the client cannot reach WEB1.

If the live fault could not be performed, use these supplied observations: current WPA2 key establishment succeeded; a fresh client request repeats without any DHCP offer; R1 has no WLAN-LAB pool. State the last successful stage and narrow repair before opening the answer below. These are authored observations, not a claimed capture.
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

Request DHCP again on LT1, inspect its current configuration and repeat the gateway/WEB1 tests. If AP1's management lease was affected during a long pause, restore its DHCP connectivity and registration before judging the client result.

:::expected
A valid client lease returns and the local page loads. The pool does not advertise an unconfigured DNS server. If the fault was worksheet-only, describe this repair and its required verification without claiming to have observed it.
:::

```state
{"status":"DHCP restored","tone":"ok","focus":["R","L"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"ip dhcp pool WLAN-LAB again"}},{"path":["L","A","S","W","S","R"],"back":true,"label":"Fresh DHCP lease","tags":{"R":"Lease in 10.0.10.21–254"}},{"path":["L","A","S","W","S","V"],"back":true,"label":"Ping and page from WEB1","tags":{"V":"Page loads"}}],"chips":[{"node":"R","text":"No WLAN-LAB pool","tone":"bad","until":0},{"node":"R","text":"Pool WLAN-LAB","tone":"ok","from":0},{"node":"L","text":"No lease","tone":"bad","until":2},{"node":"L","text":"Fresh lease","tone":"ok","from":2}],"rows":[["R1 pool","WLAN-LAB · exclusions kept","ok"],["LT1","Fresh lease · gw 10.0.10.1","ok"],["Gateway and WEB1","Replies · page loads","ok"],["DNS server","Not advertised","dim"]]}
```

## Step 13: Translate the configuration to a 9800 worksheet

Do not paste IOS XE commands into the Packet Tracer controller. For an already commissioned Catalyst 9800, use this supplied specification to sketch the equivalent object relationships before opening the answer:

- WLAN profile `CCNA-USERS`, SSID `CCNA-Lab`, ID `2`, WPA2/AES/PSK.
- Enabled policy profile `PP-LAB`, client VLAN `10`, central switching.
- Policy tag `PT-LAB` mapping `CCNA-USERS` to `PP-LAB`.
- The intended AP assigned `PT-LAB`, with appropriate existing site/RF tags and an operational radio.

Identify the current GUI pages that hold these objects and explain the symptom if the AP retains a different policy tag.

:::solution
Use Configuration → Tags & Profiles → WLANs; Policy; Tags → Policy; then Configuration → Wireless → Access Points for assignment. A correct WLAN and policy profile do not reach an AP unless its effective policy tag maps them. Verify the mapping and WLAN/radio states before changing the client password. This is a documented translation, not a 9800 deployment executed in Packet Tracer.
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

Accept the prompt there, then save `wlan-security-recovered.pkt`. Record the model/version, any unavailable GUI fields, final SSID/security/interface, client IP evidence, both fault observations and both recovery checks. Do not publish the administrative password or PSK in a real support record.

:::expected
The working baseline remains intact, and the recovered project is separately saved. Your notes clearly distinguish completed simulator actions from worksheet-only procedures. No controller reload is required for this verification.
:::

```state
{"status":"Recovered lab saved","tone":"ok","focus":["R","S","W"],"chips":[{"node":"R","text":"startup-config saved","tone":"ok"},{"node":"S","text":"startup-config saved","tone":"ok"},{"node":"W","text":"Configuration saved","tone":"ok"}],"rows":[["WLC1","Save Configuration","ok"],["R1 and SW1","copy running-config startup-config","ok"],["Project","wlan-security-recovered.pkt","ok"],["Controller reload","Not required","dim"]]}
```

## Troubleshooting

- **Controller page unavailable:** first test the wired management path, address and controller-untagged/switch-native VLAN agreement; then check the displayed setup/HTTPS state. A failed ping alone does not establish that its web server is down.
- **AP absent from controller:** check power, Ethernet, AP addressing, discovery, software compatibility and exposed join errors. Same-subnet placement simplifies discovery; it does not guarantee compatibility.
- **SSID absent:** inspect AP/radio operation, enabled WLAN, compatible band and assignment. Do not start by changing the PSK.
- **Security fails:** compare exact saved profile, cipher, AKM, PMF support and controller diagnostics. Do not infer “RF is fine” from SSID visibility alone.
- **Security complete, fresh DHCP fails:** inspect interface mapping, actual server availability and any trunk/relay path. A stale displayed address is not a new lease.
- **Address works but application fails:** test the actual destination/service. Here WEB1's HTTP service must be On; DNS and Internet were never part of the topology.

### Evidence to keep

Record model/version and actual GUI fields; distinguish configured security from the client's current negotiated/admitted state. Keep baseline and recovered HTTP results, the wrong-key observation, a genuinely fresh DHCP-failure observation or clearly labeled worksheet, and matching controller/client/DHCP identities. The two faults should lead to different next investigations.

## Challenge

Save a separate copy. Add a second WLAN while preserving `CCNA-Lab` and LT1's service. Use profile `CCNA-SECOND`, client-visible SSID `CCNA-Second`, unused ID `3` (or a documented unused value), WPA2-Personal/AES and new lab key `Maple-Lab-2026!`. It uses the same flat network and real DHCP server as the original; no RADIUS, WebAuth, client isolation or separate guest VLAN is requested.

Add a second Laptop-PT, LT2. Prepare its compatible wireless module as in Step 1. Before editing, list the required GUI fields and predict why copying LT1's complete saved profile unchanged will not join the new WLAN. Create and enable the new WLAN, connect LT2 with its own correct profile, request a fresh address and open WEB1. Keep LT1 on the original SSID and prove both page results afterward. If the simulator lacks a second-WLAN/client feature, submit the full object/field plan and required observations, labeled unexecuted.

Explain why a different SSID alone does not create an isolated guest network. Then provide a separate 9800 object map for the second WLAN without pasting its commands into the simulator.

:::solution
Use WLANs → Create New with profile `CCNA-SECOND`, SSID `CCNA-Second` and the unused ID. Leave it disabled during edits. General maps to `management` for this flat exercise and uses a compatible radio policy. Security selects WPA2/AES, PSK enabled with ASCII `Maple-Lab-2026!`, 802.1X disabled, legacy WPA/TKIP disabled and no Layer 3 WebAuth. Apply the tab changes, enable, and Save Configuration. Preserve the original WLAN and its existing key.

On LT2 select the new client-visible SSID, WPA2-Personal/AES and the new key; request DHCP. Both clients should have distinct current `10.0.10.21–254/24` leases with gateway `10.0.10.1`. Check their actual MAC/IP identities, secure connections, gateway reachability and `http://10.0.10.20`. Retest LT1 after LT2 succeeds. An unchanged LT1 profile selects the old SSID and key, not the new one; a retained lease is not proof that LT2 joined successfully.

Both WLANs enter the same flat network. An SSID name alone adds no VLAN, routing boundary or isolation policy. If isolation were required, the design would need an explicit separate client policy/VLAN and permitted service paths, not merely a new name.

For an already commissioned 9800, create WLAN profile `CCNA-SECOND` with the new SSID/security, map it to a suitable enabled policy profile for VLAN 10 and central switching, and include that mapping in the intended AP's effective policy tag alongside the original WLAN. Verify both assignments, radios and fresh client service. The relationship is a worksheet translation, not a 9800 execution claim.
:::
