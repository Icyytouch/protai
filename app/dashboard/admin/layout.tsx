import { redirect } from "next/navigation";
import { getUser } from "@/components/supabase/server";
import { getSiteRole, canWritePosts } from "@/lib/roles";
import { PageHeader } from "@/components/ui";


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getUser();
  if (!user) redirect("/login");
  const role = await getSiteRole(user.id);
  if (!canWritePosts(role)) redirect("/dashboard");

  return (
    <>
      <PageHeader title="Site admin" sub={`Signed in as ${role}. Everything about your site, in one place.`} />
      {children}
    </>
  );
}
