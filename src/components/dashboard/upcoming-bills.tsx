'use client';

import { formatKES } from '@/lib/utils';
import { Bell } from 'lucide-react';

type Bill = {
  id: string;
  name: string;
  amount: number | null;
  due_day: number;
  daysLeft: number;
  categories: { name: string } | null;
};

interface UpcomingBillsProps {
  bills: Bill[];
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  const urgencyColor = (days: number) => {
    if (days <= 3) return 'text-red-600 bg-red-50 dark:bg-red-950';
    if (days <= 7) return 'text-amber-600 bg-amber-50 dark:bg-amber-950';
    return 'text-green-600 bg-green-50 dark:bg-green-950';
  };

  return (
    <div
      className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
      data-testid="upcoming-bills-widget"
    >
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">Upcoming Bills</h3>
      </div>
      <div className="divide-y">
        {bills.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No upcoming bills</p>
        ) : (
          bills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${urgencyColor(bill.daysLeft)}`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{bill.name}</p>
                  <p className="text-xs text-gray-500">
                    {bill.categories?.name || `Day ${bill.due_day}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {bill.amount && <p className="text-sm font-medium">{formatKES(bill.amount)}</p>}
                <p
                  className={`text-xs font-medium ${bill.daysLeft <= 3 ? 'text-red-600' : bill.daysLeft <= 7 ? 'text-amber-600' : 'text-green-600'}`}
                >
                  {bill.daysLeft === 0 ? 'Due today' : `${bill.daysLeft}d left`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
