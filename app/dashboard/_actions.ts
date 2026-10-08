"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/components/supabase/server";
import { currentPeriod } from "./_types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Verify the project belongs to the current user; 404 otherwise. */
export async function requireProject(projectId: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("projects")
    .select("id,name,kill_switch,created_at")
    .eq("id", projectId)
    .maybeSingle();
  if (!data) notFound();
  return { supabase, project: data as { id: string; name: string; kill_switch: boolean; created_at: string } };
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- Projects ----------

export async function createProject(name: string) {
  const { supabase, user } = await requireUser();
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error("Project name is required.");
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: clean, owner_id: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect(`/dashboard/${(data as { id: string }).id}`);
}

export async function deleteProject(projectId: string) {
  const { supabase } = await requireProject(projectId);
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ---------- API keys ----------

export async function createApiKey(projectId: string, name: string) {
  const { supabase } = await requireProject(projectId);
  const clean = name.trim().slice(0, 80) || "Default key";
  // ptk_ + 32 url-safe chars
  const raw = `ptk_${randomBytes(24).toString("base64url")}`;
  const key_hash = createHash("sha256").update(raw).digest("hex");
  const { data, error } = await supabase
    .from("api_keys")
    .insert({ project_id: projectId, key_hash, key_prefix: raw.slice(0, 12), name: clean })
    .select("id,key_prefix,name,created_at")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/keys`);
  // Full key returned ONCE — never stored, never shown again.
  return { ...(data as { id: string; key_prefix: string; name: string; created_at: string }), key: raw };
}

export async function revokeApiKey(projectId: string, keyId: string) {
  const { supabase } = await requireProject(projectId);
  const { error } = await supabase.from("api_keys").delete().eq("id", keyId).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/keys`);
}

// ---------- Meters ----------

export async function createMeter(
  projectId: string,
  input: { slug: string; unit_label: string; monthly_quota: number; overage: "block" | "allow_alert" }
) {
  const { supabase } = await requireProject(projectId);
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 60);
  if (!slug) throw new Error("Meter slug is required.");
  if (!input.unit_label.trim()) throw new Error("Unit label is required.");
  if (!Number.isFinite(input.monthly_quota) || input.monthly_quota < 0)
    throw new Error("Monthly quota must be a number ≥ 0.");
  const { error } = await supabase.from("meters").insert({
    project_id: projectId,
    slug,
    unit_label: input.unit_label.trim().slice(0, 40),
    monthly_quota: input.monthly_quota,
    overage: input.overage,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/meters`);
}

export async function updateMeter(
  projectId: string,
  meterId: string,
  input: { unit_label: string; monthly_quota: number; overage: "block" | "allow_alert" }
) {
  const { supabase } = await requireProject(projectId);
  if (!Number.isFinite(input.monthly_quota) || input.monthly_quota < 0)
    throw new Error("Monthly quota must be a number ≥ 0.");
  const { error } = await supabase
    .from("meters")
    .update({
      unit_label: input.unit_label.trim().slice(0, 40),
      monthly_quota: input.monthly_quota,
      overage: input.overage,
    })
    .eq("id", meterId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/meters`);
}

export async function deleteMeter(projectId: string, meterId: string) {
  const { supabase } = await requireProject(projectId);
  const { error } = await supabase.from("meters").delete().eq("id", meterId).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/meters`);
}

// ---------- Balances / users ----------

export async function adjustBalance(
  projectId: string,
  input: { meter_id: string; end_user_id: string; units: number; note?: string }
) {
  const { supabase } = await requireProject(projectId);
  const end_user_id = input.end_user_id.trim().slice(0, 200);
  if (!end_user_id) throw new Error("End user ID is required.");
  if (!Number.isFinite(input.units) || input.units === 0) throw new Error("Units must be a non-zero number.");
  const period = currentPeriod();

  const { data: existing } = await supabase
    .from("balances")
    .select("id,balance")
    .eq("project_id", projectId)
    .eq("meter_id", input.meter_id)
    .eq("end_user_id", end_user_id)
    .eq("period", period)
    .maybeSingle();

  const prev = Number((existing as { balance: number } | null)?.balance ?? 0);
  const next = prev + input.units;

  const { error: upErr } = await supabase.from("balances").upsert(
    {
      project_id: projectId,
      meter_id: input.meter_id,
      end_user_id,
      balance: next,
      period,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,meter_id,end_user_id,period" }
  );
  if (upErr) throw new Error(upErr.message);

  const { error: logErr } = await supabase.from("ledger").insert({
    project_id: projectId,
    meter_id: input.meter_id,
    end_user_id,
    units: input.units,
    kind: "adjust",
    balance_after: next,
  });
  if (logErr) throw new Error(logErr.message);

  revalidatePath(`/dashboard/${projectId}/users`);
  revalidatePath(`/dashboard/${projectId}/ledger`);
  return { balance: next };
}

// ---------- Kill switch ----------

export async function toggleKillSwitch(projectId: string, enabled: boolean) {
  const { supabase } = await requireProject(projectId);
  const { error } = await supabase.from("projects").update({ kill_switch: enabled }).eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}`);
}

