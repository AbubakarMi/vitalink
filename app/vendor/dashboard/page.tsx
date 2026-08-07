import { requireAccountType } from "@/lib/auth/dal";
import { getVendorProfile } from "@/lib/api/vendor-profile";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Real vendor profile/status; sales/payout figures are mocked — no Order API yet (design doc §1). */
export default async function VendorDashboardPage() {
  await requireAccountType("vendor", "/vendor/dashboard");
  const profile = await getVendorProfile();

  return (
    <main>
      <h1>{profile?.businessLegalName ?? "Vendor dashboard"}</h1>
      <p>Status: {profile?.verification.status}</p>
      <p>Sales figures pending — no Order API yet.</p>
    </main>
  );
}
