import { VitalsWaveform } from "@/components/marketing/vitals-waveform";
import { SearchBar } from "@/components/marketing/search-bar";

const QUICK_CATEGORIES = [
  { label: "Medical Equipment", slug: "medical-equipment" },
  { label: "Scientific Tools", slug: "scientific-tools" },
  { label: "Reagents & Culture Media", slug: "reagents-culture-media" },
  { label: "Lab Equipments", slug: "lab-equipment" },
];

/**
 * Hero — landing-page redesign (CEO "world class" pass, superseding pixel
 * fidelity to Figma EZER-KEY node 1707:7213). The source design's "Search by
 * intent/budget/specification" pills described an AI-search concept that
 * wasn't built at the time; components/buyer/intent-search-chat.tsx
 * ("Vitalink Intelligence") now is, so SearchBar's "AI search" mode here
 * routes to it for real instead of the earlier placeholder category links.
 *
 * The vitals trace behind the headline is the page's signature — the same
 * kind of readout our own hero product (a patient monitor) displays.
 */
export function HeroSearch() {
  return (
    <section className="relative bg-ink px-4 pt-12 pb-16 text-white sm:px-6 sm:pt-16 sm:pb-20 lg:px-10 lg:pt-16 lg:pb-24">
      <VitalsWaveform
        cycles={6}
        strokeWidth={1.5}
        className="pointer-events-none absolute inset-x-0 top-1/2 h-32 -translate-y-1/2 text-signal opacity-[0.14]"
      />

      <div className="relative mx-auto max-w-3xl">
        <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
          Verified medical &amp; laboratory procurement
        </p>

        <h1 className="mt-5 font-[family-name:var(--font-newsreader)] text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl">
          Equipment your practice can stake a diagnosis on.
        </h1>

        <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
          Search, compare, and order medical, laboratory, and diagnostic equipment from NAFDAC- and FDA-verified
          vendors — built for procurement teams who can&apos;t afford to guess.
        </p>

        <SearchBar variant="hero" />

        <div className="mt-6 flex flex-wrap gap-2">
          {QUICK_CATEGORIES.map((category) => (
            <a
              key={category.slug}
              href={`/products?categorySlug=${category.slug}`}
              className="rounded border border-white/15 px-3.5 py-2 font-mono text-xs text-white/70 transition-colors hover:border-signal hover:text-signal"
            >
              {category.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
