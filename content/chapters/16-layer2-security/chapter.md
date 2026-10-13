---
id: layer2-security
number: 16
title: Layer 2 security
subtitle: Control endpoint traffic with port security, DHCP snooping, ARP inspection, storm control and RA guard.
part: switching
domain: services
minutes: { lesson: 75, lab: 110 }
summary: Build an access-port policy from the traffic it must permit. Configure and verify MAC limits, DHCP and ARP trust boundaries, storm thresholds and IPv6 router-advertisement protection, then diagnose failures without disabling every control.
objectives:
  v1: ["5.7"]
  v2: ["4.7", "4.7.a", "4.7.b", "4.7.c", "4.7.d", "4.7.e"]
prereqs: [network-models, ipv4-addressing, vlans-and-access-ports, stp-protection]
sectionIds:
  Protect the access layer: why-the-access-port-needs-its-own-defences
  Limit source MAC addresses with port security: port-security-who-may-talk-on-this-port
  Choose a violation response and recover service: violation-modes-aging-and-err-disable-recovery
  Establish DHCP snooping trust and bindings: dhcp-snooping-one-trusted-path-to-the-server
  Validate ARP claims with DAI: dynamic-arp-inspection-arp-must-match-the-bindings
  Limit traffic storms: storm-control-and-ipv6-ra-guard
