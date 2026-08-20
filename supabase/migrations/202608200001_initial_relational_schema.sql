create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_valid_due_day_array(days int[])
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(day between 1 and 31), true)
  from unnest(days) as day;
$$;

create or replace function public.assert_income_source_relationships()
returns trigger
language plpgsql
as $$
begin
  if new.wallet_id is not null and not exists (
    select 1 from public.wallets
    where id = new.wallet_id and user_id = new.user_id
  ) then
    raise exception 'wallet_id must belong to the same user';
  end if;

  return new;
end;
$$;

create or replace function public.assert_monthly_income_relationships()
returns trigger
language plpgsql
as $$
begin
  if new.wallet_id is not null and not exists (
    select 1 from public.wallets
    where id = new.wallet_id and user_id = new.user_id
  ) then
    raise exception 'wallet_id must belong to the same user';
  end if;

  if new.source_id is not null and not exists (
    select 1 from public.income_sources
    where id = new.source_id and user_id = new.user_id
  ) then
    raise exception 'source_id must belong to the same user';
  end if;

  return new;
end;
$$;

create or replace function public.assert_category_relationships()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.expense_groups
    where id = new.group_id and user_id = new.user_id
  ) then
    raise exception 'group_id must belong to the same user';
  end if;

  if new.parent_category_id is not null and not exists (
    select 1 from public.expense_categories
    where id = new.parent_category_id and user_id = new.user_id
  ) then
    raise exception 'parent_category_id must belong to the same user';
  end if;

  return new;
end;
$$;

create or replace function public.assert_expense_relationships()
returns trigger
language plpgsql
as $$
begin
  if new.wallet_id is not null and not exists (
    select 1 from public.wallets
    where id = new.wallet_id and user_id = new.user_id
  ) then
    raise exception 'wallet_id must belong to the same user';
  end if;

  if not exists (
    select 1 from public.expense_categories
    where id = new.category_id and user_id = new.user_id
  ) then
    raise exception 'category_id must belong to the same user';
  end if;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_currency char(3) not null default 'USD',
  locale text not null default 'en-US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_default_currency_upper check (default_currency = upper(default_currency))
);

create table public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency_code char(3) not null default 'USD',
  quick_due_date_days int[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_currency_upper check (currency_code = upper(currency_code)),
  constraint app_settings_due_days_valid check (public.is_valid_due_day_array(quick_due_date_days))
);

create table public.financial_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  financial_cycle_start_day smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_settings_cycle_day_valid check (financial_cycle_start_day between 1 and 31)
);

create table public.wallets (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  balance_cents bigint not null default 0,
  currency char(3) not null default 'USD',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint wallets_name_not_blank check (btrim(name) <> ''),
  constraint wallets_currency_upper check (currency = upper(currency))
);

create unique index wallets_user_active_name_idx
  on public.wallets (user_id, lower(name))
  where deleted_at is null;

create table public.income_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  description text not null,
  amount_cents bigint not null,
  currency char(3) not null default 'USD',
  day_of_month smallint not null default 1,
  business_only boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint income_sources_description_not_blank check (btrim(description) <> ''),
  constraint income_sources_currency_upper check (currency = upper(currency)),
  constraint income_sources_day_valid check (day_of_month between 1 and 31)
);

create index income_sources_user_id_idx
  on public.income_sources (user_id, deleted_at, sort_order);

create table public.monthly_income_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.income_sources(id) on delete set null,
  wallet_id uuid references public.wallets(id) on delete set null,
  month_start date not null,
  description text not null,
  amount_cents bigint not null,
  currency char(3) not null default 'USD',
  day_of_month smallint not null default 1,
  business_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint monthly_income_month_first_day check (date_trunc('month', month_start)::date = month_start),
  constraint monthly_income_description_not_blank check (btrim(description) <> ''),
  constraint monthly_income_currency_upper check (currency = upper(currency)),
  constraint monthly_income_day_valid check (day_of_month between 1 and 31)
);

create index monthly_income_user_month_idx
  on public.monthly_income_entries (user_id, month_start)
  where deleted_at is null;

create table public.recurring_expenses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount_cents bigint not null,
  currency char(3) not null default 'USD',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint recurring_expenses_description_not_blank check (btrim(description) <> ''),
  constraint recurring_expenses_currency_upper check (currency = upper(currency))
);

create index recurring_expenses_user_idx
  on public.recurring_expenses (user_id, deleted_at, sort_order);

