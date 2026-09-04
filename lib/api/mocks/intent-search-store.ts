import "server-only";
import { randomUUID } from "node:crypto";
import { findMockUserByEmail } from "./auth-store";
import type { Product } from "../products";

/**
 * Per-customer Intent Search chat sessions — in-memory, globalThis-pinned like
 * every other mock store in this app (survives Next dev-mode Fast Refresh,
 * not a real process restart). No chat/AI entity exists on the backend
 * (there is no backend AI integration at all) — this is a mocked feature
 * end-to-end, not a mock/live seam like products/orders.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Product ids the assistant is recommending alongside this message —
   * only ever set on "assistant" messages. */
  productIds?: string[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  /** The first user message, used as the list-view title (Frame
   * 2018776178.pdf's "Chats" list). */
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const globalForChats = globalThis as unknown as { __vitalinkCustomerChats?: Map<string, ChatSession[]> };
const chatsByCustomerId = globalForChats.__vitalinkCustomerChats ?? new Map<string, ChatSession[]>();
globalForChats.__vitalinkCustomerChats = chatsByCustomerId;

export function listChats(customerId: string): ChatSession[] {
  return [...(chatsByCustomerId.get(customerId) ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function seedMessage(role: ChatMessage["role"], content: string, productIds: string[] | undefined, at: string): ChatMessage {
  return { id: `msg_${randomUUID()}`, role, content, productIds, createdAt: at };
}

/** The seeded customer@vitalink.dev demo account otherwise has an empty Chats
 * list and no "Recent Searches" on first login — seeds one realistic
 * session from the real catalog, same reasoning as
 * customer-profile-store's seedDemoCustomerAddressOnce. Lazy (called from
 * listChatsForCustomer, not at module load) because it needs the real product
 * catalog, which "use cache" functions can only be called during a request,
 * not at module-evaluation time. */
export function seedDemoCustomerChatOnce(customerId: string, catalog: Product[]): void {
  const demoUser = findMockUserByEmail("customer@vitalink.dev");
  if (!demoUser || demoUser.userId !== customerId || chatsByCustomerId.has(customerId) || catalog.length === 0) {
    return;
  }
  const monitor = catalog.find((p) => p.categorySlug === "medical-equipment") ?? catalog[0];
  const now = Date.now();
  const askedAt = new Date(now - 2 * 86_400_000).toISOString();
  const answeredAt = new Date(now - 2 * 86_400_000 + 5_000).toISOString();
  const query = "Multi-parameter patient monitors under N300,000";
  const chat: ChatSession = {
    id: `chat_${randomUUID()}`,
    title: query,
    createdAt: askedAt,
    updatedAt: answeredAt,
    messages: [
      seedMessage("user", query, undefined, askedAt),
      seedMessage(
        "assistant",
        `I found 1 product within your ~N300,000 budget matching "${query}". ${monitor.badge ? `${monitor.name} carries ${monitor.badge} certification. ` : ""}Compare specs below, or ask a follow-up to narrow it down further.`,
        [monitor.id],
        answeredAt,
      ),
    ],
  };
  chatsByCustomerId.set(customerId, [chat]);
}

export function getChat(customerId: string, chatId: string): ChatSession | undefined {
  return chatsByCustomerId.get(customerId)?.find((chat) => chat.id === chatId);
}

function truncateTitle(text: string): string {
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

export function createChat(customerId: string, firstUserMessage: string): ChatSession {
  const now = new Date().toISOString();
  const chat: ChatSession = {
    id: `chat_${randomUUID()}`,
    title: truncateTitle(firstUserMessage),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const chats = chatsByCustomerId.get(customerId) ?? [];
  chats.push(chat);
  chatsByCustomerId.set(customerId, chats);
  return chat;
}

export function appendMessage(
  customerId: string,
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt">,
): ChatSession {
  const chat = getChat(customerId, chatId);
  if (!chat) {
    throw new Error(`Chat ${chatId} not found for customer ${customerId}`);
  }
  chat.messages.push({ ...message, id: `msg_${randomUUID()}`, createdAt: new Date().toISOString() });
  chat.updatedAt = new Date().toISOString();
  return chat;
}
