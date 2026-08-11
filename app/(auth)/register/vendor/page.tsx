import { VendorApplyWizard } from "../../vendor-apply/vendor-apply-wizard";

/**
 * Register step 2 of 2 for sellers — the entire 4-step vendor onboarding
 * wizard (Figma EZER-KEY node 1250:31 onward), starting at "identity" since
 * no account/session exists yet. VendorApplyWizard's identityAction
 * registers the account and logs it in, so steps 2-4 continue in this same
 * client flow without a separate login step — see vendor-apply-wizard.tsx.
 */
export default function VendorRegisterPage() {
  return <VendorApplyWizard initialProfile={null} initialStep="identity" />;
}
