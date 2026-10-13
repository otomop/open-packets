---
id: ntp-syslog-snmp
number: 27
title: NTP, syslog and SNMP
subtitle: Synchronize clocks, interpret events, and read management data with the right context.
part: services
domain: aiops
minutes: { lesson: 75, lab: 80 }
summary: Configure NTP client and server roles, interpret syslog content and thresholds, and explain how SNMP polling, notifications and security support network operations.
objectives:
  v1: ["4.2", "4.4", "4.5"]
  v2: ["5.4", "5.6"]
prereqs: [ios-essentials, tcp-udp-ports, nat-pat]
sectionIds:
  Time, events and measurements: why-time-logs-and-counters-belong-together
  Understand NTP sources and stratum: ntp-stratum-and-the-time-hierarchy
  Configure and verify NTP: configuring-and-verifying-ntp-on-ios
  Read syslog messages: syslog-severity-facility-and-the-anatomy-of-a-message
  Select logging destinations and thresholds: where-messages-go-the-four-logging-destinations
  Understand SNMP operations and security: snmp-managers-agents-and-the-mib
sources:
  - { title: "Cisco: SNMP community source restriction and v3 protections", url: "https://www.cisco.com/c/en/us/support/docs/ip/simple-network-management-protocol-snmp/20370-snmpsecurity-20370.html" }
  - { title: "Cisco IOS XE 17: Network Time Protocol", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_bsm-time-calendar-set.html" }
  - { title: "Cisco: Verify NTP associations", url: "https://www.cisco.com/c/en/us/support/docs/technical-details/220303-verify-ntp-status-with-the-show-ntp-asso.html" }
  - { title: "Cisco: NTP command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/bsm/command/bsm-cr-book/bsm-cr-n1.html" }
  - { title: "Cisco Catalyst 9300, 17.12: System message logs", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/configuring_system_message_logs.html" }
  - { title: "Cisco: Secure SNMP", url: "https://www.cisco.com/c/en/us/support/docs/ip/simple-network-management-protocol-snmp/20370-snmpsecurity-20370.html" }
  - { title: "RFC 5905: NTPv4", url: "https://www.rfc-editor.org/rfc/rfc5905.html" }
  - { title: "RFC 9109: NTP client port randomization", url: "https://www.rfc-editor.org/rfc/rfc9109.html" }
  - { title: "RFC 5424: Syslog protocol", url: "https://www.rfc-editor.org/rfc/rfc5424.html" }
  - { title: "RFC 3416: SNMP operations", url: "https://www.rfc-editor.org/rfc/rfc3416.html" }
  - { title: "RFC 3417: SNMP transport mappings", url: "https://www.rfc-editor.org/rfc/rfc3417.html" }
  - { title: "RFC 3418: SNMP management information", url: "https://www.rfc-editor.org/rfc/rfc3418.html" }
---

A useful outage record needs a time reference, descriptions of events and measurements of device state. These services provide different evidence. Learn what each record means before using it to explain an outage: accurate arithmetic cannot rescue an unreliable timestamp, and a received notification does not establish the cause of the reported event.

## Time, events and measurements

:::facts
- **NTP** synchronizes time; its server service uses UDP 123. Cisco associations commonly use port 123 at both ends, but other client implementations can randomize their source port.
- **Syslog** reports events. Conventional UDP syslog uses destination port 514. Severity values run from 0, most severe, through 7, debugging.
- **SNMP** reads or changes exposed management objects and sends notifications. Common UDP destinations are 161 for agent requests and 162 for notification receivers.
- A working ping confirms that particular ICMP exchange. It does not establish NTP, syslog or SNMP service availability.
- Compare clocks and time zones before correlating records from different devices.
:::

Suppose a branch loses access at 09:15. The router's event log can show a neighbor transition, while interface counters show whether traffic or errors increased around that time. Without a shared clock reference, apparently simultaneous records may describe different moments. **NTP** provides that common time reference; it does not diagnose the outage.

**Syslog** supplies an event description, severity and source context. **SNMP** supplies selected management values, often sampled repeatedly to create trends. Polling and event notifications complement one another: a counter increase can survive between samples even when a short-lived interface state change is no longer visible.

The v1.1 blueprint requires configuring/verifying NTP client and server roles, explaining SNMP, and describing syslog facilities and severities. The v2.0 blueprint retains SNMP function and emphasizes interpreting syslog. NTP remains useful preparation for credible timestamps; detailed SNMP deployment and advanced NTP security configuration are additional context rather than separate required configuration objectives here.

## Understand NTP sources and stratum

NTP exchanges timestamps to estimate clock **offset** and network delay, then disciplines the local clock. It needs usable measurements, not just a configured server address. Initial synchronization and recovery take time; read the current association rather than requiring success after a fixed number of seconds.

**Stratum** describes position in the time-distribution hierarchy. In a conventional diagram, a directly attached reference clock is called stratum 0, a server using that reference is stratum 1, and a synchronized downstream device adds one. Ordinary synchronized network strata are 1–15; 16 indicates unsynchronized state. A packet's stratum-0 value has protocol meanings such as a control response and should not be mistaken for an ordinary preferred network server.

| Example | Reported stratum | Interpretation |
|---|---:|---|
| Server directly using the stated reference | 1 | First network time source in this hierarchy |
| R1 synchronized to that server | 2 | One NTP association further downstream |
| R2 synchronized to R1 | 3 | Another association downstream |
| Device without usable synchronization | 16 | Not a valid synchronized source for a client |

```diagram
{"type":"topology","title":"A synchronized NTP hierarchy","caption":"These are NTP associations, not counts of routers along the IP path. A device can receive time and serve downstream clients.","nodes":[{"id":"S","kind":"server","label":"Reference server","sub":"stratum 1","x":2,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"stratum 2","x":6,"y":3},{"id":"R2","kind":"router","label":"R2","sub":"stratum 3","x":10,"y":3}],"links":[{"from":"S","to":"R1","label":"NTP","accent":true},{"from":"R1","to":"R2","label":"NTP"}]}
```

Lower stratum is not proof of better accuracy, security or reachability. Source-selection checks can reject an unsuitable server despite a lower advertised number. Similarly, a manually adjusted clock can look correct without NTP synchronization. Read both the time source and synchronization state.

## Configure and verify NTP

Configure a client with the server's actual reachable address:

```ios R2
R2# configure terminal
R2(config)# ntp server 10.60.0.1
R2(config)# end
R2# show ntp status
R2# show ntp associations
R2# show clock detail
```

A synchronized router can provide time to permitted downstream clients; it does not need `ntp master` just to relay time learned from a valid source. Interface restrictions, NTP access policy, authentication and platform support can still limit which clients receive usable service.

For a deliberately isolated lab with no external time reference, configure a local master. The following date is an example for the exercise; set an appropriate lab time before using the router as the source.

```ios R1
R1# clock set 12:00:00 20 Sep 2026
R1# configure terminal
R1(config)# ntp master 8
R1(config)# end
R1# show ntp status
```

`ntp master 8` makes the local clock available at stratum 8; a client actually synchronized to it reports 9. The documented default without a number is also 8. This does not make the clock independently accurate. Do not use it as a routine repair for a lost authoritative source or assume it always loses selection to every external source. Repair and verify the intended source.

Representative output for the stated local-master lab:

```output R2 NTP verification (excerpts)
Clock is synchronized, stratum 9, reference is 10.60.0.1  ← local device's state

  address         ref clock       st   when   poll reach  delay  offset   disp
*~10.60.0.1       127.127.1.1      8     28     64   377  1.000   0.200   0.230
 * sys.peer, ~ configured
```

The association's `st` belongs to the remote server; the first line reports the local client's stratum. In this IOS-style output, `*` identifies the selected peer and `~` a configured association. Other symbols and legends vary; use the legend printed by the actual command. The local-clock reference value is descriptive information, not an address the client should ping.

The **reach register** is eight bits displayed in octal, or base eight. Octal `377` equals `3 × 64 + 7 × 8 + 7 = 255`, the eight-bit binary value `11111111`. `377` represents eight recent successful poll results; `0` represents no successful result retained in that window, or an initial association. It does not prove that the peer has never responded in its lifetime. Starting from zero, consecutive successes produce `1, 3, 7, 17, 37, 77, 177, 377` in octal. `poll` reports the current interval, so do not impose a universal 64-second schedule.

:::trap Reachability and synchronization are different
A nonzero reach value does not by itself establish selected synchronization or trustworthy time. A zero value with a successful ping warrants checking NTP service, the relevant UDP path, authentication, source restrictions and initial convergence. It does not prove an ACL is the cause.
:::

Optional features include selecting a stable loopback source, source authentication and updating a supported hardware calendar. Changing the source address also changes return-route and access-policy requirements. NTP authentication does not encrypt the time exchange or independently prove that the supplied clock is accurate; use the supported security method for the actual platform.

## Read syslog messages

An IOS-style message commonly contains a timestamp followed by `%FACILITY-SEVERITY-MNEMONIC: description`. A configured sequence number can precede it. Read the fields literally:

```output Representative IOS event
000045: Sep 20 12:07:41.123 UTC: %SYS-5-CONFIG_I: Configured from console by admin on vty0 (10.60.0.60)
```

`SYS` identifies the IOS component, `5` the severity, and `CONFIG_I` the event mnemonic. The description identifies the reported management session. It does not list every changed command or establish that this user caused a later interface event. The traditional words “from console” do not override the explicit VTY/session detail.

| Level | IOS keyword | Meaning |
|---|---|---|
| 0 | emergencies | System unusable |
| 1 | alerts | Immediate action required |
| 2 | critical | Critical condition |
| 3 | errors | Error condition |
| 4 | warnings | Warning condition |
| 5 | notifications | Normal but significant condition |
| 6 | informational | Informational message |
| 7 | debugging | Debug-level detail |

Lower numbers are more severe. Severity is part of the message definition, not an independent measurement of business impact. A level-5 line-protocol transition can still interrupt an important service. Read the interface, state and surrounding evidence.

A timestamp marked `*` on the relevant IOS display means the clock is not considered authoritative; it does not prove the device has never used NTP. A plausible date without an asterisk does not certify UTC accuracy. Check `show clock detail`, synchronization and timezone settings. `service timestamps log datetime msec` changes formatting; it does not synchronize time.

**Facility** also has a transport meaning. A syslog PRI value encodes a numeric facility and severity as `facility × 8 + severity`. For an example explicitly using `local7` (23), `<189>` represents severity 5: `189 − 23 × 8 = 5`. The IOS component `SYS` in the message is distinct from that transport facility. Cisco's referenced logging guide documents local7 as its default, but read the actual configuration. PRI arithmetic is useful interpretation practice, not a replacement for reading message content.

## Select logging destinations and thresholds

The common destinations below have independent settings. Defaults and supported persistence vary, so verify them with `show logging` instead of assuming all devices use the same buffer or severity.

| Destination | Typical controls | What to verify |
|---|---|---|
| Console | `logging console` | Enabled state and threshold |
| Remote terminal session | `logging monitor`; `terminal monitor` | Global threshold and this session's subscription |
| Memory buffer | `logging buffered`; `show logging` | Size, threshold, retained interval |
| Remote collector | `logging host`; `logging trap` | Destination, transport, threshold and actual reception |

A basic threshold includes its numeric level and every lower, more severe level. `logging trap warnings` permits 0–4 and excludes 5–7 for that destination, subject to other filters and delivery. It does not mean “only warnings.” The name `logging trap` concerns syslog forwarding; it is not the command that enables SNMP traps.

```ios R2
R2# configure terminal
R2(config)# service timestamps log datetime msec
R2(config)# service sequence-numbers
R2(config)# logging buffered 16384 informational
R2(config)# logging host 10.60.0.50
R2(config)# logging trap informational
R2(config)# logging monitor informational
R2(config)# end
R2# show logging
```

In an existing SSH session, `terminal monitor` requests eligible live messages for that session. `terminal no monitor` stops that display. `logging synchronous` controls how unsolicited messages interact with typed input; it does not enable collection. The lab uses console access and includes remote-session behavior as a worksheet, so no weaker management protocol is needed.

A memory buffer is finite and can overwrite old records. Ordinary buffered logs are lost on reload; some platforms support separately configured persistent logging. A remote collector can retain records independently of the router, but retention still depends on its storage and policy. UDP 514 has no transport acknowledgment. Other transports, including secured options, require compatible endpoints and explicit configuration; a configured logging host is not proof of delivery.

## Understand SNMP operations and security

An **SNMP manager** requests information from an **agent**. A **Management Information Base (MIB)** defines managed objects and their types; an **object identifier (OID)** identifies an object or instance in the hierarchy. The agent supplies the value. A scalar instance commonly ends in `.0`, while table instances use indexes. Do not assume interface index 3 always means physical port Gi0/3; correlate the interface's name and index.

| Operation | Purpose | Common UDP direction |
|---|---|---|
| Get | Read requested object instances | Manager to agent destination 161 |
| GetNext | Read the next instance lexicographically | Manager to agent destination 161 |
| GetBulk | Retrieve successive values efficiently | Manager to agent destination 161 |
| Set | Request a permitted change to writable objects | Manager to agent destination 161 |
| Response | Return values, status or an error | Back to the requester's source endpoint |
| Trap | Send a notification without protocol acknowledgment | Agent to receiver destination 162 |
| Inform | Send a notification that expects a Response | Sender to receiver destination 162 |

An inform can be retried according to configured limits; it is not retried forever or guaranteed to reach a human operator. Traps have no SNMP acknowledgment. Notification selection must be configured; an agent does not automatically report every possible event.

**SNMPv1 and v2c** use community strings without confidentiality. Read-only access permits supported reads; read-write access can also request supported writes, subject to views and object definitions. v2c supports GetBulk, Inform notifications and Counter64, which v1 does not. A captured community can be reused, so restrict access and prefer an appropriate secure management design.

For the common SNMPv3 user-based security model, **message authentication** checks the claimed sender and detects alteration of protected message content. **Privacy** encrypts the managed data so an observer cannot read it without the key. These are separate protections; distinguish the configured level:

| Level | Authentication | Privacy/encryption |
|---|---|---|
| noAuthNoPriv | No cryptographic message authentication | No |
| authNoPriv | Yes | No |
| authPriv | Yes | Yes |

SNMPv3 does not imply encryption unless privacy is configured. Algorithms and capabilities are platform-specific; do not treat older MD5/DES examples as current recommendations. Groups and views define permitted operations and object scope. A notification destination is separate from permission to query the agent.

The following is a read-only demonstration for the isolated lab. ACL 10 permits just the manager address; as a standard source ACL it uses the selector idea introduced in chapter 26. In `permit host 10.60.0.60`, `host` means exactly one source address. Other sources reach the list's implicit deny. In `snmp-server community LABREAD ro 10`, `ro` grants read-only access and the final `10` attaches that source list to this community. Merely creating the ACL would not restrict the community. Chapter 34 teaches full ACL policy.

```ios R2
R2# configure terminal
R2(config)# access-list 10 permit host 10.60.0.60
R2(config)# snmp-server community LABREAD ro 10
R2(config)# snmp-server location Training rack
R2(config)# end
R2# show snmp
```

Do not deploy this lab community on a shared network. A failed query can result from destination, service, version, community, authorization, object or path problems. A bad-community counter indicates rejected community use, not necessarily a password attack; an old monitoring configuration can cause the same symptom.

## Reading the output

Separate a recorded event from the proposed explanation. A `LINK` message can report a link transition without identifying the failed cable or person responsible. `administratively down` identifies an administrative state; nearby login records alone do not attribute the exact command. Interface events and their severities differ by image, including simulator behavior.

For SNMP rate calculations, compare the same counter instance at two known times. If octets rise from `1,000,000,000` to `1,037,500,000` over 30 seconds, the average is `37,500,000 × 8 / 30 = 10,000,000 bit/s`, or 10 Mbit/s. On a 100 Mbit/s interface that is 10% in the measured direction. This assumes no counter reset or wrap and does not give peak utilization or user goodput. Counter64 reduces wrap frequency; it does not eliminate resets or poor sampling.

For a missing record, verify generation, local policy, transport and receiver processing in that order. Compare new events after a change; a more permissive threshold does not automatically replay the old memory buffer. Correlate device-source timestamps with collector receipt times, and preserve relevant records before clearing anything.

## Exam focus

- Configure and verify NTP client/server roles for v1.1; distinguish local clock settings, server stratum, reach history and selected synchronization.
- Interpret syslog component, severity, mnemonic, timestamp and description without inventing a cause or actor.
- Apply severity thresholds correctly and distinguish component facility from transport facility.
- Separate console, session, buffer and collector behavior; verify reception rather than just a destination command.
- Explain SNMP manager/agent/MIB/OID, reads versus writes, polling versus notifications, and v3 security levels.
- Use counter differences with the sampling interval and check for resets or wrap before trusting a calculated rate.
