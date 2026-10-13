# Chapters 42–43 content review

Reviewed 20 September 2026. Scope: all six assets in `42-ansible-terraform` and `43-ai-in-network-operations`. No application code, layout, color, shared indexes, deployment, or other chapter assets were changed.

## Scope and progression

Cisco's [current v1.1 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf) names Ansible and Terraform capability recognition (6.6) and predictive/generative AI and ML explanation (6.4). The [announced v2.0 blueprint](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) requires executing commands with mechanisms such as Ansible (5.5), describing agentic AI (5.1), and selecting prompts considering named components (5.2). The v2.0 description also permits evaluating assistant output and recommendations.

The rewrite follows those verbs. Puppet/Chef implementation languages, agent ports, and timer recall were removed. Terraform remains a small local capability exercise, with provider-specific infrastructure provisioning outside core scope. AI retains operational examples and terminology; confusion-matrix formulas and compulsory timed-reload procedures are no longer assessed. Current/future exam scheduling is owned by the course's introductory/readiness material; these chapters do not independently redefine it.

42 has eight H2 teaching/review sections plus the preserved intro. 43 has eight plus its preserved intro. Explicit frontmatter mappings preserve **all nine existing loaded section IDs per chapter**, including the previously truncated long prompt-section ID in 43. Prerequisites point only to earlier material.

## Asset inventory

| Chapter | Questions | Multi-select | Exhibits | Cards | Drills | Tickets | Lab steps |
|---|---:|---:|---:|---:|---:|---:|---:|
| 42 | 16 | 3 | 8 | 22 | 10 | 2 | 11 |
| 43 | 16 | 3 | 7 | 20 | 6 | 2 | 9 |

Lesson prose is approximately 2,300 words for 42 and 2,175 for 43, excluding fenced examples and frontmatter. These are original teaching explanations and authored scenarios, not copied documentation. Six AI drills cover real evidence-gathering commands; no artificial command quota was added to a conceptual objective.

## Main corrections and source evidence

