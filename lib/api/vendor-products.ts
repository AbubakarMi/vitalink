import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { ProductSchema, type Product, type VendorProductStatus } from "./products";
import {
  addVendorProduct,
  getVendorInventory,
  getVendorProduct,
  updateVendorProduct,
  removeVendorProduct,
} from "./mocks/vendor-inventory-store";

/**
 * Vendor-side inventory management adapter. No Product entity exists on the
 * real backend yet (frontend architecture doc §1/§10) — every function below
 * is mocked against lib/api/mocks/vendor-inventory-store.ts. Unlike
 * lib/api/products.ts there's no live branch to flip to yet, only a future
 * real implementation to replace this file with, same situation as
 * lib/api/orders.ts. Every function is scoped to the signed-in vendor's own
 * userId — never trust a caller-supplied vendorId.
 */

async function currentVendorId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

export async function listProductsForVendor(): Promise<Product[]> {
  const vendorId = await currentVendorId();
  return getVendorInventory(vendorId).map((product) => ProductSchema.parse(product));
}

export interface VendorProductStats {
  all: number;
  active: number;
  pendingReview: number;
  rejected: number;
}

export async function getVendorProductStats(): Promise<VendorProductStats> {
  const products = await listProductsForVendor();
  return {
    all: products.length,
    active: products.filter((p) => p.status === "Active").length,
    pendingReview: products.filter((p) => p.status === "PendingReview").length,
    rejected: products.filter((p) => p.status === "Rejected").length,
  };
}

export async function getVendorProductById(id: string): Promise<Product | null> {
  const vendorId = await currentVendorId();
  const product = getVendorProduct(vendorId, id);
  return product ? ProductSchema.parse(product) : null;
}

