import type { Metadata } from "next";
import "./globals.css";
import { Manrope, Alata, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/lib/cart/store";

// Manrope/Alata/Newsreader match the landing page design (Figma EZER-KEY, node
// 1707:7213) — replaces the create-next-app default (Geist). IBM Plex Mono is
// the landing-page redesign's data/spec-label face (MODEL/STOCK-style tags,
// verification badges) — see globals.css's --color-signal etc.
const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const alata = Alata({ subsets: ["latin"], weight: "400", variable: "--font-alata" });
const newsreader = Newsreader({ subsets: ["latin"], weight: "500", variable: "--font-newsreader" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Vitalink",
  description: "Vitalink — healthcare marketplace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("font-sans", manrope.variable, alata.variable, newsreader.variable, plexMono.variable)}
    >
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
