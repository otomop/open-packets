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

“The network is down” can mean a disconnected adapter, an address from the wrong subnet, an unreachable DNS service or a single application failure. Start by turning that report into a testable statement: which client, which connection, which destination, which application and when?

A useful diagnosis preserves the evidence before making changes. Read the current settings, compare them with the intended network, and test one part of the path at a time. A familiar symptom should suggest the next test, not replace it.

## Start with the active adapter and its parameters

An endpoint may have Ethernet, Wi-Fi, a VPN and virtual-machine adapters simultaneously. A **virtual adapter** is a software interface: for example, a VPN client can use one to send traffic into a protected connection, while virtual-machine software can provide interfaces for a guest computer. Their detailed designs come later; here, identify which interface and route the affected application actually uses. The intended adapter's name is not necessarily `Ethernet`, `en0` or `eth0`; discover the real name before interpreting output or running a change.

For a conventional IPv4 LAN, examine the address, subnet mask, default gateway and DNS server. The address identifies the interface. The mask helps establish the directly connected subnet. A gateway provides a next hop for routes through a router; the default gateway is used when no more specific route matches. DNS resolves names independently of the forwarding decision.

:::facts
- An on-subnet numeric-IP test can work without a default gateway or DNS.
- A default gateway alone does not prove that every remote destination is reachable.
- DHCP can supply correct or incorrect values; manual settings can override selected values.
- A host can have several routes, DNS resolvers and IPv4/IPv6 addresses.
- Read the intended adapter, route and address family for the failing destination.
:::

These four IPv4 parameters are a starting point, not the whole network. A VPN may install a more specific route. An application may use a proxy or its own encrypted DNS. A certificate or clock error may prevent HTTPS even while the network delivers packets correctly. A server certificate binds identity information to a public key and includes a validity period. HTTPS clients check the expected server identity, certificate trust and validity, so a wrong clock can break that check even when the server is reachable. Chapter 32 develops certificate authentication further.

Also inspect IPv6. A link-local `fe80::` address is normal on an IPv6-enabled interface; it does not by itself show that global IPv6 routing works. Identify any global/unique-local address, its prefix, the default route and the scope of a link-local next hop. Keep IPv4 and IPv6 results separate: success over one does not prove the other is healthy.

## Ask the same questions on three operating systems

The commands differ, but the investigation is consistent:

| Question | Windows | macOS | Linux |
|---|---|---|---|
| Addresses, masks and adapter details? | `ipconfig /all` | `ifconfig`; Network settings | `ip -br address` |
| Default route and other routes? | `route print -4` / `route print -6` | `route -n get default`; `netstat -rn` | `ip route` / `ip -6 route` |
| DNS configuration? | `ipconfig /all` | `scutil --dns` | `resolvectl status` or `nmcli device show` |
| Cached IPv4 neighbors? | `arp -a` | `arp -a` | `ip neigh` |
| DNS query to a specified server? | `nslookup name server` | `nslookup name server`, where installed | `nslookup name server`, where installed |

Linux distributions choose different network managers; `nmcli` applies to NetworkManager and `resolvectl` to systemd-resolved. If neither manages the machine, use that distribution's documented tools. Legacy `ifconfig` may be absent on Linux, so do not begin by installing old tools simply to match a screenshot.

A neighbor cache shows a recorded IP-to-link-layer mapping. An entry can be stale, static or incorrect; it is not independent proof that the current path is good. Combine it with a fresh test and interface evidence.

## Read Windows configuration and routes

Use `ipconfig /all` to identify the intended adapter and its configured values. Compare the MAC address with inventory if necessary, while allowing for private/randomized wireless MAC settings. A disconnected unused adapter is not automatically the cause of a fault on another connection.

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

`DHCP Enabled: Yes` does not establish that every displayed value came from the lease: manually specified DNS can coexist with automatic addressing. A remote DHCP server address is also not an error by itself; a relay can serve the LAN.

A Windows **Autoconfiguration IPv4 Address** in `169.254.0.0/16`, with DHCP enabled and no usable lease, indicates IPv4 link-local fallback, commonly called APIPA. It suggests DHCP acquisition failed, but does not identify which message or device failed. The server could be unreachable, a pool could be exhausted, or replies could fail to reach the client.

RFC 3927's dynamic selection range excludes the first and last /24 within that /16. The important operational point is link scope: these addresses are not a substitute for routed IPv4 service. Existing IPv6 or another adapter may still provide connectivity. A number starting `169.254` alone is weaker evidence than the autoconfiguration label plus the configuration context.

Read `route print -4` when multiple adapters are active. Longest matching prefix comes before metric. With two usable default routes and no more specific match, the lower effective metric is preferred. Do not assume Ethernet always wins simply because it is wired.

To request a lease update, use `ipconfig /renew "Ethernet"` with the actual adapter name. `/release` deliberately discards the lease and can interrupt the current session, so use release/renew only where that disruption is intended. The exact exchange depends on client state; do not infer a captured four-message DHCP sequence from the command alone.

