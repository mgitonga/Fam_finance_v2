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
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

export default function AccountsSettingsPage() {
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

  function startEdit(account: { id: string; name: string; type: string; balance: number }) {
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

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to deactivate this account?')) {
      await deleteAccount.mutateAsync(id);
    }
  }

  const typeLabel = (type: string) => ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading accounts...
      </div>
    );
  }

  return (
    <div data-testid="accounts-settings">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Accounts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your financial accounts (bank, M-Pesa, cash, etc.)
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

      <div className="mt-4 space-y-2">
        {accounts?.length === 0 && (
          <p className="text-sm text-gray-500">No accounts yet. Add your first account above.</p>
        )}
        {accounts?.map((account: { id: string; name: string; type: string; balance: number }) => (
          <div
            key={account.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            data-testid="account-row"
          >
            <div>
              <p className="font-medium">{account.name}</p>
              <p className="text-sm text-gray-500">{typeLabel(account.type)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatKES(account.balance)}</span>
              <button
                onClick={() => startEdit(account)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Edit account"
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Delete account"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
