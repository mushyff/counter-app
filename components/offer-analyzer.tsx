"use client";

import type { AnalysisResult, SparTurn } from "@/lib/types";
import { saveToVault } from "@/lib/vault";
import { useState, type FormEvent } from "react";

const MAX_REGENERATIONS = 3;

export function OfferAnalyzer() {
  const [offer, setOffer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [regensLeft, setRegensLeft] = useState(MAX_REGENERATIONS);
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedSuggestion, setCopiedSuggestion] = useState<number | null>(null);

  const [sparOpen, setSparOpen] = useState(false);
  const [sparLoading, setSparLoading] = useState(false);
  const [sparTurns, setSparTurns] = useState<SparTurn[]>([]);
  const [sparReply, setSparReply] = useState("");
  const [sparError, setSparError] = useState("");

  function resetDownstream() {
    setCopied(false);
    setSaved(false);
    setCopiedSuggestion(null);
    setRegensLeft(MAX_REGENERATIONS);
    setSparOpen(false);
    setSparTurns([]);
    setSparReply("");
    setSparError("");
  }

  function clearAll() {
    setOffer("");
    setLoading(false);
    setError("");
    setResult(null);
    resetDownstream();
  }

  function onSaveToVault() {
    if (!result || saved) return;
    try {
      saveToVault(offer, result);
      setSaved(true);
    } catch {
      setError("Could not save to vault on this device.");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    resetDownstream();
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: offer }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Analyze failed.");
      }
      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyze failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyScript() {
    if (!result?.counterScript) return;
    try {
      await navigator.clipboard.writeText(result.counterScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the script and copy manually.");
    }
  }

  async function copySuggestion(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestion(index);
      setSparReply(text);
      window.setTimeout(() => setCopiedSuggestion(null), 2000);
    } catch {
      setSparError("Could not copy suggestion.");
    }
  }

  async function onRegenerate() {
    if (!result || regenerating || regensLeft <= 0) return;
    setRegenerating(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: offer, brief: result }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Regenerate failed.");
      }
      setResult({ ...result, counterScript: String(data.counterScript) });
      setRegensLeft((n) => n - 1);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate failed.");
    } finally {
      setRegenerating(false);
    }
  }

  async function openSpar() {
    if (!result || sparLoading) return;
    setSparOpen(true);
    setSparError("");

    if (sparTurns.length > 0) return;

    setSparLoading(true);
    try {
      const res = await fetch("/api/spar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: offer, brief: result }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start sparring.");
      }
      setSparTurns([
        { role: "opponent", content: String(data.opponentMessage) },
      ]);
    } catch (err) {
      setSparError(
        err instanceof Error ? err.message : "Could not start sparring.",
      );
    } finally {
      setSparLoading(false);
    }
  }

  async function sendSparReply(event: FormEvent) {
    event.preventDefault();
    if (!result || sparLoading) return;
    const reply = sparReply.trim();
    if (!reply) return;

    const history = sparTurns;
    const nextTurns: SparTurn[] = [...history, { role: "user", content: reply }];
    setSparTurns(nextTurns);
    setSparReply("");
    setSparError("");
    setSparLoading(true);

    try {
      const res = await fetch("/api/spar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: offer,
          brief: result,
          history,
          userReply: reply,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Spar reply failed.");
      }
      const suggestions = Array.isArray(data.suggestedReplies)
        ? data.suggestedReplies.map((item: unknown) => String(item))
        : [];

      setSparTurns((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "user") {
          updated[updated.length - 1] = {
            ...last,
            coachingNote: data.coachingNote
              ? String(data.coachingNote)
              : "Hold the line. Do not take the first number.",
            suggestedReplies: suggestions,
          };
        }
        updated.push({
          role: "opponent",
          content: String(data.opponentMessage),
        });
        return updated;
      });
    } catch (err) {
      setSparError(err instanceof Error ? err.message : "Spar reply failed.");
    } finally {
      setSparLoading(false);
    }
  }

  const numbers = result
    ? [
        { label: "Walk-away", value: result.walkAway },
        { label: "Target", value: result.target },
        { label: "Stretch", value: result.stretch },
        { label: "5-year cost", value: result.fiveYearCost },
      ]
    : [];

  const showClear = Boolean(offer.trim() || result || error || sparOpen);

  return (
    <div className="animate-rise-delay-2 flex w-full flex-col gap-4 sm:gap-5">
      <section className="rounded-sm border border-steel/50 bg-surface-input p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-metal">
            Offer input
          </p>
          {showClear ? (
            <button
              type="button"
              onClick={clearAll}
              disabled={loading}
              className="inline-flex min-h-10 items-center rounded-sm border border-steel/60 bg-background/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-metal transition-colors hover:border-accent/45 hover:text-accent disabled:opacity-40"
            >
              New Offer
            </button>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:gap-5">
          <label htmlFor="offer" className="sr-only">
            Paste your offer
          </label>
          <textarea
            id="offer"
            name="offer"
            rows={6}
            value={offer}
            onChange={(event) => setOffer(event.target.value)}
            disabled={loading}
            placeholder="What’s the first offer? (salary, freelance rate, rent, bid…)"
            className="min-h-36 w-full resize-y rounded-sm border border-steel/70 bg-[#0e1013] px-3.5 py-3.5 font-mono text-base leading-relaxed text-foreground placeholder:text-metal/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,0,0,0.35)] outline-none transition-[border-color,box-shadow] focus:border-accent/60 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(196,181,154,0.25)] disabled:opacity-60 sm:min-h-44 sm:px-4 sm:py-4 sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={loading || offer.trim().length < 20}
            className="group relative min-h-12 w-full overflow-hidden rounded-sm border border-[#8a8378] bg-gradient-to-b from-[#d4cdc0] via-[#a89f90] to-[#6e675c] px-4 py-3.5 font-[family-name:var(--font-display)] text-xl tracking-[0.12em] text-[#1a1814] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_-1px_0_rgba(0,0,0,0.25)_inset,0_8px_24px_rgba(0,0,0,0.45)] transition-[filter,transform] hover:brightness-110 active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:brightness-100 sm:min-h-14 sm:px-6 sm:py-4 sm:text-2xl sm:tracking-[0.14em]"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <span
                    aria-hidden
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1a1814]/30 border-t-[#1a1814]"
                  />
                  Analyzing...
                </>
              ) : (
                "Analyze Offer"
              )}
            </span>
            {!loading ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            ) : null}
          </button>
        </form>
      </section>

      {loading ? (
        <div
          className="rounded-sm border border-steel/55 bg-surface-numbers px-4 py-5 sm:py-6"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent sm:tracking-[0.28em]">
            Running numbers
          </p>
          <p className="mt-2 font-mono text-xs leading-5 text-metal sm:text-sm">
            Extracting the offer, building bands, drafting your counter…
          </p>
          <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-sm border border-steel/40 bg-gradient-to-b from-white/[0.04] to-transparent sm:h-[72px]"
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-sm border border-red-900/60 bg-red-950/40 px-4 py-3 font-mono text-sm leading-6 text-red-300"
        >
          {error}
        </p>
      ) : null}

      {result && !loading ? (
        <section className="flex flex-col gap-3" aria-live="polite">
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
            {result.fiveYearCostNote ? (
              <p className="mt-3 font-mono text-xs leading-5 text-metal/90 sm:text-[11px]">
                {result.fiveYearCostNote}
              </p>
            ) : null}
          </div>

          <article className="rounded-sm border border-accent/30 bg-surface-script px-3.5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                  Ready-to-send counter
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-metal">
                  {regensLeft} regeneration{regensLeft === 1 ? "" : "s"} left
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={copyScript}
                  className="min-h-11 rounded-sm border border-steel/70 bg-[#12100e]/70 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-metal-bright transition-colors hover:border-accent/50 hover:text-accent sm:min-h-0 sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={regenerating || regensLeft <= 0}
                  className="min-h-11 rounded-sm border border-steel/70 bg-[#12100e]/70 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-metal-bright transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-steel/70 disabled:hover:text-metal-bright sm:min-h-0 sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]"
                >
                  {regenerating ? "Regenerating…" : "Regenerate Script"}
                </button>
              </div>
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[15px] leading-7 text-foreground sm:text-sm">
              {result.counterScript}
            </pre>
          </article>

          <button
            type="button"
            onClick={onSaveToVault}
            disabled={saved}
            className="min-h-12 w-full rounded-sm border border-accent/40 bg-accent/10 px-4 py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-accent transition-colors hover:border-accent/70 hover:bg-accent/15 disabled:cursor-default disabled:border-steel/50 disabled:bg-panel/80 disabled:text-metal sm:text-[11px] sm:tracking-[0.22em]"
          >
            {saved ? "Saved to Vault" : "Save to Vault"}
          </button>

          <div className="pt-1">
            {!sparOpen ? (
              <button
                type="button"
                onClick={openSpar}
                className="min-h-12 w-full rounded-sm border border-steel/60 bg-surface-spar px-4 py-3.5 font-mono text-xs uppercase tracking-[0.18em] text-metal-bright transition-colors hover:border-accent/45 hover:text-accent sm:text-[11px] sm:tracking-[0.22em]"
              >
                Spar with the other side
              </button>
            ) : (
              <div className="rounded-sm border border-steel/55 bg-surface-spar shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between gap-3 border-b border-steel/40 px-3 py-2.5 sm:px-4 sm:py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                    Sparring
                  </p>
                  <button
                    type="button"
                    onClick={() => setSparOpen(false)}
                    className="inline-flex min-h-11 items-center px-2 font-mono text-xs uppercase tracking-[0.18em] text-metal hover:text-foreground sm:min-h-0 sm:text-[10px]"
                  >
                    Close
                  </button>
                </div>

                <div className="flex max-h-[min(60vh,26rem)] flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-4 sm:max-h-[24rem] sm:px-4">
                  {sparTurns.length === 0 && sparLoading ? (
                    <p className="font-mono text-xs text-metal">
                      Other side is preparing pushback…
                    </p>
                  ) : null}

                  {sparTurns.map((turn, index) => (
                    <div
                      key={`${turn.role}-${index}`}
                      className="flex flex-col gap-1.5"
                    >
                      {turn.role === "user" ? (
                        <>
                          <div className="ml-2 rounded-sm border border-accent/25 bg-accent/10 px-3 py-2.5 sm:ml-6">
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                              You
                            </p>
                            <p className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[15px] leading-6 text-foreground sm:text-sm">
                              {turn.content}
                            </p>
                          </div>
                          {turn.coachingNote ? (
                            <p className="ml-2 border-l border-accent/40 pl-3 font-mono text-xs leading-5 text-accent/90 sm:ml-6 sm:text-[11px]">
                              Feedback: {turn.coachingNote}
                            </p>
                          ) : null}
                          {turn.suggestedReplies?.length ? (
                            <div className="ml-2 flex flex-col gap-2 sm:ml-6">
                              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-metal">
                                Strong next replies
                              </p>
                              {turn.suggestedReplies.map((suggestion, sIndex) => {
                                const key = index * 10 + sIndex;
                                return (
                                  <div
                                    key={key}
                                    className="rounded-sm border border-steel/50 bg-[#101318] px-3 py-2.5"
                                  >
                                    <p className="whitespace-pre-wrap break-words font-mono text-[14px] leading-6 text-foreground/95 sm:text-sm">
                                      {suggestion}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copySuggestion(suggestion, key)
                                      }
                                      className="mt-2 inline-flex min-h-9 items-center rounded-sm border border-steel/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-metal-bright transition-colors hover:border-accent/50 hover:text-accent"
                                    >
                                      {copiedSuggestion === key
                                        ? "Copied"
                                        : "Copy"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="mr-2 rounded-sm border border-steel/45 bg-[#10141a] px-3 py-2.5 sm:mr-6">
                          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-metal">
                            Other side
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[15px] leading-6 text-foreground sm:text-sm">
                            {turn.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {sparLoading && sparTurns.length > 0 ? (
                    <p className="font-mono text-xs text-metal">Thinking…</p>
                  ) : null}
                </div>

                {sparError ? (
                  <p className="border-t border-red-900/40 px-3 py-2 font-mono text-xs leading-5 text-red-300 sm:px-4">
                    {sparError}
                  </p>
                ) : null}

                <form
                  onSubmit={sendSparReply}
                  className="flex flex-col gap-2 border-t border-steel/40 p-3 sm:flex-row"
                >
                  <input
                    type="text"
                    value={sparReply}
                    onChange={(event) => setSparReply(event.target.value)}
                    disabled={sparLoading}
                    placeholder="Type your reply…"
                    className="min-h-12 min-w-0 flex-1 rounded-sm border border-steel/70 bg-[#0d1014] px-3 py-3 font-mono text-base text-foreground outline-none placeholder:text-metal/50 focus:border-accent/50 disabled:opacity-50 sm:min-h-0 sm:py-2.5 sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={sparLoading || !sparReply.trim()}
                    className="min-h-12 rounded-sm border border-[#8a8378] bg-gradient-to-b from-[#d4cdc0] via-[#a89f90] to-[#6e675c] px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[#1a1814] disabled:opacity-40 sm:min-h-0 sm:py-2 sm:text-[10px]"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
