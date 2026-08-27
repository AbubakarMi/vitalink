"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { approveProductAction, rejectProductAction } from "@/app/admin/actions";

export function ProductModerationActions({ productId }: { productId: string }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveProductAction(productId);
      if (result.error) setError(result.error);
    });
  }

  function handleDecline(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await rejectProductAction(productId, reason.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setDeclining(false);
    });
  }

  if (declining) {
    return (
      <form onSubmit={handleDecline} className="space-y-3">
        <label htmlFor="product-decline-reason" className="text-sm font-medium text-ink">
          Please kindly provide the reason for declining the request
        </label>
        <textarea
          id="product-decline-reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Start typing…"
          rows={4}
          className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink outline-none focus:border-verified"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => setDeclining(false)}
            className="rounded-lg border border-line px-6 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-sm text-[#c0392b]">{error}</p>}
      </form>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg border-2 border-ink px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
        >
          <Check className="size-4" aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={() => setDeclining(true)}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
        >
          <X className="size-4" aria-hidden />
          Decline
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-[#c0392b]">{error}</p>}
    </div>
  );
}
