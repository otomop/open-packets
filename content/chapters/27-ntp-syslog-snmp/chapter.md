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

A branch loses its WAN link at 09:15 and recovers a minute later. Afterwards you are asked what happened. The router's log holds a link-down message, but its clock says 1 March 1993. The monitoring system shows the interface up at 09:15 and up again at 09:16. Every record is true, and none can be placed against the others, so you cannot say what happened first.

Three management services solve this. NTP gives every device the same clock. Syslog records events as they happen, each with a severity. SNMP lets a monitoring station read counters and state from a device and receive alerts from it. Building on the device access from Chapter 8 and the UDP ports from Chapter 6, you will configure NTP in client and server roles, read any syslog message and predict where it is sent, and explain what SNMP's versions and messages do.

## Time, events and measurements

:::facts
- **NTP** synchronizes time; its server service uses UDP 123. Cisco associations commonly use port 123 at both ends, but other client implementations can randomize their source port.
- **Syslog** reports events. Conventional UDP syslog uses destination port 514. Severity values run from 0, most severe, through 7, debugging.
- **SNMP** reads or changes exposed management objects and sends notifications. Common UDP destinations are 161 for agent requests and 162 for notification receivers.
- A working ping confirms that particular ICMP exchange. It does not establish NTP, syslog or SNMP service availability.
- Compare clocks and time zones before correlating records from different devices.
:::

Take the 09:15 outage again. **NTP**, the Network Time Protocol, keeps device clocks in step, so that a timestamp on one device means the same moment on another. It explains nothing by itself, but without it the other two services cannot be compared.

**Syslog** is the device's own account of events: an interface changed state, a neighbor went down, someone changed the configuration. **SNMP**, the Simple Network Management Protocol, works the other way round: a management station asks the device for values such as interface counters, usually every few minutes, and builds trends from them. The two complement each other. A poll every minute can miss a link that dropped for 15 seconds, and the syslog message catches it. The log message does not say how much traffic the link was carrying, and the counters do.

For the v1.1 exam you configure and verify NTP in client and server mode, explain SNMP, and describe syslog facilities and severity levels. The v2.0 exam keeps SNMP and asks you to interpret syslog messages.

## Understand NTP sources and stratum

An NTP client sends its server a small UDP packet stamped with the client's time, and the server returns it with its own timestamps added. From those times the client works out its **offset** from the server and the delay on the path, then adjusts its clock gradually. It repeats this at every poll interval and needs several good exchanges before it declares itself synchronized, so a new association takes a few minutes to settle.

**Stratum** says how many NTP steps a device is from a reference clock. The reference itself, such as an atomic clock or GPS receiver, is stratum 0 and is not on the network. A server attached directly to it is stratum 1. Every device that synchronizes to a server reports that server's stratum plus one. Usable values run from 1 to 15, and 16 means unsynchronized.

| Example | Reported stratum | Interpretation |
|---|---:|---|
| Server directly using the stated reference | 1 | First network time source in this hierarchy |
| R1 synchronized to that server | 2 | One NTP association further downstream |
| R2 synchronized to R1 | 3 | Another association downstream |
| Device without usable synchronization | 16 | Not a valid synchronized source for a client |

```diagram
{"type":"topology","title":"A synchronized NTP hierarchy","caption":"These are NTP associations, not counts of routers along the IP path. A device can receive time and serve downstream clients.","nodes":[{"id":"S","kind":"server","label":"Reference server","sub":"stratum 1","x":2,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"stratum 2","x":6,"y":3},{"id":"R2","kind":"router","label":"R2","sub":"stratum 3","x":10,"y":3}],"links":[{"from":"S","to":"R1","label":"NTP","accent":true},{"from":"R1","to":"R2","label":"NTP"}]}
```

Stratum counts NTP associations, not routers on the path: a client ten router hops from a stratum 1 server is still stratum 2. When a client has several servers configured, it prefers the lowest stratum among those it judges trustworthy. A clock set by hand can also show the right time without being synchronized to anything, so read the synchronization state and the selected source instead of judging by the displayed time.

## Configure and verify NTP

`ntp server` makes a router an NTP client of the address you name:

```ios R2
R2# configure terminal
R2(config)# ntp server 10.60.0.1
R2(config)# end
R2# show ntp status
R2# show ntp associations
R2# show clock detail
```

That one command also covers the server role. An IOS device that is synchronized answers NTP requests from other devices automatically, so R2 becomes a server for anything that points `ntp server` at it. This is what the objective means by client and server mode: the same router is a client of its upstream source and a server to the devices downstream.

`ntp master` is for the top of the hierarchy when no external source exists, as in an isolated lab. It tells the router to trust its own clock and serve it. Set the clock first:

```ios R1
R1# clock set 12:00:00 20 Sep 2026
R1# configure terminal
R1(config)# ntp master 8
R1(config)# end
R1# show ntp status
```

`ntp master 8` serves the local clock at stratum 8, so a client synchronized to it reports 9. With no number the default is also 8. The high number is deliberate: if a real source becomes reachable, its lower stratum is preferred. The command does not make the clock accurate. It serves whatever time you typed, so it is not a repair for a router that has lost its real source.

