import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "./login-form";

/** Real login — wired to lib/api/auth.ts's login() via ./actions.ts, not a
 * decorative form. MFA (Totp/OtpEmail) is detected but not yet handled with
 * its own UI — see actions.ts's honest message for that case. Suspense
 * boundary is required by LoginForm's useSearchParams() (reads ?redirect=),
 * not for any real loading delay — the fallback is just the form's own
 * shape so there's no visible flash. */
export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="Vitalink"
      title="Welcome back."
      subtitle="Sign in to manage your orders and procurement."
      footer={
        <>
          New to Vitalink?{" "}
          <Link href="/register" className="font-medium text-verified hover:text-ink">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-[268px]" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
