import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mockKYCDocuments } from '@/mocks/cars';
import { KYCDocument } from '@/types/car';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  not_uploaded: { icon: <Upload size={18} color={Colors.gray[400]} />, color: Colors.gray[400], label: 'Not Uploaded' },
  uploaded: { icon: <Clock size={18} color={Colors.warning} />, color: Colors.warning, label: 'Under Review' },
  verified: { icon: <CheckCircle2 size={18} color={Colors.success} />, color: Colors.success, label: 'Verified' },
  rejected: { icon: <XCircle size={18} color={Colors.error} />, color: Colors.error, label: 'Rejected' },
};

export default function KYCVerificationScreen() {
  const [documents, setDocuments] = useState<KYCDocument[]>(mockKYCDocuments);

  const handleUpload = useCallback((docId: string) => {
    Alert.alert('Upload Document', 'This would open camera or gallery to upload the document.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Simulate Upload',
        onPress: () => {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId ? { ...d, status: 'uploaded', uploadedAt: new Date().toISOString().split('T')[0] } : d
            )
          );
        },
      },
    ]);
  }, []);

  const completedCount = documents.filter((d) => d.status === 'verified').length;
  const progress = (completedCount / documents.length) * 100;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <ShieldCheck size={24} color={Colors.orange.primary} />
            <Text style={styles.progressTitle}>Verification Progress</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount} of {documents.length} documents verified</Text>
        </View>

        <Text style={styles.sectionTitle}>Required Documents</Text>

        {documents.map((doc) => {
          const config = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.not_uploaded;
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docLeft}>
                <View style={[styles.docIconWrap, { backgroundColor: config.color + '15' }]}>
                  {config.icon}
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docLabel}>{doc.label}</Text>
                  <Text style={[styles.docStatus, { color: config.color }]}>{config.label}</Text>
                  {doc.uploadedAt && <Text style={styles.docDate}>Uploaded: {doc.uploadedAt}</Text>}
                </View>
              </View>
              {(doc.status === 'not_uploaded' || doc.status === 'rejected') && (
                <Pressable
                  style={styles.uploadBtn}
                  onPress={() => handleUpload(doc.id)}
                  testID={`upload-${doc.id}`}
                >
                  <Camera size={16} color={Colors.white} />
                  <Text style={styles.uploadBtnText}>Upload</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why verify your identity?</Text>
          <Text style={styles.infoText}>
            Verification helps us ensure the safety of all users. Complete your KYC to unlock car rentals and get verified badges on your profile.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.gray[900],
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 14,
  },
  docCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  docIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  docInfo: {
    flex: 1,
  },
  docLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.gray[900],
  },
  docStatus: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  docDate: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 1,
  },
  uploadBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.orange.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: Colors.purple.faint,
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.purple.deep,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.purple.dark,
    lineHeight: 20,
  },
});
