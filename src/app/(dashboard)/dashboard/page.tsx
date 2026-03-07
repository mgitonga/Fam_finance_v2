'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';
import { WidgetRenderer } from '@/components/dashboard/widget-renderer';
import { CustomizeDialog } from '@/components/dashboard/customize-dialog';
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
  const { data: preferences } = useDashboardPreferences();

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
      {/* Header with month selector and customize button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your financial overview for {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2" data-testid="month-selector">
          <CustomizeDialog />
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

      {/* Dynamic widget layout */}
      <WidgetRenderer
        data={data}
        metrics={{ ...metrics, overallBudget: metrics.overallBudget ?? null }}
        preferences={preferences ?? null}
      />
    </div>
  );
}
