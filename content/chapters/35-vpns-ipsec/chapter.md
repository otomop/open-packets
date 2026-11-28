---
id: vpns-ipsec
number: 35
title: VPNs & IPsec
subtitle: Understand which endpoints are protected, how peers establish trust, and what VPN evidence can prove.
part: security
domain: services
minutes: { lesson: 65, lab: 60 }
summary: Describe site-to-site and remote-access IPsec, compare ESP and AH, distinguish tunnel and transport modes, explain IKEv2 and NAT traversal, and separate successful negotiation from working application traffic.
objectives:
  v1: ["5.5"]
  v2: ["4.5"]
prereqs: [tcp-udp-ports, static-routing-ipv4, acls, nat-pat, security-concepts]
sectionIds:
  "What an IPsec VPN protects": why-traffic-needs-a-tunnel
  "Site-to-site and remote access": site-to-site-versus-remote-access
  "IPsec services, ESP and AH": what-ipsec-provides-and-which-protocol-provides-it
  "Tunnel mode and transport mode": tunnel-mode-versus-transport-mode
  "IKE and security associations": ike-how-two-peers-agree-on-keys
  "Traffic selection and tunnel interfaces": gre-over-ipsec-vti-dmvpn-and-flexvpn
  "Verify the path, negotiation and data": verify-and-troubleshoot
  "Exam focus": exam-focus
