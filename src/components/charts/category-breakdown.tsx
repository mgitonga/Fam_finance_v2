'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatKES } from '@/lib/utils';

type CategoryData = { category: string; color: string; amount: number; percentage: number };

interface CategoryBreakdownChartProps {
  data: CategoryData[];
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">No expense data for this period</p>
    );
  }

  return (
    <div className="h-[450px]" data-testid="category-breakdown-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={140}
            paddingAngle={2}
            dataKey="amount"
            nameKey="category"
            label={({ name, percent, x, y }) => (
              <text
                x={x}
                y={y}
                fill="currentColor"
                textAnchor={x > 200 ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                className="fill-foreground"
              >
                {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              </text>
            )}
            labelLine={{ stroke: '#888', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.15))' }}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatKES(Number(value))} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: '16px' }}
            formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
