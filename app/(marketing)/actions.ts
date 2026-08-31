"use server";

import { submitContactMessage, submitQuoteRequest } from "@/lib/api/support";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function submitContactMessageAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !subject || !message) {
    return { error: "Please fill in every field." };
  }

  try {
    await submitContactMessage({ name, email, subject, message });
    return { success: true };
  } catch {
    return { error: "Something went wrong sending your message. Please try again." };
  }
}

export async function submitQuoteRequestAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const equipmentNeeded = String(formData.get("equipmentNeeded") ?? "").trim();
  const quantity = String(formData.get("quantity") ?? "").trim();
  const timeline = String(formData.get("timeline") ?? "").trim();

  if (!name || !email || !phone || !organization || !equipmentNeeded) {
    return { error: "Please fill in every required field." };
  }

  try {
    await submitQuoteRequest({
      name,
      email,
      phone,
      organization,
      equipmentNeeded,
      quantity: quantity || undefined,
      timeline: timeline || undefined,
    });
    return { success: true };
  } catch {
    return { error: "Something went wrong submitting your request. Please try again." };
  }
}