## Read macOS and Linux configuration

On macOS, Network settings shows each network service's details. TCP/IP shows the address, subnet mask, router and configuration method. DNS settings shows resolver choices. `networksetup -listallhardwareports` helps map a friendly service to an interface; `networksetup -getinfo "Wi-Fi"` reads that named service's IP settings.

In `ifconfig en0`, a mask such as `0xffffff00` is hexadecimal. Each `f` represents four one-bits: six of them give 24 one-bits, so the mask is `255.255.255.0` or /24. `0xffffff80` is /25 because `0x80` adds one further one-bit. Use the actual interface, which may differ from en0.

`route -n get default` identifies the default IPv4 route. `scutil --dns` shows resolver configuration, including supplemental domain-specific resolvers used by some VPNs. Do not assume the first displayed server answers every query: domain and interface scope can affect selection. A configured “reachable” status is not equivalent to a completed DNS query.

On Linux, `ip -br address` provides a compact interface/address view. `ip route` shows IPv4 routes. Representative excerpt:

```output Linux: ip -br address and ip route
enp0s3  UP  10.1.20.59/24 fe80::a00:27ff:fe4e:66a1/64
default via 10.1.20.1 dev enp0s3 proto dhcp src 10.1.20.59 metric 100
10.1.20.0/24 dev enp0s3 proto kernel scope link src 10.1.20.59
```

Here `via 10.1.20.1` is the next hop and `src 10.1.20.59` is the preferred source address, not another gateway. `proto dhcp` labels the route's origin; confirm the address acquisition method through the network manager or lease information rather than assuming that one route label proves every address's origin.

For systemd-resolved, `resolvectl status` displays per-link DNS configuration. A `127.0.0.53` entry in `/etc/resolv.conf` can identify a local DNS stub, not the upstream server. With NetworkManager, `nmcli device show` includes addresses, gateway and DNS information.

Failed DHCP on Linux does not have one universal visual result. Depending on the manager and profile, an interface may have no usable IPv4 address, retain another configuration, or obtain a link-local address. NetworkManager's link-local behavior is configurable. Its `device reapply` operation reapplies supported connection changes; it is not a universal “force a fresh DHCP lease” command.

## Recognize fault patterns and their limits

Use a simple network to reason precisely. PC-A is intended to be `192.168.40.100/24`, gateway `192.168.40.1`. A local server is `192.168.40.20`; a remote PC is `192.168.50.10/24` behind the router.

| Suspected fault | Useful observation | Confirmation needed |
|---|---|---|
| No usable DHCP lease | Autoconfiguration/link-local or no expected IPv4 address | Manager status, DHCP requests/replies and server state |
| Wrong gateway | Local tests work; intended routed test fails | Compare configured next hop with the actual router |
| Wrong mask | Failure differs by destination subnet | Compute the client's on-link decision |
| Wrong DNS choice | Numeric access works; direct DNS query fails | Server selected, query response and record correctness |
| Duplicate address | Conflict indication or inconsistent neighbor evidence | Compare leases/static assignments and packet observations |

A wrong gateway of `192.168.40.254` can prevent off-link traffic if that address is unused and no other matching route exists. It need not break direct communication with `192.168.40.20`. The failure is in selecting or reaching the next hop, not in DNS merely because a website name was involved.

A /16 mask on PC-A creates a different problem. The client now considers `192.168.50.10` on-link and tries to resolve that destination directly instead of using `192.168.40.1`. In the lab, proxy ARP is explicitly disabled, so no router answers on behalf of the remote PC. Yet a destination outside `192.168.0.0/16` would still be sent toward the configured gateway. This explains why one successful remote test cannot validate the mask for all destinations.

```diagram
{"type":"topology","title":"Test the local and routed paths separately","nodes":[{"id":"pc","kind":"pc","label":"PC-A","sub":"192.168.40.100/24","x":1,"y":1},{"id":"server","kind":"server","label":"Local server","sub":"192.168.40.20/24","x":1,"y":5},{"id":"sw","kind":"switch","label":"SW1","x":4,"y":3},{"id":"r","kind":"router","label":"R1","sub":".40.1 / .50.1","x":8,"y":3},{"id":"remote","kind":"pc","label":"PC-B","sub":"192.168.50.10/24","x":11,"y":3}],"links":[{"from":"pc","to":"sw"},{"from":"server","to":"sw"},{"from":"sw","to":"r"},{"from":"r","to":"remote"}],"caption":"A /16 error changes PC-A's decision about PC-B; a local server test does not exercise the gateway.","trace":{"chips":[{"node":"pc","text":"Wrong mask /16","tone":"bad"}],"flows":[{"path":["pc","sw","server"],"back":true,"label":"Ping 192.168.40.20","tags":{"pc":"Inside the /16 · sent directly"}},{"path":["pc","sw",["server","r"]],"label":"ARP for 192.168.50.10","tags":{"pc":"/16 puts .50.10 on-link · ARP","sw":"Broadcast · flooded","r":"Proxy ARP disabled · no answer"}}]}}
```

