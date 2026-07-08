import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PromoBannerRow } from '@/types/database';

export interface PromoBanner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaRoute: string;
  isActive: boolean;
  displayOrder: number;
}

function mapBanner(row: PromoBannerRow): PromoBanner {
  return {
    id: row.id,
    tag: row.tag,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    ctaLabel: row.cta_label,
    ctaRoute: row.cta_route,
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}

export function useActiveBanner() {
  return useQuery({
    queryKey: ['active-promo-banner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapBanner(data as PromoBannerRow) : null;
    },
    staleTime: 60_000,
  });
}

export function useAllBanners() {
  return useQuery({
    queryKey: ['all-promo-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as PromoBannerRow[]).map(mapBanner);
    },
  });
}

export function useBanner(id: string | undefined) {
  return useQuery({
    queryKey: ['promo-banner', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return mapBanner(data as PromoBannerRow);
    },
    enabled: !!id,
  });
}

export interface BannerInput {
  tag: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaRoute: string;
  isActive: boolean;
  displayOrder: number;
}

function invalidateBannerQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['active-promo-banner'] });
  void queryClient.invalidateQueries({ queryKey: ['all-promo-banners'] });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BannerInput) => {
      const { error } = await supabase.from('promo_banners').insert({
        tag: input.tag,
        title: input.title,
        subtitle: input.subtitle,
        image_url: input.imageUrl,
        cta_label: input.ctaLabel,
        cta_route: input.ctaRoute,
        is_active: input.isActive,
        display_order: input.displayOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateBannerQueries(queryClient),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BannerInput }) => {
      const { error } = await supabase
        .from('promo_banners')
        .update({
          tag: input.tag,
          title: input.title,
          subtitle: input.subtitle,
          image_url: input.imageUrl,
          cta_label: input.ctaLabel,
          cta_route: input.ctaRoute,
          is_active: input.isActive,
          display_order: input.displayOrder,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateBannerQueries(queryClient),
  });
}

export function useSetBannerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('promo_banners').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateBannerQueries(queryClient),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateBannerQueries(queryClient),
  });
}
