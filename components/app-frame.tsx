import Link from "next/link";
import type { ReactNode } from "react";

export function AppFrame({
  children,
  vaultActive = false,
}: {
  children: ReactNode;
  vaultActive?: boolean;
}) {
  return (
    <div className="relative flex min-h-full min-h-dvh flex-1 flex-col overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(196,181,154,0.08)_0%,_transparent_55%),linear-gradient(180deg,_#121316_0%,_#0c0d0f_45%,_#08090b_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,#fff_2px,#fff_3px)]"
      />

      <header className="relative z-20 flex items-center justify-between gap-4 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8 sm:pb-5 sm:pt-5">
        <Link
          href="/"
          className="min-h-11 min-w-11 inline-flex items-center font-[family-name:var(--font-display)] text-lg tracking-[0.18em] text-metal-bright transition-colors hover:text-foreground sm:text-xl sm:tracking-[0.2em]"
        >
          COUNTER
        </Link>
        <Link
          href="/vault"
          className={`inline-flex min-h-11 items-center px-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors sm:text-[11px] sm:tracking-[0.24em] ${
            vaultActive ? "text-accent" : "text-metal hover:text-accent"
          }`}
        >
          Vault
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </div>
  );
}
