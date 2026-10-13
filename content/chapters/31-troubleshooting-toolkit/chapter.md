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

## Define the problem and preserve evidence

Chapter 30 established the client's adapter, address, route and resolver evidence. Now follow the same failed exchange through switches, routers and services. Reuse the MAC/ARP distinction from Chapter 7, the return-path reasoning from Chapter 18, and the timed logs and counters from Chapters 27–28 to choose a test that separates plausible causes.

:::facts
- A successful ping demonstrates a completed ICMP exchange for that source, destination, size, and time. It does not test every application.
- IOS `!` means an echo reply arrived; `.` means the wait expired; `U` reports destination-unreachable evidence. Read the response source and details before choosing a cause.
- A router-originated test can use a different source and policy path from a client's traffic.
- A traceroute `*` means no usable response arrived for that probe within the wait; it does not locate a definite forwarding failure.
- Save current counters, relevant configuration, logs, and timestamps before clearing or changing them.
:::

**Troubleshooting** is the process of testing explanations against evidence until you can restore and verify the intended service. Start by defining the symptom precisely. “The network is down” might mean one name fails, one application port is closed, a client has no address, or an entire building has lost power. Ask which users, addresses, protocols, and times are affected, what still works, and what changed. An observed change is a useful lead, not proof of responsibility.

Write down a baseline and a **hypothesis**: a proposed cause that a test could support or disprove. For example, “PC-A is in the wrong access VLAN” predicts that its learned MAC will appear in an unexpected VLAN and that the gateway will not receive its local broadcasts. “R2 lacks a return route” predicts different results when R1 uses its transit address versus its LAN address as the source.

Use a repeatable sequence: define the problem, gather evidence, choose a hypothesis, make a focused test, apply a justified correction, verify service, and document the outcome. There is no mandatory exam ritual with one uniquely correct number of steps. Avoid several simultaneous changes: if you change an address, a route, and a VLAN together, a successful retest will not tell you which was wrong.

Keep original evidence in your notes. Record the device, command, source/destination, time, and whether the clock is trustworthy. Capture sensitive configuration only in an appropriate private location. Restarting a device can erase volatile evidence; shutting an interface does not inherently clear every counter or its logging buffer. Check what a proposed action actually changes.

## Choose the next test

A **bottom-up** approach starts with power, media, and interface state. **Top-down** starts with the application. **Divide-and-conquer** chooses a useful middle test, such as an IP-address ping, and uses the result to narrow the next investigation. **Follow-the-path** checks forwarding and return delivery across the actual topology. Comparing an affected host with a working peer is useful when their intended policies match.

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

For IPv4, ICMP echo request is type **8**, echo reply type **0**. The referenced IOS basic ping defaults to **five 100-byte datagrams** with a **two-second wait**; read the actual command output because tools and options differ. Windows `ping` normally sends four requests with 32 bytes of ICMP data. IOS datagram size and a host tool's payload-size argument are different scopes: an ordinary IPv4 packet adds 20 bytes of IP header and 8 bytes of ICMP header to an echo payload.

This is representative output, not a recorded run:

```output R1# ping 10.0.20.10
Sending 5, 100-byte ICMP Echos to 10.0.20.10, timeout is 2 seconds:
.!!!!  ← one reply was not received within its wait; four were
Success rate is 80 percent (4/5)
```

An initial delay can occur during address resolution, but the period alone does not prove ARP caused it. Repeat the test and inspect the relevant ARP entry or capture. Persistent loss needs investigation even if small pings sometimes succeed. A `U` identifies an unreachable response rather than an echo reply. Its ICMP code can distinguish a reported network/host delivery problem, port unreachable, fragmentation needed, or administrative prohibition; those are reports to investigate, not a substitute for configuration evidence.

**Extended ping** lets you choose a source address owned by the router. Suppose R1's transit address is `10.0.99.1`, its client LAN address is `10.0.10.1`, and the remote server is `10.0.20.10`. The ordinary IOS test normally uses the outgoing interface address. A sourced test makes the reply destination different:

```ios
R1# ping 10.0.20.10 source 10.0.99.1
R1# ping 10.0.20.10 source 10.0.10.1
```

