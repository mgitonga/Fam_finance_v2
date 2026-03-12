'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema, type CreateAccountInput } from '@/lib/validations/account';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/use-accounts';
import { ACCOUNT_TYPES } from '@/lib/constants';
import { formatKES } from '@/lib/utils';
import { Loader2, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { BalanceSparkline } from '@/components/charts/balance-sparkline';
import Link from 'next/link';

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { name: '', type: 'bank', balance: 0 },
  });

  function startEdit(
    e: React.MouseEvent,
    account: { id: string; name: string; type: string; balance: number },
  ) {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(account.id);
    setShowForm(true);
    reset({
      name: account.name,
      type: account.type as CreateAccountInput['type'],
      balance: Number(account.balance),
    });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    reset({ name: '', type: 'bank', balance: 0 });
  }

  async function onSubmit(data: CreateAccountInput) {
    try {
      if (editingId) {
        await updateAccount.mutateAsync({ id: editingId, data });
      } else {
        await createAccount.mutateAsync(data);
      }
      cancelForm();
    } catch {
      // Error handled by mutation
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to deactivate this account?')) {
      await deleteAccount.mutateAsync(id);
    }
  }

  const typeLabel = (type: string) => ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;

  // Calculate totals
  const totalBalance =
    accounts?.reduce((sum: number, a: { balance: number }) => sum + Number(a.balance), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading accounts...
      </div>
    );
  }

  return (
    <div data-testid="accounts-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your financial accounts and view balances
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
          data-testid="add-account-btn"
        >
          <Plus className="h-4 w-4" /> Add Account
        </button>
      </div>

      {/* Totals Bar */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="accounts-totals">
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Balance</p>
            <Wallet className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-bold">{formatKES(totalBalance)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Accounts</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-2 text-xl font-bold">{accounts?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Avg Balance</p>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </div>
          <p className="mt-2 text-xl font-bold">
            {formatKES(accounts?.length ? totalBalance / accounts.length : 0)}
          </p>
        </div>
      </div>

      {/* Account Form Modal */}
      <Modal
        open={showForm}
        onClose={cancelForm}
        title={editingId ? 'Edit Account' : 'New Account'}
      >
        <form onSubmit={handleSubmit(onSubmit)} data-testid="account-form">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g., Joint Account"
                data-testid="account-name"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium">
                Type
              </label>
              <select
                id="type"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                data-testid="account-type"
                {...register('type')}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="balance" className="block text-sm font-medium">
                Balance (KES)
              </label>
              <input
                id="balance"
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                data-testid="account-balance"
                {...register('balance', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 border-t pt-4 dark:border-gray-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              data-testid="account-save"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Account Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts?.length === 0 && (
          <p className="text-sm text-gray-500">No accounts yet. Add your first account above.</p>
        )}
        {accounts?.map((account: { id: string; name: string; type: string; balance: number }) => (
          <Link
            key={account.id}
            href={`/accounts/${account.id}`}
            className="group rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            data-testid="account-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{account.name}</p>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {typeLabel(account.type)}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => startEdit(e, account)}
                  className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Edit account"
                >
                  <Pencil className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, account.id)}
                  className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Delete account"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">{formatKES(account.balance)}</p>
            <div className="mt-3 h-12">
              <BalanceSparkline accountId={account.id} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
