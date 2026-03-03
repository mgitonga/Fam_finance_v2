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

type BudgetActualItem = { category: string; color: string; budget: number; actual: number };

interface BudgetVsActualReportProps {
  data: BudgetActualItem[];
}

export function BudgetVsActualReport({ data }: BudgetVsActualReportProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No budget data for this month</p>;
  }

  return (
    <div className="h-80" data-testid="budget-actual-report-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" barSize={14} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={110} />
          <Tooltip formatter={(value) => formatKES(Number(value))} />
          <Legend />
          <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[0, 4, 4, 0]} />
          <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
