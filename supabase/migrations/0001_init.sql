-- Daily Tracker SaaS — initial schema
-- Applies to: Supabase (Postgres). Run in SQL Editor or via `supabase db push`.
--
-- Convention: every per-user table has `user_id uuid references auth.users(id)`
-- and RLS restricts all access to `auth.uid() = user_id`. IDs that were plain
-- strings in the localStorage version (e.g. category id "content") become
-- `text` primary keys so existing seed data can be inserted unchanged.

-- =========================================================================
-- 1. Purchases (Xendit) — created before the user account exists
-- =========================================================================
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  xendit_invoice_id text unique not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'failed')),
  amount integer not null default 20000,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.purchases enable row level security;

-- Only the owning user can read their own purchase record (e.g. to show
-- receipt/status in-app). All writes happen via the webhook using the
-- service_role key, which bypasses RLS entirely — no insert/update policy
-- is needed for normal users.
create policy "purchases_select_own" on public.purchases
  for select using (auth.uid() = user_id);

-- =========================================================================
-- 2. Task Checklist
-- =========================================================================
create table public.categories (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  primary key (user_id, id)
);

create table public.tasks (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  label text not null,
  subtasks jsonb not null default '[]',
  primary key (user_id, id),
  foreign key (user_id, category_id) references public.categories(user_id, id) on delete cascade
);

-- taskId, or "taskId:subtaskId" for a subtask row — mirrors the key format
-- already used by DayLog.tasks in the localStorage version.
create table public.task_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  task_key text not null,
  checked boolean not null default true,
  primary key (user_id, date, task_key)
);

-- =========================================================================
-- 3. Counting Day
-- =========================================================================
create table public.counters (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_value integer not null default 0,
  start_date date not null,
  checked_dates date[] not null default '{}',
  primary key (user_id, id)
);

-- =========================================================================
-- 4. Workout Tracker
-- =========================================================================
create table public.workout_schedule (
  day smallint not null check (day between 0 and 6),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  focus text not null,
  options jsonb,
  primary key (user_id, day)
);

create table public.workout_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null,
  day_index smallint not null check (day_index between 0 and 6),
  done boolean not null default false,
  focus_override text,
  note text,
  primary key (user_id, week_key, day_index)
);

-- =========================================================================
-- 5. Nutrition Tracker
-- =========================================================================
create table public.foods (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kcal numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  note text,
  primary key (user_id, id)
);

create table public.meal_entries (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  food_id text not null,
  grams numeric not null,
  slot text not null check (slot in ('sarapan', 'makan-siang', 'makan-malam', 'snack')),
  primary key (user_id, id),
  foreign key (user_id, food_id) references public.foods(user_id, id) on delete cascade
);

-- =========================================================================
-- 6. Finance — hutang, investasi, transaksi (sensitive data)
-- =========================================================================
create table public.finance_categories (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  primary key (user_id, id)
);

create table public.finance_transactions (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount integer not null,
  category_id text not null,
  date date not null,
  note text,
  primary key (user_id, id),
  foreign key (user_id, category_id) references public.finance_categories(user_id, id) on delete cascade
);

create table public.debts (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  principal integer not null,
  due_date date,
  interest_rate numeric,
  primary key (user_id, id)
);

create table public.debt_payments (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id text not null,
  amount integer not null,
  date date not null,
  primary key (user_id, id),
  foreign key (user_id, debt_id) references public.debts(user_id, id) on delete cascade
);

create table public.investments (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  instrument text not null check (instrument in ('btc', 'lq45', 'emas')),
  type text not null check (type in ('buy', 'sell')),
  amount_idr integer not null,
  price_at_tx numeric not null,
  units numeric not null,
  date date not null,
  primary key (user_id, id)
);

create table public.portfolio_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  total_value numeric not null,
  primary key (user_id, date)
);

-- =========================================================================
-- 7. Settings
-- =========================================================================
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold_api_key text
);

-- =========================================================================
-- Row Level Security — every per-user table gets the same four policies.
-- MVP decision: RLS alone (no field-level encryption) for finance tables —
-- acceptable for this scale, revisit if volume/sensitivity grows.
-- =========================================================================
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'categories', 'tasks', 'task_completions', 'counters',
      'workout_schedule', 'workout_logs', 'foods', 'meal_entries',
      'finance_categories', 'finance_transactions', 'debts', 'debt_payments',
      'investments', 'portfolio_snapshots', 'settings'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
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
