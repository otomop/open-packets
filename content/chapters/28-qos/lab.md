---
title: Trace a QoS policy and verify a marking
environment: mixed
devices: ["Core: paper policy worksheet", "Optional: 1 × Cisco 2911 router", "Optional: 2 × Catalyst 2960 switches", "Optional: 2 × PC-PT endpoints"]
minutes: 60
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The required outcome is to explain how a policy treats packets and which evidence would verify that treatment. Complete the paper exercises in Steps 1–4 and 11, then the independent challenge. Steps 5–10 and the device-save action in Step 12 are optional implementation support. They are supplied configuration, not a production policy-design requirement.

## Topology

```diagram
{"type":"topology","title":"Lab 28 — Optional marking experiment","caption":"PC-A and PC-B are on separate /24 subnets and use R1 at 10.28.1.1 and 10.28.2.1 as their gateways.","nodes":[{"id":"PCA","kind":"pc","label":"PC-A","sub":"10.28.1.10/24 · gw 10.28.1.1","x":1,"y":3},{"id":"SWA","kind":"switch","label":"SW-A","x":3,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"Gi0/0 10.28.1.1/24 · Gi0/1 10.28.2.1/24","x":6,"y":3},{"id":"SWB","kind":"switch","label":"SW-B","x":9,"y":3},{"id":"PCB","kind":"pc","label":"PC-B","sub":"10.28.2.10/24 · gw 10.28.2.1","x":11,"y":3}],"links":[{"from":"PCA","to":"SWA","fromLabel":"Fa0","toLabel":"Fa0/1"},{"from":"SWA","to":"R1","fromLabel":"Fa0/2","toLabel":"Gi0/0"},{"from":"R1","to":"SWB","fromLabel":"Gi0/1","toLabel":"Fa0/2"},{"from":"SWB","to":"PCB","fromLabel":"Fa0/1","toLabel":"Fa0"}]}
```

The core worksheet requires only a notebook and the supplied evidence. Optional implementation uses an isolated Packet Tracer project or a supporting IOS/IOS XE lab image. It does not measure real voice quality. The commands and outputs have been reviewed against Cisco documentation, but this lab has not been executed in Packet Tracer. Unsupported commands or absent counters are a simulator limitation; complete the paper path and record the limitation rather than inventing results.

For the optional experiment, create one ISR 2911 named R1, two 2960 switches named SW-A and SW-B, and two PC-PT endpoints. Use copper straight-through cables for every listed link. Default switch VLAN 1 is sufficient; neither switch needs an IP address or QoS commands.

| Connection | Address |
|---|---|
| PC-A Fa0 — SW-A Fa0/1 | PC-A 10.28.1.10/24, gateway 10.28.1.1 |
| SW-A Fa0/2 — R1 Gi0/0 | R1 10.28.1.1/24 |
| R1 Gi0/1 — SW-B Fa0/2 | R1 10.28.2.1/24 |
| SW-B Fa0/1 — PC-B Fa0 | PC-B 10.28.2.10/24, gateway 10.28.2.1 |

No DNS, Internet connection, server, static route or traffic generator is needed. In CML, use an authorized IOS image, an unmanaged switch node on each side and Linux endpoints with these addresses; translate interface names from `show ip interface brief`.

## Step 1 — Calculate the offered voice rate

Use these supplied assumptions: 160 payload bytes, 40 header bytes, one packet every 20 ms, in one direction. Calculate packets per second, bytes per second and bits per second. Then calculate the Layer 3 rate for two calls and compare it with a classic IOS congestion-time priority allowance of 128 kb/s. Treat the packetization values as exercise data, not codec details to memorize.

:::solution
One call sends 50 packets/s, 10,000 bytes/s and 80,000 bits/s. Two calls require 160 kb/s before Layer 2 overhead. A 128 kb/s priority allowance is smaller than their sustained Layer 3 rate. This calculation predicts pressure on a congestion-time priority policer; it does not predict an exact drop count because burst allowances and actual packet sizes matter.
:::

```state
{"status":"Paper: offered voice rate","cabled":false,"addressed":false,"rows":[["Per packet","160 payload + 40 header bytes"],["Interval","One packet every 20 ms · one way"],["Compare","Two calls with a 128 kb/s allowance"]]}
```

