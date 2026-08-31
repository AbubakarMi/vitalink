"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitQuoteRequestAction, type ActionResult } from "@/app/(marketing)/actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

const initialState: ActionResult = {};

export function QuoteRequestForm() {
  const [state, formAction, pending] = useActionState(submitQuoteRequestAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-8 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-mint text-verified">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <p className="text-lg font-semibold text-ink">Quote request received</p>
        <p className="max-w-sm text-sm text-text-muted">
          A member of our procurement team will reach out with pricing and availability, usually within one
          business day.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="quote-name" className="text-sm font-medium text-ink-soft">
            Full name
          </label>
          <input id="quote-name" name="name" required placeholder="Your name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="quote-organization" className="text-sm font-medium text-ink-soft">
            Facility / organization
          </label>
          <input id="quote-organization" name="organization" required placeholder="e.g. St. Luke's Hospital" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="quote-email" className="text-sm font-medium text-ink-soft">
            Email
          </label>
          <input id="quote-email" name="email" type="email" required placeholder="you@example.com" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="quote-phone" className="text-sm font-medium text-ink-soft">
            Phone
          </label>
          <input id="quote-phone" name="phone" type="tel" required placeholder="+234…" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="quote-equipment" className="text-sm font-medium text-ink-soft">
          Equipment or products needed
        </label>
        <textarea
          id="quote-equipment"
          name="equipmentNeeded"
          required
          rows={4}
          placeholder="e.g. 2x patient monitors, 1x analytical balance, NAFDAC-approved malaria RDT kits…"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="quote-quantity" className="text-sm font-medium text-ink-soft">
            Quantity / budget <span className="text-text-muted">(optional)</span>
          </label>
          <input id="quote-quantity" name="quantity" placeholder="e.g. 5 units, ~N2,000,000" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="quote-timeline" className="text-sm font-medium text-ink-soft">
            Preferred timeline <span className="text-text-muted">(optional)</span>
          </label>
          <input id="quote-timeline" name="timeline" placeholder="e.g. within 2 weeks" className={fieldClass} />
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
        className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Request Quote"}
      </button>
    </form>
  );
}
