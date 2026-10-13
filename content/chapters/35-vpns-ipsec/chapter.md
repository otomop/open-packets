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

A branch can reach headquarters over the Internet without trusting every network between them to protect its traffic. **IPsec (Internet Protocol Security)** lets the endpoints authenticate each other and protect selected IP packets. To understand a VPN, start by identifying those endpoints, the traffic selected for protection, and where that protection ends. A successful login or an “up” status is only one part of that assessment.

## What an IPsec VPN protects

:::facts
- A site-to-site IPsec VPN normally terminates on two gateways acting for their networks. A remote-access IPsec VPN terminates on a user's device and a VPN gateway.
- ESP is IP protocol `50`; AH is IP protocol `51`. These are IP protocol numbers, not TCP or UDP ports.
- IKE commonly starts on UDP `500`. Standard UDP NAT traversal carries IKE and UDP-encapsulated ESP on UDP `4500`.
- ESP can provide encryption, integrity, data-origin authentication and anti-replay protection according to its negotiated services. AH provides integrity/authentication and anti-replay, but no confidentiality.
- ESP tunnel mode protects the complete original IP packet inside a new outer IP header. Transport mode retains the original IP header for routing and protects the carried payload.
- IKEv2 establishes authenticated negotiation and IPsec security associations. IKEv1 is legacy and deprecated; its phase names still appear in older material and simulator examples.
- The CCNA verb is **describe**. Full VPN configuration is optional implementation practice, not a requirement to memorize a long crypto template.
:::

A VPN is a logical connection across another network. “Private” does not automatically mean encrypted: a provider MPLS VPN separates customer forwarding but does not, by that fact alone, encrypt customer packets. An IPsec VPN adds cryptographic protection where it is configured. Nor does a leased or logically private service imply that no other customer's traffic shares any physical infrastructure.

Consider branch PC `10.1.1.10` sending to headquarters server `10.2.2.20`. The branch gateway encrypts the selected packet; the headquarters gateway decrypts it. If the application itself is unencrypted, the packet can be readable on the LAN before encryption and after decryption. HTTPS can provide separate application protection across those segments. IPsec does not remove the need for access policy, endpoint security or application authentication.

The transport network must still carry the outer packets between gateways. Encryption does not create reachability, guarantee availability, or prevent an attacker from disrupting the path. It prevents an observer without the relevant keys from reading the protected plaintext and allows the receiving peer to reject packets that fail the negotiated authenticity and integrity checks.

## Site-to-site and remote access

In a **site-to-site VPN**, a router or firewall at each location handles IPsec for hosts behind it. A branch PC uses its ordinary default gateway; it does not need its own VPN client for the gateway-to-gateway connection. Protection applies to selected traffic, not automatically to every packet from every device. The connection may be maintained or established when traffic requires it, depending on the design.

In a **remote-access VPN**, the user's device participates as a VPN endpoint. A laptop can authenticate to a corporate gateway from a home or hotel network and receive policy such as an internal address, routes and DNS settings. The gateway may authenticate a device certificate, user credentials, or both, and the deployment may require multifactor authentication. Successful authentication does not itself mean the user is authorized to reach every internal network.

| Question | Site-to-site IPsec | Remote-access IPsec |
|---|---|---|
| Where does IPsec terminate? | At the two gateways | At the user device and gateway |
| Who sends the original traffic? | Hosts behind the gateways | Applications on the connected device |
| Is a host VPN client required? | Normally no | A client or supported built-in VPN implementation is required |
| Typical identity | Gateway identity | Device and/or user identity |
| Typical purpose | Connect branch and headquarters networks | Give a remote user approved network access |

**Full tunneling** sends the traffic covered by the full-tunnel policy through the VPN gateway, including Internet access in a typical enterprise full-tunnel design. **Split tunneling** sends selected destinations through the VPN while other traffic follows the local connection. A split-tunnel connection is not protecting traffic that bypasses it. DNS treatment is also a policy decision; do not assume every query follows the same path merely because the VPN is connected.

Cisco Secure Client can use IKEv2/IPsec or a TLS-based VPN, depending on configuration. A client application's name therefore does not prove the underlying protocol. TLS/DTLS remote access is useful comparison context, but the published objective specifically names IPsec remote access. A browser portal giving access to selected applications is also different from assuming every application on that computer has a network-layer IPsec tunnel.

