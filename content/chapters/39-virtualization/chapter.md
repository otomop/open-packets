---
id: virtualization
number: 39
title: Virtualization
subtitle: "Understand virtual machines, containers, host uplinks and separate routing contexts."
part: automation
domain: infra
minutes: { lesson: 65, lab: 70 }
summary: "Compare virtualization boundaries, trace a virtual machine's Ethernet traffic, and explain why VRFs keep identical prefixes separate."
objectives:
  v1: ["1.12", "1.2.f"]
  v2: ["1.2", "2.2.d"]
prereqs: [components-and-topologies, trunks-dtp, routing-table, spanning-tree]
sectionIds:
  What virtualization separates: why-one-box-pretends-to-be-many
  Virtual switches and physical uplinks: virtual-switches-vnics-and-the-trunk-to-the-host
  Cloud service and deployment models: cloud-virtualization-someone-else-runs
sources:
  - { title: "Cisco: CCNA v1.1 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: announced CCNA v2.0 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Microsoft: Hyper-V architecture", url: "https://learn.microsoft.com/en-us/windows-server/administration/performance-tuning/role/hyper-v-server/architecture" }
  - { title: "Microsoft: Hyper-V VLAN configuration", url: "https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/deploy/configure-virtual-local-area-networks-for-hyper-v" }
  - { title: "Cisco: Catalyst 2960 VLAN trunk configuration", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/b_1522e_2960_2960c_2960s_2960sf_2960p_cg_chapter_01101.html" }
  - { title: "Cisco: PortFast and BPDU Guard scope", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10586-65.html" }
  - { title: "Microsoft: container isolation modes", url: "https://learn.microsoft.com/en-us/virtualization/windowscontainers/manage-containers/hyperv-container" }
  - { title: "Docker: What is a container?", url: "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/" }
  - { title: "Docker: bridge network driver", url: "https://docs.docker.com/engine/network/drivers/bridge/" }
  - { title: "Cisco: IOS XE multiprotocol VRF CLI", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/mp_l3_vpns/configuration/xe-17/mp-l3-vpns-xe-17-book/mpls-vpn-vrf-cli-for-ipv4-and-ipv6-vpns.html" }
  - { title: "Cisco: Catalyst 9400 VRF-lite, IOS XE 17.8", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9400/software/release/17-8/configuration_guide/rtng/b_178_rtng_9400_cg/configuring_vrf_lite.html" }
  - { title: "Cisco: IOSv supported features", url: "https://developer.cisco.com/docs/modeling-labs/iosv/" }
  - { title: "NIST SP 800-145: cloud computing", url: "https://csrc.nist.gov/pubs/sp/800/145/final" }
---

A server can contain several independent operating systems, while a router can maintain several independent routing contexts. Both are forms of virtualization, but they separate different resources. Start by identifying the boundary: hardware, operating-system processes, Ethernet segments or routing tables. That distinction explains what can share an address, what can communicate locally, and which failure can affect several workloads.

## What virtualization separates

:::facts
- A **virtual machine (VM)** has virtual hardware and its own guest operating-system kernel.
- Ordinary process-isolated **containers** share the kernel of their host environment. That environment can itself be a VM.
- A **virtual switch** connects virtual network interfaces; its physical uplink may carry one untagged VLAN or several tagged VLANs.
- **Virtual routing and forwarding (VRF)** separates Layer 3 routing/forwarding contexts. It does not encrypt traffic.
- v1.1 asks you to explain server virtualization, containers and VRFs. v2.0 describes hypervisors, VMs and containers, and separately includes configuring physical switch connectivity to virtualized hosts.
:::

**Virtualization** presents a logical resource using underlying physical resources. It can improve utilization and make provisioning easier, but it does not create extra CPU capacity, memory or link bandwidth. If several VMs all need a busy disk at once, they still compete for its service. Resource limits, reservations, storage design and capacity planning remain necessary.

An operating system's **kernel** is its core software for managing resources such as processor time, memory and device access. Applications request those services from the kernel. The key comparison in this chapter is whether an environment has its own guest kernel or shares the kernel of its host environment.

You have already met a controller VM in [chapter 37](#/chapter/wireless-architecture) and switch trunks to virtualized hosts in [chapter 10](#/chapter/trunks-dtp). Here you explain what runs behind those connections. Keep using the same VLAN tagging and route-lookup rules; virtual hardware does not replace them.

Consider two application VMs on one server. Their operating systems can reboot independently, yet both depend on the server's power and hardware. Placing a second application instance on that same host protects against some guest failures but not against losing the host. Even separate hosts may share storage, a switch or power. Trace those dependencies before calling a design redundant.

| Resource being separated | Mechanism | What remains shared |
|---|---|---|
| Hardware presented to operating systems | Hypervisor and VMs | Physical host resources |
| Process execution environments | Process-isolated containers | Host-environment kernel |
| Ethernet forwarding domains | Virtual switches and VLANs | Physical NICs and uplinks |
| Layer 3 route lookup | VRFs | Router hardware and software platform |

A guest VM might connect to VLAN 10, whose gateway belongs to VRF BLUE. The VM boundary separates operating-system environments; the VLAN separates broadcasts; the VRF determines which routing table processes traffic. None of those facts alone establishes the complete access policy.

## Hypervisors and virtual machines

A **hypervisor**, also called a virtual machine monitor, creates the virtual CPU, memory, disk and network devices used by a guest. The guest boots an operating system and runs applications within that environment. Virtualization-aware drivers may improve I/O performance, so it is inaccurate to assume the guest can never know that it is virtual.

A **Type 1** hypervisor provides virtualization directly over hardware. VMware ESXi and Microsoft Hyper-V are familiar examples. A **Type 2** hypervisor operates through a general-purpose host OS; Oracle VirtualBox and VMware Workstation are familiar examples. Classify the architecture, not its administration screen. Hyper-V's Windows management environment occupies a privileged root partition above a Type 1 hypervisor.

```diagram
{"type":"layers","title":"Fig 39.1 — Locate the kernel boundary","columns":[{"title":"Virtual machine","rows":["Application","Guest OS and kernel","Virtual hardware","Hypervisor","Physical hardware"]},{"title":"Hosted virtualization","rows":["Application","Guest OS and kernel","Hosted hypervisor","Host OS","Physical hardware"]},{"title":"Process-isolated container","rows":["Application and dependencies","Container process environment","Shared host kernel","Host resources","Physical hardware or VM"]}],"caption":"A VM boots its own guest kernel; ordinary containers use their host environment's kernel."}
```

Suppose an application requires a Windows kernel and another requires Linux. Separate VMs on a compatible hypervisor can provide both operating systems. Two ordinary Linux containers cannot provide a Windows kernel merely by installing Windows application files. The required kernel interface is part of compatibility.

**vCPU**, virtual memory and **vNIC** describe resources assigned to a VM. A vCPU is a scheduling abstraction, not necessarily a permanently dedicated processor core. Allocating eight vCPUs does not prove that eight physical cores are reserved. Thinly provisioned storage still needs capacity when applications write data.

A VM image or template can make deployment repeatable. A snapshot records a point in the VM's state under the platform's rules; it is not automatically an independent backup. Live migration can move supported running workloads between hosts, but compatible CPU, storage, networking and licensing requirements must be satisfied. These are operational examples, not fixed CCNA timing or sizing values to memorize.

## Containers share the kernel

A **container image** packages application files and dependencies. A running container is an instance of that image with a process environment and a writable layer. In typical Linux process isolation, namespaces separate views such as processes and network interfaces, while resource controls can limit consumption. The application still makes system calls to the host environment's kernel.

| Question | VM | Ordinary process-isolated container |
|---|---|---|
| Who supplies the application kernel? | Its own guest OS | The host environment |
| What starts? | A guest OS and its services | Container processes |
| Can different guest kernels coexist? | Yes, within hypervisor support | Not within one shared kernel |
| Typical overhead | Includes guest OS resources | Avoids a separate guest OS boot |
| Persistent application data | Virtual disks or external storage | Volumes or other persistent storage |

Containers commonly start with less overhead than full VMs, but there is no universal image size, startup time or number per host. A large container can consume more resources than a small VM. The security boundary also depends on privilege, mounts, kernel patches and runtime configuration; do not turn a general comparison into a guarantee that a VM is secure or a container is unsafe.

Containers can run inside VMs. Linux containers on a Windows or macOS desktop often use a Linux VM supplied by the desktop runtime. Windows also offers Hyper-V-isolated containers with a dedicated kernel environment. These implementations qualify the basic shared-kernel model.

Docker provides tools for building and running containers; Kubernetes coordinates workloads across a cluster. Container networking depends on the selected driver. A bridge network with source NAT may make outbound traffic appear to come from the host; other drivers expose distinct container addresses or MACs. A physical switch's MAC table therefore does not reliably tell you how many containers exist.

## Virtual switches and physical uplinks

A **vNIC** is the VM's Ethernet attachment. A **virtual switch** forwards frames between virtual ports and, when configured, physical uplinks. VMs in the same VLAN on the same virtual switch can communicate internally. VMs in different VLANs need a Layer 3 path, even when their files reside on the same physical host.

Work through a tagged uplink. VM-A sends an untagged frame through a virtual port assigned to VLAN 10. The virtual switch associates the frame with VLAN 10 and sends it over an uplink configured to tag that VLAN. The physical switch receives an 802.1Q-tagged frame, learns VM-A's source MAC in VLAN 10 and forwards according to the destination MAC in that VLAN. The reverse direction delivers the frame to the correct virtual port.

The physical port must match the host's tagging design. One untagged VLAN can use an access port. Several tagged VLANs require a trunk with an appropriate allowed list. Do not configure a VLAN as native and untagged on one end while the other expects its traffic tagged.

This example assumes a fresh Catalyst 2960-compatible switch, a verified host uplink that tags VLANs 10 and 20, and unused untagged traffic assigned to native VLAN 999:

```ios SW1
SW1# configure terminal
SW1(config)# vlan 10
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# exit
SW1(config)# vlan 999
SW1(config-vlan)# exit
SW1(config)# interface gigabitethernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# switchport trunk allowed vlan 10,20,999
SW1(config-if)# no shutdown
SW1(config-if)# end
SW1# show interfaces trunk
```

For a verified host-only edge connection, the appropriate platform's PortFast trunk setting can reduce startup delay. Do not assume every server uplink is loop-free: a guest bridge, nested virtual switch or additional physical connection can alter the topology. Review the host's forwarding behavior before using edge-port features.

NIC teaming also needs agreement. Independent failover uplinks and a negotiated LACP bundle are different designs. Configure a port-channel only when the hypervisor's exact switch type and teaming mode support it, with matching physical-switch settings. Chapter 13 covers LACP mechanics.

:::trap Several MAC addresses are evidence, not a diagnosis
Multiple stable MACs behind one server-facing port are consistent with a virtual switch. They do not prove virtualization or rule out an unauthorized bridge. A one-address port-security policy can conflict with legitimate VM traffic; inspect the actual policy and violation mode before predicting shutdown.
:::

## Cloud service and deployment models

Virtualization is a technology; **cloud computing** is a service model with on-demand access, pooling, elasticity and measured use. A collection of VMs administered manually is not automatically a cloud. Cloud services can also provide containers, managed platforms and physical servers.

| Service model | Customer's usual responsibility | Provider supplies |
|---|---|---|
| IaaS | Guest OS, applications and their configuration | Infrastructure resources |
| PaaS | Application and data, within platform controls | Managed application platform |
| SaaS | Users, data use and permitted settings | A finished application |

A private cloud is dedicated to one organization and may be hosted off premises. A public cloud offers services for general use. A community cloud serves organizations with shared concerns. A hybrid cloud connects distinct cloud environments so they can work together; merely owning a server and separately buying email does not demonstrate an integrated hybrid design.

Renting VMs and patching their guest OS yourself is IaaS. Extending an application from a private environment into a connected public cloud can form a hybrid deployment. These labels answer different questions: service responsibility versus deployment arrangement.

Campus-to-cloud access may use internet connectivity with an IPsec VPN or a private provider connection. A private path does not inherently encrypt traffic or guarantee a latency value; the service design and agreement matter. Cloud subnets and route tables resemble familiar networking constructs, but do not assume a cloud subnet behaves exactly like an Ethernet VLAN or supports every on-premises broadcast feature.

## VRFs: one router, several routing tables

A **VRF** gives a device a separate routing and forwarding context. A routed interface belongs to one such context; subinterfaces can belong to different VRFs. Traffic arriving on a BLUE interface is looked up in BLUE's table. It does not search RED and then the global table when BLUE lacks a route.

The **global routing table** is the device's ordinary context for interfaces not assigned to a separate VRF. It is different from a **default route**, the `0.0.0.0/0` entry learned in [chapter 17](#/chapter/routing-table). Each routing context can have its own default route, or none.

Suppose BLUE and RED both use `10.10.10.0/24`. Separate VRFs make those identical prefixes distinguishable. BLUE's `10.10.10.1` gateway and RED's `10.10.10.1` gateway serve different interfaces and hosts. Isolation requires the corresponding Layer 2 domains to remain separate as well.

**VRF-lite** uses VRFs without requiring MPLS transport. Deliberate route exchange, often called route leaking, can connect selected contexts, but that is beyond this chapter's configuration scope. A VRF is not a VPN encryption mechanism, an ACL or a guest OS.

This is optional practice for supported IOS/IOS XE images, not a claim of Packet Tracer support:

```ios R1
R1# configure terminal
R1(config)# vrf definition BLUE
R1(config-vrf)# address-family ipv4
R1(config-vrf-af)# exit-address-family
R1(config-vrf)# exit
R1(config)# interface loopback10
R1(config-if)# vrf forwarding BLUE
R1(config-if)# ip address 10.39.0.1 255.255.255.255
R1(config-if)# end
R1# show ip route vrf BLUE
```

Assign the VRF before the address: moving an addressed IOS interface into a VRF removes its IP address, which must be configured again. Legacy IPv4 syntax uses `ip vrf BLUE` and `ip vrf forwarding BLUE`; use the documented form for the selected image rather than mixing syntax by assumption. A route distinguisher and MPLS design are unnecessary for this isolated exercise.

## Verify and troubleshoot

For VM connectivity, verify the guest's address and gateway, virtual-port VLAN, uplink association, physical trunk allowed list and the gateway's return path. A working host-management address does not prove that all guest VLANs work. Management may use a different VLAN or NIC.

Representative output for a host sending traffic in two VLANs:

```output SW1# show mac address-table interface gigabitethernet0/1
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0200.0000.0010    DYNAMIC     Gi0/1  ← source learned in VLAN 10
  20    0200.0000.0020    DYNAMIC     Gi0/1  ← a separate VLAN's source
```

These entries establish where the switch recently learned those sources. They do not prove an application responds, an IP address is correct or a VM has the required route.

For VRFs, first identify membership with `show vrf` or the supported `show ip vrf interfaces` form. Then read `show ip route vrf BLUE`. A global `show ip route` or ordinary router ping examines a different context. Use `ping vrf BLUE 10.10.10.10` when the destination belongs to BLUE.

If BLUE has a connected WAN subnet but a default route was configured without `vrf BLUE`, correct the route's context. For example, `ip route vrf BLUE 0.0.0.0 0.0.0.0 198.51.100.1` belongs to BLUE; the next hop must be resolvable in the intended context. Check the remote return route too. Fixing one local table does not prove the entire application path.

## Exam focus

- Explain which resources a hypervisor, VM and container provide and share.
- Trace guest traffic through virtual ports, VLANs, a physical uplink and the appropriate gateway.
- Configure the physical host port to match its access/trunk and teaming requirements.
- Explain overlapping prefixes in separate VRFs and why a lookup must use the correct context.
- Distinguish virtualization from cloud service/deployment models. Treat optional VRF CLI as reinforcement for the v1.1 explanation objective.
