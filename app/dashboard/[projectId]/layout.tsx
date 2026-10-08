import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/components/supabase/server";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const { data } = await supabase
    .from("projects")
    .select("id,name,kill_switch")
    .eq("id", projectId)
    .maybeSingle();
  if (!data) notFound();
  const project = data as { id: string; name: string; kill_switch: boolean };

  return (
    <>
      {project.kill_switch && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-300">
              <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-200">KILL-SWITCH ACTIVE</p>
            <p className="text-xs text-red-300/80">
              All check() calls for “{project.name}” are being denied. Turn it off in Overview when you're ready.
            </p>
          </div>
          <Link
            href={`/dashboard/${project.id}`}
            className="shrink-0 rounded-xl border border-red-500/40 px-3.5 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
          >
            Manage
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
