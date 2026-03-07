'use client';

import { formatKES } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';

type Debt = {
  id: string;
  name: string;
  outstanding_balance: number;
  original_amount: number;
  minimum_payment: number | null;
};

interface DebtOverviewWidgetProps {
  debts: Debt[];
  totalDebt: number;
  totalMonthlyDebt: number;
}

export function DebtOverviewWidget({
  debts,
  totalDebt,
  totalMonthlyDebt,
}: DebtOverviewWidgetProps) {
  return (
    <div
      className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
      data-testid="debt-overview-widget"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Debt Overview</h3>
        <Link href="/debts" className="text-primary text-xs hover:underline">
          View all
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-2 border-b px-4 py-3">
        <div>
          <p className="text-xs text-gray-500">Total Debt</p>
          <p className="text-lg font-bold text-red-600">{formatKES(totalDebt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Monthly Payments</p>
          <p className="text-lg font-bold">{formatKES(totalMonthlyDebt)}</p>
        </div>
      </div>

      {/* Debt list */}
      <div className="divide-y">
        {debts.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No active debts</p>
        ) : (
          debts.slice(0, 5).map((debt) => {
            const pct =
              Number(debt.original_amount) > 0
                ? Math.round(
                    ((Number(debt.original_amount) - Number(debt.outstanding_balance)) /
                      Number(debt.original_amount)) *
                      100,
                  )
                : 0;

            return (
              <div key={debt.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-medium">{debt.name}</span>
                  </span>
                  <span className="text-xs text-gray-500">{pct}% paid</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>{formatKES(Number(debt.outstanding_balance))} remaining</span>
                  <span>{formatKES(Number(debt.original_amount))} total</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
