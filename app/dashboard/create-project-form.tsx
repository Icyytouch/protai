"use client";

import { useState } from "react";
import { createProject } from "@/app/dashboard/_actions";
import { Field, inputClass, btnPrimaryClass } from "@/components/ui";

export function CreateProjectForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createProject(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label="New project name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My AI app"
            className={inputClass}
            maxLength={80}
          />
        </Field>
      </div>
      <button type="submit" disabled={loading || !name.trim()} className={btnPrimaryClass}>
        {loading ? "Creating…" : "Create project"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
