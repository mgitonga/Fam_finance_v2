'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useDebts } from '@/hooks/use-debts';
import { TransactionForm } from '@/components/forms/transaction-form';
import { Modal } from '@/components/ui/modal';
import { formatKES, formatDate } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';
import type { CreateTransactionInput } from '@/lib/validations/transaction';
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Filter,
  Link2,
} from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string | null;
  merchant: string | null;
  payment_method: string | null;
  user_id: string;
  account_id: string;
  category_id: string;
  debt_id: string | null;
  notes: string | null;
  tags: string[] | null;
  categories: { name: string; color: string | null; icon: string | null } | null;
  accounts: { name: string } | null;
};

type Debt = {
  id: string;
  name: string;
  outstanding_balance: number;
};

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const debtIdParam = searchParams.get('debt_id');

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDebt, setFilterDebt] = useState(debtIdParam || '');
  const [showFilters, setShowFilters] = useState(!!debtIdParam);

  // Sync debt filter from URL param (derived, not via effect)
  const effectiveDebtFilter = debtIdParam || filterDebt;
  const effectiveShowFilters = showFilters || !!debtIdParam;

  const { data: result, isLoading } = useTransactions({
    page,
    sortBy,
    sortOrder,
    search: search || undefined,
    type: filterType || undefined,
    account_id: filterAccount || undefined,
    category_id: filterCategory || undefined,
    debt_id: effectiveDebtFilter || undefined,
  });

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: debts } = useDebts();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const transactions: Transaction[] = result?.data || [];
  const pagination = result?.pagination || { page: 1, totalPages: 1, total: 0 };

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function startEdit(tx: Transaction) {
    setEditingTx(tx);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingTx(null);
  }

  async function handleCreate(data: CreateTransactionInput) {
    await createTransaction.mutateAsync(data);
    cancelForm();
  }

  async function handleUpdate(data: CreateTransactionInput) {
    if (!editingTx) return;
    await updateTransaction.mutateAsync({ id: editingTx.id, data });
    cancelForm();
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this transaction? This cannot be undone.')) {
      await deleteTransaction.mutateAsync(id);
    }
  }

  const paymentLabel = (method: string | null) =>
    PAYMENT_METHODS.find((pm) => pm.value === method)?.label || method || '—';

  return (
    <div data-testid="transactions-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white"
          data-testid="add-transaction-btn"
        >
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      <Modal
        open={showForm}
        onClose={cancelForm}
        title={editingTx ? 'Edit Transaction' : 'New Transaction'}
      >
        <TransactionForm
          defaultValues={
            editingTx
              ? {
                  type: editingTx.type as 'income' | 'expense',
                  amount: editingTx.amount,
                  date: editingTx.date,
                  account_id: editingTx.account_id,
                  category_id: editingTx.category_id,
                  description: editingTx.description,
                  merchant: editingTx.merchant,
                  payment_method:
                    editingTx.payment_method as CreateTransactionInput['payment_method'],
                  notes: editingTx.notes,
                  debt_id: editingTx.debt_id,
                }
              : undefined
          }
          onSubmit={editingTx ? handleUpdate : handleCreate}
          onCancel={cancelForm}
          isEditing={!!editingTx}
        />
      </Modal>

      {/* Search & Filters */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search description or merchant..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border py-2 pr-3 pl-9 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="txn-search"
          />
        </div>
        <button
          onClick={() => setShowFilters(!effectiveShowFilters)}
          className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          data-testid="toggle-filters"
        >
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {effectiveShowFilters && (
        <div className="mt-2 flex flex-wrap gap-2" data-testid="filter-bar">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filterAccount}
            onChange={(e) => {
              setFilterAccount(e.target.value);
              setPage(1);
            }}
            className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">All Accounts</option>
            {accounts?.map((a: { id: string; name: string }) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            {categories?.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterDebt}
            onChange={(e) => {
              setFilterDebt(e.target.value);
              setPage(1);
            }}
            className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">All Debts</option>
            {debts?.map((d: Debt) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {(filterType || filterAccount || filterCategory || filterDebt) && (
            <button
              onClick={() => {
                setFilterType('');
                setFilterAccount('');
                setFilterCategory('');
                setFilterDebt('');
                setPage(1);
              }}
              className="rounded-md border px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Transaction Table */}
      {isLoading ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="mt-8 text-center text-gray-500">
          <p>No transactions found.</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="text-primary mt-2 hover:underline">
              Add your first transaction
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" data-testid="transaction-table">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th
                    className="cursor-pointer px-3 py-3 font-medium hover:text-gray-700"
                    onClick={() => handleSort('date')}
                  >
                    <span className="flex items-center gap-1">
                      Date <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Account</th>
                  <th className="px-3 py-3 font-medium">Payment</th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right font-medium hover:text-gray-700"
                    onClick={() => handleSort('amount')}
                  >
                    <span className="flex items-center justify-end gap-1">
                      Amount <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    data-testid="transaction-row"
                  >
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium">{tx.description || '—'}</p>
                        {tx.merchant && <p className="text-xs text-gray-500">{tx.merchant}</p>}
                        {tx.debt_id && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Link2 className="h-3 w-3" />
                            Debt Payment
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        <DynamicIcon
                          name={tx.categories?.icon}
                          className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
                        />
                        {tx.categories?.color && (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: tx.categories.color }}
                          />
                        )}
                        {tx.categories?.name || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">{tx.accounts?.name || '—'}</td>
                    <td className="px-3 py-3">{paymentLabel(tx.payment_method)}</td>
                    <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatKES(tx.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(tx)}
                          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm" data-testid="pagination">
            <p className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border p-2 hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-md border p-2 hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
