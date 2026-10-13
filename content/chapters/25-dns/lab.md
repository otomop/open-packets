---
title: Build DNS records, compare lookup failures, and diagnose all six record types
environment: mixed
devices: ["1 × Cisco 2911 router (R1)", "1 × Catalyst 2960-24TT switch (SW1)", "2 × Server-PT (DNS1, WEB1)", "1 × PC-PT (PC-A)", "Optional: another Server-PT for the challenge"]
minutes: 80
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use Packet Tracer for the address/name comparison and IOS client configuration. Use the supplied paper records for types and response details that the simulator may not implement. The paper cases are required practice for record diagnosis, not claims of a working recursive or authoritative DNS deployment in Packet Tracer.

Start with new devices. Use their console CLI tabs, answer `no` to any initial configuration dialog, and inspect the named ports before cabling. This exact lab has not been executed in Packet Tracer during this review. Its GUI labels, cache behavior, and supported record/query types may vary; where a feature is absent, use the explicit paper alternative.

## Topology

```diagram
{"type":"topology","title":"Separate DNS and web services on one lab LAN","caption":"PC-A and R1 ask DNS1 for names, then reach WEB1 at the returned address.","nodes":[{"id":"PC","kind":"pc","label":"PC-A","sub":"10.1.1.10/24","x":1,"y":3},{"id":"SW","kind":"switch","label":"SW1","x":5,"y":3},{"id":"R","kind":"router","label":"R1","sub":"10.1.1.1/24","x":9,"y":1},{"id":"DNS","kind":"server","label":"DNS1","sub":"10.1.1.53/24","x":9,"y":3},{"id":"WEB","kind":"server","label":"WEB1","sub":"10.1.1.80/24","x":9,"y":5}],"links":[{"from":"PC","to":"SW","toLabel":"Fa0/1"},{"from":"SW","to":"R","fromLabel":"Gi0/1","toLabel":"Gi0/0"},{"from":"SW","to":"DNS","fromLabel":"Fa0/2"},{"from":"SW","to":"WEB","fromLabel":"Fa0/3"}]}
```

| Device/port | Peer | Address / mask | Gateway; DNS |
|---|---|---|---|
| PC-A FastEthernet0 | SW1 Fa0/1 | 10.1.1.10 / 255.255.255.0 | 10.1.1.1; 10.1.1.53 |
| DNS1 FastEthernet0 | SW1 Fa0/2 | 10.1.1.53 / 255.255.255.0 | 10.1.1.1; 10.1.1.53 |
| WEB1 FastEthernet0 | SW1 Fa0/3 | 10.1.1.80 / 255.255.255.0 | 10.1.1.1; 10.1.1.53 |
| R1 Gi0/0 | SW1 Gi0/1 | 10.1.1.1 / 255.255.255.0 | No upstream route needed; DNS 10.1.1.53 |

Use straight-through copper cables for all four links. Every switch port used here is access VLAN 1. This is a simple isolated addressing exercise, not a recommendation to use VLAN 1 for production management. No real Internet connection or public DNS change is required. Reserve unused 10.1.1.54 and 10.1.1.81 for the stated fault tests; do not add devices at those addresses until the optional challenge.

## Step 1: Configure and prove the IP path