## Step 2 — Follow the classifier and marking

For this worksheet, a boundary policy classifies managed phone traffic as VOICE and writes EF. Other client traffic receives DSCP 0. A later router selects its priority class using DSCP EF. Trace these two packets: a managed phone initially marked 0, and an ordinary PC initially marked EF.

:::solution
After the boundary, the phone packet is EF and the PC packet is 0. At the later router, only the phone packet matches the EF class. Classification chose a category; marking changed the header; the later classification used that resulting header. Neither marking alone nor the category name creates a queue reservation.
:::

```state
{"status":"Paper: classify, then mark","cabled":false,"addressed":false,"rows":[["Boundary policy","Phone → VOICE, EF · others DSCP 0"],["Later router","Priority class matches DSCP EF"],["Packets to trace","Phone marked 0 · PC marked EF"]]}
```

## Step 3 — Distinguish the two rate actions

On paper, compare these policies for a 20 Mb/s service: A transmits conforming packets and drops excess packets; B queues packets until allowed to transmit. A burst arrives after each rate meter's token allowance has been used. State what happens immediately and what happens if the offered rate stays above 20 Mb/s indefinitely.

:::solution
A is policing and drops the excess described by its action. B is shaping and initially buffers traffic. Persistent overload eventually fills a finite shaping queue unless the sender slows; shaping can also drop. Neither policy lowers the Ethernet physical link speed.
:::

```state
{"status":"Paper: police vs shape","cabled":false,"addressed":false,"rows":[["Service","20 Mb/s"],["Policy A","Sends conforming · drops excess"],["Policy B","Queues until allowed to transmit"],["Burst","After the token allowance is used"]]}
```

## Step 4 — Read evidence before changing a policy

Study this representative worksheet excerpt. It is an authored example, not captured output.

```output R1# show policy-map interface GigabitEthernet0/1
Service-policy output: WAN-OUT
  Class-map: VOICE
    Match: dscp ef (46)
    Priority: 128 (kbps), burst bytes 3200
    b/w exceed drops: 400
  Class-map: DATA
    bandwidth 512 (kbps)
```

A second sample after a busy minute shows `b/w exceed drops: 900`. Explain the difference and whether DATA is capped at 512 kb/s.

:::solution
There were 500 additional priority bandwidth-exceed drops during the interval. In this classic IOS LLQ example, the configured priority allowance is limiting traffic under congestion. DATA's bandwidth command is a minimum share during congestion, not a 512 kb/s ceiling. Investigate actual classification and demand before increasing the priority rate. The displayed 3,200-byte burst allowance belongs to this example, not every platform.
:::

```state
{"status":"Paper: read the drop counter","cabled":false,"addressed":false,"rows":[["VOICE","priority 128 kb/s · dscp ef"],["b/w exceed drops","400, then 900 after a busy minute"],["DATA","bandwidth 512 kb/s"]]}
```

## Step 5 — Build and verify the optional IP baseline

