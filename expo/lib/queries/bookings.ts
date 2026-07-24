import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapCar } from '@/lib/queries/cars';
import { getErrorMessage } from '@/lib/errors';
import type { BookingRow, CarRow, VerificationStatusDb } from '@/types/database';
import type { Booking } from '@/types/car';

type BookingCustomer = { name: string; phone: string | null; verification_status: VerificationStatusDb } | null;
type BookingWithCar = BookingRow & { car: CarRow; customer: BookingCustomer };

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
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    customerId: row.customer_id,
    customerName: row.customer?.name ?? 'Customer',
    customerPhone: row.customer?.phone ?? '',
    customerVerificationStatus: row.customer?.verification_status ?? 'none',
  };
}

const BOOKING_SELECT = '*, car:cars(*), customer:profiles!customer_id(name, phone, verification_status)';

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT)
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
        .select(BOOKING_SELECT)
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

// Whether this booking's car owner has been admin-allowlisted for in-app
// Hubtel payment — a customer can't read another user's profiles row
// directly, so this goes through a SECURITY-DEFINER RPC that only ever
// returns a boolean (same shape as owner_subscription_active()).
export function useOwnerAcceptsInAppPayment(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['owner-accepts-inapp-payment', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('owner_accepts_inapp_payment', { p_owner_id: ownerId as string });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!ownerId,
  });
}

export function useInitiateBookingPayment() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase.functions.invoke<{ checkoutUrl: string; clientReference: string; returnUrl: string }>(
        'initiate-booking-payment',
        { body: { bookingId } }
      );
      if (error) {
        const context = (error as { context?: Response }).context;
        const body = context ? await context.clone().json().catch(() => null) : null;
        throw new Error(body?.error ?? getErrorMessage(error, 'Could not start payment'));
      }
      if (!data?.checkoutUrl) throw new Error('Could not start payment');
      return data;
    },
  });
}
