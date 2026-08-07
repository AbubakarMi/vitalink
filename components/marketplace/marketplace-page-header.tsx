import { VitalsWaveform } from "@/components/marketing/vitals-waveform";

/**
 * Replaces the old Jumbotron — a 334px pale-green banner with nothing in it
 * but centered static text (Figma EZER-KEY node 1340:441). This is a real
 * page header instead: ink chrome matching the site's header/hero, a live
 * result count instead of decoration, and the site's vitals-trace signature
 * as a divider rather than an unrelated empty panel.
 */
export function MarketplacePageHeader({ resultCount }: { resultCount: number }) {
  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-[10px] bg-ink px-10 py-10 text-white sm:px-14">
      <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">Catalog</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-[family-name:var(--font-newsreader)] text-3xl sm:text-4xl">Marketplace</h1>
        <p className="font-mono text-sm text-white/60">
          <span className="text-white">{resultCount.toLocaleString("en-NG")}</span> verified listings
        </p>
      </div>
      <VitalsWaveform cycles={7} strokeWidth={1.5} ghostOpacity={0.25} className="mt-6 h-6 text-signal opacity-70" />
    </div>
  );
}
