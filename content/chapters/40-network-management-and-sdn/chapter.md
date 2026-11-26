---
id: network-management-and-sdn
number: 40
title: "Network management and SDN"
subtitle: "Separate forwarding, control and management, then compare how networks are operated."
part: automation
domain: aiops
minutes: { lesson: 65, lab: 75 }
summary: "Understand controllers and their APIs, trace traffic through an underlay and overlay, and compare device, cloud, controller, automation and infrastructure-as-code workflows."
objectives:
  v1: ["6.1", "6.2", "6.3", "6.3.a", "6.3.b"]
  v2: ["5.3"]
prereqs: [ios-essentials, ospfv2, virtualization, acls, ntp-syslog-snmp, troubleshooting-toolkit]
sectionIds:
  Make changes repeatable and verifiable: why-forty-switches-need-one-brain
sources:
  - { title: "RFC 9110: HTTP request and response semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html" }
  - { title: "RFC 8259: JSON object members and values", url: "https://www.rfc-editor.org/rfc/rfc8259" }
  - { title: "Cisco: CCNA v1.1 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: announced CCNA v2.0 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco: IOS XE hardening and traffic planes", url: "https://sec.cloudapps.cisco.com/security/center/resources/IOS_XE_hardening" }
  - { title: "Cisco: CEF command reference", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipswitch/command/isw-cr-book/isw-s1.html" }
  - { title: "Cisco: SDN and network automation", url: "https://www.cisco.com/c/en/us/solutions/collateral/enterprise/cisco-on-cisco/cs-en-08022017-sdn-thesis.html" }
  - { title: "Cisco: SD-Access design guide", url: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-sda-design-guide.html" }
  - { title: "Cisco: SD-Access deployment profile", url: "https://www.cisco.com/c/en/us/td/docs/cloud-systems-management/network-automation-and-management/catalyst-center/cisco-validated-solution-profiles/validated-profile-sda-deployment.html" }
  - { title: "Cisco: Catalyst SD-WAN solution overview", url: "https://www.cisco.com/c/en/us/td/docs/routers/sdwan/26x-later/solution/cisco-catalyst-sd-wan-solution-overview/solution.html" }
  - { title: "Cisco: ACI Virtual Edge and OpFlex", url: "https://www.cisco.com/c/en/us/td/docs/switches/datacenter/aci/aci_virtual_edge/configuration/3-x/cisco-aci-virtual-edge-configuration-guide-30x/Cisco-ACI-Virtual-Edge-Configuration-Guide-221_chapter_01.html" }
  - { title: "RFC 7348: VXLAN", url: "https://www.rfc-editor.org/rfc/rfc7348" }
  - { title: "RFC 6241: NETCONF", url: "https://www.rfc-editor.org/rfc/rfc6241" }
  - { title: "RFC 8040: RESTCONF", url: "https://www.rfc-editor.org/rfc/rfc8040" }
  - { title: "HashiCorp: manage resource drift", url: "https://docs.hashicorp.com/terraform/tutorials/state/resource-drift" }
---

Forty switches need the same two NTP servers by Friday. You can open forty SSH sessions and type the same lines forty times, or you can tell one system what you want and let it push the change, check it and report back. This chapter is about that second way of working: controllers, the APIs they expose and the overlay networks they build.

Everything you have configured so far still runs underneath: OSPF from [chapter 21](#/chapter/ospfv2), ACLs from [chapter 34](#/chapter/acls), SSH, SNMP and syslog. What changes is where decisions are made and how they reach the devices. By the end you will be able to sort any device activity into the data, control or management plane, compare traditional and controller-based networks, label northbound and southbound APIs, explain underlay, overlay and fabric, and name the five management approaches.

## Make changes repeatable and verifiable

:::facts
- The **data plane** forwards traffic. The **control plane** establishes forwarding information. The **management plane** configures and monitors the system.
- A controller provides a logically centralized service; it may run on one system or a redundant cluster.
- **Northbound** connects applications with a controller. **Southbound** connects a controller with managed infrastructure.
- An **underlay** provides transport reachability. An **overlay** builds logical connectivity over that transport.
- Device-based, cloud-based, controller-based, automation-based and infrastructure-as-code approaches can coexist.
:::

Take the forty switches. Done by hand, the job is forty logins, forty chances for a typo and no record of what each switch looked like before. The work is more than typing: you have to pick the right devices, record their current settings, apply the new values, check that each clock synchronizes and keep the evidence.

**Automation** hands the repeatable part to software. A tool reads an inventory of devices, applies one reviewed template to all of them and collects the results. The change is faster, identical on every device and leaves a record. The cost is that a wrong address is also applied to forty devices in seconds, so you review the inputs, run against a few devices first and verify the result.

**Desired state** is what you intend the network to be; **observed state** is what the devices report. **Configuration drift** is any difference between the two, such as a server address someone changed by hand. The approved record of desired state is called the **source of truth**. It can be a reviewed inventory file or a controller's policy.

A device accepting a command is not the same as the change working. A switch can accept `ntp server 10.200.0.10` and still fail to reach that server. Check the configuration, then check that the clock is synchronized. The same two-step check applies to a VLAN job or an access-policy deployment.

## The three planes of a network device

Every job a router or switch does belongs to one of three planes. Exam questions give you an activity and ask for its plane, so learn each plane by what it does. The planes are roles, not three separate processors: a physical switch forwards in hardware and a virtual router forwards in software, and both are doing data-plane work.

| Plane | Function | Clear example |
|---|---|---|
| Data | Process a packet/frame according to installed forwarding and policy information | Route a transit packet; apply an ACL; add a VLAN tag |
| Control | Establish reachability and forwarding state | OSPF adjacency, route calculation, STP role selection |
| Management | Configure, inspect and monitor | SSH administration, SNMP counter retrieval, controller configuration |

OSPF exchanges information and computes routes. The routing information base, or **RIB**, holds selected routing information. A **forwarding information base (FIB)** supports forwarding lookups; Cisco Express Forwarding also uses adjacency information for the next-hop rewrite. OSPF does not recalculate the path separately for every application packet.

Representative views of the same destination:

```output R1 route and forwarding views
O 10.2.2.0/24 [110/2] via 10.0.12.2, GigabitEthernet0/0  ← learned routing information
show ip cef 10.2.2.10
10.2.2.0/24
  nexthop 10.0.12.2 GigabitEthernet0/0                    ← forwarding next hop
```

An SSH connection terminating on R2 is management traffic at R2. The same packets traversing R1 are forwarded by R1's data plane. Their role depends on the device and function under discussion. Similarly, packets requiring exceptional processing can reach a device CPU without becoming a routing-protocol exchange.

A quick test sorts most cases. Traffic passing *through* the device is data plane. Traffic addressed *to* the device that builds its tables, such as OSPF hellos, STP BPDUs and ARP, is control plane. Traffic between the device and an administrator or monitoring system, such as SSH, SNMP and syslog, is management plane.

## Traditional versus controller-based networking

A traditional network has a **distributed control plane**: every router runs its own routing protocol, exchanges information with its neighbors and computes its own forwarding table. You can still automate such a network with scripts and templates, because "traditional" describes where control lives, not how commands are entered.

**Controller-based networking** adds a central service, the controller, that holds a view of the whole network and takes over some or all of the control and management work. In some designs the controller programs forwarding entries directly. In others, including Cisco's, devices keep running routing protocols and the controller centralizes policy, provisioning and monitoring. In every design the devices still forward the traffic.

| Question | Distributed device control | Controller-based approach |
|---|---|---|
| Where are routes learned? | Commonly through protocols on devices | Depends on architecture; device protocols may remain |
| Where is policy expressed? | Device configurations and operational tools | A controller can translate network-level policy |
| Can software automate it? | Yes, through device interfaces | Yes, often through controller APIs |
| Where is user traffic forwarded? | By network devices | Usually by network devices; verify the actual data path |

**Logically centralized** describes the service presented to applications. It does not require a single physical appliance. Redundant controllers and distributed device functions address different failure dependencies.

When a controller becomes unavailable, ask what service was lost and what state remains. A management-controller outage may prevent provisioning while existing forwarding continues. Loss of a control-plane service can affect new routes, endpoint discovery or forwarding after retained state expires. A cloud-hosted authentication dependency can affect new clients even when established traffic survives.

:::trap Losing the controller is not losing the network
Devices keep forwarding with the tables they already hold, so users may notice nothing at first. What stops is whatever the controller provided: new policy, new provisioning and, in some designs, learning new routes or endpoints. An answer that says all forwarding stops the moment a controller fails is wrong for the designs the CCNA covers.
:::

## SDN architecture: three layers and two APIs

**Software-defined networking (SDN)** separates the control plane from the data plane and lets software program the network through APIs. The standard picture has three layers: applications on top, the controller in the middle and the network devices at the bottom. The two APIs are named from the controller's point of view: north is up toward applications, south is down toward devices.

```diagram
{"type":"layers","title":"Fig 40.1 — Classify an interface by its participants","columns":[{"title":"Architecture","rows":["Applications","Northbound interface","Controller service","Southbound interface","Network devices"]},{"title":"Example","rows":["Inventory script or assurance tool","Controller REST API","Network policy and topology service","NETCONF, RESTCONF, SSH or another supported protocol","Routing, switching and policy enforcement"]}],"highlight":["Northbound interface","Southbound interface"],"caption":"The same protocol can appear in different roles; the participants determine northbound or southbound."}
```

An **application programming interface (API)** defines how software requests operations or data. A script requesting inventory from a controller uses its northbound API. When the controller reads a device's status or updates its configuration, that interaction is southbound.

Northbound APIs are almost always **REST** APIs: HTTPS requests that return data, usually as JSON. Southbound, the controller uses whatever the devices support. **NETCONF** sends XML over SSH (TCP 830). **RESTCONF** uses HTTPS with JSON or XML. Both read and write data described by **YANG**, a modeling language that defines each setting's name, type and allowed values. **XML** marks up data with named tags, as in `<hostname>SW1</hostname>`.

Here is a small northbound exchange:

```output Application to controller — representative
GET /inventory                              ← request to read the inventory resource
HTTP/1.1 200 OK                              ← successful HTTP response
{"device":"SW1","collectedAt":"09:00:00Z"}    ← JSON body with two named values
```

`GET` asks to read data, and status `200` reports a successful request. In this JSON example, braces enclose an object; a colon pairs each double-quoted member name with its value. The `collectedAt` value is the collection time, not automatically the time of this request. A successful reply at 09:10 could still describe SW1 at 09:00. Compare the clocks and freshness evidence from [chapter 27](#/chapter/ntp-syslog-snmp) before inferring current device state.

[Chapter 41](#/chapter/rest-apis-json) covers HTTP methods, status codes and JSON in detail, and [chapter 42](#/chapter/ansible-terraform) puts automation tools to work.

Two more southbound names appear in exam questions. **OpenFlow** lets a controller program a switch's flow table directly and is the classic open SDN protocol. **OpFlex** carries declarative policy from Cisco's APIC to ACI switches. Catalyst Center mostly uses SSH, SNMP and NETCONF. The southbound list to recognize is therefore OpenFlow, OpFlex, NETCONF, RESTCONF, SNMP and SSH.

## Underlay, overlay and fabric

Suppose users in two buildings must share one logical segment, but you do not want to stretch a VLAN and its spanning tree across the routed core. An overlay solves this by tunneling. The **underlay** is the physical network of links, addresses and routing that carries packets between tunnel endpoints. The **overlay** is the virtual network built on top of it. At the tunnel ingress the original frame or packet gets outer headers; routers in between forward on the outer destination only; the tunnel egress strips the outer headers and delivers the original.

```diagram
{"type":"topology","title":"Fig 40.2 — Two address views in an overlay","nodes":[{"id":"A","kind":"pc","label":"Client","sub":"10.20.0.10","x":0.5,"y":3},{"id":"E1","kind":"l3switch","label":"Edge 1","sub":"192.0.2.11","x":3,"y":3},{"id":"I","kind":"router","label":"Underlay router","x":6,"y":3},{"id":"E2","kind":"l3switch","label":"Edge 2","sub":"192.0.2.12","x":9,"y":3},{"id":"B","kind":"server","label":"Server","sub":"10.20.0.20","x":11.5,"y":3}],"links":[{"from":"A","to":"E1"},{"from":"E1","to":"I","label":"outer destination .12","accent":true},{"from":"I","to":"E2","accent":true},{"from":"E2","to":"B"}],"caption":"Underlay forwarding uses tunnel-endpoint reachability; overlay state identifies how to deliver the inner traffic.","trace":{"flows":[{"path":["A","E1","I","E2","B"],"label":"Inner 10.20.0.10 → 10.20.0.20","tags":{"E1":"Ingress · outer 192.0.2.11 → .12","I":"Forwards on outer dst 192.0.2.12","E2":"Egress · removes encapsulation"}}]}}
```

In this example the inner conversation is `10.20.0.10 → 10.20.0.20`; the outer transport is `192.0.2.11 → 192.0.2.12`. The intermediate router does not need an endpoint route for every tenant's inner subnet. It still needs correct underlay routing, interfaces and MTU.

**VXLAN** is the usual overlay encapsulation. It wraps an Ethernet frame in UDP (destination port `4789`) so that the frame can cross a routed underlay. Its `24-bit` VXLAN network identifier, or **VNI**, says which virtual segment the frame belongs to, which allows about 16 million segments against 4094 VLANs. VXLAN separates segments; it does not encrypt them.

Encapsulation costs space. A 1500-byte inner IPv4 packet gains an inner Ethernet header (14 bytes), a VXLAN header (8), a UDP header (8) and an outer IPv4 header (20), so the **outer IP packet is 1550 bytes**. This is the "VXLAN adds 50 bytes" rule: the underlay needs an IP MTU of at least 1550, or full-size packets are fragmented or dropped. An inner VLAN tag or an IPv6 outer header adds more.

A **fabric** is the underlay and overlay operating together as one system, managed as a whole and not switch by switch. For the exam: the underlay is the physical IP network, the overlay is the virtual network tunneled across it, and the fabric is the two together.

## Cisco SD-Access, ACI and SD-WAN

You do not configure these products for the CCNA, but questions use them as the examples of controller-based networking. Know which controller belongs to which network and what each piece does.

| Solution | Where | Controller | How traffic is carried |
|---|---|---|---|
| SD-Access | Campus LAN | Catalyst Center (formerly DNA Center) | VXLAN tunnels; LISP tracks endpoint locations |
| ACI | Data center | APIC | VXLAN across a spine-leaf fabric |
| Catalyst SD-WAN | WAN | Manager, Controller, Validator | IPsec tunnels between WAN edge routers |

In **SD-Access**, Catalyst Center automates and manages campus infrastructure. Fabric nodes use LISP-based endpoint/location information and VXLAN forwarding. Edge nodes attach endpoints; border nodes provide external connectivity; control-plane nodes maintain endpoint-location information; intermediate nodes transport underlay traffic. Catalyst Center and the fabric's control-plane nodes have different jobs.

LISP keeps two facts apart: the endpoint identifier says who an endpoint is, and the routing locator says which fabric edge it sits behind. An endpoint can move between edges and keep its address, because only the locator changes.

**Cisco ACI** runs a data-center fabric built as **spine-leaf**: every leaf switch connects to every spine, and servers attach only to leaves. The APIC controller holds the policy. Endpoints are placed in endpoint groups (EPGs), and by default two EPGs cannot communicate until a **contract** permits it. The switches forward the traffic; application packets do not pass through APIC.

**Catalyst SD-WAN** separates management, control, orchestration and edge forwarding functions. Manager provides administration; Controllers distribute control information; Validator helps onboarding; WAN edge routers forward traffic over transport networks. Older documentation calls these vManage, vSmart and vBond. IPsec overlays can operate over internet or other WAN transports. Losing a management component and losing a control component are different events.

## Five ways to manage a network

The v2.0 objective names approaches, not exclusive product categories:

| Approach | Defining characteristic | Example |
|---|---|---|
| Device-based | Interact with an individual device's management interface | Inspect R1 through SSH |
| Cloud-based | Management service is hosted in a cloud | Operate through a vendor dashboard |
| Controller-based | A controller coordinates multiple devices or network policy | Provision a campus through Catalyst Center |
| Automation-based | Software performs operational tasks | Ansible collects commands from an inventory |
| Infrastructure as code | Reviewed code/data represents managed infrastructure intent | Version files, review a plan and apply through a tool |

The approaches overlap. A cloud-hosted controller is both cloud-based and controller-based, and an automation tool can call its API. User traffic normally does not pass through the cloud management service.

**Infrastructure as code (IaC)** treats infrastructure definitions with practices such as versioning, review and repeatable execution. Declarative definitions describe a desired result; imperative instructions describe operations. IaC often uses declarative tools, but the discipline is not limited to one syntax or tool.

An **idempotent** operation gives the same end state however many times you run it. "Ensure VLAN 20 exists" is idempotent: the first run creates the VLAN and later runs change nothing. A script that blindly sends commands is not, because it acts again on every run. Idempotent tools make drift easy to fix: run the definition again and only the differences change.

A backup records observed configuration. It may become input to a reviewed desired-state definition, but copying yesterday's mistakes does not establish today's intent. **Git** is a version-control tool that records changes to project files; a **commit** records a version in that history. Reverting a Git commit changes repository history/state; it does not by itself undo a deployed network change. Review and apply a recovery plan, then verify the network.

## Verify and troubleshoot

Separate the question being tested. A controller marked “unreachable” may indicate a blocked management protocol, bad credentials, stale collection or loss of IP transport. Users continuing to work narrows the impact but does not identify the cause.

For example, a VTY access-class can block the controller's SSH source while user traffic through the switch is unaffected. Inspect the ACL and test from the controller's exact source address.

For overlay trouble, check the underlay first: tunnel-endpoint addresses, routes in both directions and MTU. Small pings can succeed while full-size packets fail, so test with a 1550-byte packet and the don't-fragment bit set.

For drift, compare approved intent with the actual relevant state. If the desired NTP set is `10.200.0.10` and `10.200.0.11` but the device has `.10` and `.19`, retain `.10`, remove the unintended `.19` and add `.11`. Afterward check configuration and synchronization separately.

## Exam focus

- Sort activities into planes: forwarding, ACL filtering and VLAN tagging are data; OSPF, STP and ARP are control; SSH, SNMP and syslog are management.
- Traditional networks distribute the control plane across devices; controller-based networks centralize it. Either can be automated.
- Northbound is controller to applications (REST). Southbound is controller to devices (NETCONF, RESTCONF, OpenFlow, OpFlex, SNMP, SSH).
- The underlay carries the tunnels, the overlay is the virtual network and the fabric is both together. VXLAN uses UDP 4789 and a 24-bit VNI, adds 50 bytes and does not encrypt.
- Name the five management approaches and know that one deployment can be several at once. A successful job is not a verified result.
