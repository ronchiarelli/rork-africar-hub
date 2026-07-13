import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { IssueReportRow } from '@/types/database';
import type { CarIssueReport } from '@/types/car';

function mapIssueReport(row: IssueReportRow): CarIssueReport {
  return {
    id: row.id,
    bookingId: row.booking_id,
    carId: row.car_id,
    category: row.category,
    description: row.description,
    photoUrl: row.photo_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function useBookingIssueReports(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['issue-reports', bookingId],
    queryFn: async (): Promise<CarIssueReport[]> => {
      const { data, error } = await supabase
        .from('issue_reports')
        .select('*')
        .eq('booking_id', bookingId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as IssueReportRow[]).map(mapIssueReport);
    },
    enabled: !!bookingId,
  });
}

export interface SubmitIssueReportInput {
  bookingId: string;
  carId: string;
  category: string;
  description: string;
  photoUrl: string | null;
}

export function useSubmitIssueReport() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitIssueReportInput) => {
      const { error } = await supabase.from('issue_reports').insert({
        booking_id: input.bookingId,
        car_id: input.carId,
        customer_id: currentUser?.id,
        category: input.category,
        description: input.description,
        photo_url: input.photoUrl,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['issue-reports', variables.bookingId] });
    },
  });
}
