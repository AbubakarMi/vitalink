import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { getVendorDetails } from "@/lib/api/admin/vendors";
import { listVendorDocuments } from "@/lib/api/admin/vendor-documents";
import { listAdminProducts } from "@/lib/api/admin/products";
import { VendorApplicationReview } from "@/components/admin/vendor-application-review";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Real — GetVendorDetails (design doc §1, §5). Permission-gated: Permissions.Vendors.List. */
export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAccountType("admin", "/admin/vendors");
  const { id } = await params;

  if (!hasPermission(session, "Vendors", "List")) {
    return (
      <main>
        <h1 className="text-2xl font-semibold text-ink">Vendor application</h1>
        <p className="mt-2 text-sm text-text-muted">You don&apos;t have permission to view this.</p>
      </main>
    );
  }

  const vendor = await getVendorDetails(id);
  const [documents, products] = await Promise.all([
    listVendorDocuments(id).catch(() => null),
    listAdminProducts({ vendorId: id, pageSize: 20 })
      .then((r) => r.data)
      .catch(() => null),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/vendors" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Back to vendors
      </Link>
      <VendorApplicationReview vendor={vendor} documents={documents} products={products} />
    </main>
  );
}
