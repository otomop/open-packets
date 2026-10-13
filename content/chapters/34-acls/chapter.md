---
id: acls
number: 34
title: Access control lists
subtitle: Turn an access policy into IPv4 rules, then test the packet path in both directions.
part: security
domain: services
minutes: { lesson: 75, lab: 85 }
summary: Configure standard and extended IPv4 ACLs, calculate wildcard matches, edit named and numbered lists, choose interface direction, restrict VTY access, and verify the intended policy without mistaking TCP flags or counters for session tracking.
objectives:
  v1: ["5.6"]
  v2: ["4.6"]
prereqs: [static-routing-ipv4, tcp-udp-ports, ios-essentials, nat-pat]
sectionIds:
  "Start with the access policy": why-a-router-needs-a-filter
  "First match and implicit deny": how-an-acl-is-evaluated
  "Wildcard masks": wildcard-masks
  "Standard ACLs": standard-acls
  "Extended ACLs and return traffic": extended-acls
  "Names, sequence numbers and safe edits": named-acls-sequence-numbers-and-editing
  "Interfaces, direction and VTY access": applying-an-acl-interfaces-direction-and-the-vty-lines
  "Verify and troubleshoot": verify-and-troubleshoot
  "Exam focus": exam-focus
sources:
  - { title: "Cisco CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: IP Access List Overview, IOS 15M&T", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-access-list-ov.html" }
  - { title: "Cisco: Creating an IP Access List and Applying It to an Interface", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-create-ip-apply.html" }
  - { title: "Cisco: IP Access List Entry Sequence Numbering", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/15-mt/sec-data-acl-15-mt-book/sec-acl-seq-num.html" }
  - { title: "Cisco: Configure IP Access Lists", url: "https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html" }
  - { title: "Cisco: Harden IOS Devices, management access controls", url: "https://www.cisco.com/c/en/us/support/docs/ip/access-lists/13608-21.html" }
  - { title: "Cisco: Commonly Used IP ACLs, TCP flag matching", url: "https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html" }
  - { title: "Cisco: Classic IOS locally generated packet behavior", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960xr/software/15-2_5_e/configuration_guide/b_1525e_consolidated_2960xr_cg/b_1525e_consolidated_2960xr_cg_chapter_01000000.pdf" }
  - { title: "Cisco: Clear access-list counters command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-c1.html" }
  - { title: "Cisco: Catalyst 9000 Access Control Lists Configuration Guide", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html" }
---

An access control list makes a traffic policy precise. Instead of saying “protect the server,” you identify the clients, destination, protocol and permitted service. You then choose where the router should check those fields. An ACL can be syntactically correct and still enforce the wrong policy because its entries are out of order or it is attached to the wrong interface direction.

You have already used a small source list to select NAT traffic and restrict an SNMP community. This chapter develops the complete match-and-attachment model for packet filtering. Keep Chapter 33's identity decision separate: admitting an SSH packet does not authenticate its user, and a valid account does not override a packet filter.

## Start with the access policy

:::facts
- An access control entry (ACE) contains matching conditions and a `permit` or `deny` action. An ACL is a list of those entries.
- For an IPv4 interface filter, the first matching entry decides; traffic matching no entry is implicitly denied.
- Standard IPv4 ACLs match source addresses. Extended IPv4 ACLs can also match destinations, IP protocols and relevant protocol fields.
- Standard numbered ranges: `1–99`, `1300–1999`. Extended numbered ranges: `100–199`, `2000–2699`.
- Wildcard bit `0` means compare; bit `1` means ignore. `host` compares all 32 address bits; `any` ignores all 32.
- `ip access-group NAME in|out` attaches an interface filter. `access-class NAME in` restricts incoming VTY management access.
- Ordinary interface ACLs do not keep a connection table. TCP `established` tests ACK or RST, not a remembered session.
:::

Consider clients `10.100.10.0/24`, a web server `10.100.20.20`, and a file server `10.100.20.30`. The policy is: allow clients to use HTTP on the web server, deny their other traffic to that server, and leave other destinations available. This needs an extended ACL because source addresses alone cannot distinguish HTTP from ping or one server from another.

Write down what must remain available before configuring: application requests, their replies, DNS if names are used, and your management connection. Also identify the default policy. “Permit listed services, deny everything else” requires no final broad permit. “Block these exceptions, allow the rest” does. Neither is universally correct; the requirement decides.

ACLs are also used as selectors by NAT, QoS and VPN features. In those contexts an ACL match identifies traffic for another action. A `deny` in a NAT selection ACL normally excludes traffic from that translation rule; it does **not** by itself mean an interface discarded the packet. Always identify the command referencing the ACL before interpreting its effect.

## First match and implicit deny

For an interface filter, evaluate entries from the top of the effective list and stop at the first match. A matching permit lets the packet continue through processing; it does not supply a missing route or override a later filter. A matching deny discards it. A nonempty list also has an implicit deny at its end, even when no deny appears in the displayed configuration.

```output Representative CLIENTS-IN rules
10 permit tcp 10.100.10.0 0.0.0.255 host 10.100.20.20 eq 80
20 deny ip 10.100.10.0 0.0.0.255 host 10.100.20.20
30 permit ip any any
```

A TCP request from `10.100.10.11:51000` to `10.100.20.20:80` matches entry 10. An ICMP echo from the same client to the same server misses 10 because ICMP is not TCP, then matches deny 20. A packet to `10.100.20.30` misses both destination tests and reaches permit 30. All fields on an entry must match; matching the destination alone is insufficient.

Move permit 30 to the top and the deny becomes unreachable. The router does not search for the most specific ACL entry as it searches for the longest matching route. Specific exceptions therefore normally precede broader rules. Likewise, a list containing only denies blocks all IPv4 traffic evaluated by that filter: an unmatched packet reaches the implicit deny.

On the classic IOS interface behavior documented for these labs, a referenced list that is absent or empty does not provide a deny-all filter. Once entries exist, implicit deny becomes relevant. Do not use an empty list as a security policy or build a restrictive list one line at a time while it is live. Prepare the complete list before attachment. Platform-specific ACL features can have different behavior, so use the documentation for the device being configured.

## Wildcard masks

An IPv4 address is 32 bits. The wildcard chooses which of those bits the ACL compares. For the pair `10.100.10.64 0.0.0.31`, the first three octets must match exactly. In the final octet, `64` is `01000000` and `31` is `00011111`. The first three bits must therefore be `010`; the remaining five may vary. That matches `.64` through `.95`.

For a subnet, subtract its mask from `255.255.255.255`, octet by octet. A /27 mask is `255.255.255.224`; its wildcard is `0.0.0.31`. Write the subnet's network address as the base for clarity. The ACL compares addresses, including the network and broadcast values; it does not automatically remove values that cannot be ordinary host assignments.

| Intended set | Address and wildcard | Matching address range |
|---|---|---|
| One server | `host 10.100.20.20` | Only `10.100.20.20` |
| /24 | `10.100.10.0 0.0.0.255` | `10.100.10.0–10.100.10.255` |
| /27 | `10.100.10.64 0.0.0.31` | `10.100.10.64–10.100.10.95` |
| /30 | `10.100.10.4 0.0.0.3` | `10.100.10.4–10.100.10.7` |
| /20 | `172.16.32.0 0.0.15.255` | `172.16.32.0–172.16.47.255` |
| /21 | `192.168.16.0 0.0.7.255` | `192.168.16.0–192.168.23.255` |

The shortcuts are `host A` = `A 0.0.0.0`, and `any` = `0.0.0.0 255.255.255.255`. Ignored bits in the base do not affect the match: `.77` with wildcard `0.0.0.31` describes the same last-octet set as `.64`, because both begin `010`. Network-aligned notation is easier to review, but alignment is not an additional wildcard matching rule.

A wildcard need not be the inverse of a valid subnet mask. For example, `10.1.1.0 0.0.254.255` compares only the lowest bit of the third octet. That bit is `1`, so it matches odd third octets, including `10.1.1.0/24`, `10.1.3.0/24` and `10.1.255.0/24`. It does not describe one contiguous subnet. For any wildcard pattern, compare packet and base address bits only where the wildcard contains zero; every compared bit must match. The simpler block-range shortcut works only for the corresponding contiguous pattern.

:::trap Using a subnet mask as a wildcard
`10.100.10.0 255.255.255.0` ignores the first three octets and compares the last octet to zero. It matches `192.0.2.0` and excludes `10.100.10.25`. IOS can accept a logically wrong wildcard because noncontiguous wildcards are legitimate syntax.
:::

## Standard ACLs

A standard ACL can permit PC-A while denying other sources, but it cannot select a particular destination or service. This numbered example allows only PC-A through whichever filter references it:

```ios R1
R1# configure terminal
R1(config)# access-list 10 permit host 10.100.10.10
R1(config)# access-list 10 deny any
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip access-group 10 out
R1(config-if)# end
```

Here G0/1 faces the entire server LAN. PC-A can reach both servers; PC-B can reach neither. The explicit deny documents the policy and provides an observable entry. Omitting it gives the same forwarding decision through implicit deny, but usually less useful counter evidence.

The usual placement guideline is to put a standard ACL near the destination. Denying PC-B inbound on the client LAN would also block its traffic to other destinations. Filtering outbound toward the protected LAN confines the effect to that path. A standard list still cannot distinguish two hosts on that same destination LAN: use an extended ACL if one must remain available while the other is blocked.

Named standard ACLs express the same source-only conditions under `ip access-list standard NAME`. Naming does not make an ACL extended. Standard and extended describe matching capability; numbered and named describe how you identify the list. Recognize all four combinations required by the IPv4 ACL objective.

## Extended ACLs and return traffic

Read an extended ACE in this order: action, protocol, source, optional source-port test, destination, optional destination-port test, additional options. Use `ip` for all IPv4 protocols, `tcp` or `udp` when ports matter, and `icmp` when matching messages such as `echo` or `echo-reply`.

```ios R1
R1# configure terminal
R1(config)# access-list 101 permit tcp 10.100.10.0 0.0.0.255 host 10.100.20.20 eq 80
R1(config)# access-list 101 deny ip 10.100.10.0 0.0.0.255 host 10.100.20.20
R1(config)# access-list 101 permit ip any any
R1(config)# end
```

The `eq 80` follows the destination and matches the service port on the server. Moving it after the source would require the client to use source port 80, which ordinary web requests do not. For the reply, the addresses reverse and TCP source port is 80; its destination is the client's chosen port. Treat it as a separate packet through a separate interface direction.

| Operator | Meaning | Example |
|---|---|---|
| `eq` | Equal | `eq 443` |
| `neq` | Not equal | `neq 23` |
| `lt` | Less than | `lt 1024` |
| `gt` | Greater than | `gt 1023` |
| `range` | Inclusive range | `range 10000 10010` |

Port numbers are unambiguous; IOS may display familiar aliases such as `www` for 80 or `domain` for 53. Use TCP 22 for SSH, TCP 80 for HTTP, TCP 443 for HTTPS, and both UDP and TCP 53 when a DNS policy must support both transports. A permit for one transport does not permit the other.

The TCP option `established` matches when **ACK or RST is set**. A normal initial SYN lacks both and misses that entry. A SYN-ACK response matches. However, a packet with a forged ACK also matches, even when no client opened a session. An ordinary ACL does not validate that a packet belongs to a connection. A stateful firewall maintains connection state and applies additional checks; this keyword does not turn the ACL into one.

ICMP echo and echo-reply also need separate consideration. Their meaning does not determine interface direction: a server can send an echo request too. UDP has no TCP flags, so `established` cannot help its replies. If filtering both directions, write the necessary reverse rules explicitly and test them with the intended application.

## Names, sequence numbers and safe edits

Use meaningful names and short remarks. A named extended ACL is easier to edit when you assign sequence numbers explicitly:

```ios R1
R1# configure terminal
R1(config)# ip access-list extended CLIENTS-IN
R1(config-ext-nacl)# 10 permit tcp 10.100.10.0 0.0.0.255 host 10.100.20.20 eq 80
R1(config-ext-nacl)# 20 deny ip 10.100.10.0 0.0.0.255 host 10.100.20.20
R1(config-ext-nacl)# 30 permit ip any any
R1(config-ext-nacl)# end
```

On IOS supporting ACL sequence editing, `15 permit icmp host 10.100.10.10 host 10.100.20.20 echo` inserts an exception before deny 20. `no 20` in this ACL's configuration mode removes that entry. `ip access-list resequence CLIENTS-IN 100 10` in global configuration renumbers entries starting at 100 in increments of 10, preserving their relative order. It is housekeeping, not a policy change. Without explicit numbers, IOS commonly assigns increments of ten; always inspect the actual list before editing.

Numbered ACLs can also be edited through named-list configuration mode on supported IOS: `ip access-list extended 101`. In contrast, the legacy global command `no access-list 101` deletes the whole ACL. Cisco also documents legacy syntax that deletes the entire numbered list even when the rest of an ACE follows that command. Use the sequence in the correct submode instead of guessing how a global `no access-list` line behaves.

For a substantial change, build a complete replacement under a new name, review it, then change the interface reference. Keep console access while changing management rules. Do not delete the live list first and create an unfiltered interval. Simulator support for individual editing commands varies; if resequencing is unavailable, keep the existing numbers or build a replacement list offline.

## Interfaces, direction and VTY access

“In” and “out” are relative to the interface on the device doing the filtering. Follow the packet, not the location of the user. The request enters R1 G0/0 and leaves G0/1. Its reply enters G0/1 and leaves G0/0.

```diagram
{ "type": "topology", "title": "Request and reply use opposite directions", "caption": "CLIENTS-IN on G0/0 inbound checks the request. It is not automatically evaluated for the return packet leaving G0/0.", "nodes": [ { "id": "C", "kind": "pc", "label": "Client", "sub": "10.100.10.10", "x": 1, "y": 3 }, { "id": "R", "kind": "router", "label": "R1", "x": 6, "y": 3 }, { "id": "S", "kind": "server", "label": "WEB", "sub": "10.100.20.20", "x": 11, "y": 3 } ], "links": [ { "from": "C", "to": "R", "toLabel": "G0/0 in", "accent": true }, { "from": "R", "to": "S", "fromLabel": "G0/1 out", "accent": true } ], "trace": { "flows": [ { "path": ["C", "R", "S"], "back": true, "label": "Request, then its reply", "tags": { "R": "In G0/0 · CLIENTS-IN · out G0/1" }, "backTags": { "R": "In G0/1 → out G0/0 · no CLIENTS-IN" } } ] } }
```

For ordinary routed IPv4 interface ACLs, there is one inbound and one outbound list per interface. Another IPv4 `ip access-group` in the same direction replaces that reference; it does not append a second independent list. In the normal forwarding path, inbound filtering precedes the route lookup and outbound filtering follows selection of the egress interface. Place extended filters near the source when that enforces the intended policy efficiently; placement is a guideline, not a syntax restriction.

A VTY access class protects sessions terminating on the router. The following allows only PC-A as a source; SSH and authentication must also be configured, as the lab demonstrates:

```ios R1
R1# configure terminal
R1(config)# ip access-list standard VTY-ADMINS
R1(config-std-nacl)# permit host 10.100.10.10
R1(config-std-nacl)# exit
R1(config)# line vty 0 4
R1(config-line)# access-class VTY-ADMINS in
R1(config-line)# end
```

Apply the restriction to every VTY range present on the device; check `show line` and the running configuration. `in` here means incoming management connections. It is not an interface direction and does not filter transit web traffic. An interface ACL can still reject the SSH packet before it reaches the VTY control.

## Verify and troubleshoot

Check both definition and attachment. `show access-lists CLIENTS-IN` shows entries and supported counters; `show ip interface gigabitethernet0/0` identifies its inbound and outbound lists. An ACL's existence alone proves no attachment.

```output Representative excerpt after controlled tests
Extended IP access list CLIENTS-IN
    10 permit tcp 10.100.10.0 0.0.0.255 host 10.100.20.20 eq www (12 matches)
    15 permit icmp host 10.100.10.10 host 10.100.20.20 echo (4 matches)
    20 deny ip 10.100.10.0 0.0.0.255 host 10.100.20.20 (4 matches)
    30 permit ip any any (8 matches)
```

Record counters before a test and compare afterward. These illustrative totals are not a required Packet Tracer result. A web connection sends multiple packets and may reuse cached content; hardware platforms may update counters differently. A counter increase means the entry matched observed traffic, not that the application completed. A zero counter may mean no matching traffic arrived, the list is attached elsewhere, or an earlier rule matched.

Test from a host whose packet traverses the intended interface. Router-originated probes can have a different source address and processing path; classic IOS outbound filters commonly exclude locally generated traffic. Never use a successful router ping alone to prove a host's ACL path is permitted. For a failure, check links, addressing, routes and application service as well as the forward and return filters. An ICMP error may help localize a rejection, but a timeout does not prove a request passed: loss or filtering anywhere can produce silence.

## Exam focus

Be able to translate a short policy into standard or extended IPv4 ACEs, using both names and numbers. Calculate a wildcard, trace the first match, identify implicit deny, distinguish source and destination ports, and attach the list in the correct direction. Explain why a return packet needs its own evaluation and why `established` is not stateful inspection. V1.1 requires configuring and verifying ACLs; v2.0 explicitly names IPv4 standard, extended, numbered and named lists. IPv6 ACL configuration and advanced firewall design are outside this chapter's required exercise.
