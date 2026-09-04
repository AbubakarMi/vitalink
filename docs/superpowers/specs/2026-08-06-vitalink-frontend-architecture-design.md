# Vitalink Frontend Architecture — Design

Date: 2026-08-06
Status: Approved by user, pending implementation plan

## 1. Purpose and scope

Vitalink is a healthcare marketplace (customer / vendor / admin roles) built on Next.js 16
against a .NET 10 backend (`vitalink-backend`, Zitadel-backed auth). This document
specifies the frontend architecture: role separation, the auth/network boundary, the
data layer, design tokens, and one end-to-end vertical slice used to validate the
pattern before the rest of the app is scaffolded.

This is a **clean rebuild**, and this spec covers the frontend only. It does not cover
the AI Health Assistant (PRD Phase 1 feature) — explicitly deferred, see §8.

### Backend reality check (as of 2026-08-06, `vitalink-backend@main`)

The backend is under active development. What exists today:

- **Real:** full auth (register/login/MFA via TOTP or OTP-email/social login/refresh/logout),
  vendor onboarding (profile, KYC document upload, settlement accounts), admin vendor
  approval workflow, staff/role/permission administration, audit logs, brand and
  product-category taxonomy.
- **Does not exist yet:** `Product` entity, `Cart`, `Order`, `Payment`, `Dispute`,
  `Analytics`, any AI/RAG code, any public stats endpoint.
- **Correction (checked 2026-08-06, after the design below was first drafted):** brand
  and product-category endpoints (`GetBrands`, `GetProductCategories`, etc.) are real,
  but every one of them carries `.RequirePermission(...)` with `isAdmin: true` and
  `isCustomer: false`/`isVendor: false` in `PermissionRegistry` — there is currently
  **no public or Customer-accessible path to any catalog taxonomy data at all**, not
  even read-only. Earlier drafts of this doc assumed "featured categories" could be
  real data on the public landing page; that assumption was wrong and is corrected
  throughout §2.1, §8, and §9 below. See §10 for the required backend addition.

The architecture below is built to be honest about this split rather than pretend a
complete backend exists. Every data-consuming route is explicitly marked **real** or
**mocked** in §3, using a seam designed so flipping a resource from mocked to real is a
one-file change with zero UI-layer impact.

## 2. Role architecture

### 2.1 Route groups — and one structural fix

**Correction (caught during implementation, before any route files were written):**
Parenthesized route groups (`(customer)`, `(vendor)`, `(admin)`) do **not** add a URL
segment — that's their whole purpose for `(marketing)`/`(auth)`, which both want their
children at the bare root with no shared prefix. But applied literally to
customer/vendor/admin as originally sketched, `(customer)/dashboard/page.tsx`,
`(vendor)/dashboard/page.tsx`, and `(admin)/dashboard/page.tsx` would all resolve to
the identical URL `/dashboard` — Next.js fails the build on that collision, and the
same collision hits `/orders`. The fix: customer/vendor/admin get **real path segments**
(`customer/`, `vendor/`, `admin/`), not route groups — the plain folder already does
everything a parenthesized group would (a `layout.tsx` scoped to everything under it)
plus it gives each role a distinct URL prefix, which is exactly what's needed here. It
also simplifies `proxy.ts` (§3): matching becomes a plain `/customer`, `/vendor`, `/admin`
path-prefix check instead of trying to reverse-engineer which invisible route group a
URL belongs to.

