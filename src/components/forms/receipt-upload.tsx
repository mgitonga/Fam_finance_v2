'use client';

import { useState } from 'react';
import { Upload, Loader2, X, FileImage, FileText } from 'lucide-react';

interface ReceiptUploadProps {
  transactionId?: string;
  existingUrl?: string | null;
  onUpload?: (path: string) => void;
}

export function ReceiptUpload({ transactionId, existingUrl, onUpload }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(existingUrl || null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (transactionId) {
        formData.append('transaction_id', transactionId);
      }

      const response = await fetch('/api/transactions/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Upload failed');
        return;
      }

      setUploadedPath(json.data.path);
      onUpload?.(json.data.path);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function clearReceipt() {
    setUploadedPath(null);
    setError(null);
  }

  const isImage = uploadedPath && /\.(jpg|jpeg|png)$/i.test(uploadedPath);

  return (
    <div data-testid="receipt-upload">
      {uploadedPath ? (
        <div className="flex items-center gap-3 rounded-md border p-3 dark:border-gray-700">
          {isImage ? (
            <FileImage className="h-5 w-5 text-blue-500" />
          ) : (
            <FileText className="h-5 w-5 text-red-500" />
          )}
          <span className="flex-1 truncate text-sm">{uploadedPath.split('/').pop()}</span>
          <button
            type="button"
            onClick={clearReceipt}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Remove receipt"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      ) : (
        <label
          className="hover:border-primary hover:text-primary flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-gray-500 dark:border-gray-700"
          data-testid="receipt-upload-label"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload receipt (JPG, PNG, PDF — max 5MB)
            </>
          )}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
