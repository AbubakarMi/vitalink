"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitContactMessageAction, type ActionResult } from "@/app/(marketing)/actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(0,39,8,0.07)]";

const initialState: ActionResult = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactMessageAction, initialState);
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
        <p className="text-lg font-semibold text-ink">Message sent</p>
        <p className="max-w-sm text-sm text-text-muted">
          Thanks for reaching out — our team usually replies within one business day.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-medium text-ink-soft">
            Full name
          </label>
          <input id="contact-name" name="name" required placeholder="Your name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm font-medium text-ink-soft">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required placeholder="you@example.com" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="text-sm font-medium text-ink-soft">
          Subject
        </label>
        <input id="contact-subject" name="subject" required placeholder="How can we help?" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="contact-message" className="text-sm font-medium text-ink-soft">
          Message
        </label>
        <textarea id="contact-message" name="message" required rows={5} placeholder="Tell us more…" className={fieldClass} />
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
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
