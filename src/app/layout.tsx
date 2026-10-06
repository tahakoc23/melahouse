import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#171214",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.melahouse.net"),
  title: {
    template: "%s | MELA HOUSE",
    default: "MELA HOUSE | Kadın Giyim & İç Giyim",
  },
  description:
    "MELA HOUSE; elbise, üst ve alt giyim, dış giyim, takım ve iç giyimde seçkin kadın koleksiyonları sunar.",
  keywords: ["lüks giyim", "kadın moda", "ipek elbise", "saten giyim", "MELA HOUSE", "elbise", "koleksiyon"],
  openGraph: {
    title: "MELA HOUSE - Lüks Kadın Giyim",
    description: "MELA HOUSE ile zarafeti ve lüksü keşfedin.",
    url: "https://www.melahouse.net",
    siteName: "MELA HOUSE",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MELA HOUSE - Lüks Kadın Giyim",
    description: "MELA HOUSE ile zarafeti ve lüksü keşfedin.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${bodoni.variable} ${jost.variable}`}>
      <body className="min-h-screen bg-white text-ink antialiased font-sans">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
