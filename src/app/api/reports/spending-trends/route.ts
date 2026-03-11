import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');
    const categoryId = searchParams.get('category');

    const supabase = await createClient();
    const hid = auth.context.householdId;

    // Get categories to map children to parents
    const { data: allCats } = await supabase
      .from('categories')
      .select('id, name, color, parent_id')
      .eq('household_id', hid)
      .eq('is_active', true);

    const childToParent = new Map<string, string>();
    for (const c of allCats || []) {
      if (c.parent_id) childToParent.set(c.id, c.parent_id);
    }

    // Get parent categories for the legend
    const parentCats = (allCats || []).filter((c) => !c.parent_id);

    const now = new Date();
    const monthLabels: string[] = [];
    const monthData: Record<string, Record<string, number>> = {};

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      const endDate = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const label = `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]}`;

      monthLabels.push(label);

      let query = supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('household_id', hid)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lt('date', endDate);

      if (categoryId) {
        // Get this category + its children
        const childIds = (allCats || []).filter((c) => c.parent_id === categoryId).map((c) => c.id);
        const allIds = [categoryId, ...childIds];
        query = query.in('category_id', allIds);
      }

      const { data: txns } = await query;

      const byParent: Record<string, number> = {};
      for (const t of txns || []) {
        if (!t.category_id) continue;
        const parentId = childToParent.get(t.category_id) || t.category_id;
        byParent[parentId] = (byParent[parentId] || 0) + Number(t.amount);
      }
      monthData[label] = byParent;
    }

    // Build chart data: one entry per month with a key per category
    const chartData = monthLabels.map((label) => {
      const entry: Record<string, string | number> = { month: label };
      for (const cat of parentCats) {
        entry[cat.name] = monthData[label]?.[cat.id] || 0;
      }
      return entry;
    });

    const categoryColors = parentCats.map((c) => ({ name: c.name, color: c.color || '#888' }));

    return NextResponse.json({ data: { chartData, categories: categoryColors } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
