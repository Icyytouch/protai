"use client";

import { usePathname } from "next/navigation";

/** Fades page content in on every route change. */
export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
