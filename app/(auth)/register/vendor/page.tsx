import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { VendorApplyWizard } from "../../vendor-apply/vendor-apply-wizard";

export const instant = false; // verifySession reads cookies — genuinely dynamic

/**
 * Register step 2 of 2 for sellers — the entire 4-step vendor onboarding
 * wizard (Figma EZER-KEY node 1250:31 onward), starting at "identity" since
 * no account/session exists yet. VendorApplyWizard's identityAction
 * registers the account and logs it in, so steps 2-4 continue in this same
 * client flow without a separate login step — see vendor-apply-wizard.tsx.
 *
 * step is local useState in VendorApplyWizard, so a refresh here would
 * otherwise always restart at "identity" even for someone who already
 * registered — re-submitting identityAction with the same email 409s, a
 * dead end. Once a session exists, hand off to /vendor-apply instead, which
 * resumes at the right step from the saved profile (page.tsx there).
 */
export default async function VendorRegisterPage() {
  const session = await verifySession();
  if (session) {
    redirect("/vendor-apply");
  }

  return <VendorApplyWizard initialProfile={null} initialStep="identity" />;
}
