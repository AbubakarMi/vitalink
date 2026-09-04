# Mock auth & vendor onboarding

This app can run the full signup → login → dashboard journey, for all three
roles, without the .NET backend or Zitadel running at all. That's the point
of this doc: what's mocked, how to log in, and exactly how to switch back to
the real backend once it's available.

## Why this exists

`lib/api/products.ts` already had a mock/real seam (`PRODUCTS_DATA_SOURCE`)
because the backend doesn't have a Product API yet — see the README's "The
mock/real data-layer seam" section. Auth and vendor onboarding *do* have real
backend endpoints, but requiring Postgres + Redis + Zitadel just to click
through the frontend is a heavy ask for day-to-day UI work. `AUTH_DATA_SOURCE`
and `VENDOR_PROFILE_DATA_SOURCE` extend the same pattern to those two
adapters, so the whole app is click-through-able on `npm run dev` with zero
external dependencies.

## What's mocked

| Env var | Adapter | Mock implementation |
|---|---|---|
| `AUTH_DATA_SOURCE` | `lib/api/auth.ts` | `lib/api/mocks/auth-store.ts` — in-memory user store |
| `VENDOR_PROFILE_DATA_SOURCE` | `lib/api/vendor-profile.ts` | `lib/api/mocks/vendor-profile-store.ts` — in-memory KYC store |

Both default to `"mock"` (see `.env.example`). Every other adapter that was
already mocked (products, cart, orders, reviews, categories) is unaffected by
this change.

Sessions are real: the mock store mints actual signed JWTs with
`AUTH_JWT_SIGNING_KEY` via `jose`, so `lib/auth/session.ts`, `lib/auth/dal.ts`,
and `proxy.ts` verify mock sessions exactly like they'd verify a real one —
none of that code has a mock-specific branch.

## Seeded demo accounts

The mock user store seeds these on first use (see `seedDemoUsersOnce()` in
`lib/api/mocks/auth-store.ts`). Password for all three is `Password1!`.

| Email | Role | Lands on |
|---|---|---|
| `customer@vitalink.dev` | Customer | `/customer/dashboard` |
| `vendor@vitalink.dev` | Vendor | `/vendor/dashboard` |
| `staff@vitalink.dev` | Staff | `/admin/dashboard` |

You can also register a brand-new account through `/register/customer` or
`/register/vendor` — it's added to the same in-memory store and can log in
immediately afterward.

## Known limitations (accepted, not bugs)

- **State doesn't survive a server restart.** The store is a plain in-memory
  `Map`, not a database. Restarting `next dev`/`next start` resets everything
  back to the three seeded accounts above. Don't treat this as a persistence
  layer for demos that need to survive a redeploy.
- **Email is auto-verified on register.** The frontend has no verify-email
  page or action yet (only `register`, `login`, and session functions are
  wired in `lib/api/auth.ts`), so requiring a real verification step would be
  a dead end. `verificationEmailSent: true` is still returned so the existing
  "check your email" UI in `register-form.tsx` renders as designed.
  `RESEND_VERIFICATION`/forgot-password/reset-password/MFA-setup endpoints
  exist on the backend but have no frontend adapter or UI yet either — out of
  scope for this mock, same as for the live backend today.
- **MFA always reports not required.** No mock user carries a second factor,
  so `login()` always completes outright. `loginTotp`/`loginStartOtpEmail`/
  `loginVerifyOtpEmail`/`resendLoginOtpEmail` throw a clear "not modeled in
  mock mode" error if ever called — they're unreachable from the current UI
  (`login-form.tsx` already tells the user MFA isn't available in this
  preview, live backend or not) but are implemented honestly rather than
  silently no-op'ing in case future code calls them directly.
- **Passwords are compared in plaintext, in memory.** Fine for a local mock,
  never for anything real — see the production build guard below.
- **Vendor documents aren't really stored anywhere durable.** The browser does
  a real PUT (`document-upload-field.tsx` never proxies the file through a
  Server Action, live or mock) to `/api/mock-uploads/[documentId]` (see
  `app/api/mock-uploads/[documentId]/route.ts`), which accepts and discards
  the bytes; `completeDocumentUpload` just flips a boolean in the mock store.
  The wizard's UX flow (select file → "uploaded" state → continue) works
  end-to-end, but nothing is retrievable afterward.
- **Vendor verification status is auto-set to `Verified` on profile
  creation.** The real backend's status transitions
  (`Pending → UnderReview → Verified/Rejected`) are admin-initiated only
  (`lib/api/admin/vendors.ts`, which is still live-only, not mocked) — the
  mock doesn't attempt to fake an admin approval workflow. Without
  auto-verifying, a mock vendor could complete the wizard but would never
  pass `app/vendor/layout.tsx`'s Verified-status gate, making
  `/vendor/dashboard` (and everything behind it) permanently unreachable in
  mock mode — so this is the same "make the whole journey click-through-able"
  reasoning that already auto-verifies email.
- **Admin's vendor/staff/role management (`lib/api/admin/*.ts`) is still
  live-only.** The `staff@vitalink.dev` seed account gets you into
  `/admin/dashboard`, but pages that call those adapters still need
  `BACKEND_ORIGIN` reachable. Only auth and vendor onboarding were in scope
  for this pass.

## Production safety

Both `lib/api/auth.ts` and `lib/api/vendor-profile.ts` throw at module load if
their `_DATA_SOURCE` is still `"mock"` when `NODE_ENV=production` — same
pattern as `lib/auth/permissions.ts`'s `PERMISSIONS_SOURCE` guard. A
production build cannot silently ship the mock store.

### Demo/preview deploys with no live backend yet

Set `ALLOW_MOCK_IN_PRODUCTION=true` (as a platform env var — Netlify site
settings, Vercel project env vars, etc., never committed to the repo) to let a
production build proceed anyway with all three data sources still mocked.
This exists for exactly one case: a throwaway demo/preview deploy (e.g. a
Netlify link to show a working UI) where there's no real backend to point at
yet and no real user data at risk. It must never be set on an actual
production deployment — the plaintext-password mock user store and the
open-permission stub are the reasons the guards exist in the first place.

## Switching to the live backend

Once the .NET backend is up (`docker compose up` + `dotnet run` in
`vitalink-backend`, or a deployed environment):

```bash
BACKEND_ORIGIN=http://localhost:5000   # or wherever it's running
AUTH_JWT_SIGNING_KEY=<same value as the backend's JwtOptions.SigningKey>
AUTH_JWT_ISSUER=<match the backend, if it sets one>
AUTH_JWT_AUDIENCE=<match the backend, if it sets one>
AUTH_DATA_SOURCE=live
VENDOR_PROFILE_DATA_SOURCE=live
```

That's it — no code changes. Every caller (`Server Actions`, `Server
Components`, `proxy.ts`) already goes through the adapters in `lib/api/auth.ts`
and `lib/api/vendor-profile.ts`; flipping the env vars is the one-file-change
the README promises for this seam. If a real response doesn't match the
Zod-validated shape those adapters expect, Zod throws immediately in dev
instead of failing silently later — flag and fix the schema at that point
rather than assuming the mock's shape was ever a documented contract with the
backend team.
