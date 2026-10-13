# Coherency review: chapters 00–11

Reviewed September 24, 2026 against the local working tree captured in baseline.json. All 70 existing lesson, lab and study-bank files in this range were read completely. Chapters 00 and 01 intentionally have no ticket file. No topic reorder or new section identity is required. Existing practice workload and item identities are retained.

The review asks whether a learner can understand and attempt each required task using an earlier lesson, the current lesson, or an explained supplied setup. A passing site check cannot establish pedagogical quality; the per-chapter reading and dependency evidence below are the editorial basis.

## 00 — Start here

Entry knowledge: No networking course prerequisite. Setup values are supplied and explained.

Practice checked: Build and save a two-PC LAN; use supplied addresses; identify IOS prompts; verify running versus startup.

Defined LAN, Ethernet/frame roles, IP/mask/gateway/DNS and ICMP at first setup use. Reworded c28 to avoid testing an OSI layer label before Chapter01. Added first handoff.

Next use: network-models, ios-essentials.

## 01 — Network models

Entry knowledge: IOS and simulator workflow (start-here / the-command-line-modes-help-and-the-pager).

Practice checked: Trace ARP and routed echo exchanges; interpret the three different tables; repair a supplied gateway fault.

Added protocol/application roles and notation before use. Added worked C/L route evidence before lab Step6 and later connected-route exercises. Routing selection stays17.

Next use: components-and-topologies, ipv4-addressing, ethernet-switching, inter-vlan-routing.

## 02 — Components & topologies

Entry knowledge: Packet and device-layer roles (network-models / where-the-layers-live-devices-and-commands).

Practice checked: Separate ping and HTTP service evidence; identify expansion roles and path dependencies; calculate supplied power allocation.

Expanded DHCP at its initial SOHO use. Supplied HTTP service setup is guided before its fault. No need to move design comparison after routing.

Next use: cabling-and-interfaces, vlans-and-access-ports.

## 03 — Cabling & interfaces

Entry knowledge: CLI status and ping (network-models / where-the-layers-live-devices-and-commands); Device links and PoE (components-and-topologies / power-over-ethernet).

Practice checked: Select a medium; compare both ends; observe shutdown and mismatch separately; use counter deltas without claiming a unique cause.

Added components prerequisite, rate-unit explanation and physical-to-addressing handoff. All commands already taught; supplied faults remain observed before repair.

Next use: ipv4-addressing, ethernet-switching.

## 04 — IPv4 addressing

Entry knowledge: Local/remote delivery (network-models / local-or-remote-the-host-s-first-decision); Physical/interface verification (cabling-and-interfaces / reading-the-output).

Practice checked: Derive /21 and /24 ranges; configure supplied and independently changed addressing; inspect rejected input and wrong gateway.

Added physical prerequisite and exponent/loopback definitions. Taught no ip address before d10; distinguished running state from saved configuration.

Next use: subnetting-vlsm, tcp-udp-ports, ipv6-addressing.

## 05 — Subnetting & VLSM

Entry knowledge: Mask and capacity calculations (ipv4-addressing / network-broadcast-and-usable-hosts); Connected-prefix interpretation (network-models / where-the-layers-live-devices-and-commands).

Practice checked: Plan nonoverlapping subnets; test a growth requirement against boundaries; renumber hosts/gateway consistently.

Added multicast/loopback distinctions, DHCP lease meaning and NAT/PAT/proxy vocabulary at first use. Full service mechanics remain24/26; ports follow06.

Next use: routing-table, static-routing-ipv4, nat-pat.

## 06 — TCP, UDP & ports

Entry knowledge: IP and host setup (ipv4-addressing / configuring-addresses-on-ios); Service versus network availability (components-and-topologies / reading-the-output).

Practice checked: Inspect TCP and UDP independently; interpret ACK/sequence data; set supplied resolver/A record; isolate HTTP service fault.

Added actual prerequisites, TLS and ISN definitions, AAA/monitoring-service roles and DNS A-record setup explanation before lab.

Next use: ios-essentials, dns, nat-pat, qos.

## 07 — Ethernet switching

Entry knowledge: Frames/ARP and hexadecimal notation (network-models / seven-layers-four-layers-five-pdus); Duplex and collisions (cabling-and-interfaces / shared-media-point-to-point-and-duplex); Transport retry versus frame checking (tcp-udp-ports / two-headers-two-philosophies).

