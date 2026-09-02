import "server-only";
import { z } from "zod";
import { apiClient } from "../client";
import { pagedResult } from "../schemas/pagination";
import { ADMIN_SOURCE } from "./data-source";
import { listMockAuditLog } from "../mocks/admin-store";

/**
 * Admin audit-log adapter — real endpoint on the backend
 * (Web.Api/Endpoints/Administration/AuditLogs/GetAdminAuditLogs.cs), backing
 * the dashboard's "System Anomalies" panel and "View Security log" link
 * (super admin/Super Admin Dashboard.pdf).
 *
 * Field names below match GetAdminAuditResponse exactly, confirmed live
 * (2026-09-02) — the previous shape (event/description/severity/ipAddress/
 * actorName/createdAt) didn't exist on the real response at all and threw a
 * Zod parse error on every live call. This is a straightforward field-level
 * change table (Action/TableName/Message/Email/Timestamp), unlike admin
 * products' shape mismatch, which needs a real redesign — see products.ts.
 */

// "admin/audit" — confirmed against AdministrationEndpoints.Audit.AuditBase,
// not "/admin/audit-logs" as originally guessed here.
const BASE = "/admin/audit";

const AuditLogEntrySchema = z.object({
  id: z.string(),
  /** "Added" | "Modified" | "Deleted", per GetAdminAuditParams' Description. */
  action: z.string(),
  tableName: z.string(),
  email: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  timestamp: z.string(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

const PagedAuditLogSchema = pagedResult(AuditLogEntrySchema);

export interface ListAuditLogParams {
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | undefined;
}

export async function listAuditLog(params: ListAuditLogParams = {}) {
  if (ADMIN_SOURCE === "mock") {
    return PagedAuditLogSchema.parse(listMockAuditLog(params));
  }
  // GetAdminAuditParams doesn't extend QueryStringParams and has no OrderBy
  // field at all (unlike every other admin list endpoint) — just PageNumber/
  // PageSize, so no toBackendListParams() search/OrderBy mapping applies here.
  const { data } = await apiClient.get<unknown>(BASE, {
    params: { PageNumber: params.page ?? 1, PageSize: params.pageSize ?? 10 },
  });
  return PagedAuditLogSchema.parse(data);
}
