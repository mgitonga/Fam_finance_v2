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
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={100} />
            <Tooltip formatter={(value) => formatKES(Number(value))} />
            <Legend />
            <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[0, 4, 4, 0]} />
            <Bar dataKey="spent" name="Spent" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
