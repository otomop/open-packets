---
id: wireless-principles
number: 36
title: Wireless principles
subtitle: Understand shared airtime, signal measurements, channel selection and the network name a client joins.
part: wireless
domain: infra
minutes: { lesson: 60, lab: 55 }
summary: Explain RF and interference, choose sensible band and channel plans, distinguish SSID from BSSID, and read wireless evidence without confusing signal strength with successful connectivity.
objectives:
  v1: ["1.11", "1.11.a", "1.11.b", "1.11.c", "1.11.d"]
  v2: ["1.5", "1.5.a", "1.5.b", "1.5.c", "1.5.d"]
prereqs: [network-models, client-os-troubleshooting]
sectionIds:
  "How stations share a radio channel": why-radio-needs-its-own-rules
  "Read frequency, power and noise": rf-basics-frequency-power-and-noise
  "Choose bands and channels": bands-and-channels
  "Recognize Wi-Fi generations": the-802-11-standards
  "Identify the WLAN and its cells": service-sets-bss-ess-ibss-and-the-ssid
  "Investigate interference and coverage": interference-and-what-degrades-a-signal
  "Recognize the security choices": security-protocols-wep-to-wpa3
  "Read a wireless connection report": reading-the-output
  "Exam focus": exam-focus
sources:
  - { title: "Cisco: Wireless RF reference guide", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wireless-rf-reference-guide.html" }
  - { title: "Cisco: Radio resource management and RF measurements", url: "https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/71113-rrm-new.html" }
  - { title: "Cisco: CleanAir design and interference", url: "https://www.cisco.com/c/en/us/support/docs/wireless/5500-series-wireless-controllers/112139-cleanair-uwn-guide-00.html" }
  - { title: "IEEE: 802.11-2024 MAC and PHY standard", url: "https://standards.ieee.org/ieee/802.11/10548/" }
  - { title: "IEEE: 802.11be-2024 publication announcement", url: "https://www.ieee802.org/11/email/stds-802-11/msg08898.html" }
  - { title: "RFC 5416: IEEE 802.11 binding and SSID fields", url: "https://www.rfc-editor.org/rfc/rfc5416" }
  - { title: "Cisco: WPA3, Catalyst 9800 IOS XE 17.17", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-17/config-guide/b_wl_17_17_cg/m_wpa3.html" }
  - { title: "Cisco: Catalyst 9800 configuration and verification", url: "https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213911-understand-catalyst-9800-wireless-contro.html" }
  - { title: "Cisco: Wi-Fi 6E Layer 2 security", url: "https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/220712-configure-and-verify-wi-fi-6e-wlan-layer.html" }
  - { title: "Microsoft: netsh wlan", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netsh-wlan" }
  - { title: "Cisco Networking Academy: Packet Tracer wireless security workflow", url: "https://contenthub.netacad.com/legacy/I2IoT/2.0/en/course/files/5.1.2.6%20Packet%20Tracer%20-%20Configure%20Wireless%20Security.pdf" }
---

A wireless client must do more than detect a network name. It needs a usable radio link, compatible security settings, and working IP configuration. A strong signal solves only part of that problem. This chapter explains the radio and identification terms so you can tell what a wireless report establishes and what still needs testing.

The examples use ordinary infrastructure Wi-Fi. The next chapter explains where APs and controllers forward traffic; chapter 38 develops security and the controller GUI. Product generations and regulatory rules change, so use the actual country setting and device capabilities when implementing a channel plan.

## How stations share a radio channel

:::facts
- Wi-Fi uses shared airtime. Ordinary radio operation is half duplex; a station does not transmit and receive on the same radio channel simultaneously.
- **CSMA/CA** means carrier sense multiple access with collision avoidance.
- A strong received signal does not establish free airtime, correct security, or IP reachability.
- **SSID** names the WLAN; **BSSID** identifies a particular basic service set.
- Use the allowed channel list for the device and regulatory domain, not a universal channel-count table.
:::

On a full-duplex switched Ethernet link, the two ends can send in both directions at once. An ordinary Wi-Fi radio must listen and transmit at different times. Other APs and clients within radio range may use the same channel even though they belong to different organizations.

Bring forward two distinctions: [chapter 03](#/chapter/cabling-and-interfaces) separates link operation from useful throughput, and [chapter 30](#/chapter/client-os-troubleshooting) separates a wireless connection from valid IP settings. Here you add the radio evidence needed before testing DHCP, a gateway or an application.

With CSMA/CA, a station checks whether the medium is busy and follows waiting and random-backoff rules before transmitting. A receiver normally acknowledges individually addressed data; if the expected acknowledgment does not arrive, the sender may retry. This reduces collisions but does not eliminate them. Some frame types, including ordinary broadcast/multicast delivery, do not use the same individual acknowledgment behavior.

**Airtime** is the time used on the radio channel. It includes useful data, management frames, acknowledgments, waiting and retries. A slow transmission occupies more airtime for the same payload than a fast one. That is why a busy cell can perform poorly while every client shows a strong signal.

Modern Wi-Fi can coordinate multiple users with features such as OFDMA and multi-user MIMO. Do not turn the basic shared-medium explanation into an absolute claim that only one user can ever exchange data at a time. These features improve scheduling and efficiency; they do not make interference or airtime limits disappear.

The IEEE defines the 802.11 MAC and physical-layer specifications. The Wi-Fi Alliance certifies interoperability and security programs. National regulators determine permitted spectrum and power. A Wi-Fi generation name is therefore different from both a legal channel authorization and a security mode.

## Read frequency, power and noise

**Frequency**, measured in hertz, describes the rate of a radio wave's cycles. The familiar Wi-Fi band names are 2.4, 5 and 6 GHz. **Wavelength** decreases as frequency increases: in free space it is about 12.5 cm at 2.4 GHz, 6 cm at 5 GHz and 5 cm at 6 GHz. These are explanatory examples, not a channel-planning formula.

Signals weaken with distance and interact with materials. Walls can absorb energy; metal can reflect it; several reflected paths may reach a receiver at different times. This is **multipath**. Multiple-antenna systems can use suitably different paths to improve reception or carry multiple spatial streams, but they cannot guarantee a usable link through every obstruction.

| Measurement | Meaning | Example |
|---|---|---|
| dB | A ratio or difference on a logarithmic scale | A 10 dB power increase is tenfold |
| dBm | Power referenced to 1 milliwatt | 0 dBm = 1 mW; 20 dBm = 100 mW |
| dBi | Antenna gain relative to an isotropic reference | Directional gain concentrates radiation |
| Received level | Power arriving at the receiver | −55 dBm is stronger than −75 dBm |
| SNR | Signal-to-noise ratio | Signal −65 dBm minus noise −92 dBm = 27 dB |

A 3 dB change is approximately a factor of two in power; 10 dB is a factor of ten. Thus raising a transmitter from 20 to 23 dBm changes approximately 100 mW to 200 mW. This does not mean twice the distance or twice the throughput.

**RSSI**, received signal strength indicator, is reported differently by different radios and tools. Many Cisco displays express a received level in dBm; a client may instead show a percentage. Normal received Wi-Fi levels are often negative dBm because they are below 1 mW. Negative is not an intrinsic requirement of the dBm unit, and a percentage is not universally convertible using one formula.

Subtract comparable signal and noise measurements from the **same receiver, band and observation period** to obtain SNR. If a laptop receives −65 dBm over a −92 dBm noise floor, its SNR is 27 dB. Combining the laptop's signal reading with noise measured at a distant AP would not establish the laptop's SNR.

An antenna directs available energy; it does not create transmitter power. An omnidirectional pattern covers directions around an axis, while a directional pattern concentrates coverage toward a chosen area. Actual patterns are three-dimensional and depend on mounting and antenna design. Directional antennas suit a planned building-to-building link, but distance alone cannot establish the required antenna, legal power or clear path.

A useful optional calculation is **EIRP**: transmitter power in dBm plus antenna gain in dBi minus cable/connector loss in dB. A 17 dBm radio with 6 dBi gain and 1 dB loss has 22 dBm EIRP. Check the applicable regulatory rules rather than assuming this is legal everywhere.

:::trap Signal strength and SNR answer different questions
A client receiving −55 dBm over −60 dBm noise has only 5 dB SNR. Another receiving −65 dBm over −92 dBm noise has 27 dB SNR. The stronger signal is not automatically the more usable link.
:::

## Choose bands and channels

A **channel** occupies a range of frequencies, not a single frequency point. Its center frequency and width determine whether it overlaps another transmission. Selecting different channel numbers is insufficient if their occupied spectrum overlaps.

In the usual North American 2.4 GHz plan, channels 1–11 are available and adjacent channel centers are 5 MHz apart. Common 20 MHz deployments use **1, 6 and 11** as the nonoverlapping reuse plan. Their centers are 2412, 2437 and 2462 MHz. Other regulatory domains have different permitted channels; do not describe 1, 6 and 11 as the only legal Wi-Fi channels.

Suppose three nearby APs all use 20 MHz channel 1. Where their coverage overlaps, they contend for the same airtime. Assigning 1, 6 and 11 separates their channel use. A fourth AP requires a survey-based reuse decision: it may reuse channel 1 if sufficiently separated, but its position in a numbered row alone does not prove adequate isolation.

```diagram
{"type":"topology","title":"Fig 36.1 — Separate neighboring cells","caption":"The APs share an SSID and wired LAN, while different 20 MHz channels reduce overlap between neighboring 2.4 GHz cells.","nodes":[{"id":"A","kind":"ap","label":"AP-A","sub":"STAFF · channel 1","x":2,"y":1},{"id":"B","kind":"ap","label":"AP-B","sub":"STAFF · channel 6","x":6,"y":1},{"id":"C","kind":"ap","label":"AP-C","sub":"STAFF · channel 11","x":10,"y":1},{"id":"S","kind":"switch","label":"LAN switch","x":6,"y":5}],"links":[{"from":"A","to":"S"},{"from":"B","to":"S"},{"from":"C","to":"S"}]}
```

| Band | Useful planning distinction | What to verify |
|---|---|---|
| 2.4 GHz | Limited nonoverlapping choices; many other devices use the band | 20 MHz width, allowed channels and nearby reuse |
| 5 GHz | More channel choices; wider channels may be available | Client support, width and any DFS requirements |
| 6 GHz | Additional spectrum for compatible newer equipment | Local authorization, AP/client support and security requirements |

**Channel bonding** combines spectrum for a wider channel. At similar radio capabilities and conditions, wider channels can support a higher PHY rate. They also consume more spectrum, leave fewer independent channel choices, and can encounter more interference. An 80 MHz channel overlaps its component 20 MHz channels. Increasing width is not an automatic fix for a crowded office; 20 MHz is the conservative planning choice in the limited 2.4 GHz band.

Some 5 GHz channels require **dynamic frequency selection (DFS)** to protect radar users. An AP may need to check a channel before using it and leave it when radar is detected. Exact channels and timing depend on the country, channel and implementation. Learn why a radio may wait or change channels; do not treat a single worldwide timer as the explanation for every interruption.

6 GHz is a separate radio capability. A 5 GHz-only client cannot gain it from an SSID setting. Modern 6 GHz Wi-Fi security uses WPA3 or Enhanced Open as applicable; ordinary WPA2-only or unencrypted-open operation is not the appropriate 6 GHz design. Spectrum, indoor/outdoor use and power rules must be checked for the actual deployment.

## Recognize Wi-Fi generations

Generation names help you compare capabilities, but a client and AP use only features both support. Product labels do not establish the negotiated channel width, number of streams or application throughput.

| Technology | Relevant bands | Recognition point |
|---|---|---|
| 802.11b / 802.11g | 2.4 GHz | Older generations; 11 and 54 Mb/s maximum PHY rates respectively |
| 802.11a | 5 GHz | Older OFDM generation; 54 Mb/s maximum PHY rate |
| 802.11n / Wi-Fi 4 | 2.4 and 5 GHz | Multiple spatial streams and optional 40 MHz channels |
| 802.11ac / Wi-Fi 5 | 5 GHz | Wider channels, including 80 MHz |
| 802.11ax / Wi-Fi 6 | 2.4 and 5 GHz; 6 GHz as Wi-Fi 6E | Efficiency improvements including OFDMA |
| 802.11be / Wi-Fi 7 | 2.4, 5 and 6 GHz, subject to product support | Newer features include multi-link operation and 320 MHz in 6 GHz |

Wi-Fi 6E refers to 802.11ax equipment extended into 6 GHz; it is not a security protocol. A dual-band Wi-Fi 5 AP still needs another supported technology on its 2.4 GHz radio because 802.11ac itself uses 5 GHz.

The **PHY rate** is the radio transmission rate for the connection. Application throughput is lower because of protocol overhead, shared airtime, retries and other bottlenecks. There is no fixed rule that useful throughput is exactly half the PHY rate. A displayed 866 Mb/s receive rate is neither a measured file-transfer result nor proof of an 866 Mb/s Internet service.

The full theoretical maximum of each amendment and its publication year are optional reference material. Focus on band compatibility, shared airtime and the difference between capability, negotiated rate and achieved performance.

## Identify the WLAN and its cells

An **SSID** is the WLAN identifier presented as a network name. Its field supports up to **32 octets**, which are bytes; a displayed character can require more than one byte in some encodings. Treat names as case sensitive. The SSID is not a password.

A **basic service set (BSS)** in an infrastructure WLAN consists of an AP's service and the stations associated with it. Its **BSSID** is a 48-bit identifier, commonly shown in MAC-address form. One physical AP can advertise multiple BSSIDs across several SSIDs and radios. Similar BSSIDs are not sufficient evidence that two cells belong to the same physical chassis.

An **extended service set (ESS)** joins infrastructure BSSs through a distribution system so clients can move between coverage areas. In a typical campus, APs advertise the same SSID and compatible security, with a consistent network design behind them. The distribution system need not be assumed to be one particular wire or switch.

**Roaming** changes the serving BSS. Keeping an IP address and active sessions depends on VLAN/subnet placement or an appropriate mobility design. Matching the SSID alone does not guarantee uninterrupted sessions, identical security or even the same organization.

Clients discover WLANs by listening for beacons and, when permitted, sending probe requests. They then perform the required authentication/association and security exchanges. For WPA2-Personal, an association can exist before the four-way key handshake has successfully completed. DHCP requires a working data path after the required security steps. A dotted simulator line or a “connected” label must be interpreted with the tool's actual state information.

An **IBSS**, also called ad hoc mode, allows stations to communicate without an infrastructure AP. Recognize the distinction; ordinary enterprise WLAN design and this course's labs use infrastructure mode.

## Investigate interference and coverage

Start by separating three possibilities: a weak desired signal, competing Wi-Fi traffic, and other energy in the band. They can occur together.

**Co-channel contention** occurs when nearby Wi-Fi transmitters share a channel. They may defer to one another and share airtime. Hidden stations, collisions and retries can still occur; “same channel” does not guarantee error-free traffic or an exact 50% throughput reduction.

**Adjacent-channel interference** occurs when occupied spectra overlap. For example, 2.4 GHz channels 1 and 3 at ordinary widths overlap. The effect depends on strength, timing, receiver behavior and spacing. Do not assume every overlapping frame must fail or that stations can never sense one another.

**Non-Wi-Fi interference** can come from equipment such as microwave ovens, Bluetooth devices or other transmitters sharing the band. A lunchtime symptom near a break room suggests an investigation, not proof of a microwave cause. Correlate the affected band, time, spectrum measurements and a controlled change before identifying the source.

Coverage problems also arise from placement, obstacles and an unbalanced link. Increasing AP transmit power may improve what the client hears without improving the client's weaker transmission back to the AP. A site survey considers both directions, coverage, capacity, retry rates and application needs. **Radio resource management (RRM)** can adjust channels and power, but it does not replace that assessment.

A basic investigation records SSID/BSSID, band, channel, width, received level, noise where available, utilization and retries. Change one justified setting, then compare the same tests and locations. Packet Tracer can illustrate settings and connectivity; it is not evidence of actual RF coverage, interference or application capacity.

## Recognize the security choices

Encryption protects data on the wireless link. Authentication decides which party or user may participate; integrity mechanisms help detect unauthorized alteration. None of these automatically protects data after it leaves the secured link.

A **pre-shared key (PSK)** is a secret configured in advance on the infrastructure and client. WPA2-Personal commonly derives it from a shared passphrase. **SAE**, Simultaneous Authentication of Equals, is WPA3-Personal's password-based authentication and key-establishment method. **802.1X** is an access-control framework; **EAP**, Extensible Authentication Protocol, carries the selected authentication method. Enterprise WLANs commonly use the RADIUS server role introduced in [chapter 33](#/chapter/aaa-tacacs-radius).

For the cipher field, **AES** names an encryption algorithm; **CCMP** combines AES-based encryption with integrity protection. Recognize what those fields control before memorizing any product's menu. The authentication and configuration walkthrough belongs to [chapter 38](#/chapter/wireless-security-config).

| Choice | Main recognition point |
|---|---|
| WEP | Obsolete, insecure protection; do not select it for a new deployment |
| Original WPA/TKIP | Legacy protection based on RC4; not a modern replacement for WPA2/WPA3 |
| WPA2-Personal with AES-CCMP | Shared passphrase; the GUI configuration required by the v1.1 objective |
| WPA2/WPA3 Enterprise | Individual authentication through 802.1X/EAP, commonly using RADIUS |
| WPA3-Personal | SAE password authentication and protected management frames |
| Enhanced Open / OWE | Encryption for an open-style network without authenticating its identity |

WPA3 does not mean one universal cipher. The security suite and product support matter; the optional Enterprise 192-bit mode is not required for every WPA3 WLAN. SAE improves resistance to passive offline password guessing compared with WPA2-PSK, but weak credentials, implementation defects and malicious endpoints remain concerns.

**Protected Management Frames (PMF)** protect specified robust management exchanges once the required keys and protection are established. They do not prevent all radio disruption or encrypt every management frame. Chapter 38 explains these boundaries and the configuration fields.

## Read a wireless connection report

The following Windows-style excerpt is representative, not a captured run. Fields and permissions vary with OS and adapter versions.

```output netsh wlan show interfaces — representative excerpt
State                  : connected
SSID                   : STAFF                  ← WLAN name
BSSID                  : 02:11:22:33:44:55       ← current service-set identifier
Radio type             : 802.11ac               ← Wi-Fi 5 on this connection
Authentication         : WPA2-Personal
Cipher                 : CCMP                   ← negotiated protection
Band                   : 5 GHz
Channel                : 44
Receive rate (Mbps)    : 866.7                   ← link rate, not a throughput test
Signal                 : 82%                    ← tool-specific quality indication
```

This establishes reported association parameters. It does not establish a DHCP lease, a reachable gateway, free airtime or successful DNS. Follow it with IP configuration and reachability tests from chapter 30.

`netsh wlan show networks mode=bssid` can show multiple visible BSSIDs under the same name. Scanning results are limited to what the adapter and OS report at that time; “not listed” is not proof that an AP does not exist. Use device inventory to map BSSIDs to physical APs instead of guessing from their addresses.

`netsh wlan show drivers` reports adapter/driver capabilities, such as supported radio types. Compare that with `show interfaces`, which reports the current connection: support for a newer generation does not prove that it was negotiated with this AP.

As an optional controller preview, Catalyst 9800 commands `show wlan summary`, `show ap summary` and `show wireless client summary` list WLAN objects, registered APs and clients respectively. They answer different inventory questions; a configured WLAN is not a connected client. The next two chapters explain the controller and client-policy context. These commands are not expected to run on a Packet Tracer home wireless router.

## Exam focus

Explain channel overlap and sensible reuse, read dBm and SNR correctly, distinguish band support from negotiated rate, and separate SSID, BSSID, BSS and ESS. Identify plausible RF causes without claiming that one symptom proves them. Compare the security families and recognize that successful wireless access also requires compatible security and a functioning IP path.
