'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatKES } from '@/lib/utils';

type CategoryColor = { name: string; color: string };

interface SpendingTrendsChartProps {
  data: Record<string, string | number>[];
  categories: CategoryColor[];
}

const FALLBACK_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#6366f1',
];

export function SpendingTrendsChart({ data, categories }: SpendingTrendsChartProps) {
  if (data.length === 0 || categories.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No spending data available</p>;
  }

  return (
    <div className="h-80" data-testid="spending-trends-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatKES(Number(value))} />
          <Legend />
          {categories.map((cat, i) => (
            <Line
              key={cat.name}
              type="monotone"
              dataKey={cat.name}
              stroke={cat.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
