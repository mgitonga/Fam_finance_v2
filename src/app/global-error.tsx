'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && <p className="mt-2 text-xs text-gray-400">Error ID: {error.digest}</p>}
            <button
              onClick={reset}
              className="bg-primary hover:bg-primary/90 mt-4 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
