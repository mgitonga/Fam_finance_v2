'use client';

import { MetricCards } from '@/components/dashboard/metric-cards';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { UpcomingBills } from '@/components/dashboard/upcoming-bills';
import { SavingsGoalsWidget } from '@/components/dashboard/savings-widget';
import { AccountBalances } from '@/components/dashboard/account-balances';
import { OverallBudgetWidget } from '@/components/dashboard/overall-budget-widget';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { IncomeVsExpenseChart } from '@/components/charts/income-vs-expense';
import { BudgetVsActualChart } from '@/components/charts/budget-vs-actual';
import { DebtOverviewWidget } from '@/components/dashboard/debt-overview';
import { NetWorthWidget } from '@/components/widgets/net-worth-widget';
import { AssetOverviewWidget } from '@/components/widgets/asset-overview-widget';
import { DASHBOARD_WIDGETS, getDefaultPreferences } from '@/lib/dashboard-widgets';
import type { WidgetId } from '@/lib/dashboard-widgets';
import type { DashboardPreferences } from '@/lib/validations/dashboard';

interface WidgetRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    budgetRemaining: number | null;
    overallBudget?: number | null;
    totalDebt?: number;
    totalMonthlyDebt?: number;
    totalAssets?: number;
    totalAccounts?: number;
  };
  preferences: DashboardPreferences | null;
}

function mergePreferencesWithDefaults(
  preferences: DashboardPreferences | null,
): DashboardPreferences {
  if (!preferences) return getDefaultPreferences();

  // Add any new widgets that might not exist in saved preferences
  const knownIds = DASHBOARD_WIDGETS.map((w) => w.id);
  const savedIds = preferences.map((p) => p.id);
  const missingWidgets = knownIds
    .filter((id) => !savedIds.includes(id))
    .map((id) => {
      const def = DASHBOARD_WIDGETS.find((w) => w.id === id)!;
      return { id: def.id, order: preferences.length + def.defaultOrder, enabled: true };
    });

  // Filter out unknown IDs from saved preferences
  const validPrefs = preferences.filter((p) =>
    knownIds.includes(p.id as (typeof knownIds)[number]),
  );

  return [...validPrefs, ...missingWidgets].sort((a, b) => a.order - b.order);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderWidget(id: WidgetId, data: any, metrics: WidgetRendererProps['metrics']) {
  switch (id) {
    case 'metric-cards':
      return (
        <MetricCards
          totalIncome={metrics.totalIncome}
          totalExpenses={metrics.totalExpenses}
          netSavings={metrics.netSavings}
          budgetRemaining={metrics.budgetRemaining}
        />
      );

    case 'budget-progress':
      return (
        <div
          className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          data-testid="budget-progress-widget"
        >
          <h3 className="mb-3 font-semibold">Monthly Spending vs Budget</h3>
          {data?.budgetVsActual?.length > 0 ? (
            <div className="space-y-3">
              {data.budgetVsActual.map(
                (b: { category: string; color: string; budget: number; spent: number }) => (
                  <BudgetProgress
                    key={b.category}
                    categoryName={b.category}
                    categoryColor={b.color}
                    spent={b.spent}
                    budget={b.budget}
                  />
                ),
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">No budgets set for this month</p>
          )}
        </div>
      );

    case 'income-vs-expense':
      return <IncomeVsExpenseChart income={metrics.totalIncome} expense={metrics.totalExpenses} />;

    case 'recent-transactions':
      return <RecentTransactions transactions={data?.recentTransactions || []} />;

    case 'upcoming-bills':
      return <UpcomingBills bills={data?.upcomingBills || []} />;

    case 'savings-goals':
      return <SavingsGoalsWidget goals={data?.savingsGoals || []} />;

    case 'account-balances':
      return <AccountBalances accounts={data?.accounts || []} />;

    case 'overall-budget':
      return (
        <OverallBudgetWidget spent={metrics.totalExpenses} budget={metrics.overallBudget ?? null} />
      );

    case 'budget-vs-actual':
      return <BudgetVsActualChart data={data?.budgetVsActual || []} />;

    case 'debt-overview':
      return (
        <DebtOverviewWidget
          debts={data?.debts || []}
          totalDebt={metrics.totalDebt ?? 0}
          totalMonthlyDebt={metrics.totalMonthlyDebt ?? 0}
        />
      );

    case 'net-worth-summary':
      return (
        <NetWorthWidget
          totalAssets={metrics.totalAssets ?? 0}
          totalAccounts={metrics.totalAccounts ?? 0}
          totalDebts={metrics.totalDebt ?? 0}
        />
      );

    case 'asset-overview':
      return (
        <AssetOverviewWidget assets={data?.assets || []} totalValue={metrics.totalAssets ?? 0} />
      );

    default:
      return null;
  }
}

export function WidgetRenderer({ data, metrics, preferences }: WidgetRendererProps) {
  const resolvedPrefs = mergePreferencesWithDefaults(preferences);
  const enabledWidgets = resolvedPrefs.filter((p) => p.enabled);

  // Separate full-width and half-width widgets
  const widgetDefs = DASHBOARD_WIDGETS.reduce(
    (acc, w) => {
      acc[w.id] = w;
      return acc;
    },
    {} as Record<string, (typeof DASHBOARD_WIDGETS)[number]>,
  );

  // Build rows: full-width widgets get their own row, half-width pair up
  const rows: { widgets: typeof enabledWidgets }[] = [];
  let pendingHalf: (typeof enabledWidgets)[number] | null = null;

  for (const widget of enabledWidgets) {
    const def = widgetDefs[widget.id];
    if (def?.fullWidth) {
      // If there's a pending half-width, flush it as a solo row
      if (pendingHalf) {
        rows.push({ widgets: [pendingHalf] });
        pendingHalf = null;
      }
      rows.push({ widgets: [widget] });
    } else {
      if (pendingHalf) {
        rows.push({ widgets: [pendingHalf, widget] });
        pendingHalf = null;
      } else {
        pendingHalf = widget;
      }
    }
  }

  // Flush any remaining half-width widget as a solo row
  if (pendingHalf) {
    rows.push({ widgets: [pendingHalf] });
  }

  return (
    <>
      {rows.map((row, rowIndex) => {
        if (row.widgets.length === 1) {
          const w = row.widgets[0];
          const def = widgetDefs[w.id];
          if (def?.fullWidth) {
            return (
              <div key={`row-${rowIndex}`} data-testid={`widget-${w.id}`}>
                {renderWidget(w.id as WidgetId, data, metrics)}
              </div>
            );
          }
          // Single half-width widget renders full width
          return (
            <div
              key={`row-${rowIndex}`}
              className="grid grid-cols-1 gap-4"
              data-testid={`widget-${w.id}`}
            >
              {renderWidget(w.id as WidgetId, data, metrics)}
            </div>
          );
        }

        // Two half-width widgets in a row
        return (
          <div key={`row-${rowIndex}`} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {row.widgets.map((w) => (
              <div key={w.id} data-testid={`widget-${w.id}`}>
                {renderWidget(w.id as WidgetId, data, metrics)}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
