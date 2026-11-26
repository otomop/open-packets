---
title: "Predict Ansible runs and read a Terraform plan"
environment: worksheet
devices: ["Core: this page and a notebook; no device or software needed", "Optional extension: Ubuntu 24.04 control node (native or WSL), an isolated IOS XE router such as an ISR 4331 or a CML IOS XE node, and the Terraform CLI"]
minutes: 40
---
Practice revised November 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks. **Steps 1–6 are the core and take about 40 minutes with no device:** you read an inventory and a playbook, predict what a first and a second run change, diagnose a task that never stops reporting changes, and read a Terraform plan. **Steps 7–8 are an optional extension** of about an hour: run a playbook against a real IOS XE router and run the Terraform cycle locally. Packet Tracer cannot be an Ansible target, so the extension needs real equipment or Cisco Modeling Labs.

Write each prediction down before you open its answer. The exhibits show realistic output; your own runs in the extension will differ in spacing and version details.

## Topology

```diagram
{"type":"topology","title":"One control node, three routers in the inventory","caption":"The control node opens SSH to each selected router. r1 and r2 are branch routers; r3 is a core router.","nodes":[{"id":"CTRL","kind":"laptop","label":"Control node","sub":"10.42.0.10","x":1,"y":3},{"id":"r1","kind":"router","label":"r1","sub":"10.42.0.2","x":9,"y":0.5},{"id":"r2","kind":"router","label":"r2","sub":"10.42.0.3","x":9,"y":3},{"id":"r3","kind":"router","label":"r3","sub":"10.42.0.4","x":9,"y":5.5}],"links":[{"from":"CTRL","to":"r1"},{"from":"CTRL","to":"r2"},{"from":"CTRL","to":"r3"}]}
```

The routers exist only on paper for Steps 1–6. Before the first run, r1 has no NTP server configured, and r2 already has `ntp server 10.42.0.10`. The account `netops` has privilege 15 on all three.

## Step 1: Read the inventory

```yaml
all:
  vars:
    ansible_connection: ansible.netcommon.network_cli
    ansible_network_os: cisco.ios.ios
    ansible_user: netops
  children:
    branch_routers:
      hosts:
        r1:
          ansible_host: 10.42.0.2
        r2:
          ansible_host: 10.42.0.3
    core_routers:
      hosts:
        r3:
          ansible_host: 10.42.0.4
```

1. Which groups exist, and which hosts belong to each?
2. Which address does Ansible use for `r2`?
3. How does Ansible reach the routers, and what is installed on them for it?
4. A play targets `branch_routers`. Which hosts run it with no limit, with `--limit r1`, and with `--limit r3`?

:::expected
1. `branch_routers` holds r1 and r2; `core_routers` holds r3. All three are also in `all`.
2. `10.42.0.3`. `r2` is an alias; `ansible_host` gives the address.
3. Over SSH with the `network_cli` connection, using IOS behaviour from `cisco.ios.ios`. Nothing is installed on the routers; Ansible is agentless.
4. r1 and r2; only r1; no host at all. A limit narrows the play's selection and cannot add r3.
:::

```state
{"status":"Inventory read","addressed":true,"focus":["CTRL","r1","r2"],"chips":[{"node":"r3","text":"core_routers","tone":"dim"}],"rows":[["branch_routers","r1, r2","ok"],["core_routers","r3"],["Connection","network_cli · SSH · agentless"]]}
```

## Step 2: Read the playbook

Save nothing; just read `ntp.yml`:

```yaml
---
- name: Apply the branch NTP baseline
  hosts: branch_routers
  gather_facts: false
  tasks:
    - name: Ensure the approved NTP server line exists
      cisco.ios.ios_config:
        lines:
          - ntp server 10.42.0.10
        save_when: changed

    - name: Read the configured NTP line and associations
      cisco.ios.ios_command:
        commands:
          - show running-config | include ntp
          - show ntp associations
      register: ntp_check

    - name: Display the configured NTP line
      ansible.builtin.debug:
        var: ntp_check.stdout_lines[0]
```

1. How many plays and how many tasks does the file contain?
2. Which task can change a router, and which only reads?
3. What does `register: ntp_check` do? Is it sent to IOS?
4. Which command's output does `ntp_check.stdout_lines[0]` display?
5. When does `save_when: changed` copy running-config to startup-config?