export interface CreateVendorProductDraftInput {
  categorySlug: string;
  categoryLabel: string;
  imageUrl: string | null;
  /** Full set of uploaded images, one flagged isPrimary — imageUrl above is
   * derived from whichever entry that is. Optional/empty for callers that
   * only ever collect a single image. */
  images?: { url: string; isPrimary: boolean }[];
  name: string;
  brand: string;
  brandSku?: string;
  manufacturedIn: string;
  price: number;
  promoPrice?: number;
  stockCount: number;
  lowStockThreshold: number;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Steps 1-2 of the wizard — creates the draft record; generated content
 * (step 3) and publish (step 4) are separate calls so the draft survives a
 * page refresh mid-wizard. */
export async function createVendorProductDraft(input: CreateVendorProductDraftInput): Promise<Product> {
  const vendorId = await currentVendorId();
  const id = `vprod_${randomUUID()}`;
  const primaryImage = input.images?.find((img) => img.isPrimary) ?? input.images?.[0];
  const product: Product = {
    id,
    slug: `${slugify(input.name)}-${id.slice(-6)}`,
    name: input.name,
    categorySlug: input.categorySlug,
    categoryLabel: input.categoryLabel,
    brand: input.brand,
    brandSku: input.brandSku,
    price: input.price,
    promoPrice: input.promoPrice,
    currency: "NGN",
    imageUrl: primaryImage?.url ?? input.imageUrl,
    images: input.images,
    shortDescription: "",
    inStock: input.stockCount > 0,
    stockCount: input.stockCount,
    manufacturedIn: input.manufacturedIn,
    vendorId,
    status: "PendingReview",
    sku: `VIT-${input.brand.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "GEN"}${String(getVendorInventory(vendorId).length + 1).padStart(4, "0")}`,
    lowStockThreshold: input.lowStockThreshold,
  };
  addVendorProduct(vendorId, product);
  return ProductSchema.parse(product);
}

export interface UpdateVendorProductInput {
  categorySlug: string;
  categoryLabel: string;
  name: string;
  brand: string;
  brandSku?: string;
  manufacturedIn: string;
  price: number;
  promoPrice?: number;
  stockCount: number;
  lowStockThreshold: number;
  images?: { url: string; isPrimary: boolean }[];
}

/** Edit-product form's save — distinct from createVendorProductDraft (which
 * mints a new id/sku) since this patches an existing listing's own record in
 * place. Doesn't touch status: editing a live listing doesn't re-queue it for
 * review, only a fresh submit-for-review (publishVendorProduct) does that. */
export async function updateVendorProductDraft(id: string, input: UpdateVendorProductInput): Promise<Product> {
  const vendorId = await currentVendorId();
  const existing = getVendorProduct(vendorId, id);
  if (!existing) {
    throw new ApiError(404, "Product not found.");
  }
  const primaryImage = input.images?.find((img) => img.isPrimary) ?? input.images?.[0];
  const updated = updateVendorProduct(vendorId, id, {
    categorySlug: input.categorySlug,
    categoryLabel: input.categoryLabel,
    name: input.name,
    brand: input.brand,
    brandSku: input.brandSku,
    manufacturedIn: input.manufacturedIn,
    price: input.price,
    promoPrice: input.promoPrice,
    stockCount: input.stockCount,
    inStock: input.stockCount > 0,
    lowStockThreshold: input.lowStockThreshold,
    imageUrl: primaryImage?.url ?? existing.imageUrl,
    images: input.images ?? existing.images,
  });
  return ProductSchema.parse(updated);
}

export interface GeneratedProductDetails {
  shortDescription: string;
  technicalSpecs: { label: string; value: string }[];
  includedAccessories: string[];
  clinicalUseCases: string[];
  usageTutorial: { title: string; body: string }[];
}

const REAGENT_CATEGORIES = new Set(["reagents-culture-media"]);

/**
 * Deterministic templated content generator standing in for a real AI call
 * (design doc §2 — round-1 scope decision). Same input always produces the
 * same output; "Regenerate" re-runs this with a different template variant
 * index so the vendor sees visibly different (but still deterministic per
 * click count) copy, matching the mockup's "Regenerate Details" affordance
 * without pretending to call a model.
 */
export async function generateProductDetails(
  input: { name: string; brand: string; categorySlug: string; manufacturedIn: string },
  variant = 0,
): Promise<GeneratedProductDetails> {
  const isReagent = REAGENT_CATEGORIES.has(input.categorySlug);

  const openers = [
    `The ${input.name} is a ${isReagent ? "laboratory-grade reagent" : "precision instrument"} from ${input.brand}, manufactured in ${input.manufacturedIn} to meet the demands of high-acuity clinical and laboratory environments.`,
    `Engineered by ${input.brand} and sourced from ${input.manufacturedIn}, the ${input.name} is built for professionals who need consistent, dependable performance ${isReagent ? "in every batch" : "shift after shift"}.`,
  ];

  const technicalSpecs = isReagent
    ? [
        { label: "Brand", value: input.brand },
        { label: "Country of Origin", value: input.manufacturedIn },
        { label: "Storage Conditions", value: "Store between 2°C and 25°C, away from direct sunlight" },
        { label: "Shelf Life", value: "24 months from date of manufacture, unopened" },
      ]
    : [
        { label: "Brand", value: input.brand },
        { label: "Country of Origin", value: input.manufacturedIn },
        { label: "Power Supply", value: "AC 100-240V, 50/60Hz" },
        { label: "Operating Conditions", value: "10°C to 40°C, up to 80% relative humidity" },
      ];

  const includedAccessories = isReagent
    ? ["Certificate of Analysis", "Safety Data Sheet", "Batch documentation"]
    : ["Power cord/adapter", "User manual", "Calibration certificate"];

  const clinicalUseCases = isReagent
    ? []
    : ["Hospital ward use", "Emergency/critical care", "Outpatient and clinic procedures"];

  const usageTutorial = isReagent
    ? [
        { title: "Inspect Before Use", body: "Check the batch label and expiry date before opening. Discard if the seal is broken or contents appear discolored." },
        { title: "Prepare in a Controlled Environment", body: "Handle under aseptic conditions away from direct airflow. Use appropriate PPE as indicated on the safety data sheet." },
      ]
    : [
        { title: "Unpack and Inspect", body: `Remove the ${input.name} from its packaging and check for shipping damage before first use.` },
        { title: "Power On and Calibrate", body: "Connect to a grounded power outlet, power on, and run the built-in self-check before first clinical use." },
      ];

  return {
    shortDescription: openers[variant % openers.length],
    technicalSpecs,
    includedAccessories,
    clinicalUseCases,
    usageTutorial,
  };
}

function requireDraftReady(product: Product): void {
  if (!product.shortDescription || !product.technicalSpecs?.length) {
    throw new ApiError(422, "Generate product details before publishing.");
  }
}

export async function saveGeneratedDetails(id: string, content: GeneratedProductDetails): Promise<Product> {
  const vendorId = await currentVendorId();
  const updated = updateVendorProduct(vendorId, id, content);
  return ProductSchema.parse(updated);
}

/**
 * "Publish" submits for admin review — it does NOT go live immediately.
 * Every product goes under review, the same rule admin moderation was built
 * around (super admin PDFs) and that createVendorProductDraft() already
 * follows (new drafts start PendingReview); this used to jump straight to
 * Active/OutOfStock instead, skipping review entirely, which also meant a
 * fixed-and-republished Rejected product never got a second look. Approving
 * it (lib/api/admin/products.ts's approveAdminProduct) is what actually
 * flips it to Active/OutOfStock.
 */
export async function publishVendorProduct(id: string): Promise<Product> {
  const vendorId = await currentVendorId();
  const product = getVendorProduct(vendorId, id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }
  requireDraftReady(product);
  const updated = updateVendorProduct(vendorId, id, {
    status: "PendingReview",
    rejectionReason: null,
  });
  return ProductSchema.parse(updated);
}

export async function updateVendorProductStatus(id: string, status: VendorProductStatus): Promise<Product> {
  const vendorId = await currentVendorId();
  const updated = updateVendorProduct(vendorId, id, { status });
  return ProductSchema.parse(updated);
}

/** Un-archiving restores whichever live status fits the current stock level
 * (same rule restockVendorProduct uses for the reverse case), rather than
 * always forcing "Active" — an empty-stock product should land back in
 * OutOfStock, not silently claim to be sellable again. */
export async function unarchiveVendorProduct(id: string): Promise<Product> {
  const vendorId = await currentVendorId();
  const product = getVendorProduct(vendorId, id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }
  const updated = updateVendorProduct(vendorId, id, {
    status: (product.stockCount ?? 0) > 0 ? "Active" : "OutOfStock",
  });
  return ProductSchema.parse(updated);
}

export async function deleteVendorProduct(id: string): Promise<void> {
  const vendorId = await currentVendorId();
  removeVendorProduct(vendorId, id);
}

/** Re-runs the deterministic generator against the product's own saved
 * fields — used by the product detail page's "Regenerate" action, which
 * (unlike the wizard) has no client-side variant counter to increment, so it
 * alternates on the current second instead. Still fully deterministic per
 * call, just not per a fixed input like the wizard's variant prop. */
export async function regenerateProductDetails(id: string): Promise<Product> {
  const vendorId = await currentVendorId();
  const product = getVendorProduct(vendorId, id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }
  const variant = Math.floor(Date.now() / 1000) % 2;
  const details = await generateProductDetails(
    { name: product.name, brand: product.brand ?? "", categorySlug: product.categorySlug, manufacturedIn: product.manufacturedIn ?? "" },
    variant,
  );
  const updated = updateVendorProduct(vendorId, id, details);
  return ProductSchema.parse(updated);
}

export async function restockVendorProduct(id: string, addedUnits: number): Promise<Product> {
  const vendorId = await currentVendorId();
  const product = getVendorProduct(vendorId, id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }
  const stockCount = (product.stockCount ?? 0) + addedUnits;
  const updated = updateVendorProduct(vendorId, id, {
    stockCount,
    inStock: stockCount > 0,
    status: product.status === "OutOfStock" && stockCount > 0 ? "Active" : product.status,
  });
  return ProductSchema.parse(updated);
}
