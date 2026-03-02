'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteUserSchema, type InviteUserInput } from '@/lib/validations/user';
import { useAuth } from '@/providers/auth-provider';
import { Loader2, Plus, X, Shield, User } from 'lucide-react';

type HouseholdUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

export default function UsersSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const json = await response.json();
      return json.data as HouseholdUser[];
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await fetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
  });

  async function onInvite(data: InviteUserInput) {
    setMessage(null);
    try {
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: json.error || 'Failed to send invite' });
        return;
      }

      setMessage({ type: 'success', text: json.message });
      setShowInvite(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await changeRole.mutateAsync({ id: userId, role: newRole });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change role',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading users...
      </div>
    );
  }

  return (
    <div data-testid="users-settings">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Household Members</h2>
          <p className="mt-1 text-sm text-gray-500">Manage who has access to your household.</p>
        </div>
        {!showInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
            data-testid="invite-user-btn"
          >
            <Plus className="h-4 w-4" /> Invite Member
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {showInvite && (
        <form
          onSubmit={handleSubmit(onInvite)}
          className="mt-4 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          data-testid="invite-form"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Invite New Member</h3>
            <button
              type="button"
              onClick={() => {
                setShowInvite(false);
                reset();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="invite-name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="invite-name"
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="Jane Doe"
                data-testid="invite-name"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="jane@example.com"
                data-testid="invite-email"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            The user will be invited as a <strong>Contributor</strong>. You can change their role
            after they join.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              data-testid="invite-submit"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInvite(false);
                reset();
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {users?.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            data-testid="user-row"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                {member.role === 'admin' ? (
                  <Shield className="text-primary h-5 w-5" />
                ) : (
                  <User className="text-primary h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {member.name}
                  {member.id === user?.id && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            </div>
            <div>
              {member.id === user?.id ? (
                <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium capitalize">
                  {member.role}
                </span>
              ) : (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="rounded-md border px-2 py-1 text-sm capitalize dark:border-gray-700 dark:bg-gray-800"
                  data-testid="role-select"
                >
                  <option value="admin">Admin</option>
                  <option value="contributor">Contributor</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
