import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SatQuery AI — Agentic Remote Sensing Intelligence",
  description:
    "SatQuery AI is an intelligent satellite image analysis assistant. Upload optical or SAR imagery and ask natural-language questions to receive expert geospatial insights, change detection, and land-cover analysis.",
  keywords: "satellite imagery, remote sensing, SAR, optical, change detection, land cover, ISRO, AI analysis",
  openGraph: {
    title: "SatQuery AI",
    description: "Agentic Remote Sensing Intelligence Platform",
    type: "website",
  },
  icons: {
    icon: "/satquery-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
        {children}
      </body>
    </html>
  );
}
