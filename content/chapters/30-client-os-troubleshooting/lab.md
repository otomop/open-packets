---
title: Isolate client address, gateway, DNS and wireless faults
environment: mixed
devices: [R1, SW1, PC-A, PC-B, Server-A, WRT1, Laptop]
minutes: 105
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Work from a small test matrix: **active adapter/parameters → local peer → gateway → remote numeric destination → fresh DNS answer → application**. Write a prediction before each controlled fault, retain its actual observations, and repair it in a later step. A familiar symptom suggests a test; it does not prove the cause.

Use Packet Tracer for deliberate changes. Inspect **one actual OS you have**, then interpret the supplied evidence for the others; three OS installations are not required. The wireless module is optional where the simulator lacks a working supported AP/client combination, but its evidence worksheet still needs an answer. None of the output here is presented as an executed simulator capture.

## Topology

```diagram
{"type":"topology","title":"Lab 30 — A client LAN, a routed PC and optional Wi-Fi","caption":"PC-A uses DHCP, Server-A and PC-B are static, and the optional WRT1 has its DHCP service disabled.","nodes":[{"id":"PCA","kind":"pc","label":"PC-A","sub":"DHCP","x":1,"y":1},{"id":"SRV","kind":"server","label":"Server-A","sub":"192.168.40.20/24 · GW 192.168.40.1","x":1,"y":5},{"id":"SW1","kind":"switch","label":"SW1","x":4,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"192.168.40.1/24 · 192.168.50.1/24","x":8,"y":3},{"id":"PCB","kind":"pc","label":"PC-B","sub":"192.168.50.10/24 · GW 192.168.50.1","x":11,"y":3},{"id":"WRT1","kind":"ap","label":"WRT1","sub":"LAN 192.168.40.2/24 · DHCP disabled","x":6,"y":5},{"id":"LAP","kind":"laptop","label":"Laptop","x":10,"y":5}],"links":[{"from":"PCA","to":"SW1","fromLabel":"Fa0","toLabel":"Fa0/1"},{"from":"SRV","to":"SW1","fromLabel":"Fa0","toLabel":"Fa0/2"},{"from":"R1","to":"SW1","fromLabel":"Gi0/0","toLabel":"Fa0/3"},{"from":"R1","to":"PCB","fromLabel":"Gi0/1","toLabel":"Fa0"},{"from":"WRT1","to":"SW1","fromLabel":"Ethernet 1","toLabel":"Fa0/4"},{"from":"WRT1","to":"LAP","style":"wireless"}]}
```

Build a new isolated Packet Tracer project. Use an ISR 2911 R1, a 2960 SW1, two PC-PT endpoints and Server-PT. The optional wireless extension uses WRT300N and a Laptop-PT with a compatible wireless adapter.

| Connection | Cable | Address / gateway |
|---|---|---|
| PC-A Fa0 — SW1 Fa0/1 | Copper straight-through | DHCP |
| Server-A Fa0 — SW1 Fa0/2 | Copper straight-through | 192.168.40.20/24, GW 192.168.40.1 |
| R1 Gi0/0 — SW1 Fa0/3 | Copper straight-through | R1 192.168.40.1/24 |
| R1 Gi0/1 — PC-B Fa0 | Copper crossover | R1 192.168.50.1/24; PC-B 192.168.50.10/24, GW 192.168.50.1 |
| Optional WRT1 Ethernet 1 — SW1 Fa0/4 | Copper straight-through | WRT1 LAN 192.168.40.2/24; its DHCP service disabled |

Server-A provides DHCP, DNS and HTTP. Its DHCP range is **192.168.40.100–149**, safely excluding the router, wireless device and static server. There is no Internet connection. R1 needs only its connected routes.

These are documented, reviewed procedures with expected results, not a record of an executed Packet Tracer run. Packet Tracer's PC shell and wireless controls differ by version. Use its IP Configuration GUI if a PC command is absent, and record unsupported observations honestly. The final OS inspection is read-only on a real Windows, Mac or Linux machine; all deliberate faults stay in the isolated simulator.

