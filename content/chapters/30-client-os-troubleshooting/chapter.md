---
id: client-os-troubleshooting
number: 30
title: Client OS troubleshooting
subtitle: Read the endpoint, test a specific path, and separate symptoms from causes.
part: services
domain: infra
minutes: { lesson: 65, lab: 105 }
summary: Verify IP configuration on Windows, macOS and Linux, diagnose address, mask, gateway and DNS faults, and check wireless connection and security evidence without overclaiming what a ping or connection icon proves.
objectives:
  v1: ["1.10"]
  v2: ["1.6"]
prereqs: [ipv4-addressing, ipv6-addressing, dhcp, dns]
sectionIds:
  "Start with the active adapter and its parameters": four-parameters-decide-everything
  "Ask the same questions on three operating systems": the-same-questions-on-three-operating-systems
  "Read Windows configuration and routes": reading-windows
  "Read macOS and Linux configuration": reading-macos-and-linux
  "Recognize fault patterns and their limits": four-parameters-four-failure-signatures
  "Verify wireless connection and security settings": wireless-clients-three-settings-that-must-match
  "Test a path and verify the repair": verify-and-troubleshoot-the-ladder
  "Exam focus": exam-focus
sources:
  - { title: "Cisco: WLAN authentication and security modes", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_security.html" }
  - { title: "Microsoft: ipconfig", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig" }
  - { title: "Microsoft: route", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008" }
  - { title: "Microsoft: route selection and metric", url: "https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/microsoft-windows-tcpip-interfaces-interface-routes-route-metric" }
  - { title: "Microsoft: nslookup", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup" }
  - { title: "Microsoft: Test-NetConnection", url: "https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection?view=windowsserver2025-ps" }
  - { title: "Microsoft: netsh wlan", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netsh-wlan" }
  - { title: "Apple: DHCP or manual IP settings", url: "https://support.apple.com/guide/mac-help/use-dhcp-or-a-manual-ip-address-on-mac-mchlp2718/mac" }
  - { title: "Apple: Renew a DHCP lease", url: "https://support.apple.com/en-asia/guide/mac-help/mchlp1545/mac" }
  - { title: "Apple: Wireless Diagnostics", url: "https://support.apple.com/guide/mac-help/use-wireless-diagnostics-mchlf4de377f/mac" }
  - { title: "Apple: networksetup", url: "https://support.apple.com/guide/remote-desktop/about-networksetup-apdd0c5a2d5/mac" }
  - { title: "Apple source: scutil manual", url: "https://github.com/apple-oss-distributions/configd/blob/main/scutil.tproj/scutil.8" }
  - { title: "Debian iproute2: ip-address", url: "https://manpages.debian.org/trixie/iproute2/ip-address.8.en.html" }
  - { title: "Debian iproute2: ip-route", url: "https://manpages.debian.org/trixie/iproute2/ip-route.8.en.html" }
  - { title: "NetworkManager: nmcli", url: "https://networkmanager.pages.freedesktop.org/NetworkManager/NetworkManager/nmcli.html" }
  - { title: "NetworkManager: IPv4 settings", url: "https://networkmanager.pages.freedesktop.org/NetworkManager/NetworkManager/settings-ipv4.html" }
  - { title: "systemd source: resolvectl manual", url: "https://github.com/systemd/systemd/blob/main/man/resolvectl.xml" }
  - { title: "RFC 3927: IPv4 link-local addressing", url: "https://www.rfc-editor.org/rfc/rfc3927" }
  - { title: "RFC 5416: SSID length in the 802.11 binding", url: "https://www.rfc-editor.org/rfc/rfc5416" }
  - { title: "Cisco: WLAN authentication and key exchange", url: "https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/116493-technote-technology-00.html" }
  - { title: "Cisco: WPA2 WLAN security settings", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-5/config-guide/b_cg85/wlan_security.html" }
---

A user tells you “the network is down.” The switch port is up and the desk next to them works, so the network is fine. The fault is on that one client, and it is usually one of a few things: the PC has no DHCP lease, its mask or default gateway is wrong, it is asking the wrong DNS server, or its Wi-Fi profile does not match the WLAN. Each of these leaves a different pattern in the client's own settings and in what it can and cannot reach.

You already know what an address, a mask and a gateway do, how DHCP hands them out and how DNS turns names into addresses. This chapter uses that knowledge on the endpoint. By the end you will be able to read the IP settings on Windows, macOS and Linux, match a symptom to the setting that causes it, check a wireless client's SSID and security, and prove a repair by repeating the test that failed.

## Start with the active adapter and its parameters

Before you read any setting, find the adapter the failing traffic uses. A laptop may have Ethernet, Wi-Fi, a VPN and virtual-machine adapters at the same time. A **virtual adapter** is a software interface: a VPN client uses one to send traffic into its tunnel, and virtual-machine software uses them to connect guest computers. Reading a correct address on the wrong adapter tells you nothing. The name is not always `Ethernet`, `en0` or `eth0`, so list the adapters first.

On that adapter, four IPv4 settings decide almost everything:

- The **address** identifies the host.
- The **subnet mask** tells the host which destinations are on its own subnet (on-link). It sends to those directly, using ARP to find the destination's MAC address.
- The **default gateway** is the router the host sends to for every destination that is not on-link.
- The **DNS server** turns names into addresses. It plays no part in forwarding a packet whose destination is already an IP address.

:::facts
- A ping to a numeric address on the host's own subnet needs neither a default gateway nor DNS.
- A ping to a numeric address on another subnet needs the mask and gateway to be right, but not DNS.
- A test that uses a name needs DNS as well.
- DHCP normally supplies all four settings; a manual setting on the client overrides the DHCP value.
- A host can have several adapters, routes and DNS servers, and both IPv4 and IPv6. Read the ones the failing traffic uses.
:::

Other things can still go wrong with all four correct. A VPN can add a more specific route that bypasses the default gateway, and HTTPS fails on a client whose clock is wrong, because the client checks the validity dates on the server's certificate (chapter 32).

Check IPv6 separately. Every IPv6-enabled interface has a link-local `fe80::` address, so seeing one does not mean IPv6 routing works. Look for a global or unique-local address, its prefix and an IPv6 default route. IPv4 and IPv6 have their own addresses, routes and gateways, so a test that passes over one says nothing about the other.

## Ask the same questions on three operating systems

The three operating systems name their commands differently, but you ask each one the same five questions:

| Question | Windows | macOS | Linux |
|---|---|---|---|
| Addresses, masks and adapter details? | `ipconfig /all` | `ifconfig`; Network settings | `ip -br address` |
| Default route and other routes? | `route print -4` / `route print -6` | `route -n get default`; `netstat -rn` | `ip route` / `ip -6 route` |
| DNS configuration? | `ipconfig /all` | `scutil --dns` | `resolvectl status` or `nmcli device show` |
| Cached IPv4 neighbors? | `arp -a` | `arp -a` | `ip neigh` |
| DNS query to a specified server? | `nslookup name server` | `nslookup name server`, where installed | `nslookup name server`, where installed |

Linux distributions use different network managers: `nmcli` belongs to NetworkManager and `resolvectl` to systemd-resolved. The `ip` command works on all of them. Older Linux systems, and many exam exhibits, use `ifconfig` and `netstat -rn` instead; modern distributions often do not install them.

The neighbor cache (`arp -a`, `ip neigh`) lists the IP-to-MAC mappings the host has learned. An entry for the gateway shows that the gateway answered ARP at some point. Entries can be stale, so send a fresh ping before you rely on one.

## Read Windows configuration and routes

Plain `ipconfig` prints the address, mask and default gateway of each adapter. `ipconfig /all` adds the MAC address, whether DHCP is enabled, the DHCP server, the lease times and the DNS servers, so it is the command to start with. Find the adapter the user is actually connected through and ignore disconnected ones.

Representative excerpt:

```output Windows: ipconfig /all
Ethernet adapter Ethernet:
   DHCP Enabled. . . . . . . . . . . : Yes              ← address configuration uses DHCP
   IPv4 Address. . . . . . . . . . . : 10.1.20.57
   Subnet Mask . . . . . . . . . . . : 255.255.255.0    ← expected /24
   Default Gateway . . . . . . . . . : 10.1.20.1
   DHCP Server . . . . . . . . . . . : 10.1.10.5        ← can be remote through a relay
   DNS Servers . . . . . . . . . . . : 10.1.10.5
```

Two details in this output catch people out. `DHCP Enabled: Yes` covers the address; the DNS servers can still be typed in by hand on the same adapter, and a manual value wins over the one DHCP offers. And a DHCP server on another subnet (here 10.1.10.5) is normal: the router relays the client's broadcasts to it, as you configured with `ip helper-address` in the DHCP chapter.

When a Windows client is set for DHCP and gets no answer, it gives itself an address. The output then shows **Autoconfiguration IPv4 Address** with a value in `169.254.0.0/16`, mask 255.255.0.0 and no default gateway. This is IPv4 link-local addressing, which Microsoft calls **APIPA** (Automatic Private IP Addressing). The host picks from 169.254.1.0 to 169.254.254.255. Routers do not forward these addresses, so the client can reach at most other self-addressed hosts on the same link. A 169.254 address therefore tells you that DHCP failed, but not why: the server may be down, the pool may be empty, or the relay or the client's VLAN may be wrong.

Use `route print -4` when more than one adapter is active. Windows picks the route with the longest matching prefix. If two routes tie on prefix length, such as two default routes from Ethernet and Wi-Fi, the lower metric wins. A wired adapter does not win automatically.

Three more `ipconfig` options change state, so know exactly what each does:

- `ipconfig /release` gives up the DHCP lease. The adapter has no address until you renew.
- `ipconfig /renew` asks the DHCP server for a lease. Add the adapter name, as in `ipconfig /renew "Ethernet"`, to leave other adapters alone.
- `ipconfig /flushdns` empties the DNS resolver cache (`ipconfig /displaydns` shows it). It has nothing to do with the lease. Use it after a DNS record has been corrected, so the client stops using the old answer.

## Read macOS and Linux configuration

On macOS, Network settings shows each network service's details. TCP/IP shows the address, subnet mask, router and configuration method. DNS settings shows resolver choices. `networksetup -listallhardwareports` helps map a friendly service to an interface; `networksetup -getinfo "Wi-Fi"` reads that named service's IP settings.

In `ifconfig en0`, a mask such as `0xffffff00` is hexadecimal. Each `f` represents four one-bits: six of them give 24 one-bits, so the mask is `255.255.255.0` or /24. `0xffffff80` is /25 because `0x80` adds one further one-bit. Use the actual interface, which may differ from en0.

`route -n get default` shows the default IPv4 route: its gateway and its interface. `netstat -rn` prints the whole routing table. `scutil --dns` lists every DNS resolver the Mac uses. A VPN often adds a resolver for one domain only, so the first server in the list does not answer every query.

On Linux, `ip -br address` provides a compact interface/address view. `ip route` shows IPv4 routes. Representative excerpt:

```output Linux: ip -br address and ip route
enp0s3  UP  10.1.20.59/24 fe80::a00:27ff:fe4e:66a1/64
default via 10.1.20.1 dev enp0s3 proto dhcp src 10.1.20.59 metric 100
10.1.20.0/24 dev enp0s3 proto kernel scope link src 10.1.20.59
```

Read the first line as “interface enp0s3 is up with 10.1.20.59/24.” In the second line, the address after `via` (10.1.20.1) is the default gateway. The address after `src` (10.1.20.59) is the host's own source address, not a second gateway. `proto dhcp` means DHCP installed this route. The third line is the connected subnet: no `via`, so the host delivers to 10.1.20.0/24 directly.

Linux DNS settings depend on the resolver in use. On a system running systemd-resolved, `/etc/resolv.conf` usually lists only `127.0.0.53`. That is a local stub that forwards queries; `resolvectl status` shows the real upstream servers for each link. With NetworkManager, `nmcli device show` prints the addresses, gateway and DNS servers together.

When DHCP fails on Linux, the interface usually ends up with no IPv4 address at all rather than a 169.254 one.

## Recognize fault patterns and their limits

Each wrong setting breaks a different set of destinations, so the pattern of what works and what fails points at the setting. Use a simple network to see why. PC-A is intended to be `192.168.40.100/24`, gateway `192.168.40.1`. A local server is `192.168.40.20`; a remote PC is `192.168.50.10/24` behind the router.

| Suspected fault | Useful observation | Confirmation needed |
|---|---|---|
| No usable DHCP lease | Autoconfiguration/link-local or no expected IPv4 address | Manager status, DHCP requests/replies and server state |
| Wrong gateway | Local tests work; intended routed test fails | Compare configured next hop with the actual router |
| Wrong mask | Failure differs by destination subnet | Compute the client's on-link decision |
| Wrong DNS choice | Numeric access works; direct DNS query fails | Server selected, query response and record correctness |
| Duplicate address | Conflict indication or inconsistent neighbor evidence | Compare leases/static assignments and packet observations |

Give PC-A the wrong gateway, `192.168.40.254`, an address nothing uses. A ping to the local server `192.168.40.20` still works, because PC-A sends on-link traffic directly. A ping to `192.168.50.10` fails: PC-A sends ARP requests for .254 and nobody answers, so the packet never leaves. The user will say “the website is down,” but the fault is the next hop, not DNS.

Now give PC-A the right gateway but a /16 mask. PC-A believes all of `192.168.0.0/16` is on-link, so for `192.168.50.10` it does not use the gateway at all. It sends an ARP request for .50.10 on its own LAN, where that host does not exist. The ping fails even though the gateway setting is correct. A destination outside 192.168.0.0/16, such as 10.1.1.1, is still sent to the gateway and still works, so one successful remote ping does not clear the mask.

One IOS default can hide this fault. With **proxy ARP**, which is on by default on router interfaces, a router answers an ARP request for an address on another subnet it can route to, giving its own MAC address. R1 would answer PC-A's request for .50.10 and the ping would work despite the wrong mask. The lab turns proxy ARP off on R1 so that you can see the failure.

```diagram
{"type":"topology","title":"Test the local and routed paths separately","nodes":[{"id":"pc","kind":"pc","label":"PC-A","sub":"192.168.40.100/24","x":1,"y":1},{"id":"server","kind":"server","label":"Local server","sub":"192.168.40.20/24","x":1,"y":5},{"id":"sw","kind":"switch","label":"SW1","x":4,"y":3},{"id":"r","kind":"router","label":"R1","sub":".40.1 / .50.1","x":8,"y":3},{"id":"remote","kind":"pc","label":"PC-B","sub":"192.168.50.10/24","x":11,"y":3}],"links":[{"from":"pc","to":"sw"},{"from":"server","to":"sw"},{"from":"sw","to":"r"},{"from":"r","to":"remote"}],"caption":"A /16 error changes PC-A's decision about PC-B; a local server test does not exercise the gateway.","trace":{"chips":[{"node":"pc","text":"Wrong mask /16","tone":"bad"}],"flows":[{"path":["pc","sw","server"],"back":true,"label":"Ping 192.168.40.20","tags":{"pc":"Inside the /16 · sent directly"}},{"path":["pc","sw",["server","r"]],"label":"ARP for 192.168.50.10","tags":{"pc":"/16 puts .50.10 on-link · ARP","sw":"Broadcast · flooded","r":"Proxy ARP disabled · no answer"}}]}}
```

DNS faults come in three kinds, and `nslookup` tells them apart. A **timeout** means no server answered: the client is asking the wrong address, or the server or the path to it is down. **NXDOMAIN** means a server did answer and said the name does not exist. A **wrong answer** means the server is reachable but its record is wrong. To test one particular server, name it: `nslookup lab.example 192.168.40.20`.

:::trap A failed ping does not name its cause
A reply proves that ICMP echo worked between those two addresses. A timeout only says no reply came back. The request may never have left the client, a firewall may have dropped it, or the reply may have been lost on the way back. Check the client's route and ARP cache before you blame the far end.
:::

## Verify wireless connection and security settings

A **wireless LAN (WLAN)** connects clients by radio through an **access point (AP)**. Its **service set identifier (SSID)** is the network name the client selects. A saved client **profile** holds that name and its connection/security settings; it is not proof of a current connection. **Association** establishes the client's 802.11 relationship with an AP. The required security exchange must also succeed before protected user data can pass.

Three things in the client's profile must match the WLAN: the SSID, the security mode and the credential. SSIDs are case-sensitive and at most 32 octets long, so `CCNA-Lab` and `CCNA-LAB` are different networks.

In **Personal** security, the client and WLAN use an agreed shared secret. **Enterprise** security uses individual user/device authentication through 802.1X and **EAP (Extensible Authentication Protocol)**, a framework for authentication methods. A **cipher** is the algorithm used to protect the data; selecting the right network name alone does not select compatible authentication and encryption settings. Chapters 36–38 develop the radio, infrastructure and security configuration. This section first teaches you to read the client's settings and failure stage.

WPA2-Personal commonly uses an 8–63 ASCII-character passphrase, or a directly entered 64-hexadecimal-digit PSK where supported. WPA3-Personal uses **SAE (Simultaneous Authentication of Equals)**, a password-based authentication and key-establishment method, and Enterprise security uses 802.1X/EAP methods whose credentials may involve certificates, passwords or both.

A wrong passphrase fails at a specific stage. In WPA2-Personal the client first associates with the AP, and only then do the two run the **four-way handshake** that proves both hold the same key and derives the encryption keys. With the wrong passphrase the association succeeds and the handshake fails. No data passes until the handshake completes, and that includes DHCP, so the client ends up with no lease.

On Windows, `netsh wlan show interfaces` reports current connection information, including SSID and authentication/cipher details where available. `netsh wlan show profiles` lists saved profiles; `netsh wlan show profile name="CCNA-LAB"` shows a saved profile's security settings without displaying its key.

On macOS, hold Option and click the Wi-Fi icon in the menu bar to see the current SSID, security type, channel and signal, and to open Wireless Diagnostics. On Linux with NetworkManager, `nmcli device wifi list` shows nearby networks with their security, and `nmcli connection show` lists saved profiles. A profile's `802-11-wireless-security.key-mgmt` field gives its authentication method.

A Wi-Fi icon that says “connected” next to a 169.254 address means the client associated but did not get a lease. Check the security handshake first, then whether the WLAN maps to the right VLAN, then the DHCP server or relay for that VLAN. Signal strength is a separate matter: a strong signal says nothing about the passphrase, DHCP or DNS.

## Test a path and verify the repair

Once you have read the settings, test outward from the client one step at a time, so that the first test that fails marks where the fault begins:

1. Ping a host on the same subnet. This checks the adapter, cable or WLAN, and the address and mask.
2. Ping the default gateway. This checks that the client can reach its router.
3. Ping an address on another subnet. This checks the gateway setting and the routed path.
4. Look up a name with `nslookup`. This checks the DNS server setting and the record.
5. Open the application itself.

A ping to `127.0.0.1` or to the client's own address tests only the client's TCP/IP software. It does not touch the cable, the AP or the gateway. Some gateways and servers are set not to answer ping, so when a ping fails but the next step works, move on.

Ping tests reachability, not the service. On Windows PowerShell, `Test-NetConnection 192.168.50.20 -Port 443` tries to open a TCP connection to that address and port, which tells you whether the server is listening and nothing in the path blocks the port. It does not check the TLS certificate or the login. `Test-NetConnection` with `-TraceRoute` instead traces the path, and cannot be combined with `-Port`.

Change one setting at a time and repeat the test that failed. After you correct a DNS server address, query a name the client has not looked up before, or query the server directly, because a cached answer can make a broken resolver look healthy.

If DHCP settings were wrong, repair the correct server/profile and renew through the operating system's supported method. On macOS, the selected network service's TCP/IP pane provides Renew DHCP Lease. On Linux, use its actual network manager; disconnecting and reconnecting a profile interrupts traffic and belongs in an isolated or approved maintenance context.

## Exam focus

For v1.1, read and verify client IP parameters on Windows, macOS and Linux. For v2.0, extend that work to wired/wireless reachability and wireless security settings. Be able to explain the next useful test and what its result would establish.

Expect exhibits of client output with a question about what is wrong or which command produced it. Know these cold:

- Which command shows what on each OS: `ipconfig /all`, `ifconfig`, `ip address`, `route print`, `netstat -rn`, `ip route`.
- A Windows address in 169.254.0.0/16 means DHCP failed (APIPA).
- Local hosts reachable but remote ones not: suspect the default gateway, then the mask.
- Addresses reachable but names not: suspect the DNS server setting.
- `/release` and `/renew` act on the DHCP lease; `/flushdns` acts on the DNS cache.
- A wireless client needs the right SSID, security mode and credential; a wrong WPA2 passphrase fails at the four-way handshake.
