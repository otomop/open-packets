---
title: "Prepare a control node, collect IOS output, and inspect a local Terraform plan"
environment: mixed
devices: ["Ubuntu 24.04 LTS control node (native Linux or WSL)", "Optional reachable Cisco ISR 4331 with IOS XE 17.12.x and console access", "Ethernet adapter and isolated Ethernet link", "Terraform CLI for the optional local state exercise"]
minutes: 100
---

Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

This lab has two levels. Everyone can install the control-node tools, validate files, and run the localhost exercise. To complete the network execution portion of v2.0 preparation, use a real, authorized IOS/IOS XE SSH target. The specified baseline is an isolated ISR 4331 running IOS XE 17.12.x. A licensed CML IOS XE target is also suitable once you have established host-to-guest IP reachability and substituted its actual interface name. Installing CML and bridging its management network are platform-specific prerequisites; do not assume an internal CML address is reachable from WSL.

Packet Tracer devices cannot serve as ordinary external SSH targets for this exercise. If no reachable target is available, read Steps 3–8 as a worksheet and perform Steps 1–2 and 9–11 locally. Record that remote execution remains to be practiced. All displayed output is representative and was not captured in a simulator or hardware run for this guide.

## Topology

| Endpoint | Port/address | Connection or purpose |
|---|---|---|
| Control computer | Dedicated Ethernet, `10.42.0.10/24` | Direct Ethernet cable to R1; no gateway or DNS on this isolated adapter |
| R1 | `GigabitEthernet0/0/0`, `10.42.0.2/24` | SSH target, directly connected to control computer |
| R1 console | USB/serial console | Initial configuration and recovery |
| WSL Ubuntu | Its existing virtual interface | Initiates outbound connections through Windows networking; do not assign the Windows adapter's address inside WSL |

Use a straight-through Ethernet patch cable with the ISR's auto-MDIX interface. A native Ubuntu computer can use its Ethernet adapter instead of Windows/WSL. Choose an unused isolated subnet: if `10.42.0.0/24` overlaps another adapter, VPN, or route, change both endpoints and the inventory consistently. Install packages through your normal Internet connection before disconnecting it if needed. R1 does not need an Internet default route for this directly connected exercise.

```diagram
{"type":"topology","title":"A reachable SSH target","nodes":[{"id":"CTRL","kind":"laptop","label":"Control computer","sub":"10.42.0.10/24","x":2,"y":3},{"id":"R1","kind":"router","label":"R1","sub":"Gi0/0/0 · 10.42.0.2/24","x":9,"y":3}],"links":[{"from":"CTRL","to":"R1","label":"Isolated Ethernet · SSH TCP 22","accent":true}],"caption":"The lab has one automation target. Terraform's local exercise does not contact R1."}
```

## Step 1: Prepare Ubuntu and the isolated Python environment

On Windows, open an administrator PowerShell window and install the named distribution. Restart if Windows requests it, then open Ubuntu and complete its Linux username/password setup.

```powershell
wsl --install -d Ubuntu-24.04
```

On native Ubuntu 24.04, start here. Use the Ubuntu terminal for all remaining shell commands, not PowerShell. These commands create a project under your Linux home, avoiding Windows-mounted directory permission differences:

Read the preparation commands before running them. `sudo apt` installs Ubuntu packages with administrative permission. `mkdir -p` creates a directory, `cd` enters it, and `~` means your Linux user's home directory. `python3 -m venv .venv` creates the isolated Python environment; `source` activates it in this terminal. `python -m pip` installs Python packages there, while `ansible-galaxy collection install` adds Ansible's modules and plugins. Run one line at a time and stop at an error rather than continuing with an incomplete installation. `pwd` shows the current directory if you need to verify where files will be saved.

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip python3-dev openssh-client build-essential libssh-dev pkg-config
mkdir -p ~/ccna-automation
cd ~/ccna-automation
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'ansible-core>=2.21,<2.22' ansible-pylibssh
ansible-galaxy collection install cisco.ios:11.5.1 ansible.netcommon:8.6.2
ansible --version
ansible-galaxy collection list
```

These are the documented release families checked for this guide, not timeless requirements. Ubuntu 24.04 provides Python 3.12, which is within ansible-core 2.21's supported controller range. If using a different OS or future package versions, check the official support matrix and collection requirements first. In a later terminal, return to this folder and run `source .venv/bin/activate` again.

:::expected
Ansible reports a 2.21.x core and a Python interpreter under `~/ccna-automation/.venv`. The collection list includes `cisco.ios` and `ansible.netcommon` at the requested versions. Installation needs working DNS and Internet access; it does not contact a router. If a dependency fails, resolve that installation error before continuing.
:::

```state
{"status":"Control node ready","tone":"ok","addressed":false,"focus":["CTRL"],"chips":[{"node":"CTRL","text":"ansible-core 2.21.x · .venv","tone":"ok"},{"node":"R1","text":"Not contacted","tone":"dim"}],"rows":[["Ansible core","2.21.x in ~/ccna-automation/.venv","ok"],["Collections","cisco.ios · ansible.netcommon","ok"],["Needed","DNS and Internet access"],["Router contact","None","dim"]]}
```

## Step 2: Prove the local execution path

Use `nano intent.yml`, paste the following, then save with Ctrl+O, Enter, and exit with Ctrl+X:

```yaml
---
- name: Display local study intent
  hosts: localhost
  connection: local
  gather_facts: false
  vars:
    site: BR-01
  tasks:
    - name: Print the intended site
      ansible.builtin.debug:
        msg: "Collect operational evidence for {{ site }}"
