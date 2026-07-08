import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';
import type { UserProfile, UserRole } from '@/types/car';

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    avatar: row.avatar ?? '',
    isVerified: row.is_verified,
    verificationStatus: row.verification_status,
    isSuspended: row.is_suspended,
    totalBookings: row.total_bookings,
    memberSince: row.member_since,
    role: row.role,
  };
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as string)
        .single();
      if (error) throw error;
      return mapProfile(data as ProfileRow);
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'avatar'>>) => {
      const { error } = await supabase
        .from('profiles')
        .update({ name: updates.name, phone: updates.phone, avatar: updates.avatar })
        .eq('id', userId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useRequestRoleUpgrade(userId: string | undefined) {
  return useMutation({
    mutationFn: async (requestedRole: Exclude<UserRole, 'customer' | 'admin'>) => {
      const { error } = await supabase
        .from('role_applications')
        .insert({ user_id: userId as string, requested_role: requestedRole });
      if (error) throw error;
    },
  });
}
