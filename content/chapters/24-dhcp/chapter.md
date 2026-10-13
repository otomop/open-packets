---
id: dhcp
number: 24
title: DHCP
subtitle: Obtain, renew, and troubleshoot IPv4 leases across local and routed networks.
part: services
domain: infra
minutes: { lesson: 65, lab: 85 }
summary: Explain DHCPv4 messages and lease state, configure IOS clients and a server, relay requests to a remote subnet, and isolate failures using client, relay, and server evidence.
objectives:
  v1: ["4.3", "4.6"]
  v2: ["1.7"]
prereqs: [inter-vlan-routing, static-routing-ipv4]
sectionIds:
  "What DHCP provides": why-a-host-cannot-address-itself
  "Understand the initial exchange": the-four-messages-dora
  "Follow renewal and lease expiry": leases-renewal-and-the-other-messages
  "Configure an IOS DHCP server": the-ios-dhcp-server
  "Configure an IOS DHCP client": the-ios-dhcp-client
  "Relay requests to another subnet": relay-crossing-the-router-with-ip-helper-address
sources:
  - { title: "Cisco IOS XE 17: DHCP server", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_config-dhcp-server-xe.html" }
  - { title: "Cisco IOS 15M&T: DHCP relay agent", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-relay-agent.html" }
  - { title: "Cisco IOS 15M&T: DHCP client", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-client.html" }
  - { title: "Cisco IP addressing command reference: DHCP client distance", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr/command/ipaddr-cr-book/ipaddr-i1.html" }
  - { title: "RFC 2131: Dynamic Host Configuration Protocol", url: "https://www.rfc-editor.org/rfc/rfc2131.html" }
  - { title: "RFC 2132: DHCP options", url: "https://www.rfc-editor.org/rfc/rfc2132.html" }
  - { title: "RFC 3927: IPv4 link-local addressing", url: "https://www.rfc-editor.org/rfc/rfc3927.html" }
---

A DHCP client requests the addressing information it needs to participate in an IPv4 network. A server allocates an address and supplies settings such as the subnet mask, gateway, and DNS resolver. A relay makes the same service available when the client and server are on different subnets.

The earlier routing labs used addresses, masks and gateways that you entered manually. DHCP supplies those same parameters; it does not replace VLAN membership, a usable gateway or a return route. Keep the packet path from Chapters 11 and 18 in view while following the service exchange.

You will configure all three roles and trace a failed request through them. The current v1.1 objectives emphasize the service role and client/relay configuration. The v2.0 objective explicitly includes troubleshooting the IOS server as well. Understanding the server is also necessary to build a complete client/relay lab.

## What DHCP provides

:::facts
- **DHCPv4** uses UDP: servers listen on **67**, clients on **68**. Ordinary relay-to-server messages use **67 → 67**.
- The initial selecting exchange is **Discover, Offer, Request, Acknowledge**, often abbreviated **DORA**.
- The initial Discover and selecting Request are broadcasts from **0.0.0.0** to **255.255.255.255**. This is not the addressing of every later Request.
- Offer/ACK delivery depends on client state, the broadcast flag, and whether a relay is involved.
- Unless the server supplies different valid values, **T1 = 50%** and **T2 = 87.5%** of the lease duration.
- Configure `ip helper-address` on the Layer 3 interface receiving the clients' broadcasts.
:::

**Dynamic Host Configuration Protocol** supplies configuration through a client/server exchange. An address **pool** defines addresses available for allocation. A **lease** permits a client to use an address for an agreed duration. A **binding** records the allocation to a client identifier. A binding is not proof that the client is currently connected or that its applications work.

DHCP reduces repeated manual configuration and lets administrators manage address use centrally. Static addressing remains useful for selected infrastructure; reservations or manual bindings can also provide predictable assignments. Do not mix unmanaged static addresses into a dynamic range. Exclude infrastructure addresses, and verify that gateways, servers, and pools follow the same subnet plan.

The server sends configuration in numbered **options**. Option **1** supplies the mask, **3** the default router, **6** DNS server addresses, **15** a domain name, and **51** the lease duration. The values are separate: a correct address with a wrong gateway can reach local neighbors but fail off subnet. A correct gateway with an unavailable DNS resolver can permit IP traffic while name-based access fails.

DHCP does not create a VLAN, configure a switch access port, or install all the network's routing. Those paths must already exist. This chapter concerns DHCPv4; IPv6 uses different assignment mechanisms and messages, covered in the IPv6 addressing chapter.

## Understand the initial exchange

Consider a new client with no usable address. It broadcasts DHCPDISCOVER on its local Ethernet network. The IP source is `0.0.0.0`, destination `255.255.255.255`, and UDP ports are 68 to 67. On Ethernet the destination MAC is `ffff.ffff.ffff`. A transaction identifier helps associate messages with this exchange; the client also identifies itself in the DHCP payload.

A server with a suitable available address can send DHCPOFFER. The **yiaddr** field contains the offered address. An offer is a proposal, not permission for the client to start using that address. Multiple servers may answer, and client selection policy is implementation dependent. Do not assume that the first reply must always be selected.

The client broadcasts a selecting DHCPREQUEST naming its chosen server and requested address. The server identifier is option **54**; the requested address is option **50**. Other offering servers can observe that another server was selected. DHCPACK then confirms the accepted lease and parameters. The client must also handle duplicate-address detection; if it detects a conflict, it can decline the address rather than use it.

| Initial message | Sender | Important observation |
|---|---|---|
| Discover | Client | Local broadcast seeking service |
| Offer | Server | Proposed address and parameters; delivery may be broadcast or unicast |
| Selecting Request | Client | Broadcast identifies the selected server and address |
| ACK | Server | Confirms the lease; delivery follows state and message fields |

A client that cannot receive an IP unicast before configuration sets the **broadcast flag**. With no relay and no already-configured client address, the server broadcasts its Offer/ACK when that flag is set. When it is clear, the server can send directly to the offered IP and client's hardware address. If a relay address is present, the server instead sends its response to the relay. A capture must therefore be interpreted at the point where it was taken.

```diagram
{"type":"sequence","title":"Initial allocation on one LAN","caption":"This example assumes a client requesting broadcast replies; other permitted reply delivery is explained in the text.","actors":["New client","DHCP server"],"steps":[{"from":0,"to":1,"label":"Discover","note":"0.0.0.0 → 255.255.255.255; UDP 68 → 67","accent":true},{"from":1,"to":0,"label":"Offer","note":"Proposed address; broadcast in this example"},{"from":0,"to":1,"label":"Selecting Request","note":"Broadcast; requested address and selected server","accent":true},{"from":1,"to":0,"label":"ACK","note":"Accepted lease and configuration options"}]}
```

:::trap Identify which DHCPREQUEST you are reading
A selecting Request broadcasts before the client uses the offered address. A renewal Request normally unicasts from an address already in use. The message name alone does not determine its source address, destination, or meaning.
:::

## Follow renewal and lease expiry

A bound client does not repeat all four initial messages each time it extends a lease. At **T1**, it enters renewing state and normally unicasts DHCPREQUEST to the leasing server. It continues using its valid address while seeking renewal. The request carries the current address in **ciaddr**, the client-address field. A successful ACK supplies an updated lease.

If renewal has not succeeded by **T2**, the client enters rebinding state and broadcasts DHCPREQUEST so another suitable server can respond. It still has its current leased address until expiry. With no successful extension before expiry, the client must stop using that lease. A valid DHCPNAK can also require it to discard an invalid requested configuration and restart acquisition.

The server can supply T1 and T2 through options **58** and **59**. The familiar fractions are defaults, not unconditional deadlines. For an eight-hour lease using those defaults, T1 is four hours and T2 is seven hours. That leaves three hours between T1 and T2 and one hour between T2 and expiry. Read the actual lease if an exercise specifies other timers.

| Message outside initial DORA | Purpose |
|---|---|
| DHCPNAK, server to client | Reject an address/configuration the server can determine is invalid |
| DHCPDECLINE, client to server | Report that the proposed address appears to be in use |
| DHCPRELEASE, client to server | Give up an allocation early |
| DHCPINFORM, client to server | Request other parameters when the client already has an address |

A working lease can conceal a broken relay: normal unicast renewal may still reach the server through ordinary routing. A new client needing broadcast discovery can fail immediately, while another device continues using its lease. This is why a fault test must specify whether the client is new, renewing, or rebinding.

Some clients, including Windows when automatic private addressing applies, can self-configure an IPv4 link-local address after DHCP acquisition fails. An automatically assigned `169.254.x.x` address with no useful gateway is evidence to investigate acquisition; it does not prove that no Offer ever arrived or identify one failed component. Link-local traffic stays on the local link and is not routed. Retry schedules and fallback behavior vary by client.

## Configure an IOS DHCP server

The referenced Cisco server normally uses a one-day lease unless configured otherwise. Our explicit eight-hour example serves `10.10.10.0/24`. Addresses `.1` through `.49` are excluded; the potential dynamic range is `.50` through `.254`, or **205 addresses**, before other bindings, exclusions, or conflicts are considered. The network and broadcast addresses are not host allocations.

```ios R2
R2# configure terminal
R2(config)# service dhcp
R2(config)# ip dhcp excluded-address 10.10.10.1 10.10.10.49
R2(config)# ip dhcp pool USERS
R2(dhcp-config)# network 10.10.10.0 255.255.255.0
R2(dhcp-config)# default-router 10.10.10.1
R2(dhcp-config)# dns-server 10.10.20.53
R2(dhcp-config)# domain-name dhcp.example
R2(dhcp-config)# lease 0 8 0
R2(dhcp-config)# end
R2# show ip dhcp pool
R2# show ip dhcp binding
```

The exclusion is a global command. The `network` statement selects the client subnet, not necessarily a subnet directly attached to this server. `default-router` is the gateway that clients must use; it is not automatically the DHCP server. `dns-server` advertises a resolver address but does not start a DNS service there. The full lab supplies the interfaces, route, and actual resolver device.

For a locally attached client, ordinary pool selection uses the server's receiving subnet. For a relayed client, it uses the client-subnet information discussed below. The allocation algorithm and prior bindings can affect which address appears first; do not require the lowest eligible address as the only passing result. Verify that the assigned address belongs to the intended available range.

Cisco can withhold addresses detected as conflicts. Read `show ip dhcp conflict` and investigate the actual device or stale record before clearing an entry. Clearing a binding or conflict does not remove an address already configured on another host. Also distinguish an exclusion from a reservation: an excluded address is withheld from dynamic allocation; it is not automatically assigned to a particular client.

## Configure an IOS DHCP client

A router can request an address on an Ethernet interface while serving or relaying a different LAN. Configure the intended interface explicitly:

```ios R3
R3# configure terminal
R3(config)# interface gigabitethernet0/0
R3(config-if)# ip address dhcp
R3(config-if)# no shutdown
R3(config-if)# end
R3# show ip interface brief
R3# show ip route
R3# show dhcp lease
```

Confirm the learned address and mask, lease state where supported, and the corresponding server binding. Client identifiers need not be a plain printed MAC address, so compare actual identifiers rather than reconstructing a universal `01 + MAC` rule. `show dhcp lease` and release/renew commands are not equally implemented by every simulator image; the lab gives a specific fallback.

When a usable router option is supplied, the referenced IOS DHCP client can install a default route. Cisco documents default administrative distance **254** when no interface/global distance override is configured. That is a platform behavior, not a DHCP protocol field or proof that every image installs an identical route. A lower-distance alternative wins between eligible routes to the same prefix; longest-prefix matching still applies to forwarding.

An address alone does not establish off-subnet service. Verify the route and return path separately. Releasing a client lease affects that client; it is different from clearing all server bindings. Avoid broadly clearing leases just to make a troubleshooting display look empty.

## Relay requests to another subnet

A router does not normally route the client's limited broadcast to a different subnet. A **DHCP relay agent** receives the local message and forwards a DHCP message toward a configured server. In this design R1 Gi0/0 is `10.10.10.1/24`, R1 Gi0/1 is `10.10.20.1/24`, and server R2 is `10.10.20.2/24`.

```ios R1
R1# configure terminal
R1(config)# service dhcp
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip helper-address 10.10.20.2
R1(config-if)# end
R1# show ip interface gigabitethernet0/0
```

R1's client-facing interface is where the helper belongs. In this ordinary relay design it inserts `10.10.10.1` into **giaddr**, the gateway-address field. R2 uses that field to select the `10.10.10.0/24` pool and sends its response back toward the relay on UDP 67. R2 therefore needs a route to the relay's client-side address, even though R1 and R2 share the server subnet.

R1 then delivers the response on the client link according to the message state and broadcast flag. The relay does not replace the client identifier with its own identity, and it does not make every packet broadcast. The helper is also a Cisco UDP broadcast-forwarding feature with behavior beyond DHCP on some platforms; review the configured forwarding policy rather than enabling it indiscriminately.

The referenced IOS `service dhcp` controls server and relay functionality. An explicit `no service dhcp` can therefore stop otherwise correct helpers. The absence of that negative command alone is not proof of a complete working relay; verify interface configuration and traffic.

**Option 82** adds relay-agent information, commonly identifying the circuit and remote device. It is distinct from giaddr. In chapter 16, DHCP snooping may insert it while giaddr remains zero. Cisco's IOS server can reject that combination unless its receiving interface is configured to trust relay information. Snooping trust on a switch, relay-information trust on a router, and an IP return route are different controls. Use the earlier lab's deliberate Option 82 policy; this lab starts without snooping or added Option 82 policy. Advanced classes and relay-source overrides are outside this exercise.

## Verify and troubleshoot

Start at the client: link, access VLAN, DHCP mode, assigned address/mask, gateway, DNS, and lease state. Next inspect the receiving Layer 3 interface and helper. Finally inspect server pool selection, free candidates, exclusions, bindings, conflicts, and routes. Test one stage at a time instead of assigning the same cause to every self-assigned address.

This is a representative, abbreviated server binding display. The actual identifier, lease expiry, and formatting come from your device:

```output R2# show ip dhcp binding
IP address       Client-ID/              Lease expiration        Type
                 Hardware address/
                 User name
10.10.10.50       0100.1122.3344.55       Sep 20 2026 08:00 AM     Automatic  ← One recorded allocation, not proof of current reachability
```

`show ip dhcp pool` helps compare capacity and use; `show ip dhcp server statistics` shows cumulative message counts. Increasing Discover counts with no Requests narrows the investigation, but does not uniquely prove a return-route fault: the server may have no available offer, the reply may be dropped, or the client may not accept it. Compare before/after counts for one controlled attempt.

Use packet observations or brief supported debugging only when the show evidence leaves a specific question unanswered. Record the actual interface, message type, client state, and giaddr. Stop debugging with `undebug all`. The exercise does not depend on a particular debug sentence, and a simulator lacking a display is not evidence of a broken protocol.

A complete DHCP check identifies the client lease, the actual gateway and resolver settings, the server binding, and the relay/return path when used. Keep those findings separate: a correct lease prepares the host to ask DNS a question, but it does not establish that the DNS answer is correct. That is the next chapter's starting point.

## Exam focus

- Distinguish client, server, and relay roles and UDP ports.
- Interpret selecting, renewing, and rebinding Requests in their correct state.
- Explain conditional Offer/ACK delivery and default versus supplied lease timers.
- Configure pools/options, an IOS client, and a client-facing helper.
- Use giaddr, server pool selection, and a valid return route together.
- Separate allocation failure, wrong options, exhaustion, conflicts, and security drops.
- Verify a recovered lease and actual connectivity without assuming a particular address or output string.
