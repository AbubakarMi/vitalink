"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChartPie,
  Boxes,
  ShoppingBag,
  Building2,
  Users as UsersIcon,
  ArrowLeftRight,
  Landmark,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/ui/account-menu";

/**
 * Persistent Super Admin dashboard chrome (sidebar + header) — wraps every
 * page under app/admin/ once a Staff user is signed in. Own copy of
 * components/vendor/dashboard-shell.tsx's shape (sidebar nav from the
 * "Super Admin Dashboard" mockup: Overview / Global Inventory / Orders /
 * Users / Transactions, then Analytics / Settings below), not a shared
 * import — per the "components never cross role boundaries" rule.
 */

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: ChartPie },
  { href: "/admin/vendors", label: "Vendor Review", icon: Building2 },
  { href: "/admin/inventory", label: "Global Inventory", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/settlements", label: "Settlements", icon: Landmark },
] as const;

const NAV_ITEMS_BOTTOM = [
  { href: "/admin/analytics", label: "Analytics & Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function DashboardShell({
  name,
  walletBalance,
  children,
}: {
  name: string;
  walletBalance?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh flex-col bg-cream">
      <div className="h-[3px] shrink-0 bg-signal" />
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
            className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-mint lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Link href="/admin/dashboard" className="font-alata text-lg tracking-tight text-ink sm:text-xl">
            VITALINK
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-mint hover:text-ink"
          >
            <Bell className="size-4.5" aria-hidden />
          </button>
          {walletBalance !== undefined && (
            <span className="hidden items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-sm font-medium text-ink sm:flex" title="Funds in escrow">
              N{walletBalance.toLocaleString("en-NG")}
            </span>
          )}
          <AccountMenu name={name} badge="Super Admin" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="vendor-scroll hidden w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-white px-4 py-6 lg:flex">
          <SidebarNav pathname={pathname} />
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-ink/40"
            />
            <aside className="vendor-scroll relative flex h-full w-72 max-w-[80vw] flex-col justify-between overflow-y-auto bg-white px-4 py-6 shadow-xl">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-alata text-lg tracking-tight text-ink">VITALINK</span>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
                  >
                    <X className="size-4.5" aria-hidden />
                  </button>
                </div>
                <SidebarNav pathname={pathname} topOnly />
              </div>
              <SidebarNav pathname={pathname} bottomOnly />
            </aside>
          </div>
        )}

        <main className="vendor-scroll min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({
  pathname,
  topOnly,
  bottomOnly,
}: {
  pathname: string | null;
  topOnly?: boolean;
  bottomOnly?: boolean;
}) {
  return (
    <>
      {!bottomOnly && (
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <AdminNavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
          ))}
        </nav>
      )}
      {!topOnly && (
        <nav className="mt-8 space-y-1 lg:mt-0">
          {NAV_ITEMS_BOTTOM.map((item) => (
            <AdminNavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
          ))}
        </nav>
      )}
    </>
  );
}

function AdminNavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof ChartPie };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-ink text-white" : "text-text-muted hover:bg-mint hover:text-ink",
      )}
    >
      <Icon className="size-4.5 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}
