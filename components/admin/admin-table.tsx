import { cn } from "@/lib/utils";

/** Shared table chrome for admin surfaces (Global Inventory, Vendors, Users,
 * Transactions) — own copy of components/vendor/vendor-table.tsx's pattern,
 * per the "components never cross role boundaries" rule. */

export function AdminTableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-line bg-cream/60 text-xs font-medium tracking-wide text-text-muted uppercase">
      <tr>{children}</tr>
    </thead>
  );
}

export function AdminTableHeadCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-5 py-3 font-medium", className)}>{children}</th>;
}

export function AdminTableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-b border-line/70 last:border-b-0 hover:bg-cream/40", className)}>{children}</tr>;
}

export function AdminTableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-5 py-4 align-middle text-ink", className)}>{children}</td>;
}

export function AdminTableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center text-sm text-text-muted">
        {children}
      </td>
    </tr>
  );
}
