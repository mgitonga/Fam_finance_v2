'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { UpcomingBills } from '@/components/dashboard/upcoming-bills';
import { SavingsGoalsWidget } from '@/components/dashboard/savings-widget';
import { AccountBalances } from '@/components/dashboard/account-balances';
import { OverallBudgetWidget } from '@/components/dashboard/overall-budget-widget';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { IncomeVsExpenseChart } from '@/components/charts/income-vs-expense';
import { BudgetVsActualChart } from '@/components/charts/budget-vs-actual';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading } = useDashboard(month, year);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }
  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center gap-2 py-12 text-gray-500"
        data-testid="dashboard-page"
      >
        <Loader2 className="h-6 w-6 animate-spin" /> Loading dashboard...
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    budgetRemaining: null,
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header with month selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your financial overview for {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2" data-testid="month-selector">
          <button
            onClick={prevMonth}
            className="rounded-md border p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center font-medium">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-md border p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Row 1: Metric Cards */}
      <MetricCards
        totalIncome={metrics.totalIncome}
        totalExpenses={metrics.totalExpenses}
        netSavings={metrics.netSavings}
        budgetRemaining={metrics.budgetRemaining}
      />

      {/* Row 2: Budget Progress + Income vs Expense chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        <IncomeVsExpenseChart income={metrics.totalIncome} expense={metrics.totalExpenses} />
      </div>

      {/* Row 3: Recent Transactions + Upcoming Bills */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentTransactions transactions={data?.recentTransactions || []} />
        <UpcomingBills bills={data?.upcomingBills || []} />
      </div>

      {/* Row 4: Savings Goals + Account Balances */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SavingsGoalsWidget goals={data?.savingsGoals || []} />
        <AccountBalances accounts={data?.accounts || []} />
      </div>

      {/* Row 5: Overall Budget + Budget vs Actual chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OverallBudgetWidget spent={metrics.totalExpenses} budget={metrics.overallBudget} />
        <BudgetVsActualChart data={data?.budgetVsActual || []} />
      </div>
    </div>
  );
}
