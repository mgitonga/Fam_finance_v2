'use client';

import { formatKES } from '@/lib/utils';
import { TrendingUp, TrendingDown, Building2, Wallet, CreditCard } from 'lucide-react';

interface NetWorthWidgetProps {
  totalAssets: number;
  totalAccounts: number;
  totalDebts: number;
}

export function NetWorthWidget({ totalAssets, totalAccounts, totalDebts }: NetWorthWidgetProps) {
  const netWorth = totalAssets + totalAccounts - totalDebts;
  const isPositive = netWorth >= 0;

  return (
    <div
      className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
      data-testid="net-worth-widget"
    >
      <h3 className="mb-3 font-semibold">Net Worth</h3>
      <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {formatKES(netWorth)}
      </p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <Building2 className="h-3 w-3" /> Assets
          </span>
          <span className="font-medium text-green-600">{formatKES(totalAssets)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <Wallet className="h-3 w-3" /> Accounts
          </span>
          <span className="font-medium text-blue-600">{formatKES(totalAccounts)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <CreditCard className="h-3 w-3" /> Debts
          </span>
          <span className="font-medium text-red-600">-{formatKES(totalDebts)}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t pt-2 dark:border-gray-800">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? 'Positive' : 'Negative'} net worth
        </span>
      </div>
    </div>
  );
}
