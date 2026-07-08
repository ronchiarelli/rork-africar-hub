import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FavoriteRow } from '@/types/database';

export function useFavoriteIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('favorites').select('car_id').eq('user_id', userId as string);
      if (error) throw error;
      return (data as Pick<FavoriteRow, 'car_id'>[]).map((row) => row.car_id);
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ carId, isFavorited }: { carId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', userId as string).eq('car_id', carId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: userId as string, car_id: carId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });
}
