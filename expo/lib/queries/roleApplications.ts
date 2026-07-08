import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RoleApplicationRow, UserRoleDb } from '@/types/database';

export interface PendingRoleApplication {
  applicationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedRole: UserRoleDb;
  createdAt: string;
}

type RoleApplicationWithProfile = RoleApplicationRow & { profile: { name: string; email: string } | null };

export function usePendingRoleApplications() {
  return useQuery({
    queryKey: ['admin-pending-role-applications'],
    queryFn: async (): Promise<PendingRoleApplication[]> => {
      const { data, error } = await supabase
        .from('role_applications')
        .select('*, profile:profiles!user_id(name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as RoleApplicationWithProfile[]).map((row) => ({
        applicationId: row.id,
        userId: row.user_id,
        userName: row.profile?.name ?? 'Unknown',
        userEmail: row.profile?.email ?? '',
        requestedRole: row.requested_role,
        createdAt: row.created_at,
      }));
    },
  });
}

export function useReviewRoleApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, decision }: { userId: string; decision: 'approved' | 'rejected' }) => {
      const { error } = await supabase.rpc('admin_approve_role', {
        p_user_id: userId,
        p_decision: decision,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-role-applications'] });
    },
  });
}
