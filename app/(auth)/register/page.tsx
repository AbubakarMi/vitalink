import Link from "next/link";
import { ShoppingBag, Store, ArrowRight } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";

/**
 * Register step 1 of 2 — just the buyer/seller choice, no form fields here.
 * "Seller" maps to the backend's Vendor account type; the route uses
 * /register/vendor (not /register/seller) to stay consistent with the rest
 * of the app's existing "vendor" naming (/vendor/dashboard, /vendor-apply,
 * lib/auth/route-groups.ts's PATH_PREFIX_ACCOUNT_TYPE) even though the
 * button itself says "Seller" to match how buyers actually think about it.
 */
export default function RegisterPage() {
  return (
    <AuthCard
      eyebrow="Vitalink"
      title="Join Vitalink."
      subtitle="How would you like to get started?"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-verified hover:text-ink">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        <Link
          href="/register/buyer"
          className="group flex items-center gap-4 rounded-xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-mint hover:shadow-md"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mint text-ink-soft group-hover:bg-white">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-ink">I&apos;m a Buyer</span>
            <span className="block text-sm text-text-muted">Source and order medical &amp; lab equipment.</span>
          </span>
          <ArrowRight className="size-5 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </Link>

        <Link
          href="/register/vendor"
          className="group flex items-center gap-4 rounded-xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-mint hover:shadow-md"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mint text-ink-soft group-hover:bg-white">
            <Store className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-ink">I&apos;m a Seller</span>
            <span className="block text-sm text-text-muted">List products and fulfill verified orders.</span>
          </span>
          <ArrowRight className="size-5 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </Link>
      </div>
    </AuthCard>
  );
}