Configure both PC addresses in Desktop → IP Configuration → Static using the topology table. Leave DNS blank. On a new R1, decline the initial setup dialog if presented, then enter:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# description SW-A_PC-A
R1(config-if)# ip address 10.28.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# description SW-B_PC-B
R1(config-if)# ip address 10.28.2.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
```

Wait for the switch ports to forward. From PC-A's command prompt, run:

```text
ping 10.28.1.1
ping 10.28.2.10
```

:::expected
Both router interfaces should be up/up. After initial ARP resolution, PC-A should receive replies from its gateway and PC-B. If not, repair addressing or cabling before adding QoS. Save the project as `qos-baseline.pkt`, then use Save As `qos-marking.pkt` for the experiment.
:::

```state
{"status":"IP baseline works","tone":"ok","cabled":true,"addressed":true,"led":true,"focus":["R1"],"flows":[{"path":["PCA","SWA","R1"],"back":true,"label":"ping 10.28.1.1","tags":{"PCA":"ping 10.28.1.1 · own gateway"}},{"path":["PCA","SWA","R1","SWB","PCB"],"back":true,"label":"ping 10.28.2.10","tags":{"PCA":"Off subnet → gateway 10.28.1.1","R1":"10.28.2.0/24 connected · Gi0/1"}}],"rows":[["R1 Gi0/0 and Gi0/1","up/up","ok"],["PC-A to 10.28.1.1","Replies","ok"],["PC-A to 10.28.2.10","Replies","ok"],["Project","qos-baseline.pkt, then qos-marking.pkt"]]}
```

## Step 6 — Create a simple marking policy

This isolated demonstration changes default-marked IP packets to AF21; it is not a production classification design. Check `class-map ?` and `match dscp ?` if the image rejects a command. Do not enable global `mls qos` on the switches.

```ios R1
R1# configure terminal
R1(config)# class-map match-all DEFAULT-IP
R1(config-cmap)# match dscp default
R1(config-cmap)# exit
R1(config)# policy-map MARK-IN
R1(config-pmap)# class DEFAULT-IP
R1(config-pmap-c)# set dscp af21
R1(config-pmap-c)# end
R1# show class-map
R1# show policy-map
```

:::expected
DEFAULT-IP matches DSCP 0. MARK-IN contains the AF21 marking action. The policy is defined but not attached, so this configuration alone does not change traffic. If MQC or packet marking is unsupported, use the worksheet interpretation for the remaining steps and record which function was unavailable.
:::

```state
{"status":"MARK-IN defined","focus":["R1"],"chips":[{"node":"R1","text":"MARK-IN · not attached"}],"rows":[["DEFAULT-IP","match dscp default · DSCP 0"],["MARK-IN","DEFAULT-IP → set dscp af21"],["Traffic","Unchanged until attached","dim"]]}
```

## Step 7 — Attach the policy where requests enter

PC-A's requests enter R1 on Gi0/0. Attach MARK-IN there in the input direction.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# service-policy input MARK-IN
R1(config-if)# end
R1# show policy-map interface gigabitethernet0/0
```

:::expected
The output identifies MARK-IN as an input policy on Gi0/0. Record current DEFAULT-IP counters before generating test traffic. A definition in `show policy-map` without an interface attachment is not enough.
:::

```state
{"status":"MARK-IN input on Gi0/0","focus":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"service-policy input MARK-IN"}}],"chips":[{"node":"R1","text":"MARK-IN · not attached","until":0}],"roles":[{"node":"R1","peer":"SWA","text":"input MARK-IN","tone":"ok","from":0}],"rows":[["Gi0/0","Input policy MARK-IN","ok"],["DEFAULT-IP counters","Recorded before testing"],["show policy-map alone","Not proof of attachment","dim"]]}
```

## Step 8 — Generate and inspect a known packet

Before sending a packet, draw its request and reply paths. Predict which packet crosses the input policy and whether observing replies in the wrong direction would prove the request was marked.

From PC-A, ping `10.28.2.10` again. Read R1's interface policy counters after the test. In Packet Tracer Simulation mode, filter for ICMP, create a simple PDU from PC-A to PC-B, and step through R1. Open the packet details and compare the incoming and outgoing IPv4 service fields if your version exposes them. On CML, capture the two lab links and inspect the same echo request in Wireshark; start capture before sending it and stop afterward.

:::expected
On an implementation that models the policy, default-marked requests should match the input class and leave toward PC-B with DSCP AF21, decimal 18. If ECN is 0, the entire eight-bit service field is `18 × 4 = 72`, hexadecimal `0x48`. Do not confuse that byte with DSCP 72. Counter increments support matching; packet fields support marking. Absent packet fields or counters mean that observation is unavailable, not that you measured success. Echo replies enter the opposite interface and are not covered by this input policy.
:::

```state
{"status":"Request leaves as AF21","tone":"ok","focus":["R1"],"flows":[{"path":["PCA","SWA","R1","SWB","PCB"],"back":true,"label":"PC-A pings 10.28.2.10","tags":{"R1":"In Gi0/0 · DSCP 0 → AF21 (18)"},"backTags":{"R1":"Reply in Gi0/1 · no MARK-IN"}}],"roles":[{"node":"R1","peer":"SWA","text":"input MARK-IN","tone":"ok"}],"rows":[["Request toward PC-B","AF21 · decimal 18 where modeled","ok"],["Service byte, ECN 0","72 · 0x48, not DSCP 72"],["Echo reply","Enters Gi0/1 · not covered"],["Counters · packet fields","Support matching · marking"]]}
```

