import { cn } from "@/lib/utils";

/** Buyer-scoped status pill — mirrors components/vendor/status-pill.tsx's
 * tone system but kept as its own component (role-scoped components never
 * cross-import, frontend architecture doc §2.3), since buyer order statuses
 * (Pending/Processing/Shipped/Delivered/Cancelled) differ from vendor's. */

type PillTone = "success" | "warning" | "danger" | "muted" | "info";

const TONE_CLASSES: Record<PillTone, string> = {
  success: "bg-mint text-verified",
  warning: "bg-[#fff7e6] text-[#a15c00]",
  danger: "bg-[#fff0ee] text-[#c0392b]",
  muted: "bg-line/60 text-text-muted",
  info: "bg-[#eef0ff] text-[#4338ca]",
};

const STATUS_TONE: Record<string, PillTone> = {
  Delivered: "success",
  Pending: "warning",
  Processing: "warning",
  Shipped: "info",
  Cancelled: "danger",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}
