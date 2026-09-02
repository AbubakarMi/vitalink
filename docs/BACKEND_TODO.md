<!-- Title -->
# What frontend needs from backend

Simple version. Tested live 2026-09-02.

## Heads up — one thing we already worked around

On every list endpoint (vendors, staff, products, categories, etc.), the
`PageNumber`, `PageSize`, and `OrderBy` query params all have default values
in the C# code, but the server still rejects the request with a 400 if you
don't send them. So the defaults don't actually work — we just always send
all three now. Not blocking us, just flagging it in case it's not what you
intended.

## Bugs to fix

1. **Login with authenticator app (TOTP) doesn't work.**
   Setting up the authenticator (scanning the QR code) works fine. But when
   the user enters the correct code to finish logging in, it fails every
   time with a server error. So right now, nobody can actually log in using
   an authenticator app.
   File: `ZitadelMfaService.LoginTotpAsync`

2. **Wrong codes crash the server instead of just saying "wrong code."**
   If someone types the wrong 6-digit code (login code, signup code, or
   password reset code), the server crashes with a 500 error instead of a
   normal "that code is wrong, try again" message. This happens in 4 places:
   - Login with TOTP code
   - Confirming authenticator setup
   - Resetting password
   - Verifying email
   Fix: catch the error properly and return a normal error message instead
   of crashing.

## Things frontend needs that don't exist yet

3. **Check if an email is already used, before signup.**
   We want to show a green tick or red X while someone is typing their
   email on the signup form, so they know right away if that email is
   already taken. We need a simple endpoint for this — just checks, doesn't
   create anything.

4. **A way to know if a user has authenticator app turned on.**
   Right now there's no way to ask "does this user have TOTP enabled?" We
   need this so the settings page can show the correct state.

## What's already working well

Register, login, get current user, refresh session, logout, logout from all
devices, forgot password, resend verification email, starting authenticator
setup (QR code + secret), and the admin pages for Vendors, Staff/Users,
Product Categories, and the Audit log — all confirmed working now.

## Older, already-known items (not new)

- No endpoint yet for checking permissions.
- **Admin product list (`admin/products`) has no `price` on it at all.**
  We already knew Product and Offer are separate things on the backend, but
  we confirmed this specific gap now: the product list response really has
  no price field, so we can't show one. Needs a real conversation about how
  Product/Offer should map to what admins see, not a quick fix.
- No endpoint to list all buyers/customers for admin.
