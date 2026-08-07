import Image from "next/image";
import Link from "next/link";

/** Ink footer — bookends the ink header/hero so the instrument-panel chrome
 * reads as one continuous frame around the lighter content sections. Shared
 * by the marketing and marketplace layouts; a dark footer under lighter page
 * content is a deliberate, common contrast pattern, not a mismatch. */
export function SiteFooter() {
  return (
    <footer className="bg-ink px-10 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-12">
        <div>
          <span className="font-alata text-2xl text-white">VITALINK</span>
          <p className="mt-3 max-w-xs text-sm text-white/60">
            Verified medical, laboratory, and diagnostic equipment procurement.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="#"
              aria-label="Instagram"
              className="flex size-[52px] items-center justify-center rounded-full bg-white"
            >
              <Image src="/marketing/social-instagram-icon.svg" alt="" width={28} height={28} aria-hidden />
            </a>
            <a
              href="#"
              aria-label="X (Twitter)"
              className="flex size-[52px] items-center justify-center rounded-full bg-white"
            >
              <Image src="/marketing/social-x-icon.png" alt="" width={22} height={20} aria-hidden />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="flex size-[52px] items-center justify-center rounded-full bg-white"
            >
              <Image src="/marketing/social-youtube-icon.svg" alt="" width={28} height={19.6} aria-hidden />
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
          <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">Contact us</p>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Image src="/marketing/mail-icon-1.svg" alt="" width={16} height={16} className="invert" aria-hidden />
              support@vitalink.com
            </li>
            <li className="flex items-center gap-2">
              <Image src="/marketing/phone-icon.svg" alt="" width={16} height={16} className="invert" aria-hidden />
              +2349045640982
            </li>
            <li className="flex items-center gap-2">
              <Image src="/marketing/location-icon.svg" alt="" width={16} height={16} className="invert" aria-hidden />
              No 121 Zik Ave. Independence Layout, Enugu
            </li>
          </ul>
        </div>
      </div>

      <hr className="mx-auto mt-12 max-w-6xl border-white/10" />

      <div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-between text-sm text-white/50">
        <p>© 2026 Vitalink.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-white">
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
      <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-white/70">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