## Step 1 — Configure router and static endpoints

Set Server-A and PC-B in Desktop → IP Configuration → Static from the topology table, mask `255.255.255.0`. Server-A's DNS field is `192.168.40.20`; PC-B's is also `192.168.40.20`.

On a new router, decline the setup dialog if presented:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 192.168.40.1 255.255.255.0
R1(config-if)# no ip proxy-arp
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 192.168.50.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show ip route connected
```

:::expected
Both router interfaces become up/up and both /24 networks are connected. Proxy ARP is explicitly disabled on Gi0/0 so the later mask error will not be concealed by the router answering for a remote host. If the filtered route command is unavailable, use `show ip route` and identify the connected routes. If `no ip proxy-arp` is rejected or its state cannot be verified, complete the wrong-mask steps as an address-decision worksheet: predict the on-link ARP request and explain why proxy ARP could conceal the fault. Do not record the predicted timeout as an observed result. The DNS, gateway and wireless exercises can still proceed.
:::

```state
{"status":"R1 and static hosts set","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB"],"cabled":true,"led":true,"focus":["R1","SRV","PCB"],"chips":[{"node":"R1","text":"no ip proxy-arp · Gi0/0"}],"rows":[["R1 Gi0/0 and Gi0/1","up/up · two connected /24s","ok"],["Proxy ARP","Disabled on Gi0/0"],["Server-A and PC-B DNS","192.168.40.20"]]}
```

## Step 2 — Configure DHCP, DNS and HTTP explicitly

On Server-A → Services:

1. **DHCP:** turn the service On. Create a pool named `CLIENTS` with default gateway `192.168.40.1`, DNS `192.168.40.20`, starting address `192.168.40.100`, mask `255.255.255.0` and maximum users `50`. Add/save the pool. Remove or correct any default pool that could serve this same interface with conflicting values.
2. **DNS:** turn the service On. Add A records `lab.example` and `fresh.example`, each resolving to `192.168.40.20`.
3. **HTTP:** explicitly turn HTTP On. The default page is adequate; its content is not part of the diagnosis.

On PC-A → Desktop → IP Configuration, select DHCP.

:::expected
PC-A receives an address in .100–.149, /24 mask, gateway .40.1 and DNS .40.20. Do not assume which exact address it receives. If the fields are wrong, fix the server pool before continuing; the static server at .20 is outside the lease range.
:::

```state
{"status":"PC-A leased from Server-A","tone":"ok","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["SRV","PCA"],"flows":[{"path":["PCA","SW1",["SRV","R1"]],"label":"PC-A asks for a lease","tags":{"PCA":"DHCP selected · broadcast","SW1":"Broadcast · flooded"}},{"path":["SRV","SW1","PCA"],"tone":"reply","label":"Server-A leases from CLIENTS","tags":{"SRV":"Pool CLIENTS · .100–.149","PCA":"/24 · GW .40.1 · DNS .40.20"}}],"chips":[{"node":"SRV","text":"DHCP · DNS · HTTP On","tone":"ok"}],"rows":[["PC-A address","In .100–.149 · /24","ok"],["Gateway · DNS","192.168.40.1 · 192.168.40.20","ok"],["A records","lab.example, fresh.example → .40.20"]]}
```

## Step 3 — Record a known working baseline

Before testing, make a six-row worksheet for the active adapter/parameters, local server, gateway, remote PC, fresh DNS and web service. Write what each test exercises; a local HTTP page cannot establish routed connectivity. On PC-A inspect its actual address with `ipconfig` or the GUI. Then use its command prompt:

```text
ping 192.168.40.20
ping 192.168.40.1
ping 192.168.50.10
nslookup lab.example
```

Open Desktop → Web Browser and visit `http://192.168.40.20`, then `http://lab.example`. If `nslookup` is absent, record that limitation and use the DNS request/response in Simulation mode as the query observation.

:::expected
After any initial ARP delay, local server, gateway and remote PC respond. The query resolves lab.example to .40.20 and both browser tests show the server page. The remote PC ping exercises routing; browsing the local server alone does not. Save `clients-baseline.pkt` and continue in `clients-faults.pkt`.
:::

```state
{"status":"Baseline recorded","tone":"ok","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["PCA"],"flows":[{"path":["PCA","SW1","SRV"],"back":true,"label":"Ping 192.168.40.20","tags":{"PCA":"On-link /24 · deliver directly"}},{"path":["PCA","SW1","R1"],"back":true,"label":"Ping 192.168.40.1"},{"path":["PCA","SW1","R1","PCB"],"back":true,"label":"Ping 192.168.50.10","tags":{"PCA":"Off-link · to gateway .40.1","R1":"Connected .50.0/24 · out Gi0/1"}},{"path":["PCA","SW1","SRV"],"back":true,"label":"nslookup lab.example","tags":{"SRV":"lab.example → 192.168.40.20"}},{"path":["PCA","SW1","SRV"],"back":true,"label":"Browse http://lab.example","tags":{"SRV":"HTTP · server page"}}],"rows":[["Server, gateway, PC-B","All reply","ok"],["lab.example","192.168.40.20","ok"],["Web by address and name","Server page","ok"],["Saved","clients-baseline.pkt"]]}
```

## Step 4 — Introduce only a DNS-selection fault

Predict which worksheet rows should change when only the DNS selection changes. Write down PC-A's leased address. Change PC-A to Static, retaining that exact address, /24 mask and gateway .40.1, but change DNS to unused `192.168.40.99`. No other device uses .99 in this topology.

Repeat numeric pings and try `nslookup fresh.example`. Read which DNS server the query uses; do not rely solely on a previously cached browser result.

:::solution
Numeric local and routed tests should still work. The DNS request to .99 has no configured server to answer it. Cached lab.example data might still work in an application, so it is not a reliable test of the new resolver setting. The demonstration identifies the wrong configured resolver by comparison with the known server address.
:::

```state
{"status":"DNS set to unused .99","tone":"bad","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["PCA"],"chips":[{"node":"PCA","text":"Static · DNS 192.168.40.99","tone":"bad"}],"rows":[["PC-A","Static · same address, /24, GW .40.1"],["DNS server field","192.168.40.99 · unused","bad"],["Tests","Numeric pings · nslookup fresh.example"]]}
```

## Step 5 — Restore DNS and verify its response

Keep the same static address, mask and gateway, and restore DNS to `192.168.40.20`. Repeat `nslookup fresh.example` or inspect the DNS exchange in Simulation mode, then open `http://fresh.example`.

:::expected
The configured resolver is .40.20 and returns .40.20 for the name. The page opens. Record this recovery before creating the next fault.
:::

```state
{"status":"DNS restored","tone":"ok","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["PCA","SRV"],"flows":[{"path":["PCA","SW1","SRV"],"back":true,"label":"nslookup fresh.example","tags":{"PCA":"Resolver 192.168.40.20","SRV":"fresh.example → 192.168.40.20"}},{"path":["PCA","SW1","SRV"],"back":true,"label":"Browse http://fresh.example","tags":{"SRV":"HTTP · server page"}}],"chips":[{"node":"PCA","text":"Static · DNS 192.168.40.20","tone":"ok"}],"rows":[["Resolver","192.168.40.20","ok"],["fresh.example","192.168.40.20","ok"],["http://fresh.example","Page opens","ok"]]}
```

## Step 6 — Introduce only a gateway fault

Predict local delivery, remote delivery and the local DNS query separately. In PC-A's static IP settings, change gateway to unused `192.168.40.254`. Keep its address, /24 mask and correct local DNS. Test:

```text
ping 192.168.40.20
ping 192.168.50.10
arp -a
```

If the neighbor command is absent, watch ARP in Simulation mode.

:::solution
The local server remains reachable; the intended remote PC should fail because the configured next hop is unused. Observe the attempted resolution for .40.254 where the simulator exposes it. A local DNS server can still answer, so this fault need not make every name lookup fail. Exact ping error wording is platform-dependent.
:::

```state
{"status":"Gateway set to unused .254","tone":"bad","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["PCA"],"chips":[{"node":"PCA","text":"GW 192.168.40.254","tone":"bad"}],"rows":[["Gateway field","192.168.40.254 · unused","bad"],["Kept","Address, /24 mask, DNS .40.20"],["Tests","Ping .40.20 and .50.10 · arp -a"]]}
```

## Step 7 — Restore the gateway

Return PC-A's gateway to `192.168.40.1` without changing its other values. Repeat the local and remote pings.

:::expected
Both tests work after necessary address resolution. Successful recovery agrees with the demonstrated wrong next hop. Keep the known configuration rather than making unrelated DNS or router changes.
:::

```state
{"status":"Gateway restored","tone":"ok","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["PCA"],"flows":[{"path":["PCA","SW1","SRV"],"back":true,"label":"Ping 192.168.40.20"},{"path":["PCA","SW1","R1","PCB"],"back":true,"label":"Ping 192.168.50.10","tags":{"PCA":"Off-link · to gateway .40.1","R1":"Connected .50.0/24 · out Gi0/1"}}],"chips":[{"node":"PCA","text":"GW 192.168.40.1","tone":"ok"}],"rows":[["Gateway","192.168.40.1","ok"],["Local and remote pings","Work","ok"],["DNS and R1","Unchanged"]]}
```

## Step 8 — Introduce only a subnet-mask fault

Before testing, compute whether .40.20 and .50.10 appear on-link under the new mask, and name the ARP target for .50.10. Change PC-A's mask to `255.255.0.0`. Retain its address, gateway and DNS. Test the local server and remote `192.168.50.10`. In Simulation mode, filter ARP/ICMP, clear the event list, send a new PC-A-to-PC-B simple PDU and inspect PC-A's decision. Do not interpret an old event as a new test.

:::solution
The local .40.20 server remains within the client's perceived /16. The client incorrectly treats .50.10 as on-link and tries to resolve it directly. With proxy ARP disabled on R1 Gi0/0, that remote endpoint is not resolved on this LAN. The failure concerns the mask's local/remote decision, even though the displayed gateway value is correct.
:::

```state
{"status":"Mask changed to /16","tone":"bad","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["PCA"],"chips":[{"node":"PCA","text":"Mask 255.255.0.0","tone":"bad"}],"rows":[["PC-A mask","255.255.0.0","bad"],["Kept","Address, GW .40.1, DNS .40.20"],["Tests","Ping .40.20 and 192.168.50.10"]]}
```

## Step 9 — Restore the mask and repeat the same destination test

Return PC-A's mask to `255.255.255.0`. Repeat the remote ping and inspect a new simulation event if available.

:::expected
PC-A now recognizes .50.10 as outside its /24 and sends toward .40.1. The remote ping succeeds. Save a separate checkpoint `clients-recovered.pkt`.
:::

```state
{"status":"Mask restored","tone":"ok","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["PCA"],"flows":[{"path":["PCA","SW1","R1","PCB"],"back":true,"label":"Ping 192.168.50.10","tags":{"PCA":".50.10 outside /24 · to .40.1","R1":"Connected .50.0/24 · out Gi0/1"}}],"chips":[{"node":"PCA","text":"Mask 255.255.255.0","tone":"ok"}],"rows":[["Mask","255.255.255.0","ok"],["PC-B .50.10","Via 192.168.40.1 · replies","ok"],["Saved","clients-recovered.pkt"]]}
```

## Step 10 — Observe a DHCP acquisition failure

Predict why leaving a still-valid lease in place would be a poor test of fresh DHCP acquisition. First return PC-A to DHCP and verify it again receives the correct settings. Turn **Server-A's DHCP service Off**, leaving DNS and HTTP On. On this isolated PC-A only, discard the existing lease and request another:

```text
ipconfig /release
ipconfig /renew
```

If those commands are unsupported, toggle PC-A's IP Configuration to Static, then back to DHCP after the server is Off. In Simulation mode, observe the client's DHCP attempts.

:::solution
PC-A cannot acquire a new lease from the disabled server. Depending on simulator timing, it may report a failed request, show no usable IPv4 configuration or display an autoconfiguration address. Record the actual result; do not require an invented exact APIPA address. The absence of a lease alone would not prove which DHCP message failed, but this controlled service-off change supplies the known cause.
:::

```state
{"status":"Server-A DHCP Off","tone":"bad","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["SRV","PCA"],"chips":[{"node":"SRV","text":"DHCP Off · DNS, HTTP On","tone":"bad"}],"rows":[["PC-A before the test","DHCP · correct settings","ok"],["Server-A DHCP","Off","bad"],["DNS and HTTP","Still On"],["PC-A","Lease released · new one requested"]]}
```

## Step 11 — Restore DHCP without changing unrelated services

Turn Server-A's DHCP service On. Confirm the CLIENTS pool still contains .100–.149, gateway .40.1 and DNS .40.20. Renew on PC-A or click DHCP in its GUI. Repeat the baseline tests after a valid lease appears.

:::expected
The client again obtains intended settings, resolves lab.example and reaches PC-B. The numeric address may differ from its earlier lease. Server-A's static .20 address has not entered the pool, and DNS/HTTP did not need restarting.
:::

```state
{"status":"DHCP restored","tone":"ok","absent":["WRT1","LAP"],"addressed":["R1","SRV","PCB","PCA"],"focus":["SRV","PCA"],"flows":[{"path":["PCA","SW1",["SRV","R1"]],"label":"PC-A requests a lease","tags":{"PCA":"Request a lease · broadcast"}},{"path":["SRV","SW1","PCA"],"tone":"reply","label":"Lease from CLIENTS","tags":{"SRV":"Pool CLIENTS · .100–.149","PCA":"GW .40.1 · DNS .40.20"}},{"path":["PCA","SW1","SRV"],"back":true,"label":"nslookup lab.example","tags":{"SRV":"lab.example → 192.168.40.20"}},{"path":["PCA","SW1","R1","PCB"],"back":true,"label":"Ping 192.168.50.10"}],"chips":[{"node":"SRV","text":"DHCP · DNS · HTTP On","tone":"ok"}],"rows":[["PC-A lease","In .100–.149 · may differ","ok"],["lab.example, PC-B","Resolves · reachable","ok"],["DNS and HTTP","Not restarted"]]}
```

## Step 12 — Build the optional wireless client path

Add a WRT300N named WRT1. Connect **Ethernet 1, a LAN port**, to SW1 Fa0/4; leave its Internet/WAN port disconnected. Through WRT1's GUI:

- Set Local IP Address to `192.168.40.2` with mask `255.255.255.0`.
- Disable its DHCP server; Server-A remains the only intended DHCP server.
- Set the SSID to `CCNA-LAB`.
- Set wireless security to **WPA2-Personal**, encryption **AES**, and fictional lab passphrase `StudyNet2026!`.
- Save each relevant page. If changing the LAN address interrupts a management page, reopen the GUI at the new address.

For Laptop-PT, use an available compatible wireless module. If the model lacks one, open Physical, power it off, replace its removable Ethernet module with the listed WPC300N wireless module where supported, then power it on. In Desktop → PC Wireless, select/connect to CCNA-LAB with matching WPA2-Personal/AES settings and the lab passphrase. In IP Configuration, select DHCP for the wireless interface.

:::expected
The laptop joins the intended WLAN and obtains a .100–.149 address from Server-A, gateway .40.1 and DNS .40.20. Test its local server and PC-B, then browse lab.example. An address in the WRT's former default subnet means its DHCP service or cabling is wrong. If the installed version lacks the named model/security controls, use an available equivalent documented WPA2-Personal AP or use the supplied evidence in Step 13. Complete the real-OS inspection in Step 15 and record simulated wireless execution as unperformed.
:::

```state
{"status":"Laptop on CCNA-LAB","tone":"ok","focus":["WRT1","LAP"],"flows":[{"path":["LAP","WRT1","SW1",["PCA","SRV","R1"]],"label":"Laptop asks for a lease","tags":{"LAP":"Joined CCNA-LAB · DHCP","WRT1":"Bridges to SW1 · own DHCP off"}},{"path":["SRV","SW1","WRT1","LAP"],"tone":"reply","label":"Lease from Server-A","tags":{"SRV":"Pool CLIENTS · .100–.149","LAP":"GW .40.1 · DNS .40.20"}},{"path":["LAP","WRT1","SW1","R1","PCB"],"back":true,"label":"Ping 192.168.50.10","tags":{"LAP":"Off-link · to gateway .40.1"}}],"chips":[{"node":"WRT1","text":"CCNA-LAB · WPA2-Personal/AES"}],"rows":[["WRT1","192.168.40.2/24 · DHCP disabled"],["Laptop lease","From Server-A · .100–.149","ok"],["Tests","Server, PC-B, lab.example","ok"]]}
```

## Step 13 — Observe a wireless credential fault

Predict whether a retained IP address alone can demonstrate a successful new protected connection. On the simulated laptop, disconnect from CCNA-LAB and change only its saved profile passphrase to `WrongStudyKey!`. Reconnect with that profile. Do not change the AP, DHCP pool or router.

If this simulator path is unavailable, use this **authored evidence worksheet** instead: an earlier successful connection leased .40.120; after the client profile edit a fresh connection reports key-exchange failure; that old address remains displayed; a wired control client still opens the lab web page; the approved credential comparison confirms the edited value differs. Identify which observation describes the current failure, what the retained address does not prove, and what must be retested after the correction.

:::solution
The client should fail to establish usable protected access with the mismatched key. UI wording and whether an old IP address remains displayed vary. An old lease is not proof of a currently functioning wireless data path. Compare the failed new connection attempt and intended security settings instead of asserting a particular DHCP packet sequence without observing it.
:::

```state
{"status":"Laptop key mismatched","tone":"bad","focus":["LAP"],"chips":[{"node":"LAP","text":"Profile key WrongStudyKey!","tone":"bad"},{"node":"WRT1","text":"CCNA-LAB · WPA2-Personal/AES"}],"rows":[["AP, DHCP pool, router","Unchanged"],["Laptop profile","Only the passphrase changed","bad"],["Test","Reconnect with the edited profile"]]}
```

## Step 14 — Repair wireless access and save the complete lab

Correct the laptop's profile to `StudyNet2026!`, reconnect and request DHCP if needed. Retest the server, remote PC and name-based page. Confirm PC-A is also using correct DHCP settings. Save `clients-complete.pkt`. Save R1 separately:

```ios R1
R1# copy running-config startup-config
```

Complete the destination prompt with Enter.

:::expected
Both clients have intended addresses and can use the lab services. WRT1's DHCP service remains disabled, its LAN port provides the bridge to SW1, and every introduced fault is repaired.
:::

```state
{"status":"All faults repaired","tone":"ok","focus":["LAP","WRT1"],"flows":[{"path":["LAP","WRT1","SW1","R1","PCB"],"back":true,"label":"Laptop pings 192.168.50.10","tags":{"WRT1":"Key matches · bridged to SW1"}},{"path":["LAP","WRT1","SW1","SRV"],"back":true,"label":"Laptop opens http://lab.example","tags":{"SRV":"HTTP · server page"}}],"chips":[{"node":"LAP","text":"Profile key corrected","tone":"ok"},{"node":"WRT1","text":"CCNA-LAB · WPA2-Personal/AES"},{"node":"R1","text":"Saved to startup-config","tone":"ok"}],"rows":[["Laptop","Server, PC-B, lab.example","ok"],["PC-A","Correct DHCP settings","ok"],["WRT1 DHCP","Still disabled"],["Saved","clients-complete.pkt · R1 startup","ok"]]}
```

## Step 15 — Inspect the operating systems without creating real faults

Choose one actual OS environment you have. For the other two, interpret this chapter's representative Windows/macOS/Linux outputs and record the commands you would use to obtain the missing route or resolver evidence. Do not install three operating systems to complete this exercise. These are **read-only inspections**: do not release a working lease, alter DNS, disconnect Wi-Fi or disable security on a personal/work machine. Its addresses will not match the simulator unless it is intentionally part of that isolated network. For an unavailable OS, interpret the chapter's representative output and mark direct practice pending.

**Windows:** open Command Prompt and run:

```text
ipconfig /all
route print -4
route print -6
arp -a
netsh wlan show interfaces
netsh wlan show profiles
```

Record the intended adapter, IPv4/IPv6 addresses, prefixes, gateway/route and resolver choices. If a wireless adapter is active, record its displayed SSID, authentication and cipher. To inspect a chosen saved profile without displaying its cleartext password, use `netsh wlan show profile name="PROFILE-NAME"` after replacing the name with one from the list. If location/privacy permission restricts radio fields, note the restriction; an absent field is not proof of a network fault.

**macOS:** in System Settings → Network, inspect the active service → Details → TCP/IP and DNS. In Terminal:

```text
networksetup -listallhardwareports
ifconfig
route -n get default
netstat -rn
scutil --dns
```

Map the active service to its actual interface. For Wi-Fi, Option-click its menu-bar icon and open Wireless Diagnostics. Read current connection/security details available in that release; the analysis does not change settings. Keep generated diagnostic archives private because they contain network details.

**Linux:** use:

```bash
ip -br address
ip route
ip -6 route
ip neigh
```

On NetworkManager systems, add:

```bash
nmcli device status
nmcli device show
nmcli connection show --active
nmcli -f IN-USE,SSID,SECURITY,SIGNAL device wifi list
```

For an active wireless profile, use `nmcli -f 802-11-wireless-security.key-mgmt connection show "PROFILE-NAME"` with its actual profile name. On systemd-resolved systems, inspect `resolvectl status`. Missing NetworkManager or resolved tools can simply mean a different network manager is in use.

:::expected
For the chosen real OS and the other supplied examples, produce a small private worksheet mapping the active adapter to its address/prefix, usable routes, DNS configuration and wireless security evidence. Identify which observations came from saved configuration and which describe the current connection. A VPN-specific resolver or route may explain a path different from the default. Do not record passwords or claim direct practice on operating systems you did not access.

Your completion record must include:
- The intended adapter and actual address/prefix, selected route and resolver for the tested destination.
- A baseline matrix and one observed failure matrix, with fresh tests distinguished from cached/saved information.
- The narrow correction and the repeated failing test plus actual application outcome.
- Current wireless security/data-path evidence, or a clearly labeled unsupported-environment worksheet.
- One actual OS inspection and interpretations for unavailable systems, with direct practice honestly marked pending.

A successful answer explains the evidence; it is not the number of commands typed.
:::

```state
{"status":"Lab unchanged · OS read-only","rows":[["Real OS","One, inspected read-only"],["Record","Adapter, prefix, route, resolver"],["Wireless","SSID, authentication, cipher"],["Other two OSes","Interpret · practice pending"]]}
```

## Troubleshooting

- Initial link failure: check the exact ports, crossover for the direct router-to-PC link, interface shutdown state and switch forwarding.
- DHCP serves .20 or the wrong subnet: repair/remove conflicting simulator pools; reserve .1, .2 and .20 outside .100–.149.
- Local web access works but remote PC fails: that local application test did not exercise routing; inspect the client mask and selected next hop.
- DNS change appears ineffective: query a fresh name and inspect the actual resolver; caches or another adapter may hide the change.
- Wrong mask still reaches a remote endpoint: confirm proxy ARP is disabled in this controlled exercise and inspect actual packet decisions.
- Wireless laptop receives a different subnet: check WRT DHCP is disabled and the switch cable is in a LAN port, not the WAN port.
- Wi-Fi says connected but no lease: inspect current authentication/data-path evidence, WLAN-to-LAN mapping and DHCP exchange; the icon does not identify one unique cause.

## Challenge

A new routed application must work from a new wired client. This variation uses a different destination network and two independently testable client/service settings. Keep the recovered baseline and save a copy as `clients-challenge.pkt`.

### Supplied setup and service plan

Add **PC-PT PC-C** to SW1 Fa0/5 using copper straight-through. Add **Server-PT Server-B** directly to R1 Gi0/2 using copper crossover or the auto-connect tool. These named ports exist on the selected 2911/2960 models.

| Device | Intended address | Intended gateway / DNS |
|---|---|---|
| PC-C | 192.168.40.60/24 | GW 192.168.40.1; DNS 192.168.40.20 |
| R1 Gi0/2 | 192.168.60.1/27 | Connected route; no new static route |
| Server-B | 192.168.60.10/27 | GW 192.168.60.1; DNS 192.168.40.20 |

PC-C's .60 address is outside the DHCP pool. Server-B's mask is `255.255.255.224`. Set its static fields from the plan and explicitly turn its **HTTP** service On. Use this supplied router preparation:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/2
R1(config-if)# description CHALLENGE_WEB_LAN
R1(config-if)# ip address 192.168.60.1 255.255.255.224
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
R1# show ip route connected
```

The service plan says `challenge.example` must resolve to Server-B at `192.168.60.10`. Establish these initial incident settings rather than immediately correcting them:

- On PC-C, enter static `192.168.40.60/24`, gateway `192.168.40.254` and DNS `192.168.40.20`.
- On Server-A's DNS service, add the A record `challenge.example → 192.168.60.30`. Address .60.30 is unused; it is not the broadcast address.
- Keep every other recovered baseline field unchanged.

### Independent investigation

Do not open the solution yet. First use healthy PC-A as a control to verify numeric HTTP at `http://192.168.60.10`. If that control fails, fix the supplied physical/server/router setup before diagnosing PC-C.

From PC-C, record: actual parameters, local `.40.20` reachability, intended gateway `.40.1` reachability, numeric `.60.10` reachability/HTTP, a fresh `challenge.example` query, and the named web result. Choose the next test rather than changing both suspicious fields at once.

Explain why pinging the real gateway can succeed even when the configured default next hop is wrong. Make one demonstrated correction, repeat its numeric/applicable tests, then investigate the remaining named-service failure. Record the actual resolver and answer; a DNS response is not automatically the right answer.

Submit the two causes, the evidence distinguishing them, each narrow repair, and a fresh successful `http://challenge.example` test. Keep the base clients working. If Packet Tracer cannot expose a query field, use Simulation-mode DNS evidence or the supplied initial record and clearly label your worksheet inference.

:::solution
The new /27 is `192.168.60.0/27`: ordinary host range .1–.30, broadcast .31. Server-B .10 and router .1 are valid. PC-C .40.60 is on the existing /24 and outside .100–.149.

The initial evidence should distinguish these outcomes:

| Test from PC-C | Expected result and reason |
|---|---|
| Local Server-A .40.20 | Works on the local link |
| Intended gateway .40.1 | Can work directly; ping does not use the incorrect default next hop |
| Remote .60.10 / numeric HTTP | Fails through unused configured gateway .40.254 |
| Fresh DNS query to .40.20 | Can answer locally, but returns the wrong .60.30 address |
| Named challenge application | Fails; both the wrong next hop and wrong record must be addressed |

First set only PC-C's gateway to `192.168.40.1`, retaining .40.60/24 and DNS .40.20. Check a fresh remote ping and `http://192.168.60.10`. The successful numeric page demonstrates the routed application path. The name can still fail because the record points to unused .60.30.

Next correct only Server-A's `challenge.example` A record to `192.168.60.10`. Query that same resolver again and read the answer. Use `nslookup challenge.example 192.168.40.20` if supported; otherwise inspect a fresh DNS exchange in Simulation mode. An old cached answer is not the new result: refresh the client/browser using supported simulator controls or reopen the client test after the record correction.

Open `http://challenge.example` and verify Server-B's page. Compare with the healthy PC-A numeric control; do not change its working configuration. Record the two repaired values and keep the new topology if desired. Save `clients-challenge-complete.pkt`. Save verified R1 configuration with a separate `copy running-config startup-config` and finish its destination prompt. No router static route, DHCP-pool change or wider client mask was needed.
:::
