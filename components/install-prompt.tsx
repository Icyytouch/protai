"use client";

import { useEffect, useState } from "react";
import { btnPrimaryClass, btnSecondaryClass } from "@/components/ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * "Install app" button. Uses the browser's beforeinstallprompt when available
 * (Android/Chrome); on iOS shows the manual Add-to-Home-Screen steps.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(isStandalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-400">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        Installed — you're running the app.
      </p>
    );
  }

  async function install() {
    if (!deferred) {
      setShowIosHelp((v) => !v);
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  const isIos = /iphone|ipad|ipod/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : "",
  );

  return (
    <div>
      <button onClick={install} className={deferred ? btnPrimaryClass : btnSecondaryClass}>
        {deferred ? "Install ProtAI app" : "How to install on my phone"}
      </button>
      {(!deferred || showIosHelp) && (
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
          {isIos || !deferred ? (
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                iPhone: open <strong className="text-zinc-200">protai.co.uk</strong> in{" "}
                <strong className="text-zinc-200">Safari</strong>, tap{" "}
                <strong className="text-zinc-200">Share</strong>, then{" "}
                <strong className="text-zinc-200">Add to Home Screen</strong>.
              </li>
              <li>
                Android: open <strong className="text-zinc-200">protai.co.uk</strong> in{" "}
                <strong className="text-zinc-200">Chrome</strong>, tap the{" "}
                <strong className="text-zinc-200">⋮ menu</strong>, then{" "}
                <strong className="text-zinc-200">Install app</strong> (or Add to Home screen).
              </li>
              <li>Open the installed app and log in once — it stays logged in.</li>
            </ol>
          ) : null}
        </div>
      )}
    </div>
  );
}
