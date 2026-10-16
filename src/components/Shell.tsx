import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { chapters, objectiveText } from "@/lib/course";
import { href, navigate, navigateToAnchor, useRoute } from "@/lib/router";
import { getProgress, updateSettings, useProgress } from "@/lib/store";
import { continueChapter, daysToExam, streak, trackLabel } from "@/lib/plan";
import { domainMastery } from "@/lib/mastery";
import { Kbd } from "./ui";
import { ExamDateDialog } from "./ExamDate";
import { MOBILE_QUERY, useMedia } from "@/lib/useMedia";
import type { Progress } from "@/lib/types";

const NAV: [string, string, string][] = [
  ["", "Today", "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"],
  ["chapters", "Chapters", "M4 5h16v14H4zM8 9h8M8 13h5"],
  ["practice", "Practice", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01"],
  ["cards", "Flashcards", "M3 6h18v12H3zM7 6V4M17 6V4"],
  ["subnetting", "Subnetting", "M4 7h16M4 12h10M4 17h6"],
  ["drill", "Command drill", "M4 17l6-6-6-6M12 19h8"],
  ["tickets", "Tickets", "M12 3l9 16H3zM12 10v4M12 17h.01"],
  ["plan", "Study plan", "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4"],
  ["blueprint", "Blueprint map", "M4 19V5M4 19h16M8 15V9M12 15V7M16 15v-4"],
  ["settings", "Settings", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"],
];

/** Ticker scroll speed in pixels per second — slow enough to read, calm enough to ignore. */
const TICKER_SPEED = 32;
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const MENU_CLOSE_DELAY = 180;

function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

interface Hit { label: string; sub: string; to: string; chapterId?: string }

function useSearch(query: string): Hit[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: Hit[] = [];
    for (const c of chapters) {
      if (c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q) || c.id.includes(q)) hits.push({ label: `${String(c.number).padStart(2, "0")} · ${c.title}`, sub: c.subtitle, to: href("chapter", c.id) });
      for (const s of c.sections) if (s.id !== "intro" && s.title.toLowerCase().includes(q)) hits.push({ label: s.title, sub: `Section · ${c.title}`, to: href("chapter", c.id) + "#" + s.id, chapterId: c.id });
      for (const d of c.commands) if (d.answer.toLowerCase().includes(q)) hits.push({ label: d.answer, sub: `${d.mode} · ${c.title}`, to: href("chapter", c.id, "drill") });
    }
    for (const [tag, text] of objectiveText) if (tag.includes(q) || text.toLowerCase().includes(q)) hits.push({ label: `${tag.replace(":", " ")} — ${text}`, sub: "Blueprint objective", to: href("blueprint") });
    return hits.slice(0, 12);
  }, [query]);
}

function Palette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const hits = useSearch(q);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const go = (h: Hit) => {
    onClose();
    const [hash, anchor] = h.to.split(/#(?=[^/])/);
    if (anchor) navigateToAnchor(hash, "s-" + anchor, h.chapterId);
    else window.location.hash = hash.replace(/^#/, "");
  };
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-label="Search" onMouseDown={(e) => e.stopPropagation()}>
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Search chapters, sections, commands, objectives…"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(hits.length - 1, s + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            if (e.key === "Enter" && hits[sel]) go(hits[sel]);
            if (e.key === "Escape") onClose();
          }} />
        <ul>
          {hits.map((h, i) => <li key={h.to + h.label} className={i === sel ? "sel" : ""} onMouseEnter={() => setSel(i)} onClick={() => go(h)}><b>{h.label}</b><small>{h.sub}</small></li>)}
          {q && !hits.length && <li className="empty">No matches.</li>}
        </ul>
        <div className="palette-foot"><Kbd>↑↓</Kbd> move <Kbd>↵</Kbd> open <Kbd>esc</Kbd> close</div>
      </div>
    </div>
  );
}