Representative output for the stated local-master lab:

```output R2 NTP verification (excerpts)
Clock is synchronized, stratum 9, reference is 10.60.0.1  ← local device's state

  address         ref clock       st   when   poll reach  delay  offset   disp
*~10.60.0.1       127.127.1.1      8     28     64   377  1.000   0.200   0.230
 * sys.peer, ~ configured
```

`show ntp status` describes this router: synchronized or not, its own stratum and the server it follows. `show ntp associations` describes the servers. The `st` column is the server's stratum, `*` marks the server currently selected and `~` marks one that was configured by hand. `ref clock` is where that server gets its time; `127.127.1.1` is how IOS names a router's own clock and is not an address to ping.

`reach` records the last eight polls as eight bits, a 1 for each reply and a 0 for each miss, and displays them in octal. Eight replies in a row are `11111111`, which is octal `377`. A new association climbs through `1, 3, 7, 17, 37, 77, 177, 377` as replies arrive, and `0` means none of the last eight polls was answered. `poll` is the current interval in seconds.

:::trap Reachability and synchronization are different
A nonzero reach means replies are arriving. It does not mean the server has been selected: look for the `*` and for `Clock is synchronized`. A reach of zero when ping works means ICMP gets through and NTP does not. Check that the server is itself synchronized, that UDP 123 is permitted, and that the association has had time to converge.
:::

Three optional commands appear in real configurations. `ntp source loopback0` sends NTP packets from a stable loopback address. `ntp authenticate`, with `ntp authentication-key` and `ntp trusted-key`, makes a client accept time only from servers that share a key; it does not encrypt the exchange. `ntp update-calendar` copies NTP time to the hardware clock on platforms that have one.

## Read syslog messages

Every IOS log message has the same shape: an optional sequence number, a timestamp, then `%FACILITY-SEVERITY-MNEMONIC: description`. Once you can pick out those fields you can read any message, including ones you have never seen.

```output Representative IOS event
000045: Sep 20 12:07:41.123 UTC: %SYS-5-CONFIG_I: Configured from console by admin on vty0 (10.60.0.60)
```

`SYS` is the facility, the part of IOS that generated the message. `5` is the severity. `CONFIG_I` is the mnemonic, a short code for the event. The description says that someone left configuration mode: here `admin`, on line vty0 from 10.60.0.60, which is a remote session even though the fixed wording says “from console”. The message records that a configuration session ended, not which commands were entered.

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

Lower numbers are more severe, and you need all eight names in order. A common memory aid is “Every Awesome Cisco Engineer Will Need Ice cream Daily”. The severity is fixed by the message type, not by the damage done: `%LINEPROTO-5-UPDOWN` is level 5 whether the interface is a test loopback or the only WAN link.

An asterisk before a timestamp, as in `*Mar  1 00:04:12`, means the router does not consider its clock authoritative because the time has not been set or synchronized. Treat such timestamps as unreliable and check `show clock detail`. `service timestamps log datetime msec` only changes how the time is printed, adding the date and milliseconds.

The word **facility** has a second meaning. When a message is sent to a syslog server, the packet carries a numeric syslog facility that the server uses to sort messages, and this is separate from the `SYS` or `LINK` in the text. Cisco devices send as `local7` (facility 23) unless `logging facility` changes it. The packet combines both numbers into one priority value, `facility × 8 + severity`, so a severity 5 message sent as local7 arrives marked `<189>`: `23 × 8 + 5 = 189`.

## Select logging destinations and thresholds

IOS can send each message to four places, and each has its own on/off setting and severity threshold. `show logging` lists all four.

| Destination | Typical controls | What to verify |
|---|---|---|
| Console | `logging console` | Enabled state and threshold |
| Remote terminal session | `logging monitor`; `terminal monitor` | Global threshold and this session's subscription |
| Memory buffer | `logging buffered`; `show logging` | Size, threshold, retained interval |
| Remote collector | `logging host`; `logging trap` | Destination, transport, threshold and actual reception |

A threshold names the least severe level a destination accepts; that level and everything more severe get through. `logging trap warnings` therefore sends levels 0–4 to the server and holds back 5–7. It does not mean “only warnings”. Despite its name, `logging trap` sets the threshold for the syslog server and has nothing to do with SNMP traps.

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

Console messages appear on the console port automatically. An SSH or Telnet session shows nothing until you type `terminal monitor` in that session, which is why a remote engineer can miss messages that a console user sees; `terminal no monitor` turns the display off again. `logging synchronous`, a line command, reprints the command you were typing after a message interrupts it. It does not change what is logged.

The buffer lives in RAM. It has a fixed size, so new messages overwrite the oldest, and a reload empties it. A syslog server keeps messages off the device, which is the reason to configure one. Messages travel to it over UDP 514 with no acknowledgment, so the router cannot tell whether they arrived. Check on the server.

## Understand SNMP operations and security

