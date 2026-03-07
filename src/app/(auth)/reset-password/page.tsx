'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth';
import { resetPassword } from '@/lib/supabase/auth-actions';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Verify user has a valid session (from password recovery flow)
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // No session — reset link is expired or invalid
        router.replace('/forgot-password?error=expired');
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    const result = await resetPassword({ password: data.password });
    if (result?.error) {
      setServerError(result.error);
    }
    // On success, the server action redirects to /login?message=...
  }

  if (checkingSession) {
    return (
      <div
        className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        data-testid="reset-password-loading"
      >
        <div className="flex items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      data-testid="reset-password-page"
    >
      <div className="text-center">
        <h1 className="text-primary text-2xl font-bold">FamFin</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Set your new password</p>
      </div>

      {serverError && (
        <div
          className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          data-testid="reset-error"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="reset-form">
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            New Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="focus:border-primary focus:ring-primary block w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              placeholder="••••••••"
              data-testid="reset-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
          <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <li>• At least 8 characters</li>
            <li>• At least 1 number</li>
            <li>• At least 1 special character</li>
          </ul>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm New Password
          </label>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="focus:border-primary focus:ring-primary block w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              placeholder="••••••••"
              data-testid="reset-confirm-password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          data-testid="reset-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-primary inline-flex items-center text-sm hover:underline"
          data-testid="back-to-login"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
