import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { createCategorySchema } from '@/lib/validations/category';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    // Fetch all active categories (parents and children)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Organize into parent-child hierarchy
    const parents = data.filter((c) => !c.parent_id);
    const children = data.filter((c) => c.parent_id);

    const hierarchical = parents.map((parent) => ({
      ...parent,
      children: children.filter((child) => child.parent_id === parent.id),
    }));

    return NextResponse.json({ data: hierarchical });
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
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // If parent_id provided, verify it belongs to the same household
    if (parsed.data.parent_id) {
      const supabase = await createClient();
      const { data: parent } = await supabase
        .from('categories')
        .select('id')
        .eq('id', parsed.data.parent_id)
        .eq('household_id', auth.context.householdId)
        .single();

      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...parsed.data,
        household_id: auth.context.householdId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
