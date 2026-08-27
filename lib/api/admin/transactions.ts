import "server-only";
import { listMockTransactions, getMockTransactionSummary, getMockTransactionDetails, type ListMockTransactionsParams } from "../mocks/admin-store";

/**
 * Platform-wide transaction ledger (super admin/Transaction.pdf — which
 * turned out to be the vendor's own wallet screen, not a distinct admin
 * design, but the same table/summary shape applies at platform scope). No
 * backend Transactions API exists yet, so this is mock-only, same as
 * lib/api/admin/orders.ts.
 */

export interface AdminTransaction {
  id: string;
  transactionId: string;
  type: "Order Revenue" | "Admin Credit" | "Failed Payout" | "Vendor Payout";
  reference: string;
  amount: number;
  status: "Successful" | "Processing" | "Requested" | "Failed";
  createdAt: string;
  vendorName: string | null;
  customerName: string | null;
  paymentMethod: string | null;
  note: string | null;
}

export async function listAdminTransactions(params: ListMockTransactionsParams = {}) {
  return listMockTransactions(params);
}

export async function getTransactionSummary() {
  return getMockTransactionSummary();
}

export async function getAdminTransactionDetails(transactionId: string): Promise<AdminTransaction> {
  return getMockTransactionDetails(transactionId);
}