// ---------- Alerts ----------

export async function createAlert(
  projectId: string,
  input: { meter_id: string | null; threshold_pct: number }
) {
  const { supabase } = await requireProject(projectId);
  if (!Number.isInteger(input.threshold_pct) || input.threshold_pct < 1 || input.threshold_pct > 100)
    throw new Error("Threshold must be a whole number between 1 and 100.");
  const { error } = await supabase.from("alerts").insert({
    project_id: projectId,
    meter_id: input.meter_id,
    threshold_pct: input.threshold_pct,
    channel: "email",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/alerts`);
}

export async function deleteAlert(projectId: string, alertId: string) {
  const { supabase } = await requireProject(projectId);
  const { error } = await supabase.from("alerts").delete().eq("id", alertId).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/alerts`);
}

// ---------- Credit packs ----------

export async function createPack(
  projectId: string,
  input: { name: string; units: number; price_usd: number; stripe_payment_link?: string }
) {
  const { supabase } = await requireProject(projectId);
  if (!input.name.trim()) throw new Error("Pack name is required.");
  if (!Number.isFinite(input.units) || input.units <= 0) throw new Error("Units must be > 0.");
  if (!Number.isFinite(input.price_usd) || input.price_usd <= 0) throw new Error("Price must be > 0.");
  const { error } = await supabase.from("credit_packs").insert({
    project_id: projectId,
    name: input.name.trim().slice(0, 80),
    units: input.units,
    price_cents: Math.round(input.price_usd * 100),
    currency: "usd",
    stripe_payment_link: input.stripe_payment_link?.trim() || null,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/packs`);
}

export async function updatePack(
  projectId: string,
  packId: string,
  input: { name: string; units: number; price_usd: number; stripe_payment_link?: string; active: boolean }
) {
  const { supabase } = await requireProject(projectId);
  if (!input.name.trim()) throw new Error("Pack name is required.");
  if (!Number.isFinite(input.units) || input.units <= 0) throw new Error("Units must be > 0.");
  if (!Number.isFinite(input.price_usd) || input.price_usd <= 0) throw new Error("Price must be > 0.");
  const { error } = await supabase
    .from("credit_packs")
    .update({
      name: input.name.trim().slice(0, 80),
      units: input.units,
      price_cents: Math.round(input.price_usd * 100),
      stripe_payment_link: input.stripe_payment_link?.trim() || null,
      active: input.active,
    })
    .eq("id", packId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/packs`);
}

export async function deletePack(projectId: string, packId: string) {
  const { supabase } = await requireProject(projectId);
  const { error } = await supabase.from("credit_packs").delete().eq("id", packId).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${projectId}/packs`);
}
