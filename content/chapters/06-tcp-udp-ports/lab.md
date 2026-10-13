---
title: Watch a TCP handshake and a UDP lookup in Simulation mode
environment: packet-tracer
devices: ["1 × Catalyst 2960 (SW1)", "1 × PC-PT (PC-A)", "1 × Server-PT (SRV1)"]
minutes: 50
---
Build a local LAN, enable HTTP and DNS, and compare a TCP opening with a UDP query. Then disable one service and use separate tests to identify what still works. These are guided simulator observations, not a claim that a particular Packet Tracer release was manually tested; record the actual ports, sequence values, labels, and behavior shown by your installed version.

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

Place new devices and connect the ports in the table. On both endpoints, open **Desktop → IP Configuration**, select **Static**, and enter the address and mask. Enter PC-A's DNS server as shown. Leave the gateways blank because both endpoints are on the same subnet. The new switch's default access ports are sufficient; no switch management address or router configuration is part of this transport exercise.

On PC-A, open **Desktop → Command Prompt**:

```text
ipconfig /all
ping 192.168.40.20
```

Record the address, mask and DNS server. Wait for the links to forward and repeat an initial ping if necessary.

:::expected
The settings match the table and the repeated ping receives replies. This establishes an ICMP round trip for the test; it does not yet establish a working HTTP service. If repeated requests fail, check the cable endpoints, link state and two host addresses before investigating transport behavior.
:::

```state
{"status":"LAN addressed · ping works","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["A","V"],"flows":[{"path":["A","S","V"],"back":true,"label":"ping 192.168.40.20","tags":{"A":"Same subnet · no gateway"}}],"rows":[["PC-A","192.168.40.10 · 255.255.255.0"],["PC-A DNS server","192.168.40.20"],["Gateways","Blank: one subnet"],["ping 192.168.40.20","Replies","ok"]]}
```

## Step 2: Establish services and make predictions

On SRV1, open **Services → HTTP** and set **HTTP On**. Under **Services → DNS**, set **On** and add an A record named `www.lab.test` with address `192.168.40.20`. Click **Add** and confirm the record appears.

On PC-A, request `http://192.168.40.20` in **Desktop → Web Browser**, then run:

```text
nslookup www.lab.test
```

Finally browse to `http://www.lab.test`. Use HTTP explicitly; this exercise does not require HTTPS.

Before reading the expected result, write the conventional transport and server port for (a) this HTTP exchange and (b) a small DNS lookup. Predict whether the server reply uses a new client destination port or reverses the request endpoints.

:::expected
Both pages should load and the name should return the intended address. HTTP here uses TCP destination port 80. A small DNS lookup ordinarily uses UDP destination port 53, although real DNS also supports TCP. Replies reverse the relevant client/server endpoint pair; the actual client source port must be observed rather than guessed.
:::

```state
{"status":"HTTP and DNS on SRV1","tone":"ok","focus":["V"],"flows":[{"path":["A","S","V"],"back":true,"label":"http://192.168.40.20","tags":{"A":"HTTP · TCP dst port 80"},"backTags":{"V":"Reply from TCP port 80"}},{"path":["A","S","V"],"back":true,"label":"nslookup www.lab.test","tags":{"A":"DNS · UDP dst port 53"},"backTags":{"V":"Reply from UDP port 53","A":"www.lab.test → 192.168.40.20"}},{"path":["A","S","V"],"back":true,"label":"http://www.lab.test","tags":{"A":"To 192.168.40.20 · TCP 80"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["HTTP, by address and name","Pages load · TCP 80","ok"],["Lookup www.lab.test","192.168.40.20 · via UDP 53","ok"],["Replies","Reverse the endpoint pair"]]}
```

## Step 3: Inspect one TCP opening

Enter **Simulation** mode. In **Edit Filters**, select ARP, TCP, HTTP and DNS; also select UDP if your release lists it separately. Clear old events with **Reset Simulation**, which does not guarantee application or address-resolution caches are erased.

Close and reopen PC-A's browser and request `http://192.168.40.20`. Advance using **Capture/Forward** and inspect the TCP PDUs. Read source/destination IP, source/destination port and flags.

Use this worked row only as a format:

| Direction | Source endpoint | Destination endpoint | TCP flags |
|---|---|---|---|
| Illustrative request | `192.168.40.10:51000` | `192.168.40.20:80` | SYN |

Replace `51000` with the client port in your own exchange. Complete the server reply and client's next row yourself before comparing with the expected result. Record why the sequence-number field is not a port number.

:::expected
An ordinary opening shows client SYN, server SYN/ACK and client ACK. The server reply has source `192.168.40.20:80` and destination `192.168.40.10:<observed-client-port>`. The third segment returns to the server port. Sequence numbers identify positions in each direction's byte stream; ports identify transport endpoints.

