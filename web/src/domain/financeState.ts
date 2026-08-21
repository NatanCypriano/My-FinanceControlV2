export type View = 'home' | 'expenses' | 'visualize' | 'financialConfigurations' | 'settings' | 'accountSettings';
export type VisualizeSection = 'expenses' | 'payments';
export type FinancialSection = 'income' | 'recurring' | 'wallets';
export type SettingsSection = 'categories' | 'quickOptions' | 'dataManagement';

export type Expense = {
  id: string;
  title: string;
  amountCents: number;
  date: string;
  month: string;
  dueDate?: string;
  paid: boolean;
  walletId?: string;
  categoryId: string;
  createdAt: string;
  deletedAt?: string | null;
};

export type WalletConfig = {
  id: string;
  name: string;
  balanceCents: number;
};

export type IncomeConfig = {
  id: string;
  description: string;
  amountCents: number;
  day: number;
  businessOnly: boolean;
  walletId?: string;
};

export type MonthlyIncomeEntries = Record<string, IncomeConfig[]>;

export type RecurringExpenseConfig = {
  id: string;
  description: string;
  amountCents: number;
};

export type CategoryGroupConfig = {
  id: string;
  code?: string;
  label: string;
  colorHex?: string;
  iconKey?: string;
  sortOrder?: number;
  deletedAt?: string | null;
};

export type CategoryConfig = {
  id: string;
  code?: string;
  label: string;
  group: string;
  colorHex?: string;
  iconKey?: string;
  sortOrder?: number;
  separateFromTotals?: boolean;
  deletedAt?: string | null;
};

export type FinanceState = {
  expenses: Expense[];
  wallets: WalletConfig[];
  incomes: IncomeConfig[];
  monthlyIncomeEntries: MonthlyIncomeEntries;
  recurringExpenses: RecurringExpenseConfig[];
  categoryGroups: CategoryGroupConfig[];
  categories: CategoryConfig[];
  financialCycleStartDay: number;
  quickDueDateDays: number[];
  currencyCode: string;
};

export const defaultCategoryGroups: CategoryGroupConfig[] = [
  { id: '00000000-0000-4000-8000-000000000101', code: 'FOOD', label: 'Food', colorHex: '#2DD4BF', iconKey: 'utensils', sortOrder: 10 },
  { id: '00000000-0000-4000-8000-000000000102', code: 'HOME', label: 'Home', colorHex: '#60A5FA', iconKey: 'home', sortOrder: 20 },
  { id: '00000000-0000-4000-8000-000000000103', code: 'LIFESTYLE', label: 'Lifestyle', colorHex: '#F472B6', iconKey: 'shopping-bag', sortOrder: 30 },
  { id: '00000000-0000-4000-8000-000000000104', code: 'TRANSPORTATION', label: 'Transportation', colorHex: '#F59E0B', iconKey: 'car', sortOrder: 40 },
  { id: '00000000-0000-4000-8000-000000000105', code: 'HEALTH', label: 'Health', colorHex: '#34D399', iconKey: 'heart-pulse', sortOrder: 50 },
  { id: '00000000-0000-4000-8000-000000000106', code: 'EDUCATION', label: 'Education', colorHex: '#A78BFA', iconKey: 'graduation-cap', sortOrder: 60 },
  { id: '00000000-0000-4000-8000-000000000107', code: 'FINANCIAL', label: 'Financial', colorHex: '#F87171', iconKey: 'landmark', sortOrder: 70 },
  { id: '00000000-0000-4000-8000-000000000108', code: 'OTHER', label: 'Other', colorHex: '#94A3B8', iconKey: 'circle-ellipsis', sortOrder: 80 }
];

