"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";

/** Opens a document's previewUrl inline in a modal (iframe) instead of
 * navigating away to a new tab — admin stays on the review page. */
export function DocumentPreviewModal({ label, previewUrl }: { label: string; previewUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-verified hover:text-verified"
      >
        <Eye className="size-3.5" aria-hidden />
        Preview
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
              <p className="truncate text-sm font-semibold text-ink">{label}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close preview"
                className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <iframe src={previewUrl} title={label} className="min-h-0 flex-1" />
          </div>
        </div>
      )}
    </>
  );
}
