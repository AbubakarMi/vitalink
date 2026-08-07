import { VitalsWaveform } from "@/components/marketing/vitals-waveform";

const STEPS = [
  {
    label: "Search & compare",
    copy: "Filter the catalog by category, brand, or specification to find exactly what your practice needs.",
  },
  {
    label: "Check verification",
    copy: "Every listing states its NAFDAC or FDA approval status and live stock count before you commit.",
  },
  {
    label: "Order",
    copy: "Confirm quantity and pricing, then place your order directly — no back-and-forth required.",
  },
  {
    label: "Receive & confirm",
    copy: "Follow order status and confirm receipt from your Vitalink dashboard once equipment arrives.",
  },
];

/**
 * Replaces the source design's "The Latest Innovation" section — a single
 * unrelated capsule-robot image with no real content — with the page's
 * actual value proposition. This is a genuine ordered sequence, so numbering
 * carries real information here (unlike a decorative 01/02/03 treatment).
 */
export function HowItWorks() {
  return (
    <section className="bg-surface px-10 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">How sourcing works</p>
        <h2 className="mt-2 font-[family-name:var(--font-newsreader)] text-3xl text-ink">
          From search to receiving dock.
        </h2>

        <VitalsWaveform cycles={8} strokeWidth={1} className="mt-8 h-4 text-line" />

        <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.label} className="border-t border-line pt-5">
              <span className="font-mono text-sm text-verified/60">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-semibold text-ink">{step.label}</p>
              <p className="mt-2 text-sm text-text-muted">{step.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
