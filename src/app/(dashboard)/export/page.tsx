'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ExportPage() {
  const now = new Date();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pdfMonth, setPdfMonth] = useState(now.getMonth() + 1);
  const [pdfYear, setPdfYear] = useState(now.getFullYear());
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleCsvExport() {
    setDownloading('csv');
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const response = await fetch(`/api/export/csv?${params.toString()}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `famfin-transactions.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }

  async function handlePdfExport() {
    setDownloading('pdf');
    try {
      const response = await fetch(`/api/export/pdf?month=${pdfMonth}&year=${pdfYear}`);
      const html = await response.text();

      // Open in new window for printing as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        // Auto-trigger print dialog after render
        printWindow.onload = () => printWindow.print();
      }
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div data-testid="export-page">
      <h1 className="text-2xl font-bold">Export Data</h1>
      <p className="mt-1 text-sm text-gray-500">Download your financial data as CSV or PDF.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* CSV Export */}
        <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">CSV Export</h2>
              <p className="text-sm text-gray-500">Export transactions to a spreadsheet file</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">Leave empty to export all transactions.</p>
            <button
              onClick={handleCsvExport}
              disabled={downloading === 'csv'}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              data-testid="export-csv-btn"
            >
              {downloading === 'csv' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download CSV
            </button>
          </div>
        </div>

        {/* PDF Export */}
        <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">PDF Report</h2>
              <p className="text-sm text-gray-500">Generate a monthly summary report</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Month</label>
                <select
                  value={pdfMonth}
                  onChange={(e) => setPdfMonth(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Year</label>
                <select
                  value={pdfYear}
                  onChange={(e) => setPdfYear(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Opens a printable report. Use your browser&apos;s print dialog to save as PDF.
            </p>
            <button
              onClick={handlePdfExport}
              disabled={downloading === 'pdf'}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              data-testid="export-pdf-btn"
            >
              {downloading === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Generate PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
