import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "../register-form";

/** Register step 2 of 2 for buyers — the actual form. No multi-step
 * onboarding design exists for buyers (only vendor — see /register/vendor),
 * so this stays a single-page form. Not reachable without picking a role
 * first on /register. */
export default function BuyerRegisterPage() {
  return (
    <AuthCard
      eyebrow="Vitalink"
      title="Create your buyer account."
      subtitle="Source and order medical, lab, and diagnostic equipment."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-verified hover:text-ink">
            Log in
          </Link>
        </>
      }
    >
      <Link href="/register" className="mb-5 inline-block text-xs text-text-muted hover:text-ink">
        ← Not a buyer? Change
      </Link>
      <RegisterForm accountType="Customer" roleLabel="buyer" />
    </AuthCard>
  );
}
