import Image from "next/image";
import { ImageOff, ShieldCheck, Star } from "lucide-react";
import type { MarketplaceProductDetails } from "@/lib/api/marketplace";
import { BuyBox } from "./buy-box";

/**
 * Real product + offers (lib/api/marketplace.ts), rendered with the "Buy
 * Box" design (see app/(marketplace)/products/[slug]/page.tsx's branch on
 * PRODUCTS_DATA_SOURCE). Own tree from the mock catalog's ProductHero/
 * ProductDetailTabs/ProductReviews — a genuinely different shape (Product +
 * Offer[], not a flat mocked Product), not a role-boundary duplicate.
 */
export function LiveProductDetail({ product }: { product: MarketplaceProductDetails }) {
  const images = [product.primaryImageUrl, ...product.additionalImageUrls].filter((url): url is string => Boolean(url));
  const currency = product.offers[0]?.currency ?? "NGN";
  // Every offer's own review list, flattened — the product itself has a
  // ratingSummary but no single combined review feed on this response.
  const allReviews = product.offers.flatMap((offer) => offer.reviews);

  return (
    <main className="mx-auto max-w-[1282px] space-y-10 px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-cream">
            {images[0] ? (
              <Image src={images[0]} alt={product.name} fill className="object-contain p-6" sizes="(max-width: 1024px) 100vw, 600px" priority />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageOff className="size-10 text-text-muted" aria-hidden />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((url, i) => (
                <div key={url + i} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-cream">
                  <Image src={url} alt="" fill className="object-contain p-2" sizes="120px" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>{product.category.name}</span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1">
              {product.brand.name}
              {product.brand.isVerified && <ShieldCheck className="size-3.5 text-verified" aria-hidden />}
            </span>
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">{product.name}</h1>
          {product.ratingSummary.reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
              <Star className="size-4 fill-signal text-signal" aria-hidden />
              {product.ratingSummary.average.toFixed(1)} ({product.ratingSummary.reviewCount} review
              {product.ratingSummary.reviewCount === 1 ? "" : "s"})
            </div>
          )}
          {product.shortDescription && <p className="mt-3 text-sm text-text-muted">{product.shortDescription}</p>}

          <div className="mt-5">
            <BuyBox offers={product.offers} currency={currency} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[717fr_565fr]">
        <div className="space-y-6">
          {product.description && (
            <div className="rounded-2xl border border-line p-6">
              <h2 className="text-lg font-semibold text-ink">Description</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-text-muted">{product.description}</p>
            </div>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="rounded-2xl border border-line p-6">
              <h2 className="text-lg font-semibold text-ink">Specifications</h2>
              <dl className="mt-3 space-y-2">
                {Object.entries(product.specifications).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-line/60 pb-2 text-sm last:border-0 last:pb-0">
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="text-right text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.countryOfOrigin && (
            <div className="rounded-2xl border border-line p-6">
              <h2 className="text-lg font-semibold text-ink">Origin</h2>
              <p className="mt-2 text-sm text-text-muted">{product.countryOfOrigin}</p>
            </div>
          )}

          {product.certifications.length > 0 && (
            <div className="rounded-2xl border border-line p-6">
              <h2 className="text-lg font-semibold text-ink">Certifications</h2>
              <ul className="mt-2 space-y-1.5">
                {product.certifications.map((cert) => (
                  <li key={cert.certificationId} className="flex items-center gap-2 text-sm text-ink">
                    <ShieldCheck className="size-4 shrink-0 text-verified" aria-hidden />
                    {cert.name}
                    {cert.referenceId && <span className="text-text-muted">· {cert.referenceId}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Reviews ({allReviews.length})</h2>
          {allReviews.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No reviews yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {allReviews.map((review, i) => (
                <div key={i} className="rounded-2xl border border-line p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink">{review.reviewerName}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, j) => (
                        <Star key={j} className={`size-3.5 ${j < review.rating ? "fill-signal text-signal" : "text-line"}`} aria-hidden />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {new Date(review.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  {review.comment && <p className="mt-2 text-sm text-text-muted">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
