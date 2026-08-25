import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {
  defaultCategories,
  defaultCategoryGroups,
  type CategoryConfig,
  type CategoryGroupConfig,
  type Expense,
  type FinanceState,
  type IncomeConfig,
  initialFinanceState,
  type RecurringExpenseConfig,
  type WalletConfig
} from '../domain/financeState';

type SupabaseError = { message: string };
type SupabaseResponse = PromiseLike<{ data: unknown; error: SupabaseError | null }>;

type AppSettingsRow = {
  currency_code: string;
  quick_due_date_days: number[];
};

type FinancialSettingsRow = {
  financial_cycle_start_day: number;
};

type WalletRow = {
  id: string;
  name: string;
  balance_cents: number;
  deleted_at: string | null;
};

type IncomeRow = {
  id: string;
  wallet_id: string | null;
  description: string;
  amount_cents: number;
  day_of_month: number;
  business_only: boolean;
  deleted_at: string | null;
};

type MonthlyIncomeRow = IncomeRow & {
  month_start: string;
};

type RecurringExpenseRow = {
  id: string;
  description: string;
  amount_cents: number;
  deleted_at: string | null;
};

type GroupRow = {
  id: string;
  code: string;
  label: string;
  color_hex: string;
  icon_key: string;
  sort_order: number;
  deleted_at: string | null;
};

type CategoryRow = {
  id: string;
  group_id: string;
  parent_category_id: string | null;
  code: string;
  label: string;
  color_hex: string | null;
  icon_key: string | null;
  separate_from_expense_totals: boolean;
  sort_order: number;
  deleted_at: string | null;
};

type ExpenseRow = {
  id: string;
  wallet_id: string | null;
  category_id: string;
  title: string;
  amount_cents: number;
  month_start: string;
  expense_date: string;
  due_date: string | null;
  paid: boolean;
  created_at: string;
  deleted_at: string | null;
};

const TEMPLATE_ID_PREFIX = '00000000-0000-4000-8000-00000000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JWT_ISSUED_AT_FUTURE_RETRY_DELAYS_MS = [500, 1000, 2000];

export async function loadFinanceState(userId: string): Promise<FinanceState> {
  const client = requireSupabase();
  await ensureBaseRows(client, userId);
  await ensureCatalog(client, userId);

  const [
    appSettings,
    financialSettings,
    wallets,
    incomeSources,
    monthlyIncomeEntries,
    recurringExpenses,
    groups,
    categories,
    expenses
  ] = await Promise.all([
    singleOrNull<AppSettingsRow>(client.from('app_settings').select('currency_code, quick_due_date_days').eq('user_id', userId).maybeSingle()),
    singleOrNull<FinancialSettingsRow>(client.from('financial_settings').select('financial_cycle_start_day').eq('user_id', userId).maybeSingle()),
    run<WalletRow[]>(client.from('wallets').select('id, name, balance_cents, deleted_at').eq('user_id', userId).is('deleted_at', null).order('sort_order')),
    run<IncomeRow[]>(client.from('income_sources').select('id, wallet_id, description, amount_cents, day_of_month, business_only, deleted_at').eq('user_id', userId).is('deleted_at', null).order('sort_order')),
    run<MonthlyIncomeRow[]>(client.from('monthly_income_entries').select('id, wallet_id, description, amount_cents, day_of_month, business_only, month_start, deleted_at').eq('user_id', userId).is('deleted_at', null).order('month_start')),
    run<RecurringExpenseRow[]>(client.from('recurring_expenses').select('id, description, amount_cents, deleted_at').eq('user_id', userId).is('deleted_at', null).order('sort_order')),
    run<GroupRow[]>(client.from('expense_groups').select('id, code, label, color_hex, icon_key, sort_order, deleted_at').eq('user_id', userId).order('sort_order')),
    run<CategoryRow[]>(client.from('expense_categories').select('id, group_id, parent_category_id, code, label, color_hex, icon_key, separate_from_expense_totals, sort_order, deleted_at').eq('user_id', userId).order('sort_order')),
    run<ExpenseRow[]>(client.from('expenses').select('id, wallet_id, category_id, title, amount_cents, month_start, expense_date, due_date, paid, created_at, deleted_at').eq('user_id', userId).order('created_at', { ascending: false }))
  ]);

  return rowsToFinanceState({
    appSettings,
    financialSettings,
    wallets,
    incomeSources,
    monthlyIncomeEntries,
    recurringExpenses,
    groups,
    categories,
    expenses
  });
}

