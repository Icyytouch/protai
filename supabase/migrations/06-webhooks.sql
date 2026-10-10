-- 06-webhooks.sql — customer webhook endpoints for quota/kill-switch events.
create table if not exists webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default array['usage.threshold', 'quota.exhausted', 'kill_switch.toggled'],
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists webhook_endpoints_project_idx on webhook_endpoints (project_id);

alter table webhook_endpoints enable row level security;

-- Service role full access.
drop policy if exists "service_role_all" on webhook_endpoints;
create policy "service_role_all" on webhook_endpoints
  for all to service_role using (true) with check (true);

-- Project owners manage their own endpoints.
drop policy if exists "owner_read" on webhook_endpoints;
create policy "owner_read" on webhook_endpoints
  for select to authenticated
  using (exists (select 1 from projects where projects.id = webhook_endpoints.project_id and projects.owner_id = auth.uid()));
drop policy if exists "owner_write" on webhook_endpoints;
create policy "owner_write" on webhook_endpoints
  for all to authenticated
  using (exists (select 1 from projects where projects.id = webhook_endpoints.project_id and projects.owner_id = auth.uid()))
  with check (exists (select 1 from projects where projects.id = webhook_endpoints.project_id and projects.owner_id = auth.uid()));
