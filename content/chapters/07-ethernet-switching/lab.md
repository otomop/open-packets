---
title: Watch a switch learn, flood and forget
environment: packet-tracer
devices: ["2 × Catalyst 2960 (S1; S2 is needed only for the extension)", "3 × PC-PT (PC-A, PC-B, PC-C)"]
minutes: 40
---
You will watch the lesson's learn, forward and flood rules happen one frame at a time. The core lab, Steps 1–7, takes about 40 minutes: a single switch learns three hosts, floods an unknown unicast, and you work out aging and save the result. The optional extension, Steps 8–11, adds about 40 minutes: two hosts move behind a second switch, so one port learns several addresses, and then a wrong static entry breaks one host and you find and remove it. Output below is representative, not captured from Packet Tracer; your MAC addresses will differ, so record and use your own.

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

## Topology

```diagram
{ "type": "topology", "title": "Initial topology: one switch and three PCs",
  "nodes": [
    { "id": "A", "kind": "pc", "label": "PC-A", "sub": "192.168.90.10/24", "x": 2, "y": 1 },
    { "id": "B", "kind": "pc", "label": "PC-B", "sub": "192.168.90.20/24", "x": 2, "y": 5 },
    { "id": "S1", "kind": "switch", "label": "S1", "sub": "2960 · VLAN 1", "x": 6, "y": 3 },
    { "id": "C", "kind": "pc", "label": "PC-C", "sub": "192.168.90.30/24", "x": 10, "y": 3 }
  ],
  "links": [
    { "from": "A", "to": "S1", "fromLabel": "Fa0", "toLabel": "Fa0/1" },
    { "from": "B", "to": "S1", "fromLabel": "Fa0", "toLabel": "Fa0/2" },
    { "from": "S1", "to": "C", "fromLabel": "Fa0/3", "toLabel": "Fa0" }
  ], "caption": "All three hosts initially use VLAN 1 on S1; S2 is added in the extension, Step 8." }
```

| Host | IPv4 / mask | Initial port | Port after Step 8 |
|---|---|---|---|
| PC-A FastEthernet0 | `192.168.90.10 / 255.255.255.0` | S1 Fa0/1 | S1 Fa0/1 |
| PC-B FastEthernet0 | `192.168.90.20 / 255.255.255.0` | S1 Fa0/2 | S2 Fa0/2 |
| PC-C FastEthernet0 | `192.168.90.30 / 255.255.255.0` | S1 Fa0/3 | S2 Fa0/3 |
| Switch link added in Step 8 | No IP address | Not connected | S1 Fa0/24 ↔ S2 Fa0/24 |

Use straight-through copper for PCs. Use copper crossover or Packet Tracer's automatic connection tool for the switch-to-switch link. No host needs a default gateway or DNS server because the entire exercise stays in one subnet. Begin with new switches; do not add a second inter-switch link, which would introduce a spanning-tree exercise beyond this lab.

## Step 1: Cable, address and record the MAC addresses

Create S1 and the three PCs, connect their initial ports, and set each static address under **Desktop → IP Configuration**. Open each PC's **Desktop → Command Prompt** and record its physical/MAC address alongside its name and IP:

```text Each PC
ipconfig /all
```

The switch commands below are setup that Chapter 09 teaches properly; for now, type them as given. `interface range` selects several ports at once, and the two `switchport` commands make them ordinary host (access) ports in VLAN 1. `show interfaces status` then lists each port's link state and VLAN, and `show vlan brief` lists the ports in each VLAN.

On S1, decline an initial setup dialog if offered, enter the CLI, and configure the host ports explicitly:

```ios S1
Switch> enable
Switch# configure terminal
Switch(config)# hostname S1
S1(config)# interface range fastethernet0/1 - 3
S1(config-if-range)# switchport mode access
S1(config-if-range)# switchport access vlan 1
S1(config-if-range)# no shutdown
S1(config-if-range)# end
S1# show interfaces status
S1# show vlan brief
```

:::expected
Fa0/1–3 show as connected in VLAN 1. Wait until the link lights turn green, about 30 seconds, before you capture anything. The sample MAC addresses used later stand for the real ones you recorded.
:::

```state
{"status":"Three hosts on S1","led":true,"focus":["S1"],"chips":[{"node":"S1","text":"Fa0/1–3 · access VLAN 1"}],"rows":[["S1 Fa0/1–3","Access · VLAN 1 · enabled"],["Each PC","Static IP · MAC recorded"],["Gateway, DNS","None · one subnet"]]}
```

