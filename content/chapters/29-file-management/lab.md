---
title: Back up configurations and stage files safely
environment: mixed
devices: [R1, SW1, SRV1, S1, Linux]
minutes: 110
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Complete this lab in three sittings if useful: **backup and merge (Steps 1–6)**, **cleartext service comparison (Steps 7–8)**, and **secure transfer (Steps 9–17)**. The first two support v1.1's TFTP/FTP description objective. The third provides the SFTP/SCP execution required for v2.0. Linux installation, accounts, keys and the supplied fresh-device AAA block are preparation, not commands to memorize here.

Before a copy, write its source, destination, client, server and expected effect on running-config/startup-config. After it, verify the destination. A simulator or paper interpretation does not establish that you performed a secure transfer.

## Topology

```diagram
{"type":"topology","title":"A Packet Tracer LAN and a separate secure-transfer segment","caption":"Steps 1–8 use R1, SW1 and SRV1 in Packet Tracer; Steps 9–17 use a separate isolated lab in which S1 Gi1/0/1 connects directly to the Linux VM's lab NIC.","nodes":[{"id":"R1","kind":"router","label":"R1","sub":"10.29.0.1/24","x":1,"y":1},{"id":"SW1","kind":"switch","label":"SW1","sub":"VLAN 1","x":5.5,"y":1},{"id":"SRV1","kind":"server","label":"SRV1","sub":"10.29.0.100/24","x":10,"y":1},{"id":"S1","kind":"l3switch","label":"S1","sub":"10.29.0.1/24","x":1,"y":5},{"id":"Linux","kind":"server","label":"Linux","sub":"10.29.0.100/24","x":10,"y":5}],"links":[{"from":"R1","to":"SW1","fromLabel":"Gi0/0","toLabel":"Fa0/1"},{"from":"SW1","to":"SRV1","fromLabel":"Fa0/2","toLabel":"Fa0"},{"from":"S1","to":"Linux","fromLabel":"Gi1/0/1","toLabel":"lab NIC"}],"zones":[{"label":"Packet Tracer · Steps 1–8","nodes":["R1","SW1","SRV1"]},{"label":"Secure-transfer lab · Steps 9–17","nodes":["S1","Linux"]}]}
```

Steps 1–8 use **Packet Tracer**, one ISR 2911 R1, one 2960 SW1 and Server-PT SRV1. Connect R1 Gi0/0 to SW1 Fa0/1 and SRV1 Fa0 to SW1 Fa0/2 with copper straight-through cables. Use default VLAN 1. R1 is `10.29.0.1/24`; SRV1 is `10.29.0.100/24`, gateway `10.29.0.1`. No Internet or default route is required.

Steps 9–17 use a **separate isolated secure-transfer lab**, not Packet Tracer: a Catalyst 9300 with the documented IOS XE 17.16 release, or an authorized virtual IOS XE image that supports the demonstrated features, plus an Ubuntu 24.04 lab VM. The explicit switch example uses S1 Gi1/0/1 as a routed port, `10.29.0.1/24`. Linux uses `10.29.0.100/24` on its dedicated lab NIC. Connect that NIC directly to the isolated switch port using copper Ethernet; in a virtual lab, connect both nodes to one isolated virtual segment. Do not connect this segment to a workplace or home LAN. Interface names and storage prefixes must be adapted from the actual inventory.

The exercise uses newly created lab accounts and uniquely named files. It does not erase startup configuration, reload a device, delete software or activate an image. Console access must remain available throughout SSH setup. These procedures have not been executed in Packet Tracer or IOS XE during authoring. If a feature is absent, record the exact limitation and complete the interpretation exercise; do not claim a successful secure transfer without a supporting environment.

## Step 1 — Establish the Packet Tracer baseline