If only the first succeeds, inspect return routing and source-dependent policy. You have narrowed the difference; you have not yet proved a missing route. The sourced request is still router-originated and does not exercise the PC's access port or every ingress policy applied to the PC. Confirm the diagnosis with routes, captures, and a final client test.

On an image without the one-line source syntax, enter `ping` at privileged EXEC, supply the target, choose `y` for extended commands, and enter the source when prompted. Retain defaults for unrelated fields. Increasing repeat count samples more exchanges; it does not guarantee that an intermittent fault will appear. Use bounded tests.

**MTU** testing compares sizes while holding other variables steady. In IPv4, setting **DF**, Don't Fragment, prevents routers from fragmenting that packet. A received fragmentation-needed message is positive evidence of a size constraint; large-probe silence alone could also be filtering or loss. On supporting IOS, `ping 10.0.20.10 repeat 5 size 1500 df-bit` requests a 1500-byte IP datagram. Windows `ping -n 4 -l 1472 -f 10.0.20.10` requests 1472 data bytes, making 1500 with ordinary headers. Do not transfer these IPv4 arithmetic rules blindly to IPv6.

## Interpret traceroute

Traceroute sends probes with increasing **TTL**. A transit router that expires an IPv4 TTL can return ICMP **time exceeded**, type **11**, code **0**. Conventional IOS traceroute uses UDP probes toward high destination ports beginning at **33434**; reaching a closed destination port normally yields ICMP destination unreachable, type **3**, code **3**. Windows `tracert` uses echo requests and expects an echo reply from the destination. Common Linux traceroute implementations support UDP, ICMP, and TCP methods; check the installed tool and selected options.

The responding address identifies the source of an ICMP response; it is not guaranteed to be the interface that received your probe. Each reported time is a round trip for that probe. It includes processing and the reply path, which can differ from the outward path. Different probes can also follow different equal-cost routes.

```output Representative trace toward 203.0.113.10
1  10.0.99.2      1 ms  1 ms  2 ms
2  * * *  ← no usable replies for these probes
3  203.0.113.10   4 ms  4 ms  5 ms  ← later probes received destination replies
```

The middle stars do not prove a broken link. Filtering, response rate limits, return-path behavior, and load sharing can affect what appears. Nor do the later replies certify application performance. If all later hops are silent, inspect the last known path and both directions, but do not label that last responding device as the culprit without further evidence. Compare the trace's actual source and probe protocol with the affected application.

:::trap A received TTL is not a hop count
A reply with TTL 126 has an unknown initial TTL unless you have independent evidence of the sender's setting. You cannot infer “two routers” merely by assuming it started at 128. Even a known difference describes that packet's return path, not necessarily the request path.
:::

## Interfaces, counters, MAC and ARP tables

Read interface state before interpreting counters. On routed Ethernet, `administratively down` identifies the local administrative shutdown state; `down/down` directs attention toward link and peer availability. `up/up` confirms those operational states but does not certify configuration or service. `up/down` requires interface-type-specific investigation rather than one universal explanation. On switches, `err-disabled` calls for the recorded protection/error cause; `inactive` can indicate an unavailable access VLAN. Consult the VLAN state and intended design before enabling or moving a port.

Compare counters over a known interval. If CRC increases from 120 to 145 during one minute, **25 new errors** occurred; 145 old errors over months is different evidence. CRC/FCS errors indicate received corruption, not its unique cause. Inspect cables, optics where applicable, both endpoints, and negotiated settings. On a 100-Mb/s link, displayed half duplex at one end and full at the other directly establishes a duplex mismatch. Late collisions support that diagnosis on the half-duplex side but can have other causes. A few clean input counters do not certify the cable.

Runts and giants refer to sizes outside what the interface accepts; exact giant thresholds and tagged-frame counting depend on platform and configuration. Output drops indicate discarded outgoing traffic, often queue pressure; compare traffic and queue evidence. Do not diagnose every drop as a bad cable. Correct the demonstrated cause, then compare fresh counter increments. Preserve the original snapshot before an approved `clear counters`.

