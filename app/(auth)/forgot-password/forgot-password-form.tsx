"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, MailCheck } from "lucide-react";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-mint text-verified">
          <MailCheck className="size-5" aria-hidden />
        </span>
        <p className="text-sm text-ink">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="text-sm font-medium text-verified hover:text-ink">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
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
            autoFocus
            className="w-full rounded-xl border border-line bg-white py-3 pr-4 pl-11 text-sm text-ink shadow-sm outline-none transition-shadow focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
            placeholder="you@clinic.com"
          />
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
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
