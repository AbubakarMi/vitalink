/**
 * Placeholder — UI comes later. The real login mechanics already exist in
 * lib/api/auth.ts (login/loginTotp/loginStartOtpEmail/loginVerifyOtpEmail),
 * branching on LoginResponse.mfaRequired/availableMethods per design doc §9.
 * A form here will bind to thin "use server" wrappers around those functions.
 */
export default function LoginPage() {
  return (
    <main>
      <h1>Log in</h1>
      <p>Form pending — see lib/api/auth.ts for the wired MFA-aware login flow.</p>
    </main>
  );
}