## Step 2: Start from an empty table

Before generating test traffic, inspect and clear S1's dynamic table. This removes what the switch has learned; it does not touch the PCs' ARP caches.

```ios S1
S1# show mac address-table
S1# clear mac address-table dynamic
S1# show mac address-table
```

:::expected
The dynamic host entries are gone. If a PC sends background traffic, its row reappears at once; clear again just before the next test if that happens.
:::

```state
{"status":"Dynamic table cleared","focus":["S1"],"chips":[{"node":"S1","text":"Dynamic entries cleared"}],"rows":[["S1 dynamic entries","Cleared"],["PC ARP caches","Not cleared"],["Reserved or static rows","May still show"]]}
```

## Step 3: One ping, one frame at a time

Before you advance each frame, write down its source, its destination, the row the switch will learn and the ports the frame will leave by.

Enter **Simulation** mode and use **Edit Filters** to select ARP and ICMP. On PC-A, run `arp -a`; PC-B's mapping should be absent. If it is present, remove it with `arp -d` and check again. Clear S1's dynamic table again after any preparatory traffic.

Start the ping on PC-A and use **Capture/Forward** to follow events:

```text PC-A
ping 192.168.90.20
```

After the ARP request reaches S1, pause and inspect the table. Continue through the reply and inspect again. Return to Realtime mode to finish any remaining ping events.

```ios S1
S1# show mac address-table
```

:::expected
The ARP request teaches A on Fa0/1 and is flooded to Fa0/2 and Fa0/3. B replies; the source teaches B on Fa0/2, and the reply is forwarded only to A's known port. Subsequent ICMP request/reply frames use the learned ports. PC-C does not answer an ARP request for B's address, so receiving that request alone does not teach C's MAC.

Representative host rows after A and B communicate:
```output Representative S1# show mac address-table
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    00aa.aaaa.aaaa    DYNAMIC     Fa0/1  ← use PC-A's actual recorded MAC
   1    00bb.bbbb.bbbb    DYNAMIC     Fa0/2  ← learned from B's source traffic
```
:::

```state
{"status":"A and B learned","tone":"ok","focus":["S1"],"flows":[{"path":["A","S1",["B","C"]],"label":"ARP request (broadcast)","tags":{"S1":"Learn A Fa0/1 · flood broadcast","C":"Request for B's address · no reply"}},{"path":["B","S1","A"],"tone":"reply","label":"ARP reply to A","tags":{"S1":"Learn B Fa0/2 · A known → Fa0/1"}},{"path":["A","S1","B"],"back":true,"label":"ICMP echo","tags":{"S1":"B known → Fa0/2"},"backTags":{"S1":"A known → Fa0/1"}}],"rows":[["ARP request","Learns A · floods Fa0/2, Fa0/3"],["ARP reply","Learns B · out Fa0/1 only"],["PC-C","Received it · not learned"],["MAC table","A Fa0/1 · B Fa0/2","ok"]]}
```

## Step 4: Bring PC-C into the table

PC-C has received frames but never sent one, so S1 has not learned it. From PC-A, ping C and then display the table. To reply, C must transmit, and that gives the switch a source to learn.

```text PC-A
ping 192.168.90.30
```

```ios S1
S1# show mac address-table
```

:::expected
C appears as a dynamic entry on Fa0/3. A and B are still present unless five minutes have passed since they last sent a frame.
:::

```state
{"status":"C learned on Fa0/3","tone":"ok","focus":["S1","C"],"flows":[{"path":["A","S1",["B","C"]],"label":"First frame of the ping to C"},{"path":["C","S1","A"],"tone":"reply","label":"C's reply to A","tags":{"S1":"Learn C on Fa0/3"}}],"rows":[["PC-C","DYNAMIC · Fa0/3","ok"],["A and B","Remain unless aged out"],["Check","Three recorded host MACs"]]}
```

## Step 5: Prove unknown-unicast flooding

In Realtime mode, ping B once to refresh A's ARP entry, then use `arp -a` on A to confirm that `192.168.90.20` maps to B's recorded MAC. Clear only S1's dynamic table immediately before the next ping. Do not clear A's ARP cache.

```ios S1
S1# clear mac address-table dynamic
S1# show mac address-table
```

