import Link from "next/link";
import { Search } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listAdminTransactions, getTransactionSummary } from "@/lib/api/admin/transactions";
import { StatusPill } from "@/components/admin/status-pill";
import { AdminPagination } from "@/components/admin/pagination";
import {
  AdminTableShell,
  AdminTableHead,
  AdminTableHeadCell,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin/admin-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

/**
 * Platform-wide transaction ledger — super admin/Transaction.pdf's shape
 * (that mockup turned out to be the vendor's own wallet screen, but the
 * same summary-cards + table layout applies at platform scope). No backend
 * Transactions API exists yet, so mock-only (lib/api/admin/transactions.ts).
 */
export default async function AdminTransactionsPage({ searchParams }: PageProps) {
  await requireAccountType("admin", "/admin/transactions");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [result, summary] = await Promise.all([
    listAdminTransactions({ page, pageSize: 12, search: params.search }),
    getTransactionSummary(),
  ]);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Transactions</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Sales" value={summary.totalSales} />
        <SummaryCard label="Funds in Escrow" value={summary.fundsInEscrow} />
        <SummaryCard label="Total Withdrawn" value={summary.totalWithdrawn} />
        <SummaryCard label="Platform Fees" value={summary.platformFees} />
      </div>

      <div className="flex justify-end">
        <form action="/admin/transactions" className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5">
          <Search className="size-4 text-ink-soft/50" aria-hidden />
          <input
            type="search"
            name="search"
            defaultValue={params.search}
            placeholder="Search by order ID"
            className="w-56 bg-transparent text-sm text-ink-soft outline-none placeholder:text-text-muted"
          />
        </form>
      </div>

      <AdminTableShell>
        <AdminTableHead>
          <AdminTableHeadCell>Transaction ID</AdminTableHeadCell>
          <AdminTableHeadCell>Date &amp; Time</AdminTableHeadCell>
          <AdminTableHeadCell>Type</AdminTableHeadCell>
          <AdminTableHeadCell>Reference</AdminTableHeadCell>
          <AdminTableHeadCell>Amount</AdminTableHeadCell>
          <AdminTableHeadCell>Status</AdminTableHeadCell>
          <AdminTableHeadCell className="text-right">Actions</AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {result.data.length === 0 ? (
            <AdminTableEmpty colSpan={7}>No transactions match that search.</AdminTableEmpty>
          ) : (
            result.data.map((txn) => (
              <AdminTableRow key={txn.id}>
                <AdminTableCell className="font-medium">{txn.transactionId}</AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  {new Date(txn.createdAt).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </AdminTableCell>
                <AdminTableCell className="text-text-muted">{txn.type}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{txn.reference}</AdminTableCell>
                <AdminTableCell>N{txn.amount.toLocaleString("en-NG")}</AdminTableCell>
                <AdminTableCell>
                  <StatusPill status={txn.status} />
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <Link href={`/admin/transactions/${txn.id}`} className="text-sm font-medium text-verified hover:underline">
                    View
                  </Link>
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </tbody>
      </AdminTableShell>

      <AdminPagination
        page={page}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        pageSize={result.pageSize}
        basePath="/admin/transactions"
        searchParams={{ search: params.search }}
      />
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">N{value.toLocaleString("en-NG")}</p>
    </div>
  );
}
