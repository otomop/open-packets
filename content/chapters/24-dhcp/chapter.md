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

Every IPv4 host needs four settings before it can do anything useful: an address, a mask, a default gateway and a DNS server. In the labs so far you typed them in by hand. That works for three PCs. It does not work for three hundred laptops that come and go, and one mistyped address creates a duplicate that breaks someone else's connection. DHCP hands out these settings automatically and takes the addresses back when hosts leave.

DHCP runs on the network you already know how to build. The client must be in the right VLAN, the gateway it is given must exist (Chapter 11), and when the server is on another subnet, a router must relay the request and the server needs a route back (Chapter 18). By the end of this chapter you will be able to follow the four-message exchange, configure a Cisco router as a DHCP server, a client and a relay, and work out which of the three is at fault when a host gets no address.

## What DHCP provides

:::facts
- **DHCPv4** uses UDP: servers listen on **67**, clients on **68**. Ordinary relay-to-server messages use **67 → 67**.
- The initial selecting exchange is **Discover, Offer, Request, Acknowledge**, often abbreviated **DORA**.
- The initial Discover and selecting Request are broadcasts from **0.0.0.0** to **255.255.255.255**. This is not the addressing of every later Request.
- Offer/ACK delivery depends on client state, the broadcast flag, and whether a relay is involved.
- Unless the server supplies different valid values, **T1 = 50%** and **T2 = 87.5%** of the lease duration.
- Configure `ip helper-address` on the Layer 3 interface receiving the clients' broadcasts.
:::

**Dynamic Host Configuration Protocol** (DHCP) is a client/server protocol. The client asks for its configuration and the server supplies it. Three terms describe the server's side:

- A **pool** is the set of addresses the server may hand out for one subnet, together with the settings that go with them.
- A **lease** is permission for one client to use one address for a limited time.
- A **binding** is the server's record of a lease: which address went to which client, and when it expires.

The settings travel as numbered **options**. Option **1** is the subnet mask, **3** the default router, **6** the DNS servers, **15** the domain name and **51** the lease time. Each option can be wrong on its own, and the symptom tells you which one. A client with the right address but the wrong gateway reaches its own subnet and nothing beyond it. A client with the right gateway but the wrong DNS server can reach `10.10.20.53` by address but cannot open a site by name.

Routers, servers and printers usually keep fixed addresses so that other devices can always find them. Exclude those addresses on the server, or it will offer one of them to a client and create a duplicate.

This chapter covers DHCP for IPv4; IPv6 assigns addresses differently, as Chapter 19 described.

## Understand the initial exchange

A new client needs to talk to a server, but it has no address and does not know where the server is. It solves both problems with a broadcast. The full exchange takes four messages, remembered as **DORA**.

1. **Discover.** The client broadcasts a DHCPDISCOVER. The source IP is `0.0.0.0` because it has no address yet. The destination is `255.255.255.255`, the destination MAC is `ffff.ffff.ffff`, and the UDP ports are 68 to 67.
2. **Offer.** A server with a free address replies with a DHCPOFFER. The offered address is in the **yiaddr** ("your IP address") field, and the options carry the mask, gateway, DNS server and lease time. An offer is only a proposal. If several servers answer, the client picks one.
3. **Request.** The client broadcasts a DHCPREQUEST naming the server it chose (option **54**) and the address it wants (option **50**). It is a broadcast so that every server that made an offer hears the decision. The servers that were not chosen return their offered addresses to their pools.
4. **Acknowledge.** The chosen server sends a DHCPACK. The lease now exists and the client starts using the address.

| Initial message | Sender | Important observation |
|---|---|---|
| Discover | Client | Local broadcast seeking service |
| Offer | Server | Proposed address and parameters; delivery may be broadcast or unicast |
| Selecting Request | Client | Broadcast identifies the selected server and address |
| ACK | Server | Confirms the lease; delivery follows state and message fields |

Before it uses the address, the client checks that no other device has it, normally with an ARP request for its own new address. If a device answers, the client sends a DHCPDECLINE and starts again.

Whether the Offer and ACK are broadcast or unicast depends on the client. A client that cannot receive unicast frames before it has an address sets the **broadcast flag** in its Discover, and the server broadcasts its replies. Otherwise the server can unicast them to the client's MAC address and the offered IP address. When a relay is involved, the server sends its replies to the relay.

```diagram
{"type":"sequence","title":"Initial allocation on one LAN","caption":"This example assumes a client requesting broadcast replies; other permitted reply delivery is explained in the text.","actors":["New client","DHCP server"],"steps":[{"from":0,"to":1,"label":"Discover","note":"0.0.0.0 → 255.255.255.255; UDP 68 → 67","accent":true},{"from":1,"to":0,"label":"Offer","note":"Proposed address; broadcast in this example"},{"from":0,"to":1,"label":"Selecting Request","note":"Broadcast; requested address and selected server","accent":true},{"from":1,"to":0,"label":"ACK","note":"Accepted lease and configuration options"}]}
```

