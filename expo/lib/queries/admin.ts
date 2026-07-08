import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';

export interface PlatformStats {
  totalUsers: number;
  totalBookings: number;
  totalSubscriptionRevenue: number;
  totalCars: number;
  totalSaleCars: number;
  pendingKYC: number;
  monthlyGrowth: number;
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      const { data, error } = await supabase.rpc('admin_platform_stats');
      if (error) throw error;
      const row = data[0];
      const lastMonth = row.new_users_last_month;
      const thisMonth = row.new_users_this_month;
      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : (thisMonth > 0 ? 100 : 0);
      return {
        totalUsers: row.total_users,
        totalBookings: row.total_bookings,
        totalSubscriptionRevenue: row.total_subscription_revenue,
        totalCars: row.total_cars,
        totalSaleCars: row.total_sale_cars,
        pendingKYC: row.pending_kyc,
        monthlyGrowth: Math.round(growth * 10) / 10,
      };
    },
  });
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: ProfileRow['role'];
  isSuspended: boolean;
  verificationStatus: ProfileRow['verification_status'];
  memberSince: string;
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async (): Promise<AdminUserRow[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as ProfileRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar ?? '',
        role: row.role,
        isSuspended: row.is_suspended,
        verificationStatus: row.verification_status,
        memberSince: row.member_since,
      }));
    },
  });
}

export function useSetUserSuspended() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
      const { error } = await supabase.rpc('admin_set_suspended', { p_user_id: userId, p_suspended: suspended });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
    },
  });
}
