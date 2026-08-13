import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NairaPrice } from "@/components/marketing/naira-price";
import { listProducts, type Product } from "@/lib/api/products";

/**
 * Originally Figma EZER-KEY node 1707:7213's "Based on your recent
 * Activities" section, renamed "Featured products" since per-user
 * activity-based recommendations don't exist for an anonymous visitor
 * (design doc §8/§9 — no fabricated personalization). Restyled in the
 * landing-page redesign; still backed by the same mocked lib/api/products.ts
 * used by /products (design doc §1).
 */
const FEATURED_COUNT = 3;

export async function FeaturedProducts() {
  const products = (await listProducts()).slice(0, FEATURED_COUNT);

  return (
    <section className="bg-paper px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between">
          <div>
            <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
              Featured
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-newsreader)] text-4xl leading-[1.1] tracking-[-0.02em] text-ink">
              In active demand
            </h2>
          </div>
          <Link
            href="/products"
            aria-label="Browse the marketplace"
            className="flex items-center gap-2 text-sm text-verified hover:text-ink"
          >
            View all
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(6,44,36,0.08)]"
    >
      <div className="relative aspect-[4/3] w-full rounded-xl bg-surface-muted">
        {product.imageUrl && (
          <Image src={product.imageUrl} alt="" fill sizes="320px" className="object-contain p-6" />
        )}
        {product.badge && (
          <Badge className="absolute top-3 right-3 rounded-full bg-mint text-[10px] text-ink-soft hover:bg-mint">
            {product.badge}
          </Badge>
        )}
      </div>
      <p className="font-semibold text-ink group-hover:text-verified">{product.name}</p>
      <div className="flex items-center justify-between">
        <NairaPrice amount={product.price} className="text-xl" />
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1 text-xs text-verified">
            Shop
            <Image
              src="/marketing/shop-arrow-1.svg"
              alt=""
              width={13}
              height={13}
              className="-rotate-90"
              aria-hidden
            />
          </span>
          {product.freeDelivery && <p className="text-xs text-text-muted">Free delivery</p>}
        </div>
      </div>
    </Link>
  );
}