```

```bash
ansible-playbook -i localhost, intent.yml --syntax-check
ansible-playbook -i localhost, intent.yml
```

:::expected
The comma makes `localhost,` an inline inventory. One debug task prints the intended site, with a representative recap of `ok=1 changed=0 failed=0`. No IOS commands or SSH connection are involved. This proves the local Ansible runtime works, not that a router can be managed.
:::

```state
{"status":"Local run works","tone":"ok","addressed":false,"focus":["CTRL"],"chips":[{"node":"CTRL","text":"localhost, · connection: local","tone":"ok"},{"node":"R1","text":"Not contacted","tone":"dim"}],"rows":[["Inventory","localhost, · inline"],["Debug message","Collect operational evidence for BR-01","ok"],["Recap","ok=1 changed=0 failed=0","ok"],["SSH or IOS commands","Not involved","dim"]]}
```

## Step 3: Build the router's SSH baseline

Use only a spare lab router with an initial/default configuration and no AAA policy already applied. Keep the console connected. When presented with the initial configuration dialog, decline it. Use a unique lab password in place of the displayed example; record it privately for the SSH prompt.

```ios
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
R1# show ip interface brief
R1# show ip ssh
R1# copy running-config startup-config
```

Accept the default destination filename when saving. If a router already has keys, do not blindly replace them; first confirm it is your disposable lab instance. Configure the computer's dedicated Ethernet adapter with the address in the topology table. In Windows, open the adapter's IPv4 properties, select a manual address and mask, and leave its gateway/DNS empty. Native Ubuntu users can set the same manual IPv4 values in Settings → Network → Wired → IPv4.

:::expected
R1's connected interface should be `up/up` with `10.42.0.2`. SSH version 2 is enabled. The example account has user EXEC privilege and no enable credential. That limits access but is not a complete command-authorization design; this lab additionally restricts the playbook to three specific read-only commands. Production command permissions require the organization's authorization policy.
:::

```state
{"status":"SSH baseline built","tone":"ok","focus":["R1","CTRL"],"chips":[{"node":"R1","text":"R1#"},{"node":"R1","text":"SSH v2 · login local","tone":"ok"},{"node":"CTRL","text":"No gateway or DNS"}],"rows":[["R1 Gi0/0/0","10.42.0.2 · up/up","ok"],["VTY 0 4","transport input ssh · SSH v2","ok"],["labreader","User EXEC · no enable credential"],["Control adapter","10.42.0.10/24 · manual"]]}
```

## Step 4: Establish and verify SSH identity manually

From the same Ubuntu account that will run Ansible:

```bash
ping -c 3 10.42.0.2
ssh labreader@10.42.0.2
```

On first connection, SSH displays a host-key fingerprint. Validate it through an independent trusted record from the lab administrator. For your own newly initialized, directly cabled, isolated router, confirm the console address and physical endpoint before making the first-use trust decision; record the displayed fingerprint for later comparisons. Do not accept a changed fingerprint on a previously known device without investigating the change.

After accepting the verified first-use key, enter the labreader password. At `R1>` run `show version`, `show ip interface brief`, and `show ip route`. Exit back to Ubuntu and check the stored entry:

```bash
ssh-keygen -F 10.42.0.2
```

:::expected
The three commands work manually under the account that Ansible will use, and the Linux account has a matching `~/.ssh/known_hosts` entry. Windows' own SSH known-host file is different from Ubuntu's. If there is an algorithm-negotiation failure on an older image, use a current supported lab image; do not globally enable obsolete algorithms to hide the mismatch.
:::

```state
{"status":"Manual SSH verified","tone":"ok","focus":["CTRL","R1"],"flows":[{"path":["CTRL","R1"],"back":true,"label":"ping -c 3 10.42.0.2"},{"path":["CTRL","R1"],"label":"ssh labreader@10.42.0.2","tags":{"CTRL":"Same Ubuntu account as Ansible","R1":"Presents its host key"},"back":true,"backTags":{"CTRL":"Verify fingerprint · add known_hosts"}},{"path":["CTRL","R1"],"back":true,"label":"show version · ip int brief · ip route","tags":{"R1":"R1> runs the three commands"}}],"chips":[{"node":"R1","text":"SSH v2 · login local","tone":"ok"},{"node":"R1","text":"R1> · labreader","from":2},{"node":"CTRL","text":"known_hosts · 10.42.0.2","tone":"ok","from":2}],"rows":[["Host key","Verified independently, then accepted","ok"],["At R1>","show version · ip int brief · ip route","ok"],["ssh-keygen -F 10.42.0.2","Matching Ubuntu known_hosts entry","ok"]]}
```

## Step 5: Save the connection settings and collection files

In `~/ccna-automation`, create `ansible.cfg` with `nano`:

```ini
[defaults]
host_key_checking = true

