import type { Metadata } from "next";
import "./globals.css";
import { Manrope, Alata, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/lib/cart/store";

// Manrope/Alata/Newsreader match the landing page design (Figma EZER-KEY, node
// 1707:7213) — replaces the create-next-app default (Geist).
const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const alata = Alata({ subsets: ["latin"], weight: "400", variable: "--font-alata" });
const newsreader = Newsreader({ subsets: ["latin"], weight: "500", variable: "--font-newsreader" });

export const metadata: Metadata = {
  title: "Vitalink",
  description: "Vitalink — healthcare marketplace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", manrope.variable, alata.variable, newsreader.variable)}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
