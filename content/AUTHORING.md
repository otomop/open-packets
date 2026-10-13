# Authoring guide — OpenPackets content

Every chapter is a folder under `content/chapters/` named `NN-chapter-id/` (two-digit number, kebab-case id). A chapter folder contains:

| File | Required | What it is |
|---|---|---|
| `chapter.md` | yes | Frontmatter + the lesson (Markdown with the extensions below) |
| `lab.md` | yes (except pure-theory chapters) | Frontmatter + a guided lab in numbered steps |
| `questions.json` | yes | A checkpoint sized to the chapter's distinct skills |
| `cards.json` | yes | Short retrieval prompts for that chapter's core knowledge |
| `commands.json` | when command recall is an intended outcome | Only commands worth practising here |
| `tickets.json` | when evidence-based diagnosis is an intended outcome | Cases that require a supported diagnosis |

`node scripts/validate-content.mjs` checks content structure and reports editorial warnings. It cannot establish factual accuracy or teaching quality; those require source review and careful reading. Use the reviewed chapters in `content/audits/` as examples. A review report names the actual scope and verification limits; an unaudited earlier file is not an authority.

## Practice depth and progression

Use [PRACTICE-PLAN.md](PRACTICE-PLAN.md) to choose each chapter's workload, lab purpose and reasoning demands. Its ranges are editorial planning guides, not quotas or Cisco-prescribed question counts. Orientation needs a short confidence-building check; addressing, routing and policy require more varied application. A descriptive chapter must not acquire a long configuration lab simply to resemble a troubleshooting chapter.

Identify the distinct skills first, then select the smallest useful set of items that covers them. Retain a question only if it adds a relevant learning decision or purposeful retrieval opportunity. A changed address alone does not justify another otherwise identical question. Reserve optional details for explicitly optional exercises. Short foundational banks do not need an arbitrary minimum of multi-select questions, exhibits or drills.

Order chapter checkpoint items from recognition and comprehension through routine application to justified analysis. The app preserves chapter question order while shuffling answer choices. Global mixed practice is deliberately different from this first-learning sequence. Difficulty labels describe the reasoning the learner must perform; they are not measured item difficulty, exam probabilities or pass predictions.

Labs progress from an explained model to a prediction, guided observation or action, and an independent variation. Define observable success and stop conditions. Supply unfamiliar setup where needed and identify it as setup, rather than assessing unintroduced commands. A theory lab may be a structured worksheet or packet interpretation exercise. An ordinary configuration lab should include a working baseline, one relevant fault observed before repair, a separate recovery step and a changed scenario. Do not add disruptive faults to orientation just to follow a template.

Every reviewed chapter needs a short coverage/decision record: outcomes assessed, item demand, duplicate or premature material removed, confirmed later owner where applicable, lab verification evidence, and unresolved platform limits. Preserve same-topic identities; record every retired identity. A fresh reader should be able to attempt the task without consulting a hidden prerequisite or the answer key.

## Who we are writing for

A motivated beginner studying alone for the CCNA 200-301 (v1.1 until 2 Feb 2027, v2.0 from 3 Feb 2027) with Cisco Packet Tracer as the lab tool. They will never have an instructor to ask, so the page must carry everything: the concept, the relevant values and the conditions in which they apply, what the commands look like, what the output looks like, and where the traps are.

**Voice.** Natural, professional teaching. Explain the mechanism before its configuration and show how to verify the result. Use precise terms with plain definitions. Remove theatrical metaphors, unsupported claims about what the exam “loves,” invented field experience, and promises of a pass. State defaults with their platform or scenario when they are not universal.

**Accuracy.** Check technical claims against current primary sources: Cisco documentation, standards, RFCs and official command references. Do not copy an old chapter as proof. Label authored or abbreviated output as representative; never describe it as a recorded simulator/hardware run unless one was actually performed. Resolve uncertain claims before a chapter is marked reviewed. Keep exact supported commands, arithmetic and observed evidence separate from conclusions.

## `chapter.md`

