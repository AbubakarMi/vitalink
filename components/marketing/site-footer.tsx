import Image from "next/image";
import Link from "next/link";

/** Figma EZER-KEY node 1707:7213 footer — real link/contact copy from the design. */
export function SiteFooter() {
  return (
    <footer className="bg-surface px-10 py-16">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-12">
        <div>
          <span className="font-alata text-2xl text-brand-primary">VITALINK</span>
          <div className="mt-4 flex gap-2">
            {[0, 1, 2].map((i) => (
              <Image key={i} src="/marketing/social-dot.svg" alt="" width={24} height={24} aria-hidden />
            ))}
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
          <p className="text-sm font-bold text-accent">CONTACT US</p>
          <ul className="mt-4 space-y-3 text-sm text-[#4a7a4a]">
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

      <hr className="mx-auto mt-12 max-w-6xl border-border" />

      <div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-between text-sm text-[#1a4d3e]">
        <p>© 2026 Vitalink.</p>
        <div className="flex gap-6">
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-sm font-bold text-accent">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-[#4a7a4a]">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
