import Link from "next/link";
import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, Card, Badge } from "@/components/ui";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { CreateProjectForm } from "./create-project-form";
import type { Project } from "./_types";

export default async function DashboardHome() {
  const { supabase } = await getUser();
  const { data } = await supabase
    .from("projects")
    .select("id,name,kill_switch,created_at")
    .order("created_at", { ascending: true });
  const projects = (data as Project[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Projects"
        sub="Each project is one AI app with its own API keys, meters, and guardrails."
      />
      <Card className="mb-8">
        <CreateProjectForm />
      </Card>

      {projects.length === 0 ? (
        <>
          <PageHeader
            title="Welcome to ProtAI"
            sub="Let's get your first project metering usage in under two minutes."
          />
          <OnboardingWizard />
        </>
      ) : (
        <>
          <PageHeader
            title="Projects"
            sub="Each project is one AI app with its own API keys, meters, and guardrails."
          />
          <Card className="mb-8">
            <CreateProjectForm />
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/${p.id}`}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-600"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium text-zinc-100 group-hover:text-white">{p.name}</h2>
                {p.kill_switch ? (
                  <Badge tone="red">Kill-switch ON</Badge>
                ) : (
                  <Badge tone="green">Live</Badge>
                )}
              </div>
              <p className="mt-2 font-mono text-xs text-zinc-600">{p.id.slice(0, 8)}…</p>
              <p className="mt-4 text-sm text-emerald-400">Open dashboard →</p>
            </Link>
          ))}
          </div>
        </>
      )}
    </>
  );
}
