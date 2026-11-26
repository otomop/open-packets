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

Someone in a meeting room plugs a cheap desktop switch into a wall port. A training-lab switch arrives with a bridge priority of 0. Spanning tree treats both as ordinary neighbours, and it will elect the lab switch as root and pull the campus's traffic through it. A quieter failure is an uplink that stays up but stops delivering BPDUs: the switch at the far end decides the path is clear and unblocks the port that was preventing a loop.

The last chapter showed how STP elects a root and chooses port roles from the BPDUs it hears. This chapter gives you the tools that tell a switch what each port is supposed to hear: PortFast, BPDU guard, root guard and loop guard, plus BPDU filter for the v1.1 exam. By the end you can choose the right one for a port, recognise the state each one leaves behind, and bring the port back safely.

## Match protection to the port's purpose

Spanning tree builds its topology from the BPDUs it receives. It does not know which switch you meant to be root, or which ports should only ever see a PC. Each protection feature supplies one of those missing expectations, so start by asking what belongs behind the port:

- **An end device.** No BPDU should ever arrive. Use PortFast so the device connects quickly, and BPDU guard to shut the port if a switch appears.
- **A downstream switch that must never supply the root.** BPDUs are welcome, but not ones better than the real root's. Use root guard.
- **An uplink toward the root.** BPDUs must keep arriving. Use loop guard so that silence does not unblock the port.

An access port is not automatically an edge port: it can still lead to another switch that carries one VLAN. What matters is the device at the other end.

| Intended connection | Appropriate feature | What it accomplishes |
|---|---|---|
| End device with no Layer 2 transit path | PortFast plus BPDU guard | Immediate forwarding; received BPDUs trigger shutdown |
| Downstream switch outside the root-placement boundary | Root guard | Blocks superior information from taking over that boundary |
| Point-to-point root or alternate path | Loop guard | Prevents missing BPDUs from making the port designated |
| A specialized BPDU-suppression requirement | BPDU filter | Suppresses BPDUs; not a replacement for protection |

```diagram
{"type":"topology","title":"Fig 15.1 — Place the policy at the correct boundary","caption":"The access switch expects BPDUs on its uplink, rejects a superior root from the downstream lab, and rejects any BPDU from the host port.","nodes":[{"id":"CORE","kind":"switch","label":"CORE · intended root","x":1,"y":3,"highlight":true},{"id":"ACCESS","kind":"switch","label":"ACCESS","x":5,"y":3},{"id":"PC","kind":"pc","label":"PC","x":10,"y":1},{"id":"LAB","kind":"switch","label":"LAB switch","x":10,"y":5}],"links":[{"from":"CORE","to":"ACCESS","label":"ACCESS: loop guard","toBadge":"RP"},{"from":"ACCESS","to":"PC","label":"PortFast + BPDU guard","fromBadge":"Edge"},{"from":"ACCESS","to":"LAB","label":"ACCESS: root guard","fromBadge":"DP"}],"trace":{"flows":[{"path":["CORE","ACCESS"],"label":"BPDU from the intended root","tags":{"ACCESS":"Loop guard · BPDUs expected"}},{"path":["LAB","ACCESS"],"label":"Superior BPDU from the lab","tags":{"LAB":"Advertises a superior root"},"stop":"ACCESS","stopText":"Root guard · superior root rejected"}]}}
```

In Fig 15.1, ACCESS uses all three ideas: loop guard on the uplink where CORE's BPDUs are expected, root guard on the port toward the lab switch, and PortFast with BPDU guard on the PC port. The lab triggers each feature in turn on three switches, so you see the state it leaves and practise the recovery.

## PortFast and operational edge status

