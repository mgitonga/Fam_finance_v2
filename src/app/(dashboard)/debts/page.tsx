'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createDebtSchema,
  logDebtPaymentSchema,
  type CreateDebtInput,
  type LogDebtPaymentInput,
} from '@/lib/validations/savings-debt';
import { useDebts, useCreateDebt, useDeleteDebt, useLogDebtPayment } from '@/hooks/use-debts';
import { useAccounts } from '@/hooks/use-accounts';
import { formatKES, formatDate } from '@/lib/utils';
import { Loader2, Plus, Trash2, X, CreditCard, Calendar, TrendingDown } from 'lucide-react';

type Debt = {
  id: string;
  name: string;
  type: string;
  original_amount: number;
  outstanding_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  payment_day: number | null;
  start_date: string;
  projected_payoff_date: string | null;
};

const DEBT_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
  credit_card: 'Credit Card',
  student_loan: 'Student Loan',
  other: 'Other',
};

export default function DebtsPage() {
  const { data: debts, isLoading } = useDebts();
  const { data: accounts } = useAccounts();
  const createDebt = useCreateDebt();
  const deleteDebt = useDeleteDebt();
  const logPayment = useLogDebtPayment();
  const [showForm, setShowForm] = useState(false);
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDebtInput>({
    resolver: zodResolver(createDebtSchema),
    defaultValues: {
      name: '',
      type: 'mortgage',
      original_amount: 0,
      outstanding_balance: 0,
      start_date: '',
    },
  });

  const {
    register: regPay,
    handleSubmit: submitPay,
    reset: resetPay,
    formState: { errors: payErrors, isSubmitting: paySubmitting },
  } = useForm<LogDebtPaymentInput>({
    resolver: zodResolver(logDebtPaymentSchema),
    defaultValues: { amount: 0, account_id: '' },
  });

  async function onCreateDebt(data: CreateDebtInput) {
    await createDebt.mutateAsync(data);
    reset();
    setShowForm(false);
  }

  async function onLogPayment(data: LogDebtPaymentInput) {
    if (!payingDebtId) return;
    await logPayment.mutateAsync({ debtId: payingDebtId, data });
    resetPay();
    setPayingDebtId(null);
  }

  // Summary
  const totalOutstanding = (debts || []).reduce(
    (s: number, d: Debt) => s + Number(d.outstanding_balance),
    0,
  );
  const totalMonthlyPayment = (debts || []).reduce(
    (s: number, d: Debt) => s + Number(d.minimum_payment || 0),
    0,
  );

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );

  return (
    <div data-testid="debts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debt Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">Track debts and project payoff dates.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add Debt
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatKES(totalOutstanding)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total Monthly Payments</p>
          <p className="mt-1 text-xl font-bold">{formatKES(totalMonthlyPayment)}</p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreateDebt)}
          className="mt-4 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium">New Debt</h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
              className="text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g., KCB Mortgage"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('type')}
              >
                {Object.entries(DEBT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Original Amount (KES)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('original_amount', { valueAsNumber: true })}
              />
              {errors.original_amount && (
                <p className="mt-1 text-xs text-red-500">{errors.original_amount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Outstanding Balance (KES)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('outstanding_balance', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('interest_rate', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Monthly Payment (KES)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('minimum_payment', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Payment Day</label>
              <input
                type="number"
                min="1"
                max="31"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('payment_day', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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

      <div className="mt-6 space-y-4">
        {(!debts || debts.length === 0) && (
          <p className="text-center text-sm text-gray-500">
            No debts tracked. Add one to start managing your loans.
          </p>
        )}
        {(debts || []).map((debt: Debt) => {
          const paidPct =
            Number(debt.original_amount) > 0
              ? Math.round(
                  ((Number(debt.original_amount) - Number(debt.outstanding_balance)) /
                    Number(debt.original_amount)) *
                    100,
                )
              : 0;

          return (
            <div
              key={debt.id}
              className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="font-semibold">{debt.name}</h3>
                      <span className="text-xs text-gray-500">
                        {DEBT_TYPE_LABELS[debt.type] || debt.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPayingDebtId(payingDebtId === debt.id ? null : debt.id)}
                      className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      <TrendingDown className="h-3 w-3" /> Pay
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Deactivate this debt?')) deleteDebt.mutate(debt.id);
                      }}
                      className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-gray-500">Outstanding</span>
                    <p className="font-bold text-red-600">
                      {formatKES(Number(debt.outstanding_balance))}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Original</span>
                    <p className="font-medium">{formatKES(Number(debt.original_amount))}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate</span>
                    <p className="font-medium">
                      {debt.interest_rate !== null ? `${debt.interest_rate}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Monthly</span>
                    <p className="font-medium">
                      {debt.minimum_payment ? formatKES(Number(debt.minimum_payment)) : '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{paidPct}% paid off</span>
                    {debt.projected_payoff_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Payoff:{' '}
                        {formatDate(debt.projected_payoff_date)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(paidPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Payment form */}
                {payingDebtId === debt.id && (
                  <form
                    onSubmit={submitPay(onLogPayment)}
                    className="mt-3 flex flex-wrap gap-2 border-t pt-3"
                  >
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="Amount"
                      className="w-32 rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                      {...regPay('amount', { valueAsNumber: true })}
                    />
                    <select
                      className="rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                      {...regPay('account_id')}
                    >
                      <option value="">Account...</option>
                      {accounts?.map((a: { id: string; name: string }) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={paySubmitting}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {paySubmitting ? '...' : 'Log Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayingDebtId(null);
                        resetPay();
                      }}
                      className="rounded-md border px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                    {payErrors.amount && (
                      <p className="w-full text-xs text-red-500">{payErrors.amount.message}</p>
                    )}
                    {payErrors.account_id && (
                      <p className="w-full text-xs text-red-500">{payErrors.account_id.message}</p>
                    )}
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
