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

A visible SSID tells a client which network it might join. It does not establish who operates that network, who may use it, or how traffic is protected. A complete WLAN configuration connects the security method to a client VLAN, address service and forwarding policy. You will verify each of those parts separately.

## Separate the security functions

:::facts
- **Authentication** establishes an identity or proves possession of a credential; **encryption** provides confidentiality; **integrity protection** detects unauthorized modification.
- WPA2-Personal commonly uses a PSK with AES-CCMP. In Cisco's PSK fields, ASCII format accepts `8–63` characters; HEX accepts exactly `64` hexadecimal digits.
- WPA3-Personal uses **SAE** for password-based key establishment, followed by a four-way handshake. WPA3 connections require **PMF**.
- Enterprise WLANs commonly use 802.1X/EAP with RADIUS: UDP `1812` authentication and `1813` accounting.
- The selected cipher, authentication/key-management method, VLAN policy and client state are separate facts. Check all of them.
:::

Disabling SSID broadcast does not turn the SSID into a secret. An observer can learn the name through other wireless exchanges, and a hidden name adds no encryption. **MAC filtering** uses an address that can be observed and imitated; it is not a substitute for strong client authentication.

A secure WLAN also does not replace end-to-end application protection. WPA2/WPA3 protect the client–AP radio link. HTTPS protects an application connection beyond that link. An administrator should not infer that every server connection is secure simply because the wireless icon has a lock.

For the v1.1 exam, this chapter includes the practical GUI workflow required for WPA2-PSK. The v2.0 security topic still requires understanding the available wireless protections; the detailed legacy GUI is useful practice rather than a new v2.0 controller-configuration objective.

## Follow authentication and key establishment

In a conventional WPA2 join, an initial 802.11 open-system authentication exchange and association establish the radio relationship. “Open system” in that exchange does not mean the resulting WPA2 WLAN has no security. The security exchange must still succeed before ordinary protected data access is authorized. WPA3-SAE has a different authentication exchange, so do not generalize this WPA2 sequence to every WLAN.

With **WPA2-Personal**, the client and infrastructure use a common configured secret, the **pre-shared key (PSK)**. An ASCII passphrase and the SSID derive the shared master key; the passphrase is not sent as clear text in the four-way handshake. Entering a raw PSK as 64 hex digits supplies that key directly. This PSK format rule is not a universal statement about all possible SAE password representations. A GUI may group PSK and 802.1X under **AKM**, authentication and key management: that field chooses how the necessary key material is established.

The **pairwise master key (PMK)** is input to the **four-way handshake**. Both sides exchange nonces, which are fresh values used in key derivation, and prove possession of the necessary key material. They derive a **pairwise transient key (PTK)** for the individual client relationship. The infrastructure also securely delivers a **group temporal key (GTK)** used for group-addressed traffic. The GTK is not simply another copy of that client's PTK.

```diagram
{"type":"sequence","title":"Fig 38.1 — A simplified WPA2 four-way handshake","actors":["Client","AP / authenticator"],"steps":[{"from":1,"to":0,"label":"1: infrastructure nonce"},{"from":0,"to":1,"label":"2: client nonce and integrity check","note":"permits checking that the client derived the correct key material","accent":true},{"from":1,"to":0,"label":"3: authenticated key information","note":"includes protected delivery of group-key information"},{"from":0,"to":1,"label":"4: confirmation"}],"caption":"This is a conceptual sequence, not a captured trace; knowing the SSID or retaining an old IP lease does not prove that it completed."}
```

For a wrong WPA2 PSK, a common diagnostic finding is an invalid integrity check on message 2: the two sides derived different key material. A diagnostic may call that check the **message integrity code (MIC)**. An ordinary “cannot connect” popup does not identify that exact message; a suitable capture or controller diagnostic is needed. Packet loss and capability mismatches can also interrupt a security exchange.

**802.1X** supplies a framework for controlled access. The **supplicant** is the client. The **authenticator** controls admission and carries authentication messages. The **authentication server** evaluates the selected method. In a centrally authenticated controller-based WLAN, these roles are usually client, WLC and RADIUS server respectively, with the AP relaying wireless exchanges. Other deployments, including local authentication, can place functions differently.

