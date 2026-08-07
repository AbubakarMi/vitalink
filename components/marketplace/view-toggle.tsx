import Image from "next/image";
import Link from "next/link";

/**
 * Real grid/list view toggle via ?view= query param. Figma's button order
 * (node 1340:444) is grid-icon-first with the teal "active" background, then
 * list-icon second with gray — grid is the default. (An earlier pass had the
 * two icon files swapped between the buttons — fixed here.)
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
        className={`flex size-11 items-center justify-center rounded-md border ${activeView === "grid" ? "border-ink bg-ink" : "border-line bg-white"}`}
      >
        <Image
          src="/marketplace/grid-view-icon.svg"
          alt=""
          width={20}
          height={20}
          className={activeView === "grid" ? "invert" : "opacity-50"}
          aria-hidden
        />
      </Link>
      <Link
        href={hrefFor("list")}
        aria-label="List view"
        aria-current={activeView === "list"}
        className={`flex size-11 items-center justify-center rounded-md border ${activeView === "list" ? "border-ink bg-ink" : "border-line bg-white"}`}
      >
        <Image
          src="/marketplace/list-view-icon.svg"
          alt=""
          width={20}
          height={20}
          className={activeView === "list" ? "invert" : "opacity-50"}
          aria-hidden
        />
      </Link>
    </div>
  );
}
