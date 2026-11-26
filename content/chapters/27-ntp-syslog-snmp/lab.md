---
title: Synchronize two routers and investigate their management records
environment: mixed
devices: ["2 × Cisco 2911 routers (R1 time source, R2 client)", "1 × Catalyst 2960 (SW1)", "1 × Server-PT (LOG1)", "1 × PC-PT (PC1)"]
minutes: 80
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Use a new Packet Tracer project. R1 acts as the lab's time source, R2 synchronizes to it and sends its log messages to LOG1, and PC1 reads R2's name and location over SNMP. The expected results were written from IOS behaviour and have not been run end to end in Packet Tracer for this revision. Where your version lacks a command, use the worksheet evidence supplied in that step.

The lab has three parts: NTP (Steps 1–5), syslog (Steps 6–9) and SNMP (Steps 10–13). NTP configuration is a v1.1 objective; reading syslog and explaining SNMP serve both exam versions. The SNMP commands are given to you and you do not need to memorise them.

## Topology

All five devices share VLAN 10 and `10.60.0.0/24`. Connect each listed Ethernet port with a copper straight-through cable. R2's Loopback99 is a disposable local test interface; it does not carry management traffic.

```diagram
{"type":"topology","title":"Management services on a single isolated LAN","caption":"The test interface is local to R2, so changing it does not interrupt the path to the time source or collector.","nodes":[{"id":"R1","kind":"router","label":"R1","sub":"10.60.0.1 · NTP","x":2,"y":1},{"id":"R2","kind":"router","label":"R2","sub":"10.60.0.2 · agent","x":2,"y":5},{"id":"SW","kind":"switch","label":"SW1","sub":"VLAN 10","x":6,"y":3},{"id":"LOG","kind":"server","label":"LOG1","sub":"10.60.0.50","x":10,"y":1},{"id":"PC","kind":"pc","label":"PC1","sub":"10.60.0.60","x":10,"y":5}],"links":[{"from":"R1","to":"SW","fromLabel":"Gi0/0","toLabel":"Fa0/1"},{"from":"R2","to":"SW","fromLabel":"Gi0/0","toLabel":"Fa0/2","accent":true},{"from":"SW","to":"LOG","fromLabel":"Fa0/3","toLabel":"Fa0"},{"from":"SW","to":"PC","fromLabel":"Fa0/4","toLabel":"Fa0"}]}
```

| Device | Interface/address | Gateway or purpose |
|---|---|---|
| R1 | Gi0/0 `10.60.0.1/24` | Isolated stratum-8 source |
| R2 | Gi0/0 `10.60.0.2/24` | NTP client, syslog sender, SNMP agent |
| R2 | Loopback99 `192.0.2.99/32` | Test interface only |
| LOG1 | FastEthernet0 `10.60.0.50/24` | Gateway `.1`; syslog service |
| PC1 | FastEthernet0 `10.60.0.60/24` | Gateway `.1`; MIB Browser |

Everything is on one subnet, so no routing is needed.

## Step 1: Establish the management LAN

Set LOG1 and PC1 under Desktop → IP Configuration. Configure the switch and both routers from their console/CLI tabs:

