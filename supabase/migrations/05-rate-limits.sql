-- Distributed rate limiting backed by Postgres.
-- Replaces the in-memory per-instance limiter: every Vercel instance now
-- shares the same counters, so limits hold globally.

create table if not exists rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (bucket_key, window_start)
);

alter table rate_limits enable row level security;
grant all on rate_limits to service_role;

-- Atomic increment-and-check in one call. Returns the new count.
create or replace function rate_limit_hit(
  p_bucket_key text,
  p_window_start timestamptz
)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into rate_limits (bucket_key, window_start, count)
  values (p_bucket_key, p_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set count = rate_limits.count + 1
  returning rate_limits.count into v_count;

  return v_count;
end;
$$;

-- Housekeeping: drop windows older than 10 minutes. Run periodically
-- (e.g. via pg_cron or a Vercel cron hitting a cleanup endpoint).
create or replace function rate_limit_cleanup()
returns void
language sql
as $$
  delete from rate_limits where window_start < now() - interval '10 minutes';
$$;
