import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CarRow, SaleCarRow, BrandRow } from '@/types/database';
import type { Car, SaleCar, Brand } from '@/types/car';

export function mapCar(row: CarRow): Car {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    category: row.category,
    image: row.image,
    images: row.images,
    pricePerDay: row.price_per_day,
    pricePerWeek: row.price_per_week,
    location: row.location,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    seats: row.seats,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    horsepower: row.horsepower,
    hasAC: row.has_ac,
    rating: row.rating,
    reviewCount: row.review_count,
    isAvailable: row.is_available,
    description: row.description ?? '',
    features: row.features,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? '',
    ownerPhone: row.owner_phone ?? '',
    views: row.views,
    isFeatured: row.is_featured,
    isHomeFeatured: row.is_home_featured,
    approvalStatus: row.approval_status,
    rejectionReason: row.rejection_reason,
  };
}

export function mapSaleCar(row: SaleCarRow): SaleCar {
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
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    condition: row.condition,
    dealerId: row.dealer_id,
    dealerName: row.dealer_name ?? '',
    dealerPhone: row.dealer_phone ?? '',
    dealerAvatar: row.dealer_avatar ?? '',
    isFeatured: row.is_featured,
    isHomeFeatured: row.is_home_featured,
    views: row.views,
    description: row.description ?? '',
    features: row.features,
    approvalStatus: row.approval_status,
    rejectionReason: row.rejection_reason,
  };
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo ?? '',
    carCount: row.car_count,
  };
}

export interface CarFilters {
  brand?: string;
  location?: string;
  onlyAvailable?: boolean;
}

export function useCars(filters?: CarFilters) {
  return useQuery({
    queryKey: ['cars', filters ?? {}],
    queryFn: async () => {
      let query = supabase.from('cars').select('*').order('created_at', { ascending: false });
      if (filters?.brand) query = query.eq('brand', filters.brand);
      if (filters?.location) query = query.eq('location', filters.location);
      if (filters?.onlyAvailable) query = query.eq('is_available', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data as CarRow[]).map(mapCar);
    },
    staleTime: 60_000,
  });
}

export function useCarDetails(id: string | undefined) {
  return useQuery({
    queryKey: ['cars', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('cars').select('*').eq('id', id as string).single();
      if (error) throw error;
      return mapCar(data as CarRow);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// Fire-and-forget view counter, fed to the fleet dashboard's analytics.
// Silently ignores failure — a missed view increment isn't worth surfacing
// an error to someone just browsing a car.
export function useIncrementCarViews() {
  return useMutation({
    mutationFn: async (carId: string) => {
      const { error } = await supabase.rpc('increment_car_views', { p_car_id: carId });
      if (error) throw error;
    },
  });
}

export function useSaleCarDetails(id: string | undefined) {
  return useQuery({
    queryKey: ['sale_cars', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('sale_cars').select('*').eq('id', id as string).single();
      if (error) throw error;
      return mapSaleCar(data as SaleCarRow);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return (data as BrandRow[]).map(mapBrand);
    },
    staleTime: 5 * 60_000,
  });
}

export function useSaleCars() {
  return useQuery({
    queryKey: ['sale_cars'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sale_cars').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as SaleCarRow[]).map(mapSaleCar);
    },
    staleTime: 60_000,
  });
}

// Car ids with a confirmed booking covering today — used to show a
// "Booked" badge on browse cards. A single Set-returning call so screens
// rendering many cards don't need one lookup per card.
export function useBookedCarIds() {
  return useQuery({
    queryKey: ['cars-booked-today'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('cars_booked_today');
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.cars_booked_today));
    },
    staleTime: 60_000,
  });
}