[libssh_connection]
host_key_auto_add = false
look_for_keys = false

[paramiko_connection]
host_key_auto_add = false
```

The lab selects libssh explicitly; the extra auto-add setting prevents silent trust if the backend is later changed. `look_for_keys = false` keeps this password-based exercise from trying unrelated user keys first. Do not store the password in these files.

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
        ansible_host_key_checking: true
```

Before opening the complete collection below, write down which module collects operational commands and which output index should display the second command. The complete file is supplied for checking; installation and SSH preparation are setup, while selecting targets, running the commands and interpreting their results are the assessed task.

:::solution Check and save collect.yml

```yaml
---
- name: Collect router evidence
  hosts: branch_routers
  gather_facts: false
  tasks:
    - name: Read version, interfaces, and routes
      cisco.ios.ios_command:
        commands:
          - show version
          - show ip interface brief
          - show ip route
      register: result

    - name: Display the interface table
      ansible.builtin.debug:
        var: result.stdout_lines[1]

    - name: Display all collected evidence in command order
      ansible.builtin.debug:
        var: result.stdout_lines
```
:::

:::expected
The inventory targets only `r1`, and the play does not request privilege escalation. The result has three ordered output entries. Interface output is entry `1`; routes are entry `2`. Ansible's version output should identify this directory's `ansible.cfg` as the configuration file in use.
:::

```state
{"status":"Files saved","focus":["CTRL"],"chips":[{"node":"CTRL","text":"inventory · r1 → 10.42.0.2"},{"node":"CTRL","text":"host_key_checking = true"},{"node":"R1","text":"SSH v2 · login local","tone":"ok"}],"rows":[["Target","r1 only · group branch_routers"],["Connection","network_cli · libssh · labreader"],["Privilege escalation","ansible_become: false"],["Result indexes","0 version · 1 interfaces · 2 routes"]]}
```

## Step 6: Validate scope, then collect the evidence

Before running, predict the host intersection and map all three commands to result indexes. State which checks can establish syntax, selected targets and actual router output respectively. Stop if the listed host is not the intended isolated router.

```bash
ansible-playbook -i inventory.yml collect.yml --syntax-check
ansible-playbook -i inventory.yml collect.yml --limit r1 --list-hosts
ansible-playbook -i inventory.yml collect.yml --limit r1 --ask-pass
```

Read the command list before running the last command. The first display isolates the requested interface table; the following display exposes all three collected outputs in command order. Compare the version/device identity, interface table and routes with your manual SSH check. Registered data otherwise remains internal to the play and is not automatically printed.

:::expected
The host list contains one host, `r1`. A successful three-task run normally has `ok=3 changed=0 unreachable=0 failed=0`. Interface names and output spacing depend on the image. The useful verification is that the expected address and interface state were returned from the intended router, not that a recap exactly matches an illustration.
:::

