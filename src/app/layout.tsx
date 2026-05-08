import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider } from 'next-intl';
import Link from "next/link";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Weave",
  description: "Daily timeline ordering game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <NextIntlClientProvider>
          <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY}>
            {children}
          </ClerkProvider>
        </NextIntlClientProvider>
        <footer className="siteFooter" aria-label="Legal links">
          <nav className="siteFooterNav">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/acceptable-use">Acceptable Use</Link>
            <Link href="/subprocessors">Subprocessors</Link>
          </nav>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
