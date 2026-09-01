import type { Product } from "@/lib/api/products";

// Fixture data only — no Product entity exists on the backend yet (design doc
// §1). Validated against the exact schema in lib/api/products.ts, so a future
// real endpoint that doesn't match this shape fails loud (Zod parse error) in dev.
//
// The two "flagship" products below match the actual designs exactly:
// landing page (Figma EZER-KEY node 1707:7213), marketplace grid (node
// 1340:439), and product detail (node 1591:3576) — including their full
// technical-specs/accessories/clinical-use-cases content. The other ~98
// products are generated (see generateCatalogProducts below) to give the
// marketplace grid/pagination/sort/filter UI something realistic to work
// against at scale. Each generated equipment *type* (monitor, centrifuge,
// microscope, etc. — see CATEGORY_TEMPLATES' imageUrls) is paired with a
// real photo of that type of equipment, sourced from Wikimedia Commons
// (CC-licensed/public-domain, not a specific brand's copyrighted product
// photography) — not a fabricated or mismatched image. Types with no
// suitable real photo found are left with imageUrl: null (rendered as a
// plain placeholder by the UI) rather than showing an unrelated photo.

const CONTEC_MONITOR: Product = {
  id: "prod_contec-cms8000",
  slug: "contec-cms8000-multi-parameter-patient-monitor",
  name: "Contec CMS8000 Multi-Parameter Patient Monitor",
  categorySlug: "medical-equipment",
  categoryLabel: "Medical Equipment",
  brand: "Contec Medical Systems",
  brandSku: "CMS8000-XL",
  manufacturedIn: "China",
  price: 252500,
  originalPrice: 450500,
  currency: "NGN",
  imageUrl: "/marketplace/product-contec-monitor.png",
  shortDescription: "Multi-parameter vital signs patient monitor.",
  inStock: true,
  trendPercent: 4,
  stockCount: 24,
  technicalSpecs: [
    { label: "Display", value: '12.1" Color TFT LCD (Max 8-channel synchronous waveform display)' },
    { label: "Monitored Parameters", value: "ECG, RESP, NIBP, SpO2, Dual-Channel TEMP, PR" },
    { label: "ECG Lead Modes", value: "3-Lead or 5-Lead (Displays 7-lead ECG waveform on one screen)" },
    { label: "NIBP Modes", value: "Manual / AUTO / Continuous (Overpressure protection included)" },
    { label: "Power Supply", value: "AC 100-240V, 50/60Hz with built-in rechargeable lithium battery" },
    { label: "Dimensions and Weight", value: "300mm x 230mm x 155mm, approx. 3.2kg" },
  ],
  includedAccessories: ["Power cord", "NIBP cuff (adult)", "SpO2 sensor", "3-lead ECG cable", "User manual"],
  clinicalUseCases: [
    "General ward and ICU patient monitoring",
    "Post-operative recovery monitoring",
    "Ambulance and emergency transport monitoring",
    "Outpatient procedure monitoring",
  ],
};

const OHAUS_BALANCE: Product = {
  id: "prod_ohaus-ex224",
  slug: "ohaus-explorer-ex224-analytical-balance",
  name: "OHAUS Explorer EX224 Analytical Balance with Draft Shield",
  categorySlug: "scientific-tools",
  categoryLabel: "Scientific Equipment",
  brand: "OHAUS Corporation",
  brandSku: "EX224",
  manufacturedIn: "USA",
  price: 1292500,
  originalPrice: 1500000,
  currency: "NGN",
  imageUrl: "/marketplace/product-ohaus-balance.png",
  shortDescription: "High-precision analytical balance with draft shield.",
  inStock: true,
  trendPercent: -10,
  stockCount: 13,
  technicalSpecs: [
    { label: "Capacity", value: "220g" },
    { label: "Readability", value: "0.1mg" },
    { label: "Pan Size", value: "90mm diameter" },
    { label: "Calibration", value: "Internal automatic calibration" },
    { label: "Draft Shield", value: "3-sided glass draft shield, motorized side doors" },
    { label: "Dimensions and Weight", value: "215mm x 330mm x 330mm, approx. 7.5kg" },
  ],
  includedAccessories: ["Power adapter", "Weighing pan", "Draft shield glass panels", "Calibration certificate"],
  clinicalUseCases: [
    "Pharmaceutical formulation weighing",
    "Analytical and research laboratory use",
    "Quality control sample weighing",
    "Reagent and standard preparation",
  ],
};

