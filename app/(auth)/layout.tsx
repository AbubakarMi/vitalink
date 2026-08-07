export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Public shell, no auth check (design doc §2.1). Auth forms/Server Actions wire
  // up to lib/api/auth.ts when the UI is built.
  return <>{children}</>;
}
