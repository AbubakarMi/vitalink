import Link from "next/link";
import { ArrowRight, MessageCircle, FileText } from "lucide-react";
import { FaqAccordion, type FaqItem } from "@/components/marketing/faq-accordion";

/**
 * Static FAQ content — no backend help-article API exists, so this is
 * genuinely static copy (like Privacy Policy/Terms would be) rather than a
 * fabricated dynamic feed. Grouped around the platform's actual, real
 * features (NAFDAC/FDA badges, vendor verification, mock catalog/cart —
 * see design doc §1) rather than generic marketplace boilerplate.
 */
const FAQ_GROUPS: { title: string; items: FaqItem[] }[] = [
  {
    title: "Ordering & Delivery",
    items: [
      {
        question: "How do I know a listing is genuine medical/lab equipment?",
        answer:
          "Every listing shows its NAFDAC or FDA approval status directly on the product card and detail page, along with the vendor's verification badge. Vitalink doesn't list equipment from vendors who haven't completed compliance review.",
      },
      {
        question: "How can I tell if an item is in stock before ordering?",
        answer:
          "Live stock counts are shown on the marketplace grid and product page, so you can see availability before you order rather than finding out afterward.",
      },
      {
        question: "Can I filter the catalog by brand, category, or price?",
        answer:
          "Yes — the product listing page has a left-hand filter panel for category, price range, and brand, plus keyword search and an AI-assisted search mode for describing what you need in plain language.",
      },
    ],
  },
  {
    title: "Payments & Vendors",
    items: [
      {
        question: "How are vendors verified before they can sell on Vitalink?",
        answer:
          "New vendors submit a business profile, compliance documents, and identity details for review. A Vitalink reviewer checks everything before the vendor's listings go live — you can see a vendor's verification status on their listings.",
      },
      {
        question: "What happens to my payment while an order is being fulfilled?",
        answer:
          "Funds are held until the order is confirmed delivered, then released to the vendor — the same escrow-style protection you'd expect from a marketplace handling real equipment purchases.",
      },
    ],
  },
  {
    title: "For Vendors",
    items: [
      {
        question: "How do I apply to sell on Vitalink?",
        answer:
          "Register a vendor account and complete the application wizard — business profile, identity verification, and compliance documents. You'll see your application status on your dashboard once submitted.",
      },
      {
        question: "Why is my product still pending after I listed it?",
        answer:
          "Every new product listing goes through review before it appears live on the marketplace, the same way vendor applications do. You'll see a \"Pending Review\" status on the listing until it's approved.",
      },
    ],
  },
  {
    title: "Account & Security",
    items: [
      {
        question: "Is my account information secure?",
        answer:
          "Yes. Session authentication and account data are handled server-side, and sensitive actions (payments, document uploads) never expose your credentials to the browser.",
      },
      {
        question: "I can't find an answer to my question here.",
        answer: "Reach out through Contact Us or Request a Quote and a member of the team will follow up directly.",
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
          Support
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-newsreader)] text-4xl leading-[1.1] text-ink sm:text-5xl">
          Help Center
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Answers to common questions about ordering, vendor verification, and payments on Vitalink.
        </p>

        <div className="mt-10 space-y-10">
          {FAQ_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold tracking-wide text-ink-soft uppercase">{group.title}</h2>
              <div className="mt-4">
                <FaqAccordion items={group.items} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/contact-us"
            className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-6 transition-colors hover:border-verified/40"
          >
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <MessageCircle className="size-4 text-verified" aria-hidden />
                Still need help?
              </span>
              <span className="mt-1 block text-sm text-text-muted">Send us a message and we&apos;ll get back to you.</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-text-muted" aria-hidden />
          </Link>
          <Link
            href="/request-a-quote"
            className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-6 transition-colors hover:border-verified/40"
          >
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FileText className="size-4 text-verified" aria-hidden />
                Need a custom quote?
              </span>
              <span className="mt-1 block text-sm text-text-muted">Tell us what equipment you need pricing for.</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-text-muted" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
