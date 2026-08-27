import Link from "next/link";
import { Search } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { listVendors, type ListVendorsParams } from "@/lib/api/admin/vendors";
import { StatusPill } from "@/components/admin/status-pill";
import { AdminPagination } from "@/components/admin/pagination";
import {
  AdminTableShell,
  AdminTableHead,
  AdminTableHeadCell,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin/admin-table";

export const instant = false; // requireAccountType reads cookies — genuinely dynamic

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

const STATUS_TABS: { label: string; value?: ListVendorsParams["status"] }[] = [
  { label: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Under Review", value: "UnderReview" },
  { label: "Verified", value: "Verified" },
  { label: "Rejected", value: "Rejected" },
];

/** Vendor compliance queue — real, GetVendors (design doc §1, §5). Permission-gated: Permissions.Vendors.List. */
export default async function AdminVendorsPage({ searchParams }: PageProps) {
  const session = await requireAccountType("admin", "/admin/vendors");
  const params = await searchParams;

  if (!hasPermission(session, "Vendors", "List")) {
    return (
      <main>
        <h1 className="text-2xl font-semibold text-ink">Vendors</h1>
        <p className="mt-2 text-sm text-text-muted">You don&apos;t have permission to view this.</p>
      </main>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const status = STATUS_TABS.find((t) => t.value === params.status)?.value;
  const { data: vendors, totalCount, totalPages, pageSize } = await listVendors({
    page,
    pageSize: 12,
    search: params.search,
    status,
  });

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Vendors</h1>
        <p className="mt-1 text-sm text-text-muted">{totalCount.toLocaleString("en-NG")} vendor applications on file.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-1 rounded-full border border-line bg-white p-1">
          {STATUS_TABS.map((tab) => {
            const active = tab.value === status;
            const href = tab.value ? `/admin/vendors?status=${tab.value}` : "/admin/vendors";
            return (
              <Link
                key={tab.label}
                href={href}
                className={
                  active
                    ? "rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white"
                    : "rounded-full px-4 py-1.5 text-xs font-medium text-text-muted hover:text-ink"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <form action="/admin/vendors" className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="size-4 text-ink-soft/50" aria-hidden />
          <input
            type="search"
            name="search"
            defaultValue={params.search}
            placeholder="Search by business name"
            className="w-56 bg-transparent text-sm text-ink-soft outline-none placeholder:text-text-muted"
          />
        </form>
      </div>

      <AdminTableShell>
        <AdminTableHead>
          <AdminTableHeadCell>Business</AdminTableHeadCell>
          <AdminTableHeadCell>Type</AdminTableHeadCell>
          <AdminTableHeadCell>Contact</AdminTableHeadCell>
          <AdminTableHeadCell>Submitted</AdminTableHeadCell>
          <AdminTableHeadCell>Status</AdminTableHeadCell>
          <AdminTableHeadCell className="text-right">Actions</AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {vendors.length === 0 ? (
            <AdminTableEmpty colSpan={6}>No vendors match that filter.</AdminTableEmpty>
          ) : (
            vendors.map((vendor) => (
              <AdminTableRow key={vendor.id}>
                <AdminTableCell className="font-medium">{vendor.businessLegalName}</AdminTableCell>
                <AdminTableCell className="text-text-muted">{vendor.vendorType}</AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  <p>{vendor.contactName ?? "—"}</p>
                  <p className="text-xs">{vendor.businessEmail ?? vendor.businessPhone ?? ""}</p>
                </AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  {new Date(vendor.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                </AdminTableCell>
                <AdminTableCell>
                  <StatusPill status={vendor.verificationStatus} />
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <Link href={`/admin/vendors/${vendor.id}`} className="text-sm font-medium text-verified hover:underline">
                    View
                  </Link>
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </tbody>
      </AdminTableShell>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        basePath="/admin/vendors"
        searchParams={{ status, search: params.search }}
      />
    </main>
  );
}
