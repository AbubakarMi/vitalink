import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NairaPrice } from "@/components/marketing/naira-price";
import type { Product } from "@/lib/api/products";

/** Compact landing-page product card — used by both FeaturedProducts
 * (server) and ProductCarousel (client), so it lives in its own module with
 * no server-only imports (only the `Product` type, erased at build time) —
 * importing it from featured-products.tsx directly would pull that file's
 * server-only listProducts() into the client bundle. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-verified/30 hover:shadow-[0_12px_28px_rgba(6,44,36,0.1)]"
    >
      <div className="relative aspect-[4/3] w-full rounded-xl bg-surface-muted">
        {product.imageUrl && (
          <Image src={product.imageUrl} alt="" fill sizes="320px" className="object-contain p-6" />
        )}
        {product.categoryLabel && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-ink-soft backdrop-blur-sm">
            {product.categoryLabel}
          </span>
        )}
        {product.badge && (
          <Badge className="absolute top-3 right-3 rounded-full bg-mint text-[10px] text-ink-soft hover:bg-mint">
            {product.badge}
          </Badge>
        )}
      </div>
      <p className="line-clamp-2 font-semibold text-ink group-hover:text-verified">{product.name}</p>
      <div className="mt-auto flex items-center justify-between">
        <div>
          <NairaPrice amount={product.price} className="text-xl" />
          {product.freeDelivery && <p className="text-xs text-text-muted">Free delivery</p>}
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-verified transition-colors group-hover:bg-verified group-hover:text-white">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
