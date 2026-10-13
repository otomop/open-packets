---
id: tcp-udp-ports
number: 6
title: "TCP, UDP & ports"
subtitle: How transport protocols deliver application data and identify the service at each end.
part: foundations
domain: infra
minutes: { lesson: 60, lab: 50 }
summary: Compare TCP and UDP, follow connections and DNS exchanges, interpret ports and acknowledgments, and distinguish network reachability from application availability.
objectives:
  v1: ["1.5"]
  v2: []
prereqs: [network-models, components-and-topologies, ipv4-addressing]
sources:
  - { title: "IETF RFC 9293: Transmission Control Protocol", url: "https://www.rfc-editor.org/rfc/rfc9293.html" }
  - { title: "IETF RFC 1122: TCP push is not a record marker", url: "https://www.rfc-editor.org/rfc/rfc1122.html" }
  - { title: "IETF RFC 768: User Datagram Protocol", url: "https://www.rfc-editor.org/rfc/rfc768.html" }
  - { title: "IETF RFC 8085: UDP Usage Guidelines", url: "https://www.rfc-editor.org/rfc/rfc8085.html" }
  - { title: "IETF RFC 5681: TCP Congestion Control", url: "https://www.rfc-editor.org/rfc/rfc5681.html" }
  - { title: "IANA: Service Name and Transport Protocol Port Number Registry", url: "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml" }
  - { title: "IETF RFC 6335: Service Names and Port Numbers", url: "https://www.rfc-editor.org/rfc/rfc6335.html" }
  - { title: "IETF RFC 7766: DNS Transport over TCP", url: "https://www.rfc-editor.org/rfc/rfc7766.html" }
  - { title: "IETF RFC 959: File Transfer Protocol", url: "https://www.rfc-editor.org/rfc/rfc959.html" }
  - { title: "IETF RFC 1350: TFTP Protocol", url: "https://www.rfc-editor.org/rfc/rfc1350.html" }
  - { title: "IETF RFC 2131: Dynamic Host Configuration Protocol", url: "https://www.rfc-editor.org/rfc/rfc2131.html" }
  - { title: "IETF RFC 9114: HTTP/3", url: "https://www.rfc-editor.org/rfc/rfc9114.html" }
  - { title: "Cisco: Configuring TCP, IOS XE 17", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_iap-tcp_for_xe.html" }
  - { title: "Microsoft: netstat", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netstat" }
  - { title: "Microsoft: nslookup", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup" }
  - { title: "Microsoft: arp", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/arp" }
  - { title: "Microsoft: Test-NetConnection", url: "https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection" }
  - { title: "IETF RFC 2606: Reserved example/test domains", url: "https://www.rfc-editor.org/rfc/rfc2606.html" }
---

A PC can browse a website, request a DNS answer, and maintain a remote management session at the same time. IP addresses identify the endpoints, but they do not identify which application should receive each piece of data. Transport protocols provide that distinction and determine what happens when data is lost or arrives out of order. This chapter develops those ideas before you use ports in access lists, NAT, and network services.

Reuse Chapter 02's separate ping and web tests and Chapter 04's local-subnet reasoning. The transport lab keeps its endpoints in one supplied /24 so you can concentrate on what happens after IP delivery. A new TCP or UDP port does not create a new IP subnet or require a different gateway.

## Why IP alone is not enough

**IP** provides best-effort packet delivery. A packet can be lost, delayed, duplicated, or delivered after a packet sent later. IP does not promise to recover a missing part of a file for an application. A transport service must either provide that recovery or leave the application responsible for deciding what to do.

**TCP**, the Transmission Control Protocol, provides a reliable, ordered **byte stream** between applications. It establishes a connection, numbers the bytes, acknowledges received data, and retransmits when necessary. **UDP**, the User Datagram Protocol, sends individual **datagrams** without establishing a transport connection or providing its own acknowledgments and retransmissions. Both identify application endpoints with source and destination ports.

:::facts
- TCP provides connection establishment, ordered byte delivery, loss recovery, and flow control. Its minimum header is **20 bytes**.
- UDP preserves datagram boundaries and provides no transport-level delivery or ordering guarantee. Its header is **8 bytes**.
- Each TCP or UDP port field is **16 bits**: numerical values run from `0` to `65535`. Port `0` is reserved, not a normal service destination.
- TCP and UDP have separate port spaces. `TCP 53` and `UDP 53` are different transport endpoints.
- An ordinary TCP opening is **SYN → SYN/ACK → ACK**. ICMP echo traffic does not perform this handshake and has no TCP or UDP ports.
:::

Reliability does not mean that TCP can overcome an indefinite outage. If the path remains unavailable, the connection can fail and the application must handle that failure. Nor does a TCP acknowledgment prove that a business transaction was completed: it acknowledges transport data, not that the server saved a file or accepted an order. Keep transport delivery and application success separate when interpreting tests.

The CCNA v1.1 objective is to **compare TCP to UDP**. Learn the behavior well enough to explain a capture and choose an appropriate test. The header details below support that understanding; memorizing congestion algorithms or operating-system timer defaults is unnecessary for this foundation.

## Ports, sockets and multiplexing

A **port number** identifies a transport endpoint within a host. A server usually waits on a known service port, while a client chooses a temporary **ephemeral port** for its end of an exchange. For example, a client at `192.168.40.10` could connect from TCP port `51514` to `192.168.40.20` on TCP port `80`. The server's reply reverses the source and destination addresses and ports.

| Direction | Source endpoint | Destination endpoint |
|---|---|---|
| Client request | `192.168.40.10:51514` | `192.168.40.20:80` |
| Server reply | `192.168.40.20:80` | `192.168.40.10:51514` |

The **five-tuple** consists of transport protocol, source IP address, source port, destination IP address, and destination port. It distinguishes conversations for packet analysis and traffic policy. For two simultaneous TCP connections using the same client IP, server IP, and server port, the client ports distinguish the connections. Do not equate connections with browser tabs: modern applications can carry multiple requests over a shared connection.

The term **socket** refers to an application endpoint exposed by the operating system. In diagrams you will often see it represented as an IP address and port, with the transport understood from context. A TCP connection joins two endpoints. Thousands of clients can therefore connect to one server port without requiring a different listening port for each client.

| IANA range | Numbers | Meaning |
|---|---|---|
| System, also called well-known | `0–1023` | Familiar assignments such as SSH `22` and DNS `53` |
| User, also called registered | `1024–49151` | Additional registered application services |
| Dynamic/private | `49152–65535` | Available for dynamic use; IANA does not assign individual services here |

These are registry categories, not a rule that every operating system must choose ephemeral ports from the final range. Selection ranges and policies vary. The important capture-reading skill is recognizing which endpoint initiated an exchange and which port identifies the requested service. A low port is a useful clue, not proof of the application's identity.

:::trap A port assignment is not an application test
Traffic to TCP `443` is consistent with HTTPS, but another program can use that port. **TLS (Transport Layer Security)** establishes a protected exchange above the transport; HTTPS is HTTP carried over such protection. A successful TCP connection does not prove that TLS negotiation, authentication, or the requested page works. Read ports together with the protocol exchange and the application's result.
:::

## Two headers, two philosophies

TCP carries more control information because it performs more work. Its header includes source and destination ports, sequence and acknowledgment numbers, control flags, an advertised receive window, and a checksum. Options can extend the header beyond its 20-byte minimum. UDP contains four 16-bit fields: source port, destination port, length, and checksum; the length includes both its header and data.

| Property | TCP | UDP |
|---|---|---|
| Data presented to application | Ordered stream of bytes | Separate datagrams |
| Opening exchange | Establishes connection state | No UDP handshake |
| Missing data | TCP can detect loss and retransmit | UDP itself does not recover it |
| Ordering and duplicates | TCP orders bytes and handles duplicates | Application handles these if needed |
| Receiver flow control | Advertised receive window | No equivalent UDP window |
| Examples in this course | SSH, HTTP over TCP, FTP | DHCP, NTP, ordinary DNS over UDP |

**Byte stream** is an important qualification. If an application writes 200 bytes and then 300 bytes, TCP may carry them in one segment or several. The receiving application uses its own message format to determine where a request ends. The PSH flag does not create a message boundary, and a segment boundary does not reliably identify a complete application message.

With UDP, the application supplies a datagram and the receiver is given a datagram, if it arrives. UDP has no sequence-number field with which to order several datagrams. However, an application can put its own identifiers in the data, detect missing messages, and retry. TFTP uses UDP and implements acknowledgments and retransmission above it. “UDP application” therefore does not mean “application incapable of reliable transfer.”

Neither TCP nor UDP inherently encrypts application data. SSH and TLS provide security above the underlying transport; a TCP checksum detects errors rather than protecting against an attacker. UDP's small header also does not establish that every UDP application is faster. Performance depends on application design, network conditions, and mechanisms built above UDP.

## Opening and closing a connection

A TCP server first needs a **listening** endpoint. The client sends a segment with **SYN** set to request synchronization of sequence numbers. The server replies with SYN and **ACK**, acknowledging the client's **initial sequence number (ISN)** and supplying its own. The client then acknowledges the server's SYN. Data exchange can follow once the connection is established.

```diagram
{ "type": "sequence", "title": "Fig 6.1 — An ordinary TCP opening", "actors": ["Client · port 51514", "Server · port 80"],
  "steps": [
    { "from": 0, "to": 1, "label": "SYN · seq 1000", "note": "Client proposes its initial sequence number", "accent": true },
    { "from": 1, "to": 0, "label": "SYN, ACK · seq 5000 · ack 1001", "note": "Server acknowledges the client and supplies its own number" },
    { "from": 0, "to": 1, "label": "ACK · seq 1001 · ack 5001", "note": "Client acknowledges the server's SYN", "accent": true }
  ], "caption": "These are illustrative absolute sequence numbers; each SYN consumes one sequence number." }
```

The **sequence number** identifies a position in one direction's byte stream. The **acknowledgment number** states the next byte expected in the other direction. Here, the first client data byte is numbered `1001`. A segment containing 200 data bytes occupies `1001–1200`, so successful in-order reception is acknowledged with `1201`. The directions have independent numbering: do not add the server's starting value to the client's.

ACK does not mean “I received one packet.” Acknowledgments are **cumulative**: acknowledgment `1201` says all preceding stream bytes through `1200` have been received, with no earlier gap remaining. They may originally have arrived out of order. An ACK-only segment consumes no data sequence space. SYN and **FIN** each consume one sequence number, even when no application data accompanies them. These rules are enough to work introductory sequence examples without studying the entire TCP state machine.

A normal close uses FIN to say that one endpoint has no more bytes to send. Each direction closes separately, and acknowledgments are required; the server can still finish sending after the client closes its sending direction. Textbooks often draw four segments, but an acknowledgment and FIN can be combined, so four is not a mandatory packet count. **RST** resets a connection or rejects an attempt rather than carrying out an orderly close.

If a SYN receives a reset, the attempt was actively rejected. A closed listening port is one possible cause, but a security device can also generate a reset. If no response appears, the capture alone does not identify whether the request was filtered, the destination was unavailable, or the reply was lost. Use evidence from both endpoints or intermediate devices before selecting a cause.

## Windowing, flow control and congestion control

TCP does not have to stop after every data segment and wait for an individual acknowledgment. It can have multiple bytes outstanding while acknowledgments return. **Windowing** describes this controlled amount of data in flight. It allows useful throughput while still limiting what the sender may send.

**Flow control** protects the receiving endpoint. The receiver advertises how much additional data it is prepared to accept, based on available receive capacity. A small receive window can limit the sender even on an otherwise fast network. A zero advertised window tells the sender that the receiver cannot currently accept additional stream data; this differs from a failed cable or an unknown destination.

**Congestion control** concerns the network path. The sender limits traffic in response to indications of congestion, such as loss or explicit congestion signaling. It must respect both receiver capacity and its congestion-control limit. A larger receive window therefore does not permit sending without regard to network conditions. Detailed algorithms and window-scaling calculations are beyond the comparison required here.

Consider data bytes `1001–1100`, `1101–1200`, and `1201–1300`. If the middle range is lost, later data does not make the gap disappear: the cumulative acknowledgment remains `1101`. TCP can retransmit missing data after detecting loss, including through a retransmission timeout. Once the gap is filled and all three ranges are present, an acknowledgment can advance to `1301`. The application receives an ordered stream rather than a file with an unexplained missing section.

This recovery has a cost: later bytes can wait behind missing earlier bytes. An interactive voice application may prefer to discard a late audio sample rather than delay later samples. That helps explain why many media systems use UDP-based transport, but it is not a universal rule for video or voice. The application chooses whether to retry, conceal loss, adjust its rate, or use another transport above UDP.

## Which application uses which transport, and why

Learn these ports with the services they identify. They recur in management, services, security, and troubleshooting tasks. This table describes conventional transports used in the course, not every registered or modern variant. On a real system, confirm the configured service and transport before writing a firewall rule.

| Service | Conventional transport and ports | Meaning |
|---|---|---|
| FTP | TCP `21`; active data typically TCP `20` | Separate control/data connections; passive data uses a server-selected port |
| SSH / Telnet | TCP `22` / TCP `23` | Remote CLI; SSH protects the session, Telnet does not |
| SMTP | TCP `25` | Server-to-server mail transfer; useful TCP example |
| TACACS+ | TCP `49` | Device administration AAA |
| DNS | UDP **and** TCP `53` | Both transports support DNS queries |
| DHCPv4 | UDP `67` server, `68` client | Initial address discovery can be broadcast |
| TFTP | UDP `69` for the initial request | Server selects another transfer port for the exchange |
| HTTP / HTTPS | TCP `80` / TCP `443` | Conventional web traffic; HTTP/3 uses QUIC over UDP |
| NTP | UDP `123` | Time synchronization |
| SNMP | UDP `161` agent, `162` notification receiver | Management queries and notifications |
| Syslog | UDP `514` in the conventional UDP transport | Other transports exist; UDP itself does not acknowledge delivery |
| RADIUS | UDP `1812` authentication, `1813` accounting | Conventional AAA transport |

These service names are a map for later study. **AAA** means authentication (who is connecting), authorization (what they may do) and accounting (records of activity); Chapter 33 develops it. NTP supplies common time, SNMP supports management queries and notifications, and syslog carries event messages; Chapter 27 explains their operation. Here, use the stated service and transport to read an exchange rather than assuming how to configure its server.

For the lab's DNS setup, the PC's **DNS server** field selects where it sends name queries. An **A record** maps a name to an IPv4 address: `www.lab.test → 192.168.40.20`. The client queries its configured server, reads that answer, then opens a separate HTTP connection to the returned address. The DNS server need not be the web server. You will configure just this one mapping to observe the two exchanges; Chapter 25 develops the wider DNS lookup process.

DNS needs particular care. Many small lookups use UDP, but TCP is a normal supported DNS transport, not something reserved exclusively for zone transfers. A resolver can retry over TCP after receiving a truncated UDP answer, and can use TCP for other queries. Do not apply a universal “anything over 512 bytes uses TCP” rule: DNS extensions support larger UDP messages. A policy permitting only UDP `53` can therefore break valid DNS operations.

FTP also needs two separate ideas. The control connection carries commands on TCP `21`; the data connection carries a directory listing or file. In active mode, the server traditionally initiates that data connection from TCP `20`. In passive mode, the client connects to a server-selected data port. Knowing only `20/21` is insufficient to explain why a login succeeds while a file transfer fails.

TFTP starts with a read or write request addressed to UDP `69`. The server responds from its chosen **transfer identifier**, carried as a UDP port, and the remaining exchange uses that port rather than continuously targeting `69`. TFTP messages add block numbers and acknowledgments. These are TFTP fields inside UDP's data, not evidence that UDP gained TCP's reliability features.

DHCP illustrates another use of UDP. During initial address acquisition, a client can send from `0.0.0.0:68` toward `255.255.255.255:67` before it has a usable address. Subsequent DHCP exchanges are not all broadcasts. Study the detailed sequence in the services chapter; here, recognize the server/client ports and the absence of a TCP opening.

## Reading the output

Read a transport exhibit in this order: protocol, addresses, ports, flags or state, then sequence details if needed. Establish which device initiated the connection before deciding whether a displayed port is local or remote. The following summary uses representative values for teaching; it is not a recording of the Packet Tracer lab.

```output Representative TCP exchange · absolute sequence numbers
Client 192.168.40.10:51514 -> Server 192.168.40.20:80  SYN      Seq=1000  Len=0  ← request to the listening port
Server 192.168.40.20:80 -> Client 192.168.40.10:51514  SYN,ACK  Seq=5000  Ack=1001  ← reverse ports; acknowledges client SYN
Client 192.168.40.10:51514 -> Server 192.168.40.20:80  ACK      Seq=1001  Ack=5001  ← completes the ordinary opening
Client 192.168.40.10:51514 -> Server 192.168.40.20:80  ACK      Seq=1001  Len=200  ← data occupies bytes 1001 through 1200
Server 192.168.40.20:80 -> Client 192.168.40.10:51514  ACK      Seq=5001  Ack=1201  ← next client byte expected
```

On Windows, `netstat -an` lists numeric endpoints, including listening sockets and active TCP connections. `LISTENING` means the local host has a listening endpoint; `ESTABLISHED` means a TCP connection is established. `TIME_WAIT` is a TCP closing state, not by itself a failure. UDP entries do not have the equivalent TCP state. Packet Tracer implements only part of a real operating system, so its display and supported switches can differ.

On an IOS router, `show tcp brief` describes connections in which the router itself is an endpoint, such as a management session. It is not a list of all TCP conversations merely routed through the device. This representative row identifies local port `22` and remote port `51522`; it is consistent with an SSH client connected to the router.

```output Representative R1# show tcp brief
TCB       Local Address          Foreign Address        (state)
6640A3C8  10.10.10.1.22          10.10.10.50.51522       ESTAB  ← ports follow the final dots; the router is the local endpoint
```

On a real Windows PC, PowerShell’s `Test-NetConnection 192.168.40.20 -Port 80` tests a TCP opening and reports `TcpTestSucceeded`. On supported IOS, `telnet 10.1.1.10 443` can similarly test TCP acceptance at an authorized lab target; it does not perform a useful HTTPS request or authenticate TLS. Packet Tracer support differs, so the lab uses its browser and PDU inspection as the primary tests.

For a failed website, compare three tests: ping the server address, browse to the address with the correct URL scheme, and browse to the name. Ping success provides evidence that ICMP echo traffic can make a round trip; it does not verify TCP, TLS, DNS, or HTTP. If address-based HTTP works but the name fails, investigate name resolution. If the TCP opening succeeds but the application fails afterwards, continue with application evidence rather than declaring the entire path healthy.

## Exam focus

- Compare TCP's reliable, ordered byte stream with UDP's datagrams and lack of built-in loss recovery.
- Separate transport behavior from features an application implements above it.
- Read both source and destination ports; replies reverse the endpoints.
- Explain SYN, SYN/ACK, ACK and simple next-byte acknowledgment calculations.
- Distinguish receive-window flow control from congestion control; advanced congestion mathematics is unnecessary here.
- Recognize the conventional service ports, particularly DNS's two transports and FTP/TFTP data-port behavior.
- Treat successful ping, a listening socket, an established TCP connection, and a successful application request as different evidence.

Before continuing, read both directions of a TCP connection and a UDP query without confusing ports, sequence numbers or IP addresses. Chapter 07 returns to the Ethernet layer underneath those exchanges and examines how switches learn and select frame paths.
