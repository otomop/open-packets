---
id: wireless-security-config
number: 38
title: WLAN security
subtitle: Select the security method, configure the WLAN and verify a real client connection.
part: wireless
domain: infra
minutes: { lesson: 75, lab: 90 }
summary: Explain WPA, WPA2 and WPA3 without confusing encryption with authentication, configure WPA2-Personal through an AireOS-style GUI, translate the workflow to Catalyst 9800, and diagnose failures by their last successful stage.
objectives:
  v1: ["5.9", "5.10", "2.9"]
  v2: ["1.5.c"]
prereqs: [wireless-architecture, qos, aaa-tacacs-radius]
sectionIds:
  Separate the security functions: why-a-network-name-is-not-a-lock
  Follow authentication and key establishment: authentication-proving-who-is-joining
  Compare WEP, WPA, WPA2 and WPA3: encryption-and-integrity-generation-by-generation
  Choose Personal or Enterprise: personal-versus-enterprise
  Configure the WLAN through the GUI: building-a-wlan-in-the-wlc-gui
  Protect controller administration: managing-the-controller-securely
  Diagnose the last successful stage: verify-and-troubleshoot
  Exam focus: exam-focus
sources:
  - { title: "Cisco AireOS 8.10 — WLAN security", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_security.html" }
  - { title: "Cisco AireOS 8.10 — distribution ports and VLAN tagging", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/ports_and_interfaces.html" }
  - { title: "Cisco AireOS 8.10 — wireless quality of service", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wireless_quality_of_service.html" }
  - { title: "Cisco AireOS 8.10 — WLAN timeouts", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_timeouts.html" }
  - { title: "Cisco — how AireOS handles DHCP", url: "https://www.cisco.com/c/en/us/support/docs/wireless/4400-series-wireless-lan-controllers/110865-dhcp-wlc.html" }
  - { title: "Cisco Catalyst 9800 17.17 — WPA3", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-17/config-guide/b_wl_17_17_cg/m_wpa3.html" }
  - { title: "Cisco Catalyst 9800 — WLAN security configuration", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/config-guide/newconfigmodel/b_catalyst-9800-configuration-model/m_configuring-wlan-security.html" }
  - { title: "Cisco Catalyst 9800 — profiles and policy tags", url: "https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213911-understand-catalyst-9800-wireless-contro.html" }
  - { title: "Cisco Catalyst 9800 — configure 802.1X authentication", url: "https://www.cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/213919-configure-802-1x-authentication-on-catal.html" }
  - { title: "Cisco Catalyst 9800 26.x — configure a PSK through the GUI", url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/26-1/configuration-guide/wl-26-1-cg/private-sk/private-psk.html" }
  - { title: "RFC 3748 — Extensible Authentication Protocol", url: "https://www.rfc-editor.org/rfc/rfc3748" }
  - { title: "RFC 5216 — EAP-TLS authentication", url: "https://www.rfc-editor.org/rfc/rfc5216" }
  - { title: "RFC 8110 — Opportunistic Wireless Encryption", url: "https://www.rfc-editor.org/rfc/rfc8110" }
---

A radio signal does not stop at the office wall. Anyone within range of an AP can receive every frame a client sends, and anyone can transmit toward the AP. A WLAN therefore has to do what a switch port never had to: decide who may join, and make every frame unreadable and tamper-evident to everyone else in range.

Chapter 36 showed how a client finds an SSID and associates. Chapter 37 showed how a controller maps a WLAN to a VLAN, and chapter 33 introduced RADIUS. This chapter adds the security step that sits between association and the client's first DHCP request. By the end you will be able to name the cipher and authentication method of each WPA generation, choose between Personal and Enterprise mode, build a WPA2-PSK WLAN in the controller GUI, and tell from a client's state which stage of the join failed.

## Separate the security functions

:::facts
- **Authentication** establishes an identity or proves possession of a credential; **encryption** provides confidentiality; **integrity protection** detects unauthorized modification.
- WPA2-Personal uses a PSK with AES-CCMP. In Cisco's PSK fields, ASCII format accepts `8–63` characters; HEX accepts exactly `64` hexadecimal digits.
- WPA3-Personal uses **SAE** for password-based key establishment, followed by a four-way handshake. WPA3 connections require **PMF**.
- Enterprise WLANs use 802.1X/EAP with RADIUS: UDP `1812` authentication and `1813` accounting.
- Security generation (WPA2), cipher (AES) and key management (PSK or 802.1X) are separate settings. A client connects only when all three match.
:::

Wireless security does three separate jobs. **Authentication** checks that the client holds a valid credential: a shared passphrase, a username and password, or a certificate. **Encryption** scrambles each frame's data so that a listener captures only ciphertext. **Integrity protection** adds a **message integrity check (MIC)**, a keyed checksum. If a frame is altered in the air, the receiver's own calculation no longer matches and it drops the frame.

Keep the three apart, because the GUI and the exam both do. “AES” on a screen tells you how frames are encrypted, not whether users share one passphrase or log in individually.

Two settings look like security and are not. Disabling SSID broadcast removes the name from beacons only. The name still appears in the frames a client sends when it joins, and nothing is encrypted. **MAC filtering** admits clients by MAC address, but that address travels unencrypted in every frame header, so an attacker can read an allowed address and copy it.

WPA2 and WPA3 protect frames only between the client and the AP. Beyond the AP the data is ordinary wired traffic, so an HTTP page opened on a WPA3 WLAN still crosses the wired network in clear text. HTTPS protects an application end to end.

For the v1.1 exam, this chapter includes the practical GUI workflow required for WPA2-PSK. The v2.0 security topic still requires understanding the available wireless protections; the detailed legacy GUI is useful practice rather than a new v2.0 controller-configuration objective.

## Follow authentication and key establishment

A client joins a WPA2 WLAN in a fixed order, and each stage depends on the one before it:

1. **Open system authentication and association** set up the radio relationship from chapter 36. “Open system” means the client asks and the AP agrees; no credential is checked.
2. **The credential supplies a master key.** Personal mode computes it from the pre-shared key; Enterprise mode produces it from an individual 802.1X login.
3. **The four-way handshake** proves that both sides hold that key and derives the encryption keys.
4. Only then can the client send DHCP requests and user data.

WPA3-Personal replaces the open system exchange with SAE, described in the next section. The four-way handshake still follows.

### Personal mode: the pre-shared key

With **WPA2-Personal**, the WLAN and every client are configured with the same secret, the **pre-shared key (PSK)**. You normally type it as an ASCII passphrase of 8–63 characters. Each side combines the passphrase with the SSID to compute a 256-bit key. That is why the other input format is exactly 64 hexadecimal digits: 64 × 4 bits supplies the 256-bit key directly. The passphrase itself is never transmitted.

In the GUI, PSK and 802.1X are the two choices under **AKM**, authentication and key management.

### The four-way handshake

The 256-bit key is called the **pairwise master key (PMK)**. In Personal mode it comes from the passphrase; in Enterprise mode it comes out of the 802.1X exchange. Either way the PMK never encrypts data itself. The client and the infrastructure use it in four messages to prove that both hold the same PMK and to derive working keys.

```diagram
{"type":"sequence","title":"Fig 38.1 — A simplified WPA2 four-way handshake","actors":["Client","AP / authenticator"],"steps":[{"from":1,"to":0,"label":"1: infrastructure nonce"},{"from":0,"to":1,"label":"2: client nonce and integrity check","note":"permits checking that the client derived the correct key material","accent":true},{"from":1,"to":0,"label":"3: authenticated key information","note":"includes protected delivery of group-key information"},{"from":0,"to":1,"label":"4: confirmation"}],"caption":"This is a conceptual sequence, not a captured trace; knowing the SSID or retaining an old IP lease does not prove that it completed."}
```

Each side contributes a **nonce**, a random number used once. Both sides mix the PMK, the two nonces and their MAC addresses to derive the **pairwise transient key (PTK)**, which encrypts unicast traffic for this one client. Because the nonces are new every time, each session gets a fresh PTK even though the passphrase never changes. In message 3 the infrastructure also delivers the **group temporal key (GTK)**, which all clients of the BSS share so they can decrypt broadcast and multicast frames.

Follow a wrong passphrase through this sequence. LT1 is set to `StudyLab-2026` while the WLAN uses `StudyLab-2026!`. LT1 associates normally, because association checks no credential. Message 1 arrives, LT1 derives a PTK from its wrong PMK and uses it to compute the MIC on message 2. The controller computes the same MIC from the correct PMK, gets a different value and discards the message. The handshake never completes. The SSID stays visible and the user sees only “cannot connect”; a controller log or packet capture shows the failure at message 2.

### Enterprise mode: 802.1X and EAP

Enterprise mode gives every user or device its own credential and checks it on a central server. **802.1X** defines three roles:

- The **supplicant** is the client software asking for access.
- The **authenticator** controls access and passes authentication messages along. In a controller-based WLAN this is the WLC, with the AP relaying frames.
- The **authentication server** checks the credential. This is normally the RADIUS server from chapter 33.

Until authentication succeeds, the authenticator lets the client send authentication traffic and nothing else. The messages use **EAP**, the Extensible Authentication Protocol. Between client and WLC they travel as **EAPOL** (EAP over LAN); between WLC and server they travel inside RADIUS packets. When the server accepts the client, both ends hold a PMK, the server passes it to the WLC, and the four-way handshake runs exactly as in Personal mode.

EAP is only a framework. The **EAP method** decides which credentials are used:

| Method | How the client is authenticated | What to remember |
|---|---|---|
| LEAP | Username and password | Early Cisco method; broken and deprecated |
| EAP-FAST | A Protected Access Credential (PAC) from the server builds a tunnel; the user then authenticates inside it | Cisco method; needs no certificates |
| PEAP | The server presents a certificate and builds a TLS tunnel; the user proves a password inside it, commonly with MS-CHAPv2 | Only the server needs a certificate |
| EAP-TLS | Certificates on the server and on every client | Strongest; needs a PKI to issue client certificates |

With PEAP and EAP-TLS the client must validate the server's certificate. If you turn validation off to clear a connection error, the client will offer its credentials to any server that answers.

## Compare WEP, WPA, WPA2 and WPA3

Each generation exists because the one before it was broken or aging. For the exam, attach three things to each name: its cipher, its integrity check and its authentication choices.

| Generation | Encryption and integrity | Authentication choices | Status |
|---|---|---|---|
| WEP | RC4 with a static key and a short IV; CRC-based integrity check | Open or shared key | Broken; never select it |
| WPA | TKIP: RC4 with per-frame keys, plus the Michael MIC | Personal PSK or Enterprise 802.1X | Obsolete stopgap |
| WPA2 | AES-CCMP | Personal PSK or Enterprise 802.1X | The CCNA configuration choice |
| WPA3 | AES-CCMP or the stronger AES-GCMP; GCMP-256 in 192-bit Enterprise mode | Personal SAE or Enterprise 802.1X | Strongest; PMF required |

**WEP**, Wired Equivalent Privacy, encrypts with the RC4 cipher and one static key that every device shares. Each frame adds a 24-bit **initialization vector (IV)** sent in clear text. The IV is so short that values repeat on a busy network, and an attacker who collects enough frames can calculate the key. WEP's integrity check is a plain CRC, which an attacker can recompute after changing a frame.

**WPA** was a stopgap. It had to run on existing WEP hardware after a firmware update, so it kept RC4 and wrapped it in **TKIP**, the Temporal Key Integrity Protocol. TKIP mixes a different key for every frame, numbers frames so that replayed ones are rejected, and adds a real MIC named Michael.

**WPA2** replaced RC4 with AES, used in a mode called **CCMP**. AES in counter mode encrypts the frame and CBC-MAC produces the MIC, so one suite supplies both encryption and integrity.

**WPA3**, released in 2018, makes three changes you should know:

1. **SAE** replaces the PSK exchange in Personal mode.
2. **Protected Management Frames** become mandatory.
3. **GCMP**, a more efficient and stronger AES mode than CCMP, is available. GCMP-256 is required in WPA3-Enterprise's optional 192-bit mode.

On the exam, GCMP is the cipher to associate with WPA3. In practice WPA3-Personal also runs with CCMP-128, so a WPA3 WLAN that shows CCMP is not misconfigured.

### What SAE fixes

WPA2-PSK has one well-known weakness. An attacker in range records a single four-way handshake, takes the capture away and tests millions of candidate passphrases against it offline. A weak passphrase falls quickly to this dictionary attack.

**SAE**, Simultaneous Authentication of Equals, replaces the PSK step with an exchange in which every guess needs a live interaction with the network. A captured exchange is useless for offline guessing. SAE also gives **forward secrecy**: session keys do not depend on the password alone, so someone who records traffic today and learns the password next year still cannot decrypt the recording. After SAE finishes, the four-way handshake runs with the PMK that SAE produced.

### What PMF protects

Management frames such as deauthentication and disassociation were originally unprotected. An attacker could forge a deauthentication frame that appeared to come from the AP and knock a client off the WLAN. **Protected Management Frames (PMF)** add integrity protection to these frames once keys exist, so the client ignores forgeries. PMF is optional in WPA2 and required in WPA3. It does not hide beacons or the SSID, and it cannot stop RF jamming.

A **WPA2/WPA3 transition** WLAN accepts both generations on one SSID. WPA3 clients use SAE and PMF; WPA2 clients connect with the PSK as before. Each client gets the protection of the mode it negotiated, so a WPA2 client on a transition WLAN is still a WPA2 client.

WPA3-Enterprise keeps 802.1X/EAP authentication; it does not use SAE.

### Open networks: OWE and captive portals

A traditional open WLAN, such as a café hotspot, has no encryption at all. **Opportunistic Wireless Encryption (OWE)**, marketed as Enhanced Open, lets the client and AP run a key exchange during association, so each client gets its own encryption keys without typing a password. OWE encrypts but does not authenticate: your frames are protected from other listeners, yet nothing proves who operates the AP.

A **captive portal**, or **WebAuth**, is a Layer 3 mechanism. The client joins, receives an IP address, and its browser is redirected to a page where the user logs in or accepts terms. A portal on an open WLAN encrypts nothing. On the controller it is a Layer 3 security setting and can be combined with any Layer 2 security.

:::trap Do not combine three independent fields
“WPA2,” “AES” and “PSK” describe different parts of the configuration: security generation, cipher and key-management choice. The correct cipher with the wrong key-management method still fails to meet a WPA2-Personal requirement.
:::

## Choose Personal or Enterprise

The choice comes down to who holds the credential. In Personal mode everyone shares one secret. In Enterprise mode each user or device has its own.

Personal mode needs no server, which suits a home, a small office or a lab. The cost appears when someone leaves or a device is lost. Anyone who knows the passphrase can join again, and the only fix is to change it on the WLAN and on every legitimate device.

Enterprise mode needs a RADIUS server and, for PEAP or EAP-TLS, certificates. In return, you can disable one account or revoke one certificate and nobody else is affected, and the RADIUS logs record who connected. One caution: disabling an account stops that user's next authentication. A session that is already connected continues until it is cleared or the session timeout forces a new authentication.

| Requirement | Appropriate direction |
|---|---|
| Small isolated lab with no authentication server | WPA2-Personal for the required configuration exercise |
| Individual staff identity and lifecycle management | Enterprise with an appropriate EAP method and RADIUS |
| Passwordless public radio encryption without identity assurance | OWE, with its stated limitations |
| Accept terms before guest access | WebAuth plus a separately chosen radio-security design |

Keep the secrets in their own fields. The **RADIUS shared secret** is configured on the WLC and the RADIUS server and protects the messages between those two devices. It is not a user's password, the WLAN PSK or the controller administrator password.

## Configure the WLAN through the GUI

On a controller, a WLAN is the object that ties three things together: an SSID, a security policy and a controller interface, which supplies the VLAN. Creating a WLAN means filling in those three and enabling it. Before you start, the controller must be reachable and at least one AP must have joined it, as in chapter 37.

The lab's AireOS-style controller connects to its switch with a trunk. A management VLAN value of `0` means the controller sends management traffic untagged, so the switch places it in the trunk's native VLAN.

On **AireOS-style** screens, work in this order. Packet Tracer's controller follows the same layout.

| Page | Configuration for the example |
|---|---|
| WLANs → Create New | Profile `CCNA-USERS`; SSID `CCNA-Lab`; unused ID `2` |
| General | Choose the intended interface; keep WLAN disabled during security edits |
| Security → Layer 2 | WPA2 enabled; AES enabled; legacy WPA/TKIP off; PSK enabled; 802.1X off |
| PSK field | ASCII `StudyLab-2026!`, a lab-only example |
| Security → Layer 3 | No web authentication for this simple Personal WLAN |
| QoS / Advanced | Inspect and record relevant settings; avoid unrelated changes |
| General, then save | Enable; Apply; Save Configuration |

The **profile name** is the controller's own name for the WLAN object. The **SSID** is the name clients see and select; it can be up to 32 bytes long (32 plain characters) and must match exactly, including case. The **WLAN ID** is the WLAN's number on the controller. AireOS numbers WLANs from 1 to 512, and one AP advertises at most 16 of them.

The **Interface/Interface Group** field on the General tab maps the WLAN to a VLAN. It names a controller interface from chapter 37: either `management` or a dynamic interface such as `users`. That interface carries the VLAN number, an IP address and gateway in that VLAN, and the DHCP server address. Clients of the WLAN land in that VLAN, so the switch trunk must carry it and a DHCP server must serve it.

```output Representative AireOS WLAN security worksheet
WLAN ID / Profile / SSID    2 / CCNA-USERS / CCNA-Lab
WPA Policy                 Disabled        ← no legacy WPA
WPA2 Policy                Enabled
AES                         Enabled
TKIP                        Disabled
AKM 802.1X                 Disabled        ← this WLAN uses a shared PSK
AKM PSK                    Enabled
PSK format                 ASCII           ← enter the secret; do not publish it in a support screenshot
```

The Layer 2 dropdown is labeled `WPA+WPA2`. Selecting it only opens the parameters for both generations; the checkboxes below decide which are enabled. A new AireOS WLAN defaults to WPA2 with AES and **802.1X** key management. If you create a WLAN and enable it without visiting the Layer 2 page, it expects a RADIUS server and every PSK client fails. Untick 802.1X, tick PSK and enter the key.

The QoS tab sets the highest priority the WLAN's traffic may receive. AireOS offers four profiles: **Platinum** for voice, **Gold** for video, **Silver** for best effort and **Bronze** for background. Silver is the default. The profiles line up with **WMM** (Wi-Fi Multimedia), which sorts frames into four matching access categories so that voice waits less for the radio than a file download does. A profile sets priority, not a bandwidth guarantee, and the wired network still needs the QoS design from chapter 28.

The Advanced tab holds policies that change client behavior:

| Setting | What it does |
|---|---|
| Session timeout | How long a client session lasts before the client must authenticate again; `1800` seconds is 30 minutes |
| Client exclusion | Blocks a client for a set time after repeated failures, such as several failed authentications |
| DHCP address assignment required | Admits only clients that obtain their address through DHCP; a client with a static address is blocked |
| P2P blocking | Stops clients on the same WLAN from sending traffic directly to each other |
| AAA override | Lets attributes returned by RADIUS, such as a VLAN, replace the WLAN's own settings for that client |

Read these as possible causes. If users report a drop every half hour, an 1800-second session timeout is a suspect; confirm it against the client's timestamps before changing anything.

On **Catalyst 9800**, the settings that AireOS keeps in one WLAN are split into reusable objects. A **WLAN profile** holds the SSID and security. A **policy profile** holds the client VLAN and switching policy. A **policy tag** maps WLAN profiles to policy profiles, and an AP advertises only the WLANs in the policy tag assigned to it. The workflow follows that chain:

1. Configuration → Tags & Profiles → WLANs: create/select the WLAN, set SSID/ID and the required Layer 2 security.
2. Configuration → Tags & Profiles → Policy: create an enabled policy profile with the client VLAN and the intended central/local switching policy.
3. Tags → Policy: map that WLAN profile to that policy profile.
4. Configuration → Wireless → Access Points: assign the policy tag to the intended APs, then verify their effective assignment and operational state.
5. Apply and save the configuration, then test a client.

This IOS XE excerpt shows the security part of the same WLAN on a 9800, for reference. Packet Tracer's controller does not accept it.

```ios WLC — optional Catalyst 9800 security excerpt
WLC(config)# wlan CCNA-USERS 2 CCNA-Lab
WLC(config-wlan)# shutdown
WLC(config-wlan)# no security wpa akm dot1x
WLC(config-wlan)# security wpa wpa2
WLC(config-wlan)# security wpa wpa2 ciphers aes
WLC(config-wlan)# security wpa akm psk
WLC(config-wlan)# security wpa psk set-key ascii 0 StudyLab-2026!
WLC(config-wlan)# no shutdown
WLC(config-wlan)# exit
```

The `0` says that you are typing the key unencrypted. Treat the command and any exported configuration as sensitive.

## Protect controller administration

The controller stores every PSK and RADIUS secret and controls every AP, so protect its own management access as you would a router's. Use HTTPS for the web interface and SSH for the CLI. HTTP and Telnet send the administrator password in clear text.

| Access/service | Common port | Meaning |
|---|---|---|
| HTTPS | TCP 443 | Encrypted web administration; validate server identity |
| SSH | TCP 22 | Protected CLI; validate host identity |
| HTTP / Telnet | TCP 80 / 23 | Unprotected alternatives; avoid routine administration |
| RADIUS authentication/accounting | UDP 1812 / 1813 | Network-access AAA, distinct from WLAN PSK entry |

A simulator's first-time setup may use HTTP, which is acceptable only in an isolated lab.

Limit which addresses can reach the management interface, give each administrator a separate account, and keep the clock synchronized so certificate checks and log timestamps are reliable. Ordinary WLAN clients should not be able to reach the management interface.

On AireOS, **Apply** changes the running configuration and **Save Configuration** stores it so that it survives a restart. This is the same split as running-config and startup-config on a router.

## Diagnose the last successful stage

A client join happens in a fixed order, so the fastest diagnosis is to find the last stage that worked and examine the next one.

| Last evidence | Next investigation |
|---|---|
| No compatible SSID appears | AP/radio state, WLAN enabled state, band support and effective AP assignment |
| SSID visible but security incomplete | Cipher/AKM/PMF compatibility, client profile, credentials and authentication records |
| Security authorized, no usable address | VLAN mapping, DHCP service, trunk/relay and address policy |
| Address present, portal pending | WebAuth state, permitted portal/DNS reachability |
| Client admitted with correct address | Gateway, ACL, DNS and destination/application path |

An AireOS controller records the stage as the client's **Policy Manager State**. `8021X_REQD` means the 802.1X exchange or the PSK four-way handshake has not finished. `DHCP_REQD` means security is complete and the controller is waiting for the client to obtain an address. `WEBAUTH_REQD` means a portal login is pending. `RUN` means the client is admitted and forwarding.

```output Representative abbreviated AireOS client record
Client State                 Associated
Wireless LAN ID              2
Policy Manager State         DHCP_REQD     ← controller is waiting at the addressing stage
IP Address                   Unknown
Interface / VLAN             users / 20    ← inspect this specific client VLAN path
```

`Associated` proves only that open system authentication and association finished. `DHCP_REQD` is the useful line: security has passed and addressing has not, so check the `users` interface, VLAN 20 on the trunk and that VLAN's DHCP server. Changing the passphrase would fix nothing. A client stuck in `8021X_REQD` on a PSK WLAN points the other way, toward the passphrase or the AKM setting.

AireOS `show wlan summary`, `show wlan 2` and `show client detail` support this investigation. Catalyst 9800 uses commands such as `show wlan summary` and `show wireless client mac-address 000c.294a.1b7e detail`. Use the simulator's client/WLAN GUI when CLI is unavailable.

`RUN` is not the end of the test. Check the client's address, mask and gateway, then ping the gateway and a known server. One trap is real: a client can still display yesterday's address while today's handshake is failing, so reconnect and renew the lease before you conclude that security or DHCP works.

## Exam focus

- Match each generation to its cipher: WEP uses RC4, WPA uses TKIP, WPA2 uses AES-CCMP, and WPA3 adds AES-GCMP.
- Personal mode means a PSK (WPA, WPA2) or SAE (WPA3). Enterprise mode means 802.1X/EAP with RADIUS: supplicant, authenticator, authentication server.
- WPA3 adds SAE, mandatory PMF and forward secrecy and keeps the four-way handshake. OWE encrypts without authenticating.
- Build WPA2-Personal in the GUI: profile name, SSID, ID and interface; WPA2 Policy, AES and PSK with 802.1X off; enable, Apply, Save Configuration.
- Know the QoS profiles (Platinum, Gold, Silver, Bronze) and the Advanced settings.
- On a 9800, follow WLAN profile → policy profile → policy tag → AP assignment.
- Diagnose from the client's current stage (`8021X_REQD`, `DHCP_REQD`, `RUN`), then prove recovery with a fresh client test.
