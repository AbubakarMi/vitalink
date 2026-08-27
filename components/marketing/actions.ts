"use server";

import { listProducts } from "@/lib/api/products";

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  categoryLabel?: string;
}

/** Powers the header/hero search dropdown's live suggestions — reuses the
 * same mock-catalog name search /products itself filters on, just capped
 * and reshaped for a dropdown instead of a full grid. */
export async function searchSuggestionsAction(query: string): Promise<SearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const products = await listProducts({ search: trimmed });
  return products.slice(0, 6).map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryLabel: product.categoryLabel,
  }));
}
