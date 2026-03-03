import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;
    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, type, parent_id, color, icon, sort_order')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cats = categories || [];

    // Build parent name lookup
    const idToName = new Map(cats.map((c) => [c.id, c.name]));

    // Sort: parents first, then children grouped under their parent
    const parents = cats.filter((c) => !c.parent_id);
    const children = cats.filter((c) => c.parent_id);

    const rows: string[] = [];
    const headers = 'name,type,parent_category,color,icon,sort_order';
    rows.push(headers);

    for (const parent of parents) {
      rows.push(
        [
          csvEscape(parent.name),
          parent.type,
          '', // no parent
          parent.color || '',
          parent.icon || '',
          String(parent.sort_order),
        ].join(','),
      );

      // Add children of this parent
      const kids = children.filter((c) => c.parent_id === parent.id);
      for (const child of kids) {
        rows.push(
          [
            csvEscape(child.name),
            child.type,
            csvEscape(idToName.get(child.parent_id!) || ''),
            child.color || '',
            child.icon || '',
            String(child.sort_order),
          ].join(','),
        );
      }
    }

    // Add any orphan children (parent deactivated but child still active)
    const parentIds = new Set(parents.map((p) => p.id));
    const orphans = children.filter((c) => !parentIds.has(c.parent_id!));
    for (const orphan of orphans) {
      rows.push(
        [
          csvEscape(orphan.name),
          orphan.type,
          csvEscape(idToName.get(orphan.parent_id!) || ''),
          orphan.color || '',
          orphan.icon || '',
          String(orphan.sort_order),
        ].join(','),
      );
    }

    const csv = rows.join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="famfin-categories.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
