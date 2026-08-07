import Image from "next/image";

/**
 * Figma EZER-KEY node 1707:7213 "What our customers are saying" section.
 * PLACEHOLDER CONTENT: these quotes/names come directly from the Figma file
 * (which itself repeats two names/quotes across the four cards) — they are
 * not real customer testimonials and must be replaced before launch.
 */
const testimonials = [
  { name: "David Chimobi", quote: "This is my first experience with intelligent shopping and im amazed," },
  { name: "David Chimobi", quote: "This is my first experience with intelligent shopping and im amazed," },
  {
    name: "Victor Ebere",
    quote:
      "I'm blown away by how the AI was able to understand my intent and made my shopping seamless. The delivery is also topnotch.",
  },
  {
    name: "Victor Ebere",
    quote:
      "I'm blown away by how the AI was able to understand my intent and made my shopping seamless. The delivery is also topnotch.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-surface-muted px-10 py-12">
      <h2 className="text-center text-2xl font-bold text-[#0f3e17]">What our customers are saying</h2>
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((testimonial, i) => (
          <div key={i} className="rounded-[10px] bg-surface p-5">
            <Image src="/marketing/star-rating.svg" alt="5 out of 5 stars" width={98} height={23} />
            <p className="mt-3 text-sm font-medium text-black">{testimonial.name}</p>
            <p className="mt-1 text-sm text-black">&ldquo;{testimonial.quote}&rdquo;</p>
          </div>
        ))}
      </div>
    </section>
  );
}
