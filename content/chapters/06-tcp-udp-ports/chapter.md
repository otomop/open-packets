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

A user reports that the intranet site is down. You ping the server and it replies, so the cable, the addresses and the path are fine, yet the page still will not load. To get further you need to know what happens after a packet reaches the right host: which program receives it, and what happens when part of the data goes missing. That is the job of the transport layer, and its two protocols, TCP and UDP, make opposite choices.

Chapters 04 and 05 got a packet to the correct IP address. This chapter adds the port number that selects one application on that host, and the TCP machinery that makes delivery reliable. By the end you will be able to compare TCP with UDP, read the ports, flags and sequence numbers in a capture, recall the ports of the common services, and tell a reachability problem from a service problem. You will use these ports again in access lists, NAT and the network services chapters.

## Why IP alone is not enough

**IP** provides best-effort packet delivery. A packet can be lost, delayed, duplicated, or delivered after a packet sent later, and nothing in IP notices or repairs any of that. IP also stops at the host: it has no field that says which program the data is for. The transport layer fills both gaps. It adds port numbers to name the application, and it decides what to do about loss: TCP repairs it, and UDP leaves that decision to the application.

**TCP**, the Transmission Control Protocol, provides a reliable, ordered **byte stream** between applications. It establishes a connection, numbers the bytes, acknowledges received data, and retransmits when necessary. **UDP**, the User Datagram Protocol, sends individual **datagrams** without establishing a transport connection or providing its own acknowledgments and retransmissions. Both identify application endpoints with source and destination ports.

:::facts
- TCP provides connection establishment, ordered byte delivery, loss recovery, and flow control. Its minimum header is **20 bytes**.
- UDP preserves datagram boundaries and provides no transport-level delivery or ordering guarantee. Its header is **8 bytes**.
- Each TCP or UDP port field is **16 bits**: numerical values run from `0` to `65535`. Port `0` is reserved, not a normal service destination.
- TCP and UDP have separate port spaces. `TCP 53` and `UDP 53` are different transport endpoints.
- An ordinary TCP opening is **SYN → SYN/ACK → ACK**. ICMP echo traffic does not perform this handshake and has no TCP or UDP ports.
:::

Reliable has a precise meaning here: TCP delivers every byte in order, or it reports that the connection failed. It cannot outlast a dead path. Its acknowledgments confirm that bytes arrived, not that the server saved the file or accepted the order, so keep transport delivery and application success separate when you interpret tests.

The CCNA v1.1 objective is to **compare TCP to UDP**. Learn the behavior well enough to explain a capture and choose an appropriate test. The header details below support that understanding; memorizing congestion algorithms or operating-system timer defaults is unnecessary for this foundation.

## Ports, sockets and multiplexing

One host runs many network programs at once, and all of them share its IP address. A **port number** tells the host which program a segment belongs to; sharing one address this way is called **multiplexing**. A server usually waits on a known service port, while a client chooses a temporary **ephemeral port** for its end of an exchange. For example, a client at `192.168.40.10` could connect from TCP port `51514` to `192.168.40.20` on TCP port `80`. The server's reply reverses the source and destination addresses and ports.

| Direction | Source endpoint | Destination endpoint |
|---|---|---|
| Client request | `192.168.40.10:51514` | `192.168.40.20:80` |
| Server reply | `192.168.40.20:80` | `192.168.40.10:51514` |

The **five-tuple** consists of transport protocol, source IP address, source port, destination IP address, and destination port. It distinguishes conversations for packet analysis and traffic policy. For two simultaneous TCP connections using the same client IP, server IP, and server port, the client ports distinguish the connections.

A **socket** is one endpoint of a conversation, written as an IP address and port such as `192.168.40.20:80`. A TCP connection is identified by its pair of sockets, so thousands of clients can connect to the same server port: each connection has a different client socket.

| IANA range | Numbers | Meaning |
|---|---|---|
| System, also called well-known | `0–1023` | Familiar assignments such as SSH `22` and DNS `53` |
| User, also called registered | `1024–49151` | Additional registered application services |
| Dynamic/private | `49152–65535` | Available for dynamic use; IANA does not assign individual services here |

Operating systems pick ephemeral ports from the high numbers, though not always from exactly the dynamic range. When you read a capture, the high port marks the client that started the exchange and the low, well-known port names the service it asked for.

:::trap A port assignment is not an application test
Traffic to TCP `443` is consistent with HTTPS, but another program can use that port. **TLS (Transport Layer Security)** establishes a protected exchange above the transport; HTTPS is HTTP carried over such protection. A successful TCP connection does not prove that TLS negotiation, authentication, or the requested page works. Read ports together with the protocol exchange and the application's result.
:::