| Claim or issue | Corrected teaching | Primary source |
|---|---|---|
| Native Windows Ansible and missing setup | WSL Ubuntu/native Linux control node, virtual environment, explicit SSH dependency and collections, same-user known-host preparation | [Ansible installation](https://docs.ansible.com/projects/ansible/latest/installation_guide/intro_installation.html), [Microsoft WSL setup](https://learn.microsoft.com/en-us/windows/wsl/install) |
| Runtime compatibility | Reviewed Python 3.12 / ansible-core 2.21 family; recorded collection 11.5.1 and netcommon 8.6.2 versions; future environments must recheck compatibility | [Support matrix](https://docs.ansible.com/projects/ansible/latest/reference_appendices/release_and_maintenance.html), [IOS collection index](https://docs.ansible.com/projects/ansible/latest/collections/cisco/ios/index.html) |
| SSH backend and identity checking | Explicit libssh and ansible-pylibssh; auto-add disabled; trusted first-use identity process; WSL known_hosts distinguished from Windows | [network_cli settings](https://docs.ansible.com/projects/ansible/latest/collections/ansible/netcommon/network_cli_connection.html), [libssh settings](https://docs.ansible.com/projects/ansible/latest/collections/ansible/netcommon/libssh_connection.html), [ssh-keygen](https://man.openbsd.org/ssh-keygen) |
| Agentless and local fallback | IOS network modules execute on the controller. A localhost debug task teaches runtime/YAML but cannot execute IOS commands or satisfy remote-execution practice | [Network automation differences](https://docs.ansible.com/projects/ansible/latest/network/getting_started/network_differences.html), [IOS platform options](https://docs.ansible.com/projects/ansible/latest/network/user_guide/platform_ios.html) |
| Inventory, command execution, result indexes | Alias/address distinction, group selection and limit intersection, complete YAML, ordered zero-based stdout/stdout_lines | [Inventory](https://docs.ansible.com/projects/ansible/latest/inventory_guide/intro_inventory.html), [ios_command](https://docs.ansible.com/projects/ansible/latest/collections/cisco/ios/ios_command_module.html), [playbook CLI](https://docs.ansible.com/projects/ansible/latest/cli/ansible-playbook.html) |
| Misleading failure and change claims | FAILED does not prove login success; read the error message. changed=0 does not prove arbitrary EXEC commands were harmless | [ios_command implementation](https://raw.githubusercontent.com/ansible-collections/cisco.ios/main/plugins/modules/ios_command.py), [IOS CLI implementation](https://raw.githubusercontent.com/ansible-collections/cisco.ios/main/plugins/cliconf/ios.py), [error handling](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_error_handling.html) |
| Invented exact module rejection error | Ticket 42-t01 is now a pre-execution review using the documented module boundary. It no longer claims a universal guard safely refuses configure terminal with a particular runtime error | [ios_command implementation/documentation](https://raw.githubusercontent.com/ansible-collections/cisco.ios/main/plugins/modules/ios_command.py) |
| Configuration idempotence and persistence | Full stored syntax, parent/line matching, save_when changed versus modified, operational verification after task success | [ios_config reference](https://docs.ansible.com/projects/ansible/latest/collections/cisco/ios/ios_config_module.html) |
| Dry-run and secret boundaries | Module-dependent check/diff behavior; Vault protects storage, not every runtime disclosure | [Check and diff](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html), [Vault](https://docs.ansible.com/projects/ansible/latest/vault_guide/vault.html) |
| Terraform state/workflow overclaims | Init can contact backend/registries; plan ordinarily reads through providers; saved-plan apply lacks a second prompt; deleting state is not rollback | [Core workflow](https://developer.hashicorp.com/terraform/intro/core-workflow), [state](https://developer.hashicorp.com/terraform/language/state), [plan](https://developer.hashicorp.com/terraform/cli/commands/plan), [apply](https://developer.hashicorp.com/terraform/cli/commands/apply) |
| Local Terraform resource and privacy | terraform_data stores values locally without configuring R1; distinguish in-place input update from removal; protect state and plan artifacts | [terraform_data](https://developer.hashicorp.com/terraform/language/resources/terraform-data), [sensitive data](https://developer.hashicorp.com/terraform/language/manage-sensitive-data), [installation](https://developer.hashicorp.com/terraform/install) |
| AI certainty, classification, and review | Distinguish observation/inference/missing evidence; confabulation, data handling, independent verification, monitored outcomes | [NIST AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf), [NIST generative AI profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) |
| AI category and alert overclaims | No universal strict generative/deep-learning hierarchy; no mandatory permanent-memory architecture; distinguish anomalous traffic from an incident under a stated criterion | [Cisco blueprints above](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf), [NIST AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) |
| Marketing and product assumptions | One documented learned-baseline example; AI-assisted workflow creation distinct from authorization to execute; no assumption that every product automatically reconfigures devices | [Catalyst Assurance 3.1.x](https://www.cisco.com/c/en/us/td/docs/cloud-systems-management/network-automation-and-management/catalyst-center-assurance/3-1-x/b_cisco_catalyst_assurance_3_1_x_ug/b_cisco_catalyst_assurance_3_1_x_ug_chapter_010.html), [Agentic Workflows FAQ](https://www.cisco.com/c/en/us/products/collateral/networking/software/workflows/network-auto-cloud-workflows-faq.html) |
| Ethernet diagnostic certainty | Half duplex or CRC count alone is not a unique cable/mismatch diagnosis. Ticket supplies independently confirmed peer settings and capability | [Cisco Ethernet negotiation guide](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html) |
| DNS exercise consistency | Correct baseline, wrong client resolver, router/client resolver distinction, reserved .test names, fresh query versus cached application results, record-value challenge | [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034), [RFC 6761](https://www.rfc-editor.org/rfc/rfc6761) |

Frontmatter contains the sources learners can use for follow-up. Technical control recommendations and all fictional scenarios are teaching applications of those sources, not claims that any specific product's untested environment enforces them automatically. The exact unsupported PowerShell filename-parsing warning was removed; the complete Terraform example now consistently uses Ubuntu Bash.

## Lab changes

42 formerly centered on predicting results from incomplete files, with a broad “run it on localhost” fallback. It now provides control-node installation, a local runtime check, an isolated physical IOS XE topology, explicit model/port/address/account configuration, manual SSH and known-host preparation, configuration/inventory/playbook files, limited execution, a separate invalid-command observation and repair, and a local Terraform cycle. The Terraform challenge starts with the resource still present and performs cleanup only afterward. The documented pin set is a source-checked setup, **not an executed certification of that entire environment**. The privilege-1 account is not portrayed as a comprehensive command authorization policy.

43 now establishes a working DNS/HTTP baseline before introducing one client DNS fault. It separates prompt construction, unsupported diagnosis review, wrong-context fix review, actual correction, and end-to-end verification. Prompt injection and broad agent actions remain paper exhibits. It does not ask learners to create secrets for upload, break their masks to prove a universal failure, configure an injected description, reset broad interface ranges, or schedule a reload. The independent challenge introduces an incorrect A-record value while retaining the correct client resolver.

The numbered lab sequences changed materially (42: 7→11 steps; 43: 7→9 steps). Existing lab progress may therefore describe completion of a previous sequence; these are substantial revisions to revisit, not merely renamed instructions.

## Assessment identity decisions

Same-topic questions/cards/drills retain their IDs even where wording, evidence limits, or platform assumptions were corrected. In particular, 42-q14 remains a failure-diagnosis item but corrects the invalid inference from the recap; 43-q14 remains prompt-selection practice using a simpler networking context.

Retired identities and replacements:

- 42: retired `ansible-terraform-q02` (Puppet port/timer identification). Added `q16` (inventory/limit scope) and `q17` (host identity), bringing the total to 16.
- 42: retired `c03` and `c04` (Puppet/Chef detailed comparison). Added `c22–c25` for execution scope, honest localhost limits, known-host handling, and saved-plan behavior. Existing `c21` remains the same declarative/procedural comparison skill with the required products.
- 42: no drills or tickets retired; `d09` and `d10` add real execution and known-host inspection.
- 43: retired `ai-in-network-operations-q13` (precision/recall arithmetic). Added `q16` (alert interpretation under a defined incident criterion) and `q17` (approval and outcome verification).
- 43: retired `c08`, `c09` (analytics formula/number recall), and `c17` (universal timed-reload rollback). Added `c19–c23` for practical alert interpretation, evidence format, DNS service verification, timestamp limits, and classification.
- 43: retired `d05` and `d06` (schedule/cancel reload). New `d07` and `d08` collect client/DNS evidence. No tickets retired.

No unrelated replacement reused a retired identity. Every incorrect multiple-choice option has its own whyWrong explanation. Ticket explanations address alternatives and fixes state the evidence needed to verify the outcome.

## Checks and limits

- Full content validator: **zero errors and zero warnings for 42/43**. The first full run encountered a concurrent chapter-40 prerequisite error and warnings in other in-progress files; those are outside this ownership.
- Loaded course comparison against `content/audits/final-ten/baseline.json` confirmed all lesson section IDs for both chapters are preserved.
- Actual Markdown parser: 179 rendered blocks, five diagrams, 59 IOS command lines with explicit prompt/mode, and seven YAML fenced examples parsed successfully. JSON diagrams were independently parsed.
- Independent Python checks covered unique bank IDs, valid answer indexes, multi-select type consistency, and exact coverage of all incorrect options by whyWrong. Single/multi answer positions are distributed across all four indexes.
- Independent address checks confirmed the `10.42.0.0/24` control link and the two distinct `192.168.10.0/24` / `192.168.20.0/24` AI lab networks. Gateways are on-link for the respective endpoints; R1 has both connected networks and neither lab needs an Internet route for its network exercise.
- Independently checked zero-based output indexing, target/limit intersection, two-task recap interpretation, and the local resource lifecycle: create one → unchanged → in-place update one → unchanged → reviewed update → destroy one.
- Re-read every question answer/distractor, card, drill, and ticket against the final lesson/lab. No unresolved VERIFY markers remain in owned files.
- **Not executed:** Packet Tracer, CML/hardware IOS sessions, Ansible remote jobs, Linux package installation, or Terraform CLI lifecycle. No source-review or parser result is represented as live execution. The lab identifies platform/image differences and honest fallback work.
- No application build, Git mutation, deployment, or browser/UI operation was performed.

## Independent peer review of chapters 44 and 45

Reviewed all six assets in each chapter without editing them. Review included every lesson claim, lab stage and mode transition, question answer and distractor, card, command drill, and troubleshooting ticket.

- **44 — no actionable findings.** Checked the VLAN/trunk/LACP topology and root priority arithmetic, R1 router-on-a-stick gateways and DHCP pools, OSPF forwarding and return paths, R2 NAT inside/outside selection, packet-oriented guest ACL and its ICMP reply exception, separate VTY source restrictions, service verification, separate fault/recovery stages, and complete renumbering challenge dependencies. The guest ACL is correctly explained as stateless; source selection for NAT is not described as packet filtering.
- **45 — one checklist label correction reported to the author.** In lab.md line 98, scoring check 15 named the STAFF subnet as allowed to use SSH. The specification and reference configuration consistently permit USERS/PC-A (VLAN 10) and deny STAFF/PC-B (VLAN 20). The author corrected it to “USERS/PC-A SSH succeeds; STAFF/PC-B denied.” The reviewer confirmed the corrected on-disk line; no finding remains open. The full independent review is recorded in `44-45-peer-review.md`.
- **45 — remaining content consistent.** Checked the independent attempt before reference arrangement, 16-point local evidence score, all 19 question keys and distractors, 31 cards, 12 command drills and two tickets. Independently verified the /22 range and wildcard examples, route specificity, STP cost totals, EUI-64 conversion, readiness arithmetic, scoped IPv6 link-local next hop, DHCP candidate range, and the wrong .2 gateway being excluded and unassigned. The DHCP fault therefore changes an option without introducing an address-allocation conflict.
- **45 — policy verification.** As checked 20 September 2026, the [official CCNA exam page](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html), [Cisco exam policies](https://www.cisco.com/site/us/en/learn/training-certifications/exams/policies.html), [Cisco recertification requirements](https://www.cisco.com/site/us/en/learn/training-certifications/certifications/recertification/index.html), and [Cisco-program OnVUE page](https://www.pearsonvue.com/us/en/cisco/onvue.html) support the chapter's dated exam, retake, identification, equipment and digital-whiteboard claims. The chapter appropriately directs readers to appointment-specific requirements and does not invent a passing score, universal question count, or permission for an unscheduled break.

This was source, configuration, arithmetic, and semantic review. Neither integrated topology was executed in Packet Tracer, CML, or hardware; real simulator/image behavior remains an explicit verification limit.

## Independent review of the authored chapters

The root reviewer independently reviewed all twelve chapter 42–43 assets: lessons, labs, every question and distractor, all cards, command drills and tickets. The review reported **no actionable findings**. It specifically confirmed the explicit boundaries between local exercises and actual device execution, and the coherent DNS baseline, fault, repair and challenge sequence. This is an independent source/configuration/semantic review, not live Ansible, Terraform, Packet Tracer or IOS execution.