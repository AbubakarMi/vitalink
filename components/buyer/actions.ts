"use server";

import { askIntentSearch, type ChatSession } from "@/lib/api/intent-search";
import { ApiError } from "@/lib/api/client";
import type { Product } from "@/lib/api/products";

export interface ActionResult<T> {
  data?: T;
  error?: string;
}

export async function askIntentSearchAction(
  query: string,
  chatId?: string,
): Promise<ActionResult<{ chat: ChatSession; products: Product[] }>> {
  try {
    const result = await askIntentSearch(query, chatId);
    return { data: result };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Couldn't process that search." };
  }
}
