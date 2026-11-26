---
title: Build DNS records, compare lookup failures, and diagnose all six record types
environment: mixed
devices: ["1 × Cisco 2911 router (R1)", "1 × Catalyst 2960-24TT switch (SW1)", "2 × Server-PT (DNS1, WEB1)", "1 × PC-PT (PC-A)", "Optional: another Server-PT for the challenge"]
minutes: 80
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

You will build a small LAN with a DNS server and a web server, make a router and a PC resolve names through it, and then break resolution in three different ways so that you can tell a timeout, a missing name and a wrong answer apart. Packet Tracer's DNS service handles A and CNAME records; the AAAA, MX, NS and PTR cases in Step 10 are worked on paper.

Start with new devices and answer `no` to the initial configuration dialog. This lab has not been run end to end in Packet Tracer for this revision, so menu labels and cache behaviour may differ slightly. Where a feature is missing, use the paper alternative given in the step.

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

Use straight-through copper cables for all four links. Every switch port stays in VLAN 1. Leave 10.1.1.54 and 10.1.1.81 unused: later steps point at them deliberately as addresses where nothing answers.

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
All three addresses reply once the links come up. Everything is on one subnet, so no routing is involved. This proves IP reachability only; DNS and HTTP are tested next.
:::

```state
{"status":"Local IP path proven","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["PC","R","DNS","WEB"],"flows":[{"path":["PC","SW","R"],"back":true,"label":"ping 10.1.1.1","tags":{"PC":"Local subnet · no route needed"}},{"path":["PC","SW","DNS"],"back":true,"label":"ping 10.1.1.53"},{"path":["PC","SW","WEB"],"back":true,"label":"ping 10.1.1.80"}],"chips":[{"node":"R","text":"R1#"},{"node":"SW","text":"SW1#"}],"rows":[["PC-A pings",".1, .53 and .80 reply","ok"],["SW1 ports","Access VLAN 1"],["Scope","IP only · not DNS or HTTP","dim"]]}
```

## Step 2: Add controlled DNS records and a web service

Before you enable DNS, predict which of these will work from PC-A once HTTP is on: the address `10.1.1.80`, the name `app.lab.example`, or the alias `www.lab.example`.

On DNS1, open Services → DNS, turn it On, and add the following records with the Name, Type, and Address/target fields. Use Add or the equivalent save action for each entry.

| Name | Type | Data |
|---|---|---|
| app.lab.example | A | 10.1.1.80 |
| fresh.lab.example | A | 10.1.1.80 |
| ns1.lab.example | A | 10.1.1.53 |
| www.lab.example | CNAME | app.lab.example |

If your Packet Tracer version does not offer CNAME, keep the A records and treat the alias as a paper result: `www.lab.example CNAME app.lab.example`, then `app.lab.example A 10.1.1.80`. Do not replace the alias with an A record, because that would no longer test a CNAME.

On WEB1, enable Services → HTTP. Keep its default simple page or replace its title with `CCNA DNS lab`. From PC-A, open Web Browser and request `http://10.1.1.80`.

:::expected
The stored records match the table and WEB1's page loads by address. DNS1 answers from its own records; this lab has no root or TLD servers.
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

If Packet Tracer rejects `ip domain name`, use the older spelling `ip domain-name lab.example`. If `ping app` does not complete the short name in your version, keep the full-name result and note that IOS appends the configured suffix.

:::expected
The full name resolves to 10.1.1.80 and the ping reaches WEB1. `ping app` works because R1 appends `lab.example`. `show hosts` lists the name server 10.1.1.53, the default domain and a temporary (cached) entry for the name you resolved. Do not look up `fresh.lab.example` yet: Step 4 needs a name that R1 has never cached.
:::

```state
{"status":"R1 resolves app","tone":"ok","focus":["R"],"flows":[{"path":["R","SW","DNS"],"back":true,"label":"Lookup app.lab.example","tags":{"R":"Ask name server 10.1.1.53","DNS":"A record · 10.1.1.80"},"backTags":{"R":"app.lab.example → 10.1.1.80"}},{"path":["R","SW","WEB"],"back":true,"label":"ping app.lab.example","tags":{"R":"Echo to 10.1.1.80"}}],"chips":[{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["app.lab.example","10.1.1.80 · reaches WEB1","ok"],["ping app","Completed with lab.example"],["show hosts","DNS1 · suffix lab.example"],["fresh.lab.example","Not queried yet","dim"]]}
```

