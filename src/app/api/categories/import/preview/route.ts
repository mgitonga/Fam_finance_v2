import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { categoryImportRowSchema, validateCategoryImportRow } from '@/lib/validations/category';
import { parseCSVLine } from '@/lib/csv';

type PreviewRow = {
  row: number;
  name: string;
  type: string;
  parent_category: string;
  color: string;
  icon: string;
  sort_order: number;
  action: 'create' | 'skip';
  errors: string[];
  valid: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;
    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have a header row and at least one data row' },
        { status: 400 },
      );
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const requiredHeaders = ['name', 'type'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 },
      );
    }

    // Load existing categories for duplicate detection
    const supabase = await createClient();
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true);

    const existingNames = new Set((existingCats || []).map((c) => c.name.toLowerCase()));

    // Track parent names defined earlier in the CSV for forward-reference validation
    const csvParentNames = new Set<string>();

    const parsed: PreviewRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = values[idx] || '';
      });

      // Parse with Zod
      const zodResult = categoryImportRowSchema.safeParse({
        name: rowData.name || '',
        type: rowData.type || '',
        parent_category: rowData.parent_category || '',
        color: rowData.color || undefined,
        icon: rowData.icon || undefined,
        sort_order: rowData.sort_order ? parseInt(rowData.sort_order) : 0,
      });

      if (!zodResult.success) {
        const fieldErrors = zodResult.error.flatten().fieldErrors;
        const errors = Object.entries(fieldErrors)
          .map(([field, msgs]) => `${field}: ${(msgs || []).join(', ')}`)
          .flat();

        parsed.push({
          row: i + 1,
          name: rowData.name || '',
          type: rowData.type || '',
          parent_category: rowData.parent_category || '',
          color: rowData.color || '',
          icon: rowData.icon || '',
          sort_order: parseInt(rowData.sort_order) || 0,
          action: 'skip',
          errors,
          valid: false,
        });
        continue;
      }

      const data = zodResult.data;

      // Validate against existing + CSV context
      const validation = validateCategoryImportRow(data, existingNames, csvParentNames);

      // Check for second-level nesting
      if (data.parent_category && validation.action === 'create') {
        const parentLower = data.parent_category.toLowerCase();
        // Check if parent itself has a parent (in existing DB)
        const parentCat = (existingCats || []).find((c) => c.name.toLowerCase() === parentLower);
        if (parentCat && parentCat.parent_id) {
          validation.errors.push(
            `"${data.parent_category}" is already a sub-category. Only one level of nesting allowed.`,
          );
        }
      }

      const isValid = validation.errors.length === 0;

      parsed.push({
        row: i + 1,
        name: data.name,
        type: data.type,
        parent_category: data.parent_category || '',
        color: data.color || '',
        icon: data.icon || '',
        sort_order: data.sort_order || 0,
        action: isValid ? validation.action : 'skip',
        errors: validation.errors,
        valid: isValid,
      });

      // Track this name for forward-reference by later rows
      if (!data.parent_category) {
        csvParentNames.add(data.name.toLowerCase());
      }
    }

    const toCreate = parsed.filter((r) => r.valid && r.action === 'create').length;
    const toSkip = parsed.filter((r) => r.valid && r.action === 'skip').length;
    const errorCount = parsed.filter((r) => !r.valid).length;

    return NextResponse.json({
      data: {
        rows: parsed,
        summary: {
          total: parsed.length,
          toCreate,
          toSkip,
          errors: errorCount,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