A reused connection might show data without a new opening. Start a new connection or use this explicitly representative opening worksheet if the release cannot show one. Mark worksheet evidence separately from observed PDUs.
:::

```state
{"status":"TCP opening observed","tone":"ok","focus":["A","V"],"flows":[{"path":["A","S","V"],"label":"SYN","tags":{"A":"SYN · to 192.168.40.20:80"}},{"path":["V","S","A"],"tone":"reply","label":"SYN/ACK","tags":{"V":"SYN/ACK · from port 80","A":"To the observed client port"}},{"path":["A","S","V"],"label":"ACK","tags":{"A":"ACK · back to port 80","V":"Opening complete"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["Opening","SYN → SYN/ACK → ACK","ok"],["SYN/ACK source","192.168.40.20:80"],["Client port","Observed, not guessed"],["Sequence number","Stream position, not a port"]]}
```

## Step 4: Compare a fresh UDP lookup

Add `lookup.lab.test` on SRV1 with the same correct address. Clear the Simulation event list and run `nslookup lookup.lab.test` on PC-A. Advance and inspect the DNS query and reply. A fresh name avoids assuming a particular cache-clearing command.

Complete two rows: query source/destination endpoints and reply source/destination endpoints. Then answer: where would you expect to find SYN, SYN/ACK and ACK in this UDP exchange?

:::expected
For the ordinary UDP query in this exercise, the destination is server port 53 and the reply's source is port 53. The other port is the client's observed query port. There is no UDP transport opening, so no TCP SYN sequence belongs to this exchange. A DNS response is application data carried in UDP; it does not mean UDP itself added acknowledgments or reliability.

If the simulator's client command is unavailable, request a newly added name in its browser and inspect the resulting DNS events. If your release cannot expose the fields, use this explicitly illustrative worksheet: PC-A sends UDP from 192.168.40.10:53000 to 192.168.40.20:53. Write the reply endpoints and state whether a transport opening is required. The answer is source 192.168.40.20:53 to destination 192.168.40.10:53000, with no UDP opening. Port 53000 is supplied for the worksheet, not claimed as the simulator’s chosen value. Record that limitation.
:::

```state
{"status":"UDP query and reply","tone":"ok","focus":["A","V"],"flows":[{"path":["A","S","V"],"back":true,"label":"nslookup lookup.lab.test","tags":{"A":"UDP to port 53 · no opening"},"backTags":{"V":"Reply · src UDP port 53","A":"To the client's query port"}}],"chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["New record","lookup.lab.test → 192.168.40.20"],["Query","To 192.168.40.20:53"],["Reply","From 192.168.40.20:53","ok"],["SYN, SYN/ACK, ACK","None: no UDP opening"]]}
```

## Step 5: Interpret a new connection snapshot

Without referring to Step 3's completed rows, interpret this representative snapshot. It belongs to a different Windows PC and is a paper exercise, not claimed output from Packet Tracer.

```output Representative Windows netstat -an excerpt
Proto  Local Address         Foreign Address        State
TCP    10.6.0.10:22          10.6.0.30:52000        ESTABLISHED
TCP    10.6.0.10:52100       10.6.0.20:80           ESTABLISHED
TCP    10.6.0.10:52101       10.6.0.20:80           TIME_WAIT
```

The documented services are SSH on 22 and HTTP on 80. Identify the PC's server role, its client role and the number of currently established HTTP connections. State the reply endpoints for the established HTTP connection.

Optionally use `netstat` on PC-A if supported, or `netstat -an` on an authorized real Windows computer. A short HTTP connection may close before inspection. Do not count a missing row as proof that your earlier captured exchange never happened.

:::expected
The PC accepts SSH from `10.6.0.30:52000` at local port 22. It has one established HTTP connection from `10.6.0.10:52100` to `10.6.0.20:80`. The other HTTP row is closing, not established. The reply endpoints are source `10.6.0.20:80` to destination `10.6.0.10:52100`.
:::

```state
{"status":"Paper: netstat snapshot","chips":[{"node":"V","text":"HTTP On","tone":"ok"},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["Server role","SSH on local port 22"],["Client role","HTTP to 10.6.0.20:80"],["Established HTTP","1 · the other is TIME_WAIT"],["Reply endpoints","10.6.0.20:80 → 10.6.0.10:52100"]]}
```

## Step 6: Observe a known service fault

Save the working project as `06-transport-baseline.pkt`. On SRV1, set **Services → HTTP → Off**. Keep DNS and addressing unchanged. This is a guided mechanism experiment: you know which setting changed.

