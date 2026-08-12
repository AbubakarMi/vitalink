# Vendor Dashboard, Round 1 (Overview / Inventory / New Product / Product Detail) — Design

Date: 2026-08-12
Status: Approved by user, pending implementation plan

## 1. Purpose and scope

Vendor register and login (the 4-step onboarding wizard — Identity & MFA, Business
Profile, Compliance & Verification, Payout Logistics) already exist, are fully
implemented, and are out of scope here.

Everything a vendor sees *after* logging in is currently a one-line placeholder in
`app/vendor/*` ("no API yet"). The user supplied nine rough mockup exports
(`C:\Users\lenovo\Documents\Vitalink\vendor\`) covering Overview, Global Inventory, a
4-step New Product wizard, product detail views, and Orders, with explicit instruction
that these are light reference, not pixel specs, to be elevated the same way the
onboarding wizard already elevated its own Figma mockup rather than reproduced
literally.

This round covers: **Overview, Global Inventory, New Product wizard, Product detail**,
plus the vendor dashboard shell (sidebar nav + header) all four share, since none of it
exists yet. **Orders** is a deferred second round. **Transactions, Analytics, Settings**
have nav entries but no supplied mockup for any of them — left as simple placeholder
routes until designs exist, same as the current stub pattern.

### Mockup inconsistencies observed (informing decisions below)

- Role badge reads "Seller" in some exports, "Vendor" in others — this app uses
  "Vendor" everywhere else (`AccountType.Vendor`, `/vendor` routes); standardizing on
  "Vendor".
- Sidebar nav labels flip between singular/plural ("Order"/"Orders",
  "Transaction"/"Transactions") and "Inventory"/"Global Inventory" across exports.
  Standardizing on "Orders", "Transactions", "Global Inventory".
- Two near-duplicate order-list exports (`Vendor Oder.pdf` "Order History" vs.
  `Vendor Order Page.pdf` "Order Fulfilment") with slightly different columns — moot for
  this round since Orders is deferred, but noted for round 2.
- Two incompatible "view a product" treatments (a compact AI-review card vs. a full
  public-page-with-reviews layout) — resolved in §5 below as one component with two
  states rather than building both.
- Stats tables show fabricated large numbers ("22,500 results", "1,465 products").
  Per the existing architecture doc's no-fabrication principle, real pagination/counts
  over the actual mock dataset size are used instead.

## 2. Architecture

**Vendor dashboard shell.** `app/vendor/layout.tsx` currently renders bare
`{children}` — no persistent nav exists. Add `components/vendor/dashboard-shell.tsx`
(role-scoped, per the "components never cross role boundaries" rule) providing:

- Sidebar: Overview, Global Inventory, Orders, Transactions, Analytics, Settings.
  The last three route to real pages that render a plain "coming soon" placeholder —
  no design exists for their content yet.
- Header: notification bell, wallet-balance pill, avatar + name + "Vendor" badge.

This shell wraps every page under `app/vendor/` going forward.

**Data layer.** Follows the existing mock/live seam pattern
(`lib/api/products.ts`'s `PRODUCTS_DATA_SOURCE`, `lib/api/mocks/vendor-profile-store.ts`'s
in-memory store):

- Extend `ProductSchema` (`lib/api/products.ts`) with vendor-management fields:
  `vendorId: string`, `status: z.enum(["Active", "PendingReview", "OutOfStock", "Archived", "Rejected"])`,
  `promoPrice: z.number().optional()`, `lowStockThreshold: z.number().optional()`,
  `sku: z.string().optional()`. A vendor's inventory *is* the marketplace catalog,
  scoped to their `vendorId` with extra management fields the buyer-facing views
  ignore — one shared schema, role-scoped views, not a forked data model.
- New `lib/api/mocks/vendor-inventory-store.ts` — mutable, `globalThis`-pinned like
  `vendor-profile-store.ts`, keyed by vendor `userId`.
- New `lib/api/vendor-products.ts`: `listProductsForVendor(userId)`,
  `getVendorProductById(userId, id)`, `createVendorProductDraft(userId, input)` (wizard
  steps 1-2), `generateProductDetails(input)` (the mocked "AI" step — a deterministic
  templated generator keyed off category/name, not a real model call, per the
  earlier scope decision), `publishVendorProduct(userId, id)`,
  `updateVendorProductStatus(userId, id, status)`.
- Overview's Total Sales / Wallet Balance stay explicitly mocked placeholder figures,
  same honesty convention `vendor/dashboard/page.tsx` already uses ("Sales figures
  pending — no Order API yet").

**Routes** (`app/vendor/`): `dashboard/page.tsx` (rebuilt), `products/page.tsx`
(Global Inventory), `products/new/page.tsx` (wizard), `products/[id]/page.tsx`
(detail, new route — distinct from the existing `products/[id]/edit/page.tsx`).

## 3. Overview (`/vendor/dashboard`)

- Header: business name + verification badge (real, from `getVendorProfile()`).
- Stat row: Total Sales, Wallet Balance, Live Products (real count from
  `listProductsForVendor`), Low Stock Alerts (real, derived from `lowStockThreshold`).
  Styled with the onboarding shell's mono-label/serif-value treatment, not the
  mockup's plain sans-serif numbers.
- "Fulfill Orders" banner — kept as a useful nudge, restyled as an ink-colored callout
  card. Links to `/vendor/orders` (placeholder in this round).
- Recent Orders table (last 5-7) — reuses the same table primitive Global Inventory
  uses, backed by mocked order data, so all vendor tables read as one system.
- "Add New Product" quick action links to the wizard. The mockup's "Create roles"
  button is dropped — no vendor role/permission system exists and is out of scope.

## 4. Global Inventory (`/vendor/products`)

- Stat cards: All / Active / Pending Review / Rejected counts, computed from real mock
  data (not fabricated totals).
- Search bar + status filter + paginated table, "Showing X of Y" reflecting the actual
  mock dataset size.
- Table row: image, name + SKU, price (with strikethrough original + promo price when
  set), brand, category, color-coded status pill (verified-green Active,
  warning-amber Pending Review, danger-red Rejected/Out of stock, muted-gray Archived),
  row actions (View / Edit / Archive).
- Empty state for a freshly-onboarded vendor with zero products — none of the mockups
  show this, but it's the first real state a new vendor hits. Centered prompt pointing
  at "Add New Product."

## 5. New Product wizard (`/vendor/products/new`)

Reuses `OnboardingShell`'s step-indicator pattern (numbered/checked circles, sticky
sidebar) so the app has one consistent wizard visual language, not two competing ones.

- **Step 1 — Categorization**: category tiles (Medical/Scientific Equipment,
  Scientific Instruments, Reagents, Culture Media & Kits) + product image upload.
  Close to the mockup as-is.
- **Step 2 — Identification**: Product Name, Manufacturer, Model, Country of Origin,
  **plus Price, Promo Price, Stock, and Low-Stock Threshold**. The mockup's step 2
  subtitle promises "pricing, stock units, and reorder alert levels" but its fields
  only cover name/manufacturer/model/origin — those pricing/stock fields have to live
  somewhere, and folding them into step 2 (rather than inventing an ungrounded new
  step) closes the gap the mockup itself left open.
- **Step 3 — Tech Specifications ("Generate details")**: vendor clicks generate;
  `generateProductDetails` deterministically produces a description, technical specs
  table, included accessories, and a numbered usage tutorial from the step-2 inputs.
  Rendered as **editable** text — the mockup's "Regenerate Details" implies correction
  but never designs an actual edit path, so this adds one.
- **Step 4 — Verification**: the "Verify and Generate Tutorial" review screen —
  product card + generated content side-by-side, Publish to Marketplace / Regenerate /
  Save Draft actions.

## 6. Product detail (`/vendor/products/[id]`)

The mockups show two incompatible "view a product" treatments (a compact
draft-review card vs. a full public-style page with spec tabs and reviews). Built as
**one page component branching on `product.status`** rather than two separate designs:

- **Draft state** (`PendingReview`/unpublished): compact card — image, price/promo/
  stock, generated overview, Edit / Regenerate / Delete, Publish action.
- **Published state** (`Active`/`OutOfStock`/`Archived`): adds the tabbed Technical
  Specs / Included Accessories / Clinical Use Cases panel and a read-only Reviews
  section, sourced from the existing `lib/api/reviews.ts` — real reviews if any exist,
  otherwise "No reviews yet" (not the mockup's Lorem-ipsum placeholder content).
  Actions: Edit Product / Restock / Archive.

## 7. Error handling

- Wizard step submissions show inline errors the same way the onboarding wizard does
  (`role="alert"` banner above the submit button) — no new error-handling pattern.
- `generateProductDetails` failure (mock can simulate this) leaves step 3 on a retry
  state rather than silently advancing with empty content.
- Publishing a product with an incomplete draft (missing generated content) is
  disabled, not silently allowed then failing server-side.

## 8. Testing

- Data-layer unit coverage for `lib/api/vendor-products.ts`: listing scoped to the
  correct `vendorId`, status transitions, low-stock computation.
- Manual verification of the full wizard → publish → appears in Inventory → appears
  in Overview stats loop, since that end-to-end path is the actual point of this round.