## Step 9 — Introduce a direction fault

Remove the correct attachment and attach the same policy to Gi0/1 in the input direction.

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0
R1(config-if)# no service-policy input MARK-IN
R1(config-if)# exit
R1(config)# interface gigabitethernet0/1
R1(config-if)# service-policy input MARK-IN
R1(config-if)# end
R1# show policy-map interface
```

Repeat the same PC-A-to-PC-B echo test and inspect the request, not just a total policy counter.

:::expected
The request enters Gi0/0, so it no longer encounters MARK-IN and should retain its original DSCP. Replies may now match on Gi0/1. Nonzero counters on the wrong interface therefore do not prove the intended direction works. Connectivity itself should remain available because this policy marks rather than drops.
:::

```state
{"status":"MARK-IN on Gi0/1 input","tone":"bad","focus":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"MARK-IN moved to Gi0/1 input"}},{"path":["PCA","SWA","R1","SWB","PCB"],"back":true,"label":"PC-A pings 10.28.2.10","tags":{"R1":"In Gi0/0 · no MARK-IN · DSCP kept"},"backTags":{"R1":"Reply in Gi0/1 · may match"}}],"roles":[{"node":"R1","peer":"SWA","text":"input MARK-IN","tone":"ok","until":0},{"node":"R1","peer":"SWB","text":"input MARK-IN","tone":"bad","from":0}],"rows":[["Request","Keeps its original DSCP","bad"],["Replies","May match on Gi0/1"],["Gi0/1 counters","Do not prove the intended direction"],["Connectivity","Still works · marks, not drops","ok"]]}
```

## Step 10 — Restore the intended direction

Only after recording Step 9's observation, restore the attachments:

```ios R1
R1# configure terminal
R1(config)# interface gigabitethernet0/1
R1(config-if)# no service-policy input MARK-IN
R1(config-if)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# service-policy input MARK-IN
R1(config-if)# end
R1# show policy-map interface
```

Repeat the request inspection.

:::expected
MARK-IN is input on Gi0/0 only. Requests again receive AF21 where the platform supports the function. The repair addresses attachment and direction, not the rate or DSCP value.
:::

```state
{"status":"Gi0/0 input restored","tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.2,"tags":{"R1":"MARK-IN back on Gi0/0 input"}},{"path":["PCA","SWA","R1","SWB","PCB"],"back":true,"label":"Repeat the request","tags":{"R1":"In Gi0/0 · DSCP 0 → AF21 (18)"},"backTags":{"R1":"Reply in Gi0/1 · no MARK-IN"}}],"roles":[{"node":"R1","peer":"SWB","text":"input MARK-IN","tone":"bad","until":0},{"node":"R1","peer":"SWA","text":"input MARK-IN","tone":"ok","from":0}],"rows":[["MARK-IN","Input on Gi0/0 only","ok"],["Requests","AF21 again where supported","ok"],["Repair","Attachment and direction only"]]}
```

## Step 11 — Predict a congestion-avoidance result

Given two traffic aggregates in the **same AF class**, one marked AF11 and one AF13, the downstream router is explicitly configured to give AF13 a higher WRED drop probability at the current average queue depth. Predict the relative treatment over many packets. Then state whether that determines which particular packet is dropped next.

:::solution
AF13 has greater discard probability under the stated policy. It does not mean every AF13 packet must disappear before any AF11 packet is dropped, and it says nothing about the scheduler's next packet without a scheduling policy. Probability and transmission priority answer different questions.
:::

```state
{"status":"Paper: WRED prediction","roles":[{"node":"R1","peer":"SWA","text":"input MARK-IN","tone":"ok"}],"rows":[["Same AF class","One aggregate AF11 · one AF13"],["Downstream WRED","AF13 higher drop probability"],["Predict","Treatment over many packets"]]}
```

## Step 12 — Save the evidence and finish cleanly

Record whether you used the worksheet, Packet Tracer or a specific IOS image, plus the actual supported observations. The paper submission must include the offered-rate calculation, two packet paths through classification/marking, a policing-versus-shaping comparison, the drop-counter delta and the probability/scheduling distinction. State the evidence that would verify each conclusion.

If you performed the optional device experiment, add a three-state table for correct attachment, wrong-direction attachment and recovery. Record ingress/egress interface, request DSCP, relevant counter changes and an actual packet observation when available. Save that project as `qos-complete.pkt`. In an actual isolated router lab, save the intended configuration separately:

```ios R1
R1# copy running-config startup-config
```

Accept the displayed destination filename with Enter before issuing another command.

:::expected
Your notes distinguish predicted behavior, representative examples and observations you actually made. The final experiment has only the Gi0/0 input attachment; the original baseline project remains available.
:::

```state
{"status":"Evidence recorded","tone":"ok","focus":["R1"],"roles":[{"node":"R1","peer":"SWA","text":"input MARK-IN","tone":"ok"}],"rows":[["Final attachment","Gi0/0 input only","ok"],["Experiment saved","qos-complete.pkt"],["Baseline project","Still available"],["IOS router lab","copy running-config startup-config"]]}
```

## Troubleshooting

- No ping baseline: check each PC's mask and gateway, both router interface states and switch forwarding. QoS cannot repair an incorrect IP path.
- No matches: inspect the actual ingress interface, direction and incoming DSCP. ICMP requests and replies are different packets.
- Matches but no visible marking: confirm the action and inspect the egress header; document simulator limitations if it does not expose or implement the field.
- Low average interface utilization with drops: identify whether the counter belongs to a policer or a queue, and consider bursts or a slower downstream service.
- A command rejected by a simulator: use context help and the referenced platform guide. Do not substitute an unrelated hardware command merely to produce accepted syntax.

## Challenge

Evaluate a new branch policy on paper. This does not require adding devices to the optional experiment.

| Supplied condition | Requirement or observation |
|---|---|
| Physical handoff / provider service | 100 Mb/s physical; 12 Mb/s contracted service |
| Provider evidence | Policer drops coincide with short 18 Mb/s bursts; long-term local average is 7 Mb/s |
| Managed-phone stream | Same packets are EF before a boundary switch and DSCP 0 after it |
| Approved treatment | Preserve verified phone marking; ordinary PCs may not grant themselves preferred service |
| Data application | Short buffering delay is acceptable; indefinite overload is not |

1. Name two independent problems and the evidence that distinguishes them.
2. Describe a marking/trust correction and a rate treatment that meet the requirements without granting preferred service to every PC.
3. Compare these candidate actions on a short burst after token allowance is exhausted: drop excess, remark-and-transmit excess, or queue excess. State which addresses smoothing and what sustained demand above 12 Mb/s would cause.
4. Specify a service-level retest for both corrections. Explain why a successful ping or a larger queue alone is insufficient.

:::solution
Matched packet observations show that the boundary changes the phone's mark. Provider policer evidence shows a separate mismatch between offered bursts and the contracted allowance; the physical link's low average utilization does not rule that out. Neither observation proves that one fix will solve the other.

Apply the approved classification/trust policy at the boundary so verified phone packets retain the intended mark and ordinary client self-marking is validated or replaced. Do not blanket-trust all PCs or mark all uplink traffic EF. Confirm the same packets' fields on both sides and their assignment to the intended downstream class.

A shaper can queue a short excess burst and regulate departure timing to a rate and burst profile compatible with the provider, including its overhead accounting. A drop policer loses excess packets; remark-and-transmit changes their label but does not smooth departure. Shaping does not change physical speed. Sustained demand above the service capacity eventually requires source backoff, reduced demand, more capacity or drops from a finite queue.

Retest under comparable load: record classification/marking, local queue and policer deltas, provider drops, and the phone stream's actual delay, variation and loss. Compare before and after over a stated interval. Ping verifies one ICMP exchange; a larger queue changes storage and can add delay. Neither proves correct marking, service-rate compatibility or satisfactory application behavior.
:::
