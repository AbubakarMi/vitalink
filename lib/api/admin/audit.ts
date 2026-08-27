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
 * Shape inferred from the mockup, not yet checked against the backend's
 * actual response DTO (deferred per "build the frontend now, review the
 * backend later") — fields are optional/nullable so a mismatch fails soft.
 */

const BASE = "/admin/audit-logs";

const AuditLogEntrySchema = z.object({
  id: z.string(),
  event: z.string(),
  description: z.string().nullable().optional(),
  severity: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  actorName: z.string().nullable().optional(),
  createdAt: z.string(),
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
  const { data } = await apiClient.get<unknown>(BASE, { params });
  return PagedAuditLogSchema.parse(data);
}
