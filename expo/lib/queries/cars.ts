import { useQuery } from '@tanstack/react-query';
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
  };
}

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
