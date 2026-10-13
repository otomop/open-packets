# Network figure standard

Every network picture in the course follows this standard: lesson figures, lab topologies, lab step pictures and question exhibits. One engine draws them all: `src/lib/netfig.ts` lays out the figure and times its traffic, and `src/components/NetFigure.tsx` renders it. The result is one visual language. A learner who can read one figure can read the next.

`node scripts/check-figures.mjs` lays out every figure in the course with the app's own engine. It fails any figure that breaks the drawing rules below. Run it after you change a topology, a trace or a lab step picture.

## Principles

1. **Draw the network as it is cabled.** A device is a box. A cable leaves one device's port on the box edge and arrives at the other device's port. Cables run horizontally and vertically with rounded corners, never through a device they do not connect to, and never along another cable's line.
2. **Move traffic one hop at a time.** A frame or packet crosses one cable at a time and lands on the far port with a ring. The device outline then takes the traffic's colour, and a short trace inside the box runs from the ingress port to the egress port. The traffic leaves from the egress port. Nothing slides through a device, and nothing moves in a straight line across the figure.
3. **Say what each device does, where it does it.** While a device handles traffic, a tag beside it names the decision: `Root port Gi0/1 · cost 8`, `PAT · 10.10.20.x → 203.0.113.1`, `dst 0000.0c07.ac01 → Fa0/1`. A tag is short and factual.
4. **Show state, then show it change.** A port role is written at the port (`Root FWD`, `Desg FWD`, `Altn BLK`). A device role is a chip beside the device (`ACTIVE`, `STANDBY`, `HTTP On`). When the network reconverges during an animation, those labels change at that moment, so the change is seen rather than described.
5. **Make failure explicit.** Traffic that is discarded ends in a red ✕ at the port where it stops, with a tag saying why. A cable that is down is dotted, with red port markers.
6. **Colour is meaning.**

   | Colour | Meaning |
   |---|---|
   | Cobalt | Requests and the first flow |
   | Green | Replies |
   | Teal | A second, parallel flow (another VLAN) |
   | Red | Discards and down ports |
   | Amber | Blocking and warnings |

   Structure is drawn in ink lines. No colour is decorative.
7. **Motion is calm and legible.**
   - Moves use easing, never linear.
   - A hop takes 0.55–1.25 s by cable length.
   - A device takes 0.4 s to handle traffic, or about 1 s when it shows a tag.
   - A tag stays up long enough to read: at least 2.2 s, and longer for longer text (up to about 4 s), while the traffic moves on.
   - Each loop ends with a 1.4 s rest before it repeats.
   - One figure tells one story.
8. **Accurate, or absent.** Every path, port, role, cost, address and state in a figure must match the text it illustrates. A figure never adds a fact its lesson or lab does not state. If the text does not say which way traffic goes, the figure does not animate it.

## Anatomy

| Element | Look |
|---|---|
| Device | A box with the device name in display type, an optional sub line (address, role, model) in mono of up to two lines, and a small kind glyph in the corner. `highlight`/`focus` gives it a cobalt outline. |
| Port | A small marker on the box edge. Its name sits beside it, with any role after the name, coloured by role. |
| Cable | Orthogonal with rounded corners. Solid by default; `dashed` for WAN or logical links; `wireless` dotted; `blocked` dotted with an amber bar at the blocking port; down cables dotted with red port markers; not yet connected as faint dashes. |
| Cable label | Mono, beside the cable's longest straight run and nearer to it than to any other cable. |
| Tag | A bordered mono label beside a device while it handles traffic. At most 44 characters. Placed clear of devices, labels and other tags. |
| Chip | The same shape as a tag, persistent: a prompt, a service state, a gateway role. |
| Controls | A pause button on every animated figure. An enlarge button when the figure is too wide for its column: below 70 % scale the figure scrolls sideways instead of shrinking, and enlarging opens it full size. |

Motion follows Settings → Motion. With reduced motion the figure shows each flow's path as a still trail, with the narrative listed under it. Animation also pauses while the figure is off screen.

Figures keep the orientation their author drew, because captions say "on the left" and "the upper pair". Only a lab step picture may turn a long chain on its side to fit the narrow step column; no text refers to its orientation.

## Authoring a topology

