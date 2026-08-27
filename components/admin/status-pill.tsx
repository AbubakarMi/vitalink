import { cn } from "@/lib/utils";

/**
 * Shared status-pill styling for admin surfaces (vendor verification,
 * product moderation, staff/role state) — its own copy rather than reusing
 * components/vendor/status-pill.tsx, per the "components never cross role
 * boundaries" rule (frontend architecture doc §2.3; see components/vendor/
 * dashboard-shell.tsx's comment for the same rule stated explicitly).
 */

type PillTone = "success" | "warning" | "danger" | "muted" | "info";

const TONE_CLASSES: Record<PillTone, string> = {
  success: "bg-mint text-verified",
  warning: "bg-[#fff7e6] text-[#a15c00]",
  danger: "bg-[#fff0ee] text-[#c0392b]",
  muted: "bg-line/60 text-text-muted",
  info: "bg-[#eef0ff] text-[#4338ca]",
};

const STATUS_TONE: Record<string, PillTone> = {
  Active: "success",
  Approved: "success",
  Verified: "success",
  Live: "success",
  Delivered: "success",
  Successful: "success",
  PendingReview: "warning",
  Pending: "warning",
  UnderReview: "warning",
  Processing: "warning",
  Requested: "warning",
  Transit: "info",
  Rejected: "danger",
  Declined: "danger",
  Decline: "danger",
  OutOfStock: "danger",
  Cancelled: "danger",
  Suspended: "danger",
  Failed: "danger",
  Archived: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  PendingReview: "Pending Review",
  OutOfStock: "Out of Stock",
  UnderReview: "Under Review",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "muted";
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
