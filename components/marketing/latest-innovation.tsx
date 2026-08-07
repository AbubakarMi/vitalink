import Image from "next/image";
import { Button } from "@/components/ui/button";

/** Figma EZER-KEY node 1707:7213 "The Latest Innovation" banner. */
export function LatestInnovation() {
  return (
    <section className="mx-auto max-w-5xl px-10 py-12 text-center">
      <div className="flex items-center justify-center gap-6">
        <h2 className="text-2xl font-bold text-[#0f3e17]">The Latest Innovation</h2>
        <Button variant="outline" className="rounded-[5px] border-black/10 text-[#1a4d3e]">
          Subscribe
        </Button>
      </div>
      <p className="mt-4 text-[#0f3e17]">Swallowable, Remote-Controlled, Robot Toured the Stomach</p>
      <div className="relative mx-auto mt-6 aspect-[970/476] w-full max-w-3xl overflow-hidden rounded-[10px]">
        <Image
          src="/marketing/innovation-capsule.png"
          alt="Swallowable remote-controlled diagnostic capsule robot"
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
}
