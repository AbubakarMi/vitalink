import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "../client";

/**
 * In-memory stand-in for the vendor onboarding/KYC backend, keyed by the
 * signed-in vendor's userId (from the mock session — see
 * lib/api/vendor-profile.ts's VENDOR_PROFILE_DATA_SOURCE seam). Same
 * process-lifetime caveat as lib/api/mocks/auth-store.ts: see docs/MOCK_AUTH.md.
 */

export interface MockVendorAddress {
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
}

export interface MockVendorDocument {
  documentId: string;
  documentType: string;
  documentName: string;
  fileName: string;
  contentType: string;
  uploaded: boolean;
}

export interface MockSettlementAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  currency: string;
  isDefault: boolean;
}

export interface MockVendorProfile {
  id: string;
  userId: string;
  businessLegalName: string;
  vendorType: "Individual" | "SmallBusiness" | "Enterprise" | "Distributor" | "Manufacturer";
  taxId: string | null;
  businessRegistrationNumber: string | null;
  businessDescription: string | null;
  businessLogoPublicId: string | null;
  businessAddress: MockVendorAddress;
  contactName: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  websiteUrl: string | null;
  verification: {
    status: "Pending" | "UnderReview" | "Verified" | "Rejected";
    rejectionReason: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
  };
  documents: MockVendorDocument[];
  settlementAccounts: MockSettlementAccount[];
}

const profilesByUserId = new Map<string, MockVendorProfile>();

export function getMockVendorProfile(userId: string): MockVendorProfile | undefined {
  return profilesByUserId.get(userId);
}

export interface UpsertBusinessProfileInput {
  businessLegalName: string;
  vendorType: MockVendorProfile["vendorType"];
  taxId?: string;
  businessRegistrationNumber?: string;
  businessDescription?: string;
  businessAddress: { addressLine: string; city: string; state: string; country: string; postalCode?: string };
  businessPhone?: string;
}

/** Creates the profile on first call, updates it on subsequent calls — mirrors
 * the real backend's "no separate create vs. update endpoint" behavior implied
 * by the vendor-apply wizard reusing the same form for both. */
export function upsertMockBusinessProfile(userId: string, input: UpsertBusinessProfileInput): MockVendorProfile {
  const existing = profilesByUserId.get(userId);
  const profile: MockVendorProfile = {
    id: existing?.id ?? randomUUID(),
    userId,
    businessLegalName: input.businessLegalName,
    vendorType: input.vendorType,
    taxId: input.taxId ?? existing?.taxId ?? null,
    businessRegistrationNumber: input.businessRegistrationNumber ?? existing?.businessRegistrationNumber ?? null,
    businessDescription: input.businessDescription ?? existing?.businessDescription ?? null,
    businessLogoPublicId: existing?.businessLogoPublicId ?? null,
    businessAddress: {
      addressLine: input.businessAddress.addressLine,
      city: input.businessAddress.city,
      state: input.businessAddress.state,
      country: input.businessAddress.country,
      postalCode: input.businessAddress.postalCode ?? null,
    },
    contactName: existing?.contactName ?? null,
    businessPhone: input.businessPhone ?? existing?.businessPhone ?? null,
    businessEmail: existing?.businessEmail ?? null,
    websiteUrl: existing?.websiteUrl ?? null,
    verification: existing?.verification ?? {
      status: "Pending",
      rejectionReason: null,
      approvedAt: null,
      rejectedAt: null,
    },
    documents: existing?.documents ?? [],
    settlementAccounts: existing?.settlementAccounts ?? [],
  };
  profilesByUserId.set(userId, profile);
  return profile;
}

function requireProfile(userId: string): MockVendorProfile {
  const profile = profilesByUserId.get(userId);
  if (!profile) {
    throw new ApiError(404, "Save your business profile before uploading documents or payout details.");
  }
  return profile;
}

export interface AddMockDocumentInput {
  documentName: string;
  documentType: string;
  fileName: string;
  contentType: string;
}

/** The browser really does PUT to this uploadUrl (document-upload-field.tsx,
 * by design, never proxies the file through a Server Action) — so it has to
 * be a same-origin URL that actually accepts a PUT, not a placeholder. See
 * app/api/mock-uploads/[documentId]/route.ts, which just discards the bytes. */
export function addMockDocument(userId: string, input: AddMockDocumentInput): { documentId: string; uploadUrl: string } {
  const profile = requireProfile(userId);
  const documentId = randomUUID();
  profile.documents.push({ documentId, ...input, uploaded: false });
  return { documentId, uploadUrl: `/api/mock-uploads/${documentId}` };
}

export function completeMockDocuments(userId: string, documentIds: string[]): void {
  const profile = requireProfile(userId);
  for (const document of profile.documents) {
    if (documentIds.includes(document.documentId)) {
      document.uploaded = true;
    }
  }
}

export interface AddMockSettlementAccountInput {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  currency: string;
}

export function addMockSettlementAccount(userId: string, input: AddMockSettlementAccountInput): MockSettlementAccount {
  const profile = requireProfile(userId);
  const account: MockSettlementAccount = {
    id: randomUUID(),
    ...input,
    isDefault: profile.settlementAccounts.length === 0,
  };
  profile.settlementAccounts.push(account);
  return account;
}

export function setMockDefaultSettlementAccount(userId: string, accountId: string): void {
  const profile = requireProfile(userId);
  for (const account of profile.settlementAccounts) {
    account.isDefault = account.id === accountId;
  }
}
