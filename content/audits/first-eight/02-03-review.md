# Chapters 02–03 review

Reviewed 2026-09-19 local time (source checks extended into 2026-09-20 UTC). Scope: all six authoring files in each chapter. This review changes teaching content only; no UI, styling, application code or unrelated chapter was edited.

## Result and scope

Both lessons, both labs, 31 questions, 40 cards, 21 command drills and four tickets were reviewed and rewritten together. The revised material starts with observable behavior, defines terms before using them, and separates evidence from a conclusion. Existing chapter IDs and all original lesson H2 headings were retained.

- **02, components and topologies:** directly teaches v1.1 `1.1`, all `1.1.a–h` component roles, and `1.2` with `1.2.a–f` architecture comparisons. It is foundational preparation for v2.0, not a claim to complete its later configure/verify objectives. Its v2 tag list remains empty.
- **03, cabling and interfaces:** directly teaches v1.1 `1.3`, `1.3.a`, `1.3.b` and `1.4`, and v2.0 `1.1`. Copper/fiber choice, speed and duplex, errors, distance, optical signal comparison, polarity and pinout diagnosis appear in both teaching and exercises.
- **Prerequisite examples:** the supplied IPv4 addresses, router interface configuration, connected-route recognition and save commands let a beginner build a working small network. They are recipes for observing roles; they do not claim to teach subnet calculation or a routing protocol.
- **Retained supporting context:** basic PoE source power levels and budget arithmetic; short IaaS/PaaS/SaaS and deployment comparison; common SR/LR and SX/LX-LH examples. Optical examples are explicitly module-specific.
- **Trimmed detail:** product-catalog identification, MPLS CE/PE and Metro-E service vocabulary, full-mesh link-count formulas, leaf/spine arithmetic, prestandard Cisco power branding, detailed optical loss-budget calculations, extensive transceiver-form-factor lists and early STP/root configuration. These are not needed to explain this chapter pair's stated objectives.

The official topic PDFs used for scope are [Cisco CCNA v1.1](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) and [Cisco CCNA v2.0](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf). The parent review owns the course-wide current-versus-announced exam date display.

## Material corrections

1. Device roles are no longer inferred exclusively from model name, CDP capability letters or enclosure shape. Layer 3 switches can route; particular router/switch feature availability depends on platform and software. An AP function is distinguished from the routing/NAT functions that an integrated SOHO device may also supply.
2. A switch's management IP is distinguished from its ability to forward Ethernet frames. Endpoints, server/client roles, interfaces and default gateways are introduced before the lab uses them.
3. NGFW inspection does not promise visibility into every encrypted payload. Inline IPS blocking capability is explained without claiming that every IDS implementation behaves identically or every detection is correct.
4. Wireless-controller management no longer implies that all client data must traverse the controller. Central and local forwarding are identified as deployment choices.
   Controllers remain taught, with Catalyst Center (formerly Cisco DNA Center) and WLCs as examples. A subsequent structure review corrected the earlier claim that v1.1 explicitly names those products: the current objective names controllers generically.
5. Campus and spine-leaf drawings are reference designs, not universal prohibitions or promises that any redundant cable works. Redundancy requires an appropriate forwarding design and attention to common failure dependencies.
6. PoE source-port maxima are consistently source-side quantities: af 15.4 W, at 30 W, bt Type 3 60 W and Type 4 90 W. Device-side power is lower after losses. Budget exercises use allocations consistently. A standard PoE port is not presented as dangerous to an ordinary Ethernet PC, nor is a passive injector assumed safe.
7. Copper reach is no longer “every copper Ethernet standard always reaches 100 m.” The common channel limit is qualified by port/module specification; the Cisco SFP-10G-T-X 30 m 10 Gbps exception makes that distinction concrete. Cat5e is a normal new-installation 1 Gbps choice, not a false claim that every qualified older Cat5 channel cannot carry gigabit.
8. Auto-MDIX is not said to be absent from every Packet Tracer port or to require both ends. The documented 2960 configuration conditions are stated, and the lab chooses explicit suitable cables rather than testing an assumed simulator limitation.
9. The forced-versus-auto half-duplex fallback is limited to the relevant 10/100 case. Matching link speed and an up state do not establish duplex agreement. The `a-` prefix does not prove a successful full negotiation exchange.
10. CRC, runt, late-collision and drop patterns are evidence to correlate across both ends and a test interval. Zero CRC does not prove a cable is healthy. A giant threshold is not fixed at 1518 bytes on every interface, because encapsulation and accepted frame sizes differ.
11. Low optical receive power does not prove polarity, a failed transmitter or incompatible wavelengths by itself. Module inventory provides direct mismatch evidence; receive thresholds constrain measurements. Normal-looking transmit telemetry is not declared proof of complete transmitter health.
12. Unsupported precise physical claims were removed from simulator expectations. Supplied output excerpts are labeled representative; measured examples and paper worksheets are distinguished from actual captured CLI output.

