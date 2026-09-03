Backend notes — Sept 3

Two things from testing the address book against a real login today.

**1. Saving a customer's first address crashes.**
A new customer's first address always becomes their default, and saving it 500s every time. Looks like a save-order bug — you insert the new address and point the profile's default-address field at it in the same save, but the address row isn't committed yet when Postgres checks that foreign key, so it fails. Only reproduced it on add, but update and set-default probably hit the same thing since it's the same pattern.

**2. Registering a customer doesn't create their profile.**
Signup only creates the login. Any customer endpoint 404s right after that until `POST users/customers/profile` gets called separately. We're calling it ourselves right after login for now, but flagging it in case that's not how it's meant to work — feels like something register should just do.

One more, not blocking us: local Zitadel has no SMTP set up, so verification emails never actually send. Just noting it.
