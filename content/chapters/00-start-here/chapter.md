---
id: start-here
number: 0
title: Start here
subtitle: Choose your exam track, prepare your lab, and learn a reliable configuration workflow.
part: start
domain: none
minutes: { lesson: 45, lab: 25 }
summary: Set up Packet Tracer, build a first LAN, navigate Cisco IOS, and distinguish the active configuration, the saved configuration, and the lab project. Establish a repeatable method for studying and verifying your work.
objectives:
  v1: []
  v2: []
prereqs: []
sources:
  - { title: "Cisco: CCNA exam", url: "https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html" }
  - { title: "Cisco: Stay on track before the CCNA refresh", url: "https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh" }
  - { title: "Cisco: CCNA v1.1 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: CCNA v2.0 exam topics", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "Cisco Networking Academy: Packet Tracer download and installation instructions", url: "https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf" }
  - { title: "Cisco: Using the Cisco IOS command-line interface", url: "https://www.cisco.com/c/en/us/td/docs/ios/fundamentals/configuration/guide/12_2sr/cf_12_2sr_book/cf_cli-basics.html" }
  - { title: "Cisco: Managing configuration files", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/system-management/system-management/m_cm-config-files-0.html" }
  - { title: "RFC 5227: IPv4 address conflicts on a link", url: "https://www.rfc-editor.org/rfc/rfc5227.html" }
---

Network work depends on a few habits that are worth establishing from the start: know which device you are changing, understand what the change should accomplish, and verify the result. A command being accepted is only one part of that process.

This chapter prepares your study environment and introduces those habits. By the end, you should be able to build a small LAN in Packet Tracer, move confidently between Cisco IOS command modes, and preserve a working configuration. You do not need to understand every field in the output yet. Addressing, switching, and packet forwarding are developed in the following chapters.

The first practical pass is deliberately small: build a working LAN, correct a device name, and save it. Later CLI and reload examples remain reference material; they are not all required tasks in the opening lab.

For this first build, a **local-area network (LAN)** connects nearby devices. A **switch** joins the PCs through its network ports. **Ethernet** is the wired networking technology used here; it carries units of data called **frames**. Each PC receives a distinct **IPv4 address**, such as `192.168.10.10`, and a **subnet mask** that describes its local IP network. Copy the supplied values for now. Chapter 01 explains delivery, and Chapter 04 teaches you to calculate the address ranges yourself.

A **default gateway** is the local router used to reach other networks; a **DNS server** answers name lookups, such as finding an address for a website name. Neither is needed for this first same-LAN test by numeric address. The `ping` command sends diagnostic requests and reports whether replies return. Those messages use **ICMP**, the Internet Control Message Protocol. Receiving a reply tests that exchange, rather than every application on the destination.

## Which exam you are sitting

Cisco's published exam topics are the scope reference for this course. They describe the knowledge and skills that can be assessed; they are not a list of actual exam questions. Read the topic list alongside your study plan, and pay attention to the verb at the start of each objective.

As checked on **19 September 2026**, the current exam is **CCNA 200-301 v1.1**, with a duration of **120 minutes**. Cisco states that **2 February 2027** is the last testing day for v1.1 and that **v2.0 begins on 3 February 2027**. Select the track that matches your planned exam date. Recheck Cisco's exam page before booking, especially if your date changes.

| Exam track | Published domains and weights |
|---|---|
| v1.1 | Network Fundamentals 20%; Network Access 20%; IP Connectivity 25%; IP Services 10%; Security Fundamentals 15%; Automation and Programmability 10% |
| v2.0 | Network Infrastructure and Connectivity 25%; Switching and Network Access 25%; IP Routing 20%; Network Services and Security 20%; AI, Network Operations, and Management 10% |

The weights help you allocate study time; they do not justify skipping a domain or predict the exact questions on an individual exam. Both versions require a working understanding of addressing, forwarding, device configuration, and verification. The first eight chapters establish that foundation.

| Objective wording | What your study should enable you to do |
|---|---|
| Describe or explain | Explain a function accurately and relate it to a practical example. |
| Compare | Identify meaningful differences and choose an appropriate option for a stated requirement. |
| Configure and verify | Translate requirements into a configuration, then prove that the intended behavior occurs. |
| Troubleshoot | Interpret evidence, identify the cause, make an appropriate correction, and test again. |

A multiple-choice score alone does not demonstrate all four skills. Use the labs and output interpretation exercises as part of your preparation. Cisco may assess practical skills as well as conceptual knowledge. Use its current exam guidance for the delivery format and test-day rules; this course does not assume a fixed question count, passing score, or placement of practical items.

:::note
This opening chapter teaches prerequisite skills rather than a separate exam domain. Foundation chapters remain part of your study path even when a blueprint does not name a concept, such as the OSI model, as its own objective. Coverage tags identify relevant objectives; they do not certify complete mastery of an objective.
:::

## Install Packet Tracer and learn its workspace

**Cisco Packet Tracer** is a network simulator. It lets you build a topology, configure simulated devices, and inspect selected protocol events without buying equipment. It implements a subset of device features and commands. A command supported on a physical Catalyst switch or a current IOS XE router may be unavailable or behave differently in a particular Packet Tracer device.

Use the software version and operating-system requirements currently listed in the [Networking Academy Resource Hub](https://www.netacad.com/resources/lab-downloads). Cisco provides desktop installation packages for supported Windows, macOS, and Linux systems. Do not use an unofficial download or assume that an old course's version number is a current requirement.

1. Sign in to Cisco Networking Academy, creating an account if needed, and open the Resource Hub's lab downloads.
2. Select the Packet Tracer package for your operating system. Follow Cisco's installation instructions and the installer prompts. On Windows, run the downloaded installer; on macOS, open the downloaded disk image and installer package. For the Ubuntu package, use the package-installation command in Cisco's guide with your actual downloaded filename.
3. Start Packet Tracer and complete its sign-in flow. If authentication opens in a browser, finish there and return to the application.
4. Create a folder for your exercises, with a separate project file for each chapter. Save this chapter as **00-first-lan.pkt**.
5. Open a blank project and locate the device palette, connection tools, device configuration windows, and the Realtime/Simulation controls.

The first labs use devices within a local simulated topology. You do not need Packet Tracer's multiuser server features for them. If asked about enabling multiuser services or allowing inbound connections, those features are optional for this exercise; the application may still need Internet access for download and sign-in.

| Workspace feature | How you will use it |
|---|---|
| Logical workspace | Place devices and see how they connect. |
| Device palette | Select routers, switches, PCs, and other supported models. |
| Connections | Choose a cable and its ports. Inspect the endpoints rather than relying only on the cable's appearance. |
| Device window | Open a router or switch CLI, or a PC's IP Configuration and Command Prompt. |
| Realtime mode | Let the simulation run normally while you configure and test. |
| Simulation mode | Filter events and advance through selected packet exchanges. |
| Save / Save As | Preserve the topology as a Packet Tracer project. |

For the first lab, use a **2960 switch** and two **PC-PT** devices. The lab specifies the ports so you can compare your work with its output. If you choose another model, inspect its interface names and adjust the instructions consistently. A router's GigabitEthernet0/0 is not interchangeable with a switch's FastEthernet0/1 simply because both are Ethernet ports.

Link indicators are useful observations, but they are not a complete diagnosis. A port may take time to become ready because of link negotiation or spanning tree. A red link can have several causes, including a disconnected cable, the wrong port, an incompatible connection, or an administratively disabled interface. Later chapters show how to distinguish these causes.

## The command line: modes, help and the pager

Cisco IOS uses command modes to separate monitoring from configuration. The **prompt** shows the device name and current mode. Read it before entering a command, particularly when switching between several devices.

| Prompt example | Mode | Common work |
|---|---|---|
| Switch> | User EXEC | Limited monitoring; enter privileged EXEC with `enable`. |
| Switch# | Privileged EXEC | Run verification commands, save configurations, and enter configuration mode. |
| Switch(config)# | Global configuration | Change device-wide settings or enter a more specific configuration mode. |
| Switch(config-if)# | Interface configuration | Change the selected interface. |
| Switch(config-line)# | Line configuration | Configure console or remote terminal lines; covered later. |

This sequence names a new switch. The prompts are shown for orientation; type only the commands after them.

```ios S1
Switch> enable
Switch# configure terminal
Switch(config)# hostname S1
S1(config)# interface FastEthernet0/1
S1(config-if)# exit
S1(config)# end
S1#
```

`exit` moves out of the current configuration level. From interface configuration it returns to global configuration. `end`, or the usual Ctrl+Z shortcut, returns from configuration mode to privileged EXEC. From EXEC, `exit` can end a session, so it is not a universal synonym for “go back.”

IOS provides **context-sensitive help**. Enter `?` to see choices at the current position; it does not execute the command. Compare `show ?`, which lists possible next keywords, with `show ip ?`, which narrows the list. A help response containing `<cr>` indicates that pressing Enter can complete the command at that point.

You may abbreviate a command when the entered characters identify it uniquely. For example, `conf t` commonly resolves to `configure terminal`. The full form is used in explanations so its meaning remains clear. An abbreviation accepted on one software image may be ambiguous on another.

| Message or behavior | What to check |
|---|---|
| Invalid input with a caret | Check the mode, spelling, position of the caret, and whether this platform supports the command. |
| Incomplete command | The command needs another argument. Use a space followed by `?`. |
| Ambiguous command | Supply more characters to distinguish the possible commands. |
| --More-- | Output has paused at the pager. Space advances a page; Enter advances a line; `q` normally stops the display. |

On images that support it, `terminal length 0` disables paging for the current terminal session. It is a convenience, not a prerequisite: use the pager if your simulated device does not implement it. Similarly, common IOS output filters such as `show running-config | include hostname` help find a line, but filtered output can hide context. Read the complete relevant section before making a diagnosis.

From configuration mode, the supported `do` form lets you run common EXEC verification commands without leaving that mode:

```ios S1
S1(config)# do show ip interface brief
S1(config)# end
S1# show running-config
```

## Saving, reloading and the domain-lookup trap

The **running configuration** is the active configuration. The **startup configuration** is the saved configuration used at startup. On the classic IOS devices used in these introductory labs, running configuration is held in RAM and startup configuration is conventionally stored in NVRAM. Storage implementation varies across platforms; the operational distinction is active versus saved.

The configuration commands in this lab take effect when accepted. Leaving configuration mode does not save them. Use the direction of the copy command to check your intent:

```ios S1
S1# copy running-config startup-config
```

Representative response:

```output Save confirmation
Destination filename [startup-config]?
Building configuration...
[OK]
```

At the destination prompt, Enter accepts the name in brackets. Then inspect `show startup-config` and confirm that the intended setting appears. `write memory` is a common alternative save command on these devices; learning the full copy command makes the source and destination explicit.

:::trap
`copy startup-config running-config` is the opposite direction. On conventional IOS it merges saved commands into the active configuration; it is not a general “undo everything” operation. Do not use it as a substitute for understanding which setting must be corrected.
:::

A reload restarts the device and interrupts its operation. Practice it only on the isolated lab device. If the running configuration differs from startup configuration, IOS may ask whether to save the changes. The answer changes what you will see after the restart. Read the prompt rather than pressing Enter through it.

There are three separate things to preserve:

| Item | How to preserve it | What it represents |
|---|---|---|
| Device startup configuration | `copy running-config startup-config` | Configuration the simulated device uses when it starts. |
| Packet Tracer project | Save the .pkt file | Your topology and the project state stored by Packet Tracer. |
| Course progress | Use the app's progress export/backup feature | Your study records in this browser profile. |

Saving the project is not a replacement for practicing the device's save procedure. Saving a device also does not export your study history. Keep working project files and progress backups somewhere you can find them again.

Another common surprise occurs when an unrecognized word at an EXEC prompt is treated as a hostname. The device may attempt a DNS lookup, appearing to pause. On an isolated practice device, `no ip domain-lookup` in global configuration disables this behavior. It changes that device's name-lookup behavior; it does not disable DNS for the entire network. Do not apply it automatically to a system that needs name resolution.

Ctrl+Shift+6 is a common IOS escape sequence for interrupting a running operation. Its handling can depend on the terminal or simulator. If a lookup does not respond to the shortcut, allow it to time out, correct the input, and use context help before retrying.

## How to study with this site

Work through the foundation chapters in order. They build from device operation and packet forwarding to addressing, transport protocols, and Ethernet switching. If a later explanation is unclear, return to the prerequisite concept and reproduce a small example.

For each chapter, first read for the main mechanism: what decision is being made, which information is used, and what changes as a result. Then use the lab to observe that mechanism. Before issuing a command, predict what the output should show. Afterward, compare your prediction with the evidence.

Keep a short lab record with the requirement, addressing or interface plan, commands you changed, and the outputs that verify the result. When a test fails, record the symptom before changing anything. Make one justified correction at a time and repeat the same test. This makes it much easier to distinguish the actual cause from a coincidental improvement.

Use flashcards for recall, checkpoint questions for reasoning, and command drills for syntax. Review the explanations for incorrect options as well as the correct answer. A useful check is whether you can explain why an option fails under the stated conditions, without relying on the position of the answer.

After completing a guided lab, rebuild it from the topology and requirements with the instructions closed. Change one address range or interface assignment and verify the revised result. This tests whether you understand the configuration, rather than whether you remember one sequence of keystrokes.

No course can guarantee an exam result. Readiness is better demonstrated by consistent performance across the published objectives, including unfamiliar examples and practical verification, than by a particular number of study hours.

## Reading the output

The following is a **representative excerpt**, not a required byte-for-byte result from your Packet Tracer version:

```output show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
FastEthernet0/1         unassigned      YES unset  up                    up  ← The local interface reports operational physical and line-protocol states.
FastEthernet0/2         unassigned      YES unset  down                  down  ← No operational link is reported; inspect the connection and peer.
FastEthernet0/3         unassigned      YES unset  administratively down down  ← The interface has been disabled in configuration.
Vlan1                  unassigned      YES unset  down                  down  ← The switch virtual interface has no IP address here.
```

An access switch can forward Layer 2 traffic without an IP address on each physical port or a configured management address. The Vlan1 row concerns a logical interface; it does not, by itself, say that every physical port is down.

**Up/up** is useful local evidence. It does not prove that the host has the correct address, that every switch setting is appropriate, or that an application works. Similarly, a successful ping proves that the tested source received ICMP replies from the destination at that time. It does not validate every service or every possible path.

To check whether a hostname is saved, inspect both configurations. If running configuration contains `hostname S1` but startup configuration contains `hostname Switch`, the active name has not been saved to that startup configuration. This is stronger evidence than simply remembering that you pressed a Save button somewhere in the application.

## Exam focus

- Recognize IOS modes from their prompts and choose commands appropriate to the mode.
- Use context help and interpret common parser messages.
- Distinguish running configuration, startup configuration, and a simulator project file.
- Save deliberately, verify the saved setting, and understand the effect of an unsaved reload.
- Interpret interface status without claiming that one command proves the whole network works.
- Build the habit of checking requirements, predicting behavior, observing evidence, and testing after a correction.

Before continuing, build the two-PC LAN, explain what its successful ping establishes, and verify that the switch name is saved. Chapter 01 uses those same devices and tests to explain what happens inside a frame and what changes when a router connects two LANs.
