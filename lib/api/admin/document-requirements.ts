import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { ADMIN_SOURCE } from "./data-source";
import { listMockDocumentRequirements, updateMockDocumentRequirement } from "../mocks/admin-store";

/**
 * Admin config for the vendor onboarding compliance step — which documents
 * (app/(auth)/vendor-apply/vendor-apply-wizard.tsx's "Compliance &
 * Verification" step) are asked for at all, and whether each is required or
 * optional. No live endpoint exists for this yet (deferred per "build the
 * frontend now, review the backend later"), so the shape here is this app's
 * own — not inferred from a backend DTO.
 */

const DocumentTypeSchema = z.enum(["IsoCertification", "BusinessRegistration", "FdaRegistration", "NafdacRegistration", "Other"]);

const DocumentRequirementSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  appliesTo: z.enum(["Manufacturer", "Distributor"]),
  documentTypes: z.array(DocumentTypeSchema),
  required: z.boolean(),
  enabled: z.boolean(),
});
export type DocumentRequirement = z.infer<typeof DocumentRequirementSchema>;

export async function listDocumentRequirements(): Promise<DocumentRequirement[]> {
  if (ADMIN_SOURCE === "mock") {
    return z.array(DocumentRequirementSchema).parse(listMockDocumentRequirements());
  }
  const { data } = await apiClient.get<unknown>("/admin/settings/document-requirements");
  return z.array(DocumentRequirementSchema).parse(data);
}

export async function updateDocumentRequirement(
  key: string,
  patch: { required?: boolean; enabled?: boolean },
): Promise<DocumentRequirement> {
  if (ADMIN_SOURCE === "mock") {
    return DocumentRequirementSchema.parse(updateMockDocumentRequirement(key, patch));
  }
  const { data } = await apiClient.put<unknown>(`/admin/settings/document-requirements/${key}`, { body: patch });
  return DocumentRequirementSchema.parse(data);
}