Before testing, predict the outcome of ping, a fresh name lookup and a new address-based HTTP request. Add `faultcheck.lab.test` pointing to SRV1 for a fresh DNS name, then run:

```text
ping 192.168.40.20
nslookup faultcheck.lab.test
```

Open a new browser request to `http://192.168.40.20`. Do not rely on previously displayed page content. Record the actual response or lack of response; do not demand a particular reset or timeout string.

:::expected
ICMP and the fresh DNS lookup can still succeed while the new HTTP request fails. The known HTTP Off setting explains this controlled failure. Without that server evidence, ping success plus HTTP failure would justify checking transport and application evidence, not automatically diagnosing a stopped service. DNS and HTTP share a server IP but are separate services.
:::

```state
{"status":"HTTP Off on SRV1","tone":"bad","focus":["V"],"flows":[{"event":["V"],"wait":1.2,"tags":{"V":"Services → HTTP → Off"}},{"path":["A","S","V"],"back":true,"label":"ping 192.168.40.20"},{"path":["A","S","V"],"back":true,"label":"nslookup faultcheck.lab.test","tags":{"A":"DNS · UDP dst port 53"},"backTags":{"A":"faultcheck.lab.test resolves"}},{"path":["A","S","V"],"label":"http://192.168.40.20","tags":{"A":"HTTP · TCP dst port 80"},"stop":"V","stopText":"HTTP Off · request fails"}],"chips":[{"node":"V","text":"DNS On","tone":"ok"},{"node":"V","text":"HTTP On","tone":"ok","until":0},{"node":"V","text":"HTTP Off","tone":"bad","from":0}],"rows":[["ping 192.168.40.20","Replies","ok"],["Fresh name lookup","Resolves","ok"],["New HTTP request","Fails","bad"],["Saved first","06-transport-baseline.pkt"]]}
```

## Step 7: Restore and verify the original service

Set **SRV1 → Services → HTTP → On**. Start fresh browser requests to the address and to `http://www.lab.test`. Repeat the fresh name query if needed. Save the repaired project as `06-transport-complete.pkt` only after the intended service works.

:::expected
Both new HTTP requests load the page, and the name resolves to the intended server. The correction restores the actual failed service rather than merely producing another successful ping. No router, default gateway or switch configuration change was required.
:::

```state
{"status":"HTTP restored","tone":"ok","focus":["V"],"flows":[{"event":["V"],"wait":1.2,"tags":{"V":"Services → HTTP → On"}},{"path":["A","S","V"],"back":true,"label":"http://192.168.40.20","tags":{"A":"HTTP · TCP dst port 80"},"backTags":{"A":"Page loads"}},{"path":["A","S","V"],"back":true,"label":"http://www.lab.test","tags":{"A":"www.lab.test → 192.168.40.20"},"backTags":{"A":"Page loads by name"}}],"chips":[{"node":"V","text":"HTTP Off","tone":"bad","until":0},{"node":"V","text":"HTTP On","tone":"ok","from":0},{"node":"V","text":"DNS On","tone":"ok"}],"rows":[["http://192.168.40.20","Page loads","ok"],["http://www.lab.test","Page loads","ok"],["Changed","HTTP On only · no gateway or switch"],["Saved","06-transport-complete.pkt"]]}
```

## Step 8: Submit evidence and attempt the independent variation

Prepare a short record using the following rubric. Mark unavailable simulator checks as **worksheet** or **not yet observed**, not as passed.

| Evidence to submit | Satisfactory explanation |
|---|---|
| TCP three-row exchange | Correct directions, server port, observed client port and flags |
| UDP query/reply | Correct endpoint reversal; no invented UDP opening |
| New socket snapshot | Correct listening/client role and established count |
| Known fault and recovery | Predictions, actual tests, changed service and fresh application retest |
| Independent variation below | Your answer before the reference and any correction afterward |

Attempt the challenge before reading its expected box. A copied configuration or a checked step without an explanation is not the submission.

:::expected
Your record distinguishes address reachability, transport behavior, name resolution and useful application success. Errors are recorded with the corrected rule, not hidden by replacing the first answer.
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
The DNS query goes to the configured resolver `192.168.40.20`, ordinarily UDP port 53 in this small lab query. Its answer identifies SRV2. The later HTTP connection goes to `192.168.40.30` TCP port 80, using a separately observed client port. The DNS server and requested application server need not be the same device.

If the address works but the name does not, verify SRV1's record and a fresh lookup; if the new server is unreachable by address, check its cable, address and HTTP setting independently. The data covers bytes `8001–9200`, so the next expected byte is `9201`. Save the variation separately, or remove SRV2 and its exact DNS record to return to the original baseline.
:::
