-- Atomic balance deduction for ProtAI.
-- Replaces read-modify-write in reportUsage: a single statement, safe under
-- concurrent load. Returns the new balance, or raises on insufficient funds.

create or replace function deduct_balance(
  p_project_id uuid,
  p_meter_id uuid,
  p_end_user_id text,
  p_period text,
  p_units numeric,
  p_quota numeric,
  p_allow_negative boolean default false
)
returns numeric
language plpgsql
as $$
declare
  v_balance numeric;
  v_new numeric;
begin
  -- Lock the row for this transaction. Creates it at 0 if missing.
  insert into balances (project_id, meter_id, end_user_id, period, balance)
  values (p_project_id, p_meter_id, p_end_user_id, p_period, 0)
  on conflict (project_id, meter_id, end_user_id, period) do nothing;

  select balance into v_balance
  from balances
  where project_id = p_project_id
    and meter_id = p_meter_id
    and end_user_id = p_end_user_id
    and period = p_period
  for update;

  v_new := v_balance - p_units;

  if not p_allow_negative and v_new + p_quota < 0 then
    raise exception 'insufficient_quota' using errcode = 'P0001';
  end if;

  update balances
  set balance = v_new
  where project_id = p_project_id
    and meter_id = p_meter_id
    and end_user_id = p_end_user_id
    and period = p_period;

  return v_new;
end;
$$;
