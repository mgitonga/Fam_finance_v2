'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from '@/lib/validations/transaction';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useDebts } from '@/hooks/use-debts';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Loader2, X, Link2 } from 'lucide-react';

type CategoryWithChildren = {
  id: string;
  name: string;
  type: string;
  children?: { id: string; name: string; type: string }[];
};

type Debt = {
  id: string;
  name: string;
  outstanding_balance: number;
  minimum_payment: number | null;
  type: string;
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
  const { data: debts } = useDebts();

  const [isDebtRepayment, setIsDebtRepayment] = useState(!!defaultValues?.debt_id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      debt_id: null,
      ...defaultValues,
    },
  });

  const txnType = watch('type');
  const selectedDebtId = watch('debt_id');

  // Find the selected debt for validation display
  const selectedDebt = debts?.find((d: Debt) => d.id === selectedDebtId);

  // Auto-fill when a debt is selected
  useEffect(() => {
    if (!selectedDebtId || !debts) return;
    const debt = debts.find((d: Debt) => d.id === selectedDebtId);
    if (!debt) return;

    // Auto-fill amount with minimum payment if available
    if (debt.minimum_payment) {
      setValue('amount', Number(debt.minimum_payment));
    }

    // Auto-fill description
    setValue('description', `${debt.name} payment`);

    // Force expense type for debt repayment
    setValue('type', 'expense');

    // Auto-fill category — find a Loans sub-category
    if (categories) {
      const loansParent = categories.find(
        (c: CategoryWithChildren) => c.name === 'Loans' && !!(c.children && c.children.length > 0),
      );
      if (loansParent?.children?.[0]) {
        setValue('category_id', loansParent.children[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDebtId]);

  // When toggling off debt repayment, clear debt_id
  useEffect(() => {
    if (!isDebtRepayment) {
      setValue('debt_id', null);
    }
  }, [isDebtRepayment, setValue]);

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
            disabled={isDebtRepayment}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* Debt Repayment Toggle */}
        {txnType === 'expense' && (
          <div className="flex items-end sm:col-span-1">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={isDebtRepayment}
                onChange={(e) => setIsDebtRepayment(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                data-testid="debt-repayment-toggle"
              />
              <Link2 className="h-4 w-4 text-blue-500" />
              Debt Repayment
            </label>
          </div>
        )}

        {/* Debt Picker */}
        {isDebtRepayment && (
          <div className={txnType === 'expense' ? '' : 'sm:col-span-2'}>
            <label htmlFor="debt_id" className="block text-sm font-medium">
              Select Debt
            </label>
            <select
              id="debt_id"
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              data-testid="txn-debt"
              {...register('debt_id')}
            >
              <option value="">Choose a debt...</option>
              {debts
                ?.filter((d: Debt) => Number(d.outstanding_balance) > 0)
                .map((d: Debt) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — KES {Number(d.outstanding_balance).toLocaleString()} remaining
                  </option>
                ))}
            </select>
            {selectedDebt && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Linked to: {selectedDebt.name} (KES{' '}
                {Number(selectedDebt.outstanding_balance).toLocaleString()} remaining)
              </p>
            )}
          </div>
        )}

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
          {selectedDebt && watch('amount') > Number(selectedDebt.outstanding_balance) && (
            <p className="mt-1 text-xs text-red-500">
              Amount exceeds outstanding balance of KES{' '}
              {Number(selectedDebt.outstanding_balance).toLocaleString()}
            </p>
          )}
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
            {filteredCategories?.map((cat: CategoryWithChildren) => {
              const hasChildren = cat.children && cat.children.length > 0;
              if (hasChildren) {
                // Parent with sub-categories: only children are selectable
                return (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.children?.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                );
              }
              // Standalone category (no children): selectable
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
