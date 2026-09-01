"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AdminProduct } from "@/lib/api/admin/products";

/**
 * Product review's image gallery — an admin needs to see every image a
 * vendor uploaded (primary + supporting, from the New Product wizard's
 * multi-image upload) before approving, not just the primary one. Falls
 * back to the single imageUrl for the static demo catalog, which never
 * populated more than one. Own copy of components/marketplace/
 * product-image-gallery.tsx — "components never cross role boundaries".
 */
export function ProductImageGallery({ product }: { product: AdminProduct }) {
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [{ url: product.imageUrl, isPrimary: true }]
        : [];
  const primaryIndex = Math.max(
    gallery.findIndex((img) => img.isPrimary),
    0,
  );
  const [activeIndex, setActiveIndex] = useState(primaryIndex);
  const active = gallery[activeIndex];

  return (
    <div className="w-full shrink-0 sm:w-56">
      <div className="relative aspect-square w-full rounded-xl bg-surface-muted">
        {active ? (
          <Image src={active.url} alt="" fill sizes="224px" className="object-contain p-6" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted">No image</div>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {gallery.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1}${img.isPrimary ? " (primary)" : ""}`}
              aria-current={i === activeIndex}
              className={cn(
                "relative size-11 shrink-0 overflow-hidden rounded-lg border-2 bg-surface-muted",
                i === activeIndex ? "border-ink" : "border-transparent hover:border-line",
              )}
            >
              <Image src={img.url} alt="" fill sizes="44px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