```ios SW1
Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# vlan 10
SW1(config-vlan)# name MANAGEMENT-LAB
SW1(config-vlan)# exit
SW1(config)# interface range fastethernet0/1 - 4
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# no shutdown
SW1(config-if-range)# end
```

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.60.0.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.60.0.2 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# interface loopback99
R2(config-if)# ip address 192.0.2.99 255.255.255.255
R2(config-if)# end
R2# show ip interface brief
R2# ping 10.60.0.1
R2# ping 10.60.0.50
```

:::expected
After the links settle, R2 reaches R1 and LOG1. PC1 can ping `10.60.0.2` and `.50`. Gi0/0 and Loopback99 on R2 are up/up. Fix any ping failure before going on. Run `show clock detail` and `show ntp status` on both routers and note the starting state: neither router is synchronized yet.
:::

```state
{"status":"Management LAN up","tone":"ok","led":true,"focus":["R2","PC"],"chips":[{"node":"SW","text":"VLAN 10 · Fa0/1–4"}],"flows":[{"path":["R2","SW","R1"],"back":true,"label":"R2 pings 10.60.0.1","tags":{"SW":"VLAN 10 · Fa0/2 → Fa0/1"}},{"path":["R2","SW","LOG"],"back":true,"label":"R2 pings 10.60.0.50"},{"path":["PC","SW","R2"],"back":true,"label":"PC1 pings 10.60.0.2"},{"path":["PC","SW","LOG"],"back":true,"label":"PC1 pings 10.60.0.50"}],"rows":[["R2 Gi0/0 · Loopback99","up/up","ok"],["R2 → .1 and .50","Replies","ok"],["PC1 → .2 and .50","Replies","ok"],["Baseline on R1 and R2","show clock detail · show ntp status"]]}
```

## Step 2: Prepare an isolated time source

Set a suitable current lab date/time; the literal example below uses 20 September 2026. R1 has no other NTP sources in this project.

```ios R1
R1# clock set 12:00:00 20 Sep 2026
R1# configure terminal
R1(config)# ntp master 8
R1(config)# end
R1# show ntp status
R1# show clock detail
```

:::expected
R1 reports stratum 8 with a local reference such as `127.127.1.1`, the name IOS gives its own clock. The time is only as accurate as what you typed, which is fine for an isolated lab.
:::

```state
{"status":"R1 serves stratum 8","focus":["R1"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"}],"rows":[["R1 clock","Set by hand · e.g. 20 Sep 2026"],["ntp master 8","Local clock at stratum 8"],["Reference","Local, e.g. 127.127.1.1"],["Verified UTC?","No · a supplied lab time","dim"]]}
```

## Step 3: Synchronize R2 and read the association

Before entering the client command, predict R2's stratum if it selects the stated source. Name the two displays that distinguish the remote source's state from R2's own state.

```ios R2
R2# configure terminal
R2(config)# ntp server 10.60.0.1
R2(config)# end
R2# show ntp associations
R2# show ntp status
R2# show clock detail
```

Repeat `show ntp associations` every minute or so and watch `reach` grow. Synchronization takes several exchanges, so wait before deciding that anything is wrong.

:::expected
Once R2 selects R1, `show ntp status` reports synchronized at stratum 9, and the association for `.1` shows `st 8` with a `*`. Reach climbs through 1, 3, 7, 17 and onward to 377 as polls succeed, so a value below 377 early on is normal.
:::

If the NTP operation is unavailable, interpret this supplied alternative: the association to `.1` has `st 8`, `reach 377` and `*~`, with the legend `* selected synchronization source; ~ configured`; local status says `synchronized, stratum 9, reference 10.60.0.1`. Identify which fields prove selection, recent exchanges and the local hierarchy position before opening the answer.

:::solution
The asterisk and local reference agree on the selected source. The tilde says configured. The association's 8 describes the remote source, while local status reports R2 at 9. Octal 377 records eight recent successful poll results; it is not a lifetime counter or independent proof of time accuracy. Label this worksheet as supplied evidence.
:::

```state
{"status":"R2 synced at stratum 9","tone":"ok","focus":["R2","R1"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok","from":1}],"flows":[{"path":["R2","SW","R1"],"back":true,"label":"NTP exchanges with 10.60.0.1","tags":{"R2":"ntp server 10.60.0.1","R1":"Local clock · stratum 8"}},{"event":["R2"],"tags":{"R2":"Selects .1 · stratum 8 + 1 = 9"}}],"rows":[["Association","10.60.0.1 · st 8, the remote"],["R2 local status","Synchronized · stratum 9","ok"],["Reach below 377 at first","Not automatically a failure"]]}
```

## Step 4: Observe an incorrect server address

There is no host at `10.60.0.254` in this isolated project. Replace R2's server address and inspect the new association:

First predict whether a plausible clock reading immediately after the change would prove that the new association works. Keep the faulty association in place long enough to record its address and repeated reach observations before proceeding to recovery.

```ios R2
R2# configure terminal
R2(config)# no ntp server 10.60.0.1
R2(config)# ntp server 10.60.0.254
R2(config)# end
R2# show ntp associations
R2# show ntp status
```

:::expected
The new association gets no reply from the nonexistent host, so its reach stays at 0. R2's clock still shows a plausible time, and its status may stay synchronized for a while, because a clock keeps running after its source is lost. A correct-looking clock is therefore no evidence that the configured server works.
:::

```state
{"status":"Wrong NTP server","tone":"bad","focus":["R2"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok","until":0},{"node":"R2","text":"Server .254 · reach 0","tone":"bad","from":0}],"flows":[{"event":["R2"],"wait":1.6,"tags":{"R2":"Server .1 removed · .254 added"}}],"rows":[["Configured server","10.60.0.254 · no such host","bad"],["New association reach","Stays 0","bad"],["R2 clock · status","May stay plausible for now"],["Plausible clock","Does not validate .254"]]}
```

## Step 5: Restore the intended association

```ios R2
R2# configure terminal
R2(config)# no ntp server 10.60.0.254
R2(config)# ntp server 10.60.0.1
R2(config)# end
R2# show ntp associations
R2# show ntp status
```

:::expected
R2 resumes successful exchanges with `.1` and, after source selection, reports synchronized stratum 9. Record actual recovery time and reach progression. If it does not recover, check R1's source state and the actual NTP exchanges rather than assuming that successful ICMP proves the NTP service.
:::

```state
{"status":"NTP restored to .1","tone":"ok","focus":["R2","R1"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"Server .254 · reach 0","tone":"bad","until":0},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok","from":2}],"flows":[{"event":["R2"],"wait":1.6,"tags":{"R2":"Server .254 removed · .1 again"}},{"path":["R2","SW","R1"],"back":true,"label":"NTP exchanges with 10.60.0.1","tags":{"R1":"Local clock · stratum 8"}},{"event":["R2"],"tags":{"R2":"Selects .1 · stratum 9"}}],"rows":[["NTP server","10.60.0.1","ok"],["R2 local status","Synchronized · stratum 9","ok"],["Record","Recovery time · reach progression"],["A successful ping","Does not prove NTP","dim"]]}
```

## Step 6: Prepare local and remote logging

On LOG1, open Services → SYSLOG and turn the service On. Configure R2's timestamp format, buffer and collector:

```ios R2
R2# configure terminal
R2(config)# service timestamps log datetime msec
R2(config)# logging buffered 16384 debugging
R2(config)# logging host 10.60.0.50
R2(config)# logging trap debugging
R2(config)# end
R2# show logging
```

:::expected
`show logging` lists `10.60.0.50` as a logging host with trap level debugging, and shows the buffer's size and level. The timestamp command changes only how the time is printed. Nothing has been delivered to LOG1 yet. If your version rejects the level on `logging buffered`, enter `logging buffered 16384` alone.
:::

```state
{"status":"Logging configured","focus":["R2","LOG"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"LOG","text":"SYSLOG On","tone":"ok"}],"rows":[["Remote destination","10.60.0.50 · debugging"],["Local buffer","16384 · record state and level"],["Timestamps","datetime msec · format only"],["Delivery to LOG1","Not yet proven","dim"]]}
```

## Step 7: Record an administrative interface event

Before changing anything, identify the path from R2 to LOG1 and explain why a Loopback99 shutdown should leave that path available. Change only the disposable loopback:

```ios R2
R2# configure terminal
R2(config)# interface loopback99
R2(config-if)# shutdown
R2(config-if)# end
R2# show ip interface brief
R2# show logging
```

Open LOG1's SYSLOG view and compare newly received records with R2's local output. Identify the interface, description, severity and timestamp from what was actually produced.

:::expected
Loopback99 becomes administratively down. Gi0/0 stays up, so the path to LOG1 is unaffected. Expect `%LINK-5-CHANGED: Interface Loopback99, changed state to administratively down`: facility LINK, severity 5, mnemonic CHANGED. A `%LINEPROTO-5-UPDOWN` message usually accompanies it. If your version logs nothing, read the record above as the worksheet.
:::

```state
{"status":"Loopback99 shut down","tone":"warn","focus":["R2","LOG"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"R2","text":"Lo99 admin down","tone":"warn","from":0},{"node":"LOG","text":"SYSLOG On","tone":"ok"}],"flows":[{"event":["R2"],"wait":1.6,"tags":{"R2":"Lo99 shutdown · admin down"}},{"path":["R2","SW","LOG"],"label":"Syslog record to 10.60.0.50","tags":{"R2":"Logs to buffer and 10.60.0.50","LOG":"e.g. LINK-5-CHANGED · admin down"}}],"rows":[["Loopback99","administratively down","warn"],["Gi0/0 · collector path","Up · intact","ok"],["Sample record","LINK · severity 5 · CHANGED"],["Exact messages","Platform-dependent","dim"]]}
```

## Step 8: Restore the test interface

```ios R2
R2# configure terminal
R2(config)# interface loopback99
R2(config-if)# no shutdown
R2(config-if)# end
R2# show ip interface brief
R2# show logging
```

:::expected
Loopback99 returns to up/up. On IOS the link message is `%LINK-3-UPDOWN` (severity 3) and the line-protocol message is `%LINEPROTO-5-UPDOWN` (severity 5): one event reported at two severities. Read the level from each record in the buffer and on LOG1, and confirm that Gi0/0 and the NTP association are unaffected.
:::

```state
{"status":"Loopback99 restored","tone":"ok","focus":["R2","LOG"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"R2","text":"Lo99 admin down","tone":"warn","until":0},{"node":"LOG","text":"SYSLOG On","tone":"ok"}],"flows":[{"event":["R2"],"wait":1.6,"tags":{"R2":"Lo99 no shutdown · up/up"}},{"path":["R2","SW","LOG"],"label":"Syslog record to 10.60.0.50","tags":{"R2":"Logs to buffer and 10.60.0.50","LOG":"New Lo99 record · read its level"}}],"rows":[["Loopback99","up/up","ok"],["New record","Buffer and collector · vs Step 7"],["Severity","Read it · not assumed level 3"],["NTP · collector path","Intact","ok"]]}
```

## Step 9: Apply severity thresholds to supplied evidence

This worksheet is required even if the simulator cannot configure every threshold. Consider these representative records and a remote threshold of `logging trap warnings`:

```output Event worksheet
%SYS-2-MALLOCFAIL: Memory allocation failed
%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down
%SEC_LOGIN-4-LOGIN_FAILED: Login failed
%LINEPROTO-5-UPDOWN: Line protocol on Interface Loopback99, changed state to up
%SYS-6-LOGGINGHOST_STARTSTOP: Logging to host started
```

List the records eligible for the remote destination. On an image supporting `logging trap warnings`, optionally configure it and inspect `show logging`, then restore `logging trap debugging`. Do not generate memory failures or login attacks to reproduce the worksheet.

:::solution
Levels 2, 3 and 4 pass that threshold; levels 5 and 6 do not. Eligibility is not proof of successful delivery. In an existing SSH session with monitor logging enabled, `terminal monitor` would subscribe that session to eligible live messages; it would not change the collector threshold. `logging synchronous` would affect input presentation, not collection. Restore the lab's debugging threshold after any optional configuration test.
:::

```state
{"status":"Threshold worksheet","focus":["R2"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"LOG","text":"SYSLOG On","tone":"ok"}],"rows":[["Worksheet threshold","logging trap warnings"],["Supplied records","Five · list the eligible ones"],["Lab threshold afterward","logging trap debugging"],["Do not generate","Memory failures or login attacks"]]}
```

## Step 10: Read an SNMP object with limited access

The selector below permits PC1's source address only. It is attached to a read-only community used exclusively in this isolated lab.

```ios R2
R2# configure terminal
R2(config)# access-list 10 permit host 10.60.0.60
R2(config)# snmp-server community LABREAD ro 10
R2(config)# snmp-server location Training rack
R2(config)# end
R2# show snmp
```

ACL 10 here only limits which source address may use the community, as the lesson explains. If Packet Tracer rejects the trailing `10` or the location command, enter `snmp-server community LABREAD ro` and continue.

On PC1, open Desktop → MIB Browser. Set the agent address to `10.60.0.2`, destination port `161`, read community `LABREAD`, and version v2c (some interfaces label this version 2). Leave write credentials unused. Use Get for scalar instance `1.3.6.1.2.1.1.5.0` (`sysName.0`), then `1.3.6.1.2.1.1.6.0` (`sysLocation.0`). If the tree interface supplies the instance automatically, select the corresponding system object. If only v1 Get is exposed, that read can demonstrate basic request/response; record the selected version and do not claim it demonstrates GetBulk or v3.

:::expected
The name query identifies R2; the location query returns `Training rack`. Compare `show snmp` before and after to see relevant request/response counter changes. Exact counters vary. If the MIB Browser or agent operation is unsupported, worksheet responses `sysName.0 = R2` and `sysLocation.0 = Training rack` demonstrate the object/instance relationship; mark this as interpretation practice. Read-only access does not authorize Set and the lab performs no write request.
:::

```state
{"status":"Read-only Get works","tone":"ok","focus":["PC","R2"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"R2","text":"SNMP ro LABREAD · ACL 10","tone":"ok"},{"node":"LOG","text":"SYSLOG On","tone":"ok"},{"node":"PC","text":"MIB Browser · LABREAD"}],"flows":[{"path":["PC","SW","R2"],"back":true,"label":"Get sysName.0 · port 161","tags":{"PC":"v2c · community LABREAD","R2":"LABREAD ro · ACL 10 permits .60"},"backTags":{"PC":"sysName.0 = R2"}},{"path":["PC","SW","R2"],"back":true,"label":"Get sysLocation.0 · port 161","backTags":{"PC":"sysLocation.0 = Training rack"}}],"rows":[["Agent","10.60.0.2 · port 161 · v2c"],["sysName.0","R2","ok"],["sysLocation.0","Training rack","ok"],["Write requests","None · read-only","dim"]]}
```

## Step 11: Observe a community mismatch

Change only PC1's read community to `WRONG-LAB` and repeat the same Get. Keep the target, object, port and version unchanged. Inspect R2's counters again where supported.

:::expected
With the wrong community the agent does not answer, and the browser usually shows a timeout. R2's unknown-community counter in `show snmp` may rise. You changed one thing, so the cause is known here. On a real network the same timeout could also come from the wrong version, the attached ACL, the path or a disabled agent.
:::

```state
{"status":"Community mismatch","tone":"bad","focus":["PC","R2"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"R2","text":"SNMP ro LABREAD · ACL 10","tone":"ok"},{"node":"LOG","text":"SYSLOG On","tone":"ok"},{"node":"PC","text":"Community WRONG-LAB","tone":"bad"}],"flows":[{"path":["PC","SW","R2"],"label":"Same Get · community WRONG-LAB","stop":"R2","stopText":"No value under WRONG-LAB"}],"rows":[["PC1 read community","WRONG-LAB","bad"],["Result","No value · may time out","bad"],["Bad-community counter","May rise"],["Changed","Community only"]]}
```

## Step 12: Restore the read query and interpret a rate

Set PC1's read community back to `LABREAD` and repeat the same object query. Then calculate the average rate from these supplied values for the same interface counter, assuming no reset or wrap:

```output Counter worksheet
At 12:00:00: ifInOctets for interface index 4 = 1,000,000,000
At 12:00:30: ifInOctets for interface index 4 = 1,037,500,000
Known interface speed = 100,000,000 bit/s
```

:::expected
The restored query returns the expected value. Record the agent, manager source, version, object instance and returned value so that the success can be compared with the controlled failure in Step 11.
:::

Calculate octet increase, bit increase, elapsed seconds, average bit rate and directional utilization before revealing the worksheet answer. Explain what a restart would do to the calculation.

:::solution
The difference is 37,500,000 octets, or 300,000,000 bits over 30 seconds: 10 Mbit/s and 10% of the stated line rate in that direction. It is an interval average, not a measured peak. A restart or counter wrap would invalidate simple subtraction without additional handling. These supplied samples are separate from your observed MIB Browser reads.
:::

```state
{"status":"Read restored","tone":"ok","focus":["PC","R2"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"R2","text":"SNMP ro LABREAD · ACL 10","tone":"ok"},{"node":"LOG","text":"SYSLOG On","tone":"ok"},{"node":"PC","text":"Community WRONG-LAB","tone":"bad","until":0},{"node":"PC","text":"MIB Browser · LABREAD","tone":"ok","from":0}],"flows":[{"path":["PC","SW","R2"],"wait":1.6,"back":true,"label":"Same Get · community LABREAD","tags":{"R2":"LABREAD ro · ACL 10 permits .60"},"backTags":{"PC":"Expected value returned"}}],"rows":[["PC1 read community","LABREAD","ok"],["Same query","Expected value returned","ok"],["Record","Agent, source, version, OID, value"],["Counter worksheet","Assume no reset or wrap"]]}
```

## Step 13: Verify the final state and save

```ios R2
R2# show ntp status
R2# show ip interface brief
R2# show logging
R2# show snmp
R2# copy running-config startup-config
```

Complete R2's destination-filename prompt with Enter and wait for the copy to finish. On R1 and SW1, individually save with `copy running-config startup-config` at the privileged EXEC prompt, finishing each filename prompt before moving to the next device. Save the project as `management-services-lab.pkt`. If any operation was completed as a worksheet, note that separately in your study notes.

:::expected
R2 uses `.1` as its NTP server, Loopback99 is restored, LOG1 is the collector, and PC1 can make the limited read query on supported images. The wrong NTP address and mismatched manager community are absent from the final procedure. No read-write SNMP community or Telnet service was required.
:::

Your submission should contain:

- **Time:** intended source, selected source, local/remote stratum and reach observations for baseline, wrong address and recovery. Distinguish a plausible clock from verified synchronization.
- **Events:** one new local record and its collector counterpart, or the explicitly supplied fallback. Identify component, severity, mnemonic, affected interface and clock limits. Attach the threshold worksheet separately.
- **Management data:** a successful read, the controlled mismatch, and a successful fresh read after repair. Include the separate counter worksheet and its continuity assumptions.

Do not mark an unsupported operation as observed merely because its supplied answer is correct.

```state
{"status":"Final state saved","tone":"ok","focus":["R1","R2","SW"],"chips":[{"node":"R1","text":"NTP master · stratum 8","tone":"accent"},{"node":"R1","text":"Saved","tone":"ok"},{"node":"R2","text":"NTP synced · stratum 9","tone":"ok"},{"node":"R2","text":"Syslog → .50 · debugging"},{"node":"R2","text":"SNMP ro LABREAD · ACL 10","tone":"ok"},{"node":"R2","text":"Saved · startup-config","tone":"ok"},{"node":"SW","text":"Saved","tone":"ok"},{"node":"LOG","text":"SYSLOG On","tone":"ok"},{"node":"PC","text":"MIB Browser · LABREAD"}],"rows":[["R2 NTP server","10.60.0.1","ok"],["Loopback99","Restored · up/up","ok"],["Collector","LOG1 · 10.60.0.50","ok"],["Saved","R1, R2, SW1 · management-services-lab.pkt","ok"]]}
```

## Troubleshooting

- Reach zero plus a working ping narrows the checks to NTP-specific service, source, authentication, path and convergence; it does not identify one cause.
- A stratum-16 upstream is not a usable synchronized source. Verify the intended reference rather than masking the problem with a local master.
- Missing remote logs require checking new event generation, thresholds, destination, transport and collector processing.
- A memory-buffer counter or configured logging host does not establish remote delivery.
- SNMP queries need matching address, version, community/security, authorization and object instance. Packet counters must be read with that context.

## Challenge

Investigate this separate branch using the supplied evidence. Do not paste its addresses into the earlier project. No packet loss percentage, clock accuracy or unique physical fault is supplied.

```output Authored branch incident
R5: Clock is unsynchronized, stratum 16.
R6: configured association to R5; peer st 16; reach 377; no selected source.
R6: Clock is unsynchronized, stratum 16.
R6: local buffer debugging; remote collector threshold warnings; no other sender filters.
R6 buffer: *09:00:20 %LINEPROTO-5-UPDOWN: Gi0/1 changed state to down
R6 buffer: *09:00:35 %LINEPROTO-5-UPDOWN: Gi0/1 changed state to up
Collector: receives new R6 severity-3 test events, but no level-5 events.
Manager's own clock: Gi0/1 ifOperStatus up at 09:00:00 and 09:01:00.
Continuous input-octet counter, verified same Gi0/1 instance, no reset/wrap:
  09:01:00 = 540,000,000; 09:01:20 = 570,000,000
