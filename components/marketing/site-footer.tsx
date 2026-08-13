import Image from "next/image";
import Link from "next/link";

/**
 * Light cream footer — restyled to match the client's Ezerhealthcare/
 * HealthBank EHR reference (minimal light footer, plain tracked-uppercase
 * column labels, small print). Shared by the marketing and marketplace
 * layouts.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-12">
        <div>
          <span className="font-alata text-2xl text-ink">VITALINK</span>
          <p className="mt-3 max-w-xs text-sm text-warm-muted">
            Verified medical, laboratory, and diagnostic equipment procurement.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="#"
              aria-label="Instagram"
              className="flex size-[46px] items-center justify-center rounded-full bg-mint"
            >
              <Image src="/marketing/social-instagram-icon.svg" alt="" width={24} height={24} aria-hidden />
            </a>
            <a
              href="#"
              aria-label="X (Twitter)"
              className="flex size-[46px] items-center justify-center rounded-full bg-mint"
            >
              <Image src="/marketing/social-x-icon.png" alt="" width={19} height={17} aria-hidden />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="flex size-[46px] items-center justify-center rounded-full bg-mint"
            >
              <Image src="/marketing/social-youtube-icon.svg" alt="" width={24} height={16.8} aria-hidden />
            </a>
          </div>
        </div>

        <FooterColumn
          title="SHOP"
          links={[
            { label: "Medical Equipment", href: "/products?categorySlug=medical-equipment" },
            { label: "Scientific Tools", href: "/products?categorySlug=scientific-tools" },
            { label: "Reagents & Culture Media", href: "/products?categorySlug=reagents-culture-media" },
            { label: "Lab Equipments", href: "/products?categorySlug=lab-equipment" },
          ]}
        />

        <FooterColumn
          title="SUPPORT"
          links={[
            { label: "Help Center", href: "#" },
            { label: "Request a Quote", href: "#" },
            { label: "Contact Us", href: "#" },
          ]}
        />

        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-ink-soft uppercase">Contact us</p>
          <ul className="mt-4 space-y-3 text-sm text-warm-muted">
            <li className="flex items-center gap-2">
              <Image src="/marketing/mail-icon-1.svg" alt="" width={16} height={16} aria-hidden />
              support@vitalink.com
            </li>
            <li className="flex items-center gap-2">
              <Image src="/marketing/phone-icon.svg" alt="" width={16} height={16} aria-hidden />
              +2349045640982
            </li>
            <li className="flex items-center gap-2">
              <Image src="/marketing/location-icon.svg" alt="" width={16} height={16} aria-hidden />
              No 121 Zik Ave. Independence Layout, Enugu
            </li>
          </ul>
        </div>
      </div>

      <hr className="mx-auto mt-12 max-w-6xl border-line" />

      <div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-between text-sm text-warm-muted">
        <p>© 2026 Vitalink.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-ink">
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.15em] text-ink-soft uppercase">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-warm-muted">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
