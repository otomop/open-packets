---
title: Watch a TCP handshake and a UDP lookup in Simulation mode
environment: packet-tracer
devices: ["1 × Catalyst 2960 (SW1)", "1 × PC-PT (PC-A)", "1 × Server-PT (SRV1)"]
minutes: 50
---
The lesson described a TCP handshake and a UDP query; here you watch both, one PDU at a time. You build a one-switch LAN, turn on HTTP and DNS, and compare the two exchanges in Simulation mode. Then you switch one service off and see that ping keeps working while the page fails. Client ports and sequence numbers differ on every run, so read them from your own PDUs. The lab was not run against every Packet Tracer release; where your version cannot show a field, use the worksheet alternative given in the step.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

## Topology

```diagram
{ "type": "topology", "title": "TCP and UDP on one subnet",
  "nodes": [
    { "id": "A", "kind": "pc", "label": "PC-A", "sub": "192.168.40.10/24", "x": 2, "y": 3 },
    { "id": "S", "kind": "switch", "label": "SW1", "sub": "2960 · VLAN 1", "x": 6, "y": 3 },
    { "id": "V", "kind": "server", "label": "SRV1", "sub": "192.168.40.20/24", "x": 10, "y": 3 }
  ],
  "links": [
    { "from": "A", "to": "S", "fromLabel": "Fa0", "toLabel": "Fa0/1" },
    { "from": "S", "to": "V", "fromLabel": "Fa0/2", "toLabel": "Fa0" }
  ], "caption": "HTTP and DNS share one server address; ports and transport identify the requested service." }
```

| Device | Interface / peer | IP address / mask | DNS / gateway |
|---|---|---|---|
| PC-A | FastEthernet0 to SW1 Fa0/1 | `192.168.40.10`, `255.255.255.0` | DNS `192.168.40.20`; gateway blank |
| SRV1 | FastEthernet0 to SW1 Fa0/2 | `192.168.40.20`, `255.255.255.0` | DNS not needed; gateway blank |
| SW1 | Fa0/1 and Fa0/2 | No management address required | No routing required |

Use copper straight-through cables for both host-to-switch links. Start with new devices rather than a reused switch with unknown configuration. All traffic stays within one IPv4 subnet, so a router and default gateway are unnecessary. The `.test` names below are lab examples, not public sites.

## Step 1: Prepare the single LAN

Place new devices and connect the ports in the table. On both endpoints, open **Desktop → IP Configuration**, select **Static**, and enter the address and mask. Enter PC-A's DNS server as shown. Leave the gateways blank because both endpoints are on the same subnet. The switch needs no configuration.

On PC-A, open **Desktop → Command Prompt**:

```text
ipconfig /all
ping 192.168.40.20
```

Record the address, mask and DNS server. Wait for the links to forward and repeat an initial ping if necessary.

:::expected
The settings match the table and the ping receives replies. That proves an ICMP round trip and nothing about HTTP, which is not switched on yet. If pings keep failing, check the cable ports, link lights and both host addresses before going further.
:::

```state
{"status":"LAN addressed · ping works","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["A","V"],"flows":[{"path":["A","S","V"],"back":true,"label":"ping 192.168.40.20","tags":{"A":"Same subnet · no gateway"}}],"rows":[["PC-A","192.168.40.10 · 255.255.255.0"],["PC-A DNS server","192.168.40.20"],["Gateways","Blank: one subnet"],["ping 192.168.40.20","Replies","ok"]]}
```

## Step 2: Establish services and make predictions

On SRV1, open **Services → HTTP** and set **HTTP On**. Under **Services → DNS**, set **On** and add an A record named `www.lab.test` with address `192.168.40.20`. Click **Add** and confirm the record appears.

On PC-A, request `http://192.168.40.20` in **Desktop → Web Browser**. Then run `nslookup`, which asks the PC's configured DNS server to resolve a name and prints the answer:

```text
nslookup www.lab.test
```

Finally browse to `http://www.lab.test`. Type `http://` explicitly; this lab does not use HTTPS.