Switch to Simulation mode, clear old events, and start another ping from A to B. Inspect the first ICMP frame's Ethernet destination and the switch's outgoing copies. Then continue through B's reply and a second request.

```text PC-A
ping 192.168.90.20
```

:::expected
A already knows B's MAC, so it can send an ICMP frame addressed to that unicast MAC without a new ARP exchange. S1 learns A but does not know B's location; the first request is copied to both Fa0/2 and Fa0/3. Its destination remains B's unicast MAC. B's reply teaches B, allowing the following request to use Fa0/2 alone. If you instead observe ARP first, refresh A's mapping and repeat: the ARP reply would teach B before the ICMP request, defeating this demonstration.
:::

```state
{"status":"Unknown unicast flooded","tone":"ok","focus":["S1"],"chips":[{"node":"A","text":"Knows B's MAC · no ARP"}],"flows":[{"path":["A","S1",["B","C"]],"label":"Echo request to B's MAC","tags":{"S1":"Learn A · B unknown → flood","C":"Copy still addressed to B"}},{"path":["B","S1","A"],"tone":"reply","label":"Echo reply","tags":{"S1":"Learn B Fa0/2 · A known → Fa0/1"}},{"path":["A","S1","B"],"label":"Next echo request","tags":{"S1":"B known → Fa0/2 only"}}],"rows":[["A's ARP cache","Kept B's MAC · no new ARP"],["First request","Copied to Fa0/2 and Fa0/3"],["Destination MAC","Still B's unicast MAC"],["After B's reply","Fa0/2 alone","ok"]]}
```

## Step 6: Explain aging from source evidence

Display the aging timer, if your Packet Tracer release supports the command:

```ios S1
S1# show mac address-table aging-time
```

Waiting five minutes proves little, so work the timeline below on paper. Complete the last row before reading the answer.

| Time | Event on an otherwise quiet VLAN 1 |
|---|---|
| 0 s | S1 receives a frame sourced by B and learns B dynamically |
| 200 s | A sends a frame to B; B sends no response or other frame |
| 301 s | Inspect B's entry, with the dynamic aging interval explicitly set to 300 s |

Decide whether the frame sent **to** B at 200 s refreshed B's entry. Then say what would differ if B's entry were static.

:::expected
The frame from A refreshes A, not B. B sends nothing after time 0, so its dynamic entry has aged out by 301 s, and the next frame for B is flooded. A static entry would still be there: it does not age and is not removed by `clear mac address-table dynamic`.
:::

```state
{"status":"Aging worked on paper","focus":["S1"],"rows":[["Worksheet timer","300 s"],["Frame A sends to B","Refreshes A, not B"],["B at 301 s","Eligible to age out"],["Static entry","Does not age · survives clear"]]}
```

## Step 7: Verify and save the one-switch baseline

In Realtime mode, ping B and C from A, then confirm that S1 has learned all three hosts and save the configuration.

```text PC-A
ping 192.168.90.20
ping 192.168.90.30
```

```ios S1
S1# show mac address-table
S1# copy running-config startup-config
```

:::expected
Both pings succeed. A, B and C appear as DYNAMIC entries on Fa0/1, Fa0/2 and Fa0/3. Press Enter at the destination-filename prompt, then save the project as `07-switching-core.pkt`. This completes the core lab; Steps 8–11 are the optional extension.
:::

```state
{"status":"Core baseline saved","tone":"ok","focus":["S1"],"flows":[{"path":["A","S1","B"],"back":true,"label":"Ping A to B"},{"path":["A","S1","C"],"back":true,"label":"Ping A to C"}],"rows":[["S1 Fa0/1–3","A, B, C · DYNAMIC","ok"],["A to B, A to C","Both succeed","ok"],["Saved","07-switching-core.pkt"]]}
```

## Step 8: Extension: Add a second switch and watch one port learn two MACs

Add a new 2960 named S2. Connect S1 Fa0/24 to S2 Fa0/24, then move B to S2 Fa0/2 and C to S2 Fa0/3. Keep A on S1 Fa0/1. The port setup repeats Step 1. Both ends of the link between the switches are access ports in VLAN 1, which is enough to carry one VLAN.

