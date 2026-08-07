// Fixture data only — no Product entity exists on the backend yet (design doc
// §1). Validated against the exact schema in lib/api/products.ts, so a future
// real endpoint that doesn't match this shape fails loud (Zod parse error) in dev.
// Content (names, prices, badges) matches the landing page design exactly
// (Figma EZER-KEY, node 1707:7213) rather than being invented separately.
export const mockProducts = [
  {
    id: "prod_olympus-cx23",
    slug: "biological-olympus-microscope-cx23",
    name: "Biological Olympus microscope Model CX23",
    categorySlug: "lab-equipment",
    price: 2550000,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "Compound biological microscope for lab and educational use.",
    inStock: true,
    badge: "FDA Approved" as const,
    freeDelivery: true,
  },
  {
    id: "prod_randox-tex-kit",
    slug: "randox-tex-kit-alt-kit",
    name: "Randox Tex Kit Alt Kit",
    categorySlug: "reagents-culture-media",
    price: 45000,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "Diagnostic reagent kit for clinical testing.",
    inStock: true,
    badge: "NAFDAC Approved" as const,
    freeDelivery: true,
  },
  {
    id: "prod_nutrient-agar-500g",
    slug: "nutrient-agar-500g",
    name: "Nutrient Agar 500g",
    categorySlug: "reagents-culture-media",
    price: 48000,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "General-purpose culture media for microbial growth.",
    inStock: true,
    badge: "NAFDAC Approved" as const,
    freeDelivery: true,
  },
];
