import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "../client";
import { findMockUserByEmail } from "./auth-store";

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

// Pinned to globalThis for the same reason as lib/api/mocks/auth-store.ts's
// usersByEmail — survives Next.js dev-mode module re-evaluation on unrelated
// file edits, not just a full process restart.
const globalForMockVendorProfiles = globalThis as unknown as { __vitalinkMockVendorProfiles?: Map<string, MockVendorProfile> };
const profilesByUserId = globalForMockVendorProfiles.__vitalinkMockVendorProfiles ?? new Map<string, MockVendorProfile>();
globalForMockVendorProfiles.__vitalinkMockVendorProfiles = profilesByUserId;

/**
 * The seeded `vendor@vitalink.dev` demo account (lib/api/mocks/auth-store.ts)
 * has a login but, unlike the seeded users, no profile — so logging in with
 * it alone always lands on the "finish setting up your seller account" page,
 * not the dashboard. Seeding a completed, Verified profile for it here means
 * the demo credentials in docs/MOCK_AUTH.md actually reach the vendor
 * dashboard on first login, not just brand-new self-registered accounts.
 */
function seedDemoVendorProfileOnce(): void {
  const demoUser = findMockUserByEmail("vendor@vitalink.dev");
  if (!demoUser || profilesByUserId.has(demoUser.userId)) {
    return;
  }
  const now = new Date().toISOString();
  profilesByUserId.set(demoUser.userId, {
    id: randomUUID(),
    userId: demoUser.userId,
    businessLegalName: "Femi Vendor Medical Supplies",
    vendorType: "Distributor",
    taxId: "20-1234567-0001",
    businessRegistrationNumber: "RC-1234567",
    businessDescription: "Distributor of medical equipment, lab instruments, and clinical reagents across Nigeria.",
    businessLogoPublicId: null,
    businessAddress: {
      addressLine: "14 Marina Road",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      postalCode: "101241",
    },
    contactName: demoUser.displayName,
    businessPhone: demoUser.phone ?? null,
    businessEmail: demoUser.email,
    websiteUrl: null,
    verification: { status: "Verified", rejectionReason: null, approvedAt: now, rejectedAt: null },
    documents: [],
    settlementAccounts: [],
  });
}
seedDemoVendorProfileOnce();

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
    // Real backend status transitions (Pending -> UnderReview -> Verified/
    // Rejected) are admin-initiated only, against the live backend (see
    // lib/api/vendor-profile.ts's header comment) — there's no mock admin
    // approval workflow to fake here. Auto-verifying on profile creation, in
    // mock mode only, is what actually makes /vendor/dashboard (and
    // everything behind app/vendor/layout.tsx's Verified-status gate)
    // reachable at all in local dev/demo, the same reasoning that already
    // auto-verifies email in mock mode (see docs/MOCK_AUTH.md).
    verification: existing?.verification ?? {
      status: "Verified",
      rejectionReason: null,
      approvedAt: new Date().toISOString(),
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
