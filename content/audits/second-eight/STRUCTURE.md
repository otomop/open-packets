# Whole-course structure review

Reviewed 19 September 2026 (local time). Scope: all 46 chapter titles, sequence, prerequisites, major section boundaries and lab preparation. This is a structural pass across the whole course, followed by detailed content review of chapters 08–15. It does not mark the remaining chapters as fact-audited.

## Sequence and organization

The overall sequence is sound: setup → foundations → switching → routing → services → security → wireless → virtualization/automation → integrated practice. Kept the chapter numbers, IDs and part membership. No broad renumbering was needed. Chapter 13 can precede spanning tree if it briefly explains that a correctly formed bundle is one logical STP link, then leaves root election and port-role reasoning to 14. Its prerequisites now include inter-VLAN routing before the Layer 3 bundle exercise.

Updated `content/CHAPTERS.md` to match the actual course metadata. The old planning document omitted chapter 14, retained superseded objectives and prerequisites, and described historical drafts as fact-checked source material. It is now a complete index and topic-ownership guide.

Renamed chapter 08 to **Secure device access**, making its purpose distinct from initial IOS setup in 00. Shortened chapter 10 to **802.1Q trunks**, with DTP retained as the negotiation/comparison section. Renamed chapter 38 to **WLAN security & configuration**, reflecting the material it owns. Revised headings within 08–15 to put definitions and mechanisms before commands, then verification and troubleshooting. In 08, local accounts and privilege now precede line authentication. In 39, a heading now accurately describes cloud service and deployment models.

## Implemented changes by course region

| Chapters | Structural findings and changes |
|---|---|
| 00–07 | Retained the reviewed foundation sequence. Corrected 02's claim that the v1.1 blueprint explicitly names DNA Center; the official list refers to controllers generically. Kept product examples as examples. |
| 08 | Reduced repeated first-use CLI instruction to a review. Teaches local authentication, privilege, console/VTY policy, SSH setup and evidence in that order. Removed premature VTY ACL configuration; links to 34 for policy. AAA configuration remains in 33. |
| 09 | Separates VLAN membership, voice/data traffic and PoE. Endpoint choices explain when one VLAN or a trunk is needed. Removed early LACP, PortFast-trunk and one-size-fits-all port-security templates; their full treatment belongs to 13–16. |
| 10–11 | Trunk formation and VLAN carriage precede router subinterfaces, SVIs and routed ports. Explicitly distinguishes management reachability on a Layer 2 switch from enabled IP forwarding on a multilayer switch. |
| 12–13 | Discovery provides physical-neighbor evidence; EtherChannel introduces negotiated aggregation and Layer 2/Layer 3 examples. Added preparation for routed bundles. PAgP, static bundles and platform member limits are comparison/reference material around the LACP core. |
| 14–15 | Root election, cost and role selection precede protections. Consolidated the repetitive guard-selection section into the protection introduction. Fault introduction, observations, restoration and saving are separate lab actions. |
| 16 | Removed the forward prerequisite on DHCP 24. Added a short DHCP/ARP/IPv6-RA primer so the security mechanisms can be understood in sequence. Prerequisites now point to earlier models, addressing, VLAN and STP-protection chapters; full IPv6 and DHCP chapters are linked. |
| 17–23 | The routing-table lab distinguishes interpreting supplied route output on the first pass from configuring OSPF after 21. Marked detailed LSA/special-area material in 22 and GLBP detail in 23 as additional context. Retained the routing sequence. |
| 24–26 | Clarified 24's DHCPv4 scope. Added the local wildcard/standard-ACL selector needed to understand NAT in 26, linking full ACL policy to 34. |
| 27–31 | Separated conceptual QoS requirements from the optional configuration extension in 28. Clarified secure versus legacy file-transfer practice in 29. Added DNS preparation and a small wireless vocabulary preview in 30. The integrated troubleshooting chapter 31 now declares earlier routing, discovery, transport and services prerequisites. |
| 32–35 | Security introduction 32 now correctly references local SSH and Layer 2 protection already taught. Added appropriate prerequisites. Marked the detailed tunnel implementation lab in 35 as an optional exercise with routing/ACL preparation; the core requirement is understanding the VPN categories and protection. |
| 36–38 | Kept principles → architecture → WLAN configuration. The security overview in 36 links to the full treatment in 38. Added VLAN/trunk/DHCP preparation to 37. Explicitly treats the two controller labs as independent topologies with different models and port settings. |
| 39–43 | Added a core VM/container/vNIC/virtual-switch exercise before the VRF extension in 39. Declared preparation for controller networking, APIs, configuration tools and AI-assisted operations. Product fabric stacks and legacy configuration tools are reference context; they do not define the main progression. |
| 44–45 | Capstone prerequisites now include the switching protections and services it uses. Replaced the independent fact table in 45 with links and a review checklist to avoid conflicting copies of facts. Corrected its lab time allocation: 45 minutes building, 10 verifying/scoring, 5 saving. |

## Progress and navigation

Added an optional `sectionIds` frontmatter map to preserve an existing section's identity when its display heading is renamed or moved. The loader rejects invalid identities, duplicate explicit identities and references to missing headings. Tests cover renamed/reordered headings and invalid mappings. Chapter IDs and order are unchanged. All 46 chapters are checked for existing, earlier prerequisites and valid internal chapter links. The Chapter, Chapters and Today views now count only distinct saved IDs that still correspond to current checkable sections; the lab header applies the same rule to current steps. Reading denominators exclude introductions and Exam focus sections that have no checkbox. No stored history is deleted.

In 14/15, old unheaded introductions and the repetitive `choosing-the-guard` section were integrated into the revised teaching sections. Old progress entries for removed sections can remain in local storage but do not count as a distinct current section. Added SSH configuration in 08 and endpoint-trunk selection in 10 have new section identities. Assessment items that changed to unrelated topics received new IDs, with retirements recorded in the chapter reports. The shared tickets introduction now calls authored output representative and removes an unsupported claim of exam similarity.

The lab procedures were substantially rewritten. Existing step checkboxes have not been cleared automatically; saved checks are not evidence that the new procedures have been completed. Learners returning to these chapters should work through the revised labs again.

## Required later content work

The structure is clearer, but the detailed audit still needs to continue through 16–45. In particular:

- Verify each later lesson, bank, output and lab against the current blueprint and primary documentation. Structural labels do not validate their technical claims.
- Chapter 29 needs a complete, executable secure-transfer path on a supported Cisco environment for v2.0. The present structure distinguishes the path and support limits; that is not a claim that the secure lab has been executed or fully rebuilt.
- Chapter 42 needs a full review of its v2.0 Ansible device-command workflow, authentication preparation and supported lab environment. Reference content about older tools must not crowd out the current objective.
- Reassess the total depth of 22, 28, 35 and 40 during their full audits. Optional labels are an initial boundary, not a substitute for editing an oversized lesson and its assessment bank.
- Validate both wireless controller labs in their stated environments; the new independent-lab notes address sequencing and prevent accidental reuse of incompatible settings.

## Evidence

Scope and depth were checked against [Cisco's v1.1 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf), [Cisco's v2.0 exam topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), and [Cisco's transition announcement](https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh). The chapter-pair reports give technical references for the detailed 08–15 rewrite.

No colors, styles, layout components or hosting configuration were changed in this batch.
