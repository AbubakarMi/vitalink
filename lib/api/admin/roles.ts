import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { pagedResult } from "../schemas/pagination";
import { ADMIN_SOURCE } from "./data-source";
import { listMockRoles, getMockRoleDetails } from "../mocks/admin-store";
import { ApiError } from "../client";

/** Real endpoints — see vitalink-backend Web.Api/Endpoints/Administration/Roles/*,
 * flipped to lib/api/mocks/admin-store.ts while ADMIN_DATA_SOURCE=mock (default). */

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
  if (ADMIN_SOURCE === "mock") {
    const all = listMockRoles();
    const pageSize = params.pageSize ?? 20;
    const page = Math.max(1, params.page ?? 1);
    const start = (page - 1) * pageSize;
    return PagedRolesSchema.parse({
      data: all.slice(start, start + pageSize),
      currentPage: page,
      pageSize,
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
    });
  }
  const { data } = await apiClient.get<unknown>(BASE, { params });
  return PagedRolesSchema.parse(data);
}

export async function getRoleDetails(roleId: string) {
  if (ADMIN_SOURCE === "mock") {
    const role = getMockRoleDetails(roleId);
    if (!role) throw new ApiError(404, "Role not found.");
    return RoleDetailsSchema.parse(role);
  }
  const { data } = await apiClient.get<unknown>(`${BASE}/${roleId}`);
  return RoleDetailsSchema.parse(data);
}

export async function listRolesDropdown() {
  if (ADMIN_SOURCE === "mock") {
    return z.array(RoleDropdownItemSchema).parse(listMockRoles().map((r) => ({ id: r.id, name: r.displayName })));
  }
  const { data } = await apiClient.get<unknown>(`${BASE}/dropdown`);
  return z.array(RoleDropdownItemSchema).parse(data);
}
