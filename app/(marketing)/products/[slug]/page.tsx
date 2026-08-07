import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/lib/api/products";

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

/** Public product detail — mocked product (design doc §1, §9). View-only; the buy
 * CTA gates to auth. JSON-LD included since this is a publicly indexable page. */
export default async function PublicProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

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
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1>{product.name}</h1>
      <p>{product.shortDescription}</p>
      <p>
        {product.price} {product.currency}
      </p>
      <a href="/login?redirect=/buyer/catalog">Sign in to buy</a>
    </main>
  );
}
