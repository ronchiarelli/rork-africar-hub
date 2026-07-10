import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { mapCar } from '@/lib/queries/cars';
import type { CarRow, FleetVehicleRow, BookingRow } from '@/types/database';
import type { Car, FleetVehicle, Booking } from '@/types/car';

export interface PendingBooking extends Booking {
  customerId: string;
  customerName: string;
  customerPhone: string;
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

export function useMyCars() {
  const { currentUser } = useAuth();
  const ownerId = currentUser?.id;
  return useQuery({
    queryKey: ['my-cars', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('owner_id', ownerId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as CarRow[]).map(mapCar);
    },
    enabled: !!ownerId,
  });
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
        .select('*, car:cars!inner(*), customer:profiles!customer_id(name, phone)')
        .eq('status', 'pending')
        .eq('car.owner_id', ownerId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as (BookingRow & { car: CarRow; customer: { name: string; phone: string | null } })[]).map(
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
          createdAt: row.created_at,
          customerId: row.customer_id,
          customerName: row.customer?.name ?? 'Customer',
          customerPhone: row.customer?.phone ?? '',
        })
      );
    },
    enabled: !!ownerId,
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
    },
  });
}
