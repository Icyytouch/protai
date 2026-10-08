import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, TableShell, Th, Td } from "@/components/ui";
import { CreateKeyButton, RevokeKeyButton } from "./key-buttons";
import { formatDateTime, type ApiKey } from "@/app/dashboard/_types";

export default async function KeysPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const { data } = await supabase
    .from("api_keys")
    .select("id,project_id,key_prefix,name,created_at,last_used_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  const keys = (data as ApiKey[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="API Keys"
        sub="Keys authenticate your app's check() / report() calls. Send as Authorization: Bearer <key>."
        action={<CreateKeyButton projectId={projectId} />}
      />
      {keys.length === 0 ? (
        <EmptyState
          title="No API keys yet"
          sub="Create your first key, then use it in the SDK or a plain HTTP call. The full key is shown exactly once."
          action={<CreateKeyButton projectId={projectId} />}
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Prefix</Th>
              <Th>Created</Th>
              <Th>Last used</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-zinc-900/60">
                <Td className="font-medium text-zinc-100">{k.name}</Td>
                <Td><code className="font-mono text-xs text-zinc-400">{k.key_prefix}…</code></Td>
                <Td className="text-zinc-400">{formatDateTime(k.created_at)}</Td>
                <Td className="text-zinc-400">{k.last_used_at ? formatDateTime(k.last_used_at) : "Never"}</Td>
                <Td className="text-right">
                  <RevokeKeyButton projectId={projectId} keyId={k.id} keyName={k.name} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </>
  );
}
