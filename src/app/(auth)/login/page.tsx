'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { login } from '@/lib/supabase/auth-actions';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const successMessage = searchParams.get('message');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const result = await login(data);
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <div
      className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      data-testid="login-page"
    >
      <div className="text-center">
        <h1 className="text-primary text-2xl font-bold">FamFin</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to your account</p>
      </div>

      {successMessage && (
        <div
          className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950 dark:text-green-400"
          data-testid="login-success"
        >
          {successMessage}
        </div>
      )}

      {serverError && (
        <div
          className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          data-testid="login-error"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
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
            data-testid="login-email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="focus:border-primary focus:ring-primary block w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              placeholder="••••••••"
              data-testid="login-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          data-testid="login-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="space-y-2 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-primary hover:underline"
          data-testid="forgot-password-link"
        >
          Forgot your password?
        </Link>
        <p className="text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-primary hover:underline"
            data-testid="register-link"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
