# Vitalink Frontend

Next.js 16 frontend for Vitalink, a healthcare marketplace with three distinct
experiences — buyer, vendor, admin — against a .NET backend
(`vitalink-backend`). Full architecture rationale lives in
[`docs/superpowers/specs/2026-08-06-vitalink-frontend-architecture-design.md`](docs/superpowers/specs/2026-08-06-vitalink-frontend-architecture-design.md);
this section is the condensed version for engineers working in the codebase
day to day.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in BACKEND_ORIGIN and AUTH_JWT_SIGNING_KEY at minimum
npm run dev
```

## Role separation — read this before "simplifying" anything

This app deliberately keeps buyer, vendor, and admin experiences structurally
separate. If a change looks like it would be simpler by sharing a component
or a layout across roles, it's very likely reintroducing the exact problem
this structure exists to prevent — read the rest of this section first.

### Why real path segments, not (buyer)/(vendor)/(admin) route groups

`app/buyer/`, `app/vendor/`, and `app/admin/` are real URL segments, not
parenthesized route groups. An earlier draft of this architecture used route
groups for all three, which doesn't work: route groups don't add a URL
segment, so `(buyer)/dashboard` and `(vendor)/dashboard` would both resolve
to `/dashboard` and fail the build on collision. Real segments also make
`proxy.ts`'s matching unambiguous — see below.

### Why components never cross role boundaries

`components/ui/` holds shared primitives (buttons, cards, form fields).
`components/{buyer,vendor,admin,marketing}/` hold role-scoped composed
components. **A component in one role's folder must never be imported by
another role's route**, even when it looks reusable. This is exactly how
healthcare marketplaces leak data across roles in practice: a vendor payout
component gets reused in a "similar-looking" buyer order-summary view
because someone didn't want to duplicate a few lines of markup, and now a
buyer can see another vendor's settlement details. If two roles need
visually similar UI, duplicate it or extract a shared primitive into
`components/ui/` — don't reach across the role boundary.

### Defense in depth: proxy.ts is not the security boundary

Three layers, and they do different jobs:

1. **`proxy.ts`** — fast, optimistic, cookie-only (no network/DB calls).
   Redirects obviously-wrong requests (wrong role, no session) before any
   route code runs. Matches on the real `/buyer`, `/vendor`, `/admin`
   prefixes (`lib/auth/route-groups.ts`).
2. **`lib/auth/dal.ts`** (`requireSession`/`requireAccountType`) — the actual
   authoritative check, called at the top of every protected page and every
   Server Action that touches protected data. Next.js layouts do **not**
   reliably re-run on every client-side navigation within them (that's
   Next's own documented behavior, not a Vitalink-specific quirk), so a
   check placed only in a `layout.tsx` can be skipped. Every protected
   `page.tsx` calls `requireAccountType()` itself — don't remove that call
   because "the layout already checks it."
3. **Layouts** (`app/vendor/layout.tsx`, `app/admin/layout.tsx`) still call
   `requireAccountType()` too, but that's a UX convenience (avoids flashing
   the full nav before a redirect), not the security boundary.

`proxy.ts` can also be bypassed entirely by a direct Server Action call on
an uncovered path — this is exactly why step 2 exists independently of step
1, not as a redundant belt-and-suspenders afterthought.

### `AccountType` ↔ path-prefix naming

The backend's `AccountType` enum is `Customer | Vendor | Staff`. This app's
path prefixes are `/buyer`, `/vendor`, `/admin`. These are deliberately
different vocabularies (backend identity concept vs. product/UX language),
and the mapping between them lives in exactly one place:
`lib/auth/route-groups.ts`'s `PATH_PREFIX_ACCOUNT_TYPE`. Don't re-derive or
string-compare this mapping anywhere else.

### The mock/real data-layer seam

Every resource adapter in `lib/api/` returns the same Zod-validated shape
regardless of whether it's backed by real data or a fixture — see
`lib/api/products.ts` for the pattern (a `PRODUCTS_DATA_SOURCE` env var flips
the source). As of this writing, the backend has auth, vendor
onboarding/KYC, and admin vendor/staff/role management — everything else
(products, cart, orders, payments, disputes, analytics, category/brand
browsing for anyone but staff) is mocked behind the same contract the real
endpoint will need to satisfy. When a real endpoint ships, flipping the
adapter is a one-file change; if the real response doesn't match the mocked
shape, Zod throws immediately in dev instead of failing silently later.

### The admin permission stub — do not remove the production guard

`lib/auth/permissions.ts`'s `hasPermission()` fails open (returns `true`,
with a loud console warning) while `PERMISSIONS_SOURCE=stub`, because the
backend doesn't yet expose which permissions the current staff user holds.
There is a deliberate guard that **fails the production build** if this env
var is still `stub` at build time — this is not a bug to work around by
setting `PERMISSIONS_SOURCE=live` without actually wiring real permission
data. Only flip it once the backend adds a way to read the current user's
permissions (see "Required backend additions" below) and
`lib/auth/permissions.ts` is updated to read it.

### Required backend additions (tracked, not blocking this frontend build)

1. Expose the current staff user's permission list to the frontend (field on
   `CurrentUserResponse`, a JWT claim, or a dedicated endpoint) — needed to
   retire the permission stub above.
2. *(Optional optimization)* Add `VendorVerificationStatus` to the JWT claims
   so `proxy.ts` can fast-path vendor-status routing instead of deferring
   entirely to `app/vendor/layout.tsx`.
3. Expose a public (or at minimum Customer-accessible) read path for
   brand/product-category taxonomy. Today `Brands.List`/
   `ProductCategories.List` are `isAdmin: true` only — there's no way for a
   storefront visitor, or even a logged-in Customer, to read categories or
   brands at all.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- Architecture design doc: `docs/superpowers/specs/2026-08-06-vitalink-frontend-architecture-design.md`
