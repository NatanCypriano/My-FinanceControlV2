drop view if exists public.monthly_wallet_payments;
drop view if exists public.monthly_expense_totals;

drop index if exists public.expenses_user_month_idx;
drop index if exists public.expenses_user_category_idx;
drop index if exists public.expenses_user_wallet_idx;

alter table public.expenses
  drop column month_start;

alter table public.expenses
  add column month_start date;

update public.expenses
set month_start = make_date(extract(year from expense_date)::int, extract(month from expense_date)::int, 1)
where month_start is null;

alter table public.expenses
  alter column month_start set not null;

alter table public.expenses
  add constraint expenses_month_start_first_day
  check (date_trunc('month', month_start)::date = month_start);

create index expenses_user_month_idx
  on public.expenses (user_id, month_start, deleted_at);

create index expenses_user_category_idx
  on public.expenses (user_id, category_id, month_start)
  where deleted_at is null;

create index expenses_user_wallet_idx
  on public.expenses (user_id, wallet_id, month_start)
  where deleted_at is null;

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