```state
{"status":"Evidence collected","tone":"ok","focus":["CTRL","R1"],"flows":[{"event":["CTRL"],"tags":{"CTRL":"Syntax check · --list-hosts: r1"}},{"path":["CTRL","R1"],"label":"collect.yml --limit r1","tags":{"CTRL":"network_cli · libssh · labreader","R1":"Runs 3 show commands in order"},"back":true,"backTags":{"CTRL":"Registers result · 3 entries"}}],"chips":[{"node":"R1","text":"SSH v2 · login local","tone":"ok"},{"node":"CTRL","text":"collect.yml"}],"rows":[["Host list","r1 only","ok"],["Recap","ok=3 changed=0 unreachable=0 failed=0","ok"],["stdout_lines[1]","Interface table","ok"],["Compare with","Manual SSH baseline"]]}
```

## Step 7: Introduce one command error and observe it

Copy the working file, then edit only the copied command list:

```bash
cp collect.yml collect-fault.yml
nano collect-fault.yml
```

Replace `show ip interface brief` with the deliberately invalid `show ccna-invalid-command`. Save, then run:

```bash
ansible-playbook -i inventory.yml collect-fault.yml --syntax-check
ansible-playbook -i inventory.yml collect-fault.yml --limit r1 --ask-pass
```

Before execution, predict whether YAML checking can find the IOS typo. Do not repair the file until its result is recorded. Write down whether syntax validation detects the IOS error, what message comes back, and whether the later debug tasks execute.

:::expected
The YAML remains valid. IOS rejects the invalid command during execution, and the task should report a failure with device-error evidence; wording varies with versions. Under normal error handling, the later debug tasks do not run for the failed host. Commands earlier in the list may already have executed. This failure therefore does not imply that the task did nothing.
:::

```state
{"status":"IOS rejects the command","tone":"bad","focus":["CTRL","R1"],"flows":[{"event":["CTRL"],"tags":{"CTRL":"--syntax-check passes · YAML valid"}},{"path":["CTRL","R1"],"label":"collect-fault.yml --limit r1","tags":{"R1":"Rejects show ccna-invalid-command"}},{"path":["R1","CTRL"],"tone":"warn","label":"Device error returned","tags":{"CTRL":"Task fails · debug tasks do not run"}}],"chips":[{"node":"R1","text":"SSH v2 · login local","tone":"ok"},{"node":"CTRL","text":"collect-fault.yml","tone":"warn"}],"rows":[["--syntax-check","Passes · cannot see the IOS typo"],["IOS","Rejects the invalid command","bad"],["Later debug tasks","Do not run for r1","bad"],["Earlier commands","May already have executed","warn"]]}
```

## Step 8: Repair and verify the separate fault file

Edit `collect-fault.yml` and restore the exact command `show ip interface brief`. Repeat the syntax check and the limited run from Step 7. Then run a one-off clock check:

```bash
ansible branch_routers -i inventory.yml -m cisco.ios.ios_command -a 'commands="show clock"' --limit r1 --ask-pass
```

:::expected
The repaired collection succeeds and displays the interface table. The ad-hoc task returns a clock string, but its presence does not prove that NTP is synchronized or that the displayed date is correct. Record which file you repaired; the original `collect.yml` was preserved throughout.
:::

```state
{"status":"Fault file repaired","tone":"ok","focus":["CTRL","R1"],"flows":[{"event":["CTRL"],"wait":1.6,"tags":{"CTRL":"Restored show ip interface brief"}},{"path":["CTRL","R1"],"back":true,"label":"collect-fault.yml, repaired","tags":{"R1":"Runs 3 show commands in order"},"backTags":{"CTRL":"Displays the interface table"}},{"path":["CTRL","R1"],"back":true,"label":"Ad hoc: show clock","tags":{"CTRL":"ansible -m cisco.ios.ios_command","R1":"Returns a clock string"}}],"chips":[{"node":"R1","text":"SSH v2 · login local","tone":"ok"},{"node":"CTRL","text":"collect-fault.yml","tone":"warn","until":0},{"node":"CTRL","text":"collect-fault.yml repaired","tone":"ok","from":0}],"rows":[["Repaired run","Interface table displayed","ok"],["show clock","A clock string · not NTP proof"],["collect.yml","Preserved throughout","ok"]]}
```

## Step 9: Install Terraform for the optional local exercise