Practice checked: Trace source learning separately from destination lookup; distinguish ARP/MAC tables; observe unknown unicast and wrong static entry.

Corrected prerequisites. Added 0x notation, binary group-bit example and scoped multicast flooding rule before q16. Exit accurately previews router management08 and switch SVI11.

Next use: ios-essentials, vlans-and-access-ports, spanning-tree.

## 08 — Secure device access

Entry knowledge: IOS prompts and saves (start-here / the-command-line-modes-help-and-the-pager); Ports/TLS and service tests (tcp-udp-ports / which-application-uses-which-transport-and-why); Transit switching (ethernet-switching / learn-forward-filter-flood).

Practice checked: Build named-user SSH; test new privilege-specific sessions; isolate transport fault; verify persisted policy.

Added hash/host-key explanation and timeout-zero meaning before cards. Added scoped legacy1.99 interpretation before q08; no crypto-algorithm implementation required.

Next use: vlans-and-access-ports, file-management, aaa-tacacs-radius.

## 09 — VLANs & access ports

Entry knowledge: MAC forwarding by VLAN (ethernet-switching / learn-forward-filter-flood); Management versus transit (ios-essentials / configure-ssh-step-by-step).

Practice checked: Build data/voice access ports; observe missing versus wrong VLAN; check power allocation; choose access/trunk from supplied tagging.

Added minimal tags, CDP/LLDP-MED, tunnel, virtual-host and LACP meanings for endpoint selection. Removed premature native-VLAN recall from q13/c03; native behavior is taught10.

Next use: trunks-dtp, cdp-lldp, etherchannel.

## 10 — 802.1Q trunks

Entry knowledge: VLAN access/voice membership (vlans-and-access-ports / access-ports-how-an-untagged-frame-gets-a-vlan); Frame/FCS structure (ethernet-switching / anatomy-of-an-ethernet-frame).

Practice checked: Build both trunk ends; diagnose allowed/native differences; prepare disconnected AP port from supplied requirements; add VLAN preserving existing services.

Added SSID/WLAN meanings, explicit static-trunk/DTP auto interaction for q04, pruning meaning and two-ended forwarding-set example for q21.

Next use: inter-vlan-routing, etherchannel, wireless-architecture.

## 11 — Inter-VLAN routing

Entry knowledge: Tagged trunk transport (trunks-dtp / configuring-trunks-on-2960-3560-and-9200); Off-subnet forwarding and ARP (network-models / the-packet-walk-pc-a-to-server-b-and-back); Address/mask calculations (ipv4-addressing / network-broadcast-and-usable-hosts).

Practice checked: Build separate router/SVI designs; observe tag and autostate faults; distinguish neighbor ping from complete return routing.

Full two-file lab and all banks reviewed; setup order is sound. Taught detailed SVI and connected-only route commands before d09/d10. Added handoff to neighbor mapping12.

Next use: cdp-lldp, etherchannel, fhrp-hsrp-vrrp, dhcp.

## Boundaries retained

Initial /24 addresses support an observed packet walk before Chapter04 derives subnet arithmetic. Chapter01 now teaches how to read the limited connected/local entries used in that walk; full route selection stays17. Chapter07 and09 explain the purpose of VLANs, spanning tree and endpoint link choices without asking for their later configuration. Chapter06 gives enough DNS meaning to configure its supplied name lookup; DNS resolution and server behavior stay25. Chapter09 no longer assesses the native-VLAN default before Chapter10. Chapter11 tests only a directly connected routed-port neighbor; remote routes stay18.

## Source checks

New bridges were checked using the lessons’ primary references, including [Cisco connected/local routes](https://www.cisco.com/c/en/us/support/docs/ip/ip-routing/116264-technote-ios-00.html), [DHCP RFC2131](https://www.rfc-editor.org/rfc/rfc2131.html), [ARP RFC826](https://www.rfc-editor.org/rfc/rfc826.html), [Cisco SSH configuration](https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html), [SSH transport compatibility RFC4253](https://www.rfc-editor.org/rfc/rfc4253.html), [Cisco Catalyst VLAN/trunk behavior](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swvlan.html), and [Cisco IGMP snooping](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swigmp.html). Supporting syntax is scoped to documented images rather than asserted as universal simulator behavior.

## Limits

No Packet Tracer or physical-device lab was executed in this review. Observed, representative and worksheet evidence labels remain intact. Primary-source checking and sequence review do not certify every simulator image or guarantee exam success. Independent peer review and whole-course integrity/build results are recorded separately.
