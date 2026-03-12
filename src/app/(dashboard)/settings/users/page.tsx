'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteUserSchema, type InviteUserInput } from '@/lib/validations/user';
import { useAuth } from '@/providers/auth-provider';
import {
  Loader2,
  Plus,
  X,
  Shield,
  User,
  Clock,
  MailIcon,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';

type HouseholdUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

type HouseholdInvite = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  invited_by: string;
  invited_by_name: string;
  invited_at: string;
  expires_at: string;
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function timeUntil(dateStr: string): string {
  const seconds = Math.floor((new Date(dateStr).getTime() - Date.now()) / 1000);
  if (seconds <= 0) return 'Expired';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function UsersSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<HouseholdUser | null>(null);
  const [confirmCancelInvite, setConfirmCancelInvite] = useState<HouseholdInvite | null>(null);

  // Fetch household members
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const json = await response.json();
      return json.data as HouseholdUser[];
    },
  });

  // Determine if current user is admin
  const currentDbUser = users?.find((u) => u.id === user?.id);
  const isAdmin = currentDbUser?.role === 'admin';

  // Fetch pending invites (admin only)
  const { data: invites } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const response = await fetch('/api/invites');
      if (!response.ok) throw new Error('Failed to fetch invites');
      const json = await response.json();
      return json.data as HouseholdInvite[];
    },
    enabled: isAdmin,
  });

  // Filter to show only pending/expired invites (not accepted/cancelled old ones)
  const activeInvites = invites?.filter((i) => i.status === 'pending' || i.status === 'expired');

  // Mutations
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

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: data.message || 'Member removed' });
      setConfirmRemove(null);
    },
    onError: (err) => {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to remove member',
      });
      setConfirmRemove(null);
    },
  });

  const cancelInvite = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invites/${id}/cancel`, {
        method: 'PUT',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel invite');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      setMessage({ type: 'success', text: 'Invite cancelled' });
      setConfirmCancelInvite(null);
    },
    onError: (err) => {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to cancel invite',
      });
      setConfirmCancelInvite(null);
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invites/${id}/resend`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invite');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      setMessage({ type: 'success', text: data.message || 'Invite resent' });
    },
    onError: (err) => {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to resend invite',
      });
    },
  });

  const {
    register: registerInvite,
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
      queryClient.invalidateQueries({ queryKey: ['invites'] });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Household Members</h2>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'Manage who has access to your household.'
              : 'View members of your household.'}
          </p>
        </div>
        {isAdmin && !showInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
            data-testid="invite-user-btn"
          >
            <Plus className="h-4 w-4" /> Invite Member
          </button>
        )}
      </div>

      {/* Message banner */}
      {message && (
        <div
          className={`mt-4 flex items-center justify-between rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Invite form (admin only) */}
      {isAdmin && showInvite && (
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
                {...registerInvite('name')}
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
                {...registerInvite('email')}
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

      {/* Section A: Active Members */}
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
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" /> Joined {timeAgo(member.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.id === user?.id || !isAdmin ? (
                <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium capitalize">
                  {member.role}
                </span>
              ) : (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="rounded-md border px-2 py-1 text-sm capitalize dark:border-gray-700 dark:bg-gray-800"
                    data-testid="role-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="contributor">Contributor</option>
                  </select>
                  <button
                    onClick={() => setConfirmRemove(member)}
                    className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    title="Remove member"
                    data-testid="remove-user-btn"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Section B: Pending Invites (admin only) */}
      {isAdmin && activeInvites && activeInvites.length > 0 && (
        <div className="mt-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <MailIcon className="h-4 w-4" /> Pending Invites
          </h3>
          <div className="mt-2 space-y-2">
            {activeInvites.map((invite) => {
              const isExpired = invite.status === 'expired';
              return (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${
                    isExpired ? 'opacity-60' : ''
                  }`}
                  data-testid="invite-row"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isExpired
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'bg-yellow-50 dark:bg-yellow-950'
                      }`}
                    >
                      <MailIcon
                        className={`h-5 w-5 ${
                          isExpired ? 'text-gray-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{invite.name}</p>
                      <p className="text-sm text-gray-500">{invite.email}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                        <span>Sent {timeAgo(invite.invited_at)}</span>
                        <span>·</span>
                        {isExpired ? (
                          <span className="font-medium text-red-400">Expired</span>
                        ) : (
                          <span>Expires in {timeUntil(invite.expires_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isExpired
                          ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                      }`}
                    >
                      {invite.status}
                    </span>
                    <button
                      onClick={() => resendInvite.mutate(invite.id)}
                      disabled={resendInvite.isPending}
                      className="rounded-md p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:hover:bg-blue-950"
                      title="Resend invite"
                      data-testid="resend-invite-btn"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${resendInvite.isPending ? 'animate-spin' : ''}`}
                      />
                    </button>
                    {!isExpired && (
                      <button
                        onClick={() => setConfirmCancelInvite(invite)}
                        className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        title="Cancel invite"
                        data-testid="cancel-invite-btn"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="mx-4 w-full max-w-sm rounded-lg border bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            data-testid="confirm-remove-dialog"
          >
            <h3 className="text-lg font-semibold">Remove Member</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Remove <strong>{confirmRemove.name}</strong> from this household? They will lose
              access to all household data.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMember.mutate(confirmRemove.id)}
                disabled={removeMember.isPending}
                className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                data-testid="confirm-remove-btn"
              >
                {removeMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Invite Dialog */}
      {confirmCancelInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="mx-4 w-full max-w-sm rounded-lg border bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            data-testid="confirm-cancel-invite-dialog"
          >
            <h3 className="text-lg font-semibold">Cancel Invite</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Cancel invite to <strong>{confirmCancelInvite.email}</strong>? They will not be able
              to join using the existing invite link.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmCancelInvite(null)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Keep Invite
              </button>
              <button
                onClick={() => cancelInvite.mutate(confirmCancelInvite.id)}
                disabled={cancelInvite.isPending}
                className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                data-testid="confirm-cancel-invite-btn"
              >
                {cancelInvite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
