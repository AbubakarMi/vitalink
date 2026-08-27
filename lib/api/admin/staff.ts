import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { pagedResult } from "../schemas/pagination";
import { ADMIN_SOURCE } from "./data-source";
import { listMockStaff, createMockStaff, approveMockStaff, suspendMockStaff } from "../mocks/admin-store";

/** Real endpoints — see vitalink-backend Web.Api/Endpoints/Administration/Staff/*,
 * flipped to lib/api/mocks/admin-store.ts while ADMIN_DATA_SOURCE=mock (default). */

const BASE = "/admin/staff";

const StaffSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.array(z.string()),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  isActive: z.boolean(),
  // "Every user needs to go under review" (design brief) — new staff
  // invites aren't active until a Super Admin approves them. Optional/best
  // -effort: not confirmed against the real backend response yet.
  approvalStatus: z.enum(["Approved", "PendingReview"]).nullable().optional(),
  createdAt: z.string(),
});
export type Staff = z.infer<typeof StaffSchema>;

const PagedStaffSchema = pagedResult(StaffSchema);

export interface ListStaffParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export async function listStaff(params: ListStaffParams = {}) {
  if (ADMIN_SOURCE === "mock") {
    const all = listMockStaff().filter(
      (s) =>
        !params.search ||
        s.name.toLowerCase().includes(params.search.toLowerCase()) ||
        s.email.toLowerCase().includes(params.search.toLowerCase()),
    );
    const pageSize = params.pageSize ?? 20;
    const page = Math.max(1, params.page ?? 1);
    const start = (page - 1) * pageSize;
    return PagedStaffSchema.parse({
      data: all.slice(start, start + pageSize),
      currentPage: page,
      pageSize,
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
    });
  }
  const { data } = await apiClient.get<unknown>(BASE, { params });
  return PagedStaffSchema.parse(data);
}

export interface CreateStaffInput {
  name: string;
  email: string;
  phone?: string;
  roleIds: string[];
}

export async function createStaff(input: CreateStaffInput) {
  if (ADMIN_SOURCE === "mock") {
    return createMockStaff(input);
  }
  const { data } = await apiClient.post<unknown>(BASE, { body: input });
  return data;
}

export async function approveStaff(staffId: string): Promise<void> {
  if (ADMIN_SOURCE === "mock") {
    approveMockStaff(staffId);
    return;
  }
  await apiClient.put(`${BASE}/${staffId}/approve`);
}

export async function suspendStaff(staffId: string): Promise<void> {
  if (ADMIN_SOURCE === "mock") {
    suspendMockStaff(staffId);
    return;
  }
  await apiClient.put(`${BASE}/${staffId}/suspend`);
}