## Step 4: Distinguish static mapping from disabled DNS lookup

Create a static name on R1 and turn its DNS client off. Before each ping, predict the result: which name needs a query to DNS1, and which can R1 answer from its own configuration? `fresh.lab.example` is used because R1 has never cached it.

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
`ping localweb` succeeds from the static host table. `ping fresh.lab.example` fails with an unrecognized-host error: R1 sends no query while lookup is off, even though the record exists on DNS1. Leave lookup off until Step 5.
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
R1 now resolves `fresh.lab.example`. PC-A's query goes to 10.1.1.53 and returns 10.1.1.80. In Simulation mode the query's UDP destination port is 53 and the reply's source port is 53; PC-A's own port is an ephemeral number. If your version has no `nslookup`, use the browser test and the packet details instead.
:::

```state
{"status":"Lookup restored","tone":"ok","focus":["R","PC"],"flows":[{"event":["R"],"wait":1.2,"tags":{"R":"ip domain-lookup · on again"}},{"path":["R","SW","DNS"],"back":true,"label":"Lookup fresh.lab.example","tags":{"R":"New query to 10.1.1.53","DNS":"A record · 10.1.1.80"},"backTags":{"R":"fresh.lab.example → 10.1.1.80"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup app.lab.example","tags":{"PC":"To 10.1.1.53 · UDP dst 53"},"backTags":{"DNS":"Reply · UDP src 53","PC":"app.lab.example → 10.1.1.80"}},{"path":["PC","SW","WEB"],"back":true,"label":"http://www.lab.example","tags":{"PC":"www → app.lab.example → .80"},"backTags":{"PC":"Page loads by name"}}],"chips":[{"node":"R","text":"no ip domain-lookup","tone":"warn","until":0},{"node":"R","text":"ip domain-lookup","tone":"ok","from":0},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["R1 fresh.lab.example","Resolves now","ok"],["PC-A query","10.1.1.53 answers 10.1.1.80","ok"],["UDP ports","Query dst 53 · reply src 53"],["Client's other port","Need not be 53","dim"]]}
```

## Step 6: Use an unreachable resolver and observe the difference

This step gives PC-A a resolver address where nothing answers. Predict first: will the record on DNS1 change, will the page still load by address, and will a new lookup succeed?

Save the project. Change only PC-A's DNS server to 10.1.1.54. Run `nslookup app.lab.example`, then request `http://10.1.1.80` in the browser. Leave the wrong setting in place until you have noted both results.

No host owns 10.1.1.54, so PC-A's ARP request for it goes unanswered and the DNS query never leaves the PC. The symptom is the same as a DNS server that is down: no reply.

:::expected
`nslookup` times out, and the page still loads by address. The fault is PC-A's choice of resolver. A timeout says nothing about the records: `app.lab.example` is still stored on DNS1.
:::

```state
{"status":"Resolver .54 · no reply","tone":"bad","focus":["PC"],"flows":[{"event":["PC"],"wait":1.2,"tags":{"PC":"DNS server → 10.1.1.54"}},{"path":["PC","SW"],"label":"nslookup app.lab.example","stop":"PC","stopText":"10.1.1.54 unused · no DNS reply"},{"path":["PC","SW","WEB"],"back":true,"label":"http://10.1.1.80","tags":{"PC":"By address · 10.1.1.80"},"backTags":{"PC":"Page still loads"}}],"chips":[{"node":"PC","text":"DNS 10.1.1.54","tone":"bad","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["PC-A DNS server","10.1.1.54 · unused","bad"],["nslookup app.lab.example","No usable reply","bad"],["http://10.1.1.80","Still reachable","ok"],["DNS1 app record","Unchanged"]]}
```

## Step 7: Restore the resolver and test a negative name response

Set PC-A's DNS address back to 10.1.1.53. Query `app.lab.example` to reestablish success, then query absent `nosuch.lab.example`. Keep WEB1's HTTP service unchanged.

:::expected
`app.lab.example` returns 10.1.1.80. `nosuch.lab.example` returns a not-found result quickly, because DNS1 was reached and replied that the name does not exist (NXDOMAIN). Compare that with Step 6, where no reply arrived at all. Packet Tracer may not show the response code by name.
:::