:::facts
- PortFast permits immediate forwarding on an end-device port; it does not disable STP.
- Interface BPDU guard reacts to any received BPDU, regardless of PortFast. Global BPDU guard applies to operational PortFast ports.
- Root guard reacts to superior BPDUs; loop guard reacts to missing expected BPDUs on applicable root/alternate ports.
- Root- and loop-inconsistent conditions recover automatically when their triggering condition ends. BPDU-guard errdisable requires manual recovery or an enabled recovery timer.
- On the IOS platforms discussed here, the errdisable recovery interval defaults to `300` seconds; automatic recovery for the cause must be enabled separately.
:::

**PortFast** tells the switch that a port connects to an end device, so the port can forward as soon as the link comes up. Without it, classic STP holds a new port in listening and then learning for `15` seconds each. A PC waits 30 seconds, long enough for some DHCP clients to give up. RSTP is fast between switches because they exchange a proposal and an agreement, but a PC cannot answer a proposal, so an RSTP port that is not marked as an edge falls back to the same timers.

PortFast does not turn STP off. The port still sends BPDUs and still listens for them; it only skips the wait. If a host on a PortFast port still cannot reach the network, check its VLAN and IP settings next.

PortFast also keeps the rest of the network calm. In RSTP, a non-edge port moving to forwarding is a topology change: switches flush learned MAC addresses and flood frames until they relearn them. An edge port going up or down is not a topology change, so a user plugging in a laptop does not disturb every MAC table in the VLAN.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# spanning-tree portfast
SW1(config-if)# end
SW1# show spanning-tree interface fastethernet0/5 detail
```

The command sets the configured state. **Operational edge status** is what the port is doing now. If a PortFast port receives a BPDU, it loses operational edge status and becomes a normal spanning-tree port, even though `spanning-tree portfast` is still in the configuration. That is the safety net when BPDU guard is absent. When BPDU guard is enabled, the port is shut down instead.

| IOS configuration | Scope |
|---|---|
| `spanning-tree portfast` | Current interface while operationally nontrunking |
| `spanning-tree portfast trunk` | Current trunk to an appropriate end device |
| `spanning-tree portfast default` | Global default for nontrunking ports |
| `spanning-tree portfast disable` | Interface exception to a global default |

Plain `spanning-tree portfast` has no effect while the port is trunking. A server or hypervisor that needs several tagged VLANs is still an end device, so its port uses the `trunk` form. Never use that form on a link to another switch: skipping the wait there can open a temporary loop. Current Catalyst IOS XE adds the word `edge` to these commands, as in `spanning-tree portfast edge trunk`. The labs use the 2960-style commands shown above.

## BPDU guard and errdisable recovery

**BPDU guard** enforces the rule that an edge port never hears a BPDU. Any BPDU triggers it; the BPDU does not have to advertise a better root. Suppose someone connects a switch with the default priority 32768 to a guarded port on SW1. That switch could never win the root election, but SW1 shuts the port anyway, because any switch on a host port can create a loop.

You can enable BPDU guard at two scopes:

- `spanning-tree bpduguard enable` is an interface command. It protects that port whether or not PortFast is on.
- `spanning-tree portfast bpduguard default` is a global command. It protects every port in the operational PortFast state and no others, so a trunk that is not PortFast is not covered.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# spanning-tree bpduguard enable
SW1(config-if)# end
SW1# show interfaces status
```

A violation puts the interface into the **err-disabled** state. The whole port stops, for every VLAN it carries, and the switch logs the reason:

```output SW1 log after a BPDU arrives on Fa0/5
%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port FastEthernet0/5 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Fa0/5, putting Fa0/5 in err-disable state
```

Read the log before you act. Several features use err-disable (port security in the next chapter is one), and only the message naming `bpduguard` tells you which one fired. Then remove the switch that sent the BPDU, or the violation repeats as soon as the port comes up. Finally, bounce the port: an err-disabled port stays down until you enter `shutdown` followed by `no shutdown`.

```ios SW1
SW1# configure terminal
SW1(config)# interface fastethernet0/5
SW1(config-if)# shutdown
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces status
```

