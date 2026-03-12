'use client';

import { useAccountSparkline } from '@/hooks/use-accounts';

export function BalanceSparkline({ accountId }: { accountId: string }) {
  const { data, isLoading } = useAccountSparkline(accountId);

  if (isLoading || !data || data.length === 0) {
    return <div className="h-full w-full rounded bg-gray-100 dark:bg-gray-800" />;
  }

  const values = data.map((d: { balance: number }) => d.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 200;
  const height = 48;
  const padding = 2;

  const points = values
    .map((v: number, i: number) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const trend = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={trend ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
