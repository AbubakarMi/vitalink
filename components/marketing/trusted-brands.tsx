import { listBrands } from "@/lib/api/brands";
import { getBrandLogoPath } from "@/lib/marketing/brand-logos";
import { BrandLogo } from "@/components/marketing/brand-logo";

const LEDGER = [
  { label: "Regulatory status", value: "NAFDAC & FDA verification shown on every listing" },
  { label: "Categories covered", value: "Medical equipment, lab instruments, reagents & culture media" },
  { label: "Vendor stock", value: "Live count shown before you order — no waiting to find out" },
];

/**
 * Figma EZER-KEY node 1707:7213 "Trusted Brands" section had no logos placed
 * in it — a genuinely empty gray box, and there's no licensed artwork for
 * these manufacturers' actual trademarks to place there. Rather than ship an
 * empty placeholder or invent logo marks, this renders the real brand names
 * carried in the catalog (lib/api/brands.ts) as a minimal grayscale logo
 * strip — no cards, no color, one slow-drifting row — every name shown is
 * one a customer can actually filter/search for on /products, plus the
 * concrete verification ledger this section already had.
 */
export async function TrustedBrands() {
  const brands = await listBrands();
  // Rendered twice back-to-back so the strip can loop seamlessly at -50%.
  const track = [...brands, ...brands];

  return (
    <section className="overflow-hidden bg-surface py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
        <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
          Trusted brand partners
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-newsreader)] text-3xl text-ink sm:text-4xl">
          Manufacturers stocked on Vitalink
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Every listing ties back to a real manufacturer — browse or filter the catalog by any of these brands.
        </p>
      </div>

      <div className="group/row relative mt-10 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div className="animate-brand-marquee flex w-max items-center gap-16 group-hover/row:[animation-play-state:paused]">
          {track.map((brand, i) => (
            <a
              key={`${brand}-${i}`}
              href={`/products?brand=${encodeURIComponent(brand)}`}
              className="group/logo flex shrink-0 items-center"
              aria-label={`Browse ${brand} products`}
            >
              <BrandLogo name={brand} src={getBrandLogoPath(brand)} />
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-5xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 divide-y divide-line rounded-2xl border border-line bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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
