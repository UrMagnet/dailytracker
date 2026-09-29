-- Water tracker: per-day intake log + per-user target and reminder settings.
-- Same conventions as 0001: composite (user_id, …) keys and RLS on every table.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.water_entries (
  id      text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date    date not null,
  ml      integer not null check (ml > 0),
  at      text not null,          -- local clock time 'HH:MM', as logged
  primary key (user_id, id)
);

create table if not exists public.water_settings (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  weight_kg         numeric,
  activity          text not null default 'sedang' check (activity in ('ringan', 'sedang', 'berat')),
  target_ml         integer,      -- null = use the weight-based recommendation
  glass_ml          integer not null default 250,
  reminders_enabled boolean not null default false,
  interval_min      integer not null default 90,
  wake_time         text not null default '07:00',
  sleep_time        text not null default '22:00'
);

do $$
declare
  t text;
begin
  for t in select unnest(array['water_entries', 'water_settings'])
  loop
    execute format('alter table public.%I enable row level security', t);

    -- Dropping first keeps this block re-runnable; CREATE POLICY has no
    -- IF NOT EXISTS form.
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_update_own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$s', t);

    execute format(
      'create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- PostgREST caches the schema; without this the API keeps reporting
-- "Could not find the table 'public.water_entries' in the schema cache".
notify pgrst, 'reload schema';
