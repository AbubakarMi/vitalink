import Link from "next/link";
import { User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AccountMenu } from "@/components/ui/account-menu";
import { verifySession } from "@/lib/auth/dal";
import type { AccountType } from "@/lib/auth/session";

/**
 * The account-aware slot every public header (SiteHeader on the marketing
 * homepage, MarketplaceHeader on /products & friends) ends its nav with:
 * "Login"/"Sign Up" for a guest, the real account menu for anyone already
 * signed in. Split out so both headers share one implementation instead of
 * two copies drifting apart — see MarketplaceHeader's original version,
 * which is where this logic first lived.
 *
 * Split into its own subcomponent (rather than making the whole header
 * async) so pages that reuse these headers — notably static-prerendered
 * pages — keep their static shell under Cache Components/PPR instead of the
 * cookies() read forcing the entire route dynamic; wrap every usage in
 * <Suspense fallback={<AccountSlotFallback />}>.
 */

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  Customer: "Buyer",
  Vendor: "Vendor",
  Staff: "Staff",
};

/** Extra menu links on top of "Sign Out" — a signed-in visitor on a public
 * page still needs a way to their real dashboard, and everyone here can
 * shop, so "My Orders" always applies (route-groups.ts opens /buyer/orders
 * to Vendor sessions too, on top of Customer). */
function accountMenuLinks(accountType: AccountType): { href: string; label: string }[] {
  const links = [{ href: "/buyer/orders", label: "My Orders" }];
  if (accountType === "Vendor") links.push({ href: "/vendor/dashboard", label: "Vendor Dashboard" });
  if (accountType === "Staff") links.push({ href: "/admin/dashboard", label: "Admin Dashboard" });
  return links;
}

export async function AccountSlot() {
  const session = await verifySession();

  if (!session) {
    return (
      <Link
        href="/login"
        className={buttonVariants({
          className: "gap-2 rounded-lg bg-ink px-5 font-medium !text-white hover:bg-ink/85",
        })}
      >
        Login
        <User className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <AccountMenu
      name={session.displayName || session.email}
      badge={ACCOUNT_TYPE_LABEL[session.accountType] ?? session.accountType}
      links={accountMenuLinks(session.accountType)}
    />
  );
}

export function AccountSlotFallback() {
  return <span className="block h-10 w-24 animate-pulse rounded-lg bg-mint" aria-hidden />;
}
