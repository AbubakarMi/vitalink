import { Suspense } from "react";
import { HeroSearch } from "@/components/marketing/hero-search";
import { FeaturedProducts } from "@/components/marketing/featured-products";
import { LatestInnovation } from "@/components/marketing/latest-innovation";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustedBrands } from "@/components/marketing/trusted-brands";

/**
 * Landing page — Figma EZER-KEY node 1707:7213, adapted for anonymous
 * visitors (design doc §9, and the follow-up decision to target the public
 * route rather than /buyer/dashboard). Cache-components static shell: the
 * hero and FeaturedProducts are both backed by "use cache" mocked data
 * (lib/api/products.ts) — see design doc §1 correction on why nothing here
 * is real category/brand data yet. No cart-count or truly-personalized
 * recommendations slot — design doc §8 is explicit those should be omitted,
 * not faked, since there's no real per-user data source for either.
 */
export default function LandingPage() {
  return (
    <main>
      <HeroSearch />
      <Suspense fallback={<div className="mx-auto h-96 max-w-5xl px-10 py-12" />}>
        <FeaturedProducts />
      </Suspense>
      <LatestInnovation />
      <Testimonials />
      <TrustedBrands />
    </main>
  );
}