// ---- Generated catalog (~98 more products across the 4 categories) ----

interface CategoryTemplate {
  categorySlug: string;
  categoryLabel: string;
  /** One entry per nameTemplates entry — a real photo of that equipment
   * *type* (sourced from Wikimedia Commons, CC/public-domain licensed),
   * or null when no suitable real photo was found. Never a fake/generic
   * photo mislabeled as a specific type it doesn't depict. */
  imageUrls: (string | null)[];
  brands: string[];
  nameTemplates: string[];
  priceRange: [number, number];
}

const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    brands: ["Mindray", "GE Healthcare", "Philips Healthcare", "Drägerwerk", "Contec Medical Systems", "BD"],
    nameTemplates: [
      "{brand} {model} Vital Signs Monitor",
      "{brand} {model} Defibrillator",
      "{brand} {model} Infusion Pump",
      "{brand} {model} Portable Ventilator",
      "{brand} {model} ECG Machine",
      "{brand} {model} Ultrasound Scanner",
      "{brand} {model} Pulse Oximeter",
      "{brand} {model} Suction Unit",
    ],
    imageUrls: [
      "/marketplace/product-contec-monitor.png",
      "/marketplace/generated/defibrillator.jpg",
      "/marketplace/generated/infusion-pump.jpg",
      null,
      "/marketplace/generated/ecg-machine.jpg",
      null,
      "/marketplace/generated/pulse-oximeter.jpg",
      null,
    ],
    priceRange: [85000, 3200000],
  },
  {
    categorySlug: "scientific-tools",
    categoryLabel: "Scientific Equipment",
    brands: ["Mettler Toledo", "Sartorius", "Eppendorf", "Thermo Fisher Scientific", "OHAUS Corporation", "IKA"],
    nameTemplates: [
      "{brand} {model} Analytical Balance",
      "{brand} {model} Centrifuge",
      "{brand} {model} pH Meter",
      "{brand} {model} Spectrophotometer",
      "{brand} {model} Microplate Reader",
      "{brand} {model} Vortex Mixer",
      "{brand} {model} Hot Plate Stirrer",
      "{brand} {model} Water Bath",
    ],
    imageUrls: [
      "/marketplace/product-ohaus-balance.png",
      "/marketplace/generated/centrifuge.jpg",
      "/marketplace/generated/ph-meter.jpg",
      "/marketplace/generated/spectrophotometer.jpg",
      null,
      "/marketplace/generated/vortex-mixer.jpg",
      "/marketplace/generated/hot-plate-stirrer.jpg",
      null,
    ],
    priceRange: [65000, 2100000],
  },
  {
    categorySlug: "reagents-culture-media",
    categoryLabel: "Reagents & Culture Media",
    brands: ["Randox", "Abbott Diagnostics", "Roche Diagnostics", "Merck", "Bio-Rad", "VWR"],
    nameTemplates: [
      "{brand} {model} Reagent Kit",
      "{brand} {model} Culture Media 500g",
      "{brand} {model} Buffer Solution 1L",
      "{brand} {model} Test Strips (Pack of 50)",
      "{brand} {model} Stain Kit",
      "{brand} {model} Control Serum",
    ],
    imageUrls: [null, null, null, null, null, null],
    priceRange: [12000, 180000],
  },
  {
    categorySlug: "lab-equipment",
    categoryLabel: "Lab Equipment",
    brands: ["Hettich", "Memmert", "Binder", "Olympus", "Zeiss", "Leica Microsystems"],
    nameTemplates: [
      "{brand} {model} Biological Microscope",
      "{brand} {model} Laboratory Incubator",
      "{brand} {model} Fume Hood",
      "{brand} {model} Laboratory Freezer",
      "{brand} {model} Autoclave Sterilizer",
      "{brand} {model} Pipette Set",
    ],
    imageUrls: [
      "/marketplace/generated/microscope.jpg",
      "/marketplace/generated/incubator.jpg",
      null,
      null,
      "/marketplace/generated/autoclave.jpg",
      "/marketplace/generated/pipette-set.jpg",
    ],
    priceRange: [45000, 4500000],
  },
];