**EAP** is an authentication framework carried over LAN as **EAPOL**, and commonly carried between the WLC and authentication server inside RADIUS. The EAP method determines how credentials are checked. For example, **EAP-TLS** uses client and server certificates. A typical **PEAP with MS-CHAPv2** deployment uses a server-certificate-protected tunnel for password-based client authentication. Correct server-certificate validation is essential; disabling it to clear a connection error undermines the intended server identity check. Legacy LEAP and EAP-FAST may appear in older material, but their detailed message phases are outside the required configuration exercise here.

## Compare WEP, WPA, WPA2 and WPA3

| Generation | Main protection to recognize | Authentication choices | Practical interpretation |
|---|---|---|---|
| WEP | RC4 with weak key/IV design; CRC-based integrity is inadequate | Legacy open/shared-key mechanisms | Obsolete; do not select for a new WLAN |
| WPA | TKIP, based on RC4, with Michael integrity protection | Personal PSK or Enterprise | Obsolete compatibility technology |
| WPA2 | AES-CCMP is the standard CCNA configuration choice | Personal PSK or Enterprise 802.1X | Configure AES rather than legacy TKIP |
| WPA3 | Modern cipher requirements depend on the mode; Personal can use CCMP-128 | Personal SAE or Enterprise | Require PMF; do not equate every WPA3 WLAN with GCMP-256 |

**CCMP** combines AES-based encryption and integrity protection. The important distinction is that it replaces the WEP/TKIP mechanisms; AES is the underlying cipher, not the complete WLAN authentication method. A screen displaying “AES” cannot by itself tell you whether users have a shared passphrase or individual Enterprise credentials.

**SAE**, Simultaneous Authentication of Equals, changes password-based key establishment. It is designed to prevent using a captured passive exchange as the same offline password-verification opportunity available with WPA2-PSK and to provide forward secrecy. These benefits do not make a weak password, vulnerable implementation or unpatched client acceptable. SAE does not eliminate the subsequent four-way handshake.

**Forward secrecy** means that learning the long-term password later should not, by itself, reveal past session keys from previously captured exchanges. It is a property of the key-establishment design, not a promise that a compromised endpoint cannot expose its current data.

**Protected Management Frames (PMF)** protect specified robust management frames, including deauthentication and disassociation, once the necessary security relationship exists. PMF does not encrypt every beacon, conceal the SSID, prevent RF jamming or guarantee uninterrupted service. A WPA2/WPA3 transition WLAN can accommodate legacy WPA2 clients while requiring PMF for clients using WPA3; that is not equivalent to every connected client receiving WPA3 protection.

WPA3-Enterprise continues to use Enterprise authentication, not SAE. Its optional high-security 192-bit mode has more specific cipher and EAP requirements, including GCMP-256 in the documented Cisco configuration. That specialized mode must not become the definition of all WPA3 traffic.

**Opportunistic Wireless Encryption (OWE)**, associated with Enhanced Open, provides encryption without a shared user password or authenticated AP identity. It reduces passive exposure on an otherwise open radio link. It does not prove that a hotspot is operated by the business named on its sign. Continue validating application/server identities.

A **captive portal** or **WebAuth** page is another separate mechanism: it can require a login or acceptance of terms after the client has enough IP connectivity to reach it. A portal alone does not encrypt an open WLAN's radio data. It can be combined with a separately encrypted WLAN.

:::trap Do not combine three independent fields
“WPA2,” “AES” and “PSK” describe different parts of the configuration: security generation, cipher and key-management choice. The correct cipher with the wrong key-management method still fails to meet a WPA2-Personal requirement.
:::

## Choose Personal or Enterprise

Personal mode is convenient when a small set of devices can securely share one secret. In a basic single-PSK WLAN, anyone retaining that secret can attempt future joins. Rotating it requires updating all legitimate devices using it.

Enterprise credentials let administrators manage users or devices separately. Disabling one account or revoking one certificate can prevent future successful authentication without replacing everybody else's credential. Existing sessions and cached credentials require the site's session-termination and reauthentication policy; account revocation does not magically terminate every active radio connection immediately.

