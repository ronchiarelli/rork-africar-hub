import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
}

// Free OpenStreetMap-backed address search — see
// supabase/functions/places-autocomplete for why this is proxied through
// an Edge Function rather than called directly from the app.
export function useLocationSearch() {
  return useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke<{ results: LocationResult[] }>(
        'places-autocomplete',
        { body: { query } }
      );
      if (error) throw error;
      return data?.results ?? [];
    },
  });
}
