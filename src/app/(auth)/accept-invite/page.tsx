'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { acceptInviteSchema, type AcceptInviteInput } from '@/lib/validations/user';
import { acceptInvite } from '@/lib/supabase/auth-actions';
import { useAuth } from '@/providers/auth-provider';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const { user, loading: authLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const inviteName = user?.user_metadata?.name || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Pre-fill name from invite metadata once user is available
  useEffect(() => {
    if (inviteName) {
      setValue('name', inviteName);
    }
  }, [inviteName, setValue]);

  async function onSubmit(data: AcceptInviteInput) {
    setServerError(null);
    const result = await acceptInvite({
      name: data.name,
      password: data.password,
    });
    if (result?.error) {
      setServerError(result.error);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-primary text-2xl font-bold">FamFin</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Invalid or expired invite link.
          </p>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Please use the link from your invite email or{' '}
          <Link href="/login" className="text-primary hover:underline">
            sign in
          </Link>{' '}
          if you already have an account.
        </p>
      </div>
    );
  }

  if (!user.user_metadata?.household_id) {
    return (
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-primary text-2xl font-bold">FamFin</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No household invitation found.
          </p>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          This link is not associated with a household invite. Please check with your household
          admin or{' '}
          <Link href="/register" className="text-primary hover:underline">
            create a new household
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      data-testid="accept-invite-page"
    >
      <div className="text-center">
        <h1 className="text-primary text-2xl font-bold">FamFin</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          You&apos;ve been invited to join a household
        </p>
      </div>

      {serverError && (
        <div
          className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          data-testid="accept-invite-error"
        >
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="accept-invite-form"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
            data-testid="accept-invite-name"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Set Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="focus:border-primary focus:ring-primary block w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              placeholder="Min 8 chars, 1 number, 1 special"
              data-testid="accept-invite-password"
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
            data-testid="accept-invite-confirm-password"
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
          data-testid="accept-invite-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining household...
            </>
          ) : (
            'Join Household'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