Set PC-A, DNS1, and WEB1 in Desktop → IP Configuration using the complete table. Configure the router and switch explicitly.

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.1.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface range fastethernet0/1 - 3
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 1
SW1(config-if-range)# no shutdown
SW1(config-if-range)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 1
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show vlan brief
```

From PC-A's Command Prompt, ping 10.1.1.1, 10.1.1.53, and 10.1.1.80. Repeat after link startup and ARP resolution if necessary.

:::expected
All three addresses respond once the links forward. This is local-subnet connectivity, so no route to another network is involved. An IP ping is not yet a DNS or HTTP test. Correct any addressing/cabling fault before proceeding.
:::

```state
{"status":"Local IP path proven","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["PC","R","DNS","WEB"],"flows":[{"path":["PC","SW","R"],"back":true,"label":"ping 10.1.1.1","tags":{"PC":"Local subnet · no route needed"}},{"path":["PC","SW","DNS"],"back":true,"label":"ping 10.1.1.53"},{"path":["PC","SW","WEB"],"back":true,"label":"ping 10.1.1.80"}],"chips":[{"node":"R","text":"R1#"},{"node":"SW","text":"SW1#"}],"rows":[["PC-A pings",".1, .53 and .80 reply","ok"],["SW1 ports","Access VLAN 1"],["Scope","IP only · not DNS or HTTP","dim"]]}
```

## Step 2: Add controlled DNS records and a web service

Before enabling DNS, predict which test can already work with HTTP enabled: the literal address, the app name or the alias. Record why the alias requires more than an address on WEB1.

On DNS1, open Services → DNS, turn it On, and add the following records with the Name, Type, and Address/target fields. Use Add or the equivalent save action for each entry.

| Name | Type | Data |
|---|---|---|
| app.lab.example | A | 10.1.1.80 |
| fresh.lab.example | A | 10.1.1.80 |
| ns1.lab.example | A | 10.1.1.53 |
| www.lab.example | CNAME | app.lab.example |

If the selected simulator does not offer CNAME or does not follow it in a query, retain the A-record exercises and use this explicit paper result for the alias: `www.lab.example CNAME app.lab.example`, followed by `app.lab.example A 10.1.1.80`. Do not silently replace the alias with an A record and call that a CNAME test. Record the available type list; no fixed list of unsupported simulator types is assumed.

On WEB1, enable Services → HTTP. Keep its default simple page or replace its title with `CCNA DNS lab`. From PC-A, open Web Browser and request `http://10.1.1.80`.

:::expected
The stored records match the table, and WEB1 serves the controlled HTTP page by address. This page is intentionally suitable for both IP-literal and hostname access. These local records do not simulate the public root/TLD delegation process.
:::

```state
{"status":"Records stored · HTTP on","tone":"ok","focus":["DNS","WEB"],"flows":[{"path":["PC","SW","WEB"],"back":true,"label":"http://10.1.1.80","tags":{"PC":"By address · 10.1.1.80"},"backTags":{"PC":"Controlled page loads"}}],"chips":[{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["app, fresh.lab.example","A 10.1.1.80"],["ns1.lab.example","A 10.1.1.53"],["www.lab.example","CNAME app.lab.example"],["http://10.1.1.80","Page served by address","ok"]]}
```

## Step 3: Configure and verify R1's DNS client

```ios R1
R1# configure terminal
R1(config)# ip domain-lookup
R1(config)# ip name-server 10.1.1.53
R1(config)# ip domain name lab.example
R1(config)# end
R1# ping app.lab.example
R1# ping app
R1# show hosts
```

The hyphenated lookup command and two-word form `ip domain lookup` are accepted/displayed differently by IOS releases. Use the image's supported spelling. If short-name completion is absent in the simulator, retain the successful full-name test and inspect the configured domain as a paper explanation of the documented IOS behavior.

:::expected
The full name resolves to 10.1.1.80 and reaches WEB1. On the documented IOS behavior, `app` is completed with the default domain. `show hosts` identifies DNS1 and the configured suffix and may show a temporary cached mapping. Record what is actually present; no exact cache lifetime or formatting is required. Do not query `fresh.lab.example` yet.
:::

```state
{"status":"R1 resolves app","tone":"ok","focus":["R"],"flows":[{"path":["R","SW","DNS"],"back":true,"label":"Lookup app.lab.example","tags":{"R":"Ask name server 10.1.1.53","DNS":"A record · 10.1.1.80"},"backTags":{"R":"app.lab.example → 10.1.1.80"}},{"path":["R","SW","WEB"],"back":true,"label":"ping app.lab.example","tags":{"R":"Echo to 10.1.1.80"}}],"chips":[{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["app.lab.example","10.1.1.80 · reaches WEB1","ok"],["ping app","Completed with lab.example"],["show hosts","DNS1 · suffix lab.example"],["fresh.lab.example","Not queried yet","dim"]]}
```

## Step 4: Distinguish static mapping from disabled DNS lookup

Predict the result for each of the two names before running its ping. Identify which one needs a new server query and which one can use local configuration.

Create a local static name and disable the router's DNS client. Test the static name, then the deliberately unused fresh name so an earlier successful cache entry cannot hide the difference.

```ios R1
R1# configure terminal
R1(config)# ip host localweb 10.1.1.80
R1(config)# no ip domain-lookup
R1(config)# end
R1# show hosts
R1# ping localweb
R1# ping fresh.lab.example
```

:::expected
`localweb` is available through the static host table. The router cannot obtain a new DNS answer for `fresh.lab.example` while lookup is disabled, even though that name exists on DNS1. Existing cached entries may behave differently and are not the test target. Record the actual failure rather than requiring a particular error string. Leave the router disabled until the next recovery step.
:::

```state
{"status":"Static name, lookup off","tone":"warn","focus":["R"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"ip host localweb · lookup off"}},{"path":["R","SW","WEB"],"back":true,"label":"ping localweb","tags":{"R":"localweb → 10.1.1.80 · static"}},{"path":["R","SW","DNS"],"label":"Lookup fresh.lab.example","stop":"R","stopText":"Lookup disabled · no new query"}],"chips":[{"node":"R","text":"ip domain-lookup","tone":"ok","until":0},{"node":"R","text":"no ip domain-lookup","tone":"warn","from":0},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["ping localweb","Static host table · works","ok"],["ping fresh.lab.example","No new DNS answer","bad"],["fresh.lab.example on DNS1","Still exists"],["R1 lookup","Off until Step 5","warn"]]}
```

## Step 5: Restore router lookup and compare PC resolution

```ios R1
R1# configure terminal
R1(config)# ip domain-lookup
R1(config)# end
R1# ping fresh.lab.example
R1# show hosts
```

On PC-A, run `nslookup app.lab.example` and, where supported, `nslookup www.lab.example`. Then request `http://www.lab.example` in its browser, or use `http://app.lab.example` for the stated alias fallback. In Simulation mode, filter for DNS and inspect a new query/reply; return to Realtime afterward.

:::expected
The router's previously unavailable fresh name now resolves. PC-A asks 10.1.1.53 and receives the application address 10.1.1.80. For an observed UDP exchange, the query destination port is 53 and the reply source port is 53; the client's other port is not required to be 53. A cache or alias implementation can change the number of visible messages. If `nslookup` is missing, use the browser name test and available packet details, and interpret the lesson's supplied query output on paper.
:::

```state
{"status":"Lookup restored","tone":"ok","focus":["R","PC"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"ip domain-lookup · on again"}},{"path":["R","SW","DNS"],"back":true,"label":"Lookup fresh.lab.example","tags":{"R":"New query to 10.1.1.53","DNS":"A record · 10.1.1.80"},"backTags":{"R":"fresh.lab.example → 10.1.1.80"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup app.lab.example","tags":{"PC":"To 10.1.1.53 · UDP dst 53"},"backTags":{"DNS":"Reply · UDP src 53","PC":"app.lab.example → 10.1.1.80"}},{"path":["PC","SW","WEB"],"back":true,"label":"http://www.lab.example","tags":{"PC":"www → app.lab.example → .80"},"backTags":{"PC":"Page loads by name"}}],"chips":[{"node":"R","text":"no ip domain-lookup","tone":"warn","until":0},{"node":"R","text":"ip domain-lookup","tone":"ok","from":0},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["R1 fresh.lab.example","Resolves now","ok"],["PC-A query","10.1.1.53 answers 10.1.1.80","ok"],["UDP ports","Query dst 53 · reply src 53"],["Client's other port","Need not be 53","dim"]]}
```

## Step 6: Use an unreachable resolver and observe the difference

Predict whether this client-only DNS change alters the stored record on DNS1, the IP-literal page, or the ability to receive a new DNS answer. Write your predictions before the test.

Save a working checkpoint. Change only PC-A's DNS setting to unused 10.1.1.54. Ask for `app.lab.example` with nslookup; the command sends a direct query rather than relying on an application's prior result. Also request `http://10.1.1.80` by address. Do not restore the setting until you have recorded the evidence.

If the simulator lacks direct lookup, compare its current DNS configuration with the unused-address plan and attempt an uncached name. Use the paper observation “no usable DNS reply arrived” instead of claiming a specific on-wire query was seen: local ARP failure can stop the UDP packet before transmission.

:::expected
The direct lookup cannot obtain a response from the selected unused resolver, while the simple IP-literal HTTP page remains reachable. This isolates the resolver selection in this controlled setup. A timeout does not mean that DNS1's app record has disappeared.
:::

```state
{"status":"Resolver .54 · no reply","tone":"bad","focus":["PC"],"flows":[{"event":["PC"],"wait":1.2,"tags":{"PC":"DNS server → 10.1.1.54"}},{"path":["PC","SW"],"label":"nslookup app.lab.example","stop":"PC","stopText":"10.1.1.54 unused · no DNS reply"},{"path":["PC","SW","WEB"],"back":true,"label":"http://10.1.1.80","tags":{"PC":"By address · 10.1.1.80"},"backTags":{"PC":"Page still loads"}}],"chips":[{"node":"PC","text":"DNS 10.1.1.54","tone":"bad","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["PC-A DNS server","10.1.1.54 · unused","bad"],["nslookup app.lab.example","No usable reply","bad"],["http://10.1.1.80","Still reachable","ok"],["DNS1 app record","Unchanged"]]}
```

## Step 7: Restore the resolver and test a negative name response

Set PC-A's DNS address back to 10.1.1.53. Query `app.lab.example` to reestablish success, then query absent `nosuch.lab.example`. Keep WEB1's HTTP service unchanged.

:::expected
The real name returns 10.1.1.80. The absent name produces a negative/not-found result on a supporting simulator. This is different from failing to receive a reply from 10.1.1.54. If the simulator hides the response code, use the paper distinction: NXDOMAIN says the name is absent in this direct-name test; timeout says no usable response arrived. Do not invent an RCODE from a vague GUI error alone.
:::

```state
{"status":"Resolver restored","tone":"ok","focus":["PC","DNS"],"flows":[{"event":["PC"],"wait":1.2,"tags":{"PC":"DNS server → 10.1.1.53 again"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup app.lab.example","backTags":{"PC":"app.lab.example → 10.1.1.80"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup nosuch.lab.example","tags":{"DNS":"nosuch.lab.example · absent"},"backTags":{"PC":"Negative reply, not a timeout"}}],"chips":[{"node":"PC","text":"DNS 10.1.1.54","tone":"bad","until":0},{"node":"PC","text":"DNS 10.1.1.53","tone":"ok","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["app.lab.example","10.1.1.80","ok"],["nosuch.lab.example","Negative / not-found result"],["vs 10.1.1.54","A reply, not a timeout"],["RCODE","Record only if shown","dim"]]}
```

## Step 8: Install a wrong A record and inspect the answer

Predict both the fresh query's answer and the HTTP result. A returned address can be valid DNS data while disagreeing with the intended service inventory.

On DNS1, select `app.lab.example` and change its address to unused 10.1.1.81, saving the record. If the GUI has no edit action, remove only that entry and re-add the same name/type with .81. Leave WEB1 at .80 and leave the CNAME target unchanged. Query the app name directly from PC-A and compare the returned value with WEB1's actual address.

```ios R1
R1# show hosts
R1# ping app.lab.example
R1# clear host app.lab.example
R1# ping app.lab.example
```

If `clear host app.lab.example` is absent, use the direct PC query and record the router-cache inspection as a simulator limit. Do not predict that an earlier cached .80 entry must still exist; note whether it does before interpreting the first router ping.

:::expected
A fresh server answer supplies .81, which is inconsistent with WEB1's .80 address. Resolution can return a syntactically valid answer while the named application fails. The IP-literal .80 page still works. An earlier cache may temporarily retain .80, but that behavior is an observation to record, not a guaranteed part of this test. Stop before restoration.
:::

```state
{"status":"Wrong A record · .81","tone":"bad","focus":["DNS"],"flows":[{"event":["DNS"],"wait":1.2,"tags":{"DNS":"app.lab.example A → 10.1.1.81"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup app.lab.example","tags":{"DNS":"A record · 10.1.1.81"},"backTags":{"PC":"Answer .81 · WEB1 is .80"}},{"path":["PC","SW","WEB"],"back":true,"label":"http://10.1.1.80","tags":{"PC":"By address · 10.1.1.80"},"backTags":{"PC":"Page still loads"}}],"chips":[{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"DNS","text":"app A 10.1.1.81","tone":"bad","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["DNS1 app.lab.example","A 10.1.1.81","bad"],["Fresh answer",".81 · WEB1 is .80","bad"],["http://10.1.1.80","Still works","ok"],["R1 earlier cache","May hold .80 · record it","dim"]]}
```

## Step 9: Restore the record before clearing caches and saving

Choose the narrow repair from the evidence before reading further. First correct DNS1's `app.lab.example` A record back to 10.1.1.80. Confirm the stored entry and PC-A's DNS setting of 10.1.1.53. Only after that correction, clear any supported temporary router cache and perform new tests.

```ios R1
R1# clear host app.lab.example
R1# ping app.lab.example
R1# show hosts
R1# copy running-config startup-config
```

Complete the startup-config filename prompt with Enter if offered. On SW1, run `copy running-config startup-config` from privileged EXEC and complete its prompt too. Use the direct PC query and browser to verify app and the supported alias. Save the project as `25-dns-complete.pkt`.

:::expected
Fresh answers again identify .80, and the controlled page works by the intended name. The negative test name remains absent; it was never supposed to be created. No wrong resolver, disabled router lookup, or wrong app record remains in the final state.
:::

```state
{"status":"Record fixed · saved","tone":"ok","focus":["DNS","R"],"flows":[{"event":["DNS"],"wait":1.2,"tags":{"DNS":"app.lab.example A → 10.1.1.80"}},{"path":["R","SW","DNS"],"back":true,"label":"Lookup after clear host","tags":{"R":"Cache cleared · new query"},"backTags":{"R":"app.lab.example → 10.1.1.80"}},{"path":["PC","SW","WEB"],"back":true,"label":"http://app.lab.example","tags":{"PC":"app.lab.example → 10.1.1.80"},"backTags":{"PC":"Page loads by name"}}],"chips":[{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"DNS","text":"app A 10.1.1.81","tone":"bad","until":0},{"node":"DNS","text":"app A 10.1.1.80","tone":"ok","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["DNS1 app.lab.example","A 10.1.1.80","ok"],["PC-A DNS server","10.1.1.53","ok"],["nosuch.lab.example","Still absent, by design"],["Saved","Startup-config · 25-dns-complete.pkt","ok"]]}
```

## Step 10: Diagnose record types on paper

These cases are independent of the Packet Tracer record store. Without opening the answer, record the exact owner/type/data to change, what should remain unchanged and the next query/service check for each one. They teach the record dependencies the v2 objective explicitly names.

| Case | Complete evidence supplied |
|---|---|
| IPv6 application | Correct server IPv6 address is 2001:db8:25::80. A returns 10.1.1.80. AAAA returns 2001:db8:25::81. A client with usable IPv6 needs the IPv6 address; no translation service is involved. |
| Mail | lab.example MX 10 mail.lab.example. The exchanger name returns NXDOMAIN. The intended mail server is 10.1.1.25 and its service works by address in this controlled test. |
| Delegation | The parent delegates branch.lab.example to oldns.lab.example at 10.2.2.53. That device no longer serves the child zone. The approved new authority is ns2.lab.example at 10.2.2.54 and answers correctly when queried directly. |
| Reverse name | app.lab.example A 10.1.1.80 works. A query for 80.1.1.10.in-addr.arpa returns no PTR data. The approved reverse name is app.lab.example. |

:::solution Record worksheet answers
IPv6: correct the AAAA address to ::80, query that type again, and test the IPv6 application path; changing A does not repair AAAA. Mail: add the intended exchanger address record, then verify MX → exchanger address → mail service, accounting for negative caches. Delegation: correct the parent NS delegation to the approved authority and ensure its hostname/address dependency is resolvable; verify through the affected recursive resolver after cache considerations. Reverse: add the approved PTR in the reverse zone under its actual administrator's control, then re-query the address and compare the forward name. None of these paper fixes authorizes changes to a real public DNS service.
:::


Keep an evidence table for the completed practice. For each test, record the exact name, type, server queried, returned result and application outcome. Include working A/alias resolution, unused resolver, absent name, wrong answer and repaired answer. Distinguish an actual packet/query observation from a supplied worksheet. The four paper repairs must identify the affected record owner and type, not just say “fix DNS.”

```state
{"status":"Paper: four record cases","chips":[{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["IPv6 application","Server ::80 · A .80 · AAAA returns ::81"],["Mail","MX 10 mail.lab.example · name NXDOMAIN"],["Delegation","branch → oldns 10.2.2.53 · not serving"],["Reverse name","80.1.1.10.in-addr.arpa · no PTR data"]]}
```

## Troubleshooting

- IP path fails: correct address/mask, link, VLAN, and intended routing before attributing everything to DNS.
- Query times out: identify the actual resolver, service state, transport/path, and whether a query was sent.
- Name missing: verify spelling, type, queried server/view, and cached negative information.
- Router alone cannot resolve: inspect lookup enablement, host mappings, domain/search list, resolver setting, and route.
- Alias fails: follow the target chain and the requested address type; an unchanged alias may point at changed target data.
- Correct name/address but application fails: inspect the required service. Ping success is not an HTTP, TLS, or mail-service test.

## Challenge

Work in a separate saved copy. Add Server-PT WEB2 at 10.1.1.81/24, gateway 10.1.1.1 and DNS 10.1.1.53. Connect WEB2 FastEthernet0 to SW1 Fa0/4 using straight-through copper. Configure that switch port as enabled access VLAN 1. Enable WEB2's HTTP service and give its page a recognizable WEB2 title.

The new service must use `files.lab.example`. Add that name as CNAME `web2.lab.example`, initially omitting the target's A record. Before opening the answer, predict and test the alias, then make the smallest record repair. Preserve the existing app service at .80. Use the explicit alias worksheet if the simulator cannot follow CNAMEs; still test WEB2 by address.

For a separate record-only extension, the approved reverse name of 10.1.1.81 is web2.lab.example. Write its PTR owner/type/data. Explain why repairing that PTR alone would not fix the missing forward alias target. No production or public zone change is part of this exercise.

Submit a before/after query result (or clearly labeled worksheet), WEB2's address and name service tests, and proof that app.lab.example still works.

:::solution
Prepare only the new switch access port:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/4
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 1
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show vlan brief
```

WEB2's IP-literal page at `http://10.1.1.81` should work after its IP/HTTP setup. The alias initially identifies only the absent target name. On DNS1, retain `files.lab.example CNAME web2.lab.example` and add `web2.lab.example A 10.1.1.81` using Services → DNS → Add/save. Do not add ordinary A data beside the CNAME at files.lab.example.

Query the alias and canonical name from PC-A, recording the server and final .81 address. Open `http://files.lab.example` and identify WEB2's page. If CNAME is unsupported, document the predicted two-record chain and verify the supported canonical A/name test; do not label that a measured alias result. Check applicable negative caches if a prior missing-name result persists.

The reverse worksheet entry is `81.1.1.10.in-addr.arpa PTR web2.lab.example`. It supports a reverse lookup; it does not supply the forward A record requested through the CNAME chain. Finally query app.lab.example and load its .80 page. Save the completed challenge separately; reopening the original project restores the guided baseline.
:::
