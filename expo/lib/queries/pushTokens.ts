import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { registerForPushNotificationsAsync, disablePushNotificationsAsync } from '@/lib/pushNotifications';

export function useHasPushToken(userId: string | undefined) {
  return useQuery({
    queryKey: ['has-push-token', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('push_tokens')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId as string);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!userId,
  });
}

export function useEnablePushNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return null;
      return registerForPushNotificationsAsync(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['has-push-token', userId] });
    },
  });
}

export function useDisablePushNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await disablePushNotificationsAsync(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['has-push-token', userId] });
    },
  });
}
