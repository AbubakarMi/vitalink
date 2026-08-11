import { requireAccountType } from "@/lib/auth/dal";
import { getVendorProfile } from "@/lib/api/vendor-profile";
import { VendorApplyWizard } from "./vendor-apply-wizard";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/**
 * Entry point for a Vendor who already has an account resuming or editing
 * onboarding (e.g. a dashboard link, or coming back after leaving mid-flow)
 * — requires a logged-in Vendor session. A fresh signup instead starts the
 * same wizard at "identity" via /register/vendor, which registers the
 * account and logs it in as part of the flow — see vendor-apply-wizard.tsx.
 * If a profile already exists here, resume at Compliance instead of
 * re-asking for the business details already saved.
 */
export default async function VendorApplyPage() {
  await requireAccountType("vendor", "/vendor-apply");
  const profile = await getVendorProfile();

  return <VendorApplyWizard initialProfile={profile} />;
}
