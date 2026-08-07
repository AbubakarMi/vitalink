import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { pagedResult } from "../schemas/pagination";

/** Real endpoints — see vitalink-backend Web.Api/Endpoints/Administration/Roles/*. */

const BASE = "/admin/roles";

const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

const PagedRolesSchema = pagedResult(RoleSchema);

const RolePermissionSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  resource: z.string(),
});

const RoleDetailsSchema = RoleSchema.extend({
  permissions: z.array(RolePermissionSchema),
});

const RoleDropdownItemSchema = z.object({ id: z.string(), name: z.string() });

export async function listRoles(params: { page?: number; pageSize?: number } = {}) {
  const { data } = await apiClient.get<unknown>(BASE, { params });
  return PagedRolesSchema.parse(data);
}

export async function getRoleDetails(roleId: string) {
  const { data } = await apiClient.get<unknown>(`${BASE}/${roleId}`);
  return RoleDetailsSchema.parse(data);
}

export async function listRolesDropdown() {
  const { data } = await apiClient.get<unknown>(`${BASE}/dropdown`);
  return z.array(RoleDropdownItemSchema).parse(data);
}