```diagram
{ "type": "topology", "title": "Step 8 topology: B and C behind S2",
  "nodes": [
    { "id": "A", "kind": "pc", "label": "PC-A", "sub": "192.168.90.10/24", "x": 1, "y": 3 },
    { "id": "S1", "kind": "switch", "label": "S1", "sub": "2960 · VLAN 1", "x": 4, "y": 3 },
    { "id": "S2", "kind": "switch", "label": "S2", "sub": "2960 · VLAN 1", "x": 8, "y": 3 },
    { "id": "B", "kind": "pc", "label": "PC-B", "sub": "192.168.90.20/24", "x": 11, "y": 1 },
    { "id": "C", "kind": "pc", "label": "PC-C", "sub": "192.168.90.30/24", "x": 11, "y": 5 }
  ],
  "links": [
    { "from": "A", "to": "S1", "fromLabel": "Fa0", "toLabel": "Fa0/1" },
    { "from": "S1", "to": "S2", "fromLabel": "Fa0/24", "toLabel": "Fa0/24" },
    { "from": "S2", "to": "B", "fromLabel": "Fa0/2", "toLabel": "Fa0" },
    { "from": "S2", "to": "C", "fromLabel": "Fa0/3", "toLabel": "Fa0" }
  ], "caption": "A stays on S1 Fa0/1, B and C move to S2 Fa0/2 and Fa0/3, and S1 Fa0/24 connects to S2 Fa0/24 as a VLAN 1 access link." }
```

```ios S1
S1# configure terminal
S1(config)# interface fastethernet0/24
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 1
S1(config-if)# no shutdown
S1(config-if)# end
```

```ios S2
Switch> enable
Switch# configure terminal
Switch(config)# hostname S2
S2(config)# interface range fastethernet0/2 - 3
S2(config-if-range)# switchport mode access
S2(config-if-range)# switchport access vlan 1
S2(config-if-range)# no shutdown
S2(config-if-range)# exit
S2(config)# interface fastethernet0/24
S2(config-if)# switchport mode access
S2(config-if)# switchport access vlan 1
S2(config-if)# no shutdown
S2(config-if)# end
S2# show interfaces status
```

Wait for the links to forward. Clear dynamic entries on each switch, ping B and C from A in Realtime mode, and inspect both tables immediately afterwards. If a dynamic entry ages out while you work, repeat the relevant ping.

```ios S1
S1# clear mac address-table dynamic
```

```ios S2
S2# clear mac address-table dynamic
```

```text PC-A
ping 192.168.90.20
ping 192.168.90.30
```

```ios S1
S1# show mac address-table
```

```ios S2
S2# show mac address-table
```

:::expected
S1 reaches B and C through Fa0/24, so their two different MACs appear on that one port. A is learned DYNAMIC on S1 Fa0/1. S2 learns A through its Fa0/24, B on Fa0/2, and C on Fa0/3. Each switch may also show the other switch's own port MAC on Fa0/24; ignore it.
:::

```state
{"topology":2,"status":"S2 added · B, C moved","tone":"ok","wake":["S2"],"focus":["S1","S2"],"flows":[{"path":["A","S1","S2","B"],"back":true,"label":"Ping A to B","tags":{"S1":"Learn A on Fa0/1","S2":"Learn A on Fa0/24"},"backTags":{"S2":"Learn B on Fa0/2","S1":"Learn B on Fa0/24"}},{"path":["A","S1","S2","C"],"back":true,"label":"Ping A to C","backTags":{"S2":"Learn C on Fa0/3","S1":"Learn C on Fa0/24 · two MACs on one port"}}],"rows":[["S1 Fa0/1","A · DYNAMIC","ok"],["S1 Fa0/24","B and C · two MACs","ok"],["S2","A Fa0/24 · B Fa0/2 · C Fa0/3","ok"],["S1–S2 link","Fa0/24 · access VLAN 1"]]}
```

## Step 9: Extension: Predict a source move and preserve the baseline

You now have A on S1 and B/C behind S2. Before generating more traffic, answer this on paper: if B broadcasts an ARP request for C and C returns a unicast reply, which switch sees each source? Assume both dynamic tables begin empty and no other host transmits.

Then perform a separate source-move experiment. Configure an additional port, using S1's console:

```ios S1
S1# configure terminal
S1(config)# interface fastethernet0/4
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 1
S1(config-if)# no shutdown
S1(config-if)# end
```

Keep A's address and MAC unchanged. Move its cable from S1 Fa0/1 to Fa0/4, wait for forwarding, and **predict** the learned port before A pings B. After A transmits, inspect `show mac address-table`. Explain whether you needed to clear A's ARP cache or wait for the previous MAC timer.

