---
title: Back up configurations, stage an image and recover a password
environment: packet-tracer
devices: ["1 × ISR 2911 (R1)", "1 × Catalyst 2960 (SW1)", "1 × Server-PT (SRV1)"]
minutes: 60
---
Practice revised November 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks. **Steps 1–9 are the core and take about 60 minutes in Packet Tracer:** inspect file systems, back up and restore a configuration with TFTP and FTP, copy an image, set `boot system`, and use the configuration register to recover a password. **Step 10 is an optional 15-minute extension** on SCP and SFTP. Packet Tracer does not run either protocol, so you read real output and answer questions about it.

Before each copy, write its source, destination, client, server and expected effect on running-config and startup-config. After it, verify the destination rather than trusting the success message.

## Topology

```diagram
{"type":"topology","title":"One router, one switch and a file server","caption":"R1 is the TFTP and FTP client; SRV1 runs both servers.","nodes":[{"id":"R1","kind":"router","label":"R1","sub":"10.29.0.1/24","x":1,"y":1},{"id":"SW1","kind":"switch","label":"SW1","sub":"VLAN 1","x":5.5,"y":1},{"id":"SRV1","kind":"server","label":"SRV1","sub":"10.29.0.100/24","x":10,"y":1}],"links":[{"from":"R1","to":"SW1","fromLabel":"Gi0/0","toLabel":"Fa0/1"},{"from":"SW1","to":"SRV1","fromLabel":"Fa0/2","toLabel":"Fa0"}]}
```

Use **Packet Tracer** with one ISR 2911 R1, one 2960 SW1 and Server-PT SRV1. Connect R1 Gi0/0 to SW1 Fa0/1 and SRV1 Fa0 to SW1 Fa0/2 with copper straight-through cables. Use default VLAN 1. R1 is `10.29.0.1/24`; SRV1 is `10.29.0.100/24`, gateway `10.29.0.1`. No default route is required. Every password in this lab is a fictional lab value.

## Step 1: Build the baseline

On SRV1 Desktop → IP Configuration, set the static address, mask `255.255.255.0` and gateway from the topology. On R1, decline the initial setup dialog if presented:

```ios R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# enable secret FileLab29
R1(config)# interface gigabitethernet0/0
R1(config-if)# ip address 10.29.0.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# end
R1# ping 10.29.0.100
R1# copy running-config startup-config
```

Accept the destination filename with Enter. Save the project as `files-baseline.pkt` and continue in `files-working.pkt`.

:::expected
Gi0/0 is up/up and the ping succeeds after the first reply is lost to ARP. The saved startup-config now contains the hostname, the interface address and an enable secret hash. Step 9 uses that secret.
:::

```state
{"status":"Baseline reachable","addressed":["R1","SRV1"],"tone":"ok","wake":["SW1"],"focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"back":true,"label":"Ping 10.29.0.100","tags":{"R1":"Same subnet · no default route"}}],"chips":[{"node":"R1","text":"R1#"}],"rows":[["R1 Gi0/0","10.29.0.1/24 · up/up","ok"],["SRV1","10.29.0.100/24 · gw 10.29.0.1"],["startup-config","Saved · enable secret set","ok"]]}
```

## Step 2: Inspect the file systems and the running image

```ios R1
R1# show file systems
R1# dir flash:
R1# show version
```

Record three things: the prefix marked `*` as the default file system, the free bytes in `flash:`, and the image filename and configuration register that `show version` reports.

:::expected
`flash:` is a disk with read-write flags, `nvram:` holds startup-config, and `tftp:` and `ftp:` appear as network prefixes with no size. `dir flash:` lists one `c2900-universalk9…bin` image. `show version` names the same file under "System image file is" and ends with `Configuration register is 0x2102`.
:::

```state
{"status":"Storage inspected","addressed":["R1","SRV1"],"focus":["R1"],"chips":[{"node":"R1","text":"R1#"}],"rows":[["Default file system","flash:"],["Record","Free bytes · image file"],["Config register","0x2102","ok"]]}
```

## Step 3: Back up the configuration with TFTP

In SRV1 → Services → TFTP, confirm the service is on. On R1:

```ios R1
R1# copy running-config tftp:
```

At the prompts, enter host `10.29.0.100` and destination `R1-before.cfg`. Answer each prompt on its own; do not paste the answers as commands.

:::expected
R1 prints `!!` and a byte count, and SRV1's TFTP file list now includes `R1-before.cfg`. R1 was the client sending the file; SRV1 was the server. Startup-config did not change. TFTP has no login and no encryption, so use it only on a trusted management network.
:::

