'use client';

import { useQuery } from '@tanstack/react-query';

export function useDashboard(month: number, year: number) {
  return useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return (await res.json()).data;
    },
  });
}