Before reading the expected result, write the transport and server port for (a) this HTTP exchange and (b) the DNS lookup. Predict which source and destination ports the server's reply will carry.

:::expected
Both pages load and the name returns `192.168.40.20`. HTTP uses TCP destination port 80. The DNS lookup uses UDP destination port 53. Each reply reverses the request's endpoints, so it returns to whichever source port the client chose.
:::

```state
{"status":"HTTP and DNS on SRV1","tone":"ok","focus":["V"],"flows":[{"path":["A","S","V"],"back":true,"label":"http://192.168.40.20","tags":{"A":"HTTP · TCP dst port 80"},"backTags":{"V":"Reply from TCP port 80"}},{"path":["A","S","V"],"back":true,"label":"nslookup www.lab.test","tags":{"A":"DNS · UDP dst port 53"},"backTags":{"V":"Reply from UDP port 53","A":"www.lab.test → 192.168.40.20"}},{"path":["A","S","V"],"back":true,"label":"http://www.lab.test","tags":{"A":"To 192.168.40.20 · TCP 80"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["HTTP, by address and name","Pages load · TCP 80","ok"],["Lookup www.lab.test","192.168.40.20 · via UDP 53","ok"],["Replies","Reverse the endpoint pair"]]}
```

## Step 3: Inspect one TCP opening

Enter **Simulation** mode. In **Edit Filters**, select ARP, TCP, HTTP and DNS; also select UDP if your release lists it separately. Clear old events with **Reset Simulation**. This clears the event list; ARP and DNS caches on the devices may remain.

Close and reopen PC-A's browser and request `http://192.168.40.20`. Advance using **Capture/Forward** and inspect the TCP PDUs. Read source/destination IP, source/destination port and flags.

Use this worked row only as a format:

| Direction | Source endpoint | Destination endpoint | TCP flags |
|---|---|---|---|
| Illustrative request | `192.168.40.10:51000` | `192.168.40.20:80` | SYN |

Replace `51000` with the client port in your own exchange. Fill in the server's reply and the client's third segment before you compare with the expected result.

:::expected
An ordinary opening shows client SYN, server SYN/ACK and client ACK. The server reply has source `192.168.40.20:80` and destination `192.168.40.10:<observed-client-port>`. The third segment returns to the server port. Sequence numbers identify positions in each direction's byte stream; ports identify transport endpoints.

If you see HTTP data with no SYN before it, the browser reused an existing connection: close the browser, reset the simulation and request the page again.
:::

```state
{"status":"TCP opening observed","tone":"ok","focus":["A","V"],"flows":[{"path":["A","S","V"],"label":"SYN","tags":{"A":"SYN · to 192.168.40.20:80"}},{"path":["V","S","A"],"tone":"reply","label":"SYN/ACK","tags":{"V":"SYN/ACK · from port 80","A":"To the observed client port"}},{"path":["A","S","V"],"label":"ACK","tags":{"A":"ACK · back to port 80","V":"Opening complete"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["Opening","SYN → SYN/ACK → ACK","ok"],["SYN/ACK source","192.168.40.20:80"],["Client port","Observed, not guessed"],["Sequence number","Stream position, not a port"]]}
```

## Step 4: Compare a fresh UDP lookup

Add `lookup.lab.test` on SRV1 with the same correct address. Clear the Simulation event list and run `nslookup lookup.lab.test` on PC-A. Advance and inspect the DNS query and reply. You use a new name so that PC-A cannot answer from its DNS cache and has to send a query.

Complete two rows: the query's source and destination endpoints, and the reply's. Then count the segments that were exchanged before the query, and compare that with Step 3.

:::expected
The query goes to server UDP port 53 and the reply comes from port 53 back to the client's source port. Nothing precedes the query: UDP has no handshake, so there is no SYN, SYN/ACK or ACK. The DNS reply is application data, not a UDP acknowledgment.

If `nslookup` is unavailable in your release, browse to the new name instead and inspect the DNS events. If the port fields are not shown, work this on paper: PC-A sends UDP from `192.168.40.10:53000` to `192.168.40.20:53`. The reply is from `192.168.40.20:53` to `192.168.40.10:53000`, with no opening.
:::

