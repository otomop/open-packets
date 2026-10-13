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

You can operate a network through individual device interfaces, a controller, a cloud dashboard or automation tools. Those choices affect where intent is recorded and how changes are delivered. They do not remove the need to understand routing, switching or evidence. This chapter connects those operational choices to the control and forwarding mechanisms you already know.

## Make changes repeatable and verifiable

:::facts
- The **data plane** forwards traffic. The **control plane** establishes forwarding information. The **management plane** configures and monitors the system.
- A controller provides a logically centralized service; it may run on one system or a redundant cluster.
- **Northbound** connects applications with a controller. **Southbound** connects a controller with managed infrastructure.
- An **underlay** provides transport reachability. An **overlay** builds logical connectivity over that transport.
- Device-based, cloud-based, controller-based, automation-based and infrastructure-as-code approaches can coexist.
:::

Suppose forty switches must use two approved NTP servers. The work includes identifying the right devices, recording existing settings, applying the new values, checking synchronization and preserving evidence. Typing fewer commands is only one part of improvement.

**Automation** lets software carry out repeatable tasks. A tool can read an explicit inventory, apply a reviewed template and collect results consistently. It can also apply an incorrect address to every device quickly. The benefit therefore depends on accurate inputs, limited initial scope, error handling and verification.

**Desired state** records the intended result; **observed state** records what the system reports. **Configuration drift** is a difference between those states within the scope being managed. The authoritative desired-state record is often called a **source of truth**. It might be a reviewed inventory or a controller's approved policy, rather than a particular file format.

For an NTP change, a successful command response proves only that the command was accepted. A configured server can still be unreachable or unusable. Verify both configuration and actual synchronization. The same distinction applies to a VLAN job, software staging or an access-policy deployment.

## The three planes of a network device

The plane names classify functions; they are not necessarily three separate processors. A physical switch often forwards ordinary traffic with specialized hardware. A virtual router may forward in software. Both perform data-plane work.

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

Avoid classifying solely by hardware location. MAC learning can involve switch hardware and software, and forwarding tables are implemented differently across platforms. For the core distinction, use unambiguous examples: OSPF learns reachability, the forwarding engine sends transit packets, and an administrator retrieves counters.

## Traditional versus controller-based networking

A traditional routed network commonly has a **distributed control plane**: routers exchange protocol information and compute their own forwarding decisions. It can still have central monitoring, standardized templates and scripts. Traditional architecture does not mean every configuration must be typed manually.

**Controller-based networking** introduces a network-wide service for policy, topology, provisioning or control. The degree of centralization varies. Some architectures directly program forwarding rules; others leave substantial routing and endpoint-control functions on network devices while centralizing management and policy.

| Question | Distributed device control | Controller-based approach |
|---|---|---|
| Where are routes learned? | Commonly through protocols on devices | Depends on architecture; device protocols may remain |
| Where is policy expressed? | Device configurations and operational tools | A controller can translate network-level policy |
| Can software automate it? | Yes, through device interfaces | Yes, often through controller APIs |
| Where is user traffic forwarded? | By network devices | Usually by network devices; verify the actual data path |

**Logically centralized** describes the service presented to applications. It does not require a single physical appliance. Redundant controllers and distributed device functions address different failure dependencies.

When a controller becomes unavailable, ask what service was lost and what state remains. A management-controller outage may prevent provisioning while existing forwarding continues. Loss of a control-plane service can affect new routes, endpoint discovery or forwarding after retained state expires. A cloud-hosted authentication dependency can affect new clients even when established traffic survives.

:::trap Do not promise identical behavior for every controller failure
Existing traffic continuing briefly is evidence about that traffic and time window. It does not prove all clients, new flows, reconvergence or policy changes will work indefinitely. Identify the failed component and the documented dependency.
:::

## SDN architecture: three layers and two APIs

**Software-defined networking (SDN)** separates aspects of control from forwarding and exposes programmable interfaces. A common diagram shows applications above a controller and infrastructure below it. The diagram describes responsibilities, not a geographic arrangement.

