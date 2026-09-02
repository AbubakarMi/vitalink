import { NextResponse } from "next/server";
import { getCart, getCheckoutQuote } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { verifySession } from "@/lib/auth/dal";

/**
 * Reads the real cart — a Route Handler, not a plain server function called
 * from a page, because GetCart can mint a fresh guest-cart cookie on a
 * visitor's first-ever request (Next.js only allows cookies().set() from a
 * Server Action or Route Handler, never a Server/Client Component's
 * render) — see lib/api/cart.ts's file comment. LiveCartView (client)
 * fetches this on mount instead of a page awaiting getCart() directly.
 *
 * Also fetches a checkout quote (pricing) when signed in — GetCheckoutQuote
 * is authenticated-only, so a guest's cart genuinely has no price to show
 * yet, only item names/quantities/stock; `quote` comes back null for them.
 */
export async function GET() {
  try {
    const session = await verifySession();
    const [cart, quote] = await Promise.all([
      getCart(),
      session ? getCheckoutQuote().catch(() => null) : Promise.resolve(null),
    ]);
    return NextResponse.json({ cart, quote });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: "Couldn't load your cart." }, { status });
  }
}
