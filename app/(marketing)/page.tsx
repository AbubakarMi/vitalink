import { Suspense } from "react";
import { HeroSearch } from "@/components/marketing/hero-search";
import { FeaturedProducts } from "@/components/marketing/featured-products";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustedBrands } from "@/components/marketing/trusted-brands";

/**
 * Landing page. Originally built to pixel-fidelity against Figma EZER-KEY
 * node 1707:7213 (design doc §9); redesigned around an "instrument panel"
 * direction — see components/marketing/vitals-waveform.tsx for the
 * signature motif — after CEO feedback that the fidelity-first pass read as
 * templated. Cache-components static shell: FeaturedProducts and
 * TrustedBrands are both async "use cache" sections (lib/api/products.ts,
 * lib/api/brands.ts), each in their own Suspense boundary. No cart-count or
 * truly-personalized recommendations slot — design doc §8 is explicit those
 * should be omitted, not faked, since there's no real per-user data source
 * for either.
 */
export default function LandingPage() {
  return (
    <main>
      <HeroSearch />
      <Suspense fallback={<div className="mx-auto h-96 max-w-5xl px-10 py-12" />}>
        <FeaturedProducts />
      </Suspense>
      <HowItWorks />
      <Testimonials />
      <Suspense fallback={<div className="mx-auto h-96 max-w-5xl px-10 py-12" />}>
        <TrustedBrands />
      </Suspense>
    </main>
  );
}
