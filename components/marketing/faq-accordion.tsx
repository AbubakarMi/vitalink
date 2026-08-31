"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

/** Single-open accordion for the Help Center's FAQ groups — plain static
 * content (no backend help-article API exists), so this is client-only
 * state, not a fake dynamic feed. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-ink">{item.question}</span>
              <ChevronDown
                className={`size-4 shrink-0 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {isOpen && <p className="px-5 pb-4 text-sm text-ink-soft">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