function tickerItems(p: Progress): string[] {
  const track = p.settings.track;
  const c = continueChapter(p);
  const days = daysToExam(p);
  const weakest = domainMastery(p, track).filter((d) => d.weakest).sort((a, b) => a.score - b.score)[0]?.weakest;
  const st = streak(p);
  const items = [
    c ? `Next · ${String(c.number).padStart(2, "0")} ${c.title}` : "Start with chapter 00",
    ...(c ? c.objectives[track].filter((o) => !o.includes(".") || o.split(".").length === 2).slice(0, 3).map((o) => `${o} ${objectiveText.get(track + ":" + o) ?? ""}`) : []),
    days === null ? "Set your exam date in Settings" : days < 0 ? "Your exam date has passed · update it in Settings" : days === 0 ? "Exam day · good luck" : `${days} day${days === 1 ? "" : "s"} until your exam`,
    weakest ? `Weakest · ${weakest.id} ${weakest.text}` : "Practice to find your weak spots",
    `Streak · ${st} day${st === 1 ? "" : "s"}`,
  ];
  return items.map((t) => t.replace(/\s+/g, " ").trim());
}

/**
 * A seamless marquee. One "set" of items is measured, enough copies are rendered to cover the bar
 * plus one, and the track is moved by exactly one set width per loop, so there is never a gap.
 * Driven by the Web Animations API so a change of text or width keeps the current scroll position
 * instead of jumping.
 */
