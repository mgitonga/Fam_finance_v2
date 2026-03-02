'use client';

import { useState } from 'react';
import { formatKES } from '@/lib/utils';
import {
  Upload,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

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

type PreviewResult = {
  rows: ParsedRow[];
  summary: { total: number; valid: number; errors: number };
};

type ImportResult = {
  success: number;
  errors: number;
  errorDetails: { row: number; error: string }[];
  total: number;
};

export default function ImportPage() {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownloadTemplate() {
    const response = await fetch('/api/import/template');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'famfin-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Failed to parse CSV');
        return;
      }

      setPreview(json.data);
      setStep('preview');
    } catch {
      setError('Failed to upload file');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview) return;

    const validRows = preview.rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setError('No valid rows to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Import failed');
        return;
      }

      setResult(json.data);
      setStep('result');
    } catch {
      setError('Import failed');
    } finally {
      setLoading(false);
    }
  }

  function resetImport() {
    setStep('upload');
    setPreview(null);
    setResult(null);
    setError(null);
  }

  return (
    <div data-testid="import-page">
      <h1 className="text-2xl font-bold">Import Transactions</h1>
      <p className="mt-1 text-sm text-gray-500">Import transactions from a CSV file.</p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold">Step 1: Download Template</h2>
            <p className="mt-1 text-sm text-gray-500">
              Download the CSV template and fill in your transactions.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="mt-3 flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              data-testid="download-template"
            >
              <Download className="h-4 w-4" /> Download Template
            </button>
          </div>

          <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold">Step 2: Upload CSV</h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload your filled CSV file. Required columns: date, type, amount, category, account.
            </p>
            <label
              className="hover:border-primary hover:text-primary mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-gray-500 dark:border-gray-700"
              data-testid="csv-upload"
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" /> Parsing CSV...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-6 w-6" />
                  <span>Click to upload CSV file</span>
                </>
              )}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{preview.summary.total} rows</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{preview.summary.valid} valid</span>
            </div>
            {preview.summary.errors > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{preview.summary.errors} errors</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
            <table className="w-full text-sm" data-testid="preview-table">
              <thead>
                <tr className="border-b bg-gray-50 text-left dark:bg-gray-800">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Account</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.row}
                    className={`border-b ${!row.valid ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                    data-testid="preview-row"
                  >
                    <td className="px-3 py-2">{row.row}</td>
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div>
                          <XCircle className="h-4 w-4 text-red-500" />
                          {row.errors.map((err, i) => (
                            <p key={i} className="mt-1 text-xs text-red-500">
                              {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2 capitalize">{row.type}</td>
                    <td className="px-3 py-2">{formatKES(row.amount)}</td>
                    <td className="px-3 py-2">
                      {row.category}
                      {row.sub_category && ` > ${row.sub_category}`}
                    </td>
                    <td className="px-3 py-2">{row.account}</td>
                    <td className="px-3 py-2">{row.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirmImport}
              disabled={loading || preview.summary.valid === 0}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              data-testid="confirm-import"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import {preview.summary.valid} valid row{preview.summary.valid !== 1 ? 's' : ''}
            </button>
            <button onClick={resetImport} className="rounded-md border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>

          {preview.summary.errors > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {preview.summary.errors} row{preview.summary.errors !== 1 ? 's' : ''} with errors
                will be skipped. Only valid rows will be imported.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'result' && result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h2 className="text-lg font-semibold">Import Complete</h2>
                <p className="text-sm text-gray-500">
                  {result.success} of {result.total} transactions imported successfully.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-green-50 p-3 text-center dark:bg-green-950">
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-green-700 dark:text-green-400">Imported</p>
              </div>
              <div className="rounded-md bg-red-50 p-3 text-center dark:bg-red-950">
                <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                <p className="text-sm text-red-700 dark:text-red-400">Failed</p>
              </div>
              <div className="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-800">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>

            {result.errorDetails.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-red-600">Error Details:</h3>
                <ul className="mt-1 space-y-1">
                  {result.errorDetails.map((err, i) => (
                    <li key={i} className="text-xs text-red-500">
                      Row {err.row}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={resetImport}
            className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
