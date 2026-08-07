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
    <div className="flex flex-col rounded-[10px] bg-white p-3">
      <Link
        href={`/products/${product.slug}`}
        className="relative flex h-[248px] items-center justify-center rounded-[5px] bg-[#f4f4f2]"
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
        <p className="text-xs text-[#717975]">{product.brand ?? "Vitalink"}</p>
        {product.brandSku && (
          <span className="rounded-md bg-[#fbfbf9] px-3 py-1.5 text-xs font-medium text-[#93a1b7]">
            {product.brandSku}
          </span>
        )}
      </div>

      <Link href={`/products/${product.slug}`} className="mt-2 line-clamp-2 text-lg font-bold text-[#4a7a4a]">
        {product.name}
      </Link>

      <span className="mt-3 flex w-fit items-center gap-1 rounded-[3px] bg-[#f0ffdf] px-2.5 py-1.5 text-[10px] text-verified">
        {product.categoryLabel ?? product.categorySlug}
      </span>

      <hr className="mt-4 border-border" />

      <div className="mt-3 flex items-end justify-between">
        <div className="flex items-baseline gap-2 font-['Reddit_Sans',_sans-serif]">
          <span className="text-xl text-verified">N{product.price.toLocaleString("en-NG")}</span>
          {product.originalPrice && (
            <span className="text-sm text-[#c1c8c4] line-through">N{product.originalPrice.toLocaleString("en-NG")}</span>
          )}
        </div>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
