'use client';

import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12" data-testid="error-boundary">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={reset}
            className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