On SRV1 Desktop → IP Configuration, set the static address, mask `255.255.255.0` and gateway from the topology above. Leave DNS blank. On R1, decline the initial setup dialog if presented:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet0/0
R1(config-if)# description ISOLATED_FILE_LAB
R1(config-if)# ip address 10.29.0.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
R1# ping 10.29.0.100
```

Wait for SW1's ports to forward. Save the project as `files-baseline.pkt` and continue in `files-working.pkt`.

:::expected
Gi0/0 is up/up and ping replies arrive after address resolution. No router default route is needed for a server on the same subnet. Repair connectivity before starting file operations.
:::

```state
{"status":"Baseline reachable","addressed":["R1","SRV1"],"tone":"ok","wake":["SW1"],"focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"back":true,"label":"ARP for 10.29.0.100","tags":{"R1":"Address resolution first"}},{"path":["R1","SW1","SRV1"],"back":true,"label":"Ping 10.29.0.100","tags":{"R1":"Same subnet · no default route"}}],"chips":[{"node":"R1","text":"R1#"}],"rows":[["R1 Gi0/0","10.29.0.1/24 · up/up","ok"],["SRV1","10.29.0.100/24 · gw 10.29.0.1"],["Ping 10.29.0.100","Replies after ARP","ok"]]}
```

## Step 2 — Predict and inspect the correct stores

Before executing anything, write which store `copy running-config startup-config` changes, and whether it creates an off-device backup.

:::solution
The active configuration is the source; the saved startup file is the destination. This saves locally for startup and creates no off-device copy.
:::

Run the save command alone:

```ios R1
R1# copy running-config startup-config
```

Accept the destination filename with Enter. After the copy completes, inspect:

```ios R1
R1# show startup-config
R1# show file systems
R1# dir flash:
R1# show version
```

:::expected
The startup configuration includes hostname R1 and the lab interface address. Record actual local prefixes, available bytes and the running image filename. Do not expect an exact capacity or image version from a screenshot. If `flash:` is not listed, use the actual persistent-storage prefix in subsequent local-file commands.
:::

```state
{"status":"startup-config inspected","addressed":["R1","SRV1"],"tone":"ok","focus":["R1"],"chips":[{"node":"R1","text":"R1#"}],"rows":[["startup-config","hostname R1 · Gi0/0 address","ok"],["Record","Prefixes, free bytes, image file"]]}
```

## Step 3 — Send a named TFTP backup

In SRV1 → Services → TFTP, enable the service. On R1:

```ios R1
R1# copy running-config tftp:
```

At the prompts, provide server `10.29.0.100` and destination `R1-before.cfg`. Wait until the copy completes; do not paste the prompt answers as IOS commands.

:::expected
The router reports completion and SRV1's TFTP file list contains `R1-before.cfg`. Record the actual file size if shown. This operation did not also save startup-config. TFTP offers no encrypted transport; use only this isolated, nonsensitive lab.
:::

```state
{"status":"Backup on SRV1","addressed":["R1","SRV1"],"tone":"ok","focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"label":"copy running-config tftp:","tags":{"R1":"Client · sends running-config","SRV1":"Stores R1-before.cfg"}}],"chips":[{"node":"R1","text":"R1#"},{"node":"SRV1","text":"TFTP On","tone":"ok"}],"rows":[["TFTP server","SRV1 · 10.29.0.100"],["SRV1 file list","R1-before.cfg","ok"],["startup-config","Not saved by this copy","dim"],["Encryption","None · isolated lab only"]]}
```

## Step 4 — Retrieve to a staged file

Your requirement is to retrieve `R1-before.cfg` as `flash:R1-received.cfg` for inspection while leaving both configuration stores unchanged. Write the source and destination before opening the supplied command.

:::solution
The source is remote TFTP and the destination is a new named local flash file. Use `copy tftp: flash:R1-received.cfg`, host `10.29.0.100` and source `R1-before.cfg`. A running-config destination would apply commands; startup-config would overwrite the saved configuration.
:::

Execute your chosen operation, using the answer above only after attempting the direction yourself. Enter `10.29.0.100` for the remote host and `R1-before.cfg` for the source. Accept the specified destination. Once complete:

```ios R1
R1# dir flash:
R1# more flash:R1-received.cfg
```

:::expected
The staged file contains the R1 baseline. Its presence does not mean a configuration has been applied. If the simulator omits `more`, inspect the file through the server/GUI where supported and mark local content inspection unavailable. Do not substitute `copy ... running-config` merely to read a file.
:::

```state
{"status":"File staged in flash","addressed":["R1","SRV1"],"tone":"ok","focus":["R1"],"flows":[{"path":["R1","SW1","SRV1"],"back":true,"label":"Retrieve R1-before.cfg","tags":{"R1":"Requests R1-before.cfg"},"backTags":{"SRV1":"Sends R1-before.cfg","R1":"Writes flash:R1-received.cfg"}},{"event":["R1"],"tags":{"R1":"Inspect flash:R1-received.cfg"}}],"chips":[{"node":"SRV1","text":"TFTP On","tone":"ok"},{"node":"R1","text":"R1#"},{"node":"R1","text":"Staged · not applied","from":1}],"rows":[["Source","R1-before.cfg on SRV1"],["Destination","flash:R1-received.cfg","ok"],["Configuration stores","Both unchanged"],["Staged content","R1 baseline"]]}
```

## Step 5 — Predict a merge, then observe it

The staged baseline contains `hostname R1` and does not mention Loopback29. You will change the hostname and add that unused interface, then merge the baseline. Write whether each change will remain before running the block.

:::solution
The hostname command in the file restores R1. An extra interface absent from the file can remain because the operation merges commands instead of removing every setting missing from the source.
:::

Make two harmless isolated changes. Loopback29 has no address and is not used by the topology.

```ios R1
R1# configure terminal
R1(config)# hostname R1-TEMP
R1-TEMP(config)# interface loopback29
R1-TEMP(config-if)# description TEMPORARY_MERGE_TEST
R1-TEMP(config-if)# end
R1-TEMP# copy flash:R1-received.cfg running-config
```

Accept the destination prompt, wait for completion, then inspect:

```ios R1
R1# show running-config
R1# show ip interface brief
```

:::expected
The hostname returns to R1 because the file contains `hostname R1`. Loopback29 remains because the earlier backup did not contain a command to remove it. Transfer completion and hostname restoration do not prove exact replacement.
:::

```state
{"status":"Merge keeps Loopback29","addressed":["R1","SRV1"],"tone":"warn","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"Merge R1-received.cfg → running"}}],"chips":[{"node":"R1","text":"R1-TEMP#","tone":"warn","until":0},{"node":"R1","text":"R1#","from":0},{"node":"R1","text":"Loopback29 present","tone":"warn"},{"node":"SRV1","text":"TFTP On","tone":"ok"}],"rows":[["Hostname","R1-TEMP → R1 · in file","ok"],["Loopback29","Remains · not in file","warn"],["Operation","Merge, not exact replacement"]]}
```

## Step 6 — Recover the baseline explicitly

After recording the merge result, remove the temporary interface:

```ios R1
R1# configure terminal
R1(config)# no interface loopback29
R1(config)# end
R1# show ip interface brief
R1# ping 10.29.0.100
```

Then save separately:

```ios R1
R1# copy running-config startup-config
```

Accept Enter when asked for the destination.

:::expected
Loopback29 is absent, the server remains reachable, and startup-config again represents the intended lab state. A carefully reviewed explicit removal repaired this one known change; no reload or complete replacement was necessary.
:::

```state
{"status":"Baseline recovered","addressed":["R1","SRV1"],"tone":"ok","focus":["R1","SRV1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"no interface loopback29"}},{"path":["R1","SW1","SRV1"],"back":true,"label":"Ping 10.29.0.100"},{"event":["R1"],"tags":{"R1":"Save running → startup-config"}}],"chips":[{"node":"R1","text":"R1#"},{"node":"R1","text":"Loopback29 present","tone":"warn","until":0},{"node":"SRV1","text":"TFTP On","tone":"ok"}],"rows":[["Loopback29","Absent","ok"],["Ping 10.29.0.100","Server reachable","ok"],["startup-config","Intended lab state","ok"]]}
```

## Step 7 — Compare FTP and introduce an authentication fault

In SRV1 → Services → FTP, enable FTP and create account `filelab` with fictional lab password `FileLab2026!`. Grant that account Read, Write and List permissions in the simulator; additional Delete/Rename permissions are unnecessary. Save/add the account before testing.

Configure an intentionally wrong router FTP client password:

```ios R1
R1# configure terminal
R1(config)# ip ftp username filelab
R1(config)# ip ftp password WrongLabPassword
R1(config)# end
R1# copy running-config ftp:
```

Supply server `10.29.0.100` and destination `R1-ftp.cfg` when prompted.

:::expected
The server should reject authentication; exact error text depends on the simulator. No successful backup should appear under that name. The IP baseline can still work. These `ip ftp` commands configure the router's client credentials, not an FTP server on R1.
:::

```state
{"status":"FTP login rejected","addressed":["R1","SRV1"],"tone":"bad","focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"label":"copy running-config ftp:","tags":{"R1":"FTP client · user filelab"},"stop":"SRV1","stopText":"Login rejected · wrong password"}],"chips":[{"node":"R1","text":"R1#"},{"node":"SRV1","text":"FTP On · filelab","tone":"ok"},{"node":"SRV1","text":"TFTP On","tone":"ok"},{"node":"R1","text":"ip ftp password wrong","tone":"bad"}],"rows":[["SRV1 account","filelab · read, write, list"],["R1 client password","Wrong on purpose","bad"],["R1-ftp.cfg","No successful backup","bad"],["IP baseline","Can still work","dim"]]}
```

## Step 8 — Repair FTP and verify the destination

Set the matching fictional password:

```ios R1
R1# configure terminal
R1(config)# ip ftp password FileLab2026!
R1(config)# end
R1# copy running-config ftp:
```

Use the same server and filename. After completion, inspect SRV1's FTP file list and retrieve `R1-ftp.cfg` with `copy ftp: flash:R1-ftp-received.cfg` if supported, answering its prompts individually. Inspect the staged text.

:::expected
The repaired credentials permit the authorized transfer. FTP control and data use separate TCP connections; a login alone would not prove the data transfer succeeded. The backup may include the stored lab FTP password, demonstrating why configuration files need access protection. Save `files-complete.pkt`. Do not use this cleartext method for real secrets.
:::

```state
{"status":"FTP backup stored","addressed":["R1","SRV1"],"tone":"ok","focus":["R1","SRV1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"ip ftp password now matches"}},{"path":["R1","SW1","SRV1"],"label":"FTP control · login","tags":{"R1":"Client · user filelab","SRV1":"Login accepted"}},{"path":["R1","SW1","SRV1"],"tone":"alt","label":"FTP data · R1-ftp.cfg","tags":{"R1":"Separate data connection","SRV1":"Stores R1-ftp.cfg"}}],"chips":[{"node":"R1","text":"R1#"},{"node":"SRV1","text":"FTP On · filelab","tone":"ok"},{"node":"SRV1","text":"TFTP On","tone":"ok"},{"node":"R1","text":"ip ftp password wrong","tone":"bad","until":0},{"node":"R1","text":"ip ftp password fixed","tone":"ok","from":0}],"rows":[["Login","Accepted · filelab","ok"],["SRV1 file list","R1-ftp.cfg","ok"],["Control and data","Separate TCP connections"],["Backup may contain","The lab FTP password"]]}
```

## Step 9 — Supplied preparation: Linux transfer server

A **virtual machine (VM)** runs its own operating system inside software on a host computer. Its **network interface card (NIC)** can connect to a virtual segment or to a dedicated physical adapter. This setup needs a console you can use even while that lab network is disconnected; Chapter 39 develops virtualization design separately.

If you do not already have the specified Ubuntu 24.04 lab VM:

1. Obtain the Ubuntu 24.04 installation image from [Ubuntu's release archive](https://releases.ubuntu.com/24.04/). In your virtualization application's new-machine wizard, select Linux/Ubuntu, allocate the resources required by the chosen installer, create a new virtual disk, and attach the image as its installation media.
2. Follow [Ubuntu's installation guide](https://ubuntu.com/tutorials/install-ubuntu-desktop) **inside that new VM**, using its empty virtual disk and creating your lab administrator account. Do not install over the host computer's disk. Reboot the VM from its installed disk, then open Terminal from its application menu.
3. Temporarily give the VM Internet access for package installation. Separately create its dedicated lab NIC. For a physical S1, attach that NIC through an otherwise unused host Ethernet adapter connected only to S1; for a virtual S1, attach both nodes to the same isolated virtual segment. The exact wizard names depend on your virtualization application. Verify that this segment has no connection to the home/work LAN and no virtual DHCP service assigning conflicting addresses.
4. Complete the package setup below, then disconnect the temporary Internet adapter. Keep the VM console open and use the dedicated lab NIC for the address configuration that follows.

In this Linux terminal, type commands without a router prompt. Paths are case-sensitive. `sudo` runs an authorized administrative command and normally asks for the lab administrator's password; that password is distinct from the transfer account you are about to create. `apt` manages Ubuntu packages, and `systemctl` controls services. Install and start OpenSSH, then create the unprivileged transfer account:

```bash
sudo apt update
sudo apt install openssh-server
sudo systemctl enable --now ssh
sudo adduser ccnafile
```

This lab uses password authentication on the isolated VM so the IOS client can authenticate. Read `sudo sshd -T` and find `passwordauthentication yes`. If a fresh VM template disables it, use its console and `sudo nano /etc/ssh/sshd_config.d/00-ccna-lab.conf` to create the file with the single line `PasswordAuthentication yes`. In nano, save with Ctrl+O, press Enter to accept the filename, then exit with Ctrl+X. Run `sudo sshd -t` before `sudo systemctl restart ssh`, then confirm the effective result again. Existing Match blocks or earlier settings may require the template's documented correction. Do not change a shared server. A failed syntax check is a stop condition.

Choose a unique password for the new `ccnafile` account; it need not have sudo rights. Record it privately. At the VM console, identify the lab NIC:

```bash
ip -br link
```

Use a dedicated lab NIC with no existing address or DHCP profile on this isolated segment. The following example assumes its name is `ens3`. Replace that name with the actual dedicated lab NIC. Do not run these commands on the host computer's working network adapter.

```bash
sudo ip link set ens3 up
sudo ip address add 10.29.0.100/24 dev ens3
ip -br address
sudo sshd -t
sudo ss -lntp
sudo ufw status
sudo -iu ccnafile
```

The address command is temporary and does not require a gateway. `sudo -iu ccnafile` starts a login shell as the transfer user. In that shell, `~` means `/home/ccnafile`; `exit` returns to your previous administrator shell, where `~` again means the administrator's home. Keep the two contexts separate.

Linux file access depends on both **ownership** and **permissions**. In the commands below, `mkdir -p` creates the directory if needed, `chmod 700` grants its owner list/write/traverse access and gives other users none, and `chmod 600` gives a file's owner read/write access and other users none. A file owned by `root` with mode 600 is therefore not readable by the ordinary `ccnafile` account. `ls -l` shows the permissions, owner, group and size; `chown` changes ownership when an administrator needs to correct it. These checks explain a file-permission failure after successful SSH authentication.

As `ccnafile`, create the working directory and test file. `printf` writes the supplied text, `>` creates or replaces only that named file, and `sha512sum` computes its SHA-512 fingerprint:

```bash
mkdir -p ~/ccna-files
chmod 700 ~/ccna-files
printf 'CCNA secure transfer practice\n' > ~/ccna-files/probe.txt
chmod 600 ~/ccna-files/probe.txt
sha512sum ~/ccna-files/probe.txt
exit
```

:::expected
The dedicated NIC has `10.29.0.100/24`. SSH configuration validation produces no error, and a TCP 22 listener exists. The file is 30 bytes including its final newline. If Ubuntu UFW reports active, from the administrator shell permit only the lab client with `sudo ufw allow in on ens3 from 10.29.0.1 to 10.29.0.100 port 22 proto tcp`, substituting the actual lab NIC. For another active firewall, apply its equivalent scoped rule. Do not disable the firewall globally. Keep the VM console open and verify the account can log in locally.
:::

```state
{"status":"Linux SSH server ready","addressed":["R1","SRV1","Linux"],"tone":"ok","focus":["Linux"],"chips":[{"node":"Linux","text":"SSH listening · TCP 22","tone":"ok"}],"rows":[["Lab NIC","10.29.0.100/24"],["sshd -t","No error","ok"],["probe.txt","30 bytes · SHA-512 recorded"],["Transfer account","ccnafile · unprivileged"]]}
```

## Step 10 — Supplied preparation: IOS XE identity and SCP

This block is for a fresh, isolated Catalyst 9300 S1. The `no switchport` command creates the routed port taught in Chapter 11. A virtual router uses its actual Layer 3 port name and omits that command. Do not apply this block over an existing production AAA policy.

The SSH identity and line settings build on Chapter 8. The additional local AAA commands provide the authentication and authorization required by this SCP server:

| Supplied command | Role in this fresh-device setup |
|---|---|
| `aaa new-model` | Enables the authentication, authorization and accounting framework; it does not create an account or central server. |
| `aaa authentication login default local` | Names a login method list `default` and checks the local username database. |
| `aaa authorization exec default local` | Uses local account information for EXEC access and privilege. This is a separate permission decision after authentication. |
| `login authentication default` under each line | Selects that login list for the console or VTY line. |
| `ip scp server enable` | Enables the SCP service after those SSH/AAA dependencies exist. |

The `labbackup` account is created before its method is selected. There is no remote AAA dependency or fallback chain in this block; Chapter 33 teaches those additions. Retain the console while verifying a separate session.

```ios S1
Switch> enable
Switch# configure terminal
Switch(config)# hostname S1
S1(config)# interface gigabitethernet1/0/1
S1(config-if)# no switchport
S1(config-if)# ip address 10.29.0.1 255.255.255.0
S1(config-if)# no shutdown
S1(config-if)# exit
S1(config)# username labbackup privilege 15 secret RouterLab2026!
S1(config)# ip domain name ccna.example
S1(config)# aaa new-model
S1(config)# aaa authentication login default local
S1(config)# aaa authorization exec default local
S1(config)# line console 0
S1(config-line)# login authentication default
S1(config-line)# exit
S1(config)# line vty 0 15
S1(config-line)# login authentication default
S1(config-line)# transport input ssh
S1(config-line)# exit
S1(config)# crypto key generate rsa modulus 2048
S1(config)# ip ssh version 2
S1(config)# ip ssh source-interface gigabitethernet1/0/1
S1(config)# ip scp server enable
S1(config)# end
S1# show ip interface brief
S1# show ip ssh
S1# ping 10.29.0.100
```

Generate keys only on this new device; if it already has keys, inspect and retain the intended key rather than replacing it. Keep the current console session open. Before the first Linux login, read `show ip ssh` **through that trusted console**. In its SECSH public-key section, locate the actual `ssh-rsa` key used by this SSH server. In the Linux administrator shell, use `nano ~/S1-console-key.pub` and the same save/exit keys from Step 9. Copy the key into that file: one line containing `ssh-rsa`, one space, and the complete base64 key. Join wrapped key lines without inserting spaces into the base64 data. Do not copy the label, modulus line, terminal prompt or an example key.

Calculate its fingerprint on Linux:

```bash
ssh-keygen -lf ~/S1-console-key.pub -E sha256
```

The result identifies an RSA public key and a SHA256 fingerprint. `show crypto key mypubkey rsa` alone may display ASN.1 hexadecimal data; that is not directly comparable with OpenSSH's fingerprint. If this release cannot display/export the active SSH public key in a supported comparable format, stop this checkpoint and use its documented trusted key-export procedure.

Now test a separate login:

```bash
ssh labbackup@10.29.0.1
```

Compare the offered **RSA** fingerprint with the locally calculated value before accepting it. An unexpected key type, mismatch or changed-key warning requires investigation through the console; do not bypass the check. Enter the fictional router password only after identity verification.

:::expected
The second session reaches S1 and has the intended privilege. Run `show privilege` there, then `exit`. The verified login records the server key in Linux's known-hosts file for the later SCP connection. If algorithms are incompatible, use a supported current image and inspect both ends' SSH logs; do not globally enable obsolete algorithms or disable host-key checks. If SFTP/SCP commands are unavailable, this environment cannot complete the secure-transfer part.
:::

```state
{"status":"S1 SSH and SCP ready","tone":"ok","focus":["S1","Linux"],"flows":[{"path":["Linux","S1"],"back":true,"label":"ssh labbackup@10.29.0.1","tags":{"Linux":"SSH client"},"backTags":{"S1":"Offers its RSA host key","Linux":"Matches console fingerprint"}},{"path":["Linux","S1"],"label":"Password after key check","tags":{"S1":"Local AAA · privilege 15"}}],"chips":[{"node":"S1","text":"SCP server On","tone":"ok"},{"node":"Linux","text":"SSH listening · TCP 22","tone":"ok"},{"node":"Linux","text":"S1 key in known hosts","from":1}],"rows":[["S1 Gi1/0/1","Routed · 10.29.0.1/24"],["SSH","Version 2 · VTY SSH only"],["Host key","RSA fingerprint verified","ok"],["labbackup","Privilege 15 session","ok"]]}
```

## Step 11 — Pull a configuration backup with classic SCP

On S1, inventory local storage and create a snapshot:

```ios S1
S1# show file systems
S1# copy running-config flash:S1-before.cfg
```

Accept the destination prompt and wait. If this device uses `bootflash:` instead of `flash:`, consistently substitute it. Before using Linux, identify which device is the listening server and whether this pull will write startup-config. Then create a protected local destination and pull the staged file:

```bash
mkdir -p ~/ccna-received
chmod 700 ~/ccna-received
scp -O labbackup@10.29.0.1:flash:S1-before.cfg ~/ccna-received/S1-before.cfg
chmod 600 ~/ccna-received/S1-before.cfg
ls -l ~/ccna-received/S1-before.cfg
```

Inspect the received file privately; do not paste secrets into a shared transcript.

:::expected
The workstation initiates SCP and the Cisco device acts as server. `-O` is deliberate because the cited Cisco server supports classic SCP and OpenSSH 9+ defaults to SFTP. A successful file transfer and readable configuration confirm more than a successful SSH login. The local snapshot and remote backup do not automatically update startup-config.
:::

```state
{"status":"Backup pulled over SCP","tone":"ok","focus":["S1","Linux"],"flows":[{"event":["S1"],"wait":1.6,"tags":{"S1":"Snapshot flash:S1-before.cfg"}},{"path":["Linux","S1"],"back":true,"label":"scp -O … flash:S1-before.cfg","tags":{"Linux":"SCP client · classic (-O)"},"backTags":{"S1":"SCP server · sends file","Linux":"Saved in ~/ccna-received"}}],"chips":[{"node":"S1","text":"SCP server On","tone":"ok"},{"node":"Linux","text":"S1 key in known hosts"}],"rows":[["Client → server","Linux → S1"],["Received","S1-before.cfg · mode 600","ok"],["scp -O","Classic SCP, not SFTP"],["startup-config","Not updated","dim"]]}
```

## Step 12 — Observe rejection of an untrusted SFTP server identity

S1 is now the client; Ubuntu's SSH/SFTP service is the server. Client authentication by password and verification of the **server's identity** are different checks. The documented IOS XE procedure uses a trusted server public key and `ip ssh stricthostkeycheck`; do not assume it offers OpenSSH's interactive acceptance prompt.

On the trusted Ubuntu console, inspect its existing **server** RSA public key, not a user's login key:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_rsa_key.pub -E sha256
awk '{print $1" "$2}' /etc/ssh/ssh_host_rsa_key.pub | fold -w 70
```

Record the fingerprint and retain the complete wrapped public-key text. These are public-key data; never copy the file without the `.pub` suffix.

First verify enforcement on this fresh S1, which has no server public-key entry yet:

```ios S1
S1# configure terminal
S1(config)# ip ssh stricthostkeycheck
S1(config)# end
S1# copy sftp://ccnafile@10.29.0.100//home/ccnafile/ccna-files/probe.txt flash:probe-sftp.txt
```

An initial destination-filename prompt may appear. The SSH connection must then fail server authentication before requesting the account password or transferring a file. If it instead reaches a password prompt, cancel with Ctrl+C: do not enter credentials or count this image as demonstrating authenticated SFTP. Check the exact release's supported client/server-authentication procedure or use a compatible image.

:::expected
Record whether the missing-key attempt was rejected before the account password was sent. No file should be accepted. If the client bypasses the configured check, stop this path and investigate image support; do not label the operation authenticated.
:::

```state
{"status":"Untrusted key rejected","tone":"warn","focus":["S1","Linux"],"flows":[{"path":["S1","Linux"],"back":true,"label":"copy sftp: … probe.txt","tags":{"S1":"SFTP client · strict key check"},"backTags":{"Linux":"Offers its host key"},"backStop":"S1","backStopText":"No trusted server key · rejected"}],"chips":[{"node":"S1","text":"Strict check · no pinned key","tone":"warn"},{"node":"Linux","text":"SSH/SFTP server"}],"rows":[["Client → server","S1 → Linux SFTP"],["Rejected","Before the account password"],["Files accepted","None"]]}
```

## Step 13 — Pin the verified identity and perform the secure copy

Keep the Ubuntu public key and fingerprint collected through its trusted console. Enter that trusted key on S1:

```ios S1
S1# configure terminal
S1(config)# ip ssh pubkey-chain
S1(conf-ssh-pubkey)# server 10.29.0.100
S1(conf-ssh-pubkey-server)# key-string
```

At the `conf-ssh-pubkey-data` prompt, paste **all** of Ubuntu's wrapped `ssh-rsa` public-key text from above, with no shell prompts. Wait for the key text to be entered before continuing:

```ios S1
S1(conf-ssh-pubkey-data)# exit
S1(conf-ssh-pubkey-server)# end
S1# show running-config | section ip ssh
```

Confirm the server-address entry and strict checking. IOS may store the entered key as a hash. Repeat the file operation:

```ios S1
S1# copy sftp://ccnafile@10.29.0.100//home/ccnafile/ccna-files/probe.txt flash:probe-sftp.txt
```

Answer the account-password and destination prompts individually. If server authentication still fails, inspect the trusted key, exact server address and negotiated key type; keep strict checking enabled. Use the matching server public key and documented support for that release, rather than substituting an unverified key.

After completion:

```ios S1
S1# dir flash:probe-sftp.txt
S1# more flash:probe-sftp.txt
S1# verify /sha512 flash:probe-sftp.txt
```

:::expected
The missing-key attempt was rejected before account authentication; the trusted-key attempt succeeds. Record both outcomes. This checks the actual SFTP implementation's enforcement instead of inferring it from a configured command alone.

The file contains `CCNA secure transfer practice` and its SHA-512 matches the server's Step 9 value. On an image without SHA-512 verification, compare MD5 at both ends (`md5sum` on Linux and `verify /md5` on IOS) for this benign transfer exercise and record the limitation. Do not treat MD5 as proof of software authenticity. If the specific release requires interactive `copy sftp: flash:`, supply the same host, user, absolute source path and destination when prompted. An unsupported identity check is a documented lab limitation, not a successful secure-transfer result.
:::

```state
{"status":"Trusted SFTP copy verified","tone":"ok","focus":["S1","Linux"],"flows":[{"event":["S1"],"wait":1.6,"tags":{"S1":"Pin Ubuntu key · 10.29.0.100"}},{"path":["S1","Linux"],"back":true,"label":"SSH to 10.29.0.100","backTags":{"Linux":"Offers its host key","S1":"Matches pinned key"}},{"path":["S1","Linux"],"back":true,"label":"copy sftp: … probe.txt","tags":{"S1":"Password for ccnafile"},"backTags":{"Linux":"Sends probe.txt","S1":"Saved flash:probe-sftp.txt"}}],"chips":[{"node":"S1","text":"Strict check · no pinned key","tone":"warn","until":0},{"node":"S1","text":"Strict check · key pinned","tone":"ok","from":0},{"node":"Linux","text":"SSH/SFTP server"}],"rows":[["Pinned key","server 10.29.0.100","ok"],["probe-sftp.txt","CCNA secure transfer practice","ok"],["SHA-512","Matches Step 9 value","ok"],["Strict checking","Still enabled"]]}
```

## Step 14 — Observe a source-path failure

Attempt a source filename that does not exist:

```ios S1
S1# copy sftp://ccnafile@10.29.0.100//home/ccnafile/ccna-files/missing.txt flash:missing-test.txt
```

Record the error. Check the source directory from Linux's console with `sudo -u ccnafile ls -l /home/ccnafile/ccna-files` before changing any network settings.

:::expected
Authentication may succeed while the file operation fails. The trusted directory contains `probe.txt`, not `missing.txt`, so the source path is the demonstrated fault. Record the actual stage and error before moving on.
:::

```state
{"status":"Source path fault","tone":"bad","focus":["S1","Linux"],"flows":[{"path":["S1","Linux"],"label":"copy sftp: … missing.txt","tags":{"S1":"Requests missing.txt"},"stop":"Linux","stopText":"No missing.txt in ccna-files"}],"chips":[{"node":"S1","text":"Strict check · key pinned","tone":"ok"},{"node":"Linux","text":"SSH/SFTP server"}],"rows":[["Fault","Source path · missing.txt","bad"],["ccna-files holds","probe.txt, not missing.txt"],["Authentication","May still succeed","dim"],["Network settings","Leave unchanged"]]}
```

## Step 15 — Repair only the path and repeat the file operation

Use the existing source and a new destination:

```ios S1
S1# copy sftp://ccnafile@10.29.0.100//home/ccnafile/ccna-files/probe.txt flash:probe-recovered.txt
```

Wait for completion, then inspect `dir flash:probe-recovered.txt` and compute its supported hash.

:::expected
The received file matches the trusted source content and hash. Connectivity, user credentials and the enforced host key did not need changing. The retest is the actual file operation that failed, not just a ping or SSH login.
:::

```state
{"status":"Path fixed · copy works","tone":"ok","focus":["S1","Linux"],"flows":[{"path":["S1","Linux"],"back":true,"label":"copy sftp: … probe.txt","tags":{"S1":"Source corrected · probe.txt"},"backTags":{"Linux":"Sends probe.txt","S1":"Saved flash:probe-recovered.txt"}}],"chips":[{"node":"S1","text":"Strict check · key pinned","tone":"ok"},{"node":"Linux","text":"SSH/SFTP server"}],"rows":[["Repaired","Source path only","ok"],["probe-recovered.txt","Content and hash match","ok"],["Credentials, host key","Unchanged"]]}
```

## Step 16 — Apply the checks to approved software or the worksheet

If you have an authorized Cisco software download for this exact lab platform, place it in `/home/ccnafile/ccna-files` with owner `ccnafile` and read permission for that account. Record its exact filename, size, release compatibility and Cisco-published SHA-512. Check available Cisco storage and keep the working image and package files intact.

Use the Step 13 SFTP operation with the **actual approved filename** as source and destination, or push it from Linux with `scp -O` to the named local Cisco file. Replace only the filename and path, not the protocol's security checks. Compute the stored file's hash and compare with Cisco's published value.

:::expected
A file with the expected size and matching trusted hash is staged, not activated. `show version` still reports the original running software. If no licensed suitable image is available, use the benign file from Step 13 to demonstrate the mechanics and produce the software preflight worksheet; explicitly mark actual software staging as unperformed. Never rename the text file to `.bin` or attempt to boot it.
:::

```state
{"status":"Staged, not activated","focus":["S1"],"chips":[{"node":"S1","text":"Original software running"}],"rows":[["Transfer","SFTP pull or scp -O push"],["Hash","Compare with Cisco SHA-512"],["show version","Original software","ok"],["No approved image","Worksheet · mark unperformed","dim"]]}
```

## Step 17 — Submit separate backup, staging and recovery evidence

Submit this evidence checklist with actual results or an explicit unperformed/paper label for each part:

- Backup: identify current active versus saved source, remote filename, restricted destination access and readable contents.
- Staging: identify client/server roles, trusted server key, source/destination filename, received size/content and source/destination hash comparison.
- Configuration state: show that a staged file did not apply itself; record the merge prediction, observed extra interface and explicit cleanup.
- Recovery: retain the failed source-path evidence and the successful repeat of that operation after the narrow correction.
- Software decision: identify exact model/release, trusted metadata, stored-file verification, current active software and the separate activation boundary.

Record image/version, successful operations, errors and unsupported features. Preserve the secure backup in a restricted directory. Keep the original lab checkpoint and working software. If the lab will be retained, save only the verified intended device configuration:

```ios S1
S1# copy running-config startup-config
```

Accept the destination prompt before doing anything else. Keep the isolated lab available for the independent challenge, then stop it when finished.

:::expected
The record distinguishes a transferred file, a verified file, an applied configuration and active software. No boot setting or image activation was changed by this exercise.
:::

```state
{"status":"Evidence recorded","tone":"ok","focus":["S1"],"chips":[{"node":"S1","text":"Boot and image unchanged","tone":"ok"}],"rows":[["Evidence","Backup, staging, config, recovery, software"],["Save if retained","Verified S1 config only"],["Boot, image","Unchanged","ok"]]}
```

## Troubleshooting

- Timeout with successful ping: inspect the particular transfer service, transport ports, source interface, return path and server logs. ICMP success does not uniquely identify a firewall or service fault.
- FTP login works but file transfer stalls: investigate the separate active/passive data connection and permissions.
- SCP subsystem error with OpenSSH 9+: confirm the Cisco server supports classic SCP, then use `-O`. Authentication and authorization must still work.
- SSH authentication succeeds but file access is denied: check EXEC authorization, device privilege and file/directory permissions.
- SFTP file not found: compare case and absolute path at the server; a working login does not prove the named path exists.
- Hash mismatch: stop before applying or activating anything. Recheck the source identity, expected hash, filename and actual destination bytes.

## Challenge

Use the secure lab's completed baseline. This is a new handover requirement, not another restoration of Loopback29. If the supported environment is unavailable, write the command/verification plan and complete the supplied acceptance worksheet; mark secure execution pending.

**Supplied source preparation:** at the Ubuntu console, become `ccnafile` with `sudo -iu ccnafile` and create a second benign file. This is preparation; it does not answer which copy direction to choose.

```bash
printf 'CCNA handover checkpoint\n' > ~/ccna-files/handover.txt
chmod 600 ~/ccna-files/handover.txt
sha512sum ~/ccna-files/handover.txt
exit
```

Independently complete these requirements before opening the answer:

1. Preserve S1's **current active** configuration off-device as Linux `~/ccna-received/S1-handover.cfg`, using the verified classic SCP service. Do not overwrite startup-config or the earlier backup.
2. Retrieve Ubuntu's `/home/ccnafile/ccna-files/handover.txt` into S1 as `flash:handover-review.txt` through SFTP. Keep existing host-key enforcement. Inspect the destination and compare its complete hash.
3. A draft request incorrectly names `Handover.txt`. Predict which stage will fail on this case-sensitive server and the narrow correction. If trying it live, record failure before retrying.
4. Evaluate these **supplied software candidates**. The plan requires a compatible release for the inventoried model, trusted matching SHA-512 and a separate approved activation:
   - Candidate A is the exact compatible release; its stored hash differs from Cisco's trusted value.
   - Candidate B matches Cisco's trusted hash, but its release documentation targets a different device family.
   State whether either can be accepted for this device. Do not change boot settings.

Submit command choices, destination evidence, file-error/retest results and both acceptance decisions. Passwords and configuration secrets do not belong in a shared submission.

:::solution
For the current configuration, create a new snapshot on S1:

```ios S1
S1# copy running-config flash:S1-handover.cfg
```

Finish its filename prompt first. Then, from Linux, retrieve the named source:

```bash
scp -O labbackup@10.29.0.1:flash:S1-handover.cfg ~/ccna-received/S1-handover.cfg
chmod 600 ~/ccna-received/S1-handover.cfg
ls -l ~/ccna-received/S1-handover.cfg
```

Inspect the received configuration privately and compare it with the intended current snapshot. Neither operation targets startup-config. The distinct filename preserves the earlier backup.

For the benign file, S1 initiates an SFTP download from Ubuntu:

```ios S1
S1# copy sftp://ccnafile@10.29.0.100//home/ccnafile/ccna-files/handover.txt flash:handover-review.txt
```

Complete prompts, then inspect:

```ios S1
S1# dir flash:handover-review.txt
S1# more flash:handover-review.txt
S1# verify /sha512 flash:handover-review.txt
```

The text is `CCNA handover checkpoint` followed by a newline. Compare the whole hash with the trusted Ubuntu result; if the platform supports only the benign MD5 comparison, state that limitation. The file is staged and has not changed active configuration or running software.

The uppercase `Handover.txt` is a file-path error after a working authenticated connection, assuming the earlier service remains healthy. Correct source case to `handover.txt`; do not change the password or disable host-key verification.

Neither software candidate meets all requirements. A fails integrity comparison; B is the wrong platform despite an intact trusted file. Preserve working software, obtain the exact approved compatible candidate and verify it. Even an accepted staged candidate needs a separate approved activation procedure. No reload, replacement or image activation belongs to this challenge.
:::