The alternative is automatic recovery, which takes two separate settings. `errdisable recovery cause bpduguard` tells the switch to re-enable ports that BPDU guard disabled once the recovery interval passes. `errdisable recovery interval 60` changes that interval for all causes; the range is `30`–`86400` seconds and the default is `300`. Recovery is off for every cause by default, and changing the interval does not turn it on. `show errdisable recovery` lists each cause as Enabled or Disabled.

:::trap Restoring the port is not correcting the cause
Bouncing the port again, or shortening the recovery timer, does not make a prohibited switch acceptable on a host port. Remove the switch, or redesign the connection as an authorized interswitch link with the correct VLAN and STP policy.
:::

## Root guard and root-placement boundaries

**Root guard** lets a downstream switch take part in spanning tree but never lets it become the root, or the path to the root, through the guarded port. You place it on the ports of your own switches that face switches which must stay subordinate. In Fig 15.1 that is ACCESS's port toward the lab switch. It never goes on ACCESS's uplink toward CORE, because that port must accept CORE's superior BPDUs.

```ios SW1
SW1# configure terminal
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# spanning-tree guard root
SW1(config-if)# end
SW1# show spanning-tree inconsistentports
```

Suppose the intended root has priority `24576` for VLAN 10 and a training switch arrives with priority `0`. Its BPDUs are superior. Without root guard, every switch would turn its root port toward the training room. With root guard, the guarded port becomes **root-inconsistent** for VLAN 10: the link stays up, the port blocks that VLAN, and the switch logs `%SPANTREE-2-ROOTGUARD_BLOCK`. The rest of the network keeps the real root. The training switch still believes it is root of its own small island, because root guard does not change the other switch's configuration.

Root guard acts per VLAN. In Rapid PVST+, if the training switch has priority 0 only in VLAN 10, VLAN 20 keeps forwarding on the same trunk. "VLAN 10 fails while VLAN 20 works" is therefore a root-guard clue, and it rules out BPDU guard, which takes down the whole port. In `show spanning-tree vlan 10` the port appears as `BKN*` with the type `*ROOT_Inc`.

Recovery is automatic. Once the superior BPDUs stop, the port leaves the root-inconsistent state and STP returns it to forwarding with no `shutdown` and `no shutdown`. The fix therefore belongs on the downstream switch: correct its priority or its cabling, and leave the guard in place. Root guard only reacts to BPDUs that arrive. BPDUs that go missing are loop guard's job.

## Loop guard and missing BPDUs

A blocked port stays blocked only because it keeps hearing a better BPDU from the other side of the link. If those BPDUs stop while the link stays up, STP assumes the neighbour has gone, makes the port designated and moves it to forwarding. If the neighbour is in fact still there and still forwarding, the loop that the port was preventing is now open. The classic cause is a one-way fibre fault: one strand fails, so a switch can still send on the link but no longer hears anything.

**Loop guard** stops that. On a point-to-point root or alternate port, when the expected BPDUs stop arriving, the port becomes **loop-inconsistent** instead of designated. It blocks that VLAN, logs `%SPANTREE-2-LOOPGUARD_BLOCK`, and returns to its normal role automatically when BPDUs resume.

Loop guard tells you that BPDUs are missing, not why. The cause can be a one-way link, a neighbour that stopped sending, or a BPDU filter on the neighbour's port. Unplugging the cable does not test loop guard, because that takes the link down and STP reconverges in the normal way.

```ios SW3
SW3# configure terminal
SW3(config)# interface gigabitethernet0/1
SW3(config-if)# spanning-tree guard loop
SW3(config-if)# end
SW3# show spanning-tree inconsistentports
```

The global form is `spanning-tree loopguard default`, which enables loop guard on every point-to-point link. It does not disturb host ports: a port that never receives BPDUs is a designated port, and loop guard acts only on root and alternate ports that were receiving them. For the same reason it cannot catch a link that was one-way from the moment it came up.