Restore A's cable to Fa0/1, wait for forwarding, ping B and C, and inspect the learned path again. Save only the restored layout:

```ios S1
S1# copy running-config startup-config
```

```ios S2
S2# copy running-config startup-config
```

Press Enter at each destination-filename prompt. Save `07-switching-baseline.pkt`.

:::expected
For the paper exchange, S2 sees B on Fa0/2 and S1 sees B through Fa0/24 because the broadcast crosses the uplink. C's reply goes directly from S2 Fa0/3 to its known B port, so S1 does not learn C from that reply.

For the live move, A's first new source frame updates its dynamic entry to Fa0/4. Correct host ARP information can remain; the switch learns a new physical path for the same source MAC. After you restore the cable and A sends again, A is learned on Fa0/1 once more.
:::

```state
{"topology":2,"status":"Layout restored and saved","tone":"ok","focus":["S1","S2"],"chips":[{"node":"S1","text":"Does not learn C from this reply","from":2,"until":3}],"flows":[{"path":["B","S2",["C","S1"]],"label":"Paper: B's ARP broadcast for C","tags":{"S2":"Learn B on Fa0/2 · flood broadcast","S1":"Learn B on Fa0/24"}},{"path":["S1","A"],"label":"Paper: S1 floods the broadcast to A"},{"path":["C","S2","B"],"tone":"reply","label":"Paper: C's unicast reply to B","tags":{"S2":"Learn C on Fa0/3 · B known → Fa0/2"}},{"path":["A","S1","S2","B"],"back":true,"label":"Restored: ping A to B","tags":{"S1":"A learned on Fa0/1 again"}}],"rows":[["Paper: B's broadcast","S2 B Fa0/2 · S1 B Fa0/24"],["Paper: C's reply","S1 does not learn C"],["A moved to Fa0/4","Entry moves · ARP can stay"],["Restored","A on Fa0/1 · saved","ok"]]}
```

## Step 10: Extension: Introduce one incorrect static entry

The lesson said a static entry on the wrong port keeps sending a host's traffic the wrong way. Create that fault: point B's MAC at S1 Fa0/1, which actually leads to A. Substitute **B's actual MAC for `00bb.bbbb.bbbb`**. Change nothing else.

```ios S1
S1# configure terminal
S1(config)# mac address-table static 00bb.bbbb.bbbb vlan 1 interface fastethernet0/1
S1(config)# end
S1# show mac address-table
S1# clear mac address-table dynamic
S1# show mac address-table
```

From A, ping B and then C. In Simulation mode, watch what S1 does with the frame addressed to B. Read the STATIC row before you attempt any repair.

```text PC-A
ping 192.168.90.20
ping 192.168.90.30
```

:::expected
S1 now believes B is on Fa0/1. A frame from A to B arrives on Fa0/1 with a destination mapped to that same port, so S1 filters it instead of forwarding it toward S2. The ping from A to B fails while the ping from A to C still works. Clearing dynamic entries does not help because the entry is static. If your Packet Tracer release rejects the static command, work the diagnosis on paper from the command shown.
:::

```state
{"topology":2,"status":"Static entry filters B","tone":"bad","focus":["S1"],"chips":[{"node":"S1","text":"STATIC B's MAC → Fa0/1","tone":"bad"}],"flows":[{"path":["A","S1"],"label":"Unicast frame to B","stop":"S1","stopText":"B maps to ingress Fa0/1 · filter"},{"path":["A","S1","S2","C"],"back":true,"label":"Ping A to C (can still work)"}],"rows":[["STATIC row","B's MAC → Fa0/1","bad"],["A to B","Fails · filtered by S1","bad"],["A to C","Can still work"],["Clear dynamic","Does not remove it"]]}
```

## Step 11: Extension: Recover the fault and confirm the baseline

Remove the static entry with the `no` form of the command that created it, again using B's actual MAC in place of `00bb.bbbb.bbbb`. Then send traffic so the switch relearns the correct path, and verify both hosts before you save.

```ios S1
S1# configure terminal
S1(config)# no mac address-table static 00bb.bbbb.bbbb vlan 1 interface fastethernet0/1
S1(config)# end
S1# clear mac address-table dynamic
```

```text PC-A
ping 192.168.90.20
ping 192.168.90.30
```

```ios S1
S1# show mac address-table
S1# copy running-config startup-config
```

