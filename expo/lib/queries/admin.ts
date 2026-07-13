import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileRow, SubscriptionRow, SubscriptionStatusDb } from '@/types/database';

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

export interface AdminUserDetail extends AdminUserRow {
  phone: string;
  whatsapp: string;
  totalBookings: number;
}

export function useAdminUserDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async (): Promise<AdminUserDetail> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as string)
        .single();
      if (error) throw error;
      const row = data as ProfileRow;
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone ?? '',
        whatsapp: row.whatsapp ?? '',
        avatar: row.avatar ?? '',
        role: row.role,
        isSuspended: row.is_suspended,
        verificationStatus: row.verification_status,
        memberSince: row.member_since,
        totalBookings: row.total_bookings,
      };
    },
    enabled: !!userId,
  });
}

export function useSetUserSuspended() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
      const { error } = await supabase.rpc('admin_set_suspended', { p_user_id: userId, p_suspended: suspended });
      if (error) throw error;
    },
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
    },
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('admin_revoke_role', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_data, userId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
    },
  });
}

export interface AdminSubscriptionRow {
  userId: string;
  userName: string;
  userEmail: string;
  role: ProfileRow['role'];
  status: SubscriptionStatusDb;
  amount: number;
  currency: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

type SubscriptionWithProfile = SubscriptionRow & { profile: { name: string; email: string; role: ProfileRow['role'] } | null };

export function useAllSubscriptions() {
  return useQuery({
    queryKey: ['admin-all-subscriptions'],
    queryFn: async (): Promise<AdminSubscriptionRow[]> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, profile:profiles!user_id(name, email, role)')
        .order('current_period_end', { ascending: true });
      if (error) throw error;
      return (data as unknown as SubscriptionWithProfile[]).map((row) => ({
        userId: row.user_id,
        userName: row.profile?.name ?? 'Unknown',
        userEmail: row.profile?.email ?? '',
        role: row.profile?.role ?? 'customer',
        status: row.status,
        amount: row.amount,
        currency: row.currency,
        trialEndsAt: row.trial_ends_at,
        currentPeriodEnd: row.current_period_end,
      }));
    },
  });
}

export function useExtendSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const { error } = await supabase.rpc('admin_extend_subscription', { p_user_id: userId, p_days: days });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
    },
  });
}

export function useSetSubscriptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: SubscriptionStatusDb }) => {
      const { error } = await supabase.rpc('admin_set_subscription_status', { p_user_id: userId, p_status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
    },
  });
}

export function useSubscriptionRate() {
  return useQuery({
    queryKey: ['platform-subscription-rate'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.from('platform_settings').select('subscription_monthly_rate').single();
      if (error) throw error;
      return data.subscription_monthly_rate;
    },
  });
}

export function useSetSubscriptionRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rate: number) => {
      const { error } = await supabase.rpc('admin_set_subscription_rate', { p_rate: rate });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform-subscription-rate'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export interface MonthlyTrend {
  monthStart: string;
  newUsers: number;
  bookings: number;
  revenue: number;
}

export function useMonthlyTrends() {
  return useQuery({
    queryKey: ['admin-monthly-trends'],
    queryFn: async (): Promise<MonthlyTrend[]> => {
      const { data, error } = await supabase.rpc('admin_monthly_trends');
      if (error) throw error;
      return data.map((row) => ({
        monthStart: row.month_start,
        newUsers: row.new_users,
        bookings: row.bookings,
        revenue: row.revenue,
      }));
    },
  });
}

export interface TopCar {
  carId: string;
  brand: string;
  model: string;
  image: string;
  bookingCount: number;
}

export function useTopCars() {
  return useQuery({
    queryKey: ['admin-top-cars'],
    queryFn: async (): Promise<TopCar[]> => {
      const { data, error } = await supabase.rpc('admin_top_cars');
      if (error) throw error;
      return data.map((row) => ({
        carId: row.car_id,
        brand: row.brand,
        model: row.model,
        image: row.image,
        bookingCount: row.booking_count,
      }));
    },
  });
}
