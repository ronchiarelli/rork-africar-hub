import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface SubmitReviewInput {
  bookingId: string;
  carId: string;
  rating: number;
  comment: string;
  tags: string[];
}

export function useSubmitReview() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      const { error } = await supabase.from('reviews').insert({
        booking_id: input.bookingId,
        car_id: input.carId,
        customer_id: currentUser?.id,
        rating: input.rating,
        comment: input.comment,
        tags: input.tags,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['cars', variables.carId] });
    },
  });
}
