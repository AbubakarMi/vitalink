import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "./client";
import { pagedResult } from "./schemas/pagination";

/**
 * The REAL customer-facing catalog — Product + Offer, not this app's older
 * flat `Product` type (lib/api/products.ts, which stays mock-only and is
 * what every other customer/vendor/admin mock surface still reads). Gated by
 * the same `PRODUCTS_DATA_SOURCE` flag; when it's "live", the marketplace
 * listing/detail pages call this module and render the Buy Box UI instead
 * of the mock catalog's components — see app/(marketplace)/products/page.tsx
 * and .../[slug]/page.tsx for the branch point. Every shape below is
 * confirmed directly against the backend's real response records
 * (MarketplaceProductCard, MarketplaceProductDetailsEnvelope, etc.), not
 * guessed — see docs/BACKEND_INTEGRATION_GUIDE.md §0b/§2.5.
 */

const SOURCE = process.env.PRODUCTS_DATA_SOURCE ?? "mock";
export const MARKETPLACE_LIVE = SOURCE === "live";

const BASE = "/marketplace/products";

// ---- List (catalog grid) ----

const MarketplaceProductCardSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  modelNumber: z.string().nullable().optional(),
  primaryImageUrl: z.string().nullable().optional(),
  brandName: z.string(),
  categoryName: z.string(),
  startingPrice: z.number(),
  currency: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  offerCount: z.number(),
  cheapestOfferCondition: z.string().nullable().optional(),
  brandIsVerified: z.boolean(),
});
export type MarketplaceProductCard = z.infer<typeof MarketplaceProductCardSchema>;

const PagedMarketplaceProductsSchema = pagedResult(MarketplaceProductCardSchema);

/** Real backend sort vocabulary — different words than this app's mock
 * SortOption (lib/api/product-sort.ts): relevance/price_asc/price_desc/
 * rating/newest/name, not featured/price-low/price-high/newest. */
export const MARKETPLACE_SORT_OPTIONS = ["relevance", "price_asc", "price_desc", "rating", "newest", "name"] as const;
export type MarketplaceSort = (typeof MARKETPLACE_SORT_OPTIONS)[number];

export interface ListMarketplaceProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Real category/brand filters are GUIDs, not slugs — resolve via
   * listMarketplaceCategories()/listMarketplaceBrands() first. */
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sort?: MarketplaceSort;
}

export async function listMarketplaceProducts(params: ListMarketplaceProductsParams = {}) {
  const { data } = await apiClient.get<unknown>(BASE, {
    params: {
      PageNumber: params.page ?? 1,
      PageSize: params.pageSize ?? 12,
      Sort: params.sort ?? "relevance",
      ...(params.search ? { Term: params.search } : {}),
      ...(params.categoryId ? { CategoryId: params.categoryId } : {}),
      ...(params.brandId ? { BrandId: params.brandId } : {}),
      ...(params.minPrice !== undefined ? { MinPrice: params.minPrice } : {}),
      ...(params.maxPrice !== undefined ? { MaxPrice: params.maxPrice } : {}),
      ...(params.condition ? { Condition: params.condition } : {}),
    },
  });
  return PagedMarketplaceProductsSchema.parse(data);
}

// ---- Filters ----

const MarketplaceCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  code: z.string(),
  parentId: z.string().nullable().optional(),
  productCount: z.number(),
});
export type MarketplaceCategory = z.infer<typeof MarketplaceCategorySchema>;

export async function listMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const { data } = await apiClient.get<unknown>("/marketplace/categories");
  return z.array(MarketplaceCategorySchema).parse(data);
}

const MarketplaceBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isVerified: z.boolean(),
  productCount: z.number(),
});
export type MarketplaceBrand = z.infer<typeof MarketplaceBrandSchema>;

export async function listMarketplaceBrands(): Promise<MarketplaceBrand[]> {
  const { data } = await apiClient.get<unknown>("/marketplace/brands");
  return z.array(MarketplaceBrandSchema).parse(data);
}

