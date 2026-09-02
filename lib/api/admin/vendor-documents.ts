import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { ADMIN_SOURCE } from "./data-source";
import { listMockVendorDocuments, getMockVendorDocumentUrl } from "../mocks/admin-store";

/**
 * Admin vendor-document adapter — real endpoints confirmed live (2026-09-02):
 * `GetVendorDocuments` (`admin/vendors/{vendorId}/documents`) returns
 * documents grouped by type — not a flat array carrying `required`/
 * `previewUrl`/`downloadUrl` the way this used to assume. There's no
 * "required but not yet uploaded" concept on this response at all (that's
 * the vendor's own onboarding-field answers, not cross-referenced by this
 * endpoint) — this only lists what was actually uploaded, so `required` is
 * mock-only here. Preview/download is a separate on-demand call
 * (`getVendorDocumentUrl`, → `GetVendorDocumentDownloadUrl`) since it's a
 * presigned URL that expires — not worth eagerly fetching one per document
 * up front the way the old mock-only shape did.
 */

const BASE = "/admin/vendors";

const VendorDocumentSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean().optional(),
  uploaded: z.boolean(),
  fileName: z.string().nullable().optional(),
});
export type VendorDocument = z.infer<typeof VendorDocumentSchema>;

const GetUploadedDocumentsResponseSchema = z.object({
  vendorId: z.string(),
  documents: z.array(
    z.object({
      documentType: z.string(),
      documents: z.array(
        z.object({
          id: z.string(),
          documentName: z.string(),
          documentFileName: z.string(),
          status: z.string(),
          createdAt: z.string(),
        }),
      ),
    }),
  ),
});

export async function listVendorDocuments(vendorId: string): Promise<VendorDocument[]> {
  if (ADMIN_SOURCE === "mock") {
    return z.array(VendorDocumentSchema).parse(listMockVendorDocuments(vendorId));
  }
  const { data } = await apiClient.get<unknown>(`${BASE}/${vendorId}/documents`);
  const parsed = GetUploadedDocumentsResponseSchema.parse(data);
  return parsed.documents.flatMap((group) =>
    group.documents.map((doc) => ({
      id: doc.id,
      label: doc.documentName,
      uploaded: true,
      fileName: doc.documentFileName,
    })),
  );
}

const DownloadUrlResponseSchema = z.object({ downloadUrl: z.string() });

export async function getVendorDocumentUrl(vendorId: string, documentId: string): Promise<string> {
  if (ADMIN_SOURCE === "mock") {
    return getMockVendorDocumentUrl(vendorId, documentId);
  }
  const { data } = await apiClient.get<unknown>(`${BASE}/${vendorId}/documents/${documentId}/download-url`);
  return DownloadUrlResponseSchema.parse(data).downloadUrl;
}
