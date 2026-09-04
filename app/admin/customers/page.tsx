import Link from "next/link";
import { Search } from "lucide-react";
import { requireAccountType } from "@/lib/auth/dal";
import { listAdminCustomers } from "@/lib/api/admin/customers";
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

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

/** Admin's read-only view of customer accounts and their spend/order activity —
 * see lib/api/admin/customers.ts for why this is mock-only (no backend
 * Customers-listing endpoint exists). */
export default async function AdminCustomersPage({ searchParams }: PageProps) {
  await requireAccountType("admin", "/admin/customers");
  const params = await searchParams;
  const allCustomers = await listAdminCustomers();

  const query = (params.search ?? "").trim().toLowerCase();
  const filtered = query
    ? allCustomers.filter((b) => b.name.toLowerCase().includes(query) || b.email.toLowerCase().includes(query))
    : allCustomers;

  const page = Math.max(1, Number(params.page) || 1);
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-text-muted">{totalCount.toLocaleString("en-NG")} customer accounts on file.</p>
      </div>

      <form action="/admin/customers" className="flex w-fit items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5">
        <Search className="size-4 text-ink-soft/50" aria-hidden />
        <input
          type="search"
          name="search"
          defaultValue={params.search}
          placeholder="Search by name or email"
          className="w-56 bg-transparent text-sm text-ink-soft outline-none placeholder:text-text-muted"
        />
      </form>

      <AdminTableShell>
        <AdminTableHead>
          <AdminTableHeadCell>Customer</AdminTableHeadCell>
          <AdminTableHeadCell>Contact</AdminTableHeadCell>
          <AdminTableHeadCell>Orders</AdminTableHeadCell>
          <AdminTableHeadCell>Total Spent</AdminTableHeadCell>
          <AdminTableHeadCell>Last Order</AdminTableHeadCell>
          <AdminTableHeadCell className="text-right">Actions</AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.length === 0 ? (
            <AdminTableEmpty colSpan={6}>No customers match that search.</AdminTableEmpty>
          ) : (
            pageItems.map((customer) => (
              <AdminTableRow key={customer.id}>
                <AdminTableCell className="font-medium">{customer.name}</AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  <p>{customer.email}</p>
                  {customer.phone && <p className="text-xs">{customer.phone}</p>}
                </AdminTableCell>
                <AdminTableCell className="text-text-muted">{customer.orderCount}</AdminTableCell>
                <AdminTableCell className="text-text-muted">N{customer.totalSpent.toLocaleString("en-NG")}</AdminTableCell>
                <AdminTableCell className="text-text-muted">
                  {customer.lastOrderAt
                    ? new Date(customer.lastOrderAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <Link href={`/admin/customers/${customer.id}`} className="text-sm font-medium text-verified hover:underline">
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
        pageSize={PAGE_SIZE}
        basePath="/admin/customers"
        searchParams={{ search: params.search }}
      />
    </main>
  );
}
