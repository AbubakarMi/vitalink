import { requireAccountType } from "@/lib/auth/dal";
import { getTransactionSummary } from "@/lib/api/admin/transactions";
import { getPendingApprovalCounts } from "@/lib/api/admin/approvals";
import { DashboardShell } from "@/components/admin/dashboard-shell";

export const instant = false; // reads cookies — genuinely dynamic

/**
 * Admin shell. AccountType==="Staff" check here is a UX convenience, not the
 * security boundary (design doc §2.2) — every admin page also calls
 * requireAccountType("admin", ...) directly. Per-resource permission checks
 * (Permissions.Vendors.List, etc.) happen inside each page via
 * lib/auth/permissions.ts's hasPermission(), not here — see design doc §5.
 *
 * Sidebar + header shell built from the "Super Admin Dashboard" mockup
 * (super admin/Super Admin Dashboard.pdf) — components/admin/dashboard-shell.tsx.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAccountType("admin", "/admin/dashboard");
  const [summary, pendingApprovals] = await Promise.all([
    getTransactionSummary().catch(() => null),
    getPendingApprovalCounts().catch(() => null),
  ]);
  return (
    <DashboardShell name={session.displayName || session.email} walletBalance={summary?.fundsInEscrow} pendingApprovals={pendingApprovals}>
      {children}
    </DashboardShell>
  );
}
