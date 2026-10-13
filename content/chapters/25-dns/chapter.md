---
id: dns
number: 25
title: DNS
subtitle: Resolve names, interpret records, and isolate the cause of a failed lookup.
part: services
domain: services
minutes: { lesson: 65, lab: 80 }
summary: Explain DNS client, resolver, and authoritative roles; diagnose A, AAAA, CNAME, MX, NS, and PTR records; configure an IOS DNS client and distinguish resolution from application reachability.
objectives:
  v1: ["4.3"]
  v2: ["4.4"]
prereqs: [tcp-udp-ports, dhcp, ipv6-addressing]
sectionIds:
  "What names and DNS records provide": why-the-network-needs-a-directory
  "Follow a lookup and its cached answer": how-a-query-walks-the-tree
  "Choose and verify the correct record type": the-record-types-and-their-rules
  "Configure the router as a DNS client": dns-on-a-cisco-router
  "Diagnose the failing stage": diagnosing-by-symptom
sources:
  - { title: "RFC 1034: Domain name concepts", url: "https://www.rfc-editor.org/rfc/rfc1034.html" }
  - { title: "RFC 1035: DNS records and messages", url: "https://www.rfc-editor.org/rfc/rfc1035.html" }
  - { title: "RFC 2181: DNS clarification and alias rules", url: "https://www.rfc-editor.org/rfc/rfc2181.html" }
  - { title: "RFC 2308: Negative caching", url: "https://www.rfc-editor.org/rfc/rfc2308.html" }
  - { title: "RFC 7766: DNS over TCP", url: "https://www.rfc-editor.org/rfc/rfc7766.html" }
  - { title: "Cisco IOS 15M&T: DNS configuration", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dns/configuration/15-mt/dns-15-mt-book/dns-config-dns.html" }
  - { title: "Cisco IOS: clear host command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr/command/ipaddr-cr-book/ipaddr-a1.html" }
  - { title: "Microsoft: nslookup", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup" }
  - { title: "Microsoft: ipconfig", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig" }
  - { title: "ISC BIND: dig command documentation", url: "https://bind9.readthedocs.io/en/latest/manpages.html" }
---

DNS lets applications use names while IP forwarding uses addresses. When a user cannot reach an application by name, your job is to establish which name was queried, which server answered, what record was returned, and whether that result matches the intended service.

The v1.1 objective asks you to explain DNS's network role. The v2.0 objective specifically asks you to diagnose A, AAAA, CNAME, MX, NS, and PTR records. The examples therefore emphasize these six types and evidence-based troubleshooting. The IOS client configuration supports that work; building a production recursive resolver or authoritative service is not the scope of this chapter.

## What names and DNS records provide

:::facts
- **DNS**, the Domain Name System, stores different types of information under names; it does more than return IPv4 addresses.
- **A** identifies IPv4 addresses; **AAAA** identifies IPv6 addresses; **CNAME** identifies an alias target.
- **MX** identifies mail exchangers; **NS** identifies authoritative name servers; **PTR** supports reverse name lookup.
- Conventional DNS uses **UDP 53 and TCP 53**. TCP is not limited to one special kind of query.
- A record's **TTL** is a cache lifetime in **seconds**, not an IP hop limit.
- A DNS answer does not prove that the destination application is reachable or healthy.
:::

A **domain name** consists of labels separated by dots, such as `app.lab.example`. The hierarchy is interpreted from the right: the root, a top-level domain, and the labels below it. An **FQDN**, or fully qualified domain name, identifies the complete name. A trailing dot makes that absolute meaning explicit in DNS tools and zone notation. Applications often accept an apparently complete name without a trailing dot; search behavior depends on the client, so avoid universal rules based only on punctuation.

A **zone** is an administratively served portion of the namespace. An **authoritative server** answers from the zone data for which it is responsible. A zone can delegate a subdomain to other authoritative servers. A server does not need to contain every organization's records to participate in DNS.

The client normally uses a **stub resolver**, part of its operating-system or application environment, to ask a configured DNS service. A **recursive resolver** does the necessary lookup work on the client's behalf and may cache results. One device can perform more than one DNS role; the roles describe what it is doing for a particular query.

DHCP option 6 can supply resolver addresses, but DHCP and DNS remain separate services. A host may receive a correct address and gateway while being given an incorrect resolver. Changing a DHCP pool's DNS option does not immediately update all already-configured clients; check their actual settings and obtain refreshed configuration through the appropriate renewal process.

## Follow a lookup and its cached answer

Suppose a resolver has no relevant cached information, is allowed to perform recursion, and is not forwarding the request to another resolver. For `www.example.com`, it can ask a root server, follow a referral to a `.com` server, and follow the domain's delegation to an authoritative server. A **referral** directs the resolver toward servers that may know the next portion of the name. The root need not know the application's final address.

```diagram
{"type":"sequence","title":"A simplified uncached recursive lookup","caption":"This example has no forwarding resolver or useful cached delegation; real lookups can omit stages because of caching or local policy.","actors":["Client","Recursive resolver","Root","TLD server","Authoritative server"],"steps":[{"from":0,"to":1,"label":"Ask for www.example.com A","accent":true},{"from":1,"to":2,"label":"Find the next authority"},{"from":2,"to":1,"label":"Referral toward .com"},{"from":1,"to":3,"label":"Find example.com authority"},{"from":3,"to":1,"label":"Referral for example.com"},{"from":1,"to":4,"label":"Query the required name/type"},{"from":4,"to":1,"label":"Address answer and TTL"},{"from":1,"to":0,"label":"Return the result","accent":true}]}
```

The resolver can reuse cached information instead of repeating the entire process. A **recursive query** asks the receiving service to complete resolution if it supports and permits that work. An **iterative query** can receive an answer or a referral, which the querying resolver follows itself. A client configured with an authoritative-only server may not receive general recursive service; reachability of port 53 alone does not establish that server's permitted role.

A TTL of 3,600 seconds allows ordinary caching for up to one hour from receipt, subject to resolver policy. If a resolver obtained an answer 15 minutes ago, a simple unrefreshed cache has 2,700 seconds remaining. Changing the authoritative record does not push the change instantly into every cache. Lowering a TTL is useful before a planned change only after earlier cached copies have had time to expire; it cannot retroactively shorten a copy already held elsewhere.

Negative answers can be cached too. A name created after a negative lookup may remain unavailable through a resolver holding the earlier result. The zone's **SOA (Start of Authority)** record carries its authority and maintenance information, including the values used for negative caching. RFC 2308 derives that lifetime from the smaller of the SOA record's TTL and its MINIMUM field. You need the operational implication here, not a complete lesson in zone-maintenance timers: query the relevant server and inspect the actual remaining lifetime before deciding an edit failed.

Small queries commonly use UDP. A truncated reply, indicated by **TC**, may require retry over TCP; DNS implementations must support TCP as described by RFC 7766. TCP can also carry ordinary queries by choice and full zone transfers. The traditional unextended DNS UDP limit is 512 bytes, while EDNS allows a larger advertised size. Do not assume every answer above 512 bytes requires TCP today, or that UDP-only reachability proves complete DNS connectivity.

## Choose and verify the correct record type

A **resource record** associates a name and type with data. Record types matter because a correct answer of the wrong type may not help the application. Ask which address family or service the client actually needs.

| Type | Example data | What to verify |
|---|---|---|
| A | `app.lab.example → 10.1.1.80` | Correct IPv4 address and reachable IPv4 service |
| AAAA | `app.lab.example → 2001:db8:25::80` | Correct IPv6 address and usable IPv6 path |
| CNAME | `www.lab.example → app.lab.example` | Correct alias target and resolution of the requested type |
| MX | `lab.example → preference 10, mail.lab.example` | Exchanger hostname, preference, and address records |
| NS | `lab.example → ns1.lab.example` | Correct authority/delegation and reachable name-server addresses |
| PTR | `80.1.1.10.in-addr.arpa → app.lab.example` | Reverse data for the particular address |

An **A record** and an **AAAA record** are separate data. An IPv4 answer does not establish an IPv6 address. A name can have several records of a type, so compare all returned addresses with the intended design. Multiple addresses do not by themselves prove that every backend works or that a particular client will choose the same one each time.

A **CNAME** makes its owner name an alias of another name. `www.lab.example` can point to `app.lab.example`, whose address records identify the server. For a web lookup, follow the alias until a usable requested address record is found. A target may itself be an alias; a loop or missing final address prevents completion. An alias is not inherently invalid just because its target has no address record, but it cannot then provide the address-based service being requested.

Ordinary CNAME data cannot coexist with other ordinary record data at that same owner name. Thus a conventional zone apex, which already has SOA and NS data, cannot also be an ordinary CNAME. Provider-specific alias conveniences are not evidence that standard CNAME rules changed. Correct the data according to the actual record type rather than adding contradictory records to make a symptom disappear.

An **MX record** has a preference value and an exchanger hostname. Smaller preferences are preferred; equal values can distribute attempts according to sender behavior. The exchanger needs appropriate address records and must not itself be a CNAME alias. For `lab.example MX 10 mail.lab.example`, query the domain's MX record, then resolve `mail.lab.example`, then test the intended mail service. Website success establishes none of those mail dependencies.

An **NS record** identifies an authoritative server. It is not the DNS-resolver IP address entered in a PC's settings. If a domain delegates to a wrong or unreachable server, the records behind that delegation may become unavailable. Compare parent delegation and the intended authoritative service. The name-server hostname must also be resolvable; necessary parent-supplied address information is called **glue**. Detailed delegation administration belongs to DNS operations, but you must recognize the dependency when diagnosing an unreachable authority.

A **PTR record** maps a reverse-lookup name to a hostname. IPv4 reverses its octets under `in-addr.arpa`: `10.1.1.80` becomes `80.1.1.10.in-addr.arpa`. IPv6 reverse lookup uses hexadecimal digits in reverse order under `ip6.arpa`; ordinary tools construct this for you. Forward A/AAAA and reverse PTR data are managed separately. A correct forward record does not automatically prove a matching PTR exists.

SOA describes a zone's authority and maintenance information; TXT carries text used by various applications and verification systems. Recognize their purpose when they appear, but the six record types above are the explicit v2 diagnosis focus.

## Configure the router as a DNS client

A router can forward users' DNS packets, advertise resolver addresses through DHCP, and resolve names for its own commands. These are three different functions. Configuring `ip name-server` affects the router's own lookups; it does not change every attached PC's settings or make the router an authoritative DNS server.

```ios R1
R1# configure terminal
R1(config)# ip domain-lookup
R1(config)# ip name-server 10.1.1.53
R1(config)# ip domain name lab.example
R1(config)# ip host localweb 10.1.1.80
R1(config)# end
R1# show hosts
R1# ping app.lab.example
```

`ip domain-lookup` enables the documented IOS DNS client function. Some releases display or accept the spelling `ip domain lookup`; use the supported syntax. `ip name-server` selects the resolver, and `ip domain name` supplies a default suffix for unqualified names such as `app`. `ip host` creates a local static mapping. Static/cached name information can satisfy a lookup before a new DNS query occurs.

If an IOS **domain list** is configured, Cisco's referenced procedure uses that list instead of the single default domain name. It is not an extra suffix appended after `ip domain name`. This matters when a short name fails but its full name works. Verify the complete name being queried, not only that a resolver address is present.

`show hosts` reports name-service settings and the host table. Permanent entries represent static mappings; temporary entries can be cached answers. On the documented IOS implementation, `clear host app.lab.example` clears the named hostname-cache entry; `clear host *` selects all entries in the applicable cache. Removing an intentional static mapping from configuration uses `no ip host name`. Inspect the resulting table instead of assuming identical cache handling on every image. Do not assume a cached name will still be present for a later test—inspect the actual table.

Disabling lookup with `no ip domain-lookup` prevents the router from making ordinary DNS lookups for its own command names. It does not block forwarded UDP/TCP 53 traffic for users. A console typo can otherwise trigger hostname lookup depending on IOS command handling and settings. Configure or disable the client deliberately; do not promise that every spelling error, resolver, or image produces the same delay or error text.

:::trap A cached answer is still an answer
A successful name-based ping can use a local mapping or an earlier cached result. It does not prove that a new DNS query reached a server. Conversely, a cached negative answer can remain after the authoritative record is fixed. Inspect the name table or query the chosen server explicitly before deciding which stage works.
:::

## Diagnose the failing stage

Use a specific name, requested type, resolver, and expected result. Compare the client's actual DNS setting with the design. Query that resolver explicitly when the tool permits it. Then determine whether you received a reply, whether it contains usable data, and whether the returned data is correct.

| Observed result | Meaning | Next useful check |
|---|---|---|
| Query timeout | No usable response arrived within the tool's wait | Resolver address, service, path, UDP/TCP policy |
| NXDOMAIN | Reply reports the queried name, or final alias target, absent | Spelling, intended zone, negative cache, server/view queried |
| Completed NODATA response | No data of the requested type at the name | Requested type and corresponding record |
| SERVFAIL | DNS service replied that it could not complete the lookup | Resolver/authority/delegation or validation evidence |
| Usable but wrong address | Resolution returned data inconsistent with the design | Record, alias chain, cache, split views or local override |
| Correct address, failed application | Resolution succeeded for the tested type | Address reachability, application port, server behavior |

**NXDOMAIN** is not proof that your PC directly reached an authoritative server; a recursive resolver can return a cached negative answer. **NODATA** is a completed no-data result, commonly represented by `NOERROR` without the requested answer. An arbitrary `NOERROR` response with zero answers can instead be a referral, so inspect the response context. **SERVFAIL** does not uniquely identify a missing record or one failed upstream device.

Testing by IP is useful but should match the service. A successful ping tests ICMP reachability, not HTTP or mail. A browser may require a particular hostname for virtual hosting or certificates, so failure of an IP-literal URL is not automatically a network failure. In the controlled Packet Tracer lab, one HTTP server serves the same simple page by address and name, making that comparison valid.

Applications can use local host files or caches, while a diagnostic query can contact the configured DNS server directly. If `ping` and `nslookup` disagree, compare the exact name, address family, selected server, and local overrides before changing authoritative data. Windows `ipconfig /displaydns` and `/flushdns` inspect and clear its client cache; clearing that cache does not edit a hosts file or purge a remote resolver.

## Reading the output

These are representative, abbreviated teaching records, not captured simulator runs. A real tool's labels and formatting may differ.

```output Client query: nslookup www.lab.example 10.1.1.53
Server:  ns1.lab.example
Address: 10.1.1.53  ← Server queried, not the web server

Non-authoritative answer:
Name:    app.lab.example
Address: 10.1.1.80  ← Returned application address
Aliases: www.lab.example  ← The alias points to the canonical name
```

`Non-authoritative answer` normally means the response was not marked authoritative for this data; it is common when asking a recursive resolver and is not a failure indication. Likewise, `Server: UnKnown` can indicate no reverse name for the queried resolver. Inspect the actual answer before calling the lookup unsuccessful.

```output Representative dig response excerpts
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 1001  ← A negative name result was received
;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 1002  ← Failure response, not silence
```

With `nslookup`, request a type and server explicitly: `nslookup -type=MX lab.example 10.1.1.53`. With `dig`, the equivalent form is `dig @10.1.1.53 lab.example MX`; `dig -x 10.1.1.80` constructs the reverse lookup. These tools are not equally available in Packet Tracer, so record-based MX, NS, PTR, and IPv6 exercises have a paper path. Do not install a DNS service or alter a public zone just to reproduce an example.

Finish by retesting the corrected record chain and the actual service from the affected client. A working query from a different network can use another resolver or view. Keep the before/after evidence so the repair explains the user's original failure.

## Exam focus

- Distinguish client resolver settings, recursive service, and authoritative data.
- Diagnose A, AAAA, CNAME, MX, NS, and PTR dependencies.
- Explain ordinary caching and why record edits may not be visible immediately.
- Recognize both UDP and TCP 53 and a truncated response.
- Separate timeout, NXDOMAIN, NODATA, SERVFAIL, and a wrong answer.
- Configure and inspect the router's own DNS client without confusing it with user forwarding.
- Verify the corrected name/type/server result and then the required application.
