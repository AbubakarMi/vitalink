import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { listVendors } from "@/lib/api/admin/vendors";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Real — GetVendors (design doc §1, §5). Permission-gated: Permissions.Vendors.List. */
export default async function AdminVendorsPage() {
  const session = await requireAccountType("admin", "/admin/vendors");

  if (!hasPermission(session, "Vendors", "List")) {
    return (
      <main>
        <h1>Vendor approvals</h1>
        <p>You don&apos;t have permission to view this.</p>
      </main>
    );
  }

  const vendors = await listVendors();

  return (
    <main>
      <h1>Vendor approvals</h1>
      <ul>
        {vendors.data.map((vendor) => (
          <li key={vendor.id}>
            <a href={`/admin/vendors/${vendor.id}`}>
              {vendor.businessLegalName} — {vendor.verificationStatus}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
