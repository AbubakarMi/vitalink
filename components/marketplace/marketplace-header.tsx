import { Suspense } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CartIcon } from "@/components/marketplace/cart-icon";
import { verifySession } from "@/lib/auth/dal";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  Customer: "Buyer",
  Vendor: "Vendor",
  Staff: "Staff",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/**
 * Header for the marketplace/products listing + detail pages. Ink chrome so
 * it reads as the same instrument-panel brand as SiteHeader on the landing
 * page, rather than a different white header living in the same app.
 *
 * The design shows a hardcoded cart count ("85"), a notification bell with a
 * fabricated "99" badge, and a stock avatar photo — all Figma placeholder
 * data. CartIcon shows the real client-side cart count; there's no
 * notification system on the backend yet so the bell is omitted rather than
 * showing a fake count; the avatar is initials-based instead of a fake photo
 * (design doc §1's no-fabrication principle). This is a public page — it
 * reads the session but never redirects unauthenticated visitors away.
 *
 * The account slot is split into its own Suspense-wrapped subcomponent
 * (rather than making this whole header async) so pages that reuse it —
 * notably the static-prerendered product detail page — keep their static
 * shell under Cache Components/PPR instead of the cookies() read forcing
 * the entire route dynamic.
 */
export function MarketplaceHeader() {
  return (
    <>
      <div className="h-[3px] bg-signal" />
      <header className="border-b border-white/10 bg-ink px-10 py-5">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-8">
          <Link href="/" className="font-alata text-2xl tracking-tight text-white">
            VITALINK
          </Link>

          <div className="ml-auto flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs tracking-wide text-white/60 uppercase">Cart</span>
              <CartIcon />
            </div>

            <Suspense fallback={<AccountSlotFallback />}>
              <AccountSlot />
            </Suspense>
          </div>
        </div>
      </header>
    </>
  );
}

async function AccountSlot() {
  const session = await verifySession();

  if (!session) {
    return (
      <Link
        href="/login"
        className={buttonVariants({
          className: "gap-2 rounded-md bg-white px-5 font-medium !text-[#002708] hover:bg-white/85",
        })}
      >
        Login
        <User className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex size-10 items-center justify-center rounded-full bg-signal text-sm font-bold text-ink">
        {initials(session.displayName || session.email)}
      </span>
      <div className="flex flex-col">
        <span className="text-xs text-white">{session.displayName || session.email}</span>
        <span className="w-fit rounded-[10px] bg-white/10 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-signal uppercase">
          {ACCOUNT_TYPE_LABEL[session.accountType] ?? session.accountType}
        </span>
      </div>
    </div>
  );
}

function AccountSlotFallback() {
  return <span className="block h-10 w-24 animate-pulse rounded-md bg-white/10" aria-hidden />;
}
