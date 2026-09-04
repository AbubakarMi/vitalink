import Link from "next/link";
import {
  ClipboardCheck,
  Building2,
  PackageCheck,
  PackageX,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  Wallet,
} from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { listVendors, type AdminVendor } from "@/lib/api/admin/vendors";
import { listAdminProducts } from "@/lib/api/admin/products";
import { listAuditLog, type AuditLogEntry } from "@/lib/api/admin/audit";
import { listStaff } from "@/lib/api/admin/staff";
import { listRolesDropdown } from "@/lib/api/admin/roles";
import { countPendingOrders } from "@/lib/api/admin/orders";
import { getTransactionSummary } from "@/lib/api/admin/transactions";
import { getSalesTrend, getCategoryBreakdown } from "@/lib/api/admin/analytics";
import { InviteStaffModal } from "@/components/admin/invite-staff-modal";
import { StatusPill } from "@/components/admin/status-pill";
import { BarChart, DonutChart } from "@/components/admin/charts";
import {
  AdminTableShell,
  AdminTableHead,
  AdminTableHeadCell,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin/admin-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/**
 * Super Admin overview — built from super admin/Super Admin Dashboard.pdf.
 * Vendors/Staff/Roles numbers are real (lib/api/admin/{vendors,staff,roles}.ts).
 * Sales Trend, Category Breakdown, Total Sales, and the "Fulfill Orders"
 * pending count are mock (lib/api/admin/{analytics,transactions,orders}.ts —
 * no backend Order/Analytics API exists yet, same mock-data approach used
 * for customer/vendor). Product-status counts and the audit feed come from
 * real routes whose response shape isn't confirmed yet, so both degrade to
 * an empty state instead of crashing if the shape doesn't match once wired
 * to a live backend.
 */
export default async function AdminDashboardPage() {
  const session = await requireAccountType("admin", "/admin/dashboard");
  const canListVendors = hasPermission(session, "Vendors", "List");
  const canListStaff = hasPermission(session, "Staff", "List");

  const [
    vendorTotals,
    recentVendors,
    staffList,
    roles,
    productCounts,
    auditEntries,
    pendingOrders,
    transactionSummary,
    salesTrend,
    categoryBreakdown,
  ] = await Promise.all([
    canListVendors ? getVendorTotals() : null,
    canListVendors ? listVendors({ pageSize: 6 }).catch(() => null) : null,
    canListStaff ? listStaff({ pageSize: 20 }).catch(() => null) : null,
    canListStaff ? listRolesDropdown().catch(() => []) : [],
    getProductCounts(),
    getAuditEntries(),
    countPendingOrders(),
    getTransactionSummary(),
    getSalesTrend(),
    getCategoryBreakdown(),
  ]);

  const pendingStaffCount = (staffList?.data ?? []).filter((s) => s.approvalStatus === "PendingReview").length;

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Overview</h1>
          <p className="mt-1 text-sm text-text-muted">Platform-wide oversight across vendors, inventory, and staff.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-2xl border border-verified/40 bg-mint/40 px-5 py-3 transition-colors hover:bg-mint/70"
          >
            <ClipboardCheck className="size-5 text-verified" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-ink">Fulfill Orders</span>
              <span className="block text-xs text-text-muted">Authorize {pendingOrders} pending order{pendingOrders === 1 ? "" : "s"}</span>
            </span>
          </Link>
          {canListStaff && (
            <InviteStaffModal
              roles={roles}
              existingStaff={(staffList?.data ?? []).map((s) => ({ id: s.id, name: s.name, role: s.role }))}
              trigger={
                <button
                  type="button"
                  className="flex h-full items-center gap-2 rounded-2xl bg-brand-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
                >
                  <UserPlus className="size-4" aria-hidden />
                  Create roles
                </button>
              }
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Wallet} label="Total Sales" value={`N${transactionSummary.totalSales.toLocaleString("en-NG")}`} />
        <StatCard
          icon={Building2}
          label="Pending Approvals"
          value={vendorTotals ? vendorTotals.pending.toLocaleString("en-NG") : "—"}
          tone="warning"
        />
        <StatCard
          icon={PackageCheck}
          label="Live Products"
          value={productCounts ? productCounts.active.toLocaleString("en-NG") : "—"}
        />
        <StatCard
          icon={PackageX}
          label="Rejected Products"
          value={productCounts ? productCounts.rejected.toLocaleString("en-NG") : "—"}
          tone="danger"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Users Pending Review"
          value={String(pendingStaffCount)}
          tone={pendingStaffCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
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
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-[#a15c00]" aria-hidden />
            <p className="text-sm font-semibold text-ink">System Anomalies</p>
          </div>
          <div className="mt-4 space-y-3">
            {auditEntries === null ? (
              <p className="text-sm text-text-muted">Security log isn&apos;t available yet.</p>
            ) : auditEntries.length === 0 ? (
              <p className="text-sm text-text-muted">No anomalies detected.</p>
            ) : (
              auditEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-[#fff7e6] px-3.5 py-2.5">
                  <p className="text-sm font-medium text-ink">
                    {entry.action} — {entry.tableName}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {[entry.email, formatDateTime(entry.timestamp)].filter(Boolean).join(" | ")}
                  </p>
                </div>
              ))
            )}
          </div>
          <Link
            href="/admin/audit"
            className="mt-4 flex w-full items-center justify-center rounded-lg border border-line py-2 text-xs font-medium text-ink-soft hover:bg-cream"
          >
            View Security log
          </Link>
        </div>
      </div>

      {canListVendors && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent Compliance Submissions</h2>
            <Link href="/admin/vendors" className="flex items-center gap-1 text-sm font-medium text-verified hover:text-verified-hover">
              View all
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="mt-4">
            <ComplianceTable vendors={recentVendors?.data ?? []} />
          </div>
        </div>
      )}
    </main>
  );
}

async function getVendorTotals() {
  const [all, pending, underReview] = await Promise.all([
    listVendors({ pageSize: 1 }),
    listVendors({ pageSize: 1, status: "Pending" }),
    listVendors({ pageSize: 1, status: "UnderReview" }),
  ]);
  return { total: all.totalCount, pending: pending.totalCount + underReview.totalCount };
}

async function getProductCounts(): Promise<{ active: number; rejected: number } | null> {
  try {
    const [active, rejected] = await Promise.all([
      listAdminProducts({ pageSize: 1, status: "Active" }),
      listAdminProducts({ pageSize: 1, status: "Rejected" }),
    ]);
    return { active: active.totalCount, rejected: rejected.totalCount };
  } catch {
    return null;
  }
}

async function getAuditEntries(): Promise<AuditLogEntry[] | null> {
  try {
    const result = await listAuditLog({ pageSize: 3 });
    return result.data;
  } catch {
    return null;
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass = tone === "warning" ? "text-[#a15c00]" : tone === "danger" ? "text-[#c0392b]" : "text-verified";
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{label}</p>
        <Icon className={`size-4 ${toneClass}`} aria-hidden />
      </div>
      <p className="mt-2 font-[family-name:var(--font-newsreader)] text-2xl text-ink">{value}</p>
    </div>
  );
}

function ComplianceTable({ vendors }: { vendors: AdminVendor[] }) {
  return (
    <AdminTableShell>
      <AdminTableHead>
        <AdminTableHeadCell>Entity</AdminTableHeadCell>
        <AdminTableHeadCell>Type</AdminTableHeadCell>
        <AdminTableHeadCell>Date</AdminTableHeadCell>
        <AdminTableHeadCell>Status</AdminTableHeadCell>
        <AdminTableHeadCell className="text-right">Actions</AdminTableHeadCell>
      </AdminTableHead>
      <tbody>
        {vendors.length === 0 ? (
          <AdminTableEmpty colSpan={5}>No compliance submissions yet.</AdminTableEmpty>
        ) : (
          vendors.map((vendor) => (
            <AdminTableRow key={vendor.id}>
              <AdminTableCell>
                <p className="font-medium">{vendor.businessLegalName}</p>
                <p className="text-xs text-text-muted">{vendor.vendorType}</p>
              </AdminTableCell>
              <AdminTableCell className="text-text-muted">Vendor application</AdminTableCell>
              <AdminTableCell className="text-text-muted">{formatDateTime(vendor.createdAt)}</AdminTableCell>
              <AdminTableCell>
                <StatusPill status={vendor.verificationStatus} />
              </AdminTableCell>
              <AdminTableCell className="text-right">
                <Link href={`/admin/vendors/${vendor.id}`} className="text-sm font-medium text-verified hover:underline">
                  View
                </Link>
              </AdminTableCell>
            </AdminTableRow>
          ))
        )}
      </tbody>
    </AdminTableShell>
  );
}
