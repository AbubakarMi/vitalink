/**
 * Split out of lib/api/addresses.ts on purpose — that module starts with
 * `import "server-only"`, which throws the moment anything importing it
 * (even just a plain runtime value, not a type) gets bundled into a Client
 * Component. components/buyer/address-book.tsx is a Client Component that
 * needs ADDRESS_LABELS as a real value (to populate a <select>), not just
 * the AddressLabel type (which, being type-only, would have been erased
 * and never actually bundled) — so it imports from here instead, and
 * lib/api/addresses.ts re-exports these for its own (server-side) callers.
 */
export const ADDRESS_LABELS = ["Home", "Office", "Department", "Other"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];
