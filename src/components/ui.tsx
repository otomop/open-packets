import { useEffect, useRef, type ReactNode } from "react";
import { inlineHtml } from "@/lib/markdown";
import { CodeBlock } from "./Markdown";
import Diagram from "./Diagram";
import type { Exhibit } from "@/lib/types";

export function Eyebrow({ children, tone }: { children: ReactNode; tone?: string }) {
  return <div className={`eyebrow${tone ? " tone-" + tone : ""}`}>{children}</div>;
}

export function Inline({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: inlineHtml(text) }} />;
}

/** Adds .in when the element enters the viewport (used for cascade reveals). */
export function Reveal({ children, className = "", as: Tag = "div", stagger }: { children: ReactNode; className?: string; as?: "div" | "section" | "ul" | "ol"; stagger?: boolean }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as any;
  return <T ref={ref} className={`reveal${stagger ? " cascade" : ""} ${className}`}>{children}</T>;
}

export function Ring({ value, size = 132, label, sub }: { value: number; size?: number; label: ReactNode; sub?: ReactNode }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle className="ring-value" cx={size / 2} cy={size / 2} r={r} style={{ strokeDasharray: c, strokeDashoffset: c - (c * Math.min(100, Math.max(0, value))) / 100 }} />
      </svg>
      <div className="ring-text"><b>{label}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

export function Bar({ value, tone }: { value: number; tone?: string }) {
  return <span className="bar"><i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} className={tone ? "tone-" + tone : ""} /></span>;
}

export function ExhibitView({ exhibit }: { exhibit: Exhibit | null | undefined }) {
  if (!exhibit) return null;
  if (exhibit.kind === "cli") return <CodeBlock lang="output" title={exhibit.title ?? "exhibit"} text={exhibit.text} />;
  return <Diagram spec={exhibit.spec} compact />;
}

export const LETTERS = "ABCDEF";

export function fmtMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}
