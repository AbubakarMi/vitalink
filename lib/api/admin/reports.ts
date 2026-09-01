import "server-only";
import { listAdminOrders } from "./orders";
import { listVendors } from "./vendors";
import { listAdminTransactions } from "./transactions";
import { listAdminProducts } from "./products";
import { listSettlements } from "./settlements";

/**
 * Standard report builder for /admin/reports — picks a report type + date
 * range, produces a flat table any of these existing admin list adapters
 * already back (Orders/Vendors/Transactions/Products/Settlements), so the
 * page can render a preview and export the full result as CSV/PDF without
 * a separate reporting backend. Every report type is mock-only exactly the
 * same way its underlying list adapter already is (see each adapter's own
 * "no backend X API exists yet" comment) — this is a new *view* over
 * existing data, not a new data source.
 */

export const REPORT_TYPES = ["orders", "vendors", "transactions", "products", "settlements"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  orders: "Orders",
  vendors: "Vendors",
  transactions: "Transactions",
  products: "Products",
  settlements: "Settlements (current balances)",
};

/** Settlements has no per-row date (it's a live snapshot of pending vendor
 * balances, not a dated ledger) — every other report type filters by this. */
export const REPORT_TYPE_HAS_DATE_RANGE: Record<ReportType, boolean> = {
  orders: true,
  vendors: true,
  transactions: true,
  products: true,
  settlements: false,
};

export interface ReportColumn {
  key: string;
  label: string;
}

export type ReportRow = Record<string, string | number>;

export interface ReportResult {
  type: ReportType;
  columns: ReportColumn[];
  rows: ReportRow[];
}

export interface ReportRange {
  /** Inclusive, "YYYY-MM-DD" (from a <input type="date">) or undefined for open-ended. */
  from?: string;
  to?: string;
}

// A very large pageSize stands in for "give me every row" — every paged
// admin adapter's mock backing store tops out at a few dozen records, so
// this always returns the full set in one page without needing a separate
// unpaginated variant of each list function.
const ALL_ROWS_PAGE_SIZE = 10_000;

function withinRange(isoDate: string | null | undefined, range: ReportRange): boolean {
  if (!isoDate) return !range.from && !range.to;
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return true;
  if (range.from && time < new Date(range.from).getTime()) return false;
  if (range.to && time > new Date(range.to).getTime() + 86_400_000 - 1) return false; // inclusive of the whole "to" day
  return true;
}

const ORDER_COLUMNS: ReportColumn[] = [
  { key: "orderNumber", label: "Order #" },
  { key: "customerName", label: "Customer" },
  { key: "vendorName", label: "Vendor" },
  { key: "itemCount", label: "Items" },
  { key: "total", label: "Total (NGN)" },
  { key: "status", label: "Status" },
  { key: "placedAt", label: "Placed" },
];

const VENDOR_COLUMNS: ReportColumn[] = [
  { key: "businessLegalName", label: "Business Name" },
  { key: "vendorType", label: "Type" },
  { key: "businessEmail", label: "Email" },
  { key: "businessPhone", label: "Phone" },
  { key: "verificationStatus", label: "Status" },
  { key: "createdAt", label: "Applied" },
];

const TRANSACTION_COLUMNS: ReportColumn[] = [
  { key: "transactionId", label: "Transaction ID" },
  { key: "type", label: "Type" },
  { key: "amount", label: "Amount (NGN)" },
  { key: "status", label: "Status" },
  { key: "vendorName", label: "Vendor" },
  { key: "customerName", label: "Customer" },
  { key: "createdAt", label: "Date" },
];

const PRODUCT_COLUMNS: ReportColumn[] = [
  { key: "name", label: "Product" },
  { key: "sku", label: "SKU" },
  { key: "vendorName", label: "Vendor" },
  { key: "brand", label: "Brand" },
  { key: "price", label: "Price (NGN)" },
  { key: "stock", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Listed" },
];

const SETTLEMENT_COLUMNS: ReportColumn[] = [
  { key: "vendorName", label: "Vendor" },
  { key: "bankName", label: "Bank" },
  { key: "accountNumber", label: "Account Number" },
  { key: "pendingAmount", label: "Pending Amount (NGN)" },
  { key: "lastPayoutAt", label: "Last Payout" },
];

export async function generateReport(type: ReportType, range: ReportRange): Promise<ReportResult> {
  switch (type) {
    case "orders": {
      const { data } = await listAdminOrders({ pageSize: ALL_ROWS_PAGE_SIZE });
      const rows = data
        .filter((o) => withinRange(o.placedAt, range))
        .map((o) => ({
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          vendorName: o.vendorName,
          itemCount: o.itemCount,
          total: o.total,
          status: o.status,
          placedAt: formatDate(o.placedAt),
        }));
      return { type, columns: ORDER_COLUMNS, rows };
    }
    case "vendors": {
      const { data } = await listVendors({ pageSize: ALL_ROWS_PAGE_SIZE });
      const rows = data
        .filter((v) => withinRange(v.createdAt, range))
        .map((v) => ({
          businessLegalName: v.businessLegalName,
          vendorType: v.vendorType,
          businessEmail: v.businessEmail ?? "—",
          businessPhone: v.businessPhone ?? "—",
          verificationStatus: v.verificationStatus,
          createdAt: formatDate(v.createdAt),
        }));
      return { type, columns: VENDOR_COLUMNS, rows };
    }
    case "transactions": {
      const { data } = await listAdminTransactions({ pageSize: ALL_ROWS_PAGE_SIZE });
      const rows = data
        .filter((t) => withinRange(t.createdAt, range))
        .map((t) => ({
          transactionId: t.transactionId,
          type: t.type,
          amount: t.amount,
          status: t.status,
          vendorName: t.vendorName ?? "—",
          customerName: t.customerName ?? "—",
          createdAt: formatDate(t.createdAt),
        }));
      return { type, columns: TRANSACTION_COLUMNS, rows };
    }
    case "products": {
      const { data } = await listAdminProducts({ pageSize: ALL_ROWS_PAGE_SIZE });
      const rows = data
        .filter((p) => withinRange(p.createdAt, range))
        .map((p) => ({
          name: p.name,
          sku: p.sku ?? "—",
          vendorName: p.vendorName ?? "—",
          brand: p.brand ?? "—",
          price: p.price,
          stock: p.stock ?? 0,
          status: p.status,
          createdAt: formatDate(p.createdAt),
        }));
      return { type, columns: PRODUCT_COLUMNS, rows };
    }
    case "settlements": {
      const data = await listSettlements();
      const rows = data.map((s) => ({
        vendorName: s.vendorName,
        bankName: s.bankName,
        accountNumber: s.accountNumber,
        pendingAmount: s.pendingAmount,
        lastPayoutAt: s.lastPayoutAt ? formatDate(s.lastPayoutAt) : "Never",
      }));
      return { type, columns: SETTLEMENT_COLUMNS, rows };
    }
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}