```state
{"status":"UDP query and reply","tone":"ok","focus":["A","V"],"flows":[{"path":["A","S","V"],"back":true,"label":"nslookup lookup.lab.test","tags":{"A":"UDP to port 53 · no opening"},"backTags":{"V":"Reply · src UDP port 53","A":"To the client's query port"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["New record","lookup.lab.test → 192.168.40.20"],["Query","To 192.168.40.20:53"],["Reply","From 192.168.40.20:53","ok"],["SYN, SYN/ACK, ACK","None: no UDP opening"]]}
```

## Step 5: Interpret a new connection snapshot

The lesson introduced `netstat -an`, which lists a Windows host's listening ports and current TCP connections. Interpret this representative snapshot from a different Windows PC. It is a paper exercise, not Packet Tracer output.

```output Representative Windows netstat -an excerpt
Proto  Local Address         Foreign Address        State
TCP    10.6.0.10:22          10.6.0.30:52000        ESTABLISHED
TCP    10.6.0.10:52100       10.6.0.20:80           ESTABLISHED
TCP    10.6.0.10:52101       10.6.0.20:80           TIME_WAIT
```

The documented services are SSH on 22 and HTTP on 80. Identify the PC's server role, its client role and the number of currently established HTTP connections. State the reply endpoints for the established HTTP connection.

Optionally run `netstat` on PC-A if your release supports it, or `netstat -an` on your own Windows computer. A short HTTP connection may already have closed by the time you look.

:::expected
The PC accepts SSH from `10.6.0.30:52000` at local port 22. It has one established HTTP connection from `10.6.0.10:52100` to `10.6.0.20:80`. The other HTTP row is closing, not established. The reply endpoints are source `10.6.0.20:80` to destination `10.6.0.10:52100`.
:::

```state
{"status":"Paper: netstat snapshot","chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["Server role","SSH on local port 22"],["Client role","HTTP to 10.6.0.20:80"],["Established HTTP","1 · the other is TIME_WAIT"],["Reply endpoints","10.6.0.20:80 → 10.6.0.10:52100"]]}
```

## Step 6: Observe a known service fault

Save the working project as `06-transport-baseline.pkt`. On SRV1, set **Services → HTTP → Off**. Keep DNS and addressing unchanged. This reproduces the lesson's opening problem: the server answers ping but the page will not load.

Before testing, predict the outcome of ping, a name lookup and a new HTTP request to the address. Add `faultcheck.lab.test` pointing to SRV1 so the lookup is not answered from cache, then run:

```text
ping 192.168.40.20
nslookup faultcheck.lab.test
```

Open a new browser request to `http://192.168.40.20` and record what the browser shows.

:::expected
Ping and the DNS lookup still succeed; the HTTP request fails. DNS and HTTP share one server address but are separate services on separate ports, and ping tests neither. Here you know the cause because you switched HTTP off. On a real network, "ping works, page fails" tells you only to look at TCP port 80 and the service next.
:::

```state
{"status":"HTTP Off on SRV1","tone":"bad","focus":["V"],"flows":[{"event":["V"],"wait":1.2,"tags":{"V":"Services → HTTP → Off"}},{"path":["A","S","V"],"back":true,"label":"ping 192.168.40.20"},{"path":["A","S","V"],"back":true,"label":"nslookup faultcheck.lab.test","tags":{"A":"DNS · UDP dst port 53"},"backTags":{"A":"faultcheck.lab.test resolves"}},{"path":["A","S","V"],"label":"http://192.168.40.20","tags":{"A":"HTTP · TCP dst port 80"},"stop":"V","stopText":"HTTP Off · request fails"}],"chips":[{"node":"V","text":"DNS On","tone":"ok"},{"node":"V","text":"HTTP On","tone":"ok","until":0},{"node":"V","text":"HTTP Off","tone":"bad","from":0}],"rows":[["ping 192.168.40.20","Replies","ok"],["Fresh name lookup","Resolves","ok"],["New HTTP request","Fails","bad"],["Saved first","06-transport-baseline.pkt"]]}
```

