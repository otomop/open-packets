# OpenPackets

A free, open-source study hub for the Cisco CCNA 200-301 exam.

**[Open the app](https://otomop.github.io/open-packets/)** · [Report an issue](https://github.com/otomop/open-packets/issues) · [Contribute a correction](https://github.com/otomop/open-packets/compare)

> [!IMPORTANT]
> **Work in progress · AI disclosure**
>
> This project was created with Astra and Claude, with much of the work using the highest available settings. Those settings do not guarantee accuracy. Lessons, labs, questions, and answers may contain errors, omissions, or inconsistencies.
>
> Use this as a study companion, not an authoritative reference or a guarantee of passing. Check explanations and commands against official Cisco documentation and the exam topics for your exam version.

## What's inside

- 46 chapters with lessons, diagrams, and guided Packet Tracer labs.
- Practice questions, flashcards, subnetting exercises, command drills, and troubleshooting scenarios.
- Study planning and progress tracking, with v1.1 and v2.0 exam tracks.

No account required. Progress stays in your browser. Use **Settings → Export progress** before switching devices or moving between the hosted and local app, then import your backup at the new location.

## Run locally

Requires **Node.js 20+** and npm. In the project folder:

```bash
npm ci
npm start
```

Open [localhost:5173](http://localhost:5173) once the server is ready. Keep the terminal open while studying; **Ctrl+C** stops it. Stop any existing server before starting another.

For development, use `npm run dev`. Before submitting changes, run `npm run typecheck`, `npm test`, and `npm run build`.

## Help improve it

Found incorrect data, an unclear explanation, or an inconsistency? **Please open a pull request** with the affected chapter or exercise, your correction, and a credible supporting source so it can be reviewed and fixed. An issue is welcome if you're unsure how to make the change.

Course material lives in [`content/chapters/`](content/chapters/), with lessons, labs, and practice files grouped by chapter.

Publishing is manual: **Actions → Publish OpenPackets → Run workflow** on `main`. Pushing a commit alone does not update the live app.

## License

Code: **MIT**. Original course material: **CC BY 4.0**. See [LICENSE.md](LICENSE.md) for scope and third-party notices.

OpenPackets is independent and is not affiliated with or endorsed by Cisco.
