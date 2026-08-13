"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChartPie, Package, ShoppingBag, ArrowLeftRight, BarChart3, Settings as SettingsIcon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Persistent vendor dashboard chrome (sidebar + header) — wraps every page
 * under app/vendor/ once a vendor is signed in and verified. Role-scoped
 * per the "components never cross role boundaries" rule (frontend
 * architecture doc §2.3): this never gets imported from app/buyer or
 * app/admin, even though a sidebar+header shell "looks reusable".
 *
 * Below `lg` the sidebar collapses into a hamburger-triggered slide-over
 * (no separate mobile nav component was in the mockups — everything below
 * `lg` is this component's own responsive treatment).
 */

const NAV_ITEMS = [
  { href: "/vendor/dashboard", label: "Overview", icon: ChartPie },
  { href: "/vendor/products", label: "Global Inventory", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/transactions", label: "Transactions", icon: ArrowLeftRight },
] as const;

const NAV_ITEMS_BOTTOM = [
  { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/vendor/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function DashboardShell({
  vendorName,
  walletBalance,
  currency,
  children,
}: {
  vendorName: string;
  walletBalance: number;
  currency: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the drawer whenever navigation actually happens, not just on click
  // (covers back/forward and any programmatic navigation too). Adjusting
  // state during render (not in an effect) per React's guidance for
  // resetting state when a prop changes — avoids the extra
  // render-then-effect-then-render cascade a useEffect version would cause.
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
    <div className="flex h-screen flex-col bg-cream print:h-auto print:block">
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-6 lg:px-10 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
            className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-mint lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Link href="/vendor/dashboard" className="font-alata text-lg tracking-tight text-ink sm:text-xl">
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
          <span className="hidden items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-sm font-medium text-ink sm:flex">
            {currency === "NGN" ? "N" : currency}
            {walletBalance.toLocaleString("en-NG")}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
              {vendorName.charAt(0).toUpperCase()}
            </span>
            <div className="hidden sm:block">
              <p className="max-w-32 truncate text-sm font-semibold text-ink">{vendorName}</p>
              <p className="text-xs text-verified">Vendor</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        <aside className="vendor-scroll hidden w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-white px-4 py-6 lg:flex print:hidden">
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

        <main className="vendor-scroll min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 print:overflow-visible print:p-0">
          {children}
        </main>
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
            <VendorNavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
          ))}
        </nav>
      )}
      {!topOnly && (
        <nav className="mt-8 space-y-1 lg:mt-0">
          {NAV_ITEMS_BOTTOM.map((item) => (
            <VendorNavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
          ))}
        </nav>
      )}
    </>
  );
}

function VendorNavLink({
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
