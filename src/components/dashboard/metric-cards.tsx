'use client';

import { formatKES } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

interface MetricCardsProps {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  budgetRemaining: number | null;
}

export function MetricCards({
  totalIncome,
  totalExpenses,
  netSavings,
  budgetRemaining,
}: MetricCardsProps) {
  const cards = [
    {
      label: 'Total Income',
      value: formatKES(totalIncome),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Total Expenses',
      value: formatKES(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
    },
    {
      label: 'Net Savings',
      value: formatKES(netSavings),
      icon: Wallet,
      color: netSavings >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'Budget Remaining',
      value: budgetRemaining !== null ? formatKES(budgetRemaining) : '—',
      icon: Target,
      color: budgetRemaining !== null && budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="metric-cards"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{card.label}</p>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </div>
          <p className={`mt-2 text-xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
