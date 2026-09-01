import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { ADMIN_SOURCE } from "./data-source";
import {
  listMockOnboardingFields,
  updateMockOnboardingField,
  createMockOnboardingField,
  deleteMockOnboardingField,
} from "../mocks/admin-store";

/**
 * Admin config for the vendor onboarding wizard's "Compliance &
 * Verification" step (app/(auth)/vendor-apply/vendor-apply-wizard.tsx) —
 * what fields it asks for (text/number/document), whether each is required
 * or optional, and the description text a vendor sees for it. Started as a
 * fixed set of 3 hardcoded documents; admin can now add/remove custom
 * fields of any type too. No live endpoint exists for this yet (deferred
 * per "build the frontend now, review the backend later"), so the shape
 * here is this app's own — not inferred from a backend DTO.
 */

const DocumentTypeSchema = z.enum(["IsoCertification", "BusinessRegistration", "FdaRegistration", "NafdacRegistration", "Other"]);

export const ONBOARDING_FIELD_TYPES = ["text", "number", "document"] as const;
export type OnboardingFieldType = (typeof ONBOARDING_FIELD_TYPES)[number];

const OnboardingFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  type: z.enum(ONBOARDING_FIELD_TYPES),
  appliesTo: z.enum(["Manufacturer", "Distributor", "Both"]),
  documentTypes: z.array(DocumentTypeSchema).optional(),
  required: z.boolean(),
  enabled: z.boolean(),
});
export type OnboardingField = z.infer<typeof OnboardingFieldSchema>;

export async function listOnboardingFields(): Promise<OnboardingField[]> {
  if (ADMIN_SOURCE === "mock") {
    return z.array(OnboardingFieldSchema).parse(listMockOnboardingFields());
  }
  const { data } = await apiClient.get<unknown>("/admin/settings/onboarding-fields");
  return z.array(OnboardingFieldSchema).parse(data);
}

export async function updateOnboardingField(
  key: string,
  patch: { required?: boolean; enabled?: boolean },
): Promise<OnboardingField> {
  if (ADMIN_SOURCE === "mock") {
    return OnboardingFieldSchema.parse(updateMockOnboardingField(key, patch));
  }
  const { data } = await apiClient.put<unknown>(`/admin/settings/onboarding-fields/${key}`, { body: patch });
  return OnboardingFieldSchema.parse(data);
}

export interface CreateOnboardingFieldInput {
  label: string;
  description: string;
  type: OnboardingFieldType;
  appliesTo: "Manufacturer" | "Distributor" | "Both";
  required: boolean;
}

export async function createOnboardingField(input: CreateOnboardingFieldInput): Promise<OnboardingField> {
  if (ADMIN_SOURCE === "mock") {
    return OnboardingFieldSchema.parse(createMockOnboardingField(input));
  }
  const { data } = await apiClient.post<unknown>("/admin/settings/onboarding-fields", { body: input });
  return OnboardingFieldSchema.parse(data);
}

export async function deleteOnboardingField(key: string): Promise<void> {
  if (ADMIN_SOURCE === "mock") {
    deleteMockOnboardingField(key);
    return;
  }
  await apiClient.delete(`/admin/settings/onboarding-fields/${key}`);
}
