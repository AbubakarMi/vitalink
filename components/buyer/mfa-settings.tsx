"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MfaMethod } from "@/lib/api/security";
import { setMfaPreferenceAction } from "@/app/buyer/settings/actions";

const MFA_METHODS: { value: MfaMethod; label: string; description: string }[] = [
  { value: "none", label: "Off", description: "Sign in with just your password" },
  { value: "email", label: "Email", description: "Secure code sent to your email address" },
  { value: "authenticator", label: "Authenticator", description: "Google, Microsoft, or Authy" },
];

/**
 * Multi-factor authentication preference — moved here from the vendor
 * onboarding wizard's Identity step (it was never really a signup-time
 * choice) so it lives with the rest of a signed-in account's settings. Saves
 * a real preference (lib/api/security.ts) rather than a fake toggle; see
 * that file's comment on why it doesn't yet change what login enforces.
 */
export function MfaSettings({ initialMethod }: { initialMethod: MfaMethod }) {
  const [method, setMethod] = useState(initialMethod);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function choose(next: MfaMethod) {
    if (next === method) return;
    setMethod(next);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setMfaPreferenceAction(next);
      if (result.error) {
        setError(result.error);
        setMethod(initialMethod);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-verified" aria-hidden />
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase">
          Multi-Factor Authentication
        </p>
      </div>
      <p className="mt-1 mb-4 text-sm text-text-muted">Choose how you verify it&apos;s you when signing in.</p>

      <div className="space-y-2">
        {MFA_METHODS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
              method === option.value ? "border-ink bg-mint" : "border-line bg-white",
              pending && "pointer-events-none opacity-70",
            )}
          >
            <input
              type="radio"
              name="mfaMethod"
              value={option.value}
              checked={method === option.value}
              onChange={() => choose(option.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                method === option.value ? "border-ink" : "border-line",
              )}
            >
              {method === option.value && <span className="size-2.5 rounded-full bg-ink" />}
            </span>
            <span>
              <span className="block font-medium text-ink">{option.label}</span>
              <span className="block text-sm text-text-muted">{option.description}</span>
            </span>
          </label>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-[#c0392b]">{error}</p>}
      {saved && !error && !pending && <p className="mt-2 text-xs text-verified">Saved.</p>}
    </div>
  );
}