A DNS timeout means the query did not obtain the expected timely response. It does not distinguish a wrong server address, filtering, a stopped service or a return-path failure. NXDOMAIN is different: a responding server reported that the queried name does not exist. Use an explicit query and read the response rather than calling every name failure “DNS down.”

:::trap A ping result has a limited scope
A reply proves an ICMP exchange worked for that test. A timeout does not prove a firewall blocked it, and it does not prove the packet left the client. A local “destination unreachable” is a useful clue, but inspect the route and neighbor state before assigning the exact cause.
:::

## Verify wireless connection and security settings

A **wireless LAN (WLAN)** connects clients by radio through an **access point (AP)**. Its **service set identifier (SSID)** is the network name the client selects. A saved client **profile** holds that name and its connection/security settings; it is not proof of a current connection. **Association** establishes the client's 802.11 relationship with an AP. The required security exchange must also succeed before protected user data can pass.

Compare the intended SSID, security mode and required credentials with the client's profile. SSIDs are case-sensitive and have a maximum length of 32 octets; displayed characters need not always occupy one byte.

In **Personal** security, the client and WLAN use an agreed shared secret. **Enterprise** security uses individual user/device authentication through 802.1X and **EAP (Extensible Authentication Protocol)**, a framework for authentication methods. A **cipher** is the algorithm used to protect the data; selecting the right network name alone does not select compatible authentication and encryption settings. Chapters 36–38 develop the radio, infrastructure and security configuration. This section first teaches you to read the client's settings and failure stage.

WPA2-Personal commonly uses an 8–63 ASCII-character passphrase, or a directly entered 64-hexadecimal-digit PSK where supported. WPA3-Personal uses **SAE (Simultaneous Authentication of Equals)**, a password-based authentication and key-establishment method, and Enterprise security uses 802.1X/EAP methods whose credentials may involve certificates, passwords or both. Do not apply the WPA2 passphrase rule to every wireless authentication method.

In WPA2-Personal, initial 802.11 association can occur before the four-way key handshake finishes. A wrong shared key can therefore produce an association followed by a key-exchange failure. Useful protected client data, including DHCP, requires the security process to succeed. Exact operating-system messages vary; one error phrase does not establish the cause for every client.

On Windows, `netsh wlan show interfaces` reports current connection information, including SSID and authentication/cipher details where available. `netsh wlan show profiles` lists saved profiles; `netsh wlan show profile name="CCNA-LAB"` reads a chosen profile without requesting its cleartext key. There is no need to expose a password to compare the security mode.

On macOS, use the Wi-Fi details and Option-click the menu-bar Wi-Fi icon to open Wireless Diagnostics. It analyzes the connection without changing network settings. On Linux with NetworkManager, `nmcli device wifi list` shows nearby networks and `nmcli connection show` identifies profiles. Inspect the active profile's `802-11-wireless-security.key-mgmt` to distinguish its authentication method. Privacy permissions, driver support and OS release can limit displayed radio details; document missing fields.

A “connected” indication with an APIPA address calls for checking DHCP acquisition **and** the intended WLAN/VLAN/data path. It is not proof that every wireless parameter or infrastructure mapping is correct. A strong signal does not establish correct credentials, DHCP service or DNS operation. Likewise, a valid lease can be stale or obtained on the wrong network.

## Test a path and verify the repair

Record the intended adapter and compare its actual address, prefix, route and DNS values with the network plan. For wireless, establish which SSID/security method is in use. Then test a known local peer, the intended gateway, a known routed destination, a direct DNS query and the required application.

A loopback ping or ping to the client's own address can test local processing, but does not exercise the cable, AP or gateway. A gateway may also be configured not to answer ICMP, so combine that result with neighbor state and another appropriate test instead of stopping every investigation at a failed ping.

On Windows PowerShell, `Test-NetConnection 192.168.50.20 -Port 443` tests a TCP connection to that address and port. A successful TCP connection still does not prove TLS negotiation, certificate validation or application authorization. `-TraceRoute` is a different diagnostic mode; do not combine incompatible parameter sets as though one command universally performs every test.

Change one demonstrated cause at a time and repeat the previously failing test. After repairing a wrong client DNS address, verify the server selected and the expected answer, then try the application. A cached result can conceal the effect of a changed resolver, so direct queries to a specified server are valuable.

If DHCP settings were wrong, repair the correct server/profile and renew through the operating system's supported method. On macOS, the selected network service's TCP/IP pane provides Renew DHCP Lease. On Linux, use its actual network manager; disconnecting and reconnecting a profile interrupts traffic and belongs in an isolated or approved maintenance context.

## Exam focus

For v1.1, read and verify client IP parameters on Windows, macOS and Linux. For v2.0, extend that work to wired/wireless reachability and wireless security settings. Be able to explain the next useful test and what its result would establish.

Keep configuration evidence, packet evidence and inference separate. A correct answer identifies the supported cause or next investigation without claiming that a single ping, neighbor entry or Wi-Fi icon proves the whole network.
