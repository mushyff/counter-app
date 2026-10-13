import { AppFrame } from "@/components/app-frame";
import { OfferAnalyzer } from "@/components/offer-analyzer";

export default function Home() {
  return (
    <AppFrame>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-start px-4 py-6 sm:justify-center sm:px-8 sm:py-14">
        <header className="animate-rise mb-7 text-center sm:mb-12">
          <h1 className="font-[family-name:var(--font-display)] metal-text text-[clamp(3.25rem,18vw,8rem)] leading-none tracking-[0.06em] sm:tracking-[0.08em]">
            COUNTER
          </h1>
          <p className="animate-rise-delay mx-auto mt-3 max-w-[18rem] font-mono text-xs leading-5 tracking-[0.14em] text-metal uppercase sm:mt-4 sm:max-w-none sm:text-sm sm:tracking-[0.18em] sm:text-base">
            never take the first number again.
          </p>
        </header>

        <OfferAnalyzer />
      </main>
    </AppFrame>
  );
}