```state
{"status":"Backup on SRV1","addressed":["R1","SRV1"],"tone":"ok","focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"label":"copy running-config tftp:","tags":{"R1":"Client · sends running-config","SRV1":"Stores R1-before.cfg"}}],"chips":[{"node":"R1","text":"R1#"},{"node":"SRV1","text":"TFTP On","tone":"ok"}],"rows":[["SRV1 file list","R1-before.cfg","ok"],["startup-config","Unchanged","dim"],["Encryption","None"]]}
```

## Step 4: Restore from TFTP and observe a merge

The backup contains `hostname R1` and says nothing about Loopback29. You will change the hostname, add Loopback29, then copy the backup into running-config. Predict whether each change survives before you run the block.

:::solution
The hostname returns to R1 because the file contains a hostname command. Loopback29 stays, because copying into running-config merges commands; it does not remove settings the file does not mention.
:::

```ios R1
R1# configure terminal
R1(config)# hostname R1-TEMP
R1-TEMP(config)# interface loopback29
R1-TEMP(config-if)# description TEMPORARY_MERGE_TEST
R1-TEMP(config-if)# end
R1-TEMP# copy tftp: running-config
```

Enter host `10.29.0.100`, source `R1-before.cfg`, and accept `running-config` as the destination. Then:

```ios R1
R1# show ip interface brief
R1# configure terminal
R1(config)# no interface loopback29
R1(config)# end
R1# show ip interface brief
```

:::expected
The prompt changes back to `R1#`, and Loopback29 is still listed until you remove it by hand. A successful transfer and a restored hostname do not prove the device now matches the backup exactly.
:::

```state
{"status":"Merge kept Loopback29","addressed":["R1","SRV1"],"tone":"warn","focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"back":true,"label":"copy tftp: running-config","tags":{"R1":"Requests R1-before.cfg"},"backTags":{"SRV1":"Sends R1-before.cfg","R1":"Merges into running-config"}},{"event":["R1"],"tags":{"R1":"no interface loopback29"}}],"chips":[{"node":"R1","text":"R1-TEMP#","tone":"warn","until":0},{"node":"R1","text":"R1#","from":0},{"node":"R1","text":"Loopback29 present","tone":"warn","until":1}],"rows":[["Hostname","R1-TEMP → R1 · in file","ok"],["Loopback29","Kept by merge · removed by hand","warn"],["Operation","Merge, not replacement"]]}
```

## Step 5: Back up with FTP and meet an authentication fault

In SRV1 → Services → FTP, confirm FTP is on and add user `filelab`, password `FileLab2026!`, with Write, Read and List permissions. Click Add. Then configure R1's FTP client with a wrong password:

```ios R1
R1# configure terminal
R1(config)# ip ftp username filelab
R1(config)# ip ftp password WrongLabPassword
R1(config)# end
R1# copy running-config ftp:
```

Enter host `10.29.0.100` and destination `R1-ftp.cfg`.

:::expected
The copy fails with a login error, and `R1-ftp.cfg` does not appear on SRV1. Ping still works, so the fault is in authentication, not in IP connectivity. The `ip ftp` commands set the credentials R1 uses as an FTP client; they do not make R1 an FTP server.
:::

```state
{"status":"FTP login rejected","addressed":["R1","SRV1"],"tone":"bad","focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"label":"copy running-config ftp:","tags":{"R1":"FTP client · user filelab"},"stop":"SRV1","stopText":"Login rejected · wrong password"}],"chips":[{"node":"R1","text":"R1#"},{"node":"SRV1","text":"FTP On · filelab","tone":"ok"},{"node":"R1","text":"ip ftp password wrong","tone":"bad"}],"rows":[["R1 client password","Wrong","bad"],["R1-ftp.cfg","Not created","bad"],["IP connectivity","Works","dim"]]}
```

## Step 6: Repair FTP and verify the destination

```ios R1
R1# configure terminal
R1(config)# ip ftp password FileLab2026!
R1(config)# end
R1# copy running-config ftp:
```

Use the same host and filename. Check SRV1's FTP file list, then run `show running-config | include ftp`.

:::expected
The copy succeeds and `R1-ftp.cfg` appears on SRV1. The running configuration shows the FTP password, so it is also inside the backup you just sent. FTP sends that password and the file in clear text over TCP 21 and a separate data connection.
:::

```state
{"status":"FTP backup stored","addressed":["R1","SRV1"],"tone":"ok","focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"label":"FTP control · login","tags":{"R1":"Client · user filelab","SRV1":"Login accepted"}},{"path":["R1","SW1","SRV1"],"tone":"alt","label":"FTP data · R1-ftp.cfg","tags":{"SRV1":"Stores R1-ftp.cfg"}}],"chips":[{"node":"R1","text":"R1#"},{"node":"SRV1","text":"FTP On · filelab","tone":"ok"},{"node":"R1","text":"ip ftp password fixed","tone":"ok"}],"rows":[["SRV1 file list","R1-ftp.cfg","ok"],["Control and data","Separate TCP connections"],["Backup contains","The FTP password"]]}
```

