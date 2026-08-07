// Shared between the server-only products adapter and client components
// (SortDropdown) — no "server-only" marker here, unlike lib/api/products.ts,
// since client code needs to import these plain constants/types directly.
export const SORT_OPTIONS = {
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
} as const;
export type SortOption = keyof typeof SORT_OPTIONS;
