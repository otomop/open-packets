---
title: Build and save your first LAN
environment: packet-tracer
devices: ["1 × Catalyst 2960 (S1)", "2 × PC-PT (PC-A, PC-B)"]
minutes: 25
---
Practice revised September 2026. If you completed an earlier version, repeat the revised exercise and update its checkmarks.

Build a small working network, give the switch its intended name, and save your work. The goal is to become comfortable finding the right device window and checking a result. Allow extra time for the initial Packet Tracer download and sign-in.

Use the chapter's official installation guide before starting. The addresses below are supplied settings; you do not need to calculate a subnet yet. Output and interface timing vary by simulator version.

## Topology

Start with a blank project and the listed device models.

```diagram
{"type":"topology","title":"Your first LAN","caption":"Two PCs exchange traffic through one switch; no router or gateway is needed for this local test.","nodes":[{"id":"A","kind":"pc","label":"PC-A","sub":"192.168.10.10/24","x":2,"y":3},{"id":"S","kind":"switch","label":"S1","sub":"2960","x":6,"y":3},{"id":"B","kind":"pc","label":"PC-B","sub":"192.168.10.20/24","x":10,"y":3}],"links":[{"from":"A","to":"S","label":"Copper straight-through","fromLabel":"Fa0","toLabel":"Fa0/1"},{"from":"S","to":"B","label":"Copper straight-through","fromLabel":"Fa0/2","toLabel":"Fa0"}]}
```

| Connection | Cable |
|---|---|
| PC-A FastEthernet0 → S1 FastEthernet0/1 | Copper straight-through |
| PC-B FastEthernet0 → S1 FastEthernet0/2 | Copper straight-through |

| PC | IPv4 address | Mask | Gateway and DNS |
|---|---|---|---|
| PC-A | 192.168.10.10 | 255.255.255.0 | Leave blank |
| PC-B | 192.168.10.20 | 255.255.255.0 | Leave blank |

## Step 1: Place, label and save the project

Place the 2960 and two PC-PT devices. Open each device and change its workspace display name to match the drawing. Find the switch's **CLI** tab and each PC's **Desktop** tab, then return to the workspace.

Create a lab folder and use **File → Save As** to save **00-first-lan.pkt** there. A workspace display name is a label; it does not necessarily set the IOS hostname.

:::expected
You can find all three devices and the saved project file. No communication has been tested yet.
:::

```state
{"status":"Placed · saved","cabled":false,"addressed":false,"focus":["A","S","B"],"rows":[["Display names","PC-A · S1 · PC-B"],["Project file","00-first-lan.pkt"],["Communication","Not tested yet","dim"]]}
```

## Step 2: Cable and address the PCs

Select **Copper Straight-Through**, then click the exact ports from the connection table. On each PC, open **Desktop → IP Configuration**, choose **Static**, and enter its address and mask. Leave gateway and DNS blank.

Read each entry back against the table. Allow the links to initialize in Realtime mode. A brief amber indication while a switch port becomes ready is not a reason to change the addressing.

:::expected
Both cables use the intended switch ports, and the PCs have different addresses with the same supplied mask. These separate PCs need distinct host addresses; reusing the same address on both creates an address conflict. The switch needs no management address for this exchange.
:::

```state
{"status":"Cabled · addressed","cabled":true,"addressed":true,"led":true,"focus":["A","B"],"rows":[["Switch ports","Fa0/1 · Fa0/2, straight-through"],["Mask, both PCs","255.255.255.0"],["Gateway and DNS","Left blank"],["Switch management address","Not needed"]]}
```

## Step 3: Confirm communication

On PC-A, open **Desktop → Command Prompt**:

```text
ping 192.168.10.20
```

Wait for completion. If an initial request times out, repeat once after the links are ready. On PC-B, test the other direction:

```text
ping 192.168.10.10
```

:::expected
Both PCs receive replies on the repeated tests. Record the source, destination and result, for example: “PC-A to 192.168.10.20: replies received.” These tests establish this communication at this time; they do not test an Internet connection.
:::

```state
{"status":"Replies received","tone":"ok","cabled":true,"addressed":true,"focus":["A","B"],"flows":[{"path":["A","S","B"],"back":true,"label":"PC-A pings 192.168.10.20","tags":{"A":"ping 192.168.10.20","S":"Forwards · needs no mgmt address"},"backTags":{"A":"Replies received"}},{"path":["B","S","A"],"back":true,"label":"PC-B pings 192.168.10.10","tags":{"B":"ping 192.168.10.10"},"backTags":{"B":"Replies received"}}],"rows":[["PC-A to 192.168.10.20","Replies received","ok"],["PC-B to 192.168.10.10","Replies received","ok"],["Internet connection","Not tested by these pings","dim"]]}
```

## Step 4: Read the prompt and inspect a naming mistake

