/**
 * Parse a single CSV line, handling quoted fields.
 */
export function parseCSVLine(line: string): string[] {
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

/**
 * Parse a date string in DD/MM/YYYY or YYYY-MM-DD format to ISO date string.
 * Returns null if the format is invalid.
 */
export function parseDateString(dateStr: string): string | null {
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const iso = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return dateStr;
  return null;
}

/**
 * Validate uploaded file for receipt (type and size checks).
 */
export function validateReceiptFile(file: { type: string; size: number }): string | null {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Allowed: JPG, PNG, PDF';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 5MB';
  }
  return null;
}
