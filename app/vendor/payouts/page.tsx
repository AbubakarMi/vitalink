import { requireAccountType } from "@/lib/auth/dal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Real — SettlementAccount endpoints exist (lib/api/vendor-profile.ts). Placeholder UI. */
export default async function VendorPayoutsPage() {
  await requireAccountType("vendor", "/vendor/payouts");
  return (
    <main>
      <h1>Payouts</h1>
      <p>Settlement account management pending — see lib/api/vendor-profile.ts.</p>
    </main>
  );
}
