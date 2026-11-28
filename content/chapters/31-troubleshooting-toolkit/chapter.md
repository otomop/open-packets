---
id: troubleshooting-toolkit
number: 31
title: Troubleshooting toolkit
subtitle: Use tests, tables, logs, and captures to distinguish evidence from a diagnosis.
part: services
domain: switching
minutes: { lesson: 70, lab: 85 }
summary: Investigate a two-way network path, compare ordinary and sourced tests, interpret interface and capture evidence, and verify a repair from the affected client.
objectives:
  v1: ["1.4", "4.5"]
  v2: ["2.4"]
prereqs: [static-routing-ipv4, cdp-lldp, tcp-udp-ports, dhcp, dns, ntp-syslog-snmp, client-os-troubleshooting, qos]
sectionIds:
  "Define the problem and preserve evidence": why-you-need-a-method
  "Choose the next test": layer-by-layer
  "Interpret traceroute": traceroute-on-ios-windows-and-linux
  "Work through a complete diagnosis": verify-and-troubleshoot-a-fault-walk
sources:
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: Extended ping and extended traceroute", url: "https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13730-ext-ping-trace.html" }
  - { title: "Cisco: Catalyst interface troubleshooting", url: "https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6500-series-switches/17053-46.html" }
  - { title: "Cisco: IOS XE system message logging", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-15/configuration_guide/sys_mgmt/b_1715_sys_mgmt_9300_cg/configuring_system_message_logs.html" }
  - { title: "RFC 792: ICMP", url: "https://www.rfc-editor.org/rfc/rfc792.html" }
  - { title: "RFC 9110: HTTP response semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html#section-15.6.4" }
  - { title: "RFC 9293: TCP", url: "https://www.rfc-editor.org/rfc/rfc9293.html" }
  - { title: "Microsoft: tracert", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert" }
  - { title: "Microsoft: ping", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ping" }
  - { title: "Wireshark: TCP analysis", url: "https://www.wireshark.org/docs/wsug_html_chunked/ChAdvTCPAnalysis.html" }
  - { title: "RFC 2131: DHCP", url: "https://www.rfc-editor.org/rfc/rfc2131.html" }
  - { title: "RFC 2308: DNS negative caching", url: "https://www.rfc-editor.org/rfc/rfc2308.html" }
---

A user in one building cannot open an application on a server in another. You checked the client's own settings in chapter 30 and they are correct, so the fault is somewhere along the path: a switch port in the wrong VLAN, an interface that is down or taking errors, a router with no route back, or a service giving the wrong answer. You cannot watch a packet being dropped. You can only run tests and read tables, and each tool shows one small part of the path.

This chapter is about choosing the tool that answers the question in front of you and reading its output correctly. You will use ping and traceroute, interface status and error counters, the MAC and ARP tables, syslog messages and packet captures, building on the switching, routing and logging chapters. By the end you will be able to take a vague report, narrow it to one device and one cause, fix it, and prove the fix from the client that complained.

## Define the problem and preserve evidence

:::facts
- A successful ping demonstrates a completed ICMP exchange for that source, destination, size, and time. It does not test every application.
- IOS `!` means an echo reply arrived; `.` means the wait expired; `U` reports destination-unreachable evidence. Read the response source and details before choosing a cause.
- A router-originated test can use a different source and policy path from a client's traffic.
- A traceroute `*` means no usable response arrived for that probe within the wait; it does not locate a definite forwarding failure.
- Save current counters, relevant configuration, logs, and timestamps before clearing or changing them.
:::

**Troubleshooting** is the process of testing explanations against evidence until you can restore and verify the intended service. Start by defining the symptom precisely. “The network is down” might mean one name fails, one application port is closed, a client has no address, or an entire building has lost power. Ask which users, addresses, protocols, and times are affected, what still works, and what changed. An observed change is a useful lead, not proof of responsibility.

Write down a baseline and a **hypothesis**: a proposed cause that a test could support or disprove. For example, “PC-A is in the wrong access VLAN” predicts that its learned MAC will appear in an unexpected VLAN and that the gateway will not receive its local broadcasts. “R2 lacks a return route” predicts different results when R1 uses its transit address versus its LAN address as the source.

Use a repeatable sequence: define the problem, gather evidence, choose a hypothesis, make a focused test, apply a justified correction, verify service, and document the outcome. Make one change at a time: if you change an address, a route, and a VLAN together, a successful retest will not tell you which was wrong.

Save the evidence before you change anything: the device, the command, its output and the time. A reload erases the counters and the log buffer, and with them the record of what went wrong.

## Choose the next test

You rarely have time to check every layer on every device, so pick a starting point that rules out the most with one test. A **bottom-up** approach starts with power, media, and interface state. **Top-down** starts with the application. **Divide-and-conquer** chooses a useful middle test, such as an IP-address ping, and uses the result to narrow the next investigation. **Follow-the-path** checks forwarding and return delivery across the actual topology. Comparing an affected host with a working peer is useful when their intended policies match.

| Evidence wanted | Useful check | What it does not establish |
|---|---|---|
| Client configuration | Windows `ipconfig /all`; the appropriate macOS/Linux address and route displays | Whether an assigned gateway is reachable |
| Physical and link state | `show ip interface brief`, `show interfaces`, switch `show interfaces status` | Correct VLAN, subnet, or application policy |
| Layer 2 membership | VLAN, trunk, STP, and MAC-table displays | Correct host IP configuration |
| Forwarding decision | Route lookup for the destination, then the return destination | Whether every forwarding policy permits the flow |
| Application dependency | Exact-name DNS query, then the intended service test | Health of unrelated names or services |

A useful test answers a specific question. If an IP ping works but a browser fails, inspect the name, returned address, transport connection, and service. If a gateway ping fails, also check whether that gateway permits ICMP: a router can forward client traffic while declining to answer its own echo requests. Keep packet forwarding and responses generated by the device separate.

```diagram
{"type":"sequence","title":"Request and reply need separate paths","caption":"These are logical endpoints; each direction must have usable forwarding and permitted traffic.","actors":["PC-A 10.0.10.50","R1","R2","SRV 10.0.20.10"],"steps":[{"from":0,"to":1,"label":"Request to remote server","accent":true},{"from":1,"to":2,"label":"Route toward 10.0.20.0/24"},{"from":2,"to":3,"label":"Deliver on server LAN"},{"from":3,"to":2,"label":"Reply to 10.0.10.50","accent":true},{"from":2,"to":1,"label":"Need route toward 10.0.10.0/24"},{"from":1,"to":0,"label":"Deliver reply to client"}]}
```

## Ping and extended ping

Ping answers one question: can an ICMP echo request reach this address, and can the reply get back? In IPv4 the echo request is ICMP type **8** and the echo reply is type **0**. IOS `ping` sends **five 100-byte packets** by default and waits **two seconds** for each reply. Windows `ping` sends four requests with 32 bytes of data. The two sizes are counted differently: the IOS figure is the whole IP packet, while the Windows figure is only the ICMP data, before the 8-byte ICMP header and 20-byte IP header are added.

Typical output:

```output R1# ping 10.0.20.10
Sending 5, 100-byte ICMP Echos to 10.0.20.10, timeout is 2 seconds:
.!!!!  ← one reply was not received within its wait; four were
Success rate is 80 percent (4/5)
```

IOS prints one character per probe: `!` for a reply, `.` for no reply within the timeout, and `U` for an ICMP destination unreachable message sent back by a router. A single period at the start, as here, is common: the first packet was dropped while a device on the path used ARP to learn a next-hop MAC address. Run the ping again. `!!!!!` confirms it was ARP; loss on the second run is a real problem. A `U` means some router could not forward the packet, usually because it has no route to the destination or a filter forbids it. The ICMP code inside the message says which.

**Extended ping** lets you choose a source address owned by the router. Suppose R1's transit address is `10.0.99.1`, its client LAN address is `10.0.10.1`, and the remote server is `10.0.20.10`. The ordinary IOS test normally uses the outgoing interface address. A sourced test makes the reply destination different:

```ios
R1# ping 10.0.20.10 source 10.0.99.1
R1# ping 10.0.20.10 source 10.0.10.1
```

Both pings take the same forward path. What differs is where the reply has to go. The server answers the first ping to 10.0.99.1, on a subnet R2 is directly connected to. It answers the second to 10.0.10.1, which R2 can reach only with a route to 10.0.10.0/24. If the first works and the second fails, check R2's route back to the client LAN. This is how a router can ping a server that its own clients cannot reach. A sourced ping still starts at the router and skips the PC's switch port, so finish with a test from the PC.

If an image lacks the one-line form, enter `ping` alone at privileged EXEC, answer `y` to “Extended commands” and type the source address when asked. Accept the defaults for the other prompts.

**MTU** testing compares sizes while holding other variables steady. In IPv4, setting **DF**, Don't Fragment, prevents routers from fragmenting that packet. A received fragmentation-needed message is positive evidence of a size constraint; large-probe silence alone could also be filtering or loss. On supporting IOS, `ping 10.0.20.10 repeat 5 size 1500 df-bit` requests a 1500-byte IP datagram. Windows `ping -n 4 -l 1472 -f 10.0.20.10` requests 1472 data bytes, making 1500 with ordinary headers.
## Interpret traceroute

Ping tells you whether the far end answers; traceroute tells you which routers are on the way. It sends probes with **TTL** 1, then 2, then 3, and so on. Each router subtracts one from the TTL, and the router that brings it to zero discards the packet and returns ICMP **time exceeded**, type **11**, code **0**, which reveals that router's address. Conventional IOS traceroute uses UDP probes toward high destination ports beginning at **33434**; reaching a closed destination port normally yields ICMP destination unreachable, type **3**, code **3**. Windows `tracert` uses echo requests and expects an echo reply from the destination. Common Linux traceroute implementations support UDP, ICMP, and TCP methods; check the installed tool and selected options.

The responding address identifies the source of an ICMP response; it is not guaranteed to be the interface that received your probe. Each reported time is a round trip for that probe. It includes processing and the reply path, which can differ from the outward path. Different probes can also follow different equal-cost routes.

```output Representative trace toward 203.0.113.10
1  10.0.99.2      1 ms  1 ms  2 ms
2  * * *  ← no usable replies for these probes
3  203.0.113.10   4 ms  4 ms  5 ms  ← later probes received destination replies
```

The stars at hop 2 do not mean a broken link, because hop 3 answered. That router forwards packets but does not send ICMP replies, or limits how many it sends. If every hop after a certain point is silent, the fault lies at or beyond the last router that answered, on either the forward or the return path.

:::trap A received TTL is not a hop count
A reply with TTL 126 has an unknown initial TTL unless you have independent evidence of the sender's setting. You cannot infer “two routers” merely by assuming it started at 128. Even a known difference describes that packet's return path, not necessarily the request path.
:::

## Interfaces, counters, MAC and ARP tables

Start with the two status words that `show ip interface brief` and `show interfaces` print for every interface. The first is the line status (Layer 1) and the second is the line protocol (Layer 2).

| Status / protocol | Meaning | Check |
|---|---|---|
| administratively down / down | `shutdown` is configured on this interface | Enter `no shutdown` |
| down / down | No signal from the other end | Cable, peer powered off or shut down, speed mismatch |
| up / down | Signal present, Layer 2 not working | Rare on Ethernet; encapsulation mismatch on serial links |
| up / up | The link works | Counters, VLAN, addressing |

On a switch, `show interfaces status` adds two more states. `err-disabled` means a protection feature such as port security shut the port; find and fix the cause before you re-enable it. `inactive` means the port's access VLAN does not exist on the switch.

An interface that is up/up can still lose traffic, and the counters in `show interfaces` show how. Counters accumulate from the last reboot or `clear counters`, so read them twice and compare. If CRC goes from 120 to 145 in one minute, **25 new errors** occurred; a total of 145 that has not moved in months is history.

**CRC** errors count received frames whose checksum failed because the frame was damaged on the way: a bad cable or connector, interference, or a duplex mismatch. **Collisions** are normal on a half-duplex link. **Late collisions**, detected after the first 64 bytes of a frame, should not happen on a healthy link and are the classic sign of a duplex mismatch. **Runts** are frames shorter than the 64-byte Ethernet minimum, often the pieces left by collisions; **giants** are longer than the interface accepts. **Output drops** count packets discarded because the output queue was full, which points to congestion, not to a cable.

A **duplex mismatch** usually arises when one end is hard-set to full duplex with autonegotiation off and the other end is left on auto. The auto end can sense the speed but receives no duplex information, so at 10 or 100 Mb/s it falls back to half duplex. The link stays up/up and performs badly: the half-duplex end counts collisions and late collisions, and the full-duplex end counts CRC errors and runts. A **speed mismatch** usually takes the link down/down instead. Fix either by configuring both ends the same way: both auto, or both the same fixed `speed` and `duplex`. Then check that the counters have stopped rising.

The **MAC address table** on a switch maps a MAC address and VLAN to the port where the switch saw that address as a source. The **ARP table** on a router or host maps an IPv4 address to a MAC address. Use them together to find where a host is attached: read its MAC address from the router's `show arp`, then look that address up in `show mac address-table` on the switch. An entry in the wrong VLAN or on an unexpected port is your finding. Dynamic MAC entries age out after 300 seconds without traffic by default, so a missing entry may only mean the host has been quiet; ping it and look again. An ARP entry shown as `Incomplete` means the router sent a request and has had no reply.

## Logs and device operations

Counters tell you what is happening now; logs tell you when something changed. `show logging` shows where the device sends log messages, the severity threshold for each destination, and the messages held in its buffer. To find one kind of event, filter the output: `show logging | include LINK` prints only the lines containing `LINK`. Each message has the form `%FACILITY-SEVERITY-MNEMONIC: text`. Lower severity numbers are more severe: **0 emergency, 1 alert, 2 critical, 3 error, 4 warning, 5 notification, 6 informational, 7 debugging**. A threshold includes its own level and every more severe one, so `warnings` selects levels 0–4.

```output Representative relevant log lines
Sep 20 10:15:01: %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down  ← link event, severity 3
Sep 20 10:15:02: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to down  ← separate severity-5 event
```

These two messages arrive as a pair when a link drops: the interface went down (severity 3), then its line protocol (severity 5). They tell you when, not why, so check both ends of the link. A `*` before a timestamp means the device's clock is not synchronized, so do not compare its times with another device's. `show version` adds the uptime and the reason for the last reload, which tells you whether the device restarted during the outage.

`logging buffered 16384 informational` keeps messages of severity 0–6 in a 16,384-byte memory buffer. Log messages appear on the console by default but not in an SSH or Telnet session; `terminal monitor` turns them on for your session. `debug` output is severity 7 and can overload a busy router, so debug one thing at a time and stop with `undebug all`.

## Reading packet captures

A **packet capture** shows the packets that passed one point, so it settles what was actually sent. Note where it was taken and with what filter: a packet missing from one capture may have taken another path. Packet Tracer's Simulation mode shows simulated packets in the same way; on real equipment a capture comes from a switch mirror port or the router's own capture feature.

In a capture, look for the reply to each request. For ARP, a host sending to another subnet should be asking for its gateway's MAC address, not the remote server's. For DHCP, find which of the four messages is missing: a Discover with no Offer points at the server or the relay. For DNS, NXDOMAIN means the name does not exist, SERVFAIL means the server could not complete the lookup, and no answer at all is a timeout.

For TCP, distinguish a successful handshake, a reset, and unanswered requests. SYN/SYN-ACK/ACK establishes the connection; it does not prove HTTP or another application subsequently succeeds. A matching RST reports an active rejection/reset, possibly generated by the endpoint or an intermediary. Use a server-side capture and service status before asserting which device generated it. Repeated SYNs without replies leave both forward and return delivery uncertain.

Wireshark labels such as *retransmission* and *duplicate ACK* usually point to packet loss, but an incomplete capture produces the same labels, so check a second capture point before you blame a link.

## Work through a complete diagnosis

PC-A can ping `10.0.10.1` but cannot reach server `10.0.20.10`. R1's transit-source test succeeds; its `10.0.10.1` source test fails. First record those different sources. Then inspect R2's route lookup for `10.0.10.1` and `10.0.10.50`, its default route, and any more-specific entry.

Suppose R2 has only connected `10.0.99.0/30` and `10.0.20.0/24` routes, no default, and no policy routing. Now the route evidence establishes the missing return path. R1's successful ordinary ping was consistent with R2's connected transit route. Restore the intended route on R2:

```ios
R2# configure terminal
R2(config)# ip route 10.0.10.0 255.255.255.0 10.0.99.1
R2(config)# end
R2# show ip route 10.0.10.50
```

Repeat the sourced test, then test from PC-A by address, exact name, and actual application. If the name returns a wrong address, that is an additional problem; a successful route repair should not hide it. Record the missing route, the evidence, the command applied, and the client verification. Save only the verified intended configuration.

## Exam focus

- IOS ping symbols: `!` reply, `.` timeout, `U` destination unreachable. Defaults: five 100-byte packets, two-second timeout.
- Traceroute raises the TTL one hop at a time and routers answer with ICMP time exceeded. IOS probes with UDP; Windows `tracert` probes with ICMP echo. A row of `* * *` followed by later replies is not a break.
- When a router can ping a server but its clients cannot, use `ping … source` and check the return route.
- Interface status pairs: administratively down/down, down/down, up/down, up/up. Switch ports add `err-disabled` and `inactive`.
- Duplex mismatch: link up, late collisions on the half-duplex end, CRC errors and runts on the full-duplex end. Speed mismatch: link down.
- Syslog severities 0–7 by name and number; a threshold includes that level and all more severe ones.
- A ping that works proves ICMP reachability only. After any fix, retest the original application from the affected client.