Syslog tells you what a device chose to report. SNMP lets a monitoring station ask. The station is the **manager**, often called an NMS (network management station), and software on each device, the **agent**, answers it. What can be asked is defined by the **Management Information Base (MIB)**, a catalogue of the variables a device exposes, such as its name, uptime and per-interface counters. Each variable is named by an **object identifier (OID)**, a dotted string of numbers such as `1.3.6.1.2.1.1.5.0` for the device name. Single values end in `.0`. Values in a table, such as interface counters, end in a row index, which is not necessarily the port number.

| Operation | Purpose | Common UDP direction |
|---|---|---|
| Get | Read requested object instances | Manager to agent destination 161 |
| GetNext | Read the next instance lexicographically | Manager to agent destination 161 |
| GetBulk | Retrieve successive values efficiently | Manager to agent destination 161 |
| Set | Request a permitted change to writable objects | Manager to agent destination 161 |
| Response | Return values, status or an error | Back to the requester's source endpoint |
| Trap | Send a notification without protocol acknowledgment | Agent to receiver destination 162 |
| Inform | Send a notification that expects a Response | Sender to receiver destination 162 |

The first four rows are polling: the manager asks and the agent answers. Trap and Inform run the other way and let the agent report an event without waiting to be asked. A Trap is sent once and never acknowledged, so a lost Trap goes unnoticed. An Inform is acknowledged with a Response and is sent again if none arrives. An agent sends only the notifications it has been configured to send.

The versions differ mainly in security. **SNMPv1 and v2c** authenticate with a **community string**, a shared password sent in clear text in every packet. A read-only (`ro`) community allows the read operations; a read-write (`rw`) community also allows Set. Anyone who captures the string can use it. v2c adds GetBulk, Inform and 64-bit counters to v1 and keeps the same weak security.

**SNMPv3** replaces communities with users and adds two protections. **Authentication** proves who sent a message and that it was not altered. **Privacy** encrypts the contents. Three security levels combine them:

| Level | Authentication | Privacy/encryption |
|---|---|---|
| noAuthNoPriv | No cryptographic message authentication | No |
| authNoPriv | Yes | No |
| authPriv | Yes | Yes |

SNMPv3 encrypts only at `authPriv`; “v3 is always encrypted” is a common wrong answer. Groups and views then define which objects a user may read or write.

The following is a read-only demonstration for the isolated lab. ACL 10 permits just the manager address; as a standard source ACL it uses the selector idea introduced in chapter 26. In `permit host 10.60.0.60`, `host` means exactly one source address. Other sources reach the list's implicit deny. In `snmp-server community LABREAD ro 10`, `ro` grants read-only access and the final `10` attaches that source list to this community. Merely creating the ACL would not restrict the community. Chapter 34 teaches full ACL policy.

```ios R2
R2# configure terminal
R2(config)# access-list 10 permit host 10.60.0.60
R2(config)# snmp-server community LABREAD ro 10
R2(config)# snmp-server location Training rack
R2(config)# end
R2# show snmp
```

When a query fails, check the agent's address, the SNMP version, the community string, the ACL attached to the community and the path on UDP 161. `show snmp` counts the requests that arrived with an unknown community.

## Reading the output

Separate a recorded event from the proposed explanation. A `LINK` message can report a link transition without identifying the failed cable or person responsible. `administratively down` identifies an administrative state; nearby login records alone do not attribute the exact command. Interface events and their severities differ by image, including simulator behavior.

For SNMP rate calculations, compare the same counter instance at two known times. If octets rise from `1,000,000,000` to `1,037,500,000` over 30 seconds, the average is `37,500,000 × 8 / 30 = 10,000,000 bit/s`, or 10 Mbit/s. On a 100 Mbit/s interface that is 10% in the measured direction. This assumes no counter reset or wrap and does not give peak utilization or user goodput. Counter64 reduces wrap frequency; it does not eliminate resets or poor sampling.

For a missing record, verify generation, local policy, transport and receiver processing in that order. Compare new events after a change; a more permissive threshold does not automatically replay the old memory buffer. Correlate device-source timestamps with collector receipt times, and preserve relevant records before clearing anything.

## Exam focus

- NTP uses UDP 123. `ntp server` makes a client, a synchronized router also serves, and `ntp master` serves the local clock (default stratum 8).
- A client's stratum is its server's plus one; 16 means unsynchronized.
- `show ntp status` shows the router's own state. `show ntp associations` shows the servers: `*` is the selected one and reach `377` means eight answered polls.
- A message reads `%FACILITY-SEVERITY-MNEMONIC`. Severities run from 0 emergencies to 7 debugging; lower is more severe.
- A logging threshold passes its own level and every more severe level. The destinations are console, monitor (`terminal monitor`), buffer and server (`logging host`, `logging trap`, UDP 514).
- The SNMP manager polls the agent on UDP 161 with Get, GetNext, GetBulk and Set. The agent sends Trap (unacknowledged) or Inform (acknowledged) to UDP 162. A MIB defines the objects and an OID names one.
- SNMPv1 and v2c use clear-text communities; v3 offers noAuthNoPriv, authNoPriv and authPriv.
