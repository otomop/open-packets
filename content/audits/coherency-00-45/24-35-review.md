# Chapters 24–35: sequential coherency review

Reviewed 2026-09-24 against the captured pre-coherency baseline. Read all 72 assigned files in full: 12 lessons, 12 labs and 48 practice banks. Checked actual earlier lesson sections listed in the coverage ledger. Chapter order and all chapter/section/practice IDs are preserved.

Practice totals: {"questions":274,"cards":238,"commands":102,"tickets":27}. Added 0, retired 0; revised only file-management-q21 explanation. Changed 16 chapter asset files. No design, app code, deployment or repository history changed by this subtask.

## Chapter findings

### 24: DHCP

- Added incoming bridge: DHCP supplies familiar manually configured parameters but cannot create VLANs or routing.
- LabStep1 explains A-record lookup then separate HTTP, recalling06 before full DNS25.
- Added exit handoff: correct lease does not prove resolver answer.

Retained: Kept DORA→renewal→server/client/relay→diagnosis order and complete independent challenge. All practice retained; conditional message delivery, return routes and one-fault recovery are already coherent.

Bounded previews: One-record DNS setup is supplied here;25 owns recursive/authoritative diagnosis. Option82 revisits16 without requiring production relay-information policy design.

### 25: DNS

- Added earlier IPv6 prerequisite for AAAA/reverse IPv6 practice.
- Defined SOA at first negative-cache use before TTL/MINIMUM fields.

Retained: Same-service IP/name comparison is valid for the controlled lab. Paper MX/NS/PTR/IPv6 path remains explicit where simulator commands are unavailable.

Bounded previews: Detailed zone administration/timers remain context rather than an undeclared DNS server deployment exercise.

### 26: NAT and PAT

- Added TCP/UDP prerequisite and entry bridge connecting changed fields to06 and return path18.
- Expanded ACL and defined implicit deny as translation nonselection before first selector example.
- Confirmed existing lesson, labSteps2/9 and q10/t01 already teach router-source differences and unselected traffic remaining untranslated under explicit routing/no-drop assumptions needed by44.

Retained: Kept stopping old traffic and removing old mappings before testing alternatives. No NAT-as-firewall claim; every bank preserves selector/filter distinction.

Bounded previews: Only source-selector subset introduced here;34 owns ordered interface/VTY filters.

### 27: NTP, syslog and SNMP

- Added NAT prerequisite for source-selector recall.
- Explained octal377 through known binary/decimal arithmetic.
- Expanded MIB/OID; explained auth/privacy before v3 table; made v2c Inform support explicit.
- Decoded host, ro and ACL-number attachment before SNMP example.

Retained: NTP precedes timestamp correlation and sampled counters. Local-master is an isolated reference, not production time-accuracy recommendation.

Bounded previews: SNMPv3 levels conceptual; full cryptographic user/group configuration not imposed before32. Exact-host ACL taught locally;34 owns general filtering.

### 28: QoS

- Added trunks prerequisite for PCP foundation.
- Defined codec/G.711 role and RTP sequence/timestamp purpose before first voice-overhead calculation.

Retained: Lower drill count and mechanism-focused practice match describe/explain scope. No new requirement to configure codecs or RTP applications.

Bounded previews: Optional MQC follows required conceptual worksheet; advanced QoS algorithm/voice endpoint configuration is not required recall.

### 29: Configuration and software files

- Defined file hashes, key pair and fingerprints before secure lab.
- Explained EXEC authorization before relying on chapter33 knowledge.
- LabStep9 supplies official Ubuntu installation route, isolated VM/NIC, sudo/user shell context, editor and ownership/permission explanations.
- LabStep10 explains routed port and each local AAA list/binding before fresh-device block; public-key text creation has editor steps.
- Fixed file-management-q21 explanation from positional wording to the actual correct SCP action; options/answer/ID unchanged.

Retained: Preserved separate v1 simulator and v2 secure-execution requirements; paper is not claimed live transfer. Strict host-key enforcement and no weakened-algorithm workaround remain.

Bounded previews: VM preparation scoped to one transfer endpoint;39 owns virtualization design. Local AAA supports SCP now;33 owns centralized groups/fallback/accounting. Image activation/reload remain excluded.

### 30: Client OS troubleshooting

- Defined virtual adapter before VPN/VM references.
- Added local WLAN/AP/SSID/profile/association primer.
- Explained Personal/Enterprise, EAP, cipher and SAE before practice uses these labels.
- Peer review identified HTTPS certificate/clock assumptions before32; added server identity/key binding and validity-period bridge at the first mention.

Retained: Kept endpoint chapter before toolkit31 and radio36. No assessment requires deploying later wireless infrastructure.

Bounded previews: Client-facing wireless recognition is intentional preparation for36–38, not a dependency on later controller/RADIUS configuration. VPN/VM design remains35/39; only interface selection used here.

### 31: Troubleshooting toolkit

- Added client OS and QoS prerequisites and incoming host→path/counter bridge.
- Explained show logging pipe/include before drill.
- Verified /32 Null0 challenge rests on17 discard/longest-prefix and18 host-route teaching.

Retained: Preserved one-fault observations before repair and explicit independent recovery. HTTP503 is supplied application evidence, not a future API prerequisite.

Bounded previews: Capture collection syntax is platform-specific; supplied interpretation remains valid without undeclared software setup.

### 32: Security concepts

- Added file-management prerequisite for explicitly recalled trusted-key/hash foundation.
- Built certificate/CA explanation from earlier SSH trusted-key experience.
- Defined salt before stored-verifier interpretation.

