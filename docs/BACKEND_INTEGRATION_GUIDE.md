# Backend Integration Guide

A field-by-field review of `vitalink-backend` (commit `0fe1fd3`, 2026-08-31) against
this frontend's mock/live adapter layer (`lib/api/*.ts`), covering every endpoint the
backend currently exposes, what actually blocks flipping a `*_DATA_SOURCE`/
`PERMISSIONS_SOURCE` flag from `mock`/`stub` to `live`, and how to run the backend
locally to verify any of this against a real running API.

Everything under "Confirmed blockers" was checked directly against the backend's C#
source (route constants, request/response records, JWT claim names, JSON
serialization config) — not guessed. Everything under "Endpoint inventory" is
extracted from the backend's own `[Map...]`/`.WithSummary()` registrations, so it's
authoritative as of the commit above; re-generate it (see the note at the bottom) if
the backend moves on.

## 0. Status (2026-09-01)

**`AUTH_DATA_SOURCE=live` is fully verified against a real running local backend** —
not just "should work," actually exercised end-to-end: register → login → session
cookies issued by the real backend → `proxy.ts`/`lib/auth/dal.ts`'s local JWT-claim
verification → a real protected page (`/admin/dashboard`) rendering the real user's
name → a separate `/auth/me` network call, all working. Every fix below that's
marked **(fixed)** landed in code as part of getting that path working; everything
else is still the original analysis, unverified against a live response.

Getting there also surfaced several **local-environment** gotchas with no code fix —
they're one-time setup steps on whichever machine runs this, not bugs:

- A native Homebrew `redis-server` was already listening on `localhost:6379`,
  silently shadowing Docker Compose's Redis on the same port and serving a stale
  cached Zitadel service-account token after every restart. Stopped it
  (`brew services stop redis`) — if you hit inexplicably-stale-looking backend
  auth behavior on a machine with its own Redis, check `lsof -i :6379` for a
  second listener first.
- The backend's `ZitadelOptions` in `appsettings.Development.json` pointed at an
  org/service-account key that doesn't exist in a freshly-bootstrapped local
  Zitadel instance (`docker compose up`'s `start-from-init` mints a brand new
  org each time, with new IDs). Needed a new machine-user service account
  created in the Zitadel console (`http://localhost:6500/ui/console` →
  Users → Service Accounts → New, **Access Token Type: JWT**, not Bearer),
  granted **both** an org-level `ORG_OWNER` role (lets it create/manage
  users) **and** an instance-level `IAM_LOGIN_CLIENT` role (lets it create
  *sessions* — i.e. log someone in; `ORG_OWNER` alone gets a Zitadel
  `AUTHZ-cdgFk "membership not found"` error on login specifically, which the
  backend masks into a generic `401 Login.InvalidCredentials` — see §2.8).
- `appsettings.Development.json` was also missing config for several
  `[Required]`-validated option groups the app now needs just to *start*
  (`TavilyOptions`, `CloudinaryOptions`, `AzureAIOptions`, `S3BucketOptions`,
  `EncryptionOptions`) — added local placeholder values for all of them (real
  values only matter once those specific features — AI search, image
  uploads, vendor document storage, field encryption — are actually
  exercised).
