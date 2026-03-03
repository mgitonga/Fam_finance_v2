'use client';

import { formatKES } from '@/lib/utils';

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

const TYPE_ICONS: Record<string, string> = {
  bank: '🏦',
  mobile_money: '📱',
  cash: '💵',
  credit_card: '💳',
  other: '🔹',
};

interface AccountBalancesProps {
  accounts: Account[];
}

export function AccountBalances({ accounts }: AccountBalancesProps) {
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div
      className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
      data-testid="account-balances-widget"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Account Balances</h3>
        <span className="text-sm font-bold">{formatKES(totalBalance)}</span>
      </div>
      <div className="divide-y">
        {accounts.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No accounts</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <span>{TYPE_ICONS[account.type] || '🔹'}</span>
                <span>{account.name}</span>
              </span>
              <span className="text-sm font-semibold">{formatKES(Number(account.balance))}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
