"use client";

import { Archive } from "lucide-react";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

/**
 * "Archive this product?" confirmation — gates the archive action since
 * archiving pulls a live listing off the marketplace (buyers can no longer
 * find/buy it) and isn't something a single misclick should do. Un-archiving
 * is the safe/reversible direction, so it doesn't get this treatment — see
 * app/vendor/products/archive/page.tsx's plain button. Thin wrapper around
 * the shared components/ui/confirm-action-button.tsx.
 */
export function ArchiveConfirmButton({
  productName,
  onArchive,
  variant = "default",
}: {
  productName: string;
  onArchive: () => Promise<void>;
  /** "default" — bordered button (product detail page). "text" — plain text
   * link styling (inventory table row). */
  variant?: "default" | "text";
}) {
  return (
    <ConfirmActionButton
      onConfirm={onArchive}
      title={`Archive "${productName}"?`}
      description="Doing so will take this product off the marketplace — it won't be available for buyers to purchase until you un-archive it later."
      confirmLabel="Yes, archive it"
      trigger={
        <button
          type="button"
          className={
            variant === "text"
              ? "font-medium text-text-muted transition-colors hover:text-[#c0392b]"
              : "flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-[#c0392b] hover:text-[#c0392b]"
          }
        >
          {variant === "default" && <Archive className="size-3.5" aria-hidden />}
          Archive
        </button>
      }
    />
  );
}
