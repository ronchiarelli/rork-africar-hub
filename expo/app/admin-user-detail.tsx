import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Phone, Mail, Calendar, ShieldCheck, ShieldX, UserX, UserCheck, X, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import {
  useAdminUserDetail,
  useSetUserSuspended,
  useRevokeRole,
} from '@/lib/queries/admin';
import { useUserKycDocuments, useReviewKycDocument } from '@/lib/queries/kyc';
import { getErrorMessage } from '@/lib/errors';

const ROLE_COLORS: Record<string, string> = {
  customer: Colors.info,
  fleet_owner: Colors.purple.medium,
  dealership: Colors.orange.primary,
  admin: Colors.error,
};

const DOC_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  not_uploaded: { bg: Colors.gray[200], text: Colors.gray[600], label: 'Not Uploaded' },
  uploaded: { bg: Colors.warning + '20', text: Colors.warning, label: 'Pending Review' },
  verified: { bg: Colors.success + '20', text: Colors.success, label: 'Verified' },
  rejected: { bg: Colors.error + '20', text: Colors.error, label: 'Rejected' },
};

export default function AdminUserDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user, isLoading } = useAdminUserDetail(id);
  const { data: docs = [] } = useUserKycDocuments(id);
  const reviewDoc = useReviewKycDocument();
  const setSuspended = useSetUserSuspended();
  const revokeRole = useRevokeRole();
  const [preview, setPreview] = useState<{ uri: string; label: string } | null>(null);

  const handleReview = (docId: string, decision: 'verified' | 'rejected') => {
    reviewDoc.mutate(
      { docId, decision },
      { onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update this document.')) }
    );
  };

  const handleRevokeDoc = (docId: string) => {
    Alert.alert('Revoke Verification', 'This will mark the document as rejected and may re-block this user from booking or listing.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => handleReview(docId, 'rejected'),
      },
    ]);
  };

  const handleRevokeRole = () => {
    if (!user) return;
    Alert.alert('Revoke Role', `Demote ${user.name} from ${user.role.replace('_', ' ')} back to customer?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => {
          revokeRole.mutate(user.id, {
            onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not revoke this role.')),
          });
        },
      },
    ]);
  };

  const handleToggleSuspend = () => {
    if (!user) return;
    const action = user.isSuspended ? 'reactivate' : 'suspend';
    Alert.alert(
      user.isSuspended ? 'Reactivate Account' : 'Suspend Account',
      `Are you sure you want to ${action} this account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.isSuspended ? 'Reactivate' : 'Suspend',
          style: user.isSuspended ? 'default' : 'destructive',
          onPress: () => {
            setSuspended.mutate(
              { userId: user.id, suspended: !user.isSuspended },
              { onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Could not update this account.')) }
            );
          },
        },
      ]
    );
  };

  if (isLoading || !user) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Colors.orange.primary} />
      </View>
    );
  }

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.metaRow}>
          <Mail size={14} color={Colors.gray[500]} />
          <Text style={styles.metaText}>{user.email}</Text>
        </View>
        {!!user.phone && (
          <View style={styles.metaRow}>
            <Phone size={14} color={Colors.gray[500]} />
            <Text style={styles.metaText}>{user.phone}</Text>
          </View>
        )}
        {!!user.whatsapp && (
          <View style={styles.metaRow}>
            <MessageCircle size={14} color={Colors.gray[500]} />
            <Text style={styles.metaText}>{user.whatsapp} (WhatsApp)</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Calendar size={14} color={Colors.gray[500]} />
          <Text style={styles.metaText}>Member since {user.memberSince?.split('T')[0]}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[user.role] ?? Colors.gray[500]) + '20' }]}>
            <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[user.role] ?? Colors.gray[500] }]}>{user.role.replace('_', ' ')}</Text>
          </View>
          {user.isSuspended && (
            <View style={[styles.roleBadge, { backgroundColor: Colors.error + '20' }]}>
              <Text style={[styles.roleBadgeText, { color: Colors.error }]}>Suspended</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionBtn, user.isSuspended ? styles.reactivateBtn : styles.suspendBtn]} onPress={handleToggleSuspend} testID="user-detail-suspend">
          {user.isSuspended ? <UserCheck size={16} color={Colors.white} /> : <UserX size={16} color={Colors.white} />}
          <Text style={styles.actionBtnText}>{user.isSuspended ? 'Reactivate' : 'Suspend'}</Text>
        </Pressable>
        {(user.role === 'fleet_owner' || user.role === 'dealership') && (
          <Pressable style={[styles.actionBtn, styles.revokeRoleBtn]} onPress={handleRevokeRole} testID="user-detail-revoke-role">
            <ShieldX size={16} color={Colors.white} />
            <Text style={styles.actionBtnText}>Revoke Role</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionTitle}>KYC Documents</Text>
      {docs.map((doc) => {
        const config = DOC_STATUS_CONFIG[doc.status];
        return (
          <View key={doc.type + doc.side} style={styles.docCard}>
            {doc.imageUrl ? (
              <Pressable onPress={() => setPreview({ uri: doc.imageUrl as string, label: doc.label })} testID={`preview-${doc.type}-${doc.side}`}>
                <Image source={{ uri: doc.imageUrl }} style={styles.docThumb} contentFit="cover" />
              </Pressable>
            ) : (
              <View style={styles.docThumbPlaceholder} />
            )}
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>{doc.label}</Text>
              <View style={[styles.docStatusBadge, { backgroundColor: config.bg }]}>
                <Text style={[styles.docStatusText, { color: config.text }]}>{config.label}</Text>
              </View>
              {!!doc.rejectionReason && <Text style={styles.docRejectionReason}>Reason: {doc.rejectionReason}</Text>}
              {doc.status === 'uploaded' && doc.docId && (
                <View style={styles.docActionsRow}>
                  <Pressable style={styles.docApproveBtn} onPress={() => handleReview(doc.docId as string, 'verified')} testID={`doc-approve-${doc.type}-${doc.side}`}>
                    <ShieldCheck size={14} color={Colors.white} />
                    <Text style={styles.docActionText}>Approve</Text>
                  </Pressable>
                  <Pressable style={styles.docRejectBtn} onPress={() => handleReview(doc.docId as string, 'rejected')} testID={`doc-reject-${doc.type}-${doc.side}`}>
                    <ShieldX size={14} color={Colors.white} />
                    <Text style={styles.docActionText}>Reject</Text>
                  </Pressable>
                </View>
              )}
              {doc.status === 'verified' && doc.docId && (
                <Pressable style={styles.docRevokeBtn} onPress={() => handleRevokeDoc(doc.docId as string)} testID={`doc-revoke-${doc.type}-${doc.side}`}>
                  <Text style={styles.docRevokeText}>Revoke Verification</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>

    <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
      <View style={styles.previewOverlay}>
        <Pressable style={[styles.previewClose, { top: insets.top + 16 }]} onPress={() => setPreview(null)} testID="preview-close">
          <X size={22} color={Colors.white} />
        </Pressable>
        {preview && (
          <>
            <Text style={styles.previewLabel}>{preview.label}</Text>
            <Image source={{ uri: preview.uri }} style={styles.previewImage} contentFit="contain" />
          </>
        )}
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  loadingWrap: { flex: 1, backgroundColor: Colors.gray[50], alignItems: 'center' as const, justifyContent: 'center' as const },
  content: { padding: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center' as const,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: { width: 72, height: 72, borderRadius: 24, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '800' as const, color: Colors.gray[900] },
  metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 6 },
  metaText: { fontSize: 13, color: Colors.gray[600] },
  badgeRow: { flexDirection: 'row' as const, gap: 8, marginTop: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: '700' as const, textTransform: 'capitalize' as const },
  actionsRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  suspendBtn: { backgroundColor: Colors.error },
  reactivateBtn: { backgroundColor: Colors.success },
  revokeRoleBtn: { backgroundColor: Colors.gray[700] },
  actionBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' as const },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.gray[900], marginBottom: 12 },
  docCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docThumb: { width: 90, height: 90 },
  docThumbPlaceholder: { width: 90, height: 90, backgroundColor: Colors.gray[100] },
  docInfo: { flex: 1, padding: 12 },
  docLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.gray[900] },
  docStatusBadge: { alignSelf: 'flex-start' as const, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  docStatusText: { fontSize: 10, fontWeight: '700' as const },
  docRejectionReason: { fontSize: 11, color: Colors.error, marginTop: 4 },
  docActionsRow: { flexDirection: 'row' as const, gap: 8, marginTop: 8 },
  docApproveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docRejectBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docActionText: { color: Colors.white, fontSize: 11, fontWeight: '700' as const },
  docRevokeBtn: { marginTop: 8, alignSelf: 'flex-start' as const },
  docRevokeText: { color: Colors.error, fontSize: 12, fontWeight: '700' as const, textDecorationLine: 'underline' as const },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  previewClose: {
    position: 'absolute' as const,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  previewLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '75%',
  },
});
