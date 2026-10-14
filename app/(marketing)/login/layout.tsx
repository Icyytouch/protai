import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/login", {
    title: "Log in to ProtAI",
    description: "Log in to your ProtAI dashboard to manage meters, quotas and API keys.",
    noindex: true,
  });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
