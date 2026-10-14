import { Card } from "@/components/ui";
import { InstallPrompt } from "./install-prompt";
import { PushToggle } from "./push-toggle";

/** "ProtAI on your phone" — install the PWA + enable push alerts. */
export function PhoneAppCard() {
  return (
    <Card className="mb-8 border-emerald-500/20 bg-emerald-500/[0.03]">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <h2 className="font-medium text-zinc-100">ProtAI on your phone</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Install ProtAI as an app and get spend alerts, quota warnings, and kill-switch
            events pushed to your phone — no app store needed.
          </p>
          <div className="mt-4">
            <InstallPrompt />
          </div>
        </div>
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
          <h3 className="mb-3 text-sm font-medium text-zinc-200">Push notifications</h3>
          <PushToggle />
        </div>
      </div>
    </Card>
  );
}
