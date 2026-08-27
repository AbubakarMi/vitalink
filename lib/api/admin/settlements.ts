import "server-only";
import { listMockSettlements, processMockBulkTransfer } from "../mocks/admin-store";

/**
 * Vendor settlement accounts + bulk payout transfer — the backend has
 * GetVendorSettlementAccounts/GetVendorDefaultSettlementAccount endpoints
 * (Web.Api/Endpoints/Administration/Vendors/*) but no bulk-transfer command
 * yet, so this whole adapter is mock-only for now, same as orders.ts/
 * transactions.ts.
 */

export interface Settlement {
  vendorId: string;
  vendorName: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  pendingAmount: number;
  lastPayoutAt: string | null;
}

export async function listSettlements(): Promise<Settlement[]> {
  return listMockSettlements();
}

export async function processBulkTransfer(vendorIds: string[]): Promise<{ transferred: number; total: number }> {
  return processMockBulkTransfer(vendorIds);
}
