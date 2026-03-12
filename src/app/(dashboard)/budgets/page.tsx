'use client';

import { useState } from 'react';
import {
  useBudgets,
  useOverallBudget,
  useSetBudget,
  useSetOverallBudget,
  useCopyBudgets,
  useUpdateBudget,
  useDeleteBudget,
} from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { formatKES } from '@/lib/utils';
import { getBudgetStatus } from '@/lib/validations/budget';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

type SubCategorySpending = {
  id: string;
  name: string;
  color: string | null;
  spent: number;
};

type BudgetWithSpending = {
  id: string;
  category_id: string;
  amount: number;
  spent: number;
  direct_spent: number;
  sub_category_breakdown: SubCategorySpending[];
  categories: { name: string; color: string | null; icon: string | null; type: string } | null;
};

type CategoryWithChildren = {
  id: string;
  name: string;
  type: string;
  color: string | null;
  parent_id?: string | null;
  children?: { id: string; name: string; type: string }[];
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [overallAmount, setOverallAmount] = useState('');
  const [showOverallForm, setShowOverallForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  const { data: budgets, isLoading } = useBudgets(month, year);
  const { data: overallData } = useOverallBudget(month, year);
  const { data: categories } = useCategories();
  const setBudget = useSetBudget();
  const setOverallBudget = useSetOverallBudget();
  const copyBudgets = useCopyBudgets();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const overallBudget = overallData?.budget;
  const totalSpent = overallData?.spent || 0;

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  async function handleSetBudget() {
    if (!selectedCategory || !budgetAmount) return;
    await setBudget.mutateAsync({
      category_id: selectedCategory,
      amount: parseFloat(budgetAmount),
      month,
      year,
    });
    setSelectedCategory('');
    setBudgetAmount('');
    setShowAddForm(false);
  }

  function startEditBudget(budget: BudgetWithSpending) {
    setEditingBudgetId(budget.id);
    setEditAmount(String(budget.amount));
  }

  function cancelEditBudget() {
    setEditingBudgetId(null);
    setEditAmount('');
  }

  async function handleUpdateBudget(id: string) {
    if (!editAmount) return;
    await updateBudget.mutateAsync({ id, data: { amount: parseFloat(editAmount) } });
    cancelEditBudget();
  }

  async function handleDeleteBudget(id: string) {
    if (confirm('Remove this budget? The category spending data will not be affected.')) {
      await deleteBudget.mutateAsync(id);
    }
  }

  async function handleSetOverall() {
    if (!overallAmount) return;
    await setOverallBudget.mutateAsync({
      amount: parseFloat(overallAmount),
      month,
      year,
    });
    setOverallAmount('');
    setShowOverallForm(false);
  }

  async function handleCopyFromPrevious() {
    const fromMonth = month === 1 ? 12 : month - 1;
    const fromYear = month === 1 ? year - 1 : year;
    try {
      await copyBudgets.mutateAsync({
        from_month: fromMonth,
        from_year: fromYear,
        to_month: month,
        to_year: year,
      });
    } catch {
      // handled by mutation
    }
  }

  // Only parent expense categories that don't have a budget yet
  const budgetedCategoryIds = new Set(
    (budgets || []).map((b: BudgetWithSpending) => b.category_id),
  );
  const parentExpenseCategories = (categories || []).filter(
    (c: CategoryWithChildren) => (c.type === 'expense' || c.type === 'both') && !c.parent_id,
  );
  const unbudgetedCategories = parentExpenseCategories.filter(
    (c: CategoryWithChildren) => !budgetedCategoryIds.has(c.id),
  );

  // Total budgeted
  const totalBudgeted = (budgets || []).reduce(
    (sum: number, b: BudgetWithSpending) => sum + Number(b.amount),
    0,
  );

  const overallStatus = overallBudget
    ? getBudgetStatus(totalSpent, Number(overallBudget.amount))
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500" data-testid="budgets-page">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading budgets...
      </div>
    );
  }

  return (
    <div data-testid="budgets-page">
      {/* Header with month selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set and track monthly spending limits per category.
          </p>
        </div>
        <div className="flex items-center gap-2" data-testid="month-selector">
          <button
            onClick={prevMonth}
            className="rounded-md border p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center font-medium">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-md border p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total Budgeted</p>
          <p className="mt-1 text-xl font-bold">{formatKES(totalBudgeted)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="mt-1 text-xl font-bold">{formatKES(totalSpent)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Overall Budget</p>
          {overallBudget ? (
            <div>
              <p className="mt-1 text-xl font-bold">{formatKES(Number(overallBudget.amount))}</p>
              <p
                className={`text-xs ${overallStatus?.color === 'red' ? 'text-red-500' : overallStatus?.color === 'amber' ? 'text-amber-500' : 'text-green-500'}`}
              >
                {Math.round(overallStatus?.percentage || 0)}% used
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowOverallForm(true)}
              className="text-primary mt-1 text-sm hover:underline"
            >
              Set overall cap
            </button>
          )}
        </div>
      </div>

      {/* Overall budget form */}
      <Modal
        open={showOverallForm}
        onClose={() => setShowOverallForm(false)}
        title="Set Overall Monthly Budget"
      >
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount (KES)"
            value={overallAmount}
            onChange={(e) => setOverallAmount(e.target.value)}
            className="w-48 rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="overall-budget-amount"
          />
          <button
            onClick={handleSetOverall}
            disabled={!overallAmount}
            className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => setShowOverallForm(false)}
            className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
          data-testid="add-budget-btn"
        >
          <Plus className="h-4 w-4" /> Add Budget
        </button>
        <button
          onClick={handleCopyFromPrevious}
          disabled={copyBudgets.isPending}
          className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
          data-testid="copy-budgets-btn"
        >
          {copyBudgets.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Copy from {MONTH_NAMES[month === 1 ? 11 : month - 2]}
        </button>
      </div>

      {/* Add budget form */}
      <Modal open={showAddForm} onClose={() => setShowAddForm(false)} title="Set Category Budget">
        <div data-testid="budget-form">
          <p className="mb-3 text-xs text-gray-500">
            Budgets are set on parent categories. Sub-category spending automatically rolls up.
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              data-testid="budget-category"
            >
              <option value="">Select parent category...</option>
              {unbudgetedCategories.map((cat: CategoryWithChildren) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              {/* Also show already-budgeted categories for editing */}
              {(budgets || []).map((b: BudgetWithSpending) => (
                <option key={b.category_id} value={b.category_id}>
                  {b.categories?.name} (current: {formatKES(Number(b.amount))})
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount (KES)"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="w-40 rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              data-testid="budget-amount"
            />
            <button
              onClick={handleSetBudget}
              disabled={!selectedCategory || !budgetAmount || setBudget.isPending}
              className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              data-testid="budget-save"
            >
              {setBudget.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Budget progress list */}
      <div className="mt-6 space-y-4">
        {(!budgets || budgets.length === 0) && (
          <div className="text-center text-sm text-gray-500">
            <p>
              No budgets set for {MONTH_NAMES[month - 1]} {year}.
            </p>
            <p className="mt-1">
              Click &quot;Add Budget&quot; to set spending limits, or &quot;Copy from{' '}
              {MONTH_NAMES[month === 1 ? 11 : month - 2]}&quot; to reuse last month&apos;s budgets.
            </p>
          </div>
        )}
        {(budgets || []).map((budget: BudgetWithSpending) => {
          const hasSubCategories = budget.sub_category_breakdown?.length > 0;
          const isExpanded = expandedBudgetId === budget.id;

          return (
            <div
              key={budget.id}
              className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
              data-testid="budget-row"
            >
              <div className="p-4">
                {editingBudgetId === budget.id ? (
                  /* Inline edit mode */
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <DynamicIcon
                          name={budget.categories?.icon}
                          className="h-4 w-4 text-gray-500 dark:text-gray-400"
                        />
                        {budget.categories?.name || 'Unknown'}
                      </span>
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-32 rounded-md border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                      data-testid="edit-budget-amount"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateBudget(budget.id)}
                      disabled={updateBudget.isPending}
                      className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      aria-label="Save"
                      data-testid="save-budget-edit"
                    >
                      {updateBudget.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEditBudget}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Display mode with edit/delete/expand actions */
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {hasSubCategories && (
                          <button
                            onClick={() => setExpandedBudgetId(isExpanded ? null : budget.id)}
                            className="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label={isExpanded ? 'Collapse' : 'Expand sub-categories'}
                          >
                            <ChevronDown
                              className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                            />
                          </button>
                        )}
                        {hasSubCategories && (
                          <span className="text-xs text-gray-400">
                            {budget.sub_category_breakdown.length} sub-categories
                          </span>
                        )}
                      </div>
                      <BudgetProgress
                        categoryName={budget.categories?.name || 'Unknown'}
                        categoryColor={budget.categories?.color}
                        categoryIcon={budget.categories?.icon}
                        spent={budget.spent}
                        budget={Number(budget.amount)}
                      />
                    </div>
                    <div className="flex shrink-0 gap-1 pt-0.5">
                      <button
                        onClick={() => startEditBudget(budget)}
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Edit budget"
                        data-testid="edit-budget-btn"
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Delete budget"
                        data-testid="delete-budget-btn"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-category breakdown (expandable) */}
              {isExpanded && hasSubCategories && (
                <div className="border-t bg-gray-50/50 px-4 py-3 dark:bg-gray-800/30">
                  <p className="mb-2 text-xs font-medium text-gray-400 uppercase">
                    Sub-category Breakdown
                  </p>
                  <div className="space-y-2">
                    {budget.sub_category_breakdown.map((sub) => {
                      const subPct =
                        budget.amount > 0
                          ? Math.round((sub.spent / Number(budget.amount)) * 100)
                          : 0;
                      return (
                        <div key={sub.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {sub.color && (
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: sub.color }}
                              />
                            )}
                            <span>{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full rounded-full bg-gray-500 dark:bg-gray-400"
                                style={{ width: `${Math.min(subPct, 100)}%` }}
                              />
                            </div>
                            <span className="min-w-[80px] text-right text-gray-500">
                              {formatKES(sub.spent)}
                            </span>
                            <span className="min-w-[30px] text-right text-xs text-gray-400">
                              {subPct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {budget.direct_spent > 0 && (
                      <div className="flex items-center justify-between border-t pt-2 text-sm">
                        <span className="text-gray-400 italic">Direct spending</span>
                        <span className="text-gray-500">{formatKES(budget.direct_spent)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
                      <span>Total</span>
                      <span>{formatKES(budget.spent)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall budget progress */}
      {overallBudget && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Overall Budget</h2>
          <div className="mt-2">
            <BudgetProgress
              categoryName="Total Monthly Spending"
              spent={totalSpent}
              budget={Number(overallBudget.amount)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
