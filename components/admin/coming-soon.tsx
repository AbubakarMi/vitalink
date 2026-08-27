import type { LucideIcon } from "lucide-react";

/** Shared "no backend yet" state for admin pages with no real API to back
 * them (Orders, Transactions, Analytics, Disputes) — styled consistently
 * with the rest of the admin shell instead of each page's own bare text. */
export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-8 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-mint text-verified">
          <Icon className="size-5" aria-hidden />
        </span>
        <p className="max-w-sm text-sm text-text-muted">{description}</p>
      </div>
    </main>
  );
}
