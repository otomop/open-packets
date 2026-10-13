# Practice rework: 41–43

Reviewed and revised 24 September 2026 against the captured `practice-34-45/baseline.json`. Scope is the three chapters' labs and assessment banks. Lesson bodies, section identities/order, objectives and prerequisites are unchanged; chapter 42's lab estimate changes from 90 to 100 minutes. No application, styling, deployment or unrelated chapter files were changed.

## Workload and demand

| Chapter | Questions | Difficulty 1 / 2 / 3 | Cards | Drills | Tickets | Lab |
|---|---:|---:|---:|---:|---:|---|
| 41 REST APIs and JSON | 21 | 9 / 12 / 0 | 18 | 2 | 2 | 16 stages; 30-minute interpretation path or about 65 minutes with local execution |
| 42 Ansible and Terraform | 20 | 6 / 14 / 0 | 20 | 4 | 2 | 12 stages; 100 minutes including preparation/optional local Terraform |
| 43 AI in network operations | 19 | 7 / 12 / 0 | 16 | 0 | 2 | 9 stages; 55 minutes, supplied network preparation or paper evidence |

Counts follow distinct outcomes rather than uniform quotas. These chapters' explicit evidence and bounded decisions chiefly require retrieval or application, so none is labeled analysis merely to fill a target. All checkpoints progress from retrieval through application to any justified evidence analysis. Every option, key, explanation and wrong-answer explanation, card, drill, ticket/repair and complete lab was reviewed.

## Chapter 41 decisions

Preserve REST/HTTP/JSON distinctions, auth versus authorization, CRUD/method semantics, Basic encoding, nested types and request/status interpretation. Correct direct recognition questions previously all labeled 2. Add nested-array lookup, boolean-schema rejection, 204 body handling, repeated DELETE state semantics and a current-token/read-role/write-error comparison. Replace weak error/retry alternatives with plausible stage mistakes.

Narrow large status catalogs and product-specific card recall; preserve invalid-syntax knowledge under c20 and introduce the separate schema skill under new c23. Keep two useful request/body-inspection drills; do not assess memorization of the supplied Python program or product token-acquisition boilerplate. Tickets use symptom titles and distinguish an expired credential from permission/path errors and an uncertain POST from a confirmed duplicate.

The lab supplies an explicit worksheet route and optional local service. Predictions precede observation; syntax and schema faults now each have separate recovery stages. The saved-body interpretation, method worksheet and independent exchange use closed solutions. The new challenge includes a nested interface boolean, a corrected PATCH body, an asynchronous failure and a 204 with no body. It is explicitly a different API contract, not writes to the GET-only teaching service.

## Chapter 42 decisions

Maintain capability recognition while putting the v2 execution outcome first: inventory selection, limit intersection, command-module selection, zero-based output mapping, syntax-check versus execution, and actual result interpretation. Add an empty intersection, a local-debug boundary and a saved-plan/later-edit decision. The explicit authentication error is application; an additional duplicate identity question was not retained because the ticket already compares manual and inventory-selected accounts.

Reduce specialized Vault, facts, configuration-diff and Terraform-lifecycle drill recall. Installation, collection versions and known-host preparation remain complete lab instructions. Keep four meaningful command tasks: syntax check, limited host preview, limited playbook execution and one-off IOS command execution. Replace the two optional configuration-management tickets with new identities for actual collection failures: wrong selected username and a device-command typo.

The lab retains Ubuntu/WSL, venv, collections, libssh, inventory, SSH identity, manual command checks and a real supported target. The complete collection is revealed after a small learner completion task. Scope/result predictions precede execution. The invalid IOS command is observed before its separate correction and full rerun. A new evidence stage states exactly which results count as actual remote execution. The changed challenge collects routes/clock/version in a new order and separately applies two host intersections. Terraform remains an optional local capability exercise with a reviewed update/removal; it is never counted as R1 execution.

## Chapter 43 decisions

Keep predictive/generative/ML behavior, inference, anomalies and the limits of confident output. Exact v2.0 named prompt components remain data classification, output format, persona and instructions; context, examples and constraints support useful practice without being misrepresented as a verbatim additional blueprint list.

Rework prompt alternatives so several are reasonable products, but only one fits the stated task or authorized scope. Add missing classification, truthful context, example-transfer limits and premature closure despite independent client evidence. Demote the explicit half/full duplex comparison to application. Remove academic taxonomy/product-name catalogs, duplicate review lists and repeated prerequisite CLI drills; zero drills is deliberate because selecting/evaluating prompts does not require a new command syntax.

The lab labels routing/DNS construction as supplied preparation. Learners write their prompt before opening the example, critique a plausible wrong DNS-service inference, reject the valid command aimed at the wrong resolver context, then repair and verify separately. Prompt/authority worksheets and the independent record variation have closed answers. Device saves are separate blocks with completed prompts. No external AI service or upload is required.

## Identity record

`41-43-decisions.json` covers **160** baseline/current union identities exactly once: **66 keep, 38 revise, 34 retire, 22 add**. The retained identities keep their assessed subject; narrowing a multi-part prompt stays within its original subject. No destination is invented for material left only as lesson reference.

Retired IDs, using each chapter's full prefix:

