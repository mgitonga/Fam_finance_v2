'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDebtInput, LogDebtPaymentInput } from '@/lib/validations/savings-debt';

const KEY = ['debts'];

export function useDebts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/debts');
      if (!res.ok) throw new Error('Failed to fetch');
      return (await res.json()).data;
    },
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDebtInput) => {
      const res = await fetch('/api/debts', {
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

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useLogDebtPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ debtId, data }: { debtId: string; data: LogDebtPaymentInput }) => {
      const res = await fetch(`/api/debts/${debtId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
