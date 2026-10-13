# OpenPackets

An independent, original self-study companion for the Cisco CCNA 200-301 exam — built for the **v2.0** blueprint (live from 3 February 2027) with a **v1.1** track (available until 2 February 2027).

- 46 chapters ordered for learning, each with a lesson (key facts, tables, annotated `show` output, diagrams), a guided Packet Tracer lab, a checkpoint, flashcards and a command drill
- Practice sessions with exhibit-based questions, shuffled options, multi-answer items and per-objective mastery
- Spaced-repetition flashcards, a subnetting trainer, an IOS command drill and troubleshooting tickets
- A study plan that paces the remaining chapters against your exam date, and a blueprint map of every objective

The study app runs in the browser; progress is stored locally (export/import from Settings). There are no accounts or backend services.

This repository has no deployment workflow. Pushing changes to GitHub does not publish the app; hosting requires a separate, explicit setup.

## Run it locally

Requires Node.js 20 or newer, with npm. Open a terminal in the `ccna guide` folder. Install the exact locked dependencies once, or after the lockfile changes:

```bash
npm ci
```

For everyday study, stop any existing development or preview server with **Ctrl+C** in its terminal, then run:

```bash
npm start
```

After the build succeeds and the server reports that it is ready, open **http://localhost:5173**. Keep the terminal open while studying; Ctrl+C stops the server. `npm start` validates the content, creates the optimized production build in `dist/`, and serves it locally. These commands do not publish the app.

Always use **http://localhost:5173** in the same browser profile to keep your existing progress. Browser storage belongs to the exact origin: `http://127.0.0.1:5173`, a different port, HTTPS, and a different browser profile each have separate progress. If you previously studied at another address, export from Settings there and import at the address you will keep using. Export before clearing browser data or switching devices.

The server stays on port 5173 and reports an error if it is occupied. Stop the earlier server and retry; do not switch ports to work around it.

For editing the app or course material, `npm run dev` starts Vite's development server with live updates at the same address. For studying, use `npm start` to run the optimized build. `npm run preview` serves an already-built `dist/` without rebuilding, so run `npm run build` first after making changes. Development and production preview use the same origin, but only one can run on port 5173 at a time.

## Checks and performance

```bash
npm run typecheck
npm test
```

The regression suite covers course loading, rendering, navigation, progress storage, practice interactions, and flashcard scheduling. `npm run validate` checks course content separately; it also runs during each production build.

`npm run perf:bundle` builds the app and reports initial JavaScript/CSS sizes, compressed JavaScript size, and lazy-loaded chunk count.

For an optional browser performance check, stop the existing server and run `npm run perf:profile`. Open **http://localhost:5173/?audit=1** and use **Snapshot metrics** or **Run scroll sample** in the diagnostic panel. The sample scrolls the current page for six seconds and reports frame timing, long tasks, and layout shifts. Browser support and device load affect the measurements. The diagnostic panel is only added by this profiling server; it is absent from the regular production build. Stop it with Ctrl+C and use `npm start` to return to ordinary study.

## Content

All course material lives in `content/`:

- `content/chapters/NN-id/` — `chapter.md`, `lab.md`, `questions.json`, `cards.json`, `commands.json`, `tickets.json`
- `content/blueprint.json` — the official v1.1 and v2.0 exam topics
- `content/course.json` — parts, domains and exam facts
- `content/AUTHORING.md` — the authoring format and style guide; `content/CHAPTERS.md` — the chapter plan

`npm run validate` checks every chapter (ids, objectives, answer keys, diagram specs, option balance).

## Scope and accuracy

The blueprints and exam facts were checked against Cisco's published exam topics and announcements on 17 September 2026. Lessons and questions are original teaching material, not exam items. Verify current registration details with Cisco before booking; no study resource can guarantee a pass.

Not affiliated with or endorsed by Cisco Systems.

## License

Original application code is licensed under **MIT**. Original course material is licensed under **CC BY 4.0**, allowing sharing and adaptation with attribution and an indication of changes. Both licenses permit commercial reuse; the project itself is intended as a free learning resource.

See [LICENSE.md](LICENSE.md) for the scope of each license, attribution, and third-party exclusions. Bundled fonts and dependencies retain their own copyright and license notices. The license files and third-party notices are also included in production builds.
