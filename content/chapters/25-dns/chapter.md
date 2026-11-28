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

A user reports that the intranet is down. You ping the web server by address and it replies, and the page loads by address. Switching, routing and the server are all fine. What failed is the step before any packet went to the server: turning the name the user typed into the right address. Until you can show where that step broke, every other test points you the wrong way.

Chapter 6 introduced port 53, and Chapter 24 showed DHCP handing each host the address of a DNS server. This chapter covers what happens when the host uses that address: who it asks, who holds the answer, what a record contains and how long an answer is remembered. By the end you will be able to read the six record types the exam names, configure an IOS router as a DNS client, and tell apart a query that timed out, a name that does not exist, a wrong answer and a broken application.

## What names and DNS records provide

:::facts
- **DNS**, the Domain Name System, stores different types of information under names; it does more than return IPv4 addresses.
- **A** identifies IPv4 addresses; **AAAA** identifies IPv6 addresses; **CNAME** identifies an alias target.
- **MX** identifies mail exchangers; **NS** identifies authoritative name servers; **PTR** supports reverse name lookup.
- Conventional DNS uses **UDP 53 and TCP 53**. TCP is not limited to one special kind of query.
- A record's **TTL** is a cache lifetime in **seconds**, not an IP hop limit.
- A DNS answer does not prove that the destination application is reachable or healthy.
:::

IP forwarding works only with addresses, but people and applications use names. DNS is the distributed database that connects the two. A host asks a DNS server a question such as "what is the IPv4 address of `app.lab.example`?" and gets back a **record**, a piece of data stored under that name. The host then sends its packets to the returned address. DNS takes no further part, which is why a correct answer tells you nothing about the application behind it.

A **domain name** is a series of labels separated by dots, read from right to left: in `app.lab.example`, `example` is the top-level domain, `lab` is a domain inside it and `app` is a host. Above the top-level domains sits the unnamed **root**. An **FQDN**, or fully qualified domain name, is the complete name, as opposed to a short name such as `app` that a client completes with a configured suffix. In DNS tools a trailing dot, as in `app.lab.example.`, marks a name as already complete.

No single server holds every name. The namespace is divided into **zones**, each run by one organisation. An **authoritative server** holds the records of its zone and answers from that data. A zone can **delegate** part of its namespace: the `example` zone can hand `lab.example` to other authoritative servers, which then answer for every name under it.

Three roles take part in a lookup. The **stub resolver** is the DNS client built into every operating system; it sends the question to the host's configured DNS server and waits. That server is a **recursive resolver**: it searches on the client's behalf, returns the final answer and caches what it learned. The authoritative servers answer the resolver's questions. One machine can fill more than one role. In this chapter's lab, DNS1 at 10.1.1.53 holds the `lab.example` records and is also the server that PC-A and R1 ask.

A host usually learns its resolver address from DHCP option 6, the `dns-server` line in an IOS pool. The two services stay separate: a host can receive a correct address and gateway with the wrong resolver, in which case it works by address and fails by name. Changing the pool does not reach hosts that already hold a lease. They keep the old resolver until they renew, so check the host's actual setting before you retest.

## Follow a lookup and its cached answer

A recursive resolver finds an answer by working down the hierarchy from the root, one referral at a time. Suppose a client asks its resolver for the A record of `www.example.com` and the resolver has nothing cached. The resolver asks a root server. The root does not know the address, but it knows which servers handle `.com`, so it replies with a **referral** to them. A `.com` server in turn refers the resolver to the authoritative servers for `example.com`. One of those returns the address, and the resolver passes it back to the client.

```diagram
{"type":"sequence","title":"A simplified uncached recursive lookup","caption":"This example has no forwarding resolver or useful cached delegation; real lookups can omit stages because of caching or local policy.","actors":["Client","Recursive resolver","Root","TLD server","Authoritative server"],"steps":[{"from":0,"to":1,"label":"Ask for www.example.com A","accent":true},{"from":1,"to":2,"label":"Find the next authority"},{"from":2,"to":1,"label":"Referral toward .com"},{"from":1,"to":3,"label":"Find example.com authority"},{"from":3,"to":1,"label":"Referral for example.com"},{"from":1,"to":4,"label":"Query the required name/type"},{"from":4,"to":1,"label":"Address answer and TTL"},{"from":1,"to":0,"label":"Return the result","accent":true}]}
```

Two kinds of query appear in that exchange. The client's question is a **recursive query**: return the final answer, whatever work that takes. The resolver's questions to the other servers are **iterative queries**: each server replies with the best it has, either the answer or a referral, and the resolver follows the referrals itself.

Walking the hierarchy for every lookup would be slow, so resolvers and hosts cache what they learn. Every record carries a **TTL**, the number of seconds a cache may reuse it. If a resolver receives a record with a TTL of 3,600 and is asked for the same name 15 minutes later, it answers from its cache with 2,700 seconds remaining. At zero the entry is discarded and the next query goes back to the authoritative server.

