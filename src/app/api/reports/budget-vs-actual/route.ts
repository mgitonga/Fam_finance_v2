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

    const [txnRes, budgetRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('household_id', hid)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lt('date', endDate),
      supabase
        .from('budgets')
        .select('category_id, amount, categories(name, color, parent_id)')
        .eq('household_id', hid)
        .eq('month', month)
        .eq('year', year),
      supabase
        .from('categories')
        .select('id, parent_id')
        .eq('household_id', hid)
        .eq('is_active', true),
    ]);

    const categories = catRes.data || [];
    const childToParent = new Map<string, string>();
    for (const c of categories) {
      if (c.parent_id) childToParent.set(c.id, c.parent_id);
    }

    const spending = new Map<string, number>();
    for (const t of txnRes.data || []) {
      if (!t.category_id) continue;
      const parentId = childToParent.get(t.category_id) || t.category_id;
      spending.set(parentId, (spending.get(parentId) || 0) + Number(t.amount));
    }

    const data = (budgetRes.data || []).map((b) => {
      const cat = b.categories as { name: string; color: string | null } | null;
      return {
        category: cat?.name || 'Unknown',
        color: cat?.color || '#888',
        budget: Number(b.amount),
        actual: spending.get(b.category_id) || 0,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
