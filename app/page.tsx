import { AppFrame } from "@/components/app-frame";
import { OfferAnalyzer } from "@/components/offer-analyzer";

export default function Home() {
  return (
    <AppFrame>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-start px-4 py-6 sm:justify-center sm:px-8 sm:py-14">
        <header className="animate-rise mb-7 text-center sm:mb-10">
          <h1 className="font-[family-name:var(--font-display)] metal-text text-[clamp(3.25rem,18vw,8rem)] leading-none tracking-[0.06em] sm:tracking-[0.08em]">
            COUNTER
          </h1>
          <p className="animate-rise-delay mx-auto mt-3 max-w-[18rem] font-mono text-xs leading-5 tracking-[0.14em] text-metal uppercase sm:mt-4 sm:max-w-none sm:text-sm sm:tracking-[0.18em] sm:text-base">
            never take the first number again.
          </p>
        </header>

        <section
          aria-labelledby="how-to-use"
          className="animate-rise-delay mb-5 border border-steel/40 bg-surface-input/80 px-4 py-4 sm:mb-6 sm:px-5 sm:py-5"
        >
          <h2
            id="how-to-use"
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent"
          >
            How to use COUNTER
          </h2>
          <ol className="mt-3 space-y-2 font-mono text-[13px] leading-6 text-metal-bright/90 sm:text-sm sm:leading-7">
            <li className="flex gap-2.5">
              <span className="shrink-0 text-metal">1.</span>
              <span>Describe the first offer you received</span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 text-metal">2.</span>
              <span>Click Analyze Offer</span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 text-metal">3.</span>
              <span>
                Review your Walk-away, Target, Stretch numbers and the counter
                script
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 text-metal">4.</span>
              <span>
                Optionally regenerate the script or practice with Sparring
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 text-metal">5.</span>
              <span>Save important analyses to your Vault</span>
            </li>
          </ol>
        </section>

        <OfferAnalyzer />
      </main>
    </AppFrame>
  );
}
