"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/lib/api/auth";
import { PhoneNumberField } from "@/components/ui/phone-input-field";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { registerAction, checkEmailAvailabilityAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

const fieldClass =
  "w-full rounded-xl border border-line bg-white py-3 pr-11 pl-11 text-sm text-ink shadow-sm outline-none transition-shadow focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

/** Looks-like-an-email check gating the query below — same bar the input's
 * own onChange used before, just centralized so the debounced value and the
 * `enabled` check agree on what counts as "worth asking about." */
function looksLikeEmail(value: string): boolean {
  return value.trim().includes("@");
}

export function RegisterForm({ accountType, roleLabel }: { accountType: AccountType; roleLabel: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  // ?redirect= (most commonly /customer/checkout, via the cart page's guest
  // prompt — components/customer/checkout-cta.tsx) — registering never logs
  // you in outright (mock: still a separate login step; live: also needs
  // email verification first), so this just carries forward to the "Go to
  // login" link below rather than being submitted with the form itself.
  const redirectTo = useSearchParams().get("redirect");
  const loginHref = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";

  // Live-as-you-type availability check — debounced 500ms so a fast typist
  // doesn't fire a request per keystroke, then handed to useQuery keyed on
  // the debounced value: React Query itself de-dupes/cancels stale in-flight
  // requests when the key changes, no manual requestId/staleness guard
  // needed (queryFn calls the existing Server Action directly — it's just
  // an async function from the client's point of view).
  const debouncedEmail = useDebouncedValue(email, 500);
  const emailQuery = useQuery({
    queryKey: ["email-availability", debouncedEmail],
    queryFn: () => checkEmailAvailabilityAction(debouncedEmail),
    enabled: looksLikeEmail(debouncedEmail),
    staleTime: 30_000,
    retry: false,
  });

  const isTyping = looksLikeEmail(email) && email !== debouncedEmail;
  const emailStatus: "idle" | "checking" | "available" | "taken" = !looksLikeEmail(email)
    ? "idle"
    : isTyping || emailQuery.isFetching
      ? "checking"
      : emailQuery.data?.available === true
        ? "available"
        : emailQuery.data?.available === false
          ? "taken"
          : "idle";

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint text-verified">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <p className="text-sm text-ink-soft">
          {state.success.verificationEmailSent
            ? `We've sent a verification link to `
            : `Your account is ready for `}
          <span className="font-medium text-ink">{state.success.email}</span>
          {state.success.verificationEmailSent ? ". Verify your email to finish setting up." : "."}
        </p>
        {state.success.verificationEmailSent && <ResendVerificationButton userId={state.success.userId} />}
        <Link
          href={loginHref}
          className="inline-block w-full rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="accountType" value={accountType} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="text-sm font-medium text-ink-soft">
            First name
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="e.g. Chioma"
              required
              className={fieldClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="text-sm font-medium text-ink-soft">
            Last name
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder="e.g. Okor"
              required
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink-soft">
          Email
        </label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            className={cn(fieldClass, "pr-11", emailStatus === "taken" && "border-[#c0392b]/40")}
            placeholder="you@clinic.com"
          />
          {emailStatus === "checking" && (
            <Loader2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-text-muted" aria-hidden />
          )}
          {emailStatus === "available" && (
            <CheckCircle2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-verified" aria-hidden />
          )}
          {emailStatus === "taken" && (
            <XCircle className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#c0392b]" aria-hidden />
          )}
        </div>
        {emailStatus === "taken" && (
          <p className="mt-1.5 text-xs text-[#c0392b]">
            An account with this email already exists —{" "}
            <Link href={loginHref} className="font-medium underline hover:text-ink">
              log in instead
            </Link>
            ?
          </p>
        )}
        {emailStatus === "available" && <p className="mt-1.5 text-xs text-verified">This email is available.</p>}
      </div>

      <PhoneNumberField id="phone" name="phone" label="Phone (optional)" />

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
            placeholder="At least 8 characters"
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

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
      >
        {pending ? "Creating account…" : `Create ${roleLabel} account`}
      </button>
    </form>
  );
}