:::expected
B is learned dynamically through Fa0/24, both pings succeed, and the static row is gone. Accept the destination filename prompt when saving the device. Save the repaired topology as `switching-lab.pkt`.
:::

Before the challenge, check that you can explain each result from your notes (Steps 1–7 if you did only the core):

| Step | What you should be able to explain |
|---|---|
| 3 and 4 | Which source each frame taught the switch, and which destination chose the egress port |
| 5 | Why a unicast frame was flooded while PC-A's ARP cache still held B's MAC |
| 8 | Why S1 shows two MAC addresses on Fa0/24 |
| 9 | Why A's entry moved as soon as A sent a frame on the new port |
| 10 and 11 | Why clearing dynamic entries did not fix B, and what did |

```state
{"topology":2,"status":"Static removed · B relearned","tone":"ok","focus":["S1"],"chips":[{"node":"S1","text":"STATIC B's MAC → Fa0/1","tone":"bad","until":0},{"node":"S1","text":"B DYNAMIC via Fa0/24","tone":"ok","from":2}],"flows":[{"event":["S1"],"wait":1.2,"tags":{"S1":"Static B row removed · dynamic cleared"}},{"path":["A","S1","S2","B"],"back":true,"label":"Ping A to B","backTags":{"S1":"Learn B on Fa0/24 · DYNAMIC"}},{"path":["A","S1","S2","C"],"back":true,"label":"Ping A to C"}],"rows":[["STATIC row","Removed","ok"],["B","DYNAMIC via Fa0/24","ok"],["A to B, A to C","Both succeed","ok"],["Saved","switching-lab.pkt"]]}
```

## Troubleshooting

- **Host absent from the MAC table:** verify the link and VLAN, generate traffic from that host, then inspect promptly. Merely connecting or receiving is insufficient evidence of learning.
- **ARP appears before the intended unknown-unicast test:** A lacks a current mapping for B; refresh ARP, clear only S1's dynamic entries, and repeat immediately.
- **Multiple hosts appear on Fa0/24 (extension):** compare with the Step 8 topology; this is expected for B and C behind S2.
- **A display keyword is unsupported:** use the plain `show mac address-table` and `clear mac address-table dynamic` instead.
- **Failure persists after clearing dynamic entries:** check for the deliberately configured STATIC row and remove its exact configuration.
- **Ping fails after moving cables:** check final port assignments, VLAN 1 on both inter-switch ends, and forwarding state. Do not add a second switch link to troubleshoot the first.

## Challenge

The challenge needs the extension. Work in a separate copy of the restored two-switch project from Step 9. Before moving anything, have B ping C and verify that B knows C's actual MAC with `arp -a`. Move C from S2 Fa0/3 to **S1 Fa0/5**, leaving its IP and MAC unchanged. Configure S1 Fa0/5 as an enabled VLAN 1 access port, and wait for forwarding. Keep A on S1 Fa0/1 and B on S2 Fa0/2.

Clear only the dynamic MAC tables on both switches. Generate no other host traffic. Before B sends its next unicast request to C, predict the egress ports and learned rows on each switch. Then predict C's reply and explain whether S2 will learn C this time. Observe in Simulation mode; if a new ARP exchange occurs, record it and repeat the unicast test after confirming B's mapping rather than pretending it matched the intended initial state.

:::solution
Prepare the added port through S1's CLI:

```ios S1
S1# configure terminal
S1(config)# interface fastethernet0/5
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 1
S1(config-if)# no shutdown
S1(config-if)# end
S1# clear mac address-table dynamic
```

```ios S2
S2# clear mac address-table dynamic
```

B's first unicast request teaches B on S2 Fa0/2. C is unknown there, so its copy leaves the only other connected forwarding host path, Fa0/24. S1 learns B on Fa0/24 and floods the still-unknown C destination toward A on Fa0/1 and C on Fa0/5. The Ethernet destination remains C's unicast MAC.

C's reply teaches C on S1 Fa0/5 and follows the known B path through Fa0/24. S2 now receives C's source frame on its Fa0/24 and learns C there before forwarding to B on Fa0/2. Unlike the earlier same-switch B/C exchange, this reply crosses the inter-switch link, so both switches can learn C.

To restore the baseline, move C back to S2 Fa0/3, wait for forwarding, generate traffic from C toward A, and verify the learned path and both client pings. Save the challenge separately or save only after restoring the original layout.
:::
