import "server-only";
import { ApiError } from "./client";
import { verifySession } from "@/lib/auth/dal";
import { listProducts, type Product } from "./products";
import { listChats, getChat, createChat, appendMessage, seedDemoCustomerChatOnce, type ChatSession } from "./mocks/intent-search-store";

export type { ChatSession, ChatMessage } from "./mocks/intent-search-store";

/**
 * Intent Search — a conversational product-discovery assistant. There is no
 * real AI/LLM integration anywhere in this app; this is a deterministic
 * keyword matcher against the real mock product catalog, not a model call
 * (round-1 scope decision, same reasoning as the vendor wizard's
 * "Generate details"). Answers are scoped to product discovery only — the
 * reference mockups implied clinical/lab-result analysis capability this
 * app doesn't have, which would be actively misleading to simulate, so the
 * assistant here only ever talks about matching catalog products.
 */

async function currentCustomerId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

export async function listChatsForCustomer(): Promise<ChatSession[]> {
  const customerId = await currentCustomerId();
  seedDemoCustomerChatOnce(customerId, await listProducts());
  return listChats(customerId);
}

export async function getChatForCustomer(chatId: string): Promise<ChatSession | null> {
  const customerId = await currentCustomerId();
  return getChat(customerId, chatId) ?? null;
}

const STOPWORDS = new Set([
  "a", "an", "the", "for", "and", "or", "of", "to", "in", "on", "with", "i", "im", "my", "me", "need", "needs",
  "want", "looking", "what", "are", "is", "that", "this", "do", "does", "how", "can", "you", "please", "some",
  "any", "get", "buy", "find", "help", "which", "setups", "setup",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/** Recognizes "under N300,000" / "below 300k" / "budget of 300000" style
 * phrasing and pulls out a price ceiling — this is what actually backs the
 * "Filter by budget" capability shown on the empty state; without this,
 * that claim would be UI copy with nothing behind it. */
function extractBudget(query: string): number | null {
  const match = query.match(/(?:under|below|less than|within|budget(?:\s+of)?)\s*(?:n|₦)?\s?([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i);
  if (!match) return null;
  const raw = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return match[2] ? raw * 1000 : raw;
}

function scoreProduct(product: Product, queryWords: string[]): number {
  const name = product.name.toLowerCase();
  const brand = (product.brand ?? "").toLowerCase();
  const categoryLabel = (product.categoryLabel ?? product.categorySlug).toLowerCase();
  const description = product.shortDescription.toLowerCase();
  const useCases = (product.clinicalUseCases ?? []).join(" ").toLowerCase();

  let score = 0;
  for (const word of queryWords) {
    if (name.includes(word)) score += 3;
    if (categoryLabel.includes(word) || product.categorySlug.includes(word)) score += 2;
    if (brand.includes(word)) score += 2;
    if (useCases.includes(word)) score += 2;
    if (description.includes(word)) score += 1;
  }
  return score;
}

const FOLLOW_UP_OPENERS = [
  "Based on what you've told me so far, here's what I'd add:",
  "Narrowing that down against the catalog:",
];

function buildAnswer(query: string, matches: Product[], isFollowUp: boolean, budget: number | null): string {
  if (matches.length === 0) {
    return (
      `I couldn't find a close match for "${query}" in the current catalog. Here are a few popular, ` +
      "in-stock listings that might still be useful — try rephrasing with an equipment type or brand name for a tighter match."
    );
  }

  const opener = isFollowUp ? FOLLOW_UP_OPENERS[matches.length % FOLLOW_UP_OPENERS.length] : "";
  const categories = [...new Set(matches.map((p) => p.categoryLabel ?? p.categorySlug))];
  const categoryPhrase = categories.length === 1 ? ` in ${categories[0]}` : "";

  const topWithinBudget = budget !== null && matches[0].price <= budget;
  const budgetPhrase = budget === null ? "" : topWithinBudget ? ` within your ~N${budget.toLocaleString("en-NG")} budget` : "";
  const budgetMiss =
    budget !== null && !topWithinBudget
      ? ` Nothing matched came in under N${budget.toLocaleString("en-NG")} though — closest specs shown instead.`
      : "";

  return (
    `${opener ? `${opener} ` : ""}I found ${matches.length} product${matches.length === 1 ? "" : "s"}${categoryPhrase}` +
    `${budgetPhrase} matching "${query}".${budgetMiss} ` +
    `${matches[0].badge ? `${matches[0].name} carries ${matches[0].badge} certification. ` : ""}` +
    "Compare specs below, or ask a follow-up to narrow it down further."
  );
}

async function fallbackProducts(limit: number): Promise<Product[]> {
  const all = await listProducts();
  return all.filter((p) => p.inStock).slice(0, limit);
}

export interface AskIntentSearchResult {
  chat: ChatSession;
  products: Product[];
}

/** Asks a question, creating a new chat if chatId is omitted. Every call is
 * one round trip: append the user's message, generate + append the
 * assistant's reply, return the updated chat plus the recommended products
 * (looked up by id so the UI can render full cards, not just ids). */
export async function askIntentSearch(query: string, chatId?: string): Promise<AskIntentSearchResult> {
  const customerId = await currentCustomerId();
  const trimmed = query.trim();
  if (!trimmed) {
    throw new ApiError(400, "Ask a question first.");
  }

  const chat = chatId ? getChat(customerId, chatId) : undefined;
  if (chatId && !chat) {
    throw new ApiError(404, "Chat not found.");
  }
  const session = chat ?? createChat(customerId, trimmed);
  const isFollowUp = session.messages.length > 0;

  appendMessage(customerId, session.id, { role: "user", content: trimmed });

  const catalog = await listProducts();
  const queryWords = tokenize(trimmed);
  const budget = extractBudget(trimmed);
  const scored = catalog
    .map((product) => ({ product, score: scoreProduct(product, queryWords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (budget !== null) {
        const aWithin = a.product.price <= budget ? 0 : 1;
        const bWithin = b.product.price <= budget ? 0 : 1;
        if (aWithin !== bWithin) return aWithin - bWithin;
      }
      return b.score - a.score;
    });

  const hasMatches = scored.length > 0;
  const products = hasMatches ? scored.slice(0, 6).map((entry) => entry.product) : await fallbackProducts(3);
  // buildAnswer's "no match" copy is keyed off an empty array specifically —
  // products still holds the fallback suggestions shown in the UI, just not
  // described as "matches" in the generated text.
  const answer = buildAnswer(trimmed, hasMatches ? products : [], isFollowUp, budget);

  const updated = appendMessage(customerId, session.id, {
    role: "assistant",
    content: answer,
    productIds: products.map((p) => p.id),
  });

  return { chat: updated, products };
}