```markdown
---
id: spanning-tree                 # must equal the folder id (without the number)
number: 14                        # must equal the folder number
title: Spanning tree              # short; Big Shoulders display type, so 1–4 words
subtitle: Root election, path selection and port states in a redundant Layer 2 network.
part: switching                   # start | foundations | switching | routing | services | security | wireless | automation | capstone
domain: switching                 # v2.0 exam domain: infra | switching | routing | services | aiops | none
minutes: { lesson: 60, lab: 30 }
summary: One or two sentences shown in the catalogue and on the dashboard.
objectives:
  v1: ["2.5", "2.5.a", "2.5.b"]  # v1.1 blueprint ids this chapter teaches (see content/blueprint.json)
  v2: ["2.5", "2.5.a", "2.5.b"]  # v2.0 blueprint ids; foundations may have no direct tag
prereqs: [ethernet-switching, vlans-and-access-ports]   # chapter ids
sources:
  - { title: "Cisco: Catalyst 9000 Layer 2 configuration guide — STP", url: "https://..." }
---
```

Then the lesson body. Rules:

- **Structure**: Use clear H2 sections: purpose and mechanism, worked example, configuration where required, verification/troubleshooting, and Exam focus. Usually 6–9 sections are enough. Reorder or rename headings when it improves the learning sequence; avoid unsupported dependencies on later chapters. Briefly define necessary preview terms and link to the later owner of the full topic.
- **Length**: Give the topic enough space for complete explanations and worked practice without padding. About 1,800–2,800 words of prose is a useful guide, not a quota. Keep paragraphs focused and break complex procedures into observable steps.
- **Every chapter must contain**: at least one `:::facts` box at the top of the first teaching section (the numbers and rules to memorise), at least one comparison **table**, at least one **diagram**, at least one annotated **`output`** block, at least one `:::trap` box, and one `ios` config block when the objective verb is configure/verify/troubleshoot.
- **Bold** the term the first time it is defined. Use `inline code` for commands, keywords, addresses, and interface names in prose.
- Relevant timers, ports, ranges, costs and priorities should be stated literally with their scope. Do not invent an exam requirement to memorize an implementation limit or optional feature. Use the objective verb to choose depth.


### Stable section identities

Reading progress uses section IDs, normally derived from headings. When renaming or moving an existing section that still teaches the same topic, map its new display title to its original ID in chapter frontmatter:

```yaml
sectionIds:
  Local accounts and privileged access: passwords-secrets-and-the-local-user-database
```

The loader validates these mappings. Do not reuse an old identity for an unrelated assessment; give replacement questions, cards and drills new IDs and record retired IDs in the audit report. Keep chapter IDs stable. Lab rewrites should preserve a logical sequence, with separate fault observation and recovery steps, and document material changes.

### Containers

```markdown
:::facts
- Root bridge = lowest bridge ID (priority, then MAC). Default priority `32768` + VLAN ID.
- On the documented Catalyst implementation, `spanning-tree vlan 10 root primary` sets 24576 if that wins; otherwise it attempts a priority 4096 below the current root, subject to the supported lower bound. Verify the resulting configuration.
:::

:::trap Where cost is added
Cost accrues on the interface that **receives** the BPDU — the root's own ports advertise cost 0.
:::

:::note Optional title
Background or context that is useful but not tested.
:::

:::tip Optional title
A practical habit, shortcut or mnemonic.
:::

:::warning Optional title
Something that breaks networks or locks you out.
:::
```

Container names: `facts`, `trap`, `note`, `tip`, `warning` (lessons); `expected`, `solution` and `device` (labs). Containers cannot nest. The title after the name is optional. An `expected` box is visible guidance. A `solution` is a closed, keyboard-accessible disclosure labeled "Check your answer" by default; use it for independent answers and calculation worksheets that must be attempted first.

### Code fences

````markdown
```ios
SW1(config)# spanning-tree mode rapid-pvst
SW1(config)# spanning-tree vlan 10 root primary
```
````

`ios` = commands you type. Include the prompt on every line (`Router>`, `SW1#`, `SW1(config-if)#`) so the mode is visible. A title may follow the language: ```` ```ios SW1 ```` labels the block with the device name (used in labs).

````markdown
```output SW1# show spanning-tree vlan 10
VLAN0010
  Spanning tree enabled protocol rstp          ← rapid-pvst; "ieee" would mean classic PVST+
  Root ID    Priority    24586                 ← 24576 + VLAN 10
             Address     cccc.cccc.cccc