```diagram
{ "type": "topology", "title": "Identify the VPN endpoints", "caption": "The branch path is gateway to gateway. The remote user's device is itself an endpoint. Plaintext can exist beyond the IPsec termination unless another layer protects it.", "nodes": [ { "id": "P", "kind": "pc", "label": "Branch PC", "x": 1, "y": 1 }, { "id": "B", "kind": "router", "label": "R-BR", "sub": "198.51.100.1", "x": 3, "y": 1 }, { "id": "I", "kind": "cloud", "label": "Internet", "x": 6, "y": 3 }, { "id": "H", "kind": "router", "label": "R-HQ", "sub": "203.0.113.1", "x": 9, "y": 1 }, { "id": "S", "kind": "server", "label": "HQ server", "x": 11, "y": 1 }, { "id": "L", "kind": "laptop", "label": "Remote user", "sub": "VPN client", "x": 3, "y": 5 } ], "links": [ { "from": "P", "to": "B" }, { "from": "B", "to": "I", "label": "site-to-site IPsec", "accent": true }, { "from": "I", "to": "H", "accent": true }, { "from": "H", "to": "S" }, { "from": "L", "to": "I", "label": "remote-access IPsec", "style": "dashed" } ],"trace":{"flows":[{"path":["P","B","I","H","S"],"label":"Branch PC to HQ server","tags":{"P":"Sends via its default gateway","B":"Encrypts · outer to 203.0.113.1","I":"Routes on the outer destination","H":"Decrypts · inner packet to server","S":"Readable on LAN unless app encrypts"}}],"chips":[{"node":"B","text":"Site-to-site endpoint"},{"node":"H","text":"Site-to-site endpoint"},{"node":"L","text":"Remote-access endpoint"}]} }
```

## IPsec services, ESP and AH

**Confidentiality** prevents an observer from reading protected content. IPsec commonly uses **symmetric encryption**, such as AES, for this purpose: the communicating peers use shared secret key material to protect and recover the content. Both peers obtain suitable traffic keys; the user does not type a new encryption key for every packet.

**Integrity** detects unauthorized changes to protected information. **Data-origin authentication** establishes that the packet came from an entity holding the appropriate key. These are related but different from authenticating a person to an application. An authenticated VPN gateway may be forwarding traffic from many internal users.

**Anti-replay** helps the receiver reject a duplicate protected packet captured and sent again. Sequence numbers and a receive window distinguish acceptable packets from duplicates or packets too old for the window. This is not a promise that IPsec prevents every attack or that every dropped packet was malicious. Window sizes and extended sequence-number features vary; memorizing a universal default is unnecessary here.

**ESP**, Encapsulating Security Payload, provides the commonly used IPsec data protection. The negotiated transform determines the services. Secure VPN examples normally combine confidentiality and integrity/authentication, using an authenticated-encryption algorithm or encryption plus an integrity mechanism. ESP also permits configurations without encryption, so the label ESP alone is not proof that a particular capture contains encrypted user data. Inspect the negotiated algorithms when that conclusion matters.

**AH**, Authentication Header, authenticates protected packet content and selected IP-header fields but does not encrypt the payload. Ordinary NAT changes addresses included in AH's integrity calculation, making that combination problematic. ESP is the usual choice for encrypted VPN traffic; AH is principally important here for recognizing that authentication is not confidentiality.

| Function | Relevant mechanism |
|---|---|
| Protect user packets | ESP, or AH for its specified services |
| Authenticate peers and negotiate keying material | IKE |
| Let ordinary NAT/PAT carry ESP using UDP | NAT traversal |
| Identify the receiving IPsec SA | Security Parameter Index (SPI) and associated SA context |

With **NAT traversal**, ESP is encapsulated in UDP so a NAT/PAT device can handle a UDP flow. IKE includes NAT detection; UDP 4500 carries the subsequent NAT-T exchange and protected packets in the normal UDP-based design. The ESP content remains protected inside the UDP wrapper. UDP 4500 alone is not proof of a fault or of a specific NAT location.

