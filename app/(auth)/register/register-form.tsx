"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import type { AccountType } from "@/lib/api/auth";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

const fieldClass =
  "w-full rounded-xl border border-line bg-white py-3 pr-11 pl-11 text-sm text-ink shadow-sm outline-none transition-shadow focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

export function RegisterForm({ accountType, roleLabel }: { accountType: AccountType; roleLabel: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

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
        <Link
          href="/login"
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
            <input id="firstName" name="firstName" autoComplete="given-name" required className={fieldClass} />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="text-sm font-medium text-ink-soft">
            Last name
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input id="lastName" name="lastName" autoComplete="family-name" required className={fieldClass} />
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
            className={fieldClass}
            placeholder="you@clinic.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium text-ink-soft">
          Phone <span className="text-text-muted">(optional)</span>
        </label>
        <div className="relative mt-1.5">
          <Phone className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={fieldClass} placeholder="+234" />
        </div>
      </div>

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
