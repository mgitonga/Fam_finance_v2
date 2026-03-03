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

type MonthData = { month: string; income: number; expense: number };

interface IncomeVsExpenseTrendProps {
  data: MonthData[];
}

export function IncomeVsExpenseTrend({ data }: IncomeVsExpenseTrendProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No data available</p>;
  }

  return (
    <div className="h-80" data-testid="income-expense-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatKES(Number(value))} />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
