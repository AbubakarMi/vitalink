import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { pagedResult } from "../schemas/pagination";
import { VendorVerificationStatusSchema } from "../vendor-profile";

/**
 * Admin vendor-approval adapter — real endpoints (see vitalink-backend
 * Web.Api/Endpoints/Administration/Vendors/*). Callers must hold
 * Permissions.Vendors.{List,Approve,Reject,...} — checked via
 * lib/auth/permissions.ts before calling these, not enforced here (this adapter
 * trusts its caller the same way any internal module trusts callers who already
 * passed the DAL/permission gate).
 */

const BASE = "/admin/vendors";

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
  const { data } = await apiClient.get<unknown>(BASE, { params });
  return PagedVendorsSchema.parse(data);
}

export async function getVendorDetails(vendorId: string) {
  const { data } = await apiClient.get<unknown>(`${BASE}/${vendorId}`);
  return AdminVendorSchema.parse(data);
}

export async function markVendorUnderReview(vendorId: string) {
  await apiClient.put(`${BASE}/${vendorId}/under-review`);
}

export async function approveVendor(vendorId: string) {
  await apiClient.put(`${BASE}/${vendorId}/approve`);
}

export async function rejectVendor(vendorId: string, reason: string) {
  await apiClient.put(`${BASE}/${vendorId}/reject`, { body: { reason } });
}
