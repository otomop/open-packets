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

A user tells you the office Wi-Fi shows full signal bars, yet video calls keep freezing. On a wired link you would check the cable, the interface counters and the IP settings. A wireless link has no cable to inspect. The laptop, the access point (AP) and every other radio nearby share the same air, and what one does affects the rest. To work on that problem you need the vocabulary of radio: channels, signal strength, noise and interference.

[Chapter 03](#/chapter/cabling-and-interfaces) introduced half duplex on shared Ethernet, and [chapter 30](#/chapter/client-os-troubleshooting) showed that a client can be connected to Wi-Fi and still have no usable IP settings. This chapter adds the radio layer underneath both. By the end you can explain how stations share a channel, read dBm and signal-to-noise values, choose nonoverlapping channels, tell an SSID from a BSSID, name the common causes of interference and compare the WPA generations. The next chapter covers APs and controllers; chapter 38 configures WLAN security.

## How stations share a radio channel

:::facts
- Wi-Fi uses shared airtime. A radio is half duplex: it does not transmit and receive on the same channel at the same time.
- **CSMA/CA** means carrier sense multiple access with collision avoidance.
- In the 2.4 GHz band, channels **1, 6 and 11** are the nonoverlapping set for 20 MHz channels.
- A strong received signal does not establish free airtime, correct security, or IP reachability.
- **SSID** names the WLAN; **BSSID** identifies a particular basic service set.
- The channels you may use depend on the device and the country's regulatory domain.
:::

Switched Ethernet gives each device its own cable, so both ends can send at once. Wi-Fi has one medium for everyone: the air around the AP. Every **station** on a channel (the 802.11 word for any Wi-Fi radio, AP or client) transmits into the same space, a neighbor's stations included. If two transmit at the same moment, the receiver cannot decode either frame.

A Wi-Fi radio is **half duplex**. It cannot listen while it transmits on the same channel, so it cannot detect a collision the way shared Ethernet did with CSMA/CD in chapter 03. Wi-Fi tries to avoid the collision instead, using **CSMA/CA**:

1. The station listens. If the channel is busy, it waits.
2. When the channel goes quiet, the station waits a further random backoff time, so that several waiting stations do not all start together.
3. The station transmits its frame.
4. The receiver returns an acknowledgment (ACK). If no ACK arrives, the sender assumes the frame was lost and sends it again.

Collisions still happen, for example when two stations cannot hear each other, but far less often. Broadcast and multicast frames are sent without an ACK.

**Airtime** is the time a transmission occupies the channel. Frames, ACKs, backoff and retries all use it. A client far from the AP uses a slow data rate, so its traffic takes more airtime and leaves less for everyone else. A cell with many active clients can be slow even when each shows a strong signal, because they spend their time waiting for one another. That is one explanation for the freezing video call.

Three bodies set the rules. The **IEEE** writes the 802.11 standard. The **Wi-Fi Alliance** certifies products and names them, as in Wi-Fi 6 and WPA3. National regulators decide which frequencies and power levels are legal, so the usable channels differ by country.

## Read frequency, power and noise

A radio signal is a wave. **Frequency**, measured in hertz (Hz), is the number of cycles per second; Wi-Fi uses bands near 2.4, 5 and 6 GHz. **Wavelength** is the length of one cycle and gets shorter as frequency rises: about 12.5 cm at 2.4 GHz and 6 cm at 5 GHz. **Amplitude** is the strength of the wave, which the power measurements below describe.

A signal weakens as it spreads out from the antenna, even in open air. This is **free-space path loss**. A lower frequency loses less energy over distance and passes through walls better, so a 2.4 GHz cell reaches farther than a 5 GHz cell at the same power. Objects in the path change the signal further:

| Effect | What happens to the signal | Typical cause |
|---|---|---|
| Absorption | It passes through a material and loses energy | Walls, water, people |
| Reflection | It bounces off a surface | Metal, glass |
| Refraction | It bends as it passes into a different material | Glass, water |
| Diffraction | It bends around an obstacle | Corners and edges |
| Scattering | It breaks up in many directions | Rough or uneven surfaces |

Because of reflection, copies of one signal can reach the receiver by several paths at slightly different times. This is **multipath**. 802.11n and later use several antennas (MIMO) to turn the extra paths into extra data streams.

An AP may transmit 100 mW, and a client can still decode a signal a billion times weaker. Decibels turn such ratios into small numbers you can add and subtract.

| Measurement | Meaning | Example |
|---|---|---|
| dB | A ratio or difference on a logarithmic scale | A 10 dB power increase is tenfold |
| dBm | Power referenced to 1 milliwatt | 0 dBm = 1 mW; 20 dBm = 100 mW |
| dBi | Antenna gain relative to an isotropic reference | Directional gain concentrates radiation |
| Received level | Power arriving at the receiver | −55 dBm is stronger than −75 dBm |
| SNR | Signal-to-noise ratio | Signal −65 dBm minus noise −92 dBm = 27 dB |

Two rules cover almost every calculation: **+3 dB doubles the power and +10 dB multiplies it by ten**. In the other direction, −3 dB halves it and −10 dB divides it by ten. Raising a transmitter from 20 dBm to 23 dBm takes it from 100 mW to about 200 mW; 30 dBm is 1,000 mW. Twice the power does not give twice the range or throughput.

Received power is so small that it is nearly always a negative dBm value. The closer to zero, the stronger the signal: −55 dBm is 20 dB stronger than −75 dBm, which is 100 times the power. **RSSI**, the received signal strength indicator, is the receiver's own report of that level. Cisco tools usually show it in dBm; Windows shows a percentage that each vendor calculates in its own way.

Signal strength alone does not tell you whether the receiver can decode a frame. That depends on how far the signal stands above the background **noise floor**. The **signal-to-noise ratio (SNR)** is the difference between the two:

`signal (dBm) − noise (dBm) = SNR (dB)`

A laptop that receives −65 dBm where the noise floor is −92 dBm has an SNR of 27 dB. A higher SNR lets the radios use a faster data rate. Take both readings at the **same receiver at the same time**: the noise at the AP says nothing about the noise at the laptop.

:::trap Signal strength and SNR answer different questions
A client receiving −55 dBm over −60 dBm noise has only 5 dB SNR. Another receiving −65 dBm over −92 dBm noise has 27 dB SNR. The stronger signal is not automatically the more usable link.
:::

An antenna shapes where the power goes; it does not add power. An **omnidirectional** antenna spreads energy in every horizontal direction, as an indoor AP does. A **directional** antenna, such as a patch, Yagi or dish, concentrates it one way, which suits a building-to-building link. That concentration is the antenna's gain, measured in **dBi**.

## Choose bands and channels

Each band is divided into numbered **channels**. A channel is a slice of frequencies with a center and a width, and two radios interfere whenever their slices overlap. Channel planning means giving neighboring APs slices that do not overlap.

**2.4 GHz.** Channel centers are only 5 MHz apart, but a transmission is about 20 MHz wide (22 MHz for old 802.11b), so each channel overlaps several channels on either side of it. Channel 1 is centered on 2412 MHz, channel 6 on 2437 MHz and channel 11 on 2462 MHz. Those centers are 25 MHz apart, enough to clear one another. North America allows channels 1–11, so **1, 6 and 11** are its only three nonoverlapping channels. Most other countries also allow 12 and 13, but 1, 6 and 11 remains the standard plan and the answer the exam expects.

Suppose AP-A, AP-B and AP-C in the figure all used channel 1. Wherever their coverage overlapped, the three APs and all their clients would take turns on one channel. On channels 1, 6 and 11, each cell has its own airtime. Channels 1, 2 and 3 would be worse than sharing channel 1: the transmissions overlap, but each radio hears the others as noise instead of as frames it can wait for.

```diagram
{"type":"topology","title":"Fig 36.1 — Separate neighboring cells","caption":"The APs share an SSID and wired LAN, while different 20 MHz channels reduce overlap between neighboring 2.4 GHz cells.","nodes":[{"id":"A","kind":"ap","label":"AP-A","sub":"STAFF · channel 1","x":2,"y":1},{"id":"B","kind":"ap","label":"AP-B","sub":"STAFF · channel 6","x":6,"y":1},{"id":"C","kind":"ap","label":"AP-C","sub":"STAFF · channel 11","x":10,"y":1},{"id":"S","kind":"switch","label":"LAN switch","x":6,"y":5}],"links":[{"from":"A","to":"S"},{"from":"B","to":"S"},{"from":"C","to":"S"}]}
```

A fourth AP has to reuse one of the three channels. Give it the channel of the AP it hears least, as measured by a site survey, so the two cells on the same channel overlap as little as possible.

**5 GHz.** This band is much larger. Its channels are numbered in steps of four (36, 40, 44, 48 and so on), which puts their centers 20 MHz apart, so neighboring 20 MHz channels do not overlap. The United States has up to 25 of them, compared with three at 2.4 GHz, and fewer non-Wi-Fi devices use the band. The cost is range: a 5 GHz cell is smaller.

Some 5 GHz channels are shared with radar. On those channels an AP must use **dynamic frequency selection (DFS)**: it listens for radar before it uses the channel and must move to another channel if radar appears, which briefly interrupts its clients. In the United States, channels 52–144 require DFS; channels 36–48 and 149–165 do not.

**6 GHz.** Wi-Fi 6E and Wi-Fi 7 devices can use a third band, which adds 59 more 20 MHz channels in the United States. Both the AP and the client need a 6 GHz radio. The band also has a security rule: a 6 GHz WLAN must use WPA3 or Enhanced Open, the two newest security options described later in this chapter. WPA2 is not allowed there.

| Band | Nonoverlapping 20 MHz channels | Strength | Limit |
|---|---|---|---|
| 2.4 GHz | 3 (channels 1, 6 and 11) | Longest range; every client supports it | Crowded; microwave ovens and Bluetooth share it |
| 5 GHz | Up to 25 in the United States | Many channels; room for wide ones | Shorter range; DFS on some channels |
| 6 GHz | 59 in the United States | Most spectrum; no old devices | Needs Wi-Fi 6E or Wi-Fi 7 hardware |

**Channel bonding** joins neighboring 20 MHz channels into one channel of 40, 80 or 160 MHz. A wider channel carries more data per second, but it uses up the channels it is made of. One 80 MHz channel occupies four 20 MHz channels, for example 36, 40, 44 and 48, and a neighbor on 20 MHz channel 44 now overlaps it. At 2.4 GHz a 40 MHz channel takes most of the band, so use 20 MHz there.

## Recognize Wi-Fi generations

Each amendment to 802.11 brought higher speeds or a new band, and the Wi-Fi Alliance gave the recent ones generation numbers. Learn which bands each one uses, because a client and an AP can connect only on a band and a standard that both support.

| Standard | Wi-Fi name | Bands | Maximum data rate | Known for |
|---|---|---|---|---|
| 802.11b | — | 2.4 GHz | 11 Mb/s | First widely used standard |
| 802.11a | — | 5 GHz | 54 Mb/s | First use of 5 GHz |
| 802.11g | — | 2.4 GHz | 54 Mb/s | 802.11a speeds at 2.4 GHz |
| 802.11n | Wi-Fi 4 | 2.4 and 5 GHz | 600 Mb/s | MIMO and 40 MHz channels |
| 802.11ac | Wi-Fi 5 | 5 GHz | 6.93 Gb/s | 80 and 160 MHz channels |
| 802.11ax | Wi-Fi 6 and 6E | 2.4 and 5 GHz; 6 GHz as Wi-Fi 6E | 9.6 Gb/s | OFDMA for crowded cells |
| 802.11be | Wi-Fi 7 | 2.4, 5 and 6 GHz | 46 Gb/s | 320 MHz channels at 6 GHz; multi-link operation |

The bands follow a pattern: 802.11b and 802.11g are 2.4 GHz only, 802.11a and 802.11ac are 5 GHz only, and 802.11n and 802.11ax use both. Wi-Fi 6E is 802.11ax operating in the 6 GHz band; it is a radio capability, not a security protocol. Because 802.11ac is 5 GHz only, a dual-band “Wi-Fi 5” AP runs 802.11n on its 2.4 GHz radio.

The rates in the table are **PHY rates**: the speed at which bits cross the radio link, under ideal conditions with every optional feature in use. A real connection negotiates a lower rate that depends on the client's antennas, the channel width and the SNR. The throughput an application sees is lower again, because of protocol overhead, ACKs, retries and airtime shared with other clients. A laptop that reports an 866.7 Mb/s receive rate has a good radio link. It has not measured an 866 Mb/s file transfer.

## Identify the WLAN and its cells

When you pick a network on a laptop, you pick a name. Behind that name there may be one AP or five hundred. The 802.11 standard has exact terms for the name, for each cell and for the group, and the exam uses them.

The **SSID**, service set identifier, is the name of the WLAN. It can be up to **32 octets** (bytes) long and is case sensitive. It is not a secret. An AP can be set not to broadcast its SSID, but the name still appears in other frames, so hiding it is not a security measure.

A **basic service set (BSS)** is one AP and the clients associated with it. Clients in a BSS send everything through the AP, not directly to each other. The **BSSID** identifies the BSS. It is a 48-bit value in MAC-address form, taken from the AP's radio. An AP creates a separate BSS for each SSID on each radio, so one AP offering STAFF and GUEST on two bands advertises four BSSIDs.

The AP bridges frames between its wireless clients and the wired network. In 802.11 terms the wired network that connects the APs is the **distribution system (DS)**. Several BSSs that share an SSID and are joined by a distribution system form an **extended service set (ESS)**. In Fig 36.1, AP-A, AP-B and AP-C each form a BSS with its own BSSID. All three advertise STAFF and connect to the same LAN switch, so together they are one ESS.

**Roaming** is a client's move from one BSS to another inside an ESS. A laptop carried from AP-A's cell to AP-B's cell reassociates with AP-B's BSSID; the SSID stays the same. The laptop keeps its IP address only if both APs place STAFF clients in the same VLAN and subnet; a matching SSID does not provide that.

A client joins a WLAN in a fixed order:

```diagram
{"type":"sequence","title":"Fig 36.2 — A client joins a WPA2-Personal WLAN","caption":"Each stage must succeed before the next begins, so a client can find an SSID and still never receive an IP address.","actors":["Client","AP"],"steps":[{"from":1,"to":0,"label":"Beacon","note":"Announces the SSID, rates and security about ten times a second"},{"from":0,"to":1,"label":"Probe request, answered by a probe response","note":"Optional active scan"},{"from":0,"to":1,"label":"802.11 authentication and association","note":"The client is now a member of the BSS"},{"from":1,"to":0,"label":"Four-way handshake","note":"Both sides prove they hold the same key and derive encryption keys","accent":true},{"from":0,"to":1,"label":"DHCP and data frames","note":"Encrypted, and bridged by the AP to the wired LAN"}]}
```

The client finds the WLAN by listening for the AP's **beacons** (a passive scan) or by sending a **probe request** (an active scan). It then authenticates and associates. On a WPA2 WLAN this 802.11 authentication is only a formality; the real proof is the key exchange that follows association. This order explains a symptom from chapter 30: a client with the wrong passphrase can see the SSID and even associate, but it never gets an IP address, because the handshake fails before DHCP can run.

An **independent BSS (IBSS)**, or ad hoc network, has no AP: the stations talk to each other directly. Enterprise WLANs and this course's labs use infrastructure mode, with an AP.

## Investigate interference and coverage

Return to the user with full signal bars and a freezing call. The signal is strong, so something else is using the airtime or raising the noise. Three kinds of interference do that, and each leaves different evidence.

**Co-channel interference** is other Wi-Fi on the same channel, your own or a neighbor's. The radios can decode each other's frames, so CSMA/CA makes them take turns: nothing is corrupted, but everyone waits longer. Look for high channel utilization at busy times. The fix is a better channel plan or moving clients to 5 GHz.

**Adjacent-channel interference** is Wi-Fi on a channel that partly overlaps yours, such as channels 1 and 3. The radios receive each other's energy but cannot decode it as frames, so they do not take turns cleanly, and frames are damaged and sent again. Look for a high retry rate. The fix is to use only channels 1, 6 and 11.

**Non-Wi-Fi interference** comes from devices that radiate in the band without following the 802.11 rules: microwave ovens, Bluetooth devices, cordless phones and wireless cameras. Nearly all of them use 2.4 GHz. They raise the noise floor, which lowers SNR. Look for problems tied to a place and a time, such as near the break room at lunchtime. A scan for SSIDs does not show these devices; a spectrum analyzer does. The fix is to remove the device, change channel or move clients to 5 GHz.

A symptom suggests a cause without proving it: lunchtime also brings more clients onto the WLAN. Confirm a suspect by switching it off and on while you watch the retry rate.

A weak signal can look like interference: distance, walls, metal shelving or a badly placed AP. Raising the AP's transmit power often fails to fix it. The client hears the AP better, but the client's own transmitter is no stronger, so the AP hears the client no better and uploads still fail. A site survey measures coverage in both directions. On a controller, **radio resource management (RRM)** adjusts AP channels and power automatically.

When you investigate, record the same evidence each time: BSSID, band, channel and width, signal, noise, channel utilization and retries. Change one setting, then measure again from the same place. Packet Tracer does not model interference, so the lab gives you readings to work from.

## Recognize the security choices

Anyone within range can receive a radio signal, so a WLAN needs protection that a cable provides physically. **Authentication** decides who may join. **Encryption** stops other receivers from reading the frames. **Integrity** checks detect frames that were altered on the way. All three protect only the wireless link between the client and the AP.

Wi-Fi security has had four generations, each replacing a weaker one:

| Generation | Encryption | Authentication | Status |
|---|---|---|---|
| WEP | RC4 with a static key | The same static key | Broken; never use it |
| WPA | TKIP, which is also based on RC4 | Personal or Enterprise | A stopgap for old hardware; deprecated |
| WPA2 | AES-CCMP | Personal (PSK) or Enterprise (802.1X) | The minimum to accept today |
| WPA3 | AES, with CCMP or GCMP | Personal (SAE) or Enterprise (802.1X) | Current; required at 6 GHz |
| Enhanced Open (OWE) | AES | None | Encrypts a guest network that has no password |

**AES** is the encryption algorithm. **CCMP** is the protocol that uses AES for both encryption and integrity, and WPA2 requires it. **GCMP** is a newer AES mode used by WPA3's strongest option.

WPA, WPA2 and WPA3 each come in two modes. **Personal** mode uses one passphrase for everyone. In WPA2-Personal that passphrase produces the **pre-shared key (PSK)**, and the four-way handshake proves that the client and the AP hold the same key. **Enterprise** mode authenticates each user or device separately with **802.1X**: the **Extensible Authentication Protocol (EAP)** carries the credentials, and a RADIUS server from [chapter 33](#/chapter/aaa-tacacs-radius) checks them. Removing one person's access then means disabling one account, not changing everyone's passphrase.

WPA3-Personal replaces the PSK exchange with **SAE**, Simultaneous Authentication of Equals. Each side proves it knows the password without sending anything an eavesdropper could capture and test guesses against offline. WPA3 also requires **Protected Management Frames (PMF)**, which stop an attacker from forging the deauthentication frames that knock clients off a WLAN.

:::trap WPA3 is not simply “GCMP”
Summary tables often pair WPA3 with GCMP. WPA3-Personal's required cipher is AES-CCMP, the same as WPA2; GCMP-256 belongs to the optional 192-bit mode of WPA3-Enterprise. What separates WPA3-Personal from WPA2-Personal is SAE and mandatory PMF.
:::

[Chapter 38](#/chapter/wireless-security-config) configures WPA2-Personal in a controller GUI and explains the handshakes in detail.

## Read a wireless connection report

Windows reports most of this chapter's terms with one command. The excerpt is representative; the fields vary with the Windows version and the adapter.

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

The laptop has joined the WLAN named STAFF through the BSS 02:11:22:33:44:55. It uses 802.11ac on 5 GHz channel 44, protected by WPA2-Personal with AES-CCMP. The 866.7 Mb/s is the negotiated PHY rate, and the 82% signal is Windows' own scale, not dBm. The report says nothing about the IP address, the default gateway, DNS or how busy channel 44 is, so continue with the IP tests from chapter 30.

Two more commands fill in the picture. `netsh wlan show networks mode=bssid` lists every BSSID the adapter can hear under each SSID, with its channel and signal, so it shows an ESS from the client's side and the channels the neighbors use. `netsh wlan show drivers` lists what the adapter supports, such as its radio types. An 802.11ax-capable adapter that is connected with 802.11n tells you the AP or the band is the limit.

## Exam focus

- **Channels:** 2.4 GHz has three nonoverlapping channels: 1, 6 and 11. 5 GHz has many more, and some require DFS.
- **Standards:** 802.11b and g use 2.4 GHz; 802.11a and ac use 5 GHz; 802.11n and ax use both. Wi-Fi 6E is 802.11ax at 6 GHz.
- **RF:** +3 dB doubles power; +10 dB multiplies it by ten. 0 dBm is 1 mW. SNR in dB is signal minus noise.
- **Service sets:** the SSID names the WLAN. The BSSID identifies one BSS: one AP and its clients. BSSs joined by a distribution system form an ESS.
- **Interference:** co-channel (shared airtime), adjacent-channel (overlapping channels) and non-Wi-Fi (microwave ovens, Bluetooth).
- **Security:** WEP uses RC4, WPA uses TKIP, WPA2 uses AES-CCMP, and WPA3 adds SAE and PMF. Personal mode shares one passphrase; Enterprise mode uses 802.1X with RADIUS.
- **Diagnosis:** a strong signal still needs free airtime, matching security and valid IP settings.
