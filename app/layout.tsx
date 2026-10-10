import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PageTransition } from "@/components/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProtAI — AI Cost Control & Credit Metering for AI Apps",
  description:
    "Control AI API costs with ProtAI: per-user credit balances, spend alerts, and a kill-switch for OpenAI, Anthropic, and any LLM. Metered billing for AI apps in 3 lines of code.",
  metadataBase: new URL("https://protai.co.uk"),
  keywords: [
    "AI cost control",
    "control AI API costs",
    "LLM cost management",
    "AI spend management",
    "metered billing API",
    "usage-based billing AI",
    "AI credit system",
    "token usage tracking",
    "OpenAI cost control",
  ],
  openGraph: {
    title: "ProtAI — AI Cost Control & Credit Metering for AI Apps",
    description:
      "Per-user credit balances, spend alerts, and a kill-switch for your AI app. Works with OpenAI, Anthropic, and any provider.",
    url: "https://protai.co.uk",
    siteName: "ProtAI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ProtAI — AI Cost Control & Credit Metering for AI Apps",
    description:
      "Per-user credit balances, spend alerts, and a kill-switch for your AI app. Live in 3 lines of code.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col">
        <Suspense fallback={null}>
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </body>
    </html>
  );
}