## Step 7: Copy a new image into flash

In SRV1 → Services → TFTP, find a `c2900-universalk9` image whose name differs from the one `show version` reported, such as `c2900-universalk9-mz.SPA.155-3.M4a.bin`. Copy its exact name. Compare the free bytes you recorded in Step 2 with the image size before copying.

```ios R1
R1# copy tftp: flash:
```

Enter host `10.29.0.100`, the image name as the source, and accept the same name as the destination. The copy takes longer than a configuration file. Then:

```ios R1
R1# dir flash:
R1# show version
```

:::expected
`dir flash:` lists both images, and free space has dropped by the size of the new one. `show version` still reports the original image: copying a file to flash does not activate it. On real equipment you would also run `verify /sha512 flash:FILENAME` and compare the result with the hash Cisco publishes for that download.
:::

```state
{"status":"Image staged, not running","addressed":["R1","SRV1"],"tone":"ok","focus":["R1","SRV1"],"flows":[{"path":["R1","SW1","SRV1"],"back":true,"label":"copy tftp: flash:","tags":{"R1":"Requests the 15.5 image"},"backTags":{"SRV1":"Sends the image","R1":"Writes flash:"}}],"chips":[{"node":"R1","text":"R1#"},{"node":"SRV1","text":"TFTP On","tone":"ok"}],"rows":[["flash:","Two images","ok"],["Running image","Still the original","dim"]]}
```

## Step 8: Boot the new image with boot system

Without a `boot system` command, R1 loads the first image it finds in flash. Name the new image explicitly, save, and reload:

```ios R1
R1# configure terminal
R1(config)# boot system flash:c2900-universalk9-mz.SPA.155-3.M4a.bin
R1(config)# end
R1# show running-config | include boot
R1# copy running-config startup-config
R1# reload
```

Use the exact filename you copied in Step 7. Confirm the reload. After R1 starts, log in with the enable secret and run `show version`.

:::expected
`show running-config` shows the `boot system` line, and after the reload `show version` reports the new image file and its release. The configuration survived because you saved it before reloading. If `boot system` names a file that is not in flash, the router tries the next boot source, which is why you check `dir flash:` first.
:::

```state
{"status":"New image running","addressed":["R1","SRV1"],"tone":"ok","focus":["R1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"Reload · boot system flash:…155-3"}}],"chips":[{"node":"R1","text":"R1#"}],"rows":[["boot system","New image file","ok"],["show version","New release","ok"],["Configuration","Saved before reload","ok"]]}
```

## Step 9: Recover a lost enable password with the configuration register

Pretend nobody knows the enable secret. On a real router you reach ROMMON by sending a break during startup, set `confreg 0x2142` and type `reset`. Because you are already logged in, set the same value from IOS; everything after the break is identical:

```ios R1
R1# configure terminal
R1(config)# config-register 0x2142
R1(config)# end
R1# show version
R1# reload
```

Do not save if asked. When R1 restarts, answer `no` to the setup dialog, then:

```ios R1
Router> enable
Router# show startup-config
Router# copy startup-config running-config
R1# configure terminal
R1(config)# enable secret Recovered29
R1(config)# interface gigabitethernet0/0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# config-register 0x2102
R1(config)# end
R1# copy running-config startup-config
R1# show version
R1# ping 10.29.0.100
```

Accept `running-config` as the destination of the first copy.

:::expected
Before the reload, `show version` ends with `0x2102 (will be 0x2142 at next reload)`. With 0x2142 the router ignores startup-config, so it boots as `Router` and `enable` asks for no password, yet `show startup-config` still holds the full saved configuration. Copying it into running-config restores the hostname and old secret, but Gi0/0 stays administratively down until you enter `no shutdown`, because the saved file has no `no shutdown` line to merge. After the new secret is saved, `show version` ends with `0x2142 (will be 0x2102 at next reload)`, so the next restart loads startup-config normally. Save `files-complete.pkt`.
:::

```state
{"status":"Password recovered","addressed":["R1","SRV1"],"tone":"ok","focus":["R1","SRV1"],"flows":[{"event":["R1"],"wait":1.6,"tags":{"R1":"0x2142 · startup-config ignored"}},{"event":["R1"],"tags":{"R1":"startup → running · new secret"}},{"path":["R1","SW1","SRV1"],"back":true,"label":"Ping 10.29.0.100"}],"chips":[{"node":"R1","text":"Router#","tone":"warn","until":0},{"node":"R1","text":"R1#","from":1}],"rows":[["0x2142","Ignore startup-config at boot"],["Gi0/0","Needs no shutdown after the merge","warn"],["Next reload","0x2102 · normal start","ok"]]}
```