/** Real brand names actually assigned to catalog products above — used to
 * populate the Brand filter with options that are guaranteed to match at
 * least one product, rather than a fabricated or aspirational brand list. */
export const CATALOG_BRANDS = Array.from(new Set(CATEGORY_TEMPLATES.flatMap((template) => template.brands))).sort();

const MODEL_LETTERS = ["X", "Pro", "V", "Elite", "Compact", "Plus", "S", "T"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Deterministic (index-seeded, not Math.random()) so slugs/output stay
 * stable across builds — required for generateStaticParams. */
function generateCatalogProducts(count: number): Product[] {
  const products: Product[] = [];

  for (let i = 0; i < count; i++) {
    const template = CATEGORY_TEMPLATES[i % CATEGORY_TEMPLATES.length];
    const brand = template.brands[i % template.brands.length];
    const nameTemplateIndex = Math.floor(i / CATEGORY_TEMPLATES.length) % template.nameTemplates.length;
    const nameTemplate = template.nameTemplates[nameTemplateIndex];
    const imageUrl = template.imageUrls[nameTemplateIndex];
    const modelLetter = MODEL_LETTERS[i % MODEL_LETTERS.length];
    const modelNumber = 100 + ((i * 37) % 900);
    const model = `${modelLetter}${modelNumber}`;
    const name = nameTemplate.replace("{brand}", brand).replace("{model}", model);
    const slug = `${slugify(brand)}-${slugify(name)}-${i}`;

    const [minPrice, maxPrice] = template.priceRange;
    const priceStep = (maxPrice - minPrice) / count;
    const price = Math.round((minPrice + priceStep * i) / 500) * 500;
    const hasDiscount = i % 3 === 0;
    const trendPercent = ((i * 7) % 21) - 10; // spread of -10..+10
    const stockCount = 3 + ((i * 5) % 60);

    products.push({
      id: `prod_gen_${i}`,
      slug,
      name,
      categorySlug: template.categorySlug,
      categoryLabel: template.categoryLabel,
      brand,
      brandSku: model,
      manufacturedIn: ["China", "USA", "Germany", "Japan"][i % 4],
      price,
      originalPrice: hasDiscount ? Math.round((price * 1.2) / 500) * 500 : undefined,
      currency: "NGN",
      imageUrl,
      shortDescription: `${name} for professional and laboratory use.`,
      inStock: stockCount > 0,
      trendPercent,
      stockCount,
    });
  }

  return products;
}

export const mockProducts: Product[] = [
  CONTEC_MONITOR,
  OHAUS_BALANCE,
  {
    id: "prod_olympus-cx23",
    slug: "biological-olympus-microscope-cx23",
    name: "Biological Olympus microscope Model CX23",
    categorySlug: "lab-equipment",
    categoryLabel: "Lab Equipment",
    price: 2550000,
    currency: "NGN",
    imageUrl: "/marketplace/generated/microscope.jpg",
    shortDescription: "Compound biological microscope for lab and educational use.",
    inStock: true,
    badge: "FDA Approved",
    freeDelivery: true,
  },
  {
    id: "prod_randox-tex-kit",
    slug: "randox-tex-kit-alt-kit",
    name: "Randox Tex Kit Alt Kit",
    categorySlug: "reagents-culture-media",
    categoryLabel: "Reagents & Culture Media",
    price: 45000,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "Diagnostic reagent kit for clinical testing.",
    inStock: true,
    badge: "NAFDAC Approved",
    freeDelivery: true,
  },
  {
    id: "prod_nutrient-agar-500g",
    slug: "nutrient-agar-500g",
    name: "Nutrient Agar 500g",
    categorySlug: "reagents-culture-media",
    categoryLabel: "Reagents & Culture Media",
    price: 48000,
    currency: "NGN",
    imageUrl: null,
    shortDescription: "General-purpose culture media for microbial growth.",
    inStock: true,
    badge: "NAFDAC Approved",
    freeDelivery: true,
  },
  ...generateCatalogProducts(95),
];
