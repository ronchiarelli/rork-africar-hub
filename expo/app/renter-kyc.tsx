import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getNavBarClearance } from '@/components/BottomNavBar';
import { useUserKycDocuments } from '@/lib/queries/kyc';

const DOC_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  not_uploaded: { bg: Colors.gray[200], text: Colors.gray[600], label: 'Not Uploaded' },
  uploaded: { bg: Colors.warning + '20', text: Colors.warning, label: 'Pending Admin Review' },
  verified: { bg: Colors.success + '20', text: Colors.success, label: 'Verified' },
  rejected: { bg: Colors.error + '20', text: Colors.error, label: 'Rejected' },
};

export default function RenterKycScreen() {
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { data: docs = [], isLoading } = useUserKycDocuments(userId);
  const [preview, setPreview] = useState<{ uri: string; label: string } | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Colors.orange.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getNavBarClearance(insets.bottom) }]}>
        <Text style={styles.intro}>
          Identity documents submitted by {name || 'this requester'}. Documents are reviewed and verified by GoCar Hub admins.
        </Text>
        {docs.map((doc) => {
          const config = DOC_STATUS_CONFIG[doc.status];
          return (
            <View key={doc.type + doc.side} style={styles.docCard}>
              {doc.imageUrl ? (
                <Pressable onPress={() => setPreview({ uri: doc.imageUrl as string, label: doc.label })} testID={`renter-kyc-preview-${doc.type}-${doc.side}`}>
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
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.previewOverlay}>
          <Pressable style={[styles.previewClose, { top: insets.top + 16 }]} onPress={() => setPreview(null)} testID="renter-kyc-preview-close">
            <X size={22} color={Colors.white} />
          </Pressable>
          {preview && (
            <>
              <Text style={styles.previewLabel}>{preview.label}</Text>
              <Image
                source={{ uri: preview.uri }}
                style={{ width: winWidth * 0.9, height: winHeight * 0.65 }}
                contentFit="contain"
                testID="renter-kyc-preview-image"
              />
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
  intro: { fontSize: 13, color: Colors.gray[600], marginBottom: 16, lineHeight: 19 },
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
  docInfo: { flex: 1, padding: 12, justifyContent: 'center' as const },
  docLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.gray[900] },
  docStatusBadge: { alignSelf: 'flex-start' as const, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  docStatusText: { fontSize: 10, fontWeight: '700' as const },
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
});
