import { useState } from "react";
import { course, totals } from "@/lib/course";
import { exportProgress, flushProgress, importProgress, resetAll, updateSettings, useProgress, useStorageStatus } from "@/lib/store";
import { examDatePatch } from "@/lib/plan";
import { ExamDatePicker } from "@/components/ExamDate";
import { AccentColorPicker } from "@/components/AccentColorPicker";

export default function Settings() {
  const p = useProgress();
  const s = p.settings;
  const storage = useStorageStatus();
  const [msg, setMsg] = useState("");
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exportProgress()], { type: "application/json" }));
    a.download = `open-packets-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const upload = (file: File) => {
    if (file.size > 8_000_000) { setMsg("The progress file is too large (maximum 8 MB). Your existing progress was kept."); return; }
    file.text().then(t => setMsg(importProgress(t) ?? "Progress imported.")).catch(() => setMsg("Could not open that file. Your existing progress was kept."));
  };
  return (
    <div className="page narrow">
      <div className="page-head"><div className="eyebrow tone-accent">Settings</div><h1 className="display wipe">Your study space.</h1><p className="lead">Everything is stored in this browser. Export a backup before switching devices or clearing site data.</p></div>
      {storage.state === "error" && <div className="notice" role="alert">{storage.message} <button type="button" className="link" onClick={download}>Export a backup</button> · <button type="button" className="link" onClick={flushProgress}>Retry saving</button></div>}
      <div className="grid-cards settings-grid">
        <div className="cell span-2">
          <ExamDatePicker value={s.examDate} onChange={(d) => updateSettings(examDatePatch(d))} label="Target exam date" />
          <p className="muted small">Choosing a date also picks the exam version you can sit that day: v1.1 until 2 February 2027, v2.0 from 3 February 2027.{s.examDate && <> <button type="button" className="link" onClick={(e) => { (e.currentTarget.closest(".cell")?.querySelector("input[type=date]") as HTMLInputElement | null)?.focus(); updateSettings(examDatePatch("")); }}>Clear the date</button></>}</p>
        </div>
        <label className="cell field">Your name (for the greeting)<input value={s.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="optional" /></label>
        <label className="cell field">Exam version
          <select value={s.track} onChange={(e) => updateSettings({ track: e.target.value as "v1" | "v2" })}><option value="v2">200-301 v2.0 (from 3 Feb 2027)</option><option value="v1">200-301 v1.1 (until 2 Feb 2027)</option></select>
        </label>
        <label className="cell field">Appearance
          <select value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as "system" | "dark" | "light" })}><option value="system">Follow system</option><option value="dark">Dark</option><option value="light">Light (print)</option></select>
        </label>
        <label className="cell field">Motion
          <select value={s.motion} onChange={(e) => updateSettings({ motion: e.target.value as "full" | "reduced" })}>
            <option value="full">Enabled — always animate</option>
            <option value="reduced">Disabled — minimize motion</option>
          </select>
        </label>
        <label className="cell field">New flashcards per day<input type="number" min={0} max={200} step={1} value={s.newCardsPerDay} onChange={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 0 && v <= 200) updateSettings({ newCardsPerDay: v }); }} /></label>
        <label className="cell check" style={{ alignItems: "flex-start" }}><input type="checkbox" checked={s.gateCards} onChange={(e) => updateSettings({ gateCards: e.target.checked })} /><span>Only show flashcards from chapters I have opened<br /><small className="dim">Keeps the deck in step with your reading.</small></span></label>
      </div>
      <section className="part-block">
        <div className="part-head"><h2>Favorite color</h2><small>Your accent, across the app.</small></div>
        <div className="panel"><AccentColorPicker value={s.accentColor} onChange={accentColor => updateSettings({ accentColor })} showReset /></div>
      </section>
      <section className="part-block">
        <div className="part-head"><h2>Layout</h2><small>Closed something? Turn it back on here.</small></div>
        <div className="grid-cards layout-grid">
          <label className="cell check" style={{ alignItems: "flex-start" }}><input type="checkbox" checked={s.showTicker} onChange={(e) => updateSettings({ showTicker: e.target.checked })} /><span>Scrolling ticker<br /><small className="dim">{s.showTicker ? "Shown at the top of each page. The × on it hides it." : "Hidden. Tick to bring it back."}</small></span></label>
          <label className="cell check" style={{ alignItems: "flex-start" }}><input type="checkbox" checked={!s.navCollapsed} onChange={(e) => updateSettings({ navCollapsed: !e.target.checked })} /><span>Side menu<br /><small className="dim">{s.navCollapsed ? "Hidden. Tick to bring it back, or press m." : "Wide screens. The menu button or m toggles it."}</small></span></label>
          <label className="cell check" style={{ alignItems: "flex-start" }}><input type="checkbox" checked={!s.toolsCollapsed} onChange={(e) => updateSettings({ toolsCollapsed: !e.target.checked })} /><span>Chapter tools<br /><small className="dim">{s.toolsCollapsed ? "Collapsed. Tick to open the rail on lesson pages." : "The rail beside each lesson. Its arrow button collapses it."}</small></span></label>
        </div>
      </section>
      <section className="part-block">
        <div className="part-head"><h2>Progress data</h2></div>
        <div className="panel">
        <div className="q-bar">
          <button type="button" className="btn ghost" onClick={download}>Export progress (.json)</button>
          <label className="btn ghost" style={{ cursor: "pointer" }}>Import progress<input type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) upload(file); }} /></label>
          <button type="button" className="btn ghost" style={{ borderColor: "var(--bad)", color: "var(--bad)" }} onClick={() => { if (confirm("Delete all progress in this browser? Export first if you want a backup.")) { resetAll(); setMsg("Progress cleared."); } }}>Reset everything</button>
        </div>
        {msg && <div className="notice" role="status">{msg}</div>}
        {storage.state !== "error" && <p className="muted small" role="status">{storage.state === "pending" ? "Saving changes…" : "Progress saved in this browser."}</p>}
        <p className="muted small">{Object.keys(p.chapters).length} chapters touched · {Object.keys(p.questions).length} questions answered · {Object.keys(p.cards).length} cards scheduled · {p.attempts.length} sessions.</p>
        </div>
      </section>
      <section className="part-block">
        <div className="part-head"><h2>About</h2></div>
        <div className="md panel">
          <p>OpenPackets is an independent, original study companion for the Cisco CCNA 200-301 exam — {totals.chapters} chapters, {totals.questions} practice questions, {totals.cards} flashcards, {totals.drills} command drills and {totals.tickets} troubleshooting tickets. It is not affiliated with or endorsed by Cisco; the exam blueprints are Cisco's. Sources were checked on {course.sourceCheckedOn}.</p>
          <p>Code: MIT license. Original course material: CC BY 4.0. See <a href="/licenses/README.txt" target="_blank" rel="noreferrer">licenses and attribution</a>.</p>
          <p>Exam facts: {course.exam.lengthMinutes} minutes · {course.exam.price} · {course.exam.languages.join(", ")} · certification valid {course.exam.validityYears} years · v1.1 last test date {course.exam.v1.lastTestDate} · v2.0 first test date {course.exam.v2.firstTestDate}. See <a href={course.exam.examPageUrl} target="_blank" rel="noreferrer">Cisco's exam page</a> and the <a href={course.exam.announcementUrl} target="_blank" rel="noreferrer">refresh announcement</a>.</p>
        </div>
      </section>
    </div>
  );
}