:::trap Identify which DHCPREQUEST you are reading
The Request in the initial exchange is a broadcast from `0.0.0.0`, sent before the client uses the offered address. A renewal Request is a unicast from the address the client already holds. The message name alone does not tell you its source, destination or purpose.
:::

## Follow renewal and lease expiry

A lease runs out, so a client that stays connected has to extend it. It does not repeat DORA. Two timers control what it does.

At **T1**, 50% of the lease by default, the client **renews**. It sends a DHCPREQUEST by unicast to the server that gave it the lease, with its current address in the **ciaddr** ("client IP address") field. The server answers with an ACK and the lease starts again. The client keeps using its address throughout.

If no ACK has arrived by **T2**, 87.5% of the lease, the client **rebinds**. It now broadcasts the DHCPREQUEST so that any DHCP server can answer. If the lease expires with still no answer, the client must stop using the address and start again with a Discover.

Take an eight-hour lease. T1 is at four hours and T2 at seven. The client asks its own server by unicast from hour four, asks any server by broadcast from hour seven, and gives up the address at hour eight. A server can send different timers in options **58** and **59**. If a question states them, use them.

| Message outside initial DORA | Purpose |
|---|---|
| DHCPNAK, server to client | Reject an address/configuration the server can determine is invalid |
| DHCPDECLINE, client to server | Report that the proposed address appears to be in use |
| DHCPRELEASE, client to server | Give up an allocation early |
| DHCPINFORM, client to server | Request other parameters when the client already has an address |

Renewal explains a confusing symptom. Suppose someone removes the relay configuration from a router. Clients that already hold leases keep working, and they can even renew, because a renewal is an ordinary routed unicast. Only a new client, which has to broadcast, fails. When some hosts work and others do not, ask which ones are new.

A Windows client that completes no exchange assigns itself an address in `169.254.0.0/16`. This is Automatic Private IP Addressing (APIPA), an IPv4 link-local address. It comes with no gateway and is never routed. A `169.254.x.x` address tells you the host asked for DHCP and got no lease. It does not tell you why.

## Configure an IOS DHCP server

A Cisco router can be the DHCP server for a small site. You tell it which addresses to hold back, then describe each subnet in a pool. This example serves `10.10.10.0/24`:

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

- `service dhcp` turns on the server and relay functions. It is on by default, so it matters mainly in its negated form: `no service dhcp` stops both.
- `ip dhcp excluded-address` is a global command, not a pool command. Here it holds back `.1` through `.49` for routers, servers and printers. That leaves `.50` through `.254`, which is **205 addresses**.
- `ip dhcp pool USERS` creates the pool. The name is only a label.
- `network` sets the subnet the pool serves. The server does not have to be attached to that subnet, and in this chapter it is not.
- `default-router` is the gateway the clients will use, R1's `10.10.10.1`. It is not the DHCP server's own address.
- `dns-server` tells clients where to send DNS queries. It does not make that device a DNS server.
- `lease 0 8 0` sets the lease to 0 days, 8 hours and 0 minutes. Without it, IOS uses **one day**.

The server chooses a pool by where the request came from. A client on a directly attached subnet gets the pool for that interface's subnet. A relayed client gets the pool that matches the relay's address, as the relay section explains. A returning client is normally offered the address it held before, so addresses are not always handed out in order.

Before it offers an address, the IOS server pings it. If a device replies, the server records a **conflict**, withholds that address and offers another. `show ip dhcp conflict` lists the withheld addresses. Find the device that is using the address before you clear the entry, or the duplicate returns.

An exclusion is not a reservation. It stops the server from offering an address, but it does not give that address to any particular device.

## Configure an IOS DHCP client

A router interface can be a DHCP client as well. You will see this most often on the interface that faces an internet provider, where the provider assigns the address.

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

`show ip interface brief` lists the learned address with `DHCP` in the Method column. `show dhcp lease` shows the lease time, the server and the options received; Packet Tracer does not always support it.

If the server sends a default-router option, IOS installs a default route to that gateway with administrative distance **254**. The distance is high on purpose: any default route you configure yourself, or learn from a routing protocol, is preferred over it.

In the server's binding table, a PC's client ID is normally `01` followed by its MAC address. A Cisco router's client ID is longer.

## Relay requests to another subnet

A DHCP server on every subnet does not scale, so most networks keep one central server. That creates a problem: the Discover is a broadcast, and routers do not forward broadcasts. The answer is a **DHCP relay agent**, a router that hears the broadcast on the client subnet and forwards it to the server as a unicast.

In this design R1 Gi0/0 is `10.10.10.1/24` and faces the clients. R1 Gi0/1 is `10.10.20.1/24`, and the server R2 is `10.10.20.2/24`.

```ios R1
R1# configure terminal
R1(config)# service dhcp
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip helper-address 10.10.20.2
R1(config-if)# end
R1# show ip interface gigabitethernet0/0
```

Follow a Discover through the relay:

1. The client's broadcast arrives on R1 Gi0/0, the interface that has the helper address.
2. R1 writes that interface's address, `10.10.10.1`, into the **giaddr** ("gateway IP address") field and sends the message as a unicast to `10.10.20.2`.
3. R2 reads giaddr, sees that the client is in `10.10.10.0/24` and picks the pool for that subnet. It sends the Offer to `10.10.10.1` on UDP port 67.
4. R1 receives the Offer and delivers it to the client on Gi0/0.

The Request and ACK take the same path.

```diagram
{"type":"sequence","title":"A Discover and Offer through the relay","caption":"R1 relays the broadcast as a unicast; R2 answers to giaddr.","actors":["Client","R1 relay","R2 server"],"steps":[{"from":0,"to":1,"label":"Discover","note":"Broadcast, arrives on Gi0/0","accent":true},{"from":1,"to":2,"label":"Discover, relayed","note":"Unicast to 10.10.20.2; giaddr 10.10.10.1","accent":true},{"from":2,"to":1,"label":"Offer","note":"Unicast to giaddr 10.10.10.1; pool 10.10.10.0/24"},{"from":1,"to":0,"label":"Offer","note":"Delivered on the client subnet"}]}
```

:::trap The two common relay faults
The helper address belongs on the interface that **receives** the client broadcasts. On the server-facing interface it does nothing, because no client broadcast arrives there. And the server replies to giaddr, `10.10.10.1`, so it needs a route to the client subnet. Being able to reach R1's other interface, `10.10.20.1`, is not enough.
:::

On a Layer 3 switch the client-facing interface is the SVI of the client VLAN, so the helper address goes there. By default the command forwards broadcasts to eight UDP ports, among them DHCP (67 and 68), TFTP (69) and DNS (53).

Chapter 16's DHCP snooping can add **option 82**, relay-agent information that identifies where a request entered the network. It is separate from giaddr. An IOS server rejects a request that carries option 82 while giaddr is still zero unless it is configured to trust it. This chapter's lab uses no snooping, so option 82 does not appear.

## Verify and troubleshoot

Work from the client toward the server, one stage at a time.

1. **Client.** Is the link up and the port in the right VLAN? Is the host set to use DHCP? Which address, mask, gateway and DNS server does it have? On Windows, `ipconfig /all` shows them, and `ipconfig /release` followed by `ipconfig /renew` starts a new exchange.
2. **Relay.** Is the helper address on the client-facing interface, and does it point at the server? `show ip interface gigabitethernet0/0` includes the line `Helper address is 10.10.20.2`.
3. **Server.** Is there a pool for the client's subnet? Are any addresses free? Does the server have a route back to the relay?

`show ip dhcp binding` lists the leases the server has given:

```output R2# show ip dhcp binding
IP address       Client-ID/              Lease expiration        Type
                 Hardware address/
                 User name
10.10.10.50       0100.1122.3344.55       Sep 20 2026 08:00 AM     Automatic  ← One recorded allocation, not proof of current reachability
```

`show ip dhcp pool` shows how many addresses each pool holds and how many are leased. `show ip dhcp server statistics` counts the messages of each type that the server has received and sent.

| Symptom | Likely cause | Check |
|---|---|---|
| New clients get `169.254.x.x`; clients with leases still work | Helper address missing or on the wrong interface | `show ip interface` for the client-facing interface |
| Server receives Discovers and sends Offers; client gets nothing | Server has no route to giaddr | `show ip route` on the server |
| Server receives Discovers but offers nothing | No pool for that subnet, or no free address | `show ip dhcp pool`, the exclusions, `show ip dhcp conflict` |
| Client has an address but reaches only its own subnet | Wrong `default-router` | The client's gateway and the pool |
| Client reaches addresses but not names | Wrong `dns-server` | The client's DNS setting and the pool |
| No client anywhere gets an address | `no service dhcp` on the server or relay | `show running-config` |

After you correct a pool option, existing clients keep the old value until they renew. Renew the client, then test again.

A working lease gives the host a DNS server to ask. Whether that server returns the right answer is the next chapter's subject.

## Exam focus

The current v1.1 objectives emphasize the service role and client/relay configuration. The v2.0 objective explicitly includes troubleshooting the IOS server as well. Know these facts cold:

- Servers use UDP **67** and clients UDP **68**.
- DORA is Discover, Offer, Request, Acknowledge. The client sends the Discover and the Request, both as broadcasts from `0.0.0.0`.
- Renewal at T1 (50%) is a unicast Request to the leasing server. Rebinding at T2 (87.5%) is a broadcast Request.
- `ip helper-address` goes on the client-facing Layer 3 interface and names the server.
- The relay puts its client-facing address in giaddr. The server uses giaddr to pick the pool and needs a route back to it.
- `ip dhcp excluded-address` is global. `network`, `default-router`, `dns-server` and `lease` belong to the pool. The default IOS lease is one day.
- `ip address dhcp` makes a router interface a client. Its learned default route has administrative distance 254.
- A `169.254.x.x` address means the client got no lease.
- Verify with `show ip dhcp binding`, `show ip dhcp pool`, `show ip dhcp conflict` and, on the relay, `show ip interface`.
