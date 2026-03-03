import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-primary text-6xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="bg-primary hover:bg-primary/90 mt-6 inline-block rounded-md px-6 py-2 text-sm font-medium text-white"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
