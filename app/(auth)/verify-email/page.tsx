import Link from "next/link";
import { CheckCircle2, XCircle, MailQuestion } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { verifyEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

interface PageProps {
  searchParams: Promise<{ userId?: string; code?: string }>;
}

/** Lands here from the link the backend's Register flow emails — userId +
 * code as query params, matching what VerifyEmailCommand needs
 * (lib/api/auth.ts's verifyEmail). Verification itself happens here, on the
 * server, before anything renders — no client interactivity needed for the
 * success/failure case, only for "resend" when userId is known but there's
 * no code (e.g. an expired link). */
export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { userId, code } = await searchParams;

  if (!userId || !code) {
    return (
      <AuthCard
        eyebrow="Vitalink"
        title="Verify your email"
        subtitle="Open the verification link from your inbox to confirm your email address."
        footer={
          <Link href="/login" className="font-medium text-verified hover:text-ink">
            Back to login
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-mint text-verified">
            <MailQuestion className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-ink">This link is missing information — open the one from your email instead.</p>
          {userId && <ResendVerificationButton userId={userId} />}
        </div>
      </AuthCard>
    );
  }

  let error: string | null = null;
  try {
    await verifyEmail(userId, code);
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Something went wrong verifying your email.";
  }

  if (error) {
    return (
      <AuthCard
        eyebrow="Vitalink"
        title="Verification failed"
        subtitle="This link may have expired or already been used."
        footer={
          <Link href="/login" className="font-medium text-verified hover:text-ink">
            Back to login
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#fff0ee] text-[#c0392b]">
            <XCircle className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-[#c0392b]">{error}</p>
          <ResendVerificationButton userId={userId} />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Vitalink"
      title="Email verified"
      subtitle="Your email address is confirmed."
      footer={
        <Link href="/login" className="font-medium text-verified hover:text-ink">
          Continue to login
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-mint text-verified">
          <CheckCircle2 className="size-5" aria-hidden />
        </span>
        <p className="text-sm text-ink">You&apos;re all set — you can sign in now.</p>
      </div>
    </AuthCard>
  );
}
