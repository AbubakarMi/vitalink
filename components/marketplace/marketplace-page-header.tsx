import { VitalsWaveform } from "@/components/marketing/vitals-waveform";

/**
 * Replaces the old Jumbotron — a 334px pale-green banner with nothing in it
 * but centered static text (Figma EZER-KEY node 1340:441). Kept as a dark
 * ink accent band (matching the reference's own dark CTA/feature-card
 * panels within an otherwise light page) rather than another white section,
 * with a live result count instead of decoration and the site's
 * vitals-trace signature as a divider.
 */
export function MarketplacePageHeader({ resultCount }: { resultCount: number }) {
  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-ink px-10 py-10 text-white sm:px-14">
      <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-signal uppercase">
        Catalog
      </span>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-[family-name:var(--font-newsreader)] text-5xl leading-[1.1] tracking-[-0.02em] sm:text-6xl">
          Marketplace
        </h1>
        <p className="text-sm text-white/60">
          <span className="text-white">{resultCount.toLocaleString("en-NG")}</span> verified listings
        </p>
      </div>
      <VitalsWaveform cycles={7} strokeWidth={1.5} ghostOpacity={0.25} className="mt-6 h-6 text-signal opacity-70" />
    </div>
  );
}