## Primary evidence checked

The following sources are also listed in the appropriate lesson frontmatter. “Checked” means the relevant documentation was read, not that its commands were executed on a device.

| Claim or correction | Primary source and relevant evidence |
|---|---|
| Switching versus routing, including Layer 3 capability | [Cisco network switching](https://www.cisco.com/site/us/en/learn/topics/networking/what-is-network-switching.html): MAC-based local switching, IP routing and combined functions |
| NGFW functions and policy | [Cisco NGFW overview](https://www.cisco.com/site/us/en/learn/topics/security/what-is-a-next-generation-firewall.html): stateful inspection, application awareness and integrated prevention |
| AP role | [Cisco access-point overview](https://www.cisco.com/site/us/en/learn/topics/small-business/what-is-an-access-point.html): wireless client access and wired network connection |
| Controller management versus client forwarding | [Cisco FlexConnect guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-7/config-guide/b_cg87/m_flexconnect_overview.html): central authentication/local switching and other operating combinations |
| Cisco DNA Center name and campus-controller role | [Cisco Catalyst Center data sheet, updated July 2026](https://www.cisco.com/c/en/us/products/collateral/cloud-systems-management/dna-center/nb-06-dna-center-data-sheet-cte-en.html): former name, management, automation and assurance for supported network devices |
| Access/distribution/core and collapsed core | [Cisco campus design guide](https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-campus-lan-wlan-design-guide.html): functional layers, scaling and resilience choices |
| Basic leaf-to-spine pattern | [Cisco VXLAN BGP EVPN design guide](https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/cisco-vxlan-bgp-evpn-design-and-implementation-guide.html): basic physical fabric roles; advanced protocol configuration was not imported into this lesson |
| PoE type/source power | [Cisco C9000 PoE guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/infra/poe/poe-configuration-guide/g-poe/c-poe.html): af/at/bt type limits |
| Detection, budget, auto and never | [Cisco Catalyst 9300 IOS XE 17.18 PoE configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/int_hw/b_1718_int_and_hw_9300_cg/configuring_poe.pdf): supported PDs, available budget, administrative modes |
| Cloud characteristics and service responsibility | [NIST SP 800-145](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf): essential characteristics, service models and private/public/hybrid distinctions |
| Interface configuration and auto-MDIX conditions | [Cisco Catalyst 2960 interface guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swint.html): automatic pair correction, one supported end and speed/duplex configuration conditions |
| Speed/duplex agreement and 10/100 forced-peer fallback | [Cisco auto-negotiation troubleshooting](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html): match both ends, prefer auto where supported, interpret automatic versus hard-coded settings |
| Link states and counter interpretation | [Cisco switch-port troubleshooting](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6500-series-switches/12027-53.html): multiple causes of errors, checking both ends, cable and physical investigation |
| Copper pin mapping, connector and fiber compatibility | [Cisco Catalyst 9300 connector/cable specifications](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/connector-cable-specs.html): pinout figures, pair arrangements and connection requirements |
| Copper categories and platform reach | [Cisco Catalyst 9300 hardware overview](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html): copper speed/category/distance requirements |
| SR/LR wavelengths and reaches; shorter copper-module exception | [Cisco 10G SFP+ data sheet](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-455693.html): SR OM3/OM4, LR SMF, optical ranges and SFP-10G-T-X specification |
| SX and Cisco LX/LH examples | [Cisco Gigabit SFP data sheet](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/gigabit-ethernet-gbic-sfp-modules/datasheet-c78-366584.pdf): grade-dependent SX reach and module-specific LX/LH reach |
| Detailed port/error-counter command syntax | [Cisco Catalyst 2960 IOS 15.0(2)EZ command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_ez/command/reference/cr2960/cli2.html): `show interfaces` and optional interface-scoped `counters errors` |
| Interface-scoped optical command syntax | [Cisco Catalyst 9300 IOS XE 17.3 command reference](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-3/command_reference/b_173_9300_cr/interface_and_hardware_commands.html): `show interfaces [interface-id] transceiver [detail ...]` |

No unresolved VERIFY marker remains in the twelve owned files. The former statements were resolved through these references, narrowed to a supported context, replaced with transparent representative evidence, or removed when they were unnecessary and not supportable.

## Lab consistency and practical limits

**02:** Two 2960 switches, one 2911, two PCs and one server. All five cables have exact endpoints and types. The complete address table is repeated in endpoint instructions; R1 has one active interface in each /24 network. The lab requires no switch SVI, default route, DHCP, DNS, trunk, STP configuration or PoE simulation. Local ping and numeric HTTP are proved before remote tests. Shutdown, observation and recovery occupy distinct steps. Both endpoint gateways are required for remote communication. Browser caching is called out so an old page is not mistaken for a successful post-fault request.

**03:** Two 2960 switches and two PCs. One FastEthernet crossover link makes the 10/100 examples applicable and avoids depending on auto-MDIX during forced tests. Both endpoints share a subnet and need no gateway. Each duplex, speed and shutdown fault is followed by a separate recovery step. Optical signal, distance and split-pair cases are supplied paper evidence. The independent challenge examines forced-versus-auto behavior and explicitly allows a documented simulation limitation.

Every IOS block names a single device and shows its prompt. Interactive save commands are separated from their destination-filename response. PC commands are given without a copyable Windows prompt. No privileged host operation, real network access or hardware purchase is required.

These labs have **not been executed in Packet Tracer, CML or physical hardware** during this review. Model/port selection, subnet relationships, command modes, both-end configuration and expected causal relationships were manually checked. Exact CLI support, counter increments, link timing, device GUI labels and packet animation remain simulator-version checks for a human execution pass. Unsupported PoE/optical displays are not prerequisites for completing the lab.

## IDs and progress

Question/card IDs were retained when the knowledge being assessed remained substantially the same, including correction of an overstatement. Unrelated replacement knowledge receives a new ID.

| Chapter | Retired IDs | New IDs | Reason |
|---|---|---|---|
| 02 questions | `q04`, `q11`, `q12` | `q16`, `q17`, `q18` | Replace a product-name item, mesh formula and MPLS labels with controller purpose, WAN path dependency and server/endpoint roles |
| 02 cards | `c06`, `c11`, `c14`, `c16`, `c17`, `c18`, `c19`, `c20` | `c21–c28` | Replace branding, product lists, rigid wiring and service/math trivia with practical power, controller, redundancy, endpoint and deployment concepts |
| 02 commands | `d02`, `d04`, `d05`, `d07`, `d08`, `d09`, `d10` | `d11–d17` | Replace advanced PoE/static reservation, SVI/STP/CDP exercises with the actual introductory lab workflow |
| 03 questions | `q10` | `q17` | Replace detailed optical-loss arithmetic with a polarity diagnosis |
| 03 cards | `c03`, `c11` | `c22`, `c21` respectively | Replace color-order memorization and optical-budget arithmetic with physical pair integrity and receive-limit comparison |

All IDs carry their original chapter prefix. All other question/card IDs and all four ticket IDs remain. All eleven 03 command IDs remain; the broad `clear counters` alternative was removed because the task targets one interface.

The 02 lab is a substantial replacement of the former advanced five-switch/STP activity. The 03 lab now has nine numbered steps rather than seven to keep recovery distinct. Existing lab completion should therefore be reviewed by returning learners; this content-only edit does not migrate or reset stored progress.

## Validation

`node scripts/validate-content.mjs` completed with zero errors and **no warnings for chapters 02 or 03**. Warnings elsewhere remain outside this review's edit scope. Parsed counts:

| Chapter | Lesson H2s | Guided steps | Questions | Multi-select | Exhibits | Cards | Drills | Tickets |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 02 | 8 | 9 | 15 | 3 | 4 | 20 | 10 | 2 |
| 03 | 7 | 9 | 16 | 2 | 6 | 20 | 11 | 2 |

All question answer indices, incorrect-option explanations, addressing tables, PoE arithmetic, optical threshold comparisons and collision-domain count were checked. The 02 lesson has an introductory preamble in addition to its eight H2 sections, so the loader reports nine section objects. All diagrams and question exhibits parse. Command and assessment checks here are content validation, not claims of device execution.
