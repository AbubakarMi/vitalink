import { QuoteRequestForm } from "@/components/marketing/quote-request-form";

export default function RequestAQuotePage() {
  return (
    <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-2xl">
        <span className="inline-block rounded-full bg-mint px-3 py-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
          Support
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-newsreader)] text-4xl leading-[1.1] text-ink sm:text-5xl">
          Request a Quote
        </h1>
        <p className="mt-3 text-ink-soft">
          Buying in bulk, need help matching a spec, or want pricing on something not yet listed? Tell us what your
          facility needs and our procurement team will follow up directly.
        </p>

        <div className="mt-10">
          <QuoteRequestForm />
        </div>
      </div>
    </main>
  );
}
