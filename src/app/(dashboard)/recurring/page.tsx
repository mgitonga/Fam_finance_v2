'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRecurringSchema, type CreateRecurringInput } from '@/lib/validations/recurring';
import {
  useRecurring,
  useCreateRecurring,
  useDeleteRecurring,
  useConfirmRecurring,
  useSkipRecurring,
} from '@/hooks/use-recurring';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { formatKES, formatDate } from '@/lib/utils';
import { Loader2, Plus, Trash2, Check, SkipForward, Calendar } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Modal } from '@/components/ui/modal';

type Recurring = {
  id: string;
  type: string;
  amount: number;
  day_of_month: number;
  description: string;
  next_due_date: string;
  category_id: string;
  account_id: string;
  categories: { name: string; color: string | null; icon: string | null } | null;
  accounts: { name: string } | null;
};

type Category = {
  id: string;
  name: string;
  type: string;
  children?: { id: string; name: string; type: string }[];
};

export default function RecurringPage() {
  const { data: rules, isLoading } = useRecurring();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createRecurring = useCreateRecurring();
  const deleteRecurring = useDeleteRecurring();
  const confirmRecurring = useConfirmRecurring();
  const skipRecurring = useSkipRecurring();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecurringInput>({
    resolver: zodResolver(createRecurringSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      day_of_month: 1,
      description: '',
      account_id: '',
      category_id: '',
    },
  });

  async function onSubmit(data: CreateRecurringInput) {
    await createRecurring.mutateAsync(data);
    reset();
    setShowForm(false);
  }

  async function handleConfirm(id: string) {
    await confirmRecurring.mutateAsync({ id });
  }

  async function handleSkip(id: string) {
    await skipRecurring.mutateAsync(id);
  }

  async function handleDelete(id: string) {
    if (confirm('Deactivate this recurring rule?')) {
      await deleteRecurring.mutateAsync(id);
    }
  }

  const isDue = (dateStr: string) => new Date(dateStr) <= new Date();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div data-testid="recurring-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage monthly recurring income and expenses.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
          data-testid="add-recurring-btn"
        >
          <Plus className="h-4 w-4" /> Add Rule
        </button>
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          reset();
        }}
        title="New Recurring Transaction"
      >
        <form onSubmit={handleSubmit(onSubmit)} data-testid="recurring-form">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('type')}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Amount (KES)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('day_of_month', { valueAsNumber: true })}
              />
              {errors.day_of_month && (
                <p className="mt-1 text-xs text-red-500">{errors.day_of_month.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Account</label>
              <select
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('account_id')}
              >
                <option value="">Select...</option>
                {accounts?.map((a: { id: string; name: string }) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="mt-1 text-xs text-red-500">{errors.account_id.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('category_id')}
              >
                <option value="">Select...</option>
                {categories?.map((cat: Category) => {
                  const hasChildren = cat.children && cat.children.length > 0;
                  if (hasChildren) {
                    return (
                      <optgroup key={cat.id} label={cat.name}>
                        {cat.children?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  }
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g., Monthly rent"
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2 border-t pt-4 dark:border-gray-800">
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
              className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="mt-6 space-y-3">
        {(!rules || rules.length === 0) && (
          <p className="text-center text-sm text-gray-500">No recurring transactions set up yet.</p>
        )}
        {(rules || []).map((rule: Recurring) => {
          const due = isDue(rule.next_due_date);
          return (
            <div
              key={rule.id}
              className={`rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${due ? 'border-amber-300 dark:border-amber-700' : ''}`}
              data-testid="recurring-row"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{rule.description}</p>
                    {due && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        Due
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Day {rule.day_of_month} monthly
                    </span>
                    <span className="flex items-center gap-1">
                      <DynamicIcon name={rule.categories?.icon} className="h-3 w-3 text-gray-400" />
                      {rule.categories?.name}
                    </span>
                    <span>{rule.accounts?.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Next due: {formatDate(rule.next_due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-bold ${rule.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {rule.type === 'income' ? '+' : '-'}
                    {formatKES(rule.amount)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t pt-3">
                <button
                  onClick={() => handleConfirm(rule.id)}
                  disabled={confirmRecurring.isPending}
                  className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  data-testid="confirm-recurring"
                >
                  <Check className="h-3 w-3" /> Confirm & Create
                </button>
                <button
                  onClick={() => handleSkip(rule.id)}
                  disabled={skipRecurring.isPending}
                  className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
                  data-testid="skip-recurring"
                >
                  <SkipForward className="h-3 w-3" /> Skip
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="ml-auto rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
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