:::expected
1. One play with three tasks.
2. The `ios_config` task can change configuration. The `ios_command` task sends two EXEC commands and the `debug` task prints a value on the control node.
3. It stores the task's result under the name `ntp_check` on the control node. It is not an IOS command.
4. Index 0 is the first command, `show running-config | include ntp`.
5. Only on a host where that task actually changed the configuration.
:::

## Step 3: Predict the first run

Before reading the output, predict for each host whether the first task reports `changed` or `ok`, whether the router saves its configuration, and the `ok=` and `changed=` numbers in the recap.

```output
$ ansible-playbook -i inventory.yml ntp.yml --ask-pass

PLAY [Apply the branch NTP baseline] *******************************************

TASK [Ensure the approved NTP server line exists] ******************************
changed: [r1]
ok: [r2]

TASK [Read the configured NTP line and associations] ***************************
ok: [r1]
ok: [r2]

TASK [Display the configured NTP line] *****************************************
ok: [r1] => {
    "ntp_check.stdout_lines[0]": [
        "ntp server 10.42.0.10"
    ]
}
ok: [r2] => {
    "ntp_check.stdout_lines[0]": [
        "ntp server 10.42.0.10"
    ]
}

PLAY RECAP *********************************************************************
r1   : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
r2   : ok=3    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

1. Why does r1 report `changed` and r2 `ok` for the same task?
2. Which router saved its configuration?
3. r1 shows `ok=3 changed=1`. How many tasks ran on r1?
4. Why does r3 not appear?

:::expected
1. `ios_config` compares the requested line with each running configuration. r1 lacked it, so the module sent it; r2 already had it, so nothing was sent.
2. Only r1, because `save_when: changed` saves only where the task changed something.
3. Three. `changed` is a subset of the successful tasks, not an extra count.
4. The play targets `branch_routers`, and r3 is only in `core_routers`.
:::

```state
{"status":"First run · r1 changed","tone":"ok","addressed":true,"focus":["CTRL","r1","r2"],"flows":[{"path":["CTRL","r1"],"label":"Adds ntp server · saves","tags":{"r1":"changed=1"}},{"path":["CTRL","r2"],"label":"Line already present","tags":{"r2":"changed=0"}}],"rows":[["r1","ok=3 changed=1 · saved","warn"],["r2","ok=3 changed=0","ok"],["r3","Not selected","dim"]]}
```

## Step 4: Predict the second run

Nobody touches the routers. You run the same command again. Predict both recap lines, then check.

:::expected
Both hosts report `ok=3 changed=0`, and the first task shows `ok: [r1]` and `ok: [r2]`. That is idempotence: once the intended state is in place, repeating the run changes nothing. Neither router saves again.

`changed=0` does not prove NTP works. Only the `show ntp associations` output, read in the registered result, says whether the router has reached the server.
:::

```state
{"status":"Second run · nothing changes","tone":"ok","addressed":true,"focus":["CTRL","r1","r2"],"flows":[{"path":["CTRL","r1"],"label":"Line already present","tags":{"r1":"changed=0"}},{"path":["CTRL","r2"],"label":"Line already present","tags":{"r2":"changed=0"}}],"rows":[["r1","ok=3 changed=0","ok"],["r2","ok=3 changed=0","ok"],["Idempotence","Repeat run changes nothing","ok"]]}
```

## Step 5: Diagnose a task that always reports a change

A colleague added this task to set r1's WAN interface description. r1 runs IOS XE, and its running configuration shows the interface as `interface GigabitEthernet0/0/0`.

```yaml
    - name: Describe the WAN interface
      cisco.ios.ios_config:
        parents: int gi0/0/0
        lines:
          - description WAN to HQ