Terraform practice supports the v1.1 capability objective; it is not a replacement for executing the Ansible network task. Use the official HashiCorp installation page's Ubuntu/Debian instructions. For a fresh Ubuntu 24.04 installation, the following sets up that signed package repository:

```bash
sudo apt install -y wget gpg lsb-release
wget -O hashicorp-signing-key.asc https://apt.releases.hashicorp.com/gpg
sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg hashicorp-signing-key.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update
sudo apt install terraform
terraform version
mkdir -p ~/ccna-automation/terraform-local
cd ~/ccna-automation/terraform-local
```

If the signing-key file already exists, consult the official installation instructions before replacing it. Create `main.tf` in this otherwise empty exercise directory:

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

:::expected
A stable Terraform 1.x release at least 1.4 satisfies this configuration. The resource uses the built-in provider and has no device address, cloud account, credential, or external provisioner. Only local Terraform state is managed. Keep this directory separate from any real infrastructure project.
:::

```state
{"status":"Terraform installed","focus":["CTRL"],"chips":[{"node":"CTRL","text":"Terraform 1.x · at least 1.4"},{"node":"R1","text":"Not contacted by Terraform","tone":"dim"}],"rows":[["main.tf","terraform_data.lab_intent"],["Provider","Built-in · no device address"],["Managed","Local Terraform state only"],["Directory","terraform-local · kept separate"]]}
```

## Step 10: Review and apply the first plan

```bash
terraform init
terraform fmt
terraform validate
terraform plan -out=first.tfplan
terraform show first.tfplan
```

Before applying anything, predict whether this resource contacts a router and whether a later unchanged plan should propose another addition. Stop and inspect the saved plan. It must identify only `terraform_data.lab_intent` and one addition. Once that is confirmed, execute:

```bash
terraform apply first.tfplan
terraform state list
terraform output
terraform plan
```

:::expected
The first plan proposes one addition. Applying a saved plan does not ask for another confirmation. State then lists `terraform_data.lab_intent` and the output is `BR-01`. The next unchanged plan proposes no changes. No router was configured; “R1” is only a string in this local resource.
:::

```state
{"status":"Local state applied","tone":"ok","focus":["CTRL"],"flows":[{"event":["CTRL"],"tags":{"CTRL":"first.tfplan · 1 to add"}},{"event":["CTRL"],"tags":{"CTRL":"Apply saved plan · no prompt"}},{"event":["CTRL"],"tags":{"CTRL":"Plan again · no changes"}}],"chips":[{"node":"CTRL","text":"state: lab_intent · BR-01","tone":"ok","from":1},{"node":"R1","text":"Not configured · just a string","tone":"dim"}],"rows":[["Saved plan","1 to add · terraform_data.lab_intent"],["terraform output","BR-01","ok"],["Unchanged plan","No changes","ok"],["R1","Not configured by Terraform","dim"]]}
```

## Step 11: Change an input and distinguish update from deletion

Edit only the site value in `main.tf` to `BR-02`. Run `terraform plan` and inspect it before using `terraform apply`. When its details show only the intended update, type `yes` at the apply prompt. Run `terraform output` and `terraform plan` again.

:::expected
For `terraform_data`, changing `input` updates the existing resource in place: zero additions, one change, zero destructions. After apply, the output is `BR-02` and an unchanged plan has no further changes. Leave this resource present for the challenge. A previously saved `first.tfplan` is not the plan for your new edit.
:::

```state
{"status":"Updated in place","tone":"warn","focus":["CTRL"],"flows":[{"event":["CTRL"],"wait":1.6,"tags":{"CTRL":"main.tf site BR-01 → BR-02"}},{"event":["CTRL"],"tags":{"CTRL":"Plan: 0 add · 1 change · 0 destroy"}},{"event":["CTRL"],"tags":{"CTRL":"Apply after yes · output BR-02"}}],"chips":[{"node":"CTRL","text":"state: lab_intent · BR-01","tone":"ok","until":2},{"node":"CTRL","text":"state: lab_intent · BR-02","tone":"warn","from":2},{"node":"R1","text":"Not configured · just a string","tone":"dim"}],"rows":[["Plan","0 to add · 1 to change · 0 to destroy","warn"],["terraform output","BR-02","ok"],["Next unchanged plan","No further changes","ok"],["first.tfplan","Not the plan for this edit","dim"]]}
```

## Step 12: Submit evidence at the level actually completed

