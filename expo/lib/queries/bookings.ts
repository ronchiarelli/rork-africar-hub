import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapCar } from '@/lib/queries/cars';
import type { BookingRow, CarRow } from '@/types/database';
import type { Booking } from '@/types/car';

type BookingWithCar = BookingRow & { car: CarRow };

function mapBooking(row: BookingWithCar): Booking {
  return {
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
  };
}

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, car:cars(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as BookingWithCar[]).map(mapBooking);
    },
  });
}

export function useBookingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, car:cars(*)')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return mapBooking(data as unknown as BookingWithCar);
    },
    enabled: !!id,
  });
}

interface CreateBookingInput {
  carId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await supabase.rpc('create_booking', {
        p_car_id: input.carId,
        p_pickup_date: input.pickupDate,
        p_return_date: input.returnDate,
        p_pickup_location: input.pickupLocation,
      });
      if (error) throw error;
      return data as BookingRow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useReviewBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, decision }: { bookingId: string; decision: 'approved' | 'cancelled' }) => {
      const { data, error } = await supabase.rpc('fleet_owner_review_booking', {
        p_booking_id: bookingId,
        p_decision: decision,
      });
      if (error) throw error;
      return data as BookingRow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
