import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/marketplace/add-to-cart-button";
import type { Product } from "@/lib/api/products";

/** Marketplace grid card — Figma EZER-KEY node 1340:478. Richer than the
 * landing page's compact ProductCard (brand, stock/trend badges, category
 * pill, discount, add-to-cart) — kept as a separate component rather than
 * overloading one card with two visual styles. */
export function MarketplaceProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-3 transition-shadow hover:shadow-[0_8px_24px_rgba(0,39,8,0.08)]">
      <Link
        href={`/products/${product.slug}`}
        className="relative flex h-[248px] items-center justify-center rounded-xl bg-[#f4f4f2]"
      >
        {product.trendPercent !== undefined && (
          <span
            className={`absolute top-3 left-3 rounded-[5px] px-2 py-1 text-xs font-bold ${
              product.trendPercent >= 0 ? "bg-[#e6f4ea] text-[#8bc34a]" : "bg-[#fff0ee] text-[#ff4141]"
            }`}
          >
            {product.trendPercent >= 0 ? "+" : ""}
            {product.trendPercent}%
          </span>
        )}
        {product.stockCount !== undefined && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-[5px] bg-[#5c8aff] px-2 py-1 text-xs font-bold text-[#e6f4ea]">
            <Image src="/marketplace/stock-icon.svg" alt="" width={12} height={12} aria-hidden />
            {product.stockCount}
          </span>
        )}
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt="" width={180} height={180} className="object-contain" />
        ) : (
          <div className="size-32 rounded-full bg-white" aria-hidden />
        )}
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-text-muted">{product.brand ?? "Vitalink"}</p>
        {product.brandSku && (
          <span className="rounded-lg bg-mint/50 px-3 py-1.5 text-xs font-medium text-ink-soft">
            {product.brandSku}
          </span>
        )}
      </div>

      <Link href={`/products/${product.slug}`} className="mt-2 line-clamp-2 text-lg font-bold text-ink hover:text-verified">
        {product.name}
      </Link>

      <span className="mt-3 flex w-fit items-center gap-1 rounded-full bg-mint px-2.5 py-1.5 text-[10px] font-medium text-verified">
        {product.categoryLabel ?? product.categorySlug}
      </span>

      <hr className="mt-4 border-line" />

      <div className="mt-3 flex items-end justify-between">
        <div className="flex items-baseline gap-2 font-['Reddit_Sans',_sans-serif]">
          <span className="text-xl text-ink">N{product.price.toLocaleString("en-NG")}</span>
          {product.originalPrice && (
            <span className="text-sm text-text-muted line-through">N{product.originalPrice.toLocaleString("en-NG")}</span>
          )}
        </div>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
