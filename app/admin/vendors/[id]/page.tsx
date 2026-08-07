import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { getVendorDetails } from "@/lib/api/admin/vendors";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Real — GetVendorDetails/Approve/Reject/UnderReview (design doc §1, §5). */
export default async function AdminVendorDetailPage({ params }: PageProps) {
  const session = await requireAccountType("admin", "/admin/vendors");
  const { id } = await params;

  if (!hasPermission(session, "Vendors", "Read")) {
    return (
      <main>
        <p>You don&apos;t have permission to view this.</p>
      </main>
    );
  }

  const vendor = await getVendorDetails(id);

  return (
    <main>
      <h1>{vendor.businessLegalName}</h1>
      <p>Status: {vendor.verificationStatus}</p>
      <p>Approve/reject actions pending — see lib/api/admin/vendors.ts.</p>
    </main>
  );
}
