'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateBudgetInput } from '@/lib/validations/budget';

const BUDGETS_KEY = ['budgets'];

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: [...BUDGETS_KEY, month, year],
    queryFn: async () => {
      const response = await fetch(`/api/budgets?month=${month}&year=${year}`);
      if (!response.ok) throw new Error('Failed to fetch budgets');
      const json = await response.json();
      return json.data;
    },
  });
}

export function useOverallBudget(month: number, year: number) {
  return useQuery({
    queryKey: [...BUDGETS_KEY, 'overall', month, year],
    queryFn: async () => {
      const response = await fetch(`/api/budgets/overall?month=${month}&year=${year}`);
      if (!response.ok) throw new Error('Failed to fetch overall budget');
      const json = await response.json();
      return json.data;
    },
  });
}

export function useSetBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBudgetInput) => {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set budget');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}

export function useSetOverallBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: number; month: number; year: number }) => {
      const response = await fetch('/api/budgets/overall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set overall budget');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}

export function useCopyBudgets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      from_month: number;
      from_year: number;
      to_month: number;
      to_year: number;
    }) => {
      const response = await fetch('/api/budgets/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to copy budgets');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}
