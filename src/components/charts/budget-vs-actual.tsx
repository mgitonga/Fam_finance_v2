'use client';

import { formatKES } from '@/lib/utils';

type BudgetItem = {
  category: string;
  color: string;
  budget: number;
  spent: number;
  percentage: number;
};

interface BudgetVsActualChartProps {
  data: BudgetItem[];
}

function getStatusColor(percentage: number): string {
  if (percentage > 100) return '#ef4444'; // red — over budget
  if (percentage >= 75) return '#f59e0b'; // amber — approaching limit
  return '#22c55e'; // green — on track
}

function getStatusLabel(percentage: number): string {
  if (percentage > 100) return 'Over budget';
  if (percentage >= 75) return 'Approaching limit';
  return 'On track';
}

export function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        data-testid="budget-actual-chart"
      >
        <h3 className="mb-3 font-semibold">Budget vs Actual</h3>
        <p className="py-8 text-center text-sm text-gray-500">No budgets set for this month</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
      data-testid="budget-actual-chart"
    >
      <h3 className="mb-3 font-semibold">Budget vs Actual</h3>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-5 rounded-sm bg-gray-400" />
          Spent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-0.5 bg-gray-800 dark:bg-gray-200" />
          Budget Target
        </span>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const statusColor = getStatusColor(item.percentage);
          // Scale: bar range goes to max(budget, spent) * 1.2 so there's always room
          const maxValue = Math.max(item.budget, item.spent) * 1.2 || 1;
          const spentPct = Math.min((item.spent / maxValue) * 100, 100);
          const targetPct = Math.min((item.budget / maxValue) * 100, 100);

          return (
            <div key={item.category} className="group" data-testid="bullet-chart-row">
              {/* Header: category name + values */}
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  {item.color && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {item.category}
                </span>
                <span className="text-xs text-gray-500">
                  {formatKES(item.spent)} / {formatKES(item.budget)}
                </span>
              </div>

              {/* Bullet chart bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                {/* Spent bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${spentPct}%`,
                    backgroundColor: statusColor,
                    opacity: 0.85,
                  }}
                />

                {/* Budget target marker */}
                <div
                  className="absolute -top-1 h-[calc(100%+8px)] w-0.5 bg-gray-800 dark:bg-gray-200"
                  style={{ left: `${targetPct}%` }}
                />
              </div>

              {/* Footer: percentage + status */}
              <div className="mt-0.5 flex items-center justify-between text-xs">
                <span style={{ color: statusColor }} className="font-medium">
                  {item.percentage}% used
                </span>
                <span className="text-gray-400">{getStatusLabel(item.percentage)}</span>
              </div>

              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block dark:bg-gray-700">
                Spent {formatKES(item.spent)} of {formatKES(item.budget)} ({item.percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