```
app/
  (marketing)/              # route group, public, no auth — no shared prefix wanted
    page.tsx                 # landing — MOCKED featured categories AND trending products (catalog taxonomy is admin-only, see §1 correction)
    products/page.tsx        # public catalog browse — MOCKED categories, MOCKED products
    products/[slug]/page.tsx # public product detail — MOCKED product, JSON-LD
    layout.tsx
  (auth)/                    # route group, no shared prefix wanted
    login/page.tsx           # REAL — branches on LoginResponse.MfaRequired
    register/page.tsx        # REAL
    vendor-apply/page.tsx    # REAL — maps to actual VendorProfile/Document/SettlementAccount flow
    layout.tsx
  customer/                     # real segment — requires AccountType === "Customer"
    dashboard/page.tsx       # /customer/dashboard — REAL identity (GetCurrentUser), MOCKED order-history widget
    catalog/page.tsx         # /customer/catalog — MOCKED categories, MOCKED products (Customer accounts have no grant on ProductCategories.List/Brands.List either — admin-only, see §1 correction)
    cart/page.tsx            # /customer/cart — MOCKED, no Cart API
    checkout/page.tsx        # /customer/checkout — MOCKED, no Order/Payment API
    orders/page.tsx          # /customer/orders — MOCKED
    orders/[id]/page.tsx     # /customer/orders/[id] — MOCKED
    layout.tsx
  vendor/                    # real segment — requires AccountType === "Vendor" AND VendorVerificationStatus === "Verified"
    dashboard/page.tsx       # /vendor/dashboard — REAL vendor profile/status, MOCKED sales/payout figures
    products/page.tsx        # /vendor/products — MOCKED, no Product API
    products/new/page.tsx    # /vendor/products/new — MOCKED
    products/[id]/edit/page.tsx # /vendor/products/[id]/edit — MOCKED
    orders/page.tsx          # /vendor/orders — MOCKED
    payouts/page.tsx         # /vendor/payouts — REAL, SettlementAccount endpoints exist
    layout.tsx                 # shows status holding page (Pending/UnderReview/Rejected) instead of dashboard until Verified
  admin/                     # real segment — requires AccountType === "Staff"; pages further permission-gated (§5)
    dashboard/page.tsx       # /admin/dashboard — MOCKED aggregate stats
    vendors/page.tsx         # /admin/vendors — REAL, GetVendors/Approve/Reject/UnderReview
    vendors/[id]/page.tsx    # /admin/vendors/[id] — REAL
    users/page.tsx           # /admin/users — REAL, Staff/Roles endpoints
    orders/page.tsx          # /admin/orders — MOCKED
    disputes/page.tsx        # /admin/disputes — MOCKED, no backend concept of disputes yet
    analytics/page.tsx       # /admin/analytics — MOCKED
    layout.tsx
  api/
    auth/session/route.ts    # thin route for client-triggered session refresh, if needed
```

`components/ui/` holds shared primitives (shadcn-based, customized). `components/{marketing,customer,vendor,admin}/`
hold role-scoped composed components. **A component in one role's folder is never
imported by another role's route** — even when it looks reusable — because that's
exactly how healthcare marketplaces leak data across roles (e.g. a vendor payout
component quietly rendering in a customer context because someone reused it).

### 2.2 Defense in depth

**Correction from Next.js 16's own guidance** (`node_modules/next/dist/docs/.../guides/authentication.md`,
checked while implementing): layouts are *not* a reliable authoritative check. Due to
partial rendering, a layout does not re-run on every client-side navigation within it,
so a role check placed only in `layout.tsx` can be skipped on some navigations. The
authoritative check has to live in a memoized Data Access Layer (DAL) function, called
per-page and per-Server-Action, not assumed-safe at the layout level. Three layers,
not two:

1. **`proxy.ts`** — fast, optimistic, cookie-only (no network/DB calls), redirects
   obviously-wrong requests before any route code runs. Per Next's own docs: "Proxy
   should not be your only line of defense."
2. **`lib/auth/dal.ts`**, `verifySession()`/`requireSession()`** — authoritative,
   `verifySession()` wrapped in React's `cache()`, called at the top of every
   protected **page** component (not just the layout) and every Server Action that
   touches protected data. When the access token is missing/expired but a refresh
   token cookie exists, `requireSession()` redirects to `GET /api/auth/refresh`
   rather than refreshing inline — Server Components cannot call `cookies().set()`
   during render, so the actual token rotation has to happen in a Route Handler,
   which can. This is what resolves the case `proxy.ts` deferred (§3 step 3).
3. **Layouts** still fetch identity data for shared shell UI (nav, avatar) but are not
   trusted as the security boundary — the DAL call in the page/action underneath is.

### 2.3 `AccountType` ↔ path-prefix naming

The backend's `AccountType` enum is `Customer | Vendor | Staff`; the real path
prefixes from §2.1 are named `/customer`, `/vendor`, `/admin` for UX/product language.
These do **not** name-match. The mapping lives in exactly one place,
`lib/auth/route-groups.ts`:

```ts
export const PATH_PREFIX_ACCOUNT_TYPE = {
  customer: "Customer",
  vendor: "Vendor",
  admin: "Staff",
} as const;
```

Both `proxy.ts` and any other code that needs this mapping import from here — it is
never re-derived or string-compared ad hoc.

## 3. `proxy.ts` — network boundary

