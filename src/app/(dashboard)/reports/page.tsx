'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatKES } from '@/lib/utils';
import { CategoryBreakdownChart } from '@/components/charts/category-breakdown';
import { IncomeVsExpenseTrend } from '@/components/charts/income-expense-trend';
import { NetWorthChart } from '@/components/charts/net-worth-chart';
import { SpendingTrendsChart } from '@/components/charts/spending-trends';
import { BudgetVsActualReport } from '@/components/charts/budget-vs-actual-report';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
} from 'lucide-react';

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
const TABS = [
  { id: 'summary', label: 'Monthly Summary' },
  { id: 'category', label: 'Category Breakdown' },
  { id: 'trend', label: 'Income vs Expenses' },
  { id: 'networth', label: 'Net Worth' },
  { id: 'budgetactual', label: 'Budget vs Actual' },
  { id: 'spending', label: 'Spending Trends' },
];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState('summary');
  const [trendMonths, setTrendMonths] = useState(6);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['report-summary', month, year],
    queryFn: async () => {
      const r = await fetch(`/api/reports/monthly-summary?month=${month}&year=${year}`);
      return (await r.json()).data;
    },
  });

  const { data: categoryData, isLoading: catLoading } = useQuery({
    queryKey: ['report-category', month, year],
    queryFn: async () => {
      const r = await fetch(`/api/reports/category-breakdown?month=${month}&year=${year}`);
      return (await r.json()).data;
    },
    enabled: activeTab === 'category' || activeTab === 'summary',
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['report-trend', trendMonths],
    queryFn: async () => {
      const r = await fetch(`/api/reports/income-vs-expenses?months=${trendMonths}`);
      return (await r.json()).data;
    },
    enabled: activeTab === 'trend',
  });

  const { data: netWorthData, isLoading: nwLoading } = useQuery({
    queryKey: ['report-networth'],
    queryFn: async () => {
      const r = await fetch('/api/reports/net-worth?months=12');
      return (await r.json()).data;
    },
    enabled: activeTab === 'networth',
  });

  const { data: budgetActualData, isLoading: baLoading } = useQuery({
    queryKey: ['report-budgetactual', month, year],
    queryFn: async () => {
      const r = await fetch(`/api/reports/budget-vs-actual?month=${month}&year=${year}`);
      return (await r.json()).data;
    },
    enabled: activeTab === 'budgetactual',
  });

  const { data: spendingData, isLoading: spendLoading } = useQuery({
    queryKey: ['report-spending', trendMonths],
    queryFn: async () => {
      const r = await fetch(`/api/reports/spending-trends?months=${trendMonths}`);
      return (await r.json()).data;
    },
    enabled: activeTab === 'spending',
  });

  return (
    <div data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Financial insights and analysis</p>
        </div>
        <div className="flex items-center gap-2" data-testid="month-selector">
          <button
            onClick={prevMonth}
            className="rounded-md border p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center font-medium">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-md border p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {summary && (
        <div
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          data-testid="report-metrics"
        >
          <MetricCard
            icon={TrendingUp}
            label="Total Income"
            value={formatKES(summary.totalIncome)}
            change={summary.incomeChange}
            color="text-green-600"
          />
          <MetricCard
            icon={TrendingDown}
            label="Total Expenses"
            value={formatKES(summary.totalExpenses)}
            change={summary.expenseChange}
            color="text-red-600"
          />
          <MetricCard
            icon={Wallet}
            label="Net Savings"
            value={formatKES(summary.net)}
            color={summary.net >= 0 ? 'text-green-600' : 'text-red-600'}
          />
          <MetricCard
            icon={BarChart3}
            label="Previous Month Net"
            value={formatKES(summary.previousNet)}
            color={summary.previousNet >= 0 ? 'text-green-600' : 'text-red-600'}
          />
        </div>
      )}

      {/* Report Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trend months selector */}
      {(activeTab === 'trend' || activeTab === 'spending' || activeTab === 'networth') && (
        <div className="mt-4 flex gap-2">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setTrendMonths(m)}
              className={`rounded-md px-3 py-1 text-sm ${trendMonths === m ? 'bg-primary text-white' : 'border hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {m} months
            </button>
          ))}
        </div>
      )}

      {/* Report Content */}
      <div className="mt-6 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {activeTab === 'summary' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Monthly Summary — {MONTH_NAMES[month - 1]} {year}
            </h3>
            {summaryLoading ? (
              <Loading />
            ) : (
              summary && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <SummaryRow
                      label="Income"
                      current={summary.totalIncome}
                      previous={summary.previousIncome}
                    />
                    <SummaryRow
                      label="Expenses"
                      current={summary.totalExpenses}
                      previous={summary.previousExpenses}
                    />
                    <SummaryRow label="Net" current={summary.net} previous={summary.previousNet} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-500">Expense Distribution</h4>
                    {catLoading ? (
                      <Loading />
                    ) : (
                      <CategoryBreakdownChart data={categoryData || []} />
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'category' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Category Breakdown — {MONTH_NAMES[month - 1]} {year}
            </h3>
            {catLoading ? <Loading /> : <CategoryBreakdownChart data={categoryData || []} />}
            {categoryData && (
              <div className="mt-4 space-y-2">
                {categoryData.map(
                  (c: { category: string; color: string; amount: number; percentage: number }) => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.category}
                      </span>
                      <span className="font-medium">
                        {formatKES(c.amount)}{' '}
                        <span className="text-gray-400">({c.percentage}%)</span>
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trend' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Income vs Expenses — Last {trendMonths} Months
            </h3>
            {trendLoading ? <Loading /> : <IncomeVsExpenseTrend data={trendData || []} />}
          </div>
        )}

        {activeTab === 'networth' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">Net Worth Over Time</h3>
            {nwLoading ? <Loading /> : <NetWorthChart data={netWorthData || []} />}
          </div>
        )}

        {activeTab === 'budgetactual' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Budget vs Actual — {MONTH_NAMES[month - 1]} {year}
            </h3>
            {baLoading ? <Loading /> : <BudgetVsActualReport data={budgetActualData || []} />}
          </div>
        )}

        {activeTab === 'spending' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Spending Trends — Last {trendMonths} Months
            </h3>
            {spendLoading ? (
              <Loading />
            ) : (
              <SpendingTrendsChart
                data={spendingData?.chartData || []}
                categories={spendingData?.categories || []}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading...
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
      {change !== undefined && (
        <p className={`mt-1 text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
        </p>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous: number;
}) {
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
  return (
    <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3 dark:bg-gray-800">
      <span className="font-medium">{label}</span>
      <div className="text-right">
        <p className="font-bold">{formatKES(current)}</p>
        <p className="text-xs text-gray-500">
          Prev: {formatKES(previous)}{' '}
          {change !== 0 && (
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              ({change > 0 ? '+' : ''}
              {change}%)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