## Two headers, two philosophies

The two headers show the two designs. TCP carries more control information because it does more work. Its header includes source and destination ports, sequence and acknowledgment numbers, control flags, an advertised receive window, and a checksum. Options can extend the header beyond its 20-byte minimum. UDP contains four 16-bit fields: source port, destination port, length, and checksum; the length includes both its header and data.

| Property | TCP | UDP |
|---|---|---|
| Data presented to application | Ordered stream of bytes | Separate datagrams |
| Opening exchange | Establishes connection state | No UDP handshake |
| Missing data | TCP can detect loss and retransmit | UDP itself does not recover it |
| Ordering and duplicates | TCP orders bytes and handles duplicates | Application handles these if needed |
| Receiver flow control | Advertised receive window | No equivalent UDP window |
| Examples in this course | SSH, HTTP over TCP, FTP | DHCP, NTP, ordinary DNS over UDP |

**Byte stream** is an important qualification. If an application writes 200 bytes and then 300 bytes, TCP may carry them in one segment or several. The receiving application uses its own message format to determine where a request ends. The PSH flag does not create a message boundary, and a segment boundary does not reliably identify a complete application message.

With UDP, the application supplies a datagram and the receiver is given a datagram, if it arrives. UDP has no sequence-number field with which to order several datagrams. However, an application can put its own identifiers in the data, detect missing messages, and retry. TFTP uses UDP and implements acknowledgments and retransmission above it, so an application that runs over UDP can still transfer data reliably.

UDP's advantage is low overhead and no waiting: there is no handshake before the first datagram, and a lost datagram does not hold up the ones behind it. Neither transport encrypts anything. SSH and TLS add encryption above TCP, and the checksum in both headers only detects accidental corruption.

## Opening and closing a connection

Before TCP carries any data, both ends agree where their byte numbering starts. This is the **three-way handshake**. A TCP server first needs a **listening** endpoint. The client sends a segment with **SYN** set to request synchronization of sequence numbers. The server replies with SYN and **ACK**, acknowledging the client's **initial sequence number (ISN)** and supplying its own. The client then acknowledges the server's SYN. Data exchange can follow once the connection is established.

```diagram
{ "type": "sequence", "title": "Fig 6.1 — An ordinary TCP opening", "actors": ["Client · port 51514", "Server · port 80"],
  "steps": [
    { "from": 0, "to": 1, "label": "SYN · seq 1000", "note": "Client proposes its initial sequence number", "accent": true },
    { "from": 1, "to": 0, "label": "SYN, ACK · seq 5000 · ack 1001", "note": "Server acknowledges the client and supplies its own number" },
    { "from": 0, "to": 1, "label": "ACK · seq 1001 · ack 5001", "note": "Client acknowledges the server's SYN", "accent": true }
  ], "caption": "These are illustrative absolute sequence numbers; each SYN consumes one sequence number." }
```

The **sequence number** identifies a position in one direction's byte stream. The **acknowledgment number** states the next byte expected in the other direction. Here, the first client data byte is numbered `1001`. A segment containing 200 data bytes occupies `1001–1200`, so successful in-order reception is acknowledged with `1201`. The directions have independent numbering: do not add the server's starting value to the client's.

ACK does not mean “I received one packet.” Acknowledgments are **cumulative**: acknowledgment `1201` says all preceding stream bytes through `1200` have been received, with no earlier gap remaining. They may originally have arrived out of order. An ACK-only segment consumes no data sequence space. SYN and **FIN** each consume one sequence number, even when no application data accompanies them.

A normal close uses FIN to say that one endpoint has no more bytes to send. Each direction closes separately, so the close is usually drawn as four segments: FIN and ACK one way, then FIN and ACK the other. **RST** ends a connection at once or rejects an attempt, with no orderly close.

The two failure patterns look different in a capture. A SYN answered by RST was actively rejected, usually because nothing is listening on that port, though a firewall can also send a reset. A SYN that gets no answer at all was filtered, lost, or sent to a host that is down; the client retransmits it a few times and then gives up.

## Windowing, flow control and congestion control

Waiting for an acknowledgment after every segment would make TCP painfully slow, so the sender keeps a controlled amount of unacknowledged data in flight. **Windowing** is the name for this. The window slides forward as acknowledgments return, which is why it is often called a sliding window.