- **rest-apis-json:** cards c08, c10, c13, c14, c17; drills d07, d08, d11, d12.
- **ansible-terraform:** question q11; cards c09, c21; drills d03, d04, d05, d06, d07, d08, d10; tickets t01, t02.
- **ai-in-network-operations:** question q10; cards c01, c02, c15, c16, c18, c21; drills d01, d02, d03, d04, d07, d08.

New IDs:

- **rest-apis-json:** q17–q21; c21–c23.
- **ansible-terraform:** q18–q21 and q23; d11; t03–t04.
- **ai-in-network-operations:** q18–q21; c24–c25.

Each ledger entry gives the topic-specific reason. All labs carry the learner revision notice because positional checkmarks do not distinguish older exercises.

## Primary-source verification

Opened or checked on 24 September 2026:

| Claims / boundaries | Primary sources |
|---|---|
| v1.1 REST/JSON/capability/AI scope and v2.0 prompt/agentic/execution verbs | [Cisco v1.1 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf); [Cisco v2.0 topics](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf) |
| JSON types, arrays, syntax, object interoperability | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259.html) |
| HTTP method semantics, 202/204, credential/role and response interpretation | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html); [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617.html) |
| Local HTTP handler is teaching code, not a production server | [Python http.server](https://docs.python.org/3/library/http.server.html) |
| IOS operational-command boundary, ordered stdout/stdout_lines and changed-result limitations | [Official cisco.ios module source](https://raw.githubusercontent.com/ansible-collections/cisco.ios/main/plugins/modules/ios_command.py) |
| Syntax-check, limit/list-hosts and execution distinction | [Ansible playbook CLI](https://docs.ansible.com/projects/ansible/latest/cli/ansible-playbook.html) |
| Python 3.12–3.14 support for core 2.21; reviewed collection family constraints | [Ansible release matrix](https://docs.ansible.com/projects/ansible/latest/reference_appendices/release_and_maintenance.html); [cisco.ios v11.5.1 runtime](https://raw.githubusercontent.com/ansible-collections/cisco.ios/v11.5.1/meta/runtime.yml); [netcommon v8.6.2 runtime](https://raw.githubusercontent.com/ansible-collections/ansible.netcommon/v8.6.2/meta/runtime.yml) |
| libssh identity/credential settings | [Ansible libssh plugin documentation](https://docs.ansible.com/projects/ansible/latest/collections/ansible/netcommon/libssh_connection.html) |
| Local terraform_data input lifecycle and saved-plan application | [HashiCorp terraform_data](https://developer.hashicorp.com/terraform/language/resources/terraform-data); [Terraform apply](https://developer.hashicorp.com/terraform/cli/commands/apply) |
| Generated-content and evidence risks | [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) |
| Concrete agentic workflow capability rather than unrestricted-action assumptions | [Cisco Agentic Workflows FAQ](https://www.cisco.com/c/en/us/products/collateral/networking/software/workflows/network-auto-cloud-workflows-faq.html) |

The hosted ios_command documentation endpoint returned a fetch error during this pass; the official maintained module source was inspected instead. Release tags require their actual `v` prefix on GitHub; the exact existing pinned collection versions were confirmed rather than inferred from a failing unprefixed URL. No gratuitous package upgrade was made.

## Verification and limits

- Shared validator: **0 errors**; **0 warnings for 41–43**. Unrelated existing warnings are outside this author's changes.
- `verify-41-43.mjs`: **828 actual rendered fragments**, **160 exact ledger decisions**, three closed challenge disclosures, sequential lab steps with expected/solution guidance, unchanged lesson sections/order/prerequisites, parsed YAML blocks, and **26 semantic/identity assertions**.
- `verify-rest-stub.py`: **13 live local HTTP/JSON cases passed** using Python 3.14.7. It extracts the actual supplied handler and validator, listens only on loopback with an ephemeral test port, tests 200/401/403/404/filtering and syntax/schema/recovery/non-JSON-number cases, then closes the listener and removes temporary data. This is an actual bounded local execution, not a Cisco API/device test.
- Independently checked cases for root: Basic `lab:training` decoding; expired-token timestamp ordering; zero-based nested booleans and output indexes; nonempty/empty Ansible host intersections; 10.42.0.0/24 direct endpoints and the AI lab's two /24 networks; unchanged/updated Terraform effects are source-reviewed, not locally executed.
- No Packet Tracer, CML, ISR, remote Ansible, Terraform installation/apply, live controller, or external AI execution was performed in this pass. The lab states these boundaries and offers supplied worksheets without calling them device execution.
- Authoring snippets ran transiently; only reproducible verification scripts are retained. No build, server swap, commit, push or deployment was performed.

## Independent review resolutions

The fundamentals reviewer read every practice item and complete lab in 41–43. Applied its actionable findings: demote the explicit 41 authorization case to application; retire the broad REST constraint catalog; correct ticket 42 t03’s mismatched command alternative; explicitly display all registered command results after the selected-index task, including the challenge, so the evidence request can actually be satisfied; update the normal collection recap to three tasks. In 43, retire the duplicate hypothesis-table question, replace unrelated q07 alternatives with plausible scope/verification mistakes, and classify literal permission/agentic recognition as foundations and the supplied stale-client closure case as application. No analysis quota was manufactured. The exact ledger and rendered-fragment check were regenerated after these edits. Final reviewer reread is recorded in the companion peer report.
