import { redirect } from "next/navigation";
import { getUser } from "@/components/supabase/server";
import { getSiteRole, canManageRoles } from "@/lib/roles";
import { listTeam } from "../posts/_actions";
import { TeamTable } from "./team-table";
import { Card, EmptyState } from "@/components/ui";


export default async function TeamPage() {
  const { user } = await getUser();
  if (!user) redirect("/login");
  const role = await getSiteRole(user.id);
  if (!canManageRoles(role)) redirect("/dashboard/admin/posts");

  const team = await listTeam();

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-medium text-zinc-100">Who can write?</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          <span className="text-zinc-300">Admins</span> manage the site and roles.{" "}
          <span className="text-zinc-300">Editors</span> can publish anything.{" "}
          <span className="text-zinc-300">Authors</span> can write and save drafts.{" "}
          To add someone, have them sign up for a ProtAI account first — then set their role here.
        </p>
      </Card>

      {team.length === 0 ? (
        <Card>
          <EmptyState title="No team members yet" sub="Accounts appear here once they sign up." />
        </Card>
      ) : (
        <TeamTable team={team} currentUserId={user.id} />
      )}
    </div>
  );
}
