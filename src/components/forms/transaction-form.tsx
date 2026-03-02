'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from '@/lib/validations/transaction';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Loader2, X } from 'lucide-react';

type CategoryWithChildren = {
  id: string;
  name: string;
  type: string;
  children?: { id: string; name: string; type: string }[];
};

interface TransactionFormProps {
  defaultValues?: Partial<CreateTransactionInput>;
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function TransactionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isEditing,
}: TransactionFormProps) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      account_id: '',
      category_id: '',
      description: '',
      merchant: '',
      payment_method: null,
      notes: '',
      ...defaultValues,
    },
  });

  const txnType = watch('type');

  // Filter categories based on transaction type
  const filteredCategories = categories?.filter(
    (cat: CategoryWithChildren) => cat.type === txnType || cat.type === 'both',
  );

  async function onFormSubmit(data: CreateTransactionInput) {
    await onSubmit(data);
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      data-testid="transaction-form"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isEditing ? 'Edit Transaction' : 'New Transaction'}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="txn-type"
            {...register('type')}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount (KES)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="0.00"
            data-testid="txn-amount"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="txn-date"
            {...register('date')}
          />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
        </div>

        {/* Account */}
        <div>
          <label htmlFor="account_id" className="block text-sm font-medium">
            Account
          </label>
          <select
            id="account_id"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="txn-account"
            {...register('account_id')}
          >
            <option value="">Select account...</option>
            {accounts?.map((acc: { id: string; name: string }) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
          {errors.account_id && (
            <p className="mt-1 text-xs text-red-500">{errors.account_id.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="category_id"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="txn-category"
            {...register('category_id')}
          >
            <option value="">Select category...</option>
            {filteredCategories?.map((cat: CategoryWithChildren) => (
              <optgroup key={cat.id} label={cat.name}>
                <option value={cat.id}>{cat.name}</option>
                {cat.children?.map((child) => (
                  <option key={child.id} value={child.id}>
                    &nbsp;&nbsp;{child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium">
            Payment Method
          </label>
          <select
            id="payment_method"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="txn-payment-method"
            {...register('payment_method')}
          >
            <option value="">Select...</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <input
            id="description"
            type="text"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="What was this for?"
            data-testid="txn-description"
            {...register('description')}
          />
        </div>

        {/* Merchant */}
        <div>
          <label htmlFor="merchant" className="block text-sm font-medium">
            Merchant
          </label>
          <input
            id="merchant"
            type="text"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="e.g., Naivas"
            data-testid="txn-merchant"
            {...register('merchant')}
          />
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="Additional notes..."
            data-testid="txn-notes"
            {...register('notes')}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          data-testid="txn-save"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Transaction' : 'Save Transaction'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
