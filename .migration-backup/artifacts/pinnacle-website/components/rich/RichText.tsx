"use client";
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type Segment = { kind: "text"; value: string } | { kind: "math"; value: string; display: boolean };

function tokenize(input: string): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  let buf = "";
  const flushText = () => { if (buf) { out.push({ kind: "text", value: buf }); buf = ""; } };

  while (i < input.length) {
    const c = input[i];
    if (c === "\\" && (input[i + 1] === "$" || input[i + 1] === "\\")) {
      buf += input[i + 1];
      i += 2;
      continue;
    }
    if (c === "$" && input[i + 1] === "$") {
      const end = input.indexOf("$$", i + 2);
      if (end === -1) { buf += "$$"; i += 2; continue; }
      flushText();
      out.push({ kind: "math", value: input.slice(i + 2, end), display: true });
      i = end + 2;
      continue;
    }
    if (c === "$") {
      const end = input.indexOf("$", i + 1);
      if (end === -1) { buf += c; i += 1; continue; }
      flushText();
      out.push({ kind: "math", value: input.slice(i + 1, end), display: false });
      i = end + 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  flushText();
  return out;
}

/**
 * Renders text with embedded LaTeX. Use $...$ for inline math and $$...$$ for block math.
 * Escape literal dollars with \$. Plain newlines render as line breaks.
 */
export function RichText({ children, className = "" }: { children: string | null | undefined; className?: string }) {
  const text = children ?? "";
  const segments = useMemo(() => tokenize(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.kind === "text") {
          const lines = seg.value.split("\n");
          return (
            <span key={idx}>
              {lines.map((line, li) => (
                <span key={li}>
                  {li > 0 && <br />}
                  {line}
                </span>
              ))}
            </span>
          );
        }
        let html: string | null = null;
        try {
          html = katex.renderToString(seg.value, {
            displayMode: seg.display,
            throwOnError: false,
            errorColor: "var(--color-maroon)",
            strict: "ignore",
            output: "html",
          });
        } catch {
          html = null;
        }
        if (html === null) {
          // KaTeX failed unexpectedly — render the raw source as plain (escaped) text.
          return (
            <span key={idx} className={seg.display ? "block my-2 text-[var(--color-maroon)] font-mono text-xs" : "inline text-[var(--color-maroon)] font-mono"}>
              {seg.display ? `$$${seg.value}$$` : `$${seg.value}$`}
            </span>
          );
        }
        return (
          <span
            key={idx}
            className={seg.display ? "block my-2" : "inline"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}
