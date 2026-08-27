import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";

/**
 * Real grid/list view toggle via ?view= query param. Figma's button order
 * (node 1340:444) is grid-icon-first with the teal "active" background, then
 * list-icon second with gray — grid is the default. Uses lucide (like every
 * other icon in this toolbar) instead of the old white-stroke SVGs, which
 * were invisible in both states: "invert" on the dark active background
 * turned white into black-on-dark, and the inactive white background got no
 * invert at all, leaving a white icon on white. currentColor sidesteps that.
 */
export function ViewToggle({ activeView, search }: { activeView: "grid" | "list"; search: string }) {
  function hrefFor(view: "grid" | "list") {
    const params = new URLSearchParams(search);
    if (view === "grid") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  return (
    <div className="flex gap-2">
      <Link
        href={hrefFor("grid")}
        aria-label="Grid view"
        aria-current={activeView === "grid"}
        className={`flex size-11 items-center justify-center rounded-lg border ${activeView === "grid" ? "border-verified bg-verified text-white" : "border-line bg-white text-ink-soft/50"}`}
      >
        <LayoutGrid className="size-5" aria-hidden />
      </Link>
      <Link
        href={hrefFor("list")}
        aria-label="List view"
        aria-current={activeView === "list"}
        className={`flex size-11 items-center justify-center rounded-lg border ${activeView === "list" ? "border-verified bg-verified text-white" : "border-line bg-white text-ink-soft/50"}`}
      >
        <List className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