Runs on the Node.js runtime (Next 16 `proxy.ts` is not edge-locked like the old
`middleware.ts`, and defaults to Node.js — confirmed in the bundled docs), matcher
scoped to the real `/customer`, `/vendor`, `/admin` path prefixes from §2.1 —
`(marketing)`/`(auth)` routes always pass through unauthenticated. Matching on real
path prefixes rather than (invisible-in-the-URL) route groups is what makes this
mapping unambiguous at request time.

**Cookie topology — corrected during implementation, simpler than first drafted.**
The backend's `__Host-access_token` cookie requires no `Domain` attribute (strict
same-origin), which earlier revisions of this doc took to mean the infra layer must
reverse-proxy `app.vitalink.com/api/*` to the .NET backend. That's unnecessary: the
browser never talks to the .NET backend directly in this architecture at all — every
call happens server-to-server (Server Actions, Server Components, Route Handlers)
against an absolute `BACKEND_ORIGIN` URL (`lib/api/client.ts`). The endpoints that
mint or rotate the session (login, register, refresh, logout) read the `Set-Cookie`
header off the .NET response themselves and manually re-set the identical cookie
(name, `__Host-` prefix, flags) on *this app's own* outgoing response via
`cookies().set()` — see `lib/api/auth.ts`. From the browser's perspective the cookie
was always set by `app.vitalink.com`, regardless of what origin the .NET backend
actually runs on. No infra-level reverse proxy or shared origin is required; the two
services can be deployed independently.

Algorithm:

