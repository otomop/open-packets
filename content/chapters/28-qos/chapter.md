---
id: qos
number: 28
title: QoS
subtitle: How a device identifies traffic, allocates a busy link, and enforces a rate.
part: services
domain: none
minutes: { lesson: 65, lab: 60 }
summary: Explain classification, marking, queuing, congestion avoidance, policing and shaping, then trace their effects using packet fields, counters and a small optional marking experiment.
objectives:
  v1: ["4.7"]
  v2: []
prereqs: [tcp-udp-ports, ios-essentials, trunks-dtp]
sectionIds:
  "Why a busy link needs a policy": why-a-busy-link-needs-a-policy
  "Classification: identify the traffic": classification-deciding-what-a-packet-is
  "Marking: CoS, IP precedence and DSCP": marking-cos-ip-precedence-and-dscp
  "The trust boundary": the-trust-boundary
  "Queuing: decide what goes next": queuing-who-goes-next
  "Congestion avoidance: act before the queue fills": congestion-avoidance-dropping-on-purpose
  "Policing and shaping: enforce a rate": policing-and-shaping-enforcing-a-rate
  "Verify the behavior, not just the configuration": verify-and-troubleshoot
  "Exam focus": exam-focus
sources:
  - { title: "RFC 3550: RTP sequence numbers and timestamps", url: "https://www.rfc-editor.org/rfc/rfc3550.html" }
  - { title: "Cisco: 200-301 CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "RFC 2474: Differentiated Services field", url: "https://www.rfc-editor.org/rfc/rfc2474" }
  - { title: "RFC 2597: Assured Forwarding", url: "https://www.rfc-editor.org/rfc/rfc2597" }
  - { title: "RFC 3246: Expedited Forwarding", url: "https://www.rfc-editor.org/rfc/rfc3246" }
  - { title: "RFC 3168: Explicit Congestion Notification", url: "https://www.rfc-editor.org/rfc/rfc3168" }
  - { title: "RFC 4594: DiffServ service class guidelines", url: "https://www.rfc-editor.org/rfc/rfc4594" }
  - { title: "Cisco: Policing and shaping comparison", url: "https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-policing/19645-policevsshape.html" }
  - { title: "Cisco: Bandwidth and priority commands", url: "https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-packet-marking/10100-priorityvsbw.html" }
  - { title: "Cisco: Applying QoS with MQC", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/quality-of-service/quality-of-service/m_qos-apply.html" }
  - { title: "Cisco: DSCP classification and marking", url: "https://www.cisco.com/c/en/us/support/docs/quality-of-service-qos/qos-packet-marking/10103-dscpvalues.html" }
  - { title: "Cisco: Catalyst 2960 QoS, IOS 15.2(1)E", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_1_e/configuration/guide/2960_scg/swqos.html" }
  - { title: "Cisco: Branch voice quality planning", url: "https://www.cisco.com/c/en/us/td/docs/solutions/Enterprise/Branch/BRBranch/BRBranch/BRB_CH2.html" }
---

A branch has a fast LAN but a slower connection to its headquarters. During a backup, users hear gaps in telephone calls. The router may have working routes and error-free interfaces: the problem is that more traffic wants the output link than the link can carry at that moment.

**Quality of Service (QoS)** controls how competing traffic uses limited resources. It can identify traffic, change a marking, choose what waits, and decide what to discard. A **per-hop behavior (PHB)** is the forwarding treatment a device gives a traffic aggregate at one hop. Good treatment at one router does not guarantee the same treatment throughout a path.

## Why a busy link needs a policy

Start with the application's needs. A copied file must arrive intact, but finishing a little later may be acceptable. An interactive conversation needs samples in time for playback. A late voice packet may no longer be useful, even though the network eventually delivered it. Reliable transports can recover missing file data, but recovery still costs time and capacity.

:::facts
- **Bandwidth:** link capacity; **throughput:** the rate actually achieved.
- **Delay:** elapsed delivery time; specify one-way delay or round-trip time.
- **Jitter:** variation in packet delay.
- **Loss:** packets not delivered, including packets discarded by a queue or policy.
- QoS redistributes available service. It does not increase a circuit's physical capacity.
:::

Delay includes processing, waiting in queues, serialization onto a link, and propagation across the medium. Serialization is packet size in bits divided by bit rate. Ignoring framing overhead, 1,500 bytes take 12 ms at 1 Mb/s: `1,500 × 8 ÷ 1,000,000` seconds. A small voice packet arriving behind that transmission must wait for the transmission already in progress on ordinary, non-preemptive Ethernet. Priority scheduling can choose the next packet; it cannot recover time already spent.

A **codec** encodes and decodes media; G.711 is a voice codec used in the following example. **RTP (Real-time Transport Protocol)** commonly carries media over UDP and adds sequence numbers and timestamps. It does not itself guarantee timely delivery. You need those roles to understand the overhead, not the codec's internal mathematics.

A useful voice calculation separates payload from overhead. Assume G.711 sends 160 payload bytes every 20 ms, with 20-byte IPv4, 8-byte UDP and 12-byte RTP headers. That is 200 bytes, 50 times a second, or **80,000 bits/s per direction at Layer 3**. Ethernet framing, other encapsulation and different packetization change the required link rate. Do not reserve capacity using the codec's 64 kb/s payload rate alone.

Cisco branch design guidance uses about 150 ms one-way delay, 30 ms jitter and 1% loss as voice planning limits. These are engineering guidelines, not promises that every application fails at precisely one threshold. Interactive video also needs timely delivery, while buffered streaming has different tolerance. Identify the application and its service requirements before assigning priority.

## Classification: identify the traffic

**Classification** places a packet into a category according to configured criteria. A router might examine source and destination addresses, transport protocol, TCP/UDP ports, an existing DSCP value or a supported application signature. Classification itself does not change the packet or reserve bandwidth.

Suppose a branch policy identifies traffic from managed phones separately from ordinary client traffic. A packet from the phone subnet and a packet merely marked EF by an untrusted PC should not automatically receive identical treatment. Addresses and ports are useful evidence, but neither proves a user's identity or an application's legitimacy.

Cisco's Modular QoS CLI, **MQC**, separates three tasks:

| Object | Question it answers | Example |
|---|---|---|
| Class map | Which packets belong together? | Packets marked DSCP EF |
| Policy map | What action applies to that class? | Mark, police or assign queue service |
| Service policy | Where and in which direction does the policy run? | Input on the LAN interface |

A `match-all` class requires every configured criterion; `match-any` accepts any one. If a rule requires “source is in the phone subnet AND DSCP is EF,” an EF-marked packet from another subnet fails that rule. Replacing AND with OR would accept it. Do not confuse this logic with the order of access-list entries.

Application recognition, often called **NBAR** on Cisco platforms, can classify supported applications beyond simple port matching. Its capabilities depend on the image, signatures and visibility into traffic. Encryption or tunneling can limit what the classifier can observe. Signature counts and deep inspection configuration are outside the required CCNA QoS explanation.

## Marking: CoS, IP precedence and DSCP

**Marking** writes a value that another policy can use. Think separately about the header carrying it and the behavior selected from it.

| Marking | Location | Size and range |
|---|---|---|
| CoS / priority code point (PCP) | IEEE 802.1Q tag | 3 bits, 0–7 |
| IP precedence | Older interpretation of the high-order IP service bits | 3 bits, 0–7 |
| DSCP | IPv4 DS field or IPv6 Traffic Class | 6 bits, 0–63 |

An untagged Ethernet frame has no 802.1Q PCP field. It can still contain an IP packet with DSCP, and a switch can assign an internal traffic class. CoS and DSCP are not the same field: converting between them uses policy or a mapping table. Rebuilding a Layer 2 header during routing does not inherently remove the IP marking, although a configured router may remark it.

The remaining two bits of the eight-bit IP service field are used for **ECN**, Explicit Congestion Notification. Thus DSCP is six bits, not the entire eight-bit field.

Recognize these common codepoints:

| Name | Decimal DSCP | Meaning to interpret |
|---|---:|---|
| Default / CS0 | 0 | Common best-effort marking |
| EF | 46 | Recommended marking for Expedited Forwarding |
| AF11 / AF12 / AF13 | 10 / 12 / 14 | AF class 1, increasing drop precedence |
| AF21 / AF22 / AF23 | 18 / 20 / 22 | AF class 2, increasing drop precedence |
| AF31 / AF32 / AF33 | 26 / 28 / 30 | AF class 3, increasing drop precedence |
| AF41 / AF42 / AF43 | 34 / 36 / 38 | AF class 4, increasing drop precedence |
| CSn | 8 × n | Class-selector codepoint; for example CS3 = 24 |

For AFxy, calculate `8x + 2y`. AF32 is `24 + 4 = 28`. Within an AF class, higher drop precedence makes a packet more eligible for discard when congestion requires it. AF13 does not mean “higher priority than AF11,” and AF4 does not universally receive more bandwidth than AF2. Queue resources and mappings still need configuration.

EF is commonly used for voice media. Application-to-marking recommendations are design choices: RFC 4594 uses CS5 for signaling, while some Cisco enterprise designs use CS3. Read the stated policy instead of assuming that one application's DSCP is mandatory everywhere.

:::trap A larger DSCP number is not a universal priority ranking
DSCP identifies a behavior aggregate. A receiver can map several codepoints to one queue, remark them at a boundary, or apply a different local policy. A packet marked EF has no automatic reservation across the Internet.
:::

## The trust boundary

A **trust boundary** is the point where the network decides whether to accept incoming markings as policy input. A managed phone may mark its own voice correctly. An ordinary PC can also set EF, so blindly trusting all endpoint markings allows unwanted traffic into preferred service.

Place classification and validation where reliable information is available. For a managed phone with a PC connected through it, the design must specify what the phone does to the PC's markings and what the switch accepts. “A phone is present” alone is insufficient evidence of a secure policy. Rate controls may still be needed for otherwise legitimate preferred traffic.

A useful troubleshooting example comes from older Catalyst 2960 IOS software. With QoS disabled and other relevant settings at defaults, markings pass unchanged. Enabling `mls qos` with the remaining defaults classifies traffic as best effort and can rewrite DSCP to zero on untrusted ports. That is a **platform-specific example**, not a command to apply to every Cisco switch.

Similarly, a legacy default CoS-to-DSCP map of `0 8 16 24 32 40 48 56` maps CoS 5 to DSCP 40, not EF 46. The map's position starts at CoS 0. If preserving received IP DSCP is the design, trusting CoS with that map does something different. Inspect the actual platform's trust and mapping configuration.

## Queuing: decide what goes next

**Queuing** holds packets that cannot immediately transmit. A scheduler selects packets from those queues. Queue size and service order are separate decisions: adding buffer space can reduce short-burst drops but also allow more waiting time.

A single FIFO queue serves packets in arrival order. Multiple classes permit differentiated service. **Class-based weighted fair queuing (CBWFQ)** can give classes minimum bandwidth under congestion while allowing them to use available excess capacity. A configured minimum is not necessarily a maximum.

**Low Latency Queuing (LLQ)** adds priority service for selected traffic. In the classic IOS `priority 128` example, the number is kilobits per second. During congestion, a built-in policer limits that priority class according to its configured rate and burst allowance, protecting other classes. The exact priority implementations available on newer hardware vary, so do not assume every priority queue has identical policing behavior.

Compare `bandwidth 512` with `priority 128` in a supporting IOS policy. The first supplies a minimum share for the class during congestion; it does not cap it at 512 kb/s. The second adds priority scheduling with the classic congestion-time limit. Neither makes unused capacity unavailable to other traffic. Both need a feasible policy for the link.

```diagram
{"type":"sequence","title":"One output link, several traffic classes","actors":["Packets arriving","Classifier / queues","Output link"],"steps":[{"from":0,"to":1,"label":"Voice and file packets arrive","note":"Classify using the local policy"},{"from":1,"to":2,"label":"Finish the transmission already in progress"},{"from":1,"to":2,"label":"Select eligible priority traffic","note":"Within the configured priority allowance"},{"from":1,"to":2,"label":"Serve the other classes","note":"According to their scheduler and available capacity"}],"caption":"A conceptual scheduling example, not a fixed hardware pipeline or measured timeline."}
```

## Congestion avoidance: act before the queue fills

**Tail drop** discards an arriving packet when its queue has no room. If many TCP flows lose packets together, their congestion controls may reduce sending together, then increase together. This coordinated response can produce oscillating utilization. It is a possible consequence, not a guaranteed pattern for every TCP version.

**Random Early Detection (RED)** starts probabilistic action before a queue reaches its full limit, based on average queue depth. **WRED** can give different markings different thresholds or drop probabilities. This may spread congestion signals across flows instead of waiting for one large tail-drop event.

WRED does not determine which queue transmits next; that is scheduling. Nor does it guarantee loss-free service. Where supported and configured, ECN can mark congestion for capable transports rather than dropping selected packets. Persistent overload can still cause drops. Some applications carried over UDP implement congestion control, but a generic nonresponsive UDP stream will not necessarily slow down when packets disappear. The configured traffic policy must account for the actual application.

## Policing and shaping: enforce a rate

A **policer** measures traffic against a rate and burst allowance, then applies an action. Conforming traffic might transmit; excess traffic might be dropped or remarked and transmitted. A policer does not hold excess traffic in a queue to wait for permission to send.

A **shaper** delays traffic in a queue to regulate its departure rate. It still sends individual frames at the physical link rate, with waiting between transmissions as needed. Shaping therefore adds delay; it does not change a 1 Gb/s Ethernet interface into a 20 Mb/s physical interface.

| Question | Policing | Shaping |
|---|---|---|
| What happens to excess traffic? | Configured action, often drop or remark | Waits in a buffer, subject to limits |
| Can bursts be permitted? | Yes, according to rate/burst accounting | Yes, according to rate/burst accounting |
| Does it add a waiting queue for excess traffic? | No | Yes |
| Can it discard packets? | Yes, if the action says so | Yes, if its buffer fills |

Consider a 1 Gb/s handoff with a provider contract of 20 Mb/s. The interface may look lightly utilized while short bursts exceed the provider's allowance. An outbound shaper can regulate those bursts before they reach the provider. However, a shaper set above the contract, or using unsuitable burst/overhead accounting, can still exceed the provider's policer. If sustained offered traffic exceeds 20 Mb/s, some combination of waiting, application backoff or loss is unavoidable.

Both mechanisms commonly use token-bucket accounting. The tokens represent permission to transmit an amount of traffic; accumulated tokens permit a burst. Policing and shaping therefore have state. Do not describe a policer as having “no memory,” and do not memorize one burst interval as a universal default.

## Verify the behavior, not just the configuration

Begin with the path and direction. PC-to-server requests and server-to-PC replies enter different interfaces. An input policy on a LAN interface sees traffic entering from that LAN, not download traffic leaving toward it.

On supporting IOS images, read `show class-map`, `show policy-map` and `show policy-map interface`. Identify the attached policy, class criteria, matched packet counters, actions and queue or policer drops. Compare counter changes across a known test interval. A cumulative nonzero counter might come from earlier traffic.

Representative output excerpt, not a simulator capture:

```output R1# show policy-map interface GigabitEthernet0/0
GigabitEthernet0/0
  Service-policy input: MARK-IN          ← direction matters
    Class-map: DEFAULT-IP (match-all)
      12 packets, 1200 bytes             ← matched traffic, not a latency measurement
      Match: dscp default (0)
      QoS Set
        dscp af21                        ← configured action; inspect packets to verify the mark
```

A matching counter supports classification; an observed egress IP header supports marking. Queue drop counters support congestion-related loss at that queue; policer drop counters identify a different action. No drops in a short quiet test prove little about the busy period that users reported.

When a policy has zero matches, check attachment, direction and real packet fields before changing its rate. When a shaper queues heavily, compare sustained demand with the configured rate. When voice remains poor, inspect downstream treatment and endpoint behavior as well as the local router.

## Exam focus

Explain the purpose and interaction of classification, marking, queuing, congestion avoidance, policing and shaping. Work out a simple AF codepoint, distinguish DSCP from CoS, and predict how a trust or rate policy changes traffic.

The v1.1 objective asks for an explanation of forwarding PHBs. The optional configuration makes those concepts concrete; detailed hardware queue tuning is not required here. QoS is not separately listed in the announced v2.0 blueprint. Packet Tracer can illustrate selected features, but neither its command availability nor its timing should be treated as proof of production QoS performance.
