import "server-only";
import { saveMockContactMessage, saveMockQuoteRequest } from "./mocks/support-store";

/**
 * Contact Us / Request a Quote submissions — no backend support/CRM
 * endpoint exists yet, so this is mock-only for now (lib/api/mocks/
 * support-store.ts), the same approach as lib/api/admin/orders.ts. Swap in
 * a real POST here once a backend endpoint exists.
 */

export interface SubmitContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactMessage(input: SubmitContactMessageInput) {
  return saveMockContactMessage(input);
}

export interface SubmitQuoteRequestInput {
  name: string;
  email: string;
  phone: string;
  organization: string;
  equipmentNeeded: string;
  quantity?: string;
  timeline?: string;
}

export async function submitQuoteRequest(input: SubmitQuoteRequestInput) {
  return saveMockQuoteRequest({
    ...input,
    quantity: input.quantity ?? null,
    timeline: input.timeline ?? null,
  });
}