| Requirement | Appropriate direction |
|---|---|
| Small isolated lab with no authentication server | WPA2-Personal for the required configuration exercise |
| Individual staff identity and lifecycle management | Enterprise with an appropriate EAP method and RADIUS |
| Passwordless public radio encryption without identity assurance | OWE, with its stated limitations |
| Accept terms before guest access | WebAuth plus a separately chosen radio-security design |

The **RADIUS shared secret** is between the network access device and RADIUS server. It is not the user's password, the WPA2 PSK or the controller administrator password. Mixing these fields is a configuration error, even if a device happens to accept the same text in more than one place.

## Configure the WLAN through the GUI

Begin with a working management path and a joined AP. Write the intended SSID, security, VLAN and DHCP design before changing a page. The lab uses a flat isolated network to keep its security checks observable; a production design normally separates client and management access according to policy.

The lab's AireOS-style controller uses a distribution-system trunk, as Cisco documents for that platform. A management VLAN value of `0` means untagged on the controller; the switch's native VLAN determines which VLAN receives those frames. A single-VLAN lab can still use a trunk with only that native VLAN allowed.

On **AireOS-style** screens, follow this order. Field labels below are representative of the documented interface, not a guarantee that every Packet Tracer model exposes every tab.

| Page | Configuration for the example |
|---|---|
| WLANs → Create New | Profile `CCNA-USERS`; SSID `CCNA-Lab`; unused ID `2` |
| General | Choose the intended interface; keep WLAN disabled during security edits |
| Security → Layer 2 | WPA2 enabled; AES enabled; legacy WPA/TKIP off; PSK enabled; 802.1X off |
| PSK field | ASCII `StudyLab-2026!`, a lab-only example |
| Security → Layer 3 | No web authentication for this simple Personal WLAN |
| QoS / Advanced | Inspect and record relevant settings; avoid unrelated changes |
| General, then save | Enable; Apply; Save Configuration |

The **profile name** identifies the controller object; the **SSID** is the name selected by clients; the **WLAN ID** identifies the WLAN internally. SSIDs have a maximum length of 32 octets, which is not always the same as 32 characters in every encoding. Use the exact spelling and case at both ends.

AireOS's **Interface/Interface Group** field supplies the base WLAN-to-VLAN mapping. If it names `users`, inspect that dynamic interface's VLAN, port, IP/gateway and DHCP-server settings. The switch trunk must carry the selected VLAN. In DHCP-proxy designs, configure an appropriate primary DHCP server on the interface or a documented WLAN override; creating a dynamic interface does not create a DHCP server.

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

The dropdown name `WPA+WPA2` can lead to the parameters for both generations; it does not prove both are enabled. Read the individual checkboxes. Documented AireOS WLAN defaults include 802.1X key management, so deliberately configure PSK instead of assuming a newly created object already matches the requirement.

The QoS tab commonly presents **Platinum** for voice, **Gold** for video, **Silver** for best effort and **Bronze** for background. AireOS documents Silver as its default WLAN QoS level. These policies interact with classification, markings and WMM access categories; selecting Platinum does not guarantee bandwidth or transform every web packet into voice. **WMM** distinguishes radio access categories so delay-sensitive traffic can receive appropriate treatment. Actual end-to-end QoS still needs a consistent wired and wireless design.

Read Advanced settings as policies, not unexplained numbers to copy:

| Setting | What to check |
|---|---|
| Session timeout | Duration and authentication method; expiration behavior is policy-dependent |
| Client exclusion | Trigger and remaining time for the actual client; avoid assuming every failure causes exclusion |
| DHCP required | Whether the controller requires learned DHCP addressing, which can affect static clients |
| P2P blocking | Whether intra-WLAN/client forwarding is dropped or sent upstream; scope varies by switching mode |
| AAA override | Whether authorized server attributes can replace selected base client policies |

Do not diagnose “drops every 30 minutes” as a bad certificate merely because a screen shows `1800` seconds. Correlate timestamps, configured timers and actual failure records.

On **Catalyst 9800**, the equivalent workflow uses objects:

