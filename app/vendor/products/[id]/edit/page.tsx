import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccountType } from "@/lib/auth/dal";
import { getVendorProductById } from "@/lib/api/vendor-products";
import { EditProductForm } from "@/components/vendor/edit-product-form";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVendorProductPage({ params }: PageProps) {
  await requireAccountType("vendor", "/vendor/products");
  const { id } = await params;
  const product = await getVendorProductById(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/vendor/products/${id}`} className="text-sm font-medium text-text-muted hover:text-ink">
        ← {product.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Edit Product</h1>
      <p className="mt-1 text-sm text-text-muted">Update the listing&apos;s details, pricing, stock, and images.</p>

      <div className="mt-6">
        <EditProductForm product={product} />
      </div>
    </div>
  );
}