function Ticker({ hidden, away, blocked, onHide, onFocusOut }: { hidden: boolean; away: boolean; blocked: boolean; onHide: () => void; onFocusOut: () => void }) {
  const p = useProgress(p => p, (a, b) => a.questions === b.questions && a.chapters === b.chapters && a.activity === b.activity && a.settings === b.settings);
  // Only recompute when the inputs change (mastery scans every answered question).
  const text = useMemo(() => tickerItems(p), [p.questions, p.chapters, p.activity, p.settings]); // eslint-disable-line react-hooks/exhaustive-deps
  // Motion is controlled by the learner's explicit Enabled / Disabled choice.
  const reduced = p.settings.motion === "reduced";
  const viewport = useRef<HTMLDivElement>(null);
  const trackEl = useRef<HTMLDivElement>(null);
  const firstSet = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const [hovering, setHovering] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState(0);
  const [copies, setCopies] = useState(2);

  useLayoutEffect(() => {
    const vp = viewport.current;
    const set = firstSet.current;
    if (!vp || !set) return;
    const measure = () => {
      const w = set.getBoundingClientRect().width;
      const v = vp.getBoundingClientRect().width;
      if (w <= 0) return;
      setSetWidth(w);
      setCopies(Math.max(2, Math.ceil(v / w) + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    ro.observe(set);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = trackEl.current;
    const prev = anim.current;
    // Keep the current position (in px) so re-measuring never makes the text jump.
    // The animation has a constant speed, so its time gives the offset without a computed-style/layout read.
    const offset = typeof prev?.currentTime === "number" ? prev.currentTime * TICKER_SPEED / 1000 : 0;
    prev?.cancel();
    anim.current = null;
    if (!el || !setWidth || reduced || typeof el.animate !== "function") return;
    const duration = (setWidth / TICKER_SPEED) * 1000;
    const a = el.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-setWidth}px)` }], { duration, iterations: Infinity, easing: "linear" });
    a.currentTime = ((((offset % setWidth) + setWidth) % setWidth) / setWidth) * duration;
    anim.current = a;
  }, [setWidth, reduced]);

  // Visibility and hover only pause/resume the existing animation, including after a resize while off-screen.
  useEffect(() => {
    const sync = () => {
      const a = anim.current;
      if (!a) return;
      if (hidden || away || blocked || hovering || document.visibilityState !== "visible") a.pause();
      else a.play();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [setWidth, reduced, hidden, away, blocked, hovering]);

  useEffect(() => () => anim.current?.cancel(), []);

  // Going inert would drop keyboard focus to <body>; hand it to the menu button instead, as hiding does.
  const off = hidden || away || blocked;
  useLayoutEffect(() => {
    if (off && rootRef.current?.contains(document.activeElement)) onFocusOut();
  }, [off]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={rootRef} className={`ticker${hidden ? " is-hidden" : ""}`} inert={off}>
      <div
        className="ticker-viewport"
        ref={viewport}
        aria-hidden="true"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="ticker-track" ref={trackEl}>
          {Array.from({ length: copies }, (_, k) => (
            <div key={k} ref={k === 0 ? firstSet : undefined} className="ticker-set">
              {text.map((t, i) => <span key={i} className={i === 0 ? "accent" : ""}>{t}</span>)}
            </div>
          ))}
        </div>
      </div>
      <button type="button" className="ticker-hide" onClick={onHide} aria-label="Hide the ticker" title="Hide the ticker (turn it back on in Settings)">
        <Icon d="M7 7l10 10M17 7L7 17" size={14} />
      </button>
    </div>
  );
}

function isActive(id: string, path: string) {
  return id === "" ? path === "" : path === id || (id === "chapters" && path === "chapter");
}

export default function Shell({ children }: { children: ReactNode }) {
  const route = useRoute();
  const settings = useProgress(p => p.settings);
  const days = useProgress(daysToExam);
  const mobile = useMedia(MOBILE_QUERY);
  const canHover = useMedia(HOVER_QUERY);
  const [palette, setPalette] = useState(false);
  const [help, setHelp] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hoverMenu, setHoverMenu] = useState(false);
  const [away, setAway] = useState(false);
  const [toast, setToast] = useState<null | "ticker">(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const menuCloseTimer = useRef<number | null>(null);
  const pointerInMenu = useRef(false);
  const focusMenuOnOpen = useRef(false);
  const collapsed = settings.navCollapsed;
  const showTicker = settings.showTicker;
  // Hover is an optional desktop interaction; touch and coarse pointers keep the click controls.
  const hoverNav = settings.navMode === "hover" && !mobile && canHover;
  const navOpen = mobile ? menu : hoverNav ? hoverMenu : !collapsed;
  const drawerOpen = mobile && menu;

  const cancelMenuClose = () => {
    if (menuCloseTimer.current !== null) window.clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = null;
  };
  const dismissHoverMenu = () => {
    cancelMenuClose();
    focusMenuOnOpen.current = false;
    setHoverMenu(false);
  };
  const scheduleMenuClose = () => {
    if (!hoverNav) return;
    cancelMenuClose();
    menuCloseTimer.current = window.setTimeout(() => {
      menuCloseTimer.current = null;
      if (!pointerInMenu.current && !navRef.current?.contains(document.activeElement)) setHoverMenu(false);
    }, MENU_CLOSE_DELAY);
  };
  const focusMenu = () => {
    const target = navRef.current?.querySelector<HTMLElement>("a[aria-current='page']") ?? navRef.current?.querySelector<HTMLElement>("a");
    target?.focus({ preventScroll: true });
  };
  const enterMenu = (pointerType: string) => {
    if (!hoverNav || pointerType === "touch") return;
    pointerInMenu.current = true;
    cancelMenuClose();
    setHoverMenu(true);
  };
  const leaveMenu = (pointerType: string) => {
    if (!hoverNav || pointerType === "touch") return;
    pointerInMenu.current = false;
    scheduleMenuClose();
  };
  const toggleNav = (keyboard = false) => {
    if (window.matchMedia(MOBILE_QUERY).matches) setMenu((m) => !m);
    else if (hoverNav) {
      cancelMenuClose();
      focusMenuOnOpen.current = !hoverMenu && keyboard;
      setHoverMenu(!hoverMenu);
    }
    else updateSettings({ navCollapsed: !getProgress().settings.navCollapsed });
  };
  const toggleNavRef = useRef(toggleNav);
  toggleNavRef.current = toggleNav;
  const dismissHoverMenuRef = useRef(dismissHoverMenu);
  dismissHoverMenuRef.current = dismissHoverMenu;

  const hideTicker = () => {
    // The button is about to become inert; hand focus to something that stays put.
    toggleRef.current?.focus({ preventScroll: true });
    updateSettings({ showTicker: false });
    setToast("ticker");
  };

  // The ticker belongs to the top of the page: it slides away once you scroll down and returns at the top.
  // Hysteresis (hide past 48px, show again at 36px, the ticker height) stops flicker without leaving a gap above the top bar.
  useEffect(() => {
    if (!showTicker) { setAway(false); return; }
    let raf = 0;
    let lastAway = window.scrollY > 48;
    setAway(lastAway);
    const check = () => {
      raf = 0;
      const y = window.scrollY;
      const nextAway = lastAway ? y > 36 : y > 48;
      if (nextAway !== lastAway) { lastAway = nextAway; setAway(nextAway); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [showTicker]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "Escape") { setPalette(false); setHelp(false); setMenu(false); dismissHoverMenuRef.current(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]")) return;
      if (e.key === "/") { e.preventDefault(); setPalette(true); }
      else if (e.key === "m") { e.preventDefault(); toggleNavRef.current(true); }
      else if (e.key === "?") setHelp((h) => !h);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Temporary menus never carry into another page, interaction mode, or device layout.
  useEffect(() => {
    setMenu(false);
    dismissHoverMenu();
    pointerInMenu.current = false;
  }, [route.path, route.parts.join("/"), route.query.toString(), mobile, canHover, settings.navMode]);
  useEffect(() => () => cancelMenuClose(), []);

  useLayoutEffect(() => {
    if (!hoverNav || !hoverMenu || !focusMenuOnOpen.current) return;
    focusMenuOnOpen.current = false;
    focusMenu();
  }, [hoverNav, hoverMenu]);

  // Crossing the breakpoint swaps the menu between a column and a drawer; do that without animating it across the page.
  useEffect(() => {
    const mq = matchMedia(MOBILE_QUERY);
    const on = () => {
      const el = shellRef.current;
      const nav = navRef.current;
      if (!el || !nav) return;
      el.classList.add("bp-switch");
      void getComputedStyle(nav).transform;
      el.classList.remove("bp-switch");
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // When the menu closes with focus inside it, keep focus somewhere visible instead of dropping it to <body>.
  useLayoutEffect(() => {
    if (navOpen || !navRef.current?.contains(document.activeElement)) return;
    (mobile ? mainRef.current : toggleRef.current)?.focus({ preventScroll: true });
  }, [navOpen, mobile]);

  // Mobile drawer behaves like a modal: focus moves into it and the page behind neither scrolls nor takes focus.
  useLayoutEffect(() => {
    if (!drawerOpen) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    const prevGutter = root.style.scrollbarGutter;
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    const target = navRef.current?.querySelector<HTMLElement>("a[aria-current='page']") ?? navRef.current?.querySelector<HTMLElement>("a");
    target?.focus({ preventScroll: true });
    return () => {
      root.style.overflow = prevOverflow;
      root.style.scrollbarGutter = prevGutter;
    };
  }, [drawerOpen]);

  const shellClass = ["shell", showTicker ? "" : "no-ticker", showTicker && away ? "ticker-away" : "", hoverNav ? "nav-hover" : collapsed ? "nav-hidden" : ""].filter(Boolean).join(" ");
  const toggleLabel = mobile ? (menu ? "Close menu" : "Open menu") : navOpen ? "Hide menu" : "Show menu";

  return (
    <div className={shellClass} ref={shellRef}>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <Ticker hidden={!showTicker} away={away} blocked={drawerOpen} onHide={hideTicker} onFocusOut={() => toggleRef.current?.focus({ preventScroll: true })} />
      <header className="topbar">
        <button ref={toggleRef} className="nav-toggle" type="button" aria-label={toggleLabel} title={`${toggleLabel} (m)`} aria-expanded={navOpen} aria-controls="sidenav"
          onClick={(e) => toggleNav(e.detail === 0)}
          onPointerEnter={(e) => enterMenu(e.pointerType)} onPointerLeave={(e) => leaveMenu(e.pointerType)}
          onBlur={scheduleMenuClose}
          onKeyDown={(e) => {
            if (!hoverNav || e.key !== "ArrowDown") return;
            e.preventDefault();
            cancelMenuClose();
            if (hoverMenu) focusMenu();
            else { focusMenuOnOpen.current = true; setHoverMenu(true); }
          }}>
          <Icon d={mobile ? "M4 7h16M4 12h16M4 17h16" : "M3 4h18v16H3zM9 4v16"} />
        </button>
        <a className="brand" href={href()} aria-label="OpenPackets">OPENPACKETS<span aria-hidden="true">.</span></a>
        <div className="topbar-right">
          <button type="button" className="search-btn" onClick={() => setPalette(true)}><Icon d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5" /><span>Search</span><Kbd>/</Kbd></button>
        </div>
      </header>
      <nav id="sidenav" ref={navRef} className={`sidenav${menu ? " open" : ""}${hoverNav && hoverMenu ? " hover-open" : ""}`} aria-label="Main" inert={!navOpen}
        onPointerEnter={(e) => enterMenu(e.pointerType)} onPointerLeave={(e) => leaveMenu(e.pointerType)}
        onFocus={cancelMenuClose} onBlur={scheduleMenuClose}>
        <div className="sidenav-inner">
          <div className="nav-list">
            {NAV.map(([id, label, d]) => {
              const on = isActive(id, route.path);
              return <a key={id} href={href(id)} aria-current={on ? "page" : undefined} className={on ? "on" : ""} onClick={() => { setMenu(false); dismissHoverMenu(); }}><Icon d={d} /><span>{label}</span></a>;
            })}
          </div>
          <div className="nav-foot">
            <span>{trackLabel(settings.track)}</span>
            {days !== null && days >= 0 && <span>T−{days}d to your exam</span>}
          </div>
        </div>
      </nav>
      {drawerOpen && <div className="scrim" onClick={() => setMenu(false)} />}
      <main id="main" ref={mainRef} className="main" tabIndex={-1} inert={drawerOpen}>{children}</main>
      {palette && <Palette onClose={() => setPalette(false)} />}
      {help && (
        <div className="palette-backdrop" onMouseDown={() => setHelp(false)}>
          <div className="palette help" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Keyboard</h3>
            <dl>
              <dt><Kbd>/</Kbd></dt><dd>Search</dd>
              <dt><Kbd>m</Kbd></dt><dd>Show or hide the side menu</dd>
              <dt><Kbd>space</Kbd></dt><dd>Flip a flashcard</dd>
              <dt><Kbd>1</Kbd>–<Kbd>4</Kbd></dt><dd>Grade a flashcard · pick an answer</dd>
              <dt><Kbd>↵</Kbd></dt><dd>Check / next</dd>
              <dt><Kbd>?</Kbd></dt><dd>This panel</dd>
            </dl>
          </div>
        </div>
      )}
      {toast === "ticker" && (
        <div className="toast" role="status">
          <span>Ticker hidden. You can turn it back on in Settings.</span>
          <span className="actions">
            <button type="button" className="link" onClick={() => { updateSettings({ showTicker: true }); setToast(null); }}>Undo</button>
            <a className="link" href={href("settings")} onClick={() => setToast(null)}>Settings</a>
          </span>
        </div>
      )}
      <ExamDateDialog />
    </div>
  );
}

export { navigate };
