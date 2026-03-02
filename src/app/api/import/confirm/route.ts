import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

type ImportRow = {
  date: string;
  type: string;
  amount: number;
  category: string;
  sub_category?: string;
  account: string;
  description?: string;
  merchant?: string;
  payment_method?: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const rows: ImportRow[] = body.rows;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
    }

    const supabase = await createClient();

    // Load categories and accounts for ID lookup
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true);

    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name, balance')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true);

    const categoryMap = new Map((categories || []).map((c) => [c.name.toLowerCase(), c]));
    const accountMap = new Map((accounts || []).map((a) => [a.name.toLowerCase(), a]));

    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];

    // Track balance changes per account
    const balanceChanges = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Resolve category
      let categoryId: string | null = null;
      const subCat = row.sub_category?.toLowerCase();
      const mainCat = row.category?.toLowerCase();

      if (subCat) {
        const match = categoryMap.get(subCat);
        if (match) categoryId = match.id;
      }
      if (!categoryId && mainCat) {
        const match = categoryMap.get(mainCat);
        if (match) categoryId = match.id;
      }

      // Resolve account
      const accountMatch = accountMap.get(row.account?.toLowerCase());
      const accountId = accountMatch?.id;

      if (!categoryId || !accountId) {
        errorCount++;
        errors.push({
          row: i + 1,
          error: !categoryId
            ? `Category not found: ${row.category}`
            : `Account not found: ${row.account}`,
        });
        continue;
      }

      const { error: insertError } = await supabase.from('transactions').insert({
        household_id: auth.context.householdId,
        user_id: auth.context.userId,
        type: row.type,
        amount: row.amount,
        date: row.date,
        category_id: categoryId,
        account_id: accountId,
        description: row.description || null,
        merchant: row.merchant || null,
        payment_method: row.payment_method || null,
        notes: row.notes || null,
      });

      if (insertError) {
        errorCount++;
        errors.push({ row: i + 1, error: insertError.message });
      } else {
        successCount++;
        // Track balance change
        const change = row.type === 'income' ? row.amount : -row.amount;
        balanceChanges.set(accountId, (balanceChanges.get(accountId) || 0) + change);
      }
    }

    // Apply accumulated balance changes
    for (const [accountId, change] of balanceChanges.entries()) {
      const account = (accounts || []).find((a) => a.id === accountId);
      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: account.balance + change })
          .eq('id', accountId);
      }
    }

    return NextResponse.json({
      data: {
        success: successCount,
        errors: errorCount,
        errorDetails: errors,
        total: rows.length,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
