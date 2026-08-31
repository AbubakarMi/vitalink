"use client";

import { useId, useMemo, useRef, useState } from "react";
import { states as listNigerianStates } from "nigerian-states-and-lgas";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_STATES = listNigerianStates();

/**
 * Type-ahead state picker (nigerian-states-and-lgas — the real 36 states +
 * FCT, not a hand-typed list) replacing the plain free-text "State"
 * input across the address forms (delivery address, vendor onboarding's
 * business address). Still a real text input carrying `name` for the
 * surrounding Server Action form's FormData — the dropdown just narrows
 * down to a valid state as you type, closer to how a "search" behaves than
 * a native `<select>`'s click-to-open list.
 */
export function StateSearchField({
  id,
  name,
  label,
  defaultValue,
  required,
  placeholder = "Start typing a state…",
}: {
  id?: string;
  name: string;
  label?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    const results = query ? ALL_STATES.filter((state) => state.toLowerCase().includes(query)) : ALL_STATES;
    return results.slice(0, 8);
  }, [value]);

  function selectState(state: string) {
    setValue(state);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <div className={cn("relative", label && "mt-1.5")}>
        <input
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Let a click on a dropdown option register before closing.
            setTimeout(() => setOpen(false), 150);
          }}
          required={required}
          autoComplete="off"
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-9 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]"
        />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
      </div>

      {open && matches.length > 0 && (
        <ul className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg">
          {matches.map((state) => (
            <li key={state}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // keep the input's focus so onBlur doesn't fire first
                onClick={() => selectState(state)}
                className={cn(
                  "block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-mint/60",
                  state === value ? "text-verified" : "text-ink-soft",
                )}
              >
                {state}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
