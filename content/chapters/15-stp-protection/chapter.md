---
id: stp-protection
number: 15
title: STP protection
subtitle: Configure edge ports and protect the topology against unexpected BPDUs and missing BPDUs.
part: switching
domain: switching
minutes: { lesson: 65, lab: 65 }
summary: Choose PortFast, BPDU guard, root guard, and loop guard according to a port's purpose. Read their failure states, correct the cause, and restore service safely; distinguish the two BPDU-filter forms for v1.1.
objectives:
  v1: ["2.5.c", "2.5.d"]
  v2: ["2.5.c", "2.5.d"]
prereqs: [spanning-tree]
sectionIds:
  Match protection to the port's purpose: the-tree-believes-every-port
  PortFast and operational edge status: portfast-declaring-an-edge
  BPDU guard and errdisable recovery: bpdu-guard-a-bpdu-on-an-edge-port-is-a-violation
  Root guard and root-placement boundaries: root-guard-the-root-stays-where-you-put-it
  Loop guard and missing BPDUs: loop-guard-silence-is-not-consent
  "BPDU filter: distinguish the two forms": bpdu-filter-switching-the-protocol-off-v1-1-only
sources:
  - { title: "Cisco: Catalyst 9300 optional spanning-tree features", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/lyr2/b_1712_lyr2_9300_cg/configuring_optional_spanning_tree_features.html" }
  - { title: "Cisco: Understand PortFast and BPDU guard", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10586-65.html" }
  - { title: "Cisco: Enhance STP with root guard", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10588-74.html" }
  - { title: "Cisco: Understand STP loop guard and UDLD", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol-stp-8021d/218321-configure-stp-with-loop-guard-and-bpdu-s.html" }
  - { title: "Cisco: Recover errdisable port state on IOS", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/69980-errdisable-recovery.html" }
  - { title: "Cisco: Catalyst 3850 errdisable recovery command reference", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3850/software/release/16-12/command_reference/b_1612_3850_cr/interface_and_hardware_commands.html" }
  - { title: "Cisco: Understand Rapid Spanning Tree Protocol", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html" }
  - { title: "Cisco: Catalyst 2960 optional spanning-tree configuration", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_1_se/configuration/guide/scg2960/swstpopt.html" }
---

## Match protection to the port's purpose

Spanning tree selects a topology from the BPDUs it receives; it does not know your intended administrative boundaries. A newly attached switch with a lower BID can become root even if that switch belongs in a training room. A different fault occurs when an operational uplink stops delivering BPDUs. The receiving switch might discard its previous information and attempt to forward where it should remain blocked.

Protection features address these specific situations. First identify what belongs behind the port: an end device, a downstream switch that must not supply the root, or an uplink expected to receive BPDUs. Then choose a feature whose trigger matches the failure you want to detect. An interface labeled “access” is not necessarily an edge: it can still connect to another switch carrying a single VLAN.

| Intended connection | Appropriate feature | What it accomplishes |
|---|---|---|
| End device with no Layer 2 transit path | PortFast plus BPDU guard | Immediate forwarding; received BPDUs trigger shutdown |
| Downstream switch outside the root-placement boundary | Root guard | Blocks superior information from taking over that boundary |
| Point-to-point root or alternate path | Loop guard | Prevents missing BPDUs from making the port designated |
| A specialized BPDU-suppression requirement | BPDU filter | Suppresses BPDUs; not a replacement for protection |

```diagram
{"type":"topology","title":"Fig 15.1 — Place the policy at the correct boundary","caption":"The access switch expects BPDUs on its uplink, rejects a superior root from the downstream lab, and rejects any BPDU from the host port.","nodes":[{"id":"CORE","kind":"switch","label":"CORE · intended root","x":1,"y":3,"highlight":true},{"id":"ACCESS","kind":"switch","label":"ACCESS","x":5,"y":3},{"id":"PC","kind":"pc","label":"PC","x":10,"y":1},{"id":"LAB","kind":"switch","label":"LAB switch","x":10,"y":5}],"links":[{"from":"CORE","to":"ACCESS","label":"ACCESS: loop guard","toBadge":"RP"},{"from":"ACCESS","to":"PC","label":"PortFast + BPDU guard","fromBadge":"Edge"},{"from":"ACCESS","to":"LAB","label":"ACCESS: root guard","fromBadge":"DP"}],"trace":{"flows":[{"path":["CORE","ACCESS"],"label":"BPDU from the intended root","tags":{"ACCESS":"Loop guard · BPDUs expected"}},{"path":["LAB","ACCESS"],"label":"Superior BPDU from the lab","tags":{"LAB":"Advertises a superior root"},"stop":"ACCESS","stopText":"Root guard · superior root rejected"}]}}
```

The lab uses a known three-switch baseline and tests one condition at a time. You will inspect the state before recovery, remove the cause, and verify the restored path. The goal is to explain why traffic stopped and whether the protection behaved as intended, rather than make every blocked interface green.

## PortFast and operational edge status

:::facts
- PortFast permits immediate forwarding on an end-device port; it does not disable STP.
- Interface BPDU guard reacts to any received BPDU, regardless of PortFast. Global BPDU guard applies to operational PortFast ports.
- Root guard reacts to superior BPDUs; loop guard reacts to missing expected BPDUs on applicable root/alternate ports.
- Root- and loop-inconsistent conditions recover automatically when their triggering condition ends. BPDU-guard errdisable requires manual recovery or an enabled recovery timer.
- On the IOS platforms discussed here, the errdisable recovery interval defaults to `300` seconds; automatic recovery for the cause must be enabled separately.
:::

**PortFast** identifies a port that can safely forward immediately because it connects to an end device rather than a transit bridge. Classic STP otherwise has listening and learning delays, each `15` seconds by default. RSTP can also need timer-based forwarding when no rapid agreement is possible. Marking a genuine edge avoids that wait instead of expecting a PC to participate in a bridge-to-bridge handshake.

Immediate forwarding helps a newly connected host exchange DHCP, ARP, and application traffic without an STP startup delay. It does not guarantee that DHCP has a reachable server or that a host has the right VLAN. A failed first ping can still be address resolution rather than spanning-tree convergence. Verify the port state and the IP configuration independently.

PortFast also affects topology-change handling. In RSTP, ordinary edge-port link transitions do not trigger a topology change; non-edge ports entering forwarding do. Avoid the blanket claim that every RSTP port shutdown generates a topology-change event. The distinction matters because unnecessary topology changes can invalidate learned forwarding information and cause extra flooding while MAC addresses are relearned.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# spanning-tree portfast
SW1(config-if)# end
SW1# show spanning-tree interface fastethernet0/5 detail
```

The configuration declares an edge, but **operational edge status** is the state actually being used. With PortFast alone, receiving a BPDU causes an RSTP edge port to become an ordinary spanning-tree port; the configured command is not necessarily removed. STP still processes BPDUs and maintains loop-prevention behavior. If BPDU guard is enabled too, its shutdown action is the more visible result.

| IOS configuration | Scope |
|---|---|
| `spanning-tree portfast` | Current interface while operationally nontrunking |
| `spanning-tree portfast trunk` | Current trunk to an appropriate end device |
| `spanning-tree portfast default` | Global default for nontrunking ports |
| `spanning-tree portfast disable` | Interface exception to a global default |

A server or hypervisor may legitimately receive tagged VLANs, but the trunk must still be an edge in the network design. Verify that the host cannot bridge this connection into another path through the LAN. “It is a server” is not sufficient evidence by itself. On current Catalyst IOS XE, the equivalent PortFast syntax may include `edge`, such as `spanning-tree portfast edge trunk`; use interface help for that image. The labs use the 2960-style commands shown above.

## BPDU guard and errdisable recovery

**BPDU guard** treats a received BPDU as a violation of the port's intended use. The BPDU does not have to advertise a better root. A fully authorized switch with a worse BID will still trigger guard if attached to a guarded host port. This makes BPDU guard suitable where no bridge should participate, rather than where a downstream bridge is allowed but must remain subordinate.

There are two configuration scopes. `spanning-tree bpduguard enable` is an interface command and operates independently of PortFast. `spanning-tree portfast bpduguard default` is a global default applying to interfaces in the operational PortFast state. Therefore a global BPDU-guard line alone does not automatically protect every trunk. Check operational state and interface overrides when interpreting a configuration exhibit.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# spanning-tree bpduguard enable
SW1(config-if)# end
SW1# show interfaces status
```

With the conventional Catalyst behavior used here, a violation puts the interface in **err-disabled** state and stops user traffic on the entire port. This differs from a VLAN-specific STP inconsistency on a trunk. Some platforms offer additional recovery/containment options, but do not assume them unless an exhibit explicitly shows their configuration.

First inspect the interface and the log to identify the cause. Errdisable can result from several features; the state alone does not prove BPDU guard. A message containing `bpduguard` alongside the affected port is the useful evidence. Disconnect or correct the BPDU source before resetting the port. Otherwise the same violation can happen as soon as the port is active again.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces status
```

Automatic recovery is an optional policy choice, not the default remedy. `errdisable recovery cause bpduguard` enables attempts for that cause; `errdisable recovery interval 60` changes the shared recovery interval. The documented IOS range is `30`–`86400` seconds, with default `300`. Verify the cause is enabled using `show errdisable recovery`; simply changing the interval does not enable BPDU-guard recovery. Knowing the trigger and corrective workflow matters more than memorizing the maximum timer value.

:::trap Restoring the port is not correcting the cause
Repeatedly issuing `shutdown` and `no shutdown`, or shortening a recovery timer, does not make a prohibited switch acceptable on a host port. Remove the cause or redesign the connection as an authorized interswitch link with the correct VLAN and STP policy.
:::

## Root guard and root-placement boundaries

**Root guard** allows ordinary spanning-tree participation while preventing a designated boundary port from accepting superior information that would change its intended role. Place it on the managed side of a connection through which the root must not be learned. For example, the access-switch port toward a training-room switch may have root guard. The access switch's uplink toward the intended root should not.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# spanning-tree guard root
SW1(config-if)# end
SW1# show spanning-tree inconsistentports
```

Consider an intended root at priority `24576` and a downstream training switch accidentally configured at `0`, both for VLAN 10. The guarded boundary hears superior information and enters **root-inconsistent** state for that VLAN. Traffic through the affected instance is blocked, protecting the upstream topology. The training switch may still consider itself root of its isolated portion; root guard is not an instruction that rewrites the training switch's configuration.

In Rapid PVST+, other VLANs on the trunk may continue forwarding if they have no inconsistent condition. Thus “VLAN 10 fails while VLAN 20 works” can be consistent with root guard. Check each VLAN rather than assuming the physical interface is down. Typical output includes `*ROOT_Inc` and a root-inconsistent entry; it is not BPDU-guard errdisable.

Recovery is automatic after superior information ceases and normal STP processing permits forwarding. Correct the downstream priority or cabling rather than removing the protection solely to restore traffic. Do not promise recovery at exactly `20` seconds: protocol state, new BPDUs, and timers affect the observed interval. Root guard also does not solve missing-BPDU faults, because inferior information received by an already legitimate root is not its trigger.

## Loop guard and missing BPDUs

**Loop guard** protects applicable point-to-point ports that are currently root or alternate ports and should continue receiving BPDUs. If expected information expires, it prevents them from becoming designated and forwarding merely because those BPDUs stopped arriving. The affected instance enters **loop-inconsistent** state. When BPDUs resume, the condition clears automatically and normal STP chooses the role and state again.

A link can remain physically up while its control traffic fails. Possible causes include a one-way transmission fault, a neighbor no longer sending BPDUs, or filtering that prevents delivery. Loop guard detects missing control information; it does not diagnose which of these caused the loss. A `*LOOP_Inc` indication alone cannot prove a broken fiber strand, and an ordinary cable unplug is not the same test because it causes link-down.

```ios SW3
SW3# configure terminal
SW3(config)# interface gigabitethernet0/1
SW3(config-if)# spanning-tree guard loop
SW3(config-if)# end
SW3# show spanning-tree inconsistentports
```

The global alternative is `spanning-tree loopguard default`. It enables the feature on applicable point-to-point interfaces; its protective action depends on the port's role and received information. It is not intended to disable a host port because a PC sends no BPDUs. It also cannot reliably detect a failure that existed from first link-up before the port received the information it is meant to monitor. Shared links are outside this mechanism's supported scope.

Root guard and loop guard express different role expectations and cannot operate together on the same interface. One protects a boundary that should remain designated; the other prevents a root/alternate port from becoming designated through missing information. Do not apply every guard to every uplink. A global deployment still requires attention to exceptions and legitimate failover paths.

The guided fault exercise temporarily suppresses BPDUs only in an isolated topology with no redundant physical path. That produces a controlled observation without deliberately constructing a forwarding loop. Packet Tracer may accept some commands but not model the complete failure; the lab provides a paper interpretation fallback. Recognizing an unsupported simulation is preferable to treating a missing reaction as proof that the protocol works differently.

## BPDU filter: distinguish the two forms

BPDU filter is explicitly listed in the v1.1 protection objective and is not listed in the v2.0 equivalent. Learn it here after the protection features, because suppression changes the evidence on which those features depend. This is a scope distinction, not a claim about Cisco's reason for changing its blueprint.

The interface command `spanning-tree bpdufilter enable` suppresses sending and receiving BPDUs independently of PortFast. Cisco warns that this is effectively disabling spanning-tree participation on that interface and can permit a loop. A physically redundant link can continue carrying user traffic while the switches lack the control exchange needed to block it safely. This is why filter is not a substitute for BPDU guard.

The global command `spanning-tree portfast bpdufilter default` has different behavior on operational PortFast ports. Initial BPDUs are sent at link-up before outgoing filtering takes effect; if a BPDU is received, operational PortFast status and filtering are removed and normal STP operation resumes. Do not extend that fallback behavior to unconditional interface filtering. Avoid memorizing a platform-specific count of initial BPDUs.

Review interface filtering wherever BPDUs appear to be missing. Do not build a host-port template by combining every feature name: suppressing BPDU processing conflicts with a design that relies on received BPDUs to expose a wrong connection. Remove unwanted filtering as the actual repair; adding more guard commands without examining the existing policy can leave the original problem in place.

## Verify and troubleshoot

The following excerpts are representative IOS-style teaching exhibits. They illustrate distinct states and are not output from one simultaneously running experiment. Actual interface names, timestamps, and detailed formatting vary by device and software.

```output SW1# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/5                        err-disabled 10           auto   auto 10/100BaseTX  ← whole interface disabled; inspect the cause
```

```output SW1# show spanning-tree inconsistentports
Name                 Interface                Inconsistency
-------------------- ------------------------ ------------------
VLAN0010             GigabitEthernet0/1        Root Inconsistent  ← superior information at a guarded boundary
Number of inconsistent ports (segments) in the system : 1
```

Start with `show interfaces status` to distinguish link-down, administrative shutdown, and errdisable. Inspect `show logging` for a cause, then use `show spanning-tree vlan 10` and `show spanning-tree inconsistentports` for the affected instance. A protected port may disappear from normal STP output after errdisable; use interface status and running configuration rather than assuming the configuration vanished.

Use `show spanning-tree summary` to inspect global defaults, and `show spanning-tree interface fastethernet0/5 detail` to inspect an active port. Match the configuration scope with the operational state. For root guard, trace where superior information originates. For loop guard, compare BPDU reception and transmission at both ends and check filtering; do not remove the guard until the underlying condition is understood.

After recovery, verify both the expected root/port roles and end-to-end user traffic. A green interface is insufficient if the wrong root now attracts traffic or a VLAN is missing from a trunk. Save only the corrected design, leaving deliberate fault settings out of the startup configuration. Keep a short note of the trigger, evidence, fix, and successful retest.

## Exam focus

- PortFast enables immediate forwarding for a genuine edge; STP remains active and configured status differs from operational status.
- Interface BPDU guard applies independently of PortFast; the global default applies to operational PortFast ports.
- Any received BPDU triggers BPDU guard; superior information triggers root guard; missing expected BPDUs trigger loop guard.
- Distinguish whole-port errdisable from per-instance root/loop inconsistency in Rapid PVST+.
- Remove the cause before manual or automatic errdisable recovery. A 300-second default interval does not mean recovery is enabled.
- Put root guard at the boundary toward an impermissible root, and loop guard on appropriate root/alternate point-to-point paths.
- Root guard and loop guard are mutually exclusive on one interface.
- For v1.1, distinguish conditional global BPDU filtering from unconditional interface filtering.
