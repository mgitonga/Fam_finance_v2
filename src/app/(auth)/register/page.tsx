'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { register as registerUser } from '@/lib/supabase/auth-actions';
import { Logo } from '@/components/ui/logo';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      householdName: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      householdName: data.householdName,
    });
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <div
      className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      data-testid="register-page"
    >
      <div className="flex flex-col items-center gap-2">
        <Logo size={48} showText={false} />
        <h1 className="text-primary text-2xl font-bold">FamFin</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Create your account</p>
      </div>

      {serverError && (
        <div
          className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          data-testid="register-error"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="register-form">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
            placeholder="John Doe"
            data-testid="register-name"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

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
            data-testid="register-email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="householdName" className="block text-sm font-medium">
            Household Name
          </label>
          <input
            id="householdName"
            type="text"
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
            placeholder="The Smith Family"
            data-testid="register-household"
            {...register('householdName')}
          />
          {errors.householdName && (
            <p className="mt-1 text-xs text-red-500">{errors.householdName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="focus:border-primary focus:ring-primary block w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              placeholder="Min 8 chars, 1 number, 1 special"
              data-testid="register-password"
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
            placeholder="••••••••"
            data-testid="register-confirm-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          data-testid="register-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline" data-testid="login-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
