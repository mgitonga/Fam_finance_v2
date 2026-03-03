import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

type ImportRow = {
  name: string;
  type: string;
  parent_category?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
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
    const hid = auth.context.householdId;

    // Load existing categories for duplicate check + parent lookup
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('household_id', hid)
      .eq('is_active', true);

    const existingByName = new Map((existingCats || []).map((c) => [c.name.toLowerCase(), c]));

    // Track newly created categories for parent resolution within the import
    const newlyCreated = new Map<string, string>(); // lowercase name → id

    let created = 0;
    let skipped = 0;
    let errorCount = 0;
    const errorDetails: { row: number; error: string }[] = [];

    // Process in order (parents first, then children)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nameLower = row.name.toLowerCase();

      // Skip if already exists
      if (existingByName.has(nameLower)) {
        skipped++;
        continue;
      }

      // Skip if already created in this import batch
      if (newlyCreated.has(nameLower)) {
        skipped++;
        continue;
      }

      // Resolve parent_id
      let parentId: string | null = null;
      if (row.parent_category) {
        const parentLower = row.parent_category.toLowerCase();
        const existingParent = existingByName.get(parentLower);
        const newParent = newlyCreated.get(parentLower);

        if (existingParent) {
          // Check for second-level nesting
          if (existingParent.parent_id) {
            errorCount++;
            errorDetails.push({
              row: i + 1,
              error: `"${row.parent_category}" is a sub-category. Only one level of nesting allowed.`,
            });
            continue;
          }
          parentId = existingParent.id;
        } else if (newParent) {
          parentId = newParent;
        } else {
          errorCount++;
          errorDetails.push({
            row: i + 1,
            error: `Parent category "${row.parent_category}" not found`,
          });
          continue;
        }
      }

      // Insert the category
      const { data: inserted, error: insertError } = await supabase
        .from('categories')
        .insert({
          household_id: hid,
          name: row.name,
          type: row.type,
          parent_id: parentId,
          color: row.color || null,
          icon: row.icon || null,
          sort_order: row.sort_order || 0,
        })
        .select('id')
        .single();

      if (insertError) {
        errorCount++;
        errorDetails.push({ row: i + 1, error: insertError.message });
      } else {
        created++;
        newlyCreated.set(nameLower, inserted.id);
      }
    }

    return NextResponse.json({
      data: {
        created,
        skipped,
        errors: errorCount,
        errorDetails,
        total: rows.length,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
