import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProtAI — Stop free-tier users burning your AI budget",
  description:
    "ProtAI is drop-in credit metering for AI apps — per-user quotas, spend alerts, kill-switch & Stripe top-ups. Stop free-tier users burning your AI budget.",
  metadataBase: new URL("https://protai.co.uk"),
  openGraph: {
    title: "ProtAI — Stop free-tier users burning your AI budget",
    description:
      "Drop-in credit metering for AI apps — per-user quotas, spend alerts, kill-switch & Stripe top-ups.",
    url: "https://protai.co.uk",
    siteName: "ProtAI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ProtAI — Stop free-tier users burning your AI budget",
    description:
      "Drop-in credit metering for AI apps — per-user quotas, spend alerts, kill-switch & Stripe top-ups.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
