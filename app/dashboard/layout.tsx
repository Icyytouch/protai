import { redirect } from "next/navigation";
import { getUser } from "@/components/supabase/server";
import { Shell } from "@/components/dashboard/Shell";

// Dashboard is fully authenticated + request-time: never prerender.
export const instant = false;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("projects")
    .select("id,name")
    .order("created_at", { ascending: true });

  return (
    <Shell
      projects={(data as { id: string; name: string }[] | null) ?? []}
      userEmail={user.email ?? ""}
    >
      {children}
    </Shell>
  );
}