```state
{"status":"Resolver restored","tone":"ok","focus":["PC","DNS"],"flows":[{"event":["PC"],"wait":1.2,"tags":{"PC":"DNS server → 10.1.1.53 again"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup app.lab.example","backTags":{"PC":"app.lab.example → 10.1.1.80"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup nosuch.lab.example","tags":{"DNS":"nosuch.lab.example · absent"},"backTags":{"PC":"Negative reply, not a timeout"}}],"chips":[{"node":"PC","text":"DNS 10.1.1.54","tone":"bad","until":0},{"node":"PC","text":"DNS 10.1.1.53","tone":"ok","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["app.lab.example","10.1.1.80","ok"],["nosuch.lab.example","Negative / not-found result"],["vs 10.1.1.54","A reply, not a timeout"],["RCODE","Record only if shown","dim"]]}
```

## Step 8: Install a wrong A record and inspect the answer

This step makes DNS return a well-formed answer that is wrong. Predict what a new query returns and whether the page loads by name.

On DNS1, select `app.lab.example` and change its address to unused 10.1.1.81, saving the record. If the GUI has no edit action, remove only that entry and re-add the same name/type with .81. Leave WEB1 at .80 and leave the CNAME target unchanged. Query the app name directly from PC-A and compare the returned value with WEB1's actual address.

```ios R1
R1# show hosts
R1# ping app.lab.example
R1# clear host app.lab.example
R1# ping app.lab.example
```

Check `show hosts` before the first ping: if R1 still holds the cached .80 entry, that ping succeeds from the cache. `clear host` removes the entry so that the second ping uses a new answer. If your Packet Tracer version lacks `clear host`, rely on the PC query.

:::expected
A new query returns 10.1.1.81, where nothing is listening, so the name-based ping and page fail while `http://10.1.1.80` still works. The lookup succeeded and the data is wrong. If R1's first ping succeeded, it used the cached .80 entry. Do not repair the record yet.
:::

```state
{"status":"Wrong A record · .81","tone":"bad","focus":["DNS"],"flows":[{"event":["DNS"],"wait":1.2,"tags":{"DNS":"app.lab.example A → 10.1.1.81"}},{"path":["PC","SW","DNS"],"back":true,"label":"nslookup app.lab.example","tags":{"DNS":"A record · 10.1.1.81"},"backTags":{"PC":"Answer .81 · WEB1 is .80"}},{"path":["PC","SW","WEB"],"back":true,"label":"http://10.1.1.80","tags":{"PC":"By address · 10.1.1.80"},"backTags":{"PC":"Page still loads"}}],"chips":[{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"DNS","text":"app A 10.1.1.81","tone":"bad","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["DNS1 app.lab.example","A 10.1.1.81","bad"],["Fresh answer",".81 · WEB1 is .80","bad"],["http://10.1.1.80","Still works","ok"],["R1 earlier cache","May hold .80 · record it","dim"]]}
```

## Step 9: Restore the record before clearing caches and saving

Correct DNS1's `app.lab.example` A record back to 10.1.1.80 and confirm that PC-A's DNS server is 10.1.1.53. Fix the record first and clear the cache second: clearing first would only let R1 cache the wrong answer again.

```ios R1
R1# clear host app.lab.example
R1# ping app.lab.example
R1# show hosts
R1# copy running-config startup-config
```

Press Enter at the filename prompt, and save SW1 the same way. From PC-A, run `nslookup app.lab.example` and load the page by name and by alias. Save the project as `25-dns-complete.pkt`.

:::expected
New answers return .80 and the page loads by name. `nosuch.lab.example` is still absent, as intended. The final state has the correct resolver on PC-A, lookup enabled on R1 and the correct A record on DNS1.
:::

```state
{"status":"Record fixed · saved","tone":"ok","focus":["DNS","R"],"flows":[{"event":["DNS"],"wait":1.2,"tags":{"DNS":"app.lab.example A → 10.1.1.80"}},{"path":["R","SW","DNS"],"back":true,"label":"Lookup after clear host","tags":{"R":"Cache cleared · new query"},"backTags":{"R":"app.lab.example → 10.1.1.80"}},{"path":["PC","SW","WEB"],"back":true,"label":"http://app.lab.example","tags":{"PC":"app.lab.example → 10.1.1.80"},"backTags":{"PC":"Page loads by name"}}],"chips":[{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"DNS","text":"app A 10.1.1.81","tone":"bad","until":0},{"node":"DNS","text":"app A 10.1.1.80","tone":"ok","from":0},{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["DNS1 app.lab.example","A 10.1.1.80","ok"],["PC-A DNS server","10.1.1.53","ok"],["nosuch.lab.example","Still absent, by design"],["Saved","Startup-config · 25-dns-complete.pkt","ok"]]}
```

