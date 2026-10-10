import { redirect } from "next/navigation";
import { getUser } from "@/components/supabase/server";
import { getSiteRole, canManageRoles } from "@/lib/roles";
import { listTeam } from "../posts/_actions";
import { TeamTable } from "./team-table";
import { InviteForm } from "./invite-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function TeamPage() {
  const { user } = await getUser();
  if (!user) redirect("/login");
  const role = await getSiteRole(user.id);
  if (!canManageRoles(role)) redirect("/dashboard/admin/posts");

  const team = await listTeam();

  return (
    <div className="space-y-6">
      <PageHeader title="Team" sub="Invite members and manage who can do what." />

      <Card>
        <h2 className="font-medium text-zinc-100">Invite a new member</h2>
        <p className="mt-1 text-sm text-zinc-500">
          They'll get an email to set up their account, and arrive with the role you choose.
        </p>
        <div className="mt-5">
          <InviteForm />
        </div>
      </Card>

      <Card>
        <h2 className="font-medium text-zinc-100">What the roles mean</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          <span className="text-zinc-300">Admins</span> manage the site, team, and all settings.{" "}
          <span className="text-zinc-300">Editors</span> can write and publish anything.{" "}
          <span className="text-zinc-300">Authors</span> can write and save drafts.{" "}
          <span className="text-zinc-300">Users</span> are regular customers with no staff access.
        </p>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Current team ({team.length})
        </h2>
        {team.length === 0 ? (
          <Card>
            <EmptyState title="No team members yet" sub="Invite someone above to get started." />
          </Card>
        ) : (
          <TeamTable team={team} currentUserId={user.id} />
        )}
      </div>
    </div>
  );
}