Changing a record therefore does not change what caches already hold. If you move `app.lab.example` to a new address, resolvers that cached the old address keep giving it out until their copy expires.

Failures are cached too. A resolver that is told a name does not exist remembers that negative answer for a time taken from the zone's **SOA (Start of Authority)** record, which holds the zone's administrative settings. A name created just after someone looked it up can stay "missing" through that resolver until the negative entry expires.

DNS servers listen on port 53 for both UDP and TCP. Most queries are small and use UDP. When a reply is too large for the UDP message, the server sets the **TC** (truncated) flag and the client repeats the query over TCP. Full zone transfers also use TCP, and RFC 7766 requires DNS implementations to support TCP for ordinary queries. In practice a firewall or ACL must permit both UDP 53 and TCP 53, because a path that passes only UDP fails for the large replies.

## Choose and verify the correct record type

A **resource record** has an owner name, a type, a TTL and data. A client always asks for one specific type, so the first question in any DNS fault is which type the application needs.

| Type | Example data | What to verify |
|---|---|---|
| A | `app.lab.example → 10.1.1.80` | Correct IPv4 address and reachable IPv4 service |
| AAAA | `app.lab.example → 2001:db8:25::80` | Correct IPv6 address and usable IPv6 path |
| CNAME | `www.lab.example → app.lab.example` | Correct alias target and resolution of the requested type |
| MX | `lab.example → preference 10, mail.lab.example` | Exchanger hostname, preference, and address records |
| NS | `lab.example → ns1.lab.example` | Correct authority/delegation and reachable name-server addresses |
| PTR | `80.1.1.10.in-addr.arpa → app.lab.example` | Reverse data for the particular address |

An **A record** holds an IPv4 address and an **AAAA record** holds an IPv6 address. They are separate records: a name with an A record and no AAAA record works for an IPv4 client and gives an IPv6-only client no address.

A **CNAME** (canonical name) makes one name an alias of another. With `www.lab.example CNAME app.lab.example`, a client asking for the A record of `www` is told that the real name is `app`, and the lookup continues with `app`'s A record. The address is then kept in one place: change `app`'s A record and every alias follows. Two rules cause most CNAME faults. The chain has to end in a record of the requested type, so an alias whose target has no A record, or two aliases that point at each other, resolve to nothing. And a name that has a CNAME cannot hold any other ordinary record. You cannot add an A record beside it, and the top of a zone (`lab.example` itself), which must hold SOA and NS records, cannot be a CNAME.

An **MX record** tells sending mail servers where to deliver mail for a domain. Its data is a preference number and a hostname, as in `lab.example MX 10 mail.lab.example`. The lowest preference is tried first, so with MX 10 and MX 20 the second server is the backup; equal values share the load. The data is a hostname and never an address, so delivery takes two lookups: the domain's MX record, then the A or AAAA record of the exchanger it names. That hostname needs its own address record and must not be a CNAME. Mail and web use different records, so a working website tells you nothing about mail.

An **NS record** names an authoritative server for a zone. NS records make delegation work: the parent zone holds NS records for the child zone, and those are the referrals the resolver followed in the previous section. If the parent still names a retired server, resolvers are sent to a machine that cannot answer, and every name in the child zone fails even though the new server's records are correct. The resolver also needs the name server's address; when that server's name lies inside the zone it serves, the parent supplies the address with the referral as a **glue** record. Do not confuse an NS record with the DNS server address set on a PC. NS names the servers that hold a zone; the PC setting chooses the resolver the PC asks.

A **PTR record** maps an address back to a name. For IPv4 the octets are reversed and `in-addr.arpa` is added: the PTR for `10.1.1.80` is stored at `80.1.1.10.in-addr.arpa`. IPv6 uses its hexadecimal digits in reverse order under `ip6.arpa`. Forward and reverse records live in different zones and are created separately, so adding an A record does not create its PTR.


## Configure the router as a DNS client

A router touches DNS in three separate ways. It forwards users' DNS packets like any other traffic. It can hand out a resolver address through its DHCP pools. And it can be a DNS client itself, so that you can type `ping app.lab.example` at its prompt. The commands below configure only the third. They do not change what the PCs use, and they do not make the router a DNS server.

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

- `ip domain-lookup` turns the router's DNS client on. It is on by default, so a configuration normally shows only its negative, `no ip domain-lookup`. Newer releases also accept `ip domain lookup`.
- `ip name-server` names the resolver the router asks. You can list more than one address.
- `ip domain name` sets the default suffix; older releases and Packet Tracer spell it `ip domain-name`. A name typed with no dot, such as `app`, is looked up as `app.lab.example`.
- `ip host` creates a static name-to-address entry on the router. The router checks its own host table before it sends a query, so `ping localweb` works with no DNS server at all.

`show hosts` displays the default domain, the name servers and the host table. Entries flagged `perm` are static `ip host` mappings; entries flagged `temp` are cached DNS answers, which age out. `clear host app.lab.example` removes one cached entry and `clear host *` removes them all, so the next lookup sends a new query. A static mapping is configuration, so remove it with `no ip host localweb`.

