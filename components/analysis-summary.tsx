"use client";

import type { AnalysisResult } from "@/lib/types";
import { useState } from "react";

export function AnalysisSummary({
  brief,
  sourceText,
}: {
  brief: AnalysisResult;
  sourceText?: string;
}) {
  const [copied, setCopied] = useState(false);

  const numbers = [
    { label: "Walk-away", value: brief.walkAway },
    { label: "Target", value: brief.target },
    { label: "Stretch", value: brief.stretch },
    { label: "5-year cost", value: brief.fiveYearCost },
  ];

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(brief.counterScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {sourceText ? (
        <article className="rounded-sm border border-steel/50 bg-surface-input px-3.5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-metal">
            Original offer
          </p>
          <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[15px] leading-7 text-foreground/90 sm:text-sm">
            {sourceText}
          </pre>
        </article>
      ) : null}

      <div className="rounded-sm border border-steel/50 bg-surface-numbers p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-3.5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-metal">
          Numbers
        </p>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {numbers.map((item) => (
            <article
              key={item.label}
              className="rounded-sm border border-steel/45 bg-[#1e2126] px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-metal">
                {item.label}
              </p>
              <p className="mt-1.5 break-words font-[family-name:var(--font-display)] text-[1.55rem] leading-none tracking-[0.04em] text-metal-bright sm:text-[1.85rem]">
                {item.value}
              </p>
            </article>
          ))}
        </div>
        {brief.fiveYearCostNote ? (
          <p className="mt-3 font-mono text-xs leading-5 text-metal/90 sm:text-[11px]">
            {brief.fiveYearCostNote}
          </p>
        ) : null}
      </div>

      <article className="rounded-sm border border-accent/30 bg-surface-script px-3.5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Ready-to-send counter
          </p>
          <button
            type="button"
            onClick={copyScript}
            className="min-h-11 w-full rounded-sm border border-steel/70 bg-[#12100e]/70 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-metal-bright transition-colors hover:border-accent/50 hover:text-accent sm:min-h-0 sm:w-auto sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[15px] leading-7 text-foreground sm:text-sm">
          {brief.counterScript}
        </pre>
      </article>
    </div>
  );
}
