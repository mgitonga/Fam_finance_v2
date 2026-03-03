'use client';

import { formatKES, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Plus } from 'lucide-react';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string | null;
  merchant: string | null;
  categories: { name: string; color: string | null } | null;
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div
      className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
      data-testid="recent-transactions-widget"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Recent Transactions</h3>
        <Link
          href="/transactions"
          className="text-primary flex items-center gap-1 text-xs hover:underline"
        >
          <Plus className="h-3 w-3" /> Add
        </Link>
      </div>
      <div className="divide-y">
        {transactions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No transactions yet</p>
        ) : (
          transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                {txn.categories?.color && (
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: txn.categories.color }}
                  />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {txn.description || txn.merchant || txn.categories?.name || '—'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(txn.date)}</p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
              >
                {txn.type === 'income' ? '+' : '-'}
                {formatKES(txn.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
