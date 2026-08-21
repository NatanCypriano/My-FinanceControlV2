import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Bus,
  CalendarDays,
  Car,
  CarTaxiFront,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CircleEllipsis,
  Coffee,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Dumbbell,
  Fuel,
  Gamepad2,
  GitBranch,
  Gift,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  Layers3,
  LogOut,
  Mail,
  Menu,
  Pill,
  Pizza,
  Plane,
  Plug,
  Pencil,
  Plus,
  Receipt,
  ReceiptText,
  Repeat,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Tag,
  Tags,
  Ticket,
  Trash2,
  Tv,
  UserCircle,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { isSupabaseConfigured, supabase } from './backend/supabaseClient';
import { loadFinanceState, saveFinanceState } from './backend/financeRepository';
import {
  defaultCategories,
  defaultCategoryGroups,
  initialFinanceState,
  type CategoryConfig,
  type CategoryGroupConfig,
  type Expense,
  type FinancialSection,
  type FinanceState,
  type IncomeConfig,
  type RecurringExpenseConfig,
  type SettingsSection,
  type View,
  type VisualizeSection,
  type WalletConfig
} from './domain/financeState';

type AuthMode = 'SIGN_IN' | 'SIGN_UP';
type ToastTone = 'success' | 'error' | 'warning' | 'info';
type ToastItem = {
  id: string;
  tone: ToastTone;
  text: string;
};
type NotifyFn = (toast: Omit<ToastItem, 'id'>) => void;
type IncomeEditDraft = { description: string; amount: string; day: string; businessOnly: boolean; walletId: string };
type RecurringEditDraft = { description: string; amount: string };
type WalletEditDraft = { name: string; amount: string };
type GroupEditDraft = { code: string; label: string; colorHex: string; iconKey: string; sortOrder: string };
type CategoryEditDraft = { code: string; label: string; group: string; colorHex: string; iconKey: string; sortOrder: string; separateFromTotals: boolean };
type IconOption = { key: string; label: string; Icon: LucideIcon };

const catalogIconOptions: IconOption[] = [
  { key: 'tag', label: 'Tag', Icon: Tag },
  { key: 'tags', label: 'Tags', Icon: Tags },
  { key: 'circle-ellipsis', label: 'Circle ellipsis', Icon: CircleEllipsis },
  { key: 'utensils', label: 'Utensils', Icon: Utensils },
  { key: 'shopping-cart', label: 'Shopping cart', Icon: ShoppingCart },
  { key: 'pizza', label: 'Pizza', Icon: Pizza },
  { key: 'coffee', label: 'Coffee', Icon: Coffee },
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'plug', label: 'Plug', Icon: Plug },
  { key: 'wifi', label: 'Wifi', Icon: Wifi },
  { key: 'hammer', label: 'Hammer', Icon: Hammer },
  { key: 'shopping-bag', label: 'Shopping bag', Icon: ShoppingBag },
  { key: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { key: 'ticket', label: 'Ticket', Icon: Ticket },
  { key: 'receipt-text', label: 'Receipt text', Icon: ReceiptText },
  { key: 'tv', label: 'TV', Icon: Tv },
  { key: 'gamepad-2', label: 'Gamepad', Icon: Gamepad2 },
  { key: 'dumbbell', label: 'Dumbbell', Icon: Dumbbell },
  { key: 'car', label: 'Car', Icon: Car },
  { key: 'bus', label: 'Bus', Icon: Bus },
  { key: 'car-taxi-front', label: 'Taxi', Icon: CarTaxiFront },
  { key: 'fuel', label: 'Fuel', Icon: Fuel },
  { key: 'wrench', label: 'Wrench', Icon: Wrench },
  { key: 'heart-pulse', label: 'Heart pulse', Icon: HeartPulse },
  { key: 'heart', label: 'Heart', Icon: HeartPulse },
  { key: 'pill', label: 'Pill', Icon: Pill },
  { key: 'stethoscope', label: 'Stethoscope', Icon: Stethoscope },
  { key: 'shield-check', label: 'Shield check', Icon: ShieldCheck },
  { key: 'graduation-cap', label: 'Graduation cap', Icon: GraduationCap },
  { key: 'book-open', label: 'Book open', Icon: BookOpen },
  { key: 'book', label: 'Book', Icon: BookOpen },
  { key: 'laptop', label: 'Laptop', Icon: Laptop },
  { key: 'landmark', label: 'Landmark', Icon: Landmark },
  { key: 'credit-card', label: 'Credit card', Icon: CreditCard },
  { key: 'receipt', label: 'Receipt', Icon: Receipt },
  { key: 'gift', label: 'Gift', Icon: Gift },
  { key: 'plane', label: 'Plane', Icon: Plane }
];

function catalogIconForKey(iconKey?: string): IconOption {
  return catalogIconOptions.find((option) => option.key === iconKey) ?? catalogIconOptions[0];
}

function incomeEditDraftFromConfig(income: IncomeConfig): IncomeEditDraft {
  return {
    description: income.description,
    amount: centsToInput(income.amountCents),
    day: String(income.day),
    businessOnly: income.businessOnly,
    walletId: income.walletId ?? ''
  };
}

function recurringEditDraftFromConfig(item: RecurringExpenseConfig): RecurringEditDraft {
  return {
    description: item.description,
    amount: centsToInput(item.amountCents)
  };
}

function walletEditDraftFromConfig(walletItem: WalletConfig): WalletEditDraft {
  return {
    name: walletItem.name,
    amount: centsToInput(walletItem.balanceCents)
  };
}

function groupEditDraftFromConfig(group: CategoryGroupConfig): GroupEditDraft {
  return {
    code: group.code ?? '',
    label: group.label,
    colorHex: group.colorHex ?? '#35d07f',
    iconKey: group.iconKey ?? '',
    sortOrder: String(group.sortOrder ?? '')
  };
}

function categoryEditDraftFromConfig(category: CategoryConfig): CategoryEditDraft {
  return {
    code: category.code ?? '',
    label: category.label,
    group: category.group,
    colorHex: category.colorHex ?? '#35d07f',
    iconKey: category.iconKey ?? '',
    sortOrder: String(category.sortOrder ?? ''),
    separateFromTotals: Boolean(category.separateFromTotals)
  };
}

function isIncomeEditDirty(draft: IncomeEditDraft, income: IncomeConfig): boolean {
  return (
    draft.description !== income.description ||
    draft.amount !== centsToInput(income.amountCents) ||
    draft.day !== String(income.day) ||
    draft.businessOnly !== income.businessOnly ||
    draft.walletId !== (income.walletId ?? '')
  );
}

function isRecurringEditDirty(draft: RecurringEditDraft, item: RecurringExpenseConfig): boolean {
  return draft.description !== item.description || draft.amount !== centsToInput(item.amountCents);
}

function isWalletEditDirty(draft: WalletEditDraft, walletItem: WalletConfig): boolean {
  return draft.name !== walletItem.name || draft.amount !== centsToInput(walletItem.balanceCents);
}

function isGroupEditDirty(draft: GroupEditDraft, group: CategoryGroupConfig): boolean {
  return (
    draft.code !== (group.code ?? '') ||
    draft.label !== group.label ||
    draft.colorHex !== (group.colorHex ?? '#35d07f') ||
    draft.iconKey !== (group.iconKey ?? '') ||
    draft.sortOrder !== String(group.sortOrder ?? '')
  );
}

function isCategoryEditDirty(draft: CategoryEditDraft, category: CategoryConfig): boolean {
  return (
    draft.code !== (category.code ?? '') ||
    draft.label !== category.label ||
    draft.group !== category.group ||
    draft.colorHex !== (category.colorHex ?? '#35d07f') ||
    draft.iconKey !== (category.iconKey ?? '') ||
    draft.sortOrder !== String(category.sortOrder ?? '') ||
    draft.separateFromTotals !== Boolean(category.separateFromTotals)
  );
}

const viewRoutes: Record<View, string> = {
  home: '/',
  expenses: '/add-expense',
  visualize: '/visualize/expenses',
  financialConfigurations: '/financial-configurations/income',
  settings: '/settings/categories',
  accountSettings: '/account-settings'
};

const visualizeSectionRoutes: Record<VisualizeSection, string> = {
  expenses: '/visualize/expenses',
  payments: '/visualize/payments'
};

const financialSectionRoutes: Record<FinancialSection, string> = {
  income: '/financial-configurations/income',
  recurring: '/financial-configurations/recurring',
  wallets: '/financial-configurations/wallets'
};

const settingsSectionRoutes: Record<SettingsSection, string> = {
  categories: '/settings/categories',
  quickOptions: '/settings/quick-options',
  dataManagement: '/settings/data-management'
};

const navigation = [
  { view: 'home' as const, label: 'Home', icon: Home },
  { view: 'expenses' as const, label: 'Add expense', icon: Plus },
  { view: 'visualize' as const, label: 'Visualize', icon: BarChart3 },
  { view: 'financialConfigurations' as const, label: 'Financial configurations', icon: CircleDollarSign },
  { view: 'settings' as const, label: 'Settings', icon: SettingsIcon }
];

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthPrefixFromDate(date: string): string {
  return date.slice(0, 7);
}

function currentMonthPrefix(): string {
  return todayKey().slice(0, 7);
}

function monthOptions(centerMonth = currentMonthPrefix()): string[] {
  const [centerYear, centerMonthNumber] = centerMonth.split('-').map(Number);
  const now = new Date(centerYear, centerMonthNumber - 1, 1);
  return Array.from({ length: 13 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

function shiftMonthPrefix(monthPrefix: string, offset: number): string {
  return monthPrefixFromDate(addMonths(`${monthPrefix}-01`, offset));
}

function formatMonth(monthPrefix: string): string {
  const [year, month] = monthPrefix.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
}

function formatMoney(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode
  }).format(cents / 100);
}

function parseMoneyToCents(value: string): number {
  const normalized = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dateForDayInMonth(monthPrefix: string, day: number): string {
  const [year, month] = monthPrefix.split('-').map(Number);
  const safeDay = Math.min(Math.max(1, day), daysInMonth(year, month));
  return `${monthPrefix}-${String(safeDay).padStart(2, '0')}`;
}

function addMonths(date: string, offset: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(year, month - 1 + offset, 1);
  const nextDay = Math.min(day, daysInMonth(target.getFullYear(), target.getMonth() + 1));
  target.setDate(nextDay);
  return [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, '0'),
    String(target.getDate()).padStart(2, '0')
  ].join('-');
}

function activeExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => !expense.deletedAt);
}

function expensesForMonth(expenses: Expense[], monthPrefix: string): Expense[] {
  return activeExpenses(expenses).filter((expense) => (expense.month || monthPrefixFromDate(expense.date)) === monthPrefix);
}

function budgetExpenseTotal(expenses: Expense[], categories: CategoryConfig[]): number {
  return expenses
    .filter((expense) => !categories.find((category) => category.id === expense.categoryId)?.separateFromTotals)
    .filter((expense) => !(expense.paid && expense.walletId))
    .reduce((total, expense) => total + expense.amountCents, 0);
}

function separatedExpenseTotal(expenses: Expense[], categories: CategoryConfig[]): number {
  return expenses
    .filter((expense) => categories.find((category) => category.id === expense.categoryId)?.separateFromTotals)
    .reduce((total, expense) => total + expense.amountCents, 0);
}

function expenseGrandTotal(expenses: Expense[], categories: CategoryConfig[]): number {
  return expenses
    .filter((expense) => !categories.find((category) => category.id === expense.categoryId)?.separateFromTotals)
    .reduce((total, expense) => total + expense.amountCents, 0);
}

function categoryTotals(expenses: Expense[], categories: CategoryConfig[]): Array<{ category: CategoryConfig; totalCents: number; count: number }> {
  const totals = new Map<string, { category: CategoryConfig; totalCents: number; count: number }>();
  for (const expense of expenses) {
    const category = categories.find((item) => item.id === expense.categoryId) ?? categories[categories.length - 1];
    if (!category) continue;
    const current = totals.get(category.id);
    totals.set(category.id, {
      category,
      totalCents: (current?.totalCents ?? 0) + expense.amountCents,
      count: (current?.count ?? 0) + 1
    });
  }
  return Array.from(totals.values()).sort((a, b) => b.totalCents - a.totalCents || a.category.label.localeCompare(b.category.label));
}

function groupTotals(expenses: Expense[], categories: CategoryConfig[]): Array<{ name: string; value: number }> {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const category = categories.find((item) => item.id === expense.categoryId);
    const group = category?.group ?? 'Other';
    totals.set(group, (totals.get(group) ?? 0) + expense.amountCents);
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function addDays(date: string, offset: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setDate(parsed.getDate() + offset);
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0')
  ].join('-');
}

function nextBusinessDay(date: string): string {
  let next = addDays(date, 1);
  while ([0, 6].includes(new Date(`${next}T00:00:00`).getDay())) {
    next = addDays(next, 1);
  }
  return next;
}

function clampDay(value: number): number {
  return Math.min(31, Math.max(1, Math.trunc(value) || 1));
}

function financialCycleStartDate(monthPrefix: string, startDay: number): string {
  return dateForDayInMonth(monthPrefix, clampDay(startDay));
}

function financialCycleEndDateExclusive(monthPrefix: string, startDay: number): string {
  return financialCycleStartDate(shiftMonthPrefix(monthPrefix, 1), startDay);
}

function financialCycleDates(monthPrefix: string, startDay: number): string[] {
  const dates: string[] = [];
  for (
    let current = financialCycleStartDate(monthPrefix, startDay);
    current < financialCycleEndDateExclusive(monthPrefix, startDay);
    current = addDays(current, 1)
  ) {
    dates.push(current);
  }
  return dates;
}

function incomeConfigsForMonth(state: FinanceState, monthPrefix: string): IncomeConfig[] {
  return Object.prototype.hasOwnProperty.call(state.monthlyIncomeEntries, monthPrefix)
    ? state.monthlyIncomeEntries[monthPrefix]
    : state.incomes;
}

function sortedIncomes(incomes: IncomeConfig[]): IncomeConfig[] {
  return [...incomes].sort((left, right) => left.day - right.day || left.description.localeCompare(right.description));
}

function activeCategoryOptions(categories: CategoryConfig[]): CategoryConfig[] {
  return categories.filter((category) => !category.deletedAt);
}

function activeGroupOptions(groups: CategoryGroupConfig[]): CategoryGroupConfig[] {
  return groups
    .filter((group) => !group.deletedAt)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label));
}

function categoriesForGroup(categories: CategoryConfig[], groupLabel: string): CategoryConfig[] {
  return activeCategoryOptions(categories)
    .filter((category) => category.group === groupLabel)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label));
}

function incomeDateForMonth(income: IncomeConfig, monthPrefix: string, financialCycleStartDay = 1): string {
  const targetMonth = income.day < clampDay(financialCycleStartDay) ? shiftMonthPrefix(monthPrefix, 1) : monthPrefix;
  const cycleStart = financialCycleStartDate(monthPrefix, financialCycleStartDay);
  const cycleEnd = financialCycleEndDateExclusive(monthPrefix, financialCycleStartDay);
  let date = dateForDayInMonth(targetMonth, income.day);

  if (date >= cycleEnd) {
    date = addDays(cycleEnd, -1);
  }

  if (income.businessOnly) {
    while (date > cycleStart && [0, 6].includes(new Date(`${date}T00:00:00`).getDay())) {
      date = addDays(date, -1);
    }
  }
  return date;
}

function chartCurrencyFormatter(currencyCode: string) {
  return (value: unknown) => formatMoney(Number(value) || 0, currencyCode);
}

function routeToView(pathname: string): View {
  if (pathname === '/add-expense') return 'expenses';
  if (pathname.startsWith('/visualize')) return 'visualize';
  if (pathname.startsWith('/financial-configurations')) return 'financialConfigurations';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname === '/account-settings') return 'accountSettings';
  return 'home';
}

function routeToVisualizeSection(pathname: string): VisualizeSection {
  if (pathname.startsWith('/visualize/payments')) return 'payments';
  return 'expenses';
}

function routeToFinancialSection(pathname: string): FinancialSection {
  if (pathname.startsWith('/financial-configurations/recurring')) return 'recurring';
  if (pathname.startsWith('/financial-configurations/wallets')) return 'wallets';
  return 'income';
}

function routeToSettingsSection(pathname: string): SettingsSection {
  if (pathname.startsWith('/settings/quick-options')) return 'quickOptions';
  if (pathname.startsWith('/settings/data-management')) return 'dataManagement';
  return 'categories';
}

