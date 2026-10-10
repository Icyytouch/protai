import Link from "next/link";
import { listPosts } from "./_actions";
import { Card, Badge, ButtonLink, EmptyState, TableShell, Th, Td } from "@/components/ui";


export default async function PostsPage() {
  const posts = await listPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{posts.length} post{posts.length === 1 ? "" : "s"}</p>
        <ButtonLink href="/dashboard/admin/posts/new">+ New post</ButtonLink>
      </div>

      {posts.length === 0 ? (
        <Card>
          <EmptyState
            title="No posts yet"
            sub="Write your first post — it will appear at /blog once published."
            action={<ButtonLink href="/dashboard/admin/posts/new">Write the first post</ButtonLink>}
          />
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <TableShell>
            <thead>
              <tr className="border-b border-zinc-800">
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th className="text-right">Open</Th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                  <Td>
                    <Link href={`/dashboard/admin/posts/${p.id}`} className="font-medium text-zinc-100 hover:text-emerald-300">
                      {p.title || <span className="text-zinc-600">(untitled)</span>}
                    </Link>
                    <p className="font-mono text-xs text-zinc-600">/blog/{p.slug}</p>
                  </Td>
                  <Td>
                    <Badge tone={p.status === "published" ? "green" : "neutral"}>
                      {p.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </Td>
                  <Td className="text-zinc-500">
                    {new Date(p.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </Td>
                  <Td className="text-right">
                    <Link href={`/dashboard/admin/posts/${p.id}`} className="text-sm text-zinc-400 hover:text-zinc-100">
                      Edit →
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Card>
      )}
    </div>
  );
}