1. Read `__Host-access_token`. Missing → redirect to `/login?redirect=<path>`, no verify needed.
2. Present → verify with `jose` (`jwtVerify`, HS256, shared `AUTH_JWT_SIGNING_KEY` env var,
   issuer/audience pinned to the backend's configured values). Valid → read
   `AccountType`/`Roles` claims, apply the route-group map from §2.3.
3. Verify fails **only because the token is expired**, and `__Host-refresh_token` is
   present → let the request through optimistically. `proxy.ts` does not attempt the
   refresh itself (the refresh token is opaque/server-cache-backed, not locally
   verifiable) — the page-level DAL call (§2.2) resolves this, triggering the fetch
   wrapper's 401→refresh→retry cycle (§4).
4. Verify fails for any other reason (bad signature, no refresh cookie) → redirect to
   login, clear cookies.
5. Authenticated but wrong role for the matched group → redirect to that account's own
   dashboard, not to login.

`lib/auth/session.ts` holds the one `jose`-verify implementation, imported by both
`proxy.ts` and `lib/auth/dal.ts` — never duplicated. Per Next's own guidance, Proxy
matchers only cover routes they match; a matcher change or a Server Action that moves
to an uncovered path silently loses Proxy coverage, which is exactly why the DAL check
(§2.2) — not the matcher — is the actual security boundary.

`VendorVerificationStatus` is not in the JWT claims, so the `(vendor)` "must be
Verified" check happens only in the layout (§2.1), not in `proxy.ts`. Adding it to the
JWT is a nice-to-have future optimization (§8), not a blocker.

## 4. Data layer

`lib/api/client.ts` — one typed fetch wrapper, server-only, calling `BACKEND_ORIGIN`
directly with an absolute URL (§3 cookie-topology correction — no same-origin
rewrite needed). It forwards the current request's cookies manually (Next's
server-side `fetch` does not do this automatically — `next/headers` `cookies()` has
to be read and attached), maps non-2xx responses to a typed `ApiError`, and callers
needing a session use the DAL's `verifySession()`/`requireSession()` (§2.2) to trigger
the refresh handoff rather than the client retrying inline (Server Components can't
set cookies — see §2.2's refresh note).

One adapter per resource: `lib/api/{auth,vendors,brands,categories,products,orders,cart}.ts`.
Every adapter function returns Zod-validated data regardless of source. The real/mock
seam is a single conditional per adapter:

```ts
// lib/api/products.ts
const SOURCE = process.env.PRODUCTS_DATA_SOURCE ?? "mock"; // flips to "live" once the backend ships it

export async function listProducts(params: ListProductsParams) {
  const raw = SOURCE === "live"
    ? await apiClient.get("/catalog/products", { params })
    : await mockProducts(params);
  return z.array(ProductSchema).parse(raw); // same contract either way
}
```

Mock fixtures live beside their adapter (`lib/api/mocks/products.ts`), validated
against the exact schema the real endpoint will need to satisfy — so when the backend
ships it, a contract mismatch is a Zod parse error in dev immediately, not a silent
production bug. Resources that are already real and already callable by the account
type using them (auth; vendor profile/documents/settlement; admin vendor approval)
skip the conditional. Brand/category endpoints are real but `isAdmin`-only (§1
correction) — `lib/api/admin/categories.ts` and `lib/api/admin/brands.ts` call them
directly (no mock) for future admin catalog-management pages, while the
public/customer-facing `lib/api/categories.ts` used by marketing and `(customer)/catalog`
stays on the mock seam like `products.ts`, since no account type has read access yet.

Error handling: in dev, a Zod parse failure throws and is visible immediately. In
production, it's caught by that route segment's `error.tsx`, logged, with a graceful
fallback — never a crashed page.

Server Actions handle all mutations that don't need client-side optimistic complexity
(auth, vendor KYC steps, admin approvals). TanStack Query is used only for the vendor
dashboard (client-driven polling) and cart (once real — built against the mock adapter
now with the same interaction model, so swapping the data source later doesn't change
component logic).

## 5. Admin permission gating

Fully permission-gated per the approved decision, using the backend's confirmed format:
`Permissions.{Resource}.{Action}` (from `VtlPermission.NameFor`, e.g.
`Permissions.Vendors.Approve`).

`lib/auth/permissions.ts` exports `hasPermission(session, resource, action)`; a
`<RequirePermission permission="Permissions.Vendors.Approve">` component gates admin
nav items and actions.

**Backend gap:** there is currently no way for the frontend to learn the current staff
user's permission list — `CurrentUserResponse` and the JWT claims carry `AccountType`
and `Roles[]` only, not permissions, even though `IPermissionService.GetPermissionsAsync`
already exists server-side. This is a **required backend addition** (§8): expose
permissions via a `permissions: string[]` field on `CurrentUserResponse` (or a JWT
claim, or a dedicated endpoint).

Until that lands, `hasPermission()` **fails open** with a loud dev-only
`console.warn("[stub] permission check bypassed")`, so the admin panel stays usable
during frontend development. A hard guard makes this impossible to ship accidentally:
the production build fails if `PERMISSIONS_SOURCE === "stub"` when `NODE_ENV === "production"`.

The permission registry also defines Vendor- and Customer-scoped permissions, not just
Staff — out of scope for this build's gating, but `hasPermission()` will work
unchanged for those later.

## 6. Design tokens

Tailwind v4, defined via `@theme` in `app/globals.css`, semantic names (not raw color
names) so shadcn's own CSS variables map onto these in one file instead of
per-component overrides.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-brand-primary` | `#062C24` | `#71F8E4` | Primary actions/brand marks — flips to the bright mint in dark mode since the near-black green has no contrast on a dark surface |
| `--color-brand-primary-hover` | `#0A3D32` (derived) | `#089E7E` | Hover/pressed |
| `--color-accent` | `#089E7E` | `#089E7E` | Secondary CTAs |
| `--color-verified` | `#006B5F` | `#71F8E4` | "Verified vendor"/trust badges |
| `--color-surface` | `#FFFFFF` | `#0D1C32` | Page/card background |
| `--color-surface-muted` | `#EFEFEF` | `#191C1D` | Secondary surface |
| `--color-border` | `#D1D5DB` | `#76849F` | Borders/dividers |
| `--color-text-muted` | `#6B7280` | `#C5C6CD` | Secondary text |
| `--color-info-surface` | `#D6E3FF` | — | Selected/info background |
| `--color-danger` | `#DC2626` | `#DC2626` | Validation errors — not in source palette, standard accessible default, override if brand has a preferred value |
| `--color-warning` | `#D97706` | `#D97706` | Low-stock/warning badges — same caveat |

shadcn/ui primitives are customized to consume these tokens, not used with default
theming.

## 7. `next.config.ts`

```ts
const nextConfig: NextConfig = {
  cacheComponents: true, // top-level in Next 16, not experimental.* — confirmed against node_modules/next/dist/docs; also replaces the old experimental.ppr flag entirely
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      // Brand/business-logo/avatar uploads already use Cloudinary
      // (IImageStorageService/CloudinaryOptions). Product images will very
      // likely land here too once the Product API ships, given the same
      // service is reused per-resource — confirm when that endpoint exists.
    ],
  },
  async rewrites() {
    return [
      { source: "/api/backend/:path*", destination: `${process.env.BACKEND_ORIGIN}/:path*` },
    ]; // dev-time same-origin proxy fallback; production same-origin routing belongs at the infra layer (§3)
  },
};
```

With `cacheComponents: true`, PPR is not a separate flag — it falls out of where
`"use cache"` vs. a `<Suspense>` boundary is placed. Landing and catalog get a
`"use cache"` static shell (hero, nav, category chrome) with cart-count/
recommendations/price-stock wrapped in `<Suspense>` to stream in dynamically. (Cart
count is omitted entirely for now — see §8, no fabricated placeholder.)

## 8. Landing page content rules

- Featured categories: **mocked**, same as trending products. `GetProductCategories`
  exists but is `isAdmin`-only (§1 correction) — no public read path exists today.
- Trust/compliance copy may reference NAFDAC-registered vendors (real `DocumentType`).
  Must **not** name specific payment processors (Paystack/Flutterwave) — no payment
  integration exists yet.
- Social proof numbers (vendor count, order volume): **omitted entirely**, not mocked.
  There's no public stats endpoint, and per the PRD's own "do not fabricate numbers"
  instruction, a fake "500+ vendors" is a trust/legal issue, not a stubbed API call.
  Qualitative trust copy only, until a real endpoint exists.
- Cart-count in nav: omitted, not faked, since Cart doesn't exist.
- AI Health Assistant: **explicitly out of scope** for this build (confirmed with user)
  — will be added as its own future sub-project once the backend has a real endpoint.
  No placeholder UI or routes for it in this architecture.

## 9. Vertical slice (build this first, to validate the pattern)

Resolves one ordering tension: the requested slice order (landing → catalog → login →
dashboard) implies a public catalog, but the folder structure places `catalog` under
`(customer)` (auth-required). Resolved as most marketplaces do: a **public** browse
experience lives at `(marketing)/products/`, and `(customer)/catalog/page.tsx` is the
*authenticated*, personalized view reusing the same components/adapters. Flagged
explicitly in case the intent was actually customer-only catalog with no public browse.

1. `(marketing)/page.tsx` — cache-components static shell, mocked featured categories
   and trending products streamed in, dual hero CTA ("Shop health products" /
   "Sell on Vitalink").
2. `(marketing)/products/page.tsx` + `[slug]/page.tsx` — public PPR'd catalog, mocked
   categories/products, JSON-LD structured data.
3. `(auth)/login/page.tsx` — real, full MFA branching (`LoginResponse.MfaRequired` →
   TOTP or OTP-email).
4. `(customer)/dashboard/page.tsx` — real identity via `GetCurrentUser`, mocked
   order-history widget.

## 10. Required backend additions (tracked, not blocking this build)

1. Expose the current staff user's permission list to the frontend (field on
   `CurrentUserResponse`, JWT claim, or dedicated endpoint) — needed to retire the
   permission stub in §5.
