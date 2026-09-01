"use client";

import { Fragment, useEffect, useState } from "react";
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
  ClipboardList,
  ClipboardCheck,
  Tags,
  Contact,
  FileBarChart,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/ui/account-menu";
import type { PendingApprovalCounts } from "@/lib/api/admin/approvals";

/**
 * Persistent Super Admin dashboard chrome (sidebar + header) — wraps every
 * page under app/admin/ once a Staff user is signed in. Own copy of
 * components/vendor/dashboard-shell.tsx's shape, not a shared import — per
 * the "components never cross role boundaries" rule. Started from the flat
 * "Super Admin Dashboard" mockup nav (Overview / Vendor Review / Global
 * Inventory / Orders / Users / Transactions, then Analytics / Settings) and
 * has since grown two dropdown modules under Overview: Approval (Vendor
 * Review + Product Review, with a pending-count badge) and Configuration
 * (Onboarding Fields + Product Categories).
 */

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: ChartPie },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/buyers", label: "Buyers", icon: Contact },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/settlements", label: "Settlements", icon: Landmark },
] as const;

const NAV_ITEMS_BOTTOM = [
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
] as const;

/** "Approval" is a module too — Vendor Review and Product Review used to be
 * flat top-level items; grouping them mirrors Configuration and gives the
 * two "something needs your decision" queues one home with a shared pending
 * count badge (see app/admin/layout.tsx's getPendingApprovalCounts). Product
 * Review deep-links straight into the pending queue (?status=PendingReview)
 * rather than the unfiltered inventory browse — matchPath still points at
 * the bare route so active-state and the ?status= query don't fight. */
const APPROVAL_ITEMS = [
  { href: "/admin/vendors", matchPath: "/admin/vendors", label: "Vendor Review", icon: Building2, countKey: "vendors" as const },
  {
    href: "/admin/inventory?status=PendingReview",
    matchPath: "/admin/inventory",
    label: "Product Review",
    icon: Boxes,
    countKey: "products" as const,
  },
] as const;

/** "Configuration" is a module, not a single page — a dropdown of every
 * platform-configuration screen, per the sidebar's new grouping. Settings
 * moved in here rather than staying its own top-level item. */
const CONFIGURATION_ITEMS = [
  { href: "/admin/settings", label: "Onboarding Fields", icon: ClipboardList },
  { href: "/admin/settings/categories", label: "Product Categories", icon: Tags },
] as const;

export function DashboardShell({
  name,
  walletBalance,
  pendingApprovals,
  children,
}: {
  name: string;
  walletBalance?: number;
  pendingApprovals: PendingApprovalCounts | null;
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
          <SidebarNav pathname={pathname} pendingApprovals={pendingApprovals} />
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
                <SidebarNav pathname={pathname} pendingApprovals={pendingApprovals} topOnly />
              </div>
              <SidebarNav pathname={pathname} pendingApprovals={pendingApprovals} bottomOnly />
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
  pendingApprovals,
  topOnly,
  bottomOnly,
}: {
  pathname: string | null;
  pendingApprovals: PendingApprovalCounts | null;
  topOnly?: boolean;
  bottomOnly?: boolean;
}) {
  return (
    <>
      {!bottomOnly && (
        <nav className="space-y-1">
          {NAV_ITEMS.map((item, i) => (
            <Fragment key={item.href}>
              <AdminNavLink item={item} active={pathname?.startsWith(item.href) ?? false} />
              {/* Approval and Configuration sit right under Overview — the
                  first things an admin sees, not buried after every
                  operational nav item. Approval first: it's the "something
                  needs you" queue, Configuration is occasional setup. */}
              {i === 0 && (
                <>
                  <ApprovalNavGroup pathname={pathname} counts={pendingApprovals} />
                  <ConfigurationNavGroup pathname={pathname} />
                </>
              )}
            </Fragment>
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

/** Exact match against the bare path — Product Review's href carries a
 * ?status= query the pathname from usePathname() never includes. */
function isApprovalItemActive(pathname: string | null, matchPath: string): boolean {
  return pathname === matchPath;
}

function ApprovalNavGroup({ pathname, counts }: { pathname: string | null; counts: PendingApprovalCounts | null }) {
  const isChildActive = APPROVAL_ITEMS.some((item) => isApprovalItemActive(pathname, item.matchPath));
  const [open, setOpen] = useState(isChildActive);

  const [wasChildActive, setWasChildActive] = useState(isChildActive);
  if (isChildActive !== wasChildActive) {
    setWasChildActive(isChildActive);
    if (isChildActive) setOpen(true);
  }

  const total = counts?.total ?? 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
          isChildActive && !open ? "bg-ink text-white" : "text-text-muted hover:bg-mint hover:text-ink",
        )}
      >
        <ClipboardCheck className="size-4.5 shrink-0" aria-hidden />
        <span className="flex-1 text-left">Approval</span>
        {total > 0 && <CountBadge count={total} />}
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-1 border-l border-line pl-3">
          {APPROVAL_ITEMS.map((item) => (
            <AdminNavLink
              key={item.href}
              item={item}
              active={isApprovalItemActive(pathname, item.matchPath)}
              count={counts?.[item.countKey]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Small red "unread"-style pill — same idea as an inbox badge, shown next
 * to the Approval group label (a total) and each of its two items (per-type)
 * whenever that count is above zero. Caps the label at "99+" so a runaway
 * count never blows out the sidebar's fixed width. */
function CountBadge({ count }: { count: number }) {
  return (
    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#c0392b] px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** "Configuration" — a module (dropdown), not a link of its own, matching
 * every other platform-configuration screen living under it (onboarding
 * fields, product categories, and Settings, which used to be its own
 * top-level item). Starts expanded whenever the current page is one of its
 * own children, so a direct link into e.g. /admin/settings/categories
 * doesn't leave the group looking collapsed/unrelated. */
/** Exact match, not startsWith — CONFIGURATION_ITEMS' hrefs are sibling leaf
 * pages where one (/admin/settings) happens to be a literal string-prefix
 * of another (/admin/settings/categories), so startsWith() lit up both at
 * once on the categories page. */
function isConfigItemActive(pathname: string | null, href: string): boolean {
  return pathname === href;
}

function ConfigurationNavGroup({ pathname }: { pathname: string | null }) {
  const isChildActive = CONFIGURATION_ITEMS.some((item) => isConfigItemActive(pathname, item.href));
  const [open, setOpen] = useState(isChildActive);

  const [wasChildActive, setWasChildActive] = useState(isChildActive);
  if (isChildActive !== wasChildActive) {
    setWasChildActive(isChildActive);
    if (isChildActive) setOpen(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
          isChildActive && !open ? "bg-ink text-white" : "text-text-muted hover:bg-mint hover:text-ink",
        )}
      >
        <SettingsIcon className="size-4.5 shrink-0" aria-hidden />
        <span className="flex-1 text-left">Configuration</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-1 border-l border-line pl-3">
          {CONFIGURATION_ITEMS.map((item) => (
            <AdminNavLink key={item.href} item={item} active={isConfigItemActive(pathname, item.href)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminNavLink({
  item,
  active,
  count,
}: {
  item: { href: string; label: string; icon: typeof ChartPie };
  active: boolean;
  count?: number;
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
      <span className="flex-1">{item.label}</span>
      {!!count && <CountBadge count={count} />}
    </Link>
  );
}
