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

A new server is racked with one cable to SW1. A week later it runs a dozen "machines" in two VLANs, and the port that was set up for a single PC no longer fits. Elsewhere, one router must carry two customers who both number their LAN `10.10.10.0/24`. Both problems are solved by **virtualization**: making one physical device behave as several logical ones.

You already have the networking: 802.1Q trunks from [chapter 10](#/chapter/trunks-dtp), PortFast from [chapter 15](#/chapter/stp-protection) and route lookup from [chapter 17](#/chapter/routing-table). This chapter shows what sits behind the server-facing port and inside that router. By the end you will be able to tell a Type 1 hypervisor from a Type 2 and a virtual machine from a container, configure and check the switch port for a virtualized host, name the cloud service and deployment models, and explain why two VRFs can hold the same prefix.

## What virtualization separates

:::facts
- A **hypervisor** shares one physical server among several **virtual machines (VMs)**. Type 1 runs directly on the hardware; Type 2 runs as an application on a host operating system.
- A **VM** has virtual hardware and its own guest operating-system kernel.
- A **container** packages an application with its dependencies and shares the kernel of its host. That host can itself be a VM.
- A **virtual switch** connects virtual network interfaces; its physical uplink may carry one untagged VLAN or several tagged VLANs.
- **Virtual routing and forwarding (VRF)** gives one router several separate routing tables. It does not encrypt traffic.
- v1.1 asks you to explain server virtualization, containers and VRFs. v2.0 describes hypervisors, VMs and containers, and separately includes configuring physical switch connectivity to virtualized hosts.
:::

Every kind of virtualization in this chapter answers one question: what does each tenant get a private copy of, and what do all tenants still share? That boundary tells you what can reuse an address, what can talk without leaving the box, and what fails together.

Before virtualization, the usual practice was one application per physical server, and most servers sat nearly idle. Running several VMs on one host uses the hardware properly and turns "install a server" into "copy a file". It does not create CPU, memory or bandwidth: VMs that all need a busy disk compete for it.

One term decides most of the comparisons that follow. An operating system's **kernel** is its core: it schedules the processor, manages memory and controls devices for the applications above it. A VM boots its own kernel. A container uses the kernel of its host.

| Resource being separated | Mechanism | What remains shared |
|---|---|---|
| Hardware presented to operating systems | Hypervisor and VMs | Physical host resources |
| Application environments | Containers | The host's kernel |
| Ethernet forwarding domains | Virtual switches and VLANs | Physical NICs and uplinks |
| Layer 3 route lookup | VRFs | Router hardware and software |

The boundaries stack. A guest VM might connect to VLAN 10, whose gateway is in VRF BLUE. The VM boundary separates its operating system from its neighbours', the VLAN separates its broadcasts, and the VRF decides which routing table handles its packets.

Sharing is also the risk. Two application VMs on one server reboot independently, yet both stop when that server loses power. Separate hosts may still share storage, a switch or a power feed, so trace what is shared before you call a design redundant.

## Hypervisors and virtual machines

A **hypervisor**, also called a virtual machine monitor, is the software that divides one physical server, the **host**, among several VMs. Each VM is a **guest**: the hypervisor gives it a virtual CPU, memory, disk and network adapter, and schedules all the guests onto the real hardware. The guest boots an ordinary operating system as if it owned a whole computer. The Catalyst 9800-CL controller from [chapter 37](#/chapter/wireless-architecture) is a VM of this kind.

Hypervisors come in two types. Tell them apart by what sits directly on the hardware.

| | Type 1 (bare-metal or native) | Type 2 (hosted) |
|---|---|---|
| Runs on | The server hardware directly | A general-purpose host OS, as an application |
| Typical use | Data-center and production servers | A desktop or laptop, for labs and testing |
| Examples | VMware ESXi, Microsoft Hyper-V | Oracle VirtualBox, VMware Workstation |

A Type 2 hypervisor depends on its host OS: if that OS crashes, every guest goes with it. A Type 1 hypervisor removes that layer, which is why production servers use it. Classify by architecture, not by the management screen: Hyper-V is managed from Windows, but that Windows runs in a privileged partition on top of the hypervisor, so Hyper-V is Type 1.

```diagram
{"type":"layers","title":"Fig 39.1 — Locate the kernel boundary","columns":[{"title":"VM on a Type 1 hypervisor","rows":["Application","Guest OS and kernel","Virtual hardware","Hypervisor","Physical hardware"]},{"title":"VM on a Type 2 hypervisor","rows":["Application","Guest OS and kernel","Hosted hypervisor","Host OS","Physical hardware"]},{"title":"Container","rows":["Application and dependencies","Container","Container engine","Host OS and shared kernel","Physical hardware or a VM"]}],"caption":"A VM boots its own guest kernel; containers share the kernel of the host they run on."}
```

Suppose one application needs a Windows kernel and another needs Linux. Two VMs on one hypervisor can run both, because each boots its own operating system. Two containers on one Linux host cannot: both use the host's Linux kernel.

A VM's resources are virtual versions of familiar parts: **vCPUs**, virtual memory, virtual disks and a **vNIC** (virtual network interface card) with its own MAC address. A vCPU is a share of processor time, not a reserved core, so busy VMs compete for the host's real cores.

Because a VM is stored as files, it can be copied from a template or captured in a **snapshot**, a saved state to roll back to. A snapshot lives on the VM's own storage, so it is not a backup. **Live migration** moves a running VM to another host. The VM keeps its IP and MAC addresses, so the destination host's uplink must carry the same VLAN.

## Containers share the kernel

A VM virtualizes hardware, so every VM carries a complete guest OS that has to boot, be patched and hold memory. A **container** virtualizes the operating system instead. It packages one application with the libraries it needs and runs as isolated processes on the host's kernel. With no guest OS to boot, a container usually starts in seconds and takes far less memory and disk than a VM running the same application.

- A **container image** is the read-only package of application files and dependencies.
- A **container** is a running instance of an image. Many containers can start from one image.
- A **container engine**, such as Docker, builds images and starts and stops containers on one host. An **orchestrator**, such as Kubernetes, runs containers across a cluster of hosts.

The kernel does the isolating: it gives each container its own view of processes, files and network interfaces, and can cap its CPU and memory.

| Question | VM | Container |
|---|---|---|
| Who supplies the kernel? | Its own guest OS | The host |
| What starts? | A guest OS and its services | The application's processes |
| Can different operating-system kernels share one host? | Yes | No |
| Typical size and start time | Larger and slower: a full OS boots | Smaller and faster: no OS boot |
| Isolation | Stronger: separate kernels | Weaker: one kernel fault affects every container |

The two are often combined. Cloud providers run customers' containers inside VMs, and Docker Desktop on Windows or macOS runs Linux containers inside a small Linux VM. The containers still share the kernel of the VM they run in.

Container networking affects what your switch sees. On Docker's default bridge network, the host translates containers' outbound traffic to its own address with the source NAT from [chapter 26](#/chapter/nat-pat), so the physical switch learns only the host's MAC address. Other network drivers give each container its own MAC address. Count containers on the host, not in the MAC table.

## Virtual switches and physical uplinks

The VMs on a host need a switch, and the hypervisor provides one in software. Each VM's **vNIC** plugs into a port on a **virtual switch**, and the host's physical NICs are that switch's uplinks to yours. The rules you know still apply: VMs in the same VLAN on the same virtual switch reach each other without the frame leaving the server, and VMs in different VLANs need a router even though they share a host.

Work through a tagged uplink. VM-A sends an untagged frame into a virtual port assigned to VLAN 10. The virtual switch sends it out of the uplink with an 802.1Q tag for VLAN 10. SW1 learns VM-A's source MAC in VLAN 10 on that port and forwards by destination MAC within VLAN 10. The reply returns tagged, and the virtual switch strips the tag before delivering it. The VM never sees a tag, exactly like a PC on an access port.

So the physical port must match the host's tagging. A host that sends one untagged VLAN needs an access port. A host that tags several VLANs needs a trunk that allows every one of them. The native VLAN must agree too: if SW1 sends a VLAN untagged as native while the host expects it tagged, that VLAN fails while the others work.

This example configures a Catalyst 2960 port for a host that tags VLANs 10 and 20. Untagged frames go to the unused native VLAN 999:

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

Typical virtual switches do not run spanning tree and do not forward frames between their own uplinks, so a host trunk is normally an edge port. `spanning-tree portfast trunk` from [chapter 15](#/chapter/stp-protection) spares it the 30-second listening and learning delay each time the link comes up. Use it only when nothing on the host bridges two uplinks together.

Hosts usually have two or more uplinks, called **NIC teaming**, in one of two designs. With independent uplinks the virtual switch pins each VM to one NIC and moves it if that NIC fails; SW1's ports stay separate trunks. With an LACP bundle, SW1 needs a matching port-channel from [chapter 13](#/chapter/etherchannel). A port-channel facing a host that is not bundling, or the reverse, drops traffic or makes MAC addresses flap between ports.

:::trap Several MAC addresses on one port
A virtualized host shows one MAC address per vNIC behind a single switch port. That is normal, and it breaks port security's default limit of one address from [chapter 16](#/chapter/layer2-security): the second VM triggers a violation and the default action shuts the port down. An unauthorized switch produces the same MAC-table evidence, so check what the port should connect before you raise the limit.
:::

## Cloud service and deployment models

Virtualization makes cloud practical, but the words are not synonyms. **Cloud computing** is a way of consuming computing as a service. NIST defines it by five characteristics: on-demand self-service, broad network access, resource pooling, rapid elasticity and measured service. A rack of VMs that an administrator builds by hand on request is virtualized, but it is not a cloud. **On-premises** equipment is owned and run by the organization at its own site.

The **service model** says how much the provider runs for you:

| Service model | The provider runs | You manage |
|---|---|---|
| IaaS (infrastructure as a service) | Servers, storage, network and hypervisor | Guest OS, applications and data |
| PaaS (platform as a service) | Everything up to the OS and runtime | Your application and data |
| SaaS (software as a service) | The whole application, such as hosted email | Your users, settings and data |

The **deployment model** says who uses the cloud:

- **Public cloud**: open to any customer, on shared resources.
- **Private cloud**: used by one organization, on its premises or hosted by a provider.
- **Community cloud**: shared by organizations with a common concern, such as the same regulations.
- **Hybrid cloud**: two or more of these joined so that workloads and data can move between them.

The two labels answer different questions. Renting VMs and patching their guest OS yourself is IaaS. Extending an application from your private cloud into connected public-cloud capacity is hybrid. Owning a server and separately buying hosted email is not hybrid, because nothing connects the two.

Reaching a cloud workload usually means an IPsec VPN across the internet, as in [chapter 35](#/chapter/vpns-ipsec), or a private WAN connection from a provider. The VPN is encrypted but shares the internet's unpredictable path. The private connection stays off the internet and behaves more predictably, but is not encrypted unless you add encryption.

## VRFs: one router, several routing tables

A VLAN makes one switch behave as several. A **VRF** (virtual routing and forwarding instance) does the same for a router: it gives one router several separate routing tables. Each Layer 3 interface, whether a physical port, a subinterface or an SVI, belongs to one VRF. A packet arriving on it is looked up only in that VRF's table, and if nothing matches it is dropped. The router does not try another VRF or the global table.

The **global routing table** is the ordinary table for every interface you have not placed in a VRF; it is what `show ip route` displays. It is not the same as a **default route**, the `0.0.0.0/0` entry from [chapter 17](#/chapter/routing-table). Each VRF can hold its own default route, or none.

Now the opening problem. Customers BLUE and RED both use `10.10.10.0/24` with a gateway at `10.10.10.1`:

| R1 interface | VRF | Address | Listed by |
|---|---|---|---|
| Gi0/1 | BLUE | 10.10.10.1/24 | `show ip route vrf BLUE` |
| Gi0/2 | RED | 10.10.10.1/24 | `show ip route vrf RED` |

In one table IOS would reject the second address because it overlaps the first. In separate VRFs both are accepted, because the two prefixes never meet in one lookup. A packet that enters R1 on a BLUE interface for `10.10.10.20` goes to BLUE's host; RED's host with the same address is never a candidate. Keep Layer 2 separate too: BLUE and RED hosts in one VLAN would share a broadcast domain whatever the routing tables say.

Service providers combine VRFs with MPLS to carry many customers over a shared backbone. VRFs used on their own, without MPLS, are called **VRF-lite**. Traffic crosses between VRFs only if you deliberately exchange routes between them (route leaking, outside this chapter). A VRF separates routes and nothing else: it does not encrypt like IPsec or filter like an ACL.

The exam asks you to explain VRFs, not to configure them, but the configuration makes the idea concrete. It needs a full IOS or IOS XE image; do not count on Packet Tracer for it:

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

`vrf definition BLUE` creates the VRF, `address-family ipv4` enables IPv4 in it, and `vrf forwarding BLUE` places the interface in it. Assign the VRF before the address: putting an interface into a VRF removes any IP address already on it. Older IPv4-only syntax uses `ip vrf BLUE` globally and `ip vrf forwarding BLUE` on the interface.

## Verify and troubleshoot

Virtualized-host problems are usually trunk problems, and VRF problems usually come from looking in the wrong table.

For a VM, follow the frame: the guest's address and gateway, the VLAN on its virtual port, the tagging on the host uplink, the allowed list and native VLAN on SW1's trunk, and finally the gateway. A common symptom is that the host answers but one VM does not. Host management often uses a different VLAN or NIC, so it proves nothing about the guest VLANs. Start on SW1:

```output SW1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      999

Port        Vlans allowed on trunk
Gi0/1       10,999    ← VLAN 20 is missing, so its guests are cut off
```

Repair a missing VLAN with `switchport trunk allowed vlan add 20`; without `add`, the command replaces the whole list. Then confirm that SW1 is learning the guests:

```output SW1# show mac address-table interface gigabitethernet0/1
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0200.0000.0010    DYNAMIC     Gi0/1  ← source learned in VLAN 10
  20    0200.0000.0020    DYNAMIC     Gi0/1  ← a separate VLAN's source
```

Each entry shows that SW1 recently received a frame from that source in that VLAN. It says nothing about the VM's IP address, gateway or application.

For a VRF, `show vrf` lists each VRF and its interfaces, `show ip route vrf BLUE` shows BLUE's table, and `ping vrf BLUE 10.10.10.10` tests from inside it. Plain `show ip route` and plain `ping` use the global table. The classic mistake is to run them, see no route, and conclude that a route is missing when it sits in a VRF.

Static routes have the same trap. `ip route 0.0.0.0 0.0.0.0 198.51.100.1` puts a default route in the global table, where BLUE's traffic never looks. BLUE needs `ip route vrf BLUE 0.0.0.0 0.0.0.0 198.51.100.1`, with a next hop reachable in BLUE.

## Exam focus

- Type 1 hypervisors run directly on hardware (ESXi, Hyper-V). Type 2 hypervisors run on a host OS (VirtualBox, VMware Workstation).
- A VM boots its own guest kernel. A container shares its host's kernel, so it is smaller and starts faster but cannot bring a different kernel.
- A host that tags several VLANs needs a trunk whose allowed list and native VLAN match it; a host with one untagged VLAN needs an access port.
- A VRF is a separate routing table on one router. Overlapping prefixes can exist in different VRFs, a lookup never falls back to another table, and a VRF does not encrypt. VRF-lite is VRFs without MPLS.
- Check a VRF with `show ip route vrf BLUE` and `ping vrf BLUE`. v1.1 asks you to explain VRFs, so treat the commands as reinforcement.
- IaaS, PaaS and SaaS describe who manages what. Public, private, community and hybrid describe who uses the cloud.
