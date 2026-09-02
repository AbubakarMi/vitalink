"use client";

import { useRef, useState } from "react";

/**
 * 6-box segmented code entry — replaces a single cramped text input for
 * TOTP/email-OTP codes (login MFA challenge, authenticator enrollment
 * confirm). Carries a hidden `name`d input with the joined value so it
 * still works inside a plain `<form action={...}>` Server Action with no
 * extra client wiring; `onChangeValue` is there for callers (like
 * mfa-settings.tsx) that drive an explicit action call from client state
 * instead of native form submission.
 */
export function OtpCodeInput({
  name,
  length = 6,
  autoFocus,
  onChangeValue,
}: {
  name?: string;
  length?: number;
  autoFocus?: boolean;
  onChangeValue?: (value: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length }, () => ""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function applyDigits(next: string[]) {
    setDigits(next);
    onChangeValue?.(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    applyDigits(next);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      applyDigits(next);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length }, (_, i) => text[i] ?? "");
    applyDigits(next);
    inputRefs.current[Math.max(Math.min(text.length, length) - 1, 0)]?.focus();
  }

  return (
    <div className="flex gap-2">
      {name && <input type="hidden" name={name} value={digits.join("")} />}
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1} of ${length}`}
          className="size-12 rounded-xl border border-line bg-white text-center font-mono text-xl text-ink shadow-sm outline-none transition-shadow focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)] sm:size-14 sm:text-2xl"
        />
      ))}
    </div>
  );
}
