"use client";

import { AnalysisSummary } from "@/components/analysis-summary";
import { AppFrame } from "@/components/app-frame";
import type { VaultEntry } from "@/lib/types";
import {
  deleteVaultEntry,
  getVaultEntry,
  listVaultEntries,
  previewOffer,
} from "@/lib/vault";
import { useEffect, useState } from "react";

export default function VaultPage() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(listVaultEntries());
    setReady(true);
  }, []);

  const selected = selectedId ? getVaultEntry(selectedId) : null;

  function refresh() {
    setEntries(listVaultEntries());
  }

  function openEntry(id: string) {
    setSelectedId(id);
  }

  function backToList() {
    setSelectedId(null);
    refresh();
  }

  function onDelete(id: string) {
    deleteVaultEntry(id);
    setSelectedId(null);
    refresh();
  }

  return (
    <AppFrame vaultActive>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16 pt-2 sm:px-8 sm:pt-4">
        <header className="mb-6 sm:mb-8">
          <h1 className="font-[family-name:var(--font-display)] metal-text text-[clamp(2.75rem,14vw,3.75rem)] tracking-[0.1em] sm:text-6xl sm:tracking-[0.12em]">
            VAULT
          </h1>
          <p className="mt-2 max-w-xs font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-metal sm:mt-3 sm:max-w-none sm:tracking-[0.22em]">
            Saved analyses on this device
          </p>
        </header>

        {!ready ? (
          <p className="font-mono text-sm text-metal">Loading vault…</p>
        ) : selected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-stretch justify-between gap-2">
              <button
                type="button"
                onClick={backToList}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm border border-steel/60 bg-panel/70 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-metal transition-colors hover:text-accent sm:flex-none sm:justify-start sm:border-0 sm:bg-transparent sm:px-0"
              >
                ← All saved
              </button>
              <button
                type="button"
                onClick={() => onDelete(selected.id)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm border border-steel/60 bg-panel/70 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-metal/80 transition-colors hover:text-red-300 sm:flex-none sm:border-0 sm:bg-transparent sm:px-0"
              >
                Delete
              </button>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
              Saved {new Date(selected.createdAt).toLocaleString()}
            </p>
            <AnalysisSummary
              brief={selected.brief}
              sourceText={selected.sourceText}
            />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-sm border border-steel/55 bg-panel/80 px-4 py-7 sm:px-5 sm:py-8">
            <p className="font-mono text-sm leading-7 text-metal">
              Empty. Analyze an offer, then hit Save to Vault.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => openEntry(entry.id)}
                  className="w-full rounded-sm border border-steel/55 bg-gradient-to-b from-[#1a1b1e] to-panel px-3.5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:border-accent/40 sm:px-4"
                >
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                    <p className="break-words font-[family-name:var(--font-display)] text-2xl tracking-[0.04em] text-metal-bright sm:text-xl sm:text-right">
                      {entry.brief.target}
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-[15px] leading-6 text-foreground/85 sm:text-sm">
                    {previewOffer(entry.sourceText)}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-accent/80">
                    Open full analysis →
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppFrame>
  );
}
