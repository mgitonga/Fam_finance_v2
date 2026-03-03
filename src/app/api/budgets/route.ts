import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { createBudgetSchema } from '@/lib/validations/budget';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const supabase = await createClient();

    // Get budgets for the month (budgets are set on parent categories)
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*, categories(id, name, color, type, parent_id)')
      .eq('household_id', auth.context.householdId)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get all categories to build parent → children map
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, color, type, parent_id')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true);

    const childrenMap = new Map<string, typeof allCategories>();
    for (const cat of allCategories || []) {
      if (cat.parent_id) {
        const existing = childrenMap.get(cat.parent_id) || [];
        existing.push(cat);
        childrenMap.set(cat.parent_id, existing);
      }
    }

    // Get spending for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data: spending } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('household_id', auth.context.householdId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lt('date', endDate);

    // Aggregate spending by category_id
    const spendingMap = new Map<string, number>();
    (spending || []).forEach((tx) => {
      const current = spendingMap.get(tx.category_id) || 0;
      spendingMap.set(tx.category_id, current + Number(tx.amount));
    });

    // For each budget (parent category), aggregate spending from parent + all children
    const budgetsWithSpending = (budgets || []).map((budget) => {
      const parentId = budget.category_id;
      const children = childrenMap.get(parentId) || [];
      const childIds = children.map((c) => c.id);

      // Spending directly on parent
      const directSpent = spendingMap.get(parentId) || 0;

      // Spending on sub-categories
      const subCategoryBreakdown = children.map((child) => ({
        id: child.id,
        name: child.name,
        color: child.color,
        spent: spendingMap.get(child.id) || 0,
      }));

      // Total = parent direct + all children
      const totalSpent =
        directSpent + childIds.reduce((sum, id) => sum + (spendingMap.get(id) || 0), 0);

      return {
        ...budget,
        spent: totalSpent,
        direct_spent: directSpent,
        sub_category_breakdown: subCategoryBreakdown,
      };
    });

    return NextResponse.json({ data: budgetsWithSpending });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const parsed = createBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify category is a parent (no parent_id) — budgets only on parent categories
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('id', parsed.data.category_id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.parent_id) {
      return NextResponse.json(
        {
          error: `"${category.name}" is a sub-category. Budgets can only be set on parent categories. Sub-category spending rolls up automatically.`,
        },
        { status: 400 },
      );
    }

    // Upsert budget (update if exists for same category/month/year)
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        {
          ...parsed.data,
          household_id: auth.context.householdId,
        },
        {
          onConflict: 'household_id,category_id,month,year',
        },
      )
      .select('*, categories(name, color, type)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
