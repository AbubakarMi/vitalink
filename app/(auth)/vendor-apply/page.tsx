/**
 * Placeholder — UI comes later. The real KYC steps already exist in
 * lib/api/vendor-profile.ts: createVendorProfile -> beginDocumentUpload (presigned
 * upload) -> completeDocumentUpload -> addSettlementAccount. No "submit" step
 * exists on the backend — status review is admin-initiated only (design doc §4).
 * This page becomes a completion checklist against getVendorProfile(), not a form
 * with a submit button.
 */
export default function VendorApplyPage() {
  return (
    <main>
      <h1>Sell on Vitalink</h1>
      <p>Vendor onboarding checklist pending — see lib/api/vendor-profile.ts.</p>
    </main>
  );
}
