"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, SquarePen, MessageSquare, History, Store, Settings as SettingsIcon, Menu, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/store";
import { AccountMenu } from "@/components/ui/account-menu";

/**
 * Persistent buyer dashboard chrome (sidebar + header) — wraps every page
 * under app/buyer/ once a buyer is signed in. Role-scoped per the
 * "components never cross role boundaries" rule (frontend architecture doc
 * §2.3) — this is its own component, not a reuse of components/vendor's
 * dashboard-shell, even though the structure looks similar.
 *
 * Nav is New Search / Chats / History / Settings, not a stats "Overview" —
 * the buyer's home is the Intent Search chat, not a dashboard of numbers
 * (no mockup in the reference folder showed a buyer stats page).
 */

const NAV_ITEMS = [
  { href: "/buyer/dashboard", label: "New Search", icon: SquarePen },
  { href: "/products", label: "Marketplace", icon: Store },
  { href: "/buyer/chats", label: "Chats", icon: MessageSquare },
  { href: "/buyer/orders", label: "History", icon: History },
] as const;

const NAV_ITEMS_BOTTOM = [{ href: "/buyer/settings", label: "Settings", icon: SettingsIcon }] as const;

export function DashboardShell({
  buyerName,
  children,
}: {
  buyerName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

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
          <Link href="/buyer/dashboard" className="font-alata text-lg tracking-tight text-ink sm:text-xl">
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
          <Link
            href="/buyer/cart"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className="relative flex size-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-mint hover:text-ink"
          >
            <ShoppingCart className="size-4.5" aria-hidden />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-verified text-[10px] font-semibold text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
          <AccountMenu name={buyerName} badge="Buyer" />
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
            <BuyerNavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
          ))}
        </nav>
      )}
      {!topOnly && (
        <nav className="mt-8 space-y-1 border-t border-line pt-4 lg:mt-0 lg:border-t-0 lg:pt-0">
          {NAV_ITEMS_BOTTOM.map((item) => (
            <BuyerNavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </nav>
      )}
    </>
  );
}

function BuyerNavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof SquarePen };
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
