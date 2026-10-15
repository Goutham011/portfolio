import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Goparaju Goutham Sai | Data Management Analyst",
  description: "Data Management Analyst portfolio — data governance, quality pipelines, and ETL architectures with Python, SQL, BigQuery and Airflow.",
  keywords: ["Data Management Analyst", "Data Governance", "Data Quality", "Data Pipelines", "ETL", "Python", "SQL", "BigQuery", "Airflow", "Apache Spark"],
  authors: [{ name: "Goparaju Goutham Sai" }],
  creator: "Goparaju Goutham Sai",
  publisher: "Goparaju Goutham Sai",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://portfolio.dev",
    title: "Goparaju Goutham Sai | Data Management Analyst",
    description: "Data Management Analyst portfolio — data governance, quality pipelines, and ETL architectures with Python, SQL, BigQuery and Airflow.",
    siteName: "Goutham Sai Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goparaju Goutham Sai | Data Management Analyst",
    description: "Data Management Analyst portfolio — data governance, quality pipelines, and ETL architectures with Python, SQL, BigQuery and Airflow.",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#F2F4F3" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}