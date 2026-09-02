"use client";

import { useState, useTransition } from "react";
import { Eye, X, FileDown, Loader2 } from "lucide-react";
import { getVendorDocumentUrlAction } from "@/app/admin/actions";

/**
 * Opens a document inline in a modal (iframe) instead of navigating away to
 * a new tab. Fetches the preview/download URL on open rather than taking
 * one as a prop — the real backend's link is a presigned URL that expires,
 * so it's fetched fresh per view, not attached eagerly to every row in the
 * compliance tab's list.
 */
export function DocumentPreviewModal({ vendorId, documentId, label }: { vendorId: string; documentId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openModal() {
    setOpen(true);
    setUrl(null);
    setError(null);
    startTransition(async () => {
      const result = await getVendorDocumentUrlAction(vendorId, documentId);
      if (result.error || !result.url) {
        setError(result.error ?? "Couldn't load this document.");
        return;
      }
      setUrl(result.url);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
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
              <div className="flex shrink-0 items-center gap-2">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-verified px-3 py-1.5 text-xs font-medium text-white hover:bg-verified-hover"
                  >
                    <FileDown className="size-3.5" aria-hidden />
                    Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close preview"
                  className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-cream/40">
              {pending && <Loader2 className="size-6 animate-spin text-text-muted" aria-hidden />}
              {error && <p className="px-6 text-center text-sm text-[#c0392b]">{error}</p>}
              {url && <iframe src={url} title={label} className="size-full" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
