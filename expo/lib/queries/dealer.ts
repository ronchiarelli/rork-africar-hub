import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { SaleCarRow, DealerListingRow, LeadRow } from '@/types/database';
import type { SaleCar, DealerListing, Lead } from '@/types/car';

function mapSaleCar(row: SaleCarRow): SaleCar {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    category: row.category,
    image: row.image,
    images: row.images,
    salePrice: row.sale_price,
    mileage: row.mileage,
    location: row.location,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    condition: row.condition,
    dealerId: row.dealer_id,
    dealerName: row.dealer_name ?? '',
    dealerPhone: row.dealer_phone ?? '',
    dealerAvatar: row.dealer_avatar ?? '',
    isFeatured: row.is_featured,
    views: row.views,
    description: row.description ?? '',
    features: row.features,
  };
}

type DealerListingWithCar = DealerListingRow & { sale_car: SaleCarRow };

export function useMyDealerListings() {
  const { currentUser } = useAuth();
  const dealerId = currentUser?.id;
  return useQuery({
    queryKey: ['my-dealer-listings', dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealer_listings')
        .select('*, sale_car:sale_cars(*)')
        .eq('dealer_id', dealerId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as DealerListingWithCar[]).map((row): DealerListing => ({
        id: row.id,
        car: mapSaleCar(row.sale_car),
        listingType: row.listing_type,
        askingPrice: row.asking_price,
        views: row.views,
        leads: row.leads,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
    enabled: !!dealerId,
  });
}

export function useMyLeads() {
  const { currentUser } = useAuth();
  const dealerId = currentUser?.id;
  return useQuery({
    queryKey: ['my-leads', dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, dealer_listing:dealer_listings!inner(*)')
        .eq('dealer_listing.dealer_id', dealerId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as (LeadRow & { dealer_listing: DealerListingRow })[]).map((row): Lead => ({
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        carModel: row.car_model ?? '',
        message: row.message ?? '',
        status: row.status,
        createdAt: row.created_at,
      }));
    },
    enabled: !!dealerId,
  });
}

export interface NewLeadInput {
  saleCarId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  carModel: string;
  message: string;
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewLeadInput) => {
      const { data: listing, error: listingError } = await supabase
        .from('dealer_listings')
        .select('id')
        .eq('sale_car_id', input.saleCarId)
        .maybeSingle();
      if (listingError) throw listingError;
      // Catalog/demo listings with no real dealer have no dealer_listings row
      // (the auto-create trigger skips null dealer_id) — nothing to attach
      // a lead to, so this is a silent no-op rather than a user-facing error.
      if (!listing) return;

      const { error } = await supabase.from('leads').insert({
        dealer_listing_id: listing.id,
        customer_id: input.customerId,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        car_model: input.carModel,
        message: input.message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-leads'] });
      void queryClient.invalidateQueries({ queryKey: ['my-dealer-listings'] });
    },
  });
}

export interface NewSaleCarInput {
  brand: string;
  model: string;
  year: number;
  category: string;
  images: string[];
  salePrice: number;
  mileage: number;
  location: string;
  fuelType: SaleCar['fuelType'];
  transmission: SaleCar['transmission'];
  condition: SaleCar['condition'];
  description: string;
  features: string[];
  dealerName: string;
  dealerPhone: string;
}

export function useCreateSaleCar() {
  const { currentUser } = useAuth();
  const dealerId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewSaleCarInput) => {
      // Admins list platform/catalog cars with no real dealer, matching
      // seed/demo inventory, so it stays visible to everyone regardless of
      // any subscription state (admins don't carry one themselves).
      const resolvedDealerId = currentUser?.role === 'admin' ? null : dealerId;
      const { error } = await supabase.from('sale_cars').insert({
        dealer_id: resolvedDealerId,
        brand: input.brand,
        model: input.model,
        year: input.year,
        category: input.category,
        image: input.images[0],
        images: input.images,
        sale_price: input.salePrice,
        mileage: input.mileage,
        location: input.location,
        fuel_type: input.fuelType,
        transmission: input.transmission,
        condition: input.condition,
        dealer_name: input.dealerName,
        dealer_phone: input.dealerPhone,
        is_featured: false,
        description: input.description,
        features: input.features,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-sale-cars', dealerId] });
      void queryClient.invalidateQueries({ queryKey: ['my-dealer-listings', dealerId] });
      void queryClient.invalidateQueries({ queryKey: ['sale_cars'] });
    },
  });
}