:::trap Protocol 50 is not port 50
An IPv4 rule permitting `udp ... eq 50` does not permit native ESP. Native ESP uses IP protocol 50. UDP-encapsulated ESP uses UDP 4500 in the NAT-T arrangement described here. A perimeter policy must permit the transport actually in use; it does not necessarily need native ESP when all protected data uses UDP encapsulation.
:::

## Tunnel mode and transport mode

In **ESP tunnel mode with encryption**, the original IP header, transport header and application data become protected content. A new outer IP header identifies the VPN endpoints. For the branch example, the outer packet goes from `198.51.100.1` to `203.0.113.1`; the inner packet still goes from `10.1.1.10` to `10.2.2.20`. An intermediate router uses the outer destination. It does not need a route to the inner server subnet to forward that encapsulated packet.

The observer can still see the outer addresses, packet lengths, timing, and the visible ESP header. Encryption does not conceal all traffic metadata. In particular, the ESP SPI and sequence fields are not the encrypted application payload.

In **transport mode**, ESP is inserted after the original IP header. That header remains available for routing while the carried upper-layer content is protected. A straightforward example is two IPsec-capable hosts protecting their own communication. Another valid arrangement is ESP transport mode protecting a **GRE (Generic Routing Encapsulation)** packet already addressed between two routers. GRE wraps one packet inside another; that wrapping supplies no encryption by itself. In that case GRE has already supplied an outer router-to-router IP header, and its inner user packet is inside the protected payload.

| ESP with encryption | Tunnel mode | Transport mode |
|---|---|---|
| Additional outer IP header supplied by IPsec | Yes | No |
| Original IP header | Inside encrypted content | Remains outside ESP encryption |
| Typical simple example | Gateway-to-gateway protection for LAN hosts | Host-to-host protection |
| Can transport-network routers read the original host header? | Not from the encrypted inner packet | Yes, for the ordinary host-to-host example |

```output Simplified ESP packet layouts; not a readable ciphertext capture
Tunnel:
Outer IP (gateway A -> gateway B) | ESP header | encrypted {original IP + transport + data + ESP trailer} | authentication data

Transport:
Original IP (IPsec endpoint A -> B) | ESP header | encrypted {transport + data + ESP trailer} | authentication data
```

These are explanatory layouts. A normal capture on the untrusted path cannot display the encrypted original header in plaintext without appropriate decryption material. AH can also use tunnel or transport mode, but AH never acquires encryption merely by using tunnel mode. The comparison above explicitly assumes ESP with confidentiality enabled.

## IKE and security associations

A **security association (SA)** records agreed parameters such as protocol, algorithms, keys, lifetime and traffic scope. An IPsec SA is unidirectional: the outbound SA used to protect a packet corresponds to an inbound SA at the receiver. Bidirectional user traffic needs SAs for both directions. An SPI helps the receiver select the appropriate SA; it is an identifier, not an encryption key or a GRE tunnel number.

**IKE (Internet Key Exchange)** negotiates the peer relationship and keying material; its protected negotiation is separate from the IPsec data SAs. In **IKEv2**, the initial `IKE_SA_INIT` exchange agrees parameters and exchanges material for key derivation. `IKE_AUTH` authenticates the peers and normally establishes the first CHILD_SA, which provides the IPsec SA pair. The basic initial exchange has four messages, but authentication methods and later exchanges can add more. Do not treat four as the lifetime packet count of an IKEv2 session.

The peers must offer compatible algorithms. If one offers only `AES-CBC-256` and the other only `AES-CBC-128`, they have no common encryption choice, even though both names contain AES. The final number identifies the key length in bits. A proposal's local label may differ at the peers; the offered algorithms and other required parameters must agree. Diagnose the incompatible choice before examining data counters that cannot yet exist.

Diffie-Hellman allows peers to derive shared secret material without sending that secret directly across the network. DH alone does not establish whom the peer is; authentication supplies that assurance. A pre-shared key is a secret configured for authentication. A certificate associates a public key with an identity under a trust system. Certificates can support larger deployments, but require correct identity checks, trusted issuers, time validity and an effective revocation policy. Revocation is not an instant universal result just because a certificate exists.

IKEv2 can create and rekey additional SAs. The negotiation SA is bidirectional; one negotiation relationship may support multiple protected data flows. A data SA's lifetime and the IKE SA's lifetime are not interchangeable. Rekeying replaces keying material and should be considered separately from a fresh user login.

