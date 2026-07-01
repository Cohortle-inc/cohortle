import type { Metadata } from "next";
// DEPLOYMENT_MARKER: 2025-01-BUILD

import { ConditionalLayout } from "@/components/ConditionalLayout";
import { siteDetails } from "@/data/siteDetails";
import { Providers } from "./providers";

import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL(siteDetails.siteUrl),
  title: {
    default: siteDetails.metadata.title,
    template: `%s | ${siteDetails.siteName}`,
  },
  description: siteDetails.metadata.description,
  keywords: [
    "cohort-based learning",
    "non-formal education",
    "learning management system",
    "educational technology",
    "online learning platform",
    "community learning",
    "collaborative education",
    "learning infrastructure",
    "cohort management",
    "educational platform",
  ],
  authors: [{ name: "Cohortle" }],
  creator: "Cohortle",
  publisher: "Cohortle",
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
  openGraph: {
    type: "website",
    locale: siteDetails.locale,
    url: siteDetails.siteUrl,
    siteName: siteDetails.siteName,
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Cohortle — Purpose-built infrastructure for cohort-based learning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    images: ["/opengraph-image"],
    creator: "@cohortlecom",
    site: "@cohortlecom",
  },
  alternates: {
    canonical: siteDetails.siteUrl,
  },
  verification: {
    google: "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load DM Sans from Google Fonts at runtime (not build time) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5L8S50MSDT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5L8S50MSDT');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <ConditionalLayout>
            <main>{children}</main>
          </ConditionalLayout>
        </Providers>

        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="c0f98709-2ae8-4ce1-9ced-65ba9d269b57"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
