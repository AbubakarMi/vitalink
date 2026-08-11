const LEDGER = [
  { label: "Regulatory status", value: "NAFDAC & FDA verification shown on every listing" },
  { label: "Categories covered", value: "Medical equipment, lab instruments, reagents & culture media" },
  { label: "Vendor stock", value: "Live count shown before you order — no waiting to find out" },
];

/**
 * Figma EZER-KEY node 1707:7213 "Trusted Brands" section had no logos placed
 * in it — a genuinely empty gray box. There are no real vendor brand marks
 * to display yet, so rather than ship (or invent) an empty placeholder, this
 * states the actual, concrete things Vitalink verifies — real content
 * instead of an unfinished-looking box.
 */
export function TrustedBrands() {
  return (
    <section className="bg-surface px-10 py-20">
      <div className="mx-auto max-w-5xl">
        <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
          What we verify
        </span>
        <div className="mt-6 grid grid-cols-1 divide-y divide-line rounded-2xl border border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {LEDGER.map((row) => (
            <div key={row.label} className="p-8">
              <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">{row.label}</p>
              <p className="mt-2 text-ink-soft">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