export async function saveFinanceState(userId: string, state: FinanceState): Promise<FinanceState> {
  const client = requireSupabase();
  const currencyCode = normalizeCurrency(state.currencyCode);

  await ensureBaseRows(client, userId);
  await saveSettings(client, userId, state, currencyCode);
  const walletIdMap = await syncWallets(client, userId, state.wallets, currencyCode);
  const categoryIdMap = await syncCatalog(client, userId, state.categoryGroups, state.categories);
  await syncIncomeSources(client, userId, state.incomes, walletIdMap, currencyCode);
  await syncMonthlyIncomeEntries(client, userId, state.monthlyIncomeEntries, walletIdMap, currencyCode);
  await syncRecurringExpenses(client, userId, state.recurringExpenses, currencyCode);
  await syncExpenses(client, userId, state.expenses, walletIdMap, categoryIdMap, currencyCode);

  return loadFinanceState(userId);
}

function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

async function run<T = unknown>(request: SupabaseResponse): Promise<T> {
  for (let attempt = 0; attempt <= JWT_ISSUED_AT_FUTURE_RETRY_DELAYS_MS.length; attempt += 1) {
    const { data, error } = await request;
    if (!error) return data as T;

    const retryDelay = JWT_ISSUED_AT_FUTURE_RETRY_DELAYS_MS[attempt];
    if (!isJwtIssuedAtFutureError(error) || retryDelay === undefined) {
      throw new Error(error.message);
    }

    await delay(retryDelay);
  }

  throw new Error('Could not complete Supabase request.');
}

async function singleOrNull<T>(request: SupabaseResponse): Promise<T | null> {
  return run<T | null>(request);
}

