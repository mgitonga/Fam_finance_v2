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

    const [txnRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('household_id', hid)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lt('date', endDate),
      supabase
        .from('categories')
        .select('id, name, color, parent_id')
        .eq('household_id', hid)
        .eq('is_active', true),
    ]);

    const transactions = txnRes.data || [];
    const categories = catRes.data || [];

    // Map child → parent
    const childToParent = new Map<string, string>();
    for (const c of categories) {
      if (c.parent_id) childToParent.set(c.id, c.parent_id);
    }

    // Aggregate by parent category
    const spending = new Map<string, number>();
    for (const t of transactions) {
      const parentId = childToParent.get(t.category_id) || t.category_id;
      spending.set(parentId, (spending.get(parentId) || 0) + Number(t.amount));
    }

    const breakdown = Array.from(spending.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return { category: cat?.name || 'Other', color: cat?.color || '#888', amount };
      })
      .sort((a, b) => b.amount - a.amount);

    const total = breakdown.reduce((s, b) => s + b.amount, 0);
    const withPercentage = breakdown.map((b) => ({
      ...b,
      percentage: total > 0 ? Math.round((b.amount / total) * 100) : 0,
    }));

    return NextResponse.json({ data: withPercentage });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
