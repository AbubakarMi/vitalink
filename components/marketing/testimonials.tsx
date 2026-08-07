/**
 * Figma EZER-KEY node 1707:7213 "What our customers are saying" section.
 * PLACEHOLDER CONTENT: these quotes come directly from the Figma file, which
 * itself repeats the same two names/quotes across four cards — padding two
 * placeholders into four identical-looking cards reads as inflated social
 * proof. Shown here as the two distinct quotes the design actually has,
 * framed as early feedback rather than a wall of "customers," and must be
 * replaced with real reviews before launch.
 */
const testimonials = [
  { name: "David Chimobi", quote: "This is my first experience with intelligent shopping and I'm amazed." },
  {
    name: "Victor Ebere",
    quote:
      "I'm blown away by how the AI was able to understand my intent and made my shopping seamless. The delivery is also topnotch.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-paper px-10 py-20">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs tracking-[0.2em] text-verified uppercase">Early feedback</p>
        <h2 className="mt-2 font-[family-name:var(--font-newsreader)] text-3xl text-ink">From the first users</h2>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.name} className="rounded-[10px] border border-line bg-surface p-6">
              <blockquote className="text-[15px] text-ink-soft">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 font-mono text-xs text-text-muted">— {testimonial.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