Root guard and loop guard cannot both be active on one port; enabling one replaces the other. Root guard is for ports that should stay designated, and loop guard is for root and alternate ports. In Fig 15.1 they sit on different ports of ACCESS.

The lab creates the missing-BPDU condition with a BPDU filter, on a line of switches with no redundant link, so no loop can form. Packet Tracer may not model loop guard fully, so that step also has a paper version.

## BPDU filter: distinguish the two forms

BPDU filter is named in the v1.1 protection objective and not in the v2.0 one. Unlike the guards, it protects nothing: it stops a port from sending BPDUs and, in one form, from listening to them. The two forms behave very differently.

The interface command `spanning-tree bpdufilter enable` is unconditional. The port sends no BPDUs and ignores any it receives, whether or not PortFast is on. Spanning tree is in effect switched off on that port, so if the port ever joins a redundant path to another switch, nothing blocks the loop.

The global command `spanning-tree portfast bpdufilter default` applies only to operational PortFast ports. Such a port sends a few BPDUs at link-up and then stops sending. If it receives a BPDU, it loses PortFast status, filtering ends and normal STP runs on the port. A switch plugged into that port is still detected, which makes the global form the safer of the two.

Do not add the interface filter to a host-port template that also has BPDU guard. The filter wins: BPDUs are dropped before BPDU guard sees them, so the port never err-disables. And when BPDUs seem to be missing on a link, which is loop guard's symptom, look for a filter on the sending switch and remove it.

## Verify and troubleshoot

The first question is whether the whole port is down or one VLAN is blocked. These two outputs show the difference.

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

| Feature | Trigger | Result | Recovery |
|---|---|---|---|
| BPDU guard | Any BPDU received | Port err-disabled, all VLANs | `shutdown` and `no shutdown`, or errdisable recovery if enabled |
| Root guard | Superior BPDU received | Root-inconsistent, that VLAN | Automatic when the superior BPDUs stop |
| Loop guard | BPDUs stop on a root or alternate port | Loop-inconsistent, that VLAN | Automatic when BPDUs resume |

Work through the evidence in this order:

1. `show interfaces status` separates `err-disabled` from `notconnect` (no link), `disabled` (administratively shut down) and `connected`.
2. If the port is err-disabled, `show logging` displays the switch's stored log messages; find the one that names the port and the cause. An err-disabled port also drops out of `show spanning-tree` output. Its configuration is still there.
3. If the port is connected but a VLAN fails, use `show spanning-tree inconsistentports` and `show spanning-tree vlan 10`. For Root Inconsistent, find the downstream switch that is sending superior BPDUs. For Loop Inconsistent, find out why BPDUs stopped: check the neighbour's port for a BPDU filter, then the link itself.
4. `show spanning-tree summary` shows which global defaults are on (PortFast, BPDU guard, BPDU filter, loop guard). `show spanning-tree interface fastethernet0/5 detail` shows what applies to one active port.

After recovery, check two things: the root bridge and port roles are the ones you intended, and users can pass traffic. A port that is up again proves neither. Save the corrected configuration only, with any test settings removed.

## Exam focus

- PortFast gives an edge port immediate forwarding. STP still runs, and a received BPDU removes operational edge status even though the command stays configured.
- Interface BPDU guard works with or without PortFast; the global default covers operational PortFast ports only.
- Any received BPDU triggers BPDU guard; a superior BPDU triggers root guard; missing BPDUs trigger loop guard.
- BPDU guard err-disables the whole port. Root and loop inconsistency block one VLAN's instance in Rapid PVST+ and clear automatically.
- Remove the cause before manual or automatic errdisable recovery. The interval defaults to 300 seconds, and recovery is off until you enable the cause.
- Put root guard on designated ports facing switches that must not become root, and loop guard on point-to-point root and alternate ports.
- Root guard and loop guard are mutually exclusive on one interface.
- For v1.1, the global BPDU filter stops when a BPDU arrives; the interface BPDU filter never does.
