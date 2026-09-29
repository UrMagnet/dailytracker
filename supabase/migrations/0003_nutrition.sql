-- Nutrition overhaul: sugar/fibre/sodium per food, household portions, and the
-- AKG profile that drives the daily targets. Safe to re-run.

alter table public.foods add column if not exists category text not null default 'lainnya';
alter table public.foods add column if not exists sugar numeric;
alter table public.foods add column if not exists fiber numeric;
alter table public.foods add column if not exists sodium numeric;
-- [{ "label": "1 potong sedang", "grams": 60 }, …]
alter table public.foods add column if not exists portions jsonb;
-- True for warung/chain food where the recipe varies and the value is a guess.
alter table public.foods add column if not exists estimate boolean not null default false;

alter table public.settings add column if not exists sex text;
alter table public.settings add column if not exists age_years integer;
alter table public.settings add column if not exists target_kcal integer;

notify pgrst, 'reload schema';
