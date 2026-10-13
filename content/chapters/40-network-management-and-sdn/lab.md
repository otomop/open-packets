---
title: "Separate management access from forwarding"
environment: mixed
devices: ["2 × Packet Tracer 2911 routers", "2 × Packet Tracer PCs", "Paper architecture worksheet"]
minutes: 75
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

The OSPF and SSH blocks are supplied preparation from earlier chapters, not new controller-deployment skills. Build routed connectivity, observe OSPF and forwarding, then deliberately block one management session while leaving transit traffic working. Finish by classifying controller and overlay scenarios on paper. This lab does not emulate an SDN controller, VXLAN, NETCONF or RESTCONF. All displayed sample outputs are representative, not recorded device results.

## Topology

```diagram
{"type":"topology","title":"Three functions on one routed path","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"10.1.1.10/24","x":1,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"2911","x":4,"y":3},{"id":"R2","kind":"router","label":"R2","sub":"2911","x":8,"y":3},{"id":"B","kind":"pc","label":"PC-B","sub":"10.2.2.10/24","x":11,"y":3}],"links":[{"from":"A","to":"R1","toLabel":"Gi0/1"},{"from":"R1","to":"R2","fromLabel":"Gi0/0","toLabel":"Gi0/0","label":"10.0.12.0/30","accent":true},{"from":"R2","to":"B","fromLabel":"Gi0/1"}],"caption":"R1 forwards a PC-A management connection to R2 while R2 terminates that connection."}
```

| Device/port | IPv4 address/mask | Gateway |
|---|---|---|
| PC-A FastEthernet0 | 10.1.1.10 / 255.255.255.0 | 10.1.1.1 |
| R1 Gi0/1 | 10.1.1.1 / 255.255.255.0 | — |
| R1 Gi0/0 | 10.0.12.1 / 255.255.255.252 | — |
| R2 Gi0/0 | 10.0.12.2 / 255.255.255.252 | — |
| R2 Gi0/1 | 10.2.2.1 / 255.255.255.0 | — |
| PC-B FastEthernet0 | 10.2.2.10 / 255.255.255.0 | 10.2.2.1 |

Use copper crossover or Packet Tracer auto-connect for all three direct Ethernet links (PC-to-router and router-to-router). No internet, DNS or default route is required. Keep the router console windows open throughout.

## Step 1: Configure addresses and baseline routing