A topology `diagram` keeps its existing fields; see [AUTHORING.md](AUTHORING.md#diagrams-json-specs). The engine chooses each cable's sides and routes it; `fromSide`/`toSide` (`l`, `r`, `t`, `b`) override that choice only when a figure needs it. Grid coordinates set the arrangement, and the engine sets the spacing from the labels.

A topology animates when it has a `trace`:

```json
"trace": {
  "flows": [
    { "path": ["PCA", "SW1", "SW3", "SW2", "PCB"], "label": "Echo request",
      "tags": { "SW1": "Root port Gi0/1 · cost 8" } }
  ],
  "roles": [ { "node": "SW1", "peer": "SW2", "text": "Altn BLK" } ],
  "blocked": [ ["SW1", "SW2"] ]
}
```

| Field | Meaning |
|---|---|
| `flows` | Traffic, in order. Each flow runs after the previous one unless it has `"with": true`. |
| `flows[].path` | Node ids in order; consecutive nodes must be cabled. A final array floods to several neighbours at once: `["PCA", "SW1", ["PCB", "PCC"]]`. |
| `flows[].via` | Per hop, the index in `links` to use when two nodes share more than one cable. |
| `flows[].tone` | `request` (default), `reply`, `alt` (a second parallel flow), `warn`. |
| `flows[].label` | A short name for the traffic, used in the narrative. |
| `flows[].tags` | `{ nodeId: text }`: what that node does to this traffic, shown while it handles it. |
| `flows[].stop`, `stopText` | The node that discards the traffic, and why. The ✕ appears at the port it would have left by. |
| `flows[].back` | A reply returns along the same path. `backTags`, `backStop` and `backStopText` describe the return. |
| `flows[].wait` | Seconds of stillness before the flow starts. |
| `flows[]` event | `{ "event": ["SW1", "SW3"], "tags": { … } }`: a moment when devices change state without traffic, such as a reconvergence. |
| `roles` | `{ node, peer, text, tone?, from?, until?, link? }`: a role at `node`'s port toward `peer` (`link` is the index in `links` when the two share more than one cable). `from`/`until` are flow indexes, so a role can change mid-animation. Tones default by text: Root → cobalt, Desg → green, Altn/BLK → amber. |
| `chips` | `{ node, text, tone?, from?, until? }`: a chip beside a device. Tones are `ok`, `warn`, `bad`, `dim` (default) and `accent`. |
| `down`, `cut` | Cables touching these nodes are down; these `[a, b]` cables are down. Add the index in `links` as a third element, `[a, b, 2]`, when two nodes share more than one cable. |
| `absent` | Devices not added yet: drawn as dashed outlines, with their cables not yet connected. Traffic cannot cross them. |
| `blocked` | `[a, b]` or `[a, b, link index]`: `a`'s port on that cable is blocking. A role whose text begins Altn, ALT or BLK draws the same bar, following the role's timing. |
| `focus` | Nodes to outline in cobalt. |

### When a lesson figure animates

Give a figure a `trace` when the text around it describes traffic crossing it: a path, a lookup, a translation or a failover. A structural figure stays still: cabling, an addressing plan, a hierarchy. Keep the existing `packet` field only on figures not yet converted; the engine plays it as a plain flow.

Question exhibits never animate, because a trace could reveal the answer.

## Lab step pictures

Each lab step can end with a `state` fence. It describes the network once that step is done and is never shown as text. The picture uses the lab's own topology, and every field of `trace` is available:

```state
{"status":"Fa0/24 takes over","tone":"warn",
 "cut":[["SW2","SW3"]],
 "flows":[
   {"path":["PCA","SW1","SW3","SW2"],"stop":"SW3","stopText":"Probe lost · Gi0/2 is down"},
   {"event":["SW1","SW3"],"tags":{"SW1":"Fa0/24 alternate → root port","SW3":"Root port Gi0/1 · cost 23"}},
   {"path":["PCA","SW1","SW2","PCB"],"back":true}
 ],
 "roles":[
   {"node":"SW1","peer":"SW2","text":"Altn BLK","until":1},
   {"node":"SW1","peer":"SW2","text":"Root FWD","from":1}
 ],
 "rows":[["SW1 root port","Fa0/24 · cost 19","ok"],["SW3 root port","Gi0/1 · cost 23","ok"]]}
```

| Field | Meaning |
|---|---|
| `status`, `tone` | The heading of the picture; `tone` is `ok`, `warn`, `bad` or `dim`. `warn` and `bad` also mark the step in the route strip. |
| `cabled: false` | Nothing is connected yet. |
| `addressed` | `false` hides address sub lines until the hosts are addressed; a list such as `["R1", "R2"]` keeps them only on those devices. |
| `topology` | Which of the lab's topology diagrams the picture uses, counting from 1 in document order. A lab that moves to a second network adds that network's diagram inside the step where it begins and sets `"topology": 2` from there on. |
| `led`, `wake` | Switch ports come up amber and turn green: every switch port, or those on cables touching the listed nodes. |
| `ping`, `pings` | A shortcut: `[from, to]` pings along the shortest cabled path with a reply; `[from, to, "fail"]` loses the reply at the destination. Use `flows` whenever the path, a tag or the point of failure matters. |
| `prompt`, `chips` | Chips beside devices: a prompt such as `SW1#`, a service state, a role. |
| `rows` | Key facts under the picture: `[label, value, tone?]`. |

Rules for step pictures:

- Draw what the step's own text and `:::expected` box say is true. Traffic appears only when the step sends traffic or states a traffic result. A configuration-only step shows focus, chips and roles.
- A tag or chip paraphrases the step. It never introduces an address, port, cost, timer or state the step does not give.
- Keep `rows` to the few facts a learner should confirm. They are not a transcript of the output.
- A step that restores a baseline returns the picture to the baseline.
- Never reveal what a step keeps in a collapsed `:::solution` box: its picture shows the network state the learner works from, not the answer.

## Sequence diagrams

A `sequence` diagram uses the same motion. Each message is drawn from sender to receiver in order, with a ring on arrival, and keeps its label while the exchange builds. `accent` messages travel in cobalt, the rest in ink. The exchange then clears and plays again. It has the same pause control and the same still view under reduced motion.
