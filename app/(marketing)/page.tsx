import { Suspense } from "react";
import { listFeaturedCategories } from "@/lib/api/categories";
import { listProducts } from "@/lib/api/products";

/**
 * Landing page — cache-components static shell (hero + these two "use cache"
 * sections) with Suspense boundaries so each section can stream independently.
 * Both sections are backed by mocked data today (design doc §1 correction: no
 * account type can read real category/brand data yet); the "use cache" directive
 * lives on the lib/api functions themselves, not here — see lib/api/categories.ts
 * and lib/api/products.ts.
 *
 * No cart-count or personalized-recommendations slot yet: design doc §8 is
 * explicit that these should be omitted, not faked, since there's no real data
 * source for either.
 */
export default function LandingPage() {
  return (
    <main>
      <section>
        <h1>Vitalink</h1>
        <p>Discover, understand, and safely use health products with confidence.</p>
        <nav>
          <a href="/buyer/catalog">Shop health products</a>
          <a href="/vendor-apply">Sell on Vitalink</a>
        </nav>
      </section>

      <section>
        <h2>Categories</h2>
        <Suspense fallback={<p>Loading categories…</p>}>
          <FeaturedCategories />
        </Suspense>
      </section>

      <section>
        <h2>Trending products</h2>
        <Suspense fallback={<p>Loading products…</p>}>
          <TrendingProducts />
        </Suspense>
      </section>
    </main>
  );
}

async function FeaturedCategories() {
  const categories = await listFeaturedCategories();
  return (
    <ul>
      {categories.map((category) => (
        <li key={category.id}>{category.name}</li>
      ))}
    </ul>
  );
}

async function TrendingProducts() {
  const products = await listProducts();
  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
