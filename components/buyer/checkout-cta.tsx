"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, UserPlus, X } from "lucide-react";

const REDIRECT_TARGET = "/buyer/checkout";

/**
 * The cart page's "Proceed to Checkout" button. Shared by both
 * components/buyer/cart-view.tsx (mock) and live-cart-view.tsx (real
 * backend cart) since the guest-vs-signed-in decision is identical either
 * way. A signed-in buyer or vendor (isAuthenticated, from the server —
 * app/buyer/cart/page.tsx's verifySession()) goes straight to checkout, same
 * as before. A guest gets asked to log in or register first instead of
 * silently bouncing off requireAccountType's own redirect — both options
 * carry `?redirect=/buyer/checkout` (login-form.tsx / register-form.tsx read
 * it and land back here once they're done) so the cart they just built isn't
 * a dead end.
 */
export function CheckoutCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  if (isAuthenticated) {
    return (
      <Link
        href={REDIRECT_TARGET}
        className="mt-5 flex w-full items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
      >
        Proceed to Checkout
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 flex w-full items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
      >
        Proceed to Checkout
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
                <LogIn className="size-5" aria-hidden />
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-text-muted hover:bg-mint hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-ink">Sign in to check out</h2>
            <p className="mt-2 text-sm text-text-muted">
              Your cart is saved — log in or create an account to pay and place this order.
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href={`/login?redirect=${encodeURIComponent(REDIRECT_TARGET)}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
              >
                <LogIn className="size-4" aria-hidden />
                I already have an account
              </Link>
              <Link
                href={`/register/buyer?redirect=${encodeURIComponent(REDIRECT_TARGET)}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-cream"
              >
                <UserPlus className="size-4" aria-hidden />
                I&apos;m new here
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
