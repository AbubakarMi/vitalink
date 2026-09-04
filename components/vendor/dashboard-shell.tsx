"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChartPie, Package, Archive, ShoppingBag, Store, ArrowLeftRight, BarChart3, Settings as SettingsIcon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/ui/account-menu";
import { SearchBar } from "@/components/marketing/search-bar";
import { CartIcon } from "@/components/marketplace/cart-icon";

/**
 * Persistent vendor dashboard chrome (sidebar + header) — wraps every page
 * under app/vendor/ once a vendor is signed in and verified. Role-scoped
 * per the "components never cross role boundaries" rule (frontend
 * architecture doc §2.3): this never gets imported from app/customer or
 * app/admin, even though a sidebar+header shell "looks reusable".
 *
 * Below `lg` the sidebar collapses into a hamburger-triggered slide-over
 * (no separate mobile nav component was in the mockups — everything below
 * `lg` is this component's own responsive treatment).
 */

const NAV_ITEMS = [
  { href: "/vendor/dashboard", label: "Overview", icon: ChartPie },
  // A vendor is still a shopper — /products is the public marketplace catalog,
  // open to any signed-in account type (unlike everything else below, which
  // is vendor-only). See lib/auth/route-groups.ts's isCustomerPathOpenToVendors
  // for the cart/checkout/orders side of this.
  { href: "/products", label: "Marketplace", icon: Store },
  { href: "/vendor/products", label: "Inventory", icon: Package },
  { href: "/vendor/products/archive", label: "Archive", icon: Archive },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/transactions", label: "Transactions", icon: ArrowLeftRight },
] as const;

const NAV_ITEMS_BOTTOM = [
  { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/vendor/settings", label: "Settings", icon: SettingsIcon },
] as const;

/** Longest-prefix-wins match — "Inventory" (/vendor/products) and "Archive"
 * (/vendor/products/archive) are sibling routes where one is a literal path
 * prefix of the other, same shape of bug as the admin Configuration nav
 * (components/admin/dashboard-shell.tsx): a plain startsWith() would light
 * both up together on the archive page. */
function isNavItemActive(pathname: string | null, items: readonly { href: string }[], href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !items.some(
    (other) =>
      other.href !== href &&
      other.href.startsWith(`${href}/`) &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`)),
  );
}

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
    <div className="flex h-dvh flex-col bg-cream print:h-auto print:block">
      <div className="h-[3px] shrink-0 bg-signal print:hidden" />
      <header className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-line bg-white px-4 py-3 sm:px-6 lg:px-10 print:hidden">
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

        <div className="hidden justify-center lg:flex">
          <SearchBar variant="nav" />
        </div>

        <div className="flex items-center gap-2 justify-self-end sm:gap-3">
          {/* Buying, not selling — this is the same cart a customer uses, since
              /customer/cart is open to Vendor sessions (route-groups.ts). */}
          <CartIcon />
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
          <AccountMenu name={vendorName} badge="Vendor" />
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
            <VendorNavLink key={item.href} item={item} active={isNavItemActive(pathname, NAV_ITEMS, item.href)} />
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
