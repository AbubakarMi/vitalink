import Link from "next/link";
import Image from "next/image";
import { ImageOff, ShieldCheck, Star } from "lucide-react";
import type { MarketplaceProductCard as MarketplaceProductCardData } from "@/lib/api/marketplace";

/** Grid card for the real catalog — "From ₦X · N offers" rather than one
 * price, since a product can have several vendor offers (the Buy Box
 * design's grid-level counterpart — see components/marketplace/buy-box.tsx). */
export function LiveProductCard({ product }: { product: MarketplaceProductCardData }) {
  const symbol = product.currency === "NGN" ? "N" : `${product.currency} `;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-ink/40"
    >
      <div className="relative aspect-square bg-cream">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            className="object-contain p-6 transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff className="size-8 text-text-muted" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="truncate">{product.brandName}</span>
          {product.brandIsVerified && <ShieldCheck className="size-3 shrink-0 text-verified" aria-hidden />}
        </div>
        <p className="line-clamp-2 text-sm font-medium text-ink">{product.name}</p>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Star className="size-3 fill-signal text-signal" aria-hidden />
            {product.rating.toFixed(1)} ({product.reviewCount})
          </div>
        )}
        <div className="mt-auto pt-2">
          <p className="font-[family-name:var(--font-newsreader)] text-lg text-ink">
            From {symbol}
            {product.startingPrice.toLocaleString("en-NG")}
          </p>
          <p className="text-xs text-text-muted">
            {product.offerCount} offer{product.offerCount === 1 ? "" : "s"}
            {product.cheapestOfferCondition ? ` · ${product.cheapestOfferCondition}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
