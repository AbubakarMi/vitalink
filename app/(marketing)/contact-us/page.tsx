import { Mail, Phone, MapPin } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";

export default function ContactUsPage() {
  return (
    <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
          Support
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-newsreader)] text-4xl leading-[1.1] text-ink sm:text-5xl">
          Contact Us
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Questions about an order, a vendor application, or anything else — send us a message and we&apos;ll get
          back to you.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <ContactForm />

          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Get in touch</p>
              <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 shrink-0 text-verified" aria-hidden />
                  support@vitalink.com
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="size-4 shrink-0 text-verified" aria-hidden />
                  +2349045640982
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-verified" aria-hidden />
                  No 121 Zik Ave. Independence Layout, Enugu
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-mint/50 p-5">
              <p className="text-sm font-medium text-ink">Response time</p>
              <p className="mt-1 text-sm text-ink-soft">We typically reply within one business day.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
