"use client";

import { useEffect } from "react";

/** Register the service worker once (PWA installability + push). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline or unsupported — app still works */
    });
  }, []);
  return null;
}
