"use client";

import { useId, useState } from "react";
import PhoneInput from "react-phone-number-input";
import type { Value as PhoneValue, Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

/**
 * Country-code-aware phone field (react-phone-number-input — flags, dial
 * code, and validation via libphonenumber-js) styled to match this app's
 * other form fields, replacing the plain `<input type="tel">` used across
 * register-form.tsx, vendor-identity-form.tsx, and the vendor onboarding
 * wizard's Business Profile step.
 *
 * The library is normally used as a fully controlled component, but every
 * form here is an uncontrolled Server Action `<form action={...}>` read via
 * FormData on submit — so this keeps its own `useState` seeded from
 * `defaultValue` and just needs `name` to land in the DOM, which the
 * underlying `<input>` does (the library forwards unrecognized props, `name`
 * included, straight onto it).
 */
export function PhoneNumberField({
  id,
  name,
  label,
  defaultValue,
  required,
  defaultCountry = "NG",
}: {
  id?: string;
  name: string;
  label?: string;
  defaultValue?: string;
  required?: boolean;
  defaultCountry?: Country;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [value, setValue] = useState<PhoneValue | undefined>(defaultValue as PhoneValue | undefined);

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <div
        className={cn(
          "mt-1.5 flex items-center rounded-xl border border-line bg-white px-4 py-3 shadow-sm transition-shadow",
          "focus-within:border-ink/40 focus-within:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]",
        )}
      >
        <PhoneInput
          id={fieldId}
          name={name}
          international
          defaultCountry={defaultCountry}
          countryCallingCodeEditable={false}
          value={value}
          onChange={setValue}
          required={required}
          placeholder="801 234 5678"
          className="phone-input-field w-full text-sm text-ink"
          numberInputProps={{ className: "w-full bg-transparent text-sm text-ink outline-none placeholder:text-text-muted" }}
        />
      </div>
    </div>
  );
}