sources:
  - { title: "RFC 2131: DHCP message exchange and relay fields", url: "https://www.rfc-editor.org/rfc/rfc2131.html" }
  - { title: "RFC 4291: IPv6 address representation and scope", url: "https://www.rfc-editor.org/rfc/rfc4291.html" }
  - { title: "RFC 4862: IPv6 stateless address autoconfiguration", url: "https://www.rfc-editor.org/rfc/rfc4862.html" }
  - { title: "Cisco: Catalyst 9300 SDM resources, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sys_mgmt/b_1712_sys_mgmt_9300_cg/configuring_sdm_templates.html" }
  - { title: "Cisco: Catalyst 9300 port security, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/port_security.html" }
  - { title: "Cisco: Catalyst 9300 DHCP and snooping, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/ip/b_1712_ip_9300_cg/configuring_dhcp.html" }
  - { title: "Cisco: Catalyst 9300 Dynamic ARP Inspection, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_dynamic_arp_inspection.html" }
  - { title: "Cisco: Catalyst 9300 traffic storm control, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_port_based_traffic_control.html" }
  - { title: "Cisco: Catalyst 9300 IPv6 First Hop Security, IOS XE 17.12", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_ipv6_first_hop_security.html" }
  - { title: "Cisco: Catalyst 3560 traffic-control command context", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3560/software/release/15-0_1_se/configuration/guide/scg3560/swtrafc.html" }
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
---

VLANs decide which Layer 2 network a port belongs to. Spanning tree manages redundant paths. Neither establishes that a connected endpoint should advertise a router, supply DHCP leases or claim another host's address. This chapter adds controls for those behaviors and shows how to distinguish a blocked policy violation from a legitimate device affected by an incomplete configuration.

## Protect the access layer

An **access-layer security policy** identifies acceptable traffic at the point where endpoints enter the network. Apply each feature for a specific purpose. A port-security limit does not validate an ARP claim, and a DHCP snooping trust command does not configure IPv6 protection.

:::facts
- Port security is disabled initially. On the documented Catalyst platforms, enabling it gives a maximum of **1** secure MAC address and violation mode **shutdown**; secure-address aging is disabled at time **0**.
- DHCP snooping requires global enablement and a VLAN list. Interfaces are untrusted by default; legitimate server replies must enter through an appropriately trusted path.
- DAI uses a separate trust setting. On the documented Catalyst configuration, untrusted interfaces default to **15 ARP packets/s** over a **1-second** burst interval.
- Sticky addresses enter running configuration; saving is required for startup configuration to retain them.
- Storm thresholds and RA guard are explicit v2.0 configuration topics. v1.1 directly lists port security, DHCP snooping and DAI.
:::

A few protocol definitions are needed before their full chapters. **DHCPv4** leases an IPv4 address and supplies options such as a gateway. The initial Discover–Offer–Request–ACK exchange gives snooping an opportunity to observe a client's address assignment. The server's Offer, ACK and NAK messages must come from an authorized direction. **ARP** maps an IPv4 address to a local link-layer address; forged claims can alter a host's neighbor information. **IPv6 Router Advertisements (RAs)** supply router and link information, including whether a sender can serve as a default router. [IPv6 addressing](#/chapter/ipv6-addressing) and [DHCP](#/chapter/dhcp) develop these protocols fully.

| Problem | Relevant control | Important limit |
|---|---|---|
| Excessive or unexpected source MAC addresses | Port security | A MAC address is not proof of a person's identity |
| Unauthorized DHCP server replies | DHCP snooping trust | Trust is an ingress decision on each switch |
| Excessive DHCP requests | DHCP rate limiting and address checks | Rate limits reduce abuse; they do not guarantee pool availability |
| Forged IPv4-to-MAC claims | Dynamic ARP Inspection | Valid bindings or explicit policy must cover legitimate senders |
| Excess broadcast or multicast traffic | Storm control | Suppression does not remove the underlying loop or fault |
| Unauthorized IPv6 router advertisements | RA guard | It is not a general IPv6 firewall or all-purpose ND validation |

A MAC-flooding attempt can consume learning resources and increase unknown-unicast flooding, but it does not turn every switch into a hub or expose every conversation. Flooding remains subject to VLAN membership, forwarding state and other controls. Similarly, an unauthorized DHCP server or RA can provide misleading settings, but the exact effect depends on which information a host accepts and uses. Diagnose the observed traffic rather than treating every possible outcome as inevitable.

## Limit source MAC addresses with port security

**Port security** limits accepted source MAC addresses on a switchport. A violation can occur when an additional source appears after the secure-address limit is reached, or when an address secured on one interface appears on another secure interface in the same VLAN. This is distinct from ordinary destination-MAC forwarding.

Use a statically configured access port for the lab. The documented Catalyst implementation also supports secure trunk ports, but rejects dynamic switchport mode and does not support port security on EtherChannel interfaces. Check the platform restrictions before combining features.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 1
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
SW1# show port-security address
```

| Address type | How it is established | Persistence |
|---|---|---|
| Static secure | Administrator configures a MAC address | In running configuration; retained after restart when saved |
| Dynamic secure | Switch learns an address within the limit | Operational state; not retained as a configuration entry after restart |
| Sticky secure | Learned or explicitly configured as sticky | In running configuration; retained after restart when saved |

Enable sticky learning while the intended endpoint is connected, then inspect the learned entry. Learning the first sender does not authenticate that sender, and another device can impersonate an approved MAC address. Port security is a useful boundary, not a replacement for identity-based access control.

Choose the maximum from the expected secure address entries, including VLAN context. A documented phone-plus-PC arrangement may need two entries; other endpoint behavior or older phone/switch combinations can require a different allowance. Inspect the data and voice VLAN entries rather than assuming that counting physical devices always gives the exact limit. A trunk to a hypervisor can legitimately carry many source addresses.

Secure-address aging is separate from ordinary MAC-table aging. On the cited Catalyst platform, time `0` disables it; absolute aging uses elapsed time and inactivity aging uses idle time. Static secure entries require static aging to be enabled. Sticky secure aging is not supported on that platform. These differences explain why a normal MAC aging timer does not automatically remove a sticky configuration line.

## Choose a violation response and recover service

The three core modes share the same security limit but respond differently when a violation occurs.

| Mode | Violating traffic | Traffic from existing secure addresses | Evidence/state |
|---|---|---|---|
| `protect` | Dropped | Continues while the port remains operational | No violation notification or counter increment in this mode |
| `restrict` | Dropped | Continues while the port remains operational | Violation counter and logging/notification behavior |
| `shutdown` | Port stops forwarding | Stops on that interface | Err-disabled; port-security state commonly shows `Secure-shutdown` |

Select a response on an already secured interface. This example changes the response to restrict; it does not change the allowed MAC addresses or their maximum:

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# switchport port-security violation restrict
SW1(config-if)# end
SW1# show port-security interface fastethernet0/1
```

Use the final keyword `protect`, `restrict`, or `shutdown` for the intended policy. The guided violation lab retains shutdown so that you can observe and recover an err-disabled port.

Notification generation does not prove that an external monitoring server received a message. The exact log text, counter behavior after repeated incidents and LED indication should not be assumed from a simplified example. The following is representative, abbreviated output after one shutdown violation:

```output SW1# show port-security interface fastethernet0/1
Port Security              : Enabled
Port Status                : Secure-shutdown  ← the port was disabled by a violation
Violation Mode             : Shutdown
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1                ← the permitted secure-address capacity is occupied
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 1
Security Violation Count   : 1                ← this example shows one incident
```

Identify the offending source and the intended policy before restoring service. If an unapproved device caused the fault, remove it. If an authorized endpoint needs a second source address, correct the policy deliberately. Bouncing a port without correcting the cause can produce another outage.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/1
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces status
SW1# show port-security interface fastethernet0/1
```

Cause-specific automatic recovery can be enabled with `errdisable recovery cause psecure-violation`. The documented default recovery interval is 300 seconds, but recovery is not automatically enabled for every cause. `show errdisable recovery` distinguishes configured recovery from a timer actually pending. Recovery does not remove a conflicting secure address or repair the endpoint.

## Establish DHCP snooping trust and bindings

**DHCP snooping** inspects DHCP traffic in enabled VLANs. On an untrusted ingress port, server messages such as Offer, ACK and NAK are discarded. Client traffic is subject to the configured validation and rate checks. A trusted port allows the server-side traffic that the design expects to arrive there.

Read the initial lease exchange before choosing which direction to trust. A **pool** is the server's set of addresses and options for a client network.

| Message | Sender and purpose |
|---|---|
| Discover | Client looks for a server; it initially has no usable leased address |
| Offer | Server proposes an address and configuration |
| Request | Client asks to use the offered assignment |
| ACK | Server acknowledges the assignment; snooping can learn the binding |

A **NAK**, or negative acknowledgment, rejects a client's requested configuration. Offer, ACK and NAK are server messages even though their jobs differ. Snooping protects this exchange; it does not supply leases itself.

Trace the server-to-client path on each switch. In the topology below, R1 is the only server, connected directly to SW1. SW1 trusts Gi0/1. SW2 trusts its uplink toward SW1. SW1 does **not** automatically trust its downlink toward SW2 merely because that link is a trunk; no authorized server resides behind SW2 in this design.

```diagram
{"type":"topology","title":"Trust follows the permitted server direction","caption":"Snooping trust is applied where authorized replies enter each switch: SW1 Gi0/1 and SW2 Gi0/1. The client-facing downlink on SW1 is not automatically trusted.","nodes":[{"id":"R","kind":"router","label":"R1 · DHCP","x":1,"y":1},{"id":"S1","kind":"switch","label":"SW1","x":5,"y":1},{"id":"S2","kind":"switch","label":"SW2","x":9,"y":1},{"id":"A","kind":"pc","label":"PC-A","x":5,"y":5},{"id":"B","kind":"pc","label":"PC-B","x":9,"y":5}],"links":[{"from":"R","to":"S1","toLabel":"Gi0/1 trusted"},{"from":"S1","to":"S2","fromLabel":"Gi0/2 untrusted","toLabel":"Gi0/1 trusted"},{"from":"S1","to":"A","fromLabel":"Fa0/1 untrusted"},{"from":"S2","to":"B","fromLabel":"Fa0/1 untrusted"}],"trace":{"flows":[{"path":["B","S2","S1","R"],"back":true,"label":"PC-B's DHCP exchange","tags":{"S1":"Downlink Gi0/2 stays untrusted"},"backTags":{"S1":"Server reply · trusted Gi0/1","S2":"Server reply · trusted Gi0/1"}}]}}
```

**A DHCP relay** forwards client requests to a server on another IP network; normal routers do not forward the initial local broadcast as ordinary IP traffic. **Option 82** adds relay-agent information such as the attachment circuit. The separate `giaddr` field identifies the client-side relay gateway in the ordinary relay design. A directly attached client has no relay gateway and normally sends zero in that field. Some IOS server policies reject inserted Option 82 with zero `giaddr` unless relay-information trust allows it.

This example disables Option 82 insertion on both switches to keep the client-facing interswitch path simple. This is an explicit lab choice, not a requirement to disable it in every network. Chapter 24 develops relay configuration and server behavior. A deployment that retains Option 82 must also define how upstream devices handle relay information received on an untrusted port. Do not bypass the intended security boundary by trusting every downlink just to make a request pass.

```ios SW1
SW1# configure terminal
SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10
SW1(config)# no ip dhcp snooping information option
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip dhcp snooping trust
SW1(config-if)# exit
SW1(config)# interface fastethernet0/1
SW1(config-if)# ip dhcp snooping limit rate 15
SW1(config-if)# end
SW1# show ip dhcp snooping
SW1# show ip dhcp snooping binding
```

The rate of 15 DHCP packets/s is a lab choice, not the default for every access port. Exceeding a configured snooping rate limit can err-disable the interface. An uplink aggregates many clients, so its traffic allowance cannot be copied blindly from a single-PC port. The DHCP `chaddr` field carries the client hardware address. MAC-to-`chaddr` validation compares that field with the Ethernet source and can reject a mismatch; a sender using consistent spoofed values is not necessarily detected by that check alone.

The binding table records learned client IP/MAC information, VLAN, interface and lease information. Enable snooping before obtaining the lab leases. An existing lease is not proof that the switch observed the exchange that created it. A reload can also lose dynamic bindings unless a supported database-persistence mechanism has been configured and verified; saving running configuration alone does not save every operational lease binding.

## Validate ARP claims with DAI

:::trap
DHCP snooping trust and DAI trust are separate settings. A correct DHCP reply path does not automatically permit the ARP traffic needed for a working LAN.
:::

**Dynamic ARP Inspection (DAI)** checks ARP messages entering untrusted ports in the configured VLANs. DHCP snooping supplies the usual dynamic IP-to-MAC bindings. **ARP access control lists (ACLs)** supply permit/deny rules for ARP claims, including static-addressed senders. This is an ARP-specific policy, distinct from the IPv4 packet ACLs taught in Chapter 34. A DAI-trusted port bypasses these inspections, so assign trust only where the upstream source of ARP claims is controlled.

DHCP trust and DAI trust are independent. A statically addressed router usually has no DHCP-client binding, so this lab deliberately trusts its controlled uplink for DAI. A different design could keep that port inspected and provide suitable ARP policy. An arbitrary switch-to-switch link is not automatically safe to trust.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# ip arp inspection trust
SW1(config-if)# exit
SW1(config)# ip arp inspection vlan 10
SW1(config)# end
SW1# show ip arp inspection interfaces
SW1# show ip arp inspection vlan 10
SW1# show ip arp inspection statistics vlan 10
```

A static printer illustrates a common dependency. Excluding `10.1.10.20` from the DHCP pool prevents its dynamic allocation; it does not create a snooping binding. If the approved printer MAC is `000c.2911.7a3e`, the following ARP ACL permits that pairing while leaving other senders eligible for DHCP-binding validation:

```ios SW1
SW1# configure terminal
SW1(config)# arp access-list STATIC-HOSTS
SW1(config-arp-nacl)# permit ip host 10.1.10.20 mac host 000c.2911.7a3e
SW1(config-arp-nacl)# exit
SW1(config)# ip arp inspection filter STATIC-HOSTS vlan 10
SW1(config)# end
```

In this rule, each `host` means an exact address: both the sender IP and sender MAC must match. A rule naming `deny` would explicitly reject its match. An **implicit nonmatch** means no configured rule matched the ARP claim. Without the `static` filter keyword, that nonmatch can fall through to the DHCP binding check; an explicit deny still denies. Adding `static` makes the ACL's implicit deny final and prevents that fallback. It is not a keyword required merely because the printer has a static address.

Optional `ip arp inspection validate src-mac dst-mac ip` adds header/payload checks: source-MAC consistency in requests and replies, destination-MAC consistency in replies, and invalid IP-value checks. A new validate command replaces the selected check set. Understand its effect on legitimate address probes before enabling it indiscriminately.

On the cited Catalyst platform, trusted DAI interfaces have an unlimited default ARP rate. The default untrusted allowance is 15 packets/s with a one-second burst interval; excess can err-disable the port with cause `arp-inspection`. That is independent of the DHCP-packet rate. A legitimate host or aggregated link can exceed an unsuitable ARP limit. A counter increase establishes a rejection category, not the sender's intent.

## Limit traffic storms

**Storm control** suppresses a selected class of incoming traffic when its configured threshold is reached. Broadcast, multicast and unicast support, accounting and hardware reaction vary by platform. The core example uses broadcast thresholds, avoiding assumptions about a platform's separate known/unknown-unicast implementation.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/2
SW1(config-if)# storm-control broadcast level 1.00 0.50
SW1(config-if)# end
SW1# show storm-control fastethernet0/2 broadcast
```

The first percentage is the rising suppression threshold; the second is the falling threshold below which forwarding resumes. The falling value cannot exceed the rising value. If omitted, it is set to the rising value in the documented configuration. Thresholds can also use `level bps` or `level pps` on supported platforms. One percent means a nominal 1 Mb/s on a 100 Mb/s port and 10 Mb/s on a 1 Gb/s port; it is not a count of one packet per hundred packets.

Default behavior filters traffic without a configured shutdown or trap action. `storm-control action shutdown` err-disables the interface; `storm-control action trap` requests notification. Suppression can discard the affected traffic class during an interval, not simply trim a precise number of excess bytes. The cited Catalyst documentation describes one-second measurements and also platform-specific hardware policing, so avoid promising an exact universal reaction time.

Read the traffic type as well as `Forwarding` or `Blocking` in the output. A storm-control blocking state is not an STP port role. Do not create a physical loop to test the feature: examine configured limits, use supplied output, or use a controlled traffic source in an isolated supported lab. Find and correct the traffic source or loop after the immediate symptom is contained.

## Control IPv6 router advertisements

This exercise needs a small part of IPv6 before Chapter 19 develops its addressing rules. IPv6 addresses contain 128 bits, written as colon-separated hexadecimal groups; `::` compresses consecutive zero groups. In the lab, `fe80::1` is a router's **link-local** address, usable on its own link. `2001:db8:16:10::/64` is a documentation prefix for a client LAN; /64 counts its network bits.

With **SLAAC (Stateless Address Autoconfiguration)**, a host can combine an advertised /64 prefix with its own interface identifier. A valid **Router Advertisement (RA)** can also identify a default router by its link-local source. Thus an unauthorized RA can offer a different prefix or router even while IPv4 DHCP works normally. You are identifying the permitted sender here, not calculating IPv6 allocations.

RA guard controls newly received messages. It does not instantly erase addresses or router information a host accepted earlier; those have their own lifetimes. Inspect fresh RA traffic when testing a policy change. Chapter 19 then explains the full address and Neighbor Discovery process.

**RA guard** filters Router Advertisements and, on the cited Catalyst implementation, router Redirect messages according to an ingress policy. A host-role policy rejects router messages from endpoint ports. A router-role policy permits the expected router role, subject to any further configured checks. It does not prove the router itself is correctly configured.

```ios SW1
SW1# configure terminal
SW1(config)# ipv6 nd raguard policy HOSTS
SW1(config-nd-raguard)# device-role host
SW1(config-nd-raguard)# exit
SW1(config)# ipv6 nd raguard policy ROUTERS
SW1(config-nd-raguard)# device-role router
SW1(config-nd-raguard)# exit
SW1(config)# interface gigabitethernet1/0/1
SW1(config-if)# ipv6 nd raguard attach-policy HOSTS
SW1(config-if)# exit
SW1(config)# interface gigabitethernet1/0/24
SW1(config-if)# ipv6 nd raguard attach-policy ROUTERS
SW1(config-if)# end
SW1# show ipv6 nd raguard policy HOSTS
SW1# show ipv6 nd raguard policy ROUTERS
```

These interface names belong to the Catalyst 9300 reference path, not the Packet Tracer 2960. Defining a policy alone does not attach it. On the documented First Hop Security implementation, configure the router-facing role as well as host-facing roles; Router Solicitation forwarding can depend on that classification. A policy that treats the legitimate router as a host can disrupt router discovery while IPv4 still works.

Use a supported platform for the v2.0 configuration exercise. If the simulator does not expose RA guard, complete the supplied policy/evidence worksheet and record that practical configuration still needs a supported environment. Do not substitute an IPv4 ACL or claim that a missing simulator command demonstrates how hardware behaves. Fragment/extension-header handling and other IPv6 First Hop Security features require their own platform documentation; they are not developed here.

## Verify and troubleshoot

Work from the failing service toward the responsible feature. Keep a valid baseline and change one policy at a time.

| Observation | Check next | Avoid concluding |
|---|---|---|
| Interface is err-disabled | Status, logs, secure addresses and enabled recovery causes | That every outage is port security |
| Client cannot obtain a lease | VLAN, operational snooping list, server-facing trust, rate and Option 82 policy | That an empty binding table identifies one unique fault |
| Client has an address but cannot resolve its gateway | Correct binding, DAI policy/trust and rejection counters | That DHCP success proves ARP is permitted |
| Static sender fails after DAI enablement | Its approved IP/MAC policy and ACL fallback behavior | That a DHCP exclusion supplies an ARP binding |
| Bursts of traffic disappear | Storm type, threshold and filtering state | That STP chose an alternate port |
| IPv4 works but IPv6 router discovery fails | RA policy attachment, host/router roles and received RA evidence | That all neighbor discovery is blocked |

Configuration, operational state and observed packets answer different questions. A policy in running configuration proves intent. A binding or counter provides current state. Successful service tests provide evidence for the tested endpoints and moment. Together they support a diagnosis without requiring you to disable every protection.

## Exam focus

- Configure and verify static access-port security, address limits, sticky learning and the three violation modes.
- Restore an err-disabled port after correcting the cause; distinguish manual recovery from enabled automatic recovery.
- Enable DHCP snooping globally and on the correct VLAN, trace ingress trust, and read bindings and rate policy.
- Explain why trusted uplinks, Option 82 and DHCP relay trust are different decisions.
- Configure DAI, distinguish its trust from DHCP trust, and admit a static sender with a precise ARP ACL.
- For v2.0, configure storm thresholds/actions and attach host/router RA guard policies on supported interfaces.
- Interpret evidence with its scope. A MAC address, a counter or one successful ping is not a complete security assessment.