sources:
  - { title: "Cisco CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "RFC 4301: Security Architecture for the Internet Protocol", url: "https://www.rfc-editor.org/rfc/rfc4301.html" }
  - { title: "RFC 4302: IP Authentication Header", url: "https://www.rfc-editor.org/rfc/rfc4302.html" }
  - { title: "RFC 4303: IP Encapsulating Security Payload", url: "https://www.rfc-editor.org/rfc/rfc4303.html" }
  - { title: "RFC 7296: Internet Key Exchange Protocol Version 2", url: "https://www.rfc-editor.org/rfc/rfc7296.html" }
  - { title: "RFC 3948: UDP Encapsulation of IPsec ESP Packets", url: "https://www.rfc-editor.org/rfc/rfc3948.html" }
  - { title: "RFC 9395: Deprecation of IKEv1", url: "https://www.rfc-editor.org/rfc/rfc9395.html" }
  - { title: "IANA: IP Protocol Numbers", url: "https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml" }
  - { title: "Cisco: Configuring Internet Key Exchange Version 2", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m_sec-cfg-ikev2-flex.html" }
  - { title: "Cisco: Configuring Security for VPNs with IPsec", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m_sec-cfg-vpn-ipsec-0.html" }
  - { title: "Cisco: Crypto maps and virtual tunnel interfaces on IOS XE", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/ipsec-negotiation-ike-protocols/214728-configure-multi-sa-virtual-tunnel-interf.html" }
  - { title: "Cisco Secure Client 5.1: Configure AnyConnect VPN", url: "https://www.cisco.com/c/en/us/td/docs/security/vpn_client/anyconnect/Cisco-Secure-Client-5/admin/guide/b-cisco-secure-client-admin-guide-5-1/m_configure_vpn_access-noth.html" }
  - { title: "Cisco: IKEv2 encryption command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/d1/sec-d1-cr-book/sec-cr-e1.html" }
  - { title: "Cisco: Next Generation Cryptography", url: "https://sec.cloudapps.cisco.com/security/center/resources/next_generation_cryptography" }
---

A branch office needs to reach servers at headquarters, and the only link between them is the Internet. Every packet crosses routers you do not own, where it can be read or changed. Renting a private circuit for each branch avoids that but costs far more. A **VPN (virtual private network)** built with **IPsec (Internet Protocol Security)** solves the problem on the link you already have: the two ends prove who they are, encrypt each packet before it leaves, and check each packet that arrives.

This chapter uses what you already know. Static routing gets packets to the far gateway, an ACL chooses which traffic to protect, and NAT explains why some VPN traffic has to ride inside UDP. By the end you will be able to describe site-to-site and remote-access VPNs, say what ESP, AH and IKE each do, tell tunnel mode from transport mode, and read the output that shows whether a VPN is carrying traffic.

## What an IPsec VPN protects

:::facts
- A site-to-site IPsec VPN normally terminates on two gateways acting for their networks. A remote-access IPsec VPN terminates on a user's device and a VPN gateway.
- ESP is IP protocol `50`; AH is IP protocol `51`. These are IP protocol numbers, not TCP or UDP ports.
- IKE uses UDP `500`. With NAT traversal, IKE and UDP-encapsulated ESP both move to UDP `4500`.
- ESP provides encryption, integrity, data-origin authentication and anti-replay protection. AH provides integrity, authentication and anti-replay, but no encryption.
- ESP tunnel mode protects the complete original IP packet inside a new outer IP header. Transport mode retains the original IP header for routing and protects the carried payload.
- IKEv2 establishes authenticated negotiation and IPsec security associations. IKEv1 is legacy and deprecated; its phase names still appear in older material and simulator examples.
- The CCNA verb is **describe**. Full VPN configuration is optional implementation practice, not a requirement to memorize a long crypto template.
:::

A VPN is a private connection built across a network that someone else runs. “Private” does not always mean encrypted. A provider's MPLS VPN, a private WAN service, keeps each customer's routes separate but carries the packets unencrypted. An IPsec VPN is private because of cryptography: only the two endpoints hold the keys.

Follow one packet from branch PC `10.1.1.10` to headquarters server `10.2.2.20`. The PC sends it to its default gateway, R-BR, as usual. R-BR sees that the packet is bound for the headquarters LAN, encrypts it, and sends it across the Internet to R-HQ. R-HQ decrypts it and forwards the original packet to the server. The protection covers the path between the two gateways only. On each LAN the packet travels as the application sent it, so plain HTTP is readable there and HTTPS is still worth using.

IPsec does not replace routing. The two gateways must already be able to reach each other's public addresses, and anyone on the path can still drop the packets. What an observer cannot do is read them, and the receiving gateway rejects any packet that was altered or did not come from its peer.

## Site-to-site and remote access

IPsec VPNs come in two shapes, and the difference is what sits at each end of the tunnel.

A **site-to-site VPN** joins two networks. A router or firewall at each location does the IPsec work for every host behind it, so a branch PC needs no VPN software: it sends packets to its default gateway, and the gateway protects the ones bound for the other site. It is a standing arrangement between two known gateways, which bring the tunnel up whenever traffic needs it without any action from users.

A **remote-access VPN** joins one device to a network. VPN client software on a laptop or phone is the endpoint, and the user connects on demand from home, a hotel or anywhere else. The user, and often the device, authenticates to the corporate VPN gateway, commonly with multifactor authentication. The gateway then gives the client an internal IP address, routes and DNS settings. Being connected does not mean the user can reach everything: the gateway still applies access policy.

| Question | Site-to-site IPsec | Remote-access IPsec |
|---|---|---|
| Where does IPsec terminate? | At the two gateways | At the user device and gateway |
| Who sends the original traffic? | Hosts behind the gateways | Applications on the connected device |
| Is a host VPN client required? | Normally no | A client or supported built-in VPN implementation is required |
| Typical identity | Gateway identity | Device and/or user identity |
| Typical purpose | Connect branch and headquarters networks | Give a remote user approved network access |

A remote-access policy also decides how much of the client's traffic uses the VPN. **Full tunneling** sends all of it through the VPN gateway, web browsing included, so corporate security tools see everything. **Split tunneling** sends only corporate destinations through the VPN. The rest goes straight out of the local connection, which saves bandwidth at the gateway but leaves that traffic outside the VPN's protection.

Remote access is not always IPsec. Cisco Secure Client (formerly AnyConnect) can build its tunnel with IKEv2/IPsec or with **TLS**, the protocol that secures HTTPS, and many deployments choose TLS because TCP 443 is open almost everywhere. A clientless TLS VPN goes further and gives access to selected applications through a web browser alone. The exam objective names IPsec, so know IPsec for both VPN types and TLS as the common remote-access alternative.

```diagram
{ "type": "topology", "title": "Identify the VPN endpoints", "caption": "The branch path is gateway to gateway. The remote user's device is itself an endpoint. Plaintext can exist beyond the IPsec termination unless another layer protects it.", "nodes": [ { "id": "P", "kind": "pc", "label": "Branch PC", "x": 1, "y": 1 }, { "id": "B", "kind": "router", "label": "R-BR", "sub": "198.51.100.1", "x": 3, "y": 1 }, { "id": "I", "kind": "cloud", "label": "Internet", "x": 6, "y": 3 }, { "id": "H", "kind": "router", "label": "R-HQ", "sub": "203.0.113.1", "x": 9, "y": 1 }, { "id": "S", "kind": "server", "label": "HQ server", "x": 11, "y": 1 }, { "id": "L", "kind": "laptop", "label": "Remote user", "sub": "VPN client", "x": 3, "y": 5 } ], "links": [ { "from": "P", "to": "B" }, { "from": "B", "to": "I", "label": "site-to-site IPsec", "accent": true }, { "from": "I", "to": "H", "accent": true }, { "from": "H", "to": "S" }, { "from": "L", "to": "I", "label": "remote-access IPsec", "style": "dashed" } ],"trace":{"flows":[{"path":["P","B","I","H","S"],"label":"Branch PC to HQ server","tags":{"P":"Sends via its default gateway","B":"Encrypts · outer to 203.0.113.1","I":"Routes on the outer destination","H":"Decrypts · inner packet to server","S":"Readable on LAN unless app encrypts"}}],"chips":[{"node":"B","text":"Site-to-site endpoint"},{"node":"H","text":"Site-to-site endpoint"},{"node":"L","text":"Remote-access endpoint"}]} }
```

## IPsec services, ESP and AH

IPsec is a framework of protocols that together give a packet four protections. Learn what each protection is before learning which protocol supplies it.

**Confidentiality** stops an observer reading the packet. IPsec encrypts with a **symmetric** algorithm such as AES: both peers hold the same secret key, one encrypts with it and the other decrypts. Nobody types that key. IKE generates it, as a later section shows.

**Integrity** detects any change to the packet in transit. The sender computes a keyed hash (an HMAC, for example with SHA-256) over the packet and attaches the result. The receiver repeats the calculation and drops the packet if the values differ. Because only the peer holds the key, a correct hash also proves where the packet came from: that is **data-origin authentication**. It identifies the peer gateway, not the person whose traffic the gateway carries.

**Anti-replay** stops an attacker capturing a valid packet and sending it again later. Every protected packet carries a sequence number, and the receiver drops duplicates and packets older than its receive window.

Two protocols can carry the protected packets. **ESP (Encapsulating Security Payload)**, IP protocol 50, provides all four services: it encrypts the packet and adds the integrity check and the sequence number. Almost every IPsec VPN uses ESP.

**AH (Authentication Header)**, IP protocol 51, provides integrity, origin authentication and anti-replay but never encrypts, so the payload stays readable. AH's integrity check also covers the IP addresses in the outer header, so a NAT device that rewrites an address breaks it. For both reasons AH is rare. Remember it for one comparison: AH authenticates; ESP authenticates and encrypts.

| Service | ESP | AH |
|---|---|---|
| Confidentiality (encryption) | Yes | No |
| Integrity and origin authentication | Yes | Yes |
| Anti-replay | Yes | Yes |
| IP protocol number | 50 | 51 |
| Works through NAT | Yes, with NAT traversal | No |

ESP and AH protect packets, but neither creates the keys they need. Other mechanisms complete the framework:

| Function | Relevant mechanism |
|---|---|
| Protect user packets | ESP (or AH, without encryption) |
| Authenticate peers and negotiate keying material | IKE |
| Let ordinary NAT/PAT carry ESP using UDP | NAT traversal |
| Identify the receiving IPsec SA | Security Parameter Index (SPI) and associated SA context |

ESP has a NAT problem of its own. PAT tells conversations apart by TCP or UDP port, and ESP has no ports. **NAT traversal (NAT-T)** fixes this. During negotiation IKE detects whether a NAT device sits between the peers. If one does, both peers switch to UDP port 4500 and wrap every ESP packet in a UDP header. PAT can then translate the flow like any other, and the ESP packet inside is untouched.

:::trap Protocol 50 is not port 50
An ACL line `permit udp any any eq 50` does not pass ESP. ESP is IP protocol 50, written `permit esp` in an ACL, and it has no port number at all. A firewall in front of a VPN gateway must allow UDP 500 for IKE, plus ESP when there is no NAT on the path or UDP 4500 when NAT-T is in use.
:::

## Tunnel mode and transport mode

The two modes differ in how much of the original packet is protected and whose addresses the transit network sees.

In **tunnel mode**, the gateway encrypts the entire original packet (IP header, transport header and data) and puts a new outer IP header in front of it. The outer header carries the gateways' addresses. In the branch example the outer packet goes from `198.51.100.1` to `203.0.113.1`, and the inner packet, still addressed from `10.1.1.10` to `10.2.2.20`, is hidden inside. Internet routers forward on the outer destination, so they never need a route to the private `10.2.2.0/24` network. Site-to-site and remote-access VPNs use tunnel mode.

An observer still sees the outer addresses, the size and timing of the packets, and the ESP header with its SPI and sequence number. Everything from the original packet is encrypted.

In **transport mode**, ESP keeps the original IP header and encrypts only what follows it. No second header is added, so the packet is smaller, but the original addresses stay visible and the two IPsec endpoints must be the packet's own source and destination. The simple case is two hosts protecting their own conversation. The other common case is a **GRE (Generic Routing Encapsulation)** tunnel between two routers. GRE wraps a packet in a new IP header but does not encrypt it. Because GRE has already added the router-to-router header, IPsec can protect the GRE packet in transport mode without adding another.

| ESP with encryption | Tunnel mode | Transport mode |
|---|---|---|
| Additional outer IP header supplied by IPsec | Yes | No |
| Original IP header | Inside encrypted content | Remains outside ESP encryption |
| Typical simple example | Gateway-to-gateway protection for LAN hosts | Host-to-host protection |
| Can transit routers read the original IP header? | No | Yes |

```output Simplified ESP packet layouts
Tunnel:
Outer IP (gateway A -> gateway B) | ESP header | encrypted {original IP + transport + data + ESP trailer} | authentication data

Transport:
Original IP (IPsec endpoint A -> B) | ESP header | encrypted {transport + data + ESP trailer} | authentication data
```

AH can use either mode too, but the mode never adds encryption: AH in tunnel mode still sends a readable packet.

## IKE and security associations

Before two gateways can protect a packet they must agree on algorithms and share keys, and they must do it across the same untrusted network. The result of that agreement is a **security association (SA)**: one peer's record of the protocol, algorithms, keys and lifetime to use with the other. An IPsec SA works in one direction only, so two-way traffic needs a pair, one outbound and one inbound. Each ESP packet carries a **Security Parameter Index (SPI)**, a number that tells the receiver which SA, and so which key, to use.

**IKE (Internet Key Exchange)** builds the SAs automatically, over UDP 500. It works in two stages. First the peers build one SA to protect their own negotiation. Then, inside that protected channel, they negotiate the IPsec SAs that will carry user data. In **IKEv2** the first stage is the `IKE_SA_INIT` exchange, which agrees algorithms and runs Diffie-Hellman. The second is `IKE_AUTH`, which authenticates the peers and creates the first **CHILD_SA**, IKEv2's name for a pair of IPsec SAs. Each exchange is one request and one reply: four messages in all.

Negotiation succeeds only if the peers have a set of algorithms in common. Each side sends **proposals**: an encryption algorithm, an integrity algorithm and a Diffie-Hellman group. If R-BR offers only `AES-CBC-256` and R-HQ offers only `AES-CBC-128`, nothing matches and IKE fails, even though both use AES; the number is the key length in bits. The names given to proposals on each router are local and do not have to match.

**Diffie-Hellman (DH)** is how both peers arrive at the same secret key without ever sending it. Each sends the other a public value, and each combines the value it receives with a private value of its own to compute the same result. An eavesdropper who sees both public values cannot compute it. DH does not prove who the other side is, so IKE also authenticates the peer. A **pre-shared key (PSK)** is the same secret typed into both gateways; it is simple and suits a handful of tunnels. A **digital certificate** binds a public key to an identity and is signed by a certificate authority that both peers trust. Certificates scale to many peers because no secret has to be shared between them.

SAs do not last for ever. Each has a lifetime, and IKE negotiates fresh keys before it expires (**rekeying**) without interrupting traffic. Unlike the one-way IPsec SAs, the IKE SA is a single two-way SA, and one IKE SA can manage several pairs of IPsec SAs.

The older **IKEv1** has the same two stages under different names, and you will still meet them in study material and in Packet Tracer. **Phase 1** builds the ISAKMP SA that protects negotiation, using main mode or the shorter aggressive mode. **Phase 2**, called quick mode, builds the IPsec SAs. `show crypto isakmp sa` displays the phase 1 SA, and its healthy state is `QM_IDLE`. IKEv1 and IKEv2 do not interoperate, and RFC 9395 deprecates IKEv1, so new VPNs use IKEv2.

## Traffic selection and tunnel interfaces

A gateway does not encrypt everything it forwards. Something must tell it which packets belong in the VPN, and IOS has two ways to say so.

A **policy-based VPN** uses an ACL. A **crypto map** applied to the WAN interface names the peer, the algorithms and a **crypto ACL**. In a crypto ACL, `permit` means “encrypt this” and `deny` means “do not encrypt this”. Unlike an ACL applied with `ip access-group`, it drops nothing: a packet that does not match is forwarded normally, unencrypted, if a route exists.

On R-BR the crypto ACL permits source `10.1.1.0/24` to destination `10.2.2.0/24`. R-HQ needs the mirror image, `10.2.2.0/24` to `10.1.1.0/24`; if the two ACLs are not mirror images, the IPsec SAs fail to form. The ACL also sets a trap when you test. A plain `ping 10.2.2.20` from R-BR is sourced from its WAN address `198.51.100.1`, which the ACL does not match, so the packet is never encrypted. Test from PC-BR, or use `ping 10.2.2.20 source 10.1.1.1`.

A **route-based VPN** uses the routing table instead. The gateway has a logical **tunnel interface** (on IOS, a virtual tunnel interface or VTI), and every packet routed out of that interface is encrypted. A static route or a routing protocol decides what enters the tunnel, with no crypto ACL to maintain. IKE and the IPsec SAs work exactly as before.

**GRE**, IP protocol 47, is a tunnel without security. It wraps any packet in a new IP header, including the multicast packets that routing protocols such as OSPF send, but it encrypts nothing. IPsec with crypto maps carries only unicast IP, so older designs run GRE between the routers for the routing protocol and then protect the GRE packets with IPsec. That design is **GRE over IPsec**. A GRE tunnel interface that shows up/up says nothing about encryption.

## Verify the path, negotiation and data

A VPN comes up in a fixed order, so check it in that order: the path between the gateways, then IKE, then the IPsec SAs, then the application. Each step can work while the next one fails.

1. **Path.** The WAN interface is up and there is a route to the peer's public address. A ping to that address proves IP reachability only: a firewall on the path can pass ICMP and still block UDP 500, UDP 4500 or ESP.
2. **IKE.** `show crypto ikev2 sa` lists the IKE SA with status `READY`. For IKEv1, `show crypto isakmp sa` shows `QM_IDLE`. An empty table means that negotiation failed or that no traffic has yet matched the crypto ACL to start it.
3. **IPsec.** `show crypto ipsec sa` lists the data SAs with their packet counters.
4. **Application.** Test the real service from a host on the protected LAN.

```ios R-BR
R-BR# show ip interface brief
R-BR# show ip route 203.0.113.1
R-BR# show crypto ikev2 sa
R-BR# show crypto ipsec sa
```

The counters in `show crypto ipsec sa` are the best evidence. `#pkts encaps` counts packets this router encrypted and sent. `#pkts decaps` counts packets it received and decrypted. Both are running totals, so read them before and after a test and compare. The excerpt below is simplified.

```output Representative IPsec counters for the same SA before and after a test
                         Before        After
#pkts encaps                100          104
#pkts decaps                100          100
```

Here R-BR encrypted four more packets and decrypted none. Its own side is working: the pings matched the crypto ACL and left encrypted. Nothing protected came back, so look outward. A filter on the path may be dropping ESP, R-HQ may be rejecting the packets, or the HQ host's reply may not be routed back into the tunnel. The same counters on R-HQ narrow it down: if its decaps did not rise, the packets never arrived.

If both counters rise on both routers, the tunnel is carrying traffic in both directions. A failure beyond that point is an application, DNS or permission problem, not a VPN problem. The one VPN-specific exception is packet size: the extra headers make every packet larger, so a small ping can succeed while full-size packets exceed the path MTU.

When IKE itself fails, the usual causes are proposals with no algorithms in common, a mismatched pre-shared key, a wrong peer address, or a filter blocking UDP 500. Packet Tracer does not support the IKEv2 commands, so the lab supplies that output for you to read.

## Exam focus

Both exam versions ask you to **describe** IPsec VPNs, not to configure them. V1.1 asks you to describe IPsec remote access and site-to-site VPNs; v2.0 additionally names protocols and transport modes. Be ready to:

- say where each VPN type terminates: site-to-site at two gateways, remote access at the user's device and a gateway;
- define the four services: confidentiality, integrity, data-origin authentication and anti-replay;
- compare ESP (protocol 50, encrypts) with AH (protocol 51, never encrypts, breaks through NAT);
- recall the numbers: IKE on UDP 500, NAT-T on UDP 4500, GRE as IP protocol 47;
- tell tunnel mode (whole packet encrypted, new outer header) from transport mode (original header kept);
- explain what IKE and an SA are, and recognize IKEv1's phase 1 and phase 2;
- read the `show crypto ipsec sa` counters to decide whether traffic is protected in both directions.
