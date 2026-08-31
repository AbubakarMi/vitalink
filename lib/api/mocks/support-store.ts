import "server-only";
import { randomUUID } from "node:crypto";

/**
 * In-memory stand-in for a support/CRM backend — no such endpoint exists
 * yet (confirmed against vitalink-backend's source tree), so this is
 * mock-only, no ADMIN_DATA_SOURCE-style live branch to eventually flip to
 * (same idiom as lib/api/admin/orders.ts). Same globalThis-pinning as the
 * other mock stores so Next dev/Turbopack module re-evaluation doesn't wipe
 * submissions mid-session — see docs/MOCK_AUTH.md.
 */

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  equipmentNeeded: string;
  quantity: string | null;
  timeline: string | null;
  submittedAt: string;
}

const globalForSupport = globalThis as unknown as {
  __vitalinkContactMessages?: ContactMessage[];
  __vitalinkQuoteRequests?: QuoteRequest[];
};

const contactMessages = globalForSupport.__vitalinkContactMessages ?? [];
globalForSupport.__vitalinkContactMessages = contactMessages;

const quoteRequests = globalForSupport.__vitalinkQuoteRequests ?? [];
globalForSupport.__vitalinkQuoteRequests = quoteRequests;

export function saveMockContactMessage(input: Omit<ContactMessage, "id" | "submittedAt">): ContactMessage {
  const record: ContactMessage = { ...input, id: randomUUID(), submittedAt: new Date().toISOString() };
  contactMessages.unshift(record);
  return record;
}

export function saveMockQuoteRequest(input: Omit<QuoteRequest, "id" | "submittedAt">): QuoteRequest {
  const record: QuoteRequest = { ...input, id: randomUUID(), submittedAt: new Date().toISOString() };
  quoteRequests.unshift(record);
  return record;
}
