import Link from "next/link";
import { ClipboardList, Clock, XCircle } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { getVendorProfile } from "@/lib/api/vendor-profile";
import { getVendorOrderStats } from "@/lib/api/vendor-orders";
import { DashboardShell } from "@/components/vendor/dashboard-shell";
import { StatusPill } from "@/components/vendor/status-pill";

export const instant = false; // reads cookies — genuinely dynamic

/**
 * Vendor shell. The AccountType==="Vendor" check here is a UX convenience (avoids
 * flashing the full vendor nav before redirecting); it is NOT the security
 * boundary — each page.tsx also calls requireAccountType("vendor", ...) directly,
 * since layouts don't reliably re-run on every client-side navigation (design doc
 * §2.2). The Verified-status holding-page swap below has the same caveat: it's
 * checked here for the primary UX case (don't show unverified vendors the full
 * dashboard), but isn't re-verified per-page the way the AccountType check is —
 * a known, deliberate limitation for this initial build, not an oversight.
 */
export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  await requireAccountType("vendor", "/vendor/dashboard");
  const profile = await getVendorProfile();

  if (!profile) {
    return (
      <VendorHoldingPage
        icon={ClipboardList}
        tone="ink"
        title="Finish setting up your seller account"
        description="You're signed in, but haven't completed your business profile, compliance documents, or payout details yet."
        action={{ href: "/vendor-apply", label: "Continue vendor onboarding" }}
      />
    );
  }

  if (profile.verification.status !== "Verified") {
    const isRejected = profile.verification.status === "Rejected";
    return (
      <VendorHoldingPage
        icon={isRejected ? XCircle : Clock}
        tone={isRejected ? "danger" : "ink"}
        title={isRejected ? "Your application wasn't approved" : "Your application is under review"}
        description={
          isRejected
            ? (profile.verification.rejectionReason ?? "Contact support for details on why your application was rejected.")
            : "Our team is reviewing your business profile and documents. This usually doesn't take long — we'll notify you as soon as a decision is made."
        }
        status={profile.verification.status}
        action={isRejected ? { href: "/vendor-apply", label: "Review and resubmit" } : undefined}
      />
    );
  }

  const stats = await getVendorOrderStats();

  return (
    <DashboardShell vendorName={profile.businessLegalName} walletBalance={stats.walletBalance} currency={stats.currency}>
      {children}
    </DashboardShell>
  );
}

/** Full-page state for the two pre-dashboard states (no profile yet /
 * profile not Verified) — styled to match the rest of the vendor
 * onboarding/dashboard system (cream background, rounded card, Newsreader
 * heading) instead of a bare unstyled block, since a pending/rejected
 * vendor may sit on this page for a while. */
function VendorHoldingPage({
  icon: Icon,
  tone,
  title,
  description,
  status,
  action,
}: {
  icon: typeof Clock;
  tone: "ink" | "danger";
  title: string;
  description: string;
  status?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 py-16">
      <Link href="/" className="font-alata text-xl tracking-tight text-ink">
        VITALINK
      </Link>

      <div className="mt-8 w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,39,8,0.06)]">
        <span
          className={
            tone === "danger"
              ? "mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#fff0ee] text-[#c0392b]"
              : "mx-auto flex size-14 items-center justify-center rounded-2xl bg-ink text-white"
          }
        >
          <Icon className="size-6" aria-hidden />
        </span>

        {status && (
          <div className="mt-4 flex justify-center">
            <StatusPill status={status} />
          </div>
        )}

        <h1 className="mt-4 font-[family-name:var(--font-newsreader)] text-2xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-text-muted">{description}</p>

        {action && (
          <Link
            href={action.href}
            className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-ink/85"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
