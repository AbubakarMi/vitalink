import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { pagedResult } from "../schemas/pagination";
import { VendorVerificationStatusSchema } from "../vendor-profile";
import { ADMIN_SOURCE } from "./data-source";
import {
  listMockVendors,
  getMockVendorDetails,
  approveMockVendor,
  rejectMockVendor,
  markMockVendorUnderReview,
} from "../mocks/admin-store";

/**
 * Admin vendor-approval adapter — real endpoints (see vitalink-backend
 * Web.Api/Endpoints/Administration/Vendors/*), flipped to
 * lib/api/mocks/admin-store.ts while ADMIN_DATA_SOURCE=mock (default — see
 * lib/api/admin/data-source.ts). Callers must hold
 * Permissions.Vendors.{List,Approve,Reject,...} — checked via
 * lib/auth/permissions.ts before calling these, not enforced here (this adapter
 * trusts its caller the same way any internal module trusts callers who already
 * passed the DAL/permission gate).
 */

const BASE = "/admin/vendors";

const AdminVendorAddressSchema = z.object({
  addressLine: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
});

const AdminVendorSchema = z.object({
  id: z.string(),
  businessLegalName: z.string(),
  vendorType: z.string(),
  businessLogoUrl: z.string().nullable(),
  contactName: z.string().nullable(),
  businessPhone: z.string().nullable(),
  businessEmail: z.string().nullable(),
  verificationStatus: VendorVerificationStatusSchema,
  createdAt: z.string(),
  // Fields below match lib/api/vendor-profile.ts's confirmed-real
  // VendorProfileSchema shape (same underlying vendor entity, admin's view
  // of it) — added for the "Business Profile" review tab (super admin/
  // Vendor Application Business Profile.pdf). Optional so a GetVendorDetails
  // response that doesn't include them yet still parses.
  taxId: z.string().nullable().optional(),
  businessRegistrationNumber: z.string().nullable().optional(),
  businessAddress: AdminVendorAddressSchema.nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  // "Identity" tab fields (super admin/Vendor Application Identity.pdf) —
  // the applicant's own user record, not the business. Not present on
  // VendorProfileSchema (that's the vendor's own self-view, which doesn't
  // need to show its own owner's identity back to itself) and not yet
  // confirmed against the real GetVendorDetails response — deferred per
  // "build the frontend now, review the backend later".
  applicantFirstName: z.string().nullable().optional(),
  applicantLastName: z.string().nullable().optional(),
  applicantEmail: z.string().nullable().optional(),
  applicantPhone: z.string().nullable().optional(),
  applicantAvatarUrl: z.string().nullable().optional(),
  applicantCountry: z.string().nullable().optional(),
  deliveryAddress: AdminVendorAddressSchema.nullable().optional(),
});
export type AdminVendor = z.infer<typeof AdminVendorSchema>;

const PagedVendorsSchema = pagedResult(AdminVendorSchema);

export interface ListVendorsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: z.infer<typeof VendorVerificationStatusSchema>;
  [key: string]: string | number | boolean | undefined;
}

export async function listVendors(params: ListVendorsParams = {}) {
  if (ADMIN_SOURCE === "mock") {
    return PagedVendorsSchema.parse(listMockVendors(params));
  }
  const { data } = await apiClient.get<unknown>(BASE, { params });
  return PagedVendorsSchema.parse(data);
}

export async function getVendorDetails(vendorId: string) {
  if (ADMIN_SOURCE === "mock") {
    return AdminVendorSchema.parse(getMockVendorDetails(vendorId));
  }
  const { data } = await apiClient.get<unknown>(`${BASE}/${vendorId}`);
  return AdminVendorSchema.parse(data);
}

export async function markVendorUnderReview(vendorId: string) {
  if (ADMIN_SOURCE === "mock") {
    markMockVendorUnderReview(vendorId);
    return;
  }
  await apiClient.put(`${BASE}/${vendorId}/under-review`);
}

export async function approveVendor(vendorId: string) {
  if (ADMIN_SOURCE === "mock") {
    approveMockVendor(vendorId);
    return;
  }
  await apiClient.put(`${BASE}/${vendorId}/approve`);
}

export async function rejectVendor(vendorId: string, reason: string) {
  if (ADMIN_SOURCE === "mock") {
    rejectMockVendor(vendorId, reason);
    return;
  }
  await apiClient.put(`${BASE}/${vendorId}/reject`, { body: { reason } });
}