Create a new file and configure the PCs through Desktop → IP Configuration. Enter these blocks on the fresh routers:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/1
R1(config-if)# ip address 10.1.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.0.12.1 255.255.255.252
R1(config-if)# ip ospf network point-to-point
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gigabitethernet0/0
R1(config-router)# network 10.0.12.1 0.0.0.0 area 0
R1(config-router)# network 10.1.1.1 0.0.0.0 area 0
R1(config-router)# end
```

```ios R2
Router> enable
Router# configure terminal
Router(config)# hostname R2
R2(config)# interface gigabitethernet0/1
R2(config-if)# ip address 10.2.2.1 255.255.255.0
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# interface gigabitethernet0/0
R2(config-if)# ip address 10.0.12.2 255.255.255.252
R2(config-if)# ip ospf network point-to-point
R2(config-if)# no shutdown
R2(config-if)# exit
R2(config)# router ospf 1
R2(config-router)# router-id 2.2.2.2
R2(config-router)# passive-interface default
R2(config-router)# no passive-interface gigabitethernet0/0
R2(config-router)# network 10.0.12.2 0.0.0.0 area 0
R2(config-router)# network 10.2.2.1 0.0.0.0 area 0
R2(config-router)# end
```

:::expected
Both used physical interfaces are up/up. OSPF becomes FULL over the point-to-point link; no DR/BDR election is required on that link. The LANs are advertised but do not send OSPF hellos. If the point-to-point command is unavailable, use broadcast at both ends and interpret its DR/BDR role instead; record the variation.
:::

```state
{"status":"OSPF FULL · LANs passive","tone":"ok","focus":["R1","R2"],"flows":[{"event":["R1","R2"],"wait":1.2,"tags":{"R1":"FULL with 2.2.2.2 · no DR/BDR","R2":"FULL with 1.1.1.1 · no DR/BDR"}}],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R1","text":"RID 1.1.1.1 · area 0"},{"node":"R2","text":"RID 2.2.2.2 · area 0"}],"rows":[["Used interfaces","up/up","ok"],["R1–R2 OSPF","FULL · point-to-point","ok"],["LAN interfaces","Advertised · no hellos"],["PC gateways","10.1.1.1 · 10.2.2.1"]]}
```

## Step 2: Read control and forwarding evidence

Before reading the tables, predict R1's next hop for PC-B and R2's return next hop for PC-A. Name which function learns those routes and which processes an ordinary transit packet.

```ios R1
R1# show ip ospf neighbor
R1# show ip route ospf
R1# show ip cef 10.2.2.10
```

```ios R2
R2# show ip ospf neighbor
R2# show ip route ospf
```

:::expected
R1 has a route to 10.2.2.0/24 via 10.0.12.2; R2 has the return route to 10.1.1.0/24 via 10.0.12.1. With the default reference bandwidth and these Gigabit interfaces, the expected OSPF path cost to the remote LAN is 2. The FULL adjacency concerns database synchronization, not proof of every application path. If PT lacks the CEF view, read the route and record that direct FIB inspection is unavailable.
:::

```state
{"status":"Routes via OSPF · cost 2","tone":"ok","focus":["R1","R2"],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R1","text":"O 10.2.2.0/24 via 10.0.12.2"},{"node":"R2","text":"O 10.1.1.0/24 via 10.0.12.1"}],"rows":[["R1 → 10.2.2.0/24","via 10.0.12.2 · cost 2","ok"],["R2 → 10.1.1.0/24","via 10.0.12.1 · cost 2","ok"],["FULL adjacency","Database sync, not path proof"]]}
```

## Step 3: Observe transit traffic

From PC-A's command window:

```text
ping 10.2.2.10
```

From PC-B also run `ping 10.1.1.10`; record the two directed tests separately. Repeat after ARP learning. Record router interface counters before and after several attempts using `show interfaces gigabitethernet0/0`. In Simulation mode, filter ICMP and follow the packets through both routers.

:::expected
The PCs can communicate in both directions. Routers forward transit ICMP using installed information; they do not invoke a new OSPF calculation per echo. Counters include other traffic as well, so their total increase is not necessarily the exact number of your pings.
:::

```state
{"status":"Transit pings both ways","tone":"ok","focus":["R1","R2"],"flows":[{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings 10.2.2.10","tags":{"R1":"Installed route → 10.0.12.2"}},{"path":["B","R2","R1","A"],"back":true,"label":"PC-B pings 10.1.1.10","tags":{"R2":"Installed route → 10.0.12.1"}}],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"rows":[["PC-A → PC-B","Replies","ok"],["PC-B → PC-A","Replies","ok"],["Per echo","No new OSPF calculation"],["Gi0/0 counters","Also count other traffic"]]}
```

## Step 4: Establish an SSH management checkpoint

On R2's console, generate keys only on this new isolated device. If prompted for a modulus, choose 2048:

```ios R2
R2# configure terminal
R2(config)# ip domain name ccna.example
R2(config)# username observer privilege 15 secret Lab-Observer-2026!
R2(config)# crypto key generate rsa modulus 2048
R2(config)# ip ssh version 2
R2(config)# line vty 0 4
R2(config-line)# login local
R2(config-line)# transport input ssh
R2(config-line)# end
R2# show ip ssh
```

If the model exposes VTY 5–15, apply the same `login local` and `transport input ssh` settings to that range too. Inspect `show running-config` to determine the available ranges. If the one-line RSA command is rejected, enter `crypto key generate rsa` and answer its modulus prompt.

From PC-A:

```text
ssh -l observer 10.2.2.1
```

Enter the fictional password at its prompt. On R2's console use `show users`; then type `exit` in the PC's SSH session.

:::expected
The VTY session identifies observer and source 10.1.1.10. R2 is the management endpoint; R1 forwards the same packets as transit traffic. This is a simulator exercise, not a claim to have verified production SSH host identity.
:::

```state
{"status":"SSH to R2 checkpoint","tone":"ok","focus":["R2"],"flows":[{"path":["A","R1","R2"],"back":true,"label":"ssh -l observer 10.2.2.1","tags":{"R1":"Forwards as transit traffic","R2":"Mgmt endpoint · observer 10.1.1.10"}}],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R2","text":"SSHv2 · VTY ssh only","tone":"ok"}],"rows":[["R2 SSH","Version 2 · RSA 2048","ok"],["VTY lines","login local · transport input ssh"],["show users","observer · 10.1.1.10","ok"],["Roles","R2 endpoint · R1 transit"]]}
```

## Step 5: Block the management source and observe

Predict new SSH, transit ping and OSPF outcomes before applying the change. Apply this deliberately restrictive VTY ACL from R2's still-open console. Include VTY 5–15 only if that range exists.

```ios R2
R2# configure terminal
R2(config)# ip access-list standard LAB-MGMT
R2(config-std-nacl)# 10 permit host 10.2.2.10
R2(config-std-nacl)# 20 deny any
R2(config-std-nacl)# exit
R2(config)# line vty 0 4
R2(config-line)# access-class LAB-MGMT in
R2(config-line)# end
```

Repeat the same ACL attachment on any existing VTY 5–15 range. Attempt a **new** PC-A SSH session. Separately ping PC-B and inspect OSPF neighbors.

:::expected
PC-A's source 10.1.1.10 is denied by the VTY ACL. Transit pings still work and OSPF remains FULL. This ACL applies to management access, not the routers' transit interfaces. If SSH still works, confirm that you opened a new session and covered every usable VTY range.
:::

```state
{"status":"PC-A SSH denied","tone":"warn","focus":["R2"],"flows":[{"event":["R2"],"wait":1.2,"tags":{"R2":"VTY access-class LAB-MGMT in"}},{"path":["A","R1","R2"],"label":"New ssh -l observer 10.2.2.1","tags":{"R1":"Forwards as transit traffic"},"stop":"R2","stopText":"VTY ACL denies source 10.1.1.10"},{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings PC-B","tags":{"R2":"Transit · VTY ACL doesn't apply"}}],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R2","text":"SSHv2 · VTY ssh only","tone":"ok","until":0},{"node":"R2","text":"VTY ACL permits PC-B only","tone":"warn","from":0}],"rows":[["LAB-MGMT","10 permit 10.2.2.10 · 20 deny any"],["New PC-A SSH","Denied","warn"],["Transit ping","Still works","ok"],["OSPF","Still FULL","ok"]]}
```

## Step 6: Restore authorized management access

Add PC-A before the explicit deny:

```ios R2
R2# configure terminal
R2(config)# ip access-list standard LAB-MGMT
R2(config-std-nacl)# 15 permit host 10.1.1.10
R2(config-std-nacl)# end
R2# show access-lists LAB-MGMT
```

Open a fresh SSH session and repeat the transit ping. Close the SSH session afterwards.

:::expected
PC-A now matches the permit at sequence 15. Management access and transit forwarding both work. Counter changes can support the test, but cumulative counters alone do not identify the source of every packet.
:::

```state
{"status":"Management restored","tone":"ok","focus":["R2"],"flows":[{"event":["R2"],"wait":1.2,"tags":{"R2":"15 permit host 10.1.1.10"}},{"path":["A","R1","R2"],"back":true,"label":"Fresh ssh -l observer 10.2.2.1","tags":{"R2":"Matches permit 15 · VTY session"}},{"path":["A","R1","R2","B"],"back":true,"label":"PC-A pings PC-B"}],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R2","text":"VTY ACL permits PC-B only","tone":"warn","until":0},{"node":"R2","text":"VTY ACL permits PC-B, PC-A","tone":"ok","from":0}],"rows":[["LAB-MGMT","10 PC-B · 15 PC-A · 20 deny any"],["New PC-A SSH","Matches permit 15","ok"],["Transit ping","Works","ok"]]}
```

## Step 7: Identify drift before changing anything

On paper, the approved description for R2 Gi0/1 is exactly `Branch-B LAN`. Read:

```ios R2
R2# show running-config interface gigabitethernet0/1
```

If PT rejects that form, read the full running configuration and locate the interface stanza. Identify the smallest change needed. This is a harmless metadata example, not a claim to have run an automation engine.

:::expected
The fresh interface has no description, so it differs from approved intent. Existing addresses, OSPF and interface state already match the required network; changing them would be unnecessary.
:::

```state
{"status":"Drift: no description","focus":["R2"],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R2","text":"VTY ACL permits PC-B, PC-A"},{"node":"R2","text":"Gi0/1 · no description","tone":"warn"}],"rows":[["Approved Gi0/1 description","Branch-B LAN"],["Running config","No description","warn"],["Addresses · OSPF · state","Already match","ok"],["Smallest change","Add the description only"]]}
```

## Step 8: Apply and verify the intended metadata

```ios R2
R2# configure terminal
R2(config)# interface gigabitethernet0/1
R2(config-if)# description Branch-B LAN
R2(config-if)# end
R2# show interfaces description
```

Use the full running configuration if the description summary is unavailable. Explain what a second comparison should report.

:::expected
The description matches and no further description change is needed. Reapplying the identical desired description has the same intended result; this illustrates idempotence. It does not establish that every arbitrary script is idempotent.
:::

```state
{"status":"Description matches intent","tone":"ok","focus":["R2"],"flows":[{"event":["R2"],"wait":1.2,"tags":{"R2":"Gi0/1 description Branch-B LAN"}}],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R2","text":"VTY ACL permits PC-B, PC-A"},{"node":"R2","text":"Gi0/1 · no description","tone":"warn","until":0},{"node":"R2","text":"Gi0/1 · Branch-B LAN","tone":"ok","from":0}],"rows":[["Gi0/1 description","Branch-B LAN","ok"],["Second comparison","No further change needed"],["Reapplying it","Same result · idempotent"]]}
```

## Step 9: Map the architecture on paper

Draw an inventory application, controller and two managed switches. Label each interface by its participants without copying protocol names as the answer. Then draw an inner 1500-byte IPv4 packet carried in an untagged inner Ethernet frame through VXLAN over outer IPv4.

Calculate the outer IP packet size using inner Ethernet 14, VXLAN 8, UDP 8 and outer IPv4 20 bytes. Identify which addresses an intermediate router uses. Finally explain what you can conclude when a management controller becomes unavailable but one existing user flow still works.

:::solution
Application/controller is northbound; controller/infrastructure is southbound. Outer IP length is 1500 + 14 + 8 + 8 + 20 = 1550 bytes. The intermediate router uses the outer destination. The working flow proves that particular forwarding path still works at that moment; it does not prove new endpoint discovery, authentication or later convergence. No VXLAN packets were generated by this Packet Tracer lab.
:::

```state
{"status":"Paper architecture worksheet","roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R2","text":"VTY ACL permits PC-B, PC-A"},{"node":"R2","text":"Gi0/1 · Branch-B LAN"}],"rows":[["Worksheet","App · controller · two switches"],["Inner packet","1500-byte IPv4 · untagged frame"],["Header bytes","Inner Eth 14 · VXLAN 8 · UDP 8 · IPv4 20"]]}
```

## Step 10: Save the verified configuration

```ios R1
R1# copy running-config startup-config
```

Accept R1's destination filename with Enter and wait for completion before switching consoles.

```ios R2
R2# copy running-config startup-config
```

Accept R2's destination filename with Enter and wait for completion. Save `management-planes-baseline.pkt` with a short record of each successful and failed test.

:::expected
The saved design includes both authorized management sources, correct routing and the intended description. Neither router exposes a NETCONF or RESTCONF server as part of this lab.
:::

```state
{"status":"Baseline saved","tone":"ok","focus":["R1","R2"],"roles":[{"node":"R1","peer":"R2","text":"P2P"},{"node":"R2","peer":"R1","text":"P2P"},{"node":"R1","peer":"A","text":"passive"},{"node":"R2","peer":"B","text":"passive"}],"chips":[{"node":"R2","text":"VTY ACL permits PC-B, PC-A","tone":"ok"},{"node":"R2","text":"Gi0/1 · Branch-B LAN","tone":"ok"}],"rows":[["Saved","R1 and R2 · startup-config","ok"],["File","management-planes-baseline.pkt","ok"],["Includes","Both mgmt sources · routing · description"],["NETCONF · RESTCONF","Not exposed","dim"]]}
```

## Troubleshooting

- OSPF fails: check the exact transit addresses, interface status, matching network type and area.
- Pings fail: check both PC gateways and both route tables before assuming an ACL fault.
- SSH fails after the ACL repair: inspect VTY ranges, sequence order, actual source address, keys and local login.
- A controller is unreachable in a real network: inspect its documented management protocols; a user ping tests a different service.

### Evidence to keep

Submit one observation for each plane, the exact management source and VTY rule, a new failed SSH attempt while transit works, and a separate successful recovery. Keep before/after desired-state comparisons and the architecture worksheet. A successful command or saved file is not an operational acceptance test.

## Challenge

In a separate copy, review this proposed change before applying anything. PC-A (`10.1.1.10`) is now the **only** approved remote administrator of R2. PC-B (`10.2.2.10`) must keep ordinary routed ping connectivity but must no longer open new SSH sessions. R2 Gi0/1's approved description becomes `Branch-B users`. Keep both IP networks and OSPF unchanged.

The recovered configuration currently permits PC-B at sequence 10, PC-A at 15, then denies other sources at 20. A proposed plan removes sequence 15, changes the description and reports “successful deployment” after checking only the description. Identify the two problems, write the smallest correct change and choose acceptance tests. Keep console access, establish PC-B's new SSH baseline first, and close old sessions before testing the new policy.

On paper, a cloud-hosted controller applies the reviewed, versioned desired-state file through an automation pipeline. Classify the overlapping management approaches, label the controller's two API directions and distinguish a successful job status from completion of your acceptance tests. No controller or pipeline is emulated here.

:::solution
The proposed deletion removes approved PC-A rather than disallowed PC-B. Checking only the description omits access and forwarding requirements. At R2's console:

```ios R2
R2# configure terminal
R2(config)# ip access-list standard LAB-MGMT
R2(config-std-nacl)# no 10
R2(config-std-nacl)# exit
R2(config)# interface gigabitethernet0/1
R2(config-if)# description Branch-B users
R2(config-if)# end
R2# show access-lists LAB-MGMT
R2# show running-config
R2# show ip ospf neighbor
```

Preserve sequence 15 permitting PC-A and sequence 20 denying other sources; verify the list remains attached to every usable VTY range. Before the change PC-B can attempt `ssh -l observer 10.2.2.1` with the supplied account, then exit. Afterward a **new** PC-B attempt must be denied, while PC-A's new SSH attempt succeeds. Test PC-A → PC-B and PC-B → PC-A pings, OSPF state and the exact new description. These establish different parts of acceptance; one result cannot replace the others.

If a simulator omits named-ACL sequence deletion, stop before editing and record the proposed ordered entries as a worksheet. Do not improvise a broader policy replacement. The required final list is PC-A permit then deny any; no IP, OSPF or transit-interface policy change is needed. Live verification remains unexecuted for that unsupported variation.

The management workflow can be cloud-based, controller-based, automation-based and infrastructure as code simultaneously. The pipeline/application talks to the controller northbound; the controller talks to managed devices southbound. The device CLI used in this lab is device-based administration. A job result records the tool's outcome; fresh device state and all intended service tests establish whether the change is complete.

Save a verified challenge copy only after the tests, accepting each device's save prompt separately. The recovered baseline remains available.
:::