create table public.expense_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  label text not null,
  color_hex text not null default '#94A3B8',
  icon_key text not null default 'circle-ellipsis',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expense_groups_code_not_blank check (btrim(code) <> ''),
  constraint expense_groups_label_not_blank check (btrim(label) <> ''),
  constraint expense_groups_color_hex_format check (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index expense_groups_user_code_idx
  on public.expense_groups (user_id, upper(code));

create table public.expense_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.expense_groups(id) on delete restrict,
  parent_category_id uuid references public.expense_categories(id) on delete restrict,
  code text not null,
  label text not null,
  color_hex text,
  icon_key text,
  separate_from_expense_totals boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expense_categories_code_not_blank check (btrim(code) <> ''),
  constraint expense_categories_label_not_blank check (btrim(label) <> ''),
  constraint expense_categories_color_hex_format check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index expense_categories_user_code_idx
  on public.expense_categories (user_id, upper(code));

create index expense_categories_user_group_idx
  on public.expense_categories (user_id, group_id, deleted_at, sort_order);

create table public.expenses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  title text not null,
  amount_cents bigint not null,
  currency char(3) not null default 'USD',
  expense_date date not null,
  due_date date,
  paid boolean not null default false,
  month_start date generated always as (
    make_date(extract(year from expense_date)::int, extract(month from expense_date)::int, 1)
  ) stored,
  sync_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expenses_title_not_blank check (btrim(title) <> ''),
  constraint expenses_currency_upper check (currency = upper(currency))
);

create index expenses_user_month_idx
  on public.expenses (user_id, month_start, deleted_at);

create index expenses_user_category_idx
  on public.expenses (user_id, category_id, month_start)
  where deleted_at is null;

create index expenses_user_wallet_idx
  on public.expenses (user_id, wallet_id, month_start)
  where deleted_at is null;

create table public.finance_import_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_schema_version integer,
  source_exported_at timestamptz,
  imported_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb
);

create index finance_import_batches_user_idx
  on public.finance_import_batches (user_id, imported_at desc);

create or replace view public.monthly_expense_totals
with (security_invoker = true)
as
select
  e.user_id,
  e.month_start,
  g.id as group_id,
  g.code as group_code,
  g.label as group_label,
  c.id as category_id,
  c.code as category_code,
  c.label as category_label,
  sum(e.amount_cents) as total_cents,
  count(*) as expense_count
from public.expenses e
join public.expense_categories c on c.id = e.category_id
join public.expense_groups g on g.id = c.group_id
where e.deleted_at is null
  and c.deleted_at is null
  and g.deleted_at is null
  and not c.separate_from_expense_totals
group by e.user_id, e.month_start, g.id, g.code, g.label, c.id, c.code, c.label;

create or replace view public.monthly_wallet_payments
with (security_invoker = true)
as
select
  e.user_id,
  e.month_start,
  e.due_date,
  w.id as wallet_id,
  w.name as wallet_name,
  sum(e.amount_cents) as total_cents,
  count(*) as expense_count
from public.expenses e
left join public.wallets w on w.id = e.wallet_id
where e.deleted_at is null
  and e.paid = true
group by e.user_id, e.month_start, e.due_date, w.id, w.name;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

create trigger financial_settings_set_updated_at
before update on public.financial_settings
for each row execute function public.set_updated_at();

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create trigger income_sources_set_updated_at
before update on public.income_sources
for each row execute function public.set_updated_at();

create trigger income_sources_assert_relationships
before insert or update on public.income_sources
for each row execute function public.assert_income_source_relationships();

create trigger monthly_income_entries_set_updated_at
before update on public.monthly_income_entries
for each row execute function public.set_updated_at();

create trigger monthly_income_entries_assert_relationships
before insert or update on public.monthly_income_entries
for each row execute function public.assert_monthly_income_relationships();

create trigger recurring_expenses_set_updated_at
before update on public.recurring_expenses
for each row execute function public.set_updated_at();

create trigger expense_groups_set_updated_at
before update on public.expense_groups
for each row execute function public.set_updated_at();

create trigger expense_categories_set_updated_at
before update on public.expense_categories
for each row execute function public.set_updated_at();

create trigger expense_categories_assert_relationships
before insert or update on public.expense_categories
for each row execute function public.assert_category_relationships();

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

create trigger expenses_assert_relationships
before insert or update on public.expenses
for each row execute function public.assert_expense_relationships();

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.financial_settings enable row level security;
alter table public.wallets enable row level security;
alter table public.income_sources enable row level security;
alter table public.monthly_income_entries enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.expense_groups enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.finance_import_batches enable row level security;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can manage own app settings"
  on public.app_settings for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own financial settings"
  on public.financial_settings for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own wallets"
  on public.wallets for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own income sources"
  on public.income_sources for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own monthly income entries"
  on public.monthly_income_entries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own recurring expenses"
  on public.recurring_expenses for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own expense groups"
  on public.expense_groups for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own expense categories"
  on public.expense_categories for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own expenses"
  on public.expenses for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own import batches"
  on public.finance_import_batches for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
