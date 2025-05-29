import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDF Merger - Free Online Tool",
  description:
    "Combine multiple PDF files into one document. Select specific pages, preview before merging, and download instantly.",
  keywords: ["PDF merger", "PDF combiner", "merge PDF", "combine PDF", "PDF tool", "free PDF tool"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-thin">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-dvh bg-zinc-950 relative p-4`}>
        <div className="absolute inset-0 bg-[radial-gradient(#3f69956a_1px,transparent_0px)] bg-[size:18px_18px] sm:bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_45%_35%_at_50%_40%,#000_60%,transparent_100%)]"></div>
        <div className="relative">{children}</div>
        <Toaster position="top-right" expand richColors closeButton />
      </body>
    </html>
  );
}
