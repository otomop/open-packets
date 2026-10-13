---
id: ansible-terraform
number: 42
title: "Ansible & Terraform"
subtitle: "Build an inventory, run verified commands, and understand what a plan and its results mean."
part: automation
domain: aiops
minutes: { lesson: 70, lab: 100 }
summary: "Recognize configuration management capabilities, use Ansible to collect IOS command output, and follow a local Terraform plan/apply cycle. Learn the setup, authentication, state, and verification checks that make the results useful."
objectives:
  v1: ["6.6"]
  v2: ["5.5"]
prereqs: [ios-essentials, network-management-and-sdn, rest-apis-json]
sectionIds:
  Why configuration management is useful: why-configuration-management-exists
  Comparing Ansible and Terraform: four-tools-two-philosophies
  The control node and inventory: ansible-control-node-inventory-and-variables
  Reading and running a playbook: playbooks-modules-and-a-real-run
  Scope, credentials, and repeatable changes: running-it-safely-check-syntax-vault-idempotence
  Terraform configuration, providers, and state: terraform-providers-state-and-the-plan-apply-cycle
  Interpreting results and finding failures: reading-the-output
  Exam focus: exam-focus
sources:
  - { title: "Ansible: Jinja templating", url: "https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_templating.html" }
  - { title: "Python: Virtual environments", url: "https://docs.python.org/3/library/venv.html" }
  - { title: "Ansible: ios_command implementation and documented boundaries", url: "https://raw.githubusercontent.com/ansible-collections/cisco.ios/main/plugins/modules/ios_command.py" }
  - { title: "Ansible: IOS CLI plugin command execution", url: "https://raw.githubusercontent.com/ansible-collections/cisco.ios/main/plugins/cliconf/ios.py" }
  - { title: "Cisco: Configure SSH on routers", url: "https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html" }
  - { title: "OpenSSH: ssh-keygen and known-host entries", url: "https://man.openbsd.org/ssh-keygen" }
  - { title: "HashiCorp: Sensitive state and plan data", url: "https://developer.hashicorp.com/terraform/language/manage-sensitive-data" }
  - { title: "Ansible: Playbook CLI", url: "https://docs.ansible.com/projects/ansible/latest/cli/ansible-playbook.html" }
  - { title: "Cisco: CCNA v1.1 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Ansible: Installation and control-node requirements", url: "https://docs.ansible.com/projects/ansible/latest/installation_guide/intro_installation.html" }
  - { title: "Ansible: Release and Python support matrix", url: "https://docs.ansible.com/projects/ansible/latest/reference_appendices/release_and_maintenance.html" }
  - { title: "Ansible: Building an inventory", url: "https://docs.ansible.com/projects/ansible/latest/inventory_guide/intro_inventory.html" }
  - { title: "Ansible: IOS platform options", url: "https://docs.ansible.com/projects/ansible/latest/network/user_guide/platform_ios.html" }
  - { title: "Ansible: network_cli connection", url: "https://docs.ansible.com/projects/ansible/latest/collections/ansible/netcommon/network_cli_connection.html" }
  - { title: "Ansible: libssh connection settings", url: "https://docs.ansible.com/projects/ansible/latest/collections/ansible/netcommon/libssh_connection.html" }
  - { title: "Ansible: ios_command module", url: "https://docs.ansible.com/projects/ansible/latest/collections/cisco/ios/ios_command_module.html" }
  - { title: "Ansible: ios_config module", url: "https://docs.ansible.com/projects/ansible/latest/collections/cisco/ios/ios_config_module.html" }
  - { title: "Ansible: Variables and registered results", url: "https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_variables.html" }
  - { title: "Ansible: Check and diff modes", url: "https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html" }
  - { title: "Ansible: Error handling", url: "https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_error_handling.html" }
  - { title: "Ansible: Vault", url: "https://docs.ansible.com/projects/ansible/latest/vault_guide/vault.html" }
  - { title: "Microsoft: Install WSL", url: "https://learn.microsoft.com/en-us/windows/wsl/install" }
  - { title: "Microsoft: WSL networking", url: "https://learn.microsoft.com/en-us/windows/wsl/networking" }
  - { title: "HashiCorp: Install Terraform", url: "https://developer.hashicorp.com/terraform/install" }
  - { title: "HashiCorp: Core workflow", url: "https://developer.hashicorp.com/terraform/intro/core-workflow" }
  - { title: "HashiCorp: State", url: "https://developer.hashicorp.com/terraform/language/state" }
  - { title: "HashiCorp: terraform_data", url: "https://developer.hashicorp.com/terraform/language/resources/terraform-data" }
  - { title: "HashiCorp: Plan command", url: "https://developer.hashicorp.com/terraform/cli/commands/plan" }
  - { title: "HashiCorp: Apply command", url: "https://developer.hashicorp.com/terraform/cli/commands/apply" }
