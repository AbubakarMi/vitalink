/** Reusable green banner — Figma EZER-KEY node 1340:441 (used for "Marketplace" and "Recently Viewed / Recommended"). */
export function Jumbotron({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-[334px] max-w-[1282px] items-center justify-center rounded-[10px] bg-[#e6f4ea] px-10">
      <h1 className="text-center text-4xl font-bold text-verified">{children}</h1>
    </div>
  );
}
