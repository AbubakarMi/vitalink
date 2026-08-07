import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NairaPrice } from "@/components/marketing/naira-price";
import { listProducts, type Product } from "@/lib/api/products";

/**
 * Figma EZER-KEY node 1707:7213's "Based on your recent Activities" section,
 * renamed "Featured products" — that section showed per-user activity-based
 * recommendations, which don't exist for an anonymous visitor on the public
 * landing page (design doc §8/§9 — no fabricated personalization). Backed by
 * the same mocked lib/api/products.ts used by /products (design doc §1).
 */
const FEATURED_COUNT = 3;

export async function FeaturedProducts() {
  const products = (await listProducts()).slice(0, FEATURED_COUNT);

  return (
    <section className="mx-auto max-w-5xl px-10 py-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0f3e17]">Featured products</h2>
        <Link href="/products" aria-label="Browse the marketplace" className="flex items-center gap-2 text-accent">
          <ArrowRight className="size-5" aria-hidden />
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-surface p-4">
      <div className="relative aspect-[4/3] w-full rounded-[5px] bg-surface-muted">
        <Image
          src="/marketing/badge-icon-1.svg"
          alt=""
          width={12}
          height={12}
          className="absolute top-3 left-3"
          aria-hidden
        />
        {product.badge && (
          <Badge className="absolute top-3 right-3 rounded-[2px] bg-[#6df5e1] text-[#0f3e17] hover:bg-[#6df5e1]">
            {product.badge}
          </Badge>
        )}
      </div>
      <p className="font-bold text-[#4a7a4a]">{product.name}</p>
      <div className="flex items-center justify-between">
        <NairaPrice amount={product.price} className="text-xl" />
        <div className="flex flex-col items-end">
          <Link href={`/products/${product.slug}`} className="flex items-center gap-1 text-verified">
            Shop
            <Image
              src="/marketing/shop-arrow-1.svg"
              alt=""
              width={13}
              height={13}
              className="-rotate-90"
              aria-hidden
            />
          </Link>
          {product.freeDelivery && <p className="text-xs text-[#385650]">Free delivery</p>}
        </div>
      </div>
    </div>
  );
}