## Step 7: Restore and verify the original service

Set **SRV1 → Services → HTTP → On**. Start fresh browser requests to the address and to `http://www.lab.test`. Repeat the fresh name query if needed. Save the repaired project as `06-transport-complete.pkt` only after the intended service works.

:::expected
Both new HTTP requests load the page, and the name resolves to SRV1. You verified the fix with the test that had failed, a page request, not with another ping.
:::

```state
{"status":"HTTP restored","tone":"ok","focus":["V"],"flows":[{"event":["V"],"wait":1.2,"tags":{"V":"Services → HTTP → On"}},{"path":["A","S","V"],"back":true,"label":"http://192.168.40.20","tags":{"A":"HTTP · TCP dst port 80"},"backTags":{"A":"Page loads"}},{"path":["A","S","V"],"back":true,"label":"http://www.lab.test","tags":{"A":"www.lab.test → 192.168.40.20"},"backTags":{"A":"Page loads by name"}}],"chips":[{"node":"V","text":"HTTP Off","tone":"bad","until":0},{"node":"V","text":"HTTP On","tone":"ok","from":0},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["http://192.168.40.20","Page loads","ok"],["http://www.lab.test","Page loads","ok"],["Changed","HTTP On only · no gateway or switch"],["Saved","06-transport-complete.pkt"]]}
```

## Step 8: Summarize what each test proved

Write one line for each row from your own notes. Mark anything you worked on paper as **worksheet**, not as observed.

| What you saw | What it shows |
|---|---|
| TCP opening, three rows | Directions, server port 80, your client port, and the flags |
| UDP query and reply | The endpoints reverse; there is no opening |
| `netstat` snapshot | Which rows are server or client roles, and which are established |
| HTTP fault and recovery | Which of ping, lookup and page request each failed or passed, and why |

Then attempt the challenge before opening its solution.

:::expected
Your notes separate four things that can each fail on their own: reachability of the address, the transport connection, name resolution, and the application.
:::

```state
{"status":"Evidence recorded","chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["TCP","SYN, SYN/ACK, ACK · port 80"],["UDP","Query and reply on 53 · no opening"],["Fault","HTTP Off, then restored"],["Unavailable checks","Marked worksheet or not yet observed"]]}
```

## Troubleshooting

- Repeated ping failure: inspect the two addresses/masks, cable ports and link state first.
- Address-based HTTP works but a fresh lookup fails: inspect the selected DNS server and record, then use the name again.
- No new TCP opening in the event list: check whether a previous connection is reused; clear events and initiate a new session.
- No DNS event for an old name: use a newly added name and inspect the query, rather than assuming Reset Simulation clears caches.
- A connection disappears before `netstat`: use the previously captured PDU evidence; the snapshot is not a traffic-history log.
- An unsupported client command: use the named GUI/Simulation alternative or the paper worksheet, and label the evidence accurately.

## Challenge

In a separate project copy, add Server-PT SRV2 to SW1 Fa0/3 using straight-through copper. Give it `192.168.40.30/24`, leave the gateway blank and turn **HTTP On**. On the original SRV1 DNS service, add `second.lab.test → 192.168.40.30`. Keep PC-A's DNS server at `192.168.40.20`.

Before generating traffic, predict the destination IP/port for the name lookup and the subsequent HTTP connection. Then test both, record the actual client ports, and explain why the two destination server addresses differ. Finally, on paper, give the cumulative ACK after in-order data beginning at sequence `8001` with length `1200` and no SYN/FIN.

:::solution
The DNS query goes to the configured DNS server `192.168.40.20` on UDP port 53. Its answer identifies SRV2. The later HTTP connection goes to `192.168.40.30` TCP port 80, using a separately observed client port. The DNS server and requested application server need not be the same device.

If the address works but the name does not, verify SRV1's record and a fresh lookup; if the new server is unreachable by address, check its cable, address and HTTP setting independently. The data covers bytes `8001–9200`, so the next expected byte is `9201`. Save the variation separately, or remove SRV2 and its exact DNS record to return to the original baseline.
:::