```

The colleague ran the play three times without touching r1 in between. Every run printed:

```output
TASK [Describe the WAN interface] **********************************************
changed: [r1]
```

`show running-config interface GigabitEthernet0/0/0` on r1 shows the description exactly once.

1. IOS accepted the commands. Why does the module report a change every time?
2. What is the narrow fix?
3. After the fix, what should the second run report?

:::expected
1. `ios_config` compares text. It looks for a section called `int gi0/0/0` in the running configuration, never finds one because IOS stores `interface GigabitEthernet0/0/0`, and so sends the lines again on every run. IOS accepts the abbreviation, so the description is correct, but the task is not idempotent.
2. Write the parent exactly as the running configuration stores it: `parents: interface GigabitEthernet0/0/0`.
3. `ok: [r1]` with `changed=0` for that task. A task that reports a change on every unchanged run is a signal to compare the strings, not to ignore the recap.
:::

## Step 6: Read a Terraform plan

This configuration uses Terraform's built-in `terraform_data` resource, which only stores values in Terraform state:

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

After `terraform init`, the first `terraform plan` shows:

```output
Terraform will perform the following actions:

  # terraform_data.lab_intent will be created
  + resource "terraform_data" "lab_intent" {
      + id     = (known after apply)
      + input  = {
          + hostname = "R1"
          + site     = "BR-01"
        }
      + output = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + intended_site = "BR-01"
```

The plan is applied. Later the site is edited to `BR-02`, and the next plan shows:

```output
  # terraform_data.lab_intent will be updated in-place
  ~ resource "terraform_data" "lab_intent" {
        id     = "3f1c9a52-6b0e-4d2a-9c7e-0b8d7e5a1f44"
      ~ input  = {
          ~ site     = "BR-01" -> "BR-02"
            # (1 unchanged attribute hidden)
        }
      ~ output = {
          - hostname = "R1"
          - site     = "BR-01"
        } -> (known after apply)
    }

Plan: 0 to add, 1 to change, 0 to destroy.
```

1. What do `+` and `~` mean, and what would `-/+` mean?
2. Does either plan contact or configure a router called R1?
3. After the first apply, what would a plan with no edits show?
4. Where does Terraform record that `terraform_data.lab_intent` exists?
5. If you saved the first plan with `-out=first.tfplan`, can you apply that file to get BR-02?

:::expected
1. `+` creates, `~` updates in place, and `-/+` destroys and re-creates (replacement), which can interrupt a real service.
2. No. `R1` is only a string; this resource has no provider that talks to a device.
3. `No changes.` The configuration and state already agree, the Terraform equivalent of `changed=0`.
4. In the state file, `terraform.tfstate` in the working directory for this local backend.
5. No. A saved plan contains only the actions calculated when it was made. Plan again after every edit.
:::

```state
{"status":"Plan read","focus":["CTRL"],"chips":[{"node":"r1","text":"Not contacted by Terraform","tone":"dim"}],"rows":[["First plan","1 to add","ok"],["After edit","1 to change · in place","warn"],["State","terraform.tfstate · local"]]}
```

## Step 7: Extension: Collect output from a real router with Ansible

You need an isolated IOS XE router you are allowed to change, such as an ISR 4331 or a CML IOS XE node reachable from your computer, plus Ubuntu 24.04 (native or WSL). Keep the router console connected. These steps use one router, `r1`, at `10.42.0.2/24` on interface `GigabitEthernet0/0/0`, directly cabled to a dedicated computer adapter set to `10.42.0.10/24` with no gateway. Change the names and addresses to match your equipment.

Install the control node in a Python virtual environment:

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip python3-dev openssh-client build-essential libssh-dev pkg-config
mkdir -p ~/ccna-automation && cd ~/ccna-automation
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'ansible-core>=2.21,<2.22' ansible-pylibssh
ansible-galaxy collection install cisco.ios:11.5.1 ansible.netcommon:8.6.2
ansible --version
```

On the router, build an SSH baseline with a read-only account. Use your own lab password:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# ip domain name ccna.test
R1(config)# username labreader privilege 1 secret LabReadOnly42!
R1(config)# interface gigabitethernet0/0/0
R1(config-if)# ip address 10.42.0.2 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# crypto key generate rsa general-keys modulus 2048
R1(config)# ip ssh version 2
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# end
R1# copy running-config startup-config
```

From Ubuntu, run `ssh labreader@10.42.0.2` once, check the host-key fingerprint against the console's `show ip ssh` output before accepting it, and exit. In `~/ccna-automation`, save `ansible.cfg`:

```ini
[defaults]
host_key_checking = true

[libssh_connection]
host_key_auto_add = false
look_for_keys = false
```

Save `inventory.yml`:

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
```

Save `collect.yml`:

```yaml
---
- name: Collect router evidence
  hosts: branch_routers
  gather_facts: false
  tasks:
    - name: Read version, interfaces and routes
      cisco.ios.ios_command:
        commands:
          - show version
          - show ip interface brief
          - show ip route
      register: result

    - name: Display the interface table
      ansible.builtin.debug:
        var: result.stdout_lines[1]
```

Run it twice:

```bash
ansible-playbook -i inventory.yml collect.yml --syntax-check
ansible-playbook -i inventory.yml collect.yml --limit r1 --list-hosts
ansible-playbook -i inventory.yml collect.yml --limit r1 --ask-pass
ansible-playbook -i inventory.yml collect.yml --limit r1 --ask-pass
```

:::expected
The host list is `r1` only. Each run ends `ok=2 changed=0 unreachable=0 failed=0` and displays the interface table with `GigabitEthernet0/0/0` at `10.42.0.2` up/up. Compare it with what you see on the console. `changed=0` here means `ios_command` never reports a change; it does not prove the commands were harmless, so approve the command list itself. Do not disable host-key checking to get past a connection error.
:::

## Step 8: Extension: Run the Terraform cycle locally

Install Terraform from HashiCorp's Ubuntu repository:

```bash
sudo apt install -y wget gpg lsb-release
wget -O hashicorp-signing-key.asc https://apt.releases.hashicorp.com/gpg
sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg hashicorp-signing-key.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
mkdir -p ~/ccna-automation/terraform-local && cd ~/ccna-automation/terraform-local
```

Save the Step 6 configuration as `main.tf`, then:

```bash
terraform init
terraform validate
terraform plan -out=first.tfplan
terraform apply first.tfplan
terraform output
terraform plan
```

Edit the site to `BR-02`, run `terraform plan`, then `terraform apply` and type `yes`. Finish with `terraform destroy` and `terraform state list`.

:::expected
Your plans match the Step 6 exhibits apart from the `id`. Applying the saved plan asks no question; the unedited plan reports `No changes.`; the edit is one in-place update; `terraform apply` without a plan file asks for `yes`. Destroy proposes removing only `terraform_data.lab_intent`, and the state list is then empty. No router was configured at any point.
:::

## Troubleshooting

- A host you expected is missing from a run: check group membership in the inventory, then the play's `hosts:` line and any `--limit`. Use `--list-hosts` before running.
- A configuration task reports `changed` on every run: compare `parents` and `lines` with the exact text in the running configuration. Abbreviations never match.
- `changed=0` but the service still fails: the recap reports what the task sent, not whether the feature works. Read the registered `show` output.
- Extension, `UNREACHABLE` or a connection failure: test manual SSH from the same Ubuntu account first, then check the address, `known_hosts` and the inventory variables.
- Extension, Terraform proposes an unexpected addition: run `pwd` and `terraform state list`. A different directory means different state. Never delete state to fix a plan.

## Challenge

Answer on paper.

1. Write `handover.yml` for the Step 1 inventory: target `branch_routers`, collect `show ip route`, `show clock` and `show version` in that order, register the result as `handover`, and display only the route output.
2. Predict the recap for r1 and r2 on the first and second run of your playbook.
3. Using the Step 6 configuration after the BR-02 apply, predict the plan if you change the site back to `BR-01`, and the plan for `terraform destroy`.

:::solution
For question 1:

```yaml
---
- name: Collect handover evidence
  hosts: branch_routers
  gather_facts: false
  tasks:
    - name: Read routes, clock and version
      cisco.ios.ios_command:
        commands:
          - show ip route
          - show clock
          - show version
      register: handover

    - name: Display routes
      ansible.builtin.debug:
        var: handover.stdout_lines[0]
```

The route output is index 0 because it is the first command.

2. Both runs, both hosts: `ok=2 changed=0`. `ios_command` does not report changes, so the second run looks identical to the first.
3. Changing the site back is `0 to add, 1 to change, 0 to destroy`, an in-place update with `~ site = "BR-02" -> "BR-01"`. Destroy is `0 to add, 0 to change, 1 to destroy` for `terraform_data.lab_intent`. Neither touches a router.
:::
