"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, KeyRound } from "lucide-react";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { startTotpEnrollmentAction, confirmTotpEnrollmentAction, removeTotpAction, type TotpEnrollmentView } from "@/app/customer/settings/actions";

/**
 * Real authenticator-app (TOTP) enrollment — replaced the old None/Email/
 * Authenticator preference radio (a fabricated setting with no backing
 * capability) with the one thing the backend actually exposes: enroll, scan
 * a real QR code, confirm with a code, or remove. See lib/api/auth.ts's
 * startTotpEnrollment/confirmTotpEnrollment/removeTotp — initialEnabled
 * comes off getCurrentUser()'s totpEnabled field (a real auth/me response
 * field now, not the old cookie-based hint).
 */
export function MfaSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [enrollment, setEnrollment] = useState<TotpEnrollmentView | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function beginSetup() {
    setError(null);
    startTransition(async () => {
      const result = await startTotpEnrollmentAction();
      if (result.error || !result.data) {
        setError(result.error ?? "Something went wrong starting setup.");
        return;
      }
      setEnrollment(result.data);
      setCode("");
    });
  }

  function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmTotpEnrollmentAction(code);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEnrollment(null);
      setEnabled(true);
    });
  }

  function cancelSetup() {
    setEnrollment(null);
    setCode("");
    setError(null);
  }

  async function disable() {
    const result = await removeTotpAction();
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    setEnabled(false);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-verified" aria-hidden />
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">Two-Factor Authentication</p>
      </div>
      <p className="mt-1 mb-4 text-sm text-text-muted">
        Add an authenticator app (Google Authenticator, Authy, 1Password…) as a second step when signing in.
      </p>

      {enrollment ? (
        <form onSubmit={confirmSetup} className="space-y-4 rounded-xl border border-line bg-cream/40 p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI QR code generated server-side, not an optimizable remote asset */}
            <img
              src={enrollment.qrCodeDataUrl}
              alt="Scan this QR code with your authenticator app"
              className="size-40 shrink-0 rounded-lg border border-line bg-white p-2"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">1. Scan this QR code</p>
              <p className="mt-1 text-sm text-text-muted">
                Open your authenticator app and scan the code, or enter this key manually:
              </p>
              <p className="mt-2 rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs break-all text-ink">
                {enrollment.secret}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">2. Enter the 6-digit code from your app</p>
            <div className="mt-2">
              <OtpCodeInput onChangeValue={setCode} />
            </div>
          </div>
          {error && <p className="text-sm text-[#c0392b]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || code.length !== 6}
              className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85 disabled:opacity-50"
            >
              {pending ? "Confirming…" : "Confirm & Enable"}
            </button>
            <button
              type="button"
              onClick={cancelSetup}
              disabled={pending}
              className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-verified/30 bg-mint/40 p-4">
          <div className="flex items-center gap-3">
            <KeyRound className="size-4.5 shrink-0 text-verified" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Authenticator app enabled</p>
              <p className="text-xs text-text-muted">You&apos;ll be asked for a code from your app when signing in.</p>
            </div>
          </div>
          <ConfirmActionButton
            onConfirm={disable}
            title="Remove authenticator app?"
            description="You'll be able to sign in with just your password again — this makes your account easier to access if your password is ever compromised."
            confirmLabel="Yes, remove it"
            trigger={
              <button type="button" className="shrink-0 text-sm font-medium text-[#c0392b] hover:underline">
                Remove
              </button>
            }
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={beginSetup}
          disabled={pending}
          className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-50"
        >
          <KeyRound className="size-4" aria-hidden />
          {pending ? "Starting…" : "Set up authenticator app"}
        </button>
      )}

      {error && !enrollment && <p className="mt-2 text-xs text-[#c0392b]">{error}</p>}
    </div>
  );
}
