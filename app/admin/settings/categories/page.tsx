import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listAdminProductCategories } from "@/lib/api/admin/categories";
import { ProductCategoriesSettings } from "@/components/admin/product-categories-settings";
import { AddCategoryModal } from "@/components/admin/add-category-modal";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

/** Second page under the "Configuration" module — the product category
 * taxonomy. See app/admin/settings/page.tsx for the other Configuration
 * screen (vendor onboarding fields). */
export default async function AdminCategoriesSettingsPage() {
  await requireAccountType("admin", "/admin/settings/categories");
  const categories = await listAdminProductCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Configuration</p>
          <h1 className="mt-1 font-[family-name:var(--font-newsreader)] text-3xl text-ink">Product Categories</h1>
        </div>
        <AddCategoryModal />
      </div>
      <p className="mt-2 max-w-xl text-sm text-text-muted">
        The taxonomy vendors list products into and customers filter by. Deactivating a category hides it from new
        listings without deleting anything already assigned to it.
      </p>

      <Link
        href="/admin/settings"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-verified hover:underline"
      >
        <ClipboardList className="size-4" aria-hidden />
        Configure onboarding fields instead →
      </Link>

      <div className="mt-6">
        <ProductCategoriesSettings categories={categories} />
      </div>
    </div>
  );
}
