import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

type ParsedRow = {
  row: number;
  date: string;
  type: string;
  amount: number;
  category: string;
  sub_category: string;
  account: string;
  description: string;
  merchant: string;
  payment_method: string;
  notes: string;
  errors: string[];
  valid: boolean;
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDateString(dateStr: string): string | null {
  // Accept DD/MM/YYYY or YYYY-MM-DD
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const iso = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return dateStr;
  return null;
}

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
    const requiredHeaders = ['date', 'type', 'amount', 'category', 'account'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 },
      );
    }

    // Load categories and accounts for matching
    const supabase = await createClient();
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true);

    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true);

    const categoryMap = new Map((categories || []).map((c) => [c.name.toLowerCase(), c]));
    const accountMap = new Map((accounts || []).map((a) => [a.name.toLowerCase(), a]));

    // Parse rows
    const parsed: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const errors: string[] = [];

      // Validate date
      const parsedDate = parseDateString(row.date);
      if (!parsedDate) errors.push('Invalid date format (use DD/MM/YYYY or YYYY-MM-DD)');

      // Validate type
      const type = row.type?.toLowerCase();
      if (type !== 'income' && type !== 'expense') {
        errors.push('Type must be "income" or "expense"');
      }

      // Validate amount
      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      }

      // Match category — prefer sub_category, fall back to category
      // Parent categories with children are not selectable
      const categoryName = row.category?.toLowerCase();
      const subCategoryName = row.sub_category?.toLowerCase();
      let matchedCategory:
        | (typeof categoryMap extends Map<string, infer V> ? V : never)
        | undefined;

      // First try sub_category (most specific)
      if (subCategoryName) {
        matchedCategory = categoryMap.get(subCategoryName);
      }

      // Fall back to category name
      if (!matchedCategory && categoryName) {
        const candidate = categoryMap.get(categoryName);
        if (candidate) {
          // Check if this category has children — if so, reject it
          const hasChildren = (categories || []).some((c) => c.parent_id === candidate.id);
          if (hasChildren) {
            errors.push(
              `"${row.category}" is a parent category with sub-categories. Please specify a sub-category.`,
            );
          } else {
            matchedCategory = candidate;
          }
        } else {
          errors.push(`Category "${row.category}" not found`);
        }
      }

      if (!matchedCategory && !errors.some((e) => e.includes('ategory'))) {
        errors.push('No category specified');
      }

      // Match account
      const accountName = row.account?.toLowerCase();
      const matchedAccount = accountMap.get(accountName);
      if (!matchedAccount && accountName) {
        errors.push(`Account "${row.account}" not found`);
      }

      // Validate payment method
      const validMethods = ['cash', 'card', 'mobile_money', 'bank_transfer', 'other', ''];
      if (row.payment_method && !validMethods.includes(row.payment_method)) {
        errors.push(`Invalid payment method "${row.payment_method}"`);
      }

      parsed.push({
        row: i + 1,
        date: parsedDate || row.date,
        type: type || row.type,
        amount: amount || 0,
        category: row.category || '',
        sub_category: row.sub_category || '',
        account: row.account || '',
        description: row.description || '',
        merchant: row.merchant || '',
        payment_method: row.payment_method || '',
        notes: row.notes || '',
        errors,
        valid: errors.length === 0,
      });
    }

    const validCount = parsed.filter((r) => r.valid).length;
    const errorCount = parsed.filter((r) => !r.valid).length;

    return NextResponse.json({
      data: {
        rows: parsed,
        summary: {
          total: parsed.length,
          valid: validCount,
          errors: errorCount,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