```diagram
{"type":"layers","title":"Fig 40.1 — Classify an interface by its participants","columns":[{"title":"Architecture","rows":["Applications","Northbound interface","Controller service","Southbound interface","Network devices"]},{"title":"Example","rows":["Inventory script or assurance tool","Controller REST API","Network policy and topology service","NETCONF, RESTCONF, SSH or another supported protocol","Routing, switching and policy enforcement"]}],"highlight":["Northbound interface","Southbound interface"],"caption":"The same protocol can appear in different roles; the participants determine northbound or southbound."}
```

An **application programming interface (API)** defines how software requests operations or data. A script requesting inventory from a controller uses its northbound API. When the controller reads a device's status or updates its configuration, that interaction is southbound.

REST APIs often use HTTPS and JSON, but REST is an architectural style rather than a synonym for JSON. NETCONF commonly uses SSH with XML messages; RESTCONF uses HTTP mechanisms with YANG-modeled JSON or XML data. **XML** represents structured data with named tags. **YANG** is a modeling language used to define supported data, including field types and constraints. A NETCONF **RPC**, remote procedure call, requests a named operation. Recognize the purpose of these terms here; implementing their schemas is outside this chapter.

This small, authored controller exchange is enough to read the inventory evidence used here:

```output Application to controller — representative
GET /inventory                              ← request to read the inventory resource
HTTP/1.1 200 OK                              ← successful HTTP response
{"device":"SW1","collectedAt":"09:00:00Z"}    ← JSON body with two named values
```