## Step 10: Extension: Read an SCP and an SFTP transfer

Packet Tracer does not run SCP or SFTP. Read these exhibits from a Catalyst 9300 (`S1`, `10.29.0.1`) and an Ubuntu workstation (`10.29.0.100`), then answer the questions.

Exhibit A. S1 runs SSH, `ip scp server enable`, and has a privilege-15 user `labbackup`. On the workstation, which runs OpenSSH 9.6:

```output
$ scp labbackup@10.29.0.1:flash:S1-before.cfg ./
(labbackup@10.29.0.1) Password:
subsystem request failed on channel 0
scp: Connection closed
$ scp -O labbackup@10.29.0.1:flash:S1-before.cfg ./
(labbackup@10.29.0.1) Password:
S1-before.cfg                         100% 4120   402.3KB/s   00:00
```

Exhibit B. On S1:

```output
S1# copy sftp://ccnafile@10.29.0.100/probe.txt flash:probe-sftp.txt
Destination filename [probe-sftp.txt]?
Password:
!
30 bytes copied in 1.214 secs (25 bytes/sec)
S1# verify /sha512 flash:probe-sftp.txt
verify /sha512 (flash:probe-sftp.txt) = 9b1c…e04a
```

1. In Exhibit A, which device is the client and which is the server?
2. Why did the first command fail after the password was accepted, and what does `-O` change?
3. In Exhibit B, which device is the client, and which device is the SFTP server?
4. Did either transfer change S1's running-config or startup-config?
5. What must you compare the `verify` value with before trusting the file?

:::expected
1. The workstation is the SCP client and S1 is the SCP server.
2. OpenSSH 9.0 and later run SFTP underneath `scp`, and the IOS SCP server does not offer the SFTP subsystem, so the request failed after login. `-O` makes `scp` use the original SCP protocol. Both attempts were encrypted by SSH.
3. S1 is the SFTP client. The Ubuntu workstation is the server; a Catalyst 9300 cannot act as an SFTP server.
4. No. Exhibit A read a file from flash, and Exhibit B wrote a new file to flash. Neither destination is running-config or startup-config.
5. A SHA-512 value obtained by a trusted route: for this text file, `sha512sum probe.txt` on the server; for software, the hash on Cisco's download page.
:::

## Troubleshooting

- Copy times out although ping works: check that the TFTP or FTP service is on in SRV1 → Services. A ping tests ICMP, not the transfer service.
- FTP login rejected: compare `ip ftp username` and `ip ftp password` on R1 with the account on SRV1, including case.
- Hostname restored but extra settings remain: copying into running-config merges. Remove the extra settings explicitly.
- Router boots the old image: check the `boot system` filename against `dir flash:` and confirm you saved before reloading.
- Router boots as `Router` with an empty configuration although startup-config exists: `show version` shows the configuration register is 0x2142. Set 0x2102 and save.
- Interfaces down after `copy startup-config running-config`: enter `no shutdown` on each interface you need.

## Challenge

Start from `files-complete.pkt`. Plan each answer first, then check it in Packet Tracer.

1. Save a second FTP backup of R1's current configuration as `R1-after.cfg` without overwriting `R1-ftp.cfg`. Which command and which prompt answers?
2. A colleague wants `R1-before.cfg` from SRV1 to become R1's saved configuration, without changing what R1 is running now. Which command does that, and when would the file take effect?
3. A router reports `Configuration register is 0x2142` and comes up as `Router` after every power cut, although `show startup-config` looks correct. Explain the cause and the fix.
4. Which `show` command proves which image R1 is running, and why is `dir flash:` not enough?

:::solution
1. `copy running-config ftp:`, host `10.29.0.100`, destination `R1-after.cfg`. The existing `ip ftp` credentials are used. A new name keeps the earlier backup.
2. `copy tftp: startup-config`, host `10.29.0.100`, source `R1-before.cfg`. It replaces the saved file only; running-config is unchanged until the next reload, when R1 loads it. Saving running-config before then would overwrite it again.
3. 0x2142 tells the router to ignore startup-config at boot; someone left it set after a password recovery. Enter `config-register 0x2102`, then `copy startup-config running-config` if you need the saved configuration now, and confirm `show version` shows 0x2102 for the next reload.
4. `show version`, which names the system image file loaded at boot. `dir flash:` lists every stored image, including ones that are staged but not running.
:::
