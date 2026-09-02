"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmailAction } from "@/app/(auth)/verify-email/actions";

/** Shared between the verify-email page (a stale/expired link) and the
 * register success screen (right after signup, while userId is still
 * fresh in hand) — same action either way. */
export function ResendVerificationButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; sent?: boolean } | null>(null);

  function resend() {
    setResult(null);
    startTransition(async () => {
      setResult(await resendVerificationEmailAction(userId));
    });
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={resend} disabled={pending} className="text-sm font-medium text-verified hover:text-ink disabled:opacity-60">
        {pending ? "Sending…" : "Resend verification email"}
      </button>
      {result?.sent && <p className="mt-1 text-xs text-verified">Sent — check your inbox.</p>}
      {result?.error && <p className="mt-1 text-xs text-[#c0392b]">{result.error}</p>}
    </div>
  );
}
