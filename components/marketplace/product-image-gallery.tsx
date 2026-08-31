"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/api/products";

/**
 * Product detail page's main image + thumbnail strip (Figma EZER-KEY node
 * 1591:3582's image slot didn't show a gallery, but vendors can now upload
 * more than one image per product — see app/vendor/products/new/
 * new-product-wizard.tsx — so the detail page needs somewhere to show them).
 * Falls back to the single imageUrl when a product only has one image (or
 * predates the multi-image field).
 */
export function ProductImageGallery({ product }: { product: Product }) {
  const gallery = product.images && product.images.length > 0 ? product.images : product.imageUrl ? [{ url: product.imageUrl, isPrimary: true }] : [];
  const primaryIndex = Math.max(
    gallery.findIndex((img) => img.isPrimary),
    0,
  );
  const [activeIndex, setActiveIndex] = useState(primaryIndex);
  const active = gallery[activeIndex];

  return (
    <div>
      <div className="flex h-[465px] items-center justify-center rounded-2xl bg-[#f4f4f2]">
        {active ? (
          <Image src={active.url} alt={product.name} width={327} height={309} className="object-contain" />
        ) : (
          <div className="size-40 rounded-full bg-white" aria-hidden />
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {gallery.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === activeIndex}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f4f4f2] transition-colors",
                i === activeIndex ? "border-ink" : "border-transparent hover:border-line",
              )}
            >
              <Image src={img.url} alt="" width={56} height={56} className="size-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
