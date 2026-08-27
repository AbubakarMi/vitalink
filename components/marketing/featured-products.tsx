import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCarousel } from "@/components/marketing/product-carousel";
import { listProducts } from "@/lib/api/products";

/**
 * Originally Figma EZER-KEY node 1707:7213's "Based on your recent
 * Activities" section, renamed "Featured products" since per-user
 * activity-based recommendations don't exist for an anonymous visitor
 * (design doc §8/§9 — no fabricated personalization). Restyled in the
 * landing-page redesign; still backed by the same mocked lib/api/products.ts
 * used by /products (design doc §1). A horizontal scroll carousel
 * (components/marketing/product-carousel.tsx) rather than a fixed 3-up grid,
 * so there's real content to scroll through instead of a static row.
 */
const FEATURED_COUNT = 10;

export async function FeaturedProducts() {
  const products = (await listProducts()).slice(0, FEATURED_COUNT);

  return (
    <section className="bg-paper px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
              Featured
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-newsreader)] text-4xl leading-[1.1] tracking-[-0.02em] text-ink">
              In active demand
            </h2>
            <p className="mt-2 max-w-md text-ink-soft">
              What procurement teams are ordering most right now, straight from verified vendor stock.
            </p>
          </div>
          <Link
            href="/products"
            aria-label="Browse the marketplace"
            className="flex items-center gap-2 text-sm font-medium text-verified transition-colors hover:text-verified-hover"
          >
            View all
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8">
          <ProductCarousel products={products} />
        </div>
      </div>
    </section>
  );
}
