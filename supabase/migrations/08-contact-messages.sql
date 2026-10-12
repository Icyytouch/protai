-- 08-contact-messages.sql — contact form submissions.
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);

alter table contact_messages enable row level security;

-- Service role full access (API route inserts with the admin client).
drop policy if exists "service_role_all" on contact_messages;
create policy "service_role_all" on contact_messages
  for all to service_role using (true) with check (true);
