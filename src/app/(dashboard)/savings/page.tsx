'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSavingsGoalSchema,
  addContributionSchema,
  updateSavingsGoalSchema,
  calculateRequiredMonthly,
  type CreateSavingsGoalInput,
  type UpdateSavingsGoalInput,
  type AddContributionInput,
} from '@/lib/validations/savings-debt';
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useDeleteSavingsGoal,
  useUpdateSavingsGoal,
  useAddContribution,
  useContributions,
} from '@/hooks/use-savings';
import { useAccounts } from '@/hooks/use-accounts';
import { formatKES, formatDate } from '@/lib/utils';
import { getBudgetStatus } from '@/lib/validations/budget';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Target,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  color: string | null;
  is_completed: boolean;
};
type Contribution = {
  id: string;
  amount: number;
  date: string;
  notes: string | null;
  type: string;
  users: { name: string } | null;
  accounts: { name: string } | null;
};

export default function SavingsPage() {
  const { data: goals, isLoading } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const addContribution = useAddContribution();
  const { data: accounts } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showContribForm, setShowContribForm] = useState<string | null>(null);
  const [contribType, setContribType] = useState<'deposit' | 'withdrawal'>('deposit');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSavingsGoalInput>({
    resolver: zodResolver(createSavingsGoalSchema),
    defaultValues: { name: '', target_amount: 0, target_date: '' },
  });

  const {
    register: regEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
  } = useForm<UpdateSavingsGoalInput>({
    resolver: zodResolver(updateSavingsGoalSchema),
  });

  const {
    register: regContrib,
    handleSubmit: submitContrib,
    reset: resetContrib,
    formState: { errors: contribErrors, isSubmitting: contribSubmitting },
  } = useForm<AddContributionInput>({
    resolver: zodResolver(addContributionSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      account_id: '',
      type: 'deposit',
      notes: '',
    },
  });

  const { data: contributions } = useContributions(selectedGoal || '');

  async function onCreateGoal(data: CreateSavingsGoalInput) {
    await createGoal.mutateAsync(data);
    reset();
    setShowForm(false);
  }

  async function onEditGoal(data: UpdateSavingsGoalInput) {
    if (!editingGoal) return;
    await updateGoal.mutateAsync({ id: editingGoal.id, data });
    setEditingGoal(null);
  }

  function startEdit(goal: Goal) {
    setEditingGoal(goal);
    resetEdit({
      name: goal.name,
      target_amount: Number(goal.target_amount),
      target_date: goal.target_date,
    });
  }

  async function onAddContribution(data: AddContributionInput) {
    if (!showContribForm) return;
    await addContribution.mutateAsync({
      goalId: showContribForm,
      data: { ...data, type: contribType },
    });
    resetContrib();
    setShowContribForm(null);
    setContribType('deposit');
  }

  function openContribForm(goalId: string, type: 'deposit' | 'withdrawal') {
    setShowContribForm(goalId);
    setContribType(type);
    resetContrib({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      account_id: '',
      type,
      notes: '',
    });
  }

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );

  return (
    <div data-testid="savings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <p className="mt-1 text-sm text-gray-500">Track progress towards your financial goals.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          reset();
        }}
        title="New Savings Goal"
      >
        <form onSubmit={handleSubmit(onCreateGoal)}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g., Vacation Fund"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Target Amount (KES)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('target_amount', { valueAsNumber: true })}
              />
              {errors.target_amount && (
                <p className="mt-1 text-xs text-red-500">{errors.target_amount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Target Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...register('target_date')}
              />
              {errors.target_date && (
                <p className="mt-1 text-xs text-red-500">{errors.target_date.message}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2 border-t pt-4 dark:border-gray-800">
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
              className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal open={!!editingGoal} onClose={() => setEditingGoal(null)} title="Edit Savings Goal">
        <form onSubmit={submitEdit(onEditGoal)}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...regEdit('name')}
              />
              {editErrors.name && (
                <p className="mt-1 text-xs text-red-500">{editErrors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Target Amount (KES)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...regEdit('target_amount', { valueAsNumber: true })}
              />
              {editErrors.target_amount && (
                <p className="mt-1 text-xs text-red-500">{editErrors.target_amount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Target Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                {...regEdit('target_date')}
              />
              {editErrors.target_date && (
                <p className="mt-1 text-xs text-red-500">{editErrors.target_date.message}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2 border-t pt-4 dark:border-gray-800">
            <button
              type="submit"
              disabled={editSubmitting}
              className="bg-primary flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {editSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update
            </button>
            <button
              type="button"
              onClick={() => setEditingGoal(null)}
              className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="mt-6 space-y-4">
        {(!goals || goals.length === 0) && (
          <p className="text-center text-sm text-gray-500">
            No savings goals yet. Create one to start tracking!
          </p>
        )}
        {(goals || []).map((goal: Goal) => {
          const pct =
            goal.target_amount > 0
              ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)
              : 0;
          const status = getBudgetStatus(Number(goal.current_amount), Number(goal.target_amount));
          const requiredMonthly = calculateRequiredMonthly(
            Number(goal.target_amount),
            Number(goal.current_amount),
            goal.target_date,
          );
          const isExpanded = selectedGoal === goal.id;

          return (
            <div
              key={goal.id}
              className={`rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900 ${goal.is_completed ? 'border-green-300 dark:border-green-700' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target
                      className={`h-5 w-5 ${goal.is_completed ? 'text-green-500' : 'text-primary'}`}
                    />
                    <h3 className="font-semibold">{goal.name}</h3>
                    {goal.is_completed && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                        Target Reached!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedGoal(isExpanded ? null : goal.id)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                    {!goal.is_completed && (
                      <button
                        onClick={() => openContribForm(goal.id, 'deposit')}
                        className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                      >
                        <ArrowDownCircle className="h-3 w-3" /> Deposit
                      </button>
                    )}
                    <button
                      onClick={() => openContribForm(goal.id, 'withdrawal')}
                      className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <ArrowUpCircle className="h-3 w-3" /> Withdraw
                    </button>
                    <button
                      onClick={() => startEdit(goal)}
                      className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Edit goal"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this goal?')) deleteGoal.mutate(goal.id);
                      }}
                      className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm">
                    <span>
                      Pot: {formatKES(Number(goal.current_amount))} /{' '}
                      {formatKES(Number(goal.target_amount))}
                    </span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full transition-all ${status.color === 'red' ? 'bg-green-500' : status.color === 'amber' ? 'bg-green-400' : 'bg-primary'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Target: {formatDate(goal.target_date)}</span>
                    {!goal.is_completed && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Need {formatKES(requiredMonthly)}/mo
                      </span>
                    )}
                  </div>
                </div>

                {/* Fund/Withdraw form */}
                {showContribForm === goal.id && (
                  <form onSubmit={submitContrib(onAddContribution)} className="mt-3 border-t pt-3">
                    <p className="mb-2 text-xs font-medium">
                      {contribType === 'deposit' ? '↓ Deposit to pot' : '↑ Withdraw from pot'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                        {...regContrib('account_id')}
                      >
                        <option value="">Account...</option>
                        {accounts?.map((a: { id: string; name: string; balance: number }) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({formatKES(Number(a.balance))})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="Amount"
                        className="w-32 rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                        {...regContrib('amount', { valueAsNumber: true })}
                      />
                      <input
                        type="date"
                        className="rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                        {...regContrib('date')}
                      />
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        className="flex-1 rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                        {...regContrib('notes')}
                      />
                      <button
                        type="submit"
                        disabled={contribSubmitting}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 ${contribType === 'deposit' ? 'bg-green-600' : 'bg-orange-600'}`}
                      >
                        {contribSubmitting
                          ? '...'
                          : contribType === 'deposit'
                            ? 'Deposit'
                            : 'Withdraw'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowContribForm(null);
                          resetContrib();
                        }}
                        className="rounded-md border px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    {contribErrors.amount && (
                      <p className="mt-1 text-xs text-red-500">{contribErrors.amount.message}</p>
                    )}
                    {contribErrors.account_id && (
                      <p className="mt-1 text-xs text-red-500">
                        {contribErrors.account_id.message}
                      </p>
                    )}
                    {contribType === 'withdrawal' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Pot balance: {formatKES(Number(goal.current_amount))}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Contribution history */}
              {isExpanded && (
                <div className="border-t bg-gray-50/50 px-4 py-3 dark:bg-gray-800/30">
                  <p className="mb-2 text-xs font-medium text-gray-400 uppercase">Fund History</p>
                  {!contributions || contributions.length === 0 ? (
                    <p className="text-xs text-gray-500">No transactions yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {contributions.map((c: Contribution) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            {c.type === 'withdrawal' ? (
                              <ArrowUpCircle className="h-3.5 w-3.5 text-orange-500" />
                            ) : (
                              <ArrowDownCircle className="h-3.5 w-3.5 text-green-500" />
                            )}
                            <span
                              className={`font-medium ${c.type === 'withdrawal' ? 'text-orange-600' : 'text-green-600'}`}
                            >
                              {c.type === 'withdrawal' ? '-' : '+'}
                              {formatKES(c.amount)}
                            </span>
                            {c.accounts?.name && (
                              <span className="text-xs text-gray-400">
                                {c.type === 'withdrawal' ? '→' : '←'} {c.accounts.name}
                              </span>
                            )}
                            {c.notes && <span className="text-gray-500">— {c.notes}</span>}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(c.date)} {c.users?.name && `by ${c.users.name}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
