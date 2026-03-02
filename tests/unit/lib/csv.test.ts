import { describe, it, expect } from 'vitest';
import { parseCSVLine, parseDateString, validateReceiptFile } from '@/lib/csv';

describe('parseCSVLine', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('trims whitespace from values', () => {
    expect(parseCSVLine(' hello , world , test ')).toEqual(['hello', 'world', 'test']);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCSVLine('"hello, world",test,value')).toEqual(['hello, world', 'test', 'value']);
  });

  it('handles empty fields', () => {
    expect(parseCSVLine('a,,c,,')).toEqual(['a', '', 'c', '', '']);
  });

  it('handles single value', () => {
    expect(parseCSVLine('hello')).toEqual(['hello']);
  });

  it('handles empty line', () => {
    expect(parseCSVLine('')).toEqual(['']);
  });
});

describe('parseDateString', () => {
  it('parses DD/MM/YYYY format', () => {
    expect(parseDateString('15/01/2026')).toBe('2026-01-15');
  });

  it('parses D/M/YYYY format with single digits', () => {
    expect(parseDateString('5/3/2026')).toBe('2026-03-05');
  });

  it('accepts YYYY-MM-DD format', () => {
    expect(parseDateString('2026-01-15')).toBe('2026-01-15');
  });

  it('returns null for invalid format', () => {
    expect(parseDateString('Jan 15, 2026')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseDateString('')).toBeNull();
  });

  it('returns null for partial date', () => {
    expect(parseDateString('15/01')).toBeNull();
  });
});

describe('validateReceiptFile', () => {
  it('accepts JPEG files under 5MB', () => {
    expect(validateReceiptFile({ type: 'image/jpeg', size: 1024 * 1024 })).toBeNull();
  });

  it('accepts PNG files under 5MB', () => {
    expect(validateReceiptFile({ type: 'image/png', size: 2 * 1024 * 1024 })).toBeNull();
  });

  it('accepts PDF files under 5MB', () => {
    expect(validateReceiptFile({ type: 'application/pdf', size: 3 * 1024 * 1024 })).toBeNull();
  });

  it('rejects files over 5MB', () => {
    const result = validateReceiptFile({ type: 'image/jpeg', size: 6 * 1024 * 1024 });
    expect(result).toContain('too large');
  });

  it('rejects exactly 5MB boundary+ files', () => {
    const result = validateReceiptFile({
      type: 'image/jpeg',
      size: 5 * 1024 * 1024 + 1,
    });
    expect(result).toContain('too large');
  });

  it('accepts exactly 5MB files', () => {
    expect(validateReceiptFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 })).toBeNull();
  });

  it('rejects GIF files', () => {
    const result = validateReceiptFile({ type: 'image/gif', size: 1024 });
    expect(result).toContain('Invalid file type');
  });

  it('rejects SVG files', () => {
    const result = validateReceiptFile({ type: 'image/svg+xml', size: 1024 });
    expect(result).toContain('Invalid file type');
  });

  it('rejects arbitrary file types', () => {
    const result = validateReceiptFile({ type: 'application/zip', size: 1024 });
    expect(result).toContain('Invalid file type');
  });
});
