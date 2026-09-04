import Link from "next/link";
import { requireAccountType } from "@/lib/auth/dal";
import { listProductsForVendor } from "@/lib/api/vendor-products";
import { VendorTableShell, VendorTableHead, VendorTableHeadCell, VendorTableEmpty } from "@/components/vendor/vendor-table";
import { ArchivedProductRow } from "@/components/vendor/archived-product-row";
import { unarchiveProductAction } from "../actions";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Archived listings, split out from the main Inventory table/filter so
 * "where did my product go" has one obvious answer, and un-archiving (the
 * only action available here) doesn't get lost among every other status
 * filter. See archive-confirm-button.tsx for where archiving itself happens
 * (product detail page + the main Inventory table row action). */
export default async function VendorArchivedProductsPage() {
  await requireAccountType("vendor", "/vendor/products");
  const allProducts = await listProductsForVendor();
  const archived = allProducts.filter((p) => p.status === "Archived");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Archived Products</h1>
          <p className="mt-1 text-sm text-text-muted">
            Off the marketplace and hidden from customers. Un-archive to bring a listing back.
          </p>
        </div>
        <Link href="/vendor/products" className="text-sm font-medium text-verified hover:underline">
          ← Back to Inventory
        </Link>
      </div>

      <div className="mt-6">
        <VendorTableShell>
          <VendorTableHead>
            <VendorTableHeadCell>Product Info</VendorTableHeadCell>
            <VendorTableHeadCell>Price</VendorTableHeadCell>
            <VendorTableHeadCell>Brand</VendorTableHeadCell>
            <VendorTableHeadCell>Category</VendorTableHeadCell>
            <VendorTableHeadCell>Status</VendorTableHeadCell>
            <VendorTableHeadCell>Actions</VendorTableHeadCell>
          </VendorTableHead>
          <tbody>
            {archived.length === 0 && <VendorTableEmpty colSpan={6}>No archived products.</VendorTableEmpty>}
            {archived.map((product) => (
              <ArchivedProductRow key={product.id} product={product} onUnarchive={unarchiveProductAction.bind(null, product.id)} />
            ))}
          </tbody>
        </VendorTableShell>
      </div>
    </div>
  );
}
