"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setRole } from "../posts/_actions";
import { Card, Badge, TableShell, Th, Td } from "@/components/ui";
import type { SiteRole } from "@/lib/roles";

const ROLES: SiteRole[] = ["admin", "editor", "author", "user"];

export function TeamTable({ team, currentUserId }: {
  team: Array<{ id: string; role: SiteRole; display_name: string | null; email: string | null }>;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (id: string, role: SiteRole) => {
    setError(null);
    startTransition(async () => {
      const res = await setRole(id, role);
      if (!res.ok) setError(res.error ?? "Could not update the role.");
      else router.refresh();
    });
  };

  return (
    <Card className="!p-0 overflow-hidden">
      {error && <p className="border-b border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-300">{error}</p>}
      <TableShell>
        <thead>
          <tr className="border-b border-zinc-800">
            <Th>User</Th>
            <Th>Role</Th>
            <Th className="text-right">Change role</Th>
          </tr>
        </thead>
        <tbody>
          {team.map((m) => (
            <tr key={m.id} className="border-b border-zinc-800/60 last:border-0">
              <Td>
                <p className="font-medium text-zinc-100">{m.display_name || m.email || "Unknown user"}</p>
                {m.email && m.display_name && <p className="text-xs text-zinc-500">{m.email}</p>}
                {m.id === currentUserId && <p className="text-xs text-zinc-600">That's you</p>}
              </Td>
              <Td>
                <Badge tone={m.role === "admin" ? "green" : m.role === "user" ? "neutral" : "neutral"}>
                  {m.role}
                </Badge>
              </Td>
              <Td className="text-right">
                {m.id === currentUserId ? (
                  <span className="text-xs text-zinc-600">—</span>
                ) : (
                  <select
                    value={m.role}
                    disabled={pending}
                    onChange={(e) => change(m.id, e.target.value as SiteRole)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Card>
  );
}