function sessionsRepresentSameUser(currentSession: Session | null, nextSession: Session | null): boolean {
  if (!currentSession || !nextSession) return currentSession === nextSession;
  return currentSession.user.id === nextSession.user.id && currentSession.user.email === nextSession.user.email;
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>(() => routeToView(window.location.pathname));
  const [selectedMonth, setSelectedMonth] = useState(currentMonthPrefix());
  const [visualizeSection, setVisualizeSection] = useState<VisualizeSection>(() => routeToVisualizeSection(window.location.pathname));
  const [financialSection, setFinancialSection] = useState<FinancialSection>(() => routeToFinancialSection(window.location.pathname));
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(() => routeToSettingsSection(window.location.pathname));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('fcv2_sidebar_collapsed') === 'true');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [financeState, setFinanceState] = useState<FinanceState>(initialFinanceState);
  const [requestedExpenseEditId, setRequestedExpenseEditId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [dataError, setDataError] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const financeStateRef = useRef<FinanceState>(initialFinanceState);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const pendingSaveIdRef = useRef(0);

  const notify = useCallback<NotifyFn>(({ tone, text }) => {
    const id = createId('toast');
    setToasts((current) => [...current, { id, tone, text }].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, tone === 'error' ? 7000 : 4200);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const currentUserId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession((currentSession) => (
        sessionsRepresentSameUser(currentSession, data.session) ? currentSession : data.session
      ));
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession((currentSession) => (
        sessionsRepresentSameUser(currentSession, nextSession) ? currentSession : nextSession
      ));
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setView(routeToView(window.location.pathname));
      setVisualizeSection(routeToVisualizeSection(window.location.pathname));
      setFinancialSection(routeToFinancialSection(window.location.pathname));
      setSettingsSection(routeToSettingsSection(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    financeStateRef.current = financeState;
  }, [financeState]);

  useEffect(() => {
    const warnAboutPendingSave = (event: BeforeUnloadEvent) => {
      if (pendingSaveIdRef.current === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnAboutPendingSave);
    return () => window.removeEventListener('beforeunload', warnAboutPendingSave);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!currentUserId) {
      setFinanceState(initialFinanceState);
      financeStateRef.current = initialFinanceState;
      setLoadedUserId(null);
      setDataLoading(false);
      return;
    }

    if (loadedUserId === currentUserId) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setDataError('');

    void loadFinanceState(currentUserId)
      .then((loadedState) => {
        if (cancelled) return;
        financeStateRef.current = loadedState;
        setFinanceState(loadedState);
        setLoadedUserId(currentUserId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Could not load finance data from Supabase.';
        setDataError(message);
        notify({ tone: 'error', text: message });
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, loadedUserId, notify]);

  const commitFinanceState = (next: FinanceState | ((current: FinanceState) => FinanceState)) => {
    const userId = currentUserId;
    const resolvedState = typeof next === 'function' ? next(financeStateRef.current) : next;

    financeStateRef.current = resolvedState;
    setFinanceState(resolvedState);

    if (!userId) return;

    const saveId = saveSequenceRef.current + 1;
    saveSequenceRef.current = saveId;
    pendingSaveIdRef.current = saveId;
    setDataError('');
    notify({ tone: 'info', text: 'Saving changes to Supabase...' });

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const savedState = await saveFinanceState(userId, resolvedState);
        if (saveId !== saveSequenceRef.current) return;
        financeStateRef.current = savedState;
        setFinanceState(savedState);
        pendingSaveIdRef.current = 0;
        notify({ tone: 'success', text: 'Saved to Supabase.' });
      })
      .catch((error: unknown) => {
        if (saveId !== saveSequenceRef.current) return;
        const message = error instanceof Error ? error.message : 'Could not save finance data to Supabase.';
        setDataError(message);
        notify({ tone: 'error', text: message });
      });
  };

  const navigate = (nextView: View) => {
    const route = viewRoutes[nextView];
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setView(nextView);
  };

  const editExpenseFromAnyScreen = (expenseId: string) => {
    const expense = financeStateRef.current.expenses.find((item) => item.id === expenseId);
    if (expense?.month) {
      setSelectedMonth(expense.month);
    }
    setRequestedExpenseEditId(expenseId);
    navigate('expenses');
  };

  const selectVisualizeSection = (section: VisualizeSection) => {
    const route = visualizeSectionRoutes[section];
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setView('visualize');
    setVisualizeSection(section);
  };

  const selectFinancialSection = (section: FinancialSection) => {
    const route = financialSectionRoutes[section];
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setView('financialConfigurations');
    setFinancialSection(section);
  };

  const selectSettingsSection = (section: SettingsSection) => {
    const route = settingsSectionRoutes[section];
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setView('settings');
    setSettingsSection(section);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('fcv2_sidebar_collapsed', String(next));
      return next;
    });
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setLogoutOpen(false);
    navigate('home');
  };

  if (authLoading) {
    return <main className="loading-screen">Loading session...</main>;
  }

  if (!session) {
    return (
      <>
        <AuthScreen onNotify={notify} />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (dataLoading && loadedUserId !== currentUserId) {
    return <main className="loading-screen">Loading finance data from Supabase...</main>;
  }

  if (loadedUserId !== currentUserId && !dataError) {
    return <main className="loading-screen">Preparing finance workspace...</main>;
  }

  return (
    <>
    <AppShell
      currentView={view}
      email={session.user.email ?? 'Signed in'}
      currentVisualizeSection={visualizeSection}
      currentFinancialSection={financialSection}
      currentSettingsSection={settingsSection}
      selectedMonth={selectedMonth}
      sidebarCollapsed={sidebarCollapsed}
      onMonthSelected={setSelectedMonth}
      onNavigate={navigate}
      onNavigateVisualizeSection={selectVisualizeSection}
      onNavigateFinancialSection={selectFinancialSection}
      onNavigateSettingsSection={selectSettingsSection}
      onToggleSidebar={toggleSidebar}
      onRequestLogout={() => setLogoutOpen(true)}
    >
      {view === 'home' ? (
        <HomeView
          state={financeState}
          selectedMonth={selectedMonth}
          onNavigate={navigate}
        />
      ) : null}
      {view === 'expenses' ? (
        <ExpensesView
          state={financeState}
          selectedMonth={selectedMonth}
          requestedEditingExpenseId={requestedExpenseEditId}
          onEditingRequestConsumed={() => setRequestedExpenseEditId(null)}
          onStateChange={commitFinanceState}
          onNotify={notify}
        />
      ) : null}
      {view === 'visualize' ? (
        <VisualizeView
          state={financeState}
          selectedMonth={selectedMonth}
          activeSection={visualizeSection}
          onSectionChange={selectVisualizeSection}
          onStateChange={commitFinanceState}
          onNavigate={navigate}
          onEditExpense={editExpenseFromAnyScreen}
        />
      ) : null}
      {view === 'financialConfigurations' ? (
        <FinancialConfigurationsView
          state={financeState}
          selectedMonth={selectedMonth}
          activeSection={financialSection}
          onSectionChange={selectFinancialSection}
          onStateChange={commitFinanceState}
          onNotify={notify}
        />
      ) : null}
      {view === 'settings' ? (
        <SettingsView
          state={financeState}
          selectedMonth={selectedMonth}
          activeSection={settingsSection}
          onSectionChange={selectSettingsSection}
          onStateChange={commitFinanceState}
          onNotify={notify}
        />
      ) : null}
      {view === 'accountSettings' ? (
        <AccountSettingsView
          email={session.user.email ?? 'Signed in'}
          state={financeState}
          onRequestLogout={() => setLogoutOpen(true)}
        />
      ) : null}
      {logoutOpen ? (
        <ConfirmDialog
          title="Log out?"
          body="Your saved account data will stay in Supabase. This only ends the current browser session."
          confirmLabel="Log out"
          danger
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => void logout()}
        />
      ) : null}
    </AppShell>
    <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function AuthScreen({ onNotify }: { onNotify: NotifyFn }) {
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      onNotify({ tone: 'warning', text: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' });
    }
  }, [onNotify]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (mode === 'SIGN_UP' && password !== passwordConfirmation) {
      onNotify({ tone: 'error', text: 'Passwords do not match.' });
      return;
    }

    setBusy(true);

    const result = mode === 'SIGN_IN'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      onNotify({ tone: 'error', text: result.error.message });
    } else if (mode === 'SIGN_UP' && !result.data.session) {
      onNotify({ tone: 'success', text: 'Account created. Check your email if confirmation is required.' });
    }

    setBusy(false);
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <p className="eyebrow">My FinanceControlV2</p>
        <h1>Sign in to continue</h1>
        <p>Finance Control V2 stores your financial data in your authenticated Supabase account.</p>

        {!isSupabaseConfigured() ? (
          <p className="muted">Authentication is unavailable until Supabase environment variables are configured.</p>
        ) : (
          <>
            <div className="segmented-control" role="tablist" aria-label="Authentication mode">
              <button className={mode === 'SIGN_IN' ? 'active' : ''} onClick={() => setMode('SIGN_IN')} type="button">
                Sign in
              </button>
              <button className={mode === 'SIGN_UP' ? 'active' : ''} onClick={() => setMode('SIGN_UP')} type="button">
                Create account
              </button>
            </div>

            <form className="form-grid" onSubmit={submit}>
              <label>
                Email
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
              </label>
              <label>
                Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={mode === 'SIGN_IN' ? 'current-password' : 'new-password'} required />
              </label>
              {mode === 'SIGN_UP' ? (
                <label>
                  Confirm password
                  <input value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} type="password" autoComplete="new-password" required />
                </label>
              ) : null}
              <button className="primary-button" disabled={busy} type="submit">
                {busy ? 'Please wait...' : mode === 'SIGN_IN' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

function AppShell({
  currentView,
  email,
  currentVisualizeSection,
  currentFinancialSection,
  currentSettingsSection,
  selectedMonth,
  sidebarCollapsed,
  children,
  onMonthSelected,
  onNavigate,
  onNavigateVisualizeSection,
  onNavigateFinancialSection,
  onNavigateSettingsSection,
  onToggleSidebar,
  onRequestLogout
}: {
  currentView: View;
  email: string;
  currentVisualizeSection: VisualizeSection;
  currentFinancialSection: FinancialSection;
  currentSettingsSection: SettingsSection;
  selectedMonth: string;
  sidebarCollapsed: boolean;
  children: ReactNode;
  onMonthSelected: (month: string) => void;
  onNavigate: (view: View) => void;
  onNavigateVisualizeSection: (section: VisualizeSection) => void;
  onNavigateFinancialSection: (section: FinancialSection) => void;
  onNavigateSettingsSection: (section: SettingsSection) => void;
  onToggleSidebar: () => void;
  onRequestLogout: () => void;
}) {
  const visualizeItems = [
    { section: 'expenses' as const, label: 'Expenses', icon: ReceiptText },
    { section: 'payments' as const, label: 'Payments', icon: CalendarDays }
  ];
  const financialItems = [
    { section: 'income' as const, label: 'Income', icon: CircleDollarSign },
    { section: 'recurring' as const, label: 'Recurring', icon: Repeat },
    { section: 'wallets' as const, label: 'Wallets', icon: Wallet }
  ];
  const settingsItems = [
    { section: 'categories' as const, label: 'Category catalog', icon: Tags },
    { section: 'quickOptions' as const, label: 'Quick options', icon: SlidersHorizontal },
    { section: 'dataManagement' as const, label: 'Data management', icon: Database }
  ];

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button" aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'} onClick={onToggleSidebar} type="button">
            <Menu size={20} aria-hidden="true" />
          </button>
          <button className="brand-button" onClick={() => onNavigate('home')} type="button">
            <img src="/app-logo.png" alt="" aria-hidden="true" />
            <span>My FinanceControlV2</span>
          </button>
        </div>
        <label className="month-picker">
          <button
            className="month-step-button"
            aria-label="Previous month"
            onClick={() => onMonthSelected(shiftMonthPrefix(selectedMonth, -1))}
            type="button"
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <CalendarDays size={16} aria-hidden="true" />
          <select value={selectedMonth} onChange={(event) => onMonthSelected(event.target.value)}>
            {monthOptions(selectedMonth).map((month) => (
              <option key={month} value={month}>{formatMonth(month)}</option>
            ))}
          </select>
          <button
            className="month-step-button"
            aria-label="Next month"
            onClick={() => onMonthSelected(shiftMonthPrefix(selectedMonth, 1))}
            type="button"
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </label>
        <div className="profile-strip">
          <button className="profile-button" onClick={() => onNavigate('accountSettings')} type="button" title={email}>
            <UserCircle size={22} aria-hidden="true" />
            <span>{email}</span>
          </button>
          <button className="icon-button danger-text" aria-label="Log out" onClick={onRequestLogout} type="button">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={sidebarCollapsed ? 'layout collapsed' : 'layout'}>
        <aside className="sidebar" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.view} className={item.view === 'visualize' || item.view === 'financialConfigurations' || item.view === 'settings' ? 'sidebar-group' : undefined}>
                <button
                  className={currentView === item.view ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={() => onNavigate(item.view)}
                  type="button"
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
                {item.view === 'visualize' ? (
                  <div className="sidebar-subnav" aria-label="Visualize options">
                    {visualizeItems.map((subitem) => {
                      const SubIcon = subitem.icon;
                      return (
                        <button
                          key={subitem.section}
                          className={currentView === 'visualize' && currentVisualizeSection === subitem.section ? 'sidebar-sublink active' : 'sidebar-sublink'}
                          onClick={() => onNavigateVisualizeSection(subitem.section)}
                          type="button"
                          title={sidebarCollapsed ? subitem.label : undefined}
                        >
                          <SubIcon size={15} aria-hidden="true" />
                          <span>{subitem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {item.view === 'financialConfigurations' ? (
                  <div className="sidebar-subnav" aria-label="Financial configuration options">
                    {financialItems.map((subitem) => {
                      const SubIcon = subitem.icon;
                      return (
                        <button
                          key={subitem.section}
                          className={currentView === 'financialConfigurations' && currentFinancialSection === subitem.section ? 'sidebar-sublink active' : 'sidebar-sublink'}
                          onClick={() => onNavigateFinancialSection(subitem.section)}
                          type="button"
                          title={sidebarCollapsed ? subitem.label : undefined}
                        >
                          <SubIcon size={15} aria-hidden="true" />
                          <span>{subitem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {item.view === 'settings' ? (
                  <div className="sidebar-subnav" aria-label="Settings options">
                    {settingsItems.map((subitem) => {
                      const SubIcon = subitem.icon;
                      return (
                        <button
                          key={subitem.section}
                          className={currentView === 'settings' && currentSettingsSection === subitem.section ? 'sidebar-sublink active' : 'sidebar-sublink'}
                          onClick={() => onNavigateSettingsSection(subitem.section)}
                          type="button"
                          title={sidebarCollapsed ? subitem.label : undefined}
                        >
                          <SubIcon size={15} aria-hidden="true" />
                          <span>{subitem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </aside>
        <section className="content-area">{children}</section>
      </div>
    </div>
  );
}

function HomeView({ state, selectedMonth, onNavigate }: { state: FinanceState; selectedMonth: string; onNavigate: (view: View) => void }) {
  const [includeSeparatedInBudget, setIncludeSeparatedInBudget] = useState(false);
  const expenses = expensesForMonth(state.expenses, selectedMonth);
  const incomeCents = incomeConfigsForMonth(state, selectedMonth).reduce((total, income) => total + income.amountCents, 0);
  const recurringCents = state.recurringExpenses.reduce((total, expense) => total + expense.amountCents, 0);
  const baseBudgetCents = budgetExpenseTotal(expenses, state.categories);
  const separatedCents = separatedExpenseTotal(expenses, state.categories);
  const budgetCents = includeSeparatedInBudget ? baseBudgetCents + separatedCents : baseBudgetCents;
  const walletCents = state.wallets.reduce((total, wallet) => total + wallet.balanceCents, 0);
  const remainingCents = incomeCents - recurringCents - budgetCents;
  const recentExpenses = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <main className="screen">
      <ScreenHeader
        eyebrow="Home"
        title={`${formatMonth(selectedMonth)} summary`}
        description="A compact financial summary for the selected month."
        action={<button className="primary-button" onClick={() => onNavigate('expenses')} type="button"><Plus size={17} /> Add expense</button>}
      />

      <section className="metric-grid">
        <MetricCard label="Monthly income" value={formatMoney(incomeCents, state.currencyCode)} tone="positive" />
        <MetricCard label="Budget expenses" value={formatMoney(budgetCents, state.currencyCode)} />
        <MetricCard label="Recurring expenses" value={formatMoney(recurringCents, state.currencyCode)} />
        <MetricCard label="Remaining" value={formatMoney(remainingCents, state.currencyCode)} tone={remainingCents >= 0 ? 'positive' : 'negative'} />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Budget context</h2>
            <CircleDollarSign size={20} aria-hidden="true" />
          </div>
          <dl className="summary-list">
            <div><dt>Wallet value</dt><dd>{formatMoney(walletCents, state.currencyCode)}</dd></div>
            <div><dt>Remaining + wallets</dt><dd>{formatMoney(remainingCents + walletCents, state.currencyCode)}</dd></div>
            <div><dt>Separated expenses</dt><dd>{formatMoney(separatedCents, state.currencyCode)}</dd></div>
            <div><dt>Expense count</dt><dd>{expenses.length}</dd></div>
          </dl>
          <label className="switch-row summary-toggle">Include separated in budget<input type="checkbox" checked={includeSeparatedInBudget} onChange={(event) => setIncludeSeparatedInBudget(event.target.checked)} /></label>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Recent expenses</h2>
            <ReceiptText size={20} aria-hidden="true" />
          </div>
          {recentExpenses.length === 0 ? (
            <EmptyState title="No expenses yet" body="Start by adding the first expense for this month." actionLabel="Add expense" onAction={() => onNavigate('expenses')} />
          ) : (
            <div className="compact-list">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="compact-row">
                  <span>{expense.title}</span>
                  <strong>{formatMoney(expense.amountCents, state.currencyCode)}</strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function ExpensesView({
  state,
  selectedMonth,
  requestedEditingExpenseId,
  onEditingRequestConsumed,
  onStateChange,
  onNotify
}: {
  state: FinanceState;
  selectedMonth: string;
  requestedEditingExpenseId: string | null;
  onEditingRequestConsumed: () => void;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNotify: NotifyFn;
}) {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(requestedEditingExpenseId);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [moveExpenseId, setMoveExpenseId] = useState<string | null>(null);
  const [copyExpenseId, setCopyExpenseId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortMode, setSortMode] = useState('GROUP');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [walletFilter, setWalletFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dueStart, setDueStart] = useState('');
  const [dueEnd, setDueEnd] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (!requestedEditingExpenseId) return;
    setEditingExpenseId(requestedEditingExpenseId);
    onEditingRequestConsumed();
  }, [requestedEditingExpenseId, onEditingRequestConsumed]);

  const editingExpense = editingExpenseId ? state.expenses.find((expense) => expense.id === editingExpenseId) : undefined;
  const monthExpenses = expensesForMonth(state.expenses, selectedMonth);
  const groups = Array.from(new Set(activeCategoryOptions(state.categories).map((category) => category.group))).sort();
  const filteredCategoryOptions = activeCategoryOptions(state.categories).filter((category) => groupFilter !== 'ALL' && category.group === groupFilter);

  const filteredExpenses = useMemo(() => {
    const filtered = monthExpenses.filter((expense) => {
      const category = state.categories.find((item) => item.id === expense.categoryId);
      const groupMatches = groupFilter === 'ALL' || category?.group === groupFilter;
      const categoryMatches = groupFilter === 'ALL' || categoryFilter === 'ALL' || expense.categoryId === categoryFilter;
      const walletMatches =
        walletFilter === 'ALL' ||
        (walletFilter === 'NONE' ? !expense.walletId : expense.walletId === walletFilter);
      const dueMatches =
        dueFilter === 'ALL' ||
        (dueFilter === 'WITH' ? Boolean(expense.dueDate) : !expense.dueDate);
      const dueIntervalMatches = !dueStart && !dueEnd
        ? true
        : Boolean(expense.dueDate) && (!dueStart || expense.dueDate! >= dueStart) && (!dueEnd || expense.dueDate! <= dueEnd);
      const paymentMatches = paymentFilter === 'ALL' || (paymentFilter === 'PAID' ? expense.paid : !expense.paid);
      const keywordMatches = expense.title.toLowerCase().includes(keyword.trim().toLowerCase());
      return groupMatches && categoryMatches && walletMatches && dueMatches && dueIntervalMatches && paymentMatches && keywordMatches;
    });

    const direction = sortDirection === 'ASC' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const categoryA = state.categories.find((category) => category.id === a.categoryId);
      const categoryB = state.categories.find((category) => category.id === b.categoryId);
      const result = (() => {
        switch (sortMode) {
          case 'DESCRIPTION': return a.title.localeCompare(b.title);
          case 'CATEGORY': return (categoryA?.label ?? '').localeCompare(categoryB?.label ?? '');
          case 'DUE_DATE': return (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99');
          case 'CREATED': return a.createdAt.localeCompare(b.createdAt);
          case 'AMOUNT': return a.amountCents - b.amountCents;
          case 'GROUP':
          default:
            return (categoryA?.group ?? '').localeCompare(categoryB?.group ?? '') || (categoryA?.label ?? '').localeCompare(categoryB?.label ?? '');
        }
      })();
      return result * direction;
    });
  }, [categoryFilter, dueEnd, dueFilter, dueStart, groupFilter, keyword, monthExpenses, paymentFilter, sortDirection, sortMode, state.categories, walletFilter]);
  const saveExpense = (draft: ExpenseFormDraft, keepAdding = false, addAsNew = false) => {
    const amountCents = parseMoneyToCents(draft.amount);
    if (!draft.title.trim() || !Number.isFinite(amountCents) || amountCents <= 0) {
      onNotify({ tone: 'error', text: 'Description and a valid amount are required.' });
      return false;
    }
    const installmentCount = draft.installments.trim() ? Math.trunc(Number(draft.installments)) : 1;
    if (!Number.isFinite(installmentCount) || installmentCount < 1) {
      onNotify({ tone: 'error', text: 'Installments must be at least 1.' });
      return false;
    }

    const now = new Date().toISOString();
    const baseTitle = draft.title.trim();
    const shouldCreateInstallments = !editingExpense || addAsNew;
    const baseMonth = editingExpense && !addAsNew ? editingExpense.month || selectedMonth : selectedMonth;
    const expensesToSave: Expense[] = Array.from({ length: shouldCreateInstallments ? installmentCount : 1 }, (_, index) => ({
      id: editingExpense && !addAsNew ? editingExpense.id : createId('expense'),
      title: shouldCreateInstallments && installmentCount > 1 ? `${baseTitle} ${index + 1}/${installmentCount}` : baseTitle,
      amountCents,
      date: draft.date,
      month: shouldCreateInstallments ? shiftMonthPrefix(selectedMonth, index) : baseMonth,
      dueDate: draft.hasDueDate && draft.dueDate ? addMonths(draft.dueDate, index) : undefined,
      paid: draft.paid,
      walletId: draft.walletId || undefined,
      categoryId: draft.categoryId,
      createdAt: editingExpense && !addAsNew ? editingExpense.createdAt : now,
      deletedAt: null
    }));

    onStateChange((current) => {
      const editingExisting = editingExpense && !addAsNew;
      const nextExpenses = editingExisting
        ? current.expenses.map((expense) => expense.id === expensesToSave[0].id ? expensesToSave[0] : expense)
        : [...expensesToSave, ...current.expenses];
      return { ...current, expenses: nextExpenses };
    });
    if (!keepAdding) setEditingExpenseId(null);
    return true;
  };

  const deleteExpense = () => {
    if (!deleteExpenseId) return;
    onStateChange((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => (
        expense.id === deleteExpenseId ? { ...expense, deletedAt: new Date().toISOString() } : expense
      ))
    }));
    setDeleteExpenseId(null);
  };

  const togglePaid = (expense: Expense) => {
    onStateChange((current) => ({
      ...current,
      expenses: current.expenses.map((item) => item.id === expense.id ? { ...item, paid: !item.paid } : item)
    }));
  };

  const moveExpense = (expense: Expense, targetMonth: string) => {
    onStateChange((current) => ({
      ...current,
      expenses: current.expenses.map((item) => (
        item.id === expense.id
          ? { ...item, month: targetMonth }
          : item
      ))
    }));
    setMoveExpenseId(null);
  };

  const copyExpense = (expense: Expense, mode: 'MAINTAIN' | 'ADD_TIME' | 'REMOVE') => {
    const copiedMonth = shiftMonthPrefix(expense.month || monthPrefixFromDate(expense.date), 1);
    const copiedDueDate = mode === 'REMOVE'
      ? undefined
      : mode === 'ADD_TIME' && expense.dueDate
        ? addMonths(expense.dueDate, 1)
        : expense.dueDate;

    onStateChange((current) => ({
      ...current,
      expenses: [
        {
          ...expense,
          id: createId('expense'),
          month: copiedMonth,
          dueDate: copiedDueDate,
          createdAt: new Date().toISOString()
        },
        ...current.expenses
      ]
    }));
    setCopyExpenseId(null);
  };

  return (
    <main className="screen expense-screen">
      <ScreenHeader
        eyebrow="Expenses"
        title={`Add and manage ${formatMonth(selectedMonth)}`}
        description="Create, edit, copy, move and review expenses for the selected month."
      />

      <section className="split-layout">
        <ExpenseForm
          key={editingExpense?.id ?? 'new'}
          expense={editingExpense}
          state={state}
          selectedMonth={selectedMonth}
          onCancel={() => setEditingExpenseId(null)}
          onSave={saveExpense}
        />

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Expenses for {formatMonth(selectedMonth)}</h2>
              <p>{filteredExpenses.length} visible of {monthExpenses.length}</p>
            </div>
            <button className="secondary-button" onClick={() => setFiltersOpen(true)} type="button">
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>

          {filteredExpenses.length === 0 ? (
            <EmptyState title="No expenses found" body="Add an expense or adjust the filters." />
          ) : (
            <div className="expense-list">
              {filteredExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  state={state}
                  onEdit={() => setEditingExpenseId(expense.id)}
                  onDelete={() => setDeleteExpenseId(expense.id)}
                  onTogglePaid={() => togglePaid(expense)}
                  onMove={() => setMoveExpenseId(expense.id)}
                  onCopy={() => setCopyExpenseId(expense.id)}
                />
              ))}
            </div>
          )}
        </article>
      </section>

      {deleteExpenseId ? (
        <ConfirmDialog
          title="Delete expense?"
          body="This expense will be hidden from the default lists."
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleteExpenseId(null)}
          onConfirm={deleteExpense}
        />
      ) : null}
      {moveExpenseId ? (
        <MoveExpenseDialog
          expense={state.expenses.find((expense) => expense.id === moveExpenseId)}
          currentMonth={selectedMonth}
          onCancel={() => setMoveExpenseId(null)}
          onMove={moveExpense}
        />
      ) : null}
      {copyExpenseId ? (
        <CopyDueDateDialog
          expense={state.expenses.find((expense) => expense.id === copyExpenseId)}
          onCancel={() => setCopyExpenseId(null)}
          onCopy={copyExpense}
        />
      ) : null}
      {filtersOpen ? (
        <ModalShell title="Expense filters" onClose={() => setFiltersOpen(false)}>
          <div className="filter-modal-grid">
            <label>Sort by
              <div className="paired-control">
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                  <option value="GROUP">Group</option>
                  <option value="DESCRIPTION">Description</option>
                  <option value="CATEGORY">Category</option>
                  <option value="DUE_DATE">Due date</option>
                  <option value="CREATED">Added date</option>
                  <option value="AMOUNT">Amount</option>
                </select>
                <button className="secondary-button" onClick={() => setSortDirection((current) => current === 'ASC' ? 'DESC' : 'ASC')} type="button">
                  {sortDirection === 'ASC' ? 'Asc' : 'Desc'}
                </button>
              </div>
            </label>
            <label>Group
              <select value={groupFilter} onChange={(event) => {
                setGroupFilter(event.target.value);
                setCategoryFilter('ALL');
              }}>
                <option value="ALL">All groups</option>
                {groups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </label>
            {groupFilter !== 'ALL' ? (
              <label>Category
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="ALL">All categories in group</option>
                  {filteredCategoryOptions.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                </select>
              </label>
            ) : null}
            <label>Wallet
              <select value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)}>
                <option value="ALL">All wallets</option>
                <option value="NONE">No wallet</option>
                {state.wallets.map((walletItem) => <option key={walletItem.id} value={walletItem.id}>{walletItem.name}</option>)}
              </select>
            </label>
            <label>Status
              <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
                <option value="ALL">Paid and unpaid</option>
                <option value="PAID">Paid only</option>
                <option value="UNPAID">Unpaid only</option>
              </select>
            </label>
            <label>Due date
              <select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)}>
                <option value="ALL">With and without due date</option>
                <option value="WITH">With due date</option>
                <option value="WITHOUT">Without due date</option>
              </select>
            </label>
            <label>Due from<input type="date" value={dueStart} onChange={(event) => setDueStart(event.target.value)} /></label>
            <label>Due to<input type="date" value={dueEnd} onChange={(event) => setDueEnd(event.target.value)} /></label>
            <label>Search<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Description" /></label>
          </div>
          <div className="dialog-actions">
            <button className="ghost-button" onClick={() => {
              setSortMode('GROUP');
              setSortDirection('ASC');
              setGroupFilter('ALL');
              setCategoryFilter('ALL');
              setWalletFilter('ALL');
              setDueFilter('ALL');
              setPaymentFilter('ALL');
              setDueStart('');
              setDueEnd('');
              setKeyword('');
            }} type="button">Clear</button>
            <button className="primary-button" onClick={() => setFiltersOpen(false)} type="button">Apply</button>
          </div>
        </ModalShell>
      ) : null}
    </main>
  );
}

type ExpenseFormDraft = {
  title: string;
  amount: string;
  date: string;
  hasDueDate: boolean;
  dueDate: string;
  paid: boolean;
  walletId: string;
  categoryId: string;
  installments: string;
};

function ExpenseForm({
  expense,
  state,
  selectedMonth,
  onCancel,
  onSave
}: {
  expense?: Expense;
  state: FinanceState;
  selectedMonth: string;
  onCancel: () => void;
  onSave: (draft: ExpenseFormDraft, keepAdding?: boolean, addAsNew?: boolean) => boolean;
}) {
  const categoryOptions = activeCategoryOptions(state.categories);
  const groupOptions = activeGroupOptions(state.categoryGroups);
  const [draft, setDraft] = useState<ExpenseFormDraft>(() => ({
    title: expense?.title ?? '',
    amount: expense ? centsToInput(expense.amountCents) : '',
    date: expense?.date ?? todayKey(),
    hasDueDate: Boolean(expense?.dueDate),
    dueDate: expense?.dueDate ?? '',
    paid: Boolean(expense?.paid),
    walletId: expense?.walletId ?? '',
    categoryId: expense?.categoryId ?? categoryOptions[0]?.id ?? 'OTHER',
    installments: '1'
  }));
  const [valueToAdd, setValueToAdd] = useState('');
  const currentCategory = state.categories.find((category) => category.id === draft.categoryId);
  const selectedGroup = currentCategory?.group ?? groupOptions[0]?.label ?? '';
  const currentCategoryIsActive = categoryOptions.some((category) => category.id === draft.categoryId);
  const groupCategoryOptions = [
    ...categoriesForGroup(state.categories, selectedGroup),
    ...(!currentCategoryIsActive && currentCategory ? [currentCategory] : [])
  ];

  const quickDueDates = state.quickDueDateDays.map((day) => ({
    day,
    date: dateForDayInMonth(selectedMonth, day)
  }));

  const update = (patch: Partial<ExpenseFormDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const selectGroup = (groupLabel: string) => {
    const nextCategory = categoriesForGroup(state.categories, groupLabel)[0] ?? categoryOptions[0];
    if (nextCategory) update({ categoryId: nextCategory.id });
  };

  const addValue = () => {
    const current = parseMoneyToCents(draft.amount || '0');
    const next = parseMoneyToCents(valueToAdd);
    if (!Number.isFinite(next)) return;
    update({ amount: centsToInput((Number.isFinite(current) ? current : 0) + next) });
    setValueToAdd('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const saved = onSave(draft);
    if (saved && !expense) {
      setDraft((current) => ({ ...current, title: '', amount: '', paid: false, installments: '1' }));
    }
  };

  const saveAndAddAnother = () => {
    const saved = onSave(draft, true);
    if (saved) {
      setDraft((current) => ({ ...current, title: '', amount: '', paid: false, installments: '1' }));
    }
  };

  return (
    <article className="panel form-panel">
      <div className="panel-heading">
        <h2>{expense ? 'Edit expense' : 'New expense'}</h2>
        <ReceiptText size={20} aria-hidden="true" />
      </div>
      <form className="form-grid expense-entry-form" onSubmit={submit}>
        <label>Description<input value={draft.title} onChange={(event) => update({ title: event.target.value })} /></label>
        <label>Total amount<input inputMode="decimal" value={draft.amount} onChange={(event) => update({ amount: event.target.value })} /></label>
        <div className="inline-form-row">
          <input inputMode="decimal" placeholder="Value to add" value={valueToAdd} onChange={(event) => setValueToAdd(event.target.value)} />
          <button className="secondary-button" onClick={addValue} type="button">Add value</button>
        </div>
        {!expense ? <label>Parcelas<input type="number" min="1" step="1" inputMode="numeric" value={draft.installments} onChange={(event) => update({ installments: event.target.value })} /></label> : null}
        <label>Date added<input type="date" value={draft.date} onChange={(event) => update({ date: event.target.value })} /></label>
        <label>Expense group
          <select value={selectedGroup} onChange={(event) => selectGroup(event.target.value)}>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.label}>{group.label}</option>
            ))}
            {selectedGroup && !groupOptions.some((group) => group.label === selectedGroup) ? <option value={selectedGroup}>{selectedGroup}</option> : null}
          </select>
        </label>
        <label>Category
          <select value={draft.categoryId} onChange={(event) => update({ categoryId: event.target.value })}>
            {groupCategoryOptions.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </label>
        <label>Wallet
          <select value={draft.walletId} onChange={(event) => update({ walletId: event.target.value })}>
            <option value="">No wallet</option>
            {state.wallets.map((walletItem) => (
              <option key={walletItem.id} value={walletItem.id}>{walletItem.name}</option>
            ))}
          </select>
        </label>
        <label className="switch-row">Has due date<input type="checkbox" checked={draft.hasDueDate} onChange={(event) => update({ hasDueDate: event.target.checked })} /></label>
        {draft.hasDueDate ? (
          <>
            <label>Due date<input type="date" value={draft.dueDate} onChange={(event) => update({ dueDate: event.target.value })} /></label>
            <div className="quick-chip-row">
              {quickDueDates.map((option) => (
                <button
                  key={option.date}
                  className={draft.dueDate === option.date ? 'quick-chip active' : 'quick-chip'}
                  onClick={() => update({ dueDate: draft.dueDate === option.date ? '' : option.date })}
                  type="button"
                >
                  Day {option.day}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <label className="switch-row">Paid<input type="checkbox" checked={draft.paid} onChange={(event) => update({ paid: event.target.checked })} /></label>
        <div className="button-row expense-form-action-bar">
          <button className="primary-button" type="submit"><Save size={16} /> {expense ? 'Save changes' : 'Add'}</button>
          {!expense ? <button className="secondary-button" onClick={saveAndAddAnother} type="button">Save and add another</button> : null}
          {expense ? <button className="secondary-button" onClick={() => onSave(draft, true, true)} type="button">Add as new</button> : null}
          {expense ? <button className="ghost-button" onClick={onCancel} type="button">Cancel</button> : null}
        </div>
      </form>
    </article>
  );
}

function ExpenseRow({
  expense,
  state,
  onEdit,
  onDelete,
  onTogglePaid,
  onMove,
  onCopy
}: {
  expense: Expense;
  state: FinanceState;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePaid: () => void;
  onMove: () => void;
  onCopy: () => void;
}) {
  const category = state.categories.find((item) => item.id === expense.categoryId);
  const walletItem = state.wallets.find((item) => item.id === expense.walletId);

  return (
    <article className="expense-row">
      <div>
        <h3>{expense.title}</h3>
        <p>{category?.group} / {category?.label} {walletItem ? `- ${walletItem.name}` : ''}</p>
        <p>Added {expense.date} - Month {formatMonth(expense.month || monthPrefixFromDate(expense.date))}{expense.dueDate ? ` - due ${expense.dueDate}` : ''}</p>
      </div>
      <strong>{formatMoney(expense.amountCents, state.currencyCode)}</strong>
      <div className="row-actions">
        <button className={expense.paid ? 'status-pill paid' : 'status-pill'} onClick={onTogglePaid} type="button">
          {expense.paid ? 'Paid' : 'Unpaid'}
        </button>
        <button className="icon-button" aria-label="Edit expense" onClick={onEdit} type="button"><Pencil size={16} /></button>
        <button className="icon-button" aria-label="Copy expense" onClick={onCopy} type="button"><Copy size={16} /></button>
        <button className="icon-button" aria-label="Move expense" onClick={onMove} type="button"><ArrowRightLeft size={16} /></button>
        <button className="icon-button danger-text" aria-label="Delete expense" onClick={onDelete} type="button"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function VisualizeView({
  state,
  selectedMonth,
  activeSection,
  onSectionChange,
  onStateChange,
  onNavigate,
  onEditExpense
}: {
  state: FinanceState;
  selectedMonth: string;
  activeSection: VisualizeSection;
  onSectionChange: (section: VisualizeSection) => void;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNavigate: (view: View) => void;
  onEditExpense: (expenseId: string) => void;
}) {
  return (
    <main className="screen">
      <ScreenHeader
        eyebrow="Visualize"
        title={`${formatMonth(selectedMonth)} analysis`}
        description="Inspect spending, categories, payments and income timing for the selected financial month."
      />
      <div className="section-tabs" role="tablist" aria-label="Visualize sections">
        <button className={activeSection === 'expenses' ? 'active' : ''} onClick={() => onSectionChange('expenses')} role="tab" type="button">
          <BarChart3 size={17} aria-hidden="true" /> Expenses
        </button>
        <button className={activeSection === 'payments' ? 'active' : ''} onClick={() => onSectionChange('payments')} role="tab" type="button">
          <CalendarDays size={17} aria-hidden="true" /> Payments
        </button>
      </div>
      {activeSection === 'expenses' ? (
        <VisualizeExpensesSection
          state={state}
          selectedMonth={selectedMonth}
          onStateChange={onStateChange}
          onNavigate={onNavigate}
          onEditExpense={onEditExpense}
        />
      ) : (
        <VisualizePaymentsSection
          state={state}
          selectedMonth={selectedMonth}
          onStateChange={onStateChange}
          onNavigate={onNavigate}
          onEditExpense={onEditExpense}
        />
      )}
    </main>
  );
}

function VisualizeExpensesSection({
  state,
  selectedMonth,
  onStateChange,
  onNavigate,
  onEditExpense
}: {
  state: FinanceState;
  selectedMonth: string;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNavigate: (view: View) => void;
  onEditExpense: (expenseId: string) => void;
}) {
  const [walletFilter, setWalletFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState('ALL');
  const [dueStart, setDueStart] = useState('');
  const [dueEnd, setDueEnd] = useState('');
  const [sortField, setSortField] = useState('TOTAL');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [viewMode, setViewMode] = useState<'CATEGORY' | 'EXPENSES'>('CATEGORY');
  const [includeSeparatedInBudget, setIncludeSeparatedInBudget] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [chartMode, setChartMode] = useState<'BAR' | 'PIE' | 'SANKEY'>('BAR');
  const [chartGrouping, setChartGrouping] = useState<'GROUP' | 'CATEGORY' | 'DESCRIPTION'>('GROUP');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());

  const monthExpenses = expensesForMonth(state.expenses, selectedMonth);
  const filteredCategoryOptions = activeCategoryOptions(state.categories).filter((category) => groupFilter !== 'ALL' && category.group === groupFilter);
  const filteredExpenses = monthExpenses.filter((expense) => {
    const category = state.categories.find((item) => item.id === expense.categoryId);
    const dueStatusMatches =
      dueFilter === 'ALL' ||
      (dueFilter === 'WITH' ? Boolean(expense.dueDate) : !expense.dueDate);
    const dueIntervalMatches = !dueStart && !dueEnd
      ? true
      : Boolean(expense.dueDate) && (!dueStart || expense.dueDate! >= dueStart) && (!dueEnd || expense.dueDate! <= dueEnd);
    return (
      (walletFilter === 'ALL' || (walletFilter === 'NONE' ? !expense.walletId : expense.walletId === walletFilter)) &&
      (groupFilter === 'ALL' || category?.group === groupFilter) &&
      (groupFilter === 'ALL' || categoryFilter === 'ALL' || expense.categoryId === categoryFilter) &&
      (paymentFilter === 'ALL' || (paymentFilter === 'PAID' ? expense.paid : !expense.paid)) &&
      dueStatusMatches &&
      dueIntervalMatches &&
      expense.title.toLowerCase().includes(keyword.trim().toLowerCase())
    );
  });
  const regularExpenses = filteredExpenses.filter((expense) => !state.categories.find((category) => category.id === expense.categoryId)?.separateFromTotals);
  const separatedExpenses = filteredExpenses.filter((expense) => state.categories.find((category) => category.id === expense.categoryId)?.separateFromTotals);
  const budgetExpenses = includeSeparatedInBudget ? filteredExpenses : regularExpenses;
  const groups = Array.from(new Set(activeCategoryOptions(state.categories).map((category) => category.group))).sort();
  const totals = categoryTotals(filteredExpenses, state.categories);
  const displayTotalCents = filteredExpenses.reduce((total, expense) => total + expense.amountCents, 0);
  const budgetTotalCents = budgetExpenses.reduce((total, expense) => total + expense.amountCents, 0);
  const direction = sortDirection === 'ASC' ? 1 : -1;
  const sortedTotals = [...totals].sort((left, right) => {
    const leftExpenses = filteredExpenses.filter((expense) => expense.categoryId === left.category.id);
    const rightExpenses = filteredExpenses.filter((expense) => expense.categoryId === right.category.id);
    const leftDue = leftExpenses.map((expense) => expense.dueDate ?? '9999-99-99').sort()[0] ?? '9999-99-99';
    const rightDue = rightExpenses.map((expense) => expense.dueDate ?? '9999-99-99').sort()[0] ?? '9999-99-99';
    const leftCreated = leftExpenses.map((expense) => expense.createdAt).sort()[0] ?? '';
    const rightCreated = rightExpenses.map((expense) => expense.createdAt).sort()[0] ?? '';

    const result = (() => {
      switch (sortField) {
        case 'CATEGORY': return left.category.label.localeCompare(right.category.label);
        case 'GROUP': return left.category.group.localeCompare(right.category.group) || left.category.label.localeCompare(right.category.label);
        case 'DUE_DATE': return leftDue.localeCompare(rightDue) || left.category.label.localeCompare(right.category.label);
        case 'CREATED': return leftCreated.localeCompare(rightCreated);
        case 'PERCENT':
        case 'TOTAL':
        default: return left.totalCents - right.totalCents;
      }
    })();
    return result * direction;
  });
  const sortedIndividualExpenses = [...filteredExpenses].sort((left, right) => {
    const leftCategory = state.categories.find((category) => category.id === left.categoryId);
    const rightCategory = state.categories.find((category) => category.id === right.categoryId);
    const result = (() => {
      switch (sortField) {
        case 'CATEGORY': return (leftCategory?.label ?? '').localeCompare(rightCategory?.label ?? '');
        case 'GROUP': return (leftCategory?.group ?? '').localeCompare(rightCategory?.group ?? '') || (leftCategory?.label ?? '').localeCompare(rightCategory?.label ?? '');
        case 'DUE_DATE': return (left.dueDate ?? '9999-99-99').localeCompare(right.dueDate ?? '9999-99-99');
        case 'CREATED': return left.createdAt.localeCompare(right.createdAt);
        case 'TOTAL':
        case 'PERCENT':
        default: return left.amountCents - right.amountCents;
      }
    })();
    return result * direction;
  });
  const separatedTotals = categoryTotals(separatedExpenses, state.categories);
  const allExpanded = sortedTotals.length > 0 && sortedTotals.every((total) => expandedCategories.has(total.category.id));
  const chartData = chartDataForExpenses(budgetExpenses, state.categories, chartGrouping);
  const chartColors = ['#35d07f', '#ff6f61', '#61a8ff', '#f2c94c', '#bb86fc', '#4dd0e1', '#ff9f43', '#a3e635'];

  const togglePaid = (expense: Expense) => {
    onStateChange((current) => ({
      ...current,
      expenses: current.expenses.map((item) => item.id === expense.id ? { ...item, paid: !item.paid } : item)
    }));
  };

  const deleteExpense = (id: string) => {
    onStateChange((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => expense.id === id ? { ...expense, deletedAt: new Date().toISOString() } : expense)
    }));
  };

  const copyToNextMonth = (expense: Expense) => {
    onStateChange((current) => ({
      ...current,
      expenses: [{
        ...expense,
        id: createId('expense'),
        month: shiftMonthPrefix(expense.month || monthPrefixFromDate(expense.date), 1),
        dueDate: expense.dueDate ? addMonths(expense.dueDate, 1) : undefined,
        createdAt: new Date().toISOString()
      }, ...current.expenses]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  return (
    <section className="visualize-grid">
      <section className="metric-grid visualize-metrics">
        <MetricCard label={includeSeparatedInBudget ? 'Budget + separated' : 'Budget spending'} value={formatMoney(budgetTotalCents, state.currencyCode)} />
        <MetricCard label="Separated expenses" value={formatMoney(separatedExpenseTotal(filteredExpenses, state.categories), state.currencyCode)} />
        <MetricCard label="Visible expenses" value={String(filteredExpenses.length)} />
        <MetricCard label="Categories" value={String(totals.length)} />
      </section>

      <article className="panel visualize-toolbar">
        <div>
          <h2>{viewMode === 'CATEGORY' ? 'Category totals' : 'Individual expenses'}</h2>
          <p>{viewMode === 'CATEGORY' ? `${totals.length} categories in the current filters, including separated categories.` : `${sortedIndividualExpenses.length} expenses in the current filters.`}</p>
        </div>
        <div className="button-row wrap">
          <label className="switch-row compact-switch toolbar-switch">Include separated in budget<input type="checkbox" checked={includeSeparatedInBudget} onChange={(event) => setIncludeSeparatedInBudget(event.target.checked)} /></label>
          <div className="segmented-control compact two-option" role="group" aria-label="Expense visualization mode">
            <button className={viewMode === 'CATEGORY' ? 'active' : ''} onClick={() => setViewMode('CATEGORY')} type="button">Categories</button>
            <button className={viewMode === 'EXPENSES' ? 'active' : ''} onClick={() => setViewMode('EXPENSES')} type="button">Expenses</button>
          </div>
          <button className="secondary-button" onClick={() => setChartsOpen((current) => !current)} type="button">
            <GitBranch size={16} aria-hidden="true" /> {chartsOpen ? 'Hide charts' : 'Show charts'}
          </button>
          <button className="secondary-button" onClick={() => setFiltersOpen(true)} type="button"><SlidersHorizontal size={16} /> Filters</button>
        </div>
      </article>

      {chartsOpen ? (
      <article className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Spending charts</h2>
            <p>Switch between chart type and grouping to inspect the same spending from different angles.</p>
          </div>
        </div>
        <>
          <div className="chart-controls">
              <div className="segmented-control compact" role="tablist" aria-label="Chart type">
                <button className={chartMode === 'BAR' ? 'active' : ''} onClick={() => setChartMode('BAR')} type="button">Bars</button>
                <button className={chartMode === 'PIE' ? 'active' : ''} onClick={() => setChartMode('PIE')} type="button">Pie</button>
                <button className={chartMode === 'SANKEY' ? 'active' : ''} onClick={() => setChartMode('SANKEY')} type="button">Sankey</button>
              </div>
              <div className="segmented-control compact" role="group" aria-label="Chart grouping">
                <button className={chartGrouping === 'GROUP' ? 'active' : ''} onClick={() => setChartGrouping('GROUP')} type="button">Groups</button>
                <button className={chartGrouping === 'CATEGORY' ? 'active' : ''} onClick={() => setChartGrouping('CATEGORY')} type="button">Categories</button>
                <button className={chartGrouping === 'DESCRIPTION' ? 'active' : ''} onClick={() => setChartGrouping('DESCRIPTION')} type="button">Descriptions</button>
              </div>
          </div>
          {chartData.length === 0 ? (
            <EmptyState title="No chart data" body="Add expenses for this month to render charts." />
          ) : chartMode === 'SANKEY' ? (
            <SankeyPreview expenses={budgetExpenses} selectedMonth={selectedMonth} state={state} />
          ) : (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={chartMode === 'BAR' ? Math.max(320, chartData.length * 42) : 340}>
                {chartMode === 'BAR' ? (
                  <BarChart data={chartData} layout="vertical" margin={{ top: 12, right: 24, bottom: 12, left: 12 }}>
                    <XAxis type="number" tickFormatter={chartCurrencyFormatter(state.currencyCode)} />
                    <YAxis type="category" dataKey="name" width={130} />
                    <Tooltip formatter={chartCurrencyFormatter(state.currencyCode)} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Tooltip formatter={chartCurrencyFormatter(state.currencyCode)} />
                    <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={130} label>
                      {chartData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </>
      </article>
      ) : null}

      <article className="panel category-panel">
        <div className="panel-heading">
          <div>
            <h2>{viewMode === 'CATEGORY' ? 'Category totals' : 'Expenses'}</h2>
            <p>{viewMode === 'CATEGORY' ? `${totals.length} categories in the current filters.` : `${sortedIndividualExpenses.length} individual expenses.`}</p>
          </div>
          {viewMode === 'CATEGORY' ? (
            <button
              className="secondary-button"
              onClick={() => setExpandedCategories(allExpanded ? new Set() : new Set(sortedTotals.map((total) => total.category.id)))}
              type="button"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          ) : null}
        </div>
        {viewMode === 'EXPENSES' ? (
          sortedIndividualExpenses.length === 0 ? (
            <EmptyState title="No expenses" body="No regular expense matches the current filters." />
          ) : (
            <div className="expense-list">
              {sortedIndividualExpenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  state={state}
                  onEdit={() => onEditExpense(expense.id)}
                  onDelete={() => deleteExpense(expense.id)}
                  onTogglePaid={() => togglePaid(expense)}
                  onMove={() => onNavigate('expenses')}
                  onCopy={() => copyToNextMonth(expense)}
                />
              ))}
            </div>
          )
        ) : totals.length === 0 ? (
          <EmptyState title="No category totals" body="No regular expense matches the current filters." />
        ) : (
          <div className="category-card-list">
            {sortedTotals.map((total) => {
              const categoryExpenses = filteredExpenses.filter((expense) => expense.categoryId === total.category.id);
              const open = expandedCategories.has(total.category.id);
              const participation = displayTotalCents > 0 ? (total.totalCents / displayTotalCents) * 100 : 0;
              const separatedCategory = Boolean(total.category.separateFromTotals);
              return (
                <article key={total.category.id} className="category-total-card">
                  <button className="category-total-header" onClick={() => toggleCategory(total.category.id)} type="button">
                    <span>{total.category.group} / {total.category.label} - {participation.toFixed(1)}%{separatedCategory ? ' - separated' : ''}</span>
                    <strong>{formatMoney(total.totalCents, state.currencyCode)}</strong>
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                  {open ? (
                    <div className="expense-list nested">
                      {categoryExpenses.map((expense) => (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          state={state}
                          onEdit={() => onEditExpense(expense.id)}
                          onDelete={() => deleteExpense(expense.id)}
                          onTogglePaid={() => togglePaid(expense)}
                          onMove={() => onNavigate('expenses')}
                          onCopy={() => copyToNextMonth(expense)}
                        />
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </article>

      {separatedTotals.length > 0 ? (
        <article className="panel separated-panel">
          <div className="panel-heading"><h2>Separated expenses</h2><ReceiptText size={20} /></div>
          <div className="compact-list">
            {separatedTotals.map((total) => (
              <div key={total.category.id} className="compact-row">
                <span>{total.category.label}</span>
                <strong>{formatMoney(total.totalCents, state.currencyCode)}</strong>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {filtersOpen ? (
        <ModalShell title="Visualization filters" onClose={() => setFiltersOpen(false)}>
          <div className="filter-modal-grid">
            <label>View
              <select value={viewMode} onChange={(event) => setViewMode(event.target.value as 'CATEGORY' | 'EXPENSES')}>
                <option value="CATEGORY">Category totals</option>
                <option value="EXPENSES">Individual expenses</option>
              </select>
            </label>
            <label className="switch-row modal-switch">Include separated in budget<input type="checkbox" checked={includeSeparatedInBudget} onChange={(event) => setIncludeSeparatedInBudget(event.target.checked)} /></label>
            <label>Sort by
              <div className="paired-control">
                <select value={sortField} onChange={(event) => setSortField(event.target.value)}>
                  <option value="TOTAL">{viewMode === 'CATEGORY' ? 'Total' : 'Amount'}</option>
                  <option value="PERCENT">Participation</option>
                  <option value="GROUP">Group</option>
                  <option value="CATEGORY">Category</option>
                  <option value="DUE_DATE">Due date</option>
                  <option value="CREATED">Added date</option>
                </select>
                <button className="secondary-button" onClick={() => setSortDirection((current) => current === 'ASC' ? 'DESC' : 'ASC')} type="button">
                  {sortDirection === 'ASC' ? 'Asc' : 'Desc'}
                </button>
              </div>
            </label>
            <label>Wallet
              <select value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)}>
                <option value="ALL">All wallets</option>
                <option value="NONE">No wallet</option>
                {state.wallets.map((walletItem) => <option key={walletItem.id} value={walletItem.id}>{walletItem.name}</option>)}
              </select>
            </label>
            <label>Group
              <select value={groupFilter} onChange={(event) => {
                setGroupFilter(event.target.value);
                setCategoryFilter('ALL');
              }}>
                <option value="ALL">All groups</option>
                {groups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </label>
            {groupFilter !== 'ALL' ? (
              <label>Category
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="ALL">All categories in group</option>
                  {filteredCategoryOptions.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                </select>
              </label>
            ) : null}
            <label>Status
              <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
                <option value="ALL">Paid and unpaid</option>
                <option value="PAID">Paid only</option>
                <option value="UNPAID">Unpaid only</option>
              </select>
            </label>
            <label>Due date
              <select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)}>
                <option value="ALL">With and without due date</option>
                <option value="WITH">With due date</option>
                <option value="WITHOUT">Without due date</option>
              </select>
            </label>
            <label>Due from<input type="date" value={dueStart} onChange={(event) => setDueStart(event.target.value)} /></label>
            <label>Due to<input type="date" value={dueEnd} onChange={(event) => setDueEnd(event.target.value)} /></label>
            <label>Search<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Description" /></label>
          </div>
          <div className="dialog-actions">
            <button className="ghost-button" onClick={() => {
              setViewMode('CATEGORY');
              setIncludeSeparatedInBudget(false);
              setSortField('TOTAL');
              setSortDirection('DESC');
              setWalletFilter('ALL');
              setGroupFilter('ALL');
              setCategoryFilter('ALL');
              setPaymentFilter('ALL');
              setDueFilter('ALL');
              setDueStart('');
              setDueEnd('');
              setKeyword('');
            }} type="button">Clear</button>
            <button className="primary-button" onClick={() => setFiltersOpen(false)} type="button">Apply</button>
          </div>
        </ModalShell>
      ) : null}
    </section>
  );
}

function chartDataForExpenses(
  expenses: Expense[],
  categories: CategoryConfig[],
  grouping: 'GROUP' | 'CATEGORY' | 'DESCRIPTION'
): Array<{ name: string; value: number }> {
  if (grouping === 'GROUP') return groupTotals(expenses, categories);

  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const category = categories.find((item) => item.id === expense.categoryId);
    const key = grouping === 'CATEGORY' ? category?.label ?? 'Other' : expense.title;
    totals.set(key, (totals.get(key) ?? 0) + expense.amountCents);
  }

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function SankeyPreview({ expenses, selectedMonth, state }: { expenses: Expense[]; selectedMonth: string; state: FinanceState }) {
  const incomeCents = incomeConfigsForMonth(state, selectedMonth).reduce((total, income) => total + income.amountCents, 0);
  const groups = groupTotals(expenses, state.categories);
  const totalExpenses = groups.reduce((total, group) => total + group.value, 0);
  const remaining = incomeCents - totalExpenses - state.recurringExpenses.reduce((total, item) => total + item.amountCents, 0);

  return (
    <div className="sankey-preview" aria-label="Sankey flow preview">
      <div className="sankey-node income-node">
        <span>Income</span>
        <strong>{formatMoney(incomeCents, state.currencyCode)}</strong>
      </div>
      <div className="sankey-flow-list">
        {groups.map((group) => (
          <div key={group.name} className="sankey-flow">
            <span>{group.name}</span>
            <div style={{ width: `${Math.max(8, (group.value / Math.max(totalExpenses, 1)) * 100)}%` }} />
            <strong>{formatMoney(group.value, state.currencyCode)}</strong>
          </div>
        ))}
      </div>
      <div className={remaining >= 0 ? 'sankey-node remaining-node' : 'sankey-node deficit-node'}>
        <span>{remaining >= 0 ? 'Remaining' : 'Deficit'}</span>
        <strong>{formatMoney(remaining, state.currencyCode)}</strong>
      </div>
    </div>
  );
}

function VisualizePaymentsSection({
  state,
  selectedMonth,
  onStateChange,
  onNavigate,
  onEditExpense
}: {
  state: FinanceState;
  selectedMonth: string;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNavigate: (view: View) => void;
  onEditExpense: (expenseId: string) => void;
}) {
  const cycleDates = financialCycleDates(selectedMonth, state.financialCycleStartDay);
  const [selectedDate, setSelectedDate] = useState(cycleDates[0] ?? dateForDayInMonth(selectedMonth, 1));
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    setSelectedDate(financialCycleDates(selectedMonth, state.financialCycleStartDay)[0] ?? dateForDayInMonth(selectedMonth, 1));
  }, [selectedMonth, state.financialCycleStartDay]);

  const monthExpenses = expensesForMonth(state.expenses, selectedMonth);
  const datedIncomes = incomeConfigsForMonth(state, selectedMonth).map((income) => ({
    ...income,
    date: incomeDateForMonth(income, selectedMonth, state.financialCycleStartDay)
  }));
  const paymentsThroughDate = monthExpenses.filter((expense) => expense.dueDate && expense.dueDate <= selectedDate);
  const incomeThroughDate = datedIncomes.filter((income) => income.date <= selectedDate);
  const selectedDayPayments = monthExpenses.filter((expense) => expense.dueDate === selectedDate);
  const selectedDayIncomes = datedIncomes.filter((income) => income.date === selectedDate);
  const expenseThroughCents = paymentsThroughDate.reduce((total, expense) => total + expense.amountCents, 0);
  const incomeThroughCents = incomeThroughDate.reduce((total, income) => total + income.amountCents, 0);
  const selectedDayExpenseCents = selectedDayPayments.reduce((total, expense) => total + expense.amountCents, 0);
  const selectedDayIncomeCents = selectedDayIncomes.reduce((total, income) => total + income.amountCents, 0);
  const throughDayBalanceCents = incomeThroughCents - expenseThroughCents;

  const markSelectedDayPaid = (paid: boolean, onlyUnpaid = false) => {
    onStateChange((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => (
        expense.dueDate === selectedDate && (!onlyUnpaid || !expense.paid) ? { ...expense, paid } : expense
      ))
    }));
  };

  return (
    <section className="payments-layout">
      <article className="panel payment-calendar-panel">
        <div className="panel-heading">
          <div>
            <h2>Payments calendar</h2>
            <p>{financialCycleStartDate(selectedMonth, state.financialCycleStartDay)} - {addDays(financialCycleEndDateExclusive(selectedMonth, state.financialCycleStartDay), -1)}</p>
          </div>
          <button className="secondary-button" disabled={selectedDayPayments.length === 0} onClick={() => setBulkOpen(true)} type="button">
            Bulk actions
          </button>
        </div>
        <div className="payment-calendar-grid">
          {cycleDates.map((date) => {
            const paymentsForDay = monthExpenses.filter((expense) => expense.dueDate === date);
            const incomesForDay = datedIncomes.filter((income) => income.date === date);
            const hasPayment = paymentsForDay.length > 0;
            const hasIncome = incomesForDay.length > 0;
            return (
              <button
                key={date}
                className={`payment-day ${date === selectedDate ? 'selected' : ''} ${hasPayment ? 'has-payment' : ''} ${hasIncome ? 'has-income' : ''}`}
                aria-label={`Select ${date}`}
                onClick={() => setSelectedDate(date)}
                type="button"
              >
                <span className="payment-day-number">{Number(date.slice(8, 10))}</span>
                <span className="payment-day-indicators">
                  <PaymentDayBillIndicator count={paymentsForDay.length} />
                  {hasIncome ? <DollarSign className="payment-day-income-icon" size={16} aria-hidden="true" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </article>

      <section className="payment-detail-stack">
        <div className="metric-grid payment-metrics">
          <MetricCard label={`Expenses through ${selectedDate}`} value={formatMoney(expenseThroughCents, state.currencyCode)} />
          <MetricCard label={`Income through ${selectedDate}`} value={formatMoney(incomeThroughCents, state.currencyCode)} tone="positive" />
          <MetricCard label={`Expenses on ${selectedDate}`} value={formatMoney(selectedDayExpenseCents, state.currencyCode)} />
          <MetricCard label={`Income on ${selectedDate}`} value={formatMoney(selectedDayIncomeCents, state.currencyCode)} tone="positive" />
          <MetricCard label="Income - expenses through day" value={formatMoney(throughDayBalanceCents, state.currencyCode)} tone={throughDayBalanceCents >= 0 ? 'positive' : 'negative'} />
          {selectedDayIncomes.length === 0 ? (
            <MetricCard label="Income - expenses on selected day" value={formatMoney(-selectedDayExpenseCents, state.currencyCode)} tone={selectedDayExpenseCents === 0 ? undefined : 'negative'} />
          ) : selectedDayIncomes.map((income) => {
            const selectedDayIncomeBalanceCents = income.amountCents - selectedDayExpenseCents;
            return (
              <MetricCard
                key={income.id}
                label={`${income.description} - selected day expenses`}
                value={formatMoney(selectedDayIncomeBalanceCents, state.currencyCode)}
                tone={selectedDayIncomeBalanceCents >= 0 ? 'positive' : 'negative'}
              />
            );
          })}
        </div>

        <article className="panel">
          <div className="panel-heading"><h2>Income on selected day</h2><CircleDollarSign size={20} /></div>
          {selectedDayIncomes.length === 0 ? (
            <p className="muted">No income arrives on this day.</p>
          ) : (
            <div className="compact-list">
              {selectedDayIncomes.map((income) => (
                <div key={income.id} className="compact-row">
                  <span>{income.description}</span>
                  <strong>{formatMoney(income.amountCents, state.currencyCode)}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading"><h2>Payments on selected day</h2><ReceiptText size={20} /></div>
          {selectedDayPayments.length === 0 ? (
            <EmptyState title="No payments due" body="Select a highlighted day or set due dates on expenses." />
          ) : (
            <div className="expense-list">
              {selectedDayPayments.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  state={state}
                  onEdit={() => onEditExpense(expense.id)}
                  onDelete={() => onStateChange((current) => ({
                    ...current,
                    expenses: current.expenses.map((item) => item.id === expense.id ? { ...item, deletedAt: new Date().toISOString() } : item)
                  }))}
                  onTogglePaid={() => onStateChange((current) => ({
                    ...current,
                    expenses: current.expenses.map((item) => item.id === expense.id ? { ...item, paid: !item.paid } : item)
                  }))}
                  onMove={() => onNavigate('expenses')}
                  onCopy={() => onStateChange((current) => ({
                    ...current,
                    expenses: [{
                      ...expense,
                      id: createId('expense'),
                      month: shiftMonthPrefix(expense.month || monthPrefixFromDate(expense.date), 1),
                      dueDate: expense.dueDate ? addMonths(expense.dueDate, 1) : undefined,
                      createdAt: new Date().toISOString()
                    }, ...current.expenses]
                  }))}
                />
              ))}
            </div>
          )}
        </article>
      </section>

      {bulkOpen ? (
        <BulkPaymentActionsDialog
          state={state}
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          expenses={selectedDayPayments}
          onClose={() => setBulkOpen(false)}
          onMarkPaid={() => markSelectedDayPaid(true)}
          onMarkUnpaid={() => markSelectedDayPaid(false)}
          onMarkUnpaidAsPaid={() => markSelectedDayPaid(true, true)}
          onStateChange={onStateChange}
        />
      ) : null}
    </section>
  );
}

function PaymentDayBillIndicator({ count }: { count: number }) {
  if (count === 0) return null;

  if (count > 3) {
    return (
      <span className="payment-day-bill-count" aria-hidden="true">
        <span>{count}</span>
        <ReceiptText size={15} />
      </span>
    );
  }

  return (
    <span className="payment-day-bill-icons" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <ReceiptText key={index} size={15} />)}
    </span>
  );
}

function BulkPaymentActionsDialog({
  state,
  selectedDate,
  selectedMonth,
  expenses,
  onClose,
  onMarkPaid,
  onMarkUnpaid,
  onMarkUnpaidAsPaid,
  onStateChange
}: {
  state: FinanceState;
  selectedDate: string;
  selectedMonth: string;
  expenses: Expense[];
  onClose: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onMarkUnpaidAsPaid: () => void;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
}) {
  const [walletId, setWalletId] = useState(state.wallets[0]?.id ?? '');
  const categoryOptions = activeCategoryOptions(state.categories);
  const [categoryId, setCategoryId] = useState(categoryOptions[0]?.id ?? 'OTHER');
  const [targetMonth, setTargetMonth] = useState(shiftMonthPrefix(selectedMonth, 1));
  const expenseIds = new Set(expenses.map((expense) => expense.id));

  const updateSelected = (mapExpense: (expense: Expense) => Expense) => {
    onStateChange((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => expenseIds.has(expense.id) ? mapExpense(expense) : expense)
    }));
  };

  const deleteSelected = () => {
    updateSelected((expense) => ({ ...expense, deletedAt: new Date().toISOString() }));
    onClose();
  };

  const copySelected = () => {
    onStateChange((current) => ({
      ...current,
      expenses: [
        ...expenses.map((expense) => ({
          ...expense,
          id: createId('expense'),
          month: shiftMonthPrefix(expense.month || monthPrefixFromDate(expense.date), 1),
          dueDate: expense.dueDate ? addMonths(expense.dueDate, 1) : undefined,
          createdAt: new Date().toISOString()
        })),
        ...current.expenses
      ]
    }));
    onClose();
  };

  const moveSelected = () => {
    updateSelected((expense) => ({
      ...expense,
      month: targetMonth,
      dueDate: expense.dueDate ? dateForDayInMonth(targetMonth, Number(expense.dueDate.slice(8, 10))) : undefined
    }));
    onClose();
  };

  return (
    <ModalShell title="Bulk actions" onClose={onClose}>
      <p>{expenses.length} payment{expenses.length === 1 ? '' : 's'} due on {selectedDate}.</p>
      <div className="bulk-action-sections">
        <div>
          <h3>Status</h3>
          <div className="button-row wrap">
            <button className="secondary-button" onClick={onMarkPaid} type="button">Mark all paid</button>
            <button className="secondary-button" onClick={onMarkUnpaidAsPaid} type="button">Mark unpaid paid</button>
            <button className="secondary-button" onClick={onMarkUnpaid} type="button">Mark all unpaid</button>
          </div>
        </div>
        <div>
          <h3>Wallet</h3>
          <div className="inline-form-row">
            <select value={walletId} onChange={(event) => setWalletId(event.target.value)}>
              <option value="">No wallet</option>
              {state.wallets.map((walletItem) => <option key={walletItem.id} value={walletItem.id}>{walletItem.name}</option>)}
            </select>
            <button className="secondary-button" onClick={() => updateSelected((expense) => ({ ...expense, walletId: walletId || undefined }))} type="button">Apply wallet</button>
          </div>
        </div>
        <div>
          <h3>Category</h3>
          <div className="inline-form-row">
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.group} / {category.label}</option>)}
            </select>
            <button className="secondary-button" onClick={() => updateSelected((expense) => ({ ...expense, categoryId }))} type="button">Apply category</button>
          </div>
        </div>
        <div>
          <h3>Shift due dates</h3>
          <div className="button-row wrap">
            <button className="secondary-button" onClick={() => updateSelected((expense) => ({ ...expense, dueDate: addDays(selectedDate, 1) }))} type="button">+1 day</button>
            <button className="secondary-button" onClick={() => updateSelected((expense) => ({ ...expense, dueDate: addDays(selectedDate, 7) }))} type="button">+7 days</button>
            <button className="secondary-button" onClick={() => updateSelected((expense) => ({ ...expense, dueDate: nextBusinessDay(selectedDate) }))} type="button">Next business day</button>
          </div>
        </div>
        <div>
          <h3>Copy or move</h3>
          <div className="inline-form-row">
            <select value={targetMonth} onChange={(event) => setTargetMonth(event.target.value)}>
              {monthOptions(selectedMonth).filter((month) => month !== selectedMonth).map((month) => (
                <option key={month} value={month}>{formatMonth(month)}</option>
              ))}
            </select>
            <button className="secondary-button" onClick={moveSelected} type="button">Move</button>
            <button className="secondary-button" onClick={copySelected} type="button">Copy next month</button>
          </div>
        </div>
        <div>
          <h3>Delete</h3>
          <button className="primary-button danger" onClick={deleteSelected} type="button">Delete day payments</button>
        </div>
      </div>
    </ModalShell>
  );
}

function FinancialConfigurationsView({
  state,
  selectedMonth,
  activeSection,
  onSectionChange,
  onStateChange,
  onNotify
}: {
  state: FinanceState;
  selectedMonth: string;
  activeSection: FinancialSection;
  onSectionChange: (section: FinancialSection) => void;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNotify: NotifyFn;
}) {
  const [cycleDay, setCycleDay] = useState(String(state.financialCycleStartDay));
  const [incomeDraft, setIncomeDraft] = useState({ description: '', amount: '', day: '1', businessOnly: false, walletId: '' });
  const [recurringDraft, setRecurringDraft] = useState({ description: '', amount: '' });
  const [walletDraft, setWalletDraft] = useState({ name: '', amount: '' });
  const [incomeEditDrafts, setIncomeEditDrafts] = useState<Record<string, IncomeEditDraft>>({});
  const [recurringEditDrafts, setRecurringEditDrafts] = useState<Record<string, RecurringEditDraft>>({});
  const [walletEditDrafts, setWalletEditDrafts] = useState<Record<string, WalletEditDraft>>({});
  const [removeTarget, setRemoveTarget] = useState<{ kind: 'income' | 'recurring' | 'wallet'; id: string; label: string } | null>(null);

  const hasMonthOverride = Object.prototype.hasOwnProperty.call(state.monthlyIncomeEntries, selectedMonth);
  const selectedMonthIncomes = sortedIncomes(incomeConfigsForMonth(state, selectedMonth));
  const selectedMonthIncomeCents = selectedMonthIncomes.reduce((total, income) => total + income.amountCents, 0);
  const defaultIncomeCents = state.incomes.reduce((total, income) => total + income.amountCents, 0);
  const recurringCents = state.recurringExpenses.reduce((total, item) => total + item.amountCents, 0);
  const walletsCents = state.wallets.reduce((total, walletItem) => total + walletItem.balanceCents, 0);
  const projectedBaseCents = selectedMonthIncomeCents - recurringCents;
  const walletNameById = new Map(state.wallets.map((walletItem) => [walletItem.id, walletItem.name]));
  const cycleDirty = cycleDay !== String(state.financialCycleStartDay);

  const updateIncomeEditDraft = (income: IncomeConfig, patch: Partial<IncomeEditDraft>) => {
    setIncomeEditDrafts((current) => ({
      ...current,
      [income.id]: {
        ...(current[income.id] ?? incomeEditDraftFromConfig(income)),
        ...patch
      }
    }));
  };

  const updateRecurringEditDraft = (item: RecurringExpenseConfig, patch: Partial<RecurringEditDraft>) => {
    setRecurringEditDrafts((current) => ({
      ...current,
      [item.id]: {
        ...(current[item.id] ?? recurringEditDraftFromConfig(item)),
        ...patch
      }
    }));
  };

  const updateWalletEditDraft = (walletItem: WalletConfig, patch: Partial<WalletEditDraft>) => {
    setWalletEditDrafts((current) => ({
      ...current,
      [walletItem.id]: {
        ...(current[walletItem.id] ?? walletEditDraftFromConfig(walletItem)),
        ...patch
      }
    }));
  };

  const saveCycle = () => {
    const parsed = clampDay(Number(cycleDay) || 1);
    onStateChange((current) => ({ ...current, financialCycleStartDay: parsed }));
    setCycleDay(String(parsed));
  };

  const addIncome = () => {
    const amountCents = parseMoneyToCents(incomeDraft.amount);
    const description = incomeDraft.description.trim();
    if (!description || !Number.isFinite(amountCents)) {
      onNotify({ tone: 'error', text: 'Income needs a description and a valid amount.' });
      return;
    }
    if (selectedMonthIncomes.some((income) => sameText(income.description, description))) {
      onNotify({ tone: 'error', text: 'Income descriptions must be unique for the selected month.' });
      return;
    }

    const nextIncome: IncomeConfig = {
      id: createId('income'),
      description,
      amountCents,
      day: clampDay(Number(incomeDraft.day) || 1),
      businessOnly: incomeDraft.businessOnly,
      walletId: incomeDraft.walletId || undefined
    };

    onStateChange((current) => ({
      ...current,
      monthlyIncomeEntries: {
        ...current.monthlyIncomeEntries,
        [selectedMonth]: sortedIncomes([...incomeConfigsForMonth(current, selectedMonth), nextIncome])
      }
    }));
    setIncomeDraft({ description: '', amount: '', day: '1', businessOnly: false, walletId: '' });
  };

  const addRecurring = () => {
    const amountCents = parseMoneyToCents(recurringDraft.amount);
    const description = recurringDraft.description.trim();
    if (!description || !Number.isFinite(amountCents)) {
      onNotify({ tone: 'error', text: 'Recurring expense needs a description and a valid amount.' });
      return;
    }
    if (state.recurringExpenses.some((expense) => sameText(expense.description, description))) {
      onNotify({ tone: 'error', text: 'Recurring expense descriptions must be unique.' });
      return;
    }

    onStateChange((current) => ({
      ...current,
      recurringExpenses: [
        ...current.recurringExpenses,
        { id: createId('recurring'), description, amountCents }
      ]
    }));
    setRecurringDraft({ description: '', amount: '' });
  };

  const addWallet = () => {
    const amountCents = parseMoneyToCents(walletDraft.amount || '0');
    const name = walletDraft.name.trim();
    if (!name || !Number.isFinite(amountCents)) {
      onNotify({ tone: 'error', text: 'Wallet needs a name and a valid amount.' });
      return;
    }
    if (state.wallets.some((walletItem) => sameText(walletItem.name, name))) {
      onNotify({ tone: 'error', text: 'Wallet names must be unique.' });
      return;
    }

    onStateChange((current) => ({
      ...current,
      wallets: [
        ...current.wallets,
        { id: createId('wallet'), name, balanceCents: amountCents }
      ]
    }));
    setWalletDraft({ name: '', amount: '' });
  };

  const updateSelectedMonthIncome = (id: string, nextIncome: IncomeConfig) => {
    onStateChange((current) => ({
      ...current,
      monthlyIncomeEntries: {
        ...current.monthlyIncomeEntries,
        [selectedMonth]: sortedIncomes(incomeConfigsForMonth(current, selectedMonth).map((income) => (
          income.id === id ? nextIncome : income
        )))
      }
    }));
  };

  const saveIncomeEdit = (income: IncomeConfig, updateSameName = false) => {
    const draft = incomeEditDrafts[income.id] ?? incomeEditDraftFromConfig(income);
    const description = draft.description.trim();
    const amountCents = parseMoneyToCents(draft.amount);
    if (!description || !Number.isFinite(amountCents)) {
      onNotify({ tone: 'error', text: 'Income needs a description and a valid amount.' });
      return;
    }
    if (selectedMonthIncomes.some((item) => item.id !== income.id && sameText(item.description, description))) {
      onNotify({ tone: 'error', text: 'Income descriptions must be unique for the selected month.' });
      return;
    }

    const nextIncome: IncomeConfig = {
      ...income,
      description,
      amountCents,
      day: clampDay(Number(draft.day) || 1),
      businessOnly: draft.businessOnly,
      walletId: draft.walletId || undefined
    };

    if (updateSameName) {
      updateSameIncomeAcrossMonths(nextIncome, income.description);
    } else {
      updateSelectedMonthIncome(income.id, nextIncome);
    }
    setIncomeEditDrafts((current) => {
      const { [income.id]: _removed, ...remaining } = current;
      return remaining;
    });
  };

  const resetSelectedMonthToDefault = () => {
    onStateChange((current) => {
      const { [selectedMonth]: _removed, ...remainingMonths } = current.monthlyIncomeEntries;
      return { ...current, monthlyIncomeEntries: remainingMonths };
    });
  };

  const setCurrentMonthAsDefault = () => {
    onStateChange((current) => ({
      ...current,
      incomes: selectedMonthIncomes
    }));
  };

  const copyCurrentMonthToNextYear = () => {
    onStateChange((current) => {
      const nextMonthlyEntries = { ...current.monthlyIncomeEntries };
      for (let index = 1; index <= 12; index += 1) {
        nextMonthlyEntries[shiftMonthPrefix(selectedMonth, index)] = selectedMonthIncomes.map((income) => ({
          ...income,
          id: createId('income')
        }));
      }
      return { ...current, monthlyIncomeEntries: nextMonthlyEntries };
    });
  };

  const updateSameIncomeAcrossMonths = (sourceIncome: IncomeConfig, previousDescription = sourceIncome.description) => {
    let changedMonthsCount = 0;
    onStateChange((current) => {
      const nextMonthlyEntries = Object.fromEntries(
        Object.entries(current.monthlyIncomeEntries).map(([month, entries]) => {
          if (!entries.some((income) => sameText(income.description, previousDescription))) {
            return [month, entries];
          }
          changedMonthsCount += 1;
          return [month, sortedIncomes(entries.map((income) => (
            sameText(income.description, previousDescription) ? { ...sourceIncome, id: income.id } : income
          )))];
        })
      );

      const nextDefaultIncomes = current.incomes.map((income) => (
        sameText(income.description, previousDescription) ? { ...sourceIncome, id: income.id } : income
      ));

      return {
        ...current,
        incomes: sortedIncomes(nextDefaultIncomes),
        monthlyIncomeEntries: nextMonthlyEntries
      };
    });
    if (changedMonthsCount === 0) {
      onNotify({ tone: 'info', text: 'No configured monthly entries with this name were found.' });
    }
  };

  const updateRecurring = (id: string, nextExpense: RecurringExpenseConfig) => {
    onStateChange((current) => ({
      ...current,
      recurringExpenses: current.recurringExpenses.map((expense) => expense.id === id ? nextExpense : expense)
    }));
  };

  const saveRecurringEdit = (item: RecurringExpenseConfig) => {
    const draft = recurringEditDrafts[item.id] ?? recurringEditDraftFromConfig(item);
    const description = draft.description.trim();
    const amountCents = parseMoneyToCents(draft.amount);
    if (!description || !Number.isFinite(amountCents)) {
      onNotify({ tone: 'error', text: 'Recurring expense needs a description and a valid amount.' });
      return;
    }
    if (state.recurringExpenses.some((expense) => expense.id !== item.id && sameText(expense.description, description))) {
      onNotify({ tone: 'error', text: 'Recurring expense descriptions must be unique.' });
      return;
    }

    updateRecurring(item.id, { ...item, description, amountCents });
    setRecurringEditDrafts((current) => {
      const { [item.id]: _removed, ...remaining } = current;
      return remaining;
    });
  };

  const updateWallet = (id: string, nextWallet: WalletConfig) => {
    onStateChange((current) => ({
      ...current,
      wallets: current.wallets.map((walletItem) => walletItem.id === id ? nextWallet : walletItem)
    }));
  };

  const saveWalletEdit = (walletItem: WalletConfig) => {
    const draft = walletEditDrafts[walletItem.id] ?? walletEditDraftFromConfig(walletItem);
    const name = draft.name.trim();
    const balanceCents = parseMoneyToCents(draft.amount || '0');
    if (!name || !Number.isFinite(balanceCents)) {
      onNotify({ tone: 'error', text: 'Wallet needs a name and a valid amount.' });
      return;
    }
    if (state.wallets.some((item) => item.id !== walletItem.id && sameText(item.name, name))) {
      onNotify({ tone: 'error', text: 'Wallet names must be unique.' });
      return;
    }

    updateWallet(walletItem.id, { ...walletItem, name, balanceCents });
    setWalletEditDrafts((current) => {
      const { [walletItem.id]: _removed, ...remaining } = current;
      return remaining;
    });
  };

  const removeConfirmed = () => {
    if (!removeTarget) return;
    onStateChange((current) => ({
      ...current,
      expenses: removeTarget.kind === 'wallet'
        ? current.expenses.map((expense) => expense.walletId === removeTarget.id ? { ...expense, walletId: undefined } : expense)
        : current.expenses,
      incomes: removeTarget.kind === 'wallet'
        ? current.incomes.map((income) => income.walletId === removeTarget.id ? { ...income, walletId: undefined } : income)
        : current.incomes,
      monthlyIncomeEntries: removeTarget.kind === 'income'
        ? {
            ...current.monthlyIncomeEntries,
            [selectedMonth]: incomeConfigsForMonth(current, selectedMonth).filter((income) => income.id !== removeTarget.id)
          }
        : removeTarget.kind === 'wallet'
          ? Object.fromEntries(Object.entries(current.monthlyIncomeEntries).map(([month, entries]) => [
              month,
              entries.map((income) => income.walletId === removeTarget.id ? { ...income, walletId: undefined } : income)
            ]))
          : current.monthlyIncomeEntries,
      recurringExpenses: removeTarget.kind === 'recurring' ? current.recurringExpenses.filter((item) => item.id !== removeTarget.id) : current.recurringExpenses,
      wallets: removeTarget.kind === 'wallet' ? current.wallets.filter((item) => item.id !== removeTarget.id) : current.wallets
    }));
    setRemoveTarget(null);
  };

  return (
    <main className="screen">
      <ScreenHeader
        eyebrow="Financial configurations"
        title={`Configure ${formatMonth(selectedMonth)}`}
        description="Manage financial cycle, monthly incomes, recurring expenses and wallets."
      />

      <section className="metric-grid">
        <MetricCard label={`${formatMonth(selectedMonth)} income`} value={formatMoney(selectedMonthIncomeCents, state.currencyCode)} tone="positive" />
        <MetricCard label="Default income list" value={formatMoney(defaultIncomeCents, state.currencyCode)} />
        <MetricCard label="Recurring expenses" value={formatMoney(recurringCents, state.currencyCode)} tone="negative" />
        <MetricCard label="Projected base" value={formatMoney(projectedBaseCents, state.currencyCode)} tone={projectedBaseCents >= 0 ? 'positive' : 'negative'} />
      </section>

      <section className="financial-config-grid">
        <article className="panel financial-summary-panel">
          <div className="panel-heading">
            <div>
              <h2>Financial cycle</h2>
              <p>Defines the period used by the calendar and monthly income dates.</p>
            </div>
            <CalendarDays size={20} aria-hidden="true" />
          </div>
          <div className="form-grid">
            <label>Cycle start day<input min="1" max="31" type="number" value={cycleDay} onChange={(event) => setCycleDay(event.target.value)} /></label>
            {cycleDirty ? <button className="primary-button" onClick={saveCycle} type="button"><Save size={16} /> Save cycle</button> : null}
          </div>
          <dl className="summary-list financial-mini-summary">
            <div><dt>Current month</dt><dd>{hasMonthOverride ? 'Custom income' : 'Default income'}</dd></div>
            <div><dt>Wallet balance</dt><dd>{formatMoney(walletsCents, state.currencyCode)}</dd></div>
          </dl>
        </article>

        <section className="financial-workspace">
          <div className="section-tabs" role="tablist" aria-label="Financial configuration sections">
            <button className={activeSection === 'income' ? 'active' : ''} onClick={() => onSectionChange('income')} role="tab" type="button">
              <CircleDollarSign size={17} aria-hidden="true" /> Income
            </button>
            <button className={activeSection === 'recurring' ? 'active' : ''} onClick={() => onSectionChange('recurring')} role="tab" type="button">
              <Repeat size={17} aria-hidden="true" /> Recurring
            </button>
            <button className={activeSection === 'wallets' ? 'active' : ''} onClick={() => onSectionChange('wallets')} role="tab" type="button">
              <Wallet size={17} aria-hidden="true" /> Wallets
            </button>
          </div>

          {activeSection === 'income' ? (
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Monthly income for {formatMonth(selectedMonth)}</h2>
                  <p>{hasMonthOverride ? 'This month has its own income list.' : 'This month is using the default income list.'}</p>
                </div>
                <CircleDollarSign size={20} aria-hidden="true" />
              </div>

              <div className="quick-actions-panel">
                <button className="secondary-button" disabled={!hasMonthOverride} onClick={resetSelectedMonthToDefault} type="button">
                  <ArrowRightLeft size={16} /> Use default
                </button>
                <button className="secondary-button" disabled={selectedMonthIncomes.length === 0} onClick={setCurrentMonthAsDefault} type="button">
                  <Save size={16} /> Set as default
                </button>
                <button className="secondary-button" disabled={selectedMonthIncomes.length === 0} onClick={copyCurrentMonthToNextYear} type="button">
                  <Copy size={16} /> Copy to next 12 months
                </button>
              </div>

              <div className="filter-grid compact financial-entry-form">
                <label>Description<input value={incomeDraft.description} onChange={(event) => setIncomeDraft((current) => ({ ...current, description: event.target.value }))} /></label>
                <label>Amount<input inputMode="decimal" value={incomeDraft.amount} onChange={(event) => setIncomeDraft((current) => ({ ...current, amount: event.target.value }))} /></label>
                <label>Day<input min="1" max="31" type="number" value={incomeDraft.day} onChange={(event) => setIncomeDraft((current) => ({ ...current, day: event.target.value }))} /></label>
                <label>Wallet
                  <select value={incomeDraft.walletId} onChange={(event) => setIncomeDraft((current) => ({ ...current, walletId: event.target.value }))}>
                    <option value="">No wallet</option>
                    {state.wallets.map((walletItem) => <option key={walletItem.id} value={walletItem.id}>{walletItem.name}</option>)}
                  </select>
                </label>
                <label className="switch-row">Business only<input type="checkbox" checked={incomeDraft.businessOnly} onChange={(event) => setIncomeDraft((current) => ({ ...current, businessOnly: event.target.checked }))} /></label>
                <button className="primary-button" onClick={addIncome} type="button"><Plus size={16} /> Add monthly income</button>
              </div>

              {selectedMonthIncomes.length === 0 ? (
                <EmptyState title="No income configured" body="Add income entries for the selected month or set a default income list." />
              ) : (
                <div className="editable-config-list">
                  {selectedMonthIncomes.map((income) => {
                    const editDraft = incomeEditDrafts[income.id] ?? incomeEditDraftFromConfig(income);
                    const isDirty = isIncomeEditDirty(editDraft, income);
                    return (
                      <article key={income.id} className="editable-config-row">
                        <label>Description<input value={editDraft.description} onChange={(event) => updateIncomeEditDraft(income, { description: event.target.value })} /></label>
                        <label>Amount<input inputMode="decimal" value={editDraft.amount} onChange={(event) => updateIncomeEditDraft(income, { amount: event.target.value })} /></label>
                        <label>Day<input min="1" max="31" type="number" value={editDraft.day} onChange={(event) => updateIncomeEditDraft(income, { day: event.target.value })} /></label>
                        <label>Wallet
                          <select value={editDraft.walletId} onChange={(event) => updateIncomeEditDraft(income, { walletId: event.target.value })}>
                            <option value="">No wallet</option>
                            {state.wallets.map((walletItem) => <option key={walletItem.id} value={walletItem.id}>{walletItem.name}</option>)}
                          </select>
                        </label>
                        <label className="switch-row">Business only<input type="checkbox" checked={editDraft.businessOnly} onChange={(event) => updateIncomeEditDraft(income, { businessOnly: event.target.checked })} /></label>
                        <div className="item-toolbar">
                          <span>{incomeDateForMonth(income, selectedMonth, state.financialCycleStartDay)}{income.walletId ? ` - ${walletNameById.get(income.walletId) ?? 'Wallet'}` : ''}</span>
                          {isDirty ? <button className="secondary-button" onClick={() => saveIncomeEdit(income, true)} type="button"><Save size={16} /> Update same name</button> : null}
                          {isDirty ? <button className="primary-button" onClick={() => saveIncomeEdit(income)} type="button"><Save size={16} /> Save changes</button> : null}
                          <button className="icon-button danger-text" aria-label={`Remove ${income.description}`} onClick={() => setRemoveTarget({ kind: 'income', id: income.id, label: income.description })} type="button"><Trash2 size={16} /></button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          ) : null}

          {activeSection === 'recurring' ? (
            <article className="panel">
              <div className="panel-heading"><h2>Recurring expenses</h2><Repeat size={20} /></div>
              <div className="filter-grid compact financial-entry-form">
                <label>Description<input value={recurringDraft.description} onChange={(event) => setRecurringDraft((current) => ({ ...current, description: event.target.value }))} /></label>
                <label>Amount<input inputMode="decimal" value={recurringDraft.amount} onChange={(event) => setRecurringDraft((current) => ({ ...current, amount: event.target.value }))} /></label>
                <button className="primary-button" onClick={addRecurring} type="button"><Plus size={16} /> Add recurring expense</button>
              </div>
              {state.recurringExpenses.length === 0 ? (
                <EmptyState title="No recurring expenses" body="Add fixed monthly commitments to keep projected balance accurate." />
              ) : (
                <div className="editable-config-list">
                  {state.recurringExpenses.map((item) => {
                    const editDraft = recurringEditDrafts[item.id] ?? recurringEditDraftFromConfig(item);
                    const isDirty = isRecurringEditDirty(editDraft, item);
                    return (
                      <article key={item.id} className="editable-config-row compact-editable-row">
                        <label>Description<input value={editDraft.description} onChange={(event) => updateRecurringEditDraft(item, { description: event.target.value })} /></label>
                        <label>Amount<input inputMode="decimal" value={editDraft.amount} onChange={(event) => updateRecurringEditDraft(item, { amount: event.target.value })} /></label>
                        <div className="item-toolbar">
                          <span>{formatMoney(item.amountCents, state.currencyCode)}</span>
                          {isDirty ? <button className="primary-button" onClick={() => saveRecurringEdit(item)} type="button"><Save size={16} /> Save changes</button> : null}
                          <button className="icon-button danger-text" aria-label={`Remove ${item.description}`} onClick={() => setRemoveTarget({ kind: 'recurring', id: item.id, label: item.description })} type="button"><Trash2 size={16} /></button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          ) : null}

          {activeSection === 'wallets' ? (
            <article className="panel">
              <div className="panel-heading"><h2>Wallets</h2><Wallet size={20} /></div>
              <div className="filter-grid compact financial-entry-form">
                <label>Name<input value={walletDraft.name} onChange={(event) => setWalletDraft((current) => ({ ...current, name: event.target.value }))} /></label>
                <label>Amount<input inputMode="decimal" value={walletDraft.amount} onChange={(event) => setWalletDraft((current) => ({ ...current, amount: event.target.value }))} /></label>
                <button className="primary-button" onClick={addWallet} type="button"><Plus size={16} /> Add wallet</button>
              </div>
              {state.wallets.length === 0 ? (
                <EmptyState title="No wallets configured" body="Add checking accounts, cash reserves or other balances used by payments." />
              ) : (
                <div className="editable-config-list">
                  {state.wallets.map((walletItem) => {
                    const editDraft = walletEditDrafts[walletItem.id] ?? walletEditDraftFromConfig(walletItem);
                    const isDirty = isWalletEditDirty(editDraft, walletItem);
                    return (
                      <article key={walletItem.id} className="editable-config-row compact-editable-row">
                        <label>Name<input value={editDraft.name} onChange={(event) => updateWalletEditDraft(walletItem, { name: event.target.value })} /></label>
                        <label>Amount<input inputMode="decimal" value={editDraft.amount} onChange={(event) => updateWalletEditDraft(walletItem, { amount: event.target.value })} /></label>
                        <div className="item-toolbar">
                          <span>{formatMoney(walletItem.balanceCents, state.currencyCode)}</span>
                          {isDirty ? <button className="primary-button" onClick={() => saveWalletEdit(walletItem)} type="button"><Save size={16} /> Save changes</button> : null}
                          <button className="icon-button danger-text" aria-label={`Remove ${walletItem.name}`} onClick={() => setRemoveTarget({ kind: 'wallet', id: walletItem.id, label: walletItem.name })} type="button"><Trash2 size={16} /></button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          ) : null}
        </section>
      </section>

      {removeTarget ? (
        <ConfirmDialog
          title="Remove item?"
          body={`This removes "${removeTarget.label}" from the financial configuration.`}
          confirmLabel="Remove"
          danger
          onCancel={() => setRemoveTarget(null)}
          onConfirm={removeConfirmed}
        />
      ) : null}
    </main>
  );
}

function sameText(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function SettingsView({
  state,
  selectedMonth,
  activeSection,
  onSectionChange,
  onStateChange,
  onNotify
}: {
  state: FinanceState;
  selectedMonth: string;
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNotify: NotifyFn;
}) {
  return (
    <main className="screen">
      <ScreenHeader
        eyebrow="Settings"
        title="Application settings"
        description="Configure the category catalog, quick expense options and account data operations."
      />
      <div className="section-tabs" role="tablist" aria-label="Settings sections">
        <button className={activeSection === 'categories' ? 'active' : ''} onClick={() => onSectionChange('categories')} role="tab" type="button">
          <Tags size={17} aria-hidden="true" /> Category catalog
        </button>
        <button className={activeSection === 'quickOptions' ? 'active' : ''} onClick={() => onSectionChange('quickOptions')} role="tab" type="button">
          <SlidersHorizontal size={17} aria-hidden="true" /> Quick options
        </button>
        <button className={activeSection === 'dataManagement' ? 'active' : ''} onClick={() => onSectionChange('dataManagement')} role="tab" type="button">
          <Database size={17} aria-hidden="true" /> Data management
        </button>
      </div>

      {activeSection === 'categories' ? <CategoryCatalogSection state={state} onStateChange={onStateChange} onNotify={onNotify} /> : null}
      {activeSection === 'quickOptions' ? <QuickOptionsSection state={state} onStateChange={onStateChange} onNotify={onNotify} /> : null}
      {activeSection === 'dataManagement' ? (
        <DataManagementSection state={state} selectedMonth={selectedMonth} onStateChange={onStateChange} onNotify={onNotify} />
      ) : null}
    </main>
  );
}

function CategoryCatalogSection({
  state,
  onStateChange,
  onNotify
}: {
  state: FinanceState;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNotify: NotifyFn;
}) {
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(() => state.categoryGroups.find((group) => !group.deletedAt)?.id ?? state.categoryGroups[0]?.id ?? '');
  const [groupDraft, setGroupDraft] = useState({ code: '', label: '', colorHex: '#35d07f', iconKey: 'tag', sortOrder: '' });
  const [groupEditDrafts, setGroupEditDrafts] = useState<Record<string, GroupEditDraft>>({});
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState({
    code: '',
    label: '',
    group: state.categoryGroups.find((group) => !group.deletedAt)?.label ?? 'Other',
    colorHex: '#35d07f',
    iconKey: 'tag',
    sortOrder: '',
    separateFromTotals: false
  });
  const [categoryEditDrafts, setCategoryEditDrafts] = useState<Record<string, CategoryEditDraft>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const groups = [...state.categoryGroups].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label));
  const activeGroups = groups.filter((group) => !group.deletedAt);
  const visibleGroups = showDeleted ? groups : activeGroups;
  const selectedGroup = visibleGroups.find((group) => group.id === selectedGroupId) ?? activeGroups[0] ?? groups[0];
  const selectedGroupLabel = selectedGroup?.label ?? categoryDraft.group;
  const editingGroup = editingGroupId ? state.categoryGroups.find((group) => group.id === editingGroupId) : undefined;
  const editingCategory = editingCategoryId ? state.categories.find((category) => category.id === editingCategoryId) : undefined;
  const visibleCategories = [...state.categories]
    .filter((category) => showDeleted || !category.deletedAt)
    .filter((category) => !selectedGroup || category.group === selectedGroup.label)
    .sort((left, right) => left.group.localeCompare(right.group) || (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label));

  useEffect(() => {
    if (!selectedGroup) return;
    setSelectedGroupId(selectedGroup.id);
    setCategoryDraft((current) => current.group === selectedGroup.label ? current : { ...current, group: selectedGroup.label });
  }, [selectedGroup?.id, selectedGroup?.label]);

  const addGroup = () => {
    const label = groupDraft.label.trim();
    if (!label) {
      onNotify({ tone: 'error', text: 'Group needs a label.' });
      return;
    }
    if (state.categoryGroups.some((group) => sameText(group.label, label))) {
      onNotify({ tone: 'error', text: 'Group labels must be unique.' });
      return;
    }

    const nextGroupId = createId('group');
    const code = normalizeCode(groupDraft.code || label);
    if (state.categoryGroups.some((group) => sameText(group.code ?? group.id, code))) {
      onNotify({ tone: 'error', text: 'Group codes must be unique.' });
      return;
    }
    onStateChange((current) => ({
      ...current,
      categoryGroups: [
        ...current.categoryGroups,
        {
          id: nextGroupId,
          code,
          label,
          colorHex: groupDraft.colorHex,
          iconKey: groupDraft.iconKey.trim() || 'tag',
          sortOrder: Number(groupDraft.sortOrder) || current.categoryGroups.length + 1
        }
      ]
    }));
    setSelectedGroupId(nextGroupId);
    setGroupDraft({ code: '', label: '', colorHex: '#35d07f', iconKey: 'tag', sortOrder: '' });
    setCategoryDraft((current) => ({ ...current, group: label }));
  };

  const updateGroup = (id: string, patch: Partial<CategoryGroupConfig>) => {
    onStateChange((current) => {
      const previousGroup = current.categoryGroups.find((group) => group.id === id);
      const nextLabel = patch.label?.trim();
      return {
        ...current,
        categoryGroups: current.categoryGroups.map((group) => group.id === id ? { ...group, ...patch, label: nextLabel || group.label } : group),
        categories: previousGroup && nextLabel && nextLabel !== previousGroup.label
          ? current.categories.map((category) => category.group === previousGroup.label ? { ...category, group: nextLabel } : category)
          : current.categories
      };
    });
  };

  const openGroupEdit = (group: CategoryGroupConfig) => {
    setGroupEditDrafts((current) => ({ ...current, [group.id]: current[group.id] ?? groupEditDraftFromConfig(group) }));
    setEditingGroupId(group.id);
  };

  const updateGroupEditDraft = (group: CategoryGroupConfig, patch: Partial<GroupEditDraft>) => {
    setGroupEditDrafts((current) => ({
      ...current,
      [group.id]: {
        ...(current[group.id] ?? groupEditDraftFromConfig(group)),
        ...patch
      }
    }));
  };

  const saveGroupEdit = (group: CategoryGroupConfig) => {
    const draft = groupEditDrafts[group.id] ?? groupEditDraftFromConfig(group);
    const label = draft.label.trim();
    const code = normalizeCode(draft.code || label);
    if (!label) {
      onNotify({ tone: 'error', text: 'Group needs a label.' });
      return;
    }
    if (!code) {
      onNotify({ tone: 'error', text: 'Group needs a code.' });
      return;
    }
    if (state.categoryGroups.some((item) => item.id !== group.id && sameText(item.label, label))) {
      onNotify({ tone: 'error', text: 'Group labels must be unique.' });
      return;
    }
    if (state.categoryGroups.some((item) => item.id !== group.id && sameText(item.code ?? item.id, code))) {
      onNotify({ tone: 'error', text: 'Group codes must be unique.' });
      return;
    }

    updateGroup(group.id, {
      code,
      label,
      colorHex: draft.colorHex || '#35d07f',
      iconKey: draft.iconKey.trim() || 'tag',
      sortOrder: Number(draft.sortOrder) || 0
    });
    setGroupEditDrafts((current) => {
      const { [group.id]: _removed, ...remaining } = current;
      return remaining;
    });
    setEditingGroupId(null);
    setCategoryDraft((current) => current.group === group.label ? { ...current, group: label } : current);
  };

  const saveGroupQuickEdit = (group: CategoryGroupConfig) => {
    const draft = groupEditDrafts[group.id] ?? groupEditDraftFromConfig(group);
    const label = draft.label.trim();
    if (!label) {
      onNotify({ tone: 'error', text: 'Group needs a label.' });
      return;
    }
    if (state.categoryGroups.some((item) => item.id !== group.id && sameText(item.label, label))) {
      onNotify({ tone: 'error', text: 'Group labels must be unique.' });
      return;
    }

    updateGroup(group.id, {
      label,
      colorHex: draft.colorHex || '#35d07f',
      iconKey: draft.iconKey.trim() || 'tag',
      sortOrder: Number(draft.sortOrder) || 0
    });
    setGroupEditDrafts((current) => {
      const { [group.id]: _removed, ...remaining } = current;
      return remaining;
    });
    setCategoryDraft((current) => current.group === group.label ? { ...current, group: label } : current);
  };

  const setGroupDeleted = (id: string, deleted: boolean) => {
    const deletedAt = deleted ? new Date().toISOString() : null;
    onStateChange((current) => {
      const target = current.categoryGroups.find((group) => group.id === id);
      return {
        ...current,
        categoryGroups: current.categoryGroups.map((group) => group.id === id ? { ...group, deletedAt } : group),
        categories: target
          ? current.categories.map((category) => category.group === target.label ? { ...category, deletedAt } : category)
          : current.categories
      };
    });
  };

  const addCategory = () => {
    if (!selectedGroup) {
      onNotify({ tone: 'error', text: 'Select or create a group before adding categories.' });
      return;
    }
    const label = categoryDraft.label.trim();
    const code = normalizeCode(categoryDraft.code || `${selectedGroupLabel}_${label}`);
    if (!label || !code) {
      onNotify({ tone: 'error', text: 'Category needs a code and label.' });
      return;
    }
    if (state.categories.some((category) => sameText(category.code ?? category.id, code))) {
      onNotify({ tone: 'error', text: 'Category codes must be unique.' });
      return;
    }

    onStateChange((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: createId('category'),
          code,
          label,
          group: selectedGroupLabel,
          colorHex: categoryDraft.colorHex,
          iconKey: categoryDraft.iconKey.trim() || 'tag',
          sortOrder: Number(categoryDraft.sortOrder) || current.categories.length + 1,
          separateFromTotals: categoryDraft.separateFromTotals
        }
      ]
    }));
    setCategoryDraft((current) => ({ ...current, code: '', label: '', sortOrder: '', separateFromTotals: false }));
  };

  const updateCategory = (id: string, patch: Partial<CategoryConfig>) => {
    onStateChange((current) => ({
      ...current,
      categories: current.categories.map((category) => category.id === id ? { ...category, ...patch } : category)
    }));
  };

  const openCategoryEdit = (category: CategoryConfig) => {
    setCategoryEditDrafts((current) => ({ ...current, [category.id]: current[category.id] ?? categoryEditDraftFromConfig(category) }));
    setEditingCategoryId(category.id);
  };

  const updateCategoryEditDraft = (category: CategoryConfig, patch: Partial<CategoryEditDraft>) => {
    setCategoryEditDrafts((current) => ({
      ...current,
      [category.id]: {
        ...(current[category.id] ?? categoryEditDraftFromConfig(category)),
        ...patch
      }
    }));
  };

  const saveCategoryEdit = (category: CategoryConfig) => {
    const draft = categoryEditDrafts[category.id] ?? categoryEditDraftFromConfig(category);
    const label = draft.label.trim();
    const code = normalizeCode(draft.code || label);
    if (!label) {
      onNotify({ tone: 'error', text: 'Category needs a label.' });
      return;
    }
    if (!code) {
      onNotify({ tone: 'error', text: 'Category needs a code.' });
      return;
    }
    if (state.categories.some((item) => item.id !== category.id && sameText(item.code ?? item.id, code))) {
      onNotify({ tone: 'error', text: 'Category codes must be unique.' });
      return;
    }
    updateCategory(category.id, {
      code,
      label,
      group: draft.group,
      colorHex: draft.colorHex || '#35d07f',
      iconKey: draft.iconKey.trim() || 'tag',
      sortOrder: Number(draft.sortOrder) || 0,
      separateFromTotals: draft.separateFromTotals
    });
    setCategoryEditDrafts((current) => {
      const { [category.id]: _removed, ...remaining } = current;
      return remaining;
    });
    setEditingCategoryId(null);
  };

  const saveCategoryQuickEdit = (category: CategoryConfig) => {
    const draft = categoryEditDrafts[category.id] ?? categoryEditDraftFromConfig(category);
    updateCategory(category.id, {
      sortOrder: Number(draft.sortOrder) || 0,
      separateFromTotals: draft.separateFromTotals
    });
    setCategoryEditDrafts((current) => {
      const { [category.id]: _removed, ...remaining } = current;
      return remaining;
    });
  };

  const setCategoryDeleted = (id: string, deleted: boolean) => {
    onStateChange((current) => ({
      ...current,
      categories: current.categories.map((category) => (
        category.id === id
          ? { ...category, deletedAt: deleted ? new Date().toISOString() : null }
          : category
      ))
    }));
  };

  return (
    <>
    <section className="settings-workspace category-settings-grid">
      <article className="panel settings-side-panel">
        <div className="panel-heading">
          <div>
            <h2>Groups</h2>
            <p>{activeGroups.length} active groups.</p>
          </div>
          <Tags size={20} aria-hidden="true" />
        </div>
        <div className="form-grid">
          <label>Label<input value={groupDraft.label} onChange={(event) => setGroupDraft((current) => ({ ...current, label: event.target.value }))} /></label>
          <label>Color<input type="color" value={groupDraft.colorHex} onChange={(event) => setGroupDraft((current) => ({ ...current, colorHex: event.target.value }))} /></label>
          <IconPicker label="Icon" value={groupDraft.iconKey} onChange={(iconKey) => setGroupDraft((current) => ({ ...current, iconKey }))} />
          <label>Order<input inputMode="numeric" value={groupDraft.sortOrder} onChange={(event) => setGroupDraft((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
          <button className="primary-button" onClick={addGroup} type="button"><Plus size={16} /> Add group</button>
        </div>
        <label className="switch-row show-deleted-toggle">Show archived items<input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} /></label>
        <div className="catalog-list">
          {visibleGroups.map((group) => {
            const editDraft = groupEditDrafts[group.id] ?? groupEditDraftFromConfig(group);
            const organizerDirty = (
              editDraft.label !== group.label ||
              editDraft.colorHex !== (group.colorHex ?? '#35d07f') ||
              editDraft.iconKey !== (group.iconKey ?? '') ||
              editDraft.sortOrder !== String(group.sortOrder ?? '')
            );
            return (
              <article key={group.id} className={group.deletedAt ? 'group-order-card archived' : 'group-order-card'}>
                <label>Name<input value={editDraft.label} onChange={(event) => updateGroupEditDraft(group, { label: event.target.value })} /></label>
                <IconPicker label="Icon" value={editDraft.iconKey} onChange={(iconKey) => updateGroupEditDraft(group, { iconKey })} />
                <label>Color<input type="color" value={editDraft.colorHex} onChange={(event) => updateGroupEditDraft(group, { colorHex: event.target.value })} /></label>
                <label>Order<input inputMode="numeric" value={editDraft.sortOrder} onChange={(event) => updateGroupEditDraft(group, { sortOrder: event.target.value })} /></label>
                <div className="catalog-row-actions">
                  {organizerDirty ? <button className="primary-button compact-save-button" onClick={() => saveGroupQuickEdit(group)} type="button"><Save size={16} /> Save</button> : null}
                  <button className={group.deletedAt ? 'secondary-button' : 'icon-button danger-text'} onClick={() => setGroupDeleted(group.id, !group.deletedAt)} type="button">
                    {group.deletedAt ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Categories</h2>
            <p>{selectedGroup ? `${visibleCategories.length} visible categories in ${selectedGroup.label}.` : 'Create a group to manage categories.'}</p>
          </div>
          <ReceiptText size={20} aria-hidden="true" />
        </div>
        <div className="filter-grid compact category-entry-form">
          <label className="category-group-context">Group
            <select
              value={selectedGroup?.id ?? ''}
              onChange={(event) => {
                const nextGroup = groups.find((group) => group.id === event.target.value);
                setSelectedGroupId(event.target.value);
                if (nextGroup) {
                  setCategoryDraft((current) => ({ ...current, group: nextGroup.label }));
                }
              }}
            >
              {activeGroups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
              {selectedGroup && selectedGroup.deletedAt ? <option value={selectedGroup.id}>{selectedGroup.label}</option> : null}
            </select>
          </label>
          <label>Code<input value={categoryDraft.code} onChange={(event) => setCategoryDraft((current) => ({ ...current, code: event.target.value }))} placeholder="ex: GROCERIES" /></label>
          <label>Label<input value={categoryDraft.label} onChange={(event) => setCategoryDraft((current) => ({ ...current, label: event.target.value }))} /></label>
          <label>Color<input type="color" value={categoryDraft.colorHex} onChange={(event) => setCategoryDraft((current) => ({ ...current, colorHex: event.target.value }))} /></label>
          <IconPicker label="Icon" value={categoryDraft.iconKey} onChange={(iconKey) => setCategoryDraft((current) => ({ ...current, iconKey }))} />
          <label>Order<input inputMode="numeric" value={categoryDraft.sortOrder} onChange={(event) => setCategoryDraft((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
          <label className="switch-row">Separate totals<input type="checkbox" checked={categoryDraft.separateFromTotals} onChange={(event) => setCategoryDraft((current) => ({ ...current, separateFromTotals: event.target.checked }))} /></label>
          <button className="primary-button" onClick={addCategory} type="button"><Plus size={16} /> Add category</button>
        </div>

        {visibleCategories.length === 0 ? (
          <EmptyState title="No categories visible" body={selectedGroup ? `Add a category to ${selectedGroup.label} or enable archived items.` : 'Create a group before adding categories.'} />
        ) : (
          <div className="catalog-list">
            {visibleCategories.map((category) => {
              const editDraft = categoryEditDrafts[category.id] ?? categoryEditDraftFromConfig(category);
              const quickDirty = (
                editDraft.sortOrder !== String(category.sortOrder ?? '') ||
                editDraft.separateFromTotals !== Boolean(category.separateFromTotals)
              );
              const Icon = catalogIconForKey(category.iconKey).Icon;
              return (
                <article key={category.id} className={category.deletedAt ? 'catalog-row category-row archived' : 'catalog-row category-row'}>
                  <span className="code-pill">{category.code ?? category.id}</span>
                  <div className="catalog-main">
                    <strong>{category.label}</strong>
                    <span>{category.group}</span>
                  </div>
                  <span className="catalog-icon-preview" title={category.iconKey ?? 'tag'}>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <label className="quick-order-field">Order<input inputMode="numeric" value={editDraft.sortOrder} onChange={(event) => updateCategoryEditDraft(category, { sortOrder: event.target.value })} /></label>
                  <label className="switch-row compact-switch">Separate<input type="checkbox" checked={editDraft.separateFromTotals} onChange={(event) => updateCategoryEditDraft(category, { separateFromTotals: event.target.checked })} /></label>
                  <div className="catalog-row-actions">
                    <button className="icon-button" aria-label={`Edit ${category.label}`} onClick={() => openCategoryEdit(category)} type="button"><Pencil size={16} /></button>
                    {quickDirty ? <button className="primary-button compact-save-button" onClick={() => saveCategoryQuickEdit(category)} type="button"><Save size={16} /> Save</button> : null}
                    <button className={category.deletedAt ? 'secondary-button' : 'icon-button danger-text'} onClick={() => setCategoryDeleted(category.id, !category.deletedAt)} type="button">
                      {category.deletedAt ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </article>
    </section>

    {editingGroup ? (
      <GroupEditDialog
        group={editingGroup}
        draft={groupEditDrafts[editingGroup.id] ?? groupEditDraftFromConfig(editingGroup)}
        onDraftChange={(patch) => updateGroupEditDraft(editingGroup, patch)}
        onCancel={() => setEditingGroupId(null)}
        onSave={() => saveGroupEdit(editingGroup)}
      />
    ) : null}

    {editingCategory ? (
      <CategoryEditDialog
        category={editingCategory}
        draft={categoryEditDrafts[editingCategory.id] ?? categoryEditDraftFromConfig(editingCategory)}
        groups={activeGroups}
        onDraftChange={(patch) => updateCategoryEditDraft(editingCategory, patch)}
        onCancel={() => setEditingCategoryId(null)}
        onSave={() => saveCategoryEdit(editingCategory)}
      />
    ) : null}
    </>
  );
}

function IconPicker({ label, value, onChange }: { label: string; value: string; onChange: (iconKey: string) => void }) {
  const knownIcon = catalogIconOptions.find((option) => option.key === value);
  const selectedIcon = knownIcon ?? catalogIconForKey(value);
  const SelectedIcon = selectedIcon.Icon;
  return (
    <label className="icon-picker-field">{label}
      <div className="icon-picker-control">
        <select value={value || selectedIcon.key} onChange={(event) => onChange(event.target.value)}>
          {!knownIcon && value ? <option value={value}>{value}</option> : null}
          {catalogIconOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
        <span className="icon-picker-preview" title={selectedIcon.label}>
          <SelectedIcon size={18} aria-hidden="true" />
        </span>
      </div>
    </label>
  );
}

function GroupEditDialog({
  group,
  draft,
  onDraftChange,
  onCancel,
  onSave
}: {
  group: CategoryGroupConfig;
  draft: GroupEditDraft;
  onDraftChange: (patch: Partial<GroupEditDraft>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <ModalShell title={`Edit ${group.label}`} onClose={onCancel}>
      <div className="modal-form-grid">
        <label>Code<input value={draft.code} onChange={(event) => onDraftChange({ code: event.target.value })} /></label>
        <label>Label<input value={draft.label} onChange={(event) => onDraftChange({ label: event.target.value })} /></label>
        <label>Color<input type="color" value={draft.colorHex} onChange={(event) => onDraftChange({ colorHex: event.target.value })} /></label>
        <IconPicker label="Icon" value={draft.iconKey} onChange={(iconKey) => onDraftChange({ iconKey })} />
        <label>Order<input inputMode="numeric" value={draft.sortOrder} onChange={(event) => onDraftChange({ sortOrder: event.target.value })} /></label>
      </div>
      <div className="dialog-actions">
        <button className="ghost-button" onClick={onCancel} type="button">Cancel</button>
        <button className="primary-button" disabled={!isGroupEditDirty(draft, group)} onClick={onSave} type="button"><Save size={16} /> Save changes</button>
      </div>
    </ModalShell>
  );
}

function CategoryEditDialog({
  category,
  draft,
  groups,
  onDraftChange,
  onCancel,
  onSave
}: {
  category: CategoryConfig;
  draft: CategoryEditDraft;
  groups: CategoryGroupConfig[];
  onDraftChange: (patch: Partial<CategoryEditDraft>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <ModalShell title={`Edit ${category.label}`} onClose={onCancel}>
      <div className="modal-form-grid">
        <label>Code<input value={draft.code} onChange={(event) => onDraftChange({ code: event.target.value })} /></label>
        <label>Label<input value={draft.label} onChange={(event) => onDraftChange({ label: event.target.value })} /></label>
        <label>Group
          <select value={draft.group} onChange={(event) => onDraftChange({ group: event.target.value })}>
            {groups.map((group) => <option key={group.id} value={group.label}>{group.label}</option>)}
            {!groups.some((group) => group.label === draft.group) ? <option value={draft.group}>{draft.group}</option> : null}
          </select>
        </label>
        <label>Color<input type="color" value={draft.colorHex} onChange={(event) => onDraftChange({ colorHex: event.target.value })} /></label>
        <IconPicker label="Icon" value={draft.iconKey} onChange={(iconKey) => onDraftChange({ iconKey })} />
        <label>Order<input inputMode="numeric" value={draft.sortOrder} onChange={(event) => onDraftChange({ sortOrder: event.target.value })} /></label>
        <label className="switch-row modal-switch">Separate totals<input type="checkbox" checked={draft.separateFromTotals} onChange={(event) => onDraftChange({ separateFromTotals: event.target.checked })} /></label>
      </div>
      <div className="dialog-actions">
        <button className="ghost-button" onClick={onCancel} type="button">Cancel</button>
        <button className="primary-button" disabled={!isCategoryEditDirty(draft, category)} onClick={onSave} type="button"><Save size={16} /> Save changes</button>
      </div>
    </ModalShell>
  );
}

function QuickOptionsSection({
  state,
  onStateChange,
  onNotify
}: {
  state: FinanceState;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNotify: NotifyFn;
}) {
  const [currencyDraft, setCurrencyDraft] = useState(state.currencyCode);
  const [quickDayDraft, setQuickDayDraft] = useState('1');
  const [quickDayEditDrafts, setQuickDayEditDrafts] = useState<Record<number, string>>({});
  const currencyDirty = currencyDraft.trim().toUpperCase().slice(0, 3) !== state.currencyCode;

  useEffect(() => {
    setCurrencyDraft(state.currencyCode);
  }, [state.currencyCode]);

  const saveCurrencyCode = () => {
    const currencyCode = currencyDraft.trim().toUpperCase().slice(0, 3);
    if (currencyCode.length !== 3) {
      onNotify({ tone: 'error', text: 'Currency needs a 3-letter ISO code.' });
      return;
    }
    onStateChange((current) => ({ ...current, currencyCode }));
    setCurrencyDraft(currencyCode);
  };

  const addQuickDay = () => {
    const day = clampDay(Number(quickDayDraft) || 1);
    if (state.quickDueDateDays.includes(day)) {
      onNotify({ tone: 'warning', text: 'This quick due day already exists.' });
      return;
    }
    onStateChange((current) => ({
      ...current,
      quickDueDateDays: [...current.quickDueDateDays, day].sort((left, right) => left - right)
    }));
    setQuickDayDraft('1');
  };

  const updateQuickDayEditDraft = (previousDay: number, nextValue: string) => {
    setQuickDayEditDrafts((current) => ({ ...current, [previousDay]: nextValue }));
  };

  const saveQuickDay = (previousDay: number) => {
    const nextDay = clampDay(Number(quickDayEditDrafts[previousDay] ?? previousDay) || 1);
    if (nextDay !== previousDay && state.quickDueDateDays.includes(nextDay)) {
      onNotify({ tone: 'warning', text: 'This quick due day already exists.' });
      return;
    }
    onStateChange((current) => ({
      ...current,
      quickDueDateDays: current.quickDueDateDays.map((day) => day === previousDay ? nextDay : day).sort((left, right) => left - right)
    }));
    setQuickDayEditDrafts((current) => {
      const { [previousDay]: _removed, ...remaining } = current;
      return remaining;
    });
  };

  const removeQuickDay = (targetDay: number) => {
    onStateChange((current) => ({
      ...current,
      quickDueDateDays: current.quickDueDateDays.filter((day) => day !== targetDay)
    }));
  };

  return (
    <section className="settings-workspace quick-options-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Currency</h2>
            <p>Used for amounts across the application.</p>
          </div>
          <CircleDollarSign size={20} aria-hidden="true" />
        </div>
        <div className="filter-grid compact currency-grid">
          <label>Common currency
            <select value={currencyDraft} onChange={(event) => setCurrencyDraft(event.target.value)}>
              <option value="BRL">BRL - Brazilian real</option>
              <option value="USD">USD - US dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - Pound sterling</option>
              {!['BRL', 'USD', 'EUR', 'GBP'].includes(currencyDraft) ? <option value={currencyDraft}>{currencyDraft}</option> : null}
            </select>
          </label>
          <label>Custom ISO code
            <input maxLength={3} value={currencyDraft} onChange={(event) => setCurrencyDraft(event.target.value.toUpperCase().slice(0, 3))} />
          </label>
          {currencyDirty ? <button className="primary-button" onClick={saveCurrencyCode} type="button"><Save size={16} /> Save currency</button> : null}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h2>Quick due dates</h2>
            <p>Shown as shortcut chips when registering an expense.</p>
          </div>
          <SlidersHorizontal size={20} aria-hidden="true" />
        </div>
        <div className="inline-form-row quick-day-form">
          <input min="1" max="31" type="number" value={quickDayDraft} onChange={(event) => setQuickDayDraft(event.target.value)} />
          <button className="primary-button" onClick={addQuickDay} type="button"><Plus size={16} /> Add day</button>
        </div>
        <div className="quick-day-list">
          {state.quickDueDateDays.map((day) => {
            const editDraft = quickDayEditDrafts[day] ?? String(day);
            const isDirty = editDraft !== String(day);
            return (
              <article key={day} className="quick-day-row">
                <span>Day</span>
                <input min="1" max="31" type="number" value={editDraft} onChange={(event) => updateQuickDayEditDraft(day, event.target.value)} />
                {isDirty ? <button className="primary-button" onClick={() => saveQuickDay(day)} type="button"><Save size={16} /> Save</button> : null}
                <button className="icon-button danger-text" aria-label={`Remove day ${day}`} onClick={() => removeQuickDay(day)} type="button"><Trash2 size={16} /></button>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function DataManagementSection({
  state,
  selectedMonth,
  onStateChange,
  onNotify
}: {
  state: FinanceState;
  selectedMonth: string;
  onStateChange: (next: FinanceState | ((current: FinanceState) => FinanceState)) => void;
  onNotify: NotifyFn;
}) {
  const [confirmTarget, setConfirmTarget] = useState<null | 'all' | 'allExpenses' | 'monthExpenses' | 'financial' | 'catalog' | 'quickOptions'>(null);
  const activeExpenseCount = activeExpenses(state.expenses).length;
  const monthExpenseCount = expensesForMonth(state.expenses, selectedMonth).length;
  const archivedCategoryCount = state.categories.filter((category) => category.deletedAt).length;

  const runAction = () => {
    if (!confirmTarget) return;
    const now = new Date().toISOString();
    onStateChange((current) => {
      if (confirmTarget === 'all') {
        return initialFinanceState;
      }
      if (confirmTarget === 'allExpenses') {
        return { ...current, expenses: current.expenses.map((expense) => ({ ...expense, deletedAt: now })) };
      }
      if (confirmTarget === 'monthExpenses') {
        return {
          ...current,
          expenses: current.expenses.map((expense) => (expense.month || monthPrefixFromDate(expense.date)) === selectedMonth ? { ...expense, deletedAt: now } : expense)
        };
      }
      if (confirmTarget === 'financial') {
        return {
          ...current,
          wallets: [],
          incomes: [],
          monthlyIncomeEntries: {},
          recurringExpenses: [],
          financialCycleStartDay: initialFinanceState.financialCycleStartDay
        };
      }
      if (confirmTarget === 'catalog') {
        return {
          ...current,
          categoryGroups: defaultCategoryGroups,
          categories: defaultCategories
        };
      }
      return {
        ...current,
        quickDueDateDays: initialFinanceState.quickDueDateDays,
        currencyCode: initialFinanceState.currencyCode
      };
    });
    setConfirmTarget(null);
  };

  const actionLabels: Record<NonNullable<typeof confirmTarget>, string> = {
    all: 'reset all account data',
    allExpenses: 'delete all expenses',
    monthExpenses: `delete expenses from ${formatMonth(selectedMonth)}`,
    financial: 'reset financial configurations',
    catalog: 'reset category catalog',
    quickOptions: 'reset quick options'
  };

  return (
    <section className="settings-workspace data-management-grid">
      <section className="metric-grid data-metrics">
        <MetricCard label="Active expenses" value={String(activeExpenseCount)} />
        <MetricCard label={`${formatMonth(selectedMonth)} expenses`} value={String(monthExpenseCount)} />
        <MetricCard label="Categories" value={String(state.categories.length)} />
        <MetricCard label="Archived categories" value={String(archivedCategoryCount)} />
      </section>

      <article className="panel danger-zone-panel">
        <div className="panel-heading">
          <div>
            <h2>Data operations</h2>
            <p>These actions are destructive in the current app state and will later map to Supabase operations.</p>
          </div>
          <Database size={20} aria-hidden="true" />
        </div>
        <div className="data-action-grid">
          <button className="secondary-button" onClick={() => setConfirmTarget('monthExpenses')} type="button">Delete current month expenses</button>
          <button className="secondary-button" onClick={() => setConfirmTarget('allExpenses')} type="button">Delete all expenses</button>
          <button className="secondary-button" onClick={() => setConfirmTarget('financial')} type="button">Reset financial configurations</button>
          <button className="secondary-button" onClick={() => setConfirmTarget('catalog')} type="button">Reset category catalog</button>
          <button className="secondary-button" onClick={() => setConfirmTarget('quickOptions')} type="button">Reset quick options</button>
          <button className="primary-button danger" onClick={() => setConfirmTarget('all')} type="button">Reset all data</button>
        </div>
      </article>

      {confirmTarget ? (
        <ConfirmDialog
          title="Confirm data operation"
          body={`Do you want to ${actionLabels[confirmTarget]}? This cannot be undone in the current draft state.`}
          confirmLabel="Confirm"
          danger
          onCancel={() => setConfirmTarget(null)}
          onConfirm={runAction}
        />
      ) : null}
    </section>
  );
}

function normalizeCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function AccountSettingsView({
  email,
  state,
  onRequestLogout
}: {
  email: string;
  state: FinanceState;
  onRequestLogout: () => void;
}) {
  const activeExpenseCount = activeExpenses(state.expenses).length;
  const activeCategoryCount = state.categories.filter((category) => !category.deletedAt).length;

  return (
    <main className="screen">
      <ScreenHeader eyebrow="Account" title="Account settings" description="Authenticated profile and app access details." />
      <section className="account-settings-grid">
        <article className="panel">
          <div className="panel-heading"><h2>Profile</h2><UserCircle size={20} /></div>
          <dl className="summary-list">
            <div><dt>Email</dt><dd>{email}</dd></div>
            <div><dt>Access</dt><dd>Authenticated</dd></div>
            <div><dt>Auth provider</dt><dd>Supabase Auth</dd></div>
          </dl>
          <button className="secondary-button danger-text" onClick={onRequestLogout} type="button"><LogOut size={16} /> Log out</button>
        </article>

        <article className="panel">
          <div className="panel-heading"><h2>Application profile</h2><Mail size={20} /></div>
          <dl className="summary-list">
            <div><dt>Currency</dt><dd>{state.currencyCode}</dd></div>
            <div><dt>Active expenses</dt><dd>{activeExpenseCount}</dd></div>
            <div><dt>Active categories</dt><dd>{activeCategoryCount}</dd></div>
            <div><dt>Quick due days</dt><dd>{state.quickDueDateDays.join(', ') || 'None'}</dd></div>
          </dl>
        </article>
      </section>
    </main>
  );
}

function ConfigList({ items, onRemove }: { items: Array<{ id: string; title: string; detail: string }>; onRemove: (id: string) => void }) {
  if (items.length === 0) return <p className="muted">No items configured yet.</p>;
  return (
    <div className="config-list">
      {items.map((item) => (
        <div key={item.id} className="config-row">
          <div>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </div>
          <button className="icon-button danger-text" aria-label={`Remove ${item.title}`} onClick={() => onRemove(item.id)} type="button">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function MoveExpenseDialog({
  expense,
  currentMonth,
  onCancel,
  onMove
}: {
  expense?: Expense;
  currentMonth: string;
  onCancel: () => void;
  onMove: (expense: Expense, targetMonth: string) => void;
}) {
  const options = monthOptions().filter((month) => month !== currentMonth);
  const [targetMonth, setTargetMonth] = useState(options[0] ?? currentMonth);
  if (!expense) return null;
  return (
    <ModalShell title="Move expense" onClose={onCancel}>
      <p>Move "{expense.title}" to another month.</p>
      <label>Target month
        <select value={targetMonth} onChange={(event) => setTargetMonth(event.target.value)}>
          {options.map((month) => <option key={month} value={month}>{formatMonth(month)}</option>)}
        </select>
      </label>
      <div className="dialog-actions">
        <button className="ghost-button" onClick={onCancel} type="button">Cancel</button>
        <button className="primary-button" onClick={() => onMove(expense, targetMonth)} type="button">Move</button>
      </div>
    </ModalShell>
  );
}

function CopyDueDateDialog({
  expense,
  onCancel,
  onCopy
}: {
  expense?: Expense;
  onCancel: () => void;
  onCopy: (expense: Expense, mode: 'MAINTAIN' | 'ADD_TIME' | 'REMOVE') => void;
}) {
  if (!expense) return null;
  return (
    <ModalShell title="Copy expense" onClose={onCancel}>
      <p>Choose how the due date should behave when copying "{expense.title}" to the next month.</p>
      <div className="stacked-actions">
        <button onClick={() => onCopy(expense, 'MAINTAIN')} type="button">Maintain the same due date</button>
        <button onClick={() => onCopy(expense, 'ADD_TIME')} type="button">Add one month to due date</button>
        <button onClick={() => onCopy(expense, 'REMOVE')} type="button">Remove due date from the copy</button>
      </div>
    </ModalShell>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title={title} onClose={onCancel}>
      <p>{body}</p>
      <div className="dialog-actions">
        <button className="ghost-button" onClick={onCancel} type="button">Cancel</button>
        <button className={danger ? 'primary-button danger' : 'primary-button'} onClick={onConfirm} type="button">{confirmLabel}</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" aria-label="Close dialog" onClick={onClose} type="button"><X size={18} /></button>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <section className="toast-stack" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <article key={toast.id} className={`toast-item ${toast.tone}`}>
          <div>
            <strong>{toastTitle(toast.tone)}</strong>
            <p>{toast.text}</p>
          </div>
          <button className="toast-close" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)} type="button">
            <X size={16} aria-hidden="true" />
          </button>
        </article>
      ))}
    </section>
  );
}

function toastTitle(tone: ToastTone): string {
  if (tone === 'success') return 'Success';
  if (tone === 'error') return 'Error';
  if (tone === 'warning') return 'Warning';
  return 'Info';
}

function ScreenHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="screen-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="screen-action">{action}</div> : null}
    </header>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <article className={tone ? `metric-card ${tone}` : 'metric-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="empty-state">
      <CheckCircle2 size={26} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && onAction ? <button className="secondary-button" onClick={onAction} type="button">{actionLabel}</button> : null}
    </div>
  );
}