Older IOS material calls **IKEv1** negotiation “phase 1” and “phase 2.” Phase 1 establishes the authenticated ISAKMP/IKE SA; phase 2 negotiates the IPsec data SAs. The legacy command `show crypto isakmp sa` reports that IKEv1 state. IKEv2 uses different exchanges and commands; it is not a backward-compatible setting of IKEv1. RFC 9395 deprecates IKEv1. Recognize it when interpreting older examples, but use current IKEv2 guidance for a new supported implementation.

## Traffic selection and tunnel interfaces

A **policy-based VPN** commonly uses a crypto map referencing a crypto ACL. A permit in that selection ACL identifies traffic to protect for the configured peer. Traffic excluded from that selection is not automatically discarded as it would be by an interface filter; another policy or routing decision controls its fate. If there is an unencrypted route and no separate restriction, unselected traffic may leave unprotected.

For branch-to-HQ traffic, a simple selector is source `10.1.1.0/24`, destination `10.2.2.0/24`. The opposite gateway uses the reverse perspective. A test ping sourced from a public router interface may not match either protected LAN selector. Test from the protected host or explicitly choose a source inside the protected subnet before concluding that selection failed.

A **route-based VPN** represents the protected path with a logical interface, such as an IPsec virtual tunnel interface. Routes direct selected destinations toward that interface. This changes how the forwarding configuration is expressed; it does not eliminate authentication, IPsec SAs, return routes or access policy.

**GRE** is separate encapsulation, identified by IP protocol 47. It can carry traffic such as multicast between routers and can be protected by IPsec. Plain GRE supplies no encryption. This explains GRE-over-IPsec references in older designs, but GRE/OSPF tunnel construction, DMVPN components and platform MTU defaults are not required by these VPN describe objectives. A tunnel interface showing up/up is not evidence that its content is encrypted or that a remote application responds.

## Verify the path, negotiation and data

Check the evidence in layers. First confirm usable interfaces and an underlay route to the peer's public address. A successful public-address ping tests IP/ICMP reachability, not permission for IKE, ESP or UDP 4500. Then inspect IKE status with the command appropriate to the configured version. On supported IOS XE, `show crypto ikev2 sa` may show READY; legacy IKEv1 examples often show QM_IDLE. Neither is a substitute for inspecting data SAs and testing the application.

```ios R-BR
R-BR# show ip interface brief
R-BR# show ip route 203.0.113.1
R-BR# show crypto ikev2 sa
R-BR# show crypto ipsec sa
```

The following simplified excerpt is representative, not a simulator capture. The counts are cumulative, so compare observations during a controlled test rather than interpreting a lone historical total.

```output Representative IPsec counters for the same SA before and after a test
                         Before        After
#pkts encaps                100          104
#pkts decaps                100          100
```

This router protected four additional outbound packets but recorded no additional successful inbound decapsulation for that SA. It does not identify a unique cause. Inspect the far peer, WAN transport, remote LAN delivery, return route, selectors, filtering and receive errors. Encrypted traffic might have been lost before reaching the peer or rejected on receipt; the application may also have produced no reply.

If both directions increase, the selected SA has carried protected traffic in both directions during that interval. It still does not prove that a particular website, user permission or DNS lookup works. Test the actual application and correlate its timing and addresses. A small successful ping also does not prove that larger packets fit the path; encapsulation adds overhead and MTU problems need separate evidence.

An empty IKE table can result from no triggering traffic, configuration not being used, expired negotiation, or failure. A single intermediate or deleted IKE state is not a unique diagnosis of a wrong key. Check matching proposals, peer identities, authentication and transport evidence before changing settings. Unsupported simulator commands call for the supplied evidence worksheet or a suitable IOS XE environment, not invented output.

## Exam focus

Explain where site-to-site and remote-access VPNs terminate and what traffic is protected. Distinguish encryption from authentication, ESP from AH, IP protocol numbers from UDP ports, and IKE negotiation from data protection. Draw tunnel and transport layouts and describe NAT-T's purpose. V1.1 asks you to describe IPsec remote access and site-to-site VPNs; v2.0 additionally names protocols and transport modes. The optional implementation reference and supplied status-output worksheet make those concepts concrete. They are supplementary observation practice, not additional published exam verbs or a requirement to memorize advanced VPN design.