---

An automation task still needs a precise networking purpose. “Collect the software version and interface state from the branch routers” is specific enough to implement and check. “Make the network correct” leaves the target, intended result, and acceptable changes undefined. Ansible and Terraform help carry out repeatable work; the engineer remains responsible for choosing and verifying that work.

Use [chapter 41's](#/chapter/rest-apis-json) distinction between structured text and its meaning: YAML organizes the inventory and tasks, while returned data still needs type, position and outcome checks. Reuse SSH identity and login checks from [chapter 08](#/chapter/ios-essentials) before letting a tool collect the same operational commands.

The current v1.1 objective emphasizes recognizing Ansible and Terraform capabilities. The announced v2.0 objective requires using configuration management mechanisms such as Ansible to execute commands. This chapter therefore develops a complete Ansible collection task and uses a small, local Terraform exercise to explain its different approach. Cloud provisioning, elaborate roles, and configuration pipelines are optional further study.

## Why configuration management is useful

:::facts
- Ansible uses an **inventory** to identify targets and **YAML playbooks** to organize tasks.
- For the IOS CLI examples here, the control node initiates SSH on TCP `22` using `ansible.netcommon.network_cli`.
- Network modules run on the control node; this method does not install Python or an Ansible agent on IOS.
- Terraform configuration describes intended infrastructure; **providers** implement interactions with supported platforms.
- Terraform **state** associates configuration resource addresses with managed objects. It is not a router startup configuration.
- **Idempotence** means repeating an operation with the same intended state does not introduce further changes once that state is satisfied.
:::

Consider ten routers that should use one approved NTP server. A technician could configure each router individually, then check each association. Automation can apply the same reviewed setting to an inventory group and collect results in one run. It reduces repeated typing and makes the requested change available for review. It does not remove the need to confirm reachability, authentication, time synchronization, or whether the chosen server was correct.

**Configuration drift** is a difference between actual configuration and the intended baseline. An emergency manual change can create drift without being a mistake: perhaps it temporarily restores service. Before enforcing the baseline again, understand why the difference exists. Otherwise automation can efficiently undo a necessary repair.

**Infrastructure as code**, or IaC, expresses infrastructure definitions in files that can be reviewed and versioned. A useful change record includes the approved intent, relevant file revision, target list, execution result, and operational verification. Keeping a playbook in a repository creates a review opportunity; it does not automatically create an approval process or prove that a device accepted every command.

## Comparing Ansible and Terraform

| Aspect | Ansible | Terraform |
|---|---|---|
| Main unit you read | Playbook with plays and tasks | Configuration with resources and arguments |
| Typical file syntax | YAML | HCL |
| How work is organized | Tasks executed for selected inventory hosts | Dependencies and proposed resource changes |
| IOS example | Collect operational CLI output over SSH | Manage supported objects through an appropriate provider |
| Persistent management state | No Terraform-style ownership state file required for ordinary CLI tasks | State tracks managed object associations and attributes |

Ansible is commonly described as **agentless** and **push based**: you initiate a run from a control node, which contacts its targets. That description concerns this execution model. An organization can schedule runs through a separate automation platform; the basic command-line tool does not continuously enforce configuration after its process exits.

A playbook is an ordered procedure, but individual modules can express a desired state. “Ensure this description exists” differs from “send this arbitrary command every time.” Whether repetition is safe depends on the module, its arguments, the platform, and the commands. A read-only collection task and a configuration task should not be treated as interchangeable.

Terraform is **declarative**: the files describe desired objects and their relationships. A provider translates resource operations into the target system's supported interface. Provider coverage matters; installing Terraform does not give every IOS command a corresponding resource. Terraform and Ansible can be used together, provided their ownership is clear. Having both tools continually enforce different values for the same setting causes repeated reversals.

Puppet and Chef are other configuration management products, but memorizing their default polling intervals or ports is not required by the stated objectives for these two tracks. Focus on the two named mechanisms and on recognizing what a concrete task actually does.

## The control node and inventory

The **control node** holds Ansible, its Python runtime, the necessary collections, and the files you execute. Use Linux, macOS, or a supported Linux distribution under **Windows Subsystem for Linux (WSL)** on Windows. Native Windows PowerShell is not an Ansible control node. A **collection** packages modules and plugins; `cisco.ios` supplies IOS modules and `ansible.netcommon` supplies shared networking support.

The lab installs Ansible in a Python **virtual environment**, a directory containing an isolated set of Python packages and the runtime links used to execute them. This is different from chapter 39's virtual machine: it does not supply a separate operating-system kernel. Activating it selects that environment's commands for the current terminal.

The **managed node** is the router or switch. The lab uses a reachable IOS XE device, an SSH login, and a limited account that can execute the selected `show` commands. Packet Tracer's simulated SSH service is not a normal SSH server exposed to Ansible on your computer. A local playbook can teach YAML and variables, but changing a router playbook to `localhost` does not make IOS commands work on Linux.

The inventory below deliberately contains one host. `r1` is an inventory alias, while `ansible_host` gives its reachable address.

Read YAML from the outside inward. A `name: value` entry is a mapping; indentation puts child entries under a parent. A leading `-` introduces a list item, as you will see in the playbook. Use spaces, not tabs, for indentation. In this inventory, follow `all` → `children` → `branch_routers`: `hosts` lists the group's devices, while `vars` supplies settings to them.

```yaml
all:
  children:
    branch_routers:
      hosts:
        r1:
          ansible_host: 10.42.0.2
      vars:
        ansible_connection: ansible.netcommon.network_cli
        ansible_network_os: cisco.ios.ios
        ansible_network_cli_ssh_type: libssh
        ansible_user: labreader
        ansible_become: false
        ansible_host_key_checking: true
```

`network_cli` expects a network CLI session rather than a general-purpose shell. `ansible_network_os` selects the appropriate platform behavior. The explicit `libssh` setting matches the installed `ansible-pylibssh` dependency. The lab prepares `known_hosts` before running Ansible, so the persistent background connection does not need an interactive first-use trust decision.

Authentication and privilege are separate. The account can log in successfully and still lack authorization for a particular command. For tasks that legitimately need privileged EXEC, IOS supports `ansible_become: true` with `ansible_become_method: enable` and the appropriate enable credential. Our collection task does not require configuration access, so it does not enable escalation. An account already at the needed privilege may not need a separate enable transition.

Group variables apply to members of a group; host variables can provide individual addresses or exceptions. Keep the first exercise small enough that you can explain every inherited setting. A wrong group membership can target an unintended router even when the playbook itself is correct.

## Reading and running a playbook

A **playbook** contains one or more plays. Each **play** selects hosts and defines tasks. A **task** invokes a module with arguments. `gather_facts: false` prevents the play's automatic fact-gathering step; network-specific facts can be collected explicitly when needed.

Save this complete example as `collect.yml` beside `inventory.yml`:

```yaml
---
- name: Collect branch router status
  hosts: branch_routers
  gather_facts: false
  tasks:
    - name: Read version and interfaces
      cisco.ios.ios_command:
        commands:
          - show version
          - show ip interface brief
      register: result

    - name: Display the interface table
      ansible.builtin.debug:
        var: result.stdout_lines[1]
```

Indentation defines structure. `tasks` belongs to the play; the two task entries align below it. `commands` belongs to `ios_command`. `register` belongs to that task and gives the returned result a name. It is not a command sent to IOS.

Ansible can also substitute a variable into a quoted string using **Jinja templating**. With `site: BR-01`, the value `"Collecting from {{ site }}"` becomes `"Collecting from BR-01"`. The control node evaluates the expression before sending the task to its target. The lab uses this small pattern before connecting to any router; it does not require you to write a program or template a full configuration.

`stdout` is a list containing one output string per command. Lists start at index zero: `result.stdout[0]` contains the version output and `result.stdout[1]` contains the interface output. `stdout_lines` contains corresponding lists of lines, convenient for display. It is still text grouped into lines, not a parsed database of interface objects.

```diagram
{"type":"sequence","title":"One read-only Ansible collection","actors":["Operator","Control node","R1"],"steps":[{"from":0,"to":1,"label":"Run collect.yml","note":"Inventory selects r1"},{"from":1,"to":2,"label":"SSH connection","note":"Authenticate and verify host identity"},{"from":1,"to":2,"label":"show version; show ip interface brief"},{"from":2,"to":1,"label":"Command results","note":"Two ordered output entries"},{"from":1,"to":0,"label":"Display result and recap"}],"caption":"The controller executes the module. R1 executes the supported IOS commands it receives."}
```

Run these from the directory containing both files:

```bash
ansible-playbook -i inventory.yml collect.yml --syntax-check
ansible-playbook -i inventory.yml collect.yml --list-hosts
ansible-playbook -i inventory.yml collect.yml --limit r1 --ask-pass
```

The first checks playbook syntax and structure, not router reachability or IOS command validity. The second shows target selection. The third executes the tasks and prompts for the SSH password. An equivalent one-off command uses the `ansible` executable:

```bash
ansible branch_routers -i inventory.yml -m cisco.ios.ios_command -a 'commands="show clock"' --limit r1 --ask-pass
```

Here `-i` selects the inventory, `-m` names the module, and `-a` supplies its arguments. The quoted argument keeps the requested IOS command together; it is the router, not the control node's shell, that interprets `show clock`.

Use `ios_command` for operational EXEC commands, `ios_config` for supported configuration management, and `ios_facts` for structured platform facts. The familiar `ansible.builtin.ping` module is not ICMP ping; it checks an Ansible/Python environment on a suitable managed system. It is not the connectivity test for this IOS CLI exercise.

## Scope, credentials, and repeatable changes

Before execution, review both the target set and the task list. `--limit r1` narrows eligible hosts; it cannot make a destructive command harmless. `--syntax-check` cannot determine whether an interface identifier exists on your model. A password prompt avoids putting the password directly in an inventory, but collected output can still contain sensitive information.

For example, if a play selects `branch_routers` containing `r1` and `r2`, `--limit r1` keeps only `r1`. A limit of `r3`, which belongs only to `core_routers`, selects no host for that play. The limit intersects the play's selection; it does not add an otherwise ineligible host. Check this with `--list-hosts` before execution.

**Ansible Vault** encrypts variables or files at rest. A play must load the encrypted variables, and the run must obtain the Vault password, for example through `--ask-vault-pass`. The Vault password decrypts stored data; it is not necessarily the SSH password. Vault does not stop a task from printing a decrypted value. Avoid unnecessary credential collection and review logs before sharing them.

For optional configuration study, this task expresses one intended line:

```yaml
- name: Ensure the approved NTP server line exists
  cisco.ios.ios_config:
    lines:
      - ntp server 10.42.0.10
    save_when: changed
```

With ordinary line matching and no custom change conditions, the module compares the requested configuration with the running configuration. If it sends a missing line, it reports a change. A subsequent unchanged run can report no change. This does **not** prove NTP synchronization; operational verification remains necessary. `save_when: changed` saves when this task changed configuration. `save_when: modified` has a different meaning: save when running and startup configurations differ, which can include changes outside this task.

For a setting inside an interface section, `parents` identifies the section, while `lines` describes its contents. Use the full stored syntax, such as `parents: interface GigabitEthernet0/0/0`, rather than an interactive abbreviation. IOS accepting `int gi0/0/0` does not mean a textual configuration comparison can find that abbreviated section in running configuration. If every unchanged run reports a change, compare these strings and check for other writers or custom change conditions.

Check mode, `--check`, depends on module support. Diff mode, `--diff`, can show proposed configuration differences for supporting modules. Neither is a substitute for reading the tasks or testing on the documented platform. Some tasks can explicitly run outside check mode; output may expose sensitive lines.

:::trap Reported change is not a complete safety test
An EXEC command can alter a device without entering configuration mode. `reload` and counter-clearing commands are examples. The ordinary `ios_command` result is not a reliable declaration that every supplied command was harmless. Approve the actual commands and permissions; do not infer read-only behavior solely from `changed=0`.
:::

## Terraform configuration, providers, and state

Terraform files use **HCL**, HashiCorp Configuration Language, whose blocks identify objects and whose arguments assign values. A **resource address**, such as `terraform_data.lab_intent`, combines the resource type and the local name used in your configuration. A provider implements resource operations. A **backend** determines where state is stored; a local exercise normally uses `terraform.tfstate` in its working directory.

State links the configuration to managed objects and records relevant attributes. It can contain sensitive values, as can saved plan files. Restrict their access. Teams commonly use an appropriately configured remote backend, with locking where supported, rather than exchanging copies of local state. Deleting state is not a rollback: existing infrastructure can remain while Terraform loses its association with it.

| Command | Purpose | Important boundary |
|---|---|---|
| `terraform init` | Prepare the working directory, providers, and backend | Can contact registries/backends; does not apply resource changes |
| `terraform validate` | Check configuration consistency | Does not establish that a live platform will accept it |
| `terraform plan` | Calculate proposed actions | Normally reads managed objects through providers |
| `terraform apply` | Execute a reviewed set of actions | Can create, change, or destroy resources |
| `terraform state list` | List resource addresses in state | Does not show the entire infrastructure |
| `terraform destroy` | Plan and apply managed-resource removal | Not a universal “undo last change” command |

This resource uses Terraform's built-in `terraform_data` type, available from Terraform 1.4. It stores an input/output value through Terraform's resource lifecycle. It does not configure the named router.

```hcl
terraform {
  required_version = ">= 1.4.0, < 2.0.0"
}
resource "terraform_data" "lab_intent" {
  input = {
    hostname = "R1"
    site     = "BR-01"
  }
}
output "intended_site" {
  value = terraform_data.lab_intent.output.site
}
```

In a new, initialized directory, the plan proposes one addition. After applying it, another unchanged plan proposes no changes. Editing the input's site value produces an in-place update for this resource. These observations teach the workflow without cloud credentials, charges, or live network changes. Real providers decide which attributes can be updated and which require replacement.

A plan marks creation with `+`, update with `~`, and destruction with `-`. `-/+` indicates destruction followed by replacement; another ordering can apply with create-before-destroy behavior. Read both the summary and the resource details. A one-resource replacement can still interrupt an important service.

`terraform apply` without a saved plan normally asks for confirmation after showing its plan. Applying a saved plan file does not ask again; reviewing and choosing that file is the approval step. Generate a new plan after changing the intended configuration rather than assuming an older saved plan includes your edit.

## Interpreting results and finding failures

The following is representative output from the two-task collection play, not a recording from a device:

```output Representative Ansible result
ok: [r1]  ← the collection task completed
"result.stdout_lines[1]": [
  "Interface              IP-Address     OK? Method Status Protocol",
  "GigabitEthernet0/0/0    10.42.0.2      YES manual up     up"
]
PLAY RECAP
r1 : ok=2 changed=0 unreachable=0 failed=0 skipped=0 rescued=0 ignored=0  ← collection and display tasks succeeded
```

The recap is per host. `changed` is a subset of successful tasks, so adding `ok` and `changed` does not give a task count. Default failure behavior stops further ordinary tasks for the failed host; explicit error-handling features can alter this.

Read the accompanying error message before diagnosing a failure. `UNREACHABLE` identifies a connection problem as classified by Ansible. `FAILED` is broader: a network connection plugin can surface authentication or connection errors as task failures. Therefore `failed=1` alone does not prove that login succeeded. In contrast, a returned IOS invalid-command message shows that the device processed the attempted command.

Work through layers: selected inventory host, address and route, SSH service, host identity, credentials, privilege, platform plugin, then command syntax. If manual SSH works but Ansible fails, compare the account, address, backend, known-host file, and inventory variables. Increasing verbosity can help, but protect the resulting logs. Do not repair a host-key mismatch by globally disabling checking.

For Terraform, distinguish configuration, state, and actual platform evidence. A successful apply records completed operations, but service reachability may require a separate test. A later plan can identify drift, subject to what the provider reads and manages. “No changes” concerns that configuration and state context; it does not certify every part of the network.

## Exam focus

Be able to identify an inventory, play, task, module, collection, and registered result. Given a command list, select the correct zero-based output index. Use a syntax check, inspect the target set, and execute a limited read-only play with the required connection settings.

Recognize agentless operation, configuration drift, idempotence, and the roles of Terraform providers, plans, and state. Explain the limits of a recap, a dry run, a saved plan, and an apparent success. The practical standard is to know what was requested, where it ran, what evidence came back, and which further checks establish the intended network behavior.
