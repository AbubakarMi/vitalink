import { ProductCard } from "@/components/marketing/featured-products";
import { listProducts } from "@/lib/api/products";

interface PageProps {
  searchParams: Promise<{ categorySlug?: string; search?: string }>;
}

// Reads searchParams directly — genuinely per-request dynamic (category/search
// filtering), not prerenderable, same pattern as the cookie-dependent pages.
export const instant = false;

/** Public catalog browse — mocked products (design doc §1, §9). Reads the
 * categorySlug/search params the footer links and hero search form (from the
 * Figma landing page) submit here. */
export default async function PublicCatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const products = await listProducts(params);

  return (
    <main className="mx-auto max-w-5xl px-10 py-12">
      <h1 className="text-2xl font-bold text-[#0f3e17]">Shop health products</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {products.length === 0 && <p className="text-text-muted">No products match that search yet.</p>}
      </div>
    </main>
  );
}
