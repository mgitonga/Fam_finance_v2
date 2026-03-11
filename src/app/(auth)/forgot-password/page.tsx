'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { forgotPassword } from '@/lib/supabase/auth-actions';
import { Logo } from '@/components/ui/logo';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);
    setSuccessMessage(null);
    const result = await forgotPassword(data);
    if (result?.error) {
      setServerError(result.error);
    }
    if (result?.success) {
      setSuccessMessage(result.success);
    }
  }

  return (
    <div
      className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      data-testid="forgot-password-page"
    >
      <div className="flex flex-col items-center gap-2">
        <Logo size={48} showText={false} />
        <h1 className="text-primary text-2xl font-bold">FamFin</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Reset your password</p>
      </div>

      {serverError && (
        <div
          className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          data-testid="forgot-error"
        >
          {serverError}
        </div>
      )}

      {successMessage && (
        <div
          className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950 dark:text-green-400"
          data-testid="forgot-success"
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="forgot-form">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
            placeholder="you@example.com"
            data-testid="forgot-email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          data-testid="forgot-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset link'
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
