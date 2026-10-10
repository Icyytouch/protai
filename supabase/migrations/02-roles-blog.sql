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

-- Grants for the new tables.
grant all on profiles, posts to service_role;
grant select, insert, update, delete on profiles, posts to authenticated;