Gi0/1 speed = 100,000,000 bit/s; manager has read-only access.
```

Produce an incident note that answers five questions:

1. Does reach 377 establish usable time from R5? Identify the first source-state check and the evidence required before declaring recovery.
2. What explains the missing level-5 records? The team now requires levels 0–6 at the collector; give the narrow threshold change and a fresh-event retest.
3. Do the two up polls disprove a brief transition? Can you place R6's unsynchronized timestamps precisely between the manager's polls?
4. Calculate average input bit rate and utilization for the continuous counter interval. State what those figures cannot establish.
5. Does read-only access permit changing the interface? Name evidence needed before attributing its transition to an administrator.

:::solution
R6 has recent NTP responses, but R5 advertises unusable stratum 16 and R6 has no selected synchronized source. Check R5's intended upstream reference and its actual NTP status/exchanges. Restore or select an approved usable reference, then verify both routers' selected association and local synchronization. Do not mask the missing source by declaring an unsourced clock authoritative.

Warnings admits 0–4 and excludes the recorded severity 5. To meet the stated requirement, use `logging trap informational` on R6 in global configuration, verify `show logging`, generate a harmless new eligible event and find that same event at the collector. The change does not replay old buffered records or guarantee UDP delivery.

Two up polls can miss a transition between observations. However, the unsynchronized router timestamps cannot establish exact placement on the manager's timeline. Preserve both source and receipt times and verify clock relationships before correlating devices. The records show a reported interface transition, not its cause.

The counter grew by 30,000,000 octets over 20 seconds: `30,000,000 × 8 ÷ 20 = 12,000,000 bit/s`, or 12 Mbit/s and 12% of the given rate in that direction. This is an average, not peak demand, packet loss or application goodput.

Read-only access does not permit Set. A nearby login or generic configuration event does not identify the interface command; attribution requires corroborating command/configuration evidence. Keep observed facts, possible causes and next tests separate in the incident note.
:::
