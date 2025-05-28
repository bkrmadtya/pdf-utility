import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDF Merger - Merge PDF Files Online",
  description:
    "Free online PDF merger tool. Combine multiple PDF files into one document. Select specific pages, preview before merging, and download instantly.",
  keywords: "PDF merger, PDF combiner, merge PDF files, combine PDFs, PDF tool, online PDF merger",
  authors: [{ name: "PDF Utility" }],
  openGraph: {
    title: "PDF Merger - Merge PDF Files Online",
    description:
      "Free online PDF merger tool. Combine multiple PDF files into one document. Select specific pages, preview before merging, and download instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Merger - Merge PDF Files Online",
    description:
      "Free online PDF merger tool. Combine multiple PDF files into one document. Select specific pages, preview before merging, and download instantly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Merger",
  description:
    "Free online PDF merger tool. Combine multiple PDF files into one document. Select specific pages, preview before merging, and download instantly.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Merge multiple PDF files",
    "Select specific pages",
    "Preview before merging",
    "Instant download",
    "Free to use",
  ],
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  softwareVersion: "1.0.0",
  url: "https://pdf-utility.vercel.app",
  author: {
    "@type": "Organization",
    name: "PDF Utility",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
