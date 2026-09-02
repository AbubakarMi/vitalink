import { notFound, redirect } from "next/navigation";
import { getProductBySlug, listProducts } from "@/lib/api/products";
import { listReviewsForProduct } from "@/lib/api/reviews";
import { getMarketplaceProductBySlug, MARKETPLACE_LIVE } from "@/lib/api/marketplace";
import { ProductHero } from "@/components/marketplace/product-hero";
import { ProductDetailTabs } from "@/components/marketplace/product-detail-tabs";
import { ProductReviews } from "@/components/marketplace/product-reviews";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { LiveProductDetail } from "@/components/marketplace/live-product-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-computes the known (mocked) slugs so this route prerenders fully static
 * instead of tripping Cache Components' instant-navigation validation on an
 * un-prerenderable dynamic param. Skipped once PRODUCTS_DATA_SOURCE=live —
 * a real, dynamically-priced/stocked catalog isn't something to prerender at
 * build time; dynamicParams defaults to true, so any slug still renders
 * on-demand instead.
 */
export async function generateStaticParams() {
  if (MARKETPLACE_LIVE) return [];
  const products = await listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

/**
 * Public product detail — Figma EZER-KEY node 1591:3576. Mocked product
 * by default (design doc §1, §9); once PRODUCTS_DATA_SOURCE=live, renders
 * the real Product+Offer response instead (components/marketplace/
 * live-product-detail.tsx's Buy Box) — a genuinely different shape, not a
 * reskin of the mock tree below. View-only for anonymous visitors beyond
 * the cart, which is real client-side state (lib/cart/store.tsx) in mock
 * mode, or the real backend cart (lib/api/cart.ts) in live mode.
 */
export default async function PublicProductPage({ params }: PageProps) {
  const { slug } = await params;

  if (MARKETPLACE_LIVE) {
    const envelope = await getMarketplaceProductBySlug(slug);
    if (!envelope) {
      notFound();
    }
    if (envelope.isRedirect) {
      redirect(`/products/${envelope.canonicalSlug}`);
    }
    return <LiveProductDetail product={envelope.product} />;
  }

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
