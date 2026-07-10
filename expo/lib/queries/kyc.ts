import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { KycDocumentRow, KycDocTypeDb, KycDocSideDb, KycStatusDb } from '@/types/database';
import type { KYCDocument } from '@/types/car';

const REQUIRED_DOCS: { type: KycDocTypeDb; side: KycDocSideDb; label: string }[] = [
  { type: 'ghana_card', side: 'front', label: 'National ID (Ghana Card) — Front' },
  { type: 'ghana_card', side: 'back', label: 'National ID (Ghana Card) — Back' },
  { type: 'passport', side: 'single', label: 'Passport' },
  { type: 'drivers_license', side: 'front', label: "Driver's License — Front" },
  { type: 'drivers_license', side: 'back', label: "Driver's License — Back" },
  { type: 'selfie', side: 'single', label: 'Selfie Verification' },
];

function findDoc(rows: KycDocumentRow[], type: KycDocTypeDb, side: KycDocSideDb) {
  return rows.find((r) => r.type === type && r.side === side);
}

function mapDoc(type: KycDocTypeDb, side: KycDocSideDb, label: string, row: KycDocumentRow | undefined): KYCDocument {
  return {
    id: `${type}_${side}`,
    type,
    side,
    label,
    status: row?.status ?? 'not_uploaded',
    uploadedAt: row?.uploaded_at ?? undefined,
    imageUri: undefined,
  };
}

// Shared by both the library-picker upload and the in-app camera capture
// (selfie-camera.tsx) — takes a local file URI already selected/captured by
// the caller and does the storage upload + row upsert.
async function uploadKycFile(userId: string, uri: string, type: KycDocTypeDb, side: KycDocSideDb): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const path = `${userId}/${type}_${side}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from('kyc-documents').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { error: upsertError } = await supabase.from('kyc_documents').upsert(
    {
      user_id: userId,
      type,
      side,
      label: REQUIRED_DOCS.find((d) => d.type === type && d.side === side)?.label,
      status: 'uploaded',
      storage_path: path,
      uploaded_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,type,side' }
  );
  if (upsertError) throw upsertError;

  return path;
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
      return REQUIRED_DOCS.map(({ type, side, label }) => mapDoc(type, side, label, findDoc(rows, type, side)));
    },
    enabled: !!userId,
  });
}

export function useUploadKycDocument() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, side }: { type: KycDocTypeDb; side: KycDocSideDb }) => {
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

      return uploadKycFile(userId as string, result.assets[0].uri, type, side);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kyc-documents', userId] });
    },
  });
}

// For a photo already captured in-app (the selfie camera screen) rather
// than picked from the library.
export function useUploadKycPhoto() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri, type, side }: { uri: string; type: KycDocTypeDb; side: KycDocSideDb }) => {
      return uploadKycFile(userId as string, uri, type, side);
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
  side: KycDocSideDb;
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
        side: row.side,
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
      void queryClient.invalidateQueries({ queryKey: ['admin-user-kyc-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
    },
  });
}

export interface AdminKycDocument {
  docId: string | null;
  type: KycDocTypeDb;
  side: KycDocSideDb;
  label: string;
  status: KycStatusDb;
  uploadedAt: string | null;
  rejectionReason: string | null;
  imageUrl: string | null;
}

export function useUserKycDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-user-kyc-documents', userId],
    queryFn: async (): Promise<AdminKycDocument[]> => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId as string);
      if (error) throw error;
      const rows = data as KycDocumentRow[];

      return Promise.all(
        REQUIRED_DOCS.map(async ({ type, side, label }) => {
          const row = findDoc(rows, type, side);
          let imageUrl: string | null = null;
          if (row?.storage_path) {
            const { data: signed } = await supabase.storage
              .from('kyc-documents')
              .createSignedUrl(row.storage_path, 60 * 10);
            imageUrl = signed?.signedUrl ?? null;
          }
          return {
            docId: row?.id ?? null,
            type,
            side,
            label,
            status: row?.status ?? 'not_uploaded',
            uploadedAt: row?.uploaded_at ?? null,
            rejectionReason: row?.rejection_reason ?? null,
            imageUrl,
          };
        })
      );
    },
    enabled: !!userId,
  });
}