`GET` asks to read data, and status `200` reports a successful request. In this JSON example, braces enclose an object; a colon pairs each double-quoted member name with its value. The `collectedAt` value is the collection time, not automatically the time of this request. A successful reply at 09:10 could still describe SW1 at 09:00. Compare the clocks and freshness evidence from [chapter 27](#/chapter/ntp-syslog-snmp) before inferring current device state.

[Chapter 41](#/chapter/rest-apis-json) develops HTTP methods, responses and JSON types; [chapter 42](#/chapter/ansible-terraform) applies automation tools to management work. Enabling model-driven device interfaces is an optional platform-specific extension, not a prerequisite for understanding this architecture.

**OpenFlow** is an example of programming switch flow behavior. **OpFlex** is an example of distributing declarative policy; Cisco has used it with virtual-switch integration such as ACI Virtual Edge. Do not label every Cisco controller-to-switch conversation OpenFlow or OpFlex. Consult the product's documented interfaces.

A controller's inventory response also has a freshness limit. It may answer from previously collected state rather than polling every device for every application request. Read timestamps, collection status and device identity before treating a dashboard value as an observation of the present moment.

## Underlay, overlay and fabric

The **underlay** supplies transport between tunnel endpoints. It includes links, addresses, routing and usable path MTU. The **overlay** supplies logical connectivity over that transport. At a tunnel ingress, an original packet or frame receives outer headers; intermediate devices forward toward the outer destination; the tunnel egress removes the encapsulation.

```diagram
{"type":"topology","title":"Fig 40.2 — Two address views in an overlay","nodes":[{"id":"A","kind":"pc","label":"Client","sub":"10.20.0.10","x":0.5,"y":3},{"id":"E1","kind":"l3switch","label":"Edge 1","sub":"192.0.2.11","x":3,"y":3},{"id":"I","kind":"router","label":"Underlay router","x":6,"y":3},{"id":"E2","kind":"l3switch","label":"Edge 2","sub":"192.0.2.12","x":9,"y":3},{"id":"B","kind":"server","label":"Server","sub":"10.20.0.20","x":11.5,"y":3}],"links":[{"from":"A","to":"E1"},{"from":"E1","to":"I","label":"outer destination .12","accent":true},{"from":"I","to":"E2","accent":true},{"from":"E2","to":"B"}],"caption":"Underlay forwarding uses tunnel-endpoint reachability; overlay state identifies how to deliver the inner traffic.","trace":{"flows":[{"path":["A","E1","I","E2","B"],"label":"Inner 10.20.0.10 → 10.20.0.20","tags":{"E1":"Ingress · outer 192.0.2.11 → .12","I":"Forwards on outer dst 192.0.2.12","E2":"Egress · removes encapsulation"}}]}}
```

In this example the inner conversation is `10.20.0.10 → 10.20.0.20`; the outer transport is `192.0.2.11 → 192.0.2.12`. The intermediate router does not need an endpoint route for every tenant's inner subnet. It still needs correct underlay routing, interfaces and MTU.

**VXLAN** carries Ethernet traffic over an IP underlay, normally using destination UDP port `4789`. Its `24-bit` VXLAN network identifier, or **VNI**, identifies a virtual network context. These identifiers distinguish logical segments; they do not encrypt the payload.

Encapsulation consumes space. For a worked, explicitly scoped example, an inner IPv4 packet of 1500 bytes plus an untagged inner Ethernet header of 14, VXLAN 8, UDP 8 and outer IPv4 20 gives an **outer IP packet of 1550 bytes**. The outer Ethernet header is outside that IP-MTU calculation. IPv6 outer headers, retained tags or other encapsulation change the requirement. Do not apply one overhead number without stating the measurement boundary.

The term **fabric** describes an integrated network system; in SD-Access documentation it particularly refers to the overlay fabric operating on the underlay. Different products use the word somewhat differently. Understand the relationship instead of defining every fabric as exactly one controller plus two layers.

## Cisco SD-Access, ACI and SD-WAN

These are examples for interpreting architecture, not separate CCNA product-deployment objectives.

In **SD-Access**, Catalyst Center automates and manages campus infrastructure. Fabric nodes use LISP-based endpoint/location information and VXLAN forwarding. Edge nodes attach endpoints; border nodes provide external connectivity; control-plane nodes maintain endpoint-location information; intermediate nodes transport underlay traffic. Catalyst Center and the fabric's control-plane nodes have different jobs.

An endpoint identifier describes the attached endpoint; a routing locator identifies a fabric attachment location. That distinction lets a logical network extend across a routed underlay. Learn the role mapping before attempting to memorize message names or platform scale limits.

**Cisco ACI** uses APIC to express and manage application-oriented policy in a data-center fabric. Endpoint groups and contracts are policy constructs. Fabric switches perform forwarding; APIC is not an ordinary transit hop for application traffic. Contract defaults and exceptions depend on the policy design, so avoid the universal claim that no two groups can communicate without an explicit contract.

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

A cloud-hosted controller can be both cloud-based and controller-based. An automation tool can call that controller's API. Cloud management does not necessarily place user traffic through the management service, but cloud security services, authentication or VPN paths can introduce separate cloud dependencies.

**Infrastructure as code (IaC)** treats infrastructure definitions with practices such as versioning, review and repeatable execution. Declarative definitions describe a desired result; imperative instructions describe operations. IaC often uses declarative tools, but the discipline is not limited to one syntax or tool.

An **idempotent** operation has the same intended state effect when repeated. A well-designed “ensure VLAN 20 exists” operation can be idempotent; an arbitrary command script is not automatically so. Tool support and resource coverage determine what drift can be detected. Check mode or a plan is useful evidence, not a universal simulation of every future effect.

A backup records observed configuration. It may become input to a reviewed desired-state definition, but copying yesterday's mistakes does not establish today's intent. **Git** is a version-control tool that records changes to project files; a **commit** records a version in that history. Reverting a Git commit changes repository history/state; it does not by itself undo a deployed network change. Review and apply a recovery plan, then verify the network.

## Verify and troubleshoot

Separate the question being tested. A controller marked “unreachable” may indicate a blocked management protocol, bad credentials, stale collection or loss of IP transport. Users continuing to work narrows the impact but does not identify the cause.

For example, a VTY access-class can deny the controller's SSH source while allowing ordinary user forwarding. Inspect the ACL and test from that exact source. A cumulative deny counter alone cannot attribute every match to the controller.

For overlay trouble, begin with shared transport evidence: endpoint addresses, routes, both directions and packet size. Small pings establish only small ICMP reachability. A failed large test can support an MTU investigation, but loss, filtering or a different path may also matter. Read explicit ICMP errors and interface MTUs before naming the cause.

For drift, compare approved intent with the actual relevant state. If the desired NTP set is `10.200.0.10` and `10.200.0.11` but the device has `.10` and `.19`, retain `.10`, remove the unintended `.19` and add `.11`. Afterward check configuration and synchronization separately.

## Exam focus

- Identify data, control and management functions by what they do.
- Compare distributed device control with controller coordination without assuming either excludes automation.
- Determine northbound/southbound roles from the participants.
- Explain inner/outer traffic, underlay dependence, overlay segmentation and lack of inherent VXLAN encryption.
- Recognize the five management approaches, their overlap, and the difference between intent, configuration and verified operation.
