import Link from "next/link";
import { TrendingUp, Wallet, Printer } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listTransactionsForVendor, getVendorOrderStats } from "@/lib/api/vendor-orders";
import { VendorTableShell, VendorTableHead, VendorTableHeadCell, VendorTableRow, VendorTableCell, VendorTableEmpty } from "@/components/vendor/vendor-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

const TYPE_LABEL: Record<string, string> = { Sale: "Sale", Payout: "Payout", Fee: "Platform Fee" };

/** No mockup was supplied for this screen, but the wallet/sales figures
 * Overview already shows are backed by a real (if illustrative) ledger —
 * see lib/api/mocks/vendor-orders-store.ts — so this lists that ledger
 * instead of leaving the page a placeholder. */
export default async function VendorTransactionsPage() {
  await requireAccountType("vendor", "/vendor/transactions");
  const [transactions, stats] = await Promise.all([listTransactionsForVendor(), getVendorOrderStats()]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Transactions</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Total Sales</p>
            <TrendingUp className="size-4 text-text-muted" aria-hidden />
          </div>
          <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">N{stats.totalSales.toLocaleString("en-NG")}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Wallet Balance</p>
            <Wallet className="size-4 text-text-muted" aria-hidden />
          </div>
          <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">N{stats.walletBalance.toLocaleString("en-NG")}</p>
        </div>
      </div>

      <div className="mt-8">
        <VendorTableShell>
          <VendorTableHead>
            <VendorTableHeadCell>Date</VendorTableHeadCell>
            <VendorTableHeadCell>Type</VendorTableHeadCell>
            <VendorTableHeadCell>Description</VendorTableHeadCell>
            <VendorTableHeadCell>Reference</VendorTableHeadCell>
            <VendorTableHeadCell>Amount</VendorTableHeadCell>
            <VendorTableHeadCell>Receipt</VendorTableHeadCell>
          </VendorTableHead>
          <tbody>
            {transactions.length === 0 && <VendorTableEmpty colSpan={6}>No transactions yet.</VendorTableEmpty>}
            {transactions.map((tx) => (
              <VendorTableRow key={tx.id}>
                <VendorTableCell className="text-text-muted">
                  {new Date(tx.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                </VendorTableCell>
                <VendorTableCell>{TYPE_LABEL[tx.type] ?? tx.type}</VendorTableCell>
                <VendorTableCell>{tx.description}</VendorTableCell>
                <VendorTableCell className="font-mono text-xs text-text-muted">{tx.reference}</VendorTableCell>
                <VendorTableCell className={tx.amount >= 0 ? "font-medium text-verified" : "font-medium text-[#c0392b]"}>
                  {tx.amount >= 0 ? "+" : "−"}N{Math.abs(tx.amount).toLocaleString("en-NG")}
                </VendorTableCell>
                <VendorTableCell>
                  <Link href={`/vendor/transactions/${tx.id}/receipt`} className="flex items-center gap-1.5 font-medium text-verified hover:text-ink">
                    <Printer className="size-3.5" aria-hidden />
                    Print
                  </Link>
                </VendorTableCell>
              </VendorTableRow>
            ))}
          </tbody>
        </VendorTableShell>
      </div>
    </div>
  );
}
