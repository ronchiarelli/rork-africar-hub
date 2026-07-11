import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, Camera, ScanFace } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useKycDocuments, pickKycLibraryPhoto } from '@/lib/queries/kyc';
import { useMarkNotificationsReadByType } from '@/lib/queries/notifications';
import { getErrorMessage } from '@/lib/errors';
import type { KycDocTypeDb, KycDocSideDb } from '@/types/database';
import type { KYCDocument } from '@/types/car';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  not_uploaded: { icon: <Upload size={18} color={Colors.gray[400]} />, color: Colors.gray[400], label: 'Not Uploaded' },
  uploaded: { icon: <Clock size={18} color={Colors.warning} />, color: Colors.warning, label: 'Under Review' },
  verified: { icon: <CheckCircle2 size={18} color={Colors.success} />, color: Colors.success, label: 'Verified' },
  rejected: { icon: <XCircle size={18} color={Colors.error} />, color: Colors.error, label: 'Rejected' },
};

const STATUS_RANK: Record<string, number> = { verified: 3, uploaded: 2, rejected: 1, not_uploaded: 0 };

function worstStatus(...statuses: string[]): string {
  return statuses.reduce((worst, s) => (STATUS_RANK[s] < STATUS_RANK[worst] ? s : worst));
}

function bestStatus(...statuses: string[]): string {
  return statuses.reduce((best, s) => (STATUS_RANK[s] > STATUS_RANK[best] ? s : best));
}

function DocCard({
  doc,
  onUpload,
  onOpenCamera,
  isSelfie,
}: {
  doc: KYCDocument;
  onUpload: (type: KycDocTypeDb, side: KycDocSideDb) => void;
  onOpenCamera?: () => void;
  isSelfie?: boolean;
}) {
  const config = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.not_uploaded;
  const showFacePlaceholder = isSelfie && doc.status === 'not_uploaded';
  return (
    <View style={styles.docCard}>
      <View style={styles.docCardRow}>
        <View style={styles.docLeft}>
          <View style={[styles.docIconWrap, { backgroundColor: config.color + '15' }, showFacePlaceholder && styles.faceIconWrap]}>
            {showFacePlaceholder ? <ScanFace size={22} color={Colors.orange.primary} /> : config.icon}
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docLabel}>{doc.label}</Text>
            <Text style={[styles.docStatus, { color: config.color }]}>{config.label}</Text>
            {doc.uploadedAt && <Text style={styles.docDate}>Uploaded: {doc.uploadedAt}</Text>}
            {showFacePlaceholder && <Text style={styles.faceHint}>Center your face in a well-lit photo</Text>}
          </View>
        </View>
        {(doc.status === 'not_uploaded' || doc.status === 'rejected') && (
          <Pressable
            style={styles.uploadBtn}
            onPress={() => (isSelfie && onOpenCamera ? onOpenCamera() : void onUpload(doc.type, doc.side))}
            testID={`upload-${doc.id}`}
          >
            <Camera size={16} color={Colors.white} />
            <Text style={styles.uploadBtnText}>{isSelfie ? 'Take Selfie' : 'Upload'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function KYCVerificationScreen() {
  const router = useRouter();
  const { data: documents = [] } = useKycDocuments();
  const markKycNotificationsRead = useMarkNotificationsReadByType('kyc');

  useEffect(() => {
    markKycNotificationsRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = useCallback(async (type: KycDocTypeDb, side: KycDocSideDb) => {
    try {
      const uri = await pickKycLibraryPhoto();
      if (!uri) return; // user cancelled
      router.push({ pathname: '/crop-image', params: { uri, type, side } });
    } catch (err) {
      Alert.alert('Could Not Open Photos', getErrorMessage(err, 'Please try again.'));
    }
  }, [router]);

  const ghanaCardFront = documents.find((d) => d.type === 'ghana_card' && d.side === 'front');
  const ghanaCardBack = documents.find((d) => d.type === 'ghana_card' && d.side === 'back');
  const passport = documents.find((d) => d.type === 'passport');
  const licenseFront = documents.find((d) => d.type === 'drivers_license' && d.side === 'front');
  const licenseBack = documents.find((d) => d.type === 'drivers_license' && d.side === 'back');
  const selfie = documents.find((d) => d.type === 'selfie');

  const identityStatus = useMemo(() => {
    if (!ghanaCardFront || !ghanaCardBack || !passport) return 'not_uploaded';
    const ghanaCardStatus = worstStatus(ghanaCardFront.status, ghanaCardBack.status);
    return bestStatus(ghanaCardStatus, passport.status);
  }, [ghanaCardFront, ghanaCardBack, passport]);

  const licenseStatus = useMemo(() => {
    if (!licenseFront || !licenseBack) return 'not_uploaded';
    return worstStatus(licenseFront.status, licenseBack.status);
  }, [licenseFront, licenseBack]);

  const requiredGroupStatuses = [identityStatus, licenseStatus, selfie?.status ?? 'not_uploaded'];
  const completedCount = requiredGroupStatuses.filter((s) => s === 'verified').length;
  const progress = documents.length === 0 ? 0 : (completedCount / requiredGroupStatuses.length) * 100;

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
          <Text style={styles.progressText}>{completedCount} of {requiredGroupStatuses.length} requirements verified</Text>
        </View>

        <Text style={styles.sectionTitle}>Identity Document</Text>
        <Text style={styles.sectionSubtitle}>Provide both sides of your National ID, or your Passport</Text>
        {ghanaCardFront && <DocCard doc={ghanaCardFront} onUpload={handleUpload} />}
        {ghanaCardBack && <DocCard doc={ghanaCardBack} onUpload={handleUpload} />}
        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>
        {passport && <DocCard doc={passport} onUpload={handleUpload} />}

        <Text style={styles.sectionTitle}>Driver's License</Text>
        <Text style={styles.sectionSubtitle}>Both sides are required</Text>
        {licenseFront && <DocCard doc={licenseFront} onUpload={handleUpload} />}
        {licenseBack && <DocCard doc={licenseBack} onUpload={handleUpload} />}

        <Text style={styles.sectionTitle}>Selfie Verification</Text>
        {selfie && (
          <DocCard
            doc={selfie}
            onUpload={handleUpload}
            onOpenCamera={() => router.push('/selfie-camera')}
            isSelfie
          />
        )}

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
    marginBottom: 4,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.gray[500],
    marginBottom: 12,
  },
  orDivider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginVertical: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[200],
  },
  orText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gray[400],
  },
  docCard: {
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
  docCardRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
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
  faceIconWrap: {
    borderWidth: 2,
    borderColor: Colors.orange.primary,
    borderStyle: 'dashed' as const,
    borderRadius: 21,
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
  faceHint: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 2,
    fontStyle: 'italic' as const,
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
