/**
 * Buyer shell. NOT the security boundary — layouts don't re-run on every
 * client-side navigation within them (design doc §2.2 correction from Next's own
 * docs), so the authoritative check lives in each page.tsx via
 * requireAccountType("buyer", ...), not here. This layout is for shared UI only
 * (nav, cart icon, etc. — added when the UI is built).
 */
export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
