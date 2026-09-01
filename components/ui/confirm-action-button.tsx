"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared "are you sure?" warning modal for sensitive, hard-to-reverse
 * actions — suspending a staff account, deleting a product/field, clearing a
 * cart, and so on. Lives under components/ui/ (not scoped to one role) since
 * every role needs the same gate, same as components/ui/account-menu.tsx.
 * Wraps whatever trigger element is passed in, matching the render-prop
 * shape components/admin/invite-staff-modal.tsx already established, rather
 * than prescribing one button style — the actions this gates show up as
 * icon buttons, text links, and bordered buttons across the app.
 */
export function ConfirmActionButton({
  trigger,
  title,
  description,
  confirmLabel = "Yes, continue",
  cancelLabel = "Cancel",
  tone = "danger",
  disabled = false,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" — red (delete/suspend/clear). "neutral" — amber (still worth a
   * pause, but not destructive). */
  tone?: "danger" | "neutral";
  /** Mirrors the trigger's own disabled state (e.g. a submit button disabled
   * until a form is ready) — without this the wrapping span would still open
   * the modal on a click the inner button itself ignored. */
  disabled?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      await onConfirm();
      setOpen(false);
    });
  }

  return (
    <>
      {/* display:contents — the trigger renders as if this span weren't
          there at all, so a caller's own sizing on it (w-full, flex-1, …)
          resolves against the real parent instead of this inline wrapper. */}
      <span className="contents" onClick={() => !disabled && setOpen(true)}>
        {trigger}
      </span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  tone === "danger" ? "bg-[#fff0ee] text-[#c0392b]" : "bg-[#fff7e6] text-[#a15c00]",
                )}
              >
                <AlertTriangle className="size-5" aria-hidden />
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm text-text-muted">{description}</p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className={cn(
                  "flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50",
                  tone === "danger" ? "bg-[#c0392b] hover:bg-[#a5301f]" : "bg-[#a15c00] hover:bg-[#8a4d00]",
                )}
              >
                {pending ? "Working…" : confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
