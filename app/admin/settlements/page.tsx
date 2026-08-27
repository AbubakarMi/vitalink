import { requireAccountType } from "@/lib/auth/dal";
import { listSettlements } from "@/lib/api/admin/settlements";
import { BulkSettlementTransfer } from "@/components/admin/bulk-settlement-transfer";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/**
 * Bulk vendor payout — the backend has GetVendorSettlementAccounts/
 * GetVendorDefaultSettlementAccount but no bulk-transfer command yet, so
 * this whole page is mock-only (lib/api/admin/settlements.ts), matching
 * buyer/vendor's mock-data approach.
 */
export default async function AdminSettlementsPage() {
  await requireAccountType("admin", "/admin/settlements");
  const settlements = await listSettlements();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Settlements</h1>
        <p className="mt-1 text-sm text-text-muted">Review pending vendor balances and process payouts in bulk.</p>
      </div>
      <BulkSettlementTransfer settlements={settlements} />
    </main>
  );
}
