-- ============================================================
-- ProtAI database schema — Supabase Postgres
-- Run this in the Supabase SQL editor (or as a migration).
-- Service-role key bypasses RLS and is used ONLY by server code
-- in app/api/v1/* and the Stripe webhook. Never expose it.
-- ============================================================

-- ---------- Tables ----------

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null,
  kill_switch boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  key_hash text unique not null,          -- SHA-256 hex of the full key; full key is never stored
  key_prefix text not null,               -- e.g. "ptk_a1b2c3" for display
  name text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists meters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  slug text not null,                     -- e.g. "tokens", "images"
  unit_label text not null,               -- e.g. "tokens", "generations"
  monthly_quota numeric not null default 100,
  overage text not null default 'block' check (overage in ('block', 'allow_alert')),
  created_at timestamptz not null default now(),
  unique (project_id, slug)
);

create table if not exists balances (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  meter_id uuid not null references meters (id) on delete cascade,
  end_user_id text not null,              -- the builder's end user (opaque string)
  balance numeric not null default 0,     -- purchased/granted credits; can go negative on allow_alert
  period text not null,                   -- YYYY-MM (UTC); quotas reset per period
  updated_at timestamptz not null default now(),
  unique (project_id, meter_id, end_user_id, period)
);

create table if not exists ledger (
  id bigint generated always as identity primary key,
  project_id uuid not null references projects (id) on delete cascade,
  meter_id uuid not null references meters (id) on delete cascade,
  end_user_id text not null,
  units numeric not null,
  kind text not null check (kind in ('check', 'report', 'adjust', 'grant', 'purchase')),
  balance_after numeric,                  -- balance immediately after this entry (null for checks that change nothing)
  created_at timestamptz not null default now()
);
create index if not exists ledger_lookup_idx
  on ledger (project_id, meter_id, end_user_id, created_at desc);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  meter_id uuid references meters (id) on delete set null,  -- null = all meters in project
  threshold_pct int not null default 80,                     -- fire when usage >= this % of quota
  channel text not null default 'email',
  last_triggered_at timestamptz
);

create table if not exists credit_packs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,                      -- e.g. "1,000 credits"
  units numeric not null,                  -- credits granted per purchase
  price_cents int not null,                -- price in smallest currency unit
  currency text not null default 'usd',
  stripe_payment_link text,                -- optional static link; per-purchase Checkout Sessions preferred (see /api/v1/packs/checkout)
  active boolean not null default true
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  end_user_id text not null,
  pack_id uuid references credit_packs (id) on delete set null,
  stripe_session_id text unique,           -- idempotency key for webhook retries
  units numeric not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  project_id uuid primary key references projects (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text not null default 'free' check (tier in ('free', 'starter', 'pro')),
  status text not null default 'active',
  current_period_end timestamptz
);

-- ---------- Row Level Security ----------
-- Owners may only touch rows belonging to their own projects.
-- The service-role key (server-side only) bypasses RLS.

alter table projects enable row level security;
alter table api_keys enable row level security;
alter table meters enable row level security;
alter table balances enable row level security;
alter table ledger enable row level security;
alter table alerts enable row level security;
alter table credit_packs enable row level security;
alter table purchases enable row level security;
alter table subscriptions enable row level security;

create policy "projects_owner" on projects for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "api_keys_owner" on api_keys for all
  using (exists (select 1 from projects p where p.id = api_keys.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = api_keys.project_id and p.owner_id = auth.uid()));

create policy "meters_owner" on meters for all
  using (exists (select 1 from projects p where p.id = meters.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = meters.project_id and p.owner_id = auth.uid()));

create policy "balances_owner" on balances for all
  using (exists (select 1 from projects p where p.id = balances.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = balances.project_id and p.owner_id = auth.uid()));

create policy "ledger_owner" on ledger for all
  using (exists (select 1 from projects p where p.id = ledger.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = ledger.project_id and p.owner_id = auth.uid()));

create policy "alerts_owner" on alerts for all
  using (exists (select 1 from projects p where p.id = alerts.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = alerts.project_id and p.owner_id = auth.uid()));

create policy "credit_packs_owner" on credit_packs for all
  using (exists (select 1 from projects p where p.id = credit_packs.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = credit_packs.project_id and p.owner_id = auth.uid()));

create policy "purchases_owner" on purchases for all
  using (exists (select 1 from projects p where p.id = purchases.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = purchases.project_id and p.owner_id = auth.uid()));

create policy "subscriptions_owner" on subscriptions for all
  using (exists (select 1 from projects p where p.id = subscriptions.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = subscriptions.project_id and p.owner_id = auth.uid()));

-- ---------- Site roles (admin / editor / author) ----------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'editor', 'author', 'user')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_self_read" on profiles for select
  using (id = auth.uid());
create policy "profiles_staff_read" on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

-- ---------- Blog posts ----------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  meta_title text,
  meta_description text,
  og_image text,
  focus_keyword text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_status_published_idx on posts (status, published_at desc);

alter table posts enable row level security;

-- Public can read published posts.
create policy "posts_public_read" on posts for select
  using (status = 'published');
-- Staff (admin/editor/author) can manage all posts.
create policy "posts_staff_write" on posts for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'editor', 'author')))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'editor', 'author')));

-- ---------- Grants ----------
-- service_role does NOT automatically have table privileges in every project,
-- so grant it explicitly (webhooks + public API bypass RLS via this role).
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
-- Authenticated role needs explicit grants too.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
