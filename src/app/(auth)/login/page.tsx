export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center" data-testid="login-page">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">FamFin</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>
        <p className="text-center text-sm text-gray-500">Authentication coming in Sprint 1.</p>
      </div>
    </div>
  );
}
