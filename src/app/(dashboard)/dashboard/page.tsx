import { getUserProfile } from '@/lib/supabase/auth-actions';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div data-testid="dashboard-page">
      <h1 className="text-2xl font-bold">Welcome, {profile.name}!</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Your financial dashboard is coming soon. Core features will be built in upcoming sprints.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Role</p>
          <p className="mt-1 text-lg font-semibold capitalize">{profile.role}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Email</p>
          <p className="mt-1 text-lg font-semibold">{profile.email}</p>
        </div>
      </div>
    </div>
  );
}
