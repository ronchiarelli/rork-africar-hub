import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { SubscriptionRow } from '@/types/database';

export interface SubscriptionInfo {
  row: SubscriptionRow | null;
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number;
}

export function useSubscription() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async (): Promise<SubscriptionInfo> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId as string)
        .maybeSingle();
      if (error) throw error;

      const row = data as SubscriptionRow | null;
      const periodEnd = row?.current_period_end ? new Date(row.current_period_end) : null;
      const inGoodStanding = !!row && (row.status === 'trialing' || row.status === 'active') && !!periodEnd && periodEnd.getTime() >= Date.now();
      const daysRemaining = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        row,
        isActive: inGoodStanding,
        isTrialing: row?.status === 'trialing',
        daysRemaining,
      };
    },
    enabled: !!userId,
  });
}