Open S1's CLI. If the initial configuration dialog appears, answer **no**. Press Enter to reach the prompt. Type the commands after the displayed prompts, one line at a time. The temporary name below is a deliberate, harmless mistake: the required name is **S1**.

```ios S1
Switch> enable
Switch# configure terminal
Switch(config)# hostname TEMP
TEMP(config)# end
TEMP# show running-config
```

If the display pauses at **--More--**, Space advances a page and **q** stops the remaining display. Find the hostname line. At the returned `TEMP#` prompt, try `show ?` to see the available next keywords; clear the unfinished input with Backspace. Help does not execute the command.

:::expected
The CLI now says TEMP, and running configuration contains `hostname TEMP`. This is the active device setting. The workspace label may still say S1, so the label alone did not prove that configuration was correct. Leave the mistake in place until the next step.
:::

```state
{"status":"Deliberate mistake","tone":"warn","cabled":true,"addressed":true,"focus":["S"],"prompt":{"node":"S","text":"TEMP#","tone":"warn"},"rows":[["CLI prompt","TEMP#","warn"],["Running configuration","hostname TEMP","warn"],["Workspace label","May still say S1"]]}
```

## Step 5: Correct the name and check it

The requirement is S1. Correct that one setting:

```ios S1
TEMP# configure terminal
TEMP(config)# hostname S1
S1(config)# end
S1# show running-config
```

:::expected
The prompt and active hostname now both say S1. You corrected the configuration without changing cables, PC addresses or restarting the switch. The setting is active; saving is a separate action.
:::

```state
{"status":"Active · not saved","cabled":true,"addressed":true,"focus":["S"],"prompt":{"node":"S","text":"S1#","tone":"ok"},"rows":[["CLI prompt","S1#","ok"],["Running configuration","hostname S1","ok"],["Saved","Not yet · a separate action","dim"]]}
```

## Step 6: Save and inspect the saved setting

```ios S1
S1# copy running-config startup-config
```

At `Destination filename [startup-config]?`, press Enter to accept the suggested destination. Wait until the copy finishes and the EXEC prompt returns. Then enter:

```ios S1
S1# show startup-config
```

:::expected
The saved configuration contains `hostname S1`. A copy-completed message is useful, but inspecting the required setting establishes what was saved. The wording of the completion message can vary.
:::

```state
{"status":"Saved","tone":"ok","cabled":true,"addressed":true,"focus":["S"],"prompt":{"node":"S","text":"S1#","tone":"ok"},"rows":[["Running configuration","hostname S1","ok"],["Startup configuration","hostname S1","ok"]]}
```

## Step 7: Leave a working checkpoint

Repeat PC-A's ping to PC-B. Save the project as **00-first-lan-complete.pkt**. Record its location and the saved hostname in your notes. If you use this app's progress export, keep that file with your study backups; it is separate from the network project.

:::expected
Your checkpoint contains a working two-PC network and the saved switch hostname S1. You can distinguish the active configuration, the device's startup configuration, the .pkt project and your study-progress backup.
:::

```state
{"status":"Checkpoint","tone":"ok","cabled":true,"addressed":true,"focus":["A","S","B"],"prompt":{"node":"S","text":"S1#","tone":"ok"},"flows":[{"path":["A","S","B"],"back":true,"label":"PC-A repeats its ping to PC-B","tags":{"A":"ping 192.168.10.20"},"backTags":{"A":"Replies received"}}],"rows":[["Project file","00-first-lan-complete.pkt"],["Saved hostname","S1","ok"],["PC-A to PC-B","Replies received","ok"]]}
```

## Troubleshooting

| Symptom | First check |
|---|---|
| Persistent ping failure | Compare both PC entries with the table; inspect the two cable endpoints and link readiness. |
| A CLI command is rejected | Read the device prompt. Use `enable` from `>` before the privileged commands shown here. Check spelling and context help. |
| Output appears stuck | Look for `--More--`. Use the pager keys; do not restart the device. |
| The CLI still says TEMP | Correct the IOS hostname in configuration mode; the workspace label is separate. |
| Startup configuration is absent or has the wrong name | Check the active name, copy in the running-to-startup direction, then inspect startup configuration again. |

## Challenge

With the instructions closed, add PC-C on S1 FastEthernet0/3 using copper straight-through. Give it **192.168.10.30**, mask **255.255.255.0**, with gateway and DNS blank. Test it against both existing PCs and save a separate **00-first-lan-challenge.pkt** file.

Keep three pieces of evidence: the new cable endpoints, PC-C's address settings, and the results of its two tests.

:::solution
PC-C receives replies from 192.168.10.10 and 192.168.10.20 after the link is ready. Its address is distinct from the other PCs. No router or switch management address is needed. Completion means the settings and tests agree with the requirements, not just that three device icons appear.
:::
