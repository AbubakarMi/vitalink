import Link from "next/link";
import { requireAccountType } from "@/lib/auth/dal";
import { getVendorProfile } from "@/lib/api/vendor-profile";

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
      <main className="mx-auto max-w-lg px-10 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">Finish setting up your seller account</h1>
        <p className="mt-2 text-sm text-text-muted">
          You&apos;re signed in, but haven&apos;t completed your business profile, compliance documents, or payout
          details yet.
        </p>
        <Link
          href="/vendor-apply"
          className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-ink/85"
        >
          Continue vendor onboarding
        </Link>
      </main>
    );
  }

  if (profile.verification.status !== "Verified") {
    return (
      <main className="mx-auto max-w-lg px-10 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">Vendor application status</h1>
        <p className="mt-2 text-sm text-text-muted">Status: {profile.verification.status}</p>
        {profile.verification.status === "Rejected" && profile.verification.rejectionReason && (
          <p className="mt-2 text-sm text-[#c0392b]">Reason: {profile.verification.rejectionReason}</p>
        )}
      </main>
    );
  }

  return <>{children}</>;
}
