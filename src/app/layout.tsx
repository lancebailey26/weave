import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider } from 'next-intl';
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
        <Analytics />
      </body>
    </html>
  );
}