function isJwtIssuedAtFutureError(error: SupabaseError): boolean {
  return error.message.toLowerCase().includes('jwt issued at future');
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function ensureBaseRows(client: SupabaseClient, userId: string): Promise<void> {
  await Promise.all([
    run(client.from('profiles').upsert({ id: userId })),
    run(client.from('app_settings').upsert({
      user_id: userId,
      currency_code: initialFinanceState.currencyCode,
      quick_due_date_days: initialFinanceState.quickDueDateDays
    }, { onConflict: 'user_id', ignoreDuplicates: true })),
    run(client.from('financial_settings').upsert({
      user_id: userId,
      financial_cycle_start_day: initialFinanceState.financialCycleStartDay
    }, { onConflict: 'user_id', ignoreDuplicates: true }))
  ]);
}

async function ensureCatalog(client: SupabaseClient, userId: string): Promise<void> {
  let groups = await run<GroupRow[]>(client.from('expense_groups').select('id, code, label, color_hex, icon_key, sort_order, deleted_at').eq('user_id', userId));
  const existingGroupCodes = new Set(groups.map((group) => group.code.toUpperCase()));
  const missingGroups = defaultCategoryGroups.filter((group) => !existingGroupCodes.has(normalizeDbCode(group.code ?? group.label)));

  if (missingGroups.length > 0) {
    await run(client.from('expense_groups').insert(missingGroups.map((group) => ({
      user_id: userId,
      code: normalizeDbCode(group.code ?? group.label),
      label: group.label,
      color_hex: normalizeColor(group.colorHex, '#94A3B8'),
      icon_key: group.iconKey ?? 'tag',
      sort_order: group.sortOrder ?? 0
    }))));
    groups = await run<GroupRow[]>(client.from('expense_groups').select('id, code, label, color_hex, icon_key, sort_order, deleted_at').eq('user_id', userId));
  }

  const fallbackGroupId = groups.find((group) => group.code === 'OTHER')?.id ?? groups[0]?.id;
  if (!fallbackGroupId) return;
  const groupIdByCode = new Map(groups.map((group) => [group.code.toUpperCase(), group.id]));
  const categories = await run<CategoryRow[]>(client.from('expense_categories').select('id, group_id, parent_category_id, code, label, color_hex, icon_key, separate_from_expense_totals, sort_order, deleted_at').eq('user_id', userId));
  const existingCategoryCodes = new Set(categories.map((category) => category.code.toUpperCase()));
  const missingCategories = defaultCategories.filter((category) => !existingCategoryCodes.has(normalizeDbCode(category.code ?? category.label)));

  if (missingCategories.length === 0) return;

  await run(client.from('expense_categories').insert(missingCategories.map((category) => ({
    user_id: userId,
    group_id: groupIdByCode.get(normalizeDbCode(category.group)) ?? fallbackGroupId,
    parent_category_id: null,
    code: normalizeDbCode(category.code ?? category.label),
    label: category.label,
    color_hex: category.colorHex ?? null,
    icon_key: category.iconKey ?? null,
    separate_from_expense_totals: Boolean(category.separateFromTotals),
    sort_order: category.sortOrder ?? 0
  }))));
}

function rowsToFinanceState({
  appSettings,
  financialSettings,
  wallets,
  incomeSources,
  monthlyIncomeEntries,
  recurringExpenses,
  groups,
  categories,
  expenses
}: {
  appSettings: AppSettingsRow | null;
  financialSettings: FinancialSettingsRow | null;
  wallets: WalletRow[];
  incomeSources: IncomeRow[];
  monthlyIncomeEntries: MonthlyIncomeRow[];
  recurringExpenses: RecurringExpenseRow[];
  groups: GroupRow[];
  categories: CategoryRow[];
  expenses: ExpenseRow[];
}): FinanceState {
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const monthlyIncomeMap = monthlyIncomeEntries.reduce<Record<string, IncomeConfig[]>>((result, row) => {
    const month = row.month_start.slice(0, 7);
    result[month] = [
      ...(result[month] ?? []),
      incomeRowToConfig(row)
    ];
    return result;
  }, {});

  return {
    expenses: expenses.map((expense): Expense => ({
      id: expense.id,
      title: expense.title,
      amountCents: Number(expense.amount_cents),
      date: expense.expense_date,
      month: expense.month_start.slice(0, 7),
      dueDate: expense.due_date ?? undefined,
      paid: expense.paid,
      walletId: expense.wallet_id ?? undefined,
      categoryId: expense.category_id,
      createdAt: expense.created_at,
      deletedAt: expense.deleted_at
    })),
    wallets: wallets.map((wallet): WalletConfig => ({
      id: wallet.id,
      name: wallet.name,
      balanceCents: Number(wallet.balance_cents)
    })),
    incomes: incomeSources.map(incomeRowToConfig),
    monthlyIncomeEntries: monthlyIncomeMap,
    recurringExpenses: recurringExpenses.map((expense): RecurringExpenseConfig => ({
      id: expense.id,
      description: expense.description,
      amountCents: Number(expense.amount_cents)
    })),
    categoryGroups: groups.map((group): CategoryGroupConfig => ({
      id: group.id,
      code: group.code,
      label: group.label,
      colorHex: group.color_hex,
      iconKey: group.icon_key,
      sortOrder: group.sort_order,
      deletedAt: group.deleted_at
    })),
    categories: categories.map((category): CategoryConfig => ({
      id: category.id,
      code: category.code,
      label: category.label,
      group: groupById.get(category.group_id)?.label ?? 'Other',
      colorHex: category.color_hex ?? undefined,
      iconKey: category.icon_key ?? undefined,
      sortOrder: category.sort_order,
      separateFromTotals: category.separate_from_expense_totals,
      deletedAt: category.deleted_at
    })),
    financialCycleStartDay: financialSettings?.financial_cycle_start_day ?? initialFinanceState.financialCycleStartDay,
    quickDueDateDays: appSettings?.quick_due_date_days ?? initialFinanceState.quickDueDateDays,
    currencyCode: appSettings?.currency_code ?? initialFinanceState.currencyCode
  };
}

function incomeRowToConfig(row: IncomeRow): IncomeConfig {
  return {
    id: row.id,
    description: row.description,
    amountCents: Number(row.amount_cents),
    day: row.day_of_month,
    businessOnly: row.business_only,
    walletId: row.wallet_id ?? undefined
  };
}

async function saveSettings(client: SupabaseClient, userId: string, state: FinanceState, currencyCode: string): Promise<void> {
  await Promise.all([
    run(client.from('app_settings').upsert({
      user_id: userId,
      currency_code: currencyCode,
      quick_due_date_days: normalizeDueDays(state.quickDueDateDays)
    }, { onConflict: 'user_id' })),
    run(client.from('financial_settings').upsert({
      user_id: userId,
      financial_cycle_start_day: clampDay(state.financialCycleStartDay)
    }, { onConflict: 'user_id' }))
  ]);
}

async function syncWallets(client: SupabaseClient, userId: string, wallets: WalletConfig[], currencyCode: string): Promise<Map<string, string>> {
  const existing = await run<WalletRow[]>(client.from('wallets').select('id, name, balance_cents, deleted_at').eq('user_id', userId));
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const existingByName = new Map(existing.map((row) => [row.name.trim().toLowerCase(), row]));
  const keepIds = new Set<string>();
  const idMap = new Map<string, string>();

  for (const [index, wallet] of wallets.entries()) {
    const matched = existingById.get(wallet.id) ?? existingByName.get(wallet.name.trim().toLowerCase());
    const dbId = matched?.id ?? usableUuid(wallet.id);
    const row = {
      ...(dbId ? { id: dbId } : {}),
      user_id: userId,
      name: wallet.name.trim(),
      balance_cents: wallet.balanceCents,
      currency: currencyCode,
      sort_order: index,
      deleted_at: null
    };
    const saved = await upsertOrInsertId(client, 'wallets', row);
    keepIds.add(saved.id);
    idMap.set(wallet.id, saved.id);
  }

  await softDeleteMissing(client, userId, 'wallets', existing, keepIds);
  return idMap;
}

async function syncIncomeSources(
  client: SupabaseClient,
  userId: string,
  incomes: IncomeConfig[],
  walletIdMap: Map<string, string>,
  currencyCode: string
): Promise<void> {
  const existing = await run<IncomeRow[]>(client.from('income_sources').select('id, wallet_id, description, amount_cents, day_of_month, business_only, deleted_at').eq('user_id', userId));
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const keepIds = new Set<string>();

  for (const [index, income] of incomes.entries()) {
    const matched = existingById.get(income.id);
    const dbId = matched?.id ?? usableUuid(income.id);
    const saved = await upsertOrInsertId(client, 'income_sources', {
      ...(dbId ? { id: dbId } : {}),
      user_id: userId,
      wallet_id: income.walletId ? walletIdMap.get(income.walletId) ?? income.walletId : null,
      description: income.description.trim(),
      amount_cents: income.amountCents,
      currency: currencyCode,
      day_of_month: clampDay(income.day),
      business_only: income.businessOnly,
      sort_order: index,
      deleted_at: null
    });
    keepIds.add(saved.id);
  }

  await softDeleteMissing(client, userId, 'income_sources', existing, keepIds);
}

async function syncMonthlyIncomeEntries(
  client: SupabaseClient,
  userId: string,
  monthlyIncomeEntries: FinanceState['monthlyIncomeEntries'],
  walletIdMap: Map<string, string>,
  currencyCode: string
): Promise<void> {
  const existing = await run<MonthlyIncomeRow[]>(client.from('monthly_income_entries').select('id, wallet_id, description, amount_cents, day_of_month, business_only, month_start, deleted_at').eq('user_id', userId));
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const keepIds = new Set<string>();

  for (const [month, incomes] of Object.entries(monthlyIncomeEntries)) {
    for (const income of incomes) {
      const matched = existingById.get(income.id);
      const dbId = matched?.id ?? usableUuid(income.id);
      const saved = await upsertOrInsertId(client, 'monthly_income_entries', {
        ...(dbId ? { id: dbId } : {}),
        user_id: userId,
        wallet_id: income.walletId ? walletIdMap.get(income.walletId) ?? income.walletId : null,
        source_id: null,
        month_start: `${month}-01`,
        description: income.description.trim(),
        amount_cents: income.amountCents,
        currency: currencyCode,
        day_of_month: clampDay(income.day),
        business_only: income.businessOnly,
        deleted_at: null
      });
      keepIds.add(saved.id);
    }
  }

  await softDeleteMissing(client, userId, 'monthly_income_entries', existing, keepIds);
}

async function syncRecurringExpenses(
  client: SupabaseClient,
  userId: string,
  recurringExpenses: RecurringExpenseConfig[],
  currencyCode: string
): Promise<void> {
  const existing = await run<RecurringExpenseRow[]>(client.from('recurring_expenses').select('id, description, amount_cents, deleted_at').eq('user_id', userId));
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const keepIds = new Set<string>();

  for (const [index, expense] of recurringExpenses.entries()) {
    const matched = existingById.get(expense.id);
    const dbId = matched?.id ?? usableUuid(expense.id);
    const saved = await upsertOrInsertId(client, 'recurring_expenses', {
      ...(dbId ? { id: dbId } : {}),
      user_id: userId,
      description: expense.description.trim(),
      amount_cents: expense.amountCents,
      currency: currencyCode,
      sort_order: index,
      deleted_at: null
    });
    keepIds.add(saved.id);
  }

  await softDeleteMissing(client, userId, 'recurring_expenses', existing, keepIds);
}

async function syncCatalog(
  client: SupabaseClient,
  userId: string,
  groups: CategoryGroupConfig[],
  categories: CategoryConfig[]
): Promise<Map<string, string>> {
  const existingGroups = await run<GroupRow[]>(client.from('expense_groups').select('id, code, label, color_hex, icon_key, sort_order, deleted_at').eq('user_id', userId));
  const existingGroupById = new Map(existingGroups.map((row) => [row.id, row]));
  const existingGroupByCode = new Map(existingGroups.map((row) => [row.code.toUpperCase(), row]));
  const groupKeepIds = new Set<string>();
  const groupIdByClientId = new Map<string, string>();
  const groupIdByLabel = new Map<string, string>();

  for (const [index, group] of groups.entries()) {
    const code = normalizeDbCode(group.code ?? group.label);
    const matched = existingGroupById.get(group.id) ?? existingGroupByCode.get(code);
    const dbId = matched?.id ?? usableUuid(group.id);
    const saved = await upsertOrInsertId(client, 'expense_groups', {
      ...(dbId ? { id: dbId } : {}),
      user_id: userId,
      code,
      label: group.label.trim(),
      color_hex: normalizeColor(group.colorHex, '#94A3B8'),
      icon_key: group.iconKey?.trim() || 'tag',
      sort_order: group.sortOrder ?? index,
      deleted_at: group.deletedAt ?? null
    });
    groupKeepIds.add(saved.id);
    groupIdByClientId.set(group.id, saved.id);
    groupIdByLabel.set(group.label, saved.id);
  }

  await softDeleteMissing(client, userId, 'expense_groups', existingGroups, groupKeepIds);

  const existingCategories = await run<CategoryRow[]>(client.from('expense_categories').select('id, group_id, parent_category_id, code, label, color_hex, icon_key, separate_from_expense_totals, sort_order, deleted_at').eq('user_id', userId));
  const existingCategoryById = new Map(existingCategories.map((row) => [row.id, row]));
  const existingCategoryByCode = new Map(existingCategories.map((row) => [row.code.toUpperCase(), row]));
  const categoryKeepIds = new Set<string>();
  const categoryIdMap = new Map<string, string>();
  const fallbackGroupId = Array.from(groupIdByLabel.values())[0] ?? existingGroups[0]?.id;

  for (const [index, category] of categories.entries()) {
    const code = normalizeDbCode(category.code ?? category.id ?? category.label);
    const matched = existingCategoryById.get(category.id) ?? existingCategoryByCode.get(code);
    const dbId = matched?.id ?? usableUuid(category.id);
    const groupId = groupIdByLabel.get(category.group) ?? fallbackGroupId;
    if (!groupId) continue;

    const saved = await upsertOrInsertId(client, 'expense_categories', {
      ...(dbId ? { id: dbId } : {}),
      user_id: userId,
      group_id: groupId,
      parent_category_id: null,
      code,
      label: category.label.trim(),
      color_hex: category.colorHex && isHexColor(category.colorHex) ? category.colorHex : null,
      icon_key: category.iconKey?.trim() || null,
      separate_from_expense_totals: Boolean(category.separateFromTotals),
      sort_order: category.sortOrder ?? index,
      deleted_at: category.deletedAt ?? null
    });
    categoryKeepIds.add(saved.id);
    categoryIdMap.set(category.id, saved.id);
  }

  await softDeleteMissing(client, userId, 'expense_categories', existingCategories, categoryKeepIds);
  return categoryIdMap;
}

async function syncExpenses(
  client: SupabaseClient,
  userId: string,
  expenses: Expense[],
  walletIdMap: Map<string, string>,
  categoryIdMap: Map<string, string>,
  currencyCode: string
): Promise<void> {
  const existing = await run<ExpenseRow[]>(client.from('expenses').select('id, wallet_id, category_id, title, amount_cents, month_start, expense_date, due_date, paid, created_at, deleted_at').eq('user_id', userId));
  const existingById = new Map(existing.map((row) => [row.id, row]));
  const keepIds = new Set<string>();
  const fallbackCategoryId = Array.from(categoryIdMap.values())[0];

  for (const expense of expenses) {
    const matched = existingById.get(expense.id);
    const dbId = matched?.id ?? usableUuid(expense.id);
    const categoryId = categoryIdMap.get(expense.categoryId) ?? usableUuid(expense.categoryId) ?? fallbackCategoryId;
    if (!categoryId) continue;

    const saved = await upsertOrInsertId(client, 'expenses', {
      ...(dbId ? { id: dbId } : {}),
      user_id: userId,
      wallet_id: expense.walletId ? walletIdMap.get(expense.walletId) ?? expense.walletId : null,
      category_id: categoryId,
      title: expense.title.trim(),
      amount_cents: expense.amountCents,
      currency: currencyCode,
      month_start: `${expense.month || expense.date.slice(0, 7)}-01`,
      expense_date: expense.date,
      due_date: expense.dueDate ?? null,
      paid: expense.paid,
      created_at: expense.createdAt,
      deleted_at: expense.deletedAt ?? null
    });
    keepIds.add(saved.id);
  }

  await softDeleteMissing(client, userId, 'expenses', existing, keepIds);
}

async function upsertOrInsertId(client: SupabaseClient, table: string, row: Record<string, unknown>): Promise<{ id: string }> {
  const query = 'id' in row
    ? client.from(table).upsert(row).select('id').single()
    : client.from(table).insert(row).select('id').single();
  return run<{ id: string }>(query);
}

async function softDeleteMissing(
  client: SupabaseClient,
  userId: string,
  table: string,
  existingRows: Array<{ id: string; deleted_at: string | null }>,
  keepIds: Set<string>
): Promise<void> {
  const idsToDelete = existingRows
    .filter((row) => !row.deleted_at && !keepIds.has(row.id))
    .map((row) => row.id);

  if (idsToDelete.length === 0) return;

  await run(client.from(table).update({ deleted_at: new Date().toISOString() }).eq('user_id', userId).in('id', idsToDelete));
}

function usableUuid(value: string | undefined): string | undefined {
  if (!value || !UUID_PATTERN.test(value) || value.startsWith(TEMPLATE_ID_PREFIX)) return undefined;
  return value;
}

function normalizeDbCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'ITEM';
}

function normalizeCurrency(value: string): string {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : initialFinanceState.currencyCode;
}

function normalizeDueDays(days: number[]): number[] {
  return Array.from(new Set(days.map(clampDay))).sort((left, right) => left - right);
}

function clampDay(value: number): number {
  return Math.min(31, Math.max(1, Math.trunc(value) || 1));
}

function normalizeColor(value: string | undefined, fallback: string): string {
  return value && isHexColor(value) ? value : fallback;
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}
