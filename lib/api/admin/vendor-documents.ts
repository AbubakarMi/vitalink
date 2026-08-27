import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { ADMIN_SOURCE } from "./data-source";
import { listMockVendorDocuments } from "../mocks/admin-store";

/**
 * Admin vendor-document adapter — real endpoints
 * (Web.Api/Endpoints/Administration/Vendors/GetVendorDocuments.cs,
 * GetVendorDocumentDownloadUrl.cs), backing the Vendor Application review
 * modal's "Compliance" tab (super admin/Vendor Application Business
 * Profile (1).pdf — "Documents download").
 *
 * Shape inferred from the mockup, not yet checked against the backend's
 * actual response DTO (deferred per "build the frontend now, review the
 * backend later").
 */

const VendorDocumentSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean().optional(),
  uploaded: z.boolean().optional(),
  fileName: z.string().nullable().optional(),
  previewUrl: z.string().nullable().optional(),
  downloadUrl: z.string().nullable().optional(),
});
export type VendorDocument = z.infer<typeof VendorDocumentSchema>;

/** Each document carries its own previewUrl/downloadUrl (mock mode: the
 * discard-the-bytes mock upload endpoint's GET handler, app/api/mock-uploads/
 * [documentId]/route.ts) rather than a separate lookup call per document. */
export async function listVendorDocuments(vendorId: string) {
  if (ADMIN_SOURCE === "mock") {
    return z.array(VendorDocumentSchema).parse(listMockVendorDocuments(vendorId));
  }
  const { data } = await apiClient.get<unknown>(`/admin/vendors/${vendorId}/documents`);
  return z.array(VendorDocumentSchema).parse(data);
}