- The backend unconditionally redirects its plain-HTTP port to HTTPS
  (`Program.cs`'s `app.UseHttpsRedirection()`), so `BACKEND_ORIGIN` has to
  point at the HTTPS port with its self-signed dev cert trusted — see §2.9
  for why `NODE_EXTRA_CA_CERTS` is the wrong way to do that in this stack and
  what `lib/api/client.ts` does instead.

---

## 1. Running the backend locally

### What you need

| Tool | Status on this machine | Why |
|---|---|---|
| .NET 10 SDK | ✅ installed (`10.0.302`) | Runs `src/Web.Api` directly on the host — the API itself is **not** normally containerized in dev (`compose.yaml`'s `webapi` service is commented out). |
| Docker Desktop | ❌ not installed — see below | Runs the backend's dependencies: Postgres (pgvector), Zitadel (identity provider), Redis, RustFS (S3-compatible object storage), pgAdmin, Traefik. |

**Docker install status:** I ran `brew install --cask docker` for you, but it failed
partway through — Homebrew needed to `sudo mkdir /usr/local/cli-plugins`, and a
background shell has no terminal to prompt you for your password on. It cleaned up
after itself (no partial state left behind), so a normal interactive install will
work cleanly. Run this yourself in a real terminal (or prefix it with `!` in this
chat so it runs interactively):

```bash
brew install --cask docker
```

Then open **Docker.app** once from `/Applications` — it'll ask for your password to
install its privileged helper (this is the one-time GUI step brew can't automate).
Once the whale icon in the menu bar stops animating, Docker is ready and `docker` /
`docker compose` will work from any terminal, including mine in future sessions.

### Bring up the dependencies

```bash
cd vitalink-backend
cp .env.example .env   # defaults are fine for local dev
docker compose --env-file .env up -d postgres redis zitadel_api zitadel_login proxy pgadmin
```

Before anything else, check nothing else on the machine is already using Redis's
port: `lsof -i :6379` should show only Docker's proxy. A native `redis-server`
(e.g. `brew services list | grep redis`) will silently win that port over Docker's
and serve stale cached tokens across backend restarts — see §0/§2.10.
`brew services stop redis` if so.

Wait for Zitadel to report healthy (`docker compose ps` — it takes ~60-90s the first
time, it's bootstrapping an org/project). RustFS (vendor document storage) is
optional unless you're testing document uploads — see `README.md`'s "Local RustFS
Setup" for the one-time bucket/policy/access-key setup, or skip it (uploads will
fail, everything else works).

### One-time Zitadel provisioning (a fresh instance needs this)

`appsettings.Development.json`'s `ZitadelOptions` ships pointing at an
org/service-account key that belongs to *whichever* Zitadel instance the backend
team last bootstrapped theirs against — not one `docker compose up` recreates for
you (`start-from-init` mints a brand-new org, with new IDs, every time). Before
`dotnet run` will get anywhere near working:

1. Open `http://localhost:6500/ui/console`, log in as `zitadel-admin@zitadel.localhost`
   / `Password1!` (set on first login).
2. **Users → Service Accounts → New**: username `vitalink-api`, **Access Token
   Type: JWT** (not Bearer — the backend authenticates via a private-key JWT
   assertion, confirmed from `ZitadelServiceAccountTokenProvider.cs`'s
   `grant_type: urn:ietf:params:oauth:grant-type:jwt-bearer`).
3. Grant it **both**:
   - an org-level **`ORG_OWNER`** role (Role Assignments on the service account,
     or `POST /management/v1/orgs/me/members` with `{"userId": "...", "roles":
     ["ORG_OWNER"]}`) — lets it create/manage users, vendors, etc.
   - an instance-level **`IAM_LOGIN_CLIENT`** role (`POST /admin/v1/members` with
     `{"userId": "...", "roles": ["IAM_LOGIN_CLIENT"]}`) — **easy to miss**, and
     without it `ORG_OWNER` alone looks sufficient (register, user lookups, org
     membership all work) right up until login itself, which fails with a
     misleadingly generic `401 Login.InvalidCredentials` — see §2.10.
4. Generate a **JSON** key on that service account and download it.
5. Update `appsettings.Development.json`'s `ZitadelOptions.OrganizationId` (the
   real org's id — `POST /management/v1/orgs/me` or the console URL after logging
   in shows it) and `ServiceAccount.KeyFilePath` to point at the new key file
   under `src/Infrastructure/Zitadel/ServiceAccount/`.
6. Fill in local placeholder values for the other `[Required]`-validated option
   groups the app now needs just to *start* — none of these have defaults or
   existing entries in `appsettings.Development.json`, and startup fails outright
   (`OptionsValidationException`) without them:

   ```json
   "TavilyOptions": { "ApiKey": "local-dev-placeholder-not-a-real-key" },
   "CloudinaryOptions": {
     "CloudName": "local-dev-placeholder",
     "ApiKey": "local-dev-placeholder",
     "ApiSecret": "local-dev-placeholder"
   },
   "AzureAIOptions": {
     "Endpoint": "https://local-dev-placeholder.openai.azure.com/",
     "ApiKey": "local-dev-placeholder-not-a-real-key"
   },
   "EncryptionOptions": { "FieldEncryptionKey": "<base64 32-byte key, e.g. `openssl rand -base64 32`>" }
   ```

   (`S3BucketOptions` already has a working placeholder entry further down the
   same file — don't add a second one, `appsettings.Development.json` is parsed
   strictly and a duplicate top-level key throws `FormatException: A duplicate
   key '...' was found` on startup, confirmed live.) Real values only matter once
   those specific features (AI search, image uploads, vendor document storage,
   field encryption) are actually exercised — placeholders are enough to boot.

If Redis had a stale service-account token cached from before you fixed the roles
above, flush it (`docker exec vitalink.redis redis-cli FLUSHALL`) before your next
`dotnet run` — otherwise the app keeps using the old, wrongly-scoped token until it
naturally expires.

### Run the API

```bash
cd vitalink-backend
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/Web.Api
```

Once it's up:

- API base: **`https://localhost:7103`** (the plain-HTTP port, `5071`, always
  redirects here — `Program.cs`'s `app.UseHttpsRedirection()` — see §2.9 for what
  that means for a Node client)
- Interactive API explorer (Scalar): **`https://localhost:7103/scalar`** — the
  fastest way to check a real response shape against anything this guide
  describes.
- Health check: `https://localhost:7103/health`

### Point this frontend at it

`vitalink-frontend/.env.local` already has this filled in (it's gitignored, so this
is real per-machine config, not just a template) — see its own comments for the
full explanation of each line, including §2.9's TLS-trust setup:

```bash
BACKEND_ORIGIN=https://localhost:7103           # note: HTTPS port — see §2.9
BACKEND_CA_CERT_PATH=.certs/backend-dev-cert.pem # see §2.9
AUTH_JWT_SIGNING_KEY=dev-signing-key-change-me-change-me-change-me   # appsettings.Development.json's JwtOptions:SigningKey
AUTH_JWT_ISSUER=Vitalink
AUTH_JWT_AUDIENCE=Vitalink
```

`AUTH_DATA_SOURCE` defaults to `mock` there on purpose (so a plain `npm run dev`
still works with no backend running) — set it to `live` once the backend above is
actually up. Don't flip `PRODUCTS_DATA_SOURCE`/`ADMIN_DATA_SOURCE` to `live` without
reading section 2 first — several adapters will *appear* to work while silently
mis-parsing responses (a 500 from a Zod `.parse()` failure isn't as loud as a thrown
"not configured" error), which is worse than a clean failure.

---

## 2. Confirmed blockers — fix these before flipping anything to `live`

Ranked by how many adapters they silently break.

### 2.1 Every adapter is missing the `/api/v1` prefix — (fixed)

The backend mounts **every** endpoint under `api/v{apiVersion}` (`Program.cs`:
`app.MapGroup("api/v{apiVersion:apiVersion}")`, version 1 registered). So the real
login endpoint is `api/v1/auth/login`, not `/auth/login`.

Every adapter's `BASE` constant was missing this. **Fixed centrally** in
`lib/api/client.ts`'s `request()` (a `versionedPath()` helper prefixes every path) —
adapters never needed to know about API versioning individually.

### 2.2 Enums serialize as numbers, not strings — partially addressed

Confirmed live, decided not to chase backend-wide: per the "don't write backend
code" constraint for this integration pass, no global `JsonStringEnumConverter` was
added. **Every enum field the frontend actually sends or reads still needs its own
explicit ordinal mapping**, done as each one is actually exercised rather than
pre-emptively for all ~15+ enum types backend-wide. Two are done, both confirmed
against real behavior:

- **Register's `accountType`** (request body): confirmed live — sending the string
  `"Customer"` gets a hard `400 "Failed to read parameter... as JSON"` (an enum-typed
  C# property can't bind a JSON string at all, this isn't a validation error). Fixed
  in `lib/api/auth.ts` — `ACCOUNT_TYPE_ORDINAL` maps `Customer:0, Vendor:1, Staff:2`
  (confirmed order from `Application/Abstractions/Authentication/AuthDto.cs`) and
  `register()` sends the ordinal, not the string.
- **`account_type` on reads** (JWT claim and `GetCurrentUserResponse.accountType`):
  turned out to be a **different, non-obvious case** — see 2.3, it's not the
  ordinal-int pattern at all.

Every other enum field this frontend doesn't yet touch (status enums on
vendors/products/orders/fulfillments/etc., all still numeric on the wire) needs the
same one-by-one treatment before its adapter can go live — check "endpoint inventory"
status for what's actually been exercised.

### 2.3 The JWT's claim names don't match `lib/auth/session.ts` — (fixed)

Only **one** enum in the entire backend (`GetCertificationDownloadUrlQuery`'s) has
`[JsonConverter(typeof(JsonStringEnumConverter))]`. No global
`JsonStringEnumConverter` is registered anywhere in `Web.Api` (checked
`Program.cs`/`DependencyInjection.cs` for `ConfigureHttpJsonOptions`/`AddJsonOptions`
— neither exists). System.Text.Json's default is to serialize enums as their
**integer** ordinal.

This directly contradicts the assumption baked into every Zod schema in this
frontend — `AccountTypeSchema = z.enum(["Customer", "Vendor", "Staff"])` and every
status enum (`VendorProductStatus`, order/fulfillment status, etc.) will **reject** a
raw `0`/`1`/`2` and throw inside `.parse()`. `lib/api/auth.ts` even has a comment
flagging this as an unverified assumption — it's confirmed wrong.

`lib/auth/session.ts`'s `verifyAccessToken()` used to read `payload.userId`/
`payload.accountType`/`payload.displayName`/`payload.roles` — none of them real
keys. The real token (`Infrastructure/Authentication/Services/JwtCookieService.cs`,
`CreateAccessToken`) puts:

| Frontend expected | Real JWT claim key | Value |
|---|---|---|
| `userId` | `sub` (`JwtRegisteredClaimNames.NameId`) | the Zitadel user id |
| `accountType` | **`account_type`** (`AppClaims.AccountType`) | **string, lowercase** — a genuinely different case than every other `AccountType` value this app uses, not the ordinal-int pattern from 2.2. Confirmed live. |
| `displayName` | **`name`** (`AppClaims.DisplayName`) | string |
| `email` | `email` | matched already |
| `roles` | **`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`** (`ClaimTypes.Role`, one claim per role) | string, or an array of strings for &gt;1 role |

Also confirmed live and not originally anticipated: if the backend's Zitadel
metadata lookup for account type finds nothing (e.g. the seeded default
super-admin, `admin@vitalink.tech` — created with no `account_type` metadata at
all), it falls back to the literal string `"admin"`, which isn't one of
`Customer`/`Vendor`/`Staff` at all.

**Fixed**: `session.ts` now exports `normalizeAccountType()` — lowercases, then maps
through an alias table (`customer→Customer, vendor→Vendor, staff→Staff,
admin→Staff`). Used in two places, since the exact same raw value shows up twice:
the JWT claim (`verifyAccessToken()`) and `GetCurrentUserResponse.accountType` (a
separate network call, `lib/api/auth.ts`'s `getCurrentUser()` — both come from the
backend's own `Infrastructure/Zitadel/Services/ZitadelUserService.cs`
`GetAccountTypeAsync()` helper, so both needed the fix).

Still present and **not modeled at all** in `SessionClaims`: `avatar_url`
(`AppClaims.AvatarUrl`) and `vendor_id` (`AppClaims.VendorId` — worth adding, it's a
free scoping id vendor-side code currently derives from `sub` instead).

### 2.4 Two adapters call the wrong path segment entirely — (fixed)

- `lib/api/products.ts` calls `/catalog/products` and `/catalog/products/{slug}`.
  The real routes are **`marketplace/products`** and **`marketplace/products/slug/{slug}`**
  (`MarketplaceEndpoints.GetProducts` / `GetProductBySlug`) — note also the `/slug/`
  segment, not just appending the slug directly.
- `lib/api/admin/audit.ts` calls `/admin/audit-logs`. The real route is
  **`admin/audit`** (`AdministrationEndpoints.Audit.AuditBase`).

Everything else checked (`lib/api/vendor-profile.ts`'s `/users/vendors*` paths
including the document upload sub-paths and verbs, `lib/api/admin/{vendors,staff,
roles,products}.ts`'s `/admin/*` bases, `lib/api/auth.ts`'s `/auth/*` paths) already
match the real route segments exactly (module the missing `/api/v1` prefix in 2.1).

### 2.5 The marketplace catalog is `Product` + `Offer`, not one flat `Product`

This is the biggest *structural* gap, not a rename. The backend models a catalog
`Product` (name, brand, category, images, certifications — vendor-agnostic) and a
vendor `Offer` against it (price, stock, condition, discounts, volume tiers) as two
related entities. A marketplace listing can have offers from multiple vendors at
different prices. This frontend's `Product` type (`lib/api/products.ts`) flattens
both into one object with `price`/`stockCount`/`vendorId` directly on it.

Concretely, `GET marketplace/products` (`MarketplaceProductCard`) returns:

```ts
{
  productId: string;        // not "id"
  name: string;
  slug: string;
  modelNumber: string | null;
  primaryImageUrl: string | null;   // not "imageUrl"
  brandName: string;                // not "brand"
  categoryName: string;             // not "categoryLabel"/"categorySlug"
  startingPrice: number;            // the *cheapest* offer's price — not one vendor's price
  currency: string;
  rating: number;
  reviewCount: number;
  offerCount: number;               // how many vendors sell this
  cheapestOfferCondition: string | null;  // "New" | "Refurbished" | "Used"
  brandIsVerified: boolean;
}
```

No `stockCount`, `promoPrice`, `originalPrice`, `shortDescription`, or NAFDAC/FDA
`badge` on this card at all — those either live on the product-detail endpoint
(`GetProductBySlug`/`GetProductById` — not yet read in this pass, check before
wiring the detail page) or on the *offer*, not the product card.

Query params also differ from what `lib/api/products.ts`'s `ListProductsParams`
sends: filtering is by **`brandId`/`categoryId` (GUIDs)**, not `brand` (name) /
`categorySlug` (string) — the frontend would need to resolve slug→id via
`marketplace/categories` first. `search` is called **`term`**. Pagination is
**`pageNumber`** (not `page`) / `pageSize` (matches). `sort` accepts
`relevance | price_asc | price_desc | rating | newest | name` — the frontend's
`SORT_OPTIONS` only has `price-asc | price-desc | name-asc` (different casing *and*
missing `relevance`/`rating`/`newest`).

**This means wiring `PRODUCTS_DATA_SOURCE=live` is a real feature of work, not a
flag flip** — the buyer-facing catalog UI needs an adapter mapping (Product+Offer →
today's flat card shape, or a broader refactor to show multiple vendor offers per
product, which is arguably the more honest UI given the backend explicitly supports
it). Same applies to the vendor-side product wizard (`lib/api/vendor-products.ts`):
the backend's vendor product flow is **draft → basic-info → descriptions → media →
origin → certifications → submit-for-review**, then **separately** create an Offer
(price/stock/condition) against the approved product and submit *that* for review
too. The current wizard collects price/stock/image in one pass against one
`createDraftAction` call — it doesn't map onto this two-entity, multi-step backend
flow as-is.

### 2.6 Admin permission checks use the wrong action vocabulary — (fixed)

The backend's real action set is `List | Read | Create | Update | Delete | Search |
Manage` (`Shared/Identity/ActionConstants.cs`) — most admin *mutations* (approve
vendor, reject vendor, create staff, approve/reject product, etc.) map to the broad
**`Manage`** action, not per-operation verbs. `app/admin/actions.ts`'s
`requireAdminPermission()` calls use verbs that don't exist in the real permission
set: `hasPermission(session, "Vendors", "Approve")`, `"Staff", "Create"` (should be
`"Vendors"/"Manage"`, `"Staff"/"Manage"`), etc. `permissionName()`'s output *format*
(`Permissions.{Resource}.{Action}`) is already correct — verified against
`VtlPermission.NameFor` — only the call-site verbs need correcting. The full
authoritative permission string for every admin/vendor/customer endpoint is in the
inventory tables below (the `perm:` column).

Separately: **there is no "get my current permissions" endpoint**, and the JWT
carries `roles` (role *names*) but no permissions list. `lib/auth/permissions.ts`'s
`hasPermission()` has a `// TODO: once PERMISSIONS_SOURCE=live, check
session.permissions` — that field has nothing to read from yet. `GetRoleDetails`
does return one role's permission list, but it itself requires `Roles.Manage`, so a
non-admin session can't self-serve it. **This needs a small backend addition**
(either a permissions claim in the JWT, or a `GET .../me/permissions` endpoint)
before `PERMISSIONS_SOURCE=live` can mean anything beyond "trust the backend's own
403s and don't bother gating the UI client-side."

### 2.7 Guest cart uses a third cookie the frontend doesn't know about

`Endpoints/Users/Customer/CartEndpointSupport.cs` mints its own
`__Host-vitalink_cart` cookie for anonymous cart tracking (cart endpoints are
`AllowAnonymous`, deliberately — see the inventory below), separate from the
`__Host-access_token`/`__Host-refresh_token` pair `lib/auth/session.ts` already
knows about. `lib/api/client.ts`'s `request()` already forwards *all* cookies via
`cookies().toString()`, so nothing breaks mechanically — but `lib/api/cart.ts` (mock
only today) will need to know this cookie exists so a guest's cart survives across
requests and correctly merges into their real cart via `POST
users/customers/cart/claim` right after login/registration (`ClaimGuestCart` — not
currently called anywhere in the frontend's `login`/`register` flow).

### 2.8 Login's request body field is `email`, not `loginName` — (fixed)

`lib/api/auth.ts`'s `login()` sent `{ loginName, password }` — confirmed live: the
real `LoginCommand` only has `Email`/`Password`, and sending `loginName` unchanged
gets a `422` FluentValidation error, `"Email is required."` **Fixed**: the function
still takes a `loginName` param (kept — it may end up meaning "email or Zitadel
login name" once non-email logins exist) but now sends `{ email: loginName,
password }` on the wire.

### 2.9 TLS trust for a local backend needs to be scoped per-request, not global — (fixed)

Not a backend mismatch — a real Node/undici footgun hit while testing any of this
locally. The backend redirects HTTP→HTTPS unconditionally (`Program.cs`'s
`app.UseHttpsRedirection()`), so a local `BACKEND_ORIGIN` has to be the HTTPS port
with its self-signed dev cert trusted. The obvious approach —
`NODE_EXTRA_CA_CERTS=path/to/cert.pem npm run dev` — **breaks the rest of the app**:
confirmed live, it made `next/font/google`'s own internal fetch fail (`next dev`
sends every page down a 500 route), because in this Next/undici combination that env
var *replaces* Node's trusted-root bundle rather than adding to it.

**Fixed**: `lib/api/client.ts` now takes an optional `BACKEND_CA_CERT_PATH` and, only
when it's set, builds an `undici.Agent` scoped to just its own backend fetch calls
(passed as `dispatcher`, undici's own non-standard `fetch()` option). One more
wrinkle, also confirmed live: passing that dispatcher into Node's *global* `fetch()`
throws `InvalidArgumentError: invalid onRequestStart method` — Node's built-in fetch
is backed by whichever undici version Node itself bundled internally, and a
dispatcher from the standalone `undici` npm package isn't necessarily
ABI-compatible with it. The fix imports `fetch` from the `undici` package too (now a
devDependency) and uses that instead of the global, but only on the code path where
a custom dispatcher is actually in play — everywhere else still uses the platform's
native fetch. See `.env.local`'s own copy of this comment for the exact setup
commands (`dotnet dev-certs https --trust` + `--export-path`).

### 2.10 Local Zitadel service account needs two roles, not one — (local setup, no code fix)

See §0 above — `IAM_LOGIN_CLIENT` (instance-level) is required in addition to
`ORG_OWNER` (org-level) before the backend's own login flow (session creation) works
against a freshly-provisioned local Zitadel instance. Nothing to fix in either repo;
just a step easy to miss since `ORG_OWNER` alone is already enough for register,
user lookups, and org-member management to all work, making it look complete.

---

## 3. Endpoint inventory & frontend mapping status

Generated from the backend's own `Endpoints/**/*Endpoints.cs` route constants and
each individual endpoint's `.WithSummary()`/`.RequirePermission()`. `perm:` = the
exact `Permissions.{Resource}.{Action}` string required; `anon` = no auth; `auth` =
any authenticated session, no specific permission. Status column:

- 🟢 **live-wired** — adapter has a `live` branch that already targets this route correctly (mod section 2.1's prefix)
- 🟡 **mismatched** — adapter has a `live` branch but the path/shape is wrong (see §2)
- ⚪ **mock-only** — adapter has no `live` branch at all yet; this is genuinely new backend capability to wire up
- ⬜ **unconsumed** — no frontend adapter references this endpoint at all yet

### Authentication — `api/v1/auth/*`

| Verb | Route | Access | Frontend status |
|---|---|---|---|
| POST | `auth/login` | anon | 🟢 `lib/api/auth.ts` `login()` |
| POST | `auth/register` | anon | 🟢 `register()` |
| POST | `auth/refresh` | anon | 🟢 `app/api/auth/refresh` route handler |
| POST | `auth/logout` | anon | ⬜ no adapter calls this yet (check logout UI flow) |
| POST | `auth/logout-all` | anon | ⬜ unconsumed |
| GET | `auth/me` | auth | 🟢 `getCurrentUser()` |
| POST | `auth/verify-email` | anon | ⬜ unconsumed — no verify-email page exists (see `docs/MOCK_AUTH.md`) |
| POST | `auth/resend-verification` | anon | ⬜ unconsumed |
| POST | `auth/login/totp` | anon | 🟢 `loginTotp()` |
| POST | `auth/login/otp-email/start` | anon | 🟢 `loginStartOtpEmail()` |
| POST | `auth/login/otp-email/verify` | anon | 🟢 `loginVerifyOtpEmail()` |
| POST | `auth/login/otp-email/resend` | anon | 🟢 `resendLoginOtpEmail()` |
| POST | `auth/forgot-password` | anon | ⬜ unconsumed — no forgot-password UI |
| POST | `auth/reset-password` | anon | ⬜ unconsumed |
| POST | `auth/mfa/totp/setup` | auth | ⬜ unconsumed — this is the **real** MFA enrollment endpoint the recently-added `components/{buyer,vendor}/mfa-settings.tsx` should call once wired; today it only writes to a local mock store (`lib/api/security.ts`) |
| POST | `auth/mfa/totp/verify` | auth | ⬜ unconsumed (confirms enrollment) |
| DELETE | `auth/mfa/totp` | auth | ⬜ unconsumed |

### Marketplace (public catalog) — `api/v1/marketplace/*`

| Verb | Route | Access | Frontend status |
|---|---|---|---|
| GET | `marketplace/products` | anon | 🟡 `lib/api/products.ts` `listProducts()` — wrong path (`/catalog/products`) + params (§2.5) |
| GET | `marketplace/products/{productId:guid}` | anon | ⬜ unconsumed (frontend only fetches by slug) |
| GET | `marketplace/products/slug/{slug}` | anon | 🟡 `getProductBySlug()` — wrong path, missing `/slug/` segment |
| GET | `marketplace/products/suggestions` | anon | ⬜ unconsumed — `components/marketing/actions.ts`'s `searchSuggestionsAction` reimplements this client-side against the mock catalog instead |
| GET | `marketplace/products/{productId:guid}/similar` | anon | ⬜ unconsumed |
| GET | `marketplace/products/{productId:guid}/recommendations` | anon | ⬜ unconsumed |
| POST | `marketplace/products/{productId:guid}/views` | anon | ⬜ unconsumed (no view-tracking beacon exists) |
| GET | `marketplace/brands` | anon | ⬜ `lib/api/brands.ts`'s `listBrands()` is mock-only |
| GET | `marketplace/categories` | anon | ⬜ `lib/api/categories.ts` is mock-only |

### AI Assistant — `api/v1/assistant/*`

| Verb | Route | Access | Frontend status |
|---|---|---|---|
| POST | `assistant/search` | anon | ⬜ `lib/api/intent-search.ts` (backs `components/buyer/intent-search-chat.tsx`) is entirely mock-templated — this is the real one-shot version |
| POST | `assistant/conversations` | auth | ⬜ unconsumed — no multi-turn conversation UI exists yet |
| GET | `assistant/conversations` | auth | ⬜ unconsumed |
| GET | `assistant/conversations/{id:guid}` | auth | ⬜ unconsumed |
| POST | `assistant/conversations/{id:guid}/turns` | auth | ⬜ unconsumed |
| POST | `.../turns/{turnId:guid}/stop` | auth | ⬜ unconsumed |
| POST | `.../turns/{turnId:guid}/retry` | auth | ⬜ unconsumed |
| DELETE | `assistant/conversations/{id:guid}` | auth | ⬜ unconsumed |
| PUT | `assistant/conversations/{id:guid}/title` | auth | ⬜ unconsumed |
| — | `hubs/v1/assistant` (SignalR) | auth | ⬜ streaming turn output — not a REST call, needs a SignalR client if the multi-turn UI gets built |

### Users — Vendor — `api/v1/users/vendors/*`

| Verb | Route | perm | Frontend status |
|---|---|---|---|
| POST | `users/vendors` | Vendors.Create | 🟢 `lib/api/vendor-profile.ts` `createVendorProfile()` |
| PUT | `users/vendors` | Vendors.Update | 🟢 `updateVendorProfile()` (check it's actually called somewhere — vendor-apply-wizard.tsx only calls create) |
| GET | `users/vendors` | Vendors.Read | 🟢 `getVendorProfile()` |
| PUT | `users/vendors/contact` | Vendors.Update | ⬜ unconsumed |
| PUT | `users/vendors/logo` | Vendors.Update | ⬜ unconsumed — no business-logo upload UI |
| POST | `users/vendors/settlement-accounts` | Vendors.Create | 🟢 `addSettlementAccount()` |
| GET | `users/vendors/settlement-accounts` | Vendors.Read | ⬜ unconsumed (payouts page shows mock accounts) |
| PUT | `.../settlement-accounts/{id}/default` | Vendors.Update | 🟢 `setMockDefaultSettlementAccount` equivalent exists mock-side; live call unconsumed |
| POST | `users/vendors/documents` | Vendors.Update | 🟢 `beginDocumentUpload()` |
| PUT | `users/vendors/documents` | Vendors.Update | 🟢 `completeDocumentUpload()` |
| GET | `users/vendors/documents` | Vendors.Read | ⬜ unconsumed |
| DELETE | `users/vendors/documents/{documentId}` | Vendors.Update | ⬜ unconsumed |
| GET | `.../documents/{documentId}/download-url` | Vendors.Read | ⬜ unconsumed |
| GET | `users/vendors/brands` | Products.Create | ⬜ unconsumed — brand-picker dropdown for the product wizard |
| GET | `users/vendors/categories` | Products.Create | ⬜ unconsumed — category-picker dropdown |
| POST | `users/vendors/products/drafts` | Products.Create | ⬜ mock-only equivalent (`createVendorProductDraft`) — real flow needs the multi-step draft below (§2.5) |
| GET | `users/vendors/products/drafts` | Products.Read | ⬜ unconsumed |
| GET | `users/vendors/products/drafts/{productId:guid}` | Products.Read | ⬜ unconsumed |
| PUT | `.../products/{productId:guid}/basic-info` | Products.Update | ⬜ unconsumed |
| PUT | `.../products/{productId:guid}/descriptions` | Products.Update | ⬜ unconsumed |
| PUT | `.../products/{productId:guid}/media` | Products.Update | ⬜ unconsumed |
| PUT | `.../products/{productId:guid}/origin` | Products.Update | ⬜ unconsumed |
| POST | `users/vendors/products/images` | Products.Create | ⬜ unconsumed — real multi-image upload; today's new multi-image UI (`new-product-wizard.tsx`) stores data-URLs in the mock store instead |
| POST | `.../products/{productId:guid}/certifications` | Products.Update | ⬜ unconsumed |
| POST | `users/vendors/products/certifications/complete` | Products.Update | ⬜ unconsumed |
| POST | `.../products/{productId:guid}/submit` | Products.Create | ⬜ unconsumed |
| GET | `users/vendors/products` | Products.Read | 🟡 rough mock equivalent of `listProductsForVendor()` — real one is *published products*, distinct from drafts |
| GET | `users/vendors/products/{productId:guid}` | Products.Read | ⬜ unconsumed |
| GET | `users/vendors/products/match-suggestions` | Products.Search | ⬜ unconsumed — duplicate-product detection while drafting |
| GET | `users/vendors/certifications` | (n/a) | ⬜ unconsumed |
| GET | `.../certifications/{id:guid}/download-url` | Products.Read | ⬜ unconsumed |
| GET | `users/vendors/offers` | Offers.Read | ⬜ **this is the real "my listings" endpoint** — price/stock/condition per product, what `lib/api/vendor-products.ts` should ultimately read instead of/alongside Products |
| GET | `users/vendors/offers/{offerId:guid}` | Offers.Read | ⬜ unconsumed |
| POST | `.../offers/{offerId:guid}/submit-for-review` | Offers.Update | ⬜ unconsumed |
| PUT | `.../offers/{offerId:guid}/stock` | Offers.Update | ⬜ unconsumed |
| POST | `.../offers/{offerId:guid}/restock` | Offers.Update | 🟡 mock equivalent exists (`restockVendorProduct`) against the wrong entity (Product, not Offer) |
| POST | `.../offers/{offerId:guid}/volume-tiers` | Offers.Update | ⬜ unconsumed |
| PUT/DELETE | `.../volume-tiers/{id:guid}` | Offers.Update | ⬜ unconsumed |
| POST | `.../offers/{offerId:guid}/discounts` | Offers.Update | ⬜ unconsumed |
| POST | `.../discounts/{id:guid}/deactivate` | Offers.Update | ⬜ unconsumed |
| DELETE | `.../discounts/{id:guid}` | Offers.Update | ⬜ unconsumed |
| POST | `.../offers/{offerId:guid}/certifications` | Offers.Update | ⬜ unconsumed |
| GET | `users/vendors/fulfillments` | Fulfillments.Read | ⬜ mock equivalent exists but not matching this shape |
| POST | `.../fulfillments/{id:guid}/accept` | Fulfillments.Update | ⬜ unconsumed |
| POST | `.../fulfillments/{id:guid}/pack` | Fulfillments.Update | ⬜ unconsumed |
| POST | `.../fulfillments/{id:guid}/ship` | Fulfillments.Update | ⬜ unconsumed |

### Users — Customer — `api/v1/users/customers/*`

| Verb | Route | perm | Frontend status |
|---|---|---|---|
| GET | `users/customers/cart` | anon (guest cart, §2.7) | ⬜ `lib/api/cart.ts` is entirely client-side/mock (`lib/cart/store.tsx`) |
| POST | `users/customers/cart` | anon | ⬜ unconsumed |
| PATCH | `users/customers/cart/items/{itemId:guid}` | anon | ⬜ unconsumed |
| DELETE | `users/customers/cart/items/{itemId:guid}` | anon | ⬜ unconsumed |
| DELETE | `users/customers/cart` | anon | ⬜ unconsumed |
| POST | `users/customers/cart/claim` | auth | ⬜ unconsumed — should be called right after login/register, see §2.7 |
| POST | `users/customers/checkout/quote` | auth | ⬜ unconsumed — real price/fee/tax breakdown before placing an order |
| POST | `users/customers/checkout` | auth | ⬜ **PlaceOrder** — `lib/api/buyer-orders.ts`'s checkout is entirely mock |
| GET | `.../orders/{orderId:guid}/payment` | Customers.Read | ⬜ unconsumed |
| GET | `.../orders/{orderId:guid}/fulfillments` | Fulfillments.Read | ⬜ unconsumed |
| GET | `users/customers/fulfillments/{id:guid}` | Fulfillments.Read | ⬜ unconsumed |
| POST | `.../orders/{orderId:guid}/returns` | Fulfillments.Create | ⬜ unconsumed — no return-request UI exists |
| POST | `users/customers/profile` | Customers.Create | ⬜ unconsumed — check if this needs calling right after buyer registration |
| GET | `users/customers/profile` | Customers.Read | ⬜ unconsumed |
| PUT | `users/customers/profile` | Customers.Update | ⬜ unconsumed |
| POST | `users/customers/addresses` | Customers.Create | 🟡 mock equivalent (`lib/api/buyer-profile.ts`'s delivery address) is a single address, not a full address book |
| GET | `users/customers/addresses` | Customers.Read | 🟡 same gap |
| GET | `.../addresses/{id:guid}` | Customers.Read | ⬜ unconsumed |
| PUT | `.../addresses/{id:guid}` | Customers.Update | ⬜ unconsumed |
| DELETE | `.../addresses/{id:guid}` | Customers.Update | ⬜ unconsumed |
| PUT | `.../addresses/{id:guid}/default-shipping` | Customers.Update | ⬜ unconsumed |
| PUT | `.../addresses/{id:guid}/default-billing` | Customers.Update | ⬜ unconsumed |

### User Profile (any account type) — `api/v1/users/me*`

| Verb | Route | Access | Frontend status |
|---|---|---|---|
| PUT | `users/me` | auth | ⬜ unconsumed — buyer/vendor settings pages show read-only name/email today because "no update-profile endpoint exists"; **it does now** |
| PUT | `users/me/avatar` | auth | ⬜ unconsumed |

### Payments — `api/v1/payments/*`

| Verb | Route | Access | Frontend status |
|---|---|---|---|
| POST | `payments/webhooks/monnify` | anon (webhook, backend-only) | n/a — this is Monnify calling the backend directly, never called from this frontend |

Related, not yet checked in this pass: `GetCustomerPaymentStatus` (listed above under
Customer) is the read side a checkout success/pending page would poll.

### Administration (Staff/admin accounts only) — `api/v1/admin/*`

| Verb | Route | perm | Frontend status |
|---|---|---|---|
| GET | `admin/staff` | Staff.List | 🟢 `lib/api/admin/staff.ts` `listStaff()` |
| POST | `admin/staff` | Staff.Manage | 🟢 `createStaff()` — note: real perm is `Manage`, not a `Create`-specific one |
| GET | `admin/audit` | AuditLogs.List | 🟡 `lib/api/admin/audit.ts` — wrong path (`/admin/audit-logs`), see §2.4 |
| GET | `admin/vendors` | Vendors.List | 🟢 `lib/api/admin/vendors.ts` `listVendors()` |
| GET | `admin/vendors/dropdown` | Vendors.List | ⬜ unconsumed |
| GET | `admin/vendors/{vendorId}` | Vendors.Manage | 🟢 `getVendorDetails()` |
| POST | `admin/vendors/{vendorId}/under-review` | Vendors.Manage | 🟢 `markVendorUnderReview()` |
| POST | `admin/vendors/{vendorId}/approve` | Vendors.Manage | 🟢 `approveVendor()` |
| POST | `admin/vendors/{vendorId}/reject` | Vendors.Manage | 🟢 `rejectVendor()` |
| GET | `.../{vendorId}/settlement-accounts` | Vendors.Manage | ⬜ unconsumed |
| GET | `.../settlement-accounts/default` | Vendors.Manage | ⬜ unconsumed |
| GET | `.../{vendorId}/documents` | Vendors.Manage | 🟢 `lib/api/admin/vendor-documents.ts` `listVendorDocuments()` |
| GET | `.../documents/{documentId}/download-url` | Vendors.Manage | ⬜ unconsumed — vendor-review UI serves the mock-upload placeholder instead |
| GET | `admin/roles` | Roles.List | 🟢 `lib/api/admin/roles.ts` `listRoles()` |
| GET | `admin/roles/{roleId}` | Roles.Manage | 🟢 `getRoleDetails()` |
| GET | `admin/roles/dropdown` | Roles.List | ⬜ unconsumed |
| GET | `admin/brands` | Brands.List | ⬜ `lib/api/brands.ts` is mock-only; this is the admin CRUD side of it |
| POST/PUT | `admin/brands`, `admin/brands/{id:guid}` | Brands.Manage | ⬜ unconsumed |
| GET | `admin/brands/{id:guid}` | Brands.Manage | ⬜ unconsumed |
| PUT | `admin/brands/{id:guid}/logo` | Brands.Manage | ⬜ unconsumed |
| POST | `admin/brands/{id:guid}/verify` | Brands.Manage | ⬜ unconsumed |
| POST | `admin/brands/{id:guid}/deactivate` | Brands.Manage | ⬜ unconsumed |
| GET | `admin/product-categories` | ProductCategories.List | ⬜ `lib/api/categories.ts` is mock-only; this is the admin CRUD side |
| GET | `.../{id:guid}` | ProductCategories.Manage | ⬜ unconsumed |
| POST/PUT | `admin/product-categories[/{id:guid}]` | ProductCategories.Manage | ⬜ unconsumed |
| POST | `.../{id:guid}/activate` \| `/deactivate` | ProductCategories.Manage | ⬜ unconsumed |
| GET | `admin/products` | Products.List | 🟢 `lib/api/admin/products.ts` `listAdminProducts()` |
| GET | `admin/products/{id:guid}` | Products.Read | 🟢 `getAdminProductDetails()` |
| GET | `.../{id:guid}/duplicates` | Products.List | ⬜ unconsumed |
| GET | `.../merge-preview/{targetId:guid}` | Products.Read | ⬜ unconsumed |
| POST | `.../{sourceId:guid}/merge` | Products.Manage | ⬜ unconsumed |
| POST | `admin/products/{id:guid}/approve` | Products.Manage | 🟢 `approveAdminProduct()` |
| POST | `admin/products/{id:guid}/reject` | Products.Manage | 🟢 `rejectAdminProduct()` |
| POST | `.../product-certifications/{id:guid}/approve` \| `/reject` | Certifications.Manage | ⬜ unconsumed |
| POST | `.../offer-certifications/{id:guid}/approve` \| `/reject` | Certifications.Manage | ⬜ unconsumed |
| GET | `admin/certifications/{id:guid}/download-url` | Certifications.Manage | ⬜ unconsumed |
| GET | `admin/offers` | Offers.List | ⬜ unconsumed — **no "Offers" concept exists in the admin frontend at all**, see §2.5 |
| GET | `admin/offers/{id:guid}` | Offers.Read | ⬜ unconsumed |
| POST | `admin/offers/{id:guid}/approve` \| `/reject` | Offers.Manage | ⬜ unconsumed |
| GET | `admin/fulfillments/{id:guid}` | Fulfillments.Manage | ⬜ unconsumed |
| POST | `.../{id:guid}/receive` | Fulfillments.Manage | ⬜ unconsumed |
| POST | `admin/customer-fulfillments/{id:guid}/allocate` \| `/pack` \| `/ship` \| `/confirm-delivery` | Fulfillments.Manage | ⬜ unconsumed — **no admin Fulfillments UI exists at all**; `app/admin/orders` shows mock order data, not this |
| POST | `admin/returns/{id:guid}/review` \| `/receive` \| `/inspect` \| `/refund` | Fulfillments.Manage | ⬜ unconsumed — **no admin Returns UI exists** |
| POST | `admin/returns/{id:guid}/refund/status` | Fulfillments.Manage | ⬜ unconsumed |

**Admin surfaces with real backend endpoints but no frontend adapter/UI at all:**
Offers moderation, admin Fulfillments, admin Returns, Brands CRUD, Product
Categories CRUD (the buyer-facing category list is mock-static today).

**Admin surfaces the frontend built (mock-only) with *no* matching backend
endpoint at all** — these were built ahead of the backend and need either a backend
addition or to stay mock/frontend-owned indefinitely:
`lib/api/admin/analytics.ts` (dashboard charts), `lib/api/admin/orders.ts`
(platform-wide order queue), `lib/api/admin/settlements.ts` (bulk vendor payout),
`lib/api/admin/transactions.ts` (ledger), `lib/api/admin/document-requirements.ts`
(the admin-configurable onboarding document requirements built this session).

---

## 4. Recommended integration order

Roughly ascending effort, each phase unblocked by the previous one.

**Done (2026-09-01):** the foundation phase — `lib/api/client.ts`'s `/api/v1` prefix
(§2.1), `lib/auth/session.ts`'s claim names (§2.3), the register/login body-shape
fixes (§2.2, §2.8) — verified end-to-end against a real local backend:
register → login → session cookies → `proxy.ts`/`dal.ts`'s JWT check → a real
protected page → `/auth/me`. `AUTH_DATA_SOURCE=live` works. Global
`JsonStringEnumConverter` (originally step 1 below) was **not** pursued — backend
changes are out of scope for this pass — so every other enum field still needs the
same one-by-one ordinal/case treatment §2.2's two fixes used, as each is exercised.

1. ~~**Backend**: register global `JsonStringEnumConverter`~~ — not done, out of
   scope (backend changes excluded from this pass). Every enum field the frontend
   touches needs its own explicit mapping instead — see §2.2.
2. ~~**Frontend**: fix `lib/api/client.ts`'s `/api/v1` prefix and
   `lib/auth/session.ts`'s claim names~~ — **done**, see above.
3. ~~**Frontend**: fix the two wrong paths and the admin permission verbs~~ —
   **done** (§2.4, §2.6, using the `perm:` column in §3 as the source of truth).
   `ADMIN_DATA_SOURCE=live` is code-ready for the parts with a live branch
   (vendors, staff, roles, products moderation) but **not yet run against the
   live backend** the way auth was — the response-shape caveats in §2.2 (enum
   fields, e.g. vendor/product status) likely still need per-field fixes the
   same way accountType did, just not yet hit and confirmed.
4. **Backend**: add a way for the frontend to know the current user's permissions
   (§2.6) — needed before `PERMISSIONS_SOURCE=live` can do anything but return
   `false` everywhere.
5. **Frontend, larger**: design the Product/Offer split into the buyer catalog and
   vendor product-wizard UI (§2.5) — this is real product/UX work, not a mechanical
   fix, and blocks `PRODUCTS_DATA_SOURCE=live` and most of the vendor Products/Offers
   endpoints above.
6. **Frontend, larger**: build real adapters for Cart/Checkout/Orders/Fulfillments/
   Returns (customer and vendor sides) — the backend now has all of this; today
   it's 100% mock (`lib/cart/store.tsx`, `lib/api/buyer-orders.ts`,
   `lib/api/vendor-orders.ts`, `lib/api/orders.ts`). Remember the guest-cart claim
   step (§2.7).
7. **Backend-or-accept-as-mock**: the admin Analytics/Orders/Settlements/
   Transactions/document-requirements surfaces have no backend counterpart —
   decide per-feature whether that's a backend gap to file or a frontend-only
   feature that stays mock permanently (document-requirements almost certainly
   the latter — it's config for a frontend-only wizard step).

---

## 5. Regenerating the endpoint inventory

The table in §3 was built by scanning every `Endpoints/**/*.cs` file in the backend
for its `app.Map{Verb}(...)` call, `.WithSummary(...)`, and
`.RequirePermission(VtlPermission.NameFor(ActionConstants.X, ResourceConstants.Y))`
(or `.AllowAnonymous()`). If the backend has moved since `0fe1fd3`, re-run something
equivalent to this from `vitalink-backend/src/Web.Api` before trusting the table
above over the source:

```bash
python3 - <<'EOF'
import re, glob
for f in sorted(glob.glob("Endpoints/**/*.cs", recursive=True)):
    if f.endswith(("Endpoints.cs", "IEndpoint.cs")):
        continue
    c = open(f, encoding="utf-8").read()
    verb = re.search(r'app\.Map(Get|Post|Put|Delete|Patch)\(\s*([A-Za-z0-9_.]+)', c)
    summary = re.search(r'\.WithSummary\("([^"]*)"\)', c)
    if verb:
        print(verb.group(1).upper(), verb.group(2), summary.group(1) if summary else "")
EOF
```