**Flow control** protects the receiving endpoint. The receiver advertises how much additional data it is prepared to accept, based on available receive capacity. A small receive window can limit the sender even on an otherwise fast network. A zero advertised window tells the sender that the receiver cannot currently accept additional stream data; this differs from a failed cable or an unknown destination.

**Congestion control** concerns the network path. The sender limits traffic in response to indications of congestion, such as loss or explicit congestion signaling. The sender obeys whichever limit is smaller, the receiver's window or its own congestion limit. You do not need the congestion algorithms for the CCNA.

Consider data bytes `1001–1100`, `1101–1200`, and `1201–1300`. If the middle range is lost, later data does not make the gap disappear: the cumulative acknowledgment remains `1101`. TCP can retransmit missing data after detecting loss, including through a retransmission timeout. Once the gap is filled and all three ranges are present, an acknowledgment can advance to `1301`. The application receives an ordered stream rather than a file with an unexplained missing section.

This recovery has a cost: later bytes can wait behind missing earlier bytes. In a voice call a late audio sample is useless, so the application would rather skip it than hold up the samples behind it. That is why voice and live video usually run over UDP, and why file transfer, web pages and remote login, where every byte matters, run over TCP.

## Which application uses which transport, and why

Memorize this table. The exam asks for these ports directly, and you will need them to write access lists and to troubleshoot services in later chapters.

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

These service names are a map for later study. **AAA** means authentication (who is connecting), authorization (what they may do) and accounting (records of activity); Chapter 33 develops it. NTP supplies common time, SNMP supports management queries and notifications, and syslog carries event messages; Chapter 27 explains their operation.

For the lab's DNS setup, the PC's **DNS server** field selects where it sends name queries. An **A record** maps a name to an IPv4 address: `www.lab.test → 192.168.40.20`. The client queries its configured server, reads that answer, then opens a separate HTTP connection to the returned address. The DNS server need not be the web server. You will configure just this one mapping to observe the two exchanges; Chapter 25 develops the wider DNS lookup process.

DNS uses both transports on port `53`. Most lookups are one small query and one small answer, so they use UDP. A resolver switches to TCP when an answer is too large for the UDP reply, which the server signals by marking that reply as truncated, and servers use TCP to copy whole zones to each other. An access list that permits only UDP `53` therefore breaks some valid lookups.

FTP uses two connections. The control connection carries commands on TCP `21`; the data connection carries a directory listing or file. In active mode, the server opens the data connection from TCP `20`. In passive mode, the client connects to a data port the server chooses. This split explains a classic fault: the login works on port 21, but a firewall blocks the data connection and the transfer hangs.

TFTP starts with a read or write request addressed to UDP `69`. The server replies from a port it chooses, called the **transfer identifier**, and the rest of the exchange uses that port instead of `69`. TFTP numbers its blocks and acknowledges each one. That reliability lives in TFTP, not in UDP.

DHCP has to use UDP. A client with no address sends from `0.0.0.0:68` to the broadcast address `255.255.255.255:67`, and TCP cannot open a connection to a broadcast address. Chapter 24 covers the full exchange; here, learn the server port 67 and the client port 68.

## Reading the output

Read a transport exhibit in this order: protocol, addresses, ports, flags or state, then sequence details if needed. Establish which device initiated the connection before deciding whether a displayed port is local or remote. The summary below uses representative values.

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

Return to the failed intranet site from the start of the chapter. Three tests separate the layers: ping the server address, browse to the address, and browse to the name. A successful ping shows only that ICMP echo makes the round trip; it does not test TCP, TLS, DNS or HTTP. If the address loads but the name fails, the fault is name resolution. If ping works but the TCP handshake to port 80 does not complete, the service is stopped or a device on the path is filtering that port. If the handshake completes and the page still fails, the problem is in the application.

## Exam focus

- Compare TCP's reliable, ordered byte stream with UDP's datagrams and lack of built-in loss recovery.
- Separate transport behavior from features an application implements above it.
- Read both source and destination ports; replies reverse the endpoints.
- Explain SYN, SYN/ACK, ACK and simple next-byte acknowledgment calculations.
- Distinguish receive-window flow control from congestion control; advanced congestion mathematics is unnecessary here.
- Recognize the conventional service ports, particularly DNS's two transports and FTP/TFTP data-port behavior.
- Treat successful ping, a listening socket, an established TCP connection, and a successful application request as different evidence.

Before continuing, read both directions of a TCP connection and a UDP query without confusing ports, sequence numbers or IP addresses. Chapter 07 returns to the Ethernet layer underneath those exchanges and examines how switches learn and select frame paths.
