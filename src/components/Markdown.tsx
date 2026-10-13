import { memo, useMemo, useState } from "react";
import { cliCopyText, cliLines, parseBlocks, type Block } from "@/lib/markdown";
import Diagram from "./Diagram";

export function CodeBlock({ lang, title, text }: { lang: string; title?: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const isCli = lang === "ios" || lang === "output";
  const lines = useMemo(() => (isCli ? cliLines(text, lang) : null), [text, lang, isCli]);
  const copy = async () => {
    try {
      // Match the displayed command text without prompts or teaching annotations.
      const payload = lang === "ios" ? cliCopyText(text) : text;
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  const header = title || (lang === "ios" ? "configuration" : lang === "output" ? "output" : lang !== "text" ? lang : "");
  return (
    <div className={`cli-block lang-${lang}`}>
      {(header || lang === "ios") && (
        <div className="cli-head">
          <span className="cli-title">{header}</span>
          {lang === "ios" && <span className="cli-kind">commands</span>}
          {lang === "output" && <span className="cli-kind">show output</span>}
          <button type="button" className="cli-copy" onClick={copy} aria-label="Copy to clipboard">{copied ? "Copied" : "Copy"}</button>
        </div>
      )}
      <pre>
        {lines
          ? lines.map((l, i) => (
              <div key={i} className={`cli-line ${l.kind}${l.highlight ? " hl" : ""}`}>
                <span dangerouslySetInnerHTML={{ __html: l.html || " " }} />
                {l.note && <span className="cli-note">← {l.note}</span>}
              </div>
            ))
          : <code>{text}</code>}
      </pre>
    </div>
  );
}

const CALLOUT_LABEL: Record<string, string> = { facts: "Key facts", trap: "Exam trap", note: "Note", tip: "Tip", warning: "Warning", expected: "What you should see", device: "Device" };

export const Blocks = memo(function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "md") return <div key={i} className="md" dangerouslySetInnerHTML={{ __html: b.html }} />;
        if (b.type === "code") return <CodeBlock key={i} lang={b.lang} title={b.title} text={b.text} />;
        if (b.type === "diagram") return <Diagram key={i} spec={b.spec} />;
        if (b.name === "solution") return (
          <details key={i} className="callout callout-expected">
            <summary className="callout-label">{b.title || "Check your answer"}</summary>
            <Blocks blocks={b.blocks} />
          </details>
        );
        return (
          <aside key={i} className={`callout callout-${b.name}`}>
            <div className="callout-label">{b.title || CALLOUT_LABEL[b.name] || b.name}</div>
            <Blocks blocks={b.blocks} />
          </aside>
        );
      })}
    </>
  );
});

function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  return <Blocks blocks={blocks} />;
}

export default memo(Markdown);
