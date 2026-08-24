import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

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
  title: {
    template: "%s | Veloria",
    default: "Veloria - Lüks Kadın Giyim",
  },
  description:
    "Veloria, modern ve sofistike kadınlar için özel tasarım lüks giyim koleksiyonları sunar. Zarafeti ve kaliteyi keşfedin.",
  keywords: ["lüks giyim", "kadın moda", "özel tasarım", "Veloria", "elbise", "koleksiyon"],
  openGraph: {
    title: "Veloria - Lüks Kadın Giyim",
    description: "Veloria ile zarafeti ve kaliteyi keşfedin.",
    url: "https://veloria.com.tr",
    siteName: "Veloria",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veloria - Lüks Kadın Giyim",
    description: "Veloria ile zarafeti ve kaliteyi keşfedin.",
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
      </body>
    </html>
  );
}
