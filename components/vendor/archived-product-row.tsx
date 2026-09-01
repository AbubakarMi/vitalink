"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { Product } from "@/lib/api/products";
import { StatusPill } from "@/components/vendor/status-pill";
import { VendorTableRow, VendorTableCell } from "@/components/vendor/vendor-table";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

/** One row on /vendor/products/archive — its own client component (not
 * inline in the page) purely so Un-archive can go through the same
 * sweet-alert confirm as every other vendor product action. */
export function ArchivedProductRow({ product, onUnarchive }: { product: Product; onUnarchive: () => Promise<void> }) {
  return (
    <VendorTableRow>
      <VendorTableCell>
        <div className="flex items-center gap-3">
          <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-cream">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt="" fill className="object-contain p-1" sizes="48px" />
            ) : (
              <ImageOff className="size-4 text-text-muted" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{product.name}</p>
            <p className="text-xs text-text-muted">SKU: {product.sku}</p>
          </div>
        </div>
      </VendorTableCell>
      <VendorTableCell>
        <span className="font-medium text-ink">N{product.price.toLocaleString("en-NG")}</span>
      </VendorTableCell>
      <VendorTableCell>{product.brand}</VendorTableCell>
      <VendorTableCell>{product.categoryLabel}</VendorTableCell>
      <VendorTableCell>
        <StatusPill status={product.status ?? "Archived"} />
      </VendorTableCell>
      <VendorTableCell>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/vendor/products/${product.id}`} className="font-medium text-verified hover:text-ink">
            View
          </Link>
          <ConfirmActionButton
            onConfirm={onUnarchive}
            tone="neutral"
            title={`Un-archive "${product.name}"?`}
            description="This puts the listing back on the marketplace, visible and purchasable by buyers again."
            confirmLabel="Yes, un-archive it"
            trigger={<button type="button" className="font-medium text-verified transition-colors hover:text-ink">Un-archive</button>}
          />
        </div>
      </VendorTableCell>
    </VendorTableRow>
  );
}
