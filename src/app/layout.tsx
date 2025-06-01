import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://bkrmadtya.github.io/pdf-utility/"),
  title: "PDF Utility - Free Online PDF Tools",
  description:
    "Free online PDF Utility for combining multiple PDF files into one document and converting images to PDF. Select specific pages, preview before merging, and download instantly.",
  keywords: [
    "PDF utility",
    "PDF merger",
    "pdf merge",
    "PDF merge",
    "PDF combiner",
    "merge PDF",
    "combine PDF",
    "PDF tool",
    "free PDF tool",
    "online PDF editor",
    "PDF page selector",
    "PDF preview",
    "image to PDF",
    "convert image to PDF",
    "JPG to PDF",
    "JPEG to PDF",
    "PNG to PDF",
    "WebP to PDF",
    "GIF to PDF",
    "i love pdf",
    "free to use",
    "secure PDF tool",
    "no registration required",
    "no watermarks",
    "no ads",
    "no data collection",
  ],
  authors: [{ name: "PDF Utility" }],
  openGraph: {
    title: "PDF Utility - Free Online PDF Tools",
    description:
      "Free online PDF Utility. Combine multiple PDF files into one document and convert images to PDF. Select specific pages, preview before merging, and download instantly.",
    type: "website",
    url: "https://bkrmadtya.github.io/pdf-utility/",
    siteName: "PDF Utility",
    locale: "en_US",
    images: [
      {
        url: "/icon.svg",
        width: 1200,
        height: 630,
        alt: "PDF Utility - Free Online PDF Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Utility - Free Online PDF Tools",
    description:
      "Free online PDF Utility. Combine multiple PDF files into one document and convert images to PDF. Select specific pages, preview before merging, and download instantly.",
    creator: "@pdfutility",
    images: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://bkrmadtya.github.io/pdf-utility/",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Utility",
  description:
    "Free online PDF Utility. Combine multiple PDF files into one document and convert images to PDF. Select specific pages, preview before merging, and download instantly.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Merge multiple PDF files",
    "Convert images to PDF",
    "Support for JPG, JPEG, PNG, WebP, and GIF formats",
    "Select specific pages",
    "Preview before merging",
    "Instant download",
    "Free to use",
    "No registration required",
    "Secure file handling",
    "No watermarks",
    "Responsive design",
    "Cross-browser compatible",
    "Optimized for performance",
    "Accessible interface",
    "Supports large files",
    "Drag and drop functionality",
    "Mobile-friendly",
    "Fast processing",
    "User-friendly interface",
    "Customizable options",
    "Notifications for completion",
    "I love pdf",
  ],
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  softwareVersion: "1.0.0",
  url: "https://bkrmadtya.github.io/pdf-utility/",
  author: {
    "@type": "Organization",
    name: "PDF Utility",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1250",
  },
  screenshot: {
    "@type": "ImageObject",
    url: "/screenshot.png",
    caption: "PDF Utility Interface",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en" className="scrollbar-thin">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} relative flex flex-col min-h-dvh bg-zinc-950 p-4 py-14 sm:pt-30`}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(#46709c6a_1px,transparent_0px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_45%_35%_at_50%_40%,#000_60%,transparent_100%)] -z-10" />
        <Header />
        {/* <div
          style={{
            color: "white",
            fontSize: "100px",
            fontWeight: "900",
            fontFamily: "Arial, sans-serif",
            textShadow: "0 0 10px #fff",
            letterSpacing: "-10px",
          }}
        >
          <p>P<sup style={{  fontSize: "50px", marginTop: "0", verticalAlign: "0.6em" }}>⛭</sup></p>
        </div> */}
        <main className="flex-grow w-full flex flex-col max-sm:justify-center max-w-4xl mx-auto my-12 sm:my-24 space-y-12">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" expand richColors closeButton />
      </body>
    </html>
  );
};

export default RootLayout;
