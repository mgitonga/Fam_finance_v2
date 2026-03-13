'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { formatKES } from '@/lib/utils';

interface ValuationDataPoint {
  date: string;
  value: number;
}

interface AssetValuationChartProps {
  data: ValuationDataPoint[];
  purchasePrice: number;
}

export function AssetValuationChart({ data, purchasePrice }: AssetValuationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        No valuation history available
      </div>
    );
  }

  const currentValue = data[data.length - 1]?.value ?? purchasePrice;
  const isAppreciating = currentValue >= purchasePrice;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => {
              if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
              if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
              return val.toString();
            }}
          />
          <Tooltip
            formatter={(value) => [formatKES(Number(value)), 'Value']}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB')}
          />
          <ReferenceLine
            y={purchasePrice}
            stroke="#94a3b8"
            strokeDasharray="5 5"
            label={{ value: 'Purchase Price', position: 'insideTopRight', fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isAppreciating ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            dot={{ fill: isAppreciating ? '#22c55e' : '#ef4444', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
