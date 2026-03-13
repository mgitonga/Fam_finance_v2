import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const supabase = await createClient();
    const hid = auth.context.householdId;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    // Parallel queries for all dashboard data
    const [
      transactionsRes,
      accountsRes,
      budgetsRes,
      overallBudgetRes,
      billsRes,
      savingsRes,
      debtsRes,
      recentTxnRes,
      categoriesRes,
      assetsRes,
    ] = await Promise.all([
      // All transactions for the month
      supabase
        .from('transactions')
        .select('type, amount, category_id, date')
        .eq('household_id', hid)
        .gte('date', startDate)
        .lt('date', endDate),
      // Account balances
      supabase
        .from('accounts')
        .select('id, name, type, balance')
        .eq('household_id', hid)
        .eq('is_active', true),
      // Budgets for the month
      supabase
        .from('budgets')
        .select('category_id, amount, categories(id, name, color, parent_id)')
        .eq('household_id', hid)
        .eq('month', month)
        .eq('year', year),
      // Overall budget
      supabase
        .from('overall_budgets')
        .select('amount')
        .eq('household_id', hid)
        .eq('month', month)
        .eq('year', year)
        .single(),
      // Bill reminders
      supabase
        .from('bill_reminders')
        .select('id, name, amount, due_day, categories(name, icon)')
        .eq('household_id', hid)
        .eq('is_active', true)
        .order('due_day', { ascending: true })
        .limit(5),
      // Savings goals
      supabase
        .from('savings_goals')
        .select('id, name, target_amount, current_amount, target_date, color, is_completed')
        .eq('household_id', hid)
        .eq('is_completed', false)
        .order('target_date', { ascending: true }),
      // Debts
      supabase
        .from('debts')
        .select('id, name, outstanding_balance, original_amount, minimum_payment')
        .eq('household_id', hid)
        .eq('is_active', true),
      // Recent transactions (last 10)
      supabase
        .from('transactions')
        .select('id, type, amount, date, description, merchant, categories(name, color, icon)')
        .eq('household_id', hid)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10),
      // All categories (for spending aggregation)
      supabase
        .from('categories')
        .select('id, name, color, parent_id')
        .eq('household_id', hid)
        .eq('is_active', true),
      // Assets
      supabase
        .from('assets')
        .select('id, name, type, current_value, purchase_price')
        .eq('household_id', hid)
        .eq('is_active', true),
    ]);

    const transactions = transactionsRes.data || [];
    const accounts = accountsRes.data || [];
    const budgets = budgetsRes.data || [];
    const categories = categoriesRes.data || [];

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const netSavings = totalIncome - totalExpenses;

    // Overall budget
    const overallBudgetAmount = overallBudgetRes.data?.amount
      ? Number(overallBudgetRes.data.amount)
      : null;
    const budgetRemaining = overallBudgetAmount ? overallBudgetAmount - totalExpenses : null;

    // Spending by category (aggregate sub-categories into parents)
    const childToParentMap = new Map<string, string>();
    for (const cat of categories) {
      if (cat.parent_id) childToParentMap.set(cat.id, cat.parent_id);
    }

    const spendingByParent = new Map<string, number>();
    for (const txn of transactions) {
      if (txn.type === 'expense' && txn.category_id) {
        const parentId = childToParentMap.get(txn.category_id) || txn.category_id;
        spendingByParent.set(parentId, (spendingByParent.get(parentId) || 0) + Number(txn.amount));
      }
    }

    // Budget vs actual (per category)
    const budgetVsActual = budgets.map((b) => {
      const spent = spendingByParent.get(b.category_id) || 0;
      const cat = b.categories as { id: string; name: string; color: string | null } | null;
      return {
        category: cat?.name || 'Unknown',
        color: cat?.color || '#888',
        budget: Number(b.amount),
        spent,
        percentage: Number(b.amount) > 0 ? Math.round((spent / Number(b.amount)) * 100) : 0,
      };
    });

    // Income vs Expenses chart data (daily for the month)
    const dailyData = new Map<string, { income: number; expense: number }>();
    for (const txn of transactions) {
      const day = txn.date;
      const existing = dailyData.get(day) || { income: 0, expense: 0 };
      if (txn.type === 'income') existing.income += Number(txn.amount);
      else existing.expense += Number(txn.amount);
      dailyData.set(day, existing);
    }

    // Bills with days remaining
    const today = new Date();
    const currentDay = today.getDate();
    const upcomingBills = (billsRes.data || []).map((bill) => {
      const daysLeft =
        bill.due_day >= currentDay
          ? bill.due_day - currentDay
          : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() -
            currentDay +
            bill.due_day;
      return { ...bill, daysLeft };
    });

    // Debt summary
    const totalDebt = (debtsRes.data || []).reduce(
      (sum, d) => sum + Number(d.outstanding_balance),
      0,
    );
    const totalMonthlyDebt = (debtsRes.data || []).reduce(
      (sum, d) => sum + Number(d.minimum_payment || 0),
      0,
    );

    // Asset summary
    const assetsList = assetsRes.data || [];
    const totalAssets = assetsList.reduce((sum, a) => sum + Number(a.current_value), 0);
    const totalAccounts = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    return NextResponse.json({
      data: {
        metrics: {
          totalIncome,
          totalExpenses,
          netSavings,
          overallBudget: overallBudgetAmount,
          budgetRemaining,
          totalDebt,
          totalMonthlyDebt,
          totalAssets,
          totalAccounts,
        },
        budgetVsActual,
        incomeVsExpense: { income: totalIncome, expense: totalExpenses },
        recentTransactions: recentTxnRes.data || [],
        upcomingBills,
        savingsGoals: savingsRes.data || [],
        accounts,
        debts: debtsRes.data || [],
        assets: assetsList,
        month,
        year,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