## Step 10: Diagnose record types on paper

These four cases cover the record types Packet Tracer cannot serve. For each one, write the exact record to add or change (owner name, type and data), what must stay as it is, and the query you would run to confirm the repair. Then open the answers.

| Case | Complete evidence supplied |
|---|---|
| IPv6 application | Correct server IPv6 address is 2001:db8:25::80. A returns 10.1.1.80. AAAA returns 2001:db8:25::81. A client with usable IPv6 needs the IPv6 address; no translation service is involved. |
| Mail | lab.example MX 10 mail.lab.example. The exchanger name returns NXDOMAIN. The intended mail server is 10.1.1.25 and its service works by address in this controlled test. |
| Delegation | The parent delegates branch.lab.example to oldns.lab.example at 10.2.2.53. That device no longer serves the child zone. The approved new authority is ns2.lab.example at 10.2.2.54 and answers correctly when queried directly. |
| Reverse name | app.lab.example A 10.1.1.80 works. A query for 80.1.1.10.in-addr.arpa returns no PTR data. The approved reverse name is app.lab.example. |

:::solution Record worksheet answers
IPv6: change `app.lab.example AAAA` to 2001:db8:25::80, query AAAA again and test the service over IPv6. The A record is correct and stays. Mail: add `mail.lab.example A 10.1.1.25`; the MX record stays. Query the MX, then the exchanger's A record, and allow for the cached NXDOMAIN to expire. Delegation: in the parent zone, change the NS record for `branch.lab.example` to `ns2.lab.example` and make sure that name resolves to 10.2.2.54, with a glue record if needed. Verify through the resolver the clients use. Reverse: add `80.1.1.10.in-addr.arpa PTR app.lab.example` in the reverse zone, then query the address again. The A record stays.
:::


To finish, list the five results you observed (working lookup, unused resolver, absent name, wrong answer, repaired answer) with the name, type and server queried for each. A repair is specific only when it names the record's owner and type; “fix DNS” is not an answer.

```state
{"status":"Paper: four record cases","chips":[{"node":"R","text":"ip domain-lookup","tone":"ok"},{"node":"DNS","text":"DNS On","tone":"ok"},{"node":"WEB","text":"HTTP On","tone":"ok"}],"rows":[["IPv6 application","Server ::80 · A .80 · AAAA returns ::81"],["Mail","MX 10 mail.lab.example · name NXDOMAIN"],["Delegation","branch → oldns 10.2.2.53 · not serving"],["Reverse name","80.1.1.10.in-addr.arpa · no PTR data"]]}
```

## Troubleshooting

- IP path fails: correct address/mask, link, VLAN, and intended routing before attributing everything to DNS.
- Query times out: identify the actual resolver, service state, transport/path, and whether a query was sent.
- Name missing: verify spelling, type, queried server/view, and cached negative information.
- Router alone cannot resolve: check `ip domain-lookup`, the `ip name-server` address, the default domain and `show hosts`.
- Alias fails: follow the target chain and the requested address type; an unchanged alias may point at changed target data.
- Correct name/address but application fails: inspect the required service. Ping success is not an HTTP, TLS, or mail-service test.

## Challenge

Work in a separate saved copy. Add Server-PT WEB2 at 10.1.1.81/24, gateway 10.1.1.1 and DNS 10.1.1.53. Connect WEB2 FastEthernet0 to SW1 Fa0/4 using straight-through copper. Configure that switch port as enabled access VLAN 1. Enable WEB2's HTTP service and give its page a recognizable WEB2 title.

The new service must use `files.lab.example`. Add that name as CNAME `web2.lab.example`, initially omitting the target's A record. Before opening the answer, predict and test the alias, then make the smallest record repair. Preserve the existing app service at .80. Use the explicit alias worksheet if the simulator cannot follow CNAMEs; still test WEB2 by address.

For a separate record-only extension, the approved reverse name of 10.1.1.81 is web2.lab.example. Write its PTR owner/type/data. Explain why repairing that PTR alone would not fix the missing forward alias target.

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
