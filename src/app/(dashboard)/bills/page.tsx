'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createBillReminderSchema,
  type CreateBillReminderInput,
} from '@/lib/validations/recurring';
import { getDaysUntilDue } from '@/lib/validations/recurring';
import { useBills, useCreateBill, useDeleteBill } from '@/hooks/use-bills';
import { useCategories } from '@/hooks/use-categories';
import { formatKES } from '@/lib/utils';
import { Loader2, Plus, Trash2, X, Bell, Clock } from 'lucide-react';

type Bill = {
  id: string;
  name: string;
  amount: number | null;
  due_day: number;
  reminder_days_before: number;
  notification_method: string;
  categories: { name: string; color: string | null } | null;
};

type Category = {
  id: string;
  name: string;
  type: string;
  children?: { id: string; name: string; type: string }[];
};

export default function BillsPage() {
  const { data: bills, isLoading } = useBills();
  const { data: categories } = useCategories();
  const createBill = useCreateBill();
  const deleteBill = useDeleteBill();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBillReminderInput>({
    resolver: zodResolver(createBillReminderSchema),
    defaultValues: { name: '', due_day: 1, reminder_days_before: 3, notification_method: 'both' },
  });

  async function onSubmit(data: CreateBillReminderInput) {
    await createBill.mutateAsync(data);
    reset();
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Deactivate this bill reminder?')) {
      await deleteBill.mutateAsync(id);
    }
  }

  const urgencyColor = (daysLeft: number) => {
    if (daysLeft <= 3) return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
    if (daysLeft <= 7) return 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400';
    return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div data-testid="bills-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bill Reminders</h1>
          <p className="mt-1 text-sm text-gray-500">Set up reminders for recurring bills.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
            data-testid="add-bill-btn"
          >
            <Plus className="h-4 w-4" /> Add Reminder
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          data-testid="bill-form"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium">New Bill Reminder</h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Bill Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g., Rent"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Amount (KES, optional)</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('amount', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('due_day', { valueAsNumber: true })}
              />
              {errors.due_day && (
                <p className="mt-1 text-xs text-red-500">{errors.due_day.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('category_id')}
              >
                <option value="">None</option>
                {categories?.map((cat: Category) => {
                  const hasChildren = cat.children && cat.children.length > 0;
                  if (hasChildren)
                    return (
                      <optgroup key={cat.id} label={cat.name}>
                        {cat.children?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Remind Days Before</label>
              <input
                type="number"
                min="1"
                max="30"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('reminder_days_before', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Notification Method</label>
              <select
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('notification_method')}
              >
                <option value="both">In-App + Email</option>
                <option value="in_app">In-App Only</option>
                <option value="email">Email Only</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {(!bills || bills.length === 0) && (
          <p className="text-center text-sm text-gray-500">No bill reminders set up yet.</p>
        )}
        {(bills || []).map((bill: Bill) => {
          const daysLeft = getDaysUntilDue(bill.due_day);
          return (
            <div
              key={bill.id}
              className="flex items-center justify-between rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              data-testid="bill-row"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${urgencyColor(daysLeft)}`}
                >
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{bill.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Due day {bill.due_day}
                    </span>
                    {bill.categories && <span>• {bill.categories.name}</span>}
                    <span>• Remind {bill.reminder_days_before}d before</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {bill.amount && <p className="font-semibold">{formatKES(bill.amount)}</p>}
                  <p
                    className={`text-sm font-medium ${daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-green-600'}`}
                  >
                    {daysLeft === 0 ? 'Due today' : `${daysLeft} days`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(bill.id)}
                  className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
