import webpush from "web-push";
import { createAdminSupabaseClient } from "./supabase-admin";
import { VAPID_PUBLIC_KEY } from "./push-key";

/**
 * Web-push infrastructure. Subscriptions are stored per-user as JSON in the
 * private `site-config` Storage bucket — no SQL migration needed.
 */

const BUCKET = "site-config";
const fileFor = (userId: string) => `push/${userId}.json`;

export type PushSubscriptionJson = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

type Db = ReturnType<typeof createAdminSupabaseClient>;

async function ensureBucket(db: Db): Promise<void> {
  const { error } = await db.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
}

function vapidReady(): boolean {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:support@protai.co.uk",
    VAPID_PUBLIC_KEY,
    privateKey,
  );
  return true;
}

/** All push subscriptions for a user. Never throws. */
export async function getUserPushSubs(userId: string): Promise<PushSubscriptionJson[]> {
  try {
    const db = createAdminSupabaseClient();
    await ensureBucket(db);
    const { data, error } = await db.storage.from(BUCKET).download(fileFor(userId));
    if (error || !data) return [];
    const subs = JSON.parse(await data.text()) as PushSubscriptionJson[];
    return Array.isArray(subs) ? subs.filter((s) => s?.endpoint) : [];
  } catch {
    return [];
  }
}

async function writeUserPushSubs(userId: string, subs: PushSubscriptionJson[]): Promise<void> {
  const db = createAdminSupabaseClient();
  await ensureBucket(db);
  const { error } = await db.storage.from(BUCKET).upload(
    fileFor(userId),
    new Blob([JSON.stringify(subs)], { type: "application/json" }),
    { upsert: true, contentType: "application/json" },
  );
  if (error) throw new Error(error.message);
}

export async function addPushSub(userId: string, sub: PushSubscriptionJson): Promise<void> {
  const subs = await getUserPushSubs(userId);
  const rest = subs.filter((s) => s.endpoint !== sub.endpoint);
  await writeUserPushSubs(userId, [...rest, sub]);
}

export async function removePushSub(userId: string, endpoint: string): Promise<void> {
  const subs = await getUserPushSubs(userId);
  await writeUserPushSubs(
    userId,
    subs.filter((s) => s.endpoint !== endpoint),
  );
}

export type PushPayload = { title: string; body: string; url?: string };

/**
 * Send a push notification to every device a user subscribed.
 * Dead subscriptions (410/404) are pruned automatically. Never throws —
 * push must never break metering or alerts.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    if (!vapidReady()) return;
    const subs = await getUserPushSubs(userId);
    if (subs.length === 0) return;
    const dead: string[] = [];
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys } as webpush.PushSubscription,
            JSON.stringify({ url: "/dashboard", ...payload }),
          );
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) dead.push(sub.endpoint);
          else console.error("[push] send failed:", err);
        }
      }),
    );
    if (dead.length > 0) {
      const alive = subs.filter((s) => !dead.includes(s.endpoint));
      await writeUserPushSubs(userId, alive).catch(() => {});
    }
  } catch (err) {
    console.error("[push] failed:", err);
  }
}