2. (Optional optimization) Add `VendorVerificationStatus` to JWT claims so `proxy.ts`
   can fast-path vendor-status routing instead of deferring entirely to the DAL.
3. Expose a public (or at minimum Customer-accessible) read path for brand/
   product-category taxonomy. Today `Brands.List`/`ProductCategories.List` are
   `isAdmin: true` only in `PermissionRegistry` — there is no way for a storefront
   visitor, or even a logged-in Customer, to read categories/brands at all, which
   blocks even the most basic public catalog browsing chrome, independent of the
   missing `Product` entity.

## 11. README section (to write alongside implementation)

Covers, for future engineers who might be tempted to "simplify" this back into a
shared structure: why the three role route groups never cross-import components (with
the vendor-payout-in-customer-context leak scenario as the concrete example), the
`proxy.ts` + DAL defense-in-depth rationale (§2.2) and why layouts alone are not a
security boundary, the `AccountType`↔route-group naming map and where it lives, the
mock/real adapter seam convention and how to flip a resource, the permission-stub
production guard and how to retire it, and the §10 required-backend-additions
checklist.

## 12. Explicitly out of scope for this design

- AI Health Assistant (§8)
- Cart, Checkout, Orders, Payments, Disputes, Analytics as real integrations (mocked
  behind real contracts per §4, wired up when the backend ships them)
- Mobile (React Native) — PRD mentions it, not part of this frontend