Keep the local-runtime result distinct from the remote collection. For remote execution, submit the selected host list, approved command list, actual returned device identity/interface/route output, the bad-command observation, the repaired rerun and its comparison with the manual baseline. Do not submit passwords, private keys or unreviewed configuration dumps.

If you used only a worksheet, supply the completed playbook and predicted selection/output indexes, but state “remote IOS execution not completed.” If you performed Terraform, keep its reviewed resource/action summary and resulting local output as a separate capability demonstration.

:::expected
The record identifies where each task ran, which target was contacted, which command produced each result and which fault was corrected. A successful localhost debug or Terraform data update is not counted as remote IOS command execution.
:::

```state
{"status":"Evidence recorded","focus":["CTRL","R1"],"chips":[{"node":"R1","text":"The one automation target"},{"node":"CTRL","text":"Local runs recorded separately"}],"rows":[["Remote IOS","Hosts · commands · output · fault · repair"],["Localhost and Terraform","Not remote IOS execution","dim"],["Worksheet only","Remote IOS execution not completed"],["Never submit","Passwords · private keys"]]}
```

## Troubleshooting

If Ansible is unavailable, reactivate the virtual environment and inspect `ansible --version`. If a collection is missing, check `ansible-galaxy collection list` under the same account. A library import error requires installing the SSH dependency inside that environment.

For a network failure, first confirm the selected address and manual SSH from Ubuntu. Windows reachability alone does not prove the WSL path works; VPN or firewall policy can differ. A host-key mismatch requires verification of the router's identity and any legitimate key replacement. Replace only the affected stale known-host entry after verification, then establish trust again. Do not disable host-key checking as a general repair.

For an authorization error, test the same command manually as `labreader`. Do not add privilege 15 simply to make every possible command work. The IOS exercise intentionally uses user EXEC commands. For parser errors, compare the platform, command spelling, YAML indentation, and network connection variables.

For Terraform, use `pwd` and `terraform state list` before diagnosing unexpected additions. Being in a different directory or using different state changes what Terraform manages. Do not delete state to repair a bad plan.

## Challenge

Keep the original successful files. Create a new `handover.yml` that collects, in this order, `show ip route`, `show clock` and `show version` from the approved `branch_routers` group. Register the result, first display only the route output, then display all collected outputs for the handover record. Use `inventory.yml`, inspect the target set with a limit of `r1`, then run only that host. Compare the returned connected route and device identity with your manual baseline. Do not enable configuration access for this task.

Before execution, complete this separate scope worksheet: another inventory has `branch_routers = r1,r2` and `core_routers = r3`. A play targets `branch_routers`. Predict the eligible hosts under `--limit r1` and under `--limit r3`. These worksheet hosts do not need to exist in your actual lab.

Optional Terraform continuation: from the known Step 11 state, change the local site input back to `BR-01`. Predict the plan, review/apply it, and verify its output. Then remove only this exercise's local data resource with a reviewed destroy. State why none of these local Terraform results proves that R1 changed.

:::solution Check the independent collection and scope
Use this complete playbook for comparison after your own attempt:

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
    - name: Display all handover evidence in command order
      ansible.builtin.debug:
        var: handover.stdout_lines
```

From `~/ccna-automation`:

```bash
ansible-playbook -i inventory.yml handover.yml --syntax-check
ansible-playbook -i inventory.yml handover.yml --limit r1 --list-hosts
ansible-playbook -i inventory.yml handover.yml --limit r1 --ask-pass
```

The first command result has index 0. The second display exposes entries 0, 1 and 2, so the route, clock and version observations are available to compare; the register alone would not print them. The returned connected route should include the isolated `10.42.0.0/24` network on the actual lab interface. Inspect actual command output and compare the device information with the baseline; a clock string does not establish NTP synchronization. If remote execution was unavailable, submit your playbook and reasoned result separately and mark the device task outstanding.

For the separate host worksheet, the intersections are `{r1}` and the empty set respectively. A limit cannot add r3 to a play that excludes it.

For optional Terraform, run from `~/ccna-automation/terraform-local`. Changing `input.site` from BR-02 to BR-01 proposes one in-place update for `terraform_data.lab_intent`. Review `terraform plan`, use `terraform apply` and approve only that update, then inspect `terraform output`. For cleanup, `terraform destroy` must propose only removal of `terraform_data.lab_intent`; confirm that exact local removal and check `terraform state list` is empty. No real device provider or provisioner was present, so R1 was never configured by Terraform.
:::
