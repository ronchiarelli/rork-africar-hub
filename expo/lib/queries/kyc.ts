import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { KycDocumentRow, KycDocTypeDb } from '@/types/database';
import type { KYCDocument } from '@/types/car';

const REQUIRED_DOCS: { type: KycDocTypeDb; label: string }[] = [
  { type: 'ghana_card', label: 'Ghana Card' },
  { type: 'drivers_license', label: "Driver's License" },
  { type: 'passport', label: 'Passport' },
  { type: 'selfie', label: 'Selfie Verification' },
];

function mapDoc(type: KycDocTypeDb, label: string, row: KycDocumentRow | undefined): KYCDocument {
  return {
    id: type,
    type,
    label,
    status: row?.status ?? 'not_uploaded',
    uploadedAt: row?.uploaded_at ?? undefined,
    imageUri: undefined,
  };
}

export function useKycDocuments() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  return useQuery({
    queryKey: ['kyc-documents', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId as string);
      if (error) throw error;
      const rows = data as KycDocumentRow[];
      return REQUIRED_DOCS.map(({ type, label }) => mapDoc(type, label, rows.find((r) => r.type === type)));
    },
    enabled: !!userId,
  });
}

export function useUploadKycDocument() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docType: KycDocTypeDb) => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Photo library permission is required to upload a document.');
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });
      if (result.canceled || !result.assets[0]) {
        return null; // user cancelled — not an error
      }

      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${userId}/${docType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('kyc-documents').upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { error: upsertError } = await supabase.from('kyc_documents').upsert(
        {
          user_id: userId as string,
          type: docType,
          label: REQUIRED_DOCS.find((d) => d.type === docType)?.label,
          status: 'uploaded',
          storage_path: path,
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,type' }
      );
      if (upsertError) throw upsertError;

      return path;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kyc-documents', userId] });
    },
  });
}

export interface PendingKycReview {
  docId: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: KycDocTypeDb;
  label: string;
  uploadedAt: string | null;
}

type KycDocumentWithProfile = KycDocumentRow & { profile: { name: string; email: string } | null };

export function usePendingKycDocuments() {
  return useQuery({
    queryKey: ['admin-pending-kyc'],
    queryFn: async (): Promise<PendingKycReview[]> => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*, profile:profiles!user_id(name, email)')
        .eq('status', 'uploaded')
        .order('uploaded_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as KycDocumentWithProfile[]).map((row) => ({
        docId: row.id,
        userId: row.user_id,
        userName: row.profile?.name ?? 'Unknown',
        userEmail: row.profile?.email ?? '',
        type: row.type,
        label: row.label ?? row.type,
        uploadedAt: row.uploaded_at,
      }));
    },
  });
}

export function useReviewKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ docId, decision }: { docId: string; decision: 'verified' | 'rejected' }) => {
      const { error } = await supabase.rpc('admin_review_kyc', {
        p_doc_id: docId,
        p_decision: decision,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-kyc'] });
    },
  });
}
