import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as KES currency.
 * @example formatKES(1500) => "KES 1,500.00"
 */
export function formatKES(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `KES ${formatted}`;
}

/**
 * Format a date string or Date object to DD/MM/YYYY.
 * @example formatDate('2026-01-15') => "15/01/2026"
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}
