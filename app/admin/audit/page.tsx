import { ShieldAlert } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listAuditLog } from "@/lib/api/admin/audit";
import { ComingSoon } from "@/components/admin/coming-soon";
import { AdminTableShell, AdminTableHead, AdminTableHeadCell, AdminTableRow, AdminTableCell, AdminTableEmpty } from "@/components/admin/admin-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Security log — dashboard's "View Security log" link (super admin/Super Admin
 * Dashboard.pdf). Real endpoint (GetAdminAuditLogs), shape unconfirmed yet — see
 * lib/api/admin/audit.ts. */
export default async function AdminAuditPage() {
  await requireAccountType("admin", "/admin/audit");
  const result = await listAuditLog({ pageSize: 50 }).catch(() => null);

  if (result === null) {
    return (
      <ComingSoon
        icon={ShieldAlert}
        title="Security log"
        description="The audit log isn't reachable yet — check back once the endpoint is wired up."
      />
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Security log</h1>
      <AdminTableShell>
        <AdminTableHead>
          <AdminTableHeadCell>Event</AdminTableHeadCell>
          <AdminTableHeadCell>Actor</AdminTableHeadCell>
          <AdminTableHeadCell>IP Address</AdminTableHeadCell>
          <AdminTableHeadCell>When</AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {result.data.length === 0 ? (
            <AdminTableEmpty colSpan={4}>No anomalies logged.</AdminTableEmpty>
          ) : (
            result.data.map((entry) => (
              <AdminTableRow key={entry.id}>
                <AdminTableCell>
                  <p className="font-medium">{entry.event}</p>
                  {entry.description && <p className="text-xs text-text-muted">{entry.description}</p>}
                </AdminTableCell>
                <AdminTableCell className="text-text-muted">{entry.actorName ?? "—"}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{entry.ipAddress ?? "—"}</AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  {new Date(entry.createdAt).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </tbody>
      </AdminTableShell>
    </main>
  );
}
