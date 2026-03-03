'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatKES } from '@/lib/utils';

interface IncomeVsExpenseChartProps {
  income: number;
  expense: number;
}

export function IncomeVsExpenseChart({ income, expense }: IncomeVsExpenseChartProps) {
  const data = [
    { name: 'Income', amount: income, fill: '#22c55e' },
    { name: 'Expenses', amount: expense, fill: '#ef4444' },
  ];

  return (
    <div
      className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
      data-testid="income-expense-chart"
    >
      <h3 className="mb-3 font-semibold">Income vs Expenses</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={60}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatKES(Number(value))} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
