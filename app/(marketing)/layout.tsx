export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Public shell (nav/footer) goes here — UI comes later. No auth check: this
  // group is intentionally public (design doc §2.1).
  return <>{children}</>;
}
