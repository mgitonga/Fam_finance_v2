'use client';

import { formatKES } from '@/lib/utils';
import { Target } from 'lucide-react';

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  color: string | null;
};

interface SavingsGoalsWidgetProps {
  goals: Goal[];
}

export function SavingsGoalsWidget({ goals }: SavingsGoalsWidgetProps) {
  return (
    <div
      className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
      data-testid="savings-widget"
    >
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">Savings Goals</h3>
      </div>
      <div className="divide-y">
        {goals.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No active savings goals</p>
        ) : (
          goals.map((goal) => {
            const pct =
              Number(goal.target_amount) > 0
                ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)
                : 0;
            return (
              <div key={goal.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <Target className="text-primary h-3.5 w-3.5" />
                    <span className="font-medium">{goal.name}</span>
                  </span>
                  <span className="text-gray-500">{pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>{formatKES(Number(goal.current_amount))}</span>
                  <span>{formatKES(Number(goal.target_amount))}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