// ---- Detail (one product, every vendor's offer on it) ----

const MarketplaceRatingSummarySchema = z.object({ average: z.number(), reviewCount: z.number() });

const MarketplaceReviewPreviewSchema = z.object({
  reviewerName: z.string(),
  rating: z.number(),
  comment: z.string().nullable().optional(),
  createdAt: z.string(),
});

const MarketplaceVolumeTierSchema = z.object({
  volumeTierId: z.string(),
  minQuantity: z.number(),
  price: z.number(),
});

const MarketplaceDiscountSchema = z.object({
  discountId: z.string(),
  type: z.string(),
  value: z.number(),
  startsAt: z.string(),
  endsAt: z.string().nullable().optional(),
  promoCode: z.string().nullable().optional(),
  maxRedemptions: z.number().nullable().optional(),
});

const MarketplaceCertificationSchema = z.object({
  certificationId: z.string(),
  name: z.string(),
  referenceId: z.string().nullable().optional(),
  classification: z.string().nullable().optional(),
  documentFileName: z.string(),
  expiresAt: z.string().nullable().optional(),
});

/** No vendor name/identity on an offer — the real response genuinely
 * doesn't expose one (confirmed against MarketplaceOfferDetails), not an
 * omission on this schema's part. See the "Buy Box" design decision this
 * shape drove: offers are picked by price/condition/stock, not by vendor. */
const MarketplaceOfferDetailsSchema = z.object({
  offerId: z.string(),
  sku: z.string(),
  price: z.number(),
  compareAtPrice: z.number().nullable().optional(),
  currency: z.string(),
  condition: z.string(),
  availability: z.string(),
  stockQuantity: z.number(),
  availableQuantity: z.number(),
  trackInventory: z.boolean(),
  manufactureDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  lotNumber: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  ratingSummary: MarketplaceRatingSummarySchema,
  reviews: z.array(MarketplaceReviewPreviewSchema),
  volumeTiers: z.array(MarketplaceVolumeTierSchema),
  activeDiscounts: z.array(MarketplaceDiscountSchema),
  certifications: z.array(MarketplaceCertificationSchema),
});
export type MarketplaceOfferDetails = z.infer<typeof MarketplaceOfferDetailsSchema>;

const MarketplaceProductDetailsSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  modelNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  specifications: z.record(z.string(), z.unknown()).nullable().optional(),
  countryOfOrigin: z.string().nullable().optional(),
  primaryImageUrl: z.string().nullable().optional(),
  additionalImageUrls: z.array(z.string()),
  brand: z.object({ brandId: z.string(), name: z.string(), slug: z.string(), logoUrl: z.string().nullable().optional(), isVerified: z.boolean() }),
  category: z.object({ categoryId: z.string(), name: z.string(), slug: z.string(), code: z.string() }),
  viewCount: z.number(),
  ratingSummary: MarketplaceRatingSummarySchema,
  certifications: z.array(MarketplaceCertificationSchema),
  offers: z.array(MarketplaceOfferDetailsSchema),
});
export type MarketplaceProductDetails = z.infer<typeof MarketplaceProductDetailsSchema>;

const MarketplaceProductDetailsEnvelopeSchema = z.object({
  product: MarketplaceProductDetailsSchema,
  isRedirect: z.boolean(),
  canonicalProductId: z.string(),
  canonicalSlug: z.string(),
  canonicalUrl: z.string().nullable().optional(),
});
export type MarketplaceProductDetailsEnvelope = z.infer<typeof MarketplaceProductDetailsEnvelopeSchema>;

export async function getMarketplaceProductBySlug(slug: string): Promise<MarketplaceProductDetailsEnvelope | null> {
  try {
    const { data } = await apiClient.get<unknown>(`${BASE}/slug/${encodeURIComponent(slug)}`);
    return MarketplaceProductDetailsEnvelopeSchema.parse(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
