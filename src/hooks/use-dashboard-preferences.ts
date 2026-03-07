'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DashboardPreferences } from '@/lib/validations/dashboard';

const PREFERENCES_KEY = ['dashboard-preferences'];

export function useDashboardPreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: async (): Promise<DashboardPreferences | null> => {
      const res = await fetch('/api/users/me/dashboard-preferences');
      if (!res.ok) throw new Error('Failed to fetch dashboard preferences');
      const json = await res.json();
      return json.preferences;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — preferences rarely change
  });
}

export function useSaveDashboardPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: DashboardPreferences) => {
      const res = await fetch('/api/users/me/dashboard-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save preferences');
      }
      return (await res.json()).preferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCES_KEY, data);
    },
  });
}

export function useResetDashboardPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users/me/dashboard-preferences', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to reset preferences');
      return null;
    },
    onSuccess: () => {
      queryClient.setQueryData(PREFERENCES_KEY, null);
    },
  });
}
