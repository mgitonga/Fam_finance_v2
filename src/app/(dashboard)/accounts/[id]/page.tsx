'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useAccountStatement } from '@/hooks/use-accounts';
import { ACCOUNT_TYPES } from '@/lib/constants';
import { formatKES, formatDate } from '@/lib/utils';
import { Loader2, ChevronLeft, Download } from 'lucide-react';

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();

  const now = new Date();
  const [startDate, setStartDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
  );
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

  const { data: account, isLoading: accountLoading } = useAccount(id);
  const { data: statement, isLoading: statementLoading } = useAccountStatement(
    id,
    startDate,
    endDate,
  );

  const typeLabel = (type: string) => ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;

  async function downloadCSV() {
    const response = await fetch(
      `/api/accounts/${id}/statement-export?start_date=${startDate}&end_date=${endDate}&format=csv`,
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${account?.name || 'account'}-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPDF() {
    const response = await fetch(
      `/api/accounts/${id}/statement-export?start_date=${startDate}&end_date=${endDate}&format=pdf`,
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${account?.name || 'account'}-${startDate}-${endDate}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (accountLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (!account) {
    return <p className="text-gray-500">Account not found.</p>;
  }

  return (
    <div data-testid="account-detail-page">
      {/* Back link + Header */}
      <div className="mb-6">
        <Link
          href="/accounts"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Accounts
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {typeLabel(account.type)}
              </span>
              <span className="text-lg font-semibold">{formatKES(account.balance)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Date range filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <label htmlFor="start_date" className="block text-xs text-gray-500">
            From
          </label>
          <input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-xs text-gray-500">
            To
          </label>
          <input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>

      {/* Statement */}
      <div className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900">
        {statementLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading statement...
          </div>
        ) : statement ? (
          <>
            {/* Opening Balance */}
            <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium dark:border-gray-800">
              <span>Opening Balance</span>
              <span>{formatKES(statement.opening_balance)}</span>
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500 dark:border-gray-800">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Credit</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.transactions?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No transactions in this period.
                      </td>
                    </tr>
                  )}
                  {statement.transactions?.map(
                    (txn: {
                      id: string;
                      date: string;
                      description: string | null;
                      merchant: string | null;
                      category: string | null;
                      type: string;
                      debit: number;
                      credit: number;
                      running_balance: number;
                    }) => (
                      <tr key={txn.id} className="border-b last:border-0 dark:border-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap">{formatDate(txn.date)}</td>
                        <td className="px-4 py-2">
                          {txn.description || txn.merchant || '—'}
                          {txn.type === 'adjustment' && (
                            <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                              Adjustment
                            </span>
                          )}
                          {txn.type === 'transfer' && (
                            <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              Transfer
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{txn.category || '—'}</td>
                        <td className="px-4 py-2 text-right text-red-600">
                          {txn.debit > 0 ? formatKES(txn.debit) : ''}
                        </td>
                        <td className="px-4 py-2 text-right text-green-600">
                          {txn.credit > 0 ? formatKES(txn.credit) : ''}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatKES(txn.running_balance)}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Closing Balance */}
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm font-medium dark:border-gray-800">
              <span>Closing Balance</span>
              <span className="font-bold">{formatKES(statement.closing_balance)}</span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 border-t px-4 py-3 text-sm dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-500">Total Credits</p>
                <p className="font-semibold text-green-600">
                  {formatKES(statement.summary?.total_credits ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Debits</p>
                <p className="font-semibold text-red-600">
                  {formatKES(statement.summary?.total_debits ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Net Change</p>
                <p className="font-semibold">{formatKES(statement.summary?.net_change ?? 0)}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            Select a date range to view the statement.
          </div>
        )}
      </div>
    </div>
  );
}
