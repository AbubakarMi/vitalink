import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { listStaff } from "@/lib/api/admin/staff";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Real — Staff/Roles endpoints (design doc §1, §5). Permission-gated: Permissions.Staff.List. */
export default async function AdminUsersPage() {
  const session = await requireAccountType("admin", "/admin/users");

  if (!hasPermission(session, "Staff", "List")) {
    return (
      <main>
        <p>You don&apos;t have permission to view this.</p>
      </main>
    );
  }

  const staff = await listStaff();

  return (
    <main>
      <h1>Staff users</h1>
      <ul>
        {staff.data.map((member) => (
          <li key={member.id}>
            {member.name} — {member.role.join(", ")}
          </li>
        ))}
      </ul>
    </main>
  );
}
