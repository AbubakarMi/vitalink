"use client";

import { Printer } from "lucide-react";

/** print:hidden so the button itself never shows up on the printed page —
 * dashboard-shell.tsx hides the header/sidebar the same way. */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85 print:hidden"
    >
      <Printer className="size-4" aria-hidden />
      {label}
    </button>
  );
}