Retained: Kept conceptual required path and optional hardening extension. No attack execution or new production policy prescribed.

Bounded previews: IPsec remains a named protection example until35. Quiet-mode ACL is a described source exception;34 teaches full source policy.

### 33: AAA with TACACS+ and RADIUS

- Added opening handoff from08 local access,32 least privilege and29 supplied local AAA.
- No further reordering or bank correction justified by full read.

Retained: Modern/classic syntax and explicit RADIUS ports preserved. EXEC authorization/accounting/list semantics taught before drills; central rejection does not fall back to local.

Bounded previews: 802.1X/remote-access use cases do not require deploying later systems. Full identity-server policy design outside client-focused exercise.

### 34: Access control lists

- Added earlier IOS and NAT prerequisites and selector→filter transition.
- Replaced unexplained XOR/NOT algebra with existing compare-zero-bits rule; kept noncontiguous/unaligned examples.

Retained: Scoped absent/empty behavior, stateless established and safe replacement remain. Every practice rule/syntax has prior local teaching or supplied setup.

Bounded previews: VPN selector is a use-case preview developed35. IPv6 ACL/advanced firewall design excluded from required configuration.

### 35: VPNs & IPsec

- Added NAT/security prerequisites.
- Expanded IPsec/IKE and symmetric encryption; defined GRE at first use.
- Added compatible-proposal/key-length example before mismatch ticket.
- Annotated optional algorithm/PRF/DH/HMAC roles before configuration.

Retained: Specific hardware/mapped interfaces, separate worksheet and no IKEv1 downgrade retained. No reason to move VPN ahead of30 now that30 teaches bounded adapter vocabulary.

Bounded previews: Full IKEv2 implementation optional; required outcome is describe. GRE/DMVPN construction and advanced MTU design remain outside scope.

## Boundary evidence

- 06 now teaches controlled DNS/A-record setup;24 recalls query then HTTP, and25 owns detailed DNS diagnosis.
- 04/06 teach binary/ports/flags.26 introduces ACL selection,27 adds exact-host/community binding,34 owns full interface/VTY policy.
- 18 teaches router-source and return-path reasoning.26 explicitly retains untranslated nonmatches and host/router source distinctions before44 PAT.
- 29 locally explains AAA and Linux/VM preparation for secure transfer;33 owns central methods/fallback,39 owns virtualization. The v2 execution requirement remains distinct from a paper alternative.
- 30 locally introduces client wireless/security and certificate labels before32 and36–38 develop them.31 consolidates endpoint→switch/router/service evidence.
- 35 describes required VPN outcomes with complete independent worksheet; optional implementation uses supported hardware and supplied annotated configuration.

## Primary sources checked

- [Cisco current exam](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html): current v1.1 identity; existing track-specific scope preserved.
- [RFC1035](https://www.rfc-editor.org/rfc/rfc1035.html) and [RFC2308](https://www.rfc-editor.org/rfc/rfc2308.html): SOA and negative caching.
- [Cisco SNMP](https://www.cisco.com/c/en/us/support/docs/ip/simple-network-management-protocol-snmp/20370-snmpsecurity-20370.html), [RFC3416](https://www.rfc-editor.org/rfc/rfc3416.html), [RFC3414](https://www.rfc-editor.org/rfc/rfc3414.html): source/community binding, Inform and protection levels.
- [RFC3550](https://www.rfc-editor.org/rfc/rfc3550.html): RTP sequence/timestamp role and lack of QoS guarantee.
- [Ubuntu installation](https://ubuntu.com/tutorials/install-ubuntu-desktop), [Ubuntu OpenSSH](https://ubuntu.com/server/docs/how-to/security/openssh-server/), [GNU permissions](https://www.gnu.org/software/coreutils/manual/html_node/Numeric-Modes.html), [Cisco SCP](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m_sec-usr-ssh-sec-copy-0.html): supplied environment/local AAA.
- [Cisco WLAN security](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-10/config-guide/b_cg810/wlan_security.html): client security terminology.
- [Cisco IKEv2](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m_sec-cfg-ikev2-flex.html): proposal parameter roles.

## Verification and limits

Content validation passed with 0 errors and 10 preexisting objective-tag warnings in00/01. Coverage generation verified every entry anchor in an earlier current lesson, every introduced anchor in its owner lesson, and unchanged section/item ID sequences against baseline. Practice content differs only in the named q21 explanation.

No Packet Tracer, IOS XE, Linux VM or workstation exercise was executed. Representative evidence remains labeled; unsupported-platform limits are explicit. No build, commit, push or deployment performed. Peer review of24–35 assigned to12–23 owner; minor30 certificate bridge incorporated before freeze.

Changed assets:

- content/chapters/24-dhcp/chapter.md
- content/chapters/24-dhcp/lab.md
- content/chapters/25-dns/chapter.md
- content/chapters/26-nat-pat/chapter.md
- content/chapters/27-ntp-syslog-snmp/chapter.md
- content/chapters/28-qos/chapter.md
- content/chapters/29-file-management/chapter.md
- content/chapters/29-file-management/lab.md
- content/chapters/29-file-management/questions.json
- content/chapters/30-client-os-troubleshooting/chapter.md
- content/chapters/31-troubleshooting-toolkit/chapter.md
- content/chapters/32-security-concepts/chapter.md
- content/chapters/33-aaa-tacacs-radius/chapter.md
- content/chapters/34-acls/chapter.md
- content/chapters/35-vpns-ipsec/chapter.md
- content/chapters/35-vpns-ipsec/lab.md
