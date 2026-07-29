import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { mapCar } from '@/lib/queries/cars';
import type { CarRow, FleetVehicleRow, BookingRow, VerificationStatusDb } from '@/types/database';
import type { Car, FleetVehicle, Booking } from '@/types/car';

export interface PendingBooking extends Booking {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerVerificationStatus: VerificationStatusDb;
  customerKycExempt: boolean;
}

function mapFleetVehicle(row: FleetVehicleRow & { car: CarRow }): FleetVehicle {
  return {
    id: row.id,
    carId: row.car_id,
    car: mapCar(row.car),
    status: row.status,
    totalEarnings: row.total_earnings,
    totalTrips: row.total_trips,
    nextMaintenance: row.next_maintenance ?? '',
  };
}

export function useMyFleetVehicles() {
  const { currentUser } = useAuth();
  const ownerId = currentUser?.id;
  return useQuery({
    queryKey: ['my-fleet-vehicles', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*, car:cars(*)')
        .eq('owner_id', ownerId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as (FleetVehicleRow & { car: CarRow })[]).map(mapFleetVehicle);
    },
    enabled: !!ownerId,
  });
}

export function usePendingOwnerBookings() {
  const { currentUser } = useAuth();
  const ownerId = currentUser?.id;
  return useQuery({
    queryKey: ['pending-owner-bookings', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, car:cars!inner(*), customer:profiles!customer_id(name, phone, verification_status, kyc_exempt)')
        .eq('status', 'pending')
        .eq('car.owner_id', ownerId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as (BookingRow & { car: CarRow; customer: { name: string; phone: string | null; verification_status: VerificationStatusDb; kyc_exempt: boolean } | null })[]).map(
        (row): PendingBooking => ({
          id: row.id,
          carId: row.car_id,
          car: mapCar(row.car),
          pickupDate: row.pickup_date,
          returnDate: row.return_date,
          pickupLocation: row.pickup_location,
          totalDays: row.total_days,
          totalPrice: row.total_price,
          status: row.status,
          paymentStatus: row.payment_status,
          createdAt: row.created_at,
          customerId: row.customer_id,
          customerName: row.customer?.name ?? 'Customer',
          customerPhone: row.customer?.phone ?? '',
          customerVerificationStatus: row.customer?.verification_status ?? 'none',
          customerKycExempt: row.customer?.kyc_exempt ?? false,
        })
      );
    },
    enabled: !!ownerId,
  });
}

export interface FleetMonthlyTrend {
  monthStart: string;
  bookings: number;
  revenue: number;
}

export function useFleetMonthlyTrends() {
  const { currentUser } = useAuth();
  return useQuery({
    queryKey: ['fleet-owner-monthly-trends', currentUser?.id],
    queryFn: async (): Promise<FleetMonthlyTrend[]> => {
      const { data, error } = await supabase.rpc('fleet_owner_monthly_trends');
      if (error) throw error;
      return data.map((row) => ({
        monthStart: row.month_start,
        bookings: row.bookings,
        revenue: row.revenue,
      }));
    },
    enabled: !!currentUser?.id,
  });
}

export interface FleetTopCar {
  carId: string;
  brand: string;
  model: string;
  image: string;
  views: number;
  bookingCount: number;
}

export function useFleetTopCars() {
  const { currentUser } = useAuth();
  return useQuery({
    queryKey: ['fleet-owner-top-cars', currentUser?.id],
    queryFn: async (): Promise<FleetTopCar[]> => {
      const { data, error } = await supabase.rpc('fleet_owner_top_cars');
      if (error) throw error;
      return data.map((row) => ({
        carId: row.car_id,
        brand: row.brand,
        model: row.model,
        image: row.image,
        views: row.views,
        bookingCount: row.booking_count,
      }));
    },
    enabled: !!currentUser?.id,
  });
}

export interface NewCarInput {
  brand: string;
  model: string;
  year: number;
  category: string;
  images: string[];
  pricePerDay: number;
  pricePerWeek: number;
  location: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  seats: number;
  transmission: Car['transmission'];
  fuelType: Car['fuelType'];
  horsepower: number;
  hasAC: boolean;
  description: string;
  features: string[];
  ownerName: string;
  ownerPhone: string;
}

export function useCreateCar() {
  const { currentUser } = useAuth();
  const ownerId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCarInput) => {
      // Admins list platform/catalog cars with no real owner (matching
      // seed/demo inventory) so owner_subscription_active()'s null-owner
      // short-circuit keeps it visible to everyone, rather than being tied
      // to an admin account that never has its own subscription.
      const resolvedOwnerId = currentUser?.role === 'admin' ? null : ownerId;
      const { error } = await supabase.from('cars').insert({
        owner_id: resolvedOwnerId,
        brand: input.brand,
        model: input.model,
        year: input.year,
        category: input.category,
        image: input.images[0],
        images: input.images,
        price_per_day: input.pricePerDay,
        price_per_week: input.pricePerWeek,
        location: input.location,
        address: input.address ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        seats: input.seats,
        transmission: input.transmission,
        fuel_type: input.fuelType,
        horsepower: input.horsepower,
        has_ac: input.hasAC,
        is_available: true,
        description: input.description,
        features: input.features,
        owner_name: input.ownerName,
        owner_phone: input.ownerPhone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-cars', ownerId] });
      void queryClient.invalidateQueries({ queryKey: ['my-fleet-vehicles', ownerId] });
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-all-cars'] });
    },
  });
}

export function useUpdateCar() {
  const { currentUser } = useAuth();
  const ownerId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ carId, input }: { carId: string; input: NewCarInput }) => {
      const { error } = await supabase
        .from('cars')
        .update({
          brand: input.brand,
          model: input.model,
          year: input.year,
          category: input.category,
          image: input.images[0],
          images: input.images,
          price_per_day: input.pricePerDay,
          price_per_week: input.pricePerWeek,
          location: input.location,
          address: input.address ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          seats: input.seats,
          transmission: input.transmission,
          fuel_type: input.fuelType,
          horsepower: input.horsepower,
          has_ac: input.hasAC,
          description: input.description,
          features: input.features,
        })
        .eq('id', carId);
      if (error) throw error;
    },
    onSuccess: (_data, { carId }) => {
      void queryClient.invalidateQueries({ queryKey: ['my-fleet-vehicles', ownerId] });
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
      void queryClient.invalidateQueries({ queryKey: ['cars', carId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-all-cars'] });
    },
  });
}

// Quick availability toggle for the inventory list — separate from
// useUpdateCar since that always resubmits the entire edit form's fields;
// this is a single-column update fired straight from a list-row switch.
export function useSetCarAvailability() {
  const { currentUser } = useAuth();
  const ownerId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ carId, isAvailable }: { carId: string; isAvailable: boolean }) => {
      const { error } = await supabase.from('cars').update({ is_available: isAvailable }).eq('id', carId);
      if (error) throw error;
    },
    onSuccess: (_data, { carId }) => {
      void queryClient.invalidateQueries({ queryKey: ['my-fleet-vehicles', ownerId] });
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
      void queryClient.invalidateQueries({ queryKey: ['cars', carId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-all-cars'] });
    },
  });
}

// Cars with booking or review history can't be deleted (delete_car
// translates the underlying FK violation into this message) — the owner
// is expected to mark them unavailable instead.
export function useDeleteCar() {
  const { currentUser } = useAuth();
  const ownerId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      const { error } = await supabase.rpc('delete_car', { p_car_id: carId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-fleet-vehicles', ownerId] });
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-all-cars'] });
    },
  });
}
