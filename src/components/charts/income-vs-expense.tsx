'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatKES } from '@/lib/utils';

interface IncomeVsExpenseChartProps {
  income: number;
  expense: number;
}

const COLORS = ['#22c55e', '#ef4444'];

export function IncomeVsExpenseChart({ income, expense }: IncomeVsExpenseChartProps) {
  const data = [
    { name: 'Income', value: income },
    { name: 'Expenses', value: expense },
  ];

  const total = income + expense;

  return (
    <div
      className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
      data-testid="income-expense-chart"
    >
      <h3 className="mb-3 font-semibold">Income vs Expenses</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              startAngle={90}
              endAngle={-270}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index]}
                  stroke={COLORS[index]}
                  style={{
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
                    transform: 'translateZ(10px)',
                  }}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatKES(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {total > 0 && (
        <div className="mt-2 flex justify-center gap-6 text-sm">
          <span className="text-green-600">
            Income: {formatKES(income)} ({Math.round((income / total) * 100)}%)
          </span>
          <span className="text-red-600">
            Expenses: {formatKES(expense)} ({Math.round((expense / total) * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
}
