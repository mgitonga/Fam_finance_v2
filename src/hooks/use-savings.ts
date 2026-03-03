'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSavingsGoalInput, AddContributionInput } from '@/lib/validations/savings-debt';

const KEY = ['savings'];

export function useSavingsGoals() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/savings');
      if (!res.ok) throw new Error('Failed to fetch');
      return (await res.json()).data;
    },
  });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSavingsGoalInput) => {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/savings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useContributions(goalId: string) {
  return useQuery({
    queryKey: [...KEY, goalId, 'contributions'],
    queryFn: async () => {
      const res = await fetch(`/api/savings/${goalId}/contributions`);
      if (!res.ok) throw new Error('Failed to fetch');
      return (await res.json()).data;
    },
    enabled: !!goalId,
  });
}

export function useAddContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: AddContributionInput }) => {
      const res = await fetch(`/api/savings/${goalId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
