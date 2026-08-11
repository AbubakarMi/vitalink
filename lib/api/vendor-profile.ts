import "server-only";
import { z } from "zod";
import { apiClient, ApiError } from "./client";
import {
  addMockDocument,
  addMockSettlementAccount,
  completeMockDocuments,
  getMockVendorProfile,
  setMockDefaultSettlementAccount,
  upsertMockBusinessProfile,
} from "./mocks/vendor-profile-store";
import { verifySession } from "@/lib/auth/dal";

/**
 * Self-service vendor onboarding/profile adapter — real endpoints (see
 * vitalink-backend Web.Api/Endpoints/Users/Vendor/*). There is no "submit for
 * review" endpoint: status transitions (Pending -> UnderReview -> Verified/
 * Rejected) are admin-initiated only (lib/api/admin/vendors.ts). The vendor-facing
 * UI is a completion checklist against this data, not a submit button — design
 * doc §4 (vendor KYC UI).
 *
 * VENDOR_PROFILE_DATA_SOURCE flips every function below between that live
 * backend and an in-memory mock (lib/api/mocks/vendor-profile-store.ts), same
 * seam as PRODUCTS_DATA_SOURCE/AUTH_DATA_SOURCE. See docs/MOCK_AUTH.md.
 */

const SOURCE = process.env.VENDOR_PROFILE_DATA_SOURCE ?? "mock";

if (SOURCE === "mock" && process.env.NODE_ENV === "production") {
  throw new Error(
    "VENDOR_PROFILE_DATA_SOURCE is still 'mock' in a production build. This fails the " +
      "build on purpose, mirroring AUTH_DATA_SOURCE's guard in lib/api/auth.ts. Set " +
      "VENDOR_PROFILE_DATA_SOURCE=live once the real backend is reachable. See docs/MOCK_AUTH.md.",
  );
}

async function currentMockUserId(): Promise<string> {
  const session = await verifySession();
  if (!session) {
    throw new ApiError(401, "Not signed in.");
  }
  return session.userId;
}

const BASE = "/users/vendors";

export const VendorVerificationStatusSchema = z.enum(["Pending", "UnderReview", "Verified", "Rejected"]);
export type VendorVerificationStatus = z.infer<typeof VendorVerificationStatusSchema>;

const VendorAddressSchema = z.object({
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  postalCode: z.string().nullable(),
});

const VendorProfileSchema = z.object({
  id: z.string(),
  businessLegalName: z.string(),
  vendorType: z.string(),
  taxId: z.string().nullable(),
  businessRegistrationNumber: z.string().nullable(),
  businessDescription: z.string().nullable(),
  businessLogoPublicId: z.string().nullable(),
  businessAddress: VendorAddressSchema,
  contactName: z.string().nullable(),
  businessPhone: z.string().nullable(),
  businessEmail: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  verification: z.object({
    status: VendorVerificationStatusSchema,
    rejectionReason: z.string().nullable(),
    approvedAt: z.string().nullable(),
    rejectedAt: z.string().nullable(),
  }),
});
export type VendorProfile = z.infer<typeof VendorProfileSchema>;

export interface CreateVendorProfileInput {
  businessLegalName: string;
  vendorType: "Individual" | "SmallBusiness" | "Enterprise" | "Distributor" | "Manufacturer";
  taxId?: string;
  businessRegistrationNumber?: string;
  businessDescription?: string;
  businessAddress: {
    addressLine: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
}

export async function createVendorProfile(input: CreateVendorProfileInput): Promise<VendorProfile> {
  if (SOURCE === "mock") {
    const userId = await currentMockUserId();
    const profile = upsertMockBusinessProfile(userId, input);
    return VendorProfileSchema.parse(profile);
  }
  const { data } = await apiClient.post<unknown>(BASE, { body: input });
  return VendorProfileSchema.parse(data);
}

export async function getVendorProfile(): Promise<VendorProfile | null> {
  if (SOURCE === "mock") {
    const userId = await currentMockUserId();
    const profile = getMockVendorProfile(userId);
    return profile ? VendorProfileSchema.parse(profile) : null;
  }
  const { data } = await apiClient.get<unknown>(BASE);
  return data ? VendorProfileSchema.parse(data) : null;
}

export const DocumentTypeSchema = z.enum([
  "IsoCertification",
  "BusinessRegistration",
  "FdaRegistration",
  "NafdacRegistration",
  "Other",
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export interface BeginDocumentUploadInput {
  documentName: string;
  documentType: DocumentType;
  fileName: string;
  contentType: string;
}

const BeginDocumentUploadResponseSchema = z.object({
  // Presigned-upload shape not yet confirmed against a live response — the client
  // uploads directly to storage with whatever this returns (e.g. a presigned URL
  // and the documentId to reference in completeDocumentUpload). Treat as a
  // documented assumption, not observed fact, until wired against a real response.
  uploads: z.array(
    z.object({
      documentId: z.string(),
      uploadUrl: z.string(),
    }),
  ),
});

export async function beginDocumentUpload(documents: BeginDocumentUploadInput[]) {
  if (SOURCE === "mock") {
    const userId = await currentMockUserId();
    const uploads = documents.map((document) => addMockDocument(userId, document));
    return BeginDocumentUploadResponseSchema.parse({ uploads });
  }
  const { data } = await apiClient.post<unknown>(`${BASE}/documents`, { body: { documents } });
  return BeginDocumentUploadResponseSchema.parse(data);
}

export async function completeDocumentUpload(documentIds: string[]) {
  if (SOURCE === "mock") {
    const userId = await currentMockUserId();
    completeMockDocuments(userId, documentIds);
    return { documentIds };
  }
  const { data } = await apiClient.put<unknown>(`${BASE}/documents`, { body: { documentIds } });
  return data;
}

export interface AddSettlementAccountInput {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  currency: string;
}

export async function addSettlementAccount(input: AddSettlementAccountInput) {
  if (SOURCE === "mock") {
    const userId = await currentMockUserId();
    return addMockSettlementAccount(userId, input);
  }
  const { data } = await apiClient.post<unknown>(`${BASE}/settlement-accounts`, { body: input });
  return data;
}

export async function setDefaultSettlementAccount(accountId: string) {
  if (SOURCE === "mock") {
    const userId = await currentMockUserId();
    setMockDefaultSettlementAccount(userId, accountId);
    return;
  }
  await apiClient.put(`${BASE}/settlement-accounts/${accountId}/default`);
}
