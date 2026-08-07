// Fixture data only — no Product entity exists on the backend yet (design doc
// §1). Validated against the exact schema in lib/api/products.ts, so a future
// real endpoint that doesn't match this shape fails loud (Zod parse error) in dev.
export const mockProducts = [
  {
    id: "prod_paracetamol-500",
    slug: "paracetamol-500mg",
    name: "Paracetamol 500mg (20 tablets)",
    categorySlug: "otc-medication",
    price: 850,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "Fast-acting pain and fever relief for adults.",
    inStock: true,
  },
  {
    id: "prod_vitamin-c-1000",
    slug: "vitamin-c-1000mg",
    name: "Vitamin C 1000mg (30 tablets)",
    categorySlug: "wellness-supplements",
    price: 3200,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "Daily immune support supplement.",
    inStock: true,
  },
  {
    id: "prod_infant-fever-syrup",
    slug: "infant-fever-relief-syrup",
    name: "Infant Fever Relief Syrup (60ml)",
    categorySlug: "mother-child-care",
    price: 1450,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "Gentle fever and pain relief for children 6 months to 5 years.",
    inStock: true,
  },
  {
    id: "prod_digital-thermometer",
    slug: "digital-thermometer",
    name: "Digital Infrared Thermometer",
    categorySlug: "medical-devices",
    price: 12500,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "Contactless, fast, accurate temperature readings.",
    inStock: false,
  },
];
