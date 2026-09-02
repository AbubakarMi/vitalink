import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

/** lib/api/auth.ts's forgotPassword() — real, wired to the backend's
 * ForgotPassword endpoint, which delegates to Zitadel to email the actual
 * reset code/link (see docs/BACKEND_INTEGRATION_GUIDE.md). */
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="Vitalink"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-verified hover:text-ink">
            Back to login
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
