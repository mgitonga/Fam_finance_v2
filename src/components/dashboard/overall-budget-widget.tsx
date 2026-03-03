'use client';

import { formatKES } from '@/lib/utils';
import { getBudgetStatus } from '@/lib/validations/budget';

interface OverallBudgetWidgetProps {
  spent: number;
  budget: number | null;
}

export function OverallBudgetWidget({ spent, budget }: OverallBudgetWidgetProps) {
  if (!budget) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        data-testid="overall-budget-widget"
      >
        <p className="text-sm text-gray-500">No overall budget set</p>
      </div>
    );
  }

  const { percentage, color } = getBudgetStatus(spent, budget);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const strokeColor = color === 'red' ? '#ef4444' : color === 'amber' ? '#f59e0b' : '#22c55e';

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      data-testid="overall-budget-widget"
    >
      <h3 className="mb-3 font-semibold">Overall Budget</h3>
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
            className="dark:stroke-gray-700"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
          <span className="text-xs text-gray-500">used</span>
        </div>
      </div>
      <div className="mt-3 text-center text-sm">
        <p>
          <span className="text-gray-500">Spent:</span>{' '}
          <span className="font-medium">{formatKES(spent)}</span>
        </p>
        <p>
          <span className="text-gray-500">Budget:</span>{' '}
          <span className="font-medium">{formatKES(budget)}</span>
        </p>
      </div>
    </div>
  );
}