1. Configuration → Tags & Profiles → WLANs: create/select the WLAN, set SSID/ID and the required Layer 2 security.
2. Configuration → Tags & Profiles → Policy: create an enabled policy profile with the client VLAN and the intended central/local switching policy.
3. Tags → Policy: map that WLAN profile to that policy profile.
4. Configuration → Wireless → Access Points: assign the policy tag to the intended APs, then verify their effective assignment and operational state.
5. Apply and save the configuration, then test a client.

This is a translation for a controller whose management, AP join and VLAN foundation already work. A Packet Tracer AireOS-style GUI is not an IOS XE 9800 emulator. The following optional IOS XE excerpt shows only the security portion; it is not a complete controller deployment:

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

The `0` describes clear-text command input. Treat both the command and exported configuration as sensitive; do not infer secure secret storage solely from that input flag.

## Protect controller administration

Use HTTPS for the web interface and SSH for supported remote CLI administration. Validate the controller's identity through its certificate or an authorized, independently established trust procedure; a login page appearing at an address is not sufficient proof. Initial simulator setup may use HTTP, but that exception does not justify sending production administrator credentials over an unprotected connection.

| Access/service | Common port | Meaning |
|---|---|---|
| HTTPS | TCP 443 | Encrypted web administration; validate server identity |
| SSH | TCP 22 | Protected CLI; validate host identity |
| HTTP / Telnet | TCP 80 / 23 | Unprotected alternatives; avoid routine administration |
| RADIUS authentication/accounting | UDP 1812 / 1813 | Network-access AAA, distinct from WLAN PSK entry |

Read the actual management settings instead of depending on an assumed factory default. Limit administrator reachability and privileges, use separate administrator credentials and keep time synchronized for certificate checks and useful logs. Whether wireless clients may manage the controller is a separate policy; ordinary WLAN data access need not include management access.

On AireOS, Apply updates the active setting and Save Configuration preserves it for restart. Save the Packet Tracer project as well. On a real controller, confirm the appropriate configuration-persistence operation for that platform rather than using a reload as a test.

## Diagnose the last successful stage

A useful diagnosis states both the evidence and its limit.

| Last evidence | Next investigation |
|---|---|
| No compatible SSID appears | AP/radio state, WLAN enabled state, band support and effective AP assignment |
| SSID visible but security incomplete | Cipher/AKM/PMF compatibility, client profile, credentials and authentication records |
| Security authorized, no usable address | VLAN mapping, DHCP service, trunk/relay and address policy |
| Address present, portal pending | WebAuth state, permitted portal/DNS reachability |
| Client admitted with correct address | Gateway, ACL, DNS and destination/application path |

```output Representative abbreviated AireOS client record
Client State                 Associated
Wireless LAN ID              2
Policy Manager State         DHCP_REQD     ← controller is waiting at the addressing stage
IP Address                   Unknown
Interface / VLAN             users / 20    ← inspect this specific client VLAN path
```

“Associated” alone does not prove successful WPA key establishment. A controller diagnostic showing security complete and a current `DHCP_REQD` state directs attention to addressing. A configured cipher displayed elsewhere is not independently proof of a negotiated client cipher.

AireOS `show wlan summary`, `show wlan 2` and `show client detail` support this investigation. Catalyst 9800 uses commands such as `show wlan summary` and `show wireless client mac-address 000c.294a.1b7e detail`. Use the simulator's client/WLAN GUI when CLI is unavailable.

A client in `RUN` or `Run` has reached an admitted forwarding state, not a guarantee that every application or Internet destination works. Verify its current address, mask and gateway, then a known local destination, a routed destination if present, and DNS only when a DNS service has actually been configured. Old leases and cached profiles can remain after a fault, so deliberately start a fresh test when diagnosing authentication or DHCP.

## Exam focus

- Distinguish security generation, cipher, key management and client policy.
- Recognize WEP/TKIP as obsolete; configure WPA2-Personal with AES and PSK for the required GUI exercise.
- Explain SAE, retained four-way handshake, PMF limitations, Enterprise roles and OWE's lack of authenticated identity.
- Configure and verify SSID, security, VLAN/interface mapping, enabled state, QoS/advanced settings and saved configuration.
- On a 9800, follow WLAN profile → policy profile → policy tag → AP assignment.
- Diagnose from current stage evidence, then prove recovery with the intended client and traffic.
