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

  if (!profile || profile.verification.status !== "Verified") {
    return (
      <main>
        <h1>Vendor application status</h1>
        <p>Status: {profile?.verification.status ?? "Pending"}</p>
        {profile?.verification.status === "Rejected" && profile.verification.rejectionReason && (
          <p>Reason: {profile.verification.rejectionReason}</p>
        )}
      </main>
    );
  }

  return <>{children}</>;
}
