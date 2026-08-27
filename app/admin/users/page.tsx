import { UserPlus } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { listStaff } from "@/lib/api/admin/staff";
import { listRolesDropdown } from "@/lib/api/admin/roles";
import { InviteStaffModal } from "@/components/admin/invite-staff-modal";
import { StaffModerationActions } from "@/components/admin/staff-moderation-actions";
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
 * Real — Staff/Roles endpoints (design doc §1, §5). Permission-gated:
 * Permissions.Staff.List. Every new invite starts "Pending Review" until a
 * Super Admin approves it (lib/api/mocks/admin-store.ts's approvalStatus) —
 * users going under review isn't just vendors/products.
 */
export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await requireAccountType("admin", "/admin/users");
  const params = await searchParams;

  if (!hasPermission(session, "Staff", "List")) {
    return (
      <main>
        <h1 className="text-2xl font-semibold text-ink">Users</h1>
        <p className="mt-2 text-sm text-text-muted">You don&apos;t have permission to view this.</p>
      </main>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const [staff, roles] = await Promise.all([
    listStaff({ page, pageSize: 12, search: params.search }),
    listRolesDropdown().catch(() => []),
  ]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Users</h1>
          <p className="mt-1 text-sm text-text-muted">{staff.totalCount.toLocaleString("en-NG")} staff accounts.</p>
        </div>
        <InviteStaffModal
          roles={roles}
          existingStaff={staff.data.map((s) => ({ id: s.id, name: s.name, role: s.role }))}
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
            >
              <UserPlus className="size-4" aria-hidden />
              Invite staff
            </button>
          }
        />
      </div>

      <form action="/admin/users" className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5">
        <input
          type="search"
          name="search"
          defaultValue={params.search}
          placeholder="Search by email or name"
          className="w-full bg-transparent text-sm text-ink-soft outline-none placeholder:text-text-muted"
        />
      </form>

      <AdminTableShell>
        <AdminTableHead>
          <AdminTableHeadCell>Name</AdminTableHeadCell>
          <AdminTableHeadCell>Email</AdminTableHeadCell>
          <AdminTableHeadCell>Role</AdminTableHeadCell>
          <AdminTableHeadCell>Last login</AdminTableHeadCell>
          <AdminTableHeadCell>Status</AdminTableHeadCell>
          <AdminTableHeadCell className="text-right">Actions</AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {staff.data.length === 0 ? (
            <AdminTableEmpty colSpan={6}>No staff match that search.</AdminTableEmpty>
          ) : (
            staff.data.map((member) => (
              <AdminTableRow key={member.id}>
                <AdminTableCell className="font-medium">{member.name}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{member.email}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{member.role.join(", ") || "—"}</AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  {member.lastLoginAt
                    ? new Date(member.lastLoginAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })
                    : "Never"}
                </AdminTableCell>
                <AdminTableCell>
                  <StatusPill status={!member.isActive ? "Suspended" : (member.approvalStatus ?? "Approved")} />
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <StaffModerationActions
                    staffId={member.id}
                    pendingReview={member.approvalStatus === "PendingReview"}
                    isActive={member.isActive}
                  />
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </tbody>
      </AdminTableShell>

      <AdminPagination
        page={page}
        totalPages={staff.totalPages}
        totalCount={staff.totalCount}
        pageSize={staff.pageSize}
        basePath="/admin/users"
        searchParams={{ search: params.search }}
      />
    </main>
  );
}
