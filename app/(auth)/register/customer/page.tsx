import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "../register-form";

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export const instant = false; // reads searchParams — genuinely dynamic

/** Register step 2 of 2 for customers — the actual form. No multi-step
 * onboarding design exists for customers (only vendor — see /register/vendor),
 * so this stays a single-page form. Not reachable without picking a role
 * first on /register. ?redirect= (from components/customer/checkout-cta.tsx's
 * guest prompt, most commonly /customer/checkout) is carried through the
 * footer/"Change" links so switching to login or back to the role chooser
 * doesn't drop it — RegisterForm reads it separately client-side (it needs
 * useSearchParams() itself, hence the Suspense boundary) for its own
 * post-success "Go to login" link. */
export default async function CustomerRegisterPage({ searchParams }: PageProps) {
  const { redirect } = await searchParams;
  const suffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <AuthCard
      eyebrow="Vitalink"
      title="Create your customer account."
      subtitle="Source and order medical, lab, and diagnostic equipment."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login${suffix}`} className="font-medium text-verified hover:text-ink">
            Log in
          </Link>
        </>
      }
    >
      <Link href={`/register${suffix}`} className="mb-5 inline-block text-xs text-text-muted hover:text-ink">
        ← Not a customer? Change
      </Link>
      <Suspense fallback={null}>
        <RegisterForm accountType="Customer" roleLabel="customer" />
      </Suspense>
    </AuthCard>
  );
}
