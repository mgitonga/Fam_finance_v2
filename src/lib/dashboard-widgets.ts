export const DASHBOARD_WIDGETS = [
  {
    id: 'metric-cards',
    label: 'Metric Cards',
    description: 'Income, expenses, net savings, budget remaining',
    icon: 'LayoutGrid',
    defaultOrder: 0,
    defaultEnabled: true,
    fullWidth: true,
  },
  {
    id: 'budget-progress',
    label: 'Budget Progress',
    description: 'Monthly spending vs budget by category',
    icon: 'BarChart3',
    defaultOrder: 1,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'income-vs-expense',
    label: 'Income vs Expense',
    description: 'Income and expense comparison chart',
    icon: 'TrendingUp',
    defaultOrder: 2,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'recent-transactions',
    label: 'Recent Transactions',
    description: 'Last 5 transactions',
    icon: 'Receipt',
    defaultOrder: 3,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'upcoming-bills',
    label: 'Upcoming Bills',
    description: 'Bills due soon with days remaining',
    icon: 'CalendarClock',
    defaultOrder: 4,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'savings-goals',
    label: 'Savings Goals',
    description: 'Progress toward savings targets',
    icon: 'PiggyBank',
    defaultOrder: 5,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'account-balances',
    label: 'Account Balances',
    description: 'All account balances at a glance',
    icon: 'Wallet',
    defaultOrder: 6,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'overall-budget',
    label: 'Overall Budget',
    description: 'Total spending vs overall budget cap',
    icon: 'Target',
    defaultOrder: 7,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'budget-vs-actual',
    label: 'Budget vs Actual',
    description: 'Budget vs actual spending chart',
    icon: 'BarChartBig',
    defaultOrder: 8,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'debt-overview',
    label: 'Debt Overview',
    description: 'Track your debts and repayment progress',
    icon: 'CreditCard',
    defaultOrder: 9,
    defaultEnabled: true,
    fullWidth: false,
  },
] as const;

export type WidgetId = (typeof DASHBOARD_WIDGETS)[number]['id'];

export type WidgetDefinition = (typeof DASHBOARD_WIDGETS)[number];

export function getDefaultPreferences() {
  return DASHBOARD_WIDGETS.map((w) => ({
    id: w.id,
    order: w.defaultOrder,
    enabled: w.defaultEnabled,
  }));
}

export function getWidgetDefinition(id: WidgetId): WidgetDefinition | undefined {
  return DASHBOARD_WIDGETS.find((w) => w.id === id);
}
