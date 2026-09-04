import Link from "next/link";
import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { getSalesTrend, getCategoryBreakdown, getTopVendorsByRevenue, getOrderStatusBreakdown } from "@/lib/api/admin/analytics";
import { listVendors } from "@/lib/api/admin/vendors";
import { getTransactionSummary } from "@/lib/api/admin/transactions";
import { BarChart, DonutChart, HorizontalBarList } from "@/components/admin/charts";
import { AdminTableShell, AdminTableHead, AdminTableHeadCell, AdminTableRow, AdminTableCell } from "@/components/admin/admin-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

/**
 * Analytics & Reports — no backend Analytics/Orders API exists yet, so
 * every figure here is mock (lib/api/admin/analytics.ts), the same
 * mock-data approach used for customer/vendor. Real once wired to a live
 * Orders/Analytics endpoint — see that adapter's header comment. Two views:
 * "Analytics" (charts) and "Reports" (the same underlying figures as plain
 * tables, for a printable/scannable summary rather than visualizations).
 */
export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const session = await requireAccountType("admin", "/admin/analytics");
  const canListVendors = hasPermission(session, "Vendors", "List");
  const params = await searchParams;
  const view = params.view === "reports" ? "reports" : "analytics";

  const [salesTrend, categoryBreakdown, topVendors, orderStatus, summary, vendorTotals] = await Promise.all([
    getSalesTrend(),
    getCategoryBreakdown(),
    getTopVendorsByRevenue(),
    getOrderStatusBreakdown(),
    getTransactionSummary(),
    canListVendors ? getVendorFunnel() : null,
  ]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Analytics &amp; Reports</h1>
        <p className="mt-1 text-sm text-text-muted">Platform performance at a glance.</p>
      </div>

      <nav className="flex w-fit gap-1 rounded-full border border-line bg-white p-1">
        <Link
          href="/admin/analytics"
          className={
            view === "analytics"
              ? "rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white"
              : "rounded-full px-4 py-1.5 text-xs font-medium text-text-muted hover:text-ink"
          }
        >
          Analytics
        </Link>
        <Link
          href="/admin/analytics?view=reports"
          className={
            view === "reports"
              ? "rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white"
              : "rounded-full px-4 py-1.5 text-xs font-medium text-text-muted hover:text-ink"
          }
        >
          Reports
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Sales" value={`N${summary.totalSales.toLocaleString("en-NG")}`} />
        <SummaryCard label="Platform Fees" value={`N${summary.platformFees.toLocaleString("en-NG")}`} />
        <SummaryCard label="Funds in Escrow" value={`N${summary.fundsInEscrow.toLocaleString("en-NG")}`} />
      </div>

      {view === "analytics" ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold text-ink">Sales Trend</p>
              <p className="text-xs text-text-muted">The sales trend for the year</p>
              <div className="mt-4">
                <BarChart data={salesTrend} formatValue={(n) => `N${(n / 1000).toLocaleString("en-NG")}k`} />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold text-ink">Category Breakdown</p>
              <p className="text-xs text-text-muted">Sales distribution by category</p>
              <div className="mt-4">
                <DonutChart data={categoryBreakdown} />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold text-ink">Top Vendors by Revenue</p>
              <p className="text-xs text-text-muted">Successful order revenue, all time</p>
              <div className="mt-4">
                <HorizontalBarList data={topVendors} />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold text-ink">Order Status</p>
              <p className="text-xs text-text-muted">Every order on the platform, by current status</p>
              <div className="mt-4">
                <HorizontalBarList data={orderStatus} formatValue={(n) => n.toLocaleString("en-NG")} barColor="#5c8aff" />
              </div>
            </div>
          </div>

          {vendorTotals && (
            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="text-sm font-semibold text-ink">Vendor Approval Funnel</p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <FunnelStat label="Pending" value={vendorTotals.pending} />
                <FunnelStat label="Under Review" value={vendorTotals.underReview} />
                <FunnelStat label="Verified" value={vendorTotals.verified} />
                <FunnelStat label="Rejected" value={vendorTotals.rejected} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <ReportTable
            title="Monthly Sales Report"
            columns={["Month", "Revenue"]}
            rows={salesTrend.map((d) => [d.label, `N${d.value.toLocaleString("en-NG")}`])}
          />
          <ReportTable
            title="Vendor Performance Report"
            columns={["Vendor", "Revenue"]}
            rows={topVendors.map((d) => [d.label, `N${d.value.toLocaleString("en-NG")}`])}
          />
          <ReportTable
            title="Category Performance Report"
            columns={["Category", "Sales"]}
            rows={categoryBreakdown.map((d) => [d.label, `N${d.value.toLocaleString("en-NG")}`])}
          />
          <ReportTable
            title="Order Status Report"
            columns={["Status", "Orders"]}
            rows={orderStatus.map((d) => [d.label, d.value.toLocaleString("en-NG")])}
          />
          {vendorTotals && (
            <ReportTable
              title="Vendor Approval Report"
              columns={["Status", "Count"]}
              rows={[
                ["Pending", String(vendorTotals.pending)],
                ["Under Review", String(vendorTotals.underReview)],
                ["Verified", String(vendorTotals.verified)],
                ["Rejected", String(vendorTotals.rejected)],
              ]}
            />
          )}
        </div>
      )}
    </main>
  );
}

async function getVendorFunnel() {
  const [pending, underReview, verified, rejected] = await Promise.all([
    listVendors({ pageSize: 1, status: "Pending" }),
    listVendors({ pageSize: 1, status: "UnderReview" }),
    listVendors({ pageSize: 1, status: "Verified" }),
    listVendors({ pageSize: 1, status: "Rejected" }),
  ]);
  return {
    pending: pending.totalCount,
    underReview: underReview.totalCount,
    verified: verified.totalCount,
    rejected: rejected.totalCount,
  };
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">{value}</p>
    </div>
  );
}

function FunnelStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream px-4 py-3 text-center">
      <p className="font-[family-name:var(--font-newsreader)] text-xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  );
}

function ReportTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-ink">{title}</p>
      <AdminTableShell>
        <AdminTableHead>
          {columns.map((col) => (
            <AdminTableHeadCell key={col}>{col}</AdminTableHeadCell>
          ))}
        </AdminTableHead>
        <tbody>
          {rows.map((row) => (
            <AdminTableRow key={row[0]}>
              {row.map((cell, i) => (
                <AdminTableCell key={i} className={i === 0 ? "font-medium" : "text-text-muted"}>
                  {cell}
                </AdminTableCell>
              ))}
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTableShell>
    </div>
  );
}
