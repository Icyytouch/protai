import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/signup", {
    title: "Start Free with ProtAI",
    description:
      "Create a free ProtAI account — per-user credit metering for your AI app in 3 lines of code. No credit card.",
    keywords: "ProtAI signup",
    noindex: true,
  });
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
