import { notFound } from "next/navigation";
import { requireAccountType } from "@/lib/auth/dal";
import { getVendorProductById } from "@/lib/api/vendor-products";
import { listReviewsForProduct } from "@/lib/api/reviews";
import { ProductDetailView } from "@/components/vendor/product-detail-view";
import { publishProductAction, regenerateProductAction, deleteProductAction, restockProductAction, archiveProductAction } from "./actions";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Branches between the draft-review card and the full published page inside
 * ProductDetailView (design doc §6) rather than having two routes. */
export default async function VendorProductDetailPage({ params }: PageProps) {
  await requireAccountType("vendor", "/vendor/products");
  const { id } = await params;
  const product = await getVendorProductById(id);
  if (!product) {
    notFound();
  }
  const reviews = await listReviewsForProduct(id);

  return (
    <ProductDetailView
      product={product}
      reviews={reviews}
      onPublish={publishProductAction.bind(null, id)}
      onRegenerate={regenerateProductAction.bind(null, id)}
      onDelete={deleteProductAction.bind(null, id)}
      onArchive={archiveProductAction.bind(null, id)}
      onRestock={restockProductAction.bind(null, id)}
    />
  );
}
