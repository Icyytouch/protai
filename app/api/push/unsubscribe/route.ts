import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/components/supabase/server";
import { removePushSub } from "@/lib/push";

/** POST /api/push/unsubscribe — remove this device's push subscription. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const endpoint = (body as { endpoint?: unknown })?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await removePushSub(user.id, endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't remove subscription." },
      { status: 500 },
    );
  }
}