Many lab routers carry `no ip domain-lookup`. With lookup on, IOS treats an unrecognised word typed at the EXEC prompt as a hostname and tries to resolve it. With no name server configured it broadcasts the query to 255.255.255.255, and the prompt hangs until the attempts time out. Turning lookup off removes that delay and affects only the router's own lookups: users' DNS packets are still forwarded and `ip host` entries still work. The router can then resolve only static names, which is the first thing to check when it can ping an address but not a name.

:::trap A cached answer is still an answer
A successful name-based ping can use a static mapping or an earlier cached result. It does not prove that a new DNS query reached a server. Inspect `show hosts`, or query the server directly, before deciding which stage works.
:::

## Diagnose the failing stage

A connection by name has four stages, and each can fail on its own: the client chooses a resolver, the resolver replies, the reply holds the right data, and the application connects to the returned address. Find the first stage that fails. Fix exactly what you are testing (the full name, the record type and the server), query that server directly with `nslookup`, and read what comes back.

| Observed result | Meaning | Next useful check |
|---|---|---|
| Query timeout | No usable response arrived within the tool's wait | Resolver address, service, path, UDP/TCP policy |
| NXDOMAIN | Reply reports the queried name, or final alias target, absent | Spelling, intended zone, negative cache, server/view queried |
| Completed NODATA response | No data of the requested type at the name | Requested type and corresponding record |
| SERVFAIL | DNS service replied that it could not complete the lookup | Resolver/authority/delegation or validation evidence |
| Usable but wrong address | Resolution returned data inconsistent with the design | Record, alias chain, cache, split views or local override |
| Correct address, failed application | Resolution succeeded for the tested type | Address reachability, application port, server behavior |

A timeout means no reply at all, so the problem is reaching the resolver; the records are not yet in question. The next three rows are all replies. **NXDOMAIN** says the name does not exist, and it can come from the resolver's negative cache. **NODATA** is a reply with status `NOERROR` and an empty answer: the name exists but has no record of the requested type, as when you ask for AAAA at a name that has only an A record. **SERVFAIL** says the resolver tried and could not finish, which usually points upstream, at unreachable authoritative servers or a broken delegation.

A wrong address means the lookup worked and the data is bad: a mistaken record, a stale cache or a local override. Some organisations also run split DNS, in which internal and public servers deliberately return different answers for the same name, so always test through the resolver the affected client uses.

Testing by address splits the problem in half. If `http://10.1.1.80` loads and `http://app.lab.example` does not, the fault is in resolution. If neither loads, fix reachability or the service first. Match the test to the service: a ping proves that ICMP reaches the address, not that the web server answers on port 80.

When `ping` and `nslookup` disagree on a PC, they took different paths. `nslookup` always sends a query to a DNS server. `ping`, browsers and most applications use the operating system's resolver, which consults the local hosts file and its own cache first. On Windows, `ipconfig /displaydns` lists that cache and `ipconfig /flushdns` empties it. Flushing a PC's cache does not edit the hosts file or clear the resolver's cache.

## Reading the output

These outputs are representative. Labels and layout vary between tools and versions.

```output Client query: nslookup www.lab.example 10.1.1.53
Server:  ns1.lab.example
Address: 10.1.1.53  ← Server queried, not the web server

Non-authoritative answer:
Name:    app.lab.example
Address: 10.1.1.80  ← Returned application address
Aliases: www.lab.example  ← The alias points to the canonical name
```

`Non-authoritative answer` means the reply came from a resolver's cache or recursion instead of directly from the zone's authoritative server. It is normal and does not mean the answer is wrong. `Server: UnKnown` on the first line means only that the resolver's own address has no PTR record.

```output Representative dig response excerpts
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 1001  ← A negative name result was received
;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 1002  ← Failure response, not silence
```

With `nslookup`, request a type and server explicitly: `nslookup -type=MX lab.example 10.1.1.53`. With `dig`, the equivalent form is `dig @10.1.1.53 lab.example MX`; `dig -x 10.1.1.80` constructs the reverse lookup. Packet Tracer supports only part of this, so the lab handles the MX, NS, PTR and AAAA cases on paper.

After a repair, repeat the original test from the affected client: the same name through the same resolver, then the application itself.

## Exam focus

- Hosts learn their resolver from DHCP option 6 or static configuration.
- A stub resolver asks a recursive resolver, which follows referrals from the root to a TLD server to the authoritative server.
- DNS uses UDP 53 and TCP 53; a truncated (TC) reply is retried over TCP.
- A TTL is a cache lifetime in seconds. Caches, including negative caches, keep an old answer until it expires.
- A is IPv4, AAAA is IPv6, CNAME is an alias, MX is mail (lowest preference first), NS is zone authority, PTR is reverse lookup.
- On IOS: `ip name-server`, `ip domain name`, `ip host`, `ip domain-lookup` (on by default) and `show hosts`.
- Separate a timeout, NXDOMAIN, NODATA, SERVFAIL, a wrong answer and a failed application.
