import "server-only";
import { randomUUID } from "node:crypto";
import type { Product, VendorProductStatus } from "../products";

/**
 * In-memory vendor inventory, keyed by the signed-in vendor's userId — same
 * globalThis-pinning pattern as lib/api/mocks/vendor-profile-store.ts (Next's
 * dev-mode Fast Refresh re-evaluates server modules on unrelated file edits
 * far more often than a real process restart would, which would otherwise
 * wipe a vendor's data mid-session). A vendor's inventory is just `Product`
 * records scoped to their own vendorId — see lib/api/products.ts's vendor
 * fields — not a separate data model.
 */

type SeedProduct = Pick<
  Product,
  | "name"
  | "brand"
  | "brandSku"
  | "categorySlug"
  | "categoryLabel"
  | "price"
  | "stockCount"
  | "manufacturedIn"
  | "shortDescription"
  | "imageUrl"
> & {
  status: VendorProductStatus;
  promoPrice?: number;
  lowStockThreshold: number;
  technicalSpecs?: Product["technicalSpecs"];
  includedAccessories?: Product["includedAccessories"];
  clinicalUseCases?: Product["clinicalUseCases"];
};

const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Contec CMS8000 Multi-Parameter Patient Monitor",
    brand: "Contec Medical Systems",
    brandSku: "CMS8000-XL",
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    price: 252500,
    stockCount: 24,
    lowStockThreshold: 10,
    status: "Active",
    imageUrl: "/marketplace/product-contec-monitor.png",
    manufacturedIn: "China",
    shortDescription:
      "Multi-parameter vital signs monitor for ward, ICU, and transport use — ECG, SpO2, NIBP, and dual-channel temperature on one 12.1\" color display.",
  },
  {
    name: "3M Littmann Cardiology IV Diagnostic Stethoscope",
    brand: "3M Littmann",
    brandSku: "Cardiology IV",
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    price: 45250,
    promoPrice: 40250,
    stockCount: 120,
    lowStockThreshold: 20,
    status: "Active",
    imageUrl: null,
    manufacturedIn: "United States",
    shortDescription:
      "Premium cardiology-grade stethoscope with tunable diaphragm technology, built for isolating subtle, hard-to-hear physiological changes.",
  },
  {
    name: "SonoQX Handheld Ultrasound",
    brand: "Olympus",
    brandSku: "SonoQX",
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    price: 325960,
    stockCount: 6,
    lowStockThreshold: 8,
    status: "Archived",
    imageUrl: null,
    manufacturedIn: "Japan",
    shortDescription: "Handheld point-of-care ultrasound probe with wireless companion display.",
  },
  {
    name: "DreamStation Auto CPAP Machine",
    brand: "Philips Respironics",
    brandSku: "DSX500H15",
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    price: 325960,
    stockCount: 18,
    lowStockThreshold: 10,
    status: "Active",
    imageUrl: null,
    manufacturedIn: "United States",
    shortDescription: "Auto-adjusting CPAP therapy device with integrated humidifier for sleep apnea management.",
  },
  {
    name: "Benchtop Autoclave Sterilizer",
    brand: "Tuttnauer",
    brandSku: "3870EA",
    categorySlug: "lab-equipment",
    categoryLabel: "Lab Equipment",
    price: 890000,
    stockCount: 9,
    lowStockThreshold: 5,
    status: "Active",
    imageUrl: "/marketplace/generated/autoclave.jpg",
    manufacturedIn: "Israel",
    shortDescription: "Class B benchtop steam sterilizer for instruments, glassware, and porous loads.",
  },
  {
    name: "Refrigerated Benchtop Centrifuge",
    brand: "Eppendorf",
    brandSku: "5920 R",
    categorySlug: "lab-equipment",
    categoryLabel: "Lab Equipment",
    price: 2450000,
    stockCount: 4,
    lowStockThreshold: 5,
    status: "Active",
    imageUrl: "/marketplace/generated/centrifuge.jpg",
    manufacturedIn: "Germany",
    shortDescription: "High-capacity refrigerated centrifuge for blood banking and cell culture workflows.",
  },
  {
    name: "HeartStart Cardiac Defibrillator",
    brand: "Philips",
    brandSku: "HS1",
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    price: 980000,
    stockCount: 11,
    lowStockThreshold: 5,
    status: "PendingReview",
    imageUrl: "/marketplace/generated/defibrillator.jpg",
    manufacturedIn: "Netherlands",
    shortDescription: "Automated external defibrillator with voice-guided rescue prompts for emergency response teams.",
  },
  {
    name: "Portable 12-Lead ECG Machine",
    brand: "Mindray",
    brandSku: "BeneHeart R3",
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    price: 610000,
    stockCount: 14,
    lowStockThreshold: 6,
    status: "Active",
    imageUrl: "/marketplace/generated/ecg-machine.jpg",
    manufacturedIn: "China",
    shortDescription: "Compact 12-lead electrocardiograph with thermal printer and interpretive analysis.",
  },
  {
    name: "Digital Hot Plate Magnetic Stirrer",
    brand: "IKA",
    brandSku: "C-MAG HS 7",
    categorySlug: "lab-equipment",
    categoryLabel: "Lab Equipment",
    price: 185000,
    stockCount: 32,
    lowStockThreshold: 10,
    status: "Active",
    imageUrl: "/marketplace/generated/hot-plate-stirrer.jpg",
    manufacturedIn: "Germany",
    shortDescription: "Ceramic-coated hot plate stirrer with digital temperature control up to 500°C.",
  },
  {
    name: "CO2 Cell Culture Incubator",
    brand: "Thermo Fisher Scientific",
    brandSku: "Heracell VIOS 160i",
    categorySlug: "lab-equipment",
    categoryLabel: "Lab Equipment",
    price: 3200000,
    stockCount: 2,
    lowStockThreshold: 3,
    status: "OutOfStock",
    imageUrl: "/marketplace/generated/incubator.jpg",
    manufacturedIn: "United States",
    shortDescription: "Direct-heat CO2 incubator with copper interior for contamination-resistant cell culture.",
  },
  {
    name: "Volumetric Infusion Pump",
    brand: "B. Braun",
    brandSku: "Infusomat Space",
    categorySlug: "medical-equipment",
    categoryLabel: "Medical Equipment",
    price: 415000,
    stockCount: 21,
    lowStockThreshold: 10,
    status: "Active",
    imageUrl: "/marketplace/generated/infusion-pump.jpg",
    manufacturedIn: "Germany",
    shortDescription: "Precision volumetric infusion pump with drug library and free-flow protection.",
  },
  {
    name: "Binocular Compound Microscope",
    brand: "Zeiss",
    brandSku: "Primostar 3",
    categorySlug: "scientific-tools",
    categoryLabel: "Scientific Tools",
    price: 540000,
    stockCount: 16,
    lowStockThreshold: 6,
    status: "Active",
    imageUrl: "/marketplace/generated/microscope.jpg",
    manufacturedIn: "Germany",
    shortDescription: "Entry-level compound microscope for routine diagnostics and teaching labs.",
  },
  {
    name: "UV-Vis Spectrophotometer",
    brand: "Shimadzu",
    brandSku: "UV-1900i",
    categorySlug: "scientific-tools",
    categoryLabel: "Scientific Tools",
    price: 1850000,
    stockCount: 3,
    lowStockThreshold: 4,
    status: "Rejected",
    imageUrl: "/marketplace/generated/spectrophotometer.jpg",
    manufacturedIn: "Japan",
    shortDescription: "Double-beam UV-Vis spectrophotometer with 1nm bandwidth resolution.",
  },
  {
    name: "Nutrient Agar (500g)",
    brand: "MicroMedica Laboratories",
    brandSku: "NA-500",
    categorySlug: "reagents-culture-media",
    categoryLabel: "Reagents & Culture Media",
    price: 45250,
    promoPrice: 40250,
    stockCount: 60,
    lowStockThreshold: 20,
    status: "Active",
    imageUrl: null,
    manufacturedIn: "India",
    shortDescription: "General-purpose nutrient agar for cultivation of non-fastidious microorganisms.",
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function seedVendorProducts(vendorId: string): Product[] {
  return SEED_PRODUCTS.map((seed, index) => {
    const id = `vprod_${randomUUID()}`;
    return {
      id,
      slug: `${slugify(seed.name)}-${id.slice(-6)}`,
      name: seed.name,
      categorySlug: seed.categorySlug,
      categoryLabel: seed.categoryLabel,
      brand: seed.brand,
      brandSku: seed.brandSku,
      price: seed.price,
      promoPrice: seed.promoPrice,
      currency: "NGN",
      imageUrl: seed.imageUrl,
      shortDescription: seed.shortDescription,
      inStock: (seed.stockCount ?? 0) > 0,
      stockCount: seed.stockCount,
      manufacturedIn: seed.manufacturedIn,
      technicalSpecs: seed.technicalSpecs ?? [
        { label: "Brand", value: seed.brand ?? "" },
        { label: "Model", value: seed.brandSku ?? "" },
        { label: "Country of Origin", value: seed.manufacturedIn ?? "" },
      ],
      includedAccessories: seed.includedAccessories ?? ["Power cord/adapter", "User manual", "Calibration certificate"],
      clinicalUseCases:
        seed.clinicalUseCases ?? (seed.categorySlug === "medical-equipment" ? ["Hospital ward use", "Emergency/critical care"] : []),
      vendorId,
      status: seed.status,
      sku: `VIT-${(seed.brand ?? "GEN").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}${String(index + 1).padStart(4, "0")}`,
      lowStockThreshold: seed.lowStockThreshold,
      // createdAt/updatedAt aren't part of the shared Product shape (customer
      // views have no use for them) — dates only matter for the mock order
      // seed in vendor-orders-store.ts, which references these ids directly.
    } satisfies Product;
  });
}

const globalForVendorInventory = globalThis as unknown as { __vitalinkVendorInventory?: Map<string, Product[]> };
const inventoryByVendorId = globalForVendorInventory.__vitalinkVendorInventory ?? new Map<string, Product[]>();
globalForVendorInventory.__vitalinkVendorInventory = inventoryByVendorId;

export function getVendorInventory(vendorId: string): Product[] {
  let inventory = inventoryByVendorId.get(vendorId);
  if (!inventory) {
    inventory = seedVendorProducts(vendorId);
    inventoryByVendorId.set(vendorId, inventory);
  }
  return inventory;
}

export function getVendorProduct(vendorId: string, productId: string): Product | undefined {
  return getVendorInventory(vendorId).find((product) => product.id === productId);
}

/** Every product across every vendor whose inventory has actually been
 * touched this session (created a product, or just loaded their own
 * products page, which lazily seeds it) — used by the admin Global
 * Inventory queue (lib/api/mocks/admin-store.ts) so a vendor's real
 * submissions (including multi-image uploads) show up for admin review
 * instead of only the static demo catalog. Doesn't force-seed every vendor
 * that's never been touched — nothing to show for those anyway. */
export function getAllVendorProducts(): Product[] {
  return [...inventoryByVendorId.values()].flat();
}

export function addVendorProduct(vendorId: string, product: Product): Product {
  const inventory = getVendorInventory(vendorId);
  inventory.unshift(product);
  return product;
}

export function updateVendorProduct(vendorId: string, productId: string, patch: Partial<Product>): Product {
  const inventory = getVendorInventory(vendorId);
  const index = inventory.findIndex((product) => product.id === productId);
  if (index === -1) {
    throw new Error(`Vendor product ${productId} not found for vendor ${vendorId}`);
  }
  const updated = { ...inventory[index], ...patch };
  inventory[index] = updated;
  return updated;
}

export function removeVendorProduct(vendorId: string, productId: string): void {
  const inventory = getVendorInventory(vendorId);
  const index = inventory.findIndex((product) => product.id === productId);
  if (index !== -1) {
    inventory.splice(index, 1);
  }
}
