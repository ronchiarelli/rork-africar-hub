import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type FeaturedTargetType = 'car' | 'sale_car';
export type FeaturedPlacement = 'marketplace' | 'home';

export interface InitiateFeaturedPaymentInput {
  targetType: FeaturedTargetType;
  targetId: string;
  placement: FeaturedPlacement;
}

// Self-service featured-placement purchase for a fleet owner/dealer's own
// listing — mirrors useInitiateWalletTopUp/useInitiateSubscriptionPayment,
// same Hubtel checkout + gocarhub:// return-scheme pattern.
export function useInitiateFeaturedPayment() {
  return useMutation({
    mutationFn: async (input: InitiateFeaturedPaymentInput) => {
      const { data, error } = await supabase.functions.invoke<{ checkoutUrl: string; clientReference: string }>(
        'initiate-featured-payment',
        { body: input }
      );
      if (error) throw error;
      if (!data) throw new Error('No response from server');
      return data;
    },
  });
}