```
````

`output` = what the device prints. The title after the language is the command (shown as the block header). A trailing `  ← note` (two spaces, then the arrow `←`, then text) on any line becomes a highlighted annotation. Keep real column alignment; pad with spaces, never tabs. Prefix a line with `>>` to highlight the whole line (`>> Gi0/1  Root FWD 4 ...`).

````markdown
```diagram
{ "type": "topology", ... }
```
````

`diagram` = a JSON spec rendered by the app (see below). Also allowed: ```` ```text ```` for anything else (a PC's `ipconfig`, Linux shell, JSON, YAML — use the real language name: `json`, `yaml`, `bash`, `powershell`).

### Tables

GitHub-flavoured Markdown tables. Header row required. Keep to 2–5 columns. Put units in the header (`Cost (short)`), not in every cell. Use `code` in cells for commands and values.

## Diagrams (JSON specs)

Coordinates for topology are on a **12 × 6 grid** (x 0–12 left→right, y 0–6 top→bottom; decimals allowed). Keep nodes at least 2 units apart. The app draws the device, the label under it and an optional `sub` line (an address, a bridge ID).

```json
{ "type": "topology", "title": "Fig 14.3 — SW1 reaches the root through SW2",
  "caption": "SW1's root port faces SW2: 4 + 4 = 8 is cheaper than 19.",
  "nodes": [
    { "id": "SW1", "kind": "switch", "label": "SW1", "sub": "32778.aaaa", "x": 2, "y": 1 },
    { "id": "SW3", "kind": "switch", "label": "SW3", "sub": "32778.cccc", "x": 10, "y": 1 },
    { "id": "SW2", "kind": "switch", "label": "SW2 · root", "sub": "24586.bbbb", "x": 6, "y": 5, "highlight": true }
  ],
  "links": [
    { "from": "SW1", "to": "SW3", "label": "Fa · 19", "style": "blocked", "fromBadge": "ALT" },
    { "from": "SW1", "to": "SW2", "label": "Gi · 4", "fromBadge": "RP", "toBadge": "DP" },
    { "from": "SW3", "to": "SW2", "label": "Gi · 4", "fromBadge": "RP", "toBadge": "DP" }
  ],
  "packet": { "path": ["SW2", "SW1"], "label": "BPDU" },
  "zones": [ { "label": "VLAN 10", "nodes": ["SW1", "SW3"] } ]
}
```

- `kind`: `router` `switch` `l3switch` `pc` `laptop` `server` `ap` `wlc` `phone` `firewall` `cloud` `printer` `hub`.
- Link `style`: `solid` (default) `dashed` `blocked` `wireless`. `fromLabel`/`toLabel` put interface names at each end; `fromBadge`/`toBadge` put a small tag (RP, DP, ALT, BLK, trunk, access…) at each end; `label` sits mid-link. `accent: true` draws the link in cobalt.
- `packet.path` is a list of node ids the animated dot walks (nodes must be linked in order). `zones` draw a dashed outline around a group.
- Every topology is drawn to the [network figure standard](FIGURES.md): device boxes, ports on their edges, cables that run port to port without crossing a device, and traffic that moves one hop at a time. A `trace` animates the traffic the text describes (flows with tags, discards, reconvergence events, port roles and chips); lab steps describe their picture in a `state` fence with the same fields. `fromSide`/`toSide` (`l` `r` `t` `b`) override the side a cable leaves from. Run `node scripts/check-figures.mjs` after changing any topology, trace or step picture.

Other types:

```json
{ "type": "sequence", "title": "DHCP through a relay", "actors": ["Client", "R1 (relay)", "DHCP server"],
  "steps": [
    { "from": 0, "to": 1, "label": "DISCOVER", "note": "broadcast · 0.0.0.0 → 255.255.255.255", "accent": true },
    { "from": 1, "to": 2, "label": "DISCOVER", "note": "unicast · giaddr = 10.10.10.1" },
    { "from": 2, "to": 1, "label": "OFFER" },
    { "from": 1, "to": 0, "label": "OFFER" }
  ], "caption": "..." }
```
```json
{ "type": "bits", "title": "802.1Q tag · 32 bits",
  "fields": [ { "label": "TPID", "bits": 16, "note": "0x8100" }, { "label": "PCP", "bits": 3 }, { "label": "DEI", "bits": 1 }, { "label": "VID", "bits": 12, "note": "1–4094", "highlight": true } ],
  "caption": "..." }
```
```json
{ "type": "binary", "ip": "172.20.77.210", "prefix": 20, "caption": "Network bits filled, host bits hollow." }
```
```json
{ "type": "timeline", "title": "802.1D port comes up", "unit": "s",
  "rows": [
    { "label": "Classic STP", "segments": [ { "label": "Blocking", "length": 20, "tone": "dim" }, { "label": "Listening", "length": 15, "tone": "mid" }, { "label": "Learning", "length": 15, "tone": "light" }, { "label": "Forwarding", "length": 6, "tone": "accent" } ] },
    { "label": "RSTP + PortFast", "segments": [ { "label": "Forwarding", "length": 56, "tone": "accent" } ] }
  ], "caption": "..." }
```
```json
{ "type": "matrix", "title": "DTP — what forms when two ports meet",
  "rows": ["access", "trunk", "dynamic auto", "dynamic desirable"], "cols": ["access", "trunk", "dynamic auto", "dynamic desirable"],
  "cells": [ ["access", "limited", "access", "access"], ["limited", "trunk", "trunk", "trunk"], ["access", "trunk", "access", "trunk"], ["access", "trunk", "trunk", "trunk"] ],
  "tones": { "trunk": "accent", "limited": "bad", "access": "neutral" }, "caption": "..." }
```
```json
{ "type": "layers", "title": "OSI and TCP/IP",
  "columns": [
    { "title": "OSI", "rows": ["Application", "Presentation", "Session", "Transport", "Network", "Data link", "Physical"] },
    { "title": "TCP/IP", "rows": [ { "label": "Application", "span": 3 }, { "label": "Transport" }, { "label": "Internet" }, { "label": "Link", "span": 2 } ] },
    { "title": "PDU", "rows": [ { "label": "Data", "span": 3 }, { "label": "Segment / datagram" }, { "label": "Packet" }, { "label": "Frame" }, { "label": "Bits" } ] }
  ], "highlight": ["Network", "Internet", "Packet"], "caption": "..." }
```

Every diagram gets a `title` (used as the figure number line) and a one-sentence `caption` saying what to notice.

## `lab.md`

```markdown
---
title: Build a three-switch tree and move the root
environment: packet-tracer        # packet-tracer | cml | hardware | paper | linux | mixed
devices: ["3 × 2960 switches", "2 × PC"]
minutes: 30
---
Two or three sentences: what you will build and what you will prove.

## Topology
A `diagram` block plus an addressing/port table.

## Step 1: Cable and name the switches
What to do, in prose. Then the commands, one block per device:

```ios SW1
SW1> enable
SW1# configure terminal
...
```

:::expected
What you should see, ideally with a short `output` block and the line to look for.
:::

## Step 2: ...

## Troubleshooting
- Symptom → likely cause → check.

## Challenge
An independent variation with no walkthrough, followed by the answer key in a closed `:::solution` disclosure.
```

End each step with a `state` fence: one line of JSON describing the network once the step is done (status, the traffic it sends, discards, roles, chips, key facts). The app draws it beside the step with the lab's own topology; it is never shown as text. [FIGURES.md](FIGURES.md#lab-step-pictures) defines the fields and the rules: draw only what the step's text and expected result say is true.

Lab rules: name the Packet Tracer device models (2960, 3650, 2911/4331) and interface names that exist on them; state cable types (PT needs crossover or the auto-connect tool for switch–switch and router–router copper links); every step has the required commands or explicit GUI/paper actions **and** an `:::expected` box or an independently attempted answer in `:::solution`; one device per block; `no shutdown` where needed; tell the learner which prompt to be at; put restore/cleanup commands in their own step. If a command is not supported in Packet Tracer, say so in the step and give the PT alternative or mark the step "CML/hardware only". State what the learner must record or demonstrate at the end. Separate the challenge's requirements from its answer key. Exact timing, counters and transient messages are not pass criteria unless the scenario explicitly supplies them as evidence.

## `questions.json`

```json
[
  {
    "id": "spanning-tree-q01",
    "type": "single",
    "objectives": ["v2:2.5.a", "v1:2.5.a"],
    "difficulty": 2,
    "exhibit": { "kind": "cli", "title": "SW1# show spanning-tree vlan 10", "text": "VLAN0010\n  Root ID    Priority 24586 ..." },
    "prompt": "Which switch is the root bridge for VLAN 10, and how do you know?",
    "options": ["SW1 — its cost is 0", "The switch with MAC cccc.cccc.cccc — Root ID and Bridge ID differ", "SW1 — protocol rstp", "The switch on Gi0/1 — it is the root port"],
    "answer": [1],
    "explanation": "The Root ID block names the root's MAC; when it differs from the Bridge ID block, this switch is **not** the root.",
    "whyWrong": { "0": "Cost 0 appears only on the root itself; here cost is 8.", "2": "The protocol line says which STP flavour runs, not who is root.", "3": "The root port points *toward* the root; it is not the root." }
  }
]
```

Rules for questions:

- Size the bank and its mix according to the chapter's practice plan. Use an exhibit when the learner must interpret it; do not paste the correct option into an exhibit and call that analysis. Use multi-select when two independent choices genuinely matter, state the number to choose, and include all correct indices. An introductory chapter may use only single-answer items.
- Options: 4 for single (5 allowed for multi). **All distractors must be plausible to someone who half-learned the topic** — same domain, similar length (within ±30 % of each other), no jokes, no "Only on fiber", no absolutes as giveaways, no "all of the above". The correct option must not be systematically the longest. Vary the correct index; across the chapter use each position roughly equally.
- The prompt must be self-contained — never "in this lab" or "the lesson data". Put the needed context in the prompt or the exhibit.
- `explanation`: 2–4 sentences, why the right answer is right. `whyWrong`: one sentence per distractor. Markdown allowed (bold, `code`).
- `objectives`: tag with both tracks where applicable using `v1:` / `v2:` prefixes and the ids from `content/blueprint.json`.
- `difficulty`: **1** retrieves a fact, recognizes a clearly taught concept or reads one explicit field; **2** applies a taught rule/procedure to a scenario, calculation or familiar output; **3** combines evidence or constraints, distinguishes plausible causes, or solves an unfamiliar variation. A long prompt, obscure command, calculation or word "troubleshoot" does not automatically make an item level 3. Check the actual reasoning, not the question's wording.

## `cards.json`

```json
[ { "id": "spanning-tree-c01", "front": "Default STP bridge priority?", "back": "32768 (+ VLAN ID as the extended system ID).", "tags": ["number"] } ]
```

Use the chapter-specific card range as a starting point. Each front should cue one retrievable idea or one closely related comparison (usually under 90 characters). The back gives a direct answer, normally one or two short sentences, plus a condition only when it is necessary for accuracy. Split unrelated lists; remove near-duplicates. Prioritize the chapter's core mechanisms and relevant numbers, defaults, ranges, ports, timers or commands. A number's presence in a reference table does not by itself make it a required recall target. Do not assess later chapters' details early. Tags: `number`, `command`, `concept`, `compare`, `troubleshoot`.

## `commands.json`

```json
[
  {
    "id": "start-here-d03",
    "task": "Set the IOS hostname to S1.",
    "mode": "Switch(config)#",
    "answer": "hostname S1",
    "accept": [],
    "teaching": {
      "sectionId": "the-command-line-modes-help-and-the-pager",
      "hint": "Use the device-naming command in global configuration mode.",
      "takeaway": "The prompt changes immediately. Naming changes the running configuration; save separately when the configuration is ready.",
      "syntax": [
        { "text": "hostname", "kind": "keyword" },
        { "text": "S1", "kind": "argument" }
      ],
      "focus": "core"
    }
  }
]
```

Select the skill before writing the exercise. Read the owning chapter, its lab and the selected track's objective verb. Retain a drill when choosing or writing that command is a useful outcome at this point in the course. An illustrative configuration, supplied lab setup or optional reference does not automatically belong in the recall bank. Theory chapters can have no commands; output interpretation remains in their lessons, labs and checkpoints. A larger bank must reflect distinct decisions, not renamed devices or changed addresses.

Start early chapters with explicit, single-action tasks. Later tasks can require selecting evidence or making a bounded repair from taught observations. Repeating an earlier command is justified when the new context adds a decision; otherwise link back to its owner. Do not give an exercise a harder label merely because its command is long. Use `content/command-curriculum.json` to explain each chapter's actual goal and demand (`foundation`, `application` or `analysis`). Empty banks need an `emptyReason`; up to two `reviewLinks` can identify a useful owner and explain when to use it. These are study guidance, not psychometric difficulty ratings.

`answer` is the full canonical command for the stated platform and prompt. Put indispensable initial state, interface, platform and supplied values in `task`. `accept` contains only verified alternatives that satisfy that exact task and output scope; do not accept a broader display or a macro replacement whose behavior depends on different starting conditions. Preserve IDs when the same skill is improved. Give a new ID to a new skill so earlier progress does not imply it was completed.

Every retained command requires compact `teaching`: an existing stable `sectionId` in its own lesson, a short conceptual `hint`, and a useful `takeaway` revealed with the answer. The takeaway should explain a decision, consequence, misconception or evidence limitation. It should not restate the task, narrate each keyword, or reproduce the lesson. Use one explanation, not additional `note`, `purpose`, `before` and `verify` copies. A show-command task should explain why the requested evidence matters without pretending that a text check executes a device or diagnoses an outage.

`syntax` is grading metadata, not a displayed walkthrough. Joining `syntax[].text` with single spaces must reproduce `answer` exactly. Use `keyword` only for command grammar; use `argument` for supplied names, addresses, numbers, secrets, paths, filter expressions and other literal values. An `interface` group contains only the interface identifier or range, without its preceding keywords. Preserve meaningful quoted text as one argument group.

Matching supports a bounded list of common IOS keyword abbreviations and interface aliases in annotated positions. It does not establish every prefix's validity on every IOS image. Literal values retain their exact spelling and case; they cannot be shortened. Host shells use their own matching rules and never inherit IOS abbreviations. Alternative grammars are explicit finite forms. If a further accepted form is useful, verify it on the documented platform and add a regression test; do not broadly normalize values that could be secrets or filenames.

Set `focus` to `core` for the chapter's tested skills and their necessary foundations, or `supporting` for useful lab depth beyond the blueprint's stated requirement. Where depth differs between tracks, add `focusByTrack`, for example `{ "v1": "supporting", "v2": "core" }`. Only core items appear by default; extra lab practice is opt-in. The UI also treats chapters outside the selected track as supporting. The selection rationale must explain the boundary rather than implying that Cisco publishes an exhaustive command list.

The [chapter-by-chapter relevance audit](audits/command-relevance-2026-09-27/README.md) records individual keep/revise/retire/add decisions. Run `npm run validate` to check lesson anchors, compact teaching fields and chapter plans, and `npm test` for canonical/alternative grading and literal-value regressions. Automated checks establish consistency and behavior; editorial review against lessons and primary sources establishes relevance.

## `tickets.json`

```json
[ { "id": "spanning-tree-t01", "title": "Users on SW3 lose connectivity every 30 seconds",
    "objectives": ["v2:2.5.d"],
    "scenario": "Markdown: the situation, what the users report, what has changed.",
    "exhibits": [ { "title": "SW3# show spanning-tree vlan 10", "text": "..." }, { "title": "SW3# show logging | include SPANTREE", "text": "..." } ],
    "question": "What is the root cause?",
    "options": ["...", "...", "...", "..."], "answer": [2],
    "explanation": "Markdown: how the exhibits prove it.",
    "fix": "```ios\nSW3(config)# interface gi0/2\nSW3(config-if)# spanning-tree guard root\n```" } ]
```

A ticket is a diagnosis exercise: the learner reads exhibits and picks the supported cause or next action, then sees the fix. Choose the number from the chapter's distinct diagnostic outcomes. Do not add tickets to orientation just to meet a count. Provide enough evidence to distinguish alternatives, a narrow justified repair and an explicit retest. Do not infer a unique cause from an ambiguous symptom.

## Checklist before you finish a chapter

- [ ] Frontmatter complete; `id`/`number` match the folder; objectives exist in `blueprint.json`.
- [ ] Facts box, ≥1 table, ≥1 diagram, ≥1 annotated output, ≥1 trap, "Exam focus" section.
- [ ] Every number the exam expects is stated literally.
- [ ] Lab: device models, cable types, one device per block, expected output per step, PT limitations named.
- [ ] Questions cover distinct intended outcomes at suitable reasoning levels, begin accessibly, and use plausible distractors, balanced answer positions and self-contained prompts.
- [ ] Flashcards each cue a useful idea; drills and tickets serve the chapter's outcomes. Count and depth follow its practice plan rather than uniform quotas.
- [ ] Lab evidence rubric and independent variation are complete; setup, measured observation and supplied representative evidence are clearly distinguished.
- [ ] `npm run validate` reports 0 errors, including complete command teaching and valid lesson anchors.
