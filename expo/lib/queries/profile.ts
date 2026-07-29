import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';
import type { UserProfile, UserRole, OwnerPaymentDetails } from '@/types/car';

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? '',
    avatar: row.avatar ?? '',
    isVerified: row.is_verified,
    verificationStatus: row.verification_status,
    kycExempt: row.kyc_exempt,
    isSuspended: row.is_suspended,
    totalBookings: row.total_bookings,
    memberSince: row.member_since,
    role: row.role,
    momoProvider: row.momo_provider,
    momoNumber: row.momo_number ?? '',
    bankName: row.bank_name ?? '',
    bankAccountName: row.bank_account_name ?? '',
    bankAccountNumber: row.bank_account_number ?? '',
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
    mutationFn: async (updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'whatsapp' | 'avatar'>>) => {
      const { error } = await supabase
        .from('profiles')
        .update({ name: updates.name, phone: updates.phone, whatsapp: updates.whatsapp, avatar: updates.avatar })
        .eq('id', userId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useUpdatePaymentDetails(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Pick<UserProfile, 'momoProvider' | 'momoNumber' | 'bankName' | 'bankAccountName' | 'bankAccountNumber'>) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          momo_provider: updates.momoProvider,
          momo_number: updates.momoNumber || null,
          bank_name: updates.bankName || null,
          bank_account_name: updates.bankAccountName || null,
          bank_account_number: updates.bankAccountNumber || null,
        })
        .eq('id', userId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

// A customer's read of another user's payment details — gated server-side
// (owner_payment_details returns zero rows unless the caller is the owner,
// an admin, or has an actual booking/lead relationship with them).
export function useOwnerPaymentDetails(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['owner-payment-details', ownerId],
    queryFn: async (): Promise<OwnerPaymentDetails | null> => {
      const { data, error } = await supabase.rpc('owner_payment_details', { p_owner_id: ownerId as string });
      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      return {
        momoProvider: row.momo_provider,
        momoNumber: row.momo_number ?? '',
        bankName: row.bank_name ?? '',
        bankAccountName: row.bank_account_name ?? '',
        bankAccountNumber: row.bank_account_number ?? '',
      };
    },
    enabled: !!ownerId,
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
