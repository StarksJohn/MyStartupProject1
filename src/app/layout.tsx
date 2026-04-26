import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
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

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Fracture Recovery Companion",
    template: "%s | Fracture Recovery Companion",
  },
  description:
    "A calm, evidence-aware companion for your post-fracture recovery journey. Daily structure, safety checks, and AI guidance you can actually use.",
  applicationName: "Fracture Recovery Companion",
  keywords: [
    "fracture recovery",
    "post-injury rehab",
    "recovery plan",
    "bone healing",
    "rehabilitation companion",
  ],
  authors: [{ name: "Fracture Recovery Companion Team" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Fracture Recovery Companion",
    title: "Fracture Recovery Companion",
    description:
      "A calm, evidence-aware companion for your post-fracture recovery journey.",
    url: APP_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fracture Recovery Companion",
    description:
      "A calm, evidence-aware companion for your post-fracture recovery journey.",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-dvh bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