The **MAC address table** maps a VLAN/MAC to a learned switch port. The **ARP table** maps an IPv4 neighbor to a link-layer address. They answer different questions. A learned MAC proves source frames were observed, not that the host has the right IP address. A missing entry can reflect aging, a reset, filtering, or lack of recent relevant traffic. Use the configured aging policy rather than memorizing one global timer. An incomplete ARP entry means resolution is not complete at this observation; it does not prove the neighbor never replied in the past.

## Logs and device operations

Use `show logging` to inspect enabled destinations, thresholds, and buffered events. On an image supporting output filters, `show logging | include LINK` displays only lines containing `LINK`: the pipe passes the output to a display filter and does not change logging policy. Read the complete output when context or simulator support requires it. A message commonly contains `%FACILITY-SEVERITY-MNEMONIC: text`. Lower severity numbers are more severe: **0 emergency, 1 alert, 2 critical, 3 error, 4 warning, 5 notification, 6 informational, 7 debugging**. A threshold of warnings selects levels 0–4 for that destination; selection does not prove delivery to the remote collector.

```output Representative relevant log lines
Sep 20 10:15:01: %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down  ← link event, severity 3
Sep 20 10:15:02: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to down  ← separate severity-5 event
```

A log can correlate a symptom with an event, but a down message does not uniquely identify a cable pull. Check both ends and current configuration. A timestamp with `*` on documented IOS displays indicates an unauthoritative clock; it does not establish one specific missing NTP command. Compare synchronization and clock adjustments before ordering events across devices.

`show version` helps identify software, uptime, and reported reload information. CPU and memory displays help assess device load; compare a sustained trend with a baseline instead of treating one busy instant as the cause. Exact environmental commands depend on the model. A historical CDP neighbor may remain until aging, and a reboot can remove evidence.

For a controlled lab, configure a bounded log buffer with `logging buffered 16384 informational`. `terminal monitor` requests eligible log/debug output in the current remote terminal; logging destination settings still matter. Debugging can affect device resources and expose sensitive details. Use a focused supported debug only when needed, then stop it with `undebug all`. Capture existing evidence before clearing logs.

## Reading packet captures

A **packet capture** records traffic visible at its collection point. First identify the interface, direction, filter, time range, and whether packets were dropped by the capture mechanism. Absence from one capture is not proof of absence everywhere. Packet Tracer Simulation mode displays simulated PDUs; a real capture may come from a switch mirror port or a router capture facility. Their setup syntax is platform-specific and is not the core recall task here.

For ARP, ask which next-hop IP is being resolved and whether its request and reply are visible. For a remote destination, a host normally resolves its gateway, not the remote server. For DHCP, follow the transaction between the client subnet, relay, and server; a missing Offer narrows the failed stage but does not uniquely prove exhaustion. For DNS, a received NXDOMAIN is a negative name result; SERVFAIL reports inability to complete resolution. A timeout contains no such answer. A completed NODATA result lacks the requested type. Consult Chapter 25 for aliases, caching, and authoritative dependencies.

For TCP, distinguish a successful handshake, a reset, and unanswered requests. SYN/SYN-ACK/ACK establishes the connection; it does not prove HTTP or another application subsequently succeeds. A matching RST reports an active rejection/reset, possibly generated by the endpoint or an intermediary. Use a server-side capture and service status before asserting which device generated it. Repeated SYNs without replies leave both forward and return delivery uncertain.

Wireshark's retransmission and duplicate-ACK labels are analysis based on captured sequence history. Loss is a common explanation, but reordering, incomplete captures, and duplicated capture paths can affect labels. Compare both directions and the same flow. Avoid turning a label into an unsupported accusation against one link.

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

- Match a test to the question it can answer; do not certify every layer from one successful ping.
- Compare source addresses and return destinations when a router works but its clients fail.
- Read ping/traceroute responses as evidence with scope and limitations.
- Combine interface state, current configuration, counter changes, MAC/ARP entries, and relevant logs.
- Interpret capture flows and distinguish a received error from silence.
- Verify the repaired application from the affected client and retain useful notes.
