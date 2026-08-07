import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/lib/api/products";
import { listReviewsForProduct } from "@/lib/api/reviews";
import { ProductHero } from "@/components/marketplace/product-hero";
import { ProductDetailTabs } from "@/components/marketplace/product-detail-tabs";
import { ProductReviews } from "@/components/marketplace/product-reviews";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-computes the known (mocked) slugs so this route prerenders fully static
 * instead of tripping Cache Components' instant-navigation validation on an
 * un-prerenderable dynamic param. Once products are real, this still works the
 * same way against the live adapter — see design doc §1/§4.
 */
export async function generateStaticParams() {
  const products = await listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

/**
 * Public product detail — Figma EZER-KEY node 1591:3576. Mocked product
 * (design doc §1, §9). View-only for anonymous visitors beyond the cart,
 * which is real client-side state (lib/cart/store.tsx).
 */
export default async function PublicProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [reviews, allProducts] = await Promise.all([
    listReviewsForProduct(product.id),
    listProducts({ categorySlug: product.categorySlug }),
  ]);
  const similarProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto max-w-[1282px] space-y-10 px-10 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ProductHero product={product} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[717fr_565fr]">
        <ProductDetailTabs product={product} />
        <ProductReviews reviews={reviews} />
      </div>

      {similarProducts.length > 0 && (
        <div>
          <h2 className="text-[28px] font-semibold text-[#1a4d3e]">Similar Products</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((similar) => (
              <MarketplaceProductCard key={similar.id} product={similar} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
