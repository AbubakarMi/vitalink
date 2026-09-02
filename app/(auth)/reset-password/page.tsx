import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "./reset-password-form";

interface PageProps {
  searchParams: Promise<{ userId?: string; code?: string }>;
}

/** Lands here from the link the backend's ForgotPassword flow emails —
 * userId + code as query params, matching what ConfirmPasswordResetCommand
 * needs (lib/api/auth.ts's resetPassword). No mechanism exists to recover a
 * missing/malformed link short of requesting a new one. */
export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { userId, code } = params;

  if (!userId || !code) {
    return (
      <AuthCard
        eyebrow="Vitalink"
        title="Reset link invalid"
        subtitle="This password reset link is missing information, or has already been used."
        footer={
          <Link href="/login" className="font-medium text-verified hover:text-ink">
            Back to login
          </Link>
        }
      >
        <Link
          href="/forgot-password"
          className="block w-full rounded-xl bg-ink px-6 py-3.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink/85"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Vitalink"
      title="Set a new password"
      subtitle="Choose a new password for your account."
      footer={
        <Link href="/login" className="font-medium text-verified hover:text-ink">
          Back to login
        </Link>
      }
    >
      <ResetPasswordForm userId={userId} code={code} />
    </AuthCard>
  );
}
