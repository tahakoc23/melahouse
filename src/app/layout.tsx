import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#C5A572",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://melahouse.net"),
  title: {
    template: "%s | MELA HOUSE",
    default: "MELA HOUSE - Lüks Kadın Giyim & İpek Koleksiyonlar",
  },
  description:
    "MELA HOUSE, modern ve sofistike kadınlar için özel tasarım lüks giyim, ipek ve saten koleksiyonları sunar. Zarafeti ve lüksü keşfedin.",
  keywords: ["lüks giyim", "kadın moda", "ipek elbise", "saten giyim", "MELA HOUSE", "elbise", "koleksiyon"],
  openGraph: {
    title: "MELA HOUSE - Lüks Kadın Giyim",
    description: "MELA HOUSE ile zarafeti ve lüksü keşfedin.",
    url: "https://melahouse.net",
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
    <html lang="tr" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-cream text-black antialiased font-inter">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
