"use client";

import { useActionState, useState, useTransition } from "react";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import {
  loginTotpAction,
  loginOtpEmailStartAction,
  loginOtpEmailResendAction,
  loginOtpEmailVerifyAction,
  type MfaChallengeState,
} from "./actions";

const initialState: MfaChallengeState = {};

const submitButtonClass =
  "w-full rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60";

const switchLinkClass = "w-full text-center text-xs font-medium text-verified hover:text-ink";

/**
 * The second step of login when login() reports mfaRequired — dispatches
 * to a TOTP code form or an email-OTP send-then-verify form depending on
 * availableMethods (login.tsx's LoginResponse), with a link to switch
 * between them when both are available for this account.
 */
export function MfaChallengeForm({ flowId, availableMethods }: { flowId: string; availableMethods: string[] }) {
  const hasTotp = availableMethods.includes("Totp");
  const hasOtpEmail = availableMethods.includes("OtpEmail");
  const [method, setMethod] = useState<"Totp" | "OtpEmail">(hasTotp ? "Totp" : "OtpEmail");

  return method === "Totp" ? (
    <TotpChallenge flowId={flowId} onSwitchToOtpEmail={hasOtpEmail ? () => setMethod("OtpEmail") : undefined} />
  ) : (
    <OtpEmailChallenge flowId={flowId} onSwitchToTotp={hasTotp ? () => setMethod("Totp") : undefined} />
  );
}

function TotpChallenge({ flowId, onSwitchToOtpEmail }: { flowId: string; onSwitchToOtpEmail?: () => void }) {
  const [state, formAction, pending] = useActionState(loginTotpAction, initialState);
  const [complete, setComplete] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="flowId" value={flowId} />
      <div>
        <p className="text-sm font-medium text-ink-soft">Authenticator code</p>
        <p className="mt-1 text-xs text-text-muted">Enter the 6-digit code from your authenticator app.</p>
        <div className="mt-2">
          <OtpCodeInput name="code" autoFocus onChangeValue={(v) => setComplete(v.length === 6)} />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending || !complete} className={submitButtonClass}>
        {pending ? "Verifying…" : "Verify & sign in"}
      </button>

      {onSwitchToOtpEmail && (
        <button type="button" onClick={onSwitchToOtpEmail} className={switchLinkClass}>
          Use an email code instead
        </button>
      )}
    </form>
  );
}

function OtpEmailChallenge({ flowId, onSwitchToTotp }: { flowId: string; onSwitchToTotp?: () => void }) {
  const [started, setStarted] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [pendingStart, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(loginOtpEmailVerifyAction, initialState);
  const [complete, setComplete] = useState(false);

  function sendCode() {
    setStartError(null);
    startTransition(async () => {
      const result = await loginOtpEmailStartAction(flowId);
      if (result.error) {
        setStartError(result.error);
        return;
      }
      setMaskedEmail(result.maskedEmail ?? null);
      setStarted(true);
    });
  }

  function resendCode() {
    setResendMessage(null);
    startTransition(async () => {
      const result = await loginOtpEmailResendAction(flowId);
      setResendMessage(result.error ?? "Code resent.");
    });
  }

  if (!started) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">We&apos;ll send a one-time code to the email on your account.</p>
        {startError && (
          <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
            {startError}
          </p>
        )}
        <button type="button" onClick={sendCode} disabled={pendingStart} className={submitButtonClass}>
          {pendingStart ? "Sending…" : "Send code"}
        </button>
        {onSwitchToTotp && (
          <button type="button" onClick={onSwitchToTotp} className={switchLinkClass}>
            Use your authenticator app instead
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="flowId" value={flowId} />
      <div>
        <p className="text-sm font-medium text-ink-soft">Email code</p>
        <p className="mt-1 text-xs text-text-muted">Sent to {maskedEmail ?? "your email"}.</p>
        <div className="mt-2">
          <OtpCodeInput name="code" autoFocus onChangeValue={(v) => setComplete(v.length === 6)} />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
          {state.error}
        </p>
      )}
      {resendMessage && <p className="text-xs text-text-muted">{resendMessage}</p>}

      <button type="submit" disabled={pending || !complete} className={submitButtonClass}>
        {pending ? "Verifying…" : "Verify & sign in"}
      </button>

      <div className="flex items-center justify-between">
        <button type="button" onClick={resendCode} className="text-xs font-medium text-verified hover:text-ink">
          Resend code
        </button>
        {onSwitchToTotp && (
          <button type="button" onClick={onSwitchToTotp} className="text-xs font-medium text-verified hover:text-ink">
            Use authenticator app
          </button>
        )}
      </div>
    </form>
  );
}
