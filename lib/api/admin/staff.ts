import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { pagedResult } from "../schemas/pagination";

/** Real endpoints — see vitalink-backend Web.Api/Endpoints/Administration/Staff/*. */

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
  const { data } = await apiClient.post<unknown>(BASE, { body: input });
  return data;
}
