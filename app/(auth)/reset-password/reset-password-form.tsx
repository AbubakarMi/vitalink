"use client";

import { useActionState, useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

const fieldClass =
  "w-full rounded-xl border border-line bg-white py-3 pr-11 pl-11 text-sm text-ink shadow-sm outline-none transition-shadow focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

export function ResetPasswordForm({ userId, code }: { userId: string; code: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="code" value={code} />

      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink-soft">
          New password
        </label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus
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

      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-ink-soft">
          Confirm new password
        </label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            required
            className={fieldClass}
            placeholder="••••••••"
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
        {pending ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}