export const defaultCategories: CategoryConfig[] = [
  { id: '00000000-0000-4000-8000-000000001001', code: 'GROCERIES', label: 'Groceries', group: 'Food', colorHex: '#2DD4BF', iconKey: 'shopping-cart', sortOrder: 10 },
  { id: '00000000-0000-4000-8000-000000001002', code: 'DINING_OUT', label: 'Dining out', group: 'Food', colorHex: '#2DD4BF', iconKey: 'utensils', sortOrder: 20 },
  { id: '00000000-0000-4000-8000-000000001003', code: 'DELIVERY_TAKEOUT', label: 'Delivery / takeout', group: 'Food', colorHex: '#2DD4BF', iconKey: 'pizza', sortOrder: 30 },
  { id: '00000000-0000-4000-8000-000000001004', code: 'COFFEE_SNACKS', label: 'Coffee / snacks', group: 'Food', colorHex: '#2DD4BF', iconKey: 'coffee', sortOrder: 40 },
  { id: '00000000-0000-4000-8000-000000001005', code: 'RENT_MORTGAGE', label: 'Rent / mortgage', group: 'Home', colorHex: '#60A5FA', iconKey: 'home', sortOrder: 50 },
  { id: '00000000-0000-4000-8000-000000001006', code: 'UTILITIES', label: 'Utilities', group: 'Home', colorHex: '#60A5FA', iconKey: 'plug', sortOrder: 60 },
  { id: '00000000-0000-4000-8000-000000001007', code: 'INTERNET_PHONE', label: 'Internet / phone', group: 'Home', colorHex: '#60A5FA', iconKey: 'wifi', sortOrder: 70 },
  { id: '00000000-0000-4000-8000-000000001008', code: 'HOME_MAINTENANCE', label: 'Home maintenance', group: 'Home', colorHex: '#60A5FA', iconKey: 'hammer', sortOrder: 80 },
  { id: '00000000-0000-4000-8000-000000001009', code: 'LEISURE', label: 'Leisure', group: 'Lifestyle', colorHex: '#F472B6', iconKey: 'ticket', sortOrder: 90 },
  { id: '00000000-0000-4000-8000-000000001010', code: 'SUBSCRIPTIONS', label: 'Subscriptions', group: 'Lifestyle', colorHex: '#F472B6', iconKey: 'receipt-text', sortOrder: 100 },
  { id: '00000000-0000-4000-8000-000000001011', code: 'SHOPPING', label: 'Shopping', group: 'Lifestyle', colorHex: '#F472B6', iconKey: 'shopping-bag', sortOrder: 110 },
  { id: '00000000-0000-4000-8000-000000001012', code: 'PERSONAL_CARE', label: 'Personal care', group: 'Lifestyle', colorHex: '#F472B6', iconKey: 'sparkles', sortOrder: 120 },
  { id: '00000000-0000-4000-8000-000000001013', code: 'STREAMING', label: 'Streaming', group: 'Lifestyle', colorHex: '#F472B6', iconKey: 'tv', sortOrder: 130 },
  { id: '00000000-0000-4000-8000-000000001014', code: 'GAMING', label: 'Gaming', group: 'Lifestyle', colorHex: '#F472B6', iconKey: 'gamepad-2', sortOrder: 140 },
  { id: '00000000-0000-4000-8000-000000001015', code: 'SPORTS', label: 'Sports', group: 'Lifestyle', colorHex: '#F472B6', iconKey: 'dumbbell', sortOrder: 150 },
  { id: '00000000-0000-4000-8000-000000001016', code: 'FUEL', label: 'Fuel', group: 'Transportation', colorHex: '#F59E0B', iconKey: 'fuel', sortOrder: 160 },
  { id: '00000000-0000-4000-8000-000000001017', code: 'PUBLIC_TRANSPORT', label: 'Public transport', group: 'Transportation', colorHex: '#F59E0B', iconKey: 'bus', sortOrder: 170 },
  { id: '00000000-0000-4000-8000-000000001018', code: 'RIDE_APPS_TAXI', label: 'Ride apps / taxi', group: 'Transportation', colorHex: '#F59E0B', iconKey: 'car-taxi-front', sortOrder: 180 },
  { id: '00000000-0000-4000-8000-000000001019', code: 'VEHICLE_MAINTENANCE', label: 'Vehicle maintenance', group: 'Transportation', colorHex: '#F59E0B', iconKey: 'wrench', sortOrder: 190 },
  { id: '00000000-0000-4000-8000-000000001020', code: 'PHARMACY', label: 'Pharmacy', group: 'Health', colorHex: '#34D399', iconKey: 'pill', sortOrder: 200 },
  { id: '00000000-0000-4000-8000-000000001021', code: 'MEDICAL_APPOINTMENTS', label: 'Medical appointments', group: 'Health', colorHex: '#34D399', iconKey: 'stethoscope', sortOrder: 210 },
  { id: '00000000-0000-4000-8000-000000001022', code: 'HEALTH_INSURANCE', label: 'Health insurance', group: 'Health', colorHex: '#34D399', iconKey: 'shield-check', sortOrder: 220 },
  { id: '00000000-0000-4000-8000-000000001023', code: 'FITNESS', label: 'Fitness', group: 'Health', colorHex: '#34D399', iconKey: 'dumbbell', sortOrder: 230 },
  { id: '00000000-0000-4000-8000-000000001024', code: 'COURSES', label: 'Courses', group: 'Education', colorHex: '#A78BFA', iconKey: 'graduation-cap', sortOrder: 240 },
  { id: '00000000-0000-4000-8000-000000001025', code: 'BOOKS', label: 'Books', group: 'Education', colorHex: '#A78BFA', iconKey: 'book-open', sortOrder: 250 },
  { id: '00000000-0000-4000-8000-000000001026', code: 'TOOLS_SOFTWARE', label: 'Tools / software', group: 'Education', colorHex: '#A78BFA', iconKey: 'laptop', sortOrder: 260 },
  { id: '00000000-0000-4000-8000-000000001027', code: 'DEBT_PAYMENTS', label: 'Debt payments', group: 'Financial', colorHex: '#F87171', iconKey: 'credit-card', sortOrder: 270, separateFromTotals: true },
  { id: '00000000-0000-4000-8000-000000001028', code: 'BANK_FEES', label: 'Bank fees', group: 'Financial', colorHex: '#F87171', iconKey: 'landmark', sortOrder: 280 },
  { id: '00000000-0000-4000-8000-000000001029', code: 'TAXES', label: 'Taxes', group: 'Financial', colorHex: '#F87171', iconKey: 'receipt', sortOrder: 290 },
  { id: '00000000-0000-4000-8000-000000001030', code: 'GIFTS', label: 'Gifts', group: 'Other', colorHex: '#94A3B8', iconKey: 'gift', sortOrder: 300 },
  { id: '00000000-0000-4000-8000-000000001031', code: 'TRAVEL', label: 'Travel', group: 'Other', colorHex: '#94A3B8', iconKey: 'plane', sortOrder: 310 },
  { id: '00000000-0000-4000-8000-000000001032', code: 'MISCELLANEOUS', label: 'Miscellaneous', group: 'Other', colorHex: '#94A3B8', iconKey: 'tags', sortOrder: 320 },
  { id: '00000000-0000-4000-8000-000000001033', code: 'OTHER', label: 'Other', group: 'Other', colorHex: '#94A3B8', iconKey: 'circle-ellipsis', sortOrder: 330 }
];

export const initialFinanceState: FinanceState = {
  expenses: [],
  wallets: [],
  incomes: [],
  monthlyIncomeEntries: {},
  recurringExpenses: [],
  categoryGroups: defaultCategoryGroups,
  categories: defaultCategories,
  financialCycleStartDay: 1,
  quickDueDateDays: [5, 10, 15, 20],
  currencyCode: 'USD'
};
