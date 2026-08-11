"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Fingerprint, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { identityAction, type IdentityState } from "./actions";

const initialState: IdentityState = {};

const fieldClass =
  "w-full rounded-xl border border-line bg-white py-3 pr-11 pl-11 text-sm text-ink shadow-sm outline-none transition-shadow focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

const MFA_METHODS = [
  { value: "email", label: "Email", description: "Secure code sent to your email address" },
  { value: "authenticator", label: "Authenticator", description: "Google, Microsoft, or Authy" },
] as const;

/**
 * Step 1 of the vendor onboarding wizard ("Identity & MFA" — Figma EZER-KEY
 * node 1250:31). Registers the account and signs the vendor in immediately
 * (identityAction calls register() then login()), then hands off to the
 * parent VendorApplyWizard via onSuccess so steps 2-4 continue in the same
 * client flow, matching the design's single continuous wizard. The MFA
 * method choice is captured but not yet wired to a real enrollment
 * endpoint — no such endpoint exists in lib/api/auth.ts yet — so it's a real,
 * saved preference in form state, not (yet) an active security setting.
 */
export function VendorIdentityForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(identityAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<(typeof MFA_METHODS)[number]["value"]>("email");

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="accountType" value="Vendor" />

      <div>
        <span className="flex size-[52px] items-center justify-center rounded-xl bg-ink text-white">
          <Fingerprint className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-ink">Identity &amp; MFA</h2>
        <p className="mt-2 max-w-lg text-sm text-text-muted">
          Please provide your legal details and secure your account. This information ensures clinical compliance
          and secure access.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="text-sm font-medium text-ink-soft">
            Legal First Name
          </label>
          <input id="firstName" name="firstName" autoComplete="given-name" required className={cn(fieldClass, "pl-4")} />
        </div>
        <div>
          <label htmlFor="lastName" className="text-sm font-medium text-ink-soft">
            Legal Last Name
          </label>
          <input id="lastName" name="lastName" autoComplete="family-name" required className={cn(fieldClass, "pl-4")} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink-soft">
          Corporate Email Address
        </label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink-soft">
            Password
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium text-ink-soft">
            Confirm Password
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              className={cn(fieldClass, "pr-4")}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="font-semibold text-ink">Multi-Factor Authentication (MFA)</p>
        <p className="mt-1 text-sm text-text-muted">Select your preferred authentication method</p>
        <div className="mt-3 space-y-2">
          {MFA_METHODS.map((method) => (
            <label
              key={method.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                mfaMethod === method.value ? "border-ink bg-mint" : "border-line bg-white",
              )}
            >
              <input
                type="radio"
                name="mfaMethod"
                value={method.value}
                checked={mfaMethod === method.value}
                onChange={() => setMfaMethod(method.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  mfaMethod === method.value ? "border-ink" : "border-line",
                )}
              >
                {mfaMethod === method.value && <span className="size-2.5 rounded-full bg-ink" />}
              </span>
              <span>
                <span className="block font-medium text-ink">{method.label}</span>
                <span className="block text-sm text-text-muted">{method.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Continue to Business Credentials"}
          {!pending && <ArrowRight className="size-4" aria-hidden />}
        </button>
      </div>
      <p className="text-center text-xs text-text-muted">
        By continuing you agree to Vitalink&apos;s{" "}
        <Link href="#" className="text-verified hover:text-ink">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-verified hover:text-ink">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
